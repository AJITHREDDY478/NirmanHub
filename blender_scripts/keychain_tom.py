# Blender 5.0 - Premium Bubble Style Keychain Generator
# Creates "Tom" keychain like the "Deepu" reference - soft, puffy, premium look
# Run in Blender: Text Editor > Open > Run Script (Alt+P)

import bpy
import bmesh
import math
import os

# Clear ALL existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Clear orphan data
for block in bpy.data.meshes:
    if block.users == 0:
        bpy.data.meshes.remove(block)

# ============ KEYCHAIN PARAMETERS ============
name_text = "Tom"
text_size = 20.0           # Text size in mm
base_thickness = 2.0       # Bottom layer (orange outline) thickness
top_thickness = 2.0        # Top layer (white text) thickness  
outline_scale = 1.15       # How much bigger the outline is (15% larger)
bevel_depth = 0.8          # Soft puffy bevel
bevel_resolution = 4       # Smooth bevel segments
ring_hole_radius = 2.5     # Keychain ring hole
ring_outer_radius = 5.0    # Ring tab outer size

# ============ FIND SCRIPT FONT ============
# Try to find a cursive/script font on the system
script_fonts = [
    "C:/Windows/Fonts/Pacifico-Regular.ttf",
    "C:/Windows/Fonts/Lobster-Regular.ttf", 
    "C:/Windows/Fonts/DancingScript-Regular.ttf",
    "C:/Windows/Fonts/Cookie-Regular.ttf",
    "C:/Windows/Fonts/GreatVibes-Regular.ttf",
    "C:/Windows/Fonts/Sacramento-Regular.ttf",
    "C:/Windows/Fonts/segoepr.ttf",  # Segoe Print
    "C:/Windows/Fonts/comic.ttf",    # Comic Sans (has some curve)
    "C:/Windows/Fonts/SCRIPTBL.TTF", # Script Bold
    "C:/Windows/Fonts/PRISTINA.TTF", # Pristina
]

font_to_use = None
for font_path in script_fonts:
    if os.path.exists(font_path):
        font_to_use = font_path
        print(f"✓ Found script font: {font_path}")
        break

if font_to_use is None:
    print("⚠ No script font found - using Blender default")
    print("  For best results, install: Pacifico, Lobster, or Dancing Script")

# ============ STEP 1: CREATE INNER TEXT (White raised part) ============
bpy.ops.object.text_add(location=(0, 0, base_thickness))
inner_text = bpy.context.active_object
inner_text.data.body = name_text
inner_text.data.size = text_size
inner_text.data.align_x = 'LEFT'
inner_text.data.align_y = 'CENTER'
inner_text.data.extrude = top_thickness
inner_text.data.bevel_depth = bevel_depth
inner_text.data.bevel_resolution = bevel_resolution
inner_text.name = "Inner_Text"

# Load script font if found
if font_to_use:
    inner_text.data.font = bpy.data.fonts.load(font_to_use)

# Convert to mesh
bpy.context.view_layer.objects.active = inner_text
bpy.ops.object.convert(target='MESH')
inner_text.name = "Tom_Top"

# Get text bounds for positioning
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
inner_bounds = inner_text.dimensions.copy()
inner_center = inner_text.location.copy()

# ============ STEP 2: CREATE OUTLINE (Orange base - scaled duplicate) ============
# This is the CORRECT way - duplicate and scale, not offset!
bpy.ops.object.text_add(location=(0, 0, 0))
outline_text = bpy.context.active_object
outline_text.data.body = name_text
outline_text.data.size = text_size * outline_scale  # LARGER size for outline
outline_text.data.align_x = 'LEFT'
outline_text.data.align_y = 'CENTER'
outline_text.data.extrude = base_thickness
outline_text.data.bevel_depth = bevel_depth * 1.2  # Slightly more bevel
outline_text.data.bevel_resolution = bevel_resolution
outline_text.name = "Outline_Text"

# Same font
if font_to_use:
    outline_text.data.font = bpy.data.fonts.load(font_to_use)

# Convert to mesh
bpy.context.view_layer.objects.active = outline_text
bpy.ops.object.convert(target='MESH')
outline_text.name = "Tom_Base"

# Center the outline under the inner text
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
outline_bounds = outline_text.dimensions.copy()

# Adjust position so outline is centered under inner text
# The outline is larger, so we need to offset it
size_diff_x = (outline_bounds.x - inner_bounds.x) / 2
size_diff_y = (outline_bounds.y - inner_bounds.y) / 2
outline_text.location = (-size_diff_x, -size_diff_y, 0)

