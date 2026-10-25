// Adapters that let loaded glTF models stand in for the procedural pistol and zombies.
// The rest of the game keeps talking to the same rig shape ({group, body, head, arms, legs, ...}),
// so AI, hit detection, death handling and disposal are unchanged.
import * as T from './three.js';

const ROLE_PATTERNS={
 walk:/walk|shamble|stagger_?walk|move/i,
 run:/run|sprint|charge/i,
 attack:/attack|punch|bite|swipe|claw|strike/i,
 idle:/idle|stand|breath/i,
 death:/death|die|dying|dead/i
};

// ---------- weapons ----------

// Mounts a loaded weapon under the presentation's existing body/slide/magazine groups.
// Optional nodes named "slide" and "magazine" are moved into those groups so the existing
// recoil and reload animations drive them; an empty node named "muzzle" marks the barrel tip.
export function mountWeaponModel(inst,{gun,body,slide,magazine},fallbackMuzzle){
 const cfg={scale:1,position:[0,0,0],rotation:[0,0,0],muzzle:null,nodes:{},...inst.config};
 const names={slide:'slide',magazine:'magazine',muzzle:'muzzle',...cfg.nodes};
 const holder=new T.Group();holder.name='glTF weapon';holder.userData.noMerge=true;
 holder.position.fromArray(cfg.position);holder.rotation.set(...cfg.rotation);holder.scale.setScalar(cfg.scale);
 holder.add(inst.root);body.add(holder);
 gun.updateMatrixWorld(true);
 for(const [part,group] of [['slide',slide],['magazine',magazine]]){
  const node=names[part]&&inst.root.getObjectByName(names[part]);
  if(node){group.attach(node);node.userData.noMerge=true}
 }
 gun.updateMatrixWorld(true);
 if(typeof cfg.muzzle==='number')return cfg.muzzle;
 const tip=names.muzzle&&gun.getObjectByName(names.muzzle);
 if(tip)return gun.worldToLocal(tip.getWorldPosition(new T.Vector3())).z;
 const box=new T.Box3();gun.updateMatrixWorld(true);
 const inv=gun.matrixWorld.clone().invert();
 holder.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox?.();box.union(o.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld)))}});
 return box.isEmpty()?fallbackMuzzle:box.min.z; // weapons point down -Z
}

// ---------- zombies ----------

const norm=n=>n.toLowerCase().replace(/^mixamorig\d*:?/,'').replace(/[^a-z]/g,'');
const BONE_TESTS={
 body:n=>/hips|pelvis/.test(n),
 head:n=>/head$/.test(n)&&!/top|end|nub/.test(n),
 arms:n=>(/upperarm|uparm/.test(n)||/^(left|right|l|r)?arm(l|r|left|right)?$/.test(n))&&!/fore|lower|twist/.test(n),
 elbows:n=>/forearm|lowerarm/.test(n)&&!/twist/.test(n),
 legs:n=>/upleg|thigh|upperleg/.test(n)&&!/twist/.test(n),
 knees:n=>(/calf|shin|lowerleg/.test(n)||/^(left|right|l|r)?leg(l|r|left|right)?$/.test(n))&&!/up|twist/.test(n)
};

function findBones(root,overrides={}){
 const bones=[];root.traverse(o=>{if(o.isBone)bones.push(o)});
 const byName=name=>bones.find(b=>b.name===name);
 const out={};
 for(const [part,test] of Object.entries(BONE_TESTS)){
  let found;
  if(overrides[part])found=[].concat(overrides[part]).map(byName).filter(Boolean);
  else found=bones.filter(b=>test(norm(b.name)));
  if(part==='body'||part==='head'){out[part]=found.sort((a,b)=>depth(a)-depth(b))[0]||null;continue}
  // Pick the two shallowest matches and order them by side: index 0 is the -X side, like the procedural rig.
  found=found.sort((a,b)=>depth(a)-depth(b)).slice(0,2);
  out[part]=found.length===2?found.sort((a,b)=>a.getWorldPosition(new T.Vector3()).x-b.getWorldPosition(new T.Vector3()).x):null;
 }
 return out;
}
function depth(o){let d=0;while(o.parent){d++;o=o.parent}return d}

function pickClip(clips,role,named){
 if(named)return clips.find(c=>c.name===named)||null;
 return clips.find(c=>ROLE_PATTERNS[role].test(c.name))||null;
}

