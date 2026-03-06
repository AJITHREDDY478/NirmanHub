"""
Simple Stylized Robot Miniature
Created from basic primitives for 3D printing
Compatible with Blender 5.0+
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ============== ROBOT PARAMETERS ==============
SCALE = 1.0              # Overall scale multiplier
TOTAL_HEIGHT = 50.0      # Total height in mm (before scale)

# Body proportions (relative)
HEAD_SIZE = 12.0
BODY_WIDTH = 14.0
BODY_HEIGHT = 16.0
BODY_DEPTH = 10.0
ARM_LENGTH = 14.0
ARM_WIDTH = 4.0
LEG_LENGTH = 14.0
LEG_WIDTH = 5.0
HAND_SIZE = 4.0
FOOT_LENGTH = 7.0
FOOT_HEIGHT = 3.0
NECK_HEIGHT = 2.0
ANTENNA_HEIGHT = 6.0

# Details
EYE_SIZE = 2.5
EYE_SPACING = 4.0
VISOR_HEIGHT = 3.0
CHEST_PANEL_SIZE = 6.0

OUTPUT_PATH = "C:/Users/Admin/Desktop/Project/NirmanaHub/blender_scripts/robot.stl"


def clear_scene():
    """Remove all objects from scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def create_cube(name, width, height, depth, location):
    """Create a rounded cube"""
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (width, depth, height)
    bpy.ops.object.transform_apply(scale=True)
    
    # Add bevel for rounded edges
    bevel = obj.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = min(width, height, depth) * 0.15
    bevel.segments = 3
    bpy.ops.object.modifier_apply(modifier="Bevel")
    
    return obj


def create_cylinder(name, radius, height, location, segments=32):
    """Create a cylinder"""
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius,
        depth=height,
        location=location,
        vertices=segments
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj


def create_sphere(name, radius, location, segments=16):
    """Create a UV sphere"""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius,
        location=location,
        segments=segments,
        ring_count=segments // 2
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj


def join_objects(objects, name="Combined"):
    """Join multiple objects into one"""
    if not objects:
        return None
    
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    
    result = bpy.context.active_object
    result.name = name
    return result


def boolean_union(target, tool):
    """Boolean union and delete tool"""
    bool_mod = target.modifiers.new(name="Union", type='BOOLEAN')
    bool_mod.operation = 'UNION'
    bool_mod.solver = 'EXACT'
    bool_mod.object = tool
    
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier="Union")
    bpy.data.objects.remove(tool, do_unlink=True)
    
    return target


def create_head(base_z):
    """Create robot head with visor and antenna"""
    head_center_z = base_z + HEAD_SIZE / 2
    
    # Main head (rounded cube)
    head = create_cube("Head", HEAD_SIZE, HEAD_SIZE, HEAD_SIZE * 0.9, 
                       (0, 0, head_center_z))
    
    # Visor (curved front panel)
    visor_z = head_center_z + HEAD_SIZE * 0.1
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -HEAD_SIZE * 0.4, visor_z))
    visor = bpy.context.active_object
    visor.name = "Visor"
    visor.scale = (HEAD_SIZE * 0.7, HEAD_SIZE * 0.2, VISOR_HEIGHT)
    bpy.ops.object.transform_apply(scale=True)
    
    # Bevel visor
    bevel = visor.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = 0.5
    bevel.segments = 2
    bpy.ops.object.modifier_apply(modifier="Bevel")
    
    head = boolean_union(head, visor)
    
    # Eyes (two spheres indented into visor area)
    eye_y = -HEAD_SIZE * 0.35
    eye_z = head_center_z + HEAD_SIZE * 0.15
    
    left_eye = create_sphere("LeftEye", EYE_SIZE, (-EYE_SPACING / 2, eye_y, eye_z))
    right_eye = create_sphere("RightEye", EYE_SIZE, (EYE_SPACING / 2, eye_y, eye_z))
    
    head = boolean_union(head, left_eye)
    head = boolean_union(head, right_eye)
    
    # Antenna
    antenna_base_z = base_z + HEAD_SIZE
    antenna = create_cylinder("Antenna", 1.0, ANTENNA_HEIGHT, 
                             (0, 0, antenna_base_z + ANTENNA_HEIGHT / 2))
    
    # Antenna ball
    antenna_ball = create_sphere("AntennaBall", 2.0, 
                                (0, 0, antenna_base_z + ANTENNA_HEIGHT + 1))
    antenna = boolean_union(antenna, antenna_ball)
    
    head = boolean_union(head, antenna)
    
    # Ear pieces (side cylinders)
    ear_y = 0
    ear_z = head_center_z
    
    left_ear = create_cylinder("LeftEar", 2.5, 3, 
                               (-HEAD_SIZE / 2 - 1, ear_y, ear_z))
    left_ear.rotation_euler = (0, math.pi / 2, 0)
    bpy.ops.object.transform_apply(rotation=True)
    
    right_ear = create_cylinder("RightEar", 2.5, 3, 
                                (HEAD_SIZE / 2 + 1, ear_y, ear_z))
    right_ear.rotation_euler = (0, math.pi / 2, 0)
    bpy.ops.object.transform_apply(rotation=True)
    
    head = boolean_union(head, left_ear)
    head = boolean_union(head, right_ear)
    
    return head


