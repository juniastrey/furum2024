// Note: Modified for 2D.

/*
This pattern is based on the default scrolling rainbow and has a slider to control speed.
It uses an accumulation based on delta instead of time() so that changes in speed do not cause the animation to jump.
The downsides is slightly more code, and this pattern won't be synchronized with other Pixelblazes through firestorm.
*/

var speedRange = 1/1000 // this scales the milliseconds back to a usable range. shown here, the max rate is 1Hz
var speed = speedRange // controlled by slider

export function sliderSpeed(s) {
  speed = s*s * speedRange // square it to give better control at lower values, then scale it
}

var t1
export function beforeRender(delta) {
  t1 = (t1 + delta * speed) % 1 // accumulate time in t1, and wrap it using modulus math to keep it between 0-1
}

export function render2D(index, x, y) {
  h = t1 + ((x > 0.5) ? (1 - 2*x) : (2*x - 1)) - y / 4
  s = 1
  v = 1
  hsv(h, s, v)
}

export function render(index) {
  h = t1 + index/pixelCount
  s = 1
  v = 1
  hsv(h, s, v)
}