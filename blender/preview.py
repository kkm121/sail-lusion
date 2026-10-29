import bpy, sys, math
glb, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
obs = [o for o in bpy.data.objects if o.type == 'MESH']
mat = bpy.data.materials.new('m'); mat.use_nodes = True
nt = mat.node_tree; bsdf = nt.nodes['Principled BSDF']
attr = nt.nodes.new('ShaderNodeVertexColor'); attr.layer_name = 'Col'
mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs[0].default_value = 1
mix.inputs[6].default_value = (0.35, 0.37, 0.4, 1)
nt.links.new(attr.outputs[0], mix.inputs[7]); nt.links.new(mix.outputs[2], bsdf.inputs['Base Color'])
bsdf.inputs['Metallic'].default_value = 0.6; bsdf.inputs['Roughness'].default_value = 0.4
for i, o in enumerate(obs):
    o.data.materials.clear(); o.data.materials.append(mat)
    o.location = ((i % 4) * 1.6 - 2.4, 0, (1 - i // 4) * 1.6 - 0.8); o.rotation_euler = (math.radians(60), 0, math.radians(30))
cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); bpy.context.scene.collection.objects.link(cam)
cam.location = (0, -9, 0); cam.rotation_euler = (math.radians(90), 0, 0); bpy.context.scene.camera = cam
l = bpy.data.objects.new('l', bpy.data.lights.new('l', 'AREA')); l.data.energy = 900; l.data.size = 4
l.location = (3, -5, 4); l.rotation_euler = (math.radians(50), 0, math.radians(30)); bpy.context.scene.collection.objects.link(l)
w = bpy.data.worlds.new('w'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.02, 0.025, 0.03, 1); bpy.context.scene.world = w
s = bpy.context.scene; s.render.engine = 'CYCLES'; s.cycles.samples = 24; s.render.resolution_x = 960; s.render.resolution_y = 520
s.render.filepath = out; bpy.ops.render.render(write_still=True)
