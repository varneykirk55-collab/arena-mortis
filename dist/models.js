// External model manifest. Set a `url` (relative to index.html, e.g. 'models/pistol.glb') to
// replace a procedural model. Leave `url: null` to keep the built-in one. A missing or broken
// file is logged as a warning and the built-in model is used instead.
//
// Pistol ('pistol')
//   The model is placed in the same space as the procedural pistol: barrel along -Z, sights up +Y,
//   roughly 0.3 m long. Use scale/position/rotation to line it up with the first-person hands.
//   Optional named nodes: 'slide' and 'magazine' are animated by the existing recoil/reload code,
//   and an empty node named 'muzzle' marks the barrel tip (or set `muzzle` to a Z value).
//
// Zombies ('zombie' for all variants, or 'zombie0'…'zombie3' to override one:
//          0 shambler · 1 runner · 2 armoured · 3 brute, which the game scales up 1.25×)
//   Models are scaled to `height` metres, stood on the ground and turned by `rotationY`
//   (glTF faces +Z; the default Math.PI turns it to face the player). Hit zones assume ~1.8 m.
//   `animation`: 'auto' picks the first that applies —
//     'clips'      the file's own animations, matched by name (walk/run/attack/idle/death),
//                  or set `animations: {walk: 'Zombie_Walk', ...}` to name them exactly;
//     'procedural' the game's built-in walk/attack/stagger/death, retargeted onto a humanoid
//                  skeleton (Mixamo, Blender and common names are detected; override with
//                  `bones: {body:'Hips', head:'Head', arms:[...], elbows:[...], legs:[...], knees:[...]}`);
//     'none'       a rigid model that still leans, bobs and topples when killed.
export const MODELS={
 pistol:{url:null,scale:1,position:[0,0,0],rotation:[0,0,0],muzzle:null,nodes:{slide:'slide',magazine:'magazine',muzzle:'muzzle'}},
 zombie:{url:null,height:1.8,rotationY:Math.PI,animation:'auto',animations:{},bones:{}}
};
