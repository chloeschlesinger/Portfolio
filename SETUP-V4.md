# Version 4: NYC telephone pole

Branch: `v4-redesign` (Versions 1-3 live on `main`, `v2-redesign`, `v3-redesign` and are untouched).

- Homepage: a stapled, tear-off flyer on a utility pole. Tabs are the real navigation. Clicking a tab lifts it, rips it from the bottom up, lets it fall, leaves the torn strip on the flyer, and the next page unfolds like a poster over the street.
- Campaign / About pages: clean editorial posters. All text and images come from `content/` (unchanged from Version 3).
- Fonts (Google Fonts): Permanent Marker, Archivo Black, Archivo, Archivo Narrow, Reenie Beanie.
- Background: `src/scene/pole.webp` (desktop) and `pole-m.webp` (phones). These are generated stand-ins from `tools/make_pole_scene.py`.
  **To use a real photograph:** save it over those two files (keep the names). Keep the pole centered. If its width differs, change `.36` (desktop) and `.8` (phone) in the `--pole` lines of `src/site.css`.
- Run locally: `node build.mjs`, then serve `dist/` (for example `cd dist && python3 -m http.server 8000`).
