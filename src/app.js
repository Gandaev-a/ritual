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

/* ---------- геометрия плана: константы, проверенные расчётом -------------
   Худший случай (торец цветника 700 мм, глубина тумбы 200 мм — максимумы по
   всем 34 моделям прайса) даёт зазор лавки/стола до передней ограды не менее
   140 мм и до вазы не менее 55 мм на самом узком участке 2,5×2 м. Проверено
   арифметически по факту, не на глаз — см. README.                        */
const FENCE_INSET = 90;     // условная толщина ограды на схеме, мм
const NO_FENCE_GAP = 20;    // отступ от края участка, если ограды нет
const GAP_BACK  = 200;      // от ограды до стелы
const GAP_FRONT = 120;      // от цветника до лавки/стола
const BLOCK_PAD = 60;       // отступ бетонного основания от стелы/тумбы/цветника
const BED_DEPTH = 1000;     // стандартная длина цветника
const VASE_R    = 55;       // радиус вазы на схеме, мм

const r1 = n => Math.round(n * 10) / 10;
const rect = (x, y, w, h, fill, extra='') =>
  `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${fill}" ${extra}/>`;
const circle = (cx, cy, rr, fill, extra='') =>
  `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(rr)}" fill="${fill}" ${extra}/>`;
const seg = (x1, y1, x2, y2, stroke, w=4, extra='') =>
  `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
const label = (x, y, txt, size=90, extra='') =>
  `<text x="${r1(x)}" y="${r1(y)}" font-family="IBM Plex Mono, monospace" font-size="${size}" ${extra}>${txt}</text>`;

/* ---------- план участка (вид сверху, 1 svg-единица = 1 мм) --------------- */
function buildPlan(S) {
  const { model, plot, floor, fence, coat, bench, vase } = S;
  const W = plot.w, L = plot.l;
  const inset = fence.n ? FENCE_INSET : NO_FENCE_GAP;
  const ix0 = inset, ix1 = W - inset, iy0 = inset, iy1 = L - inset;
  const iw = ix1 - ix0, il = iy1 - iy0;

  /* гранитный блок: реальная ширина по цветнику, реальная глубина по тумбе */
  const torec = (model.cvetnik.find(c => c[0] < 1000) || model.cvetnik[0])[0];
  const tumbaDepth = model.tumba ? model.tumba[1] : 160;
  const BW = torec + BLOCK_PAD * 2;
  const stoneDepth = tumbaDepth + BLOCK_PAD;
  const bx0 = (W - BW) / 2, bx1 = bx0 + BW;
  const by0 = iy0 + GAP_BACK, byMid = by0 + stoneDepth, by1 = byMid + BED_DEPTH;

  const st = floor.stone ? STONE[floor.stone] : null;
  const groundFill = st ? st.top : floor.fill;
  const groundLine = st ? st.line : floor.line;

  let g = '';
  /* фон покрытия внутри ограды + текстура */
  g += rect(ix0, iy0, iw, il, groundFill);
  if (floor.grid) {
    let l = '';
    for (let x = ix0 + floor.grid; x < ix1; x += floor.grid) l += seg(x, iy0, x, iy1, groundLine, 3);
    for (let y = iy0 + floor.grid; y < iy1; y += floor.grid) l += seg(ix0, y, ix1, y, groundLine, 3);
    g += `<g opacity=".5">${l}</g>`;
  }
  if (floor.grass) {
    let l = '';
    for (let x = ix0 + 60; x < ix1; x += 110)
      for (let y = iy0 + 60; y < iy1; y += 95) l += seg(x, y, x + ((x*y) % 20 - 10), y - 55, groundLine, 5, 'stroke-linecap="round"');
    g += `<g opacity=".8">${l}</g>`;
  }
  if (floor.speck) {
    let l = '';
    for (let x = ix0 + 45; x < ix1; x += 85)
      for (let y = iy0 + 45; y < iy1; y += 75) l += circle(x + ((y % 3) * 16), y, 5 + (x % 3) * 2, groundLine);
    g += `<g opacity=".7">${l}</g>`;
  }
  g += rect(ix0, iy0, iw, il, 'none', 'stroke="var(--plan-ink)" stroke-width="4" opacity=".55"');

  /* контур участка (пунктир) */
  g += rect(4, 4, W - 8, L - 8, 'none', 'stroke="var(--plan-dim)" stroke-width="6" stroke-dasharray="20 16"');

  /* ограда: прямоугольник + угловые столбы, цвет — маркер покрытия */
  if (fence.n) {
    const fc = coat.dot;
    g += rect(ix0, iy0, iw, il, 'none', `stroke="${fc}" stroke-width="14"`);
    for (const [px, py] of [[ix0,iy0],[ix1,iy0],[ix0,iy1],[ix1,iy1]])
      g += rect(px - 16, py - 16, 32, 32, fc);
  }

  /* гранитный блок: тумба + стела сзади, цветник (с газоном) спереди */
  g += rect(bx0, by0, BW, stoneDepth, '#33383B');
  g += rect(bx0, byMid, BW, BED_DEPTH, '#484D50');
  let bed = '';
  for (let x = bx0 + 55; x < bx1 - 20; x += 60)
    for (let y = byMid + 55; y < by1 - 20; y += 78) bed += seg(x, y, x + 6, y - 40, '#5B8A4F', 6, 'stroke-linecap="round"');
  g += bed;
  g += rect(bx0, by0, BW, by1 - by0, 'none', 'stroke="#202426" stroke-width="5"');
  g += seg(bx0, byMid, bx1, byMid, '#202426', 6);

  /* вазы у переднего края цветника */
  if (vase.kind === 'vase') {
    g += circle(bx0 - 30, by1 + 10, VASE_R, '#3D4245', 'stroke="#202426" stroke-width="4"');
    g += circle(bx1 + 30, by1 + 10, VASE_R, '#3D4245', 'stroke="#202426" stroke-width="4"');
    g += label(bx0 - 30, by1 + 10 + VASE_R + 55, 'ваза', 46, 'fill="var(--plan-dim)" text-anchor="middle"');
  }

  /* лавка или стол — по центру, за цветником */
  if (bench.kind !== 'none') {
    const fw = KINDS[bench.kind].fw, fd = KINDS[bench.kind].fd;
    const fx = (W - fw) / 2, fy = by1 + GAP_FRONT;
    g += rect(fx, fy, fw, fd, '#3D4245', 'stroke="#202426" stroke-width="5"');
    if (bench.kind === 'bench') g += seg(fx + 30, fy + 22, fx + fw - 30, fy + 22, '#202426', 5);
    g += label(fx + fw / 2, fy + fd + 60, KINDS[bench.kind].label.toLowerCase(), 46,
               'fill="var(--plan-dim)" text-anchor="middle"');
  }

  /* подписи */
  g += label(24, L - 24, plot.note, 62, 'fill="var(--plan-dim)"');
  if (fence.n) g += label(W - 24, 78, `ограда № ${fence.n}`, 62, 'fill="var(--plan-dim)" text-anchor="end"');

  /* масштабная линейка: 500 мм */
  const sx = W - 24 - 500, sy = L - 60;
  g += seg(sx, sy, sx + 500, sy, 'var(--plan-ink)', 5) + seg(sx, sy-14, sx, sy+14, 'var(--plan-ink)', 5)
     + seg(sx+500, sy-14, sx+500, sy+14, 'var(--plan-ink)', 5)
     + label(sx + 250, sy - 20, '0,5 м', 40, 'fill="var(--plan-dim)" text-anchor="middle"');

  return `<svg viewBox="0 0 ${W} ${L}" role="img" aria-label="План участка ${plot.note}: комплект № ${model.code}${fence.n ? ', ограда № ' + fence.n : ', без ограды'}, ${floor.label.toLowerCase()}">${g}</svg>`;
}

/* ---------- галерея «ваш комплект»: чёткие фото, без монтажа ------------- */
function buildKit(S) {
  const items = [{ label: 'Памятник', code: S.model.code, img: S.model.img }];
  if (S.fence.n) items.push({ label: 'Ограда', code: S.fence.n, img: S.fence.img, coat: S.coat });
  if (S.bench.kind !== 'none') items.push({ label: KINDS[S.bench.kind].label, code: S.bench.n, img: S.bench.img });
  if (S.vase.kind === 'vase') items.push({ label: 'Ваза', code: S.vase.n, img: S.vase.img });
  return items.map(o => `
    <div class="kit-card">
      <div class="kit-card-img"><img src="${o.img}" alt="${o.label} № ${o.code}" loading="lazy"></div>
      <div class="kit-card-label"><b>${o.label} № ${o.code}</b>${o.coat ? `<span class="kit-dot" style="background:${o.coat.dot}" title="${o.coat.label}"></span>` : ''}</div>
    </div>`).join('');
}
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
  $('scene').innerHTML = buildPlan(S);
  $('kit').innerHTML = buildKit(S);
  const coatTxt = S.fence.n ? `, покрытие ${S.coat.label}` : '';
  $('sceneNote').textContent = `${S.floor.label.toLowerCase()}${coatTxt} · план в масштабе, фото комплекта — ниже`;
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
