#!/usr/bin/env python3
"""Разбирает каталог ограждений: вырезает рендер каждой ограды со страницы.

Каталог растровый — текстового слоя нет, страницы рендерятся и режутся по
координатам блока. Круг-увеличение отсекается эрозией маски: сплошная масса
её переживает, тонкие линии ограды — нет.

Запуск:  python3 tools/extract_fences.py
"""
import numpy as np, os, json
import pypdfium2 as pdfium
from PIL import Image
from scipy import ndimage

PDF='/home/user/ritual/price/Каталог 2025 А4.pdf'
S = 3.2                       # блоки найдены при 1.6 → коэффициент 2
BOX_TOP = (421, 155, 881, 491)
BOX_BOT = (48,  828, 508, 1164)
os.makedirs('fen', exist_ok=True)
pdf = pdfium.PdfDocument(PDF)

def cut(page, box):
    im = page.render(scale=S).to_pil().convert('RGB')
    k = S / 1.6
    c = im.crop(tuple(int(v * k) for v in box))
    a = np.array(c)
    ink = a.min(axis=2) < 225                       # всё, что не белый фон
    # круг-увеличение — сплошная масса; линии ограды тонкие и эрозию не переживают
    blob = ndimage.binary_erosion(ink, np.ones((9, 9)))
    blob = ndimage.binary_dilation(blob, np.ones((13, 13)))
    ys = np.nonzero(blob.any(axis=1))[0]
    cutY = int(ys.min()) if len(ys) else a.shape[0]
    if cutY < a.shape[0] * 0.35: cutY = int(a.shape[0] * 0.55)   # подстраховка
    a = a[:cutY]; ink = ink[:cutY]
    # прозрачность: белое → альфа 0, чернила остаются
    lum = a.min(axis=2).astype(float)
    alpha = np.clip((238 - lum) / 90 * 255, 0, 255).astype(np.uint8)
    out = np.dstack([a, alpha])
    im2 = Image.fromarray(out, 'RGBA')
    bb = im2.getbbox()
    return im2.crop(bb) if bb else im2

items = []
for page_i in range(1, 19):                  # стр. 2..19 — ограды №1..№36
    pg = pdf[page_i]
    for half, box in (('top', BOX_TOP), ('bot', BOX_BOT)):
        num = (page_i - 1) * 2 + (1 if half == 'top' else 2)
        img = cut(pg, box)
        img.thumbnail((660, 660), Image.LANCZOS)
        f = f'fen/f{num:02d}.webp'
        img.save(f, 'WEBP', quality=84, method=6)
        items.append({'n': num, 'file': f, 'size': img.size, 'bytes': os.path.getsize(f)})
        print(f'Ограда №{num:2d}  {img.size}  {os.path.getsize(f)} б')
json.dump(items, open('fences_index.json', 'w'), ensure_ascii=False)
print('всего', len(items), 'сумма', sum(i['bytes'] for i in items), 'байт')
