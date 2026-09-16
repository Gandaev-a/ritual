"""Приводит рендеры памятников к единому масштабу и базовой линии."""
import json, os, base64
import numpy as np, pypdfium2 as pdfium
from PIL import Image
from collections import deque
from scipy import ndimage

def transparent(im):
    im = im.convert('RGBA'); w, h = im.size; px = im.load()
    seen = bytearray(w*h); q = deque()
    for x in range(w): q.append((x,0)); q.append((x,h-1))
    for y in range(h): q.append((0,y)); q.append((w-1,y))
    while q:
        x,y = q.popleft(); i = y*w+x
        if seen[i]: continue
        seen[i] = 1
        r,g,b,a = px[x,y]
        if r < 236 or g < 236 or b < 236: continue
        px[x,y] = (r,g,b,0)
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny = x+dx, y+dy
            if 0 <= nx < w and 0 <= ny < h and not seen[ny*w+nx]: q.append((nx,ny))
    return im

def largest(im):
    a = np.array(im); m = a[:,:,3] > 24
    lab, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n+1))
        a[:,:,3] = np.where(lab == int(sizes.argmax())+1, a[:,:,3], 0)
    im = Image.fromarray(a); bb = im.getbbox()
    return im.crop(bb) if bb else im

# --- новый памятник № 8 из price/10.pdf ---
pdf = pdfium.PdfDocument('/home/user/ritual/price/10.pdf')
m8 = largest(transparent(pdf[0].render(scale=2.4).to_pil().convert('RGB')))
m8.save('clean/new08.png'); print('№8 вырезан:', m8.size)

# --- единый масштаб и холст ---
models = json.load(open('models.json'))
NEW = {'page': 0, 'code': '8', 'price': None, 'img': 'new08',
       'parts': [{'part':'Стела','dims':[1200,600,70]}, {'part':'Тумба','dims':[700,200,140]},
                 {'part':'Цветник','dims':[700,70,70]}, {'part':'Цветник','dims':[1000,70,70]}]}
models.append(NEW)

PX_MM = 0.40                      # пикселей на миллиметр, одинаково для всех
BASE  = 14                        # отступ от базовой линии до низа холста
recs = []
for m in models:
    src = f"clean/{m['img']}.png"
    im = Image.open(src).convert('RGBA')
    stela = next(p['dims'] for p in m['parts'] if p['part'] == 'Стела')
    h_mm = stela[0] + 380         # стела плюс основание в перспективе
    tgt_h = h_mm * PX_MM
    k = tgt_h / im.height
    im = im.resize((max(1, round(im.width*k)), round(tgt_h)), Image.LANCZOS)
    a = np.array(im); msk = a[:,:,3] > 24
    ys, xs = np.nonzero(msk); ymax = ys.max()
    ax = float(xs[ys == ymax].mean())        # ближний угол основания
    recs.append({'m': m, 'im': im, 'ax': ax, 'ay': float(ymax)})

CW = round(max(max(r['im'].width - r['ax'], r['ax']) for r in recs) * 2) + 24
CH = round(max(r['ay'] for r in recs)) + BASE + 10
print('единый холст:', CW, '×', CH)

os.makedirs('norm', exist_ok=True)
for r in recs:
    canvas = Image.new('RGBA', (CW, CH), (0,0,0,0))
    x = round(CW/2 - r['ax']); y = round(CH - BASE - r['ay'])
    canvas.paste(r['im'], (x, y), r['im'])
    canvas.save(f"norm/{r['m']['img']}.webp", 'WEBP', quality=84, method=6)
json.dump([r['m'] for r in recs], open('models_all.json','w'), ensure_ascii=False)
print('нормализовано:', len(recs))
