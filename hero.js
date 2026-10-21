(() => {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  // ---------- Hero choreography ----------
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = document.getElementById("scene");
  const veil = document.getElementById("veil");
  const mark = document.getElementById("mark");
  const glow = document.getElementById("markGlow");
  const fadeStop = document.getElementById("fadeStop");
  const intro = document.getElementById("intro");
  const shade = document.getElementById("shade");
  const vignette = document.getElementById("vignette");
  const define = [...document.getElementById("define").children];
  const plateImg = document.getElementById("plateImg");

  const rail = document.getElementById("rail");
  // Distance from the rail's resting place in the bar to the intro row at the bottom of the screen.
  const brand = document.querySelector(".nav .brand");
  function railDrop() { return innerHeight - 118 - rail.getBoundingClientRect().height - (rail.offsetTop + rail.offsetParent.offsetTop); }
  const IW = 9479, IH = 5352;
  const MX = 4622, MY = 3218, MS = 1654; // wall mark centre and size in photo pixels
  const PILLAR = 6195; // right edge of the concrete pillar beside the mark
  const len = mark.getTotalLength();
  [mark, glow].forEach(p => { p.style.strokeDasharray = len; p.style.strokeDashoffset = len; });

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const span = (v, a, b) => clamp((v - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const out = t => 1 - Math.pow(1 - t, 3);

  function boxes() {
    const w = innerWidth, h = innerHeight, a = w / h;
    let W0, H0;
    if (a > IW / IH) { W0 = IW; H0 = IW / a; } else { H0 = IH; W0 = IH * a; }
    const start = { x: (IW - W0) / 2, y: (IH - H0) / 2, w: W0, h: H0 };
    let end;
    if (w > 900) {
      const H1 = MS / .56, W1 = H1 * a;
      end = { x: MX - .3 * W1, y: MY - .5 * H1, w: W1, h: H1 };
      // set the definition on the bare wall, just right of the pillar
      const pillar = (PILLAR - end.x) / end.w * w;
      document.documentElement.style.setProperty("--defL", Math.min(Math.max(pillar + w * .035, w * .5), w - 380) + "px");
    } else {
      const W1 = MS / .72, H1 = W1 / a;
      end = { x: MX - .5 * W1, y: MY - .3 * H1, w: W1, h: H1 };
    }
    return { start, end, mobile: w <= 900 };
  }
  let B = boxes();
  addEventListener("resize", () => { B = boxes(); target = progress(); });

  function progress() {
    const r = hero.getBoundingClientRect();
    return clamp(-r.top / (hero.offsetHeight - innerHeight));
  }

  let target = progress(), p = reduce ? target : 0, t0 = performance.now();

  function frame(now) {
    target = progress();
    p = reduce ? target : p + (target - p) * .085;
    const lit = reduce ? 1 : out(clamp((now - t0) / 2200)); // lights coming on

    // camera: push into the wall mark
    const z = io(span(p, .03, .7));
    const s = B.start, e = B.end;
    const settle = 1 + .05 * (1 - lit); // slight drift on load
    const w = lerp(s.w, e.w, z) / settle, h = lerp(s.h, e.h, z) / settle;
    const cx = lerp(s.x + s.w / 2, e.x + e.w / 2, z), cy = lerp(s.y + s.h / 2, e.y + e.h / 2, z);
    scene.setAttribute("viewBox", `${cx - w / 2} ${cy - h / 2} ${w} ${h}`);

    // light: photo dims as the mark lifts off the wall
    const dim = span(p, .08, .75);
    veil.setAttribute("opacity", (lerp(.9, 0, lit) + .7 * dim).toFixed(3));
    fadeStop.setAttribute("offset", (1 - .22 * dim).toFixed(3));

    // the mark draws itself in one continuous line
    const draw = out(span(p, .12, .62));
    mark.style.strokeDashoffset = len * (1 - draw);
    glow.style.strokeDashoffset = len * (1 - draw);
    glow.setAttribute("opacity", (.22 * draw).toFixed(3));

    intro.style.opacity = (lit * (1 - span(p, .02, .14))).toFixed(3);
    if (rail && innerWidth > 900) {
      const k = out(span(p, .02, .3));
      rail.style.transform = `translateY(${(railDrop() * (1 - k)).toFixed(1)}px)`;
      rail.style.opacity = lit.toFixed(3);
      brand.style.opacity = k.toFixed(3);
    } else if (rail) { rail.style.transform = ""; rail.style.opacity = ""; brand.style.opacity = ""; }
    intro.style.transform = `translateY(${-24 * span(p, .02, .14)}px)`;
    shade.style.opacity = (1 - dim).toFixed(3);
    vignette.style.opacity = dim.toFixed(3);

    define.forEach((el, i) => {
      const k = out(span(p, .6 + i * .06, .82 + i * .06));
      el.style.opacity = k.toFixed(3);
      el.style.transform = `translateY(${(1 - k) * 32}px)`;
    });


    // office plate parallax
    const pr = plateImg ? plateImg.parentElement.getBoundingClientRect() : { bottom: 0, top: 0 };
    if (plateImg && pr.bottom > 0 && pr.top < innerHeight) {
      const k = (pr.top + pr.height / 2 - innerHeight / 2) / innerHeight;
      plateImg.style.transform = `translateY(${k * -8}%) scale(1.02)`;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(now => { t0 = now; document.documentElement.classList.add("ready"); frame(now); });

})();
