# Builds FireFly's greeble kit for the Build corridor: small mechanical parts, each fitted to a unit cube, with ambient
# occlusion baked into vertex colours (Cycles), exported as one GLB. Run: blender -b --python greeble.py -- out.glb
import bpy, bmesh, sys, random, math
from mathutils import Vector

out = sys.argv[-1]
random.seed(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 64


def box(bm, c, s, bevel=0.0):
    r = bmesh.ops.create_cube(bm, size=1.0)
    verts = r['verts']
    for v in verts:
        v.co = Vector((c[0] + v.co.x * s[0], c[1] + v.co.y * s[1], c[2] + v.co.z * s[2]))
    if bevel > 0:
        edges = list({e for v in verts for e in v.link_edges})
        bmesh.ops.bevel(bm, geom=edges, offset=bevel, segments=1, affect='EDGES', profile=0.5)


def cyl(bm, c, r, length, axis='X', seg=10):
    res = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=length)
    for v in res['verts']:
        x, y, z = v.co
        if axis == 'X':
            x, y, z = z, y, x
        elif axis == 'Y':
            x, y, z = x, z, y
        v.co = Vector((c[0] + x, c[1] + y, c[2] + z))


def panel(bm):
    box(bm, (0, 0, -0.42), (1, 1, 0.16), 0.02)
    for _ in range(7):
        w, d = random.uniform(0.12, 0.42), random.uniform(0.12, 0.42)
        h = random.uniform(0.08, 0.5)
        box(bm, (random.uniform(-0.5 + w / 2, 0.5 - w / 2), random.uniform(-0.5 + d / 2, 0.5 - d / 2), -0.34 + h / 2), (w, d, h), 0.012)


def pipes(bm):
    box(bm, (0, 0, -0.44), (1, 1, 0.12), 0.015)
    for i, y in enumerate((-0.28, 0.0, 0.28)):
        r = 0.09 + 0.03 * (i % 2)
        cyl(bm, (0, y, -0.38 + r), r, 1.0, 'X')
        for x in (-0.35, 0.05, 0.38):
            box(bm, (x, y, -0.38 + r), (0.06, r * 2.6, r * 2.6), 0.01)


def stepped(bm):
    z = -0.5
    for k in range(4):
        h = random.uniform(0.12, 0.28)
        w = 1 - k * 0.2
        box(bm, (random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05), z + h / 2), (w, w * random.uniform(0.7, 1), h), 0.015)
        z += h
        if z > 0.45:
            break


def vent(bm):
    box(bm, (0, 0, -0.2), (1, 1, 0.6), 0.025)
    for i in range(6):
        box(bm, (0, -0.4 + i * 0.16, 0.12), (0.84, 0.06, 0.08), 0.01)
    box(bm, (0.36, 0.36, 0.2), (0.14, 0.14, 0.2), 0.01)


def bracket(bm):
    box(bm, (0, 0, -0.42), (1, 0.3, 0.16), 0.015)
    box(bm, (-0.42, 0, 0), (0.16, 0.3, 1), 0.015)
    box(bm, (-0.2, 0, -0.2), (0.3, 0.12, 0.3), 0.01)
    for x in (0.0, 0.25):
        cyl(bm, (x, 0, -0.32), 0.05, 0.06, 'Z', 8)


def antenna(bm):
    box(bm, (0, 0, -0.45), (0.6, 0.6, 0.1), 0.015)
    for _ in range(4):
        x, y = random.uniform(-0.22, 0.22), random.uniform(-0.22, 0.22)
        h = random.uniform(0.4, 0.95)
        cyl(bm, (x, y, -0.4 + h / 2), random.uniform(0.02, 0.045), h, 'Z', 8)
    box(bm, (0.3, -0.3, -0.3), (0.2, 0.2, 0.2), 0.01)


def plate(bm):
    # a flat machined plate with a grid of studs: reads as panelling on the lattice beams
    box(bm, (0, 0, -0.45), (1, 1, 0.1), 0.012)
    for i in range(3):
        for j in range(3):
            if random.random() < 0.7:
                box(bm, (-0.33 + i * 0.33, -0.33 + j * 0.33, -0.36), (0.18, 0.18, 0.08), 0.008)


makers = [panel, pipes, stepped, vent, bracket, antenna, plate]
objs = []
for i, mk in enumerate(makers):
    bm = bmesh.new()
    mk(bm)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    # fit to the unit cube, centred
    xs = [v.co for v in bm.verts]
    lo = Vector((min(v.x for v in xs), min(v.y for v in xs), min(v.z for v in xs)))
    hi = Vector((max(v.x for v in xs), max(v.y for v in xs), max(v.z for v in xs)))
    size = hi - lo
    for v in bm.verts:
        v.co = Vector(((v.co.x - lo.x) / size.x - 0.5, (v.co.y - lo.y) / size.y - 0.5, (v.co.z - lo.z) / size.z - 0.5))
    me = bpy.data.meshes.new(f'g{i}')
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = False
    ob = bpy.data.objects.new(f'greeble_{i}', me)
    ob.location = (i * 3.0, 0, 0)
    scene.collection.objects.link(ob)
    objs.append(ob)

# a ground plane under each piece so the baked occlusion darkens where it meets the beam
ground = bpy.data.meshes.new('ground')
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=30)
for v in bm.verts:
    v.co.z = -0.5
bm.to_mesh(me := ground)
bm.free()
gob = bpy.data.objects.new('ground', ground)
gob.location = (9, 0, 0)
scene.collection.objects.link(gob)

mat = bpy.data.materials.new('greeble')
mat.use_nodes = True
for ob in objs:
    ob.data.materials.append(mat)
    ob.data.color_attributes.new(name='Col', type='BYTE_COLOR', domain='CORNER')
    ob.data.attributes.active_color = ob.data.color_attributes['Col']

scene.render.bake.target = 'VERTEX_COLORS'
scene.world = bpy.data.worlds.new('w')
for ob in objs:
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.bake(type='AO')
    print('baked', ob.name, len(ob.data.polygons), 'faces')

bpy.data.objects.remove(gob)
for ob in objs:
    ob.location = (0, 0, 0)
bpy.ops.object.select_all(action='DESELECT')
for ob in objs:
    ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_apply=True, export_materials='NONE', export_vertex_color='ACTIVE', export_normals=True, export_texcoords=False)
print('exported', out)
