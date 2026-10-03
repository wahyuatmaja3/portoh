/* =============================================================================
   PORTOH — main.js
   Vanilla port of interactive patterns from ObsidianUI + Bencho + reactbits.
   No dependencies, no build step.
   ========================================================================== */
(function () {
    "use strict";

    var root = document.documentElement;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    var clamp = function (v, min, max) {
        return v < min ? min : v > max ? max : v;
    };

    /**
     * Run a component in isolation so one failing feature cannot take the
     * rest of the page down with it.
     */
    function component(name, fn) {
        try {
            fn();
        } catch (err) {
            console.error("[portoh] " + name + " failed to initialise:", err);
        }
    }

    /* --------------------------------------------------------------------
       THEME — two themes, applied to <html data-theme>
       ------------------------------------------------------------------ */
    var THEMES = ["obsidian", "prism"];
    var themeToggle = document.getElementById("themeToggle");
    var themeToggleState = document.getElementById("themeToggleState");

    function getTheme() {
        var t = root.getAttribute("data-theme");
        return THEMES.indexOf(t) === -1 ? "obsidian" : t;
    }

    function applyTheme(theme) {
        if (THEMES.indexOf(theme) === -1) return;
        root.setAttribute("data-theme", theme);
        try {
            localStorage.setItem("portoh-theme", theme);
        } catch (e) {}

        var isPrism = theme === "prism";
        if (themeToggle) {
            themeToggle.setAttribute("aria-checked", String(isPrism));
            themeToggle.setAttribute(
                "aria-label",
                isPrism ? "Switch to Obsidian theme" : "Switch to Prism theme"
            );
        }
        if (themeToggleState) {
            themeToggleState.textContent =
                "Current theme: " + (isPrism ? "Prism" : "Obsidian");
        }

        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", isPrism ? "#f4f2ed" : "#08080a");
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            applyTheme(getTheme() === "obsidian" ? "prism" : "obsidian");
        });
    }

    applyTheme(getTheme());

    /* --------------------------------------------------------------------
       PRELOADER — fake progress, then reveal
       ------------------------------------------------------------------ */
    component("preloader", function () {
        var el = document.getElementById("preloader");
        var counter = document.getElementById("preloaderCount");
        if (!el) return;

        if (reduceMotion.matches) {
            el.classList.add("is-done");
            el.remove();
            return;
        }

        var start = performance.now();
        var DURATION = 900;
        var shown = 0;
        var finished = false;

        function finish() {
            if (finished) return;
            finished = true;
            counter.textContent = "100";
            el.classList.add("is-done");
            document.body.classList.add("is-loaded");
            window.setTimeout(function () {
                el.remove();
            }, 600);
        }

        function tick(now) {
            if (finished) return;
            // ease-out toward 100 so it never feels like a stalled bar
            var p = Math.min((now - start) / DURATION, 1);
            var eased = 1 - Math.pow(1 - p, 2);
            var target = Math.round(eased * 100);
            if (target !== shown) {
                shown = target;
                counter.textContent = String(shown);
            }
            if (p < 1) requestAnimationFrame(tick);
            else finish();
        }

        // don't trap the user behind the loader if a resource stalls
        var failsafe = window.setTimeout(finish, 2600);
        requestAnimationFrame(tick);
        window.addEventListener("load", function () {
            if (performance.now() - start < DURATION) return;
            window.clearTimeout(failsafe);
        });
    });

    /* --------------------------------------------------------------------
       SCROLL REVEAL
       ------------------------------------------------------------------ */
    component("scroll-reveal", function () {
        var targets = document.querySelectorAll("[data-reveal]");
        if (!targets.length) return;

        if (reduceMotion.matches || !("IntersectionObserver" in window)) {
            targets.forEach(function (el) {
                el.classList.add("is-in");
            });
            return;
        }

        var io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-in");
                    io.unobserve(entry.target);
                });
            },
            { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
        );

        targets.forEach(function (el, i) {
            // gentle cascade inside a single group
            el.style.transitionDelay = (i % 4) * 60 + "ms";
            io.observe(el);
        });
    });

    /* --------------------------------------------------------------------
       ROLE REEL — cycling job titles
       ------------------------------------------------------------------ */
    component("role-reel", function () {
        var reel = document.querySelector("[data-reel]");
        var track = reel && reel.querySelector("[data-reel-track]");
        if (!reel || !track) return;

        if (reduceMotion.matches) {
            // no animation: show everything stacked, no overflow clipping
            reel.style.height = "auto";
            return;
        }

        var items = Array.prototype.slice.call(track.children);
        var count = items.length;
        if (count < 2) return;

        // duplicate the first item so the loop is seamless: the clone sits at
        // -count steps, which shows the same text as step 0 on the way back round
        var clone = items[0].cloneNode(true);
        track.appendChild(clone);

        // the translate step must equal the line box of one item, otherwise the
        // roll drifts out of sync and clips the titles. CSS owns that ratio in
        // --reel-line so the clip window and the animation cannot disagree.
        var step = parseFloat(getComputedStyle(reel).getPropertyValue("--reel-line"));
        if (!step || isNaN(step)) step = 1.5;

        var HOLD = 1.7; // seconds each title stays put
        var total = HOLD * count;

        // one stop per item, plus a final hold on the clone
        var frames = [];
        for (var i = 0; i <= count; i++) {
            var translate = "transform:translateY(" + (-i * step).toFixed(4) + "em)";
            if (i === count) {
                // the last stop lands exactly on 100%, so a single selector is
                // enough — emitting both would only duplicate the same value
                frames.push("100%{" + translate + "}");
            } else {
                var startPct = (i / count) * 100;
                var endPct = startPct + (100 / count) * 0.62;
                frames.push(
                    startPct.toFixed(2) + "%," + endPct.toFixed(2) + "%{" + translate + "}"
                );
            }
        }

        var style = document.createElement("style");
        style.textContent = "@keyframes reel-roll{" + frames.join("") + "}";
        document.head.appendChild(style);

        // own the whole shorthand so the duration and the keyframes can never
        // drift apart and leave a gap at the end of the loop
        track.style.animation =
            "reel-roll " +
            total.toFixed(2) +
            "s cubic-bezier(0.45,0,0.55,1) infinite";
    });

