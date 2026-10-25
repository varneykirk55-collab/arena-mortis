// The altar shop (Forge of Vulcan): weapons, resupply, upgrades and attachments.
import {S,pos} from './state.js';
import {$} from './util.js';
import {altar} from './world.js';
import {tone} from './audio.js';
import {announce} from './hud.js';
import {gunModel} from './combat.js';

export function openShop(){
 if(S.mode!=='play'||pos.distanceTo(altar.position)>5){announce('FIND THE BLUE ALTAR AT THE NORTH GATE');return}
 S.mode='shop';S.fireHeld=false;document.exitPointerLock?.();$('shop').classList.remove('hidden');renderShop();
}

export function purchase(cost,fn){if(S.points<cost)return;S.points-=cost;fn();tone(640,.15);renderShop();gunModel()}

export function renderShop(){
 let g=S.guns[S.selected];
 $('balance').textContent=`${S.points.toLocaleString()} denarii · Equipped: ${g.name} · Time pauses at the altar`;
 $('shopItems').innerHTML='';
 const item=(title,desc,cost,fn,disabled=false)=>{let b=document.createElement('button');b.innerHTML=title+' <strong>'+(cost?cost.toLocaleString():'')+'</strong><small>'+desc+'</small>';b.disabled=disabled||S.points<cost;b.onclick=()=>purchase(cost,fn);$('shopItems').append(b)};
 for(let [i,w] of S.guns.entries())item(w.name,w.owned?'Equip weapon':'Purchase with full ammunition',w.owned?0:w.price,()=>{w.owned=true;S.selected=i;S.reloadLeft=0});
 item('Resupply','Refill reserve ammunition for equipped weapon',300,()=>g.stock=g.reserve);
 item(g.up?'ASCENDED':'Vulcan’s Ascension',S.selected===0?'Explosive rounds • no self-damage':S.selected===1?'Arc rounds chain to nearby enemies':'Thunder shells • stronger pellets and knockback',5000,()=>{g.up=true;g.ammo=g.cap;g.stock=g.reserve},g.up);
 item('Jupiter: Storm Dominion','Wider strike radius • still one charge per round',4000,()=>S.wrathUp=true,S.wrathUp);
 for(let [key,label,desc,cost] of [['optic','Optic','Tighter aim and stronger zoom',600],['magazine','Extended magazine','50% more rounds per magazine',800],['grip','Grip / stock','Reduced recoil and steady handling',650],['muzzle',S.selected===2?'Long barrel':'Muzzle assembly','20% higher damage',900]])
  item(label,desc,cost,()=>{g.attachments[key]=true;if(key==='magazine'){g.cap=Math.ceil(g.cap*1.5);g.ammo=g.cap}if(key==='muzzle')g.damage*=1.2},g.attachments[key]);
}
