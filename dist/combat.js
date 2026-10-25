// Shooting, hit detection, damage, recoil, reload, weapon switching, melee and Jupiter's Wrath.
import * as T from './three.js';
import {S,pos} from './state.js';
import {$,clamp} from './util.js';
import {scene,camera,visual,hand,gunGroup,flash,artifact,targetRing,altarGlow} from './world.js';
import {sound,tone} from './audio.js';
import {announce} from './hud.js';

// Rebuild the first-person weapon for the selected gun and move the muzzle flash to its tip.
export function gunModel(){const v=visual.makeGun(gunGroup,S.guns[S.selected],S.selected);flash.position.set(0,0,v.muzzle)}

export function damage(e,amount,head=false){
 if(e.dead)return;
 e.hp-=amount;e.stagger=.16;e.lastHead=head;
 S.points+=10;S.score+=10;S.hitUntil=S.time+.12;
 $('hit').textContent=head?'×':'⌁';
 if(e.hp<=0){e.dead=true;e.death=0;S.kills++;let reward=head?150:100;S.points+=reward;S.score+=reward;sound('hit');if(head)tone(1100,.08)}
}

const sphereG=new T.SphereGeometry(1,8,6);
export function burst(at,color=0xe7b058,n=12,size=.08){
 for(let i=0;i<n;i++){let o=new T.Mesh(sphereG,new T.MeshBasicMaterial({color}));o.position.set(at.x,at.y,at.z);o.scale.setScalar(size);scene.add(o);S.fx.push({o,v:new T.Vector3((Math.random()-.5)*7,Math.random()*5,(Math.random()-.5)*7),life:.45,max:.45})}
}

export function updateEffects(dt){
 const fx=S.fx;
 for(let i=fx.length-1;i>=0;i--){let f=fx[i];f.life-=dt;if(f.v){f.v.y-=dt*9;f.o.position.addScaledVector(f.v,dt);f.o.rotation.x+=dt*5}if(f.o.material?.transparent)f.o.material.opacity=Math.max(0,f.life/f.max)*.55;if(f.life<=0){scene.remove(f.o);if(f.o.isLine)f.o.geometry.dispose();fx.splice(i,1)}}
}

// Hit-scan against an upright capsule-ish box around each living enemy; head above 1.65m (2m for brutes).
const ray=new T.Raycaster();
export function cast(dx=0,dy=0){
 ray.setFromCamera(new T.Vector2(dx,dy),camera);let best=null,dist=80;
 for(let e of S.enemies){
  if(e.dead)continue;
  let center=e.group.position.clone();center.y=1.15;
  let closest=ray.ray.closestPointToPoint(center,new T.Vector3());
  let t=closest.distanceTo(camera.position);
  let local=closest.clone().sub(center);
  if(t<dist&&ray.ray.direction.dot(center.clone().sub(camera.position))>0&&Math.abs(local.x)<.55&&Math.abs(local.z)<.55&&closest.y>.05&&closest.y<(e.variant===3?2.65:2.2)){best={e,head:closest.y>(e.variant===3?2:1.65),at:closest};dist=t}
 }
 return best;
}

export function fire(){
 if(S.mode!=='play'||S.reloadLeft>0||S.shotClock>0||S.charging)return;
 let g=S.guns[S.selected];
 if(g.ammo<=0){reload();return}
 g.ammo--;S.shotClock=g.rate;
 S.recoil+=g.attachments.grip?.025:S.selected===0?.08:.04;
 sound(S.selected===0?'eagle':S.selected===1?'shot':'shotgun');
 visual.shoot(hand,S.selected);
 let pellets=S.selected===2?8:1;
 for(let i=0;i<pellets;i++){
  let spread=S.selected===2?.065:S.ads?.002:.014;
  let h=cast((Math.random()-.5)*spread,(Math.random()-.5)*spread);
  if(h){
   damage(h.e,g.damage*(g.up?2:1)*(h.head?2.5:1),h.head);
   visual.impact(h.at,true);
   if(g.up&&S.selected===0)explode(h.at,3.6,180);
   if(g.up&&S.selected===1){for(let e of S.enemies)if(e!==h.e&&!e.dead&&e.group.position.distanceTo(h.e.group.position)<3)damage(e,22)}
   if(g.up&&S.selected===2){h.e.stagger=.75;h.e.group.position.add(h.e.group.position.clone().sub(pos).normalize().multiplyScalar(.45))}
  }else if(g.up&&S.selected===0){let at=targetPoint();explode(at,3.6,180)}
  else{visual.impact(targetPoint(),false)}
 }
}

