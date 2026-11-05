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
| `places.ts` | Place types, `useFeaturedPlaces()`, `usePlace(slug)`, and the label and glossary entry for each location confidence | |
| `readings.ts` | The readings data shape, `useReadings(date)`, and date helpers that use the visitor's own date | The API's "today" is UTC, which is already tomorrow on US evenings |
| `analytics.ts` | Counts page views and clicks on links, buttons, and glossary terms, sent in batches to `/api/v1/analytics`. Add `data-track="…"` to name a click clearly | No cookies, no IDs, never reads form fields; skips Do Not Track, Global Privacy Control, automated browsers, and local development (unless `VITE_ANALYTICS=on`) |
| `progress.ts` | Saves and reads guided pathway progress in the browser (`ss:pathway:<slug>`) | No accounts in v1; the Home page reads it to offer "Continue your pathway" |
| `api.ts` | `apiGet(path)` calls `${VITE_API_URL}/api/v1${path}` and throws `ApiError` on a failed response | Every page calls the API the same way. Falls back to `http://localhost:8000` if `VITE_API_URL` is not set |

## `src/components/`: shared pieces

| File | What it does | Why |
|---|---|---|
| `AppShell.tsx` | Wraps every page: nav bar, page content, footer. Sets the page's theme as CSS variables (`--accent`, `--ground`, `--sdef-accent`) and scrolls to the top on page change | Pages don't repeat the layout or set colors themselves |
| `NavBar.tsx` + `NavBar.css` | Sticky top bar with the site name, a "Free, work in progress" badge, and a menu of every page. The badge is hidden on screens 1024 px wide or less | One menu shared by the whole site. Hiding the badge on phones and tablets keeps the header uncluttered; the footer still says the site is a work in progress |
| `LiquidFill.tsx` | The nav bar's color change: the new color sweeps across with bubbles melting into its edge (an SVG "goo" filter) | Carried over from the design prototype. Bubbles use a fixed seed, so they look the same each time |
| `GlossaryText.tsx` | Finds glossary terms inside text from the API (Mass titles, reading sections) and adds their definitions | So text we don't write still gets definitions |
| `VideoEmbed.tsx` | A YouTube video shown as a card until the visitor presses play, then YouTube's privacy-enhanced player | Nothing loads from YouTube until someone chooses to watch |
| `ScholarDefinition.tsx` + `.css` | Highlighted words that show a short definition on hover, focus, or tap, with "Learn more" and a source link | Explains Catholic terms in place. Adapted from Quantum Lab's `QuantumDefinition`; adds tap support for phones, Escape to close, and reduced motion |
| `Skeleton.tsx` + `.css` | A grey loading placeholder that only appears if loading takes longer than 300 ms | Fast pages don't flash a placeholder |
| `ClaimLabel.tsx` | The six claim types as chips (navy for faith, crimson for history, dashed for Debated) and a row of all six | Shared by the Home page and, later, event pages. `disputed` in the database shows as "Debated", as in the design concept |
| `HowItWorks.tsx` | "How it works": four steps and "The labels you will see" | From the design concept; reused on a future "About this site" page |
| `HonestNotes.tsx` | The deep blue "Honest notes" band: free, work in progress, how AI was used, keep digging | Your copy from the design concept |
| `ContinuePathway.tsx` | "Continue your pathway: step 3 of 6" card | Hidden until a visitor starts a pathway |
| `MapCompare.tsx` | The swipe map: OpenStreetMap underneath, the Roman-era DARE map on top, clipped left of a draggable divider (a keyboard slider). A canvas-drawn dot per place (large for featured), star markers for disputed places' candidate sites, and fly-to on selection (an instant jump for reduced-motion visitors) | Loaded only on `/map`. Zoom stops at 11, where the Roman tiles end |
| `ParishMap.tsx` | Leaflet map with OpenStreetMap tiles. "Find churches near me" asks for the visitor's location, then searches OpenStreetMap through the Overpass API for Catholic churches within 15 km (Latin Church and the Eastern Catholic Churches; Old Catholic and Anglo-Catholic left out) and lists the nearest 40 with directions. The list shows the 3 closest and scrolls for the rest (its height is measured, since cards with long addresses are taller). While it searches it shows placeholder cards and, after 6 seconds, a note that the search can take up to a minute. A "Missing a church?" note links to OpenStreetMap's fix-the-map page. The privacy note sits under the search until the first search starts, then moves to the bottom of the page (a portal into a slot in `Parish.tsx`) to free up room. Visitors who don't share their location can type an address, city, or ZIP code instead (see `AddressSearch.tsx`); Nominatim turns it into a map point and the same church search runs from there | Free, no key. Location goes only to Overpass and a typed address only to Nominatim, never to this site's server. Follows Nominatim's [usage policy](https://operations.osmfoundation.org/policies/nominatim/): searches only on Search or Enter (no search while typing), at most one a second. Loaded only on `/parish`. The query has no result limit, because Overpass returns results in its own order and a limit dropped nearby churches |
| `AddressSearch.tsx` | The address box on Support a parish, with a dropdown of up to 5 suggestions from Photon as the visitor types. Leaves out businesses, and lists places in the visitor's own country first. Picking a suggestion searches from that point; pressing Search without picking one uses Nominatim | Nominatim forbids search-as-you-type, and Photon is built for it. Waits for a 300 ms pause and 3+ characters, cancels old requests, and remembers answers, to stay within Photon's fair use. Works with the keyboard and screen readers (ARIA combobox). If Photon is down, the box still works without suggestions |
| `StatusTag.tsx` | The two status labels: `<ComingSoon />` for anything not built yet, `<BeingChecked />` for content not yet verified, plus boxed note versions | Visitors always know what's unfinished or unverified |
| `PageStub.tsx` | Placeholder for pages not built yet, naming the wireframe to build from | Every menu link works while pages are still in progress |

