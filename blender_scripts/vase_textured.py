# Blender 5.0 - Parametric Vase with Surface Engraved Brand
# "NirmanHub" as shallow texture/stamp on bottom (not 3D letters)
# Run in Blender: Text Editor > Open > Run Script (Alt+P)

import bpy
import bmesh
import math

# Clear existing objects
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.select_by_type(type='MESH')
bpy.ops.object.delete()
bpy.ops.object.select_by_type(type='FONT')
bpy.ops.object.delete()
bpy.ops.object.select_by_type(type='CURVE')
bpy.ops.object.delete()

# ============ VASE PARAMETERS IN MILLIMETERS ============
vase_height = 100.0      # Total height in mm
base_radius = 20.0       # Bottom radius in mm
top_radius = 30.0        # Top opening radius in mm
waist_radius = 15.0      # Middle "pinch" radius in mm
waist_position = 0.4     # Where the waist is (0-1)
segments = 32            # Smoothness
rings = 20               # Vertical resolution
wall_thickness = 3.0     # Wall thickness in mm
bottom_thickness = 5.0   # Solid flat bottom thickness in mm

# ============ TEXT PARAMETERS ============
brand_name = "NirmanHub"
engrave_depth = 0.4      # Shallow surface indent (texture style)
text_size = 4.0          # Text height in mm
text_curve_radius = base_radius * 0.55  # Position along base

def get_radius_at_height(t):
    """Calculate radius at normalized height t (0-1)"""
    if t < waist_position:
        factor = t / waist_position
        return base_radius + (waist_radius - base_radius) * factor
    else:
        factor = (t - waist_position) / (1 - waist_position)
        curve = math.sin(factor * math.pi * 0.5)
        return waist_radius + (top_radius - waist_radius) * curve

# ============ CREATE VASE WITH SOLID FLAT BOTTOM ============
bm = bmesh.new()

# Create outer surface vertices
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

# Create inner surface vertices (starts ABOVE the solid bottom)
inner_verts = []
start_ring = 2  # Skip first rings for solid bottom
for ring in range(start_ring, rings + 1):
    t = ring / rings
    z = t * vase_height
    inner_radius = get_radius_at_height(t) - wall_thickness
    inner_radius = max(inner_radius, 3.0)
    ring_verts = []
    for seg in range(segments):
        angle = (seg / segments) * 2 * math.pi
        x = inner_radius * math.cos(angle)
        y = inner_radius * math.sin(angle)
        v = bm.verts.new((x, y, z))
        ring_verts.append(v)
    inner_verts.append(ring_verts)

bm.verts.ensure_lookup_table()

# Create outer faces
for ring in range(rings):
    for seg in range(segments):
        next_seg = (seg + 1) % segments
        v1 = outer_verts[ring][seg]
        v2 = outer_verts[ring][next_seg]
        v3 = outer_verts[ring + 1][next_seg]
        v4 = outer_verts[ring + 1][seg]
        bm.faces.new([v1, v2, v3, v4])

# Create inner faces (reversed normals)
for ring_idx in range(len(inner_verts) - 1):
    for seg in range(segments):
        next_seg = (seg + 1) % segments
        v1 = inner_verts[ring_idx][seg]
        v2 = inner_verts[ring_idx][next_seg]
        v3 = inner_verts[ring_idx + 1][next_seg]
        v4 = inner_verts[ring_idx + 1][seg]
        bm.faces.new([v4, v3, v2, v1])

# Create top rim
for seg in range(segments):
    next_seg = (seg + 1) % segments
    v1 = outer_verts[rings][seg]
    v2 = outer_verts[rings][next_seg]
    v3 = inner_verts[-1][next_seg]
    v4 = inner_verts[-1][seg]
    bm.faces.new([v1, v2, v3, v4])

# Create inner bottom (flat surface inside)
inner_bottom_center = bm.verts.new((0, 0, bottom_thickness))
bm.verts.ensure_lookup_table()
for seg in range(segments):
    next_seg = (seg + 1) % segments
    v1 = inner_verts[0][seg]
    v2 = inner_verts[0][next_seg]
    bm.faces.new([inner_bottom_center, v1, v2])

