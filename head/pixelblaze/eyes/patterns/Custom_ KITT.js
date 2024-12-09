// Note: Modified for 2D.

/*
  Knight Rider: A car named KITT gains sentience and fights critme and all that 
  good stuff.
  
  Want to learn how to code patterns like this? This pattern has a YouTube
  video walkthrough:
  
    https://www.youtube.com/watch?v=3ugNIZ96UK4
*/

logicalPixelCount = 15 + 4
earsPixelCount = 46

leader = 0
direction = 1
pixels = array(logicalPixelCount)

speed = logicalPixelCount / 800
fade = .0007
export function beforeRender(delta) {
  lastLeader = floor(leader)
  leader += direction * delta * speed
  
  if (leader >= logicalPixelCount) {
    direction = -direction
    leader = logicalPixelCount - 1
  }
  
  if (leader < 0) {
    direction = -direction
    leader = 0
  }

  // Fill pixels between frames. Added after the video walkthrough was uploaded.
  up = lastLeader < leader 
  for (i = lastLeader; i != floor(leader); up ? i++ : i-- ) pixels[i] = 1
    
  for (i = 0; i < logicalPixelCount; i++) {
    pixels[i] -= delta * fade
    pixels[i] = max(0, pixels[i])
  }
}

export function render2D(index, x, y) {
  index = 3 + floor(((x > 0.5) ? (2 - 2*x) : (2*x)) * (logicalPixelCount - 3) - y*3)
  v = pixels[index]
  v = v * v * v
  hsv(0, 1, v)
}

export function render(index) {
  v = pixels[index]
  v = v * v * v
  hsv(0, 1, v)
}