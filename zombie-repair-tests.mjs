import assert from 'node:assert/strict';
import * as T from './dist/three.js';
const noop=()=>{};const context=new Proxy({createRadialGradient:()=>({addColorStop:noop}),measureText:()=>({width:10})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context}),createElementNS:()=>({addEventListener:noop,removeEventListener:noop,set src(s){}})};
globalThis.matchMedia=()=>({matches:false});globalThis.devicePixelRatio=1;globalThis.localStorage={setItem:noop};
const {createPresentation}=await import('./dist/presentation.js');
const scene=new T.Scene(),camera=new T.PerspectiveCamera(),renderer={capabilities:{getMaxAnisotropy:()=>8},shadowMap:{},setPixelRatio:noop};scene.add(camera);
const visual=createPresentation(scene,camera,renderer);
let handsChecked=0,seamsChecked=0;
for(let variant=0;variant<4;variant++){
 const e={...visual.makeZombie(variant),speed:variant===1?2.2:1.3,attack:1.1,stagger:0,death:0};scene.add(e.group);e.group.updateMatrixWorld(true);
 assert.equal(e.body.position.y,1);let anatomy;e.group.traverse(o=>{if(o.name==='Reference ragged Roman zombie')anatomy=o});assert.ok(anatomy);assert.equal(anatomy.geometry.index.count/3,21160);
 const g=anatomy.geometry,p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,n=g.attributes.normal,seen=new Map();
 for(let i=0;i<p.count;i++){
  let sum=0,legWeight=0;for(let k=0;k<4;k++){const b=si.array[i*4+k],w=sw.array[i*4+k];assert.ok(b<anatomy.skeleton.bones.length);assert.ok(Number.isFinite(w)&&w>=0);sum+=w;if(b>=6)legWeight+=w;}assert.ok(Math.abs(sum-1)<1e-5);
  if(Math.abs(p.getX(i))>.32&&p.getY(i)>.80&&p.getY(i)<.98){assert.ok(legWeight<1e-6,'Hands must not follow legs');handsChecked++;}
  const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');if(seen.has(key)){const j=seen.get(key);assert.ok(Math.hypot(n.getX(i)-n.getX(j),n.getY(i)-n.getY(j),n.getZ(i)-n.getZ(j))<1e-5);seamsChecked++;}else seen.set(key,i);
 }
 function deform(){e.group.updateMatrixWorld(true);e.group.traverse(o=>{if(!o.isSkinnedMesh)return;o.skeleton.update();const v=new T.Vector3();for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,v);assert.ok(Number.isFinite(v.x+v.y+v.z)&&v.length()<4,'Bounded deformation');}});}
 for(let step=0;step<24;step++){e.stagger=step===12?.2:0;e.attack=1.1-(step%12)/12*1.1;visual.animateZombie(e,1/30,step<12?4:1,step*.3);deform();}
 e.stagger=0;for(let i=0;i<60;i++)visual.animateZombie(e,1/30,1,4);assert.ok(Math.abs(e.legs[0].rotation.x)<.001,'Stopped legs settle');
 const before=e.body.rotation.x;visual.animateDeath(e);assert.equal(e.body.rotation.x,before,'No death pose snap');for(const t of [.15,.5,1,2.4]){e.death=t;visual.animateDeath(e);deform();}visual.disposeActor(e);scene.remove(e.group);
}
assert.ok(handsChecked>1000&&seamsChecked>1000);console.log(`PASS: four variants, unchanged 21,160-triangle body, normalized weights, ${handsChecked} hand vertices free of leg weights, ${seamsChecked} smoothed seam pairs, bounded walk/attack/stagger/death and idle settling.`);
