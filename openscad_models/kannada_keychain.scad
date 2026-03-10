$fn = 120;

// =====================
// COLOR VARIABLES
// =====================
base_color  = [1,1,1];        // Black
ring_color  = [1,1,1];        // Red
text_color  = [0,0,0];        // White
// =====================

// SETTINGS
name = "ರಾಯರಿದ್ದಾರೆ";
font_name = "Noto Sans Kannada:style=Bold";
text_size = 7;

base_thickness = 2;
text_thickness = 1;

ring_outer_d = 4;
ring_inner_d = 2;

ring_offset_x = -1.8;


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

