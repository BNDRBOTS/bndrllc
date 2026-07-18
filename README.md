# BNDR MAIN — v2 build

Same site. Same soul. Split into clean parts, hardened everywhere, and now it answers back.

## File map

```
bndr-site/
├─ index.html        — markup, meta, GA, JSON-LD. All copy lives here as static HTML (SEO-safe).
├─ dashboard.html    — your owner console. Edit copy, preview, export. (Keep it off search: it's noindex'd.)
├─ css/
│  ├─ main.css       — the v1 stylesheet, extracted verbatim. Untouched = no regressions.
│  └─ extras.css     — footer + cursor styles (extracted) plus every v2 addition.
└─ js/
   ├─ content.js     — single source of truth for editable copy (hero, facts, gallery, pricing, mission, FAQ).
   ├─ scene.js       — the Three.js glass cube, wrapped in a hard fail-safe.
   ├─ app.js         — router, modals, gallery, and all v2 features.
   └─ cursor.js      — the custom crosshair cursor (desktop only), extracted verbatim.
```

## Run it

Any static host (GitHub Pages, Netlify, Cloudflare Pages, S3). No build step. No dependencies to install.
Locally: open `index.html`, or `npx serve` from this folder.

## The dashboard flow

1. Open `dashboard.html` (locally or on your host — it's noindexed and does nothing destructive).
2. Edit copy: hero, proof numbers, gallery projects (add/remove), pricing, mission, FAQ.
3. **Save draft** — stores in your browser only, and the built-in preview reloads with your changes (`index.html?draft=1`). The public site is never affected by drafts.
4. Happy? **Export content.js**, replace `js/content.js`, redeploy. That's the whole pipeline.

Notes:
- Dashboard edits are plain text (plus `<br>` in the pricing lead). Source links on proof cards are fixed in the page on purpose — citation integrity.
- Factory `content.js` matches the static HTML exactly, so if it ever fails to load, the site renders identically from HTML alone.

## Fail-safe matrix

| Failure | What happens instead |
|---|---|
| Three.js CDN down / WebGL crash / blocked | Hero swaps to a pure-CSS plasma orb. Site fully usable. |
| JavaScript disabled or broken | `<noscript>` + a CSS timer force the page visible. All content is static HTML. |
| Logo or banner image fails | Logo swaps to a styled BNDR™ wordmark; banner hides cleanly. |
| `localStorage` blocked | Drafts/sound prefs silently skip — no errors. |
| Contact form iframe fails | Visible direct-email fallback right in the modal. |
| Hover preview site won't embed | Dock reports it and the card still opens the full modal / new tab. |
| `prefers-reduced-motion` | WebGL skipped, counters jump to final values, orb holds still. |

## Verified numbers (all cross-checked, primary sources)

- **50 ms** visual-appeal judgment — Lindgaard et al., *Behaviour & IT* 25(2), 2006. https://doi.org/10.1080/01449290500330448
- **46.1%** judged credibility by design — Fogg et al., Stanford Web Credibility Project. https://dl.acm.org/doi/10.1145/997078.997097
- **53%** mobile abandonment >3s — Google, *The Need for Mobile Speed*. https://support.google.com/adsense/answer/7450973
- **2s** expected load (1 in 2 users) — Google via ARF. https://thearf.org/category/news-you-can-use/many-visitors-abandon-mobile-sites-if-load-time-tops-3-seconds-via-mediapost-source-google/
- **+8.4%** retail conversion per 0.1s — Deloitte × Google, *Milliseconds Make Millions*. https://web.dev/case-studies/milliseconds-make-millions
- **88%** trust known recommenders — Nielsen, *Trust in Advertising* 2021. https://www.nielsen.com/insights/2021/beyond-martech-building-trust-with-consumers-and-engaging-where-sentiment-is-high/
- **1 in 4** U.S. adults with a disability — CDC. https://www.cdc.gov/disability-and-health/articles-documents/disability-impacts-all-of-us-infographic.html
- Design appeal drives trust/rejection — Sillence et al., CHI 2004. https://dl.acm.org/doi/10.1145/985692.985776

All v1 facts (halo effect, Akamai 7%/1s, DataReportal 96%, Stanford motion study, Liferay 2026) are preserved untouched.

## What's new in v2 (quick list)

- Persistent brand mark, top-left, every route. It stays.
- Proof strip on Home: six cited stats with count-up animation.
- Gallery: category filter chips + live hover preview dock (desktop).
- Mission page: rebuilt — the business is the vehicle; QuickResets is the destination.
- Subtle audio feedback (footer SND toggle, remembered, off-able).
- Live PHX clock in the footer.
- Modal focus trap, form fallback, image fallbacks, WebGL fallback, JS-dead fallback.
- Fixed: "Striaghtforward" typo; Three.js poller that never gave up.
