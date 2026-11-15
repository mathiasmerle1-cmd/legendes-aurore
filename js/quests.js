/* ============================================================
   LES LÉGENDES D'AURORE — quêtes, objectifs et progression
   ============================================================ */
(function () {
  'use strict';
  const D = window.DATA, U = window.U;

  const Quests = {
    game: null,
    state: {},
    initialized: false,
    refreshing: false,
    migrating: false,
    clock: 0
  };

  function player() { return Quests.game && Quests.game.player; }

  /* ------------------------------------------------------------
     Outils
     ------------------------------------------------------------ */
  Quests.npcName = function (id) {
    const direct = D.NPCS.find(n => n.id === id);
    if (direct) return direct.name;
    if (D.VENDORS[id]) return D.VENDORS[id].name;
    if (this.game && this.game.world) {
      const npc = this.game.world.npcs.find(n => n.id === id);
      if (npc) return npc.name;
    }
    return id;
  };

  Quests.gearCount = function () {
    const p = player();
    if (!p) return 0;
    const set = new Set();
    Object.keys(p.equipment).forEach(slot => {
      if (p.equipment[slot] && D.GEAR_BY_ID[p.equipment[slot]]) set.add(p.equipment[slot]);
    });
    p.bag.forEach(id => { if (D.GEAR_BY_ID[id]) set.add(id); });
    return set.size;
  };

  Quests.openedChests = function () {
    if (!this.game || !this.game.world) return 0;
    return this.game.world.chests.filter(c => c.opened).length;
  };

  Quests.miniBossesDefeated = function () {
    if (!this.game || !this.game.world) return 0;
    return this.game.world.arenas.filter(a => a.kind === 'mini' && a.defeated).length;
  };

  Quests.bossDefeated = function (bossId) {
    if (!this.game || !this.game.world) return false;
    if (bossId === 'nyx' && this.game.world.finalArena.defeated) return true;
    return this.game.world.arenas.some(a => a.bossId === bossId && a.defeated);
  };

  Quests.outpostCount = function () {
    if (!this.game || !this.game.discovery) return 0;
    return D.OUTPOSTS.filter(o => this.game.discovery.pois['outpost:' + o.id]).length;
  };

  Quests.shrineCount = function () {
    const p = player();
    return p && p.stats ? Object.keys(p.stats.shrines || {}).length : 0;
  };

  Quests.stateOf = function (id) { return this.state[id] || null; };

  Quests.serialize = function () {
    return { version: 1, state: this.state };
  };

  /* ------------------------------------------------------------
     Cycle de vie
     ------------------------------------------------------------ */
  Quests.init = function (game) {
    this.game = game;
    this.state = {};
    this.initialized = true;
    this.clock = 0;
  };

  Quests.reset = function () {
    this.state = {};
    this.clock = 0;
    this.migrating = false;
    this.refresh();
  };

  Quests.load = function (data) {
    this.state = {};
    const entries = data && data.state ? data.state : null;
    if (entries) {
      Object.keys(entries).forEach(id => {
        const q = D.QUEST_BY_ID[id];
        const saved = entries[id];
        if (!q || !saved || !saved.status) return;
        const progress = q.objectives.map((o, i) =>
          U.clamp(Math.floor(Number(saved.progress && saved.progress[i]) || 0), 0, o.count)
        );
        this.state[id] = {
          status: ['active', 'ready', 'done'].indexOf(saved.status) >= 0 ? saved.status : 'active',
          progress,
          startedAt: Number(saved.startedAt) || 0,
          doneAt: Number(saved.doneAt) || 0
        };
      });
    }
    // Une ancienne sauvegarde n'a pas d'état de quête : on reconstruit
    // la progression sans spammer le joueur de fenêtres narratives.
    this.migrating = !entries;
    this.refresh({ silent: this.migrating, migrating: this.migrating });
    this.migrating = false;
  };

  /* ------------------------------------------------------------
     Démarrage automatique
     ------------------------------------------------------------ */
  Quests.startQuest = function (id, opts) {
    opts = opts || {};
    const q = D.QUEST_BY_ID[id];
    const p = player();
    if (!q || !p || this.state[id]) return false;
    // Les objectifs « parler à » sont considérés remplis par la prise de quête :
    // le dialogue d'introduction tient déjà lieu de conversation.
    const progress = q.objectives.map(o => o.type === 'talk' ? o.count : 0);
    this.state[id] = {
      status: 'active',
      progress,
      startedAt: Math.round(p.playTime || 0),
      doneAt: 0
    };
    if (!opts.silent) {
      this.game.toast('NOUVELLE QUÊTE · ' + q.title, q.type === 'main' ? '#ffd76a' : '#ffe6a0');
      window.AudioSys.sfx('pickup');
    }
    return true;
  };

  Quests.checkAutoStarts = function (opts) {
    const p = player();
    if (!p) return;
    const zones = this.game.discovery ? this.game.discovery.zones : {};
    D.QUESTS.forEach(q => {
      if (this.state[q.id]) return;
      let start = false;
      switch (q.autoStart) {
        case 'new': start = true; break;
        case 'zone': start = !!zones[q.zone]; break;
        case 'level': start = p.level >= (q.autoLevel || 1); break;
        case 'chain':
          start = (q.prereq || []).every(id => this.state[id] && this.state[id].status === 'done');
          break;
        default: start = false;
      }
      if (start) this.startQuest(q.id, opts);
    });
  };

  /* ------------------------------------------------------------
     Synchronisation des objectifs
     ------------------------------------------------------------ */
  Quests.setProgress = function (qs, index, value, objective, opts) {
    const old = qs.progress[index] || 0;
    let next = U.clamp(Math.floor(value), 0, objective.count);
    if (qs.status === 'ready' || qs.status === 'done') next = objective.count;
    if (next === old) return false;
    qs.progress[index] = next;
    if (next > old && next >= objective.count && !opts.silent) {
      this.game.toast('OBJECTIF ATTEINT · ' + objective.label, '#ffe6a0');
      window.AudioSys.sfx('pickup');
    }
    return true;
  };

  Quests.syncQuest = function (q, qs, opts) {
    if (qs.status === 'done') return false;
    const p = player();
    if (!p) return false;
    let changed = false;
    q.objectives.forEach((o, i) => {
      let value = null;
      switch (o.type) {
        case 'kill': value = (p.stats.killsByZone && p.stats.killsByZone[o.zone]) || 0; break;
        case 'boss': value = this.bossDefeated(o.target) ? 1 : 0; break;
        case 'chest': value = this.openedChests(); break;
        case 'material': value = p.materials[o.target] || 0; break;
        case 'materialTotal': value = p.stats.materialsCollected || 0; break;
        case 'upgrade': value = p.stats.upgrades || 0; break;
        case 'elite': value = p.stats.eliteKills || 0; break;
        case 'miniBoss': value = this.miniBossesDefeated(); break;
        case 'shrine': value = this.shrineCount(); break;
        case 'outpost': value = this.outpostCount(); break;
        case 'gearCount': value = this.gearCount(); break;
        case 'level': value = p.level; break;
        case 'talk': value = (p.stats.talks && p.stats.talks[o.target]) ? o.count : null; break;
      }
      if (value === null) return;
      if (this.setProgress(qs, i, value, o, opts)) changed = true;
    });
    return changed;
  };

  Quests.checkCompletion = function (q, qs, opts) {
    if (!q || !qs || qs.status === 'done') return false;
    const complete = q.objectives.every((o, i) => (qs.progress[i] || 0) >= o.count);
    if (!complete) return false;
    if (q.type === 'main') {
      this.completeQuest(q.id, opts);
      return true;
    }
    if (qs.status === 'active') {
      qs.status = 'ready';
      if (!opts.silent) {
        this.game.toast('QUÊTE PRÊTE · ' + q.title, '#ffe6a0');
        this.game.toast('À rendre à ' + this.npcName(q.giver), '#c5ced8');
        window.AudioSys.sfx('save');
      }
      this.game.saveSoon();
      return true;
    }
    return false;
  };

  /* ------------------------------------------------------------
     Rafraîchissement global
     ------------------------------------------------------------ */
  Quests.refresh = function (opts) {
    opts = opts || {};
    if (!this.initialized || !this.game || !this.game.player || this.refreshing) return;
    this.refreshing = true;
    const quiet = !!(opts.silent || this.migrating);
    const passOpts = { silent: quiet, migrating: quiet };

    for (let pass = 0; pass < 5; pass++) {
      this.checkAutoStarts(passOpts);
      let changed = false;
      Object.keys(this.state).forEach(id => {
        const q = D.QUEST_BY_ID[id];
        const qs = this.state[id];
        if (!q || !qs || qs.status === 'done') return;
        if (this.syncQuest(q, qs, passOpts)) changed = true;
        if (this.checkCompletion(q, qs, passOpts)) changed = true;
      });
      if (!changed) break;
    }
    this.refreshing = false;
  };

  Quests.update = function (dt) {
    if (!this.initialized || !this.game || this.game.state !== 'playing' || this.game.paused) return;
    this.clock -= dt;
    if (this.clock > 0) return;
    this.clock = 0.7;
    this.refresh();
  };

  /* ------------------------------------------------------------
     Récompenses et fin de quête
     ------------------------------------------------------------ */
  Quests.completeQuest = function (id, opts) {
    opts = opts || {};
    const q = D.QUEST_BY_ID[id];
    const qs = this.state[id];
    const p = player();
    if (!q || !qs || !p || qs.status === 'done') return false;

    qs.status = 'done';
    qs.doneAt = Math.round(p.playTime || 0);
    qs.progress = q.objectives.map(o => o.count);

    // Les quêtes de récolte consomment les matériaux remis au donneur.
    if (q.type === 'side') {
      q.objectives.forEach(o => {
        if (o.type === 'material' && p.materials[o.target]) {
          p.materials[o.target] = Math.max(0, p.materials[o.target] - o.count);
        }
      });
    }

    const r = q.rewards || {};
    if (r.xp) p.gainXp(r.xp, this.game);
    if (r.gold) p.gold += r.gold;
    if (r.potions) {
      Object.keys(r.potions).forEach(kind => p.addPotion(kind, r.potions[kind]));
    }
    if (r.gear) p.addItem(r.gear, this.game);

    p.stats.questsDone = (p.stats.questsDone || 0) + 1;

    if (!opts.silent) {
      this.game.toast('QUÊTE ACCOMPLIE · ' + q.title, '#8ef0a8');
      const bits = [];
      if (r.xp) bits.push('+' + r.xp + ' XP');
      if (r.gold) bits.push('+' + r.gold + ' OR');
      if (bits.length) this.game.toast(bits.join(' · '), '#ffe6a0');
      window.AudioSys.sfx('levelup');
    }

    // Les quêtes principales font avancer la campagne : leur conclusion
    // est racontée dès que l'écran est libre, sans bloquer le joueur.
    if (q.type === 'main' && q.outro && !opts.silent && !this.migrating && this.game.questDialogQueue) {
      this.game.questDialogQueue.push({
        title: q.title,
        lines: q.outro.slice(),
        at: this.game.time + 1.15
      });
    }

    this.game.saveSoon();
    return true;
  };

  /* ------------------------------------------------------------
     PNJ : offres, remises et marqueurs
     ------------------------------------------------------------ */
  Quests.readyFor = function (npcId) {
    return D.QUESTS.filter(q => {
      const s = this.state[q.id];
      return s && s.status === 'ready' && q.giver === npcId;
    });
  };

  Quests.offersFor = function (npcId) {
    return D.QUESTS.filter(q => q.autoStart === 'talk' && q.giver === npcId && !this.state[q.id]);
  };

  Quests.markerFor = function (npcId) {
    if (this.readyFor(npcId).length) return '?';
    if (this.offersFor(npcId).length) return '!';
    return null;
  };

  Quests.hasDialogue = function (npcId) {
    return this.readyFor(npcId).length > 0 || this.offersFor(npcId).length > 0;
  };

  Quests.talkTo = function (npc, opts) {
    opts = opts || {};
    if (!npc) return false;

    const ready = this.readyFor(npc.id);
    if (ready.length) {
      const lines = [];
      ready.forEach(q => {
        if (q.outro && q.outro.length) lines.push.apply(lines, q.outro);
        else lines.push('« ' + q.title + ' » est accomplie. Vous avez ma reconnaissance.');
        this.completeQuest(q.id, { silent: false });
      });
      this.game.toast('RÉCOMPENSES DE QUÊTE REÇUES', '#ffd76a');
      window.AudioSys.sfx('save');
      window.UI.showDialogue(npc.name, lines, { img: npc.img, onDone: opts.onDone });
      return true;
    }

    const offers = this.offersFor(npc.id);
    if (offers.length) {
      const lines = [];
      offers.forEach(q => {
        lines.push(q.desc);
        lines.push('OBJECTIF · ' + q.objectives.map(o => o.label).join(' · '));
        this.startQuest(q.id, { silent: false });
      });
      this.refresh();
      window.UI.showDialogue(npc.name, lines, { img: npc.img, onDone: opts.onDone });
      return true;
    }
    return false;
  };

  /* ------------------------------------------------------------
     Journal et suivi HUD
     ------------------------------------------------------------ */
  Quests.pack = function (q, qs) {
    const objectives = q.objectives.map((o, i) => {
      const current = qs ? (qs.progress[i] || 0) : 0;
      return {
        type: o.type,
        label: o.label,
        count: o.count,
        current,
        done: current >= o.count
      };
    });
    const status = qs ? qs.status : 'locked';
    return {
      id: q.id,
      q,
      status,
      objectives,
      objective: objectives.find(o => !o.done) || objectives[objectives.length - 1],
      giver: this.npcName(q.giver)
    };
  };

  Quests.summary = function () {
    let mainDone = 0, sideDone = 0, active = 0, ready = 0;
    Object.keys(this.state).forEach(id => {
      const q = D.QUEST_BY_ID[id];
      const s = this.state[id];
      if (!q || !s) return;
      if (s.status === 'done') {
        if (q.type === 'main') mainDone++;
        else sideDone++;
      } else if (s.status === 'ready') ready++;
      else active++;
    });
    return {
      mainDone, mainTotal: D.MAIN_QUESTS.length,
      sideDone, sideTotal: D.SIDE_QUESTS.length,
      active, ready
    };
  };

  Quests.journalGroups = function () {
    const main = [];
    let nextLocked = null;
    D.MAIN_QUESTS.forEach(id => {
      const q = D.QUEST_BY_ID[id];
      const s = this.state[id];
      if (s) main.push(this.pack(q, s));
      else if (!nextLocked) nextLocked = { id, q, status: 'locked', objectives: [], giver: this.npcName(q.giver) };
    });
    if (nextLocked) main.push(nextLocked);

    const side = [];
    D.SIDE_QUESTS.forEach(id => {
      const q = D.QUEST_BY_ID[id];
      const s = this.state[id];
      if (s) side.push(this.pack(q, s));
    });
    D.SIDE_QUESTS.forEach(id => {
      const q = D.QUEST_BY_ID[id];
      if (!this.state[id] && q.autoStart === 'talk') side.push(this.pack(q, null));
    });

    const rank = { ready: 0, active: 1, locked: 2, done: 3 };
    side.sort((a, b) => {
      const d = (rank[a.status] || 0) - (rank[b.status] || 0);
      if (d !== 0) return d;
      return a.q.title.localeCompare(b.q.title);
    });

    return { main, side };
  };

  Quests.tracked = function () {
    for (let i = 0; i < D.MAIN_QUESTS.length; i++) {
      const id = D.MAIN_QUESTS[i];
      const s = this.state[id];
      if (s && s.status !== 'done') return this.pack(D.QUEST_BY_ID[id], s);
    }
    for (let i = 0; i < D.SIDE_QUESTS.length; i++) {
      const id = D.SIDE_QUESTS[i];
      const s = this.state[id];
      if (s && s.status === 'ready') return this.pack(D.QUEST_BY_ID[id], s);
    }
    for (let i = 0; i < D.SIDE_QUESTS.length; i++) {
      const id = D.SIDE_QUESTS[i];
      const s = this.state[id];
      if (s && s.status === 'active') return this.pack(D.QUEST_BY_ID[id], s);
    }
    return null;
  };

  /* ------------------------------------------------------------
     Accroches événements du jeu
     ------------------------------------------------------------ */
  Quests.onKill = function () { this.refresh(); };
  Quests.onBoss = function () { this.refresh(); };
  Quests.onChest = function () { this.refresh(); };
  Quests.onMaterial = function () { this.refresh(); };
  Quests.onShrine = function () { this.refresh(); };
  Quests.onUpgrade = function () { this.refresh(); };
  Quests.onGear = function () { this.refresh(); };
  Quests.onDiscovery = function () { this.refresh(); };
  Quests.onZone = function () { this.refresh(); };

  Quests.onTalk = function (npcId) {
    const p = player();
    if (p && p.stats) {
      if (!p.stats.talks) p.stats.talks = {};
      p.stats.talks[npcId] = true;
    }
    this.refresh();
  };

  window.Quests = Quests;
})();
