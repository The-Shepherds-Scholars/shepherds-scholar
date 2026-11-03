# API.Bible rules

The site uses API.Bible for the NLT and GNT. Using it means agreeing to API.Bible's Minimum
Acceptable Use, Strictly Non-commercial Use, and Statement of Orthodoxy agreements, and its Terms of
Service. Breaking them can get the API key revoked. This page lists each rule and how the project
follows it. Check it before changing anything that touches Bible text, money, or AI.

| Rule | What it requires | How we follow it | Where |
|---|---|---|---|
| **Content integrity** | Don't change API.Bible text | Text is stored and shown as API.Bible returns it, only trimming spaces at the ends. It is shown as plain text, never edited, summarized, or rewritten | `backend/app/services/api_bible.py`, `frontend/src/features/scripture/PassageText.tsx` |
| **30-day refresh** | Cached text must be refreshed from API.Bible at least every 30 days | The daily job refreshes at 25 days and deletes rows over 30 days. The API never serves a row over 30 days old, even if the job stops running | `backend/app/jobs/refresh_passage_cache.py`, `backend/app/services/scripture.py` |
| **Format** | Text stays text; no making audio from text, or text from audio | Text only. Don't add text-to-speech for API.Bible translations. The Douay-Rheims is public domain and not affected | |
| **Copyright line** | Show each translation's copyright as its owner requires | The copyright line API.Bible sends with each passage is shown under it | `PassageText.tsx` |
| **Citation format** | Use API.Bible's citation wording; a short form is allowed where space is tight | Full citation on the Sources page; short form under each passage. Stored per translation, and the database refuses an API.Bible translation without one | `backend/alembic/versions/api_bible_citations.py`, `frontend/src/pages/Sources.tsx` |
| **Attribution (Starter plan)** | A visible citation and link to https://api.bible in the app | Site-wide footer: "Scripture text provided by API.Bible", linking to https://api.bible. Also under each API.Bible passage | `frontend/src/components/AppShell.tsx` |
| **FUMS** | Report each view of API.Bible text | `useFums` reports each passage view with its FUMS token | `frontend/src/features/scripture/useFums.ts` |
| **No AI training** | API.Bible content may not be used to train AI or LLMs | Never export `passage_cache` or other API.Bible text into AI training data, datasets, or fine-tuning. Don't paste it into AI tools to build datasets | |
| **No logos** | No logos of Bible versions, IP holders, API.Bible, or the American Bible Society without written permission | The site uses no such logos. Links and names in text only | |
| **Biblical ministry consistency** | Use the text in keeping with the Christian Bible and the Statement of Orthodoxy (the Apostles' Creed) | Faith content is reviewed before launch, per the project's own process | |
| **Strictly non-commercial** | No ads, in-app purchases, paid or freemium plans, fundraising, or any revenue | The site is free and ad-free and takes no donations. The "Support a parish" page only links to a map of local churches | `frontend/src/pages/Stubs.tsx` (`Parish`) |
| **Donation links (exception)** | Small, non-intrusive tithe or donation links are allowed; pop-ups or pushy donation messages are not. API.Bible can withdraw this at any time | None today. If added: a plain link only, no banners, pop-ups, or interstitials | |

## Before you add something, check

- **A new API.Bible translation:** add `citation` and `citation_short` in its migration (the database
  requires both), using the format in `api_bible_citations.py` and the IP holder's website.
- **Anything that makes money,** including ads, sponsorships, affiliate links, paid features, or
  donation drives: it isn't allowed while the site uses API.Bible.
- **Audio, AI, or exports** of Bible text: check the format and AI rules above first.

## Still to do

- **Terms of Service:** the copy saved here was unreadable (all black pages). Read the current terms at
  https://api.bible and add anything this page misses.
- **Statement of Orthodoxy:** keep faith content consistent with it as pages are written.
