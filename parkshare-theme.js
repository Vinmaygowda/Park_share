/* ParkShare theme script — add before </body> with:  <script src="parkshare-theme.js" defer></script> */
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. Give every section its own slot-state colour */
  const accents = ["sky", "go", "hold", "sign", "stop", "go", "hold", "sky"];
  $$("section[id]").forEach((s, i) => (s.dataset.accent = accents[i % accents.length]));

  /* 2. Turn every block that holds an <h3> into a styled card */
  const skip = new Set(["SECTION", "MAIN", "BODY", "HEADER", "FOOTER", "ARTICLE"]);
  $$("h3").forEach((h) => {
    const box = h.parentElement;
    if (!box || skip.has(box.tagName) || box.querySelectorAll("h3").length > 1) return;
    box.classList.add("ps-card");
    const state = h.textContent.trim();                      // Available / Reserved / Occupied
    if (["Available", "Reserved", "Occupied"].includes(state)) box.classList.add("ps-state", "ps-state-" + state);
  });

  /* 3. Header shadow + scroll progress bar */
  const header = document.querySelector("header");
  const bar = Object.assign(document.createElement("div"), { className: "ps-progress" });
  document.body.appendChild(bar);
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
    header && header.classList.toggle("is-scrolled", scrollY > 8);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* 4. Highlight the nav link of the section on screen */
  const links = $$('nav a[href^="#"]');
  const spy = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
      document.documentElement.style.setProperty("--accent-now", getComputedStyle(e.target).getPropertyValue("--accent"));
    }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("section[id]").forEach((s) => spy.observe(s));

  /* 5. Results: stat cards + count-up (85%, 1.2 min, 84/100, 0%) */
  const results = document.getElementById("results");
  if (results) {
    const targets = [85, 1.2, 84, 0];
    const leaves = $$("*", results).filter((el) => !el.children.length && /^\s*0\s*(%|min|\/100)?\s*$/.test(el.textContent));
    const nums = leaves.slice(0, 4).map((el, i) => {
      el.classList.add("ps-num");
      const suffix = el.textContent.trim().replace(/^0/, "");
      const card = el.parentElement;
      card.classList.add("ps-stat");
      card.style.setProperty("--accent", [ "var(--go)", "var(--sky)", "var(--hold)", "var(--stop)" ][i]);
      return { el, suffix, target: targets[i] };
    });
    const run = ({ el, suffix, target }) => {
      const dec = target % 1 ? 1 : 0, t0 = performance.now(), dur = 1400;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      reduceMotion ? (el.textContent = target.toFixed(dec) + suffix) : requestAnimationFrame(tick);
    };
    const once = new IntersectionObserver((e, o) => {
      if (e.some((x) => x.isIntersecting)) { nums.forEach(run); o.disconnect(); }
    }, { threshold: 0.35 });
    once.observe(results);
  }

  /* 6. Hero demo: tap "Reserve in one tap" to walk the slot state machine */
  const hit = $$("em, i, p, span, div, a, button").find(
    (el) => !el.children.length && /reserve in one tap/i.test(el.textContent)
  );
  if (hit) {
    const states = ["Available", "Reserved", "Occupied"];
    let n = 0;
    const token = () => "PS-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    hit.classList.add("ps-reserve");
    hit.dataset.state = "Available";
    hit.setAttribute("role", "button");
    hit.tabIndex = 0;
    const step = () => {
      n = (n + 1) % 3;
      hit.dataset.state = states[n];
      hit.textContent =
        n === 1 ? "Reserved · pass " + token() :
        n === 2 ? "Occupied · vehicle parked" : "Reserve in one tap";
    };
    hit.addEventListener("click", step);
    hit.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); step(); } });
  }
})();
