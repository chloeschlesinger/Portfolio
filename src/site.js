(function () {
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var store = function (k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} };
  var load = function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } };

  // coming back with the browser's back button: reset any half-torn flyer
  addEventListener("pageshow", function (e) { if (e.persisted && document.querySelector(".tab-flying")) location.reload(); });

  // TEAR-OFF: click a tab and it rips off the flyer, then the next page opens with that strip as its header
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.tab");
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    store("rip", JSON.stringify({ k: a.dataset.key, t: Date.now() }));
    if (reduce || !a.animate) return;
    e.preventDefault();
    var href = a.href, r = a.getBoundingClientRect();
    var fly = a.cloneNode(true);
    fly.removeAttribute("href"); fly.setAttribute("aria-hidden", "true");
    fly.className = "tab tab-flying";
    fly.style.cssText += ";position:fixed;left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px;margin:0;z-index:50;pointer-events:none;transform-origin:50% 0";
    document.body.appendChild(fly);
    var stub = document.createElement("span");
    stub.className = "stub left"; stub.setAttribute("aria-hidden", "true");
    stub.style.height = "38px"; stub.style.clipPath = a.style.clipPath;
    a.replaceWith(stub);
    var dir = Math.random() < .5 ? -1 : 1;
    fly.animate([
      { transform: "none", offset: 0 },
      { transform: "rotate(" + (-5 * dir) + "deg) translateY(5px)", offset: .22, easing: "ease-out" },
      { transform: "rotate(" + (7 * dir) + "deg) translateY(16px)", offset: .38 },
      { transform: "translate(" + (50 * dir) + "px,55vh) rotate(" + (48 * dir) + "deg)", opacity: .9, offset: 1 }
    ], { duration: 720, easing: "cubic-bezier(.5,0,.85,.45)", fill: "forwards" });
    setTimeout(function () { location.href = href; }, 560);
  });

  // ARRIVAL: the strip that was torn off lands in the page header
  var torn = document.getElementById("torn");
  var rip = load("rip");
  store("rip", null);
  if (torn && rip && !reduce && torn.animate) {
    try { var d = JSON.parse(rip); if (Date.now() - d.t < 8000)
      torn.animate([
        { transform: "translate(60px,-90px) rotate(88deg) scale(1.25)", opacity: 0 },
        { transform: "translate(20px,-24px) rotate(40deg) scale(1.1)", opacity: 1, offset: .35 },
        { transform: "rotate(-3deg)", opacity: 1 }
      ], { duration: 780, easing: "cubic-bezier(.3,1.25,.5,1)" }); } catch (e) {}
  }

  // gentle rise-in for pictures as you scroll
  var els = [].slice.call(document.querySelectorAll(".jg figure,.bigfig,.pics figure"));
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { el.classList.add("rv"); io.observe(el); });
  }

  // DOWN THE TREE: scrolling carries you from the bright canopy toward the dark forest floor; the flyer sways with your scroll
  var root = document.documentElement, wrap = document.querySelector(".sheetwrap");
  if (!reduce && !document.body.classList.contains("home")) {
    var last = scrollY, tilt = 0, tick = false;
    var upd = function () {
      tick = false;
      var max = Math.max(1, root.scrollHeight - innerHeight), y = scrollY;
      root.style.setProperty("--p", Math.min(1, Math.max(0, y / max)).toFixed(3));
      root.style.setProperty("--py", (-y * .06).toFixed(1) + "px");
      var v = y - last; last = y;
      tilt += (Math.max(-1.6, Math.min(1.6, v * .06)) - tilt) * .5;
      if (wrap) wrap.style.setProperty("--tilt", tilt.toFixed(2) + "deg");
      if (Math.abs(tilt) > .02) requestAnimationFrame(function () { tick = true; upd(); });
    };
    addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }
})();
