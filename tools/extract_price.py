#!/usr/bin/env python3
"""Разбирает PDF-прайс: номер, размеры, цена и рендер каждого комплекта.

Запуск:  python3 tools/extract_price.py [путь-к-price.pdf]
Требует: pdfplumber, pypdfium2, Pillow
"""
import json, re, os, hashlib
import pdfplumber, pypdfium2 as pdfium
from PIL import Image
from collections import deque

import sys
PDF = sys.argv[1] if len(sys.argv) > 1 else 'price/opt-price.pdf'
SCALE=3.0
plumb=pdfplumber.open(PDF); doc=pdfium.PdfDocument(PDF)
PRICE=re.compile(r'^\d[\d\s]*,\d{2}$'); NUM=re.compile(r'^\d{1,3}(\.\d)?$')
PART={'Стела','Тумба','Цветник'}
os.makedirs('cut',exist_ok=True)

def transparent(im):
    """flood-fill near-white from the border -> alpha 0"""
    im=im.convert('RGBA'); w,h=im.size; px=im.load()
    seen=bytearray(w*h); q=deque()
    for x in range(w):
        for y in (0,h-1): q.append((x,y))
    for y in range(h):
        for x in (0,w-1): q.append((x,y))
    while q:
        x,y=q.popleft(); i=y*w+x
        if seen[i]: continue
        seen[i]=1
        r,g,b,a=px[x,y]
        if r<236 or g<236 or b<236: continue
        px[x,y]=(r,g,b,0)
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny=x+dx,y+dy
            if 0<=nx<w and 0<=ny<h and not seen[ny*w+nx]: q.append((nx,ny))
    return im

models=[]
for pi,page in enumerate(plumb.pages,1):
    words=page.extract_words()
    anchors=sorted([w for w in words if w['x0']<160 and NUM.match(w['text']) and (w['bottom']-w['top'])>15],
                   key=lambda w:w['top'])
    prices=sorted([w for w in words if w['x0']>500 and PRICE.match(w['text'])], key=lambda w:w['top'])
    assert len(anchors)==len(prices)==0 or len(anchors)==len(prices), pi

    # group size rows: a new "Стела" starts a new model block
    rows=[]
    for w in words:
        if w['text'] in PART:
            vals=sorted([v for v in words if abs(v['top']-w['top'])<6 and v['x0']>355 and v['text'].isdigit()],
                        key=lambda v:v['x0'])
            if len(vals)==3: rows.append((w['top'], w['text'], [int(v['text']) for v in vals]))
    rows.sort()
    groups=[]
    for top,part,dims in rows:
        if part=='Стела' or not groups: groups.append([])
        groups[-1].append({'part':part,'dims':dims,'top':top})
    assert len(groups)==len(anchors), (pi,len(groups),len(anchors))

    # model vertical zones from group extents
    zones=[]
    for gi,g in enumerate(groups):
        y0=g[0]['top']-14
        y1=groups[gi+1][0]['top']-14 if gi+1<len(groups) else page.height
        zones.append((y0,y1))

    render=doc[pi-1].render(scale=SCALE).to_pil()
    for gi,(g,a,pr) in enumerate(zip(groups,anchors,prices)):
        y0,y1=zones[gi]
        ims=[im for im in page.images if y0 <= (im['top']+im['bottom'])/2 <= y1]
        assert ims, (pi,gi)
        x0=min(i['x0'] for i in ims)+1; x1=max(i['x1'] for i in ims)-1
        t =min(i['top'] for i in ims)+1; b =max(i['bottom'] for i in ims)-1
        crop=render.crop((int(x0*SCALE),int(t*SCALE),int(x1*SCALE),int(b*SCALE)))
        crop=transparent(crop)
        bbox=crop.getbbox()
        if bbox: crop=crop.crop(bbox)
        crop.thumbnail((640,640), Image.LANCZOS)
        h=hashlib.md5(crop.tobytes()).hexdigest()[:10]
        fn=f'cut/{h}.png'
        if not os.path.exists(fn): crop.save(fn)
        models.append({'page':pi,'code':a['text'],
                       'price':int(pr['text'].replace(' ','').split(',')[0]),
                       'parts':[{'part':p['part'],'dims':p['dims']} for p in g],
                       'img':h,'size':crop.size})

json.dump(models, open('models.json','w'), ensure_ascii=False, indent=1)
print('models',len(models),'unique imgs',len({m['img'] for m in models}))
for m in models:
    st=next(p['dims'] for p in m['parts'] if p['part']=='Стела')
    print(f"p{m['page']:2d} №{m['code']:>4} {m['price']:>6} стела={st} n={len(m['parts'])} img={m['img']} {m['size']}")
