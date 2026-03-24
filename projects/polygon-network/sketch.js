let n = 3;
let radius = 0;
let angleOffset = 0;
let rotationSpeed = 0.01;

let isPaused = false;
let showTrail = false;
let fillPolygon = false;
let uiInteracted = false;

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
let panelVisible = true;

let ui;

function setup() {
  const { stageWidth, stageHeight } = getStageSize();

  const canvas = createCanvas(stageWidth, stageHeight);
  canvas.parent("project-stage");

  colorMode(HSB, 255);
  textFont("Courier New", 14);
  updateRadius();

  ui = new ControlPanel(16, 16, getPanelWidth(), getPanelHeight());
  buildUI();
}

function buildUI() {
  ui.clearItems();

  ui.addSlider("Speed", -0.1, 0.1, rotationSpeed, 0.001, (v) => {
    rotationSpeed = v;
  });

  ui.addSlider("Points", MIN_POINTS, MAX_POINTS, n, 1, (v) => {
    n = floor(v);
  });

  ui.addSlider("Radius", 0.15, 0.48, radiusScale, 0.005, (v) => {
    radiusScale = v;
    updateRadius();
  });

  ui.addSlider("Line Alpha", 0, 255, lineAlpha, 1, (v) => {
    lineAlpha = floor(v);
  });

  ui.addSlider("Line Width", 0.5, 4, lineThickness, 0.1, (v) => {
    lineThickness = v;
  });

  ui.addSlider("Point Size", 2, 18, pointSize, 1, (v) => {
    pointSize = floor(v);
  });

  ui.addSlider("Point Alpha", 0, 255, pointAlpha, 1, (v) => {
    pointAlpha = floor(v);
  });

  ui.addSlider("Fill Alpha", 0, 255, fillAlpha, 1, (v) => {
    fillAlpha = floor(v);
  });

  ui.addSlider("Hue Speed", 0, 8, hueSpeed, 0.05, (v) => {
    hueSpeed = v;
  });

  ui.addSlider("Hue Spread", 0, 4, hueSpread, 0.05, (v) => {
    hueSpread = v;
  });

  ui.addSlider("Trail Fade", 0, 80, trailFade, 1, (v) => {
    trailFade = floor(v);
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
    saveCanvas("polygon_network", "png");
  });
}

function draw() {
  drawBackground();

  push();
  translate(width * 0.5, height * 0.5);

  if (fillPolygon && n >= 3) {
    noStroke();
    fill((frameCount * 2) % 255, 180, 255, fillAlpha);
    beginShape();
    for (let i = 0; i < n; i++) {
      const a = angleOffset + (TWO_PI * i) / n;
      vertex(radius * cos(a), radius * sin(a));
    }
    endShape(CLOSE);
  }

  strokeWeight(lineThickness);

  for (let i = 0; i < n; i++) {
    const a1 = angleOffset + (TWO_PI * i) / n;
    const x1 = radius * cos(a1);
    const y1 = radius * sin(a1);

    for (let j = i + 1; j < n; j++) {
      const a2 = angleOffset + (TWO_PI * j) / n;
      const x2 = radius * cos(a2);
      const y2 = radius * sin(a2);

      const hue = map((i + j) * hueSpread, 0, max(1, n * 2), 0, 255);
      stroke((frameCount * hueSpeed + hue) % 255, 200, 255, lineAlpha);
      line(x1, y1, x2, y2);
    }
  }

  noStroke();
  fill(255, pointAlpha);
  for (let i = 0; i < n; i++) {
    const a = angleOffset + (TWO_PI * i) / n;
    circle(radius * cos(a), radius * sin(a), pointSize);
  }

  pop();

  if (!isPaused) {
    angleOffset += rotationSpeed;
  }

  if (panelVisible) {
    ui.draw();
  }
}

function drawBackground() {
  if (!showTrail) {
    background(0);
  } else {
    noStroke();
    fill(0, 0, 0, trailFade);
    rect(0, 0, width, height);
  }
}

function updateRadius() {
  radius = min(width, height) * radiusScale;
}

function mousePressed() {
  uiInteracted = panelVisible ? ui.pointerPressed(mouseX, mouseY) : false;
}

function mouseDragged() {
  if (panelVisible && ui.pointerDragged(mouseX, mouseY)) return false;
}

function mouseReleased() {
  if (panelVisible) ui.pointerReleased();

  if (uiInteracted) {
    uiInteracted = false;
    return false;
  }

  if (
    mouseX >= 0 &&
    mouseX <= width &&
    mouseY >= 0 &&
    mouseY <= height
  ) {
    n = constrain(n + 1, MIN_POINTS, MAX_POINTS);
    ui.setSliderValue("Points", n);
  }

  return false;
}

function mouseWheel(event) {
  if (panelVisible && ui.wheel(event.delta, mouseX, mouseY)) {
    return false;
  }
}

