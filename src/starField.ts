import { BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three';

export function makeStarField(count:number){
 const positions=new Float32Array(count*3),brightness=new Float32Array(count),tint=new Float32Array(count);
 let seed=1254931;
 const rand=()=>{
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  return seed/4294967296;
 };
 for(let i=0;i<count;i++){
  const z=rand()*2-1,longitude=rand()*Math.PI*2,xy=Math.sqrt(1-z*z),r=470;
  positions[i*3]=Math.cos(longitude)*xy*r;
  positions[i*3+1]=z*r;
  positions[i*3+2]=Math.sin(longitude)*xy*r;
  brightness[i]=.18+Math.pow(rand(),7)*.82;
  tint[i]=rand();
 }
 const geometry=new BufferGeometry();
 geometry.setAttribute('position',new BufferAttribute(positions,3));
 geometry.setAttribute('brightness',new BufferAttribute(brightness,1));
 geometry.setAttribute('tint',new BufferAttribute(tint,1));
 const material=new ShaderMaterial({
  transparent:true,depthWrite:false,
  uniforms:{pixelRatio:{value:1}},
  vertexShader:`
   uniform float pixelRatio;
   attribute float brightness;attribute float tint;
   varying float strength;varying float colorTemperature;
   void main(){
    strength=brightness;colorTemperature=tint;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
    gl_PointSize=(1.45+brightness*2.7)*pixelRatio;
   }`,
  fragmentShader:`
   varying float strength;varying float colorTemperature;
   void main(){
    float r=length(gl_PointCoord-.5)*2.;
    float alpha=exp(-r*r*6.)*(1.-smoothstep(.51,1.,r))*strength;
    vec3 color=mix(vec3(.66,.78,1.),vec3(1.,.86,.67),colorTemperature);
    gl_FragColor=vec4(color,alpha);
   }`,
 });
 return new Points(geometry,material);
}
