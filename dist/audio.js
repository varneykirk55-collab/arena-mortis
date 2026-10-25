// Web Audio synthesis. No audio files; everything is generated noise and tones.
import {S} from './state.js';
import {$} from './util.js';

let audio;

export function ensureAudio(){audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume()}

export function sound(type){
 if(S.muted||!audio)return;
 let now=audio.currentTime,buf=audio.createBuffer(1,audio.sampleRate*(type==='thunder'?2:.3),audio.sampleRate),d=buf.getChannelData(0);
 for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/d.length*(type==='thunder'?2:9));
 let src=audio.createBufferSource();src.buffer=buf;
 let filter=audio.createBiquadFilter();filter.type='lowpass';
 filter.frequency.value=({shot:2200,eagle:1700,shotgun:1100,thunder:280,hit:650,step:220,reload:2800,growl:120})[type]||700;
 let gain=audio.createGain();
 gain.gain.value=({shot:.21,eagle:.35,shotgun:.4,thunder:.8,hit:.13,step:.05,reload:.12,growl:.18})[type]||.13;
 src.connect(filter).connect(gain).connect(audio.destination);src.start(now);
}

export function tone(freq,duration=.25){
 if(!audio||S.muted)return;
 let o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;o.type='sine';
 g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
 o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);
}

export function toggleMute(){S.muted=!S.muted;$('sound').textContent=S.muted?'SOUND OFF':'SOUND ON'}
