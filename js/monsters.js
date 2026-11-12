/* ============================================================
   LES LÉGENDES D'AURORE — créatures pixel
   ============================================================ */
(function () {
  'use strict';
  const U = window.U, D = window.DATA, Art = window.Art;
  const R = Art.R, E = Art.E, line = Art.line, cvs = Art.cvs, outline = Art.outline;

  function eyes(ctx, x, y, c, sep, size) {
    sep = sep === undefined ? 3 : sep; size = size || 1;
    R(ctx, x - sep, y, size + 1, size + 2, '#f4f0df');
    R(ctx, x + sep, y, size + 1, size + 2, '#f4f0df');
    R(ctx, x - sep + 1, y + 1, size, size, c);
    R(ctx, x + sep + 1, y + 1, size, size, c);
  }

  function crown(ctx, cx, cy, scale) {
    scale = scale || 1;
    R(ctx, cx - 5 * scale, cy, 10 * scale, 2 * scale, '#e6b94b');
    R(ctx, cx - 5 * scale, cy - 2 * scale, 2 * scale, 2 * scale, '#e6b94b');
    R(ctx, cx - 1 * scale, cy - 3 * scale, 2 * scale, 3 * scale, '#f7dd82');
    R(ctx, cx + 3 * scale, cy - 2 * scale, 2 * scale, 2 * scale, '#e6b94b');
    R(ctx, cx - 5 * scale, cy + 2 * scale, 10 * scale, 1 * scale, '#a87926');
  }

  function flame(ctx, x, y, s, c1, c2) {
    E(ctx, x, y, s, s * 1.4, c1);
    E(ctx, x, y + 1, s * 0.55, s * 0.8, c2);
    R(ctx, x, y - s * 1.8, 1, Math.max(1, s * 0.8), c2);
  }

  function iceShard(ctx, x, y, s, c1, c2) {
    R(ctx, x - 1, y - s, 2, s, c1);
    R(ctx, x + 1, y - s + 2, 1, Math.max(1, s - 2), c1);
    R(ctx, x - 2, y - s + 2, 1, Math.max(1, s - 2), c2);
    R(ctx, x - 1, y - 1, 2, 1, c2);
  }

  /* ------------------------------------------------------------
     Formes de créatures normales
     ------------------------------------------------------------ */
  const SHAPES = {};

  SHAPES.bunny = {
    w: 25, h: 23, draw(ctx, w, h, f, c, ft) {
      const bob = f ? 1 : 0;
      E(ctx, 9, 17, 7, 4, c.shade);
      // pattes
      R(ctx, 4, 18, 3, 4, c.shade); R(ctx, 7, 19, 3, 3, c.body);
      R(ctx, 12, 19, 3, 3, c.body); R(ctx, 16, 18, 3, 4, c.shade);
      // corps
      E(ctx, 11, 13 + bob, 7, 6, c.body);
      E(ctx, 9, 15 + bob, 5, 3, c.light);
      // tête
      E(ctx, 17, 9 + bob, 5, 5, c.body);
      R(ctx, 19, 10 + bob, 4, 3, c.light);
      // oreilles
      R(ctx, 14, 1 + bob, 2, 6, c.body); R(ctx, 13, 2 + bob, 1, 4, c.shade);
      R(ctx, 17, 0 + bob, 2, 6, c.body); R(ctx, 16, 1 + bob, 1, 4, c.light);
      R(ctx, 14, 3 + bob, 1, 2, '#e49b9b'); R(ctx, 17, 2 + bob, 1, 2, '#e49b9b');
      // corne
      if (ft.includes('horn')) { R(ctx, 20, 4 + bob, 2, 2, c.accent); R(ctx, 21, 3 + bob, 1, 1, '#f2e7c4'); }
      if (ft.includes('crown')) crown(ctx, 17, 2 + bob, 1);
      eyes(ctx, 18, 8 + bob, c.eye, 2, 1);
      R(ctx, 21, 10 + bob, 1, 1, '#c98c8c');
      // queue
      E(ctx, 5, 13 + bob, 2, 2, c.light);
      R(ctx, 5, 20, 2, 1, c.shade);
    }
  };

  SHAPES.boar = {
    w: 32, h: 25, draw(ctx, w, h, f, c, ft) {
      const step = f ? 1 : 0;
      E(ctx, 14, 15, 10, 6, c.body);
      E(ctx, 13, 13, 7, 3, c.light);
      // pattes
      R(ctx, 6, 18, 3, 5 - step, c.shade); R(ctx, 10, 18, 3, 4, c.shade);
      R(ctx, 18, 18, 3, 4, c.shade); R(ctx, 22, 18, 3, 5 - (1 - step), c.shade);
      // tête
      E(ctx, 25, 13, 5, 5, c.body);
      R(ctx, 27, 14, 4, 3, c.light);
      R(ctx, 29, 15, 2, 1, c.shade);
      R(ctx, 29, 14, 1, 1, c.eye);
      // défenses
      R(ctx, 28, 17, 2, 2, '#efe7cb'); R(ctx, 30, 16, 1, 2, '#fff7db');
      if (ft.includes('tusks')) { R(ctx, 7, 15, 1, 3, '#efe7cb'); R(ctx, 29, 18, 2, 1, '#efe7cb'); }
      // crinière
      for (let i = 0; i < 5; i++) {
        R(ctx, 9 + i * 3, 8 + (i % 2), 2, 3, c.shade);
      }
      // oreille / œil
      R(ctx, 23, 8, 2, 2, c.shade);
      R(ctx, 27, 12, 2, 1, c.eye);
      // queue
      line(ctx, 4, 12, 1, 9, c.shade, 1);
      R(ctx, 0, 9, 2, 2, c.accent);
      if (ft.includes('crown')) crown(ctx, 25, 6, 1);
      if (ft.includes('runes')) { R(ctx, 13, 17, 2, 1, c.accent); R(ctx, 17, 17, 1, 1, c.accent); }
    }
  };

  SHAPES.wisp = {
    w: 23, h: 25, draw(ctx, w, h, f, c, ft) {
      const bob = f ? 1 : 0;
      // ailes
      E(ctx, 5, 10 + bob, 4, 5, c.light); E(ctx, 18, 10 + bob, 4, 5, c.light);
      R(ctx, 2, 9 + bob, 3, 2, c.accent); R(ctx, 19, 9 + bob, 3, 2, c.accent);
      // corps lumineux
      E(ctx, 11, 12 + bob, 6, 6, c.shade);
      E(ctx, 11, 11 + bob, 5, 5, c.body);
      E(ctx, 10, 10 + bob, 3, 3, c.light);
      // traîne
      R(ctx, 8, 17 + bob, 2, 3, c.shade); R(ctx, 12, 18 + bob, 1, 2, c.shade);
      R(ctx, 10, 20 + bob, 1, 2, c.accent);
      // visage
      eyes(ctx, 11, 10 + bob, c.eye, 2, 1);
      R(ctx, 11, 13 + bob, 1, 1, c.accent);
      // couronne
      if (ft.includes('crown')) crown(ctx, 11, 5 + bob, 1);
      // paillettes
      R(ctx, 3, 17 + bob, 1, 1, '#fff6c7'); R(ctx, 20, 16 + bob, 1, 1, '#fff6c7'); R(ctx, 17, 4 + bob, 1, 1, '#ffffff');
    }
  };

  SHAPES.blob = {
    w: 25, h: 21, draw(ctx, w, h, f, c, ft) {
      const squish = f ? 0 : 1;
      E(ctx, 12, 13, 9, 6 - squish, c.shade);
      E(ctx, 12, 12, 9, 6 + squish, c.body);
      E(ctx, 10, 10, 4, 2, c.light);
      // gouttes
      R(ctx, 4, 8 - squish, 1, 3, c.body); R(ctx, 19, 9 - squish, 1, 2, c.body);
      // visage
      R(ctx, 8, 11, 2, 2, c.eye); R(ctx, 14, 11, 2, 2, c.eye);
      R(ctx, 8, 11, 1, 1, '#fff6e8'); R(ctx, 14, 11, 1, 1, '#fff6e8');
      R(ctx, 11, 14, 2, 1, c.eye);
      // détails
      if (ft.includes('flame')) {
        flame(ctx, 16, 6, 3, '#ffb24d', '#ffe066');
        flame(ctx, 7, 7, 2, '#ff8e3e', '#ffd15c');
      }
      if (ft.includes('crown')) crown(ctx, 12, 4, 1);
    }
  };

  SHAPES.mushroom = {
    w: 25, h: 25, draw(ctx, w, h, f, c, ft) {
      const bob = f ? 1 : 0;
      // pied
      R(ctx, 9, 12, 7, 9, c.body);
      R(ctx, 10, 13, 5, 7, c.light);
      R(ctx, 9, 20, 2, 2, c.shade); R(ctx, 14, 20, 2, 2, c.shade);
      // chapeau
      E(ctx, 12, 8 + bob, 10, 5, c.accent);
      R(ctx, 3, 8 + bob, 19, 3, c.accent);
      E(ctx, 10, 6 + bob, 6, 3, U.shade(c.accent, 18));
      R(ctx, 5, 5 + bob, 2, 2, c.light); R(ctx, 16, 6 + bob, 2, 2, c.light); R(ctx, 11, 4 + bob, 2, 1, c.light);
      // visage
      R(ctx, 9, 15, 1, 2, c.eye); R(ctx, 14, 15, 1, 2, c.eye);
      R(ctx, 12, 18, 2, 1, c.eye);
      // bras
      R(ctx, 6, 15, 3, 1, c.shade); R(ctx, 17, 15, 2, 1, c.shade);
      if (ft.includes('crown')) crown(ctx, 12, 2, 1);
      if (ft.includes('spots')) { R(ctx, 7, 9, 2, 1, c.light); R(ctx, 17, 9, 1, 1, c.light); }
    }
  };

  SHAPES.wolf = {
    w: 33, h: 23, draw(ctx, w, h, f, c, ft) {
      const gait = f ? 1 : 0;
      E(ctx, 15, 13, 10, 5, c.body);
      E(ctx, 14, 12, 6, 2, c.light);
      // pattes
      R(ctx, 7, 16, 2, 5 - gait, c.shade); R(ctx, 11, 16, 2, 4, c.body);
      R(ctx, 18, 16, 2, 4 + gait, c.body); R(ctx, 23, 16, 2, 5 - gait, c.shade);
      // queue
      line(ctx, 5, 11, 1, 6, c.body, 2); R(ctx, 1, 5, 2, 2, c.light);
      // tête
      E(ctx, 25, 10, 5, 4, c.body);
      R(ctx, 28, 10, 5, 3, c.light);
      R(ctx, 31, 11, 1, 1, c.eye);
      R(ctx, 28, 8, 2, 2, c.shade); R(ctx, 31, 8, 2, 2, c.shade);
      R(ctx, 28, 10, 1, 1, c.eye);
      // truffe
      R(ctx, 32, 11, 1, 1, '#31242a');
      // crocs
      R(ctx, 29, 13, 1, 1, '#f1ead2');
      // fourrure
      R(ctx, 17, 9, 3, 2, c.shade); R(ctx, 20, 8, 2, 2, c.light);
      if (ft.includes('ice')) {
        iceShard(ctx, 17, 8, 4, '#c6efff', '#86c8e4');
        iceShard(ctx, 26, 5, 3, '#dff8ff', '#8ad1e8');
        R(ctx, 22, 14, 1, 1, '#e0fbff'); R(ctx, 9, 14, 1, 1, '#e0fbff');
      }
      if (ft.includes('crown')) crown(ctx, 25, 5, 1);
      if (ft.includes('web')) { R(ctx, 4, 20, 1, 1, '#ede8ff'); R(ctx, 1, 18, 1, 1, '#ede8ff'); }
    }
  };

  SHAPES.spider = {
    w: 31, h: 23, draw(ctx, w, h, f, c, ft) {
      const step = f ? 1 : -1;
      // pattes (8)
      for (let i = 0; i < 4; i++) {
        const y = 9 + i * 3;
        line(ctx, 11, y, 3 - i, y - 5 + (i % 2 ? step : 0), c.shade, 1);
        line(ctx, 11, y, 3 - i, y + 3 - (i % 2 ? step : 0), c.shade, 1);
        line(ctx, 16, y, 25 + i, y - 4 + (i % 2 ? step : 0), c.shade, 1);
        line(ctx, 16, y, 25 + i, y + 3 - (i % 2 ? step : 0), c.shade, 1);
      }
      // abdomen
      E(ctx, 10, 12, 6, 6, c.body);
      E(ctx, 9, 10, 3, 2, c.light);
      R(ctx, 8, 13, 3, 1, c.accent); R(ctx, 9, 15, 2, 1, c.accent);
      // tête
      E(ctx, 19, 13, 5, 5, c.shade);
      R(ctx, 18, 11, 1, 1, c.eye); R(ctx, 21, 11, 1, 1, c.eye);
      R(ctx, 19, 12, 1, 1, c.eye); R(ctx, 22, 12, 1, 1, c.eye);
      // crochets
      R(ctx, 20, 17, 1, 2, c.accent); R(ctx, 23, 17, 1, 2, c.accent);
      if (ft.includes('crown')) crown(ctx, 19, 6, 1);
      if (ft.includes('web')) { line(ctx, 2, 20, 9, 14, '#e6e0ff', 1); line(ctx, 6, 21, 9, 15, '#cfc7ea', 1); }
    }
  };

  SHAPES.ent = {
    w: 30, h: 35, draw(ctx, w, h, f, c, ft) {
      const sway = f ? 1 : -1;
      // racines
      line(ctx, 9, 30, 4, 34, c.shade, 2); line(ctx, 20, 30, 25, 34, c.shade, 2);
      R(ctx, 12, 31, 6, 3, c.shade);
      // tronc
      R(ctx, 10, 13, 10, 18, c.body);
      R(ctx, 11, 14, 3, 14, c.light);
      R(ctx, 17, 15, 2, 14, c.shade);
      R(ctx, 12, 18, 1, 6, c.shade); R(ctx, 16, 23, 1, 4, c.shade);
      // bras
      line(ctx, 10, 17, 3, 11 + sway, c.shade, 2);
      line(ctx, 19, 18, 26, 12 - sway, c.shade, 2);
      R(ctx, 2, 9 + sway, 3, 3, c.body); R(ctx, 25, 10 - sway, 3, 3, c.body);
      // tête
      R(ctx, 11, 7, 8, 7, c.body);
      R(ctx, 9, 8, 2, 5, c.shade); R(ctx, 19, 8, 2, 5, c.shade);
      R(ctx, 12, 10, 2, 2, c.eye); R(ctx, 16, 10, 2, 2, c.eye);
      R(ctx, 13, 13, 3, 1, c.shade);
      // feuillage
      E(ctx, 14, 5, 11, 5, c.accent);
      E(ctx, 8, 4, 4, 3, U.shade(c.accent, -18));
      E(ctx, 21, 3, 4, 3, U.shade(c.accent, 10));
      R(ctx, 4, 3, 2, 2, '#91c85c'); R(ctx, 25, 5, 2, 2, '#6e9d42');
      if (ft.includes('crown')) crown(ctx, 14, 0, 1);
      if (ft.includes('glow')) { R(ctx, 14, 18, 2, 2, c.eye); R(ctx, 14, 21, 1, 1, c.eye); }
      if (ft.includes('antlers')) {
        line(ctx, 11, 4, 3, -1, c.light, 1); line(ctx, 5, 1, 3, 3, c.light, 1);
        line(ctx, 19, 4, 27, -1, c.light, 1); line(ctx, 25, 1, 27, 3, c.light, 1);
      }
    }
  };

  SHAPES.scorpion = {
    w: 34, h: 24, draw(ctx, w, h, f, c, ft) {
      const step = f ? 1 : 0;
      // pattes
      for (let i = 0; i < 3; i++) {
        const by = 13 + i * 3;
        line(ctx, 12, by, 6 - i, by + 3 - (i % 2 ? step : 0), c.shade);
        line(ctx, 18, by, 24 + i, by + 3 - (i % 2 ? step : 0), c.shade);
      }
      // corps
      E(ctx, 17, 13, 7, 5, c.body);
      R(ctx, 14, 11, 4, 2, c.light);
      // pinces
      line(ctx, 22, 12, 28, 9, c.body, 2);
      line(ctx, 22, 15, 28, 17, c.body, 2);
      R(ctx, 27, 7, 4, 3, c.accent); R(ctx, 29, 6, 2, 2, c.accent);
      R(ctx, 30, 8, 1, 1, '#3b2b22');
      R(ctx, 27, 16, 4, 3, c.accent);
      // queue
      line(ctx, 12, 11, 6, 7, c.body, 3);
      line(ctx, 6, 7, 5, 2, c.body, 3);
      line(ctx, 5, 2, 8, 0, c.accent, 2);
      R(ctx, 7, 0, 2, 2, c.accent);
      // yeux
      R(ctx, 19, 11, 1, 1, c.eye); R(ctx, 21, 11, 1, 1, c.eye);
      if (ft.includes('crown')) crown(ctx, 17, 7, 1);
      if (ft.includes('stinger')) { R(ctx, 4, 1, 1, 2, '#f8e8b8'); }
    }
  };

  SHAPES.bird = {
    w: 29, h: 25, draw(ctx, w, h, f, c, ft) {
      const flap = f ? 1 : 0;
      // ailes
      E(ctx, 8, 9 + flap, 6, 5, c.shade);
      E(ctx, 8, 8 + flap, 5, 3, c.body);
      R(ctx, 2, 7 + flap * 2, 4, 2, c.light);
      // corps
      E(ctx, 16, 13, 7, 6, c.body);
      E(ctx, 15, 12, 4, 3, c.light);
      // tête
      E(ctx, 22, 8, 4, 4, c.body);
      R(ctx, 24, 7, 2, 1, c.light);
      // bec
      R(ctx, 26, 9, 3, 1, c.accent); R(ctx, 28, 8, 1, 1, c.accent);
      // œil
      if (ft.includes('owl')) {
        R(ctx, 21, 6, 3, 3, '#f1e8cc'); R(ctx, 24, 6, 3, 3, '#f1e8cc');
        R(ctx, 22, 7, 1, 1, c.eye); R(ctx, 25, 7, 1, 1, c.eye);
      } else {
        R(ctx, 23, 7, 1, 1, c.eye);
      }
      // pattes
      R(ctx, 14, 18, 2, 4, c.accent); R(ctx, 19, 18, 2, 4, c.accent);
      R(ctx, 13, 22, 3, 1, c.shade); R(ctx, 19, 22, 3, 1, c.shade);
      // queue
      R(ctx, 8, 15, 4, 2, c.shade); R(ctx, 6, 17, 3, 1, c.body);
      // plumes
      R(ctx, 14, 9, 2, 1, c.light); R(ctx, 18, 15, 1, 1, c.shade);
      if (ft.includes('beak')) { R(ctx, 27, 9, 4, 2, '#e7d29a'); }
      if (ft.includes('crown')) crown(ctx, 22, 3, 1);
    }
  };

  SHAPES.mummy = {
    w: 24, h: 31, draw(ctx, w, h, f, c, ft) {
      const sway = f ? 1 : 0;
      // jambes
      R(ctx, 7, 23, 3, 7, c.body); R(ctx, 13, 23, 3, 7, c.shade);
      R(ctx, 7, 28, 4, 2, c.shade); R(ctx, 13, 28, 4, 2, c.shade);
      // corps
      R(ctx, 6, 12, 12, 12, c.body);
      R(ctx, 8, 13, 8, 10, c.light);
      for (let i = 0; i < 4; i++) R(ctx, 7, 14 + i * 3, 10, 1, c.shade);
      R(ctx, 6, 23, 12, 1, c.accent);
      // bras tendus
      R(ctx, 2, 14 + sway, 5, 3, c.body); R(ctx, 17, 14 - sway, 5, 3, c.body);
      R(ctx, 0, 14 + sway, 2, 2, c.shade); R(ctx, 22, 14 - sway, 2, 2, c.shade);
      // tête
      E(ctx, 12, 8, 5, 5, c.body);
      R(ctx, 8, 8, 2, 4, c.shade); R(ctx, 15, 8, 2, 4, c.light);
      R(ctx, 10, 8, 1, 1, c.eye); R(ctx, 13, 8, 1, 1, c.eye);
      R(ctx, 9, 6, 6, 2, c.accent);
      R(ctx, 11, 11, 2, 1, c.shade);
      if (ft.includes('nemes')) {
        R(ctx, 6, 4, 12, 4, '#d5b85b'); R(ctx, 7, 2, 10, 3, '#e7cd73');
        R(ctx, 6, 6, 2, 8, '#b69845'); R(ctx, 16, 6, 2, 8, '#b69845');
        for (let i = 0; i < 3; i++) R(ctx, 8 + i * 3, 3, 1, 2, '#6d8fb8');
      }
      if (ft.includes('crown')) crown(ctx, 12, 0, 1);
    }
  };

  SHAPES.worm = {
    w: 35, h: 25, draw(ctx, w, h, f, c, ft) {
      const wiggle = f ? 1 : 0;
      // corps segmenté
      E(ctx, 11, 15, 9, 6, c.shade);
      E(ctx, 9, 13, 6, 4, c.body);
      for (let i = 0; i < 4; i++) R(ctx, 4 + i * 3, 10 + (i % 2) * wiggle, 2, 7, c.light);
      R(ctx, 5, 19, 12, 2, c.shade);
      // tête
      E(ctx, 25, 13, 7, 7, c.body);
      R(ctx, 24, 10, 5, 4, c.light);
      // gueule
      E(ctx, 30, 13, 4, 4, '#4b2d2c');
      R(ctx, 30, 10, 1, 2, '#f2e4bf'); R(ctx, 30, 15, 1, 2, '#f2e4bf'); R(ctx, 33, 13, 1, 1, '#dba5a0');
      R(ctx, 27, 8, 1, 1, c.eye); R(ctx, 29, 8, 1, 1, c.eye);
      // anneaux
      R(ctx, 22, 8, 2, 2, c.accent); R(ctx, 18, 20, 2, 1, c.accent);
      if (ft.includes('maw')) {
        for (let i = 0; i < 4; i++) R(ctx, 29, 10 + i * 2, 1, 1, '#fff2d2');
      }
    }
  };

  SHAPES.frog = {
    w: 29, h: 23, draw(ctx, w, h, f, c, ft) {
      const hop = f ? 1 : 0;
      // pattes
      R(ctx, 4, 17, 5, 3, c.shade); R(ctx, 20, 17, 5, 3, c.shade);
      R(ctx, 2, 19, 4, 2, c.body); R(ctx, 23, 19, 4, 2, c.body);
      // corps
      E(ctx, 14, 14 + hop, 10, 6, c.body);
      E(ctx, 13, 13 + hop, 6, 3, c.light);
      // joues
      E(ctx, 20, 15 + hop, 3, 2, c.accent);
      // yeux sur le dessus
      E(ctx, 9, 8 + hop, 4, 4, c.body); E(ctx, 20, 8 + hop, 4, 4, c.body);
      E(ctx, 9, 8 + hop, 2, 2, '#efe9c9'); E(ctx, 20, 8 + hop, 2, 2, '#efe9c9');
      R(ctx, 9, 8 + hop, 1, 1, c.eye); R(ctx, 20, 8 + hop, 1, 1, c.eye);
      // bouche
      R(ctx, 11, 15 + hop, 8, 1, U.shade(c.body, -45));
      R(ctx, 13, 16 + hop, 4, 1, '#ca6e6e');
      // narines
      R(ctx, 12, 12 + hop, 1, 1, c.shade); R(ctx, 17, 12 + hop, 1, 1, c.shade);
      if (ft.includes('crown')) crown(ctx, 14, 2 + hop, 1);
      // taches
      R(ctx, 7, 14 + hop, 1, 1, c.accent); R(ctx, 21, 13 + hop, 1, 1, c.accent);
    }
  };

  SHAPES.ghost = {
    w: 25, h: 31, draw(ctx, w, h, f, c, ft) {
      const bob = f ? 1 : 0;
      // voile
      E(ctx, 12, 13 + bob, 8, 9, c.body);
      R(ctx, 4, 13 + bob, 16, 8, c.body);
      // bas ondulé
      for (let i = 0; i < 4; i++) R(ctx, 5 + i * 4, 21 + bob + (i % 2), 3, 4, c.shade);
      R(ctx, 7, 24 + bob, 2, 2, c.body); R(ctx, 15, 24 + bob, 2, 2, c.body);
      // reflets
      R(ctx, 7, 8 + bob, 3, 2, c.light);
      R(ctx, 6, 15 + bob, 2, 5, c.light);
      // bras
      E(ctx, 3, 15 + bob, 3, 2, c.light); E(ctx, 21, 15 + bob, 3, 2, c.light);
      // visage creux
      R(ctx, 8, 11 + bob, 3, 4, c.eye); R(ctx, 15, 11 + bob, 3, 4, c.eye);
      R(ctx, 9, 13 + bob, 1, 1, '#c8b6ff'); R(ctx, 16, 13 + bob, 1, 1, '#c8b6ff');
      E(ctx, 12, 18 + bob, 2, 2, '#2a2235');
      if (ft.includes('lantern')) {
        line(ctx, 22, 14 + bob, 23, 21, c.shade, 1);
        R(ctx, 21, 21 + bob, 4, 4, '#d8b967'); R(ctx, 22, 22 + bob, 2, 2, '#9ee37e');
      }
      if (ft.includes('crown')) crown(ctx, 12, 1 + bob, 1);
    }
  };

  SHAPES.croc = {
    w: 35, h: 23, draw(ctx, w, h, f, c, ft) {
      const step = f ? 1 : 0;
      // queue
      line(ctx, 12, 13, 1, 9, c.body, 3);
      R(ctx, 0, 7, 4, 2, c.shade);
      // corps
      E(ctx, 17, 13, 9, 6, c.body);
      E(ctx, 15, 12, 5, 2, c.light);
      // pattes
      R(ctx, 8, 17, 3, 4, c.shade); R(ctx, 22, 17, 3, 4, c.shade);
      R(ctx, 7, 20, 4, 2, c.body); R(ctx, 22, 20, 4, 2, c.body);
      // tête / museau
      R(ctx, 24, 9, 9, 6, c.body);
      R(ctx, 27, 8, 7, 2, c.light);
      R(ctx, 31, 11, 3, 1, c.eye);
      R(ctx, 30, 13, 4, 1, U.shade(c.body, -35));
      for (let i = 0; i < 4; i++) R(ctx, 27 + i * 2, 14, 1, 1, '#f4eccf');
      // écailles
      for (let i = 0; i < 4; i++) R(ctx, 11 + i * 3, 9 + (i % 2), 2, 2, c.shade);
      R(ctx, 33, 10, 1, 1, c.eye);
      if (ft.includes('teeth')) { R(ctx, 26, 16, 1, 2, '#f6efd2'); }
      if (ft.includes('flame')) {
        flame(ctx, 16, 8, 3, '#ff9a3c', '#ffe066'); flame(ctx, 22, 8, 2, '#ff6a2f', '#ffcf5c');
        R(ctx, 19, 6, 1, 2, '#ffbc4d');
      }
      if (ft.includes('crown')) crown(ctx, 28, 3, 1);
    }
  };

  SHAPES.witch = {
    w: 25, h: 33, draw(ctx, w, h, f, c, ft) {
      const bob = f ? 1 : 0;
      // robe
      R(ctx, 6, 14, 13, 16, c.body);
      R(ctx, 8, 15, 3, 13, c.light);
      R(ctx, 16, 16, 2, 13, c.shade);
      for (let i = 0; i < 3; i++) R(ctx, 5, 27 + i, 15, 1, c.shade);
      // bras + bâton
      R(ctx, 3, 16 + bob, 4, 2, c.shade); R(ctx, 18, 16 + bob, 3, 2, c.shade);
      line(ctx, 22, 12, 24, 30, '#6f4e38', 2);
      E(ctx, 23, 9, 2, 2, c.accent);
      // tête
      E(ctx, 12, 9 + bob, 5, 5, '#d9c0a1');
      R(ctx, 9, 8 + bob, 2, 4, c.shade);
      R(ctx, 10, 9 + bob, 1, 1, c.eye); R(ctx, 14, 9 + bob, 1, 1, c.eye);
      // chapeau
      if (ft.includes('hat')) {
        R(ctx, 4, 5 + bob, 17, 2, c.shade);
        R(ctx, 8, 1 + bob, 9, 5, c.body);
        R(ctx, 12, 0 + bob, 2, 2, c.shade);
        R(ctx, 9, 3 + bob, 2, 1, c.accent);
      } else {
        R(ctx, 6, 5 + bob, 12, 3, c.body);
      }
      if (ft.includes('crown')) crown(ctx, 12, 0 + bob, 1);
      // masque/yeux lueur
      R(ctx, 10, 10 + bob, 1, 1, c.eye);
    }
  };

  SHAPES.golem = {
    w: 31, h: 33, draw(ctx, w, h, f, c, ft) {
      const step = f ? 1 : 0;
      // jambes
      R(ctx, 7, 25, 6, 7, c.shade); R(ctx, 18, 25, 6, 7, c.shade);
      R(ctx, 6, 30 + step, 8, 2, c.body); R(ctx, 18, 30 - step, 8, 2, c.body);
      // torse rocheux
      R(ctx, 6, 11, 19, 15, c.body);
      R(ctx, 8, 12, 7, 6, c.light);
      R(ctx, 18, 15, 5, 8, c.shade);
      R(ctx, 3, 13, 4, 9, c.shade); R(ctx, 25, 13, 3, 9, c.shade);
      R(ctx, 4, 21, 3, 3, c.body); R(ctx, 24, 21, 3, 3, c.body);
      // tête
      R(ctx, 10, 4, 11, 8, c.body);
      R(ctx, 12, 5, 5, 3, c.light);
      R(ctx, 10, 4, 11, 1, c.shade);
      R(ctx, 12, 8, 2, 2, c.eye); R(ctx, 17, 8, 2, 2, c.eye);
      R(ctx, 14, 11, 3, 1, c.shade);
      // fissures
      R(ctx, 9, 18, 1, 4, c.eye); R(ctx, 10, 22, 3, 1, c.eye);
      R(ctx, 21, 13, 1, 2, c.eye);
      if (ft.includes('ice')) {
        iceShard(ctx, 7, 10, 6, '#d8f8ff', '#7dc7e4');
        iceShard(ctx, 23, 8, 5, '#d8f8ff', '#7dc7e4');
        iceShard(ctx, 16, 2, 4, '#efffff', '#9ed9ec');
      }
      if (ft.includes('lava')) {
        for (let i = 0; i < 3; i++) R(ctx, 10 + i * 4, 17 + (i % 2), 2, 1, '#ff9d4d');
        flame(ctx, 24, 6, 2, '#ff9a3c', '#ffe066');
      }
      if (ft.includes('crown')) crown(ctx, 15, 0, 1);
      if (ft.includes('crystals')) {
        iceShard(ctx, 4, 20, 8, '#c7f4ff', '#72b6d2');
        iceShard(ctx, 27, 18, 7, '#dffaff', '#82c8df');
      }
    }
  };

  SHAPES.yeti = {
    w: 27, h: 33, draw(ctx, w, h, f, c, ft) {
      const step = f ? 1 : 0;
      // jambes
      R(ctx, 8, 26, 4, 7, c.shade); R(ctx, 15, 26, 4, 7, c.shade);
      R(ctx, 6, 31 + step, 6, 2, c.body); R(ctx, 15, 31 - step, 6, 2, c.body);
      // corps
      E(ctx, 13, 20, 9, 9, c.body);
      E(ctx, 12, 18, 5, 5, c.light);
      // bras
      R(ctx, 2, 17, 5, 10, c.shade); R(ctx, 20, 17, 5, 10, c.shade);
      R(ctx, 1, 26, 5, 3, c.body); R(ctx, 21, 26, 5, 3, c.body);
      // tête
      E(ctx, 13, 10, 6, 6, c.body);
      R(ctx, 9, 8, 8, 4, c.light);
      R(ctx, 10, 11, 2, 1, c.eye); R(ctx, 15, 11, 2, 1, c.eye);
      R(ctx, 12, 14, 3, 1, c.shade);
      R(ctx, 11, 4, 4, 2, c.light); R(ctx, 8, 5, 2, 2, c.shade); R(ctx, 17, 5, 2, 2, c.shade);
      if (ft.includes('crown')) crown(ctx, 13, 2, 1);
      // fourrure
      R(ctx, 4, 18, 2, 3, c.light); R(ctx, 21, 20, 2, 2, c.light);
    }
  };

  SHAPES.imp = {
    w: 23, h: 31, draw(ctx, w, h, f, c, ft) {
      const bob = f ? 1 : 0;
      // ailes
      line(ctx, 7, 13, 2, 9 + bob, c.shade, 2);
      line(ctx, 4, 10 + bob, 2, 16 + bob, c.shade, 1);
      line(ctx, 16, 13, 21, 9 + bob, c.shade, 2);
      line(ctx, 19, 10 + bob, 21, 16 + bob, c.shade, 1);
      // jambes
      R(ctx, 8, 24, 3, 6, c.shade); R(ctx, 14, 24, 3, 6, c.shade);
      R(ctx, 6, 29, 5, 2, c.body); R(ctx, 14, 29, 5, 2, c.body);
      // corps
      R(ctx, 7, 13, 10, 12, c.body);
      R(ctx, 9, 14, 4, 9, c.light);
      R(ctx, 13, 18, 3, 5, c.shade);
      // bras
      R(ctx, 3, 15 + bob, 4, 2, c.shade); R(ctx, 17, 15 + bob, 4, 2, c.shade);
      // tête
      E(ctx, 12, 9, 5, 5, c.body);
      R(ctx, 9, 7, 3, 4, c.light);
      R(ctx, 10, 9, 1, 1, c.eye); R(ctx, 14, 9, 1, 1, c.eye);
      R(ctx, 12, 12, 2, 1, '#3a2228');
      // cornes
      if (ft.includes('horns')) {
        line(ctx, 8, 5, 5, 1, c.accent, 2); line(ctx, 16, 5, 19, 1, c.accent, 2);
        R(ctx, 4, 0, 2, 2, '#f6e0bc'); R(ctx, 18, 0, 2, 2, '#f6e0bc');
      }
      // flamme
      flame(ctx, 18, 12, 2, '#ff9d4b', '#ffe066');
      // queue
      line(ctx, 7, 24, 3, 26, c.shade, 1); R(ctx, 1, 24, 2, 2, c.accent);
      if (ft.includes('crown')) crown(ctx, 12, 0 + bob, 1);
    }
  };

  /* ------------------------------------------------------------
     Grands boss uniques
     ------------------------------------------------------------ */
  const BOSS_SHAPES = {};

  BOSS_SHAPES.bison = {
    w: 78, h: 60, draw(ctx, w, h, f, c, ft) {
      const step = f ? 2 : 0;
      // pattes
      R(ctx, 12, 44, 10, 14 - step, '#4d3729'); R(ctx, 24, 45, 9, 12, '#5b4331');
      R(ctx, 48, 45, 9, 13, '#5b4331'); R(ctx, 59, 44, 10, 14 + step, '#4d3729');
      R(ctx, 9, 55, 15, 4, c.shade); R(ctx, 57, 55, 15, 4, c.shade);
      // corps massif
      E(ctx, 37, 34, 26, 16, c.body);
      E(ctx, 30, 28, 17, 9, c.light);
      E(ctx, 51, 40, 15, 9, c.shade);
      // crinière
      for (let i = 0; i < 9; i++) {
        R(ctx, 12 + i * 6, 20 + (i % 3) * 2, 7, 10, i % 2 ? c.shade : U.shade(c.body, -20));
      }
      R(ctx, 14, 35, 42, 5, U.shade(c.shade, -10));
      // tête
      E(ctx, 62, 37, 11, 10, c.body);
      R(ctx, 64, 30, 8, 9, c.light);
      R(ctx, 68, 39, 10, 6, c.light);
      R(ctx, 73, 41, 4, 2, '#31221e');
      R(ctx, 69, 36, 2, 2, c.eye); R(ctx, 74, 36, 2, 2, c.eye);
      // cornes
      line(ctx, 63, 29, 57, 17, '#e9dfbd', 4);
      line(ctx, 57, 17, 51, 14, '#f5eed6', 3);
      line(ctx, 72, 28, 76, 17, '#e9dfbd', 4);
      line(ctx, 76, 17, 83, 14, '#f5eed6', 3);
      R(ctx, 53, 13, 3, 2, '#fff4d3');
      // runes
      if (ft.includes('runes')) {
        R(ctx, 28, 33, 7, 2, c.accent); R(ctx, 38, 31, 2, 6, c.accent); R(ctx, 46, 36, 6, 2, c.accent);
        R(ctx, 30, 40, 9, 1, U.shade(c.accent, -30));
        R(ctx, 42, 28, 1, 4, c.accent);
      }
      // sabots
      R(ctx, 9, 57, 5, 2, '#2f2421'); R(ctx, 20, 57, 4, 2, '#2f2421');
      R(ctx, 59, 57, 4, 2, '#2f2421'); R(ctx, 68, 57, 5, 2, '#2f2421');
      // poussière
      R(ctx, 8, 58, 3, 1, 'rgba(231,214,173,0.7)'); R(ctx, 71, 58, 4, 1, 'rgba(231,214,173,0.7)');
      // couronne invisible : gardien
    }
  };

  BOSS_SHAPES.treant = {
    w: 72, h: 84, draw(ctx, w, h, f, c, ft) {
      const sway = f ? 2 : -1;
      // racines
      line(ctx, 30, 72, 15, 83, c.shade, 6); line(ctx, 44, 72, 59, 83, c.shade, 6);
      R(ctx, 27, 74, 22, 8, c.shade);
      line(ctx, 36, 73, 33, 83, c.light, 2);
      // tronc
      R(ctx, 25, 33, 25, 42, c.body);
      R(ctx, 29, 36, 7, 34, c.light);
      R(ctx, 43, 41, 5, 28, c.shade);
      // visage dans le tronc
      R(ctx, 31, 44, 4, 5, c.eye); R(ctx, 42, 44, 4, 5, c.eye);
      R(ctx, 33, 46, 2, 1, '#f3efc0'); R(ctx, 43, 46, 2, 1, '#f3efc0');
      R(ctx, 36, 53, 6, 2, U.shade(c.body, -45));
      R(ctx, 34, 58, 10, 1, c.shade);
      // coeur lumineux
      R(ctx, 35, 62, 6, 6, c.accent); R(ctx, 37, 63, 2, 3, '#efffb0');
      // branches
      line(ctx, 26, 39, 8, 25 + sway, c.shade, 4);
      line(ctx, 8, 25 + sway, 2, 14, c.shade, 3);
      line(ctx, 48, 40, 63, 27 - sway, c.shade, 4);
      line(ctx, 63, 27 - sway, 69, 18, c.shade, 3);
      // feuillage
      E(ctx, 36, 16, 27, 15, c.accent);
      E(ctx, 19, 18, 12, 10, U.shade(c.accent, -18));
      E(ctx, 54, 15, 14, 12, U.shade(c.accent, 12));
      E(ctx, 36, 8, 15, 6, U.shade(c.accent, 25));
      for (let i = 0; i < 8; i++) R(ctx, 12 + i * 7, 25 + (i % 2), 2, 2, '#ffe27a');
      // bois d'antlers
      line(ctx, 28, 10, 22, 1, c.light, 2); line(ctx, 23, 4, 17, 0, c.light, 2);
      line(ctx, 43, 10, 51, 0, c.light, 2); line(ctx, 50, 3, 57, 1, c.light, 2);
      if (ft.includes('antlers')) {
        line(ctx, 17, 0, 11, 6, c.light, 2); line(ctx, 56, 1, 63, 7, c.light, 2);
      }
      // lucioles
      R(ctx, 8, 45, 2, 2, '#e8ff8a'); R(ctx, 64, 46, 1, 1, '#e8ff8a'); R(ctx, 57, 34, 1, 1, '#d1ff7c');
    }
  };

  BOSS_SHAPES.sandworm = {
    w: 82, h: 64, draw(ctx, w, h, f, c, ft) {
      const wave = f ? 2 : 0;
      // dune
      E(ctx, 41, 57, 38, 8, '#d2b47c');
      E(ctx, 25, 58, 16, 4, '#e3ca95');
      // corps émergeant en S
      E(ctx, 24, 44, 16, 14, c.shade);
      E(ctx, 31, 36, 16, 14, c.body);
      E(ctx, 45, 28, 17, 15, c.shade);
      E(ctx, 58, 22, 15, 15, c.body);
      R(ctx, 16, 36, 5, 15, c.light); R(ctx, 26, 26, 4, 12, c.light); R(ctx, 44, 22, 4, 12, c.light);
      // anneaux
      for (let i = 0; i < 4; i++) R(ctx, 20 + i * 2, 30 + i * 4, 20 + i * 2, 2, c.shade);
      // tête
      E(ctx, 64, 20, 13, 13, c.body);
      R(ctx, 60, 12, 9, 7, c.light);
      // gueule
      E(ctx, 73, 21, 7, 8, '#422627');
      E(ctx, 74, 21, 4, 5, '#b55b45');
      for (let i = 0; i < 6; i++) {
        const ang = i / 6 * Math.PI * 2;
        const tx = 73 + Math.cos(ang) * 6, ty = 21 + Math.sin(ang) * 7;
        R(ctx, tx, ty, 2, 2, '#f6e9c8');
      }
      R(ctx, 67, 14, 3, 3, c.eye); R(ctx, 71, 13, 2, 2, c.eye);
      // écailles dorsales
      for (let i = 0; i < 5; i++) R(ctx, 17 + i * 6, 31 + i * 2, 3, 3, c.accent);
      // sable projeté
      R(ctx, 8, 54, 4, 2, '#e7d09c'); R(ctx, 72, 55, 6, 2, '#e7d09c'); R(ctx, 55, 51, 3, 1, '#e7d09c');
    }
  };

  BOSS_SHAPES.hydra = {
    w: 86, h: 68, draw(ctx, w, h, f, c, ft) {
      const sway = f ? 2 : -1;
      // corps massif
      E(ctx, 42, 51, 30, 14, c.body);
      E(ctx, 38, 45, 20, 8, c.light);
      // pattes
      R(ctx, 17, 54, 10, 10, c.shade); R(ctx, 32, 57, 9, 8, c.body);
      R(ctx, 55, 57, 9, 8, c.body); R(ctx, 66, 54, 10, 10, c.shade);
      R(ctx, 13, 63, 16, 3, c.shade); R(ctx, 63, 63, 16, 3, c.shade);
      // queues / roseaux
      line(ctx, 12, 50, 3, 36, c.shade, 3);
      line(ctx, 72, 50, 82, 38, c.shade, 3);
      // cous
      const necks = [
        { x: 26, y: 30, s: sway }, { x: 42, y: 20, s: -sway }, { x: 60, y: 28, s: sway }
      ];
      necks.forEach((n, idx) => {
        line(ctx, 40, 43, n.x, n.y + 8, c.shade, 6);
        line(ctx, 40, 43, n.x, n.y + 8, c.body, 4);
        E(ctx, n.x, n.y, 8, 7, c.body);
        R(ctx, n.x - 5, n.y - 2, 4, 3, c.light);
        R(ctx, n.x - 3, n.y - 1, 1, 1, c.eye); R(ctx, n.x + 2, n.y - 1, 1, 1, c.eye);
        R(ctx, n.x - 4, n.y + 5, 8, 2, U.shade(c.body, -35));
        for (let i = 0; i < 3; i++) R(ctx, n.x - 3 + i * 3, n.y + 6, 1, 1, '#f3e9c5');
        if (idx === 1) crown(ctx, n.x, n.y - 8, 2);
      });
      // branchies
      for (let i = 0; i < 4; i++) R(ctx, 20 + i * 2, 58 + i % 2, 2, 4, c.accent);
      // bulles
      R(ctx, 11, 29, 2, 2, '#9cd879'); R(ctx, 76, 31, 2, 2, '#9cd879'); R(ctx, 49, 10, 1, 1, '#c4ef9a');
    }
  };

  BOSS_SHAPES.icegolem = {
    w: 70, h: 82, draw(ctx, w, h, f, c, ft) {
      const step = f ? 1 : 0;
      // jambes
      R(ctx, 18, 64, 13, 15, c.shade); R(ctx, 41, 64, 13, 15, c.shade);
      R(ctx, 15, 77 + step, 18, 3, c.body); R(ctx, 40, 77 - step, 18, 3, c.body);
      // torse
      R(ctx, 17, 29, 38, 36, c.body);
      R(ctx, 21, 32, 13, 15, c.light);
      R(ctx, 42, 39, 9, 20, c.shade);
      R(ctx, 14, 33, 8, 18, c.shade); R(ctx, 51, 33, 8, 18, c.shade);
      R(ctx, 11, 49, 9, 9, c.body); R(ctx, 52, 49, 9, 9, c.body);
      // tête
      R(ctx, 24, 10, 23, 16, c.body);
      R(ctx, 28, 13, 10, 7, c.light);
      R(ctx, 29, 19, 4, 3, c.eye); R(ctx, 39, 19, 4, 3, c.eye);
      R(ctx, 34, 25, 5, 1, c.shade);
      // cristaux sur les épaules
      iceShard(ctx, 16, 33, 11, '#d9f8ff', '#7cc3df');
      iceShard(ctx, 54, 30, 12, '#e6fdff', '#8ad0e8');
      iceShard(ctx, 34, 5, 9, '#efffff', '#9eddf2');
      iceShard(ctx, 22, 7, 6, '#e3fbff', '#83c9e1');
      // fissures
      R(ctx, 31, 42, 2, 8, '#5b9cb7'); R(ctx, 33, 48, 7, 2, '#5b9cb7');
      // cœur glacé
      E(ctx, 36, 53, 5, 5, '#8ee3f4'); E(ctx, 36, 53, 2, 2, '#efffff');
      R(ctx, 6, 80, 5, 1, '#d4eef7'); R(ctx, 58, 80, 6, 1, '#d4eef7');
    }
  };

  BOSS_SHAPES.dragon = {
    w: 90, h: 72, draw(ctx, w, h, f, c, ft) {
      const flap = f ? 3 : 0;
      // ailes
      line(ctx, 30, 30, 4, 10 - flap, c.shade, 4);
      line(ctx, 4, 10 - flap, 1, 33, c.shade, 4);
      line(ctx, 1, 33, 23, 43, c.shade, 3);
      line(ctx, 60, 30, 86, 8 - flap, c.shade, 4);
      line(ctx, 86, 8 - flap, 90, 30, c.shade, 4);
      line(ctx, 90, 30, 68, 44, c.shade, 3);
      // membranes
      E(ctx, 15, 26 - flap, 14, 12, U.shade(c.accent, -20));
      E(ctx, 77, 25 - flap, 14, 12, U.shade(c.accent, -20));
      // corps
      E(ctx, 44, 40, 26, 17, c.body);
      E(ctx, 38, 34, 16, 9, c.light);
      E(ctx, 55, 46, 15, 8, c.shade);
      // pattes
      R(ctx, 25, 51, 9, 13, c.shade); R(ctx, 53, 51, 9, 13, c.shade);
      R(ctx, 21, 62, 15, 4, c.body); R(ctx, 51, 62, 15, 4, c.body);
      for (let i = 0; i < 3; i++) { R(ctx, 22 + i * 4, 65, 2, 2, '#f0dfb6'); R(ctx, 52 + i * 4, 65, 2, 2, '#f0dfb6'); }
      // queue
      line(ctx, 22, 45, 4, 49, c.body, 7);
      line(ctx, 4, 49, 1, 38, c.shade, 3);
      // tête
      E(ctx, 66, 27, 13, 11, c.body);
      R(ctx, 63, 20, 9, 7, c.light);
      R(ctx, 69, 24, 3, 3, c.eye); R(ctx, 75, 23, 2, 2, c.eye);
      // museau
      R(ctx, 76, 28, 12, 7, c.light);
      R(ctx, 85, 29, 3, 2, c.shade);
      R(ctx, 79, 33, 8, 2, '#f6e9c7');
      // cornes
      line(ctx, 63, 20, 55, 8, '#f0dfb6', 3);
      line(ctx, 71, 19, 69, 6, '#f0dfb6', 3);
      // épines
      for (let i = 0; i < 6; i++) R(ctx, 30 + i * 5, 25 + (i % 2), 3, 4, c.accent);
      // flammes
      flame(ctx, 84, 20, 3, '#ffad3d', '#ffe46d');
      flame(ctx, 79, 15, 2, '#ff7d2e', '#ffcf5c');
      R(ctx, 66, 40, 8, 2, 'rgba(255,180,80,0.6)');
      // griffes
      R(ctx, 19, 61, 3, 2, '#ffe7b5'); R(ctx, 64, 61, 3, 2, '#ffe7b5');
    }
  };

  BOSS_SHAPES.nyx = {
    w: 66, h: 88, draw(ctx, w, h, f, c, ft) {
      const bob = f ? 2 : 0;
      // cape
      line(ctx, 33, 26, 8, 64, c.shade, 9);
      line(ctx, 33, 26, 58, 64, c.shade, 9);
      E(ctx, 14, 61, 11, 12, c.shade); E(ctx, 52, 61, 11, 12, c.shade);
      for (let i = 0; i < 5; i++) R(ctx, 9 + i * 2, 68 + (i % 2), 2, 4, U.shade(c.shade, -15));
      // jambes
      R(ctx, 25, 68, 7, 14, c.body); R(ctx, 35, 68, 7, 14, c.body);
      R(ctx, 21, 81, 12, 4, U.shade(c.body, -25)); R(ctx, 35, 81, 12, 4, U.shade(c.body, -25));
      // torse
      R(ctx, 22, 37, 23, 28, c.body);
      R(ctx, 26, 40, 7, 20, c.light);
      R(ctx, 38, 44, 5, 19, c.shade);
      R(ctx, 18, 39, 6, 16, c.shade); R(ctx, 43, 39, 6, 16, c.shade);
      // gantelets
      R(ctx, 15, 52, 8, 6, c.accent); R(ctx, 44, 52, 8, 6, c.accent);
      R(ctx, 33, 48, 3, 3, c.accent);
      // tête / heaume
      R(ctx, 24, 18, 19, 18, c.body);
      R(ctx, 27, 21, 8, 9, c.light);
      R(ctx, 27, 26, 5, 2, c.eye); R(ctx, 37, 26, 5, 2, c.eye);
      R(ctx, 29, 27, 2, 1, '#ffc6de'); R(ctx, 39, 27, 2, 1, '#ffc6de');
      R(ctx, 31, 32, 6, 1, c.shade);
      // cornes
      line(ctx, 25, 18, 17, 5, '#c9b7dc', 3);
      line(ctx, 42, 18, 49, 5, '#c9b7dc', 3);
      R(ctx, 15, 3, 3, 3, c.eye); R(ctx, 49, 3, 3, 3, c.eye);
      // couronne
      R(ctx, 28, 11, 12, 3, '#d8c2ee');
      R(ctx, 31, 7, 2, 5, '#f6e9ff'); R(ctx, 36, 7, 2, 5, '#f6e9ff');
      R(ctx, 33, 14, 3, 2, c.eye);
      // épée flottante
      line(ctx, 55, 35, 60, 52, '#e9e0f4', 2);
      R(ctx, 53, 33, 6, 2, c.accent); R(ctx, 58, 52, 3, 3, c.accent);
      // orbes
      R(ctx, 8, 42, 2, 2, '#c67dff'); R(ctx, 56, 26, 1, 1, '#d9a8ff');
      if (ft.includes('cloak')) { R(ctx, 23, 61, 20, 2, U.shade(c.body, 20)); }
    }
  };

  /* ------------------------------------------------------------
     Animation et couleur
     ------------------------------------------------------------ */
  function drawNormalShape(shapeName, colors, features, frame) {
    const def = SHAPES[shapeName] || SHAPES.blob;
    const c = cvs(def.w, def.h);
    def.draw(c.getContext('2d'), def.w, def.h, frame, colors, features || []);
    return outline(c, U.shade(colors.shade, -55));
  }

  function upscale(src, factor) {
    const c = cvs(src.width * factor, src.height * factor);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, c.width, c.height);
    return c;
  }

  Art.getMonster = function (speciesId) {
    const sp = D.SPECIES[speciesId] || D.SPECIES[speciesId];
    if (!sp) return null;
    return Art.cached('monster:' + speciesId, () => {
      const frames = [0, 1].map(f => drawNormalShape(sp.shape, sp.colors, sp.features, f));
      return {
        frames,
        w: frames[0].width,
        h: frames[0].height,
        float: !!sp.ghostly,
        flip: true
      };
    });
  };

  Art.getBossSprite = function (bossId) {
    const b = D.BOSSES[bossId];
    if (!b) return null;
    return Art.cached('boss:' + bossId, () => {
      let frames;
      if (BOSS_SHAPES[b.shape]) {
        frames = [0, 1].map(f => {
          const def = BOSS_SHAPES[b.shape];
          const c = cvs(def.w, def.h);
          def.draw(c.getContext('2d'), def.w, def.h, f, b.colors, b.features || []);
          return outline(c, U.shade(b.colors.shade, -60));
        });
      } else {
        // mini-boss = créature agrandie, avec couronne
        const base = drawNormalShape(b.shape, b.colors, b.features || [], 0);
        const base2 = drawNormalShape(b.shape, b.colors, b.features || [], 1);
        frames = [upscale(base, 2), upscale(base2, 2)];
        frames = frames.map((f, idx) => {
          const c = cvs(f.width, f.height + 6);
          c.getContext('2d').drawImage(f, 0, 6);
          crown(c.getContext('2d'), Math.floor(c.width / 2), 4, 1);
          return outline(c, U.shade(b.colors.shade, -60));
        });
      }
      return {
        frames,
        w: frames[0].width,
        h: frames[0].height,
        float: b.shape === 'ghost' || b.shape === 'wisp' || b.shape === 'nyx',
        flip: true
      };
    });
  };

  Art.getCreatureFrame = function (def, boss, frame) {
    const sprite = boss ? Art.getBossSprite(def.id) : Art.getMonster(def.id);
    if (!sprite) return null;
    return sprite.frames[frame % sprite.frames.length];
  };

  Art.monsterPortrait = function (id, boss) {
    const sprite = boss ? Art.getBossSprite(id) : Art.getMonster(id);
    return sprite ? sprite.frames[0] : null;
  };

  window.Art = Art;
})();
