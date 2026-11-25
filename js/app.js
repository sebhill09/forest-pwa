/* ============================================================
   Forest — personal focus PWA
   Vanilla JS, no build step.
   ============================================================ */
(() => {
  'use strict';

  /* ---------------- constants & utilities ---------------- */
  const STORAGE_KEY = 'forest.pwa.v1';
  const APP_VERSION = '1.0.0';
  const DURATIONS = [10, 25, 45, 60, 90];
  const DEFAULT_TAG_SUGGESTIONS = ['Study', 'Work', 'Reading', 'Creative'];

  const el = (sel, root = document) => root.querySelector(sel);
  const esc = (v = '') => String(v).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const pad = (n) => String(n).padStart(2, '0');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const speciesList = () => (Array.isArray(window.TREE_SPECIES) ? window.TREE_SPECIES : []);
  const getSpecies = (id) => speciesList().find((s) => s.id === id) || speciesList()[0] || null;

  const fmtClock = (totalSec) => {
    const s = Math.max(0, Math.ceil(Number(totalSec) || 0));
    return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  };
  const fmtShort = (mins) => {
    const m = Math.round(Number(mins) || 0);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem ? `${h}h ${rem}m` : `${h}h`;
  };
  const dayKey = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const shortDate = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const fullDate = (ts) => new Date(ts).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  }) + ' · ' + new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const hash = (str) => {
    let h = 2166136261;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  };

  function greeting() {
    const h = new Date().getHours();
    if (h < 5) return 'Late night focus';
    if (h < 12) return 'Good morning — ready to grow';
    if (h < 18) return 'Good afternoon — time to focus';
    if (h < 22) return 'Good evening — wind down';
    return 'Late night focus';
  }

  function daypart() {
    const h = new Date().getHours();
    if (h < 5) return 'night';
    if (h < 8) return 'dawn';
    if (h < 17) return 'day';
    if (h < 20) return 'dusk';
    return 'night';
  }

  /* ---------------- icons ---------------- */
  const ICON = {
    leaf: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21v-6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M12 15c-4.6 0-7-2.9-7-6.6C9.6 8.4 12 10 12 15Z" fill="currentColor" opacity=".95"/><path d="M12 12c0-4.6 2.6-7.2 7-7.2 0 4.6-2.6 7.2-7 7.2Z" fill="currentColor" opacity=".7"/></svg>`,
    coin: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.2" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.6v8.8M9.6 10.2c.5-.7 1.3-1 2.4-1 1.4 0 2.4.7 2.4 1.8 0 2.4-4.8 1.2-4.8 3.5 0 1.1 1 1.8 2.4 1.8 1.1 0 1.9-.3 2.4-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    flame: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12.4 3.2c2.3 3.4 4.8 5.4 4.8 8.9a5.2 5.2 0 0 1-10.4 0c0-1.8.9-3.2 2.1-4.9.7 1.6 1.6 2 2.6 1.4-.8-1.7-.5-3.7.9-5.4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
    sprout: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 14C7.8 14 5.4 11.4 5.4 8c3.9 0 6.6 1.8 6.6 6Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 11c0-4.2 2.4-6.6 6.6-6.6 0 4.2-2.4 6.6-6.6 6.6Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
    tag: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 11V5a1 1 0 0 1 1-1h6l9 9-7 7-9-9Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="8.4" cy="8.4" r="1.35" fill="currentColor"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v3h16v-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M12 11v6M12 7.6v.4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`
  };

  const SEED_SVG = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="20" cy="34" rx="12" ry="3.5" fill="#1E4632" opacity=".16"/><path d="M11 32c2-6 6-9 11-9 4 0 7 2 8 6-3 5-8 7-14 6-2-.3-4-1.3-5-3Z" fill="#8A5A3B"/><path d="M14 29c2.5-2 5.5-3 9-2.4" stroke="#B07C55" stroke-width="2" stroke-linecap="round" opacity=".7"/></svg>`;
  const SPROUT_SVG = `<svg viewBox="0 0 60 66" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="30" cy="60" rx="17" ry="4.5" fill="#1E4632" opacity=".15"/><path d="M30 60V34" stroke="#5E8B55" stroke-width="5" stroke-linecap="round"/><path d="M30 44c-9 1-14-3-15-10 8-1 13 2 15 10Z" fill="#6FA96F"/><path d="M30 38c8 0 13-4 14-11-8-1-12 3-14 11Z" fill="#8FC08F"/></svg>`;
  const EMPTY_ART = `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="100" cy="108" r="78" fill="#EDF5E7"/><ellipse cx="100" cy="190" rx="62" ry="12" fill="#C9DFC2"/><path d="M100 184v-52" stroke="#5E8B55" stroke-width="7" stroke-linecap="round"/><path d="M100 150c-22 2-34-8-36-24 19-2 32 5 36 24Z" fill="#7FB482"/><path d="M100 132c19 0 31-10 33-26-19-2-29 7-33 26Z" fill="#A5CB9D"/><path d="M52 176c14-10 26-8 36 0" stroke="#9EC69B" stroke-width="4" stroke-linecap="round"/><path d="M118 182c12-8 22-6 30 0" stroke="#9EC69B" stroke-width="4" stroke-linecap="round"/><circle cx="154" cy="66" r="16" fill="#F8E4B7"/></svg>`;

  const HILLS = `<svg class="hills" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><path d="M0 92c54-30 108 12 172-4 64-16 112-50 228-32v144H0Z" fill="#C6DEC0"/><path d="M0 130c60-22 108 10 170 2 74-10 128-40 230-18v86H0Z" fill="#A9CFA4"/><path d="M0 164c74-16 128 8 208 2 68-6 116-14 192-6v40H0Z" fill="#7FB082"/><g stroke="#679C6E" stroke-width="3" stroke-linecap="round" opacity=".45"><path d="M46 180v-9M46 173l-5-5M46 175l5-6"/><path d="M146 186v-8M146 180l-4-4M146 182l4-5"/><path d="M292 182v-9M292 175l-5-5M292 177l5-6"/></g></svg>`;

  const MEADOW_HILLS = `<svg class="meadow-hills" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><path d="M0 118c60-26 116 14 190 0 70-13 128-42 210-24v106H0Z" fill="#CFE4C8" opacity=".75"/><path d="M0 150c76-18 132 10 214 2 66-6 112-16 186-8v56H0Z" fill="#B7D6AE" opacity=".9"/><g stroke="#9EC69B" stroke-width="3" stroke-linecap="round" opacity=".5"><path d="M60 176v-8M60 170l-4-4M60 172l4-5"/><path d="M210 184v-8M210 178l-4-4M210 180l4-5"/><path d="M330 174v-8M330 168l-4-4M330 170l4-5"/></g></svg>`;

  /* ---------------- state ---------------- */
  const DEFAULT_STATE = {
    v: 1,
    coins: 80,
    sessions: [],
    withered: 0,
    unlocked: ['oak', 'pine'],
    selected: 'oak',
    settings: { strict: false, sound: true, grace: 10 },
    achievements: [],
    active: null
  };

  function freshState() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function loadState() {
    const next = freshState();
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { raw = null; }
    if (!raw || typeof raw !== 'object') return next;

    if (Number.isFinite(raw.coins)) next.coins = Math.max(0, Math.round(raw.coins));
    if (Number.isFinite(raw.withered)) next.withered = Math.max(0, Math.round(raw.withered));
    if (Array.isArray(raw.sessions)) {
      next.sessions = raw.sessions.filter((s) => s && s.id && Number.isFinite(s.endedAt) && Number.isFinite(s.minutes));
    }
    if (Array.isArray(raw.unlocked) && raw.unlocked.length) {
      next.unlocked = [...new Set(raw.unlocked.filter((id) => speciesList().some((sp) => sp.id === id)))];
      if (speciesList().length === 0) next.unlocked = [...new Set(raw.unlocked)];
    }
    if (!next.unlocked.includes('oak')) next.unlocked.unshift('oak');
    if (typeof raw.selected === 'string' && next.unlocked.includes(raw.selected)) next.selected = raw.selected;
    else next.selected = next.unlocked[0];
    if (raw.settings && typeof raw.settings === 'object') {
      next.settings.strict = !!raw.settings.strict;
      next.settings.sound = raw.settings.sound !== false;
      next.settings.grace = clamp(Number(raw.settings.grace) || 10, 3, 30);
    }
    if (Array.isArray(raw.achievements)) next.achievements = [...new Set(raw.achievements.filter((x) => typeof x === 'string'))];
    if (raw.active && Number.isFinite(raw.active.endsAt) && Number.isFinite(raw.active.startedAt) && raw.active.minutes > 0) {
      next.active = raw.active;
    }
    return next;
  }

  let state = loadState();
  let resumedDeath = false;

  // A stored running session can only mean the app was closed/reloaded mid-focus.
  if (state.active) {
    const abandoned = state.active;
    state.active = null;
    state.withered = (state.withered || 0) + 1;
    resumedDeath = true;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
    // Stash for the death screen after render.
    state._resumed = abandoned;
  }

  function save() {
    try {
      const copy = { ...state };
      delete copy._resumed;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
    } catch (e) { /* private mode */ }
  }

  /* ---------------- ui state ---------------- */
  const ui = {
    tab: 'focus',
    duration: 25,
    custom: false,
    tag: '',
    sheet: null,
    result: null,
    hiddenAt: null
  };

  let ticker = null;
  let wakeLock = null;
  let deferredPrompt = null;
  let toastTimer = null;
  let audioCtx = null;

  /* ---------------- derived stats ---------------- */
  function totalMinutes(st) {
    return st.sessions.reduce((sum, s) => sum + (Number(s.minutes) || 0), 0);
  }

  function currentStreak(st) {
    const days = new Set(st.sessions.map((s) => dayKey(s.endedAt)));
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(dayKey(d))) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  function longestStreak(st) {
    const keys = [...new Set(st.sessions.map((s) => dayKey(s.endedAt)))].sort();
    let best = 0;
    let run = 0;
    let prev = null;
    keys.forEach((k) => {
      const d = new Date(`${k}T12:00:00`);
      if (prev) {
        const prevD = new Date(`${prev}T12:00:00`);
        const diff = Math.round((d - prevD) / 86400000);
        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      best = Math.max(best, run);
      prev = k;
    });
    return best;
  }

  function last7(st) {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const mins = st.sessions
        .filter((s) => dayKey(s.endedAt) === key)
        .reduce((sum, s) => sum + (Number(s.minutes) || 0), 0);
      out.push({
        key,
        mins,
        label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
        today: i === 0
      });
    }
    return out;
  }

  function topTags(st) {
    const map = new Map();
    st.sessions.forEach((s) => {
      const tag = (s.tag || '').trim();
      if (!tag) return;
      map.set(tag, (map.get(tag) || 0) + (Number(s.minutes) || 0));
    });
    return [...map.entries()]
      .map(([tag, mins]) => ({ tag, mins }))
      .sort((a, b) => b.mins - a.mins)
      .slice(0, 4);
  }

  /* ---------------- achievements ---------------- */
  const ACHIEVEMENTS = [
    { id: 'first', name: 'First Sprout', desc: 'Finish your first session', icon: '🌱', bonus: 10, test: (st) => st.sessions.length >= 1 },
    { id: 'grove', name: 'Little Grove', desc: 'Grow 10 trees', icon: '🌳', bonus: 20, test: (st) => st.sessions.length >= 10 },
    { id: 'forester', name: 'Forester', desc: 'Grow 50 trees', icon: '🌲', bonus: 50, test: (st) => st.sessions.length >= 50 },
    { id: 'century', name: 'Centurion', desc: 'Grow 100 trees', icon: '💯', bonus: 100, test: (st) => st.sessions.length >= 100 },
    { id: 'deep', name: 'Deep Roots', desc: 'Focus for 10 hours', icon: '⏳', bonus: 25, test: (st) => totalMinutes(st) >= 600 },
    { id: 'old', name: 'Old Growth', desc: 'Focus for 50 hours', icon: '🪵', bonus: 75, test: (st) => totalMinutes(st) >= 3000 },
    { id: 'streak3', name: 'Three in a Row', desc: '3-day focus streak', icon: '🔥', bonus: 15, test: (st) => currentStreak(st) >= 3 },
    { id: 'streak7', name: 'Week of Focus', desc: '7-day focus streak', icon: '🏆', bonus: 40, test: (st) => currentStreak(st) >= 7 },
    { id: 'night', name: 'Night Owl', desc: 'Finish after midnight', icon: '🦉', bonus: 15, test: (st, s) => !!s && new Date(s.endedAt).getHours() < 4 },
    { id: 'early', name: 'Early Bird', desc: 'Finish before 8am', icon: '🌅', bonus: 15, test: (st, s) => !!s && new Date(s.endedAt).getHours() < 8 },
    { id: 'marathon', name: 'Marathon', desc: 'Complete a 90+ min session', icon: '🏃', bonus: 30, test: (st, s) => !!s && s.minutes >= 90 },
    { id: 'collector', name: 'Collector', desc: 'Unlock 8 tree species', icon: '🍃', bonus: 30, test: (st) => st.unlocked.length >= 8 }
  ];

  function checkAchievements(session) {
    const newly = [];
    ACHIEVEMENTS.forEach((a) => {
      if (state.achievements.includes(a.id)) return;
      let ok = false;
      try { ok = a.test(state, session); } catch (e) { ok = false; }
      if (ok) {
        state.achievements.push(a.id);
        state.coins += a.bonus || 0;
        newly.push(a);
      }
    });
    return newly;
  }

  /* ---------------- audio ---------------- */
  function audio() {
    if (!state.settings.sound) return null;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (e) { return null; }
  }

  function tone(ctx, freq, start, dur, vol, type) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(vol || 0.05, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  function playPop() {
    const ctx = audio();
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(ctx, 392, t, 0.13, 0.04, 'sine');
    tone(ctx, 523.25, t + 0.06, 0.16, 0.03, 'sine');
  }

  function playChime() {
    const ctx = audio();
    if (!ctx) return;
    const t = ctx.currentTime + 0.05;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ctx, f, t + i * 0.11, 0.55, 0.05, 'sine'));
    tone(ctx, 261.63, t, 0.9, 0.025, 'triangle');
  }

  /* ---------------- wake lock ---------------- */
  async function requestWakeLock() {
    try {
      if (!('wakeLock' in navigator) || !state.active || document.visibilityState !== 'visible') return;
      if (wakeLock) return;
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) { wakeLock = null; }
  }

  function releaseWakeLock() {
    try { if (wakeLock) wakeLock.release(); } catch (e) {}
    wakeLock = null;
  }

  /* ---------------- session engine ---------------- */
  function startSession() {
    if (state.active) return;
    const sp = getSpecies(state.selected);
    if (!sp) { toast('No tree species available.', 'warn'); return; }
    const minutes = clamp(Math.round(ui.duration) || 25, 1, 180);
    const now = Date.now();
    state.active = {
      id: uid(),
      species: sp.id,
      minutes,
      startedAt: now,
      endsAt: now + minutes * 60000,
      tag: ui.tag.trim().slice(0, 24),
      strict: !!state.settings.strict
    };
    save();
    clearToasts();
    playPop();
    ui.result = null;
    render();
    startTicker();
    requestWakeLock();
  }

  function completeSession() {
    const s = state.active;
    if (!s) return;
    const now = Date.now();
    const firstToday = !state.sessions.some((x) => dayKey(x.endedAt) === dayKey(now));
    const base = Math.max(1, Math.round(s.minutes)) + (s.minutes >= 60 ? 10 : 0) + (firstToday ? 5 : 0);
    const before = state.coins;
    state.coins += base;

    const session = {
      id: s.id,
      species: s.species,
      minutes: s.minutes,
      startedAt: s.startedAt,
      endedAt: now,
      tag: s.tag || '',
      strict: !!s.strict,
      coins: 0
    };
    state.sessions.push(session);
    state.active = null;
    ui.hiddenAt = null;
    ui.sheet = null;

    const newly = checkAchievements(session);
    session.coins = state.coins - before;

    save();
    stopTicker();
    releaseWakeLock();
    playChime();
    ui.result = { type: 'done', session, coins: session.coins, achievements: newly };
    render();
  }

  function wither(reason) {
    const s = state.active;
    if (!s) return;
    state.withered = (state.withered || 0) + 1;
    state.active = null;
    ui.hiddenAt = null;
    ui.sheet = null;
    save();
    stopTicker();
    releaseWakeLock();
    ui.result = { type: 'dead', session: s, reason };
    render();
  }

  function startTicker() {
    stopTicker();
    ticker = setInterval(() => {
      if (!state.active) return;
      if (document.visibilityState !== 'visible') return;
      updateLive();
      if (Date.now() >= state.active.endsAt) completeSession();
    }, 250);
  }

  function stopTicker() {
    if (ticker) {
      clearInterval(ticker);
      ticker = null;
    }
  }

  /* ---------------- render: focus ---------------- */
  function topbar() {
    return `<header class="topbar">
      <div class="brand">
        <div class="brand-mark">${ICON.leaf}</div>
        <div>
          <h1>Forest</h1>
          <p>${esc(greeting())}</p>
        </div>
      </div>
      <div class="pills">
        <button class="pill amber" data-action="tab" data-tab="shop" aria-label="Coins — open tree shop">${ICON.coin}${state.coins}</button>
        <button class="pill" data-action="tab" data-tab="stats" aria-label="Focus streak — open progress">${ICON.flame}${currentStreak(state)}</button>
      </div>
    </header>`;
  }

  function sceneHTML(sp, active, progress) {
    const stage = active ? (progress < 0.12 ? 'sprout' : 'tree') : 'tree';
    const scale = active
      ? (progress < 0.12 ? 0.3 : 0.3 + 0.7 * easeOut((progress - 0.12) / 0.88))
      : 1;
    const remain = active ? (active.endsAt - Date.now()) / 1000 : ui.duration * 60;
    return `<div class="scene ${active ? '' : 'is-idle'}" data-daypart="${daypart()}">
      <div class="stars"></div>
      <div class="sun"></div>
      <div class="moon"></div>
      <div class="cloud c1"></div>
      <div class="cloud c2"></div>
      ${HILLS}
      <div class="tree-slot" id="tree-slot" data-stage="${stage}">
        <div class="seed">${SEED_SVG}</div>
        <div class="sprout">${SPROUT_SVG}</div>
        <div class="tree-scale" style="--tscale:${scale.toFixed(3)}">
          <div class="tree-sway">${sp ? sp.svg : ''}</div>
        </div>
      </div>
      <div class="clock-wrap">
        <div class="clock" id="clock">${fmtClock(remain)}</div>
        <div class="clock-label" id="clock-label">${active ? (active.strict ? 'Strict focus' : 'Growing') : 'Ready to focus'}</div>
      </div>
      ${active ? '' : '<div class="scene-hint">Stay in the app while your tree grows</div>'}
      <div class="progress-line"><i id="scene-progress" style="width:${active ? Math.round(progress * 100) : 0}%"></i></div>
    </div>`;
  }

  function idleControls(potential) {
    const unlocked = state.unlocked.map(getSpecies).filter(Boolean);
    const rail = unlocked.map((sp) => `<button class="species-chip ${sp.id === state.selected ? 'active' : ''}" data-action="select-species" data-id="${sp.id}" aria-pressed="${sp.id === state.selected}">
      <span class="art">${sp.svg}</span><span>${esc(sp.name)}</span>
    </button>`).join('');

    const durations = DURATIONS.map((m) => `<button class="dur-chip ${!ui.custom && ui.duration === m ? 'active' : ''}" data-action="set-duration" data-min="${m}">${m}<small>m</small></button>`).join('');

    return `<div class="controls">
      <div class="panel">
        <div class="section-label">Tree species <span>${unlocked.length} of ${speciesList().length} unlocked</span></div>
        <div class="species-rail">
          ${rail}
          <button class="species-more" data-action="tab" data-tab="shop" aria-label="Open the tree shop">+</button>
        </div>
      </div>
      <div class="panel">
        <div class="section-label">Focus length</div>
        <div class="duration-row">
          ${durations}
          <button class="dur-chip custom ${ui.custom ? 'active' : ''}" data-action="custom-duration">${ui.custom ? ui.duration + 'm' : 'Custom'}</button>
        </div>
      </div>
      <div class="panel tag-panel">
        <div class="tag-row">
          <div class="tag-icon">${ICON.tag}</div>
          <input class="tag-input" id="tag-input" maxlength="24" placeholder="Tag this session (optional)" value="${esc(ui.tag)}" autocomplete="off" enterkeyhint="done">
        </div>
      </div>
      <button class="plant-btn" data-action="plant">
        <span class="pb-left">${ICON.sprout} Plant a tree</span>
        <span class="pb-coins">+${potential} coins</span>
      </button>
      <p class="microcopy">${state.settings.strict ? '<strong>Strict mode is on.</strong> Leaving the app kills your tree instantly.' : 'Leave the app and your tree withers. Stay to help it grow.'}</p>
    </div>`;
  }

  function activeControls() {
    const sp = getSpecies(state.active.species);
    return `<div class="active-controls">
      <div class="focus-status">
        <span class="pulse-dot"></span>
        <div>Your ${sp ? esc(sp.name.toLowerCase()) : 'tree'} is growing
          <small>${state.active.tag ? esc(state.active.tag) + ' · ' : ''}Stay in the app until the timer ends</small>
        </div>
      </div>
      <button class="abandon-btn" data-action="abandon">Give up on this tree</button>
    </div>`;
  }

  function focusView() {
    const active = state.active;
    const sp = getSpecies(active ? active.species : state.selected);
    const progress = active
      ? clamp((Date.now() - active.startedAt) / (active.endsAt - active.startedAt), 0, 1)
      : 0;
    const minutes = ui.duration;
    const potential = Math.max(1, Math.round(minutes)) + (minutes >= 60 ? 10 : 0);
    return `<section class="screen focus-screen">
      ${topbar()}
      ${sceneHTML(sp, active, progress)}
      ${active ? activeControls() : idleControls(potential)}
    </section>`;
  }

  /* ---------------- render: forest ---------------- */
  function forestView() {
    const trees = [...state.sessions].sort((a, b) => a.endedAt - b.endedAt);
    const total = totalMinutes(state);
    let maxY = 120;
    const items = trees.map((s, i) => {
      const sp = getSpecies(s.species);
      if (!sp) return '';
      const row = Math.floor(i / 3);
      const col = i % 3;
      const jitterX = (hash(s.id + 'x') % 11) - 5;
      const jitterY = (hash(s.id + 'y') % 16) - 8;
      const x = trees.length === 1
        ? 50
        : trees.length === 2
          ? [31, 69][i]
          : clamp([17, 50, 83][col] + jitterX * 1.4, 12, 88);
      const y = 92 + row * 138 + jitterY;
      maxY = Math.max(maxY, y);
      const sc = 0.68 + ((hash(s.id + 's') % 20) / 100);
      return `<button class="meadow-tree" style="left:${x.toFixed(1)}%;top:${y}px;--ms:${sc.toFixed(2)}" data-action="tree" data-id="${esc(s.id)}" aria-label="${esc(sp.name)} planted ${esc(shortDate(s.endedAt))}">
        ${sp.svg}<span class="mt-label">${esc(shortDate(s.endedAt))}</span>
      </button>`;
    }).join('');

    const recent = [...state.sessions].sort((a, b) => b.endedAt - a.endedAt).slice(0, 4);
    const recentHTML = recent.length
      ? `<div class="card recent">
          <div class="recent-head"><h2>Recently planted</h2><span>${trees.length} total</span></div>
          ${recent.map((s) => {
            const sp = getSpecies(s.species);
            if (!sp) return '';
            return `<button class="recent-row" data-action="tree" data-id="${esc(s.id)}">
              <span class="rr-art">${sp.svg}</span>
              <span class="rr-mid"><b>${esc(sp.name)}</b><i>${esc(shortDate(s.endedAt))}${s.tag ? ' · ' + esc(s.tag) : ''}</i></span>
              <span class="rr-min">${fmtShort(s.minutes)}</span>
            </button>`;
          }).join('')}
        </div>`
      : '';

    return `<section class="screen forest-screen">
      <div class="head-row">
        <div>
          <h1>Your forest</h1>
          <p>${trees.length} ${trees.length === 1 ? 'tree' : 'trees'} · ${fmtShort(total)} focused</p>
        </div>
        <button class="pill amber" data-action="tab" data-tab="shop" aria-label="Coins — open tree shop">${ICON.coin}${state.coins}</button>
      </div>
      ${trees.length
        ? `<div class="meadow" id="meadow" style="height:${Math.max(360, maxY + 150)}px">
            ${MEADOW_HILLS}
            ${items}
          </div>`
        : `<div class="empty">
            <div class="empty-art">${EMPTY_ART}</div>
            <h2>Your forest is waiting</h2>
            <p>Every focus session you finish plants a tree here. Stay with it and watch your meadow grow.</p>
            <button class="btn-primary" data-action="tab" data-tab="focus">Plant your first tree</button>
          </div>`
      }
      ${recentHTML}
      ${trees.length ? `<button class="fab" data-action="tab" data-tab="focus" aria-label="Plant another tree">+</button>` : ''}
    </section>`;
  }

  /* ---------------- render: shop ---------------- */
  function shopView() {
    const cards = speciesList().map((sp) => {
      const owned = state.unlocked.includes(sp.id);
      const selected = state.selected === sp.id;
      const can = state.coins >= sp.cost;
      return `<div class="shop-card ${owned ? 'owned' : 'locked'} ${selected ? 'selected' : ''}">
        ${selected ? '<span class="badge-selected">In use</span>' : ''}
        <div class="shop-art">${sp.svg}</div>
        <h3>${esc(sp.name)}</h3>
        <p class="blurb">${esc(sp.blurb || '')}</p>
        <div class="card-foot">
          <span class="price">${owned ? ICON.check + ' Owned' : ICON.coin + ' ' + sp.cost}</span>
          <button class="buy-btn ${owned ? 'owned' : ''}" data-action="${owned ? 'use-species' : 'buy-species'}" data-id="${sp.id}" ${!owned && !can ? 'disabled' : ''}>${owned ? (selected ? 'Selected' : 'Use') : 'Unlock'}</button>
        </div>
      </div>`;
    }).join('');

    return `<section class="screen shop-screen">
      <div class="head-row">
        <div>
          <h1>Tree shop</h1>
          <p>${state.unlocked.length} of ${speciesList().length} species unlocked</p>
        </div>
        <span class="pill amber">${ICON.coin}${state.coins}</span>
      </div>
      <div class="shop-note">${ICON.info}<div>Earn coins by finishing focus sessions — 1 coin per minute, plus bonuses for long sessions, first-of-day, and achievements.</div></div>
      <div class="shop-grid">${cards}</div>
      <div class="real-trees">
        <h3>${ICON.leaf} A note on real trees</h3>
        <p>The original <a href="https://www.forestapp.cc/" target="_blank" rel="noopener noreferrer">Forest app</a> funds real tree planting through Trees for the Future. This is an unofficial personal clone — your forest here stays virtual.</p>
      </div>
    </section>`;
  }

  /* ---------------- render: stats ---------------- */
  function statsView() {
    const trees = state.sessions.length;
    const mins = totalMinutes(state);
    const streak = currentStreak(state);
    const best = longestStreak(state);
    const days = last7(state);
    const maxDay = Math.max(1, ...days.map((d) => d.mins));
    const tags = topTags(state);

    const bars = days.map((d) => `<div class="col ${d.today ? 'today' : ''}">
      <div class="v">${d.mins ? d.mins : ''}</div>
      <div class="bar-wrap"><div class="bar" style="height:${Math.max(3, Math.round((d.mins / maxDay) * 100))}%"></div></div>
      <div class="d">${d.label}</div>
    </div>`).join('');

    const ach = ACHIEVEMENTS.map((a) => {
      const on = state.achievements.includes(a.id);
      return `<div class="ach ${on ? '' : 'locked'}">
        <div class="ico">${on ? a.icon : '🔒'}</div>
        <div><div class="nm">${esc(a.name)}</div><div class="ds">${esc(a.desc)}</div></div>
      </div>`;
    }).join('');

    const tagsHTML = tags.length
      ? `<div class="card">
          <h2>Where your focus goes</h2>
          <p class="card-sub">Total focused time by tag</p>
          <div class="tag-stat">${tags.map((t) => `<div class="tag-stat-row">
            <span class="tn">${esc(t.tag)}</span>
            <span class="tbar"><i style="width:${Math.max(4, Math.round((t.mins / tags[0].mins) * 100))}%"></i></span>
            <span class="tm">${fmtShort(t.mins)}</span>
          </div>`).join('')}</div>
        </div>`
      : `<div class="card">
          <h2>Where your focus goes</h2>
          <p class="card-sub">Add a tag before you plant a tree to see how your focus time splits up.</p>
        </div>`;

    const installRow = deferredPrompt
      ? `<div class="set-row">
          <div class="sth"><div class="st">Install app</div><div class="ss">Add Forest to your home screen</div></div>
          <button class="buy-btn" data-action="install">Install</button>
        </div>`
      : `<div class="set-row">
          <div class="sth"><div class="st">Install on iPhone</div><div class="ss">Safari → Share → “Add to Home Screen”</div></div>
          <span class="price">${ICON.download}</span>
        </div>`;

    return `<section class="screen stats-screen">
      <div class="page-head">
        <h1>Your progress</h1>
        <p>${streak > 0 ? `${streak}-day streak — keep it alive` : 'A small session today starts a streak'}</p>
      </div>

      <div class="stat-grid">
        <div class="stat-card"><div class="num">${trees}</div><div class="lbl">Trees grown</div></div>
        <div class="stat-card"><div class="num">${fmtShort(mins)}</div><div class="lbl">Total focus</div></div>
        <div class="stat-card"><div class="num">${streak}<small>d</small></div><div class="lbl">Current streak</div></div>
        <div class="stat-card"><div class="num">${best}<small>d</small></div><div class="lbl">Best streak</div></div>
      </div>

      <div class="card">
        <h2>Last 7 days</h2>
        <p class="card-sub">${mins ? fmtShort(mins) + ' of focus all time' : 'No focus time yet'}</p>
        <div class="chart">${bars}</div>
      </div>

      ${tagsHTML}

      <div class="card">
        <h2>Achievements</h2>
        <p class="card-sub">${state.achievements.length} of ${ACHIEVEMENTS.length} unlocked</p>
        <div class="ach-grid">${ach}</div>
      </div>

      <div class="card">
        <h2>Settings</h2>
        <div class="settings">
          <div class="set-row">
            <div class="sth"><div class="st">Strict mode</div><div class="ss">Leaving the app kills your tree instantly instead of a ${state.settings.grace}s grace period</div></div>
            <button class="switch ${state.settings.strict ? 'on' : ''}" role="switch" aria-checked="${state.settings.strict}" aria-label="Strict mode" data-action="toggle-strict"><i></i></button>
          </div>
          <div class="set-row">
            <div class="sth"><div class="st">Sound</div><div class="ss">A soft chime when a tree matures</div></div>
            <button class="switch ${state.settings.sound ? 'on' : ''}" role="switch" aria-checked="${state.settings.sound}" aria-label="Sound" data-action="toggle-sound"><i></i></button>
          </div>
          ${installRow}
          <div class="set-row">
            <div class="sth"><div class="st">Withered trees</div><div class="ss">${state.withered} session${state.withered === 1 ? '' : 's'} abandoned</div></div>
            <span class="price">${state.withered}</span>
          </div>
          <div class="set-row">
            <div class="sth"><div class="st">Backup</div><div class="ss">Download your forest data as JSON</div></div>
            <button class="link-btn" data-action="export">Export</button>
          </div>
          <div class="set-row">
            <div class="sth"><div class="st">Start over</div><div class="ss">Delete all trees, coins, and settings</div></div>
            <button class="link-btn danger" data-action="reset-open">Reset</button>
          </div>
        </div>
      </div>

      <p class="about">
        <strong>Forest ${APP_VERSION}</strong> — an unofficial, personal-use focus app inspired by
        <a href="https://www.forestapp.cc/" target="_blank" rel="noopener noreferrer">Forest</a> by Seekrtech.
        Not affiliated with or endorsed by Seekrtech. All tree artwork is original.
        Your data lives only on this device.
      </p>
    </section>`;
  }

  /* ---------------- render: overlays ---------------- */
  function resultHTML(r) {
    const s = r.session;
    const sp = getSpecies(s.species);
    const done = r.type === 'done';
    const ach = done && r.achievements && r.achievements.length
      ? `<div class="result-ach">${r.achievements.map((a) => `<span>${a.icon} ${esc(a.name)} unlocked</span>`).join('')}</div>`
      : '';
    return `<div class="result-screen ${done ? '' : 'dead'}">
      <div class="result-card">
        <div class="result-eyebrow">${done ? 'Tree matured' : 'Tree withered'}</div>
        <div class="result-art">${sp ? sp.svg : ''}</div>
        <h2>${done ? 'Beautiful focus.' : 'Your tree is gone.'}</h2>
        <p class="result-sub">${done
          ? `${sp ? esc(sp.name) : 'Your tree'} grew for ${fmtShort(s.minutes)}${s.tag ? ' · ' + esc(s.tag) : ''}. It is part of your forest now.`
          : esc(r.reason || 'You left before your tree could grow.')}</p>
        ${done ? `<div class="reward">${ICON.coin} +${r.coins} ${r.coins === 1 ? 'coin' : 'coins'}</div>` : ''}
        ${ach}
        <div class="result-actions">
          <button class="btn-wide" data-action="${done ? 'result-another' : 'result-retry'}">${done ? 'Plant another tree' : 'Try again'}</button>
          <button class="btn-quiet" data-action="result-forest">See your forest</button>
        </div>
      </div>
    </div>`;
  }

  function sheetHTML(sheet) {
    if (sheet.type === 'abandon') {
      return `<div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-handle"></div>
        <h2>Give up on this tree?</h2>
        <p class="sheet-sub">It will wither and you will not earn any coins. Your focus only counts if you stay until the timer ends.</p>
        <div class="sheet-actions">
          <button class="btn-ghost" data-action="close-sheet">Keep focusing</button>
          <button class="btn-danger" data-action="abandon-confirm">Let it wither</button>
        </div>
      </div>`;
    }
    if (sheet.type === 'reset') {
      return `<div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-handle"></div>
        <h2>Start over?</h2>
        <p class="sheet-sub">This deletes every tree, all coins, achievements, and settings on this device. It cannot be undone.</p>
        <div class="sheet-actions">
          <button class="btn-ghost" data-action="close-sheet">Cancel</button>
          <button class="btn-danger" data-action="reset-confirm">Delete everything</button>
        </div>
      </div>`;
    }
    if (sheet.type === 'custom') {
      return `<div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-handle"></div>
        <h2>Custom focus length</h2>
        <p class="sheet-sub">Anywhere from 1 to 180 minutes. Long sessions earn bonus coins.</p>
        <div class="custom-wrap">
          <input id="custom-input" type="number" min="1" max="180" step="1" value="${ui.custom ? ui.duration : 30}" inputmode="numeric" aria-label="Custom minutes">
          <div class="cw-label"><strong>minutes</strong>How long will you focus?</div>
        </div>
        <div class="sheet-actions">
          <button class="btn-ghost" data-action="close-sheet">Cancel</button>
          <button class="btn-primary" data-action="custom-save">Set length</button>
        </div>
      </div>`;
    }
    if (sheet.type === 'tree') {
      const s = state.sessions.find((x) => x.id === sheet.id);
      if (!s) return '';
      const sp = getSpecies(s.species);
      return `<div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-handle"></div>
        <div class="sheet-detail-head">
          <div class="sheet-detail-art">${sp ? sp.svg : ''}</div>
          <div class="sheet-detail-meta">
            <div class="sdm-name">${esc(sp ? sp.name : 'Tree')}</div>
            <div class="sdm-line">${esc(fullDate(s.endedAt))}</div>
            ${s.tag ? `<span class="sdm-tag">${esc(s.tag)}</span>` : ''}
          </div>
        </div>
        <div class="sheet-stat-row">
          <div class="sheet-stat"><div class="n">${fmtShort(s.minutes)}</div><div class="l">Focused</div></div>
          <div class="sheet-stat"><div class="n">${s.coins || Math.max(1, Math.round(s.minutes))}</div><div class="l">Coins</div></div>
          <div class="sheet-stat"><div class="n">${s.strict ? 'Yes' : 'No'}</div><div class="l">Strict</div></div>
        </div>
        <div class="sheet-actions">
          <button class="btn-primary" data-action="close-sheet">Close</button>
        </div>
      </div>`;
    }
    return '';
  }

  function renderLayers() {
    const root = el('#layers');
    if (ui.result || ui.sheet) clearToasts();
    let html = '';
    if (ui.result) html += resultHTML(ui.result);
    if (ui.sheet) html += `<div class="layer"><div class="sheet-backdrop" data-action="dismiss-sheet">${sheetHTML(ui.sheet)}</div></div>`;
    root.innerHTML = html;

    if (ui.result && ui.result.type === 'done') spawnConfetti();
    if (ui.sheet && ui.sheet.type === 'custom') {
      requestAnimationFrame(() => {
        const input = el('#custom-input');
        if (input) { input.focus(); input.select(); }
      });
    }
  }

  function spawnConfetti() {
    const screen = el('.result-screen');
    if (!screen) return;
    const colors = ['#8DBF8B', '#C7DFB0', '#E7A33C', '#F2C6CF', '#5B946F'];
    for (let i = 0; i < 22; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = `${1.9 + Math.random() * 1.7}s`;
      piece.style.animationDelay = `${Math.random() * 0.55}s`;
      screen.appendChild(piece);
    }
  }

  /* ---------------- live updates ---------------- */
  function updateLive() {
    const s = state.active;
    const clock = el('#clock');
    const slot = el('#tree-slot');
    const bar = el('#scene-progress');
    const label = el('#clock-label');
    if (!clock && !slot) return;

    if (s) {
      const now = Date.now();
      const remain = Math.max(0, (s.endsAt - now) / 1000);
      const p = clamp((now - s.startedAt) / (s.endsAt - s.startedAt), 0, 1);
      if (clock) clock.textContent = fmtClock(remain);
      if (bar) bar.style.width = `${(p * 100).toFixed(1)}%`;
      if (label) label.textContent = s.strict ? 'Strict focus' : 'Growing';
      if (slot) {
        const stage = p < 0.12 ? 'sprout' : 'tree';
        if (slot.dataset.stage !== stage) slot.dataset.stage = stage;
        if (stage === 'tree') {
          const t = el('.tree-scale', slot);
          if (t) t.style.setProperty('--tscale', (0.3 + 0.7 * easeOut((p - 0.12) / 0.88)).toFixed(3));
        }
      }
    } else {
      if (clock) clock.textContent = fmtClock(ui.duration * 60);
      if (bar) bar.style.width = '0%';
      if (label) label.textContent = 'Ready to focus';
      if (slot && slot.dataset.stage !== 'tree') slot.dataset.stage = 'tree';
    }
  }

  /* ---------------- render ---------------- */
  function render() {
    const view = el('#view');
    if (!view) return;
    let html = '';
    if (ui.tab === 'forest') html = forestView();
    else if (ui.tab === 'shop') html = shopView();
    else if (ui.tab === 'stats') html = statsView();
    else html = focusView();
    view.innerHTML = html;

    document.querySelectorAll('.tab').forEach((t) => {
      const on = t.dataset.tab === ui.tab;
      t.classList.toggle('active', on);
      if (on) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });

    renderLayers();
    updateLive();
  }

  function scrollForestBottom() {
    requestAnimationFrame(() => {
      const view = el('#view');
      if (view) view.scrollTop = view.scrollHeight;
    });
  }

  /* ---------------- toasts ---------------- */
  function toast(message, kind = '') {
    const root = el('#toast-root');
    if (!root) return;
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    t.textContent = message;
    root.innerHTML = '';
    root.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(-6px)';
      t.style.transition = 'opacity .3s ease, transform .3s ease';
      setTimeout(() => t.remove(), 320);
    }, 2500);
  }

  function clearToasts() {
    const root = el('#toast-root');
    if (root) root.innerHTML = '';
    clearTimeout(toastTimer);
  }

  /* ---------------- actions ---------------- */
  function selectSpecies(id) {
    if (!state.unlocked.includes(id)) return;
    state.selected = id;
    save();
  }

  function buySpecies(id) {
    const sp = getSpecies(id);
    if (!sp) return;
    if (state.unlocked.includes(id)) {
      selectSpecies(id);
      ui.tab = 'focus';
      render();
      return;
    }
    if (state.coins < sp.cost) {
      toast(`Need ${sp.cost - state.coins} more coins — keep focusing.`, 'warn');
      return;
    }
    state.coins -= sp.cost;
    state.unlocked.push(id);
    state.selected = id;
    const newly = checkAchievements(null);
    save();
    playPop();
    render();
    toast(`${sp.name} unlocked${newly.length ? ' · ' + newly[0].name + ' achievement!' : ''}`, 'good');
  }

  function exportData() {
    const data = { app: 'Forest personal PWA', version: APP_VERSION, exportedAt: new Date().toISOString(), state };
    delete data.state._resumed;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forest-backup-${dayKey(Date.now())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2500);
    toast('Backup downloaded.');
  }

  function resetAll() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    state = freshState();
    resumedDeath = false;
    ui.tag = '';
    ui.sheet = null;
    ui.result = null;
    ui.tab = 'focus';
    ui.duration = 25;
    ui.custom = false;
    ui.hiddenAt = null;
    stopTicker();
    releaseWakeLock();
    save();
    render();
    toast('Forest reset. A fresh start.');
  }

  function handleAction(action, btn, event) {
    switch (action) {
      case 'tab': {
        if (state.active && btn.dataset.tab !== 'focus') {
          toast('Your tree needs you. Finish or give up first.', 'warn');
          return;
        }
        ui.tab = btn.dataset.tab || 'focus';
        ui.sheet = null;
        render();
        const view = el('#view');
        if (view) view.scrollTop = 0;
        if (ui.tab === 'forest') scrollForestBottom();
        break;
      }
      case 'select-species': {
        selectSpecies(btn.dataset.id);
        render();
        break;
      }
      case 'use-species': {
        selectSpecies(btn.dataset.id);
        ui.tab = 'focus';
        render();
        toast(`${getSpecies(btn.dataset.id)?.name || 'Tree'} selected.`, 'good');
        break;
      }
      case 'buy-species': {
        buySpecies(btn.dataset.id);
        break;
      }
      case 'set-duration': {
        ui.duration = clamp(parseInt(btn.dataset.min, 10) || 25, 1, 180);
        ui.custom = false;
        render();
        break;
      }
      case 'custom-duration': {
        ui.sheet = { type: 'custom' };
        renderLayers();
        break;
      }
      case 'custom-save': {
        const input = el('#custom-input');
        const val = clamp(parseInt(input ? input.value : ui.duration, 10) || 30, 1, 180);
        ui.duration = val;
        ui.custom = true;
        ui.sheet = null;
        render();
        toast(`Focus length set to ${val} minute${val === 1 ? '' : 's'}.`, 'good');
        break;
      }
      case 'plant': {
        startSession();
        break;
      }
      case 'abandon': {
        ui.sheet = { type: 'abandon' };
        renderLayers();
        break;
      }
      case 'abandon-confirm': {
        ui.sheet = null;
        wither('You gave up on this tree. It withered, and no coins were earned.');
        break;
      }
      case 'tree': {
        ui.sheet = { type: 'tree', id: btn.dataset.id };
        renderLayers();
        break;
      }
      case 'close-sheet': {
        ui.sheet = null;
        renderLayers();
        break;
      }
      case 'dismiss-sheet': {
        if (event.target.classList.contains('sheet-backdrop')) {
          ui.sheet = null;
          renderLayers();
        }
        break;
      }
      case 'result-another':
      case 'result-retry': {
        ui.result = null;
        ui.tab = 'focus';
        render();
        break;
      }
      case 'result-forest': {
        ui.result = null;
        ui.tab = 'forest';
        render();
        scrollForestBottom();
        break;
      }
      case 'toggle-strict': {
        state.settings.strict = !state.settings.strict;
        if (state.active) state.active.strict = state.settings.strict;
        save();
        render();
        toast(state.settings.strict ? 'Strict mode on — leaving ends the session.' : 'Strict mode off — 10 second grace.', state.settings.strict ? 'warn' : '');
        break;
      }
      case 'toggle-sound': {
        state.settings.sound = !state.settings.sound;
        save();
        if (state.settings.sound) playPop();
        render();
        toast(state.settings.sound ? 'Sound on.' : 'Sound off.');
        break;
      }
      case 'install': {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.finally(() => {
            deferredPrompt = null;
            render();
          });
        }
        break;
      }
      case 'export': {
        exportData();
        break;
      }
      case 'reset-open': {
        ui.sheet = { type: 'reset' };
        renderLayers();
        break;
      }
      case 'reset-confirm': {
        resetAll();
        break;
      }
      default:
        break;
    }
  }

  /* ---------------- events ---------------- */
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-action]');
    if (!btn) return;
    handleAction(btn.dataset.action, btn, event);
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (target && target.id === 'tag-input') {
      ui.tag = target.value.slice(0, 24);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && ui.sheet) {
      ui.sheet = null;
      renderLayers();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state.active) ui.hiddenAt = Date.now();
      return;
    }
    if (!state.active) { ui.hiddenAt = null; return; }
    const away = ui.hiddenAt ? Date.now() - ui.hiddenAt : 0;
    ui.hiddenAt = null;
    const s = state.active;

    if (s.strict && away > 700) {
      wither('Strict mode: leaving the app ends the session instantly.');
      return;
    }
    if (away > state.settings.grace * 1000) {
      wither(`You were away for ${Math.round(away / 1000)} seconds. Your tree could not survive.`);
      return;
    }
    if (Date.now() >= s.endsAt) {
      completeSession();
      return;
    }
    if (away > 1500) toast('Welcome back — your tree held on.', 'good');
    requestWakeLock();
  });

  window.addEventListener('pagehide', () => { if (state.active) save(); });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
  });

  /* ---------------- boot ---------------- */
  if (resumedDeath) {
    const s = state._resumed;
    ui.result = {
      type: 'dead',
      session: s,
      reason: 'The app closed while your tree was growing. Focus sessions only count while Forest stays open.'
    };
    delete state._resumed;
  }

  render();
  if (state.active) startTicker();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Optional debug hook for QA: open the app with ?debug
  if (new URLSearchParams(location.search).has('debug')) {
    window.__forest = {
      get state() { return state; },
      complete: completeSession,
      wither,
      render,
      ui
    };
  }
})();
