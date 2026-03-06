$fn = 120;

// =====================
// COLOR VARIABLES
// =====================
base_color  = [0.1,0.7,0.3];    // Green
ring_color  = [0.8,0.5,0.1];    // Orange
text_color  = [1,1,1];          // White
// =====================

// SETTINGS
name = "Gururaj";
font_name = "Liberation Mono:style=Bold";
text_size = 7;

base_thickness = 3;
text_thickness = 2;

star_points = 6;
star_radius_outer = 18;
star_radius_inner = 9;

ring_outer_d = 5;
ring_inner_d = 2.5;
ring_offset_x = 22;

// Star shape module
module star_shape(points, r1, r2) {
    pts = [ for (i = [0 : points*2-1])
        let (a = i*180/points)
        [cos(a)*((i%2==0)?r1:r2), sin(a)*((i%2==0)?r1:r2)]
    ];
    polygon(points = pts);
}

difference() {
    union() {
        // BASE: Star shape
        color(base_color)
        linear_extrude(height = base_thickness)
            star_shape(star_points, star_radius_outer, star_radius_inner);

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
