/* ---------- участки ------------------------------------------------------ */
const PLOTS = [
  { id:'p1', label:'2,5 × 2 м',       l:2500, w:2000, note:'2,5 × 2 м — одно место' },
  { id:'p2', label:'2,5 × 3 м',       l:2500, w:3000, note:'2,5 × 3 м — два места' },
  { id:'p3', label:'Воинский сектор', l:2500, w:2500, note:'2,5 × 2,5 м — воинский сектор', war:true }
];

/* ---------- плита на могиле ---------------------------------------------- */
const STONE = {
  grey:  { label:'серый',         top:'#8B9093', line:'#757A7D', side:'#6E7376', deep:'#5C6164' },
  white: { label:'белый',         top:'#D6D8D7', line:'#C2C4C3', side:'#B4B7B6', deep:'#9EA1A0' },
  black: { label:'чёрный',        top:'#16191B', line:'#3A3F42', side:'#0D0F10', deep:'#08090A' },
  dark:  { label:'тёмно-серый',   top:'#474D50', line:'#5A6064', side:'#343A3D', deep:'#2A2F32' },
  soft:  { label:'светло-чёрный', top:'#2A2F33', line:'#40464A', side:'#1C2023', deep:'#141719' }
};
const FLOORS = [
  { id:'g1', label:'Гранит серый',         stone:'grey',  grid:600 },
  { id:'g2', label:'Гранит тёмно-серый',   stone:'dark',  grid:600 },
  { id:'g3', label:'Гранит светло-чёрный', stone:'soft',  grid:600 },
  { id:'g4', label:'Гранит чёрный',        stone:'black', grid:600 },
  { id:'g5', label:'Гранит белый',         stone:'white', grid:600 },
  { id:'f6', label:'Керамогранит',         fill:'#3E4447', line:'#565C60', side:'#2B3033', grid:600 },
  { id:'f7', label:'Тротуарная плитка',    fill:'#8F9391', line:'#797D7B', side:'#6F7371', grid:300 },
  { id:'f8', label:'Искусственный газон',  fill:'#4C7342', line:'#5B8A4F', side:'#3A5A33', grass:true },
  { id:'f9', label:'Гранитная крошка',     fill:'#6B7175', line:'#878D90', side:'#4F5559', speck:true }
];

/* ---------- ограждения: каталог 2025 -------------------------------------
   Только для раздела каталога: в конфигураторе ограждений нет.
   Цвета покрытий измерены с фирменных плашек каталога.                     */
const COATINGS = [
  { id:'c1', label:'медный антик',   dot:'#672821' },
  { id:'c2', label:'чёрное серебро', dot:'#616161' },
  { id:'c3', label:'чёрный матовый', dot:'#323232' },
  { id:'c4', label:'зелёный антик',  dot:'#486E5C' },
  { id:'c5', label:'золотой антик',  dot:'#97855F' }
];

/* ---------- малые формы: каталог 2025 ------------------------------------ */
const KINDS = {
  table:  { label:'Стол',      plural:'Столы' },
  bench:  { label:'Лавка',     plural:'Лавки' },
  vase:   { label:'Ваза',      plural:'Вазы' },
  cross:  { label:'Крест',     plural:'Кресты' },
  corner: { label:'Угол',      plural:'Углы' },
  slab:   { label:'Надгробие', plural:'Надгробие' }
};
const BENCHES = SMALL_DATA.filter(o => o.kind === 'bench' || o.kind === 'table');
const VASES   = SMALL_DATA.filter(o => o.kind === 'vase');
const NONE    = { id:'none', kind:'none' };

/* ---------- проекция ------------------------------------------------------
   Оси измерены по рендерам прайса: стела у изголовья, цветник идёт к зрителю.
   x — поперёк участка, y — высота, z — вдоль участка (от зрителя). Размеры в мм.
   Ограждений в сцене нет: их фото сняты под другим углом и вставали криво
   (расхождение базовой линии до 6°, см. README), — они остаются в каталоге.  */
const AX = { x: -0.9885, y: -0.1517 };
const AZ = { x:  0.9537, y: -0.3007 };
const K  = { x: 0.1882, y: 0.205, z: 0.0918 };   // px на мм
const NORM_PX_MM = 0.40;                         // масштаб нормализованных рендеров памятников
const BASE_PAD   = 14;                           // отступ базовой линии на холсте памятника
const FLOOR_TH   = 60;                           // толщина плиты участка, мм
const BED_TH     = 55;                           // основание под комплект, мм

const P = (x, y, z) => [ x * K.x * AX.x + z * K.z * AZ.x,
                         x * K.x * AX.y + z * K.z * AZ.y - y * K.y ];
