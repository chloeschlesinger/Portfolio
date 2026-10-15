(function () {
  var stage = document.querySelector(".museum .stage");
  if (!stage) return;
  var pan = document.querySelector(".museum .pan"), swipe = document.querySelector(".swipe");
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var phone = function () { return matchMedia("(max-width:760px),(max-aspect-ratio:1/1)").matches; };
  var store = function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} };
  var frames = [].slice.call(stage.querySelectorAll("a.frame"));

  // phone: start centred on the first campaign; the swipe hint goes away once you move
  function fit() { if (phone()) stage.style.width = Math.round(pan.clientHeight * 1672 / 941) + "px"; else stage.style.width = ""; }
  fit();
  function center(i) { var f = frames[i]; pan.scrollLeft = f.offsetLeft + f.offsetWidth / 2 - pan.clientWidth / 2; }
  if (phone()) { center(0); pan.addEventListener("scroll", function () { if (Math.abs(pan.scrollLeft - (frames[0].offsetLeft + frames[0].offsetWidth / 2 - pan.clientWidth / 2)) > 24 && swipe) swipe.classList.add("gone"); }, { passive: true }); setTimeout(function () { if (swipe) swipe.classList.add("gone"); }, 6000); }
  addEventListener("resize", function () { fit(); if (phone()) center(0); });

  // desktop hover: the camera drifts a little toward the frame you point at
  function lean(f) {
    if (reduce || phone()) return;
    var s = stage.getBoundingClientRect(), r = f.getBoundingClientRect();
    var ox = (r.left + r.width / 2 - s.left) / s.width * 100, oy = (r.top + r.height / 2 - s.top) / s.height * 100;
    stage.style.transformOrigin = ox + "% " + oy + "%"; stage.style.transform = "scale(1.045)";
  }
  function unlean() { stage.style.transform = ""; }
  frames.forEach(function (f) {
    var look = function () { stage.setAttribute("data-look", f.dataset.i); }, unlook = function () { stage.removeAttribute("data-look"); };
    f.addEventListener("mouseenter", function () { lean(f); look(); }); f.addEventListener("focus", function () { lean(f); look(); });
    f.addEventListener("mouseleave", function () { unlean(); unlook(); }); f.addEventListener("blur", function () { unlean(); unlook(); });
  });

  // click: the framed picture (with its piece of the photo) grows to fill the screen, then the campaign page opens
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.frame");
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    store("zoom", "1");
    if (reduce) return;
    e.preventDefault();
    var r = a.getBoundingClientRect(), s = stage.getBoundingClientRect();
    var clone = document.createElement("div");
    clone.style.cssText = "position:fixed;z-index:60;pointer-events:none;overflow:hidden;transform-origin:50% 50%;left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px";
    var wrap = document.createElement("div"); // same size as the room so the picture keeps its proportions and shadows
    wrap.className = "frame";
    wrap.style.cssText = "position:absolute;translate:none;transform:none;container-type:inline-size;left:" + (s.left - r.left) + "px;top:" + (s.top - r.top) + "px;width:" + s.width + "px;height:" + s.height + "px;background:url(/scene/museum.webp) 0 0/100% 100% no-repeat";
    var art = a.querySelector(".art").cloneNode(true), ar = a.querySelector(".art").getBoundingClientRect();
    art.style.cssText += ";position:absolute;left:" + (ar.left - s.left) + "px;top:" + (ar.top - s.top) + "px;width:" + ar.width + "px;height:" + ar.height + "px";
    wrap.appendChild(art); clone.appendChild(wrap);
    var veil = document.createElement("div");
    veil.style.cssText = "position:fixed;inset:0;z-index:59;background:#efe9de;opacity:0;pointer-events:none";
    document.body.appendChild(veil); document.body.appendChild(clone);
    var k = Math.min(innerWidth * .9 / r.width, innerHeight * .86 / r.height);
    var dx = innerWidth / 2 - (r.left + r.width / 2), dy = innerHeight / 2 - (r.top + r.height / 2);
    veil.animate([{ opacity: 0 }, { opacity: .96 }], { duration: 640, fill: "forwards", easing: "ease-in" });
    clone.animate([{ transform: "none" }, { transform: "translate(" + dx + "px," + dy + "px) scale(" + k + ")" }], { duration: 760, fill: "forwards", easing: "cubic-bezier(.6,0,.25,1)" });
    setTimeout(function () { location.href = a.href; }, 740);
  });

  /* ---- the visitors: walk, sit, look up; drag any of them somewhere else ---- */
  var w1 = stage.querySelector(".w1"), w2 = stage.querySelector(".w2"), w3 = stage.querySelector(".w3");
  var PH = 941, PW = 1672, BX0 = 543, BX1 = 1156;       // photo size and the bench's left/right edge in photo pixels
  var M = {};
  function measure() {
    var k = stage.clientWidth / PW;
    M.k = k; M.W = stage.clientWidth; M.H = stage.clientHeight; M.fw = w1.offsetWidth; M.fh = M.fw * 2.62;
    M.floorTop = 730 * k; M.back = 746 * k; M.hipY = 758 * k; M.frontY = 905 * k; M.sitMax = 800 * k;
    M.b0 = BX0 * k; M.b1 = BX1 * k; M.seatX = (BX0 + BX1) / 2 * k - 40 * k;
  }
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); };
  var scaleAt = function (y) { return lerp(.9, 1.3, Math.max(0, Math.min(1, (y - M.floorTop) / (M.H - M.floorTop)))); };
  var seatFeet = function () { return M.hipY + M.fh * .43 * scaleAt(M.hipY); };
  function place(el, x, y, s) { el.style.transform = "translate(" + (x - M.fw / 2).toFixed(1) + "px," + (y - M.fh).toFixed(1) + "px) scale(" + s.toFixed(3) + ")"; }
  function setState(el, st) {
    el.classList.toggle("walk", !!st.walk); el.classList.toggle("sit", !!st.sit); el.classList.toggle("look", !!st.look); el.classList.toggle("on", st.on !== false);
  }
  var last = {}, man = {};
  function apply(el, key, p) {
    last[key] = p; setState(el, p); place(el, p.x, p.y, p.s);
    if (el.classList.contains("drag")) return;
    el.style.zIndex = p.sit ? 2 : (p.y > M.sitMax ? 6 : 2);
  }

  // the main visitor: walks in from the bottom of the room, steps up to the bench, sits and looks up, then strolls off to the right
  var T1 = [6.5, .7, 1.7, 17, 1.6, .6, 6.5, 2.5], LOOP1 = T1.reduce(function (a, b) { return a + b; }, 0);
  function pose1(t) {
    t = t % LOOP1;
    var x0 = M.seatX - M.W * .2, y0 = M.H + M.fh * 1.5, xs = M.seatX - M.W * .03, ys = M.frontY, sf = seatFeet(), k;
    if (t < T1[0]) { k = t / T1[0]; var yy = lerp(y0, ys, k); return { x: lerp(x0, xs, k), y: yy, s: scaleAt(yy), walk: true, on: k > .02 }; }
    t -= T1[0];
    if (t < T1[1]) return { x: xs, y: ys, s: scaleAt(ys) };
    t -= T1[1];
    if (t < T1[2]) { k = ease(t / T1[2]); return { x: lerp(xs, M.seatX, k), y: lerp(ys, sf, k), s: lerp(scaleAt(ys), scaleAt(M.hipY), k), sit: k > .3 }; }
    t -= T1[2];
    if (t < T1[3]) return { x: M.seatX, y: sf, s: scaleAt(M.hipY), sit: true, look: true };
    t -= T1[3];
    if (t < T1[4]) { k = ease(t / T1[4]); return { x: lerp(M.seatX, xs, k), y: lerp(sf, ys, k), s: lerp(scaleAt(M.hipY), scaleAt(ys), k), sit: k < .7 }; }
    t -= T1[4];
    if (t < T1[5]) return { x: xs, y: ys, s: scaleAt(ys) };
    t -= T1[5];
    if (t < T1[6]) { k = t / T1[6]; return { x: lerp(xs, M.W + M.fw * 1.5, k), y: ys, s: scaleAt(ys), walk: true }; }
    return { x: 0, y: 0, s: 1, on: false };
  }
  // two visitors stroll along the wall, pausing beside the frames to look up
  function wander(t, dir, period, stops, off) {
    var u = ((t + off) % period) / period, pts = [{ u: 0, x: dir > 0 ? -.08 : 1.08 }].concat(stops, [{ u: 1, x: dir > 0 ? 1.08 : -.08 }]), s = scaleAt(M.back);
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], aEnd = a.hold ? a.u + a.hold : a.u;
      if (u >= a.u && u < aEnd) return { x: a.x * M.W, y: M.back, s: s, look: true };
      if (u >= aEnd && u < b.u) return { x: lerp(a.x, b.x, (u - aEnd) / (b.u - aEnd)) * M.W, y: M.back, s: s, walk: true };
    }
    return { x: pts[pts.length - 1].x * M.W, y: M.back, s: s, walk: true };
  }
  var S2 = [{ u: .26, hold: .13, x: .17 }, { u: .62, hold: .12, x: .53 }], S3 = [{ u: .3, hold: .1, x: .88 }, { u: .66, hold: .16, x: .47 }];

  function manualPose(m) {
    if (m.sit) return { x: m.x, y: seatFeet(), s: scaleAt(M.hipY), sit: true, look: true };
    return { x: m.x, y: m.y, s: scaleAt(m.y), walk: !!m.drag, look: !m.drag };
  }
  [[w1, "w1"], [w2, "w2"], [w3, "w3"]].forEach(function (pair) {
    var el = pair[0], key = pair[1], grab = null;
    el.addEventListener("pointerdown", function (e) {
      var p = last[key]; if (!p || p.on === false) return;
      var r = stage.getBoundingClientRect();
      grab = { dx: e.clientX - r.left - p.x, dy: e.clientY - r.top - p.y };
      man[key] = { x: p.x, y: p.sit ? M.frontY : p.y, sit: false, drag: true };
      el.setPointerCapture(e.pointerId); el.classList.add("drag"); e.preventDefault();
    });
    el.addEventListener("pointermove", function (e) {
      if (!grab) return;
      var r = stage.getBoundingClientRect(), m = man[key];
      m.x = Math.max(M.fw * .3, Math.min(M.W - M.fw * .3, e.clientX - r.left - grab.dx));
      m.y = Math.max(M.back, Math.min(M.H, e.clientY - r.top - grab.dy));
      apply(el, key, manualPose(m));
    });
    var end = function () {
      if (!grab) return; grab = null; el.classList.remove("drag");
      var m = man[key]; m.drag = false;
      if (m.x > M.b0 && m.x < M.b1 && m.y > M.back + M.H * .004 && m.y < M.sitMax) { m.sit = true; m.x = Math.max(M.b0 + M.fw * .6, Math.min(M.b1 - M.fw * .6, m.x)); }
      apply(el, key, manualPose(m));
    };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  });

  var running = false, raf = 0;
  function frame(now) {
    var t = now / 1000;
    apply(w1, "w1", man.w1 ? manualPose(man.w1) : pose1(t));
    apply(w2, "w2", man.w2 ? manualPose(man.w2) : wander(t, 1, 70, S2, 4));
    apply(w3, "w3", man.w3 ? manualPose(man.w3) : wander(t, -1, 90, S3, 31));
    if (running) raf = requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }
  measure();
  addEventListener("resize", function () { measure(); if (!running) frame(performance.now()); });
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  if (reduce) {
    apply(w1, "w1", { x: M.seatX, y: seatFeet(), s: scaleAt(M.hipY), sit: true });
    apply(w2, "w2", { x: M.W * .17, y: M.back, s: scaleAt(M.back) });
    apply(w3, "w3", { x: M.W * .88, y: M.back, s: scaleAt(M.back) });
  } else start();
  window.__gallery = { seek: function (sec) { stop(); measure(); frame(sec * 1000); } };
  addEventListener("pageshow", function (e) { if (e.persisted) location.reload(); });
})();
