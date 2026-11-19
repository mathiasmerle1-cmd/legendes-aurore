/* ============================================================
   LES LÉGENDES D'AURORE — sprites pixel procéduraux
   Personnages, créatures, icônes, police bitmap
   ============================================================ */
(function () {
  'use strict';
  const U = window.U, D = window.DATA;
  const Art = {};
  const cache = new Map();

  function cvs(w, h) { return U.makeCanvas(w, h); }
  function R(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function E(ctx, cx, cy, rx, ry, c) {
    ctx.fillStyle = c;
    cx = Math.round(cx); cy = Math.round(cy); rx = Math.max(1, Math.round(rx)); ry = Math.max(1, Math.round(ry));
    for (let y = -ry; y <= ry; y++) {
      const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.0001))));
      ctx.fillRect(cx - span, cy + y, span * 2 + 1, 1);
    }
  }
  function line(ctx, x1, y1, x2, y2, c, thick) {
    x1 = Math.round(x1); y1 = Math.round(y1); x2 = Math.round(x2); y2 = Math.round(y2);
    const dx = Math.abs(x2 - x1), sx = x1 < x2 ? 1 : -1;
    const dy = -Math.abs(y2 - y1), sy = y1 < y2 ? 1 : -1;
    let err = dx + dy;
    ctx.fillStyle = c; thick = thick || 1;
    while (true) {
      ctx.fillRect(x1, y1, thick, thick);
      if (x1 === x2 && y1 === y2) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x1 += sx; }
      if (e2 <= dx) { err += dx; y1 += sy; }
    }
  }

  function outline(src, color) {
    color = color || '#241c2b';
    const w = src.width, h = src.height;
    const data = src.getContext('2d').getImageData(0, 0, w, h).data;
    const out = cvs(w + 2, h + 2);
    const octx = out.getContext('2d');
    octx.fillStyle = color;
    const alphaAt = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : data[(y * w + x) * 4 + 3];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (alphaAt(x, y) > 0) {
          if (alphaAt(x - 1, y) === 0 || alphaAt(x + 1, y) === 0 || alphaAt(x, y - 1) === 0 || alphaAt(x, y + 1) === 0) {
            octx.fillRect(x + 1, y + 1, 1, 1);
            // coins pour arrondir
            if (alphaAt(x - 1, y - 1) === 0) octx.fillRect(x, y, 1, 1);
            if (alphaAt(x + 1, y - 1) === 0) octx.fillRect(x + 2, y, 1, 1);
            if (alphaAt(x - 1, y + 1) === 0) octx.fillRect(x, y + 2, 1, 1);
            if (alphaAt(x + 1, y + 1) === 0) octx.fillRect(x + 2, y + 2, 1, 1);
          }
        }
      }
    }
    octx.drawImage(src, 1, 1);
    return out;
  }
  Art.outline = outline;

  function finish(src, color, doOutline) {
    if (doOutline === false) return outline(src, 'rgba(0,0,0,0)');
    return outline(src, color);
  }
  Art.cvs = cvs;
  Art.R = R;
  Art.E = E;
  Art.line = line;

  /* Lumière de contour : un liseré chaud sur les pixels exposés en haut à
     gauche de chaque sprite. Cela donne du relief aux personnages sans
     ajouter une seule image externe. */
  function rimLight(src) {
    const w = src.width, h = src.height;
    const ctx = src.getContext('2d');
    const image = ctx.getImageData(0, 0, w, h);
    const px = image.data;
    const isOutline = (i) => px[i] === 36 && px[i + 1] === 28 && px[i + 2] === 43 && px[i + 3] > 0;
    const isOpaque = (i) => i >= 0 && px[i + 3] > 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (px[i + 3] === 0 || isOutline(i)) continue;
        const top = y > 0 ? ((y - 1) * w + x) * 4 : -1;
        const left = x > 0 ? (y * w + x - 1) * 4 : -1;
        const topEdge = !isOpaque(top) || isOutline(top);
        const leftEdge = !isOpaque(left) || isOutline(left);
        if (!topEdge && !leftEdge) continue;
        const t = topEdge ? 0.26 : 0.1;
        px[i] = Math.round(px[i] + (255 - px[i]) * t);
        px[i + 1] = Math.round(px[i + 1] + (238 - px[i + 1]) * t);
        px[i + 2] = Math.round(px[i + 2] + (196 - px[i + 2]) * t);
      }
    }
    ctx.putImageData(image, 0, 0);
    return src;
  }
  Art.rimLight = rimLight;

  /* Ombre portée pixel art, réutilisée par tous les personnages. */
  let shadowSprite = null;
  function getShadowSprite() {
    if (shadowSprite) return shadowSprite;
    const c = cvs(44, 20), ctx = c.getContext('2d');
    E(ctx, 22, 10, 20, 7, 'rgba(20,15,25,0.18)');
    E(ctx, 22, 10, 16, 5, 'rgba(20,15,25,0.24)');
    E(ctx, 22, 10, 11, 3, 'rgba(20,15,25,0.26)');
    shadowSprite = c;
    return c;
  }
  Art.drawShadow = function (ctx, x, y, w, h, alpha) {
    const img = getShadowSprite();
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 0.9 : alpha;
    ctx.drawImage(img, Math.round(x - w / 2), Math.round(y - h / 2), Math.max(2, Math.round(w)), Math.max(2, Math.round(h)));
    ctx.restore();
  };

  function mirror(src) {
    const c = cvs(src.width, src.height);
    const ctx = c.getContext('2d');
    ctx.translate(src.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
    return c;
  }
  Art.mirror = mirror;

  function cached(key, build) {
    if (cache.has(key)) return cache.get(key);
    const v = build();
    cache.set(key, v);
    return v;
  }
  Art.cached = cached;
  Art.clearCache = () => cache.clear();

  /* ------------------------------------------------------------
     Police bitmap 5×7
     ------------------------------------------------------------ */
  const FONT = {
    A: [0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
    B: [0x1E, 0x11, 0x11, 0x1E, 0x11, 0x11, 0x1E],
    C: [0x0E, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0E],
    D: [0x1E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1E],
    E: [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x1F],
    F: [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x10],
    G: [0x0E, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0F],
    H: [0x11, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
    I: [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E],
    J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0C],
    K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
    L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1F],
    M: [0x11, 0x1B, 0x15, 0x15, 0x11, 0x11, 0x11],
    N: [0x11, 0x19, 0x19, 0x15, 0x13, 0x13, 0x11],
    O: [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
    P: [0x1E, 0x11, 0x11, 0x1E, 0x10, 0x10, 0x10],
    Q: [0x0E, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0D],
    R: [0x1E, 0x11, 0x11, 0x1E, 0x14, 0x12, 0x11],
    S: [0x0F, 0x10, 0x10, 0x0E, 0x01, 0x01, 0x1E],
    T: [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
    U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
    V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0A, 0x04],
    W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1B, 0x11],
    X: [0x11, 0x11, 0x0A, 0x04, 0x0A, 0x11, 0x11],
    Y: [0x11, 0x11, 0x0A, 0x04, 0x04, 0x04, 0x04],
    Z: [0x1F, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1F],
    0: [0x0E, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0E],
    1: [0x04, 0x0C, 0x04, 0x04, 0x04, 0x04, 0x0E],
    2: [0x0E, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1F],
    3: [0x1E, 0x01, 0x01, 0x0E, 0x01, 0x01, 0x1E],
    4: [0x02, 0x06, 0x0A, 0x12, 0x1F, 0x02, 0x02],
    5: [0x1F, 0x10, 0x1E, 0x01, 0x01, 0x11, 0x0E],
    6: [0x06, 0x08, 0x10, 0x1E, 0x11, 0x11, 0x0E],
    7: [0x1F, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
    8: [0x0E, 0x11, 0x11, 0x0E, 0x11, 0x11, 0x0E],
    9: [0x0E, 0x11, 0x11, 0x0F, 0x01, 0x02, 0x0C],
    ' ': [0, 0, 0, 0, 0, 0, 0],
    '.': [0, 0, 0, 0, 0, 0x06, 0x06],
    ',': [0, 0, 0, 0, 0, 0x06, 0x04],
    ':': [0, 0x06, 0x06, 0, 0x06, 0x06, 0],
    '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
    '?': [0x0E, 0x11, 0x01, 0x02, 0x04, 0, 0x04],
    "'": [0x04, 0x04, 0, 0, 0, 0, 0],
    '-': [0, 0, 0, 0x1F, 0, 0, 0],
    '+': [0, 0x04, 0x04, 0x1F, 0x04, 0x04, 0],
    '/': [0x01, 0x02, 0x02, 0x04, 0x08, 0x08, 0x10],
    '(': [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
    ')': [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
    '%': [0x18, 0x19, 0x02, 0x04, 0x08, 0x13, 0x03],
    '×': [0, 0, 0x0A, 0x04, 0x0A, 0, 0],
    '>': [0x08, 0x04, 0x02, 0x01, 0x02, 0x04, 0x08],
    '<': [0x02, 0x04, 0x08, 0x10, 0x08, 0x04, 0x02],
    '=': [0, 0, 0x1F, 0, 0x1F, 0, 0],
    '_': [0, 0, 0, 0, 0, 0, 0x1F]
  };
  const ACCENTS = { 'À': 'A', 'Â': 'A', 'Ä': 'A', 'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E', 'Î': 'I', 'Ï': 'I', 'Ô': 'O', 'Ö': 'O', 'Ù': 'U', 'Û': 'U', 'Ü': 'U', 'Ç': 'C', 'Œ': 'O', 'Æ': 'A', '’': "'", '«': '<', '»': '>', '·': '-', '–': '-', '—': '-', '…': '.', '≈': '=' };

  function normalizeText(str) {
    let out = '';
    for (const chRaw of String(str)) {
      let ch = chRaw.toUpperCase();
      if (ACCENTS[ch]) ch = ACCENTS[ch];
      if (!FONT[ch]) {
        // accents combinés / inconnus
        ch = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
        if (!FONT[ch]) ch = '?';
      }
      out += ch;
    }
    return out;
  }
  Art.normalizeText = normalizeText;
  Art.textWidth = function (text, scale) {
    const t = normalizeText(text);
    scale = scale || 1;
    return t.length * 6 * scale;
  };
  Art.drawText = function (ctx, text, x, y, color, scale, shadow, align) {
    const t = normalizeText(text);
    scale = scale || 1;
    const w = t.length * 6 * scale;
    let sx = x;
    if (align === 'center') sx = x - Math.floor(w / 2);
    if (align === 'right') sx = x - w;
    const draw = (ox, oy, col) => {
      for (let i = 0; i < t.length; i++) {
        const glyph = FONT[t[i]] || FONT['?'];
        for (let row = 0; row < 7; row++) {
          const bits = glyph[row];
          for (let cx = 0; cx < 5; cx++) {
            if (bits & (1 << (4 - cx))) {
              ctx.fillStyle = col;
              ctx.fillRect(sx + ox + (i * 6 + cx) * scale, y + oy + row * scale, scale, scale);
            }
          }
        }
      }
    };
    if (shadow !== false) draw(scale, scale, 'rgba(22,17,30,0.85)');
    draw(0, 0, color || '#fff6da');
    return w;
  };
  Art.textCanvas = function (text, color, scale, shadow) {
    scale = scale || 1;
    const w = Math.max(1, normalizeText(text).length * 6 * scale);
    const h = 8 * scale;
    const c = cvs(w, h);
    Art.drawText(c.getContext('2d'), text, 0, 0, color, scale, shadow, 'left');
    return c;
  };

  /* ------------------------------------------------------------
     Apparence des personnages
     ------------------------------------------------------------ */
  function resolveLook(look) {
    const skin = D.SKINS[look.skin] || D.SKINS[1];
    const hairDef = D.HAIRS[look.hair] || D.HAIRS[0];
    const hc = D.HAIR_COLORS[look.hairColor] || D.HAIR_COLORS[0];
    const ec = D.EYE_COLORS[look.eye] || D.EYE_COLORS[0];
    const sc = D.SHIRT_COLORS[look.shirt] || D.SHIRT_COLORS[0];
    const pc = D.PANTS_COLORS[look.pants] || D.PANTS_COLORS[0];
    const accessoryDef = D.ACCESSORIES[look.accessory] || D.ACCESSORIES[0];
    const ac = D.ACCESSORY_COLORS[look.accessoryColor] || D.ACCESSORY_COLORS[0];
    const auraDef = D.AURAS[look.aura] || D.AURAS[0];
    const buildIndex = typeof look.build === 'number'
      ? Math.max(0, Math.min((D.BUILDS || []).length - 1, look.build)) : 1;
    const buildDef = (D.BUILDS && D.BUILDS[buildIndex]) || { id: 'moyenne' };
    const beardDef = (D.BEARDS && D.BEARDS[look.beard]) || { id: 'none' };
    const marksDef = (D.MARKS && D.MARKS[look.marks]) || { id: 'none' };
    // Les PNJ historiques utilisent robe/apron/armor directement. Les héros
    // récents passent par un style de tenue unique et lisible dans l'éditeur.
    let robe = !!look.robe, apron = !!look.apron, armor = !!look.armor;
    if (typeof look.outfit === 'number' && D.OUTFITS) {
      const outfitDef = D.OUTFITS[look.outfit] || D.OUTFITS[0];
      robe = outfitDef.id === 'longue';
      apron = outfitDef.id === 'tablier';
      armor = outfitDef.id === 'cuirasse';
    }
    return {
      skin, hairStyle: hairDef.id, hair: hc.base, hairShade: hc.shade,
      shirt: sc.base, shirtShade: sc.shade, shirtLight: U.shade(sc.base, 22),
      pants: pc.base, pantsShade: pc.shade,
      robe, apron, armor,
      build: buildDef.id, buildIndex,
      beard: beardDef.id, marks: marksDef.id,
      eye: ec.base, eyeGlow: ec.glow,
      accessory: accessoryDef.id, acc: ac.base, accShade: ac.shade,
      aura: auraDef.color, auraId: auraDef.id,
      eyes: '#241c2c', shoes: '#3b2d2d', belt: '#5b4030', gold: '#e5b94e'
    };
  }
  Art.resolveLook = resolveLook;

  function drawAccessoryBehind(ctx, dir, p) {
    const A = p.accessory, C = p.acc, S = p.accShade;
    if (A === 'cape') {
      if (dir === 3) {
        R(ctx, 3, 15, 18, 15, S);
        R(ctx, 4, 16, 16, 13, C);
        R(ctx, 6, 17, 3, 11, U.shade(C, -14));
        R(ctx, 15, 17, 3, 11, U.shade(C, 12));
        R(ctx, 4, 28, 16, 2, U.shade(C, -24));
        R(ctx, 6, 16, 5, 1, U.shade(C, 26));
        R(ctx, 9, 20, 1, 7, U.shade(C, -10));
        R(ctx, 14, 21, 1, 6, U.shade(C, -10));
      } else if (dir === 2) {
        R(ctx, 2, 15, 8, 15, S);
        R(ctx, 3, 16, 6, 13, C);
        R(ctx, 3, 27, 6, 2, U.shade(C, -22));
        R(ctx, 5, 17, 2, 9, U.shade(C, 14));
        R(ctx, 3, 16, 4, 1, U.shade(C, 24));
      } else {
        R(ctx, 3, 15, 3, 13, S);
        R(ctx, 19, 15, 3, 13, S);
        R(ctx, 4, 16, 2, 11, C);
        R(ctx, 19, 16, 2, 11, C);
        R(ctx, 4, 26, 2, 2, U.shade(C, -22));
        R(ctx, 19, 26, 2, 2, U.shade(C, -22));
      }
    } else if (A === 'ailes') {
      for (let s = 0; s < 2; s++) {
        const x = s === 0 ? 2 : 17;
        const flip = s === 0 ? -1 : 1;
        R(ctx, x, 12, 4, 9, S);
        R(ctx, x - flip, 11, 4, 8, C);
        R(ctx, x - flip * 2, 9, 2, 6, U.shade(C, 18));
        R(ctx, x - flip * 2, 8, 1, 4, S);
        R(ctx, x + 2, 19, 2, 4, U.shade(C, -8));
        R(ctx, x + 2, 12, 1, 5, U.shade(C, 26));
        R(ctx, x - flip, 15, 3, 1, U.shade(C, -16));
      }
    } else if (A === 'capuche') {
      R(ctx, 4, 2, 17, 15, S);
      R(ctx, 5, 3, 15, 13, C);
      R(ctx, 7, 5, 11, 11, U.shade(S, -8));
      R(ctx, 5, 15, 15, 5, U.shade(C, -12));
      R(ctx, 4, 2, 16, 1, U.shade(C, 20));
      R(ctx, 6, 16, 13, 1, U.shade(C, -20));
    } else if (A === 'echarpe') {
      if (dir === 3) {
        R(ctx, 8, 14, 8, 2, S);
        R(ctx, 9, 15, 6, 1, C);
        R(ctx, 10, 16, 4, 11, S);
        R(ctx, 11, 17, 2, 9, C);
        R(ctx, 11, 25, 3, 1, U.shade(C, 20));
      } else if (dir === 2) {
        R(ctx, 5, 14, 5, 12, S);
        R(ctx, 6, 15, 3, 10, C);
        R(ctx, 6, 24, 3, 1, U.shade(C, 20));
      } else {
        R(ctx, 17, 14, 2, 10, S);
        R(ctx, 18, 15, 1, 8, C);
      }
    } else if (A === 'sacoche') {
      if (dir === 3) {
        R(ctx, 14, 18, 6, 8, S);
        R(ctx, 15, 19, 4, 6, C);
        R(ctx, 14, 17, 6, 2, S);
        R(ctx, 15, 17, 4, 1, U.shade(C, 18));
        R(ctx, 8, 17, 2, 1, S);
        R(ctx, 7, 18, 1, 6, S);
      } else if (dir === 2) {
        R(ctx, 3, 19, 6, 7, S);
        R(ctx, 4, 20, 4, 5, C);
        R(ctx, 3, 18, 6, 2, S);
        R(ctx, 4, 18, 4, 1, U.shade(C, 18));
      } else {
        R(ctx, 17, 20, 4, 6, S);
        R(ctx, 18, 21, 2, 4, C);
        R(ctx, 17, 19, 4, 2, S);
        R(ctx, 18, 19, 2, 1, U.shade(C, 18));
      }
    } else if (A === 'carquois') {
      if (dir === 2) {
        R(ctx, 2, 9, 6, 13, S);
        R(ctx, 3, 10, 4, 11, C);
        R(ctx, 3, 10, 4, 1, U.shade(C, -30));
        R(ctx, 2, 21, 6, 2, U.shade(C, -18));
        R(ctx, 5, 9, 2, 12, U.shade(C, 16));
        R(ctx, 3, 4, 1, 5, '#d9c9a3');
        R(ctx, 5, 5, 1, 4, '#d9c9a3');
        R(ctx, 3, 3, 1, 1, '#f4efe0');
        R(ctx, 2, 4, 1, 1, p.gold);
        R(ctx, 5, 4, 1, 1, '#f4efe0');
        R(ctx, 6, 5, 1, 1, p.gold);
        R(ctx, 2, 11, 1, 1, p.gold);
      } else if (dir === 0) {
        R(ctx, 16, 7, 4, 12, S);
        R(ctx, 17, 8, 2, 10, C);
        R(ctx, 16, 6, 4, 2, U.shade(C, 10));
        R(ctx, 17, 7, 2, 1, U.shade(C, -30));
        R(ctx, 17, 1, 1, 6, '#d9c9a3');
        R(ctx, 19, 0, 1, 7, '#d9c9a3');
        R(ctx, 17, 0, 1, 1, '#f4efe0');
        R(ctx, 16, 1, 1, 1, p.gold);
        R(ctx, 19, 0, 1, 1, '#f4efe0');
        R(ctx, 20, 1, 1, 1, p.gold);
        R(ctx, 16, 12, 4, 1, p.gold);
      }
    }
  }

  function drawAccessoryFront(ctx, dir, p) {
    const A = p.accessory, C = p.acc, S = p.accShade;
    if (!A || A === 'none') return;
    if (A === 'cape') {
      R(ctx, 9, 16, 6, 2, S);
      R(ctx, 10, 16, 4, 1, U.shade(C, 18));
      R(ctx, 11, 17, 2, 2, p.gold);
      R(ctx, 11, 18, 1, 1, U.shade(p.gold, 26));
      if (dir === 2) R(ctx, 15, 16, 2, 8, S);
    } else if (A === 'bandeau') {
      R(ctx, 6, 8, 13, 2, C);
      R(ctx, 7, 8, 10, 1, U.shade(C, 22));
      R(ctx, 18, 8, 2, 4, S);
      R(ctx, 19, 12, 1, 3, U.shade(C, -8));
      R(ctx, 9, 9, 1, 1, U.shade(C, -10));
      R(ctx, 15, 9, 1, 1, U.shade(C, -10));
    } else if (A === 'chapeau') {
      R(ctx, 3, 5, 18, 2, S);
      R(ctx, 4, 5, 16, 1, C);
      R(ctx, 7, 1, 11, 5, C);
      R(ctx, 8, 0, 9, 2, C);
      R(ctx, 7, 4, 11, 1, S);
      R(ctx, 8, 0, 5, 1, U.shade(C, 24));
      R(ctx, 16, 1, 2, 3, U.shade(C, 12));
      R(ctx, 9, 3, 6, 1, p.gold);
    } else if (A === 'capuche') {
      R(ctx, 5, 4, 3, 12, C);
      R(ctx, 17, 4, 3, 12, C);
      R(ctx, 6, 3, 12, 2, C);
      R(ctx, 7, 3, 10, 1, U.shade(C, 18));
      R(ctx, 5, 15, 3, 2, S);
      R(ctx, 17, 15, 3, 2, S);
      R(ctx, 8, 5, 1, 8, S);
      R(ctx, 16, 5, 1, 8, S);
    } else if (A === 'lunettes') {
      if (dir === 3) {
        R(ctx, 7, 9, 4, 1, S);
        R(ctx, 14, 9, 3, 1, S);
        R(ctx, 5, 9, 2, 2, S);
        R(ctx, 18, 9, 2, 2, S);
      } else if (dir === 0) {
        R(ctx, 7, 9, 4, 2, S);
        R(ctx, 8, 10, 2, 1, U.shade(C, -30));
        R(ctx, 13, 9, 4, 2, S);
        R(ctx, 13, 10, 2, 1, U.shade(C, -30));
        R(ctx, 11, 9, 2, 1, S);
        R(ctx, 5, 10, 2, 1, S);
        R(ctx, 17, 10, 2, 1, S);
      } else {
        R(ctx, 13, 9, 4, 3, S);
        R(ctx, 14, 10, 2, 1, U.shade(C, -30));
        R(ctx, 8, 10, 4, 1, S);
      }
    } else if (A === 'echarpe') {
      R(ctx, 7, 14, 10, 3, S);
      R(ctx, 8, 14, 8, 1, U.shade(C, 20));
      R(ctx, 9, 16, 6, 1, U.shade(C, -16));
      R(ctx, 7, 17, 3, 7, S);
      R(ctx, 8, 17, 1, 6, C);
      R(ctx, 17, 16, 2, 6, S);
      R(ctx, 8, 24, 3, 1, U.shade(C, 16));
    } else if (A === 'couronne') {
      R(ctx, 7, 2, 11, 2, C);
      R(ctx, 8, 2, 9, 1, U.shade(C, 22));
      R(ctx, 7, 0, 2, 3, C);
      R(ctx, 11, 0, 2, 3, C);
      R(ctx, 15, 0, 2, 3, C);
      R(ctx, 9, 1, 2, 1, C);
      R(ctx, 13, 1, 2, 1, C);
      R(ctx, 8, 1, 1, 1, '#fff2b0');
      R(ctx, 12, 0, 1, 1, '#fff2b0');
      R(ctx, 16, 1, 1, 1, '#fff2b0');
    } else if (A === 'masque') {
      if (dir === 3) {
        R(ctx, 7, 8, 10, 4, S);
        R(ctx, 8, 9, 8, 2, C);
      } else if (dir === 0) {
        R(ctx, 6, 9, 12, 3, S);
        R(ctx, 7, 9, 3, 2, U.shade(S, -18));
        R(ctx, 14, 9, 3, 2, U.shade(S, -18));
        R(ctx, 8, 10, 2, 1, C);
        R(ctx, 14, 10, 2, 1, C);
        R(ctx, 10, 10, 4, 1, C);
      } else {
        R(ctx, 12, 9, 7, 3, S);
        R(ctx, 13, 10, 3, 1, U.shade(S, -18));
        R(ctx, 8, 10, 4, 1, S);
      }
    } else if (A === 'halo') {
      R(ctx, 7, 0, 11, 1, U.shade(C, 30));
      R(ctx, 5, 1, 2, 1, C);
      R(ctx, 18, 1, 2, 1, C);
      R(ctx, 8, 1, 9, 1, U.shade(C, -12));
      R(ctx, 6, 2, 1, 1, S);
      R(ctx, 18, 2, 1, 1, S);
    } else if (A === 'beret') {
      R(ctx, 6, 2, 13, 2, C);
      R(ctx, 7, 1, 11, 1, C);
      R(ctx, 5, 3, 15, 1, S);
      R(ctx, 6, 4, 14, 1, U.shade(S, -8));
      R(ctx, 8, 2, 3, 1, U.shade(C, 24));
      R(ctx, 17, 1, 2, 2, U.shade(C, 14));
      R(ctx, 12, 0, 1, 1, S);
      if (dir === 2) R(ctx, 4, 2, 3, 2, S);
    } else if (A === 'plume') {
      R(ctx, 17, 0, 1, 7, U.shade(C, 38));
      R(ctx, 16, 0, 1, 2, C);
      R(ctx, 18, 1, 1, 2, C);
      R(ctx, 16, 3, 1, 2, S);
      R(ctx, 18, 3, 1, 1, C);
      R(ctx, 15, 5, 2, 1, C);
      R(ctx, 18, 5, 1, 2, S);
      R(ctx, 16, 7, 2, 2, p.gold);
      R(ctx, 17, 0, 1, 1, U.shade(C, 55));
    } else if (A === 'collier') {
      if (dir === 3) {
        R(ctx, 8, 15, 8, 1, S);
        R(ctx, 11, 16, 2, 2, C);
      } else if (dir === 0) {
        R(ctx, 8, 16, 1, 1, S);
        R(ctx, 9, 17, 6, 1, S);
        R(ctx, 15, 16, 1, 1, S);
        R(ctx, 11, 18, 2, 2, C);
        R(ctx, 12, 18, 1, 1, U.shade(C, 24));
      } else {
        R(ctx, 12, 16, 4, 1, S);
        R(ctx, 15, 17, 2, 2, C);
      }
    } else if (A === 'sacoche') {
      R(ctx, 17, 20, 4, 7, S);
      R(ctx, 18, 21, 2, 5, C);
      R(ctx, 17, 19, 4, 2, S);
      R(ctx, 18, 19, 2, 1, U.shade(C, 18));
      R(ctx, 18, 23, 1, 1, p.gold);
      if (dir === 3) {
        R(ctx, 8, 16, 1, 2, S);
        R(ctx, 9, 17, 1, 2, S);
        R(ctx, 10, 18, 1, 2, S);
        R(ctx, 11, 19, 1, 2, S);
        R(ctx, 12, 20, 1, 2, S);
        R(ctx, 13, 21, 1, 2, S);
        R(ctx, 11, 19, 1, 1, p.gold);
      } else if (dir === 2) {
        R(ctx, 14, 16, 1, 2, S);
        R(ctx, 13, 17, 1, 2, S);
        R(ctx, 12, 18, 1, 2, S);
        R(ctx, 11, 19, 1, 2, S);
        R(ctx, 10, 20, 1, 2, S);
        R(ctx, 9, 21, 1, 2, S);
        R(ctx, 8, 22, 1, 2, S);
        R(ctx, 11, 19, 1, 1, p.gold);
      } else {
        R(ctx, 8, 17, 1, 2, S);
        R(ctx, 9, 18, 1, 2, S);
        R(ctx, 10, 19, 1, 2, S);
        R(ctx, 11, 20, 1, 2, S);
        R(ctx, 12, 21, 1, 2, S);
        R(ctx, 13, 22, 1, 1, S);
        R(ctx, 14, 22, 2, 1, S);
        R(ctx, 10, 19, 1, 1, p.gold);
      }
    } else if (A === 'carquois') {
      if (dir === 3) {
        R(ctx, 13, 8, 6, 14, S);
        R(ctx, 14, 9, 4, 12, C);
        R(ctx, 13, 21, 6, 2, U.shade(C, -18));
        R(ctx, 17, 9, 2, 13, U.shade(C, 16));
        R(ctx, 14, 5, 1, 4, S);
        R(ctx, 16, 4, 1, 5, S);
        R(ctx, 18, 5, 1, 4, S);
        R(ctx, 14, 4, 1, 1, U.shade(C, 28));
        R(ctx, 16, 3, 1, 1, U.shade(C, 28));
        R(ctx, 18, 4, 1, 1, U.shade(C, 28));
        R(ctx, 13, 12, 6, 1, p.gold);
        R(ctx, 7, 16, 1, 2, S);
        R(ctx, 8, 18, 1, 2, S);
        R(ctx, 9, 20, 1, 2, S);
        R(ctx, 10, 22, 1, 2, S);
      } else if (dir === 2) {
        R(ctx, 15, 17, 1, 2, S);
        R(ctx, 15, 19, 1, 2, S);
        R(ctx, 14, 21, 1, 2, S);
        R(ctx, 15, 20, 1, 1, p.gold);
      } else {
        R(ctx, 15, 17, 1, 2, S);
        R(ctx, 14, 19, 1, 2, S);
        R(ctx, 13, 21, 1, 2, S);
        R(ctx, 12, 23, 1, 1, S);
        R(ctx, 14, 20, 1, 1, p.gold);
      }
    }
  }

  function drawHairBehind(ctx, dir, p, frame) {
    const S = p.hairStyle, H = p.hair, HS = p.hairShade, HL = U.shade(H, 24);
    const sway = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    if (S === 'long' || S === 'tresse') {
      if (dir === 3) {
        R(ctx, 5, 4, 14, 18, H);
        R(ctx, 6, 20, 12, 3, HS);
        R(ctx, 7, 6, 3, 13, HL);
        R(ctx, 12, 10, 1, 11, U.shade(H, -10));
        if (S === 'tresse') {
          R(ctx, 15, 16, 4, 10, H);
          R(ctx, 15, 24, 4, 2, HS);
          for (let i = 0; i < 3; i++) R(ctx, 15 + (i % 2), 18 + i * 2, 3, 2, i % 2 ? HS : H);
          R(ctx, 15, 25, 4, 1, p.gold);
        }
      } else if (dir === 2) {
        R(ctx, 4 + sway, 5, 6, 16, H);
        R(ctx, 5 + sway, 18, 4, 3, HS);
        R(ctx, 4 + sway, 7, 2, 9, HL);
        if (S === 'tresse') {
          R(ctx, 3 + sway, 15, 3, 11, H);
          for (let i = 0; i < 3; i++) R(ctx, 3 + sway + (i % 2), 17 + i * 2, 2, 2, i % 2 ? HS : H);
          R(ctx, 3 + sway, 25, 3, 1, p.gold);
        }
      } else {
        R(ctx, 4, 6, 3, 14, H);
        R(ctx, 17, 6, 3, 14, H);
        R(ctx, 5, 18, 2, 3, HS);
        R(ctx, 17, 18, 2, 3, HS);
        if (S === 'tresse') {
          R(ctx, 18, 14, 3, 12, H);
          for (let i = 0; i < 3; i++) R(ctx, 18 + (i % 2), 17 + i * 2, 2, 2, i % 2 ? HS : H);
          R(ctx, 18, 26, 3, 1, p.gold);
        }
      }
    } else if (S === 'queue') {
      if (dir === 3) {
        R(ctx, 10, 9, 4, 11, H);
        R(ctx, 11, 18, 2, 4, HS);
        R(ctx, 10, 12, 4, 2, p.gold);
        R(ctx, 11, 14, 1, 5, HL);
      } else if (dir === 2) {
        R(ctx, 3 + sway, 8, 4, 10, H);
        R(ctx, 4 + sway, 16, 2, 3, HS);
        R(ctx, 6 + sway, 9, 1, 7, HL);
      } else {
        R(ctx, 18, 9, 3, 9, H);
        R(ctx, 19, 16, 2, 3, HS);
        R(ctx, 18, 12, 3, 1, p.gold);
      }
    } else if (S === 'braids') {
      if (dir === 3) {
        R(ctx, 4, 8, 3, 16, H);
        R(ctx, 17, 8, 3, 16, H);
        for (let i = 0; i < 5; i++) {
          R(ctx, 4 + (i % 2), 10 + i * 3, 2, 2, i % 2 ? HS : H);
          R(ctx, 18 - (i % 2), 10 + i * 3, 2, 2, i % 2 ? H : HS);
        }
        R(ctx, 4, 22, 3, 1, p.gold);
        R(ctx, 17, 22, 3, 1, p.gold);
      } else if (dir === 2) {
        R(ctx, 3 + sway, 8, 3, 15, H);
        for (let i = 0; i < 5; i++) R(ctx, 3 + sway + (i % 2), 10 + i * 3, 2, 2, i % 2 ? HS : H);
        R(ctx, 3 + sway, 21, 3, 1, p.gold);
      } else {
        R(ctx, 3, 9, 3, 14, H);
        R(ctx, 18, 9, 3, 14, H);
        for (let i = 0; i < 4; i++) {
          R(ctx, 3 + (i % 2), 11 + i * 3, 2, 2, i % 2 ? HS : H);
          R(ctx, 19 - (i % 2), 11 + i * 3, 2, 2, i % 2 ? H : HS);
        }
        R(ctx, 3, 21, 3, 1, p.gold);
        R(ctx, 18, 21, 3, 1, p.gold);
      }
    } else if (S === 'afro') {
      if (dir === 3) {
        R(ctx, 4, 1, 16, 1, H);
        R(ctx, 3, 2, 18, 2, H);
        R(ctx, 2, 4, 20, 5, H);
        R(ctx, 3, 9, 18, 1, H);
        R(ctx, 4, 10, 16, 2, HS);
        for (let i = 0; i < 5; i++) R(ctx, 3 + i * 4, 0 + (i % 2), 2, 2, i % 2 ? HL : H);
        R(ctx, 4, 2, 3, 2, HL);
        R(ctx, 16, 4, 3, 2, U.shade(H, -12));
      } else if (dir === 2) {
        R(ctx, 2 + sway, 2, 8, 10, H);
        R(ctx, 2 + sway, 9, 8, 3, HS);
        R(ctx, 4 + sway, 1, 2, 2, HL);
        R(ctx, 3 + sway, 6, 2, 2, U.shade(H, -10));
      } else {
        R(ctx, 1, 3, 5, 8, H);
        R(ctx, 18, 3, 5, 8, H);
        R(ctx, 2, 9, 4, 2, HS);
        R(ctx, 18, 9, 4, 2, HS);
        R(ctx, 2, 3, 2, 2, HL);
        R(ctx, 20, 4, 2, 2, HL);
      }
    } else if (S === 'carre') {
      if (dir === 3) {
        R(ctx, 5, 3, 14, 1, H);
        R(ctx, 4, 4, 16, 10, H);
        R(ctx, 5, 14, 14, 2, HS);
        R(ctx, 7, 5, 4, 1, HL);
      } else if (dir === 2) {
        R(ctx, 4 + sway, 5, 7, 11, H);
        R(ctx, 5 + sway, 14, 6, 2, HS);
        R(ctx, 5 + sway, 6, 3, 1, HL);
      } else {
        R(ctx, 4, 5, 3, 11, H);
        R(ctx, 17, 5, 3, 11, H);
        R(ctx, 4, 14, 3, 2, HS);
        R(ctx, 17, 14, 3, 2, HS);
      }
    } else if (S === 'couettes') {
      if (dir === 3) {
        R(ctx, 2, 8, 2, 1, H);
        R(ctx, 1, 9, 4, 8, H);
        R(ctx, 2, 17, 2, 3, HS);
        R(ctx, 20, 8, 2, 1, H);
        R(ctx, 19, 9, 4, 8, H);
        R(ctx, 20, 17, 2, 3, HS);
        R(ctx, 1, 13, 4, 1, p.gold);
        R(ctx, 19, 13, 4, 1, p.gold);
      } else if (dir === 2) {
        R(ctx, 1 + sway, 8, 4, 12, H);
        R(ctx, 2 + sway, 18, 3, 3, HS);
        R(ctx, 1 + sway, 13, 4, 1, p.gold);
        R(ctx, 2 + sway, 9, 2, 3, HL);
      } else {
        R(ctx, 1, 9, 4, 11, H);
        R(ctx, 19, 9, 4, 11, H);
        R(ctx, 2, 18, 3, 2, HS);
        R(ctx, 19, 18, 3, 2, HS);
        R(ctx, 1, 13, 4, 1, p.gold);
        R(ctx, 19, 13, 4, 1, p.gold);
      }
    } else if (S === 'boucles') {
      if (dir === 3) {
        R(ctx, 3, 2, 18, 12, H);
        R(ctx, 4, 12, 16, 3, HS);
        for (let i = 0; i < 5; i++) R(ctx, 4 + i * 3, 1 + (i % 2) * 2, 2, 2, i % 2 ? HL : H);
        R(ctx, 2, 5, 3, 7, H);
        R(ctx, 19, 5, 3, 7, H);
      } else if (dir === 2) {
        R(ctx, 3 + sway, 4, 7, 10, H);
        R(ctx, 3 + sway, 11, 6, 3, HS);
        R(ctx, 2 + sway, 5, 3, 3, H);
        R(ctx, 5 + sway, 2, 2, 2, HL);
      } else {
        R(ctx, 2, 4, 4, 8, H);
        R(ctx, 18, 4, 4, 8, H);
        R(ctx, 2, 10, 4, 3, HS);
        R(ctx, 18, 10, 4, 3, HS);
        R(ctx, 3, 5, 2, 2, HL);
        R(ctx, 19, 6, 2, 2, HL);
      }
    } else if (S === 'rideau') {
      if (dir === 3) {
        R(ctx, 5, 3, 14, 1, H);
        R(ctx, 4, 4, 16, 10, H);
        R(ctx, 5, 14, 14, 4, H);
        R(ctx, 6, 16, 12, 2, HS);
        R(ctx, 7, 5, 10, 1, HL);
      } else if (dir === 2) {
        R(ctx, 3 + sway, 4, 7, 13, H);
        R(ctx, 4 + sway, 15, 6, 2, HS);
        R(ctx, 6 + sway, 5, 3, 1, HL);
      } else {
        R(ctx, 4, 5, 4, 13, H);
        R(ctx, 16, 5, 4, 13, H);
        R(ctx, 4, 16, 4, 2, HS);
        R(ctx, 16, 16, 4, 2, HS);
      }
    } else if (S === 'mohawk') {
      if (dir === 3) {
        R(ctx, 9, 1, 6, 9, H);
        R(ctx, 10, 8, 4, 2, HS);
        R(ctx, 10, 2, 2, 5, HL);
      } else if (dir === 2) {
        R(ctx, 8 + sway, 2, 5, 8, H);
        R(ctx, 9 + sway, 8, 3, 2, HS);
      }
    } else if (S === 'topknot') {
      if (dir === 3) {
        R(ctx, 10, 0, 4, 3, H);
        R(ctx, 11, 0, 2, 1, U.shade(H, 28));
        R(ctx, 10, 2, 4, 1, p.gold);
        R(ctx, 6, 7, 12, 5, HS);
      } else if (dir === 2) {
        R(ctx, 9 + sway, 0, 3, 3, H);
        R(ctx, 9 + sway, 1, 3, 1, p.gold);
        R(ctx, 7 + sway, 7, 6, 4, HS);
      }
    } else if (S === 'chignon') {
      if (dir === 3) {
        R(ctx, 10, 0, 4, 3, H);
        R(ctx, 11, 0, 2, 1, U.shade(H, 28));
        R(ctx, 6, 8, 12, 4, HS);
      } else if (dir === 2) {
        R(ctx, 9 + sway, 0, 3, 3, H);
        R(ctx, 7 + sway, 8, 6, 3, HS);
      }
    } else if (S === 'spiky') {
      if (dir === 3) {
        R(ctx, 7, 0, 2, 4, H);
        R(ctx, 10, 0, 2, 5, H);
        R(ctx, 13, 0, 2, 4, H);
        R(ctx, 6, 8, 12, 4, HS);
      } else if (dir === 2) {
        R(ctx, 6 + sway, 0, 2, 4, H);
        R(ctx, 9 + sway, 0, 2, 5, H);
        R(ctx, 12 + sway, 1, 2, 3, H);
        R(ctx, 7 + sway, 8, 6, 3, HS);
      }
    } else {
      // coiffures courtes : petite masse de nuque
      R(ctx, 7, 10, 10, 3, HS);
      if (dir === 2) R(ctx, 7, 10, 5, 3, HS);
    }
  }

  function drawHairFront(ctx, dir, p, frame) {
    const S = p.hairStyle, H = p.hair, HS = p.hairShade, shine = U.shade(H, 32);
    if (dir === 3) {
      if (S === 'rase') {
        R(ctx, 7, 4, 10, 5, H);
        R(ctx, 8, 9, 8, 2, HS);
        R(ctx, 6, 6, 1, 3, p.skin.base);
        R(ctx, 17, 6, 1, 3, p.skin.base);
        R(ctx, 9, 4, 4, 1, shine);
        return;
      }
      R(ctx, 6, 3, 12, 11, H);
      R(ctx, 7, 2, 10, 2, H);
      R(ctx, 6, 12, 12, 2, HS);
      R(ctx, 9, 4, 4, 1, shine);
      R(ctx, 7, 10, 2, 2, U.shade(H, -8));
      if (S === 'long' || S === 'tresse') {
        R(ctx, 5, 6, 3, 8, H);
        R(ctx, 17, 6, 3, 8, H);
        R(ctx, 5, 12, 3, 2, HS);
        R(ctx, 17, 12, 3, 2, HS);
        if (S === 'tresse') {
          R(ctx, 17, 9, 3, 9, H);
          for (let i = 0; i < 4; i++) R(ctx, 17 + (i % 2), 11 + i * 2, 2, 2, i % 2 ? HS : H);
          R(ctx, 17, 18, 3, 1, p.gold);
        }
      } else if (S === 'queue') {
        R(ctx, 10, 9, 4, 9, H);
        R(ctx, 11, 16, 2, 2, HS);
        R(ctx, 10, 11, 4, 1, p.gold);
        R(ctx, 11, 13, 1, 4, shine);
      } else if (S === 'braids') {
        R(ctx, 4, 8, 3, 13, H);
        R(ctx, 17, 8, 3, 13, H);
        for (let i = 0; i < 4; i++) {
          R(ctx, 4 + (i % 2), 10 + i * 3, 2, 2, i % 2 ? HS : H);
          R(ctx, 18 - (i % 2), 10 + i * 3, 2, 2, i % 2 ? H : HS);
        }
        R(ctx, 4, 20, 3, 1, p.gold);
        R(ctx, 17, 20, 3, 1, p.gold);
      } else if (S === 'afro') {
        R(ctx, 2, 1, 20, 10, H);
        R(ctx, 1, 4, 2, 5, H);
        R(ctx, 21, 4, 2, 5, H);
        R(ctx, 3, 10, 18, 2, HS);
        R(ctx, 4, 1, 3, 2, shine);
        R(ctx, 17, 3, 2, 2, U.shade(H, -10));
      } else if (S === 'carre') {
        R(ctx, 4, 3, 16, 11, H);
        R(ctx, 5, 12, 14, 2, HS);
        R(ctx, 7, 4, 4, 1, shine);
      } else if (S === 'couettes') {
        R(ctx, 1, 8, 4, 11, H);
        R(ctx, 19, 8, 4, 11, H);
        R(ctx, 1, 13, 4, 1, p.gold);
        R(ctx, 19, 13, 4, 1, p.gold);
        R(ctx, 2, 18, 3, 2, HS);
        R(ctx, 19, 18, 3, 2, HS);
      } else if (S === 'boucles') {
        R(ctx, 3, 2, 18, 10, H);
        R(ctx, 2, 5, 3, 6, H);
        R(ctx, 19, 5, 3, 6, H);
        R(ctx, 4, 10, 16, 2, HS);
        R(ctx, 5, 1, 2, 2, shine);
        R(ctx, 15, 2, 2, 2, U.shade(H, 18));
      } else if (S === 'rideau') {
        R(ctx, 4, 3, 16, 11, H);
        R(ctx, 5, 12, 14, 2, HS);
        R(ctx, 7, 4, 5, 1, shine);
      } else if (S === 'mohawk') {
        R(ctx, 9, 1, 6, 9, H);
        R(ctx, 10, 8, 4, 2, HS);
        R(ctx, 10, 2, 2, 5, shine);
        R(ctx, 6, 5, 3, 3, U.shade(H, -18));
        R(ctx, 15, 5, 3, 3, U.shade(H, -18));
      } else if (S === 'topknot' || S === 'chignon') {
        R(ctx, 9, 0, 6, 3, H);
        R(ctx, 10, 0, 4, 1, shine);
        R(ctx, 9, 2, 6, 1, p.gold);
      } else if (S === 'spiky') {
        R(ctx, 6, 1, 2, 3, H);
        R(ctx, 9, 0, 2, 4, H);
        R(ctx, 13, 0, 2, 4, H);
        R(ctx, 16, 1, 2, 3, H);
        R(ctx, 6, 9, 12, 3, HS);
      }
      return;
    }
    if (dir === 0) {
      if (S === 'rase') {
        R(ctx, 7, 3, 10, 2, H);
        R(ctx, 6, 5, 2, 1, H);
        R(ctx, 16, 5, 2, 1, H);
        R(ctx, 8, 5, 2, 1, HS);
        R(ctx, 11, 5, 1, 1, HS);
        R(ctx, 14, 5, 1, 1, HS);
        R(ctx, 9, 3, 4, 1, shine);
        return;
      }
      if (S === 'court') {
        R(ctx, 6, 3, 12, 4, H);
        R(ctx, 7, 2, 10, 2, H);
        R(ctx, 6, 6, 2, 3, H);
        R(ctx, 16, 6, 2, 3, H);
        R(ctx, 7, 7, 4, 2, H);
        R(ctx, 12, 7, 2, 1, H);
        R(ctx, 15, 7, 1, 1, H);
        R(ctx, 9, 3, 4, 1, shine);
        R(ctx, 8, 7, 1, 1, HS);
        R(ctx, 5, 8, 1, 1, HS);
      } else if (S === 'long') {
        R(ctx, 6, 3, 12, 4, H);
        R(ctx, 7, 2, 10, 2, H);
        R(ctx, 4, 6, 3, 12, H);
        R(ctx, 17, 6, 3, 12, H);
        R(ctx, 5, 8, 2, 9, U.shade(H, 16));
        R(ctx, 17, 9, 2, 7, U.shade(H, -8));
        R(ctx, 7, 6, 4, 3, H);
        R(ctx, 13, 6, 4, 3, H);
        R(ctx, 11, 6, 2, 1, HS);
        R(ctx, 9, 3, 4, 1, shine);
        R(ctx, 5, 17, 2, 2, HS);
        R(ctx, 17, 17, 2, 2, HS);
      } else if (S === 'tresse') {
        R(ctx, 6, 3, 12, 4, H);
        R(ctx, 7, 2, 10, 2, H);
        R(ctx, 4, 6, 3, 12, H);
        R(ctx, 17, 6, 3, 7, H);
        R(ctx, 7, 6, 4, 3, H);
        R(ctx, 13, 6, 4, 3, H);
        R(ctx, 18, 9, 3, 16, H);
        for (let i = 0; i < 6; i++) R(ctx, 18 + (i % 2), 15 + i * 2, 2, 2, i % 2 ? HS : H);
        R(ctx, 18, 24, 3, 1, p.gold);
        R(ctx, 9, 3, 4, 1, shine);
        R(ctx, 4, 17, 2, 2, HS);
      } else if (S === 'spiky') {
        R(ctx, 6, 4, 12, 3, H);
        R(ctx, 7, 0, 2, 5, H);
        R(ctx, 10, 0, 2, 5, H);
        R(ctx, 13, 0, 2, 5, H);
        R(ctx, 16, 0, 1, 4, H);
        R(ctx, 8, 3, 2, 2, H);
        R(ctx, 11, 3, 2, 2, H);
        R(ctx, 14, 3, 1, 2, H);
        R(ctx, 7, 7, 3, 1, H);
        R(ctx, 11, 7, 2, 1, H);
        R(ctx, 14, 7, 2, 1, H);
        R(ctx, 9, 1, 1, 3, shine);
        R(ctx, 12, 1, 1, 3, shine);
        R(ctx, 6, 7, 1, 2, HS);
        R(ctx, 17, 7, 1, 2, HS);
      } else if (S === 'chignon') {
        R(ctx, 6, 3, 12, 4, H);
        R(ctx, 7, 2, 10, 2, H);
        R(ctx, 9, 0, 6, 3, H);
        R(ctx, 8, 1, 1, 2, H);
        R(ctx, 15, 1, 1, 2, H);
        R(ctx, 10, 0, 4, 1, shine);
        R(ctx, 9, 2, 6, 1, p.gold);
        R(ctx, 7, 7, 4, 1, H);
        R(ctx, 13, 7, 3, 1, H);
        R(ctx, 6, 5, 2, 3, H);
        R(ctx, 16, 5, 2, 3, H);
        R(ctx, 9, 3, 3, 1, shine);
      } else if (S === 'queue') {
        R(ctx, 6, 3, 12, 4, H);
        R(ctx, 7, 2, 10, 2, H);
        R(ctx, 6, 6, 2, 3, H);
        R(ctx, 16, 5, 2, 4, H);
        R(ctx, 7, 6, 5, 2, H);
        R(ctx, 13, 6, 3, 1, H);
        R(ctx, 12, 7, 4, 1, H);
        R(ctx, 18, 8, 3, 4, H);
        R(ctx, 18, 11, 3, 1, p.gold);
        R(ctx, 9, 3, 4, 1, shine);
      } else if (S === 'mohawk') {
        R(ctx, 10, 0, 4, 8, H);
        R(ctx, 9, 2, 6, 5, H);
        R(ctx, 10, 7, 4, 2, H);
        R(ctx, 11, 0, 2, 4, shine);
        R(ctx, 6, 5, 3, 3, U.shade(H, -20));
        R(ctx, 15, 5, 3, 3, U.shade(H, -20));
        R(ctx, 7, 6, 1, 1, HS);
        R(ctx, 16, 6, 1, 1, HS);
      } else if (S === 'afro') {
        R(ctx, 3, 2, 18, 1, H);
        R(ctx, 2, 3, 20, 5, H);
        R(ctx, 1, 4, 2, 5, H);
        R(ctx, 21, 4, 2, 5, H);
        R(ctx, 3, 8, 18, 1, HS);
        R(ctx, 4, 9, 16, 1, HS);
        R(ctx, 4, 1, 4, 2, H);
        R(ctx, 9, 0, 4, 2, H);
        R(ctx, 15, 1, 4, 2, H);
        R(ctx, 5, 3, 3, 2, shine);
        R(ctx, 12, 2, 2, 1, shine);
        R(ctx, 6, 7, 3, 2, H);
        R(ctx, 11, 7, 2, 2, H);
        R(ctx, 15, 7, 3, 2, H);
        R(ctx, 2, 7, 2, 2, HS);
        R(ctx, 20, 7, 2, 2, HS);
      } else if (S === 'braids') {
        R(ctx, 6, 3, 12, 4, H);
        R(ctx, 7, 2, 10, 2, H);
        R(ctx, 5, 6, 2, 3, H);
        R(ctx, 17, 6, 2, 3, H);
        R(ctx, 7, 6, 4, 2, H);
        R(ctx, 13, 6, 3, 2, H);
        R(ctx, 3, 9, 4, 14, H);
        R(ctx, 17, 9, 4, 14, H);
        for (let i = 0; i < 5; i++) {
          R(ctx, 3 + (i % 2), 11 + i * 2, 3, 2, i % 2 ? HS : H);
          R(ctx, 18 - (i % 2), 11 + i * 2, 3, 2, i % 2 ? H : HS);
        }
        R(ctx, 3, 21, 4, 1, p.gold);
        R(ctx, 17, 21, 4, 1, p.gold);
        R(ctx, 9, 3, 4, 1, shine);
      } else if (S === 'carre') {
        R(ctx, 5, 3, 14, 5, H);
        R(ctx, 6, 2, 12, 2, H);
        R(ctx, 4, 6, 3, 8, H);
        R(ctx, 17, 6, 3, 8, H);
        R(ctx, 6, 7, 12, 2, H);
        R(ctx, 7, 8, 3, 1, H);
        R(ctx, 13, 8, 3, 1, H);
        R(ctx, 8, 3, 4, 1, shine);
        R(ctx, 5, 14, 2, 2, HS);
        R(ctx, 17, 14, 2, 2, HS);
      } else if (S === 'couettes') {
        R(ctx, 6, 3, 12, 4, H);
        R(ctx, 7, 2, 10, 2, H);
        R(ctx, 5, 6, 2, 3, H);
        R(ctx, 17, 6, 2, 3, H);
        R(ctx, 7, 7, 4, 1, H);
        R(ctx, 13, 7, 3, 1, H);
        R(ctx, 2, 8, 2, 1, H);
        R(ctx, 1, 9, 4, 7, H);
        R(ctx, 2, 16, 2, 2, H);
        R(ctx, 2, 18, 2, 1, HS);
        R(ctx, 20, 8, 2, 1, H);
        R(ctx, 19, 9, 4, 7, H);
        R(ctx, 20, 16, 2, 2, H);
        R(ctx, 20, 18, 2, 1, HS);
        R(ctx, 2, 8, 2, 3, shine);
        R(ctx, 20, 9, 2, 2, U.shade(H, 22));
        R(ctx, 1, 13, 4, 1, p.gold);
        R(ctx, 19, 13, 4, 1, p.gold);
        R(ctx, 9, 3, 4, 1, shine);
      } else if (S === 'boucles') {
        R(ctx, 4, 2, 16, 6, H);
        R(ctx, 3, 4, 2, 5, H);
        R(ctx, 19, 4, 2, 5, H);
        R(ctx, 2, 7, 3, 5, H);
        R(ctx, 19, 7, 3, 5, H);
        R(ctx, 5, 1, 3, 2, H);
        R(ctx, 9, 0, 3, 2, H);
        R(ctx, 14, 1, 3, 2, H);
        R(ctx, 4, 7, 3, 2, H);
        R(ctx, 9, 7, 2, 2, H);
        R(ctx, 14, 7, 3, 2, H);
        R(ctx, 6, 3, 2, 1, shine);
        R(ctx, 12, 2, 1, 1, shine);
        R(ctx, 16, 4, 1, 1, shine);
        R(ctx, 3, 11, 2, 2, HS);
        R(ctx, 19, 11, 2, 2, HS);
      } else if (S === 'rideau') {
        R(ctx, 6, 3, 12, 4, H);
        R(ctx, 7, 2, 10, 2, H);
        R(ctx, 5, 5, 3, 9, H);
        R(ctx, 16, 5, 3, 9, H);
        R(ctx, 6, 14, 2, 2, H);
        R(ctx, 16, 14, 2, 2, H);
        R(ctx, 7, 6, 2, 3, H);
        R(ctx, 15, 6, 2, 3, H);
        R(ctx, 11, 5, 2, 1, HS);
        R(ctx, 8, 6, 2, 2, H);
        R(ctx, 14, 6, 2, 2, H);
        R(ctx, 9, 3, 3, 1, shine);
        R(ctx, 6, 15, 2, 1, HS);
        R(ctx, 16, 15, 2, 1, HS);
      } else if (S === 'topknot') {
        R(ctx, 6, 3, 12, 4, H);
        R(ctx, 7, 2, 10, 2, H);
        R(ctx, 9, 0, 6, 3, H);
        R(ctx, 10, 0, 4, 1, shine);
        R(ctx, 9, 2, 6, 1, p.gold);
        R(ctx, 10, 2, 4, 1, H);
        R(ctx, 7, 6, 3, 2, H);
        R(ctx, 14, 6, 3, 1, H);
        R(ctx, 6, 6, 2, 3, H);
        R(ctx, 16, 6, 2, 3, H);
        R(ctx, 9, 3, 4, 1, shine);
      }
      return;
    }

    // profil (droite)
    if (S === 'rase') {
      R(ctx, 7, 4, 10, 4, H);
      R(ctx, 5, 6, 2, 3, H);
      R(ctx, 16, 5, 2, 2, H);
      R(ctx, 8, 5, 2, 1, HS);
      R(ctx, 12, 6, 2, 1, HS);
      R(ctx, 9, 4, 3, 1, shine);
      return;
    }
    R(ctx, 6, 3, 12, 4, H);
    R(ctx, 7, 2, 10, 2, H);
    R(ctx, 5, 5, 3, 8, H);
    R(ctx, 6, 12, 7, 2, HS);
    R(ctx, 8, 4, 4, 1, shine);
    R(ctx, 4, 6, 2, 5, U.shade(H, 16));
    if (S === 'court') {
      R(ctx, 12, 6, 4, 2, H);
      R(ctx, 7, 7, 4, 1, H);
      R(ctx, 16, 6, 2, 2, H);
      R(ctx, 4, 5, 2, 3, H);
      R(ctx, 13, 6, 1, 1, HS);
    } else if (S === 'long') {
      R(ctx, 4, 6, 4, 13, H);
      R(ctx, 5, 8, 2, 9, U.shade(H, 16));
      R(ctx, 12, 6, 4, 2, H);
      R(ctx, 16, 6, 2, 2, H);
      R(ctx, 4, 17, 3, 2, HS);
    } else if (S === 'tresse') {
      R(ctx, 4, 6, 3, 12, H);
      R(ctx, 12, 6, 4, 2, H);
      R(ctx, 3, 14, 3, 12, H);
      for (let i = 0; i < 5; i++) R(ctx, 3 + (i % 2), 16 + i * 2, 2, 2, i % 2 ? HS : H);
      R(ctx, 3, 24, 3, 1, p.gold);
      R(ctx, 16, 6, 2, 2, H);
    } else if (S === 'spiky') {
      R(ctx, 7, 0, 2, 4, H);
      R(ctx, 10, 0, 2, 5, H);
      R(ctx, 13, 0, 2, 4, H);
      R(ctx, 15, 0, 2, 3, H);
      R(ctx, 12, 5, 4, 2, H);
      R(ctx, 8, 1, 1, 3, shine);
      R(ctx, 11, 1, 1, 3, shine);
      R(ctx, 5, 6, 1, 2, HS);
    } else if (S === 'chignon') {
      R(ctx, 9, 0, 4, 3, H);
      R(ctx, 8, 1, 1, 2, H);
      R(ctx, 14, 1, 1, 2, H);
      R(ctx, 10, 0, 2, 1, shine);
      R(ctx, 9, 2, 4, 1, p.gold);
      R(ctx, 12, 6, 4, 2, H);
      R(ctx, 5, 5, 2, 3, H);
    } else if (S === 'queue') {
      R(ctx, 5, 3, 11, 4, H);
      R(ctx, 3, 7, 3, 9, H);
      R(ctx, 4, 14, 2, 3, HS);
      R(ctx, 3, 11, 3, 1, p.gold);
      R(ctx, 12, 6, 4, 2, H);
      R(ctx, 16, 6, 2, 2, H);
      R(ctx, 7, 3, 3, 1, shine);
    } else if (S === 'mohawk') {
      R(ctx, 9, 0, 4, 8, H);
      R(ctx, 10, 0, 2, 4, shine);
      R(ctx, 5, 5, 4, 3, U.shade(H, -20));
      R(ctx, 12, 5, 4, 2, H);
      R(ctx, 6, 6, 1, 1, HS);
    } else if (S === 'afro') {
      R(ctx, 2, 1, 9, 10, H);
      R(ctx, 3, 9, 8, 2, HS);
      R(ctx, 3, 1, 3, 2, shine);
      R(ctx, 2, 6, 2, 2, U.shade(H, -10));
      R(ctx, 8, 6, 3, 2, H);
      R(ctx, 12, 6, 3, 2, H);
    } else if (S === 'braids') {
      R(ctx, 12, 6, 4, 2, H);
      R(ctx, 3, 8, 3, 15, H);
      for (let i = 0; i < 5; i++) R(ctx, 3 + (i % 2), 10 + i * 3, 2, 2, i % 2 ? HS : H);
      R(ctx, 3, 21, 3, 1, p.gold);
      R(ctx, 16, 6, 2, 2, H);
    } else if (S === 'carre') {
      R(ctx, 4, 4, 7, 11, H);
      R(ctx, 5, 13, 6, 2, HS);
      R(ctx, 12, 6, 4, 2, H);
      R(ctx, 16, 6, 2, 2, H);
      R(ctx, 5, 5, 2, 1, shine);
    } else if (S === 'couettes') {
      R(ctx, 1, 8, 4, 12, H);
      R(ctx, 2, 8, 2, 3, shine);
      R(ctx, 1, 13, 4, 1, p.gold);
      R(ctx, 2, 18, 3, 2, HS);
      R(ctx, 12, 6, 4, 2, H);
      R(ctx, 16, 6, 2, 2, H);
    } else if (S === 'boucles') {
      R(ctx, 3, 3, 8, 10, H);
      R(ctx, 2, 6, 3, 4, H);
      R(ctx, 4, 11, 6, 3, HS);
      R(ctx, 4, 1, 3, 2, H);
      R(ctx, 9, 2, 2, 2, H);
      R(ctx, 5, 4, 2, 2, shine);
      R(ctx, 12, 6, 3, 2, H);
    } else if (S === 'rideau') {
      R(ctx, 4, 4, 7, 12, H);
      R(ctx, 5, 14, 6, 2, HS);
      R(ctx, 12, 5, 4, 3, H);
      R(ctx, 16, 6, 2, 2, H);
      R(ctx, 11, 5, 2, 1, HS);
      R(ctx, 6, 5, 2, 1, shine);
    } else if (S === 'topknot') {
      R(ctx, 9, 0, 4, 3, H);
      R(ctx, 10, 0, 2, 1, shine);
      R(ctx, 9, 2, 4, 1, p.gold);
      R(ctx, 12, 6, 4, 2, H);
      R(ctx, 5, 5, 3, 3, H);
      R(ctx, 16, 6, 2, 2, H);
    }
  }

  function drawBeard(ctx, dir, p) {
    const B = p.beard;
    if (!B || B === 'none') return;
    const H = p.hair, HS = p.hairShade, L = U.shade(H, 20);
    if (dir === 0) {
      if (B === 'moustache') {
        R(ctx, 9, 13, 3, 1, H);
        R(ctx, 12, 13, 3, 1, H);
        R(ctx, 8, 13, 1, 1, HS);
        R(ctx, 15, 13, 1, 1, HS);
        R(ctx, 9, 14, 2, 1, HS);
        R(ctx, 13, 14, 2, 1, HS);
      } else if (B === 'bouc') {
        R(ctx, 9, 13, 3, 1, H);
        R(ctx, 12, 13, 3, 1, H);
        R(ctx, 11, 14, 2, 1, H);
        R(ctx, 10, 16, 4, 2, H);
        R(ctx, 11, 17, 2, 1, HS);
        R(ctx, 11, 16, 1, 1, L);
      } else if (B === 'courte') {
        R(ctx, 6, 10, 1, 4, H);
        R(ctx, 17, 10, 1, 4, H);
        R(ctx, 7, 14, 10, 2, H);
        R(ctx, 8, 15, 2, 1, HS);
        R(ctx, 13, 15, 2, 1, HS);
        R(ctx, 9, 13, 3, 1, H);
        R(ctx, 12, 13, 3, 1, H);
        R(ctx, 11, 14, 2, 1, HS);
        R(ctx, 10, 14, 1, 1, L);
      } else if (B === 'longue') {
        R(ctx, 5, 10, 2, 7, H);
        R(ctx, 17, 10, 2, 7, H);
        R(ctx, 6, 14, 12, 4, H);
        R(ctx, 7, 17, 10, 2, H);
        R(ctx, 9, 19, 6, 1, H);
        R(ctx, 8, 18, 2, 1, HS);
        R(ctx, 14, 18, 2, 1, HS);
        R(ctx, 11, 19, 2, 1, HS);
        R(ctx, 9, 13, 3, 1, H);
        R(ctx, 12, 13, 3, 1, H);
        R(ctx, 10, 15, 1, 2, L);
        R(ctx, 14, 15, 1, 3, U.shade(H, -10));
        R(ctx, 6, 11, 1, 4, L);
        R(ctx, 17, 11, 1, 4, U.shade(H, -10));
      } else if (B === 'favoris') {
        R(ctx, 6, 9, 1, 5, H);
        R(ctx, 17, 9, 1, 5, H);
        R(ctx, 7, 12, 1, 2, HS);
        R(ctx, 16, 12, 1, 2, HS);
        R(ctx, 9, 13, 3, 1, H);
        R(ctx, 12, 13, 3, 1, H);
      }
    } else if (dir === 2) {
      if (B === 'moustache') {
        R(ctx, 13, 13, 3, 1, H);
        R(ctx, 16, 13, 1, 1, HS);
        R(ctx, 14, 14, 2, 1, HS);
      } else if (B === 'bouc') {
        R(ctx, 13, 13, 3, 1, H);
        R(ctx, 13, 16, 3, 2, H);
        R(ctx, 14, 17, 2, 1, HS);
        R(ctx, 14, 16, 1, 1, L);
      } else if (B === 'courte') {
        R(ctx, 7, 10, 1, 4, H);
        R(ctx, 12, 14, 5, 2, H);
        R(ctx, 13, 15, 4, 1, HS);
        R(ctx, 13, 13, 3, 1, H);
        R(ctx, 12, 14, 1, 1, L);
      } else if (B === 'longue') {
        R(ctx, 6, 10, 2, 7, H);
        R(ctx, 12, 13, 5, 2, H);
        R(ctx, 12, 15, 5, 3, H);
        R(ctx, 13, 18, 3, 1, HS);
        R(ctx, 7, 11, 1, 4, L);
        R(ctx, 15, 15, 1, 2, U.shade(H, -10));
        R(ctx, 9, 15, 3, 1, HS);
      } else if (B === 'favoris') {
        R(ctx, 7, 9, 1, 5, H);
        R(ctx, 8, 12, 1, 2, HS);
        R(ctx, 13, 13, 3, 1, H);
      }
    }
  }

  function drawMarks(ctx, dir, p) {
    const M = p.marks;
    if (!M || M === 'none') return;
    if (dir === 0) {
      if (M === 'taches') {
        R(ctx, 8, 12, 1, 1, '#bf855f');
        R(ctx, 9, 13, 1, 1, '#cf9570');
        R(ctx, 14, 12, 1, 1, '#bf855f');
        R(ctx, 15, 13, 1, 1, '#cf9570');
        R(ctx, 7, 13, 1, 1, '#d8a181');
        R(ctx, 16, 13, 1, 1, '#d8a181');
      } else if (M === 'cicatrice') {
        R(ctx, 8, 7, 1, 1, '#e0b09c');
        R(ctx, 9, 8, 1, 2, '#c9877a');
        R(ctx, 9, 10, 1, 1, '#e0b09c');
        R(ctx, 8, 11, 1, 1, '#c9877a');
      } else if (M === 'peinture') {
        R(ctx, 6, 12, 3, 1, p.acc);
        R(ctx, 15, 12, 3, 1, p.acc);
        R(ctx, 7, 13, 1, 1, p.accShade);
        R(ctx, 16, 13, 1, 1, p.accShade);
        R(ctx, 9, 13, 1, 1, p.accShade);
        R(ctx, 14, 13, 1, 1, p.accShade);
      } else if (M === 'tatouage') {
        R(ctx, 7, 10, 1, 2, p.accShade);
        R(ctx, 6, 11, 1, 1, p.accShade);
        R(ctx, 8, 12, 2, 1, p.accShade);
        R(ctx, 16, 10, 1, 1, p.accShade);
        R(ctx, 17, 11, 1, 2, p.accShade);
        R(ctx, 15, 12, 1, 1, p.accShade);
      }
    } else if (dir === 2) {
      if (M === 'taches') {
        R(ctx, 14, 12, 1, 1, '#bf855f');
        R(ctx, 15, 13, 1, 1, '#cf9570');
        R(ctx, 16, 12, 1, 1, '#bf855f');
        R(ctx, 13, 13, 1, 1, '#d8a181');
      } else if (M === 'cicatrice') {
        R(ctx, 8, 7, 1, 1, '#e0b09c');
        R(ctx, 9, 8, 1, 3, '#c9877a');
        R(ctx, 9, 11, 1, 1, '#e0b09c');
      } else if (M === 'peinture') {
        R(ctx, 12, 12, 4, 1, p.acc);
        R(ctx, 13, 13, 1, 1, p.accShade);
        R(ctx, 14, 13, 1, 1, p.accShade);
      } else if (M === 'tatouage') {
        R(ctx, 8, 10, 1, 2, p.accShade);
        R(ctx, 9, 12, 2, 1, p.accShade);
        R(ctx, 12, 11, 1, 1, p.accShade);
      }
    }
  }

  function drawOutfitOverlay(ctx, dir, p, tx, tw) {
    const cloth = '#e8ddc1', clothS = '#cbbf9f';
    if (p.apron) {
      if (dir === 3) {
        R(ctx, tx + 2, 19, Math.max(2, tw - 3), 9, cloth);
        R(ctx, tx + 2, 27, Math.max(2, tw - 3), 1, clothS);
        R(ctx, tx + 3, 19, 1, 6, U.shade(cloth, 12));
        R(ctx, tx + 3, 20, Math.max(1, tw - 5), 1, clothS);
        R(ctx, tx + 2, 18, 1, 2, clothS);
        R(ctx, tx + tw - 3, 18, 1, 2, clothS);
      } else if (dir === 0) {
        R(ctx, tx + 2, 19, Math.max(2, tw - 3), 9, cloth);
        R(ctx, tx + 2, 27, Math.max(2, tw - 3), 1, clothS);
        R(ctx, tx + 2, 19, 1, 8, clothS);
        R(ctx, tx + tw - 3, 19, 1, 8, U.shade(cloth, 10));
        R(ctx, tx + 3, 23, 2, 2, clothS);
        R(ctx, tx + 2, 18, 1, 2, clothS);
        R(ctx, tx + tw - 3, 18, 1, 2, clothS);
        R(ctx, tx + (tw >> 1) - 1, 19, 2, 1, clothS);
      } else {
        R(ctx, tx + 1, 19, Math.max(2, tw - 3), 9, cloth);
        R(ctx, tx + 1, 27, Math.max(2, tw - 3), 1, clothS);
        R(ctx, tx + 1, 19, 1, 8, clothS);
        R(ctx, tx + 2, 23, 2, 1, clothS);
        R(ctx, tx + tw - 3, 18, 1, 2, clothS);
      }
    }
    if (p.armor) {
      R(ctx, tx - 1, 17, tw + 2, 5, '#9aa4ac');
      R(ctx, tx, 18, tw, 1, '#c6d0d6');
      R(ctx, tx - 1, 21, tw + 2, 1, '#77828a');
      R(ctx, tx - 2, 17, 2, 3, '#6d7880');
      R(ctx, tx + tw, 17, 2, 3, '#6d7880');
      R(ctx, tx - 2, 17, 1, 1, '#b9c3c9');
      R(ctx, tx + tw + 1, 17, 1, 1, '#b9c3c9');
      R(ctx, tx + 1, 18, 1, 1, '#e0e6ea');
      R(ctx, tx + tw - 2, 18, 1, 1, '#e0e6ea');
      R(ctx, tx + (tw >> 1) - 1, 18, 2, 3, p.gold);
      R(ctx, tx + (tw >> 1), 18, 1, 1, U.shade(p.gold, 26));
      R(ctx, tx - 1, 20, tw + 2, 1, '#8a959d');
    }
  }

  function drawCharacterBase(ctx, dir, frame, p, flags) {
    const skin = p.skin.base, skinS = p.skin.shade, skinL = p.skin.light;
    const shirt = p.shirt, shirtS = p.shirtShade, shirtL = p.shirtLight;
    const pants = p.pants, pantsS = p.pantsShade;
    const eye = p.eye || p.eyes;
    const walk = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    const broad = p.buildIndex === 2 ? 1 : 0;
    const slim = p.buildIndex === 0 ? 1 : 0;
    const tx = 7 - broad + slim, tw = 10 + broad * 2 - slim * 2;
    const shoeLight = U.shade(p.shoes, 30);
    const bootCuff = U.shade(p.shoes, 14);
    const foreArm = p.armor ? '#9aa4ac' : skin;
    const foreArmS = p.armor ? '#77828a' : skinS;
    const liftL = walk === 1 ? 2 : 0, liftR = walk === -1 ? 2 : 0;
    const armL = walk === -1 ? 1 : 0, armR = walk === 1 ? 1 : 0;

    drawAccessoryBehind(ctx, dir, p);
    drawHairBehind(ctx, dir, p, frame);

    if (dir === 3) {
      // Jambes et bottes
      R(ctx, 8, 24, 3, 4, pants);
      R(ctx, 13, 24, 3, 4, pants);
      R(ctx, 8, 24, 1, 3, pantsS);
      R(ctx, 13, 24, 1, 3, pantsS);
      R(ctx, 9, 26, 1, 1, U.shade(pants, 12));
      R(ctx, 14, 26, 1, 1, U.shade(pants, 12));
      R(ctx, 7, 28 - liftL, 4, 1, bootCuff);
      R(ctx, 13, 28 - liftR, 4, 1, bootCuff);
      R(ctx, 7, 29 - liftL, 4, 3, p.shoes);
      R(ctx, 13, 29 - liftR, 4, 3, p.shoes);
      R(ctx, 7, 31 - liftL, 4, 1, U.shade(p.shoes, -28));
      R(ctx, 13, 31 - liftR, 4, 1, U.shade(p.shoes, -28));
      R(ctx, 8, 29 - liftL, 2, 1, shoeLight);
      R(ctx, 14, 29 - liftR, 2, 1, shoeLight);
      if (p.robe) {
        R(ctx, tx - 1, 23, tw + 2, 6, shirtS);
        R(ctx, tx - 1, 23, tw + 2, 1, shirtL);
        R(ctx, tx + 1, 25, 2, 4, U.shade(shirtS, 12));
        R(ctx, tx + tw - 3, 25, 2, 3, U.shade(shirtS, -10));
        R(ctx, tx - 1, 28, tw + 2, 1, U.shade(shirtS, -22));
        R(ctx, tx + 3, 24, 1, 4, U.shade(shirtS, -8));
      }
      // Torse, dos
      R(ctx, tx + 1, 17, tw - 2, 1, shirtL);
      R(ctx, tx, 18, tw, 5, shirt);
      R(ctx, tx, 18, 1, 4, shirtS);
      R(ctx, tx + tw - 1, 18, 1, 4, shirtS);
      R(ctx, tx + 1, 22, tw - 2, 1, shirtS);
      R(ctx, 11, 19, 1, 3, U.shade(shirt, -8));
      R(ctx, tx + 2, 21, 1, 1, U.shade(shirt, -10));
      R(ctx, tx + tw - 3, 21, 1, 1, U.shade(shirt, -10));
      R(ctx, tx, 22, tw, 2, p.belt);
      R(ctx, tx, 22, tw, 1, U.shade(p.belt, 18));
      R(ctx, 11, 22, 2, 2, p.gold);
      R(ctx, 11, 22, 1, 1, U.shade(p.gold, 28));
      R(ctx, tx + 2, 22, 1, 1, U.shade(p.belt, -18));
      R(ctx, tx + tw - 3, 22, 1, 1, U.shade(p.belt, -18));
      drawOutfitOverlay(ctx, dir, p, tx, tw);
      // Bras
      R(ctx, tx - 2, 18 + armL, 2, 4, shirtS);
      R(ctx, tx - 2, 18 + armL, 1, 3, U.shade(shirtS, 8));
      R(ctx, tx - 2, 21 + armL, 2, 1, shirtL);
      R(ctx, tx - 2, 22 + armL, 2, 3, foreArm);
      R(ctx, tx - 2, 24 + armL, 2, 1, foreArmS);
      R(ctx, tx + tw, 18 + armR, 2, 4, shirtS);
      R(ctx, tx + tw, 18 + armR, 1, 3, U.shade(shirtS, 8));
      R(ctx, tx + tw, 21 + armR, 2, 1, shirtL);
      R(ctx, tx + tw, 22 + armR, 2, 3, foreArm);
      R(ctx, tx + tw, 24 + armR, 2, 1, foreArmS);
      // Nuque, oreilles et crâne
      R(ctx, 10, 14, 4, 3, skinS);
      R(ctx, 10, 15, 4, 2, skin);
      R(ctx, 5, 10, 2, 3, skin);
      R(ctx, 17, 10, 2, 3, skin);
      R(ctx, 5, 11, 1, 1, skinS);
      R(ctx, 18, 11, 1, 1, skinS);
      R(ctx, 7, 4, 10, 12, skin);
      R(ctx, 8, 4, 8, 1, skinL);
      R(ctx, 7, 6, 1, 8, skinS);
      R(ctx, 16, 6, 1, 8, skinS);
      R(ctx, 8, 15, 8, 1, skinS);
      R(ctx, 10, 14, 4, 1, U.shade(skinS, -8));
      R(ctx, 8, 14, 1, 1, skinS);
      R(ctx, 15, 14, 1, 1, skinS);
      drawHairFront(ctx, dir, p, frame);
      drawAccessoryFront(ctx, dir, p);
    } else if (dir === 0) {

      // Jambes et bottes
      R(ctx, 8, 24, 3, 4, pants);
      R(ctx, 13, 24, 3, 4, pants);
      R(ctx, 8, 24, 1, 3, pantsS);
      R(ctx, 13, 24, 1, 3, pantsS);
      R(ctx, 9, 26, 1, 1, U.shade(pants, 12));
      R(ctx, 14, 26, 1, 1, U.shade(pants, 12));
      R(ctx, 7, 28 - liftL, 4, 1, bootCuff);
      R(ctx, 13, 28 - liftR, 4, 1, bootCuff);
      R(ctx, 7, 29 - liftL, 4, 3, p.shoes);
      R(ctx, 13, 29 - liftR, 4, 3, p.shoes);
      R(ctx, 7, 31 - liftL, 4, 1, U.shade(p.shoes, -28));
      R(ctx, 13, 31 - liftR, 4, 1, U.shade(p.shoes, -28));
      R(ctx, 8, 29 - liftL, 2, 1, shoeLight);
      R(ctx, 14, 29 - liftR, 2, 1, shoeLight);
      R(ctx, 9, 30 - liftL, 1, 1, U.shade(p.shoes, 18));
      R(ctx, 15, 30 - liftR, 1, 1, U.shade(p.shoes, 18));
      if (p.robe) {
        R(ctx, tx - 1, 23, tw + 2, 6, shirtS);
        R(ctx, tx - 1, 23, tw + 2, 1, shirtL);
        R(ctx, tx + 1, 25, 2, 4, U.shade(shirtS, 12));
        R(ctx, tx + tw - 3, 25, 2, 3, U.shade(shirtS, -10));
        R(ctx, tx - 1, 28, tw + 2, 1, U.shade(shirtS, -22));
        R(ctx, tx + 3, 24, 1, 4, U.shade(shirtS, -8));
      }
      // Cou et torse
      R(ctx, 10, 14, 4, 3, skinS);
      R(ctx, 10, 15, 4, 2, skin);
      R(ctx, 10, 14, 1, 1, skinS);
      R(ctx, 13, 14, 1, 1, skinS);
      R(ctx, tx + 1, 17, tw - 2, 1, shirtL);
      R(ctx, tx, 18, tw, 5, shirt);
      R(ctx, tx, 18, 1, 4, shirtS);
      R(ctx, tx + tw - 1, 18, 1, 4, shirtS);
      R(ctx, tx + 1, 22, tw - 2, 1, shirtS);
      R(ctx, 11, 20, 1, 2, U.shade(shirt, -8));
      R(ctx, tx + 2, 20, 1, 1, shirtS);
      R(ctx, tx + tw - 3, 20, 1, 1, shirtS);
      R(ctx, tx, 22, tw, 2, p.belt);
      R(ctx, tx, 22, tw, 1, U.shade(p.belt, 18));
      R(ctx, 11, 22, 2, 2, p.gold);
      R(ctx, 11, 22, 1, 1, U.shade(p.gold, 28));
      R(ctx, tx + 2, 22, 1, 1, U.shade(p.belt, -18));
      R(ctx, tx + tw - 3, 22, 1, 1, U.shade(p.belt, -18));
      // Col V
      R(ctx, 9, 17, 1, 2, shirtS);
      R(ctx, 14, 17, 1, 2, shirtS);
      R(ctx, 10, 17, 4, 1, skinS);
      R(ctx, 11, 18, 2, 1, skinS);
      R(ctx, 10, 18, 1, 1, shirtS);
      R(ctx, 13, 18, 1, 1, shirtS);
      drawOutfitOverlay(ctx, dir, p, tx, tw);
      // Bras
      R(ctx, tx - 2, 18 + armL, 2, 4, shirtS);
      R(ctx, tx - 2, 18 + armL, 1, 3, U.shade(shirtS, 8));
      R(ctx, tx - 2, 21 + armL, 2, 1, shirtL);
      R(ctx, tx - 2, 22 + armL, 2, 3, foreArm);
      R(ctx, tx - 2, 24 + armL, 2, 1, foreArmS);
      R(ctx, tx + tw, 18 + armR, 2, 4, shirtS);
      R(ctx, tx + tw, 18 + armR, 1, 3, U.shade(shirtS, 8));
      R(ctx, tx + tw, 21 + armR, 2, 1, shirtL);
      R(ctx, tx + tw, 22 + armR, 2, 3, foreArm);
      R(ctx, tx + tw, 24 + armR, 2, 1, foreArmS);
      // Oreilles et tête
      R(ctx, 5, 10, 2, 3, skin);
      R(ctx, 17, 10, 2, 3, skin);
      R(ctx, 5, 11, 1, 1, skinS);
      R(ctx, 18, 11, 1, 1, skinS);
      R(ctx, 6, 10, 1, 1, skinL);
      R(ctx, 17, 10, 1, 1, skinL);
      R(ctx, 7, 4, 10, 11, skin);
      R(ctx, 8, 4, 8, 1, skinL);
      R(ctx, 9, 5, 5, 1, skinL);
      R(ctx, 7, 6, 1, 8, skinS);
      R(ctx, 16, 6, 1, 8, skinS);
      R(ctx, 8, 15, 8, 1, skinS);
      R(ctx, 7, 14, 1, 1, skinS);
      R(ctx, 16, 14, 1, 1, skinS);
      R(ctx, 8, 12, 2, 1, U.shade(skin, 8));
      R(ctx, 14, 12, 2, 1, U.shade(skin, 8));
      R(ctx, 7, 12, 1, 1, U.shade(skin, 10));
      R(ctx, 16, 12, 1, 1, U.shade(skin, 10));
      // Sourcils fins, petits yeux, nez discret, bouche
      R(ctx, 9, 9, 2, 1, p.hairShade);
      R(ctx, 13, 9, 2, 1, p.hairShade);
      R(ctx, 9, 10, 2, 2, eye);
      R(ctx, 9, 10, 1, 1, p.eyeGlow || '#fff6da');
      R(ctx, 10, 11, 1, 1, '#241c2c');
      R(ctx, 13, 10, 2, 2, eye);
      R(ctx, 13, 10, 1, 1, p.eyeGlow || '#fff6da');
      R(ctx, 14, 11, 1, 1, '#241c2c');
      R(ctx, 11, 12, 1, 1, U.shade(skin, 8));
      R(ctx, 12, 12, 1, 1, skinS);
      R(ctx, 11, 14, 2, 1, '#b5766a');
      R(ctx, 10, 14, 1, 1, U.shade(skinS, -6));
      R(ctx, 13, 14, 1, 1, U.shade(skinS, -6));
      drawMarks(ctx, dir, p);
      drawBeard(ctx, dir, p);
      drawHairFront(ctx, dir, p, frame);
      drawAccessoryFront(ctx, dir, p);

    } else {
      // Profil droit
      const ptx = tx + 1, ptw = tw - 2;
      // Jambes et bottes
      R(ctx, 9, 24, 3, 4, pants);
      R(ctx, 12, 24, 3, 4, pants);
      R(ctx, 9, 24, 1, 3, pantsS);
      R(ctx, 12, 24, 1, 3, pantsS);
      R(ctx, 10, 26, 1, 1, U.shade(pants, 12));
      R(ctx, 8, 28 - liftR, 4, 1, bootCuff);
      R(ctx, 12, 28 - liftL, 4, 1, bootCuff);
      R(ctx, 8, 29 - liftR, 4, 3, p.shoes);
      R(ctx, 12, 29 - liftL, 4, 3, p.shoes);
      R(ctx, 8, 31 - liftR, 4, 1, U.shade(p.shoes, -28));
      R(ctx, 12, 31 - liftL, 4, 1, U.shade(p.shoes, -28));
      R(ctx, 9, 29 - liftR, 2, 1, shoeLight);
      R(ctx, 13, 29 - liftL, 2, 1, shoeLight);
      if (p.robe) {
        R(ctx, ptx - 1, 23, ptw + 1, 6, shirtS);
        R(ctx, ptx - 1, 23, ptw + 1, 1, shirtL);
        R(ctx, ptx + 1, 25, 2, 4, U.shade(shirtS, 12));
        R(ctx, ptx + ptw - 3, 25, 2, 3, U.shade(shirtS, -10));
        R(ctx, ptx - 1, 28, ptw + 1, 1, U.shade(shirtS, -22));
      }
      // Cou et torse
      R(ctx, 11, 14, 4, 3, skinS);
      R(ctx, 11, 15, 4, 2, skin);
      R(ctx, ptx + 1, 17, ptw - 2, 1, shirtL);
      R(ctx, ptx, 18, ptw, 5, shirt);
      R(ctx, ptx, 18, 1, 4, shirtS);
      R(ctx, ptx + ptw - 1, 18, 1, 4, shirtL);
      R(ctx, ptx + 1, 22, ptw - 2, 1, shirtS);
      R(ctx, ptx + 1, 20, 1, 1, shirtS);
      R(ctx, ptx, 22, ptw, 2, p.belt);
      R(ctx, ptx, 22, ptw, 1, U.shade(p.belt, 18));
      R(ctx, ptx + ptw - 3, 22, 1, 1, p.gold);
      R(ctx, ptx + 2, 22, 1, 1, U.shade(p.belt, -18));
      R(ctx, 11, 17, 1, 2, shirtS);
      R(ctx, ptx + ptw - 1, 17, 1, 2, shirtS);
      R(ctx, 12, 17, 3, 1, skinS);
      drawOutfitOverlay(ctx, dir, p, ptx, ptw);
      // Bras avant
      R(ctx, ptx + ptw - 1, 18 + armR, 2, 4, shirtS);
      R(ctx, ptx + ptw - 1, 18 + armR, 1, 3, U.shade(shirtS, 8));
      R(ctx, ptx + ptw - 1, 21 + armR, 2, 1, shirtL);
      R(ctx, ptx + ptw, 22 + armR, 2, 3, foreArm);
      R(ctx, ptx + ptw, 24 + armR, 2, 1, foreArmS);
      // Tête de profil
      R(ctx, 6, 4, 11, 12, skin);
      R(ctx, 17, 10, 1, 3, skin);
      R(ctx, 10, 10, 2, 3, skin);
      R(ctx, 10, 11, 1, 1, skinS);
      R(ctx, 11, 10, 1, 1, skinL);
      R(ctx, 7, 4, 4, 1, skinL);
      R(ctx, 12, 6, 4, 1, skinL);
      R(ctx, 6, 6, 1, 8, skinS);
      R(ctx, 8, 15, 9, 1, skinS);
      R(ctx, 6, 14, 2, 1, skinS);
      R(ctx, 17, 10, 1, 1, skinL);
      R(ctx, 17, 12, 1, 1, skinS);
      // Œil discret, sourcil fin, bouche
      R(ctx, 14, 10, 2, 2, eye);
      R(ctx, 14, 10, 1, 1, p.eyeGlow || '#fff6da');
      R(ctx, 15, 11, 1, 1, '#241c2c');
      R(ctx, 14, 9, 2, 1, p.hairShade);
      R(ctx, 16, 13, 1, 1, '#b5766a');
      R(ctx, 15, 14, 2, 1, skinS);
      drawMarks(ctx, dir, p);
      drawBeard(ctx, dir, p);
      drawHairFront(ctx, dir, p, frame);
      drawAccessoryFront(ctx, dir, p);
    }
  }

  Art.buildCharacter = function (look, flags) {
    flags = flags || {};
    const mergedLook = Object.assign({}, look, flags);
    const p = resolveLook(mergedLook);
    const key = 'char:' + JSON.stringify(mergedLook);
    return cached(key, () => {
      const frames = { 0: [], 1: [], 2: [], 3: [] };
      for (let frame = 0; frame < 3; frame++) {
        // down
        let c = cvs(24, 32);
        drawCharacterBase(c.getContext('2d'), 0, frame, p, flags);
        frames[0][frame] = rimLight(outline(c, '#241c2b'));
        // right
        c = cvs(24, 32);
        drawCharacterBase(c.getContext('2d'), 2, frame, p, flags);
        const right = outline(c, '#241c2b');
        const left = mirror(right);
        frames[2][frame] = rimLight(right);
        // left = miroir du sprite non éclairé, puis lumière de contour
        frames[1][frame] = rimLight(left);
        // up
        c = cvs(24, 32);
        drawCharacterBase(c.getContext('2d'), 3, frame, p, flags);
        frames[3][frame] = rimLight(outline(c, '#241c2b'));
      }
      return { frames, look: mergedLook };
    });
  };

  Art.playerSheet = function (look) { return Art.buildCharacter(look, {}); };
  Art.npcSheet = function (look) { return Art.buildCharacter(look, { robe: look.robe, apron: look.apron, armor: look.armor }); };

  /* ------------------------------------------------------------
     Icônes d'objets
     ------------------------------------------------------------ */
  function itemMetal(tier, rarity) {
    if (rarity === 'legendary') return ['#ffe08a', '#c89a3d', '#7a5a22'];
    const metals = [
      ['#d3d8dc', '#929ca4', '#5d666c'],
      ['#d8d8ce', '#a6a189', '#68634f'],
      ['#d9c78c', '#a88f56', '#6e5b35'],
      ['#c2cfda', '#8598a8', '#536570'],
      ['#dce9f4', '#9bbbd0', '#5b7d93'],
      ['#d8a07a', '#a86d4d', '#6d4532']
    ];
    return metals[tier] || metals[0];
  }

  Art.gearIcon = function (gearId) {
    const g = D.GEAR_BY_ID[gearId];
    if (!g) return Art.smallIcon('unknown');
    return cached('gear-icon:' + gearId + ':' + (g.rarity), () => {
      const c = cvs(22, 22), ctx = c.getContext('2d');
      const [metal, mid, dark] = itemMetal(g.tier, g.rarity);
      const rc = D.RARITIES[g.rarity].color;
      const wood = '#7c5636', woodD = '#543924';
      if (g.slot === 'weapon') {
        const st = g.style;
        if (st === 'slash' || st === 'stab') {
          // lame diagonale
          if (st === 'stab') {
            line(ctx, 5, 17, 16, 6, metal, 2); line(ctx, 5, 17, 16, 6, mid, 1);
            line(ctx, 15, 7, 17, 5, '#f5f2dc', 1);
            R(ctx, 4, 16, 4, 2, wood); R(ctx, 4, 18, 2, 2, woodD);
            ctx.fillStyle = rc; ctx.fillRect(5, 15, 2, 2);
            // seconde dague
            line(ctx, 7, 6, 16, 15, metal, 1);
            R(ctx, 5, 5, 3, 2, wood);
          } else {
            line(ctx, 5, 17, 16, 4, metal, 3);
            line(ctx, 5, 17, 16, 4, mid, 1);
            line(ctx, 15, 5, 18, 3, '#f2efdd', 1);
            R(ctx, 3, 16, 5, 2, '#d1a74d'); R(ctx, 3, 18, 2, 2, woodD);
            R(ctx, 4, 15, 2, 2, rc);
          }
        } else if (st === 'heavy') {
          line(ctx, 6, 18, 15, 7, wood, 2);
          line(ctx, 14, 4, 19, 9, metal, 3);
          line(ctx, 16, 5, 18, 7, mid, 2);
          line(ctx, 18, 4, 19, 10, '#eef2ea', 1);
          R(ctx, 13, 8, 4, 2, dark);
          ctx.fillStyle = rc; ctx.fillRect(7, 15, 2, 2);
        } else if (st === 'thrust') {
          line(ctx, 4, 18, 17, 4, wood, 2);
          R(ctx, 15, 2, 3, 4, metal); R(ctx, 17, 1, 2, 2, '#f4f0d7');
          R(ctx, 14, 5, 2, 2, mid);
          ctx.fillStyle = rc; ctx.fillRect(9, 13, 2, 2);
        } else if (st === 'bow') {
          ctx.strokeStyle = wood; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(9, 11, 8, -Math.PI / 2.8, Math.PI / 2.8); ctx.stroke();
          ctx.strokeStyle = '#eee6c9'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(12, 3); ctx.lineTo(12, 19); ctx.stroke();
          line(ctx, 5, 11, 18, 11, mid, 1);
          R(ctx, 17, 10, 2, 2, metal); R(ctx, 4, 10, 2, 3, rc);
        } else if (st === 'crossbow') {
          R(ctx, 7, 15, 10, 2, wood);
          line(ctx, 3, 11, 19, 11, metal, 2);
          line(ctx, 11, 10, 11, 4, woodD, 2);
          R(ctx, 10, 2, 3, 4, metal); ctx.fillStyle = rc; ctx.fillRect(11, 6, 1, 2);
          R(ctx, 5, 9, 2, 2, woodD); R(ctx, 16, 9, 2, 2, woodD);
        } else if (st === 'blowgun') {
          line(ctx, 3, 18, 18, 5, wood, 2);
          line(ctx, 18, 5, 20, 3, metal, 1);
          R(ctx, 4, 16, 3, 2, rc); R(ctx, 14, 8, 2, 2, '#8abf5e');
        } else {
          // bâton magique
          line(ctx, 5, 19, 14, 7, wood, 2);
          E(ctx, 16, 5, 3, 3, metal); E(ctx, 16, 5, 2, 2, rc);
          R(ctx, 15, 2, 1, 1, '#fff4c7'); R(ctx, 18, 7, 1, 1, '#fff4c7');
          R(ctx, 10, 11, 2, 2, woodD);
        }
      } else if (g.slot === 'helm') {
        // casque vu de face
        R(ctx, 4, 5, 14, 11, metal);
        R(ctx, 5, 4, 12, 3, mid);
        R(ctx, 6, 7, 10, 7, mid);
        R(ctx, 7, 8, 8, 5, dark);
        R(ctx, 6, 6, 2, 4, '#f2f4ef');
        R(ctx, 14, 6, 2, 4, U.shade(mid, -18));
        R(ctx, 3, 12, 16, 3, dark);
        R(ctx, 8, 12, 6, 3, metal);
        ctx.fillStyle = rc; ctx.fillRect(10, 5, 2, 2);
        R(ctx, 9, 2, 4, 3, metal); R(ctx, 10, 1, 2, 2, mid);
      } else if (g.slot === 'boots') {
        // paire de bottes
        R(ctx, 3, 6, 6, 9, metal); R(ctx, 13, 6, 6, 9, metal);
        R(ctx, 4, 7, 4, 5, mid); R(ctx, 14, 7, 4, 5, mid);
        R(ctx, 3, 14, 7, 4, dark); R(ctx, 12, 14, 7, 4, dark);
        R(ctx, 2, 17, 9, 2, mid); R(ctx, 11, 17, 9, 2, mid);
        R(ctx, 4, 15, 5, 1, U.shade(mid, 18)); R(ctx, 13, 15, 5, 1, U.shade(mid, 18));
        R(ctx, 4, 6, 4, 1, metal); R(ctx, 14, 6, 4, 1, metal);
        ctx.fillStyle = rc; ctx.fillRect(5, 8, 2, 2); ctx.fillRect(15, 8, 2, 2);
        R(ctx, 5, 2, 4, 4, mid); R(ctx, 14, 2, 4, 4, mid);
        R(ctx, 6, 1, 2, 2, metal); R(ctx, 15, 1, 2, 2, metal);
      } else {
        // talisman
        const gem = rc;
        line(ctx, 6, 20, 11, 10, '#c7a755', 1);
        line(ctx, 16, 20, 11, 10, '#c7a755', 1);
        R(ctx, 7, 4, 8, 6, metal);
        R(ctx, 6, 5, 10, 4, mid);
        E(ctx, 11, 7, 3, 3, gem);
        R(ctx, 10, 6, 1, 1, '#fff8d8');
        R(ctx, 10, 11, 2, 2, '#e5d38b');
      }
      // reflet + éclat de rareté
      ctx.fillStyle = rc; ctx.globalAlpha = 0.9;
      ctx.fillRect(1, 1, 1, 1); ctx.globalAlpha = 1;
      return outline(c, '#241c2b');
    });
  };

  Art.potionIcon = function (id) {
    return cached('potion-icon:' + id, () => {
      const c = cvs(16, 16), ctx = c.getContext('2d');
      const col = (D.POTIONS[id] && D.POTIONS[id].color) || '#e34f7a';
      R(ctx, 6, 1, 4, 3, '#cfd7d8');
      R(ctx, 7, 4, 2, 2, '#8e9a9b');
      R(ctx, 4, 6, 8, 8, '#e8f0ef');
      R(ctx, 5, 8, 6, 5, col);
      R(ctx, 5, 8, 2, 2, U.shade(col, 28));
      R(ctx, 3, 7, 1, 5, '#9daaaa'); R(ctx, 12, 7, 1, 5, '#9daaaa');
      R(ctx, 7, 0, 1, 1, '#fff6dc');
      return outline(c, '#28202e');
    });
  };

  Art.materialIcon = function (materialId) {
    const m = D.MATERIALS[materialId];
    if (!m) return Art.smallIcon('unknown');
    return cached('material-icon:' + materialId, () => {
      const c = cvs(20, 20), ctx = c.getContext('2d');
      const C = m.color, S = m.shade, L = U.shade(C, 28);
      if (m.shape === 'feather') {
        line(ctx, 4, 17, 14, 4, L, 1);
        line(ctx, 5, 15, 15, 6, C, 3);
        line(ctx, 6, 14, 8, 16, S, 1); line(ctx, 8, 11, 10, 13, S, 1); line(ctx, 10, 9, 12, 11, S, 1);
        R(ctx, 14, 3, 2, 2, L);
      } else if (m.shape === 'fiber') {
        for (let i = 0; i < 4; i++) {
          line(ctx, 4 + i * 3, 17, 7 + i * 2, 3, i % 2 ? S : C, 1);
          line(ctx, 6 + i * 2, 14, 9 + i, 5, L, 1);
        }
      } else if (m.shape === 'pollen') {
        for (const [x, y, r] of [[6, 7, 2], [12, 6, 2], [9, 12, 2], [14, 11, 1], [4, 13, 1]]) {
          E(ctx, x, y, r + 1, r + 1, S); E(ctx, x, y, r, r, C); R(ctx, x - 1, y - 1, 1, 1, L);
        }
      } else if (m.shape === 'metal') {
        R(ctx, 3, 7, 14, 8, S); R(ctx, 4, 6, 12, 7, C); R(ctx, 5, 6, 8, 2, L);
        R(ctx, 6, 10, 8, 1, S); R(ctx, 3, 14, 14, 2, U.shade(S, -18));
      } else if (m.shape === 'essence') {
        R(ctx, 7, 2, 6, 3, S); R(ctx, 8, 4, 4, 3, L);
        E(ctx, 10, 13, 6, 5, S); E(ctx, 10, 13, 5, 4, C); E(ctx, 10, 12, 3, 2, L);
        R(ctx, 8, 7, 1, 2, '#f4f0e0');
      } else if (m.shape === 'silk') {
        E(ctx, 10, 8, 5, 4, S); E(ctx, 10, 8, 4, 3, C); R(ctx, 6, 8, 8, 1, S);
        line(ctx, 4, 15, 15, 14, C, 1); line(ctx, 6, 17, 13, 16, S, 1);
        R(ctx, 9, 7, 2, 1, L);
      } else if (m.shape === 'glow') {
        E(ctx, 10, 10, 7, 7, S); E(ctx, 10, 10, 5, 5, C); E(ctx, 10, 9, 3, 3, L);
        R(ctx, 8, 6, 1, 1, '#ffffff'); R(ctx, 4, 13, 1, 1, C); R(ctx, 16, 6, 1, 1, C);
      } else if (m.shape === 'fur') {
        E(ctx, 10, 12, 6, 4, S);
        for (let i = 0; i < 5; i++) line(ctx, 5 + i * 2, 13, 4 + i * 3, 4 + (i % 2), i % 2 ? C : L, 1);
        R(ctx, 5, 11, 10, 3, C); R(ctx, 7, 11, 5, 1, L);
      } else if (m.shape === 'crystal') {
        line(ctx, 10, 2, 16, 8, C, 3); line(ctx, 16, 8, 12, 17, S, 3); line(ctx, 12, 17, 5, 9, S, 2); line(ctx, 5, 9, 10, 2, L, 2);
        line(ctx, 10, 4, 11, 14, '#e8fbff', 1); R(ctx, 9, 6, 1, 2, '#ffffff');
      } else if (m.shape === 'wing') {
        line(ctx, 4, 15, 8, 5, S, 2); line(ctx, 8, 5, 16, 4, C, 2); line(ctx, 8, 8, 14, 9, S, 2);
        line(ctx, 8, 11, 12, 14, C, 1); R(ctx, 7, 4, 2, 2, L);
      } else if (m.shape === 'ash') {
        line(ctx, 10, 17, 10, 11, '#5c3a2c', 2);
        E(ctx, 10, 9, 5, 6, S); E(ctx, 10, 8, 3, 4, C); E(ctx, 10, 7, 1, 2, '#ffe5a0');
        R(ctx, 5, 5, 1, 1, C); R(ctx, 15, 8, 1, 1, C);
      } else {
        // éclat
        line(ctx, 10, 2, 15, 10, C, 3); line(ctx, 15, 10, 8, 17, S, 3); line(ctx, 8, 17, 5, 8, S, 2); line(ctx, 5, 8, 10, 2, L, 2);
        R(ctx, 9, 5, 1, 3, '#fff6c7');
      }
      return outline(c, '#241c2b');
    });
  };

  Art.smallIcon = function (kind) {
    return cached('small:' + kind, () => {
      const c = cvs(12, 12), ctx = c.getContext('2d');
      if (kind === 'coin') {
        E(ctx, 6, 6, 5, 5, '#f1c64f'); E(ctx, 6, 6, 3, 3, '#d6a32e');
        R(ctx, 5, 4, 2, 4, '#ffe790'); R(ctx, 6, 3, 1, 6, '#ffe790');
      } else if (kind === 'heart') {
        R(ctx, 2, 3, 3, 2, '#e45c6b'); R(ctx, 7, 3, 3, 2, '#e45c6b');
        R(ctx, 2, 4, 8, 3, '#e45c6b'); R(ctx, 3, 7, 6, 2, '#e45c6b'); R(ctx, 4, 9, 4, 1, '#e45c6b');
        R(ctx, 3, 4, 2, 1, '#ff9aa4');
      } else if (kind === 'stamina') {
        R(ctx, 6, 1, 3, 4, '#7fe0c4'); R(ctx, 3, 4, 6, 4, '#7fe0c4'); R(ctx, 3, 8, 3, 2, '#7fe0c4');
      } else if (kind === 'xp') {
        R(ctx, 5, 1, 2, 10, '#c891ff'); R(ctx, 1, 5, 10, 2, '#c891ff');
        R(ctx, 3, 3, 1, 1, '#ecd9ff'); R(ctx, 8, 8, 1, 1, '#ecd9ff');
      } else if (kind === 'shield') {
        R(ctx, 3, 1, 6, 2, '#9fb6c4'); R(ctx, 2, 3, 8, 5, '#9fb6c4'); R(ctx, 3, 8, 6, 2, '#7e98a8'); R(ctx, 5, 10, 2, 1, '#7e98a8');
      } else if (kind === 'bag') {
        R(ctx, 2, 4, 8, 7, '#b98651'); R(ctx, 3, 3, 2, 2, '#7d5532'); R(ctx, 7, 3, 2, 2, '#7d5532'); R(ctx, 4, 6, 4, 1, '#e0b67e');
      } else if (kind === 'map') {
        R(ctx, 1, 2, 10, 8, '#eee1bd'); R(ctx, 2, 3, 2, 6, '#9fc474'); R(ctx, 5, 4, 2, 5, '#c6d59a'); R(ctx, 8, 3, 2, 6, '#e5c57d'); R(ctx, 4, 5, 1, 1, '#ba5d4d'); R(ctx, 8, 7, 1, 1, '#ba5d4d');
      } else if (kind === 'sword') {
        line(ctx, 3, 9, 9, 2, '#d4dde3', 2); R(ctx, 2, 8, 3, 2, '#b58a45');
      } else if (kind === 'potion') {
        R(ctx, 5, 1, 2, 2, '#d1dadb'); R(ctx, 3, 3, 6, 7, '#e7efee'); R(ctx, 4, 5, 4, 4, '#e34f7a');
      } else if (kind === 'clock') {
        E(ctx, 6, 6, 5, 5, '#e6dcc9'); E(ctx, 6, 6, 4, 4, '#8a9bab'); R(ctx, 6, 3, 1, 4, '#f3eddc'); R(ctx, 6, 6, 3, 1, '#f3eddc');
      } else if (kind === 'skull') {
        R(ctx, 3, 2, 6, 5, '#e5e1d4'); R(ctx, 4, 7, 4, 2, '#c8c1b0'); R(ctx, 4, 4, 1, 2, '#3b3340'); R(ctx, 7, 4, 1, 2, '#3b3340'); R(ctx, 5, 8, 1, 1, '#3b3340'); R(ctx, 7, 8, 1, 1, '#3b3340');
      } else {
        R(ctx, 2, 2, 8, 8, '#d36a6a'); R(ctx, 4, 4, 4, 4, '#3b2a3d');
      }
      return outline(c, '#28202e');
    });
  };

  Art.bossAuraColor = function (boss) {
    return (boss && boss.colors && boss.colors.eye) || '#ffd15c';
  };

  window.Art = Art;
  window.__ART_BASE_READY__ = true;
})();
