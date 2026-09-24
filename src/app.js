/* ---------- участки ------------------------------------------------------
   Схема участка теперь рисуется строго по реальным миллиметрам (вид сверху),
   без фотомонтажа: раньше памятник, ограда и мебель были фотографиями с
   РАЗНЫХ съёмок (свои камеры, свои углы — до 22° расхождения между источниками,
   см. README), и никакая перестановка координат не могла свести их в одну
   сцену. План читает размеры из прайса и каталога, фото показаны отдельно,
   в галерее «ваш комплект» ниже плана — каждое ровно и без искажений.        */
const PLOTS = [
  { id:'p1', label:'2,5 × 2 м',       l:2500, w:2000, note:'2,5 × 2 м — одно место' },
  { id:'p2', label:'2,5 × 3 м',       l:2500, w:3000, note:'2,5 × 3 м — два места' },
  { id:'p3', label:'Воинский сектор', l:2500, w:2500, note:'2,5 × 2,5 м — воинский сектор', war:true }
];

/* ---------- плита на могиле ---------------------------------------------- */
const STONE = {
  grey:  { label:'серый',         top:'#8B9093', line:'#757A7D' },
  white: { label:'белый',         top:'#D6D8D7', line:'#C2C4C3' },
  black: { label:'чёрный',        top:'#16191B', line:'#3A3F42' },
  dark:  { label:'тёмно-серый',   top:'#474D50', line:'#5A6064' },
  soft:  { label:'светло-чёрный', top:'#2A2F33', line:'#40464A' }
};
const FLOORS = [
  { id:'g1', label:'Гранит серый',         stone:'grey',  grid:600 },
  { id:'g2', label:'Гранит тёмно-серый',   stone:'dark',  grid:600 },
  { id:'g3', label:'Гранит светло-чёрный', stone:'soft',  grid:600 },
  { id:'g4', label:'Гранит чёрный',        stone:'black', grid:600 },
  { id:'g5', label:'Гранит белый',         stone:'white', grid:600 },
  { id:'f6', label:'Керамогранит',         fill:'#3E4447', line:'#565C60', grid:600 },
  { id:'f7', label:'Тротуарная плитка',    fill:'#8F9391', line:'#797D7B', grid:300 },
  { id:'f8', label:'Искусственный газон',  fill:'#4C7342', line:'#5B8A4F', grass:true },
  { id:'f9', label:'Гранитная крошка',     fill:'#6B7175', line:'#878D90', speck:true }
];

/* ---------- ограждения: каталог 2025 -------------------------------------
   Цвета покрытий измерены с фирменных плашек каталога — используются как
   маркер на плане и в галерее, не для перекраски фотографии.               */
const COATINGS = [
  { id:'c1', label:'медный антик',   dot:'#672821' },
  { id:'c2', label:'чёрное серебро', dot:'#616161' },
  { id:'c3', label:'чёрный матовый', dot:'#323232' },
  { id:'c4', label:'зелёный антик',  dot:'#486E5C' },
  { id:'c5', label:'золотой антик',  dot:'#97855F' }
];
const FENCES = [{ id:'n0', n:0 }, ...FENCE_DATA];

/* ---------- малые формы: каталог 2025 ------------------------------------ */
const KINDS = {
  table:  { label:'Стол',      plural:'Столы',    fw:600,  fd:600 },  // 50×60 см и d60 см — считаем как 600×600
  bench:  { label:'Лавка',     plural:'Лавки',    fw:1000, fd:370 },  // длина 100 см, ширина 30–36 см (каталог)
  vase:   { label:'Ваза',      plural:'Вазы' },
  cross:  { label:'Крест',     plural:'Кресты' },
  corner: { label:'Угол',      plural:'Углы' },
  slab:   { label:'Надгробие', plural:'Надгробие' }
};
const BENCHES = SMALL_DATA.filter(o => o.kind === 'bench' || o.kind === 'table');
const VASES   = SMALL_DATA.filter(o => o.kind === 'vase');
const NONE    = { id:'none', kind:'none' };