// Builds a zombie rig from a loaded model. `contact` draws the same soft ground shadow the procedural zombies use.
export function zombieFromModel(inst,{contact,lean}){
 const cfg={height:1.8,rotationY:Math.PI,animation:'auto',bones:{},animations:{},...inst.config};
 const group=new T.Group();
 // pivot sits at hip height (y=1) so the procedural lean/bob/fall can tilt the whole model like a body.
 const pivot=new T.Group();pivot.position.y=1;group.add(pivot);
 const holder=new T.Group();holder.position.y=-1;pivot.add(holder);
 const model=inst.root;holder.add(model);
 model.rotation.y=cfg.rotationY; // glTF faces +Z; the arena's dead face -Z
 group.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3());
 model.scale.multiplyScalar(cfg.height/Math.max(size.y,1e-6));
 group.updateMatrixWorld(true);box.setFromObject(model);
 model.position.x-=(box.min.x+box.max.x)/2;model.position.z-=(box.min.z+box.max.z)/2;model.position.y-=box.min.y;
 group.updateMatrixWorld(true);
 model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true}});

 // Proxies receive the procedural animation exactly as the built-in rig's pivots would.
 const proxy=(y=0)=>{const o=new T.Object3D();o.position.y=y;return o};
 const body=proxy(1),head=proxy(),arms=[proxy(),proxy()],elbows=[proxy(),proxy()],legs=[proxy(),proxy()],knees=[proxy(),proxy()];

 const clips=inst.animations||[];
 const state={pivot,mode:'rigid',mixer:null,actions:{},current:null,map:[],hips:null,lastDeath:0};
 if(clips.length&&cfg.animation!=='procedural'&&cfg.animation!=='none'){
  const mixer=new T.AnimationMixer(model);
  for(const role of Object.keys(ROLE_PATTERNS)){const clip=pickClip(clips,role,cfg.animations[role]);if(clip)state.actions[role]=mixer.clipAction(clip)}
  if(!state.actions.walk&&!state.actions.run&&clips.length===1)state.actions.walk=mixer.clipAction(clips[0]);
  if(state.actions.walk||state.actions.run){state.mixer=mixer;state.mode='clips'}
  const death=state.actions.death;if(death){death.setLoop(T.LoopOnce,1);death.clampWhenFinished=true}
  if(state.actions.attack)state.actions.attack.setLoop(T.LoopRepeat,Infinity);
 }
 if(state.mode==='rigid'&&cfg.animation!=='none'){
  const b=findBones(model,cfg.bones);
  if(b.body&&b.arms&&b.legs){
   state.mode='procedural';
   const add=(p,bone)=>{if(!bone)return;const P=bone.parent.getWorldQuaternion(new T.Quaternion());state.map.push({proxy:p,bone,R:bone.quaternion.clone(),P,Pinv:P.clone().invert()})};
   add(body,b.body);add(head,b.head);
   for(let i=0;i<2;i++){add(arms[i],b.arms[i]);add(elbows[i],b.elbows?.[i]);add(legs[i],b.legs[i]);add(knees[i],b.knees?.[i])}
   const hipsParent=b.body.parent;
   state.hips={bone:b.body,rest:b.body.position.clone(),Pinv:hipsParent.getWorldQuaternion(new T.Quaternion()).invert(),scale:hipsParent.getWorldScale(new T.Vector3()).y||1};
  }
 }
 const shadow=contact(group,0,0,1.1,.85,.65);
 return {group,body,head,arms,legs,elbows,knees,shadow,type:'model',lean,turn:0,model:state};
}

const _q=new T.Quaternion(),_v=new T.Vector3();

function play(m,role,timeScale=1){
 const next=m.actions[role];if(!next)return false;
 next.timeScale=timeScale;
 if(m.current===next)return true;
 next.reset().setEffectiveWeight(1).fadeIn(.2).play();
 m.current?.fadeOut(.2);m.current=next;return true;
}

// Called after the procedural animation has updated the proxies.
export function driveModelZombie(e,dt,{moving=false,run=false,attack=0,dead=false}={}){
 const m=e.model;
 if(dead){dt=Math.max(0,e.death-m.lastDeath);m.lastDeath=e.death}
 if(m.mode==='clips'){
  const hasDeath=dead&&m.actions.death;
  if(dead){if(!play(m,'death')&&m.current){m.current.fadeOut(.3);m.current=null}}
  else if(attack>.3&&m.actions.attack)play(m,'attack');
  else if(moving)play(m,run&&m.actions.run?'run':m.actions.walk?'walk':'run',Math.min(1.6,Math.max(.6,e.speed/(run?2.2:1.3))));
  else if(!play(m,'idle'))play(m,m.actions.walk?'walk':'run',.25);
  m.mixer.update(dt);
  // Lean/bob always applies; the procedural fall applies only when the model has no death clip.
  if(!hasDeath)copyPivot(m.pivot,e.body);
  return;
 }
 if(m.mode==='procedural'){
  for(const r of m.map){_q.setFromEuler(r.proxy.rotation);r.bone.quaternion.copy(r.Pinv).multiply(_q).multiply(r.P).multiply(r.R)}
  const h=m.hips;_v.set(0,e.body.position.y-1,0).applyQuaternion(h.Pinv).divideScalar(h.scale);h.bone.position.copy(h.rest).add(_v);
  return;
 }
 copyPivot(m.pivot,e.body); // rigid: tilt, bob and topple the whole model
}
function copyPivot(pivot,body){pivot.rotation.copy(body.rotation);pivot.position.y=body.position.y}
