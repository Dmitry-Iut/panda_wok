'use strict';
/* =========================================================
   Панда Вок — симулятор китайского ресторанчика
   HTML / CSS / JS, без библиотек. Формат: iPhone 17 Pro
   ========================================================= */

// ---------- утилиты ----------
const $ = (s, r = document) => r.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
function h(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const sameTops = (a, b) => a.slice().sort().join() === b.slice().sort().join();

// ---------- данные ----------
const DISHES = {
  tea:       { name: 'Зелёный чай',             icon: '🍵', price: 6 },
  noodles:   { name: 'Лапша вок',               icon: '🍜', price: 14 },
  dumplings: { name: 'Пельмени цзяоцзы',        icon: '🥟', price: 16 },
  cookie:    { name: 'Печенье с предсказанием', icon: '🥠', price: 5 },
  sushi:     { name: 'Суши-роллы',              icon: '🍣', price: 20 },
  spring:    { name: 'Спринг-роллы',            icon: '🌯', price: 18 },
  duck:      { name: 'Утка по-пекински',        icon: '🦆', price: 40 },
};
const TOPS = {
  shrimp: { icon: '🦐', name: 'креветки', price: 6 },
  veg:    { icon: '🥬', name: 'бок-чой',  price: 4 },
};
const RECIPES = {
  tea: 'Заваривается сам → нажми на готовую чашку',
  noodles: '🍝 → вок → нажми на вок → миска 🥣 → добавки 🦐🥬, если просят → нажми на миску',
  dumplings: 'Нажми на пароварку → подожди → нажми на 🥟',
  cookie: 'Нажми на банку — и всё!',
  sushi: '🍚 рис → 🐟 рыба → нажми на 🍣',
  spring: 'Нажми на фритюр → забери, пока не сгорело',
  duck: 'Нажми на печь → забери вовремя, иначе сгорит',
};

const TIERS = [null,
  { name: 'Лоток «Лапша у дороги»',    short: 'Лоток',    icon: '🛺', slots: 3, cost: 0,
    desc: 'Маленькая уличная лапшичная: чай и лапша вок.', dishes: ['tea', 'noodles'] },
  { name: 'Кафе «Бамбуковый сад»',     short: 'Кафе',     icon: '🎋', slots: 3, cost: 2000,
    desc: 'Уютное кафе: пельмени в пароварке и печенье с предсказанием.', dishes: ['tea', 'noodles', 'dumplings', 'cookie'] },
  { name: 'Ресторан «Красный фонарь»', short: 'Ресторан', icon: '🏮', slots: 4, cost: 4500,
    desc: 'Настоящий ресторан: суши-бар и спринг-роллы во фритюре.', dishes: ['tea', 'noodles', 'dumplings', 'cookie', 'sushi', 'spring'] },
  { name: 'Дворец «Золотой дракон»',   short: 'Дворец',   icon: '🐉', slots: 4, cost: 8000,
    desc: 'Огромный ресторан мечты. Главное блюдо — утка по-пекински!', dishes: ['tea', 'noodles', 'dumplings', 'cookie', 'sushi', 'spring', 'duck'] },
];

// улучшения кухни
// Улучшения. Цены указаны для лотка и умножаются на COST_MUL заведения.
// В каждом новом заведении прокачка начинается заново.
const KITCHEN = {
  tea:      { name: 'Чайник',               icon: '🫖', tier: 1, cost: [60, 150, 320, 600],    slots: [2, 3, 3, 4, 4], time: [3.2, 2.8, 2.4, 2.0, 1.6] },
  wok:      { name: 'Вок-плита',            icon: '🥘', tier: 1, cost: [80, 200, 420, 800],    slots: [2, 3, 3, 4, 4], time: [4.5, 4, 3.5, 3, 2.6], burn: [6, 7, 8, 9, 10.5] },
  bowls:    { name: 'Миски для лапши',      icon: '🥣', tier: 1, cost: [90, 300],              slots: [2, 3, 4] },
  shrimp:   { name: 'Креветки',             icon: '🦐', tier: 1, cost: [120], unlock: true, desc: 'Новая добавка к лапше: +6 🪙' },
  veg:      { name: 'Бок-чой',              icon: '🥬', tier: 1, cost: [90],  unlock: true, desc: 'Новая добавка к лапше: +4 🪙' },
  helper:   { name: 'Ученик повара',        icon: '👦', tier: 1, cost: [450],  once: true,  desc: 'Сам перекладывает готовую лапшу из вока в миску' },
  steamer:  { name: 'Бамбуковая пароварка', icon: '🧺', tier: 2, cost: [150, 350, 700, 1200],  slots: [2, 3, 3, 4, 4], time: [5.5, 4.8, 4.1, 3.5, 3] },
  cookie:   { name: 'Банка печенья',        icon: '🥠', tier: 2, cost: [100, 300, 700] },
  sushi:    { name: 'Суши-бар',             icon: '🍣', tier: 3, cost: [300, 700, 1300],       slots: [2, 3, 3, 4] },
  fryer:    { name: 'Фритюрница',           icon: '🍳', tier: 3, cost: [300, 650, 1200, 2000], slots: [2, 3, 3, 4, 4], time: [4.8, 4.2, 3.6, 3.1, 2.7], burn: [6, 7, 8, 9, 10] },
  duck:     { name: 'Печь для утки',        icon: '🔥', tier: 4, cost: [800, 1600, 3000],      slots: [1, 2, 2, 3], time: [8, 7, 6, 5.2], burn: [8, 9.5, 11, 12] },
  chairs:   { name: 'Мягкие стулья',        icon: '🪑', tier: 1, cost: [150, 400, 900], hall: true, pat: 0.08, desc: 'Терпение гостей +8% за уровень' },
  register: { name: 'Касса и меню-доска',   icon: '🧾', tier: 1, cost: [200, 500, 1100], hall: true, pay: 0.08, desc: 'Оплата заказов +8% за уровень' },
  sign:     { name: 'Неоновая вывеска',     icon: '💡', tier: 1, cost: [250, 700], hall: true, vip: 0.05, desc: 'Чаще приходят VIP-панды 👑 (платят ×2)' },
};
const COST_MUL = [0, 1, 1.4, 2, 3];
const costOf = (base, t) => Math.round(base * COST_MUL[t] / 10) * 10;
const DISH_UP = { tea: 'tea', noodles: 'wok', dumplings: 'steamer', cookie: 'cookie', sushi: 'sushi', spring: 'fryer', duck: 'duck' };
const UP_DISH = Object.fromEntries(Object.entries(DISH_UP).map(([d, u]) => [u, d]));
const STATION_DISH = { tea: 'tea', steamer: 'dumplings', fryer: 'spring', duck: 'duck', sushi: 'sushi', bowls: 'noodles' };

// интерьер
const DECOR = {
  lanterns: { name: 'Красные фонарики',        icon: '🏮', cost: 150,  pat: 0.10, desc: 'Терпение гостей +10%' },
  bonsai:   { name: 'Бонсай',                  icon: '🪴', cost: 300,  pat: 0.08, desc: 'Терпение гостей +8%' },
  cat:      { name: 'Манэки-нэко',             icon: '🐱', cost: 500,  pay: 0.10, desc: 'Кот удачи: оплата +10%' },
  koi:      { name: 'Аквариум с карпами кои',  icon: '🐟', cost: 900,  tip: 0.10, desc: 'Чаевые довольных гостей +10%' },
  music:    { name: 'Музыка гучжэн',           icon: '🎶', cost: 1200, pat: 0.12, desc: 'Терпение гостей +12%' },
  dragon:   { name: 'Статуя золотого дракона', icon: '🐉', cost: 2000, pay: 0.20, desc: 'Оплата заказов +20%' },
};

const ST_ORDER = ['wok', 'bowls', 'tea', 'steamer', 'sushi', 'fryer', 'duck', 'cookie', 'trash'];
const ST_NAMES = { wok: 'Вок', bowls: 'Миски', tea: 'Чай', steamer: 'Пароварка', sushi: 'Суши-бар', fryer: 'Фритюр', duck: 'Печь для утки', cookie: 'Печенье', trash: 'Мусор' };
const FACES = ['👩', '👨', '👵', '👴', '👧', '👦', '🧑', '👱‍♀️', '🧔', '👩‍🦱', '👨‍🦱', '👱', '🧓', '👩‍🦰', '👨‍🦰', '👩‍🦳'];
const SHIRTS = ['#e74c3c', '#3498db', '#27ae60', '#9b59b6', '#f39c12', '#16a085', '#e67e22', '#2c3e50', '#d35400', '#c0392b', '#ff6fa8', '#00a8a8'];
const LV_PER = 25, MAX_LEVEL = 100, MAX_LOST = 3;

// ---------- сохранение ----------
const SAVE_KEY = 'pandaWok_v2';
function defaultSave() { return { coins: 50, stars: {}, tier: 1, up: {}, decor: {}, sound: true, music: true, story: false, final: false }; }
function loadSave() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return Object.assign(defaultSave(), s); } catch (e) {}
  const d = defaultSave();
  try { const o = JSON.parse(localStorage.getItem('pandaWok_v1')); if (o) { d.sound = o.sound !== false; d.music = o.music !== false; d.story = !!o.story; } } catch (e) {}
  return d;
}
let save = loadSave();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