/* ---------- примитивы svg ------------------------------------------------ */
const r1 = n => Math.round(n * 10) / 10;
const circle = (cx, cy, rr, fill, extra='') =>
  `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(rr)}" fill="${fill}" ${extra}/>`;
const seg = (x1, y1, x2, y2, stroke, w=4, extra='') =>
  `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
const label = (x, y, txt, size, extra='') =>
  `<text x="${r1(x)}" y="${r1(y)}" font-family="IBM Plex Mono, monospace" font-size="${r1(size)}" ${extra}>${txt}</text>`;

/* ---------- сцена: объекты в ряд на общей плоскости ----------------------
   Фотографии сняты разными камерами (разброс угла базовой линии между
   источниками доходит до 22°, см. README), поэтому совмещать их в одну
   3D-композицию нельзя — памятник вставал криво, лавка наезжала на цветник.
   Здесь объекты не накладываются: каждый стоит отдельно, все — на одной
   нижней плоскости, в едином масштабе по реальным миллиметрам.            */
const K = 0.23;                 // px на мм сцены
const NORM_PX_MM = 0.40;        // масштаб нормализованных рендеров памятников
const GAP      = 300;           // зазор между объектами, мм
const FLOOR_H  = 340;           // высота полосы пола, мм
const PAD_TOP  = 260;           // воздух над самым высоким объектом, мм
const LABEL_H  = 330;           // место под подпись, мм
const SIDE_PAD = 260;           // поля слева и справа, мм — под подписи крайних объектов

/* реальная опорная величина: по ней объект приводится к общему масштабу */
const REAL = {
  model: o => ({ dim:'h', mm: o.stela[0] + 380 }),          // стела плюс основание
  fence: () => ({ dim:'w', mm: 2500 }),                      // участок 250 см по каталогу
  bench: () => ({ dim:'w', mm: 1000 }),                      // длина лавки 100 см
  table: () => ({ dim:'h', mm: 1000 }),                      // столб стола H=100 см
  vase:  () => ({ dim:'h', mm: 450 })                        // высота вазы 40–50 см
};

/* габариты объекта на сцене с учётом полей внутри холста */
function place(kind, o) {
  const r = REAL[kind](o);
  const objW = o.bw * o.w, objH = o.bh * o.h;                // объект внутри холста, px
  const scale = (r.mm * K) / (r.dim === 'w' ? objW : objH);
  return {
    img: o.img, scale,
    cw: o.w * scale, ch: o.h * scale,                        // холст на сцене
    ox: o.bx * o.w * scale, oy: o.by * o.h * scale,          // смещение объекта в холсте
    w: objW * scale, h: objH * scale
  };
}

function floorStrip(x, y, w, h, f) {
  const st = f.stone ? STONE[f.stone] : null;
  const fill = st ? st.top : f.fill, lineCol = st ? st.line : f.line;
  let g = `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${fill}"/>`;
  if (f.grid) {
    let l = '';
    for (let yy = y + h * 0.34; yy < y + h; yy += h * 0.33) l += seg(x, yy, x + w, yy, lineCol, 3);
    for (let xx = x + f.grid * K; xx < x + w; xx += f.grid * K) l += seg(xx, y, xx, y + h, lineCol, 3);
    g += `<g opacity=".45">${l}</g>`;
  }
  if (f.grass) {
    let l = '';
    for (let xx = x + 12; xx < x + w; xx += 26)
      for (let yy = y + 14; yy < y + h; yy += 22) l += seg(xx, yy, xx + ((xx * yy) % 7 - 3), yy - 13, lineCol, 2.4, 'stroke-linecap="round"');
    g += `<g opacity=".75">${l}</g>`;
  }
  if (f.speck) {
    let l = '';
    for (let xx = x + 10; xx < x + w; xx += 21)
      for (let yy = y + 12; yy < y + h; yy += 18) l += circle(xx + ((yy % 3) * 4), yy, 1.4 + (xx % 3) * 0.5, lineCol);
    g += `<g opacity=".65">${l}</g>`;
  }
  return g + seg(x, y, x + w, y, '#ffffff', 2.5, 'opacity=".5"');
}

