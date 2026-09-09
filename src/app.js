/* ---------- projection ----------------------------------------------------
   Axes measured from the price-list renders (see tools/extract_price.py):
   the stela sits at the far end, the cvetnik runs toward the viewer.
   x = across the plot (mm), y = height (mm), z = depth toward the stela (mm) */
const AX = { x: -0.9885, y: -0.1517 };   // across  — to the left, slightly up
const AZ = { x:  0.9537, y: -0.3007 };   // depth   — to the right, up
const K  = { x: 0.286, y: 0.312, z: 0.140 }; // px per mm, ratios taken from the renders

function P(x, y, z) {
  return [ x * K.x * AX.x + z * K.z * AZ.x,
           x * K.x * AX.y + z * K.z * AZ.y - y * K.y ];
}
const pt = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
const poly = (pts, fill, extra) =>
  `<polygon points="${pts.map(pt).join(' ')}" fill="${fill}"${extra || ''}/>`;

/* ---------- options ------------------------------------------------------ */
const PLOTS = [
  { id:'p1', label:'Одно место',  w:1300, l:2200, note:'1,3 × 2,2 м' },
  { id:'p2', label:'Два места',   w:2400, l:2200, note:'2,4 × 2,2 м' },
  { id:'p3', label:'С проходом',  w:1600, l:2600, note:'1,6 × 2,6 м' }
];

const FLOORS = [
  { id:'f1', label:'Керамогранит тёмный', fill:'#3A4043', line:'#22262A', grid:600 },
  { id:'f2', label:'Керамогранит светлый',fill:'#B4B8B9', line:'#9DA2A3', grid:600 },
  { id:'f3', label:'Плитка 300',          fill:'#8F9391', line:'#7A7E7C', grid:300 },
  { id:'f4', label:'Искусственный газон', fill:'#4C7342', line:'#446A3B', grid:0, grass:true },
  { id:'f5', label:'Гранитная крошка',    fill:'#6B7175', line:'#5C6265', grid:0, speck:true },
  { id:'f6', label:'Без покрытия',        fill:'#6E6353', line:'#5F5648', grid:0 }
];

const FENCES = [
  { id:'n0', label:'Без ограды', type:'none' },
  { id:'n1', label:'Гранитный парапет', type:'parapet', h:260, th:110, dark:'#1A1E21', top:'#333A3E' },
  { id:'n2', label:'Сварная', type:'bars', h:520, step:250, rails:[195,495], w:5,
    col:'#191D20', curb:95 },
  { id:'n3', label:'Кованая с пиками', type:'bars', h:660, step:215, rails:[205,545], w:4.6,
    col:'#15181A', curb:95, tips:true, ring:true },
  { id:'n4', label:'Нержавеющая сталь', type:'bars', h:580, step:300, rails:[190,560], w:5.5,
    col:'#9FA7AB', gloss:'#E8EDEE', curb:95, curbTop:'#C9CDCE', curbDark:'#8C9295' },
  { id:'n5', label:'Литая чугунная', type:'bars', h:700, step:185, rails:[210,575,665], w:5,
    col:'#111416', curb:115, tips:true }
];

/* ---------- floor -------------------------------------------------------- */
function drawFloor(W, L, f) {
  const ln = (a, b, w) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"${w ? ` stroke-width="${w}"` : ''}/>`;
  const c = [P(0,0,0), P(W,0,0), P(W,0,L), P(0,0,L)];
  let s = poly(c, f.fill);
  if (f.grid) {
    let g = '';
    for (let x = f.grid; x < W; x += f.grid) g += ln(P(x,0,0), P(x,0,L));
    for (let z = f.grid; z < L; z += f.grid) g += ln(P(0,0,z), P(W,0,z));
    s += `<g stroke="${f.line}" stroke-width="1.1">${g}</g>`;
  }
  if (f.grass) {
    let g = '';
    for (let x = 40; x < W; x += 62)
      for (let z = 40; z < L; z += 52) g += ln(P(x,0,z), P(x, 26 + ((x * z) % 13), z));
    s += `<g stroke="#5B8A4F" stroke-width="1.2" stroke-linecap="round" opacity=".85">${g}</g>`;
  }
  if (f.speck) {
    let g = '';
    for (let x = 30; x < W; x += 46)
      for (let z = 30; z < L; z += 40) {
        const a = P(x + ((z % 3) * 9), 0, z);
        g += `<circle cx="${a[0].toFixed(1)}" cy="${a[1].toFixed(1)}" r="${1.4 + (x % 3) * 0.5}"/>`;
      }
    s += `<g fill="#878D90" opacity=".8">${g}</g>`;
  }
  return s + poly(c, 'none', ' stroke="#4A5053" stroke-width="1.2"');
}

