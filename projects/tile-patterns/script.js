const TILE_SIZE = 32;
const SPRITE_ROTATIONS = 4;

const SPRITE_SET_NAMES = ["band", "fill", "merge"];

const CHANGE_INTERVAL = 5;
const REVEAL_INTERVAL = 1;
const REVEAL_TILES_PER_FRAME = 30;

const NORMAL_PATTERN = 0;

const START_HELP_FRAMES = 240;
const NAME_SHOW_FRAMES = 90;

const RESET_ZONE_WIDTH = 220;
const RESET_ZONE_HEIGHT = 55;

const MENU_X = 12;
const MENU_Y = 12;
const MENU_BUTTON_SIZE = 36;
const MENU_ITEM_WIDTH = 140;
const MENU_ITEM_HEIGHT = 30;
const MENU_GAP = 6;

const PICKER_X_OFFSET = 85;
const PICKER_SIZE = 28;

let currentPattern = NORMAL_PATTERN;
let currentSpriteSet = 0;

let lastPatternChangeFrame = 0;
let lastSpriteSetChangeFrame = 0;

let menuOpen = false;

let lightPicker;
let darkPicker;

let recolorCache = {};

let rows, cols;
let extraSpaceX, extraSpaceY;
let xPad, yPad;

let rotationPos = [];
let displayPos = [];
let patterns = [];
let patternNames = [];

let spr = {};

function preload() {
  for (let setName of SPRITE_SET_NAMES) {
    spr[setName] = [];

    for (let i = 0; i < SPRITE_ROTATIONS; i++) {
      spr[setName][i] = loadImage(`${setName}_${i}.png`);
      spr[setName][i].recolorId = `${setName}_${i}`;
    }
  }
}

function setup() {
  const stage = document.getElementById("p5-stage");
  const canvas = createCanvas(stage.clientWidth, stage.clientHeight);
  canvas.parent("p5-stage");

  noSmooth();
  textAlign(CENTER, CENTER);

  if (typeof loadProjectMeta === "function") {
    loadProjectMeta();
  }

  setupColourPickers();
  recalcGrid();

  lastPatternChangeFrame = frameCount;
  lastSpriteSetChangeFrame = frameCount;
}

function setupColourPickers() {
  lightPicker = createColorPicker("#4cc9ff");
  darkPicker  = createColorPicker("#C0E3F5");
  clearRecolorCache();

  lightPicker.size(PICKER_SIZE, PICKER_SIZE);
  darkPicker.size(PICKER_SIZE, PICKER_SIZE);

  lightPicker.input(clearRecolorCache);
  darkPicker.input(clearRecolorCache);

  updatePickerPositions();
  hideColourPickers();
}

function updatePickerPositions() {
  let pickerX = MENU_X + PICKER_X_OFFSET;
  let lightY = MENU_Y + MENU_BUTTON_SIZE + MENU_GAP + 3 * (MENU_ITEM_HEIGHT + MENU_GAP) + 12;
  let darkY = lightY + MENU_ITEM_HEIGHT + MENU_GAP;

  lightPicker.position(pickerX, lightY);
  darkPicker.position(pickerX, darkY);
}

function showColourPickers() {
  lightPicker.show();
  darkPicker.show();
}

function hideColourPickers() {
  lightPicker.hide();
  darkPicker.hide();
}

function clearRecolorCache() {
  recolorCache = {};
}

function windowResized() {
  const stage = document.getElementById("p5-stage");
  resizeCanvas(stage.clientWidth, stage.clientHeight);

  noSmooth();
  recalcGrid();
  updatePickerPositions();
}

function draw() {
  background(0);

  let targetPattern = patterns[currentPattern];
  slowlyMoveToward(targetPattern);

  if (currentPattern === NORMAL_PATTERN) {
    updateRandomTile();
  }

  drawTiles();
  drawBorders();
  drawHelpOverlay();
  drawPatternName();
  drawSpriteSetName();
  drawSpriteMenu();
}

function recalcGrid() {
  extraSpaceX = width % TILE_SIZE;
  extraSpaceY = height % TILE_SIZE;

  xPad = floor(extraSpaceX / 2);
  yPad = floor(extraSpaceY / 2);

  cols = floor((width - extraSpaceX) / TILE_SIZE);
  rows = floor((height - extraSpaceY) / TILE_SIZE);

  rotationPos = createGrid();
  displayPos = createGrid();

  setupRandomRotations();
  copyGrid(rotationPos, displayPos);

  patterns = [
    rotationPos,
    createStarPattern(),
    createDiagonalStripesPattern(),
    createConcentricCirclesPattern(),
    createCheckerSpinPattern(),
    createHorizontalWavesPattern(),
    createVerticalWavesPattern(),
    createSpiralPattern(),
    createDiamondPattern(),
    createNoisePattern(),
    createStableBlocksPattern(),
    createRadialSpokesPattern()
  ];

  patternNames = [
    "Normal",
    "Star",
    "Diagonal Stripes",
    "Concentric Circles",
    "Checker Spin",
    "Horizontal Waves",
    "Vertical Waves",
    "Spiral",
    "Diamond",
    "Noise",
    "Stable Blocks",
    "Radial Spokes"
  ];

  currentPattern = NORMAL_PATTERN;
}

