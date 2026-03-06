# Blender 5.0 - 3D Printable Screw & Nut Generator
# Creates realistic threaded screw with matching nut
# Run in Blender: Text Editor > Open > Run Script (Alt+P)

import bpy
import bmesh
import math
from mathutils import Vector

# Clear ALL existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Clear orphan data
for block in bpy.data.meshes:
    if block.users == 0:
        bpy.data.meshes.remove(block)

# ============ SCREW PARAMETERS (mm) ============
screw_length = 25.0        # Shaft length (threaded part)
screw_diameter = 6.0       # Major diameter (M6)
thread_pitch = 1.0         # Distance between threads (M6 = 1.0mm)
thread_depth = 0.6         # Thread depth (height of thread triangle)
head_diameter = 10.0       # Screw head diameter
head_height = 4.0          # Screw head thickness
head_type = "HEX"          # "HEX", "PHILLIPS", "ALLEN"

# Nut parameters
nut_height = 5.0           # Nut thickness
nut_diameter = 11.0        # Nut outer diameter (across flats for hex)
clearance = 0.2            # Extra clearance for nut threads (for 3D printing)

# ============ HELPER: CREATE HELIX THREAD ============
def create_helix_thread(outer_radius, inner_radius, pitch, length, segments_per_turn=32):
    """Create a solid helical thread using BMesh"""
    
    mesh = bpy.data.meshes.new("Thread_Mesh")
    bm = bmesh.new()
    
    num_turns = length / pitch
    total_segments = int(num_turns * segments_per_turn)
    
    # Thread profile points (triangle cross-section)
    # We'll create vertices for outer and inner radius at each step
    
    prev_verts_outer = []
    prev_verts_inner = []
    
    for i in range(total_segments + 1):
        angle = (i / segments_per_turn) * 2 * math.pi
        z = (i / segments_per_turn) * pitch
        
        if z > length:
            break
            
        # Outer thread peak
        x_outer = outer_radius * math.cos(angle)
        y_outer = outer_radius * math.sin(angle)
        
        # Inner thread valley (half pitch offset for V-thread)
        x_inner = inner_radius * math.cos(angle)
        y_inner = inner_radius * math.sin(angle)
        
        # Create vertices
        v_outer = bm.verts.new((x_outer, y_outer, z))
        v_inner = bm.verts.new((x_inner, y_inner, z + pitch/2))
        
        if prev_verts_outer and prev_verts_inner:
            # Create faces connecting to previous vertices
            try:
                # Outer face (thread peak)
                bm.faces.new([prev_verts_outer[0], v_outer, v_inner, prev_verts_inner[0]])
                # Inner face (thread valley)  
                bm.faces.new([prev_verts_inner[0], v_inner, prev_verts_outer[0]])
            except:
                pass
        
        prev_verts_outer = [v_outer]
        prev_verts_inner = [v_inner]
    
    bm.to_mesh(mesh)
    bm.free()
    
    return mesh

# ============ CREATE SCREW SHAFT WITH THREADS ============
print("Creating threaded shaft...")

# Create base cylinder (core of screw)
core_radius = screw_diameter/2 - thread_depth
bpy.ops.mesh.primitive_cylinder_add(
    radius=core_radius,
    depth=screw_length,
    vertices=64,
    location=(0, 0, -screw_length/2)
)
shaft = bpy.context.active_object
shaft.name = "Screw_Core"

# Create thread using curve + screw modifier (more reliable method)
# First create thread profile curve
bpy.ops.curve.primitive_bezier_circle_add(radius=0.01, location=(0, 0, 0))
bpy.ops.object.delete()  # Delete the circle, we don't need it

# Create a simple triangle profile for thread
bpy.ops.mesh.primitive_cone_add(
    vertices=3,
    radius1=thread_depth,
    radius2=0,
    depth=thread_pitch * 0.8,
    location=(screw_diameter/2 - thread_depth/2, 0, 0)
)
thread_profile = bpy.context.active_object
thread_profile.name = "Thread_Profile"

# Rotate profile to point outward
thread_profile.rotation_euler = (0, math.radians(90), 0)
bpy.ops.object.transform_apply(rotation=True)

# Add screw modifier to create helix
num_turns = screw_length / thread_pitch
screw_mod = thread_profile.modifiers.new(name="ScrewMod", type='SCREW')
screw_mod.axis = 'Z'
screw_mod.angle = math.radians(360 * num_turns)
screw_mod.screw_offset = screw_length
screw_mod.iterations = 1
screw_mod.steps = int(64 * num_turns)
screw_mod.render_steps = int(64 * num_turns)
screw_mod.use_merge_vertices = True
screw_mod.merge_threshold = 0.001

# Apply screw modifier
bpy.context.view_layer.objects.active = thread_profile
bpy.ops.object.modifier_apply(modifier="ScrewMod")

# Move thread to correct position
thread_profile.location = (0, 0, -screw_length)

# Add solidify to make thread solid
solidify = thread_profile.modifiers.new(name="Solidify", type='SOLIDIFY')
solidify.thickness = thread_pitch * 0.3
solidify.offset = 0
bpy.ops.object.modifier_apply(modifier="Solidify")

