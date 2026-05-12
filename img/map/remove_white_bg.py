"""
v1.14.3.83 — Stitch RGB sprite'lardan beyaz arka plani sil, RGBA yap.

Stitch PNG'leri alpha channel'siz cikariyor — beyaz BG sprite'in haritaya
yapismasini bozuyor. Bu script:
  1. PNG'yi RGBA'ya cevirir
  2. Threshold uzeri beyaz pikselleri (R+G+B > 720) tamamen transparent yapar
  3. Kenarlardaki acik gri pikselleri kismi transparent yapar (yumusak gecis)
  4. Sonucu .png olarak ustune yazar

Kullanim: python remove_white_bg.py
"""
from PIL import Image
import os, glob

# Threshold: piksel toplami bu degerin uzerinde ise beyaz say
WHITE_HARD = 720   # R+G+B >= 720 (240,240,240) -> tamamen transparent
WHITE_SOFT = 660   # R+G+B >= 660 (220,220,220) -> kismi alpha (gecis kenar)

def remove_white(path):
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    transparent_count = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            s = r + g + b
            if s >= WHITE_HARD:
                pixels[x, y] = (r, g, b, 0)
                transparent_count += 1
            elif s >= WHITE_SOFT:
                # Lineer 660-720 arasi alpha 0-255
                alpha = int((WHITE_HARD - s) / (WHITE_HARD - WHITE_SOFT) * 255)
                pixels[x, y] = (r, g, b, alpha)
    img.save(path, "PNG", optimize=True)
    pct = transparent_count * 100 / (w * h)
    print(f"  {os.path.basename(path):40s} -> {pct:5.1f}% pixel transparent")

def process_folder(folder):
    pngs = sorted(glob.glob(os.path.join(folder, "*.png")))
    if not pngs:
        return
    print(f"\n=== {folder} ===")
    for p in pngs:
        remove_white(p)

base = os.path.dirname(os.path.abspath(__file__))
for sub in ("castles", "colonies"):
    process_folder(os.path.join(base, sub))

print("\nTamam.")
