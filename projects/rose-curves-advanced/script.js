const TAU = Math.PI * 2;

let maxN = 20;
let maxD = 20;
const minN = 1;
const minD = 1;

let maxNDValue = maxN; // start from your current max
let maxNDSlider = null;

let ndValues = [];
let currentIndex = 0;
let a = 0;

// animation
let travelDist = 0;
let drawSpeed = 6;

// states
const STATE_DRAW = 0;
const STATE_PAUSE = 1;
const STATE_FADE = 2;

let state = STATE_DRAW;
let pauseCounter = 0;
let pauseFrames = 60;

let fadeCounter = 0;
let fadeFrames = 50;

// colour
let colorTime = 0;
let colorSpeed = 0.002;

// tip / head
let tipLength = 25;
let tipWeight = 4;
let dotSize = 6;

// ui
let mouseX = 0;
let mouseY = 0;
let showUI = true;
let showSettings = false;

let prevButton;
let nextButton;
let hideButton;
let settingsButton;

let settingsPanel;
let sliders = [];
let settingsScroll = 0;
let settingsContentHeight = 0;

let currentAppWidth = 0;
let currentAppHeight = 0;

let touchScrollActive = false;
let touchScrollLastY = 0;

function handleUITouchStart() {
  if (!showSettings) return false;
  if (!pointInPanel(mouseX, mouseY, settingsPanel)) return false;

  const maxScroll = Math.max(0, settingsContentHeight - settingsPanel.innerH);
  if (maxScroll <= 0) return false;

  touchScrollActive = true;
  touchScrollLastY = mouseY;
  return true;
}

function handleUITouchEnd() {
  touchScrollActive = false;
}

