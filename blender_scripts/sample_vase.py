"""
Sample Blender Python Script - Parametric Vase
Run this in Blender: Text Editor > Open > Run Script (Alt+P)
Then export as STL for 3D printing in Bambu Studio
"""

import bpy
import math

# Clear existing mesh objects
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.select_by_type(type='MESH')
bpy.ops.object.delete()

# ============ PARAMETERS (Adjust these!) ============
vase_height = 10.0       # Total height in cm
base_radius = 2.0        # Bottom radius
top_radius = 3.0         # Top opening radius
waist_radius = 1.5       # Middle "pinch" radius
waist_position = 0.4     # Where the waist is (0-1, 0.4 = 40% up)
segments = 64            # Smoothness (higher = smoother)
rings = 32               # Vertical resolution
wall_thickness = 0.3     # Wall thickness for 3D printing

# ============ CREATE VASE PROFILE ============
def get_radius_at_height(t):
    """Calculate radius at normalized height t (0-1)"""
    if t < waist_position:
        # Bottom to waist: interpolate from base to waist
        factor = t / waist_position
        return base_radius + (waist_radius - base_radius) * factor
    else:
        # Waist to top: interpolate from waist to top
        factor = (t - waist_position) / (1 - waist_position)
        # Add a slight curve using sine
        curve = math.sin(factor * math.pi * 0.5)
        return waist_radius + (top_radius - waist_radius) * curve

# ============ CREATE OUTER SURFACE ============
verts = []
faces = []

# Generate vertices for outer surface
for ring in range(rings + 1):
    t = ring / rings
    z = t * vase_height
    radius = get_radius_at_height(t)
    
    for seg in range(segments):
        angle = (seg / segments) * 2 * math.pi
        x = radius * math.cos(angle)
        y = radius * math.sin(angle)
        verts.append((x, y, z))

# Generate faces for outer surface
for ring in range(rings):
    for seg in range(segments):
        v1 = ring * segments + seg
        v2 = ring * segments + (seg + 1) % segments
        v3 = (ring + 1) * segments + (seg + 1) % segments
        v4 = (ring + 1) * segments + seg
        faces.append((v1, v2, v3, v4))

# ============ CREATE INNER SURFACE (for hollow vase) ============
inner_start = len(verts)

for ring in range(rings + 1):
    t = ring / rings
    z = t * vase_height
    radius = max(get_radius_at_height(t) - wall_thickness, 0.5)
    
    # Start inner cavity slightly above bottom
    if t < 0.05:
        radius = 0.01  # Almost closed at bottom
    
    for seg in range(segments):
        angle = (seg / segments) * 2 * math.pi
        x = radius * math.cos(angle)
        y = radius * math.sin(angle)
        verts.append((x, y, z))

# Generate faces for inner surface (reversed normals)
for ring in range(rings):
    for seg in range(segments):
        v1 = inner_start + ring * segments + seg
        v2 = inner_start + ring * segments + (seg + 1) % segments
        v3 = inner_start + (ring + 1) * segments + (seg + 1) % segments
        v4 = inner_start + (ring + 1) * segments + seg
        faces.append((v4, v3, v2, v1))  # Reversed for inner normals

# ============ CONNECT TOP RIM ============
outer_top_start = rings * segments
inner_top_start = inner_start + rings * segments

for seg in range(segments):
    v1 = outer_top_start + seg
    v2 = outer_top_start + (seg + 1) % segments
    v3 = inner_top_start + (seg + 1) % segments
    v4 = inner_top_start + seg
    faces.append((v1, v2, v3, v4))

# ============ CLOSE BOTTOM ============
# Add center vertex for bottom
bottom_center = len(verts)
verts.append((0, 0, 0))

for seg in range(segments):
    v1 = seg
    v2 = (seg + 1) % segments
    faces.append((bottom_center, v2, v1))

# ============ CREATE MESH IN BLENDER ============
mesh = bpy.data.meshes.new("Vase")
mesh.from_pydata(verts, [], faces)
mesh.update()

# Create object and link to scene
vase_obj = bpy.data.objects.new("Parametric_Vase", mesh)
bpy.context.collection.objects.link(vase_obj)

# Select and make active
bpy.context.view_layer.objects.active = vase_obj
vase_obj.select_set(True)

# Smooth shading
bpy.ops.object.shade_smooth()

# Add subdivision modifier for extra smoothness (optional)
# bpy.ops.object.modifier_add(type='SUBSURF')
# vase_obj.modifiers["Subdivision"].levels = 1

# Scale to millimeters for 3D printing (Blender uses meters)
vase_obj.scale = (0.01, 0.01, 0.01)  # Convert cm to meters

print("=" * 50)
print("Vase created successfully!")
print(f"Height: {vase_height} cm")
print(f"Base radius: {base_radius} cm")
print(f"Top radius: {top_radius} cm")
print(f"Wall thickness: {wall_thickness} cm")
print("=" * 50)
print("To export for 3D printing:")
print("1. File > Export > STL (.stl)")
print("2. Check 'Selection Only' if needed")
print("3. Set Scale to 100 (to convert to mm)")
print("4. Import into Bambu Studio")
print("=" * 50)
