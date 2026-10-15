(function () {
  var room = document.querySelector(".room");
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var store = function (k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} };
  var load = function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } };

  /* ---- arrival on an inner page: the framed work comes forward out of the wall ---- */
  var poster = document.querySelector(".poster");
  if (poster && load("zoom") && !reduce && poster.animate) {
    store("zoom", null);
    poster.animate([{ transform: "scale(1.22)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 760, easing: "cubic-bezier(.2,.7,.2,1)" });
  } else store("zoom", null);

  if (!room) return;

  /* ---- click a frame: the room zooms toward it, then the campaign page opens ---- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.frame");
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    store("zoom", "1");
    if (reduce || !room.animate) return;
    e.preventDefault();
    var g = a.querySelector(".gold").getBoundingClientRect(), r = room.getBoundingClientRect();
    var cx = g.left + g.width / 2 - r.left, cy = g.top + g.height / 2 - r.top;
    var s = Math.min(innerWidth * 0.86 / g.width, innerHeight * 0.9 / g.height);
    room.style.transformOrigin = cx + "px " + cy + "px";
    var dx = innerWidth / 2 - (g.left + g.width / 2), dy = innerHeight / 2 - (g.top + g.height / 2);
    room.animate([{ transform: "translate(0,0) scale(1)" }, { transform: "translate(" + dx + "px," + dy + "px) scale(" + s + ")" }], { duration: 720, easing: "cubic-bezier(.65,0,.3,1)", fill: "forwards" });
    var veil = document.createElement("div");
    veil.style.cssText = "position:fixed;inset:0;background:#efe9de;opacity:0;pointer-events:none;z-index:50";
    document.body.appendChild(veil);
    veil.animate([{ opacity: 0 }, { opacity: 0, offset: .55 }, { opacity: 1 }], { duration: 720, fill: "forwards" });
    setTimeout(function () { location.href = a.href; }, 700);
  });
  addEventListener("pageshow", function (e) { if (e.persisted) location.reload(); });

  /* a visitor on the bench glances at whichever frame you point at */
  [].forEach.call(room.querySelectorAll("a.frame"), function (f) {
    var on = function () { room.setAttribute("data-look", f.dataset.i); }, off = function () { room.removeAttribute("data-look"); };
    f.addEventListener("mouseenter", on); f.addEventListener("focus", on); f.addEventListener("mouseleave", off); f.addEventListener("blur", off);
  });

  /* ---- the visitors ---- */
  var w1 = room.querySelector(".w1"), w2 = room.querySelector(".w2"), w3 = room.querySelector(".w3");
  var benchTop = room.querySelector(".bench .top"), benchFront = room.querySelector(".bench .front");
  var M = {};
  function measure() {
    var r = room.getBoundingClientRect(), t = benchTop.getBoundingClientRect(), f = benchFront.getBoundingClientRect();
    M.W = r.width; M.H = r.height; M.fw = w1.offsetWidth; M.fh = M.fw * 2.62;
    M.seatX = t.left - r.left + t.width * .42; M.seatY = t.top - r.top + t.height * .55;
    M.frontY = f.bottom - r.top + M.H * .045;
    M.back = t.top - r.top + t.height * .6;
  }
  var ease = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); };
  var lerp = function (a, b, k) { return a + (b - a) * k; };
  function place(el, x, y, s, flip) {
    el.style.transform = "translate(" + (x - M.fw / 2).toFixed(1) + "px," + (y - M.fh).toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
  }
  function setState(el, st) {
    el.classList.toggle("walk", st.walk); el.classList.toggle("sit", !!st.sit); el.classList.toggle("look", !!st.look); el.classList.toggle("on", st.on !== false);
  }
  // scale by depth: nearer the viewer (bigger y) = larger
  var depth = function (y) { return 1 + (y - M.seatY) / M.H * .5; };

  // the main visitor: walks in from the bottom of the room, sits on the bench, looks up, leaves to the right
  var T1 = [6.5, .7, 1.7, 17, 1.6, .6, 6.5, 2.5]; // walk in, pause, sit, stay, rise, pause, leave, gap
  var LOOP1 = T1.reduce(function (a, b) { return a + b; }, 0);
  function pose1(t) {
    t = t % LOOP1;
    var x0 = M.seatX - M.W * .24, y0 = M.H + M.fh * 1.45, xs = M.seatX - M.W * .03, ys = M.frontY;
    var seatFeet = M.seatY + M.fh * .43 * .96, k;
    if (t < T1[0]) { k = t / T1[0]; return { x: lerp(x0, xs, ease(k * .98 + .02 * k)), y: lerp(y0, ys, k), s: depth(lerp(y0, ys, k)), walk: true, on: k > .02 }; }
    t -= T1[0];
    if (t < T1[1]) return { x: xs, y: ys, s: depth(ys), walk: false };
    t -= T1[1];
    if (t < T1[2]) { k = ease(t / T1[2]); var yy = lerp(ys, seatFeet, k); return { x: lerp(xs, M.seatX, k), y: yy, s: lerp(depth(ys), 1, k), walk: false, sit: k > .25 }; }
    t -= T1[2];
    if (t < T1[3]) return { x: M.seatX, y: seatFeet, s: 1, walk: false, sit: true, look: true };
    t -= T1[3];
    if (t < T1[4]) { k = ease(t / T1[4]); return { x: lerp(M.seatX, xs, k), y: lerp(seatFeet, ys, k), s: lerp(1, depth(ys), k), walk: false, sit: k < .7 }; }
    t -= T1[4];
    if (t < T1[5]) return { x: xs, y: ys, s: depth(ys), walk: false };
    t -= T1[5];
    if (t < T1[6]) { k = t / T1[6]; var xe = M.W + M.fw * 1.5; return { x: lerp(xs, xe, k), y: ys, s: depth(ys), walk: true }; }
    return { x: 0, y: 0, s: 1, walk: false, on: false };
  }

  // wanderers pass behind the bench, pause in front of a frame and look up
  function wander(t, dir, period, stops, scale, off) {
    var u = ((t + off) % period) / period; // 0..1
    // stops: [{u0,u1,x}] pauses; between them walk linearly
    var pts = [{ u: 0, x: dir > 0 ? -.08 : 1.08 }].concat(stops, [{ u: 1, x: dir > 0 ? 1.08 : -.08 }]);
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], aEnd = a.hold ? a.u + a.hold : a.u;
      if (u >= a.u && u < aEnd) return { x: a.x * M.W, y: M.back, s: scale, walk: false, look: true };
      if (u >= aEnd && u < b.u) { var k = (u - aEnd) / (b.u - aEnd); return { x: lerp(a.x, b.x, k) * M.W, y: M.back, s: scale, walk: true }; }
    }
    return { x: pts[pts.length - 1].x * M.W, y: M.back, s: scale, walk: true };
  }
  var S2 = [{ u: .26, hold: .13, x: .40 }, { u: .62, hold: .12, x: .86 }];
  var S3 = [{ u: .3, hold: .1, x: .9 }, { u: .66, hold: .16, x: .42 }];

  // ---- drag a visitor to stand (or sit) somewhere else ----
  var man = {}, last = {}, floorEl = document.querySelector(".gallery .floor");
  var floorTop = function () { return floorEl.getBoundingClientRect().top - room.getBoundingClientRect().top; };
  var scaleAt = function (y) { var f = floorTop(); return lerp(.62, 1.3, Math.max(0, Math.min(1, (y - f) / (M.H - f)))); };
  var seatFeet = function () { return M.seatY + M.fh * .43 * .96; };
  var benchSpan = function () { var t = benchTop.getBoundingClientRect(), r = room.getBoundingClientRect(); return [t.left - r.left, t.right - r.left]; };
  function manualPose(m, el) {
    if (m.sit) return { x: m.x, y: seatFeet(), s: 1, sit: true, look: true, walk: false };
    return { x: m.x, y: m.y, s: scaleAt(m.y), walk: !!m.drag, look: !m.drag };
  }
  function apply(el, p) {
    last[el.className.match(/w\d/)[0]] = p; setState(el, p); place(el, p.x, p.y, p.s);
    if (man[el.className.match(/w\d/)[0]] && !p.sit) el.style.zIndex = p.y > M.back + M.H * .01 ? 6 : 2;
    else if (p.sit) el.style.zIndex = 4; else el.style.zIndex = "";
  }
  [w1, w2, w3].forEach(function (el) {
    var key = el.className.match(/w\d/)[0], grab = null;
    el.addEventListener("pointerdown", function (e) {
      var p = last[key]; if (!p || p.on === false) return;
      var r = room.getBoundingClientRect();
      grab = { dx: e.clientX - r.left - p.x, dy: e.clientY - r.top - p.y };
      man[key] = { x: p.x, y: p.sit ? seatFeet() : p.y, sit: false, drag: true };
      if (p.sit) man[key].y = M.frontY;
      el.setPointerCapture(e.pointerId); el.classList.add("drag"); e.preventDefault();
    });
    el.addEventListener("pointermove", function (e) {
      if (!grab) return;
      var r = room.getBoundingClientRect(), m = man[key];
      m.x = Math.max(M.fw * .3, Math.min(M.W - M.fw * .3, e.clientX - r.left - grab.dx));
      m.y = Math.max(floorTop() + M.H * .03, Math.min(M.H, e.clientY - r.top - grab.dy));
      apply(el, manualPose(m, el));
    });
    var end = function () {
      if (!grab) return; grab = null; el.classList.remove("drag");
      var m = man[key], b = benchSpan();
      m.drag = false;
      if (m.x > b[0] && m.x < b[1] && m.y > M.back - M.H * .02 && m.y < M.frontY + M.H * .08) { m.sit = true; m.x = Math.max(b[0] + M.fw * .6, Math.min(b[1] - M.fw * .6, m.x)); }
      apply(el, manualPose(m, el));
    };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  });

  function frame(now) {
    var t = now / 1000;
    var p1 = man.w1 ? manualPose(man.w1, w1) : pose1(t);
    var p2 = man.w2 ? manualPose(man.w2, w2) : wander(t, 1, 70, S2, .66, 4);
    var p3 = man.w3 ? manualPose(man.w3, w3) : wander(t, -1, 90, S3, .6, 31);
    apply(w1, p1); apply(w2, p2); apply(w3, p3);
    if (running) raf = requestAnimationFrame(frame);
  }
  var running = false, raf = 0;
  function start() { if (running) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  measure();
  addEventListener("resize", measure);
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });

  if (reduce) {
    // still scene: one visitor seated, two standing in front of the frames
    apply(w1, { x: M.seatX, y: seatFeet(), s: 1, sit: true, look: false });
    apply(w2, { x: M.W * .4, y: M.back, s: .66, walk: false });
    apply(w3, { x: M.W * .9, y: M.back, s: .6, walk: false });
  } else { window.__t0 = performance.now(); start(); }
  window.__gallery = { seek: function (sec) { stop(); measure(); frame(sec * 1000); } };
})();
