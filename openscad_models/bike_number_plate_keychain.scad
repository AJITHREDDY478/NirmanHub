/* ===============================
   Bike Number Plate Keychain
   Reference style (image-like)
   =============================== */

$fn = 120;

// ---------- Custom Text ----------
name_text = "AJITH REDDY";
line1     = "KA 09";
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

// ---------- Text Sizes ----------
name_size       = 3.2;
line_size       = 8.0;

// ---------- Backside Brand Mark ----------
back_logo_enabled = true;
back_logo_text    = "Sneha Fancy Store";
back_logo_size    = 1.0;
back_logo_depth   = 0.35; // engraved depth from backside
back_logo_x       = -18;
back_logo_y       = -15.0;

// ---------- Top Name Strip ----------
name_char_w_factor = 0.72; // approximate average glyph width per character at size=1
name_strip_padding = 6.0;  // total left+right padding around name text
name_strip_min_w   = 35;
name_strip_max_w   = plate_w - 2*(border_w + 1.0);
name_strip_w       = min(
    name_strip_max_w,
    max(name_strip_min_w, len(name_text) * name_size * name_char_w_factor + name_strip_padding)
);
name_strip_h    = 6.2;
name_strip_r    = 2.2;
name_strip_top_chamfer = 1.2; // chamfer size for top-left and top-right edges
name_strip_y_offset = -4.3; // keeps strip inside near the top edge

// ---------- Keyring Tab ----------
tab_outer_r     = 2.3;   // outer boss radius
tab_hole_r      = .75;  // keyring hole radius
ring_overlap    = 2.2;   // overlap into plate so ring is attached
tab_center_y    = plate_h/2 + tab_outer_r - ring_overlap;

// ---------- Utilities ----------
module rounded_rect_2d(w, h, r) {
    offset(r = r) offset(delta = -r)
        square([w, h], center = true);
}

module top_chamfer_rounded_strip_2d(w, h, r, chamfer) {
    difference() {
        rounded_rect_2d(w, h, r);

        polygon(points = [
            [-w/2, h/2],
            [-w/2 + chamfer, h/2],
            [-w/2, h/2 - chamfer]
        ]);

        polygon(points = [
            [w/2, h/2],
            [w/2 - chamfer, h/2],
            [w/2, h/2 - chamfer]
        ]);
    }
}

module tab_shape_2d() {
    translate([0, tab_center_y])
        circle(r = tab_outer_r);
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
    translate([0, plate_h/2 + name_strip_y_offset, base_t])
    linear_extrude(height = banner_h)
    top_chamfer_rounded_strip_2d(name_strip_w, name_strip_h, name_strip_r, name_strip_top_chamfer);
}

// ---------- Raised texts ----------
module raised_texts() {
    // White text on black strip (extrudes from black strip base level)
    color("white")
    translate([0, plate_h/2 + name_strip_y_offset, base_t])
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

// ---------- Backside brand engraving ----------
module backside_brand_cut() {
    if (back_logo_enabled)
        translate([back_logo_x, back_logo_y, -0.02])
        linear_extrude(height = back_logo_depth + 0.02)
            mirror([1, 0, 0])
                text(back_logo_text, size = back_logo_size, halign = "center", valign = "center", font = font_used);
}

// ---------- Final ----------
difference() {
    union() {
        white_base();
        black_plate_border();
        black_tab_ring();
        top_name_strip();
        raised_texts();
    }

    // Full through-hole for keyring (cuts all layers)
    translate([0, tab_center_y, -0.2])
        cylinder(h = base_t + border_h + text_h + banner_h + 0.4, r = tab_hole_r);

    // Small brand mark on backside
    backside_brand_cut();
}
