/* ===============================
   Bike Number Plate Keychain
   Reference style (image-like)
   =============================== */

$fn = 120;

// ---------- Custom Text ----------
name_text = "YOUR NAME";
line1     = "MH 09";
line2     = "AB 0542";

// ---------- Font ----------
font_used = "Arial Black:style=Regular";   // fallback if missing: "Liberation Sans:style=Bold"

// ---------- Plate Dimensions (mm) ----------
plate_w         = 60;
plate_h         = 36;
plate_corner_r  = 4.2;

// ---------- Thickness ----------
base_t          = 2.4;   // white base
border_h        = 1.2;   // black raised border
text_h          = 1.2;   // raised text
banner_h        = 1.1;   // raised top black strip

// ---------- Border ----------
border_w        = 1.9;

// ---------- Top Name Strip ----------
name_strip_w    = 35;
name_strip_h    = 6.2;
name_strip_r    = 2.2;

// ---------- Keyring Tab ----------
tab_outer_r     = 3.3;   // outer boss radius
tab_hole_r      = 1.35;  // keyring hole radius
tab_center_y    = plate_h/2 + 7.0;
neck_w          = 8.0;
neck_h          = 5.0;

// ---------- Text Sizes ----------
name_size       = 3.2;
line_size       = 8.0;

// ---------- Utilities ----------
module rounded_rect_2d(w, h, r) {
    offset(r = r) offset(delta = -r)
        square([w, h], center = true);
}

module tab_shape_2d() {
    union() {
        translate([0, plate_h/2 + neck_h/2])
            square([neck_w, neck_h], center = true);
        translate([0, tab_center_y])
            circle(r = tab_outer_r);
    }
}

module outer_shape_2d() {
    union() {
        rounded_rect_2d(plate_w, plate_h, plate_corner_r);
        tab_shape_2d();
    }
}

// ---------- Base (white) ----------
module white_base() {
    color("white")
    linear_extrude(height = base_t)
        outer_shape_2d();
}

// ---------- Plate Border (black, raised) ----------
module black_plate_border() {
    color("black")
    translate([0, 0, base_t])
    linear_extrude(height = border_h)
    difference() {
        rounded_rect_2d(plate_w, plate_h, plate_corner_r);
        rounded_rect_2d(
            plate_w - 2*border_w,
            plate_h - 2*border_w,
            max(0.1, plate_corner_r - border_w)
        );
    }
}

// ---------- Tab Ring Border (black, raised) ----------
module black_tab_ring() {
    color("black")
    translate([0, 0, base_t])
    linear_extrude(height = border_h)
    translate([0, tab_center_y])
    difference() {
        circle(r = tab_outer_r);
        circle(r = tab_hole_r);
    }
}

// ---------- Top name strip ----------
module top_name_strip() {
    color("black")
    translate([0, plate_h/2 - 4.3, base_t])
    linear_extrude(height = banner_h)
        rounded_rect_2d(name_strip_w, name_strip_h, name_strip_r);
}

// ---------- Raised texts ----------
module raised_texts() {
    // White text on black strip (same raised height as number text)
    color("white")
    translate([0, plate_h/2 - 4.5, base_t + banner_h])
    linear_extrude(height = text_h)
        text(name_text, size = name_size, halign = "center", valign = "center", font = font_used);

    // Main black texts
    color("black")
    translate([0, 2.8, base_t])
    linear_extrude(height = text_h)
        text(line1, size = line_size, halign = "center", valign = "center", font = font_used);

    color("black")
    translate([0, -8.7, base_t])
    linear_extrude(height = text_h)
        text(line2, size = line_size, halign = "center", valign = "center", font = font_used);
}

// ---------- Final ----------
union() {
    white_base();
    black_plate_border();
    black_tab_ring();
    top_name_strip();
    raised_texts();
}
