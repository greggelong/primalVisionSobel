let video;
let numSpots = 20;
let edgeThreshold = 20; // Tweak: higher = fewer, stronger edges only

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  var constraints = {
    audio: false,
    video: {
      //facingMode: { exact: "environment" },
    },
  };
  video = createCapture(VIDEO, constraints);
  video.size(320, 240);
  video.hide();
}

function draw() {
  background(0);
  image(video, 0, 0, width, height);
  video.loadPixels();

  const vw = video.width;
  const vh = video.height;
  const px = video.pixels;

  // Precompute grayscale for speed
  let gray = new Uint8Array(vw * vh);
  for (let i = 0; i < vw * vh; i++) {
    let base = i * 4;
    gray[i] = (px[base] + px[base + 1] + px[base + 2]) / 3;
  }

  let edgeSpots = [];

  // Sobel edge detection — skip 1px border
  for (let y = 1; y < vh - 1; y++) {
    for (let x = 1; x < vw - 1; x++) {
      // Sobel X kernel
      let gx =
        -gray[(y - 1) * vw + (x - 1)] +
        gray[(y - 1) * vw + (x + 1)] +
        -2 * gray[y * vw + (x - 1)] +
        2 * gray[y * vw + (x + 1)] +
        -gray[(y + 1) * vw + (x - 1)] +
        gray[(y + 1) * vw + (x + 1)];

      // Sobel Y kernel
      let gy =
        -gray[(y - 1) * vw + (x - 1)] +
        -2 * gray[(y - 1) * vw + x] +
        -gray[(y - 1) * vw + (x + 1)] +
        gray[(y + 1) * vw + (x - 1)] +
        2 * gray[(y + 1) * vw + x] +
        gray[(y + 1) * vw + (x + 1)];

      // Magnitude (approximate, avoids sqrt for speed)
      let magnitude = Math.abs(gx) + Math.abs(gy);

      if (magnitude > edgeThreshold) {
        let scaledX = map(x, 0, vw, 0, width);
        let scaledY = map(y, 0, vh, 0, height);
        edgeSpots.push({ x: scaledX, y: scaledY, strength: magnitude });
      }
    }
  }

  // Sort by edge strength descending, take top N
  edgeSpots.sort((a, b) => b.strength - a.strength);
  let topSpots = edgeSpots.slice(0, min(numSpots, edgeSpots.length));

  // Draw connecting lines
  stroke(255);
  strokeWeight(2);
  noFill();
  for (let i = 0; i < topSpots.length; i++) {
    for (let j = i + 1; j < topSpots.length; j++) {
      line(topSpots[i].x, topSpots[i].y, topSpots[j].x, topSpots[j].y);
    }
  }

  // Draw boxes at edge spots
  stroke(255, 255, 0);
  strokeWeight(4);
  noFill();
  for (let pt of topSpots) {
    rect(pt.x - 5, pt.y - 5, 100, 50);
  }
}
