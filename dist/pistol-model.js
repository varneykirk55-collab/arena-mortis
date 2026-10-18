import * as T from './three.js';
// Reference-led pistol geometry only. Existing animation groups and muzzle anchor stay intact.
let finishes;
function materials(){
 if(finishes)return finishes;
 let seed=781;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 function texture(grip){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=grip?'#777777':'#b9b9b9';x.fillRect(0,0,512,512);
  for(let i=0;i<(grip?18000:8000);i++){const px=rand()*512,py=rand()*512,v=grip?55+Math.floor(rand()*125):145+Math.floor(rand()*75);x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(px,py,grip?1+rand()*3:1,grip?1+rand()*3:1);}
  if(!grip)for(let i=0;i<120;i++){x.strokeStyle='rgba(230,230,230,.12)';x.lineWidth=.5;x.beginPath();const px=rand()*512,py=rand()*512;x.moveTo(px,py);x.lineTo(px+4+rand()*35,py+rand()*2);x.stroke();}
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;return t;
 }
 const metalMap=texture(false),gripMap=texture(true);
 finishes={steel:new T.MeshStandardMaterial({color:0x363a3d,map:metalMap,metalness:.78,roughness:.39}),edge:new T.MeshStandardMaterial({color:0x44494d,map:metalMap,metalness:.8,roughness:.34}),recess:new T.MeshStandardMaterial({color:0x101215,roughness:.70,metalness:.35}),grip:new T.MeshStandardMaterial({color:0x222426,map:gripMap,bumpMap:gripMap,bumpScale:.00045,roughness:.92,metalness:0}),glove:new T.MeshStandardMaterial({color:0x343638,map:gripMap,bumpMap:gripMap,bumpScale:.00018,roughness:.96}),dot:new T.MeshStandardMaterial({color:0xa7aaa0,roughness:.7}),safe:new T.MeshStandardMaterial({color:0x793021,roughness:.8})};
 return finishes;
}
export function buildPistol({body,slide,magazine,mesh,box,tube,ring,profile}){
 const m=materials();
 // Long faceted barrel shroud, with an actual open bore and bevelled muzzle crown.
 const cross=new T.Shape();[[-.015,-.022],[.015,-.022],[.022,-.011],[.022,.029],[.011,.047],[-.011,.047],[-.022,.029],[-.022,-.011]].forEach(([x,y],i)=>i?cross.lineTo(x,y):cross.moveTo(x,y));cross.closePath();
 const bore=new T.Path();bore.absarc(0,0,.0094,0,Math.PI*2,true);cross.holes.push(bore);
 mesh(body,new T.ExtrudeGeometry(cross,{depth:.171,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:.0012,bevelThickness:.0012,curveSegments:28}),m.steel,[0,0,-.212]);
 ring(body,m.edge,.0104,.0011,[0,0,-.214],[0,0,0]);
 const inner=mesh(body,new T.CylinderGeometry(.0093,.0093,.033,32,1,true),m.recess,[0,0,-.193]);inner.rotation.x=Math.PI/2;
 const boreBack=mesh(body,new T.CircleGeometry(.0092,32),m.recess,[0,0,-.176]);boreBack.rotation.y=Math.PI;
 // Wide rear slide, chamber step, separate extractor and recessed ejection opening.
 profile(slide,m.steel,[[-.063,-.014],[-.063,.024],[-.053,.049],[.016,.049],[.037,.033],[.037,-.015]],.044,[0,0,0]);
 box(slide,m.recess,[.0226,.023,-.019],[.0015,.020,.036]);
 box(slide,m.edge,[.024,.013,-.017],[.002,.003,.033]);
 tube(body,m.edge,[0,.023,-.065],[0,.023,-.033],.012,.012,24);
 for(let side of [-1,1]){
  for(let j=0;j<10;j++){const line=box(slide,m.recess,[side*.0227,.012,.024+j*.0035],[.0015,.043,.0014]);line.rotation.x=-.18;}
  profile(body,m.edge,[[.048,.026],[.185,.026],[.194,.017],[.048,.017]],.001,[side*.0225,0,0]);
  profile(body,m.recess,[[.047,-.008],[.19,-.008],[.19,-.010],[.047,-.010]],.001,[side*.0226,0,0]);
 }
 // Frame, under-barrel accessory rail, beavertail, and palm-filling raked grip.
 profile(body,m.steel,[[-.069,-.017],[-.058,-.028],[-.052,-.051],[-.062,-.132],[-.046,-.143],[.013,-.135],[.022,-.119],[.011,-.049],[.030,-.024],[.195,-.024],[.197,-.012],[-.053,-.012]],.038,[0,0,0]);
 profile(body,m.steel,[[-.062,-.025],[-.083,-.027],[-.070,-.035],[-.052,-.035]],.041,[0,0,0]);
 box(body,m.steel,[0,-.024,-.126],[.031,.009,.135]);
 for(let j=0;j<10;j++)box(body,m.recess,[0,-.029,-.065-j*.013],[.033,.003,.004]);
 const gripOutline=[[-.049,-.043],[-.005,-.042],[.010,-.125],[-.046,-.134],[-.054,-.124]];
 for(let side of [-1,1]){
  profile(body,m.recess,[[-.052,-.039],[-.001,-.039],[.015,-.129],[-.049,-.139],[-.059,-.126]],.003,[side*.019,0,0]);
  profile(body,m.grip,gripOutline,.003,[side*.021,0,0]);
  for(let y of [-.055,-.122]){const z=y===-.055?.024:.032;tube(body,m.edge,[side*.022,y,z],[side*.024,y,z],.0032,.0032,16);box(body,m.recess,[side*.025,y,z],[.001,.0008,.004]);}
  tube(body,m.recess,[side*.023,-.088,.025],[side*.024,-.088,.025],.008,.008,24);
 }
 // Squared guard with rounded corners and a separate curved trigger.
 const guard=new T.Shape();guard.moveTo(-.006,-.031);guard.lineTo(.011,-.068);guard.quadraticCurveTo(.015,-.078,.025,-.078);guard.lineTo(.061,-.077);guard.quadraticCurveTo(.069,-.075,.069,-.067);guard.lineTo(.065,-.029);guard.lineTo(.059,-.029);guard.lineTo(.063,-.066);guard.quadraticCurveTo(.063,-.071,.057,-.072);guard.lineTo(.025,-.072);guard.quadraticCurveTo(.020,-.072,.017,-.065);guard.lineTo(.004,-.031);guard.closePath();
 const guardMesh=mesh(body,new T.ExtrudeGeometry(guard,{depth:.022,bevelEnabled:true,bevelSize:.001,bevelThickness:.001,bevelSegments:3,steps:1,curveSegments:14}),m.steel);guardMesh.geometry.translate(0,0,-.011);guardMesh.rotation.y=Math.PI/2;
 const trig=new T.CatmullRomCurve3([new T.Vector3(0,-.031,-.032),new T.Vector3(0,-.047,-.035),new T.Vector3(0,-.060,-.028),new T.Vector3(0,-.064,-.021)]);mesh(body,new T.TubeGeometry(trig,18,.0024,10,false),m.edge);
 // Ambidextrous safety levers, slide stop, pins and exposed hammer.
 for(let side of [-1,1]){
  tube(slide,m.edge,[side*.021,.029,.044],[side*.028,.029,.044],.006,.006,24);
  tube(slide,m.recess,[side*.028,.029,.044],[side*.029,.029,.044],.0034,.0034,20);
  profile(slide,m.steel,[[-.045,.031],[-.023,.023],[-.024,.018],[-.046,.023]],.004,[side*.028,0,0]);
  tube(slide,m.safe,[side*.023,.014,.045],[side*.024,.014,.045],.0016,.0016,12);
  for(let z of [-.012,.039])tube(body,m.edge,[side*.020,-.024,z],[side*.023,-.024,z],.003,.003,16);
 }
 profile(body,m.edge,[[-.032,-.017],[.017,-.018],[.022,-.025],[-.030,-.025]],.004,[-.024,0,0]);
 profile(slide,m.recess,[[-.060,.008],[-.078,.025],[-.081,.039],[-.074,.042],[-.061,.031]],.010,[0,0,0]);
 for(let j=0;j<5;j++)box(slide,m.edge,[0,.037,.071+j*.0017],[.012,.001,.0008]);
 // Machined top rail and open rear notch: sights retain the existing ADS height.
 box(body,m.steel,[0,.047,-.130],[.018,.004,.148]);
 for(let j=0;j<12;j++)box(body,m.edge,[0,.050,-.068-j*.011],[.023,.003,.006]);
 box(slide,m.recess,[0,.051,.048],[.032,.005,.017]);
 for(let side of [-1,1]){box(slide,m.steel,[side*.010,.060,.048],[.010,.016,.012]);box(slide,m.dot,[side*.010,.061,.0543],[.002,.002,.0005]);}
 box(body,m.steel,[0,.060,-.195],[.005,.018,.010]);box(body,m.dot,[0,.065,-.1898],[.0018,.002,.0005]);
 // Same detachable magazine group and anchors as before; animation remains owned by presentation.js.
 box(magazine,m.recess,[0,-.086,.027],[.022,.092,.040]);box(magazine,m.steel,[0,-.137,.03],[.042,.010,.061]);box(magazine,m.edge,[0,-.143,.031],[.044,.003,.063]);
 // Fit the reference's roughly 29cm by 16cm silhouette while keeping the muzzle
 // and sight line fixed. Compress only the lower frame, guard and grip geometry.
 for(const root of [body,slide,magazine])root.traverse(o=>{if(!o.isMesh)return;o.updateMatrix();const geo=o.geometry.clone();geo.applyMatrix4(o.matrix);const a=geo.attributes.position;for(let i=0;i<a.count;i++){const y=a.getY(i);if(y<-.020)a.setY(i,-.020+(y+.020)*.60);}geo.computeVertexNormals();o.geometry=geo;o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);});
 return m;
}
export function dressPistolHands(mainHand,leftHand){
 const m=materials();for(const root of [mainHand,leftHand])root.traverse(o=>{if(o.isMesh)o.material=m.glove;});
 mainHand.position.set(.017,-.004,.028);mainHand.rotation.set(.08,-.10,-.10);
 leftHand.position.set(-.026,-.022,.020);
}
