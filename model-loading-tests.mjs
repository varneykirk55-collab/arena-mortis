import assert from 'node:assert/strict';
import * as T from './dist/three.js';
import {GLTFLoader} from './dist/addons/GLTFLoader.js';
// glTF model support: models are generated here in memory (no binary fixtures), parsed by the vendored
// r170 GLTFLoader, and swapped in through the same provider the game uses.
const noop=()=>{};const ctx=new Proxy({createRadialGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
const nodes=new Map();function element(){return {style:{},classList:{add:noop,remove:noop},addEventListener:noop,setPointerCapture:noop,append:noop,firstElementChild:{style:{}},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),requestPointerLock:()=>Promise.resolve(),width:0,height:0,textContent:'',innerHTML:''}}
globalThis.document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},createElement:element,createElementNS:()=>({addEventListener:noop,removeEventListener:noop,set src(v){}}),addEventListener:noop,exitPointerLock:noop};
const audioNode=()=>({connect(){return this},start:noop,stop:noop,frequency:{value:0},gain:{value:0,setValueAtTime:noop,exponentialRampToValueAtTime:noop}});
class Audio{currentTime=0;resume(){}createBuffer(){return {getChannelData:()=>new Float32Array(1)}}createBufferSource=audioNode;createBiquadFilter=audioNode;createGain=audioNode;createOscillator=audioNode;}
globalThis.window={addEventListener:noop,AudioContext:Audio};globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.matchMedia=()=>({matches:false});const saved={};globalThis.localStorage={getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v};
globalThis.arenaRendererOverride={capabilities:{getMaxAnisotropy:()=>8},shadowMap:{},setPixelRatio:noop,setSize:noop,setAnimationLoop:noop,domElement:element(),render:noop};
globalThis.ProgressEvent??=class{constructor(type,o={}){this.type=type;Object.assign(this,o)}};
const _warn=console.warn;let warnings=[];console.warn=(...a)=>warnings.push(a.join(' '));

// ---- minimal glTF writer ----
function gltf({nodes,scenes=[0],meshes=[],skins=[],animations=[]},arrays){
 const buffers=[],bufferViews=[],accessors=[];let bytes=[],offset=0;
 for(const a of arrays){const u8=new Uint8Array(a.data.buffer,a.data.byteOffset,a.data.byteLength);while(offset%4){bytes.push(0);offset++}bufferViews.push({buffer:0,byteOffset:offset,byteLength:u8.length});for(const b of u8)bytes.push(b);offset+=u8.length;
  const acc={bufferView:bufferViews.length-1,componentType:a.data instanceof Float32Array?5126:a.data instanceof Uint16Array?5123:5121,count:a.data.length/a.size,type:{1:'SCALAR',3:'VEC3',4:'VEC4',16:'MAT4'}[a.size]};
  if(a.minmax){acc.min=[0,1,2].map(k=>Math.min(...[...a.data].filter((_,i)=>i%3===k)));acc.max=[0,1,2].map(k=>Math.max(...[...a.data].filter((_,i)=>i%3===k)))}accessors.push(acc)}
 buffers.push({byteLength:offset,uri:'data:application/octet-stream;base64,'+Buffer.from(bytes).toString('base64')});
 return JSON.stringify({asset:{version:'2.0'},scene:0,scenes:[{nodes:scenes}],nodes,meshes,skins,animations,buffers,bufferViews,accessors});
}
const parse=json=>new Promise((res,rej)=>new GLTFLoader().parse(json,'',res,rej));
function boxVerts(cx,cy,cz,sx,sy,sz){const v=[];for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])v.push(cx+x*sx,cy+y*sy,cz+z*sz);return v}
const boxIdx=[0,1,3,0,3,2,4,6,7,4,7,5,0,4,5,0,5,1,2,3,7,2,7,6,0,2,6,0,6,4,1,5,7,1,7,3];

