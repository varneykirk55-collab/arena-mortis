// Keyboard, mouse, pointer lock, touch buttons, virtual joystick and touch-look.
import {S,keys,stick} from './state.js';
import {$,clamp} from './util.js';
import {renderer,visual,resize} from './world.js';
import {toggleMute} from './audio.js';
import {announce} from './hud.js';
import {fire,reload,switchGun,chargeStart,chargeEnd,melee} from './combat.js';
import {openShop} from './economy.js';
import {jump,toggleCrouch,toggleSprint} from './player.js';

export function lock(){
 if(!matchMedia('(pointer:coarse)').matches)renderer.domElement.requestPointerLock?.()?.catch?.(()=>announce('CLICK THE ARENA TO CAPTURE YOUR MOUSE'));
 else{document.documentElement.requestFullscreen?.().catch(()=>{});screen.orientation?.lock?.('landscape').catch(()=>{})}
}

// Flow actions (start/pause/resume/closeShop) live in game.js and are passed in to avoid import cycles.
export function bindInput({start,pause,resume,closeShop}){
 // Menus
 $('start').onclick=start;$('restart').onclick=start;$('pause').onclick=pause;$('resume').onclick=resume;
 $('sound').onclick=toggleMute;$('closeShop').onclick=closeShop;
 $('graphics').value=S.graphicsLevel;
 $('graphics').onchange=e=>{S.graphicsLevel=e.target.value;S.enemyLimit=visual.graphics(S.graphicsLevel);resize()};

 // Keyboard
 window.addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
  keys[e.code]=true;if(e.repeat)return;
  if(e.code==='Escape'){if(S.mode==='play')pause();else if(S.mode==='paused')resume()}
  if(S.mode!=='play')return;
  if(e.code==='KeyR')reload();if(e.code==='KeyQ')switchGun();if(e.code==='KeyF')chargeStart();if(e.code==='KeyV')melee();if(e.code==='KeyE')openShop();
  if(e.code==='Space'&&S.jumpY===0)jump();if(e.code==='KeyC')toggleCrouch();
 });
 window.addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyF')chargeEnd()});
 window.addEventListener('blur',pause);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
 document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&!matchMedia('(pointer:coarse)').matches&&S.mode==='play')pause()});

 // Mouse
 window.addEventListener('mousemove',e=>{if(document.pointerLockElement&&S.mode==='play'){S.yaw-=e.movementX*.0022;S.pitch=clamp(S.pitch-e.movementY*.0022,-1.35,1.35)}});
 $('world').addEventListener('mousedown',e=>{if(S.mode!=='play')return;if(e.button===0){S.fireHeld=true;fire()}if(e.button===2)S.ads=true});
 window.addEventListener('mouseup',e=>{if(e.button===0)S.fireHeld=false;if(e.button===2)S.ads=false});
 window.addEventListener('contextmenu',e=>e.preventDefault());

 // Touch buttons
 function press(id,down,up=()=>{}){$(id).addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();$(id).setPointerCapture(e.pointerId);down()});for(let ev of ['pointerup','pointercancel'])$(id).addEventListener(ev,e=>{e.preventDefault();up()})}
 press('fire',()=>{S.fireHeld=true;fire()},()=>S.fireHeld=false);press('ads',()=>S.ads=!S.ads);press('reload',reload);
 press('jump',jump);press('crouch',toggleCrouch);press('switch',switchGun);
 press('wrath',chargeStart,chargeEnd);press('sprint',toggleSprint);press('interact',openShop);press('melee',melee);

 // Virtual joystick and touch-look
 let joyId=null,lookId=null,lx=0,ly=0;const joy=$('joystick');
 function joyMove(e){if(e.pointerId!==joyId)return;let r=joy.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/40,y=(e.clientY-r.top-r.height/2)/40,len=Math.max(1,Math.hypot(x,y));stick.x=x/len;stick.y=y/len;joy.firstElementChild.style.transform=`translate(${stick.x*32}px,${stick.y*32}px)`}
 joy.onpointerdown=e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);joyMove(e)};
 joy.onpointermove=joyMove;
 joy.onpointerup=joy.onpointercancel=()=>{joyId=null;stick.x=stick.y=0;joy.firstElementChild.style.transform=''};
 $('world').onpointerdown=e=>{if(e.pointerType==='mouse'||S.mode!=='play')return;lookId=e.pointerId;lx=e.clientX;ly=e.clientY;$('world').setPointerCapture(lookId)};
 $('world').onpointermove=e=>{if(e.pointerId!==lookId)return;S.yaw-=(e.clientX-lx)*.005;S.pitch=clamp(S.pitch-(e.clientY-ly)*.005,-1.35,1.35);lx=e.clientX;ly=e.clientY};
 $('world').onpointerup=$('world').onpointercancel=()=>lookId=null;
}