/* точка экрана -> координаты на земле (y = 0): обратная к P */
function ground([sx, sy]) {
  const a = K.x * AX.x, b = K.z * AZ.x, c = K.x * AX.y, d = K.z * AZ.y, det = a * d - b * c;
  return [(sx * d - b * sy) / det, (a * sy - c * sx) / det];
}
const pt   = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
const poly = (pts, fill, extra) =>
  `<polygon points="${pts.map(pt).join(' ')}" fill="${fill}"${extra || ''}/>`;
const line = (a, b, w, col) =>
  `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;

/* плита: верх и две видимые боковины */
function slab(x0, z0, sx, sz, y, th, top, side, end) {
  return poly([P(x0,y,z0), P(x0+sx,y,z0), P(x0+sx,y,z0+sz), P(x0,y,z0+sz)], top)
       + poly([P(x0,y-th,z0), P(x0+sx,y-th,z0), P(x0+sx,y,z0), P(x0,y,z0)], side)
       + poly([P(x0,y-th,z0), P(x0,y-th,z0+sz), P(x0,y,z0+sz), P(x0,y,z0)], end);
}

/* покрытие на весь участок: плита с толщиной, швы, газон или крошка поверх */
function drawFloor(W, L, f) {
  const st = f.stone ? STONE[f.stone] : null;
  const top = st ? st.top : f.fill, seam = st ? st.line : f.line;
  const side = st ? st.side : f.side, y = 0;
  let out = slab(0, 0, W, L, y, FLOOR_TH, top, side, side);
  if (f.grid) {
    let g = '';
    for (let x = f.grid; x < W; x += f.grid) g += line(P(x,y,0), P(x,y,L), 1, seam);
    for (let z = f.grid; z < L; z += f.grid) g += line(P(0,y,z), P(W,y,z), 1, seam);
    out += `<g opacity=".6">${g}</g>`;
  }
  if (f.grass) {
    let g = '';
    for (let x = 40; x < W; x += 74)
      for (let z = 40; z < L; z += 62) g += line(P(x,y,z), P(x, y + 30 + ((x*z) % 14), z), 1.1, seam);
    out += `<g opacity=".85">${g}</g>`;
  }
  if (f.speck) {
    let g = '';
    for (let x = 30; x < W; x += 54)
      for (let z = 30; z < L; z += 48) {
        const a = P(x + ((z % 3) * 11), y, z);
        g += `<circle cx="${a[0].toFixed(1)}" cy="${a[1].toFixed(1)}" r="${1.3 + (x % 3) * 0.4}"/>`;
      }
    out += `<g fill="${seam}" opacity=".8">${g}</g>`;
  }
  return out + poly([P(0,y,0), P(W,y,0), P(W,y,L), P(0,y,L)], 'none', ' stroke="#ffffff" stroke-opacity=".35" stroke-width="1"');
}

/* малые формы: реальная опорная величина из каталога — по ней объект приводится
   к масштабу сцены. Стоят низом объекта (bbox непрозрачных пикселей) на точке. */
const REAL = {
  bench: { dim:'w', mm:1000 },   // длина лавки 100 см
  table: { dim:'w', mm:600 },    // столешница 50 × 60 см или d 60 см (столб H = 100 см
                                 // на фото виден не целиком, по нему масштаб не сходится)
  vase:  { dim:'h', mm:450 }     // высота вазы 40–50 см
};
function fit(o, gx, gy) {
  const r = REAL[o.kind];
  const objW = o.bw * o.w, objH = o.bh * o.h;
  const s = r.dim === 'w' ? (r.mm * K.x * -AX.x) / objW : (r.mm * K.y) / objH;
  const w = objW * s, h = objH * s;
  return { o, s, x: gx - w / 2, y: gy - h, w, h };          // габарит объекта на сцене
}
const imgTag = q =>
  `<image href="${q.o.img}" x="${(q.x - q.o.bx * q.o.w * q.s).toFixed(1)}" y="${(q.y - q.o.by * q.o.h * q.s).toFixed(1)}" width="${(q.o.w * q.s).toFixed(1)}" height="${(q.o.h * q.s).toFixed(1)}"/>`;
/* контур памятника на сцене (tools/spans.py): крайние непрозрачные пиксели
   в полосах холста между y0 и y1 — то, что реально видно на фото           */
function monSpan(model, mon, y0, y1) {
  const sc = mon.w / model.w, B = model.sb, n = model.span.length / 2;
  const i0 = Math.max(0, Math.floor((y0 - mon.y) / sc / B));
  const i1 = Math.min(n - 1, Math.floor((y1 - mon.y) / sc / B));
  let l = Infinity, r = -Infinity;
  for (let i = i0; i <= i1; i++) {
    if (model.span[2 * i] < 0) continue;
    l = Math.min(l, model.span[2 * i]); r = Math.max(r, model.span[2 * i + 1] + 1);
  }
  return [mon.x + l * sc, mon.x + r * sc];
}
const hit = (a, b, gap = 6) =>
  a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;

/* ---------- сцена: памятник на участке ----------------------------------- */
function layout(S) {
  const { model, plot, bench, vase } = S;
  const W = plot.w, L = plot.l, xc = W / 2;

  /* рендеры памятников нормализованы: общий масштаб, ближний угол основания
     по центру холста на базовой линии — посадка одинакова для всех моделей.  */
  const sc = K.y / NORM_PX_MM;
  const imgW = model.w * sc, imgH = model.h * sc;
  const face = model.cvetnik.find(c => c[0] < 1000) || model.cvetnik[0];
  const CW = face[0] + 150, CL = 1000 + (model.tumba ? model.tumba[1] : 160) + 120;
  const BW = CW + 150, BL = CL + 170;
  const zFront = Math.max(200, L - 320 - CL);
  const bed = { x: xc - BW / 2, z: zFront - (BL - CL) / 2, w: BW, l: BL };
  const anchor = P(xc - CW / 2, BED_TH, zFront);
  const mon = { img: model.img, x: anchor[0] - imgW * 0.5, y: anchor[1] - (model.h - BASE_PAD) * sc,
                w: imgW, h: imgH };
  const monBox = { x: mon.x + model.bx * imgW, y: mon.y + model.by * imgH,
                   w: model.bw * imgW, h: model.bh * imgH };

  /* вазы — по обе стороны от стелы, на плите. Каждая отодвигается от оси
     могилы шагами по 25 мм, пока не встанет целиком за контуром памятника:
     размеры из прайса не всегда совпадают с ракурсом и шириной на фото.   */
  const vases = [];
  if (vase.kind === 'vase') {
    const z = zFront + CL - 120, GAP = 6;
    for (const side of [1, -1]) {                          // +x — слева на экране
      let q;
      for (let off = BW / 2 + 60; off <= W / 2; off += 25) {
        const g = P(xc + side * off, 0, z);
        q = fit(vase, g[0], g[1]);
        const [l, r] = monSpan(model, mon, q.y, q.y + q.h);
        if (side > 0 ? q.x + q.w + GAP <= l : q.x >= r + GAP) break;
      }
      vases.push(q);
    }
  }

  /* лавка или стол — сбоку от могилы. Позиция подбирается так, чтобы габарит
     предмета не пересекал ни памятник с цветником, ни основание, ни вазы.  */
  let seat = null;
  if (bench.kind !== 'none') {
    const bedPts = [P(bed.x,0,bed.z), P(bed.x+bed.w,0,bed.z), P(bed.x+bed.w,0,bed.z+bed.l), P(bed.x,0,bed.z+bed.l),
                    P(bed.x,BED_TH,bed.z), P(bed.x,BED_TH,bed.z+bed.l)];
    const bxs = bedPts.map(p => p[0]), bys = bedPts.map(p => p[1]);
    const bedBox = { x: Math.min(...bxs), y: Math.min(...bys),
                     w: Math.max(...bxs) - Math.min(...bxs), h: Math.max(...bys) - Math.min(...bys) };
    const busy = [monBox, bedBox, ...vases];
    const tries = [];
    for (let x = W - 900; x <= W + 1500; x += 100)            // от края участка наружу
      for (let z = Math.round(zFront + CL / 2); z >= 250; z -= 100) tries.push([x, z]);
    /* сначала — места, где низ предмета целиком на плите, потом любые свободные */
    const onFloor = q => [[q.x, q.y + q.h], [q.x + q.w, q.y + q.h]].every(c => {
      const [x, z] = ground(c);
      return x >= 0 && x <= W && z >= 0 && z <= L;
    });
    for (const strict of [true, false]) {
      for (const [x, z] of tries) {
        const g = P(x, 0, z), q = fit(bench, g[0], g[1]);
        if (!busy.some(b => hit(q, b)) && (!strict || onFloor(q))) { seat = Object.assign(q, { gx: x, gz: z }); break; }
      }
      if (seat) break;
    }
  }
  return { W, L, xc, bed, mon, monBox, anchor, vases, seat, zFront, CL };
}

function buildScene(S) {
  const { model, plot, floor, bench, vase } = S;
  const Lo = layout(S);
  const { W, L, bed, mon, anchor, vases, seat } = Lo;

  const fs = floor.stone ? STONE[floor.stone] : null;
  const bedTop = fs ? fs.side : '#4A5053';
  const bedSide = fs ? fs.deep : '#31373A';
  const shadow = `<ellipse cx="${(anchor[0] + mon.w * 0.06).toFixed(1)}" cy="${(anchor[1] + 2).toFixed(1)}" rx="${(mon.w * 0.3).toFixed(1)}" ry="${(mon.w * 0.045).toFixed(1)}" fill="#0B0C0D" opacity=".18"/>`;

  /* дальние предметы рисуются раньше ближних */
  const items = [{ y: Lo.monBox.y + Lo.monBox.h,
                   svg: `<image href="${mon.img}" x="${mon.x.toFixed(1)}" y="${mon.y.toFixed(1)}" width="${mon.w.toFixed(1)}" height="${mon.h.toFixed(1)}"/>` }];
  const shade = q => `<ellipse cx="${(q.x + q.w / 2).toFixed(1)}" cy="${(q.y + q.h).toFixed(1)}" rx="${(q.w * 0.42).toFixed(1)}" ry="${Math.max(2, q.w * 0.07).toFixed(1)}" fill="#0B0C0D" opacity=".16"/>`;
  for (const q of [...vases, ...(seat ? [seat] : [])])
    items.push({ y: q.y + q.h, svg: shade(q) + imgTag(q) });
  items.sort((a, b) => a.y - b.y);

  const plate = plot.war
    ? `<text x="${P(0,0,0)[0].toFixed(1)}" y="${(P(0,0,0)[1] + 34).toFixed(1)}" fill="#7C8387" font-family="IBM Plex Mono, monospace" font-size="12" letter-spacing="1.4" text-anchor="middle">ВОИНСКИЙ СЕКТОР</text>`
    : '';

  const body = drawFloor(W, L, floor)
    + slab(bed.x, bed.z, bed.w, bed.l, BED_TH, BED_TH, bedTop, bedSide, bedSide)
    + shadow + items.map(i => i.svg).join('') + plate;

  /* кадр: весь участок с толщиной плиты, памятник и предметы */
  const cor = [];
  for (const x of [0, W]) for (const z of [0, L]) for (const y of [0, -FLOOR_TH]) cor.push(P(x,y,z));
  const boxes = [Lo.monBox, ...vases, ...(seat ? [seat] : [])];
  for (const b of boxes) cor.push([b.x, b.y], [b.x + b.w, b.y + b.h]);
  if (plot.war) cor.push([P(0,0,0)[0], P(0,0,0)[1] + 40]);
  const xs = cor.map(p => p[0]), ys = cor.map(p => p[1]), pad = 24;
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
  const vw = Math.max(...xs) - x0 + pad, vh = Math.max(...ys) - y0 + pad;
  const extra = [bench.kind !== 'none' ? `${KINDS[bench.kind].label.toLowerCase()} № ${bench.n}` : '',
                 vase.kind === 'vase' ? `вазы № ${vase.n}` : ''].filter(Boolean).join(', ');
  return `<svg viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}" role="img" aria-label="Участок ${plot.note}: памятник № ${model.code}, ${floor.label.toLowerCase()}${extra ? ', ' + extra : ''}">${body}</svg>`;
}

