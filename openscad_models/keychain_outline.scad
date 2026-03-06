$fn = 120;

// =====================
// COLOR VARIABLES
// =====================
base_color  = [0,0,0];        // Black
ring_color  = [0,0,0];        // Red
text_color  = [1,1,1];        // White
// =====================

// SETTINGS
name = "Gururaj";
font_name = "Liberation Serif:style=Bold";
text_size = 10;

base_thickness = 2;
text_thickness = 1.5;

ring_outer_d = 4;
ring_inner_d = 2;

ring_offset_x = -2;


difference() {

    union() {

        // BASE
        color(base_color)
        linear_extrude(height = base_thickness)
        offset(r = 2)
        text(name,
            size = text_size,
            font = font_name,
            halign = "left",
            valign = "center");

        // RING
        translate([ring_offset_x, 0, 0])
        color(ring_color)
        linear_extrude(height = base_thickness)
        circle(d = ring_outer_d);

        // RAISED TEXT
        translate([0, 0, base_thickness])
        color(text_color)
        linear_extrude(height = text_thickness)
        text(name,
            size = text_size,
            font = font_name,
            halign = "left",
            valign = "center");
    }

    // CUT HOLE
    translate([ring_offset_x, 0, base_thickness/2])
    cylinder(h = base_thickness + text_thickness,
             d = ring_inner_d,
             center = true);
}

