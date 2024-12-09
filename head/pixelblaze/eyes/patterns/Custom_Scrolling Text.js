// Note: Modified for 4px font. Comments from original for 8px font are unchanged.

/*
  Scrolling text marquee 2D
  
  This pattern animates ASCII characters scrolling across an LED matrix.
  
    Demo: https://youtu.be/668eQjiqSRQ
  
  The default settings work well with the $14 8x8 matrix sold here:
  
    https://www.tindie.com/products/electromage/electromage-8x8-led-matrix/
  
  Use the mapper to define how the matrix is wired (for example, zig-zag). 
  The 8x8 grid above works with the default "Matrix" example on the Mapper tab.
  
  With no map and just a 1D strip, you can use this to light paint text:
  
    https://photos.app.goo.gl/vU2BQsP6V84Zr6Df7
  
  Author: Jeff Vyduna (https://ngnr.org)
  Bugfixes: Zeb (https://forum.electromage.com/u/zeb)
*/

// Characters we want to scroll by every second. Try 3 for a matrix, or 30 for
// persistence-of-vision on a strip.
var speed = 3

// Define the message to be scrolled across the display
var messageLength = 12
export var message = array(messageLength) // Exported for setting via webSockets

// "  Hello?!?"
message[0] = 32; message[1] = 32;  // Leading spaces
message[2] = 72;   // H
message[3] = 101;  // e
message[4] = 108;  // l 
message[5] = 108;  // l 
message[6] = 111;  // o 
message[7] = 63; message[8] = 33; message[9] = 63 // "?!?"

/* 
  ASCII Chart

  32      48 0    65 A   74 J    83 S    97  a    106 j    115 s
  33 !    49 1    66 B   75 K    84 T    98  b    107 k    116 t
  34 "    50 2    67 C   76 L    85 U    99  c    108 l    117 u
  35 #    51 3    68 D   77 M    86 V    100 d    109 m    118 v
  36 $    52 4    69 E   78 N    87 W    101 e    110 n    119 w
  37 %    53 5    70 F   79 O    88 X    102 f    111 o    120 x
  38 &    54 6    71 G   80 P    89 Y    103 g    112 p    121 y
  39 '    55 7    72 H   81 Q    90 Z    104 h    113 q    122 z
  40 (    56 8    73 I   82 R            105 i    114 r    
  41 )    57 9                                   
  42 *    58 :                   91 [                      123 {
  43 +    59 ;                   92 \                      124 |
  44 ,    60 <                   93 ]                      125 }
  45 -    61 =                   94 ^                      126 ~
  46 .    62 >                   95 _    
  47 /    63 ?                   96 `                
          64 @                                            
*/


// Define the font's character set bitmap. See "Font Implementation" below.
var charRows = 4 // Rows in a character. 1 array per row.
var charCols = 4 // Columns in a character. 1 bit per column.

var fontCharCount = 128 // Max characters in the font. Must be a multiple of 8.
var fontBitmap = array(charRows)
for (row = 0; row < charRows; row++) fontBitmap[row] = array(fontCharCount / 8)

// Global 8x8bit array for storing and fetching characters from fontBitmap
var character = array(charRows)

// Define the 2D matrix display. If your matrix is different dimentions, change
// these to match or use a smaller matrixRows to scale your text height to fill.
var matrixRows = 4
var matrixCols = 30
var renderBuffer = array(matrixRows)
for (row = 0; row < matrixRows; row++) renderBuffer[row] = array(matrixCols)

var timer = 0 // Accumulates the ms between each beforeRender()

// Calculate the ms between each left shift of the message across matrix columns
var colShiftPeriod = 1000 / speed / charCols

export function beforeRender(delta) {
  timer += delta
  if (timer > colShiftPeriod) { 
    timer -= colShiftPeriod
    loadNextCol() // Shift and load a new column every colShiftPeriod ms
  }
}

export var hue, sat     // Exported so you can set them over websockets
hue = 0.05; sat = 0.9   // warm white
export var rainbow = true

