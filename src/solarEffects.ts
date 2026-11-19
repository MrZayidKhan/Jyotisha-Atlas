import { AdditiveBlending, BufferGeometry, CubicBezierCurve3, Group, Mesh, PlaneGeometry, ShaderMaterial, TubeGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function solarEffects(radius:number){
 const group=new Group();
 const coronaGeometry=new PlaneGeometry(1,1);
 const corona=new ShaderMaterial({
  depthWrite:false,transparent:true,blending:AdditiveBlending,
  uniforms:{radius:{value:radius},time:{value:0}},
  vertexShader:`
   uniform float radius;
   varying vec2 vUv;
   void main(){
    vUv=uv;
    vec4 center=modelViewMatrix*vec4(0.,0.,0.,1.);
    gl_Position=projectionMatrix*(center+vec4(position.xy*radius*5.1,0.,0.));
   }`,
  fragmentShader:`
   uniform float time;
   varying vec2 vUv;
   float ribbon(float angle,float center,float width){
    float separation=2.*sin((angle-center)*.5);
    return exp(-separation*separation/width);
   }
   void main(){
    vec2 p=(vUv-.5)*5.1;
    float r=length(p),a=atan(p.y,p.x),height=max(0.,r-1.);
    float drift=sin(a*3.+time*.11)*height*.18;
    float fans=ribbon(a+drift,.48+height*.38,.018)
       + .72*ribbon(a-drift,2.73-height*.6,.047)
       + .48*ribbon(a,-1.07+height*.29,.024);
    float filaments=.55+.45*sin(a*61.+sin(a*11.)*2.+height*19.-time*.46);
    float chromosphere=exp(-height*(45.+8.*sin(a*31.)))*.69;
    float glow=exp(-height*9.)*.21+exp(-height*3.35)*(.05+fans*(.16+.18*filaments));
    float halo=(chromosphere+glow)*smoothstep(.978,1.018,r)*(1.-smoothstep(1.7,2.51,r));
    vec3 color=mix(vec3(1.,.62,.26),vec3(1.,.19,.057),smoothstep(1.,1.72,r));
    gl_FragColor=vec4(color,halo);
   }`,
 });
 const glow=new Mesh(coronaGeometry,corona);
 glow.frustumCulled=false;
 group.add(glow);
 const loopMaterial=new ShaderMaterial({
  depthWrite:false,transparent:true,blending:AdditiveBlending,
  uniforms:{time:corona.uniforms.time},
  vertexShader:`varying vec2 vUv;varying float phase;void main(){vUv=uv;phase=dot(position,vec3(1.2,2.1,3.7));gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
   varying vec2 vUv;varying float phase;uniform float time;
   void main(){
    float front=smoothstep(0.,.14,vUv.x)*(1.-smoothstep(.82,1.,vUv.x));
    float pulse=pow(.5+.5*sin(vUv.x*17.-time*1.7+phase),4.);
    float flow=.36+.38*pulse+.11*sin(vUv.x*46.+phase+time*.7);
    gl_FragColor=vec4(1.,.19+.52*pulse,.035+.18*pulse,flow*front);
   }`,
 });
 const strands: BufferGeometry[]=[];
 for(const [angle,height,count] of [[.53,.48,6],[2.85,.27,4],[-1.13,.36,5]]){
  const normal=new Vector3(Math.cos(angle),Math.sin(angle),.09).normalize();
  const tangent=new Vector3(-Math.sin(angle),Math.cos(angle),.22).normalize();
  for(let i=0;i<count;i++){
   const spread=.12+i*.029,altitude=height-i*.019;
   const start=normal.clone().addScaledVector(tangent,-spread).normalize().multiplyScalar(radius*.996);
   const end=normal.clone().addScaledVector(tangent,spread*1.2).normalize().multiplyScalar(radius*.996);
   const rise=start.clone().addScaledVector(normal,radius*altitude).addScaledVector(tangent,radius*.06);
   const fall=end.clone().addScaledVector(normal,radius*altitude*.86).addScaledVector(tangent,radius*.14);
   strands.push(new TubeGeometry(new CubicBezierCurve3(start,rise,fall,end),28,radius*(.005+(i%3)*.0016),5,false));
  }
 }
 const loopGeometry=mergeGeometries(strands);
 strands.forEach(geometry=>geometry.dispose());
 const loops=new Mesh(loopGeometry,loopMaterial);
 group.add(loops);
 return {
  group,
  tick(time:number,close:boolean){
   corona.uniforms.time.value=time;
   loops.visible=close;
  },
  dispose(){
   coronaGeometry.dispose();
   corona.dispose();
   loopMaterial.dispose();
   loopGeometry.dispose();
  },
 };
}