function touchStarted() {
  if (touches.length > 0) {
    const t = touches[0];
    uiInteracted = panelVisible ? ui.pointerPressed(t.x, t.y) : false;
    if (uiInteracted) return false;
  }
}

function touchMoved() {
  if (touches.length > 0) {
    const t = touches[0];
    if (panelVisible && ui.pointerDragged(t.x, t.y)) return false;
  }
}

function touchEnded() {
  if (panelVisible) ui.pointerReleased();
  return false;
}

function keyPressed() {
  if (key === " ") {
    isPaused = !isPaused;
    ui.setToggleValue("Paused", isPaused);
    return false;
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
    saveCanvas("polygon_network", "png");
  } else if (key === "h" || key === "H") {
    panelVisible = !panelVisible;
  } else if (keyCode === UP_ARROW) {
    n = constrain(n + 1, MIN_POINTS, MAX_POINTS);
    ui.setSliderValue("Points", n);
    return false;
  } else if (keyCode === DOWN_ARROW) {
    n = constrain(n - 1, MIN_POINTS, MAX_POINTS);
    ui.setSliderValue("Points", n);
    return false;
  } else if (keyCode === LEFT_ARROW) {
    n = MIN_POINTS;
    ui.setSliderValue("Points", n);
    return false;
  } else if (keyCode === RIGHT_ARROW) {
    n = constrain(n + 10, MIN_POINTS, MAX_POINTS);
    ui.setSliderValue("Points", n);
    return false;
  }
}

function windowResized() {
  const { stageWidth, stageHeight } = getStageSize();
  resizeCanvas(stageWidth, stageHeight);
  updateRadius();

  ui.w = getPanelWidth();
  ui.maxH = getPanelHeight();
  ui.touchMode = isTouchLikeLayout();
  ui.updateMetrics();
  ui.clampToScreen();
}

function getStageSize() {
  const stage = document.getElementById("project-stage");
  const stageWidth = max(280, stage?.clientWidth || 600);
  const stageHeight = max(320, min(window.innerHeight - 180, 720));
  return { stageWidth, stageHeight };
}

function getPanelWidth() {
  if (width < 520) return min(width - 20, 300);
  return min(340, width * 0.42);
}

function getPanelHeight() {
  return min(height - 20, height * 0.82);
}