def create_body(base_z):
    """Create robot torso with chest panel"""
    body_center_z = base_z + BODY_HEIGHT / 2
    
    # Main body
    body = create_cube("Body", BODY_WIDTH, BODY_HEIGHT, BODY_DEPTH, 
                       (0, 0, body_center_z))
    
    # Chest panel (raised rectangle)
    panel = create_cube("ChestPanel", CHEST_PANEL_SIZE, CHEST_PANEL_SIZE, 2, 
                        (0, -BODY_DEPTH / 2 - 0.5, body_center_z + 2))
    body = boolean_union(body, panel)
    
    # Chest buttons/lights (small cylinders)
    button_z = body_center_z + 4
    for i in range(3):
        btn = create_cylinder(f"Button{i}", 1.2, 1.5, 
                             (-3 + i * 3, -BODY_DEPTH / 2 - 1, button_z), 12)
        btn.rotation_euler = (math.pi / 2, 0, 0)
        bpy.ops.object.transform_apply(rotation=True)
        body = boolean_union(body, btn)
    
    # Neck connector
    neck = create_cylinder("Neck", 3, NECK_HEIGHT, 
                          (0, 0, base_z + BODY_HEIGHT + NECK_HEIGHT / 2))
    body = boolean_union(body, neck)
    
    # Waist detail
    waist = create_cylinder("Waist", BODY_WIDTH / 2 + 1, 3, 
                           (0, 0, base_z + 1.5))
    body = boolean_union(body, waist)
    
    return body


def create_arm(side, body_top_z):
    """Create robot arm with hand"""
    x_offset = (BODY_WIDTH / 2 + ARM_WIDTH / 2 + 1) * side
    
    # Shoulder joint (sphere)
    shoulder_z = body_top_z - 2
    shoulder = create_sphere("Shoulder", ARM_WIDTH * 0.7, (x_offset, 0, shoulder_z))
    
    # Upper arm
    upper_arm_z = shoulder_z - ARM_LENGTH / 2
    upper_arm = create_cube(f"UpperArm", ARM_WIDTH, ARM_LENGTH, ARM_WIDTH, 
                           (x_offset, 0, upper_arm_z))
    
    # Elbow joint
    elbow_z = upper_arm_z - ARM_LENGTH / 2
    elbow = create_sphere("Elbow", ARM_WIDTH * 0.6, (x_offset, 0, elbow_z))
    
    # Lower arm (slightly angled forward)
    lower_arm_z = elbow_z - ARM_LENGTH / 2 + 2
    lower_arm = create_cube(f"LowerArm", ARM_WIDTH * 0.9, ARM_LENGTH * 0.8, ARM_WIDTH * 0.9, 
                           (x_offset, -2, lower_arm_z))
    
    # Hand (sphere with finger details)
    hand_z = lower_arm_z - ARM_LENGTH / 2
    hand = create_sphere("Hand", HAND_SIZE, (x_offset, -2, hand_z))
    
    # Fingers (three small cylinders)
    for i in range(3):
        finger_angle = (i - 1) * 0.4
        fx = x_offset + math.sin(finger_angle) * 2 * side
        fy = -2 - 2
        fz = hand_z - 2
        
        finger = create_cylinder(f"Finger{i}", 0.8, 3, (fx, fy, fz), 8)
        # Add sphere tip
        finger_tip = create_sphere(f"FingerTip{i}", 1.0, (fx, fy, fz - 1.5))
        finger = boolean_union(finger, finger_tip)
        hand = boolean_union(hand, finger)
    
    # Join arm parts
    arm = boolean_union(shoulder, upper_arm)
    arm = boolean_union(arm, elbow)
    arm = boolean_union(arm, lower_arm)
    arm = boolean_union(arm, hand)
    
    return arm


