"""Cuts the three visitor photos (transparent PNG cut-outs from the user) into sprites for the museum:
each person gets a STANDING sprite and a SEATED sprite (the torso cropped at the hips, so it can sit on the photographed bench).
Edges are cleaned (specks removed, 2px erode, colour fringe replaced by interior colours, soft alpha).
Writes src/scene/people/*.webp and src/scene/people/meta.json   Run: python3 tools/make_visitors.py <dir with the 3 source PNGs>"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

U = sys.argv[1] if len(sys.argv) > 1 else "archive/v6-photo/people-source/"
OUT = "src/scene/people"
os.makedirs(OUT, exist_ok=True)
SRC1, SRC3 = "ba165f75-image.png", "4e691218-image.png"
STAND_H = 700          # standing sprites are resized to this height; seated ones use the same scale
# name: (source, box x0,y0,x1,y1 to keep, 'cut' = source row of the neck (head layer ends here), seated?)
SPR = {
    "a-stand": (SRC3, (600, 20, 950, 1000), 186),
    "a-sit":   (SRC1, (590, 225, 960, 712), 378, [(598,200),(955,200),(955,667),(933,667),(903,675),(867,693),(823,698),(690,698),(657,692),(613,675),(607,670),(590,668)]),
    "b-stand": (SRC3, (1060, 90, 1405, 1000), 262),
    "b-sit":   (SRC1, (1000, 262, 1360, 712), 392, [(1000,200),(1355,200),(1355,672),(1312,690),(1277,682),(1267,688),(1233,695),(1140,698),(1100,697),(1037,687),(1010,670),(1000,668)]),
    "c-stand": (SRC1, (100, 30, 440, 970), 196),
    # the blonde visitor has her own seated photo (blonde-seated.png): cut along her seat line, bench removed
    "c-sit":   ("blonde-seated.png", (290, 160, 900, 940), 415, [(0,0),(1145,0),(1145,880),(900,895),(870,905),(840,922),(790,928),(700,926),(680,932),(600,934),(520,932),(470,928),(450,924),(430,915),(400,902),(370,897),(335,896),(0,896)]),
}
def clean(arr):
    a = arr[:, :, 3]
    m = a > 100
    lab, n = ndi.label(m)
    if n > 1:                               # keep the biggest piece only (drops dust and bench scraps)
        sizes = ndi.sum(m, lab, range(1, n + 1)); m = lab == (1 + int(np.argmax(sizes)))
    m = ndi.binary_fill_holes(m)
    inner = ndi.binary_erosion(m, iterations=3)
    core = ndi.binary_erosion(m, iterations=2)
    # colour: interior pixels keep their colour, the edge band borrows the nearest interior colour (kills yellow/red fringes)
    idx = ndi.distance_transform_edt(~inner, return_distances=False, return_indices=True)
    rgb = arr[:, :, :3][idx[0], idx[1]]
    rgb = np.where(inner[:, :, None], arr[:, :, :3], rgb)
    alpha = ndi.gaussian_filter(core.astype(np.float32), 0.8)
    return np.dstack([rgb, (alpha * 255)]).astype(np.uint8)

meta = {}
from PIL import ImageDraw
for name, spec in SPR.items():
    src, (x0, y0, x1, y1), cut = spec[:3]
    im = np.asarray(Image.open(os.path.join(U, src)).convert("RGBA")).copy()
    if len(spec) > 3:      # seated: keep only what lies above the curve where the person meets the cushion (thighs and hips included, the bench itself excluded)
        m = Image.new("L", (im.shape[1], im.shape[0]), 0); ImageDraw.Draw(m).polygon(spec[3], fill=255)
        im[:, :, 3] = np.minimum(im[:, :, 3], np.asarray(m))
    crop = im[y0:y1, x0:x1].copy()
    out = clean(crop)
    ys, xs = np.where(out[:, :, 3] > 20)
    bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    out = out[by0:by1, bx0:bx1]
    cut_rel = cut - y0 - by0
    img = Image.fromarray(out, "RGBA")
    # every sprite shares one scale: resize by the standing person's height so seated/standing stay consistent
    person = name[0]
    meta.setdefault(person, {})[name.split("-")[1]] = dict(w=img.width, h=img.height, cut=cut_rel)
    meta[person]["_src"] = meta[person].get("_src", {}); meta[person]["_src"][name.split("-")[1]] = (img, name)
# scale: standing height -> STAND_H for each person, applied to both of that person's sprites
final = {}
for p, d in meta.items():
    s = STAND_H / d["stand"]["h"]
    final[p] = {}
    for kind in ("stand", "sit"):
        img, name = d["_src"][kind]
        k = 0.62 if name == "c-sit" else 1.0
        im2 = img.resize((round(img.width * s * k), round(img.height * s * k)), Image.LANCZOS)
        im2.save(f"{OUT}/{name}.webp", quality=90, method=6)
        final[p][kind] = dict(file=f"/scene/people/{name}.webp", w=im2.width, h=im2.height, cut=round(d[kind]["cut"] * s * k))
json.dump(final, open(f"{OUT}/meta.json", "w"), indent=1)
print(json.dumps(final, indent=1)); print({f: os.path.getsize(f"{OUT}/{f}") // 1024 for f in os.listdir(OUT)})