# Boolean union thread with shaft core
bool_union = shaft.modifiers.new(name="AddThread", type='BOOLEAN')
bool_union.operation = 'UNION'
bool_union.object = thread_profile
bool_union.solver = 'EXACT'
bpy.context.view_layer.objects.active = shaft
bpy.ops.object.modifier_apply(modifier="AddThread")

# Delete thread profile
bpy.data.objects.remove(thread_profile, do_unlink=True)

# ============ CREATE SCREW HEAD ============
print(f"Creating {head_type} head...")

if head_type == "HEX":
    bpy.ops.mesh.primitive_cylinder_add(
        radius=head_diameter / 2,
        depth=head_height,
        vertices=6,
        location=(0, 0, head_height / 2)
    )
    head = bpy.context.active_object
    head.name = "Screw_Head"
    
    # Chamfer edges
    bevel = head.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = 0.5
    bevel.segments = 2
    bpy.ops.object.modifier_apply(modifier="Bevel")

elif head_type == "PHILLIPS":
    bpy.ops.mesh.primitive_cylinder_add(
        radius=head_diameter / 2,
        depth=head_height,
        vertices=32,
        location=(0, 0, head_height / 2)
    )
    head = bpy.context.active_object
    head.name = "Screw_Head"
    
    # Phillips cross slot
    slot_w = head_diameter * 0.12
    slot_d = head_height * 0.7
    
    # Create cross
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, head_height - slot_d/2 + 0.2))
    slot1 = bpy.context.active_object
    slot1.scale = (head_diameter * 0.9, slot_w, slot_d)
    bpy.ops.object.transform_apply(scale=True)
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, head_height - slot_d/2 + 0.2))
    slot2 = bpy.context.active_object
    slot2.scale = (slot_w, head_diameter * 0.9, slot_d)
    bpy.ops.object.transform_apply(scale=True)
    
    # Join slots
    bpy.ops.object.select_all(action='DESELECT')
    slot1.select_set(True)
    slot2.select_set(True)
    bpy.context.view_layer.objects.active = slot1
    bpy.ops.object.join()
    cross = bpy.context.active_object
    
    # Subtract from head
    bool_mod = head.modifiers.new(name="Cross", type='BOOLEAN')
    bool_mod.operation = 'DIFFERENCE'
    bool_mod.object = cross
    bool_mod.solver = 'EXACT'
    bpy.context.view_layer.objects.active = head
    bpy.ops.object.modifier_apply(modifier="Cross")
    bpy.data.objects.remove(cross, do_unlink=True)

elif head_type == "ALLEN":
    bpy.ops.mesh.primitive_cylinder_add(
        radius=head_diameter / 2,
        depth=head_height,
        vertices=32,
        location=(0, 0, head_height / 2)
    )
    head = bpy.context.active_object
    head.name = "Screw_Head"
    
    # Hex socket
    socket_r = screw_diameter * 0.45
    bpy.ops.mesh.primitive_cylinder_add(
        radius=socket_r,
        depth=head_height * 0.8,
        vertices=6,
        location=(0, 0, head_height - head_height * 0.4 + 0.2)
    )
    socket = bpy.context.active_object
    
    bool_mod = head.modifiers.new(name="Socket", type='BOOLEAN')
    bool_mod.operation = 'DIFFERENCE'
    bool_mod.object = socket
    bool_mod.solver = 'EXACT'
    bpy.context.view_layer.objects.active = head
    bpy.ops.object.modifier_apply(modifier="Socket")
    bpy.data.objects.remove(socket, do_unlink=True)

# ============ JOIN HEAD TO SHAFT ============
bpy.ops.object.select_all(action='DESELECT')
shaft.select_set(True)
head.select_set(True)
bpy.context.view_layer.objects.active = shaft
bpy.ops.object.join()
screw = bpy.context.active_object
screw.name = f"Screw_M{int(screw_diameter)}x{int(screw_length)}"

# ============ ADD POINTED TIP ============
tip_len = screw_diameter * 1.2
bpy.ops.mesh.primitive_cone_add(
    radius1=screw_diameter / 2,
    radius2=0.2,
    depth=tip_len,
    vertices=32,
    location=(0, 0, -screw_length - tip_len/2)
)
tip = bpy.context.active_object

bpy.ops.object.select_all(action='DESELECT')
screw.select_set(True)
tip.select_set(True)
bpy.context.view_layer.objects.active = screw
bpy.ops.object.join()

# Clean up screw mesh
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.mesh.remove_doubles(threshold=0.01)
bpy.ops.object.mode_set(mode='OBJECT')

bpy.ops.object.shade_smooth()
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

# Position screw
screw.location = (0, 0, 0)

# Add material
mat_screw = bpy.data.materials.new(name="Screw_Metal")
mat_screw.diffuse_color = (0.5, 0.5, 0.55, 1.0)
mat_screw.metallic = 0.95
mat_screw.roughness = 0.25
screw.data.materials.append(mat_screw)

# ============ CREATE NUT ============
print("Creating matching nut...")

