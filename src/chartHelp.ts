import { signs, type Chart } from './engine.ts';
import { houses, meanings } from './knowledge.ts';
import { jaiminiIndicators, periodPractice, personalReading, vimshottari, yogaCandidates } from './jyotisha.ts';

const help = (title: string, ...paragraphs: string[]) => ({ title, text: paragraphs.join('\n\n') });
export const guideTopics = ['sidereal','houses','nodes','wheel','lagna','nakshatra','pada','placements','parashari','yogas','jaimini','timing','practices','methods'] as const;

const definitions: Record<string, string> = {
 sidereal: 'A sidereal chart measures zodiac positions from a reference tied to the stars. Ayanamsa is the angular difference between that reference and the tropical zodiac, which starts at the March equinox.',
 houses: 'A house is a life topic in the chart. In the whole-sign method, the rising sign is House 1 and each following sign is the next house.',
 nodes: 'Lunar nodes are the two opposite points where the Moon’s orbit crosses the plane of Earth’s orbit. The mean-node method smooths out short-term changes in their motion.',
 wheel: 'The wheel is a map of zodiac positions. Each slice is a sign. A dot’s angle shows its longitude, and its distance from the center only helps separate the markers.',
 lagna: 'Lagna is the zodiac point rising on the eastern horizon at birth. It sets the starting point for counting houses and depends on the time and location.',
 nakshatra: 'A nakshatra is one of 27 equal sections of the zodiac. The Moon’s birth nakshatra names the section containing the Moon and helps set the first Vimshottari period.',
 pada: 'Each nakshatra is divided into four padas. A pada narrows down where the Moon sits within that section.',
 placements: 'The placement table lists the chart positions for each planet or node. A sign is one division of the zodiac. A degree measures how far into that sign the placement is. A house connects the position to a traditional life topic.',
 reading: 'The interpretation section applies traditional rules to calculated positions. A reading card tells you which chart details the rule uses and what theme it suggests.',
 parashari: 'Parashari is a Jyotisha tradition. This report finds the planet that rules the sign in a house, then looks at the house where that planet sits to connect the two topics.',
 yogas: 'A yoga is a named pattern involving particular chart placements. A candidate appears when a defined rule matches. For example, one rule checks whether the Sun and Mercury share a sign.',
 jaimini: 'Jaimini is a Jyotisha tradition. The report ranks seven planets by how far they have moved within their own signs, then assigns each one a traditional role.',
 timing: 'A dasha is a traditional timing period. A long period is a Mahadasha, and a shorter period within it is an Antardasha. The dates mark the start and end of each period.',
 practices: 'These optional practices are prompts for reflection, giving, or service drawn from Jyotisha traditions. The report can suggest a practice connected to the symbolism of a current period.',
 methods: 'This section documents how the positions were calculated and which traditional conventions the chart uses. It helps you understand where small differences in inputs or methods can change a result.',
 horizon: 'The horizon view shows the direction and height of marked objects from the birthplace at the reference moment. It uses local viewing directions instead of zodiac longitude.',
 observatory: 'The observatory is a guided 3D view of the planets and chart factors. Planet sizes, spacing and lighting are illustrative.',
 report: 'Save report opens the browser’s print dialog. You can print the chart or choose Save as PDF.',
 ai: 'An AI reading turns calculated chart details into a plain-English discussion of life themes. The chart engine supplies the positions and the AI explains the supplied evidence.',
 degree: 'Degrees show how far a placement is from the start of its sign. Each sign spans 30°.',
 motion: 'Direct and retrograde describe apparent motion along the zodiac as viewed from Earth. A day range shows how far the longitude changes when the birth time is unknown.',
};

