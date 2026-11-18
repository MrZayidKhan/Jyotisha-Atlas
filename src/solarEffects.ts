import { AdditiveBlending, Color, Mesh, PlaneGeometry, ShaderMaterial, TubeGeometry, QuadraticBezierCurve3, Vector3, Group } from 'three';

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
    gl_Position=projectionMatrix*(center+vec4(position.xy*radius*4.6,0.,0.));
   }`,
  fragmentShader:`
   uniform float time;
   varying vec2 vUv;
   void main(){
    vec2 p=(vUv-.5)*4.6;
    float r=length(p),a=atan(p.y,p.x);
    float limb=exp(-max(0.,r-1.)*8.);
    float streamers=pow(.5+.5*sin(a*13.+sin(a*7.+time*.12)*1.55),4.);
    float wisps=pow(.5+.5*sin(a*39.+sin(r*5.-time*.6)),6.);
    float halo=(limb*.66+exp(-max(0.,r-1.)*3.4)*(.13+.27*streamers+.10*wisps))
     *smoothstep(.92,1.025,r)*(1.-smoothstep(1.52,2.22,r));
    vec3 color=mix(vec3(1.,.63,.19),vec3(1.,.18,.035),smoothstep(1.,1.65,r));
    gl_FragColor=vec4(color,halo);
   }`,
 });
 const glow=new Mesh(coronaGeometry,corona);
 glow.frustumCulled=false;
 group.add(glow);
 const loops=new Group();
 const loopMaterial=new ShaderMaterial({
  depthWrite:false,transparent:true,blending:AdditiveBlending,
  uniforms:{time:corona.uniforms.time,tint:{value:new Color(0xff7948)}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
   varying vec2 vUv;uniform float time;uniform vec3 tint;
   void main(){
    float front=sin(vUv.x*3.14159265);
    float flow=.58+.28*sin(vUv.x*14.-time*1.4)+.10*sin(vUv.x*34.+time*.55);
    gl_FragColor=vec4(tint+vec3(.35,.17,.04)*flow,flow*front*.88);
   }`,
 });
 for(let i=0;i<10;i++){
  const angle=i*2.39996;
  const normal=new Vector3(Math.cos(angle),Math.sin(angle),-.20+(i%5)*.13).normalize();
  const tangent=new Vector3(-Math.sin(angle),Math.cos(angle),.35).normalize();
  const spread=.13+(i%3)*.09;
  const a=normal.clone().addScaledVector(tangent,-spread).normalize().multiplyScalar(radius*.995);
  const b=normal.clone().addScaledVector(tangent,spread).normalize().multiplyScalar(radius*.995);
  const crest=normal.clone().multiplyScalar(radius*(1.23+(i%4)*.14));
  const curve=new QuadraticBezierCurve3(a,crest,b);
  loops.add(new Mesh(new TubeGeometry(curve,32,radius*(.009+(i%3)*.003),5,false),loopMaterial));
 }
 group.add(loops);
 return {
  group,
  tick(time:number,close:boolean){
   corona.uniforms.time.value=time;
   loops.visible=close;
   loops.rotation.y=time*.045;
  },
  dispose(){
   coronaGeometry.dispose();
   corona.dispose();
   loopMaterial.dispose();
   loops.children.forEach(mesh=>(mesh as Mesh).geometry.dispose());
  },
 };
}
