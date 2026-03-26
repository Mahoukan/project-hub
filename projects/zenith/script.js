// ─── GLOBAL STATE ────────────────────────────────────────────────────────────
let menu1Pos, menu2Pos, menuSize, text1Pos, text2Pos, barSize;
let touchJustReleased = false;
let muteButtonBounds = null;

let helpScroll = 0;
let helpMaxScroll = 0;
let isDraggingHelp = false;
let lastTouchY = 0;

const STATE_START = 0;
const MENU = 1;
const GAME = 2;
const STATE_HELP = 3;
const GAME_OVER = 4;

let enemiesKilled = 0;
let levelsGained = 0;
let gameState = STATE_START;

const options1 = ["Move speed", "Fire speed", "Damage", "Health", "Shield"];
const options2 = ["Explosion", "Sniper bullet", "Multi-shot", "EMP Pulse"];

let options1Lvl = [0, 0, 0, 0, 0];
let options2Lvl = [0, 0, 0, 0];
let chosenOption1, chosenOption2;

let textMaxWidth, smallestSize;

// ─── PLAYER, ENEMIES, BULLETS ───────────────────────────────────────────────
let player;
let playerFrames = [];

let enemies = [];
let enemyFrames = {
  normal: [],
  sprinter: [],
  splitter: [],
  tank: [],
};

let bullets = [];
let bulletFrames = [];

let enemyBullets = [];

// ─── ABILITIES ──────────────────────────────────────────────────────────────
let lastExplosionTime = 0;
let lastSniperTime = 0;
let lastMultiTime = 0;
let lastEMPTime = 0;

let sniperActive = false;
let empActive = false;

let sniperStartTime = 0;
let empStartTime = 0;

// ─── BACKGROUND ────────────────────────────────────────────────────

let bgTiles = [];
let bgTile = null;
let bgOffsetX = 0;
let bgOffsetY = 0;
const bgScrollSpeed = 0.45;
const backgroundCount = 31;

// ─── SPAWNING & SHOOTING ────────────────────────────────────────────────────
let lastSpawnTime = 0;
let spawnInterval = 1700;
const spawnRateDecrease = 40;
const spawnRampEvery = 7000;
const minSpawnInterval = 420;
let lastSpawnRampTime = 0;

let lastShotTime = 0;
let shootDelay = 1000;
let bulletDamage = 1.0;

// ─── SCREEN FX ──────────────────────────────────────────────────────────────
let screenShake = 0;
let screenShakeDecay = 0.88;

// ─── UPGRADE MEMORY ─────────────────────────────────────────────────────────
let lastChosen1 = -1;
let lastChosen2 = -1;

const option1Descriptions = {
  "Move speed": "Move faster and reposition more easily.",
  "Fire speed": "Shoot more often.",
  Damage: "Each bullet hits harder.",
  Health: "Increase max health and fully heal.",
  Shield: "Adds a regenerating shield layer.",
};

const option2Descriptions = {
  Explosion: "Clear enemies and bullets instantly.",
  "Sniper bullet": "Shots pierce through enemies for a short time.",
  "Multi-shot": "Fire bullets in all directions.",
  "EMP Pulse": "Freeze enemy movement briefly.",
};

// ─── AUDIO ─────────────────────────────────────────────────────────

let menuMusic;
let gameMusic;
let gameOverMusic;

let currentMusic = null;
let musicMuted = false;

let masterVolume = 0.5;
let musicVolume = 0.6;

let showAudioPanel = false;
let audioPanelBounds = null;

let settingsButtonBounds = null;

let draggingSlider = null;
let sliderMaster = null;
let sliderMusic = null;
let sliderSfx;

let sfxVolume = 0.75;
let uiVolume = 0.7;

let sounds = {};
let soundCooldowns = {};

// ─── SETUP / LAYOUT ─────────────────────────────────────────────────────────
function preload() {
  for (let i = 0; i <= 60; i++) {
    const num = i.toString().padStart(2, "0");

    playerFrames.push(loadImage(`./assets/player/player_${num}.png`));
    bulletFrames.push(loadImage(`./assets/bullets/bullet_${num}.png`));

    enemyFrames.normal.push(
      loadImage(`./assets/enemies/normal/enemy_normal_${num}.png`),
    );

    enemyFrames.sprinter.push(
      loadImage(`./assets/enemies/sprinter/enemy_sprinter_${num}.png`),
    );

    enemyFrames.splitter.push(
      loadImage(`./assets/enemies/splitter/enemy_splitter_${num}.png`),
    );
  }

  for (let i = 0; i <= 90; i++) {
    const num = i.toString().padStart(2, "0");

    enemyFrames.tank.push(
      loadImage(`./assets/enemies/tank/enemy_tank_${num}.png`),
    );
  }

  menuMusic = loadSound("./assets/audio/menu.ogg");
  gameMusic = loadSound("./assets/audio/game.ogg");
  gameOverMusic = loadSound("./assets/audio/gameover.ogg");

  sounds.sniper = loadSound("./assets/audio/sniper.ogg");
  sounds.shield = loadSound("./assets/audio/shield.ogg");
  sounds.playerDeath = loadSound("./assets/audio/playerdeath.ogg");
  sounds.multiShot = loadSound("./assets/audio/multishot.ogg");
  sounds.levelUp = loadSound("./assets/audio/levelup.ogg");
  sounds.fire = loadSound("./assets/audio/fire.ogg");
  sounds.explosion = loadSound("./assets/audio/explosion.ogg");
  sounds.enemyDeath = loadSound("./assets/audio/enemydeath.ogg");
  sounds.emp = loadSound("./assets/audio/emp.ogg");
  sounds.boost = loadSound("./assets/audio/boost.ogg");
  sounds.hit = loadSound("./assets/audio/hit.ogg");
  sounds.enemyHit = loadSound("./assets/audio/enemyhit.ogg");
  sounds.enemySpawn = loadSound("./assets/audio/enemyspawn.ogg");
  sounds.upgradeOpen = loadSound("./assets/audio/upgradeopen.ogg");
  sounds.click = loadSound("./assets/audio/click.ogg");
  sounds.shieldBreak = loadSound("./assets/audio/shieldbreak.ogg");
  sounds.enemyShoot = loadSound("./assets/audio/fire.ogg");

  for (let i = 0; i < backgroundCount; i++) {
    const num = i.toString().padStart(2, "0");
    bgTiles.push(loadImage(`./assets/backgrounds/background_${num}.png`));
  }
}

function drawAudioPanel() {
  const w = min(340, width * 0.3);
  const h = 220;
  const x = width - w - 14;
  const y = height - h - 70;

  audioPanelBounds = { x, y, w, h };

  drawPanel(x, y, w, h, 16);

  push();
  fill(255);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(15);
  text("Audio", x + 16, y + 18);

  fill(180);
  textSize(11);
  text("Adjust music and game sound levels", x + 16, y + 36);
  pop();

  sliderMaster = drawSlider(x + 18, y + 62, w - 36, 10, "Master", masterVolume);

  sliderMusic = drawSlider(x + 18, y + 112, w - 36, 10, "Music", musicVolume);

  sliderSfx = drawSlider(x + 18, y + 162, w - 36, 10, "SFX", sfxVolume);
}

