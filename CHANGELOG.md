# BNDR v3.4 changelog and audit record

Release date: July 19, 2026  
Baseline: supplied, tested `bndr-v3.3.zip`

The requested comparison named v3.2, but v3.2 was not supplied. This release was compared file-for-file against the attached v3.3 archive.

## Footer

- Replaced the placeholder wordmark/link/clock footer on all ten public footer-bearing pages. `dashboard.html` remains footer-free; `404.html` remains unchanged and footer-free.
- Added the supplied BNDR LLC logo as a local, optimized 60 KB PNG so the footer and owner gate do not wait on an external image host.
- Added code-owned inline SVG presets and official brand treatments:
  - LinkedIn `#0A66C2`
  - GitHub inverse mark for a dark background
  - Instagram multicolor gradient
  - Facebook `#0866FF`
  - Substack `#FF6719`
  - Buy Me a Coffee `#FFDD00`
  - Gumroad `#FF90E8`
  - PromptBase brand gradient
- Added disabled presets for X/Twitter, YouTube, TikTok, Discord, Etsy, Patreon, Threads, and Dribbble.
- Every active platform link uses an HTTPS destination, an accessible label, `target="_blank"`, and `rel="noopener noreferrer"`.
- Added 48 px desktop and 44 px mobile touch targets. Mobile uses an orderly four-by-two grid for the default icons, with a two-column fallback at extremely narrow widths.
- Added a circular glass treatment with a restrained specular sweep on fine-pointer hover, a low-frequency mobile ambient sweep, and an immediate touch glint.
- Preserved PHX time, safe-area/mobile-navigation clearance, legal links, and a discreet **◇ Owner** console link.
- Added a complete reduced-motion stop for the new animation through the site's existing reduced-motion rule.

## Privacy Policy and Terms

- Added `privacy.html` with one H1, logical H2/H3 structure, current effective date, correct metadata, canonical, Open Graph fields, main navigation, and finished footer.
- Documented only behavior present in the source: Google `gtag.js`, the GA lead event, FormSubmit relay, hosted payment links, public session storage, console local/session storage, signed operator access, and the absence of public user accounts.
- Added `terms.html` with matching structure and metadata covering site use, estimates, scope, payments, ownership, licensing, acceptable use, third parties, warranties, liability, indemnity, termination, Arizona law, and Maricopa County venue.
- Both pages route privacy or terms questions through the existing contact flow. Neither page publishes an email address.

## Dashboard and content schema

- Added optional `footer.social` data to `window.BNDR_CONTENT` for all 16 platform presets.
- Kept SVG paths, brand colors, logo, layout, legal links, and glass behavior in code rather than editable content.
- Added hardcoded public defaults. A completely unmodified original `content.js` renders the exact eight required defaults in the required order.
- Added a **Footer** pane built into the existing autosave, preview, draft backup, and `content.js` export flow.
- Added enable/disable switches, URL fields, and up/down order controls for every preset.
- Added Privacy and Terms to the dashboard preview selector. Existing sitemap and SEO-generation behavior was left unchanged as requested.

## Owner and temporary professional access

- Added a discreet public route to the existing owner console through the footer.
- Preserved the owner passphrase gate, session behavior, editing, preview, backup/restore, and export controls.
- Added native WebCrypto ECDSA P-256 temporary access links with a random nonce, signed payload, expiry check, and selected work areas.
- Added 1-hour, 8-hour, 24-hour, 3-day, 7-day, and 30-day lifetimes.
- The private signing key stays in the owner's browser local storage; only the public JWK is exported to `content.js`.
- Access codes live in the URL fragment. The fragment is removed immediately after successful verification and is not sent to the host or Google Analytics.
- Temporary operators see only assigned panes. Owner passphrase, access-key, backup/restore, draft-discard, and logout controls are not built into their view.
- Regenerating and deploying the public key revokes all links signed by the earlier key.
- The console and operator guide state the honest static-site boundary: pane scope is for a trusted professional and is not a server-side authorization system.

## Email exposure and form integrity