function createGrid() {
  let grid = [];

  for (let row = 0; row < rows; row++) {
    grid[row] = [];

    for (let col = 0; col < cols; col++) {
      grid[row][col] = 0;
    }
  }

  return grid;
}

function setupRandomRotations() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      rotationPos[row][col] = floor(random(SPRITE_ROTATIONS));
    }
  }
}

function createStarPattern() {
  let grid = createGrid();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (row % 2 === 0) {
        grid[row][col] = col % 2 === 0 ? 0 : 2;
      } else {
        grid[row][col] = col % 2 === 0 ? 1 : 3;
      }
    }
  }

  return grid;
}

function createDiagonalStripesPattern() {
  let grid = createGrid();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      grid[row][col] = positiveModulo(row - col, SPRITE_ROTATIONS);
    }
  }

  return grid;
}

function createConcentricCirclesPattern() {
  let grid = createGrid();
  let centerRow = rows / 2;
  let centerCol = cols / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let d = floor(dist(row, col, centerRow, centerCol));
      grid[row][col] = d % SPRITE_ROTATIONS;
    }
  }

  return grid;
}

function createCheckerSpinPattern() {
  let grid = createGrid();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      grid[row][col] = row % 2 === 0
        ? col % SPRITE_ROTATIONS
        : (col + 2) % SPRITE_ROTATIONS;
    }
  }

  return grid;
}

function createHorizontalWavesPattern() {
  let grid = createGrid();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      grid[row][col] = floor((sin(row * 0.5) + 1) * 2) % SPRITE_ROTATIONS;
    }
  }

  return grid;
}

function createVerticalWavesPattern() {
  let grid = createGrid();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      grid[row][col] = floor((sin(col * 0.5) + 1) * 2) % SPRITE_ROTATIONS;
    }
  }

  return grid;
}

function createSpiralPattern() {
  let grid = createGrid();
  let centerRow = rows / 2;
  let centerCol = cols / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let angle = atan2(row - centerRow, col - centerCol);
      let d = dist(row, col, centerRow, centerCol);

      grid[row][col] = positiveModulo(floor(angle + d * 0.3), SPRITE_ROTATIONS);
    }
  }

  return grid;
}

function createDiamondPattern() {
  let grid = createGrid();
  let centerRow = rows / 2;
  let centerCol = cols / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let d = floor(abs(row - centerRow) + abs(col - centerCol));
      grid[row][col] = d % SPRITE_ROTATIONS;
    }
  }

  return grid;
}

function createNoisePattern() {
  let grid = createGrid();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      grid[row][col] = floor(noise(row * 0.1, col * 0.1) * SPRITE_ROTATIONS);
    }
  }

  return grid;
}

function createStableBlocksPattern() {
  let grid = createGrid();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      grid[row][col] = (floor(row / 3) + floor(col / 3)) % SPRITE_ROTATIONS;
    }
  }

  return grid;
}

function createRadialSpokesPattern() {
  let grid = createGrid();
  let centerRow = rows / 2;
  let centerCol = cols / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let angle = atan2(row - centerRow, col - centerCol);
      let normalisedAngle = (angle + PI) / TWO_PI;

      grid[row][col] = floor(normalisedAngle * SPRITE_ROTATIONS) % SPRITE_ROTATIONS;
    }
  }

  return grid;
}

function updateRandomTile() {
  if (frameCount % CHANGE_INTERVAL === 0) {
    let row = floor(random(rows));
    let col = floor(random(cols));

    let change = floor(random(1, 3));
    rotationPos[row][col] = (rotationPos[row][col] + change) % SPRITE_ROTATIONS;
  }
}

function slowlyMoveToward(targetGrid) {
  if (frameCount % REVEAL_INTERVAL === 0) {
    for (let i = 0; i < REVEAL_TILES_PER_FRAME; i++) {
      let row = floor(random(rows));
      let col = floor(random(cols));

      displayPos[row][col] = rotateOneStepToward(
        displayPos[row][col],
        targetGrid[row][col]
      );
    }
  }
}

