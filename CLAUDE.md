# LawnFix — Project Summary

*Last updated: 30 April 2026*

---

## Origin

Sibling project to PoolScan (`app.poolscan`). Same stack, same no-login philosophy, same affiliate model. LawnFix targets the gap left by Sunday (US subscription-only) and Scotts My Lawn (shallow, brand-captured) — a free, instant, photo-first lawn diagnosis tool with no account required.

---

## Product: LawnFix

A **Progressive Web App (PWA)** that helps homeowners diagnose and fix lawn problems — targeted at mobile users standing in their garden.

**Live at:** `lawnfix.app`

### Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| Lawn photo scan | ⏳ In progress | Photo → AI diagnosis via Claude Vision |
| Fix plan | ⏳ In progress | Diagnosis → step-by-step repair instructions |
| Progress tracking | ⏳ Planned | Photo timeline stored in localStorage |
| Location-aware advice | ⏳ Planned | Climate zone detection for seasonal guidance |
| Grass type identification | ⏳ Planned | Auto-detect from photo |
| Offline support | ⏳ Planned | PWA service worker |
| No login required | ✅ Design | localStorage for saved diagnoses |
| Metric + imperial | ⏳ Planned | Product amounts in g/oz etc. |
| Amazon affiliate links | ⏳ Planned | UK/US/AU — same 3-region model as PoolScan |

### What the Diagnosis Covers

Drought stress, nitrogen deficiency, moss, fungal disease, compaction, shade damage, grub damage, bare patches, weed encroachment.

---

## Technical Stack

- **Framework:** Next.js 14 (App Router, `output: 'export'` — fully static)
- **Hosting:** Cloudflare Pages (free tier)
- **Edge functions:** Cloudflare Pages Functions (`functions/api/scan.ts`)
- **AI (lawn diagnosis):** Claude Vision API — model pinned to `claude-sonnet-4-6`
- **Storage:** `localStorage` with `lf:` namespace keys
- **PWA:** `@ducanh2912/next-pwa` (disabled in dev)
- **Styling:** Tailwind CSS with custom lawn colour palette (`lawn-*`)
- **Testing:** Vitest with `vite-tsconfig-paths` — run with `npm test` in `app/`
- **Repo:** Private GitHub → auto-deploy to Cloudflare Pages

---

## Repository Structure

```
app.lawnfix/
├── app/                          # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # Root layout — icons, metadata, manifest link
│   │   │   ├── globals.css
│   │   │   └── page.tsx          # Home page — 3-step flow
│   │   └── lib/
│   │       ├── storage.ts        # localStorage helpers (lf: namespace)
│   │       └── __tests__/        # Vitest tests
│   ├── functions/
│   │   └── api/scan.ts           # Cloudflare Pages Function — Claude Vision proxy
│   └── public/
│       ├── manifest.json         # PWA manifest
│       ├── _headers              # Cloudflare CSP + security headers
│       └── icons/
│           ├── lawnfix-logo.svg      # Inline logo (magnifying glass, green, vertical waves)
│           └── lawnfix-app-icon.svg  # App icon variant (rounded square bg)
├── vitest.config.ts
└── CLAUDE.md
```

---

## Key Architecture Decisions

### localStorage keys (`lf:` namespace)
| Key | Value |
|-----|-------|
| `lf:diagnosis` | `Diagnosis` JSON |
| `lf:diagnosis_date` | ISO date string |
| `lf:history` | `HistoryEntry[]` JSON |

### Diagnosis structure
`Diagnosis` contains an `issues` array (each with `id`, `label`, `severity`, `steps`) plus a `summary` string, optional `grassType`, and optional `season`. Sanitised server-side in `scan.ts` before returning to client.

### Multi-photo scan
Primary image: close-up of problem area. Optional context image: wider shot of full lawn + surroundings. Claude uses both when provided to distinguish e.g. shade damage (visible trees) from drought stress.

### Claude Vision (scan.ts)
- Model pinned: `claude-sonnet-4-6` (update intentionally after testing)
- API version pinned: `2023-06-01`
- `max_tokens: 1024` (larger than PoolScan — diagnosis JSON is richer)
- `sanitizeDiagnosis()` validates structure and sanitizes all string fields (HTML strip, control chars, length caps)
- `sanitizeIssue()` replaces `isValidIssue()` — returns `Issue | null` and sanitizes strings rather than just type-checking them
- Optional `location` and `grassType` hints in request body — sanitized via `sanitizeHint()` before prompt interpolation

### Security — AI endpoint (reviewed April 2026)

`functions/api/scan.ts` was audited and hardened in April 2026. Prior state and fixes:

| Issue | Severity | Status |
|---|---|---|
| `location` / `grassType` interpolated raw into Claude prompt | HIGH | **Fixed** — `sanitizeHint()` strips newlines + control chars, caps at 100 chars |
| All output string fields returned verbatim from `sanitizeDiagnosis()` | HIGH | **Fixed** — `safeStr()` strips HTML, strips control chars, caps per-field lengths |
| No anti-injection instruction in prompt | MEDIUM | **Fixed** — both prompt paths now include explicit disregard instruction |
| No server-side request authentication | MEDIUM | Unresolved — CORS blocks browser cross-origin only; `curl` / server-to-server calls bypass it |

**When building `/scan`, `/fix`, `/history` pages:** render all diagnosis strings (`summary`, `issue.label`, `issue.steps[]`, `grassType`, `season`) as React text content — never `innerHTML` or `dangerouslySetInnerHTML`.

**Consistent security baseline across both apps (established April 2026):**
- No user-supplied text reaches the Claude prompt (LawnFix: sanitized to server hint strings; PoolScan label.ts: whitelist + validated numbers only; PoolScan scan.ts: image-only)
- Anti-injection instruction in every Claude prompt
- All string output from Claude sanitized before returning to client
- Numeric output coerced to typed values (`number | null`) where possible — eliminates string injection entirely

---

## Colour Palette

`lawn-*` Tailwind custom scale (green):

| Token | Hex |
|-------|-----|
| `lawn-50` | `#f0fdf4` |
| `lawn-100` | `#dcfce7` |
| `lawn-600` | `#16a34a` |
| `lawn-700` | `#15803d` |

Theme colour: `#15803d` — used in manifest, viewport, and status bar.

---

## Brand & Domain

**Domain:** `lawnfix.app`
**Sister app:** `poolscan.app`

Logo: magnifying glass with three vertical wavy lines (grass stripes), forest green palette.

---

## Local Repo Path

```
~/github/jiros/app.lawnfix
```

---

## Costs

| Item | Cost |
|------|------|
| Cloudflare Pages, Workers, CDN, HTTPS | £0 |
| GitHub private repo | £0 |
| Domain (`lawnfix.app`) | ~£12/year |
| Claude API (photo scan) | ~$0.003–0.006/photo |

---

## Roadmap

```
Phase 1  Lawn diagnosis PWA — IN PROGRESS
Phase 2  Progress tracking + photo timeline
Phase 3  Location-aware seasonal calendar
Phase 4  Affiliate product links (seed, fertiliser, tools)
```

## Differentiation vs Competition

| Competitor | Gap we fill |
|---|---|
| Sunday | US-only, subscription, no photo diagnosis |
| Scotts My Lawn | Weak diagnosis, Scotts brand funnel only |
| TruGreen | Professional service portal — not a tool |

**Positioning:** Free, instant, no account, photo-first diagnosis. Best tool for "something is wrong with my lawn *right now*".
