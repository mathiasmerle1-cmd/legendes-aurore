/* ============================================================
   LES LÉGENDES D'AURORE — bâtiments et objets interactifs
   ============================================================ */
(function () {
  'use strict';
  const U = window.U, Art = window.Art;
  const cvs = Art.cvs, R = Art.R, E = Art.E, line = Art.line;

  function shadow(ctx, cx, cy, rx, ry) {
    ctx.globalAlpha = 0.22; E(ctx, cx, cy, rx, ry, '#18151e'); ctx.globalAlpha = 1;
  }

  function drawHouse(ctx, w, h, o) {
    shadow(ctx, w / 2, h - 8, w * 0.38, 5);
    const wallX = Math.round(w * 0.1), wallY = Math.round(h * 0.47), wallW = Math.round(w * 0.8), wallH = Math.round(h * 0.42);
    // fondation
    R(ctx, wallX - 3, wallY + wallH - 3, wallW + 6, 6, o.stoneDark || '#71695a');
    R(ctx, wallX - 1, wallY + wallH, wallW + 2, 3, o.stone || '#9b9381');
    // murs
    R(ctx, wallX, wallY, wallW, wallH, o.wall);
    R(ctx, wallX + 3, wallY + 3, wallW - 6, wallH - 6, o.wallLight);
    R(ctx, wallX, wallY, wallW, 2, U.shade(o.wall, 20));
    // colombages
    const beam = o.beam || '#6d4b33';
    R(ctx, wallX, wallY, 2, wallH, beam);
    R(ctx, wallX + wallW - 2, wallY, 2, wallH, beam);
    R(ctx, wallX, wallY, wallW, 2, beam);
    R(ctx, wallX + Math.round(wallW * 0.28), wallY, 2, wallH, beam);
    R(ctx, wallX + Math.round(wallW * 0.7), wallY, 2, wallH, beam);
    R(ctx, wallX, wallY + Math.round(wallH * 0.5), wallW, 2, beam);
    // toit
    const roofTop = 4, roofBase = wallY + 3;
    const halfBase = Math.round(w * 0.49), halfTop = Math.round(w * 0.25);
    for (let y = roofTop; y <= roofBase; y++) {
      const t = (y - roofTop) / Math.max(1, roofBase - roofTop);
      const half = Math.round(halfTop + (halfBase - halfTop) * t);
      R(ctx, w / 2 - half, y, half * 2, 1, o.roof);
    }
    // tuiles
    for (let y = roofTop + 5; y < roofBase - 2; y += 4) {
      const t = (y - roofTop) / Math.max(1, roofBase - roofTop);
      const half = Math.round(halfTop + (halfBase - halfTop) * t);
      R(ctx, w / 2 - half, y, half * 2, 1, o.roofDark);
      for (let x = w / 2 - half + 2; x < w / 2 + half; x += 6) {
        R(ctx, Math.round(x + (y % 8 ? 2 : 0)), y - 2, 2, 2, o.roofLight);
      }
    }
    // neige / mousse sur le toit
    if (o.snow) {
      for (let i = 0; i < 15; i++) R(ctx, w * 0.18 + i * (w * 0.045), roofTop + 2 + (i % 3), 4, 2, '#eaf6fa');
    }
    // faîtage
    R(ctx, w / 2 - halfTop - 2, roofTop - 2, halfTop * 2 + 4, 3, o.roofTrim);
    R(ctx, w / 2 - 2, roofTop - 5, 4, 4, o.roofTrimLight || U.shade(o.roofTrim, 25));
    // avancée de toit
    R(ctx, w / 2 - halfBase - 2, roofBase - 3, halfBase * 2 + 4, 4, o.roofDark);
    R(ctx, w / 2 - halfBase, roofBase + 1, halfBase * 2, 2, o.roofTrim);
    // porte
    const doorW = Math.round(w * 0.16), doorH = Math.round(h * 0.24);
    const doorX = Math.round(w / 2 - doorW / 2), doorY = h - 9 - doorH;
    R(ctx, doorX - 2, doorY - 2, doorW + 4, doorH + 4, o.doorFrame || '#5e412b');
    R(ctx, doorX, doorY, doorW, doorH, o.door || '#765032');
    R(ctx, doorX + 2, doorY + 2, doorW - 4, doorH - 4, U.shade(o.door || '#765032', 12));
    R(ctx, doorX + doorW - 5, doorY + Math.round(doorH * 0.55), 2, 2, '#e4bd56');
    R(ctx, doorX - 3, h - 7, doorW + 6, 4, o.step || '#b1a58f');
    R(ctx, doorX - 1, h - 5, doorW + 2, 4, o.stepLight || '#c8bca4');
    // fenêtres
    const winW = Math.round(w * 0.12), winH = Math.round(h * 0.1);
    const wy = wallY + Math.round(wallH * 0.25);
    [wallX + Math.round(wallW * 0.12), wallX + Math.round(wallW * 0.76)].forEach(wx => {
      R(ctx, wx - 2, wy - 2, winW + 4, winH + 4, o.doorFrame || '#5e412b');
      R(ctx, wx, wy, winW, winH, '#c9e6dd');
      R(ctx, wx + 1, wy + 1, winW - 2, winH - 2, o.window || '#89c9d4');
      R(ctx, wx, wy + Math.floor(winH / 2), winW, 1, '#f3ecd7');
      R(ctx, wx + Math.floor(winW / 2), wy, 1, winH, '#f3ecd7');
      R(ctx, wx + 1, wy + 1, Math.max(1, winW - 4), 1, '#e8fbfa');
      // jardinière
      R(ctx, wx - 2, wy + winH + 2, winW + 4, 3, '#8b5e3e');
      R(ctx, wx, wy + winH + 1, 2, 2, o.flower || '#e7c95c');
      R(ctx, wx + 5, wy + winH + 1, 2, 2, o.flower2 || '#e7858e');
    });
    // cheminée
    const chimX = Math.round(w * 0.7), chimY = Math.round(h * 0.09);
    R(ctx, chimX, chimY, Math.round(w * 0.1), Math.round(h * 0.24), o.chimney || '#7d6b5c');
    R(ctx, chimX + 2, chimY, Math.round(w * 0.06), Math.round(h * 0.23), o.chimneyLight || '#a6907b');
    R(ctx, chimX - 2, chimY - 3, Math.round(w * 0.1) + 4, 4, o.chimneyTop || '#5d4e44');
    // déco supplémentaire
    if (o.extra) o.extra(ctx, w, h, wallX, wallY, wallW, wallH);
  }

  function building(key, w, h, opt) {
    return Art.cached('building:' + key, () => {
      const c = cvs(w, h);
      drawHouse(c.getContext('2d'), w, h, opt);
      return Art.outline(c, '#2a212b');
    });
  }

  const HOUSE_COMMON = {
    wall: '#e1d1ad', wallLight: '#e9dcbf', stone: '#a69b87', stoneDark: '#746b5c',
    door: '#7b5434', doorFrame: '#5a3d29', step: '#b5a58d', stepLight: '#cdbfa7',
    window: '#8ac7d4', chimney: '#8c7564', chimneyLight: '#b49c85', chimneyTop: '#61504a',
    flower: '#e8c95c', flower2: '#df8692'
  };

  Art.house = function (variant) {
    const palettes = [
      { roof: '#b85a4f', roofDark: '#8f3f3d', roofLight: '#d27365', roofTrim: '#68302e' },
      { roof: '#597fa8', roofDark: '#3f5e83', roofLight: '#739bc3', roofTrim: '#304966' },
      { roof: '#6f9461', roofDark: '#4f7048', roofLight: '#88ad75', roofTrim: '#3a5436' }
    ];
    const extra = variant === 1 ? (ctx, w, h) => {
      R(ctx, w * 0.16, h - 22, 10, 8, '#8a603c'); R(ctx, w * 0.16, h - 23, 10, 2, '#a47a4e');
      R(ctx, w * 0.78, h - 20, 9, 6, '#8a603c');
    } : null;
    return building('house' + variant, 104, 98, Object.assign({}, HOUSE_COMMON, palettes[variant % 3], { extra }));
  };

  Art.shop = function () {
    return building('shop', 116, 104, Object.assign({}, HOUSE_COMMON, {
      roof: '#6a9e80', roofDark: '#4b7962', roofLight: '#84b797', roofTrim: '#355a47',
      wall: '#f0dfb6', wallLight: '#f7e9c8', door: '#805636', doorFrame: '#5c3d28',
      flower: '#e1b948', flower2: '#d97c86',
      extra(ctx, w, h, wallX, wallY, wallW, wallH) {
        // auvent rayé
        const ax = wallX + 3, ay = wallY + 2, aw = wallW - 6, ah = 9;
        for (let i = 0; i < 8; i++) {
          R(ctx, ax + i * (aw / 8), ay, Math.ceil(aw / 8), ah, i % 2 ? '#e4ddc4' : '#578c74');
        }
        R(ctx, ax, ay + ah, aw, 2, '#3f6754');
        // enseigne
        const sx = w / 2 - 13, sy = wallY - 6;
        R(ctx, sx, sy, 26, 11, '#5c432b'); R(ctx, sx + 2, sy + 2, 22, 7, '#d8bb74');
        Art.drawText(ctx, 'SHOP', sx + 4, sy + 3, '#4c3927', 1, false);
        // tonneaux
        R(ctx, w - 24, h - 27, 10, 13, '#8a6139'); R(ctx, w - 23, h - 27, 8, 2, '#a77b4a'); R(ctx, w - 24, h - 23, 10, 2, '#5f4128'); R(ctx, w - 24, h - 19, 10, 1, '#5f4128');
        R(ctx, 9, h - 25, 9, 11, '#8a6139'); R(ctx, 10, h - 25, 7, 2, '#a77b4a'); R(ctx, 9, h - 21, 9, 2, '#5f4128');
      }
    }));
  };

  Art.forge = function () {
    return building('forge', 112, 102, Object.assign({}, HOUSE_COMMON, {
      roof: '#7d5b4c', roofDark: '#5a4038', roofLight: '#9e7662', roofTrim: '#3f2d29',
      wall: '#b8b0a2', wallLight: '#cdc4b3', stone: '#8b8579', stoneDark: '#5e5a52',
      door: '#5d4538', doorFrame: '#3f3028', window: '#e7a45c', step: '#8f887c', stepLight: '#aaa294',
      chimney: '#5c5550', chimneyLight: '#837a72', chimneyTop: '#3b3430',
      extra(ctx, w, h, wallX, wallY, wallW, wallH) {
        // enclume
        R(ctx, w * 0.77, h - 21, 14, 4, '#5b5e63'); R(ctx, w * 0.79, h - 17, 4, 6, '#44474c');
        R(ctx, w * 0.75, h - 23, 6, 3, '#6e7378'); R(ctx, w * 0.87, h - 23, 5, 3, '#6e7378');
        // braises
        R(ctx, w * 0.12, h - 24, 4, 3, '#d95f35'); R(ctx, w * 0.15, h - 25, 2, 2, '#f0a344');
        R(ctx, w * 0.17, h - 22, 3, 2, '#b24a2d');
        // enseigne
        const sx = w / 2 - 14, sy = wallY - 7;
        R(ctx, sx, sy, 28, 11, '#3f302a'); R(ctx, sx + 2, sy + 2, 24, 7, '#9a7d57');
        R(ctx, sx + 5, sy + 4, 8, 3, '#d4d8da'); R(ctx, sx + 7, sy + 3, 4, 5, '#d4d8da');
        R(ctx, sx + 17, sy + 5, 3, 3, '#e3a04b');
      }
    }));
  };

  Art.hall = function () {
    return Art.cached('building:hall', () => {
      const w = 146, h = 120;
      const c = cvs(w, h), ctx = c.getContext('2d');
      // ombre / fondation
      shadow(ctx, w / 2, h - 8, 58, 7);
      R(ctx, 12, 65, 122, 46, '#a69a84');
      R(ctx, 16, 61, 114, 50, '#c8b896');
      R(ctx, 20, 67, 106, 41, '#e2d1ad');
      R(ctx, 24, 70, 98, 34, '#eadcbe');
      // pierres
      for (let i = 0; i < 9; i++) R(ctx, 22 + i * 12, 78, 10, 1, '#cdbb98');
      for (let i = 0; i < 8; i++) R(ctx, 26 + i * 12, 88, 10, 1, '#cdbb98');
      // tour centrale
      R(ctx, 58, 22, 30, 70, '#d2c19e');
      R(ctx, 61, 25, 24, 64, '#e7d6b3');
      // toit principal
      const cx = w / 2;
      for (let y = 30; y <= 74; y++) {
        const t = (y - 30) / 44;
        const half = Math.round(28 + 45 * t);
        R(ctx, cx - half, y, half * 2, 1, y < 52 ? '#4e7693' : '#456b87');
      }
      for (let y = 34; y < 70; y += 5) {
        const t = (y - 30) / 44;
        const half = Math.round(28 + 45 * t);
        R(ctx, cx - half, y, half * 2, 1, '#335a79');
        for (let x = cx - half + 3; x < cx + half; x += 7) R(ctx, x, y - 2, 3, 2, '#6790ae');
      }
      R(ctx, cx - 50, 72, 100, 5, '#2d4d66');
      // toit de la tour
      for (let y = 8; y < 28; y++) {
        const t = (y - 8) / 20;
        const half = Math.round(4 + 20 * t);
        R(ctx, cx - half, y, half * 2, 1, '#4d7898');
      }
      R(ctx, cx - 22, 26, 44, 4, '#2c4c66');
      R(ctx, cx - 2, 0, 4, 8, '#d7bd6c'); R(ctx, cx + 4, 2, 6, 2, '#d7bd6c');
      // horloge
      E(ctx, cx, 43, 9, 9, '#6f573f'); E(ctx, cx, 43, 7, 7, '#efe3c4');
      R(ctx, cx - 1, 37, 2, 6, '#675342'); R(ctx, cx, 43, 4, 1, '#675342');
      R(ctx, cx - 1, 43, 2, 2, '#a58a58');
      // ailes
      R(ctx, 20, 58, 29, 25, '#d4c29e'); R(ctx, 22, 60, 25, 21, '#eadbc0');
      R(ctx, 98, 58, 29, 25, '#d4c29e'); R(ctx, 100, 60, 25, 21, '#eadbc0');
      // fenêtres
      [30, 56, 78, 112].forEach((wx, i) => {
        R(ctx, wx - 4, 64, 18, 16, '#5c4633'); R(ctx, wx - 2, 66, 14, 12, '#93c2cf');
        R(ctx, wx + 1, 67, 3, 4, '#d8f3f2'); R(ctx, wx - 2, 71, 14, 1, '#d6cab5');
      });
      // porte
      R(ctx, cx - 13, 82, 26, 30, '#5a3e2a'); R(ctx, cx - 10, 85, 20, 27, '#765438');
      R(ctx, cx - 10, 85, 20, 2, '#8f6b49');
      R(ctx, cx + 4, 98, 3, 3, '#e1b951');
      R(ctx, cx - 17, 108, 34, 5, '#a0947f'); R(ctx, cx - 15, 111, 30, 5, '#c1b49b');
      // bannières
      R(ctx, 42, 82, 8, 22, '#546f96'); R(ctx, 43, 84, 6, 18, '#7392b8'); R(ctx, 96, 82, 8, 22, '#546f96'); R(ctx, 97, 84, 6, 18, '#7392b8');
      R(ctx, 44, 89, 4, 1, '#e4ca76'); R(ctx, 98, 89, 4, 1, '#e4ca76');
      // escalier
      R(ctx, cx - 20, h - 10, 40, 4, '#b1a188'); R(ctx, cx - 17, h - 6, 34, 4, '#c8b99e');
      return Art.outline(c, '#2b222e');
    });
  };

  Art.fountain = function () {
    return Art.cached('fountain', () => {
      const c = cvs(58, 56), ctx = c.getContext('2d');
      shadow(ctx, 29, 49, 24, 5);
      E(ctx, 29, 40, 24, 10, '#777d73');
      E(ctx, 29, 37, 22, 9, '#a8a99d');
      E(ctx, 29, 34, 19, 7, '#c9cabd');
      E(ctx, 29, 32, 17, 6, '#4f97b0');
      E(ctx, 29, 31, 14, 4, '#6db9cb');
      R(ctx, 19, 29, 8, 1, '#a8e4e0'); R(ctx, 33, 34, 5, 1, '#39839d');
      // colonne
      R(ctx, 25, 19, 8, 13, '#9d9f93'); R(ctx, 26, 20, 4, 11, '#c5c6b8');
      E(ctx, 29, 18, 7, 3, '#b9baac'); E(ctx, 29, 16, 4, 2, '#e2e2d4');
      // jet d'eau
      R(ctx, 28, 10, 2, 8, '#8fd4de'); R(ctx, 29, 8, 1, 3, '#d9f8f8');
      R(ctx, 26, 13, 1, 4, '#bfeef2'); R(ctx, 31, 12, 1, 5, '#bfeef2');
      R(ctx, 23, 15, 2, 2, '#d9f8f8'); R(ctx, 33, 16, 2, 2, '#d9f8f8');
      R(ctx, 21, 35, 2, 2, '#dff8f8'); R(ctx, 36, 36, 1, 1, '#dff8f8');
      // margelle
      for (let i = 0; i < 9; i++) R(ctx, 9 + i * 5, 38 + (i % 2), 4, 2, '#8e9287');
      R(ctx, 8, 44, 42, 4, '#797d73');
      return Art.outline(c, '#2b2630');
    });
  };

  Art.lamp = function () {
    return Art.cached('lamp', () => {
      const c = cvs(15, 44), ctx = c.getContext('2d');
      R(ctx, 7, 10, 2, 30, '#4d4b55'); R(ctx, 6, 38, 4, 4, '#3a3841');
      R(ctx, 4, 40, 8, 3, '#2f2d35');
      R(ctx, 4, 5, 8, 8, '#55535e'); R(ctx, 5, 6, 6, 6, '#f4d886');
      R(ctx, 6, 7, 2, 3, '#fff3be'); R(ctx, 3, 3, 10, 2, '#3a3841');
      R(ctx, 7, 1, 2, 3, '#3a3841');
      return Art.outline(c, '#241f2c');
    });
  };

  Art.barrel = function () {
    return Art.cached('barrel', () => {
      const c = cvs(18, 22), ctx = c.getContext('2d');
      shadow(ctx, 9, 19, 7, 2);
      R(ctx, 3, 4, 12, 16, '#835c36');
      R(ctx, 4, 4, 4, 16, '#9c7042'); R(ctx, 12, 5, 2, 14, '#664528');
      R(ctx, 2, 5, 14, 2, '#5b4b3f'); R(ctx, 2, 16, 14, 2, '#5b4b3f');
      E(ctx, 9, 4, 6, 2, '#a77b4d'); E(ctx, 9, 4, 4, 1, '#c79a68');
      R(ctx, 8, 8, 1, 5, '#5d4028');
      return Art.outline(c, '#2a212b');
    });
  };

  Art.crate = function () {
    return Art.cached('crate', () => {
      const c = cvs(20, 20), ctx = c.getContext('2d');
      shadow(ctx, 10, 17, 8, 2);
      R(ctx, 2, 3, 16, 15, '#8a623a'); R(ctx, 3, 4, 14, 13, '#a37a4a');
      R(ctx, 2, 3, 16, 2, '#634427'); R(ctx, 2, 15, 16, 2, '#634427');
      line(ctx, 4, 5, 16, 17, '#6d4b2c', 2); line(ctx, 16, 5, 4, 17, '#6d4b2c', 2);
      R(ctx, 4, 12, 2, 1, '#d1ae70');
      return Art.outline(c, '#29212c');
    });
  };

  Art.bench = function () {
    return Art.cached('bench', () => {
      const c = cvs(30, 20), ctx = c.getContext('2d');
      shadow(ctx, 15, 17, 13, 3);
      R(ctx, 2, 5, 26, 6, '#a76e3f'); R(ctx, 3, 6, 24, 2, '#c08751'); R(ctx, 2, 10, 26, 2, '#744a2d');
      R(ctx, 4, 12, 3, 7, '#5c3d29'); R(ctx, 23, 12, 3, 7, '#5c3d29');
      R(ctx, 2, 2, 26, 2, '#8d5e36');
      return Art.outline(c, '#29212c');
    });
  };

  Art.signpost = function () {
    return Art.cached('signpost', () => {
      const c = cvs(24, 31), ctx = c.getContext('2d');
      shadow(ctx, 12, 28, 8, 2);
      R(ctx, 10, 10, 3, 19, '#75512f'); R(ctx, 11, 10, 1, 17, '#976c42');
      R(ctx, 3, 4, 18, 11, '#7c5734'); R(ctx, 4, 5, 16, 9, '#c49a60');
      R(ctx, 5, 7, 12, 1, '#8e693c'); R(ctx, 5, 10, 9, 1, '#8e693c');
      R(ctx, 18, 8, 3, 2, '#9a7550');
      R(ctx, 7, 22, 9, 2, '#5f4329');
      return Art.outline(c, '#29212c');
    });
  };

  Art.chest = function (open) {
    return Art.cached('chest:' + open, () => {
      const c = cvs(22, 20), ctx = c.getContext('2d');
      shadow(ctx, 11, 17, 8, 2);
      if (!open) {
        R(ctx, 2, 7, 18, 10, '#8f5f2f'); R(ctx, 3, 8, 16, 8, '#b07c42');
        R(ctx, 1, 4, 20, 5, '#a06c38'); R(ctx, 2, 5, 18, 3, '#c08b4f');
        R(ctx, 2, 6, 18, 1, '#6f4929');
        R(ctx, 9, 8, 4, 5, '#e0b74e'); R(ctx, 10, 10, 2, 3, '#7a5526');
        R(ctx, 3, 12, 16, 1, '#7a542e');
      } else {
        R(ctx, 2, 9, 18, 8, '#8f5f2f'); R(ctx, 3, 10, 16, 6, '#b07c42');
        R(ctx, 1, 1, 20, 4, '#a06c38'); R(ctx, 2, 2, 18, 2, '#c08b4f');
        R(ctx, 3, 5, 16, 4, '#6d4526');
        R(ctx, 6, 8, 10, 2, '#ffe06b'); R(ctx, 8, 6, 6, 2, '#ffd35a');
        R(ctx, 10, 4, 2, 3, '#fff3b0');
      }
      R(ctx, 2, 15, 18, 2, '#6b4728');
      return Art.outline(c, '#2a212c');
    });
  };

  Art.shrine = function (kind) {
    return Art.cached('shrine:' + kind, () => {
      if (kind === 'village') {
        const c = cvs(36, 48), ctx = c.getContext('2d');
        shadow(ctx, 18, 44, 14, 4);
        R(ctx, 6, 37, 24, 7, '#827a6f'); R(ctx, 8, 34, 20, 5, '#b0a58f'); R(ctx, 10, 32, 16, 4, '#d0c5aa');
        R(ctx, 13, 22, 10, 12, '#91867a'); R(ctx, 15, 23, 6, 9, '#b3a895');
        // cristal
        const pts = [[18, 2], [24, 10], [22, 22], [14, 22], [12, 10]];
        ctx.fillStyle = '#8de0e5'; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath(); ctx.fill();
        R(ctx, 16, 8, 3, 10, '#d8fbfa'); R(ctx, 20, 10, 2, 7, '#5cb9c7');
        R(ctx, 17, 3, 1, 4, '#f2ffff');
        R(ctx, 10, 35, 2, 1, '#e4c66a'); R(ctx, 24, 33, 2, 1, '#e4c66a');
        return Art.outline(c, '#2a2630');
      }
      const c = cvs(32, 28), ctx = c.getContext('2d');
      shadow(ctx, 16, 25, 13, 3);
      // bûches
      line(ctx, 4, 20, 27, 23, '#6f4b2f', 4); line(ctx, 4, 23, 27, 20, '#8b613c', 3);
      R(ctx, 3, 19, 3, 4, '#5a3c27'); R(ctx, 26, 19, 3, 4, '#5a3c27');
      // pierres
      for (let i = 0; i < 5; i++) R(ctx, 4 + i * 5, 16 + (i % 2), 4, 2, '#8d8374');
      // flammes
      E(ctx, 16, 12, 6, 7, '#d96432'); E(ctx, 16, 13, 4, 6, '#f29c3f'); E(ctx, 16, 15, 2, 4, '#ffd65e');
      R(ctx, 15, 3, 2, 5, '#ffe89a'); R(ctx, 12, 8, 1, 3, '#ffbe4e'); R(ctx, 20, 7, 1, 3, '#ffbe4e');
      // étincelles
      R(ctx, 8, 7, 1, 1, '#ffdf74'); R(ctx, 25, 10, 1, 1, '#ffdf74'); R(ctx, 20, 2, 1, 1, '#fff3b0');
      return Art.outline(c, '#2a222c');
    });
  };

  Art.arenaStone = function (biome, variant) {
    return Art.cached('arenastone:' + biome + ':' + variant, () => {
      const c = cvs(30, 55), ctx = c.getContext('2d');
      shadow(ctx, 15, 50, 11, 4);
      const cols = {
        plains: ['#8a8373', '#a79f8b', '#655f53'], forest: ['#737966', '#909781', '#505647'],
        desert: ['#b49a6d', '#d1b888', '#8a7049'], swamp: ['#6c715b', '#868a70', '#4b5141'],
        tundra: ['#9bb5c1', '#c2d8e2', '#718b98'], volcano: ['#584945', '#74615a', '#3d302e']
      }[biome] || ['#8a8373', '#a79f8b', '#655f53'];
      const rng = U.mulberry32(U.hashString(biome + variant + 'stone'));
      R(ctx, 8, 12, 14, 38, cols[0]);
      R(ctx, 10, 10, 10, 39, cols[1]);
      R(ctx, 10, 12, 3, 34, U.shade(cols[1], 18));
      R(ctx, 18, 15, 2, 31, cols[2]);
      R(ctx, 6, 9, 18, 4, cols[0]); R(ctx, 8, 6, 14, 4, cols[1]);
      R(ctx, 9, 45, 12, 4, cols[2]);
      // rune
      const runeCol = { plains: '#e8d17a', forest: '#a5d483', desert: '#ffe08a', swamp: '#b8d47a', tundra: '#bff2ff', volcano: '#ffb35c' }[biome] || '#e8d17a';
      if (variant === 0) {
        R(ctx, 14, 20, 2, 12, runeCol); R(ctx, 11, 24, 8, 2, runeCol);
      } else {
        R(ctx, 12, 27, 6, 2, runeCol); R(ctx, 14, 22, 2, 10, runeCol);
      }
      // fissures
      for (let i = 0; i < 3; i++) {
        const x = 9 + rng() * 12, y = 17 + rng() * 20;
        R(ctx, x, y, 1, 2 + rng() * 4, cols[2]);
      }
      return Art.outline(c, '#2a222b');
    });
  };

  Art.brazier = function (biome) {
    return Art.cached('brazier:' + biome, () => {
      const c = cvs(22, 39), ctx = c.getContext('2d');
      shadow(ctx, 11, 35, 8, 3);
      R(ctx, 7, 20, 8, 13, '#57504c'); R(ctx, 8, 21, 3, 10, '#7c7268');
      R(ctx, 4, 32, 14, 3, '#403a39'); R(ctx, 6, 16, 10, 5, '#6d635a'); R(ctx, 5, 18, 12, 3, '#4c4440');
      E(ctx, 11, 12, 5, 6, '#d36131'); E(ctx, 11, 13, 3, 4, '#ffb042'); E(ctx, 11, 14, 2, 3, '#ffe27a');
      R(ctx, 10, 3, 2, 5, '#ffd873'); R(ctx, 7, 9, 1, 2, '#ff9e3b'); R(ctx, 15, 8, 1, 2, '#ff9e3b');
      R(ctx, 5, 14, 1, 1, '#ffedb0'); R(ctx, 17, 12, 1, 1, '#ffedb0');
      return Art.outline(c, '#29212c');
    });
  };

  Art.pillar = function (biome) {
    return Art.cached('pillar:' + biome, () => {
      const c = cvs(28, 48), ctx = c.getContext('2d');
      shadow(ctx, 14, 44, 10, 4);
      const col = biome === 'tundra' ? ['#8ca5b1', '#b5cbd5', '#647d8a'] : ['#7e7568', '#a39784', '#5b544a'];
      R(ctx, 7, 13, 14, 28, col[0]); R(ctx, 9, 11, 10, 29, col[1]); R(ctx, 16, 15, 2, 24, col[2]);
      R(ctx, 5, 10, 18, 4, col[0]); R(ctx, 7, 7, 14, 4, col[1]);
      R(ctx, 5, 39, 18, 4, col[2]); R(ctx, 8, 43, 12, 3, col[0]);
      R(ctx, 12, 18, 2, 7, '#b9ac93'); R(ctx, 9, 88, 1, 1, col[2]);
      R(ctx, 12, 22, 2, 6, '#b9ac93');
      R(ctx, 15, 8, 2, 2, '#b0c787');
      // cassure
      ctx.clearRect(8, 5, 3, 4); ctx.clearRect(19, 4, 2, 6);
      return Art.outline(c, '#2a232c');
    });
  };

  Art.monolith = function () {
    return Art.cached('monolith', () => {
      const c = cvs(58, 94), ctx = c.getContext('2d');
      shadow(ctx, 29, 89, 24, 5);
      // socle
      E(ctx, 29, 84, 25, 7, '#37303f');
      E(ctx, 29, 81, 21, 6, '#4a4055');
      R(ctx, 9, 84, 40, 6, '#2b2533');
      // obélisque
      R(ctx, 17, 14, 24, 67, '#3d3448');
      R(ctx, 21, 10, 16, 69, '#4d405a');
      R(ctx, 23, 14, 4, 62, '#68547a');
      R(ctx, 35, 18, 2, 58, '#2c2636');
      R(ctx, 14, 14, 4, 67, '#302937'); R(ctx, 40, 14, 4, 67, '#302937');
      R(ctx, 18, 8, 22, 6, '#554663'); R(ctx, 24, 4, 10, 5, '#62516f');
      // œil / cristal
      E(ctx, 29, 41, 8, 10, '#211b2b'); E(ctx, 29, 41, 6, 8, '#6b3e95');
      E(ctx, 29, 41, 4, 6, '#b667ff'); E(ctx, 29, 40, 2, 3, '#f1d8ff');
      line(ctx, 24, 33, 29, 29, '#6f4f8c', 2); line(ctx, 34, 33, 29, 29, '#6f4f8c', 2);
      // runes
      for (let i = 0; i < 5; i++) {
        R(ctx, 24, 57 + i * 4, 10, 1, '#7b58a0'); R(ctx, 26 + i * 2, 55 + i * 4, 1, 2, '#a77bd0');
      }
      R(ctx, 22, 76, 15, 2, '#8f6cb6');
      // éclats
      R(ctx, 12, 78, 3, 8, '#5f4a75'); R(ctx, 45, 76, 2, 7, '#6d5585'); R(ctx, 15, 88, 2, 2, '#8c6aa5');
      return Art.outline(c, '#251e2d');
    });
  };

  Art.anvil = function () {
    return Art.cached('anvil', () => {
      const c = cvs(22, 16), ctx = c.getContext('2d');
      R(ctx, 3, 4, 16, 4, '#5f6368'); R(ctx, 5, 2, 10, 3, '#7d8287'); R(ctx, 9, 8, 4, 5, '#494d51'); R(ctx, 4, 13, 14, 2, '#3c3f43');
      return Art.outline(c, '#282128');
    });
  };

  Art.dummy = function () {
    return Art.cached('dummy', () => {
      const c = cvs(22, 36), ctx = c.getContext('2d');
      R(ctx, 10, 9, 3, 24, '#6e4f32'); R(ctx, 5, 12, 12, 3, '#7d5a39');
      E(ctx, 11, 8, 5, 5, '#c4a769'); R(ctx, 9, 6, 1, 1, '#4c3b26'); R(ctx, 13, 6, 1, 1, '#4c3b26'); R(ctx, 11, 10, 2, 1, '#8d724a');
      R(ctx, 3, 32, 16, 3, '#5c4328');
      R(ctx, 4, 15, 4, 2, '#b99453'); R(ctx, 15, 16, 4, 2, '#b99453');
      return Art.outline(c, '#29212c');
    });
  };

  Art.deadSign = function () {
    return Art.cached('dead-sign', () => {
      const c = cvs(22, 26), ctx = c.getContext('2d');
      R(ctx, 9, 9, 3, 15, '#5f4630'); R(ctx, 3, 4, 16, 8, '#6e5236'); R(ctx, 4, 5, 14, 6, '#9b7a4d');
      R(ctx, 6, 7, 9, 1, '#72563a'); R(ctx, 16, 3, 2, 3, '#8f6d47');
      return Art.outline(c, '#29212c');
    });
  };

  Art.well = function () {
    return Art.cached('well', () => {
      const c = cvs(34, 34), ctx = c.getContext('2d');
      shadow(ctx, 17, 30, 13, 3);
      E(ctx, 17, 24, 13, 6, '#7d7568'); E(ctx, 17, 22, 10, 5, '#2f3c43'); E(ctx, 17, 21, 8, 4, '#485e65');
      R(ctx, 4, 16, 3, 12, '#8c806f'); R(ctx, 27, 16, 3, 12, '#6f6557');
      R(ctx, 2, 13, 30, 3, '#54493c'); R(ctx, 6, 8, 3, 7, '#7b6448'); R(ctx, 25, 8, 3, 7, '#7b6448');
      R(ctx, 5, 5, 24, 4, '#6a4f36'); R(ctx, 6, 3, 22, 3, '#88643f');
      R(ctx, 16, 15, 2, 5, '#8b6b46'); R(ctx, 13, 18, 8, 2, '#6f5335');
      return Art.outline(c, '#29212c');
    });
  };

  /* ------------------------------------------------------------
     Avant-postes : sol de camp, tente et feu de camp
     ------------------------------------------------------------ */
  const CAMP_PAL = {
    plains: { dirt: '#b09a6c', dirt2: '#9a8459', edge: '#7d8a52', stone: '#8c8270', tent: '#c26a52', tent2: '#9a4b3c', trim: '#f0d9a0' },
    forest: { dirt: '#8b886a', dirt2: '#747458', edge: '#526b43', stone: '#7b7d6d', tent: '#4f7d58', tent2: '#376044', trim: '#d9d6a4' },
    desert: { dirt: '#c4a872', dirt2: '#ad8f5b', edge: '#a08a58', stone: '#a69979', tent: '#b08a4c', tent2: '#8c6936', trim: '#f0dca4' },
    swamp: { dirt: '#7c7b5e', dirt2: '#66654c', edge: '#4f6242', stone: '#6c6a5a', tent: '#5d6f4c', tent2: '#42543a', trim: '#c4d09a' },
    tundra: { dirt: '#a8b4b4', dirt2: '#8f9c9e', edge: '#d6e6ea', stone: '#8b9aa1', tent: '#5e7f96', tent2: '#446174', trim: '#e6f6fb' },
    volcano: { dirt: '#7d6a61', dirt2: '#65544d', edge: '#4d3d3a', stone: '#665650', tent: '#8c4a3d', tent2: '#66332c', trim: '#e0a86a' }
  };

  Art.campGround = function (biome) {
    return Art.cached('camp-ground:' + biome, () => {
      const p = CAMP_PAL[biome] || CAMP_PAL.plains;
      const c = cvs(158, 118), ctx = c.getContext('2d');
      const cx = 79, cy = 61;
      const rng = U.mulberry32(U.hashString('camp' + biome));
      ctx.globalAlpha = 0.2; E(ctx, cx, cy, 76, 56, '#242018'); ctx.globalAlpha = 1;
      E(ctx, cx, cy, 72, 53, p.edge);
      E(ctx, cx, cy, 66, 48, p.dirt2);
      E(ctx, cx, cy, 60, 43, p.dirt);
      for (let i = 0; i < 180; i++) {
        const a = rng() * Math.PI * 2, d = Math.sqrt(rng());
        R(ctx, cx + Math.cos(a) * d * 58, cy + Math.sin(a) * d * 41, rng() < 0.3 ? 2 : 1, 1, rng() < 0.5 ? p.dirt2 : p.edge);
      }
      // cailloux du cercle de feu
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2;
        R(ctx, cx + 8 + Math.cos(a) * 14 - 2, cy + 6 + Math.sin(a) * 9 - 1, 4, 3, p.stone);
        R(ctx, cx + 8 + Math.cos(a) * 14 - 1, cy + 6 + Math.sin(a) * 9 - 2, 2, 1, U.shade(p.stone, 18));
      }
      // touffes d'herbe sur le bord
      for (let i = 0; i < 22; i++) {
        const a = rng() * Math.PI * 2;
        const x = cx + Math.cos(a) * (63 + rng() * 7);
        const y = cy + Math.sin(a) * (46 + rng() * 5);
        R(ctx, x, y, 1, 2, p.edge);
      }
      return c;
    });
  };

  Art.tent = function (biome) {
    return Art.cached('tent:' + biome, () => {
      const p = CAMP_PAL[biome] || CAMP_PAL.plains;
      const w = 62, h = 54;
      const c = cvs(w, h), ctx = c.getContext('2d');
      shadow(ctx, 31, 46, 24, 5);
      // perches
      R(ctx, 8, 12, 3, 36, '#6b4a30'); R(ctx, 51, 12, 3, 36, '#6b4a30');
      R(ctx, 6, 10, 7, 3, '#8d6540'); R(ctx, 49, 10, 7, 3, '#8d6540');
      // toile triangulaire
      for (let y = 12; y <= 44; y++) {
        const t = (y - 12) / 32;
        const half = Math.round(10 + t * 21);
        R(ctx, 31 - half, y, half * 2, 1, y < 20 ? p.trim : p.tent);
      }
      R(ctx, 10, 42, 42, 4, p.tent2);
      // plis
      line(ctx, 31, 14, 16, 40, p.tent2, 1);
      line(ctx, 31, 14, 45, 40, p.tent2, 1);
      line(ctx, 31, 18, 31, 42, U.shade(p.tent, -12), 1);
      // entrée
      for (let y = 26; y <= 42; y++) {
        const t = (y - 26) / 16;
        const half = Math.round(3 + t * 8);
        R(ctx, 31 - half, y, half * 2, 1, '#231b22');
      }
      R(ctx, 29, 20, 4, 4, '#f0d9a0');
      // fanion
      R(ctx, 32, 3, 2, 9, '#6b4a30');
      R(ctx, 34, 3, 8, 4, p.trim); R(ctx, 34, 3, 4, 2, p.tent2);
      return Art.outline(c, '#29212c');
    });
  };

  Art.campfire = function () {
    return Art.cached('campfire', () => {
      const c = cvs(30, 26), ctx = c.getContext('2d');
      shadow(ctx, 15, 22, 11, 3);
      R(ctx, 5, 17, 20, 3, '#5d3d29'); R(ctx, 8, 20, 15, 2, '#47301f');
      R(ctx, 7, 15, 3, 7, '#7a4f30'); R(ctx, 20, 15, 3, 7, '#6b442a');
      // flammes
      E(ctx, 15, 13, 7, 8, '#d94f2f');
      E(ctx, 15, 12, 5, 6, '#ff8b3d');
      E(ctx, 15, 10, 3, 4, '#ffd05c');
      R(ctx, 14, 6, 2, 5, '#ffe9a0');
      // braises
      R(ctx, 6, 15, 2, 1, '#ffb45c'); R(ctx, 22, 14, 2, 1, '#ffcf6a'); R(ctx, 9, 11, 1, 1, '#ff9a4e');
      return Art.outline(c, '#2b2026');
    });
  };

  window.Art = Art;
})();
