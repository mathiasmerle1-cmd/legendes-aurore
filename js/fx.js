/* ============================================================
   LES LÉGENDES D'AURORE — effets, particules, ambiances
   ============================================================ */
(function () {
  'use strict';
  const U = window.U, Art = window.Art;

  const MAX_FX = 420;
  const MAX_PART = 520;
  const MAX_AMBIENT = 360;

  const WEATHER = {
    plains: { count: 26, colors: ['#ffe7a1', '#fff4cf', '#d8ed9a'], vy: -4, vx: 8, size: 1 },
    forest: { count: 34, colors: ['#8fc06a', '#c8d96b', '#6c9a56'], vy: 13, vx: -9, size: 1 },
    desert: { count: 32, colors: ['#f0d79a', '#dcc184', '#fff0c8'], vy: 3, vx: 32, size: 1 },
    swamp: { count: 30, colors: ['#9fdcb4', '#c7e89b', '#7fb2a4'], vy: 5, vx: -3, size: 1 },
    tundra: { count: 76, colors: ['#ffffff', '#dff6ff', '#bce6f4'], vy: 20, vx: -7, size: 2 },
    volcano: { count: 48, colors: ['#ffb45d', '#ff7c49', '#7a6a66'], vy: 9, vx: 5, size: 1 }
  };

  /* Ambiance colorée de chaque terre : lumière, ombre et vignette. */
  const GRADE = {
    plains: { light: 'rgba(255, 232, 160, 0.11)', shade: 'rgba(38, 66, 106, 0.15)', vig: '18, 14, 8', va: 0.3 },
    forest: { light: 'rgba(152, 222, 150, 0.08)', shade: 'rgba(8, 36, 26, 0.22)', vig: '4, 18, 12', va: 0.42 },
    desert: { light: 'rgba(255, 214, 130, 0.16)', shade: 'rgba(88, 54, 92, 0.1)', vig: '46, 28, 14', va: 0.28 },
    swamp: { light: 'rgba(150, 190, 120, 0.06)', shade: 'rgba(14, 44, 36, 0.24)', vig: '6, 20, 16', va: 0.46 },
    tundra: { light: 'rgba(200, 240, 255, 0.13)', shade: 'rgba(32, 62, 102, 0.17)', vig: '14, 30, 48', va: 0.34 },
    volcano: { light: 'rgba(255, 158, 86, 0.13)', shade: 'rgba(48, 14, 18, 0.24)', vig: '30, 8, 10', va: 0.47 }
  };

  let cloudTex = null;

  /* Texture de nuages raccordable : les taches sont répétées sur les bords
     pour éviter les coutures quand on la fait défiler. */
  function buildCloudTexture() {
    const W = 240, H = 135;
    const c = U.makeCanvas(W, H);
    const ctx = c.getContext('2d');
    const rng = U.mulberry32(987654321);
    for (let i = 0; i < 10; i++) {
      const x = rng() * W, y = rng() * H;
      const r = 20 + rng() * 42;
      const a = 0.06 + rng() * 0.07;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          ctx.save();
          ctx.translate(dx * W, dy * H);
          const g = ctx.createRadialGradient(x, y, 1, x, y, r);
          g.addColorStop(0, 'rgba(14, 20, 36, ' + a.toFixed(3) + ')');
          g.addColorStop(0.55, 'rgba(14, 20, 36, ' + (a * 0.55).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(14, 20, 36, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
    return c;
  }


  const FX = {
    list: [],
    particles: [],
    ambient: [],
    weather: [],
    weatherZone: null,

    clear() {
      this.list.length = 0;
      this.particles.length = 0;
      this.ambient.length = 0;
    },

    add(o) {
      o.life = o.life || 0.5;
      o.max = o.life;
      this.list.push(o);
      if (this.list.length > MAX_FX) this.list.splice(0, this.list.length - MAX_FX);
      return o;
    },

    particle(o) {
      this.particles.push(o);
      if (this.particles.length > MAX_PART) this.particles.splice(0, this.particles.length - MAX_PART);
      return o;
    },

    /* ----------------------------------------------------------
       Effets demandés par les entités
       ---------------------------------------------------------- */
    damage(x, y, amount, color, heal) {
      const raw = String(amount);
      const text = (heal && !raw.startsWith('+') && !raw.startsWith('-')) ? '+' + raw : raw;
      this.add({
        type: 'damage', x: x + (Math.random() * 12 - 6), y,
        text, color: color || '#fff4d8', life: 0.9, max: 0.9, vy: -34
      });
    },

    burst(x, y, color, count, speed) {
      count = count || 8; speed = speed || 100;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = speed * (0.3 + Math.random() * 0.8);
        this.particle({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20,
          color, size: Math.random() < 0.3 ? 2 : 1,
          life: 0.35 + Math.random() * 0.45, max: 0.8, grav: 160
        });
      }
    },

    trail(x, y, color, size) {
      this.particle({
        x, y, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
        color, size: size || 1, life: 0.24, max: 0.24, grav: 0
      });
    },

    dust(x, y, count, color) {
      for (let i = 0; i < (count || 3); i++) {
        this.particle({
          x: x + (Math.random() * 10 - 5), y: y - 1,
          vx: (Math.random() - 0.5) * 40, vy: -10 - Math.random() * 22,
          color: color || '#cbb98f', size: 1, life: 0.3 + Math.random() * 0.3, max: 0.6, grav: -10
        });
      }
    },

    heal(x, y) {
      for (let i = 0; i < 12; i++) {
        this.particle({
          x: x + (Math.random() * 24 - 12), y: y + (Math.random() * 8 - 4),
          vx: (Math.random() - 0.5) * 18, vy: -18 - Math.random() * 26,
          color: Math.random() < 0.5 ? '#8ef0a8' : '#d8ffe2',
          size: Math.random() < 0.4 ? 2 : 1, life: 0.55 + Math.random() * 0.4, max: 0.95, grav: -12
        });
      }
      this.ring(x, y - 8, '#8ef0a8', 18, 0.45);
    },

    levelUp(x, y) {
      this.ring(x, y - 10, '#ffd96a', 34, 0.9);
      this.add({ type: 'text', x, y: y - 48, text: 'NIVEAU !', color: '#ffd96a', life: 1.2, max: 1.2, vy: -16 });
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * Math.PI * 2;
        this.particle({
          x, y: y - 10, vx: Math.cos(a) * (25 + Math.random() * 65),
          vy: -20 - Math.random() * 80, color: i % 3 ? '#ffd96a' : '#fff3c0',
          size: 1, life: 0.7 + Math.random() * 0.6, max: 1.3, grav: 70
        });
      }
    },

    slash(x, y, ang, reach, arc, color) {
      this.add({
        type: 'slash', x, y, ang, reach: reach || 30, arc: arc || 1.8,
        color: color || '#ffe9a8', life: 0.22, max: 0.22
      });
    },

    ring(x, y, color, radius, life) {
      this.add({ type: 'ring', x, y, color: color || '#ffe9a8', radius: radius || 24, life: life || 0.5, max: life || 0.5 });
    },

    afterimage(x, y, facing, sheet) {
      if (!sheet) return;
      const frames = sheet.frames[String(facing)] || sheet.frames[facing] || sheet.frames[0];
      const img = frames && frames[0];
      if (!img) return;
      this.add({ type: 'afterimage', x, y, img, life: 0.28, max: 0.28 });
    },

    telegraphLine(x, y, ang, len, width, color) {
      this.add({
        type: 'telegraphLine', x, y, ang, len: len || 160, width: width || 26,
        color: color || '#ff8a72', life: 0.95, max: 0.95
      });
    },

    telegraphCircle(x, y, radius, dur, color) {
      this.add({
        type: 'telegraphCircle', x, y, radius: radius || 44,
        color: color || '#ff8a72', life: dur || 0.9, max: dur || 0.9
      });
    },

    /* ----------------------------------------------------------
       Ambiance du monde
       ---------------------------------------------------------- */
    setWeather(zoneId) {
      if (this.weatherZone === zoneId) return;
      this.weatherZone = zoneId;
      this.weather.length = 0;
      const def = WEATHER[zoneId] || WEATHER.plains;
      for (let i = 0; i < def.count; i++) {
        this.weather.push({
          x: Math.random() * 660 - 10, y: Math.random() * 380 - 10,
          vx: def.vx * (0.5 + Math.random()), vy: def.vy * (0.6 + Math.random() * 0.8),
          color: def.colors[Math.floor(Math.random() * def.colors.length)],
          size: def.size, phase: Math.random() * 6.28, rain: zoneId === 'swamp' && i % 3 === 0
        });
      }
    },

    updateAmbient(dt, game) {
      if (!game || !game.world || !game.player) return;
      const world = game.world, p = game.player;
      const camX = game.camX || 0, camY = game.camY || 0;

      // Émissions près de la caméra
      if (game.state === 'playing' && !game.paused) {
        for (const em of world.emitters) {
          if (em.x < camX - 100 || em.x > camX + 740 || em.y < camY - 130 || em.y > camY + 490) continue;
          const rate = Math.max(0.02, em.rate || 0.2);
          if (Math.random() < rate * dt) this.spawnAmbient(em);
        }
      }

      for (let i = this.ambient.length - 1; i >= 0; i--) {
        const a = this.ambient[i];
        a.life -= dt;
        if (a.life <= 0) { this.ambient.splice(i, 1); continue; }
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if (a.kind === 'leaf') {
          a.vx = Math.sin((a.max - a.life) * 2.2 + a.phase) * 13 + (a.baseVX || 0);
          a.vy += 5 * dt;
        } else if (a.kind === 'smoke') {
          a.vx += Math.sin((a.max - a.life) * 1.6 + a.phase) * 4 * dt;
          a.size += dt * 0.8;
        } else if (a.kind === 'spirit') {
          a.vx = Math.sin((a.max - a.life) * 2.4 + a.phase) * 8;
        } else if (a.kind === 'shrine' || a.kind === 'sparkle') {
          a.vx = Math.sin((a.max - a.life) * 3 + a.phase) * 7;
        }
      }
      if (this.ambient.length > MAX_AMBIENT) this.ambient.splice(0, this.ambient.length - MAX_AMBIENT);
    },

    spawnAmbient(em) {
      let kind = em.type, color = em.color, size = 1, life = 3;
      const rx = Math.random() * 22 - 11;
      if (kind === 'leaf') {
        const palette = ['#7fa75a', '#a7bf6d', '#c3c77a', '#6d9052'];
        color = palette[Math.floor(Math.random() * palette.length)];
        life = 4 + Math.random() * 3;
      } else if (kind === 'smoke') {
        color = Math.random() < 0.5 ? '#8b8792' : '#a7a2aa';
        size = 2; life = 2.4 + Math.random() * 1.6;
      } else if (kind === 'sparkle') {
        color = Math.random() < 0.5 ? '#a8f0ff' : '#fff2b0';
        life = 0.8 + Math.random() * 0.9; size = Math.random() < 0.3 ? 2 : 1;
      } else if (kind === 'ember') {
        color = color || (Math.random() < 0.5 ? '#ffb45d' : '#ff7a46');
        life = 1.2 + Math.random() * 1.2;
      } else if (kind === 'spirit') {
        color = color || '#c891ff';
        life = 2.4 + Math.random() * 1.8; size = Math.random() < 0.4 ? 2 : 1;
      } else if (kind === 'shrine') {
        color = Math.random() < 0.5 ? '#8fe6e0' : '#ffe6a0';
        life = 1.6 + Math.random() * 1.8; size = Math.random() < 0.3 ? 2 : 1;
      } else if (kind === 'pollen') {
        color = Math.random() < 0.5 ? '#ffe6a0' : '#fff4ce';
        life = 3 + Math.random() * 3;
      }

      const o = {
        kind, x: em.x + rx, y: em.y + (Math.random() * 12 - 6),
        vx: (Math.random() - 0.5) * 14, vy: -8 - Math.random() * 16,
        color, size, life, max: life, phase: Math.random() * 6.28, baseVX: 4
      };
      if (kind === 'leaf') { o.vx = 8 + Math.random() * 8; o.vy = 4; }
      else if (kind === 'smoke') { o.vx = 2 + Math.random() * 6; o.vy = -13 - Math.random() * 9; }
      else if (kind === 'sparkle') { o.vy = -14 - Math.random() * 20; }
      else if (kind === 'ember') { o.vy = -22 - Math.random() * 26; o.vx = (Math.random() - 0.5) * 20; }
      else if (kind === 'spirit') { o.vy = -9 - Math.random() * 10; }
      else if (kind === 'shrine') { o.vy = -12 - Math.random() * 14; }
      else if (kind === 'pollen') { o.vy = -3 - Math.random() * 7; o.vx = 5 + Math.random() * 8; }
      this.ambient.push(o);
    },

    /* ----------------------------------------------------------
       Mise à jour
       ---------------------------------------------------------- */
    update(dt, game) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const e = this.list[i];
        e.life -= dt;
        if (e.life <= 0) { this.list.splice(i, 1); continue; }
        if (e.type === 'damage' || e.type === 'text') {
          e.y += e.vy * dt;
          e.vy += 22 * dt;
        }
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) { this.particles.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.grav) p.vy += p.grav * dt;
        p.vx *= Math.pow(0.55, dt);
      }

      this.updateAmbient(dt, game);

      // météo locale, à l'écran
      if (this.weather.length) {
        for (const w of this.weather) {
          w.phase += dt;
          w.x += (w.vx + Math.sin(w.phase * 0.8) * 3) * dt;
          w.y += w.vy * dt;
          if (w.x < -14) w.x = 650;
          if (w.x > 652) w.x = -12;
          if (w.y > 372) { w.y = -12; w.x = Math.random() * 650; }
          if (w.y < -16) { w.y = 370; w.x = Math.random() * 650; }
        }
      }
    },

    /* ----------------------------------------------------------
       Rendu
       ---------------------------------------------------------- */
    drawUnder(ctx, camX, camY, time) {
      for (const e of this.list) {
        if (e.type === 'telegraphLine') {
          const a = U.clamp(e.life / e.max, 0, 1);
          const x = e.x - camX, y = e.y - camY;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(e.ang);
          ctx.globalAlpha = 0.18 + (1 - a) * 0.22;
          const g = ctx.createLinearGradient(0, 0, e.len, 0);
          g.addColorStop(0, U.rgba(e.color, 0.08));
          g.addColorStop(0.7, U.rgba(e.color, 0.55));
          g.addColorStop(1, U.rgba(e.color, 0.12));
          ctx.fillStyle = g;
          ctx.fillRect(0, -e.width / 2, e.len, e.width);
          ctx.strokeStyle = U.rgba(e.color, 0.5 + Math.sin(time * 24) * 0.2);
          ctx.lineWidth = 1;
          ctx.strokeRect(0.5, -e.width / 2 + 0.5, e.len - 1, e.width - 1);
          ctx.restore();
          ctx.globalAlpha = 1;
        } else if (e.type === 'telegraphCircle') {
          const a = U.clamp(e.life / e.max, 0, 1);
          const x = e.x - camX, y = e.y - camY;
          ctx.globalAlpha = 0.14 + (1 - a) * 0.18;
          ctx.fillStyle = e.color;
          ctx.beginPath(); ctx.arc(x, y, e.radius, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.55 + Math.sin(time * 22) * 0.2;
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y, Math.max(2, e.radius * a), 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    },

    drawOver(ctx, camX, camY, time) {
      // images rémanentes
      for (const e of this.list) {
        if (e.type !== 'afterimage') continue;
        const a = U.clamp(e.life / e.max, 0, 1);
        ctx.globalAlpha = a * 0.4;
        ctx.drawImage(e.img, Math.round(e.x - camX - e.img.width / 2), Math.round(e.y - camY - e.img.height + 1));
        ctx.globalAlpha = 1;
      }

      // particules
      for (const p of this.particles) {
        const a = U.clamp(p.life / p.max, 0, 1);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        const s = p.size || 1;
        ctx.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), s, s);
      }
      ctx.globalAlpha = 1;

      // effets
      for (const e of this.list) {
        const a = U.clamp(e.life / e.max, 0, 1);
        const x = e.x - camX, y = e.y - camY;
        if (e.type === 'slash') {
          const t = 1 - a;
          const px = x, py = y;
          ctx.save();
          ctx.translate(px, py);
          ctx.globalAlpha = a * 0.85;
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, e.reach * (0.72 + t * 0.5), e.ang - e.arc / 2 + t * 0.5, e.ang + e.arc / 2 + t * 0.5);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = '#fffdf0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, e.reach * (0.7 + t * 0.5), e.ang - e.arc / 2 + t * 0.5 + 0.12, e.ang + e.arc / 2 + t * 0.5 - 0.12);
          ctx.stroke();
          ctx.restore();
          ctx.globalAlpha = 1;
        } else if (e.type === 'ring') {
          const t = 1 - a;
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y, Math.max(2, e.radius * (0.35 + t * 0.9)), 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = a * 0.3;
          ctx.beginPath(); ctx.arc(x, y, Math.max(1, e.radius * (0.2 + t)), 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (e.type === 'damage' || e.type === 'text') {
          const scale = e.type === 'text' ? 2 : 2;
          ctx.globalAlpha = Math.min(1, a * 2.4);
          Art.drawText(ctx, e.text, Math.round(x), Math.round(y), e.color, scale, true, 'center');
          ctx.globalAlpha = 1;
        }
      }

      // ambiance
      for (const p of this.ambient) {
        const a = U.clamp(p.life / p.max, 0, 1);
        const pulse = p.kind === 'shrine' || p.kind === 'sparkle' || p.kind === 'spirit'
          ? 0.55 + Math.sin((p.max - p.life) * 7 + p.phase) * 0.45 : 1;
        ctx.globalAlpha = Math.min(1, a * 2.2) * pulse;
        ctx.fillStyle = p.color;
        const s = Math.max(1, Math.round(p.size));
        ctx.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), s, s);
        if (p.kind === 'smoke') {
          ctx.globalAlpha *= 0.35;
          ctx.fillRect(Math.round(p.x - camX) - 1, Math.round(p.y - camY) - 1, s + 2, s + 2);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawWeather(ctx) {
      for (const w of this.weather) {
        ctx.globalAlpha = w.rain ? 0.32 : 0.55;
        ctx.fillStyle = w.color;
        if (w.rain) {
          ctx.fillRect(Math.round(w.x), Math.round(w.y), 1, 3);
        } else {
          const s = w.size || 1;
          ctx.fillRect(Math.round(w.x), Math.round(w.y), s, s);
        }
      }
      ctx.globalAlpha = 1;
    },

    /* Ombres de nuages : une texture douce qui dérive au-dessus du monde. */
    drawClouds(ctx, camX, camY, time, zoneId) {
      if (!cloudTex) cloudTex = buildCloudTexture();
      const scale = 3;
      const tw = cloudTex.width * scale;
      const th = cloudTex.height * scale;
      const vw = ctx.canvas.width, vh = ctx.canvas.height;
      const ox = ((time * 7 - camX * 0.3) % tw + tw) % tw;
      const oy = ((time * 3.5 - camY * 0.2) % th + th) % th;
      const strength = zoneId === 'volcano' ? 0.45 : zoneId === 'desert' ? 0.5 : zoneId === 'tundra' ? 0.55 : 0.85;
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.globalAlpha = strength;
      for (let ty = -1; ty <= Math.ceil(vh / th); ty++) {
        for (let tx = -1; tx <= Math.ceil(vw / tw); tx++) {
          ctx.drawImage(cloudTex, tx * tw - ox, ty * th - oy, tw, th);
        }
      }
      ctx.restore();
    },

    /* Colorimétrie par biome et vignette douce. */
    drawGrade(ctx, zoneId, time) {
      const vw = ctx.canvas.width, vh = ctx.canvas.height;
      const g = GRADE[zoneId] || GRADE.plains;
      const grad = ctx.createLinearGradient(0, 0, vw, vh);
      grad.addColorStop(0, g.light);
      grad.addColorStop(0.52, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, g.shade);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, vw, vh);

      const breathe = 0.02 + Math.sin(time * 0.25) * 0.012;
      const light = ctx.createRadialGradient(vw * 0.42, vh * 0.32, 10, vw * 0.42, vh * 0.32, vh * 0.9);
      light.addColorStop(0, 'rgba(255, 246, 214, ' + breathe.toFixed(3) + ')');
      light.addColorStop(1, 'rgba(255, 246, 214, 0)');
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, vw, vh);

      const vg = ctx.createRadialGradient(vw * 0.5, vh * 0.47, vh * 0.3, vw * 0.5, vh * 0.52, vh * 0.84);
      vg.addColorStop(0, 'rgba(' + g.vig + ', 0)');
      vg.addColorStop(0.62, 'rgba(' + g.vig + ', ' + (g.va * 0.34).toFixed(3) + ')');
      vg.addColorStop(1, 'rgba(' + g.vig + ', ' + g.va.toFixed(3) + ')');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, vw, vh);
    },

    /* Ambiances propres à chaque terre : rayons, brume, chaleur, givre. */
    drawAmbience(ctx, zoneId, time, camX, camY) {
      if (!zoneId || zoneId === 'plains') return;
      const vw = ctx.canvas.width, vh = ctx.canvas.height;
      ctx.save();

      if (zoneId === 'forest') {
        // Rayons de soleil obliques entre les fûts, très légers.
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) {
          const ph = time * 0.16 + i * 1.9;
          const base = ((i * 181 + Math.sin(ph) * 24) % (vw + 160)) - 80;
          const slant = Math.sin(ph * 0.6) * 12;
          const w = 18 + i * 10;
          const a = 0.85 + Math.sin(time * 0.4 + i) * 0.15;
          const g = ctx.createLinearGradient(base, 0, base + 90 + slant, vh);
          g.addColorStop(0, 'rgba(255, 244, 200, 0)');
          g.addColorStop(0.28, 'rgba(255, 244, 200, ' + (0.065 * a).toFixed(3) + ')');
          g.addColorStop(0.72, 'rgba(255, 244, 200, ' + (0.03 * a).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(255, 244, 200, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(base, 0);
          ctx.lineTo(base + w, 0);
          ctx.lineTo(base + w + 90 + slant, vh);
          ctx.lineTo(base + 90 + slant, vh);
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (zoneId === 'swamp') {
        // Nappes de brume basses qui dérivent entre les racines.
        for (let i = 0; i < 5; i++) {
          const y = vh * (0.5 + i * 0.1) + Math.sin(time * 0.18 + i) * 5;
          const h = 16 + i * 5;
          const gy = ctx.createLinearGradient(0, y, 0, y + h);
          gy.addColorStop(0, 'rgba(190, 230, 196, 0)');
          gy.addColorStop(0.42, 'rgba(190, 230, 196, ' + (0.04 + i * 0.005).toFixed(3) + ')');
          gy.addColorStop(1, 'rgba(190, 230, 196, 0)');
          ctx.fillStyle = gy;
          ctx.fillRect(0, y, vw, h);
        }
        for (let i = 0; i < 4; i++) {
          const x = ((i * 167 + time * 7 + Math.sin(time * 0.12 + i * 1.7) * 48) % (vw + 240)) - 120;
          const y = vh * (0.55 + (i % 3) * 0.11) + Math.sin(time * 0.2 + i) * 6;
          const rx = 70 + i * 24, ry = 18 + i * 4;
          const g = ctx.createRadialGradient(x, y, 1, x, y, rx);
          g.addColorStop(0, 'rgba(198, 234, 202, 0.045)');
          g.addColorStop(1, 'rgba(198, 234, 202, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (zoneId === 'desert') {
        // Halo solaire et ondes de chaleur.
        const sun = ctx.createRadialGradient(vw * 0.18, vh * 0.05, 2, vw * 0.18, vh * 0.05, vh * 1.15);
        sun.addColorStop(0, 'rgba(255, 242, 196, 0.17)');
        sun.addColorStop(0.45, 'rgba(255, 224, 158, 0.05)');
        sun.addColorStop(1, 'rgba(255, 224, 158, 0)');
        ctx.fillStyle = sun;
        ctx.fillRect(0, 0, vw, vh);
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 3; i++) {
          const y = vh * (0.44 + i * 0.18) + Math.sin(time * 0.85 + i * 2.1) * 5;
          const g = ctx.createLinearGradient(0, y, 0, y + 20);
          g.addColorStop(0, 'rgba(255, 228, 172, 0)');
          g.addColorStop(0.5, 'rgba(255, 228, 172, 0.04)');
          g.addColorStop(1, 'rgba(255, 228, 172, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, y, vw, 20);
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (zoneId === 'tundra') {
        // Scintillements de givre ancrés au sol.
        const cell = 46;
        const gx0 = Math.floor(camX / cell) - 1, gy0 = Math.floor(camY / cell) - 1;
        const gx1 = Math.ceil((camX + vw) / cell), gy1 = Math.ceil((camY + vh) / cell);
        ctx.fillStyle = '#eaffff';
        for (let gy = gy0; gy <= gy1; gy++) {
          for (let gx = gx0; gx <= gx1; gx++) {
            const r = U.hash2(gx, gy, 4411);
            if (r < 0.52) continue;
            const x = (gx + 0.2 + U.hash2(gx, gy, 97) * 0.6) * cell - camX;
            const y = (gy + 0.2 + U.hash2(gx, gy, 53) * 0.6) * cell - camY;
            if (x < -4 || x > vw + 4 || y < -4 || y > vh + 4) continue;
            const tw = Math.sin(time * 2.1 + r * 40);
            if (tw < 0.74) continue;
            const a = (tw - 0.74) / 0.26;
            ctx.globalAlpha = a * 0.82;
            ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
            if (a > 0.78) {
              ctx.globalAlpha = a * 0.28;
              ctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 1);
              ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 3);
            }
          }
        }
        ctx.globalAlpha = 1;
      } else if (zoneId === 'volcano') {
        // Lueur de lave au bas de l'écran et voile de cendres.
        const pulse = 0.055 + Math.sin(time * 1.15) * 0.022;
        const glow = ctx.createRadialGradient(vw * 0.5, vh * 1.08, 8, vw * 0.5, vh * 1.08, vh * 1.0);
        glow.addColorStop(0, 'rgba(255, 122, 52, ' + pulse.toFixed(3) + ')');
        glow.addColorStop(0.45, 'rgba(255, 92, 40, ' + (pulse * 0.4).toFixed(3) + ')');
        glow.addColorStop(1, 'rgba(255, 92, 40, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, vw, vh);
        const haze = ctx.createLinearGradient(0, 0, 0, vh * 0.5);
        haze.addColorStop(0, 'rgba(28, 16, 22, 0.1)');
        haze.addColorStop(1, 'rgba(28, 16, 22, 0)');
        ctx.fillStyle = haze;
        ctx.fillRect(0, 0, vw, vh * 0.5);
        for (let i = 0; i < 2; i++) {
          const y = vh * (0.55 + i * 0.24) + Math.sin(time * 0.7 + i * 2.4) * 6;
          const g = ctx.createLinearGradient(0, y, 0, y + 24);
          g.addColorStop(0, 'rgba(255, 170, 96, 0)');
          g.addColorStop(0.5, 'rgba(255, 170, 96, 0.032)');
          g.addColorStop(1, 'rgba(255, 170, 96, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, y, vw, 24);
        }
      }

      ctx.restore();
    }
  };

  window.FX = FX;
})();
