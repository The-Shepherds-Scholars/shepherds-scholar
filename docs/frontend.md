# Frontend (`frontend/`)

The website: a React app written in TypeScript and built with Vite. Cloudflare Workers serves the
built files. All data comes from the backend API; the site has no database access of its own.

**Run it locally:** `npm install` once, then `npm run dev` and open http://localhost:5173.
**Build it:** `npm run build` writes the finished site to `dist/`.

## How a page loads

1. The browser loads `index.html`, which loads `src/main.tsx`.
2. `main.tsx` sets up TanStack Query (for API data) and renders `App.tsx`.
3. `App.tsx` maps each address (`/mass`, `/miracles`, …) to a page component.
4. Every page is wrapped in `AppShell`, which draws the nav bar and footer and sets the page's
   colors.
5. Pages that need data call the API through `src/lib/api.ts`, using `VITE_API_URL`.

## Configuration files

| File | What it does | Why |
|---|---|---|
| `package.json` | Lists dependencies and the scripts `dev`, `build`, `preview`, `typecheck` | `npm run build` checks types first, so a type error stops a broken deploy |
| `package-lock.json` | Records the exact version of every installed package | Everyone, and Cloudflare, installs the same versions |
| `index.html` | The single HTML page: title, description, Google Fonts, and the `<div id="root">` React draws into | Vite starts from this file |
| `vite.config.ts` | Turns on the React plugin; dev server on port 5173 | 5173 is the address the backend's CORS setting expects |
| `tsconfig.json` | TypeScript settings: strict mode on, no output (Vite does the building) | Strict mode catches more mistakes |
| `wrangler.jsonc` | Cloudflare config: serve `dist/` as static files; unknown paths return `index.html` | Without that fallback, opening `/about` directly would show a 404 |
| `.env` (not in git) | Your local `VITE_API_URL` and `VITE_FORMSPREE_ID` | Keeps local settings out of the repo |
| `.env.example` | The same settings with safe defaults | Copy to `.env` on first setup |
| `.prettierrc` | Single quotes, lines up to 110 characters | Consistent formatting on save |
| `.gitignore` | Ignores `node_modules/` and `dist/` | Both are rebuilt from the source |

## `src/`: entry points

| File | What it does | Why |
|---|---|---|
| `main.tsx` | Starts React; creates the TanStack Query client (1 retry, no refetch on tab focus); loads global CSS | One place for app-wide setup |
| `App.tsx` | The route table: which page shows at which address | Matches the route table in the blueprint and the numbered wireframes |
| `vite-env.d.ts` | Tells TypeScript which `VITE_` settings exist | So `import.meta.env.VITE_API_URL` is type-checked |
| `theme.ts` | Each page's color palette, named after a saint (for example St. Michael's night blue on `/angels`), and `themeFor(path)` | Keeps every page's colors in one file |

## `src/lib/`

| File | What it does | Why |
|---|---|---|
| `api.ts` | `apiGet(path)` calls `${VITE_API_URL}/api/v1${path}` and throws `ApiError` on a failed response | Every page calls the API the same way. Falls back to `http://localhost:8000` if `VITE_API_URL` is not set |

## `src/components/`: shared pieces

| File | What it does | Why |
|---|---|---|
| `AppShell.tsx` | Wraps every page: nav bar, page content, footer. Sets the page's theme as CSS variables (`--accent`, `--ground`, `--sdef-accent`) and scrolls to the top on page change | Pages don't repeat the layout or set colors themselves |
| `NavBar.tsx` + `NavBar.css` | Sticky top bar with the site name, a "Free, work in progress" badge, and a menu of every page | One menu shared by the whole site |
| `LiquidFill.tsx` | The nav bar's color change: the new color sweeps across with bubbles melting into its edge (an SVG "goo" filter) | Carried over from the design prototype. Bubbles use a fixed seed, so they look the same each time |
| `ScholarDefinition.tsx` + `.css` | Highlighted words that show a short definition on hover, focus, or tap, with "Learn more" and a source link | Explains Catholic terms in place. Adapted from Quantum Lab's `QuantumDefinition`; adds tap support for phones, Escape to close, and reduced motion |
| `Skeleton.tsx` + `.css` | A grey loading placeholder that only appears if loading takes longer than 300 ms | Fast pages don't flash a placeholder |
| `PageStub.tsx` | Placeholder for pages not built yet, naming the wireframe to build from | Every menu link works while pages are still in progress |

## `src/pages/`: one file per screen

| File | Address | What it does | Status |
|---|---|---|---|
| `Home.tsx` | `/` | Headline, links to explore the site, and today's readings | Built |
| `TodayReadingsCard.tsx` | (on Home) | Fetches `/readings/today` and lists the references, with a link to USCCB | Built. The pattern for every data-backed card: TanStack Query, a skeleton while loading, a friendly message on error |
| `Mass.tsx` | `/mass` | A beginner's guide to Mass | Built (wireframe 7) |
| `Miracles.tsx` | `/miracles` | Investigated miracles, each with its Church status and sources | Layout built from the design canvas; the miracle records are still placeholders like `[Name of the miracle]` |
| `Angels.tsx` | `/angels` | Angels and demons: what Scripture, the Church, and history say | Built; needs a priest's review before launch |
| `FaithPages.css` | | Shared layout for Miracles and Angels | |
| `Contact.tsx` | `/contact` | Contact form that posts to Formspree | Built (wireframe 12). Needs `VITE_FORMSPREE_ID` |
| `Sources.tsx` | `/sources` | Lists each Bible translation with its license and full citation, from `/translations` | Bible section built (required by API.Bible); the rest of wireframe 11 to build |
| `Stubs.tsx` | `/timeline`, `/events/:slug`, `/map`, `/readings`, `/search`, `/pathways/:slug`, `/about`, `/parish`, and the 404 page | Placeholders built with `PageStub` | To build |

## `src/features/scripture/`: showing Bible text

| File | What it does | Why |
|---|---|---|
| `PassageText.tsx` | Shows one passage from `/passages/{id}`: the reference, which book and Testament it is from, the text, the translation, any fallback note, and the copyright line | API.Bible requires the copyright line beside every passage it supplies. Not used on a page yet |
| `useFums.ts` | Reports an API.Bible passage view to FUMS, API.Bible's usage tracker | Required by API.Bible's terms. Douay-Rheims passages have no token, so nothing is sent |

## `src/data/` and `src/styles/`

| File | What it does | Why |
|---|---|---|
| `data/glossary.ts` | Every term `ScholarDefinition` can explain: definition, "Learn more" text, icon, source link | Add or edit terms here. Draft text: check against Church sources before launch |
| `styles/global.css` | Site-wide colors, fonts (Alegreya and Alegreya Sans), base sizes, buttons, cards | Shared look for every page |

## Deploying

Cloudflare builds from `main` on every push: root directory `frontend`, build command
`npm run build`, deploy command `npx wrangler deploy`. Set `VITE_API_URL` and `VITE_FORMSPREE_ID` as
**build** variables. They are written into the site at build time, so changing them needs a rebuild.