// прокачка хранится отдельно для каждого заведения: save.up[заведение][id]
const ctxTier = () => (G && !G.ended) ? G.tier : save.tier;
function up(id, t = ctxTier()) { return (save.up[t] || {})[id] || 0; }
function setUp(id, v, t) { (save.up[t] = save.up[t] || {})[id] = v; }
function hasDecor(id, t = ctxTier()) { return !!(save.decor[t] || {})[id]; }
function stCfg(id) {
  const k = KITCHEN[id], l = up(id);
  return { slots: k.slots ? k.slots[l] : 0, time: k.time ? k.time[l] : 0, burn: k.burn ? k.burn[l] : 0, lvl: l };
}
function dishPrice(d, tops = [], t) {
  let p = DISHES[d].price * (1 + 0.12 * up(DISH_UP[d], t));
  tops.forEach(x => p += TOPS[x].price);
  return p;
}
// суммарный бонус от интерьера и улучшений зала: pat / pay / tip / vip
function bonus(key, t = ctxTier()) {
  let s = 0;
  for (const id in DECOR) if (hasDecor(id, t) && DECOR[id][key]) s += DECOR[id][key];
  for (const id in KITCHEN) if (KITCHEN[id][key]) s += KITCHEN[id][key] * up(id, t);
  return s;
}
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
const tierOf = lv => Math.ceil(lv / LV_PER);
const isRush = lv => lv % 5 === 0;
const dishIcon = d => `<span class="${d === 'duck' ? 'roast' : ''}">${DISHES[d].icon}</span>`;

// ---------- звук ----------
const Snd = {
  ctx: null, master: null, mTimer: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.7; this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  },
  note(f, dur, type, vol, t) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  tone(f, dur, type = 'sine', vol = 0.15, delay = 0) {
    if (!this.ctx || !save.sound) return;
    this.note(f, dur, type, vol, this.ctx.currentTime + delay);
  },
  noise(dur = 0.35, vol = 0.05, freq = 2500) {
    if (!this.ctx || !save.sound) return;
    const len = Math.floor(this.ctx.sampleRate * dur), buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
    s.buffer = buf; s.connect(f); f.connect(g); g.connect(this.master); s.start();
  },
  coin() { this.tone(1318, 0.12, 'square', 0.05); this.tone(1760, 0.25, 'square', 0.05, 0.07); },
  pop() { this.tone(660, 0.08, 'triangle', 0.14); this.tone(990, 0.12, 'triangle', 0.12, 0.05); },
  tap() { this.tone(520, 0.06, 'triangle', 0.08); },
  ready() { this.tone(1046, 0.1, 'sine', 0.06); this.tone(1318, 0.12, 'sine', 0.05, 0.06); },
  sizzle() { this.noise(0.35, 0.06, 3200); },
  bad() { this.tone(200, 0.22, 'sawtooth', 0.06); },
  burn() { this.tone(140, 0.4, 'sawtooth', 0.07); this.noise(0.4, 0.05, 900); },
  buy() { [784, 988, 1175].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.12, i * 0.07)); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.32, 'triangle', 0.12, i * 0.11)); },
  lose() { [392, 349, 311, 262].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.1, i * 0.15)); },
  // фоновая музыка: пентатоника в духе гучжэна
  startMusic() {
    if (!this.ctx || this.mTimer || !save.music) return;
    const scale = [392, 440, 493.88, 587.33, 659.25, 783.99, 880, 987.77, 1174.66];
    const bass = [98, 146.83, 110, 130.81];
    let step = 0, idx = 4, bi = 0;
    this.nextT = this.ctx.currentTime + 0.15;
    this.mTimer = setInterval(() => {
      if (!this.ctx) return;
      while (this.nextT < this.ctx.currentTime + 0.5) {
        const beat = 0.28;
        if (step % 8 === 0) { this.note(bass[bi % bass.length], beat * 7, 'triangle', 0.05, this.nextT); bi++; }
        if (step % 2 === 0 || Math.random() < 0.35) {
          idx = Math.max(0, Math.min(scale.length - 1, idx + pick([-2, -1, -1, 1, 1, 2, 0])));
          this.note(scale[idx], beat * 2.2, 'triangle', 0.035, this.nextT);
          if (Math.random() < 0.18) this.note(scale[idx] * 2, beat, 'sine', 0.015, this.nextT + beat / 2);
        }
        this.nextT += beat; step++;
      }
    }, 120);
  },
  stopMusic() { clearInterval(this.mTimer); this.mTimer = null; },
};


// ---------- музыка из файлов ----------
// Плейлисты: треки идут по очереди. В меню музыка продолжается с того же места,
// на каждом новом уровне включается следующий игровой трек.
// Если файла нет — он пропускается; если нет ни одного — играет мелодия из кода.
const Music = {
  lists: {
    menu: ['music/menu.mp3', 'music/menu2.mp3'],
    game: ['music/game.mp3', 'music/game2.mp3', 'music/game3.mp3'],
  },
  idx: { menu: 0, game: -1 }, pos: {}, failed: {}, el: null, cur: null, started: false, synth: false,
  init() {
    if (this.el) return;
    const a = this.el = new Audio();
    a.preload = 'auto'; a.volume = 0.5;
    a.addEventListener('ended', () => { this.pos[a.dataset.src] = 0; this.next(); });
    a.addEventListener('error', () => { if (a.dataset.src) this.fail(a.dataset.src); });
    a.addEventListener('loadedmetadata', () => { const p = this.pos[a.dataset.src]; if (p) try { a.currentTime = p; } catch (e) {} });
  },
  track() { return this.lists[this.cur][this.idx[this.cur]]; },
  fail(src) { if (this.failed[src]) return; this.failed[src] = true; if (this.cur && this.track() === src) this.next(); },
  next() { if (!this.cur) return; const L = this.lists[this.cur]; this.idx[this.cur] = (this.idx[this.cur] + 1) % L.length; this.start(); },
  start() {
    const L = this.lists[this.cur], a = this.el;
    let tries = 0;
    while (this.failed[this.track()] && tries < L.length) { this.idx[this.cur] = (this.idx[this.cur] + 1) % L.length; tries++; }
    if (this.failed[this.track()]) { a.pause(); this.synth = true; Snd.startMusic(); return; }
    Snd.stopMusic(); this.synth = false;
    const src = this.track();
    if (a.dataset.src !== src) {
      if (a.dataset.src) this.pos[a.dataset.src] = a.currentTime;
      a.dataset.src = src; a.src = src;
    }
    const pr = a.play();
    if (pr) pr.catch(err => { if (err && err.name === 'NotSupportedError') this.fail(src); });
  },
  play(list, fresh) {
    this.init(); this.started = true;
    if (fresh && list === 'game') { this.idx.game = (this.idx.game + 1) % this.lists.game.length; this.pos[this.lists.game[this.idx.game]] = 0; }
    if (!fresh && this.cur === list && (!this.el.paused || this.synth)) return;
    if (this.el.dataset.src) this.pos[this.el.dataset.src] = this.el.currentTime;
    this.cur = list;
    if (!save.music) { this.el.pause(); Snd.stopMusic(); return; }
    if (fresh && this.el.dataset.src === this.track()) try { this.el.currentTime = 0; } catch (e) {}
    this.start();
  },
  pauseAll() { if (this.el) this.el.pause(); Snd.stopMusic(); },
  resume() { if (this.cur && save.music) { this.init(); this.start(); } },
};

