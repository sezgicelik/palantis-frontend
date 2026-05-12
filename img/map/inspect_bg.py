"""Her sprite'in 4 köşe pikselini oku — BG rengi tespit"""
from PIL import Image
import glob, os
base = os.path.dirname(os.path.abspath(__file__))
for sub in ("castles", "colonies"):
    print(f"\n=== {sub} ===")
    for p in sorted(glob.glob(os.path.join(base, sub, "*.png"))):
        img = Image.open(p).convert("RGBA")
        w, h = img.size
        corners = [img.getpixel((0,0)), img.getpixel((w-1,0)),
                   img.getpixel((0,h-1)), img.getpixel((w-1,h-1))]
        name = os.path.basename(p)
        print(f"  {name:30s}  TL={corners[0]} TR={corners[1]} BL={corners[2]} BR={corners[3]}")
