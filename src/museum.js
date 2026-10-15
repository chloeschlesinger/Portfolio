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
  addEventListener("pageshow", function (e) { if (e.persisted) location.reload(); });
})();
