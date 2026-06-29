// Thin wrapper over Firecrawl's /v2/scrape REST endpoint.
// Using REST directly avoids tying the build to a specific Firecrawl SDK version.
// Returns clean markdown of the fully-rendered page, or null on failure.

export async function scrapeMarkdown(url: string): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!res.ok) {
      console.error("Firecrawl scrape failed:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    // v2 returns { success, data: { markdown, ... } }; be tolerant of shape changes.
    const markdown: string | undefined = data?.data?.markdown ?? data?.markdown;
    return markdown && markdown.trim().length > 0 ? markdown : null;
  } catch (err) {
    console.error("Firecrawl scrape error:", err);
    return null;
  }
}