export function generalChartHelp(chart: Chart, key: string) {
 const detail = chartHelp(chart,key);
 const [kind,id] = key.split(':');
 const titles: Record<string,string> = {horizon:'Birthplace horizon',observatory:'3D observatory',report:'Save report',ai:'AI personal reading'};
 if (Object.hasOwn(definitions,key)) return {title: detail?.title ?? titles[key] ?? key, text:definitions[key]};
 if (!detail) return;
 let text = '';
 if (kind==='planet') text = ['rahu','ketu'].includes(id)
  ? `${detail.title} is a lunar node, a calculated crossing of the Moon’s orbital path. Traditional readings associate it with ${meanings[id]}.`
  : `${detail.title} is a planet marker in the chart. In traditional Jyotisha its associations include ${meanings[id]}. Its sign, degree, and house describe where to read those associations.`;
 if (kind==='theme') text = `This reading uses the Parashari house-lord method to explore ${detail.title.toLowerCase()}. It links the house associated with the topic to the house occupied by its ruling planet.`;
 if (kind==='yoga') text = detail.title==='Budha Aditya' ? 'This candidate is checked by looking for the Sun and Mercury in the same sign. The tradition links the pattern with expression and analysis.'
  : detail.title==='Gaja Kesari' ? 'This candidate is checked by counting Jupiter’s sign from the Moon. Atlas looks for the first, fourth, seventh, or tenth sign in that count.'
  : detail.title==='Chandra Mangala' ? 'This candidate is checked by looking for the Moon and Mars in the same sign. The tradition connects it with emotion and initiative.'
  : 'Atlas checks this yoga when the relevant planet occupies House 1, 4, 7, or 10 and is in its own sign or its exaltation sign.';
 if (kind==='period') text = 'A subperiod is a shorter traditional cycle within a major period. Its start and end dates indicate the span used to discuss the ruling factor’s themes.';
 if (kind==='karaka') text = 'A karaka is a traditional indicator assigned to a planet. In this Jaimini table, its role depends on its rank by degrees within a sign.';
 if (kind==='sign') text = 'A sign is a 30-degree sector of the zodiac. The chart wheel places markers in the sector containing their calculated sidereal longitude.';
 if (kind==='degree') text = definitions.degree;
 if (kind==='motion') text = definitions.motion;
 if (kind==='house') text = definitions.houses;
 return text ? {title:detail.title,text} : undefined;
}

