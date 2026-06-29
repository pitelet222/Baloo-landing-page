"use client";

import { useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { analysisSchema, type Ingredient } from "@/lib/schema";
import { UrlForm } from "@/components/UrlForm";
import { LoadingState } from "@/components/LoadingState";
import { ResultsView } from "@/components/ResultsView";
import { EmailCapture } from "@/components/EmailCapture";
import { RetailerRow } from "@/components/RetailerRow";

const FRIENDLY_ERROR =
  "We couldn't read that page. Try a direct product link from Whole Foods, Ocado, Tesco, Target, or Kroger.";

type Phase = "idle" | "reading" | "analyzing" | "done" | "error";
type Header = { product_name: string; retailer: string; url: string; count: number };

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
      });
      setPhase("analyzing");
      submit({
        product_name: data.product_name,
        retailer: data.retailer,
        ingredients_list: data.ingredients_list,
        percentages: data.percentages,
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
  const busy = phase === "reading" || (phase === "analyzing" && isLoading);
  const streamError = error && phase === "analyzing";
  const showResults = header && ingredients.length > 0 && !streamError;
  const showEmail = phase === "done" || (cached === null && !isLoading && ingredients.length > 0);

  return (
    <main className="mx-auto min-h-screen max-w-tool px-5 py-16 sm:py-24">
      <header className="mb-10">
        <span className="font-display text-xl font-semibold tracking-tight text-ink">Baloo</span>
      </header>

      <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
        Know what&apos;s in your food.
      </h1>
      <p className="mt-3 text-muted">
        Paste a supermarket product link and see what every ingredient is — and why it&apos;s there.
      </p>

      <div className="mt-8">
        <UrlForm onAnalyze={handleAnalyze} busy={busy} />
        {phase === "idle" && <RetailerRow />}
      </div>

      {phase === "reading" && <LoadingState phase="reading" />}
      {phase === "analyzing" && ingredients.length === 0 && !streamError && (
        <LoadingState phase="analyzing" />
      )}

      {(errorMsg || streamError) && (
        <div className="mt-10 rounded-xl border border-line bg-paper p-6 text-center">
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
        />
      )}

      {showResults && showEmail && <EmailCapture />}
    </main>
  );
}
