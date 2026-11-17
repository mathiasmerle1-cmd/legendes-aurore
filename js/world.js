/* ============================================================
   LES LÉGENDES D'AURORE — monde ouvert
   Génération des biomes, chemins, décors, arènes et repères
   ============================================================ */
(function () {
  'use strict';
  const U = window.U, D = window.DATA, Art = window.Art;

  const TS = 16;
  const MS = D.MAP_SCALE || 1;
  const W = D.WORLD_SIZE;
  const H = D.WORLD_SIZE;
  const SPECIAL_NONE = 0, SPECIAL_WATER = 1, SPECIAL_LAVA = 2, SPECIAL_BRIDGE = 3;
  const SEED = 20260214;

  /* Palette de la carte : plus contrastée que le terrain en jeu pour
     rester lisible à petite échelle, avec des teintes de relief. */
  const MAP_PAL = {
    plains: { base: '#7db75a', light: '#9ed274', dark: '#5e9847', deep: '#487c3b', road: '#c9aa75', roadDark: '#9d7d4f', coast: '#e2d6a0', water: '#4f9bb4' },
    forest: { base: '#407a4b', light: '#5b9557', dark: '#2f603b', deep: '#244c31', road: '#a88a5c', roadDark: '#7c633f', coast: '#a9b98a', water: '#427d8a' },
    desert: { base: '#d7b86e', light: '#f0d695', dark: '#bc9854', deep: '#9c7c42', road: '#e3c17a', roadDark: '#b8934f', coast: '#f5e6b3', water: '#4c9cad' },
    swamp: { base: '#617b52', light: '#7e9868', dark: '#4a6341', deep: '#395034', road: '#957e56', roadDark: '#6d5c3e', coast: '#a1ad7c', water: '#466759' },
    tundra: { base: '#cfdfe6', light: '#ecf6fa', dark: '#b2c9d4', deep: '#95b1c0', road: '#bbb6a5', roadDark: '#8f8b7c', coast: '#f7fdff', water: '#80b8c9' },
    volcano: { base: '#5f4a45', light: '#806055', dark: '#483635', deep: '#362829', road: '#715c4f', roadDark: '#4f4039', coast: '#8c6b5d', water: '#3e6a71' }
  };
  const MAP_WATER = {
    shallow: '#65b4c4', mid: '#3f819a', deep: '#285b76', foam: '#c3eaec',
    lavaShallow: '#e4753f', lavaMid: '#bd502e', lavaDeep: '#8b3424', lavaFoam: '#ffd06a'
  };

  function key(x, y) { return y * W + x; }
  function inBounds(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }

  class World {
    constructor(seed) {
      this.seed = seed || SEED;
      this.w = W; this.h = H; this.ts = TS;
      this.biome = new Uint8Array(W * H);
      this.blocked = new Uint8Array(W * H);
      this.special = new Uint8Array(W * H);
      this.path = new Uint8Array(W * H);
      this.variant = new Uint8Array(W * H);
      this.decor = [];
      this.decorGrid = new Map();
      this.interactables = [];
      this.emitters = [];
      this.arenas = [];
      this.npcs = [];
      this.chests = [];
      this.shrines = [];
      this.signs = [];
      this.spawnPoints = [];
      this.outposts = [];
      this.houses = [];
      this.buildingRects = [];
      this.buildingTiles = new Uint8Array(W * H);
      this.village = null;
      this.finalArena = null;
      this.monolith = null;
      this.generate();
    }

    generate() {
      const rng = U.mulberry32(this.seed);
      this.generateBiomes();
      this.generateBorders();
      this.generateWaterAndLava(rng);
      this.markArenas();
      this.generatePaths();
      this.placeVillage(rng);
      this.placeOutposts(rng);
      this.generateArenaDecor(rng);
      this.scatterDecor(rng);
      this.placeInteractables(rng);
      this.generateSpawns(rng);
      this.finalize();
    }

    tileIndex(x, y) { return y * W + x; }
    zoneAtTile(tx, ty) {
      if (!inBounds(tx, ty)) return D.ZONES[0];
      return D.ZONES[this.biome[key(tx, ty)]] || D.ZONES[0];
    }
    biomeAtPx(x, y) { return this.biome[key(U.clamp(Math.floor(x / TS), 0, W - 1), U.clamp(Math.floor(y / TS), 0, H - 1))]; }

    generateBiomes() {
      const rng = U.mulberry32(this.seed + 1);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          let best = 0, bestD = 1e9;
          D.ZONES.forEach((z, i) => {
            // frontières organiques + attracteurs
            const wobble = (U.fbm(x * 0.024 + i * 17, y * 0.024 - i * 11, this.seed + i * 101, 3) - 0.5) * (30 * MS);
            const dx = x - z.anchor.x, dy = y - z.anchor.y;
            const d = Math.sqrt(dx * dx + dy * dy) + wobble;
            if (d < bestD) { bestD = d; best = i; }
          });
          this.biome[key(x, y)] = best;
          this.variant[key(x, y)] = Math.floor(rng() * 4);
        }
      }
      // zones forcées autour des lieux importants
      this.forceBiomeCircle(D.VILLAGE.x, D.VILLAGE.y, 25 * MS, 0);
      this.forceBiomeCircle(D.FINAL_ARENA.x, D.FINAL_ARENA.y, 15 * MS, 0);
      D.ZONES.forEach((z, i) => {
        z.arenas.forEach(a => this.forceBiomeCircle(a.x, a.y, 11 * MS, i));
      });
      D.OUTPOSTS.forEach(o => {
        const z = D.ZONE_BY_ID[o.biome];
        if (z) this.forceBiomeCircle(o.x, o.y, 8 * MS, z.index);
      });
    }

    forceBiomeCircle(cx, cy, r, biomeIndex) {
      for (let y = Math.max(0, cy - r); y <= Math.min(H - 1, cy + r); y++) {
        for (let x = Math.max(0, cx - r); x <= Math.min(W - 1, cx + r); x++) {
          if (U.dist2(x, y, cx, cy) <= r * r) {
            this.biome[key(x, y)] = biomeIndex;
            this.variant[key(x, y)] = (x * 3 + y * 5) % 4;
          }
        }
      }
    }

    generateBorders() {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (x < 3 || y < 3 || x >= W - 3 || y >= H - 3) {
            this.special[key(x, y)] = SPECIAL_WATER;
            this.blocked[key(x, y)] = 1;
          }
        }
      }
    }

    protectedFromWater(tx, ty) {
      if (U.dist2(tx, ty, D.VILLAGE.x, D.VILLAGE.y) < (24 * MS) * (24 * MS)) return true;
      if (U.dist2(tx, ty, D.FINAL_ARENA.x, D.FINAL_ARENA.y) < (14 * MS) * (14 * MS)) return true;
      for (const z of D.ZONES) for (const a of z.arenas) {
        const ar = (a.kind === 'big' ? 15 : 11) * MS;
        if (U.dist2(tx, ty, a.x, a.y) < ar * ar) return true;
      }
      for (const o of D.OUTPOSTS) {
        if (U.dist2(tx, ty, o.x, o.y) < (9 * MS) * (9 * MS)) return true;
      }
      return false;
    }

    setWater(tx, ty, type) {
      if (!inBounds(tx, ty)) return;
      if (this.protectedFromWater(tx, ty)) return;
      const k = key(tx, ty);
      this.special[k] = type;
      this.blocked[k] = 1;
    }

    generateWaterAndLava(rng) {
      const lakes = [
        { x: 91, y: 146, rx: 7, ry: 4 },      // plaine
        { x: 62, y: 66, rx: 8, ry: 5 },       // forêt
        { x: 223, y: 116, rx: 5, ry: 3 },     // oasis
        { x: 148, y: 38, rx: 6, ry: 4 },      // toundra
        { x: 62, y: 202, rx: 5, ry: 3 },      // marais
        { x: 204, y: 208, rx: 4, ry: 3 }      // petit lac volcanique
      ].map(l => ({
        x: l.x * MS, y: l.y * MS,
        rx: l.rx * Math.sqrt(MS), ry: l.ry * Math.sqrt(MS)
      }));
      for (const l of lakes) {
        for (let y = l.y - l.ry - 2; y <= l.y + l.ry + 2; y++) {
          for (let x = l.x - l.rx - 2; x <= l.x + l.rx + 2; x++) {
            if (!inBounds(x, y)) continue;
            const ang = Math.atan2(y - l.y, x - l.x);
            const wob = U.fbm(Math.cos(ang) * 2 + l.x, Math.sin(ang) * 2 + l.y, this.seed + 77, 2) * 0.7 + 0.65;
            const dx = (x - l.x) / (l.rx * wob), dy = (y - l.y) / (l.ry * wob);
            if (dx * dx + dy * dy <= 1) this.setWater(x, y, SPECIAL_WATER);
          }
        }
      }
      // mares du marais et coulées de lave
      for (let y = 6; y < H - 6; y++) {
        for (let x = 6; x < W - 6; x++) {
          const bi = this.biome[key(x, y)];
          if (this.protectedFromWater(x, y)) continue;
          if (bi === 3) {
            const n = U.fbm(x * 0.12, y * 0.12, this.seed + 303, 3);
            if (n > 0.67) this.setWater(x, y, SPECIAL_WATER);
          } else if (bi === 5) {
            const n = U.fbm(x * 0.1, y * 0.1, this.seed + 505, 3);
            if (n > 0.7) this.setWater(x, y, SPECIAL_LAVA);
          }
        }
      }
    }

    markArenas() {
      this.village = {
        id: 'village', x: D.VILLAGE.x * TS + 8, y: D.VILLAGE.y * TS + 16,
        tx: D.VILLAGE.x, ty: D.VILLAGE.y, name: D.VILLAGE.name
      };
      this.finalArena = {
        id: 'final', kind: 'final', biome: 'plains', name: 'Ruines de l’Aube',
        x: D.FINAL_ARENA.x * TS + 8, y: D.FINAL_ARENA.y * TS + 16,
        tx: D.FINAL_ARENA.x, ty: D.FINAL_ARENA.y,
        radiusPx: D.FINAL_ARENA.r * TS, bossId: D.FINAL_ARENA.boss, defeated: false
      };
      this.arenas = [];
      D.ZONES.forEach((z, zi) => {
        z.arenas.forEach(a => {
          this.arenas.push({
            id: a.id, kind: a.kind, biome: z.id, zoneIndex: zi, zone: z,
            name: a.kind === 'big' ? z.name : (D.BOSSES[a.boss].name),
            x: a.x * TS + 8, y: a.y * TS + 16, tx: a.x, ty: a.y,
            radiusPx: (a.kind === 'big' || a.kind === 'final' ? 9 : 6) * TS,
            bossId: a.boss, defeated: false
          });
          // éviter que les alentours immédiats soient bloqués
          const rad = (a.kind === 'big' ? 11 : 8) * MS;
          for (let ty = a.y - rad; ty <= a.y + rad; ty++) {
            for (let tx = a.x - rad; tx <= a.x + rad; tx++) {
              if (inBounds(tx, ty) && U.dist2(tx, ty, a.x, a.y) <= rad * rad) {
                const sp = this.special[key(tx, ty)];
                if (sp === SPECIAL_WATER || sp === SPECIAL_LAVA) this.special[key(tx, ty)] = SPECIAL_NONE;
                this.blocked[key(tx, ty)] = 0;
              }
            }
          }
        });
      });
    }

    stampPathPoint(tx, ty, radius) {
      const r = Math.ceil(radius);
      for (let y = ty - r; y <= ty + r; y++) {
        for (let x = tx - r; x <= tx + r; x++) {
          if (!inBounds(x, y)) continue;
          if (U.dist(x, y, tx, ty) <= radius + 0.2) {
            const k = key(x, y);
            this.path[k] = 1;
            if (this.special[k] === SPECIAL_WATER || this.special[k] === SPECIAL_LAVA) {
              this.special[k] = SPECIAL_BRIDGE;
            }
            this.blocked[k] = 0;
          }
        }
      }
    }

    markPath(points, width) {
      width = width || 1.1;
      for (let i = 0; i < points.length - 1; i++) {
        const [x1, y1] = points[i], [x2, y2] = points[i + 1];
        const len = Math.hypot(x2 - x1, y2 - y1);
        const steps = Math.max(1, Math.ceil(len * 3));
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const x = x1 + (x2 - x1) * t;
          const y = y1 + (y2 - y1) * t;
          const jitter = (U.vnoise(x * 0.17, y * 0.17, this.seed + 55) - 0.5) * 0.65;
          this.stampPathPoint(Math.round(x + jitter), Math.round(y), width);
        }
      }
    }

    generatePaths() {
      const routes = [
        // boucle centrale et plaines
        [[116, 126], [112, 121], [108, 116], [100, 112], [94, 110], [90, 108]],
        [[116, 126], [123, 121], [132, 117], [140, 114], [145, 112]],
        [[116, 126], [118, 134], [121, 142], [124, 151], [126, 160]],
        // forêt
        [[116, 126], [108, 121], [99, 116], [90, 110], [79, 104], [68, 101], [58, 97], [48, 93], [44, 92]],
        [[79, 104], [76, 94], [72, 84], [68, 76]],
        [[68, 101], [58, 89], [49, 76], [40, 60], [34, 48], [32, 44]],
        // toundra
        [[116, 126], [120, 118], [128, 110], [136, 101], [143, 90], [149, 78], [154, 66], [158, 58]],
        [[143, 90], [139, 74], [135, 58], [133, 42], [132, 28], [132, 24]],
        [[149, 78], [159, 66], [168, 52], [174, 40], [178, 30]],
        // désert
        [[116, 126], [125, 128], [137, 131], [150, 133], [163, 137], [176, 146], [188, 156], [198, 164], [205, 170]],
        [[176, 146], [180, 131], [186, 117], [192, 108], [196, 102]],
        [[198, 164], [207, 156], [215, 149], [221, 144], [222, 142]],
        // marais
        [[116, 126], [108, 134], [98, 142], [87, 152], [77, 162], [68, 176], [60, 192], [54, 204], [50, 212], [48, 212]],
        [[77, 162], [63, 162], [50, 166], [38, 172], [30, 174], [28, 174]],
        [[68, 176], [72, 182], [68, 184]],
        // volcan
        [[116, 126], [124, 133], [134, 142], [144, 153], [154, 166], [164, 181], [171, 194], [177, 208], [180, 218]],
        [[154, 166], [153, 176], [156, 184]],
        [[164, 181], [178, 185], [188, 188], [196, 188]],
        // ruines finales
        [[116, 126], [116, 118], [116, 109], [116, 100]]
      ].map(route => route.map(([x, y]) => [Math.round(x * MS), Math.round(y * MS)]));
      routes.forEach(r => this.markPath(r, 1.18));
      // chemin autour de la place
      for (let a = 0; a < 20; a++) {
        const ang = a / 20 * Math.PI * 2;
        this.stampPathPoint(
          Math.round(D.VILLAGE.x + Math.cos(ang) * 13 * MS),
          Math.round(D.VILLAGE.y + Math.sin(ang) * 13 * MS),
          1.35
        );
      }
    }

    /* ----------------------------------------------------------
       Décors
       ---------------------------------------------------------- */
    addToGrid(obj) {
      const gx = Math.floor(obj.x / 128), gy = Math.floor(obj.y / 128);
      const k = gx + ',' + gy;
      if (!this.decorGrid.has(k)) this.decorGrid.set(k, []);
      this.decorGrid.get(k).push(obj);
    }

    addDecor(img, x, y, opts) {
      opts = opts || {};
      const obj = { img, x, y, solid: !!opts.solid, footprint: opts.footprint || null, type: opts.type || 'decor', id: opts.id };
      this.decor.push(obj);
      this.addToGrid(obj);
      if (opts.solid) {
        const fp = opts.footprint || { w: 1, h: 1, ox: 0, oy: 0 };
        const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
        for (let yy = ty + fp.oy; yy < ty + fp.oy + fp.h; yy++) {
          for (let xx = tx + fp.ox; xx < tx + fp.ox + fp.w; xx++) {
            if (inBounds(xx, yy)) this.blocked[key(xx, yy)] = 1;
          }
        }
      }
      return obj;
    }

    isAreaFree(tx, ty, r) {
      for (let y = ty - r; y <= ty + r; y++) {
        for (let x = tx - r; x <= tx + r; x++) {
          if (!inBounds(x, y)) return false;
          const k = key(x, y);
          if (this.blocked[k] || this.special[k] === SPECIAL_WATER || this.special[k] === SPECIAL_LAVA) return false;
          if (this.path[k]) return false;
        }
      }
      return true;
    }

    isNearProtected(tx, ty, extra) {
      extra = extra || 0;
      const vr = D.VILLAGE.r + 10 + extra;
      if (U.dist2(tx, ty, D.VILLAGE.x, D.VILLAGE.y) < vr * vr) return true;
      const fr = D.FINAL_ARENA.r + 9 + extra;
      if (U.dist2(tx, ty, D.FINAL_ARENA.x, D.FINAL_ARENA.y) < fr * fr) return true;
      for (const z of D.ZONES) for (const a of z.arenas) {
        const r = (a.kind === 'big' ? 13 : 9) * MS + extra;
        if (U.dist2(tx, ty, a.x, a.y) < r * r) return true;
      }
      for (const o of this.outposts) {
        const r = 9 * MS + extra;
        if (U.dist2(tx, ty, o.tx, o.ty) < r * r) return true;
      }
      for (const it of this.interactables) {
        const r = 3 * MS + extra;
        if (U.dist2(tx, ty, it.tx, it.ty) < r * r) return true;
      }
      return false;
    }

    isSafeTile(tx, ty) {
      if (U.dist2(tx, ty, D.VILLAGE.x, D.VILLAGE.y) < D.VILLAGE.r * D.VILLAGE.r) return true;
      for (const o of this.outposts) {
        if (U.dist2(tx, ty, o.tx, o.ty) < (9 * MS) * (9 * MS)) return true;
      }
      return false;
    }

    isSafePx(x, y) {
      return this.isSafeTile(Math.floor(x / TS), Math.floor(y / TS));
    }

    placeVillage(rng) {
      // Le village s'agrandit moins vite que le monde : on garde un bourg
      // lisible d'un seul écran, entouré de campagne sauvage.
      const S = 1.35;
      // Les plans du village sont dessinés dans l'espace d'origine (centre 116,126).
      const vtx = x => D.VILLAGE.x + (x - 116) * S;
      const vty = y => D.VILLAGE.y + (y - 126) * S;
      const vpx = x => vtx(x) * TS + 8;
      const vpy = y => vty(y) * TS + 16;

      // sol de la place, agrandi avec le village
      this.village.img = Art.villagePlaza(1.35);
      this.village.decal = true;

      // bâtiments
      let houseCount = 0;
      const addBuilding = (img, tx, ty, wid, hei, kind) => {
        const x = tx * TS + 8, y = ty * TS + 16;
        // Emprise réelle du mur (les toits et auvents débordent visuellement).
        // On bloque des rectangles en pixels plutôt qu'en tuiles : les bâtiments
        // ne sont pas alignés sur la grille et une collision de tuiles laissait
        // des murs invisibles (ou traversables) selon l'arrondi.
        const wallW = img.width * 0.8;
        const wallY = img.height * 0.47;
        const wallH = img.height * 0.42;
        const rect = {
          x1: x - wallW / 2 + 2,
          x2: x + wallW / 2 - 2,
          y1: y - img.height + wallY + 1,
          y2: y - img.height + wallY + wallH + 2
        };
        rect.owner = kind;
        this.buildingRects.push(rect);
        // Marque la zone pendant la génération : arbres, décors et monstres
        // éviteront l'emplacement du bâtiment. La collision finale, elle,
        // utilise le rectangle précis (voir finalize/canStandAt).
        const bx1 = Math.floor(rect.x1 / TS), bx2 = Math.floor((rect.x2 - 0.01) / TS);
        const by1 = Math.floor(rect.y1 / TS), by2 = Math.floor((rect.y2 - 0.01) / TS);
        for (let yy = by1; yy <= by2; yy++) {
          for (let xx = bx1; xx <= bx2; xx++) {
            if (inBounds(xx, yy)) {
              this.blocked[key(xx, yy)] = 1;
              this.buildingTiles[key(xx, yy)] = 1;
            }
          }
        }
        this.addDecor(img, x, y, { type: kind, id: kind });
        this.emitters.push({ x: x + 17, y: y - img.height + 11, type: 'smoke', rate: 1.1, timer: rng() * 2 });

        if (kind === 'house') {
          const index = houseCount++;
          const house = {
            id: 'house_' + index,
            index,
            zoneId: 'plains',
            tx, ty, x, y, w: wid, h: hei,
            door: { x, y: y + 12 }
          };
          this.houses.push(house);
          // La porte se trouve juste devant la façade, sur la tuile libre.
          this.addInteractable({
            kind: 'door', x: house.door.x, y: house.door.y,
            houseId: house.id, house, name: 'Maison'
          });
        }
      };
      addBuilding(Art.hall(), vtx(116), vty(120), 9, 3, 'hall');
      addBuilding(Art.shop(), vtx(103), vty(126), 7, 3, 'shop');
      addBuilding(Art.forge(), vtx(133), vty(126), 7, 3, 'forge');
      addBuilding(Art.house(0), vtx(104), vty(139), 6, 3, 'house');
      addBuilding(Art.house(1), vtx(129), vty(140), 6, 3, 'house');
      addBuilding(Art.house(2), vtx(144), vty(137), 6, 3, 'house');
      addBuilding(Art.house(2), vtx(97), vty(116), 6, 3, 'house');
      addBuilding(Art.house(0), vtx(139), vty(116), 6, 3, 'house');
      // maisons du centre, de part et d'autre du hall
      addBuilding(Art.house(1), vtx(107), vty(119), 6, 3, 'house');
      addBuilding(Art.house(2), vtx(126), vty(118), 6, 3, 'house');

      // fontaine
      const fx = vpx(116), fy = vpy(126);
      this.village.fountain = this.addDecor(Art.fountain(), fx, fy, { solid: true, footprint: { w: 3, h: 2, ox: -1, oy: -1 }, type: 'fountain' });
      this.emitters.push({ x: fx, y: fy - 35, type: 'sparkle', rate: 0.8, timer: 0 });
      // puits et mobilier
      this.addDecor(Art.well(), vpx(109), vpy(133), { solid: true, footprint: { w: 2, h: 1, ox: 0, oy: 0 }, type: 'well' });
      this.addDecor(Art.bench(), vpx(108), vpy(128), { solid: true, type: 'bench' });
      this.addDecor(Art.bench(), vpx(125), vpy(129), { solid: true, type: 'bench' });
      this.addDecor(Art.bench(), vpx(120), vpy(117), { solid: true, type: 'bench' });
      this.addDecor(Art.lamp(), vpx(111), vpy(121), { solid: true, type: 'lamp' });
      this.addDecor(Art.lamp(), vpx(123), vpy(121), { solid: true, type: 'lamp' });
      this.addDecor(Art.lamp(), vpx(108), vpy(136), { solid: true, type: 'lamp' });
      this.addDecor(Art.lamp(), vpx(136), vpy(132), { solid: true, type: 'lamp' });
      this.addDecor(Art.lamp(), vpx(98), vpy(121), { solid: true, type: 'lamp' });
      this.addDecor(Art.lamp(), vpx(140), vpy(122), { solid: true, type: 'lamp' });
      this.addDecor(Art.barrel(), vpx(99), vpy(128), { solid: true, type: 'barrel' });
      this.addDecor(Art.crate(), vpx(99), vpy(130), { solid: true, type: 'crate' });
      this.addDecor(Art.barrel(), vpx(138), vpy(129), { solid: true, type: 'barrel' });
      this.addDecor(Art.anvil(), vpx(137), vpy(127), { solid: false, type: 'anvil' });
      this.addDecor(Art.dummy(), vpx(131), vpy(130), { solid: true, type: 'dummy' });
      // petit marché autour de la fontaine
      this.addDecor(Art.banner('plains'), vpx(108), vpy(123), { type: 'banner' });
      this.addDecor(Art.banner('plains'), vpx(125), vpy(123), { type: 'banner' });
      this.addDecor(Art.crate(), vpx(111), vpy(130), { solid: true, type: 'crate' });
      this.addDecor(Art.barrel(), vpx(122), vpy(131), { solid: true, type: 'barrel' });
      this.addDecor(Art.bench(), vpx(116), vpy(134), { solid: true, type: 'bench' });
      this.addDecor(Art.lamp(), vpx(116), vpy(115), { solid: true, type: 'lamp' });

      // fleurs et petits décors de village
      const flowerSpots = [[112, 134], [121, 135], [126, 124], [105, 123], [119, 121], [100, 137], [139, 134], [114, 116], [96, 130], [143, 131]];
      flowerSpots.forEach(([tx, ty], i) => {
        this.addDecor(Art.flowerPatch('plains', i % 2), vpx(tx), vpy(ty), { type: 'flower' });
      });
      const bushSpots = [[101, 117], [140, 114], [97, 134], [145, 128], [118, 140], [94, 124], [147, 122]];
      bushSpots.forEach(([tx, ty]) => {
        this.addDecor(Art.bush('plains'), vpx(tx), vpy(ty), { solid: false, type: 'bush' });
      });
    }

    placeOutposts(rng) {
      D.OUTPOSTS.forEach(def => {
        const f = this.findFreeNear(def.x, def.y, Math.round(10 * MS), 2);
        const tx = f.tx, ty = f.ty;
        const cx = tx * TS + 8, cy = ty * TS + 16;

        // On dégage le camp : aucun décor, arbre ou flaque ne doit gêner.
        for (let yy = ty - 5; yy <= ty + 5; yy++) {
          for (let xx = tx - 6; xx <= tx + 6; xx++) {
            if (!inBounds(xx, yy)) continue;
            const k = key(xx, yy);
            this.blocked[k] = 0;
            if (this.special[k] === SPECIAL_WATER || this.special[k] === SPECIAL_LAVA) this.special[k] = SPECIAL_NONE;
          }
        }

        const outpost = {
          id: def.id, name: def.name, biome: def.biome,
          tx, ty, x: cx, y: cy, chestId: def.chest, vendorId: def.vendor
        };
        outpost.img = Art.campGround(def.biome);
        this.outposts.push(outpost);
        const oz = D.ZONE_BY_ID[def.biome];
        if (oz) this.forceBiomeCircle(tx, ty, 8, oz.index);

        // tente au nord du camp
        this.addDecor(Art.tent(def.biome), cx, cy - 22, {
          solid: true, footprint: { w: 3, h: 2, ox: -1, oy: -1 }, type: 'tent'
        });
        // feu de camp au centre
        this.addDecor(Art.campfire(), cx + 12, cy + 4, { solid: false, type: 'campfire' });
        this.emitters.push({ x: cx + 12, y: cy - 12, type: 'ember', rate: 0.85, timer: rng() * 2, color: def.biome === 'tundra' ? '#bfefff' : '#ffb74d' });
        this.emitters.push({ x: cx + 12, y: cy - 18, type: 'smoke', rate: 0.45, timer: rng() * 2 });
        // bannière et caisses
        this.addDecor(Art.banner(def.biome), cx - 40, cy - 14, { type: 'banner' });
        this.addDecor(Art.crate(), cx + 38, cy + 18, { solid: true, type: 'crate' });
        this.addDecor(Art.barrel(), cx - 38, cy + 20, { solid: true, type: 'barrel' });
        this.addDecor(Art.crate(), cx - 30, cy + 8, { solid: true, type: 'crate' });
        this.addDecor(Art.lamp(), cx + 44, cy - 18, { solid: true, type: 'lamp' });

        // pancarte du camp
        this.addInteractable({
          kind: 'sign', id: 'sign_' + def.id, name: def.name,
          x: cx - 48, y: cy + 30, tx: tx - 3, ty: ty + 2, img: Art.signpost(),
          text: [def.name.toUpperCase(), 'Avant-poste sûr · aucun monstre', def.vendor ? 'Un marchand s’y est installé.' : 'Coffre de ravitaillement.']
        });

        // coffre : uniquement dans les avant-postes
        const chest = this.addInteractable({
          kind: 'chest', id: def.chest, name: 'Coffre d’avant-poste',
          x: cx + 48, y: cy + 20, tx: tx + 3, ty: ty + 1, img: Art.chest(false),
          loot: def.loot, biome: def.biome, opened: false, outpostId: def.id,
          hint: 'Ouvrir le coffre'
        });

        // marchand éventuel
        if (def.vendor && D.VENDORS[def.vendor]) {
          const v = D.VENDORS[def.vendor];
          const vx = cx - 50, vy = cy - 4;
          const sheet = Art.npcSheet(v.look);
          this.addInteractable({
            kind: 'npc', id: v.id, name: v.name, role: 'shop', vendorId: v.id,
            look: v.look, x: vx, y: vy, tx: tx - 3, ty: ty,
            img: sheet.frames[0][0], sheet, face: 0,
            hint: v.title
          });
        }

        // dégagement autour du coffre et du marchand
        [[tx + 3, ty + 1], [tx + 2, ty + 1], [tx + 3, ty], [tx - 3, ty], [tx - 3, ty + 1], [tx - 2, ty]]
          .forEach(([px, py]) => {
            if (!inBounds(px, py)) return;
            if (Math.abs(px - tx) > 2 || Math.abs(py - ty) > 2) this.blocked[key(px, py)] = 0;
          });
      });
    }

    generateArenaDecor(rng) {
      this.finalArena.img = Art.finalDecal();
      this.arenas.forEach(a => {
        a.img = Art.arenaDecal(a.biome, a.kind === 'big');
        const centerX = a.x, centerY = a.y;
        const r = a.radiusPx;
        const stones = a.kind === 'big' ? 8 : 5;
        for (let i = 0; i < stones; i++) {
          const ang = -Math.PI / 2 + (i / stones) * Math.PI * 2;
          // ouverture au sud
          if (Math.sin(ang) > 0.7) continue;
          const x = centerX + Math.cos(ang) * (r - 16);
          const y = centerY + Math.sin(ang) * (r - 8);
          const img = Art.arenaStone(a.biome, i % 2);
          this.addDecor(img, x, y, { solid: true, footprint: { w: 1, h: 1, ox: 0, oy: 0 }, type: 'arena-stone' });
        }
        if (a.kind === 'big') {
          for (let i = 0; i < 4; i++) {
            const ang = Math.PI / 4 + i * Math.PI / 2;
            const x = centerX + Math.cos(ang) * (r - 22);
            const y = centerY + Math.sin(ang) * (r - 10);
            this.addDecor(Art.brazier(a.biome), x, y, { solid: true, type: 'brazier' });
            this.emitters.push({ x, y: y - 27, type: 'ember', rate: 0.4, timer: rng() * 2, color: a.biome === 'tundra' ? '#bfefff' : '#ffb74d' });
          }
          this.addDecor(Art.banner(a.biome), centerX - r + 24, centerY - r + 50, { type: 'banner' });
          this.addDecor(Art.banner(a.biome), centerX + r - 24, centerY - r + 50, { type: 'banner' });
        }
      });
      // décor des ruines finales
      const f = this.finalArena;
      const r = f.radiusPx;
      for (let i = 0; i < 6; i++) {
        const ang = -Math.PI / 2 + i / 6 * Math.PI * 2;
        const x = f.x + Math.cos(ang) * (r - 14);
        const y = f.y + Math.sin(ang) * (r - 6);
        if (Math.sin(ang) > 0.7) continue;
        this.addDecor(Art.pillar('plains'), x, y, { solid: true, type: 'pillar' });
      }
      this.addDecor(Art.banner('plains'), f.x - r + 22, f.y - r + 44, { type: 'banner' });
      this.addDecor(Art.banner('plains'), f.x + r - 22, f.y - r + 44, { type: 'banner' });
      for (let i = 0; i < 3; i++) {
        const ang = Math.PI / 4 + i * Math.PI / 2;
        const x = f.x + Math.cos(ang) * (r - 20), y = f.y + Math.sin(ang) * (r - 14);
        this.addDecor(Art.brazier('plains'), x, y, { solid: true, type: 'brazier' });
        this.emitters.push({ x, y: y - 27, type: 'spirit', rate: 0.5, timer: rng() * 2, color: '#c891ff' });
      }
    }

    scatterDecor(rng) {
      // Petites décorations : chaque biome a sa palette de fleurs et de sous-bois.
      const start = 5, end = W - 5;
      for (let ty = start; ty < end; ty++) {
        for (let tx = start; tx < end; tx++) {
          const k = key(tx, ty);
          if (this.path[k] || this.blocked[k] || this.special[k] !== SPECIAL_NONE) continue;
          if (this.isNearProtected(tx, ty, 0)) continue;
          const bi = this.biome[k];
          const meadow = U.fbm(tx * 0.045, ty * 0.045, this.seed + 909, 2);
          const flowering = meadow > 0.6;
          const chance = 0.045 + (flowering ? 0.05 : 0);
          if (rng() >= chance) continue;
          let img = null, type = 'detail';
          if (bi === 0) {
            if (flowering && rng() < 0.7) { img = Art.flowerPatch('plains', Math.floor(rng() * 4)); type = 'flower'; }
            else if (rng() < 0.38) { img = Art.tallGrass('plains', Math.floor(rng() * 3)); type = 'grass'; }
            else if (rng() < 0.62) { img = Art.flowerPatch('plains', Math.floor(rng() * 4)); type = 'flower'; }
            else if (rng() < 0.9) img = Art.grassTuft('plains');
            else img = Art.pebbles('plains', Math.floor(rng() * 2));
          } else if (bi === 1) {
            if (rng() < 0.28) { img = Art.flowerPatch('forest', Math.floor(rng() * 4)); type = 'flower'; }
            else if (rng() < 0.46) img = Art.fern('forest');
            else if (rng() < 0.64) { img = Art.tallGrass('forest', Math.floor(rng() * 3)); type = 'grass'; }
            else if (rng() < 0.78) img = Art.mushroomDeco(0);
            else if (rng() < 0.9) { img = Art.glowMushrooms('forest', Math.floor(rng() * 2)); type = 'glowmush'; }
            else img = Art.pebbles('forest', 0);
          } else if (bi === 2) {
            if (rng() < 0.3) img = Art.dryShrub('desert', Math.floor(rng() * 2));
            else if (rng() < 0.54) img = Art.pebbles('desert', Math.floor(rng() * 2));
            else if (rng() < 0.74) { img = Art.flowerPatch('desert', Math.floor(rng() * 3)); type = 'flower'; }
            else if (rng() < 0.9) img = Art.grassTuft('desert');
            else img = Art.bones();
          } else if (bi === 3) {
            if (rng() < 0.32) img = Art.reeds(0);
            else if (rng() < 0.52) img = Art.fern('swamp');
            else if (rng() < 0.72) { img = Art.glowMushrooms('swamp', Math.floor(rng() * 2)); type = 'glowmush'; }
            else if (rng() < 0.88) { img = Art.tallGrass('swamp', Math.floor(rng() * 2)); type = 'grass'; }
            else img = Art.pebbles('swamp', 0);
          } else if (bi === 4) {
            if (rng() < 0.32) img = Art.snowdrift();
            else if (rng() < 0.54) img = Art.bush('snow');
            else if (rng() < 0.76) { img = Art.tallGrass('tundra', Math.floor(rng() * 3)); type = 'grass'; }
            else if (rng() < 0.92) { img = Art.flowerPatch('tundra', Math.floor(rng() * 3)); type = 'flower'; }
            else img = Art.pebbles('tundra', 0);
          } else {
            if (rng() < 0.28) img = Art.dryShrub('volcano', Math.floor(rng() * 2));
            else if (rng() < 0.5) img = Art.vent();
            else if (rng() < 0.7) img = Art.pebbles('volcano', Math.floor(rng() * 2));
            else if (rng() < 0.86) img = Art.grassTuft('volcano');
            else { img = Art.flowerPatch('volcano', Math.floor(rng() * 3)); type = 'flower'; }
          }
          if (img) {
            const x = tx * TS + 8 + Math.floor(rng() * 7 - 3);
            const y = ty * TS + 14;
            this.addDecor(img, x, y, { type });
            if (type === 'glowmush') {
              this.emitters.push({ x, y: y - 10, type: 'sparkle', rate: 0.12, timer: rng() * 4, color: bi === 1 ? '#c7b8ff' : '#9fe0c0' });
            }
          }
        }
      }

      // Objets solides : arbres, rochers, cactus, cristaux, rondins...
      for (let ty = 5; ty < H - 5; ty++) {
        for (let tx = 5; tx < W - 5; tx++) {
          const k = key(tx, ty);
          if (this.path[k] || this.blocked[k] || this.special[k] !== SPECIAL_NONE) continue;
          if (this.isNearProtected(tx, ty, 1)) continue;
          const bi = this.biome[k];
          // densité par biome + clusters
          const cluster = U.fbm(tx * 0.08, ty * 0.08, this.seed + bi * 31, 2);
          const roll = rng();
          let img = null, solid = true, fp = { w: 1, h: 1, ox: 0, oy: 0 }, type = 'prop';
          if (bi === 0) {
            if (roll < 0.018 + cluster * 0.022) {
              img = rng() < 0.18 ? Art.tree('birch', rng() < 0.5 ? 0 : 1) : Art.tree('plains', rng() < 0.5 ? 0 : 1);
              type = 'tree';
            } else if (roll < 0.031) { img = Art.bush('plains'); solid = false; type = 'bush'; }
            else if (roll < 0.038) { img = Art.berryBush('plains', Math.floor(rng() * 2)); solid = false; type = 'bush'; }
            else if (roll < 0.045) { img = Art.rock('plains', rng() < 0.5 ? 0 : 1); type = 'rock'; }
            else if (roll < 0.047) { img = Art.fallenLog('plains', Math.floor(rng() * 2)); type = 'log'; }
          } else if (bi === 1) {
            if (roll < 0.055 + cluster * 0.035) {
              const r = rng();
              img = r < 0.22 ? Art.tree('birch', rng() < 0.5 ? 0 : 1) : r < 0.68 ? Art.tree('forest', rng() < 0.5 ? 0 : 1) : Art.tree('pine', 0);
              type = 'tree';
            } else if (roll < 0.071) { img = Art.bush('forest'); solid = false; type = 'bush'; }
            else if (roll < 0.081) { img = Art.berryBush('forest', Math.floor(rng() * 2)); solid = false; type = 'bush'; }
            else if (roll < 0.089) { img = Art.stump('forest'); type = 'stump'; }
            else if (roll < 0.096) { img = Art.rock('forest', 0); type = 'rock'; }
            else if (roll < 0.1) { img = Art.fallenLog('forest', Math.floor(rng() * 2)); type = 'log'; }
          } else if (bi === 2) {
            if (roll < 0.02 + cluster * 0.025) { img = Art.cactus(Math.floor(rng() * 3)); type = 'cactus'; }
            else if (roll < 0.042) { img = Art.rock('desert', rng() < 0.5 ? 0 : 1); type = 'rock'; }
            else if (roll < 0.048) { img = Art.bones(); solid = false; type = 'bones'; }
          } else if (bi === 3) {
            if (roll < 0.03 + cluster * 0.03) { img = Art.tree('dead', 0); type = 'dead-tree'; }
            else if (roll < 0.052) { img = Art.reeds(1); solid = false; type = 'reeds'; }
            else if (roll < 0.061) { img = Art.stump('swamp'); type = 'stump'; }
            else if (roll < 0.07) { img = Art.rock('swamp', 0); type = 'rock'; }
            else if (roll < 0.074) { img = Art.fallenLog('swamp', Math.floor(rng() * 2)); type = 'log'; }
          } else if (bi === 4) {
            if (roll < 0.045 + cluster * 0.04) { img = Art.tree('pine_snow', rng() < 0.5 ? 0 : 1); type = 'tree'; }
            else if (roll < 0.055) { img = Art.bush('snow'); solid = false; type = 'bush'; }
            else if (roll < 0.066) { img = Art.iceCrystal(rng() < 0.5 ? 0 : 1); type = 'crystal'; }
            else if (roll < 0.077) { img = Art.rock('tundra', rng() < 0.5 ? 0 : 1); type = 'rock'; }
            else if (roll < 0.085) { img = Art.stump('snow'); type = 'stump'; }
            else if (roll < 0.087) { img = Art.berryBush('tundra', 0); solid = false; type = 'bush'; }
          } else {
            if (roll < 0.03 + cluster * 0.025) { img = Art.obsidian(rng() < 0.5 ? 0 : 1); type = 'obsidian'; }
            else if (roll < 0.053) { img = Art.lavaRock(rng() < 0.5 ? 0 : 1); type = 'lava-rock'; }
            else if (roll < 0.066) { img = Art.rock('volcano', 0); type = 'rock'; }
            else if (roll < 0.071) { img = Art.tree('dead', 1); type = 'dead-tree'; }
            else if (roll < 0.074) { img = Art.fallenLog('volcano', Math.floor(rng() * 2)); type = 'log'; }
            else if (roll < 0.078) { img = Art.dryShrub('volcano', Math.floor(rng() * 2)); solid = false; type = 'bush'; }
          }
          if (img) {
            const jx = tx * TS + 8 + Math.floor(rng() * 8 - 4);
            const jy = ty * TS + 15 + Math.floor(rng() * 3);
            this.addDecor(img, jx, jy, { solid, footprint: fp, type });
            if (type === 'tree' || type === 'crystal' || type === 'obsidian') {
              this.emitters.push({ x: jx, y: jy - img.height * 0.6, type: 'leaf', rate: 0.05, timer: rng() * 5, biome: this.biome[k] });
            }
          }
        }
      }

      // Rives : nénuphars sur l'eau et roseaux sur la terre ferme voisine.
      const isLand = v => v !== SPECIAL_WATER && v !== SPECIAL_LAVA;
      const zoneKeys = ['plains', 'forest', 'desert', 'swamp', 'tundra', 'volcano'];
      for (let ty = 6; ty < H - 6; ty++) {
        for (let tx = 6; tx < W - 6; tx++) {
          const k = key(tx, ty);
          if (this.special[k] !== SPECIAL_WATER) continue;
          const n = [];
          [[tx, ty - 1], [tx + 1, ty], [tx, ty + 1], [tx - 1, ty]].forEach(([x, y]) => {
            if (inBounds(x, y) && isLand(this.special[key(x, y)])) n.push([x, y]);
          });
          if (!n.length) continue;
          const bi = this.biome[k];
          const roll = rng();
          if (bi !== 5 && roll < 0.075) {
            const img = Art.lilyPads(zoneKeys[bi], Math.floor(rng() * 3));
            this.addDecor(img, tx * TS + 8 + Math.floor(rng() * 7 - 3), ty * TS + 12, { type: 'lily' });
          }
          if (roll > 0.945) {
            const [nx, ny] = n[Math.floor(rng() * n.length)];
            const nk = key(nx, ny);
            if (!this.blocked[nk] && this.special[nk] === SPECIAL_NONE && !this.path[nk]) {
              this.addDecor(Art.reeds(2), nx * TS + 8 + Math.floor(rng() * 5 - 2), ny * TS + 15, { type: 'reeds' });
            }
          }
        }
      }
    }

    findFreeNear(tx, ty, maxR, requireSpace) {
      requireSpace = requireSpace === undefined ? 1 : requireSpace;
      for (let r = 0; r <= maxR; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x = tx + dx, y = ty + dy;
            if (!inBounds(x, y)) continue;
            if (this.special[key(x, y)] === SPECIAL_WATER || this.special[key(x, y)] === SPECIAL_LAVA) continue;
            if (this.isAreaFree(x, y, requireSpace)) return { tx: x, ty: y };
          }
        }
      }
      // fallback
      for (let y = 6; y < H - 6; y++) {
        for (let x = 6; x < W - 6; x++) {
          if (this.isAreaFree(x, y, requireSpace)) return { tx: x, ty: y };
        }
      }
      return { tx, ty };
    }

    addInteractable(obj) {
      this.interactables.push(obj);
      if (obj.kind === 'npc') this.npcs.push(obj);
      if (obj.kind === 'chest') this.chests.push(obj);
      if (obj.kind === 'shrine') this.shrines.push(obj);
      if (obj.kind === 'sign') this.signs.push(obj);
      return obj;
    }

    placeInteractables(rng) {
      // NPC du village
      D.NPCS.forEach(def => {
        let tx = def.x, ty = def.y;
        if (this.blocked[key(tx, ty)]) {
          const f = this.findFreeNear(tx, ty, 8, 0);
          tx = f.tx; ty = f.ty;
        }
        const sheet = Art.npcSheet(def.look);
        this.addInteractable({
          kind: 'npc', id: def.id, name: def.name, role: def.role, look: def.look,
          x: tx * TS + 8, y: ty * TS + 15, tx, ty, img: sheet.frames[0][0],
          sheet, face: 0, hint: def.hint
        });
        // espace de dégagement
        for (let yy = ty - 2; yy <= ty + 2; yy++) for (let xx = tx - 2; xx <= tx + 2; xx++) {
          if (inBounds(xx, yy)) this.blocked[key(xx, yy)] = 0;
        }
      });
      // sanctuaires / bivouacs
      D.SHRINES.forEach(def => {
        let f = this.findFreeNear(def.x, def.y, 10, 1);
        const img = Art.shrine(def.id === 'shrine_village' ? 'village' : 'camp');
        const obj = this.addInteractable({
          kind: 'shrine', id: def.id, name: def.name, x: f.tx * TS + 8, y: f.ty * TS + 15, tx: f.tx, ty: f.ty,
          img, hint: 'Se reposer et sauvegarder'
        });
        this.emitters.push({ x: obj.x, y: obj.y - (def.id === 'shrine_village' ? 32 : 18), type: 'shrine', rate: 0.35, timer: rng() * 2 });
      });
      // Les coffres sont créés dans placeOutposts : aucun coffre en pleine nature.
      // panneaux
      [...D.VILLAGE_SIGNS, ...D.ZONE_SIGNS].forEach(def => {
        let f = this.findFreeNear(def.x, def.y, 10, 0);
        this.addInteractable({
          kind: 'sign', id: def.id, name: 'Panneau', text: def.text,
          x: f.tx * TS + 8, y: f.ty * TS + 15, tx: f.tx, ty: f.ty, img: Art.signpost(),
          hint: 'Lire le panneau'
        });
      });
      // monolithe final
      const f = { tx: D.FINAL_ARENA.x, ty: D.FINAL_ARENA.y };
      const mImg = Art.monolith();
      this.monolith = this.addInteractable({
        kind: 'monolith', id: 'monolith', name: 'Monolithe de Nyx',
        x: f.tx * TS + 8, y: f.ty * TS + 16, tx: f.tx, ty: f.ty, img: mImg,
        hint: 'Examiner le monolithe'
      });
      for (let yy = f.ty - 3; yy <= f.ty + 3; yy++) for (let xx = f.tx - 3; xx <= f.tx + 3; xx++) {
        if (inBounds(xx, yy)) this.blocked[key(xx, yy)] = 1;
      }
      // petit autel de lisière de village / panneau d'accueil
      this.emitters.push({ x: D.VILLAGE.x * TS + 8, y: D.VILLAGE.y * TS - 20, type: 'pollen', rate: 0.6, timer: 0 });
      // fumée des cheminées supplémentaires
    }

    generateSpawns(rng) {
      const speciesByZone = {};
      D.ZONES.forEach(z => { speciesByZone[z.id] = z.species; });
      // La carte a quadruplé de surface : on garde une densité plus sauvage,
      // volontairement inférieure à l'ancienne, pour laisser respirer l'exploration.
      const total = Math.round(62 * MS * MS / 2);
      D.ZONES.forEach((z, zi) => {
        let attempts = 0;
        let made = 0;
        while (made < total && attempts < total * 40) {
          attempts++;
          const tx = 6 + Math.floor(rng() * (W - 12));
          const ty = 6 + Math.floor(rng() * (H - 12));
          const k = key(tx, ty);
          if (this.biome[k] !== zi) continue;
          if (this.blocked[k] || this.special[k] !== SPECIAL_NONE) continue;
          if (this.path[k]) continue;
          if (this.isNearProtected(tx, ty, 2)) continue;
          // éviter les spawns collés
          if (this.spawnPoints.some(s => U.dist2(s.tx, s.ty, tx, ty) < 20)) continue;
          const speciesId = z.species[Math.floor(rng() * z.species.length)];
          const sp = D.SPECIES[speciesId];
          if (!sp) continue;
          const level = U.clamp(U.randInt(rng, sp.levelMin, sp.levelMax), z.levelMin, 99);
          const elite = rng() < 0.09;
          this.spawnPoints.push({
            id: 'spawn_' + zi + '_' + made,
            x: tx * TS + 8, y: ty * TS + 14, tx, ty,
            zoneId: z.id, zoneIndex: zi, speciesId, level: level + (elite ? 2 : 0), elite
          });
          made++;
        }
      });
    }

    finalize() {
      // La collision des bâtiments repose désormais sur des rectangles en
      // pixels : on retire leurs tuiles du masque général pour ne plus avoir
      // de murs invisibles décalés d'une demi-tuile.
      for (let i = 0; i < this.buildingTiles.length; i++) {
        if (this.buildingTiles[i]) this.blocked[i] = 0;
      }
      // Libre autour du point d'apparition du joueur, juste au sud de la fontaine
      const spawnTile = { x: D.VILLAGE.x, y: D.VILLAGE.y + 5 };
      for (let yy = spawnTile.y - 2; yy <= spawnTile.y + 2; yy++) for (let xx = spawnTile.x - 2; xx <= spawnTile.x + 2; xx++) {
        if (inBounds(xx, yy)) { this.blocked[key(xx, yy)] = 0; this.special[key(xx, yy)] = SPECIAL_NONE; }
      }
      this.playerSpawn = { x: spawnTile.x * TS + 8, y: spawnTile.y * TS + 14 };
      // aire de circulation minimale devant les bâtiments / PNJ
      this.npcs.forEach(n => {
        for (let yy = n.ty - 1; yy <= n.ty + 3; yy++) for (let xx = n.tx - 2; xx <= n.tx + 2; xx++) {
          if (inBounds(xx, yy)) this.blocked[key(xx, yy)] = 0;
        }
      });
      // tri des décors pour accès rapide
      this.decor.sort((a, b) => a.y - b.y);
      // index des chunks
      this.decorGrid.clear();
      this.decor.forEach(o => this.addToGrid(o));
      // pas de collision sur les tuiles de lisière de place
      for (let a = 0; a < 36; a++) {
        const ang = a / 36 * Math.PI * 2;
        const tx = Math.round(D.VILLAGE.x + Math.cos(ang) * 13 * MS);
        const ty = Math.round(D.VILLAGE.y + Math.sin(ang) * 13 * MS);
        if (inBounds(tx, ty)) this.blocked[key(tx, ty)] = 0;
      }
    }

    /* ----------------------------------------------------------
       Collision et interrogation
       ---------------------------------------------------------- */
    isBlockedTile(tx, ty) {
      if (!inBounds(tx, ty)) return true;
      return !!this.blocked[key(tx, ty)];
    }

    isBlockedPx(x, y) {
      if (this.isBlockedTile(Math.floor(x / TS), Math.floor(y / TS))) return true;
      const bw = 4;
      return this.overlapsBuilding(x - bw, y - bw * 1.5, x + bw, y + 1);
    }

    overlapsBuilding(x1, y1, x2, y2) {
      for (const r of this.buildingRects) {
        if (x2 > r.x1 && x1 < r.x2 && y2 > r.y1 && y1 < r.y2) return true;
      }
      return false;
    }

    canStandAt(x, y, footW, footH) {
      footW = footW || 10; footH = footH || 8;
      const fw = footW / 2;
      if (this.overlapsBuilding(x - fw, y - footH, x + fw, y)) return false;
      const x1 = Math.floor((x - fw) / TS), x2 = Math.floor((x + fw - 0.01) / TS);
      const y1 = Math.floor((y - footH) / TS), y2 = Math.floor((y - 0.01) / TS);
      for (let ty = y1; ty <= y2; ty++) {
        for (let tx = x1; tx <= x2; tx++) {
          if (this.isBlockedTile(tx, ty)) return false;
        }
      }
      return true;
    }

    moveEntity(e, dx, dy, footW, footH) {
      footW = footW || 10; footH = footH || 8;
      let moved = false;
      if (dx) {
        const nx = e.x + dx;
        if (this.canStandAt(nx, e.y, footW, footH)) { e.x = nx; moved = true; }
        else {
          // Glissement le long des murs : on tente les deux côtés, du plus
          // petit écart au plus grand, pour contourner piliers et façades.
          const dirs = dx > 0 ? [1, -1] : [-1, 1];
          outerX:
          for (const off of [2, 4, 6]) {
            for (const d of dirs) {
              if (this.canStandAt(nx, e.y + d * off, footW, footH)) {
                e.x = nx;
                e.y += d * off * 0.45;
                moved = true;
                break outerX;
              }
            }
          }
        }
      }
      if (dy) {
        const ny = e.y + dy;
        if (this.canStandAt(e.x, ny, footW, footH)) { e.y = ny; moved = true; }
        else {
          const dirs = dy > 0 ? [1, -1] : [-1, 1];
          outerY:
          for (const off of [2, 4, 6]) {
            for (const d of dirs) {
              if (this.canStandAt(e.x + d * off, ny, footW, footH)) {
                e.y = ny;
                e.x += d * off * 0.45;
                moved = true;
                break outerY;
              }
            }
          }
        }
      }
      return moved;
    }

    getVisibleDecor(camX, camY, vw, vh) {
      const res = [];
      const gx1 = Math.floor((camX - 96) / 128), gx2 = Math.floor((camX + vw + 96) / 128);
      const gy1 = Math.floor((camY - 160) / 128), gy2 = Math.floor((camY + vh + 96) / 128);
      for (let gy = gy1; gy <= gy2; gy++) {
        for (let gx = gx1; gx <= gx2; gx++) {
          const cell = this.decorGrid.get(gx + ',' + gy);
          if (!cell) continue;
          for (const o of cell) {
            if (o.x + 96 < camX || o.x - 96 > camX + vw || o.y + 32 < camY || o.y - 120 > camY + vh) continue;
            res.push(o);
          }
        }
      }
      return res;
    }

    getVisibleInteractables(camX, camY, vw, vh) {
      return this.interactables.filter(o => o.x + 64 > camX && o.x - 64 < camX + vw && o.y + 64 > camY && o.y - 120 < camY + vh);
    }

    getDecorChunkCells() { return this.decorGrid; }

    /* ----------------------------------------------------------
       Rendu du sol et des calques
       ---------------------------------------------------------- */
    pathMask(tx, ty) {
      let m = 0;
      if (this.isPath(tx, ty - 1)) m |= 1;
      if (this.isPath(tx + 1, ty)) m |= 2;
      if (this.isPath(tx, ty + 1)) m |= 4;
      if (this.isPath(tx - 1, ty)) m |= 8;
      return m;
    }
    isPath(tx, ty) {
      if (!inBounds(tx, ty)) return false;
      const k = key(tx, ty);
      return !!this.path[k] || this.special[k] === SPECIAL_BRIDGE;
    }

    specialMask(tx, ty, type) {
      let m = 0;
      if (this.special[key(Math.max(0, tx), Math.max(0, ty - 1))] === type) m |= 1;
      if (this.special[key(Math.min(W - 1, tx + 1), Math.max(0, ty))] === type) m |= 2;
      if (this.special[key(Math.max(0, tx), Math.min(H - 1, ty + 1))] === type) m |= 4;
      if (this.special[key(Math.max(0, tx - 1), Math.max(0, ty))] === type) m |= 8;
      return m;
    }

    drawGround(ctx, camX, camY, vw, vh, time) {
      const tx1 = Math.max(0, Math.floor(camX / TS) - 1);
      const ty1 = Math.max(0, Math.floor(camY / TS) - 1);
      const tx2 = Math.min(W - 1, Math.ceil((camX + vw) / TS) + 1);
      const ty2 = Math.min(H - 1, Math.ceil((camY + vh) / TS) + 1);
      const wf = Math.floor(time * 2.6) % 3;
      for (let ty = ty1; ty <= ty2; ty++) {
        for (let tx = tx1; tx <= tx2; tx++) {
          const x = tx * TS - camX, y = ty * TS - camY;
          const k = key(tx, ty);
          const bi = D.ZONES[this.biome[k]].id;
          const sp = this.special[k];
          if (sp === SPECIAL_WATER) {
            const mask = this.specialMask(tx, ty, SPECIAL_WATER);
            ctx.drawImage(Art.waterTile(bi, mask, wf), Math.round(x), Math.round(y));
          } else if (sp === SPECIAL_LAVA) {
            const mask = this.specialMask(tx, ty, SPECIAL_LAVA);
            ctx.drawImage(Art.lavaTile(mask, wf), Math.round(x), Math.round(y));
          } else if (sp === SPECIAL_BRIDGE) {
            const mask = this.pathMask(tx, ty);
            const vertical = (mask & 1) || (mask & 4);
            ctx.drawImage(Art.bridgeTile(mask, !!vertical), Math.round(x), Math.round(y));
          } else {
            ctx.drawImage(Art.groundTile(bi, this.variant[k]), Math.round(x), Math.round(y));
            // lisières organiques : un dégradé de pixels du biome voisin
            if (!this.path[k]) {
              const selfBi = this.biome[k];
              const edge = (nx, ny, dir) => {
                if (!inBounds(nx, ny)) return;
                const nk = key(nx, ny);
                const nsp = this.special[nk];
                if (nsp === SPECIAL_BRIDGE) return;
                let to = null;
                if (nsp === SPECIAL_WATER) to = 'water';
                else if (nsp === SPECIAL_LAVA) to = 'lava';
                else if (this.biome[nk] !== selfBi) to = D.ZONES[this.biome[nk]].id;
                if (to) ctx.drawImage(Art.edgeTile(bi, to, dir), Math.round(x), Math.round(y));
              };
              edge(tx, ty - 1, 0);
              edge(tx + 1, ty, 1);
              edge(tx, ty + 1, 2);
              edge(tx - 1, ty, 3);
            }
            if (this.path[k]) {
              ctx.drawImage(Art.pathTile(bi, this.pathMask(tx, ty)), Math.round(x), Math.round(y));
            }
          }
        }
      }
      // Reflets mobiles à la surface de l'eau et de la lave.
      const shimmer = Math.floor(time * 14);
      for (let ty = ty1; ty <= ty2; ty++) {
        for (let tx = tx1; tx <= tx2; tx++) {
          const k = key(tx, ty);
          const sp = this.special[k];
          if (sp !== SPECIAL_WATER && sp !== SPECIAL_LAVA) continue;
          const ph = U.hash2(tx, ty, this.seed + 41) * Math.PI * 2;
          const pulse = Math.sin(time * 2.2 + ph);
          if (pulse >= 0.15) {
            const ox = 2 + Math.floor(U.hash2(tx, ty, 91) * 12);
            const oy = 2 + Math.floor(U.hash2(tx, ty, 157) * 12);
            ctx.fillStyle = sp === SPECIAL_WATER
              ? 'rgba(220,248,255,' + (0.12 + pulse * 0.3) + ')'
              : 'rgba(255,214,126,' + (0.12 + pulse * 0.34) + ')';
            ctx.fillRect(Math.round(tx * TS - camX + ox), Math.round(ty * TS - camY + oy), sp === SPECIAL_WATER ? 3 : 2, 1);
            if (shimmer % 2 === 0 && U.hash2(tx, ty, this.seed + shimmer) > 0.55) {
              ctx.fillRect(Math.round(tx * TS - camX + 15 - ox), Math.round(ty * TS - camY + 15 - oy), 1, 1);
            }
          }
          // Écume qui lèche les rives : de petites crêtes glissent contre la terre.
          if (sp === SPECIAL_WATER) {
            const surf = Math.sin(time * 2.1 + tx * 0.8 + ty * 1.3);
            if (surf > -0.45) {
              const a = (0.08 + (surf * 0.5 + 0.5) * 0.17).toFixed(3);
              ctx.fillStyle = 'rgba(228,250,255,' + a + ')';
              const bx = Math.round(tx * TS - camX), by = Math.round(ty * TS - camY);
              const slide = Math.floor((0.5 + 0.5 * Math.sin(time * 1.7 + ph)) * 9);
              const nTop = ty > 0 ? this.special[key(tx, ty - 1)] : -1;
              const nRight = tx < W - 1 ? this.special[key(tx + 1, ty)] : -1;
              const nBottom = ty < H - 1 ? this.special[key(tx, ty + 1)] : -1;
              const nLeft = tx > 0 ? this.special[key(tx - 1, ty)] : -1;
              const land = (v) => v !== SPECIAL_WATER && v !== SPECIAL_LAVA;
              if (land(nTop)) ctx.fillRect(bx + 2 + slide, by + 2, 3, 1);
              if (land(nBottom)) ctx.fillRect(bx + 11 - slide, by + 13, 3, 1);
              if (land(nLeft)) ctx.fillRect(bx + 2, by + 11 - slide, 1, 3);
              if (land(nRight)) ctx.fillRect(bx + 13, by + 2 + slide, 1, 3);
            }
          }
        }
      }
      // décalques de sol : ces images sont des disques centrés sur leur point
      // d'ancrage, pas des props ancrés par le bas.
      const decals = [];
      if (this.village.img) decals.push({ img: this.village.img, x: this.village.x, y: this.village.y, oy: 0 });
      this.outposts.forEach(o => { if (o.img) decals.push({ img: o.img, x: o.x + 4, y: o.y + 2, oy: 0 }); });
      this.arenas.forEach(a => decals.push({ img: a.img, x: a.x, y: a.y, oy: 0 }));
      decals.push({ img: this.finalArena.img, x: this.finalArena.x, y: this.finalArena.y, oy: 0 });
      for (const d of decals) {
        if (!d.img) continue;
        const hw = d.img.width / 2, hh = d.img.height / 2;
        if (d.x + hw < camX || d.x - hw > camX + vw || d.y + hh < camY || d.y - hh > camY + vh) continue;
        ctx.drawImage(
          d.img,
          Math.round(d.x - hw - camX),
          Math.round(d.y - hh + (d.oy || 0) - camY)
        );
      }
    }

    /* ----------------------------------------------------------
       Carte détaillée : relief, côtes, forêts et lieux
       ---------------------------------------------------------- */
    buildMapTexture() {
      if (this.mapTexture) return this.mapTexture;
      const S = W;
      const canvas = Art.cvs(S, S);
      const ctx = canvas.getContext('2d');
      const image = ctx.createImageData(S, S);
      const px = image.data;
      const heights = new Float32Array(S * S);
      const depth = new Int16Array(S * S);

      const pal = {};
      D.ZONES.forEach(z => {
        const p = MAP_PAL[z.id];
        pal[z.index] = {
          base: U.hexRgb(p.base), light: U.hexRgb(p.light), dark: U.hexRgb(p.dark),
          deep: U.hexRgb(p.deep), road: U.hexRgb(p.road), roadDark: U.hexRgb(p.roadDark),
          coast: U.hexRgb(p.coast)
        };
      });
      const mix = (a, b, t) => [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t
      ];
      const waterPal = {
        shallow: U.hexRgb(MAP_WATER.shallow), mid: U.hexRgb(MAP_WATER.mid),
        deep: U.hexRgb(MAP_WATER.deep), foam: U.hexRgb(MAP_WATER.foam)
      };
      const lavaPal = {
        shallow: U.hexRgb(MAP_WATER.lavaShallow), mid: U.hexRgb(MAP_WATER.lavaMid),
        deep: U.hexRgb(MAP_WATER.lavaDeep), foam: U.hexRgb(MAP_WATER.lavaFoam)
      };
      const isWater = (k) => this.special[k] === SPECIAL_WATER || this.special[k] === SPECIAL_LAVA;

      // Relief doux : deux échelles de bruit suffisent à lire les vallées.
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const k = y * S + x;
          const broad = U.fbm(x * 0.014, y * 0.014, this.seed + 311, 2);
          const fine = U.fbm(x * 0.058, y * 0.058, this.seed + 1201, 2);
          heights[k] = broad * 0.7 + fine * 0.3;
        }
      }

      // Profondeur des eaux, par propagation depuis les rives.
      const queue = [];
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const k = y * S + x;
          if (!isWater(k)) continue;
          let shore = false;
          if (x > 0 && !isWater(k - 1)) shore = true;
          else if (x < S - 1 && !isWater(k + 1)) shore = true;
          else if (y > 0 && !isWater(k - S)) shore = true;
          else if (y < S - 1 && !isWater(k + S)) shore = true;
          if (shore) { depth[k] = 1; queue.push(k); }
        }
      }
      for (let qi = 0; qi < queue.length; qi++) {
        const k = queue[qi];
        const d = depth[k];
        if (d >= 8) continue;
        const x = k % S, y = (k / S) | 0;
        const add = (nk) => {
          if (isWater(nk) && depth[nk] === 0) { depth[nk] = d + 1; queue.push(nk); }
        };
        if (x > 0) add(k - 1);
        if (x < S - 1) add(k + 1);
        if (y > 0) add(k - S);
        if (y < S - 1) add(k + S);
      }

      // Couleurs de base : terres, routes et eaux.
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const k = y * S + x;
          const i = k * 4;
          const sp = this.special[k];
          const p = pal[this.biome[k]] || pal[0];
          let c;
          if (sp === SPECIAL_WATER || sp === SPECIAL_LAVA) {
            const wp = sp === SPECIAL_LAVA ? lavaPal : waterPal;
            const d = U.clamp(depth[k] || 8, 1, 8);
            const t = (d - 1) / 7;
            c = mix(wp.shallow, wp.mid, U.clamp(t * 2, 0, 1));
            c = mix(c, wp.deep, U.clamp((t - 0.5) * 2, 0, 1));
            if (d === 1) c = mix(c, wp.foam, 0.5);
            else if (U.hash2(x, y, this.seed + 9) > 0.9) c = mix(c, wp.foam, 0.32);
          } else if (this.path[k]) {
            const road = mix(p.road, p.roadDark, U.hash2(x, y, this.seed + 17) * 0.4);
            let border = false;
            if (x > 0 && !this.path[k - 1] && !isWater(k - 1)) border = true;
            else if (x < S - 1 && !this.path[k + 1] && !isWater(k + 1)) border = true;
            else if (y > 0 && !this.path[k - S] && !isWater(k - S)) border = true;
            else if (y < S - 1 && !this.path[k + S] && !isWater(k + S)) border = true;
            c = border ? mix(road, p.roadDark, 0.55) : road;
            if (sp === SPECIAL_BRIDGE) c = mix(c, U.hexRgb('#9a7448'), 0.7);
          } else {
            const t = U.clamp((heights[k] - 0.3) * 1.8, 0, 1);
            c = mix(p.dark, p.base, U.clamp(t * 2, 0, 1));
            c = mix(c, p.light, U.clamp((t - 0.5) * 1.7, 0, 1));
            const grain = U.hash2(x, y, this.seed + 35);
            if (grain > 0.94) c = mix(c, p.light, 0.34);
            else if (grain < 0.06) c = mix(c, p.dark, 0.26);
            // Courbes de niveau : de fins anneaux plus sombres lisent le relief.
            const band = Math.floor(heights[k] * 12);
            if ((x > 0 && Math.floor(heights[k - 1] * 12) !== band) ||
                (x < S - 1 && Math.floor(heights[k + 1] * 12) !== band) ||
                (y > 0 && Math.floor(heights[k - S] * 12) !== band) ||
                (y < S - 1 && Math.floor(heights[k + S] * 12) !== band)) {
              c = mix(c, p.deep, 0.2);
            }
            let coast = false;
            if (x > 0 && isWater(k - 1)) coast = true;
            else if (x < S - 1 && isWater(k + 1)) coast = true;
            else if (y > 0 && isWater(k - S)) coast = true;
            else if (y < S - 1 && isWater(k + S)) coast = true;
            if (coast) c = mix(c, p.coast, 0.46);
          }
          px[i] = U.clamp(c[0], 0, 255);
          px[i + 1] = U.clamp(c[1], 0, 255);
          px[i + 2] = U.clamp(c[2], 0, 255);
          px[i + 3] = 255;
        }
      }

      // Ombres portées du relief, orientées nord-ouest.
      for (let y = 1; y < S - 1; y++) {
        for (let x = 1; x < S - 1; x++) {
          const k = y * S + x;
          if (isWater(k) || this.path[k]) continue;
          const slope = (heights[k - 1] - heights[k + 1]) + (heights[k - S] - heights[k + S]);
          const shade = U.clamp(slope * 620, -16, 17);
          if (Math.abs(shade) < 0.4) continue;
          const i = k * 4;
          px[i] = U.clamp(px[i] + shade * 1.15, 0, 255);
          px[i + 1] = U.clamp(px[i + 1] + shade, 0, 255);
          px[i + 2] = U.clamp(px[i + 2] + shade * 0.86, 0, 255);
        }
      }
      ctx.putImageData(image, 0, 0);

      // Canopées et rochers : quelques pixels suffisent à donner du grain.
      const treeCol = {
        plains: '#3a6937', forest: '#285233', desert: '#47713b', swamp: '#345039',
        tundra: '#3d6353', volcano: '#342b2b'
      };
      for (const d of this.decor) {
        const mx = d.x / TS, my = d.y / TS;
        const cx = Math.round(mx), cy = Math.round(my);
        if (d.type === 'tree') {
          const tx = U.clamp(Math.floor(mx), 0, S - 1), ty = U.clamp(Math.floor(my), 0, S - 1);
          const zone = D.ZONES[this.biome[ty * S + tx]];
          ctx.fillStyle = treeCol[zone.id] || treeCol.forest;
          ctx.fillRect(cx - 1, cy - 2, 2, 3);
          ctx.fillRect(cx, cy - 3, 1, 1);
          ctx.fillStyle = U.shade(treeCol[zone.id] || treeCol.forest, 24);
          ctx.fillRect(cx, cy - 2, 1, 1);
        } else if (d.type === 'bush') {
          ctx.fillStyle = 'rgba(45,86,44,0.8)';
          ctx.fillRect(cx, cy - 1, 1, 1);
        } else if (d.type === 'rock' || d.type === 'lava-rock') {
          ctx.fillStyle = d.type === 'lava-rock' ? '#3a2c2b' : '#7d7d74';
          ctx.fillRect(cx - 1, cy - 1, 2, 1);
          ctx.fillStyle = '#a4a294';
          ctx.fillRect(cx - 1, cy - 1, 1, 1);
        } else if (d.type === 'cactus') {
          ctx.fillStyle = '#3c6f3d';
          ctx.fillRect(cx, cy - 2, 1, 2);
        } else if (d.type === 'crystal') {
          ctx.fillStyle = '#bdf3ff';
          ctx.fillRect(cx, cy - 1, 1, 1);
        } else if (d.type === 'obsidian' || d.type === 'dead-tree') {
          ctx.fillStyle = '#2c2528';
          ctx.fillRect(cx, cy - 2, 1, 2);
        }
      }

      // Clairières des lieux importants.
      const disc = (x, y, r, fill, stroke) => {
        if (fill) {
          ctx.fillStyle = fill;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
        if (stroke) {
          ctx.strokeStyle = stroke; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        }
      };
      disc(this.village.tx, this.village.ty, 23, 'rgba(243,222,170,0.4)', 'rgba(118,88,55,0.5)');
      this.houses.forEach(h => {
        ctx.fillStyle = '#6d4b31';
        ctx.fillRect(h.tx - 3, h.ty - 2, 6, 4);
        ctx.fillStyle = '#c69a64';
        ctx.fillRect(h.tx - 2, h.ty - 2, 4, 1);
        ctx.fillStyle = '#7c5734';
        ctx.fillRect(h.tx - 3, h.ty + 1, 6, 1);
      });
      this.outposts.forEach(o => {
        const ox = o.x / TS, oy = o.y / TS;
        disc(ox, oy, 5, 'rgba(230,214,160,0.3)', null);
        ctx.fillStyle = '#4b7a4d';
        ctx.fillRect(Math.round(ox) - 1, Math.round(oy) - 1, 3, 2);
        ctx.fillStyle = '#d9c78e';
        ctx.fillRect(Math.round(ox), Math.round(oy) - 2, 1, 1);
      });
      this.arenas.forEach(a => {
        const r = Math.max(4, Math.round(a.radiusPx / TS * 0.9));
        disc(a.tx, a.ty, r, 'rgba(214,190,140,0.16)', 'rgba(70,52,43,0.62)');
        ctx.fillStyle = a.kind === 'big' ? '#8f3d33' : '#8b6640';
        ctx.fillRect(a.tx - 1, a.ty - 1, 2, 2);
      });
      const f = this.finalArena;
      disc(f.tx, f.ty, Math.max(5, Math.round(f.radiusPx / TS * 0.9)), 'rgba(180,140,220,0.14)', 'rgba(154,112,190,0.7)');

      this.mapTexture = canvas;
      return canvas;
    }

    drawMapTexture(ctx, w, h) {
      const tex = this.buildMapTexture();
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(tex, 0, 0, w, h);
      ctx.restore();
    }

    drawMinimap(ctx, w, h, knownZones) {
      // carte simplifiée du monde (pour le menu carte)
      const sx = w / W, sy = h / H;
      const colors = {
        plains: '#83b968', forest: '#4f7c4b', desert: '#d7bd78', swamp: '#677a50',
        tundra: '#dbe9ee', volcano: '#72524b'
      };
      const dark = {
        plains: '#263129', forest: '#222d26', desert: '#302c24', swamp: '#252a23',
        tundra: '#2a3034', volcano: '#2f2524'
      };
      for (let ty = 0; ty < H; ty += 2) {
        for (let tx = 0; tx < W; tx += 2) {
          const k = key(tx, ty);
          const zone = D.ZONES[this.biome[k]];
          const bi = zone.id;
          const known = !knownZones || !!knownZones[bi];
          const sp = this.special[k];
          let col = known ? (colors[bi] || '#888') : (dark[bi] || '#23252e');
          if (sp === SPECIAL_WATER || sp === SPECIAL_LAVA) {
            col = known ? (sp === SPECIAL_LAVA ? '#bf4d2b' : '#4e8ea4') : (sp === SPECIAL_LAVA ? '#35201d' : '#1b2830');
          }
          if (this.path[k]) col = known ? '#cdb183' : '#2b2620';
          if (this.special[k] === SPECIAL_BRIDGE) col = known ? '#a67848' : '#32291f';
          ctx.fillStyle = col;
          ctx.fillRect(Math.floor(tx * sx), Math.floor(ty * sy), Math.ceil(sx * 2), Math.ceil(sy * 2));
        }
      }
      // village (toujours connu)
      const vx = this.village.tx * sx, vy = this.village.ty * sy;
      ctx.fillStyle = '#e5d099'; ctx.fillRect(vx - 8, vy - 8, 16, 16);
      ctx.fillStyle = '#8e6e48'; ctx.fillRect(vx - 6, vy - 6, 12, 12);
      ctx.fillStyle = '#77c3d0'; ctx.fillRect(vx - 2, vy - 2, 4, 4);
    }

    serializeBossStates(defeated) {
      this.arenas.forEach(a => { a.defeated = !!(defeated && defeated[a.id]); });
      this.finalArena.defeated = !!(defeated && defeated.final);
    }
  }

  window.World = World;
})();