function buildScene(S, perRow) {
  const picked = [{ kind:'model', o:S.model, label:`Памятник № ${S.model.code}` }];
  if (S.fence.n) picked.push({ kind:'fence', o:S.fence, label:`Ограда № ${S.fence.n}` });
  if (S.bench.kind !== 'none')
    picked.push({ kind:S.bench.kind, o:S.bench, label:`${KINDS[S.bench.kind].label} № ${S.bench.n}` });
  if (S.vase.kind === 'vase') picked.push({ kind:'vase', o:S.vase, label:`Ваза № ${S.vase.n}` });

  const items = picked.map(p => ({ ...p, g: place(p.kind, p.o) }));
  const gap = GAP * K, floorH = FLOOR_H * K, padTop = PAD_TOP * K, labelH = LABEL_H * K;

  /* разбивка на ряды: на узком экране объекты переносятся, каждый ряд — своя плоскость */
  const rows = [];
  for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));

  const rowW = rows.map(r => r.reduce((s, it) => s + it.g.w, 0) + gap * (r.length - 1));
  const rowH = rows.map(r => Math.max(...r.map(it => it.g.h)));
  const sceneW = Math.max(...rowW) + SIDE_PAD * K * 2;
  const rowBoxH = rowH.map(h => padTop + h + floorH + labelH);
  const sceneH = rowBoxH.reduce((a, b) => a + b, 0);

  let g = '';
  let yCursor = 0;
  rows.forEach((row, ri) => {
    const baseline = yCursor + padTop + rowH[ri];
    g += floorStrip(0, baseline, sceneW, floorH, S.floor);
    let x = (sceneW - rowW[ri]) / 2;
    for (const it of row) {
      const { g: q } = it;
      /* тень на плоскости — привязана к низу объекта, одинаково у всех */
      g += `<ellipse cx="${r1(x + q.w / 2)}" cy="${r1(baseline + 3)}" rx="${r1(q.w * 0.46)}" ry="${r1(Math.max(3, q.w * 0.035))}" fill="#0B0C0D" opacity=".11"/>`;
      g += `<image href="${q.img}" x="${r1(x - q.ox)}" y="${r1(baseline - q.oy - q.h)}" width="${r1(q.cw)}" height="${r1(q.ch)}"/>`;
      g += label(x + q.w / 2, baseline + floorH + labelH * 0.55, it.label, labelH * 0.42,
                 'fill="#5D6467" text-anchor="middle"');
      x += q.w + gap;
    }
    yCursor += rowBoxH[ri];
  });

  const names = items.map(i => i.label).join(', ');
  return `<svg viewBox="0 0 ${r1(sceneW)} ${r1(sceneH)}" role="img" aria-label="${names} — в одном масштабе на общей плоскости">${g}</svg>`;
}

/* на узком экране объекты переносятся во второй ряд, иначе стоят одной линией */
const perRow = () => (window.innerWidth < 900 ? 2 : 4);

/* ---------- состояние ---------------------------------------------------- */
const S = { model: MODELS[0], plot: PLOTS[0], floor: FLOORS[0], fence: FENCES[1],
            coat: COATINGS[2], bench: NONE, vase: NONE, shape:'all' };
const $   = id => document.getElementById(id);
const mm  = a => a ? a.join(' × ') : '—';
const rub = n => n == null ? 'по запросу' : n.toLocaleString('ru-RU') + ' ₽';

