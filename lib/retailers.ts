import { SUPPORTED_RETAILERS } from "./config";

export type UrlCheck = { ok: true } | { ok: false; reason: string };

// Client-side validation before any API call: must be http(s) and a recognised retailer.
export function validateUrl(raw: string): UrlCheck {
  const value = raw.trim();
  if (!value) return { ok: false, reason: "Paste a product link to get started." };

  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return { ok: false, reason: "That doesn't look like a full link. Include https://" };
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, reason: "Links need to start with http:// or https://" };
  }

  if (!detectRetailer(value)) {
    return {
      ok: false,
      reason: "Try a product link from Whole Foods, Ocado, Tesco, Target, or Kroger.",
    };
  }

  return { ok: true };
}

// Returns the retailer name for a URL, or null if it isn't one we support.
export function detectRetailer(url: string): string | null {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const r of SUPPORTED_RETAILERS) {
    if (r.match.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
      return r.name;
    }
  }
  return null;
}

// Used by the API route as a server-side guard.
export function isSupportedUrl(url: string): boolean {
  return detectRetailer(url) !== null;
}
