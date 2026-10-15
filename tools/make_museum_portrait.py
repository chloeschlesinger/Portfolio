"""Rebuilds the museum photo with TALL portrait frames.
Takes the photographed room (archive/v6-photo/museum-source.png), erases the two landscape gold frames
(plaster is rebuilt row by row from the wall on either side, plus film grain), then assembles two new
portrait frames out of pieces of the original carved frame (corners, centre cartouches, side scrolls,
with the plain moulding mirror-tiled to the new length), casts a soft wall shadow and moves the brass plaques.
Run: python3 tools/make_museum_portrait.py   ->  src/scene/museum.webp  (+ prints the opening rectangles)"""
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter

SRC = "archive/v6-photo/museum-source.png"
OUT = "src/scene/museum.webp"
rng = np.random.default_rng(7)
P = Image.open(SRC).convert("RGB")
A = np.asarray(P).astype(np.float32)
H, W = A.shape[:2]

# ---- old frames (outer boxes) and plaques ----
OLD = [(379, 188, 782, 558), (910, 188, 1308, 558)]
TEMPLATE = P.crop(OLD[0])           # 403 x 370, left frame

def erase_rows(a, x0, y0, x1, y1, pad=14, feather=5):
    """rebuild plaster inside the box: every row is interpolated between wall columns just outside the box
    (smoothed), given plaster grain, and blended in through a feathered edge so no seam shows"""
    X0, X1, Y0, Y1 = x0 - pad, x1 + pad, y0 - pad, y1 + pad
    xl, xr = X0 - 3, X1 + 3
    left = gaussian_filter(a[Y0:Y1, xl - 3:xl + 3].mean(1), (5, 0))
    right = gaussian_filter(a[Y0:Y1, xr - 3:xr + 3].mean(1), (5, 0))
    t = np.linspace(0, 1, X1 - X0)[None, :, None]
    fill = left[:, None, :] * (1 - t) + right[:, None, :] * t
    fill += gaussian_filter(rng.normal(0, 2.4, fill.shape[:2]), 1.1)[:, :, None]
    m = np.zeros(fill.shape[:2], np.float32)
    m[pad - feather:-(pad - feather), pad - feather:-(pad - feather)] = 1
    m = gaussian_filter(m, feather * .8)[:, :, None]
    a[Y0:Y1, X0:X1] = a[Y0:Y1, X0:X1] * (1 - m) + fill * m

def erase_cols(a, x0, y0, x1, y1, pad=8, feather=3):
    """same idea, interpolating each column between wall rows just above and below the box"""
    X0, X1, Y0, Y1 = x0 - pad, x1 + pad, y0 - pad, y1 + pad
    yt, yb = Y0 - 3, Y1 + 3
    top = gaussian_filter(a[yt - 3:yt + 3, X0:X1].mean(0), (4, 0))
    bot = gaussian_filter(a[yb - 3:yb + 3, X0:X1].mean(0), (4, 0))
    t = np.linspace(0, 1, Y1 - Y0)[:, None, None]
    fill = top[None] * (1 - t) + bot[None] * t
    fill += gaussian_filter(rng.normal(0, 2.4, fill.shape[:2]), 1.1)[:, :, None]
    m = np.zeros(fill.shape[:2], np.float32)
    m[pad - feather:-(pad - feather), pad - feather:-(pad - feather)] = 1
    m = gaussian_filter(m, feather * .8)[:, :, None]
    a[Y0:Y1, X0:X1] = a[Y0:Y1, X0:X1] * (1 - m) + fill * m

# 1. lift plaques out, keep the patches
PLQ = [(804, 501, 842, 530), (1324, 501, 1362, 530)]
patches = [P.crop(b) for b in PLQ]
for (x0, y0, x1, y1) in PLQ:
    erase_cols(A, x0 - 2, y0 - 2, x1 + 3, y1 + 6, pad=9, feather=4)   # wall above/below is clean plaster

# 2. erase the old frames (plus their cast shadow), then the plaques (frames first, so the wall used as reference is clean)
for (x0, y0, x1, y1) in OLD:
    erase_rows(A, x0 - 14, y0 - 12, x1 + 16, y1 + 26, pad=26, feather=9)

# ---- build the new portrait frame from pieces of the template ----
FW, FH = 308, 440
BL, BR, BT, BB = 39, 35, 38, 36          # border widths of the original moulding
T = TEMPLATE
frame = Image.new("RGB", (FW, FH))
tw, th = T.size