// Explosions never hurt the player.
export function explode(at,r,dmg){visual.explosion(at);for(let e of S.enemies)if(!e.dead&&e.group.position.distanceTo(at)<r)damage(e,dmg);sound('shotgun')}

export function reload(){
 let g=S.guns[S.selected];
 if(S.mode!=='play'||S.reloadLeft||g.ammo>=g.cap||!g.stock||S.charging)return;
 S.reloadLeft=g.reload+(g.up&&S.selected===0?.5:0);visual.reload(S.reloadLeft);sound('reload');announce('RELOADING');
}

export function switchGun(){if(S.charging)return;S.selected=(S.selected+1)%3;while(!S.guns[S.selected].owned)S.selected=(S.selected+1)%3;S.reloadLeft=0;gunModel()}

// Where the crosshair meets the arena floor, clamped inside the wall.
export function targetPoint(){
 let dir=new T.Vector3();camera.getWorldDirection(dir);
 let d=dir.y<-.04?clamp(-camera.position.y/dir.y,4,26):20;
 let at=pos.clone().add(dir.multiplyScalar(d));at.y=.08;
 let len=Math.hypot(at.x,at.z);if(len>31){at.x*=31/len;at.z*=31/len}
 return at;
}

export function chargeStart(){if(S.mode!=='play'||!S.wrathReady||S.charging)return;S.charging=true;S.charge=0;S.fireHeld=false;S.reloadLeft=0;tone(75,1);gunGroup.visible=false;artifact.visible=true}

export function chargeEnd(){
 if(!S.charging)return;
 S.charging=false;S.wrathReady=false;artifact.visible=false;gunGroup.visible=true;targetRing.visible=false;
 let at=targetPoint(),radius=S.wrathUp?10:7;
 for(let e of S.enemies)if(!e.dead&&e.group.position.distanceTo(at)<radius)damage(e,100000);
 sound('thunder');visual.strike(at,radius);announce('JUPITER HAS SPOKEN');S.recoil=.25;
}

export function melee(){if(S.mode!=='play')return;visual.melee();S.recoil=.18;for(let e of S.enemies)if(!e.dead&&e.group.position.distanceTo(pos)<2.6)damage(e,65);sound('hit')}

// Per-frame weapon state: cooldowns, recoil decay, reload completion, held fire, Jupiter targeting.
export function updateWeapons(dt){
 S.shotClock=Math.max(0,S.shotClock-dt);S.recoil*=Math.exp(-dt*13);
 if(S.reloadLeft>0){S.reloadLeft-=dt;if(S.reloadLeft<=0){let g=S.guns[S.selected],n=Math.min(g.cap-g.ammo,g.stock);g.ammo+=n;g.stock-=n;sound('reload')}}
 if(S.fireHeld){if(S.selected===1)fire();else if(S.shotClock===0){fire();S.fireHeld=false}}
 if(S.charging){S.charge+=dt;targetRing.visible=true;targetRing.position.copy(targetPoint());targetRing.scale.setScalar((S.wrathUp?10:7)/6);artifact.rotation.z=Math.sin(S.time*30)*.03;altarGlow.emissiveIntensity=2+Math.sin(S.time*22)}
}
