// Reports (Order G9) — the trust-&-safety inbox. Anyone signed in can flag a comment or list;
// an admin actions them from /admin. Nothing here hides content on its own — reporting is a
// signal, moderation is the decision (see /api/moderation).

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../index";
import {
  comments,
  lists,
  profiles,
  reports,
  type Report,
  type ReportStatus,
  type ReportTargetType,
} from "../schema";

// Dedup: one OPEN report per reporter+target. A repeat is a no-op (returns the existing row) so a
// user can't inflate a queue by mashing the button.
export async function createReport(
  dbi: Db,
  input: { reporterId: string; targetType: ReportTargetType; targetId: string; reason: string },
): Promise<Report> {
  const [existing] = await dbi
    .select()
    .from(reports)
    .where(
      and(
        eq(reports.reporterId, input.reporterId),
        eq(reports.targetType, input.targetType),
        eq(reports.targetId, input.targetId),
        eq(reports.status, "open"),
      ),
    )
    .limit(1);
  if (existing) return existing;

  const [row] = await dbi
    .insert(reports)
    .values({
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
    })
    .returning();
  return row;
}

export type QueueReport = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  reporterHandle: string;
  createdAt: string;
  preview: string; // comment body / list title
  targetHref: string | null; // where to see it
  alreadyHidden: boolean;
};

// The moderator queue: open reports, newest first, hydrated with a target preview so the admin
// can decide without leaving the page.
export async function getOpenReports(dbi: Db, limit = 50): Promise<QueueReport[]> {
  const rows = await dbi
    .select({ report: reports, reporterHandle: profiles.handle })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.reporterId))
    .where(eq(reports.status, "open"))
    .orderBy(desc(reports.createdAt))
    .limit(limit);
  if (rows.length === 0) return [];

  const commentIds = rows.filter((r) => r.report.targetType === "comment").map((r) => r.report.targetId);
  const listIds = rows.filter((r) => r.report.targetType === "list").map((r) => r.report.targetId);
  const commentRows = commentIds.length
    ? await dbi
        .select({ id: comments.id, body: comments.body, productId: comments.productId, hiddenAt: comments.hiddenAt })
        .from(comments)
        .where(inArray(comments.id, commentIds))
    : [];
  const listRows = listIds.length
    ? await dbi
        .select({ id: lists.id, title: lists.title, slug: lists.slug, isPublic: lists.isPublic })
        .from(lists)
        .where(inArray(lists.id, listIds))
    : [];
  const commentMap = new Map(commentRows.map((c) => [c.id, c]));
  const listMap = new Map(listRows.map((l) => [l.id, l]));

  return rows.map(({ report, reporterHandle }) => {
    if (report.targetType === "comment") {
      const c = commentMap.get(report.targetId);
      return {
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        reporterHandle,
        createdAt: report.createdAt.toISOString(),
        preview: c ? c.body : "(comment deleted)",
        targetHref: null,
        alreadyHidden: !!c?.hiddenAt,
      };
    }
    const l = listMap.get(report.targetId);
    return {
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      reporterHandle,
      createdAt: report.createdAt.toISOString(),
      preview: l ? l.title : "(list deleted)",
      targetHref: l ? `/list/${l.slug}` : null,
      alreadyHidden: l ? !l.isPublic : false,
    };
  });
}

export async function setReportStatus(dbi: Db, id: string, status: ReportStatus): Promise<void> {
  await dbi.update(reports).set({ status }).where(eq(reports.id, id));
}

// Bulk-close every open report on a target once it's been actioned/reviewed.
export async function resolveReportsForTarget(
  dbi: Db,
  targetType: ReportTargetType,
  targetId: string,
  status: ReportStatus,
): Promise<void> {
  await dbi
    .update(reports)
    .set({ status })
    .where(
      and(
        eq(reports.targetType, targetType),
        eq(reports.targetId, targetId),
        eq(reports.status, "open"),
      ),
    );
}

// A tiny convenience for the queue's badge counts (not critical, kept for the admin nav later).
export async function getOpenReportCount(dbi: Db): Promise<number> {
  const [row] = await dbi
    .select({ n: sql<number>`count(*)::int` })
    .from(reports)
    .where(eq(reports.status, "open"));
  return row?.n ?? 0;
}
