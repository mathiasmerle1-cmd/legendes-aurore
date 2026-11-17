/* ============================================================
   LES LÉGENDES D'AURORE — faune sauvage
   Petites bêtes passives, propres à chaque biome, qui vivent
   autour du joueur sans jamais bloquer le chemin.
   ============================================================ */
(function () {
  'use strict';
  const U = window.U, D = window.DATA, Art = window.Art;

  const R = Art.R, E = Art.E, line = Art.line;

  const KINDS = {
    butterfly: { fly: true, speed: 18, run: 34, home: 34, flee: 42, fps: 7, w: 12, h: 9, glow: null },
    bird:     { ground: true, speed: 20, run: 72, home: 52, flee: 70, fps: 5, w: 15, h: 11, takeoff: true },
    rabbit:   { ground: true, speed: 26, run: 62, home: 30, flee: 62, fps: 6, w: 13, h: 15 },
    squirrel: { ground: true, speed: 34, run: 58, home: 28, flee: 52, fps: 7, w: 13, h: 13 },
    lizard:   { ground: true, speed: 40, run: 70, home: 22, flee: 42, fps: 9, w: 17, h: 9 },
    dragonfly:{ fly: true, speed: 30, run: 54, home: 42, flee: 48, fps: 9, w: 16, h: 9 },
    firefly:  { fly: true, speed: 10, run: 22, home: 26, flee: 34, fps: 3, w: 7, h: 7, glow: '#d9ffa0' },
    moth:     { fly: true, speed: 16, run: 32, home: 30, flee: 38, fps: 6, w: 11, h: 9, glow: '#ffb45d' },
    frog:     { ground: true, speed: 18, run: 34, home: 18, flee: 38, fps: 3, w: 11, h: 9 },
    fox:      { ground: true, speed: 30, run: 66, home: 58, flee: 76, fps: 6, w: 19, h: 14 }
  };

  const POOLS = {
    plains: [['butterfly', 5], ['bird', 3], ['rabbit', 2], ['squirrel', 1]],
    forest: [['butterfly', 3], ['squirrel', 3], ['bird', 2], ['rabbit', 1], ['firefly', 2], ['fox', 1]],
    desert: [['lizard', 4], ['bird', 2], ['fox', 2], ['butterfly', 1]],
    swamp: [['dragonfly', 4], ['frog', 3], ['firefly', 3], ['bird', 1]],
    tundra: [['rabbit', 4], ['bird', 3], ['fox', 2], ['moth', 1]],
    volcano: [['moth', 3], ['lizard', 3], ['bird', 1], ['firefly', 2]]
  };

  const ZONE_KEYS = ['plains', 'forest', 'desert', 'swamp', 'tundra', 'volcano'];

  const PAL = {
    butterfly: {
      plains: ['#f4e07a', '#fff4cf', '#c9a83f'],
      forest: ['#8fb3e8', '#d7ecf7', '#5b6fae'],
      desert: ['#f2b75a', '#ffe3a8', '#c07a36'],
      swamp: ['#8fd8c0', '#e0fff4', '#4d8f76'],
      tundra: ['#d8ecff', '#ffffff', '#94b8d0'],
      volcano: ['#f08a4a', '#ffd0a0', '#a1442f']
    },
    bird: {
      plains: ['#8a6a44', '#b8935e', '#5d432e'],
      forest: ['#4d6e9a', '#7fa3c9', '#2f4a6b'],
      desert: ['#b99a65', '#e0c28a', '#8a6d42'],
      swamp: ['#5f7d52', '#88a66d', '#3f5a38'],
      tundra: ['#dbe9ee', '#f7ffff', '#a8c0c9'],
      volcano: ['#5a4440', '#8a6356', '#362625']
    },
    rabbit: {
      plains: ['#9a7650', '#c5a578', '#6c5037'],
      forest: ['#8a7556', '#b39c76', '#5d4c38'],
      desert: ['#c3a376', '#e6cba0', '#94764f'],
      swamp: ['#7c7052', '#a89a70', '#554c39'],
      tundra: ['#e8f1f4', '#ffffff', '#b9ccd3'],
      volcano: ['#6b544a', '#927163', '#46352f']
    },
    squirrel: {
      plains: ['#a8653d', '#d0895a', '#72432a'],
      forest: ['#8f5236', '#c37b4e', '#5d3524'],
      desert: ['#b3834f', '#ddae73', '#7d5a36'],
      swamp: ['#6d5a3c', '#998059', '#4a3d29'],
      tundra: ['#9fb3bc', '#c9dbe1', '#728892'],
      volcano: ['#5b443b', '#855f4e', '#382a26']
    },
    lizard: {
      plains: ['#6f8f4a', '#a3bd6b', '#4d6634'],
      forest: ['#4f7a45', '#7da766', '#365433'],
      desert: ['#b99355', '#dfbc79', '#896b3c'],
      swamp: ['#4d6f4c', '#759763', '#334d36'],
      tundra: ['#8fb0ba', '#c3dde3', '#64848f'],
      volcano: ['#b25b3c', '#e08a55', '#71382a']
    },
    dragonfly: {
      plains: ['#5aa8b8', '#b8eef2', '#397887'],
      forest: ['#4f8f86', '#a8e0d2', '#356462'],
      desert: ['#68a8a0', '#c2ece0', '#3f746e'],
      swamp: ['#3f8f84', '#9fe0cf', '#285f5a'],
      tundra: ['#7fb8cc', '#d8f5ff', '#527f95'],
      volcano: ['#b06a4a', '#e8b08a', '#744330']
    },
    firefly: {
      plains: ['#d8f27a', '#fffbd0', '#7d8f3d'],
      forest: ['#bff28a', '#f4ffd0', '#587d3d'],
      desert: ['#f2d878', '#fff6c0', '#8f7a38'],
      swamp: ['#a8f2b4', '#e8ffd8', '#4d7d55'],
      tundra: ['#c8f2ff', '#f4ffff', '#6f90a0'],
      volcano: ['#ffc46a', '#fff0b8', '#9a5a2f']
    },
    moth: {
      plains: ['#c8b08a', '#efe0c0', '#8a7050'],
      forest: ['#9a86b8', '#d8c8ef', '#66507f'],
      desert: ['#d8b47a', '#f5dfb0', '#997547'],
      swamp: ['#8fa886', '#c8d8b8', '#5c7057'],
      tundra: ['#c8d8e0', '#f2fbff', '#8a9fa8'],
      volcano: ['#e08a55', '#ffd0a0', '#8f4a2f']
    },
    frog: {
      plains: ['#6f9a4a', '#a8c86a', '#4f7034'],
      forest: ['#4f8a4a', '#84b86a', '#365f34'],
      desert: ['#8a9a55', '#b8c47a', '#63703c'],
      swamp: ['#5f8f4a', '#95c46a', '#3d6634'],
      tundra: ['#7f9fa8', '#b8d4da', '#58737c'],
      volcano: ['#8f5a42', '#c08460', '#5c382a']
    },
    fox: {
      plains: ['#b5613c', '#e0915f', '#7a3d28'],
      forest: ['#a55235', '#d47b4e', '#6f3524'],
      desert: ['#c89960', '#efc58a', '#8f6b3e'],
      swamp: ['#8a6a47', '#b58f63', '#5d4630'],
      tundra: ['#e8f1f4', '#ffffff', '#b6c8ce'],
      volcano: ['#6d4b3f', '#9a6b56', '#46302a']
    }
  };

  function pal(type, biome) {
    const p = PAL[type] && PAL[type][biome];
    return p || (PAL[type] && PAL[type].plains) || ['#a88962', '#d8b98a', '#6d5238'];
  }

  /* ------------------------------------------------------------
     Sprites procéduraux
     ------------------------------------------------------------ */
  function critterSprite(type, biome, frame) {
    const def = KINDS[type];
    return Art.deco('critter:' + type + ':' + biome + ':' + frame, def.w, def.h, (ctx, w, h) => {
      const c = pal(type, biome);
      if (type === 'butterfly') {
        const up = frame === 0;
        const wingY = up ? 1 : 3;
        const wingH = up ? 5 : 3;
        E(ctx, 3, wingY + 2, 3, wingH, c[0]);
        E(ctx, 9, wingY + 2, 3, wingH, c[0]);
        R(ctx, 3, wingY + 2, 2, 1, c[1]);
        R(ctx, 9, wingY + 2, 2, 1, c[1]);
        R(ctx, 2, wingY + 4, 2, 1, c[2]);
        R(ctx, 11, wingY + 4, 2, 1, c[2]);
        R(ctx, 6, 2, 1, 6, '#4a3b32');
        R(ctx, 6, 1, 1, 1, '#2e2622');
        R(ctx, 5, 0, 1, 2, '#2e2622'); R(ctx, 7, 0, 1, 2, '#2e2622');
        R(ctx, 6, 2, 1, 1, c[1]);
      } else if (type === 'bird') {
        const flying = frame === 1;
        E(ctx, 8, 7, 5, 3, c[0]);
        E(ctx, 9, 6, 4, 2, c[1]);
        E(ctx, 11, 4, 3, 3, c[0]);
        R(ctx, 12, 3, 2, 1, c[1]);
        R(ctx, 14, 4, 1, 1, '#e8b34c');
        R(ctx, 12, 4, 1, 1, '#241d1a');
        R(ctx, 4, 7, 4, 1, c[2]);
        R(ctx, 3, 6, 3, 1, c[2]);
        if (flying) {
          R(ctx, 6, 3, 5, 2, c[2]);
          R(ctx, 7, 2, 3, 1, c[1]);
          R(ctx, 3, 4, 2, 1, c[2]);
        } else {
          R(ctx, 6, 6, 4, 2, c[2]);
          R(ctx, 7, 5, 2, 1, c[1]);
          R(ctx, 9, 10, 1, 1, '#8f7040');
          R(ctx, 12, 10, 1, 1, '#8f7040');
        }
      } else if (type === 'rabbit') {
        const hop = frame === 1;
        const lift = hop ? 1 : 0;
        E(ctx, 7, 11 - lift, 4, 3, c[0]);
        E(ctx, 8, 9 - lift, 3, 4, c[1]);
        E(ctx, 7, 7 - lift, 3, 3, c[1]);
        R(ctx, 6, 2 - lift, 3, 1, c[0]);
        R(ctx, 6, 3 - lift, 2, 4, c[0]);
        R(ctx, 9, 3 - lift, 2, 4, c[0]);
        R(ctx, 6, 3 - lift, 1, 2, c[1]); R(ctx, 10, 3 - lift, 1, 2, c[1]);
        R(ctx, 9, 7 - lift, 1, 1, '#241d1a');
        R(ctx, 10, 8 - lift, 1, 1, '#e8b3a0');
        R(ctx, 4, 10 - lift, 1, 3, c[0]);
        R(ctx, 11, 10 - lift, 1, 2, c[0]);
        if (hop) { R(ctx, 4, 12, 2, 1, c[2]); R(ctx, 10, 12, 2, 1, c[2]); }
      } else if (type === 'squirrel') {
        const up = frame === 1;
        E(ctx, 8, 7, 4, 3, c[0]);
        E(ctx, 9, 4, 3, 4, c[1]);
        E(ctx, 8, 3, 2, 3, c[1]);
        R(ctx, 8, 2, 1, 1, c[0]); R(ctx, 10, 2, 1, 1, c[0]);
        R(ctx, 10, 4, 1, 1, '#241d1a');
        R(ctx, 12, 8, 1, 1, '#e8c88f');
        E(ctx, 3, up ? 6 : 8, 3, up ? 5 : 4, c[0]);
        E(ctx, 3, up ? 5 : 7, 2, 3, c[1]);
        R(ctx, 4, up ? 4 : 6, 1, 1, c[2]);
        R(ctx, 5, 10, 2, 1, c[2]); R(ctx, 10, 10, 2, 1, c[2]);
      } else if (type === 'lizard') {
        const step = frame === 1;
        R(ctx, 3, 6, 3, 1, c[2]);
        R(ctx, 5, 5, 8, 3, c[0]);
        R(ctx, 6, 5, 5, 1, c[1]);
        R(ctx, 12, 4, 3, 3, c[1]);
        R(ctx, 13, 4, 1, 1, '#241d1a');
        R(ctx, 15, 5, 1, 1, '#e8d8a0');
        R(ctx, 2, 5, 2, 1, c[2]);
        R(ctx, 6, step ? 8 : 3, 2, 1, c[2]);
        R(ctx, 10, step ? 3 : 8, 2, 1, c[2]);
        R(ctx, 7, 6, 1, 1, c[2]); R(ctx, 10, 7, 1, 1, c[2]);
      } else if (type === 'dragonfly') {
        const wide = frame === 0;
        R(ctx, 2, 5, 5, 1, c[0]);
        R(ctx, 6, 4, 6, 2, c[1]);
        R(ctx, 11, 3, 3, 3, c[0]);
        R(ctx, 12, 3, 1, 1, '#241d1a');
        R(ctx, 6, 3, 4, 1, 'rgba(200,240,245,0.72)');
        R(ctx, 7, 7, 4, 1, 'rgba(200,240,245,0.72)');
        if (wide) {
          R(ctx, 4, 1, 4, 2, 'rgba(200,240,245,0.82)');
          R(ctx, 8, 1, 4, 2, 'rgba(200,240,245,0.82)');
          R(ctx, 4, 7, 4, 1, 'rgba(200,240,245,0.6)');
          R(ctx, 8, 7, 4, 1, 'rgba(200,240,245,0.6)');
        } else {
          R(ctx, 5, 2, 3, 1, 'rgba(200,240,245,0.72)');
          R(ctx, 8, 2, 3, 1, 'rgba(200,240,245,0.72)');
        }
      } else if (type === 'firefly') {
        R(ctx, 2, 3, 3, 3, c[1]);
        R(ctx, 1, 4, 1, 1, c[0]);
        R(ctx, 5, 3, 2, 2, '#3e3a34');
        R(ctx, 4, 2, 1, 1, '#2c2824');
        R(ctx, 3, 5, 2, 1, c[0]);
        if (frame === 1) { R(ctx, 2, 1, 1, 1, 'rgba(240,255,190,0.8)'); R(ctx, 5, 1, 1, 1, 'rgba(240,255,190,0.8)'); }
      } else if (type === 'moth') {
        const up = frame === 0;
        E(ctx, 3, up ? 3 : 4, 4, up ? 4 : 3, c[0]);
        E(ctx, 8, up ? 3 : 4, 4, up ? 4 : 3, c[0]);
        R(ctx, 2, up ? 3 : 4, 2, 1, c[1]); R(ctx, 8, up ? 3 : 4, 2, 1, c[1]);
        R(ctx, 4, up ? 4 : 5, 1, 1, c[2]); R(ctx, 8, up ? 4 : 5, 1, 1, c[2]);
        R(ctx, 5, 2, 2, 6, '#4a3d38');
        R(ctx, 6, 1, 1, 1, '#2e2622');
      } else if (type === 'frog') {
        const hop = frame === 1;
        E(ctx, 5, hop ? 6 : 7, 4, 3, c[0]);
        E(ctx, 6, hop ? 4 : 5, 3, 3, c[1]);
        R(ctx, 5, hop ? 3 : 4, 1, 1, '#f2f0c8'); R(ctx, 8, hop ? 3 : 4, 1, 1, '#f2f0c8');
        R(ctx, 5, hop ? 4 : 5, 1, 1, '#241d1a'); R(ctx, 8, hop ? 4 : 5, 1, 1, '#241d1a');
        R(ctx, 5, hop ? 4 : 5, 2, 1, c[2]);
        R(ctx, 2, hop ? 7 : 8, 2, 1, c[2]); R(ctx, 9, hop ? 7 : 8, 2, 1, c[2]);
        R(ctx, 3, hop ? 9 : 9, 2, 1, c[0]); R(ctx, 8, hop ? 9 : 9, 2, 1, c[0]);
      } else if (type === 'fox') {
        const step = frame === 1;
        E(ctx, 9, 10, 6, 3, c[0]);
        E(ctx, 10, 8, 5, 3, c[1]);
        E(ctx, 13, 6, 4, 3, c[1]);
        R(ctx, 12, 3, 1, 3, c[0]); R(ctx, 15, 3, 1, 3, c[0]);
        R(ctx, 12, 3, 1, 1, c[2]); R(ctx, 15, 3, 1, 1, c[2]);
        R(ctx, 15, 8, 1, 1, '#241d1a');
        R(ctx, 17, 8, 1, 1, '#241d1a');
        R(ctx, 10, 10, 2, 3, step ? c[2] : c[0]);
        R(ctx, 14, 10, 2, 3, step ? c[0] : c[2]);
        R(ctx, 2, 8, 2, 3, c[0]);
        E(ctx, 3, 6, 3, 4, c[0]);
        E(ctx, 4, 5, 2, 3, c[1]);
        R(ctx, 2, 5, 1, 2, c[1]);
        R(ctx, 17, 7, 2, 1, c[2]);
      }
    }, '#2a232e');
  }

  /* ------------------------------------------------------------
     Une petite bête
     ------------------------------------------------------------ */
  class Critter {
    constructor(type, biome, x, y) {
      const def = KINDS[type];
      this.type = type;
      this.biome = biome;
      this.def = def;
      this.x = x;
      this.y = y;
      this.homeX = x;
      this.homeY = y;
      this.targetX = x;
      this.targetY = y;
      this.phase = Math.random() * Math.PI * 2;
      this.t = Math.random() * 4;
      this.anim = Math.random() * 4;
      this.frame = 0;
      this.face = Math.random() < 0.5 ? -1 : 1;
      this.timer = 0.2 + Math.random() * 0.8;
      this.fleeTimer = 0;
      this.flying = false;
      this.z = def.fly ? 5 + Math.random() * 9 : 0;
      this.baseZ = this.z;
      this.idleJump = 0;
    }

    pickTarget() {
      const ang = Math.random() * Math.PI * 2;
      const rad = this.def.home * (0.25 + Math.random() * 0.75);
      this.targetX = this.homeX + Math.cos(ang) * rad;
      this.targetY = this.homeY + Math.sin(ang) * rad * 0.62;
    }

    update(dt, game) {
      const p = game.player;
      const def = this.def;
      const dxp = this.x - p.x, dyp = this.y - p.y;
      const distP = Math.sqrt(dxp * dxp + dyp * dyp);

      if (distP < def.flee) {
        this.fleeTimer = 1.1;
        const inv = 1 / Math.max(1, distP);
        this.targetX = this.x + dxp * inv * (def.home + 24);
        this.targetY = this.y + dyp * inv * (def.home + 24);
        if (def.takeoff && !this.flying && !this._flightCooldown) {
          this.flying = true;
          this._flightCooldown = 1.8;
          this._flightTime = 0.9;
        }
      } else if (this.fleeTimer > 0) {
        this.fleeTimer -= dt;
        if (this.fleeTimer <= 0) {
          this.homeX = this.x;
          this.homeY = this.y;
          this.pickTarget();
        }
      }

      if (this._flightCooldown) {
        this._flightCooldown -= dt;
        if (this._flightCooldown <= 0) this._flightCooldown = 0;
      }

      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = 0.7 + Math.random() * 1.8;
        this.pickTarget();
        if (!def.fly && Math.random() < 0.25) this.idleJump = 0.22;
      }
      if (this.idleJump > 0) this.idleJump -= dt;

      const fleeing = this.fleeTimer > 0;
      let tx = this.targetX, ty = this.targetY;
      let speed = fleeing ? def.run : def.speed;
      if (this.flying) speed = def.run * 1.15;
      const dx = tx - this.x, dy = ty - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1.5) {
        const inv = 1 / dist;
        const step = Math.min(dist, speed * dt);
        const nx = this.x + dx * inv * step;
        const ny = this.y + dy * inv * step;
        if (def.fly || this.flying) {
          this.x = nx; this.y = ny;
        } else {
          this.moveGround(nx, ny, game);
        }
        if (Math.abs(dx) > 0.4) this.face = dx < 0 ? -1 : 1;
        this.anim += dt * (fleeing || dist > 12 ? def.fps : def.fps * 0.35);
        this.frame = Math.floor(this.anim) % 2;
      } else {
        this.anim += dt * def.fps * 0.2;
        this.frame = Math.floor(this.anim) % 2;
      }

      // Hauteur de vol et petits battements.
      if (def.fly) {
        this.t += dt;
        const hover = Math.sin(this.t * 2.2 + this.phase) * 2.1;
        this.z = this.baseZ + hover;
        if (this.type === 'firefly' || this.type === 'moth') {
          this.z = this.baseZ + Math.sin(this.t * 1.4 + this.phase) * 3;
        }
      } else if (this.flying) {
        this._flightTime -= dt;
        this.z += (14 - this.z) * Math.min(1, dt * 4);
        if (this._flightTime <= 0) {
          this.flying = false;
          this.z = 0;
        }
      } else {
        this.z = this.idleJump > 0 ? Math.sin((1 - this.idleJump / 0.22) * Math.PI) * 3 : 0;
      }
    }

    moveGround(nx, ny, game) {
      const world = game.world;
      if (world.canStandAt(nx, ny, 5, 3)) {
        this.x = nx; this.y = ny;
        return;
      }
      // Contourne l'obstacle en essayant les deux axes séparément.
      if (world.canStandAt(nx, this.y, 5, 3)) { this.x = nx; return; }
      if (world.canStandAt(this.x, ny, 5, 3)) { this.y = ny; return; }
      // Bloqué : on repart dans une autre direction depuis son refuge.
      this.targetX = this.homeX + (Math.random() * 2 - 1) * this.def.home;
      this.targetY = this.homeY + (Math.random() * 2 - 1) * this.def.home * 0.6;
    }
  }

  /* ------------------------------------------------------------
     Population autour du joueur
     ------------------------------------------------------------ */
  const Wildlife = function (game) {
    this.game = game;
    this.list = [];
    this.spawnTimer = 0;
    this.targetCount = 18;
    this.zoneKeys = ZONE_KEYS;
  };

  Wildlife.prototype.reset = function () {
    this.list.length = 0;
    this.spawnTimer = 0;
  };

  Wildlife.prototype.pickType = function (biome) {
    const pool = POOLS[biome] || POOLS.plains;
    let total = 0;
    for (const p of pool) total += p[1];
    let roll = Math.random() * total;
    for (const p of pool) {
      roll -= p[1];
      if (roll <= 0) return p[0];
    }
    return pool[0][0];
  };

  Wildlife.prototype.findShore = function (tx, ty) {
    const world = this.game.world;
    const W = D.WORLD_SIZE;
    for (let r = 1; r <= 6; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = tx + dx, y = ty + dy;
          if (x < 2 || y < 2 || x >= W - 2 || y >= W - 2) continue;
          if (world.special[y * W + x] !== 1) continue;
          for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const lx = x + ox, ly = y + oy;
            if (world.special[ly * W + lx] !== 0) continue;
            if (world.blocked[ly * W + lx]) continue;
            return { x: lx * 16 + 8, y: ly * 16 + 14 };
          }
        }
      }
    }
    return null;
  };

  Wildlife.prototype.spawnOne = function () {
    const game = this.game;
    const p = game.player;
    if (!p) return;
    const world = game.world;
    for (let attempt = 0; attempt < 10; attempt++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 110 + Math.random() * 220;
      let x = U.clamp(p.x + Math.cos(ang) * dist, 24, D.WORLD_SIZE * 16 - 24);
      let y = U.clamp(p.y + Math.sin(ang) * dist, 24, D.WORLD_SIZE * 16 - 24);
      let tx = Math.floor(x / 16), ty = Math.floor(y / 16);
      const k = ty * D.WORLD_SIZE + tx;
      if (world.special[k] !== 0 || world.blocked[k]) continue;
      const biome = ZONE_KEYS[world.biome[k]] || 'plains';
      let type = this.pickType(biome);
      if (type === 'dragonfly') {
        const shore = this.findShore(tx, ty);
        if (shore) { x = shore.x; y = shore.y; tx = Math.floor(x / 16); ty = Math.floor(y / 16); }
        else if (biome !== 'swamp') type = 'butterfly';
      }
      this.list.push(new Critter(type, biome, x, y));
      return;
    }
  };

  Wildlife.prototype.update = function (dt) {
    const game = this.game;
    if (!game.player || game.interior) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.list.length < this.targetCount) {
      this.spawnTimer = 0.22 + Math.random() * 0.3;
      this.spawnOne();
    }
    const p = game.player;
    const maxD = 760;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const c = this.list[i];
      const dx = c.x - p.x, dy = c.y - p.y;
      if (dx * dx + dy * dy > maxD * maxD) {
        this.list.splice(i, 1);
        continue;
      }
      c.update(dt, game);
    }
  };

  Wildlife.prototype.getVisible = function (camX, camY, vw, vh) {
    const out = [];
    for (const c of this.list) {
      if (c.x < camX - 40 || c.x > camX + vw + 40 || c.y < camY - 60 || c.y > camY + vh + 60) continue;
      out.push(c);
    }
    return out;
  };

  Wildlife.prototype.drawCritter = function (ctx, c, camX, camY) {
    const def = c.def;
    const img = critterSprite(c.type, c.biome, c.frame);
    const x = Math.round(c.x - camX);
    const y = Math.round(c.y - camY - c.z);
    if (!def.fly) {
      Art.drawShadow(ctx, c.x - camX, c.y - camY - 1, c.type === 'fox' ? 16 : 9, c.type === 'fox' ? 6 : 4, 0.48);
    }
    if (def.glow) {
      const glow = def.glow;
      const pulse = 0.55 + Math.sin(c.t * 2.7 + c.phase) * 0.35;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y - 2, 1, x, y - 2, 14);
      g.addColorStop(0, U.rgba(glow, 0.24 * pulse));
      g.addColorStop(0.5, U.rgba(glow, 0.08 * pulse));
      g.addColorStop(1, U.rgba(glow, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - 16, y - 18, 32, 32);
      ctx.restore();
    }
    const dx = Math.round(c.x - img.width / 2 - camX);
    const dy = Math.round(y - img.height + 1);
    if (c.face < 0) {
      ctx.save();
      ctx.translate(dx + img.width, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(img, dx, dy);
    }
  };

  window.Wildlife = Wildlife;
})();
