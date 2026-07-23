// Social share targets (Order L2) — the growth loop. Pure URL builders, no DOM, so the encoding is
// checkable without a browser. Each platform takes the link (and where supported a bit of text) as
// query params; we never post on the user's behalf, we just open their composer.

export type ShareTarget = { id: string; label: string; href: string };

export function shareTargets({ url, text }: { url: string; text: string }): ShareTarget[] {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  return [
    // WhatsApp takes one combined text field, so the link rides at the end of the message.
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { id: "x", label: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    // Facebook's sharer only accepts the URL; it pulls the title/description from our OG tags.
    { id: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  ];
}
