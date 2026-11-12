/* ============================================================
   LES LÉGENDES D'AURORE — monde ouvert
   Génération des biomes, chemins, décors, arènes et repères
   ============================================================ */
(function () {
  'use strict';
  const U = window.U, D = window.DATA, Art = window.Art;

  const TS = 16;
  const W = D.WORLD_SIZE;
  const H = D.WORLD_SIZE;
  const SPECIAL_NONE = 0, SPECIAL_WATER = 1, SPECIAL_LAVA = 2, SPECIAL_BRIDGE = 3;
  const SEED = 20260214;

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
            const wobble = (U.fbm(x * 0.035 + i * 17, y * 0.035 - i * 11, this.seed + i * 101, 3) - 0.5) * 30;
            const dx = x - z.anchor.x, dy = y - z.anchor.y;
            const d = Math.sqrt(dx * dx + dy * dy) + wobble;
            if (d < bestD) { bestD = d; best = i; }
          });
          this.biome[key(x, y)] = best;
          this.variant[key(x, y)] = Math.floor(rng() * 4);
        }
      }
      // zones forcées autour des lieux importants
      this.forceBiomeCircle(D.VILLAGE.x, D.VILLAGE.y, 25, 0);
      this.forceBiomeCircle(D.FINAL_ARENA.x, D.FINAL_ARENA.y, 15, 0);
      D.ZONES.forEach((z, i) => {
        z.arenas.forEach(a => this.forceBiomeCircle(a.x, a.y, 11, i));
      });
      D.OUTPOSTS.forEach(o => {
        const z = D.ZONE_BY_ID[o.biome];
        if (z) this.forceBiomeCircle(o.x, o.y, 8, z.index);
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
      if (U.dist2(tx, ty, D.VILLAGE.x, D.VILLAGE.y) < 24 * 24) return true;
      if (U.dist2(tx, ty, D.FINAL_ARENA.x, D.FINAL_ARENA.y) < 14 * 14) return true;
      for (const z of D.ZONES) for (const a of z.arenas) {
        const ar = a.kind === 'big' ? 15 : 11;
        if (U.dist2(tx, ty, a.x, a.y) < ar * ar) return true;
      }
      for (const o of D.OUTPOSTS) {
        if (U.dist2(tx, ty, o.x, o.y) < 9 * 9) return true;
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
      ];
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
          const rad = a.kind === 'big' ? 11 : 8;
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
      ];
      routes.forEach(r => this.markPath(r, 1.05));
      // chemin autour de la place
      for (let a = 0; a < 12; a++) {
        const ang = a / 12 * Math.PI * 2;
        this.stampPathPoint(Math.round(116 + Math.cos(ang) * 10), Math.round(126 + Math.sin(ang) * 10), 1.2);
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
      if (U.dist2(tx, ty, D.VILLAGE.x, D.VILLAGE.y) < (25 + extra) * (25 + extra)) return true;
      if (U.dist2(tx, ty, D.FINAL_ARENA.x, D.FINAL_ARENA.y) < (13 + extra) * (13 + extra)) return true;
      for (const z of D.ZONES) for (const a of z.arenas) {
        const r = (a.kind === 'big' ? 12 : 8) + extra;
        if (U.dist2(tx, ty, a.x, a.y) < r * r) return true;
      }
      for (const o of this.outposts) {
        if (U.dist2(tx, ty, o.tx, o.ty) < (9 + extra) * (9 + extra)) return true;
      }
      for (const it of this.interactables) {
        if (U.dist2(tx, ty, it.tx, it.ty) < (3 + extra) * (3 + extra)) return true;
      }
      return false;
    }

    isSafeTile(tx, ty) {
      if (U.dist2(tx, ty, D.VILLAGE.x, D.VILLAGE.y) < D.VILLAGE.r * D.VILLAGE.r) return true;
      for (const o of this.outposts) {
        if (U.dist2(tx, ty, o.tx, o.ty) < 9 * 9) return true;
      }
      return false;
    }

    isSafePx(x, y) {
      return this.isSafeTile(Math.floor(x / TS), Math.floor(y / TS));
    }

    placeVillage(rng) {
      // sol de la place
      this.village.img = Art.villagePlaza();
      this.village.decal = true;
      // bâtiments
      const addBuilding = (img, tx, ty, wid, hei, kind) => {
        const x = tx * TS + 8, y = ty * TS + 16;
        const fp = { w: wid, h: hei, ox: -Math.floor(wid / 2), oy: -hei + 1 };
        for (let yy = ty - hei + 1; yy <= ty; yy++) {
          for (let xx = tx - Math.floor(wid / 2); xx < tx - Math.floor(wid / 2) + wid; xx++) {
            if (inBounds(xx, yy)) this.blocked[key(xx, yy)] = 1;
          }
        }
        this.addDecor(img, x, y, { type: kind, id: kind });
        // cheminier -> fumée
        this.emitters.push({ x: x + 17, y: y - img.height + 11, type: 'smoke', rate: 1.1, timer: rng() * 2 });
      };
      addBuilding(Art.hall(), 116, 120, 9, 3, 'hall');
      addBuilding(Art.shop(), 103, 126, 7, 3, 'shop');
      addBuilding(Art.forge(), 133, 126, 7, 3, 'forge');
      addBuilding(Art.house(0), 104, 139, 6, 3, 'house');
      addBuilding(Art.house(1), 129, 140, 6, 3, 'house');
      addBuilding(Art.house(2), 144, 137, 6, 3, 'house');

      // fontaine
      const fx = 116 * TS + 8, fy = 126 * TS + 16;
      this.village.fountain = this.addDecor(Art.fountain(), fx, fy, { solid: true, footprint: { w: 3, h: 2, ox: -1, oy: -1 }, type: 'fountain' });
      this.emitters.push({ x: fx, y: fy - 35, type: 'sparkle', rate: 0.8, timer: 0 });
      // puits et mobilier
      this.addDecor(Art.well(), 109 * TS + 8, 133 * TS + 16, { solid: true, footprint: { w: 2, h: 1, ox: 0, oy: 0 }, type: 'well' });
      this.addDecor(Art.bench(), 108 * TS + 8, 128 * TS + 16, { solid: true, type: 'bench' });
      this.addDecor(Art.bench(), 125 * TS + 8, 129 * TS + 16, { solid: true, type: 'bench' });
      this.addDecor(Art.lamp(), 111 * TS + 8, 121 * TS + 16, { solid: true, type: 'lamp' });
      this.addDecor(Art.lamp(), 123 * TS + 8, 121 * TS + 16, { solid: true, type: 'lamp' });
      this.addDecor(Art.lamp(), 108 * TS + 8, 136 * TS + 16, { solid: true, type: 'lamp' });
      this.addDecor(Art.lamp(), 136 * TS + 8, 132 * TS + 16, { solid: true, type: 'lamp' });
      this.addDecor(Art.barrel(), 99 * TS + 8, 128 * TS + 16, { solid: true, type: 'barrel' });
      this.addDecor(Art.crate(), 99 * TS + 8, 130 * TS + 16, { solid: true, type: 'crate' });
      this.addDecor(Art.barrel(), 138 * TS + 8, 129 * TS + 16, { solid: true, type: 'barrel' });
      this.addDecor(Art.anvil(), 137 * TS + 8, 127 * TS + 16, { solid: false, type: 'anvil' });
      this.addDecor(Art.dummy(), 131 * TS + 8, 130 * TS + 16, { solid: true, type: 'dummy' });
      // fleurs et petits décors de village
      const flowerSpots = [[112, 134], [121, 135], [126, 124], [105, 123], [119, 121], [100, 137], [139, 134], [114, 116]];
      flowerSpots.forEach(([tx, ty], i) => {
        this.addDecor(Art.flowerPatch('plains', i % 2), tx * TS + 8, ty * TS + 16, { type: 'flower' });
      });
      const bushSpots = [[101, 117], [140, 114], [97, 134], [145, 128], [118, 140]];
      bushSpots.forEach(([tx, ty], i) => {
        this.addDecor(Art.bush('plains'), tx * TS + 8, ty * TS + 16, { solid: false, type: 'bush' });
      });
    }

    placeOutposts(rng) {
      D.OUTPOSTS.forEach(def => {
        const f = this.findFreeNear(def.x, def.y, 10, 2);
        const tx = f.tx, ty = f.ty;
        const cx = tx * TS + 8, cy = ty * TS + 16;

        // On dégage le camp : aucun décor, arbre ou flaque ne doit gêner.
        for (let yy = ty - 4; yy <= ty + 4; yy++) {
          for (let xx = tx - 4; xx <= tx + 4; xx++) {
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
        this.chests.push(chest);

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
      // petites décorations
      const start = 5, end = W - 5;
      for (let ty = start; ty < end; ty++) {
        for (let tx = start; tx < end; tx++) {
          const k = key(tx, ty);
          if (this.path[k] || this.blocked[k] || this.special[k] !== SPECIAL_NONE) continue;
          if (this.isNearProtected(tx, ty, 0)) continue;
          const bi = this.biome[k];
          const r = rng();
          if (r < 0.055) {
            // petites décorations
            const kind = ['plains', 'forest', 'desert', 'swamp', 'tundra', 'volcano'][bi];
            let img = null;
            if (bi === 0) {
              img = rng() < 0.55 ? Art.flowerPatch('plains', rng() < 0.5 ? 0 : 1) : Art.grassTuft('plains');
            } else if (bi === 1) {
              img = rng() < 0.4 ? Art.mushroomDeco(0) : rng() < 0.6 ? Art.fern('forest') : Art.grassTuft('forest');
            } else if (bi === 2) {
              img = rng() < 0.35 ? Art.bones() : Art.flowerPatch('desert', 0);
            } else if (bi === 3) {
              img = rng() < 0.5 ? Art.reeds(0) : rng() < 0.6 ? Art.mushroomDeco(1) : Art.fern('swamp');
            } else if (bi === 4) {
              img = rng() < 0.45 ? Art.grassTuft('snow') : rng() < 0.7 ? Art.snowdrift() : Art.fern('snow');
            } else {
              img = rng() < 0.5 ? Art.vent() : Art.grassTuft('volcano');
            }
            if (img) this.addDecor(img, tx * TS + 8 + Math.floor(rng() * 6 - 3), ty * TS + 14, { type: 'detail' });
          }
        }
      }

      // objets solides : arbres, rochers, cactus, cristaux...
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
            if (roll < 0.018 + cluster * 0.022) { img = Art.tree('plains', rng() < 0.5 ? 0 : 1); type = 'tree'; }
            else if (roll < 0.034) { img = Art.bush('plains'); solid = false; type = 'bush'; }
            else if (roll < 0.041) { img = Art.rock('plains', rng() < 0.5 ? 0 : 1); type = 'rock'; }
          } else if (bi === 1) {
            if (roll < 0.055 + cluster * 0.035) { img = rng() < 0.65 ? Art.tree('forest', rng() < 0.5 ? 0 : 1) : Art.tree('pine', 0); type = 'tree'; }
            else if (roll < 0.073) { img = Art.bush('forest'); solid = false; type = 'bush'; }
            else if (roll < 0.081) { img = Art.stump('forest'); type = 'stump'; }
            else if (roll < 0.089) { img = Art.rock('forest', 0); type = 'rock'; }
          } else if (bi === 2) {
            if (roll < 0.02 + cluster * 0.025) { img = Art.cactus(rng() < 0.5 ? 0 : 1); type = 'cactus'; }
            else if (roll < 0.042) { img = Art.rock('desert', rng() < 0.5 ? 0 : 1); type = 'rock'; }
            else if (roll < 0.048) { img = Art.bones(); solid = false; type = 'bones'; }
          } else if (bi === 3) {
            if (roll < 0.03 + cluster * 0.03) { img = Art.tree('dead', 0); type = 'dead-tree'; }
            else if (roll < 0.055) { img = Art.reeds(1); solid = false; type = 'reeds'; }
            else if (roll < 0.064) { img = Art.stump('swamp'); type = 'stump'; }
            else if (roll < 0.073) { img = Art.rock('swamp', 0); type = 'rock'; }
          } else if (bi === 4) {
            if (roll < 0.045 + cluster * 0.04) { img = Art.tree('pine_snow', rng() < 0.5 ? 0 : 1); type = 'tree'; }
            else if (roll < 0.058) { img = Art.iceCrystal(rng() < 0.5 ? 0 : 1); type = 'crystal'; }
            else if (roll < 0.071) { img = Art.rock('tundra', rng() < 0.5 ? 0 : 1); type = 'rock'; }
            else if (roll < 0.08) { img = Art.stump('snow'); type = 'stump'; }
          } else {
            if (roll < 0.03 + cluster * 0.025) { img = Art.obsidian(rng() < 0.5 ? 0 : 1); type = 'obsidian'; }
            else if (roll < 0.055) { img = Art.lavaRock(rng() < 0.5 ? 0 : 1); type = 'lava-rock'; }
            else if (roll < 0.07) { img = Art.rock('volcano', 0); type = 'rock'; }
            else if (roll < 0.074) { img = Art.tree('dead', 1); type = 'dead-tree'; }
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
          const f = this.findFreeNear(tx, ty, 5, 0);
          tx = f.tx; ty = f.ty;
        }
        const sheet = Art.npcSheet(def.look);
        this.addInteractable({
          kind: 'npc', id: def.id, name: def.name, role: def.role, look: def.look,
          x: tx * TS + 8, y: ty * TS + 15, tx, ty, img: sheet.frames[0][0],
          sheet, face: 0, hint: def.hint
        });
        // espace de dégagement
        for (let yy = ty - 1; yy <= ty + 1; yy++) for (let xx = tx - 1; xx <= tx + 1; xx++) {
          if (inBounds(xx, yy)) this.blocked[key(xx, yy)] = 0;
        }
      });
      // sanctuaires / bivouacs
      D.SHRINES.forEach(def => {
        let f = this.findFreeNear(def.x, def.y, 8, 1);
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
        let f = this.findFreeNear(def.x, def.y, 8, 0);
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
      for (let yy = f.ty - 1; yy <= f.ty + 1; yy++) for (let xx = f.tx - 1; xx <= f.tx + 1; xx++) {
        if (inBounds(xx, yy)) this.blocked[key(xx, yy)] = 1;
      }
      // petit autel de lisière de village / panneau d'accueil
      this.emitters.push({ x: D.VILLAGE.x * TS + 8, y: D.VILLAGE.y * TS - 20, type: 'pollen', rate: 0.6, timer: 0 });
      // fumée des cheminées supplémentaires
    }

    generateSpawns(rng) {
      const speciesByZone = {};
      D.ZONES.forEach(z => { speciesByZone[z.id] = z.species; });
      const total = 62;
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
          if (this.spawnPoints.some(s => U.dist2(s.tx, s.ty, tx, ty) < 16)) continue;
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
      // Libre autour du point d'apparition du joueur
      const spawnTile = { x: D.VILLAGE.x, y: D.VILLAGE.y + 6 };
      for (let yy = spawnTile.y - 1; yy <= spawnTile.y + 1; yy++) for (let xx = spawnTile.x - 1; xx <= spawnTile.x + 1; xx++) {
        if (inBounds(xx, yy)) { this.blocked[key(xx, yy)] = 0; this.special[key(xx, yy)] = SPECIAL_NONE; }
      }
      this.playerSpawn = { x: spawnTile.x * TS + 8, y: spawnTile.y * TS + 14 };
      // aire de circulation minimale devant les bâtiments / PNJ
      this.npcs.forEach(n => {
        for (let yy = n.ty; yy <= n.ty + 1; yy++) for (let xx = n.tx - 1; xx <= n.tx + 1; xx++) {
          if (inBounds(xx, yy)) this.blocked[key(xx, yy)] = 0;
        }
      });
      // tri des décors pour accès rapide
      this.decor.sort((a, b) => a.y - b.y);
      // index des chunks
      this.decorGrid.clear();
      this.decor.forEach(o => this.addToGrid(o));
      // pas de collision sur les tuiles de lisière de place
      for (let a = 0; a < 20; a++) {
        const ang = a / 20 * Math.PI * 2;
        const tx = Math.round(D.VILLAGE.x + Math.cos(ang) * 13);
        const ty = Math.round(D.VILLAGE.y + Math.sin(ang) * 13);
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
      return this.isBlockedTile(Math.floor(x / TS), Math.floor(y / TS));
    }

    canStandAt(x, y, footW, footH) {
      footW = footW || 10; footH = footH || 8;
      const x1 = Math.floor((x - footW / 2) / TS), x2 = Math.floor((x + footW / 2 - 0.01) / TS);
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
          // glissement léger
          const step = Math.sign(dx);
          for (const off of [2, 4, 6]) {
            if (this.canStandAt(nx, e.y + (e.slidingDir || 1) * off, footW, footH)) { e.x = nx; e.y += (e.slidingDir || 1) * off * 0.35; moved = true; break; }
          }
        }
      }
      if (dy) {
        const ny = e.y + dy;
        if (this.canStandAt(e.x, ny, footW, footH)) { e.y = ny; moved = true; }
        else {
          const step = Math.sign(dy);
          for (const off of [2, 4, 6]) {
            if (this.canStandAt(e.x + (e.slidingDir || 1) * off, ny, footW, footH)) { e.y = ny; e.x += (e.slidingDir || 1) * off * 0.35; moved = true; break; }
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
      const wf = Math.floor(time * 2) % 2;
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
            if (this.path[k]) {
              ctx.drawImage(Art.pathTile(bi, this.pathMask(tx, ty)), Math.round(x), Math.round(y));
            }
          }
        }
      }
      // décalques de sol
      const decals = [];
      if (this.village.img) decals.push({ img: this.village.img, x: this.village.x, y: this.village.y - 8, r: 210 });
      this.outposts.forEach(o => { if (o.img) decals.push({ img: o.img, x: o.x, y: o.y - 8, r: 90 }); });
      this.arenas.forEach(a => decals.push({ img: a.img, x: a.x, y: a.y - 6, r: a.radiusPx + 20 }));
      decals.push({ img: this.finalArena.img, x: this.finalArena.x, y: this.finalArena.y - 6, r: this.finalArena.radiusPx + 20 });
      for (const d of decals) {
        if (!d.img) continue;
        if (d.x + d.r < camX || d.x - d.r > camX + vw || d.y + d.r < camY || d.y - d.r > camY + vh) continue;
        ctx.drawImage(d.img, Math.round(d.x - d.img.width / 2), Math.round(d.y - d.img.height + 12));
      }
    }

    drawMinimap(ctx, w, h) {
      // carte simplifiée du monde (pour le menu carte)
      const sx = w / W, sy = h / H;
      const colors = {
        plains: '#83b968', forest: '#4f7c4b', desert: '#d7bd78', swamp: '#677a50',
        tundra: '#dbe9ee', volcano: '#72524b'
      };
      for (let ty = 0; ty < H; ty += 2) {
        for (let tx = 0; tx < W; tx += 2) {
          const k = key(tx, ty);
          const bi = D.ZONES[this.biome[k]].id;
          const sp = this.special[k];
          let col = colors[bi] || '#888';
          if (sp === SPECIAL_WATER || sp === SPECIAL_LAVA) col = sp === SPECIAL_LAVA ? '#bf4d2b' : '#4e8ea4';
          if (this.path[k]) col = '#cdb183';
          if (this.special[k] === SPECIAL_BRIDGE) col = '#a67848';
          ctx.fillStyle = col;
          ctx.fillRect(Math.floor(tx * sx), Math.floor(ty * sy), Math.ceil(sx * 2), Math.ceil(sy * 2));
        }
      }
      // village
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
