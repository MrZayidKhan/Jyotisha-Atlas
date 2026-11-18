import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import type {Chart} from './engine';
import {bodies,destinationInfo,worldPosition,type Destination} from './observatoryModel';

interface Props {chart:Chart;destination:Destination;intro:boolean;paused:boolean;reducedMotion:boolean;reset:number;onSelect:(key:Destination)=>void;onReady:()=>void;onProgress:(value:number)=>void;onUnavailable:()=>void}
interface Actor {group:THREE.Group;mesh:THREE.Mesh;radius:number;label:HTMLButtonElement|null}
export default function SpaceScene(props:Props){
 const host=useRef<HTMLDivElement>(null),labels=useRef<HTMLDivElement>(null);
 const live=useRef(props);live.current=props;
 const controller=useRef<{move:(key:Destination,intro:boolean)=>void}|null>(null);
 useEffect(()=>{controller.current?.move(props.destination,props.intro)},[props.destination,props.intro,props.reset,props.reducedMotion]);
 useEffect(()=>{
  const el=host.current,labelHost=labels.current;if(!el||!labelHost)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false})}catch{live.current.onUnavailable();return}
  const mobile=el.clientWidth<760;
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:1.8));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.setClearColor(0x03050b);el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(42,1,.06,1400);camera.position.set(35,44,68);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.enablePan=false;controls.rotateSpeed=.48;controls.zoomSpeed=.6;controls.minDistance=3;controls.maxDistance=140;controls.target.set(0,0,0);
  const textures:THREE.Texture[]=[],materials:THREE.Material[]=[],geometries:THREE.BufferGeometry[]=[],actors=new Map<string,Actor>(),pickables:THREE.Object3D[]=[];
  let disposed=false,frame=0,loaded=false,textureError=false;
  const manager=new THREE.LoadingManager();
  manager.onProgress=(_,complete,total)=>live.current.onProgress(Math.round(complete/total*100));
  manager.onError=()=>{textureError=true};
  const loader=new THREE.TextureLoader(manager);
  function map(file:string){const texture=loader.load(`/textures/${file}`);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.push(texture);return texture}
  function material<T extends THREE.Material>(m:T){materials.push(m);return m}
  function geometry<T extends THREE.BufferGeometry>(g:T){geometries.push(g);return g}
  function textTexture(text:string,color='#c3b695'){
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const context=canvas.getContext('2d')!;context.font='400 26px monospace';context.textAlign='center';context.fillStyle=color;context.fillText(text,256,55);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);return texture;
  }
  const sky=new THREE.Mesh(geometry(new THREE.SphereGeometry(650,64,32)),material(new THREE.MeshBasicMaterial({map:map(mobile?'2k_stars_milky_way.jpg':'4k_stars_milky_way.jpg'),side:THREE.BackSide,color:0xb8c2de,depthWrite:false,toneMapped:false})));sky.rotation.set(.6,-.8,.2);scene.add(sky);
  scene.add(new THREE.AmbientLight(0xa5b5dc,.22));
  const keyLight=new THREE.DirectionalLight(0xfff0d8,3.1);keyLight.position.set(35,25,38);scene.add(keyLight);
  const fillLight=new THREE.DirectionalLight(0x6889d3,.32);fillLight.position.set(-40,-6,-20);scene.add(fillLight);
  const earth=new THREE.Mesh(geometry(new THREE.SphereGeometry(1.15,64,40)),material(new THREE.MeshStandardMaterial({map:map('2k_earth_daymap.jpg'),roughness:.85})));scene.add(earth);
  const sharedSphere=geometry(new THREE.SphereGeometry(1,96,64));
  function makeLabel(key:string,title:string,subtitle:string){const button=document.createElement('button');button.className='world-label';button.dataset.body=key;const titleEl=document.createElement('strong');titleEl.textContent=title;const sub=document.createElement('span');sub.textContent=subtitle;button.append(titleEl,sub);button.setAttribute('aria-label',`Explore ${title}`);button.addEventListener('click',()=>live.current.onSelect(key as Destination));labelHost!.appendChild(button);return button}
  for(const p of props.chart.placements){
   if(!bodies[p.key])continue;
   const config=bodies[p.key],group=new THREE.Group();group.position.set(...worldPosition(p.longitude,config.orbit));
   const surface=map(p.key==='moon'&&!mobile?'4k_moon.jpg':config.texture);
   const bodyMaterial=material(new THREE.MeshStandardMaterial({map:surface,roughness:p.key==='venus'?.86:.98,metalness:0,...(p.key==='sun'?{emissive:0xffffff,emissiveMap:surface,emissiveIntensity:1.35}:{})}));
   const sphere=new THREE.Mesh(sharedSphere,bodyMaterial);sphere.scale.setScalar(config.radius);sphere.rotation.y=p.key==='moon'?-.45:Math.PI*.3;sphere.userData.destination=p.key;group.add(sphere);pickables.push(sphere);
   if(p.key==='saturn'){
    group.rotation.z=.38;
    const inner=config.radius*1.25,outer=config.radius*2.25;
    const ringGeometry=geometry(new THREE.RingGeometry(inner,outer,180,1));const positions=ringGeometry.getAttribute('position'),uv=ringGeometry.getAttribute('uv');
    for(let i=0;i<positions.count;i++){const r=Math.hypot(positions.getX(i),positions.getY(i));uv.setXY(i,(r-inner)/(outer-inner),.5)}
    const ring=new THREE.Mesh(ringGeometry,material(new THREE.MeshStandardMaterial({map:map('2k_saturn_ring_alpha.png'),side:THREE.DoubleSide,transparent:true,opacity:.9,roughness:1,depthWrite:false})));ring.rotation.x=-Math.PI/2;ring.userData.destination='saturn';group.add(ring);pickables.push(ring);
   }
   if(p.key==='venus'||p.key==='sun'){
    const rimMaterial=material(new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,uniforms:{tint:{value:new THREE.Color(p.key==='sun'?0xff8a24:0xdac8a3)}},vertexShader:'varying vec3 vNormal; varying vec3 vPosition; void main(){vec4 positionMV=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vPosition=positionMV.xyz;gl_Position=projectionMatrix*positionMV;}',fragmentShader:'uniform vec3 tint; varying vec3 vNormal; varying vec3 vPosition; void main(){float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(-vPosition))),3.5);gl_FragColor=vec4(tint,rim*0.19);}'}));
    const rim=new THREE.Mesh(sharedSphere,rimMaterial);rim.scale.setScalar(config.radius*1.07);group.add(rim);
   }
   scene.add(group);actors.set(p.key,{group,mesh:sphere,radius:config.radius,label:makeLabel(p.key,p.name,config.english)});
  }
  // Zodiac geometry is a coordinate scaffold, not simulated planetary orbits.
  const dial=new THREE.Group();scene.add(dial);
  const rashiRadius=47,nakRadius=43.5;
  function arc(start:number,end:number,radius:number,color:number,opacity:number){const points:THREE.Vector3[]=[];for(let a=start;a<=end+.01;a+=.5)points.push(new THREE.Vector3(...worldPosition(a,radius)));const line=new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints(points)),material(new THREE.LineBasicMaterial({color,transparent:true,opacity})));dial.add(line);return line}
  arc(0,360,rashiRadius,0xb5a17e,.37);arc(0,360,nakRadius,0xa0afcd,.18);
  const shortSigns=['MESHA','VRISHABHA','MITHUNA','KARKA','SIMHA','KANYA','TULA','VRISCHIKA','DHANU','MAKARA','KUMBHA','MEENA'];
  shortSigns.forEach((name,i)=>{
   const angle=i*30,points=[new THREE.Vector3(...worldPosition(angle,45.7)),new THREE.Vector3(...worldPosition(angle,48.3))];dial.add(new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints(points)),material(new THREE.LineBasicMaterial({color:0xb6a580,transparent:true,opacity:.55}))));
   const label=new THREE.Sprite(material(new THREE.SpriteMaterial({map:textTexture(name),transparent:true,depthWrite:false,opacity:.75})));label.position.set(...worldPosition(angle+15,51));label.scale.set(8,1.5,1);dial.add(label);
  });
  for(let i=0;i<27;i++){const points=[new THREE.Vector3(...worldPosition(i*360/27,43)),new THREE.Vector3(...worldPosition(i*360/27,44))];dial.add(new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints(points)),material(new THREE.LineBasicMaterial({color:0x7d9bbf,transparent:true,opacity:.3}))));}
  const highlights=new THREE.Group();scene.add(highlights);
  const coordinateMarker=new THREE.Mesh(geometry(new THREE.SphereGeometry(.26,16,12)),material(new THREE.MeshBasicMaterial({color:0xf3d59c})));highlights.add(coordinateMarker);coordinateMarker.visible=false;
  const selectedArcMaterial=material(new THREE.MeshBasicMaterial({color:0xd9b879,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false}));
  let highlight:THREE.Mesh|null=null;
  const connection=new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(1,0,0)])),material(new THREE.LineDashedMaterial({color:0xc7b485,transparent:true,opacity:.45,dashSize:.5,gapSize:.4})));scene.add(connection);
  // Nodes deliberately use wire geometry; they are intersections, not worlds.
  for(const p of props.chart.placements.filter(p=>['rahu','ketu'].includes(p.key))){const group=new THREE.Group();group.position.set(...worldPosition(p.longitude,33));const marker=new THREE.Mesh(geometry(new THREE.TorusGeometry(1.3,.035,8,80)),material(new THREE.MeshBasicMaterial({color:p.key==='rahu'?0x9cb4e3:0xe4bb86})));marker.rotation.x=Math.PI/2;marker.userData.destination=p.key;group.add(marker);const axis=new THREE.Mesh(geometry(new THREE.OctahedronGeometry(.5,0)),material(new THREE.MeshBasicMaterial({color:0xaab9d4,wireframe:true})));group.add(axis);scene.add(group);pickables.push(marker,axis);axis.userData.destination=p.key;actors.set(p.key,{group,mesh:axis,radius:1.3,label:makeLabel(p.key,p.name,'LUNAR NODE')})}
  let focused:Destination=live.current.destination;
  const currentLook=new THREE.Vector3(),startLook=new THREE.Vector3(),endLook=new THREE.Vector3(),startCamera=new THREE.Vector3(),endCamera=new THREE.Vector3();
  let travelStart=performance.now(),travelDuration=0,traveling=false;
  const curve=new THREE.CubicBezierCurve3(new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3());
  function framing(){const w=el!.clientWidth,h=el!.clientHeight;camera.clearViewOffset();if(focused!=='overview'){if(w>760)camera.setViewOffset(w,h,w*.13,0,w,h);else camera.setViewOffset(w,h,0,h*.16,w,h)}camera.updateProjectionMatrix()}
  function move(key:Destination,intro:boolean){
   focused=key;framing();const info=destinationInfo(props.chart,key);
   if(highlight){highlights.remove(highlight);highlight.geometry.dispose();highlight=null}
   const isSector=['rashi','nakshatra','lagna'].includes(key),actor=actors.get(info.key);
   coordinateMarker.visible=isSector;
   if(isSector)coordinateMarker.position.set(...worldPosition(key==='lagna'?props.chart.lagna??0:info.placement.longitude,47));
   if(key==='overview'){
    endLook.set(0,0,0);endCamera.set(0,65,70);if(el!.clientWidth<760)endCamera.multiplyScalar(1.4);controls.minDistance=35;controls.maxDistance=180;
   }else if(isSector){
    const width=key==='nakshatra'?360/27:30,start=key==='lagna'?Math.floor((props.chart.lagna??0)/30)*30:key==='rashi'?info.placement.sign*30:Math.floor(info.placement.longitude/(360/27))*360/27;
    const geo=new THREE.RingGeometry(nakRadius-1,rashiRadius+1,96,1,-(start+width)*Math.PI/180,width*Math.PI/180);geometries.push(geo);highlight=new THREE.Mesh(geo,selectedArcMaterial);highlight.rotation.x=Math.PI/2;highlights.add(highlight);
    endLook.set(...worldPosition(info.longitude,43));const radial=new THREE.Vector3(...worldPosition(info.longitude,1));endCamera.copy(endLook).addScaledVector(radial,15).add(new THREE.Vector3(0,24,8));controls.minDistance=10;controls.maxDistance=75;
   }else if(actor){
    const radius=actor.radius*(key==='saturn'?1.7:1),fit=el!.clientWidth<=760?Math.max(1,.85/camera.aspect):1;endLook.copy(actor.group.position);endCamera.copy(endLook).add(new THREE.Vector3(radius*.35,radius*.7,radius*4.9*fit));controls.minDistance=radius*1.65;controls.maxDistance=radius*15;
   }
   if(actor&&key!=='overview'){
    const position=isSector?new THREE.Vector3(...worldPosition(info.placement.longitude,48)):actor.group.position;const points=[new THREE.Vector3(0,.03,0),new THREE.Vector3(position.x,.03,position.z)];connection.geometry.setFromPoints(points);connection.computeLineDistances();connection.visible=isSector;
   }else if(key==='lagna'){connection.geometry.setFromPoints([new THREE.Vector3(),new THREE.Vector3(...worldPosition(props.chart.lagna??0,48))]);connection.computeLineDistances();connection.visible=true}else connection.visible=false;
   if(intro&&!live.current.reducedMotion){camera.position.set(endLook.x+25,28,endLook.z+42);controls.target.set(0,0,0)}
   startCamera.copy(camera.position);startLook.copy(controls.target);travelStart=performance.now();travelDuration=live.current.reducedMotion?0:intro?5800:2200;traveling=true;controls.enabled=false;
   curve.v0.copy(startCamera);curve.v1.copy(startCamera).add(new THREE.Vector3(0,intro?18:9,0));curve.v2.copy(endCamera).add(new THREE.Vector3(intro?-12:0,intro?8:5,8));curve.v3.copy(endCamera);
   if(travelDuration===0){camera.position.copy(endCamera);controls.target.copy(endLook);controls.update();traveling=false;controls.enabled=true}
  }
  controller.current={move};
  const resize=()=>{const w=el!.clientWidth,h=el!.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;framing();if(loaded)move(focused,false)};resize();const ro=new ResizeObserver(resize);ro.observe(el);
  manager.onLoad=()=>{if(disposed)return;if(textureError){live.current.onUnavailable();return}loaded=true;move(live.current.destination,live.current.intro);live.current.onReady();};
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart={x:0,y:0};
  const down=(e:PointerEvent)=>{pointerStart={x:e.clientX,y:e.clientY}};
  const up=(e:PointerEvent)=>{if(Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>6||!loaded)return;const bounds=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(pickables.filter(object=>object.parent?.visible))[0];if(hit?.object.userData.destination)live.current.onSelect(hit.object.userData.destination)};
  const lost=(e:Event)=>{e.preventDefault();live.current.onUnavailable()};renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('webglcontextlost',lost);
  let last=performance.now();const projected=new THREE.Vector3(),direction=new THREE.Vector3();
  function render(now:number){if(disposed)return;frame=requestAnimationFrame(render);if(document.hidden){last=now;return}const dt=Math.min((now-last)/1000,.05);last=now;
   if(traveling){const t=Math.min(1,(now-travelStart)/Math.max(1,travelDuration)),ease=t*t*t*(t*(t*6-15)+10);camera.position.copy(curve.getPoint(ease));currentLook.lerpVectors(startLook,endLook,ease);controls.target.copy(currentLook);camera.lookAt(currentLook);if(t===1){traveling=false;controls.enabled=true;controls.update()}}
   else controls.update();
   if(!live.current.paused&&!live.current.reducedMotion){actors.forEach((actor,key)=>{if(!['rahu','ketu'].includes(key))actor.mesh.rotation.y+=dt*(key==='moon'?.018:.035)});earth.rotation.y+=dt*.025}
   const selectedActor=actors.get(destinationInfo(props.chart,focused).key);const lightTarget=selectedActor?.group.position??new THREE.Vector3();keyLight.position.copy(lightTarget).add(new THREE.Vector3(12,8,14));keyLight.target.position.copy(lightTarget);if(!keyLight.target.parent)scene.add(keyLight.target);
   actors.forEach((actor,key)=>{if(!actor.label)return;const show=loaded&&!live.current.intro&&(focused==='overview'||key===focused);actor.label.style.display=show?'block':'none';if(!show)return;projected.copy(actor.group.position);projected.y+=actor.radius*1.4;direction.copy(projected).sub(camera.position);if(direction.dot(camera.getWorldDirection(new THREE.Vector3()))<=0){actor.label.style.display='none';return}projected.project(camera);actor.label.style.transform=`translate(${(projected.x*.5+.5)*el!.clientWidth}px,${(-projected.y*.5+.5)*el!.clientHeight}px) translate(-50%,-100%)`;actor.label.style.opacity=traveling?'0':'1'});
   const sector=['rashi','nakshatra','lagna'].includes(focused),activeKey=destinationInfo(props.chart,focused).key;
   actors.forEach((actor,key)=>{actor.group.visible=focused==='overview'||(sector?key==='moon':key===activeKey)});
   dial.visible=focused==='overview'||sector;earth.visible=focused==='overview'||sector;
   renderer.render(scene,camera);
  }frame=requestAnimationFrame(render);
  return()=>{disposed=true;cancelAnimationFrame(frame);controller.current=null;ro.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('webglcontextlost',lost);textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());renderer.dispose();renderer.domElement.remove();labelHost.replaceChildren()};
 },[props.chart]);
 return <><div className="universe-canvas" ref={host} aria-label="3D models of the planets and Moon. Use the chapter buttons to select a destination."/><div className="world-labels" ref={labels}/></>;
}
