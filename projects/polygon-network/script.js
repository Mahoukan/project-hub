const TWO_PI = Math.PI * 2;

let n = 3;
let radius = 0;
let angleOffset = 0;
let rotationSpeed = 0.01;

let isPaused = false;
let showTrail = false;
let fillPolygon = false;
let uiInteracted = false;
let panelVisible = true;

const MIN_POINTS = 1;
const MAX_POINTS = 150;

let pointSize = 6;
let lineAlpha = 255;
let lineThickness = 1;
let pointAlpha = 255;
let fillAlpha = 90;
let hueSpeed = 1;
let hueSpread = 1;
let trailFade = 18;
let radiusScale = 0.375;

let frameCount = 0;
let ui;

const pointer = {
  x: 0,
  y: 0,
  down: false,
  startedInsideCanvas: false
};

let canvas;
let ctx;
let stage;
let width = 0;
let height = 0;
let dpr = Math.max(1, window.devicePixelRatio || 1);

document.addEventListener("DOMContentLoaded", init);

function init() {
  stage = document.getElementById("project-stage");
  canvas = document.getElementById("polygon-canvas");
  ctx = canvas.getContext("2d");

  resizeCanvas();

  ctx.font = '14px "Courier New", monospace';

  ui = new ControlPanel(16, 16, getPanelWidth(), getPanelHeight());
  buildUI();

  attachEvents();
  requestAnimationFrame(loop);
}

function buildUI() {
  ui.clearItems();

  ui.addSlider("Speed", -0.1, 0.1, rotationSpeed, 0.001, (v) => {
    rotationSpeed = v;
  });

  ui.addSlider("Points", MIN_POINTS, MAX_POINTS, n, 1, (v) => {
    n = Math.floor(v);
  });

  ui.addSlider("Radius", 0.15, 0.48, radiusScale, 0.005, (v) => {
    radiusScale = v;
    updateRadius();
  });

  ui.addSlider("Line Alpha", 0, 255, lineAlpha, 1, (v) => {
    lineAlpha = Math.floor(v);
  });

  ui.addSlider("Line Width", 0.5, 4, lineThickness, 0.1, (v) => {
    lineThickness = v;
  });

  ui.addSlider("Point Size", 2, 18, pointSize, 1, (v) => {
    pointSize = Math.floor(v);
  });

  ui.addSlider("Point Alpha", 0, 255, pointAlpha, 1, (v) => {
    pointAlpha = Math.floor(v);
  });

  ui.addSlider("Fill Alpha", 0, 255, fillAlpha, 1, (v) => {
    fillAlpha = Math.floor(v);
  });

  ui.addSlider("Hue Speed", 0, 8, hueSpeed, 0.05, (v) => {
    hueSpeed = v;
  });

  ui.addSlider("Hue Spread", 0, 4, hueSpread, 0.05, (v) => {
    hueSpread = v;
  });

  ui.addSlider("Trail Fade", 0, 80, trailFade, 1, (v) => {
    trailFade = Math.floor(v);
  });

  ui.addToggle("Paused", isPaused, (v) => {
    isPaused = v;
  });

  ui.addToggle("Trail", showTrail, (v) => {
    showTrail = v;
  });

  ui.addToggle("Fill Polygon", fillPolygon, (v) => {
    fillPolygon = v;
  });

  ui.addButton("Reset Rotation", () => {
    angleOffset = 0;
  });

  ui.addButton("Reset Visuals", () => {
    lineAlpha = 255;
    lineThickness = 1;
    pointSize = 6;
    pointAlpha = 255;
    fillAlpha = 90;
    hueSpeed = 1;
    hueSpread = 1;
    trailFade = 18;
    radiusScale = 0.375;
    updateRadius();

    ui.setSliderValue("Line Alpha", lineAlpha);
    ui.setSliderValue("Line Width", lineThickness);
    ui.setSliderValue("Point Size", pointSize);
    ui.setSliderValue("Point Alpha", pointAlpha);
    ui.setSliderValue("Fill Alpha", fillAlpha);
    ui.setSliderValue("Hue Speed", hueSpeed);
    ui.setSliderValue("Hue Spread", hueSpread);
    ui.setSliderValue("Trail Fade", trailFade);
    ui.setSliderValue("Radius", radiusScale);
  });

  ui.addButton("Save PNG", () => {
    saveCanvasImage();
  });
}

function attachEvents() {
  window.addEventListener("resize", resizeCanvas);

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  window.addEventListener("keydown", onKeyDown);
}