function gcd(aVal, bVal) {
  while (bVal !== 0) {
    const t = bVal;
    bVal = aVal % bVal;
    aVal = t;
  }
  return aVal;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hueToRGB(h) {
  const s = 1;
  const v = 1;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [
    Math.floor((r + m) * 255),
    Math.floor((g + m) * 255),
    Math.floor((b + m) * 255),
  ];
}

function buildNDValues() {
  const map = new Map();

  for (let n = minN; n <= maxN; n++) {
    for (let d = minD; d <= maxD; d++) {
      const g = gcd(n, d);
      const rn = n / g;
      const rd = d / g;
      const key = `${rn}/${rd}`;

      if (!map.has(key)) {
        map.set(key, {
          n: rn,
          d: rd,
          label: rd === 1 ? String(rn) : key,
          xs: null,
          ys: null,
          segLengths: null,
          cumLengths: null,
          totalLength: 0,
          count: 0,
          ready: false,
        });
      }
    }
  }

  ndValues = Array.from(map.values()).sort((a, b) => a.n / a.d - b.n / b.d);
}

function getCurveEnd(n, d) {
  return n % 2 === 1 && d % 2 === 1 ? Math.PI * d : TAU * d;
}

function calcR(n, d, theta) {
  return a * Math.cos((n / d) * theta);
}

function buildCurvePoints(curve) {
  const step = 0.01;
  const endTheta = getCurveEnd(curve.n, curve.d);
  const count = Math.floor(endTheta / step) + 1;

  const xs = new Float32Array(count);
  const ys = new Float32Array(count);

  let theta = 0;

  for (let i = 0; i < count; i++) {
    const r = calcR(curve.n, curve.d, theta);
    xs[i] = r * Math.cos(theta);
    ys[i] = r * Math.sin(theta);
    theta += step;
  }

  const segLengths = new Float32Array(count - 1);
  const cumLengths = new Float32Array(count);

  cumLengths[0] = 0;
  let total = 0;

  for (let i = 0; i < count - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    const dy = ys[i + 1] - ys[i];
    const len = Math.hypot(dx, dy);

    segLengths[i] = len;
    total += len;
    cumLengths[i + 1] = total;
  }

  curve.xs = xs;
  curve.ys = ys;
  curve.segLengths = segLengths;
  curve.cumLengths = cumLengths;
  curve.totalLength = total;
  curve.count = count;
  curve.ready = true;
}

function drawCurvePartial(
  ctx,
  curve,
  width,
  height,
  dist,
  alpha = 1,
  color = "white",
) {
  if (!curve.ready) buildCurvePoints(curve);

  const cx = width * 0.5;
  const cy = height * 0.5;

  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2;

  ctx.beginPath();

  let started = false;

  for (let i = 0; i < curve.count - 1; i++) {
    if (curve.cumLengths[i] > dist) break;

    const x1 = cx + curve.xs[i];
    const y1 = cy + curve.ys[i];

    if (!started) {
      ctx.moveTo(x1, y1);
      started = true;
    } else {
      ctx.lineTo(x1, y1);
    }

    if (curve.cumLengths[i + 1] > dist) {
      const segLen = curve.segLengths[i];
      const t = segLen > 0 ? (dist - curve.cumLengths[i]) / segLen : 0;

      const x2 = curve.xs[i] + (curve.xs[i + 1] - curve.xs[i]) * t;
      const y2 = curve.ys[i] + (curve.ys[i + 1] - curve.ys[i]) * t;

      ctx.lineTo(cx + x2, cy + y2);
      break;
    }
  }

  ctx.stroke();
  ctx.globalAlpha = 1;
}

function getPointAtDistance(curve, dist) {
  if (!curve.ready) buildCurvePoints(curve);

  const xs = curve.xs;
  const ys = curve.ys;
  const cum = curve.cumLengths;
  const seg = curve.segLengths;

  if (dist <= 0) {
    return { x: xs[0], y: ys[0] };
  }

  if (dist >= curve.totalLength) {
    return { x: xs[curve.count - 1], y: ys[curve.count - 1] };
  }

  let i = 0;
  while (i < curve.count - 1 && cum[i + 1] < dist) {
    i++;
  }

  if (i >= curve.count - 1) {
    return { x: xs[curve.count - 1], y: ys[curve.count - 1] };
  }

  const segLen = seg[i];
  if (segLen === 0) {
    return { x: xs[i], y: ys[i] };
  }

  const t = (dist - cum[i]) / segLen;

  return {
    x: xs[i] + (xs[i + 1] - xs[i]) * t,
    y: ys[i] + (ys[i + 1] - ys[i]) * t,
  };
}

function drawTipAndDot(ctx, curve, width, height, dist, alpha, rgb) {
  if (dist <= 0) return;

  const cx = width * 0.5;
  const cy = height * 0.5;

  const startDist = Math.max(0, dist - tipLength);
  const tail = getPointAtDistance(curve, startDist);
  const head = getPointAtDistance(curve, dist);

  const [r, g, b] = rgb;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.28 * alpha})`;
  ctx.lineWidth = tipWeight * 2.2;
  ctx.beginPath();
  ctx.moveTo(tail.x, tail.y);
  ctx.lineTo(head.x, head.y);
  ctx.stroke();

  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  ctx.lineWidth = tipWeight;
  ctx.beginPath();
  ctx.moveTo(tail.x, tail.y);
  ctx.lineTo(head.x, head.y);
  ctx.stroke();

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.22 * alpha})`;
  ctx.beginPath();
  ctx.arc(head.x, head.y, dotSize * 4 * 0.5, 0, TAU);
  ctx.fill();

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.48 * alpha})`;
  ctx.beginPath();
  ctx.arc(head.x, head.y, dotSize * 2.4 * 0.5, 0, TAU);
  ctx.fill();

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  ctx.beginPath();
  ctx.arc(head.x, head.y, dotSize * 1.2 * 0.5, 0, TAU);
  ctx.fill();

  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.arc(head.x, head.y, dotSize * 0.65 * 0.5, 0, TAU);
  ctx.fill();

  ctx.restore();
}

function nextCurve() {
  currentIndex = (currentIndex + 1) % ndValues.length;
  resetAnimation();
}

function prevCurve() {
  currentIndex = (currentIndex - 1 + ndValues.length) % ndValues.length;
  resetAnimation();
}

function resetAnimation() {
  travelDist = 0;
  pauseCounter = 0;
  fadeCounter = 0;
  state = STATE_DRAW;
}

function buildButtons(width, height) {
  const bw = 70;
  const bh = 36;
  const y = height - 54;

  prevButton = {
    x: width * 0.5 - 90,
    y,
    w: bw,
    h: bh,
    label: "Prev",
  };

  nextButton = {
    x: width * 0.5 + 20,
    y,
    w: bw,
    h: bh,
    label: "Next",
  };

  hideButton = {
    x: width - 74,
    y: 18,
    w: 56,
    h: 34,
    label: showUI ? "Hide" : "Show",
  };

  settingsButton = {
    x: 18,
    y: 18,
    w: 76,
    h: 34,
    label: "Settings",
  };
}

function buildSettingsPanel(width, height) {
  const panelWidth = Math.min(340, width - 24);

  settingsPanel = {
    x: 12,
    y: 64,
    w: panelWidth,
    h: 430,
    pad: 14,
    titleH: 30,
  };

  settingsPanel.h = Math.min(settingsPanel.h, height - 90);
  settingsPanel.innerX = settingsPanel.x + settingsPanel.pad;
  settingsPanel.innerY = settingsPanel.y + settingsPanel.titleH + 12;
  settingsPanel.innerW = settingsPanel.w - settingsPanel.pad * 2 - 8;
  settingsPanel.innerH = settingsPanel.h - settingsPanel.titleH - 24;
}

class SliderControl {
  constructor(
    x,
    y,
    w,
    minVal,
    maxVal,
    value,
    decimals,
    label,
    description,
    onChange,
  ) {
    this.x = x;
    this.baseY = y;
    this.w = w;
    this.h = 16;
    this.minVal = minVal;
    this.maxVal = maxVal;
    this.value = value;
    this.decimals = decimals;
    this.label = label;
    this.description = description;
    this.onChange = onChange;
    this.dragging = false;
  }

  get y() {
    return this.baseY - settingsScroll;
  }

  getNormalized() {
    return (this.value - this.minVal) / (this.maxVal - this.minVal);
  }

  knobX() {
    return this.x + this.w * this.getNormalized();
  }

  isVisible() {
    return (
      this.y + 56 >= settingsPanel.innerY &&
      this.y - 28 <= settingsPanel.innerY + settingsPanel.innerH
    );
  }

  isOver(mx, my) {
    return (
      mx >= this.x &&
      mx <= this.x + this.w &&
      my >= this.y + 16 &&
      my <= this.y + 48
    );
  }

  setFromMouse(mx) {
    const t = clamp((mx - this.x) / this.w, 0, 1);
    const raw = lerp(this.minVal, this.maxVal, t);
    const factor = Math.pow(10, this.decimals);
    this.value = Math.round(raw * factor) / factor;
    this.onChange(this.value);
  }

  handlePress(mx, my) {
    if (!this.isVisible()) return;
    if (this.isOver(mx, my)) {
      this.dragging = true;
      this.setFromMouse(mx);
    }
  }

  handleDrag(mx) {
    if (this.dragging) {
      this.setFromMouse(mx);
    }
  }

  handleRelease() {
    this.dragging = false;
  }

  draw(ctx) {
    if (!this.isVisible()) return;

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "13px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(
      `${this.label}: ${this.value.toFixed(this.decimals)}`,
      this.x,
      this.y - 24,
    );

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "11px Arial";
    wrapText(ctx, this.description, this.x, this.y - 6, this.w, 13);

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    roundRect(ctx, this.x, this.y + 24, this.w, this.h, 8);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.32)";
    roundRect(
      ctx,
      this.x,
      this.y + 24,
      this.w * this.getNormalized(),
      this.h,
      8,
    );
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.beginPath();
    ctx.arc(this.knobX(), this.y + 24 + this.h * 0.5, 7, 0, TAU);
    ctx.fill();
  }
}

function buildSliders() {
  sliders = [];

  const x = settingsPanel.innerX;
  let y = settingsPanel.innerY + 38;
  const w = settingsPanel.innerW;
  const gap = 82;

  maxNDSlider = new SliderControl(
    x,
    y,
    w,
    1,
    30,
    maxNDValue,
    0,
    "Max N and D",
    "Sets the highest N and D values used when generating the curve list.",
    (v) => {
      applyMaxND(v);
    },
  );
  sliders.push(maxNDSlider);
  y += gap;

  sliders.push(
    new SliderControl(
      x,
      y,
      w,
      1,
      300,
      drawSpeed,
      0,
      "Draw speed",
      "How many pixels of the curve are traced each frame. Higher values make the line animate faster.",
      (v) => {
        drawSpeed = v;
      },
    ),
  );
  y += gap;

  sliders.push(
    new SliderControl(
      x,
      y,
      w,
      0,
      180,
      pauseFrames,
      0,
      "Pause frames",
      "How long the completed curve stays visible before it begins fading out.",
      (v) => {
        pauseFrames = v;
      },
    ),
  );
  y += gap;

  sliders.push(
    new SliderControl(
      x,
      y,
      w,
      1,
      180,
      fadeFrames,
      0,
      "Fade frames",
      "How many frames are used for the fade. Higher values create a slower fade.",
      (v) => {
        fadeFrames = v;
      },
    ),
  );
  y += gap;

  sliders.push(
    new SliderControl(
      x,
      y,
      w,
      0.0001,
      0.03,
      colorSpeed,
      5,
      "Colour speed",
      "Controls how quickly the curve colour cycles through hues over time.",
      (v) => {
        colorSpeed = v;
      },
    ),
  );
  y += gap;

  sliders.push(
    new SliderControl(
      x,
      y,
      w,
      5,
      60,
      tipLength,
      0,
      "Tip length",
      "Changes the length of the glowing trailing segment behind the moving head.",
      (v) => {
        tipLength = v;
      },
    ),
  );
  y += gap;

  sliders.push(
    new SliderControl(
      x,
      y,
      w,
      2,
      20,
      dotSize,
      0,
      "Dot size",
      "Adjusts the size of the bright moving head at the front of the curve.",
      (v) => {
        dotSize = v;
      },
    ),
  );
  y += gap;

  sliders.push(
    new SliderControl(
      x,
      y,
      w,
      0.2,
      0.48,
      a / Math.min(currentAppWidth || 1, currentAppHeight || 1),
      2,
      "Curve scale",
      "Changes the overall size of the rose curve relative to the canvas.",
      (v) => {
        curveScaleApply(v);
      },
    ),
  );

  settingsContentHeight = y + 72 - settingsPanel.innerY;
}

function curveScaleApply(scale) {
  a = Math.min(currentAppWidth, currentAppHeight) * scale;
  for (const c of ndValues) {
    c.ready = false;
  }
  resetAnimation();
}

function pointInButton(px, py, btn) {
  return (
    px >= btn.x && px <= btn.x + btn.w && py >= btn.y && py <= btn.y + btn.h
  );
}

function pointInPanel(px, py, panel) {
  return (
    px >= panel.x &&
    px <= panel.x + panel.w &&
    py >= panel.y &&
    py <= panel.y + panel.h
  );
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let yPos = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && line) {
      ctx.fillText(line, x, yPos);
      line = words[i];
      yPos += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) {
    ctx.fillText(line, x, yPos);
  }
}

function drawButton(ctx, btn, active = false) {
  const hovered = pointInButton(mouseX, mouseY, btn);

  const fillAlpha = active ? 0.22 : hovered ? 0.18 : 0.1;
  const strokeAlpha = active ? 0.9 : hovered ? 0.7 : 0.45;

  ctx.fillStyle = `rgba(255,255,255,${fillAlpha})`;
  roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
  ctx.fill();

  ctx.strokeStyle = `rgba(255,255,255,${strokeAlpha})`;
  ctx.lineWidth = 1.5;
  roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.98)";
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(btn.label, btn.x + btn.w * 0.5, btn.y + btn.h * 0.5);
}

function drawScrollBar(ctx) {
  const maxScroll = Math.max(0, settingsContentHeight - settingsPanel.innerH);
  if (maxScroll <= 0) return;

  const trackX = settingsPanel.x + settingsPanel.w - 10;
  const trackY = settingsPanel.innerY;
  const trackH = settingsPanel.innerH;
  const thumbH = Math.max(
    28,
    trackH * (settingsPanel.innerH / settingsContentHeight),
  );
  const thumbY =
    settingsPanel.innerY + (settingsScroll / maxScroll) * (trackH - thumbH);

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  roundRect(ctx, trackX, trackY, 4, trackH, 4);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  roundRect(ctx, trackX, thumbY, 4, thumbH, 4);
  ctx.fill();
}

function drawSettingsPanel(ctx) {
  ctx.fillStyle = "rgba(0,0,0,0.82)";
  roundRect(
    ctx,
    settingsPanel.x,
    settingsPanel.y,
    settingsPanel.w,
    settingsPanel.h,
    14,
  );
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 1.2;
  roundRect(
    ctx,
    settingsPanel.x,
    settingsPanel.y,
    settingsPanel.w,
    settingsPanel.h,
    14,
  );
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.font = "18px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(
    "Settings",
    settingsPanel.x + settingsPanel.pad,
    settingsPanel.y + 12,
  );

  ctx.save();
  ctx.beginPath();
  ctx.rect(
    settingsPanel.innerX,
    settingsPanel.innerY,
    settingsPanel.innerW,
    settingsPanel.innerH,
  );
  ctx.clip();

  for (const slider of sliders) {
    slider.draw(ctx);
  }

  ctx.restore();
  drawScrollBar(ctx);
}

function handleUIPress() {
  hideButton.label = showUI ? "Hide" : "Show";

  if (pointInButton(mouseX, mouseY, hideButton)) {
    showUI = !showUI;

    if (!showUI) {
      showSettings = false;
    }

    hideButton.label = showUI ? "Hide" : "Show";
    return;
  }

  if (showUI && pointInButton(mouseX, mouseY, settingsButton)) {
    showSettings = !showSettings;
    return;
  }

  if (showUI && showSettings && pointInPanel(mouseX, mouseY, settingsPanel)) {
    touchScrollActive = false;
    for (const slider of sliders) {
      slider.handlePress(mouseX, mouseY);
    }
    return;
  }

  if (!showUI) return;

  if (pointInButton(mouseX, mouseY, prevButton)) {
    prevCurve();
  } else if (pointInButton(mouseX, mouseY, nextButton)) {
    nextCurve();
  }
}

function handleUIDrag() {
  if (!showSettings) return;
  for (const slider of sliders) {
    slider.handleDrag(mouseX);
  }
}

function handleUIRelease() {
  for (const slider of sliders) {
    slider.handleRelease();
  }
}

function handleUIWheel(deltaY) {
  if (!showSettings) return false;
  if (!pointInPanel(mouseX, mouseY, settingsPanel)) return false;

  const maxScroll = Math.max(0, settingsContentHeight - settingsPanel.innerH);
  if (maxScroll <= 0) return false;

  settingsScroll += deltaY * 0.6;
  settingsScroll = clamp(settingsScroll, 0, maxScroll);
  return true;
}

bootProject({
  setup(app) {
    currentAppWidth = app.width;
    currentAppHeight = app.height;

    a = Math.min(app.width, app.height) * 0.38;
    buildNDValues();
    maxNDValue = maxN;
    buildButtons(app.width, app.height);
    buildSettingsPanel(app.width, app.height);
    buildSliders();
  },

  onResize(app) {
    currentAppWidth = app.width;
    currentAppHeight = app.height;

    settingsScroll = 0;
    buildButtons(app.width, app.height);
    buildSettingsPanel(app.width, app.height);
    buildSliders();

    for (const c of ndValues) {
      c.ready = false;
    }
  },

  onPointerDown(app) {
    mouseX = app.pointer.x;
    mouseY = app.pointer.y;

    handleUIPress();

    if (showUI && showSettings && pointInPanel(mouseX, mouseY, settingsPanel)) {
      touchScrollLastY = mouseY;
      touchScrollActive = false;
    }
  },

  onPointerMove(app) {
    mouseX = app.pointer.x;
    mouseY = app.pointer.y;

    if (
      app.pointer.down &&
      showSettings &&
      pointInPanel(mouseX, mouseY, settingsPanel)
    ) {
      const maxScroll = Math.max(
        0,
        settingsContentHeight - settingsPanel.innerH,
      );

      if (maxScroll > 0) {
        const dy = mouseY - touchScrollLastY;

        if (Math.abs(dy) > 4 || touchScrollActive) {
          touchScrollActive = true;
          settingsScroll -= dy;
          settingsScroll = clamp(settingsScroll, 0, maxScroll);
          touchScrollLastY = mouseY;
          return;
        }
      }
    }

    handleUIDrag();
  },

  onPointerUp() {
    handleUITouchEnd();
    handleUIRelease();
  },

  update() {
    const curve = ndValues[currentIndex];

    colorTime += colorSpeed;

    if (!curve.ready) return;

    if (state === STATE_DRAW) {
      travelDist += drawSpeed;

      if (travelDist >= curve.totalLength) {
        travelDist = curve.totalLength;
        state = STATE_PAUSE;
        pauseCounter = 0;
      }
    } else if (state === STATE_PAUSE) {
      pauseCounter++;

      if (pauseCounter >= pauseFrames) {
        state = STATE_FADE;
        fadeCounter = 0;
      }
    } else if (state === STATE_FADE) {
      fadeCounter++;

      if (fadeCounter >= fadeFrames) {
        nextCurve();
      }
    }
  },

  draw(app) {
    const ctx = app.ctx;
    const curve = ndValues[currentIndex];

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, app.width, app.height);

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(app.width * 0.5, app.height * 0.5, a, 0, TAU);
    ctx.stroke();

    const hue = (colorTime * 360) % 360;
    const rgb = hueToRGB(hue);
    const color = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;

    let alpha = 1;
    if (state === STATE_FADE) {
      alpha = 1 - fadeCounter / fadeFrames;
    }

    drawCurvePartial(
      ctx,
      curve,
      app.width,
      app.height,
      travelDist,
      alpha,
      color,
    );

    if (state === STATE_DRAW || state === STATE_PAUSE || state === STATE_FADE) {
      drawTipAndDot(ctx, curve, app.width, app.height, travelDist, alpha, rgb);
    }

    if (showUI) {
      drawButton(ctx, prevButton);
      drawButton(ctx, nextButton);
      drawButton(ctx, settingsButton, showSettings);

      if (showSettings) {
        drawSettingsPanel(ctx);
      }

      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`n/d = ${curve.label}`, 16, 64);
    }

    // ALWAYS draw hide button
    hideButton.label = showUI ? "Hide" : "Show";
    drawButton(ctx, hideButton, !showUI);
  },
});

document.addEventListener(
  "wheel",
  (event) => {
    if (handleUIWheel(event.deltaY)) {
      event.preventDefault();
    }
  },
  { passive: false },
);

document.addEventListener(
  "touchmove",
  (e) => {
    if (touchScrollActive) {
      e.preventDefault();
    }
  },
  { passive: false },
);

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  // Hide UI
  if (key === "h") {
    showUI = !showUI;

    if (!showUI) {
      showSettings = false;
      touchScrollActive = false;
    }

    hideButton.label = showUI ? "Hide" : "Show";
    event.preventDefault();
    return;
  }

  // Toggle settings
  if (key === "s") {
    if (!showUI) return;

    showSettings = !showSettings;
    touchScrollActive = false;
    event.preventDefault();
    return;
  }

  // 👉 Arrow keys
  if (event.key === "ArrowRight") {
    nextCurve();
    event.preventDefault();
    return;
  }

  if (event.key === "ArrowLeft") {
    prevCurve();
    event.preventDefault();
    return;
  }
});
function applyMaxND(value) {
  const newValue = Math.round(value);

  if (newValue === maxNDValue) return;

  maxNDValue = newValue;
  maxN = newValue;
  maxD = newValue;

  // rebuild every available reduced n/d combination
  buildNDValues();

  // start back at the first valid curve
  currentIndex = 0;

  // reset animation state
  resetAnimation();

  // reset settings scroll so layout stays clean
  settingsScroll = 0;

  // rebuild panel + sliders so labels/ranges stay correct
  buildSettingsPanel(currentAppWidth, currentAppHeight);
  buildSliders();
}