function drawMuteButton() {
  const w = 58;
  const h = 42;
  const x = width - w - 14;
  const y = height - h - 14;

  muteButtonBounds = { x, y, w, h };

  push();
  noStroke();
  fill(10, 14, 20, 185);
  rect(x, y, w, h, 12);

  stroke(255, 255, 255, 38);
  noFill();
  rect(x, y, w, h, 12);

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(13);
  text(musicMuted ? "Sound" : "Mute", x + w / 2, y + h / 2);
  pop();

  const sw = 58;
  const sh = 42;
  const sx = x;
  const sy = y - sh - 8;

  settingsButtonBounds = { x: sx, y: sy, w: sw, h: sh };

  push();
  noStroke();
  fill(10, 14, 20, 185);
  rect(sx, sy, sw, sh, 12);

  stroke(255, 255, 255, 38);
  noFill();
  rect(sx, sy, sw, sh, 12);

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(13);
  text("Audio", sx + sw / 2, sy + sh / 2);
  pop();
}

function getCanvasHost() {
  return document.getElementById("canvas");
}

function recalcLayout() {
  const temp1 = width / 20;
  const temp2 = height / 3;

  menu1Pos = createVector(temp1, temp2);
  menuSize = createVector(temp1 * 8, temp2);
  menu2Pos = createVector(menu1Pos.x + menuSize.x + temp1 * 2, temp2);

  text1Pos = createVector(
    menu1Pos.x + menuSize.x / 2,
    menu1Pos.y + menu1Pos.y / 3,
  );
  text2Pos = createVector(
    menu2Pos.x + menuSize.x / 2,
    menu2Pos.y + menu2Pos.y / 3,
  );

  textMaxWidth = menuSize.y * 0.9;
  smallestSize = 100;

  for (const s of options1) {
    smallestSize = min(smallestSize, sizeForWidth(s, textMaxWidth, 20));
  }
  for (const s of options2) {
    smallestSize = min(smallestSize, sizeForWidth(s, textMaxWidth, 20));
  }

  barSize = createVector(width / 5, height / 24);

  if (player) {
    player.position.x = constrain(
      player.position.x,
      player.halfSize,
      width - player.halfSize,
    );
    player.position.y = constrain(
      player.position.y,
      player.halfSize,
      height - player.halfSize,
    );
  }
}

function chooseBackground() {
  if (bgTiles.length === 0) {
    bgTile = null;
    return;
  }

  bgTile = random(bgTiles);
  bgOffsetX = 0;
  bgOffsetY = 0;
}

function setup() {
  const canvasHost = getCanvasHost();
  const canvas = createCanvas(canvasHost.clientWidth, canvasHost.clientHeight);
  canvas.parent("canvas");
  pixelDensity(1);

  textAlign(CENTER, CENTER);
  textFont("sans-serif");

  chooseOptions();
  player = new Player(createVector(width / 2, height / 2), 64, 10, 5);

  for (const img of bulletFrames) {
    if (img.width > 64 || img.height > 64) {
      img.resize(64, 64);
    }
  }

  recalcLayout();
  resetRunTimers();
  configureAudio();
  chooseBackground();
}

function configureAudio() {
  if (menuMusic) menuMusic.setVolume(masterVolume * musicVolume);
  if (gameMusic) gameMusic.setVolume(masterVolume * musicVolume);
  if (gameOverMusic) gameOverMusic.setVolume(masterVolume * musicVolume);

  for (const key in sounds) {
    const s = sounds[key];
    if (!s) continue;

    // reuse same object safely
    try {
      s.playMode("restart");
    } catch (e) {
      // ignore if not supported in current build
    }
  }
}

function refreshMusicVolume() {
  if (currentMusic) {
    currentMusic.setVolume(masterVolume * musicVolume);
  }
}

function windowResized() {
  const canvasHost = getCanvasHost();
  resizeCanvas(canvasHost.clientWidth, canvasHost.clientHeight);
  recalcLayout();
}

function resetRunTimers() {
  lastSpawnTime = millis();
  lastSpawnRampTime = millis();
  lastShotTime = millis();

  lastExplosionTime = 0;
  lastSniperTime = 0;
  lastMultiTime = 0;
  lastEMPTime = 0;

  sniperActive = false;
  empActive = false;
  sniperStartTime = 0;
  empStartTime = 0;

  screenShake = 0;
}

function playMusic(track) {
  if (musicMuted || !track) return;
  if (currentMusic === track && track.isPlaying()) return;

  if (currentMusic && currentMusic.isPlaying()) {
    currentMusic.stop();
  }

  currentMusic = track;
  currentMusic.setVolume(masterVolume * musicVolume);
  currentMusic.loop();
}

function stopMusic() {
  if (currentMusic && currentMusic.isPlaying()) {
    currentMusic.stop();
  }
  currentMusic = null;
}

function updateMusic() {
  if (musicMuted) return;

  if (gameState === STATE_START || gameState === STATE_HELP) {
    playMusic(menuMusic);
  } else if (gameState === MENU || gameState === GAME) {
    playMusic(gameMusic);
  } else if (gameState === GAME_OVER) {
    playMusic(gameOverMusic);
  }
}

function updateBackgroundScroll() {
  let dx = 0;
  let dy = 0;

  if (keyIsDown(87) || keyIsDown(UP_ARROW)) dy -= bgScrollSpeed;
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) dy += bgScrollSpeed;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) dx -= bgScrollSpeed;
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) dx += bgScrollSpeed;

  bgOffsetX += dx;
  bgOffsetY += dy;

  if (bgTile) {
    bgOffsetX = ((bgOffsetX % bgTile.width) + bgTile.width) % bgTile.width;
    bgOffsetY = ((bgOffsetY % bgTile.height) + bgTile.height) % bgTile.height;
  }
}

function drawScrollingBackground() {
  background(0);

  if (!bgTile) return;

  const tileW = bgTile.width;
  const tileH = bgTile.height;

  const startX = -bgOffsetX - tileW;
  const startY = -bgOffsetY - tileH;

  for (let x = startX; x < width + tileW; x += tileW) {
    for (let y = startY; y < height + tileH; y += tileH) {
      image(bgTile, Math.round(x), Math.round(y));
    }
  }

  // subtle darkening so gameplay/UI stay readable
  noStroke();
  fill(0, 0, 0, 90);
  rect(0, 0, width, height);
}

// ─── MAIN DRAW LOOP ──────────────────────────────────────────────────────────
function draw() {
  updateBackgroundScroll();
  drawScrollingBackground();

  push();
  applyScreenShake();

  updateMusic();

  push();
  applyScreenShake();

  switch (gameState) {
    case STATE_START:
      drawStartMenu();
      break;
    case MENU:
      drawUpgradeMenu();
      break;
    case GAME:
      gameDraw();
      break;
    case STATE_HELP:
      drawHelp();
      break;
    case GAME_OVER:
      drawGameOverScreen();
      break;
  }
  drawMuteButton();
  if (showAudioPanel) {
    drawAudioPanel();
  }
  pop();

  screenShake *= screenShakeDecay;
  if (screenShake < 0.05) screenShake = 0;
  touchJustReleased = false;
}

function applyScreenShake() {
  if (screenShake <= 0) return;
  translate(
    random(-screenShake, screenShake),
    random(-screenShake, screenShake),
  );
}

function addScreenShake(amount) {
  screenShake = max(screenShake, amount);
}