function chipRow(host, items, key) {
  host.innerHTML = items.map(o =>
    `<button class="chip" data-id="${o.id}" aria-pressed="${S[key].id === o.id}">${o.label}</button>`).join('');
  host.onclick = e => {
    const b = e.target.closest('.chip'); if (!b) return;
    S[key] = items.find(o => o.id === b.dataset.id); render();
  };
}
function miniRow(host, items, key, label) {
  host.innerHTML = [`<button class="mini smnone" data-id="none" aria-pressed="${S[key].id === 'none'}">нет</button>`]
    .concat(items.map(o =>
      `<button class="mini smini" data-id="${o.id}" aria-pressed="${S[key].id === o.id}" title="${KINDS[o.kind].label} № ${o.n}"><span>${o.n}</span><img src="${o.img}" alt="${KINDS[o.kind].label} № ${o.n}" loading="lazy"></button>`)).join('');
  host.onclick = e => {
    const b = e.target.closest('.mini'); if (!b) return;
    S[key] = b.dataset.id === 'none' ? NONE : items.find(o => o.id === b.dataset.id);
    render();
  };
}

function render() {
  $('scene').innerHTML = buildScene(S, perRow());
  const coatTxt = S.fence.n ? `, покрытие ${S.coat.label}` : '';
  $('sceneNote').textContent =
    `${S.plot.note} · ${S.floor.label.toLowerCase()}${coatTxt} · всё в одном масштабе, рядом друг с другом`;
  $('oCode').textContent  = '№ ' + S.model.code;
  $('oShape').textContent = S.model.fig ? 'фигурная' : 'прямая';
  $('oStela').textContent = mm(S.model.stela);
  $('oTumba').textContent = mm(S.model.tumba);
  $('oCvet').textContent  = S.model.cvetnik.map(c => c.join('×')).join(' + ');
  $('oPlot').textContent  = S.plot.note;
  $('oFence').textContent = S.fence.n ? '№ ' + S.fence.n : '—';
  const pr = $('oPrice');
  pr.textContent = rub(S.model.price);
  pr.classList.toggle('ask', S.model.price == null);
  $('coatRow').hidden = !S.fence.n;
  for (const b of $('minis').querySelectorAll('.mini'))
    b.setAttribute('aria-pressed', b.dataset.id === S.model.id);
  for (const b of $('fences').querySelectorAll('.mini'))
    b.setAttribute('aria-pressed', b.dataset.id === S.fence.id);
  for (const [host, key] of [['benches','bench'], ['vases','vase']])
    for (const b of $(host).querySelectorAll('.mini'))
      b.setAttribute('aria-pressed', b.dataset.id === S[key].id);
  for (const [host, key] of [['floors','floor'], ['plots','plot'], ['coats','coat']])
    for (const b of $(host).querySelectorAll('.chip'))
      b.setAttribute('aria-pressed', b.dataset.id === S[key].id);
}

/* памятники */
function drawMinis() {
  const list = MODELS.filter(m => S.shape === 'all' || (S.shape === 'fig') === !!m.fig);
  $('minis').innerHTML = list.map(m =>
    `<button class="mini" data-id="${m.id}" aria-pressed="${m.id === S.model.id}" title="№ ${m.code} — ${rub(m.price)}"><span>${m.code}</span><img src="${m.img}" alt="Памятник № ${m.code}" loading="lazy"></button>`).join('');
}
$('minis').onclick = e => {
  const b = e.target.closest('.mini'); if (!b) return;
  S.model = MODELS.find(m => m.id === b.dataset.id); render();
};
$('shapeTabs').onclick = e => {
  const b = e.target.closest('.chip'); if (!b) return;
  S.shape = b.dataset.shape;
  for (const c of $('shapeTabs').querySelectorAll('.chip'))
    c.setAttribute('aria-pressed', c.dataset.shape === S.shape);
  drawMinis(); render();
};
/* ограждения */
$('fences').innerHTML = FENCES.map(f => f.n
  ? `<button class="mini fmini" data-id="${f.id}" aria-pressed="${f.id === S.fence.id}" title="Ограда № ${f.n} — столб ${f.post}, рисунок ${f.art} см"><span>${f.n}</span><img src="${f.img}" alt="Ограда № ${f.n}" loading="lazy"></button>`
  : `<button class="mini fmini fnone" data-id="${f.id}" aria-pressed="${f.id === S.fence.id}">без<br>ограды</button>`).join('');
