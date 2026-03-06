"""
Dual-Color Name Keychain Generator - "Ajith"
Creates two separate STL files for multi-color 3D printing:
  1. Base layer (Color 1)
  2. Name layer (Color 2)
Compatible with Blender 5.0+
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ============== KEYCHAIN PARAMETERS ==============
NAME = "Ajith"
FONT_SIZE = 14.0          # Font size in mm
TEXT_EXTRUDE = 2.0        # Name layer height (mm)
BASE_THICKNESS = 2.0      # Base layer thickness (mm)
BASE_PADDING = 4.0        # Padding around text (mm)
RING_DIAMETER = 8.0       # Keyring hole outer diameter (mm)
RING_HOLE = 4.0           # Keyring hole inner diameter (mm)
CORNER_RADIUS = 3.0       # Rounded corner radius (mm)
BEVEL_AMOUNT = 0.5        # Edge bevel for smooth look (mm)

# Font settings (use a nice rounded/bubble font if available)
FONT_PATH = None  # Set to font file path if you have a specific font, else uses default

OUTPUT_BASE = "C:/Users/Admin/Desktop/Project/NirmanaHub/blender_scripts/keychain_ajith_base.stl"
OUTPUT_NAME = "C:/Users/Admin/Desktop/Project/NirmanaHub/blender_scripts/keychain_ajith_name.stl"


def clear_scene():
    """Remove all objects from scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def create_text_object(text, extrude_depth):
    """Create 3D text object"""
    bpy.ops.object.text_add(location=(0, 0, 0))
    text_obj = bpy.context.active_object
    text_obj.data.body = text
    text_obj.data.size = FONT_SIZE
    text_obj.data.extrude = extrude_depth
    text_obj.data.align_x = 'CENTER'
    text_obj.data.align_y = 'CENTER'
    
    # Load custom font if specified
    if FONT_PATH:
        try:
            font = bpy.data.fonts.load(FONT_PATH)
            text_obj.data.font = font
        except:
            print(f"Could not load font: {FONT_PATH}, using default")
    
    # Add bevel for rounded edges
    text_obj.data.bevel_depth = BEVEL_AMOUNT
    text_obj.data.bevel_resolution = 3
    
    return text_obj


def text_to_mesh(text_obj):
    """Convert text to mesh"""
    bpy.context.view_layer.objects.active = text_obj
    text_obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    return text_obj


def get_mesh_bounds(obj):
    """Get bounding box of mesh object"""
    # Get world-space bounds
    bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    
    min_x = min(c.x for c in bbox_corners)
    max_x = max(c.x for c in bbox_corners)
    min_y = min(c.y for c in bbox_corners)
    max_y = max(c.y for c in bbox_corners)
    min_z = min(c.z for c in bbox_corners)
    max_z = max(c.z for c in bbox_corners)
    
    return {
        'min': Vector((min_x, min_y, min_z)),
        'max': Vector((max_x, max_y, max_z)),
        'width': max_x - min_x,
        'height': max_y - min_y,
        'depth': max_z - min_z,
        'center': Vector(((min_x + max_x) / 2, (min_y + max_y) / 2, (min_z + max_z) / 2))
    }


def create_rounded_rect_base(width, height, thickness, corner_radius):
    """Create a rounded rectangle base using curves"""
    # Create a rounded rectangle using a bezier curve
    bpy.ops.curve.primitive_bezier_circle_add(radius=1, location=(0, 0, 0))
    curve_obj = bpy.context.active_object
    
    # Delete it and create manually for better control
    bpy.data.objects.remove(curve_obj, do_unlink=True)
    
    # Use mesh approach instead - create rounded rect with bmesh
    bm = bmesh.new()
    
    # Half dimensions
    hw = width / 2 - corner_radius
    hh = height / 2 - corner_radius
    
    # Create vertices for rounded corners
    segments_per_corner = 8
    verts = []
    
    # Corner centers
    corners = [
        (hw, hh),    # Top-right
        (-hw, hh),   # Top-left
        (-hw, -hh),  # Bottom-left
        (hw, -hh),   # Bottom-right
    ]
    
    # Starting angles for each corner (counter-clockwise)
    start_angles = [0, 90, 180, 270]
    
    for i, (cx, cy) in enumerate(corners):
        start_angle = math.radians(start_angles[i])
        for j in range(segments_per_corner):
            angle = start_angle + (j / segments_per_corner) * (math.pi / 2)
            x = cx + corner_radius * math.cos(angle)
            y = cy + corner_radius * math.sin(angle)
            verts.append((x, y))
    
    # Create bottom face vertices
    bottom_verts = [bm.verts.new((x, y, 0)) for x, y in verts]
    
    # Create top face vertices
    top_verts = [bm.verts.new((x, y, thickness)) for x, y in verts]
    
    bm.verts.ensure_lookup_table()
    
    # Create faces
    # Bottom face (reversed for correct normal)
    bm.faces.new(bottom_verts[::-1])
    
    # Top face
    bm.faces.new(top_verts)
    
    # Side faces
    n = len(verts)
    for i in range(n):
        next_i = (i + 1) % n
        bm.faces.new([
            bottom_verts[i],
            bottom_verts[next_i],
            top_verts[next_i],
            top_verts[i]
        ])
    
    # Create mesh
    mesh = bpy.data.meshes.new("BasePlate")
    bm.to_mesh(mesh)
    bm.free()
    
    base_obj = bpy.data.objects.new("BasePlate", mesh)
    bpy.context.collection.objects.link(base_obj)
    
    return base_obj


