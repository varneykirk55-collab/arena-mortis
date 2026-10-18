import * as T from './three.js';
import data from './anatomy-data.js';
const cache={};
export function anatomyGeometry(name='body'){if(cache[name])return cache[name];const g=new T.BufferGeometry();for(let [key,s] of Object.entries(data[name])){let b=Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;if(key==='index')g.setIndex(new T.BufferAttribute(new Uint32Array(b),1));else g.setAttribute(key,new T.BufferAttribute(new Float32Array(b),key==='uv'?2:3));}g.computeBoundingSphere();return cache[name]=g;}
export function sculptedHand(parent,material,scale=1,grip=false){const geo=anatomyGeometry('hand').clone(),p=geo.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(grip&&y<-.05){const bend=Math.min(1,(-y-.05)/.15);z-=Math.sin(bend*1.8)*.06;y=-.05-Math.sin(bend*1.8)*.085;}p.setXYZ(i,x*.64,(y-.04)*.64,z*.64)}geo.computeVertexNormals();const g=new T.Group(),m=new T.Mesh(geo,material);g.add(m);g.scale.setScalar(scale);parent.add(g);return g;}
// Reconcile shading across UV seams without welding UVs or adding triangles.
export function smoothZombieNormals(geo){
 geo.computeVertexNormals();const p=geo.attributes.position,n=geo.attributes.normal,groups=new Map();
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*100000)).join(',');let a=groups.get(key);if(!a)groups.set(key,a=[]);a.push(i);}
 for(const ids of groups.values()){if(ids.length<2)continue;const v=new T.Vector3();for(const i of ids)v.add(new T.Vector3(n.getX(i),n.getY(i),n.getZ(i)));v.normalize();for(const i of ids)n.setXYZ(i,v.x,v.y,v.z);}return geo;
}
export function bindBody(group,rig,material){
 const geo=anatomyGeometry().clone(),bones=[rig.body,rig.head,...rig.arms,...rig.elbows,...rig.legs,...rig.knees];group.updateMatrixWorld(true);
 const inv=group.matrixWorld.clone().invert(),pos=bones.map(b=>b.getWorldPosition(new T.Vector3()).applyMatrix4(inv));
 const ends=[new T.Vector3(0,1.5,0),new T.Vector3(0,1.94,0),pos[4],pos[5],new T.Vector3(-.49,.84,0),new T.Vector3(.49,.84,0),pos[8],pos[9],new T.Vector3(-.24,.05,.05),new T.Vector3(.24,.05,.05)];
 const si=[],sw=[],colors=[],p=geo.attributes.position,v=new T.Vector3(),smooth=(a,b,x)=>T.MathUtils.smoothstep(x,a,b);
 function pair(a,b){const ds=[a,b].map(j=>{const delta=ends[j].clone().sub(pos[j]),t=T.MathUtils.clamp(v.clone().sub(pos[j]).dot(delta)/Math.max(1e-8,delta.lengthSq()),0,1);return 1/Math.pow(.07+v.distanceTo(pos[j].clone().addScaledVector(delta,t)),2.5)});return ds.map(w=>w/(ds[0]+ds[1]));}
 for(let i=0;i<p.count;i++){
  v.fromBufferAttribute(p,i);const side=v.x<0?0:1;
  // Outer hands stay with the arms, even below the hips. Broad overlaps avoid hard weight bands.
  const arm=smooth(.18,.30,Math.abs(v.x))*(1-smooth(1.52,1.68,v.y))*smooth(.70,.80,v.y);
  const leg=(1-arm)*(1-smooth(.90,1.10,v.y));const head=(1-arm)*(1-leg)*smooth(1.57,1.73,v.y);
  const ap=pair(2+side,4+side),lp=pair(6+side,8+side);
  const weights=[[0,Math.max(0,1-arm-leg-head)],[1,head],[2+side,arm*ap[0]],[4+side,arm*ap[1]],[6+side,leg*lp[0]],[8+side,leg*lp[1]]].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=weights.reduce((a,b)=>a+b[1],0);
  for(const [bone,w] of weights){si.push(bone);sw.push(w/sum);}colors.push(.76,.72,.61);
 }
 geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 const mat=material.clone();mat.vertexColors=true;const m=new T.SkinnedMesh(geo,mat);m.name='Sculpted human anatomy';m.castShadow=m.receiveShadow=true;group.add(m);m.bind(new T.Skeleton(bones));geo.boundingSphere=new T.Sphere(new T.Vector3(0,1,0),1.8);return m;
}
export function statue(material){const g=new T.Group(),geo=anatomyGeometry().clone(),p=geo.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(x<-.22&&y>1){let dx=x+.22,dy=y-1.55,a=-2.3;p.setXYZ(i,-.22+dx*Math.cos(a)-dy*Math.sin(a),1.55+dx*Math.sin(a)+dy*Math.cos(a),z)}}geo.computeVertexNormals();g.add(new T.Mesh(geo,material));return g;}
