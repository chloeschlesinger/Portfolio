// Builds the site from /content and /src into /dist.  Run: node build.mjs
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
  "https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&family=Bagel+Fat+One&family=Instrument+Serif:ital@0;1&family=Special+Elite&display=swap";

const ACCENTS = {
  orange: { a: "#E4824F", d: "#E4824F" },
  olive: { a: "#9BA544", d: "#7C8729" },
  pink: { a: "#EA94A8", d: "#D06683" },
  brown: { a: "#5A3F30", d: "#3A281F" },
  butter: { a: "#F2E3B5", d: "#CDB872" },
};

// ---------- content ----------
const home = json("content/home.json");
const about = json("content/about.json");
const campaigns = fs
  .readdirSync(path.join(root, "content/campaigns"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ slug: f.replace(/\.json$/, ""), ...json("content/campaigns/" + f) }))
  .sort((a, b) => (a.order || 99) - (b.order || 99));

// ---------- shared pieces ----------
const SVG_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <filter id="wobble" x="-5%" y="-10%" width="110%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" seed="4" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="fuzz" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2" result="f"/>
    <feDisplacementMap in="SourceGraphic" in2="f" scale="3.5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>`;

const EXTRA_CSS = `
/* added for the editable site */
.ph{cursor:default}
.ph:hover{background:rgba(58,40,31,.07)}
.hero h1 [data-split]{display:block}
.photo .pic.has-img::before,.photo .pic.has-img::after{display:none}
.photo .pic img{display:block;width:100%;height:100%;object-fit:cover}
.hero > svg.scribble{position:absolute}
.resume.empty{opacity:.85}
.contact .ph-text{font-family:var(--font-type);font-size:clamp(.95rem,1.6vw,1.3rem);opacity:.7}
.art video{display:block;width:100%;height:auto}
`;

function tabs(current) {
  const items = [
    { href: "/", label: "Home", key: "home" },
    ...campaigns.map((c) => ({ href: `/${c.slug}/`, label: c.tab_label || c.title.replace(/\n/g, " "), key: c.slug })),
    { href: "/about/", label: "About me", key: "about" },
    { href: "/about/#contact", label: "Contact", key: "contact" },
  ];
  return `<nav class="tabs" aria-label="Main">
    ${items
      .map((i) => `<a href="${i.href}"${i.key === current ? ' aria-current="page"' : ""}>${esc(i.label)}</a>`)
      .join("\n    ")}
  </nav>
  <div class="tabline"></div>`;
}

