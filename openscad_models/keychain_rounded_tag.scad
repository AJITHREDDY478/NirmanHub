$fn = 120;

// =====================
// COLOR VARIABLES
// =====================
base_color  = [0.2,0.2,0.8];    // Blue
ring_color  = [1,0.7,0.2];      // Gold
text_color  = [1,1,1];          // White
// =====================

// SETTINGS
name = "Gururaj";
font_name = "Liberation Sans:style=Bold";
text_size = 7; // Slightly smaller for more space

base_thickness = 3;
text_thickness = 2;

ring_outer_d = 5;
ring_inner_d = 2.5;

ring_offset_x = 28; // Move ring further outside the tag

module rounded_rectangle(w, h, r) {
    offset(r = r)
        square([w - 2*r, h - 2*r], center = true);
}

difference() {
    union() {
        // BASE: Rounded Rectangle
        color(base_color)
        translate([0, 0, 0])
            linear_extrude(height = base_thickness)
                rounded_rectangle(46, 16, 4); // Base width unchanged

        // RING
        translate([ring_offset_x, 0, 0])
        color(ring_color)
        linear_extrude(height = base_thickness)
            circle(d = ring_outer_d);

        // RAISED TEXT (centered)
        translate([0, 0, base_thickness])
        color(text_color)
        linear_extrude(height = text_thickness)
            text(name,
                size = text_size,
                font = font_name,
                halign = "center",
                valign = "center");
    }

    // CUT HOLE
    translate([ring_offset_x, 0, base_thickness/2])
    cylinder(h = base_thickness + text_thickness,
             d = ring_inner_d,
             center = true);
}
