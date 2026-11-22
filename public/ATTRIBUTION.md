# Jyotisha Atlas asset credits

## Observatory media

- Lunar surface: NASA Scientific Visualization Studio [CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) by Ernie Wright, based on the LRO Camera and Lunar Orbiter Laser Altimeter teams. Atlas uses WebP derivatives of `lroc_color_2k.jpg`, `lroc_color_poles_4k.tif` and `ldem_3_8bit.jpg`. Relief is a bump map for shading. The homepage and report use WebP derivatives of NASA's lunar near-side image listed below.
- Cinematic Milky Way and planet surfaces: [Solar System Scope](https://www.solarsystemscope.com/textures/), CC BY 4.0. The WebP surfaces and panorama are resized and recompressed from the previous texture set. Procedural star points add visual depth to the cinematic panorama. Their positions are illustrative.
- Birthplace horizon stars: [Astronexus HYG v4.1](https://github.com/astronexus/HYG-Database/blob/main/hyg/README.md), by David Nash / Astronexus. The separate [hyg-stars.json](/hyg-stars.json) is a filtered, rounded derivative distributed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). It contains 1,295 stars of visual magnitude 4.8 or brighter, excluding the Sun. Columns are right ascension in hours, declination in degrees, visual magnitude and optional B–V color index.
- Solar effects are procedural illustrations informed by [NASA's Solar Dynamics Observatory imagery](https://science.nasa.gov/science-research/heliophysics/nasa-solar-observatory-sees-coronal-loops-flicker-before-big-flares/). They illustrate the corona and looping prominences, without reproducing a historical flare.

## Homepage and location search

The homepage uses responsive WebP derivatives of `assets/moon-nearside.jpg`, NASA's **Lunar Near Side**, credit **NASA/Goddard Space Flight Center/Arizona State University**. Source: https://science.nasa.gov/resource/lunar-near-side/ . The local image is a 1600-pixel derivative served by NASA's image service and displayed with subtle CSS contrast/brightness adjustments. NASA media-use guidelines apply; no endorsement is implied.

Worldwide city lookup uses the **Open-Meteo Geocoding API**, based on **GeoNames**, under **CC BY 4.0**. API/documentation: https://open-meteo.com/en/docs/geocoding-api . GeoNames: https://www.geonames.org/ . Licence: https://creativecommons.org/licenses/by/4.0/ . Saved fallback-city names and coordinates are normalized for this app; online results are reduced to city, region, country, coordinates and IANA zone. Only the typed place query is sent to geocoding; birth dates/times are not. UTC offsets are resolved locally using the browser's IANA time-zone data.

Lunar-node visuals are original geometric diagrams: gold ecliptic, inclined colored lunar path, marked crossing and directional arrow. Inclination and distances are exaggerated for explanation, not used as astronomical measurements.

## Interactive 3D observatory — surface maps

Planetary and sky maps in `textures/` are by **Solar System Scope / INOVE**, used under **Creative Commons Attribution 4.0 International**: https://creativecommons.org/licenses/by/4.0/ . Original collection and download links: https://www.solarsystemscope.com/textures/ . Solar System Scope is not affiliated with this project.

The Sun, Mercury, Venus atmosphere, Mars, Jupiter, Saturn, Earth and Milky Way WebP assets were re-encoded from the previous Solar System Scope derivatives. The Milky Way originals derive from their `8k_stars_milky_way.jpg`. The original ring alpha map remains `2k_saturn_ring_alpha.png`. Maps are rendered on lit sphere meshes, with a separate textured ring for Saturn.

The source collection is based on spacecraft/NASA imagery with adjusted colors; some unmapped areas are filled by its creators. The texture colors, artistic rotation and lighting are not a reconstruction of the planets' birth-date appearance. The sky panorama is an atmospheric background, not an observer-specific star chart. Rashi and Nakshatra arcs are equal sidereal coordinate sectors, not physical orbital paths or IAU constellation outlines.

All imagery is bundled locally. The composition is an artistic educational visualization. Planet images are photographs/composites; the animation does not recreate the observer's actual field of view, planet sizes, distances, phase or visibility.

| File | NASA media ID | Source |
| --- | --- | --- |
| moon.jpg | PIA00405 | https://images.nasa.gov/details/PIA00405 |
| sun.jpg | PIA03149 | https://images.nasa.gov/details/PIA03149 |
| mercury.jpg | PIA15162 | https://images.nasa.gov/details/PIA15162 |
| venus.jpg | PIA00271 | https://images.nasa.gov/details/PIA00271 |
| mars.jpg | PIA00407 | https://images.nasa.gov/details/PIA00407 |
| jupiter.jpg | PIA02873 | https://images.nasa.gov/details/PIA02873 |
| saturn.jpg | PIA12567 | https://images.nasa.gov/details/PIA12567 |

Credit NASA and the mission teams specified in each linked record (including JPL, USGS, Cassini and the contributing observatories).

NASA's educational media-use guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/ . No NASA logo is used, and no endorsement is implied.

Software: React (MIT), Three.js (MIT), Motion (MIT), Astronomy Engine 2.1.19 (MIT, copyright Don Cross). License notices are preserved in package distributions/bundled license comments. Full Astronomy Engine source/license: https://github.com/cosinekitty/astronomy . Fonts DM Sans, DM Mono, Playfair Display: SIL Open Font License via Google Fonts.

Historical reference: Varahamihira, Brihat Jataka, English translation N. Chidambaram Iyer, 1885, Wellcome scan https://archive.org/details/b2488442x . Short meanings are editorial introductory summaries, not verse quotations or complete traditional judgments. Rahu/Ketu symbolism is a modern introductory glossary and should not be attributed verbatim to this text.
