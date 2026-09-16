/* ---------- проекция ------------------------------------------------------
   Оси измерены по рендерам прайса: стела у изголовья, цветник идёт к зрителю.
   x — поперёк участка, y — высота, z — вглубь. Все размеры сцены в мм.     */
const AX = { x: -0.9885, y: -0.1517 };
const AZ = { x:  0.9537, y: -0.3007 };
const K  = { x: 0.1882, y: 0.205, z: 0.0918 };   // px на мм
const NORM_PX_MM = 0.40;                         // масштаб нормализованных рендеров
const BASE_PAD   = 14;                           // отступ базовой линии на холсте

const P = (x, y, z) => [ x * K.x * AX.x + z * K.z * AZ.x,
                         x * K.x * AX.y + z * K.z * AZ.y - y * K.y ];
const pt   = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
const poly = (pts, fill, extra) =>
  `<polygon points="${pts.map(pt).join(' ')}" fill="${fill}"${extra || ''}/>`;
const line = (a, b, w, col) =>
  `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;

/* ---------- участки ------------------------------------------------------ */
const PLOTS = [
  { id:'p1', label:'2,5 × 2 м',       l:2500, w:2000, note:'2,5 × 2 м — одно место' },
  { id:'p2', label:'2,5 × 3 м',       l:2500, w:3000, note:'2,5 × 3 м — два места' },
  { id:'p3', label:'Воинский сектор', l:2500, w:2500, note:'2,5 × 2,5 м — воинский сектор', war:true }
];

/* ---------- плита на могиле ---------------------------------------------- */
const STONE = {
  grey:  { label:'серый',         top:'#8B9093', side:'#6E7376', seam:'#757A7D' },
  white: { label:'белый',         top:'#D6D8D7', side:'#B4B7B6', seam:'#C2C4C3' },
  black: { label:'чёрный',        top:'#16191B', side:'#0D0F10', seam:'#23272A' },
  dark:  { label:'тёмно-серый',   top:'#474D50', side:'#343A3D', seam:'#565C5F' },
  soft:  { label:'светло-чёрный', top:'#2A2F33', side:'#1C2023', seam:'#3A4044' }
};
const FLOORS = [
  { id:'g1', label:'Гранит серый',         stone:'grey',  grid:600 },
  { id:'g2', label:'Гранит тёмно-серый',   stone:'dark',  grid:600 },
  { id:'g3', label:'Гранит светло-чёрный', stone:'soft',  grid:600 },
  { id:'g4', label:'Гранит чёрный',        stone:'black', grid:600 },
  { id:'g5', label:'Гранит белый',         stone:'white', grid:600 },
  { id:'f6', label:'Керамогранит',         fill:'#3E4447', line:'#2B3033', grid:600 },
  { id:'f7', label:'Тротуарная плитка',    fill:'#8F9391', line:'#797D7B', grid:300 },
  { id:'f8', label:'Искусственный газон',  fill:'#4C7342', line:'#446A3B', grass:true },
  { id:'f9', label:'Гранитная крошка',     fill:'#6B7175', line:'#5C6265', speck:true }
];

/* ---------- ограждения: каталог 2025 -------------------------------------
   Цвета покрытий измерены с фирменных плашек каталога.                     */
const COATINGS = [
  { id:'c1', label:'медный антик',   lo:'#240806', hi:'#7C3028', dot:'#672821' },
  { id:'c2', label:'чёрное серебро', lo:'#191919', hi:'#7A7A7A', dot:'#616161' },
  { id:'c3', label:'чёрный матовый', lo:'#0E0E0E', hi:'#3E3E3E', dot:'#323232' },
  { id:'c4', label:'зелёный антик',  lo:'#122019', hi:'#5A8873', dot:'#486E5C' },
  { id:'c5', label:'золотой антик',  lo:'#2A2314', hi:'#B5A074', dot:'#97855F' }
];
const FENCES = [{ id:'n0', n:0 }, ...FENCE_DATA];

const hex2rgb = h => [1,3,5].map(i => parseInt(h.slice(i, i+2), 16) / 255);
function coatFilter(c) {
  const lo = hex2rgb(c.lo), hi = hex2rgb(c.hi);
  const ch = ['R','G','B'].map((k,i) =>
    `<feFunc${k} type="table" tableValues="${lo[i].toFixed(3)} ${hi[i].toFixed(3)}"/>`).join('');
  return '<filter id="coat" color-interpolation-filters="sRGB">' +
         '<feColorMatrix type="saturate" values="0"/>' +
         `<feComponentTransfer>${ch}</feComponentTransfer></filter>`;
}

/* ---------- малые формы: каталог 2025 ------------------------------------ */
const KINDS = {
  table:  { label:'Стол',      plural:'Столы',    realH: 720 },
  bench:  { label:'Лавка',     plural:'Лавки',    realH: 760 },
  vase:   { label:'Ваза',      plural:'Вазы',     realH: 520 },
  cross:  { label:'Крест',     plural:'Кресты',   realH: 2000 },
  corner: { label:'Угол',      plural:'Углы',     realH: 600 },
  slab:   { label:'Надгробие', plural:'Надгробие',realH: 220 }
};
const BENCHES = SMALL_DATA.filter(o => o.kind === 'bench' || o.kind === 'table');
const VASES   = SMALL_DATA.filter(o => o.kind === 'vase');
const NONE    = { id:'none', kind:'none' };

/* ---------- плита -------------------------------------------------------- */
function drawFloor(W, L, f) {
  const INSET = Math.min(W, L) * 0.20;
  const s = f.stone ? STONE[f.stone] : null;
  const fill = s ? s.top : f.fill, seam = s ? s.seam : f.line;
  const i0 = INSET, iW = W - INSET, iL = L - INSET;
  const c = [P(i0,0,i0), P(iW,0,i0), P(iW,0,iL), P(i0,0,iL)];
  let out = poly(c, fill);
  if (f.grid) {
    let g = '';
    for (let x = i0 + f.grid; x < iW; x += f.grid) g += line(P(x,0,i0), P(x,0,iL), 1, seam);
    for (let z = i0 + f.grid; z < iL; z += f.grid) g += line(P(i0,0,z), P(iW,0,z), 1, seam);
    out += `<g opacity=".55">${g}</g>`;
  }
  if (f.grass) {
    let g = '';
    for (let x = i0+40; x < iW; x += 74)
      for (let z = i0+40; z < iL; z += 62) g += line(P(x,0,z), P(x, 30 + ((x*z) % 14), z), 1.1, '#5B8A4F');
    out += `<g opacity=".85">${g}</g>`;
  }
  if (f.speck) {
    let g = '';
    for (let x = i0+30; x < iW; x += 54)
      for (let z = i0+30; z < iL; z += 48) {
        const a = P(x + ((z % 3) * 11), 0, z);
        g += `<circle cx="${a[0].toFixed(1)}" cy="${a[1].toFixed(1)}" r="${1.3 + (x % 3) * 0.4}"/>`;
      }
    out += `<g fill="#878D90" opacity=".8">${g}</g>`;
  }
  return out + poly(c, 'none', ' stroke="#4A5053" stroke-width="1.1"');
}

/* основание под комплект: верх и две видимые боковины */
function slab(x0, z0, sx, sz, y, th, st) {
  return poly([P(x0,y,z0), P(x0+sx,y,z0), P(x0+sx,y,z0+sz), P(x0,y,z0+sz)], st.top)
       + poly([P(x0,y-th,z0), P(x0+sx,y-th,z0), P(x0+sx,y,z0), P(x0,y,z0)], st.side)
       + poly([P(x0,y-th,z0), P(x0,y-th,z0+sz), P(x0,y,z0+sz), P(x0,y,z0)], st.seam);
}

/* рендер из каталога, поставленный на точку участка */
function placed(item, x, z, realH, align) {
  const h = realH * K.y, w = h * (item.w / item.h);
  const a = P(x, 0, z);
  const left = a[0] - w * (align === 'left' ? 0.15 : 0.5);
  return `<image href="${item.img}" x="${left.toFixed(1)}" y="${(a[1] - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>`;
}

