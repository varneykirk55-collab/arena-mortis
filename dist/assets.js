// glTF/GLB asset loading with a cache. Anything that fails to load is simply absent,
// and the presentation falls back to its procedural model for that slot.
import {GLTFLoader} from './addons/GLTFLoader.js';
import {clone as cloneSkinned} from './addons/SkeletonUtils.js';

const loader=new GLTFLoader();
const files=new Map();   // url → Promise<gltf>
const models=new Map();  // key → {gltf, config}

export function loadGLTF(url){
 if(!files.has(url))files.set(url,loader.loadAsync(url).catch(err=>{files.delete(url);throw err}));
 return files.get(url);
}

// Register an already-parsed glTF under a key (used by preloadModels, and handy for tests or tools).
export function registerModel(key,gltf,config={}){models.set(key,{gltf,config});}
export function hasModel(key){return models.has(key)}

// Loads every manifest entry that has a url. Never rejects: failures are reported and skipped.
export async function preloadModels(manifest){
 const loaded=[],failed=[];
 await Promise.all(Object.entries(manifest).map(async([key,entry])=>{
  if(!entry?.url)return;
  try{registerModel(key,await loadGLTF(entry.url),entry);loaded.push(key)}
  catch(err){failed.push(key);console.warn(`[assets] "${key}" could not load ${entry.url}; using the built-in model.`,err?.message||err)}
 }));
 return {loaded,failed};
}

// A fresh, independently animatable copy of a registered model, or null if none is registered.
// This is the provider handed to the presentation (visual.setModelProvider).
export function instantiate(key){
 const m=models.get(key);if(!m)return null;
 const scene=m.gltf.scene||m.gltf.scenes?.[0];if(!scene)return null;
 return {root:cloneSkinned(scene),animations:m.gltf.animations||[],config:m.config};
}