// ─── INPUT ───────────────────────────────────────────────────────────────────

function mouseReleased() {
  userStartAudio();

  if (draggingSlider) {
    draggingSlider = null;
    return;
  }

  if (
    settingsButtonBounds &&
    mouseX > settingsButtonBounds.x &&
    mouseX < settingsButtonBounds.x + settingsButtonBounds.w &&
    mouseY > settingsButtonBounds.y &&
    mouseY < settingsButtonBounds.y + settingsButtonBounds.h
  ) {
    showAudioPanel = !showAudioPanel;
    return;
  }

  if (
    muteButtonBounds &&
    mouseX > muteButtonBounds.x &&
    mouseX < muteButtonBounds.x + muteButtonBounds.w &&
    mouseY > muteButtonBounds.y &&
    mouseY < muteButtonBounds.y + muteButtonBounds.h
  ) {
    musicMuted = !musicMuted;

    if (musicMuted) {
      if (currentMusic) currentMusic.stop();
    } else {
      updateMusic();
    }
    return;
  }

  touchJustReleased = true;
  handleButtonTap(mouseX, mouseY);
}

function touchEnded() {
  userStartAudio();

  if (
    muteButtonBounds &&
    mouseX > muteButtonBounds.x &&
    mouseX < muteButtonBounds.x + muteButtonBounds.w &&
    mouseY > muteButtonBounds.y &&
    mouseY < muteButtonBounds.y + muteButtonBounds.h
  ) {
    musicMuted = !musicMuted;

    if (musicMuted) {
      if (currentMusic) currentMusic.stop();
    } else {
      updateMusic();
    }

    isDraggingHelp = false;
    return false;
  }

  if (
    settingsButtonBounds &&
    mouseX > settingsButtonBounds.x &&
    mouseX < settingsButtonBounds.x + settingsButtonBounds.w &&
    mouseY > settingsButtonBounds.y &&
    mouseY < settingsButtonBounds.y + settingsButtonBounds.h
  ) {
    showAudioPanel = !showAudioPanel;
    isDraggingHelp = false;
    return false;
  }

  isDraggingHelp = false;
  touchJustReleased = true;
  handleButtonTap(mouseX, mouseY);
  return false;
}

function mousePressed() {
  if (!showAudioPanel) return;

  if (sliderMaster && isInsideSlider(sliderMaster)) {
    draggingSlider = "master";
    masterVolume = getSliderValue(sliderMaster);
    refreshMusicVolume();
    return;
  }

  if (sliderMusic && isInsideSlider(sliderMusic)) {
    draggingSlider = "music";
    musicVolume = getSliderValue(sliderMusic);
    refreshMusicVolume();
    return;
  }

  if (sliderSfx && isInsideSlider(sliderSfx)) {
    draggingSlider = "sfx";
    sfxVolume = getSliderValue(sliderSfx);
    return;
  }
}
function mouseDragged() {
  if (!draggingSlider) return;

  if (draggingSlider === "master" && sliderMaster) {
    masterVolume = getSliderValue(sliderMaster);
    refreshMusicVolume();
  } else if (draggingSlider === "music" && sliderMusic) {
    musicVolume = getSliderValue(sliderMusic);
    refreshMusicVolume();
  } else if (draggingSlider === "sfx" && sliderSfx) {
    sfxVolume = getSliderValue(sliderSfx);
  }
}

// ─── START MENU ──────────────────────────────────────────────────────────────
function drawCenteredPanel(x, y, w, h, radius = 18) {
  push();
  rectMode(CORNER);
  noStroke();
  fill(10, 14, 20, 190);
  rect(x, y, w, h, radius);

  stroke(255, 255, 255, 30);
  strokeWeight(1.5);
  noFill();
  rect(x, y, w, h, radius);
  pop();
}

function drawFancyButton(x, y, w, h, label, hovered, accent = null) {
  push();

  noStroke();
  fill(18, 24, 32, hovered ? 230 : 190);
  rect(x, y, w, h, 16);

  if (accent) {
    fill(red(accent), green(accent), blue(accent), hovered ? 150 : 95);
    rect(x + 6, y + 6, w - 12, h - 12, 12);
  } else {
    fill(255, hovered ? 42 : 26);
    rect(x + 6, y + 6, w - 12, h - 12, 12);
  }

  stroke(255, 255, 255, hovered ? 70 : 28);
  strokeWeight(1.5);
  noFill();
  rect(x, y, w, h, 16);

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(min(26, h * 0.3, w * 0.16));
  text(label, x + w / 2, y + h / 2);

  pop();
}

function drawCardTitle(textValue, x, y, w) {
  push();
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(min(26, w * 0.085));
  text(textValue, x + w / 2, y);
  pop();
}

function drawUpgradeIcon(kind, cx, cy, size, col) {
  push();
  translate(cx, cy);
  stroke(col);
  strokeWeight(2.5);
  noFill();

  const s = size * 0.5;

  switch (kind) {
    case "Move speed":
      line(-s * 0.9, 0, s * 0.6, 0);
      line(s * 0.15, -s * 0.35, s * 0.6, 0);
      line(s * 0.15, s * 0.35, s * 0.6, 0);
      break;

    case "Fire speed":
      line(-s * 0.8, 0, s * 0.8, 0);
      circle(0, 0, s * 0.9);
      break;

    case "Damage":
      line(0, -s * 0.9, 0, s * 0.9);
      line(-s * 0.75, 0, s * 0.75, 0);
      break;

    case "Health":
      line(0, -s * 0.8, 0, s * 0.8);
      line(-s * 0.8, 0, s * 0.8, 0);
      break;

    case "Shield":
      beginShape();
      vertex(0, -s);
      vertex(s * 0.75, -s * 0.35);
      vertex(s * 0.55, s * 0.75);
      vertex(0, s);
      vertex(-s * 0.55, s * 0.75);
      vertex(-s * 0.75, -s * 0.35);
      endShape(CLOSE);
      break;

    case "Explosion":
      for (let i = 0; i < 8; i++) {
        const a = (TWO_PI / 8) * i;
        line(cos(a) * s * 0.25, sin(a) * s * 0.25, cos(a) * s, sin(a) * s);
      }
      circle(0, 0, s * 0.5);
      break;

    case "Sniper bullet":
      line(-s * 0.9, 0, s * 0.9, 0);
      line(s * 0.35, -s * 0.3, s * 0.9, 0);
      line(s * 0.35, s * 0.3, s * 0.9, 0);
      break;

    case "Multi-shot":
      line(0, -s * 0.95, 0, s * 0.25);
      line(-s * 0.82, s * 0.5, 0, s * 0.05);
      line(s * 0.82, s * 0.5, 0, s * 0.05);
      break;

    case "EMP Pulse":
      circle(0, 0, s * 1.2);
      circle(0, 0, s * 0.65);
      circle(0, 0, s * 0.2);
      break;

    default:
      circle(0, 0, s);
      break;
  }

  pop();
}

