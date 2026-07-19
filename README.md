# BNDR site v3.4 — owner guide

This is the complete BNDR website. It is plain HTML, CSS, and JavaScript. There is no build step, package manager, database, or server application.

## Publish the site

1. On a private computer, open `dashboard.html` and change the starter passphrase using the steps under **Open the owner console** below. Export the new `content.js` and replace `js/content.js` before the first upload.
2. Keep the website files together. Do not move files out of `css`, `js`, or `assets`.
3. Upload the website files to the web root of the hosting account. `README.md` and `CHANGELOG.md` are handoff records and do not need to be placed on the public host.
4. Open `index.html`, `estimate.html`, `privacy.html`, `terms.html`, and `dashboard.html` on the live HTTPS address.
5. Send one test estimate. FormSubmit sends a one-time activation message to the owner inbox after the first real submission. Open that message and approve the form once.

The site works on any normal static host. HTTPS is required for the strongest browser security and for temporary operator links.

## Files at a glance

| File | Purpose |
|---|---|
| `index.html` | Home page |
| `sites.html` | Website showcase |
| `apps.html` | App gallery |
| `photos.html` | Photo gallery |
| `blog.html` | Blog index |
| `post.html` | Individual post page; the post is selected by `?p=post-slug` |
| `builder.html` | Builder page |
| `estimate.html` | Estimate and contact flow |
| `privacy.html` | Privacy Policy |
| `terms.html` | Terms of Service |
| `404.html` | Not-found page |
| `dashboard.html` | Owner console; intentionally has no public footer |
| `js/content.js` | The single source of truth for owner-editable content |
| `js/site.js` | Public page behavior, footer presets, forms, galleries, and effects |
| `js/dashboard.js` | Owner console, autosave, preview, export, and temporary access |
| `js/md.js` | Safe Markdown rendering |
| `js/facts.js` | Hand-verified source registry used by blog posts |
| `css/bndr.css` | Site and dashboard styles |
| `assets/bndr-logo.png` | Local, optimized BNDR footer and console logo |
| `CHANGELOG.md` | Complete change and audit record for this release |

## Open the owner console

Open `dashboard.html` on the live site. The starter passphrase is:

`bndr-owner-2026`

Change it immediately:

1. Open **Settings**.
2. Enter a new passphrase of at least eight characters under **Owner passphrase**.
3. Select **Set new passphrase**.
4. Select **Publish → export content.js**.
5. Replace the live `js/content.js` with the downloaded file and redeploy it.
6. Log out and confirm the new passphrase works.

Use a long, unique passphrase. The console gate is stored in the static site as a one-way hash and keeps normal visitors out, but a static page cannot provide server-level access control. If the hosting service offers password protection, HTTP Basic Auth, or an identity gateway, protect `dashboard.html` there as well. Do not store secrets, card details, or private client records in the console.

The discreet **◇ Owner** link in every public footer opens the console.

## Edit and publish content

1. Make changes in any dashboard pane.
2. Changes autosave in that browser after a short pause.
3. Use **Preview** to view the real page with the unpublished draft at desktop or mobile width.
4. Select **Save draft** before leaving if you want an immediate save.
5. Select **Publish → export content.js** when ready.
6. Replace `js/content.js` on the host with the exported file.
7. Reload the public site and check the changed page.

Publishing downloads a file; it does not upload or deploy by itself. A draft stays only in the current browser until it is exported. Use **Settings → Download draft backup** before clearing browser data or moving to another computer. Use **Restore from backup** to load that JSON file later.

## Manage the footer

Open **Footer** in the dashboard.

- The eight live defaults are LinkedIn, GitHub, Instagram, Facebook, Substack, Buy Me a Coffee, Gumroad, and PromptBase.
- X/Twitter, YouTube, TikTok, Discord, Etsy, Patreon, Threads, and Dribbble are ready but off by default.
- Check a platform to show it, uncheck it to hide it, and enter its full `https://` address.
- Use the up and down arrows to change the order.
- An enabled platform with no valid web address stays hidden, preventing a dead link.

The logo, legal links, official SVG marks, brand colors, layout, and glass-shine effect are protected in code. They are not owner-editable. If an older `content.js` has no footer section, the site automatically renders the original eight defaults in the required order.

## Give a professional temporary access

Temporary access uses a signed, expiring link. The private signing key stays in the owner's browser. The public verification key is the only key placed in `content.js`. The link code sits after `#` in the address, so browsers do not send it to the web host or Google Analytics.

