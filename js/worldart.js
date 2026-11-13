/* ============================================================
   LES LÉGENDES D'AURORE — art du monde
   Tuiles, chemins, eau, décors naturels, sols d'arènes
   ============================================================ */
(function () {
  'use strict';
  const U = window.U, Art = window.Art;
  const cvs = Art.cvs, R = Art.R, E = Art.E, line = Art.line;

  const GROUND_PAL = {
    plains: {
      base: '#6fb552', alt: '#78bd5b', dark: '#5a9c44', deep: '#4b853b', light: '#8bce6b',
      detail: '#4c8a3b', flower: '#f4e486', flower2: '#f7f3e2', path: '#c6a166', pathDark: '#9b784a', edge: '#4e813b', water: '#4f9bc1'
    },
    forest: {
      base: '#4d8b4c', alt: '#569650', dark: '#3d7642', deep: '#2f5f38', light: '#6aab5b',
      detail: '#335f39', flower: '#d7c477', flower2: '#a8d6a0', path: '#a18255', pathDark: '#7b603d', edge: '#2f5d35', water: '#3f7d8f'
    },
    desert: {
      base: '#dcbb74', alt: '#e4c47f', dark: '#c4a15d', deep: '#a9864a', light: '#f0d595',
      detail: '#b89052', flower: '#a7c96a', flower2: '#f4e9c8', path: '#d0a765', pathDark: '#aa8148', edge: '#b18d50', water: '#4c9dab'
    },
    swamp: {
      base: '#697d4e', alt: '#728654', dark: '#566a42', deep: '#435337', light: '#849766',
      detail: '#4a5f3a', flower: '#b4c56c', flower2: '#d7d58f', path: '#8c7951', pathDark: '#695b3c', edge: '#445637', water: '#4a6656'
    },
    tundra: {
      base: '#dbe8ee', alt: '#e5f0f4', dark: '#c3d6df', deep: '#a6bdca', light: '#f6fbfd',
      detail: '#b3cbd6', flower: '#c8e4ef', flower2: '#ffffff', path: '#b8b3a4', pathDark: '#8f8b7d', edge: '#b6ccd5', water: '#8dc3d4'
    },
    volcano: {
      base: '#5d4c48', alt: '#66534e', dark: '#4b3c3a', deep: '#3b2e2e', light: '#78605a',
      detail: '#7c5142', flower: '#d96a3a', flower2: '#ffcf6a', path: '#6e5a4e', pathDark: '#4d3f38', edge: '#3e3130', water: '#3c6b72'
    }
  };
  Art.GROUND_PAL = GROUND_PAL;

  Art.groundTile = function (biome, variant) {
    return Art.cached('ground:' + biome + ':' + variant, () => {
      const p = GROUND_PAL[biome] || GROUND_PAL.plains;
      const c = cvs(16, 16), ctx = c.getContext('2d');
      R(ctx, 0, 0, 16, 16, p.base);
      // petites variations de ton
      const rng = U.mulberry32(U.hashString('ground' + biome + variant));
      for (let i = 0; i < 22; i++) {
        const x = Math.floor(rng() * 16), y = Math.floor(rng() * 16);
        ctx.fillStyle = rng() < 0.5 ? p.alt : p.dark;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(x, y, rng() < 0.3 ? 2 : 1, 1);
      }
      ctx.globalAlpha = 1;
      if (biome === 'plains') {
        for (let i = 0; i < 3; i++) {
          const x = 2 + Math.floor(rng() * 12), y = 3 + Math.floor(rng() * 10);
          R(ctx, x, y, 1, 3, p.detail); R(ctx, x - 1, y, 1, 2, p.light); R(ctx, x + 1, y + 1, 1, 2, p.detail);
        }
        if (variant === 1) { R(ctx, 11, 5, 2, 1, p.flower); R(ctx, 12, 4, 1, 3, p.flower2); R(ctx, 11, 9, 1, 1, p.flower2); }
        if (variant === 3) { R(ctx, 4, 11, 2, 2, p.flower2); R(ctx, 5, 10, 1, 1, p.flower); }
      } else if (biome === 'forest') {
        for (let i = 0; i < 4; i++) {
          R(ctx, Math.floor(rng() * 14), Math.floor(rng() * 14), 1, 2, p.deep);
        }
        if (variant === 0) { R(ctx, 3, 9, 3, 2, '#7e5b3d'); R(ctx, 4, 8, 1, 1, p.light); }
        if (variant === 2) { R(ctx, 10, 12, 2, 1, '#c8b56e'); R(ctx, 11, 11, 1, 1, '#e1d59b'); }
      } else if (biome === 'desert') {
        for (let i = 0; i < 3; i++) {
          const y = 3 + Math.floor(rng() * 11);
          R(ctx, 2 + Math.floor(rng() * 8), y, 3, 1, p.dark);
        }
        if (variant === 0) { R(ctx, 4, 11, 2, 1, p.deep); R(ctx, 9, 3, 1, 1, p.flower2); }
        if (variant === 3) { R(ctx, 10, 6, 3, 1, '#d9cba4'); R(ctx, 11, 5, 1, 2, '#efe5c9'); }
      } else if (biome === 'swamp') {
        if (variant % 2 === 0) {
          R(ctx, 3, 5, 6, 3, '#526b52'); R(ctx, 4, 5, 3, 1, '#6e8965');
        }
        for (let i = 0; i < 3; i++) {
          R(ctx, Math.floor(rng() * 14), 12 + Math.floor(rng() * 3), 1, 2, p.detail);
        }
        if (variant === 1) { R(ctx, 8, 3, 1, 1, '#d5e890'); R(ctx, 9, 2, 1, 1, '#9fc36c'); }
      } else if (biome === 'tundra') {
        for (let i = 0; i < 4; i++) {
          R(ctx, Math.floor(rng() * 15), Math.floor(rng() * 14), 2, 1, p.dark);
        }
        if (variant === 1) { R(ctx, 4, 7, 1, 1, p.flower2); R(ctx, 11, 3, 1, 1, p.flower2); }
        if (variant === 3) { R(ctx, 8, 10, 4, 1, p.light); }
      } else if (biome === 'volcano') {
        if (variant === 1 || variant === 3) {
          line(ctx, 3, 11, 8, 7, '#3f3030', 1); line(ctx, 8, 7, 12, 9, '#3f3030', 1);
          R(ctx, 8, 7, 2, 1, '#c15a35');
        }
        R(ctx, 4, 3, 1, 1, p.detail); R(ctx, 12, 12, 1, 1, p.detail);
        if (variant === 2) { R(ctx, 10, 4, 2, 1, '#f0a047'); R(ctx, 11, 3, 1, 1, '#ffd26a'); }
      }
      // bord léger
      ctx.globalAlpha = 0.16; R(ctx, 0, 0, 16, 1, p.light); ctx.globalAlpha = 1;
      return c;
    });
  };

  function maskHas(mask, bit) { return (mask & bit) !== 0; }

  Art.pathTile = function (biome, mask) {
    return Art.cached('path:' + biome + ':' + mask, () => {
      const p = GROUND_PAL[biome] || GROUND_PAL.plains;
      const c = cvs(16, 16), ctx = c.getContext('2d');
      // sol de chemin
      R(ctx, 0, 0, 16, 16, p.path);
      const rng = U.mulberry32(U.hashString('path' + biome + mask));
      for (let i = 0; i < 18; i++) {
        R(ctx, Math.floor(rng() * 15), Math.floor(rng() * 15), rng() < 0.3 ? 2 : 1, 1, rng() < 0.5 ? U.shade(p.path, 14) : p.pathDark);
      }
      // gravier
      R(ctx, 4, 5, 1, 1, p.pathDark); R(ctx, 10, 9, 2, 1, p.pathDark); R(ctx, 7, 12, 1, 1, U.shade(p.path, 16));
      // bords non connectés
      const edges = [
        { bit: 1, x: 0, y: 0, w: 16, h: 2, dir: 'n' },
        { bit: 2, x: 14, y: 0, w: 2, h: 16, dir: 'e' },
        { bit: 4, x: 0, y: 14, w: 16, h: 2, dir: 's' },
        { bit: 8, x: 0, y: 0, w: 2, h: 16, dir: 'w' }
      ];
      edges.forEach((e, idx) => {
        if (!maskHas(mask, e.bit)) {
          if (e.dir === 'n' || e.dir === 's') {
            const y0 = e.dir === 'n' ? 0 : 14;
            ctx.clearRect(0, y0, 16, 2);
            R(ctx, 0, e.dir === 'n' ? 2 : 13, 16, 1, p.pathDark);
            for (let x = 0; x < 16; x += 3) {
              const yy = y0 + (U.hash2(x, mask, 7) > 0.5 ? 0 : 1);
              R(ctx, x, yy, 2, 1, p.edge);
            }
          } else {
            const x0 = e.dir === 'w' ? 0 : 14;
            ctx.clearRect(x0, 0, 2, 16);
            R(ctx, e.dir === 'w' ? 2 : 13, 0, 1, 16, p.pathDark);
            for (let y = 0; y < 16; y += 3) {
              const xx = x0 + (U.hash2(y, mask, 8) > 0.5 ? 0 : 1);
              R(ctx, xx, y, 1, 2, p.edge);
            }
          }
        }
      });
      // coins arrondis si deux bords consécutifs absents
      const corners = [
        { a: 1, b: 2, x: 14, y: 0 },
        { a: 2, b: 4, x: 14, y: 14 },
        { a: 4, b: 8, x: 0, y: 14 },
        { a: 8, b: 1, x: 0, y: 0 }
      ];
      corners.forEach(cn => {
        if (!maskHas(mask, cn.a) && !maskHas(mask, cn.b)) {
          ctx.clearRect(cn.x, cn.y, 2, 2);
        }
      });
      return c;
    });
  };

  Art.waterTile = function (biome, mask, frame) {
    return Art.cached('water:' + biome + ':' + mask + ':' + frame, () => {
      const p = GROUND_PAL[biome] || GROUND_PAL.plains;
      const water = p.water;
      const dark = U.shade(water, -28);
      const light = U.shade(water, 38);
      const c = cvs(16, 16), ctx = c.getContext('2d');
      R(ctx, 0, 0, 16, 16, water);
      for (let i = 0; i < 8; i++) {
        R(ctx, (i * 5 + frame * 2) % 16, (i * 7 + 3) % 16, 3, 1, dark);
      }
      R(ctx, 2 + frame * 2, 4, 3, 1, light);
      R(ctx, 9 - frame, 11, 4, 1, light);
      R(ctx, 5, 8 + frame, 2, 1, light);
      // écume sur les bords non connectés
      const edge = U.shade(water, 52);
      if (!maskHas(mask, 1)) { R(ctx, 0, 0, 16, 1, edge); R(ctx, 2, 1, 3, 1, edge); R(ctx, 9, 1, 2, 1, edge); }
      if (!maskHas(mask, 2)) { R(ctx, 15, 0, 1, 16, edge); R(ctx, 14, 3, 1, 4, edge); R(ctx, 14, 11, 1, 2, edge); }
      if (!maskHas(mask, 4)) { R(ctx, 0, 15, 16, 1, edge); R(ctx, 4, 14, 2, 1, edge); R(ctx, 12, 14, 2, 1, edge); }
      if (!maskHas(mask, 8)) { R(ctx, 0, 0, 1, 16, edge); R(ctx, 1, 5, 1, 3, edge); R(ctx, 1, 12, 1, 2, edge); }
      // nénuphars / glace
      if (biome === 'swamp' && ((mask === 0 && frame === 0) || (mask === 15 && frame === 1))) {
        E(ctx, 10, 6, 3, 2, '#5e8a52'); R(ctx, 10, 6, 1, 1, '#b7d17a');
      }
      if (biome === 'tundra') {
        R(ctx, 3, 9, 6, 1, '#dff4f8'); R(ctx, 12, 3, 2, 1, '#e9fbff');
      }
      return c;
    });
  };

  Art.lavaTile = function (mask, frame) {
    return Art.cached('lava:' + mask + ':' + frame, () => {
      const c = cvs(16, 16), ctx = c.getContext('2d');
      R(ctx, 0, 0, 16, 16, '#b94325');
      for (let i = 0; i < 7; i++) {
        R(ctx, (i * 4 + frame * 2) % 16, (i * 5 + 2) % 16, 3, 1, '#dd6230');
      }
      R(ctx, 2 + frame * 2, 3, 4, 1, '#ffa53e');
      R(ctx, 9, 10 - frame, 3, 1, '#ffc451');
      R(ctx, 4, 12, 1, 1, '#ffe285');
      const crust = '#4b3532';
      if (!maskHas(mask, 1)) R(ctx, 0, 0, 16, 2, crust);
      if (!maskHas(mask, 2)) R(ctx, 14, 0, 2, 16, crust);
      if (!maskHas(mask, 4)) R(ctx, 0, 14, 16, 2, crust);
      if (!maskHas(mask, 8)) R(ctx, 0, 0, 2, 16, crust);
      if (!maskHas(mask, 1)) R(ctx, 3, 2, 2, 1, '#73423a');
      if (!maskHas(mask, 4)) R(ctx, 10, 13, 3, 1, '#73423a');
      return c;
    });
  };

  Art.bridgeTile = function (mask, vertical) {
    return Art.cached('bridge:' + mask + ':' + vertical, () => {
      const c = cvs(16, 16), ctx = c.getContext('2d');
      R(ctx, 0, 0, 16, 16, '#86613d');
      if (vertical) {
        for (let y = 0; y < 16; y += 4) {
          R(ctx, 0, y, 16, 1, '#5e432c'); R(ctx, 0, y + 1, 16, 1, '#9f784e');
          R(ctx, 4, y, 1, 3, '#6d4d31'); R(ctx, 11, y, 1, 3, '#6d4d31');
        }
        if (!maskHas(mask, 8)) R(ctx, 0, 0, 1, 16, '#4b3527');
        if (!maskHas(mask, 2)) R(ctx, 15, 0, 1, 16, '#4b3527');
      } else {
        for (let x = 0; x < 16; x += 4) {
          R(ctx, x, 0, 1, 16, '#5e432c'); R(ctx, x + 1, 0, 1, 16, '#9f784e');
          R(ctx, x, 4, 3, 1, '#6d4d31'); R(ctx, x, 11, 3, 1, '#6d4d31');
        }
        if (!maskHas(mask, 1)) R(ctx, 0, 0, 16, 1, '#4b3527');
        if (!maskHas(mask, 4)) R(ctx, 0, 15, 16, 1, '#4b3527');
      }
      R(ctx, 3, 6, 1, 1, '#b18b5e'); R(ctx, 12, 12, 1, 1, '#b18b5e');
      return c;
    });
  };

  /* ------------------------------------------------------------
     Décors naturels
     ------------------------------------------------------------ */
  function deco(key, w, h, drawFn, outlineColor) {
    return Art.cached('deco:' + key, () => {
      const c = cvs(w, h);
      drawFn(c.getContext('2d'), w, h);
      return Art.outline(c, outlineColor || '#2b2230');
    });
  }
  Art.deco = deco;

  Art.tree = function (kind, variant) {
    return deco('tree:' + kind + ':' + variant, 44, 56, (ctx, w, h) => {
      const snow = kind === 'pine_snow';
      const forest = kind === 'forest';
      const pine = kind === 'pine' || snow;
      const rng = U.mulberry32(700 + variant * 7);
      // ombre
      ctx.globalAlpha = 0.18; E(ctx, 22, 52, 17, 4, '#182018'); ctx.globalAlpha = 1;
      // tronc
      R(ctx, 19, 36, 6, 17, '#6b4a2f'); R(ctx, 20, 36, 2, 15, '#8a6341'); R(ctx, 24, 39, 1, 13, '#4d3422');
      R(ctx, 15, 52, 6, 3, '#5a3f2a'); R(ctx, 25, 52, 6, 3, '#5a3f2a');
      if (pine) {
        const dark = forest ? '#2f5c3a' : '#3e6b4b';
        const mid = forest ? '#3f7546' : '#54875a';
        const light = snow ? '#e9f3f5' : (forest ? '#5b9355' : '#73a76b');
        for (let i = 0; i < 4; i++) {
          const y = 6 + i * 9;
          const half = 6 + i * 4;
          E(ctx, 22, y + 7, half, 5, dark);
          E(ctx, 22, y + 5, half - 2, 4, mid);
          if (snow) {
            R(ctx, 22 - half + 2, y + 4, half * 2 - 4, 2, light);
            R(ctx, 12 + i * 2, y + 7, 6, 1, light);
          } else {
            R(ctx, 15 + i * 2, y + 5, 5, 1, light);
          }
        }
        R(ctx, 20, 0, 5, 7, dark); R(ctx, 22, 0, 2, 5, mid);
        if (snow) { R(ctx, 21, 1, 3, 2, light); R(ctx, 10, 35, 3, 1, light); R(ctx, 31, 25, 2, 1, light); }
      } else {
        const crown = kind === 'forest' ? ['#2f6138', '#427b43', '#5b9650', '#75ab5d'] : ['#3d7b3e', '#4d9148', '#6cae57', '#8bc76a'];
        E(ctx, 22, 24, 18, 15, crown[0]);
        E(ctx, 15, 22, 10, 10, crown[1]);
        E(ctx, 28, 20, 10, 11, crown[1]);
        E(ctx, 20, 16, 12, 10, crown[1]);
        E(ctx, 17, 18, 7, 6, crown[2]);
        E(ctx, 27, 24, 7, 6, crown[2]);
        E(ctx, 22, 13, 8, 5, crown[2]);
        R(ctx, 12, 22, 4, 2, crown[3]); R(ctx, 28, 14, 3, 2, crown[3]); R(ctx, 19, 10, 3, 1, crown[3]);
        for (let i = 0; i < 7; i++) {
          R(ctx, 8 + Math.floor(rng() * 27), 11 + Math.floor(rng() * 23), 1, 2, crown[i % 2 ? 2 : 1]);
        }
        if (variant === 1) { R(ctx, 12, 32, 2, 2, '#e4c25a'); R(ctx, 31, 27, 1, 1, '#f2e4bc'); }
      }
    }, '#29212d');
  };

  Art.bush = function (kind) {
    return deco('bush:' + kind, 24, 20, (ctx, w, h) => {
      const snow = kind === 'snow';
      const forest = kind === 'forest';
      const base = snow ? '#b9d0d8' : forest ? '#3f713f' : '#4e8b43';
      const light = snow ? '#eef8fa' : forest ? '#5b8f4f' : '#6ca958';
      const dark = snow ? '#8daab6' : forest ? '#2d5433' : '#386e34';
      E(ctx, 12, 14, 10, 6, dark);
      E(ctx, 11, 11, 8, 6, base);
      E(ctx, 8, 10, 4, 4, light); E(ctx, 16, 12, 3, 3, light);
      R(ctx, 6, 14, 2, 1, base); R(ctx, 17, 8, 2, 1, light);
      if (snow) { R(ctx, 7, 7, 8, 2, '#f5fbfd'); }
      if (forest) { R(ctx, 9, 15, 1, 1, '#d7c068'); }
    }, '#28222e');
  };

  Art.rock = function (kind, variant) {
    return deco('rock:' + kind + ':' + variant, 26, 21, (ctx, w, h) => {
      const palettes = {
        plains: ['#8b8b84', '#a8a89f', '#676a64', '#c0c1b8'],
        forest: ['#777a6a', '#959a86', '#575c4d', '#b0b5a0'],
        desert: ['#b99a65', '#d3b47d', '#917547', '#e7d29d'],
        swamp: ['#6f765d', '#8a9170', '#535946', '#aab089'],
        tundra: ['#9fb5c0', '#c4d9e4', '#76909e', '#edfaff'],
        volcano: ['#5a4b49', '#77645f', '#413431', '#94756a']
      };
      const pal = palettes[kind] || palettes.plains;
      E(ctx, 13, 16, 11, 4, pal[2]);
      E(ctx, 12, 12, 9, 6, pal[0]);
      E(ctx, 9, 10, 4, 3, pal[1]);
      R(ctx, 7, 9, 4, 2, pal[3]); R(ctx, 16, 12, 3, 1, pal[1]);
      R(ctx, 10, 15, 2, 1, pal[2]); R(ctx, 18, 15, 1, 1, pal[2]);
      if (kind === 'tundra') { R(ctx, 8, 9, 6, 1, '#f4fdff'); R(ctx, 15, 12, 3, 1, '#dff5fb'); }
      if (kind === 'volcano') { R(ctx, 12, 11, 4, 1, '#d45a35'); R(ctx, 15, 12, 1, 3, '#d45a35'); }
      if (kind === 'swamp') { R(ctx, 6, 17, 3, 1, '#91a779'); R(ctx, 14, 10, 2, 1, '#a9b88f'); }
      if (variant === 1) { R(ctx, 5, 17, 2, 1, pal[1]); }
    }, '#2a232c');
  };

  Art.cactus = function (variant) {
    return deco('cactus:' + variant, 27, 41, (ctx, w, h) => {
      R(ctx, 11, 6, 8, 32, '#5b954d');
      R(ctx, 13, 7, 3, 29, '#77b461');
      R(ctx, 17, 8, 1, 29, '#47783d');
      R(ctx, 10, 33, 10, 3, '#4c7c3e');
      if (variant % 2 === 0) {
        R(ctx, 3, 17, 8, 5, '#5b954d'); R(ctx, 3, 11, 4, 9, '#5b954d');
        R(ctx, 4, 12, 2, 7, '#77b461'); R(ctx, 4, 20, 6, 2, '#47783d');
      }
      if (variant % 3 === 0) {
        R(ctx, 19, 22, 7, 4, '#5b954d'); R(ctx, 23, 15, 4, 9, '#5b954d');
        R(ctx, 21, 24, 5, 1, '#47783d');
      }
      for (let i = 0; i < 6; i++) R(ctx, 10 + (i * 3) % 10, 9 + i * 4, 1, 1, '#d8e5ab');
      if (variant === 1) { R(ctx, 15, 3, 3, 3, '#e5b34c'); R(ctx, 16, 2, 1, 1, '#f5df8a'); }
      R(ctx, 8, 37, 13, 3, '#c7a064'); R(ctx, 9, 38, 9, 2, '#d8b87a');
    }, '#29222e');
  };

  Art.reeds = function (variant) {
    return deco('reeds:' + variant, 22, 31, (ctx, w, h) => {
      const stems = [[5, 8], [10, 4], [15, 9], [18, 13]];
      stems.forEach(([x, top], i) => {
        R(ctx, x, top, 1, 26 - top, '#5e7c42');
        R(ctx, x + 1, top + 4, 1, 16 - i, '#78964f');
        if (i < 3) { R(ctx, x, top - 3, 2, 4, '#7c5c39'); R(ctx, x, top - 4, 2, 2, '#9a794d'); }
      });
      R(ctx, 3, 20, 3, 1, '#4c6837'); R(ctx, 14, 17, 4, 1, '#5f7e42');
      R(ctx, 8, 27, 10, 2, '#455f3b');
      if (variant === 1) { R(ctx, 13, 9, 2, 2, '#d8ce6b'); }
    }, '#28222e');
  };

  Art.mushroomDeco = function (variant) {
    return deco('mush:' + variant, 16, 19, (ctx, w, h) => {
      R(ctx, 7, 11, 3, 6, '#d5c69d'); R(ctx, 7, 15, 3, 1, '#ab9a78');
      E(ctx, 8, 9, 6, 4, variant ? '#6b8e55' : '#b9514e');
      R(ctx, 3, 9, 11, 2, variant ? '#587b47' : '#983e3d');
      R(ctx, 5, 7, 2, 1, '#f2e6c0'); R(ctx, 10, 6, 1, 1, '#f2e6c0');
      R(ctx, 8, 15, 1, 1, '#553d2c');
    }, '#28212d');
  };

  Art.flowerPatch = function (kind, variant) {
    return deco('flowers:' + kind + ':' + variant, 20, 14, (ctx, w, h) => {
      const cols = kind === 'snow' ? ['#dff0f5', '#b7d7e2', '#f7ffff'] : kind === 'desert' ? ['#d1b15a', '#e5cc80', '#a7c66b'] : ['#f1df73', '#f7f1de', '#d991b3'];
      for (let i = 0; i < 5; i++) {
        const x = 2 + (i * 4) % 16, y = 5 + (i * 3) % 7;
        R(ctx, x, y, 1, 4, kind === 'desert' ? '#8c9849' : '#4b783a');
        R(ctx, x - 1, y - 1, 2, 2, cols[i % cols.length]);
        R(ctx, x, y - 1, 1, 1, '#fff7cf');
      }
    }, '#28212d');
  };

  Art.grassTuft = function (kind) {
    return deco('grass:' + kind, 18, 14, (ctx, w, h) => {
      const col = kind === 'snow' ? '#a9c5cf' : kind === 'desert' ? '#b99d5e' : kind === 'swamp' ? '#526c3d' : kind === 'volcano' ? '#7a4b3d' : '#4f8b3d';
      const light = kind === 'snow' ? '#e4f4f8' : kind === 'desert' ? '#ddc385' : '#6caa4e';
      [[3, 10], [7, 6], [11, 9], [15, 4]].forEach(([x, top], i) => {
        R(ctx, x, top, 1, 13 - top, col);
        R(ctx, x + 1, top + 2, 1, 9 - i, light);
      });
      R(ctx, 3, 12, 12, 1, col);
    }, 'rgba(0,0,0,0)');
  };

  Art.iceCrystal = function (variant) {
    return deco('icecrystal:' + variant, 28, 38, (ctx, w, h) => {
      ctx.globalAlpha = 0.2; E(ctx, 14, 34, 10, 3, '#1b2f3b'); ctx.globalAlpha = 1;
      const drawShard = (x, y, ww, hh, light) => {
        ctx.fillStyle = light ? '#dffaff' : '#8ccbe1';
        for (let i = 0; i < hh; i++) {
          const half = Math.max(1, Math.round(ww * (1 - i / hh)));
          ctx.fillRect(x - half, y + i, half * 2, 1);
        }
        R(ctx, x - Math.floor(ww / 2), y, 1, hh, '#f3feff');
      };
      drawShard(14, 3, 5, 31, false);
      drawShard(8, 13, 4, 20, true);
      drawShard(21, 11, 4, 22, true);
      R(ctx, 12, 8, 1, 8, '#ffffff'); R(ctx, 6, 19, 1, 5, '#ffffff');
      E(ctx, 14, 35, 9, 2, '#9fc6d2');
    }, '#2c3a46');
  };

  Art.bones = function () {
    return deco('bones', 25, 14, (ctx, w, h) => {
      R(ctx, 5, 9, 13, 2, '#ddd3b8'); R(ctx, 3, 8, 3, 4, '#ece4cc'); R(ctx, 17, 8, 3, 4, '#cec3a6');
      R(ctx, 10, 4, 6, 5, '#e8dfc6'); R(ctx, 11, 5, 1, 1, '#625e56'); R(ctx, 14, 5, 1, 1, '#625e56');
      R(ctx, 12, 7, 2, 1, '#b6ac91'); R(ctx, 12, 2, 1, 2, '#cec4a8'); R(ctx, 15, 2, 1, 2, '#cec4a8');
      R(ctx, 3, 12, 6, 1, '#bfb59a'); R(ctx, 16, 12, 4, 1, '#bfb59a');
    }, '#3a3030');
  };

  Art.lavaRock = function (variant) {
    return deco('lavarock:' + variant, 28, 23, (ctx, w, h) => {
      E(ctx, 14, 17, 12, 5, '#3b2b2a');
      E(ctx, 13, 13, 10, 6, '#594441');
      E(ctx, 9, 11, 5, 3, '#76605a');
      R(ctx, 11, 9, 5, 1, '#8d746b');
      R(ctx, 12, 12, 5, 1, '#d35e36'); R(ctx, 17, 13, 1, 3, '#d35e36');
      if (variant) { R(ctx, 5, 15, 3, 1, '#ef9a44'); R(ctx, 20, 10, 2, 1, '#a94a2d'); }
      R(ctx, 8, 19, 3, 1, '#d97540');
    }, '#2a2022');
  };

  Art.vent = function () {
    return deco('vent', 20, 15, (ctx, w, h) => {
      E(ctx, 10, 11, 8, 4, '#4a3835');
      E(ctx, 10, 9, 5, 3, '#2f2424');
      R(ctx, 7, 8, 6, 2, '#d75f33'); R(ctx, 9, 7, 2, 1, '#ffb451');
      R(ctx, 2, 12, 4, 1, '#6a4d43'); R(ctx, 14, 11, 3, 1, '#6a4d43');
    }, '#2a2022');
  };

  Art.stump = function (kind) {
    return deco('stump:' + kind, 22, 18, (ctx, w, h) => {
      R(ctx, 4, 7, 14, 9, '#6d4d31'); R(ctx, 5, 8, 5, 7, '#8b6944');
      E(ctx, 11, 7, 7, 3, '#9c7a50'); E(ctx, 11, 7, 4, 2, '#6e5235'); R(ctx, 11, 6, 1, 2, '#5a4029');
      R(ctx, 5, 9, 1, 5, '#523823');
      if (kind === 'snow') { R(ctx, 5, 5, 12, 2, '#e8f4f7'); }
      R(ctx, 3, 15, 16, 2, '#4d3727');
    }, '#2a222c');
  };

  Art.fern = function (kind) {
    return deco('fern:' + kind, 24, 20, (ctx, w, h) => {
      const col = kind === 'snow' ? '#9fb9c0' : '#4e7a43';
      const light = kind === 'snow' ? '#d8ecf1' : '#6a9a54';
      for (let i = 0; i < 5; i++) {
        line(ctx, 12, 17, 3 + i * 4, 4 + (i % 2) * 3, col, 1);
        R(ctx, 3 + i * 4, 4 + (i % 2) * 3, 2, 1, light);
        R(ctx, 7 + i * 2, 10 + (i % 2) * 2, 1, 2, light);
      }
      R(ctx, 8, 16, 9, 2, col);
    }, '#28222e');
  };

  Art.snowdrift = function () {
    return deco('snowdrift', 28, 14, (ctx, w, h) => {
      E(ctx, 14, 11, 12, 4, '#c9dce5'); E(ctx, 13, 9, 9, 4, '#effaff');
      R(ctx, 5, 8, 6, 1, '#ffffff'); R(ctx, 18, 10, 4, 1, '#dff1f7');
    }, 'rgba(0,0,0,0)');
  };

  Art.obsidian = function (variant) {
    return deco('obsidian:' + variant, 24, 26, (ctx, w, h) => {
      const drawShard = (x, y, ww, hh) => {
        for (let i = 0; i < hh; i++) {
          const half = Math.max(1, Math.round(ww * (1 - i / hh)));
          R(ctx, x - half, y + i, half * 2, 1, i < hh * 0.4 ? '#3d3243' : '#251f2d');
        }
        R(ctx, x, y, 1, hh - 2, '#6d5a81');
      };
      drawShard(13, 2, 4, 22); drawShard(7, 9, 3, 15); drawShard(19, 7, 3, 17);
      R(ctx, 13, 10, 1, 6, '#c06bff'); R(ctx, 7, 16, 1, 3, '#a557d8');
      R(ctx, 6, 23, 13, 2, '#1d1824');
    }, '#1b1621');
  };

  Art.banner = function (biome) {
    return deco('banner:' + biome, 18, 44, (ctx, w, h) => {
      const colors = {
        plains: ['#e3b950', '#9a7430'], forest: ['#5f9f56', '#3a6937'], desert: ['#d8a14d', '#9b6a2d'],
        swamp: ['#7f8c54', '#536038'], tundra: ['#a6d9e8', '#678f9e'], volcano: ['#c75a3b', '#782f27']
      };
      const col = colors[biome] || colors.plains;
      R(ctx, 8, 0, 2, 42, '#7b5b3b'); R(ctx, 6, 0, 6, 2, '#d3af5c');
      R(ctx, 2, 4, 14, 20, col[1]); R(ctx, 3, 5, 12, 17, col[0]);
      R(ctx, 4, 7, 10, 1, col[1]); R(ctx, 7, 10, 4, 4, '#f2e6c1'); R(ctx, 8, 11, 2, 2, col[1]);
      ctx.globalAlpha = 0.4; R(ctx, 5, 24, 3, 2, col[0]); R(ctx, 11, 24, 2, 2, col[0]); ctx.globalAlpha = 1;
    }, '#29222e');
  };

  Art.torch = function () {
    return deco('torch', 14, 30, (ctx, w, h) => {
      R(ctx, 6, 12, 3, 17, '#6d4b30'); R(ctx, 7, 12, 1, 15, '#917044');
      R(ctx, 5, 10, 5, 3, '#443126');
      E(ctx, 7, 6, 3, 4, '#e37832'); E(ctx, 7, 7, 2, 3, '#ffcb54');
      R(ctx, 7, 2, 1, 4, '#ffe38c');
      R(ctx, 3, 27, 9, 2, '#4f3b2b');
    }, '#28202c');
  };

  /* ------------------------------------------------------------
     Décors de sol (arènes, village)
     ------------------------------------------------------------ */
  Art.arenaDecal = function (biome, big) {
    const radius = big ? 150 : 104;
    const r = radius + 24;
    return Art.cached('arena-decal:' + biome + ':' + big, () => {
      const c = cvs(r * 2, r * 2), ctx = c.getContext('2d');
      const cx = r, cy = r;
      const pal = {
        plains: ['#a49a73', '#b8ae85', '#7d765a', '#d8ce9d'],
        forest: ['#798069', '#8e9579', '#59634f', '#aab487'],
        desert: ['#b89b68', '#d0b27a', '#8b7148', '#e7d19c'],
        swamp: ['#6b715b', '#7e846a', '#4e5643', '#9ba082'],
        tundra: ['#9eb6c2', '#bacfd9', '#7a939f', '#e6f6fb'],
        volcano: ['#584947', '#6b5752', '#3d302e', '#937269']
      }[biome] || ['#a49a73', '#b8ae85', '#7d765a', '#d8ce9d'];
      const rng = U.mulberry32(U.hashString('arena' + biome + big));
      // herbe autour
      ctx.globalAlpha = 0.25; E(ctx, cx, cy, radius + 20, radius + 20, '#253326'); ctx.globalAlpha = 1;
      // sol
      E(ctx, cx, cy, radius + 4, radius + 4, pal[2]);
      E(ctx, cx, cy, radius, radius, pal[0]);
      for (let i = 0; i < 900; i++) {
        const ang = rng() * Math.PI * 2, dist = Math.sqrt(rng()) * radius;
        const x = Math.round(cx + Math.cos(ang) * dist), y = Math.round(cy + Math.sin(ang) * dist);
        R(ctx, x, y, rng() < 0.2 ? 2 : 1, 1, rng() < 0.5 ? pal[1] : pal[2]);
      }
      // anneaux
      ctx.strokeStyle = pal[2]; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, radius - 12, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = pal[3]; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, radius - 22, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = pal[2]; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, radius * 0.46, 0, Math.PI * 2); ctx.stroke();
      // runes cardinales
      for (let i = 0; i < 8; i++) {
        const ang = i / 8 * Math.PI * 2;
        const x = cx + Math.cos(ang) * (radius - 47), y = cy + Math.sin(ang) * (radius - 47);
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        R(ctx, -4, -1, 8, 2, pal[3]); R(ctx, -1, -4, 2, 8, pal[3]);
        ctx.restore();
      }
      // motif central
      ctx.strokeStyle = U.rgba(pal[3], 0.8); ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(i / 6 * Math.PI * 2) * 35, cy + Math.sin(i / 6 * Math.PI * 2) * 35);
        ctx.lineTo(cx + Math.cos((i + 2) / 6 * Math.PI * 2) * 35, cy + Math.sin((i + 2) / 6 * Math.PI * 2) * 35);
        ctx.stroke();
      }
      E(ctx, cx, cy, 7, 3, pal[3]);
      // fissures / mousse
      for (let i = 0; i < 6; i++) {
        const ang = rng() * Math.PI * 2;
        let x = cx + Math.cos(ang) * 30, y = cy + Math.sin(ang) * 30;
        for (let j = 0; j < 6; j++) {
          R(ctx, x, y, 2, 1, pal[2]);
          x += rng() * 12 - 6; y += rng() * 8 + 2;
        }
      }
      const detailCol = biome === 'swamp' ? '#5f7b4a' : biome === 'tundra' ? '#e8f7fb' : biome === 'volcano' ? '#d96538' : '#6f8a52';
      for (let i = 0; i < 18; i++) {
        const ang = rng() * Math.PI * 2, dist = radius * (0.55 + rng() * 0.4);
        R(ctx, cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 1 + (rng() < 0.3), 1, detailCol);
      }
      return c;
    });
  };

  Art.finalDecal = function () {
    const radius = 152, r = radius + 24;
    return Art.cached('final-decal', () => {
      const c = cvs(r * 2, r * 2), ctx = c.getContext('2d');
      const cx = r, cy = r;
      const rng = U.mulberry32(99123);
      ctx.globalAlpha = 0.3; E(ctx, cx, cy, radius + 22, radius + 22, '#17121e'); ctx.globalAlpha = 1;
      E(ctx, cx, cy, radius + 5, radius + 5, '#3c3447');
      E(ctx, cx, cy, radius, radius, '#4a4157');
      for (let i = 0; i < 700; i++) {
        const ang = rng() * Math.PI * 2, dist = Math.sqrt(rng()) * radius;
        R(ctx, cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 2, 1, rng() < 0.5 ? '#5a5069' : '#3b3346');
      }
      ctx.strokeStyle = '#7e5aa3'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, radius - 16, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#b07bda'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, radius - 30, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const ang = i / 12 * Math.PI * 2;
        const x = cx + Math.cos(ang) * (radius - 60), y = cy + Math.sin(ang) * (radius - 60);
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        R(ctx, -5, -1, 10, 2, '#9f77c4'); R(ctx, -1, -5, 2, 10, '#9f77c4');
        ctx.restore();
      }
      // étoile à six branches
      ctx.strokeStyle = '#b98de0'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(a) * 55, cy - Math.sin(a) * 55);
        ctx.lineTo(cx + Math.cos(a) * 55, cy + Math.sin(a) * 55);
        ctx.stroke();
      }
      R(ctx, cx - 7, cy - 3, 14, 6, '#d4b6f4'); R(ctx, cx - 3, cy - 7, 6, 14, '#d4b6f4');
      // ossements/fissures
      for (let i = 0; i < 20; i++) {
        const ang = rng() * Math.PI * 2, dist = radius * (0.3 + rng() * 0.65);
        R(ctx, cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 3, 1, '#2d2738');
      }
      return c;
    });
  };

  Art.villagePlaza = function (mult) {
    mult = mult || 1;
    const radius = Math.round(188 * mult), r = radius + 20;
    return Art.cached('village-plaza:' + mult, () => {
      const c = cvs(r * 2, r * 2), ctx = c.getContext('2d');
      const cx = r, cy = r;
      const rng = U.mulberry32(44211);

      // herbe irrégulière qui vient mordre la bordure
      for (let i = 0; i < Math.round(230 * mult); i++) {
        const ang = rng() * Math.PI * 2;
        const dist = radius + 2 + rng() * 14;
        R(ctx, cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 3, 2, rng() < 0.5 ? '#5f9a48' : '#4f843c');
      }
      // ombre périphérique et bord de terre
      ctx.globalAlpha = 0.22;
      E(ctx, cx, cy, radius + 11, radius + 11, '#272a1e');
      ctx.globalAlpha = 1;
      E(ctx, cx, cy, radius + 5, radius + 5, '#6c6250');
      E(ctx, cx, cy, radius + 1, radius + 1, '#857a66');
      E(ctx, cx, cy, radius - 2, radius - 2, '#928878');

      // champ de pavés en anneaux
      const stoneCols = ['#a49a89', '#b0a695', '#978d7d', '#bbb1a0', '#8e8576'];
      const ringStep = Math.max(9, Math.round(12 * mult));
      const stoneW = Math.max(6, Math.round(9 * mult));
      const stoneH = Math.max(3, Math.round(5 * mult));
      for (let ring = 0; ring * ringStep < radius - 6; ring++) {
        const rr = ring * ringStep + ringStep * 0.55;
        const count = Math.max(12, Math.round((Math.PI * 2 * rr) / (stoneW * 0.86)));
        const off = ring % 2 ? 0.5 : 0;
        for (let i = 0; i < count; i++) {
          const ang = ((i + off) / count) * Math.PI * 2;
          const x = cx + Math.cos(ang) * rr + (rng() - 0.5) * 2;
          const y = cy + Math.sin(ang) * rr + (rng() - 0.5) * 2;
          const col = stoneCols[Math.floor(rng() * stoneCols.length)];
          const w = stoneW + (rng() < 0.22 ? 2 : 0), h = stoneH + (rng() < 0.25 ? 1 : 0);
          R(ctx, x - w / 2, y - h / 2, w, h, col);
          R(ctx, x - w / 2 + 1, y - h / 2, w - 2, 1, U.shade(col, 15));
          R(ctx, x - w / 2 + 1, y + h / 2 - 1, w - 2, 1, U.shade(col, -18));
        }
      }

      // médaillon central clair
      E(ctx, cx, cy, 46 * mult, 46 * mult, '#877d6e');
      E(ctx, cx, cy, 42 * mult, 42 * mult, '#a79c89');
      E(ctx, cx, cy, 31 * mult, 31 * mult, '#b4a995');
      for (let i = 0; i < 14; i++) {
        const ang = i / 14 * Math.PI * 2;
        const rr = 37 * mult;
        R(ctx, cx + Math.cos(ang) * rr - 2, cy + Math.sin(ang) * rr - 1, 5, 3, i % 2 ? '#9a8f7c' : '#c0b5a1');
      }
      // fissures et mousse
      for (let i = 0; i < Math.round(18 * mult); i++) {
        const ang = rng() * Math.PI * 2, dist = 70 * mult + rng() * (radius - 70 * mult);
        const x = cx + Math.cos(ang) * dist, y = cy + Math.sin(ang) * dist;
        R(ctx, x, y, 1 + Math.floor(rng() * 3), 1, '#6f6657');
      }
      for (let i = 0; i < Math.round(80 * mult); i++) {
        const ang = rng() * Math.PI * 2, dist = radius * (0.45 + rng() * 0.55);
        R(ctx, cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 2, 1, rng() < 0.5 ? '#6e8752' : '#7d9660');
      }
      return c;
    });
  };

  window.Art = Art;
})();
