# Blender 5.0 - Vase with FLAT Surface Engraving (Stamp Style)
# "NirmanHub" as shallow surface indent - NOT 3D letters
# Run in Blender: Text Editor > Open > Run Script (Alt+P)

import bpy
import bmesh
import math

# Clear ALL existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# ============ VASE PARAMETERS IN MILLIMETERS ============
vase_height = 100.0
base_radius = 20.0
top_radius = 30.0
waist_radius = 15.0
waist_position = 0.4
segments = 32
rings = 20
wall_thickness = 3.0
bottom_thickness = 5.0

# ============ TEXT PARAMETERS ============
brand_name = "NirmanHub"
engrave_depth = 0.2      # Very thin surface scratch like texture
text_size = 6.0          # Text height in mm

def get_radius_at_height(t):
    if t < waist_position:
        factor = t / waist_position
        return base_radius + (waist_radius - base_radius) * factor
    else:
        factor = (t - waist_position) / (1 - waist_position)
        curve = math.sin(factor * math.pi * 0.5)
        return waist_radius + (top_radius - waist_radius) * curve

# ============ CREATE VASE ============
bm = bmesh.new()

outer_verts = []
for ring in range(rings + 1):
    t = ring / rings
    z = t * vase_height
    radius = get_radius_at_height(t)
    ring_verts = []
    for seg in range(segments):
        angle = (seg / segments) * 2 * math.pi
        x = radius * math.cos(angle)
        y = radius * math.sin(angle)
        v = bm.verts.new((x, y, z))
        ring_verts.append(v)
    outer_verts.append(ring_verts)

inner_verts = []
start_ring = 2
for ring in range(start_ring, rings + 1):
    t = ring / rings
    z = t * vase_height
    inner_radius = max(get_radius_at_height(t) - wall_thickness, 3.0)
    ring_verts = []
    for seg in range(segments):
        angle = (seg / segments) * 2 * math.pi
        x = inner_radius * math.cos(angle)
        y = inner_radius * math.sin(angle)
        v = bm.verts.new((x, y, z))
        ring_verts.append(v)
    inner_verts.append(ring_verts)

bm.verts.ensure_lookup_table()

# Outer faces
for ring in range(rings):
    for seg in range(segments):
        next_seg = (seg + 1) % segments
        bm.faces.new([outer_verts[ring][seg], outer_verts[ring][next_seg], 
                      outer_verts[ring + 1][next_seg], outer_verts[ring + 1][seg]])

# Inner faces
for ring_idx in range(len(inner_verts) - 1):
    for seg in range(segments):
        next_seg = (seg + 1) % segments
        bm.faces.new([inner_verts[ring_idx + 1][seg], inner_verts[ring_idx + 1][next_seg],
                      inner_verts[ring_idx][next_seg], inner_verts[ring_idx][seg]])

# Top rim
for seg in range(segments):
    next_seg = (seg + 1) % segments
    bm.faces.new([outer_verts[rings][seg], outer_verts[rings][next_seg],
                  inner_verts[-1][next_seg], inner_verts[-1][seg]])

# Inner bottom
inner_bottom_center = bm.verts.new((0, 0, bottom_thickness))
bm.verts.ensure_lookup_table()
for seg in range(segments):
    next_seg = (seg + 1) % segments
    bm.faces.new([inner_bottom_center, inner_verts[0][seg], inner_verts[0][next_seg]])

# Connect inner to outer at bottom
for seg in range(segments):
    next_seg = (seg + 1) % segments
    bm.faces.new([outer_verts[start_ring][seg], inner_verts[0][seg],
                  inner_verts[0][next_seg], outer_verts[start_ring][next_seg]])

# Flat bottom
bottom_center = bm.verts.new((0, 0, 0))
bm.verts.ensure_lookup_table()
for seg in range(segments):
    next_seg = (seg + 1) % segments
    bm.faces.new([bottom_center, outer_verts[0][next_seg], outer_verts[0][seg]])

mesh = bpy.data.meshes.new("Vase_Mesh")
bm.to_mesh(mesh)
bm.free()
mesh.validate()
mesh.update()

vase_obj = bpy.data.objects.new("Parametric_Vase", mesh)
bpy.context.collection.objects.link(vase_obj)
bpy.context.view_layer.objects.active = vase_obj
vase_obj.select_set(True)

bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.shade_smooth()

# ============ CREATE FLAT TEXT (NO CURVE - STRAIGHT LINE) ============
# Simple flat text - no 3D extrusion, just surface indent

bpy.ops.object.text_add(location=(0, 0, 0))
text_obj = bpy.context.active_object
text_obj.data.body = brand_name
text_obj.data.size = text_size
text_obj.data.align_x = 'CENTER'
text_obj.data.align_y = 'CENTER'

# CRITICAL: Set extrude to ZERO for flat text
text_obj.data.extrude = 0
text_obj.data.bevel_depth = 0
text_obj.data.shear = 0.15  # Slight italic

# Convert to mesh
bpy.context.view_layer.objects.active = text_obj
bpy.ops.object.convert(target='MESH')
text_obj.name = "BrandText"

# Solidify the flat text - VERY THIN for texture style
solidify = text_obj.modifiers.new(name="Solidify", type='SOLIDIFY')
solidify.thickness = engrave_depth * 2  # Thin cutter
solidify.offset = -1  # Extrude downward
bpy.ops.object.modifier_apply(modifier="Solidify")

# Position so only engrave_depth cuts into surface at Z=0
text_obj.location = (0, 0, engrave_depth)
text_obj.rotation_euler = (0, 0, 0)

# Apply transforms
bpy.context.view_layer.objects.active = text_obj
text_obj.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Boolean to create indent
vase_obj.select_set(True)
bpy.context.view_layer.objects.active = vase_obj

bool_mod = vase_obj.modifiers.new(name="TextEngrave", type='BOOLEAN')
bool_mod.operation = 'DIFFERENCE'
bool_mod.object = text_obj
bool_mod.solver = 'EXACT'

bpy.ops.object.modifier_apply(modifier="TextEngrave")

# Delete text
bpy.data.objects.remove(text_obj, do_unlink=True)

# Final cleanup
bpy.context.view_layer.objects.active = vase_obj
vase_obj.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')

print("=" * 60)
print("Vase with flat 'NirmanHub' surface engraving!")
print(f"Size: {vase_height}mm tall")
print(f"Engraving: {engrave_depth}mm deep (stamp style)")
print("=" * 60)
print("Export: File > Export > STL, Scale = 1.0")
print("=" * 60)