# Outer hex shape
bpy.ops.mesh.primitive_cylinder_add(
    radius=nut_diameter / 2,
    depth=nut_height,
    vertices=6,
    location=(screw_diameter * 3, 0, nut_height / 2)
)
nut = bpy.context.active_object
nut.name = f"Nut_M{int(screw_diameter)}"

# Chamfer nut edges
bevel = nut.modifiers.new(name="Bevel", type='BEVEL')
bevel.width = 0.6
bevel.segments = 2
bpy.ops.object.modifier_apply(modifier="Bevel")

# Create threaded hole
# First create hole cylinder (slightly larger for clearance)
hole_radius = screw_diameter/2 + clearance
bpy.ops.mesh.primitive_cylinder_add(
    radius=hole_radius,
    depth=nut_height + 2,
    vertices=64,
    location=(screw_diameter * 3, 0, nut_height / 2)
)
hole = bpy.context.active_object
hole.name = "Nut_Hole"

# Boolean subtract hole from nut
bool_hole = nut.modifiers.new(name="Hole", type='BOOLEAN')
bool_hole.operation = 'DIFFERENCE'
bool_hole.object = hole
bool_hole.solver = 'EXACT'
bpy.context.view_layer.objects.active = nut
bpy.ops.object.modifier_apply(modifier="Hole")
bpy.data.objects.remove(hole, do_unlink=True)

# Create internal thread for nut
bpy.ops.mesh.primitive_cone_add(
    vertices=3,
    radius1=thread_depth,
    radius2=0,
    depth=thread_pitch * 0.8,
    location=(screw_diameter * 3 + screw_diameter/2 + clearance - thread_depth/2, 0, 0)
)
nut_thread_profile = bpy.context.active_object
nut_thread_profile.name = "Nut_Thread_Profile"

# Rotate to point inward (opposite of screw)
nut_thread_profile.rotation_euler = (0, math.radians(-90), 0)
bpy.ops.object.transform_apply(rotation=True)

# Screw modifier for internal threads
nut_turns = nut_height / thread_pitch
screw_mod = nut_thread_profile.modifiers.new(name="ScrewMod", type='SCREW')
screw_mod.axis = 'Z'
screw_mod.angle = math.radians(360 * nut_turns)
screw_mod.screw_offset = nut_height
screw_mod.iterations = 1
screw_mod.steps = int(64 * nut_turns)
screw_mod.render_steps = int(64 * nut_turns)
screw_mod.use_merge_vertices = True
screw_mod.merge_threshold = 0.001

bpy.context.view_layer.objects.active = nut_thread_profile
bpy.ops.object.modifier_apply(modifier="ScrewMod")

# Position internal thread
nut_thread_profile.location = (screw_diameter * 3, 0, 0)

# Solidify internal thread
solidify = nut_thread_profile.modifiers.new(name="Solidify", type='SOLIDIFY')
solidify.thickness = thread_pitch * 0.25
solidify.offset = 0
bpy.ops.object.modifier_apply(modifier="Solidify")

# Union internal thread with nut
bool_thread = nut.modifiers.new(name="AddThread", type='BOOLEAN')
bool_thread.operation = 'UNION'
bool_thread.object = nut_thread_profile
bool_thread.solver = 'EXACT'
bpy.context.view_layer.objects.active = nut
bpy.ops.object.modifier_apply(modifier="AddThread")
bpy.data.objects.remove(nut_thread_profile, do_unlink=True)

# Clean up nut
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.mesh.remove_doubles(threshold=0.01)
bpy.ops.object.mode_set(mode='OBJECT')

bpy.ops.object.shade_smooth()
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

# Nut material
mat_nut = bpy.data.materials.new(name="Nut_Metal")
mat_nut.diffuse_color = (0.55, 0.55, 0.6, 1.0)
mat_nut.metallic = 0.95
mat_nut.roughness = 0.2
nut.data.materials.append(mat_nut)

# ============ FINAL OUTPUT ============
print("=" * 60)
print(f"🔩 SCREW M{int(screw_diameter)}x{int(screw_length)} Created!")
print(f"   - Head: {head_type}, Ø{head_diameter}mm, {head_height}mm thick")
print(f"   - Shaft: Ø{screw_diameter}mm, {screw_length}mm long")
print(f"   - Thread pitch: {thread_pitch}mm")
print(f"   - Thread depth: {thread_depth}mm")
print("=" * 60)
print(f"🔧 NUT M{int(screw_diameter)} Created!")
print(f"   - Size: Ø{nut_diameter}mm (across flats)")
print(f"   - Height: {nut_height}mm")
print(f"   - Thread clearance: {clearance}mm (for 3D printing fit)")
print("=" * 60)
print("📤 Export separately:")
print("   1. Select Screw > File > Export > STL")
print("   2. Select Nut > File > Export > STL")
print("=" * 60)
print("🖨️  3D PRINTING TIPS:")
print("   - Print screw standing up (head on bed)")
print("   - Print nut flat (hex face down)")
print(f"   - Clearance of {clearance}mm should allow fit")
print("   - May need to adjust clearance for your printer")
print("=" * 60)
