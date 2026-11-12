/* ============================================================
   LES LÉGENDES D'AURORE — boucle de jeu, monde vivant, sauvegarde
   ============================================================ */
(function () {
  'use strict';
  const U = window.U, D = window.DATA, Art = window.Art, UI = window.UI;
  const Entities = window.Entities, FX = window.FX;

  const VIEW_W = 640, VIEW_H = 360, TILE = 16;
  const WORLD_PX = D.WORLD_SIZE * TILE;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('stage');

  const Game = {
    canvas, ctx, stage,
    input: null,
    world: null,
    player: null,
    fx: FX,

    state: 'title',
    paused: false,
    time: 0,
    camX: 0, camY: 0,
    shakeX: 0, shakeY: 0, shakeMag: 0, shakeTime: 0,

    enemies: [],
    projectiles: [],
    activeBoss: null,
    activeArena: null,
    finalFight: false,
    bossCleanupAt: 0,
    victoryAt: 0,
    finalUnlockAt: 0,
    sixSealsShown: false,

    shopStock: null,
    shopLevel: -1,
    rewardQueue: [],
    saveTimer: 0,
    zoneId: 'plains',
    zoneClock: 0,
    prompt: null,
    interactTarget: null,
    lastShrine: "Sanctuaire d'Aurore",
    introShown: false,
    discovery: null,
    discoveryClock: 0,

    /* ----------------------------------------------------------
       Démarrage
       ---------------------------------------------------------- */
    init() {
      this.input = new U.Input();
      this.world = new window.World(20260214);
      UI.init(this);
      window.Game = this;

      this.resize();
      window.addEventListener('resize', () => this.resize());

      this.onAnyInput = function () {
        if (!window.AudioSys.ready) window.AudioSys.init();
      };
      window.AudioSys.setTheme('title');
      FX.setWeather('plains');

      this.state = 'title';
      this.paused = false;
      UI.open('title');

      this.last = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    },

    resize() {
      const s = Math.max(0.35, Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H));
      const snapped = Math.floor(s * 40) / 40;
      stage.style.transform = 'scale(' + snapped + ')';
    },

    loop(ts) {
      let dt = (ts - this.last) / 1000;
      this.last = ts;
      if (!isFinite(dt) || dt < 0) dt = 0;
      dt = Math.min(0.05, dt);
      this.update(dt);
      this.draw();
      window.AudioSys.updateMusic();
      requestAnimationFrame((t) => this.loop(t));
    },

    /* ----------------------------------------------------------
       Toast & secousses
       ---------------------------------------------------------- */
    toast(text, color) {
      UI.toast(text, color);
    },

    shake(n) {
      this.shakeMag = Math.max(this.shakeMag, n || 4);
      this.shakeTime = Math.max(this.shakeTime, 0.34);
    },

    /* ----------------------------------------------------------
       Boucle
       ---------------------------------------------------------- */
    update(dt) {
      this.time += dt;
      UI.update(dt);

      // Synchronise les fonds titre / éditeur avec les écrans DOM
      if (this.state === 'title' && UI.modal === 'editor') this.state = 'editor';
      else if (this.state === 'editor' && UI.modal === 'title') this.state = 'title';
      if (this.state === 'victory' && !UI.isOpen()) {
        this.state = 'playing';
        this.paused = false;
        window.AudioSys.setTheme(this.zoneId, false);
      }

      FX.update(dt, this);
      this.updateInput();

      if (this.state === 'playing' && !this.paused) this.updatePlaying(dt);

      this.updateCamera(dt);
      this.updateShake(dt);

      if (this.saveTimer > 0) {
        this.saveTimer -= dt;
        if (this.saveTimer <= 0) {
          this.saveTimer = 0;
          this.save();
        }
      }

      this.processScheduled();
      this.input.endFrame();
    },

    updateInput() {
      const pressed = Array.from(this.input.pressed);

      if (pressed.includes('KeyN')) {
        const muted = window.AudioSys.toggleMuted();
        this.toast(muted ? 'Musique coupée' : 'Musique activée', '#c5ced8');
      }

      if (this.state === 'title' || this.state === 'editor') return;

      if (UI.isOpen()) {
        for (const code of pressed) {
          if (code === 'KeyN') continue;
          UI.handleKey(code);
          break;
        }
        return;
      }

      if (this.state !== 'playing') return;

      for (const code of pressed) {
        if (code === 'Escape') {
          this.prompt = null;
          UI.open('pause');
          break;
        }
        if (code === 'KeyI' || code === 'Tab') {
          this.prompt = null;
          UI.open('inventory', { from: null });
          break;
        }
        if (code === 'KeyM') {
          this.prompt = null;
          UI.open('map');
          break;
        }
      }
    },

    updatePlaying(dt) {
      this.updateInteractTarget();
      this.player.update(dt, this);
      if (this.state !== 'playing' || this.paused) return;

      this.updateEnemies(dt);
      this.updateBoss(dt);
      this.updateProjectiles(dt);
      this.updateArenas(dt);
      this.updateZone(dt);
      this.updateDiscovery(dt);
      this.updateInteractTarget();
    },

    updateCamera(dt) {
      if (!this.player) return;
      let lookX = 0, lookY = 0;
      if (this.state === 'playing' && !this.paused && !UI.isOpen()) {
        const aim = this.getAimWorld();
        lookX = U.clamp((aim.x - this.player.x) * 0.08, -26, 26);
        lookY = U.clamp((aim.y - this.player.y) * 0.06, -18, 18);
      }
      const tx = U.clamp(this.player.x - VIEW_W / 2 + lookX, 0, WORLD_PX - VIEW_W);
      const ty = U.clamp(this.player.y - VIEW_H / 2 + lookY, 0, WORLD_PX - VIEW_H);
      const k = 1 - Math.pow(0.0008, dt);
      this.camX += (tx - this.camX) * k;
      this.camY += (ty - this.camY) * k;
    },

    snapCamera() {
      if (!this.player) return;
      this.camX = U.clamp(this.player.x - VIEW_W / 2, 0, WORLD_PX - VIEW_W);
      this.camY = U.clamp(this.player.y - VIEW_H / 2, 0, WORLD_PX - VIEW_H);
    },

    updateShake(dt) {
      if (this.shakeTime <= 0) {
        this.shakeX = this.shakeY = 0;
        return;
      }
      this.shakeTime -= dt;
      const k = Math.max(0, this.shakeTime / 0.34);
      const m = this.shakeMag * k;
      this.shakeX = (Math.random() * 2 - 1) * m;
      this.shakeY = (Math.random() * 2 - 1) * m;
      if (this.shakeTime <= 0) {
        this.shakeMag = 0;
        this.shakeX = this.shakeY = 0;
      }
    },

    getAimWorld() {
      if (!this.player) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const inside = this.input.mouse.inside && rect.width > 0 && rect.height > 0;
      if (!inside) {
        const f = [[0, 1], [-1, 0], [1, 0], [0, -1]][this.player.facing] || [0, 1];
        return { x: this.player.x + f[0] * 44, y: this.player.y - 12 + f[1] * 44 };
      }
      const mx = this.input.mouse.x * (VIEW_W / rect.width);
      const my = this.input.mouse.y * (VIEW_H / rect.height);
      return { x: mx + this.camX, y: my + this.camY };
    },

    /* ----------------------------------------------------------
       Entités & combat
       ---------------------------------------------------------- */
    getTargets() {
      const out = [];
      if (this.activeBoss && !this.activeBoss.dead) out.push(this.activeBoss);
      const px = this.player ? this.player.x : 0, py = this.player ? this.player.y : 0;
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (Math.abs(e.x - px) > 900 || Math.abs(e.y - py) > 700) continue;
        out.push(e);
      }
      return out;
    },

    performPlayerMelee(p, ang, style, power, crit) {
      const reach = style.reach || 30, arc = style.arc || 1.7;
      for (const t of this.getTargets()) {
        if (t.dead) continue;
        const bodyY = t.kind === 'boss'
          ? t.sprite.h * t.scale * 0.38
          : (t.sprite ? t.sprite.h * 0.45 : 8);
        const dx = t.x - p.x;
        const dy = (t.y - bodyY) - (p.y - 12);
        const dist = Math.hypot(dx, dy);
        const rad = t.hitRadius || 10;
        if (dist > reach + rad) continue;
        if (dist > 18) {
          const ta = Math.atan2(dy, dx);
          if (Math.abs(U.angleDiff(ta, ang)) > arc / 2 + 0.24) continue;
        }
        t.takeDamage(power, this, crit);
      }
    },

    spawnProjectile(o) {
      this.projectiles.push(new Entities.Projectile(o));
      if (this.projectiles.length > 90) this.projectiles.splice(0, this.projectiles.length - 90);
    },

    spawnMinion(spawn, boss) {
      let summoned = 0;
      for (const e of this.enemies) if (e.summoned && !e.dead) summoned++;
      if (summoned >= 10) return;
      const e = new Entities.Enemy(spawn, { summoned: true });
      e.sourceBoss = boss || null;
      this.enemies.push(e);
      this.fx.ring(spawn.x, spawn.y - 8, '#c891ff', 20, 0.5);
      this.fx.burst(spawn.x, spawn.y - 10, '#c891ff', 10, 80);
    },

    updateEnemies(dt) {
      const p = this.player;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.dead) {
          if (!e.summoned) {
            if (this.time >= e.respawnAt) {
              this.enemies[i] = new Entities.Enemy(e.spawn);
            }
          } else {
            if (!e.deadAt) e.deadAt = this.time;
            if (this.time - e.deadAt > 5) {
              this.enemies.splice(i, 1);
              i--;
            }
          }
          continue;
        }
        if (Math.abs(e.x - p.x) > 780 || Math.abs(e.y - p.y) > 640) continue;
        e.update(dt, this);
      }
    },

    updateBoss(dt) {
      const boss = this.activeBoss;
      if (!boss) return;
      if (boss.dead) {
        if (this.time >= this.bossCleanupAt) {
          this.activeBoss = null;
          this.activeArena = null;
          this.setBossMusic(false);
        }
        return;
      }
      if (this.activeArena) {
        const d = U.dist(this.player.x, this.player.y, this.activeArena.x, this.activeArena.y);
        if (d > this.activeArena.radiusPx * 2.05) {
          this.leaveArena();
          return;
        }
      }
      boss.update(dt, this);
    },

    updateProjectiles(dt) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.update(dt, this);
        if (p.dead) this.projectiles.splice(i, 1);
      }
    },

    updateArenas(dt) {
      if (this.activeBoss) return;
      const p = this.player;
      for (const a of this.world.arenas) {
        if (a.defeated) continue;
        if (U.dist(p.x, p.y, a.x, a.y) < a.radiusPx * 0.72) {
          this.activateArena(a);
          break;
        }
      }
    },

    updateZone(dt) {
      this.zoneClock -= dt;
      if (this.zoneClock > 0) return;
      this.zoneClock = 0.45;
      const z = this.currentZone();
      if (z.id !== this.zoneId) {
        this.zoneId = z.id;
        UI.showBanner(z.name.toUpperCase(), z.short + ' · Nv ' + z.levelMin + '-' + z.levelMax, z.color);
        window.AudioSys.setTheme(z.id, !!this.activeBoss);
        FX.setWeather(z.id);
        this.saveSoon();
      }
    },

    activateArena(arena) {
      if (this.activeBoss || arena.defeated) return;
      this.activeArena = arena;
      const boss = new Entities.Boss(arena, this);
      const factor = arena.kind === 'mini' ? 0.5 : arena.kind === 'big' ? 0.48 : 0.42;
      boss.maxHp = Math.max(80, Math.round(boss.maxHp * factor));
      boss.hp = boss.maxHp;
      boss.dmg *= 0.92;
      this.activeBoss = boss;
      this.shake(7);
      window.AudioSys.sfx('bossRoar');
      UI.showBanner(boss.def.name.toUpperCase(), boss.def.title.toUpperCase(), boss.def.colors.eye || '#ffd76a');
      this.setBossMusic(true);
      this.saveSoon();
    },

    startFinalBoss() {
      if (this.finalFight || this.world.finalArena.defeated) return;
      const arena = this.world.finalArena;
      for (let yy = arena.ty - 2; yy <= arena.ty + 2; yy++) {
        for (let xx = arena.tx - 2; xx <= arena.tx + 2; xx++) {
          if (xx >= 0 && yy >= 0 && xx < D.WORLD_SIZE && yy < D.WORLD_SIZE) {
            this.world.blocked[yy * D.WORLD_SIZE + xx] = 0;
          }
        }
      }
      if (this.world.monolith) this.world.monolith.hidden = true;
      this.finalFight = true;
      const boss = new Entities.Boss(arena, this);
      boss.x = arena.x;
      boss.y = arena.y - 66;
      boss.homeX = boss.x;
      boss.homeY = boss.y;
      boss.maxHp = Math.max(400, Math.round(boss.maxHp * 0.42));
      boss.hp = boss.maxHp;
      boss.dmg *= 0.92;
      this.activeBoss = boss;
      this.activeArena = arena;
      this.bossCleanupAt = 0;
      this.projectiles.length = 0;
      this.clearSummons();
      this.shake(12);
      window.AudioSys.sfx('bossRoar');
      UI.showBanner("NYX", "LE SOUVERAIN DE L'OMBRE", '#c891ff');
      window.AudioSys.setTheme('final', true);
      this.saveSoon();
    },

    leaveArena() {
      const final = this.finalFight;
      this.activeBoss = null;
      this.activeArena = null;
      this.projectiles = this.projectiles.filter(p => p.friendly);
      this.setBossMusic(false);
      this.fx.ring(this.player.x, this.player.y - 10, '#c5ced8', 26, 0.4);
      if (final) {
        this.finalFight = false;
        if (this.world.monolith) this.world.monolith.hidden = false;
      }
      this.toast('Vous avez quitté l\'arène. Le gardien reprend des forces.', '#c5ced8');
    },

    clearSummons() {
      this.enemies = this.enemies.filter(e => !e.summoned);
    },

    setBossMusic(on) {
      const theme = this.finalFight ? 'final' : this.zoneId;
      window.AudioSys.setTheme(theme, !!on);
    },

    onEnemyKilled(enemy) {
      const lvl = enemy.level;
      const xp = Math.round((7 + lvl * 6.4) * (enemy.elite ? 2.2 : 1) * (enemy.summoned ? 0.3 : 1));
      this.player.gainXp(xp, this);
      const gold = Math.round((2 + lvl * 1.45) * (enemy.elite ? 2.5 : 1) * (enemy.summoned ? 0 : 1));
      if (gold > 0) {
        this.player.gold += gold;
        this.fx.burst(enemy.x, enemy.y - 10, '#ffd76a', 5, 60);
      }
      this.player.kills++;
      if (!enemy.summoned) {
        const r = Math.random();
        if (r < 0.035) {
          this.player.addPotion('potion', 1);
          this.toast('Potion trouvée !', '#ffb0c0');
        } else if (r < 0.16) {
          this.player.addPotion('petite', 1);
        }
        if (enemy.elite) this.toast('ÉLITE VAINCU  +' + xp + ' XP', '#ffd76a');
      }
      this.saveSoon();
    },

    onBossKilled(boss) {
      const def = boss.def, arena = boss.arena;
      arena.defeated = true;
      this.player.gainXp(def.xp, this);
      this.player.gold += def.gold;
      this.player.kills++;
      this.clearSummons();
      this.projectiles = this.projectiles.filter(p => p.friendly);
      this.fx.burst(boss.x, boss.y - 30, '#ffd76a', 40, 180);
      this.fx.ring(boss.x, boss.y - 12, '#ffe6a0', 60, 1);
      this.bossCleanupAt = this.time + 0.85;
      if (def.loot) {
        this.player.addItem(def.loot, this);
        if (def.kind !== 'final') this.rewardQueue.push({ gearId: def.loot, title: 'BUTIN DE BOSS', at: this.time + 1.1 });
      }

      if (def.kind === 'final') {
        this.world.finalArena.defeated = true;
        this.finalFight = false;
        this.victoryAt = this.time + 2.6;
        this.save();
        this.setBossMusic(false);
      } else if (def.kind === 'big') {
        const n = this.bigBossesDefeated();
        UI.showBanner(def.name.toUpperCase() + ' VAINCU', 'GARDIEN ' + n + '/6', '#ffd76a');
        if (n >= 6 && !this.sixSealsShown) this.finalUnlockAt = this.time + 2.2;
        this.save();
        this.setBossMusic(false);
      } else {
        UI.showBanner(def.name.toUpperCase() + ' VAINCU', 'MINI-BOSS', '#ffbe5c');
        this.save();
        this.setBossMusic(false);
      }
    },

    onPlayerDeath() {
      if (this.state !== 'playing') return;
      this.state = 'dead';
      this.paused = true;
      this.activeBoss = null;
      this.activeArena = null;
      this.projectiles.length = 0;
      if (this.finalFight) {
        this.finalFight = false;
        if (this.world.monolith) this.world.monolith.hidden = false;
      }
      this.fx.burst(this.player.x, this.player.y - 12, '#ff8c8c', 30, 160);
      window.AudioSys.sfx('death');
      UI.open('death');
    },

    respawnPlayer() {
      const p = this.player;
      p.gold = Math.floor(p.gold * 0.8);
      p.hp = p.maxHp;
      p.stamina = p.maxStamina;
      p.invuln = 3;
      p.dodgeTimer = 0;
      p.potionCd = 0;
      let sx = p.lastSafe ? p.lastSafe.x : this.world.playerSpawn.x;
      let sy = p.lastSafe ? p.lastSafe.y : this.world.playerSpawn.y;
      if (!this.world.canStandAt(sx, sy, 10, 8)) {
        const s = this.world.playerSpawn;
        sx = s.x; sy = s.y;
      }
      p.x = sx; p.y = sy;
      this.enemies = this.enemies.filter(e => !e.summoned);
      this.projectiles.length = 0;
      this.activeBoss = null;
      this.activeArena = null;
      this.finalFight = false;
      if (this.world.monolith) this.world.monolith.hidden = this.world.finalArena.defeated;
      this.state = 'playing';
      this.paused = false;
      if (UI.isOpen()) UI.close({ silent: true });
      this.snapCamera();
      this.zoneId = this.currentZone().id;
      FX.setWeather(this.zoneId);
      window.AudioSys.setTheme(this.zoneId, false);
      UI.showBanner('RENAISSANCE', this.lastShrine, '#8fe6e0');
      this.save();
    },

    /* ----------------------------------------------------------
       Progression, boutique, sauvegarde
       ---------------------------------------------------------- */
    currentZone() {
      if (!this.player) return D.ZONES[0];
      const idx = this.world.biomeAtPx(this.player.x, this.player.y);
      return D.ZONES[idx] || D.ZONES[0];
    },

    /* ----------------------------------------------------------
       Exploration : les lieux se révèlent quand on s'en approche
       ---------------------------------------------------------- */
    freshDiscovery() {
      return { zones: { plains: true }, pois: { village: true } };
    },

    loadDiscovery(data) {
      const base = this.freshDiscovery();
      if (data && data.zones) {
        for (const id of Object.keys(data.zones)) {
          if (data.zones[id] && D.ZONE_BY_ID[id]) base.zones[id] = true;
        }
      }
      if (data && data.pois) {
        for (const key of Object.keys(data.pois)) {
          if (data.pois[key]) base.pois[key] = true;
        }
      }
      base.zones.plains = true;
      return base;
    },

    isDiscovered(kind, id) {
      if (!this.discovery) this.discovery = this.freshDiscovery();
      return !!this.discovery.pois[kind + ':' + id];
    },

    reveal(kind, id, label, x, y, color) {
      const key = kind + ':' + id;
      if (!this.discovery) this.discovery = this.freshDiscovery();
      if (this.discovery.pois[key]) return false;
      this.discovery.pois[key] = true;
      this.toast('DÉCOUVERT · ' + label, color || '#ffe6a0');
      if (this.player) this.fx.ring(this.player.x, this.player.y - 10, color || '#ffe6a0', 28, 0.55);
      if (kind === 'final') window.AudioSys.sfx('warp');
      this.saveSoon();
      return true;
    },

    getExploration() {
      const d = this.discovery || this.freshDiscovery();
      const zones = D.ZONES.filter(z => d.zones[z.id]).length;
      const outposts = D.OUTPOSTS.filter(o => d.pois['outpost:' + o.id]).length;
      const shrines = D.SHRINES.filter(s => d.pois['shrine:' + s.id]).length;
      const arenaTotal = D.ZONES.reduce((n, z) => n + z.arenas.length, 0);
      const arenas = D.ZONES.reduce((n, z) => n + z.arenas.filter(a => d.pois['arena:' + a.id]).length, 0);
      const final = d.pois['final'] ? 1 : 0;
      const total = D.ZONES.length + D.OUTPOSTS.length + D.SHRINES.length + arenaTotal + 1;
      const found = zones + outposts + shrines + arenas + final;
      return {
        pct: Math.round(found / total * 100),
        found, total,
        zones, zonesTotal: D.ZONES.length,
        outposts, outpostsTotal: D.OUTPOSTS.length,
        shrines, shrinesTotal: D.SHRINES.length,
        arenas, arenasTotal: arenaTotal,
        final: !!final
      };
    },

    updateDiscovery(dt) {
      if (!this.player) return;
      this.discoveryClock -= dt;
      if (this.discoveryClock > 0) return;
      this.discoveryClock = 0.45;
      if (!this.discovery) this.discovery = this.freshDiscovery();
      const p = this.player;
      const zone = this.currentZone();
      if (!this.discovery.zones[zone.id]) {
        this.discovery.zones[zone.id] = true;
        this.toast('CARTE · ' + zone.name + ' révélée', zone.color);
        this.saveSoon();
      }
      for (const o of this.world.outposts) {
        if (U.dist(p.x, p.y, o.x, o.y) < 14 * TILE) {
          this.reveal('outpost', o.id, 'Avant-poste : ' + o.name, o.x, o.y, '#8ef0a8');
        }
      }
      for (const s of this.world.shrines) {
        if (U.dist(p.x, p.y, s.x, s.y) < 12 * TILE) {
          this.reveal('shrine', s.id, 'Sanctuaire : ' + s.name, s.x, s.y, '#8fe6e0');
        }
      }
      for (const a of this.world.arenas) {
        if (U.dist(p.x, p.y, a.x, a.y) < a.radiusPx + 5 * TILE) {
          const label = a.kind === 'big' ? 'Arène d\'un Gardien' : 'Arène ancienne';
          this.reveal('arena', a.id, label + ' · ' + a.zone.short, a.x, a.y, '#ffbe5c');
        }
      }
      const f = this.world.finalArena;
      if (U.dist(p.x, p.y, f.x, f.y) < 18 * TILE) {
        this.reveal('final', 'final', 'Ruines de l\'Aube', f.x, f.y, '#c891ff');
      }
    },

    bigBossesDefeated() {
      if (!this.world) return 0;
      return this.world.arenas.filter(a => a.defeated && a.kind === 'big').length;
    },

    getShopStock() {
      const p = this.player;
      if (!p) return [];
      const tier = U.clamp(Math.floor((p.level - 1) / 4), 0, 5);
      if (!this.shopStock || this.shopLevel !== tier) {
        this.shopLevel = tier;
        const stock = [];
        stock.push({ type: 'potion', id: 'petite', price: D.POTIONS.petite.price });
        stock.push({ type: 'potion', id: 'potion', price: D.POTIONS.potion.price });
        if (p.level >= 6) stock.push({ type: 'potion', id: 'elixir', price: D.POTIONS.elixir.price });
        const rng = U.mulberry32(9001 + tier * 733);
        const pool = D.GEAR.filter(g => {
          if (g.rarity === 'legendary') return false;
          if (D.STARTING_GEAR.includes(g.id)) return false;
          if (g.req > p.level + 7) return false;
          return g.tier >= Math.max(0, tier - 1) && g.tier <= Math.min(5, tier + 1);
        });
        U.shuffle(rng, pool);
        const chosen = pool.slice(0, 6);
        // une pièce plus ambitieuse pour donner envie d'économiser
        const stretch = D.GEAR.find(g => g.tier === Math.min(5, tier + 1) && g.req <= p.level + 9 && !D.STARTING_GEAR.includes(g.id) && g.rarity !== 'legendary' && !chosen.includes(g));
        if (stretch) chosen.push(stretch);
        for (const g of chosen) {
          const rm = { common: 1, uncommon: 1.35, rare: 2.1, epic: 3.2 }[g.rarity] || 1;
          const price = Math.round((32 + g.tier * 92 + g.req * 13) * rm / 5) * 5;
          stock.push({ type: 'gear', id: g.id, price });
        }
        this.shopStock = stock;
      }
      return this.shopStock;
    },

    saveSoon() {
      if (this.saveTimer > 0) return;
      this.saveTimer = 0.9;
    },

    save() {
      if (!this.player || !this.world) return false;
      const defeated = {};
      this.world.arenas.forEach(a => { defeated[a.id] = !!a.defeated; });
      defeated.final = !!this.world.finalArena.defeated;
      const chests = {};
      this.world.chests.forEach(c => { if (c.opened) chests[c.id] = true; });
      const data = {
        version: 1,
        date: Date.now(),
        zone: this.currentZone().id,
        player: this.player.serialize(),
        bosses: defeated,
        chests,
        lastSafe: this.player.lastSafe,
        lastShrine: this.lastShrine,
        shopStock: this.shopStock,
        shopLevel: this.shopLevel
      };
      return U.storage.set(D.SAVE_KEY, data);
    },

    hasSave() {
      return !!this.getSaveSummary();
    },

    getSaveSummary() {
      const data = U.storage.get(D.SAVE_KEY, null);
      if (!data || !data.player) return null;
      const zone = D.ZONE_BY_ID[data.zone];
      return {
        level: data.player.level || 1,
        zone: zone ? zone.name : 'Aurore',
        playTime: data.player.playTime || 0,
        name: data.player.name || 'Aurore'
      };
    },

    loadGame() {
      const data = U.storage.get(D.SAVE_KEY, null);
      if (!data || !data.player) return false;
      if (UI.isOpen()) UI.close({ silent: true });

      this.world.serializeBossStates(data.bosses || {});
      this.world.chests.forEach(c => {
        c.opened = !!(data.chests && data.chests[c.id]);
        c.img = Art.chest(c.opened);
      });
      this.player = Entities.Player.deserialize(data.player, this.world.playerSpawn);
      this.player.lastSafe = data.lastSafe || { x: this.world.playerSpawn.x, y: this.world.playerSpawn.y };
      this.lastShrine = data.lastShrine || "Sanctuaire d'Aurore";
      if (!this.world.canStandAt(this.player.x, this.player.y, 10, 8)) {
        this.player.x = this.world.playerSpawn.x;
        this.player.y = this.world.playerSpawn.y;
      }
      this.shopStock = Array.isArray(data.shopStock) ? data.shopStock : null;
      this.shopLevel = data.shopLevel !== undefined ? data.shopLevel : -1;
      this.enemies = this.world.spawnPoints.map(sp => new Entities.Enemy(sp));
      this.projectiles = [];
      this.activeBoss = null;
      this.activeArena = null;
      this.rewardQueue = [];
      this.finalFight = false;
      this.victoryAt = 0;
      this.finalUnlockAt = 0;
      this.sixSealsShown = this.bigBossesDefeated() >= 6;
      if (this.world.monolith) this.world.monolith.hidden = this.world.finalArena.defeated;
      this.zoneId = this.currentZone().id;
      this.zoneClock = 0.6;
      this.state = 'playing';
      this.paused = false;
      this.fx.clear();
      FX.setWeather(this.zoneId);
      window.AudioSys.setTheme(this.zoneId, false);
      this.snapCamera();
      UI.showBanner('PARTIE CHARGÉE', this.currentZone().name, '#ffd76a');
      this.toast('Bon retour, ' + this.player.name + '.', '#ffe6a0');
      return true;
    },

    startRun(editor) {
      editor = editor || {};
      this.world.serializeBossStates({});
      this.world.chests.forEach(c => { c.opened = false; c.img = Art.chest(false); });
      if (this.world.monolith) this.world.monolith.hidden = false;

      const spawn = this.world.playerSpawn;
      this.player = new Entities.Player({
        classId: editor.classId,
        name: editor.name,
        look: editor.look,
        x: spawn.x,
        y: spawn.y
      });
      this.player.lastSafe = { x: spawn.x, y: spawn.y };
      this.lastShrine = "Sanctuaire d'Aurore";
      this.enemies = this.world.spawnPoints.map(sp => new Entities.Enemy(sp));
      this.projectiles = [];
      this.activeBoss = null;
      this.activeArena = null;
      this.rewardQueue = [];
      this.finalFight = false;
      this.victoryAt = 0;
      this.finalUnlockAt = 0;
      this.sixSealsShown = false;
      this.shopStock = null;
      this.shopLevel = -1;
      this.introShown = false;
      this.zoneId = 'plains';
      this.zoneClock = 1;
      this.state = 'playing';
      this.paused = false;
      this.fx.clear();
      FX.setWeather('plains');
      window.AudioSys.setTheme('plains', false);
      this.snapCamera();
      UI.showBanner("PLAINES D'AURORE", 'LE PREMIER MATIN', '#7cc45b');
      this.toast('Bienvenue à Aurore, ' + this.player.name + '.', '#ffe6a0');
      this.save();

      setTimeout(() => {
        if (this.state === 'playing' && !this.paused) this.showIntro();
      }, 420);
    },

    showIntro() {
      if (this.introShown || !this.player) return;
      this.introShown = true;
      const aldric = this.world.npcs.find(n => n.id === 'aldric');
      UI.showDialogue('Doyen Aldric', D.INTRO, {
        img: aldric ? aldric.img : null,
        onDone: () => {
          this.toast('OBJECTIF : vaincre les six Gardiens', '#ffd76a');
        }
      });
    },

    quitToTitle() {
      if (this.state === 'playing' && this.player && this.player.hp > 0) this.save();
      this.state = 'title';
      this.paused = false;
      this.activeBoss = null;
      this.activeArena = null;
      this.projectiles = [];
      this.rewardQueue = [];
      this.victoryAt = 0;
      this.finalFight = false;
      this.prompt = null;
      if (this.world.monolith) this.world.monolith.hidden = this.world.finalArena.defeated;
      if (UI.isOpen()) UI.close({ silent: true });
      UI.open('title');
      window.AudioSys.setTheme('title', false);
    },

    /* ----------------------------------------------------------
       Interactions
       ---------------------------------------------------------- */
    updateInteractTarget() {
      if (!this.player) { this.prompt = null; this.interactTarget = null; return; }
      const p = this.player;
      let best = null, bestD = 1e9;
      for (const o of this.world.interactables) {
        if (o.kind === 'monolith' && o.hidden) continue;
        const d = U.dist(p.x, p.y, o.x, o.y);
        const range = o.kind === 'monolith' ? 46 : 38;
        if (d < range && d < bestD) { best = o; bestD = d; }
      }
      this.interactTarget = best;
      if (!best) { this.prompt = null; return; }
      let text = 'E  INTERAGIR';
      if (best.kind === 'npc') {
        if (best.role === 'shop') text = 'E  COMMERCER AVEC ' + best.name.toUpperCase();
        else if (best.role === 'smith') text = 'E  FORGER AVEC ' + best.name.toUpperCase();
        else text = 'E  PARLER A ' + best.name.toUpperCase();
      } else if (best.kind === 'shrine') {
        text = 'E  SE REPOSER ET SAUVEGARDER';
      } else if (best.kind === 'chest') {
        text = best.opened ? 'COFFRE VIDE' : 'E  OUVRIR LE COFFRE';
      } else if (best.kind === 'sign') {
        text = 'E  LIRE LE PANNEAU';
      } else if (best.kind === 'monolith') {
        text = this.bigBossesDefeated() >= 6 ? 'E  AFFRONTER NYX' : 'E  EXAMINER LE MONOLITHE';
      }
      this.prompt = text;
    },

    interact() {
      const t = this.interactTarget;
      if (!t) return;
      this.prompt = null;

      if (t.kind === 'npc') {
        if (t.role === 'shop') {
          window.AudioSys.sfx('click');
          UI.open('shop');
          return;
        }
        if (t.role === 'smith') {
          window.AudioSys.sfx('click');
          UI.open('forge');
          return;
        }
        window.AudioSys.sfx('click');
        if (t.id === 'aldric') this.talkAldric(t);
        else this.talkFlavor(t);
        return;
      }

      if (t.kind === 'shrine') { this.restAtShrine(t); return; }
      if (t.kind === 'chest') { this.openChest(t); return; }
      if (t.kind === 'sign') {
        UI.showDialogue('Panneau', t.text || ['...'], { img: t.img });
        return;
      }
      if (t.kind === 'monolith') { this.talkMonolith(t); return; }
    },

    talkAldric(npc) {
      const n = this.bigBossesDefeated();
      let lines;
      if (n === 0) {
        lines = [
          "L'aube est malade, mon enfant. Les sceaux des six terres se fissurent.",
          "Chaque région garde deux mini-boss et un Gardien. Vainquez le Gardien pour briser son sceau.",
          "Commencez par les Plaines, autour du village. Titanos rôde au sud, dans l'arène de pierre.",
          "Les sanctuaires soignent et sauvegardent. Revenez me voir quand un Gardien sera tombé."
        ];
      } else if (n < 6) {
        const left = this.world.arenas.filter(a => a.kind === 'big' && !a.defeated).map(a => a.zone ? a.zone.name : a.name);
        lines = [
          'Vous avez brisé ' + n + ' sceau' + (n > 1 ? 'x' : '') + ' sur six. Les terres respirent un peu mieux.',
          'Il reste : ' + left.join(', ') + '.',
          'Cherchez les arènes de pierre. Les Gardiens y attendent, et leur butin vaut le voyage.',
          'Le monolithe au nord du village ne s\'ouvrira qu\'une fois les six Gardiens vaincus.'
        ];
      } else {
        lines = [
          'Les six Gardiens sont tombés. Je sens l\'aube revenir dans mes vieux os.',
          'Le monolithe de Nyx se dresse au nord, au cœur des ruines. Il n\'attend plus que vous.',
          'Prenez vos meilleures armes, des potions, et tout votre courage.',
          'Que la lumière d\'Aurore guide votre lame.'
        ];
      }
      UI.showDialogue(npc.name, lines, { img: npc.img });
    },

    talkFlavor(npc) {
      const lines = {
        timo: [
          'Quand je serai grand, je vaincrai un Gardien ! Enfin... si j\'ai le temps.',
          'Tu as vu les yeux du monolithe ? Moi j\'ai pas peur. Enfin, pas trop.'
        ],
        nora: [
          'Les herbes de la forêt soignent, mais les grenouilles du marais ont mauvais caractère.',
          'Les potions rouges rendent moins de PV que les roses. Lis bien les étiquettes.'
        ],
        garrick: [
          'Le village est calme. Trop calme, depuis que les bêtes montent en niveau.',
          'Si tu sors, garde ton esquive pour les attaques lourdes. Courir droit devant, c\'est pour les héros morts.'
        ]
      };
      UI.showDialogue(npc.name, lines[npc.id] || ['Le vent porte des murmures étranges, ces temps-ci.'], { img: npc.img });
    },

    restAtShrine(shrine) {
      const p = this.player;
      p.hp = p.maxHp;
      p.stamina = p.maxStamina;
      p.potionCd = 0;
      p.lastSafe = { x: p.x, y: p.y };
      this.lastShrine = shrine.name;
      this.fx.heal(p.x, p.y - 18);
      this.fx.ring(p.x, p.y - 10, '#8fe6e0', 30, 0.8);
      window.AudioSys.sfx('save');
      UI.showBanner(shrine.name.toUpperCase(), 'REPOS · SAUVEGARDE', '#8fe6e0');
      this.toast('PV restaurés. Progression sauvegardée.', '#8ef0a8');
      this.save();
    },

    openChest(chest) {
      if (chest.opened) {
        this.toast('Ce coffre est vide.', '#c5ced8');
        window.AudioSys.sfx('error');
        return;
      }
      chest.opened = true;
      chest.img = Art.chest(true);
      this.player.addItem(chest.loot, this);
      window.AudioSys.sfx('chest');
      this.fx.ring(chest.x, chest.y - 8, '#ffd76a', 24, 0.6);
      this.fx.burst(chest.x, chest.y - 10, '#ffd76a', 16, 100);
      this.saveSoon();
      UI.open('reward', {
        gearId: chest.loot,
        title: 'COFFRE ANCIEN',
        onClose: () => {}
      });
    },

    talkMonolith(mono) {
      if (this.world.finalArena.defeated) {
        UI.showDialogue('Monolithe de Nyx', [
          'Le monolithe est froid et silencieux. Une fissure de lumière le traverse de part en part.',
          'L\'aube est revenue. Aurore se souviendra de votre nom.'
        ], { img: mono.img });
        return;
      }
      const n = this.bigBossesDefeated();
      if (n < 6) {
        const left = this.world.arenas.filter(a => a.kind === 'big' && !a.defeated).map(a => a.zone ? a.zone.name : a.name);
        UI.showDialogue('Monolithe de Nyx', [
          'La pierre noire pulse comme un cœur malade. Six sceaux y sont gravés.',
          'Sceaux brisés : ' + n + ' / 6.',
          'Il reste : ' + left.join(', ') + '.',
          'Revenez lorsque les six Gardiens seront tombés.'
        ], { img: mono.img });
        return;
      }
      UI.showDialogue('Monolithe de Nyx', [
        'Les six sceaux se brisent en même temps. Une odeur d\'orage et de cendre s\'échappe de la pierre.',
        'Une silhouette couronnée d\'ombre se dresse derrière le voile : NYX.',
        'Il n\'y aura pas de retraite. Seulement l\'aube, ou la nuit.'
      ], {
        img: mono.img,
        onDone: () => this.startFinalBoss()
      });
    },

    processScheduled() {
      if (this.finalUnlockAt && this.time >= this.finalUnlockAt) {
        this.finalUnlockAt = 0;
        if (!this.sixSealsShown) {
          this.sixSealsShown = true;
          UI.showBanner('LES SIX SCEAUX SONT ROMPUS', 'LE MONOLITHE VOUS ATTEND AU NORD', '#c891ff');
          window.AudioSys.sfx('victory');
        }
      }
      if (this.victoryAt && this.time >= this.victoryAt) {
        this.victoryAt = 0;
        if (this.state === 'playing') this.showVictory();
      }
      if (this.rewardQueue.length && this.state === 'playing' && !this.paused && !UI.isOpen()) {
        const r = this.rewardQueue[0];
        if (this.time >= r.at) {
          this.rewardQueue.shift();
          UI.open('reward', { gearId: r.gearId, title: r.title, onClose: () => {} });
        }
      }
    },

    showVictory() {
      this.state = 'victory';
      this.paused = true;
      window.AudioSys.sfx('victory');
      window.AudioSys.setTheme('title', false);
      UI.open('victory');
      this.save();
    },

    /* ----------------------------------------------------------
       Rendu
       ---------------------------------------------------------- */
    draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);

      if (this.state === 'title') {
        UI.drawTitleArt(ctx, this.time);
        return;
      }
      if (this.state === 'editor') {
        UI.drawEditorBg(ctx, this.time);
        return;
      }
      if (!this.world || !this.player) {
        ctx.fillStyle = '#0d1018';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        return;
      }

      const rcX = U.clamp(Math.round(this.camX + this.shakeX), 0, WORLD_PX - VIEW_W);
      const rcY = U.clamp(Math.round(this.camY + this.shakeY), 0, WORLD_PX - VIEW_H);

      this.world.drawGround(ctx, rcX, rcY, VIEW_W, VIEW_H, this.time);
      this.fx.drawUnder(ctx, rcX, rcY, this.time);

      const drawables = [];
      for (const d of this.world.getVisibleDecor(rcX, rcY, VIEW_W, VIEW_H)) {
        if (!d.img) continue;
        drawables.push({ y: d.y, img: d.img, x: d.x });
      }
      for (const o of this.world.getVisibleInteractables(rcX, rcY, VIEW_W, VIEW_H)) {
        if (o.kind === 'monolith' && o.hidden) continue;
        if (!o.img) continue;
        drawables.push({ y: o.y, img: o.img, x: o.x, interactable: true });
      }
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (e.x < rcX - 100 || e.x > rcX + VIEW_W + 100 || e.y < rcY - 120 || e.y > rcY + VIEW_H + 120) continue;
        drawables.push({ y: e.y, draw: () => e.draw(ctx, rcX, rcY, this.time) });
      }
      if (this.activeBoss && !this.activeBoss.dead) {
        const b = this.activeBoss;
        if (b.x > rcX - 160 && b.x < rcX + VIEW_W + 160 && b.y > rcY - 180 && b.y < rcY + VIEW_H + 180) {
          drawables.push({ y: b.y, draw: () => b.draw(ctx, rcX, rcY, this.time) });
        }
      }
      drawables.push({ y: this.player.y, draw: () => this.player.draw(ctx, rcX, rcY, this.time) });
      drawables.sort((a, b) => a.y - b.y);

      for (const d of drawables) {
        if (d.draw) { d.draw(); continue; }
        const img = d.img;
        ctx.drawImage(img, Math.round(d.x - img.width / 2 - rcX), Math.round(d.y - img.height - rcY));
      }

      for (const p of this.projectiles) p.draw(ctx, rcX, rcY, this.time);
      this.fx.drawOver(ctx, rcX, rcY, this.time);
      this.fx.drawWeather(ctx);

      // marqueur d'interaction
      const t = this.interactTarget;
      if (t && !UI.isOpen() && this.state === 'playing') {
        const bob = Math.sin(this.time * 5) * 2;
        const mx = Math.round(t.x - rcX);
        const my = Math.round(t.y - (t.img ? t.img.height : 12) - 10 + bob - rcY);
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = 'rgba(17,14,23,0.8)';
        ctx.fillRect(mx - 6, my - 5, 12, 12);
        ctx.strokeStyle = '#ffd76a';
        ctx.lineWidth = 1;
        ctx.strokeRect(mx - 5.5, my - 4.5, 11, 11);
        Art.drawText(ctx, 'E', mx, my - 2, '#ffd76a', 1, false, 'center');
        ctx.globalAlpha = 1;
      }

      if (this.state === 'playing') UI.drawHUD(ctx, this);

      // légère vignette d'ambiance
      const vg = ctx.createRadialGradient(320, 180, 210, 320, 180, 390);
      vg.addColorStop(0, 'rgba(8,6,12,0)');
      vg.addColorStop(1, 'rgba(8,6,12,0.34)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  };

  window.Game = Game;
  Game.init();
})();
