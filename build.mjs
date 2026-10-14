// VERSION 4 (graphic NYC street-poster editorial, tear-off flyer). Builds the site from /content and /src into /dist.  Run: node build.mjs
// No packages needed. Netlify runs this automatically each time you save in the dashboard.
import fs from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname);
const rd = (p) => fs.readFileSync(path.join(root, p), "utf8");
const json = (p) => JSON.parse(rd(p));
const dist = path.join(root, "dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const lines = (s = "") => String(s).split("\n").map(esc).join("<br>");
const url = (p) => (p ? (p.startsWith("http") ? p : p.startsWith("/") ? p : "/" + p) : "");

const FONTS =
  "https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Archivo+Black&family=Archivo:wght@400;600;800&family=Archivo+Narrow:wght@500;700&family=Reenie+Beanie&display=swap";

// ---------- content ----------
const home = json("content/home.json");
const about = json("content/about.json");
const campaigns = fs
  .readdirSync(path.join(root, "content/campaigns"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ slug: f.replace(/\.json$/, ""), ...json("content/campaigns/" + f) }))
  .sort((a, b) => (a.order || 99) - (b.order || 99));

const ctitle = (c) => (c.tab_label || c.title || "").replace(/\n/g, " ");
const COLORS = ["blue", "red", "mag", "green", "navy", "org"];
const pad = (n) => String(n).padStart(2, "0");

// ---------- helpers ----------
// each letter becomes its own little piece that hops when the mouse touches it
const R = [-9, 7, -6, 10, -8, 6, -10, 8];
const L = (t = "") =>
  [...String(t)].map((ch, i) => (ch === " " ? " " : `<span class="lt" style="--r:${R[i % 8]}deg;--n:${i}">${esc(ch)}</span>`)).join("");