function loop() {
  frameCount += 1;
  draw();
  requestAnimationFrame(loop);
}

function draw() {
  drawBackground();

  const cx = width * 0.5;
  const cy = height * 0.5;

  if (fillPolygon && n >= 3) {
    const fillRgb = hsbToRgb((frameCount * 2) % 255, 180, 255);
    ctx.fillStyle = rgba(fillRgb.r, fillRgb.g, fillRgb.b, fillAlpha / 255);

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = angleOffset + (TWO_PI * i) / n;
      const x = cx + radius * Math.cos(a);
      const y = cy + radius * Math.sin(a);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.lineWidth = lineThickness;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < n; i++) {
    const a1 = angleOffset + (TWO_PI * i) / n;
    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy + radius * Math.sin(a1);

    for (let j = i + 1; j < n; j++) {
      const a2 = angleOffset + (TWO_PI * j) / n;
      const x2 = cx + radius * Math.cos(a2);
      const y2 = cy + radius * Math.sin(a2);

      const hue = mapValue((i + j) * hueSpread, 0, Math.max(1, n * 2), 0, 255);
      const rgb = hsbToRgb((frameCount * hueSpeed + hue) % 255, 200, 255);

      ctx.strokeStyle = rgba(rgb.r, rgb.g, rgb.b, lineAlpha / 255);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  ctx.fillStyle = rgba(255, 255, 255, pointAlpha / 255);
  for (let i = 0; i < n; i++) {
    const a = angleOffset + (TWO_PI * i) / n;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);

    ctx.beginPath();
    ctx.arc(x, y, pointSize * 0.5, 0, TWO_PI);
    ctx.fill();
  }

  if (!isPaused) {
    angleOffset += rotationSpeed;
  }

  if (panelVisible) {
    ui.draw(ctx);
  }
}

function drawBackground() {
  if (!showTrail) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = `rgba(0, 0, 0, ${trailFade / 255})`;
    ctx.fillRect(0, 0, width, height);
  }
}

function updateRadius() {
  radius = Math.min(width, height) * radiusScale;
}

function resizeCanvas() {
  const { stageWidth, stageHeight } = getStageSize();

  stage.style.height = `${stageHeight}px`;

  width = stageWidth;
  height = stageHeight;
  dpr = Math.max(1, window.devicePixelRatio || 1);

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.textBaseline = "middle";
  ctx.textFont = '14px "Courier New", monospace';

  updateRadius();

  if (ui) {
    ui.w = getPanelWidth();
    ui.maxH = getPanelHeight();
    ui.touchMode = isTouchLikeLayout();
    ui.updateMetrics();
    ui.clampToScreen();
  }
}

function getStageSize() {
  const stageWidth = Math.max(280, stage?.clientWidth || 600);
  const stageHeight = Math.max(320, Math.min(window.innerHeight - 180, 720));
  return { stageWidth, stageHeight };
}

function getPanelWidth() {
  if (width < 520) return Math.min(width - 20, 300);
  return Math.min(340, width * 0.42);
}

function getPanelHeight() {
  return Math.min(height - 20, height * 0.82);
}

function isTouchLikeLayout() {
  return width < 700 || "ontouchstart" in window;
}

function onPointerDown(event) {
  updatePointer(event);
  pointer.down = true;
  pointer.startedInsideCanvas = insideCanvas(pointer.x, pointer.y);

  uiInteracted = panelVisible ? ui.pointerPressed(pointer.x, pointer.y) : false;
  if (uiInteracted) event.preventDefault();
}

function onPointerMove(event) {
  updatePointer(event);

  if (!pointer.down) return;

  if (panelVisible && ui.pointerDragged(pointer.x, pointer.y)) {
    event.preventDefault();
  }
}

function onPointerUp(event) {
  updatePointer(event);

  if (panelVisible) ui.pointerReleased();

  if (uiInteracted) {
    uiInteracted = false;
    pointer.down = false;
    return;
  }

  if (pointer.startedInsideCanvas && insideCanvas(pointer.x, pointer.y)) {
    n = constrain(n + 1, MIN_POINTS, MAX_POINTS);
    ui.setSliderValue("Points", n);
  }

  pointer.down = false;
}

function onWheel(event) {
  updatePointer(event);

  if (panelVisible && ui.wheel(event.deltaY, pointer.x, pointer.y)) {
    event.preventDefault();
  }
}

