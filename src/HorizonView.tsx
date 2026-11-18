import { useEffect, useMemo, useRef, useState } from 'react';
import type { Chart } from './engine';
import { birthHorizon, type CatalogStar } from './horizon';

const radians=Math.PI/180;
function direction(azimuth:number,altitude:number){
 const a=azimuth*radians,h=altitude*radians;
 return [Math.sin(a)*Math.cos(h),Math.sin(h),-Math.cos(a)*Math.cos(h)] as const;
}
export default function HorizonView({chart}:{chart:Chart}){
 const [catalog,setCatalog]=useState<CatalogStar[]>();
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/hyg-stars.json',{signal:controller.signal})
   .then(r=>r.ok?r.json():null).then(data=>{if(Array.isArray(data)&&data.length)setCatalog(data)})
   .catch(()=>{ /* The bundled bright-star fallback remains available. */ });
  return()=>controller.abort();
 },[]);
 const {planets,stars}=useMemo(()=>birthHorizon(chart,catalog),[chart,catalog]);
 const starVectors=useMemo(()=>stars.filter(p=>p.altitude>=0).map(p=>({p,vector:direction(p.azimuth,p.altitude)})),[stars]);
 const [selected,setSelected]=useState('moon');
 const [view,setView]=useState({
  azimuth:planets[1].azimuth,
  altitude:planets[1].altitude<0?24:planets[1].altitude,
 });
 const canvas=useRef<HTMLCanvasElement>(null);
 const drag=useRef<{x:number;y:number}|null>(null);
 const active=planets.find(p=>p.key===selected)!;
 useEffect(()=>{
  const el=canvas.current!;
  const ctx=el.getContext('2d');
  if(!ctx)return;
  function draw(){
   if(!ctx)return;
   const {width,height}=el.getBoundingClientRect();
   if(!width||!height)return;
   const dpr=Math.min(window.devicePixelRatio,2);
   el.width=Math.round(width*dpr);
   el.height=Math.round(height*dpr);
   ctx.scale(dpr,dpr);
   const pitch=Math.max(-89.9,Math.min(89.9,view.altitude));
   const forward=direction(view.azimuth,pitch);
   const right=direction(view.azimuth+90,0);
   const up=direction(view.azimuth,pitch+90);
   const focal=(height/2)/Math.tan(30*radians);
   const dot=(a:readonly number[],b:readonly number[])=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
   const projectVector=(vector:readonly number[])=>{
    const depth=dot(vector,forward);
    if(depth<.05)return null;
    return {x:width/2+dot(vector,right)*focal/depth,y:height/2-dot(vector,up)*focal/depth};
   };
   const project=(az:number,alt:number)=>projectVector(direction(az,alt));
   const gradient=ctx.createLinearGradient(0,0,0,height);
   const daylight=planets[0].altitude>=0;
   const twilight=planets[0].altitude>=-12&&!daylight;
   gradient.addColorStop(0,daylight?'#25588e':twilight?'#171d42':'#060b1c');
   gradient.addColorStop(1,daylight?'#6b90ad':twilight?'#553d5a':'#1b304d');
   ctx.fillStyle=gradient;
   ctx.fillRect(0,0,width,height);
   ctx.strokeStyle='#7d92b469';
   for(const altitude of [-60,-30,0,30,60]){
    ctx.beginPath();
    let drawing=false;
    for(let az=0;az<=360;az+=2){
     const point=project(az,altitude);
     if(!point){drawing=false;continue}
     if(drawing)ctx.lineTo(point.x,point.y);
     else ctx.moveTo(point.x,point.y);
     drawing=true;
    }
    ctx.lineWidth=altitude===0?2:1;
    ctx.stroke();
   }
   ctx.font='13px system-ui';
   ctx.fillStyle='#bcd0e4';
   for(const [az,label] of [[0,'N'],[90,'E'],[180,'S'],[270,'W']] as const){
    const point=project(az,0);
    if(point)ctx.fillText(label,point.x+5,point.y-8);
   }
   if(!daylight)for(const {p,vector} of starVectors){
    if(twilight&&p.magnitude>.8)continue;
    const point=projectVector(vector);
    if(!point||point.x<-4||point.y<-4||point.x>width+4||point.y>height+4)continue;
    const color=p.colorIndex;
    ctx.fillStyle=(color??.55)<.3?'#c7d9ff':(color??.55)>1?'#ffcfad':'#ffeed4';
    ctx.globalAlpha=Math.max(.19,.89-p.magnitude*.14);
    ctx.beginPath();
    ctx.arc(point.x,point.y,Math.max(.65,2.12-p.magnitude*.29),0,2*Math.PI);
    ctx.fill();
   }
   ctx.globalAlpha=1;
   for(const p of planets){
    const point=project(p.azimuth,p.altitude);
    if(!point)continue;
    ctx.fillStyle=p.altitude<0?'#8194b3':p.key===selected?'#ffdc9a':'#f0f4ff';
    ctx.beginPath();
    ctx.arc(point.x,point.y,p.key===selected?6:4,0,2*Math.PI);
    ctx.fill();
    ctx.fillText(p.name,point.x+10,point.y-6);
   }
  }
  const observer=new ResizeObserver(draw);
  observer.observe(el);
  draw();
  return()=>observer.disconnect();
 },[view,planets,starVectors,selected]);
 return <section className="birth-horizon" aria-label="Observed birth sky">
  <h2>Birthplace horizon</h2>
  <p>{chart.birth.place} · {chart.utc.replace('T',' ').slice(0,16)} UTC{chart.uncertain?' · noon reference':''}</p>
  <canvas ref={canvas} aria-label="Perspective projection of calculated sky directions" onPointerDown={e=>{
   drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);
  }} onPointerMove={e=>{
   const previous=drag.current;
   if(!previous)return;
   const dx=e.clientX-previous.x,dy=e.clientY-previous.y;
   drag.current={x:e.clientX,y:e.clientY};
   setView(v=>({azimuth:v.azimuth-dx*.22,altitude:Math.max(-89,Math.min(89,v.altitude+dy*.22))}));
  }} onLostPointerCapture={()=>{drag.current=null}}/>
  <div className="horizon-controls" aria-label="Point toward a celestial body">
   {planets.map(p=><button key={p.key} aria-pressed={p.key===selected} onClick={()=>{setSelected(p.key);setView({azimuth:p.azimuth,altitude:p.altitude})}}>{p.name}</button>)}
   <button onClick={()=>setView({azimuth:0,altitude:16})}>Face north</button>
  </div>
  <p aria-live="polite"><strong>{active.name}</strong> · Azimuth {active.azimuth.toFixed(2)}° · Altitude {active.altitude.toFixed(2)}° · {active.altitude>=0?'Above':'Below'} horizon
   {active.key==='moon'&& ` · ${(active.illumination!*100).toFixed(1)}% illuminated`}</p>
  <p className="form-help">Drag to look around. Positions use topocentric geometry at sea level with no atmospheric refraction. Marker sizes are enlarged. Background color follows Sun altitude, while weather, terrain and star proper motion are omitted.</p>
 </section>;
}