function drawUpgradeCard(
  x,
  y,
  w,
  h,
  title,
  levelText,
  description,
  hovered,
  accentCol,
) {
  push();

  noStroke();
  fill(12, 18, 26, hovered ? 235 : 205);
  rect(x, y, w, h, 18);

  fill(red(accentCol), green(accentCol), blue(accentCol), hovered ? 105 : 70);
  rect(x + 8, y + 8, w - 16, h - 16, 14);

  stroke(255, 255, 255, hovered ? 75 : 30);
  strokeWeight(1.5);
  noFill();
  rect(x, y, w, h, 18);

  drawUpgradeIcon(title, x + w / 2, y + h * 0.2, min(w, h) * 0.16, color(255));

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);

  textSize(min(24, w * 0.09));
  text(title, x + w / 2, y + h * 0.42);

  fill(230);
  textSize(min(18, w * 0.065));
  text(levelText, x + w / 2, y + h * 0.6);

  fill(215);
  textSize(min(14, w * 0.048));
  textAlign(CENTER, TOP);
  text(description, x + 22, y + h * 0.7, w - 44, h * 0.2);

  if (hovered) {
    stroke(red(accentCol), green(accentCol), blue(accentCol), 120);
    strokeWeight(2);
    noFill();
    rect(x - 2, y - 2, w + 4, h + 4, 20);
  }

  pop();
}

function drawStartMenu() {
  textAlign(CENTER, CENTER);

  const titleY = height * 0.23;
  const subtitleY = titleY + 54;

  fill(255);
  textSize(min(72, width * 0.12));
  text("ZENITH", width / 2, titleY);

  fill(180);
  textSize(min(20, width * 0.028));
  text("Survive, level up, and build your loadout", width / 2, subtitleY);

  const panelW = min(width * 0.62, 520);
  const panelH = min(height * 0.34, 260);
  const panelX = width / 2 - panelW / 2;
  const panelY = height * 0.42;

  drawCenteredPanel(panelX, panelY, panelW, panelH, 22);

  const btnW = panelW * 0.72;
  const btnH = panelH * 0.24;
  const btnX = width / 2 - btnW / 2;

  const playY = panelY + panelH * 0.18;
  const helpY = panelY + panelH * 0.56;

  const playPos = createVector(btnX, playY);
  const helpPos = createVector(btnX, helpY);
  const btnSize = createVector(btnW, btnH);

  const playHovered = isMouseOver(playPos, btnSize);
  const helpHovered = isMouseOver(helpPos, btnSize);

  drawFancyButton(
    playPos.x,
    playY,
    btnW,
    btnH,
    "Play",
    playHovered,
    color(0, 200, 255),
  );

  drawFancyButton(
    helpPos.x,
    helpY,
    btnW,
    btnH,
    "Help",
    helpHovered,
    color(180, 80, 255),
  );

  if (touchJustReleased) {
    if (playHovered) {
      playSfx("click", { channel: "ui", volume: 0.7, cooldown: 80 });
      gameState = MENU;
    } else if (helpHovered) {
      playSfx("click", { channel: "ui", volume: 0.7, cooldown: 80 });
      gameState = STATE_HELP;
    }
  }
}

function playSfx(name, opts = {}) {
  const sound = sounds[name];
  if (!sound) return;

  const {
    channel = "sfx", // "sfx" or "ui"
    volume = 1,
    rateMin = 1,
    rateMax = 1,
    cooldown = 0,
    restart = true,
  } = opts;

  const now = millis();
  const last = soundCooldowns[name] || 0;

  if (cooldown > 0 && now - last < cooldown) {
    return;
  }

  soundCooldowns[name] = now;

  const channelVolume = channel === "ui" ? uiVolume : sfxVolume;

  const finalVolume = masterVolume * channelVolume * volume;
  const rate = random(rateMin, rateMax);

  try {
    if (restart && sound.isPlaying()) {
      sound.stop();
    }

    sound.rate(rate);
    sound.setVolume(finalVolume);
    sound.play();
  } catch (e) {
    // fail quietly
  }
}

function drawMenuButton(pos, size, label) {
  fill(255, isMouseOver(pos, size) ? 150 : 50);
  rect(pos.x, pos.y, size.x, size.y, 10);

  fill(0);
  textSize(sizeForWidth(label, size.x / 3, 64));
  text(label, pos.x + size.x / 2, pos.y + size.y / 2);
}

// ─── UPGRADE MENU ────────────────────────────────────────────────────────────
function drawUpgradeMenu() {
  background(0);

  textAlign(CENTER, CENTER);

  fill(255);
  textSize(min(52, width * 0.08));
  text("Choose an Upgrade", width / 2, height * 0.16);

  fill(180);
  textSize(min(18, width * 0.026));
  text(`Level ${player.level}`, width / 2, height * 0.22);

  const cardGap = width * 0.04;
  const cardW = min(width * 0.34, 320);
  const cardH = min(height * 0.34, 240);

  const totalW = cardW * 2 + cardGap;
  const startX = width / 2 - totalW / 2;
  const cardY = height * 0.34;

  const leftPos = createVector(startX, cardY);
  const rightPos = createVector(startX + cardW + cardGap, cardY);
  const cardSize = createVector(cardW, cardH);

  const leftHovered = isMouseOver(leftPos, cardSize);
  const rightHovered = isMouseOver(rightPos, cardSize);

  drawUpgradeCard(
    leftPos.x,
    leftPos.y,
    cardW,
    cardH,
    options1[chosenOption1],
    `Lv ${options1Lvl[chosenOption1]} → ${options1Lvl[chosenOption1] + 1}`,
    option1Descriptions[options1[chosenOption1]] || "",
    leftHovered,
    color(0, 200, 255),
  );

  drawUpgradeCard(
    rightPos.x,
    rightPos.y,
    cardW,
    cardH,
    options2[chosenOption2],
    `Lv ${options2Lvl[chosenOption2]} → ${options2Lvl[chosenOption2] + 1}`,
    option2Descriptions[options2[chosenOption2]] || "",
    rightHovered,
    color(180, 80, 255),
  );

  fill(160);
  textSize(min(16, width * 0.022));
  text("Pick one to continue", width / 2, cardY + cardH + 42);

  if (touchJustReleased) {
    if (leftHovered) {
      playSfx("click", { channel: "ui", volume: 0.75, cooldown: 80 });
      playSfx("boost", { channel: "sfx", volume: 0.8, cooldown: 100 });
      options1Lvl[chosenOption1]++;
      lastChosen1 = chosenOption1;
      applyUpgrade(chosenOption1);
      chooseOptions();
      gameState = GAME;
    }

    if (rightHovered) {
      playSfx("click", { channel: "ui", volume: 0.75, cooldown: 80 });
      playSfx("boost", { channel: "sfx", volume: 0.8, cooldown: 100 });
      options2Lvl[chosenOption2]++;
      lastChosen2 = chosenOption2;

      if (chosenOption2 === 0)
        lastExplosionTime = millis() - getExplosionCooldown();
      if (chosenOption2 === 1) lastSniperTime = millis() - getSniperCooldown();
      if (chosenOption2 === 2) lastMultiTime = millis() - getMultiCooldown();
      if (chosenOption2 === 3) lastEMPTime = millis() - getEMPCooldown();

      chooseOptions();
      gameState = GAME;
    }
  }
}

// ─── MAIN GAME ───────────────────────────────────────────────────────────────
function gameDraw() {
  if (player.health <= 0) {
    playSfx("playerDeath", { channel: "sfx", volume: 0.9, cooldown: 300 });
    gameState = GAME_OVER;
    return;
  }

  handleShieldRegen();
  player.updateDamageFlash();

  updatePlayerMovement();
  player.display();

  drawUI();
  autoFireNearestEnemy();
  updateBullets();
  handleEnemySpawning();
  updateEnemies();
  updateEnemyBullets();
}

