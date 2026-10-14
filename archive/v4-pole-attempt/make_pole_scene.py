"""Builds the Version 4 street scene: a weathered wooden utility pole in focus, a softly blurred NYC block behind it.

This is a procedural STAND-IN. To use a real photograph instead, save it as src/scene/pole.webp (and pole-m.webp for phones)
and set the two --pole-x / --pole-w values at the top of the HOME section in src/site.css to where the pole sits in your photo.

Run:  python3 tools/make_pole_scene.py
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter, zoom
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "src", "scene")


def fbm(h, w, cells_y, cells_x, rng, octaves=4, persistence=0.5):
    """smooth noise in 0..1, cells_y x cells_x lattice for the first octave"""
    total = np.zeros((h, w), np.float32)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        cy, cx = max(2, cells_y * 2 ** o), max(2, cells_x * 2 ** o)
        g = rng.random((cy, cx)).astype(np.float32)
        total += amp * zoom(g, (h / cy, w / cx), order=3)[:h, :w]
        norm += amp
        amp *= persistence
    total /= norm
    return np.clip((total - total.min()) / (total.max() - total.min() + 1e-6), 0, 1)


def lerp(a, b, t):
    return a + (b - a) * t


def street(W, H, rng):
    """flat-colour NYC block (brick + stone facades, fire escape, awnings, a cab) - blurred hard afterwards"""
    img = Image.new("RGB", (W, H), (226, 222, 214))
    d = ImageDraw.Draw(img)
    # sky glow in the gap between buildings
    sky = np.zeros((H, W, 3), np.float32)
    ys = np.linspace(0, 1, H)[:, None]
    sky[..., 0] = lerp(206, 244, ys); sky[..., 1] = lerp(222, 232, ys); sky[..., 2] = lerp(238, 214, ys)
    img = Image.fromarray(sky.astype("uint8"))
    d = ImageDraw.Draw(img)
    ground = int(H * 0.72)

    # far buildings (hazy, light)
    x = int(W * 0.30)
    for _ in range(7):
        bw = int(W * rng.uniform(0.05, 0.1)); bh = int(H * rng.uniform(0.3, 0.55))
        col = tuple(int(c) for c in (rng.choice([196, 206, 186]), rng.choice([180, 188, 176]), rng.choice([170, 178, 168])))
        d.rectangle([x, ground - bh, x + bw, ground], fill=col)
        x += bw - int(W * 0.005)

    def facade(x0, x1, top, base, wallcol, wincol, rows, cols, trim):
        d.rectangle([x0, top, x1, base], fill=wallcol)
        d.rectangle([x0, top, x1, top + int(H * 0.025)], fill=trim)  # cornice
        wx = (x1 - x0) / cols; wy = (base - top) * 0.78 / rows
        for r in range(rows):
            for c in range(cols):
                ww, wh = wx * 0.5, wy * 0.62
                xx = x0 + wx * (c + 0.25); yy = top + int(H * 0.05) + wy * r
                lit = rng.random() < 0.18
                d.rectangle([xx, yy, xx + ww, yy + wh], fill=(236, 196, 120) if lit else wincol)
                d.rectangle([xx - 4, yy + wh, xx + ww + 4, yy + wh + 6], fill=trim)

    # left: red-brown brick with a fire escape
    facade(-20, int(W * 0.39), int(H * 0.02), ground, (152, 84, 64), (58, 66, 80), 6, 4, (196, 170, 140))
    fx0, fx1 = int(W * 0.08), int(W * 0.30)
    for k in range(5):
        yt = int(H * (0.14 + 0.115 * k)); yb = yt + int(H * 0.115)
        d.line([fx0, yt, fx1, yt], fill=(34, 34, 38), width=int(H * 0.007))
        d.line([fx0, yt, fx1, yb], fill=(34, 34, 38), width=int(H * 0.005))
        for px in range(fx0, fx1, int((fx1 - fx0) / 8)):
            d.line([px, yt, px, yt + int(H * 0.04)], fill=(34, 34, 38), width=3)
    # right: pale sandstone with deep cornice
    facade(int(W * 0.61), W + 20, int(H * 0.0), ground, (196, 164, 122), (64, 62, 70), 6, 4, (226, 208, 178))
    # street-level shopfronts
    d.rectangle([-20, ground - int(H * 0.17), int(W * 0.39), ground], fill=(46, 62, 50))     # green storefront
    d.rectangle([-20, ground - int(H * 0.17), int(W * 0.39), ground - int(H * 0.145)], fill=(30, 44, 36))
    d.rectangle([int(W * 0.06), ground - int(H * 0.12), int(W * 0.33), ground - int(H * 0.01)], fill=(232, 196, 130))
    d.rectangle([int(W * 0.61), ground - int(H * 0.17), W + 20, ground], fill=(72, 52, 44))
    d.rectangle([int(W * 0.66), ground - int(H * 0.12), int(W * 0.95), ground - int(H * 0.01)], fill=(222, 188, 140))
    # a yellow cab down the street, small and soft
    cx, cy = int(W * 0.46), ground - int(H * 0.035)
    d.rounded_rectangle([cx, cy - int(H * 0.045), cx + int(W * 0.1), cy + int(H * 0.02)], radius=18, fill=(232, 178, 30))
    d.rectangle([cx + int(W * 0.015), cy - int(H * 0.07), cx + int(W * 0.08), cy - int(H * 0.04)], fill=(214, 160, 26))
    # sidewalk + curb + road
    d.rectangle([-20, ground, W + 20, H], fill=(160, 152, 140))
    d.rectangle([-20, ground, W + 20, ground + int(H * 0.012)], fill=(120, 114, 106))
    d.polygon([(int(W * 0.36), ground + int(H * 0.012)), (int(W * 0.66), ground + int(H * 0.012)), (int(W * 0.8), H), (int(W * 0.2), H)], fill=(112, 112, 116))
    arr = np.asarray(img).astype(np.float32)
    # warm low sun from the upper right
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    sun = np.clip(1 - np.hypot((xx - W * 0.86) / (W * 0.8), (yy - H * 0.05) / (H * 0.9)), 0, 1)
    arr *= (0.86 + 0.28 * sun)[..., None]
    arr[..., 0] *= 1.0 + 0.06 * sun; arr[..., 2] *= 1.0 - 0.08 * sun
    img = Image.fromarray(np.clip(arr, 0, 255).astype("uint8"))
    return img.filter(ImageFilter.GaussianBlur(W * 0.0125))


def paper_bit(d, pts, base, rng, shade=0.0):
    """ragged little scrap of old paper"""
    d.polygon(pts, fill=base)


def pole_layer(W, H, px, pw, rng):
    """returns RGBA image the size of the frame with the pole drawn in it"""
    x0, x1 = int(px - pw / 2), int(px + pw / 2)
    cw = x1 - x0
    # wood: stretched fbm + fine grain lines
    low = fbm(H, cw, 5, 3, rng, 3, 0.55)
    long = fbm(H, cw, 2, 40, rng, 3, 0.6)
    fine = fbm(H, cw, 2, 330, rng, 2, 0.55)
    drift = gaussian_filter(rng.random((H // 8 + 1, 1)).astype(np.float32), 3)
    drift = zoom(drift, (H / drift.shape[0], 1), order=3)[:H]
    v = 0.38 * long + 0.42 * fine + 0.20 * low
    v = np.clip(v, 0, 1)
    v = (v - v.min()) / (v.max() - v.min())
    dark, mid, light = np.array([46, 36, 28]), np.array([108, 88, 66]), np.array([164, 150, 130])
    t = v[..., None]
    col = np.where(t < 0.5, dark + (mid - dark) * (t / 0.5), mid + (light - mid) * ((t - 0.5) / 0.5)).astype(np.float32)
    silver = fbm(H, cw, 4, 2, rng, 3)[..., None]  # weathered silvery patches
    col = lerp(col, np.array([142, 134, 122], np.float32), np.clip((silver - 0.55) * 1.5, 0, 0.55))
    # cracks
    crk = Image.new("L", (cw, H), 0); cd = ImageDraw.Draw(crk)
    for _ in range(9):
        cx = rng.uniform(0.1, 0.9) * cw; cy = rng.uniform(0, H); L = rng.uniform(0.08, 0.3) * H
        pts = []
        for s in range(14):
            pts.append((cx + rng.normal(0, 3) + s * rng.normal(0, 0.8), cy + s * L / 14))
        cd.line(pts, fill=255, width=int(rng.uniform(2, 4)))
    crk = np.asarray(crk.filter(ImageFilter.GaussianBlur(1.1))).astype(np.float32)[..., None] / 255
    col *= 1 - 0.78 * crk
    hi = np.roll(crk, 3, axis=1)
    col += 26 * np.clip(hi - crk, 0, 1)
    # knots
    for _ in range(2):
        kx = rng.uniform(0.25, 0.75) * cw; ky = rng.uniform(0.15, 0.85) * H
        yy, xx = np.mgrid[0:H, 0:cw].astype(np.float32)
        r = np.hypot((xx - kx) / 11, (yy - ky) / 26)
        col *= 1 - 0.55 * np.exp(-r ** 2 * 1.2)[..., None]
    # cylinder shading (sun from the upper right)
    u = np.linspace(-1, 1, cw)[None, :]
    nz = np.sqrt(np.clip(1 - u ** 2, 0, 1))
    lam = np.clip(0.55 * u + 0.82 * nz, 0, 1)
    shade = 0.30 + 0.95 * lam ** 1.1
    shade = np.repeat(shade, H, axis=0)[..., None]
    col *= shade
    col[..., 0] *= 1 + 0.10 * np.clip(u, 0, 1)[0][None, :, None].repeat(H, 0)[..., 0] if False else 1
    rim = np.clip((u - 0.62) / 0.38, 0, 1) ** 2
    col += (np.array([60, 42, 20]) * rim[0][None, :, None]).astype(np.float32)

    img = Image.fromarray(np.clip(col, 0, 255).astype("uint8")).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")

    def staple_cluster(cx, cy, n, spread):
        for _ in range(n):
            sx = cx + rng.normal(0, spread); sy = cy + rng.normal(0, spread * 1.3)
            w = rng.uniform(5, 8); a = rng.choice([0, 0, 8, -6])
            col_s = (150, 150, 152, 255) if rng.random() < 0.6 else (122, 78, 52, 255)
            d.rectangle([sx, sy, sx + w, sy + 2], fill=col_s)
            d.line([sx, sy, sx + w, sy], fill=(224, 224, 226, 255), width=1)
            d.line([sx + 1, sy + 4, sx + w + 2, sy + 5], fill=(20, 12, 6, 120), width=1)
            pass

    def scrap(cx, cy, w, h, base, edge, tilt=0.0, torn="bottom"):
        """a torn remnant stuck under staples; ragged on one side"""
        n = 14
        pts = [(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2)]
        if torn == "bottom":
            pts += [(cx + w / 2 - w * i / n, cy + h / 2 - rng.uniform(0, h * 0.28)) for i in range(n + 1)]
        else:
            pts += [(cx + w / 2, cy + h / 2), (cx - w / 2, cy + h / 2)]
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
        sd.polygon([(x + 3, y + 4) for x, y in pts], fill=(10, 6, 2, 150))
        shn = sh.filter(ImageFilter.GaussianBlur(3))
        img.alpha_composite(shn)
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
        ld.polygon(pts, fill=base)
        # fibre / tear edge light line + age speckle
        for i in range(len(pts) - 1):
            ld.line([pts[i], pts[i + 1]], fill=edge, width=1)
        px_ = np.asarray(layer).astype(np.float32)
        nse = fbm(img.size[1], img.size[0], 12, 6, rng, 3)
        px_[..., :3] *= (0.9 + 0.16 * nse)[..., None]
        shade_x = np.linspace(-1, 1, img.size[0])[None, :]
        px_[..., :3] *= (1.0 - 0.0 * shade_x)[..., None]
        img.alpha_composite(Image.fromarray(np.clip(px_, 0, 255).astype("uint8")))

    return img, x0, scrap, staple_cluster, d


def build(W, H, pole_frac, seed, name):
    rng = np.random.default_rng(seed)
    bg = street(W, H, rng).convert("RGBA")
    pw = int(W * pole_frac); px = W // 2
    pole, x0, scrap, staple_cluster, d = pole_layer(W, H, px, pw, rng)
    # remnants live on the pole image (drawn onto it) near its top and bottom edges + slivers
    ox = pw  # pole local coords are 0..pw
    scrap(pw * 0.30, H * 0.045, pw * 0.34, H * 0.065, (226, 220, 204, 255), (246, 242, 230, 255), torn="bottom")
    staple_cluster(pw * 0.30, H * 0.022, 4, 5)
    scrap(pw * 0.72, H * 0.10, pw * 0.22, H * 0.04, (170, 190, 214, 255), (212, 222, 236, 255), torn="bottom")
    staple_cluster(pw * 0.72, H * 0.088, 3, 4)
    scrap(pw * 0.58, H * 0.965, pw * 0.3, H * 0.06, (232, 204, 110, 255), (248, 228, 150, 255), torn="top")
    staple_cluster(pw * 0.58, H * 0.945, 5, 6)
    staple_cluster(pw * 0.09, H * 0.5, 7, 6); staple_cluster(pw * 0.92, H * 0.62, 6, 5); staple_cluster(pw * 0.12, H * 0.83, 5, 5)
    # aluminium utility tag high on the pole
    d.rectangle([pw * 0.46, H * 0.19, pw * 0.46 + 34, H * 0.19 + 20], fill=(176, 178, 182, 255), outline=(70, 70, 72, 255))
    for k in range(3): d.line([pw * 0.46 + 5, H * 0.19 + 5 + k * 5, pw * 0.46 + 28, H * 0.19 + 5 + k * 5], fill=(80, 80, 84, 255), width=1)
    d.ellipse([pw * 0.46 + 14, H * 0.19 - 5, pw * 0.46 + 20, H * 0.19 + 1], fill=(110, 110, 114, 255))
    pole = pole  # drawn in place
    # soft edge so the pole sits in the air instead of cut-out
    pole = pole.filter(ImageFilter.GaussianBlur(0.7))
    # ambient shadow behind pole
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rectangle([x0 - 4, 0, x0 + pw + 12, H], fill=(14, 8, 2, 120))
    bg.alpha_composite(sh.filter(ImageFilter.GaussianBlur(26)))
    bg.alpha_composite(pole, (x0, 0))
    arr = np.asarray(bg.convert("RGB")).astype(np.float32)
    # vignette + warm grade + grain
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    vig = 1 - 0.38 * np.clip(np.hypot((xx - W / 2) / (W * 0.75), (yy - H / 2) / (H * 0.8)) - 0.35, 0, 1) ** 1.4
    arr *= vig[..., None]
    arr[..., 0] *= 1.03; arr[..., 2] *= 0.95
    arr += rng.normal(0, 4.2, (H, W, 1)).astype(np.float32)
    out = Image.fromarray(np.clip(arr, 0, 255).astype("uint8"))
    out.save(os.path.join(OUT, name), "WEBP", quality=80, method=6)
    print(name, out.size, os.path.getsize(os.path.join(OUT, name)) // 1024, "KB")


if __name__ == "__main__":
    build(2000, 1250, 0.36, 11, "pole.webp")
    build(1000, 1800, 0.8, 11, "pole-m.webp")