/* --------------------------------------------------------------------
       TECH TEXT — pointer-reactive canvas wordmark for the hero name
       Ported from reactbits TechText (canvas variant, no GSAP needed).

       How it works: the name is not DOM text, it is painted on a canvas as
       one small sprite per letter — a filled one and a "dashes" one (a dashed
       stroke with the interior punched out via destination-out). Moving the
       pointer swaps the letter under it from fill to outline, and a frame with
       blinking specks rides along. Letters can be dragged off the baseline and
       spring back; with the pointer away the reveal sweeps the word by itself.

       Accessibility is not delegated to the canvas: the h1 keeps its real text
       in the DOM (visually hidden but selectable and read by screen readers)
       and the canvas is aria-hidden, so the name survives with no JS at all.
       ------------------------------------------------------------------ */
    component("tech-text", function () {
        var el = document.querySelector("[data-tech-text]");
        if (!el) return;

        var settings = {
            text: (el.getAttribute("data-tech-text") || el.textContent).trim(),
            reveal: el.getAttribute("data-reveal-mode") || "letter",
            reach: 200,
            softness: 0.7,
            dashLength: 4,
            dashGap: 2,
            strokeWidth: 1.5,
            lineStyle: "dashed",
            specks: 15,
            selection: true,
            labels: true,
            draggable: true,
            sweep: true,
            speed: 1
        };

        if (!settings.text) return;

        var ctx = null;
        var scratch = document.createElement("canvas");
        var scratchCtx = scratch.getContext("2d");
        if (!scratchCtx) return;

        var canvas = document.createElement("canvas");
        canvas.className = "tech-text__canvas";
        canvas.setAttribute("aria-hidden", "true");
        el.appendChild(canvas);
        ctx = canvas.getContext("2d");
        if (!ctx) {
            canvas.remove();
            return;
        }

        var FALLOFF_STEPS = 8;
        var SPRING = 320;
        var DAMPING = 22;
        var reducedMotion = reduceMotion.matches;

        var width = 1;
        var height = 1;
        var dpr = 1;
        var raf = 0;
        var last = 0;
        var visible = true;
        var alive = true;
        var layoutKey = "";
        var requestedFont = "";
        var word = null;
        var glyphs = [];
        var presence = 0;
        var clock = 0;
        var pulse = 0;
        var placed = false;
        var dragging = -1;
        var pointer = { x: 0, y: 0, inside: false };
        var grab = { x: 0, y: 0 };
        var lens = { x: 0, y: 0 };
        var frame = { x1: 0, y1: 0, x2: 0, y2: 0, alpha: 0, index: -1 };

        // exp easing identical to reactbits' approach()
        function approach(current, target, dt, seconds) {
            return current + (target - current) * (1 - Math.exp(-dt / seconds));
        }

        function hexToRgb(hex) {
            var h = String(hex || "").replace("#", "");
            if (h.length === 3) {
                h = h.replace(/./g, function (c) {
                    return c + c;
                });
            }
            var n = parseInt(h.slice(0, 6), 16);
            if (isNaN(n)) return [255, 255, 255];
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        }

        function rgba(hex, alpha) {
            var c = hexToRgb(hex);
            return "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", " + alpha + ")";
        }

        /* deterministic value noise, so specks blink on their own schedule
           but always the same way for the same letter */
        function noise() {
            var values = Array.prototype.slice.call(arguments);
            var h = 2166136261;
            values.forEach(function (value) {
                h = Math.imul(h ^ (value | 0), 16777619);
                h ^= h >>> 13;
                h = Math.imul(h, 16777619 | 0);
                h ^= h >>> 15;
            });
            return (h >>> 0) / 4294967296;
        }

        function signed(value) {
            return value > 0 ? "+" + value : value < 0 ? "−" + -value : "0";
        }

        function refresh() {
            layoutKey = "";
            wake();
        }

        var style = getComputedStyle(el);
        function family() {
            return style.fontFamily || "sans-serif";
        }

        function setFont(target, size, weight) {
            target.font = (weight || style.fontWeight || 400) + " " + size + "px " + family();
            if ("letterSpacing" in target) {
                // read the container's tracking so canvas letters sit exactly on
                // the same rhythm as the DOM text they replace
                var ls = parseFloat(style.letterSpacing);
                if (!isNaN(ls)) target.letterSpacing = ls + "px";
            }
            target.textAlign = "left";
            target.textBaseline = "alphabetic";
        }

        function themeColor(prop) {
            return getComputedStyle(el).getPropertyValue(prop).trim();
        }

        /* One sprite per letter, per state. Rendering each letter once and
           blitting it is dramatically cheaper than stroking text every frame. */
        function sprite(view, glyph, stroke) {
            var pad = Math.ceil(settings.strokeWidth * 2 + 4);
            var left = glyph.box.x1 - pad;
            var top = glyph.box.y1 - pad;
            var w = glyph.box.x2 - glyph.box.x1 + pad * 2;
            var h = glyph.box.y2 - glyph.box.y1 + pad * 2;
            var image = document.createElement("canvas");
            image.width = Math.max(1, Math.ceil(w * dpr));
            image.height = Math.max(1, Math.ceil(h * dpr));
            var c = image.getContext("2d");
            if (!c) return { image: image, left: left, top: top };
            c.setTransform(dpr, 0, 0, dpr, -left * dpr, -top * dpr);
            setFont(c, view.size);
            var ink = themeColor("--text");
            if (stroke) {
                c.lineJoin = "round";
                c.lineWidth = settings.strokeWidth * 2;
                c.lineCap = "butt";
                c.strokeStyle = ink;
                if (settings.lineStyle !== "solid") {
                    c.setLineDash([
                        Math.max(1, settings.dashLength),
                        Math.max(1, settings.dashGap)
                    ]);
                }
                c.strokeText(glyph.char, glyph.x, view.baseline);
                c.setLineDash([]);
                // punch the interior out, leaving only the outer silhouette
                c.globalCompositeOperation = "destination-out";
                c.fillStyle = "#000";
                c.fillText(glyph.char, glyph.x, view.baseline);
                c.globalCompositeOperation = "source-over";
            } else {
                c.fillStyle = ink;
                c.fillText(glyph.char, glyph.x, view.baseline);
            }
            return { image: image, left: left, top: top };
        }

        function ensureLayout() {
            var weight = style.fontWeight || 400;
            var key = [
                settings.text,
                family(),
                weight,
                width,
                height,
                dpr,
                settings.dashLength,
                settings.dashGap,
                settings.strokeWidth,
                settings.lineStyle,
                themeColor("--text")
            ].join("|");
            if (key === layoutKey && word) return word;
            layoutKey = key;

            // the hero name is fluid CSS, so measure the live box and scale the
            // word to fit it rather than trusting a fixed pixel fontSize
            var probe = scratchCtx;
            var size = parseFloat(style.fontSize) || 96;
            setFont(probe, size, weight);
            var m = probe.measureText(settings.text);
            var fit = Math.min(
                1,
                (width * 0.98) / Math.max(m.actualBoundingBoxLeft + m.actualBoundingBoxRight, 1)
            );
            size = size * fit;
            setFont(probe, size, weight);
            m = probe.measureText(settings.text);
            var inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
            var inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
            var x = (width - inkW) / 2 + m.actualBoundingBoxLeft;
            var baseline = (height - inkH) / 2 + m.actualBoundingBoxAscent;
            var next = {
                size: size,
                baseline: baseline,
                left: x - m.actualBoundingBoxLeft,
                right: x + m.actualBoundingBoxRight,
                top: baseline - m.actualBoundingBoxAscent,
                bottom: baseline + m.actualBoundingBoxDescent
            };
            word = next;

            var chars = Array.from(settings.text);
            var previous = glyphs;
            glyphs = [];
            var prefix = "";
            chars.forEach(function (char, i) {
                prefix += char;
                var own = probe.measureText(char);
                var gx = x + probe.measureText(prefix).width - own.width;
                if (!char.trim()) return;
                var base = {
                    char: char,
                    x: gx,
                    box: {
                        x1: gx - own.actualBoundingBoxLeft,
                        y1: baseline - own.actualBoundingBoxAscent,
                        x2: gx + own.actualBoundingBoxRight,
                        y2: baseline + own.actualBoundingBoxDescent
                    }
                };
                var kept = previous[glyphs.length];
                glyphs.push({
                    char: base.char,
                    x: base.x,
                    box: base.box,
                    // keep offsets/velocities across re-layouts so a resize
                    // mid-drag does not teleport the letter
                    offset: kept && kept.char === char ? kept.offset : { x: 0, y: 0 },
                    velocity: kept && kept.char === char ? kept.velocity : { x: 0, y: 0 },
                    outline: kept ? kept.outline : 0,
                    index: i,
                    fill: sprite(next, base, false),
                    dashes: sprite(next, base, true)
                });
            });
            dragging = -1;
            frame.index = -1;
            return next;
        }

        function glyphAt(x, y) {
            if (!word || y < word.top - 24 || y > word.bottom + 24) return -1;
            var best = -1;
            var bestDistance = Infinity;
            glyphs.forEach(function (glyph, i) {
                var x1 = glyph.box.x1 + glyph.offset.x;
                var x2 = glyph.box.x2 + glyph.offset.x;
                var d = x < x1 ? x1 - x : x > x2 ? x - x2 : 0;
                if (d < bestDistance) {
                    bestDistance = d;
                    best = i;
                }
            });
            return bestDistance < 28 ? best : -1;
        }

        /* radial alpha ramp used to erase the fill under the lens */
        function falloff(target, cx, cy, radius, strength, softness) {
            var inner = Math.min(1, Math.max(0, 1 - softness));
            var gradient = target.createRadialGradient(cx, cy, 0, cx, cy, radius);
            gradient.addColorStop(0, "rgba(0, 0, 0, " + strength + ")");
            if (inner > 0.995) {
                gradient.addColorStop(0.995, "rgba(0, 0, 0, " + strength + ")");
                gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                return gradient;
            }
            for (var i = 0; i <= FALLOFF_STEPS; i++) {
                var t = i / FALLOFF_STEPS;
                var eased = t * t * (3 - 2 * t);
                gradient.addColorStop(
                    inner + (1 - inner) * t,
                    "rgba(0, 0, 0, " + (strength * (1 - eased)) + ")"
                );
            }
            return gradient;
        }

        function blit(target, art, dx, dy, originX, originY) {
            target.drawImage(
                art.image,
                Math.round((art.left + dx) * dpr - originX),
                Math.round((art.top + dy) * dpr - originY)
            );
        }

        function drawReveal() {
            var radius = settings.reach * dpr;
            var cx = lens.x * dpr;
            var cy = lens.y * dpr;
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = falloff(ctx, cx, cy, radius, presence, settings.softness);
            ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
            ctx.globalCompositeOperation = "source-over";

            // dashed silhouettes are composited only inside the lens, so the
            // outline never bleeds past the soft edge of the erase
            var x0 = Math.max(0, Math.floor(cx - radius));
            var y0 = Math.max(0, Math.floor(cy - radius));
            var x1 = Math.min(canvas.width, Math.ceil(cx + radius));
            var y1 = Math.min(canvas.height, Math.ceil(cy + radius));
            if (x1 <= x0 || y1 <= y0) return;
            var w = x1 - x0;
            var h = y1 - y0;
            if (scratch.width < w || scratch.height < h) {
                scratch.width = Math.max(scratch.width, w);
                scratch.height = Math.max(scratch.height, h);
            }
            scratchCtx.setTransform(1, 0, 0, 1, 0, 0);
            scratchCtx.globalCompositeOperation = "source-over";
            scratchCtx.clearRect(0, 0, w, h);
            glyphs.forEach(function (glyph) {
                blit(scratchCtx, glyph.dashes, glyph.offset.x, glyph.offset.y, x0, y0);
            });
            scratchCtx.globalCompositeOperation = "destination-in";
            scratchCtx.fillStyle = falloff(scratchCtx, cx - x0, cy - y0, radius, 1, settings.softness);
            scratchCtx.fillRect(0, 0, w, h);
            scratchCtx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = presence;
            ctx.drawImage(scratch, 0, 0, w, h, x0, y0, w, h);
            ctx.globalAlpha = 1;
        }

        function crisp(value) {
            return (Math.round(value * dpr) + 0.5) / dpr;
        }

        /* walk the perimeter of the selection frame; used by the specks */
        function perimeterPoint(distance, w, h) {
            var per = 2 * (w + h);
            var d = ((distance % per) + per) % per;
            if (d < w) return [frame.x1 + d, frame.y1, 0, -1];
            d -= w;
            if (d < h) return [frame.x2, frame.y1 + d, 1, 0];
            d -= h;
            if (d < w) return [frame.x2 - d, frame.y2, 0, 1];
            d -= w;
            return [frame.x1, frame.y2 - d, -1, 0];
        }

        function drawSpecks(a) {
            var w = frame.x2 - frame.x1;
            var h = frame.y2 - frame.y1;
            if (w < 2 || h < 2) return;
            var per = 2 * (w + h);
            var seed = frame.index + 1;
            var grid = 3;
            var accent = themeColor("--accent");

            for (var k = 0; k < settings.specks; k++) {
                var period = 0.5 + noise(seed, k, 11) * 1.2;
                var t = pulse / period + noise(seed, k, 17);
                var life = t - Math.floor(t);
                if (life > 0.7) continue;
                var pp = perimeterPoint(noise(seed, k, Math.floor(t)) * per, w, h);
                var pick = noise(seed, k, Math.floor(t), 2);
                var size = pick < 0.46 ? 2 : pick < 0.7 ? 3 : pick < 0.84 ? 5 : pick < 0.94 ? 8 : 11;
                var large = size >= 8;
                var out = (large ? 9 : 4) + Math.floor(noise(seed, k, Math.floor(t), 1) * 5) * grid;
                var x = frame.x1 + Math.round((pp[0] + pp[2] * out - frame.x1) / grid) * grid;
                var y = frame.y1 + Math.round((pp[1] + pp[3] * out - frame.y1) / grid) * grid;
                var tone = noise(seed, k, Math.floor(t), 3);
                var blink = life < 0.06 || (life > 0.32 && life < 0.36) ? 0.35 : 1;
                var alpha = a * (large ? 0.3 + 0.4 * tone : 0.3 + 0.6 * tone) * blink;
                var left = Math.round(x - size / 2);
                var top = Math.round(y - size / 2);
                if (tone < 0.26 || (large && tone < 0.78)) {
                    ctx.strokeStyle = rgba(accent, alpha);
                    ctx.strokeRect(left + 0.5, top + 0.5, size, size);
                    if (large && tone > 0.5) {
                        ctx.fillStyle = rgba(accent, alpha);
                        ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
                    }
                } else {
                    ctx.fillStyle = rgba(accent, alpha);
                    ctx.fillRect(left, top, size, size);
                }
            }

            // a short comet chasing the same perimeter
            for (var j = 0; j < 2; j++) {
                var head = (pulse * 0.42 * settings.speed + j * 0.5) * per;
                for (var i = 0; i < 4; i++) {
                    var p = perimeterPoint(head - i * 6, w, h);
                    var s = i === 0 ? 3 : 2;
                    ctx.fillStyle = rgba(accent, a * [0.95, 0.55, 0.32, 0.16][i]);
                    ctx.fillRect(Math.round(p[0] - s / 2), Math.round(p[1] - s / 2), s, s);
                }
            }
        }

        function drawFrame() {
            var glyph = glyphs[frame.index];
            if (!glyph || frame.alpha < 0.01) return;
            var a = frame.alpha;
            var accent = themeColor("--accent");
            var x1 = crisp(frame.x1);
            var y1 = crisp(frame.y1);
            var x2 = crisp(frame.x2);
            var y2 = crisp(frame.y2);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            var moved = Math.hypot(glyph.offset.x, glyph.offset.y);
            if (moved > 1) {
                // tether from the letter's home slot to where it was dragged
                var hx = (glyph.box.x1 + glyph.box.x2) / 2;
                var hy = (glyph.box.y1 + glyph.box.y2) / 2;
                ctx.beginPath();
                ctx.moveTo(hx, hy);
                ctx.lineTo(hx + glyph.offset.x, hy + glyph.offset.y);
                ctx.setLineDash([3, 4]);
                ctx.lineWidth = 1;
                ctx.strokeStyle = rgba(accent, 0.45 * a);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.rect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 4);
                ctx.fillStyle = rgba(accent, 0.7 * a);
                ctx.fill();
            }

            ctx.beginPath();
            ctx.rect(x1, y1, x2 - x1, y2 - y1);
            ctx.lineWidth = 1;
            ctx.strokeStyle = rgba(accent, 0.5 * a);
            ctx.stroke();

            // solid ticks at the four corners
            ctx.beginPath();
            [
                [x1, y1],
                [x2, y1],
                [x2, y2],
                [x1, y2]
            ].forEach(function (c) {
                ctx.rect(Math.round(c[0]) - 2, Math.round(c[1]) - 2, 5, 5);
            });
            ctx.fillStyle = rgba(accent, 0.95 * a);
            ctx.fill();

            if (settings.specks > 0) {
                ctx.lineWidth = 1;
                drawSpecks(a);
            }

            if (!settings.labels) return;
            ctx.font = "10px " + style.fontFamily;
            ctx.textAlign = "left";
            ctx.textBaseline = "bottom";
            ctx.fillStyle = rgba(accent, 0.62 * a);
            var label =
                moved > 1
                    ? signed(Math.round(glyph.offset.x)) + ", " + signed(Math.round(-glyph.offset.y))
                    : glyph.char + "  " + Math.round(glyph.box.x2 - glyph.box.x1) + " × " + Math.round(glyph.box.y2 - glyph.box.y1);
            ctx.fillText(label, Math.round(frame.x1), Math.round(frame.y1) - 7);
        }

        function tick(now) {
            raf = 0;
            var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
            last = now;
            var view = ensureLayout();

            // with no pointer nearby the reveal sweeps the word on its own
            var sweeping =
                settings.sweep && !reducedMotion && !pointer.inside && dragging < 0;
            if (sweeping) clock += dt * settings.speed;
            pulse += dt;
            var targetX = pointer.x;
            var targetY = pointer.y;
            if (sweeping) {
                targetX = view.left + (view.right - view.left) * (0.5 - 0.5 * Math.cos(clock * 0.45));
                targetY = view.top + (view.bottom - view.top) * (0.45 + 0.1 * Math.sin(clock * 0.8));
            }
            var active = pointer.inside || sweeping || dragging >= 0;
            if (active && !placed) {
                lens.x = targetX;
                lens.y = targetY;
            }
            if (active) {
                var lag = pointer.inside ? 0.05 : 0.22;
                lens.x = approach(lens.x, targetX, dt, lag);
                lens.y = approach(lens.y, targetY, dt, lag);
            }
            placed = active;
            var wantPresence =
                settings.reveal === "area" && active && dragging < 0 ? 1 : 0;
            presence = approach(presence, wantPresence, dt, 0.16);

            var moving = false;
            glyphs.forEach(function (glyph, i) {
                if (i === dragging) {
                    glyph.offset.x = approach(glyph.offset.x, pointer.x - grab.x, dt, 0.03);
                    glyph.offset.y = approach(glyph.offset.y, pointer.y - grab.y, dt, 0.03);
                    glyph.velocity.x = 0;
                    glyph.velocity.y = 0;
                    moving = true;
                    return;
                }
                var offset = glyph.offset;
                var velocity = glyph.velocity;
                if (
                    Math.abs(offset.x) < 0.05 &&
                    Math.abs(offset.y) < 0.05 &&
                    Math.hypot(velocity.x, velocity.y) < 0.5
                ) {
                    offset.x = 0;
                    offset.y = 0;
                    velocity.x = 0;
                    velocity.y = 0;
                    return;
                }
                velocity.x += (-SPRING * offset.x - DAMPING * velocity.x) * dt;
                velocity.y += (-SPRING * offset.y - DAMPING * velocity.y) * dt;
                offset.x += velocity.x * dt;
                offset.y += velocity.y * dt;
                moving = true;
            });

            var focus = dragging >= 0 ? dragging : active ? glyphAt(lens.x, lens.y) : -1;
            if (focus >= 0 && settings.selection) {
                var g = glyphs[focus];
                var bx1 = g.box.x1 + g.offset.x - 6;
                var by1 = g.box.y1 + g.offset.y - 6;
                var bx2 = g.box.x2 + g.offset.x + 6;
                var by2 = g.box.y2 + g.offset.y + 6;
                if (frame.index < 0 || frame.alpha < 0.02) {
                    frame.x1 = bx1;
                    frame.y1 = by1;
                    frame.x2 = bx2;
                    frame.y2 = by2;
                }
                var glide = focus === dragging ? 0.02 : 0.08;
                frame.x1 = approach(frame.x1, bx1, dt, glide);
                frame.y1 = approach(frame.y1, by1, dt, glide);
                frame.x2 = approach(frame.x2, bx2, dt, glide);
                frame.y2 = approach(frame.y2, by2, dt, glide);
                frame.index = focus;
            }
            frame.alpha = approach(
                frame.alpha,
                focus >= 0 && settings.selection ? 1 : 0,
                dt,
                0.1
            );

            glyphs.forEach(function (glyph, i) {
                var want = settings.reveal === "letter" && i === focus && i !== dragging ? 1 : 0;
                glyph.outline = approach(glyph.outline, want, dt, 0.09);
                if (Math.abs(glyph.outline - want) > 0.002) moving = true;
                else glyph.outline = want;
            });

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = "source-over";
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // ghost silhouette trails a dragged letter
            glyphs.forEach(function (glyph) {
                var moved = Math.hypot(glyph.offset.x, glyph.offset.y);
                if (moved > 1) {
                    ctx.globalAlpha = Math.min(1, moved / 24) * 0.55;
                    blit(ctx, glyph.dashes, 0, 0, 0, 0);
                    ctx.globalAlpha = 1;
                }
            });
            glyphs.forEach(function (glyph) {
                if (glyph.outline < 0.999) {
                    ctx.globalAlpha = 1 - glyph.outline;
                    blit(ctx, glyph.fill, glyph.offset.x, glyph.offset.y, 0, 0);
                }
                if (glyph.outline > 0.001) {
                    ctx.globalAlpha = glyph.outline;
                    blit(ctx, glyph.dashes, glyph.offset.x, glyph.offset.y, 0, 0);
                }
                ctx.globalAlpha = 1;
            });
            if (presence > 0.001) drawReveal();
            drawFrame();

            var settling =
                moving ||
                Math.abs(presence - wantPresence) > 0.002 ||
                (frame.alpha > 0.01 && frame.alpha < 0.99);
            if ((active || settling) && visible && alive) raf = requestAnimationFrame(tick);
        }

        function wake() {
            if (raf || !visible || !alive) return;
            last = performance.now();
            raf = requestAnimationFrame(tick);
        }

        function resize() {
            width = Math.max(1, el.clientWidth);
            height = Math.max(1, el.clientHeight);
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
            layoutKey = "";
            wake();
        }

        function locate(e) {
            var rect = el.getBoundingClientRect();
            pointer.x = e.clientX - rect.left;
            pointer.y = e.clientY - rect.top;
        }

        function onMove(e) {
            locate(e);
            pointer.inside = true;
            wake();
        }

        function onLeave() {
            if (dragging >= 0) return;
            pointer.inside = false;
            wake();
        }

        function onDown(e) {
            locate(e);
            pointer.inside = true;
            if (settings.draggable && (e.pointerType !== "mouse" || e.button === 0)) {
                var index = glyphAt(pointer.x, pointer.y);
                if (index >= 0) {
                    dragging = index;
                    grab.x = pointer.x - glyphs[index].offset.x;
                    grab.y = pointer.y - glyphs[index].offset.y;
                    if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
                }
            }
            wake();
        }

        function onUp(e) {
            if (dragging >= 0) {
                dragging = -1;
                if (el.releasePointerCapture) el.releasePointerCapture(e.pointerId);
                var rect = el.getBoundingClientRect();
                pointer.inside =
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom;
            }
            wake();
        }

        el.addEventListener("pointermove", onMove, { passive: true });
        el.addEventListener("pointerenter", onMove, { passive: true });
        el.addEventListener("pointerdown", onDown, { passive: true });
        el.addEventListener("pointerup", onUp, { passive: true });
        el.addEventListener("pointercancel", onUp, { passive: true });
        el.addEventListener("pointerleave", onLeave, { passive: true });

        // fonts swap in after first paint and change every metric, so relayout
        var ro = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
        if (ro) ro.observe(el);
        if ("IntersectionObserver" in window) {
            // the callback hands over a list, not a single entry
            var io = new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
                wake();
            });
            io.observe(el);
        }
        if (document.fonts && document.fonts.load) {
            var wanted = style.fontWeight + " " + (parseFloat(style.fontSize) || 96) + "px " + family();
            if (wanted !== requestedFont) {
                requestedFont = wanted;
                document.fonts.load(wanted, settings.text).then(refresh, refresh);
            }
            document.fonts.ready.then(refresh, refresh);
        }
        // theme switch repaints the sprites; read it as an event, not per frame
        if ("MutationObserver" in window) {
            new MutationObserver(refresh).observe(root, {
                attributes: true,
                attributeFilter: ["data-theme"]
            });
        }
        window.addEventListener("resize", resize);

        resize();
        // only now is it safe to hide the DOM text: if anything above bailed
        // out, the name is still readable as plain text
        el.classList.add("is-canvas");
        // the idle sweep is the resting state, so it has to be awake from the
        // start rather than waiting for the first pointer event
        if (settings.sweep && !reducedMotion) wake();
    });

    /* --------------------------------------------------------------------
       PROGRESS TICKS — build the segmented level meters
       Ported from Bencho progress-ticks
       ------------------------------------------------------------------ */
    component("progress-ticks", function () {
        document.querySelectorAll("[data-ticks]").forEach(function (el) {
            if (el.children.length) return;
            var total = parseInt(el.getAttribute("data-ticks"), 10) || 5;
            var filled = parseInt(el.getAttribute("data-filled"), 10) || 0;

            var frag = document.createDocumentFragment();
            for (var i = 0; i < total; i++) {
                var tick = document.createElement("span");
                tick.className = "tick" + (i < filled ? " is-filled" : "");
                frag.appendChild(tick);
            }
            el.appendChild(frag);

            // expose the level to assistive tech, the bars are decorative
            var skill = el.closest("[data-skill]");
            if (skill) {
                var level = skill.getAttribute("data-level");
                var name = skill.querySelector(".skill__name");
                if (level && name) {
                    skill.setAttribute("aria-label", name.textContent + ", level " + level + " out of 100");
                }
            }
        });
    });

    /* --------------------------------------------------------------------
       CLICK SPARK
       Ported from ObsidianUI click-spark
       ------------------------------------------------------------------ */
    component("click-spark", function () {
        var canvas = document.getElementById("clickSpark");
        if (!canvas) return;
        if (reduceMotion.matches) return;

        var ctx = canvas.getContext("2d");
        if (!ctx) return;

        var SPARK_SIZE = 10;
        var SPARK_RADIUS = 16;
        var SPARK_COUNT = 8;
        var DURATION = 400;
        var sparks = [];
        var dpr = Math.min(window.devicePixelRatio || 1, 2);

        function resize() {
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function sparkColor() {
            // resolved so the spark matches whichever theme is active
            return getComputedStyle(root).getPropertyValue("--text").trim() || "#fff";
        }

        function draw(now) {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            var color = sparkColor();

            sparks = sparks.filter(function (s) {
                var elapsed = now - s.start;
                if (elapsed >= DURATION) return false;

                var p = elapsed / DURATION;
                var eased = p * (2 - p); // ease-out
                var dist = eased * SPARK_RADIUS;
                var len = SPARK_SIZE * (1 - eased);

                var cos = Math.cos(s.angle);
                var sin = Math.sin(s.angle);

                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(s.x + dist * cos, s.y + dist * sin);
                ctx.lineTo(s.x + (dist + len) * cos, s.y + (dist + len) * sin);
                ctx.stroke();
                return true;
            });

            requestAnimationFrame(draw);
        }

        function emit(x, y) {
            var now = performance.now();
            for (var i = 0; i < SPARK_COUNT; i++) {
                sparks.push({
                    x: x,
                    y: y,
                    angle: (2 * Math.PI * i) / SPARK_COUNT,
                    start: now
                });
            }
        }

        resize();
        window.addEventListener("resize", resize);
        document.addEventListener("click", function (e) {
            emit(e.clientX, e.clientY);
        });
        document.addEventListener(
            "touchstart",
            function (e) {
                Array.prototype.forEach.call(e.changedTouches, function (t) {
                    emit(t.clientX, t.clientY);
                });
            },
            { passive: true }
        );
        requestAnimationFrame(draw);
    });

    /* --------------------------------------------------------------------
       FLEX CAROUSEL — seamless continuous rail
       Ported from reactbits FlexCarousel: a flex row that scrolls forever
       because items are recycled to the tail the moment they clear the left
       edge, instead of being cloned into a fixed-width track and wrapped.
       ------------------------------------------------------------------ */
    component("flex-carousel", function () {
        var roots = document.querySelectorAll("[data-flex-carousel]");
        if (!roots.length) return;

        roots.forEach(function (root) {
            var track = root.querySelector("[data-flex-carousel-track]");
            if (!track) return;

            var VELOCITY = 44; // px per second
            var EASE = 0.09; // how fast the speed eases toward its target
            var FILL_RATIO = 2; // track width vs. viewport width

            // a rail that cannot be paused is a liability: with reduced motion,
            // or on a pointer that cannot hover, hand over to native scrolling
            var isStatic =
                reduceMotion.matches ||
                !window.matchMedia("(hover: hover) and (pointer: fine)").matches;

            var items = Array.prototype.slice.call(track.children);
            if (!items.length) return;

            var offset = 0;
            var speed = 0;
            var isPaused = false;
            var isHidden = false;
            var lastT = 0;
            var rafId = null;

            function gapPx() {
                var s = getComputedStyle(track);
                return parseFloat(s.columnGap || s.gap || 0) || 0;
            }

            /* stride = item width + the gap that follows it. Cached per element
               because items move around the track as they are recycled. */
            function strideOf(item) {
                if (!item._fcStride) {
                    item._fcStride = item.getBoundingClientRect().width + gapPx();
                }
                return item._fcStride;
            }

            function cycle() {
                var total = 0;
                Array.prototype.forEach.call(track.children, function (el) {
                    total += strideOf(el);
                });
                return total;
            }

            function fill() {
                // a static strip is natively scrollable, so there is nothing
                // to fill and no point cloning anything
                if (isStatic) return;

                var need = root.clientWidth * FILL_RATIO;
                var have = cycle();
                var i = 0;
                while (have < need && i < items.length * 6) {
                    var clone = items[i % items.length].cloneNode(true);
                    clone.classList.add("flex-carousel__item", "is-clone");
                    // clones exist to fill the rail, never to be read twice
                    clone.setAttribute("aria-hidden", "true");
                    clone.removeAttribute("data-skill");
                    track.appendChild(clone);
                    have += strideOf(clone);
                    i++;
                }
            }

            function normalize() {
                if (isStatic) return;
                var total = cycle();
                if (total) offset = ((offset % total) + total) % total - total;
            }

            function apply() {
                if (isStatic) return;
                track.style.transform = "translate3d(" + offset.toFixed(2) + "px,0,0)";
            }

            function tick(now) {
                rafId = requestAnimationFrame(tick);

                var dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 0.016;
                lastT = now;

                var target = isPaused ? 0 : VELOCITY;
                speed += (target - speed) * EASE;
                if (Math.abs(speed - target) < 0.05) speed = target;
                offset -= speed * dt;

                // recycle: a fully passed item re-enters on the right, which is
                // visually identical to never having left
                var first = track.firstElementChild;
                while (first && offset <= -strideOf(first)) {
                    offset += strideOf(first);
                    track.appendChild(first);
                    first = track.firstElementChild;
                }

                apply();
            }

            function measure() {
                // widths change with the fluid type scale, so re-read them all
                Array.prototype.forEach.call(track.children, function (el) {
                    el._fcStride = 0;
                });
                normalize();
                apply();
            }

            fill();
            normalize();

            if (!isStatic) {
                rafId = requestAnimationFrame(tick);

                root.addEventListener("mouseenter", function () {
                    isPaused = true;
                });
                root.addEventListener("mouseleave", function () {
                    isPaused = false;
                });

                // keyboard: about a third of the viewport per keypress
                root.addEventListener("keydown", function (e) {
                    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                    e.preventDefault();
                    var step = root.clientWidth * 0.33;
                    offset += e.key === "ArrowLeft" ? step : -step;
                    normalize();
                    apply();
                });
            }
            // on a static strip the arrow keys are left to the browser, which
            // already scrolls a focusable overflow container

            // a backgrounded tab has no business burning frames
            document.addEventListener("visibilitychange", function () {
                if (document.hidden) {
                    if (rafId) cancelAnimationFrame(rafId);
                    rafId = null;
                    isHidden = true;
                } else if (isHidden && !isStatic) {
                    lastT = 0;
                    rafId = requestAnimationFrame(tick);
                    isHidden = false;
                }
            });

            var resizeRaf = null;
            function scheduleMeasure() {
                if (resizeRaf) cancelAnimationFrame(resizeRaf);
                resizeRaf = requestAnimationFrame(measure);
            }
            window.addEventListener("resize", scheduleMeasure);
            if ("ResizeObserver" in window) {
                new ResizeObserver(scheduleMeasure).observe(track);
            }
        });
    });

    /* --------------------------------------------------------------------
       PARTICLES — orbital systems behind the hero
       Ported from Bencho particles (hover mode), reshaped into a few
       concentric orrery patterns instead of one random field
       ------------------------------------------------------------------ */
    component("particles", function () {
        var canvas = document.querySelector("[data-particles]");
        if (!canvas) return;

        var ctx = canvas.getContext("2d");
        if (!ctx) return;

        var MAX_DPR = 2;
        var ORBIT_SQUASH = 0.46; // edge-on, so the stack reads as one plane
        var ORBIT_TILT = -0.35; // radians. Squashing alone still reads as a flat
        // ring; rotating every ring about one shared axis is what makes the
        // stack read as a disc seen at an angle.
        var COS_T = Math.cos(ORBIT_TILT);
        var SIN_T = Math.sin(ORBIT_TILT);
        var CORE_R = 2.6;
        var PUSH_R = 90; // how far the cursor can shove a body off its orbit
        var LINK_R = 150; // cursor tether reach

        // ring radius as a share of the system size, and how many bodies sit on
        // it. The innermost ring carries the fewest, so density falls outward
        // the way a real system thins out. Inner rings run faster, so the whole
        // system shears instead of rotating as one rigid disc.
        var RINGS = [
            { r: 0.3, n: 5, speed: 1.0, dot: 1.5 },
            { r: 0.56, n: 8, speed: 0.62, dot: 1.3 },
            { r: 0.8, n: 10, speed: 0.4, dot: 1.1 },
            { r: 1.0, n: 13, speed: 0.27, dot: 0.95 }
        ];
        var CORE_BODIES = 5;

        var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        var w = 0;
        var h = 0;
        var systems = [];
        var rafId = null;
        var visible = true;
        var pointer = { x: 0, y: 0, active: false };

        // The ink comes from the canvas' own computed `color`, which the theme
        // sets through ordinary cascade. Nothing here knows a token name, so a
        // theme can recolour the field without touching this file, and there is
        // no hardcoded palette to fall out of sync.
        //
        // Re-read only when the theme attribute flips: getComputedStyle on every
        // frame is a forced style recalc and costs more than the drawing does.
        var ink = "#ff7a1a";

        function readTheme() {
            ink = getComputedStyle(canvas).color.trim() || "#ff7a1a";
        }

        /* One disc, not two. Two small systems read as noise on opposite
           corners; one larger one reads as a single deliberate object. It sits
           right of centre so the dense inner rings stay clear of the left half
           of the wordmark, and the orbits cross the headline as a background
           rather than fighting it. Fractions of the hero box, so the pattern
           holds its shape at any size. */
        function layout() {
            var narrow = w / h < 1.1;
            var m = Math.min(w, h);
            systems = [];

            if (narrow) {
                addSystem(0.5, 0.42, m * 0.44, 1);
            } else {
                addSystem(0.62, 0.46, m * 0.4, 1);
            }
        }

        function addSystem(nx, ny, size, dir) {
            var sys = {
                cx: nx * w,
                cy: ny * h,
                dir: dir,
                spin: 0,
                core: [],
                rings: []
            };

            // the central body as a small cluster, so the middle has weight
            for (var c = 0; c < CORE_BODIES; c++) {
                sys.core.push({
                    a: (c / CORE_BODIES) * Math.PI * 2,
                    d: size * 0.05 * (0.4 + ((c * 7) % 5) / 5),
                    sp: 0.5 + ((c * 3) % 4) * 0.12,
                    r: CORE_R * (c === 0 ? 1.5 : 0.62),
                    ox: 0,
                    oy: 0,
                    x: 0,
                    y: 0,
                    hx: 0,
                    hy: 0
                });
            }

            for (var i = 0; i < RINGS.length; i++) {
                var def = RINGS[i];
                var ring = {
                    rx: size * def.r,
                    ry: size * def.r * ORBIT_SQUASH,
                    speed: def.speed,
                    angle: Math.random() * Math.PI * 2,
                    dot: def.dot,
                    parts: []
                };
                for (var n = 0; n < def.n; n++) {
                    ring.parts.push({
                        phase: (n / def.n) * Math.PI * 2,
                        drift: 0.94 + Math.random() * 0.12,
                        wob: Math.random() * Math.PI * 2,
                        wx: 0.03 + Math.random() * 0.05,
                        wy: 0.03 + Math.random() * 0.05,
                        ox: 0,
                        oy: 0,
                        x: 0,
                        y: 0,
                        hx: 0,
                        hy: 0
                    });
                }
                sys.rings.push(ring);
            }
            systems.push(sys);
        }

        function resize() {
            var rect = canvas.getBoundingClientRect();
            w = rect.width;
            h = rect.height;
            if (!w || !h) return;
            dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            layout();
        }

        function draw() {
            rafId = null;
            if (!visible) return;

            var animated = !reduceMotion.matches;
            var i;
            var j;
            var k;
            var s;
            var ring;
            var p;
            var a;
            var dx;
            var dy;
            var d2;
            var push;
            var d;
            var t = 0;

            ctx.clearRect(0, 0, w, h);

            if (animated) {
                t = performance.now();
                for (i = 0; i < systems.length; i++) {
                    systems[i].spin = (t * 0.00016) * systems[i].dir;
                }
            }

            // the orbit paths, so the pattern still reads where no body sits.
            // Same ink as the bodies, carried down by globalAlpha.
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1;
            for (i = 0; i < systems.length; i++) {
                s = systems[i];
                for (j = 0; j < s.rings.length; j++) {
                    ring = s.rings[j];
                    ctx.globalAlpha = 0.17 - j * 0.024;
                    ctx.beginPath();
                    ctx.ellipse(s.cx, s.cy, ring.rx, ring.ry, ORBIT_TILT, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;

            ctx.fillStyle = ink;
            var pushR2 = PUSH_R * PUSH_R;

            for (i = 0; i < systems.length; i++) {
                s = systems[i];

                for (j = 0; j < s.rings.length; j++) {
                    ring = s.rings[j];
                    if (animated) ring.angle += 0.0034 * ring.speed * s.dir;

                    for (k = 0; k < ring.parts.length; k++) {
                        p = ring.parts[k];
                        a = ring.angle + p.phase * p.drift + s.spin * p.drift;

                        // a slow radial wobble keeps a ring from looking like a
                        // dashed circle, without letting a body leave it
                        var wob = p.wob + (animated ? t * 0.00055 * p.drift : 0);
                        var rx = ring.rx * (1 + Math.sin(wob) * p.wx);
                        var ry = ring.ry * (1 + Math.cos(wob * 1.3) * p.wy);

                        // the ring is drawn tilted, so the body has to be
                        // placed through the same rotation or the dots drift
                        // off their own path
                        var bx = Math.cos(a) * rx;
                        var by = Math.sin(a) * ry;
                        p.hx = s.cx + bx * COS_T - by * SIN_T;
                        p.hy = s.cy + bx * SIN_T + by * COS_T;

                        if (animated && pointer.active) {
                            dx = p.hx - pointer.x;
                            dy = p.hy - pointer.y;
                            d2 = dx * dx + dy * dy;
                            if (d2 < pushR2 && d2 > 0.01) {
                                d = Math.sqrt(d2);
                                push = (1 - d / PUSH_R) * 1.6;
                                p.ox += (dx / d) * push;
                                p.oy += (dy / d) * push;
                            }
                            // spring back to the orbit: the cursor may disturb
                            // the pattern but never break it
                            p.ox *= 0.9;
                            p.oy *= 0.9;
                        }

                        p.x = p.hx + p.ox;
                        p.y = p.hy + p.oy;

                        ctx.beginPath();
                        ctx.arc(p.x, p.y, ring.dot, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                for (k = 0; k < s.core.length; k++) {
                    p = s.core[k];
                    a = p.a + s.spin * p.sp;
                    var cbx = Math.cos(a) * p.d;
                    var cby = Math.sin(a) * p.d * ORBIT_SQUASH;
                    p.hx = s.cx + cbx * COS_T - cby * SIN_T;
                    p.hy = s.cy + cbx * SIN_T + cby * COS_T;

                    if (animated && pointer.active) {
                        dx = p.hx - pointer.x;
                        dy = p.hy - pointer.y;
                        d2 = dx * dx + dy * dy;
                        if (d2 < pushR2 && d2 > 0.01) {
                            d = Math.sqrt(d2);
                            push = (1 - d / PUSH_R) * 1.6;
                            p.ox += (dx / d) * push;
                            p.oy += (dy / d) * push;
                        }
                        p.ox *= 0.9;
                        p.oy *= 0.9;
                    }

                    p.x = p.hx + p.ox;
                    p.y = p.hy + p.oy;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // tether the nearest bodies to the cursor, so the hover reads as a
            // response instead of the pattern drifting past untouched
            if (animated && pointer.active) {
                ctx.strokeStyle = ink;
                ctx.lineWidth = 1;
                var linked = 0;
                var linkR2 = LINK_R * LINK_R;
                for (i = 0; i < systems.length && linked < 14; i++) {
                    s = systems[i];
                    for (j = 0; j < s.rings.length; j++) {
                        ring = s.rings[j];
                        for (k = 0; k < ring.parts.length && linked < 14; k++) {
                            p = ring.parts[k];
                            dx = p.x - pointer.x;
                            dy = p.y - pointer.y;
                            d2 = dx * dx + dy * dy;
                            if (d2 > linkR2) continue;
                            d = Math.sqrt(d2);
                            ctx.globalAlpha = (1 - d / LINK_R) * 0.85;
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(pointer.x, pointer.y);
                            ctx.stroke();
                            linked++;
                        }
                    }
                }
                ctx.globalAlpha = 1;
            }

            if (animated) rafId = requestAnimationFrame(draw);
        }

        function wake() {
            if (rafId === null) rafId = requestAnimationFrame(draw);
        }

        function track(e) {
            var rect = canvas.getBoundingClientRect();
            pointer.x = e.clientX - rect.left;
            pointer.y = e.clientY - rect.top;
            if (!pointer.active) {
                pointer.active = true;
                wake();
            }
        }

        resize();
        readTheme();

        window.addEventListener("resize", function () {
            resize();
            wake();
        });

        window.addEventListener("pointermove", track, { passive: true });
        window.addEventListener("pointerdown", track, { passive: true });
        window.addEventListener("pointerleave", function () {
            pointer.active = false;
        });

        // the palette is only re-read when the theme attribute actually flips,
        // so the hot loop never touches getComputedStyle
        if (window.MutationObserver) {
            new MutationObserver(readTheme).observe(root, {
                attributes: true,
                attributeFilter: ["data-theme"]
            });
        }

        // the field covers the whole hero, so stop painting once it scrolls away
        if ("IntersectionObserver" in window) {
            var io = new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
                if (visible) wake();
                else if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            });
            io.observe(canvas);
        }

        if (reduceMotion.matches) {
            // one static frame: the orrery holds still but is fully drawn
            pointer.active = false;
            draw();
        } else {
            wake();
        }
    });

    /* --------------------------------------------------------------------
       CAROUSEL — snap scroller with drag, dots and buttons
       Ported from Bencho carousel
       ------------------------------------------------------------------ */
    component("carousel", function () {
        var root_ = document.querySelector("[data-carousel]");
        if (!root_) return;

        var viewport = root_.querySelector("[data-carousel-viewport]");
        var track = root_.querySelector("[data-carousel-track]");
        var dotsBox = root_.querySelector("[data-carousel-dots]");
        var prevBtn = root_.querySelector("[data-carousel-prev]");
        var nextBtn = root_.querySelector("[data-carousel-next]");
        if (!viewport || !track) return;

        var slides = Array.prototype.slice.call(track.children);
        var index = 0;
        var dots = [];

        function step() {
            if (slides.length < 2) return viewport.clientWidth;
            var gap = parseFloat(getComputedStyle(track).columnGap || 0) || 0;
            return slides[1].getBoundingClientRect().left -
                slides[0].getBoundingClientRect().left -
                gap;
        }

        function goTo(i, smooth) {
            index = clamp(i, 0, slides.length - 1);
            viewport.scrollTo({
                left: index * step(),
                behavior: smooth && !reduceMotion.matches ? "smooth" : "auto"
            });
            sync();
        }

        function sync() {
            slides.forEach(function (s, i) {
                s.classList.toggle("is-active", i === index);
            });
            dots.forEach(function (d, i) {
                d.classList.toggle("is-active", i === index);
                d.setAttribute("aria-current", i === index ? "true" : "false");
            });
            if (prevBtn) prevBtn.disabled = index === 0;
            if (nextBtn) nextBtn.disabled = index === slides.length - 1;
        }

        // build one dot per slide
        if (dotsBox) {
            slides.forEach(function (_, i) {
                var dot = document.createElement("button");
                dot.type = "button";
                dot.className = "carousel__dot cursor-target";
                dot.setAttribute("aria-label", "Go to step " + (i + 1));
                dot.addEventListener("click", function () {
                    goTo(i, true);
                });
                dotsBox.appendChild(dot);
                dots.push(dot);
            });
        }

        // Every slide snaps to the left edge, which means the last one is
        // unreachable unless the track is padded out to fill whatever is left
        // of the viewport. Without this the final dot scrolls to a stop and the
        // last card can never sit at the start.
        var spacer = document.createElement("li");
        spacer.className = "carousel__spacer";
        spacer.setAttribute("aria-hidden", "true");
        track.appendChild(spacer);

        function fit() {
            var cs = getComputedStyle(viewport);
            var padL = parseFloat(cs.paddingLeft) || 0;
            var padR = parseFloat(cs.paddingRight) || 0;
            var last = slides[slides.length - 1];
            var visible = viewport.clientWidth - padL - padR;
            var extra = Math.max(0, visible - (last ? last.offsetWidth : 0));
            spacer.style.flexBasis = extra + "px";
        }

        fit();

        if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1, true); });
        if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1, true); });

        // the dots are the single source of truth for "where am I"
        var scrollRaf = null;
        viewport.addEventListener(
            "scroll",
            function () {
                if (scrollRaf) return;
                scrollRaf = requestAnimationFrame(function () {
                    scrollRaf = null;
                    var s = step();
                    index = s ? clamp(Math.round(viewport.scrollLeft / s), 0, slides.length - 1) : 0;
                    sync();
                });
            },
            { passive: true }
        );

        // drag-to-scroll for mouse; touch keeps native momentum scrolling
        var dragX = 0;
        var dragLeft = 0;
        var dragging = false;
        var moved = false;
        var pointerId = null;

        viewport.addEventListener("pointerdown", function (e) {
            if (e.pointerType !== "mouse" || e.button !== 0) return;
            if (e.target.closest("button, a")) return;
            dragging = true;
            moved = false;
            pointerId = e.pointerId;
            dragX = e.clientX;
            dragLeft = viewport.scrollLeft;
            viewport.classList.add("is-dragging");
        });

        window.addEventListener("pointermove", function (e) {
            if (!dragging || e.pointerId !== pointerId) return;
            var dx = e.clientX - dragX;
            if (Math.abs(dx) > 3) moved = true;
            viewport.scrollLeft = dragLeft - dx;
        });

        function endDrag(e) {
            if (!dragging || (e && e.pointerId !== pointerId)) return;
            dragging = false;
            pointerId = null;
            viewport.classList.remove("is-dragging");
            if (moved) {
                // let the snap position take over, then snap to it
                var s = step();
                if (s) {
                    index = clamp(Math.round(viewport.scrollLeft / s), 0, slides.length - 1);
                    goTo(index, true);
                }
            }
        }

        window.addEventListener("pointerup", endDrag);
        window.addEventListener("pointercancel", endDrag);

        // keyboard, on the buttons and on the viewport itself
        viewport.addEventListener("keydown", function (e) {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            var dir = e.key === "ArrowRight" ? 1 : -1;
            e.preventDefault();
            goTo(index + dir, true);
        });

        var resizeRaf = null;
        window.addEventListener("resize", function () {
            if (resizeRaf) cancelAnimationFrame(resizeRaf);
            resizeRaf = requestAnimationFrame(function () {
                // keep the same slide under the viewport after a reflow
                fit();
                goTo(index, false);
            });
        });

        sync();
    });

    /* --------------------------------------------------------------------
       TILT CARD
       Ported from Bencho tilt-card
       ------------------------------------------------------------------ */
    component("tilt-card", function () {
        var cards = document.querySelectorAll("[data-tilt]");
        if (!cards.length || reduceMotion.matches) return;

        var MAX = 7; // degrees

        cards.forEach(function (card) {
            var hasGlare = card.hasAttribute("data-tilt-glare");
            var rafId = null;
            var target = { x: 0, y: 0 };
            var current = { x: 0, y: 0 };

            function loop() {
                current.x += (target.x - current.x) * 0.16;
                current.y += (target.y - current.y) * 0.16;

                if (Math.abs(target.x - current.x) < 0.01 && Math.abs(target.y - current.y) < 0.01) {
                    current.x = target.x;
                    current.y = target.y;
                    card.style.setProperty("--tilt-x", current.x.toFixed(3) + "deg");
                    card.style.setProperty("--tilt-y", current.y.toFixed(3) + "deg");
                    rafId = null;
                    return;
                }
                card.style.setProperty("--tilt-x", current.x.toFixed(3) + "deg");
                card.style.setProperty("--tilt-y", current.y.toFixed(3) + "deg");
                rafId = requestAnimationFrame(loop);
            }

            function start() {
                card.classList.add("is-tilting");
                if (rafId === null) rafId = requestAnimationFrame(loop);
            }

            card.addEventListener("pointermove", function (e) {
                if (e.pointerType === "touch") return;
                var r = card.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width;
                var py = (e.clientY - r.top) / r.height;

                target.y = (px - 0.5) * 2 * MAX;
                target.x = -(py - 0.5) * 2 * MAX;

                if (hasGlare) {
                    card.style.setProperty("--glare-x", (px * 100).toFixed(1) + "%");
                    card.style.setProperty("--glare-y", (py * 100).toFixed(1) + "%");
                }
                start();
            });

            function reset() {
                target.x = 0;
                target.y = 0;
                start();
            }

            card.addEventListener("pointerleave", reset);
            card.addEventListener("blur", reset, true);
        });
    });

    /* --------------------------------------------------------------------
       MAGNETIC BUTTON
       Ported from Bencho magnetic-button
       ------------------------------------------------------------------ */
    component("magnetic-button", function () {
        var els = document.querySelectorAll("[data-magnetic]");
        if (!els.length || reduceMotion.matches) return;

        var STRENGTH = 0.28;
        var RADIUS = 1.35; // how far outside the element it still pulls

        els.forEach(function (el) {
            var rafId = null;
            var target = { x: 0, y: 0 };
            var current = { x: 0, y: 0 };
            var active = false;

            function loop() {
                current.x += (target.x - current.x) * 0.18;
                current.y += (target.y - current.y) * 0.18;

                if (
                    Math.abs(target.x - current.x) < 0.05 &&
                    Math.abs(target.y - current.y) < 0.05
                ) {
                    current.x = target.x;
                    current.y = target.y;
                    el.style.setProperty("--mx", current.x.toFixed(2) + "px");
                    el.style.setProperty("--my", current.y.toFixed(2) + "px");
                    rafId = null;
                    if (!active) return;
                    rafId = requestAnimationFrame(loop);
                    return;
                }

                el.style.setProperty("--mx", current.x.toFixed(2) + "px");
                el.style.setProperty("--my", current.y.toFixed(2) + "px");
                rafId = requestAnimationFrame(loop);
            }

            function start() {
                if (rafId === null) rafId = requestAnimationFrame(loop);
            }

            el.addEventListener("pointermove", function (e) {
                if (e.pointerType === "touch") return;
                var r = el.getBoundingClientRect();
                var cx = r.left + r.width / 2;
                var cy = r.top + r.height / 2;
                var dx = e.clientX - cx;
                var dy = e.clientY - cy;

                // clamp the pull zone so it feels bounded, not rubbery
                var reach = Math.max(r.width, r.height) * RADIUS;
                var dist = Math.hypot(dx, dy) || 1;
                var scale = dist > reach ? reach / dist : 1;

                active = true;
                target.x = dx * scale * STRENGTH;
                target.y = dy * scale * STRENGTH;
                start();
            });

            function release() {
                active = false;
                target.x = 0;
                target.y = 0;
                start();
            }

            el.addEventListener("pointerleave", release);
            el.addEventListener("blur", release, true);
        });
    });

    /* --------------------------------------------------------------------
       SLIDE TO CONFIRM
       Ported from Bencho slide-to-confirm
       ------------------------------------------------------------------ */
    component("slide-to-confirm", function () {
        var track = document.getElementById("slideTrack");
        var handle = document.getElementById("slideHandle");
        var fill = document.getElementById("slideFill");
        var label = document.getElementById("slideLabel");
        if (!track || !handle || !fill) return;

        var done = false;
        var dragging = false;
        var startX = 0;
        var startOffset = 0;
        var THRESHOLD = 0.85;
        var PAD = 8; // track padding, matches the .slide__track padding

        function maxTravel() {
            return track.clientWidth - handle.offsetWidth - PAD * 2;
        }

        function currentOffset() {
            var m = /translateX\(([-\d.]+)px\)/.exec(handle.style.transform);
            return m ? parseFloat(m[1]) : 0;
        }

        function progress() {
            var max = maxTravel();
            return max ? currentOffset() / max : 0;
        }

        function setOffset(px) {
            var max = maxTravel();
            var v = clamp(px, 0, max);
            handle.style.transform = "translateX(" + v.toFixed(1) + "px)";
            fill.style.width = v + PAD + "px";
            var pct = Math.round((v / (max || 1)) * 100);
            track.setAttribute("aria-valuenow", String(pct));
            return max ? v / max : 0;
        }

        function reset() {
            handle.style.transition = "transform 420ms cubic-bezier(0.34,1.56,0.64,1)";
            fill.style.transition = "width 420ms cubic-bezier(0.34,1.56,0.64,1)";
            setOffset(0);
            window.setTimeout(function () {
                handle.style.transition = "";
                fill.style.transition = "";
            }, 440);
        }

        function complete() {
            if (done) return;
            done = true;

            var max = maxTravel();
            track.style.setProperty("--slide-travel", max + "px");
            handle.style.transition = "";
            setOffset(max);
            track.classList.add("is-done");
            track.setAttribute("aria-valuenow", "100");
            track.setAttribute("aria-valuetext", "Ready. Opening your email app.");
            if (label) label.textContent = "Opening mail…";

            window.setTimeout(function () {
                window.location.href = "mailto:wahyusou@gmail.com?subject=Hello%20Wahyu";
            }, 420);

            window.setTimeout(function () {
                if (label) label.textContent = "Slide to say hello";
                track.classList.remove("is-done");
                track.style.removeProperty("--slide-travel");
                track.setAttribute("aria-valuenow", "0");
                track.setAttribute(
                    "aria-valuetext",
                    "Slide the handle to the right to compose an email"
                );
                done = false;
                reset();
            }, 6000);
        }

        track.addEventListener("pointerdown", function (e) {
            if (done) return;
            if (e.pointerType === "mouse" && e.button !== 0) return;
            dragging = true;
            track.setPointerCapture(e.pointerId);
            startX = e.clientX;
            startOffset = currentOffset(); // resume from wherever it currently sits
        });

        track.addEventListener("pointermove", function (e) {
            if (!dragging || done) return;
            e.preventDefault();
            var p = setOffset(startOffset + (e.clientX - startX));
            if (label) label.style.opacity = p > 0.12 ? "0" : "1";
        });

        function end(e) {
            if (!dragging) return;
            dragging = false;
            if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
            if (label) label.style.opacity = "1";
            if (progress() >= THRESHOLD) complete();
            else reset();
        }

        track.addEventListener("pointerup", end);
        track.addEventListener("pointercancel", end);

        // keyboard: arrows nudge, End commits, Home rewinds
        track.addEventListener("keydown", function (e) {
            if (done) return;
            var STEP = 28;

            if (e.key === "ArrowRight") {
                e.preventDefault();
                setOffset(currentOffset() + STEP);
                if (progress() >= THRESHOLD) complete();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                setOffset(currentOffset() - STEP);
            } else if (e.key === "Home") {
                e.preventDefault();
                reset();
            } else if (e.key === "End" || e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                complete();
            }
        });
    });

    /* --------------------------------------------------------------------
       INLINE CONFIRM — copy to clipboard
       Ported from Bencho inline-confirm
       ------------------------------------------------------------------ */
    component("inline-confirm", function () {
        var targets = document.querySelectorAll("[data-copy-email]");
        if (!targets.length) return;

        function flash(el, ok) {
            var hint = el.querySelector("[data-copy-hint]");
            var label = el.querySelector("[data-copy-label]");
            if (!hint) return;

            el.classList.add("is-copied");
            hint.textContent = ok ? "Copied" : "Press ⌘C";
            if (label) {
                var original = label.textContent;
                label.textContent = ok ? "On your clipboard" : original;
            }

            window.setTimeout(function () {
                el.classList.remove("is-copied");
                hint.textContent = "Copy";
                if (label) {
                    var value = el.getAttribute("data-copy-email");
                    if (value) label.textContent = value;
                }
            }, 2000);
        }

        targets.forEach(function (el) {
            var value = el.getAttribute("data-copy-email");
            if (!value) return;

            el.addEventListener("click", function (e) {
                // let the link still do its job (open mailto), just copy too
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(value).then(
                        function () {
                            flash(el, true);
                        },
                        function () {
                            flash(el, false);
                        }
                    );
                } else {
                    // http fallback (GitHub Pages is https, but be safe)
                    var ta = document.createElement("textarea");
                    ta.value = value;
                    ta.setAttribute("readonly", "");
                    ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
                    document.body.appendChild(ta);
                    ta.select();
                    var ok = false;
                    try {
                        ok = document.execCommand("copy");
                    } catch (err) {}
                    document.body.removeChild(ta);
                    flash(el, ok);
                }
                e.preventDefault();
                // navigate explicitly since we prevented the default
                if (el.tagName === "A") {
                    if (el.getAttribute("href").startsWith("mailto:")) {
                        window.location.href = el.getAttribute("href");
                    } else {
                        window.open(el.getAttribute("href"), "_blank", "noopener");
                    }
                }
            });
        });
    });

    /* --------------------------------------------------------------------
       NAV — sticky state, hide on scroll down, active section
       ------------------------------------------------------------------ */
    component("nav", function () {
        var nav = document.getElementById("nav");
        if (!nav) return;

        var lastY = window.scrollY;
        var ticking = false;

        function onScroll() {
            var y = window.scrollY;
            nav.classList.toggle("is-stuck", y > 24);

            // never hide while a child has focus, otherwise keyboard users
            // are stranded on an off-screen element
            var focused = nav.contains(document.activeElement);

            if (!focused && y > 240 && y > lastY + 4) nav.classList.add("is-hidden");
            else if (y < lastY - 4 || y < 240) nav.classList.remove("is-hidden");

            lastY = y;
            ticking = false;
        }

        window.addEventListener(
            "scroll",
            function () {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(onScroll);
            },
            { passive: true }
        );
        // bring it back if focus lands inside while it is hidden
        nav.addEventListener("focusin", function () {
            nav.classList.remove("is-hidden");
        });
        onScroll();

        // active link based on which section is in view
        var links = document.querySelectorAll("[data-nav-link]");
        var sections = Array.prototype.map.call(links, function (a) {
            return document.querySelector(a.getAttribute("href"));
        });

        if ("IntersectionObserver" in window && sections.length) {
            var navIo = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (!entry.isIntersecting) return;
                        var idx = sections.indexOf(entry.target);
                        if (idx === -1) return;
                        links.forEach(function (a, i) {
                            a.classList.toggle("is-active", i === idx);
                        });
                    });
                },
                { rootMargin: "-45% 0px -50% 0px" }
            );
            sections.forEach(function (s) {
                if (s) navIo.observe(s);
            });
        }
    });

    /* --------------------------------------------------------------------
       STAT COUNTERS
       ------------------------------------------------------------------ */
    component("stat-counters", function () {
        var nums = document.querySelectorAll("[data-count]");
        if (!nums.length) return;

        function animate(el) {
            var target = parseFloat(el.getAttribute("data-count")) || 0;
            var suffix = el.getAttribute("data-suffix") || "";
            if (reduceMotion.matches) {
                el.textContent = target + suffix;
                return;
            }

            var start = performance.now();
            var DUR = 1100;

            function step(now) {
                var p = Math.min((now - start) / DUR, 1);
                var eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(eased * target) + suffix;
                if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }

        if (!("IntersectionObserver" in window)) {
            nums.forEach(animate);
            return;
        }

        var io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    animate(entry.target);
                    io.unobserve(entry.target);
                });
            },
            { threshold: 0.6 }
        );
        nums.forEach(function (el) {
            io.observe(el);
        });
    });

    /* --------------------------------------------------------------------
       VISIT COUNT — client-side only, no backend available on Pages
       Adapted from ObsidianUI visitor-count
       ------------------------------------------------------------------ */
    component("visit-count", function () {
        var el = document.getElementById("visitCount");
        var noun = document.getElementById("visitNoun");
        if (!el) return;

        var KEY = "portoh-visit-count";
        var count = 1;

        try {
            var prev = parseInt(localStorage.getItem(KEY) || "0", 10);
            count = (isNaN(prev) ? 0 : prev) + 1;
            localStorage.setItem(KEY, String(count));
        } catch (e) {
            el.textContent = "—";
            return;
        }

        el.textContent = String(count);
        if (noun) noun.textContent = count === 1 ? "visit" : "visits";
    });

    /* --------------------------------------------------------------------
       CASE STUDY SHEET
       Ported from ObsidianUI sheet
       ------------------------------------------------------------------ */
    component("case-study-sheet", function () {
        var CASE_STUDIES = {
            artha: {
                title: "artha",
                summary:
                    "Aplikasi Flutter yang dipakai untuk kebutuhan nyata dan berhasil menarik minat komunitas.",
                problem:
                    "Membangun app yang tetap stabil untuk penggunaan real-world sambil menjaga kecepatan iterasi fitur.",
                approach:
                    "Fokus pada pengalaman pengguna inti, optimasi flow penting, dan maintainability agar update bisa berjalan konsisten.",
                stack: ["Dart", "Flutter", "Mobile"],
                highlights: [
                    "Dipakai untuk use case nyata",
                    "Iterasi fitur berkelanjutan",
                    "Mendapat respons komunitas"
                ],
                repo: "https://github.com/wahyuatmaja3/artha"
            },
            "pendaftaran-siswa-smktag": {
                title: "pendaftaran-siswa-smktag",
                summary:
                    "Sistem pendaftaran siswa berbasis Flutter untuk mempermudah proses input dan tracking data enrollment.",
                problem:
                    "Alur pendaftaran manual rentan lambat dan sulit dipantau ketika jumlah pendaftar meningkat.",
                approach:
                    "Merancang form, validasi, dan alur data yang terstruktur supaya proses pendaftaran lebih cepat dan minim kesalahan.",
                stack: ["Dart", "Flutter", "Education"],
                highlights: [
                    "Form pendaftaran terstruktur",
                    "Alur data lebih konsisten",
                    "UI ramah operator sekolah"
                ],
                repo: "https://github.com/wahyuatmaja3/pendaftaran-siswa-smktag"
            },
            kyros: {
                title: "kyros",
                summary:
                    "Project web berbasis PHP yang dibangun untuk kebutuhan pembelajaran sekaligus melatih praktik arsitektur backend dasar.",
                problem:
                    "Membutuhkan project yang tidak hanya selesai secara fitur, tapi juga tetap rapih untuk proses belajar dan iterasi.",
                approach:
                    "Menerapkan pola struktur route-view-data sederhana yang mudah dipahami, lalu mengoptimalkan alur CRUD inti.",
                stack: ["PHP", "Web", "School Project"],
                highlights: [
                    "CRUD flow end-to-end",
                    "Struktur folder mudah dipahami",
                    "Baseline yang siap dikembangkan"
                ],
                repo: "https://github.com/wahyuatmaja3/kyros"
            },
            figureiie: {
                title: "figureiie",
                summary:
                    "Aplikasi Laravel Blade untuk menunjukkan kapabilitas full-stack web dari sisi rendering server hingga tampilan UI.",
                problem:
                    "Perlu menyeimbangkan kecepatan delivery dan maintainability pada aplikasi berbasis template server-rendered.",
                approach:
                    "Memanfaatkan Blade component untuk reuse tampilan, menjaga konsistensi antar halaman, dan mengurangi duplikasi.",
                stack: ["Blade", "Laravel", "PHP"],
                highlights: [
                    "Komponen Blade reusable",
                    "Konsistensi desain antarmuka",
                    "Alur pengembangan lebih cepat"
                ],
                repo: "https://github.com/wahyuatmaja3/figureiie"
            },
            "deiji-marketplace": {
                title: "deiji-marketplace",
                summary:
                    "Marketplace web app yang fokus ke experience belanja cepat dengan flow produk, katalog, dan checkout yang sederhana.",
                problem:
                    "Perlu membangun fondasi e-commerce yang bersih agar mudah dikembangkan, sambil menjaga UI tetap ringan untuk user baru.",
                approach:
                    "Menyusun struktur halaman dan komponen UI modular, memprioritaskan alur utama browsing produk hingga action pembelian.",
                stack: ["HTML", "CSS", "E-Commerce"],
                highlights: [
                    "Struktur halaman modular agar mudah scale",
                    "Visual hierarchy jelas untuk conversion flow",
                    "Interaksi ringan agar performa tetap baik"
                ],
                repo: "https://github.com/wahyuatmaja3/deiji-marketplace"
            },
            yakusoku: {
                title: "yakusoku",
                summary:
                    "Eksperimen JavaScript untuk mengeksplor pola interaksi modern dan pengalaman pengguna yang lebih hidup.",
                problem:
                    "Butuh playground untuk mencoba pattern interaksi tanpa overhead framework yang berat.",
                approach:
                    "Membangun interaksi langsung dengan vanilla JavaScript dan fokus pada transisi yang responsif.",
                stack: ["JavaScript", "Web"],
                highlights: ["Interaksi front-end responsif", "Animasi ringan dan halus", "Eksperimen pattern UI modern"],
                repo: "https://github.com/wahyuatmaja3/yakusoku"
            }
        };

        var sheet = document.getElementById("sheet");
        var panel = sheet && sheet.querySelector(".sheet__panel");
        var closeBtn = document.getElementById("sheetClose");
        if (!sheet || !panel) return;

        var fields = {
            title: document.getElementById("sheetTitle"),
            summary: document.getElementById("sheetSummary"),
            problem: document.getElementById("sheetProblem"),
            approach: document.getElementById("sheetSolution"),
            stack: document.getElementById("sheetStack"),
            highlights: document.getElementById("sheetHighlights"),
            repo: document.getElementById("sheetRepo"),
            github: document.getElementById("sheetGitHub")
        };

        var lastTrigger = null;

        function fillList(el, items) {
            el.textContent = "";
            items.forEach(function (item) {
                var li = document.createElement("li");
                li.textContent = item;
                el.appendChild(li);
            });
        }

        function open(id, trigger) {
            var data = CASE_STUDIES[id];
            if (!data) return;

            lastTrigger = trigger || null;
            fields.title.textContent = data.title;
            fields.summary.textContent = data.summary;
            fields.problem.textContent = data.problem;
            fields.approach.textContent = data.approach;
            fillList(fields.stack, data.stack);
            fillList(fields.highlights, data.highlights);
            fields.repo.href = data.repo;
            fields.github.href = data.repo;

            sheet.classList.add("is-open");
            sheet.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
            panel.scrollTop = 0;
            if (closeBtn) closeBtn.focus();
        }

        function close() {
            if (!sheet.classList.contains("is-open")) return;
            sheet.classList.remove("is-open");
            sheet.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
            if (lastTrigger) lastTrigger.focus();
            lastTrigger = null;
        }

        document.addEventListener("click", function (e) {
            var trigger = e.target.closest("[data-case-study]");
            if (!trigger) return;
            e.preventDefault();
            open(trigger.getAttribute("data-case-study"), trigger);
        });

        if (closeBtn) closeBtn.addEventListener("click", close);
        sheet.addEventListener("click", function (e) {
            if (e.target.hasAttribute("data-sheet-close")) close();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && sheet.classList.contains("is-open")) close();
        });

        // keep focus inside the sheet while it is open
        sheet.addEventListener("keydown", function (e) {
            if (e.key !== "Tab" || !sheet.classList.contains("is-open")) return;
            var focusables = panel.querySelectorAll(
                'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            if (!focusables.length) return;
            var first = focusables[0];
            var last = focusables[focusables.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });
    });

    /* --------------------------------------------------------------------
       COMMAND BAR
       Ported from Bencho command-bar
       ------------------------------------------------------------------ */
    component("command-bar", function () {
        var cmd = document.getElementById("cmd");
        var input = document.getElementById("cmdInput");
        var list = document.getElementById("cmdList");
        var trigger = document.getElementById("cmdTrigger");
        var kbd = document.getElementById("cmdKbd");
        if (!cmd || !input || !list) return;

        var isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
        if (kbd) kbd.textContent = isMac ? "⌘K" : "Ctrl K";

        var COMMANDS = [
            { group: "Go to", icon: "01", title: "Home", hint: "Top of page", run: function () { go("#hero"); } },
            { group: "Go to", icon: "02", title: "About", hint: "Who I am", run: function () { go("#about"); } },
            { group: "Go to", icon: "03", title: "Skills", hint: "Tech stack", run: function () { go("#skills"); } },
            { group: "Go to", icon: "04", title: "Work", hint: "Selected projects", run: function () { go("#projects"); } },
            { group: "Go to", icon: "05", title: "Process", hint: "How I work", run: function () { go("#process"); } },
            { group: "Go to", icon: "06", title: "Contact", hint: "Get in touch", run: function () { go("#contact"); } },
            {
                group: "Actions",
                icon: "✉",
                title: "Copy email address",
                hint: "wahyusou@gmail.com",
                run: function () {
                    if (navigator.clipboard) navigator.clipboard.writeText("wahyusou@gmail.com");
                }
            },
            {
                group: "Actions",
                icon: "◐",
                title: "Toggle theme",
                hint: "Obsidian ⇄ Prism",
                run: function () {
                    applyTheme(getTheme() === "obsidian" ? "prism" : "obsidian");
                }
            },
            {
                group: "Actions",
                icon: "↗",
                title: "Email me",
                hint: "Open your mail app",
                run: function () {
                    window.location.href = "mailto:wahyusou@gmail.com";
                }
            },
            {
                group: "Open",
                icon: "GH",
                title: "GitHub profile",
                hint: "wahyuatmaja3",
                run: function () {
                    window.open("https://github.com/wahyuatmaja3", "_blank", "noopener");
                }
            },
            {
                group: "Open",
                icon: "in",
                title: "LinkedIn profile",
                hint: "Wahyu Tri Atmaja",
                run: function () {
                    window.open(
                        "https://id.linkedin.com/in/wahyu-tri-atmaja-642207376",
                        "_blank",
                        "noopener"
                    );
                }
            },
            {
                group: "Open",
                icon: "19",
                title: "All repositories",
                hint: "19 public repos",
                run: function () {
                    window.open(
                        "https://github.com/wahyuatmaja3?tab=repositories",
                        "_blank",
                        "noopener"
                    );
                }
            }
        ];

        var results = [];
        var active = 0;
        var lastTrigger = null;

        function go(hash) {
            var el = document.querySelector(hash);
            if (el) el.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" });
        }

        /** Subsequence match with the matched characters collected for highlighting. */
        function match(item, query) {
            if (!query) return { score: 0, positions: [] };
            var hay = item.title.toLowerCase();
            var positions = [];
            var cursor = 0;
            var score = 0;

            for (var i = 0; i < query.length; i++) {
                var q = query[i];
                if (q === " ") continue;
                var at = hay.indexOf(q, cursor);
                if (at === -1) return null;
                positions.push(at);
                // reward matches that continue from the previous one
                if (at === cursor && cursor > 0) score += 3;
                score += at === 0 ? 5 : 1;
                cursor = at + 1;
            }
            score -= item.title.length * 0.05;
            return { score: score, positions: positions };
        }

        function highlight(text, positions) {
            if (!positions.length) return text;
            var out = "";
            positions.forEach(function (p, i) {
                if (i === 0) out += text.slice(0, p);
                out += "<mark>" + text.charAt(p) + "</mark>";
            });
            var last = positions[positions.length - 1];
            out += text.slice(last + 1);
            return out;
        }

        function render() {
            var query = input.value.trim().toLowerCase();
            list.textContent = "";

            results = [];
            COMMANDS.forEach(function (item) {
                var m = match(item, query);
                if (m) results.push({ item: item, positions: m.positions, score: m.score });
            });

            results.sort(function (a, b) {
                return b.score - a.score;
            });

            if (!results.length) {
                var empty = document.createElement("li");
                empty.className = "cmd__empty";
                empty.textContent = "No matches for “" + input.value.trim() + "”";
                list.appendChild(empty);
                return;
            }

            var currentGroup = null;
            results.forEach(function (r, i) {
                if (r.item.group !== currentGroup) {
                    currentGroup = r.item.group;
                    var label = document.createElement("li");
                    label.className = "cmd__group-label";
                    label.setAttribute("role", "presentation");
                    label.textContent = currentGroup;
                    list.appendChild(label);
                }

                var li = document.createElement("li");
                li.className = "cmd__item cursor-target";
                li.setAttribute("role", "option");
                li.setAttribute("aria-selected", String(i === 0));
                li.id = "cmd-item-" + i;
                li.dataset.index = String(i);

                var icon = document.createElement("span");
                icon.className = "cmd__item-icon";
                icon.setAttribute("aria-hidden", "true");
                icon.textContent = r.item.icon;

                var text = document.createElement("span");
                text.className = "cmd__item-text";
                var title = document.createElement("span");
                title.className = "cmd__item-title";
                title.innerHTML = highlight(r.item.title, r.positions);
                text.appendChild(title);

                var hint = document.createElement("span");
                hint.className = "cmd__item-hint";
                hint.textContent = r.item.hint;

                li.appendChild(icon);
                li.appendChild(text);
                li.appendChild(hint);
                list.appendChild(li);
            });

            active = 0;
            input.setAttribute("aria-activedescendant", "cmd-item-0");
        }

        function setActive(i) {
            var items = list.querySelectorAll(".cmd__item");
            if (!items.length) return;
            active = (i + items.length) % items.length;
            items.forEach(function (el, idx) {
                var on = idx === active;
                el.setAttribute("aria-selected", String(on));
                if (on) {
                    el.scrollIntoView({ block: "nearest" });
                    input.setAttribute("aria-activedescendant", el.id);
                }
            });
        }

        function openCmd(triggerEl) {
            lastTrigger = triggerEl || null;
            cmd.classList.add("is-open");
            cmd.setAttribute("aria-hidden", "false");
            input.value = "";
            render();
            window.setTimeout(function () {
                input.focus();
            }, 60);
        }

        function closeCmd() {
            if (!cmd.classList.contains("is-open")) return;
            cmd.classList.remove("is-open");
            cmd.setAttribute("aria-hidden", "true");
            input.blur();
            if (lastTrigger) lastTrigger.focus();
            lastTrigger = null;
        }

        if (trigger) trigger.addEventListener("click", function () { openCmd(trigger); });
        cmd.addEventListener("click", function (e) {
            if (e.target.hasAttribute("data-cmd-close")) closeCmd();
        });

        input.addEventListener("input", render);

        input.addEventListener("keydown", function (e) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive(active + 1);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive(active - 1);
            } else if (e.key === "Enter") {
                e.preventDefault();
                var r = results[active];
                if (r) {
                    closeCmd();
                    r.item.run();
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                closeCmd();
            } else if (e.key === "Home") {
                e.preventDefault();
                setActive(0);
            } else if (e.key === "End") {
                e.preventDefault();
                setActive(results.length - 1);
            }
        });

        // click a result
        list.addEventListener("click", function (e) {
            var li = e.target.closest(".cmd__item");
            if (!li) return;
            var r = results[parseInt(li.dataset.index, 10)];
            if (!r) return;
            closeCmd();
            r.item.run();
        });

        // pointer hover moves the selection
        list.addEventListener("pointermove", function (e) {
            var li = e.target.closest(".cmd__item");
            if (li) setActive(parseInt(li.dataset.index, 10));
        });

        document.addEventListener("keydown", function (e) {
            var combo = isMac ? e.metaKey && e.key === "k" : e.ctrlKey && e.key === "k";
            if (combo) {
                e.preventDefault();
                if (cmd.classList.contains("is-open")) closeCmd();
                else openCmd(trigger);
                return;
            }
            if (e.key === "Escape" && cmd.classList.contains("is-open")) closeCmd();
        });
    });

    /* --------------------------------------------------------------------
       SMOOTH ANCHORS — offset-aware, works without native smooth scroll
       ------------------------------------------------------------------ */
    component("smooth-anchors", function () {
        document.addEventListener("click", function (e) {
            var link = e.target.closest('a[href^="#"]');
            if (!link) return;

            var hash = link.getAttribute("href");
            if (!hash || hash === "#") return;

            var target = document.querySelector(hash);
            if (!target) return;

            e.preventDefault();
            target.scrollIntoView({
                behavior: reduceMotion.matches ? "auto" : "smooth",
                block: "start"
            });

            // move focus for keyboard and screen reader users
            target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });

if (history.replaceState) history.replaceState(null, "", hash);
        });
    });

    /* --------------------------------------------------------------------
       GRADUAL BLUR — reactbits GradualBlur, ported to vanilla: layered
       backdrop-filter bands that make content dissolve toward the bottom of
       the viewport. Static band (no animation) so reduced motion is a no-op.
       ------------------------------------------------------------------ */
    component("gradual-blur", function () {
        var band = document.createElement("div");
        band.className = "gradual-blur gradual-blur--page";
        band.setAttribute("aria-hidden", "true");
        document.body.appendChild(band);

        // reactbits config: divCount 5, height 7rem (css), strength 2,
        // curve bezier, exponential ramp, opacity 1
        var count = 5;
        var strength = 2;
        var opacity = 1;
        for (var i = 1; i <= count; i++) {
            var p = i / count;
            p = p * p * (3 - 2 * p); // bezier curve
            var blurR = 0.0625 * (p * count + 1) * strength;
            var inc = 100 / count;
            var p1 = Math.round((inc * i - inc) * 10) / 10;
            var p2 = Math.round(inc * i * 10) / 10;
            var p3 = Math.round((inc * i + inc) * 10) / 10;
            var p4 = Math.round((inc * i + inc * 2) * 10) / 10;
            var g = "transparent " + p1 + "%, #000 " + p2 + "%";
            if (p3 <= 100) g += ", #000 " + p3 + "%";
            if (p4 <= 100) g += ", transparent " + p4 + "%";
            var layer = document.createElement("div");
            layer.className = "gradual-blur__layer";
            layer.style.backdropFilter = "blur(" + blurR.toFixed(3) + "rem)";
            layer.style.webkitBackdropFilter = "blur(" + blurR.toFixed(3) + "rem)";
            layer.style.maskImage = "linear-gradient(to bottom, " + g + ")";
            layer.style.webkitMaskImage = "linear-gradient(to bottom, " + g + ")";
            layer.style.opacity = String(opacity);
            band.appendChild(layer);
        }

        window.setTimeout(function () {
            band.classList.add("is-on");
        }, 60);
    });

