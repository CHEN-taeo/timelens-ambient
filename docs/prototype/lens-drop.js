const svg = document.getElementById('svg');
const CATS = {
  coding: { hue: '#818CF8', label: '编程开发', app: 'Cursor', amp: 1.4, freq: 0.55, deep: true },
  learning: { hue: '#FCD34D', label: '学习资料', app: 'Obsidian', amp: 1.8, freq: 0.7, deep: true },
  ai: { hue: '#67E8F9', label: 'AI 工具', app: 'claude.ai', amp: 1.6, freq: 0.62, deep: true },
  project: { hue: '#6EE7B7', label: '项目开发', app: 'idea-forge', amp: 1.3, freq: 0.5, deep: true },
  comms: { hue: '#F9A8D4', label: '沟通协作', app: 'Slack', amp: 2.8, freq: 1.05, deep: false },
  entertainment: { hue: '#FCA5A5', label: '娱乐摸鱼', app: 'bilibili', amp: 6, freq: 1.7, deep: false },
};

const D = { cx: 300, by: 214, r: 84, ty: 86 };
const MINI = { cx: 54, cy: 52, r: 20, ty: 24 };
const st = {
  cat: 'coding', steady: 0.82, timeP: 0.55, fillP: 0.55, flow: false, focus: false,
  phase: 0, breath: 0, crystal: 0, cryOn: false, settle: 'none', settleT: 0, evap: 0, parts: [], ended: false,
};

