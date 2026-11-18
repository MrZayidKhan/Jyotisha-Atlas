# Jyotisha Atlas guide

Jyotisha Atlas is an interactive birth-chart and sky explorer. Its astronomy calculations describe positions and directions. Its Jyotisha readings describe traditional interpretations of those positions. You can browse the glossary or explore the Greenwich sample before entering any personal information.

## Create and read a chart

1. Enter your birth date and the local clock time recorded at birth. Name is optional and is used as the report label.
2. Search for a city and select a result. This fills latitude and longitude and looks up the time zone for the date of birth. City results use a representative city coordinate. For a hospital or village use **Use precise coordinates instead** and enter the latitude, longitude and local UTC offset. North and east are positive. India’s UTC+05:30 is entered as 5.5 hours.
3. If a time occurred twice when the clocks changed, check the birth record and set the matching UTC offset manually. If the time did not exist because the clocks moved forward, correct the time or supply a documented offset. If you do not know the birth time, select the checkbox. The noon reference and daily position ranges are still available. Lagna, houses, the personalized reading and the Dasha timeline require a birth time.
4. **Generate chart & open 3D** opens the observatory. **Open chart only** goes directly to the report. You can always open the observatory from the report.
5. In the report, start with the Lagna, Moon Nakshatra and placements. Select a graha on the circular chart or placements table to see its details. Use the report links to jump to the reading or Dasha timeline. **Save report / PDF** opens the browser’s print dialog. Choose **Save as PDF** to keep a copy. The printout includes the interpretation view and Dasha period selected at print time.

Supported inputs run from 1900 to 2100, for past birth times, at latitude 66° S through 66° N. Confirm timezone and exact birth time before interpreting a boundary. Refreshing the page clears the birth data and conversation held in memory.

## Use the two sky views

**Cinematic tour.** The opening flight brings you to Chandra, the Moon. Choose a body or chapter from the dock, click a visible world, or use next and previous. Drag to orbit and scroll or pinch to zoom. **Sky overview** spreads out the chart, **Reset camera** restores framing, and **Pause animation** holds the scene. **Chart & report** or Escape returns to the chart. The tour uses calculated sidereal longitude for each graha’s direction. Sizes, distances, lights, rotation, Milky Way placement and solar activity are artistic. The color and surface relief of the Moon come from NASA’s Lunar Reconnaissance Orbiter maps; the phase shown in the cinematic tour is illustrative.

**Birthplace horizon.** Open it from the report or the observatory to see angles from the birth location. North is 0° azimuth, east 90°, south 180°, west 270°. Altitude 0° is the flat horizon, positive is above, negative is below. Select a body to point the camera and show its coordinates. The Moon readout gives its illuminated fraction. Drag to look around or use **Face north** to reset. Sun altitude controls the day, twilight or night palette. The HYG catalog supplies 1,295 bright stars with a 20-star offline fallback. The model uses sea level and omits terrain, weather, atmospheric refraction and star proper motion. Stars are hidden in the simplified daylight view. The zodiac tour and the birthplace horizon answer different questions: where a body falls in the chart, and where it lies relative to the observer.

## Chart vocabulary

| Term | Meaning in Atlas |
| --- | --- |
| Graha | A chart factor. Atlas uses the Sun, Moon, five visible planets and the two lunar nodes. The traditional category includes objects other than physical planets. |
| Rashi | One of twelve 30° divisions of the sidereal ecliptic. Atlas displays both Sanskrit and English sign names. |
| Bhava | A house, or topic area. In the whole-sign convention, the entire rising sign is Bhava 1, followed by the next eleven signs. |
| Lagna | The rising point, where the eastern horizon meets the ecliptic. Its Rashi determines the first house. It is sensitive to the time and location. |
| Ecliptic | The reference circle for the Sun’s apparent annual path, as seen from Earth. Longitude measures an angle along it. |
| Tropical / sidereal | Tropical longitudes are measured from the equinox. The sidereal system used here subtracts an ayanamsa to align the zodiac to a chosen sidereal reference. |
| Ayanamsa | The angular offset between those zodiac frames. Atlas uses an approximate Lahiri anchor with precession and nutation of date. Other conventions can place a body differently near a boundary. |
| Degree | The placements table shows progress within the Rashi, from 0° to just under 30°. The scene can show the full sidereal longitude, from 0° to just under 360°. |
| Nakshatra | One of 27 equal lunar sectors, each 13°20′ wide. The Moon’s birth longitude selects the birth Nakshatra. The glossary lists all 27 and their coordinate ranges. |
| Pada | One of four 3°20′ subdivisions of a Nakshatra. The report shows the Moon’s pada. |
| Retrograde | An apparent decrease in a body’s ecliptic longitude over time as viewed from Earth. Atlas estimates motion around the birth instant. The mean nodes are treated as retrograde. |
| Rahu / Ketu | The ascending and descending intersections of the Moon’s orbit with the ecliptic. The two calculated mean nodes are 180° apart. Gold and colored paths in the diagrams distinguish the two planes, with tilt exaggerated. |
| House lord | The traditional ruler of the sign occupying a house. A reading uses that ruler’s placement and any grahas in the house as evidence. |
| Navamsa | A sign assigned to each ninth of a 30° sign. Atlas shows it in the Jaimini karaka table. It currently does not render a full independent D9 chart. |
| Azimuth / altitude | Horizontal angles local to the observer. They belong to the birthplace horizon and differ from sidereal longitude. |