/* --------------------------------------------------------------------
       TARGET CURSOR — reactbits TargetCursor, ported to vanilla
       Four L-shaped corner brackets that spin slowly while idle. Hovering a
       .cursor-target pauses the spin, resets it square, and sends each
       bracket out to that element's corners; leaving pulls them back into a
       tight cluster and the spin resumes.

       The parallax is not extra maths: the wrapper itself trails the pointer
       by ~0.08s, and the brackets are positioned relative to the wrapper, so
       they lean as the wrapper catches up. That is the original trick and it
       is why the effect reads as weight rather than as a lag.

       Brackets are fixed 18px (a 12px box plus a 3px border) placed on the
       target's corners — they never scale with the element, so a full-width
       button gets the same four small marks as a small dot.

       Only mounted for a fine pointer: touch keeps the native behaviour, and
       the native cursor is hidden only once this component is confirmed up.
       ------------------------------------------------------------------ */
    component("target-cursor", function () {
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

        var SELECTOR = root.getAttribute("data-cursor-targets") || ".cursor-target";
        var SPIN_DURATION = 2; // seconds per idle revolution
        var HOVER_DURATION = 0.2; // seconds for the brackets to reach the target
        var PARALLAX_ON = true;
        var FOLLOW = 0.08; // s, the wrapper's own lag behind the pointer
        var BORDER = 3;
        var CORNER = 18; // 12px box + 3px border, matching the original
        var GAP = BORDER; // brackets stand off the target by their own border

        var cursor = document.createElement("div");
        cursor.className = "target-cursor";
        cursor.setAttribute("aria-hidden", "true");

        // the scale on click lives on an inner node so it can be a plain CSS
        // transition while the wrapper's transform is rewritten every frame
        var body = document.createElement("div");
        body.className = "target-cursor__body";

        var dot = document.createElement("div");
        dot.className = "target-cursor__dot";

        var corners = ["tl", "tr", "br", "bl"].map(function (position) {
            var corner = document.createElement("div");
            corner.className =
                "target-cursor__corner target-cursor__corner--" + position;
            body.appendChild(corner);
            return corner;
        });

        body.appendChild(dot);
        cursor.appendChild(body);
        document.body.appendChild(cursor);

        // where each bracket sits at rest: a small cluster off-centre from the
        // pointer, exactly as the original lays it out
        var IDLE = [
            { x: -CORNER * 1, y: -CORNER * 1 },
            { x: CORNER / 3, y: -CORNER * 1 },
            { x: CORNER / 3, y: CORNER / 3 },
            { x: -CORNER * 1, y: CORNER / 3 }
        ];

        var pos = IDLE.map(function (p) {
            return { x: p.x, y: p.y };
        });

        var raf = 0;
        var last = 0;
        var rotation = 0;
        var spinHold = 0; // timestamp before which the spin stays parked
        var seen = false;
        var strength = 0;
        var target = null;
        var pointerX = 0;
        var pointerY = 0;
        var curX = 0;
        var curY = 0;
        var placed = false;

        function approach(current, goal, dt, seconds) {
            var k = 1 - Math.exp(-dt / Math.max(0.0005, seconds));
            return current + (goal - current) * k;
        }

        /* The four bracket origins for the current target, in viewport space.
           tl/bl hang off the element's left edge, tr/br off its right, and
           every bracket stands off by GAP so it frames rather than overlaps. */
        function bracketsFor(rect) {
            var right = rect.right + GAP - CORNER;
            var bottom = rect.bottom + GAP - CORNER;
            var top = rect.top - GAP;
            var left = rect.left - GAP;
            return [
                { x: left, y: top },
                { x: right, y: top },
                { x: right, y: bottom },
                { x: left, y: bottom }
            ];
        }

        function release() {
            target = null;
            strength = 0;
            spinHold = performance.now() + 50;
        }

        /* Resolve the target from the pointer position instead of trusting
           enter/leave events. Magnetic buttons translate themselves toward the
           pointer, sheets slide, the carousel advances — every one of those
           moves an element out from under a cursor that never moved, and an
           event-driven target goes stale and quietly drops the lock. One
           hit test per frame is cheaper than getting that wrong. */
        function resolve() {
            if (!seen) return;
            var hit = document.elementFromPoint(pointerX, pointerY);
            var found = hit instanceof Element ? hit.closest(SELECTOR) : null;
            if (found === target) return;
            if (found) {
                target = found;
            } else {
                release();
            }
        }

        function frame(now) {
            raf = requestAnimationFrame(frame);
            var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
            last = now;

            if (!seen) {
                cursor.style.opacity = "0";
                return;
            }
            cursor.style.opacity = "";

            resolve();

            // the wrapper trails the pointer; the brackets inherit that lag,
            // which is the whole of the parallax effect
            if (!placed) {
                curX = pointerX;
                curY = pointerY;
                placed = true;
            }
            curX = approach(curX, pointerX, dt, FOLLOW);
            curY = approach(curY, pointerY, dt, FOLLOW);

            var goals = IDLE;
            if (target) {
                var rect = target.getBoundingClientRect();
                if (rect.width && rect.height) {
                    strength = Math.min(1, strength + dt / HOVER_DURATION);
                    goals = bracketsFor(rect);
                    // square up the moment it locks, then hold the spin while
                    // it is parked so the frame stays readable
                    rotation = 0;
                } else {
                    release();
                }
            }

            if (!target && !reduceMotion.matches && now >= spinHold) {
                rotation += (360 / SPIN_DURATION) * dt;
            }

            // Brackets reach out fast while the lock is forming, then drop to a
            // gentler follow once parked — that gentler follow is what reads as
            // parallax. Without it they would be nailed to the corners.
            // These are exponential time constants, not tween durations: a 0.2s
            // tween is done at 0.2s, where tau 0.2 would still be 63% out.
            var settle = !target
                ? 0.1
                : strength >= 0.99
                  ? PARALLAX_ON
                      ? 0.12
                      : 0.001
                  : 0.05;

            cursor.style.transform =
                "translate3d(" +
                curX.toFixed(2) +
                "px," +
                curY.toFixed(2) +
                "px,0) rotate(" +
                rotation.toFixed(2) +
                "deg)";

            for (var i = 0; i < 4; i++) {
                // goals are absolute; the brackets are positioned relative to
                // the wrapper, so subtracting the wrapper is what lets a single
                // transform carry both the lock and the lean
                var gx = target ? goals[i].x - curX : IDLE[i].x;
                var gy = target ? goals[i].y - curY : IDLE[i].y;
                pos[i].x = approach(pos[i].x, gx, dt, settle);
                pos[i].y = approach(pos[i].y, gy, dt, settle);
                corners[i].style.transform =
                    "translate3d(" +
                    pos[i].x.toFixed(2) +
                    "px," +
                    pos[i].y.toFixed(2) +
                    "px,0)";
            }
        }

        function onMove(e) {
            if (e.pointerType !== "mouse") return;
            pointerX = e.clientX;
            pointerY = e.clientY;
            if (!seen) {
                seen = true;
                cursor.classList.add("is-on");
            }
        }

        function onExit() {
            seen = false;
            placed = false;
            release();
            cursor.classList.remove("is-on", "is-down");
        }

        document.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("pointerdown", function (e) {
            if (e.pointerType !== "mouse") return;
            cursor.classList.add("is-down");
        });
        document.addEventListener("pointerup", function () {
            cursor.classList.remove("is-down");
        });
        document.addEventListener("pointerout", function (e) {
            // relatedTarget is only null when the pointer leaves the window
            if (e.relatedTarget) return;
            onExit();
        });
        window.addEventListener("blur", onExit);

        // hide the native cursor only once this component is confirmed alive
        document.body.classList.add("has-target-cursor");
        last = performance.now();
        raf = requestAnimationFrame(frame);
    });
}());
