import * as A from 'astronomy-engine';
import type { Chart } from './engine.ts';

export interface SkyPoint {
 key:string;
 name:string;
 azimuth:number;
 altitude:number;
 magnitude:number;
 distance?:number;
 illumination?:number;
 colorIndex?:number|null;
 }

export type CatalogStar=[ra:number,dec:number,magnitude:number,colorIndex:number|null];

const bodies=[
 ['sun','Sun',A.Body.Sun],['moon','Moon',A.Body.Moon],['mercury','Mercury',A.Body.Mercury],
 ['venus','Venus',A.Body.Venus],['mars','Mars',A.Body.Mars],['jupiter','Jupiter',A.Body.Jupiter],
 ['saturn','Saturn',A.Body.Saturn],
] as const;

// Rounded J2000 right ascension (hours), declination (degrees), and visual magnitude.
const stars=[
 ['Sirius',6.7525,-16.7161,-1.46],['Canopus',6.3992,-52.6957,-.74],
 ['Arcturus',14.2610,19.1824,-.05],['Vega',18.6156,38.7837,.03],
 ['Capella',5.2782,45.9980,.08],['Rigel',5.2423,-8.2016,.13],
 ['Procyon',7.6550,5.2250,.34],['Betelgeuse',5.9195,7.4071,.5],
 ['Achernar',1.6286,-57.2368,.46],['Hadar',14.0637,-60.3730,.61],
 ['Altair',19.8464,8.8683,.76],['Acrux',12.4433,-63.0991,.77],
 ['Aldebaran',4.5987,16.5093,.86],['Spica',13.4199,-11.1613,.97],
 ['Antares',16.4901,-26.4320,1.06],['Pollux',7.7553,28.0262,1.14],
 ['Fomalhaut',22.9608,-29.6222,1.16],['Deneb',20.6905,45.2803,1.25],
 ['Regulus',10.1395,11.9672,1.35],['Polaris',2.5303,89.2641,1.98],
] as const;

export function birthHorizon(chart:Chart,catalog?:CatalogStar[]){
 const date=new Date(chart.utc);
 const observer=new A.Observer(chart.birth.lat,chart.birth.lon,0);
 const rotation=A.Rotation_EQJ_EQD(date);
 const time=new A.AstroTime(date);
 function star(name:string,ra:number,dec:number,magnitude:number,colorIndex?:number|null):SkyPoint{
  const vector=A.VectorFromSphere(new A.Spherical(dec,ra*15,1),time);
  const eq=A.EquatorFromVector(A.RotateVector(rotation,vector));
  const {altitude,azimuth}=A.Horizon(date,observer,eq.ra,eq.dec);
  return {key:name,name,altitude,azimuth,magnitude,colorIndex};
 }
 return {
  planets:bodies.map(([key,name,body]):SkyPoint=>{
   const eq=A.Equator(body,date,observer,true,true);
   const {altitude,azimuth}=A.Horizon(date,observer,eq.ra,eq.dec);
   const light=A.Illumination(body,date);
   return {key,name,altitude,azimuth,magnitude:light.mag,distance:eq.dist,illumination:light.phase_fraction};
  }),
  stars:catalog?catalog.map(([ra,dec,magnitude,colorIndex],i)=>star(String(i),ra,dec,magnitude,colorIndex)):
   stars.map(([name,ra,dec,magnitude])=>star(name,ra,dec,magnitude)),
 };
}
