// Note: Modified to have different eye design and behaviour. Comments from original are unchanged.

/**
 *  Blinky Eyes 2D - 6/5/2022
 *  Debra Ansell (GeekMomProjects)
 *  Simple code to display 1 or 2 blinking eyes on an LED matrix. Tested on a 20 x 10 display of two LED pillows 
 *  here (https://photos.app.goo.gl/irA56QcfWofg1i6UA) and on a rectangular 30 x 24 grid. Probably won't
 *  look very good at much lower resolution. Fine tuning variable values for the best look will likely depend a lot
 *  on the size and resolution of the specific display.
 * */

var neyes = 2             // Show 1 or 2 eyes on the display
var radius = 2.5
var Bmax = 4             // Maximum eye height (Using value of 0.25 for 1 eye, 0.20 for 2 eyes)
var Riris = 1.5          // Radius of the iris (using value of 0.16 for 1 eye, 0.12 for 2 eyes)
var blink = false         // Are we in the middle of a blink?
var blinkPhase = 0        // How long have we been in this phase of blinking (value in seconds)
var blinkInterval = 3     // Time interval (in seconds) before the next blink
var blinkLength = .5      // Total time interval (in seconds) of the blink
var move = false          // Are the irises moving? (from center to side, then back again)
var movePhase = 0         // How long have we been in this phase of iris motion (value in seconds)
var moveDir = 1           // Which direction are the irises moving (either -1 or 1)
var moveInterval = 10    // Time interval (in seconds) before we move 
var moveLength = 2       // Total time interval (in seconds) for the eye movement
var midIris = 0           // Position of the middle of the iris relative to the middle of the eye
var B                     // Current eye outline (ellipse) height for use in the ellipse equation (changes during the blink phase)

var matrixRows = 4
var matrixCols = 15

export function beforeRender(delta) {

  // Update our motion timer
  movePhase += delta/1000
  if (move) {
    if (movePhase > moveLength) {   // At the end of motion time interval
      movePhase = 0
      move = false
      //randomize time to next movement
      moveInterval = 10 + random(.7)
    }  else {
        // Position of iris is changing
        midIris = moveDir * 3 * wave(movePhase/moveLength - 0.25)
    }
  } else {
    if (movePhase > moveInterval) { // At the end of motionless time interval
      movePhase = 0
      // Randomize direction of eye movement
      moveDir = random(1) > 0.5 ? 1 : -1
      move = true
    }
    midIris = 0
  }
   
  blinkPhase += delta/1000
  if (blink) {
    if (blinkPhase > blinkLength) {  // At the end of blinking time interval
      blinkPhase = 0
      blink = false
      // Randomize time to next blink
      blinkInterval = 3 + random(1)
    } else {
        B = Bmax*wave(blinkPhase/blinkLength + 0.25)
    }
  } else {  //Not blinking
    // B is at maximum value unless we are blinking
    B = Bmax
    if (blinkPhase > blinkInterval) { // At the end of non-blinking time interval
      blinkPhase = 0    // Reset clock
      blink = true      // Start blink mode
    }
  }

}



export function render2D(index, x0, y0) {
  // Rescale coordinates to (0,0) in center of screen. X scale depends on whether we have 1 or 2 eyes
  x = (x0-.5)*neyes
  if (neyes > 1) {
    x += (x > 0 ? -0.5 : 0.5)
  }
  y = y0 - 0.5

  x *= matrixCols
  y *= matrixRows

  if (x0 < 0.5)
    x -= 1
  else
    x += 1

  x -= midIris
  
  // Distance to elipse line
  dscale = hypot(x, y)
  h = (dscale < Riris) ? 0.8 : 1
  s = dscale < Riris
  v = dscale <= radius && radius - y <= B 
  hsv(h,s,v)

}