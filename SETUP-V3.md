# Version 3 (branch `v3-redesign`) — fall tree design
Built from version 2. Adds: tear-off rip + strip-becomes-header transition, paper texture, lighter web copies of images
(`src/optimized`, made by `tools/optimize.py`; originals untouched), résumé link in the menu, bigger mobile tabs, scroll-in pictures.
Deploy as its own Netlify site from this branch. `main` (original) and `v2-redesign` are not changed.

Tree look: baked scene images live in `src/scene/` (background high/low, bark texture, leaf pile). The trunk scrolls with the page and the
background shifts from bright canopy to forest floor as you scroll. Page-open animations: flyer hangs, staples pop, letters drop, tabs drop in.