- Removed the owner email property from the home-page JSON-LD while leaving the remaining schema intact.
- Removed the obfuscated address from the estimate page's `noscript` block.
- Confirmed no raw email address or `mailto:` appears in any static HTML file.
- Preserved the runtime owner-address assembly, FormSubmit AJAX endpoint logic, one-tap failure fallback, hidden honeypot, four-second timing trap, payload, success message, and lead event.

## Performance and compatibility

- No framework, package, build step, icon font, or external social-icon request was added.
- Social marks are inline; the supplied footer logo is local and lazy-loaded.
- Public runtime growth is approximately 6.9 KB after normal gzip compression (about 5.0 KB JavaScript and 1.9 KB CSS). The 60 KB local logo is lazy-loaded at the footer. New component CSS is scoped and adds no dashboard footer styling.
- All new styles use component or `body.dash` scopes. No new bare-element selector was introduced.
- The public footer uses standard HTML, CSS custom properties, inline SVG, and defensive URL checks. Unsupported or unsafe platform URLs do not render.

## Audit results

Final automated browser pass: **PASS**.

- Rendered 12 routes at 1440×1000 and 390×844: 24 route renders total.
- Checked home, sites, apps, photos, blog, a real post, builder, estimate, privacy, terms, 404, and dashboard.
- Zero page exceptions, console errors, or horizontal overflow.
- Every rendered route has exactly one H1. The new legal pages use ordered H1/H2/H3 hierarchy.
- Reported and preserved four pre-existing semantic skips as required: dynamically generated card/step headings on Sites, Apps, Photos, and Estimate use H3 after H1 before a page-level H2. These were not introduced or restyled by this release.
- All internal links resolved during the pass.
- Public pages rendered eight enabled social icons with eight distinct brand treatments, correct labels/security attributes, no overlaps, and touch targets at or above 44 px.
- Footer logo, Privacy, Terms, PHX clock, and Owner link rendered at desktop and mobile widths.
- Desktop glass hover, mobile ambient/tap glint, reduced-motion shutdown, and desktop orb grab/drag/throw passed.
- `dashboard.html` rendered no public footer and showed all 16 footer presets after owner login.
- Footer reorder controls passed.
- Round trip passed: changed LinkedIn URL, disabled GitHub, enabled X, exported through the real Publish control, reloaded the public site with that export, and observed all changes.
- Backward-compatibility passed: the unmodified original `content.js` rendered the exact eight defaults in order.
- Temporary access passed: generated and deployed a key in the test browser, created a signed 24-hour Blog + Footer link, opened it in a separate browser session, cleared the URL fragment, and exposed only those two panes.
- Estimate form passed: a honeypot-filled submission made no request; a valid timed submission made exactly one relayed request and showed success.
- JavaScript syntax checks passed for `content.js`, `site.js`, and `dashboard.js`.
- ZIP structure and extraction checks passed before delivery.

## Files changed

- `index.html` — finished footer host; JSON-LD email removal.
- `sites.html`, `apps.html`, `photos.html`, `blog.html`, `post.html`, `builder.html` — finished footer host only.
- `estimate.html` — finished footer host; static `noscript` email removal.
- `dashboard.html` — temporary-access gate, Footer pane, local logo.
- `css/bndr.css` — scoped footer, legal-page, footer-admin, operator-access, and owner-logo styling.
- `js/content.js` — optional operator public key and footer/social defaults.
- `js/site.js` — code-owned social preset library, footer renderer, glass/touch behavior, and old-content fallback.
- `js/dashboard.js` — footer editor/export integration and signed temporary access.
- `README.md` — complete non-technical owner and maintenance guide.

## Files added

- `assets/bndr-logo.png`
- `privacy.html`
- `terms.html`
- `CHANGELOG.md`

## Confirmed unchanged

- `404.html`
- `js/md.js`
- `js/facts.js`

Existing orb physics, drag hint, tactile FX layer, page copy, galleries, purchase flow, blog rendering, facts injection, SEO generator, and public navigation were preserved unless named above.
