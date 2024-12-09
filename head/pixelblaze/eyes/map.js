function (pixelCount) {
  //set zigzag to true if every other LED row travels in reverse
  //if they are all straight across, set it to false
  zigzag = true;
  
  //rotate a point (x, y), along a center (cx, cy), by an angle in degrees
  function rotate(cx, cy, x, y, angle) {
    var radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return [nx, ny];
  }

  //create a set of coordinates for a matrix panel
  //sized (w, h), rotated by an angle, and offset by (sx, sy)
  function panel(w, h, sx, sy, angle) {
    var x, x2, y, p, map = [];
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        //for zigzag, flip direction every other row
        if (zigzag && y % 2 == 1)
          x2 = w - 1 - x;
        else
          x2 = x;
        p = rotate((w-1)/2, (h-1)/2, x2, y, angle);
        p[0] += sx;
        p[1] += sy;
        map.push(p);
      }
    }
    return map;
  }

  //assemble one or more panels
  var map = [];

  map = map.concat(panel(15, 4, 0, 0, 0));
  map = map.concat(panel(15, 4, -15, 0, 180));

  return map;
}