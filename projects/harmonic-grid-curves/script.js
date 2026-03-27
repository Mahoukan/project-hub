(() => {
  const TAU = Math.PI * 2;

  const state = {
    n: 4,
    pause: false,

    curves: [],
    currentRow: 0,
    currentCol: 0,

    drawRadius: 0,

    travelDist: 0,
    drawSpeed: 40,

    mode: 0, // 0 draw, 1 pause, 2 fade
    pauseCounter: 0,
    pauseFrames: 45,

    fadeCounter: 0,
    fadeFrames: 35,

    colorTime: 0,
    colorSpeed: 0.0025,

    tipLength: 24,
    tipWeight: 4,
    dotSize: 6,

    guideAlpha: 0.08,

    controls: {},
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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

  function resetAnimation() {
    state.travelDist = 0;
    state.pauseCounter = 0;
    state.fadeCounter = 0;
    state.mode = 0;
  }

  function nextCurve() {
    state.currentCol++;

    if (state.currentCol >= state.n - 1) {
      state.currentCol = 0;
      state.currentRow++;
    }

    if (state.currentRow >= state.n - 1) {
      state.currentRow = 0;
    }

    resetAnimation();
  }

  function buildCurveData(points) {
    const count = points.length;
    const segLengths = new Float32Array(Math.max(0, count - 1));
    const cumLengths = new Float32Array(count);

    let totalLength = 0;
    cumLengths[0] = 0;

    for (let i = 0; i < count - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const len = Math.hypot(dx, dy);

      segLengths[i] = len;
      totalLength += len;
      cumLengths[i + 1] = totalLength;
    }

    return {
      points,
      segLengths,
      cumLengths,
      totalLength,
      count,
    };
  }

  function rebuildCurves(app) {
    state.curves = [];
    state.currentRow = 0;
    state.currentCol = 0;

    const margin = Math.min(app.width, app.height) * 0.08;
    state.drawRadius = Math.max(
      40,
      Math.min(app.width, app.height) * 0.5 - margin,
    );

    const angleStep = state.n >= 12 ? 0.05 : 0.015;
    const xHistory = [];
    const yHistory = [];

    for (let angle = 0; angle <= TAU + 0.0001; angle += angleStep) {
      const xPos = [];
      const yPos = [];

      for (let i = 1; i < state.n; i++) {
        xPos.push(state.drawRadius * Math.cos(angle * i));
        yPos.push(state.drawRadius * Math.sin(angle * i));
      }

      xHistory.push(xPos);
      yHistory.push(yPos);
    }

    for (let row = 0; row < state.n - 1; row++) {
      const rowCurves = [];

      for (let col = 0; col < state.n - 1; col++) {
        const points = new Array(xHistory.length);

        for (let step = 0; step < xHistory.length; step++) {
          points[step] = {
            x: xHistory[step][col],
            y: yHistory[step][row],
          };
        }

        rowCurves.push(buildCurveData(points));
      }

      state.curves.push(rowCurves);
    }

    resetAnimation();
  }

  function getCurrentCurve() {
    return state.curves[state.currentRow]?.[state.currentCol] || null;
  }

  function getPointAtDistance(curve, dist) {
    if (!curve || curve.count === 0) return { x: 0, y: 0 };
    if (dist <= 0) return curve.points[0];
    if (dist >= curve.totalLength) return curve.points[curve.count - 1];

    let i = 0;
    while (i < curve.count - 1 && curve.cumLengths[i + 1] < dist) {
      i++;
    }

    if (i >= curve.count - 1) {
      return curve.points[curve.count - 1];
    }

    const segLen = curve.segLengths[i];
    if (segLen === 0) return curve.points[i];

    const t = (dist - curve.cumLengths[i]) / segLen;

    return {
      x: lerp(curve.points[i].x, curve.points[i + 1].x, t),
      y: lerp(curve.points[i].y, curve.points[i + 1].y, t),
    };
  }

  function drawGuide(ctx, width, height) {
    const cx = width * 0.5;
    const cy = height * 0.5;

    ctx.save();

    ctx.strokeStyle = `rgba(255,255,255,${state.guideAlpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, state.drawRadius, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255,255,255,${state.guideAlpha * 0.65})`;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(cx - state.drawRadius, cy);
    ctx.lineTo(cx + state.drawRadius, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - state.drawRadius);
    ctx.lineTo(cx, cy + state.drawRadius);
    ctx.stroke();

    ctx.fillStyle = `rgba(255,255,255,${state.guideAlpha * 1.1})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  function drawCurvePartial(ctx, curve, width, height, dist, alpha, color) {
    if (!curve || curve.count < 2) return;

    const cx = width * 0.5;
    const cy = height * 0.5;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    ctx.beginPath();

    let started = false;

    for (let i = 0; i < curve.count - 1; i++) {
      if (curve.cumLengths[i] > dist) break;

      const p1 = curve.points[i];

      if (!started) {
        ctx.moveTo(cx + p1.x, cy + p1.y);
        started = true;
      } else {
        ctx.lineTo(cx + p1.x, cy + p1.y);
      }

      if (curve.cumLengths[i + 1] > dist) {
        const segLen = curve.segLengths[i];
        const t = segLen > 0 ? (dist - curve.cumLengths[i]) / segLen : 0;

        const x = lerp(curve.points[i].x, curve.points[i + 1].x, t);
        const y = lerp(curve.points[i].y, curve.points[i + 1].y, t);

        ctx.lineTo(cx + x, cy + y);
        break;
      }
    }

    ctx.stroke();
    ctx.restore();
  }

  function drawTipAndDot(ctx, curve, width, height, dist, alpha, rgb) {
    if (!curve || dist <= 0) return;

    const cx = width * 0.5;
    const cy = height * 0.5;

    const startDist = Math.max(0, dist - state.tipLength);
    const tail = getPointAtDistance(curve, startDist);
    const head = getPointAtDistance(curve, dist);

    const [r, g, b] = rgb;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.26 * alpha})`;
    ctx.lineWidth = state.tipWeight * 2.2;
    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(head.x, head.y);
    ctx.stroke();

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.lineWidth = state.tipWeight;
    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(head.x, head.y);
    ctx.stroke();

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.22 * alpha})`;
    ctx.beginPath();
    ctx.arc(head.x, head.y, state.dotSize * 2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.48 * alpha})`;
    ctx.beginPath();
    ctx.arc(head.x, head.y, state.dotSize * 1.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(head.x, head.y, state.dotSize * 0.42, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  function drawPauseButton(ctx, app) {
    const overlayTitle = document.getElementById("overlay-title");
    const titleWidth = overlayTitle
      ? overlayTitle.getBoundingClientRect().width
      : 110;

    const w = 88;
    const h = 32;
    const x = 10;
    const y = 10;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.2;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "14px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(state.pause ? "Resume" : "Pause", x + w * 0.5, y + h * 0.5);
    ctx.restore();

    return { x, y, w, h };
  }

  function isInsidePauseButton(app) {
    const overlayTitle = document.getElementById("overlay-title");
    const titleWidth = overlayTitle
      ? overlayTitle.getBoundingClientRect().width
      : 110;

    const w = 88;
    const h = 38;
    const x = 10;
    const y = 14;

    return (
      app.pointer.x >= x &&
      app.pointer.x <= x + w &&
      app.pointer.y >= y &&
      app.pointer.y <= y + h
    );
  }

  function setValueText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function bindRange(id, onInput, formatter = (v) => v) {
    const el = document.getElementById(id);
    if (!el) return null;

    el.addEventListener("input", () => {
      onInput(Number(el.value));
    });

    return {
      el,
      set(valueId, value) {
        setValueText(valueId, formatter(value));
      },
    };
  }

  function setupSettingsUI(app) {
    state.controls.grid = document.getElementById("grid-slider");
    state.controls.speed = document.getElementById("speed-slider");
    state.controls.pauseLen = document.getElementById("pause-slider");
    state.controls.fadeLen = document.getElementById("fade-slider");
    state.controls.tipLen = document.getElementById("tip-slider");
    state.controls.guide = document.getElementById("guide-slider");

    const toggle = document.getElementById("settings-toggle");
    const panel = document.getElementById("project-settings");
    const close = document.getElementById("settings-close");

    function showSettings(show) {
      if (!panel || !toggle) return;
      panel.classList.toggle("is-hidden", !show);
      toggle.setAttribute("aria-expanded", show ? "true" : "false");
    }

    if (toggle && panel) {
      toggle.addEventListener("click", () => {
        showSettings(panel.classList.contains("is-hidden"));
      });
    }

    if (close && panel) {
      close.addEventListener("click", () => {
        showSettings(false);
      });
    }

    if (state.controls.grid) {
      state.controls.grid.addEventListener("input", () => {
        const next = clamp(Number(state.controls.grid.value) || 4, 2, 25);
        state.n = next;
        setValueText("grid-value", next);
        rebuildCurves(app);
      });
      setValueText("grid-value", state.controls.grid.value);
    }

    if (state.controls.speed) {
      state.controls.speed.addEventListener("input", () => {
        state.drawSpeed = Number(state.controls.speed.value) || 6;
        setValueText("speed-value", state.drawSpeed);
      });
      setValueText("speed-value", state.controls.speed.value);
    }

    if (state.controls.pauseLen) {
      state.controls.pauseLen.addEventListener("input", () => {
        state.pauseFrames = Number(state.controls.pauseLen.value) || 45;
        setValueText("pause-value", state.pauseFrames);
      });
      setValueText("pause-value", state.controls.pauseLen.value);
    }

    if (state.controls.fadeLen) {
      state.controls.fadeLen.addEventListener("input", () => {
        state.fadeFrames = Number(state.controls.fadeLen.value) || 35;
        setValueText("fade-value", state.fadeFrames);
      });
      setValueText("fade-value", state.controls.fadeLen.value);
    }

    if (state.controls.tipLen) {
      state.controls.tipLen.addEventListener("input", () => {
        state.tipLength = Number(state.controls.tipLen.value) || 24;
        setValueText("tip-value", state.tipLength);
      });
      setValueText("tip-value", state.controls.tipLen.value);
    }

    if (state.controls.guide) {
      state.controls.guide.addEventListener("input", () => {
        const raw = Number(state.controls.guide.value) || 8;
        state.guideAlpha = raw / 100;
        setValueText("guide-value", raw);
      });
      setValueText("guide-value", state.controls.guide.value);
      state.guideAlpha = (Number(state.controls.guide.value) || 8) / 100;
    }
  }

  window.bootProject({
    canvasId: "canvas",

    setup(app) {
      setupSettingsUI(app);
      rebuildCurves(app);
    },

    onResize(app) {
      rebuildCurves(app);
    },

    onPointerDown(app) {
      if (isInsidePauseButton(app)) {
        state.pause = !state.pause;
      }
    },

    update() {
      const curve = getCurrentCurve();
      if (!curve || state.pause) return;

      state.colorTime += state.colorSpeed;

      if (state.mode === 0) {
        state.travelDist += state.drawSpeed;

        if (state.travelDist >= curve.totalLength) {
          state.travelDist = curve.totalLength;
          state.mode = 1;
          state.pauseCounter = 0;
        }
      } else if (state.mode === 1) {
        state.pauseCounter++;

        if (state.pauseCounter >= state.pauseFrames) {
          state.mode = 2;
          state.fadeCounter = 0;
        }
      } else if (state.mode === 2) {
        state.fadeCounter++;

        if (state.fadeCounter >= state.fadeFrames) {
          nextCurve();
        }
      }
    },

    draw(app) {
      const ctx = app.ctx;
      const curve = getCurrentCurve();

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, app.width, app.height);

      drawGuide(ctx, app.width, app.height);

      const hue = (state.colorTime * 360) % 360;
      const rgb = hueToRGB(hue);
      const color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

      let alpha = 1;
      if (state.mode === 2) {
        alpha = 1 - state.fadeCounter / Math.max(1, state.fadeFrames);
      }

      drawCurvePartial(
        ctx,
        curve,
        app.width,
        app.height,
        state.travelDist,
        alpha,
        color,
      );

      drawTipAndDot(
        ctx,
        curve,
        app.width,
        app.height,
        state.travelDist,
        alpha,
        rgb,
      );

      drawPauseButton(ctx, app);

      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "15px Inter, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const xRatio = state.currentCol + 1;
      const yRatio = state.currentRow + 1;

      ctx.fillText(`Curve: ${xRatio} to ${yRatio}`, 10, 56);
      ctx.fillText(`Ratio: ${xRatio}:${yRatio}`, 10, 86);
      ctx.restore();

      if (state.pause) {
        ctx.save();
        ctx.restore();
      }
    },
  });
})();