export function render2D(index, x, y) {
  // y is in world units of 0...1 where (0,0) is the top-left and y is +↓
  row = floor(y * matrixRows)

  // The column to render is like the row, but physical column 0 (the leftmost)
  // starts bufferPointer columns into the renderBuffer.
  col = (floor(x * matrixCols) + bufferPointer) % matrixCols
  
  v = renderBuffer[row][col]  // 1 or 0
  if (rainbow)
    hsv(col / matrixCols, sat, v)
  else
    hsv(hue, sat, v)
}

// On a strip, render the leftmost column. You can use this to light paint in
// long exposure photographs, or render text in POV projects
export function render(index) {
  // Flip such that pixel 0, usually the closest to power, is the bottom of text
  index = pixelCount - index - 1
  
  // Mode 1: Use entire strip as a full character line height.
  // row = floor(charRows * index/ pixelCount)
  
  // Mode 2: repeat the characters vertically, with linespacing
  // If you flicker your eyes left-right, you can see the characters.
  // Looks best if you set `speed` above to much faster, like 30 chars/sec
  row = index % floor(1.5 * charRows) // 0.5em lineSpacing
  if (row > charRows - 1) { hsv(0, 0, 0); return } // blank rows

  // Render column 0, which starts bufferPointer columns into the renderBuffer
  col = bufferPointer % matrixCols
  
  // The color is added for light painting rainbows, and so that it's still
  // somewhat interesting on strips / the default sequencer
  hue = wave(time(0.02)) - index / pixelCount
  
  hsv(hue, sat, renderBuffer[row][col])
}


// When we render the renderBuffer, we start by loading the leftmost column of
// the matrix from the `bufferPointer` column in the renderBuffer.
var bufferPointer = 0 

/*
  E.g.: 8x8 matrix, rendering halfway through "AC": Right side of A, left of C

          renderbuffer[r][c]             Renders as:

  `bufferPointer` == 4 means leftmost column is here, and wraps around to 3
                     ↓       
       col = 0 1 2 3 4 5 6 7                0 1 2 3 4 5 6 7
    row = 0  . . . 1 1 . . .             0  1 . . . . . . 1  
          1  . . 1 1 1 1 . .             1  1 1 . . . . 1 1  
          2  . 1 1 . . 1 1 .             2  . 1 1 . . 1 1 .  
          3  . 1 1 . . 1 1 .             3  . 1 1 . . 1 1 .  
          4  . 1 1 . 1 1 1 .             4  1 1 1 . . 1 1 .  
          4  . . 1 1 . 1 1 .             4  . 1 1 . . . 1 1  
          5  . . . 1 . 1 1 .             5  . 1 1 . . . . 1  
          7  . . . . . . . .             7  . . . . . . . .  
                     ↑
                     This column will be replaced with the next column of "C",
                       ↑ then we'll advance `bufferPointer`
                     
Each element is a 16.16 fixed point number, so you could decide to pack HSV or 
RGB info into each byte, but this example is monochrome so each element just 
stores a 0 or 1, making rendering as simple as:

    if (renderBuffer[row][col]) hsv(0,0,1)
*/

var messageCols = messageLength * charCols // e.g., 12 chars have 96 columns
var messageColPointer = 0 // The next column of the overall message to load

// Load the next column from `message` into `renderBuffer` at `bufferPointer`
function loadNextCol() {
  charIndex = message[floor(messageColPointer / charCols)]
  fetchCharacter(charIndex) // loads global `character` with ASCII charIndex
  
  colIndex = messageColPointer % charCols
  for (row = 0; row < charRows; row++) {
    bit = (((character[row] << colIndex) & 0b1000) == 0b1000)
    renderBuffer[row][bufferPointer] = bit
  }
  
  bufferPointer = (bufferPointer + 1) % matrixCols
  messageColPointer = (messageColPointer + 1) % messageCols
}



