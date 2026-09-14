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

/* ---------- ограждения --------------------------------------------------- */
const FENCES = [
  { id:'n0', label:'Без ограды', type:'none' },
  { id:'n1', label:'Гранитный парапет', type:'parapet', h:215, th:115, dark:'#1A1E21', top:'#333A3E' },
  { id:'n2', label:'Сварная', type:'bars', h:520, step:250, rails:[195,495], w:4.2, col:'#191D20', curb:95 },
  { id:'n3', label:'Кованая с пиками', type:'bars', h:660, step:215, rails:[205,545], w:4,
    col:'#15181A', curb:95, tips:true, ring:true },
  { id:'n4', label:'Нержавеющая сталь', type:'bars', h:580, step:300, rails:[190,560], w:4.6,
    col:'#9FA7AB', gloss:'#E8EDEE', curb:95, curbTop:'#C9CDCE', curbDark:'#8C9295' },
  { id:'n5', label:'Литая чугунная', type:'bars', h:700, step:185, rails:[210,575,665], w:4.4,
    col:'#111416', curb:115, tips:true }
];

/* ---------- малые формы -------------------------------------------------- */
const EXTRAS = [
  { id:'bench', label:'Скамейка со столом' },
  { id:'vases', label:'Вазы' }
];
const EXTRA_STONES = ['black', 'dark', 'grey', 'soft', 'white'];