// Mixamo-style humanoid authored in centimetres under a 0.01-scaled armature, facing +Z.
function humanoid({clips=false,skinned=true}={}){
 const spec=[['Hips',-1,[0,95,0]],['Spine',0,[0,25,0]],['Head',1,[0,45,0]],['LeftArm',1,[18,35,0]],['LeftForeArm',3,[28,0,0]],['RightArm',1,[-18,35,0]],['RightForeArm',5,[-28,0,0]],['LeftUpLeg',0,[10,-5,0]],['LeftLeg',7,[0,-45,0]],['RightUpLeg',0,[-10,-5,0]],['RightLeg',9,[0,-45,0]]];
 const objs=spec.map(([name])=>Object.assign(new T.Object3D(),{name}));spec.forEach(([,p,t],i)=>{objs[i].position.set(...t);if(p>=0)objs[p].add(objs[i])});
 const arm=new T.Object3D();arm.add(objs[0]);arm.updateMatrixWorld(true);
 const pos=[],idx=[],joints=[],weights=[];
 objs.forEach((o,j)=>{const w=new T.Vector3().setFromMatrixPosition(o.matrixWorld),base=pos.length/3;const tall=['LeftLeg','RightLeg'].includes(o.name)?45:20;pos.push(...boxVerts(w.x,w.y-(tall>20?22:0),w.z,6,tall>20?22:8,6));for(const i of boxIdx)idx.push(base+i);for(let k=0;k<8;k++){joints.push(j,0,0,0);weights.push(1,0,0,0)}});
 const ibm=[];objs.forEach(o=>ibm.push(...o.matrixWorld.clone().invert().elements));
 const arrays=[{data:new Float32Array(pos),size:3,minmax:true},{data:new Uint16Array(idx),size:1},{data:new Uint8Array(joints),size:4},{data:new Float32Array(weights),size:4},{data:new Float32Array(ibm),size:16}];
 const jointNodes=objs.map((_,i)=>i+2);
 const gnodes=[{name:'Armature',scale:[.01,.01,.01],children:[1,2]},{name:'Body',mesh:0,...(skinned?{skin:0}:{})}];
 spec.forEach(([name,p,t],i)=>gnodes.push({name,translation:t,children:spec.map((s,k)=>s[1]===i?k+2:-1).filter(k=>k>=0)}));
 for(const n of gnodes)if(n.children&&!n.children.length)delete n.children;
 const attributes={POSITION:0,...(skinned?{JOINTS_0:2,WEIGHTS_0:3}:{})};
 const animations=[];
 if(clips){for(const [name,angle] of [['Zombie_Walk',.5],['Zombie_Attack',1.2],['Zombie_Death',1.5],['Idle',.05]]){
  const k=arrays.length;arrays.push({data:new Float32Array([0,.5,1]),size:1});const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),angle);arrays.push({data:new Float32Array([0,0,0,1,...q.toArray(),0,0,0,1]),size:4});
  animations.push({name,samplers:[{input:k,output:k+1,interpolation:'LINEAR'}],channels:[{sampler:0,target:{node:jointNodes[7],path:'rotation'}}]})}}
 return gltf({nodes:gnodes,meshes:[{primitives:[{attributes,indices:1}]}],skins:skinned?[{joints:jointNodes,inverseBindMatrices:4,skeleton:2}]:[],animations},arrays);
}
function pistol(){
 const arrays=[{data:new Float32Array(boxVerts(0,0,-.1,.02,.04,.12)),size:3,minmax:true},{data:new Uint16Array(boxIdx),size:1},{data:new Float32Array(boxVerts(0,.04,-.08,.018,.012,.1)),size:3,minmax:true},{data:new Float32Array(boxVerts(0,-.07,.02,.015,.05,.02)),size:3,minmax:true}];
 return gltf({nodes:[{name:'PistolRoot',children:[1,2,3,4]},{name:'frame',mesh:0},{name:'slide',mesh:1},{name:'magazine',mesh:2},{name:'muzzle',translation:[0,0,-.25]}],meshes:[{primitives:[{attributes:{POSITION:0},indices:1}]},{primitives:[{attributes:{POSITION:2},indices:1}]},{primitives:[{attributes:{POSITION:3},indices:1}]}]},arrays);
}
function deformedBounds(group){group.updateMatrixWorld(true);const box=new T.Box3(),v=new T.Vector3();group.traverse(o=>{if(!o.isSkinnedMesh)return;o.skeleton.update();for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,v);v.applyMatrix4(o.matrixWorld);assert.ok(Number.isFinite(v.x+v.y+v.z),'Finite skinned vertex');box.expandByPoint(v)}});return box}

// ---- the real game, with the provider wired by game.js ----
const {start,update}=await import('./dist/game.js');
const {S,pos}=await import('./dist/state.js');
const {visual,camera,scene,gunGroup}=await import('./dist/world.js');
const {registerModel,preloadModels,instantiate}=await import('./dist/assets.js');
const {fire,gunModel}=await import('./dist/combat.js');
const {zombie}=await import('./dist/waves.js');

// 1. Nothing configured → procedural models, no requests.
let z=visual.makeZombie(0);assert.equal(z.type!=='model',true);visual.disposeActor(z);
assert.equal(visual.makeGun(new T.Group(),S.guns[0],0).muzzle,-.215,'Procedural pistol muzzle unchanged');

// 2. A missing file falls back cleanly.
const res=await preloadModels({zombie:{url:'file:///definitely/missing/zombie.glb'},pistol:{url:'file:///definitely/missing/pistol.glb'}});
assert.deepEqual(res.loaded,[]);assert.deepEqual(res.failed.sort(),['pistol','zombie']);assert.ok(warnings.some(w=>w.includes('using the built-in model')));
assert.equal(instantiate('zombie'),null);z=visual.makeZombie(1);let anatomy;z.group.traverse(o=>{if(o.name==='Reference ragged Roman zombie')anatomy=o});assert.ok(anatomy,'Procedural zombie after failed load');visual.disposeActor(z);