// ---------- общие UI ----------
let toastTimer = null;
function toast(msg) {
  const t = $('#toast'); t.innerHTML = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1300);
}
function modal(html, btns = [], cls = '') {
  const m = $('#modal'), b = $('#modal-box');
  b.className = 'modal-box ' + cls; b.innerHTML = html; b.scrollTop = 0;
  if (btns.length) {
    const row = h('div', 'm-btns');
    btns.forEach(([label, fn, kind]) => {
      const bt = h('button', 'btn ' + (kind || ''), label);
      bt.onclick = () => { Snd.tap(); closeModal(); fn && fn(); };
      row.appendChild(bt);
    });
    b.appendChild(row);
  }
  m.classList.remove('hidden');
}
function closeModal() { $('#modal').classList.add('hidden'); }
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $('#scr-' + name).classList.add('active');
  if (name !== 'game' && Music.started) Music.play('menu');
  if (name === 'map') renderMap();
  if (name === 'shop') renderShop();
}
function appRect(el) {
  const a = $('#app').getBoundingClientRect(), r = el.getBoundingClientRect();
  return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2 };
}
function floaty(text, el, cls = '', dy = 0) {
  const p = appRect(el), f = h('div', 'floaty ' + cls, text);
  f.style.left = p.x + 'px'; f.style.top = (p.y - 20 + dy) + 'px';
  $('#app').appendChild(f); setTimeout(() => f.remove(), 1150);
}
function flyTo(html, fromEl, toEl, size = 26) {
  if (!fromEl || !toEl) return;
  const a = appRect(fromEl), b = appRect(toEl), f = h('div', 'fly', html);
  f.style.fontSize = size + 'px';
  f.style.transform = `translate(${a.x - size / 2}px,${a.y - size / 2}px)`;
  $('#app').appendChild(f);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    f.style.transform = `translate(${b.x - size / 2}px,${b.y - size / 2}px) scale(.8)`;
  }));
  setTimeout(() => f.remove(), 450);
}
function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function confetti(n = 40, set = ['🎉', '🧧', '🏮', '✨', '🪙', '🥟', '🍜', '⭐']) {
  for (let i = 0; i < n; i++) {
    const c = h('div', 'confetti', pick(set));
    c.style.left = rand(0, 95) + '%';
    c.style.animationDuration = rand(1.8, 3.4) + 's';
    c.style.animationDelay = rand(0, 0.8) + 's';
    $('#app').appendChild(c); setTimeout(() => c.remove(), 4400);
  }
}

// ---------- титул ----------
function initTitle() {
  const tf = $('#title-food');
  ['🍜', '🥟', '🍣', '🥠', '🍵', '🌯', '🦐', '🥢', '🧧'].forEach((e, i) => {
    const s = h('span', '', e);
    s.style.left = (i * 11 + 3) + '%';
    s.style.animationDuration = rand(7, 12) + 's';
    s.style.animationDelay = -rand(0, 10) + 's';
    tf.appendChild(s);
  });
  updateSoundBtns();
  $('#btn-play').onclick = () => {
    Snd.init(); Snd.tap(); Music.play('menu');
    showScreen('map');
    if (!save.story) {
      save.story = true; persist();
      modal(`<div class="story-ic">🐼🍜</div><h2>Добро пожаловать!</h2>
        <p>Дядюшка Панда уходит на пенсию и оставляет тебе свой крошечный лоток с лапшой.</p>
        <p>Готовь вкусные китайские блюда, обслуживай гостей, зарабатывай монеты 🪙, улучшай кухню и расширяйся: <b>лоток → кафе → ресторан → дворец «Золотой дракон»</b>!</p>`,
        [['Вперёд! 🥢', null, 'green']]);
    }
  };
  $('#btn-sound').onclick = () => { save.sound = !save.sound; persist(); updateSoundBtns(); Snd.init(); Snd.tap(); };
  $('#btn-music').onclick = () => {
    save.music = !save.music; persist(); updateSoundBtns(); Snd.init();
    if (save.music) Music.resume(); else Music.pauseAll();
  };
  $('#btn-reset').onclick = () => modal('<h2>Сбросить прогресс?</h2><p>Все монеты, звёзды и улучшения пропадут.</p>',
    [['Отмена', null, ''], ['Сбросить', () => { const s = save.sound, m = save.music; save = defaultSave(); save.sound = s; save.music = m; persist(); toast('Прогресс сброшен'); }, 'red']]);
}
function updateSoundBtns() {
  $('#btn-sound').classList.toggle('off', !save.sound);
  $('#btn-music').classList.toggle('off', !save.music);
  $('#btn-sound').textContent = save.sound ? '🔊 Звук' : '🔇 Звук';
}

// ---------- карта ----------
function levelUnlocked(lv) {
  if (tierOf(lv) > save.tier) return false;
  return lv === 1 || (save.stars[lv - 1] || 0) >= 1;
}
function canExpand(t) { return t === save.tier + 1 && (save.stars[(t - 1) * LV_PER] || 0) >= 1; }
function renderMap() {
  $('#map-coins').textContent = '🪙 ' + save.coins;
  $('#map-stars').textContent = '⭐ ' + totalStars();
  const wrap = $('#map-list'); wrap.innerHTML = '';
  let scrollTo = null;
  for (let t = 1; t <= 4; t++) {
    const T = TIERS[t], sec = h('div', 'tier-sec t' + t);
    const from = (t - 1) * LV_PER + 1, to = t * LV_PER;
    let done = 0; for (let lv = from; lv <= to; lv++) if (save.stars[lv]) done++;
    sec.innerHTML = `<div class="tier-head"><div class="ti">${T.icon}</div><div><h3>${T.name}</h3><p>${T.desc}</p>
      <p class="tier-prog">Уровни ${from}–${to} · пройдено ${done} из ${LV_PER}</p></div></div>`;
    if (t <= save.tier) {
      const grid = h('div', 'lvl-grid');
      for (let lv = from; lv <= to; lv++) {
        const n = lv - from, row = Math.floor(n / 5), col = row % 2 ? 4 - n % 5 : n % 5;
        const st = save.stars[lv] || 0, unl = levelUnlocked(lv), rush = isRush(lv);
        const b = h('button', 'lvl' + (unl ? '' : ' locked') + (rush ? ' rush' : ''));
        b.innerHTML = `${unl ? lv : '🔒'}<span class="ls">${[0, 1, 2].map(i => `<i class="${i < st ? 'on' : ''}">⭐</i>`).join('')}</span>${rush ? '<span class="rush-ic">🔥</span>' : ''}`;
        b.style.gridRow = row + 1; b.style.gridColumn = col + 1;
        if (unl && !st && !scrollTo) { b.classList.add('next'); scrollTo = b; }
        b.onclick = () => { Snd.tap(); if (unl) showIntro(lv); else toast('Сначала пройди предыдущий уровень'); };
        grid.appendChild(b);
      }
      sec.appendChild(grid);
    } else {
      const lock = h('div', 'tier-lock2');
      if (t === save.tier + 1) {
        const ready = canExpand(t);
        lock.innerHTML = `<div class="big">🔒</div><p>${ready ? '<b>Можно открывать!</b>' : 'Пройди уровень ' + ((t - 1) * LV_PER) + ', чтобы расшириться'}</p>
          <p class="small">В новом заведении прокачка начинается заново</p>`;
        const bt = h('button', 'btn green', `Открыть за ${T.cost} 🪙`);
        if (!ready) bt.disabled = true;
        bt.onclick = () => expand(t);
        lock.appendChild(bt);
        if (ready && !scrollTo) scrollTo = bt;
      } else lock.innerHTML = '<div class="big">🔒</div><p>Откроется позже</p>';
      sec.appendChild(lock);
    }
    wrap.appendChild(sec);
  }
  wrap.appendChild(h('div', 'map-end', '🐉 Построй дворец «Золотой дракон»!'));
  if (scrollTo) setTimeout(() => {
    const top = scrollTo.getBoundingClientRect().top - wrap.getBoundingClientRect().top + wrap.scrollTop - 160;
    wrap.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, 60);
}

function expand(t) {
  const T = TIERS[t];
  if (!canExpand(t)) { toast('Сначала пройди уровень ' + ((t - 1) * LV_PER)); return; }
  if (save.coins < T.cost) { toast(`Не хватает монет: нужно ${T.cost} 🪙`); Snd.bad(); return; }
  save.coins -= T.cost; save.tier = t; persist();
  Snd.win(); confetti(50);
  modal(`<div class="story-ic">${T.icon}</div><h2>Новое заведение!</h2><p>Теперь у тебя <b>${T.name}</b>!</p><p>${T.desc}</p><p>Мест для гостей: <b>${T.slots}</b>.</p><p>Новое здание — новое оборудование: <b>прокачка начинается заново</b>. Загляни в «Улучшения»!</p>`,
    [['Ура! 🎉', () => renderMap(), 'green']]);
  renderMap(); if ($('#scr-shop').classList.contains('active')) renderShop();
}

// ---------- магазин ----------
let shopTab = 'kitchen';
function renderShop() {
  const t = save.tier;
  $('#shop-coins').textContent = '🪙 ' + save.coins;
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.dataset.tab === shopTab));
  const list = $('#shop-list'); list.innerHTML = '';
  const note = txt => list.appendChild(h('div', 'shop-note', txt));
  if (shopTab === 'kitchen' || shopTab === 'decor') {
    note(`${TIERS[t].icon} Улучшения для: <b>${TIERS[t].name}</b>`);
    if (shopTab === 'decor') {
      for (const id in KITCHEN) if (KITCHEN[id].hall) list.appendChild(upCard(id, t));
      for (const id in DECOR) {
        const d = DECOR[id], own = hasDecor(id, t), c = costOf(d.cost, t);
        const card = h('div', 'card');
        card.innerHTML = `<div class="ic">${d.icon}</div><div class="info"><h4>${d.name}</h4><p>${d.desc}</p></div>`;
        card.appendChild(buyBtn(false, own, c, () => buyDecor(id), 'Есть ✔'));
        list.appendChild(card);
      }
    } else for (const id in KITCHEN) if (!KITCHEN[id].hall) list.appendChild(upCard(id, t));
  } else {
    note('Расширяйся: от лотка до огромного дворца');
    for (let n = 1; n <= 4; n++) {
      const T = TIERS[n], card = h('div', 'card');
      card.innerHTML = `<div class="ic">${T.icon}</div><div class="info"><h4>${T.name}</h4><p>${T.desc} Мест для гостей: ${T.slots}. Уровни ${(n - 1) * LV_PER + 1}–${n * LV_PER}.</p></div>`;
      if (n <= save.tier) card.appendChild(h('div', 'maxed', 'Открыт ✔'));
      else {
        const b = h('button', 'btn green', `${T.cost} 🪙`);
        if (!canExpand(n)) { b.disabled = true; card.querySelector('p').innerHTML += `<br><b>Нужно: ${n === save.tier + 1 ? 'пройти уровень ' + ((n - 1) * LV_PER) : 'открыть ' + TIERS[n - 1].short}</b>`; }
        b.onclick = () => expand(n);
        card.appendChild(b);
      }
      list.appendChild(card);
    }
  }
}
function upCard(id, t, quick) {
  const k = KITCHEN[id], l = up(id, t), max = k.cost.length, locked = k.tier > t;
  const card = h('div', quick ? 'qcard' : 'card' + (locked ? ' locked' : ''));
  card.innerHTML = `<div class="ic">${k.icon}</div><div class="info"><h4>${k.name}</h4><p>${locked ? 'Откроется: ' + TIERS[k.tier].short : upDesc(id, t)}</p>
    <div class="pips">${Array.from({ length: max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div></div>`;
  card.appendChild(buyBtn(locked, l >= max, locked ? 0 : costOf(k.cost[l] || 0, t), () => buyUp(id, t, quick), k.once || k.unlock ? 'Есть ✔' : 'MAX'));
  return card;
}

