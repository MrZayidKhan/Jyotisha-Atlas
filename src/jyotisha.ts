import { signs, type Chart, type Placement } from './engine.ts';
import { houses, meanings } from './knowledge.ts';

export const parashara = 'https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf';
export const jaimini = 'https://books.google.com/books/about/Sri_Jaiminisutras.html?id=z4v4gjJ_ay0C';
const lords = ['mars','venus','mercury','moon','sun','mercury','venus','mars','jupiter','saturn','saturn','jupiter'];
const cycle = [
 ['ketu',7],['venus',20],['sun',6],['moon',10],['mars',7],
 ['rahu',18],['jupiter',16],['saturn',19],['mercury',17],
] as const;
const yearMs = 365.25 * 86400000;
const distance = (from:number,to:number) => (to-from+12)%12;
export const signName = (index:number) => signs[index].split(' · ')[0];
const navamsa = (p:Placement) => Math.floor(p.longitude*108/360)%12;

export function vimshottari(chart:Chart) {
 if (chart.uncertain) return [];
 const birth = Date.parse(chart.utc);
 const mansion = chart.placements.find(p=>p.key==='moon')!.longitude*27/360;
 const first = Math.floor(mansion)%9;
 let start = birth-(mansion%1)*cycle[first][1]*yearMs;
 return Array.from({length:10},(_,i)=>{
  const index=(first+i)%9;
  const [lord,years]=cycle[index];
  const end=start+years*yearMs;
  const majorStart=start;
  let cursor=start;
  const sub=Array.from({length:9},(_,j)=>{
   const [subLord,weight]=cycle[(index+j)%9];
   const subStart=cursor;
   cursor=j===8?end:cursor+years*weight/120*yearMs;
   return {lord:subLord,start:Math.max(birth,subStart),end:cursor};
  }).filter(period=>period.end>birth);
  start=end;
  return {lord,start:Math.max(birth,majorStart),end,sub};
 });
}

const classical = ['sun','moon','mars','mercury','jupiter','venus','saturn'];
const greatPerson = [
 ['mars','Ruchaka',9],['mercury','Bhadra',5],['jupiter','Hamsa',3],
 ['venus','Malavya',11],['saturn','Shasha',6],
] as const;
export function yogaCandidates(chart:Chart) {
 if (chart.lagna===null) return [];
 const p=Object.fromEntries(chart.placements.map(p=>[p.key,p]));
 const results:{name:string;evidence:string;theme:string}[]=[];
 const angle = (house:number|null) => house!==null && [1,4,7,10].includes(house);
 if(distance(p.moon.sign,p.jupiter.sign)%3===0)
  results.push({name:'Gaja Kesari',evidence:`Guru is ${distance(p.moon.sign,p.jupiter.sign)+1} signs from Chandra, counting Chandra’s sign as one.`,theme:'Traditional readings consider counsel, learning and judgment.'});
 if(p.sun.sign===p.mercury.sign)
  results.push({name:'Budha Aditya',evidence:`Surya and Budha share ${signName(p.sun.sign)}. This check uses sign co-presence.`,theme:'Traditional readings connect expression with analysis. The closeness of Budha to the Sun also matters.'});
 for(const [key,name,exaltation] of greatPerson){
  const planet=p[key];
  if(angle(planet.house)&&(planet.sign===exaltation||lords[planet.sign]===key))
   results.push({name,evidence:`${planet.name} occupies Bhava ${planet.house} in ${signName(planet.sign)}, its ${planet.sign===exaltation?'exaltation sign':'own sign'}.`,theme:`This Pancha Mahapurusha pattern emphasizes ${meanings[key]} in traditional interpretation.`});
 }
 const fromMoon=distance(p.moon.sign,p.mars.sign)+1;
 if(fromMoon===1)
  results.push({name:'Chandra Mangala',evidence:`Chandra and Mangala share ${signName(p.moon.sign)} under the conjunction convention.`,theme:'Traditional readings compare emotional responsiveness with initiative and effort.'});
 return results;
}

export function jaiminiIndicators(chart:Chart) {
 if(chart.uncertain)return [];
 const roles=['Atmakaraka','Amatyakaraka','Bhratrikaraka','Matrikaraka','Putrakaraka','Gnatikaraka','Darakaraka'];
 return chart.placements.filter(p=>classical.includes(p.key)).sort((a,b)=>b.degree-a.degree)
  .map((p,i)=>({role:roles[i],planet:p.name,degree:p.degree,navamsa:signName(navamsa(p))}));
}

// Movable signs aspect non-adjacent fixed signs, and vice versa. Dual signs aspect other dual signs.
export function jaiminiAspects(chart:Chart){
 if(chart.lagna===null)return null;
 const rising=Math.floor(chart.lagna/30);
 const modality=rising%3;
 const targets=signs.map((_,i)=>i).filter(i=>{
  if(i===rising)return false;
  if(modality===2)return i%3===2;
  return i%3===1-modality&&![1,11].includes(distance(rising,i));
 });
 return {
  rising:signName(rising),
  signs:targets.map(signName),
  planets:chart.placements.filter(p=>classical.includes(p.key)&&targets.includes(p.sign)).map(p=>p.name),
 };
}