def create_ring_tab(base_obj, base_bounds):
    """Create keyring attachment tab"""
    # Position at right side of base
    ring_x = base_bounds['max'].x + RING_DIAMETER / 2 - 2
    ring_y = 0
    
    # Create outer ring (cylinder)
    bpy.ops.mesh.primitive_cylinder_add(
        radius=RING_DIAMETER / 2,
        depth=BASE_THICKNESS,
        location=(ring_x, ring_y, BASE_THICKNESS / 2)
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
        location=(ring_x, ring_y, BASE_THICKNESS / 2)
    )
    ring_hole = bpy.context.active_object
    ring_hole.name = "RingHole"
    
    # Boolean difference for hole
    bool_mod = base_obj.modifiers.new(name="RingHole", type='BOOLEAN')
    bool_mod.operation = 'DIFFERENCE'
    bool_mod.solver = 'EXACT'
    bool_mod.object = ring_hole
    
    bpy.context.view_layer.objects.active = base_obj
    bpy.ops.object.modifier_apply(modifier="RingHole")
    bpy.data.objects.remove(ring_hole, do_unlink=True)
    
    return base_obj


def add_bevel_modifier(obj, width=0.3):
    """Add bevel for smoother edges"""
    bevel_mod = obj.modifiers.new(name="Bevel", type='BEVEL')
    bevel_mod.width = width
    bevel_mod.segments = 2
    bevel_mod.limit_method = 'ANGLE'
    bevel_mod.angle_limit = math.radians(50)
    
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="Bevel")


def export_stl(obj, filepath):
    """Export single object as STL"""
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
    print("=" * 50)
    print(f"DUAL-COLOR KEYCHAIN: {NAME}")
    print("=" * 50)
    
    clear_scene()
    
    # Step 1: Create name text to get dimensions
    print("Creating name text...")
    name_text = create_text_object(NAME, TEXT_EXTRUDE)
    name_text = text_to_mesh(name_text)
    name_text.name = "NameLayer"
    
    # Get text bounds
    text_bounds = get_mesh_bounds(name_text)
    print(f"Text dimensions: {text_bounds['width']:.1f}mm x {text_bounds['height']:.1f}mm")
    
    # Step 2: Create base plate sized to text
    print("Creating base plate...")
    base_width = text_bounds['width'] + BASE_PADDING * 2
    base_height = text_bounds['height'] + BASE_PADDING * 2
    
    base_obj = create_rounded_rect_base(base_width, base_height, BASE_THICKNESS, CORNER_RADIUS)
    base_obj.name = "BaseLayer"
    
    # Get base bounds for ring placement
    base_bounds = get_mesh_bounds(base_obj)
    
    # Step 3: Add keyring tab to base
    print("Adding keyring tab...")
    base_obj = create_ring_tab(base_obj, base_bounds)
    
    # Step 4: Position name text on top of base
    # Center text and place on top of base
    name_text.location.x = -text_bounds['center'].x
    name_text.location.y = -text_bounds['center'].y
    name_text.location.z = BASE_THICKNESS - text_bounds['min'].z
    
    # Apply transforms
    bpy.context.view_layer.objects.active = name_text
    name_text.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    # Step 5: Add subtle bevel to base edges
    print("Adding edge bevels...")
    add_bevel_modifier(base_obj, 0.4)
    
    # Step 6: Export both parts
    print("\nExporting STL files...")
    export_stl(base_obj, OUTPUT_BASE)
    export_stl(name_text, OUTPUT_NAME)
    
    print("\n" + "=" * 50)
    print("✓ DUAL-COLOR KEYCHAIN COMPLETE!")
    print("=" * 50)
    print(f"\nFiles created:")
    print(f"  1. Base (Color 1): {OUTPUT_BASE}")
    print(f"  2. Name (Color 2): {OUTPUT_NAME}")
    print(f"\nFor Bambu Studio multi-color printing:")
    print(f"  - Import both STLs")
    print(f"  - Assign different filaments to each part")
    print(f"  - The name layer sits exactly on top of base")
    print("=" * 50)


if __name__ == "__main__":
    main()