function upDesc(id, t) {
  const k = KITCHEN[id], l = up(id, t), mx = l >= k.cost.length;
  if (k.unlock || k.once) return (l ? 'Куплено ✔ ' : '') + k.desc;
  const parts = [], ar = (a, sfx = '') => `${a[l]}${sfx}${mx ? '' : ' → ' + a[l + 1] + sfx}`;
  if (k.desc) { const v = k.pat || k.pay || k.vip; return k.desc + `: сейчас +${Math.round(l * v * 100)}%`; }
  if (k.slots) parts.push('Мест: ' + ar(k.slots));
  if (k.time) parts.push('Готовка: ' + ar(k.time, 'с'));
  if (k.burn) parts.push('Не сгорит: ' + ar(k.burn, 'с'));
  if (UP_DISH[id]) parts.push(`Цена: +${l * 12}%${mx ? '' : ' → +' + (l + 1) * 12 + '%'}`);
  return parts.join(' · ');
}

function buyBtn(locked, done, cost, fn, doneText = 'MAX') {
  if (locked) return h('div', 'maxed', '🔒');
  if (done) return h('div', 'maxed', doneText);
  const b = h('button', 'btn' + (save.coins < cost ? ' off' : ''), `${cost} 🪙`);
  b.onclick = fn; return b;
}
function buyUp(id, t, quick) {
  const k = KITCHEN[id], l = up(id, t), c = costOf(k.cost[l], t);
  if (save.coins < c) { toast('Не хватает монет 🪙'); Snd.bad(); return; }
  save.coins -= c; setUp(id, l + 1, t); persist(); Snd.buy();
  toast(`${k.icon} ${k.name}: улучшено!`);
  if (quick) {
    if (STATION_OF[id]) rebuildStation(STATION_OF[id]);
    updateWallet();
    const sc = $('#modal-box').scrollTop; openQuickShop(); $('#modal-box').scrollTop = sc;
  } else renderShop();
}

function buyDecor(id) {
  const d = DECOR[id], t = save.tier, c = costOf(d.cost, t);
  if (save.coins < c) { toast('Не хватает монет 🪙'); Snd.bad(); return; }
  save.coins -= c; (save.decor[t] = save.decor[t] || {})[id] = true; persist(); Snd.buy(); confetti(18, [d.icon, '✨']);
  toast(`${d.icon} ${d.name} — теперь в зале!`); renderShop();
}

// ---------- уровни ----------
function levelConfig(lv) {
  const tier = tierOf(lv), k = (lv - 1) % LV_PER, T = TIERS[tier], rush = isRush(lv);
  let customers = 8 + (tier - 1) * 3 + Math.floor(k * 0.55);
  if (rush) customers = Math.round(customers * 1.25);
  const maxItems = (tier === 1 && k < 5) ? 2 : 3;
  const duration = Math.round(customers * (rush ? 5.4 : 6.2) + 35);
  const patience = Math.max(18, 35 - (tier - 1) * 2 - k * 0.35);
  const pool = T.dishes.slice();
  const newDishes = tier > 1 ? T.dishes.filter(d => !TIERS[tier - 1].dishes.includes(d)) : ['tea', 'noodles'];
  const W = { tea: 0.9, noodles: 1.3, dumplings: 1, cookie: 0.6, sushi: 1, spring: 1, duck: 0.55 };
  const ws = pool.reduce((a, d) => a + W[d], 0);
  const avg = pool.reduce((a, d) => a + DISHES[d].price * W[d], 0) / ws;
  const base = customers * (maxItems === 2 ? 1.58 : 1.8) * avg;
  const r5 = x => Math.max(5, Math.round(x / 5) * 5);
  return { lv, tier, k, rush, customers, maxItems, duration, patience, pool, newDishes, targets: [r5(base * 0.7), r5(base * 0.95), r5(base * 1.15)] };
}

function showIntro(lv) {
  const c = levelConfig(lv), T = TIERS[c.tier];
  const news = c.k === 0 ? c.newDishes : [];
  modal(`<div class="m-tier">${T.icon} ${T.short} · ${c.k + 1} из ${LV_PER}</div>
    <h2>Уровень ${lv}</h2>
    ${c.rush ? '<div class="rush-badge">🔥 Час пик — гостей больше!</div>' : ''}
    <div class="goal-big"><small>ЦЕЛЬ</small><b>${c.targets[0]} 🪙</b></div>
    <div class="star-row"><span>⭐<b>${c.targets[0]}</b></span><span>⭐⭐<b>${c.targets[1]}</b></span><span>⭐⭐⭐<b>${c.targets[2]}</b></span></div>
    <div class="chips"><span>👥 ${c.customers}</span><span>⏱ ${fmt(c.duration)}</span><span>😡 ≤ ${MAX_LOST}</span></div>
    ${news.length ? `<div class="new-dish">Новое: ${news.map(d => dishIcon(d)).join(' ')}</div>` : ''}`,
    [['◀', null, ''], ['📖 Меню', () => showRecipes(lv), 'blue'], ['Начать ▶', () => startLevel(lv), 'green']], 'intro');
}
function showRecipes(lv) {
  const c = levelConfig(lv);
  const rec = c.pool.map(d => `<div class="recipe"><div class="ri">${dishIcon(d)}</div>
    <div><b>${DISHES[d].name}</b> <span class="pr">${Math.round(dishPrice(d, [], c.tier))} 🪙</span><br>${RECIPES[d]}</div></div>`).join('');
  const tops = Object.keys(TOPS).filter(t => up(t, c.tier)).map(t => TOPS[t].icon).join(' ');
  modal(`<h2>📖 Меню и рецепты</h2>${rec}
    ${tops ? `<p class="small">Добавки к лапше: ${tops}</p>` : ''}
    <p class="small">😡 Если уйдёт больше ${MAX_LOST} гостей — уровень не пройден</p>`,
    [['◀ Назад', () => showIntro(lv), ''], ['Начать ▶', () => startLevel(lv), 'green']]);
}