// 3. Skinned humanoid with no clips → the procedural animation is retargeted onto its bones.
registerModel('zombie',await parse(humanoid()),{height:1.8,rotationY:Math.PI});
z=visual.makeZombie(0);scene.add(z.group);
assert.equal(z.type,'model');assert.equal(z.model.mode,'procedural');assert.equal(z.model.map.length,10,'hips, head, 2 arms, 2 forearms, 2 thighs, 2 shins');
let b=deformedBounds(z.group);assert.ok(Math.abs(b.max.y-b.min.y-1.8)<.02&&Math.abs(b.min.y)<.02,'Normalized to 1.8 m standing on the ground');
const armBone=z.model.map.find(m=>m.proxy===z.arms[0]).bone;assert.equal(armBone.name,'LeftArm','Index 0 is the -X side once turned to face the player');
const thigh=z.model.map.find(m=>m.proxy===z.legs[0]).bone,rest=thigh.quaternion.clone();
const e={...z,speed:1.3,attack:1.1,stagger:0,death:0,dead:false,lastHead:false};
for(let i=0;i<20;i++){visual.animateZombie(e,1/30,4,i*.3);deformedBounds(e.group)}
assert.ok(thigh.quaternion.angleTo(rest)>.05,'Walking swings the model thigh');
for(const t of [.2,.6,1.2,2.4]){e.death=t;visual.animateDeath(e);b=deformedBounds(e.group)}
assert.ok(b.max.y<1.2,'Death pose brings the model down');visual.disposeActor(e);scene.remove(e.group);

// 4. Animated humanoid → its own clips are played by role.
registerModel('zombie3',await parse(humanoid({clips:true})),{});
z=visual.makeZombie(3);const c={...z,speed:1.1,attack:1.1,stagger:0,death:0,dead:false};
assert.equal(c.model.mode,'clips');assert.deepEqual(Object.keys(c.model.actions).sort(),['attack','death','idle','walk']);
visual.animateZombie(c,1/30,5,0);assert.equal(c.model.current,c.model.actions.walk);
c.attack=.97;visual.animateZombie(c,1/30,1,0);assert.equal(c.model.current,c.model.actions.attack);
c.attack=1.1;visual.animateZombie(c,1/30,1.0,0);assert.equal(c.model.current,c.model.actions.idle);
for(const t of [.3,1,2]){c.death=t;visual.animateDeath(c)}assert.equal(c.model.current,c.model.actions.death);assert.ok(c.model.pivot.rotation.x>-.01,'No double fall: the death clip owns the fall');
deformedBounds(c.group);visual.disposeActor(c);

// 5. Rigid (unskinned) model still topples on death.
registerModel('zombie2',await parse(humanoid({skinned:false})),{});
z=visual.makeZombie(2);const r={...z,speed:1,attack:1.1,stagger:0,death:0,dead:false};assert.equal(r.model.mode,'rigid');
for(const t of [.5,1.5]){r.death=t;visual.animateDeath(r)}assert.ok(r.model.pivot.rotation.x<-1.3,'Rigid model falls with the body pivot');visual.disposeActor(r);

// 6. Pistol model: slide/magazine nodes join the animated groups, muzzle node sets the flash, meshes are not merged away.
registerModel('pistol',await parse(pistol()),{});
const holder=new T.Group();camera.add(holder);const m=visual.makeGun(holder,S.guns[0],0).muzzle;
assert.ok(Math.abs(m+.25)<1e-6,'Muzzle taken from the muzzle node');
const slide=holder.getObjectByName('slide'),mag=holder.getObjectByName('magazine'),frame=holder.getObjectByName('frame');
assert.ok(slide&&mag&&frame,'glTF meshes survive part merging');assert.notEqual(slide.parent.name,'glTF weapon');assert.notEqual(mag.parent,frame.parent);
visual.animateWeapon(holder,{moving:false,running:false,ads:false,recoil:.08,walk:0,time:0,reload:0},.016);visual.shoot(holder,0);
const up={...S.guns[0],up:true,attachments:{optic:true,magazine:true,grip:true,muzzle:true}};assert.ok(visual.makeGun(holder,up,0).muzzle<-.25,'Muzzle attachment still extends the model');
camera.remove(holder);

// 7. The actual game loop with model zombies and the model pistol: spawn, aim, hit, score.
start();update(.02);assert.equal(S.enemies.length,1);const en=S.enemies[0];assert.equal(en.type,'model');
gunModel();assert.ok(gunGroup.getObjectByName('slide'),'Game uses the model pistol');
en.group.position.set(0,0,8);camera.position.set(pos.x,1.7,pos.z);camera.lookAt(0,1.1,8);camera.updateMatrixWorld(true);
const before=S.points;fire();assert.ok(S.points>before,'Hit detection works on a model zombie');
for(let i=0;i<120;i++)update(.04);
assert.ok(Number.isFinite(S.health));
console.warn=_warn;
console.log('PASS: no-config procedural default, missing-file fallback, skinned retarget (cm armature normalized to 1.8 m), clip playback by role, rigid fallback, pistol slide/magazine/muzzle nodes, game loop spawning, hitting and scoring on model zombies.');
process.exit(0);
