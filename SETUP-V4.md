# Version 4: graphic NYC street-poster editorial

Branch: `v4-redesign` (Versions 1-3 live on `main`, `v2-redesign`, `v3-redesign` and are untouched).

- Palette: black, cream, cobalt blue, red, with a little yellow. Fonts (Google Fonts): Archivo Black, Archivo, Archivo Narrow, Permanent Marker, Reenie Beanie.
- Homepage: an oversized flyer pasted up on a flat cobalt wall with two paste-up layers behind it (found black paper, a yellow offcut). The tabs are the real navigation. Clicking one lifts it, rips it from the bottom up and lets it fall; the torn strip stays on the flyer and the next page unfolds like a poster.
- Campaign / About pages: restrained editorial posters. All text and images come from `content/` (unchanged from Version 3).
- An earlier photoreal telephone-pole attempt is kept in `archive/v4-pole-attempt/` (not part of the build).
- Run locally: `node build.mjs`, then serve `dist/` (for example `cd dist && python3 -m http.server 8000`).
