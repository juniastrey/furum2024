$fn = 100;

name = "Marble";

glow = false;

text_size = 5;

width = textmetrics(name, text_size).size[0];

descent = textmetrics(name, text_size).descent;

big_r = 12.5;

small_r = 7.5;

mini_r = 5;

border = 1.25;

margin = 2.5;

tall_h =  5;

short_h = 2.5;

module black() {
    union() {
        difference() {
            linear_extrude(tall_h)
            union() {
                circle(big_r);

                translate([width + big_r + 0.5 * margin, 0, 0])
                circle(small_r);

                translate([(width + big_r + 0.5 * margin) / 2, 0, 0])
                square([width + big_r + 0.5 * margin, 2 * small_r], true);
                
                translate([-big_r, 0, 0])
                difference() {
                    circle(mini_r);
                    circle(mini_r - 1.5 * border);
                };
            };

            translate([0, 0, short_h])
            linear_extrude(tall_h)
            union() {
                circle(big_r - border);
                difference() {
                    union() {
                        translate([width + big_r + 0.5 * margin, 0, 0])
                        circle(small_r - border);
                        
                        translate([(width + big_r + 0.5 * margin) / 2, 0, 0])
                        square([width + big_r + 0.5 * margin, 2 * (small_r - border)], true);
                    };
                    
                    circle(big_r);
                };
            };
        };

        linear_extrude(tall_h)
        translate([big_r + margin, 0.5 * descent, 0])
        text(name, text_size, valign="center");

        intersection() {
            if (glow) {
                linear_extrude(tall_h)
                scale([0.06, 0.06, 0.06])
                offset(-0.2)
                import(str("svgs/", name, ".svg"), center=true);
            } else {
                linear_extrude(tall_h)
                scale([0.06, 0.06, 0.06])
                offset(delta=0.5)
                import(str("svgs/", name, ".svg"), center=true);
            };
            
            linear_extrude(2 * tall_h)
            circle(big_r - border);

        };
    }
}

if (glow) {
        translate([0, 0, 0.5 * short_h])
        linear_extrude(tall_h - 0.5 * short_h - 0.01)
        union() {
            circle(big_r - 0.5 * border);

            translate([width + big_r + 0.5 * margin, 0, 0])
            circle(small_r - 0.5 * border);

            translate([(width + big_r + 0.5 * margin) / 2, 0, 0])
            square([width + big_r + 0.5 * margin, 2 * (small_r - 0.5 * border)], true);
        };
} else {
    black();
};
