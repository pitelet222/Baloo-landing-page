# Email setup (S3) — custom SMTP + domain authentication

> **Why this is beta-blocking.** Supabase's built-in email sender is **development-only and heavily
> rate-limited** — Supabase say outright not to use it in production. Launch without this and
> confirmation emails simply stop arriving: people sign up, never get the link, and never come back.
> The failure is silent, which is what makes it dangerous.
>
> **Owner: M** (dashboard + DNS). Nothing here can be done from the codebase — it's an account, an
> API key, a dashboard form and DNS records. The one code-side piece is already done (see §5).

**Split of duties:** **Resend** sends *transactional* mail (confirm email, password reset).
**Loops** stays for *marketing* (the existing email capture). Don't merge them — different
deliverability reputations, different unsubscribe obligations.

---

## 1 · Create the Resend account and add the domain

1. Sign up at [resend.com](https://resend.com) with a Baloo address you'll keep (not a personal one).
2. **Domains → Add Domain →** `baloo.life`.
   - Prefer sending from a **subdomain** — e.g. `send.baloo.life` or `mail.baloo.life`. If the
     sending domain's reputation ever gets damaged, the root domain (and anything else you send from
     it) is insulated.
3. Resend then shows the exact DNS records to add. **Add them verbatim** — don't hand-type them.

## 2 · DNS records (at whoever hosts baloo.life's DNS)

Resend gives you the precise values for the first two; the third you author yourself.

| Record | Purpose |
|---|---|
| **SPF** (`TXT`) | Says which servers may send as your domain. Resend supplies the exact `v=spf1 …` string. |
| **DKIM** (`TXT`, usually `resend._domainkey…`) | Cryptographically signs each message so receivers can verify it wasn't forged or altered. Resend supplies the key. |
| **DMARC** (`TXT` at `_dmarc.baloo.life`) | Tells receivers what to do when SPF/DKIM fail, and where to send reports. **You write this one.** |

**Start DMARC in monitor mode**, then tighten once reports look clean:

```
v=DMARC1; p=none; rua=mailto:dmarc@baloo.life
```

Progression: `p=none` (monitor, ~1–2 weeks) → `p=quarantine` → `p=reject`. Going straight to
`reject` before you've read the reports is how legitimate mail gets silently binned.

> **Gmail/Yahoo bulk-sender rules require SPF + DKIM + DMARC.** This isn't optional hygiene any more —
> without all three, bulk mail to Gmail/Yahoo addresses gets rejected or junked.

Wait for Resend to show the domain as **Verified** before continuing. DNS can take minutes to hours.

## 3 · Create the API key

Resend → **API Keys → Create**, scoped to **sending only**. Copy it once — you can't view it again.
This key *is* the SMTP password in the next step. Treat it as a secret: never commit it, never paste
it into the repo, never put it in a `NEXT_PUBLIC_*` variable.

## 4 · Point Supabase Auth at Resend

Supabase dashboard → **Project Settings → Authentication → SMTP Settings → Enable Custom SMTP**:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` (SSL). Use `587` (STARTTLS) if 465 is blocked. |
| Username | `resend` (the literal word) |
| Password | your Resend API key from §3 |
| Sender email | e.g. `hello@send.baloo.life` — must be on the **verified** domain |
| Sender name | `Baloo` |

Then raise **Authentication → Rate Limits → email sent per hour**. Supabase keeps this deliberately
tiny while you're on the built-in mailer; with real SMTP it's a launch bottleneck if you forget.

## 5 · URL configuration — required for the confirmation links to work

Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL** → `https://baloo.life` (the production origin — *not* localhost).
- **Redirect URLs** → allowlist every origin that signs people up:
  - `https://baloo.life/auth/callback`
  - `https://*.vercel.app/auth/callback` (preview deploys)
  - `http://localhost:3000/auth/callback` (local dev)

**The code side is already done:** `AuthModal` passes
`emailRedirectTo: ${window.location.origin}/auth/callback` on both signup and the guest→account
upgrade, so a confirmation link always returns to the origin the person actually signed up on and
lands on the route that exchanges the PKCE code for a session. Without those allowlist entries,
Supabase rejects the redirect and the link fails — so §5 and the code change only work together.

## 6 · Email templates

**Authentication → Email Templates.** The defaults are functional but generic. Match Baloo's voice —
calm, plain, no marketing tone — for at least *Confirm signup* and *Reset password*. Keep the
`{{ .ConfirmationURL }}` token intact.

## 7 · Verify it end to end

1. Sign up on production with a **real address you control** (and once with a Gmail address).
2. The email arrives **within seconds**, from your Baloo sender, **not** in spam.
3. In Gmail: **Show original** → `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`.
4. Click the link → you land back on baloo.life **signed in** (not on localhost, not on an error).
5. Resend → **Logs**: the send is recorded as delivered.
6. Repeat once from a **preview deploy** to confirm the allowlist wildcard works.

## 8 · Related, not covered here

- **S7 — unsubscribe + account deletion.** One-click unsubscribe is legally required for bulk mail
  (GDPR + the Gmail/Yahoo rules), and there is still **no delete-account flow**. Separate order.
- **N2 — email notifications.** Blocked on this order. When it lands, default to **digest-only** —
  per-event email is how you train people to mute you, and it contradicts the calm brand.
- **No password-reset UI exists yet.** `AuthModal` offers sign in / sign up / upgrade but no "forgot
  password", so the reset template above has nothing to trigger it. Worth adding before launch —
  small, and the alternative is emailing people manually.
