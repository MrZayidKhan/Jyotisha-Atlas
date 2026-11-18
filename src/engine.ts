import * as A from 'astronomy-engine';
export const signs=['Mesha · Aries','Vrishabha · Taurus','Mithuna · Gemini','Karka · Cancer','Simha · Leo','Kanya · Virgo','Tula · Libra','Vrischika · Scorpio','Dhanu · Sagittarius','Makara · Capricorn','Kumbha · Aquarius','Meena · Pisces'];
export const nakshatras=['Ashwini','Bharani','Krittika','Rohini','Mrigashirsha','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
export interface Birth {name:string;date:string;time:string;place:string;lat:number;lon:number;offset:number;unknown:boolean}
export interface Placement {name:string;key:string;longitude:number;tropical:number;sign:number;degree:number;house:number|null;retrograde:boolean;range?:[number,number]}
export interface Chart {birth:Birth;utc:string;ayanamsa:number;lagna:number|null;placements:Placement[];nakshatra:string;pada:number;uncertain:boolean;method:string}
const mod=(x:number)=>((x%360)+360)%360;
function position(body:A.Body,date:Date){
 return body===A.Body.Sun?A.SunPosition(date).elon:A.Ecliptic(A.GeoVector(body,date,true)).elon;
}

// IAU 2006 general precession in longitude, anchored at the adopted J2000 Lahiri value.
export function siderealOffset(date:Date){
 const t=A.MakeTime(date).tt/36525;
 const precession=t*(5028.796195+t*(1.1054348+t*(0.00007964+t*(-0.000023857-t*0.0000000383))));
 return 23.857092+precession/3600+A.e_tilt(A.MakeTime(date)).dpsi/3600;
}
export function calculate(b:Birth):Chart {
 if(!b.date||(!b.unknown&&!b.time)||!b.place.trim()||!Number.isFinite(b.lat)||!Number.isFinite(b.lon)||!Number.isFinite(b.offset)||Math.abs(b.lat)>66||Math.abs(b.lon)>180||Math.abs(b.offset)>14)throw Error('Enter valid birth details. Supported latitude: 66° S to 66° N; UTC offset: −14 to +14.');
 const year=Number(b.date.slice(0,4));if(year<1900||year>2100)throw Error('Choose a date between 1900 and 2100.');
 const date=new Date(Date.parse(`${b.date}T${b.unknown?'12:00':b.time}:00Z`)-b.offset*3600000);
 if(!Number.isFinite(date.getTime())||date.getTime()>Date.now())throw Error('Enter a valid birth date in the past.');
 const t=(date.getTime()-Date.UTC(2000,0,1,12))/86400000/36525;
 const ayanamsa=siderealOffset(date);
 const obliquity=A.e_tilt(A.MakeTime(date)).tobl*Math.PI/180;
 const theta=mod(A.SiderealTime(date)*15+b.lon)*Math.PI/180;
 const asc=mod(Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(obliquity)+Math.tan(b.lat*Math.PI/180)*Math.sin(obliquity))*180/Math.PI+180-ayanamsa);
 const lagna=b.unknown?null:asc;
 const bodies:[string,string,A.Body][]=[['Surya','sun',A.Body.Sun],['Chandra','moon',A.Body.Moon],['Mangala','mars',A.Body.Mars],['Budha','mercury',A.Body.Mercury],['Guru','jupiter',A.Body.Jupiter],['Shukra','venus',A.Body.Venus],['Shani','saturn',A.Body.Saturn]];
 const make=(name:string,key:string,tropical:number,retrograde:boolean):Placement=>{const longitude=mod(tropical-ayanamsa);const sign=Math.floor(longitude/30);return {name,key,tropical,longitude,sign,degree:longitude%30,house:lagna===null?null:((sign-Math.floor(lagna/30)+12)%12)+1,retrograde}};
 const placements=bodies.map(([name,key,body])=>{
  const start=new Date(date.getTime()-1800000),end=new Date(date.getTime()+1800000);
  const p=make(name,key,position(body,date),mod(position(body,end)-position(body,start))>180);
  if(b.unknown){
   const midnight=new Date(date.getTime()-43200000),nextMidnight=new Date(date.getTime()+43200000);
   p.range=[mod(position(body,midnight)-siderealOffset(midnight)),mod(position(body,nextMidnight)-siderealOffset(nextMidnight))];
  }
  return p;
 });
 // Mean lunar ascending node polynomial; Rahu/Ketu are mathematical points.
 const node=mod(125.04452-1934.136261*t+0.0020708*t*t+t*t*t/450000);
 placements.push(make('Rahu','rahu',node,true),make('Ketu','ketu',mod(node+180),true));
 const moon=placements[1].longitude;
 return {birth:b,utc:date.toISOString(),ayanamsa,lagna,placements,nakshatra:nakshatras[Math.floor(moon/(360/27))],pada:Math.floor((moon%(360/27))/(360/108))+1,uncertain:b.unknown,method:'Astronomy Engine · apparent geocentric ecliptic · Lahiri anchor with IAU 2006 precession and nutation · whole-sign houses · mean nodes'};
}
