/* ============================================================
   LES LÉGENDES D'AURORE — audio chiptune procédural
   ============================================================ */
(function () {
  'use strict';
  const A = {
    ctx: null, master: null, musicBus: null, sfxBus: null,
    muted: false, ready: false, theme: null, boss: false,
    step: 0, nextTime: 0, noiseBuffer: null, wantedTheme: null, wantedBoss: false
  };

  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11]
  };

  const THEMES = {
    title: {
      root: 57, scale: 'lydian', tempo: 88, wave: 'triangle',
      melody: [0, null, 2, 4, 7, null, 4, 2, 5, null, 4, 2, 0, null, -1, null, 2, null, 4, 6, 9, null, 7, 4, 2, null, 4, null, 0, null, -1, null],
      bass: [0, null, null, null, 4, null, null, null, 3, null, null, null, 4, null, 2, null],
      arp: [0, 4, 7, 4]
    },
    plains: {
      root: 60, scale: 'major', tempo: 108, wave: 'square',
      melody: [4, null, 4, 2, 4, 5, 7, null, 4, 2, 0, null, 2, 4, 5, null, 7, null, 9, 7, 5, 4, 2, null, 4, 5, 4, 2, 0, null, -1, null],
      bass: [0, null, null, 4, 0, null, null, null, 3, null, 4, null, 2, null, null, null],
      arp: [0, 4, 7, 4]
    },
    forest: {
      root: 57, scale: 'dorian', tempo: 94, wave: 'triangle',
      melody: [0, null, 2, 4, null, 5, 4, null, 2, null, 0, 2, 4, null, 2, null, 5, null, 4, 2, 0, null, 2, null, 4, 5, 4, 2, null, 0, -1, null],
      bass: [0, null, null, null, 4, null, null, null, 2, null, null, null, 4, null, 1, null],
      arp: [0, 3, 7, 3]
    },
    desert: {
      root: 62, scale: 'phrygian', tempo: 104, wave: 'square',
      melody: [0, null, 1, 4, 3, null, 2, 1, 0, null, 4, null, 5, 4, 3, null, 2, null, 1, 0, -1, null, 0, 1, 2, null, 4, null, 3, 1, 0, null],
      bass: [0, null, null, 1, 0, null, null, null, 4, null, null, 3, 0, null, 1, null],
      arp: [0, 3, 4, 3]
    },
    swamp: {
      root: 50, scale: 'minor', tempo: 78, wave: 'triangle',
      melody: [0, null, null, 3, null, 5, null, 4, null, 3, null, null, 2, null, 1, null, 0, null, 4, null, 5, null, 4, 3, null, 2, null, 1, null, -1, null, null],
      bass: [0, null, null, null, 0, null, null, null, 5, null, null, null, 4, null, 3, null],
      arp: [0, 2, 3, 2]
    },
    tundra: {
      root: 59, scale: 'minor', tempo: 84, wave: 'sine',
      melody: [4, null, null, 7, null, 9, null, 7, null, 4, null, null, 2, null, 4, null, 5, null, null, 4, null, 2, null, 0, null, 2, null, 4, null, -1, null, null],
      bass: [0, null, null, null, 4, null, null, null, 3, null, null, null, 0, null, 1, null],
      arp: [0, 4, 7, 4]
    },
    volcano: {
      root: 55, scale: 'phrygian', tempo: 124, wave: 'sawtooth',
      melody: [0, null, 0, 1, 3, null, 4, 3, 1, null, 0, -1, 0, 1, 3, 4, 6, null, 4, 3, 1, null, 0, null, 3, 4, 3, 1, 0, null, -1, null],
      bass: [0, 0, null, 0, 1, null, 0, null, 0, 0, null, 3, 1, null, 0, null],
      arp: [0, 1, 3, 1]
    },
    final: {
      root: 45, scale: 'minor', tempo: 112, wave: 'sawtooth',
      melody: [0, null, 1, 3, 4, null, 6, 5, 4, null, 3, 1, 0, null, -1, null, 3, null, 4, 6, 7, null, 8, 6, 5, null, 4, 3, 1, null, 0, null],
      bass: [0, null, 0, null, 4, null, 3, null, 1, null, 0, null, 4, null, 3, null],
      arp: [0, 3, 4, 3]
    }
  };

  const RATE = 0.5; // durée d'un pas de musique (secondes) — modulée par le tempo

  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function makeNoise(ctx) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  A.init = function () {
    if (A.ready) {
      if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      A.ctx = new Ctx();
      A.master = A.ctx.createGain();
      A.master.gain.value = A.muted ? 0 : 0.3;
      A.musicBus = A.ctx.createGain();
      A.musicBus.gain.value = 0.32;
      A.sfxBus = A.ctx.createGain();
      A.sfxBus.gain.value = 0.6;
      A.musicBus.connect(A.master);
      A.sfxBus.connect(A.master);
      A.master.connect(A.ctx.destination);
      A.noiseBuffer = makeNoise(A.ctx);
      A.ready = true;
      if (A.wantedTheme) {
        const t = A.wantedTheme, b = A.wantedBoss;
        A.wantedTheme = null;
        A.theme = null;
        A.setTheme(t, b);
      }
      if (A.ctx.state === 'suspended') A.ctx.resume();
    } catch (e) {
      console.warn('Audio indisponible', e);
    }
  };

  A.setMuted = function (m) {
    A.muted = !!m;
    if (A.master) A.master.gain.setTargetAtTime(A.muted ? 0 : 0.3, A.ctx.currentTime, 0.03);
  };
  A.toggleMuted = function () { A.setMuted(!A.muted); return A.muted; };

  A.setTheme = function (name, boss) {
    if (!A.ready) { A.wantedTheme = name; A.wantedBoss = !!boss; return; }
    if (A.theme === name && A.boss === !!boss) return;
    A.theme = name; A.boss = !!boss; A.step = 0;
    A.nextTime = A.ctx ? A.ctx.currentTime + 0.05 : 0;
  };

  function stepDuration(theme) {
    let bpm = theme.tempo * (A.boss ? 1.18 : 1);
    return (60 / bpm) / 2; // croches
  }

  function playNote(time, freq, duration, type, gainValue, bus, detune) {
    if (!A.ctx) return;
    const osc = A.ctx.createOscillator();
    const gain = A.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, time);
    if (detune) osc.detune.setValueAtTime(detune, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(gainValue, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(0.05, duration));
    osc.connect(gain);
    gain.connect(bus);
    osc.start(time);
    osc.stop(time + Math.max(0.06, duration) + 0.02);
  }

  function kick(time, gainVal) {
    if (!A.ctx) return;
    const osc = A.ctx.createOscillator();
    const g = A.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);
    g.gain.setValueAtTime(gainVal || 0.24, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
    osc.connect(g); g.connect(A.musicBus);
    osc.start(time); osc.stop(time + 0.18);
  }

  function hat(time, gainVal) {
    if (!A.ctx || !A.noiseBuffer) return;
    const src = A.ctx.createBufferSource();
    src.buffer = A.noiseBuffer;
    const filter = A.ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 6500;
    const g = A.ctx.createGain();
    g.gain.setValueAtTime(gainVal || 0.03, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);
    src.connect(filter); filter.connect(g); g.connect(A.musicBus);
    src.start(time); src.stop(time + 0.05);
  }

  function snare(time) {
    if (!A.ctx || !A.noiseBuffer) return;
    const src = A.ctx.createBufferSource();
    src.buffer = A.noiseBuffer;
    const filter = A.ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 1900; filter.Q.value = 0.7;
    const g = A.ctx.createGain();
    g.gain.setValueAtTime(0.06, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
    src.connect(filter); filter.connect(g); g.connect(A.musicBus);
    src.start(time); src.stop(time + 0.1);
  }

  function degreeToMidi(root, scale, degree, octaveShift) {
    const arr = SCALES[scale] || SCALES.major;
    let oct = Math.floor(degree / 7);
    let idx = ((degree % 7) + 7) % 7;
    return root + arr[idx] + 12 * (oct + (octaveShift || 0));
  }

  A.updateMusic = function () {
    if (!A.ready || !A.ctx || !A.theme || A.muted) return;
    const theme = THEMES[A.theme] || THEMES.plains;
    const dur = stepDuration(theme);
    if (A.nextTime < A.ctx.currentTime - 0.5) A.nextTime = A.ctx.currentTime + 0.05;
    while (A.nextTime < A.ctx.currentTime + 0.18) {
      const s = A.step;
      const t = A.nextTime;
      const scale = A.boss ? (theme.scale === 'major' || theme.scale === 'lydian' ? 'minor' : theme.scale) : theme.scale;
      const root = theme.root - (A.boss ? 2 : 0);
      const mel = theme.melody[s % theme.melody.length];
      if (mel !== null && mel !== undefined) {
        const degree = mel;
        const note = degreeToMidi(root, scale, degree, 1);
        playNote(t, midiToFreq(note), dur * 0.85, theme.wave, 0.055, A.musicBus, A.boss ? 6 : 0);
        // petite harmonie à l'octave pour les thèmes héroïques
        if ((theme.id === 'plains' || A.boss) && s % 8 === 0) {
          playNote(t, midiToFreq(note + 12), dur * 0.7, 'triangle', 0.02, A.musicBus, 0);
        }
      }
      const bass = theme.bass[s % theme.bass.length];
      if (bass !== null && bass !== undefined) {
        const bnote = degreeToMidi(root - 12, scale, bass, 0);
        playNote(t, midiToFreq(bnote), dur * 1.7, 'triangle', 0.075, A.musicBus, 0);
      }
      if (s % 4 === 0) {
        const arp = theme.arp[(Math.floor(s / 4)) % theme.arp.length];
        const anote = degreeToMidi(root, scale, arp, 0);
        playNote(t + dur * 0.5, midiToFreq(anote), dur * 0.3, 'square', 0.018, A.musicBus, 0);
      }
      if (s % 8 === 0) kick(t, A.boss ? 0.24 : 0.18);
      if (s % 8 === 4) snare(t);
      if (A.boss || theme.tempo > 100) { if (s % 2 === 0) hat(t, 0.018); }
      A.nextTime += dur;
      A.step = (A.step + 1) % 64;
    }
  };

  /* ------------------------------------------------------------
     Bruitages
     ------------------------------------------------------------ */
  function envTone(freq, dur, type, gainVal, slideTo, delay) {
    if (!A.ready || A.muted) return;
    const t = A.ctx.currentTime + (delay || 0);
    const osc = A.ctx.createOscillator();
    const g = A.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gainVal || 0.12, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(A.sfxBus);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  function noiseBurst(dur, filterFreq, gainVal, type, delay) {
    if (!A.ready || A.muted || !A.noiseBuffer) return;
    const t = A.ctx.currentTime + (delay || 0);
    const src = A.ctx.createBufferSource();
    src.buffer = A.noiseBuffer;
    const filter = A.ctx.createBiquadFilter();
    filter.type = type || 'bandpass';
    filter.frequency.setValueAtTime(filterFreq || 1000, t);
    const g = A.ctx.createGain();
    g.gain.setValueAtTime(gainVal || 0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter); filter.connect(g); g.connect(A.sfxBus);
    src.start(t); src.stop(t + dur + 0.02);
  }

  A.sfx = function (name) {
    if (!A.ready || A.muted) return;
    switch (name) {
      case 'swing':
        envTone(420, 0.1, 'sawtooth', 0.05, 180);
        noiseBurst(0.07, 2200, 0.04);
        break;
      case 'heavy':
        envTone(190, 0.18, 'sawtooth', 0.08, 70);
        noiseBurst(0.12, 900, 0.08);
        break;
      case 'arrow':
        envTone(820, 0.12, 'triangle', 0.06, 300);
        break;
      case 'magic':
        envTone(520, 0.2, 'sine', 0.07, 1200);
        envTone(780, 0.26, 'triangle', 0.04, 1560, 0.03);
        break;
      case 'hit':
        noiseBurst(0.08, 1600, 0.12);
        envTone(160, 0.08, 'square', 0.06, 80);
        break;
      case 'bossHit':
        envTone(110, 0.16, 'square', 0.1, 55);
        noiseBurst(0.14, 700, 0.1);
        break;
      case 'hurt':
        envTone(300, 0.22, 'sawtooth', 0.1, 90);
        noiseBurst(0.12, 500, 0.08);
        break;
      case 'heal':
        [523, 659, 784, 1046].forEach((f, i) => envTone(f, 0.28, 'triangle', 0.05, f, i * 0.06));
        break;
      case 'potion':
        [392, 523, 659].forEach((f, i) => envTone(f, 0.2, 'sine', 0.06, f * 1.3, i * 0.05));
        break;
      case 'pickup':
        envTone(660, 0.06, 'square', 0.07);
        envTone(880, 0.1, 'square', 0.06, 990, 0.06);
        break;
      case 'coin':
        envTone(1200, 0.05, 'square', 0.035);
        envTone(1600, 0.07, 'square', 0.03, 1800, 0.04);
        break;
      case 'chest':
        noiseBurst(0.2, 800, 0.06);
        envTone(440, 0.2, 'triangle', 0.08, 660, 0.12);
        envTone(660, 0.3, 'triangle', 0.06, 880, 0.22);
        break;
      case 'levelup':
        [392, 523, 659, 784, 1046].forEach((f, i) => envTone(f, 0.24, 'square', 0.06, f, i * 0.09));
        break;
      case 'dodge':
        noiseBurst(0.12, 2600, 0.05);
        envTone(600, 0.1, 'triangle', 0.04, 1200);
        break;
      case 'bossRoar':
        envTone(75, 0.6, 'sawtooth', 0.16, 42);
        envTone(112, 0.5, 'square', 0.08, 60, 0.05);
        noiseBurst(0.55, 320, 0.12, 'lowpass');
        break;
      case 'bossDown':
        [220, 174, 146, 110, 87].forEach((f, i) => envTone(f, 0.7, 'sawtooth', 0.06, f * 0.7, i * 0.16));
        noiseBurst(0.9, 500, 0.1, 'lowpass', 0.1);
        break;
      case 'death':
        [392, 330, 262, 196, 131].forEach((f, i) => envTone(f, 0.5, 'triangle', 0.07, f * 0.8, i * 0.17));
        break;
      case 'victory':
        [523, 523, 523, 659, 784, 659, 784, 1046].forEach((f, i) => envTone(f, 0.35, 'square', 0.06, f, i * 0.14));
        break;
      case 'buy':
        envTone(880, 0.07, 'square', 0.05);
        envTone(1320, 0.12, 'square', 0.04, 1320, 0.06);
        break;
      case 'error':
        envTone(180, 0.16, 'square', 0.08, 120);
        break;
      case 'click':
        envTone(640, 0.04, 'square', 0.045);
        break;
      case 'save':
        [523, 784, 1046].forEach((f, i) => envTone(f, 0.18, 'triangle', 0.04, f, i * 0.08));
        break;
      case 'slam':
        envTone(70, 0.35, 'sawtooth', 0.14, 32);
        noiseBurst(0.28, 400, 0.16, 'lowpass');
        break;
      case 'warp':
        envTone(260, 0.28, 'sine', 0.06, 1400);
        noiseBurst(0.22, 3000, 0.04);
        break;
      case 'snow':
        noiseBurst(0.2, 4000, 0.02);
        break;
    }
  };

  A.fadeOut = function () {
    if (!A.ctx || !A.musicBus) return;
    A.musicBus.gain.setTargetAtTime(0, A.ctx.currentTime, 0.15);
  };
  A.fadeIn = function () {
    if (!A.ctx || !A.musicBus) return;
    A.musicBus.gain.setTargetAtTime(0.32, A.ctx.currentTime, 0.2);
  };

  window.AudioSys = A;
})();