/*
  Font Implementation
  
  Pixelblaze currently supports up to 64 arrays with 2048 array elements.
  
  To store a character set of 8x8 bit characters, we use 8 arrays, 
  one for each row.
  
  Four 8-bit maps are packed into each 32 bit array element. This makes the
  bitwise code a little hard to follow, but uses memory efficiently. The 8 most
  significant bits are referred to as "bank 0"; the next eight bits just left of
  the binary point are "bank 1", etc.
  
  Here's the scheme used to store the font bitmap. A period is a zero.
  
    ASCII character  A        B        C        D        E
        `charIndex`  65       66       67       68       69
      array element  [16]     [16]     [16]     [16]     [17]
               bank  0        1        2        3        0      
      fontBitmap[0]  ..11.... 111111.. ..1111.. 11111... 1111111.
      fontBitmap[1]  .1111... .11..11. .11..11. .11.11.. .11...1.
      fontBitmap[2]  11..11.. .11..11. 11...... .11..11. .11.1...
      fontBitmap[3]  11..11.. .11111.. 11...... .11..11. .1111...
      fontBitmap[4]  111111.. .11..11. 11...... .11..11. .11.1...
      fontBitmap[5]  11..11.. .11..11. .11..11. .11.11.. .11...1.
      fontBitmap[6]  11..11.. 111111.. ..1111.. 11111... 1111111.
      fontBitmap[7]  ........ ........ ........ ........ ........
  
  charIndex 0..31 (traditionally the ASCII control characters) are left 
  blank for user-defined custom characters.
*/

/*
  Font and character functions

  The storeCharacter functions take the character index (< `fontCharCount`) and 
  8 rows of 8 bits. Each row is a byte representing 8 bits of on/off bitmap data
  to become the pixels of a character. Therefore, this implementation is 
  currently tightly coupled to 8-bit wide characters.
*/

/*
  At character index `charIndex`, store 8 bytes of row data specified as 
  sequential arguments r0-r7. This allows us to easily use the public domain 
  font specified as comma-delimited hex bytes at:
  
  https://github.com/rene-d/fontino/blob/master/font8x8_ib8x8u.ino
*/
function storeCharacter(charIndex, r0, r1, r2, r3) {
  element = floor(charIndex / 8)
  bank = charIndex % 8
  packByte(0, element, bank, r0)
  packByte(1, element, bank, r1)
  packByte(2, element, bank, r2)
  packByte(3, element, bank, r3)
}

/*
  This alternate style stores the character using the 8 row global array named 
  `character`. It could be useful for storing sprites after transformations to
  create animations.
*/
function storeCharacter2(charIndex) {
  element = floor(charIndex / 8)
  bank = charIndex % 8
  for (var row = 0; row < charRows; row++) {
    packByte(row, element, bank, character[row])
  }
}

// Loads the global `character` from the specified charIndex
function fetchCharacter(charIndex) {
  element = floor(charIndex / 8)
  bank = charIndex % 8
  for (var row = 0; row < charRows; row++) {
    character[row] = unpackByte(row, element, bank)
  }
}

/*
  For a given row of a font's pixel data (fontBitmap[row]), there's a 
  (fontCharCount / 4) element long array that holds 32 bits per array element. 
  Thinking of each array element as a 4-byte word, the "bank" (0..3) specifies 
  which set of 8 bits we're storing for a particular character. Characters are 
  referred to by their charIndex (ASCII number), so:
  bank 0 in elements 0, 1, & 2 store the data for characters 0, 4, 8, etc;
  Bank 1 in elements 0, 1, & 2 store the data for characters 1, 5, 9, etc.
  
  The method below is used because the bitwise operators only work on 
  the top 16 bits.
*/
var byteHolder = array(8)
function packByte(row, element, bank, byte) {
  original = fontBitmap[row][element]
  
  // Load a 4-element array with the individual bytes in this 32 bit 'word'
  for (_bank = 0; _bank < 8; _bank++) {
    byteHolder[_bank] = (((original << (_bank * 4)) & 0xF000) >> 12) & 0xF
  }
  
  // Override the 8 bits we're trying to store
  byteHolder[bank] = byte 
  
  // Reassemble the 32 bit 'word'
  fontBitmap[row][element] = (byteHolder[0] << 12) 
                           + (byteHolder[1] << 8)
                           + (byteHolder[2] << 4) 
                           + byteHolder[3]
                           + (byteHolder[4] >> 4)
                           + (byteHolder[5] >> 8) 
                           + (byteHolder[6] >> 12)
                           + (byteHolder[7] >> 16)
}

