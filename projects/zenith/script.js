// ─── GLOBAL STATE ────────────────────────────────────────────────────────────
let menu1Pos, menu2Pos, menuSize, text1Pos, text2Pos, barSize;
let touchJustReleased = false;

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
let enemies = [];
let bullets = [];
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
let spawnInterval = 1500;
const spawnRateDecrease = 30;
let lastSpawnRampTime = 0;
const spawnRampEvery = 5000;
const minSpawnInterval = 220;

let lastShotTime = 0;
let shootDelay = 1000;
let bulletDamage = 1.0;

// ─── SCREEN FX ──────────────────────────────────────────────────────────────
let screenShake = 0;
let screenShakeDecay = 0.88;

// ─── UPGRADE MEMORY ─────────────────────────────────────────────────────────
let lastChosen1 = -1;
let lastChosen2 = -1;

// ─── SETUP / LAYOUT ─────────────────────────────────────────────────────────
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
    menu1Pos.y + menu1Pos.y / 3
  );
  text2Pos = createVector(
    menu2Pos.x + menuSize.x / 2,
    menu2Pos.y + menu2Pos.y / 3
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
    player.position.x = constrain(player.position.x, player.halfSize, width - player.halfSize);
    player.position.y = constrain(player.position.y, player.halfSize, height - player.halfSize);
  }
}