### The nine grahas

| Name | Object or point | Traditional topics used by Atlas |
| --- | --- | --- |
| Surya | Sun | Agency, expression, authority and vitality |
| Chandra | Moon | Mind, responsiveness, care and change |
| Mangala | Mars | Initiative, action, courage and conflict |
| Budha | Mercury | Language, learning, commerce and analysis |
| Guru | Jupiter | Teaching, counsel, judgment and expansion |
| Shukra | Venus | Aesthetics, agreements, pleasure and relationships |
| Shani | Saturn | Time, responsibility, restraint and persistence |
| Rahu | Ascending lunar node | Intensification and unfamiliar experience |
| Ketu | Descending lunar node | Separation and inward focus |

The twelve houses cover, in order: self; resources and speech; initiative and siblings; home; creativity and learning; service and challenges; partnership; change and shared resources; dharma and higher learning; work and public role; networks and aspirations; release and seclusion. A graha can have a Rashi, a degree, a house and a motion value at the same time. Each field answers a different question.

## Reading approaches

**Parashari.** Atlas combines the calculated sign and ruler of a house with the ruler’s placement and the house’s occupants. It covers identity, resources, home, creativity, partnership and work. Each card names its evidence and includes a reflection prompt.

**Yoga** here means a named chart combination. Atlas checks sign co-presence for Budha Aditya (Sun and Mercury) and Chandra Mangala (Moon and Mars), counts Jupiter’s angular relationship from the Moon for Gaja Kesari, and checks whether Mars, Mercury, Jupiter, Venus or Saturn is in an angular house in its own or exaltation sign for the five Pancha Mahapurusha patterns. The names are Ruchaka, Bhadra, Hamsa, Malavya and Shasha. Matches are structural candidates. Strength, combustion, aspects, exceptions and competing rules can affect a practitioner’s judgment.

**Jaimini.** The seven-graha convention ranks the classical grahas by degrees traveled within their own signs. The highest-ranked graha is Atmakaraka, the traditional significator of the self. Amatyakaraka relates to work or counsel, Bhratrikaraka to siblings, Matrikaraka to mother, Putrakaraka to children, Gnatikaraka to kin or obstacles, and Darakaraka to partnership. The table includes each graha’s Navamsa sign. Rashi Drishti shows the traditional sign aspects from Lagna: movable and fixed signs connect across the two groups apart from adjacent signs, and dual signs connect with other dual signs. Other Jaimini conventions can include eight karakas or different interpretation rules.

### Dasha timing

A **Dasha** is a period in a traditional timing system. **Vimshottari** uses a nominal 120-year cycle. **Mahadasha** is a major period and **Antardasha** is a subperiod within it. Each has a graha associated with it, called its period lord.

| Order | Lord | Nominal years |
| --- | --- | ---: |
| 1 | Ketu | 7 |
| 2 | Venus | 20 |
| 3 | Sun | 6 |
| 4 | Moon | 10 |
| 5 | Mars | 7 |
| 6 | Rahu | 18 |
| 7 | Jupiter | 16 |
| 8 | Saturn | 19 |
| 9 | Mercury | 17 |

The first lord comes from the Moon’s birth Nakshatra in that repeating order, starting with Ashwini and Ketu. The proportion of the Nakshatra remaining sets the balance of the first period. Each major period contains nine subperiods, beginning with its own lord, with lengths proportional to the nine cycle weights. Atlas uses a 365.25-day year, clips periods to start at birth, and displays UTC dates. Choose a major period to see its subperiods. These dates describe the adopted Jyotisha convention. They do not establish when a personal event will occur. Other software can use a different year, longitude model, or birth-time correction.

