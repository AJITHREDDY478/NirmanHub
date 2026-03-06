"""
Parametric Spur Gear Generator for 3D Printing
Compatible with Blender 5.0+
Exports STL for Bambu Studio / FDM printing
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ============== GEAR PARAMETERS ==============
NUM_TEETH = 20           # Number of teeth
MODULE = 2.0             # Module (mm) - tooth size metric
PRESSURE_ANGLE = 20      # Pressure angle in degrees (standard: 20°)
THICKNESS = 8.0          # Gear thickness (mm)
HUB_DIAMETER = 12.0      # Center hub diameter (mm)
SHAFT_HOLE = 5.0         # Shaft hole diameter (mm)
HUB_HEIGHT = 4.0        # Extra hub height on one side (mm), 0 to disable

# Calculated values
PITCH_RADIUS = (NUM_TEETH * MODULE) / 2
ADDENDUM = MODULE                          # Height above pitch circle
DEDENDUM = 1.25 * MODULE                   # Depth below pitch circle
OUTER_RADIUS = PITCH_RADIUS + ADDENDUM
ROOT_RADIUS = PITCH_RADIUS - DEDENDUM
BASE_RADIUS = PITCH_RADIUS * math.cos(math.radians(PRESSURE_ANGLE))

OUTPUT_PATH = "C:/Users/Admin/Desktop/Project/NirmanaHub/blender_scripts/gear.stl"


def clear_scene():
    """Remove all mesh objects from scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def involute_point(base_r, angle):
    """Calculate point on involute curve"""
    x = base_r * (math.cos(angle) + angle * math.sin(angle))
    y = base_r * (math.sin(angle) - angle * math.cos(angle))
    return (x, y)


def create_gear_profile():
    """Create 2D gear tooth profile using bmesh"""
    bm = bmesh.new()
    
    # Angular pitch (angle between teeth)
    tooth_angle = 2 * math.pi / NUM_TEETH
    
    # Tooth thickness at pitch circle (half of circular pitch)
    tooth_thickness_angle = tooth_angle / 4  # Roughly half tooth, half gap
    
    profile_verts = []
    
    for tooth in range(NUM_TEETH):
        base_angle = tooth * tooth_angle
        
        # Create simplified trapezoidal tooth profile
        # More reliable for 3D printing than true involute
        
        # Root points (between teeth)
        root_angle_start = base_angle - tooth_angle * 0.3
        root_angle_end = base_angle + tooth_angle * 0.3
        
        # Tip points
        tip_angle_start = base_angle - tooth_angle * 0.15
        tip_angle_end = base_angle + tooth_angle * 0.15
        
        # Add root arc points
        for i in range(3):
            t = i / 2
            angle = root_angle_start + (root_angle_end - root_angle_start) * t * 0.3
            if i == 0:
                angle = base_angle - tooth_angle * 0.4
            elif i == 2:
                angle = base_angle - tooth_angle * 0.2
            else:
                continue  # Skip middle for cleaner mesh
                
        # Simplified tooth: 4 points per tooth
        # 1. Root before tooth
        a1 = base_angle - tooth_angle * 0.35
        profile_verts.append((ROOT_RADIUS * math.cos(a1), ROOT_RADIUS * math.sin(a1)))
        
        # 2. Base of tooth (leading edge)
        a2 = base_angle - tooth_angle * 0.2
        profile_verts.append((ROOT_RADIUS * math.cos(a2), ROOT_RADIUS * math.sin(a2)))
        
        # 3. Tip of tooth (leading edge)  
        a3 = base_angle - tooth_angle * 0.12
        profile_verts.append((OUTER_RADIUS * math.cos(a3), OUTER_RADIUS * math.sin(a3)))
        
        # 4. Tip of tooth (center/flat top)
        a4 = base_angle
        profile_verts.append((OUTER_RADIUS * math.cos(a4), OUTER_RADIUS * math.sin(a4)))
        
        # 5. Tip of tooth (trailing edge)
        a5 = base_angle + tooth_angle * 0.12
        profile_verts.append((OUTER_RADIUS * math.cos(a5), OUTER_RADIUS * math.sin(a5)))
        
        # 6. Base of tooth (trailing edge)
        a6 = base_angle + tooth_angle * 0.2
        profile_verts.append((ROOT_RADIUS * math.cos(a6), ROOT_RADIUS * math.sin(a6)))
    
    return profile_verts