function handleShieldRegen() {
  if (
    player.shieldOnCooldown &&
    millis() - player.shieldRegenTimer >= player.shieldRegenDelay
  ) {
    player.shieldCurrent = player.shieldMax;
    player.shieldOnCooldown = false;
  }
}

function autoFireNearestEnemy() {
  if (millis() - lastShotTime <= shootDelay) return;

  const nearest = getNearestEnemy();
  if (!nearest) return;

  bullets.push(new Bullet(player.position.copy(), nearest.pos.copy()));
  playSfx("fire", {
    channel: "sfx",
    volume: 0.35,
    rateMin: 0.96,
    rateMax: 1.04,
    cooldown: 45,
  });
  lastShotTime = millis();
}

// ─── UI ──────────────────────────────────────────────────────────────────────
function drawSlider(x, y, w, h, label, value) {
  const clamped = constrain(value, 0, 1);
  const handleX = x + clamped * w;

  push();

  fill(235);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(12);
  text(label, x, y - 12);

  fill(180);
  textAlign(RIGHT, CENTER);
  text(`${round(clamped * 100)}%`, x + w, y - 12);

  noStroke();
  fill(255, 255, 255, 24);
  rect(x, y, w, h, 999);

  fill(0, 200, 255, 220);
  rect(x, y, w * clamped, h, 999);

  fill(255);
  circle(handleX, y + h / 2, h * 2.1);

  fill(255, 255, 255, 60);
  circle(handleX, y + h / 2, h * 0.9);

  pop();

  return { x, y, w, h, value: clamped };
}

function drawPanel(x, y, w, h, radius = 12) {
  push();
  noStroke();
  fill(10, 14, 20, 180);
  rect(x, y, w, h, radius);

  stroke(255, 255, 255, 28);
  strokeWeight(1.5);
  noFill();
  rect(x, y, w, h, radius);
  pop();
}

function drawStatBar(x, y, w, h, label, valueText, progress, fillCol) {
  const clamped = constrain(progress, 0, 1);

  drawPanel(x, y, w, h, 8);

  push();
  noStroke();

  fill(230);
  textAlign(LEFT, CENTER);
  textSize(11);
  text(label, x + 8, y + 9);

  fill(190);
  textAlign(RIGHT, CENTER);
  text(valueText, x + w - 8, y + 9);

  const barX = x + 8;
  const barY = y + 18;
  const barW = w - 16;
  const barH = h - 24;

  fill(255, 255, 255, 20);
  rect(barX, barY, barW, barH, 999);

  fill(fillCol);
  rect(barX, barY, barW * clamped, barH, 999);

  pop();
}

function drawTopInfoBlock() {
  const x = 12;
  const y = 12;
  const w = max(110, width * 0.1);
  const h = 34;

  drawPanel(x, y, w, h, 10);

  push();
  noStroke();
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(13);
  text(`Level ${player.level}`, x + 10, y + h / 2);
  pop();
}

function drawCooldownText(x, y, w, h, ready, lastTime, cd) {
  push();
  textAlign(CENTER, CENTER);
  noStroke();
  textSize(9);

  if (ready) {
    fill(255, 245);
    text("READY", x + w / 2, y + h - 8);
  } else {
    const secs = max(0, (cd - (millis() - lastTime)) / 1000);
    fill(255, 220);
    text(secs.toFixed(1) + "s", x + w / 2, y + h - 8);
  }

  pop();
}

function drawUI() {
  drawTopInfoBlock();

  const statX = 12;
  const statW = max(170, width * 0.17);
  const statH = 30;
  const statGap = 6;
  const statY = 52;

  const xpProgress = constrain(player.xp / max(1, player.xpToNextLevel), 0, 1);
  drawStatBar(
    statX,
    statY,
    statW,
    statH,
    "XP",
    `${player.xp}/${player.xpToNextLevel}`,
    xpProgress,
    color(0, 200, 255),
  );

  const healthProgress = constrain(
    player.health / max(1, player.maxHealth),
    0,
    1,
  );
  drawStatBar(
    statX,
    statY + statH + statGap,
    statW,
    statH,
    "HP",
    `${player.health}/${player.maxHealth}`,
    healthProgress,
    color(255, 70, 70),
  );

  if (player.shieldMax > 0) {
    const shieldProgress = player.shieldOnCooldown
      ? constrain(
          (millis() - player.shieldRegenTimer) / player.shieldRegenDelay,
          0,
          1,
        )
      : constrain(player.shieldCurrent / max(1, player.shieldMax), 0, 1);

    drawStatBar(
      statX,
      statY + (statH + statGap) * 2,
      statW,
      statH,
      player.shieldOnCooldown ? "Shield" : "Shield",
      `${player.shieldCurrent}/${player.shieldMax}`,
      shieldProgress,
      player.shieldOnCooldown ? color(0, 180, 255) : color(80, 255, 140),
    );
  }

  drawAbilityButton(
    0,
    "Explosion",
    options2Lvl[0],
    lastExplosionTime,
    getExplosionCooldown(),
    color(0, 200, 255),
  );

  drawAbilityButton(
    1,
    "Sniper",
    options2Lvl[1],
    lastSniperTime,
    getSniperCooldown(),
    color(230, 210, 70),
  );

  drawAbilityButton(
    2,
    "Multi",
    options2Lvl[2],
    lastMultiTime,
    getMultiCooldown(),
    color(0, 220, 120),
  );

  drawAbilityButton(
    3,
    "EMP",
    options2Lvl[3],
    lastEMPTime,
    getEMPCooldown(),
    color(180, 80, 255),
  );
}

function drawShieldBar() {
  const y = barSize.y * 2 + 30;

  if (!player.shieldOnCooldown) {
    noStroke();
    fill(0, 255, 0);
    const sW = map(player.shieldCurrent, 0, player.shieldMax, 0, barSize.x);
    rect(10, y, sW, barSize.y);
  } else {
    noStroke();
    fill(80);
    rect(10, y, barSize.x, barSize.y);

    const prog = constrain(
      (millis() - player.shieldRegenTimer) / player.shieldRegenDelay,
      0,
      1,
    );

    fill(0, 200, 255);
    rect(10, y, prog * barSize.x, barSize.y);
  }

  noFill();
  stroke(255);
  rect(10, y, barSize.x, barSize.y);

  fill(255);
  noStroke();
  text(
    `${player.shieldCurrent}/${player.shieldMax}`,
    barSize.x + 20,
    barSize.y * 2 + 50,
  );
}

