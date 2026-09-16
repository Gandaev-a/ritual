#!/usr/bin/env python3
"""Собирает index.html: шаблон + данные прайса + логика конфигуратора."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
tpl  = (root / 'src/template.html').read_text(encoding='utf-8')
app  = (root / 'src/app.js').read_text(encoding='utf-8')
data = json.loads((root / 'src/data.json').read_text(encoding='utf-8'))
fences = json.loads((root / 'src/fences.json').read_text(encoding='utf-8'))
small  = json.loads((root / 'src/extras.json').read_text(encoding='utf-8'))
html = tpl.replace('/*__DATA__*/', json.dumps(data, ensure_ascii=False, separators=(',', ':')))
html = html.replace('/*__FENCES__*/', json.dumps(fences, ensure_ascii=False, separators=(',', ':')))
html = html.replace('/*__SMALL__*/', json.dumps(small, ensure_ascii=False, separators=(',', ':')))
html = html.replace('/*__APP__*/', app)
# Артефакт оборачивает контент своим скелетом; GitHub Pages отдаёт файл как есть,
# поэтому для сайта нужен полный документ с charset и viewport — без них телефон
# рендерит страницу в виртуальном окне 980 px и медиазапросы не срабатывают.
(root / 'artifact.html').write_text(html, encoding='utf-8')
page = ('<!doctype html>\n<html lang="ru">\n<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<meta name="color-scheme" content="dark light">\n'
        '<meta name="description" content="Гранитные комплекты, ограждения и малые формы: '
        'каталог и конфигуратор участка. Красноярск, оптовые цены.">\n'
        '<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n'
        '</head>\n<body>\n') + html + '\n</body>\n</html>\n'
(root / 'index.html').write_text(page, encoding='utf-8')
print(f'index.html: {len(page.encode()):,} bytes · {len(data)} моделей · {len(fences)} оград · {len(small)} малых форм')