function onKeyDown(event) {
  const key = event.key;

  if (key === " ") {
    event.preventDefault();
    isPaused = !isPaused;
    ui.setToggleValue("Paused", isPaused);
    return;
  }

  if (key === "t" || key === "T") {
    showTrail = !showTrail;
    ui.setToggleValue("Trail", showTrail);
  } else if (key === "f" || key === "F") {
    fillPolygon = !fillPolygon;
    ui.setToggleValue("Fill Polygon", fillPolygon);
  } else if (key === "r" || key === "R") {
    angleOffset = 0;
  } else if (key === "s" || key === "S") {
    saveCanvasImage();
  } else if (key === "h" || key === "H") {
    panelVisible = !panelVisible;
  } else if (key === "ArrowUp") {
    event.preventDefault();
    n = constrain(n + 1, MIN_POINTS, MAX_POINTS);
    ui.setSliderValue("Points", n);
  } else if (key === "ArrowDown") {
    event.preventDefault();
    n = constrain(n - 1, MIN_POINTS, MAX_POINTS);
    ui.setSliderValue("Points", n);
  } else if (key === "ArrowLeft") {
    event.preventDefault();
    n = MIN_POINTS;
    ui.setSliderValue("Points", n);
  } else if (key === "ArrowRight") {
    event.preventDefault();
    n = constrain(n + 10, MIN_POINTS, MAX_POINTS);
    ui.setSliderValue("Points", n);
  }
}

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = event.clientX - rect.left;
  pointer.y = event.clientY - rect.top;
}

function insideCanvas(x, y) {
  return x >= 0 && x <= width && y >= 0 && y <= height;
}