def create_leg(side, body_base_z):
    """Create robot leg with foot"""
    x_offset = (BODY_WIDTH / 4) * side
    
    # Hip joint
    hip_z = body_base_z
    hip = create_sphere("Hip", LEG_WIDTH * 0.6, (x_offset, 0, hip_z))
    
    # Upper leg
    upper_leg_z = hip_z - LEG_LENGTH / 2
    upper_leg = create_cube("UpperLeg", LEG_WIDTH, LEG_LENGTH, LEG_WIDTH, 
                           (x_offset, 0, upper_leg_z))
    
    # Knee joint
    knee_z = upper_leg_z - LEG_LENGTH / 2
    knee = create_sphere("Knee", LEG_WIDTH * 0.55, (x_offset, 0, knee_z))
    
    # Lower leg
    lower_leg_z = knee_z - LEG_LENGTH / 2 + 1
    lower_leg = create_cube("LowerLeg", LEG_WIDTH * 0.9, LEG_LENGTH * 0.9, LEG_WIDTH * 0.9, 
                           (x_offset, 0, lower_leg_z))
    
    # Ankle
    ankle_z = lower_leg_z - LEG_LENGTH / 2 + 1
    ankle = create_sphere("Ankle", LEG_WIDTH * 0.45, (x_offset, 0, ankle_z))
    
    # Foot
    foot_z = FOOT_HEIGHT / 2
    foot = create_cube("Foot", LEG_WIDTH * 1.2, FOOT_HEIGHT, FOOT_LENGTH, 
                      (x_offset, -FOOT_LENGTH * 0.2, foot_z))
    
    # Join leg parts
    leg = boolean_union(hip, upper_leg)
    leg = boolean_union(leg, knee)
    leg = boolean_union(leg, lower_leg)
    leg = boolean_union(leg, ankle)
    leg = boolean_union(leg, foot)
    
    return leg


def create_base_stand():
    """Create a simple round base for the robot to stand on"""
    base = create_cylinder("Base", 20, 3, (0, 0, 1.5), 64)
    
    # Bevel edges
    bevel = base.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = 0.8
    bevel.segments = 2
    bpy.context.view_layer.objects.active = base
    bpy.ops.object.modifier_apply(modifier="Bevel")
    
    return base


def export_stl(obj, filepath):
    """Export as STL"""
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    
    bpy.ops.wm.stl_export(
        filepath=filepath,
        export_selected_objects=True,
        global_scale=SCALE,
        ascii_format=False
    )
    print(f"Exported: {filepath}")


def main():
    print("=" * 50)
    print("ROBOT MINIATURE GENERATOR")
    print("=" * 50)
    
    clear_scene()
    
    # Calculate Z positions
    base_stand_height = 3
    foot_top = base_stand_height + FOOT_HEIGHT
    leg_top = foot_top + LEG_LENGTH * 2 - 4  # Account for joints
    body_base = leg_top
    body_top = body_base + BODY_HEIGHT
    neck_top = body_top + NECK_HEIGHT
    head_top = neck_top + HEAD_SIZE + ANTENNA_HEIGHT + 2
    
    print(f"Total height: ~{head_top:.0f}mm")
    
    # Create base stand
    print("Creating base stand...")
    base = create_base_stand()
    
    # Create legs
    print("Creating legs...")
    left_leg = create_leg(-1, body_base)
    left_leg.name = "LeftLeg"
    right_leg = create_leg(1, body_base)
    right_leg.name = "RightLeg"
    
    # Create body
    print("Creating body...")
    body = create_body(body_base)
    
    # Create arms
    print("Creating arms...")
    left_arm = create_arm(-1, body_top)
    left_arm.name = "LeftArm"
    right_arm = create_arm(1, body_top)
    right_arm.name = "RightArm"
    
    # Create head
    print("Creating head...")
    head = create_head(neck_top)
    
    # Join all parts
    print("Joining parts...")
    robot = boolean_union(body, head)
    robot = boolean_union(robot, left_arm)
    robot = boolean_union(robot, right_arm)
    robot = boolean_union(robot, left_leg)
    robot = boolean_union(robot, right_leg)
    robot = boolean_union(robot, base)
    robot.name = "Robot"
    
    # Center robot
    robot.location = (0, 0, 0)
    
    # Export
    print("\nExporting STL...")
    export_stl(robot, OUTPUT_PATH)
    
    print("\n" + "=" * 50)
    print("✓ ROBOT MINIATURE COMPLETE!")
    print("=" * 50)
    print(f"File: {OUTPUT_PATH}")
    print(f"Height: ~{head_top:.0f}mm")
    print("=" * 50)


if __name__ == "__main__":
    main()
