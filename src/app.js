/* ---------- проекция ------------------------------------------------------
   Оси измерены по рендерам из прайса (tools/extract_price.py): стела стоит
   у изголовья, цветник уходит к зрителю. Все размеры сцены — в миллиметрах.
   x — поперёк участка, y — высота, z — вглубь, к изголовью.                */
const AX = { x: -0.9885, y: -0.1517 };
const AZ = { x:  0.9537, y: -0.3007 };
const K  = { x: 0.1882, y: 0.205, z: 0.0918 };   // px на мм

const P = (x, y, z) => [ x * K.x * AX.x + z * K.z * AZ.x,
                         x * K.x * AX.y + z * K.z * AZ.y - y * K.y ];
const pt   = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
const poly = (pts, fill, extra) =>
  `<polygon points="${pts.map(pt).join(' ')}" fill="${fill}"${extra || ''}/>`;
const line = (a, b, w, col) =>
  `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;

/* ---------- участки ------------------------------------------------------ */
const PLOTS = [
  { id:'p1', label:'2,5 × 2 м',   l:2500, w:2000, note:'2,5 × 2 м — одно место' },
  { id:'p2', label:'2,5 × 3 м',   l:2500, w:3000, note:'2,5 × 3 м — два места' },
  { id:'p3', label:'Воинский сектор', l:2500, w:2500, note:'2,5 × 2,5 м — воинский сектор', war:true }
];

/* ---------- покрытие ----------------------------------------------------- */
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
  { id:'f6', label:'Керамогранит',  fill:'#3E4447', line:'#2B3033', grid:600 },
  { id:'f7', label:'Тротуарная плитка', fill:'#8F9391', line:'#797D7B', grid:300 },
  { id:'f8', label:'Искусственный газон', fill:'#4C7342', line:'#446A3B', grass:true },
  { id:'f9', label:'Гранитная крошка', fill:'#6B7175', line:'#5C6265', speck:true }
];

/* ---------- ограждения: каталог 2025 ---------------------------------------
   Рендеры и характеристики сняты со страниц каталога (tools/extract_fences.py),
   цвета покрытий измерены с фирменных плашек.                              */
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

/* ---------- малые формы -------------------------------------------------- */
const EXTRAS = [
  { id:'bench', label:'Скамейка со столом' },
  { id:'vases', label:'Вазы' }
];
const EXTRA_STONES = ['black', 'dark', 'grey', 'soft', 'white'];

/* ---------- покрытие: отрисовка ------------------------------------------ */
function drawFloor(W, L, f) {
  const INSET = Math.min(W, L) * 0.17;   // плита ложится внутрь ограды
  const s = f.stone ? STONE[f.stone] : null;
  const fill = s ? s.top : f.fill, seam = s ? s.seam : f.line;
  const i0 = INSET, i1W = W - INSET, i1L = L - INSET;
  const c = [P(i0,0,i0), P(i1W,0,i0), P(i1W,0,i1L), P(i0,0,i1L)];
  let out = poly(c, fill);
  if (f.grid) {
    let g = '';
    for (let x = i0 + f.grid; x < i1W; x += f.grid) g += line(P(x,0,i0), P(x,0,i1L), 1, seam);
    for (let z = i0 + f.grid; z < i1L; z += f.grid) g += line(P(i0,0,z), P(i1W,0,z), 1, seam);
    out += `<g opacity=".55">${g}</g>`;
  }
  if (f.grass) {
    let g = '';
    for (let x = i0+40; x < i1W; x += 74)
      for (let z = i0+40; z < i1L; z += 62) g += line(P(x,0,z), P(x, 30 + ((x*z) % 14), z), 1.1, '#5B8A4F');
    out += `<g opacity=".85">${g}</g>`;
  }
  if (f.speck) {
    let g = '';
    for (let x = i0+30; x < i1W; x += 54)
      for (let z = i0+30; z < i1L; z += 48) {
        const a = P(x + ((z % 3) * 11), 0, z);
        g += `<circle cx="${a[0].toFixed(1)}" cy="${a[1].toFixed(1)}" r="${1.3 + (x % 3) * 0.4}"/>`;
      }
    out += `<g fill="#878D90" opacity=".8">${g}</g>`;
  }
  return out + poly(c, 'none', ' stroke="#4A5053" stroke-width="1.1"');
}

/* ---------- малые формы: отрисовка --------------------------------------- */
/* прямоугольная плита толщиной th на высоте y — верх и две видимые боковины */
function slab(x0, z0, sx, sz, y, th, st) {
  return poly([P(x0,y,z0), P(x0+sx,y,z0), P(x0+sx,y,z0+sz), P(x0,y,z0+sz)], st.top)
       + poly([P(x0,y-th,z0), P(x0+sx,y-th,z0), P(x0+sx,y,z0), P(x0,y,z0)], st.side)
       + poly([P(x0,y-th,z0), P(x0,y-th,z0+sz), P(x0,y,z0+sz), P(x0,y,z0)], st.seam);
}
function drawBench(x0, z0, st) {
  const leg = (x, z, sx, sz, h) =>
    poly([P(x,0,z), P(x+sx,0,z), P(x+sx,h,z), P(x,h,z)], st.side) +
    poly([P(x,0,z), P(x,0,z+sz), P(x,h,z+sz), P(x,h,z)], st.seam);
  let s = '';
  s += leg(x0+150, z0+70, 70, 300, 360) + leg(x0+880, z0+70, 70, 300, 360);
  s += slab(x0, z0, 1100, 340, 400, 45, st);                 // лавка
  s += leg(x0+330, z0+880, 80, 380, 660) + leg(x0+700, z0+880, 80, 380, 660);
  s += slab(x0+110, z0+840, 900, 460, 700, 50, st);          // стол
  return s;
}

function drawVase(x, z, st) {
  const h = 300, rT = 82, rB = 56, foot = 30;
  const c = P(x, h, z), f = P(x, foot, z);
  return poly([P(x-rB,foot,z), P(x+rB,foot,z), P(x+rT,h,z), P(x-rT,h,z)], st.side)
    + poly([P(x-rB-18,0,z), P(x+rB+18,0,z), P(x+rB+18,foot,z), P(x-rB-18,foot,z)], st.seam)
    + `<ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="${(rT*K.x).toFixed(1)}" ry="${(rT*K.x*0.45).toFixed(1)}" fill="${st.top}"/>`
    + `<ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="${(rT*K.x*0.62).toFixed(1)}" ry="${(rT*K.x*0.28).toFixed(1)}" fill="${st.side}"/>`;
}

/* ---------- сцена -------------------------------------------------------- */
function buildScene(model, plot, floor, fence, extras, extraStone, coat) {
  const W = plot.w, L = plot.l, xc = W / 2;
  const st = STONE[extraStone];

  /* Рендер масштабируется по высоте стелы, а посадочное пятно подгоняется
     под рендер — гранит всегда стоит ровно на своей плите.                 */
  const pngH = (model.stela[0] + 380) * K.y;
  const pngW = pngH * (model.w / model.h);
  const face = model.cvetnik.find(c => c[0] < 1000) || model.cvetnik[0];
  const CW0 = face[0] + 110, CL0 = 1000 + (model.tumba ? model.tumba[1] : 160) + 70;
  const fit = pngW / (CW0 * K.x * Math.abs(AX.x) + CL0 * K.z * AZ.x);
  const CW = CW0 * fit, CL = CL0 * fit;

  const BW = CW + 130, BL = CL + 150, BH = 55;      // основание под комплект
  const backGap = 320;                              // отступ от изголовья
  const zFront = Math.max(200, L - backGap - CL);
  const bx = xc - BW / 2, bz = zFront - (BL - CL) / 2;
  const anchor = P(xc - CW / 2, BH, zFront);

  const imgX = anchor[0] - model.ax * pngW;
  const imgY = anchor[1] - model.ay * pngH;

  const fs = floor.stone ? STONE[floor.stone] : null;   // основание в тон плиты
  const bedStone = fs ? { top:fs.side, side:fs.seam, seam:fs.side }
                      : { top:'#4A5053', side:'#31373A', seam:'#3C4245' };
  const bed = slab(bx, bz, BW, BL, BH, BH, bedStone);

  /* Ограда — рендер из каталога: кладётся на габарит участка, ближняя половина
     повторяется поверх памятника, чтобы он стоял внутри, а не перед оградой. */
  let far = '', near = '', fbox = null;
  if (fence.n) {
    const pp = [P(0,0,0), P(W,0,0), P(W,0,L), P(0,0,L)];
    const pxs = pp.map(q => q[0]), pys = pp.map(q => q[1]);
    const px0 = Math.min(...pxs), px1 = Math.max(...pxs), py1 = Math.max(...pys);
    /* внутренняя площадка занимает по высоте кадра примерно от 36 % до 95 %:
       растягиваем рендер так, чтобы она совпала с габаритом участка */
    const py0 = Math.min(...pys);
    const IN_TOP = 0.36, IN_BOT = 0.95;
    const fw = (px1 - px0) * 1.12;
    const fh = (py1 - py0) / (IN_BOT - IN_TOP);
    const fx = px0 - (fw - (px1 - px0)) / 2;
    const fy = py1 + 14 - fh * IN_BOT;
    const img = `<image href="${fence.img}" x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" filter="url(#coat)"/>`;
    const cut = fy + fh * 0.66;
    far  = img;
    near = `<clipPath id="fclip"><rect x="${fx.toFixed(1)}" y="${cut.toFixed(1)}" width="${fw.toFixed(1)}" height="${(fh * 0.34).toFixed(1)}"/></clipPath><g clip-path="url(#fclip)">${img}</g>`;
    fbox = [fx, fy, fw, fh];
  }

  const shadow = `<ellipse cx="${(anchor[0] + pngW * 0.1).toFixed(1)}" cy="${(anchor[1] + 2).toFixed(1)}" rx="${(pngW * 0.34).toFixed(1)}" ry="${(pngW * 0.05).toFixed(1)}" fill="#0B0C0D" opacity=".18"/>`;

  let props = '';
  if (extras.vases) {
    const off = CW / 2 + 190;
    props += drawVase(xc - off, zFront + CL - 260, st) + drawVase(xc + off, zFront + CL - 260, st);
  }
  let benchBox = null;
  if (extras.bench) {
    const bxx = Math.min(xc + 120, W - 1320), bzz = 260;
    props += drawBench(bxx, bzz, st);
    benchBox = [bxx, bzz, 1160, 1260];
  }

  const plate = plot.war ? `<text x="${P(W,0,0)[0].toFixed(1)}" y="${(P(W,0,0)[1] + 26).toFixed(1)}" fill="#7C8387" font-family="IBM Plex Mono, monospace" font-size="12" letter-spacing="1.4">ВОИНСКИЙ СЕКТОР</text>` : '';

  const body = coatFilter(coat) + drawFloor(W, L, floor) + far + shadow + bed
    + `<image href="${model.img}" x="${imgX.toFixed(1)}" y="${imgY.toFixed(1)}" width="${pngW.toFixed(1)}" height="${pngH.toFixed(1)}"/>`
    + props + near + plate;

  /* viewBox по всем нарисованным объектам */
  const cor = [];
  for (const x of [0, W]) for (const z of [0, L]) for (const y of [0, 900]) cor.push(P(x,y,z));
  if (fbox) cor.push([fbox[0], fbox[1]], [fbox[0] + fbox[2], fbox[1] + fbox[3]]);
  cor.push([imgX, imgY], [imgX + pngW, imgY + pngH]);
  if (benchBox) { const [a,b,c,d] = benchBox; cor.push(P(a,780,b), P(a+c,0,b+d)); }
  const xs = cor.map(p => p[0]), ys = cor.map(p => p[1]), pad = 30;
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
  const vw = Math.max(...xs) - x0 + pad, vh = Math.max(...ys) - y0 + pad;

  const fenceName = fence.n ? ("ограда " + fence.n) : "без ограды";
  return `<svg viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}" role="img" aria-label="Участок ${plot.note}: комплект ${model.code}, ${fenceName}, ${floor.label}">${body}</svg>`;
}