/* ---------- fence -------------------------------------------------------- */
/* one straight run between two plot-plane points, drawn as posts + rails */
function fenceRun(ax, az, bx, bz, f, cx, cz) {
  if (f.type === 'none') return '';
  const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
  let nx = -dz / len, nz = dx / len;                   // sideways normal of this run
  if ((cx - ax) * nx + (cz - az) * nz < 0) { nx = -nx; nz = -nz; }   // turn it inward
  const band = (h0, h1, th, colFront, colTop) => {
    const front = [P(ax,h1,az), P(bx,h1,bz), P(bx,h0,bz), P(ax,h0,az)];
    const top   = [P(ax,h1,az), P(bx,h1,bz), P(bx+nx*th,h1,bz+nz*th), P(ax+nx*th,h1,az+nz*th)];
    return poly(front, colFront) + poly(top, colTop);
  };
  if (f.type === 'parapet') return band(0, f.h, f.th, f.dark, f.top);

  const seg = (x1,y1,z1,x2,y2,z2,w,col) => {
    const a = P(x1,y1,z1), b = P(x2,y2,z2);
    return `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  };
  const base = f.curb || 0;
  let s = base ? band(0, base, 105, f.curbDark || '#202528', f.curbTop || '#3B4247') : '';
  const n = Math.max(2, Math.round(len / f.step));
  for (const y of f.rails) s += seg(ax,y,az,bx,y,bz, f.w * 0.8, f.col);
  if (f.gloss) for (const y of f.rails) s += seg(ax,y+2.5,az,bx,y+2.5,bz, f.w * 0.28, f.gloss);
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = ax + dx * t, z = az + dz * t;
    const corner = (i === 0 || i === n);
    const h = corner ? f.h + 80 : f.h;
    s += seg(x,base,z,x,h,z, corner ? f.w * 1.7 : f.w, f.col);
    if (f.gloss) s += seg(x - 14,base,z,x - 14,h,z, f.w * 0.32, f.gloss);
    if (f.tips) {
      const a = P(x,h,z), b = P(x,h + (corner ? 110 : 90),z);
      s += `<path d="M${a[0].toFixed(1)},${a[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)}" stroke="${f.col}" stroke-width="${f.w * 1.4}" stroke-linecap="round"/>`;
    }
    if (f.ring && i < n) {
      const c = P(x + dx / n / 2, (base + f.rails[1]) / 2, z + dz / n / 2);
      s += `<ellipse cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="${(f.step * K.x * 0.12).toFixed(1)}" ry="${(f.h * K.y * 0.10).toFixed(1)}" fill="none" stroke="${f.col}" stroke-width="${f.w * 0.7}"/>`;
    }
  }
  return s;
}

/* ---------- scene -------------------------------------------------------- */
function buildScene(model, plot, floor, fence) {
  const W = plot.w, L = plot.l, xc = W / 2;

  /* the render is scaled by the height of its stela; the footprint is then fitted
     to the render, so the granite always sits exactly on its concrete bed */
  const pngH = (model.stela[0] + 380) * K.y;
  const pngW = pngH * (model.w / model.h);
  const face = model.cvetnik.find(c => c[0] < 1000) || model.cvetnik[0];
  const CW0 = face[0] + 110, CL0 = 1000 + (model.tumba ? model.tumba[1] : 160) + 70;
  const fit = pngW / (CW0 * K.x * Math.abs(AX.x) + CL0 * K.z * AZ.x);
  const CW = CW0 * fit, CL = CL0 * fit;

  const zFront = Math.max(120, L - 210 - CL);
  const BW = CW + 130, BL = CL + 150, BH = 70;   // concrete bed under the set
  const bx = xc - BW / 2, bz = zFront - 75;
  const anchor = P(xc - CW / 2, BH, zFront);
  const imgX = anchor[0] - model.ax * pngW;
  const imgY = anchor[1] - model.ay * pngH;

  const bed = poly([P(bx,BH,bz), P(bx+BW,BH,bz), P(bx+BW,BH,bz+BL), P(bx,BH,bz+BL)], '#4E5457')
    + poly([P(bx,0,bz), P(bx+BW,0,bz), P(bx+BW,BH,bz), P(bx,BH,bz)], '#2B3033')
    + poly([P(bx,0,bz), P(bx,0,bz+BL), P(bx,BH,bz+BL), P(bx,BH,bz)], '#373C3F');

  const far  = fenceRun(0,L,W,L,fence,xc,L/2)
             + fenceRun(W,zFront,W,L,fence,xc,L/2) + fenceRun(0,zFront,0,L,fence,xc,L/2);
  const near = fenceRun(W,0,W,zFront,fence,xc,L/2) + fenceRun(0,0,0,zFront,fence,xc,L/2)
             + fenceRun(W,0,0,0,fence,xc,L/2);

  const shadow = `<ellipse cx="${(anchor[0] + pngW * 0.1).toFixed(1)}" cy="${(anchor[1] + 3).toFixed(1)}" rx="${(pngW * 0.44).toFixed(1)}" ry="${(pngW * 0.07).toFixed(1)}" fill="#0B0C0D" opacity=".22"/>`;

  const body = drawFloor(W, L, floor) + bed + far + shadow
    + `<image href="${model.img}" x="${imgX.toFixed(1)}" y="${imgY.toFixed(1)}" width="${pngW.toFixed(1)}" height="${pngH.toFixed(1)}"/>`
    + near;

  const hi = (fence.h || 0) + 140;
  const cor = [];
  for (const x of [0, W]) for (const z of [0, L]) for (const y of [0, hi]) cor.push(P(x,y,z));
  cor.push([imgX, imgY], [imgX + pngW, imgY + pngH]);
  const xs = cor.map(c => c[0]), ys = cor.map(c => c[1]);
  const pad = 26;
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
  const vw = Math.max(...xs) - x0 + pad, vh = Math.max(...ys) - y0 + pad;

  return `<svg viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}" role="img" aria-label="Участок: комплект № ${model.code}, ${fence.label}, ${floor.label}">${body}</svg>`;
}

