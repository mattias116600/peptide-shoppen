<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep storefront navigation, search, and the session-only cart in the root StoreProvider layout so browsing between routes preserves cart state without pretending orders are persisted.
- The live catalogue and blog come from SQLite (`src/server/catalog.server.ts`) and are edited in /admin. `src/lib/products.ts` and `src/lib/articles.ts` are only the starting content, copied in once by `src/server/seed.server.ts`; never read them directly in storefront pages. The root route loads the catalogue and `useCatalog()` exposes it; articles load per route. No verified batch claims until documentation is supplied.
- Define storefront visual styles and semantic color tokens in src/styles.css so shared routes remain visually consistent.
- Keep the calculator limited to laboratory mass concentration, with validation and arithmetic in a tested browser-safe module; it must not calculate human or animal doses.
- Keep editorial article content in a shared browser-safe module and render individual articles as typed dynamic routes so links and metadata stay consistent.

- Keep one consolidated storefront stylesheet instead of accumulating redesign override layers, so all pages share a predictable visual system.

- Keep storefront-wide facts such as delivery terms and the support contact in the shared browser-safe product module, and render them through one component, so every surface shows the same value.

- Self-hosted VPS builds use `npm run build:vps` (NITRO_PRESET=node-server, output .output/); deploy files live in deploy/. Why: editor builds stay on the default target while the VPS runs plain Node behind Nginx.
- Import storefront images as local files from src/assets and serve fonts from public/fonts; do not reference Lovable asset pointers at runtime. Why: the VPS deployment must contain all presentation assets and work without external media hosting.

- Orders, discount codes and admin accounts live in SQLite through `node:sqlite` (Node 22.13+) in `src/server/*.server.ts`; schema is `src/server/schema.sql`, shared with the admin CLI. Why: the user self-hosts on a VPS and declines Lovable Cloud, and `node:sqlite` needs no native add-ons.
- Server functions live in `src/lib/shop-api.ts`. Every admin function calls `requireAdmin()` itself; the `/admin` route guard is only for navigation. Order totals and discounts are always recomputed on the server from the catalogue.
- Admin accounts are created only with `scripts/admin.mjs` on the server; never add a public sign-up or first-run setup page.
- Shared order and discount rules (statuses, `evaluateDiscount`, pricing) stay browser-safe in `src/lib/commerce.ts` so checkout, admin pages and server agree.
- Payments go through NOWPayments (`src/server/nowpayments.server.ts`): checkout creates a hosted invoice in SEK and redirects to it; `/api/nowpayments/ipn` accepts only HMAC-signed callbacks and applies them via `recordPaymentUpdate`, which checks invoice id, currency and total before marking an order paid. Without `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET` and `PUBLIC_SITE_URL`, checkout stores orders for manual payment.
- The customer return page `/kassa/tack` shows an order only with its random `public_token`; never look orders up by order number alone on public pages.
- Images are stored as keys, never build URLs: `bundled:<name>` for images in src/assets (mapped in `src/lib/media.ts`) or `/media/<file>` for admin uploads in `data/uploads`, served by `src/routes/media/$file.ts`. Uploads go through `/api/admin/upload`, which requires an admin session and checks the file's bytes.
- If the database cannot be opened, storefront reads fall back to the starting content so pages still render.
- Customer emails go through `src/server/order-emails.server.ts`: each kind is sent at most once (timestamps on the order) unless resent from /admin, and every attempt is logged in the order history. Templates are in `src/server/email-templates.server.ts` and must escape every customer-supplied value. Without `MAIL_FROM` + SMTP settings nothing is sent and checkout must not promise an email.
- Every page builds its head with `seoHead()` from `src/lib/seo.ts` (title within ~60 characters, absolute canonical, Open Graph/Twitter tags, share image, JSON-LD); the root route only holds site-wide defaults. Private pages pass `noindex`. `/sitemap.xml` is generated from the database in `src/server/sitemap.server.ts`; add new indexable static pages to `staticSitemapPages` there. Icons are drawn by `scripts/generate-icons.mjs`.