/* ---------- состояние ---------------------------------------------------- */
const S = { model: MODELS[0], plot: PLOTS[0], floor: FLOORS[0], fence: FENCES[1], coat: COATINGS[2],
            extras: { bench:false, vases:false }, extraStone:'black', shape:'all' };
const $  = id => document.getElementById(id);
const mm  = a => a ? a.join(' × ') : '—';
const rub = n => n.toLocaleString('ru-RU') + ' ₽';

function chipRow(host, items, key) {
  host.innerHTML = items.map(o =>
    `<button class="chip" data-id="${o.id}" aria-pressed="${S[key].id === o.id}">${o.label}</button>`).join('');
  host.onclick = e => {
    const b = e.target.closest('.chip'); if (!b) return;
    S[key] = items.find(o => o.id === b.dataset.id); render();
  };
}

function render() {
  $('scene').innerHTML = buildScene(S.model, S.plot, S.floor, S.fence, S.extras, S.extraStone, S.coat);
  const add = [S.extras.bench && 'скамейка со столом', S.extras.vases && 'вазы'].filter(Boolean);
  const fname = S.fence.n ? `ограда № ${S.fence.n}, ${S.coat.label}` : 'без ограды';
  $('sceneNote').textContent = [fname, S.floor.label.toLowerCase(), S.plot.note, ...add].join(' · ');
  $('oFence').textContent = S.fence.n ? '№ ' + S.fence.n : '—';
  $('coatRow').hidden = !S.fence.n;
  $('oCode').textContent  = '№ ' + S.model.code;
  $('oShape').textContent = S.model.fig ? 'фигурная' : 'прямая';
  $('oStela').textContent = mm(S.model.stela);
  $('oTumba').textContent = mm(S.model.tumba);
  $('oCvet').textContent  = S.model.cvetnik.map(c => c.join('×')).join(' + ');
  $('oPlot').textContent  = S.plot.note;
  $('oPrice').textContent = rub(S.model.price);
  for (const b of document.querySelectorAll('#minis .mini'))
    b.setAttribute('aria-pressed', b.dataset.id === S.model.id);
  for (const [host, items, key] of [['floors',FLOORS,'floor'],['plots',PLOTS,'plot'],['coats',COATINGS,'coat']])
    for (const b of $(host).querySelectorAll('.chip'))
      b.setAttribute('aria-pressed', b.dataset.id === S[key].id);
  for (const b of $('fences').querySelectorAll('.fmini'))
    b.setAttribute('aria-pressed', b.dataset.id === S.fence.id);
  for (const b of $('extras').querySelectorAll('.chip'))
    b.setAttribute('aria-pressed', !!S.extras[b.dataset.id]);
  $('stoneRow').hidden = !(S.extras.bench || S.extras.vases);
  for (const b of $('stones').querySelectorAll('.chip'))
    b.setAttribute('aria-pressed', b.dataset.id === S.extraStone);
}

