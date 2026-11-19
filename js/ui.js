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
    selectedMaterialId: null,
    selectedQuestId: null,
    shopVendorId: null,
    shopMessage: '',
    forgeMessage: '',
    mapPois: [],
    mapHover: null,
    mapClock: 0,
    mapFogCache: null
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

  function materialURL(id) {
    const key = 'material:' + id;
    if (iconCache.has(key)) return iconCache.get(key);
    const c = Art.materialIcon(id);
    const url = c.toDataURL();
    iconCache.set(key, url);
    return url;
  }

  function materialEl(id, size) {
    const img = new Image();
    img.src = materialURL(id);
    img.width = size;
    img.height = size;
    img.className = 'pixel-icon';
    img.alt = '';
    img.draggable = false;
    return img;
  }

  function questStatusMeta(status) {
    switch (status) {
      case 'active': return { label: 'EN COURS', color: '#ffd76a' };
      case 'ready': return { label: 'À RENDRE', color: '#8ef0a8' };
      case 'done': return { label: 'ACCOMPLIE', color: '#91c9a2' };
      default: return { label: 'À DÉCOUVRIR', color: '#9d91ad' };
    }
  }

  function truncateText(text, max) {
    text = String(text || '');
    return text.length > max ? text.slice(0, Math.max(1, max - 2)) + '..' : text;
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
      case 'journal': this.buildJournal(s); break;
      case 'shop': this.buildShop(s, data); break;
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
        <div class="title-note">v1.5 · héros sur mesure</div>
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
  const EDITOR_TABS = [
    { id: 'classe', label: 'CLASSE' },
    { id: 'corps', label: 'CORPS' },
    { id: 'visage', label: 'VISAGE' },
    { id: 'cheveux', label: 'CHEVEUX' },
    { id: 'tenue', label: 'TENUE' },
    { id: 'accessoires', label: 'ACCESS.' },
    { id: 'aura', label: 'AURA' },
    { id: 'origine', label: 'ORIGINE' }
  ];

  function originBonusText(o) {
    const parts = [];
    if (o.hp) parts.push('PV +' + o.hp);
    if (o.def) parts.push('DEF +' + o.def);
    if (o.spd) parts.push('VIT +' + Math.round(o.spd * 100) + '%');
    if (o.crit) parts.push('CRIT +' + Math.round(o.crit * 100) + '%');
    if (o.stamina) parts.push('END +' + o.stamina);
    if (o.xp) parts.push('XP +' + Math.round(o.xp * 100) + '%');
    return parts.join(' · ');
  }

  UI.buildEditor = function (s) {
    this.editorTime = 0;
    this.editorTab = 'corps';
    this.editorSpinIndex = 0;
    this.editorAutoSpin = true;
    this.editorState = {
      classId: 'epeiste',
      originId: 'aurore',
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
          <div class="editor-head-actions">
            <div class="editor-step">APERÇU ANIMÉ</div>
            <button class="quick-btn" id="ed-random">HASARD</button>
            <button class="quick-btn" id="ed-default">DÉFAUT</button>
          </div>
        </div>
        <div class="editor-body">
          <div class="editor-left">
            <div class="preview-frame">
              <div class="preview-checker"></div>
              <canvas id="ed-preview" width="160" height="184"></canvas>
              <div class="preview-label" id="ed-preview-label">ÉPÉISTE</div>
              <div class="preview-hint">CLIC · TOURNER</div>
            </div>
            <div class="name-row">
              <div class="name-field">
                <label class="field-label" for="ed-name">NOM</label>
                <input id="ed-name" class="pixel-input" maxlength="12" value="Aurore" autocomplete="off" spellcheck="false">
              </div>
              <button class="dice-btn" id="ed-dice" title="Nom aléatoire">DÉ</button>
            </div>
          </div>
          <div class="editor-right">
            <div class="editor-summary" id="ed-summary"></div>
            <div class="ed-tabs" id="ed-tabs"></div>
            <div class="ed-tab-body" id="ed-tab-body"></div>
          </div>
        </div>
        <div class="editor-actions">
          <button class="pixel-btn ghost" id="ed-back">RETOUR</button>
          <div class="editor-hint">Classe et origine fixent les statistiques. Le reste est libre.</div>
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

    this.editorPreview.addEventListener('click', () => {
      window.AudioSys.sfx('click');
      this.editorAutoSpin = false;
      this.editorSpinIndex = ((this.editorSpinIndex || 0) + 1) % 4;
    });

    s.querySelector('#ed-dice').addEventListener('click', () => {
      const names = D.HERO_NAMES || ['Aurore'];
      let pick = names[Math.floor(Math.random() * names.length)];
      if (names.length > 1 && pick === nameInput.value) pick = names[(names.indexOf(pick) + 1) % names.length];
      nameInput.value = pick;
      this.editorState.name = pick;
      window.AudioSys.sfx('click');
    });

    s.querySelector('#ed-random').addEventListener('click', () => {
      const rnd = arr => Math.floor(Math.random() * arr.length);
      const look = this.editorState.look;
      look.skin = rnd(D.SKINS);
      look.hair = rnd(D.HAIRS);
      look.hairColor = rnd(D.HAIR_COLORS);
      look.eye = rnd(D.EYE_COLORS);
      look.shirt = rnd(D.SHIRT_COLORS);
      look.pants = rnd(D.PANTS_COLORS);
      look.build = rnd(D.BUILDS);
      look.beard = rnd(D.BEARDS);
      look.marks = rnd(D.MARKS);
      look.outfit = rnd(D.OUTFITS);
      look.accessory = rnd(D.ACCESSORIES);
      look.accessoryColor = rnd(D.ACCESSORY_COLORS);
      look.aura = rnd(D.AURAS);
      this.editorState.originId = D.ORIGINS[rnd(D.ORIGINS)].id;
      this.editorAutoSpin = false;
      this.editorSpinIndex = 0;
      window.AudioSys.sfx('click');
      this.renderEditorTab(s);
      this.updateEditorClassDesc(s);
      this.drawEditorPreview();
    });

    s.querySelector('#ed-default').addEventListener('click', () => {
      this.editorState.look = Object.assign({}, D.DEFAULT_LOOK);
      this.editorState.originId = 'aurore';
      this.editorAutoSpin = false;
      this.editorSpinIndex = 0;
      window.AudioSys.sfx('click');
      this.renderEditorTab(s);
      this.updateEditorClassDesc(s);
      this.drawEditorPreview();
    });

    this.renderEditorTabs(s);
    this.renderEditorTab(s);
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

  UI.renderEditorTabs = function (s) {
    const wrap = s.querySelector('#ed-tabs');
    clearNode(wrap);
    EDITOR_TABS.forEach(tab => {
      const b = el('button', 'ed-tab' + (this.editorTab === tab.id ? ' selected' : ''), tab.label);
      b.addEventListener('click', () => {
        this.editorTab = tab.id;
        this.editorAutoSpin = false;
        this.editorSpinIndex = 0;
        window.AudioSys.sfx('click');
        this.renderEditorTabs(s);
        this.renderEditorTab(s);
      });
      wrap.appendChild(b);
    });
  };

  UI.renderEditorClasses = function (s) {
    const row = s.querySelector('#ed-classes');
    if (!row) return;
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
        this.renderEditorTab(s);
        this.updateEditorClassDesc(s);
        this.drawEditorPreview();
      });
      row.appendChild(card);
    });
  };

  UI.updateEditorClassDesc = function (s) {
    const st = this.editorState;
    const cls = D.CLASSES.find(c => c.id === st.classId) || D.CLASSES[0];
    const origin = D.ORIGINS.find(o => o.id === st.originId) || D.ORIGINS[0];
    const label = s.querySelector('#ed-preview-label');
    if (label) label.textContent = cls.name.toUpperCase();
    const summary = s.querySelector('#ed-summary');
    if (summary) {
      const hp = cls.hp + (origin.hp || 0);
      const def = cls.def + (origin.def || 0);
      const spd = Math.round(cls.spd * (1 + (origin.spd || 0)));
      const crit = Math.round((cls.crit + (origin.crit || 0)) * 100);
      summary.innerHTML =
        `<div class="summary-top"><b style="color:${cls.color}">${cls.name}</b><i>·</i><b class="summary-origin">${origin.name}</b></div>` +
        `<div class="summary-stats">PV <b>${hp}</b> · ATQ <b>${cls.atk}</b> · DEF <b>${def}</b> · VIT <b>${spd}</b> · CRIT <b>${crit}%</b></div>`;
    }
  };

  UI.renderEditorTab = function (s) {
    const wrap = s.querySelector('#ed-tab-body');
    if (!wrap) return;
    clearNode(wrap);
    const look = this.editorState.look;
    const rerender = () => {
      this.editorAutoSpin = false;
      this.editorSpinIndex = 0;
      this.renderEditorTab(s);
      this.updateEditorClassDesc(s);
      this.drawEditorPreview();
    };
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
          rerender();
        });
        opts.appendChild(b);
      });
      row.appendChild(lab);
      row.appendChild(opts);
      wrap.appendChild(row);
    };
    const addNote = (text) => {
      const p = el('p', 'ed-tab-note', text);
      wrap.appendChild(p);
    };
    const addTitle = (title, note) => {
      const t = el('div', 'ed-section-title');
      t.innerHTML = `<span>${title}</span><small>${note || ''}</small>`;
      wrap.appendChild(t);
    };

    if (this.editorTab === 'classe') {
      addTitle('CLASSE', 'Trois styles de combat');
      const row = el('div', 'class-row');
      row.id = 'ed-classes';
      wrap.appendChild(row);
      this.renderEditorClasses(s);
      const cls = D.CLASSES.find(c => c.id === this.editorState.classId) || D.CLASSES[0];
      const desc = el('p', 'ed-tab-note');
      desc.innerHTML = `<b style="color:${cls.color}">${cls.name}</b> — ${cls.desc}`;
      wrap.appendChild(desc);
      addNote('La classe fixe vos PV, votre attaque, votre défense et votre vitesse de base. L’origine s’y ajoute.');
    } else if (this.editorTab === 'corps') {
      addTitle('SILHOUETTE', 'Torse et carrure');
      addRow('CORPULENCE', D.BUILDS, look.build, v => look.build = v, false);
      addTitle('PEAU', D.SKINS.length + ' teintes');
      addRow('TEINT', D.SKINS, look.skin, v => look.skin = v, true);
      addNote('La silhouette élargit ou affine le torse et déplace les bras. La teinte de peau est libre.');
    } else if (this.editorTab === 'visage') {
      addTitle('YEUX', D.EYE_COLORS.length + ' iris');
      addRow('IRIS', D.EYE_COLORS, look.eye, v => look.eye = v, true);
      addTitle('BARBE', 'Six coupes');
      addRow('BARBE', D.BEARDS, look.beard, v => look.beard = v, false);
      addTitle('MARQUES', 'Visage marqué');
      addRow('MARQUE', D.MARKS, look.marks, v => look.marks = v, false);
      addNote('La peinture de guerre et le tatouage reprennent la couleur de votre accessoire.');
    } else if (this.editorTab === 'cheveux') {
      addTitle('COIFFURE', D.HAIRS.length + ' styles');
      addRow('STYLE', D.HAIRS, look.hair, v => look.hair = v, false);
      addTitle('COULEUR', D.HAIR_COLORS.length + ' teintes');
      addRow('CHEVEUX', D.HAIR_COLORS, look.hairColor, v => look.hairColor = v, true);
      addNote('Les coiffures longues, tressées ou en couettes bougent avec chaque pas.');
    } else if (this.editorTab === 'tenue') {
      addTitle('STYLE DE TENUE', 'Quatre coupes');
      addRow('STYLE', D.OUTFITS, look.outfit, v => look.outfit = v, false);
      addTitle('HAUT', D.SHIRT_COLORS.length + ' couleurs');
      addRow('HAUT', D.SHIRT_COLORS, look.shirt, v => look.shirt = v, true);
      addTitle('BAS', D.PANTS_COLORS.length + ' couleurs');
      addRow('BAS', D.PANTS_COLORS, look.pants, v => look.pants = v, true);
      addNote('Tunique longue, tablier ou cuirasse : chaque style change la silhouette du vêtement.');
    } else if (this.editorTab === 'accessoires') {
      addTitle('ACCESSOIRE', D.ACCESSORIES.length + ' pièces');
      addRow('PIÈCE', D.ACCESSORIES, look.accessory, v => look.accessory = v, false);
      addTitle('COULEUR', D.ACCESSORY_COLORS.length + ' teintes');
      addRow('TEINTE', D.ACCESSORY_COLORS, look.accessoryColor, v => look.accessoryColor = v, true);
      addNote('Béret, plume, collier, sacoche ou carquois : les pièces se dessinent devant ou derrière le héros.');
    } else if (this.editorTab === 'aura') {
      addTitle('AURA', 'Huit ambiances');
      const opts = el('div', 'aura-options');
      D.AURAS.forEach((aura, idx) => {
        const b = el('button', 'look-chip aura-chip' + (idx === look.aura ? ' selected' : ''));
        b.innerHTML = (aura.color
          ? `<i style="background:${aura.color}"></i>`
          : `<i class="aura-none"></i>`) + `<span>${aura.name}</span>`;
        b.addEventListener('click', () => {
          look.aura = idx;
          window.AudioSys.sfx('click');
          rerender();
        });
        opts.appendChild(b);
      });
      wrap.appendChild(opts);
      addNote('L\'aura entoure le héros en jeu : lueur au sol et particules colorées.');
    } else if (this.editorTab === 'origine') {
      addTitle('ORIGINE', 'Votre passé');
      const grid = el('div', 'origin-grid');
      D.ORIGINS.forEach(o => {
        const card = el('button', 'origin-card' + (this.editorState.originId === o.id ? ' selected' : ''));
        card.innerHTML = `
          <span class="origin-icon">${o.icon}</span>
          <span class="origin-copy">
            <b>${o.name}</b>
            <small>${o.desc}</small>
            <em>${originBonusText(o)}</em>
          </span>
        `;
        card.addEventListener('click', () => {
          this.editorState.originId = o.id;
          window.AudioSys.sfx('click');
          rerender();
        });
        grid.appendChild(card);
      });
      wrap.appendChild(grid);
      addNote('L\'origine s\'ajoute aux statistiques de la classe et modifie votre façon de progresser.');
    }
  };

  UI.drawEditorPreview = function () {
    if (!this.editorPreview || !this.editorState) return;
    const c = this.editorPreview;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    const t = this.editorTime;
    const look = this.editorState.look;
    const sheet = Art.playerSheet(look);
    // rotation douce de la vue, figée dès qu'on clique sur l'aperçu
    const seq = [0, 2, 3, 1];
    if (this.editorAutoSpin !== false) this.editorSpinIndex = Math.floor(t / 2.6) % 4;
    const dir = seq[(this.editorSpinIndex || 0) % 4];
    const frame = Math.floor(t * 4) % 3;
    const img = sheet.frames[dir][frame] || sheet.frames[dir][0];
    const cx = W / 2, feet = H - 26;
    const bob = Math.sin(t * 2.4) * 1.4;
    // sol
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#1b2638';
    ctx.beginPath(); ctx.ellipse(cx, feet + 4, 42, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#2a3a52';
    ctx.beginPath(); ctx.ellipse(cx, feet + 2, 31, 7, 0, 0, Math.PI * 2); ctx.fill();
    // aura
    const auraDef = D.AURAS[look.aura] || D.AURAS[0];
    if (auraDef.color) {
      const pulse = 0.7 + Math.sin(t * 2.2) * 0.3;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createRadialGradient(cx, feet - 56, 4, cx, feet - 56, 68 + pulse * 8);
      grad.addColorStop(0, U.rgba(auraDef.color, 0.24));
      grad.addColorStop(0.5, U.rgba(auraDef.color, 0.11));
      grad.addColorStop(1, U.rgba(auraDef.color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, feet - 56, 62 + pulse * 4, 74 + pulse * 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.4 + pulse * 0.25;
      ctx.strokeStyle = auraDef.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, feet + 2, 30 + pulse * 3, 8 + pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // personnage 6x
    const s = 6;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(cx - img.width * s / 2), Math.round(feet - img.height * s + bob), img.width * s, img.height * s);
    // étincelles
    for (let i = 0; i < 7; i++) {
      const a = t * 0.7 + i * 1.05;
      const x = cx + Math.cos(a) * (48 + Math.sin(t + i) * 8);
      const y = 90 + Math.sin(a * 1.3) * 48;
      ctx.globalAlpha = 0.35 + Math.sin(t * 3 + i) * 0.25;
      ctx.fillStyle = auraDef.color || (i % 2 ? '#ffe6a0' : '#9fdcff');
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
          <button class="pixel-btn" id="pu-journal">JOURNAL DES QUÊTES</button>
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
    s.querySelector('#pu-journal').addEventListener('click', () => { window.AudioSys.sfx('click'); this.open('journal', { from: 'pause' }); });
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
     Journal des quêtes
     ============================================================ */
  UI.buildJournal = function (s) {
    s.innerHTML = `
      <div class="modal-dim"></div>
      <div class="panel wide journal-panel">
        <div class="panel-head">
          <div>
            <div class="eyebrow">CHRONIQUE D'AURORE</div>
            <h2>JOURNAL DES QUÊTES</h2>
          </div>
          <div class="head-right">
            <div class="journal-summary" id="journal-summary"></div>
            <button class="close-btn" id="journal-close">✕</button>
          </div>
        </div>
        <div class="journal-body">
          <div class="journal-list" id="journal-list"></div>
          <div class="journal-detail" id="journal-detail"></div>
        </div>
        <div class="panel-foot">
          <span class="hint">Cliquez : détails · Échap : fermer</span>
          <span class="hint">Les annexes se rendent au donneur.</span>
        </div>
      </div>
    `;
    s.querySelector('#journal-close').addEventListener('click', () => this.close());
    this.renderJournal(s);
  };

  UI.renderJournal = function (s) {
    s = s || this.screenEl;
    if (!s) return;
    if (!window.Quests || !window.Quests.initialized) {
      s.querySelector('#journal-list').innerHTML = '<div class="journal-empty">Le journal est encore vierge.</div>';
      return;
    }

    const groups = window.Quests.journalGroups();
    const sum = window.Quests.summary();
    const summary = s.querySelector('#journal-summary');
    if (summary) {
      summary.innerHTML =
        `<span><small>CAMPAGNE</small><b>${sum.mainDone}/${sum.mainTotal}</b></span>` +
        `<span><small>ANNEXES</small><b>${sum.sideDone}/${sum.sideTotal}</b></span>` +
        `<span><small>EN COURS</small><b>${sum.active}</b></span>`;
    }

    const all = groups.main.concat(groups.side);
    if (!all.length) {
      s.querySelector('#journal-list').innerHTML = '<div class="journal-empty">Aucune quête connue pour le moment.</div>';
      this.renderJournalDetail();
      return;
    }

    if (!this.selectedQuestId || !all.some(p => p.id === this.selectedQuestId)) {
      const tracked = window.Quests.tracked();
      const preferred = tracked || all.find(p => p.status === 'ready') ||
        all.find(p => p.status === 'active') || all[0];
      this.selectedQuestId = preferred ? preferred.id : null;
    }

    const list = s.querySelector('#journal-list');
    clearNode(list);
    const addSection = (label, packs) => {
      if (!packs.length) return;
      list.appendChild(el('div', 'section-label journal-section', label));
      packs.forEach(pack => {
        const meta = questStatusMeta(pack.status);
        const card = el('button', 'journal-card status-' + pack.status +
          (pack.id === this.selectedQuestId ? ' selected' : ''));
        const sub = pack.status === 'ready'
          ? 'À rendre à ' + pack.giver
          : pack.status === 'locked'
            ? (pack.objectives.length ? 'Offre de ' + pack.giver : 'Prochaine étape')
            : pack.q.type === 'main' ? 'Campagne principale' : 'Quête annexe';
        card.innerHTML =
          `<span class="journal-card-title">${pack.q.title}</span>` +
          `<span class="journal-card-meta"><em style="color:${meta.color}">${meta.label}</em><small>${sub}</small></span>`;
        card.addEventListener('click', () => {
          this.selectedQuestId = pack.id;
          window.AudioSys.sfx('click');
          this.renderJournal(s);
        });
        list.appendChild(card);
      });
    };

    addSection('CAMPAGNE', groups.main);
    addSection('ANNEXES', groups.side);
    this.renderJournalDetail();
  };

  UI.renderJournalDetail = function () {
    const s = this.screenEl;
    if (!s) return;
    const box = s.querySelector('#journal-detail');
    if (!box) return;
    if (!window.Quests || !window.Quests.initialized || !this.selectedQuestId) {
      box.innerHTML = '<div class="detail-empty">Sélectionnez une quête pour en lire la chronique.</div>';
      return;
    }

    const groups = window.Quests.journalGroups();
    const pack = groups.main.concat(groups.side).find(p => p.id === this.selectedQuestId);
    if (!pack) {
      box.innerHTML = '<div class="detail-empty">Cette quête a quitté votre journal.</div>';
      return;
    }

    const q = pack.q;
    const meta = questStatusMeta(pack.status);
    const lockedMain = pack.status === 'locked' && !pack.objectives.length;
    const objectives = pack.objectives.length
      ? pack.objectives.map(o => {
          const pct = o.count > 0 ? Math.round((o.current / o.count) * 100) : 0;
          return `<div class="journal-objective${o.done ? ' done' : ''}">` +
            `<span class="obj-dot"></span>` +
            `<span class="obj-body"><span class="obj-label">${o.label}</span>` +
            `<span class="obj-bar"><i style="width:${pct}%"></i></span></span>` +
            `<span class="obj-count">${o.current}/${o.count}</span></div>`;
        }).join('')
      : '<div class="journal-hint">Les objectifs seront révélés au démarrage de la quête.</div>';

    const rewards = [];
    const r = q.rewards || {};
    if (r.xp) rewards.push(`<span><small>XP</small>+${r.xp}</span>`);
    if (r.gold) rewards.push(`<span><small>OR</small>+${r.gold}</span>`);
    if (r.potions) {
      Object.keys(r.potions).forEach(kind => {
        if (D.POTIONS[kind]) rewards.push(`<span><small>POTION</small>${D.POTIONS[kind].name} ×${r.potions[kind]}</span>`);
      });
    }
    if (r.gear && D.GEAR_BY_ID[r.gear]) {
      const g = D.GEAR_BY_ID[r.gear];
      rewards.push(`<span class="reward-gear" style="border-color:${D.RARITIES[g.rarity].color}66">` +
        `<small>ÉQUIPEMENT</small><b style="color:${D.RARITIES[g.rarity].color}">${g.name}</b></span>`);
    }

    let stateLine = '';
    if (pack.status === 'ready') stateLine = `<div class="journal-state ready">À rendre à <b>${pack.giver}</b> pour recevoir les récompenses.</div>`;
    else if (pack.status === 'done') stateLine = '<div class="journal-state done">Chronique consignée.</div>';
    else if (lockedMain) stateLine = '<div class="journal-state locked">Cette étape se révélera une fois la précédente accomplie.</div>';
    else if (pack.status === 'locked') stateLine = `<div class="journal-state locked">Parlez à <b>${pack.giver}</b> pour accepter cette quête.</div>`;

    box.innerHTML = `
      <div class="journal-detail-head">
        <span class="journal-type">${q.type === 'main' ? 'QUÊTE PRINCIPALE' : 'QUÊTE ANNEXE'}</span>
        <span class="journal-badge" style="color:${meta.color};border-color:${meta.color}55">${meta.label}</span>
      </div>
      <h3 class="journal-title">${q.title}</h3>
      <div class="journal-giver">Donneur · <b>${pack.giver}</b></div>
      <p class="journal-desc">${q.desc}</p>
      <div class="section-label">OBJECTIFS</div>
      <div class="journal-objectives">${objectives}</div>
      <div class="section-label">RÉCOMPENSES</div>
      <div class="journal-rewards">${rewards.length ? rewards.join('') : '<span><small>RÉCOMPENSE</small>La gratitude d\'Aurore</span>'}</div>
      ${stateLine}
    `;
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
            <div class="stat-grid inv-stat-grid" id="inv-stats"></div>
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
            <div class="section-label">MATÉRIAUX <span class="dim" id="inv-matcount"></span></div>
            <div class="material-grid" id="inv-materials"></div>
          </div>
        </div>
        <div class="panel-foot">
          <span class="hint">Clic : sélectionner · Double-clic : équiper</span>
          <span class="hint">Matériaux : cliquez pour examiner.</span>
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
    const slots = [
      ['weapon', 'ARME'], ['armor', 'ARMURE'], ['trinket', 'TALISMAN'],
      ['helm', 'CASQUE'], ['boots', 'BOTTES']
    ];
    slots.forEach(([slot, label]) => {
      const id = p.equipment[slot];
      const g = D.GEAR_BY_ID[id];
      const row = el('button', 'equip-slot' + (g ? '' : ' empty'));
      if (g) {
        row.appendChild(iconEl(id, 22));
        const info = el('div', 'equip-info');
        info.innerHTML = `<small>${label}</small><b style="color:${D.RARITIES[g.rarity].color}">${g.name}</b>`;
        row.appendChild(info);
        row.addEventListener('click', () => {
          this.selectedBagId = id;
          this.selectedMaterialId = null;
          this.renderInventoryDetail();
        });
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
      <div><span>PV</span><b>${Math.ceil(p.hp)}/${p.maxHp}</b></div>
      <div><span>ATQ</span><b>${Math.round(p.attackPower)}</b></div>
      <div><span>DEF</span><b>${Math.round(p.def)}</b></div>
      <div><span>VIT</span><b>${Math.round(p.moveSpeed)}</b></div>
      <div><span>CRIT</span><b>${Math.round(p.crit * 100)}%</b></div>
      <div><span>XP</span><b>${Math.round((p.xp / p.xpToNext()) * 100)}%</b></div>
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
          this.selectedMaterialId = null;
          this.renderInventoryDetail();
          this.renderInventory(s);
        });
        cell.addEventListener('dblclick', () => this.equipSelected(s));
        bag.appendChild(cell);
      });
    }

    // matériaux
    const matGrid = s.querySelector('#inv-materials');
    clearNode(matGrid);
    const owned = D.MATERIAL_LIST.filter(m => (p.materials[m.id] || 0) > 0);
    const matTotal = owned.reduce((n, m) => n + (p.materials[m.id] || 0), 0);
    const matCount = s.querySelector('#inv-matcount');
    if (matCount) matCount.textContent = owned.length ? '(' + owned.length + ' · ' + matTotal + ')' : '';
    if (!owned.length) {
      matGrid.innerHTML = '<div class="material-empty">Aucun matériau.<br><span class="dim">Les monstres en lâchent parfois.</span></div>';
    } else {
      owned.forEach(m => {
        const count = p.materials[m.id] || 0;
        const cell = el('button', 'material-cell' + (this.selectedMaterialId === m.id ? ' selected' : ''));
        cell.style.borderColor = m.color + '55';
        cell.appendChild(materialEl(m.id, 20));
        cell.appendChild(el('span', 'material-count', '×' + count));
        cell.title = m.name + ' ×' + count + ' — ' + m.desc;
        cell.addEventListener('click', () => {
          this.selectedMaterialId = m.id;
          this.selectedBagId = null;
          window.AudioSys.sfx('click');
          this.renderInventoryDetail();
          this.renderInventory(s);
        });
        matGrid.appendChild(cell);
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
    const matId = this.selectedMaterialId;
    if (matId && D.MATERIALS[matId]) {
      const m = D.MATERIALS[matId];
      const count = p.materials[matId] || 0;
      const zone = D.ZONES.find(z => z.id === m.zone);
      box.innerHTML = `
        <div class="detail-icon"></div>
        <b class="detail-name" style="color:${m.color}">${m.name}</b>
        <span class="rarity" style="color:${m.color}">MATÉRIAU · ${zone ? zone.short : 'AURORE'} · ×${count}</span>
        <p class="detail-desc">${m.desc}</p>
        <div class="detail-stats">
          <span class="good"><small>VALEUR</small>${m.value} or</span>
        </div>
      `;
      box.querySelector('.detail-icon').appendChild(materialEl(matId, 36));
      return;
    }

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
      if (iconHolder) iconHolder.appendChild(iconEl(w.id, 36));
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
    box.querySelector('.detail-icon').appendChild(iconEl(id, 36));
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
      this.selectedMaterialId = null;
      this.game.saveSoon();
      if (window.Quests) window.Quests.onGear();
      this.renderInventory(s);
    }
  };

  /* ============================================================
     Boutique
     ============================================================ */
  UI.buildShop = function (s, data) {
    data = data || {};
    const p = this.game.player;
    const vendorId = data.vendorId && D.VENDORS[data.vendorId] ? data.vendorId : D.VILLAGE_VENDOR;
    const v = D.VENDORS[vendorId];
    this.shopVendorId = vendorId;
    s.innerHTML = `
      <div class="modal-dim"></div>
      <div class="panel shop-panel">
        <div class="panel-head">
          <div>
            <div class="eyebrow">${v.title || 'MARCHAND'}</div>
            <h2>${v.name.toUpperCase()}</h2>
          </div>
          <div class="head-right">
            <span class="coin-line"><img src="${smallURL('coin')}" width="12" height="12"> ${p.gold}</span>
            <button class="close-btn" id="shop-close">✕</button>
          </div>
        </div>
        <p class="npc-quote">${v.quote || '« Regardez, mais ne touchez pas trop. »'}</p>
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
    const vendorId = this.shopVendorId || D.VILLAGE_VENDOR;
    const stock = this.game.getShopStock(vendorId);
    clearNode(list);

    if (!stock.length) {
      list.innerHTML = '<div class="shop-empty">Le marchand n\'a plus rien à vendre aujourd\'hui.</div>';
      return;
    }

    stock.forEach(item => {
      const card = el('div', 'shop-card');
      if (item.type === 'potion') {
        const def = D.POTIONS[item.id];
        if (!def) return;
        card.innerHTML = `<img src="${potionURL(item.id)}" width="28" height="28" alt=""><div class="shop-info"><b>${def.name}</b><small>${def.desc}</small></div><span class="price">${item.price} or</span>`;
      } else {
        const g = D.GEAR_BY_ID[item.id];
        if (!g) return;
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
          p.addItem(item.id, this.game);
          this.game.removeShopItem(vendorId, item.id);
        }
        this.shopMessage = item.type === 'potion' ? potionName(item.id) + ' achetée.' : D.GEAR_BY_ID[item.id].name + ' acheté.';
        window.AudioSys.sfx('buy');
        this.game.saveSoon();
        const head = s.querySelector('.coin-line');
        if (head) head.innerHTML = `<img src="${smallURL('coin')}" width="12" height="12"> ${p.gold}`;
        this.renderShop(s);
        const msg = s.querySelector('#shop-msg');
        if (msg) msg.textContent = this.shopMessage;
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
      { slot: 'trinket', label: 'TALISMAN', bonus: '+5 PV par niveau' },
      { slot: 'helm', label: 'CASQUE', bonus: '+1 DEF et +3 PV par niveau' },
      { slot: 'boots', label: 'BOTTES', bonus: '+1 DEF et +2 VIT par niveau' }
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
        p.stats.upgrades = (p.stats.upgrades || 0) + 1;
        p.recalc(false);
        this.forgeMessage = g.name + ' renforcé (' + (lvl + 1) + '/5).';
        window.AudioSys.sfx('save');
        this.game.fx.burst(p.x, p.y - 20, '#ffcf6a', 18, 120);
        if (window.Quests) window.Quests.onUpgrade();
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
  UI.mapQuestInfo = function () {
    if (!window.Quests || !this.game || !this.game.player) return null;
    const pack = window.Quests.tracked();
    if (!pack) return null;
    const game = this.game;
    const player = game.player;

    // Une quête prête se rend à son donneur, pas à sa cible d'origine.
    const idx = Math.max(0, pack.objectives.indexOf(pack.objective));
    const raw = pack.q.objectives[idx] || pack.q.objectives[0] || {};
    let x = null, y = null, where = '', sub = '';
    const setZone = (zoneId) => {
      const z = D.ZONE_BY_ID[zoneId] || D.ZONES[0];
      x = z.anchor.x * D.TILE + 8;
      y = z.anchor.y * D.TILE + 16;
      where = z.short;
      sub = z.name;
    };
    const setNpc = (id) => {
      const npc = game.world.npcs.find(n => n.id === id);
      if (npc) {
        x = npc.x; y = npc.y; where = npc.name; sub = npc.hint || 'Village d’Aurore';
      } else {
        const def = D.NPCS.find(n => n.id === id);
        if (def) {
          x = def.x * D.TILE + 8;
          y = def.y * D.TILE + 16;
          where = def.name;
          sub = def.hint || 'Village d’Aurore';
        }
      }
    };
    const setArena = (bossId) => {
      const a = bossId === 'nyx'
        ? game.world.finalArena
        : (game.world.arenas.find(v => v.bossId === bossId && !v.defeated) || game.world.arenas.find(v => v.bossId === bossId));
      if (a) {
        x = a.x; y = a.y;
        where = a.kind === 'final' ? 'Ruines de l’Aube' : a.name;
        sub = a.kind === 'final' ? 'Monolithe de Nyx' : (a.kind === 'big' ? 'Arène d’un Gardien' : 'Arène ancienne');
      }
    };

    const ready = pack.status === 'ready' || pack.objectives.every(o => o.done);
    if (ready || ['material', 'upgrade', 'talk'].includes(pack.objective.type)) {
      const giverId = pack.q.giver === 'bran' || pack.objective.type === 'upgrade' ? 'bran' : pack.q.giver;
      setNpc(giverId);
      if (ready) { sub = 'Remettre la quête'; }
    } else if (pack.objective.type === 'boss') {
      setArena(raw.target);
    } else if (pack.objective.type === 'kill' || pack.objective.type === 'elite' || pack.objective.type === 'zone') {
      setZone(raw.zone || pack.q.zone);
      // Objectif de zone : pas de point précis, la carte montre la terre à parcourir.
      x = null; y = null;
      sub = 'Terres à parcourir';
    } else if (pack.objective.type === 'chest') {
      const chests = game.world.chests.filter(c => !c.opened);
      let best = null, bd = Infinity;
      chests.forEach(c => {
        const d = U.dist2(player.x, player.y, c.x, c.y);
        if (d < bd) { bd = d; best = c; }
      });
      if (best) { x = best.x; y = best.y; where = 'Coffre d’avant-poste'; sub = 'Ouvrir les caches d’Aurore'; }
    } else if (pack.objective.type === 'outpost') {
      const outs = game.world.outposts.filter(o => !game.isDiscovered('outpost', o.id));
      let best = null, bd = Infinity;
      outs.forEach(o => {
        const d = U.dist2(player.x, player.y, o.x, o.y);
        if (d < bd) { bd = d; best = o; }
      });
      if (best) { x = best.x; y = best.y; where = best.name; sub = 'Avant-poste à découvrir'; }
    } else if (pack.objective.type === 'shrine') {
      let best = null, bd = Infinity;
      game.world.shrines.forEach(s => {
        const d = U.dist2(player.x, player.y, s.x, s.y);
        if (d < bd) { bd = d; best = s; }
      });
      if (best) { x = best.x; y = best.y; where = best.name; sub = 'Sanctuaire'; }
    } else {
      setZone(pack.q.zone);
    }
    if (x == null || y == null) return { pack, obj: pack.objective, x: null, y: null, where: '', sub, dist: null };
    const dist = Math.round(U.dist(player.x, player.y, x, y) / D.TILE);
    return { pack, obj: pack.objective, x, y, where, sub, dist };
  };

  UI.buildMap = function (s) {
    const prog = bossProgress(this.game);
    const ex = this.game.getExploration ? this.game.getExploration() : {
      pct: 0, found: 0, total: 44, outposts: 0, outpostsTotal: 12,
      shrines: 0, shrinesTotal: 7, arenas: 0, arenasTotal: 18, terrainPct: 0
    };
    const disc = this.game.discovery || { zones: {}, pois: {} };
    const quest = this.mapQuestInfo();
    const terrainPct = ex.terrainPct || 0;
    s.innerHTML = `
      <div class="modal-dim"></div>
      <div class="panel map-panel">
        <div class="panel-head map-head">
          <div>
            <div class="eyebrow">CARTOGRAPHIE</div>
            <h2>LES SIX TERRES D'AURORE</h2>
          </div>
          <div class="head-right"><span class="map-pct">${terrainPct}% DU MONDE</span><button class="close-btn" id="map-close">✕</button></div>
        </div>
        <div class="map-body">
          <div class="map-wrap" id="map-wrap">
            <canvas id="map-canvas" width="256" height="256" aria-label="Carte des six terres"></canvas>
            <div class="map-tooltip" id="map-tooltip"></div>
          </div>
          <div class="map-side">
            <div class="map-stats">
              <div class="map-progress">
                <div class="big-count">${prog.bigDone}<span>/6</span></div>
                <div class="big-label">GARDIENS<br>VAINCUS</div>
              </div>
              <div class="map-explore">
                <div class="explore-top"><span>LIEUX DÉCOUVERTS</span><b>${ex.pct}%</b></div>
                <div class="explore-bar"><i style="width:${ex.pct}%"></i></div>
                <div class="explore-detail"><span>Avant-postes ${ex.outposts}/${ex.outpostsTotal}</span><span>Sanctuaires ${ex.shrines}/${ex.shrinesTotal}</span></div>
                <div class="explore-top terrain"><span>TERRAIN EXPLORÉ</span><b>${terrainPct}%</b></div>
                <div class="explore-bar thin"><i style="width:${terrainPct}%"></i></div>
              </div>
            </div>
            ${quest ? `
            <div class="map-quest">
              <div class="map-quest-kicker">QUÊTE SUIVIE</div>
              <b>${quest.pack.q.title}</b>
              <span>${quest.obj.label}</span>
              <em>${quest.where ? quest.where : 'Aurore'}${quest.dist != null ? ' · ≈ ' + quest.dist + ' tuiles' : ''}</em>
            </div>` : `
            <div class="map-quest empty">
              <div class="map-quest-kicker">QUÊTE SUIVIE</div>
              <span>Aucune quête en cours. Parlez aux habitants pour en découvrir.</span>
            </div>`}
            <div class="map-zones">
              ${D.ZONES.map(z => {
                const known = !!(disc.zones && disc.zones[z.id]);
                return `<span class="${known ? '' : 'unknown'}" style="border-color:${known ? z.color + '66' : '#3a3344'}"><i style="background:${known ? z.color : '#4a4353'}"></i>${known ? z.short : '???'}</span>`;
              }).join('')}
            </div>
            <div class="map-legend">
              <div><i class="dot player"></i>Vous</div>
              <div><i class="dot camp"></i>Avant-poste</div>
              <div><i class="dot shrine"></i>Sanctuaire</div>
              <div><i class="dot mini"></i>Mini-boss</div>
              <div><i class="dot big"></i>Gardien</div>
              <div><i class="dot done"></i>Vaincu</div>
              <div><i class="dot final"></i>Monolithe</div>
              <div><i class="dot quest"></i>Quête</div>
              <div><i class="dot waypoint"></i>Repère</div>
            </div>
            <div class="map-tip">Survolez un lieu pour l’identifier. Clic : poser un repère · clic droit : l’effacer.</div>
          </div>
        </div>
        <div class="panel-foot"><span class="hint">M pour fermer · clic : repère · clic droit : effacer</span><span class="hint">${prog.done}/18 boss · ${ex.found}/${ex.total} lieux</span></div>
      </div>
    `;
    s.querySelector('#map-close').addEventListener('click', () => this.close());
    const wrap = s.querySelector('#map-wrap');
    const canvas = s.querySelector('#map-canvas');
    const tooltip = s.querySelector('#map-tooltip');
    const hideTip = () => {
      tooltip.classList.remove('visible');
      if (this.mapHover) { this.mapHover = null; this.drawMap(s); }
    };
    canvas.addEventListener('mousemove', (ev) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const mx = (ev.clientX - rect.left) * (canvas.width / rect.width);
      const my = (ev.clientY - rect.top) * (canvas.height / rect.height);
      let best = null, bd = 10 * 10;
      for (const p of this.mapPois) {
        const d = U.dist2(mx, my, p.x, p.y);
        if (d <= bd) { bd = d; best = p; }
      }
      if (!best) {
        tooltip.classList.remove('visible');
        if (this.mapHover) { this.mapHover = null; this.drawMap(s); }
        return;
      }
      if (this.mapHover !== best.key) {
        this.mapHover = best.key;
        this.drawMap(s);
      }
      tooltip.innerHTML = `<b>${best.title}</b><small>${best.sub}</small>`;
      tooltip.classList.add('visible');
      const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
      const left = U.clamp(best.x + 10, 4, canvas.width - tw - 4);
      const top = U.clamp(best.y - th - 8, 4, canvas.height - th - 4);
      tooltip.style.left = Math.round(left) + 'px';
      tooltip.style.top = Math.round(top) + 'px';
    });
    canvas.addEventListener('mouseleave', hideTip);
    const game = this.game;
    const worldPx = D.WORLD_SIZE * D.TILE;
    const onClick = (ev) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const mx = (ev.clientX - rect.left) * (canvas.width / rect.width);
      const my = (ev.clientY - rect.top) * (canvas.height / rect.height);
      const scale = canvas.width / worldPx;
      const wp = game.waypoint;
      if (wp) {
        const dx = wp.x * scale - mx, dy = wp.y * scale - my;
        if (dx * dx + dy * dy <= 81) {
          game.waypoint = null;
          game.saveSoon();
          window.AudioSys.sfx('click');
          game.toast('REPÈRE EFFACÉ', '#8fd8f0');
          this.drawMap(s);
          return;
        }
      }
      const wx = U.clamp(mx / scale, 0, worldPx - 1);
      const wy = U.clamp(my / scale, 0, worldPx - 1);
      game.waypoint = { x: wx, y: wy };
      game.saveSoon();
      window.AudioSys.sfx('click');
      const p = game.player;
      const dist = p ? Math.round(U.dist(p.x, p.y, wx, wy) / D.TILE) : null;
      let known = true;
      if (game.explored && game.explored.length) {
        const cw = Math.round(Math.sqrt(game.explored.length));
        const cx = Math.floor(wx / worldPx * cw);
        const cy = Math.floor(wy / worldPx * cw);
        known = !!game.explored[U.clamp(cy, 0, cw - 1) * cw + U.clamp(cx, 0, cw - 1)];
      }
      game.toast((known ? 'REPÈRE POSÉ' : 'REPÈRE EN TERRE INCONNUE') + (dist != null ? ' · ' + dist + ' TUILES' : ''), '#8fd8f0');
      this.drawMap(s);
    };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      if (!game.waypoint) return;
      game.waypoint = null;
      game.saveSoon();
      window.AudioSys.sfx('click');
      game.toast('REPÈRE EFFACÉ', '#8fd8f0');
      this.drawMap(s);
    });
    this.mapHover = null;
    this.mapClock = 0;
    this.drawMap(s);
  };

  /* Brouillard de guerre texturé : parchemin sombre, hachures d'encre,
     grain de papier et bords fondus comme des nappes de brume. */
  UI.buildMapFog = function (game, w, h) {
    const cache = this.mapFogCache;
    if (cache && cache.ref === game.explored && cache.version === (game.exploredVersion || 0) &&
        cache.w === w && cache.h === h) return cache.canvas;
    const cw = Math.round(Math.sqrt(game.explored.length));
    const canvas = Art.cvs(w, h);
    const ctx = canvas.getContext('2d');

    const base = ctx.createLinearGradient(0, 0, w * 0.35, h);
    base.addColorStop(0, '#2c2539');
    base.addColorStop(0.55, '#211b2e');
    base.addColorStop(1, '#161120');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // Grain de papier : une texture à peine visible qui casse le plat.
    const img = ctx.getImageData(0, 0, w, h);
    const px = img.data;
    const seed = (game.world && game.world.seed ? game.world.seed : 1) + 77;
    for (let i = 0; i < w * h; i++) {
      const n = U.hash2(i % w, (i / w) | 0, seed) - 0.5;
      const o = i * 4;
      px[o] = U.clamp(px[o] + n * 11, 0, 255);
      px[o + 1] = U.clamp(px[o + 1] + n * 9, 0, 255);
      px[o + 2] = U.clamp(px[o + 2] + n * 13, 0, 255);
    }
    ctx.putImageData(img, 0, 0);

    // Hachures diagonales des terres inconnues, comme sur les cartes anciennes.
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(232, 214, 170, 0.032)';
    for (let x = -h; x < w; x += 7) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + h + 0.5, h);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(232, 214, 170, 0.05)';
    for (let x = -h; x < w; x += 29) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + h + 0.5, h);
      ctx.stroke();
    }

    // Volutes de brume : lueurs chaudes et creux violacés.
    for (let i = 0; i < 14; i++) {
      const bx = U.hash2(i, 3, seed + 11) * w;
      const by = U.hash2(i, 9, seed + 29) * h;
      const r = 18 + U.hash2(i, 5, seed + 47) * 42;
      const g = ctx.createRadialGradient(bx, by, 1, bx, by, r);
      const warm = i % 3 === 0;
      g.addColorStop(0, warm ? 'rgba(226, 202, 158, 0.055)' : 'rgba(96, 82, 132, 0.07)');
      g.addColorStop(0.55, warm ? 'rgba(226, 202, 158, 0.02)' : 'rgba(72, 60, 104, 0.03)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(bx - r, by - r, r * 2, r * 2);
    }

    // Semis d'étoiles de mer / poussières dorées.
    for (let i = 0; i < 260; i++) {
      const sx = Math.floor(U.hash2(i, 13, seed + 61) * w);
      const sy = Math.floor(U.hash2(i, 17, seed + 83) * h);
      ctx.fillStyle = i % 5 === 0 ? 'rgba(255, 238, 194, 0.11)' : 'rgba(206, 190, 160, 0.05)';
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Découpe : seules les cases non explorées gardent la brume.
    const mask = Art.cvs(w, h);
    const mctx = mask.getContext('2d');
    const cell = w / cw;
    mctx.fillStyle = '#fff';
    for (let gy = 0; gy < cw; gy++) {
      for (let gx = 0; gx < cw; gx++) {
        if (game.explored[gy * cw + gx]) continue;
        mctx.fillRect(Math.floor(gx * cell), Math.floor(gy * cell), Math.ceil(cell) + 1, Math.ceil(cell) + 1);
      }
    }
    const soft = Art.cvs(w, h);
    const sctx = soft.getContext('2d');
    if ('filter' in sctx) {
      sctx.filter = 'blur(3px)';
      sctx.drawImage(mask, 0, 0);
      sctx.filter = 'none';
    } else {
      sctx.imageSmoothingEnabled = true;
      sctx.drawImage(mask, 0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(soft, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    this.mapFogCache = {
      ref: game.explored, version: game.exploredVersion || 0, w, h, canvas
    };
    return canvas;
  };

  UI.drawMap = function (s) {
    s = s || this.screenEl;
    if (!s) return;
    const canvas = s.querySelector('#map-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const game = this.game;
    if (!game || !game.world) return;
    const disc = game.discovery || { zones: {}, pois: {} };
    const known = (kind, id) => game.isDiscovered ? game.isDiscovered(kind, id) : false;
    const scale = w / (D.WORLD_SIZE * D.TILE);
    const px = (x) => x * scale;
    const py = (y) => y * scale;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d1018';
    ctx.fillRect(0, 0, w, h);

    // Terrain détaillé, généré une seule fois puis conservé.
    game.world.drawMapTexture(ctx, w, h);

    // Brouillard de guerre persistant, texturé et aux bords fondus.
    if (game.explored && game.explored.length) {
      ctx.drawImage(this.buildMapFog(game, w, h), 0, 0);
    }

    // Quadrillage discret.
    ctx.strokeStyle = 'rgba(255,236,190,0.055)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const gx = Math.round(w * i / 8) + 0.5;
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
    }
    for (let i = 1; i < 8; i++) {
      const gy = Math.round(h * i / 8) + 0.5;
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }

    // Noms des terres connues, sur un cartouche sombre.
    D.ZONES.forEach(z => {
      if (!(disc.zones && disc.zones[z.id])) return;
      const x = px(z.anchor.x * D.TILE + 8), y0 = py(z.anchor.y * D.TILE + 8);
      // Le village occupe le centre des Plaines : on remonte le cartouche
      // au-dessus de l'anneau du joueur pour éviter tout chevauchement.
      const y = z.id === 'plains' ? y0 - 26 : y0;
      const label = z.short;
      const tw = Art.textWidth(label, 1);
      ctx.fillStyle = 'rgba(10,8,16,0.6)';
      ctx.fillRect(Math.round(x - tw / 2 - 4), Math.round(y - 4), tw + 8, 17);
      ctx.strokeStyle = U.rgba(z.color, 0.45);
      ctx.strokeRect(Math.round(x - tw / 2 - 3.5) + 0.5, Math.round(y - 3.5) + 0.5, tw + 7, 16);
      Art.drawText(ctx, label, x, y, z.color, 1, true, 'center');
      Art.drawText(ctx, 'NV ' + z.levelMin + '-' + z.levelMax, x, y + 8, '#ece2ca', 1, true, 'center');
    });

    // Lieux découverts.
    const pois = [];
    game.world.outposts.forEach(o => {
      if (!known('outpost', o.id)) return;
      const z = D.ZONE_BY_ID[o.biome];
      pois.push({
        key: 'outpost:' + o.id, kind: 'outpost', x: px(o.x), y: py(o.y), r: 6,
        title: o.name, sub: 'Avant-poste sûr · ' + (z ? z.short : 'Aurore') + ' · coffre',
        color: '#8ef0a8'
      });
    });
    game.world.shrines.forEach(sh => {
      if (!known('shrine', sh.id)) return;
      pois.push({
        key: 'shrine:' + sh.id, kind: 'shrine', x: px(sh.x), y: py(sh.y), r: 6,
        title: sh.name, sub: 'Sanctuaire · repos et sauvegarde', color: '#8fe6e0'
      });
    });
    game.world.arenas.forEach(a => {
      if (!known('arena', a.id)) return;
      const def = D.BOSSES[a.bossId];
      pois.push({
        key: 'arena:' + a.id, kind: 'arena', big: a.kind === 'big', defeated: !!a.defeated,
        x: px(a.x), y: py(a.y), r: a.kind === 'big' ? 7 : 6,
        title: a.name,
        sub: (a.kind === 'big' ? 'Gardien' : 'Mini-boss') + ' · Nv ' + (def ? def.level : '?') + (a.defeated ? ' · vaincu' : ''),
        color: a.kind === 'big' ? '#ff7a5e' : '#ffbe5c'
      });
    });
    if (known('final', 'final')) {
      const f = game.world.finalArena;
      pois.push({
        key: 'final', kind: 'final', x: px(f.x), y: py(f.y), r: 8,
        title: 'Ruines de l’Aube', sub: 'Monolithe de Nyx · Gardien final', color: '#c08aff'
      });
    }
    const vx = px(game.world.village.x), vy = py(game.world.village.y);
    pois.push({
      key: 'village', kind: 'village', x: vx, y: vy, r: 8,
      title: game.world.village.name, sub: 'Refuge · forge, boutiques et auberge', color: '#ffd76a'
    });

    // Repère personnel posé d'un clic sur la carte.
    if (game.waypoint) {
      const wx = px(game.waypoint.x), wy = py(game.waypoint.y);
      const mapPos = game.interior && game.interiorReturn ? game.interiorReturn : game.player;
      const dist = mapPos ? Math.round(U.dist(mapPos.x, mapPos.y, game.waypoint.x, game.waypoint.y) / D.TILE) : null;
      pois.push({
        key: 'waypoint', kind: 'waypoint', x: wx, y: wy, r: 7,
        title: 'Repère personnel',
        sub: 'Clic pour retirer' + (dist != null ? ' · ' + dist + ' tuiles' : ''),
        color: '#8fd8f0'
      });
      if (mapPos) {
        const plx = px(mapPos.x), ply = py(mapPos.y);
        ctx.save();
        ctx.setLineDash([2, 5]);
        ctx.lineDashOffset = -this.editorTime * 14;
        ctx.strokeStyle = 'rgba(143,216,240,0.38)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(plx, ply);
        ctx.lineTo(wx, wy);
        ctx.stroke();
        ctx.restore();
      }
    }

    const quest = this.mapQuestInfo();
    if (quest && quest.x != null) {
      const qx = px(quest.x), qy = py(quest.y);
      pois.push({
        key: 'quest', kind: 'quest', x: qx, y: qy, r: 7,
        title: 'Quête · ' + quest.pack.q.title,
        sub: quest.obj.label + (quest.where ? ' · ' + quest.where : ''),
        color: '#ffd76a'
      });
      // Fil d'Ariane discret vers l'objectif.
      const playerPos = game.interior && game.interiorReturn ? game.interiorReturn : game.player;
      if (playerPos) {
        const plx = px(playerPos.x), ply = py(playerPos.y);
        ctx.save();
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = 'rgba(255,215,106,0.42)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(plx, ply);
        ctx.lineTo(qx, qy);
        ctx.stroke();
        ctx.restore();
      }
    }

    const shadow = (x, y, r) => {
      ctx.fillStyle = 'rgba(9,7,13,0.72)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    };
    const hoverRing = (p) => {
      if (this.mapHover !== p.key) return;
      ctx.strokeStyle = U.rgba(p.color, 0.95);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2); ctx.stroke();
    };
    pois.forEach(p => {
      const x = Math.round(p.x), y = Math.round(p.y);
      hoverRing(p);
      if (p.kind === 'outpost') {
        shadow(x, y, 5);
        ctx.fillStyle = p.color;
        ctx.fillRect(x - 3, y, 6, 2);
        ctx.fillRect(x - 2, y - 2, 4, 2);
        ctx.fillRect(x - 1, y - 4, 2, 2);
        ctx.fillStyle = '#ffd76a';
        ctx.fillRect(x + 3, y - 4, 1, 4);
      } else if (p.kind === 'shrine') {
        shadow(x, y, 5);
        ctx.fillStyle = p.color;
        ctx.fillRect(x - 1, y - 4, 3, 9);
        ctx.fillRect(x - 4, y - 1, 9, 3);
        ctx.fillStyle = '#eaffff';
        ctx.fillRect(x, y - 2, 1, 4);
      } else if (p.kind === 'arena') {
        shadow(x, y, p.big ? 7 : 6);
        if (p.defeated) {
          ctx.strokeStyle = '#7fe0a2';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3); ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3); ctx.stroke();
        } else {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = '#1a1119';
          ctx.fillRect(-4, -4, 8, 8);
          ctx.fillStyle = p.color;
          ctx.fillRect(-3, -3, 6, 6);
          ctx.fillStyle = '#ffe2a0';
          ctx.fillRect(-1, -1, 2, 2);
          ctx.restore();
          if (p.big) {
            ctx.strokeStyle = 'rgba(255,220,150,0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke();
          }
        }
      } else if (p.kind === 'village') {
        shadow(x, y, 8);
        ctx.fillStyle = '#f0d89b'; ctx.fillRect(x - 5, y - 5, 10, 10);
        ctx.fillStyle = '#a8794b'; ctx.fillRect(x - 4, y - 1, 8, 5);
        ctx.fillStyle = '#7c4f2e'; ctx.fillRect(x - 5, y - 4, 10, 3);
        ctx.fillStyle = '#79c8d6'; ctx.fillRect(x - 1, y + 1, 3, 3);
        ctx.fillStyle = '#ffe9b0'; ctx.fillRect(x - 3, y - 3, 2, 1);
      } else if (p.kind === 'final') {
        shadow(x, y, 8);
        const pulse = 7 + Math.sin(this.editorTime * 3) * 2;
        ctx.strokeStyle = 'rgba(200,145,255,' + (0.5 + Math.sin(this.editorTime * 3) * 0.2) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#1a1122';
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-5, -5, 10, 10); ctx.restore();
        ctx.fillStyle = '#c08aff';
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-3, -3, 6, 6); ctx.restore();
        ctx.fillStyle = '#f3e6ff'; ctx.fillRect(x - 1, y - 1, 2, 2);
      } else if (p.kind === 'quest') {
        const pulse = 6 + Math.sin(this.editorTime * 5) * 1.5;
        ctx.strokeStyle = 'rgba(255,215,106,0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(20,15,24,0.85)';
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
        Art.drawText(ctx, '!', x, y - 3, '#ffd76a', 1, false, 'center');
      } else if (p.kind === 'waypoint') {
        const pulse = 8 + Math.sin(this.editorTime * 4) * 1.6;
        ctx.strokeStyle = 'rgba(143,216,240,' + (0.55 + Math.sin(this.editorTime * 4) * 0.18) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(14,20,26,0.8)';
        ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
        // Petit drapeau cyan : le mât descend jusqu'au sol.
        ctx.fillStyle = '#8fd8f0';
        ctx.fillRect(x - 2, y - 9, 1, 10);
        ctx.beginPath();
        ctx.moveTo(x - 1, y - 9);
        ctx.lineTo(x + 4, y - 7);
        ctx.lineTo(x - 1, y - 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#eaffff';
        ctx.fillRect(x - 2, y - 9, 1, 1);
      }
    });

    // Joueur : anneau pulsant, position mémorisée devant la porte en intérieur.
    const mapPos = game.interior && game.interiorReturn ? game.interiorReturn : game.player;
    if (mapPos) {
      const plx = px(mapPos.x), ply = py(mapPos.y);
      const pulse = 4 + Math.sin(this.editorTime * 5) * 1.6;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(plx, ply, pulse + 3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#16121d';
      ctx.beginPath(); ctx.arc(plx, ply, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fffdf2';
      ctx.beginPath(); ctx.arc(plx, ply, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e3b950';
      ctx.fillRect(Math.round(plx) - 1, Math.round(ply) - 1, 2, 2);
      if (game.player && !game.interior) {
        const dirs = [[0, 1], [-1, 0], [1, 0], [0, -1]];
        const fd = dirs[game.player.facing || 0] || dirs[0];
        ctx.fillStyle = '#ffd76a';
        ctx.fillRect(Math.round(plx + fd[0] * 4) - 1, Math.round(ply + fd[1] * 4) - 1, 2, 2);
      }
    }

    // Rose des vents.
    const cx = w - 24, cy = 25;
    ctx.fillStyle = 'rgba(12,10,18,0.72)';
    ctx.beginPath(); ctx.arc(cx, cy, 17, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,106,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, 17, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12); ctx.lineTo(cx + 4, cy + 1); ctx.lineTo(cx, cy - 3); ctx.lineTo(cx - 4, cy + 1);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8b7c9a';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 12); ctx.lineTo(cx + 3, cy + 1); ctx.lineTo(cx, cy + 4); ctx.lineTo(cx - 3, cy + 1);
    ctx.closePath(); ctx.fill();
    Art.drawText(ctx, 'N', cx, cy - 25, '#ffd76a', 1, true, 'center');
    Art.drawText(ctx, 'E', cx + 21, cy - 3, '#b8a9c4', 1, true, 'center');
    Art.drawText(ctx, 'O', cx - 21, cy - 3, '#b8a9c4', 1, true, 'center');

    // Échelle.
    const bx = 12, by = h - 15;
    const bw = Math.max(24, Math.round(w * 60 / 480));
    ctx.fillStyle = 'rgba(10,8,16,0.66)';
    ctx.fillRect(bx - 5, by - 7, bw + 52, 20);
    ctx.strokeStyle = 'rgba(255,236,190,0.35)';
    ctx.strokeRect(bx - 5.5 + 0.5, by - 6.5 + 0.5, bw + 51, 19);
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(bx, by, bw, 1);
    ctx.fillRect(bx, by - 3, 1, 4);
    ctx.fillRect(bx + bw, by - 3, 1, 4);
    ctx.fillRect(bx + Math.round(bw / 2), by - 2, 1, 3);
    Art.drawText(ctx, '60 TUILES', bx + bw + 5, by - 3, '#d9cdb2', 1, true);

    // Cadre de la carte.
    ctx.strokeStyle = 'rgba(255,215,106,0.24)';
    ctx.lineWidth = 1;
    ctx.strokeRect(3.5, 3.5, w - 7, h - 7);
    ctx.strokeStyle = 'rgba(9,7,13,0.9)';
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    // Graduations fines, comme sur un relevé de cartographe.
    ctx.strokeStyle = 'rgba(255,236,190,0.22)';
    for (let i = 8; i < w - 6; i += 16) {
      const len = i % 32 === 0 ? 4 : 2;
      ctx.beginPath(); ctx.moveTo(i + 0.5, 4); ctx.lineTo(i + 0.5, 4 + len); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i + 0.5, h - 4); ctx.lineTo(i + 0.5, h - 4 - len); ctx.stroke();
    }
    for (let i = 8; i < h - 6; i += 16) {
      const len = i % 32 === 0 ? 4 : 2;
      ctx.beginPath(); ctx.moveTo(4, i + 0.5); ctx.lineTo(4 + len, i + 0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w - 4, i + 0.5); ctx.lineTo(w - 4 - len, i + 0.5); ctx.stroke();
    }

    // Équerres dorées aux quatre coins.
    ctx.strokeStyle = 'rgba(255,215,106,0.46)';
    const cl = 9;
    [[6, 6, 1, 1], [w - 6, 6, -1, 1], [6, h - 6, 1, -1], [w - 6, h - 6, -1, -1]].forEach(([cx0, cy0, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(cx0 + sx * cl, cy0 + 0.5);
      ctx.lineTo(cx0 + 0.5, cy0 + 0.5);
      ctx.lineTo(cx0 + 0.5, cy0 + sy * cl);
      ctx.stroke();
    });

    this.mapPois = pois;
    this.mapClock = 0.1;
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
    if (code === 'KeyL') {
      if (this.modal === 'journal') { this.handleEscape(); return true; }
      if (this.modal === 'pause') { this.open('journal', { from: 'pause' }); return true; }
      if (this.game.state === 'playing') { this.open('journal'); return true; }
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
    if (this.modal === 'map') {
      this.mapClock -= dt;
      if (this.mapClock <= 0) this.drawMap();
    }
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

    // Balise du repère personnel, dessinée sous les panneaux du HUD.
    if (game.waypoint && !game.interior) {
      const rcX = U.clamp(Math.round(game.camX + game.shakeX), 0, D.WORLD_SIZE * 16 - 640);
      const rcY = U.clamp(Math.round(game.camY + game.shakeY), 0, D.WORLD_SIZE * 16 - 360);
      const wx = Math.round(game.waypoint.x - rcX);
      const wy = Math.round(game.waypoint.y - rcY);
      if (wx > 8 && wx < 632 && wy > 16 && wy < 352) {
        const bob = Math.sin(game.time * 3.2) * 2;
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = 'rgba(143,216,240,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(wx, wy, 7, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(143,216,240,0.18)';
        ctx.fillRect(wx - 1, wy - 18 + bob, 2, 16);
        ctx.fillStyle = '#8fd8f0';
        ctx.beginPath();
        ctx.moveTo(wx, wy - 24 + bob);
        ctx.lineTo(wx + 4, wy - 20 + bob);
        ctx.lineTo(wx, wy - 16 + bob);
        ctx.lineTo(wx - 4, wy - 20 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#eaffff';
        ctx.fillRect(wx - 1, wy - 21 + bob, 2, 2);
        ctx.globalAlpha = 1;
      }
    }

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

    // suivi compact de la quête active
    const tracked = window.Quests && window.Quests.initialized ? window.Quests.tracked() : null;
    if (tracked) {
      const ready = tracked.status === 'ready';
      const color = ready ? '#8ef0a8' : tracked.q.type === 'main' ? '#ffd76a' : '#9fdcff';
      const label = ready ? 'QUÊTE À RENDRE' : tracked.q.type === 'main' ? 'QUÊTE PRINCIPALE' : 'QUÊTE ANNEXE';
      const objective = ready
        ? 'À rendre à ' + tracked.giver
        : tracked.objective.label;
      const count = ready ? '' : tracked.objective.current + '/' + tracked.objective.count;
      panel(ctx, 470, 54, 162, 40, 0.74);
      Art.drawText(ctx, label, 476, 59, color, 1, true);
      Art.drawText(ctx, truncateText(tracked.q.title, 26), 476, 69, '#f4ecd9', 1, true);
      Art.drawText(ctx, truncateText(objective, ready ? 26 : 20), 476, 79, ready ? '#bfe8c8' : '#c9bfa8', 1, true);
      if (count) Art.drawText(ctx, count, 626, 79, '#c9bfa8', 1, true, 'right');
    }

    // Repère personnel : flèche de boussole et distance.
    if (game.waypoint) {
      const mapPos = game.interior && game.interiorReturn ? game.interiorReturn : p;
      if (mapPos) {
        const dx = game.waypoint.x - mapPos.x;
        const dy = game.waypoint.y - mapPos.y;
        const tiles = Math.round(Math.sqrt(dx * dx + dy * dy) / 16);
        panel(ctx, 470, 98, 162, 17, 0.72);
        ctx.save();
        ctx.translate(480, 106.5);
        ctx.rotate(Math.atan2(dy, dx));
        ctx.fillStyle = '#8fd8f0';
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-3, -3.5);
        ctx.lineTo(-1.5, 0);
        ctx.lineTo(-3, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        Art.drawText(ctx, tiles <= 2 ? 'REPÈRE ATTEINT' : 'REPÈRE · ' + tiles + ' T.', 490, 103, '#a8e2f4', 1, true);
        Art.drawText(ctx, 'M', 626, 103, '#6f8794', 1, true, 'right');
      }
    }

    // aide contrôles
    ctx.globalAlpha = 0.72;
    const hint = game.interior
      ? 'E INTERAGIR   H POTION   I SAC   L QUÊTES   ÉCHAP MENU'
      : 'J ATTAQUER   K ESQUIVER   E INTERAGIR   I SAC   L QUÊTES   M CARTE';
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
