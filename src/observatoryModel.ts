import {type Chart,signs} from './engine.ts';
import {houses,meanings} from './knowledge.ts';
export type Destination='overview'|'moon'|'sun'|'mercury'|'venus'|'mars'|'jupiter'|'saturn'|'rahu'|'ketu'|'nakshatra'|'lagna'|'rashi';
export const bodies:Record<string,{radius:number;orbit:number;texture:string;english:string;subtitle:string;science:string}>={
 moon:{radius:1.65,orbit:16,texture:'moon-2k.webp',english:'Moon',subtitle:'Your Chandra',science:'Earth’s natural satellite. NASA’s LRO color and elevation maps give this model its craters, maria and relief.'},
 sun:{radius:3,orbit:24,texture:'sun.webp',english:'Sun',subtitle:'Your Surya',science:'Our star. The glowing corona and arcing prominences illustrate hot material shaped by solar magnetic fields.'},
 mercury:{radius:1.05,orbit:20,texture:'mercury.webp',english:'Mercury',subtitle:'Your Budha',science:'A rocky planet with an extensively cratered surface. This map draws on spacecraft imagery.'},
 venus:{radius:1.75,orbit:30,texture:'venus_atmosphere.webp',english:'Venus',subtitle:'Your Shukra',science:'Venus is wrapped in a dense atmosphere. The model shows cloud cover, rather than pretending its rocky surface is visible.'},
 mars:{radius:1.3,orbit:27,texture:'mars.webp',english:'Mars',subtitle:'Your Mangala',science:'A rocky planet whose iron-rich surface gives it a characteristic red appearance. Surface mapping makes the model readable from different angles.'},
 jupiter:{radius:3.3,orbit:35,texture:'jupiter.webp',english:'Jupiter',subtitle:'Your Guru',science:'A gas giant with atmospheric bands and large storms. Its visible map shows clouds, not a solid ground surface.'},
 saturn:{radius:2.6,orbit:40,texture:'saturn.webp',english:'Saturn',subtitle:'Your Shani',science:'A gas giant surrounded by rings. The ring is a separate textured mesh; tilt and scale are chosen for a clear educational view.'}
};
export const chapters:Destination[]=['moon','nakshatra','rashi','lagna','sun','mercury','venus','mars','jupiter','saturn','rahu','ketu'];
export function availableChapters(chart:Chart){return chapters.filter(key=>key!=='lagna'||chart.lagna!==null)}
export function worldPosition(longitude:number,radius:number):[number,number,number]{const a=longitude*Math.PI/180;return [Math.cos(a)*radius,0,-Math.sin(a)*radius]}
export function destinationInfo(chart:Chart,destination:Destination){
 const key=['nakshatra','rashi','overview'].includes(destination)?'moon':destination;
 const placement=chart.placements.find(p=>p.key===key)??chart.placements[1];
 const isLagna=destination==='lagna',isNakshatra=destination==='nakshatra',isRashi=destination==='rashi';
 const longitude=isLagna?chart.lagna??0:isNakshatra?(Math.floor(placement.longitude/(360/27))+.5)*360/27:isRashi?(placement.sign+.5)*30:placement.longitude;
 const name=isLagna?'Your Lagna':isNakshatra?chart.nakshatra:isRashi?signs[placement.sign].split(' · ')[0]:bodies[key]?.subtitle??placement.name;
 const topic=isLagna?'The eastern horizon':isNakshatra?'Your lunar mansion':isRashi?'Your Moon’s Rashi':bodies[key]?.english??'Lunar node';
 const explanation=isLagna?'Lagna is the eastern horizon’s intersection with the ecliptic at your birth moment. In this whole-sign framework its Rashi sets Bhava one, giving the chart its house reference.':isNakshatra?`Your Moon’s calculated sidereal longitude falls inside ${chart.nakshatra}, pada ${chart.pada}. This is a 13°20′ coordinate sector divided into four padas. It is not a photograph of a constellation.`:isRashi?`Your Chandra falls in ${signs[placement.sign]}. A Rashi is a 30° sidereal zodiac division. The highlighted arc shows that coordinate interval; it is not the irregular boundary of an astronomical constellation.`:['rahu','ketu'].includes(key)?`${placement.name} is a lunar node: a mathematical intersection of the lunar orbit and ecliptic. The gold path marks the ecliptic; the colored path crosses it. The highlighted point is the ascending or descending intersection. Orbital tilt is exaggerated for readability; this is a diagram, not a physical planet.`:bodies[key]?.science??'';
 const relation=isLagna?`Your calculated rising longitude is ${chart.lagna?.toFixed(2)}°, in ${signs[Math.floor((chart.lagna??0)/30)]}. Houses are counted from that sign.`:isNakshatra||isRashi?`The Moon is at ${placement.longitude.toFixed(2)}° sidereal longitude. ${isNakshatra?`That places it in sector ${Math.floor(placement.longitude/(360/27))+1} of 27.`:`That places it in Rashi ${placement.sign+1} of twelve.`} ${chart.uncertain?'Birth time is unknown, so this uses the labeled local-noon reference.':''}`:`${placement.name} is traditionally associated with ${meanings[key]}. ${placement.house?`Your chart places it in Bhava ${placement.house}, the field of ${houses[placement.house-1].toLowerCase()}. Reading those two symbols together suggests a topic for reflection; it does not establish an outcome.`:'Birth time is unknown, so houses and personalized readings are withheld.'}`;
 return {key,placement,longitude,name,topic,explanation,relation};
}