$('fences').onclick = e => {
  const b = e.target.closest('.mini'); if (!b) return;
  S.fence = FENCES.find(f => f.id === b.dataset.id); render();
};
chipRow($('coats'),  COATINGS, 'coat');
chipRow($('floors'), FLOORS,   'floor');
chipRow($('plots'),  PLOTS,    'plot');
miniRow($('benches'), BENCHES, 'bench');
miniRow($('vases'),   VASES,   'vase');

/* ---------- каталог памятников ------------------------------------------- */
const SIZES = [...new Set(MODELS.map(m => m.stela.join('×')))]
  .sort((a, b) => { const [ah,aw] = a.split('×').map(Number), [bh,bw] = b.split('×').map(Number);
                    return ah - bh || aw - bw; });
const FILTERS = [
  { id:'all',   label:'Все 34',   test:() => true },
  { id:'fig',   label:'Фигурные', test:m => m.fig },
  { id:'plain', label:'Прямые',   test:m => !m.fig },
  ...SIZES.map(s => ({ id:'s'+s, label:s, test:m => m.stela.join('×') === s }))
];
let activeFilter = 'all';
function drawCatalogue() {
  const f = FILTERS.find(x => x.id === activeFilter);
  const list = MODELS.filter(f.test);
  $('gridCount').textContent = list.length + ' из ' + MODELS.length;
  $('grid').innerHTML = list.map(m => `
    <article class="card">
      <div class="card-stage"><span class="card-code">№ ${m.code}</span>
        <span class="card-tag">${m.fig ? 'фигурная' : 'прямая'}</span>
        <img src="${m.img}" alt="Гранитный комплект № ${m.code}" loading="lazy"></div>
      <div class="card-body">
        <div class="card-dims">
          <i>стела</i>${mm(m.stela)}<br>
          <i>тумба</i>${mm(m.tumba)}<br>
          <i>цветник</i>${m.cvetnik.map(c => c.join('×')).join(' + ')}
        </div>
        <div class="card-foot">
          <span class="card-price${m.price == null ? ' ask' : ''}">${rub(m.price)}</span>
          <button class="card-try" data-id="${m.id}">в конфигуратор →</button>
        </div>
      </div>
    </article>`).join('');
}
$('filters').innerHTML = '<span class="eyebrow">Форма и размер</span>' + FILTERS.map(f =>
  `<button class="chip" data-f="${f.id}" aria-pressed="${f.id === activeFilter}">${f.label}</button>`).join('');
$('filters').onclick = e => {
  const b = e.target.closest('.chip'); if (!b) return;
  activeFilter = b.dataset.f;
  for (const c of $('filters').querySelectorAll('.chip'))
    c.setAttribute('aria-pressed', c.dataset.f === activeFilter);
  drawCatalogue();
};
$('grid').onclick = e => {
  const b = e.target.closest('.card-try'); if (!b) return;
  S.model = MODELS.find(m => m.id === b.dataset.id);
  S.shape = 'all';
  for (const c of $('shapeTabs').querySelectorAll('.chip'))
    c.setAttribute('aria-pressed', c.dataset.shape === 'all');
  drawMinis(); render();
  $('configurator').scrollIntoView({ behavior:'smooth', block:'start' });
};

