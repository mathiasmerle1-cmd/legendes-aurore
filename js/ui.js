/* ============================================================
   LES LÉGENDES D'AURORE — interface et menus
   ============================================================ */
(function () {
  'use strict';
  const U = window.U, D = window.DATA, Art = window.Art;

  const UI = {
    game: null,
    root: null,
    modal: null,
    screenEl: null,
    detailEl: null,
    returnTo: null,
    editorState: null,
    editorPreview: null,
    editorTime: 0,
    dialog: null,
    dialogEl: null,
    toasts: [],
    banner: null,
    selectedBagId: null,
    shopMessage: '',
    forgeMessage: ''
  };

  const iconCache = new Map();

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function clearNode(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function gearStatChips(g) {
    const out = [];
    const style = D.ATTACK_STYLES[g.style];
    if (g.dmg) out.push({ label: 'ATQ', value: '+' + g.dmg, good: true });
    if (g.def) out.push({ label: 'DEF', value: '+' + g.def, good: true });
    if (g.hp) out.push({ label: 'PV', value: '+' + g.hp, good: true });
    if (g.crit) out.push({ label: 'CRIT', value: '+' + Math.round(g.crit * 100) + '%', good: true });
    if (g.spd) out.push({ label: 'VIT', value: '+' + g.spd, good: true });
    if (style) out.push({ label: 'STYLE', value: style.name, good: false });
    return out;
  }

  function gearSummary(g) {
    return gearStatChips(g).map(c => c.label + ' ' + c.value).join(' · ');
  }

  function iconURL(id) {
    if (iconCache.has(id)) return iconCache.get(id);
    const c = Art.gearIcon(id);
    const url = c.toDataURL();
    iconCache.set(id, url);
    return url;
  }

  function iconEl(id, size) {
    const img = new Image();
    img.src = iconURL(id);
    img.width = size;
    img.height = size;
    img.className = 'pixel-icon';
    img.alt = '';
    img.draggable = false;
    return img;
  }

  function potionURL(id) {
    const key = 'potion:' + id;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = Art.potionIcon(id);
    const url = c.toDataURL();
    iconCache.set(key, url);
    return url;
  }

  function smallURL(kind) {
    const key = 'small:' + kind;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = Art.smallIcon(kind);
    const url = c.toDataURL();
    iconCache.set(key, url);
    return url;
  }

  function potionName(id) { return D.POTIONS[id] ? D.POTIONS[id].name : id; }

  function bossProgress(game) {
    const zoneBosses = D.ZONES.reduce((acc, z) => acc + z.arenas.length, 0);
    let done = 0;
    game.world.arenas.forEach(a => { if (a.defeated) done++; });
    return { done: done, total: zoneBosses, bigDone: game.bigBossesDefeated(), final: game.world.finalArena.defeated };
  }

  function playTimeStr(sec) { return U.formatTime(sec); }

  /* ============================================================
     Ouverture / fermeture
     ============================================================ */
  UI.init = function (game) {
    this.game = game;
    this.root = document.getElementById('ui-root');
    this.root.innerHTML = '';
    this.modal = null;
    this.dialog = null;
    this.dialogEl = null;
    this.toasts = [];
    this.banner = null;
  };

  UI.isOpen = function () { return !!(this.modal || this.dialog); };

  UI.open = function (name, data) {
    data = data || {};
    if (this.dialog) this.closeDialogue(true);
    this.clearScreen();
    this.modal = name;
    this.returnTo = data.from || null;
    const s = el('div', 'screen screen-' + name);
    this.screenEl = s;
    this.root.appendChild(s);
    this.game.paused = true;

    switch (name) {
      case 'title': this.buildTitle(s, data); this.game.paused = false; break;
      case 'editor': this.buildEditor(s, data); this.game.paused = false; break;
      case 'pause': this.buildPause(s); break;
      case 'inventory': this.buildInventory(s); break;
      case 'shop': this.buildShop(s); break;
      case 'forge': this.buildForge(s); break;
      case 'map': this.buildMap(s); break;
      case 'help': this.buildHelp(s); break;
      case 'reward': this.buildReward(s, data); break;
      case 'death': this.buildDeath(s); break;
      case 'victory': this.buildVictory(s); break;
      case 'confirm': this.buildConfirm(s, data); break;
    }
  };

  UI.clearScreen = function () {
    if (this.screenEl) {
      this.screenEl.remove();
      this.screenEl = null;
    }
    this.modal = null;
    this.detailEl = null;
    this.forgeMessage = '';
    this.shopMessage = '';
  };

  UI.close = function (opts) {
    opts = opts || {};
    const back = this.returnTo;
    const was = this.modal;
    this.clearScreen();
    this.returnTo = null;
    if (this.game) this.game.paused = false;
    if (back && !opts.silent) {
      if (back === 'title') { this.open('title'); }
      else if (back === 'pause') { this.open('pause'); }
    }
  };

  UI.handleEscape = function () {
    if (this.dialog) { this.closeDialogue(true); return true; }
    if (!this.modal) return false;
    if (this.modal === 'title' || this.modal === 'editor' || this.modal === 'death' || this.modal === 'victory') return false;
    if (this.returnTo === 'pause') this.open('pause');
    else if (this.returnTo === 'title') this.open('title');
    else this.close();
    return true;
  };

  /* ============================================================
     Titre
     ============================================================ */
  UI.buildTitle = function (s) {
    const save = this.game.getSaveSummary();
    s.innerHTML = `
      <div class="title-vignette"></div>
      <div class="title-copy">
        <div class="eyebrow">UN RPG PIXEL D'AVENTURE</div>
        <h1 class="game-title"><span>LES LÉGENDES</span><em>D'AURORE</em></h1>
        <p class="tagline">Six terres. Dix-neuf gardiens.<br>Une aube à reconquérir.</p>
        <div class="menu-list">
          <button class="pixel-btn primary" id="btn-new">NOUVELLE PARTIE</button>
          <button class="pixel-btn" id="btn-continue">CONTINUER</button>
          <button class="pixel-btn ghost" id="btn-help">COMMANDES</button>
        </div>
        <div class="save-summary" id="save-summary"></div>
        <div class="title-note">v1.0 · musique et graphismes procéduraux</div>
      </div>
      <div class="title-badge">Cliquez pour activer le son</div>
    `;
    const btnContinue = s.querySelector('#btn-continue');
    if (!save) {
      btnContinue.disabled = true;
      btnContinue.textContent = 'AUCUNE SAUVEGARDE';
    } else {
      s.querySelector('#save-summary').innerHTML =
        `<span>Nv ${save.level}</span> · <span>${save.zone}</span> · <span>${U.formatTime(save.playTime)}</span>`;
    }
    s.querySelector('#btn-new').addEventListener('click', () => {
      window.AudioSys.init();
      window.AudioSys.sfx('click');
      this.open('editor');
    });
    btnContinue.addEventListener('click', () => {
      if (!save) return;
      window.AudioSys.init();
      window.AudioSys.sfx('click');
      this.close({ silent: true });
      this.game.loadGame();
    });
    s.querySelector('#btn-help').addEventListener('click', () => {
      window.AudioSys.init();
      this.open('help', { from: 'title' });
    });
  };

  /* ============================================================
     Éditeur de personnage
     ============================================================ */
  UI.buildEditor = function (s) {
    this.editorTime = 0;
    this.editorState = {
      classId: 'epeiste',
      look: Object.assign({}, D.DEFAULT_LOOK),
      name: 'Aurore'
    };
    s.innerHTML = `
      <div class="editor-bg"></div>
      <div class="editor-panel">
        <div class="editor-head">
          <div>
            <div class="eyebrow">CRÉATION DE PERSONNAGE</div>
            <h2>FAÇONNEZ VOTRE HÉROS</h2>
          </div>
          <div class="editor-step">ÉTAPE UNIQUE</div>
        </div>
        <div class="editor-body">
          <div class="editor-left">
            <div class="preview-frame">
              <div class="preview-checker"></div>
              <canvas id="ed-preview" width="150" height="170"></canvas>
              <div class="preview-label" id="ed-preview-label">ÉPÉISTE</div>
            </div>
            <label class="field-label" for="ed-name">NOM DU HÉROS</label>
            <input id="ed-name" class="pixel-input" maxlength="12" value="Aurore" autocomplete="off" spellcheck="false">
            <p class="editor-class-desc" id="ed-classdesc"></p>
          </div>
          <div class="editor-right">
            <div class="ed-section">
              <div class="ed-section-title"><span>CLASSE</span><small id="ed-class-note">Choisissez votre style de combat</small></div>
              <div class="class-row" id="ed-classes"></div>
            </div>
            <div class="ed-section">
              <div class="ed-section-title"><span>APPARENCE</span><small id="ed-look-note">Personnalisez votre aventurier</small></div>
              <div class="look-grid" id="ed-looks"></div>
            </div>
          </div>
        </div>
        <div class="editor-actions">
          <button class="pixel-btn ghost" id="ed-back">RETOUR</button>
          <div class="editor-hint">Les choix sont esthétiques : seule la classe change vos statistiques.</div>
          <button class="pixel-btn primary" id="ed-start">COMMENCER ▸</button>
        </div>
      </div>
    `;
    this.editorPreview = s.querySelector('#ed-preview');

    const nameInput = s.querySelector('#ed-name');
    nameInput.addEventListener('input', () => {
      this.editorState.name = nameInput.value.slice(0, 12);
    });
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') s.querySelector('#ed-start').click();
      e.stopPropagation();
    });

    this.renderEditorClasses(s);
    this.renderEditorLooks(s);
    this.updateEditorClassDesc(s);
    this.drawEditorPreview();

    s.querySelector('#ed-back').addEventListener('click', () => {
      window.AudioSys.sfx('click');
      this.open('title');
    });
    s.querySelector('#ed-start').addEventListener('click', () => {
      const name = (nameInput.value || 'Aurore').trim() || 'Aurore';
      this.editorState.name = name;
      window.AudioSys.init();
      window.AudioSys.sfx('victory');
      this.close({ silent: true });
      this.game.startRun(this.editorState);
    });
  };

  UI.renderEditorClasses = function (s) {
    const row = s.querySelector('#ed-classes');
    clearNode(row);
    D.CLASSES.forEach(cls => {
      const card = el('button', 'class-card' + (this.editorState.classId === cls.id ? ' selected' : ''));
      card.innerHTML = `
        <span class="class-emblem" style="--c:${cls.color}">${cls.name.slice(0, 1)}</span>
        <span class="class-info"><b>${cls.name}</b><small>${cls.tagline}</small></span>
      `;
      card.addEventListener('click', () => {
        this.editorState.classId = cls.id;
        window.AudioSys.sfx('click');
        this.renderEditorClasses(s);
        this.updateEditorClassDesc(s);
        this.drawEditorPreview();
      });
      row.appendChild(card);
    });
  };

  UI.updateEditorClassDesc = function (s) {
    const cls = D.CLASSES.find(c => c.id === this.editorState.classId) || D.CLASSES[0];
    s.querySelector('#ed-preview-label').textContent = cls.name.toUpperCase();
    s.querySelector('#ed-classdesc').innerHTML =
      `<b style="color:${cls.color}">${cls.name}</b> — ${cls.desc}<br><span class="dim">PV ${cls.hp} · ATQ ${cls.atk} · DEF ${cls.def} · VIT ${cls.spd}</span>`;
  };

  UI.renderEditorLooks = function (s) {
    const wrap = s.querySelector('#ed-looks');
    clearNode(wrap);

    const addRow = (label, options, current, onPick, isColor) => {
      const row = el('div', 'look-row');
      const lab = el('div', 'look-label', label);
      const opts = el('div', 'look-options');
      options.forEach((opt, idx) => {
        const b = el('button', (isColor ? 'swatch' : 'look-chip') + (idx === current ? ' selected' : ''));
        if (isColor) {
          b.style.background = opt.base;
          b.title = opt.name;
          b.innerHTML = `<span style="background:${opt.light || opt.base}"></span>`;
        } else {
          b.textContent = opt.name;
        }
        b.addEventListener('click', () => {
          onPick(idx);
          window.AudioSys.sfx('click');
          this.renderEditorLooks(s);
          this.drawEditorPreview();
        });
        opts.appendChild(b);
      });
      row.appendChild(lab);
      row.appendChild(opts);
      wrap.appendChild(row);
    };

    const look = this.editorState.look;
    addRow('PEAU', D.SKINS, look.skin, v => look.skin = v, true);
    addRow('COIFFURE', D.HAIRS, look.hair, v => look.hair = v, false);
    addRow('CHEVEUX', D.HAIR_COLORS, look.hairColor, v => look.hairColor = v, true);
    addRow('HAUT', D.SHIRT_COLORS, look.shirt, v => look.shirt = v, true);
    addRow('BAS', D.PANTS_COLORS, look.pants, v => look.pants = v, true);
  };

  UI.drawEditorPreview = function () {
    if (!this.editorPreview || !this.editorState) return;
    const c = this.editorPreview;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    const sheet = Art.playerSheet(this.editorState.look);
    const t = this.editorTime;
    // sol
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#1b2638';
    ctx.beginPath(); ctx.ellipse(75, 148, 40, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#2a3a52';
    ctx.beginPath(); ctx.ellipse(75, 146, 30, 7, 0, 0, Math.PI * 2); ctx.fill();
    // personnage 5x
    const img = sheet.frames[0][0];
    const s = 5;
    const bob = Math.sin(t * 2.4) * 1.5;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(75 - img.width * s / 2), Math.round(142 - img.height * s + bob), img.width * s, img.height * s);
    // étincelles
    for (let i = 0; i < 6; i++) {
      const a = t * 0.7 + i * 1.05;
      const x = 75 + Math.cos(a) * (44 + Math.sin(t + i) * 8);
      const y = 100 + Math.sin(a * 1.3) * 40;
      ctx.globalAlpha = 0.35 + Math.sin(t * 3 + i) * 0.25;
      ctx.fillStyle = i % 2 ? '#ffe6a0' : '#9fdcff';
      ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
    }
    ctx.globalAlpha = 1;
  };

  /* ============================================================
     Pause
     ============================================================ */
  UI.buildPause = function (s) {
    const p = this.game.player;
    const prog = bossProgress(this.game);
    s.innerHTML = `
      <div class="modal-dim"></div>
      <div class="panel pause-panel">
        <div class="eyebrow">LE TEMPS SUSPENDU</div>
        <h2>PAUSE</h2>
        <div class="pause-zone">${this.game.currentZone().name}</div>
        <div class="pause-stats">
          <div><span>Niveau</span><b>${p.level}</b></div>
          <div><span>Gardiens</span><b>${prog.bigDone}/6</b></div>
          <div><span>Or</span><b>${p.gold}</b></div>
          <div><span>Temps</span><b>${playTimeStr(p.playTime)}</b></div>
        </div>
        <div class="menu-list">
          <button class="pixel-btn primary" id="pu-resume">REPRENDRE</button>
          <button class="pixel-btn" id="pu-inventory">SAC & ÉQUIPEMENT</button>
          <button class="pixel-btn" id="pu-map">CARTE DU MONDE</button>
          <button class="pixel-btn ghost" id="pu-help">COMMANDES</button>
          <button class="pixel-btn ghost" id="pu-save">SAUVEGARDER</button>
          <button class="pixel-btn danger" id="pu-quit">QUITTER AU TITRE</button>
        </div>
        <div class="pause-note">La sauvegarde automatique a lieu aux sanctuaires et après chaque boss.</div>
      </div>
    `;
    s.querySelector('#pu-resume').addEventListener('click', () => this.close());
    s.querySelector('#pu-inventory').addEventListener('click', () => { window.AudioSys.sfx('click'); this.open('inventory', { from: 'pause' }); });
    s.querySelector('#pu-map').addEventListener('click', () => { window.AudioSys.sfx('click'); this.open('map', { from: 'pause' }); });
    s.querySelector('#pu-help').addEventListener('click', () => { window.AudioSys.sfx('click'); this.open('help', { from: 'pause' }); });
    s.querySelector('#pu-save').addEventListener('click', () => {
      const ok = this.game.save();
      window.AudioSys.sfx(ok ? 'save' : 'error');
      const n = s.querySelector('.pause-note');
      if (n) n.textContent = ok ? 'Partie sauvegardée.' : 'Impossible de sauvegarder.';
    });
    s.querySelector('#pu-quit').addEventListener('click', () => {
      this.game.save();
      this.open('confirm', { from: 'pause', question: 'Quitter vers le titre ?', detail: 'Votre progression est sauvegardée.', action: 'title' });
    });
  };

  UI.buildConfirm = function (s, data) {
    s.innerHTML = `
      <div class="modal-dim"></div>
      <div class="panel confirm-panel">
        <h2>${data.question || 'Confirmer'}</h2>
        <p>${data.detail || ''}</p>
        <div class="row-actions">
          <button class="pixel-btn ghost" id="cf-no">ANNULER</button>
          <button class="pixel-btn primary" id="cf-yes">CONFIRMER</button>
        </div>
      </div>
    `;
    s.querySelector('#cf-no').addEventListener('click', () => this.open('pause'));
    s.querySelector('#cf-yes').addEventListener('click', () => {
      if (data.action === 'title') {
        this.clearScreen();
        this.game.quitToTitle();
      }
    });
  };

  /* ============================================================
     Inventaire
     ============================================================ */
  UI.buildInventory = function (s) {
    const p = this.game.player;
    if (this.selectedBagId && !p.bag.includes(this.selectedBagId)) this.selectedBagId = null;
    s.innerHTML = `
      <div class="modal-dim"></div>
      <div class="panel wide inv-panel">
        <div class="panel-head">
          <div>
            <div class="eyebrow">SAC & ÉQUIPEMENT</div>
            <h2>${p.name.toUpperCase()} <span class="head-sub">Nv ${p.level}</span></h2>
          </div>
          <div class="head-right">
            <span class="coin-line"><img src="${smallURL('coin')}" width="12" height="12"> ${p.gold}</span>
            <button class="close-btn" id="inv-close">✕</button>
          </div>
        </div>
        <div class="inv-body">
          <div class="inv-left">
            <div class="section-label">ÉQUIPÉ</div>
            <div class="equip-list" id="inv-equip"></div>
            <div class="section-label">STATISTIQUES</div>
            <div class="stat-grid" id="inv-stats"></div>
          </div>
          <div class="inv-mid">
            <div class="section-label">POTIONS</div>
            <div class="potion-row" id="inv-potions"></div>
            <div class="section-label">SAC <span class="dim" id="inv-bagcount"></span></div>
            <div class="bag-grid" id="inv-bag"></div>
          </div>
          <div class="inv-right">
            <div class="section-label">DÉTAILS</div>
            <div class="item-detail" id="inv-detail"></div>
          </div>
        </div>
        <div class="panel-foot">
          <span class="hint">Clic : sélectionner · Double-clic : équiper</span>
          <span class="hint">Les objets équipés peuvent être remplacés depuis le sac.</span>
        </div>
      </div>
    `;
    s.querySelector('#inv-close').addEventListener('click', () => this.close());
    this.renderInventory(s);
  };

  UI.renderInventory = function (s) {
    const p = this.game.player;
    s = s || this.screenEl;
    if (!s) return;

    // équipement
    const eq = s.querySelector('#inv-equip');
    clearNode(eq);
    ['weapon', 'armor', 'trinket'].forEach(slot => {
      const id = p.equipment[slot];
      const g = D.GEAR_BY_ID[id];
      const row = el('button', 'equip-slot' + (g ? '' : ' empty'));
      const label = slot === 'weapon' ? 'ARME' : slot === 'armor' ? 'ARMURE' : 'TALISMAN';
      if (g) {
        row.appendChild(iconEl(id, 26));
        const info = el('div', 'equip-info');
        info.innerHTML = `<small>${label}</small><b style="color:${D.RARITIES[g.rarity].color}">${g.name}</b><span>${gearSummary(g)}</span>`;
        row.appendChild(info);
        row.addEventListener('click', () => { this.selectedBagId = id; this.renderInventoryDetail(); });
      } else {
        const info = el('div', 'equip-info');
        info.innerHTML = `<small>${label}</small><b class="dim">Vide</b>`;
        row.appendChild(info);
      }
      eq.appendChild(row);
    });

    // stats
    const st = s.querySelector('#inv-stats');
    st.innerHTML = `
      <div><span>PV</span><b>${Math.ceil(p.hp)} / ${p.maxHp}</b></div>
      <div><span>ATQ</span><b>${Math.round(p.attackPower)}</b></div>
      <div><span>DEF</span><b>${Math.round(p.def)}</b></div>
      <div><span>VIT</span><b>${Math.round(p.moveSpeed)}</b></div>
      <div><span>CRIT</span><b>${Math.round(p.crit * 100)} %</b></div>
      <div><span>XP</span><b>${p.xp} / ${p.xpToNext()}</b></div>
    `;

    // potions
    const pots = s.querySelector('#inv-potions');
    clearNode(pots);
    ['petite', 'potion', 'elixir'].forEach(kind => {
      const count = p.potions[kind] || 0;
      const b = el('button', 'potion-card' + (count <= 0 ? ' empty' : ''));
      b.innerHTML = `<img src="${potionURL(kind)}" width="24" height="24" alt=""><span><b>${D.POTIONS[kind].name}</b><small>${D.POTIONS[kind].desc}</small></span><em>×${count}</em>`;
      b.title = 'Utiliser ' + D.POTIONS[kind].name;
      b.addEventListener('click', () => {
        if (count <= 0) { window.AudioSys.sfx('error'); return; }
        if (p.hp >= p.maxHp) { this.game.toast('PV déjà au maximum.', '#c5ced8'); window.AudioSys.sfx('error'); return; }
        p.potions[kind]--;
        const healed = Math.round(p.maxHp * D.POTIONS[kind].heal);
        const before = p.hp;
        p.hp = Math.min(p.maxHp, p.hp + healed);
        this.game.fx.heal(p.x, p.y - 12);
        this.game.fx.damage(p.x, p.y - 34, '+' + (p.hp - before), '#8ef0a8', true);
        window.AudioSys.sfx('potion');
        this.game.saveSoon();
        this.renderInventory(s);
      });
      pots.appendChild(b);
    });

    // sac
    const bag = s.querySelector('#inv-bag');
    clearNode(bag);
    s.querySelector('#inv-bagcount').textContent = '(' + p.bag.length + ')';
    if (p.bag.length === 0) {
      bag.innerHTML = '<div class="empty-bag">Votre sac est vide.<br><span class="dim">Explorez les coffres et les arènes.</span></div>';
    } else {
      p.bag.forEach((id, i) => {
        const g = D.GEAR_BY_ID[id];
        if (!g) return;
        const cell = el('button', 'bag-cell' + (id === this.selectedBagId ? ' selected' : ''));
        cell.style.borderColor = D.RARITIES[g.rarity].color + '66';
        cell.appendChild(iconEl(id, 24));
        cell.title = g.name + ' — ' + gearSummary(g);
        cell.addEventListener('click', () => {
          this.selectedBagId = id;
          this.renderInventoryDetail();
          this.renderInventory(s);
        });
        cell.addEventListener('dblclick', () => this.equipSelected(s));
        bag.appendChild(cell);
      });
    }
    this.renderInventoryDetail();
  };

  UI.renderInventoryDetail = function () {
    const s = this.screenEl;
    if (!s) return;
    const p = this.game.player;
    const box = s.querySelector('#inv-detail');
    if (!box) return;
    const id = this.selectedBagId;
    const g = id ? D.GEAR_BY_ID[id] : null;

    if (!g) {
      // détails de l'arme équipée par défaut
      const w = D.GEAR_BY_ID[p.equipment.weapon];
      if (!w) {
        box.innerHTML = '<div class="detail-empty">Sélectionnez un objet dans le sac pour voir ses détails.<br><br><span class="dim">Astuce : double-cliquez pour équiper.</span></div>';
        return;
      }
      box.innerHTML = `
        <div class="detail-icon">${''}</div>
        <b class="detail-name" style="color:${D.RARITIES[w.rarity].color}">${w.name}</b>
        <span class="rarity" style="color:${D.RARITIES[w.rarity].color}">${D.RARITIES[w.rarity].name} · Équipée</span>
        <p class="detail-desc">${w.desc}</p>
        <div class="detail-stats">${gearStatChips(w).map(c => `<span class="${c.good ? 'good' : ''}"><small>${c.label}</small>${c.value}</span>`).join('')}</div>
      `;
      const iconHolder = box.querySelector('.detail-icon');
      if (iconHolder) iconHolder.appendChild(iconEl(w.id, 44));
      return;
    }

    const equipped = D.GEAR_BY_ID[p.equipment[g.slot]];
    const isEquipped = p.equipment[g.slot] === id;
    const compare = [];
    const defs = [['dmg', 'ATQ'], ['def', 'DEF'], ['hp', 'PV'], ['spd', 'VIT']];
    defs.forEach(([key, label]) => {
      const cur = (equipped && equipped[key]) || 0;
      const neu = g[key] || 0;
      if (cur || neu) {
        const d = neu - cur;
        compare.push(`<span class="cmp ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${label} ${d > 0 ? '▲' : d < 0 ? '▼' : '='} ${Math.abs(d)}</span>`);
      }
    });
    const curCrit = (equipped && equipped.crit) || 0;
    if (curCrit || g.crit) {
      const d = Math.round(((g.crit || 0) - curCrit) * 100);
      compare.push(`<span class="cmp ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">CRIT ${d > 0 ? '▲' : d < 0 ? '▼' : '='} ${Math.abs(d)}%</span>`);
    }

    box.innerHTML = `
      <div class="detail-icon"></div>
      <b class="detail-name" style="color:${D.RARITIES[g.rarity].color}">${g.name}</b>
      <span class="rarity" style="color:${D.RARITIES[g.rarity].color}">${D.RARITIES[g.rarity].name}${isEquipped ? ' · Équipé' : ''}</span>
      <p class="detail-desc">${g.desc}</p>
      <div class="detail-stats">${gearStatChips(g).map(c => `<span class="${c.good ? 'good' : ''}"><small>${c.label}</small>${c.value}</span>`).join('')}</div>
      ${compare.length ? `<div class="detail-compare">${compare.join('')}</div>` : ''}
      <div class="detail-actions">
        ${isEquipped
          ? `<button class="pixel-btn ghost" disabled>ÉQUIPÉ</button>`
          : `<button class="pixel-btn primary" id="inv-equip-btn">ÉQUIPER</button>`}
      </div>
    `;
    box.querySelector('.detail-icon').appendChild(iconEl(id, 44));
    const btn = box.querySelector('#inv-equip-btn');
    if (btn) btn.addEventListener('click', () => this.equipSelected(this.screenEl));
  };

  UI.equipSelected = function (s) {
    const p = this.game.player;
    const id = this.selectedBagId;
    const g = id ? D.GEAR_BY_ID[id] : null;
    if (!g) return;
    if (p.equip(g.slot, id)) {
      window.AudioSys.sfx('pickup');
      this.game.toast(g.name + ' équipé.', D.RARITIES[g.rarity].color);
      this.selectedBagId = id;
      this.game.saveSoon();
      this.renderInventory(s);
    }
  };

  /* ============================================================
     Boutique
     ============================================================ */
  UI.buildShop = function (s) {
    const p = this.game.player;
    const stock = this.game.getShopStock();
    s.innerHTML = `
      <div class="modal-dim"></div>
      <div class="panel shop-panel">
        <div class="panel-head">
          <div>
            <div class="eyebrow">MARCHANDE</div>
            <h2>MIRA LA MARCHANDE</h2>
          </div>
          <div class="head-right">
            <span class="coin-line"><img src="${smallURL('coin')}" width="12" height="12"> ${p.gold}</span>
            <button class="close-btn" id="shop-close">✕</button>
          </div>
        </div>
        <p class="npc-quote">« De l'eau claire, des potions fraîches, et quelques trouvailles. Le désert est loin, mon ami. »</p>
        <div class="shop-list" id="shop-list"></div>
        <div class="panel-foot">
          <span class="shop-msg" id="shop-msg">${this.shopMessage || ''}</span>
          <span class="hint">Les potions soignent instantanément.</span>
        </div>
      </div>
    `;
    s.querySelector('#shop-close').addEventListener('click', () => this.close());
    this.renderShop(s);
  };

  UI.renderShop = function (s) {
    s = s || this.screenEl;
    if (!s) return;
    const p = this.game.player;
    const list = s.querySelector('#shop-list');
    const stock = this.game.getShopStock();
    clearNode(list);

    stock.forEach(item => {
      const card = el('div', 'shop-card');
      if (item.type === 'potion') {
        const def = D.POTIONS[item.id];
        card.innerHTML = `<img src="${potionURL(item.id)}" width="28" height="28" alt=""><div class="shop-info"><b>${def.name}</b><small>${def.desc}</small></div><span class="price">${item.price} or</span>`;
      } else {
        const g = D.GEAR_BY_ID[item.id];
        card.innerHTML = `<span class="shop-icon-slot"></span><div class="shop-info"><b style="color:${D.RARITIES[g.rarity].color}">${g.name}</b><small>${gearSummary(g)}</small></div><span class="price">${item.price} or</span>`;
        card.querySelector('.shop-icon-slot').appendChild(iconEl(item.id, 28));
      }
      const buy = el('button', 'pixel-btn small primary', p.gold >= item.price ? 'ACHETER' : 'TROP CHER');
      buy.disabled = p.gold < item.price;
      buy.addEventListener('click', () => {
        if (p.gold < item.price) { window.AudioSys.sfx('error'); return; }
        p.gold -= item.price;
        if (item.type === 'potion') {
          p.addPotion(item.id, 1);
        } else {
          p.bag.push(item.id);
          this.game.shopStock = (this.game.shopStock || []).filter(x => x.id !== item.id);
        }
        this.shopMessage = item.type === 'potion' ? potionName(item.id) + ' achetée.' : D.GEAR_BY_ID[item.id].name + ' acheté.';
        window.AudioSys.sfx('buy');
        this.game.saveSoon();
        const head = s.querySelector('.coin-line');
        if (head) head.innerHTML = `<img src="${smallURL('coin')}" width="12" height="12"> ${p.gold}`;
        this.renderShop(s);
        s.querySelector('#shop-msg').textContent = this.shopMessage;
      });
      card.appendChild(buy);
      list.appendChild(card);
    });
  };

  /* ============================================================
     Forge
     ============================================================ */
  UI.buildForge = function (s) {
    const p = this.game.player;
    s.innerHTML = `
      <div class="modal-dim"></div>
      <div class="panel forge-panel">
        <div class="panel-head">
          <div>
            <div class="eyebrow">FORGERON</div>
            <h2>BRAN LE FORGERON</h2>
          </div>
          <div class="head-right">
            <span class="coin-line"><img src="${smallURL('coin')}" width="12" height="12"> ${p.gold}</span>
            <button class="close-btn" id="forge-close">✕</button>
          </div>
        </div>
        <p class="npc-quote">« L'acier, c'est comme la volonté. Ça se bat, ça se plie, et ça finit par couper plus fort. »</p>
        <div class="forge-list" id="forge-list"></div>
        <div class="panel-foot"><span class="shop-msg" id="forge-msg">${this.forgeMessage || ''}</span><span class="hint">Chaque amélioration est permanente.</span></div>
      </div>
    `;
    s.querySelector('#forge-close').addEventListener('click', () => this.close());
    this.renderForge(s);
  };

  UI.renderForge = function (s) {
    s = s || this.screenEl;
    if (!s) return;
    const p = this.game.player;
    const list = s.querySelector('#forge-list');
    clearNode(list);
    const rows = [
      { slot: 'weapon', label: 'ARME', bonus: '+2 ATQ par niveau' },
      { slot: 'armor', label: 'ARMURE', bonus: '+1 DEF et +2 PV par niveau' },
      { slot: 'trinket', label: 'TALISMAN', bonus: '+5 PV par niveau' }
    ];
    rows.forEach(r => {
      const id = p.equipment[r.slot];
      const g = D.GEAR_BY_ID[id];
      const lvl = p.upgrades[r.slot] || 0;
      const maxed = lvl >= 5;
      const cost = 50 + lvl * 45 + (g ? g.tier * 30 : 0);
      const row = el('div', 'forge-row');
      row.innerHTML = `<span class="forge-icon-slot"></span><div class="forge-info"><small>${r.label}</small><b style="color:${g ? D.RARITIES[g.rarity].color : '#c5ced8'}">${g ? g.name : 'Aucun objet'}</b><span>${r.bonus} · Forge ${lvl}/5</span></div>`;
      if (g) row.querySelector('.forge-icon-slot').appendChild(iconEl(id, 30));
      const btn = el('button', 'pixel-btn small' + (maxed ? ' ghost' : ' primary'), maxed ? 'MAX' : cost + ' OR');
      btn.disabled = maxed || !g || p.gold < cost;
      btn.addEventListener('click', () => {
        if (maxed || !g || p.gold < cost) { window.AudioSys.sfx('error'); return; }
        p.gold -= cost;
        p.upgrades[r.slot] = lvl + 1;
        p.recalc(false);
        this.forgeMessage = g.name + ' renforcé (' + (lvl + 1) + '/5).';
        window.AudioSys.sfx('save');
        this.game.fx.burst(p.x, p.y - 20, '#ffcf6a', 18, 120);
        this.game.saveSoon();
        const head = s.querySelector('.coin-line');
        if (head) head.innerHTML = `<img src="${smallURL('coin')}" width="12" height="12"> ${p.gold}`;
        this.renderForge(s);
        s.querySelector('#forge-msg').textContent = this.forgeMessage;
      });
      row.appendChild(btn);
      list.appendChild(row);
    });
  };

  /* ============================================================
     Carte
     ============================================================ */
  UI.buildMap = function (s) {
    const prog = bossProgress(this.game);
    const ex = this.game.getExploration ? this.game.getExploration() : {
      pct: 0, found: 0, total: 44, outposts: 0, outpostsTotal: 12,
      shrines: 0, shrinesTotal: 7, arenas: 0, arenasTotal: 18
    };
    const disc = this.game.discovery || { zones: {}, pois: {} };
    s.innerHTML = `
      <div class="modal-dim"></div>
      <div class="panel map-panel">
        <div class="panel-head">
          <div>
            <div class="eyebrow">CARTOGRAPHIE</div>
            <h2>LES SIX TERRES D'AURORE</h2>
          </div>
          <div class="head-right"><span class="map-pct">${ex.pct}% EXPLORÉ</span><button class="close-btn" id="map-close">✕</button></div>
        </div>
        <div class="map-body">
          <canvas id="map-canvas" width="432" height="280"></canvas>
          <div class="map-side">
            <div class="map-progress">
              <div class="big-count">${prog.bigDone}<span>/6</span></div>
              <div class="big-label">GARDIENS VAINCUS</div>
            </div>
            <div class="map-explore">
              <div class="explore-top"><span>EXPLORATION</span><b>${ex.pct}%</b></div>
              <div class="explore-bar"><i style="width:${ex.pct}%"></i></div>
              <div class="explore-detail"><span>Avant-postes ${ex.outposts}/${ex.outpostsTotal}</span><span>Sanctuaires ${ex.shrines}/${ex.shrinesTotal}</span></div>
            </div>
            <div class="map-legend">
              <div><i class="dot player"></i>Vous</div>
              <div><i class="dot camp"></i>Avant-poste</div>
              <div><i class="dot shrine"></i>Sanctuaire</div>
              <div><i class="dot mini"></i>Mini-boss</div>
              <div><i class="dot big"></i>Gardien</div>
              <div><i class="dot done"></i>Vaincu</div>
              <div><i class="dot final"></i>Monolithe</div>
            </div>
            <div class="map-zones">
              ${D.ZONES.map(z => {
                const known = !!(disc.zones && disc.zones[z.id]);
                return `<span class="${known ? '' : 'unknown'}" style="border-color:${known ? z.color + '66' : '#3a3344'}"><i style="background:${known ? z.color : '#4a4353'}"></i>${known ? z.short : '???'}</span>`;
              }).join('')}
            </div>
            <div class="map-tip">Approchez-vous des avant-postes, sanctuaires et arènes pour les révéler. Les terres inconnues restent dans l'ombre.</div>
          </div>
        </div>
        <div class="panel-foot"><span class="hint">M pour fermer · 480 × 480 tuiles · 4× la carte d'origine</span><span class="hint">${prog.done}/18 boss · ${ex.found}/${ex.total} lieux</span></div>
      </div>
    `;
    s.querySelector('#map-close').addEventListener('click', () => this.close());
    this.drawMap(s);
  };

  UI.drawMap = function (s) {
    s = s || this.screenEl;
    if (!s) return;
    const canvas = s.querySelector('#map-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const game = this.game;
    const disc = game.discovery || { zones: {}, pois: {} };
    const known = (kind, id) => game.isDiscovered ? game.isDiscovered(kind, id) : false;
    ctx.fillStyle = '#0d1018';
    ctx.fillRect(0, 0, w, h);
    game.world.drawMinimap(ctx, w, h, disc.zones || {});
    // voile
    ctx.fillStyle = 'rgba(12,10,18,0.1)';
    ctx.fillRect(0, 0, w, h);
    // grille de carte
    ctx.strokeStyle = 'rgba(255,236,190,0.045)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const gx = Math.round(w * i / 8) + 0.5, gy = Math.round(h * i / 8) + 0.5;
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }
    const sx = w / D.WORLD_SIZE, sy = h / D.WORLD_SIZE;
    const tx = D.TILE;
    const px = (x) => (x / tx) * sx;
    const py = (y) => (y / tx) * sy;

    // zones connues
    D.ZONES.forEach(z => {
      const x = px(z.anchor.x * tx + 8), y = py(z.anchor.y * tx + 8);
      if (disc.zones && disc.zones[z.id]) {
        Art.drawText(ctx, z.short, x, y, z.color, 1, true, 'center');
        Art.drawText(ctx, 'Nv ' + z.levelMin + '-' + z.levelMax, x, y + 9, '#e8dfc8', 1, true, 'center');
      } else {
        Art.drawText(ctx, '?', x, y, '#6a6276', 2, true, 'center');
      }
    });

    // avant-postes découverts
    game.world.outposts.forEach(o => {
      if (!known('outpost', o.id)) return;
      const x = Math.round(px(o.x)), y = Math.round(py(o.y));
      ctx.fillStyle = '#8ef0a8';
      ctx.fillRect(x - 2, y, 4, 2);
      ctx.fillRect(x - 1, y - 2, 2, 3);
      ctx.fillStyle = '#ffd76a';
      ctx.fillRect(x + 2, y + 1, 1, 1);
    });

    // sanctuaires découverts
    game.world.shrines.forEach(sh => {
      if (!known('shrine', sh.id)) return;
      ctx.fillStyle = '#8fe6e0';
      ctx.fillRect(px(sh.x) - 1, py(sh.y) - 3, 3, 7);
      ctx.fillRect(px(sh.x) - 3, py(sh.y) - 1, 7, 3);
    });

    // arènes découvertes
    game.world.arenas.forEach(a => {
      if (!known('arena', a.id)) return;
      const x = px(a.x), y = py(a.y);
      const isBig = a.kind === 'big';
      const r = isBig ? 5 : 3;
      if (a.defeated) {
        ctx.strokeStyle = '#7fe0a2'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3); ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3); ctx.stroke();
      } else {
        ctx.fillStyle = isBig ? '#ff7a5e' : '#ffbe5c';
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
        ctx.fillRect(-r / 2, -r / 2, r, r);
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,220,150,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.stroke();
      }
    });

    // monolithe, seulement s'il a été découvert
    if (known('final', 'final')) {
      const f = game.world.finalArena;
      const fx = px(f.x), fy = py(f.y);
      ctx.fillStyle = '#c08aff';
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(Math.PI / 4); ctx.fillRect(-4, -4, 8, 8); ctx.restore();
      ctx.strokeStyle = 'rgba(200,145,255,0.65)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(fx, fy, 8 + Math.sin(this.editorTime * 3) * 2, 0, Math.PI * 2); ctx.stroke();
    }

    // village
    const vx = px(game.world.village.x), vy = px(game.world.village.y);
    ctx.fillStyle = '#f0d89b'; ctx.fillRect(vx - 5, vy - 5, 10, 10);
    ctx.fillStyle = '#a8794b'; ctx.fillRect(vx - 3, vy - 3, 6, 6);
    ctx.fillStyle = '#79c8d6'; ctx.fillRect(vx - 1, vy - 1, 3, 3);

    // joueur (dans une maison : marqueur devant la porte)
    const mapPos = game.interior && game.interiorReturn ? game.interiorReturn : game.player;
    const plx = px(mapPos.x), ply = py(mapPos.y);
    const pulse = 4 + Math.sin(this.editorTime * 5) * 1.6;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(plx, ply, pulse + 3, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fffdf2';
    ctx.beginPath(); ctx.arc(plx, ply, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e3b950';
    ctx.fillRect(plx - 1, ply - 1, 2, 2);

    // boussole
    ctx.fillStyle = 'rgba(16,13,22,0.75)';
    ctx.fillRect(w - 30, 8, 22, 22);
    Art.drawText(ctx, 'N', w - 19, 12, '#ffd76a', 1, true, 'center');
    ctx.strokeStyle = '#cbbf9e'; ctx.beginPath(); ctx.moveTo(w - 19, 27); ctx.lineTo(w - 19, 19); ctx.stroke();
  };

  /* ============================================================
     Aide
     ============================================================ */
  UI.buildHelp = function (s) {
    s.innerHTML = `
      <div class="modal-dim"></div>
      <div class="panel help-panel">
        <div class="panel-head">
          <div><div class="eyebrow">MANUEL</div><h2>COMMANDES</h2></div>
          <div class="head-right"><button class="close-btn" id="help-close">✕</button></div>
        </div>
        <div class="help-body">
          <div class="help-cols">
            ${D.CONTROLS.map(([k, v]) => `<div class="help-row"><kbd>${k}</kbd><span>${v}</span></div>`).join('')}
          </div>
          <div class="help-tips">
            <h3>CONSEILS</h3>
            <p>Les mini-boss gardent les chemins secondaires. Les grands Gardiens ouvrent le monolithe.</p>
            <p>Esquivez avec K : vous êtes invulnérable un court instant. Les potions se choisissent selon les PV manquants.</p>
            <p>Dormez aux sanctuaires pour soigner et sauvegarder. Les boss reviennent si vous fuyez l'arène.</p>
            <p>Chaque biome vend et forge du matériel plus puissant. Revenez au village pour vous préparer.</p>
          </div>
        </div>
        <div class="panel-foot"><span class="hint">N coupe la musique · Échap ferme les menus</span><span class="hint">Jouez au clavier ou à la souris.</span></div>
      </div>
    `;
    s.querySelector('#help-close').addEventListener('click', () => this.close());
  };

  /* ============================================================
     Récompense
     ============================================================ */
  UI.buildReward = function (s, data) {
    const g = D.GEAR_BY_ID[data.gearId];
    if (!g) { this.close(); return; }
    const rar = D.RARITIES[g.rarity];
    s.innerHTML = `
      <div class="modal-dim"></div>
      <div class="panel reward-panel">
        <div class="reward-rays"></div>
        <div class="eyebrow">${data.title || 'OBJET TROUVÉ'}</div>
        <div class="reward-icon" id="reward-icon"></div>
        <h2 style="color:${rar.color}">${g.name}</h2>
        <div class="rarity" style="color:${rar.color}">${rar.name}</div>
        <p class="reward-desc">${g.desc}</p>
        <div class="reward-stats">${gearStatChips(g).map(c => `<span><small>${c.label}</small>${c.value}</span>`).join('')}</div>
        <button class="pixel-btn primary" id="reward-ok">RÉCUPÉRER</button>
      </div>
    `;
    s.querySelector('#reward-icon').appendChild(iconEl(g.id, 64));
    s.querySelector('#reward-ok').addEventListener('click', () => {
      window.AudioSys.sfx('pickup');
      this.close();
      if (data.onClose) data.onClose();
    });
  };

  /* ============================================================
     Mort / Victoire
     ============================================================ */
  UI.buildDeath = function (s) {
    const p = this.game.player;
    console.assert(p);
    s.innerHTML = `
      <div class="death-bg"></div>
      <div class="death-copy">
        <div class="eyebrow">LES TÉNÈBRES VOUS ONT REPRIS</div>
        <h1>VOUS ÊTES TOMBÉ</h1>
        <p>Aurore attend encore son héros. Le dernier sanctuaire vous rappelle.</p>
        <div class="death-stats">
          <div><span>Niveau</span><b>${p.level}</b></div>
          <div><span>Or perdu</span><b>${Math.floor(p.gold * 0.2)}</b></div>
          <div><span>Temps</span><b>${playTimeStr(p.playTime)}</b></div>
          <div><span>Créatures</span><b>${p.kills}</b></div>
        </div>
        <div class="menu-list">
          <button class="pixel-btn primary" id="death-respawn">RENAÎTRE AU SANCTUAIRE</button>
          <button class="pixel-btn ghost" id="death-title">QUITTER AU TITRE</button>
        </div>
      </div>
    `;
    s.querySelector('#death-respawn').addEventListener('click', () => {
      this.close({ silent: true });
      this.game.respawnPlayer();
    });
    s.querySelector('#death-title').addEventListener('click', () => {
      this.game.quitToTitle();
    });
  };

  UI.buildVictory = function (s) {
    const p = this.game.player;
    const prog = bossProgress(this.game);
    s.innerHTML = `
      <div class="victory-bg"></div>
      <div class="victory-copy">
        <div class="eyebrow">NYX EST TOMBÉ</div>
        <h1>L'AUBE SE LÈVE</h1>
        <p>Les six terres respirent à nouveau. Votre nom est gravé dans la lumière d'Aurore.</p>
        <div class="victory-crown" id="victory-crown"></div>
        <div class="victory-stats">
          <div><span>Héros</span><b>${p.name}</b></div>
          <div><span>Niveau</span><b>${p.level}</b></div>
          <div><span>Gardiens</span><b>${prog.bigDone}/6</b></div>
          <div><span>Créatures</span><b>${p.kills}</b></div>
          <div><span>Temps</span><b>${playTimeStr(p.playTime)}</b></div>
        </div>
        <div class="menu-list">
          <button class="pixel-btn primary" id="vic-continue">CONTINUER L'EXPLORATION</button>
          <button class="pixel-btn ghost" id="vic-title">RETOUR AU TITRE</button>
        </div>
        <div class="victory-note">Merci d'avoir joué. Chaque pixel a été dessiné par le jeu lui-même.</div>
      </div>
    `;
    s.querySelector('#victory-crown').appendChild(iconEl('couronne_aurore', 54));
    s.querySelector('#vic-continue').addEventListener('click', () => this.close());
    s.querySelector('#vic-title').addEventListener('click', () => this.game.quitToTitle());
  };

  /* ============================================================
     Dialogue
     ============================================================ */
  UI.showDialogue = function (speaker, lines, opts) {
    opts = opts || {};
    lines = Array.isArray(lines) ? lines : [lines];
    this.closeScreenAndKeep?.(null);
    if (this.screenEl && (this.modal === 'reward' || this.modal === 'death' || this.modal === 'victory')) return;
    if (this.screenEl) this.clearScreen();
    this.modal = 'dialogue';
    this.game.paused = true;
    this.dialog = {
      speaker: speaker || '',
      lines,
      index: 0,
      shown: 0,
      img: opts.img || null,
      onDone: opts.onDone || null,
      speed: opts.speed || 42
    };
    const layer = el('div', 'dialogue-layer');
    const box = el('div', 'dialogue-box');
    box.innerHTML = `
      <div class="portrait" id="dlg-portrait"></div>
      <div class="dialogue-text">
        <div class="speaker" id="dlg-speaker"></div>
        <p id="dlg-line"></p>
        <div class="dialogue-more" id="dlg-more">E / ESPACE ▸</div>
      </div>
    `;
    layer.appendChild(box);
    this.dialogEl = layer;
    this.root.appendChild(layer);
    const portrait = layer.querySelector('#dlg-portrait');
    if (opts.img) {
      const c = document.createElement('canvas');
      c.width = 66; c.height = 84;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const img = opts.img;
      const scale = Math.max(1, Math.min(3, Math.floor(58 / img.width)));
      const dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, Math.floor((66 - dw) / 2), Math.max(1, Math.floor((84 - dh) / 2)), dw, dh);
      portrait.appendChild(c);
    } else {
      portrait.classList.add('empty');
      portrait.innerHTML = '<span>?</span>';
    }
    layer.querySelector('#dlg-speaker').textContent = speaker || '';
    box.addEventListener('click', () => this.advanceDialogue());
    this.updateDialogueDom();
  };

  UI.updateDialogueDom = function () {
    if (!this.dialog || !this.dialogEl) return;
    const d = this.dialog;
    const line = d.lines[d.index] || '';
    const n = Math.floor(d.shown);
    const elLine = this.dialogEl.querySelector('#dlg-line');
    const elSpeaker = this.dialogEl.querySelector('#dlg-speaker');
    if (elLine) elLine.textContent = line.slice(0, n);
    if (elSpeaker) elSpeaker.textContent = d.speaker;
    const more = this.dialogEl.querySelector('#dlg-more');
    if (more) more.style.opacity = n >= line.length ? 1 : 0;
  };

  UI.advanceDialogue = function () {
    if (!this.dialog) return;
    const d = this.dialog;
    const line = d.lines[d.index] || '';
    if (d.shown < line.length) {
      d.shown = line.length;
      this.updateDialogueDom();
      return;
    }
    d.index++;
    d.shown = 0;
    if (d.index >= d.lines.length) {
      this.closeDialogue(false);
      if (d.onDone) d.onDone();
      return;
    }
    window.AudioSys.sfx('click');
    this.updateDialogueDom();
  };

  UI.closeDialogue = function (skip) {
    if (this.dialogEl) this.dialogEl.remove();
    this.dialogEl = null;
    this.dialog = null;
    if (this.modal === 'dialogue') this.modal = null;
    if (this.game && !this.screenEl) this.game.paused = false;
    if (skip && this.dialog && this.dialog.onDone) {
      // unreachable, conservé pour sécurité
    }
  };

  UI.handleKey = function (code) {
    if (this.dialog) {
      if (code === 'KeyE' || code === 'Space' || code === 'Enter' || code === 'Mouse0') { this.advanceDialogue(); return true; }
      if (code === 'Escape') { this.closeDialogue(true); return true; }
      return true;
    }
    if (!this.modal) return false;
    if (code === 'Escape') return this.handleEscape();
    if (code === 'KeyI' || code === 'Tab') {
      if (this.modal === 'inventory') { this.handleEscape(); return true; }
      if (this.modal === 'pause') { this.open('inventory', { from: 'pause' }); return true; }
      if (this.game.state === 'playing') { this.open('inventory', { from: null }); return true; }
    }
    if (code === 'KeyM') {
      if (this.modal === 'map') { this.handleEscape(); return true; }
      if (this.modal === 'pause') { this.open('map', { from: 'pause' }); return true; }
      if (this.game.state === 'playing') { this.open('map'); return true; }
    }
    return true;
  };

  /* ============================================================
     Toast, bannière, notifications
     ============================================================ */
  UI.toast = function (text, color) {
    this.toasts.push({ text, color: color || '#f6ecd2', life: 2.8, max: 2.8 });
    if (this.toasts.length > 5) this.toasts.shift();
  };

  UI.showBanner = function (title, subtitle, color) {
    this.banner = { title, subtitle: subtitle || '', color: color || '#ffd76a', life: 3.6, max: 3.6 };
  };

  /* ============================================================
     Mise à jour
     ============================================================ */
  UI.update = function (dt) {
    this.editorTime += dt;
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      this.toasts[i].life -= dt;
      if (this.toasts[i].life <= 0) this.toasts.splice(i, 1);
    }
    if (this.banner) {
      this.banner.life -= dt;
      if (this.banner.life <= 0) this.banner = null;
    }
    if (this.modal === 'editor') this.drawEditorPreview();
    if (this.dialog) {
      const d = this.dialog;
      const line = d.lines[d.index] || '';
      if (d.shown < line.length) {
        d.shown = Math.min(line.length, d.shown + dt * d.speed);
        this.updateDialogueDom();
      }
    }
  };

  /* ============================================================
     HUD
     ============================================================ */
  function panel(ctx, x, y, w, h, alpha) {
    ctx.fillStyle = 'rgba(17,14,23,' + (alpha || 0.78) + ')';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,236,194,0.16)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = 'rgba(255,236,194,0.08)';
    ctx.fillRect(x + 1, y + 1, w - 2, 1);
  }

  UI.drawHUD = function (ctx, game) {
    const p = game.player;
    if (!p) return;

    // panneau gauche
    panel(ctx, 8, 8, 186, 54, 0.78);
    Art.drawText(ctx, (p.cls.name || '').toUpperCase(), 14, 13, '#ffe0a0', 1, true);
    Art.drawText(ctx, 'Nv ' + p.level, 188, 13, '#f4ecd9', 1, true, 'right');

    const barX = 14, barW = 126;
    // PV
    ctx.fillStyle = '#3b2029';
    ctx.fillRect(barX, 24, barW, 7);
    const hpFrac = U.clamp(p.hp / p.maxHp, 0, 1);
    ctx.fillStyle = hpFrac > 0.5 ? '#d9525b' : hpFrac > 0.25 ? '#e08a46' : '#ff5548';
    ctx.fillRect(barX, 24, Math.round(barW * hpFrac), 7);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(barX, 24, Math.round(barW * hpFrac), 2);
    Art.drawText(ctx, Math.ceil(p.hp) + '/' + p.maxHp, 188, 24, '#f6e8dd', 1, true, 'right');
    // endurance
    ctx.fillStyle = '#1e3534';
    ctx.fillRect(barX, 34, barW, 4);
    ctx.fillStyle = '#64d6b0';
    ctx.fillRect(barX, 34, Math.round(barW * U.clamp(p.stamina / p.maxStamina, 0, 1)), 4);
    // XP
    const need = p.xpToNext();
    ctx.fillStyle = '#2a2038';
    ctx.fillRect(barX, 41, 174, 3);
    ctx.fillStyle = '#b586ff';
    ctx.fillRect(barX, 41, Math.round(174 * U.clamp(p.xp / need, 0, 1)), 3);

    // panneau droit
    panel(ctx, 470, 8, 162, 40, 0.72);
    const zone = game.interior
      ? { short: game.interior.short, color: '#ffd8a0' }
      : game.currentZone();
    Art.drawText(ctx, zone.short, 626, 14, zone.color, 1, true, 'right');
    Art.drawText(ctx, 'OR ' + p.gold, 478, 27, '#ffd76a', 1, true);
    const potTotal = (p.potions.petite || 0) + (p.potions.potion || 0) + (p.potions.elixir || 0);
    Art.drawText(ctx, 'POTIONS ' + potTotal, 626, 27, '#f0b7c7', 1, true, 'right');
    Art.drawText(ctx, 'BOSS ' + game.bigBossesDefeated() + '/6', 478, 37, '#c9b6e8', 1, true);

    // aide contrôles
    ctx.globalAlpha = 0.72;
    const hint = game.interior
      ? 'E INTERAGIR   H POTION   I SAC   ÉCHAP MENU'
      : 'J ATTAQUER   K ESQUIVER   E INTERAGIR   I SAC   M CARTE';
    Art.drawText(ctx, hint, 320, 347, '#e7ddc8', 1, true, 'center');
    ctx.globalAlpha = 1;

    // boss
    const boss = game.activeBoss;
    if (boss && !boss.dead) {
      const bw = 300, bx = (640 - bw) / 2, by = 307;
      panel(ctx, bx - 10, by - 18, bw + 20, 38, 0.82);
      Art.drawText(ctx, boss.def.name.toUpperCase(), 320, by - 11, boss.enraged ? '#ff9b7a' : '#ffe0a0', 2, true, 'center');
      Art.drawText(ctx, boss.def.title || '', 320, by + 4, '#d9c9b0', 1, true, 'center');
      ctx.fillStyle = '#301e28';
      ctx.fillRect(bx, by + 12, bw, 6);
      const frac = U.clamp(boss.hp / boss.maxHp, 0, 1);
      ctx.fillStyle = boss.enraged ? '#ff6e5a' : '#d94f63';
      ctx.fillRect(bx, by + 12, Math.round(bw * frac), 6);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(bx, by + 12, Math.round(bw * frac), 2);
      Art.drawText(ctx, Math.ceil(boss.hp) + ' / ' + boss.maxHp, 320, by + 22, '#f2e4d2', 1, true, 'center');
    }

    // prompt d'interaction
    if (game.prompt) {
      const text = game.prompt;
      const w = Art.textWidth(text, 1) + 20;
      const py = game.interior ? 318 : 286;
      panel(ctx, 320 - w / 2, py, w, 16, 0.8);
      Art.drawText(ctx, text, 320, py + 4, '#ffebbe', 1, true, 'center');
    }

    // toasts
    this.toasts.forEach((t, i) => {
      const alpha = Math.min(1, t.life * 2) * Math.min(1, (t.max - t.life) * 4);
      ctx.globalAlpha = alpha;
      const tw = Art.textWidth(t.text, 1) + 18;
      panel(ctx, 320 - tw / 2, 68 + i * 17, tw, 14, 0.72);
      Art.drawText(ctx, t.text, 320, 72 + i * 17, t.color, 1, true, 'center');
      ctx.globalAlpha = 1;
    });

    // bannière de zone
    if (this.banner) {
      const b = this.banner;
      const a = Math.min(1, (b.max - b.life) * 2, b.life * 1.5);
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(16,12,22,0.72)';
      ctx.fillRect(0, 132, 640, 66);
      ctx.fillStyle = U.rgba(b.color, 0.5);
      ctx.fillRect(0, 132, 640, 1);
      ctx.fillRect(0, 197, 640, 1);
      Art.drawText(ctx, b.title, 320, 148, b.color, 3, true, 'center');
      if (b.subtitle) Art.drawText(ctx, b.subtitle, 320, 172, '#f0e8d4', 2, true, 'center');
      ctx.globalAlpha = 1;
    }

    // vignette / dégâts
    if (p.hitFlash > 0) {
      ctx.fillStyle = 'rgba(190,40,50,' + (p.hitFlash * 0.28) + ')';
      ctx.fillRect(0, 0, 640, 360);
    }
  };

  /* ============================================================
     Fond de titre
     ============================================================ */
  UI.drawTitleArt = function (ctx, time) {
    const w = 640, h = 360;
    // ciel
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1a1733');
    g.addColorStop(0.38, '#41365e');
    g.addColorStop(0.62, '#9b5f74');
    g.addColorStop(0.82, '#e6976b');
    g.addColorStop(1, '#f6c47e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // étoiles
    for (let i = 0; i < 45; i++) {
      const sx = (i * 137.5) % w;
      const sy = (i * 61.7) % 150;
      const tw = 0.4 + Math.sin(time * 1.5 + i) * 0.3;
      ctx.globalAlpha = Math.max(0, tw);
      ctx.fillStyle = i % 5 === 0 ? '#ffe8b0' : '#f2edff';
      ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
    }
    ctx.globalAlpha = 1;

    // soleil
    const sunX = 492, sunY = 152;
    const glow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 120);
    glow.addColorStop(0, 'rgba(255,241,190,0.95)');
    glow.addColorStop(0.18, 'rgba(255,207,128,0.7)');
    glow.addColorStop(0.5, 'rgba(239,147,100,0.22)');
    glow.addColorStop(1, 'rgba(239,147,100,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - 120, sunY - 120, 240, 240);
    ctx.fillStyle = '#ffeaa8';
    ctx.beginPath(); ctx.arc(sunX, sunY, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8d8';
    ctx.beginPath(); ctx.arc(sunX - 8, sunY - 8, 20, 0, Math.PI * 2); ctx.fill();

    // nuages pixel
    const clouds = [
      { x: 60, y: 64, w: 90, a: 0.16 },
      { x: 240, y: 102, w: 120, a: 0.2 },
      { x: 420, y: 58, w: 70, a: 0.12 },
      { x: 500, y: 108, w: 110, a: 0.18 }
    ];
    clouds.forEach((c, i) => {
      const cx = ((c.x + time * (4 + i)) % 760) - 60;
      ctx.globalAlpha = c.a;
      ctx.fillStyle = i % 2 ? '#ffe1cf' : '#ffd0b8';
      for (let k = 0; k < 5; k++) {
        const cw = c.w * (0.3 + (k % 3) * 0.18);
        ctx.fillRect(Math.round(cx + k * c.w * 0.2), Math.round(c.y + (k % 2) * 6), Math.round(cw), 10);
      }
      ctx.globalAlpha = 1;
    });

    // montagnes lointaines
    ctx.fillStyle = '#5a4767';
    ctx.beginPath();
    ctx.moveTo(0, 224);
    ctx.lineTo(58, 148); ctx.lineTo(110, 196); ctx.lineTo(168, 128); ctx.lineTo(232, 198);
    ctx.lineTo(292, 152); ctx.lineTo(360, 206); ctx.lineTo(430, 138); ctx.lineTo(500, 198);
    ctx.lineTo(560, 160); ctx.lineTo(640, 216); ctx.lineTo(640, 260); ctx.lineTo(0, 260);
    ctx.closePath(); ctx.fill();
    // neige sur les pics
    ctx.fillStyle = '#b79ab7';
    [[58, 148], [168, 128], [292, 152], [430, 138], [560, 160]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 15); ctx.lineTo(x - 3, y + 12); ctx.lineTo(x + 3, y + 16); ctx.lineTo(x + 10, y + 13); ctx.closePath(); ctx.fill();
    });

    // collines
    ctx.fillStyle = '#3e5947';
    ctx.beginPath();
    ctx.moveTo(0, 258); ctx.quadraticCurveTo(120, 220, 250, 252); ctx.quadraticCurveTo(380, 280, 500, 244); ctx.quadraticCurveTo(580, 226, 640, 246); ctx.lineTo(640, 360); ctx.lineTo(0, 360); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#49694f';
    ctx.beginPath();
    ctx.moveTo(0, 286); ctx.quadraticCurveTo(150, 254, 300, 282); ctx.quadraticCurveTo(460, 306, 640, 272); ctx.lineTo(640, 360); ctx.lineTo(0, 360); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#577a56';
    ctx.beginPath();
    ctx.moveTo(0, 318); ctx.quadraticCurveTo(170, 292, 340, 318); ctx.quadraticCurveTo(500, 340, 640, 310); ctx.lineTo(640, 360); ctx.lineTo(0, 360); ctx.closePath(); ctx.fill();

    // village lointain
    const vx = 468, vy = 256;
    ctx.fillStyle = '#2e3c36';
    ctx.fillRect(vx - 4, vy - 34, 8, 34);
    ctx.fillStyle = '#3a4b40';
    ctx.fillRect(vx - 6, vy - 38, 12, 5);
    for (let i = 0; i < 5; i++) {
      const bx = vx - 70 + i * 27;
      const bh = 12 + (i % 3) * 5;
      ctx.fillStyle = i % 2 ? '#3a4a42' : '#33423b';
      ctx.fillRect(bx, vy - bh, 15, bh);
      ctx.fillStyle = '#2a3733';
      ctx.beginPath(); ctx.moveTo(bx - 3, vy - bh); ctx.lineTo(bx + 7, vy - bh - 9); ctx.lineTo(bx + 18, vy - bh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,196,110,0.7)';
      ctx.fillRect(bx + 4, vy - bh + 5, 2, 2);
      ctx.fillRect(bx + 10, vy - bh + 5, 2, 2);
    }
    // tour du hall
    ctx.fillStyle = '#33413c';
    ctx.fillRect(vx + 36, vy - 52, 16, 52);
    ctx.fillStyle = '#3d4d47';
    ctx.beginPath(); ctx.moveTo(vx + 30, vy - 52); ctx.lineTo(vx + 44, vy - 70); ctx.lineTo(vx + 58, vy - 52); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,130,0.8)';
    ctx.fillRect(vx + 41, vy - 34, 4, 5);

    // arbres silhouettes
    const treeAt = (x, y, s) => {
      ctx.fillStyle = '#24352d';
      ctx.fillRect(x - 2 * s, y - 12 * s, 4 * s, 12 * s);
      ctx.beginPath(); ctx.moveTo(x, y - 34 * s); ctx.lineTo(x - 13 * s, y - 12 * s); ctx.lineTo(x + 13 * s, y - 12 * s); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y - 44 * s); ctx.lineTo(x - 10 * s, y - 25 * s); ctx.lineTo(x + 10 * s, y - 25 * s); ctx.closePath(); ctx.fill();
    };
    treeAt(56, 298, 1.3); treeAt(88, 306, 0.9); treeAt(596, 302, 1.1); treeAt(622, 312, 0.8);

    // chemin
    ctx.fillStyle = '#b88b5c';
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(180, 360); ctx.lineTo(250, 360); ctx.lineTo(360, 300); ctx.lineTo(352, 292); ctx.lineTo(232, 360);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;

    // premier plan d'herbes
    ctx.fillStyle = '#698a52';
    ctx.fillRect(0, 340, 640, 20);
    for (let i = 0; i < 130; i++) {
      const gx = (i * 97.3) % 640;
      const gy = 332 + (i * 37.1) % 28;
      const sway = Math.sin(time * 1.6 + i * 0.4) * 1.4;
      ctx.strokeStyle = i % 3 ? '#7fa45c' : '#88b566';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, gy + 6);
      ctx.quadraticCurveTo(gx + sway, gy, gx + sway + 1, gy - 5);
      ctx.stroke();
    }

    // lucioles
    for (let i = 0; i < 14; i++) {
      const fx = 340 + (i * 53.7) % 290;
      const fy = 250 + Math.sin(time * 0.8 + i * 1.7) * 28 + (i * 13) % 50;
      ctx.globalAlpha = 0.4 + Math.sin(time * 2.3 + i) * 0.3;
      ctx.fillStyle = '#ffe89a';
      ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1);
    }
    ctx.globalAlpha = 1;

    // oiseaux
    for (let i = 0; i < 4; i++) {
      const bx = 330 + i * 34 + Math.sin(time * 0.35 + i) * 14;
      const by = 92 + i * 12;
      const flap = Math.sin(time * 5 + i * 2) * 2;
      ctx.strokeStyle = 'rgba(40,30,50,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx - 4, by - flap);
      ctx.quadraticCurveTo(bx - 1, by - 2, bx, by);
      ctx.quadraticCurveTo(bx + 1, by - 2, bx + 4, by - flap);
      ctx.stroke();
    }

    // voile sombre à gauche pour le texte
    const vg = ctx.createLinearGradient(0, 0, 420, 0);
    vg.addColorStop(0, 'rgba(13,11,20,0.82)');
    vg.addColorStop(0.55, 'rgba(13,11,20,0.45)');
    vg.addColorStop(1, 'rgba(13,11,20,0)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 460, 360);
    // vignette globale
    const vg2 = ctx.createRadialGradient(320, 180, 160, 320, 180, 430);
    vg2.addColorStop(0, 'rgba(0,0,0,0)');
    vg2.addColorStop(1, 'rgba(5,4,9,0.55)');
    ctx.fillStyle = vg2;
    ctx.fillRect(0, 0, 640, 360);
  };

  UI.drawEditorBg = function (ctx, time) {
    const w = 640, h = 360;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#101423');
    g.addColorStop(0.6, '#182033');
    g.addColorStop(1, '#0d111a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // halo
    const rg = ctx.createRadialGradient(260, 170, 20, 260, 170, 280);
    rg.addColorStop(0, 'rgba(95,130,190,0.25)');
    rg.addColorStop(1, 'rgba(95,130,190,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
    // runes
    for (let i = 0; i < 26; i++) {
      const x = (i * 83 + 23) % w;
      const y = (i * 47 + 11) % h;
      const a = 0.08 + Math.sin(time + i) * 0.05;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = i % 3 ? '#9fd8ff' : '#ffe3a0';
      ctx.fillRect(x, y, 1, 3);
      ctx.fillRect(x - 1, y + 1, 3, 1);
    }
    ctx.globalAlpha = 1;
  };

  window.UI = UI;
})();
