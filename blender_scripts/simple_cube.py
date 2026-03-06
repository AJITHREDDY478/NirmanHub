# Simple Blender Test Script - Creates a cube
# Run in Blender: Text Editor > Open > Run Script (Alt+P)

import bpy

# Clear existing meshes
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.select_by_type(type='MESH')
bpy.ops.object.delete()

# Create a simple cube
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 1))

# Get reference to the cube
cube = bpy.context.active_object
cube.name = "TestCube"

# Add a bevel modifier for nicer edges
bpy.ops.object.modifier_add(type='BEVEL')
cube.modifiers["Bevel"].width = 0.1
cube.modifiers["Bevel"].segments = 3

print("Success! Cube created at origin.")
print("Export: File > Export > STL for 3D printing")
