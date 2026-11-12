"""Transforme une photo portrait (fond clair uni) en avatar pixel art.

Usage : python3 scripts/pixel-avatar.py photo.jpg content/seed/files/avatar-pixel.png 72 32
         (taille de la grille en pixels, nombre de couleurs)
"""
import sys
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import numpy as np

src, out, N, colors = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(src).convert("RGB")
W, H = im.size

# 1. Détourage : le fond clair uni est retiré par remplissage depuis les bords.
mask_src = im.copy()
KEY = (255, 0, 255)
for seed in [(x, y) for y in range(0, H, 6) for x in (0, 3, W - 4, W - 1)] + [(x, 0) for x in range(0, W, 20)]:
    c = mask_src.getpixel(seed)
    if c != KEY and min(c) > 130 and max(c) - min(c) < 30:
        ImageDraw.floodfill(mask_src, seed, KEY, thresh=38)
m = np.array(mask_src)
alpha = ~((m[..., 0] == 255) & (m[..., 1] == 0) & (m[..., 2] == 255))
alpha_im = Image.fromarray((alpha * 255).astype("uint8")).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MinFilter(11))

# 2. Cadrage tête + épaules.
box = (70, 10, 570, 510)
im, alpha_im = im.crop(box), alpha_im.crop(box)

# 3. Préparation : contraste et saturation légèrement relevés pour survivre à la réduction.
# Les ombres sont éclaircies : cheveux et pull gardent du relief une fois réduits.
im = im.point(lambda v: int(255 * (v / 255) ** 0.72))
im = ImageEnhance.Contrast(im).enhance(1.12)
im = ImageEnhance.Color(im).enhance(1.25)
im = ImageEnhance.Sharpness(im).enhance(1.6)

# 4. Réduction à la grille de pixels, puis palette limitée (esprit 16-bit), sans tramage.
small = im.resize((N, N), Image.LANCZOS)
small = ImageEnhance.Sharpness(small).enhance(1.4)
a = np.array(alpha_im.resize((N, N), Image.BOX)) > 127
pal = small.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
px = np.array(pal).astype(int)

# Les noirs (cheveux, pull) tirent vers le bleu nuit du site pour l'harmonie de palette.
lum = px.sum(axis=2, keepdims=True) / 3
t = np.clip((95 - lum) / 95, 0, 1)            # 1 = noir profond, 0 = tons moyens et clairs
navy = np.array([30, 36, 74]) + lum * np.array([0.9, 1.0, 1.5])
px = (px * (1 - t) + navy * t).astype(int)

# Pixels clairs et ternes restés en bordure (reste de fond) : ramenés au bleu nuit.
pale = (px.min(axis=2) > 140) & ((px.max(axis=2) - px.min(axis=2)) < 45)
px[pale] = (58, 66, 118)

rgba = np.dstack([px.clip(0, 255).astype("uint8"), (a * 255).astype("uint8")])

# 5. Liseré cyan d'un pixel autour de la silhouette : la « signature » graphique.
pad = np.pad(a, 1)
neigh = pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:]
edge = neigh & ~a
rgba[edge] = (34, 211, 238, 255)

Image.fromarray(rgba, "RGBA").save(out)