function setup() {
  const canvasHost = getCanvasHost();
  const canvas = createCanvas(canvasHost.clientWidth, canvasHost.clientHeight);
  canvas.parent("canvas");

  textAlign(CENTER, CENTER);
  textFont("sans-serif");

  chooseOptions();
  player = new Player(createVector(width / 2, height / 2), 30, 10, 5);

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
  translate(random(-screenShake, screenShake), random(-screenShake, screenShake));
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
function drawStartMenu() {
  textAlign(CENTER, CENTER);

  fill(255);
  textSize(sizeForWidth("ZENITH", width / 3, 64));
  text("ZENITH", width / 2, height / 4);

  const bs = createVector(width / 3, height / 6);
  const p1 = createVector(width / 2 - bs.x / 2, 2 * height / 3 - bs.y - 20);
  const p2 = createVector(width / 2 - bs.x / 2, 2 * height / 3);

  drawMenuButton(p1, bs, "Play");
  drawMenuButton(p2, bs, "Help");

  if (touchJustReleased) {
    if (isMouseOver(p1, bs)) {
      gameState = MENU;
    } else if (isMouseOver(p2, bs)) {
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
  fill(255, isMouseOver(menu1Pos, menuSize) ? 150 : 50);
  rect(menu1Pos.x, menu1Pos.y, menuSize.x, menuSize.y, 10);

  fill(255, isMouseOver(menu2Pos, menuSize) ? 150 : 50);
  rect(menu2Pos.x, menu2Pos.y, menuSize.x, menuSize.y, 10);

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(isMouseOver(menu1Pos, menuSize) ? smallestSize * 1.05 : smallestSize);
  text(
    `${options1[chosenOption1]}\nLv ${options1Lvl[chosenOption1]} → ${options1Lvl[chosenOption1] + 1}`,
    text1Pos.x,
    text1Pos.y
  );

  textSize(isMouseOver(menu2Pos, menuSize) ? smallestSize * 1.05 : smallestSize);
  text(
    `${options2[chosenOption2]}\nLv ${options2Lvl[chosenOption2]} → ${options2Lvl[chosenOption2] + 1}`,
    text2Pos.x,
    text2Pos.y
  );

  if (touchJustReleased) {
    if (isMouseOver(menu1Pos, menuSize)) {
      options1Lvl[chosenOption1]++;
      lastChosen1 = chosenOption1;
      applyUpgrade(chosenOption1);
      chooseOptions();
      gameState = GAME;
    }

    if (isMouseOver(menu2Pos, menuSize)) {
      options2Lvl[chosenOption2]++;
      lastChosen2 = chosenOption2;

      if (chosenOption2 === 0) lastExplosionTime = millis() - getExplosionCooldown();
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

  drawUI();
  updatePlayerMovement();
  player.display();

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
function drawUI() {
  noStroke();

  fill(0, 200, 255);
  const xpW = map(player.xp, 0, max(1, player.xpToNextLevel), 0, barSize.x);
  rect(10, 10, xpW, barSize.y);
  noFill();
  stroke(255);
  rect(10, 10, barSize.x, barSize.y);

  fill(255);
  textAlign(LEFT, CENTER);
  textSize(sizeForWidth(`${player.xp}/${player.xpToNextLevel}`, width / 30, 64));
  text(`${player.xp}/${player.xpToNextLevel}`, barSize.x + 20, 30);

  noStroke();
  fill(255, 0, 0);
  const hW = map(player.health, 0, player.maxHealth, 0, barSize.x);
  rect(10, barSize.y + 20, hW, barSize.y);

  noFill();
  stroke(255);
  rect(10, barSize.y + 20, barSize.x, barSize.y);

  fill(255);
  noStroke();
  text(`${player.health}/${player.maxHealth}`, barSize.x + 20, barSize.y + 40);

  if (player.shieldMax > 0) {
    drawShieldBar();
  }

  drawAbilityButton(0, "Explosion", options2Lvl[0], lastExplosionTime, getExplosionCooldown(), color(0, 200, 255));
  drawAbilityButton(1, "Sniper", options2Lvl[1], lastSniperTime, getSniperCooldown(), color(200, 200, 0));
  drawAbilityButton(2, "Multi-shot", options2Lvl[2], lastMultiTime, getMultiCooldown(), color(0, 200, 0));
  drawAbilityButton(3, "EMP Pulse", options2Lvl[3], lastEMPTime, getEMPCooldown(), color(150, 0, 255));
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
      1
    );

    fill(0, 200, 255);
    rect(10, y, prog * barSize.x, barSize.y);
  }

  noFill();
  stroke(255);
  rect(10, y, barSize.x, barSize.y);

  fill(255);
  noStroke();
  text(`${player.shieldCurrent}/${player.shieldMax}`, barSize.x + 20, barSize.y * 2 + 50);
}

function drawAbilityButton(idx, label, lvl, lastTime, cd, colr) {
  if (lvl <= 0) return;

  const sz = createVector(width / 12, height / 12);
  const pos = createVector(width - sz.x - 10, idx * (sz.y + 10) + 10);
  const ready = millis() - lastTime >= cd;

  noStroke();

  let pulse = 1;
  if (ready) {
    pulse = 0.9 + sin(frameCount * 0.15 + idx) * 0.08 + 0.12;
  }

  fill(ready ? colr : 80);
  rect(pos.x, pos.y, sz.x, sz.y, 5);

  if (ready) {
    noFill();
    stroke(red(colr), green(colr), blue(colr), 140);
    strokeWeight(2);
    rect(pos.x - pulse * 2, pos.y - pulse * 2, sz.x + pulse * 4, sz.y + pulse * 4, 7);
  }

  fill(idx === 1 ? 0 : 255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(sizeForWidth(label, sz.x - 20, 32));
  text(label, pos.x + sz.x / 2, pos.y + sz.y / 2);

  if (!ready) {
    const frac = constrain((millis() - lastTime) / cd, 0, 1);
    noStroke();
    fill(255, 0, 0, 150);
    rect(pos.x, pos.y, sz.x * (1 - frac), sz.y, 5);
  }
}

// ─── GAME OVER ───────────────────────────────────────────────────────────────
function drawGameOverScreen() {
  background(0);

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(sizeForWidth("Game Over", width * 0.6, 64));
  text("Game Over", width / 2, height / 4);

  textSize(sizeForWidth(`Enemies Killed: ${enemiesKilled}`, width / 4, 64));
  text(
    `Levels Gained: ${levelsGained}\nEnemies Killed: ${enemiesKilled}`,
    width / 2,
    height / 2 - 20
  );

  const bs = createVector(width / 4, height / 6);
  const pRestart = createVector(width / 2 - bs.x - 20, height * 3 / 4);
  const pMenu = createVector(width / 2 + 20, height * 3 / 4);

  drawMenuButton(pRestart, bs, "Restart");
  drawMenuButton(pMenu, bs, "Main Menu");

  if (touchJustReleased) {
    if (isMouseOver(pRestart, bs)) {
      resetGame();
      gameState = GAME;
    }
    if (isMouseOver(pMenu, bs)) {
      resetGame();
      gameState = STATE_START;
    }
  }
}

// ─── HELP ────────────────────────────────────────────────────────────────────
function drawHelp() {
  background(0);
  fill(255);
  textAlign(CENTER, TOP);
  textSize(sizeForWidth("Use WASD or arrow keys to move", 2 * width / 3, 64));

  const helpText = `Use WASD or arrow keys to move
Auto-fire at nearest enemy
Defeat enemies for XP to level up
Level up to gain new powers

Click to return`;

  text(helpText, 0, height * 0.15, width * 0.9, height * 0.85);

  if (touchJustReleased) {
    gameState = STATE_START;
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

  player.position.x = constrain(player.position.x, player.halfSize, width - player.halfSize);
  player.position.y = constrain(player.position.y, player.halfSize, height - player.halfSize);
}

function handleButtonTap(tx, ty) {
  if (gameState !== GAME) return;

  const sz = createVector(width / 12, height / 12);

  if (options2Lvl[0] > 0 && millis() - lastExplosionTime >= getExplosionCooldown()) {
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
      const shots = options2Lvl[2] * 8;
      for (let i = 0; i < shots; i++) {
        const angle = i * TWO_PI / shots;
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
  if (sniperActive && millis() - sniperStartTime > 5000) {
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
  const progress = player.level + enemiesKilled * 0.03;

  let sprinter = 0.15 + progress * 0.015;
  let tank = 0.08 + progress * 0.008;
  let splitter = 0.03 + progress * 0.006;
  let normal = 1.0;

  sprinter = min(sprinter, 0.35);
  tank = min(tank, 0.22);
  splitter = min(splitter, 0.16);

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
  enemies.push(new Enemy(createVector(x, y), type));
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
  if (empActive && millis() - empStartTime > 5000) {
    empActive = false;
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    if (p5.Vector.dist(enemy.pos, player.position) < enemy.size * 0.5 + player.halfSize) {
      damagePlayer(enemy.contactDamage);
      enemies.splice(i, 1);
      continue;
    }

    if (!empActive) {
      enemy.move(player.position);
    }

    enemy.update();
    enemy.display();

    if (
      (enemy.type === "tank" || enemy.type === "splitter") &&
      millis() - enemy.lastShotTime >= 2000
    ) {
      enemyBullets.push(new Bullet(enemy.pos.copy(), player.position.copy(), true));
      enemy.lastShotTime = millis();
    }

    if (enemy.isDead()) {
      handleEnemyDeath(enemy, i);
    }
  }
}

function handleEnemyDeath(enemy, index) {
  enemiesKilled++;
  player.xp += enemy.xpValue;

  if (enemy.type === "splitter") {
    let splitterCount = 0;
    for (const e of enemies) {
      if (e.type === "sprinter") splitterCount++;
    }

    const extra = min(floor(1000 / spawnInterval), 5);
    const spawnCount = min(3 + extra, max(0, 18 - splitterCount));

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
    player.xpToNextLevel = 10 * player.level;
    leveled = true;
  }

  if (leveled) {
    gameState = MENU;
  }
}

function updateEnemyBullets() {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const bullet = enemyBullets[i];
    bullet.move();
    bullet.display();

    if (p5.Vector.dist(bullet.pos, player.position) < bullet.r + player.halfSize) {
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
    chosenOption1 = (chosenOption1 + 1 + floor(random(options1.length - 1))) % options1.length;
  }

  if (options2.length > 1 && chosenOption2 === lastChosen2) {
    chosenOption2 = (chosenOption2 + 1 + floor(random(options2.length - 1))) % options2.length;
  }
}

function applyUpgrade(idx) {
  const opt = options1[idx];

  if (opt === "Move speed") {
    player.maxSpeed += 0.25;
  } else if (opt === "Fire speed") {
    const lvl = options1Lvl[idx];
    shootDelay = max(90, floor(1000 * Math.pow(0.9, lvl)));
  } else if (opt === "Damage") {
    bulletDamage += 0.1;
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
  return max(0, 30000 - options2Lvl[0] * 250);
}

function getSniperCooldown() {
  return max(0, 30000 - options2Lvl[1] * 250);
}

function getMultiCooldown() {
  return max(0, 5000 - options2Lvl[2] * 100);
}

function getEMPCooldown() {
  return max(0, 20000 - options2Lvl[3] * 200);
}

// ─── CLASSES ─────────────────────────────────────────────────────────────────
class Bullet {
  constructor(start, target, isEnemy = false) {
    this.pos = start.copy();
    this.vel = p5.Vector.sub(target, start).normalize().mult(isEnemy ? 6 : 10);
    this.r = isEnemy ? 6 : 5;
    this.isEnemy = isEnemy;
  }

  move() {
    this.pos.add(this.vel);
  }

  display() {
    noStroke();
    if (this.isEnemy) {
      fill(255, 60, 60);
      ellipse(this.pos.x, this.pos.y, this.r * 2.4);
      fill(255, 180, 180);
      ellipse(this.pos.x, this.pos.y, this.r * 1.2);
    } else {
      fill(255, 150, 0);
      ellipse(this.pos.x, this.pos.y, this.r * 2.4);
      fill(255, 240, 180);
      ellipse(this.pos.x, this.pos.y, this.r * 1.1);
    }
  }

  hits(enemy) {
    return p5.Vector.dist(this.pos, enemy.pos) < this.r + enemy.size * 0.5;
  }

  offScreen() {
    return (
      this.pos.x < -20 ||
      this.pos.x > width + 20 ||
      this.pos.y < -20 ||
      this.pos.y > height + 20
    );
  }
}

class Enemy {
  constructor(start, type) {
    this.pos = start.copy();
    this.type = type;
    this.spawnTime = millis();
    this.hitFlash = 0;

    switch (type) {
      case "sprinter":
        this.speed = 7;
        this.health = 1;
        this.contactDamage = 1;
        this.size = 24;
        break;
      case "tank":
        this.speed = 0.5;
        this.health = 5;
        this.contactDamage = 2;
        this.size = 38;
        break;
      case "splitter":
        this.speed = 0.2;
        this.health = 3;
        this.contactDamage = 1;
        this.size = 34;
        break;
      default:
        this.speed = 2;
        this.health = 2;
        this.contactDamage = 1;
        this.size = 30;
        break;
    }

    this.startingHealth = this.health;
    this.xpValue = this.startingHealth;
    this.lastShotTime = millis();
  }

  update() {
    if (this.hitFlash > 0) this.hitFlash--;
  }

  move(target) {
    const dir = p5.Vector.sub(target, this.pos);
    if (dir.mag() > 1) {
      dir.setMag(this.speed);
      this.pos.add(dir);
    }
  }

  display() {
    noStroke();

    let c;
    switch (this.type) {
      case "sprinter":
        c = color(255, 0, 0);
        break;
      case "tank":
        c = color(0, 0, 255);
        break;
      case "splitter":
        c = color(255, 255, 0);
        break;
      default:
        c = color(0, 255, 255);
    }

    const age = millis() - this.spawnTime;
    const appear = constrain(age / 180, 0, 1);
    const drawSize = this.size * lerp(0.45, 1, appear);

    if (this.hitFlash > 0) {
      fill(255);
    } else {
      fill(c);
    }

    ellipse(this.pos.x, this.pos.y, drawSize);

    if (appear < 1) {
      noFill();
      stroke(red(c), green(c), blue(c), 180 * (1 - appear));
      strokeWeight(2);
      ellipse(this.pos.x, this.pos.y, this.size + (1 - appear) * 16);
    }
  }

  isDead() {
    return this.health <= 0;
  }
}

class Player {
  constructor(position, size, maxHealth, maxSpeed) {
    this.position = position.copy();
    this.size = size;
    this.halfSize = size / 2;

    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.maxSpeed = maxSpeed;

    this.xp = 0;
    this.level = 1;
    this.xpToNextLevel = 10;

    this.shieldMax = 0;
    this.shieldCurrent = 0;
    this.shieldRegenDelay = 10000;
    this.shieldRegenTimer = 0;
    this.shieldOnCooldown = false;

    this.contactDamage = 1;
    this.invulnerableUntil = 0;
    this.flashTimer = 0;
  }

  updateDamageFlash() {
    if (this.flashTimer > 0) this.flashTimer--;
  }

  display() {
    noStroke();

    if (millis() < this.invulnerableUntil && frameCount % 6 < 3) {
      fill(255, 120, 120);
    } else if (this.flashTimer > 0) {
      fill(255, 180, 180);
    } else {
      fill(255);
    }

    ellipse(this.position.x, this.position.y, this.size);

    if (this.flashTimer > 0) {
      noFill();
      stroke(255, 100, 100, 180);
      strokeWeight(2);
      ellipse(this.position.x, this.position.y, this.size + this.flashTimer * 2.2);
    }
  }
}