function rotateOneStepToward(current, target) {
  if (current === target) return current;
  return (current + 1) % SPRITE_ROTATIONS;
}

function drawTiles() {
  let setName = SPRITE_SET_NAMES[currentSpriteSet];
  let lightCol = lightPicker.color();
  let darkCol = darkPicker.color();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let baseImg = spr[setName][displayPos[row][col]];
      let recoloredImg = getRecoloredImage(baseImg, lightCol, darkCol);

      image(
        recoloredImg,
        col * TILE_SIZE + xPad,
        row * TILE_SIZE + yPad,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }
}

function getRecoloredImage(baseImg, lightCol, darkCol) {
  let key = baseImg.recolorId + "-" + lightCol.toString() + "-" + darkCol.toString();

  if (recolorCache[key]) {
    return recolorCache[key];
  }

  let newImg = createImage(baseImg.width, baseImg.height);

  baseImg.loadPixels();
  newImg.loadPixels();

  for (let i = 0; i < baseImg.pixels.length; i += 4) {
    let r = baseImg.pixels[i];
    let g = baseImg.pixels[i + 1];
    let b = baseImg.pixels[i + 2];
    let a = baseImg.pixels[i + 3];

    if (r > 127 && g > 127 && b > 127) {
      newImg.pixels[i] = red(lightCol);
      newImg.pixels[i + 1] = green(lightCol);
      newImg.pixels[i + 2] = blue(lightCol);
    } else {
      newImg.pixels[i] = red(darkCol);
      newImg.pixels[i + 1] = green(darkCol);
      newImg.pixels[i + 2] = blue(darkCol);
    }

    newImg.pixels[i + 3] = a;
  }

  newImg.updatePixels();
  recolorCache[key] = newImg;

  return newImg;
}

function drawBorders() {
  noStroke();
  fill(0);

  rect(0, 0, width, yPad);
  rect(0, height - yPad, width, yPad);
  rect(0, 0, xPad, height);
  rect(width - xPad, 0, xPad, height);
}

function drawHelpOverlay() {
  if (frameCount > START_HELP_FRAMES) return;

  let alpha = map(frameCount, 0, START_HELP_FRAMES, 170, 0);

  noStroke();

  fill(255, alpha * 0.35);
  rect(0, 0, width / 2, height);

  fill(255, alpha * 0.2);
  rect(width / 2, 0, width / 2, height);

  fill(255, alpha * 0.5);
  rect(
    width / 2 - RESET_ZONE_WIDTH / 2,
    0,
    RESET_ZONE_WIDTH,
    RESET_ZONE_HEIGHT
  );

  fill(255, alpha);
  textSize(24);
  text("Previous Pattern", width * 0.25, height / 2);
  text("Next Pattern", width * 0.75, height / 2);

  textSize(18);
  text("Reset", width / 2, RESET_ZONE_HEIGHT / 2);

  textSize(14);
  text("Open menu", MENU_X + 75, MENU_Y + MENU_BUTTON_SIZE / 2);
}

function drawPatternName() {
  let age = frameCount - lastPatternChangeFrame;
  if (age > NAME_SHOW_FRAMES) return;

  let alpha = map(age, 0, NAME_SHOW_FRAMES, 255, 0);

  noStroke();
  fill(0, alpha * 0.65);
  rect(width / 2 - 190, height - 80, 380, 50, 12);

  fill(255, alpha);
  textSize(22);
  text(patternNames[currentPattern], width / 2, height - 55);
}

function drawSpriteSetName() {
  let age = frameCount - lastSpriteSetChangeFrame;
  if (age > NAME_SHOW_FRAMES) return;

  let alpha = map(age, 0, NAME_SHOW_FRAMES, 255, 0);
  let setName = SPRITE_SET_NAMES[currentSpriteSet];

  noStroke();
  fill(0, alpha * 0.65);
  rect(width / 2 - 140, height - 135, 280, 42, 10);

  fill(255, alpha);
  textSize(18);
  text(`Sprite: ${setName}`, width / 2, height - 114);
}

