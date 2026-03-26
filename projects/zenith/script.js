// ─── GLOBAL STATE ────────────────────────────────────────────────────────────
let menu1Pos, menu2Pos, menuSize, text1Pos, text2Pos, barSize;
let touchJustReleased = false;

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

// ─── MAIN DRAW LOOP ──────────────────────────────────────────────────────────
function draw() {
  background(0);

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
  touchJustReleased = true;
  handleButtonTap(mouseX, mouseY);
}

function touchEnded() {
  touchJustReleased = true;
  handleButtonTap(mouseX, mouseY);
  return false;
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

  drawFancyButton(
    playPos.x,
    playY,
    btnW,
    btnH,
    "Play",
    isMouseOver(playPos, btnSize),
    color(0, 200, 255),
  );

  drawFancyButton(
    helpPos.x,
    helpY,
    btnW,
    btnH,
    "Help",
    isMouseOver(helpPos, btnSize),
    color(180, 80, 255),
  );

  if (touchJustReleased) {
    if (isMouseOver(playPos, btnSize)) {
      gameState = MENU;
    } else if (isMouseOver(helpPos, btnSize)) {
      gameState = STATE_HELP;
    }
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
      options1Lvl[chosenOption1]++;
      lastChosen1 = chosenOption1;
      applyUpgrade(chosenOption1);
      chooseOptions();
      gameState = GAME;
    }

    if (rightHovered) {
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
  lastShotTime = millis();
}

// ─── UI ──────────────────────────────────────────────────────────────────────
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

  drawPanel(x, y, w, h, 10);

  push();
  textAlign(LEFT, TOP);
  noStroke();
  fill(235);
  textSize(13);
  text(label, x + 10, y + 7);

  fill(200);
  textAlign(RIGHT, TOP);
  text(valueText, x + w - 10, y + 7);

  const barX = x + 10;
  const barY = y + 28;
  const barW = w - 20;
  const barH = h - 38;

  noStroke();
  fill(255, 255, 255, 22);
  rect(barX, barY, barW, barH, 999);

  fill(fillCol);
  rect(barX, barY, barW * clamped, barH, 999);

  pop();
}

function drawTopInfoBlock() {
  const x = 12;
  const y = 12;
  const w = max(190, width * 0.16);
  const h = 68;

  drawPanel(x, y, w, h, 12);

  push();
  noStroke();
  fill(255);
  textAlign(LEFT, TOP);

  textSize(14);
  text(`Level ${player.level}`, x + 12, y + 10);

  fill(190);
  textSize(12);
  text(`Kills ${enemiesKilled}`, x + 12, y + 32);
  text(`Gained ${levelsGained}`, x + 12, y + 48);
  pop();
}

function drawCooldownText(x, y, w, h, ready, lastTime, cd) {
  push();
  textAlign(CENTER, CENTER);
  noStroke();
  textSize(11);

  if (ready) {
    fill(255, 245);
    text("READY", x + w / 2, y + h - 10);
  } else {
    const secs = max(0, (cd - (millis() - lastTime)) / 1000);
    fill(255, 220);
    text(secs.toFixed(1) + "s", x + w / 2, y + h - 10);
  }

  pop();
}

function drawUI() {
  drawTopInfoBlock();

  const statX = 12;
  const statW = max(220, width * 0.22);
  const statH = 50;
  const statGap = 10;
  const statY = 92;

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
    "Health",
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
      player.shieldOnCooldown ? "Shield Regen" : "Shield",
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

  const w = max(88, width * 0.09);
  const h = max(64, height * 0.09);
  const x = width - w - 12;
  const y = 12 + idx * (h + 10);
  const ready = millis() - lastTime >= cd;

  let pulse = 1;
  if (ready) {
    pulse = 1 + sin(frameCount * 0.14 + idx) * 0.04;
  }

  push();

  drawPanel(x, y, w, h, 12);

  noStroke();
  fill(ready ? colr : color(90));
  rect(x + 6, y + 6, w - 12, h - 12, 10);

  if (ready) {
    noFill();
    stroke(red(colr), green(colr), blue(colr), 120);
    strokeWeight(2);
    rect(
      x + 6 - pulse,
      y + 6 - pulse,
      w - 12 + pulse * 2,
      h - 12 + pulse * 2,
      12,
    );
  } else {
    const frac = constrain((millis() - lastTime) / cd, 0, 1);
    noStroke();
    fill(0, 0, 0, 120);
    rect(x + 6, y + 6, w - 12, h - 12, 10);

    fill(255, 80, 80, 150);
    rect(x + 6, y + 6, (w - 12) * frac, h - 12, 10);
  }

  fill(idx === 1 ? 20 : 255);
  textAlign(CENTER, CENTER);
  textSize(min(16, w * 0.2));
  text(label, x + w / 2, y + h * 0.38);

  fill(idx === 1 ? 20 : 235);
  textSize(11);
  text(`Lv ${lvl}`, x + w / 2, y + h * 0.62);

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

function touchEnded() {
  isDraggingHelp = false;
  touchJustReleased = true;
  handleButtonTap(mouseX, mouseY);
  return false;
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
      return;
    }
  }

  if (options2Lvl[1] > 0 && millis() - lastSniperTime >= getSniperCooldown()) {
    const pos = createVector(width - sz.x - 10, sz.y + 20);
    if (pointInRect(tx, ty, pos, sz)) {
      sniperActive = true;
      sniperStartTime = millis();
      lastSniperTime = millis();
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
    while (player.shieldCurrent < 0) {
      const overflow = -player.shieldCurrent;
      player.shieldCurrent = 0;
      player.health -= overflow;
    }

    if (player.shieldCurrent === 0) {
      player.shieldOnCooldown = true;
      player.shieldRegenTimer = millis();
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
