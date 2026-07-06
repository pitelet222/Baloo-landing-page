"use client";

import { useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { analysisSchema, type Ingredient, type Nutrition } from "@/lib/schema";
import { UrlForm } from "@/components/UrlForm";
import { LoadingState } from "@/components/LoadingState";
import { ResultsView } from "@/components/ResultsView";
import { EmailCapture } from "@/components/EmailCapture";
import { RetailerRow } from "@/components/RetailerRow";
import { HowItWorks } from "@/components/HowItWorks";
import { Board } from "@/components/Board";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { Wordmark } from "@/components/Wordmark";
import { Footer } from "@/components/Footer";

const FRIENDLY_ERROR =
  "We couldn't read that page. Try a direct product link from Whole Foods, Ocado, Tesco, Target, or Kroger.";

type Phase = "idle" | "reading" | "analyzing" | "done" | "error";
type Header = {
  product_name: string;
  retailer: string;
  url: string;
  count: number;
  nutrition?: Nutrition;
  key?: string;
  product_summary?: string;
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [header, setHeader] = useState<Header | null>(null);
  const [cached, setCached] = useState<Ingredient[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { object, submit, isLoading, error } = useObject({
    api: "/api/analyze",
    schema: analysisSchema,
  });

  async function handleAnalyze(url: string) {
    setHeader(null);
    setCached(null);
    setErrorMsg(null);
    setPhase("reading");

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        if (data.error === "missing_keys") {
          setErrorMsg("The analyser isn't configured yet — add API keys to .env.local.");
        } else {
          setErrorMsg(FRIENDLY_ERROR);
        }
        setPhase("error");
        return;
      }

      if (data.cached) {
        setHeader({
          product_name: data.product_name,
          retailer: data.retailer,
          url: data.url,
          count: data.ingredients.length,
          nutrition: data.nutrition,
          key: data.key,
          product_summary: data.product_summary,
        });
        setCached(data.ingredients);
        setPhase("done");
        return;
      }

      setHeader({
        product_name: data.product_name,
        retailer: data.retailer,
        url: data.url,
        count: data.ingredients_list.length,
        nutrition: data.nutrition,
        key: data.key,
      });
      setPhase("analyzing");
      submit({
        product_name: data.product_name,
        retailer: data.retailer,
        ingredients_list: data.ingredients_list,
        percentages: data.percentages,
        nutrition: data.nutrition,
        key: data.key,
        url: data.url,
      });
    } catch {
      setErrorMsg(FRIENDLY_ERROR);
      setPhase("error");
    }
  }

  const streamed = (object?.ingredients ?? []) as Partial<Ingredient>[];
  const ingredients = cached ?? streamed;
  const idle = phase === "idle";
  const busy = phase === "reading" || (phase === "analyzing" && isLoading);
  const analysing = phase === "analyzing" && isLoading;
  const streamError = Boolean(error) && phase === "analyzing";
  const hasHeader = Boolean(header) && !errorMsg && !streamError;
  const showResults = hasHeader && (ingredients.length > 0 || analysing);
  const showEmail = hasHeader && ingredients.length > 0 && !analysing;

  return (
    <div className="relative min-h-screen">
      {/* Soft top wash — warmth without color, fades to canvas. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] bg-[radial-gradient(60%_100%_at_50%_0%,theme(colors.natural.soft)_0%,transparent_72%)] opacity-70"
      />

      <main className="mx-auto flex min-h-screen max-w-tool flex-col px-5">
        <header className="relative flex items-center justify-center pt-8 sm:pt-10">
          <Wordmark className="text-xl" />
          {/* Renders nothing until Supabase is configured (Order G2). */}
          <div className="absolute right-0">
            <AccountMenu />
          </div>
        </header>

        <section className={`text-center ${idle ? "pt-14 sm:pt-20" : "pt-8"}`}>
          {idle && (
            <>
              <h1 className="font-display text-4xl leading-[1.1] text-ink sm:text-5xl">
                Know what&apos;s in your food.
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-lg text-muted">
                Paste a supermarket product link and see what every ingredient is — and why
                it&apos;s there.
              </p>
            </>
          )}

          <div className={idle ? "mt-9" : ""}>
            <UrlForm onAnalyze={handleAnalyze} busy={busy} />
          </div>

          {idle && (
            <>
              <RetailerRow />
              <p className="mt-4 text-xs text-muted/70">
                Free &middot; No sign-up &middot; Reads the actual product label
              </p>
            </>
          )}
        </section>

        {idle && <HowItWorks />}
        {idle && <Board />}

        {phase === "reading" && <LoadingState phase="reading" />}

        {(errorMsg || streamError) && (
          <div className="mt-12 rounded-2xl border border-line bg-paper p-6 text-center shadow-card animate-fade-in">
            <p className="text-ink">{errorMsg ?? FRIENDLY_ERROR}</p>
            <p className="mt-1 text-sm text-muted">Paste another link above to try again.</p>
          </div>
        )}

        {showResults && (
          <ResultsView
            productName={header!.product_name}
            retailer={header!.retailer}
            sourceUrl={header!.url}
            count={header!.count}
            ingredients={ingredients}
            nutrition={header!.nutrition}
            cacheKey={header!.key}
            productSummary={header!.product_summary ?? (object?.product_summary as string | undefined)}
            loading={analysing}
          />
        )}

        {showEmail && <EmailCapture />}

        <Footer />
      </main>
    </div>
  );
}