**Remedies and practices.** The report suggests optional reflection, service (seva), giving (dana), and personal spiritual practices. It links a modest suggestion to the current period when available. These describe cultural practices and are not guaranteed outcomes or substitutes for professional care.

## Ask Atlas and privacy

Built-in answers work without an AI account. Try “What is my current dasha?”, “Which yogas match?”, “Where is Chandra?”, or “Explain Jaimini”. If the site owner configures connected AI, an opt-in toggle appears. The Worker recalculates the chart from date, time, coordinates and offset, with name and place label stripped in the browser. The provider sees the question, recent user messages and selected chart fact cards. It picks a card; planet positions stay determined by the chart engine. When the provider fails, the built-in answer remains available. Avoid including identifying details in questions sent to connected AI.

Atlas uses city-name lookups at Open-Meteo/GeoNames. It stores no app accounts, charts, or chat histories. The current hosted Site is private. For the live site, configure `OPENAI_API_KEY` and `OPENAI_MODEL` through server-side runtime secrets. Keep secrets out of source control and front-end environment variables. Free-tier options for a future provider integration include [Google AI Studio](https://ai.google.dev/gemini-api/docs/pricing) and [OpenRouter free models](https://openrouter.ai/collections/free-models/). These use different API configuration from the current OpenAI integration. Verify quota, eligible models, and data-use terms before enabling them for user data.

## How the code fits together

| Area | Source and responsibilities |
| --- | --- |
| Entry and report | `src/main.tsx` coordinates chart state, scene loading, report navigation, guided chat and browser printing. `HomeHero.tsx`, `BirthForm.tsx`, `ChartReading.tsx` and `KnowledgeLibrary.tsx` own their respective UI. |
| Location | `src/locations.ts` validates public geocoder results, merges local fallback cities and resolves historical offsets with browser timezone data. |
| Astronomy | `src/engine.ts` converts local civil time to UTC, uses Astronomy Engine for geocentric positions, applies sidereal and house conventions, and derives mean nodes and lunar subdivisions. |
| Readings | `src/jyotisha.ts` detects the supported yoga patterns and derives house-lord interpretations, Jaimini indicators, Vimshottari dates and period practices. `src/knowledge.ts` contains glossary facts and source references. |
| Cinematic UI | `src/Observatory.tsx` manages chapters, controls and fallbacks. `SpaceScene.tsx` manages Three.js, camera paths, deferred textures and GPU disposal. `starField.ts` and `solarEffects.ts` generate the cinematic depth, corona and loops without a video or postprocessing pass. |
| Birth horizon | `src/horizon.ts` transforms astronomical coordinates to local azimuth and altitude. `HorizonView.tsx` draws a movable perspective projection and body readouts. |
| Hosting | `src/worker.ts` serves the hosted assets and `/api/health` and `/api/chat`. `scripts/build-worker.mjs` emits the Worker and Cloudflare asset configuration. `backend/main.py` is the optional local FastAPI service. |
| Media | Source credits and derivative instructions are in [ATTRIBUTION.md](/ATTRIBUTION.md). `scripts/encode-textures.py` reproduces the optional WebP conversion; ordinary builds use the checked-in images. |

### Local development and release

Run `npm ci`, then `npm run dev` from the repository and open the printed local URL. Chat and charts work without the optional provider. Run `npm run build` to type-check, build the browser app, and bundle the Worker. See the repository README for local backend setup and test commands. The tracked hosting manifest selects the existing Sites project. Build artifacts land in `dist/client` and `dist/server`.

### Recommended next changes

1. **Before a public launch:** choose the audience and add abuse controls and provider budgets for connected AI. Publish a plain-language privacy page, add feedback/contact, and keep personal data out of analytics. Run a small pilot with consenting users before expanding the audience.
2. **Accuracy and content:** compare birth charts at sign and Nakshatra boundaries against an independently licensed ephemeris across the full supported date range. Ask a Jyotisha practitioner to review the supported school conventions and examples. Treat further school coverage as documented rule sets with fixtures rather than general AI output.
3. **UX and performance:** test old Android phones, Safari/iOS, keyboard and screen-reader navigation, and PDF pagination. Track time to chart, WebGL fallback rate, and time to the first useful 3D frame without recording birth details.
4. **Product:** begin with the free chart and sample observatory. Prioritize whether visitors can create a chart and understand their first placement before expanding chat or adding paid features.