function shell({ title, description, css, body, js }) {
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
<style>${css}${EXTRA_CSS}</style>
</head>
<body>
${body}
<script>${js}</script>
</body>
</html>
`;
}

const isVideo = (p) => /\.(mp4|webm|mov)$/i.test(p || "");

// an image slot: your uploaded image, or a clearly labeled placeholder
function slot({ image, alt, label, shape, note }) {
  const ratio = { wide: "3/2", tall: "3/4", square: "1/1", large: "3/4", strip: "2/3", landscape: "4/3" }[shape] || "3/2";
  if (image) {
    return isVideo(image)
      ? `<video src="${url(image)}" controls playsinline preload="metadata" aria-label="${esc(alt || label)}"></video>`
      : `<img src="${url(image)}" alt="${esc(alt || label)}" loading="lazy">`;
  }
  return `<div class="ph" role="img" aria-label="Placeholder for ${esc(label)}" style="--r:${ratio}"><span><b>${esc(label)}</b>${esc(note || "placeholder: upload this in the dashboard")}</span></div>`;
}

// ---------- HOME ----------
function homePage() {
  const photo = home.photo
    ? `<div class="pic has-img"><img src="${url(home.photo)}" alt="${esc(home.photo_alt || "Photo of Chloe")}"></div>`
    : `<div class="pic"></div>`;
  const caption = home.photo ? (home.photo_caption_live ? `<figcaption>${esc(home.photo_caption_live)}</figcaption>` : "") : `<figcaption>${esc(home.photo_caption || "")}</figcaption>`;
  const body = `<a class="skip" href="#cover">Skip to cover</a>
${SVG_DEFS}
<header>
  ${tabs("home")}
</header>

<main id="cover" class="stage">

  <div class="layer torn sheet-pink" data-depth="6" data-torn="1"><div class="fill"></div></div>
  <div class="layer felt felt-strip" data-depth="12"><span>${esc(home.felt_label)}</span></div>

  <h1 class="name layer" data-depth="-4" aria-label="${esc(home.first_name)} ${esc(home.last_name)}">
    <span class="line" data-split>${esc(home.first_name)}</span>
    <span class="line" data-split>${esc(home.last_name)}</span>
  </h1>

  <div class="role-wrap layer" data-depth="-8">
    <p class="role">${esc(home.role)}</p>
    <svg class="scribble role-ring" viewBox="0 0 520 156" aria-hidden="true">
      <path pathLength="1" d="M20 83 C8 22 170 8 300 13 C450 18 512 57 462 103 C405 147 130 151 56 116 C18 98 34 44 130 24 C200 11 280 9 340 15"/>
    </svg>
  </div>

  <figure class="layer torn photo" data-depth="16" data-torn="4" style="margin:0">
    <div class="fill">${photo}</div>
    ${caption}
  </figure>

  <div class="layer sticker" data-depth="18" role="img" aria-label="Felt patch: ${esc(home.patch_text.replace(/\n/g, " "))}">
    <div class="felt patch-disc"></div>
    <span class="patch-text">${lines(home.patch_text)}</span>
  </div>

  <svg class="scribble s-spiral" viewBox="0 0 100 100" aria-hidden="true"><path id="spiral" pathLength="1" d=""/></svg>
  <svg class="scribble s-star" viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="M50 6 L62 38 L96 40 L69 61 L79 94 L50 74 L21 94 L31 61 L4 40 L38 38 Z"/></svg>

  <div class="enter layer" data-depth="8">
    <a href="/${campaigns[0] ? campaigns[0].slug + "/" : "about/"}">${esc(home.enter_text)}</a>
  </div>
  <svg class="scribble s-squig" viewBox="0 0 120 14" aria-hidden="true"><path pathLength="1" d="M2 8 q8 -8 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0"/></svg>

  <div class="ticker" aria-label="Info bar">
    <span>${esc(home.first_name)} ${esc(home.last_name)}</span>
    <span>${esc(home.role)}</span>
    <span id="when"></span>
  </div>
</main>`;
  return shell({
    title: `${home.first_name} ${home.last_name}, ${home.role}`,
    description: `Portfolio of ${home.first_name} ${home.last_name}, ${home.role}.`,
    css: rd("src/css/home.css"),
    body,
    js: rd("src/js/home.js"),
  });
}

// ---------- CAMPAIGN ----------
const POSTER_CLASSES = { mix: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"], tall: ["q1", "q2", "q3", "q4", "q5", "q6"] };
const ACT_CLASSES = { mix: ["a1", "a2", "a3", "a4", "a5"], tall: ["a1", "a2"] };

function campaignPage(c, idx) {
  const hidden = new Set(c.hidden_sections || []);
  const layout = c.layout === "tall" ? "tall" : "mix";
  const acc = ACCENTS[c.accent] || ACCENTS.orange;
  const titleText = c.title.replace(/\n/g, " ");
  const h1 = c.title
    .split("\n")
    .map((t) => `<span data-split>${esc(t)}</span>`)
    .join("");
  const next = campaigns[idx + 1];
  const pc = POSTER_CLASSES[layout];
  const ac = ACT_CLASSES[layout];

  const posters = (c.posters || [])
    .map(
      (p, i) =>
        `<figure class="art ${pc[i % pc.length]}">${slot({ image: p.image, alt: p.alt, label: `Poster ${i + 1}`, shape: p.shape })}</figure>`
    )
    .join("\n      ");
  const acts = (c.activations || [])
    .map(
      (a, i) =>
        `<figure class="art ${ac[i % ac.length]}">${slot({ image: a.image, alt: a.alt, label: a.caption || `Activation ${i + 1}`, shape: a.shape })}${a.caption ? `<figcaption>${esc(a.caption)}</figcaption>` : ""}</figure>`
    )
    .join("\n      ");

  const sections = [];
  if (!hidden.has("concept_board"))
    sections.push(`<section class="section board" aria-labelledby="h-board">
    <h2 id="h-board" data-uline>Concept board</h2>
    <figure class="art">${slot({ image: c.concept_board, alt: `${titleText} concept board`, label: "Concept board", shape: "wide", note: "placeholder: your concept board image (challenge, insight, idea inside)" })}</figure>
  </section>`);
  if (!hidden.has("posters") && (c.posters || []).length)
    sections.push(`<section class="section" aria-labelledby="h-posters">
    <h2 id="h-posters" data-uline>Posters</h2>
    <div class="posters">
      ${posters}
    </div>
  </section>`);
  if (!hidden.has("billboard"))
    sections.push(`<section class="section" aria-labelledby="h-billboard">
    <h2 id="h-billboard" data-uline>Billboard</h2>
    <figure class="art">${slot({ image: c.billboard, alt: `${titleText} billboard`, label: "Billboard", shape: "wide", note: "placeholder: your billboard image" })}</figure>
  </section>`);
  if (!hidden.has("activations") && (c.activations || []).length)
    sections.push(`<section class="section" aria-labelledby="h-act">
    <h2 id="h-act" data-uline>Activation + stunt</h2>
    <div class="act">
      ${acts}
    </div>
  </section>`);

  const nextLink = next
    ? `<a href="/${next.slug}/">${esc(next.tab_label || next.title.replace(/\n/g, " "))} <span aria-hidden="true">&rarr;</span></a>`
    : `<a href="/about/">About me <span aria-hidden="true">&rarr;</span></a>`;

  const body = `<a class="skip" href="#work">Skip to the work</a>
${SVG_DEFS}
<header>
  ${tabs(c.slug)}
</header>

<section class="hero" aria-labelledby="title">
  <div class="hero-sheet" data-torn="${idx + 5}"></div>
  <h1 id="title" aria-label="${esc(titleText)}">${h1}</h1>
  ${c.badge ? `<p class="c100">${esc(c.badge)}</p>` : ""}
  <p class="line">${esc(c.line)}</p>
  <p class="sub">${esc(c.sub)}</p>
  <svg class="scribble s-star" viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="M50 6 L62 38 L96 40 L69 61 L79 94 L50 74 L21 94 L31 61 L4 40 L38 38 Z"/></svg>
  <svg class="scribble s-sq" viewBox="0 0 120 14" aria-hidden="true"><path pathLength="1" d="M2 8 q8 -8 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0"/></svg>
</section>

<main id="work">

  ${sections.join("\n\n  ")}

</main>

<nav class="next" aria-label="Next page">
  <small>Next up</small>
  ${nextLink}
</nav>

<div class="ticker" aria-label="Info bar">
  <span>${esc(home.first_name)} ${esc(home.last_name)}</span>
  <span>${esc(home.role)}</span>
  <span>${esc(c.tab_label || titleText)}</span>
</div>`;

  const css =
    rd(layout === "tall" ? "src/css/strip.css" : "src/css/godox.css") +
    `\n:root{--accent:${acc.a}}\n.uline{stroke:${acc.d}}\n` +
    ((c.accent === "pink" || c.accent === "butter") ? `.next a:hover span,.next a:focus-visible span{color:var(--orange)}\n` : "");
  return shell({
    title: `${titleText} | ${home.first_name} ${home.last_name}`,
    description: `${titleText}: ${c.line}`,
    css,
    body,
    js: rd(layout === "tall" ? "src/js/strip.js" : "src/js/godox.js"),
  });
}

// ---------- ABOUT ----------
const SCRAPS = ["var(--olive)", "var(--butter)", "var(--accent)", "#E4824F"];
const EXPOS = ["e1", "e2", "e3", "e4"];

function aboutPage() {
  const paras = about.bio
    .split(/\n\s*\n/)
    .map((p) => `<p class="lede">${esc(p.trim())}</p>`)
    .join("\n        ");
  const photos = (about.photos || [])
    .map(
      (p, i) =>
        `<figure class="art ${EXPOS[i % 4]} scrap" style="--sc:${SCRAPS[i % 4]}">${slot({ image: p.image, alt: p.alt, label: `Photo ${i + 1}`, shape: "tall", note: "placeholder: add a photo in the dashboard" })}</figure>`
    )
    .join("\n      ");

  const row = (k, val, href, ph) =>
    `<li><span class="k">${k}</span>${val ? `<a href="${esc(href)}">${esc(val)}</a>` : `<span class="ph-text">${ph}</span>`}</li>`;
  const others = (about.other_links || [])
    .map((l) => `<li><span class="k">${esc(l.label)}</span><a href="${esc(l.url)}">${esc(l.url.replace(/^https?:\/\/(www\.)?/, ""))}</a></li>`)
    .join("\n      ");
  const resume = about.resume
    ? `<a class="resume" href="${url(about.resume)}" download><span class="felt resume-bg"></span><span class="resume-text">Download résumé</span></a>`
    : `<span class="resume empty"><span class="felt resume-bg"></span><span class="resume-text">Résumé coming soon</span></span>`;

  const body = `<a class="skip" href="#work">Skip to the profile</a>
${SVG_DEFS}
<header>
  ${tabs("about").replace('href="/about/#contact"', 'href="#contact" data-jump')}
</header>

<section class="hero" aria-labelledby="title">
  <div class="hero-sheet" data-torn="9"></div>
  <h1 id="title"><span data-split>${esc(about.title)}</span></h1>
  ${about.badge ? `<p class="c100">${esc(about.badge)}</p>` : ""}
  <p class="line">${esc(about.line)}</p>
  <p class="sub">${lines(about.sub)}</p>
  <svg class="scribble s-star" viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="M50 6 L62 38 L96 40 L69 61 L79 94 L50 74 L21 94 L31 61 L4 40 L38 38 Z"/></svg>
  <svg class="scribble s-sq" viewBox="0 0 120 14" aria-hidden="true"><path pathLength="1" d="M2 8 q8 -8 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0"/></svg>
</section>

<main id="work">

  <section class="section" aria-labelledby="h-profile">
    <div class="profile-grid">
      <figure class="art portrait scrap" style="--sc:var(--pink)">${slot({ image: about.portrait, alt: about.portrait_alt, label: "Portrait", shape: "tall", note: "placeholder: your photo" })}</figure>

      <div class="bio">
        <h2 id="h-profile" data-uline>${esc(about.bio_heading)}</h2>
        ${paras}
      </div>
    </div>
  </section>

  <section class="section" aria-label="Photos">
    <div class="ex">
      ${photos}
    </div>
  </section>

  <section class="section" id="contact" aria-labelledby="h-contact">
    <h2 id="h-contact" data-uline>Contact</h2>
    <ul class="contact">
      ${row("Email", about.email, "mailto:" + about.email, "[placeholder: your email]")}
      ${row("LinkedIn", about.linkedin, about.linkedin, "[placeholder: your LinkedIn link]")}
      ${others}
    </ul>
    ${resume}
  </section>

</main>

<nav class="next" aria-label="Back to the cover">
  <a href="/">Back to the cover <span aria-hidden="true">&rarr;</span></a>
</nav>

<div class="ticker" aria-label="Info bar">
  <span>${esc(home.first_name)} ${esc(home.last_name)}</span>
  <span>${esc(home.role)}</span>
  <span>About me</span>
</div>`;
  return shell({
    title: `About me | ${home.first_name} ${home.last_name}`,
    description: `About ${home.first_name} ${home.last_name}.`,
    css: rd("src/css/about.css"),
    body,
    js: rd("src/js/about.js"),
  });
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
write("404.html", shell({ title: "Page not found", description: "", css: rd("src/css/about.css"), body: `<main style="padding:4rem 8%"><h1 style="font-family:var(--font-marker);font-size:clamp(4rem,12vw,9rem);margin:0">Lost.</h1><p style="font-size:1.4rem"><a href="/">Back to the cover</a></p></main>`, js: "" }));

// uploads + dashboard
const copyDir = (from, to) => {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true });
};
copyDir(path.join(root, "src/uploads"), path.join(dist, "uploads"));
copyDir(path.join(root, "admin"), path.join(dist, "admin"));
write("_headers", "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n");
console.log("Built", 2 + campaigns.length, "pages into dist/");