function drawAbilityButton(idx, label, lvl, lastTime, cd, colr) {
  if (lvl <= 0) return;

  const w = max(68, width * 0.07);
  const h = max(50, height * 0.07);
  const x = width - w - 12;
  const y = 12 + idx * (h + 8);
  const ready = millis() - lastTime >= cd;

  let pulse = 1;
  if (ready) {
    pulse = 1 + sin(frameCount * 0.14 + idx) * 0.035;
  }

  push();

  drawPanel(x, y, w, h, 10);

  noStroke();
  fill(ready ? colr : color(80));
  rect(x + 5, y + 5, w - 10, h - 10, 8);

  if (ready) {
    noFill();
    stroke(red(colr), green(colr), blue(colr), 110);
    strokeWeight(1.5);
    rect(
      x + 5 - pulse,
      y + 5 - pulse,
      w - 10 + pulse * 2,
      h - 10 + pulse * 2,
      10,
    );
  } else {
    const frac = constrain((millis() - lastTime) / cd, 0, 1);
    noStroke();
    fill(0, 0, 0, 120);
    rect(x + 5, y + 5, w - 10, h - 10, 8);

    fill(255, 80, 80, 140);
    rect(x + 5, y + 5, (w - 10) * frac, h - 10, 8);
  }

  fill(idx === 1 ? 20 : 255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(min(13, w * 0.18));
  text(label, x + w / 2, y + h * 0.36);

  fill(idx === 1 ? 20 : 235);
  textSize(9);
  text(`Lv ${lvl}`, x + w / 2, y + h * 0.58);

  pop();

  drawCooldownText(x, y, w, h, ready, lastTime, cd);
}

// ─── GAME OVER ───────────────────────────────────────────────────────────────
function drawGameOverScreen() {
  background(0);

  const panelW = min(width * 0.72, 700);
  const panelH = min(height * 0.56, 460);
  const panelX = width / 2 - panelW / 2;
  const panelY = height / 2 - panelH / 2;

  drawCenteredPanel(panelX, panelY, panelW, panelH, 22);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(min(54, width * 0.08));
  text("Game Over", width / 2, panelY + 56);

  fill(190);
  textSize(min(18, width * 0.025));
  text("Your run has ended", width / 2, panelY + 100);

  const statY = panelY + 158;
  const statW = min(220, panelW * 0.34);
  const statH = 86;
  const statGap = 20;
  const totalW = statW * 2 + statGap;
  const startX = width / 2 - totalW / 2;

  drawPanel(startX, statY, statW, statH, 16);
  drawPanel(startX + statW + statGap, statY, statW, statH, 16);

  fill(220);
  textSize(min(16, width * 0.022));
  text("Levels Gained", startX + statW / 2, statY + 24);
  text("Enemies Killed", startX + statW + statGap + statW / 2, statY + 24);

  fill(255);
  textSize(min(30, width * 0.045));
  text(levelsGained, startX + statW / 2, statY + 56);
  text(enemiesKilled, startX + statW + statGap + statW / 2, statY + 56);

  const btnW = min(240, panelW * 0.34);
  const btnH = 62;
  const btnGap = 18;
  const btnY = panelY + panelH - 98;
  const totalBtnW = btnW * 2 + btnGap;
  const btnStartX = width / 2 - totalBtnW / 2;

  const restartPos = createVector(btnStartX, btnY);
  const menuPos = createVector(btnStartX + btnW + btnGap, btnY);
  const btnSize = createVector(btnW, btnH);

  drawFancyButton(
    restartPos.x,
    restartPos.y,
    btnW,
    btnH,
    "Restart",
    isMouseOver(restartPos, btnSize),
    color(0, 200, 255),
  );

  drawFancyButton(
    menuPos.x,
    menuPos.y,
    btnW,
    btnH,
    "Main Menu",
    isMouseOver(menuPos, btnSize),
    color(180, 80, 255),
  );

  if (touchJustReleased) {
    if (isMouseOver(restartPos, btnSize)) {
      resetGame();
      gameState = GAME;
    }

    if (isMouseOver(menuPos, btnSize)) {
      resetGame();
      gameState = STATE_START;
    }
  }
  if (touchJustReleased) {
    if (isMouseOver(restartPos, btnSize)) {
      playSfx("click", { channel: "ui", volume: 0.7, cooldown: 80 });
      resetGame();
      gameState = GAME;
    }

    if (isMouseOver(menuPos, btnSize)) {
      playSfx("click", { channel: "ui", volume: 0.7, cooldown: 80 });
      resetGame();
      gameState = STATE_START;
    }
  }
}

// ─── HELP ────────────────────────────────────────────────────────────────────
function drawHelp() {
  background(0);

  const panelW = min(width * 0.78, 760);
  const panelH = min(height * 0.62, 520);
  const panelX = width / 2 - panelW / 2;
  const panelY = height / 2 - panelH / 2;

  drawCenteredPanel(panelX, panelY, panelW, panelH, 22);

  // clip area
  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(panelX + 16, panelY + 80, panelW - 32, panelH - 160);
  drawingContext.clip();

  let y = panelY + 100 + helpScroll;
  const leftX = panelX + 40;
  const textW = panelW - 80;

  textAlign(LEFT, TOP);

  fill(255);
  textSize(min(20, width * 0.028));
  text("Controls", leftX, y);
  y += 30;

  fill(200);
  textSize(min(16, width * 0.022));
  text("• Use WASD or the arrow keys to move", leftX, y, textW);
  y += 28;
  text("• Click/tap abilities on the right", leftX, y, textW);
  y += 40;

  fill(255);
  textSize(min(20, width * 0.028));
  text("Goal", leftX, y);
  y += 30;

  fill(200);
  textSize(min(16, width * 0.022));
  text("• Auto-fire targets nearest enemy", leftX, y, textW);
  y += 28;
  text("• Gain XP and level up", leftX, y, textW);
  y += 28;
  text("• Choose upgrades to survive longer", leftX, y, textW);
  y += 40;

  fill(255);
  textSize(min(20, width * 0.028));
  text("Enemies", leftX, y);
  y += 30;

  fill(200);
  textSize(min(16, width * 0.022));
  text("• Sprinters: fast, low health", leftX, y, textW);
  y += 26;
  text("• Tanks: slow, high health, shoot", leftX, y, textW);
  y += 26;
  text("• Splitters: spawn smaller enemies", leftX, y, textW);
  y += 40;

  fill(255);
  textSize(min(20, width * 0.028));
  text("Tips", leftX, y);
  y += 30;

  fill(200);
  textSize(min(16, width * 0.022));
  text("• Keep moving", leftX, y, textW);
  y += 26;
  text("• Save abilities for pressure moments", leftX, y, textW);
  y += 26;
  text("• Prioritise dangerous enemies", leftX, y, textW);

  // calculate scroll bounds
  const contentHeight = y - (panelY + 100);
  const visibleHeight = panelH - 160;
  helpMaxScroll = min(0, visibleHeight - contentHeight);

  drawingContext.restore();
  pop();

  // title
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(min(48, width * 0.07));
  text("How to Play", width / 2, panelY + 40);

  // scrollbar (visual)
  if (helpMaxScroll < 0) {
    const barH = map(visibleHeight, 0, contentHeight, visibleHeight, 40);
    const scrollRatio = -helpScroll / -helpMaxScroll;
    const barY = panelY + 80 + scrollRatio * (visibleHeight - barH);

    noStroke();
    fill(255, 80);
    rect(panelX + panelW - 10, barY, 4, barH, 4);
  }

  // back button
  const btnW = min(260, panelW * 0.5);
  const btnH = 56;
  const btnX = width / 2 - btnW / 2;
  const btnY = panelY + panelH - 70;

  const btnPos = createVector(btnX, btnY);
  const btnSize = createVector(btnW, btnH);

  drawFancyButton(
    btnX,
    btnY,
    btnW,
    btnH,
    "Back",
    isMouseOver(btnPos, btnSize),
    color(0, 200, 255),
  );

  if (touchJustReleased && isMouseOver(btnPos, btnSize)) {
    playSfx("click", { channel: "ui", volume: 0.7, cooldown: 80 });
    gameState = STATE_START;
    helpScroll = 0;
  }
}

function mouseWheel(event) {
  if (gameState === STATE_HELP) {
    helpScroll -= event.delta * 0.5;
    helpScroll = constrain(helpScroll, helpMaxScroll, 0);
  }
}

function touchStarted() {
  if (gameState === STATE_HELP) {
    isDraggingHelp = true;
    lastTouchY = mouseY;
  }
}

function touchMoved() {
  if (gameState === STATE_HELP && isDraggingHelp) {
    const dy = mouseY - lastTouchY;
    helpScroll += dy;
    helpScroll = constrain(helpScroll, helpMaxScroll, 0);
    lastTouchY = mouseY;
    return false;
  }
}

// ─── RESET ───────────────────────────────────────────────────────────────────
function resetGame() {
  player.position.set(width / 2, height / 2);
  player.maxHealth = 10;
  player.health = 10;
  player.maxSpeed = 5;

  player.xp = 0;
  player.level = 1;
  player.xpToNextLevel = 10;

  player.shieldMax = 0;
  player.shieldCurrent = 0;
  player.shieldOnCooldown = false;
  player.shieldRegenTimer = 0;

  player.contactDamage = 1;
  player.invulnerableUntil = 0;
  player.flashTimer = 0;

  enemies = [];
  bullets = [];
  enemyBullets = [];

  enemiesKilled = 0;
  levelsGained = 0;

  options1Lvl = [0, 0, 0, 0, 0];
  options2Lvl = [0, 0, 0, 0];

  spawnInterval = 1500;
  shootDelay = 1000;
  bulletDamage = 1.0;

  lastChosen1 = -1;
  lastChosen2 = -1;

  chooseOptions();
  resetRunTimers();
  chooseBackground();
}

// ─── GAME LOGIC ──────────────────────────────────────────────────────────────
function updatePlayerMovement() {
  let dx = 0;
  let dy = 0;

  if (keyIsDown(87) || keyIsDown(UP_ARROW)) dy -= 1;
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) dy += 1;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) dx -= 1;
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const move = createVector(dx, dy).normalize().mult(player.maxSpeed);
    player.position.add(move);
  }

  player.position.x = constrain(
    player.position.x,
    player.halfSize,
    width - player.halfSize,
  );
  player.position.y = constrain(
    player.position.y,
    player.halfSize,
    height - player.halfSize,
  );
}

