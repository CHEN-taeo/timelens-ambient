import { createFocusUI } from './focus-ui.js'

let focusUI

function boot() {
  const W = 168;
  const H = 36;
  const PHI = 1.6180339887;
  const svg = document.getElementById('svg');
  if (!svg) return;

  const CATS = {
    coding: { hue: '#818CF8', label: '编程', app: 'Cursor', amp: 1.2, freq: 0.55, deep: true },
    learning: { hue: '#FCD34D', label: '学习', app: 'Obsidian', amp: 1.5, freq: 0.68, deep: true },
    ai: { hue: '#67E8F9', label: 'AI', app: 'claude.ai', amp: 1.4, freq: 0.6, deep: true },
    project: { hue: '#6EE7B7', label: '项目', app: 'idea-forge', amp: 1.1, freq: 0.48, deep: true },
    comms: { hue: '#F9A8D4', label: '沟通', app: 'Slack', amp: 2.4, freq: 0.95, deep: false },
    entertainment: { hue: '#FCA5A5', label: '摸鱼', app: 'bilibili', amp: 4.5, freq: 1.5, deep: false },
  };

  const st = {
    cat: 'coding',
    steady: 0.82,
    fillP: 0.55,
    tideP: 0.55,
    flow: false,
    focus: false,
    closing: false,
    hover: false,
    prox: 'ambient',
    viewMode: 'B',
    wetBias: 0,
    phase: 0,
    breath: 0,
    crystal: 0,
    cryOn: false,
    settle: 'none',
    settleT: 0,
    evap: 0,
    pourStart: 0,
  };

  const MA = { peek: 400, peekPlus: 800, focus: 200, pour: 480, close: 320 };

  // 今日活动（A 聚合成地层，B 散布成星）
  const SESSIONS = [
    { cat: 'learning', label: '学习', mins: 45, t: 8.5, app: 'Obsidian' },
    { cat: 'coding', label: '编程', mins: 128, t: 10.2, app: 'Cursor' },
    { cat: 'comms', label: '会议', mins: 67, t: 11.8, app: 'Slack' },
    { cat: 'ai', label: 'AI', mins: 50, t: 13.0, app: 'claude.ai' },
    { cat: 'coding', label: '编程', mins: 80, t: 14.0, now: true, app: 'Cursor', because: '开发工具 / 代码平台' },
    { cat: 'entertainment', label: '摸鱼', mins: 18, t: 15.2, app: 'bilibili' },
  ];
  const DAY0 = 7;
  const DAY1 = 22;
  const dayFrac = (h) => Math.max(0, Math.min(1, (h - DAY0) / (DAY1 - DAY0)));

  function el(id) { return document.getElementById(id); }

  /** Lamé 超椭圆 |x/a|^n + |y/b|^n = 1，n≈4；底缘重力微鼓 */
  function superellipseShell(wobble) {
    const cx = W / 2;
    const cy = H / 2;
    const a = W / 2 - 0.5;
    const b = H / 2 - 0.5;
    const n = 4;
    const grav = 1.15 + (wobble || 0) * 0.35;
    const steps = 72;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const ct = Math.cos(t);
      const stn = Math.sin(t);
      const x = cx + a * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n);
      let y = cy + b * Math.sign(stn) * Math.pow(Math.abs(stn), 2 / n);
      if (stn > 0) y += grav * stn * stn;
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    }
    return `${d}Z`;
  }

  function gauss(x, mu, s) {
    const d = (x - mu) / s;
    return Math.exp(-d * d);
  }

  function hexToRgb(hex) {
    const n = parseInt(String(hex).replace('#', ''), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function mixHex(a, b, t) {
    const A = hexToRgb(a);
    const B = hexToRgb(b);
    const m = (x, y) => Math.round(x + (y - x) * t);
    return `rgb(${m(A.r, B.r)},${m(A.g, B.g)},${m(A.b, B.b)})`;
  }

  /** 弯月面：边缘毛细下陷 + 驻波（多频叠加 ≈ 傅里叶模态） */
  function surfY(xr, baseY, amp, freq) {
    const x = xr * W;
    const capillary = (gauss(x, 0, W * 0.2) + gauss(x, W, W * 0.2)) * 2.2;
    const f1 = Math.sin(xr * Math.PI * 2 * (1 + freq) + st.phase * freq * 2.2);
    const f2 = Math.sin(xr * Math.PI * 4.1 + st.phase * 1.3) * 0.35;
    const f3 = Math.sin(xr * Math.PI * 6.7 + st.phase * 0.7) * 0.15;
    const tilt = st.wetBias * (xr - 0.5) * 2.8;
    return baseY - capillary - amp * (f1 + f2 + f3) + tilt;
  }

  svg.innerHTML = `
<defs>
  <clipPath id="clip"><path id="clipPath"/></clipPath>
  <linearGradient id="glass" x1="6%" y1="0%" x2="94%" y2="100%">
    <stop offset="0%" stop-color="rgba(255,255,255,0.16)"/>
    <stop offset="38%" stop-color="rgba(255,255,255,0.03)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.22)"/>
  </linearGradient>
  <radialGradient id="fresnel" cx="24%" cy="22%" r="62%">
    <stop offset="0%" stop-color="rgba(255,255,255,0.2)"/>
    <stop offset="48%" stop-color="rgba(255,255,255,0.05)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
  </radialGradient>
  <linearGradient id="specGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">
    <stop offset="0%" stop-color="rgba(255,255,255,0.7)"/>
    <stop offset="38%" stop-color="rgba(255,255,255,0.38)"/>
    <stop offset="72%" stop-color="rgba(255,255,255,0.12)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0.04)"/>
  </linearGradient>
  <linearGradient id="rim" x1="4%" y1="0%" x2="96%" y2="100%">
    <stop offset="0%" stop-color="rgba(255,255,255,0.42)"/>
    <stop offset="55%" stop-color="rgba(255,255,255,0.1)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0.06)"/>
  </linearGradient>
  <linearGradient id="liq" x1="0" y1="0" x2="0" y2="1">
    <stop id="l0" offset="0"/><stop id="l1" offset="0.45"/><stop id="l2" offset="1"/>
  </linearGradient>
  <linearGradient id="liqDeep" x1="0" y1="0" x2="0" y2="1">
    <stop id="ld0" offset="0" stop-opacity="0"/><stop id="ld1" offset="1"/>
  </linearGradient>
  <linearGradient id="poolWash" x1="0" y1="0" x2="0" y2="1">
    <stop id="pw0" offset="0"/><stop id="pw1" offset="0.55"/><stop id="pw2" offset="1"/>
  </linearGradient>
  <radialGradient id="beadG" cx="34%" cy="28%" r="68%">
    <stop id="bead0" offset="0%" stop-color="#fff"/>
    <stop id="bead1" offset="42%" stop-color="#fff" stop-opacity="0.92"/>
    <stop id="bead2" offset="100%"/>
  </radialGradient>
  <filter id="liqGlow" x="-40%" y="-60%" width="180%" height="220%">
    <feGaussianBlur stdDeviation="3" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="hzGlow" x="-10%" y="-200%" width="120%" height="500%">
    <feGaussianBlur stdDeviation="1.1" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="glow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="soft"><feGaussianBlur stdDeviation="2.8"/></filter>
  <filter id="specSoft"><feGaussianBlur stdDeviation="1.6"/></filter>
</defs>
<path id="shell" fill="rgba(9,9,16,0.5)"/>
<g clip-path="url(#clip)">
  <rect id="poolBase" x="0" y="0" width="${W}" height="${H}"/>
  <path id="liqDeep"/>
  <path id="liq"/>
  <line id="ghostTide" x1="5" x2="163" stroke-width="1.15" stroke-dasharray="4 3" opacity="0.42"/>
  <line id="horizon" x1="5" x2="163" stroke-width="1.35" opacity="0.9" filter="url(#hzGlow)"/>
  <path id="specSoft" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2.4" filter="url(#specSoft)" opacity="0.45"/>
  <path id="spec" fill="none" stroke="url(#specGrad)" stroke-width="1.05" stroke-linecap="round"/>
</g>
<path id="sheen" fill="url(#glass)" pointer-events="none"/>
<ellipse id="fresnelPatch" cx="36" cy="9" rx="48" ry="11" fill="url(#fresnel)" pointer-events="none" clip-path="url(#clip)"/>
<path id="rimPath" fill="none" stroke="url(#rim)" stroke-width="1.05" pointer-events="none"/>
<circle id="bead" r="3.3" fill="url(#beadG)" filter="url(#glow)" pointer-events="none"/>
<circle id="beadHit" r="9" fill="transparent" style="cursor:pointer"/>
<polygon id="crystal" opacity="0" pointer-events="none"/>
`;

  const bead = el('bead');
  const crystal = el('crystal');

  function reckon(p) {
    const stops = [[0, '#4A7CFF'], [0.35, '#90A8FF'], [0.55, '#F0A030'], [0.78, '#C07018'], [1, '#30B060']];
    for (let i = 0; i < stops.length - 1; i++) {
      if (p <= stops[i + 1][0]) return stops[i][1];
    }
    return stops[stops.length - 1][1];
  }

  function render() {
    const c = CATS[st.cat];
    const instab = 1 - st.steady;
    const wob = Math.sin(st.phase * 1.25) * (st.flow ? 0.15 : 1);
    const shell = superellipseShell(wob);

    el('shell').setAttribute('d', shell);
    el('clipPath').setAttribute('d', shell);
    el('sheen').setAttribute('d', shell);
    el('rimPath').setAttribute('d', shell);

    let fillP = st.fillP;
    if (st.settle === 'evaporating') fillP = st.evap * (1 - st.settleT);
    if (st.settle === 'ended') fillP = 0;

    const breath = st.breath > 0 ? Math.sin(st.breath * Math.PI) : 0;
    fillP = Math.min(0.94, fillP + breath * 0.04);

    const bottom = H - 1.5;
    const top = 3.5;
    const liquidH = bottom - top;
    const baseY = bottom - fillP * liquidH;

    let amp = c.amp * (0.22 + instab * 1.15);
    if (c.deep && st.steady > 0.7) amp *= 0.42;
    if (st.flow) amp *= 0.1;
    amp *= (1 - breath * 0.5);
    if (st.hover && !st.flow && !st.focus) {
      if (st.prox === 'peekPlus') amp *= 1.12;
      else if (st.prox === 'peek') amp *= 1.06;
      else amp *= 1.03;
    }

    const N = 48;
    let line = '';
    for (let i = 0; i <= N; i++) {
      const xr = i / N;
      const x = 2 + xr * (W - 4);
      const y = surfY(xr, baseY, amp, c.freq);
      line += `${i ? ` L ${x},${y}` : `M ${x},${y}`}`;
    }

    el('liq').setAttribute('d', `${line} L ${W - 2},${bottom + 2} L 2,${bottom + 2} Z`);
    el('liqDeep').setAttribute('d', `${line} L ${W - 2},${bottom + 2} L 2,${bottom + 2} Z`);
    el('spec').setAttribute('d', line);
    el('specSoft').setAttribute('d', line);

    const specOp = st.flow ? 0.35 : 0.82;
    el('spec').setAttribute('opacity', specOp);
    el('specSoft').setAttribute('opacity', st.flow ? 0.2 : 0.42);

    const hue = c.hue;
    const voyage = reckon(st.fillP);
    const rgb = hexToRgb(hue);
    const op = st.flow ? 0.34 : 0.74;
    const shellTint = mixHex('#0a0a12', hue, 0.14);
    el('shell').setAttribute('fill', shellTint);
    el('shell').setAttribute('opacity', st.flow ? 0.42 : 0.9);

    const poolTop = Math.max(top, baseY - 2);
    const pool = el('poolBase');
    pool.setAttribute('y', poolTop);
    pool.setAttribute('height', bottom - poolTop + 1);
    pool.setAttribute('fill', 'url(#poolWash)');
    el('pw0').setAttribute('stop-color', hue);
    el('pw0').setAttribute('stop-opacity', st.flow ? 0.38 : 0.52);
    el('pw1').setAttribute('stop-color', hue);
    el('pw1').setAttribute('stop-opacity', st.flow ? 0.42 : 0.56);
    el('pw2').setAttribute('stop-color', mixHex(hue, '#000000', 0.08));
    el('pw2').setAttribute('stop-opacity', st.flow ? 0.46 : 0.6);

    el('l0').setAttribute('stop-color', hue);
    el('l0').setAttribute('stop-opacity', op);
    el('l1').setAttribute('stop-color', hue);
    el('l1').setAttribute('stop-opacity', op);
    el('l2').setAttribute('stop-color', hue);
    el('l2').setAttribute('stop-opacity', Math.min(1, op + 0.06));
    el('liq').setAttribute('fill', 'url(#liq)');

    el('ld1').setAttribute('stop-color', hue);
    el('ld1').setAttribute('stop-opacity', st.flow ? 0.12 : 0.2);
    el('liqDeep').setAttribute('fill', 'url(#liqDeep)');

    const tideY = bottom - st.tideP * liquidH;
    const ghost = el('ghostTide');
    ghost.setAttribute('y1', tideY);
    ghost.setAttribute('y2', tideY);
    ghost.setAttribute('stroke', reckon(st.tideP));
    ghost.setAttribute('opacity', st.flow ? 0.26 : 0.44);

    const hz = el('horizon');
    hz.setAttribute('y1', baseY);
    hz.setAttribute('y2', baseY);
    hz.setAttribute('stroke', voyage);
    hz.setAttribute('opacity', st.flow ? 0.5 : 0.95);

    el('bead2').setAttribute('stop-color', hue);
    el('bead2').setAttribute('stop-opacity', 0.5);
    bead.setAttribute('style', `filter:url(#glow) drop-shadow(0 0 4px rgba(${rgb.r},${rgb.g},${rgb.b},0.7))`);

    const peakX = 1 / PHI;
    const bx = 2 + peakX * (W - 4);
    const by = surfY(peakX, baseY, amp, c.freq);
    const j = instab * (st.flow ? 0 : 1.6);
    const jx = Math.sin(st.phase * 8.2) * j;
    const jy = Math.cos(st.phase * 10.5) * j * 0.35;
    bead.setAttribute('cx', bx + jx);
    bead.setAttribute('cy', by + jy);
    bead.setAttribute('opacity', st.flow ? 0.32 : 1);
    const beadHit = el('beadHit');
    beadHit.setAttribute('cx', bx + jx);
    beadHit.setAttribute('cy', by + jy);
    beadHit.setAttribute('opacity', st.flow || st.focus ? 0 : 1);

    if (st.cryOn || st.settle === 'ended') {
      const ccx = st.settle === 'ended' ? W / 2 : bx + jx;
      const ccy = st.settle === 'ended' ? H / 2 : by + jy;
      const pr = st.settle === 'ended' ? 1 : Math.sin(st.crystal * Math.PI);
      const s = 2.5 + pr * 4;
      crystal.setAttribute('points', `${ccx},${ccy - s} ${ccx + s * 0.65},${ccy} ${ccx},${ccy + s} ${ccx - s * 0.65},${ccy}`);
      crystal.setAttribute('fill', st.settle === 'ended' ? reckon(st.fillP) : '#fff');
      crystal.setAttribute('opacity', st.settle === 'ended' ? 0.9 : pr);
    } else {
      crystal.setAttribute('opacity', 0);
    }

    const fp = el('fresnelPatch');
    fp.setAttribute('opacity', st.flow ? 0.3 : (0.72 + breath * 0.08));
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    st.phase += dt;

    if (st.breath > 0) {
      st.breath += dt / 2.2;
      if (st.breath >= 1) st.breath = 0;
    }
    if (st.cryOn) {
      st.crystal += dt / 1.5;
      if (st.crystal >= 1) {
        st.cryOn = false;
        st.crystal = 0;
      }
    }
    if (st.settle === 'evaporating') {
      st.settleT += dt / 3.8;
      if (st.settleT >= 1) {
        st.settle = 'ended';
        setProx('settle');
      }
    }

    st.wetBias += (0 - st.wetBias) * Math.min(1, dt * (st.hover ? 6 : 10));

    render();
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
      const s = SESSIONS.find((x) => x.now);
      if (s) {
        s.cat = k;
        s.app = CATS[k].app;
      }
      focusUI?.useMock(SESSIONS);
      sync();
    };
    cats.appendChild(d);
  });

  el('fill').oninput = (e) => {
    st.fillP = e.target.value / 100;
    el('fillVal').textContent = `${e.target.value}%`;
    sync();
  };

  el('steady').oninput = (e) => {
    st.steady = e.target.value / 100;
    el('stVal').textContent = st.steady > 0.75 ? '稳' : st.steady > 0.45 ? '微澜' : '散';
    sync();
  };

  const hit = el('hit');
  const peek = el('peek');
  const card = el('card');
  const wallpaper = el('wallpaper');
  let pt1;
  let pt2;
  let maTimer;
  let pourTimer;

  function setProx(p) {
    st.prox = p;
    const names = {
      ambient: 'AMBIENT',
      peek: 'PEEK',
      peekPlus: 'PEEK+',
      pouring: 'Ma…',
      focus: 'FOCUS',
      closing: '收起',
      flow: 'FLOW',
      settle: 'SETTLE',
    };
    el('stateName').textContent = names[p] || p;
  }

  function setBackdrop(on) {
    wallpaper.classList.toggle('focus-backdrop', on);
    document.querySelector('.desktop')?.classList.toggle('focus-mode', on);
  }

  function clearPeekTimers() {
    clearTimeout(pt1);
    clearTimeout(pt2);
    clearTimeout(maTimer);
    clearTimeout(pourTimer);
  }

  function hidePeek() {
    peek.classList.remove('show', 'peek-plus');
    if (!st.focus && !st.closing && st.prox !== 'pouring' && !st.flow && st.settle === 'none') {
      if (st.hover) setProx('peek');
      else setProx('ambient');
    }
  }

  function showPeekTier(tier) {
    if (st.flow || st.focus || st.closing || st.prox === 'pouring' || st.settle !== 'none') return;
    const meta = focusUI?.getNowMeta() || { label: CATS[st.cat]?.label, app: CATS[st.cat]?.app, sessionMins: Math.round(st.fillP * 120) };
    const mins = meta.sessionMins || Math.round(st.fillP * 120);
    if (tier === 'peek') {
      setProx('peek');
      peek.textContent = `${meta.label} · ${mins}m`;
      peek.classList.add('show');
      peek.classList.remove('peek-plus');
    } else {
      setProx('peekPlus');
      peek.innerHTML = `${meta.label} · ${mins}m<span class="sub">${meta.app}</span>`;
      peek.classList.add('show', 'peek-plus');
    }
  }

  function triggerCrystal() {
    st.cryOn = true;
    st.crystal = 0.001;
    setProx('peekPlus');
    el('stateName').textContent = '+1 🍅';
    setTimeout(() => setProx(st.flow ? 'flow' : st.focus ? 'focus' : 'ambient'), 1600);
  }

  function openCard() {
    if (st.focus || st.closing) return;
    clearPeekTimers();
    peek.classList.remove('show', 'peek-plus');
    setProx('pouring');
    card.classList.remove('closing');
    card.classList.add('pouring', 'open');
    card.style.willChange = 'height';
    st.focus = true;
    setBackdrop(true);
    sync();
    maTimer = setTimeout(() => {
      card.classList.remove('pouring');
      setProx('focus');
      pourTimer = setTimeout(() => {
        card.style.willChange = 'auto';
      }, MA.pour);
    }, MA.focus);
  }

  function closeCard() {
    if (!st.focus) return;
    clearPeekTimers();
    st.closing = true;
    setProx('closing');
    card.style.willChange = 'height';
    card.classList.remove('open', 'pouring');
    card.classList.add('closing');
    setBackdrop(false);
    setTimeout(() => {
      st.focus = false;
      st.closing = false;
      card.classList.remove('closing', 'pouring');
      card.style.willChange = 'auto';
      setProx(st.flow ? 'flow' : 'ambient');
    }, 360);
  }

  hit.setAttribute('tabindex', '0');
  hit.addEventListener('mouseenter', () => {
    if (st.flow || st.focus || st.closing) return;
    st.hover = true;
    pt1 = setTimeout(() => showPeekTier('peek'), MA.peek);
    pt2 = setTimeout(() => showPeekTier('peekPlus'), MA.peekPlus);
  });
  hit.addEventListener('mouseleave', () => {
    st.hover = false;
    st.wetBias = 0;
    clearPeekTimers();
    peek.classList.remove('show', 'peek-plus');
    if (!st.focus && !st.closing && !st.flow) setProx('ambient');
  });
  hit.addEventListener('mousemove', (e) => {
    if (st.flow || st.focus) return;
    const rect = hit.getBoundingClientRect();
    const x = (e.clientX - rect.left) / Math.max(rect.width, 1);
    st.wetBias = Math.max(-1, Math.min(1, x * 2 - 1));
  });
  hit.addEventListener('click', (e) => {
    e.stopPropagation();
    if (st.focus || st.closing) closeCard();
    else openCard();
  });
  hit.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (st.focus || st.closing) closeCard();
      else openCard();
    }
  });

  el('beadHit').addEventListener('click', (e) => {
    e.stopPropagation();
    if (st.flow) return;
    triggerCrystal();
  });

  wallpaper.addEventListener('click', () => {
    if (st.focus || st.closing) closeCard();
  });
  el('cardX').addEventListener('click', (e) => {
    e.stopPropagation();
    closeCard();
  });
  card.addEventListener('click', (e) => e.stopPropagation());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && st.focus) closeCard();
  });

  el('flowSw').onclick = () => {
    st.flow = !st.flow;
    el('flowSw').classList.toggle('on', st.flow);
    if (st.flow) {
      clearPeekTimers();
      peek.classList.remove('show', 'peek-plus');
      st.hover = false;
      closeCard();
    }
    setProx(st.flow ? 'flow' : st.focus ? 'focus' : 'ambient');
  };

  el('bSeen').onclick = () => {
    if (st.flow) return;
    st.breath = 0.001;
    el('stateName').textContent = '呼吸';
    setTimeout(() => setProx(st.focus ? 'focus' : 'ambient'), 2200);
  };

  el('bCry').onclick = () => {
    if (st.flow) return;
    triggerCrystal();
  };

  el('bSet').onclick = () => {
    st.settle = 'evaporating';
    st.settleT = 0;
    st.evap = st.fillP;
    closeCard();
    setProx('蒸发中');
  };

  el('bRst').onclick = () => {
    st.settle = 'none';
    st.settleT = 0;
    st.breath = 0;
    st.cryOn = false;
    closeCard();
    setProx('ambient');
  };

  function fmtMin(m) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return h ? `${h}h${String(mm).padStart(2, '0')}m` : `${mm}m`;
  }

  // ===== A · 时间的横截面（概念图 1:1）=====
  const LAYER = {
    coding: { en: 'Coding', hue: '#818CF8' },
    project: { en: 'Project', hue: '#6EE7B7' },
    entertainment: { en: 'Distraction', hue: '#FCA5A5' },
    comms: { en: 'Meetings', hue: '#F9A8D4' },
    learning: { en: 'Learning', hue: '#FCD34D' },
    ai: { en: 'AI', hue: '#67E8F9' },
    neutral: { en: 'Other', hue: '#A0A0B8' },
    idle: { en: 'Idle', hue: '#505068' },
  };
  const PRODUCTIVE_CAP_SEC = 8 * 3600;
  const LEGEND_ORDER = ['coding', 'entertainment', 'comms', 'learning', 'idle'];

  function buildFocusA() {
    const svg = el('focusA');
    const VW = 640;
    const VH = 420;
    const cx = 320;
    const mouthHalf = 84;
    const bowlH = 36;
    const yFunnel = 44;
    const yNeckEnd = 108;
    const neckHalf = 2.8;
    const cyS = 290;
    const R = 118;
    const ySphereTop = cyS - R;
    const yBotV = cyS + R;
    const smooth = (t) => t * t * (3 - 2 * t);
    const hue = LAYER.coding.hue;

    function vesselHalfW(y) {
      if (y <= bowlH) return mouthHalf;
      if (y <= yFunnel) {
        const t = (y - bowlH) / (yFunnel - bowlH);
        return neckHalf + (mouthHalf - neckHalf) * Math.pow(1 - t, 3.2);
      }
      if (y <= yNeckEnd) return neckHalf;
      if (y < ySphereTop) {
        const t = (y - yNeckEnd) / (ySphereTop - yNeckEnd);
        const shw = Math.sqrt(Math.max(0, R * R - (y - cyS) * (y - cyS)));
        return neckHalf + (shw - neckHalf) * smooth(t);
      }
      if (y <= yBotV) return Math.sqrt(Math.max(0, R * R - (y - cyS) * (y - cyS)));
      return -1;
    }

    function vesselPath() {
      const lipR = 5;
      let d = `M${cx - mouthHalf + lipR},0 Q${cx - mouthHalf},0 ${cx - mouthHalf},${lipR} `;
      d += `L${cx - mouthHalf},${bowlH} `;
      for (let y = bowlH + 0.8; y <= yBotV; y += 0.8) {
        const hw = vesselHalfW(y);
        if (hw < 0.3) continue;
        d += `L${(cx - hw).toFixed(2)},${y.toFixed(2)} `;
      }
      for (let y = yBotV; y >= bowlH + 0.8; y -= 0.8) {
        const hw = vesselHalfW(y);
        if (hw < 0.3) continue;
        d += `L${(cx + hw).toFixed(2)},${y.toFixed(2)} `;
      }
      d += `L${cx + mouthHalf},${bowlH} L${cx + mouthHalf},${lipR} `;
      d += `Q${cx + mouthHalf},0 ${cx + mouthHalf - lipR},0 L${cx - mouthHalf + lipR},0 Z`;
      return d;
    }

    const vessel = vesselPath();

    const stackOrder = ['idle', 'learning', 'comms', 'entertainment', 'coding'];
    const agg = {};
    SESSIONS.forEach((s) => { agg[s.cat] = (agg[s.cat] || 0) + s.mins; });
    if (agg.ai) agg.idle = (agg.idle || 0) + agg.ai;
    const total = Object.values(agg).reduce((a, b) => a + b, 0);
    const used = stackOrder.filter((k) => agg[k]);

    const stackTop = ySphereTop + 6;
    const stackBot = yBotV - 6;
    const stackH = stackBot - stackTop;
    const bands = [];
    let yc = stackBot;
    used.forEach((k) => {
      const h = Math.max(3, (agg[k] / total) * stackH);
      bands.push({ k, y0: yc - h, y1: yc });
      yc -= h;
    });

    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

    let strata = '';
    bands.forEach((b) => {
      const meta = LAYER[b.k] || LAYER.idle;
      const h = b.y1 - b.y0;
      strata += `<rect x="${cx - R + 2}" y="${b.y0.toFixed(1)}" width="${(R * 2 - 4).toFixed(1)}" height="${h.toFixed(1)}" fill="${meta.hue}" opacity="0.55"/>`;
      for (let yy = b.y0; yy < b.y1; yy += 0.65) {
        const hw = vesselHalfW(yy) - 2;
        if (hw < 4) continue;
        const x0 = cx - hw;
        const xW = hw * 2;
        const deep = mixHex(meta.hue, '#050508', 0.45);
        const lite = mixHex(meta.hue, '#ffffff', 0.32);
        const col = rnd() > 0.85 ? '#fff' : rnd() > 0.5 ? lite : rnd() > 0.45 ? meta.hue : deep;
        strata += `<line x1="${x0.toFixed(1)}" x2="${(x0 + xW).toFixed(1)}" y1="${yy.toFixed(2)}" y2="${yy.toFixed(2)}" stroke="${col}" stroke-width="${(0.55 + rnd() * 0.55).toFixed(2)}" opacity="${(0.2 + rnd() * 0.42).toFixed(2)}"/>`;
        if (rnd() > 0.55) {
          const fx = x0 + rnd() * xW;
          strata += `<line x1="${fx.toFixed(1)}" x2="${(fx + 2 + rnd() * 10).toFixed(1)}" y1="${yy.toFixed(2)}" y2="${(yy + (rnd() - 0.5) * 0.8).toFixed(2)}" stroke="${lite}" stroke-width="0.3" opacity="0.16"/>`;
        }
      }
      if (bands.indexOf(b) < bands.length - 1) {
        const hw = vesselHalfW(b.y0);
        strata += `<line x1="${(cx - hw + 2).toFixed(1)}" x2="${(cx + hw - 2).toFixed(1)}" y1="${b.y0.toFixed(1)}" y2="${b.y0.toFixed(1)}" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>`;
      }
    });
    const topY = stackTop;

    const yPool = 28;
    const poolL = cx - mouthHalf + 5;
    const poolR = cx + mouthHalf - 5;
    const poolW = poolR - poolL;
    let poolSurf = `M${poolL},${yPool}`;
    for (let i = 1; i <= 40; i++) {
      const xr = i / 40;
      const xx = poolL + xr * poolW;
      const yy = yPool - Math.sin(xr * Math.PI * 2.1) * 1.6 - Math.sin(xr * Math.PI * 5.5) * 0.5;
      poolSurf += ` L${xx.toFixed(1)},${yy.toFixed(1)}`;
    }
    const poolFill = `${poolSurf} L${poolR},${bowlH - 1} L${poolL},${bowlH - 1} Z`;
    const poolXR = 1 / PHI;
    const poolDotX = poolL + poolXR * poolW;
    const poolDotY = yPool - Math.sin(poolXR * Math.PI * 2.1) * 1.6 - Math.sin(poolXR * Math.PI * 5.5) * 0.5 - 3.2;

    const mHw = vesselHalfW(topY);
    const mx0 = cx - mHw + 5;
    const mx1 = cx + mHw - 5;
    let meni = `M${mx0.toFixed(1)},${topY}`;
    for (let i = 1; i <= 40; i++) {
      const xr = i / 40;
      const xx = mx0 + xr * (mx1 - mx0);
      const crater = Math.pow(Math.cos((xr - 0.5) * Math.PI), 2.1) * 8;
      const yy = topY - Math.sin(xr * Math.PI) * 1.1 - Math.sin(xr * Math.PI * 4.8) * 0.45 - crater;
      meni += ` L${xx.toFixed(1)},${yy.toFixed(1)}`;
    }

    let streamDots = '';
    for (let y = bowlH; y <= topY + 2; y += 3.5) {
      const jitter = (rnd() - 0.5) * 1.2;
      const r = 0.55 + rnd() * 0.85;
      const op = 0.35 + rnd() * 0.55;
      streamDots += `<circle class="fa-spark" cx="${(cx + jitter).toFixed(2)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${hue}" opacity="${op.toFixed(2)}"/>`;
    }

    const ax = cx + R + 18;
    const ay = cyS;
    const ar = 150;
    const arcPt = (p) => {
      const phi = (0.5 - p) * Math.PI;
      return { x: ax + ar * Math.cos(phi), y: ay + ar * Math.sin(phi) };
    };
    const a0 = arcPt(0);
    const a1 = arcPt(1);
    const sunP = dayFrac(14.5);
    const sun = arcPt(sunP);
    const sunHue = '#E8A830';
    const tr0 = arcPt(Math.max(0, sunP - 0.1));
    const dawn = arcPt(0.02);
    const noon = arcPt(0.5);
    const dusk = arcPt(0.98);

    let legendSvg = '';
    let ly = 108;
    LEGEND_ORDER.forEach((k) => {
      if (!agg[k]) return;
      const meta = LAYER[k];
      legendSvg += `<circle cx="38" cy="${ly - 3}" r="3.2" fill="${meta.hue}"/>`;
      legendSvg += `<text x="50" y="${ly}" fill="#d0d0e0" font-size="11" font-family="Inter,system-ui,sans-serif">${meta.en}</text>`;
      legendSvg += `<text x="168" y="${ly}" fill="#8888a0" font-size="11" text-anchor="end" font-family="ui-monospace,monospace">${fmtMin(agg[k])}</text>`;
      ly += 20;
    });
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${days[now.getDay()]}`;

    svg.innerHTML =
      `<defs>
        <clipPath id="fa-clip"><path d="${vessel}"/></clipPath>
        <linearGradient id="fa-stream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${hue}" stop-opacity="1"/>
          <stop offset="70%" stop-color="${hue}" stop-opacity="0.75"/>
          <stop offset="100%" stop-color="${hue}" stop-opacity="0.2"/>
        </linearGradient>
        <filter id="fa-warp" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.07" numOctaves="2" seed="3" result="w"/>
          <feDisplacementMap in="SourceGraphic" in2="w" scale="2.8" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <filter id="fa-grain"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" seed="9" stitchTiles="stitch" result="n"/>
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 -0.28"/></filter>
        <linearGradient id="fa-sed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgba(255,255,255,0.12)"/>
          <stop offset="1" stop-color="rgba(0,0,0,0.3)"/>
        </linearGradient>
        <radialGradient id="fa-glass" cx="44%" cy="18%" r="85%">
          <stop offset="0" stop-color="rgba(255,255,255,0.14)"/>
          <stop offset="50%" stop-color="rgba(255,255,255,0.02)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.25)"/>
        </radialGradient>
        <filter id="fa-glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <marker id="fa-arr" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="rgba(255,255,255,0.28)"/></marker>
      </defs>
      <rect width="${VW}" height="${VH}" fill="#050508"/>
      <g class="fa-legend">
        <text x="32" y="72" fill="#f0efff" font-size="17" font-weight="500" font-family="Inter,system-ui,sans-serif">TimeLens</text>
        <text x="32" y="88" fill="#6b6b82" font-size="10.5" font-family="Inter,system-ui,sans-serif">the cross-section of time</text>
        ${legendSvg}
        <text x="32" y="${ly + 16}" fill="#a0a0b8" font-size="11" font-family="Inter,system-ui,sans-serif">Total ${fmtMin(total)}</text>
        <text x="32" y="${ly + 32}" fill="#6b6b82" font-size="10" font-family="Inter,system-ui,sans-serif">${dateStr}</text>
      </g>
      <g clip-path="url(#fa-clip)">
        <rect x="${cx - R}" y="0" width="${R * 2}" height="${VH}" fill="rgba(5,5,8,0.9)"/>
        <g class="strata-g" filter="url(#fa-warp)">${strata}</g>
        <rect x="${cx - R}" y="${stackTop}" width="${R * 2}" height="${stackH}" fill="url(#fa-sed)" opacity="0.3"/>
        <rect x="${cx - R}" y="${stackTop}" width="${R * 2}" height="${stackH}" filter="url(#fa-grain)" opacity="0.11" style="mix-blend-mode:overlay"/>
        <path class="pool-fill" d="${poolFill}" fill="${hue}" opacity="0.55"/>
        <path class="stream-a" d="M${cx},${yPool - 1} L${cx},${topY + 1}" stroke="url(#fa-stream)" stroke-width="1.4" stroke-linecap="round" filter="url(#fa-glow)"/>
        <g class="stream-g">${streamDots}</g>
        <ellipse class="splash-mound" cx="${cx}" cy="${(topY - 1.5).toFixed(1)}" rx="9" ry="3" fill="${hue}" opacity="0.32"/>
        <path d="${meni}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.8" opacity="0.72"/>
        <rect x="${cx - R}" y="0" width="${R * 2}" height="${VH}" fill="url(#fa-glass)"/>
      </g>
      <path d="${vessel}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>
      <path d="M${poolL},${1} L${poolR},${1}" stroke="rgba(255,255,255,0.4)" stroke-width="0.85" stroke-linecap="round"/>
      <circle cx="${poolDotX.toFixed(1)}" cy="${poolDotY.toFixed(1)}" r="2.2" fill="#fff" opacity="0.96" filter="url(#fa-glow)"/>
      <path d="M${(mx1 + 48).toFixed(1)},${(topY - 20).toFixed(1)} C ${(mx1 + 34).toFixed(1)},${(topY - 10).toFixed(1)} ${(cx + 12).toFixed(1)},${(topY - 3).toFixed(1)} ${cx},${(topY - 1).toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.65" marker-end="url(#fa-arr)"/>
      <text x="${(mx1 + 52).toFixed(0)}" y="${(topY - 18).toFixed(0)}" fill="rgba(210,208,255,0.5)" font-size="10.5" font-style="italic" font-family="Georgia,'Times New Roman',serif">because: Cursor</text>
      <path d="M${a0.x.toFixed(1)},${a0.y.toFixed(1)} A ${ar} ${ar} 0 0 0 ${a1.x.toFixed(1)},${a1.y.toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.75"/>
      <path d="M${tr0.x.toFixed(1)},${tr0.y.toFixed(1)} A ${ar} ${ar} 0 0 0 ${sun.x.toFixed(1)},${sun.y.toFixed(1)}" fill="none" stroke="${sunHue}" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
      <circle cx="${sun.x.toFixed(1)}" cy="${sun.y.toFixed(1)}" r="11" fill="${sunHue}" opacity="0.15" class="b-sun-halo"/>
      <circle cx="${sun.x.toFixed(1)}" cy="${sun.y.toFixed(1)}" r="3.8" fill="${sunHue}" filter="url(#fa-glow)"/>
      <text x="${(noon.x + 8).toFixed(0)}" y="${(noon.y + 2).toFixed(0)}" fill="#8a8aa0" font-size="9.5" font-family="Inter,sans-serif">Noon</text>
      <text x="${(noon.x + 8).toFixed(0)}" y="${(noon.y + 13).toFixed(0)}" fill="#6b6b82" font-size="8.5" font-family="ui-monospace,monospace">12:00</text>
      <text x="${(dusk.x + 10).toFixed(0)}" y="${(dusk.y + 2).toFixed(0)}" fill="#8a8aa0" font-size="9.5" font-family="Inter,sans-serif">Dusk</text>
      <text x="${(dusk.x + 10).toFixed(0)}" y="${(dusk.y + 13).toFixed(0)}" fill="#6b6b82" font-size="8.5" font-family="ui-monospace,monospace">18:00</text>
      <text x="${(dawn.x - 8).toFixed(0)}" y="${(dawn.y + 2).toFixed(0)}" fill="#8a8aa0" font-size="9.5" text-anchor="end" font-family="Inter,sans-serif">Dawn</text>
      <text x="${(dawn.x - 8).toFixed(0)}" y="${(dawn.y + 13).toFixed(0)}" fill="#6b6b82" font-size="8.5" text-anchor="end" font-family="ui-monospace,monospace">06:00</text>`;

    if (el('legendA')) el('legendA').innerHTML = '';
  }

  // ===== B · 星图（概念图日弧 + 黄道星）=====
  const STAR_LAYER = {
    coding: { en: 'Coding', hue: '#3E3A9E' },
    entertainment: { en: 'Distraction', hue: '#A84888' },
    comms: { en: 'Meetings', hue: '#2A9888' },
    learning: { en: 'Learning', hue: '#C89830' },
    ai: { en: 'AI', hue: '#4A8EB8' },
    idle: { en: 'Other', hue: '#3A3648' },
  };

  function buildFocusB() {
    const svg = el('focusB');
    const VW = 640;
    const VH = 420;
    const ax = 398;
    const ay = 248;
    const ar = 168;
    const arcPt = (p) => {
      const phi = (0.5 - p) * Math.PI;
      return { x: ax + ar * Math.cos(phi), y: ay + ar * Math.sin(phi) };
    };
    const sunP = dayFrac(14.0);
    const sun = arcPt(sunP);
    const sunHue = '#E8A830';
    const dawn = arcPt(0.02);
    const noon = arcPt(0.5);
    const dusk = arcPt(0.98);

    let seed = 13;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

    let sky = '';
    for (let i = 0; i < 120; i++) {
      const x = rnd() * VW;
      const y = rnd() * VH;
      const r = 0.25 + rnd() * 0.9;
      const op = 0.12 + rnd() * 0.45;
      sky += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity="${op.toFixed(2)}"/>`;
    }

    const sorted = [...SESSIONS].sort((a, b) => a.t - b.t);
    let stars = '';
    let trail = '';
    let prev = null;
    sorted.forEach((s, i) => {
      const p = dayFrac(s.t);
      const pt = arcPt(p);
      const meta = STAR_LAYER[s.cat] || { hue: CATS[s.cat]?.hue || '#888', en: s.label };
      const r = 2.2 + Math.min(7, s.mins / 18);
      const isNow = !!s.now;
      const col = isNow ? sunHue : meta.hue;
      if (prev) {
        trail += `<line x1="${prev.x.toFixed(1)}" y1="${prev.y.toFixed(1)}" x2="${pt.x.toFixed(1)}" y2="${pt.y.toFixed(1)}" stroke="rgba(255,255,255,0.08)" stroke-width="0.6" stroke-dasharray="2 5"/>`;
      }
      prev = pt;
      stars +=
        `<g class="b-star" style="transition-delay:${(0.2 + i * 0.08).toFixed(2)}s">` +
        (isNow ? `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${(r + 10).toFixed(1)}" fill="${col}" opacity="0.14" class="b-sun-halo"/>` : '') +
        `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${(r + 2.5).toFixed(1)}" fill="${col}" opacity="0.2"/>` +
        `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${r.toFixed(1)}" fill="${col}" filter="url(#fb-glow)"/>` +
        `<text x="${pt.x.toFixed(1)}" y="${(pt.y - r - 6).toFixed(1)}" fill="#9a9ab4" font-size="8.5" text-anchor="middle" font-family="ui-monospace,monospace">${String(Math.floor(s.t)).padStart(2, '0')}:${String(Math.round((s.t % 1) * 60)).padStart(2, '0')}</text>` +
        `</g>`;
    });

    const ghostPts = [];
    for (let i = 0; i <= 24; i++) ghostPts.push(arcPt(i / 24));
    const ghostD = ghostPts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const a0 = arcPt(0);
    const a1 = arcPt(1);
    const tr0 = arcPt(Math.max(0, sunP - 0.1));

    let legendSvg = '';
    let ly = 108;
    ['coding', 'entertainment', 'comms', 'learning', 'ai'].forEach((k) => {
      const mins = SESSIONS.filter((s) => s.cat === k).reduce((a, s) => a + s.mins, 0);
      if (!mins) return;
      const meta = STAR_LAYER[k];
      legendSvg += `<circle cx="38" cy="${ly - 3}" r="3.2" fill="${meta.hue}"/>`;
      legendSvg += `<text x="50" y="${ly}" fill="#d0d0e0" font-size="11" font-family="Inter,system-ui,sans-serif">${meta.en}</text>`;
      legendSvg += `<text x="168" y="${ly}" fill="#8888a0" font-size="11" text-anchor="end" font-family="ui-monospace,monospace">${fmtMin(mins)}</text>`;
      ly += 20;
    });
    const total = SESSIONS.reduce((a, s) => a + s.mins, 0);
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${days[now.getDay()]}`;

    svg.innerHTML =
      `<defs>
        <linearGradient id="fb-arc" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#4A6A9A" stop-opacity="0.35"/>
          <stop offset="50%" stop-color="#8A9AB8" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#C87830" stop-opacity="0.45"/>
        </linearGradient>
        <filter id="fb-glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="fb-nebula" cx="70%" cy="45%" r="55%">
          <stop offset="0" stop-color="rgba(62,58,158,0.12)"/>
          <stop offset="100%" stop-color="rgba(5,5,8,0)"/>
        </radialGradient>
      </defs>
      <rect width="${VW}" height="${VH}" fill="#050508"/>
      <rect width="${VW}" height="${VH}" fill="url(#fb-nebula)"/>
      <g class="b-bg">${sky}</g>
      <g class="fb-legend">
        <text x="32" y="72" fill="#f0efff" font-size="17" font-weight="500" font-family="Inter,system-ui,sans-serif">TimeLens</text>
        <text x="32" y="88" fill="#6b6b82" font-size="10.5" font-family="Inter,system-ui,sans-serif">the star chart of today</text>
        ${legendSvg}
        <text x="32" y="${ly + 16}" fill="#a0a0b8" font-size="11" font-family="Inter,system-ui,sans-serif">Total ${fmtMin(total)}</text>
        <text x="32" y="${ly + 32}" fill="#6b6b82" font-size="10" font-family="Inter,system-ui,sans-serif">${dateStr}</text>
      </g>
      <path class="b-ghost" d="${ghostD}" fill="none"/>
      <path class="b-arc" d="M${a0.x.toFixed(1)},${a0.y.toFixed(1)} A ${ar} ${ar} 0 0 0 ${a1.x.toFixed(1)},${a1.y.toFixed(1)}" fill="none" stroke="url(#fb-arc)" stroke-width="0.85" opacity="0.55"/>
      <path d="M${a0.x.toFixed(1)},${a0.y.toFixed(1)} A ${ar} ${ar} 0 0 0 ${a1.x.toFixed(1)},${a1.y.toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.75"/>
      ${trail}${stars}
      <path d="M${tr0.x.toFixed(1)},${tr0.y.toFixed(1)} A ${ar} ${ar} 0 0 0 ${sun.x.toFixed(1)},${sun.y.toFixed(1)}" fill="none" stroke="${sunHue}" stroke-width="1.3" stroke-linecap="round" opacity="0.42"/>
      <circle cx="${sun.x.toFixed(1)}" cy="${sun.y.toFixed(1)}" r="12" fill="${sunHue}" opacity="0.14" class="b-sun-halo"/>
      <circle cx="${sun.x.toFixed(1)}" cy="${sun.y.toFixed(1)}" r="4" fill="${sunHue}" filter="url(#fb-glow)"/>
      <text x="${(noon.x + 8).toFixed(0)}" y="${(noon.y + 2).toFixed(0)}" fill="#8a8aa0" font-size="9.5" font-family="Inter,sans-serif">Noon</text>
      <text x="${(noon.x + 8).toFixed(0)}" y="${(noon.y + 13).toFixed(0)}" fill="#6b6b82" font-size="8.5" font-family="ui-monospace,monospace">12:00</text>
      <text x="${(dusk.x + 10).toFixed(0)}" y="${(dusk.y + 2).toFixed(0)}" fill="#8a8aa0" font-size="9.5" font-family="Inter,sans-serif">Dusk</text>
      <text x="${(dusk.x + 10).toFixed(0)}" y="${(dusk.y + 13).toFixed(0)}" fill="#6b6b82" font-size="8.5" font-family="ui-monospace,monospace">18:00</text>
      <text x="${(dawn.x - 8).toFixed(0)}" y="${(dawn.y + 2).toFixed(0)}" fill="#8a8aa0" font-size="9.5" text-anchor="end" font-family="Inter,sans-serif">Dawn</text>
      <text x="${(dawn.x - 8).toFixed(0)}" y="${(dawn.y + 13).toFixed(0)}" fill="#6b6b82" font-size="8.5" text-anchor="end" font-family="ui-monospace,monospace">06:00</text>
      <text x="${(ax - 20).toFixed(0)}" y="${(ay + ar + 28).toFixed(0)}" fill="rgba(210,208,255,0.45)" font-size="10" font-style="italic" font-family="Georgia,serif" text-anchor="middle">because: Cursor</text>`;

    el('stripB').innerHTML =
      `<span>DIEI <b>168·36</b></span><span>TEMPUS <b>14:00</b></span>` +
      `<span>STELLAE <b>${SESSIONS.length}</b></span><span>CURSUS <b>${Math.round(total / 60 * 10) / 10}h</b></span>`;
  }

  // —— 太阳系历（stjarnhimlen.se / JPL 近似根数；日心黄道，逆时针顺行）——
  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;
  const J2000 = 2451545.0;
  const ORBIT_EL = {
    mercury: { N: 48.3313, Ni: 3.24587e-5, i: 7.0047, ii: 5e-8, w: 29.1241, wi: 1.01444e-5, a: 0.387098, e: 0.205635, ei: 5.59e-10, M: 168.6562, Mi: 4.0923344368 },
    venus: { N: 76.6799, Ni: 2.4659e-5, i: 3.3946, ii: 2.75e-8, w: 54.8910, wi: 1.38374e-5, a: 0.723330, e: 0.006773, ei: -1.302e-9, M: 48.0052, Mi: 1.6021302244 },
    earth: { N: 0, Ni: 0, i: 0, ii: 0, w: 282.93735, wi: 4.70935e-5, a: 1.000002, e: 0.016708, ei: -1.25e-9, M: 357.51716, Mi: 0.9856002825 },
    mars: { N: 49.5574, Ni: 2.11081e-5, i: 1.8497, ii: -1.78e-8, w: 286.5016, wi: 2.92961e-5, a: 1.523688, e: 0.093405, ei: 2.516e-9, M: 18.6021, Mi: 0.5240207766 },
  };
  const BODY_SCALE = { sun: 1.42, mercury: 0.38, venus: 0.56, earth: 0.58, mars: 0.48, moon: 0.32 };
  const BODY_LABEL = { sun: 'Sun', mercury: 'Mercury', venus: 'Venus', earth: 'Earth', mars: 'Mars', moon: 'Moon' };

  function julianDay(y, m, day) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
  }

  function sessionJD(t) {
    const n = new Date();
    const h = Math.floor(t);
    const mi = Math.round((t % 1) * 60);
    return julianDay(n.getFullYear(), n.getMonth() + 1, n.getDate() + (h + mi / 60) / 24);
  }

  function keplerE(Mdeg, e) {
    const M = ((Mdeg % 360) + 360) % 360 * RAD;
    let E = M;
    const eo = e * DEG;
    for (let k = 0; k < 7; k++) E = M + eo * Math.sin(E);
    return E;
  }

  function helioRect(body, jd) {
    const o = ORBIT_EL[body];
    const d = jd - J2000;
    const N = (o.N + o.Ni * d) * RAD;
    const incl = (o.i + o.ii * d) * RAD;
    const w = (o.w + o.wi * d) * RAD;
    const a = o.a;
    const e = o.e + o.ei * d;
    const M = o.M + o.Mi * d;
    const E = keplerE(M, e);
    const xv = a * (Math.cos(E) - e);
    const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const v = Math.atan2(yv, xv);
    const r = a * (1 - e * Math.cos(E));
    const u = v + w;
    const x = r * (Math.cos(N) * Math.cos(u) - Math.sin(N) * Math.sin(u) * Math.cos(incl));
    const y = r * (Math.sin(N) * Math.cos(u) + Math.cos(N) * Math.sin(u) * Math.cos(incl));
    const z = r * Math.sin(u) * Math.sin(incl);
    return { x, y, z, r, lon: Math.atan2(y, x), lat: Math.asin(z / r) };
  }

  function moonHelio(jd) {
    const d = jd - J2000;
    const earth = helioRect('earth', jd);
    const N = (125.1228 - 0.0529538083 * d) * RAD;
    const incl = 5.1454 * RAD;
    const w = (318.0634 + 0.1643573223 * d) * RAD;
    const a = 0.00257;
    const e = 0.0549;
    const M = 115.3654 + 13.0649929539 * d;
    const E = keplerE(M, e);
    const xv = a * (Math.cos(E) - e);
    const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const v = Math.atan2(yv, xv);
    const rm = a * (1 - e * Math.cos(E));
    const u = v + w;
    const xm = rm * (Math.cos(N) * Math.cos(u) - Math.sin(N) * Math.sin(u) * Math.cos(incl));
    const ym = rm * (Math.sin(N) * Math.cos(u) + Math.cos(N) * Math.sin(u) * Math.cos(incl));
    const zm = rm * Math.sin(u) * Math.sin(incl);
    const x = earth.x + xm, y = earth.y + ym, z = earth.z + zm;
    const r = Math.sqrt(x * x + y * y + z * z);
    return { x, y, z, r, lon: Math.atan2(y, x), lat: Math.asin(z / r) };
  }

  function bodyHelio(body, jd) {
    return body === 'moon' ? moonHelio(jd) : helioRect(body, jd);
  }

  function helioScreen(h, C, auPx) {
    return { x: C.x + h.x * auPx, y: C.y - h.y * auPx, lon: h.lon, r: h.r };
  }

  const CAT_PLANET = { learning: 'mercury', coding: 'venus', comms: 'earth', ai: 'mars', entertainment: 'moon' };

  /** 活动 → 天体；此刻在地球（观测者所在） */
  function assignBody(s) {
    if (s.now) return 'earth';
    if (s.cat === 'coding') return 'venus';
    return CAT_PLANET[s.cat] || 'mercury';
  }

  function planetDefs() {
    return `<radialGradient id="pg-sun" cx="38%" cy="34%" r="70%"><stop offset="0%" stop-color="#FFF8D8"/><stop offset="45%" stop-color="#F5B020"/><stop offset="100%" stop-color="#B85808"/></radialGradient>
        <radialGradient id="pg-mercury" cx="42%" cy="38%" r="65%"><stop offset="0%" stop-color="#B0AAA4"/><stop offset="100%" stop-color="#5E5850"/></radialGradient>
        <radialGradient id="pg-venus" cx="35%" cy="32%" r="68%"><stop offset="0%" stop-color="#F5E6C8"/><stop offset="55%" stop-color="#D4B878"/><stop offset="100%" stop-color="#A88848"/></radialGradient>
        <radialGradient id="pg-earth" cx="40%" cy="38%" r="68%"><stop offset="0%" stop-color="#5AA8E8"/><stop offset="55%" stop-color="#2A68B8"/><stop offset="100%" stop-color="#184878"/></radialGradient>
        <radialGradient id="pg-mars" cx="38%" cy="35%" r="68%"><stop offset="0%" stop-color="#E87850"/><stop offset="55%" stop-color="#C04028"/><stop offset="100%" stop-color="#782018"/></radialGradient>
        <radialGradient id="pg-moon" cx="42%" cy="38%" r="66%"><stop offset="0%" stop-color="#C8C8D0"/><stop offset="100%" stop-color="#7A7A88"/></radialGradient>`;
  }

  function pf(n) { return Number(n).toFixed(1); }

  function renderPlanet(body, x, y, r, isNow) {
    const fx = pf(x), fy = pf(y), fr = pf(r);
    let g = '';
    switch (body) {
      case 'sun':
        g += `<circle cx="${fx}" cy="${fy}" r="${pf(r * 2.2)}" fill="#F0A820" opacity="0.11" class="b-sun-halo" filter="url(#u-sun-glow)"/>`;
        g += `<circle cx="${fx}" cy="${fy}" r="${fr}" fill="url(#pg-sun)" filter="url(#u-sun-glow)"/>`;
        break;
      case 'mercury':
        g += `<circle cx="${fx}" cy="${fy}" r="${fr}" fill="url(#pg-mercury)"/>`;
        g += `<circle cx="${pf(x - r * 0.25)}" cy="${pf(y + r * 0.2)}" r="${pf(r * 0.18)}" fill="#4a4540" opacity="0.35"/>`;
        g += `<circle cx="${pf(x + r * 0.15)}" cy="${pf(y - r * 0.1)}" r="${pf(r * 0.12)}" fill="#6a6560" opacity="0.25"/>`;
        break;
      case 'venus':
        g += `<circle cx="${fx}" cy="${fy}" r="${fr}" fill="url(#pg-venus)"/>`;
        g += `<ellipse cx="${pf(x - r * 0.25)}" cy="${pf(y - r * 0.3)}" rx="${pf(r * 0.45)}" ry="${pf(r * 0.25)}" fill="#fff" opacity="0.12"/>`;
        break;
      case 'earth':
        g += `<circle cx="${fx}" cy="${fy}" r="${fr}" fill="url(#pg-earth)"/>`;
        g += `<ellipse cx="${pf(x - r * 0.18)}" cy="${pf(y - r * 0.05)}" rx="${pf(r * 0.32)}" ry="${pf(r * 0.24)}" fill="#48A060" opacity="0.88"/>`;
        g += `<ellipse cx="${pf(x + r * 0.22)}" cy="${pf(y + r * 0.2)}" rx="${pf(r * 0.14)}" ry="${pf(r * 0.1)}" fill="#48A060" opacity="0.6"/>`;
        g += `<circle cx="${fx}" cy="${fy}" r="${fr}" fill="none" stroke="rgba(160,210,255,0.22)" stroke-width="0.35"/>`;
        if (isNow) {
          const L = r + 7;
          g += `<circle cx="${fx}" cy="${fy}" r="${pf(r + 9)}" fill="none" stroke="#F0C050" stroke-width="0.75" opacity="0.55" class="b-sun-halo"/>`;
          g += `<path d="M${pf(x - L)},${fy} H${pf(x + L)} M${fx},${pf(y - L)} V${pf(y + L)}" stroke="#F0C050" stroke-width="0.85" opacity="0.62" filter="url(#u-sun-glow)"/>`;
        }
        break;
      case 'mars':
        g += `<circle cx="${fx}" cy="${fy}" r="${fr}" fill="url(#pg-mars)"/>`;
        g += `<circle cx="${pf(x - r * 0.15)}" cy="${pf(y - r * 0.35)}" r="${pf(r * 0.18)}" fill="#E8E8F0" opacity="0.55"/>`;
        g += `<ellipse cx="${pf(x + r * 0.1)}" cy="${pf(y + r * 0.15)}" rx="${pf(r * 0.22)}" ry="${pf(r * 0.12)}" fill="#902818" opacity="0.4"/>`;
        break;
      case 'moon':
        g += `<circle cx="${fx}" cy="${fy}" r="${fr}" fill="url(#pg-moon)"/>`;
        g += `<circle cx="${pf(x - r * 0.2)}" cy="${pf(y - r * 0.15)}" r="${pf(r * 0.22)}" fill="#909098" opacity="0.45"/>`;
        g += `<circle cx="${pf(x + r * 0.25)}" cy="${pf(y + r * 0.2)}" r="${pf(r * 0.15)}" fill="#686870" opacity="0.35"/>`;
        break;
      default:
        g += `<circle cx="${fx}" cy="${fy}" r="${fr}" fill="#888"/>`;
    }
    return g;
  }

  function legendPlanet(body, x, y) {
    return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">${renderPlanet(body, 0, 0, 3.4, false)}</g>`;
  }

  /** 流沙柱：颈口漏斗 → 落点溅散；椭圆颗粒 + 暖色高光 */
  function buildSandCascade(cx, y0, y1, hue, sunHue, rnd, count) {
    const len = y1 - y0;
    const cols = (rndFn) => {
      const r = rndFn();
      if (r > 0.88) return '#fff';
      if (r > 0.72) return mixHex(hue, sunHue, 0.28 + rndFn() * 0.22);
      if (r > 0.48) return mixHex(hue, '#ffffff', 0.22 + rndFn() * 0.28);
      if (r > 0.22) return hue;
      return mixHex(hue, '#050508', 0.38 + rndFn() * 0.2);
    };
    let g = '';
    for (let i = 0; i < count; i++) {
      const t = rnd();
      const y = y0 + t * len;
      const funnel = 0.28 + Math.sin(t * Math.PI) * 0.62 + Math.pow(1 - t, 2.4) * 0.38;
      const spread = funnel * (1.8 + rnd() * 5.2);
      const x = cx + (rnd() - 0.5) * spread * 2;
      const rx = 0.22 + rnd() * 1.05;
      const ry = rx * (0.42 + rnd() * 0.48);
      const rot = (rnd() * 160 - 80).toFixed(1);
      const op = (0.18 + rnd() * 0.62).toFixed(2);
      const delay = (t * 2.4 + rnd() * 0.55).toFixed(2);
      const dur = (1.6 + rnd() * 1.8).toFixed(2);
      const dx = ((rnd() - 0.5) * 5).toFixed(1);
      g +=
        `<ellipse class="fa-sand" style="animation-delay:${delay}s;animation-duration:${dur}s;--dx:${dx}px" ` +
        `transform="rotate(${rot} ${x.toFixed(2)} ${y.toFixed(2)})" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" ` +
        `rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="${cols(rnd)}" opacity="${op}"/>`;
    }
    return g;
  }

  function buildSandCrater(cx, stackTop, mHw, hue, sunHue, rnd) {
    let g = '';
    let dune = `M${(cx - mHw * 0.42).toFixed(1)},${stackTop}`;
    for (let i = 1; i <= 36; i++) {
      const xr = i / 36;
      const xx = cx - mHw * 0.58 + xr * mHw * 1.16;
      const pile = Math.pow(Math.cos((xr - 0.5) * Math.PI), 2.05) * 10.5;
      const ripple = Math.sin(xr * Math.PI * 7.2) * 0.55;
      dune += ` L${xx.toFixed(1)},${(stackTop - pile - ripple - rnd() * 1.2).toFixed(2)}`;
    }
    dune += ` L${(cx + mHw * 0.58).toFixed(1)},${stackTop} Z`;
    g += `<path class="sand-dune" d="${dune}" fill="url(#u-sand-dune)" opacity="0.72"/>`;
    for (let i = 0; i < 48; i++) {
      const ang = rnd() * Math.PI * 2;
      const dist = Math.pow(rnd(), 0.55) * mHw * 0.52;
      const x = cx + Math.cos(ang) * dist;
      const y = stackTop - rnd() * 11 - Math.abs(Math.cos(ang)) * 4;
      const rx = 0.2 + rnd() * 0.75;
      const col = rnd() > 0.5 ? mixHex(hue, sunHue, rnd() * 0.35) : mixHex(hue, '#fff', rnd() * 0.3);
      const delay = (0.75 + rnd() * 0.9).toFixed(2);
      g +=
        `<ellipse class="fa-sand-grit" style="animation-delay:${delay}s" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" ` +
        `rx="${rx.toFixed(2)}" ry="${(rx * 0.55).toFixed(2)}" fill="${col}" opacity="${(0.2 + rnd() * 0.5).toFixed(2)}"/>`;
    }
    return g;
  }

  function buildStreamPaths(cx, y0, y1) {
    const len = y1 - y0;
    const mk = (amp, phase) => {
      let d = `M${cx},${y0}`;
      for (let i = 1; i <= 28; i++) {
        const t = i / 28;
        const y = y0 + t * len;
        const taper = 1 - t * 0.35;
        const wob = Math.sin(t * 11 + phase) * amp * taper + Math.sin(t * 23 + phase * 1.7) * amp * 0.35 * taper;
        d += ` L${(cx + wob).toFixed(2)},${y.toFixed(2)}`;
      }
      return d;
    };
    return { core: mk(1.1, 0.4), inner: mk(0.55, 1.2), dust: mk(2.2, 2.6) };
  }

  function buildVesselGlass(vessel, cx, yTop, yBot, maxR, band, halfW, rnd) {
    const gx1 = cx - maxR + 8, gy1 = yTop, gx2 = cx + maxR - 6, gy2 = yBot;
    const frostW = (gx2 - gx1).toFixed(1);
    const frostH = (gy2 - gy1).toFixed(1);
    let ambient = '';
    Object.keys(band).forEach((k) => {
      const b = band[k];
      const meta = LAYER[b.cat || k] || LAYER.idle;
      const hw = halfW(b.mid) * 0.55;
      ambient += `<ellipse cx="${cx}" cy="${b.mid.toFixed(1)}" rx="${hw.toFixed(1)}" ry="${((b.y1 - b.y0) * 0.42).toFixed(1)}" fill="${meta.hue}" opacity="${(0.05 + rnd() * 0.04).toFixed(3)}"/>`;
    });
    ambient += `<ellipse cx="${(cx - 48).toFixed(1)}" cy="178" rx="38" ry="92" fill="#a8b4ff" opacity="0.045"/>`;
    ambient += `<ellipse cx="${(cx + 36).toFixed(1)}" cy="248" rx="22" ry="58" fill="#7c3aed" opacity="0.03"/>`;

    const refract =
      `<g class="vessel-refract" opacity="0.92">` +
      `<rect x="${gx1}" y="${gy1}" width="${frostW}" height="${frostH}" fill="url(#u-refract-fill)" filter="url(#u-glass-refract)"/>` +
      `</g>`;

    const inner =
      `<path d="${vessel}" fill="url(#u-glass-tint)" opacity="0.88"/>` +
      `<path d="${vessel}" fill="url(#u-glass-sheen)" opacity="0.58"/>` +
      `<rect x="${gx1}" y="${gy1}" width="${frostW}" height="${frostH}" fill="url(#u-frost-matte)" opacity="0.26" filter="url(#u-frost-blur)"/>` +
      `<rect x="${gx1}" y="${gy1}" width="${frostW}" height="${frostH}" fill="#fff" opacity="0.13" filter="url(#u-glass-grain-fine)"/>` +
      `<rect x="${gx1}" y="${gy1}" width="${frostW}" height="${frostH}" fill="#dfe2f0" opacity="0.09" filter="url(#u-glass-grain-coarse)" style="mix-blend-mode:overlay"/>` +
      `<path d="${vessel}" fill="rgba(255,255,255,0.05)" filter="url(#u-glass-refract-edge)" opacity="0.85"/>`;

    const rim =
      `<path d="${vessel}" fill="none" stroke="rgba(0,0,0,0.38)" stroke-width="3.6" opacity="0.42" stroke-linejoin="round"/>` +
      `<path d="${vessel}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="4.2" opacity="0.35" stroke-linejoin="round"/>` +
      `<path d="${vessel}" fill="none" stroke="url(#u-rim-outer)" stroke-width="1.55" stroke-linejoin="round" opacity="0.88"/>` +
      `<path d="${vessel}" fill="none" stroke="url(#u-rim-spec)" stroke-width="2.4" stroke-linejoin="round" opacity="0.5"/>` +
      `<path d="${vessel}" fill="none" stroke="url(#u-rim-inner)" stroke-width="0.65" stroke-linejoin="round" opacity="0.62"/>`;

    const spec =
      `<ellipse cx="${(cx - 62).toFixed(1)}" cy="172" rx="34" ry="98" fill="url(#u-shoulder-hi)" opacity="0.48"/>` +
      `<ellipse cx="${(cx - 38).toFixed(1)}" cy="108" rx="14" ry="32" fill="url(#u-neck-hi)" opacity="0.42"/>` +
      `<ellipse cx="${(cx + 44).toFixed(1)}" cy="232" rx="18" ry="52" fill="url(#u-shoulder-lo)" opacity="0.26"/>` +
      `<ellipse cx="${cx}" cy="${(yBot - 28).toFixed(1)}" rx="16" ry="8" fill="url(#u-caustic)" opacity="0.38"/>` +
      `<ellipse cx="${(cx - 88).toFixed(1)}" cy="195" rx="6" ry="28" fill="url(#u-edge-flare)" opacity="0.55"/>`;

    const defs =
      `<linearGradient id="u-glass-tint" gradientUnits="userSpaceOnUse" x1="${gx1}" y1="${gy1}" x2="${gx2}" y2="${gy2}">` +
      `<stop offset="0%" stop-color="rgba(18,20,32,0.54)"/><stop offset="38%" stop-color="rgba(10,11,20,0.36)"/><stop offset="100%" stop-color="rgba(4,5,10,0.64)"/></linearGradient>` +
      `<linearGradient id="u-glass-sheen" gradientUnits="userSpaceOnUse" x1="${(cx - maxR).toFixed(1)}" y1="${(yTop + 20).toFixed(1)}" x2="${(cx + maxR * 0.35).toFixed(1)}" y2="${(yBot - 40).toFixed(1)}">` +
      `<stop offset="0%" stop-color="rgba(255,255,255,0.24)"/><stop offset="28%" stop-color="rgba(255,255,255,0.08)"/><stop offset="62%" stop-color="rgba(255,255,255,0)"/><stop offset="100%" stop-color="rgba(255,255,255,0.05)"/></linearGradient>` +
      `<linearGradient id="u-frost-matte" gradientUnits="userSpaceOnUse" x1="${gx1}" y1="${gy1}" x2="${gx2}" y2="${gy2}">` +
      `<stop offset="0%" stop-color="rgba(220,225,240,0.16)"/><stop offset="42%" stop-color="rgba(150,155,180,0.07)"/><stop offset="100%" stop-color="rgba(20,22,35,0.2)"/></linearGradient>` +
      `<linearGradient id="u-refract-fill" gradientUnits="userSpaceOnUse" x1="${(cx - maxR).toFixed(1)}" y1="${gy1}" x2="${(cx + maxR).toFixed(1)}" y2="${gy2}">` +
      `<stop offset="0%" stop-color="rgba(180,195,255,0.12)"/><stop offset="45%" stop-color="rgba(120,130,180,0.04)"/><stop offset="100%" stop-color="rgba(40,45,80,0.08)"/></linearGradient>` +
      `<linearGradient id="u-rim-outer" gradientUnits="userSpaceOnUse" x1="${(cx - maxR).toFixed(1)}" y1="${gy1}" x2="${(cx + maxR).toFixed(1)}" y2="${gy2}">` +
      `<stop offset="0%" stop-color="rgba(255,255,255,0.62)"/><stop offset="22%" stop-color="rgba(255,255,255,0.28)"/><stop offset="48%" stop-color="rgba(255,255,255,0.04)"/><stop offset="72%" stop-color="rgba(255,255,255,0.1)"/><stop offset="100%" stop-color="rgba(255,255,255,0.32)"/></linearGradient>` +
      `<linearGradient id="u-rim-spec" gradientUnits="userSpaceOnUse" x1="${(cx - maxR - 10).toFixed(1)}" y1="${(yTop - 4).toFixed(1)}" x2="${(cx + maxR * 0.25).toFixed(1)}" y2="${(yBot * 0.55).toFixed(1)}">` +
      `<stop offset="0%" stop-color="rgba(255,255,255,0.75)"/><stop offset="18%" stop-color="rgba(255,255,255,0.35)"/><stop offset="38%" stop-color="rgba(255,255,255,0)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient>` +
      `<linearGradient id="u-rim-inner" gradientUnits="userSpaceOnUse" x1="${(cx + maxR * 0.5).toFixed(1)}" y1="${gy1}" x2="${(cx - maxR * 0.4).toFixed(1)}" y2="${gy2}">` +
      `<stop offset="0%" stop-color="rgba(255,255,255,0.42)"/><stop offset="50%" stop-color="rgba(255,255,255,0.07)"/><stop offset="100%" stop-color="rgba(255,255,255,0.24)"/></linearGradient>` +
      `<radialGradient id="u-shoulder-hi" cx="38%" cy="42%" r="68%"><stop offset="0%" stop-color="rgba(255,255,255,0.62)"/><stop offset="55%" stop-color="rgba(255,255,255,0.1)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>` +
      `<radialGradient id="u-neck-hi" cx="42%" cy="35%" r="65%"><stop offset="0%" stop-color="rgba(255,255,255,0.55)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>` +
      `<radialGradient id="u-shoulder-lo" cx="58%" cy="48%" r="62%"><stop offset="0%" stop-color="rgba(180,190,230,0.24)"/><stop offset="100%" stop-color="rgba(180,190,230,0)"/></radialGradient>` +
      `<radialGradient id="u-caustic" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(255,255,255,0.4)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>` +
      `<radialGradient id="u-edge-flare" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(255,255,255,0.7)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>` +
      `<filter id="u-frost-blur" x="-8%" y="-4%" width="116%" height="108%"><feGaussianBlur stdDeviation="2.8" result="b"/><feColorMatrix in="b" type="matrix" values="1.14 0 0 0 0.02  0 1.12 0 0 0.02  0 0 1.2 0 0.03  0 0 0 0.92 0"/></filter>` +
      `<filter id="u-glass-grain-fine" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.05" numOctaves="4" seed="14" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.14 0"/></filter>` +
      `<filter id="u-glass-grain-coarse" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="2" seed="31" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.1 0"/></filter>` +
      `<filter id="u-glass-refract" x="-14%" y="-10%" width="128%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.045 0.09" numOctaves="2" seed="21" result="n"/><feGaussianBlur in="n" stdDeviation="1.4" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="5.2" xChannelSelector="R" yChannelSelector="G"/></filter>` +
      `<filter id="u-glass-refract-edge" x="-12%" y="-8%" width="124%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.08 0.14" numOctaves="2" seed="8" result="n"/><feGaussianBlur in="n" stdDeviation="0.9" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="2.8" xChannelSelector="R" yChannelSelector="G"/></filter>`;

    return { defs, ambient, refract, inner, rim, spec };
  }

  /** 瓶身外壁贴标：右缘贴左外轮廓外侧，沿壁微倾，裁剪防穿壁 */
  function buildNowLabel(cx, labelY, halfW, hue, appName) {
    const outerWallX = cx - halfW(labelY);
    const labelW = 76;
    const labelH = 18;
    const wallD = (halfW(labelY + 0.75) - halfW(labelY - 0.75)) / 1.5;
    const skew = Math.max(-5.5, Math.min(5.5, wallD * 2.4));
    const lip = 1.5;
    const anchor = { x: outerWallX - lip, y: labelY };
    const text = `now · ${appName || '—'}`;
    const svg =
      `<g class="now-label" clip-path="url(#now-label-clip)" transform="translate(${anchor.x.toFixed(1)},${labelY.toFixed(1)}) skewY(${(-skew).toFixed(2)}) translate(${-labelW},${(-labelH / 2).toFixed(1)})">` +
      `<rect x="-2.5" y="2" width="${labelW}" height="${labelH}" rx="5" fill="rgba(0,0,0,0.42)" opacity="0.55"/>` +
      `<rect x="0" y="0" width="${labelW}" height="${labelH}" rx="5" fill="url(#now-label-glass)" stroke="rgba(255,255,255,0.2)" stroke-width="0.55"/>` +
      `<rect x="3" y="3" width="2" height="${labelH - 6}" rx="1" fill="${hue}" opacity="0.55"/>` +
      `<rect x="1.5" y="1" width="${labelW - 3}" height="5.5" rx="3" fill="rgba(255,255,255,0.16)"/>` +
      `<line x1="${labelW - 1}" y1="2.5" x2="${labelW - 1}" y2="${labelH - 2.5}" stroke="rgba(0,0,0,0.18)" stroke-width="0.5"/>` +
      `<line x1="4" y1="${labelH - 1.5}" x2="${labelW - 5}" y2="${labelH - 1.5}" stroke="rgba(0,0,0,0.22)" stroke-width="0.45"/>` +
      `<text x="9.5" y="12.5" fill="rgba(120,95,60,0.38)" font-size="9.5" font-style="italic" font-family="Georgia,serif">${text}</text>` +
      `<text x="8.5" y="11.5" fill="rgba(238,210,175,0.92)" font-size="9.5" font-style="italic" font-family="Georgia,serif">${text}</text>` +
      `</g>`;
    const defs =
      `<clipPath id="now-label-clip"><rect x="0" y="0" width="${(outerWallX + 0.5).toFixed(1)}" height="420"/></clipPath>` +
      `<linearGradient id="now-label-glass" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="rgba(28,30,44,0.78)"/><stop offset="45%" stop-color="rgba(18,20,32,0.62)"/><stop offset="100%" stop-color="rgba(10,11,20,0.72)"/></linearGradient>`;
    return { svg, defs, anchor, outerWallX, skew };
  }

  /** 星图标注：径向外推 + 切向错峰 + 盒碰撞分离 */
  function layoutSessionLabels(markers, C, RR) {
    const FS_T = 8.5;
    const FS_B = 8;
    const LINE = 11;
    const PAD = 4;

    function anchorFor(dx) {
      return dx > 12 ? 'start' : dx < -12 ? 'end' : 'middle';
    }

    function measure(it) {
      const tw = it.hh.length * FS_T * 0.6;
      const nw = it.name.length * FS_B * 0.54;
      const w = Math.max(tw, nw) + PAD * 2;
      const h = LINE + FS_B + PAD;
      let bx = it.lx;
      if (it.anchor === 'end') bx = it.lx - w;
      else if (it.anchor === 'middle') bx = it.lx - w / 2;
      return { bx, by: it.ly, bw: w, bh: h };
    }

    function overlapAmt(a, b, gap) {
      const dx = Math.min(a.bx + a.bw + gap, b.bx + b.bw + gap) - Math.max(a.bx - gap, b.bx - gap);
      const dy = Math.min(a.by + a.bh + gap, b.by + b.bh + gap) - Math.max(a.by - gap, b.by - gap);
      if (dx <= 0 || dy <= 0) return 0;
      return Math.min(dx, dy);
    }

    const items = markers.map((o) => {
      const scale = BODY_SCALE[o.body] || 0.5;
      const pr = (2.8 + Math.min(3.6, o.s.mins / 28)) * scale;
      const dx = o.p.x - C.x;
      const dy = o.p.y - C.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist;
      const uy = dy / dist;
      const tx = -uy;
      const ty = ux;
      const hh = String(Math.floor(o.s.t)).padStart(2, '0') + ':' + String(Math.round((o.s.t % 1) * 60)).padStart(2, '0');
      const name = BODY_LABEL[o.body];
      const n = markers.length;
      const tb = (o.chronIdx - (n - 1) / 2) * 12;
      const radial = pr + 20;
      const lx = o.p.x + ux * radial + tx * tb;
      const ly = o.p.y + uy * radial + ty * tb;
      return { o, pr, ux, uy, hh, name, anchor: anchorFor(dx), lx, ly, isNow: !!o.s.now, chronIdx: o.chronIdx };
    });

    const bounds = { x0: C.x - RR - 34, x1: C.x + RR + 34, y0: C.y - RR - 26, y1: C.y + RR + 36 };

    for (let iter = 0; iter < 32; iter++) {
      const boxes = items.map((it) => ({ it, ...measure(it) }));
      for (let i = 0; i < boxes.length; i++) {
        const A = boxes[i];
        const itA = A.it;
        const scx = itA.lx - C.x;
        const scy = itA.ly - C.y;
        const sd = Math.hypot(scx, scy) || 1;
        if (sd < 44) {
          itA.lx += (scx / sd) * (44 - sd) * 0.7;
          itA.ly += (scy / sd) * (44 - sd) * 0.7;
        }
        const pcx = itA.lx - itA.o.p.x;
        const pcy = itA.ly - itA.o.p.y;
        const pd = Math.hypot(pcx, pcy) || 1;
        const pMin = itA.pr + 16;
        if (pd < pMin) {
          itA.lx += (pcx / pd) * (pMin - pd);
          itA.ly += (pcy / pd) * (pMin - pd);
        }
        for (let j = i + 1; j < boxes.length; j++) {
          const B = boxes[j];
          const ov = overlapAmt(A, B, 6);
          if (ov > 0) {
            const mx = A.bx + A.bw / 2 - (B.bx + B.bw / 2);
            const my = A.by + A.bh / 2 - (B.by + B.bh / 2);
            const md = Math.hypot(mx, my) || 1;
            const px = (mx / md) * ov * 0.78;
            const py = (my / md) * ov * 0.78;
            itA.lx -= px;
            itA.ly -= py;
            B.it.lx += px;
            B.it.ly += py;
          }
        }
        const m = measure(itA);
        if (m.bx < bounds.x0) itA.lx += bounds.x0 - m.bx;
        if (m.bx + m.bw > bounds.x1) itA.lx -= m.bx + m.bw - bounds.x1;
        if (m.by < bounds.y0) itA.ly += bounds.y0 - m.by;
        if (m.by + m.bh > bounds.y1) itA.ly -= m.by + m.bh - bounds.y1;
      }
    }

    for (let pass = 0; pass < 6; pass++) {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const A = measure(items[i]);
          const B = measure(items[j]);
          if (overlapAmt(A, B, 2) <= 0) continue;
          const dy = (A.by + A.bh / 2) - (B.by + B.bh / 2);
          const need = A.bh / 2 + B.bh / 2 + 8 - Math.abs(dy);
          if (need > 0) {
            const sign = dy >= 0 ? 1 : -1;
            items[i].ly -= sign * need * 0.55;
            items[j].ly += sign * need * 0.55;
          }
          const dx = (A.bx + A.bw / 2) - (B.bx + B.bw / 2);
          const needX = A.bw / 2 + B.bw / 2 + 6 - Math.abs(dx);
          if (needX > 0) {
            const signX = dx >= 0 ? 1 : -1;
            items[i].lx -= signX * needX * 0.45;
            items[j].lx += signX * needX * 0.45;
          }
        }
      }
    }

    const LABEL_GAP = 10;
    for (let t = 0; t < 64; t++) {
      let hit = false;
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const A = measure(items[i]);
          const B = measure(items[j]);
          const cxA = A.bx + A.bw / 2;
          const cyA = A.by + A.bh / 2;
          const cxB = B.bx + B.bw / 2;
          const cyB = B.by + B.bh / 2;
          const overlapX = A.bw / 2 + B.bw / 2 + LABEL_GAP - Math.abs(cxA - cxB);
          const overlapY = A.bh / 2 + B.bh / 2 + LABEL_GAP - Math.abs(cyA - cyB);
          if (overlapX <= 0 || overlapY <= 0) continue;
          hit = true;
          if (overlapX < overlapY) {
            const sign = cxA < cxB ? -1 : 1;
            const push = overlapX * 0.58;
            items[i].lx += sign * push;
            items[j].lx -= sign * push;
          } else {
            const sign = cyA < cyB ? -1 : 1;
            const push = overlapY * 0.58;
            items[i].ly += sign * push;
            items[j].ly -= sign * push;
          }
        }
      }
      for (let i = 0; i < items.length; i++) {
        const m = measure(items[i]);
        if (m.bx < bounds.x0) items[i].lx += bounds.x0 - m.bx;
        if (m.bx + m.bw > bounds.x1) items[i].lx -= m.bx + m.bw - bounds.x1;
        if (m.by < bounds.y0) items[i].ly += bounds.y0 - m.by;
        if (m.by + m.bh > bounds.y1) items[i].ly -= m.by + m.bh - bounds.y1;
      }
      if (!hit) break;
    }

    return items.map((it) => {
      it.anchor = anchorFor(it.lx - it.o.p.x);
      return { ...it, ...measure(it), fsT: FS_T, fsB: FS_B, line: LINE };
    });
  }

  function renderSessionLabel(L, delay) {
    const ex = L.o.p.x + L.ux * L.pr;
    const ey = L.o.p.y + L.uy * L.pr;
    const timeFill = L.isNow ? 'rgba(232,200,140,0.92)' : '#9a9ab4';
    const ty1 = L.ly + L.fsT - 2;
    const ty2 = L.ly + L.line + L.fsB - 2;
    return (
      `<g class="b-star-tag" style="animation-delay:${delay}s">` +
      `<line x1="${ex.toFixed(1)}" y1="${ey.toFixed(1)}" x2="${L.lx.toFixed(1)}" y2="${(L.ly + 6).toFixed(1)}" stroke="rgba(130,140,175,0.24)" stroke-width="0.55" stroke-linecap="round"/>` +
      `<rect x="${(L.bx - 2).toFixed(1)}" y="${(L.by - 3).toFixed(1)}" width="${(L.bw + 4).toFixed(1)}" height="${(L.bh + 4).toFixed(1)}" rx="4" fill="rgba(5,6,12,0.82)" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>` +
      `<text class="b-star-label" x="${L.lx.toFixed(1)}" y="${ty1.toFixed(1)}" fill="${timeFill}" font-size="${L.fsT}" text-anchor="${L.anchor}" font-family="ui-monospace,monospace">${L.hh}</text>` +
      `<text class="b-star-label" x="${L.lx.toFixed(1)}" y="${ty2.toFixed(1)}" fill="#8484a0" font-size="${L.fsB}" text-anchor="${L.anchor}" font-family="Inter,sans-serif">${L.name}</text>` +
      `</g>`
    );
  }

  // ===== Focus：梅瓶剖面（星图暂缓，冰山原则：悬浮岛 = 瓶口）=====
  const FOCUS_SKY = false;

  function buildFocusU() {
    const svg = el('focusA');
    const VW = 640, VH = 420;
    const G = 8;
    const nowMeta = focusUI?.getNowMeta() || { color: LAYER.coding.hue, app: 'Cursor' };
    const hue = nowMeta.color || LAYER.coding.hue;
    const sunHue = '#E8A830';

    // —— 大梅瓶（连续收足 → 圆润底，不外撇、不空腔）——
    const cx = FOCUS_SKY ? 216 : 320;
    const lipR = 30;
    const yTop = 8, yBot = 398;
    // 控制点单调收窄至底心，无圈足外凸
    const pts = [
      [yTop, lipR], [26, 22], [64, 34], [124, 128], [168, 150],
      [258, 136], [328, 106], [360, 80], [380, 56], [392, 34], [yBot, 6],
    ];
    const maxR = 154;
    function halfW(y) {
      if (y <= pts[0][0]) return pts[0][1];
      if (y >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
      let i = 0;
      while (i < pts.length - 1 && y > pts[i + 1][0]) i++;
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
      const t = (y - p1[0]) / (p2[0] - p1[0]), t2 = t * t, t3 = t2 * t;
      return 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
    }
    const lipJoin = yTop + 10;
    function lamePath(cx0, cy0, a, b, n, steps, grav) {
      let d = '';
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const ct = Math.cos(t), stn = Math.sin(t);
        const x = cx0 + a * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n);
        let y = cy0 + b * Math.sign(stn) * Math.pow(Math.abs(stn), 2 / n);
        if (grav && stn > 0) y += grav * stn * stn;
        d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      }
      return `${d}Z`;
    }
    function lameTopArc(cx0, cy0, a, b, n, steps) {
      let d = '';
      for (let i = 0; i <= steps; i++) {
        const t = Math.PI + (i / steps) * Math.PI;
        const ct = Math.cos(t), stn = Math.sin(t);
        const x = cx0 + a * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n);
        const y = cy0 + b * Math.sign(stn) * Math.pow(Math.abs(stn), 2 / n);
        d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      }
      return d;
    }
    const lipCy = yTop + 7.5;
    const lipA = lipR - 1.5, lipB = 6.8, lipN = 4;
    const lipShell = lamePath(cx, lipCy, lipA, lipB, lipN, 56, 0.55);
    const lipArc = lameTopArc(cx, lipCy, lipA - 0.4, lipB - 0.5, lipN, 28);
    let lipMeniscus = `M${(cx - lipA + 7).toFixed(1)},${(lipCy - 1.2).toFixed(1)}`;
    for (let i = 1; i <= 28; i++) {
      const xr = i / 28;
      const xx = cx - lipA + 7 + xr * (lipA * 2 - 14);
      const yy = lipCy - 0.8 - Math.sin(xr * Math.PI) * 1.1 - Math.pow(Math.cos((xr - 0.5) * Math.PI), 2.2) * 2.4;
      lipMeniscus += ` L${xx.toFixed(1)},${yy.toFixed(1)}`;
    }
    let vessel = `M ${cx - lipR + 4},${yTop + 2} Q ${cx - lipR - 0.5},${yTop + 5} ${cx - lipR},${lipJoin} `;
    for (let y = lipJoin; y <= yBot; y += 1) vessel += `L ${(cx - halfW(y)).toFixed(2)},${y} `;
    vessel += `Q ${cx},${(yBot + 3).toFixed(1)} ${(cx + halfW(yBot)).toFixed(2)},${yBot} `;
    for (let y = yBot; y >= lipJoin; y -= 1) vessel += `L ${(cx + halfW(y)).toFixed(2)},${y} `;
    vessel += `Q ${cx + lipR + 0.5},${yTop + 5} ${cx + lipR - 4},${yTop + 2} Z`;

    // —— 时间序沉积层（底=早、顶=now；AW 与演示数据同源）——
    const agg = focusUI?.getCategoryTotalsMinutes() || {};
    const strataSessions = [...(focusUI?.getSessions?.() || SESSIONS)].sort((a, b) => (a.t || 0) - (b.t || 0));
    const totalMins = strataSessions.reduce((a, s) => a + (s.mins || 0), 0) || 1;

    const stackTop = 116, stackBot = yBot - 4;
    const stackH = stackBot - stackTop;
    const band = {};
    const layerList = [];
    let yc = stackBot;
    strataSessions.forEach((s) => {
      const h = Math.max(6, ((s.mins || 0) / totalMins) * stackH);
      const k = s.cat || 'neutral';
      const entry = { y0: yc - h, y1: yc, mid: yc - h / 2, cat: k, session: s };
      band[k] = band[k] || entry;
      layerList.push(entry);
      yc -= h;
    });
    const used = layerList.map((l) => l.cat);

    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

    // 沉积纹理（层理 + 斜向沙纹 + 颗粒点；每层=一段 session）
    let strata = '';
    layerList.forEach((layer, li) => {
      const k = layer.cat;
      const meta = LAYER[k] || LAYER.idle;
      const b = layer;
      const isNow = layer.session?.now;
      strata += `<rect x="${cx - maxR}" y="${b.y0.toFixed(1)}" width="${maxR * 2}" height="${(b.y1 - b.y0).toFixed(1)}" fill="${meta.hue}" opacity="${isNow ? 0.56 : 0.48}"/>`;
      for (let yy = b.y0; yy < b.y1; yy += 0.55) {
        const hw = halfW(yy) - 2; if (hw < 4) continue;
        const x0 = cx - hw, xW = hw * 2;
        const deep = mixHex(meta.hue, '#050508', 0.45);
        const lite = mixHex(meta.hue, '#ffffff', 0.34);
        const col = rnd() > 0.86 ? '#fff' : rnd() > 0.52 ? lite : rnd() > 0.42 ? meta.hue : deep;
        strata += `<line x1="${x0.toFixed(1)}" x2="${(x0 + xW).toFixed(1)}" y1="${yy.toFixed(2)}" y2="${yy.toFixed(2)}" stroke="${col}" stroke-width="${(0.45 + rnd() * 0.5).toFixed(2)}" opacity="${(0.18 + rnd() * 0.4).toFixed(2)}"/>`;
        if (rnd() > 0.58) {
          const fx = x0 + rnd() * xW;
          strata += `<line x1="${fx.toFixed(1)}" x2="${(fx + 3 + rnd() * 12).toFixed(1)}" y1="${yy.toFixed(2)}" y2="${(yy + (rnd() - 0.5) * 1.1).toFixed(2)}" stroke="${lite}" stroke-width="0.28" opacity="0.14"/>`;
        }
        if (rnd() > 0.72) {
          const gx = x0 + rnd() * xW;
          const gr = 0.18 + rnd() * 0.42;
          strata += `<ellipse cx="${gx.toFixed(1)}" cy="${(yy + (rnd() - 0.5) * 0.35).toFixed(2)}" rx="${gr.toFixed(2)}" ry="${(gr * 0.55).toFixed(2)}" fill="${rnd() > 0.5 ? lite : deep}" opacity="${(0.12 + rnd() * 0.22).toFixed(2)}"/>`;
        }
      }
      if (li < layerList.length - 1) {
        const hw = halfW(b.y0);
        strata += `<line x1="${(cx - hw + 2).toFixed(1)}" x2="${(cx + hw - 2).toFixed(1)}" y1="${b.y0.toFixed(1)}" y2="${b.y0.toFixed(1)}" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>`;
      }
    });

    // 沉积面（溅坑）+ 中央水流
    const mHw = halfW(stackTop) - 4;
    let meni = `M${(cx - mHw).toFixed(1)},${stackTop}`;
    for (let i = 1; i <= 40; i++) {
      const xr = i / 40, xx = cx - mHw + xr * mHw * 2;
      const yy = stackTop - Math.sin(xr * Math.PI) * 1.2 - Math.pow(Math.cos((xr - 0.5) * Math.PI), 2.2) * 6;
      meni += ` L${xx.toFixed(1)},${yy.toFixed(1)}`;
    }
    const streamY0 = lipJoin + 1;
    const streamY1 = stackTop + 1;
    const streamLen = Math.ceil(streamY1 - streamY0 + 18);
    const streams = buildStreamPaths(cx, streamY0, streamY1);
    const sandCascade = buildSandCascade(cx, streamY0 - 2, streamY1 + 4, hue, sunHue, rnd, 132);
    const sandCrater = buildSandCrater(cx, stackTop, mHw, hue, sunHue, rnd);
    const labelY = stackTop + 14;
    const nowLabel = buildNowLabel(cx, labelY, halfW, hue, nowMeta.app);
    const nowLead = `M${cx},${(stackTop - 6).toFixed(1)} Q ${(cx - 24).toFixed(1)},${((stackTop + labelY) / 2).toFixed(1)} ${nowLabel.outerWallX.toFixed(1)},${nowLabel.anchor.y.toFixed(1)}`;
    const glassBand = {};
    layerList.forEach((layer, i) => { glassBand[`L${i}`] = layer; });
    const vesselGlass = buildVesselGlass(vessel, cx, yTop, yBot, maxR, glassBand, halfW, rnd);

    const legendX = cx + maxR + 28;
    const legendRight = VW - G * 4;
    let legendStartY = G * 10;
    let legendSvg = '';
    let ly = legendStartY;
    const legendKeys = Object.keys(agg)
      .filter((k) => agg[k] > 0)
      .sort((a, b) => agg[b] - agg[a]);
    legendKeys.forEach((k) => {
      const meta = LAYER[k] || LAYER.idle;
      legendSvg +=
        `<circle cx="${legendX}" cy="${ly - 4}" r="3.6" fill="${meta.hue}"/>` +
        `<text x="${legendX + 12}" y="${ly}" fill="#c8c8d8" font-size="11" font-family="Inter,system-ui,sans-serif">${meta.en}</text>` +
        `<text x="${legendRight}" y="${ly}" fill="#787890" font-size="11" text-anchor="end" font-family="ui-monospace,monospace">${fmtMin(agg[k])}</text>`;
      ly += G + 11;
    });
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${days[now.getDay()]}`;

    let skyBlock = '';
    if (FOCUS_SKY) {
      const C = { x: 512, y: 168 }, RR = 108;
      const AU_PX = RR / 1.55;
      const skyTitleY = C.y - RR - G * 2;
      let grid = '';
      ['mercury', 'venus', 'earth', 'mars'].forEach((b) => {
        const rr = ORBIT_EL[b].a * AU_PX;
        grid += `<circle cx="${C.x}" cy="${C.y}" r="${rr.toFixed(1)}" fill="none" stroke="rgba(160,168,210,0.055)" stroke-width="0.55" stroke-dasharray="2 3"/>`;
      });
      grid += `<circle cx="${C.x}" cy="${C.y}" r="${RR}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.75"/>`;
      const ax = C.x + RR + 10, ay = C.y;
      grid += `<line x1="${C.x}" y1="${C.y}" x2="${ax}" y2="${ay}" stroke="rgba(180,190,230,0.12)" stroke-width="0.5"/>`;
      grid += `<text x="${(ax + 4).toFixed(0)}" y="${(ay + 3).toFixed(0)}" fill="#5a5a72" font-size="8" font-family="Inter,sans-serif">♈ 0°</text>`;
      grid += `<text x="${C.x}" y="${(C.y - RR - 6).toFixed(0)}" fill="#5a5a72" font-size="8" text-anchor="middle" font-family="Inter,sans-serif">N · ecliptic pole</text>`;
      grid += `<text x="${(C.x + RR * 0.62).toFixed(0)}" y="${(C.y - RR * 0.78).toFixed(0)}" fill="#4a4a60" font-size="7.5" font-family="Inter,sans-serif">↺ prograde</text>`;
      const ecliptic = `<ellipse cx="${C.x}" cy="${C.y}" rx="${RR}" ry="${(RR * 0.38).toFixed(1)}" fill="none" stroke="${sunHue}" stroke-opacity="0.1" stroke-width="0.65" stroke-dasharray="2.5 5" transform="rotate(-23.4 ${C.x} ${C.y})"/>`;
      let sky = '';
      for (let i = 0; i < 72; i++) {
        const a = rnd() * 6.2832, rd = Math.sqrt(rnd()) * (RR - 2);
        sky += `<circle cx="${(C.x + rd * Math.cos(a)).toFixed(1)}" cy="${(C.y + rd * Math.sin(a)).toFixed(1)}" r="${(0.18 + rnd() * 0.55).toFixed(2)}" fill="#b8c0dc" opacity="${(0.06 + rnd() * 0.28).toFixed(2)}"/>`;
      }
      const sorted = [...SESSIONS].sort((a, b) => a.t - b.t);
      const pos = sorted.map((s, chronIdx) => {
        const body = assignBody(s);
        const jd = sessionJD(s.t);
        const h = bodyHelio(body, jd);
        const p = helioScreen(h, C, AU_PX);
        return { s, body, jd, h, p, chronIdx };
      });
      let connLen = 0;
      for (let i = 1; i < pos.length; i++) connLen += Math.hypot(pos[i].p.x - pos[i - 1].p.x, pos[i].p.y - pos[i - 1].p.y);
      const conn = 'M' + pos.map((o) => `${o.p.x.toFixed(1)},${o.p.y.toFixed(1)}`).join(' L ');
      const sunR = 7.2;
      const labelLayouts = layoutSessionLabels(pos, C, RR);
      let starsBodies = `<g class="b-star-lip">${renderPlanet('sun', C.x, C.y, sunR, false)}</g>`;
      let starsLabels = '';
      pos.sort((a, b) => a.h.r - b.h.r).forEach((o) => {
        const s = o.s, isNow = !!s.now;
        const body = o.body;
        const scale = BODY_SCALE[body] || 0.5;
        const r = (2.8 + Math.min(3.6, s.mins / 28)) * scale;
        const delay = (0.52 + o.chronIdx * 0.11).toFixed(2);
        starsBodies +=
          `<g class="b-star-pt${isNow ? ' b-star-now' : ''}" style="animation-delay:${delay}s">` +
          renderPlanet(body, o.p.x, o.p.y, r, isNow) +
          `</g>`;
      });
      labelLayouts.forEach((L) => {
        const ldelay = (0.78 + L.chronIdx * 0.11).toFixed(2);
        starsLabels += renderSessionLabel(L, ldelay);
      });
      skyBlock =
        `<g class="fa-legend b-sky-grid">` +
        `<circle cx="${C.x}" cy="${C.y}" r="${RR}" fill="url(#u-disc)"/>` +
        `<clipPath id="u-sky"><circle cx="${C.x}" cy="${C.y}" r="${RR}"/></clipPath>` +
        `<g clip-path="url(#u-sky)">${sky}</g>${grid}${ecliptic}` +
        `<text x="${C.x}" y="${skyTitleY}" fill="#7a7a92" font-size="10" text-anchor="middle" font-family="Inter,system-ui,sans-serif" letter-spacing="1.4">THE DAY · HELIOCENTRIC</text>` +
        `</g>` +
        `<g class="u-threads"><path class="b-const" d="${conn}" stroke-dasharray="${connLen.toFixed(1)}" style="--clen:${connLen.toFixed(1)}"/></g>` +
        starsBodies + starsLabels;
    }

    const nebCx = FOCUS_SKY ? '80%' : '42%';
    svg.innerHTML =
      `<defs>
        <clipPath id="u-clip"><path d="${vessel}"/></clipPath>
        <linearGradient id="u-stream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${sunHue}" stop-opacity="0.95"/><stop offset="38%" stop-color="${hue}" stop-opacity="0.82"/><stop offset="100%" stop-color="${hue}" stop-opacity="0.08"/>
        </linearGradient>
        <linearGradient id="u-stream-dust" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${sunHue}" stop-opacity="0.35"/><stop offset="55%" stop-color="${hue}" stop-opacity="0.22"/><stop offset="100%" stop-color="${hue}" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="u-neck-pour" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${hue}" stop-opacity="0.72"/><stop offset="100%" stop-color="${hue}" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="u-sand-dune" cx="50%" cy="72%" r="68%">
          <stop offset="0%" stop-color="${mixHex(hue, sunHue, 0.32)}" stop-opacity="0.55"/>
          <stop offset="55%" stop-color="${hue}" stop-opacity="0.38"/>
          <stop offset="100%" stop-color="${mixHex(hue, '#050508', 0.5)}" stop-opacity="0.12"/>
        </radialGradient>
        <filter id="u-sand-soft" x="-40%" y="-20%" width="180%" height="160%">
          <feGaussianBlur stdDeviation="1.6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="u-sand-turb" x="-30%" y="-10%" width="160%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06 0.28" numOctaves="2" seed="17" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.8" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <filter id="u-warp" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.07" numOctaves="2" seed="3" result="w"/>
          <feDisplacementMap in="SourceGraphic" in2="w" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <filter id="u-grain"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" seed="9" stitchTiles="stitch" result="n"/>
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 -0.28"/></filter>
        <linearGradient id="u-sed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,0.12)"/><stop offset="1" stop-color="rgba(0,0,0,0.32)"/></linearGradient>
        ${vesselGlass.defs}
        ${nowLabel.defs}
        <radialGradient id="u-neb" cx="${nebCx}" cy="38%" r="55%"><stop offset="0" stop-color="rgba(60,58,158,0.14)"/><stop offset="100%" stop-color="rgba(5,5,8,0)"/></radialGradient>
        <radialGradient id="u-disc" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="rgba(18,20,42,0.48)"/><stop offset="100%" stop-color="rgba(6,6,12,0.14)"/></radialGradient>
        <radialGradient id="u-lip" cx="34%" cy="22%" r="72%"><stop offset="0" stop-color="rgba(255,255,255,0.38)"/><stop offset="48%" stop-color="rgba(160,165,200,0.14)"/><stop offset="100%" stop-color="rgba(12,12,22,0.58)"/></radialGradient>
        <radialGradient id="u-lip-fresnel" cx="28%" cy="18%" r="68%"><stop offset="0" stop-color="rgba(255,255,255,0.32)"/><stop offset="50%" stop-color="rgba(255,255,255,0.06)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>
        <radialGradient id="u-lip-well" cx="50%" cy="38%" r="58%"><stop offset="0" stop-color="rgba(4,5,12,0.82)"/><stop offset="100%" stop-color="rgba(8,10,18,0.35)"/></radialGradient>
        <filter id="u-glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="u-sun-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        ${FOCUS_SKY ? planetDefs() : ''}
      </defs>
      <rect width="${VW}" height="${VH}" fill="#050508"/>
      <rect width="${VW}" height="${VH}" fill="url(#u-neb)"/>
      <g transform="translate(0, ${-lipJoin})">
      <g clip-path="url(#u-clip)">
        <rect x="${cx - maxR}" y="0" width="${maxR * 2}" height="${VH}" fill="rgba(5,5,8,0.94)"/>
        <g class="vessel-ambient">${vesselGlass.ambient}</g>
        <g class="strata-g" filter="url(#u-warp)">${strata}</g>
        ${vesselGlass.refract}
        <rect x="${cx - maxR}" y="${stackTop}" width="${maxR * 2}" height="${stackH}" fill="url(#u-sed)" opacity="0.28"/>
        <rect x="${cx - maxR}" y="${stackTop}" width="${maxR * 2}" height="${stackH}" filter="url(#u-grain)" opacity="0.08" style="mix-blend-mode:overlay"/>
        <g class="sand-plume" style="--slen:${streamLen}">
          <path class="stream-c" d="${streams.dust}" stroke="url(#u-stream-dust)" stroke-width="7" stroke-linecap="round" filter="url(#u-sand-soft)" opacity="0.35"/>
          <path class="stream-a" d="${streams.core}" stroke="url(#u-stream)" stroke-width="3.2" stroke-linecap="round" filter="url(#u-sand-turb)" opacity="0.42"/>
          <path class="stream-b" d="${streams.inner}" stroke="url(#u-stream)" stroke-width="1.4" stroke-linecap="round" filter="url(#u-glow)" opacity="0.78"/>
          <g class="sand-grains">${sandCascade}</g>
        </g>
        <g class="sand-impact">${sandCrater}</g>
        <path d="${meni}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="0.8" opacity="0.7"/>
        <path class="sand-shear" d="${meni}" fill="none" stroke="${mixHex(hue, sunHue, 0.25)}" stroke-width="2.2" opacity="0" stroke-linecap="round" filter="url(#u-sand-soft)"/>
        <g class="vessel-glass-inner">${vesselGlass.inner}</g>
        <g class="vessel-spec">${vesselGlass.spec}</g>
      </g>
      <g class="vessel-glass-rim">${vesselGlass.rim}</g>
      <path class="now-lead" d="${nowLead}" fill="none" stroke="rgba(232,168,48,0.22)" stroke-width="0.5" stroke-dasharray="2 4" opacity="0.85"/>
      ${nowLabel.svg}
      <g class="b-star-lip">
        <path d="M ${cx - lipR},${lipJoin} Q ${cx - lipR + 2},${lipCy + lipB + 1.5} ${cx - lipA + 3},${(lipCy + lipB + 0.8).toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="0.55"/>
        <path d="M ${cx + lipR},${lipJoin} Q ${cx + lipR - 2},${lipCy + lipB + 1.5} ${cx + lipA - 3},${(lipCy + lipB + 0.8).toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="0.55"/>
        <ellipse cx="${cx}" cy="${lipCy + 0.5}" rx="${lipA - 5}" ry="3.2" fill="url(#u-lip-well)"/>
        <path d="${lipShell}" fill="url(#u-lip)" stroke="url(#u-rim-outer)" stroke-width="0.85" opacity="0.95"/>
        <ellipse cx="${(cx - lipA * 0.28).toFixed(1)}" cy="${(lipCy - lipB * 0.42).toFixed(1)}" rx="16" ry="4.2" fill="url(#u-lip-fresnel)" opacity="0.9"/>
        <path d="${lipMeniscus}" fill="none" stroke="rgba(255,255,255,0.48)" stroke-width="0.62" stroke-linecap="round" opacity="0.82"/>
        <path d="${lipArc}" fill="none" stroke="rgba(255,255,255,0.52)" stroke-width="0.85" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${lipCy}" r="5" fill="${hue}" opacity="0.1"/>
        <circle cx="${cx}" cy="${lipCy}" r="2.3" fill="${hue}" filter="url(#u-glow)"/>
      </g>
      </g>

      ${skyBlock}

      <g class="fa-legend">
        <text x="${legendX}" y="${G * 6}" fill="#eceaf8" font-size="15" font-weight="500" font-family="Inter,system-ui,sans-serif">TimeLens</text>
        <text x="${legendX}" y="${G * 8}" fill="#64647a" font-size="10" font-family="Inter,system-ui,sans-serif">one day in glass</text>
        ${legendSvg}
        <line x1="${legendX}" x2="${legendRight}" y1="${ly - 8}" y2="${ly - 8}" stroke="rgba(255,255,255,0.07)"/>
        <text x="${legendX}" y="${ly + 8}" fill="#9898ae" font-size="11" font-family="Inter,system-ui,sans-serif">Total ${fmtMin(Object.values(agg).reduce((a, b) => a + b, 0))}</text>
        <text x="${legendRight}" y="${ly + 8}" fill="#64647a" font-size="10" text-anchor="end" font-family="ui-monospace,monospace">${dateStr}</text>
      </g>`;

    if (el('legendA')) el('legendA').innerHTML = '';
  }

  function setStageCaption() {
    const cap = el('stageCap');
    const app = focusUI?.getNowMeta()?.app || 'Cursor';
    cap.innerHTML = `梅瓶 · 流沙沉积一日 &nbsp;·&nbsp; 悬浮岛即瓶口 &nbsp;·&nbsp; <em>now · ${app}</em>`;
  }

  function syncDewFromFocus() {
    const meta = focusUI?.getNowMeta();
    if (!meta) return;
    if (CATS[meta.key]) st.cat = meta.key;
    const prod = Object.values(focusUI?.state?.totalsByCategory || {}).reduce((a, sec) => a + sec, 0);
    if (prod > 0) st.fillP = Math.min(0.92, Math.max(0.08, prod / PRODUCTIVE_CAP_SEC));
    const now = new Date();
    st.tideP = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
  }

  function sync() {
    syncDewFromFocus();
    focusUI?.seedIntent();
    focusUI?.render();
    buildFocusU();
    setStageCaption();
    const pourHue = focusUI?.getNowMeta()?.color || '#818CF8';
    el('slot')?.style.setProperty('--pour-hue', pourHue);
    render();
  }

  focusUI = createFocusUI({
    el,
    onSync: sync,
    getSt: () => st,
    onPomoComplete: () => triggerCrystal(),
  });
  focusUI.useMock(SESSIONS);
  focusUI.bind();
  setInterval(() => focusUI.pollAW(), 5000);
  focusUI.pollAW();

  sync();

  const now = new Date();
  st.tideP = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);

  el('legend').innerHTML = `
<b style="color:var(--txt2)">横露珠 · Principia</b> — 圆润长条为桌面而生；竖水滴的液体灵魂躺平在顶栏。<br>
<span class="k">数学</span>：超椭圆外壳 (n=4) · ● 位于黄金分割点 (1/φ) · 液面多频驻波。<br>
<span class="k">物理</span>：毛细弯月 · 重力底鼓 · 焦散折射 · 实线=液位 · 虚线=今日潮汐预期。<br>
<span class="k">Focus</span>：点击露珠 → Ma 200ms → 梅瓶生长 + <b style="color:var(--txt2)">四柱镜</b>（现在 / 航程 / 番茄 / 主线）。有 ActivityWatch 时自动读真实数据。
`;

  setInterval(() => {
    const d = new Date();
    el('clk').textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    st.tideP = (d.getHours() * 60 + d.getMinutes()) / (24 * 60);
  }, 1000);

  const devA = el('devUrl');
  if (devA) {
    const u = `${location.origin}/docs/prototype/lens-dew-bar.html`;
    devA.href = u;
    devA.textContent = u;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