# ============ STEP 3: CREATE SMOOTH RING TAB ============
# Get leftmost point of outline
ring_x = outline_text.location.x - outline_bounds.x/2 - ring_outer_radius + 1.5
ring_y = 0
ring_z = (base_thickness + top_thickness) / 2

# Create ring tab as a UV sphere stretched into pill shape for softness
bpy.ops.mesh.primitive_uv_sphere_add(
    radius=ring_outer_radius,
    segments=24,
    ring_count=16,
    location=(ring_x, ring_y, ring_z)
)
ring_tab = bpy.context.active_object
ring_tab.name = "Ring_Tab"

# Scale to match keychain thickness (flatten into disc)
ring_tab.scale = (1.0, 1.0, (base_thickness + top_thickness) / (ring_outer_radius * 2))
bpy.ops.object.transform_apply(scale=True)

# Create hole through ring tab
bpy.ops.mesh.primitive_cylinder_add(
    radius=ring_hole_radius,
    depth=base_thickness + top_thickness + 5,
    vertices=32,
    location=(ring_x, ring_y, ring_z)
)
ring_hole = bpy.context.active_object
ring_hole.name = "Ring_Hole"

# Boolean subtract hole from ring tab
bool_mod = ring_tab.modifiers.new(name="Hole", type='BOOLEAN')
bool_mod.operation = 'DIFFERENCE'
bool_mod.object = ring_hole
bool_mod.solver = 'EXACT'
bpy.context.view_layer.objects.active = ring_tab
bpy.ops.object.modifier_apply(modifier="Hole")

# Delete hole helper
bpy.data.objects.remove(ring_hole, do_unlink=True)

# ============ STEP 4: BOOLEAN UNION - MERGE RING TAB WITH OUTLINE ============
# This creates the smooth merged look!
bool_union = outline_text.modifiers.new(name="MergeRing", type='BOOLEAN')
bool_union.operation = 'UNION'
bool_union.object = ring_tab
bool_union.solver = 'EXACT'
bpy.context.view_layer.objects.active = outline_text
bpy.ops.object.modifier_apply(modifier="MergeRing")

# Delete ring tab (now merged)
bpy.data.objects.remove(ring_tab, do_unlink=True)

# ============ STEP 5: JOIN INNER TEXT ON TOP ============
bpy.ops.object.select_all(action='DESELECT')
outline_text.select_set(True)
inner_text.select_set(True)
bpy.context.view_layer.objects.active = outline_text
bpy.ops.object.join()

final_obj = bpy.context.active_object
final_obj.name = "Tom_Keychain"

# ============ FINAL CLEANUP ============
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.mesh.remove_doubles(threshold=0.01)
bpy.ops.object.mode_set(mode='OBJECT')

# Smooth shading for puffy look
bpy.ops.object.shade_smooth()

# Auto smooth for clean edges
final_obj.data.use_auto_smooth = True
final_obj.data.auto_smooth_angle = math.radians(30)

# Center and position
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
final_obj.location = (0, 0, final_obj.dimensions.z / 2)

# ============ CREATE MATERIALS FOR VISUALIZATION ============
# Orange material for base
mat_orange = bpy.data.materials.new(name="Orange_Base")
mat_orange.diffuse_color = (1.0, 0.5, 0.0, 1.0)  # Bright orange
mat_orange.roughness = 0.4

# White material for top  
mat_white = bpy.data.materials.new(name="White_Top")
mat_white.diffuse_color = (1.0, 1.0, 1.0, 1.0)
mat_white.roughness = 0.3

final_obj.data.materials.append(mat_orange)
final_obj.data.materials.append(mat_white)

print("=" * 60)
print("✨ Premium 'Tom' Keychain Created!")
print(f"📐 Size: {final_obj.dimensions.x:.1f} x {final_obj.dimensions.y:.1f} x {final_obj.dimensions.z:.1f} mm")
print(f"📏 Total thickness: {base_thickness + top_thickness:.1f} mm")
print("=" * 60)
print("🎨 DESIGN FEATURES:")
print(f"   ✓ Soft puffy bevel: {bevel_depth} mm")
print(f"   ✓ Outline expansion: {int((outline_scale-1)*100)}%")
print(f"   ✓ Smooth merged ring tab")
print(f"   ✓ Script font: {'Loaded!' if font_to_use else 'Default (install Pacifico for best results)'}")
print("=" * 60)
print("🖨️  FOR 2-COLOR 3D PRINT:")
print(f"   1. Print orange layer: 0 - {base_thickness} mm")
print(f"   2. Color change at Z = {base_thickness} mm")
print(f"   3. Print white layer: {base_thickness} - {base_thickness + top_thickness} mm")
print("=" * 60)
print("📤 Export: File > Export > STL, Scale = 1.0")
print("=" * 60)