/* миниатюры памятников с фильтром по форме */
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
chipRow($('coats'), COATINGS, 'coat');
chipRow($('floors'), FLOORS, 'floor');
chipRow($('plots'),  PLOTS,  'plot');

/* ограждения: плитка рендеров из каталога */
$('fences').innerHTML = FENCES.map(f => f.n
  ? `<button class="mini fmini" data-id="${f.id}" aria-pressed="${f.id === S.fence.id}" title="Ограда № ${f.n} — столб ${f.post}, рисунок ${f.art} см"><span>${f.n}</span><img src="${f.img}" alt="Ограда № ${f.n}" loading="lazy"></button>`
  : `<button class="mini fmini fnone" data-id="${f.id}" aria-pressed="${f.id === S.fence.id}">без<br>ограды</button>`).join('');
$('fences').onclick = e => {
  const b = e.target.closest('.fmini'); if (!b) return;
  S.fence = FENCES.find(f => f.id === b.dataset.id); render();
};

$('extras').innerHTML = EXTRAS.map(x =>
  `<button class="chip" data-id="${x.id}" aria-pressed="false">${x.label}</button>`).join('');
$('extras').onclick = e => {
  const b = e.target.closest('.chip'); if (!b) return;
  S.extras[b.dataset.id] = !S.extras[b.dataset.id]; render();
};
$('stones').innerHTML = EXTRA_STONES.map(k =>
  `<button class="chip chip-stone" data-id="${k}" aria-pressed="${k === S.extraStone}"><i style="background:${STONE[k].top}"></i>${STONE[k].label}</button>`).join('');