// image sizes (so each row of pictures can line up to the same height)
function imgRatio(p) {
  try {
    const f = path.join(root, "src", p.replace(/^\//, ""));
    const b = fs.readFileSync(f);
    if (b.slice(1, 4).toString() === "PNG") return b.readUInt32BE(16) / b.readUInt32BE(20);
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return b.readUInt16BE(i + 7) / b.readUInt16BE(i + 5);
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch (e) {}
  return null;
}
const SHAPES = { wide: 1.5, tall: 0.667, square: 1, large: 0.75, strip: 0.667, landscape: 1.333 };
const isVideo = (p) => /\.(mp4|webm|mov)$/i.test(p || "");

// lighter webp copy (made by tools/optimize.py) is used when it exists; the original stays as the fallback
function webpPic(image, alt) {
  const base = path.basename(image).replace(/\.[^.]+$/, "");
  const has = !image.startsWith("http") && fs.existsSync(path.join(root, "src/optimized", base + ".webp"));
  const r = imgRatio(image);
  const dim = r ? ` width="1000" height="${Math.round(1000 / r)}"` : "";
  const img = `<img class="im" src="${url(image)}" alt="${esc(alt)}" loading="lazy" decoding="async"${dim}>`;
  return has ? `<picture><source srcset="/optimized/${base}.webp" type="image/webp">${img}</picture>` : img;
}

function pic({ image, alt, label, shape, note }) {
  if (image) {
    return isVideo(image)
      ? `<video src="${url(image)}" controls playsinline preload="metadata" aria-label="${esc(alt || label)}"></video>`
      : webpPic(image, alt || label);
  }
  const r = SHAPES[shape] || 1.5;
  return `<div class="ph" style="--r:${r}" role="img" aria-label="Placeholder for ${esc(label)}"><span><b>${esc(label)}</b>${esc(note || "placeholder: upload this in the dashboard")}</span></div>`;
}
const ratioOf = (it) => (it.image && !isVideo(it.image) ? imgRatio(it.image) : null) || SHAPES[it.shape] || 1.5;

function grid(items, { label, h = 300, mh = 520, caps = false }) {
  const figs = items
    .map((it, i) => {
      const r = ratioOf(it);
      const cap = caps && it.caption ? `<span class="cp sh"><span class="strip">${esc(it.caption)}</span></span>` : "";
      return `<figure style="--r:${r.toFixed(3)}">${pic({ image: it.image, alt: it.alt, label: it.caption || `${label} ${i + 1}`, shape: it.shape })}${cap}</figure>`;
    })
    .join("\n      ");
  return `<div class="jg" style="--h:${h}px;--mh:${mh}px">\n      ${figs}\n    </div>`;
}

const SVG_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<filter id="rough" x="-4%" y="-8%" width="108%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/></filter>
<filter id="roughbig" x="-4%" y="-6%" width="108%" height="112%"><feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="6"/></filter>
</defs></svg>`;

// ---------- shared pieces ----------
// a hand-torn bottom edge for the tear-off tabs; every tab gets a slightly different one
function jag(seed) {
  const pts = ["0 0", "100% 0"];
  const n = 9;
  for (let i = n; i >= 0; i--) pts.push(`${((i / n) * 100).toFixed(1)}% ${(100 - ((i * 37 + seed * 13) % 7) * 1.5).toFixed(1)}%`);
  return `polygon(${pts.join(",")})`;
}

function menuItems() {
  return [
    ...campaigns.map((c) => ({ href: `/${c.slug}/`, label: ctitle(c), key: c.slug })),
    { href: "/about/", label: "About me", key: "about" },
    { href: "/about/#contact", label: "Contact", key: "contact" },
  ];
}
const resumeItem = () => (about.resume ? [{ href: url(about.resume), label: "Résumé", key: "resume", cls: "res", dl: true }] : []);

function topnav(current) {
  const items = [{ href: "/", label: "← Cover", key: "home", cls: "cover" }, ...menuItems(), ...resumeItem()];
  return `<nav class="topnav" aria-label="Main">
  ${items
    .map((i, n) => `<a style="--i:${n}" class="${i.cls || ""}" href="${i.href}"${i.dl ? " download" : ""}${i.key === current ? ' aria-current="page"' : ""}>${esc(i.label)}</a>`)
    .join("\n  ")}
</nav>`;
}

// the row of tear-off tabs at the bottom of every sheet (the site's real navigation)
const TABINK = ["var(--blue)", "var(--red)", "var(--ink)", "var(--blue)", "var(--red)"];
function tabsRow(current) {
  const items = [...menuItems(), { href: "/", label: "Back to cover", key: "home", n: "←" }].filter((it) => it.key !== current);
  let nn = 0;
  const out = items
    .map((it, i) => {
      const num = it.n || pad(menuItems().findIndex((m) => m.key === it.key) + 1);
      return `<a class="tab" href="${it.href}" data-n="${num}" data-label="${esc(it.label)}" data-key="${esc(it.key)}" style="--i:${i};--h:${[1, 0.94, 1.03, 0.97, 1.02][i % 5]};--r0:${[-0.6, 0.8, -0.4, 0.6, -0.8][i % 5]}deg;--k:${TABINK[i % TABINK.length]};clip-path:${jag(i + 1)}"><span class="n">${num}</span><span class="t">${esc(it.label)}</span></a>`;
    })
    .join("");
  return `<nav class="tabs" aria-label="Pages (tear-off tabs)">${out}</nav>`;
}

function shell({ title, description, body, cls = "" }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
<style>${rd("src/site.css")}</style>
<script>document.documentElement.className+=" js"</script>
</head>
<body class="${cls}">
${SVG_DEFS}
<div class="scene" aria-hidden="true"></div>
${body}
<script>${rd("src/site.js")}</script>
</body>
</html>
`;
}

const staples = `<i class="tape t1"></i><i class="tape t2"></i>`;
const foot = `<p class="foot">${esc(home.first_name)} ${esc(home.last_name)} · ${esc(home.role)}</p>`;

// ---------- HOME ----------
function homePage() {
  const body = `<a class="skip" href="#cover">Skip to the cover</a>
<main class="stage home" id="cover">
  <div class="sheetwrap">
    <i class="back b-yellow" aria-hidden="true"></i>
    <i class="back b-black" aria-hidden="true"></i>
    ${staples}
    <div class="sheet">
      <h1 aria-label="${esc(home.first_name)} ${esc(home.last_name)}, ${esc(home.role)}">
        <span class="h-first">${esc(String(home.first_name).toUpperCase())}</span>
        <span class="h-last"><span>${esc(String(home.last_name).toUpperCase())}</span></span>
        <span class="h-role"><span>${esc(String(home.role).toUpperCase())}</span></span>
      </h1>
      <p class="invite">${esc(home.hint_line1 || "Pick a campaign.")}<br><span>${esc(home.hint_line2 || "Tear it off.")}</span></p>
      <p class="credit">${esc(home.note_top || "")} ${esc(home.note_accent || "")} <b>/ ${esc(home.note_small || "")}</b></p>
    </div>
    ${tabsRow("home")}
  </div>
</main>`;
  return shell({
    title: `${home.first_name} ${home.last_name}, ${home.role}`,
    description: `Portfolio of ${home.first_name} ${home.last_name}, ${home.role}.`,
    body,
    cls: "home",
  });
}

// editorial picture grid: pictures sit flat and clean, captions are handwritten
function gridV4(items, { label, h = 300, mh = 520, caps = false }) {
  const figs = items
    .map((it, i) => {
      const r = ratioOf(it);
      const cap = caps && it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : "";
      return `<figure style="--r:${r.toFixed(3)}">${pic({ image: it.image, alt: it.alt, label: it.caption || `${label} ${i + 1}`, shape: it.shape })}${cap}</figure>`;
    })
    .join("\n      ");
  return `<div class="jg" style="--h:${h}px;--mh:${mh}px">\n      ${figs}\n    </div>`;
}

// ---------- CAMPAIGN ----------
function campaignPage(c, idx) {
  const hidden = new Set(c.hidden_sections || []);
  const t = c.title.split("\n");
  const titleText = ctitle(c);
  const next = campaigns[idx + 1];
  const secs = [];
  if (!hidden.has("concept_board"))
    secs.push(`<figure class="bigfig lead">${pic({ image: c.concept_board, alt: `${titleText} concept board`, label: "Concept board", shape: "wide", note: "placeholder: your concept board image" })}</figure>`);
  if (!hidden.has("posters") && (c.posters || []).length)
    secs.push(`<section class="section" aria-labelledby="h-posters"><p class="cap" id="h-posters"><b>01</b> Posters</p>${gridV4(c.posters, { label: "Poster", h: 300, mh: 520 })}</section>`);
  if (!hidden.has("billboard"))
    secs.push(`<section class="section" aria-labelledby="h-bill"><p class="cap" id="h-bill"><b>02</b> Billboard</p><figure class="bigfig bill">${pic({ image: c.billboard, alt: `${titleText} billboard`, label: "Billboard", shape: "wide", note: "placeholder: your billboard image" })}</figure></section>`);
  if (!hidden.has("activations") && (c.activations || []).length)
    secs.push(`<section class="section" aria-labelledby="h-act"><p class="cap" id="h-act"><b>03</b> Activations</p>${gridV4(c.activations, { label: "Activation", h: 320, mh: 540, caps: true })}</section>`);

  const nextLink = next
    ? `<p class="cap">Next campaign</p><a href="/${next.slug}/" class="next">${esc(ctitle(next))} <span aria-hidden="true">→</span></a>`
    : `<p class="cap">Keep going</p><a href="/about/" class="next">About me <span aria-hidden="true">→</span></a>`;

  const body = `<a class="skip" href="#work">Skip to the work</a>
${topnav(c.slug)}
<div class="poster-wrap">
<main class="poster">
  ${staples}
  <div class="paper">
    <header class="hero">
      <span class="torn" id="torn"><b>${pad(idx + 1)}</b>${esc(titleText)}</span>
      <h1 aria-label="${esc(titleText)}">${t.map((x) => `<span>${esc(x.toUpperCase())}</span>`).join("")}</h1>
      ${c.badge ? `<span class="badge">${esc(c.badge)}</span>` : ""}
      <p class="idea"><span>${esc(c.line)}</span></p>
      ${c.sub ? `<p class="sub">${esc(c.sub)}</p>` : ""}
    </header>
    <div id="work">
      ${secs.join("\n      ")}
    </div>
    <div class="nextrow">${nextLink}</div>
  </div>
  ${tabsRow(c.slug)}
</main>
</div>
${foot}`;
  return shell({ title: `${titleText} | ${home.first_name} ${home.last_name}`, description: `${titleText}: ${c.line}`, body, cls: "inner" });
}

// ---------- ABOUT (+ contact at the bottom) ----------
function aboutPage() {
  const paras = about.bio.split(/\n\s*\n/).map((p) => `<p>${esc(p.trim())}</p>`).join("\n          ");
  const photos = (about.photos || []).filter((p) => p && p.image).slice(0, 8);
  const photoFig = (p, i) => `<figure class="snap s${(i % 3) + 1}">${pic({ image: p.image, alt: p.alt, label: `Photo ${i + 1}`, shape: "tall", note: "placeholder: add a photo in the dashboard" })}</figure>`;
  const email = about.email ? `<li><a href="mailto:${esc(about.email)}">${esc(about.email)}</a></li>` : "";
  const li = about.linkedin ? `<li><a href="${esc(about.linkedin)}">LinkedIn <span aria-hidden="true">↗</span></a></li>` : "";
  const others = (about.other_links || []).map((l) => `<li><a href="${esc(l.url)}">${esc(l.label)} <span aria-hidden="true">↗</span></a></li>`).join("");
  const resume = about.resume
    ? `<a class="resume" href="${url(about.resume)}" download><span>Résumé</span><small>download · pdf</small></a>`
    : `<span class="resume"><span>Résumé</span><small>coming soon</small></span>`;

  const body = `<a class="skip" href="#work">Skip to the profile</a>
${topnav("about")}
<div class="poster-wrap">
<main class="poster">
  ${staples}
  <div class="paper">
    <header class="hero about-hero">
      <h1 class="hi" aria-label="${esc(about.title)}"><span>${esc(String(about.title).toUpperCase())}</span></h1>
      ${about.badge ? `<span class="badge">${esc(about.badge)}</span>` : ""}
      <p class="idea"><span>${esc(about.line)}</span></p>
      <p class="sub">${lines(about.sub)}</p>
    </header>
    <div id="work">
      <div class="about-top section">
        <div class="bio">
          <h2>${esc(about.bio_heading)}</h2>
          ${paras}
        </div>
        ${about.portrait ? `<figure class="portrait snap s1">${pic({ image: about.portrait, alt: about.portrait_alt || "Portrait of Chloe", label: "Portrait", shape: "tall" })}</figure>` : ""}
      </div>
      ${photos.length ? `<div class="pics">${photos.map(photoFig).join("")}</div>` : ""}

      <section id="contact" class="contact" aria-labelledby="h-contact">
        <p class="cap" id="h-contact">Contact</p>
        <h2 class="say" aria-label="Say hello."><span>SAY</span><span>HELLO.</span></h2>
        <ul class="contact-links">${email}${li}${others}</ul>
        ${resume}
      </section>
    </div>
  </div>
  ${tabsRow("about")}
</main>
</div>
${foot}`;
  return shell({ title: `About me | ${home.first_name} ${home.last_name}`, description: `About ${home.first_name} ${home.last_name}.`, body, cls: "inner" });
}

// ---------- write ----------
const write = (rel, data) => {
  const p = path.join(dist, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data);
};
write("index.html", homePage());
campaigns.forEach((c, i) => write(`${c.slug}/index.html`, campaignPage(c, i)));
write("about/index.html", aboutPage());
write("404.html", shell({ title: "Page not found", description: "", cls: "inner", body: `<main style="padding:4rem 8%;color:#fff"><h1 style="font:400 clamp(4rem,12vw,9rem) 'Archivo Black',sans-serif;margin:0">LOST.</h1><p style="font-size:1.4rem"><a href="/" style="text-decoration:underline">Back to the cover</a></p></main>` }));

const copyDir = (from, to) => {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true });
};
copyDir(path.join(root, "src/uploads"), path.join(dist, "uploads"));
copyDir(path.join(root, "src/optimized"), path.join(dist, "optimized"));
copyDir(path.join(root, "src/scene"), path.join(dist, "scene"));
copyDir(path.join(root, "admin"), path.join(dist, "admin"));
write("_headers", "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n");
console.log("Built", 2 + campaigns.length, "pages into dist/");
