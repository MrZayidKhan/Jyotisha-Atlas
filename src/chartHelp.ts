import { signs, type Chart } from './engine.ts';
import { houses, meanings } from './knowledge.ts';
import { personalReading, vimshottari, yogaCandidates } from './jyotisha.ts';

const help = (title: string, ...paragraphs: string[]) => ({ title, text: paragraphs.join('\n\n') });
export const guideTopics = ['sidereal','houses','nodes','wheel','lagna','nakshatra','pada','placements','parashari','yogas','jaimini','timing'] as const;

export function chartHelp(chart: Chart, key: string) {
 const [kind, id, sub] = key.split(':');
 switch (kind) {
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
