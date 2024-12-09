use <bend.scad>

include <BOSL2/std.scad>
include <BOSL2/rounding.scad>

$fn = 100;

// Length of segment.
h = 300;

// Radius of wide end.
r = 50;

// Change in r within segment.
dr = 15;

// Change in r between segments.
step = 2.5;

// Margin for wiggle room.
rim = 5;

// Angle of wedge on tip.
a = 45;

// Increase in socket angle for wiggle room.
da = 5;

// Radius for rounding of wedge.
tip_r = 10;

// Depth of socket.
depth = 60;

// Gap betwen holes.
gap = 30;

// Radius of ball piece on wide end (tip).
br = 6;

// Change in tr for narrow end (socket).
dbr = 1;

// Lip on ball piece.
lip = 1;

// Change in lip.
dlip = 1;

// Extrusion of ball piece for tip.
ext = 4;

// Change in ext for socket.
dext = 2;

module cone(r=r, a=a, br=br, ext=ext, lip=lip) {
    extend = (r + rim) / tan(a);
    tip = [
        [-r - rim, h/2 + rim],
        [0, h/2 + rim + extend],
        [r + rim, h/2 + rim]
    ];
    tip_rounded = round_corners(tip, radius=tip_r, closed=false);
    tip_full = concat(tip_rounded, [
        [r + rim, -h/2 - rim],
        [-r - rim, -h/2 - rim]
    ]);
    union() {
        intersection() {
            translate([0, 0, extend + rim])
            rotate([-90, 0, 0])
            linear_extrude(2*(r + rim), center=true)
            polygon(tip_full);

            cylinder(h, r - dr, r, true);
        }
        
        translate([0, 0, -h/2 - ext/2])
        cylinder(ext + 2*rim, r=br - lip);
        
        translate([0, 0, -h/2 - ext])
        sphere(br);
    }
}

module bent_cone(r=r, i=1) {
    cylindric_bend([2*r + rim, h + rim + 2*br + ext, 2*r + rim], 300)
    translate([r + rim, h/2, r + rim])
    rotate([90, 0, 0])
    difference() {
        cone(r, a, br - dbr, ext, lip + dlip);

        if (i != 0) {
            translate([0, 0, h - depth])
            cone(r + step + rim, a + da, br, ext - dext);

            translate([0, r - dr + 2*rim, h/2 - rim])
            rotate([-90, 0, 180])
            linear_extrude(rim, center=true)
            text(str(i), 2*rim, halign="center");
        }
        
        translate([0, -gap/2, 0])
        cylinder(h + 2*rim, 5, 5, true);
        
        translate([0, gap/2, 0])
        cylinder(h + 2*rim, 5, 5, true);
        
    }
}

i = 0;

if (i >= 0) {
    union() {
        bent_cone(r - i*step, i);

        if (i == 0) {
            translate([r + rim - 30, -5, r + rim])
            rotate([90, 0, 90])
            difference() {
                cuboid([30, 2*r, 15], rounding=5);
                cuboid([15, 2*r - 15, 16], rounding=-5);
            }

            translate([r + rim + 30, -5, r + rim])
            rotate([90, 0, 90])
            difference() {
                cuboid([30, 2*r, 15], rounding=5);
                cuboid([15, 2*r - 15, 16], rounding=-5);
            }
        }
    }
} else {
    r = r + i*step;

    cylindric_bend([2*r + rim, h + rim + 1.5*dr, 2*r + rim], 300)
    translate([r + rim, h/2, r + rim])
    rotate([90, 0, 0])
    difference() {
        union() {
            cylinder(h, r - 1.5*dr, r, true);
            translate([0, 0, -h/2])
            sphere(r - 1.5*dr);
        }

        translate([0, 0, h - depth])
        cone(r + step + rim, a + da, br, ext - dext);

        translate([0, r - dr + 2*rim, h/2 - rim])
        rotate([-90, 0, 180])
        linear_extrude(rim, center=true)
        text(str(i), 2*rim, halign="center");

        translate([0, 0, h/2 - depth])
        rotate([0, 90, 0])
        rotate_extrude()
        translate([gap/2, 0, 0])
        circle(5);
    }
}