One-time setup:

1. Open **Settings → Temporary professional access**.
2. Select **Create access key**.
3. Publish the new `content.js`, replace the live file, and reload the console.

Create a link:

1. Choose a lifetime: 1 hour, 8 hours, 24 hours, 3 days, 7 days, or 30 days.
2. Check only the work areas the person needs.
3. Select **Generate expiring link**.
4. Copy the full private link and send it only to the intended person.
5. The professional opens the link. The console verifies it, removes the code from the visible address, and shows only the selected panes.

To revoke every unexpired link, select **Regenerate access key**, publish the replacement `content.js`, and deploy it. A single link cannot be revoked by itself before expiry.

Important operating details:

- The signing key belongs to one browser profile. Clearing its local storage or changing computers removes the private half. Regenerate and deploy a new key to continue.
- Temporary scope is a clean working view for a trusted professional. On a static site it is not a server-enforced permission wall. Host-level protection is the right choice when access itself must be confidential.
- Do not paste the private link into public chat, tickets, analytics fields, or page content.
- Closing the tab ends the current working session; the original link remains usable until its expiry unless the key is regenerated and deployed.

## Estimate form and owner contact

The site assembles the owner address at runtime from `js/content.js`; no email address is written in static HTML.

- The default empty endpoint sends through FormSubmit.
- The first real submission requires the one-time FormSubmit activation described in **Publish the site**.
- The honeypot and four-second timing check block simple automated spam.
- If FormSubmit does not answer, the visitor receives a one-tap email fallback with the entered details preserved.
- To use a different form service, open **Intake**, paste its full endpoint, publish `content.js`, and test it.

Do not add a raw email address or `mailto:` link directly to an HTML file. Use the existing contact flow.

## Google Analytics

Public pages currently use GA4 measurement ID `G-KY0GGGZZTG` through `gtag.js`.

To change the measurement ID, replace both appearances of `G-KY0GGGZZTG` in each public HTML page that contains the Google tag: home, sites, apps, photos, blog, post, builder, estimate, privacy, and terms. Do not add Analytics to `dashboard.html`.

The dashboard **Analytics** pane is a separate, read-only viewer for the owner. Its setup is shown inside that pane:

1. Enable the Google Analytics Data API and Analytics Admin API in the Google Cloud project used by the Analytics owner.
2. Create a **Web application** OAuth client.
3. Add the exact live site origin shown in the dashboard as an Authorized JavaScript origin. Add a local origin too only if it will actually be used.
4. Paste the public OAuth Client ID into the dashboard, publish `content.js`, and select **Connect Google Analytics**.
5. Sign in with the Google account that can view the GA4 property. The pane normally finds the property; it also offers a manual Property ID field.

The OAuth access token stays in that browser tab. It is not stored in `content.js`.

## Purchases

Gallery items can contain a hosted payment link. Stripe Payment Links and other full web URLs are supported. Payment happens on the provider's page; this site does not collect complete card details.

Add or change a link under **Galleries**, publish `content.js`, and test the checkout in a private browser window. If an item has no payment link, the site uses the existing contact fallback.

## Blog, facts, and search files

- Blog posts are edited in **Blog** and rendered by `post.html?p=slug`.
- `js/facts.js` is a closed, hand-verified source registry. The site can inject only facts already present there. Verify a primary source before adding a new fact by hand.
- The **SEO** pane can download `sitemap.xml`, `rss.xml`, and `robots.txt`. Put those files beside `index.html` when deploying them.
- The legal pages carry their own titles, descriptions, canonicals, and Open Graph data. The existing dashboard SEO generator remains otherwise unchanged.

## Legal-page upkeep

Review `privacy.html` and `terms.html` whenever the form service, analytics setup, payment provider, browser storage, business entity, location, or sales terms change. Update the **Last updated** date when the text changes. Keep privacy and terms linked in every public footer.

## Safe maintenance checklist

Before every deployment:

1. Back up the current live folder and the dashboard draft.
2. Replace only the files intentionally changed.
3. Test the home, estimate, privacy, terms, and dashboard pages on a phone and desktop browser.
4. Confirm the footer links, PHX clock, active social destinations, and hosted checkouts.
5. Send a test estimate and confirm delivery.
6. Check the browser console for errors.
7. Confirm the owner passphrase and any current temporary link work as expected.
8. Keep all motion usable with the device's **Reduce Motion** setting.

There are no generated dependencies to install and no build command to run.
