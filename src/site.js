(function () {
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var store = function (k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} };
  var load = function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } };

  // coming back with the browser's back button: reset any half-torn flyer
  addEventListener("pageshow", function (e) { if (e.persisted && document.querySelector(".tab-flying")) location.reload(); });

  // a ragged torn edge: the strip of paper left behind on the flyer
  function raggedEdge() {
    var pts = ["0 0", "100% 0"], n = 14, i;
    for (i = n; i >= 0; i--) pts.push((i / n * 100).toFixed(1) + "% " + (62 + Math.random() * 38).toFixed(0) + "%");
    return "polygon(" + pts.join(",") + ")";
  }

  // TEAR-OFF: lift the tab, rip it from the bottom up, let it fall; the torn strip stays on the flyer
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.tab");
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    store("rip", JSON.stringify({ k: a.dataset.key, t: Date.now() }));
    if (reduce || !a.animate) return;
    e.preventDefault();
    var href = a.href, d = Math.random() < .5 ? -1 : 1;
    var stub = document.createElement("span");
    stub.className = "torn-stub"; stub.setAttribute("aria-hidden", "true");
    stub.style.cssText = "left:" + a.offsetLeft + "px;width:" + a.offsetWidth + "px;height:" + Math.round(a.offsetWidth * .2) + "px;clip-path:" + raggedEdge();
    a.parentNode.insertBefore(stub, a);
    a.classList.add("tab-flying");
    a.style.transformOrigin = d < 0 ? "88% 0" : "12% 0";
    var P = "perspective(720px) ";
    a.animate([
      { transform: P + "rotate(0deg)", offset: 0 },
      { transform: P + "rotateX(-26deg) rotate(" + 1.5 * d + "deg) translateY(-3px)", offset: .17, easing: "ease-out" },
      { transform: P + "rotateX(-44deg) rotate(" + 6 * d + "deg) translate(" + 3 * d + "px,1px)", offset: .33, easing: "cubic-bezier(.6,0,1,1)" },
      { transform: P + "rotateX(-58deg) rotate(" + 14 * d + "deg) translate(" + 10 * d + "px,16px)", offset: .45 },
      { transform: P + "translate(" + 70 * d + "px,62vh) rotate(" + 58 * d + "deg) rotateX(-72deg)", opacity: .92, offset: 1 }
    ], { duration: 940, easing: "linear", fill: "forwards" });
    setTimeout(function () { location.href = href; }, 760);
  });

  // ARRIVAL: the strip that was torn off lands in the poster's header
  var torn = document.getElementById("torn"), rip = load("rip");
  store("rip", null);
  if (torn && rip && !reduce && torn.animate) {
    try { var r = JSON.parse(rip); if (Date.now() - r.t < 8000)
      torn.animate([
        { transform: "translate(40px,-80px) rotate(80deg) scale(1.2)", opacity: 0 },
        { transform: "translate(14px,-18px) rotate(30deg) scale(1.08)", opacity: 1, offset: .35 },
        { transform: "rotate(-1.5deg)", opacity: 1 }
      ], { duration: 820, delay: 500, easing: "cubic-bezier(.3,1.2,.5,1)", fill: "backwards" }); } catch (e) {}
  }

  // gentle rise-in for pictures as you scroll
  var els = [].slice.call(document.querySelectorAll(".jg figure,.bigfig,.pics figure,.portrait"));
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { el.classList.add("rv"); io.observe(el); });
  }
})();

/* every page opens at the top (unless the link carries a #hash, like Contact); links to the page you're already on scroll up too */
(function () {
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
  var top = function () { window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; };
  if (!location.hash) { top(); addEventListener("load", top); addEventListener("pageshow", top); }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]"); if (!a || e.defaultPrevented || a.target === "_blank") return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin === location.origin && u.pathname.replace(/index\.html$/, "") === location.pathname.replace(/index\.html$/, "") && !u.hash) {
      e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
})();
