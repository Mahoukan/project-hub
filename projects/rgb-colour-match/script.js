(() => {
    const state = {
        target: { r: 0, g: 0, b: 0 },
        current: { r: 127, g: 127, b: 127 },

        timer: 0,
        timerMax: 1800,

        lastScore: 0,
        highScore: 0,
        resultShown: false,

        showHelp: true
    };

    const ui = {};

    function randomColour() {
        return {
            r: Math.random() * 255,
            g: Math.random() * 255,
            b: Math.random() * 255
        };
    }

    function reset() {
        state.target = randomColour();
        state.current = { r: 127, g: 127, b: 127 };
        state.timer = state.timerMax;
        state.resultShown = false;

        if (ui.sliderR) ui.sliderR.value = 127;
        if (ui.sliderG) ui.sliderG.value = 127;
        if (ui.sliderB) ui.sliderB.value = 127;

        updateValueLabels();
    }

    function done() {
        state.timer = 0;
    }

    function updateValueLabels() {
        if (ui.valueR) ui.valueR.textContent = state.current.r;
        if (ui.valueG) ui.valueG.textContent = state.current.g;
        if (ui.valueB) ui.valueB.textContent = state.current.b;
    }

    function checkScore() {
        const r = Math.abs(state.current.r - state.target.r);
        const g = Math.abs(state.current.g - state.target.g);
        const b = Math.abs(state.current.b - state.target.b);

        const total = r + g + b;
        let score = 100 - (total / 765) * 100;
        score = Math.max(0, Math.round(score));

        state.lastScore = score;
        state.highScore = Math.max(state.highScore, score);
        state.resultShown = true;
    }

    function drawRect(ctx, x, y, w, h, r, g, b) {
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 20);
        ctx.fill();
    }

    function drawTimer(ctx, width, height) {
        const panelSize = Math.min(width * 0.32, height * 0.42);
        const panelY = height * 0.6;
        const cy = panelY + panelSize * 0.45;
        const cx = width * 0.5;
        const radius = Math.max(28, Math.min(width, height) * 0.055);

        const t = state.timer / state.timerMax;
        const angle = t * Math.PI * 2;

        ctx.save();

        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + angle);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#111";
        ctx.font = "12px Courier New, monospace";
        ctx.textAlign = "center";
        ctx.fillText(Math.ceil(state.timer / 60), cx, cy + 4);

        ctx.restore();
    }

    function drawText(ctx, text, x, y, size = 16, align = "left") {
        ctx.fillStyle = "#111";
        ctx.font = `${size}px Courier New, monospace`;
        ctx.textAlign = align;
        ctx.fillText(text, x, y);
    }

    function draw(app) {
        const { ctx, width, height } = app;

        ctx.fillStyle = "#e8ebef";
        ctx.fillRect(0, 0, width, height);

        const panelSize = Math.min(width * 0.34, height * 0.46);
        const panelY = height * 0.10;
        //
        const gap = width * 0.12;

        const totalWidth = panelSize * 2 + gap;
        const leftX = (width - totalWidth) * 0.5;
        const rightX = leftX + panelSize + gap;


        drawRect(
            ctx,
            leftX,
            panelY,
            panelSize,
            panelSize,
            state.target.r,
            state.target.g,
            state.target.b
        );

        drawRect(
            ctx,
            rightX,
            panelY,
            panelSize,
            panelSize,
            state.current.r,
            state.current.g,
            state.current.b
        );

        drawText(ctx, "Target", leftX + panelSize * 0.5, panelY - 12, 14, "center");
        drawText(ctx, "Your Colour", rightX + panelSize * 0.5, panelY - 12, 14, "center");

        if (state.resultShown) {
            drawText(
                ctx,
                `(${Math.round(state.target.r)}, ${Math.round(state.target.g)}, ${Math.round(state.target.b)})`,
                leftX + panelSize * 0.5,
                panelY + panelSize + 24,
                12,
                "center"
            );
        }

        drawText(
            ctx,
            `(${state.current.r}, ${state.current.g}, ${state.current.b})`,
            rightX + panelSize * 0.5,
            panelY + panelSize + 24,
            12,
            "center"
        );

        drawTimer(ctx, width, height);

        if (state.resultShown) {
            const scoreY = panelY + panelSize + 60;

            drawText(ctx, `Score: ${state.lastScore}%`, width * 0.5, scoreY, 28, "center");
            drawText(ctx, `High Score: ${state.highScore}%`, width * 0.5, scoreY + 28, 18, "center");
        }
    }

    function setupUI() {
        ui.sliderR = document.getElementById("slider-r");
        ui.sliderG = document.getElementById("slider-g");
        ui.sliderB = document.getElementById("slider-b");

        ui.valueR = document.getElementById("value-r");
        ui.valueG = document.getElementById("value-g");
        ui.valueB = document.getElementById("value-b");

        ui.btnDone = document.getElementById("btn-done");
        ui.btnReset = document.getElementById("btn-reset");

        ui.difficulty = document.getElementById("difficulty");

        function bindSlider(slider, key) {
            if (!slider) return;
            slider.addEventListener("input", () => {
                state.current[key] = Number(slider.value);
                updateValueLabels();
            });
        }

        bindSlider(ui.sliderR, "r");
        bindSlider(ui.sliderG, "g");
        bindSlider(ui.sliderB, "b");

        ui.btnDone?.addEventListener("click", done);
        ui.btnReset?.addEventListener("click", reset);

        ui.difficulty?.addEventListener("change", () => {
            state.timerMax = Number(ui.difficulty.value);
            reset();
        });
    }

    window.bootProject({
        setup(app) {
            setupUI();
            reset();
        },

        update() {
            if (!state.resultShown) {
                state.timer--;

                if (state.timer <= 0) {
                    checkScore();
                }
            }
        },

        draw(app) {
            draw(app);
        }
    });
})();