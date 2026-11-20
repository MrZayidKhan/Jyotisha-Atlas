import { assetUrl } from './assetUrl';
import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import type {Chart} from './engine';
import {bodies,destinationInfo,worldPosition,type Destination} from './observatoryModel';
import {solarEffects} from './solarEffects';
import {makeStarField} from './starField';

interface Props {chart:Chart;destination:Destination;intro:boolean;paused:boolean;reducedMotion:boolean;reset:number;onSelect:(key:Destination)=>void;onReady:()=>void;onProgress:(value:number)=>void;onUnavailable:()=>void}
interface Actor {group:THREE.Group;mesh:THREE.Mesh;radius:number;label:HTMLButtonElement|null;focusOffset?:THREE.Vector3}
export default function SpaceScene(props:Props){
 const host=useRef<HTMLDivElement>(null),labels=useRef<HTMLDivElement>(null);
 const live=useRef(props);live.current=props;
 const controller=useRef<{move:(key:Destination,intro:boolean)=>void;request:()=>void}|null>(null);
 useEffect(()=>{controller.current?.move(props.destination,props.intro)},[props.destination,props.intro,props.reset,props.reducedMotion]);
 useEffect(()=>{controller.current?.request()},[props.paused]);
 useEffect(()=>{
  const el=host.current,labelHost=labels.current;if(!el||!labelHost)return;
  let renderer:THREE.WebGLRenderer;
  const mobile=el.clientWidth<760;
  try{renderer=new THREE.WebGLRenderer({antialias:!mobile,powerPreference:mobile?'low-power':'default',alpha:false})}catch{live.current.onUnavailable();return}
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.7));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.setClearColor(0x03050b);el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(42,1,.06,1400);camera.position.set(35,44,68);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.enablePan=false;controls.rotateSpeed=.48;controls.zoomSpeed=.6;controls.minDistance=3;controls.maxDistance=140;controls.target.set(0,0,0);
  const textures:THREE.Texture[]=[],materials:THREE.Material[]=[],geometries:THREE.BufferGeometry[]=[],actors=new Map<string,Actor>(),pickables:THREE.Object3D[]=[];
  let disposed=false,frame=0,loaded=false,inView=true,hasMoonCloseup=false;
  const loader=new THREE.TextureLoader();
  const loads=new Map<string,Promise<THREE.Texture|null>>();
  const upgrades=new Map<string,()=>void>();
  let solar:ReturnType<typeof solarEffects>|undefined;
  function map(file:string,colorSpace:string=THREE.SRGBColorSpace){
   const cached=loads.get(file);if(cached)return cached;
   const loading=loader.loadAsync(assetUrl(`textures/${file}`)).then(texture=>{
    if(disposed){texture.dispose();return null}
    texture.colorSpace=colorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.push(texture);
    return texture;
   },()=>null);
   loads.set(file,loading);
   return loading;
  }
  function applyMap(file:string,surface:THREE.MeshStandardMaterial,body?:string){
   return map(file).then(texture=>{
    if(!texture||disposed)return;
    surface.map=texture;surface.color.set(0xffffff);
    if(body==='sun')surface.emissiveMap=texture;
    surface.needsUpdate=true;request();
   });
  }
  function material<T extends THREE.Material>(m:T){materials.push(m);return m}
  function geometry<T extends THREE.BufferGeometry>(g:T){geometries.push(g);return g}
  function textTexture(text:string,color='#c3b695'){
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const context=canvas.getContext('2d')!;context.font='400 26px monospace';context.textAlign='center';context.fillStyle=color;context.fillText(text,256,55);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);return texture;
  }
  const skyMaterial=material(new THREE.MeshBasicMaterial({side:THREE.BackSide,color:0x0a1125,depthWrite:false,toneMapped:false}));
  const sky=new THREE.Mesh(geometry(new THREE.SphereGeometry(650,48,24)),skyMaterial);
  sky.rotation.set(.07,Math.PI/2,-.18);sky.rotateX(.30);sky.renderOrder=-2;scene.add(sky);
  const stars=makeStarField(mobile?1750:3600);
  stars.material.uniforms.pixelRatio.value=renderer.getPixelRatio();
  stars.renderOrder=-1;scene.add(stars);geometries.push(stars.geometry);materials.push(stars.material);
  const panorama=map('sky-2k.webp').then(texture=>{if(!texture||disposed)return;skyMaterial.map=texture;skyMaterial.color.set(0xc4d2ff);skyMaterial.needsUpdate=true;request()});
  scene.add(new THREE.AmbientLight(0xd5deef,.18));
  const keyLight=new THREE.DirectionalLight(0xfff3e1,2.35);scene.add(keyLight,keyLight.target);
  const fillLight=new THREE.DirectionalLight(0xadc7f1,.15);fillLight.position.set(-40,-6,-20);scene.add(fillLight);
  const earthMaterial=material(new THREE.MeshStandardMaterial({color:0x3c5488,roughness:.85}));
  upgrades.set('earth',()=>{void applyMap('earth.webp',earthMaterial)});
  const earth=new THREE.Mesh(geometry(new THREE.SphereGeometry(1.15,32,20)),earthMaterial);scene.add(earth);
  const overviewSphere=geometry(new THREE.SphereGeometry(1,24,16));
  const focusSphere=geometry(new THREE.SphereGeometry(1,mobile?48:72,mobile?32:48));
  let firstMoon:Promise<void>=Promise.resolve();
  let detailedMoon:Promise<void>|undefined;
  let moonSurface:THREE.MeshStandardMaterial|undefined;
  function makeLabel(key:string,title:string,subtitle:string){const button=document.createElement('button');button.className='world-label';button.dataset.body=key;const titleEl=document.createElement('strong');titleEl.textContent=title;const sub=document.createElement('span');sub.textContent=subtitle;button.append(titleEl,sub);button.setAttribute('aria-label',`Explore ${title}`);button.addEventListener('click',()=>live.current.onSelect(key as Destination));labelHost!.appendChild(button);return button}
  for(const p of props.chart.placements){
   if(!bodies[p.key])continue;
   const config=bodies[p.key],group=new THREE.Group();group.position.set(...worldPosition(p.longitude,config.orbit));
   const fallback:Record<string,number>={moon:0xa49f98,mercury:0xaca79b,mars:0xb36a4a,jupiter:0xb39b81,venus:0xc9af87,saturn:0xd3b690,sun:0xffaa4e};
   const isSun=p.key==='sun';
   const bodyMaterial=material(new THREE.MeshStandardMaterial({color:fallback[p.key],roughness:p.key==='venus'?.86:.98,metalness:0,...(isSun?{emissive:0xffe1a6,emissiveIntensity:2.1}:{})}));
   if(isSun){
    bodyMaterial.onBeforeCompile=shader=>{
     shader.fragmentShader=shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      'float mu = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0); outgoingLight = totalEmissiveRadiance * (0.36 + 0.64 * pow(mu, 0.55));\n#include <opaque_fragment>',
     );
    };
   }
   if(p.key==='moon'){
    moonSurface=bodyMaterial;
    firstMoon=applyMap('moon-preview.webp',bodyMaterial);
    upgrades.set(p.key,()=>{
     detailedMoon=firstMoon.then(()=>{if(!disposed)return applyMap('moon-2k.webp',bodyMaterial)});
     void map('moon-relief.webp',THREE.NoColorSpace).then(bump=>{if(!bump||disposed)return;bodyMaterial.bumpMap=bump;bodyMaterial.bumpScale=.055;bodyMaterial.needsUpdate=true;request()});
    });
   }else upgrades.set(p.key,()=>{void applyMap(config.texture,bodyMaterial,p.key)});
   const sphere=new THREE.Mesh(focusSphere,bodyMaterial);sphere.scale.setScalar(config.radius);sphere.rotation.y=p.key==='moon'?-Math.PI/2:Math.PI*.3;sphere.userData.destination=p.key;group.add(sphere);pickables.push(sphere);
   if(p.key==='saturn'){
    group.rotation.z=.38;
    const inner=config.radius*1.25,outer=config.radius*2.25;
    const ringGeometry=geometry(new THREE.RingGeometry(inner,outer,180,1));const positions=ringGeometry.getAttribute('position'),uv=ringGeometry.getAttribute('uv');
    for(let i=0;i<positions.count;i++){const r=Math.hypot(positions.getX(i),positions.getY(i));uv.setXY(i,(r-inner)/(outer-inner),.5)}
    const ringSurface=material(new THREE.MeshStandardMaterial({color:0xcdb78e,side:THREE.DoubleSide,transparent:true,opacity:.55,roughness:1,depthWrite:false}));
    const loadSaturn=upgrades.get('saturn');
    upgrades.set('saturn',()=>{loadSaturn?.();void map('2k_saturn_ring_alpha.png').then(texture=>{
     if(!texture||disposed)return;ringSurface.map=texture;ringSurface.color.set(0xffffff);ringSurface.opacity=.91;ringSurface.needsUpdate=true;request();
    })});
    const ring=new THREE.Mesh(ringGeometry,ringSurface);ring.rotation.x=-Math.PI/2;ring.userData.destination='saturn';group.add(ring);pickables.push(ring);
   }
   if(p.key==='venus'){
    const rimMaterial=material(new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,uniforms:{tint:{value:new THREE.Color(0xdac8a3)}},vertexShader:'varying vec3 vNormal; varying vec3 vPosition; void main(){vec4 positionMV=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vPosition=positionMV.xyz;gl_Position=projectionMatrix*positionMV;}',fragmentShader:'uniform vec3 tint; varying vec3 vNormal; varying vec3 vPosition; void main(){float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(-vPosition))),3.5);gl_FragColor=vec4(tint,rim*0.19);}'}));
    const rim=new THREE.Mesh(overviewSphere,rimMaterial);rim.scale.setScalar(config.radius*1.07);group.add(rim);
   }
   scene.add(group);actors.set(p.key,{group,mesh:sphere,radius:config.radius,label:makeLabel(p.key,p.name,config.english)});
  }
  // Zodiac geometry is a coordinate scaffold, not simulated planetary orbits.
  const dial=new THREE.Group();scene.add(dial);
  const rashiRadius=47,nakRadius=43.5;
  function arc(start:number,end:number,radius:number,color:number,opacity:number){const points:THREE.Vector3[]=[];for(let a=start;a<=end+.01;a+=.5)points.push(new THREE.Vector3(...worldPosition(a,radius)));const line=new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints(points)),material(new THREE.LineBasicMaterial({color,transparent:true,opacity})));dial.add(line);return line}
  arc(0,360,rashiRadius,0xb5a17e,.37);arc(0,360,nakRadius,0xa0afcd,.18);
  const shortSigns=['MESHA','VRISHABHA','MITHUNA','KARKA','SIMHA','KANYA','TULA','VRISCHIKA','DHANU','MAKARA','KUMBHA','MEENA'];
  const signMarks:THREE.Vector3[]=[],lunarMarks:THREE.Vector3[]=[];
  shortSigns.forEach((name,i)=>{
   const angle=i*30;
   signMarks.push(new THREE.Vector3(...worldPosition(angle,45.7)),new THREE.Vector3(...worldPosition(angle,48.3)));
   const label=new THREE.Sprite(material(new THREE.SpriteMaterial({map:textTexture(name),transparent:true,depthWrite:false,opacity:.75})));label.position.set(...worldPosition(angle+15,51));label.scale.set(8,1.5,1);dial.add(label);
  });
  for(let i=0;i<27;i++)lunarMarks.push(new THREE.Vector3(...worldPosition(i*360/27,43)),new THREE.Vector3(...worldPosition(i*360/27,44)));
  dial.add(new THREE.LineSegments(geometry(new THREE.BufferGeometry().setFromPoints(signMarks)),material(new THREE.LineBasicMaterial({color:0xb6a580,transparent:true,opacity:.55}))));
  dial.add(new THREE.LineSegments(geometry(new THREE.BufferGeometry().setFromPoints(lunarMarks)),material(new THREE.LineBasicMaterial({color:0x7d9bbf,transparent:true,opacity:.3}))));
  const highlights=new THREE.Group();scene.add(highlights);
  const coordinateMarker=new THREE.Mesh(geometry(new THREE.SphereGeometry(.26,16,12)),material(new THREE.MeshBasicMaterial({color:0xf3d59c})));highlights.add(coordinateMarker);coordinateMarker.visible=false;
  const selectedArcMaterial=material(new THREE.MeshBasicMaterial({color:0xd9b879,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false}));
  let highlight:THREE.Mesh|null=null;
  const connection=new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(1,0,0)])),material(new THREE.LineDashedMaterial({color:0xc7b485,transparent:true,opacity:.45,dashSize:.5,gapSize:.4})));scene.add(connection);
  // Orbital-intersection diagrams. Inclination is exaggerated for readability.
  for(const p of props.chart.placements.filter(p=>['rahu','ketu'].includes(p.key))){
   const group=new THREE.Group();group.position.set(...worldPosition(p.longitude,33));
   const ascending=p.key==='rahu',tilt=ascending?-.43:.43,orbitRadius=3.1;
   const gold=0xcbae78,blue=ascending?0x9baddc:0xc9a7d9;
   const ecliptic=new THREE.Group(),lunar=new THREE.Group();ecliptic.position.x=-orbitRadius;lunar.position.x=-orbitRadius;lunar.rotation.x=tilt;group.add(ecliptic,lunar);
   function orbitalPath(color:number,parent:THREE.Group){const points:THREE.Vector3[]=[];for(let i=0;i<=180;i++){const a=i/180*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*orbitRadius,0,Math.sin(a)*orbitRadius))}const path=new THREE.CatmullRomCurve3(points);const tube=new THREE.Mesh(geometry(new THREE.TubeGeometry(path,180,.022,6,false)),material(new THREE.MeshBasicMaterial({color,transparent:true,opacity:.82})));parent.add(tube);tube.userData.destination=p.key;pickables.push(tube)}
   orbitalPath(gold,ecliptic);orbitalPath(blue,lunar);
   const disk=new THREE.Mesh(geometry(new THREE.CircleGeometry(orbitRadius,96)),material(new THREE.MeshBasicMaterial({color:gold,transparent:true,opacity:.045,side:THREE.DoubleSide,depthWrite:false})));disk.rotation.x=-Math.PI/2;ecliptic.add(disk);
   const selectedPoint=new THREE.Mesh(geometry(new THREE.SphereGeometry(.15,24,16)),material(new THREE.MeshBasicMaterial({color:0xffe7bc})));group.add(selectedPoint);selectedPoint.userData.destination=p.key;pickables.push(selectedPoint);
   const halo=new THREE.Mesh(geometry(new THREE.TorusGeometry(.29,.018,8,64)),material(new THREE.MeshBasicMaterial({color:gold})));group.add(halo);
   const opposite=new THREE.Mesh(geometry(new THREE.SphereGeometry(.075,16,12)),material(new THREE.MeshBasicMaterial({color:blue,transparent:true,opacity:.6})));opposite.position.x=-orbitRadius*2;group.add(opposite);
   const direction=new THREE.Vector3(-Math.sin(.18),0,Math.cos(.18));const arrow=new THREE.Mesh(geometry(new THREE.ConeGeometry(.10,.33,16)),material(new THREE.MeshBasicMaterial({color:blue})));arrow.position.set(Math.cos(.18)*orbitRadius,0,Math.sin(.18)*orbitRadius);arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);lunar.add(arrow);
   scene.add(group);actors.set(p.key,{group,mesh:selectedPoint,radius:2.3,focusOffset:new THREE.Vector3(-orbitRadius,0,0),label:makeLabel(p.key,p.name,ascending?'ASCENDING INTERSECTION':'DESCENDING INTERSECTION')});
  }
  let focused:Destination=live.current.destination;
  let activeKey='moon',sector=false;
  const focusDirection=new THREE.Vector3();
  const zero=new THREE.Vector3();
  const currentLook=new THREE.Vector3(),startLook=new THREE.Vector3(),endLook=new THREE.Vector3(),startCamera=new THREE.Vector3(),endCamera=new THREE.Vector3();
  let travelStart=performance.now(),travelDuration=0,traveling=false;
  const curve=new THREE.CubicBezierCurve3(new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3());
  function request(){if(!disposed&&inView&&!document.hidden&&!frame)frame=requestAnimationFrame(render)}
  function upgrade(key:string){const start=upgrades.get(key);if(!start)return;upgrades.delete(key);start()}
  function framing(){const w=el!.clientWidth,h=el!.clientHeight;if(!w||!h)return;camera.clearViewOffset();if(focused!=='overview'){if(w>760)camera.setViewOffset(w,h,w*.13,0,w,h);else camera.setViewOffset(w,h,0,h*.16,w,h)}camera.updateProjectionMatrix()}
  function move(key:Destination,intro:boolean){
   if(!loaded)return;
   focused=key;framing();const info=destinationInfo(props.chart,key);
   if(highlight){highlights.remove(highlight);highlight.geometry.dispose();highlight=null}
   const isSector=['rashi','nakshatra','lagna'].includes(key),actor=actors.get(info.key);
   sector=isSector;activeKey=info.key;
   const target=key==='overview'?zero:actor?.group.position??zero;
   keyLight.position.copy(target).add(focusDirection.set(-11,6,11));keyLight.target.position.copy(target);
   if((key==='sun'||key==='overview')&&!solar){
    solar=solarEffects(bodies.sun.radius);
    actors.get('sun')?.group.add(solar.group);
   }
   if(key==='overview'){
    for(const name of ['earth','sun','mercury','venus','mars','jupiter','saturn','moon'])upgrade(name);
    if(!mobile)void panorama.then(()=>disposed?null:map('sky-4k.webp')).then(texture=>{if(!texture||disposed)return;skyMaterial.map=texture;request()});
   }else{upgrade(isSector?'moon':key);if(isSector)upgrade('earth')}
   dial.visible=key==='overview'||sector;earth.visible=dial.visible;
   actors.forEach((item,name)=>{
    item.group.visible=key==='overview'||(sector?name==='moon':name===activeKey);
    if(bodies[name])item.mesh.geometry=key==='overview'||sector?overviewSphere:focusSphere;
   });
   coordinateMarker.visible=isSector;
   if(isSector)coordinateMarker.position.set(...worldPosition(key==='lagna'?props.chart.lagna??0:info.placement.longitude,47));
   if(key==='overview'){
    endLook.set(0,0,0);endCamera.set(0,65,70);if(el!.clientWidth<760)endCamera.multiplyScalar(1.4);controls.minDistance=35;controls.maxDistance=180;
   }else if(isSector){
    const width=key==='nakshatra'?360/27:30,start=key==='lagna'?Math.floor((props.chart.lagna??0)/30)*30:key==='rashi'?info.placement.sign*30:Math.floor(info.placement.longitude/(360/27))*360/27;
    const geo=new THREE.RingGeometry(nakRadius-1,rashiRadius+1,96,1,-(start+width)*Math.PI/180,width*Math.PI/180);highlight=new THREE.Mesh(geo,selectedArcMaterial);highlight.rotation.x=Math.PI/2;highlights.add(highlight);
    endLook.set(...worldPosition(info.longitude,43));const radial=new THREE.Vector3(...worldPosition(info.longitude,1));endCamera.copy(endLook).addScaledVector(radial,15).add(new THREE.Vector3(0,24,8));controls.minDistance=10;controls.maxDistance=75;
   }else if(actor){
    const radius=actor.radius*(key==='saturn'?1.7:1),fit=el!.clientWidth<=760?Math.max(1,.85/camera.aspect):1;endLook.copy(actor.group.position);if(actor.focusOffset)endLook.add(actor.focusOffset);endCamera.copy(endLook).add(new THREE.Vector3(radius*.35,radius*(actor.focusOffset?1.8:.7),radius*4.9*fit));controls.minDistance=radius*1.65;controls.maxDistance=radius*15;
   }
   if(actor&&key!=='overview'){
    const position=isSector?new THREE.Vector3(...worldPosition(info.placement.longitude,48)):actor.group.position;const points=[new THREE.Vector3(0,.03,0),new THREE.Vector3(position.x,.03,position.z)];connection.geometry.setFromPoints(points);connection.computeLineDistances();connection.visible=isSector;
   }else if(key==='lagna'){connection.geometry.setFromPoints([new THREE.Vector3(),new THREE.Vector3(...worldPosition(props.chart.lagna??0,48))]);connection.computeLineDistances();connection.visible=true}else connection.visible=false;
   if(intro&&!live.current.reducedMotion){camera.position.set(endLook.x+25,28,endLook.z+42);controls.target.set(0,0,0)}
   const alreadyFramed=camera.position.distanceToSquared(endCamera)<.01&&controls.target.distanceToSquared(endLook)<.01;
   startCamera.copy(camera.position);startLook.copy(controls.target);travelStart=performance.now();travelDuration=live.current.reducedMotion||alreadyFramed?0:intro?3350:1350;traveling=true;controls.enabled=false;
   curve.v0.copy(startCamera);curve.v1.copy(startCamera).add(new THREE.Vector3(0,intro?18:9,0));curve.v2.copy(endCamera).add(new THREE.Vector3(intro?-12:0,intro?8:5,8));curve.v3.copy(endCamera);
   if(travelDuration===0){camera.position.copy(endCamera);controls.target.copy(endLook);controls.update();traveling=false;controls.enabled=true}
   request();
  }
  controller.current={move,request};
  const resize=()=>{const w=el!.clientWidth,h=el!.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;framing();request()};resize();const ro=new ResizeObserver(resize);ro.observe(el);
  const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;if(inView)request()});
  observer.observe(el);
  let readyTimer:number|undefined;
  const ready=()=>{if(disposed||loaded)return;clearTimeout(readyTimer);loaded=true;move(live.current.destination,live.current.intro);live.current.onReady()};
  live.current.onProgress(30);
  readyTimer=window.setTimeout(ready,850);
  void Promise.all([panorama,firstMoon]).then(ready);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart={x:0,y:0};
  const down=(e:PointerEvent)=>{pointerStart={x:e.clientX,y:e.clientY}};
  const up=(e:PointerEvent)=>{if(Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>6||!loaded)return;const bounds=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1);raycaster.setFromCamera(pointer,camera);const visible=(object:THREE.Object3D)=>{let current:THREE.Object3D|null=object;while(current){if(!current.visible)return false;current=current.parent}return true};const hit=raycaster.intersectObjects(pickables.filter(visible))[0];if(hit?.object.userData.destination)live.current.onSelect(hit.object.userData.destination)};
  const lost=(e:Event)=>{e.preventDefault();live.current.onUnavailable()};renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('webglcontextlost',lost);
  controls.addEventListener('change',request);
  document.addEventListener('visibilitychange',request);
  let last=0,solarTime=0;
  const projected=new THREE.Vector3(),direction=new THREE.Vector3(),cameraDirection=new THREE.Vector3(),travelPoint=new THREE.Vector3();
  function render(now:number){
   frame=0;
   if(disposed||!inView||document.hidden)return;
   const animated=Boolean(bodies[focused])&&!live.current.paused&&!live.current.reducedMotion;
   if(mobile&&(animated||traveling)&&now-last<27){request();return}
   const dt=Math.min((now-last)/1000,.05);last=now;
   if(traveling){const t=Math.min(1,(now-travelStart)/Math.max(1,travelDuration)),ease=t*t*t*(t*(t*6-15)+10);curve.getPoint(ease,travelPoint);camera.position.copy(travelPoint);currentLook.lerpVectors(startLook,endLook,ease);controls.target.copy(currentLook);camera.lookAt(currentLook);if(t===1){traveling=false;controls.enabled=true;controls.update()}}
   else controls.update();
   if(!traveling&&focused==='moon'&&!hasMoonCloseup&&moonSurface&&detailedMoon&&!mobile&&renderer.capabilities.maxTextureSize>=4096&&camera.position.distanceToSquared(controls.target)<31){
    hasMoonCloseup=true;
    const surface=moonSurface;
    void detailedMoon.then(()=>{if(!disposed)return applyMap('moon-4k.webp',surface)});
   }
   if(animated&&loaded){
    actors.forEach((actor,key)=>{if(actor.group.visible&&bodies[key])actor.mesh.rotation.y+=dt*(key==='moon'?.018:.035)});
    if(focused==='sun')solarTime+=dt;
   }
   solar?.tick(solarTime,focused==='sun');
   camera.getWorldDirection(cameraDirection);
   const {clientWidth:width,clientHeight:height}=el!;
   actors.forEach((actor,key)=>{
    const label=actor.label;if(!label)return;
    const show=loaded&&!live.current.intro&&!traveling&&(focused==='overview'||key===focused);
    if(!show){label.hidden=true;return}
    projected.copy(actor.group.position);projected.y+=actor.radius*1.4;
    direction.copy(projected).sub(camera.position);projected.project(camera);
    label.hidden=direction.dot(cameraDirection)<=0||Math.abs(projected.x)>1||Math.abs(projected.y)>1;
    if(!label.hidden){
     const transform=`translate(${(projected.x*.5+.5)*width}px,${(-projected.y*.5+.5)*height}px) translate(-50%,-100%)`;
     if(label.style.transform!==transform)label.style.transform=transform;
    }
   });
   renderer.render(scene,camera);
   if(traveling||(loaded&&animated))request();
  }
  request();
  return()=>{
   disposed=true;clearTimeout(readyTimer);cancelAnimationFrame(frame);controller.current=null;ro.disconnect();observer.disconnect();
   document.removeEventListener('visibilitychange',request);controls.removeEventListener('change',request);controls.dispose();
   renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('webglcontextlost',lost);
   highlight?.geometry.dispose();solar?.dispose();textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
   renderer.dispose();renderer.domElement.remove();labelHost.replaceChildren();
  };
 },[props.chart]);
 return <><div className="universe-canvas" ref={host} aria-label="3D models of the planets and Moon. Use the chapter buttons to select a destination."/><div className="world-labels" ref={labels}/></>;
}