# Connect inner bottom ring to outer wall
bottom_ring_idx = start_ring
for seg in range(segments):
    next_seg = (seg + 1) % segments
    v_outer1 = outer_verts[bottom_ring_idx][seg]
    v_outer2 = outer_verts[bottom_ring_idx][next_seg]
    v_inner1 = inner_verts[0][seg]
    v_inner2 = inner_verts[0][next_seg]
    bm.faces.new([v_outer1, v_inner1, v_inner2, v_outer2])

# Create FLAT bottom cap
bottom_center = bm.verts.new((0, 0, 0))
bm.verts.ensure_lookup_table()
for seg in range(segments):
    next_seg = (seg + 1) % segments
    v1 = outer_verts[0][seg]
    v2 = outer_verts[0][next_seg]
    bm.faces.new([bottom_center, v2, v1])

# Finalize vase mesh
mesh = bpy.data.meshes.new("Vase_Mesh")
bm.to_mesh(mesh)
bm.free()

mesh.validate()
mesh.update()

vase_obj = bpy.data.objects.new("Parametric_Vase", mesh)
bpy.context.collection.objects.link(vase_obj)

bpy.context.view_layer.objects.active = vase_obj
vase_obj.select_set(True)

# Fix normals
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')

bpy.ops.object.shade_smooth()

# ============ CREATE CURVED TEXT AS SURFACE TEXTURE ============
# Create a circle curve for the text to follow
bpy.ops.curve.primitive_bezier_circle_add(radius=text_curve_radius, location=(0, 0, 0))
curve_obj = bpy.context.active_object
curve_obj.name = "TextCurve"

# Create text object
bpy.ops.object.text_add(location=(0, 0, 0))
text_obj = bpy.context.active_object
text_obj.data.body = brand_name

# Set text properties - FLAT text, no 3D extrusion
text_obj.data.size = text_size
text_obj.data.extrude = engrave_depth  # Very shallow
text_obj.data.align_x = 'CENTER'
text_obj.data.align_y = 'CENTER'

# Clean flat text - no bevel
text_obj.data.bevel_depth = 0
text_obj.data.shear = 0.2  # Slight italic

# Make text follow the curve
text_obj.data.follow_curve = curve_obj
text_obj.data.offset_x = 0

# Convert to mesh first
bpy.context.view_layer.objects.active = text_obj
bpy.ops.object.convert(target='MESH')
text_obj.name = "BrandText"

# Delete curve
bpy.data.objects.remove(curve_obj, do_unlink=True)

# Position: text sits at Z=0 and goes DOWN (negative Z)
# So it only indents the bottom surface like a stamp
text_obj.location = (0, 0, 0)
text_obj.rotation_euler = (math.radians(180), 0, 0)  # Flip so extrusion goes into bottom

# Apply transforms
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Move text so top surface is at Z=0, extrusion goes down
# This creates indent from bottom surface only
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.transform.translate(value=(0, 0, engrave_depth * 0.5))
bpy.ops.object.mode_set(mode='OBJECT')

# Boolean subtract - creates shallow indent
vase_obj.select_set(True)
bpy.context.view_layer.objects.active = vase_obj

bool_mod = vase_obj.modifiers.new(name="TextEngrave", type='BOOLEAN')
bool_mod.operation = 'DIFFERENCE'
bool_mod.object = text_obj
bool_mod.solver = 'EXACT'

# Apply modifier
bpy.ops.object.modifier_apply(modifier="TextEngrave")

# Delete text mesh
bpy.data.objects.remove(text_obj, do_unlink=True)

# Final cleanup
bpy.context.view_layer.objects.active = vase_obj
vase_obj.select_set(True)

bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')

print("=" * 60)
print("Vase created with 'NirmanHub' surface texture on bottom!")
print(f"Size: {vase_height}mm tall, {base_radius*2}mm base diameter")
print(f"Brand: Surface indent {engrave_depth}mm deep (stamp style)")
print("=" * 60)
print("To export: File > Export > STL, Scale = 1.0")
print("=" * 60)