function saveCanvasImage() {
  const link = document.createElement("a");
  link.download = "polygon_network.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

class ControlPanel {
  constructor(x, y, w, maxH) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.maxH = maxH;

    this.items = [];
    this.hidden = false;

    this.dragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.activeItem = null;

    this.scrollOffset = 0;
    this.scrollGrabbed = false;
    this.scrollBarW = 10;

    this.contentDragScrolling = false;
    this.contentDragStartY = 0;
    this.contentStartOffset = 0;

    this.touchMode = isTouchLikeLayout();
    this.updateMetrics();
  }

  updateMetrics() {
    this.headerH = this.touchMode ? 38 : 30;
    this.rowH = this.touchMode ? 38 : 30;
    this.padding = this.touchMode ? 14 : 12;
    this.hiddenButtonW = this.touchMode ? 42 : 34;
    this.hiddenButtonH = this.touchMode ? 34 : 28;
    this.sliderKnobSize = this.touchMode ? 16 : 12;
    this.textSize = this.touchMode ? 14 : 13;
  }

  clearItems() {
    this.items = [];
  }

  addSlider(label, min, max, value, step, onChange) {
    this.items.push({ type: "slider", label, min, max, value, step, onChange });
  }

  addToggle(label, value, onChange) {
    this.items.push({ type: "toggle", label, value, onChange });
  }

  addButton(label, onClick) {
    this.items.push({ type: "button", label, onClick });
  }

  setSliderValue(label, value) {
    for (const item of this.items) {
      if (item.type === "slider" && item.label === label) {
        item.value = value;
        item.onChange?.(value);
        return;
      }
    }
  }

  setToggleValue(label, value) {
    for (const item of this.items) {
      if (item.type === "toggle" && item.label === label) {
        item.value = value;
        item.onChange?.(value);
        return;
      }
    }
  }

  getContentHeight() {
    return this.padding * 2 + this.items.length * this.rowH;
  }

  getVisibleContentHeight() {
    const fullH = Math.min(this.maxH, this.headerH + this.getContentHeight());
    return Math.max(0, fullH - this.headerH);
  }

  getFullHeight() {
    if (this.hidden) return this.hiddenButtonH;
    return Math.min(this.maxH, this.headerH + this.getContentHeight());
  }

  getMaxScroll() {
    return Math.max(0, this.getContentHeight() - this.getVisibleContentHeight());
  }

  clampScroll() {
    this.scrollOffset = constrain(this.scrollOffset, 0, this.getMaxScroll());
  }

  clampToScreen() {
    const currentW = this.hidden ? this.hiddenButtonW : this.w;
    const currentH = this.getFullHeight();
    this.x = constrain(this.x, 0, width - currentW);
    this.y = constrain(this.y, 0, height - currentH);
    this.clampScroll();
  }

  contains(mx, my) {
    if (this.hidden) {
      return (
        mx >= this.x &&
        mx <= this.x + this.hiddenButtonW &&
        my >= this.y &&
        my <= this.y + this.hiddenButtonH
      );
    }

    return (
      mx >= this.x &&
      mx <= this.x + this.w &&
      my >= this.y &&
      my <= this.y + this.getFullHeight()
    );
  }

  contentContains(mx, my) {
    if (this.hidden) return false;
    const top = this.y + this.headerH;
    const h = this.getVisibleContentHeight();
    return mx >= this.x && mx <= this.x + this.w && my >= top && my <= top + h;
  }

  draw(ctx) {
    if (this.hidden) {
      this.drawHiddenButton(ctx);
      return;
    }

    this.clampScroll();

    const fullH = this.getFullHeight();
    const contentY = this.y + this.headerH;
    const contentH = this.getVisibleContentHeight();

    roundRectFill(ctx, this.x, this.y, this.w, fullH, 14, "rgba(18,18,28,0.88)");
    roundRectFill(ctx, this.x, this.y, this.w, this.headerH, 14, "rgba(38,38,60,0.96)", {
      bottomLeft: 0,
      bottomRight: 0
    });

    drawText(ctx, "Controls", this.x + 12, this.y + this.headerH * 0.5, {
      size: this.touchMode ? 15 : 14,
      color: "#fff",
      align: "left"
    });

    this.drawHideButton(ctx);

    ctx.save();
    ctx.beginPath();
    ctx.rect(this.x, contentY, this.w, contentH);
    ctx.clip();

    let y = contentY + this.padding - this.scrollOffset;

    for (const item of this.items) {
      if (item.type === "slider") {
        this.drawSlider(ctx, item, y);
      } else if (item.type === "toggle") {
        this.drawToggle(ctx, item, y);
      } else if (item.type === "button") {
        this.drawButton(ctx, item, y);
      }
      y += this.rowH;
    }

    ctx.restore();

    if (this.getMaxScroll() > 0) {
      this.drawScrollbar(ctx);
    }
  }

  drawHideButton(ctx) {
    const bx = this.x + this.w - 30;
    const by = this.y + 5;
    const bw = 22;
    const bh = this.touchMode ? 24 : 20;

    roundRectFill(ctx, bx, by, bw, bh, 6, "rgb(70,90,120)");
    drawText(ctx, "−", bx + bw * 0.5, by + bh * 0.5 + 1, {
      size: 16,
      color: "#fff",
      align: "center"
    });
  }

  drawHiddenButton(ctx) {
    roundRectFill(ctx, this.x, this.y, this.hiddenButtonW, this.hiddenButtonH, 10, "rgba(40,40,60,0.94)");
    drawText(ctx, "+", this.x + this.hiddenButtonW * 0.5, this.y + this.hiddenButtonH * 0.5 + 1, {
      size: this.touchMode ? 20 : 18,
      color: "#fff",
      align: "center"
    });
  }

  drawScrollbar(ctx) {
    const contentY = this.y + this.headerH;
    const contentH = this.getVisibleContentHeight();
    const trackX = this.x + this.w - this.scrollBarW - 4;
    const trackY = contentY + 4;
    const trackH = contentH - 8;

    roundRectFill(ctx, trackX, trackY, this.scrollBarW, trackH, 8, "rgba(120,120,120,0.28)");

    const total = this.getContentHeight();
    const visible = this.getVisibleContentHeight();
    const thumbH = Math.max(26, trackH * (visible / total));
    const maxThumbY = trackH - thumbH;
    const thumbY = trackY + mapValue(this.scrollOffset, 0, Math.max(1, this.getMaxScroll()), 0, maxThumbY);

    roundRectFill(ctx, trackX, thumbY, this.scrollBarW, thumbH, 8, "rgba(180,200,255,0.86)");
  }

  drawSlider(ctx, item, y) {
    if (y + this.rowH < this.y + this.headerH || y > this.y + this.getFullHeight()) return;

    const labelX = this.x + this.padding;
    const sliderX = this.x + Math.max(100, this.w * 0.4);
    const rightPad = this.scrollBarW + 14;
    const sliderW = this.w - (sliderX - this.x) - rightPad - this.padding;
    const sliderY = y + this.rowH * 0.58;

    drawText(ctx, item.label, labelX, y + this.rowH * 0.45, {
      size: this.textSize,
      color: "rgb(235,235,235)",
      align: "left"
    });

    ctx.strokeStyle = "rgb(120,120,120)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sliderX, sliderY);
    ctx.lineTo(sliderX + sliderW, sliderY);
    ctx.stroke();

    const t = (item.value - item.min) / (item.max - item.min);
    const knobX = lerp(sliderX, sliderX + sliderW, t);

    ctx.fillStyle = "rgb(180,200,255)";
    ctx.beginPath();
    ctx.arc(knobX, sliderY, this.sliderKnobSize * 0.5, 0, TWO_PI);
    ctx.fill();

    const valueText =
      item.step < 1
        ? Number(item.value).toFixed(3).replace(/\.?0+$/, "")
        : `${Math.floor(item.value)}`;

    drawText(ctx, valueText, this.x + this.w - rightPad, y + this.rowH * 0.45, {
      size: this.textSize,
      color: "#fff",
      align: "right"
    });
  }

  drawToggle(ctx, item, y) {
    if (y + this.rowH < this.y + this.headerH || y > this.y + this.getFullHeight()) return;

    const labelX = this.x + this.padding;
    const boxS = this.touchMode ? 20 : 18;
    const boxX = this.x + this.w - this.scrollBarW - this.padding - boxS - 6;
    const boxY = y + (this.rowH - boxS) * 0.5;

    drawText(ctx, item.label, labelX, y + this.rowH * 0.5, {
      size: this.textSize,
      color: "rgb(235,235,235)",
      align: "left"
    });

    roundRectFill(ctx, boxX, boxY, boxS, boxS, 5, item.value ? "rgb(120,200,255)" : "rgb(70,70,70)");

    if (item.value) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boxX + 4, boxY + boxS * 0.55);
      ctx.lineTo(boxX + boxS * 0.42, boxY + boxS - 4);
      ctx.lineTo(boxX + boxS - 4, boxY + 4);
      ctx.stroke();
    }
  }

  drawButton(ctx, item, y) {
    if (y + this.rowH < this.y + this.headerH || y > this.y + this.getFullHeight()) return;

    const bx = this.x + this.padding;
    const by = y + 4;
    const bw = this.w - this.padding * 2 - this.scrollBarW - 8;
    const bh = this.rowH - 8;

    roundRectFill(ctx, bx, by, bw, bh, 8, "rgb(70,90,120)");

    drawText(ctx, item.label, bx + bw * 0.5, by + bh * 0.5, {
      size: this.textSize,
      color: "#fff",
      align: "center"
    });
  }

  pointerPressed(mx, my) {
    if (!this.contains(mx, my)) return false;

    if (this.hidden) {
      this.hidden = false;
      return true;
    }

    const hideBX = this.x + this.w - 30;
    const hideBY = this.y + 5;
    const hideBW = 22;
    const hideBH = this.touchMode ? 24 : 20;

    if (mx >= hideBX && mx <= hideBX + hideBW && my >= hideBY && my <= hideBY + hideBH) {
      this.hidden = true;
      return true;
    }

    if (my >= this.y && my <= this.y + this.headerH) {
      this.dragging = true;
      this.dragOffsetX = mx - this.x;
      this.dragOffsetY = my - this.y;
      return true;
    }

    if (this.getMaxScroll() > 0 && this.isOnScrollbar(mx, my)) {
      this.scrollGrabbed = true;
      this.updateScrollbarFromPointer(my);
      return true;
    }

    let y = this.y + this.headerH + this.padding - this.scrollOffset;

    for (const item of this.items) {
      if (item.type === "slider") {
        const sliderX = this.x + Math.max(100, this.w * 0.4);
        const rightPad = this.scrollBarW + 14;
        const sliderW = this.w - (sliderX - this.x) - rightPad - this.padding;
        const sliderY = y + this.rowH * 0.58;
        const pad = this.touchMode ? 14 : 10;

        if (
          mx >= sliderX &&
          mx <= sliderX + sliderW &&
          my >= sliderY - pad &&
          my <= sliderY + pad
        ) {
          this.activeItem = item;
          this.updateSlider(item, mx);
          return true;
        }
      } else if (item.type === "toggle") {
        const boxS = this.touchMode ? 20 : 18;
        const boxX = this.x + this.w - this.scrollBarW - this.padding - boxS - 6;
        const boxY = y + (this.rowH - boxS) * 0.5;

        if (mx >= boxX && mx <= boxX + boxS && my >= boxY && my <= boxY + boxS) {
          item.value = !item.value;
          item.onChange?.(item.value);
          return true;
        }
      } else if (item.type === "button") {
        const bx = this.x + this.padding;
        const by = y + 4;
        const bw = this.w - this.padding * 2 - this.scrollBarW - 8;
        const bh = this.rowH - 8;

        if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
          item.onClick?.();
          return true;
        }
      }

      y += this.rowH;
    }

    if (this.contentContains(mx, my) && this.getMaxScroll() > 0) {
      this.contentDragScrolling = true;
      this.contentDragStartY = my;
      this.contentStartOffset = this.scrollOffset;
      return true;
    }

    return true;
  }

  pointerDragged(mx, my) {
    if (this.hidden) return false;

    if (this.dragging) {
      this.x = mx - this.dragOffsetX;
      this.y = my - this.dragOffsetY;
      this.clampToScreen();
      return true;
    }

    if (this.scrollGrabbed) {
      this.updateScrollbarFromPointer(my);
      return true;
    }

    if (this.activeItem && this.activeItem.type === "slider") {
      this.updateSlider(this.activeItem, mx);
      return true;
    }

    if (this.contentDragScrolling) {
      this.scrollOffset = this.contentStartOffset - (my - this.contentDragStartY);
      this.clampScroll();
      return true;
    }

    return false;
  }

  pointerReleased() {
    this.dragging = false;
    this.activeItem = null;
    this.scrollGrabbed = false;
    this.contentDragScrolling = false;
  }

  wheel(delta, mx, my) {
    if (!this.contentContains(mx, my) || this.getMaxScroll() <= 0) return false;
    this.scrollOffset += delta;
    this.clampScroll();
    return true;
  }

  isOnScrollbar(mx, my) {
    const contentY = this.y + this.headerH;
    const contentH = this.getVisibleContentHeight();
    const trackX = this.x + this.w - this.scrollBarW - 4;
    const trackY = contentY + 4;
    const trackH = contentH - 8;

    return mx >= trackX && mx <= trackX + this.scrollBarW && my >= trackY && my <= trackY + trackH;
  }

  updateScrollbarFromPointer(my) {
    const contentY = this.y + this.headerH;
    const contentH = this.getVisibleContentHeight();
    const trackY = contentY + 4;
    const trackH = contentH - 8;

    const total = this.getContentHeight();
    const visible = this.getVisibleContentHeight();
    const thumbH = Math.max(26, trackH * (visible / total));
    const maxThumbTravel = trackH - thumbH;

    const thumbCenterY = constrain(my, trackY + thumbH * 0.5, trackY + trackH - thumbH * 0.5);
    const t =
      maxThumbTravel <= 0
        ? 0
        : (thumbCenterY - (trackY + thumbH * 0.5)) / maxThumbTravel;

    this.scrollOffset = t * this.getMaxScroll();
    this.clampScroll();
  }

  updateSlider(item, mx) {
    const sliderX = this.x + Math.max(100, this.w * 0.4);
    const rightPad = this.scrollBarW + 14;
    const sliderW = this.w - (sliderX - this.x) - rightPad - this.padding;

    let t = (mx - sliderX) / sliderW;
    t = constrain(t, 0, 1);

    let value = lerp(item.min, item.max, t);
    value = Math.round(value / item.step) * item.step;

    if (item.step < 1) {
      const decimals = String(item.step).split(".")[1]?.length || 3;
      value = Number(value.toFixed(decimals));
    }

    item.value = constrain(value, item.min, item.max);
    item.onChange?.(item.value);
  }
}

