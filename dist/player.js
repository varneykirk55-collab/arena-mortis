// Player movement, stance, jumping, health regeneration, death and the first-person camera.
import * as T from './three.js';
import {S,pos,keys,stick} from './state.js';
import {$} from './util.js';
import {camera,targetRing,moveCollide} from './world.js';
import {sound} from './audio.js';

export function updateMovement(dt){
 let mx=(keys.KeyD?1:0)-(keys.KeyA?1:0)+stick.x,mz=(keys.KeyW?1:0)-(keys.KeyS?1:0)-stick.y,len=Math.max(1,Math.hypot(mx,mz)),speed=S.crouching?2.2:S.ads?2.8:keys.ShiftLeft||S.sprinting?7.2:4.5;
 mx/=len;mz/=len;
 moveCollide(pos,(mx*Math.cos(S.yaw)-mz*Math.sin(S.yaw))*speed*dt,(-mx*Math.sin(S.yaw)-mz*Math.cos(S.yaw))*speed*dt);
 if(Math.abs(mx)+Math.abs(mz)>.1){S.walk+=dt*speed;if(Math.floor(S.walk*2)!==Math.floor((S.walk-dt*speed)*2)&&S.jumpY===0)sound('step')}
 if(S.jumpV||S.jumpY){S.jumpV-=15*dt;S.jumpY=Math.max(0,S.jumpY+S.jumpV*dt);if(!S.jumpY)S.jumpV=0}
 if(S.time-S.lastDamage>5&&S.health<100)S.health=Math.min(100,S.health+dt*8);
}

export function jump(){if(!S.jumpY)S.jumpV=5.5}
export function toggleCrouch(){S.crouching=!S.crouching}
export function toggleSprint(){S.sprinting=!S.sprinting}

export function isMoving(){return !!(keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD||Math.abs(stick.x)+Math.abs(stick.y)>.1)}

export function die(){
 S.mode='dead';S.charging=false;targetRing.visible=false;document.exitPointerLock?.();
 $('dead').classList.remove('hidden');
 $('result').textContent=`Survived to round ${S.round} · ${S.kills} kills · ${S.score.toLocaleString()} points`;
 let best=Number(localStorage.getItem('arenaBest')||0);if(S.score>best)localStorage.setItem('arenaBest',S.score);
}

// Menu fly-by, or eye height with crouch/jump/head-bob, recoil kick and ADS zoom.
export function updateCamera(dt){
 if(S.mode==='menu'){camera.position.set(8,2.4,19);camera.lookAt(-8,9,-22);camera.rotation.y+=Math.sin(performance.now()*.00012)*.1}
 else{
  camera.position.set(pos.x,(S.crouching?1.05:1.7)+S.jumpY+Math.sin(S.walk*2)*.035,pos.z);
  camera.rotation.set(S.pitch+S.recoil,S.yaw,0);
  camera.fov=T.MathUtils.lerp(camera.fov,S.ads?(S.guns[S.selected].attachments.optic?43:53):72,Math.min(1,dt*12));
  camera.updateProjectionMatrix();
 }
}
