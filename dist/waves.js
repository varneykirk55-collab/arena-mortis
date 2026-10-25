// Zombie spawning, round progression, enemy AI and the round-cleared break.
import {S,pos} from './state.js';
import {scene,visual,gates,obstacles,moveCollide} from './world.js';
import {sound,tone} from './audio.js';
import {announce} from './hud.js';
import {die} from './player.js';

// variant 0 shambler · 1 runner · 2 armoured · 3 brute
export function zombie(variant){
 const rig=visual.makeZombie(variant);scene.add(rig.group);
 let gate=gates[Math.floor(Math.random()*gates.length)];
 rig.group.position.copy(gate);rig.group.position.x+=(Math.random()-.5)*2;rig.group.position.z+=(Math.random()-.5)*2;
 if(variant===3)rig.group.scale.setScalar(1.25);
 const hp=(85+S.round*16)*(variant===3?3:variant===2?1.7:1);
 return {...rig,hp,maxHp:hp,speed:(1.05+Math.min(S.round*.095,1.5))*(variant===1?1.45:variant===3?.8:1),phase:Math.random()*6,attack:0,stagger:0,dead:false,death:0,variant};
}

export function nextRound(){S.round++;S.wrathReady=true;S.remainingSpawn=6+Math.floor(S.round*3.5);S.spawnClock=0;S.roundWait=0;announce('ROUND '+S.round);tone(180,.7);setTimeout(()=>tone(270,.8),250)}

export function updateSpawning(dt){
 S.spawnClock-=dt;
 if(S.remainingSpawn>0&&S.spawnClock<=0&&S.enemies.filter(e=>!e.dead).length<S.enemyLimit){
  let variant=S.round>=8&&S.remainingSpawn%13===0?3:S.round>=5&&Math.random()<.3?2:S.round>=3&&Math.random()<.3?1:0;
  S.enemies.push(zombie(variant));S.remainingSpawn--;S.spawnClock=Math.max(.25,1.1-S.round*.055);
 }
}

// Steers, separates, animates and lets each living enemy attack.
// Returns the living count, or -1 if the player died this frame (the rest of the frame is skipped).
export function updateEnemies(dt){
 const enemies=S.enemies;let living=0;
 for(let i=enemies.length-1;i>=0;i--){
  let e=enemies[i];
  if(e.dead){e.death+=dt;visual.animateDeath(e);if(e.death>2.5){scene.remove(e.group);visual.disposeActor(e);enemies.splice(i,1)}continue}
  living++;e.attack-=dt;e.stagger-=dt;
  let x=pos.x-e.group.position.x,z=pos.z-e.group.position.z,d=Math.hypot(x,z);
  let desired=Math.atan2(-x,-z);
  e.group.rotation.y+=Math.atan2(Math.sin(desired-e.group.rotation.y),Math.cos(desired-e.group.rotation.y))*Math.min(1,dt*7);
  if(d>1.2&&e.stagger<=0){
   let vx=x/d,vz=z/d;
   for(let o of obstacles){let ox=e.group.position.x-o.x,oz=e.group.position.z-o.z,od=Math.hypot(ox,oz);if(od<o.r+2){vx+=ox/Math.max(.1,od)*1.7;vz+=oz/Math.max(.1,od)*1.7}}
   for(let j=0;j<enemies.length;j++){let other=enemies[j];if(other===e||other.dead)continue;let dx=e.group.position.x-other.group.position.x,dz=e.group.position.z-other.group.position.z,dd=dx*dx+dz*dz;if(dd<.8&&dd>.001){vx+=dx/(dd+.1)*.25;vz+=dz/(dd+.1)*.25}}
   let vl=Math.max(1,Math.hypot(vx,vz));
   moveCollide(e.group.position,vx/vl*e.speed*dt,vz/vl*e.speed*dt,.35);
  }
  e.phase+=dt*e.speed*3;visual.animateZombie(e,dt,d,e.phase);
  if(d<1.65&&e.attack<=0&&S.jumpY<1){S.health-=e.variant===3?35:18;e.attack=1.1;S.lastDamage=S.time;sound('hit');if(S.health<=0){S.health=0;die();return -1}}
 }
 return living;
}

export function updateRoundFlow(dt,living){
 if(!living&&!S.remainingSpawn){if(!S.roundWait){S.roundWait=6;S.points+=250;S.score+=250;announce('ROUND CLEARED · +250')}S.roundWait-=dt;if(S.roundWait<=0)nextRound()}
 if(S.time>S.nextGroan&&living){sound('growl');S.nextGroan=S.time+3+Math.random()*3}
}