function roundRectFill(ctx, x, y, w, h, r, fillStyle, corners = {}) {
  const tl = corners.topLeft ?? r;
  const tr = corners.topRight ?? r;
  const br = corners.bottomRight ?? r;
  const bl = corners.bottomLeft ?? r;

  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();

  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function drawText(ctx, text, x, y, options = {}) {
  const size = options.size ?? 14;
  const color = options.color ?? "#fff";
  const align = options.align ?? "left";

  ctx.fillStyle = color;
  ctx.font = `${size}px "Courier New", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function constrain(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function mapValue(value, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, t);
}

function rgba(r, g, b, a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hsbToRgb(h, s, v) {
  const hh = (h / 255) * 360;
  const ss = s / 255;
  const vv = v / 255;

  const c = vv * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = vv - c;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hh >= 0 && hh < 60) {
    r1 = c; g1 = x; b1 = 0;
  } else if (hh < 120) {
    r1 = x; g1 = c; b1 = 0;
  } else if (hh < 180) {
    r1 = 0; g1 = c; b1 = x;
  } else if (hh < 240) {
    r1 = 0; g1 = x; b1 = c;
  } else if (hh < 300) {
    r1 = x; g1 = 0; b1 = c;
  } else {
    r1 = c; g1 = 0; b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}