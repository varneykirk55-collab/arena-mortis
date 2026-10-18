# Offline asset/first-person comparison only. Does not verify WebGL or gameplay.
import bpy,json,array,math,os
from mathutils import Matrix,Vector
root='/tmp/arena-assets/qa';d=json.load(open(root+'/scene.json'));bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
def values(path,t='f'):
 a=array.array(t);a.frombytes(open(path,'rb').read());return a
mats=[]
for i,md in enumerate(d['materials']):
 m=bpy.data.materials.new('actual-material-'+str(i));m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=(*md['color'],1);p.inputs['Metallic'].default_value=md['metal'];p.inputs['Roughness'].default_value=md['rough'];p.inputs['Alpha'].default_value=md['opacity']
 if md.get('emissive'):p.inputs['Emission Color'].default_value=(*md['emissive'],1);p.inputs['Emission Strength'].default_value=md['strength']
 for key in ['map','normal','roughmap']:
  if key not in md or not os.path.exists(md[key]):continue
  im=n.new('ShaderNodeTexImage');im.image=bpy.data.images.load(md[key],check_existing=True)
  uv=n.new('ShaderNodeTexCoord');mapping=n.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(*md[key+'Repeat'],1);l.new(uv.outputs['UV'],mapping.inputs[0]);l.new(mapping.outputs[0],im.inputs[0])
  if key=='map':
   mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;mul.inputs[2].default_value=(*md['color'],1);l.new(im.outputs['Color'],mul.inputs[1]);l.new(mul.outputs[0],p.inputs['Base Color']);l.new(im.outputs['Alpha'],p.inputs['Alpha'])
  elif key=='normal':
   im.image.colorspace_settings.name='Non-Color';nm=n.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.65;l.new(im.outputs['Color'],nm.inputs['Color']);l.new(nm.outputs[0],p.inputs['Normal'])
  else:im.image.colorspace_settings.name='Non-Color';l.new(im.outputs['Color'],p.inputs['Roughness'])
 if md.get('vertexColors'):
  attr=n.new('ShaderNodeVertexColor');attr.layer_name='Col';mix=n.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;l.new(attr.outputs['Color'],mix.inputs[2]);old=p.inputs['Base Color'].links[0].from_socket if p.inputs['Base Color'].links else None
  if old:l.new(old,mix.inputs[1])
  else:mix.inputs[1].default_value=(*md['color'],1)
  l.new(mix.outputs[0],p.inputs['Base Color'])
 mats.append(m)
gs=[]
for i,gd in enumerate(d['geometries']):
 a=values(gd['position']);idx=values(gd['index'],'I') if 'index'in gd else range(len(a)//3);g=bpy.data.meshes.new('actual-geometry-'+str(i));g.from_pydata(list(zip(a[0::3],a[1::3],a[2::3])),[],list(zip(idx[0::3],idx[1::3],idx[2::3])));g.update()
 if 'uv'in gd:
  uv=values(gd['uv']);layer=g.uv_layers.new();layer.data.foreach_set('uv',[c for loop in g.loops for c in uv[loop.vertex_index*2:loop.vertex_index*2+2]])
 if 'color'in gd:
  co=values(gd['color']);layer=g.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='POINT');layer.data.foreach_set('color',[v for i in range(len(co)//3) for v in (*co[i*3:i*3+3],1)])
 for p in g.polygons:p.use_smooth=True
 if 'normal'in gd:
  no=values(gd['normal']);g.normals_split_custom_set_from_vertices(list(zip(no[0::3],no[1::3],no[2::3])))
 gs.append(g)
for i,ob in enumerate(d['objects']):
 g=gs[ob['g']];o=bpy.data.objects.new('actual-object-'+str(i),g);bpy.context.collection.objects.link(o);v=ob['matrix'];o.matrix_world=C@Matrix([v[j::4] for j in range(4)]);o.data.materials.clear() if False else None
 if not g.materials:g.materials.append(mats[ob['m']])
 o.material_slots[0].link='OBJECT';o.material_slots[0].material=mats[ob['m']]
for ld in d['lights']:
 if ld['kind']=='HemisphereLight':continue
 light=bpy.data.lights.new('actual-light','SUN' if ld['kind']=='DirectionalLight' else 'POINT');light.color=ld['color'];light.energy=ld['intensity'] if light.type=='SUN' else ld['intensity']*8
 if light.type=='SUN':light.angle=.08
 else:light.shadow_soft_size=.2
 o=bpy.data.objects.new('light',light);bpy.context.collection.objects.link(o);o.location=(C@Vector((*ld['position'],1))).to_3d();o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
cam=bpy.data.cameras.new('Player camera');o=bpy.data.objects.new('Player camera',cam);bpy.context.collection.objects.link(o);v=d['camera']['matrix'];o.matrix_world=C@Matrix([v[j::4] for j in range(4)]);cam.sensor_fit='VERTICAL';cam.lens=cam.sensor_height/(2*math.tan(math.radians(d['camera']['fov'])/2));cam.clip_start=.02;bpy.context.scene.camera=o
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=8;s.cycles.use_denoising=True;s.render.threads_mode='FIXED';s.render.threads=8;s.world.use_nodes=True;s.world.node_tree.nodes.get('Background').inputs[0].default_value=(.48,.55,.65,1);s.world.node_tree.nodes.get('Background').inputs[1].default_value=.65;s.render.resolution_x=1120;s.render.resolution_y=630;s.render.resolution_percentage=100;s.view_settings.view_transform='AgX';s.render.image_settings.file_format='PNG';s.render.filepath=root+'/first-person.png';bpy.ops.wm.save_as_mainfile(filepath=root+'/scene.blend');bpy.ops.render.render(write_still=True)