$('stones').onclick = e => {
  const b = e.target.closest('.chip'); if (!b) return;
  S.extraStone = b.dataset.id; render();
};

/* ---------- каталог ------------------------------------------------------ */
const SIZES = [...new Set(MODELS.map(m => m.stela.join('×')))]
  .sort((a, b) => { const [ah,aw] = a.split('×').map(Number), [bh,bw] = b.split('×').map(Number);
                    return ah - bh || aw - bw; });
const FILTERS = [
  { id:'all',  label:'Все 33',   test:() => true },
  { id:'fig',  label:'Фигурные', test:m => m.fig },
  { id:'plain',label:'Прямые',   test:m => !m.fig },
  ...SIZES.map(s => ({ id:'s' + s, label:s, test:m => m.stela.join('×') === s }))
];
let activeFilter = 'all';

function drawCatalogue() {
  const f = FILTERS.find(x => x.id === activeFilter);
  const list = MODELS.filter(f.test);
  $('gridCount').textContent = list.length + ' из 33';
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
          <span class="card-price">${rub(m.price)}</span>
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

drawMinis();
drawCatalogue();
render();

/* ---------- каталог ограждений ------------------------------------------- */
let fenceFilter = 'all';
const FENCE_FILTERS = [
  { id:'all',   label:'Все 36',        test:() => true },
  { id:'forge', label:'С ковкой',      test:f => f.forged },
  { id:'plain', label:'Без ковки',     test:f => !f.forged },
  { id:'p20',   label:'Столб 20×20',   test:f => f.post === '20×20' },
  { id:'p30',   label:'Столб 30×30',   test:f => f.post === '30×30' },
  { id:'p40',   label:'Столб 40×40',   test:f => f.post === '40×40' },
  { id:'p60',   label:'Столб 60×60',   test:f => f.post === '60×60' }
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
drawFenceCat();
