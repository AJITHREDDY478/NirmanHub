"""
Dual-Color Text Keychain - Outline Style
Based on HLModtech reference design:
  - Base has uniform border/stroke around text shape
  - Text sits on top of base
  - Keyring hole on the left side
Compatible with Blender 5.0+
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ============== KEYCHAIN PARAMETERS ==============
NAME = "Ajith"                # Change this to any name
FONT_SIZE = 12.0              # Font size in mm
TEXT_EXTRUDE = 2.0            # Name layer height (mm) - top color
BASE_THICKNESS = 2.0          # Base layer thickness (mm) - bottom color
BORDER_WIDTH = 1.5            # Border/stroke width around text (mm)
RING_DIAMETER = 8.0           # Keyring hole outer diameter (mm)
RING_HOLE = 4.0               # Keyring hole inner diameter (mm)
TEXT_BEVEL = 0.3              # Bevel on text edges (mm)

# Font - use bold/rounded font for best results
FONT_PATH = None  # Set to .ttf path if you have a specific font

OUTPUT_BASE = "C:/Users/Admin/Desktop/Project/NirmanaHub/blender_scripts/keychain_outline_base.stl"
OUTPUT_TEXT = "C:/Users/Admin/Desktop/Project/NirmanaHub/blender_scripts/keychain_outline_text.stl"


def clear_scene():
    """Remove all objects from scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def create_text_with_offset(text, height, offset=0, bevel_depth=0):
    """Create 3D text with optional offset (for creating outline/border)"""
    bpy.ops.object.text_add(location=(0, 0, 0))
    text_obj = bpy.context.active_object
    text_obj.data.body = text
    text_obj.data.size = FONT_SIZE
    text_obj.data.extrude = height
    text_obj.data.align_x = 'CENTER'
    text_obj.data.align_y = 'CENTER'
    
    # Load custom font if specified
    if FONT_PATH:
        try:
            font = bpy.data.fonts.load(FONT_PATH)
            text_obj.data.font = font
        except:
            print(f"Could not load font: {FONT_PATH}, using default")
    
    # OFFSET creates uniform border around each letter shape
    if offset != 0:
        text_obj.data.offset = offset
    
    # Add bevel for smoother edges
    if bevel_depth > 0:
        text_obj.data.bevel_depth = bevel_depth
        text_obj.data.bevel_resolution = 2
    
    return text_obj


def convert_to_mesh(obj):
    """Convert curve/text to mesh"""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    return obj


def get_bounds(obj):
    """Get object bounding box"""
    bbox = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    
    min_x = min(c.x for c in bbox)
    max_x = max(c.x for c in bbox)
    min_y = min(c.y for c in bbox)
    max_y = max(c.y for c in bbox)
    min_z = min(c.z for c in bbox)
    max_z = max(c.z for c in bbox)
    
    return {
        'min': Vector((min_x, min_y, min_z)),
        'max': Vector((max_x, max_y, max_z)),
        'center': Vector(((min_x + max_x) / 2, (min_y + max_y) / 2, (min_z + max_z) / 2)),
        'width': max_x - min_x,
        'height': max_y - min_y,
    }


def create_base_with_border():
    """Create base layer - text shape with uniform border/stroke"""
    
    # Create text with OFFSET to add uniform border around each letter
    # offset is in Blender units relative to font size
    offset_value = BORDER_WIDTH / FONT_SIZE
    
    base_text = create_text_with_offset(NAME, BASE_THICKNESS, offset=offset_value, bevel_depth=0.2)
    base_text.name = "BaseText"
    
    # Convert to mesh
    base_text = convert_to_mesh(base_text)
    
    # Center it
    bounds = get_bounds(base_text)
    base_text.location.x = -bounds['center'].x
    base_text.location.y = -bounds['center'].y
    base_text.location.z = -bounds['min'].z
    
    bpy.context.view_layer.objects.active = base_text
    bpy.ops.object.transform_apply(location=True)
    
    return base_text


def create_top_text():
    """Create top text layer - normal text without offset"""
    top_text = create_text_with_offset(NAME, TEXT_EXTRUDE, offset=0, bevel_depth=TEXT_BEVEL)
    top_text.name = "TopText"
    
    # Convert to mesh
    top_text = convert_to_mesh(top_text)
    
    # Center it
    bounds = get_bounds(top_text)
    top_text.location.x = -bounds['center'].x
    top_text.location.y = -bounds['center'].y
    top_text.location.z = BASE_THICKNESS - bounds['min'].z  # Sit on top of base
    
    bpy.context.view_layer.objects.active = top_text
    bpy.ops.object.transform_apply(location=True)
    
    return top_text