// ---------- игра ----------
let G = null, lastTs = 0;

function startLevel(lv) {
  const cfg = levelConfig(lv);
  G = {
    lv, cfg, tier: cfg.tier, time: 0, left: cfg.duration, coins: 0,
    spawned: 0, served: 0, lost: 0, combo: 0, maxCombo: 0, nextSpawn: 0.8,
    slots: [], st: {}, trash: false, paused: false, ended: false, hintT: 0, doneAt: null,
    tutorial: lv <= 2 || cfg.k === 0, lastStars: 0,
  };
  showScreen('game');
  buildGameUI();
  Snd.init(); Music.play('game', true);
  lastTs = performance.now();
  requestAnimationFrame(loop);
}

function buildGameUI() {
  $('#hud-lvl').textContent = G.lv;
  const t = G.cfg.targets;
  ['gs0', 'gs1', 'gs2'].forEach((id, i) => {
    const e = $('#' + id); e.classList.remove('on');
    e.style.left = Math.min(94, (t[i] / t[2]) * 100 - (i === 2 ? 6 : 0)) + '%';
  });
  const hall = $('#hall');
  hall.className = 't' + G.tier;
  hall.innerHTML = hallHTML(G.tier) + '<div id="customers"></div><div id="hint" class="hidden"></div>';
  const qb = h('button', 'qshop-btn', '<span>⬆️</span><b>Улучшить</b>');
  qb.id = 'qshop-btn';
  qb.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Snd.tap(); openQuickShop(); });
  hall.appendChild(qb); G.qT = 0;
  const wb = h('div', 'wallet-box', '<span>🪙</span><b id="wallet-coins">0</b><small>монеты</small>');
  wb.id = 'wallet-box'; hall.appendChild(wb); updateWallet();
  const cw = $('#customers'), n = TIERS[G.tier].slots;
  cw.classList.toggle('slots4', n >= 4);
  G.slots = [];
  for (let i = 0; i < n; i++) {
    const el = h('div', 'cslot'); cw.appendChild(el);
    const slot = { i, el, c: null, coins: 0, block: 0 };
    el.addEventListener('pointerdown', e => { if (slot.coins) { e.preventDefault(); collect(slot); } });
    G.slots.push(slot);
  }
  buildKitchen();
}

function hallHTML(t) {
  let s = '';
  if (t === 1) s += '<div class="sky-moon"></div><div class="wall"></div><div class="awning"></div><div class="sign">面 ЛАПША 面</div>';
  if (t === 2) s += '<div class="wall"></div><div class="win w1"></div><div class="win w2"></div><div class="sign">竹 БАМБУКОВЫЙ САД 竹</div>';
  if (t === 3) s += '<div class="wall"></div><div class="win w1"></div><div class="win w2"></div><div class="win w3"></div><div class="col c1"></div><div class="col c2"></div><div class="sign">紅燈 КРАСНЫЙ ФОНАРЬ</div>';
  if (t === 4) s += '<div class="wall"></div><div class="moon"></div><div class="col c1"></div><div class="col c2"></div><div class="sign">金龍 ЗОЛОТОЙ ДРАКОН</div>';
  s += '<div class="tables">' + '<div class="table"></div>'.repeat(t >= 3 ? 4 : 3) + '</div><div class="floor"></div>';
  // фонарики
  const nl = (t >= 2 ? 2 : 0) + (hasDecor('lanterns', t) ? 3 : 0);
  for (let i = 0; i < nl; i++) {
    const x = ((i + 0.5) / nl) * 100;
    s += `<div class="decor lantern" style="left:calc(${x}% - 14px);top:${t === 1 ? 34 : 4}px;animation-delay:${-i * 0.7}s">🏮</div>`;
  }
  if (hasDecor('dragon', t)) s += '<div class="decor dragon">🐉</div>';
  if (hasDecor('koi', t)) s += '<div class="decor koi"><span>🐟</span><span>🐠</span></div>';
  if (hasDecor('music', t)) s += '<div class="decor music">🎶</div>';
  if (hasDecor('bonsai', t)) s += '<div class="decor bonsai">🪴</div>';
  if (hasDecor('cat', t)) s += '<div class="decor cat">🐱</div>';
  return s;
}

function addSrc(parent, icon, fn, locked, lockMsg) {
  const b = h('button', 'src' + (locked ? ' locked' : ''), icon);
  b.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (!G || G.paused || G.ended) return;
    if (locked) { toast(lockMsg); return; }
    if (G.trash) setTrash(false);
    fn(b);
  });
  parent.appendChild(b);
  return b;
}

function buildKitchen() {
  const k = $('#kitchen'); k.innerHTML = ''; k.classList.remove('trashmode');
  G.st = {}; G.trash = false;
  for (const id of ST_ORDER) k.appendChild(buildStation(id));
}

// строит одну станцию; если она уже была — сохраняет состояние готовящихся блюд
function buildStation(id) {
  const tierReq = id === 'trash' ? 1 : KITCHEN[id].tier;
  const st = h('div', 'st st-' + id); st.style.gridArea = id; st.dataset.id = id;
  if (tierReq > G.tier) {
    st.classList.add('locked');
    st.innerHTML = `<div class="lock">🔒</div><div class="lk-name">${ST_NAMES[id]}</div><div class="lk-tier">${TIERS[tierReq].short}</div>`;
    return st;
  }
  const lvl = id === 'trash' ? 0 : up(id);
  st.innerHTML = `<div class="st-label">${ST_NAMES[id]}${lvl ? `<i>${'▲'.repeat(lvl)}</i>` : ''}</div>`;
  const row = h('div', 'st-row'); st.appendChild(row);
  if (id === 'trash') {
    const b = h('button', 'bigbtn trashbtn', '🗑️');
    b.addEventListener('pointerdown', e => { e.preventDefault(); if (!G.paused && !G.ended) setTrash(!G.trash); });
    row.appendChild(b); G.trashBtn = b;
  } else if (id === 'cookie') {
    const b = h('button', 'bigbtn jar', '🥠');
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); if (G.paused || G.ended) return;
      if (G.trash) setTrash(false);
      serve('cookie', [], b);
    });
    row.appendChild(b);
  } else {
    if (id === 'wok') addSrc(row, '🍝', srcWok);
    if (id === 'bowls') {
      const col = h('div', 'srcs'); row.appendChild(col);
      addSrc(col, '🦐', b => srcTop('shrimp', b), !up('shrimp'), 'Купи 🦐 креветки в «Улучшениях» ⬆️');
      addSrc(col, '🥬', b => srcTop('veg', b), !up('veg'), 'Купи 🥬 бок-чой в «Улучшениях» ⬆️');
    }
    if (id === 'sushi') {
      const col = h('div', 'srcs'); row.appendChild(col);
      addSrc(col, '🍚', srcRice);
      addSrc(col, '🐟', srcFish);
    }
    const old = G.st[id];
    const cfg = stCfg(id), slots = [], els = [];
    for (let i = 0; i < cfg.slots; i++) {
      slots.push(old && old.slots[i] ? old.slots[i] : { s: id === 'tea' ? 'cook' : 'empty', t: id === 'tea' ? -i * 0.5 : 0, tops: [] });
      const e = h('div', 'slot ' + id + (cfg.burn ? ' burnable' : ''), '<span class="food"></span><span class="steamfx">♨️</span><div class="prog"><i></i></div>');
      e.addEventListener('pointerdown', ev => { ev.preventDefault(); if (!G.paused && !G.ended) tapSlot(id, i); });
      row.appendChild(e); els.push(e);
    }
    G.st[id] = { slots, els, cfg };
  }
  return st;
}
function rebuildStation(id) {
  const old = $(`#kitchen .st[data-id="${id}"]`);
  if (old) { const n = buildStation(id); old.replaceWith(n); n.classList.add('upgraded'); }
}

// ---------- улучшения прямо во время уровня ----------
const STATION_OF = { tea: 'tea', wok: 'wok', bowls: 'bowls', shrimp: 'bowls', veg: 'bowls', steamer: 'steamer', cookie: 'cookie', sushi: 'sushi', fryer: 'fryer', duck: 'duck' };
function affordableUp() {
  if (!G) return false;
  return Object.keys(KITCHEN).some(id => { const k = KITCHEN[id], l = up(id); return k.tier <= G.tier && l < k.cost.length && save.coins >= costOf(k.cost[l], G.tier); });
}

