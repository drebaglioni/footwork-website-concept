(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const nav = document.getElementById("nav");
  const hero = document.querySelector(".hero");
  const darkZones = [...document.querySelectorAll(".hero, .dark, .plate")];

  // ---------- Nav state ----------
  // The rail appears once the office has been scrolled through, then tracks the section in view.
  const sections = [...document.querySelectorAll("[data-section]")];
  const railLinks = [...document.querySelectorAll("[data-rail]")];
  function navState() {
    const solid = hero ? hero.getBoundingClientRect().bottom <= 70 : true;
    nav.classList.toggle("solid", solid);
    nav.classList.toggle("dark", darkZones.some(z => { const r = z.getBoundingClientRect(); return r.top <= 31 && r.bottom > 31; }));
    if (!sections.length) return;
    const mid = innerHeight * .4;
    let current = null;
    sections.forEach(sec => { const r = sec.getBoundingClientRect(); if (r.top <= mid) current = sec.dataset.section; });
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) current = sections[sections.length - 1].dataset.section;
    railLinks.forEach(a => a.classList.toggle("on", a.dataset.rail === current));
    nav.classList.toggle("railed", !!current);
  }
  addEventListener("scroll", navState, { passive: true });
  addEventListener("resize", navState);
  navState();
  requestAnimationFrame(() => document.documentElement.classList.add("ready"));

  // ---------- Glide to in-page anchors ----------
  let glideId = 0;
  function glide(to, ms) {
    const from = scrollY, id = ++glideId, t0 = performance.now();
    ms = ms || Math.min(1800, Math.max(900, Math.abs(to - from) * .35));
    if (reduce) return scrollTo(0, to);
    (function step(now) {
      if (id !== glideId) return;
      const k = io(clamp((now - t0) / ms));
      scrollTo(0, from + (to - from) * k);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  window.footworkGlide = glide;
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const t = document.querySelector(a.getAttribute("href"));
    if (!t) return;
    e.preventDefault();
    glide(t === hero ? 0 : t.getBoundingClientRect().top + scrollY);
  }));
  addEventListener("wheel", () => glideId++, { passive: true });

  // ---------- Jobs: fold long groups ----------
  document.querySelectorAll("[data-fold]").forEach(g => {
    const rows = [...g.querySelectorAll("[data-job]")], btn = g.querySelector("[data-fold-toggle]");
    if (rows.length <= 6) { btn.remove(); return; }
    const fold = () => rows.forEach((r, i) => r.classList.toggle("folded", i >= 6 && !g.classList.contains("open")));
    btn.addEventListener("click", () => { g.classList.toggle("open"); btn.textContent = g.classList.contains("open") ? "Fewer" : "All " + rows.length; fold(); });
    g.unfold = () => { g.classList.add("open"); btn.textContent = "Fewer"; fold(); };
    fold();
  });

  // ---------- Reveals ----------
  const ob = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); ob.unobserve(en.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".r").forEach(el => ob.observe(el));

  // ---------- Mobile menu ----------
  const burger = document.getElementById("burger");
  if (burger) burger.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", String(open));
  });

  // ---------- Jobs filters ----------
  const jobs = document.getElementById("jobs");
  if (jobs) {
    const rows = [...jobs.querySelectorAll("[data-job]")];
    const selects = [...document.querySelectorAll("[data-filter]")];
    const search = document.getElementById("job-search");
    const count = document.getElementById("job-count");
    const groups = [...jobs.querySelectorAll("[data-company-group]")];
    function apply() {
      const want = Object.fromEntries(selects.map(s => [s.dataset.filter, s.value]));
      const q = (search ? search.value : "").trim().toLowerCase();
      let n = 0;
      const active = Object.values(want).some(Boolean) || q;
      rows.forEach(r => {
        const ok = Object.entries(want).every(([k, v]) => !v || r.dataset[k] === v) && (!q || r.dataset.text.includes(q));
        r.hidden = !ok; if (ok) n++;
      });
      if (active) groups.forEach(g => g.unfold && g.unfold());
      groups.forEach(g => { g.hidden = ![...g.querySelectorAll("[data-job]")].some(r => !r.hidden); });
      if (count) count.textContent = n === rows.length ? `${n} open roles` : `${n} of ${rows.length} roles`;
      const p = new URLSearchParams(); Object.entries(want).forEach(([k, v]) => v && p.set(k, v)); if (q) p.set("q", q);
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash);
    }
    const p = new URLSearchParams(location.search);
    selects.forEach(s => { if (p.get(s.dataset.filter)) s.value = p.get(s.dataset.filter); s.addEventListener("change", apply); });
    if (search) { if (p.get("q")) search.value = p.get("q"); search.addEventListener("input", apply); }
    apply();
  }

  // ---------- Portfolio stage filter ----------
  document.querySelectorAll("[data-stage-filter]").forEach(btn => btn.addEventListener("click", () => {
    const v = btn.dataset.stageFilter;
    document.querySelectorAll("[data-stage-filter]").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
    document.querySelectorAll("[data-stage]").forEach(el => { el.hidden = !!v && el.dataset.stage !== v; });
  }));

  // ---------- Pitch form (draft: nothing is sent yet) ----------
  const pitch = document.getElementById("pitch-form");
  if (pitch) pitch.addEventListener("submit", e => {
    e.preventDefault();
    pitch.hidden = true;
    document.getElementById("pitch-done").hidden = false;
  });

  // ---------- "In motion": the easter egg ----------
  // Press M twice, or click the mark in the footer, to let the athletes onto the page.
  let taps = 0, tapTimer = 0;
  addEventListener("keydown", e => {
    if (e.key.toLowerCase() !== "m" || e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(document.activeElement.tagName)) return;
    taps++; clearTimeout(tapTimer); tapTimer = setTimeout(() => taps = 0, 600);
    if (taps >= 2) { taps = 0; toggleMotion(); }
  });
  const egg = document.getElementById("egg");
  if (egg) egg.addEventListener("click", e => { e.preventDefault(); toggleMotion(); });
  let motionLoaded = false;
  function toggleMotion() {
    if (document.body.classList.contains("motion")) { document.body.classList.remove("motion"); return; }
    if (!motionLoaded) {
      motionLoaded = true;
      const s = document.createElement("script"); s.src = window.FW_BASE + "motion.js"; s.onload = () => document.body.classList.add("motion"); document.body.appendChild(s);
    } else document.body.classList.add("motion");
  }
})();