def add_keyring_hole(base_obj):
    """Add keyring hole to the left side of base"""
    bounds = get_bounds(base_obj)
    
    # Position ring on LEFT side (like the reference image)
    ring_x = bounds['min'].x - RING_DIAMETER / 2 + 3
    ring_y = bounds['center'].y
    ring_z = BASE_THICKNESS / 2
    
    # Create ring outer cylinder
    bpy.ops.mesh.primitive_cylinder_add(
        radius=RING_DIAMETER / 2,
        depth=BASE_THICKNESS,
        location=(ring_x, ring_y, ring_z)
    )
    ring_outer = bpy.context.active_object
    ring_outer.name = "RingOuter"
    
    # Boolean union with base
    bool_mod = base_obj.modifiers.new(name="RingUnion", type='BOOLEAN')
    bool_mod.operation = 'UNION'
    bool_mod.solver = 'EXACT'
    bool_mod.object = ring_outer
    
    bpy.context.view_layer.objects.active = base_obj
    bpy.ops.object.modifier_apply(modifier="RingUnion")
    bpy.data.objects.remove(ring_outer, do_unlink=True)
    
    # Create hole
    bpy.ops.mesh.primitive_cylinder_add(
        radius=RING_HOLE / 2,
        depth=BASE_THICKNESS + 4,
        location=(ring_x, ring_y, ring_z)
    )
    ring_hole = bpy.context.active_object
    ring_hole.name = "RingHole"
    
    # Boolean difference
    bool_mod = base_obj.modifiers.new(name="RingHole", type='BOOLEAN')
    bool_mod.operation = 'DIFFERENCE'
    bool_mod.solver = 'EXACT'
    bool_mod.object = ring_hole
    
    bpy.context.view_layer.objects.active = base_obj
    bpy.ops.object.modifier_apply(modifier="RingHole")
    bpy.data.objects.remove(ring_hole, do_unlink=True)
    
    return base_obj


def export_stl(obj, filepath):
    """Export object as STL"""
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    
    bpy.ops.wm.stl_export(
        filepath=filepath,
        export_selected_objects=True,
        global_scale=1.0,
        ascii_format=False
    )
    print(f"Exported: {filepath}")


def main():
    print("=" * 60)
    print(f"OUTLINE-STYLE KEYCHAIN: {NAME}")
    print("=" * 60)
    
    clear_scene()
    
    # Create base with uniform border
    print("Creating base layer (text + uniform border)...")
    base = create_base_with_border()
    base.name = "Base_Color1"
    
    # Add keyring hole
    print("Adding keyring hole...")
    base = add_keyring_hole(base)
    
    # Create top text
    print("Creating text layer...")
    text = create_top_text()
    text.name = "Text_Color2"
    
    # Get final dimensions
    base_bounds = get_bounds(base)
    text_bounds = get_bounds(text)
    
    print(f"\nDimensions:")
    print(f"  Base: {base_bounds['width']:.1f}mm x {base_bounds['height']:.1f}mm")
    print(f"  Text: {text_bounds['width']:.1f}mm x {text_bounds['height']:.1f}mm")
    print(f"  Border width: {BORDER_WIDTH}mm")
    print(f"  Total height: {BASE_THICKNESS + TEXT_EXTRUDE}mm")
    
    # Export both parts
    print("\nExporting STL files...")
    export_stl(base, OUTPUT_BASE)
    export_stl(text, OUTPUT_TEXT)
    
    print("\n" + "=" * 60)
    print("✓ KEYCHAIN COMPLETE!")
    print("=" * 60)
    print(f"\nOutput files:")
    print(f"  1. BASE (Color 1 - Blue):")
    print(f"     {OUTPUT_BASE}")
    print(f"  2. TEXT (Color 2 - Red):")
    print(f"     {OUTPUT_TEXT}")
    print(f"\nFor Bambu Studio / multi-color printing:")
    print(f"  - Import both STL files")
    print(f"  - Assign different colors/filaments")
    print(f"  - Base sits at Z=0, Text sits on top")
    print("=" * 60)


if __name__ == "__main__":
    main()
