import { useEffect, useMemo, useRef, useState } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import type { Chart } from './engine';
import { birthHorizon } from './horizon';

const radians=Math.PI/180;
function direction(azimuth:number,altitude:number){
 const a=azimuth*radians,h=altitude*radians;
 return new Vector3(Math.sin(a)*Math.cos(h),Math.sin(h),-Math.cos(a)*Math.cos(h));
}
export default function HorizonView({chart}:{chart:Chart}){
 const {planets,stars}=useMemo(()=>birthHorizon(chart),[chart]);
 const [selected,setSelected]=useState('moon');
 const [view,setView]=useState({azimuth:planets[1].azimuth,altitude:planets[1].altitude});
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
   const camera=new PerspectiveCamera(60,width/height,.1,200);
   const forward=direction(view.azimuth,Math.max(-89.9,Math.min(89.9,view.altitude)));
   camera.lookAt(forward);
   camera.updateMatrixWorld();
   const project=(az:number,alt:number)=>{
    const vector=direction(az,alt);
    if(vector.dot(forward)<.05)return null;
    vector.multiplyScalar(10).project(camera);
    return {x:(vector.x+1)*width/2,y:(1-vector.y)*height/2};
   };
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
   for(const p of [...stars,...planets]){
    const point=project(p.azimuth,p.altitude);
    if(!point)continue;
    const star=p.distance===undefined;
    if(star&&(p.altitude<0||daylight||(twilight&&p.magnitude>.8)))continue;
    ctx.fillStyle=p.altitude<0?'#8194b3':p.key===selected?'#ffdc9a':'#f0f4ff';
    ctx.beginPath();
    ctx.arc(point.x,point.y,star?Math.max(1,2.6-p.magnitude*.5):p.key===selected?6:4,0,2*Math.PI);
    ctx.fill();
    if(!star)ctx.fillText(p.name,point.x+10,point.y-6);
   }
  }
  const observer=new ResizeObserver(draw);
  observer.observe(el);
  draw();
  return()=>observer.disconnect();
 },[view,planets,stars,selected]);
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
   <button onClick={()=>setView({azimuth:0,altitude:0})}>Face north</button>
  </div>
  <p aria-live="polite"><strong>{active.name}</strong> · Azimuth {active.azimuth.toFixed(2)}° · Altitude {active.altitude.toFixed(2)}° · {active.altitude>=0?'Above':'Below'} horizon
   {active.key==='moon'&& ` · ${(active.illumination!*100).toFixed(1)}% illuminated`}</p>
  <p className="form-help">Drag to look around. Positions use topocentric geometry at sea level with no atmospheric refraction. Marker sizes are enlarged. Background color follows Sun altitude, while weather, terrain and star proper motion are omitted.</p>
 </section>;
}