function h2r(h) { const n = parseInt(h.slice(1), 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }
function lerp(a, b, t) { return a + (b - a) * t; }
function mix(c1, c2, t) {
  const a = h2r(c1); const b = h2r(c2);
  return `rgb(${Math.round(lerp(a.r, b.r, t))},${Math.round(lerp(a.g, b.g, t))},${Math.round(lerp(a.b, b.b, t))})`;
}
function reckon(p) {
  const s = [[0, '#4A7CFF'], [0.3, '#90A8FF'], [0.55, '#F0A030'], [0.78, '#C07018'], [1, '#30B060']];
  for (let i = 0; i < s.length - 1; i++) {
    if (p <= s[i + 1][0]) return mix(s[i][1], s[i + 1][1], (p - s[i][0]) / (s[i + 1][0] - s[i][0]));
  }
  return s[4][1];
}

function drop(cx, by, r, ty, wob) {
  const t = ty - (wob || 0);
  return `M ${cx},${t}`
    + ` C ${cx + r * 0.86},${t + (by - t) * 0.42} ${cx + r},${by - r * 0.55} ${cx + r},${by}`
    + ` A ${r},${r} 0 1 1 ${cx - r},${by}`
    + ` C ${cx - r},${by - r * 0.55} ${cx - r * 0.86},${t + (by - t) * 0.42} ${cx},${t} Z`;
}

svg.innerHTML = `
<defs>
  <clipPath id="dClip"><path id="clipPath"/></clipPath>
  <clipPath id="mClip"><path d="${drop(MINI.cx, MINI.cy, MINI.r, MINI.ty, 0)}"/></clipPath>
  <radialGradient id="glassBody" cx="38%" cy="30%" r="75%">
    <stop offset="0%" stop-color="rgba(255,255,255,0.22)"/>
    <stop offset="40%" stop-color="rgba(255,255,255,0.04)"/>
    <stop offset="78%" stop-color="rgba(0,0,0,0.05)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.28)"/>
  </radialGradient>
  <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="rgba(255,255,255,0.85)"/>
    <stop offset="45%" stop-color="rgba(255,255,255,0.18)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0.06)"/>
  </linearGradient>
  <linearGradient id="liq" x1="0" y1="0" x2="0" y2="1"><stop id="l0" offset="0"/><stop id="l1" offset=".55"/><stop id="l2" offset="1"/></linearGradient>
  <radialGradient id="bead" cx="34%" cy="28%" r="70%"><stop offset="0%" stop-color="#fff" stop-opacity="1"/><stop offset="46%" stop-color="#fff" stop-opacity=".82"/><stop id="beadO" offset="100%" stop-opacity=".2"/></radialGradient>
  <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="blob" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="22"/></filter>
  <filter id="glow" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>

<g opacity="0.9">
  <circle cx="${D.cx - 40}" cy="${D.by + 30}" r="40" fill="#7C3AED" filter="url(#blob)" opacity="0.5"/>
  <circle cx="${D.cx + 50}" cy="${D.by - 50}" r="34" fill="#3878FF" filter="url(#blob)" opacity="0.4"/>
</g>

<ellipse id="shadow" cx="${D.cx}" cy="${D.by + D.r + 6}" rx="${D.r * 0.8}" ry="9" fill="rgba(0,0,0,0.5)" filter="url(#soft)"/>

<g id="hero">
  <path id="glassFill" fill="rgba(12,12,20,0.34)" pointer-events="none"/>
  <g clip-path="url(#dClip)">
    <ellipse id="caustic" filter="url(#soft)" opacity=".55"/>
    <path id="liqBody" pointer-events="none"/><path id="specularLine" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.4" pointer-events="none"/>
    <g id="parts"></g>
  </g>
  <path id="glassSheen" fill="url(#glassBody)" pointer-events="none"/>
  <path id="rimStroke" fill="none" stroke="url(#rim)" stroke-width="1.6" pointer-events="none"/>
  <ellipse id="hl" cx="${D.cx - 30}" cy="${D.ty + 54}" rx="15" ry="26" fill="rgba(255,255,255,0.5)" filter="url(#soft)" pointer-events="none" transform="rotate(-22 ${D.cx - 30} ${D.ty + 54})"/>
  <circle id="hl2" cx="${D.cx + 26}" cy="${D.by + 34}" r="6" fill="rgba(255,255,255,0.6)" filter="url(#soft)" pointer-events="none"/>
  <circle id="bead" r="5.5" fill="url(#bead)" pointer-events="none"/>
  <polygon id="crystal" opacity="0" pointer-events="none"/>
</g>

<g opacity="0.96">
  <path d="${drop(MINI.cx, MINI.cy, MINI.r, MINI.ty, 0)}" fill="rgba(12,12,20,0.34)"/>
  <g clip-path="url(#mClip)"><rect id="mLiq" x="${MINI.cx - MINI.r}" width="${MINI.r * 2}" /></g>
  <path d="${drop(MINI.cx, MINI.cy, MINI.r, MINI.ty, 0)}" fill="url(#glassBody)"/>
  <path d="${drop(MINI.cx, MINI.cy, MINI.r, MINI.ty, 0)}" fill="none" stroke="url(#rim)" stroke-width="1"/>
</g>
`;

const el = (id) => document.getElementById(id);
const bead = el('bead');
const crystal = el('crystal');

function gauss(x, mu, s) { const d = (x - mu) / s; return Math.exp(-d * d); }
function surfY(xr, baseY, amp, freq, lift) {
  const x = xr * 2 * D.r;
  const e = lift * (gauss(x, 0, D.r * 0.5) + gauss(x, 2 * D.r, D.r * 0.5));
  const w = amp * Math.sin(xr * Math.PI * 2 * (1 + freq) + st.phase * freq * 3);
  return baseY - e - w;
}

function render() {
  const c = CATS[st.cat];
  const instab = 1 - st.steady;
  const wob = Math.sin(st.phase * 1.4) * 1.6 * (st.flow ? 0.3 : 1);
  const d = drop(D.cx, D.by, D.r, D.ty, wob);
  el('glassFill').setAttribute('d', d);
  el('clipPath').setAttribute('d', d);
  el('glassSheen').setAttribute('d', d);
  el('rimStroke').setAttribute('d', d);

  let fillP = st.fillP;
  if (st.settle === 'evaporating') fillP = st.evap * (1 - st.settleT);
  if (st.settle === 'ended') fillP = 0;
  const breath = st.breath > 0 ? Math.sin(st.breath * Math.PI) : 0;
  fillP = Math.min(0.96, fillP + breath * 0.05);
  const bottom = D.by + D.r;
  const top = D.ty;
  const H = bottom - top;
  const baseY = bottom - fillP * H;
  let amp = c.amp * (0.3 + instab * 1.4);
  if (c.deep && st.steady > 0.7) amp *= 0.5;
  if (st.flow) amp *= 0.15;
  amp *= (1 - breath * 0.6);
  const lift = 4 + amp * 0.7;
  const freq = c.freq;
  const N = 46;
  let tline = '';
  for (let i = 0; i <= N; i++) {
    const xr = i / N;
    const x = D.cx - D.r + xr * 2 * D.r;
    const y = surfY(xr, baseY, amp, freq, lift);
    tline += (i ? ` L ${x},${y}` : `M ${x},${y}`);
  }
  el('liqBody').setAttribute('d', `${tline} L ${D.cx + D.r},${bottom + 6} L ${D.cx - D.r},${bottom + 6} Z`);
  el('liqBody').setAttribute('fill', 'url(#liq)');
  el('specularLine').setAttribute('d', tline);
  const hue = c.hue;
  el('l0').setAttribute('stop-color', hue);
  el('l0').setAttribute('stop-opacity', st.flow ? 0.2 : 0.46);
  el('l1').setAttribute('stop-color', hue);
  el('l1').setAttribute('stop-opacity', st.flow ? 0.28 : 0.56);
  el('l2').setAttribute('stop-color', hue);
  el('l2').setAttribute('stop-opacity', st.flow ? 0.36 : 0.7);
  el('beadO').setAttribute('stop-color', hue);
  const ca = el('caustic');
  ca.setAttribute('cx', D.cx + D.r * 0.18);
  ca.setAttribute('cy', baseY + 14);
  ca.setAttribute('rx', Math.max(18, D.r * 0.5));
  ca.setAttribute('ry', 6);
  ca.setAttribute('fill', hue);

  const bxr = 0.66;
  const bx = D.cx - D.r + bxr * 2 * D.r;
  const by = surfY(bxr, baseY, amp, freq, lift);
  const j = instab * (st.flow ? 0 : 3);
  const jx = Math.sin(st.phase * 9) * j;
  const jy = Math.cos(st.phase * 11) * j * 0.6;
  bead.setAttribute('cx', bx + jx);
  bead.setAttribute('cy', by + jy);
  bead.setAttribute('r', st.cryOn ? 5.5 * (1 - st.crystal) : 5.5);
  bead.setAttribute('filter', 'url(#glow)');
  bead.setAttribute('opacity', st.ended ? (0.6 + 0.4 * Math.sin(st.phase * 0.8)) : 1);

  if (st.cryOn || st.settle === 'ended') {
    const ccx = st.settle === 'ended' ? D.cx : bx + jx;
    const ccy = st.settle === 'ended' ? D.by : by + jy;
    const pr = st.settle === 'ended' ? 1 : Math.sin(st.crystal * Math.PI);
    const s = 4 + pr * 7;
    crystal.setAttribute('points', `${ccx},${ccy - s} ${ccx + s * 0.7},${ccy} ${ccx},${ccy + s} ${ccx - s * 0.7},${ccy}`);
    crystal.setAttribute('fill', st.settle === 'ended' ? reckon(st.timeP) : '#fff');
    crystal.setAttribute('opacity', st.settle === 'ended' ? 0.92 : pr);
    crystal.setAttribute('filter', 'url(#glow)');
  } else {
    crystal.setAttribute('opacity', 0);
  }

  el('rimStroke').setAttribute('stroke', 'url(#rim)');

  const mB = MINI.cy + MINI.r;
  const mTop = MINI.ty;
  const mH = mB - mTop;
  const mY = mB - st.fillP * mH;
  const ml = el('mLiq');
  ml.setAttribute('y', mY);
  ml.setAttribute('height', Math.max(0, mB + 4 - mY));
  ml.setAttribute('fill', hue);
  ml.setAttribute('opacity', 0.6);

  const hl = el('hl');
  hl.setAttribute('opacity', st.flow ? 0.2 : (0.4 + 0.18 * Math.sin(st.phase * 0.9)));
}

function spawn() {
  const hue = CATS[st.cat].hue;
  st.parts.push({
    x: D.cx - D.r + Math.random() * 2 * D.r,
    y: D.by + D.r - st.evap * (1 - st.settleT) * (D.by + D.r - D.ty),
    vy: 0.4 + Math.random() * 0.9,
    life: 1,
    r: 1 + Math.random() * 1.8,
    hue,
  });
}

function rp() {
  el('parts').innerHTML = st.parts.map((p) =>
    `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="${p.hue}" opacity="${(p.life * 0.5).toFixed(2)}"/>`
  ).join('');
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  st.phase += dt;
  if (st.breath > 0) {
    st.breath += dt / 2.4;
    if (st.breath >= 1) st.breath = 0;
  }
  if (st.cryOn) {
    st.crystal += dt / 1.6;
    if (st.crystal >= 1) {
      st.cryOn = false;
      st.crystal = 0;
    }
  }
  if (st.settle === 'evaporating') {
    st.settleT += dt / 4.2;
    if (Math.random() < 0.6) spawn();
    st.parts.forEach((p) => { p.y -= p.vy; p.life -= dt * 0.5; });
    st.parts = st.parts.filter((p) => p.life > 0);
    if (st.settleT >= 1) {
      st.settle = 'ended';
      st.ended = true;
      el('stateName').textContent = 'SETTLE · 已抵达';
    }
  }
  if (st.settle === 'ended') {
    st.parts.forEach((p) => { p.y -= p.vy; p.life -= dt * 0.5; });
    st.parts = st.parts.filter((p) => p.life > 0);
  }
  render();
  rp();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

const cats = el('cats');
Object.entries(CATS).forEach(([k, c]) => {
  const d = document.createElement('div');
  d.className = 'cat' + (k === st.cat ? ' active' : '');
  d.style.background = c.hue;
  d.title = c.label;
  d.onclick = () => {
    st.cat = k;
    document.querySelectorAll('.cat').forEach((x) => x.classList.remove('active'));
    d.classList.add('active');
    sync();
  };
  cats.appendChild(d);
});

const time = el('time');
time.oninput = () => {
  st.timeP = time.value / 100;
  const m = 9 * 60 + st.timeP * 9 * 60;
  el('timeVal').textContent = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
  sync();
};

const fill = el('fill');
fill.oninput = () => {
  st.fillP = fill.value / 100;
  el('fillVal').textContent = `${fill.value}%`;
  sync();
};

const steady = el('steady');
steady.oninput = () => {
  st.steady = steady.value / 100;
  el('stVal').textContent = st.steady > 0.75 ? '稳' : st.steady > 0.45 ? '微澜' : '频繁切换';
  sync();
};

el('bSeen').onclick = () => {
  if (st.flow) return;
  st.breath = 0.001;
  el('stateName').textContent = '被看见 · 呼吸';
  setTimeout(() => { el('stateName').textContent = st.focus ? 'FOCUS' : 'AMBIENT'; }, 2400);
};

el('bCry').onclick = () => {
  st.cryOn = true;
  st.crystal = 0.001;
  el('stateName').textContent = '+1 🍅 · 完整';
  setTimeout(() => { el('stateName').textContent = st.focus ? 'FOCUS' : 'AMBIENT'; }, 1800);
};

el('bSet').onclick = () => {
  st.settle = 'evaporating';
  st.settleT = 0;
  st.evap = st.fillP;
  st.parts = [];
  closeCard();
  el('stateName').textContent = 'SETTLE · 蒸发中';
};

el('bRst').onclick = () => {
  st.settle = 'none';
  st.ended = false;
  st.settleT = 0;
  st.parts = [];
  st.breath = 0;
  st.cryOn = false;
  st.crystal = 0;
  closeCard();
  el('stateName').textContent = 'AMBIENT';
};

const fsw = el('flowSw');
fsw.onclick = () => {
  st.flow = !st.flow;
  fsw.classList.toggle('on', st.flow);
  el('stateName').textContent = st.flow ? 'FLOW · 屏息' : (st.focus ? 'FOCUS' : 'AMBIENT');
};

const peek = el('peek');
const card = el('card');
const dewHit = el('dewHit');
let pt1;
let pt2;

function showPeek() {
  if (st.flow || st.focus || st.settle !== 'none') return;
  const c = CATS[st.cat];
  const mins = Math.round(st.fillP * 300);
  peek.innerHTML = `${c.label} · ${Math.floor(mins / 60)}h${mins % 60}m<span class="sub" id="ps"></span>`;
  peek.classList.add('show');
  pt2 = setTimeout(() => {
    const ps = document.getElementById('ps');
    if (ps) ps.textContent = `${c.app} · ${Math.round(st.fillP * 100)}min`;
  }, 800);
}

dewHit.addEventListener('mouseenter', () => { pt1 = setTimeout(showPeek, 400); });
dewHit.addEventListener('mouseleave', () => {
  clearTimeout(pt1);
  clearTimeout(pt2);
  peek.classList.remove('show');
});

function openCard() {
  st.focus = true;
  peek.classList.remove('show');
  card.classList.add('open');
  el('stateName').textContent = 'FOCUS · 绽放';
  sync();
}

function closeCard() {
  st.focus = false;
  card.classList.remove('open');
  if (st.settle === 'none') el('stateName').textContent = 'AMBIENT';
}

dewHit.addEventListener('click', () => { st.focus ? closeCard() : openCard(); });
el('cardX').onclick = closeCard;

function sync() {
  const c = CATS[st.cat];
  el('qNow').textContent = c.app;
  el('qDur').textContent = `已 ${Math.round(st.fillP * 60)}min`;
  el('qBc').textContent = `因为：${c.app.toLowerCase()} ↺`;
  const m = 9 * 60 + st.timeP * 9 * 60;
  el('qVoy').textContent = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')} · ${st.timeP > 0.5 ? '过半' : '上半'}`;
  el('qPomo').textContent = `${c.label} · ${st.steady > 0.6 ? '稳' : '有点偏航'}`;
}
sync();

el('legend').innerHTML = `
<b style="color:var(--txt2)">💧 为什么是水滴 ——</b> 它是你"液体灵魂"的最终形态：圆润、有机、像一颗真的露珠，天然抗锯齿不发糙。<br>
<span class="k">Liquid Glass</span>：玻璃体折射背后的光（看露珠后的紫/蓝光晕被"吸"进来）· 顶部高光新月 · 发亮边缘 · 接触阴影 · 轻微表面张力抖动。<br>
<span class="k">液色</span>=类别 · <span class="k">液位</span>=积累 · <span class="k">弯月静/动</span>=专注稳定度 · <span class="k">高光呼吸</span>=活着 · 左上角是<span class="k">真实尺寸</span>(~40px)。<br>
<span class="k">窥视</span>=光从右侧透出文字 · <span class="k">绽放</span>=点击露珠液滴展开四格 · <span class="k">告别</span>=日结蒸发留水晶 · <span class="k">心流</span>=淡至 22%、屏息。
`;