/* ---------- сцена -------------------------------------------------------- */
function buildScene(S) {
  const { model, plot, floor, fence, coat, bench, vase } = S;
  const W = plot.w, L = plot.l, xc = W / 2;

  /* рендеры нормализованы: общий масштаб, ближний угол основания по центру
     холста на базовой линии — поэтому посадка одинакова для всех моделей.  */
  const sc = K.y / NORM_PX_MM;
  const imgW = model.w * sc, imgH = model.h * sc;
  const face = model.cvetnik.find(c => c[0] < 1000) || model.cvetnik[0];
  const CW = face[0] + 150, CL = 1000 + (model.tumba ? model.tumba[1] : 160) + 120;
  const BW = CW + 150, BL = CL + 170, BH = 55;
  const zFront = Math.max(200, L - 320 - CL);
  const bx = xc - BW / 2, bz = zFront - (BL - CL) / 2;
  const anchor = P(xc - CW / 2, BH, zFront);
  const imgX = anchor[0] - imgW * 0.5;
  const imgY = anchor[1] - (model.h - BASE_PAD) * sc;

  const fs = floor.stone ? STONE[floor.stone] : null;
  const bed = slab(bx, bz, BW, BL, BH, BH,
    fs ? { top:fs.side, side:fs.seam, seam:fs.side } : { top:'#4A5053', side:'#31373A', seam:'#3C4245' });

  /* ограда из каталога: внутренняя площадка кадра — примерно 36…95 % высоты */
  let far = '', near = '', fbox = null;
  if (fence.n) {
    const pp = [P(0,0,0), P(W,0,0), P(W,0,L), P(0,0,L)];
    const pxs = pp.map(q => q[0]), pys = pp.map(q => q[1]);
    const px0 = Math.min(...pxs), px1 = Math.max(...pxs);
    const py0 = Math.min(...pys), py1 = Math.max(...pys);
    const IN_TOP = 0.36, IN_BOT = 0.95;
    const fw = (px1 - px0) * 1.12;
    const fh = (py1 - py0) / (IN_BOT - IN_TOP);
    const fx = px0 - (fw - (px1 - px0)) / 2;
    const fy = py1 + 14 - fh * IN_BOT;
    const img = `<image href="${fence.img}" x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" filter="url(#coat)"/>`;
    const cut = fy + fh * 0.66;
    far = img;
    near = `<clipPath id="fclip"><rect x="${fx.toFixed(1)}" y="${cut.toFixed(1)}" width="${fw.toFixed(1)}" height="${(fh * 0.34).toFixed(1)}"/></clipPath><g clip-path="url(#fclip)">${img}</g>`;
    fbox = [fx, fy, fw, fh];
  }

  const shadow = `<ellipse cx="${(anchor[0] + imgW * 0.06).toFixed(1)}" cy="${(anchor[1] + 2).toFixed(1)}" rx="${(imgW * 0.3).toFixed(1)}" ry="${(imgW * 0.045).toFixed(1)}" fill="#0B0C0D" opacity=".18"/>`;

  let props = '';
  if (vase.kind === 'vase') {
    const off = CW / 2 + 170;
    props += placed(vase, xc - off, zFront + CL - 120, KINDS.vase.realH)
           + placed(vase, xc + off, zFront + CL - 120, KINDS.vase.realH);
  }
  if (bench.kind !== 'none')
    props += placed(bench, W * 0.78, Math.min(460, zFront - 400), KINDS[bench.kind].realH);

  const plate = plot.war
    ? `<text x="${P(W,0,0)[0].toFixed(1)}" y="${(P(W,0,0)[1] + 26).toFixed(1)}" fill="#7C8387" font-family="IBM Plex Mono, monospace" font-size="12" letter-spacing="1.4">ВОИНСКИЙ СЕКТОР</text>`
    : '';

  const body = coatFilter(coat) + drawFloor(W, L, floor) + far + shadow + bed
    + `<image href="${model.img}" x="${imgX.toFixed(1)}" y="${imgY.toFixed(1)}" width="${imgW.toFixed(1)}" height="${imgH.toFixed(1)}"/>`
    + props + near + plate;

  const cor = [];
  for (const x of [0, W]) for (const z of [0, L]) for (const y of [0, 260]) cor.push(P(x,y,z));
  cor.push([imgX, imgY], [imgX + imgW, imgY + imgH]);
  if (fbox) cor.push([fbox[0], fbox[1] + fbox[3] * 0.30], [fbox[0] + fbox[2], fbox[1] + fbox[3]]);
  const xs = cor.map(p => p[0]), ys = cor.map(p => p[1]), pad = 28;
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
  const vw = Math.max(...xs) - x0 + pad, vh = Math.max(...ys) - y0 + pad;
  const fname = fence.n ? ('ограда ' + fence.n) : 'без ограды';
  return `<svg viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}" role="img" aria-label="Участок ${plot.note}: комплект ${model.code}, ${fname}, ${floor.label}">${body}</svg>`;
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
  $('scene').innerHTML = buildScene(S);
  const add = [S.bench.kind !== 'none' && `${KINDS[S.bench.kind].label.toLowerCase()} № ${S.bench.n}`,
               S.vase.kind === 'vase' && `ваза № ${S.vase.n}`].filter(Boolean);
  const fname = S.fence.n ? `ограда № ${S.fence.n}, ${S.coat.label}` : 'без ограды';
  $('sceneNote').textContent = [fname, S.floor.label.toLowerCase(), S.plot.note, ...add].join(' · ');
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
