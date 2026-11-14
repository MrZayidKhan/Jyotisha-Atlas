# Jyotisha Atlas

React/TypeScript educational observatory: enter birth details, watch a cinematic alignment, inspect calculated grahas, explore traditional concepts and print a report.

## Run

Requires Node **24+**, Python **3.11+** (tested with 3.14).

```powershell
cd D:\IKS
npm.cmd install
npm.cmd run dev
```

Open http://127.0.0.1:5173 . Test with 2000-01-01, 12:00, Bhopal (23.2599, 77.4126), UTC +5.5. Confirm the coordinates and UTC offset on the birth date. Expect an 8.5-second journey followed by a calculated chart and reading panels. Skip/Escape, replay, reduced motion and WebGL fallback are supported. Inputs stay in memory; refresh clears them. Eight Indian cities have local lookup; other places use manual coordinates and historical UTC offset, including any daylight saving.

## Optional backend and AI

In a second PowerShell terminal:

```powershell
cd D:\IKS
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Expect `Uvicorn running on http://127.0.0.1:8000`. Vite proxies `/api/*` to FastAPI. Inspect endpoints at http://127.0.0.1:8000/docs . The frontend chart and local source guide work without this service.

For LLM retrieval, create `.env` beside package.json using `.env.example`. Obtain a key from https://platform.openai.com/api-keys . Set `OPENAI_API_KEY` and `OPENAI_MODEL` to a Responses API model available in your account with structured-output support. Never paste a key into chat or put it in a `VITE_` variable. Restart FastAPI, reload the frontend, and verify `/api/health` reports `llm_configured: true`; chat will offer an AI toggle. Live LLM requests were **not tested**, since credentials were not supplied.

AI receives the question, recent messages and server-generated answer cards. It may select only an allowed card ID; the server supplies the text. It cannot generate positions, rules or source references. This supports constrained follow-ups, not unrestricted astrology answers. Unsupported questions receive an explicit source-limited response. Local retrieval remains available if the provider fails.

Static Sites hosting supports animation, calculations, local retrieval and report printing. The Python backend/connected AI are local and are **not deployed by static hosting**. Add authentication/rate limits before exposing the local development API publicly. No database is needed because charts and conversations are not persisted.

## Components and data flow

- `src/main.tsx`: form, chart, reading panels, library, chat and journey orchestration.
- `src/SpaceScene.tsx`: lazy-loaded Three.js image sprites, artistic camera movement and calculated longitude alignment; resources released after the journey.
- `src/engine.ts`: deterministic positions, approximate sidereal conversion, ascendant, Bhavas and Nakshatra; independent of AI.
- `src/knowledge.ts`: separate glossary, source references, factor-grouping rules and retrieval.
- `backend/main.py`: FastAPI calculation, health and optional AI endpoints.
- `scripts/bridge.mjs`: invokes the same TypeScript engine through Node from Python. `POST /api/chart` accepts birth details; `POST /api/chat` recalculates from birth inputs before retrieving answers.
- `public/assets`: locally downloaded NASA images (about 680 KB). `public/ATTRIBUTION.md` records provenance and usage.
- `public/base.css`, `src/style.css`, `src/refinements.css`: responsive visual treatment. Motion handles UI transitions. No paid animation libraries or generated images.

## Methods and limitations

Astronomy Engine 2.1.19 (MIT) calculates geocentric tropical ecliptic longitudes. A **linear approximate Lahiri** correction uses J2000 23.857092° and 1.3969713°/century. This is not full Swiss Ephemeris Lahiri; that package lacked a Python 3.14 binary on this host. Lagna uses local sidereal time and mean obliquity; Bhavas are whole-sign. Rahu uses a mean-node polynomial, Ketu its opposite. Nakshatras use 27 equal divisions and four padas each.

Supported years: 1900–2100, past births only; latitude ±66°. Boundary-sensitive factors need specialist ephemeris verification; the sidereal approximation has not been independently certified against Swiss Ephemeris. Unknown time explicitly uses local noon, shows daily longitude endpoints, and withholds Lagna, houses and personalized readings.

Cinematic sizes, distances and movement are artistic. Planet imagery does not reconstruct birth-date appearance. NASA PIA12348 is a Galactic-center composite used as a background, not a birth-sky star map. Rahu and Ketu are mathematical points.

The searchable library contains 66 entries: nine Grahas, twelve Rashis, twelve Bhavas, 27 Nakshatras and six introductory/history/tradition entries. Readings are editorial summaries, not verse quotations or a comprehensive traditional judgment. Yoga detection, dasha timelines and a detailed multi-school corpus are not implemented; the library explicitly explains these limits.

## Report

Choose **Save report / PDF** after creating a chart, then choose your browser's **Save as PDF** destination. Print styles include birth details/coordinates/UTC offset, the chart, placements, readings, methods and source URLs, plus the traditional/non-scientific interpretation note. Verify print preview before saving; pagination depends on browser/paper settings. No paid PDF service is needed.

## Build and test

```powershell
npm.cmd run build
node --experimental-strip-types --test tests/engine.test.mjs
python -m unittest discover -s tests -p '*_test.py' -v
```

Vite builds `dist/` and copies `public/` assets. Build/type checks passed. Six engine checks cover UTC equivalence, independently transformed eastern-horizon Lagna, equinox Sun longitude, unknown time, coordinate/node invariants and unsupported questions. Two API tests cover chart generation, validation, health and unknown time. Browser checks covered desktop chart reveal, mobile overflow, unknown-time cinematic and captured console errors (none during the checked journey). Full cross-device performance, PDF pagination and live LLM responses need broader testing.

## Stages delivered

React/TypeScript foundation; local NASA assets and cinematic scene; validated birth input; deterministic chart and selection; introductory readings and searchable knowledge retrieval; local chat plus optional LLM backend; browser-print report; automated engine/API checks and setup docs.

Only connected AI needs user secret configuration. Normal chart exploration requires no key.
