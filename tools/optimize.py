# Makes lighter web copies (webp, max 1800px wide) of every picture in src/uploads into src/optimized.
# Originals are never touched. Run:  python3 tools/optimize.py
import os, sys
from PIL import Image
src, dst = "src/uploads", "src/optimized"
os.makedirs(dst, exist_ok=True)
for f in sorted(os.listdir(src)):
    n, ext = os.path.splitext(f)
    if ext.lower() not in (".png", ".jpg", ".jpeg"): continue
    out = os.path.join(dst, n + ".webp")
    if os.path.exists(out): continue
    im = Image.open(os.path.join(src, f))
    try:
        from PIL import ImageOps; im = ImageOps.exif_transpose(im)
    except Exception: pass
    if im.width > 1800: im = im.resize((1800, round(im.height * 1800 / im.width)), Image.LANCZOS)
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
    im.save(out, "WEBP", quality=82, method=6)
    print(f, os.path.getsize(os.path.join(src, f)) // 1024, "KB ->", os.path.getsize(out) // 1024, "KB")
