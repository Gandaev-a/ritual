import json, os, base64
import numpy as np
from PIL import Image
from collections import deque
from scipy import ndimage

def transparent(im):
    im = im.convert('RGBA'); w,h = im.size; px = im.load()
    seen = bytearray(w*h); q = deque()
    for x in range(w): q.append((x,0)); q.append((x,h-1))
    for y in range(h): q.append((0,y)); q.append((w-1,y))
    while q:
        x,y = q.popleft(); i = y*w+x
        if seen[i]: continue
        seen[i] = 1
        r,g,b,a = px[x,y]
        if r < 234 or g < 234 or b < 234: continue
        px[x,y] = (r,g,b,0)
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny = x+dx,y+dy
            if 0<=nx<w and 0<=ny<h and not seen[ny*w+nx]: q.append((nx,ny))
    a = np.array(im); m = a[:,:,3] > 24
    lab,n = ndimage.label(m)
    if n > 1:
        sz = ndimage.sum(m, lab, range(1,n+1))
        a[:,:,3] = np.where(lab == int(sz.argmax())+1, a[:,:,3], 0)
    im = Image.fromarray(a); bb = im.getbbox()
    return im.crop(bb) if bb else im

idx = json.load(open('extra_index.json'))
for o in idx: o['row'] = round(o['y'] / 120)
idx.sort(key=lambda o: (o['page'], o['row'], o['x']))

def kind_of(o):
    p = o['page']
    if p in (20, 21): return 'table'
    if p in (22, 23, 24): return 'bench'
    if p == 25:
        if o['w'] > 300: return 'slab'
        return 'bench' if o['h'] > 200 else 'corner'
    if p == 26: return 'corner' if o['h'] < 200 else 'vase'
    if p in (27, 28): return 'vase'
    return 'cross'

cnt = {}; items = []
os.makedirs('sm', exist_ok=True)
for o in idx:
    k = kind_of(o)
    cnt[k] = cnt.get(k, 0) + 1
    items.append({'kind': k, 'n': cnt[k], 'im': transparent(Image.open(o['file']).convert('RGB'))})

TARGET = {'table': 300, 'bench': 330, 'vase': 250, 'cross': 270, 'corner': 330, 'slab': 330}
for it in items:
    im = it['im']; k = TARGET[it['kind']] / max(im.width, im.height)
    it['im'] = im.resize((max(1, round(im.width*k)), max(1, round(im.height*k))), Image.LANCZOS)

out = []
for kind in sorted(set(i['kind'] for i in items)):
    grp = [i for i in items if i['kind'] == kind]
    CW = max(i['im'].width for i in grp) + 10
    CH = max(i['im'].height for i in grp) + 10
    for it in grp:
        c = Image.new('RGBA', (CW, CH), (0,0,0,0))
        c.paste(it['im'], ((CW - it['im'].width)//2, CH - 5 - it['im'].height), it['im'])
        f = f"sm/{kind}{it['n']:02d}.webp"
        c.save(f, 'WEBP', quality=80, method=6)
        out.append({'id': f"{kind}{it['n']}", 'kind': kind, 'n': it['n'], 'w': CW, 'h': CH, 'file': f})
    print(kind, len(grp), f'холст {CW}x{CH}', flush=True)

for o in out:
    o['img'] = 'data:image/webp;base64,' + base64.b64encode(open(o['file'],'rb').read()).decode()
    del o['file']
json.dump(out, open('extras.json','w'), ensure_ascii=False)
print('ВСЕГО', len(out), '·', round(os.path.getsize('extras.json')/1024), 'KB')