/* ---------- покрытие: отрисовка ------------------------------------------ */
const INSET = 70;                       // плита не доходит до ограды
function drawFloor(W, L, f) {
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

/* ---------- ограда: один прогон ------------------------------------------ */
function fenceRun(ax, az, bx, bz, f, cx, cz) {
  if (f.type === 'none') return '';
  const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
  let nx = -dz / len, nz = dx / len;
  if ((cx - ax) * nx + (cz - az) * nz < 0) { nx = -nx; nz = -nz; }   // нормаль внутрь
  const band = (h0, h1, th, colFront, colTop) =>
    poly([P(ax,h1,az), P(bx,h1,bz), P(bx,h0,bz), P(ax,h0,az)], colFront) +
    poly([P(ax,h1,az), P(bx,h1,bz), P(bx+nx*th,h1,bz+nz*th), P(ax+nx*th,h1,az+nz*th)], colTop);

  if (f.type === 'parapet') return band(0, f.h, f.th, f.dark, f.top);

  const base = f.curb || 0;
  let out = base ? band(0, base, 110, f.curbDark || '#202528', f.curbTop || '#3B4247') : '';
  const n = Math.max(2, Math.round(len / f.step));
  for (const y of f.rails) out += line(P(ax,y,az), P(bx,y,bz), f.w * 0.8, f.col);
  if (f.gloss) for (const y of f.rails) out += line(P(ax,y+3,az), P(bx,y+3,bz), f.w * 0.28, f.gloss);
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = ax + dx * t, z = az + dz * t, corner = (i === 0 || i === n);
    const h = corner ? f.h + 80 : f.h;
    out += line(P(x,base,z), P(x,h,z), corner ? f.w * 1.7 : f.w, f.col);
    if (f.gloss) out += line(P(x-16,base,z), P(x-16,h,z), f.w * 0.3, f.gloss);
    if (f.tips) out += line(P(x,h,z), P(x, h + (corner ? 110 : 90), z), f.w * 1.35, f.col);
    if (f.ring && i < n && i % 2 === 0) {
      const c = P(x + dx/n/2, (base + f.rails[1]) / 2, z + dz/n/2);
      out += `<ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="${(f.step*K.x*0.13).toFixed(1)}" ry="${(f.h*K.y*0.11).toFixed(1)}" fill="none" stroke="${f.col}" stroke-width="${f.w*0.7}"/>`;
    }
  }
  return out;
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
function buildScene(model, plot, floor, fence, extras, extraStone) {
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

  const far  = fenceRun(0,L,W,L,fence,xc,L/2)
             + fenceRun(W,zFront,W,L,fence,xc,L/2) + fenceRun(0,zFront,0,L,fence,xc,L/2);
  const near = fenceRun(W,0,W,zFront,fence,xc,L/2) + fenceRun(0,0,0,zFront,fence,xc,L/2)
             + fenceRun(W,0,0,0,fence,xc,L/2);

  const shadow = `<ellipse cx="${(anchor[0] + pngW * 0.1).toFixed(1)}" cy="${(anchor[1] + 2).toFixed(1)}" rx="${(pngW * 0.44).toFixed(1)}" ry="${(pngW * 0.07).toFixed(1)}" fill="#0B0C0D" opacity=".2"/>`;

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

  const plate = plot.war ? `<text x="${P(0,0,L)[0].toFixed(1)}" y="${(P(0,0,L)[1] - 14).toFixed(1)}" fill="#8C9498" font-family="IBM Plex Mono, monospace" font-size="13" text-anchor="end">воинский сектор</text>` : '';

  const body = drawFloor(W, L, floor) + far + shadow + bed
    + `<image href="${model.img}" x="${imgX.toFixed(1)}" y="${imgY.toFixed(1)}" width="${pngW.toFixed(1)}" height="${pngH.toFixed(1)}"/>`
    + props + near + plate;

  /* viewBox по всем нарисованным объектам */
  const hi = (fence.h || 0) + 150;
  const cor = [];
  for (const x of [0, W]) for (const z of [0, L]) for (const y of [0, hi]) cor.push(P(x,y,z));
  cor.push([imgX, imgY], [imgX + pngW, imgY + pngH]);
  if (benchBox) { const [a,b,c,d] = benchBox; cor.push(P(a,780,b), P(a+c,0,b+d)); }
  const xs = cor.map(p => p[0]), ys = cor.map(p => p[1]), pad = 30;
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
  const vw = Math.max(...xs) - x0 + pad, vh = Math.max(...ys) - y0 + pad;

  return `<svg viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}" role="img" aria-label="Участок ${plot.note}: комплект № ${model.code}, ${fence.label}, ${floor.label}">${body}</svg>`;
}

/* ---------- состояние ---------------------------------------------------- */
const S = { model: MODELS[0], plot: PLOTS[0], floor: FLOORS[0], fence: FENCES[2],
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
  $('scene').innerHTML = buildScene(S.model, S.plot, S.floor, S.fence, S.extras, S.extraStone);
  const add = [S.extras.bench && 'скамейка со столом', S.extras.vases && 'вазы'].filter(Boolean);
  $('sceneNote').textContent = [S.fence.label.toLowerCase(), S.floor.label.toLowerCase(),
    S.plot.note, ...add].join(' · ');
  $('oCode').textContent  = '№ ' + S.model.code;
  $('oShape').textContent = S.model.fig ? 'фигурная' : 'прямая';
  $('oStela').textContent = mm(S.model.stela);
  $('oTumba').textContent = mm(S.model.tumba);
  $('oCvet').textContent  = S.model.cvetnik.map(c => c.join('×')).join(' + ');
  $('oPlot').textContent  = S.plot.note;
  $('oPrice').textContent = rub(S.model.price);
  for (const b of document.querySelectorAll('#minis .mini'))
    b.setAttribute('aria-pressed', b.dataset.id === S.model.id);
  for (const [host, items, key] of [['fences',FENCES,'fence'],['floors',FLOORS,'floor'],['plots',PLOTS,'plot']])
    for (const b of $(host).querySelectorAll('.chip'))
      b.setAttribute('aria-pressed', b.dataset.id === S[key].id);
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
chipRow($('fences'), FENCES, 'fence');
chipRow($('floors'), FLOORS, 'floor');
chipRow($('plots'),  PLOTS,  'plot');

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