const themes = [
 ['Identity and direction',1,'What part of your daily routine most closely reflects the person you want to become?'],
 ['Resources and values',2,'Choose one habit around speech or spending to review this week.'],
 ['Home and stability',4,'Which parts of your environment help you feel settled and able to concentrate?'],
 ['Learning and creativity',5,'Set aside regular time for one skill you want to practice.'],
 ['Relationships',7,'Name one expectation you could communicate more clearly.'],
 ['Work and contribution',10,'Identify one responsibility you want to get better at and a small step you can take.'],
] as const;

export function personalReading(chart:Chart){
 if(chart.lagna===null)return [];
 const rising=Math.floor(chart.lagna/30);
 return themes.map(([title,house,practice])=>{
  const sign=(rising+house-1)%12;
  const ruler=chart.placements.find(p=>p.key===lords[sign])!;
  const occupants=chart.placements.filter(p=>p.house===house);
  return {
   title,
   evidence:`${signName(sign)} is Bhava ${house}. Its lord ${ruler.name} occupies ${signName(ruler.sign)} in Bhava ${ruler.house}. ${occupants.length?`Occupants in Bhava ${house}: ${occupants.map(p=>p.name).join(', ')}.`:`Read this house through its lord.`}`,
   synthesis:`Under a Parashari house-lord reading, ${houses[house-1].toLowerCase()} connects with ${houses[ruler.house!-1].toLowerCase()} through ${ruler.name}, associated with ${meanings[ruler.key]}.`,
   practice,
  };
 });
}

export function currentPeriods(chart:Chart,at=Date.now()){
 const major=vimshottari(chart).find(p=>p.start<=at&&at<p.end);
 return {major,minor:major?.sub.find(p=>p.start<=at&&at<p.end)};
}

const practices:Record<string,string>={
 sun:'Offer time to a public or community service you value.',
 moon:'Set aside a few minutes for quiet reflection, or offer practical care to someone close to you.',
 mars:'Put some effort into a concrete service task, such as helping with a community cleanup.',
 mercury:'Share a useful skill or help someone with study or paperwork.',
 jupiter:'Make time for study, teaching or mentorship.',
 venus:'Share something creative, or give time to an arts or hospitality project.',
 saturn:'Take on a modest recurring service commitment that you can reliably keep.',
 rahu:'Choose one unfamiliar task to approach slowly and with a clear boundary.',
 ketu:'Make a little space for quiet practice or simplify one unnecessary commitment.',
};
export function periodPractice(chart:Chart){
 const {major,minor}=currentPeriods(chart);
 const lord=minor?.lord??major?.lord;
 if(!lord)return null;
 const p=chart.placements.find(p=>p.key===lord)!;
 return {name:p.name,placement:`${signName(p.sign)} · Bhava ${p.house}`,suggestion:practices[lord]};
}

export function advancedAnswer(question:string,chart:Chart|null){
 if(!chart||chart.uncertain)return null;
 if(/\b(death|die|disease|illness|invest|stock|guarantee|predict|marry)\b|when will|marriage date/i.test(question))return null;
 if(/\b(remed(y|ies)|mantra|seva|dana)\b/i.test(question)){
  const practice=periodPractice(chart);
  if(practice)return `Your current period points to ${practice.name} (${practice.placement}) for a traditional reflection. ${practice.suggestion} This is optional and does not establish a change in outcome.`;
 }
 if(/\b(dasha|mah[aā]dasha|antardasha|vimshottari)\b/i.test(question)){
  const {major,minor}=currentPeriods(chart);
  if(major)return `Your current Vimshottari Mahadasha is ${major.lord} through ${new Date(major.end).toISOString().slice(0,10)} UTC${minor?`, with ${minor.lord} Antardasha through ${new Date(minor.end).toISOString().slice(0,10)} UTC`:''}. See the report for the full timeline.`;
 }
 if(/\byogas?\b/i.test(question)){
  const yogas=yogaCandidates(chart);
  return yogas.length?yogas.map(y=>`${y.name}: ${y.evidence}`).join('\n'):'No structural matches for the yoga rules currently implemented. Chart conditions outside these rules require separate review.';
 }
 if(/\b(atmakaraka|jaimini|karakas?)\b/i.test(question)){
  const first=jaiminiIndicators(chart)[0];
  return `${first.planet} is your Atmakaraka under the seven-graha Jaimini convention, with ${first.degree.toFixed(3)}° traveled in its sign and ${first.navamsa} Navamsa.`;
 }
 const topic=[/\b(identity|personality|direction)\b/i,/\b(resources|values|spending)\b/i,
  /\b(home|stability)\b/i,/\b(learning|creativity)\b/i,
  /\b(relationship|relationships|partnership)\b/i,/\b(career|work|profession)\b/i].findIndex(pattern=>pattern.test(question));
 if(topic!==-1){
  const reading=personalReading(chart)[topic];
  if(reading)return `${reading.evidence} ${reading.synthesis} ${reading.practice}`;
 }
 return null;
}