## The glossary rule

Glossary definitions run through the whole site. Whenever a page uses a Catholic, biblical, or
liturgical term a newcomer might not know, wrap it in `ScholarDefinition`:

```tsx
<ScholarDefinition term="tabernacle" />                         // shows the glossary's own wording
<ScholarDefinition term="parish">parishes</ScholarDefinition>   // your wording in the sentence
```

- Add new terms to `src/data/glossary.ts`, with a definition, a "Learn more" note, an icon, and a
  source link where there is one.
- For text that comes from the API, use `<GlossaryText text={...} />`, and add the phrase to its list.
- Mark a term once per section, not every time it appears.
- Don't put a definition inside a link or button (such as an Explore card); put it in the text nearby.

## The status rule

Mark anything unfinished or unverified so visitors are never misled:

- **Not built yet** (a page, section, or feature): `<ComingSoon />`, or `<ComingSoonNote title="…">what it will do</ComingSoonNote>`.
- **Exists but not checked against sources** (AI-drafted notes, glossary drafts, places' notes): `<BeingChecked />`.
- Never show template text like `[Name]` to visitors; show a Coming soon card instead.
- Placeholder pages use `PageStub` with a `coming` sentence; unfinished pages are listed in `COMING_SOON` in `NavBar.tsx`.

## `src/pages/`: one file per screen

| File | Address | What it does | Status |
|---|---|---|---|
| `Home.tsx` | `/` | Hero with today's readings beside it, explore cards with gold top edges, How it works, Honest notes, each in a full-width band | Built from the design concept and wireframe 1 |
| `Readings.tsx` | `/readings` | One day's Mass readings as references, with previous, today, and next buttons (`?date=`) and the USCCB link | Built (wireframe 5). Readings don't open in the Douay-Rheims yet |
| `About.tsx` | `/about` | Lupe's photo (`public/lupe.jpg`, resized to 900 px) and her story, in her own words. Ends with buttons for Contact, How this site works, and her portfolio ("See my other projects", opens in a new tab). The photo stays beside the story on wide screens and sits on top, scrolling normally, on screens 1024 px wide or less (`.about-photo` in `global.css`) | Built from the design concept and wireframe 9. Don't reword the story. On narrow screens a sticky photo covered the text |
| `MapPage.tsx` | `/map` | The Holy Land, then and now: swipe map with a dot for every place in the Bible (1,300+), a search box, featured place chips, and a place panel (then and today names, location confidence, note, proposed sites, verses that open in the Douay-Rheims, events, OpenBible.info credit) with `?place=` | Built from the design concept and wireframe 4. Clicking any dot, chip, or result focuses the map on it |
| `Parish.tsx` | `/parish` | Map of nearby Catholic churches (OpenStreetMap) with the search and results beside it on wide screens (`.parish-layout` in `global.css`: two equal columns, as the charities had, that stack when there isn't room. Side by side, the map stretches to the height of the search column, never under 360 px), searchable by location or typed address, Google Maps button, and links to three Catholic charities at the bottom | Built from the design concept and wireframe 10 |
| `TodayReadingsCard.tsx` | (on Home) | Fetches `/readings/today` and lists the references, with a link to USCCB | Built. The pattern for every data-backed card: TanStack Query, a skeleton while loading, a friendly message on error |
| `Mass.tsx` | `/mass` | A beginner's guide to Mass: note, embedded video, the four parts, step by step with the prayers and postures (from `data/orderOfMass.tsx`), Good to know | Built from the design concept (pages 5–6) and wireframe 7. Draft: needs review by a priest |
| `Miracles.tsx` | `/miracles` | Investigated miracles, each with its Church status and sources | Layout built from the design canvas; the miracle records are still placeholders like `[Name of the miracle]` |
| `Angels.tsx` | `/angels` | Angels and demons: what Scripture, the Church, and history say | Built; needs a priest's review before launch |
| `FaithPages.css` | | Shared layout for Miracles and Angels | |
| `Contact.tsx` | `/contact` | Contact form that posts to Formspree | Built (wireframe 12). Needs `VITE_FORMSPREE_ID` |
| `Sources.tsx` | `/sources` | "Why sources matter", a table of every source with its license, and each Bible translation's full citation | Built (wireframe 11). The table is a static list in v1 |
| `Stubs.tsx` | `/timeline`, `/events/:slug`, `/search`, `/pathways/:slug`, and the 404 page | Placeholders built with `PageStub` | To build |

## `src/features/scripture/`: showing Bible text

| File | What it does | Why |
|---|---|---|
| `PassageText.tsx` | Shows one passage from `/passages/{id}`: the reference, which book and Testament it is from, the text, the translation, any fallback note, and the copyright line | API.Bible requires the copyright line beside every passage it supplies. Not used on a page yet |
| `useFums.ts` | Reports an API.Bible passage view to FUMS, API.Bible's usage tracker | Required by API.Bible's terms. Douay-Rheims passages have no token, so nothing is sent |

## `src/data/` and `src/styles/`

| File | What it does | Why |
|---|---|---|
| `data/orderOfMass.tsx` | The order of Mass: each step's posture, what happens, the short responses, public-domain prayers in full, and the opening words of longer prayers with a link to the USCCB | The English Mass texts are © ICEL; only short excerpts are quoted, with credit. Draft: check against the General Instruction of the Roman Missal |
| `data/glossary.ts` | Every term `ScholarDefinition` can explain: definition, "Learn more" text, icon, source link | Add or edit terms here. Draft text: check against Church sources before launch |
| `styles/global.css` | Site-wide colors, fonts (Alegreya and Alegreya Sans), base sizes, buttons, cards, plus the design concept's shared styles: full-width bands, gold-edged cards, outline buttons, underlined titles, label chips, scrolling tables, and the About photo's phone and tablet layout | Shared look for every page |

## Deploying

Cloudflare builds from `main` on every push: root directory `frontend`, build command
`npm run build`, deploy command `npx wrangler deploy`. Set `VITE_API_URL` and `VITE_FORMSPREE_ID` as
**build** variables. They are written into the site at build time, so changing them needs a rebuild.
