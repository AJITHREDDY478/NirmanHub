# Blender 5.0 - Simple Round Base with NirmanHub Text
# Test print to see texture engraving
# Run in Blender: Text Editor > Open > Run Script (Alt+P)

import bpy
import math

# Clear ALL existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# ============ BASE PARAMETERS ============
base_radius = 25.0       # 25mm radius (50mm diameter)
base_height = 20.0       # 20mm tall
engrave_depth = 0.4      # 0.4mm texture depth
text_size = 5.0          # Text size

# ============ CREATE CYLINDER BASE ============
bpy.ops.mesh.primitive_cylinder_add(
    radius=base_radius,
    depth=base_height,
    vertices=64,
    location=(0, 0, base_height / 2)  # Center at half height so bottom is at Z=0
)

base_obj = bpy.context.active_object
base_obj.name = "Round_Base"

# Smooth shading
bpy.ops.object.shade_smooth()

# ============ CREATE TEXT FOR BOTTOM ============
bpy.ops.object.text_add(location=(0, 0, 0))
text_obj = bpy.context.active_object
text_obj.data.body = "NirmanHub"
text_obj.data.size = text_size
text_obj.data.align_x = 'CENTER'
text_obj.data.align_y = 'CENTER'
text_obj.data.extrude = 0  # Flat text
text_obj.data.bevel_depth = 0
text_obj.data.shear = 0.15  # Slight italic

# Convert to mesh
bpy.context.view_layer.objects.active = text_obj
bpy.ops.object.convert(target='MESH')
text_obj.name = "BrandText"

# Mirror text on X axis so it reads correctly from bottom
text_obj.scale = (-1, 1, 1)  # Flip horizontally
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Solidify to give thickness
solidify = text_obj.modifiers.new(name="Solidify", type='SOLIDIFY')
solidify.thickness = 1.0  # 1mm thick cutter
solidify.offset = 1  # Extrude upward INTO the base
bpy.ops.object.modifier_apply(modifier="Solidify")

# Position text BELOW Z=0, so it cuts UP into the bottom surface
text_obj.location = (0, 0, -0.5)  # Start below bottom surface
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Boolean subtract
base_obj.select_set(True)
bpy.context.view_layer.objects.active = base_obj

bool_mod = base_obj.modifiers.new(name="TextEngrave", type='BOOLEAN')
bool_mod.operation = 'DIFFERENCE'
bool_mod.object = text_obj
bool_mod.solver = 'EXACT'

bpy.ops.object.modifier_apply(modifier="TextEngrave")

# Delete text
bpy.data.objects.remove(text_obj, do_unlink=True)

# Final cleanup
bpy.context.view_layer.objects.active = base_obj
base_obj.select_set(True)

bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')

print("=" * 60)
print("Round base with 'NirmanHub' engraving created!")
print(f"Diameter: {base_radius * 2}mm")
print(f"Height: {base_height}mm")
print(f"Text depth: {engrave_depth}mm")
print("=" * 60)
print("Export: File > Export > STL, Scale = 1.0")
print("Print with bottom facing UP to see text!")
print("=" * 60)