function handleButtonTap(tx, ty) {
  if (gameState !== GAME) return;

  const sz = createVector(width / 12, height / 12);

  if (
    options2Lvl[0] > 0 &&
    millis() - lastExplosionTime >= getExplosionCooldown()
  ) {
    const pos = createVector(width - sz.x - 10, 10);
    if (pointInRect(tx, ty, pos, sz)) {
      enemies = [];
      enemyBullets = [];
      lastExplosionTime = millis();
      addScreenShake(10);
      playSfx("explosion", { channel: "sfx", volume: 0.9, cooldown: 120 });
      return;
    }
  }

  if (options2Lvl[1] > 0 && millis() - lastSniperTime >= getSniperCooldown()) {
    const pos = createVector(width - sz.x - 10, sz.y + 20);
    if (pointInRect(tx, ty, pos, sz)) {
      sniperActive = true;
      sniperStartTime = millis();
      lastSniperTime = millis();
      playSfx("sniper", { channel: "sfx", volume: 0.8, cooldown: 120 });
      return;
    }
  }

  if (options2Lvl[2] > 0 && millis() - lastMultiTime >= getMultiCooldown()) {
    const pos = createVector(width - sz.x - 10, sz.y * 2 + 30);
    if (pointInRect(tx, ty, pos, sz)) {
      const shots = 6 + options2Lvl[2] * 4;
      for (let i = 0; i < shots; i++) {
        const angle = (i * TWO_PI) / shots;
        const dir = p5.Vector.fromAngle(angle);
        const target = p5.Vector.add(player.position, dir.mult(10));
        bullets.push(new Bullet(player.position.copy(), target));
        playSfx("multiShot", { channel: "sfx", volume: 0.8, cooldown: 120 });
      }
      lastMultiTime = millis();
      addScreenShake(4);
      return;
    }
  }

  if (options2Lvl[3] > 0 && millis() - lastEMPTime >= getEMPCooldown()) {
    const pos = createVector(width - sz.x - 10, sz.y * 3 + 40);
    if (pointInRect(tx, ty, pos, sz)) {
      empActive = true;
      empStartTime = millis();
      lastEMPTime = millis();
      addScreenShake(6);
      playSfx("emp", { channel: "sfx", volume: 0.85, cooldown: 120 });
    }
  }
}

function updateBullets() {
  if (
    sniperActive &&
    millis() - sniperStartTime > 3500 + options2Lvl[1] * 1000
  ) {
    sniperActive = false;
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.move();
    bullet.display();

    let hit = false;

    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (bullet.hits(enemy)) {
        enemy.health -= bulletDamage;
        enemy.hitFlash = 6;
        hit = true;
        playSfx("enemyHit", {
          channel: "sfx",
          volume: 0.3,
          rateMin: 0.95,
          rateMax: 1.08,
          cooldown: 35,
        });
        if (!sniperActive) {
          break;
        }
      }
    }

    if ((!sniperActive && hit) || bullet.offScreen()) {
      bullets.splice(i, 1);
    }
  }
}

function handleEnemySpawning() {
  if (millis() - lastSpawnTime > spawnInterval) {
    spawnEnemy();
    lastSpawnTime = millis();
  }

  if (millis() - lastSpawnRampTime > spawnRampEvery) {
    spawnInterval = max(minSpawnInterval, spawnInterval - spawnRateDecrease);
    lastSpawnRampTime = millis();
  }
}

function getEnemyWeights() {
  const progress = player.level + enemiesKilled * 0.02;

  let sprinter = 0.08 + progress * 0.01;
  let tank = 0.04 + progress * 0.006;
  let splitter = 0.02 + progress * 0.005;
  let normal = 1.0;

  sprinter = min(sprinter, 0.28);
  tank = min(tank, 0.18);
  splitter = min(splitter, 0.14);

  return { normal, sprinter, tank, splitter };
}

function weightedEnemyType() {
  const w = getEnemyWeights();
  const total = w.normal + w.sprinter + w.tank + w.splitter;
  const r = random(total);

  if (r < w.normal) return "normal";
  if (r < w.normal + w.sprinter) return "sprinter";
  if (r < w.normal + w.sprinter + w.tank) return "tank";
  return "splitter";
}

function spawnEnemy() {
  const buf = 50;
  let x, y;

  const side = floor(random(4));
  if (side === 0) {
    x = random(width);
    y = -buf;
  } else if (side === 1) {
    x = width + buf;
    y = random(height);
  } else if (side === 2) {
    x = random(width);
    y = height + buf;
  } else {
    x = -buf;
    y = random(height);
  }

  const type = weightedEnemyType();
  const enemy = new Enemy(createVector(x, y), type);
  enemies.push(enemy);
  playSfx("enemySpawn", {
    channel: "sfx",
    volume: 0.22,
    rateMin: 0.95,
    rateMax: 1.05,
    cooldown: 80,
  });
}

