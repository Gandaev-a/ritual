"""Контур рендеров памятников для расстановки ваз в конфигураторе.

Для каждой полосы высотой BAND пикселей холста записывает самый левый и самый
правый непрозрачный пиксель (alpha > 24, как у bbox). По этому контуру вазы
отодвигаются от памятника, пока не встанут целиком за ним: размеры из прайса
не всегда совпадают с фото (ракурс съёмки, ширина цветника), а контур — это
то, что реально видно на картинке.

Записывает в src/data.json поля sb (высота полосы) и span (плоский список
[лево, право, лево, право, ...]; -1 — в полосе нет непрозрачных пикселей).
"""
import base64, io, json, pathlib
import numpy as np
from PIL import Image

BAND = 6
root = pathlib.Path(__file__).resolve().parent.parent
path = root / 'src/data.json'
models = json.loads(path.read_text(encoding='utf-8'))
for m in models:
    raw = base64.b64decode(m['img'].split(',', 1)[1])
    alpha = np.array(Image.open(io.BytesIO(raw)).convert('RGBA'))[:, :, 3] > 24
    assert alpha.shape == (m['h'], m['w']), (m['code'], alpha.shape)
    span = []
    for y in range(0, m['h'], BAND):
        cols = np.flatnonzero(alpha[y:y + BAND].any(axis=0))
        span += [int(cols[0]), int(cols[-1])] if cols.size else [-1, -1]
    m['sb'], m['span'] = BAND, span
path.write_text(json.dumps(models, ensure_ascii=False), encoding='utf-8')
print(f'{len(models)} моделей, полоса {BAND} px')
