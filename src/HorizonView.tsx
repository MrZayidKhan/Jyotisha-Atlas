import { assetUrl } from './assetUrl';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Chart } from './engine';
import { birthHorizon, type CatalogStar } from './horizon';
import './results-views.css';

const radians=Math.PI/180;
let catalogRequest:Promise<CatalogStar[]|undefined>|undefined;
function loadCatalog(){
 return catalogRequest??=fetch(assetUrl('hyg-stars.json'))
  .then(response=>response.ok?response.json():null)
  .then(data=>Array.isArray(data)&&data.length?data:undefined)
  .catch(()=>{catalogRequest=undefined;return undefined});
}
function direction(azimuth:number,altitude:number){
 const a=azimuth*radians,h=altitude*radians;
 return [Math.sin(a)*Math.cos(h),Math.sin(h),-Math.cos(a)*Math.cos(h)] as const;
}
export default function HorizonView({chart}:{chart:Chart}){
 const [catalog,setCatalog]=useState<CatalogStar[]>();
 useEffect(()=>{
  let mounted=true;
  void loadCatalog().then(data=>{if(mounted&&data)setCatalog(data)});
  return()=>{mounted=false};
 },[]);
 const {planets,stars}=useMemo(()=>birthHorizon(chart,catalog),[chart,catalog]);
 const starVectors=useMemo(()=>stars.filter(p=>p.altitude>=0).map(p=>({p,vector:direction(p.azimuth,p.altitude)})),[stars]);
 const [selected,setSelected]=useState('moon');
 const [view,setView]=useState({
  azimuth:planets[1].azimuth,
  altitude:planets[1].altitude,
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
   const pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr);
   if(el.width!==pixelWidth)el.width=pixelWidth;
   if(el.height!==pixelHeight)el.height=pixelHeight;
   ctx.setTransform(dpr,0,0,dpr,0,0);
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
   gradient.addColorStop(0,daylight?'#225389':twilight?'#11172f':'#040916');
   gradient.addColorStop(1,daylight?'#b2ccd8':twilight?'#81626f':'#1b304d');
   ctx.fillStyle=gradient;
   ctx.fillRect(0,0,width,height);
   const horizonY=Math.max(0,Math.min(height,height/2+focal*Math.tan(pitch*radians)));
   const sun=project(planets[0].azimuth,planets[0].altitude);
   if(sun&&(daylight||twilight)){
    const radius=height*.65;
    const glow=ctx.createRadialGradient(sun.x,sun.y,0,sun.x,sun.y,radius);
    glow.addColorStop(0,daylight?'#fff1b2bb':'#ffc18670');
    glow.addColorStop(.29,daylight?'#ffdda155':'#e48c782d');
    glow.addColorStop(1,'#ffc18600');
    ctx.fillStyle=glow;
    ctx.fillRect(0,0,width,horizonY);
   }
   const ground=ctx.createLinearGradient(0,horizonY,0,Math.max(height,horizonY+1));
   ground.addColorStop(0,daylight?'#294553':'#132333');
   ground.addColorStop(1,'#040811');
   ctx.fillStyle=ground;
   ctx.fillRect(0,horizonY,width,height-horizonY);
   for(const altitude of [-30,0,30,60]){
    ctx.strokeStyle=altitude===0?'#d4e0eb9c':'#a8bcce31';
    ctx.beginPath();
    let drawing=false;
    for(let az=0;az<=360;az+=2){
     const point=project(az,altitude);
     if(!point){drawing=false;continue}
     if(drawing)ctx.lineTo(point.x,point.y);
     else ctx.moveTo(point.x,point.y);
     drawing=true;
    }
    ctx.lineWidth=altitude===0?1.5:1;
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
   const labels:{left:number;top:number;right:number;bottom:number}[]=[];
   for(const p of [...planets].sort((a,b)=>Number(b.key===selected)-Number(a.key===selected))){
    const point=project(p.azimuth,p.altitude);
    if(!point||point.x<0||point.y<0||point.x>width||point.y>height)continue;
    const focused=p.key===selected;
    ctx.fillStyle=p.altitude<0?'#8194b3':p.key==='sun'||focused?'#ffdc9a':'#f0f4ff';
    ctx.beginPath();
    ctx.arc(point.x,point.y,p.key==='sun'?6:focused?5:3,0,2*Math.PI);
    ctx.fill();
    if(focused){
     ctx.strokeStyle='#ffdc9a9e';
     ctx.beginPath();
     ctx.arc(point.x,point.y,10,0,2*Math.PI);
     ctx.stroke();
    }
    const labelWidth=ctx.measureText(p.name).width;
    const left=Math.max(6,Math.min(point.x+12,width-labelWidth-10));
    const top=Math.max(4,point.y-24);
    const box={left:left-4,top,right:left+labelWidth+4,bottom:top+20};
    if(labels.some(label=>box.left<label.right&&box.right>label.left&&box.top<label.bottom&&box.bottom>label.top))continue;
    labels.push(box);
    ctx.fillStyle='#080f1cdd';
    ctx.fillRect(box.left,box.top,box.right-box.left,20);
    ctx.fillStyle=focused?'#ffdc9a':'#e4edf9';
    ctx.fillText(p.name,left,top+14);
   }
  }
  let frame=0;
  const scheduleDraw=()=>{
   if(frame)return;
   frame=requestAnimationFrame(()=>{frame=0;draw()});
  };
  const observer=new ResizeObserver(scheduleDraw);
  observer.observe(el);
  scheduleDraw();
  return()=>{observer.disconnect();cancelAnimationFrame(frame)};
 },[view,planets,starVectors,selected]);
 return <section className="birth-horizon" aria-label="Observed birth sky">
  <h2>Birthplace horizon</h2>
  <p>{chart.birth.place} · {chart.utc.replace('T',' ').slice(0,16)} UTC{chart.uncertain?' · noon reference':''}</p>
  <div className="horizon-frame">
  <canvas ref={canvas} tabIndex={0} aria-label="Birth sky. Use the arrow keys to look around." onKeyDown={event=>{
   const delta={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,8],ArrowDown:[0,-8]}[event.key];
   if(!delta)return;
   event.preventDefault();
   setView(value=>({azimuth:value.azimuth+delta[0],altitude:Math.max(-89,Math.min(89,value.altitude+delta[1]))}));
  }} onPointerDown={e=>{
   drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);
  }} onPointerMove={e=>{
   const previous=drag.current;
   if(!previous)return;
   const dx=e.clientX-previous.x,dy=e.clientY-previous.y;
   drag.current={x:e.clientX,y:e.clientY};
   setView(v=>({azimuth:v.azimuth-dx*.22,altitude:Math.max(-89,Math.min(89,v.altitude+dy*.22))}));
  }} onLostPointerCapture={()=>{drag.current=null}}/>
  <div className="horizon-bearing" aria-hidden="true">{Math.round((view.azimuth%360+360)%360)%360}° azimuth · {Math.round(view.altitude)}° altitude</div>
  </div>
  <div className="horizon-controls" aria-label="Point toward a celestial body">
   {planets.map(p=><button key={p.key} aria-pressed={p.key===selected} onClick={()=>{setSelected(p.key);setView({azimuth:p.azimuth,altitude:p.altitude})}}>{p.name}</button>)}
   <button onClick={()=>setView({azimuth:0,altitude:16})}>Face north</button>
  </div>
  <dl className="horizon-data" aria-label={active.name} aria-live="polite">
   <div><dt>Body</dt><dd>{active.name}</dd></div>
   <div><dt>Azimuth</dt><dd>{active.azimuth.toFixed(1)}°</dd></div>
   <div><dt>Altitude</dt><dd>{active.altitude.toFixed(1)}°</dd></div>
   <div><dt>Visibility</dt><dd>{active.altitude>=0?'Above horizon':'Below horizon'}</dd></div>
   {active.key==='moon'&&active.illumination!==undefined&&<div><dt>Illuminated</dt><dd>{(active.illumination*100).toFixed(1)}%</dd></div>}
  </dl>
  <details className="horizon-method"><summary>How to read this view</summary><p>Drag or use the arrow keys to look around. Azimuth is measured clockwise from north. Altitude is the angle above or below the horizon. This sea-level view uses enlarged markers and omits weather, terrain, atmospheric refraction and star proper motion.</p></details>
 </section>;
}
