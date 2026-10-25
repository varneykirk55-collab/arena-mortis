import fs from 'node:fs';
import assert from 'node:assert/strict';
const noop=()=>{};
const ctx=new Proxy({createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
const nodes=new Map();function element(){return {style:{},classList:{add:noop,remove:noop},addEventListener:noop,setPointerCapture:noop,append:noop,firstElementChild:{style:{}},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),requestPointerLock:()=>Promise.resolve(),width:0,height:0,textContent:'',innerHTML:''}}
globalThis.document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},createElement:element,createElementNS:()=>({addEventListener:noop,removeEventListener:noop,set src(v){}}),addEventListener:noop,exitPointerLock:noop};
const audioNode=()=>({connect(){return this},start:noop,stop:noop,frequency:{value:0},gain:{value:0,setValueAtTime:noop,exponentialRampToValueAtTime:noop}});
class Audio{currentTime=0;resume(){}createBuffer(){return {getChannelData:()=>new Float32Array(1)}}createBufferSource=audioNode;createBiquadFilter=audioNode;createGain=audioNode;createOscillator=audioNode;}
globalThis.window={addEventListener:noop,AudioContext:Audio};globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.devicePixelRatio=1;globalThis.matchMedia=()=>({matches:false});const saved={};globalThis.localStorage={getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v};globalThis.rendererStub={capabilities:{getMaxAnisotropy:()=>8},shadowMap:{},setPixelRatio:noop,setSize:noop,setAnimationLoop:noop,domElement:element(),render:noop};
globalThis.arenaRendererOverride=globalThis.rendererStub;
// Import the real modules (no source rewriting). The renderer override stands in for WebGL in Node.
const {start,update,render,pause,resume}=await import('./dist/game.js');
const {S,pos}=await import('./dist/state.js');
const {camera}=await import('./dist/world.js');
const {fire,reload,switchGun,chargeStart,chargeEnd,damage,gunModel}=await import('./dist/combat.js');
const {openShop,purchase}=await import('./dist/economy.js');
const {nextRound}=await import('./dist/waves.js');
const {die}=await import('./dist/player.js');
const t={start,update,fire,reload,switchGun,chargeStart,chargeEnd,openShop,purchase,die,nextRound,render,damage,state:()=>({...S,pos}),aimAt(e){camera.position.set(pos.x,1.7,pos.z);camera.lookAt(e.group.position.x,1.1,e.group.position.z);camera.updateMatrixWorld(true)},fund(n){S.points=n},equip(i){S.selected=i;gunModel()},setPosition(x,z){pos.set(x,0,z)},clear(){for(let e of S.enemies)damage(e,100000);S.remainingSpawn=0},resetClock(){S.shotClock=0}};
t.start();assert.equal(t.state().mode,'play');assert.equal(t.state().round,1);t.update(.02);let state=t.state();assert.equal(state.enemies.length,1);const e=state.enemies[0];e.group.position.set(0,0,8);t.aimAt(e);const ammo=state.guns[0].ammo;t.fire();assert.equal(t.state().guns[0].ammo,ammo-1);assert.ok(t.state().points>500,'Gun hit awards points');
t.reload();for(let i=0;i<55;i++)t.update(.04);assert.equal(t.state().guns[0].ammo,7);assert.equal(t.state().guns[0].stock,55);
t.chargeStart();assert.equal(t.state().charging,true);t.chargeEnd();assert.equal(t.state().wrathReady,false);t.chargeStart();assert.equal(t.state().charging,false,'One charge cannot be reused');
t.clear();for(let i=0;i<160;i++)t.update(.04);assert.equal(t.state().round,2);assert.equal(t.state().wrathReady,true);assert.ok(t.state().points>500);
t.setPosition(0,-21);t.openShop();assert.equal(t.state().mode,'shop');t.fund(10000);t.purchase(1500,()=>t.state().guns[1].owned=true);assert.equal(t.state().points,8500);assert.equal(t.state().guns[1].owned,true);t.equip(1);t.purchase(5000,()=>t.state().guns[1].up=true);assert.equal(t.state().guns[1].up,true);
t.die();assert.equal(t.state().mode,'dead');assert.ok(nodes.get('result').textContent.includes('round 2'));t.start();assert.equal(t.state().round,1);assert.equal(t.state().health,100);assert.equal(t.state().points,500);assert.equal(t.state().guns[1].owned,false);assert.equal(t.state().wrathReady,true);
console.log('PASS: actual game module simulated through spawn → aimed shot → score → reload/ammo accounting → Jupiter spent → wave clear → next round/recharge → altar → purchase → upgrade → death → restart. Renderer and audio mocked; this is NOT a visual/browser play-test.');
