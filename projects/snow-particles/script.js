let COUNT = 0;
const PARTICLE_DENSITY = 0.001;
const MAX_PARTICLES = 3000;

let posX;
let posY;

let velX;
let velY;

let driftX;
let grav;
let maxSpeed;

let sizeArr;
let tierArr;

function createParticles(app) {
  COUNT = Math.min(
    Math.floor(app.width * app.height * PARTICLE_DENSITY),
    MAX_PARTICLES,
  );

  posX = new Float32Array(COUNT);
  posY = new Float32Array(COUNT);
  velX = new Float32Array(COUNT);
  velY = new Float32Array(COUNT);
  driftX = new Float32Array(COUNT);
  grav = new Float32Array(COUNT);
  maxSpeed = new Float32Array(COUNT);
  sizeArr = new Uint8Array(COUNT);
  tierArr = new Uint8Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    posX[i] = Math.random() * app.width;
    posY[i] = -Math.random() * app.height;
    resetParticle(i);
  }
}

function resetParticle(i) {
  const t = (Math.random() * 3) | 0;
  tierArr[i] = t;

  if (t === 0) {
    sizeArr[i] = 1;
    grav[i] = 0.02;
    maxSpeed[i] = 0.7;
    driftX[i] = (Math.random() - 0.5) * 0.15;
  } else if (t === 1) {
    sizeArr[i] = 2;
    grav[i] = 0.04;
    maxSpeed[i] = 1.3;
    driftX[i] = (Math.random() - 0.5) * 0.25;
  } else {
    sizeArr[i] = 3;
    grav[i] = 0.07;
    maxSpeed[i] = 2.0;
    driftX[i] = (Math.random() - 0.5) * 0.35;
  }

  velY[i] = Math.random() * maxSpeed[i];
  velX[i] = 0;
}

function respawnParticle(i, app) {
  posX[i] = Math.random() * app.width;
  posY[i] = -Math.random() * Math.max(50, app.height * 0.05);
  resetParticle(i);
}

function explode(cx, cy, radius, force) {
  const r2 = radius * radius;

  for (let i = 0; i < COUNT; i++) {
    const dx = posX[i] - cx;
    const dy = posY[i] - cy;
    const distSq = dx * dx + dy * dy;

    if (distSq > 1 && distSq < r2) {
      const push = (1 - distSq / r2) * force * 0.05;
      velX[i] += dx * push;
      velY[i] += dy * push;
    }
  }
}

bootProject({
  dprCap: 2,
  pauseWhenHidden: true,

  setup(app) {
    createParticles(app);
  },
  onResize(app) {
    createParticles(app);
  },

  onPointerDown(app) {
    explode(app.pointer.x, app.pointer.y, 80, 6);
  },

  onPointerMove(app) {
    if (app.pointer.down) {
      explode(app.pointer.x, app.pointer.y, 50, 1.8);
    }
  },

  update(app) {
    const oddFrame = app.frame & 1;

    for (let i = 0; i < COUNT; i++) {
      if (tierArr[i] !== 0 || oddFrame === 0) {
        velY[i] += grav[i];
        if (velY[i] > maxSpeed[i]) velY[i] = maxSpeed[i];

        posX[i] += velX[i] + driftX[i];
        posY[i] += velY[i];

        velX[i] *= 0.985;

        if (posX[i] < 0) posX[i] += app.width;
        else if (posX[i] > app.width) posX[i] -= app.width;

        if (posY[i] > app.height) {
          respawnParticle(i, app);
        }
      }
    }
  },

  draw(app) {
    const ctx = app.ctx;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, app.width, app.height);

    ctx.fillStyle = "#fff";

    for (let i = 0; i < COUNT; i++) {
      ctx.fillRect(posX[i], posY[i], sizeArr[i], sizeArr[i]);
    }
  },
});
