// Arena Mortis orchestrator: game flow (start/pause/resume/shop) and the per-frame loop.
// Gameplay lives in the modules below; this file only wires them together.
import {S,pos,keys,stick,initGuns} from './state.js';
import {$} from './util.js';
import {scene,renderer,camera,visual,hand,gunGroup,artifact,targetRing,resize} from './world.js';
import {ensureAudio} from './audio.js';
import {updateHud,showBest} from './hud.js';
import {gunModel,updateWeapons,updateEffects} from './combat.js';
import {nextRound,updateSpawning,updateEnemies,updateRoundFlow} from './waves.js';
import {updateMovement,updateCamera,isMoving} from './player.js';
import {bindInput,lock} from './input.js';
import {MODELS} from './models.js';
import {preloadModels,instantiate} from './assets.js';

// External models (models.js) replace procedural ones once loaded; until then, or if loading fails,
// the procedural pistol and zombies are used. Nothing is fetched while every url is null.
visual.setModelProvider(instantiate);
preloadModels(MODELS).then(({loaded})=>{if(loaded.includes('pistol')&&S.selected===0)gunModel()});

gunModel();

export function start(){
 visual.reset();ensureAudio();
 for(let e of S.enemies){scene.remove(e.group);visual.disposeActor(e)}S.enemies=[];
 for(let f of S.fx)scene.remove(f.o);S.fx=[];
 initGuns();S.selected=0;S.round=0;S.points=500;S.score=0;S.kills=0;S.health=100;
 pos.set(0,0,12);S.yaw=0;S.pitch=0;S.reloadLeft=0;S.shotClock=0;S.lastDamage=S.time-20;S.wrathUp=false;S.charging=false;
 artifact.visible=false;gunGroup.visible=true;targetRing.visible=false;S.jumpY=S.jumpV=0;gunModel();
 for(let id of ['menu','dead','paused','shop'])$(id).classList.add('hidden');
 S.mode='play';nextRound();lock();
}

export function pause(){
 if(S.mode!=='play')return;
 for(let k in keys)keys[k]=false;stick.x=stick.y=0;S.ads=false;S.mode='paused';S.fireHeld=false;S.charging=false;
 targetRing.visible=false;artifact.visible=false;gunGroup.visible=true;document.exitPointerLock?.();$('paused').classList.remove('hidden');
}

export function resume(){S.mode='play';$('paused').classList.add('hidden');lock()}

export function closeShop(){$('shop').classList.add('hidden');S.mode='play';lock()}

export function update(dt){
 S.time+=dt;
 updateWeapons(dt);
 updateMovement(dt);
 updateSpawning(dt);
 const living=updateEnemies(dt);
 if(living<0)return; // player died this frame
 updateRoundFlow(dt,living);
 updateHud(living);
}

let last=performance.now(),frameMs=16.7;

export function render(dt){
 if(S.mode==='play')update(dt);
 updateCamera(dt);
 const moving=isMoving();
 const vState={mode:S.mode,moving,running:moving&&(keys.ShiftLeft||S.sprinting),ads:S.ads,recoil:S.recoil,walk:S.walk,time:S.time,reload:S.reloadLeft,charging:S.charging,charge:S.charge,artifact,pos};
 hand.visible=S.mode!=='menu';
 visual.animateWeapon(hand,vState,S.mode==='play'?dt:0);
 visual.tick(S.mode==='play'||S.mode==='menu'?dt:0,vState);
 if(S.mode==='play')updateEffects(dt);
 renderer.render(scene,camera);
 $('performance').textContent=S.graphicsLevel.toUpperCase()+' · '+Math.round(1000/frameMs)+' FPS';
}

bindInput({start,pause,resume,closeShop});
showBest();

window.onresize=resize;resize();
renderer.setAnimationLoop(now=>{const elapsed=now-last;frameMs=frameMs*.9+elapsed*.1;let dt=Math.min(.04,elapsed/1000);last=now;render(dt)});
