# BNDR — site v3

Static, dependency-free, deploys anywhere (Cloudflare Pages, Netlify, GitHub Pages, any bucket). No build step. No framework. Every page loads its content from `js/content.js` and renders it client-side through the markdown engine.

## File map

```
index.html        Home — hero, verified numbers, sections, pricing, FAQ, contact
sites.html        Website showcase — category chips, live iframe previews, immersive mode
apps.html         App gallery — category chips, run-in-modal previews, purchase flow
photos.html       Photo gallery — category chips, lightbox, license/purchase flow
blog.html         Blog index
post.html         Post renderer (post.html?p=slug) — SEO meta rewrite + JSON-LD + fact injection
builder.html      The Builder — Scott's build board (shipped / in motion / up next)
dashboard.html    Owner console (noindex)
css/bndr.css      The entire design system — tokens, vibes, components
js/content.js     SINGLE SOURCE OF TRUTH — every editable word on the site
js/md.js          Markdown engine (XSS-safe, escape-first)
js/facts.js       Verified-facts registry + relevance matcher (the SEO layer)
js/site.js        Public site engine — hydration, vibes, modals, purchase, blog, JSON-LD
js/dashboard.js   Owner console — editors, live preview, autosave, publish pipeline
```

## Owner console

Open `dashboard.html`. Default passphrase: **`bndr-owner-2026`** — change it in **Settings** before you deploy.

- Every field autosaves to a local draft (~0.7s after you stop typing).
- Markdown fields render a live preview beside the editor; the same engine renders the live site, so the preview is exact.
- The preview pane loads the real site with your draft overlaid (`?draft=1`). Switch pages and widths (1440 / 390) from the preview bar.
- **Publish → export content.js** downloads a fresh `content.js`. Replace `js/content.js` with it and redeploy — that's the whole pipeline.

**Honest caveat:** the gate is a client-side passphrase (SHA-256, session-scoped). It keeps casual visitors out; it is not server-grade security — the console page and content are still static files. For real privacy put `dashboard.html` behind Cloudflare Access or HTTP basic auth at the host level. Nothing sensitive lives in the console anyway: it edits public site copy.

## The verified-facts layer (AI-assisted SEO)

`js/facts.js` holds a **closed registry** of statistics, each with a primary source URL (Google/Basel research, Stanford credibility studies, Akamai, Amazon, CDC, WHO, etc.). At render time the matcher scores each blog post against the registry and injects the top matches as cited callouts — with links to the primary source.

By design the system **cannot invent a citation**: if nothing in the registry clears the relevance bar, nothing is injected. To add a fact, edit `js/facts.js` by hand and verify the source yourself first. The SEO pane in the console shows the full registry and audits exactly what will inject per post.

## SEO architecture

- Per-page titles, descriptions, canonicals, Open Graph, geo meta.
- JSON-LD: `ProfessionalService` (home), `Person` (builder), `BlogPosting` (each post, generated at render).
- Post pages rewrite title/description/canonical/OG from post data.
- **SEO pane in the console** generates `sitemap.xml`, `rss.xml`, and `robots.txt` from current content — download and drop them next to `index.html` when you deploy.

## Purchases

Every photo and app has an optional `paymentLink` (Stripe Payment Link, PayPal, Gumroad — any URL). With a link, buyers get a **Checkout →** button; without one, the purchase sheet falls back to a prefilled email (`[BNDR PHOTO] …` / `[BNDR APP] …`). Set links per item in the console → Galleries.

## The vibe system

Each gallery category carries a vibe (`plasma`, `magenta`, `cyan`, `amber`, `violet`). Filtering to a category re-tunes the page — accent color, tint, and card geometry shift — while the bone/void/ink identity holds. Vibes are assigned per category in the console → Galleries.

## Performance notes

- Zero JS dependencies; ~4 small scripts, all cache-friendly.
- Fonts preconnected; logo `fetchpriority=high`; gallery images lazy via CSS background on visible cards.
- Site iframes lazy-load on scroll (desktop only — phones get a designed cover, not a janky thumbnail).
- All animation respects `prefers-reduced-motion`.