function isTouchLikeLayout() {
  return width < 700 || "ontouchstart" in window;
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
    const fullH = min(this.maxH, this.headerH + this.getContentHeight());
    return max(0, fullH - this.headerH);
  }

  getFullHeight() {
    if (this.hidden) return this.hiddenButtonH;
    return min(this.maxH, this.headerH + this.getContentHeight());
  }

  getMaxScroll() {
    return max(0, this.getContentHeight() - this.getVisibleContentHeight());
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
      return mx >= this.x && mx <= this.x + this.hiddenButtonW && my >= this.y && my <= this.y + this.hiddenButtonH;
    }
    return mx >= this.x && mx <= this.x + this.w && my >= this.y && my <= this.y + this.getFullHeight();
  }

  contentContains(mx, my) {
    if (this.hidden) return false;
    const top = this.y + this.headerH;
    const h = this.getVisibleContentHeight();
    return mx >= this.x && mx <= this.x + this.w && my >= top && my <= top + h;
  }

  draw() {
    if (this.hidden) {
      this.drawHiddenButton();
      return;
    }

    this.clampScroll();
    const fullH = this.getFullHeight();
    const contentY = this.y + this.headerH;
    const contentH = this.getVisibleContentHeight();

    push();
    noStroke();
    fill(18, 18, 28, 225);
    rect(this.x, this.y, this.w, fullH, 14);

    fill(38, 38, 60, 245);
    rect(this.x, this.y, this.w, this.headerH, 14, 14, 0, 0);

    fill(255);
    textAlign(LEFT, CENTER);
    textSize(this.touchMode ? 15 : 14);
    text("Controls", this.x + 12, this.y + this.headerH * 0.5);

    this.drawHideButton();

    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(this.x, contentY, this.w, contentH);
    drawingContext.clip();

    let y = contentY + this.padding - this.scrollOffset;

    for (const item of this.items) {
      if (item.type === "slider") {
        this.drawSlider(item, y);
      } else if (item.type === "toggle") {
        this.drawToggle(item, y);
      } else if (item.type === "button") {
        this.drawButton(item, y);
      }
      y += this.rowH;
    }

    drawingContext.restore();

    if (this.getMaxScroll() > 0) {
      this.drawScrollbar();
    }

    pop();
  }

  drawHideButton() {
    const bx = this.x + this.w - 30;
    const by = this.y + 5;
    const bw = 22;
    const bh = this.touchMode ? 24 : 20;

    fill(70, 90, 120);
    rect(bx, by, bw, bh, 6);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("−", bx + bw * 0.5, by + bh * 0.5 + 1);
  }

  drawHiddenButton() {
    push();
    noStroke();
    fill(40, 40, 60, 240);
    rect(this.x, this.y, this.hiddenButtonW, this.hiddenButtonH, 10);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(this.touchMode ? 20 : 18);
    text("+", this.x + this.hiddenButtonW * 0.5, this.y + this.hiddenButtonH * 0.5 + 1);
    pop();
  }

  drawScrollbar() {
    const fullH = this.getFullHeight();
    const contentY = this.y + this.headerH;
    const contentH = this.getVisibleContentHeight();
    const trackX = this.x + this.w - this.scrollBarW - 4;
    const trackY = contentY + 4;
    const trackH = contentH - 8;

    fill(80, 60);
    rect(trackX, trackY, this.scrollBarW, trackH, 8);

    const total = this.getContentHeight();
    const visible = this.getVisibleContentHeight();
    const thumbH = max(26, trackH * (visible / total));
    const maxThumbY = trackH - thumbH;
    const thumbY = trackY + map(this.scrollOffset, 0, max(1, this.getMaxScroll()), 0, maxThumbY);

    fill(180, 200, 255, 220);
    rect(trackX, thumbY, this.scrollBarW, thumbH, 8);
  }

  drawSlider(item, y) {
    if (y + this.rowH < this.y + this.headerH || y > this.y + this.getFullHeight()) return;

    const labelX = this.x + this.padding;
    const sliderX = this.x + max(100, this.w * 0.4);
    const rightPad = this.scrollBarW + 14;
    const sliderW = this.w - (sliderX - this.x) - rightPad - this.padding;
    const sliderY = y + this.rowH * 0.58;

    fill(235);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(this.textSize);
    text(item.label, labelX, y + this.rowH * 0.45);

    stroke(120);
    strokeWeight(2);
    line(sliderX, sliderY, sliderX + sliderW, sliderY);

    const t = (item.value - item.min) / (item.max - item.min);
    const knobX = lerp(sliderX, sliderX + sliderW, t);

    noStroke();
    fill(180, 200, 255);
    circle(knobX, sliderY, this.sliderKnobSize);

    fill(255);
    textAlign(RIGHT, CENTER);
    text(
      item.step < 1 ? Number(item.value).toFixed(3).replace(/\.?0+$/, "") : floor(item.value),
      this.x + this.w - rightPad,
      y + this.rowH * 0.45
    );
  }

  drawToggle(item, y) {
    if (y + this.rowH < this.y + this.headerH || y > this.y + this.getFullHeight()) return;

    const labelX = this.x + this.padding;
    const boxS = this.touchMode ? 20 : 18;
    const boxX = this.x + this.w - this.scrollBarW - this.padding - boxS - 6;
    const boxY = y + (this.rowH - boxS) * 0.5;

    fill(235);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(this.textSize);
    text(item.label, labelX, y + this.rowH * 0.5);

    fill(item.value ? color(120, 200, 255) : color(70));
    rect(boxX, boxY, boxS, boxS, 5);

    if (item.value) {
      stroke(255);
      strokeWeight(2);
      line(boxX + 4, boxY + boxS * 0.55, boxX + boxS * 0.42, boxY + boxS - 4);
      line(boxX + boxS * 0.42, boxY + boxS - 4, boxX + boxS - 4, boxY + 4);
    }
  }

  drawButton(item, y) {
    if (y + this.rowH < this.y + this.headerH || y > this.y + this.getFullHeight()) return;

    const bx = this.x + this.padding;
    const by = y + 4;
    const bw = this.w - this.padding * 2 - this.scrollBarW - 8;
    const bh = this.rowH - 8;

    fill(70, 90, 120);
    noStroke();
    rect(bx, by, bw, bh, 8);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(this.textSize);
    text(item.label, bx + bw * 0.5, by + bh * 0.5);
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
        const sliderX = this.x + max(100, this.w * 0.4);
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
    const thumbH = max(26, trackH * (visible / total));
    const maxThumbTravel = trackH - thumbH;

    const thumbCenterY = constrain(my, trackY + thumbH * 0.5, trackY + trackH - thumbH * 0.5);
    const t = maxThumbTravel <= 0 ? 0 : (thumbCenterY - (trackY + thumbH * 0.5)) / maxThumbTravel;

    this.scrollOffset = t * this.getMaxScroll();
    this.clampScroll();
  }

  updateSlider(item, mx) {
    const sliderX = this.x + max(100, this.w * 0.4);
    const rightPad = this.scrollBarW + 14;
    const sliderW = this.w - (sliderX - this.x) - rightPad - this.padding;

    let t = (mx - sliderX) / sliderW;
    t = constrain(t, 0, 1);

    let value = lerp(item.min, item.max, t);
    value = round(value / item.step) * item.step;

    if (item.step < 1) {
      const decimals = String(item.step).split(".")[1]?.length || 3;
      value = Number(value.toFixed(decimals));
    }

    item.value = constrain(value, item.min, item.max);
    item.onChange?.(item.value);
  }
}