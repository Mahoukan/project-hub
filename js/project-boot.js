function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function bootProject(config = {}) {
  const canvas = document.getElementById(config.canvasId || "canvas");

  if (!canvas) {
    throw new Error(`bootProject could not find canvas with id "${config.canvasId || "canvas"}".`);
  }

  const ctx = canvas.getContext("2d", {
    alpha: config.alpha ?? false,
    desynchronized: config.desynchronized ?? false
  });

  if (!ctx) {
    throw new Error("Failed to get 2D canvas context.");
  }

  const app = {
    canvas,
    ctx,

    width: 0,
    height: 0,
    dpr: 1,

    frame: 0,
    time: 0,
    delta: 0,
    lastTimestamp: 0,

    running: true,
    paused: false,

    meta: null,

    pointer: {
      x: 0,
      y: 0,
      down: false,
      pressed: false,
      released: false,
      inside: false
    },

    config: {
      dprCap: config.dprCap ?? 2
    }
  };

  function updatePointerFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    app.pointer.x = event.clientX - rect.left;
    app.pointer.y = event.clientY - rect.top;
    app.pointer.inside =
      app.pointer.x >= 0 &&
      app.pointer.y >= 0 &&
      app.pointer.x <= rect.width &&
      app.pointer.y <= rect.height;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = clamp(window.devicePixelRatio || 1, 1, app.config.dprCap);

    app.dpr = dpr;
    app.width = Math.max(1, Math.floor(rect.width));
    app.height = Math.max(1, Math.floor(rect.height));

    canvas.width = Math.max(1, Math.floor(app.width * dpr));
    canvas.height = Math.max(1, Math.floor(app.height * dpr));

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    if (typeof config.onResize === "function") {
      config.onResize(app);
    }
  }

  function clearTransientPointerFlags() {
    app.pointer.pressed = false;
    app.pointer.released = false;
  }

  function handlePointerDown(event) {
    updatePointerFromEvent(event);
    app.pointer.down = true;
    app.pointer.pressed = true;

    if (typeof config.onPointerDown === "function") {
      config.onPointerDown(app, event);
    }
  }

  function handlePointerMove(event) {
    updatePointerFromEvent(event);

    if (typeof config.onPointerMove === "function") {
      config.onPointerMove(app, event);
    }
  }

  function handlePointerUp(event) {
    if (event) {
      updatePointerFromEvent(event);
    }

    app.pointer.down = false;
    app.pointer.released = true;

    if (typeof config.onPointerUp === "function") {
      config.onPointerUp(app, event);
    }
  }

  function handlePointerEnter(event) {
    updatePointerFromEvent(event);
    app.pointer.inside = true;

    if (typeof config.onPointerEnter === "function") {
      config.onPointerEnter(app, event);
    }
  }

  function handlePointerLeave(event) {
    updatePointerFromEvent(event);
    app.pointer.inside = false;

    if (typeof config.onPointerLeave === "function") {
      config.onPointerLeave(app, event);
    }
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      app.pointer.down = false;
      app.pointer.pressed = false;
      app.pointer.released = false;

      if (config.pauseWhenHidden !== false) {
        app.paused = true;
      }

      if (typeof config.onHidden === "function") {
        config.onHidden(app);
      }
    } else {
      app.lastTimestamp = 0;

      if (config.pauseWhenHidden !== false) {
        app.paused = false;
      }

      if (typeof config.onVisible === "function") {
        config.onVisible(app);
      }
    }
  }

  function destroy() {
    app.running = false;

    canvas.removeEventListener("pointerdown", handlePointerDown);
    canvas.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerenter", handlePointerEnter);
    canvas.removeEventListener("pointerleave", handlePointerLeave);

    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
    window.removeEventListener("resize", resize);

    document.removeEventListener("visibilitychange", handleVisibilityChange);

    if (typeof config.destroy === "function") {
      config.destroy(app);
    }
  }

  app.resize = resize;
  app.destroy = destroy;

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerenter", handlePointerEnter);
  canvas.addEventListener("pointerleave", handlePointerLeave);

  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);
  window.addEventListener("resize", resize);

  document.addEventListener("visibilitychange", handleVisibilityChange);

  resize();

  if (typeof window.loadProjectMeta === "function") {
    app.meta = await window.loadProjectMeta();
  }

  if (typeof config.setup === "function") {
    await config.setup(app);
  }

  function loop(timestamp) {
    if (!app.running) return;

    if (app.paused) {
      clearTransientPointerFlags();
      requestAnimationFrame(loop);
      return;
    }

    app.delta = app.lastTimestamp ? (timestamp - app.lastTimestamp) / 1000 : 0;
    app.lastTimestamp = timestamp;
    app.time = timestamp / 1000;

    if (typeof config.update === "function") {
      config.update(app);
    }

    if (typeof config.draw === "function") {
      config.draw(app);
    }

    clearTransientPointerFlags();
    app.frame++;

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  return app;
}

window.bootProject = bootProject;