/* ---------- состояние ---------------------------------------------------- */
const S = { model: MODELS[0], plot: PLOTS[0], floor: FLOORS[0],
            bench: BENCHES.find(o => o.kind === 'bench' && o.n === 2) || NONE,   // классическая, со спинкой
            vase: VASES.find(o => o.n === 1) || NONE, shape:'all' };
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
  $('sceneNote').textContent = `${S.plot.note} · ${S.floor.label.toLowerCase()}`;
  $('oCode').textContent  = '№ ' + S.model.code;
  $('oShape').textContent = S.model.fig ? 'фигурная' : 'прямая';
  $('oStela').textContent = mm(S.model.stela);
  $('oTumba').textContent = mm(S.model.tumba);
  $('oCvet').textContent  = S.model.cvetnik.map(c => c.join('×')).join(' + ');
  $('oPlot').textContent  = S.plot.note;
  const pr = $('oPrice');
  pr.textContent = rub(S.model.price);
  pr.classList.toggle('ask', S.model.price == null);
  for (const b of $('minis').querySelectorAll('.mini'))
    b.setAttribute('aria-pressed', b.dataset.id === S.model.id);
  for (const [host, key] of [['benches','bench'], ['vases','vase']])
    for (const b of $(host).querySelectorAll('.mini'))
      b.setAttribute('aria-pressed', b.dataset.id === S[key].id);
  for (const [host, key] of [['floors','floor'], ['plots','plot']])
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

