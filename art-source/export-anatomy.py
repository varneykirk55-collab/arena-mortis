import bpy, json, array, base64, os
bpy.ops.wm.open_mainfile(filepath='/tmp/arena-assets/humans/human_base_meshes_bundle.blend')
print([(o.name,len(o.data.vertices)) for o in bpy.data.objects if o.type=='MESH' and ('realistic' in o.name.lower() or 'hand' in o.name.lower())])
out={}
for key,name,level in [('body','GEO-body_male_realistic',0),('hand','Hand  - Realistic',1)]:
 o=bpy.data.objects.get(name)
 if o is None: continue
 for mod in o.modifiers:
  if mod.type=='MULTIRES':mod.levels=level
 deps=bpy.context.evaluated_depsgraph_get();ev=o.evaluated_get(deps);m=ev.to_mesh();m.calc_loop_triangles()
 ps=[];ns=[];uv=[];ix=[];cache={};zmin=min(v.co.z for v in m.vertices);zmax=max(v.co.z for v in m.vertices);scale=1.94/(zmax-zmin) if key=='body' else 1
 for tri in m.loop_triangles:
  for li in reversed(tri.loops):
   l=m.loops[li];p=m.vertices[l.vertex_index].co;n=m.corner_normals[li].vector;u=m.uv_layers.active.data[li].uv if m.uv_layers.active else (0,0)
   tup=(l.vertex_index,round(u[0],6),round(u[1],6))
   if tup not in cache:
    cache[tup]=len(ps)//3;ps.extend([p.x*scale,(p.z-zmin)*scale if key=='body' else p.z,p.y*scale]);ns.extend([n.x,n.z,n.y]);uv.extend(u)
   ix.append(cache[tup])
 def enc(a,t):return base64.b64encode(array.array(t,a).tobytes()).decode()
 out[key]={k:enc(a,t) for k,a,t in [('position',ps,'f'),('normal',ns,'f'),('uv',uv,'f'),('index',ix,'I')]};print(key,len(ps)//3,len(ix)//3)
 ev.to_mesh_clear()
with open('/workspace/sites/arena-mortis/dist/anatomy-data.js','w') as f:f.write('export default '+json.dumps(out,separators=(',',':'))+';\n')