function drawSpriteMenu() {
  push();

  noStroke();
  fill(0, 180);
  rect(MENU_X, MENU_Y, MENU_BUTTON_SIZE, MENU_BUTTON_SIZE, 8);

  stroke(255);
  strokeWeight(2);
  noFill();
  rect(MENU_X, MENU_Y, MENU_BUTTON_SIZE, MENU_BUTTON_SIZE, 8);

  noStroke();
  fill(255);
  textSize(20);
  text(menuOpen ? "×" : "☰", MENU_X + MENU_BUTTON_SIZE / 2, MENU_Y + MENU_BUTTON_SIZE / 2);

  if (menuOpen) {
    showColourPickers();

    let panelX = MENU_X;
    let panelY = MENU_Y + MENU_BUTTON_SIZE + MENU_GAP;
    let spriteSectionHeight = SPRITE_SET_NAMES.length * (MENU_ITEM_HEIGHT + MENU_GAP);
    let colourSectionHeight = 2 * (MENU_ITEM_HEIGHT + MENU_GAP) + MENU_GAP;
    let panelHeight = spriteSectionHeight + colourSectionHeight + MENU_GAP * 3;

    noStroke();
    fill(0, 210);
    rect(panelX, panelY, MENU_ITEM_WIDTH, panelHeight, 10);

    for (let i = 0; i < SPRITE_SET_NAMES.length; i++) {
      let itemX = panelX + MENU_GAP;
      let itemY = panelY + MENU_GAP + i * (MENU_ITEM_HEIGHT + MENU_GAP);

      fill(i === currentSpriteSet ? 255 : 255, i === currentSpriteSet ? 70 : 25);
      rect(itemX, itemY, MENU_ITEM_WIDTH - MENU_GAP * 2, MENU_ITEM_HEIGHT, 7);

      fill(255);
      textSize(14);
      text(
        SPRITE_SET_NAMES[i],
        itemX + (MENU_ITEM_WIDTH - MENU_GAP * 2) / 2,
        itemY + MENU_ITEM_HEIGHT / 2
      );
    }

    let colourLabelX = panelX + MENU_GAP + 8;
    let colourY = panelY + MENU_GAP + spriteSectionHeight + MENU_GAP;

    fill(255);
    textAlign(LEFT, CENTER);
    textSize(13);
    text("Light", colourLabelX, colourY + MENU_ITEM_HEIGHT / 2);
    text("Dark", colourLabelX, colourY + MENU_ITEM_HEIGHT + MENU_GAP + MENU_ITEM_HEIGHT / 2);
  } else {
    hideColourPickers();
  }

  pop();
}

function mousePressed() {
  if (mouseInSpriteMenu()) {
    return;
  }

  if (
    mouseY <= RESET_ZONE_HEIGHT &&
    mouseX >= width / 2 - RESET_ZONE_WIDTH / 2 &&
    mouseX <= width / 2 + RESET_ZONE_WIDTH / 2
  ) {
    resetNormalPattern();
    return;
  }

  if (mouseX < width / 2) {
    previousPattern();
  } else {
    nextPattern();
  }
}

function mouseInSpriteMenu() {
  if (mouseInRect(MENU_X, MENU_Y, MENU_BUTTON_SIZE, MENU_BUTTON_SIZE)) {
    menuOpen = !menuOpen;

    if (menuOpen) {
      showColourPickers();
    } else {
      hideColourPickers();
    }

    return true;
  }

  if (!menuOpen) {
    return false;
  }

  let panelX = MENU_X;
  let panelY = MENU_Y + MENU_BUTTON_SIZE + MENU_GAP;
  let panelHeight =
    SPRITE_SET_NAMES.length * (MENU_ITEM_HEIGHT + MENU_GAP) +
    2 * (MENU_ITEM_HEIGHT + MENU_GAP) +
    MENU_GAP * 4;

  for (let i = 0; i < SPRITE_SET_NAMES.length; i++) {
    let itemX = panelX + MENU_GAP;
    let itemY = panelY + MENU_GAP + i * (MENU_ITEM_HEIGHT + MENU_GAP);
    let itemW = MENU_ITEM_WIDTH - MENU_GAP * 2;

    if (mouseInRect(itemX, itemY, itemW, MENU_ITEM_HEIGHT)) {
      currentSpriteSet = i;
      lastSpriteSetChangeFrame = frameCount;
      return true;
    }
  }

  // Only block clicks if they are actually inside the menu panel
  if (mouseInRect(panelX, panelY, MENU_ITEM_WIDTH, panelHeight)) {
    return true;
  }

  return false;
}

function nextPattern() {
  currentPattern = (currentPattern + 1) % patterns.length;
  lastPatternChangeFrame = frameCount;
}

function previousPattern() {
  currentPattern--;

  if (currentPattern < 0) {
    currentPattern = patterns.length - 1;
  }

  lastPatternChangeFrame = frameCount;
}

function resetNormalPattern() {
  currentPattern = NORMAL_PATTERN;
  setupRandomRotations();
  copyGrid(rotationPos, displayPos);
  lastPatternChangeFrame = frameCount;
}

function copyGrid(from, to) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      to[row][col] = from[row][col];
    }
  }
}

function mouseInRect(x, y, w, h) {
  return mouseX >= x &&
         mouseX <= x + w &&
         mouseY >= y &&
         mouseY <= y + h;
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}