function getNearestEnemy() {
  let best = null;
  let bestDist = Infinity;

  for (const enemy of enemies) {
    const d = p5.Vector.dist(player.position, enemy.pos);
    if (d < bestDist) {
      bestDist = d;
      best = enemy;
    }
  }

  return best;
}

function damagePlayer(amount) {
  if (millis() < player.invulnerableUntil) return;

  if (player.shieldCurrent > 0) {
    player.shieldCurrent -= amount;
    playSfx("shield", {
      channel: "sfx",
      volume: 0.45,
      rateMin: 0.98,
      rateMax: 1.02,
      cooldown: 80,
    });
    while (player.shieldCurrent < 0) {
      const overflow = -player.shieldCurrent;
      player.shieldCurrent = 0;
      player.health -= overflow;
      playSfx("hit", {
        channel: "sfx",
        volume: 0.7,
        rateMin: 0.98,
        rateMax: 1.02,
        cooldown: 120,
      });
    }

    if (player.shieldCurrent === 0) {
      player.shieldOnCooldown = true;
      player.shieldRegenTimer = millis();
      playSfx("shieldBreak", {
        channel: "sfx",
        volume: 0.75,
        cooldown: 120,
      });
    }
  } else {
    player.health -= amount;
  }

  player.invulnerableUntil = millis() + 700;
  player.flashTimer = 12;
  addScreenShake(6);
}

function updateEnemies() {
  if (empActive && millis() - empStartTime > 2500 + options2Lvl[3] * 800) {
    empActive = false;
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    if (!enemy || !enemy.pos) {
      enemies.splice(i, 1);
      continue;
    }

    const enemySize = enemy.size || 30;
    const enemyContactDamage = enemy.contactDamage || 1;

    if (
      p5.Vector.dist(enemy.pos, player.position) <
      enemySize * 0.5 + player.halfSize
    ) {
      damagePlayer(enemyContactDamage);
      enemies.splice(i, 1);
      continue;
    }

    if (!empActive && typeof enemy.move === "function") {
      enemy.move(player.position);
    }

    if (typeof enemy.update === "function") {
      enemy.update();
    }

    if (typeof enemy.display === "function") {
      enemy.display();
    }

    if (
      (enemy.type === "tank" || enemy.type === "splitter") &&
      typeof enemy.lastShotTime === "number" &&
      millis() - enemy.lastShotTime >= 2000
    ) {
      enemyBullets.push(
        new Bullet(enemy.pos.copy(), player.position.copy(), true),
      );
      playSfx("enemyShoot", {
        channel: "sfx",
        volume: 0.28,
        rateMin: 0.92,
        rateMax: 1.0,
        cooldown: 90,
      });
      enemy.lastShotTime = millis();
    }

    if (typeof enemy.isDead === "function" && enemy.isDead()) {
      handleEnemyDeath(enemy, i);
    }
  }
}

function handleEnemyDeath(enemy, index) {
  enemiesKilled++;
  player.xp += enemy.xpValue || 0;
  playSfx("enemyDeath", {
    channel: "sfx",
    volume: 0.55,
    rateMin: 0.94,
    rateMax: 1.06,
    cooldown: 45,
  });

  if (enemy.type === "splitter") {
    let sprinterCount = 0;
    for (const e of enemies) {
      if (e && e.type === "sprinter") sprinterCount++;
    }
    const extra = min(floor(900 / spawnInterval), 2);
    const spawnCount = min(2 + extra, max(0, 12 - sprinterCount));

    for (let k = 0; k < spawnCount; k++) {
      const off = p5.Vector.random2D().mult(20);
      enemies.push(new Enemy(p5.Vector.add(enemy.pos, off), "sprinter"));
    }
  }

  enemies.splice(index, 1);

  let leveled = false;
  while (player.xp >= player.xpToNextLevel) {
    player.xp -= player.xpToNextLevel;
    player.level++;
    levelsGained++;

    player.maxHealth += 1;
    player.health = min(
      player.maxHealth,
      player.health + ceil(player.maxHealth * 0.5),
    );

    player.xpToNextLevel = floor(8 + Math.pow(player.level, 1.35) * 6);
    leveled = true;
  }

  if (leveled) {
    playSfx("levelUp", { channel: "sfx", volume: 0.9, cooldown: 100 });
    playSfx("upgradeOpen", { channel: "ui", volume: 0.7, cooldown: 100 });
    chooseOptions();
    gameState = MENU;
  }
}

function updateEnemyBullets() {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const bullet = enemyBullets[i];
    bullet.move();
    bullet.display();

    if (
      p5.Vector.dist(bullet.pos, player.position) <
      bullet.r + player.halfSize
    ) {
      damagePlayer(1);
      enemyBullets.splice(i, 1);
    } else if (bullet.offScreen()) {
      enemyBullets.splice(i, 1);
    }
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function sizeForWidth(str, maxW, baseTS) {
  textSize(baseTS);
  return baseTS * (maxW / max(1, textWidth(str)));
}

function isMouseOver(pos, size) {
  return pointInRect(mouseX, mouseY, pos, size);
}

function pointInRect(x, y, pos, size) {
  return x > pos.x && x < pos.x + size.x && y > pos.y && y < pos.y + size.y;
}

function chooseOptions() {
  chosenOption1 = floor(random(options1.length));
  chosenOption2 = floor(random(options2.length));

  if (options1.length > 1 && chosenOption1 === lastChosen1) {
    chosenOption1 =
      (chosenOption1 + 1 + floor(random(options1.length - 1))) %
      options1.length;
  }

  if (options2.length > 1 && chosenOption2 === lastChosen2) {
    chosenOption2 =
      (chosenOption2 + 1 + floor(random(options2.length - 1))) %
      options2.length;
  }
}

function applyUpgrade(idx) {
  const opt = options1[idx];
  playSfx("boost", {
    channel: "sfx",
    volume: 0.65,
    rateMin: 0.98,
    rateMax: 1.04,
    cooldown: 80,
  });

  if (opt === "Move speed") {
    player.maxSpeed += 0.25;
  } else if (opt === "Fire speed") {
    const lvl = options1Lvl[idx];
    shootDelay = max(140, floor(1000 * Math.pow(0.92, lvl)));
  } else if (opt === "Damage") {
    bulletDamage += 0.2;
  } else if (opt === "Health") {
    player.maxHealth += 2;
    player.health = player.maxHealth;
  } else if (opt === "Shield") {
    player.shieldMax++;
    player.shieldCurrent = player.shieldMax;
    player.shieldOnCooldown = false;
  }
}

function getExplosionCooldown() {
  return max(12000, 24000 - options2Lvl[0] * 1800);
}

function getSniperCooldown() {
  return max(10000, 22000 - options2Lvl[1] * 1600);
}

function getMultiCooldown() {
  return max(2200, 6000 - options2Lvl[2] * 350);
}

function getEMPCooldown() {
  return max(9000, 18000 - options2Lvl[3] * 1200);
}

function isInsideSlider(slider) {
  return (
    mouseX > slider.x &&
    mouseX < slider.x + slider.w &&
    mouseY > slider.y &&
    mouseY < slider.y + slider.h
  );
}

function getSliderValue(slider) {
  return constrain((mouseX - slider.x) / slider.w, 0, 1);
}