def put(img, box_src, pos): frame.paste(img.crop(box_src), pos)

CW, CTH, CBH = 87, 82, 53                  # corner block width / heights (top, bottom)
# side strips (left uses the left border, right the right border)
def side(x_src0, x_src1, x_dst):
    w = x_src1 - x_src0
    top_end, bot_start = CTH, FH - CBH
    seg_len = bot_start - top_end             # 305
    ornament = T.crop((x_src0, 139, x_src1, 242))          # side scroll (103 px)
    p1 = T.crop((x_src0, 82, x_src1, 139))                 # plain moulding above it
    p2 = T.crop((x_src0, 242, x_src1, 317))                # plain moulding below it
    def tile(seg, n):
        out = Image.new("RGB", (w, n)); y = 0; flip = False
        while y < n:
            s = seg.transpose(Image.FLIP_TOP_BOTTOM) if flip else seg
            out.paste(s, (0, y)); y += seg.height; flip = not flip
        return out
    need = (seg_len - ornament.height) // 2
    frame.paste(tile(p1, need), (x_dst, top_end))
    frame.paste(ornament, (x_dst, top_end + need))
    frame.paste(tile(p2, seg_len - ornament.height - need), (x_dst, top_end + need + ornament.height))
side(0, 46, 0)
side(tw - 46, tw, FW - 46)
# top and bottom strips: plain - cartouche - plain
def band(y_src0, y_src1, y_dst):
    h = y_src1 - y_src0
    cart = T.crop((144, y_src0, 258, y_src1))
    gap = (FW - 2 * CW - cart.width) // 2
    plain = T.crop((CW, y_src0, CW + 57, y_src1))
    frame.paste(plain.resize((gap + 2, h)), (CW - 1, y_dst))
    frame.paste(cart, (CW + gap, y_dst))
    frame.paste(plain.transpose(Image.FLIP_LEFT_RIGHT).resize((gap + 2, h)), (CW + gap + cart.width - 1, y_dst))
band(0, BT, 0)
band(th - BB, th, FH - BB)
# corner blocks
put(T, (0, 0, CW, CTH), (0, 0))
put(T, (tw - CW, 0, tw, CTH), (FW - CW, 0))
put(T, (0, th - CBH, CW, th), (0, FH - CBH))
put(T, (tw - CW, th - CBH, tw, th), (FW - CW, FH - CBH))
# the opening is filled with a cream mat colour (the page lays the artwork over it)
inner = (BL, BT, FW - BR, FH - BB)
mat = Image.new("RGB", (inner[2] - inner[0], inner[3] - inner[1]), (233, 220, 196))
frame.paste(mat, inner[:2])
fa = np.asarray(frame).astype(np.float32)

# ---- place frames: same centres as the old ones, top edge a little higher so they feel bigger ----
FY = 138
centres = [(379 + 782) / 2, (910 + 1308) / 2]
canvas = Image.fromarray(np.clip(A, 0, 255).astype(np.uint8))
res = []
for cx in centres:
    fx = int(round(cx - FW / 2))
    # soft shadow on the plaster: light comes from above, so the shadow falls down and a little to the right
    sh = Image.new("L", (W, H), 0)
    sh.paste(255, (fx + 4, FY + 8, fx + FW + 6, FY + FH + 12))
    sh = sh.filter(ImageFilter.GaussianBlur(9))
    shade = Image.new("RGB", (W, H), (45, 26, 8))
    canvas = Image.composite(shade, canvas, sh.point(lambda v: int(v * .42)))
    canvas.paste(frame, (fx, FY))
    res.append(dict(x=fx, y=FY, w=FW, h=FH, ix=fx + BL, iy=FY + BT, iw=FW - BL - BR, ih=FH - BT - BB))
# ---- plaques follow their frames, a little lower so they sit beside the lower third ----
for patch, r in zip(patches, res):
    px = r["x"] + FW + 20; py = FY + FH - 70
    m = Image.new("L", patch.size, 0); m.paste(255, (2, 2, patch.width - 2, patch.height - 2)); m = m.filter(ImageFilter.GaussianBlur(1.2))
    canvas.paste(patch, (px, py), m)
canvas.save(OUT, quality=86, method=6)
print(res)
