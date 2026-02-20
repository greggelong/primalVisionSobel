let video;
let cols = 8; // Number of horizontal grid cells
let rows = 6; // Number of vertical grid cells
let edgeThreshold = 40;
let connectionMax = 150; // Distance for "neighbor" lines

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  // Setup video capture
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
}

function draw() {
  background(0);

  // 1. Draw the base video
  image(video, 0, 0, width, height);
  video.loadPixels();

  const vw = video.width;
  const vh = video.height;
  const px = video.pixels;

  // 2. Grayscale Pass (Essential for Sobel math)
  let gray = new Uint8Array(vw * vh);
  for (let i = 0; i < vw * vh; i++) {
    let b = i * 4;
    gray[i] = (px[b] + px[b + 1] + px[b + 2]) / 3;
  }

  // 3. Grid-Based Edge Detection
  let gridSpots = [];
  let cellW = vw / cols;
  let cellH = vh / rows;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      let bestX = 0,
        bestY = 0,
        maxMag = 0;

      for (let y = floor(r * cellH) + 1; y < (r + 1) * cellH - 1; y++) {
        for (let x = floor(c * cellW) + 1; x < (c + 1) * cellW - 1; x++) {
          // Sobel Kernels
          let gx =
            -gray[(y - 1) * vw + (x - 1)] +
            gray[(y - 1) * vw + (x + 1)] +
            -2 * gray[y * vw + (x - 1)] +
            2 * gray[y * vw + (x + 1)] +
            -gray[(y + 1) * vw + (x - 1)] +
            gray[(y + 1) * vw + (x + 1)];
          let gy =
            -gray[(y - 1) * vw + (x - 1)] -
            2 * gray[(y - 1) * vw + x] -
            gray[(y - 1) * vw + (x + 1)] +
            gray[(y + 1) * vw + (x - 1)] +
            2 * gray[(y + 1) * vw + x] +
            gray[(y + 1) * vw + (x + 1)];

          let magnitude = abs(gx) + abs(gy);
          if (magnitude > maxMag && magnitude > edgeThreshold) {
            maxMag = magnitude;
            bestX = x;
            bestY = y;
          }
        }
      }

      if (maxMag > 0) {
        gridSpots.push({
          x: map(bestX, 0, vw, 0, width),
          y: map(bestY, 0, vh, 0, height),
          id: c + "-" + r,
          strength: maxMag,
        });
      }
    }
  }

  // 4. Draw the Constellation
  // Using ADD blend mode makes colors "glow" by adding light values
  blendMode(ADD);

  let pulse = map(sin(frameCount * 0.1), -1, 1, 0.7, 1.0);

  for (let i = 0; i < gridSpots.length; i++) {
    let pA = gridSpots[i];

    for (let j = i + 1; j < gridSpots.length; j++) {
      let pB = gridSpots[j];
      let d = dist(pA.x, pA.y, pB.x, pB.y);

      // Logic: Connect close neighbors OR a few random long-distance bridges
      let isNeighbor = d < connectionMax;
      let isLongBridge = d > 400 && (i + j) % 37 == 0;

      if (isNeighbor || isLongBridge) {
        let alpha = isLongBridge ? 70 : map(d, 0, connectionMax, 200, 30);

        // Glow Layer
        stroke(255, 0, 255, alpha * pulse * 0.5);
        strokeWeight(isLongBridge ? 1 : 4);
        line(pA.x, pA.y, pB.x, pB.y);

        // Core Filament Layer
        stroke(0, 255, 255, alpha * pulse);
        strokeWeight(isLongBridge ? 0.5 : 1.5);
        line(pA.x, pA.y, pB.x, pB.y);
      }
    }

    // Node Point (the "Star")
    noStroke();
    fill(255, 0, 255, 120 * pulse);
    ellipse(pA.x, pA.y, 10, 10); // Halo
    fill(255);
    ellipse(pA.x, pA.y, 4, 4); // Core
  }

  // Switch back to normal blending for text clarity
  blendMode(BLEND);

  // 5. Draw Labels
  for (let pt of gridSpots) {
    drawLabel(`BIO_SIG:${pt.id}`, pt.x + 10, pt.y);
  }
}

// Utility for high-contrast text labels
function drawLabel(txt, x, y) {
  textFont("monospace");
  textSize(11);
  textStyle(BOLD);

  // Black stroke/shadow
  fill(0);
  text(txt, x + 1, y + 1);

  // Cyan main text
  fill(0, 255, 255);
  text(txt, x, y);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
