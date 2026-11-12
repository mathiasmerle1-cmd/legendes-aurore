/* ============================================================
   LES LÉGENDES D'AURORE — entités, combat, boss, projectiles
   ============================================================ */
(function () {
  'use strict';
  const U = window.U, D = window.DATA, Art = window.Art;

  const FOOT_W = 10, FOOT_H = 8;

  function angleOf(dx, dy) { return Math.atan2(dy, dx); }
  function facingFromAngle(a) {
    const ax = Math.cos(a), ay = Math.sin(a);
    if (Math.abs(ax) > Math.abs(ay)) return ax > 0 ? 2 : 1;
    return ay > 0 ? 0 : 3;
  }

  class Player {
    constructor(opts) {
      this.kind = 'player';
      this.classId = opts.classId || 'epeiste';
      this.cls = D.CLASSES.find(c => c.id === this.classId) || D.CLASSES[0];
      this.name = opts.name || 'Aurore';
      this.originId = opts.origin || 'aurore';
      this.origin = D.ORIGINS.find(o => o.id === this.originId) || D.ORIGINS[0];
      this.look = Object.assign({}, D.DEFAULT_LOOK, opts.look || {});
      this.sheet = Art.playerSheet(this.look);
      this.x = opts.x || 0;
      this.y = opts.y || 0;
      this.level = 1;
      this.xp = 0;
      this.gold = 30;
      this.equipment = Object.assign({ helm: null, boots: null }, D.STARTING[this.classId]);
      this.bag = [];
      this.materials = {};
      this.potions = { petite: 3, potion: 1, elixir: 0 };
      this.upgrades = { weapon: 0, armor: 0, trinket: 0, helm: 0, boots: 0 };
      this.facing = 0;
      this.frame = 0;
      this.walkTime = 0;
      this.moving = false;
      this.attackTimer = 0;
      this.attackAnim = 0;
      this.attackAngle = 0;
      this.dodgeTimer = 0;
      this.dodgeCd = 0;
      this.dodgeVX = 0;
      this.dodgeVY = 0;
      this.invuln = 0;
      this.hitFlash = 0;
      this.potionCd = 0;
      this.stamina = 100;
      this.maxStamina = 100;
      this.kills = 0;
      this.playTime = 0;
      this.lastSafe = { x: this.x, y: this.y };
      this.recalc(true);
    }

    recalc(initial) {
      const w = D.GEAR_BY_ID[this.equipment.weapon];
      const a = D.GEAR_BY_ID[this.equipment.armor];
      const t = D.GEAR_BY_ID[this.equipment.trinket];
      const h = D.GEAR_BY_ID[this.equipment.helm];
      const b = D.GEAR_BY_ID[this.equipment.boots];
      const origin = this.origin || D.ORIGINS[0];
      const slots = [a, t, h, b];
      const sum = (key) => slots.reduce((n, g) => n + ((g && g[key]) || 0), 0);
      const critSum = (w ? (w.crit || 0) : 0) + sum('crit');
      const wDmg = (w ? w.dmg : 1) + this.upgrades.weapon * 2 + (this.level - 1) * 1.25 + this.cls.atk * 1.45;
      this.attackPower = Math.max(1, wDmg);
      this.style = (w && D.ATTACK_STYLES[w.style]) || D.ATTACK_STYLES.slash;
      this.styleId = w ? w.style : 'slash';
      this.def = this.cls.def + (origin.def || 0) + (this.level - 1) * 0.7 + sum('def') +
        this.upgrades.armor * 1.2 + this.upgrades.helm * 0.9 + this.upgrades.boots * 0.6;
      this.maxHp = Math.round(
        this.cls.hp + (origin.hp || 0) + (this.level - 1) * 14 + sum('hp') +
        this.upgrades.trinket * 5 + this.upgrades.helm * 3 + this.upgrades.armor * 2
      );
      this.maxStamina = 100 + (origin.stamina || 0);
      this.crit = U.clamp(this.cls.crit + (origin.crit || 0) + critSum, 0, 0.65);
      this.moveSpeed = (this.cls.spd * 1.42 + sum('spd') * 1.4 + ((t && t.spd) || 0) * 0.5 + ((b && b.spd) || 0) * 0.5) *
        (1 + (origin.spd || 0)) + this.upgrades.boots * 1.5;
      if (initial) this.hp = this.maxHp;
      else if (this.hp > this.maxHp) this.hp = this.maxHp;
      if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
    }

    xpToNext() { return D.LEVEL_XP(this.level); }

    gainXp(amount, game) {
      this.xp += Math.max(1, Math.round(amount));
      let levels = 0;
      while (this.xp >= this.xpToNext() && this.level < 40) {
        this.xp -= this.xpToNext();
        this.level++;
        levels++;
      }
      if (levels > 0) {
        const oldMax = this.maxHp;
        this.recalc(false);
        this.hp = Math.min(this.maxHp, this.hp + Math.round((this.maxHp - oldMax) * 0.5 + this.maxHp * 0.35));
        this.stamina = this.maxStamina;
        if (game) {
          game.fx.levelUp(this.x, this.y);
          game.toast('NIVEAU ' + this.level + ' !', '#ffd96a');
          window.AudioSys.sfx('levelup');
          game.saveSoon();
        }
      }
    }

    addItem(id, game) {
      const g = D.GEAR_BY_ID[id];
      if (!g) return false;
      if (this.bag.includes(id)) this.bag.push(id);
      else this.bag.push(id);
      if (game) game.toast(g.name + ' obtenu !', D.RARITIES[g.rarity].color);
      return true;
    }

    equip(slot, id) {
      const idx = this.bag.indexOf(id);
      if (idx < 0) return false;
      const g = D.GEAR_BY_ID[id];
      if (!g || g.slot !== slot) return false;
      const old = this.equipment[slot];
      this.bag.splice(idx, 1);
      this.equipment[slot] = id;
      if (old) this.bag.push(old);
      this.recalc(false);
      return true;
    }

    unequip(slot) {
      const id = this.equipment[slot];
      if (!id) return false;
      this.equipment[slot] = null;
      this.bag.push(id);
      this.recalc(false);
      return true;
    }

    addPotion(kind, n) {
      this.potions[kind] = (this.potions[kind] || 0) + (n || 1);
    }

    potionKindToUse() {
      const missing = this.maxHp - this.hp;
      if (this.potions.petite > 0 && missing <= this.maxHp * 0.3) return 'petite';
      if (this.potions.potion > 0 && missing <= this.maxHp * 0.55) return 'potion';
      if (this.potions.elixir > 0) return 'elixir';
      if (this.potions.potion > 0) return 'potion';
      if (this.potions.petite > 0) return 'petite';
      return null;
    }

    usePotion(game) {
      if (this.potionCd > 0) return;
      if (this.hp >= this.maxHp && this.potions.petite + this.potions.potion + this.potions.elixir > 0) {
        if (game) game.toast('Vos PV sont déjà au maximum.', '#c5ced8');
        return;
      }
      const kind = this.potionKindToUse();
      if (!kind) {
        if (game) { game.toast('Plus aucune potion !', '#ff9b8e'); window.AudioSys.sfx('error'); }
        return;
      }
      const def = D.POTIONS[kind];
      this.potions[kind]--;
      const healed = Math.round(this.maxHp * def.heal);
      const before = this.hp;
      this.hp = Math.min(this.maxHp, this.hp + healed);
      this.potionCd = 0.75;
      if (game) {
        game.fx.heal(this.x, this.y - 12);
        game.fx.damage(this.x, this.y - 34, '+' + (this.hp - before), '#8ef0a8', true);
      }
      window.AudioSys.sfx('potion');
    }

    attack(game, aimX, aimY) {
      if (this.attackTimer > 0) return;
      const style = this.style;
      this.attackTimer = style.cooldown;
      this.attackAnim = Math.min(0.24, style.cooldown * 0.7);
      const ang = angleOf(aimX - this.x, aimY - (this.y - 12));
      this.attackAngle = ang;
      this.facing = facingFromAngle(ang);
      const crit = Math.random() < this.crit;
      const power = this.attackPower * style.mult * (crit ? 1.75 : 1) * (0.92 + Math.random() * 0.16);
      if (style.melee) {
        game.fx.slash(this.x, this.y - 12, ang, style.reach, style.arc, style.color);
        window.AudioSys.sfx(style.mult > 1.2 ? 'heavy' : 'swing');
        game.performPlayerMelee(this, ang, style, power, crit);
      } else {
        game.spawnProjectile({
          x: this.x, y: this.y - 13,
          angle: ang, speed: style.speed || 300,
          damage: power, crit,
          friendly: true,
          kind: style.projectile || 'arrow',
          color: style.color,
          life: (style.reach || 200) / (style.speed || 300) + 0.15,
          radius: 5
        });
        window.AudioSys.sfx(style.projectile === 'spirit' ? 'magic' : 'arrow');
      }
    }

    tryDodge(game) {
      if (this.dodgeCd > 0 || this.stamina < 24) return;
      const ax = game.input.axis();
      let dx = ax.x, dy = ax.y;
      if (!dx && !dy) {
        const f = [[0, 1], [-1, 0], [1, 0], [0, -1]][this.facing];
        dx = f[0]; dy = f[1];
      }
      const len = Math.hypot(dx, dy) || 1;
      this.dodgeVX = dx / len * 360;
      this.dodgeVY = dy / len * 360;
      this.dodgeTimer = 0.22;
      this.dodgeCd = 0.85;
      this.stamina -= 24;
      this.invuln = Math.max(this.invuln, 0.3);
      window.AudioSys.sfx('dodge');
      game.fx.dust(this.x, this.y, 5);
    }

    takeDamage(raw, game) {
      if (this.invuln > 0 || this.dodgeTimer > 0) return false;
      const dmg = Math.max(1, Math.round(raw - this.def * 0.62));
      this.hp -= dmg;
      this.invuln = 0.72;
      this.hitFlash = 0.3;
      game.fx.damage(this.x, this.y - 36, dmg, '#ff8c8c');
      game.fx.burst(this.x, this.y - 14, '#ffb0a0', 9, 110);
      game.shake(6);
      window.AudioSys.sfx('hurt');
      if (this.hp <= 0) {
        this.hp = 0;
        game.onPlayerDeath();
      }
      return true;
    }

    update(dt, game) {
      this.playTime += dt;
      this.attackTimer = Math.max(0, this.attackTimer - dt);
      this.attackAnim = Math.max(0, this.attackAnim - dt);
      this.dodgeCd = Math.max(0, this.dodgeCd - dt);
      this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
      this.invuln = Math.max(0, this.invuln - dt);
      this.hitFlash = Math.max(0, this.hitFlash - dt);
      this.potionCd = Math.max(0, this.potionCd - dt);
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 26);

      const ax = game.input.axis();
      this.moving = false;

      if (this.dodgeTimer > 0) {
        game.world.moveEntity(this, this.dodgeVX * dt, this.dodgeVY * dt, FOOT_W, FOOT_H);
        this.moving = true;
        this.walkTime += dt * 2;
        if (Math.random() < 0.8) {
          game.fx.afterimage(this.x, this.y, this.facing, this.sheet);
        }
      } else if (ax.x || ax.y) {
        const sp = this.moveSpeed;
        game.world.moveEntity(this, ax.x * sp * dt, ax.y * sp * dt, FOOT_W, FOOT_H);
        this.moving = true;
        this.walkTime += dt;
        this.facing = facingFromAngle(Math.atan2(ax.y, ax.x));
        if (!game.world.isBlockedPx(this.x, this.y)) {
          this.lastSafe.x = this.x;
          this.lastSafe.y = this.y;
        }
      } else {
        this.walkTime = 0;
      }

      if (this.moving) {
        this.frame = [0, 1, 0, 2][Math.floor(this.walkTime * 7) % 4];
      } else {
        this.frame = 0;
      }

      // Actions monde
      if (!game.uiOpen) {
        if (game.input.wasPressed('KeyJ', 'Space', 'Mouse0')) {
          const aim = game.getAimWorld();
          this.attack(game, aim.x, aim.y);
        }
        if (game.input.wasPressed('KeyK', 'ShiftLeft', 'ShiftRight')) this.tryDodge(game);
        if (game.input.wasPressed('KeyH')) this.usePotion(game);
        if (game.input.wasPressed('KeyE', 'Enter')) game.interact();
      }
    }

    drawImage(ctx, img, x, y, alpha, scale) {
      const s = scale || 1;
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, Math.round(x - w / 2), Math.round(y - h + 3 * s), w, h);
    }

    draw(ctx, camX, camY, time) {
      const frames = this.sheet.frames[this.facing] || this.sheet.frames[0];
      const img = frames[this.frame % frames.length] || frames[0];
      const px = this.x - camX, py = this.y - camY;
      // ombre
      ctx.globalAlpha = 0.26;
      ctx.fillStyle = '#17131c';
      ctx.beginPath();
      ctx.ellipse(Math.round(px), Math.round(py - 1), 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // aura d'invulnérabilité
      if (this.dodgeTimer > 0 || this.invuln > 0.45) {
        ctx.globalAlpha = 0.35 + Math.sin(time * 30) * 0.15;
        ctx.strokeStyle = this.dodgeTimer > 0 ? '#9fe8ff' : '#ffe3a0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(px, py - 9, 10, 15, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.save();
      if (this.hitFlash > 0) {
        ctx.globalAlpha = 0.55 + Math.sin(time * 40) * 0.2;
      }
      this.drawImage(ctx, img, px, py);
      ctx.restore();

      // éclat d'attaque
      if (this.attackAnim > 0) {
        const a = this.attackAngle;
        const t = 1 - this.attackAnim / 0.24;
        ctx.save();
        ctx.translate(px, py - 13);
        ctx.rotate(a);
        ctx.globalAlpha = Math.max(0, 1 - t) * 0.8;
        ctx.strokeStyle = this.style.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 17, -0.9 + t * 1.4, 0.4 + t * 1.4);
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }

    serialize() {
      return {
        name: this.name, classId: this.classId, look: this.look,
        level: this.level, xp: this.xp, hp: this.hp, gold: this.gold,
        equipment: this.equipment, bag: this.bag, potions: this.potions,
        upgrades: this.upgrades, x: this.x, y: this.y,
        kills: this.kills, playTime: this.playTime
      };
    }

    static deserialize(data, spawn) {
      const p = new Player({
        classId: data.classId, name: data.name, look: data.look,
        x: data.x || spawn.x, y: data.y || spawn.y
      });
      p.level = data.level || 1;
      p.xp = data.xp || 0;
      p.gold = data.gold || 0;
      p.equipment = Object.assign({}, D.STARTING[p.classId], data.equipment || {});
      p.bag = (data.bag || []).filter(id => D.GEAR_BY_ID[id]);
      p.potions = Object.assign({ petite: 3, potion: 1, elixir: 0 }, data.potions || {});
      p.upgrades = Object.assign({ weapon: 0, armor: 0, trinket: 0 }, data.upgrades || {});
      p.kills = data.kills || 0;
      p.playTime = data.playTime || 0;
      p.recalc(true);
      p.hp = U.clamp(data.hp || p.maxHp, 1, p.maxHp);
      return p;
    }
  }

  /* ============================================================
     Monstres
     ============================================================ */
  class Enemy {
    constructor(spawn, opts) {
      opts = opts || {};
      this.kind = 'enemy';
      this.spawn = spawn;
      this.species = D.SPECIES[spawn.speciesId] || D.SPECIES.slime;
      this.speciesId = spawn.speciesId;
      this.level = spawn.level;
      this.elite = !!spawn.elite && !opts.summoned;
      this.summoned = !!opts.summoned;
      this.id = spawn.id || ('summon_' + Math.random());
      const sprite = Art.getMonster(this.speciesId);
      this.sprite = sprite;
      this.x = spawn.x;
      this.y = spawn.y;
      this.homeX = spawn.x;
      this.homeY = spawn.y;
      this.tx = spawn.tx;
      this.ty = spawn.ty;
      const hpBase = (18 + this.level * 7.5) * this.species.hpMult;
      this.maxHp = Math.round(hpBase * (this.elite ? 1.65 : 1) * (this.summoned ? 0.75 : 1));
      this.hp = this.maxHp;
      this.dmg = (3.2 + this.level * 1.65) * this.species.dmgMult * (this.elite ? 1.22 : 1);
      this.def = this.level * 0.55 + (this.elite ? 2 : 0);
      this.speed = 20 + this.species.speed * 0.62;
      this.aggroRange = this.species.aggro + (this.elite ? 22 : 0);
      this.attackRange = this.species.attackRange;
      this.ranged = this.species.ranged;
      this.state = 'wander';
      this.wanderAngle = Math.random() * Math.PI * 2;
      this.wanderTimer = Math.random() * 2;
      this.attackCd = Math.random() * 0.6;
      this.shootCd = 1 + Math.random();
      this.hurt = 0;
      this.lunge = 0;
      this.dead = false;
      this.respawnAt = 0;
      this.animT = Math.random() * 2;
      this.faceLeft = false;
      this.kbX = 0;
      this.kbY = 0;
      this.aggro = false;
      this.justSpawned = 0.3;
    }

    get hitRadius() { return Math.max(10, this.sprite.w * 0.32) * (this.elite ? 1.1 : 1); }

    takeDamage(amount, game, crit) {
      if (this.dead) return false;
      const dmg = Math.max(1, Math.round(amount - this.def * 0.55));
      this.hp -= dmg;
      this.hurt = 0.14;
      this.aggro = true;
      this.state = 'chase';
      game.fx.damage(this.x, this.y - this.sprite.h - 6, dmg, crit ? '#ffd76a' : '#fff4d8');
      game.fx.burst(this.x, this.y - this.sprite.h * 0.45, crit ? '#ffe08a' : '#ffd3c0', crit ? 11 : 6, 95);
      window.AudioSys.sfx(crit ? 'bossHit' : 'hit');
      if (this.kbX === 0 && this.kbY === 0) {
        const ang = angleOf(this.x - game.player.x, this.y - game.player.y);
        this.kbX = Math.cos(ang) * 90;
        this.kbY = Math.sin(ang) * 90;
      }
      if (this.hp <= 0) {
        this.die(game);
        return true;
      }
      return false;
    }

    die(game) {
      if (this.dead) return;
      this.dead = true;
      this.hp = 0;
      this.respawnAt = game.time + (this.summoned ? 99999 : 24);
      game.fx.burst(this.x, this.y - this.sprite.h * 0.4, this.species.colors ? this.species.colors.body : '#e7d7ac', 18, 130);
      game.fx.ring(this.x, this.y - 6, this.elite ? '#ffd76a' : '#e7d7ac', 24, 0.5);
      window.AudioSys.sfx(this.elite ? 'bossDown' : 'death');
      game.onEnemyKilled(this);
    }

    update(dt, game) {
      if (this.dead) return;
      const p = game.player;
      this.animT += dt;
      this.hurt = Math.max(0, this.hurt - dt);
      this.justSpawned = Math.max(0, this.justSpawned - dt);
      this.attackCd = Math.max(0, this.attackCd - dt);
      this.shootCd = Math.max(0, this.shootCd - dt);
      this.lunge = Math.max(0, this.lunge - dt);

      // knockback
      if (Math.abs(this.kbX) + Math.abs(this.kbY) > 1) {
        game.world.moveEntity(this, this.kbX * dt, this.kbY * dt, FOOT_W, FOOT_H);
        this.kbX *= Math.pow(0.02, dt);
        this.kbY *= Math.pow(0.02, dt);
      }

      const dx = p.x - this.x, dy = p.y - this.y;
      const dist = Math.hypot(dx, dy);
      const homeDist = Math.hypot(this.x - this.homeX, this.y - this.homeY);
      const canSee = dist < this.aggroRange || this.aggro;

      if (canSee && dist < 420) {
        this.aggro = true;
        if (this.ranged) {
          this.updateRanged(dt, game, dist, dx, dy, p);
        } else {
          this.updateMelee(dt, game, dist, dx, dy, p);
        }
      } else {
        this.aggro = false;
        this.state = 'wander';
        this.updateWander(dt, game);
      }

      if (homeDist > 300 && !this.summoned) {
        this.aggro = false;
        this.state = 'return';
        const ang = angleOf(this.homeX - this.x, this.homeY - this.y);
        game.world.moveEntity(this, Math.cos(ang) * this.speed * 1.4 * dt, Math.sin(ang) * this.speed * 1.4 * dt, FOOT_W, FOOT_H);
        this.faceLeft = Math.cos(ang) < 0;
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * dt * 0.25);
        if (homeDist < 8) this.state = 'wander';
      }
      this.faceLeft = dx < 0;
    }

    updateWander(dt, game) {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 1.5 + Math.random() * 2.8;
        this.wanderAngle = Math.random() * Math.PI * 2;
      }
      const sp = this.speed * 0.32;
      const moved = game.world.moveEntity(
        this,
        Math.cos(this.wanderAngle) * sp * dt,
        Math.sin(this.wanderAngle) * sp * dt, FOOT_W, FOOT_H
      );
      if (!moved) this.wanderTimer = 0;
    }

    updateMelee(dt, game, dist, dx, dy, p) {
      const ang = angleOf(dx, dy);
      if (dist > this.attackRange + 8) {
        const sp = this.speed * (this.state === 'chase' ? 1 : 0.85);
        game.world.moveEntity(this, Math.cos(ang) * sp * dt, Math.sin(ang) * sp * dt, FOOT_W, FOOT_H);
        this.state = 'chase';
      } else if (this.attackCd <= 0) {
        this.attackCd = 1.15 + Math.random() * 0.5;
        this.lunge = 0.16;
        p.takeDamage(this.dmg * (this.elite ? 1.25 : 1), game);
      }
    }

    updateRanged(dt, game, dist, dx, dy, p) {
      const ang = angleOf(dx, dy);
      if (dist > this.attackRange + 22) {
        game.world.moveEntity(this, Math.cos(ang) * this.speed * dt, Math.sin(ang) * this.speed * dt, FOOT_W, FOOT_H);
      } else if (dist < 48) {
        game.world.moveEntity(this, -Math.cos(ang) * this.speed * 0.8 * dt, -Math.sin(ang) * this.speed * 0.8 * dt, FOOT_W, FOOT_H);
      }
      if (this.shootCd <= 0 && dist < this.aggroRange + 30) {
        this.shootCd = 1.5 + Math.random() * 0.9;
        game.spawnProjectile({
          x: this.x, y: this.y - this.sprite.h * 0.55,
          vx: Math.cos(ang) * 145, vy: Math.sin(ang) * 145,
          damage: this.dmg * 0.85, friendly: false,
          kind: 'enemy_orb', color: this.species.projectileColor || '#e7a9ff',
          life: 2.2, radius: 4.5, source: this
        });
        window.AudioSys.sfx('magic');
      }
    }

    draw(ctx, camX, camY, time) {
      if (this.dead) return;
      const spr = this.sprite;
      const frames = spr.frames;
      const f = Math.floor(this.animT * (this.state === 'chase' ? 6 : 3)) % frames.length;
      const img = frames[f] || frames[0];
      const bob = spr.float ? Math.sin(time * 2.2 + this.animT) * 2.5 : 0;
      const px = this.x - camX;
      const py = this.y - camY + bob;
      const scale = (this.elite ? 1.12 : 1) * (this.species.scale || 1) * (this.summoned ? 0.82 : 1);
      const w = img.width * scale, h = img.height * scale;

      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#17131c';
      ctx.beginPath();
      ctx.ellipse(Math.round(px), Math.round(this.y - camY - 1), Math.max(5, w * 0.28), 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (this.elite) {
        ctx.globalAlpha = 0.35 + Math.sin(time * 4) * 0.12;
        ctx.strokeStyle = '#ffd76a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(px, this.y - camY - h * 0.4, w * 0.55, h * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.save();
      const sway = this.lunge > 0 ? Math.sin(this.lunge * 60) * 2 : 0;
      if (this.faceLeft) {
        ctx.translate(Math.round(px + w / 2 + sway), Math.round(py - h + 2));
        ctx.scale(-1, 1);
        ctx.drawImage(img, -Math.floor(w / 2 + 1), 0, Math.round(w), Math.round(h));
      } else {
        ctx.drawImage(img, Math.round(px - w / 2 + sway), Math.round(py - h + 2), Math.round(w), Math.round(h));
      }
      ctx.restore();

      if (this.hurt > 0) {
        ctx.globalAlpha = this.hurt * 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(px, py - h * 0.45, w * 0.45, h * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // barre de vie
      if (this.aggro || this.hp < this.maxHp) {
        const bw = Math.max(20, Math.min(38, w * 0.7));
        const bx = Math.round(px - bw / 2), by = Math.round(py - h - 8);
        ctx.fillStyle = 'rgba(20,16,26,0.82)';
        ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
        ctx.fillStyle = '#3c2b33';
        ctx.fillRect(bx, by, bw, 3);
        ctx.fillStyle = this.elite ? '#ffd76a' : '#e2635f';
        ctx.fillRect(bx, by, Math.round(bw * U.clamp(this.hp / this.maxHp, 0, 1)), 3);
        Art.drawText(ctx, 'Nv ' + this.level, px, by - 10, this.elite ? '#ffd76a' : '#f2ead8', 1, true, 'center');
      }
    }
  }

  /* ============================================================
     Boss
     ============================================================ */
  class Boss {
    constructor(arena, game) {
      this.kind = 'boss';
      this.arena = arena;
      this.def = D.BOSSES[arena.bossId];
      this.id = this.def.id;
      this.x = arena.x;
      this.y = arena.y;
      this.sprite = Art.getBossSprite(this.id);
      this.level = this.def.level;
      this.maxHp = Math.round(this.def.hpBase + this.def.hpPerLevel * this.def.level);
      this.hp = this.maxHp;
      this.dmg = (4 + this.level * 2.1) * this.def.dmgMult;
      this.defense = 2 + this.level * 1.15;
      this.speed = this.def.speed * 1.25;
      this.scale = this.def.kind === 'mini' ? 0.9 : this.def.kind === 'big' ? 0.9 : 0.82;
      this.faceLeft = false;
      this.animT = 0;
      this.action = null;
      this.actionCd = 2.2;
      this.contactCd = 1;
      this.hurt = 0;
      this.dead = false;
      this.active = true;
      this.enraged = false;
      this.state = 'intro';
      this.introTimer = 1.4;
      this.shakeDone = false;
      this.deathTimer = 0;
      this.phase2Shown = false;
      this.homeX = arena.x;
      this.homeY = arena.y;
      this.leash = arena.radiusPx * 1.9;
      this.aimAngle = 0;
      this.dashVX = 0;
      this.dashVY = 0;
      this.dashHit = false;
    }

    get hitRadius() {
      return Math.max(20, Math.min(46, this.sprite.w * this.scale * 0.28));
    }

    takeDamage(amount, game, crit) {
      if (this.dead || this.state === 'intro') return false;
      const dmg = Math.max(1, Math.round(amount - this.defense * 0.55));
      this.hp -= dmg;
      this.hurt = 0.16;
      game.fx.damage(this.x, this.y - this.sprite.h * this.scale - 8, dmg, crit ? '#ffd76a' : '#fff4d8');
      game.fx.burst(this.x, this.y - this.sprite.h * this.scale * 0.45, crit ? '#ffe08a' : '#ffd3c0', crit ? 14 : 8, 120);
      window.AudioSys.sfx(crit ? 'bossHit' : 'hit');
      if (!this.enraged && this.hp < this.maxHp * 0.5) {
        this.enraged = true;
        this.speed *= 1.18;
        this.actionCd = Math.min(this.actionCd, 0.8);
        game.toast(this.def.name.toUpperCase() + ' est déchaîné !', '#ff9a7a');
        game.fx.ring(this.x, this.y - 20, this.def.colors.eye, 70, 0.8);
        window.AudioSys.sfx('bossRoar');
        game.shake(9);
      }
      if (this.hp <= 0) {
        this.die(game);
        return true;
      }
      return false;
    }

    die(game) {
      if (this.dead) return;
      this.dead = true;
      this.hp = 0;
      this.state = 'dying';
      this.deathTimer = 1.6;
      game.shake(14);
      window.AudioSys.sfx('bossDown');
      game.player.invuln = Math.max(game.player.invuln, 2);
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          if (game.state === 'playing' || game.state === 'dead' || game.state === 'victory') {
            game.fx.burst(this.x + (Math.random() * 60 - 30), this.y - Math.random() * 40, this.def.colors.eye || '#ffd76a', 16, 150);
          }
        }, i * 120);
      }
      game.onBossKilled(this);
    }

    pickAction(game) {
      const p = game.player;
      const patterns = this.def.patterns;
      let type = patterns[Math.floor(Math.random() * patterns.length)];
      if (this.def.kind === 'final' && this.hp < this.maxHp * 0.5 && Math.random() < 0.3) type = 'volley';
      const dx = p.x - this.x, dy = p.y - this.y;
      const ang = angleOf(dx, dy);
      const action = { type, phase: 'windup', t: 0, maxT: 0.65, ang, hits: 0 };
      if (type === 'charge') {
        action.maxT = 0.72;
        action.ang = ang;
        game.fx.telegraphLine(this.x, this.y - 8, ang, this.arena.radiusPx * 1.6, 30, '#ff9c6b');
      } else if (type === 'slam') {
        action.maxT = 0.9;
        action.tx = p.x;
        action.ty = p.y;
        action.radius = this.def.kind === 'mini' ? 42 : this.def.kind === 'big' ? 54 : 66;
        game.fx.telegraphCircle(action.tx, action.ty, action.radius, 0.9, '#ff8a72');
      } else if (type === 'volley') {
        action.maxT = 0.55;
        action.count = this.def.kind === 'mini' ? 5 : this.def.kind === 'big' ? 7 : 9;
        action.ang = ang;
      } else if (type === 'teleport') {
        action.maxT = 0.42;
      } else if (type === 'summon') {
        action.maxT = 0.7;
      }
      this.action = action;
      window.AudioSys.sfx(type === 'charge' ? 'bossRoar' : 'magic');
    }

    update(dt, game) {
      if (this.dead) {
        this.animT += dt;
        return;
      }
      this.animT += dt;
      this.hurt = Math.max(0, this.hurt - dt);
      this.contactCd = Math.max(0, this.contactCd - dt);
      const p = game.player;

      if (this.state === 'intro') {
        this.introTimer -= dt;
        if (!this.shakeDone && this.introTimer < 1) {
          this.shakeDone = true;
          game.shake(8);
          window.AudioSys.sfx('bossRoar');
        }
        if (this.introTimer <= 0) this.state = 'fight';
        return;
      }

      const dx = p.x - this.x, dy = p.y - this.y;
      const dist = Math.hypot(dx, dy);
      this.faceLeft = dx < 0;

      // hors de l'arène : retour et régénération
      const homeDist = Math.hypot(this.x - this.homeX, this.y - this.homeY);
      if (homeDist > this.leash && !this.action) {
        const ang = angleOf(this.homeX - this.x, this.homeY - this.y);
        game.world.moveEntity(this, Math.cos(ang) * this.speed * 1.4 * dt, Math.sin(ang) * this.speed * 1.4 * dt, 18, 12);
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * dt * 0.1);
        return;
      }

      // contact passif
      if (this.contactCd <= 0 && dist < this.hitRadius + 10 && !this.action) {
        if (p.takeDamage(this.dmg * 0.8, game)) this.contactCd = 1.1;
      }

      if (this.action) {
        this.updateAction(dt, game, dist, dx, dy);
      } else {
        this.actionCd -= dt;
        if (dist > 68) {
          const ang = angleOf(dx, dy);
          game.world.moveEntity(this, Math.cos(ang) * this.speed * dt, Math.sin(ang) * this.speed * dt, 18, 12);
        } else if (Math.random() < dt * 1.5) {
          const ang = angleOf(-dx, -dy);
          game.world.moveEntity(this, Math.cos(ang) * this.speed * 0.5 * dt, Math.sin(ang) * this.speed * 0.5 * dt, 18, 12);
        }
        if (this.actionCd <= 0 && dist < 340) {
          this.pickAction(game);
          this.actionCd = 1.1 + Math.random() * 1.2 - (this.enraged ? 0.35 : 0);
        }
      }
    }

    updateAction(dt, game, dist, dx, dy) {
      const a = this.action;
      const p = game.player;
      a.t += dt;

      if (a.phase === 'windup') {
        if (a.t >= a.maxT) {
          a.t = 0;
          a.phase = 'execute';
          if (a.type === 'charge') {
            this.dashVX = Math.cos(a.ang) * 310;
            this.dashVY = Math.sin(a.ang) * 310;
            this.dashHit = false;
            game.shake(3);
          } else if (a.type === 'slam') {
            this.doSlam(game, a);
            a.phase = 'recover';
            a.maxT = 0.9;
          } else if (a.type === 'volley') {
            this.doVolley(game, a);
            a.phase = 'recover';
            a.maxT = 0.85;
          } else if (a.type === 'teleport') {
            game.fx.burst(this.x, this.y - this.sprite.h * this.scale * 0.4, this.def.colors.eye, 20, 150);
            const ang = Math.random() * Math.PI * 2;
            let nx = p.x + Math.cos(ang) * 95;
            let ny = p.y + Math.sin(ang) * 95;
            nx = U.clamp(nx, this.arena.x - this.arena.radiusPx * 0.8, this.arena.x + this.arena.radiusPx * 0.8);
            ny = U.clamp(ny, this.arena.y - this.arena.radiusPx * 0.8, this.arena.y + this.arena.radiusPx * 0.8);
            if (!game.world.canStandAt(nx, ny, 18, 12)) { nx = p.x - Math.cos(ang) * 80; ny = p.y - Math.sin(ang) * 80; }
            this.x = nx; this.y = ny;
            game.fx.burst(this.x, this.y - this.sprite.h * this.scale * 0.4, this.def.colors.eye, 20, 150);
            window.AudioSys.sfx('warp');
            a.phase = 'recover';
            a.maxT = 0.45;
          } else if (a.type === 'summon') {
            this.doSummon(game);
            a.phase = 'recover';
            a.maxT = 0.9;
          } else {
            a.phase = 'recover';
            a.maxT = 0.6;
          }
        }
      } else if (a.type === 'charge' && a.phase === 'execute') {
        const moved = game.world.moveEntity(this, this.dashVX * dt, this.dashVY * dt, 18, 12);
        if (Math.random() < 0.7) game.fx.dust(this.x, this.y, 1);
        const d = Math.hypot(p.x - this.x, p.y - this.y);
        if (!this.dashHit && d < this.hitRadius + 10) {
          if (p.takeDamage(this.dmg * 1.35, game)) {
            this.dashHit = true;
            game.shake(10);
            const ang = a.ang;
            p.x += Math.cos(ang) * 12;
            p.y += Math.sin(ang) * 12;
          }
        }
        if (!moved || a.t > 0.7) {
          a.phase = 'recover';
          a.maxT = 0.8;
          game.shake(6);
          game.fx.burst(this.x, this.y - 8, '#e7d7ac', 14, 130);
        }
      } else if (a.phase === 'recover') {
        if (a.t >= a.maxT) this.action = null;
      }
    }

    doSlam(game, a) {
      game.shake(12);
      game.fx.ring(a.tx, a.ty, '#ffb08a', a.radius, 0.55);
      game.fx.burst(a.tx, a.ty, '#e7d7ac', 22, 180);
      window.AudioSys.sfx('slam');
      const d = Math.hypot(game.player.x - a.tx, game.player.y - a.ty);
      if (d < a.radius) game.player.takeDamage(this.dmg * 1.25, game);
    }

    doVolley(game, a) {
      const count = a.count;
      const spread = this.def.kind === 'final' ? Math.PI * 2 : Math.PI * 0.9;
      const base = this.def.kind === 'final' ? a.ang : a.ang - spread / 2;
      for (let i = 0; i < count; i++) {
        const ang = this.def.kind === 'final' ? base + i / count * Math.PI * 2 : base + i / (count - 1) * spread;
        game.spawnProjectile({
          x: this.x, y: this.y - this.sprite.h * this.scale * 0.45,
          vx: Math.cos(ang) * (this.def.kind === 'final' ? 150 : 175),
          vy: Math.sin(ang) * (this.def.kind === 'final' ? 150 : 175),
          damage: this.dmg * 0.95, friendly: false,
          kind: 'boss_orb', color: this.def.colors.eye || '#ffb36b',
          life: 3, radius: 7, source: this
        });
      }
      if (this.def.kind === 'final') {
        for (let i = 0; i < 5; i++) {
          const ang = a.ang + (i - 2) * 0.18;
          game.spawnProjectile({
            x: this.x, y: this.y - this.sprite.h * this.scale * 0.45,
            vx: Math.cos(ang) * 210, vy: Math.sin(ang) * 210,
            damage: this.dmg * 0.8, friendly: false,
            kind: 'boss_orb', color: '#d7a5ff', life: 2.6, radius: 6, source: this
          });
        }
      }
      window.AudioSys.sfx('magic');
    }

    doSummon(game) {
      const zone = this.arena.zone || D.ZONE_BY_ID[this.def.biome] || D.ZONES[0];
      const count = this.def.kind === 'final' ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const x = this.x + Math.cos(ang) * 55;
        const y = this.y + Math.sin(ang) * 45;
        if (!game.world.canStandAt(x, y, FOOT_W, FOOT_H)) continue;
        const sp = zone.species[Math.floor(Math.random() * zone.species.length)];
        game.spawnMinion({
          id: 'minion_' + this.id + '_' + i + '_' + Math.floor(game.time * 10),
          x, y, tx: Math.floor(x / 16), ty: Math.floor(y / 16),
          zoneId: zone.id, speciesId: sp, level: Math.max(zone.levelMin, this.level - 5), elite: false
        }, this);
      }
      game.fx.ring(this.x, this.y - 10, this.def.colors.eye, 60, 0.6);
      window.AudioSys.sfx('bossRoar');
    }

    draw(ctx, camX, camY, time) {
      if (this.dead) return;
      const spr = this.sprite;
      const frames = spr.frames;
      const f = Math.floor(this.animT * 3) % frames.length;
      const img = frames[f] || frames[0];
      const bob = spr.float ? Math.sin(time * 1.9) * 4 : 0;
      const scale = this.scale;
      const w = img.width * scale, h = img.height * scale;
      const px = this.x - camX;
      const py = this.y - camY + bob;

      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#121016';
      ctx.beginPath();
      ctx.ellipse(Math.round(px), Math.round(this.y - camY), Math.max(16, w * 0.3), 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (this.enraged) {
        ctx.globalAlpha = 0.22 + Math.sin(time * 5) * 0.1;
        ctx.fillStyle = this.def.colors.eye || '#ff9a7a';
        ctx.beginPath();
        ctx.ellipse(px, py - h * 0.4, w * 0.55, h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (this.state === 'intro') {
        ctx.globalAlpha = 0.35 + (1.4 - this.introTimer) * 0.5;
      }
      ctx.save();
      if (this.faceLeft) {
        ctx.translate(Math.round(px + w / 2), Math.round(py - h + 3));
        ctx.scale(-1, 1);
        ctx.drawImage(img, -Math.round(w / 2), 0, Math.round(w), Math.round(h));
      } else {
        ctx.drawImage(img, Math.round(px - w / 2), Math.round(py - h + 3), Math.round(w), Math.round(h));
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      if (this.hurt > 0) {
        ctx.globalAlpha = this.hurt * 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(px, py - h * 0.45, w * 0.42, h * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  /* ============================================================
     Projectiles
     ============================================================ */
  class Projectile {
    constructor(o) {
      this.x = o.x;
      this.y = o.y;
      this.vx = o.vx !== undefined ? o.vx : Math.cos(o.angle || 0) * (o.speed || 200);
      this.vy = o.vy !== undefined ? o.vy : Math.sin(o.angle || 0) * (o.speed || 200);
      this.damage = o.damage || 1;
      this.crit = !!o.crit;
      this.friendly = !!o.friendly;
      this.kind = o.kind || 'arrow';
      this.color = o.color || '#ffe9a8';
      this.life = o.life || 2;
      this.maxLife = this.life;
      this.radius = o.radius || 4;
      this.source = o.source || null;
      this.dead = false;
      this.trailT = 0;
      this.angle = Math.atan2(this.vy, this.vx);
      this.traveled = 0;
    }

    update(dt, game) {
      if (this.dead) return;
      this.life -= dt;
      if (this.life <= 0) { this.dead = true; return; }
      this.trailT -= dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.traveled += Math.hypot(this.vx, this.vy) * dt;

      if (Math.random() < dt * 26) {
        game.fx.trail(this.x, this.y, this.color, this.friendly ? 2 : 3);
      }

      if (game.world.isBlockedPx(this.x, this.y)) {
        this.dead = true;
        game.fx.burst(this.x, this.y, this.color, 4, 60);
        return;
      }

      if (this.friendly) {
        const targets = game.getTargets();
        for (const t of targets) {
          if (t.dead) continue;
          if (U.dist2(this.x, this.y, t.x, t.y - (t.kind === 'boss' ? t.sprite.h * t.scale * 0.4 : (t.sprite ? t.sprite.h * 0.45 : 8))) < Math.pow(this.radius + t.hitRadius, 2)) {
            t.takeDamage(this.damage, game, this.crit);
            this.dead = true;
            game.fx.burst(this.x, this.y, this.color, 7, 90);
            return;
          }
        }
      } else {
        const p = game.player;
        if (U.dist2(this.x, this.y, p.x, p.y - 12) < Math.pow(this.radius + 8, 2)) {
          if (p.takeDamage(this.damage, game)) {
            this.dead = true;
            game.fx.burst(this.x, this.y, this.color, 7, 90);
          }
        }
      }
    }

    draw(ctx, camX, camY, time) {
      if (this.dead) return;
      const x = this.x - camX, y = this.y - camY;
      if (this.kind === 'arrow' || this.kind === 'bolt' || this.kind === 'needle') {
        const len = this.kind === 'bolt' ? 12 : this.kind === 'needle' ? 8 : 11;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#5c4028';
        ctx.fillRect(-len, -1, len, 2);
        ctx.fillStyle = this.color;
        ctx.fillRect(len - 4, -1, 5, 2);
        ctx.fillStyle = '#f4efd8';
        ctx.fillRect(-len - 3, -2, 4, 1);
        ctx.fillRect(-len - 3, 1, 4, 1);
        ctx.restore();
      } else if (this.kind === 'spirit') {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(x, y, this.radius + 4 + Math.sin(time * 20) * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(x, y, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff6e8';
        ctx.fillRect(x - 1, y - 1, 2, 2);
      } else {
        const r = this.radius + (this.kind === 'boss_orb' ? 2 : 0);
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff6e8';
        ctx.beginPath(); ctx.arc(x - 1, y - 1, Math.max(1, r * 0.45), 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  window.Entities = { Player, Enemy, Boss, Projectile, FOOT_W, FOOT_H };
})();
