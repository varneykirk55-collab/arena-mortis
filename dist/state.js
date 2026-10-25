// Shared, mutable game state. Every gameplay module reads and writes this one object,
// so values behave exactly like the old top-level `let` variables in game.js.
import * as T from './three.js';

export const defs=[
 {name:'Desert Eagle',cap:7,reserve:56,damage:52,rate:.32,reload:1.9,price:0},
 {name:'M4A1',cap:30,reserve:180,damage:25,rate:.095,reload:2,price:1500},
 {name:'Gallo',cap:8,reserve:48,damage:22,rate:.48,reload:2.6,price:2200}
];

export const S={
 guns:null,selected:0,round:0,points:500,score:0,kills:0,health:100,mode:'menu',
 enemies:[],fx:[],remainingSpawn:0,spawnClock:0,roundWait:0,
 wrathReady:true,wrathUp:false,charging:false,charge:0,lastDamage:-20,time:0,
 fireHeld:false,ads:false,crouching:false,sprinting:false,reloadLeft:0,shotClock:0,
 recoil:0,walk:0,jumpY:0,jumpV:0,announceUntil:0,hitUntil:0,nextGroan:0,
 yaw:0,pitch:0,muted:false,
 graphicsLevel:localStorage.getItem('arenaGraphics')||(matchMedia('(pointer:coarse)').matches?'balanced':'high'),
 enemyLimit:0
};

export const pos=new T.Vector3(0,0,12);
export const keys={},stick={x:0,y:0};

export function initGuns(){S.guns=defs.map((d,i)=>({...d,owned:i===0,ammo:d.cap,stock:d.reserve,up:false,attachments:{}}))}
initGuns();
