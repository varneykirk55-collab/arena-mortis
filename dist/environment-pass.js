import * as T from './three.js';
// Visual-only architecture. No collision, navigation, actor or gameplay state is modified.
// Its own random stream keeps character/weapon generation identical.
export function refineArena({world,floor,stone,marble,box,tube,mesh}){
 let seed=90217;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const limestone=stone.clone();limestone.color.setHex(0xc8bca4);limestone.normalScale.set(1.05,1.05);limestone.roughness=.98;
 const trim=marble.clone();trim.color.setHex(0xe2d4b8);trim.normalScale.set(.50,.50);trim.roughness=.86;
 const weathered=[0xa2957c,0xb6a68d,0xcfc0a4,0x8c826e].map(c=>{const m=limestone.clone();m.color.setHex(c);return m});
 let block=0;world.traverse(o=>{if(o.isMesh){if(o.material===stone){o.material=++block%5===0?weathered[block%4]:limestone;}else if(o.material===marble)o.material=trim;}});
 const aged=weathered[0],crevice=new T.MeshStandardMaterial({color:0x3b342a,roughness:1});
 const recess=new T.MeshStandardMaterial({color:0x191b1b,roughness:1,side:T.DoubleSide});
 const iron=new T.MeshStandardMaterial({color:0x34322c,metalness:.66,roughness:.78});
 const rockG=new T.DodecahedronGeometry(1,1);
 // Broad, irregular sand/dirt fields remain on the original floor mesh and heightfield.
 const sand=floor.material.clone();sand.color.setHex(0xe0cfad);sand.vertexColors=true;sand.normalScale.set(.85,.85);floor.material=sand;
 const pos=floor.geometry.attributes.position,colors=[];
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i),r=Math.hypot(x,z);
  const broad=Math.sin(x*.19+Math.sin(z*.12)*2)*Math.cos(z*.23-x*.04);
  const grain=Math.sin(x*1.7+z*.6)*Math.sin(z*1.2-x*.3);
  const worn=Math.exp(-Math.pow((r-24-Math.sin(Math.atan2(x,z)*5)*1.7)/2.1,2));
  const edge=Math.max(0,Math.min(1,(r-27)/7));
  const v=.84+broad*.17+grain*.035-worn*.19-edge*.22;
  colors.push(v,v*.965,v*.90);
 }
 floor.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 function stainTexture(blood,vertical=false){
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  for(let i=0;i<(vertical?150:200);i++){
   let a=rnd()*Math.PI*2,r=rnd()*100,px=128+Math.cos(a)*r,py=128+Math.sin(a)*r;
   if(vertical){px=rnd()*256;py=180+rnd()*76;}
   x.fillStyle=blood?`rgba(67,24,17,${.08+rnd()*.22})`:`rgba(34,30,22,${.04+rnd()*.15})`;
   x.beginPath();x.ellipse(px,py,vertical?2+rnd()*7:4+rnd()*24,vertical?20+rnd()*95:2+rnd()*14,vertical?0:rnd()*3,0,Math.PI*2);x.fill();
  }
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
 }
 const damp=new T.MeshStandardMaterial({map:stainTexture(false,true),transparent:true,opacity:.82,roughness:1,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
 const dampG=new T.PlaneGeometry(3.22,3.9);
 for(let i=0;i<64;i++){
  const a=i*Math.PI/32,g=new T.Group();g.position.set(Math.sin(a)*34,0,Math.cos(a)*34);g.rotation.y=a;world.add(g);
  // Heavy podium ledges cast a continuous shadow over the weathered lower walls.
  for(let [y,h,d] of [[4.22,.18,.50],[4.52,.25,.74],[4.92,.16,.94]])box(g,y===4.52?aged:trim,[0,y,-1.18],[3.48,h,d]);
  for(let j=-4;j<=4;j++)box(g,trim,[j*.37,4.04,-1.3],[.19,.25,.34]);
  if(i%8!==0){
   const stain=mesh(g,dampG,damp,[0,2.05,-1.115]);stain.rotation.y=Math.PI;stain.castShadow=false;
   for(let j=0;j<4;j++){
    const x=(rnd()-.5)*2.6,y=.1+rnd()*2.8;
    const pts=[new T.Vector3(x,y,-1.119),new T.Vector3(x+.13,y+.28,-1.123),new T.Vector3(x+.02,y+.56,-1.122),new T.Vector3(x+.19,y+.83,-1.122)];
    mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(pts),8,.013,4,false),crevice);
   }
   // Buttress bases remain beyond radius 32, outside the 31.15m player boundary.
   if(i%2===0){
    box(g,aged,[0,.35,-1.25],[.96,.7,.78]);box(g,limestone,[0,2.15,-1.18],[.60,2.9,.55]);
    box(g,trim,[0,3.67,-1.22],[.88,.18,.74]);box(g,trim,[0,.83,-1.28],[.76,.12,.68]);
   }else{
    // Blind arched niches give the podium a readable recessed rhythm.
    const shape=new T.Shape();shape.moveTo(-.50,.65);shape.lineTo(-.50,2.3);shape.absarc(0,2.3,.5,Math.PI,0,true);shape.lineTo(.50,.65);shape.closePath();
    const niche=mesh(g,new T.ShapeGeometry(shape,18),recess,[0,0,-1.125]);niche.rotation.y=0;
    for(let side of [-1,1])box(g,aged,[side*.62,1.55,-1.25],[.23,1.85,.25]);
    for(let k=0;k<9;k++){
     const aa=k*Math.PI/9+.013,bb=(k+1)*Math.PI/9-.013,s=new T.Shape();
     s.moveTo(Math.cos(aa)*.5,2.3+Math.sin(aa)*.5);s.absarc(0,2.3,.5,aa,bb,false);s.lineTo(Math.cos(bb)*.74,2.3+Math.sin(bb)*.74);s.absarc(0,2.3,.74,bb,aa,true);s.closePath();
     mesh(g,new T.ExtrudeGeometry(s,{depth:.22,bevelEnabled:false,curveSegments:3}),trim,[0,0,-1.36]);
    }
    box(g,trim,[0,.60,-1.24],[1.6,.18,.47]);
   }
   // Rubble is confined to the inaccessible perimeter; no new invisible obstacles.
   for(let j=0;j<7;j++){
    const sx=.16+rnd()*.28,sy=.11+rnd()*.22,sz=.16+rnd()*.22;
    const o=mesh(g,rockG,weathered[j%4],[(rnd()-.5)*2.8,sy*.5,-1.25],[sx,sy,sz]);o.rotation.set(rnd()*.5,rnd()*6,rnd()*.5);
   }
  }else{
   // Existing entrances and spawn coordinates are unchanged; decorate their exteriors.
   for(let side of [-1,1]){
    box(g,aged,[side*1.72,1.9,-.40],[.30,3.8,2.8]);
    box(g,trim,[side*1.73,3.86,-.50],[.55,.22,3.0]);
    for(let h of [.45,1.15,1.85])box(g,trim,[side*1.69,h,2.6],[.14,.09,5.2]);
   }
   for(let h of [.65,2.65]){box(g,iron,[0,h,4.93],[2.65,.12,.12]);for(let x=-1.2;x<=1.2;x+=.3)mesh(g,new T.SphereGeometry(.055,8,6),iron,[x,h,4.84],[1,1,.5]);}
   box(g,aged,[0,4.12,-.34],[3.75,.28,2.9]);box(g,trim,[0,4.38,-.40],[3.95,.18,3.1]);
  }
  for(let tier=0;tier<3;tier++){
   const y=8+tier*7,z=6+tier*7.4,w=(40+tier*7.4)/54,ruined=tier===2&&(i%17===5||i%17===6);
   const balcony=new T.Group();balcony.position.set(0,y,z);balcony.scale.x=w;g.add(balcony);
   // Deep arcade pockets and side returns, rather than shallow arches on one wall.
   if(!ruined){
    const pocket=mesh(balcony,new T.PlaneGeometry(3.6,4.5),recess,[0,2.25,1.6]);pocket.castShadow=false;
    for(let side of [-1,1])box(balcony,aged,[side*1.84,1.5,.85],[.16,3,1.65]);
    box(balcony,crevice,[0,.02,.8],[3.7,.16,2.7]);
    box(balcony,trim,[0,.22,-1.12],[5.3,.17,.64]);box(balcony,trim,[0,.98,-1.12],[5.3,.16,.55]);
    for(let j=-5;j<=5;j++){
     if((i+j+tier*3)%13===0)continue;
     tube(balcony,aged,[j*.43,.27,-1.12],[j*.43,.93,-1.12],.075,.060,8);
    }
    for(let x of [-2.43,2.43])box(balcony,trim,[x,5.46,-1.12],[.78,.17,.78]);
    for(let j=-4;j<=4;j++)box(balcony,trim,[j*.57,5.57,-1.06],[.20,.22,.42]);
    // Irregular parapet breaks alter the skyline, without changing any walkable area.
    if(tier===2)for(let k=-2;k<=2;k++){
     if((i*3+k+64)%11<2)continue;
     box(balcony,weathered[(i+k+64)%4],[k*1.04,6.55,0],[1.01,.6+((i+k+64)%3)*.18,1.35]);
    }
   }else{
    for(let j=0;j<9;j++){
     const o=mesh(balcony,rockG,weathered[j%4],[(rnd()-.5)*4.6,.25+rnd()*.30,0],[.3+rnd()*.45,.25+rnd()*.3,.5+rnd()*.4]);o.rotation.set(rnd(),rnd()*6,rnd());
    }
   }
   // Seating aisle cornice follows each bank, reinforcing the stepped bowl silhouette.
   box(g,trim,[0,y-.1,z-1.1],[3.5+(z-1.1)*.1,.22,.85]);
  }
 }
 // Ground overlays add blood, dirt and disturbed sand without altering its elevation.
 const dirtMap=stainTexture(false),bloodMap=stainTexture(true);
 const marks=[dirtMap,bloodMap].map(map=>new T.MeshStandardMaterial({map,transparent:true,opacity:.75,roughness:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
 const plane=new T.PlaneGeometry(1,1),floorDressing=new T.Group();world.add(floorDressing);
 for(let i=0;i<56;i++){
  const a=rnd()*Math.PI*2,r=i<32?25+rnd()*7:4+rnd()*23,s=2.5+rnd()*5;
  const mark=mesh(floorDressing,plane,marks[i%5===0?1:0],[Math.sin(a)*r,.015,Math.cos(a)*r],[s,s*.65,1]);
  mark.rotation.set(-Math.PI/2,0,rnd()*Math.PI);mark.castShadow=false;
 }
}
