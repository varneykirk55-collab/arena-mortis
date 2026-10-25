// Scene, renderer, camera and the persistent first-person groups.
// Everything here is created once at import time, in the same order as the old game.js.
import * as T from './three.js';
import {createPresentation} from './presentation.js';
import {$} from './util.js';
import {S} from './state.js';

export const scene=new T.Scene();scene.background=new T.Color(0x827466);scene.fog=new T.FogExp2(0xb0a08a,.012);

// Test harnesses (no WebGL in Node) may supply a stand-in renderer before importing the game.
export const renderer=globalThis.arenaRendererOverride??new T.WebGLRenderer({canvas:$('world'),antialias:!matchMedia('(pointer:coarse)').matches,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;

export const camera=new T.PerspectiveCamera(72,innerWidth/innerHeight,.05,220);camera.rotation.order='YXZ';scene.add(camera);

export const visual=createPresentation(scene,camera,renderer);
export const {gates,obstacles,altar}=visual;
export const altarGlow=visual.glow;
S.enemyLimit=visual.graphics(S.graphicsLevel);

// First-person rig: hand → [gun, muzzle flash, Jupiter artifact].
export const hand=new T.Group();camera.add(hand);
export const gunGroup=new T.Group();hand.add(gunGroup);
export const flash=new T.Mesh(new T.ConeGeometry(.12,.55,6),new T.MeshBasicMaterial({color:0xffcf73}));flash.rotation.x=-Math.PI/2;flash.visible=false;hand.add(flash);

export const targetRing=new T.Mesh(new T.RingGeometry(5.8,6,48),new T.MeshBasicMaterial({color:0x80dfff,transparent:true,opacity:.32,side:T.DoubleSide}));targetRing.rotation.x=-Math.PI/2;targetRing.visible=false;scene.add(targetRing);

export const artifact=new T.Group();hand.add(artifact);artifact.visible=false;visual.makeArtifact(artifact);

// Arena wall (radius 31.6) and pillar collision, shared by the player and the dead.
export function moveCollide(p,dx,dz,r=.45){
 p.x+=dx;p.z+=dz;let len=Math.hypot(p.x,p.z);
 if(len>31.6-r){p.x*=(31.6-r)/len;p.z*=(31.6-r)/len}
 for(let o of obstacles){let x=p.x-o.x,z=p.z-o.z,d=Math.hypot(x,z);if(d<o.r+r&&d>.001){p.x=o.x+x/d*(o.r+r);p.z=o.z+z/d*(o.r+r)}}
}

export function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
