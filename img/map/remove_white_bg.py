"""
v1.14.3.87 — FLOOD-FILL: kenar boyunca cok-sample seed toplama.

Stitch BG'leri tutarsiz:
  - beyaz, gri, siyah, bej, KARELI siyah-beyaz (bucukluk: 4 kose de siyah denk
    gelmis, beyaz checker squares kacirilmis)

Cozum: Sadece 4 koseden degil, KENAR boyunca her 50px'te bir sample al,
distinct renkleri seed listesine ekle. Tolerans+euclidean ile esle, BFS.
Sprite icindeki ayni renkler korunur (BG'ye bagli degilsa).
"""
from PIL import Image
import numpy as np
from collections import deque
import os, glob

TOLERANCE = 35
EDGE_SAMPLE_STEP = 30   # kenar boyunca her 30 pikselde bir sample

def collect_edge_seeds(arr):
    h, w, _ = arr.shape
    seeds = []
    # Ust + alt kenar
    for x in range(0, w, EDGE_SAMPLE_STEP):
        seeds.append(tuple(int(v) for v in arr[0, x, :3]))
        seeds.append(tuple(int(v) for v in arr[h-1, x, :3]))
    # Sol + sag kenar
    for y in range(0, h, EDGE_SAMPLE_STEP):
        seeds.append(tuple(int(v) for v in arr[y, 0, :3]))
        seeds.append(tuple(int(v) for v in arr[y, w-1, :3]))

    # Distinct renkleri tut — tolerans icinde olanlari grupla
    distinct = []
    for c in seeds:
        is_new = True
        for d in distinct:
            if max(abs(c[0]-d[0]), abs(c[1]-d[1]), abs(c[2]-d[2])) <= TOLERANCE:
                is_new = False
                break
        if is_new:
            distinct.append(c)
    return distinct

def flood_remove_bg(path):
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape
    new_alpha = arr[:, :, 3].copy()
    visited = np.zeros((h, w), dtype=bool)

    seeds_list = collect_edge_seeds(arr)
    seeds = np.array(seeds_list, dtype=np.int16) if seeds_list else np.zeros((0, 3), dtype=np.int16)

    def is_bg(rgb):
        if len(seeds) == 0:
            return False
        d = np.abs(seeds - np.array(rgb, dtype=np.int16)).max(axis=1)
        return bool((d <= TOLERANCE).any())

    queue = deque()
    # Tum kenar boyunca seed pikselleri enqueue et (entry point cesitliligi)
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h-1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w-1, y))

    while queue:
        x, y = queue.popleft()
        if visited[y, x]:
            continue
        cur = tuple(int(v) for v in arr[y, x, :3])
        if not is_bg(cur):
            continue
        visited[y, x] = True
        new_alpha[y, x] = 0
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[ny, nx]:
                queue.append((nx, ny))

    arr[:, :, 3] = new_alpha
    Image.fromarray(arr).save(path, "PNG", optimize=True)
    return (new_alpha == 0).sum() * 100 / (h * w), len(seeds_list)

def process_folder(folder):
    pngs = sorted(glob.glob(os.path.join(folder, "*.png")))
    if not pngs:
        return
    print(f"\n=== {folder} ===")
    for p in pngs:
        pct, n = flood_remove_bg(p)
        print(f"  {os.path.basename(p):30s}  -> {pct:5.1f}% transparent  ({n} distinct seed)")

if __name__ == "__main__":
    base = os.path.dirname(os.path.abspath(__file__))
    for sub in ("castles", "colonies"):
        process_folder(os.path.join(base, sub))
    print("\nTamam.")
