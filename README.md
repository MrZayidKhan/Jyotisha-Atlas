# Jyotisha Atlas

Jyotisha Atlas is a browser-based Vedic astrology learning tool. Create a birth chart, explore an interactive 3D observatory or birthplace horizon, and see how traditional interpretations relate to calculated placements.

[Live site](https://jyotisha-atlas.docilelamp1025.chatgpt.site) · [User and developer guide](public/GUIDE.md) · [Image and data credits](public/ATTRIBUTION.md)

## Start here

1. Open **Create Chart** and enter the birth date, time, and place. You can also use the sample chart or enter coordinates manually.
2. Open **My Chart** for the chart, placements, readings, and period timeline. The observatory and horizon are optional.
3. Use **Beginner Guide** to look up terms. **Ask Atlas** offers the built-in guide and, on the hosted site, optional Gemini analysis.

## Hosting

| Environment | What runs there |
| --- | --- |
| OpenAI Sites | The frontend and the server-side Worker for Gemini analysis. |
| Local Vite | The frontend, calculations, and built-in guide. Start FastAPI separately for optional local AI. |
| GitHub Pages | [Public frontend](https://mrzayidkhan.github.io/Jyotisha-Atlas/) with charts, 3D views, the beginner guide, and built-in answers. |

GitHub Actions builds the frontend with the repository base path and publishes `dist/client`. The FastAPI backend, Gemini key, and `.openai` configuration are excluded from the published source tree and Pages build.

## Hosted chart and observatory

The report compares Parashari house-lord readings with Jaimini's seven Chara Karakas, Navamsa and Rashi Drishti. The Parashari report shows six chart themes and eight structural yoga checks, with the placement evidence for every match. The Vimshottari selector shows Mahadasha and Antardasha periods from birth, uses the Moon's nakshatra balance and a 365.25-day year, and highlights the current periods. Reflection, giving and service suggestions are optional cultural practices, linked to report themes and the current period. The supported rules are a defined subset of both traditions. An unknown birth time withholds the interpretive report and timing.

In the observatory, select **Birthplace horizon** to look around an observer-specific sky. Sun, Moon and visible-planet directions use topocentric positions at sea level, without refraction. Planet markers can be inspected below the horizon. The view loads 1,295 HYG catalog stars with a 20-star fallback, transforming J2000 directions to the birth date. Sun altitude drives a simplified daylight and twilight palette. Terrain, proper motion and atmospheric refraction are outside this model. **Cinematic tour** retains the visual chart and its planet-by-planet explanations.

## Birth form and homepage

The homepage uses responsive NASA lunar imagery and a high-contrast palette. Create a chart with or without the 3D tour. Both sky views are reachable directly from the report. The cinematic scene loads a lightweight panoramic sky and Moon first, then adds NASA lunar relief and selected planet textures on demand.

Birthplace is now a keyboard-accessible searchable dropdown. Selecting a city fills its WGS84 coordinates and IANA zone. Worldwide results come directly from Open-Meteo / GeoNames; 20 saved fallback cities cover popular Indian and international places if the network is unavailable. Only the public place-name query goes to geocoding, never the birth date/time. City coordinates represent a city center; use **Use precise coordinates instead** for a hospital, village or exact point.

The UTC offset is resolved locally for the actual birth date and time, including DST rules, using `Intl.DateTimeFormat` and the browser's IANA data. A repeated or nonexistent wall time is explicitly blocked until corrected or a documented UTC offset is entered manually. Changing coordinates away from the chosen city clears its automatic time-zone association and requires a manual offset. Unknown time uses an explicit local-noon reference. Zero latitude, longitude and offset are valid.

Lunar nodes now use crossing orbital-path diagrams, a highlighted intersection and an ascending/descending arrow. Gold identifies the ecliptic; blue/purple identifies the inclined lunar path. Tilt and scale are exaggerated for readability; the diagram is not used in calculations.

New files: `src/BirthForm.tsx`, `src/locations.ts`, `src/HomeHero.tsx`, `src/KnowledgeLibrary.tsx`, `src/home.css`; node rendering is in `src/SpaceScene.tsx`. No new production dependency or API key is required for this update.

Additional verification:

```powershell
node --experimental-strip-types --test tests/locations.test.mjs
node --import tsx --test tests/birth-form.test.tsx
```

Six location/time-zone tests and four DOM interaction tests supplement the existing ten calculation/destination checks. The homepage was visually checked at desktop size; the live geocoding service was checked with Mysuru. Full mobile and node-camera visual regression testing remains incomplete.

Development dependency audit (2026-11-18): npm reports a picomatch ReDoS advisory inherited through Vite's build/development tooling. The registry's latest picomatch (4.0.7) is still flagged, so no force downgrade or unverified override was applied. `npm audit --omit=dev` reports zero vulnerabilities in production dependencies. Recheck when an upstream patch is available; the hosted Worker serves production assets and does not run Vite.

React/TypeScript educational observatory: enter birth details, watch a cinematic alignment, inspect calculated grahas, explore traditional concepts and print a report.

## Run

Requires Node **24+**. Python is only needed for the separate local API.

```powershell
cd D:\IKS
npm.cmd install
npm.cmd run dev
```

Open http://127.0.0.1:5173 . Choose **Explore a sample sky** for a labeled Greenwich sample, or enter a birth date/time and select a city from the dropdown. Coordinates and the birth-date time-zone offset are filled automatically. After arrival, the 3D observatory **stays open**. Select Chandra, another graha, Moon Rashi, Nakshatra or Lagna inside the scene to travel to that factor and read its explanation. Drag to orbit, scroll/pinch to zoom, pause rotation or return to the overview. **Chart & report** or Escape returns to the report. Inputs stay in memory; refresh clears them.

## Optional backend and AI

**AI features require a running backend and an AI provider API key.** This project’s backend supports the Gemini API. To use a different AI provider, adapt the backend to that provider’s API and configure its key server-side.

GitHub Pages runs the built-in guide and chart explanations in the browser. For AI report readings and Pip explanations on the [public site](https://mrzayidkhan.github.io/Jyotisha-Atlas/), start the separate FastAPI backend on the same computer, then reload the site. Allow local network access if prompted. The browser connects to `127.0.0.1:8000`. The backend and key stay on your PC. You can also use the local Vite frontend with `npm run dev`.

The backend is maintained separately from this GitHub checkout. On the maintainer's Windows machine, double-click `D:\IKS\server-run.cmd` to start FastAPI. Press Ctrl+C in its terminal to stop it.

In a second PowerShell terminal:

```powershell
cd D:\IKS
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Expect `Uvicorn running on http://127.0.0.1:8000`. Vite proxies `/api/*` to FastAPI. Inspect endpoints at http://127.0.0.1:8000/docs . The frontend chart and local source guide work without this service.

Create `.env` beside package.json using `.env.example`. Create a key in [Google AI Studio](https://aistudio.google.com/apikey) and set `GEMINI_API_KEY`. The optional `GEMINI_MODEL` defaults to `gemini-3.5-flash-lite`. Keep the key in the local backend environment and restart FastAPI after changing it.

The local FastAPI backend can generate a personalized report and expand Pip’s explanations of specific chart details. Local chat uses Gemini to select a predefined answer card. The separate hosted site supports conversational analysis.

Sites hosting uses a Worker with `/api/health` and `/api/chat`. Set `GEMINI_API_KEY` in Sites runtime secrets to enable connected AI. Set `GEMINI_MODEL` only to override the default. In connected mode, the Worker recalculates the chart and sends derived chart evidence, the latest question, and recent messages to Gemini. Gemini writes a plain-English response. If the key is absent or Gemini fails, the Worker returns the built-in guide response.

## Components and data flow

- `src/main.tsx`: form, chart, reading panels, library, chat and journey orchestration.
- `src/Observatory.tsx`: persistent in-scene navigation, focus management, chapter explanations, loading, retry and exit.
- `src/SpaceScene.tsx`: actual textured Three.js sphere meshes, Saturn ring geometry, panoramic sky, raycast selection, orbit controls and camera transitions. Graphics resources are released on exit.
- `src/observatoryModel.ts`: maps calculated chart factors to camera destinations and source-limited explanations.
- `src/engine.ts`: deterministic positions, approximate sidereal conversion, ascendant, Bhavas and Nakshatra; independent of AI.
- `src/knowledge.ts`: separate glossary, source references, factor-grouping rules and retrieval.
- The maintainer’s local FastAPI backend provides calculation, health, and optional AI endpoints.
- The local API calls the same TypeScript chart engine through Node.
- `public/assets`: existing NASA thumbnails. `public/textures`: Solar System Scope surface maps (CC BY 4.0), including a 4K desktop Moon and 2K mobile Moon. The Milky Way panorama uses 4K desktop / 2K mobile maps. Source credits and transformation notes are in `public/ATTRIBUTION.md`.
- `public/base.css`, `src/style.css`, `src/refinements.css`: responsive visual treatment. Motion handles UI transitions. No paid animation libraries or generated images.

## Methods and limitations

Astronomy Engine 2.1.19 (MIT) calculates geocentric tropical ecliptic longitudes. A J2000 Lahiri anchor uses IAU 2006 precession and nutation of date. This remains an approximation to a dedicated Lahiri ephemeris. Lagna uses apparent local sidereal time and true obliquity; Bhavas are whole-sign. Rahu uses a mean-node polynomial, Ketu its opposite. Nakshatras use 27 equal divisions and four padas each.

Supported years: 1900–2100, past births only; latitude ±66°. Boundary-sensitive factors need specialist ephemeris verification; the sidereal approximation has not been independently certified against Swiss Ephemeris. Unknown time explicitly uses local noon, shows daily longitude endpoints, and withholds Lagna, houses and personalized readings.

Model sizes, radial spacing, lighting and rotation are artistic; longitude angles come from chart data. The panoramic night sky is not an observer-specific star map. Rashi/Nakshatra sectors are coordinate divisions, not IAU constellation boundaries. Rahu and Ketu use geometric markers because they are mathematical points. Surface textures can contain color enhancement and creator-filled unmapped terrain; attribution is explicit.

The searchable library contains 66 entries: nine Grahas, twelve Rashis, twelve Bhavas, 27 Nakshatras and six introductory/history/tradition entries. Readings are editorial summaries, not verse quotations or a comprehensive traditional judgment. The report implements a defined subset of yoga and timing rules and two schools. It does not claim exhaustive chart judgment.

## Report

Choose **Save report / PDF** after creating a chart, then choose your browser's **Save as PDF** destination. Print styles include birth details/coordinates/UTC offset, the chart, placements, readings, methods and source URLs, plus the traditional/non-scientific interpretation note. Verify print preview before saving; pagination depends on browser/paper settings. No paid PDF service is needed.

## Build and test

```powershell
npm.cmd run build
node --experimental-strip-types --test tests/engine.test.mjs
node --experimental-strip-types --test tests/observatory.test.mjs
node --import tsx --test tests/jyotisha.test.mjs tests/locations.test.mjs tests/birth-form.test.tsx
```

Vite builds `dist/client` and copies the static assets from `public/`. The frontend tests cover chart calculations, observatory destinations, interpretation rules, city lookup, and birth form interactions.

## Stages delivered

React/TypeScript foundation; local NASA assets and cinematic scene; validated birth input; deterministic chart and selection; introductory readings and searchable knowledge retrieval; local chat plus optional LLM backend; browser-print report; automated engine/API checks and setup docs.

Only connected AI needs user secret configuration. Normal chart exploration requires no key.