function openQuickShop() {
  if (!G || G.ended) return;
  if (!G.paused) { G.paused = true; G.quickShop = true; }
  if (G.trash) setTrash(false);
  modal(`<button class="mclose" id="qclose" aria-label="Закрыть">✕</button><h2>⬆️ Улучшения</h2><div class="qwallet">У тебя: <b>${save.coins} 🪙</b></div>
    <p style="font-size:12px;opacity:.75">Уровень на паузе. Покупка работает сразу!</p><div class="qlist"></div>`,
    [['▶ Вернуться к игре', closeQuickShop, 'green']], 'qshop');
  $('#qclose').onclick = () => { Snd.tap(); closeModal(); closeQuickShop(); };
  const opened = performance.now();
  $('#modal').onclick = e => {
    if (e.target.id === 'modal' && G && G.quickShop && performance.now() - opened > 400) { closeModal(); closeQuickShop(); }
  };
  const list = $('#modal-box .qlist');
  Object.keys(KITCHEN).filter(id => KITCHEN[id].tier <= G.tier).forEach(id => list.appendChild(upCard(id, G.tier, true)));
}

function quickBuy(id) { buyUp(id, G.tier, true); }

function updateWallet() {
  const w = $('#wallet-coins'); if (!w) return;
  const v = String(save.coins);
  if (w.textContent !== v) { w.textContent = v; const b = $('#wallet-box'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
}
function closeQuickShop() {
  if (G && G.quickShop) { G.quickShop = false; G.paused = false; lastTs = performance.now(); }
}

function setTrash(on) {
  G.trash = on;
  $('#kitchen').classList.toggle('trashmode', on);
  if (G.trashBtn) G.trashBtn.classList.toggle('on', on);
  if (on) toast('Нажми на блюдо, которое нужно выбросить');
}

// --- источники ---
function startCook(id, i) {
  const sl = G.st[id].slots[i];
  sl.s = 'cook'; sl.t = 0; sl.tops = [];
  if (id === 'wok' || id === 'fryer') Snd.sizzle(); else Snd.tap();
}
function srcWok(b) {
  const st = G.st.wok, i = st.slots.findIndex(s => s.s === 'empty');
  if (i < 0) { toast('Все воки заняты'); shake(b); return; }
  flyTo('🍝', b, st.els[i]); startCook('wok', i);
}
function srcTop(t, b) {
  const st = G.st.bowls;
  const i = st.slots.findIndex(s => s.s === 'full' && !s.tops.includes(t));
  if (i < 0) { toast(st.slots.some(s => s.s === 'full') ? 'Здесь уже есть ' + TOPS[t].icon : 'Сначала положи лапшу в миску 🥣'); shake(b); return; }
  st.slots[i].tops.push(t); flyTo(TOPS[t].icon, b, st.els[i], 20); Snd.tap();
}
function srcRice(b) {
  const st = G.st.sushi, i = st.slots.findIndex(s => s.s === 'empty');
  if (i < 0) { toast('На доске нет места'); shake(b); return; }
  st.slots[i].s = 'rice'; flyTo('🍚', b, st.els[i]); Snd.tap();
}
function srcFish(b) {
  const st = G.st.sushi, i = st.slots.findIndex(s => s.s === 'rice');
  if (i < 0) { toast('Сначала положи рис 🍚'); shake(b); return; }
  st.slots[i].s = 'ready'; flyTo('🐟', b, st.els[i]); Snd.ready();
}

// --- нажатие на ячейку ---
function tapSlot(id, i) {
  const st = G.st[id], sl = st.slots[i], el = st.els[i];
  if (G.trash) {
    const has = id === 'tea' ? sl.s === 'ready' : sl.s !== 'empty';
    if (has) { discard(id, i); setTrash(false); }
    return;
  }
  if (sl.s === 'burnt') { discard(id, i); return; }
  switch (id) {
    case 'tea':
      if (sl.s === 'ready' && serve('tea', [], el)) { sl.s = 'cook'; sl.t = 0; }
      break;
    case 'wok':
      if (sl.s === 'empty') startCook('wok', i);
      else if (sl.s === 'ready') {
        const bw = G.st.bowls, b = bw.slots.findIndex(x => x.s === 'empty');
        if (b < 0) { toast('Нет свободной миски 🥣'); shake(el); Snd.bad(); return; }
        bw.slots[b] = { s: 'full', t: 0, tops: [] };
        flyTo('🍜', el, bw.els[b]); sl.s = 'empty'; sl.t = 0; Snd.tap();
      }
      break;
    case 'bowls':
      if (sl.s === 'full' && serve('noodles', sl.tops, el)) { sl.s = 'empty'; sl.tops = []; }
      break;
    case 'sushi':
      if (sl.s === 'ready' && serve('sushi', [], el)) sl.s = 'empty';
      else if (sl.s === 'rice') toast('Добавь рыбу 🐟');
      else if (sl.s === 'empty') srcRice(el);
      break;
    case 'steamer': case 'fryer': case 'duck':
      if (sl.s === 'empty') startCook(id, i);
      else if (sl.s === 'ready' && serve(STATION_DISH[id], [], el)) { sl.s = 'empty'; sl.t = 0; }
      break;
  }
}
function discard(id, i) {
  const st = G.st[id], el = st.els[i];
  st.slots[i] = id === 'tea' ? { s: 'cook', t: 0, tops: [] } : { s: 'empty', t: 0, tops: [] };
  floaty('💨', el, '', 10); Snd.tone(300, 0.12, 'triangle', 0.1);
  if (G.trashBtn) flyTo('🗑️', el, G.trashBtn, 18);
}

// --- обслуживание ---
function serve(d, tops, fromEl) {
  let best = null, bi = -1;
  G.slots.forEach(slot => {
    const c = slot.c; if (!c || c.leaving) return;
    const idx = c.items.findIndex(it => !it.done && it.d === d && sameTops(it.tops, tops));
    if (idx >= 0 && (!best || c.pat < best.c.pat)) { best = { c, slot }; bi = idx; }
  });
  if (!best) {
    const wantsNoTop = d === 'noodles' && G.slots.some(s => s.c && !s.c.leaving && s.c.items.some(it => !it.done && it.d === 'noodles'));
    toast(wantsNoTop ? 'Гостям нужна лапша с другими добавками' : 'Никто не заказывал это блюдо');
    shake(fromEl); Snd.bad(); return false;
  }
  const c = best.c, item = c.items[bi];
  item.done = true;
  flyTo(d === 'duck' ? '<span class="roast">🦆</span>' : DISHES[d].icon, fromEl, item.el);
  setTimeout(() => item.el && item.el.classList.add('done'), 380);
  Snd.pop();
  if (c.items.every(it => it.done)) customerPaid(best.slot);
  else c.pat = Math.min(c.max, c.pat + 2);
  return true;
}

function genOrder() {
  const c = G.cfg, r = Math.random();
  let n = 1;
  if (c.maxItems >= 3 && r < 0.22) n = 3; else if (r < 0.58) n = 2;
  const W = { tea: 0.9, noodles: 1.3, dumplings: 1, cookie: 0.6, sushi: 1, spring: 1, duck: 0.55 };
  const weights = c.pool.map(d => W[d] * (c.k === 0 && c.newDishes.includes(d) && G.tier > 1 ? 1.8 : 1));
  const sum = weights.reduce((a, b) => a + b, 0);
  const tops = Object.keys(TOPS).filter(t => up(t));
  const items = [];
  let guard = 0;
  while (items.length < n && guard++ < 30) {
    let x = Math.random() * sum, d = c.pool[0];
    for (let i = 0; i < c.pool.length; i++) { x -= weights[i]; if (x <= 0) { d = c.pool[i]; break; } }
    if (items.filter(it => it.d === d).length >= 2) continue;
    const tp = d === 'noodles' ? tops.filter(() => Math.random() < 0.42) : [];
    items.push({ d, tops: tp, done: false });
  }
  return items;
}

function spawnCustomer(slot) {
  const vip = Math.random() < 0.05 + bonus('vip');
  const items = genOrder();
  let pat = G.cfg.patience * (1 + bonus('pat')) + (items.length - 1) * 4;
  if (vip) pat *= 0.8;
  const c = { items, pat, max: pat, vip, leaving: false };
  const el = h('div', 'cust');
  const bubble = h('div', 'bubble');
  const oi = h('div', 'oitems');
  items.forEach(it => {
    const e = h('div', 'oitem', dishIcon(it.d) + it.tops.map((t, j) => `<span class="tp tp${j}">${TOPS[t].icon}</span>`).join(''));
    it.el = e; oi.appendChild(e);
  });
  bubble.appendChild(oi);
  bubble.insertAdjacentHTML('beforeend', '<div class="pbar"><i></i></div><span class="mood">😊</span>' + (vip ? '<span class="vipc">👑</span>' : ''));
  el.appendChild(bubble);
  el.insertAdjacentHTML('beforeend', `<div class="person"><div class="head">${vip ? '🐼' : pick(FACES)}</div><div class="body" style="background:${vip ? 'linear-gradient(#ffd84a,#c8902a)' : pick(SHIRTS)}"></div></div>`);
  slot.el.appendChild(el);
  c.el = el; c.barEl = bubble.querySelector('.pbar i'); c.moodEl = bubble.querySelector('.mood');
  slot.c = c; G.spawned++;
}

function customerPaid(slot) {
  const c = slot.c;
  const base = c.items.reduce((s, it) => s + dishPrice(it.d, it.tops), 0);
  const ratio = c.pat / c.max;
  let tipRate = ratio > 0.66 ? 0.2 : ratio > 0.33 ? 0.1 : 0;
  if (tipRate > 0) tipRate += bonus('tip');
  G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
  let total = base * (1 + bonus('pay')) * (c.vip ? 2 : 1) + base * tipRate + Math.min(G.combo - 1, 5) * 2;
  total = Math.round(total);
  G.served++;
  floaty(ratio > 0.5 ? '❤️' : '🙂', slot.el, '', -60);
  if (G.combo >= 3) floaty(`Комбо ×${G.combo}!`, $('#hall'), 'combo', -30);
  if (c.vip) floaty('VIP ×2 👑', slot.el, 'combo', -90);
  leave(slot, true);
  slot.coins += total;
  renderCoins(slot);
  {
    const g = G;
    setTimeout(() => { if (G === g && !G.ended && slot.coins) collect(slot); }, 650);
  }
}

function leave(slot, happy) {
  const c = slot.c; if (!c) return;
  c.leaving = true;
  c.el.classList.add(happy ? 'leave-happy' : 'leave');
  const el = c.el; setTimeout(() => el.remove(), 620);
  slot.c = null; slot.block = G.time + 0.8;
  if (!happy) {
    G.lost++; G.combo = 0;
    floaty('😡', slot.el, '', -60); Snd.bad();
    const hl = $('#hud-lost'); hl.classList.remove('hit'); void hl.offsetWidth; hl.classList.add('hit');
    if (G.lost > MAX_LOST) { endLevel('angry'); return; }
    toast(G.lost === MAX_LOST ? '😡 Ещё один ушедший гость — и уровень провален!' : `😡 Гость ушёл! (${G.lost} из ${MAX_LOST})`);
  }
}

function renderCoins(slot) {
  const old = slot.el.querySelector('.coinpile'); if (old) old.remove();
  if (!slot.coins) return;
  const p = h('div', 'coinpile', `<span>💰</span><b>+${slot.coins}</b>`);
  slot.el.appendChild(p);
}
function collect(slot) {
  if (!slot.coins) return;
  const amt = slot.coins; slot.coins = 0;
  const pile = slot.el.querySelector('.coinpile');
  if (pile) flyTo('🪙', pile, $('#wallet-box') || $('#goal-coin'), 30);
  G.coins += amt; save.coins += amt; persist();
  floaty('+' + amt + ' 🪙', slot.el, '', -10);
  renderCoins(slot); Snd.coin();
  slot.block = G.time + rand(0.4, 1.2);
}

// --- цикл ---
function loop(ts) {
  if (!G || G.ended) return;
  const dt = Math.min(0.05, (ts - lastTs) / 1000); lastTs = ts;
  if (!G.paused) { update(dt); if (!G.ended) render(); }
  requestAnimationFrame(loop);
}

function update(dt) {
  G.time += dt; G.left -= dt;
  for (const id in G.st) {
    const st = G.st[id], cfg = st.cfg;
    if (!cfg.time) continue;
    st.slots.forEach(sl => {
      if (sl.s === 'cook') {
        sl.t += dt;
        if (sl.t >= cfg.time) { sl.s = 'ready'; sl.t = 0; if (id !== 'tea') Snd.ready(); }
      } else if (sl.s === 'ready' && cfg.burn) {
        sl.t += dt;
        if (sl.t >= cfg.burn) { sl.s = 'burnt'; sl.t = 0; Snd.burn(); }
      }
    });
  }
  if (up('helper') && G.st.wok && G.st.bowls) {
    G.st.wok.slots.forEach((sl, i) => {
      if (sl.s !== 'ready') return;
      const bw = G.st.bowls, b = bw.slots.findIndex(x => x.s === 'empty');
      if (b < 0) return;
      bw.slots[b] = { s: 'full', t: 0, tops: [] };
      flyTo('🍜', G.st.wok.els[i], bw.els[b]); sl.s = 'empty'; sl.t = 0;
    });
  }
  G.slots.forEach(slot => {
    const c = slot.c; if (!c || c.leaving) return;
    c.pat -= dt;
    if (c.pat <= 0) leave(slot, false);
  });
  if (G.spawned < G.cfg.customers && G.time >= G.nextSpawn) {
    const free = G.slots.filter(s => !s.c && !s.coins && G.time >= s.block);
    if (free.length) {
      spawnCustomer(pick(free));
      const k = Math.max(0.5, 1 - G.cfg.k * 0.015 - (G.tier - 1) * 0.05 - (G.cfg.rush ? 0.2 : 0));
      G.nextSpawn = G.time + (G.spawned < 3 ? rand(0.8, 1.8) : rand(1.6, 4.2) * k);
    }
  }
  const present = G.slots.some(s => s.c);
  if (G.ended) return;
  if (G.left <= 0) endLevel('time');
  else if (G.spawned >= G.cfg.customers && !present) {
    if (G.doneAt === null) G.doneAt = G.time;
    if (G.time - G.doneAt > 1.2 || !G.slots.some(s => s.coins)) endLevel('done');
  }
}

function render() {
  for (const id in G.st) {
    const st = G.st[id];
    st.slots.forEach((sl, i) => renderSlot(id, sl, st.els[i], st.cfg));
  }
  G.slots.forEach(slot => {
    const c = slot.c; if (!c || c.leaving) return;
    const r = Math.max(0, c.pat / c.max);
    c.barEl.style.width = (r * 100) + '%';
    c.barEl.style.background = r > 0.6 ? '#2ecc71' : r > 0.3 ? '#f1c40f' : '#e74c3c';
    const m = r > 0.6 ? '😊' : r > 0.3 ? '😐' : '😠';
    if (c.moodEl.textContent !== m) c.moodEl.textContent = m;
    c.el.classList.toggle('angry', r < 0.22);
  });
  // HUD
  const t = G.cfg.targets;
  $('#goal-fill').style.width = Math.min(100, G.coins / t[2] * 100) + '%';
  $('#goal-txt').textContent = `${G.coins} / ${t[0]}`;
  let stars = 0;
  t.forEach((v, i) => { const on = G.coins >= v; if (on) stars++; const e = $('#gs' + i); if (e.classList.contains('on') !== on) e.classList.toggle('on', on); });
  if (stars > G.lastStars) { G.lastStars = stars; Snd.win(); floaty('⭐'.repeat(stars), $('#goal'), 'combo', 40); }
  const te = $('#hud-time'); te.textContent = '⏱ ' + fmt(G.left); te.classList.toggle('low', G.left < 15);
  $('#hud-cust').textContent = `👥 ${G.served}/${G.cfg.customers}`;
  $('#hud-lost').textContent = `😡 ${G.lost}/${MAX_LOST}`;
  $('#hud-lost').classList.toggle('danger', G.lost >= MAX_LOST);
  G.qT -= 1 / 60;
  if (G.qT <= 0) {
    G.qT = 0.4;
    updateWallet();
    const can = affordableUp(), qb = $('#qshop-btn');
    if (qb.classList.contains('can') !== can) qb.classList.toggle('can', can);
  }
  // подсказки
  G.hintT -= 1 / 60;
  if (G.tutorial && G.hintT <= 0) {
    G.hintT = 0.3;
    const hint = $('#hint'), txt = hintText();
    if (txt) { if (hint.textContent !== txt) hint.textContent = txt; hint.classList.remove('hidden'); }
    else hint.classList.add('hidden');
  }
}

function renderSlot(id, sl, el, cfg) {
  const key = sl.s + '|' + (sl.tops || []).join(',');
  if (el._k !== key) {
    el._k = key;
    el.classList.remove('s-empty', 's-cook', 's-ready', 's-burnt', 's-full', 's-rice', 'warn');
    el.classList.add('s-' + sl.s);
    el.querySelector('.food').innerHTML = foodHTML(id, sl);
  }
  let p = 0;
  if (sl.s === 'cook' && cfg.time) p = Math.max(0, sl.t / cfg.time);
  else if (sl.s === 'ready' && cfg.burn) {
    p = sl.t / cfg.burn;
    const w = p > 0.55; if (el.classList.contains('warn') !== w) el.classList.toggle('warn', w);
  }
  el.style.setProperty('--p', p.toFixed(3));
}

function foodHTML(id, sl) {
  const s = sl.s;
  switch (id) {
    case 'tea': return s === 'ready' ? '🍵' : '<span class="dim">🍵</span>';
    case 'wok': return s === 'empty' ? '' : s === 'cook' ? '<span class="raw">🍝</span>' : '🍜';
    case 'bowls': return s === 'full' ? '🍜' + sl.tops.map((t, j) => `<span class="tp tp${j}">${TOPS[t].icon}</span>`).join('') : '';
    case 'steamer': return s === 'ready' ? '🥟' : '';
    case 'fryer': return s === 'empty' ? '' : s === 'cook' ? '<span class="raw">🌯</span>' : '🌯';
    case 'duck': return s === 'empty' ? '' : s === 'cook' ? '🦆' : '<span class="roast">🦆</span>';
    case 'sushi': return s === 'rice' ? '🍚' : s === 'ready' ? '🍣' : '';
  }
  return '';
}

// --- подсказки обучения ---
function wanted(d) { return G.slots.some(s => s.c && !s.c.leaving && s.c.items.some(it => !it.done && it.d === d)); }
function wantsTop() {
  for (const s of G.slots) if (s.c && !s.c.leaving) for (const it of s.c.items) if (!it.done && it.d === 'noodles' && it.tops.length) return it.tops;
  return null;
}
function hintText() {
  const st = G.st, any = (id, s) => st[id] && st[id].slots.some(x => x.s === s);
  for (const id in st) if (any(id, 'burnt')) return 'Подгорело! Нажми на сгоревшее блюдо, чтобы выбросить его';
  if (wanted('noodles')) {
    if (any('bowls', 'full')) {
      const wt = wantsTop();
      if (wt && st.bowls.slots.some(b => b.s === 'full' && !wt.every(t => b.tops.includes(t))))
        return `Гость хочет лапшу с ${wt.map(t => TOPS[t].icon).join(' и ')} — нажми на добавку слева от мисок`;
      return 'Нажми на миску 🍜 — лапша уйдёт гостю';
    }
    if (any('wok', 'ready')) return 'Лапша готова! Нажми на вок — она переложится в миску 🥣';
    if (!any('wok', 'cook')) return 'Нажми 🍝, чтобы бросить лапшу в вок';
  }
  if (wanted('tea') && any('tea', 'ready')) return 'Нажми на готовый чай 🍵 — он уйдёт гостю';
  if (wanted('dumplings')) {
    if (any('steamer', 'ready')) return 'Пельмени готовы — нажми на них 🥟';
    if (!any('steamer', 'cook')) return 'Нажми на пароварку, чтобы приготовить пельмени 🥟';
  }
  if (wanted('cookie')) return 'Нажми на банку 🥠 — печенье сразу уйдёт гостю';
  if (wanted('sushi')) {
    if (any('sushi', 'ready')) return 'Нажми на готовые суши 🍣';
    if (any('sushi', 'rice')) return 'Теперь нажми 🐟 — положи рыбу на рис';
    return 'Для суши нажми 🍚 рис, потом 🐟 рыбу';
  }
  if (wanted('spring')) {
    if (any('fryer', 'ready')) return 'Спринг-роллы готовы — забирай, пока не подгорели!';
    if (!any('fryer', 'cook')) return 'Нажми на фритюр, чтобы жарить спринг-роллы 🌯';
  }
  if (wanted('duck')) {
    if (any('duck', 'ready')) return 'Утка готова! Нажми на неё 🦆';
    if (!any('duck', 'cook')) return 'Нажми на печь — утка готовится дольше всех';
  }
  if (any('wok', 'ready') && !any('bowls', 'empty')) return 'Миски заняты — выброси лишнее через 🗑️';
  if (G.time < 4) return 'Гости скоро придут! Можно заранее бросить лапшу в вок 🍝';
  return '';
}

// --- конец уровня, пауза ---
function endLevel(reason) {
  if (G.ended) return;
  G.ended = true;
  G.slots.forEach(s => { if (s.coins) { G.coins += s.coins; save.coins += s.coins; s.coins = 0; } });
  const t = G.cfg.targets;
  const stars = G.lost > MAX_LOST ? 0 : G.coins >= t[2] ? 3 : G.coins >= t[1] ? 2 : G.coins >= t[0] ? 1 : 0;
  const prev = save.stars[G.lv] || 0;
  if (stars > prev) save.stars[G.lv] = stars;
  persist();
  stars ? Snd.win() : Snd.lose();
  if (stars === 3) confetti(36);
  setTimeout(() => showResult(stars, reason), 450);
}
function showResult(stars, reason) {
  const lv = G.lv, next = lv + 1;
  const title = stars ? (stars === 3 ? 'Идеально!' : 'Уровень пройден!') : (reason === 'angry' ? 'Ушло слишком много гостей 😡' : reason === 'time' ? 'Время вышло…' : 'Не хватило монет…');
  const btns = [['🗺 Карта', () => showScreen('map'), 'blue'], ['↻ Ещё раз', () => showIntro(lv), '']];
  if (stars && next <= MAX_LEVEL) {
    if (levelUnlocked(next)) btns.push(['Дальше ▶', () => showIntro(next), 'green']);
    else if (tierOf(next) > save.tier) btns.push(['🏯 Расшириться', () => { shopTab = 'resto'; showScreen('shop'); }, 'green']);
  }
  modal(`<h2>${title}</h2>
    <div class="bigstars">${[0, 1, 2].map(i => `<span class="${i < stars ? 'on' : ''}">⭐</span>`).join('')}</div>
    <div class="res-rows">
      <div><span>Заработано</span><b>${G.coins} 🪙</b></div>
      <div><span>Цель</span><b>${G.cfg.targets[0]} 🪙</b></div>
      <div><span>Обслужено гостей</span><b>${G.served} из ${G.cfg.customers}</b></div>
      <div><span>Ушли недовольными</span><b>${G.lost} (можно ${MAX_LOST})</b></div>
      <div><span>Лучшее комбо</span><b>×${G.maxCombo}</b></div>
      <div><span>Всего монет</span><b>${save.coins} 🪙</b></div>
    </div>
    ${stars ? '' : `<p style="font-size:12.5px">${reason === 'angry' ? 'Не давай гостям уходить: следи за полосками терпения!' : 'Совет: купи улучшения — больше мест и быстрее готовка!'}</p>`}`, btns);
  if (lv === MAX_LEVEL && stars && !save.final) {
    save.final = true; persist();
    setTimeout(() => {
      confetti(80, ['🐉', '🏮', '🧧', '🎆', '🪙', '⭐', '🥟', '🍜']);
      modal(`<div class="story-ic">🐉🏯</div><h2>Ты — легенда!</h2>
        <p>Из крошечного лотка с лапшой ты построил(а) огромный дворец <b>«Золотой дракон»</b>!</p>
        <p>Дядюшка Панда гордится тобой 🐼❤️</p><p>Можно переигрывать уровни на 3 звезды и докупать улучшения.</p>`,
        [['Ура! 🎉', () => showScreen('map'), 'green']]);
    }, 2500);
  }
}
function pauseGame() {
  if (!G || G.ended || G.paused) return;
  G.paused = true;
  modal('<div class="story-ic">⏸</div><h2>Пауза</h2>', [
    ['▶ Продолжить', resumeGame, 'green'],
    ['↻ Заново', () => { G.ended = true; showIntro(G.lv); }, ''],
    ['🗺 Карта', () => { G.ended = true; showScreen('map'); }, 'red'],
  ]);
}
function resumeGame() { if (!G) return; G.paused = false; lastTs = performance.now(); }

// ---------- запуск ----------
function init() {
  initTitle();
  $('#map-back').onclick = () => { Snd.tap(); showScreen('title'); };
  $('#map-shop').onclick = () => { Snd.tap(); showScreen('shop'); };
  $('#shop-back').onclick = () => { Snd.tap(); showScreen('map'); };
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => { Snd.tap(); shopTab = t.dataset.tab; renderShop(); });
  $('#btn-pause').onclick = () => { Snd.tap(); pauseGame(); };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pauseGame(); Music.pauseAll(); }
    else { if (Snd.ctx) Snd.ctx.resume(); Music.resume(); }
  });
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault());
}
init();
