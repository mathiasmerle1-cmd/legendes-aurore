/* ============================================================
   LES LÉGENDES D'AURORE — utilitaires
   ============================================================ */
(function () {
  'use strict';

  const U = {};

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
  U.smooth = (t) => t * t * (3 - 2 * t);
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  U.dist2 = (x1, y1, x2, y2) => (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  U.angleDiff = (a, b) => {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  };
  U.pointSegDist = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (!l2) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = U.clamp(t, 0, 1);
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  };
  U.rectsOverlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  U.pointInRect = (px, py, r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  U.pointInCircle = (px, py, cx, cy, r) => U.dist2(px, py, cx, cy) <= r * r;

  U.mulberry32 = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  U.hashString = function (str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  U.hash2 = function (x, y, seed) {
    let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (seed | 0) * 1442695041;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  };

  U.hash3 = function (x, y, z, seed) {
    return U.hash2(x + (z | 0) * 7919, y - (z | 0) * 104729, seed + 7331);
  };

  U.vnoise = function (x, y, seed) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = U.smooth(x - x0), fy = U.smooth(y - y0);
    const a = U.hash2(x0, y0, seed);
    const b = U.hash2(x0 + 1, y0, seed);
    const c = U.hash2(x0, y0 + 1, seed);
    const d = U.hash2(x0 + 1, y0 + 1, seed);
    return U.lerp(U.lerp(a, b, fx), U.lerp(c, d, fx), fy);
  };

  U.fbm = function (x, y, seed, octaves, lac, gain) {
    octaves = octaves || 3; lac = lac || 2; gain = gain || 0.5;
    let f = 1, amp = 0.5, sum = 0, norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += U.vnoise(x * f, y * f, seed + i * 101) * amp;
      norm += amp; f *= lac; amp *= gain;
    }
    return sum / norm;
  };

  U.rand = (rng, a, b) => a + rng() * (b - a);
  U.randInt = (rng, a, b) => Math.floor(a + rng() * (b - a + 1));
  U.pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  U.chance = (rng, p) => rng() < p;
  U.shuffle = function (rng, arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  U.hexRgb = function (hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  };
  U.rgbHex = (r, g, b) => '#' + [r, g, b].map(v => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  U.shade = function (hex, amt) {
    const c = U.hexRgb(hex);
    return U.rgbHex(c[0] + amt, c[1] + amt, c[2] + amt);
  };
  U.mix = function (a, b, t) {
    const ca = U.hexRgb(a), cb = U.hexRgb(b);
    return U.rgbHex(U.lerp(ca[0], cb[0], t), U.lerp(ca[1], cb[1], t), U.lerp(ca[2], cb[2], t));
  };
  U.rgba = function (hex, alpha) {
    const c = U.hexRgb(hex);
    return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
  };

  U.makeCanvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return c;
  };

  U.formatTime = function (seconds) {
    seconds = Math.max(0, Math.floor(seconds));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return (h > 0 ? h + 'h ' : '') + String(m).padStart(h > 0 ? 2 : 1, '0') + 'min ' + String(s).padStart(2, '0') + 's';
  };

  U.roman = function (n) {
    const vals = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let out = '';
    for (const [v, s] of vals) while (n >= v) { out += s; n -= v; }
    return out || '0';
  };

  U.storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) {}
    }
  };

  U.el = function (tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  /* ------------------------------------------------------------
     Input clavier / souris
     ------------------------------------------------------------ */
  class Input {
    constructor() {
      this.down = new Set();
      this.pressed = new Set();
      this.mouse = { x: 0, y: 0, down: false, clicked: false, inside: false };
      this.enabled = true;
      this._bind();
    }

    _isEditable(target) {
      if (!target) return false;
      const tag = (target.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
    }

    _bind() {
      window.addEventListener('keydown', (e) => {
        if (this._isEditable(e.target)) return;
        const blocked = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'F5'];
        if (blocked.includes(e.code)) e.preventDefault();
        if (!this.down.has(e.code) && !e.repeat) this.pressed.add(e.code);
        this.down.add(e.code);
        if (window.Game && window.Game.onAnyInput) window.Game.onAnyInput();
      }, { passive: false });

      window.addEventListener('keyup', (e) => {
        this.down.delete(e.code);
      });

      window.addEventListener('blur', () => {
        this.down.clear();
        this.mouse.down = false;
      });

      const move = (e) => {
        const canvas = document.getElementById('game');
        if (!canvas) return;
        const r = canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - r.left;
        this.mouse.y = e.clientY - r.top;
        this.mouse.inside = this.mouse.x >= 0 && this.mouse.y >= 0 && this.mouse.x <= r.width && this.mouse.y <= r.height;
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerdown', (e) => {
        move(e);
        this.mouse.down = true;
        this.mouse.clicked = true;
        if (e.button === 0) this.pressed.add('Mouse0');
        if (window.Game && window.Game.onAnyInput) window.Game.onAnyInput();
      });
      window.addEventListener('pointerup', () => { this.mouse.down = false; });
      window.addEventListener('contextmenu', (e) => {
        if (this.mouse.inside) e.preventDefault();
      });
    }

    isDown(...codes) { return codes.some(c => this.down.has(c)); }
    wasPressed(...codes) { return codes.some(c => this.pressed.has(c)); }
    consume(...codes) { codes.forEach(c => this.pressed.delete(c)); }
    endFrame() { this.pressed.clear(); this.mouse.clicked = false; }
    clear() { this.pressed.clear(); }
    axis() {
      let x = 0, y = 0;
      if (this.isDown('ArrowLeft', 'KeyA', 'KeyQ')) x -= 1;
      if (this.isDown('ArrowRight', 'KeyD')) x += 1;
      if (this.isDown('ArrowUp', 'KeyW', 'KeyZ')) y -= 1;
      if (this.isDown('ArrowDown', 'KeyS')) y += 1;
      if (x && y) { const k = Math.SQRT1_2; x *= k; y *= k; }
      return { x, y };
    }
  }
  U.Input = Input;

  U.degToRad = (d) => d * Math.PI / 180;

  window.U = U;
})();
