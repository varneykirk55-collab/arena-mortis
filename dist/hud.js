// Announcements and the per-frame HUD readout.
import {S,pos} from './state.js';
import {$} from './util.js';
import {altar} from './world.js';

export function announce(msg){$('announcement').textContent=msg;S.announceUntil=S.time+3}

export function updateHud(living){
 $('remaining').textContent=S.roundWait?`NEXT WAVE IN ${Math.ceil(S.roundWait)}`:`${living+S.remainingSpawn} REMAINING`;
 $('round').textContent=S.round;$('points').textContent=S.points.toLocaleString();
 $('health').textContent=Math.ceil(S.health);$('healthbar').style.width=S.health+'%';
 let g=S.guns[S.selected];
 $('weapon').textContent=(g.up?'ASCENDED · ':'')+g.name.toUpperCase();
 $('ammo').innerHTML=(S.reloadLeft>0?'—':g.ammo)+' <em>/ '+g.stock+'</em>';
 $('wrathStatus').textContent=S.charging?'ϟ RELEASE TO CALL THE STORM':S.wrathReady?'ϟ JUPITER READY':'ϟ USED · RECHARGES NEXT ROUND';
 $('prompt').textContent=pos.distanceTo(altar.position)<5?'FORGE OF VULCAN · E / ALTAR TO BUY & UPGRADE':'';
 $('hit').style.opacity=S.time<S.hitUntil?1:0;
 $('announcement').style.opacity=S.time<S.announceUntil?1:0;
 $('vignette').style.boxShadow=S.time-S.lastDamage<.5?'inset 0 0 130px #ae1818bb':'inset 0 0 140px #0006';
}

export function showBest(){$('best').textContent=localStorage.getItem('arenaBest')?'PERSONAL BEST  '+Number(localStorage.getItem('arenaBest')).toLocaleString():''}