// Inverse of packByte()
function unpackByte(row, element, bank) {
  word = fontBitmap[row][element]
  if (bank > 3) {
    byte = word << (4 * (bank - 3))
  } else if (bank < 3) {
    byte = word >> (4 * (3 - bank))
  } else {
    byte = word
  }
  return byte & 0xF // Zero out all but the 8 bits left of the binary point
}



/* 
  Font Data

  Public domain, courtesy of
  https://github.com/rene-d/fontino/blob/master/font8x8_ib8x8u.ino
*/

storeCharacter( 32, 0b0000, 0b0000, 0b0000, 0b0000)  // 0x20 (space)
storeCharacter( 33, 0b1000, 0b1000, 0b0000, 0b1000)  // 0x21 (exclam)
storeCharacter( 34, 0b1010, 0b1010, 0b0000, 0b0000)  // 0x22 (quotedbl)
storeCharacter( 35, 0b0010, 0b1110, 0b1110, 0b1000)  // 0x23 (numbersign)
storeCharacter( 36, 0b0110, 0b1100, 0b0110, 0b1100)  // 0x24 (dollar)
storeCharacter( 37, 0b1010, 0b0110, 0b1100, 0b1010)  // 0x25 (percent)
storeCharacter( 38, 0b0110, 0b1100, 0b1010, 0b1110)  // 0x26 (ampersand)
storeCharacter( 39, 0b1000, 0b1000, 0b0000, 0b0000)  // 0x27 (quotesingle)
storeCharacter( 40, 0b0100, 0b1000, 0b1000, 0b0100)  // 0x28 (parenleft)
storeCharacter( 41, 0b1000, 0b0100, 0b0100, 0b1000)  // 0x29 (parenright)
storeCharacter( 42, 0b1110, 0b0100, 0b1010, 0b0000)  // 0x2a (asterisk)
storeCharacter( 43, 0b0100, 0b1110, 0b0100, 0b0000)  // 0x2b (plus)
storeCharacter( 44, 0b0000, 0b0000, 0b0100, 0b1000)  // 0x2c (comma)
storeCharacter( 45, 0b0000, 0b1100, 0b0000, 0b0000)  // 0x2d (hyphen)
storeCharacter( 46, 0b0000, 0b0000, 0b0000, 0b1000)  // 0x2e (period)
storeCharacter( 47, 0b0010, 0b0100, 0b0100, 0b1000)  // 0x2f (slash)
storeCharacter( 48, 0b0100, 0b1110, 0b1010, 0b0100)  // 0x30 (zero)
storeCharacter( 49, 0b1100, 0b0100, 0b0100, 0b1110)  // 0x31 (one)
storeCharacter( 50, 0b1100, 0b0010, 0b0100, 0b1110)  // 0x32 (two)
storeCharacter( 51, 0b1100, 0b0110, 0b0010, 0b1100)  // 0x33 (three)
storeCharacter( 52, 0b1010, 0b1110, 0b0010, 0b0010)  // 0x34 (four)
storeCharacter( 53, 0b1110, 0b1100, 0b0010, 0b0100)  // 0x35 (five)
storeCharacter( 54, 0b0110, 0b1000, 0b1110, 0b1100)  // 0x36 (six)
storeCharacter( 55, 0b1110, 0b0010, 0b0100, 0b1000)  // 0x37 (seven)
storeCharacter( 56, 0b1110, 0b1110, 0b1010, 0b1110)  // 0x38 (eight)
storeCharacter( 57, 0b0110, 0b1110, 0b0010, 0b1100)  // 0x39 (nine)
storeCharacter( 58, 0b1000, 0b0000, 0b1000, 0b0000)  // 0x3a (colon)
storeCharacter( 59, 0b0100, 0b0000, 0b0100, 0b1000)  // 0x3b (semicolon)
storeCharacter( 60, 0b0100, 0b1000, 0b0100, 0b0000)  // 0x3c (less)
storeCharacter( 61, 0b1100, 0b0000, 0b1100, 0b0000)  // 0x3d (equal)
storeCharacter( 62, 0b1000, 0b0100, 0b1000, 0b0000)  // 0x3e (greater)
storeCharacter( 63, 0b1110, 0b0010, 0b0000, 0b0100)  // 0x3f (question)
storeCharacter( 64, 0b1110, 0b1110, 0b1110, 0b1110)  // 0x40 (at)
storeCharacter( 65, 0b0100, 0b1010, 0b1110, 0b1010)  // 0x41 (A)
storeCharacter( 66, 0b1110, 0b1100, 0b1010, 0b1100)  // 0x42 (B)
storeCharacter( 67, 0b0110, 0b1000, 0b1000, 0b0110)  // 0x43 (C)
storeCharacter( 68, 0b1100, 0b1010, 0b1010, 0b1100)  // 0x44 (D)
storeCharacter( 69, 0b1110, 0b1100, 0b1000, 0b1110)  // 0x45 (E)
storeCharacter( 70, 0b1110, 0b1100, 0b1000, 0b1000)  // 0x46 (F)
storeCharacter( 71, 0b0110, 0b1000, 0b1010, 0b0110)  // 0x47 (G)
storeCharacter( 72, 0b1010, 0b1110, 0b1010, 0b1010)  // 0x48 (H)
storeCharacter( 73, 0b1110, 0b0100, 0b0100, 0b1110)  // 0x49 (I)
storeCharacter( 74, 0b1110, 0b0010, 0b1010, 0b0100)  // 0x4a (J)
storeCharacter( 75, 0b1010, 0b1100, 0b1010, 0b1010)  // 0x4b (K)
storeCharacter( 76, 0b1000, 0b1000, 0b1000, 0b1110)  // 0x4c (L)
storeCharacter( 77, 0b1110, 0b1110, 0b1010, 0b1010)  // 0x4d (M)
storeCharacter( 78, 0b1100, 0b1010, 0b1010, 0b1010)  // 0x4e (N)
storeCharacter( 79, 0b0100, 0b1010, 0b1010, 0b0100)  // 0x4f (O)
storeCharacter( 80, 0b1110, 0b1010, 0b1110, 0b1000)  // 0x50 (P)
storeCharacter( 81, 0b0100, 0b1010, 0b1110, 0b0110)  // 0x51 (Q)
storeCharacter( 82, 0b1100, 0b1010, 0b1100, 0b1010)  // 0x52 (R)
storeCharacter( 83, 0b1110, 0b1100, 0b0010, 0b1110)  // 0x53 (S)
storeCharacter( 84, 0b1110, 0b0100, 0b0100, 0b0100)  // 0x54 (T)
storeCharacter( 85, 0b1010, 0b1010, 0b1010, 0b0100)  // 0x55 (U)
storeCharacter( 86, 0b1010, 0b1010, 0b1100, 0b1000)  // 0x56 (V)
storeCharacter( 87, 0b1010, 0b1010, 0b1110, 0b1110)  // 0x57 (W)
storeCharacter( 88, 0b1010, 0b0100, 0b1010, 0b1010)  // 0x58 (X)
storeCharacter( 89, 0b1010, 0b0100, 0b0100, 0b0100)  // 0x59 (Y)
storeCharacter( 90, 0b1110, 0b0100, 0b1000, 0b1110)  // 0x5a (Z)
storeCharacter( 91, 0b1100, 0b1000, 0b1000, 0b1100)  // 0x5b (bracketleft)
storeCharacter( 92, 0b1000, 0b0100, 0b0100, 0b0010)  // 0x5c (backslash)
storeCharacter( 93, 0b1100, 0b0100, 0b0100, 0b1100)  // 0x5d (bracketright)
storeCharacter( 94, 0b0100, 0b1010, 0b0000, 0b0000)  // 0x5e (asciicircum)
storeCharacter( 95, 0b0000, 0b0000, 0b0000, 0b1110)  // 0x5f (underscore)
storeCharacter( 96, 0b1000, 0b0100, 0b0000, 0b0000)  // 0x60 (grave)
storeCharacter( 97, 0b0000, 0b0110, 0b1010, 0b0110)  // 0x61 (a)
storeCharacter( 98, 0b1000, 0b1100, 0b1010, 0b1100)  // 0x62 (b)
storeCharacter( 99, 0b0000, 0b0110, 0b1000, 0b0110)  // 0x63 (c)
storeCharacter(100, 0b0010, 0b0110, 0b1010, 0b0110)  // 0x64 (d)
storeCharacter(101, 0b0000, 0b1110, 0b1100, 0b0110)  // * 0x65 (e)
storeCharacter(102, 0b0010, 0b0100, 0b1110, 0b0100)  // 0x66 (f)
storeCharacter(103, 0b0000, 0b1110, 0b0110, 0b1100)  // 0x67 (g)
storeCharacter(104, 0b1000, 0b1100, 0b1010, 0b1010)  // 0x68 (h)
storeCharacter(105, 0b1000, 0b0000, 0b1000, 0b1000)  // 0x69 (i)
storeCharacter(106, 0b1000, 0b0100, 0b0100, 0b1100)  // 0x6a (j)
storeCharacter(107, 0b1000, 0b1010, 0b1100, 0b1010)  // 0x6b (k)
storeCharacter(108, 0b1000, 0b1000, 0b1000, 0b0100)  // * 0x6c (l)
storeCharacter(109, 0b0000, 0b1110, 0b1110, 0b1010)  // 0x6d (m)
storeCharacter(110, 0b0000, 0b1100, 0b1010, 0b1010)  // 0x6e (n)
storeCharacter(111, 0b0000, 0b0100, 0b1010, 0b0100)  // * 0x6f (o)
storeCharacter(112, 0b0000, 0b1110, 0b1110, 0b1000)  // 0x70 (p)
storeCharacter(113, 0b0000, 0b1110, 0b1110, 0b0010)  // 0x71 (q)
storeCharacter(114, 0b0000, 0b1110, 0b1000, 0b1000)  // 0x72 (r)
storeCharacter(115, 0b0000, 0b0110, 0b0100, 0b1100)  // 0x73 (s)
storeCharacter(116, 0b0100, 0b1110, 0b0100, 0b0010)  // 0x74 (t)
storeCharacter(117, 0b0000, 0b1010, 0b1010, 0b0110)  // 0x75 (u)
storeCharacter(118, 0b0000, 0b1010, 0b1010, 0b0100)  // 0x76 (v)
storeCharacter(119, 0b0000, 0b1010, 0b1110, 0b1110)  // 0x77 (w)
storeCharacter(120, 0b0000, 0b1010, 0b0100, 0b1010)  // 0x78 (x)
storeCharacter(121, 0b0000, 0b1010, 0b0100, 0b0100)  // 0x79 (y)
storeCharacter(122, 0b0000, 0b1100, 0b0100, 0b0110)  // 0x7a (z)
storeCharacter(123, 0b0100, 0b0100, 0b1000, 0b0100)  // 0x7b (braceleft)
storeCharacter(124, 0b1000, 0b1000, 0b1000, 0b1000)  // 0x7c (bar)
storeCharacter(125, 0b1000, 0b1000, 0b0100, 0b1000)  // 0x7d (braceright)
storeCharacter(126, 0b0010, 0b1110, 0b1000, 0b0000)  // 0x7e (asciitilde)


// Other user-defined custom characters

// ASCII 63 is the question mark - here's an alternative from the 
// Sinclair ZX81 font, stored in custom slot 30
storeCharacter(30,
  0b00000000,
  0b00111100,
  0b01000010,
  0b00000100
)

// This demonstrates copying the character, altering it, then storing it in the 
// next slot. You could use this for programmatic animation.
fetchCharacter(30)
character[3] = 0b00001000
storeCharacter2(31)
