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
    /* no screen zoom on hover (kept as a no-op) */
  }
  function unlean() { stage.style.transform = ""; }
  frames.forEach(function (f) {
    f.addEventListener("mouseenter", function () { lean(f); }); f.addEventListener("focus", function () { lean(f); });
    f.addEventListener("mouseleave", unlean); f.addEventListener("blur", unlean);
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

  /* ---- the visitors: real photographed people. They start seated on the bench and stay put; heads follow the pointer; drag to move ---- */
  var vis = { a: stage.querySelector(".p-a"), b: stage.querySelector(".p-b"), c: stage.querySelector(".p-c") };
  var PW = 1672, BX0 = 543, BX1 = 1156;                  // photo width, bench left/right edge (photo pixels)
  var M = {}, man = {}, last = {};
  function measure() {
    var k = stage.clientWidth / PW;
    M.k = k; M.W = stage.clientWidth; M.H = stage.clientHeight;
    M.floorTop = 730 * k; M.back = 746 * k; M.sitAnchor = 758 * k; M.sitMax = 800 * k; M.frontY = 905 * k; M.b0 = BX0 * k; M.b1 = BX1 * k;
  }
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var scaleAt = function (y) { return lerp(.9, 1.2, Math.max(0, Math.min(1, (y - M.floorTop) / (M.H - M.floorTop)))); };
  function place(el, x, y, s) { el.style.transform = "translate(" + (x - el.offsetWidth / 2).toFixed(1) + "px," + (y - el.offsetHeight).toFixed(1) + "px) scale(" + s.toFixed(3) + ")"; }
  function apply(el, key, m) {
    var y = m.sit ? M.sitAnchor : m.y, s = scaleAt(m.sit ? 770 * M.k : m.y) * (m.sit ? 1 : .86);
    el.classList.toggle("sit", !!m.sit); el.classList.toggle("on", true);
    place(el, m.x, y, s);
    var sh = stage.querySelector(".s-" + key);
    if (sh) {
      if (m.sit) { var sw = el.querySelector(".spr.sit").offsetWidth * s; sh.style.display = "block"; sh.style.width = (sw * 1.05).toFixed(1) + "px"; sh.style.left = m.x.toFixed(1) + "px"; sh.style.top = (748 * M.k).toFixed(1) + "px"; }
      else sh.style.display = "none";
    }
    if (!el.classList.contains("drag")) el.style.zIndex = m.sit ? 2 : (m.y > M.sitMax ? 6 : 2);
  }
  // seats along the bench: left to right  c, a, b
  var WALKER = null, REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  // on arrival: the blonde and the brunette stand looking at the art, the man sits in the middle of the bench (photo coordinates; drag anyone anywhere)
  var PHONE = window.matchMedia && matchMedia("(max-width:760px),(max-aspect-ratio:1/1)").matches;
  var START = { c: [230, 849], b: [1397, 883] };
  var seatX = {};
  var seats = { c: .24, a: .45, b: .63 };
  function settle() {
    // equal room between neighbours (and the bench ends): spread by the real widths of the seated sprites
    var order = ["c", "a", "b"], ws = order.map(function (k) { var sp = vis[k].querySelector(".spr.sit"); return sp.offsetWidth * scaleAt(770 * M.k); });
    var tot = ws.reduce(function (a, b) { return a + b; }, 0), gap = Math.min(tot * .08, (M.b1 - M.b0 - tot) / 4), cur; seatX = {};
    cur = M.b0 + gap * .6 + (PHONE ? M.W * .045 : 0);
    order.forEach(function (k, i) { seatX[k] = cur + ws[i] / 2; cur += ws[i] + gap; });
    ["c", "a", "b"].forEach(function (key) {
      var m = man[key];
      if (!m) m = man[key] = START[key] && !PHONE ? { x: START[key][0] * M.k, y: START[key][1] * M.k, sit: false, seed: false } : { x: 0, y: 0, sit: true, seed: true };
      if (m.seed) m.x = PHONE ? seatX[key] : (M.b0 + M.b1) / 2;
      apply(vis[key], key, m);
    });
  }
  // heads follow the pointer
  var pend = null;
  function aim(cx, cy) {
    ["a", "b", "c"].forEach(function (key) {
      var el = vis[key], h = el.querySelector(".spr:not([style*='none']) .head"), sp = el.classList.contains("sit") ? el.querySelector(".spr.sit") : el.querySelector(".spr.stand");
      var r = sp.getBoundingClientRect(), hx = r.left + r.width / 2, hy = r.top + r.height * (el.classList.contains("sit") ? .2 : .1);
      var dx = Math.max(-1, Math.min(1, (cx - hx) / (stage.clientWidth * .3))), dy = Math.max(-1, Math.min(1, (cy - hy) / (stage.clientHeight * .4)));
      el.style.setProperty("--hx", dx.toFixed(2)); el.style.setProperty("--hy", dy.toFixed(2));
    });
  }
  document.addEventListener("pointermove", function (e) {
    pend = [e.clientX, e.clientY];
    if (pend.raf) return; pend.raf = 1;
    requestAnimationFrame(function () { if (pend) aim(pend[0], pend[1]); pend = null; });
  }, { passive: true });

  // drag and drop (they stay wherever you put them; drop on the bench to sit)
  ["a", "b", "c"].forEach(function (key) {
    var el = vis[key], grab = null;
    var hold = null;
    function begin(e) {
      var r = stage.getBoundingClientRect(), m = man[key];
      var px = e.clientX - r.left, py = e.clientY - r.top;
      grab = { dx: px - m.x, dy: py - (m.sit ? M.frontY : m.y) };
      man[key] = { x: m.x, y: m.sit ? M.frontY : m.y, sit: false, seed: false };
      el.classList.add("drag"); try { el.setPointerCapture(e.pointerId); } catch (x) {} apply(el, key, man[key]);
    }
    el.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") {      // on a phone: swiping over a person scrolls the room; press and hold to pick them up
        var sx = e.clientX, sy = e.clientY, id = e.pointerId, ev = { clientX: sx, clientY: sy, pointerId: id };
        hold = { t: setTimeout(function () { hold = null; begin(ev); if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) {} }, 320), sx: sx, sy: sy };
        return;
      }
      begin(e); e.preventDefault();
    });
    var cancelHold = function () { if (hold) { clearTimeout(hold.t); hold = null; } };
    el.addEventListener("pointermove", function (e) { if (hold && Math.hypot(e.clientX - hold.sx, e.clientY - hold.sy) > 9) cancelHold(); });
    el.addEventListener("pointermove", function (e) {
      if (!grab) return;
      var r = stage.getBoundingClientRect(), m = man[key], w = el.offsetWidth * .5;
      m.x = Math.max(w * .6, Math.min(M.W - w * .6, e.clientX - r.left - grab.dx));
      m.y = Math.max(M.back, Math.min(M.H, e.clientY - r.top - grab.dy));
      apply(el, key, m);
    });
    var end = function () {
      if (!grab) return; grab = null; el.classList.remove("drag");
      var m = man[key];
      if (m.x > M.b0 && m.x < M.b1 && m.y > M.back + M.H * .004 && m.y < M.sitMax) { m.sit = true; m.x = Math.max(M.b0 + 70 * M.k, Math.min(M.b1 - 70 * M.k, m.x)); }
      apply(el, key, m);
    };
    el.addEventListener("pointerup", function (e) { cancelHold(); end(e); }); el.addEventListener("pointercancel", function (e) { cancelHold(); end(e); });
  });
  stage.addEventListener("touchmove", function (e) { if (stage.querySelector(".vis.drag")) e.preventDefault(); }, { passive: false });
  measure(); settle();
  // one visitor (the man) wanders the floor in front of the bench until someone picks him up; where you drop him, he stays
  var wPause = .6, wLast = 0;
  function wander(t) {
    var m = man[WALKER], el = vis[WALKER], dt = Math.min(.05, wLast ? (t - wLast) / 1000 : 0); wLast = t;
    if (m && m.walk && !m.sit && !el.classList.contains("drag")) {
      if (wPause > 0) { wPause -= dt; el.classList.remove("walk"); }
      else {
        if (m.tx == null) { m.tx = M.W * (.12 + Math.random() * .76); m.ty = (845 + Math.random() * 85) * M.k; if (Math.abs(m.tx - m.x) < M.W * .12) m.tx = m.x < M.W / 2 ? m.x + M.W * .25 : m.x - M.W * .25; }
        var dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy), st = 95 * M.k * dt;
        if (d <= st) { m.x = m.tx; m.y = m.ty; m.tx = null; wPause = 1.5 + Math.random() * 3; el.classList.remove("walk"); }
        else { m.x += dx / d * st; m.y += dy / d * st; el.classList.add("walk"); }
        apply(el, WALKER, m);
      }
    } else el.classList.remove("walk");
    requestAnimationFrame(wander);
  }
  if (!REDUCE && WALKER) requestAnimationFrame(wander);
  addEventListener("resize", function () { measure(); settle(); });
  addEventListener("load", function () { measure(); settle(); });
  [].forEach.call(stage.querySelectorAll(".vis .spr.sit img.body"), function (im) { if (!im.complete) im.addEventListener("load", function () { measure(); settle(); }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); settle(); });
  addEventListener("pageshow", function (e) { if (e.persisted) location.reload(); });
})();
