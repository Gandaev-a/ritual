#!/usr/bin/env python3
"""Собирает index.html: шаблон + данные прайса + логика конфигуратора."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
tpl  = (root / 'src/template.html').read_text(encoding='utf-8')
app  = (root / 'src/app.js').read_text(encoding='utf-8')
data = json.loads((root / 'src/data.json').read_text(encoding='utf-8'))
html = tpl.replace('/*__DATA__*/', json.dumps(data, ensure_ascii=False, separators=(',', ':')))
html = html.replace('/*__APP__*/', app)
(root / 'index.html').write_text(html, encoding='utf-8')
print(f'index.html: {len(html.encode()):,} bytes · {len(data)} моделей')