/* ---------- каталог ограждений ------------------------------------------- */
let fenceFilter = 'all';
const FENCE_FILTERS = [
  { id:'all',   label:'Все 36',      test:() => true },
  { id:'forge', label:'С ковкой',    test:f => f.forged },
  { id:'plain', label:'Без ковки',   test:f => !f.forged },
  { id:'p20',   label:'Столб 20×20', test:f => f.post === '20×20' },
  { id:'p30',   label:'Столб 30×30', test:f => f.post === '30×30' },
  { id:'p40',   label:'Столб 40×40', test:f => f.post === '40×40' },
  { id:'p60',   label:'Столб 60×60', test:f => f.post === '60×60' }
];
function drawFenceCat() {
  const f = FENCE_FILTERS.find(x => x.id === fenceFilter);
  const list = FENCE_DATA.filter(f.test);
  $('fCount').textContent = list.length + ' из 36';
  $('fgrid').innerHTML = list.map(o => `
    <article class="fcard">
      <div class="fcard-stage"><span class="card-code">Ограда № ${o.n}</span>
        <img src="${o.img}" alt="Ограда № ${o.n}" loading="lazy"></div>
      <div class="fcard-body">
        <div class="card-dims">
          <i>столб</i>труба ${o.post} мм<br>
          <i>пояс</i>труба ${o.belt} мм<br>
          <i>рисунок</i>${o.art} см · ${o.mat}
        </div>
        <div class="swatches">${COATINGS.map(c =>
          `<span class="sw" title="${c.label}" style="background:${c.dot}"></span>`).join('')}</div>
        <button class="card-try" data-fid="${o.id}">в конфигуратор →</button>
      </div>
    </article>`).join('');
}
$('ffilters').innerHTML = '<span class="eyebrow">Ковка и столб</span>' + FENCE_FILTERS.map(f =>
  `<button class="chip" data-f="${f.id}" aria-pressed="${f.id === fenceFilter}">${f.label}</button>`).join('');
$('ffilters').onclick = e => {
  const b = e.target.closest('.chip'); if (!b) return;
  fenceFilter = b.dataset.f;
  for (const c of $('ffilters').querySelectorAll('.chip'))
    c.setAttribute('aria-pressed', c.dataset.f === fenceFilter);
  drawFenceCat();
};
$('fgrid').onclick = e => {
  const b = e.target.closest('.card-try'); if (!b) return;
  S.fence = FENCES.find(f => f.id === b.dataset.fid);
  render();
  $('configurator').scrollIntoView({ behavior:'smooth', block:'start' });
};

/* ---------- каталог малых форм ------------------------------------------- */
let smallFilter = 'all';
const SMALL_FILTERS = [{ id:'all', label:'Все 44', test:() => true },
  ...Object.keys(KINDS).map(k => ({ id:k, label:KINDS[k].plural, test:o => o.kind === k }))];
function drawSmallCat() {
  const f = SMALL_FILTERS.find(x => x.id === smallFilter);
  const list = SMALL_DATA.filter(f.test);
  $('sCount').textContent = list.length + ' из ' + SMALL_DATA.length;
  $('sgrid').innerHTML = list.map(o => `
    <article class="scard">
      <div class="scard-stage"><img src="${o.img}" alt="${KINDS[o.kind].label} № ${o.n}" loading="lazy"></div>
      <div class="scard-body"><span>${KINDS[o.kind].label}</span><b>№ ${o.n}</b></div>
    </article>`).join('');
}
$('sfilters').innerHTML = '<span class="eyebrow">Раздел</span>' + SMALL_FILTERS.map(f =>
  `<button class="chip" data-f="${f.id}" aria-pressed="${f.id === smallFilter}">${f.label}</button>`).join('');
$('sfilters').onclick = e => {
  const b = e.target.closest('.chip'); if (!b) return;
  smallFilter = b.dataset.f;
  for (const c of $('sfilters').querySelectorAll('.chip'))
    c.setAttribute('aria-pressed', c.dataset.f === smallFilter);
  drawSmallCat();
};

/* ---------- контакты ----------------------------------------------------- */
const dlg = $('contactsDlg');
const openDlg = () => dlg.showModal();
$('openContacts').onclick = openDlg;
$('closeContacts').onclick = () => dlg.close();
for (const b of document.querySelectorAll('[data-contacts]')) b.onclick = openDlg;
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

drawMinis();
drawCatalogue();
drawFenceCat();
drawSmallCat();
render();

/* перестроить ряды при смене ширины окна */
let lastPerRow = perRow();
window.addEventListener('resize', () => {
  if (perRow() !== lastPerRow) { lastPerRow = perRow(); render(); }
});
