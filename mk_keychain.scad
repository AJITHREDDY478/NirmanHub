$fn = 120;

// =====================
// COLOR VARIABLES
// =====================
base_color = [0, 0, 0];   // Black base
logo_color = [1, 1, 1];   // White raised logo

// =====================
// PARAMETERS
// =====================
base_thickness = 2.2;      // Main body thickness
logo_raise     = 1.2;      // Raised MK thickness
stroke_w       = 1.9;      // Logo stroke width
padding        = 1.25;     // Tight border around logo

ring_outer_d   = 6.8;
ring_inner_d   = 3.6;
ring_center    = [-5.7, 12.6];  // Ring moved up-left, less intrusive

// =====================
// HELPERS
// =====================
module bar(p1, p2, w) {
    dx = p2[0] - p1[0];
    dy = p2[1] - p1[1];
    len = sqrt(dx * dx + dy * dy);
    ang = atan2(dy, dx);

    translate([(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2])
        rotate(ang)
            square([len, w], center = true);
}

// Angular MK logo (2D)
module mk_logo_2d(w = stroke_w) {
    union() {
        // M (closer to reference proportions)
        bar([0, 0],   [0, 18],   w);   // left vertical
        bar([0, 18],  [9.2, 11], w);   // first down stroke
        bar([9.2, 11],[18.2, 17],w);   // second up stroke
        bar([18.2, 17],[18.2, 8],w);   // short right vertical of M

        // M inner double line
        bar([0, 14.2],  [8.7, 8.4],  w * 0.72);
        bar([8.7, 8.4], [13.8, 11.7], w * 0.72);

        // Lower legs like logo style
        bar([0, 0],   [0, -5.2],   w);
        bar([18.2, 8],[18.2, -5.2],w);

        // K
        bar([23.0, -5.2], [23.0, 17.0], w);
        bar([23.0, 8.0],  [34.2, 19.2], w);
        bar([23.0, 8.0],  [34.2, -2.8], w);
    }
}

// Base profile + ring tab (2D)
module keychain_base_2d() {
    union() {
        // Chamfered offset keeps sharp edges (no rounded blob look)
        offset(delta = padding, chamfer = true) mk_logo_2d();
        translate(ring_center) circle(d = ring_outer_d);
    }
}

// =====================
// FINAL MODEL
// =====================
difference() {
    union() {
        // Black base (background)
        color(base_color)
        linear_extrude(height = base_thickness)
            keychain_base_2d();

        // White raised logo on top
        color(logo_color)
        translate([0, 0, base_thickness])
            linear_extrude(height = logo_raise)
                mk_logo_2d();
    }

    // Keyring hole through full thickness
    translate([ring_center[0], ring_center[1], -0.1])
        cylinder(h = base_thickness + logo_raise + 0.2, d = ring_inner_d);
}