export function chartHelp(chart: Chart, key: string) {
 const [kind, id, sub] = key.split(':');
 switch (kind) {
  case 'degree':
  case 'house':
  case 'motion': {
   const p=chart.placements.find(item=>item.key===id);
   if(!p)return;
   if(kind==='degree')return help(`${p.name} · degree`, `${p.name} is ${p.degree.toFixed(3)}° from the start of ${signs[p.sign]}.`);
   if(kind==='house')return help(`${p.name} · house`, p.house ? `${p.name} is in House ${p.house}, traditionally associated with ${houses[p.house-1].toLowerCase()}. The app assigns this house by counting signs forward from the rising sign.` : 'A known birth time is needed to assign a house for this placement.');
   return help(`${p.name} · motion`, p.range ? `The calculated longitude spans ${p.range[0].toFixed(2)}° to ${p.range[1].toFixed(2)}° over the reference day.` : `The report marks ${p.name} as ${p.retrograde?'retrograde':'direct'} at the birth moment.`);
  }
  case 'methods': return help('Calculation notes', `This chart uses an approximate Lahiri offset of ${chart.ayanamsa.toFixed(2)}°, whole-sign houses, and mean lunar nodes. Small differences near a boundary can change the label shown.`);
  case 'practices': {
   const practice=periodPractice(chart);
   return help('Traditional practices', practice ? `The report suggests a practice related to ${practice.name} (${practice.placement}) in the current period. ${practice.suggestion}` : 'The report has no practice tied to an active period.');
  }
  case 'sign': {
   const sign=signs[Number(id)];
   if(!sign)return;
   const planets=chart.placements.filter(p=>p.sign===Number(id)).map(p=>p.name);
   return help(sign, planets.length ? `The chart places ${planets.join(', ')} in this sign.` : 'No planet or lunar-node markers occupy this sign in your chart.');
  }
  case 'karaka': {
   const item=jaiminiIndicators(chart)[Number(id)];
   if(item)return help(item.role,`${item.planet} is assigned this role based on its ${item.degree.toFixed(2)}° position within its sign. The report lists ${item.navamsa} as its Navamsa sign.`);
   return;
  }
  case 'sidereal': return help('Sidereal and Lahiri', 'Sidereal means this chart measures zodiac positions from a reference tied to the stars. The tropical system starts Aries at the March equinox. Those two starting points drift apart over time.',
   `Atlas subtracts a Lahiri offset of about ${chart.ayanamsa.toFixed(2)}° for this chart. That is the ayanamsa shown above the wheel. It can put a planet in the previous sign by changing the coordinate labels used to describe the same planet position.`);
  case 'houses': return help('Whole-sign houses', 'Each house is one entire zodiac sign. The sign rising on the eastern horizon becomes House 1, the next sign becomes House 2, and so on. That gives each placement two labels: its sign and the house that sign occupies in your chart.',
   chart.lagna === null ? 'Atlas leaves the houses blank when the birth time is unknown.' : `Here, ${signs[Math.floor(chart.lagna / 30)]} begins the count as House 1. House 1 is traditionally associated with the self and how you approach life.`);
  case 'nodes': return help('Mean lunar nodes', 'Rahu and Ketu are opposite points where the Moon’s orbital plane crosses Earth’s orbital plane. Atlas uses a smoothed calculation of their position, called the mean node.',
   'On the wheel they sit 180° apart. In traditional readings they’re interpreted through their signs and houses, just like the chart’s planet markers.');
  case 'lagna': return help('Lagna · rising sign', chart.lagna === null
   ? 'Lagna is the zodiac point rising on the eastern horizon at birth. Atlas needs birth time and location to find it and assign houses.'
   : `The zodiac point rising on the eastern horizon was in ${signs[Math.floor(chart.lagna / 30)]}. Atlas makes that entire sign House 1 and counts forward. Changing the rising sign can change the planets’ houses even when their signs stay the same.`);
  case 'nakshatra': return help('Moon nakshatra', `Atlas divides the sidereal zodiac into 27 equal lunar segments. Your Moon falls in ${chart.nakshatra}${chart.uncertain ? ' at the noon reference time' : ''}. This gives a traditional lens for discussing the Moon and, with known birth time, sets the starting planet in the dasha timeline.`);
  case 'pada': return help('Pada', `A pada is one quarter of a nakshatra. Your Moon is in quarter ${chart.pada} of ${chart.nakshatra}${chart.uncertain ? ' at the noon reference time' : ''}. It pinpoints the Moon within the same segment, so birth times near a boundary can give a different quarter.`);
  case 'wheel': return help('How to read the chart wheel', 'The wheel maps calculated zodiac positions at the birth moment as viewed from Earth. Each slice is a sign. The labeled dots are planets or lunar nodes.',
   'A dot’s angle shows its zodiac longitude. Its distance from the center just separates labels. Select a dot to see its sign, degree, and house.');
  case 'placements': return help('Placement table', 'Each row gives a planet or node’s sign and degree. The degree tells you how far it is from the start of its 30° sign. A house counts from the rising sign and points to a traditional life topic. Select a specific row to see how those pieces fit.');
  case 'planet': {
   const p=chart.placements.find(item=>item.key===id);
   if(!p)return;
   return help(p.name, `${p.name} is ${p.degree.toFixed(2)}° into ${signs[p.sign]}${chart.uncertain ? ' at the noon reference time' : ''}. ${p.house ? `Counting whole signs from the rising sign places it in House ${p.house}, associated with ${houses[p.house-1].toLowerCase()}.` : 'An exact birth time is needed to assign its house.'}`,
    `Its traditional symbolism includes ${meanings[p.key]}. Interpretations connect those associations with the house topic and other placements. ${['rahu','ketu'].includes(p.key) ? 'This is a calculated crossing of the Moon’s orbital path.' : p.retrograde ? 'Retrograde describes apparent backward motion from Earth.' : ''}`.trim());
  }
  case 'reading': return help('Chart interpretation', 'Atlas calculates placements first, then applies traditional rules. Select a reading card for the exact placements and the rule connecting them to that topic.');
  case 'parashari': return help('Parashari house-lord method', 'Parashari is a Jyotisha tradition. The rule used here starts with a house for a life topic, finds its sign, then identifies the planet traditionally assigned to that sign. That planet is called its house lord.',
   'Atlas finds the house where that planet actually sits and reads the two house topics together. The planet’s traditional associations describe the connection. Click a reading card to see this chain for your chart.');
  case 'theme': {
   const item=personalReading(chart)[Number(id)];
   if(item)return help(item.title, item.evidence.replaceAll('Bhava','House').replace('Its lord','Its ruling planet'), `${item.synthesis} The house where the ruling planet sits is what connects those two life topics.`, item.practice);
   return;
  }
  case 'yogas': return help('Yoga candidates', 'A yoga is a named pattern formed by specific placements. For example, Atlas checks whether the Sun and Mercury share a sign for Budha Aditya.',
   `This chart matches ${yogaCandidates(chart).length} of eight rules. A candidate means the arrangement matched. A fuller reading also considers strength, exact distance, and other influences.`);
  case 'yoga': {
   const item=yogaCandidates(chart)[Number(id)];
   if(item)return help(item.name, `Why this matched: ${item.evidence}`, `${item.theme} Atlas checks the arrangement itself. Its strength and influence depend on the wider chart.`);
   return;
  }
  case 'jaimini': return help('Jaimini', 'This approach ranks seven planets by how far each has moved through its own sign. The leading planet is the Atmakaraka, a traditional indicator for themes of self. The rank uses degrees within each sign.');
  case 'timing': return help('Vimshottari timing', 'The Moon’s exact position in its birth nakshatra sets the first major period and how much of it is left. Each major period contains shorter subperiods. Choose a row to see its dates and traditional theme.');
  case 'period': {
   const major=vimshottari(chart)[Number(id)];
   const period=major?.sub[Number(sub)];
   if(period)return help(`${period.lord} subperiod`, `This period runs from ${new Date(period.start).toISOString().slice(0,10)} to ${new Date(period.end).toISOString().slice(0,10)} UTC within the longer ${major.lord} major period.`,
    `A traditional reading considers ${meanings[period.lord]} as a theme during this cycle. The dates describe the cycle; interpreting it also uses the planet’s birth placement.`);
   return;
  }
 }
}