def create_gear_mesh():
    """Create the complete gear mesh"""
    bm = bmesh.new()
    
    # Get 2D profile
    profile_2d = create_gear_profile()
    
    # Create bottom face vertices
    bottom_verts = []
    for x, y in profile_2d:
        v = bm.verts.new((x, y, 0))
        bottom_verts.append(v)
    
    # Create top face vertices
    top_verts = []
    for x, y in profile_2d:
        v = bm.verts.new((x, y, THICKNESS))
        top_verts.append(v)
    
    bm.verts.ensure_lookup_table()
    
    # Create bottom face
    bm.faces.new(bottom_verts[::-1])  # Reverse for correct normal
    
    # Create top face
    bm.faces.new(top_verts)
    
    # Create side faces connecting top and bottom
    n = len(profile_2d)
    for i in range(n):
        next_i = (i + 1) % n
        # Create quad face
        bm.faces.new([
            bottom_verts[i],
            bottom_verts[next_i],
            top_verts[next_i],
            top_verts[i]
        ])
    
    # Create mesh object
    mesh = bpy.data.meshes.new("GearBody")
    bm.to_mesh(mesh)
    bm.free()
    
    gear_obj = bpy.data.objects.new("Gear", mesh)
    bpy.context.collection.objects.link(gear_obj)
    
    return gear_obj


def create_center_hole(gear_obj):
    """Create shaft hole in center"""
    # Create cylinder for boolean cut
    # Center it at the middle of total height (gear + hub)
    total_height = THICKNESS + HUB_HEIGHT
    bpy.ops.mesh.primitive_cylinder_add(
        radius=SHAFT_HOLE / 2,
        depth=total_height + 10,
        location=(0, 0, total_height / 2)
    )
    hole = bpy.context.active_object
    hole.name = "ShaftHole"
    
    # Boolean difference
    bool_mod = gear_obj.modifiers.new(name="ShaftHole", type='BOOLEAN')
    bool_mod.operation = 'DIFFERENCE'
    bool_mod.solver = 'EXACT'
    bool_mod.object = hole
    
    bpy.context.view_layer.objects.active = gear_obj
    bpy.ops.object.modifier_apply(modifier="ShaftHole")
    
    # Delete hole cylinder
    bpy.data.objects.remove(hole, do_unlink=True)


def create_hub(gear_obj):
    """Add reinforced hub around shaft hole"""
    if HUB_HEIGHT <= 0:
        return gear_obj
    
    # Create hub cylinder
    bpy.ops.mesh.primitive_cylinder_add(
        radius=HUB_DIAMETER / 2,
        depth=THICKNESS + HUB_HEIGHT,
        location=(0, 0, (THICKNESS + HUB_HEIGHT) / 2)
    )
    hub = bpy.context.active_object
    hub.name = "Hub"
    
    # Boolean union
    bool_mod = gear_obj.modifiers.new(name="Hub", type='BOOLEAN')
    bool_mod.operation = 'UNION'
    bool_mod.solver = 'EXACT'
    bool_mod.object = hub
    
    bpy.context.view_layer.objects.active = gear_obj
    bpy.ops.object.modifier_apply(modifier="Hub")
    
    # Delete hub cylinder
    bpy.data.objects.remove(hub, do_unlink=True)
    
    return gear_obj


def add_chamfer(gear_obj):
    """Add small chamfer to edges for better printing"""
    bpy.context.view_layer.objects.active = gear_obj
    gear_obj.select_set(True)
    
    # Add bevel modifier for slight edge chamfer
    bevel_mod = gear_obj.modifiers.new(name="Chamfer", type='BEVEL')
    bevel_mod.width = 0.3  # 0.3mm chamfer
    bevel_mod.segments = 1
    bevel_mod.limit_method = 'ANGLE'
    bevel_mod.angle_limit = math.radians(60)
    
    bpy.ops.object.modifier_apply(modifier="Chamfer")


def export_stl(obj):
    """Export gear as STL"""
    # Select only the gear
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    
    # Export STL
    bpy.ops.wm.stl_export(
        filepath=OUTPUT_PATH,
        export_selected_objects=True,
        global_scale=1.0,
        ascii_format=False
    )
    print(f"Gear exported to: {OUTPUT_PATH}")


def main():
    """Main function to generate the gear"""
    print("=" * 50)
    print("SPUR GEAR GENERATOR")
    print("=" * 50)
    print(f"Teeth: {NUM_TEETH}")
    print(f"Module: {MODULE}mm")
    print(f"Pitch Diameter: {PITCH_RADIUS * 2:.2f}mm")
    print(f"Outer Diameter: {OUTER_RADIUS * 2:.2f}mm")
    print(f"Root Diameter: {ROOT_RADIUS * 2:.2f}mm")
    print(f"Thickness: {THICKNESS}mm")
    print(f"Shaft Hole: {SHAFT_HOLE}mm")
    print("=" * 50)
    
    # Clear scene
    clear_scene()
    
    # Create gear body
    print("Creating gear teeth...")
    gear = create_gear_mesh()
    
    # Add hub if specified
    if HUB_HEIGHT > 0:
        print("Adding hub...")
        gear = create_hub(gear)
    
    # Create center shaft hole
    print("Creating shaft hole...")
    create_center_hole(gear)
    
    # Add chamfer for print quality
    print("Adding chamfers...")
    add_chamfer(gear)
    
    # Center gear
    gear.location = (0, 0, 0)
    
    # Export
    print("Exporting STL...")
    export_stl(gear)
    
    print("\n✓ Gear generation complete!")
    print(f"  File: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