/* ---------- state & render ----------------------------------------------- */
const S = { model: MODELS[0], plot: PLOTS[0], floor: FLOORS[0], fence: FENCES[2] };
const $ = id => document.getElementById(id);
const mm = a => a ? a.join(' × ') : '—';
const rub = n => n.toLocaleString('ru-RU') + ' ₽';

function chipRow(host, items, key) {
  host.innerHTML = items.map(o =>
    `<button class="chip" role="button" data-id="${o.id}"
      aria-pressed="${S[key].id === o.id}">${o.label}</button>`).join('');
  host.onclick = e => {
    const b = e.target.closest('.chip'); if (!b) return;
    S[key] = items.find(o => o.id === b.dataset.id); render();
  };
}

function render() {
  $('scene').innerHTML = buildScene(S.model, S.plot, S.floor, S.fence);
  $('sceneNote').textContent =
    `${S.fence.label.toLowerCase()} · ${S.floor.label.toLowerCase()} · участок ${S.plot.note}`;
  $('oCode').textContent  = '№ ' + S.model.code;
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
}

/* minis */
$('minis').innerHTML = MODELS.map(m =>
  `<button class="mini" data-id="${m.id}" aria-pressed="${m.id === S.model.id}"
     title="№ ${m.code} — ${rub(m.price)}"><span>${m.code}</span>
     <img src="${m.img}" alt="Памятник № ${m.code}" loading="lazy"></button>`).join('');
$('minis').onclick = e => {
  const b = e.target.closest('.mini'); if (!b) return;
  S.model = MODELS.find(m => m.id === b.dataset.id); render();
};
chipRow($('fences'), FENCES, 'fence');
chipRow($('floors'), FLOORS, 'floor');
chipRow($('plots'),  PLOTS,  'plot');

/* ---------- catalogue ---------------------------------------------------- */
const FILTERS = [
  { id:'all', label:'Все 33', test:() => true },
  { id:'h900',  label:'Стела 900',  test:m => m.stela[0] === 900 },
  { id:'h1000', label:'Стела 1000', test:m => m.stela[0] === 1000 },
  { id:'h1200', label:'Стела 1200', test:m => m.stela[0] === 1200 },
  { id:'t50', label:'Толщина 50', test:m => m.stela[2] === 50 },
  { id:'t70', label:'Толщина 70', test:m => m.stela[2] === 70 },
  { id:'cheap', label:'до 20 000 ₽', test:m => m.price <= 20000 }
];
let activeFilter = 'all';

function drawCatalogue() {
  const f = FILTERS.find(x => x.id === activeFilter);
  $('grid').innerHTML = MODELS.filter(f.test).map(m => `
    <article class="card">
      <div class="card-stage"><span class="card-code">№ ${m.code}</span>
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
$('filters').innerHTML = '<span class="eyebrow">Фильтр</span>' + FILTERS.map(f =>
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
  render();
  document.getElementById('configurator').scrollIntoView({ behavior:'smooth', block:'start' });
};

drawCatalogue();
render();
