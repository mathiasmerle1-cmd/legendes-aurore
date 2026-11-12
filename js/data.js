/* ============================================================
   LES LÉGENDES D'AURORE — données du monde
   ============================================================ */
(function () {
  'use strict';
  const D = {};

  D.TITLE = "LES LÉGENDES D'AURORE";
  D.VERSION = '1.0.0';
  D.SAVE_KEY = 'legendes_aurore_save_v1';
  /* La carte de référence fait 240 × 240. Le monde final vaut 480 × 480. */
  D.MAP_SCALE = 2;
  D.WORLD_SIZE = 240 * D.MAP_SCALE;
  D.TILE = 16;

  /* ------------------------------------------------------------
     Personnages
     ------------------------------------------------------------ */
  D.CLASSES = [
    {
      id: 'epeiste', name: 'Épéiste', icon: 'epee_entrainement',
      hp: 110, atk: 3, def: 2, spd: 65, crit: 0.06, weapon: 'epee_entrainement',
      tagline: 'Lame et panache',
      desc: 'Polyvalent et rapide. Un héros équilibré, idéal pour découvrir Aurore.',
      color: '#6fc3ff'
    },
    {
      id: 'gardien', name: 'Gardien', icon: 'marteau_bois',
      hp: 148, atk: 1, def: 6, spd: 54, crit: 0.04, weapon: 'marteau_bois',
      tagline: 'Bouclier vivant',
      desc: 'Robuste et lent. Encaisse les coups et frappe fort avec les armes lourdes.',
      color: '#ffb35c'
    },
    {
      id: 'ombre', name: 'Ombre', icon: 'dagues_jumelles',
      hp: 92, atk: 4, def: 1, spd: 72, crit: 0.13, weapon: 'dagues_jumelles',
      tagline: 'Vif comme le vent',
      desc: 'Fragile mais fulgurant. Critique souvent et danse autour de ses ennemis.',
      color: '#c88cff'
    }
  ];

  D.SKINS = [
    { name: 'Nacre', base: '#f4d3b3', shade: '#d9ad87', light: '#ffe6cf' },
    { name: 'Miel', base: '#e8b98c', shade: '#c79164', light: '#f7d7b6' },
    { name: 'Terre', base: '#c98b60', shade: '#a66c45', light: '#e0aa80' },
    { name: 'Cacao', base: '#9a6343', shade: '#77472f', light: '#b77c59' },
    { name: 'Ébène', base: '#6b4532', shade: '#4d2e22', light: '#865e45' },
    { name: 'Amande', base: '#d8a075', shade: '#b5774e', light: '#ecc09a' },
    { name: 'Ivoire', base: '#f7e2c8', shade: '#dbbd9d', light: '#fff5e6' },
    { name: 'Cuivre', base: '#b96f4e', shade: '#945236', light: '#d68f6a' },
    { name: 'Olive', base: '#b08b5e', shade: '#876843', light: '#c9a87b' },
    { name: 'Cendre', base: '#8d7466', shade: '#675348', light: '#ad9484' }
  ];

  D.HAIRS = [
    { id: 'court', name: 'Court' },
    { id: 'long', name: 'Long' },
    { id: 'tresse', name: 'Tresse' },
    { id: 'spiky', name: 'Ébouriffé' },
    { id: 'chignon', name: 'Chignon' },
    { id: 'rase', name: 'Rasé' },
    { id: 'queue', name: 'Queue' },
    { id: 'mohawk', name: 'Mohawk' },
    { id: 'afro', name: 'Afro' },
    { id: 'braids', name: 'Nattes' }
  ];

  D.HAIR_COLORS = [
    { name: 'Nuit', base: '#2b2438', shade: '#191522' },
    { name: 'Châtain', base: '#6f432b', shade: '#4c2c1c' },
    { name: 'Blond', base: '#e8be62', shade: '#c5963f' },
    { name: 'Roux', base: '#c2552f', shade: '#91381f' },
    { name: 'Neige', base: '#e8e3d8', shade: '#bfb8ab' },
    { name: 'Rose', base: '#db7e9e', shade: '#ab5774' },
    { name: 'Vert', base: '#6c9b6a', shade: '#4b744b' },
    { name: 'Bleu', base: '#557fb9', shade: '#3b5d8e' },
    { name: 'Aube', base: '#f3ead0', shade: '#c9bea4' },
    { name: 'Lavande', base: '#9b7fc4', shade: '#73599b' },
    { name: 'Menthe', base: '#7fc4a8', shade: '#57947d' },
    { name: 'Cuivre', base: '#b05a34', shade: '#813d22' },
    { name: 'Océan', base: '#3f7f9e', shade: '#2a5d78' },
    { name: 'Corbeau', base: '#1c1c26', shade: '#0e0e16' },
    { name: 'Cerise', base: '#9f3350', shade: '#76223a' }
  ];

  D.EYE_COLORS = [
    { name: 'Noisette', base: '#5b3a24', glow: '#a9774b' },
    { name: 'Ambre', base: '#b6791f', glow: '#f0c35a' },
    { name: 'Émeraude', base: '#2f7d57', glow: '#73d69d' },
    { name: 'Azur', base: '#316b9b', glow: '#7fc8ef' },
    { name: 'Gris', base: '#56616b', glow: '#a9b6c0' },
    { name: 'Violet', base: '#6f4a97', glow: '#bd8be8' },
    { name: 'Rubis', base: '#8d2f3c', glow: '#e87882' },
    { name: 'Nuit', base: '#1d1b2a', glow: '#4f496d' }
  ];

  D.SHIRT_COLORS = [
    { name: 'Azur', base: '#4f8fd0', shade: '#38689c' },
    { name: 'Émeraude', base: '#52a56d', shade: '#397b4e' },
    { name: 'Rubis', base: '#c4554f', shade: '#963b38' },
    { name: 'Ambre', base: '#db9c45', shade: '#ab7430' },
    { name: 'Prune', base: '#8b5ba8', shade: '#663f7d' },
    { name: 'Neige', base: '#e3ddd0', shade: '#b9b2a5' },
    { name: 'Nuit', base: '#42405a', shade: '#2b2a3e' },
    { name: 'Corail', base: '#e08a72', shade: '#b56350' },
    { name: 'Sable', base: '#c9b382', shade: '#a08c61' },
    { name: 'Céladon', base: '#87ad8b', shade: '#638a6a' },
    { name: 'Indigo', base: '#4b4e96', shade: '#34366c' },
    { name: 'Ivoire', base: '#ded6bf', shade: '#b3aa90' }
  ];

  D.PANTS_COLORS = [
    { name: 'Encre', base: '#35334a', shade: '#242235' },
    { name: 'Camel', base: '#8b6848', shade: '#674b34' },
    { name: 'Olive', base: '#68734b', shade: '#4b5436' },
    { name: 'Marine', base: '#3e5375', shade: '#2c3b55' },
    { name: 'Brique', base: '#8d4f42', shade: '#68382f' },
    { name: 'Brume', base: '#a6a3a8', shade: '#7d7a82' },
    { name: 'Sable', base: '#b9a077', shade: '#8e7854' },
    { name: 'Forêt', base: '#3d5e45', shade: '#2a4330' },
    { name: 'Prune', base: '#5c3f66', shade: '#422c4b' },
    { name: 'Rouille', base: '#7d4a32', shade: '#5b3222' }
  ];

  D.ACCESSORIES = [
    { id: 'none', name: 'Aucun' },
    { id: 'bandeau', name: 'Bandeau' },
    { id: 'chapeau', name: 'Chapeau' },
    { id: 'capuche', name: 'Capuche' },
    { id: 'lunettes', name: 'Lunettes' },
    { id: 'echarpe', name: 'Écharpe' },
    { id: 'cape', name: 'Cape' },
    { id: 'couronne', name: 'Couronne' },
    { id: 'masque', name: 'Masque' },
    { id: 'ailes', name: 'Ailes' },
    { id: 'halo', name: 'Halo' }
  ];

  D.ACCESSORY_COLORS = [
    { name: 'Or', base: '#e7bc55', shade: '#b38732' },
    { name: 'Azur', base: '#5f9fd8', shade: '#3e6e9d' },
    { name: 'Émeraude', base: '#67b57d', shade: '#438154' },
    { name: 'Rubis', base: '#c65a59', shade: '#923b3d' },
    { name: 'Prune', base: '#9a68b8', shade: '#6e4688' },
    { name: 'Neige', base: '#e7e0d2', shade: '#b9b0a0' },
    { name: 'Nuit', base: '#3f3b58', shade: '#27243a' }
  ];

  D.AURAS = [
    { id: 'none', name: 'Aucune', color: null },
    { id: 'aube', name: 'Aube', color: '#ffd76a' },
    { id: 'sylve', name: 'Sylve', color: '#8ef0a8' },
    { id: 'braise', name: 'Braise', color: '#ff9a5e' },
    { id: 'givre', name: 'Givre', color: '#9fe8ff' },
    { id: 'ombre', name: 'Ombre', color: '#c891ff' }
  ];

  D.ORIGINS = [
    { id: 'aurore', name: "Enfant d'Aurore", desc: 'Élevé dans la lumière du village.', hp: 12, def: 1, icon: 'A' },
    { id: 'nomade', name: 'Nomade', desc: 'Les longues routes ne vous fatiguent plus.', spd: 0.06, stamina: 10, icon: 'N' },
    { id: 'chasseur', name: 'Chasseur', desc: 'Vous frappez là où ça compte.', crit: 0.045, icon: 'C' },
    { id: 'erudit', name: 'Érudit', desc: 'Chaque combat est une leçon.', xp: 0.15, icon: 'E' },
    { id: 'forgeron', name: 'Forgeron', desc: 'Le métal ne vous fait pas peur.', hp: 8, def: 2, icon: 'F' },
    { id: 'veilleur', name: 'Veilleur', desc: 'Vous avez appris à danser avec l’ombre.', crit: 0.02, spd: 0.04, icon: 'V' }
  ];

  D.DEFAULT_LOOK = {
    skin: 1, hair: 0, hairColor: 1, eye: 0, shirt: 0, pants: 0,
    accessory: 0, accessoryColor: 0, aura: 0
  };

  /* ------------------------------------------------------------
     Zones et biomes
     ------------------------------------------------------------ */
  D.ZONES = [
    {
      id: 'plains', index: 0, name: "Plaines d'Aurore", short: 'PLAINES', color: '#7cc45b', dark: '#3d7145',
      levelMin: 1, levelMax: 4, anchor: { x: 116, y: 126 },
      desc: "Un océan d'herbes dorées où souffle le premier matin du monde.",
      species: ['lapin', 'sanglier', 'fee', 'slime', 'poulain_vent', 'epouvantail'],
      arenas: [
        { id: 'plains_mini1', kind: 'mini', x: 90, y: 108, boss: 'grumf' },
        { id: 'plains_mini2', kind: 'mini', x: 145, y: 112, boss: 'sylvette' },
        { id: 'plains_boss', kind: 'big', x: 126, y: 160, boss: 'titanos' }
      ]
    },
    {
      id: 'forest', index: 1, name: 'Forêt de Sylve', short: 'FORÊT', color: '#4f9151', dark: '#2b5939',
      levelMin: 4, levelMax: 7, anchor: { x: 48, y: 58 },
      desc: "Des futaies si anciennes que les arbres murmurent encore les noms oubliés.",
      species: ['champi', 'loup', 'araignee', 'ent', 'sanglier_ronces', 'fee_noire'],
      arenas: [
        { id: 'forest_mini1', kind: 'mini', x: 32, y: 44, boss: 'arachnis' },
        { id: 'forest_mini2', kind: 'mini', x: 68, y: 74, boss: 'champignor' },
        { id: 'forest_boss', kind: 'big', x: 44, y: 92, boss: 'sylvath' }
      ]
    },
    {
      id: 'desert', index: 2, name: 'Désert de Rubis', short: 'DÉSERT', color: '#dbbb72', dark: '#8f6c3e',
      levelMin: 7, levelMax: 10, anchor: { x: 206, y: 128 },
      desc: "Les dunes cachent des cités entières et le soleil y compte chaque pas.",
      species: ['scorpion', 'vautour', 'momie', 'ver', 'scarabee_fer', 'djinn'],
      arenas: [
        { id: 'desert_mini1', kind: 'mini', x: 196, y: 102, boss: 'dunak' },
        { id: 'desert_mini2', kind: 'mini', x: 222, y: 142, boss: 'kharos' },
        { id: 'desert_boss', kind: 'big', x: 205, y: 170, boss: 'sethrak' }
      ]
    },
    {
      id: 'swamp', index: 3, name: 'Marais de Morn', short: 'MARAIS', color: '#6e8650', dark: '#3e4f34',
      levelMin: 10, levelMax: 13, anchor: { x: 48, y: 188 },
      desc: "L'eau y est noire, la brume épaisse, et les roseaux écoutent vos secrets.",
      species: ['grenouille', 'spectre', 'croco', 'sorciere', 'lamie', 'feufollet'],
      arenas: [
        { id: 'swamp_mini1', kind: 'mini', x: 28, y: 174, boss: 'gribbou' },
        { id: 'swamp_mini2', kind: 'mini', x: 68, y: 184, boss: 'lugubre' },
        { id: 'swamp_boss', kind: 'big', x: 48, y: 212, boss: 'morn' }
      ]
    },
    {
      id: 'tundra', index: 4, name: 'Toundra de Givre', short: 'TOUNDRA', color: '#cfe3ec', dark: '#7594a3',
      levelMin: 13, levelMax: 16, anchor: { x: 152, y: 34 },
      desc: "Un désert blanc où le vent efface les traces et glace les courageux.",
      species: ['loupglace', 'golemglace', 'hibou', 'yeti', 'renard_givre', 'elementaire'],
      arenas: [
        { id: 'tundra_mini1', kind: 'mini', x: 132, y: 24, boss: 'givrok' },
        { id: 'tundra_mini2', kind: 'mini', x: 178, y: 30, boss: 'hela' },
        { id: 'tundra_boss', kind: 'big', x: 158, y: 58, boss: 'frostgar' }
      ]
    },
    {
      id: 'volcano', index: 5, name: 'Volcan de Braise', short: 'VOLCAN', color: '#9a5a4b', dark: '#572f32',
      levelMin: 16, levelMax: 19, anchor: { x: 176, y: 200 },
      desc: "La montagne respire du feu. Chaque roche y garde la chaleur d'un ancien dieu.",
      species: ['diablotin', 'salamandre', 'golemlave', 'slimefeu', 'chauvesouris', 'chaman'],
      arenas: [
        { id: 'volcano_mini1', kind: 'mini', x: 156, y: 184, boss: 'pyrolis' },
        { id: 'volcano_mini2', kind: 'mini', x: 196, y: 188, boss: 'ignis' },
        { id: 'volcano_boss', kind: 'big', x: 180, y: 218, boss: 'vulkaros' }
      ]
    }
  ];

  D.ZONE_BY_ID = Object.fromEntries(D.ZONES.map(z => [z.id, z]));

  D.VILLAGE = { x: 116, y: 126, r: 16, name: "Village d'Aurore" };
  D.FINAL_ARENA = { id: 'final', x: 116, y: 86, r: 9, boss: 'nyx' };

  /* ------------------------------------------------------------
     Styles d'attaque
     ------------------------------------------------------------ */
  D.ATTACK_STYLES = {
    slash: { name: 'Taille', cooldown: 0.42, reach: 31, arc: 1.9, mult: 1.0, melee: true, knock: 46, color: '#ffe9a8' },
    heavy: { name: 'Frappe', cooldown: 0.68, reach: 35, arc: 2.2, mult: 1.5, melee: true, knock: 88, color: '#ffc46b' },
    thrust: { name: 'Estoc', cooldown: 0.5, reach: 42, arc: 0.9, mult: 1.22, melee: true, knock: 55, color: '#cfe9ff' },
    stab: { name: 'Dagues', cooldown: 0.28, reach: 25, arc: 1.5, mult: 0.62, melee: true, knock: 22, color: '#e4d4ff' },
    bow: { name: 'Arc', cooldown: 0.58, reach: 200, mult: 0.9, melee: false, projectile: 'arrow', speed: 300, knock: 24, color: '#ffe9a8' },
    crossbow: { name: 'Arbalète', cooldown: 0.78, reach: 240, mult: 1.22, melee: false, projectile: 'bolt', speed: 360, knock: 40, color: '#ffce85' },
    blowgun: { name: 'Sarbacane', cooldown: 0.62, reach: 175, mult: 0.82, melee: false, projectile: 'needle', speed: 250, knock: 12, color: '#b8ef9b' },
    magic: { name: 'Arcane', cooldown: 0.6, reach: 210, mult: 1.05, melee: false, projectile: 'spirit', speed: 240, knock: 34, color: '#c8b6ff' }
  };

  /* ------------------------------------------------------------
     Monstres
     ------------------------------------------------------------ */
  const C = {
    cream: { body: '#e7d7ac', shade: '#c4ae7c', light: '#f5eccf', accent: '#b06e4b', eye: '#2a2233' },
    boar: { body: '#9b6d4d', shade: '#744c34', light: '#c0926b', accent: '#e7ddc3', eye: '#2a1e23' },
    fairy: { body: '#b8f0e2', shade: '#76c7cc', light: '#effffb', accent: '#ffd56a', eye: '#3d3a5d' },
    slime: { body: '#7fc95a', shade: '#569c3e', light: '#bbef8e', accent: '#3e6c32', eye: '#1f2a24' },
    mush: { body: '#e1d5b2', shade: '#b8a580', light: '#f5edda', accent: '#c44b48', eye: '#2c2230' },
    wolf: { body: '#7b8786', shade: '#566260', light: '#a8b3b1', accent: '#d8dfd7', eye: '#f0c754' },
    spider: { body: '#5b3f66', shade: '#3e2949', light: '#89629b', accent: '#e4d8a1', eye: '#ff6363' },
    ent: { body: '#7d5a3a', shade: '#563b27', light: '#a77a51', accent: '#5f963e', eye: '#e8e28b' },
    sand: { body: '#c9a76f', shade: '#9e7b49', light: '#e5cb96', accent: '#7b5b38', eye: '#3b2b26' },
    gold: { body: '#e0b95a', shade: '#b48a38', light: '#f8df97', accent: '#6e4a2f', eye: '#2e2524' },
    mummy: { body: '#d2c7a6', shade: '#a89b7a', light: '#eee5c9', accent: '#967544', eye: '#ff854d' },
    worm: { body: '#bb925f', shade: '#8e6a40', light: '#dfbd8a', accent: '#6a4630', eye: '#ffd36a' },
    frog: { body: '#7ba95a', shade: '#527a3b', light: '#a8ce83', accent: '#e1cf6a', eye: '#f3e261' },
    ghost: { body: '#a9b6c9', shade: '#74839b', light: '#dde7ef', accent: '#7b60a6', eye: '#483363' },
    croc: { body: '#5f8356', shade: '#3f5e3c', light: '#88a97a', accent: '#d8d39c', eye: '#e8c14f' },
    witch: { body: '#6f5a7b', shade: '#4c3d59', light: '#957da4', accent: '#9bd16b', eye: '#e9d86c' },
    ice: { body: '#b9ddeb', shade: '#7fa9bf', light: '#e6f8ff', accent: '#6fa4ca', eye: '#2e5069' },
    snow: { body: '#e7edf2', shade: '#b8c8d5', light: '#ffffff', accent: '#8fb3c6', eye: '#384a5c' },
    owl: { body: '#b9a684', shade: '#8d7a5b', light: '#ded2b8', accent: '#e7d9ae', eye: '#f4c94f' },
    yeti: { body: '#dce9ee', shade: '#a9c1cf', light: '#f6ffff', accent: '#7b9db4', eye: '#36556b' },
    imp: { body: '#a34a43', shade: '#732f2d', light: '#ce6c5a', accent: '#e7b45d', eye: '#ffe05c' },
    sala: { body: '#b94f35', shade: '#843426', light: '#e77750', accent: '#ffcf5c', eye: '#ffe46b' },
    golem: { body: '#69605f', shade: '#4a4242', light: '#8d807c', accent: '#d7663f', eye: '#ffab4e' },
    lavaslime: { body: '#c85a36', shade: '#932f27', light: '#f28a4f', accent: '#ffd05c', eye: '#2b1d22' },
    shadow: { body: '#453a58', shade: '#2a2337', light: '#685674', accent: '#9b6bd6', eye: '#ff657e' }
  };
  D.SPECIES_PALETTES = C;

  function sp(id, name, biome, shape, lo, hi, hp, dmg, spd, ranged, opts) {
    return Object.assign({
      id, name, biome, shape, levelMin: lo, levelMax: hi, hpMult: hp, dmgMult: dmg,
      speed: spd, ranged: !!ranged, aggro: ranged ? 140 : 118, attackRange: ranged ? 92 : 24,
      projectile: ranged ? 'enemy_orb' : null, projectileColor: '#e7a9ff', scale: 1
    }, opts || {});
  }

  D.SPECIES = {
    lapin: sp('lapin', 'Lapin Cornu', 'plains', 'bunny', 1, 3, 0.8, 0.85, 54, false, { colors: C.cream, features: ['horn'], xpMult: 0.9 }),
    sanglier: sp('sanglier', 'Sanglier des Champs', 'plains', 'boar', 2, 4, 1.35, 1.18, 47, false, { colors: C.boar, features: ['tusks'], xpMult: 1.2 }),
    fee: sp('fee', 'Fée des Blés', 'plains', 'wisp', 2, 4, 0.7, 1.0, 62, true, { colors: C.fairy, features: ['wings'], projectileColor: '#ffe58e', xpMult: 1.1 }),
    slime: sp('slime', 'Gelée Verte', 'plains', 'blob', 1, 4, 1.05, 0.95, 36, false, { colors: C.slime, features: [], xpMult: 1 }),

    champi: sp('champi', 'Champi Toxique', 'forest', 'mushroom', 4, 6, 0.9, 1.15, 32, true, { colors: C.mush, features: ['spots'], projectileColor: '#a6e06a', xpMult: 1.1 }),
    loup: sp('loup', 'Loup de Sylve', 'forest', 'wolf', 5, 7, 1.05, 1.28, 76, false, { colors: C.wolf, features: [], xpMult: 1.15 }),
    araignee: sp('araignee', 'Araignée Tisseuse', 'forest', 'spider', 5, 7, 0.85, 1.1, 58, true, { colors: C.spider, features: ['web'], projectileColor: '#e6e0ff', xpMult: 1.15 }),
    ent: sp('ent', 'Jeune Ent', 'forest', 'ent', 6, 7, 1.65, 1.2, 31, false, { colors: C.ent, features: [], xpMult: 1.35, scale: 1.1 }),

    scorpion: sp('scorpion', 'Scorpion de Sable', 'desert', 'scorpion', 7, 9, 1.05, 1.36, 62, false, { colors: C.gold, features: ['stinger'], xpMult: 1.2 }),
    vautour: sp('vautour', 'Vautour des Dunes', 'desert', 'bird', 8, 10, 0.8, 1.25, 79, false, { colors: C.sand, features: ['beak'], xpMult: 1.1 }),
    momie: sp('momie', 'Momie Errante', 'desert', 'mummy', 8, 10, 1.45, 1.2, 39, false, { colors: C.mummy, features: ['bandages'], xpMult: 1.25 }),
    ver: sp('ver', 'Ver des Sables', 'desert', 'worm', 9, 10, 1.55, 1.32, 43, false, { colors: C.worm, features: [], xpMult: 1.35, scale: 1.1 }),

    grenouille: sp('grenouille', 'Grenouille Toxique', 'swamp', 'frog', 10, 12, 0.9, 1.2, 57, true, { colors: C.frog, features: [], projectileColor: '#a5e868', xpMult: 1.15 }),
    spectre: sp('spectre', 'Spectre des Roseaux', 'swamp', 'ghost', 11, 13, 0.8, 1.38, 52, true, { colors: C.ghost, features: ['float'], projectileColor: '#bb9bff', xpMult: 1.25, ghostly: true }),
    croco: sp('croco', 'Crocodile de Boue', 'swamp', 'croc', 11, 13, 1.6, 1.42, 44, false, { colors: C.croc, features: ['teeth'], xpMult: 1.3 }),
    sorciere: sp('sorciere', 'Sorcière du Marais', 'swamp', 'witch', 12, 13, 0.9, 1.5, 47, true, { colors: C.witch, features: ['hat'], projectileColor: '#c0ff88', xpMult: 1.3 }),

    loupglace: sp('loupglace', 'Loup de Givre', 'tundra', 'wolf', 13, 15, 1.15, 1.4, 79, false, { colors: C.ice, features: ['ice'], xpMult: 1.2 }),
    golemglace: sp('golemglace', 'Golem de Glace', 'tundra', 'golem', 14, 16, 1.85, 1.22, 32, false, { colors: C.ice, features: ['ice'], xpMult: 1.35, scale: 1.1 }),
    hibou: sp('hibou', 'Hibou des Neiges', 'tundra', 'bird', 14, 16, 0.9, 1.25, 58, true, { colors: C.owl, features: ['owl'], projectileColor: '#a9e9ff', xpMult: 1.2 }),
    yeti: sp('yeti', 'Yéti', 'tundra', 'yeti', 15, 16, 1.75, 1.5, 52, false, { colors: C.yeti, features: [], xpMult: 1.4, scale: 1.08 }),

    diablotin: sp('diablotin', 'Diablotin de Cendre', 'volcano', 'imp', 16, 18, 0.9, 1.4, 67, true, { colors: C.imp, features: ['horns'], projectileColor: '#ff9b4e', xpMult: 1.2 }),
    salamandre: sp('salamandre', 'Salamandre de Magma', 'volcano', 'croc', 17, 19, 1.25, 1.5, 63, false, { colors: C.sala, features: ['flame'], xpMult: 1.3 }),
    golemlave: sp('golemlave', 'Golem de Basalte', 'volcano', 'golem', 18, 19, 2.0, 1.42, 34, false, { colors: C.golem, features: ['lava'], xpMult: 1.4, scale: 1.12 }),
    slimefeu: sp('slimefeu', 'Gelée de Lave', 'volcano', 'blob', 16, 19, 1.15, 1.38, 40, false, { colors: C.lavaslime, features: ['flame'], xpMult: 1.2 }),

    /* Espèces supplémentaires — routes, avant-postes et secrets */
    poulain_vent: sp('poulain_vent', 'Poulain des Vents', 'plains', 'bird', 2, 4, 0.75, 1.02, 86, false, {
      colors: { body: '#cfe8e2', shade: '#93bdb8', light: '#f1fffb', accent: '#dfb95d', eye: '#31585c' },
      features: ['wings'], xpMult: 1.2, material: 'plume_vent', materialChance: 0.45
    }),
    epouvantail: sp('epouvantail', 'Épouvantail Vivant', 'plains', 'ent', 3, 4, 1.3, 1.15, 33, false, {
      colors: { body: '#c8a86d', shade: '#947442', light: '#e7ce97', accent: '#4c7a3d', eye: '#ffdc64' },
      features: ['hat'], xpMult: 1.2, material: 'fibre_epouvantail', materialChance: 0.5
    }),
    sanglier_ronces: sp('sanglier_ronces', 'Sanglier des Ronces', 'forest', 'boar', 5, 7, 1.35, 1.32, 54, false, {
      colors: { body: '#66573d', shade: '#453a2b', light: '#8e7b55', accent: '#88b653', eye: '#ffcf61' },
      features: ['tusks'], xpMult: 1.25, material: 'fibre_ronce', materialChance: 0.45
    }),
    fee_noire: sp('fee_noire', 'Fée du Crépuscule', 'forest', 'wisp', 6, 7, 0.8, 1.25, 70, true, {
      colors: { body: '#9278b8', shade: '#624d85', light: '#c9b4e8', accent: '#ff9ad0', eye: '#2d2340' },
      features: ['wings'], projectileColor: '#d6a0ff', xpMult: 1.25, material: 'pollen_noir', materialChance: 0.45
    }),
    scarabee_fer: sp('scarabee_fer', 'Scarabée de Fer', 'desert', 'scorpion', 8, 10, 1.18, 1.32, 61, false, {
      colors: { body: '#6d737c', shade: '#484e57', light: '#a0a9b4', accent: '#d9b55c', eye: '#ffd35e' },
      features: ['stinger'], xpMult: 1.3, material: 'fer_noir', materialChance: 0.4
    }),
    djinn: sp('djinn', 'Djinn du Mirage', 'desert', 'ghost', 9, 10, 0.9, 1.4, 58, true, {
      colors: { body: '#c6a5c9', shade: '#8f709b', light: '#efd9ee', accent: '#e9c56b', eye: '#49314f' },
      features: ['float'], projectileColor: '#e7b7ff', ghostly: true, xpMult: 1.35, material: 'essence_mirage', materialChance: 0.4
    }),
    lamie: sp('lamie', 'Lamie des Roseaux', 'swamp', 'spider', 11, 13, 1.1, 1.38, 67, false, {
      colors: { body: '#6c5c74', shade: '#4a3d54', light: '#94819e', accent: '#9ed17a', eye: '#ffb0c9' },
      features: ['web'], xpMult: 1.35, material: 'soie_toile', materialChance: 0.45
    }),
    feufollet: sp('feufollet', 'Feu Follet', 'swamp', 'wisp', 11, 13, 0.75, 1.42, 72, true, {
      colors: { body: '#9ecfa1', shade: '#65977a', light: '#dcffd6', accent: '#e7dd75', eye: '#355a51' },
      features: ['float'], projectileColor: '#c8ff9f', ghostly: true, xpMult: 1.3, material: 'lueur_morte', materialChance: 0.4
    }),
    renard_givre: sp('renard_givre', 'Renard de Givre', 'tundra', 'wolf', 14, 16, 1.2, 1.42, 84, false, {
      colors: { body: '#d8eaf0', shade: '#a6c2ce', light: '#f5ffff', accent: '#7faed0', eye: '#4eb8db' },
      features: ['ice'], xpMult: 1.3, material: 'fourrure_givre', materialChance: 0.45
    }),
    elementaire: sp('elementaire', 'Élémentaire de Glace', 'tundra', 'golem', 15, 16, 1.5, 1.3, 38, true, {
      colors: { body: '#a6d9e8', shade: '#70a9bd', light: '#e6fbff', accent: '#69c9e8', eye: '#d9ffff' },
      features: ['ice'], projectileColor: '#b7f2ff', xpMult: 1.4, material: 'cristal_givre', materialChance: 0.45
    }),
    chauvesouris: sp('chauvesouris', 'Chauve-Souris de Lave', 'volcano', 'wisp', 16, 18, 0.8, 1.38, 90, false, {
      colors: { body: '#743a44', shade: '#4d252f', light: '#a65c62', accent: '#ff9b4e', eye: '#ffe16a' },
      features: ['wings'], xpMult: 1.2, material: 'aile_cendre', materialChance: 0.45
    }),
    chaman: sp('chaman', 'Chaman des Cendres', 'volcano', 'witch', 18, 19, 0.95, 1.52, 52, true, {
      colors: { body: '#6f4d4a', shade: '#4c3333', light: '#98716b', accent: '#ffb35c', eye: '#ffe066' },
      features: ['hat'], projectileColor: '#ff9e5c', xpMult: 1.35, material: 'cendre_vive', materialChance: 0.45
    })
  };

  /* ------------------------------------------------------------
     Boss — 2 mini-boss + 1 grand boss par zone, + boss final
     ------------------------------------------------------------ */
  function boss(id, name, biome, kind, level, opts) {
    return Object.assign({
      id, name, biome, kind, level,
      hpBase: kind === 'mini' ? 160 : kind === 'big' ? 420 : 1000,
      hpPerLevel: kind === 'mini' ? 27 : kind === 'big' ? 82 : 128,
      dmgMult: kind === 'mini' ? 1 : kind === 'big' ? 1.28 : 1.45,
      speed: kind === 'mini' ? 50 : 42, patterns: ['slam'], shape: 'brute',
      colors: C.boar, scale: kind === 'mini' ? 1.6 : kind === 'big' ? 2.5 : 3.2,
      title: kind === 'mini' ? 'MINI-BOSS' : kind === 'big' ? 'GARDIEN' : 'SOUVERAIN',
      xp: kind === 'mini' ? 150 : kind === 'big' ? 650 : 3200,
      gold: kind === 'mini' ? 90 : kind === 'big' ? 320 : 2000,
      loot: null, bestiary: null
    }, opts || {});
  }

  D.BOSSES = {
    /* Plaines */
    grumf: boss('grumf', 'Grumf', 'plains', 'mini', 5, {
      title: 'le Sanglier Couronné', shape: 'boar', colors: C.boar, features: ['crown', 'tusks'],
      patterns: ['charge', 'slam'], hpBase: 190, hpPerLevel: 30, speed: 62, loot: 'trefle_aurore'
    }),
    sylvette: boss('sylvette', 'Sylvette', 'plains', 'mini', 6, {
      title: 'la Fée Mutine', shape: 'wisp', colors: C.fairy, features: ['crown', 'wings'],
      patterns: ['volley', 'teleport'], hpBase: 150, hpPerLevel: 26, speed: 75, loot: 'arc_chasse'
    }),
    titanos: boss('titanos', 'Titanos', 'plains', 'big', 8, {
      title: 'le Bison Ancestral', shape: 'bison', colors: { body: '#8b6b4f', shade: '#634a37', light: '#b8966e', accent: '#d8c37b', eye: '#ffd45c' },
      features: ['runes', 'horns'], patterns: ['charge', 'slam', 'volley'], speed: 58, loot: 'epee_titanos',
      song: 'Un grondement fait vibrer les collines.'
    }),
    /* Forêt */
    arachnis: boss('arachnis', 'Arachnis', 'forest', 'mini', 8, {
      title: 'Mère des Toiles', shape: 'spider', colors: C.spider, features: ['crown', 'web'],
      patterns: ['volley', 'charge'], hpBase: 210, hpPerLevel: 31, speed: 62, loot: 'arc_sylve'
    }),
    champignor: boss('champignor', 'Champignor', 'forest', 'mini', 9, {
      title: 'le Vieux Chapeau', shape: 'mushroom', colors: { body: '#d9caa0', shade: '#a8946e', light: '#f2e8cc', accent: '#8f3a3a', eye: '#f4db6a' },
      features: ['crown', 'spots'], patterns: ['slam', 'volley'], hpBase: 240, hpPerLevel: 32, speed: 38, loot: 'amulette_seve'
    }),
    sylvath: boss('sylvath', 'Sylvath', 'forest', 'big', 11, {
      title: 'le Cœur de la Forêt', shape: 'treant', colors: { body: '#6f5137', shade: '#493322', light: '#9a7249', accent: '#6fa349', eye: '#d8ff8a' },
      features: ['antlers', 'glow'], patterns: ['slam', 'summon', 'volley'], hpBase: 560, hpPerLevel: 90, speed: 36, loot: 'lame_sylvath'
    }),
    /* Désert */
    dunak: boss('dunak', 'Dunak', 'desert', 'mini', 11, {
      title: "le Scorpion d'Or", shape: 'scorpion', colors: C.gold, features: ['crown', 'stinger'],
      patterns: ['charge', 'volley'], hpBase: 250, hpPerLevel: 34, speed: 74, loot: 'scarabee_or'
    }),
    kharos: boss('kharos', 'Kharos', 'desert', 'mini', 12, {
      title: 'le Pharaon Errant', shape: 'mummy', colors: C.mummy, features: ['nemes', 'crown'],
      patterns: ['teleport', 'volley'], hpBase: 260, hpPerLevel: 36, speed: 44, loot: 'cimeterre_dunes'
    }),
    sethrak: boss('sethrak', 'Sethrak', 'desert', 'big', 14, {
      title: 'le Ver des Sables', shape: 'sandworm', colors: { body: '#b98c5d', shade: '#82603e', light: '#dfbb88', accent: '#6f4b30', eye: '#ffd657' },
      features: ['maw'], patterns: ['teleport', 'slam', 'volley'], hpBase: 640, hpPerLevel: 94, speed: 50, loot: 'faux_sethrak'
    }),
    /* Marais */
    gribbou: boss('gribbou', 'Gribbou', 'swamp', 'mini', 14, {
      title: 'Roi des Grenouilles', shape: 'frog', colors: C.frog, features: ['crown'],
      patterns: ['slam', 'charge'], hpBase: 300, hpPerLevel: 38, speed: 62, loot: 'trident_roseaux'
    }),
    lugubre: boss('lugubre', 'Lugubre', 'swamp', 'mini', 15, {
      title: 'le Spectre des Roseaux', shape: 'ghost', colors: C.ghost, features: ['lantern'],
      patterns: ['teleport', 'volley'], hpBase: 270, hpPerLevel: 38, speed: 60, loot: 'baton_morn'
    }),
    morn: boss('morn', 'Morn', 'swamp', 'big', 17, {
      title: 'la Mère des Roseaux', shape: 'hydra', colors: { body: '#5d7a4e', shade: '#3c5639', light: '#87a36d', accent: '#d9cf7a', eye: '#ffd966' },
      features: ['crown'], patterns: ['volley', 'summon', 'slam'], hpBase: 700, hpPerLevel: 98, speed: 44, loot: 'oeil_marais'
    }),
    /* Toundra */
    givrok: boss('givrok', 'Givrok', 'tundra', 'mini', 17, {
      title: 'le Yéti des Cimes', shape: 'yeti', colors: C.yeti, features: ['crown'],
      patterns: ['slam', 'charge'], hpBase: 330, hpPerLevel: 40, speed: 58, loot: 'boussole_neige'
    }),
    hela: boss('hela', 'Héla', 'tundra', 'mini', 18, {
      title: 'la Reine de Givre', shape: 'witch', colors: C.ice, features: ['crown', 'hat'],
      patterns: ['teleport', 'volley', 'slam'], hpBase: 290, hpPerLevel: 40, speed: 58, loot: 'arc_cristal'
    }),
    frostgar: boss('frostgar', 'Frostgar', 'tundra', 'big', 20, {
      title: 'le Colosse de Glace', shape: 'icegolem', colors: { body: '#9fc9dc', shade: '#6e9ab1', light: '#ddf6ff', accent: '#4d7795', eye: '#bdf4ff' },
      features: ['crystals'], patterns: ['slam', 'volley', 'summon'], hpBase: 780, hpPerLevel: 104, speed: 40, loot: 'lance_frostgar'
    }),
    /* Volcan */
    pyrolis: boss('pyrolis', 'Pyrolis', 'volcano', 'mini', 20, {
      title: 'la Salamandre Alpha', shape: 'salamander', colors: C.sala, features: ['crown', 'flame'],
      patterns: ['charge', 'volley'], hpBase: 360, hpPerLevel: 42, speed: 70, loot: 'epee_magma'
    }),
    ignis: boss('ignis', 'Ignis', 'volcano', 'mini', 21, {
      title: 'le Démon des Cendres', shape: 'imp', colors: C.imp, features: ['horns', 'crown'],
      patterns: ['teleport', 'volley', 'summon'], hpBase: 340, hpPerLevel: 42, speed: 68, loot: 'coeur_braise'
    }),
    vulkaros: boss('vulkaros', 'Vulkaros', 'volcano', 'big', 23, {
      title: 'le Dragon de Magma', shape: 'dragon', colors: { body: '#9e3d2c', shade: '#6c241f', light: '#d4613b', accent: '#ffb34d', eye: '#ffe36b' },
      features: ['wings'], patterns: ['volley', 'charge', 'slam'], hpBase: 900, hpPerLevel: 112, speed: 54, loot: 'grande_epee_vulkaros'
    }),
    /* Final */
    nyx: boss('nyx', 'Nyx', 'plains', 'final', 26, {
      title: "le Souverain de l'Ombre", shape: 'nyx', colors: C.shadow, features: ['crown', 'cloak'],
      patterns: ['teleport', 'volley', 'slam', 'summon'], speed: 62, loot: 'couronne_aurore',
      song: "Le silence tombe. L'aube retient son souffle."
    })
  };

  D.ZONE_BOSSES = {};
  D.ZONES.forEach(z => { D.ZONE_BOSSES[z.id] = z.arenas.map(a => a.boss); });
  D.ALL_BOSSES = Object.keys(D.BOSSES);
  D.BIG_BOSSES = Object.values(D.BOSSES).filter(b => b.kind === 'big').map(b => b.id);

  /* ------------------------------------------------------------
     Équipement
     ------------------------------------------------------------ */
  D.RARITIES = {
    common: { name: 'Commun', color: '#c5ced8' },
    uncommon: { name: 'Inhabituel', color: '#70d48a' },
    rare: { name: 'Rare', color: '#66b8ff' },
    epic: { name: 'Épique', color: '#c891ff' },
    legendary: { name: 'Légendaire', color: '#ffd05c' }
  };

  function gear(id, name, slot, biome, tier, req, rarity, stats, desc, icon) {
    return Object.assign({ id, name, slot, biome, tier, req, rarity, desc, icon: icon || slot }, stats);
  }

  D.GEAR = [
    /* Départ */
    gear('epee_entrainement', "Épée d'Entraînement", 'weapon', 'plains', 0, 1, 'common', { style: 'slash', dmg: 5 }, "Une lame simple mais fidèle, offerte à chaque nouvel aventurier."),
    gear('marteau_bois', 'Marteau de Bois', 'weapon', 'plains', 0, 1, 'common', { style: 'heavy', dmg: 7 }, "Lourd, franc, efficace. Idéal pour se faire entendre."),
    gear('dagues_jumelles', 'Dagues Jumelles', 'weapon', 'plains', 0, 1, 'common', { style: 'stab', dmg: 3 }, "Deux éclats d'acier vifs comme des vipères."),
    gear('tunique_aurore', "Tunique d'Aurore", 'armor', 'plains', 0, 1, 'common', { def: 1, hp: 8 }, "Le bleu du village, cousu de fils d'or."),
    gear('bracelet_corde', 'Bracelet de Corde', 'trinket', 'plains', 0, 1, 'common', { crit: 0.01, hp: 5 }, "Un porte-bonheur modeste, mais qui a vu du pays."),

    /* Plaines */
    gear('fourche_ferme', 'Fourche du Fermier', 'weapon', 'plains', 0, 1, 'uncommon', { style: 'thrust', dmg: 6 }, "Les récoltes d'Aurore ne se défendent pas seules."),
    gear('arc_chasse', 'Arc de Chasse', 'weapon', 'plains', 0, 1, 'uncommon', { style: 'bow', dmg: 5 }, "Taillé dans un if des plaines. Silencieux et précis."),
    gear('manteau_voyageur', 'Manteau du Voyageur', 'armor', 'plains', 0, 2, 'uncommon', { def: 2, hp: 14 }, "De la poussière plein les coutures, et mille histoires."),
    gear('trefle_aurore', "Trèfle d'Aurore", 'trinket', 'plains', 0, 2, 'rare', { crit: 0.03, spd: 3, hp: 6 }, "Un trèfle à quatre feuilles qui ne fane jamais."),
    gear('epee_titanos', 'Épée de Titanos', 'weapon', 'plains', 0, 6, 'legendary', { style: 'slash', dmg: 12, crit: 0.03 }, "Forgée dans une corne de bison ancestral. La terre tremble sous chaque taille."),

    /* Forêt */
    gear('hache_bucheron', 'Hache du Bûcheron', 'weapon', 'forest', 1, 5, 'uncommon', { style: 'heavy', dmg: 12 }, "Coupe le bois, fend les ronces, et parfois pire."),
    gear('arc_sylve', 'Arc de Sylve', 'weapon', 'forest', 1, 5, 'rare', { style: 'bow', dmg: 10, crit: 0.02 }, "Chaque flèche semble guidée par les feuilles."),
    gear('armure_ecorce', "Armure d'Écorce", 'armor', 'forest', 1, 5, 'rare', { def: 5, hp: 28 }, "Vivante, souple, et presque impossible à fendre."),
    gear('amulette_seve', 'Amulette de Sève', 'trinket', 'forest', 1, 5, 'rare', { hp: 18, crit: 0.02, spd: 2 }, "Une goutte d'ambre où dort la sève d'un arbre-roi."),
    gear('lame_sylvath', 'Lame de Sylvath', 'weapon', 'forest', 1, 9, 'legendary', { style: 'slash', dmg: 19, crit: 0.04, spd: 2 }, "Une éclat de cœur forestier, aiguisé par mille printemps."),

    /* Désert */
    gear('cimeterre_dunes', 'Cimeterre des Dunes', 'weapon', 'desert', 2, 9, 'uncommon', { style: 'slash', dmg: 18 }, "Sa courbe épouse le vent chaud du désert."),
    gear('arbalete_soleil', 'Arbalète du Soleil', 'weapon', 'desert', 2, 9, 'rare', { style: 'crossbow', dmg: 17 }, "Un trait de lumière pour fendre les mirages.", 'weapon'),
    gear('cotte_sable', 'Cotte de Sable', 'armor', 'desert', 2, 9, 'rare', { def: 8, hp: 42 }, "Les mailles retiennent le sable, et le sable retient les coups."),
    gear('scarabee_or', "Scarabée d'Or", 'trinket', 'desert', 2, 9, 'epic', { crit: 0.05, hp: 22, spd: 4 }, "Un talisman royal qui attire la chance et les regards."),
    gear('faux_sethrak', 'Faux de Sethrak', 'weapon', 'desert', 2, 13, 'legendary', { style: 'heavy', dmg: 29, crit: 0.03 }, "La faux d'un roi ver. Elle tranche le sable comme une lame d'ombre."),

    /* Marais */
    gear('trident_roseaux', 'Trident des Roseaux', 'weapon', 'swamp', 3, 13, 'uncommon', { style: 'thrust', dmg: 24, crit: 0.02 }, "Trois pointes, trois serments, aucun pardon."),
    gear('sarbacane', 'Sarbacane Venimeuse', 'weapon', 'swamp', 3, 13, 'rare', { style: 'blowgun', dmg: 21 }, "Un souffle suffit. Les grenouilles vous regardent avec respect."),
    gear('carapace_croco', 'Carapace de Croco', 'armor', 'swamp', 3, 13, 'rare', { def: 11, hp: 58 }, "Écailles de boue, durcies par cent marées noires."),
    gear('oeil_marais', 'Œil du Marais', 'trinket', 'swamp', 3, 13, 'epic', { crit: 0.06, hp: 30, spd: 3 }, "Il vous regarde quand vous ne le regardez pas."),
    gear('baton_morn', 'Bâton de Morn', 'weapon', 'swamp', 3, 17, 'legendary', { style: 'magic', dmg: 27, crit: 0.04, hp: 12 }, "La mère des roseaux y a noué ses derniers sorts."),

    /* Toundra */
    gear('hache_givre', 'Hache de Givre', 'weapon', 'tundra', 4, 17, 'rare', { style: 'heavy', dmg: 34, crit: 0.02 }, "La glace ne laisse aucune écharde. Seulement le silence."),
    gear('arc_cristal', 'Arc de Cristal', 'weapon', 'tundra', 4, 17, 'epic', { style: 'bow', dmg: 30, crit: 0.04 }, "Les cordes chantent quand la neige tombe."),
    gear('armure_fourrure', 'Armure de Fourrure', 'armor', 'tundra', 4, 17, 'epic', { def: 14, hp: 74 }, "Chaude même au cœur de la tempête. Un peu trop poilue."),
    gear('boussole_neige', 'Boussole des Neiges', 'trinket', 'tundra', 4, 17, 'epic', { crit: 0.06, hp: 36, spd: 5 }, "Son aiguille pointe toujours vers quelque chose de plus grand."),
    gear('lance_frostgar', 'Lance de Frostgar', 'weapon', 'tundra', 4, 21, 'legendary', { style: 'thrust', dmg: 45, crit: 0.05, spd: 2 }, "Un pilier de glace éternelle, affûté par le souffle du colosse."),

    /* Volcan */
    gear('epee_magma', 'Épée de Magma', 'weapon', 'volcano', 5, 21, 'rare', { style: 'slash', dmg: 42, crit: 0.03 }, "La roche fond encore le long de la garde."),
    gear('arbalete_braise', 'Arbalète de Braise', 'weapon', 'volcano', 5, 21, 'epic', { style: 'crossbow', dmg: 40, crit: 0.03 }, "Chaque carreau siffle comme une étincelle."),
    gear('armure_obsidienne', "Armure d'Obsidienne", 'armor', 'volcano', 5, 21, 'epic', { def: 17, hp: 92 }, "Noire comme la nuit, tranchante comme le verre."),
    gear('coeur_braise', 'Cœur de Braise', 'trinket', 'volcano', 5, 21, 'legendary', { crit: 0.08, hp: 45, spd: 4 }, "Une flamme qui bat comme un second cœur."),
    gear('grande_epee_vulkaros', 'Grande Épée de Vulkaros', 'weapon', 'volcano', 5, 25, 'legendary', { style: 'slash', dmg: 55, crit: 0.06, hp: 15 }, "Le dragon y a versé son dernier souffle. Elle pèse plus qu'un serment."),

    /* Casques, bottes et pièces d'équipement supplémentaires */
    gear('bandeau_cuir', 'Bandeau de Cuir', 'helm', 'plains', 0, 1, 'common', { def: 1, hp: 4 }, "Un simple bandeau, mais il tient les cheveux loin des yeux."),
    gear('bottes_entrainement', "Bottes d'Entraînement", 'boots', 'plains', 0, 1, 'common', { spd: 3, def: 1 }, "Usées par les allers-retours entre le village et les champs."),
    gear('casque_voyageur', 'Casque du Voyageur', 'helm', 'plains', 0, 2, 'uncommon', { def: 2, hp: 8 }, "Le cuir a connu la pluie, le sel et quelques mauvaises rencontres."),
    gear('bottes_cuir', 'Bottes de Cuir', 'boots', 'plains', 0, 2, 'uncommon', { spd: 4, def: 1, hp: 4 }, "Souples, solides, et faites pour les longues routes."),
    gear('lame_plaine', 'Lame des Plaines', 'weapon', 'plains', 0, 3, 'rare', { style: 'slash', dmg: 9, spd: 1 }, "Une lame droite comme l'horizon, équilibrée pour les grands espaces."),
    gear('plastron_aurore', "Plastron d'Aurore", 'armor', 'plains', 0, 3, 'rare', { def: 3, hp: 20 }, "Les premiers gardes du village y ont fait coudre leur serment."),

    gear('heaume_ecorce', "Heaume d'Écorce", 'helm', 'forest', 1, 5, 'rare', { def: 3, hp: 18 }, "L'écorce de Sylve se referme sur les blessures avant qu'elles ne saignent."),
    gear('bottes_sylve', 'Bottes de Sylve', 'boots', 'forest', 1, 5, 'rare', { spd: 6, def: 1, hp: 6 }, "Elles ne font aucun bruit sur les feuilles mortes."),
    gear('glaive_ronces', 'Glaive des Ronces', 'weapon', 'forest', 1, 6, 'epic', { style: 'slash', dmg: 16, crit: 0.02 }, "Les ronces s'enroulent autour de la garde et mordent avec elle."),
    gear('cuirasse_feuilles', 'Cuirasse de Feuilles', 'armor', 'forest', 1, 7, 'rare', { def: 7, hp: 36 }, "Mille feuilles tressées, plus dures que du vieux chêne."),

    gear('turban_nomade', 'Turban du Nomade', 'helm', 'desert', 2, 9, 'rare', { def: 5, hp: 24 }, "Le désert ne pardonne pas les fronts nus."),
    gear('bottes_dunes', 'Bottes des Dunes', 'boots', 'desert', 2, 9, 'rare', { spd: 8, def: 2 }, "Le sable glisse dessus sans jamais les alourdir."),
    gear('khopesh_soleil', 'Khopesh du Soleil', 'weapon', 'desert', 2, 10, 'epic', { style: 'slash', dmg: 25, crit: 0.03 }, "La courbe de la lame capte la lumière et la renvoie aux ombres."),
    gear('plastron_scarabee', 'Plastron de Scarabée', 'armor', 'desert', 2, 11, 'epic', { def: 10, hp: 52 }, "Des écailles dorées, aussi légères qu'elles sont dures."),

    gear('masque_roseaux', 'Masque des Roseaux', 'helm', 'swamp', 3, 13, 'epic', { def: 7, hp: 34 }, "Il filtrait la brume de Morn. Il filtre désormais les coups."),
    gear('bottes_vase', 'Bottes de Vase', 'boots', 'swamp', 3, 13, 'epic', { spd: 9, def: 2, hp: 10 }, "La boue s'en détache, comme si elle avait peur."),
    gear('hallebarde_morn', 'Hallebarde de Morn', 'weapon', 'swamp', 3, 14, 'epic', { style: 'thrust', dmg: 34, crit: 0.02 }, "Trois serments de fer, noués dans les roseaux noirs."),
    gear('cuirasse_morn', 'Cuirasse de Morn', 'armor', 'swamp', 3, 15, 'epic', { def: 13, hp: 66 }, "Les écailles du marais gardent encore l'odeur de la pluie."),

    gear('heaume_givre', 'Heaume de Givre', 'helm', 'tundra', 4, 17, 'epic', { def: 9, hp: 44 }, "La glace n'y fond jamais. Elle ne laisse pas non plus passer la douleur."),
    gear('bottes_neige', 'Bottes des Neiges', 'boots', 'tundra', 4, 17, 'epic', { spd: 10, def: 3 }, "On jure entendre la neige chanter quand on court."),
    gear('epee_blizzard', 'Épée du Blizzard', 'weapon', 'tundra', 4, 18, 'legendary', { style: 'slash', dmg: 41, crit: 0.05 }, "Chaque taille libère un souffle de tempête."),
    gear('armure_geant', 'Armure du Géant', 'armor', 'tundra', 4, 19, 'legendary', { def: 16, hp: 86 }, "Trop grande pour un humain. Assez grande pour un héros."),

    gear('couronne_braise', 'Couronne de Braise', 'helm', 'volcano', 5, 21, 'legendary', { def: 11, hp: 56 }, "Les rois de cendre la portaient avant que la montagne ne les avale."),
    gear('bottes_magma', 'Bottes de Magma', 'boots', 'volcano', 5, 21, 'legendary', { spd: 12, def: 4, hp: 14 }, "La roche fond sous vos pas. Vous, vous continuez d'avancer."),
    gear('masse_vulcan', 'Masse de Vulcan', 'weapon', 'volcano', 5, 22, 'legendary', { style: 'heavy', dmg: 52, crit: 0.04 }, "Un bloc de basalte au bout d'une chaîne de lave figée."),
    gear('cuirasse_basalte', 'Cuirasse de Basalte', 'armor', 'volcano', 5, 23, 'legendary', { def: 19, hp: 104 }, "La montagne elle-même a façonné cette carapace."),

    gear('lame_aube', "Lame de l'Aube", 'weapon', 'plains', 5, 25, 'legendary', { style: 'slash', dmg: 60, crit: 0.08, hp: 20 }, "Une lame de lumière pâle, forgée pour le dernier matin."),
    gear('egide_aurore', "Égide d'Aurore", 'armor', 'plains', 5, 25, 'legendary', { def: 22, hp: 130 }, "Le bouclier des six terres, fondu en une seule plaque."),
    gear('diademe_aurore', "Diadème d'Aurore", 'helm', 'plains', 5, 25, 'legendary', { def: 12, hp: 70, spd: 3 }, "Il ne pèse rien. Il rappelle simplement ce que vous avez sauvé."),
    gear('bottes_aube', "Bottes de l'Aube", 'boots', 'plains', 5, 25, 'legendary', { spd: 14, def: 5, hp: 20 }, "Chaque pas laisse derrière lui une petite lumière."),

    /* Récompense finale */
    gear('couronne_aurore', "Couronne d'Aurore", 'trinket', 'plains', 5, 25, 'legendary', { crit: 0.1, hp: 70, spd: 6, def: 4 }, "La lumière des six terres, posée sur votre front. Aurore se souviendra.")
  ];

  D.GEAR_BY_ID = Object.fromEntries(D.GEAR.map(g => [g.id, g]));
  D.GEAR_BY_ZONE = {};
  D.ZONES.forEach(z => { D.GEAR_BY_ZONE[z.id] = D.GEAR.filter(g => g.biome === z.id && g.rarity !== 'legendary'); });

  D.STARTING = {
    epeiste: { weapon: 'epee_entrainement', armor: 'tunique_aurore', trinket: 'bracelet_corde' },
    gardien: { weapon: 'marteau_bois', armor: 'tunique_aurore', trinket: 'bracelet_corde' },
    ombre: { weapon: 'dagues_jumelles', armor: 'tunique_aurore', trinket: 'bracelet_corde' }
  };
  D.STARTING_GEAR = ['epee_entrainement', 'marteau_bois', 'dagues_jumelles', 'tunique_aurore', 'bracelet_corde'];

  /* ------------------------------------------------------------
     Potions et magasin
     ------------------------------------------------------------ */
  D.POTIONS = {
    petite: { id: 'petite', name: 'Petite Potion', heal: 0.3, price: 18, color: '#e56767', desc: 'Rend 30 % des PV max.' },
    potion: { id: 'potion', name: 'Potion', heal: 0.55, price: 48, color: '#e34f7a', desc: 'Rend 55 % des PV max.' },
    elixir: { id: 'elixir', name: 'Élixir', heal: 1, price: 135, color: '#ffd15c', desc: 'Rend tous les PV.', unlock: 2 }
  };

  D.SHOP_ITEMS = ['petite', 'potion', 'elixir'];

  /* ------------------------------------------------------------
     Personnages secondaires
     ------------------------------------------------------------ */
  D.NPCS = [
    {
      id: 'aldric', name: 'Doyen Aldric', role: 'quest', x: 111, y: 119, look: { skin: 1, hair: 4, hairColor: 4, shirt: 4, pants: 3, robe: true },
      hint: "Le doyen d'Aurore"
    },
    {
      id: 'mira', name: 'Mira la Marchande', role: 'shop', x: 104, y: 128, look: { skin: 0, hair: 2, hairColor: 3, shirt: 2, pants: 4, apron: true },
      hint: 'Marchande de potions'
    },
    {
      id: 'bran', name: 'Bran le Forgeron', role: 'smith', x: 134, y: 127, look: { skin: 3, hair: 5, hairColor: 0, shirt: 4, pants: 0, apron: true },
      hint: 'Forgeron'
    },
    {
      id: 'timo', name: 'Timo', role: 'flavor', x: 121, y: 132, look: { skin: 1, hair: 3, hairColor: 2, shirt: 3, pants: 3 },
      hint: 'Un enfant du village'
    },
    {
      id: 'nora', name: 'Nora', role: 'flavor', x: 108, y: 134, look: { skin: 4, hair: 1, hairColor: 0, shirt: 1, pants: 2 },
      hint: 'Herboriste'
    },
    {
      id: 'garrick', name: 'Garrick', role: 'flavor', x: 120, y: 123, look: { skin: 2, hair: 0, hairColor: 1, shirt: 6, pants: 0, armor: true },
      hint: 'Garde du village'
    }
  ];

  D.VILLAGE_SIGNS = [
    { id: 'sign_village', x: 110, y: 125, text: ["AURORE", "Carrefour des Six Terres.", "Nord : ruines et toundra.", "Est : désert. Sud : marais.", "Ouest : forêt. Au centre : le sanctuaire."] }
  ];

  D.SHRINES = [
    { id: 'shrine_village', name: "Sanctuaire d'Aurore", x: 122, y: 130 },
    { id: 'shrine_plains', name: 'Bivouac des Plaines', x: 111, y: 148 },
    { id: 'shrine_forest', name: 'Bivouac de Sylve', x: 60, y: 100 },
    { id: 'shrine_desert', name: 'Bivouac des Dunes', x: 182, y: 136 },
    { id: 'shrine_swamp', name: 'Bivouac des Roseaux', x: 76, y: 160 },
    { id: 'shrine_tundra', name: 'Bivouac de Givre', x: 146, y: 82 },
    { id: 'shrine_volcano', name: 'Bivouac de Braise', x: 160, y: 170 }
  ];

  /* ------------------------------------------------------------
     Matériaux de monstre
     ------------------------------------------------------------ */
  D.MATERIALS = {
    plume_vent: { id: 'plume_vent', name: 'Plume des Vents', zone: 'plains', shape: 'feather', color: '#cfe8e2', shade: '#93bdb8', value: 8, desc: 'Une plume si légère qu’elle cherche à s’envoler.' },
    fibre_epouvantail: { id: 'fibre_epouvantail', name: 'Fibre d’Épouvantail', zone: 'plains', shape: 'fiber', color: '#c8a86d', shade: '#947442', value: 8, desc: 'De la paille tressée avec une intention étrange.' },
    fibre_ronce: { id: 'fibre_ronce', name: 'Fibre de Ronce', zone: 'forest', shape: 'fiber', color: '#88b653', shade: '#5d8236', value: 11, desc: 'Elle s’accroche aux doigts et refuse de lâcher.' },
    pollen_noir: { id: 'pollen_noir', name: 'Pollen Noir', zone: 'forest', shape: 'pollen', color: '#b58ad8', shade: '#7d5a9c', value: 12, desc: 'Une poussière lumineuse qui ne devrait pas exister.' },
    fer_noir: { id: 'fer_noir', name: 'Fer Noir', zone: 'desert', shape: 'metal', color: '#78808c', shade: '#4b525c', value: 15, desc: 'Un métal lourd, froid, et étonnamment pur.' },
    essence_mirage: { id: 'essence_mirage', name: 'Essence de Mirage', zone: 'desert', shape: 'essence', color: '#e6b9ff', shade: '#a37bbd', value: 16, desc: 'Elle ondule dans le flacon comme une horizon lointain.' },
    soie_toile: { id: 'soie_toile', name: 'Soie de Toile', zone: 'swamp', shape: 'silk', color: '#d9d2e8', shade: '#9b93ad', value: 18, desc: 'Solide comme du fil d’acier, douce comme un mensonge.' },
    lueur_morte: { id: 'lueur_morte', name: 'Lueur Morte', zone: 'swamp', shape: 'glow', color: '#c8ff9f', shade: '#76a862', value: 19, desc: 'Une lumière froide qui ne réchauffe personne.' },
    fourrure_givre: { id: 'fourrure_givre', name: 'Fourrure de Givre', zone: 'tundra', shape: 'fur', color: '#e2f4fa', shade: '#a6c2ce', value: 22, desc: 'Le froid y est resté prisonnier, intact.' },
    cristal_givre: { id: 'cristal_givre', name: 'Cristal de Givre', zone: 'tundra', shape: 'crystal', color: '#a7eeff', shade: '#5f9cb8', value: 24, desc: 'Il ne fond pas. Il ne casse pas. Il écoute.' },
    aile_cendre: { id: 'aile_cendre', name: 'Aile de Cendre', zone: 'volcano', shape: 'wing', color: '#a65c62', shade: '#6f353e', value: 26, desc: 'La chaleur l’a noircie sans la consumer.' },
    cendre_vive: { id: 'cendre_vive', name: 'Cendre Vive', zone: 'volcano', shape: 'ash', color: '#ffb35c', shade: '#b46c2e', value: 28, desc: 'Une braise qui bat encore, quelque part au fond.' },
    eclat_sceau: { id: 'eclat_sceau', name: 'Éclat de Sceau', zone: 'plains', shape: 'shard', color: '#ffe08a', shade: '#bd8e36', value: 120, desc: 'Un fragment des six sceaux. Il bourdonne de lumière ancienne.' }
  };
  D.MATERIAL_LIST = Object.keys(D.MATERIALS).map(id => D.MATERIALS[id]);
  D.MATERIAL_TOTAL = D.MATERIAL_LIST.length;

  /* ------------------------------------------------------------
     Avant-postes : petits camps sûrs, disséminés sur la carte.
     Tous les coffres du jeu s'y trouvent. Aucun monstre hostile,
     aucun coffre et aucun boss à l'intérieur.
     ------------------------------------------------------------ */
  D.OUTPOSTS = [
    { id: 'camp_bles', name: 'Camp des Blés', biome: 'plains', x: 152, y: 142, chest: 'chest_plains_1', loot: 'bottes_cuir', vendor: 'helia' },
    { id: 'camp_riviere', name: 'Poste de la Rivière', biome: 'plains', x: 96, y: 162, chest: 'chest_plains_2', loot: 'casque_voyageur', vendor: 'kael' },
    { id: 'camp_ronces', name: 'Halte des Ronces', biome: 'forest', x: 60, y: 34, chest: 'chest_forest_1', loot: 'heaume_ecorce', vendor: 'nox' },
    { id: 'camp_branches', name: 'Camp des Branches', biome: 'forest', x: 84, y: 52, chest: 'chest_forest_2', loot: 'bottes_sylve', vendor: 'rurk' },
    { id: 'camp_caravane', name: 'Caravane de Rubis', biome: 'desert', x: 182, y: 86, chest: 'chest_desert_1', loot: 'turban_nomade', vendor: 'sahra' },
    { id: 'camp_mirage', name: 'Poste du Mirage', biome: 'desert', x: 232, y: 162, chest: 'chest_desert_2', loot: 'bottes_dunes', vendor: null },
    { id: 'camp_roseaux', name: 'Camp des Roseaux', biome: 'swamp', x: 88, y: 186, chest: 'chest_swamp_1', loot: 'masque_roseaux', vendor: 'ysolde' },
    { id: 'camp_vase', name: 'Poste de la Vase', biome: 'swamp', x: 22, y: 154, chest: 'chest_swamp_2', loot: 'bottes_vase', vendor: null },
    { id: 'camp_cimes', name: 'Refuge des Cimes', biome: 'tundra', x: 112, y: 36, chest: 'chest_tundra_1', loot: 'heaume_givre', vendor: 'freya' },
    { id: 'camp_neige', name: 'Poste des Neiges', biome: 'tundra', x: 190, y: 46, chest: 'chest_tundra_2', loot: 'bottes_neige', vendor: null },
    { id: 'camp_cendre', name: 'Camp de Cendre', biome: 'volcano', x: 144, y: 166, chest: 'chest_volcano_1', loot: 'couronne_braise', vendor: 'ignar' },
    { id: 'camp_magma', name: 'Poste du Magma', biome: 'volcano', x: 216, y: 204, chest: 'chest_volcano_2', loot: 'bottes_magma', vendor: null }
  ];
  D.OUTPOST_BY_ID = Object.fromEntries(D.OUTPOSTS.map(o => [o.id, o]));

  D.CHESTS = D.OUTPOSTS.map(o => ({
    id: o.chest, biome: o.biome, x: o.x, y: o.y, loot: o.loot, outpost: o.id
  }));

  /* ------------------------------------------------------------
     Vendeurs : un par village et plusieurs dans les avant-postes
     ------------------------------------------------------------ */
  D.VENDORS = {
    mira: {
      id: 'mira', name: 'Mira la Marchande', title: 'MARCHANDE', role: 'shop',
      quote: '« De l’eau claire, des potions fraîches, et quelques trouvailles. Le désert est loin, mon ami. »',
      look: { skin: 0, hair: 2, hairColor: 3, shirt: 2, pants: 4, apron: true },
      potions: ['petite', 'potion', 'elixir'], markup: 1,
      gear: { biomes: ['plains', 'forest', 'desert', 'swamp', 'tundra', 'volcano'], slots: ['weapon', 'armor', 'trinket', 'helm', 'boots'], count: 6, fixed: ['bandeau_cuir', 'bottes_entrainement'] }
    },
    helia: {
      id: 'helia', name: 'Hélia l’Herboriste', title: 'HERBORISTE', role: 'shop',
      quote: '« Les plantes des plaines soignent presque tout. Presque. Pour le reste, il y a l’acier. »',
      look: { skin: 5, hair: 1, hairColor: 6, shirt: 10, pants: 2, apron: true },
      potions: ['petite', 'potion'], markup: 1.05,
      gear: { biomes: ['plains', 'forest'], slots: ['trinket', 'helm', 'boots'], count: 5, fixed: ['bandeau_cuir', 'bottes_cuir'] }
    },
    kael: {
      id: 'kael', name: 'Kael l’Éclaireur', title: 'ÉCLAIREUR', role: 'shop',
      quote: '« Une bonne paire de bottes vaut mieux qu’une épée. Surtout quand on doit courir. »',
      look: { skin: 2, hair: 3, hairColor: 1, shirt: 9, pants: 0, cape: true },
      potions: ['petite', 'potion'], markup: 1.08,
      gear: { biomes: ['plains', 'forest'], slots: ['boots', 'helm', 'weapon'], count: 6, fixed: ['casque_voyageur', 'lame_plaine'] }
    },
    nox: {
      id: 'nox', name: 'Nox le Colporteur', title: 'COLPORTEUR', role: 'shop',
      quote: '« Chut. Certaines de ces pièces n’ont jamais vu la lumière du jour. Elles s’en portent très bien. »',
      look: { skin: 3, hair: 4, hairColor: 0, shirt: 4, pants: 8, cape: true, accessory: 0 },
      potions: ['potion'], markup: 1.22,
      gear: { biomes: ['forest', 'desert'], slots: ['trinket', 'weapon', 'helm'], rarities: ['rare', 'epic'], count: 6, fixed: ['glaive_ronces'] }
    },
    rurk: {
      id: 'rurk', name: 'Rurk le Mercenaire', title: 'MERCENAIRE', role: 'shop',
      quote: '« J’ai troqué mon dernier contrat contre un stock d’armures. Mauvaise affaire. Excellente pour vous. »',
      look: { skin: 4, hair: 5, hairColor: 4, shirt: 6, pants: 4, armor: true },
      potions: ['petite', 'potion', 'elixir'], markup: 1.12,
      gear: { biomes: ['forest', 'desert', 'swamp'], slots: ['weapon', 'armor'], count: 6, fixed: ['cuirasse_feuilles', 'hache_bucheron'] }
    },
    sahra: {
      id: 'sahra', name: 'Sahra la Caravanière', title: 'CARAVANIÈRE', role: 'shop',
      quote: '« Le désert prend tout. Moi, je rends la monnaie. »',
      look: { skin: 6, hair: 9, hairColor: 0, shirt: 8, pants: 6, accessory: 0 },
      potions: ['petite', 'potion', 'elixir'], markup: 1.14,
      gear: { biomes: ['desert'], slots: ['weapon', 'armor', 'helm', 'boots', 'trinket'], count: 6, fixed: ['turban_nomade', 'bottes_dunes', 'khopesh_soleil'] }
    },
    ysolde: {
      id: 'ysolde', name: 'Ysolde des Roseaux', title: 'HERBORISTE DU MARAIS', role: 'shop',
      quote: '« Ne suivez pas les lumières. Suivez-moi : mes prix sont moins trompeurs. »',
      look: { skin: 1, hair: 6, hairColor: 6, shirt: 1, pants: 2, accessory: 5 },
      potions: ['potion', 'elixir'], markup: 1.16,
      gear: { biomes: ['swamp', 'forest'], slots: ['trinket', 'helm', 'boots', 'weapon'], count: 6, fixed: ['masque_roseaux', 'bottes_vase', 'hallebarde_morn'] }
    },
    freya: {
      id: 'freya', name: 'Freya des Cimes', title: 'GARDE DES NEIGES', role: 'shop',
      quote: '« Ici, le froid juge les voyageurs. Mes armures leur donnent une seconde chance. »',
      look: { skin: 0, hair: 9, hairColor: 4, shirt: 5, pants: 3, armor: true, cape: true },
      potions: ['potion', 'elixir'], markup: 1.18,
      gear: { biomes: ['tundra'], slots: ['weapon', 'armor', 'helm', 'boots'], count: 6, fixed: ['heaume_givre', 'bottes_neige', 'armure_geant'] }
    },
    ignar: {
      id: 'ignar', name: 'Ignar le Fondu', title: 'FORGERON DE LAVE', role: 'shop',
      quote: '« La montagne m’a pris un bras. Je lui ai pris son meilleur acier. »',
      look: { skin: 7, hair: 0, hairColor: 15, shirt: 2, pants: 5, apron: true },
      potions: ['potion', 'elixir'], markup: 1.24,
      gear: { biomes: ['volcano'], slots: ['weapon', 'armor', 'helm', 'boots', 'trinket'], count: 6, fixed: ['couronne_braise', 'bottes_magma', 'masse_vulcan'] }
    }
  };
  D.VENDOR_BY_ID = D.VENDORS;
  D.VILLAGE_VENDOR = 'mira';

  D.ZONE_SIGNS = [
    { id: 'sign_forest', x: 87, y: 113, text: ['FORÊT DE SYLVE', 'Niveau conseillé : 4 à 7', 'Les arbres ne dorment jamais.'] },
    { id: 'sign_desert', x: 151, y: 128, text: ['DÉSERT DE RUBIS', 'Niveau conseillé : 7 à 10', 'Emportez de l’eau. Et des potions.'] },
    { id: 'sign_swamp', x: 94, y: 143, text: ['MARAIS DE MORN', 'Niveau conseillé : 10 à 13', 'Ne suivez pas les lumières.'] },
    { id: 'sign_tundra', x: 133, y: 103, text: ['TOUNDRA DE GIVRE', 'Niveau conseillé : 13 à 16', 'Le froid se moque des braves.'] },
    { id: 'sign_volcano', x: 139, y: 148, text: ['VOLCAN DE BRAISE', 'Niveau conseillé : 16 à 19', 'La montagne respire encore.'] }
  ];

  /* ------------------------------------------------------------
     Quêtes : une campagne principale et de nombreuses quêtes annexes
     ------------------------------------------------------------ */
  D.QUESTS = [
    {
      id: 'main_eveil', type: 'main', title: "L'Éveil d'Aurore", giver: 'aldric', zone: 'plains',
      autoStart: 'new', desc: "Le doyen Aldric vous confie la première veille de votre vie. Les plaines s'agitent, et les anciens sceaux tremblent.",
      objectives: [
        { type: 'talk', target: 'aldric', count: 1, label: 'Écouter le doyen Aldric' },
        { type: 'kill', zone: 'plains', count: 6, label: 'Vaincre 6 créatures des Plaines' },
        { type: 'chest', count: 1, label: 'Ouvrir un coffre dans un avant-poste' }
      ],
      rewards: { xp: 150, gold: 90, gear: 'bottes_cuir' },
      outro: ["L'aube se lève sur les Plaines, et vous voilà déjà plus grand.", "Titanos, le Bison Ancestral, garde le premier sceau au sud du village."]
    },
    {
      id: 'main_plaines', type: 'main', title: 'Le Sceau des Plaines', giver: 'aldric', zone: 'plains',
      autoStart: 'chain', prereq: ['main_eveil'], desc: 'Titanos fait trembler les collines. Brisez le premier sceau.',
      objectives: [{ type: 'boss', target: 'titanos', count: 1, label: 'Vaincre Titanos, Gardien des Plaines' }],
      rewards: { xp: 300, gold: 180, gear: 'casque_voyageur' },
      outro: ['Le premier sceau se brise en un éclat de lumière.', 'La Forêt de Sylve appelle à son tour. Ses racines saignent.']
    },
    {
      id: 'main_foret', type: 'main', title: 'Les Racines Malades', giver: 'aldric', zone: 'forest',
      autoStart: 'chain', prereq: ['main_plaines'], desc: 'Sylvath, le Cœur de la Forêt, étouffe sous une ombre ancienne.',
      objectives: [{ type: 'boss', target: 'sylvath', count: 1, label: 'Vaincre Sylvath, Gardien de la Forêt' }],
      rewards: { xp: 500, gold: 280, gear: 'heaume_ecorce' },
      outro: ['La forêt respire de nouveau. Les branches s’inclinent sur votre passage.', 'Le désert attend. Sethrak y creuse des tombes qui ne sont pas les siennes.']
    },
    {
      id: 'main_desert', type: 'main', title: 'Le Soleil des Dunes', giver: 'aldric', zone: 'desert',
      autoStart: 'chain', prereq: ['main_foret'], desc: 'Sethrak, le Ver des Sables, dévore les routes et les caravanes.',
      objectives: [{ type: 'boss', target: 'sethrak', count: 1, label: 'Vaincre Sethrak, Gardien du Désert' }],
      rewards: { xp: 760, gold: 440, gear: 'bottes_dunes' },
      outro: ['Le sable retombe. Les caravanes pourront passer.', 'Au sud, le Marais de Morn pleure une eau noire qui n’a rien d’humain.']
    },
    {
      id: 'main_marais', type: 'main', title: 'Les Roseaux Pleurent', giver: 'aldric', zone: 'swamp',
      autoStart: 'chain', prereq: ['main_desert'], desc: 'Morn, la Mère des Roseaux, tisse un sortilège qui noie les vivants.',
      objectives: [{ type: 'boss', target: 'morn', count: 1, label: 'Vaincre Morn, Gardienne du Marais' }],
      rewards: { xp: 1050, gold: 620, gear: 'masque_roseaux' },
      outro: ['Les eaux se calment. Les feux follets s’éteignent un à un.', 'La Toundra de Givre garde le quatrième sceau. Frostgar ne dort jamais.']
    },
    {
      id: 'main_toundra', type: 'main', title: 'Le Souffle de Givre', giver: 'aldric', zone: 'tundra',
      autoStart: 'chain', prereq: ['main_marais'], desc: 'Frostgar, le Colosse de Glace, fige les cœurs autant que les rivières.',
      objectives: [{ type: 'boss', target: 'frostgar', count: 1, label: 'Vaincre Frostgar, Gardien de la Toundra' }],
      rewards: { xp: 1400, gold: 820, gear: 'heaume_givre' },
      outro: ['La glace se fend avec un chant clair. Le froid recule.', 'Le Volcan de Braise gronde. Vulkaros, le Dragon de Magma, a senti votre venue.']
    },
    {
      id: 'main_volcan', type: 'main', title: 'La Montagne en Colère', giver: 'aldric', zone: 'volcano',
      autoStart: 'chain', prereq: ['main_toundra'], desc: 'Vulkaros fait fondre les sceaux sous son souffle. Le mont se meurt.',
      objectives: [{ type: 'boss', target: 'vulkaros', count: 1, label: 'Vaincre Vulkaros, Gardien du Volcan' }],
      rewards: { xp: 1900, gold: 1150, gear: 'couronne_braise' },
      outro: ['La montagne se tait pour la première fois depuis mille lunes.', 'Les six sceaux sont rompus. Le monolithe de Nyx attend au nord.']
    },
    {
      id: 'main_nyx', type: 'main', title: "L'Aube Revenue", giver: 'aldric', zone: 'plains',
      autoStart: 'chain', prereq: ['main_volcan'], desc: "Nyx, le Souverain de l'Ombre, veut éteindre la dernière lumière. Il ne reste que vous.",
      objectives: [{ type: 'boss', target: 'nyx', count: 1, label: 'Vaincre Nyx au monolithe' }],
      rewards: { xp: 5000, gold: 4000, gear: 'lame_aube' },
      outro: ["L'ombre se dissout. Le ciel d'Aurore se teinte de rose et d'or.", 'Votre nom sera gravé dans le premier matin du monde.']
    },

    {
      id: 'side_chasse', type: 'side', title: 'La Première Chasse', giver: 'garrick', zone: 'plains', autoStart: 'zone',
      desc: 'Garrick veut voir ce que valent les nouvelles recrues. Les champs sont pleins de bêtes nerveuses.',
      objectives: [{ type: 'kill', zone: 'plains', count: 12, label: 'Vaincre 12 créatures des Plaines' }],
      rewards: { xp: 120, gold: 80, potions: { potion: 2 } },
      outro: ['« Pas mal. Tu tiens encore debout, c’est déjà ça. » — Garrick']
    },
    {
      id: 'side_moisson', type: 'side', title: 'La Moisson Étrange', giver: 'nora', zone: 'plains', autoStart: 'zone',
      desc: 'Nora prépare une décoction contre les cauchemars. Il lui faut de quoi les affronter.',
      objectives: [
        { type: 'material', target: 'fibre_epouvantail', count: 4, label: 'Rapporter 4 fibres d’Épouvantail' },
        { type: 'material', target: 'plume_vent', count: 3, label: 'Rapporter 3 plumes des Vents' }
      ],
      rewards: { xp: 110, gold: 70, gear: 'bandeau_cuir' },
      outro: ['Nora renifle la décoction, grimace, puis sourit. « Parfait. Ça sent le réveil. »']
    },
    {
      id: 'side_cache', type: 'side', title: 'Les Caches d’Aurore', giver: 'mira', zone: 'plains', autoStart: 'new',
      desc: 'Mira jure que les avant-postes cachent des réserves laissées par les anciens gardes.',
      objectives: [{ type: 'chest', count: 4, label: "Ouvrir 4 coffres d'avant-poste" }],
      rewards: { xp: 180, gold: 140, gear: 'bottes_cuir' },
      outro: ['« Quatre coffres ! Tu es meilleur que mon ancien associé. Lui, il est mort. » — Mira']
    },
    {
      id: 'side_forge', type: 'side', title: 'L’Acier Se Souvient', giver: 'bran', zone: 'plains', autoStart: 'talk',
      desc: 'Bran affirme qu’une arme améliorée se souvient de chaque coup porté. Il veut le prouver.',
      objectives: [{ type: 'upgrade', count: 3, label: 'Améliorer 3 fois votre équipement à la forge' }],
      rewards: { xp: 160, gold: 110, potions: { elixir: 1 } },
      outro: ['Bran passe un pouce sur la lame. « Elle a meilleure mémoire que toi, maintenant. »']
    },
    {
      id: 'side_ronces', type: 'side', title: 'Les Ronces Mordent', giver: 'nox', zone: 'forest', autoStart: 'zone',
      desc: 'Nox paie bien pour les fibres de ronces. Trop bien, peut-être.',
      objectives: [
        { type: 'kill', zone: 'forest', count: 8, label: 'Vaincre 8 créatures de la Forêt' },
        { type: 'material', target: 'fibre_ronce', count: 4, label: 'Rapporter 4 fibres de Ronce' }
      ],
      rewards: { xp: 220, gold: 140, gear: 'bottes_sylve' },
      outro: ['« Ces fibres valent de l’or. Ne demande pas pourquoi. » — Nox']
    },
    {
      id: 'side_dunes', type: 'side', title: 'La Route des Caravanes', giver: 'sahra', zone: 'desert', autoStart: 'zone',
      desc: 'Sahra veut sécuriser la vieille route du sel. Les scarabées de fer y font leur nid.',
      objectives: [
        { type: 'kill', zone: 'desert', count: 8, label: 'Vaincre 8 créatures du Désert' },
        { type: 'material', target: 'fer_noir', count: 4, label: 'Rapporter 4 morceaux de Fer Noir' }
      ],
      rewards: { xp: 330, gold: 210, gear: 'bottes_dunes' },
      outro: ['Sahra pèse le fer dans sa main. « La route est ouverte. Reviens quand tu veux. »']
    },
    {
      id: 'side_marais', type: 'side', title: 'Les Feux qui Mentent', giver: 'ysolde', zone: 'swamp', autoStart: 'zone',
      desc: 'Ysolde collectionne les lueurs mortes pour éclairer sa cabane. Elles ne brûlent pas.',
      objectives: [
        { type: 'kill', zone: 'swamp', count: 8, label: 'Vaincre 8 créatures du Marais' },
        { type: 'material', target: 'lueur_morte', count: 4, label: 'Rapporter 4 lueurs mortes' }
      ],
      rewards: { xp: 460, gold: 290, gear: 'bottes_vase' },
      outro: ['Les lueurs flottent autour d’Ysolde comme des lucioles apprivoisées. « Elles ne mentent plus. »']
    },
    {
      id: 'side_givre', type: 'side', title: 'La Fourrure du Silence', giver: 'freya', zone: 'tundra', autoStart: 'zone',
      desc: 'Freya coud des manteaux pour les veilleurs de la cime. Il lui faut de la fourrure de givre.',
      objectives: [
        { type: 'kill', zone: 'tundra', count: 8, label: 'Vaincre 8 créatures de la Toundra' },
        { type: 'material', target: 'fourrure_givre', count: 4, label: 'Rapporter 4 fourrures de Givre' }
      ],
      rewards: { xp: 600, gold: 380, gear: 'bottes_neige' },
      outro: ['Freya hoche la tête. « La cime sera chaude, cette nuit. »']
    },
    {
      id: 'side_braise', type: 'side', title: 'La Dernière Braise', giver: 'ignar', zone: 'volcano', autoStart: 'zone',
      desc: 'Ignar veut une cendre encore vivante pour rallumer la forge de son père.',
      objectives: [
        { type: 'kill', zone: 'volcano', count: 8, label: 'Vaincre 8 créatures du Volcan' },
        { type: 'material', target: 'cendre_vive', count: 4, label: 'Rapporter 4 cendres vives' }
      ],
      rewards: { xp: 760, gold: 480, gear: 'bottes_magma' },
      outro: ['La forge s’allume. Ignar rit, et la lueur danse dans sa barbe de suie.']
    },
    {
      id: 'side_elite', type: 'side', title: 'Les Colosses des Champs', giver: 'garrick', zone: 'plains', autoStart: 'level', autoLevel: 5,
      desc: 'Les créatures d’élite deviennent trop nombreuses. Garrick demande une démonstration.',
      objectives: [{ type: 'elite', count: 4, label: 'Vaincre 4 créatures d’élite' }],
      rewards: { xp: 320, gold: 230, gear: 'lame_plaine' },
      outro: ['Garrick regarde les traces de pas dans la terre. « Tu commences à faire peur aux bêtes. »']
    },
    {
      id: 'side_boss', type: 'side', title: 'Les Petits Sceaux', giver: 'aldric', zone: 'plains', autoStart: 'chain', prereq: ['main_plaines'],
      desc: 'Les mini-boss maintiennent les sceaux secondaires. Chacun tombé affaiblit l’Ombre.',
      objectives: [{ type: 'miniBoss', count: 6, label: 'Vaincre 6 mini-boss' }],
      rewards: { xp: 520, gold: 320, gear: 'glaive_ronces' },
      outro: ['Les sentiers sont plus sûrs. Aldric vous confie une carte couverte de ratures.']
    },
    {
      id: 'side_sanctuaires', type: 'side', title: 'Le Chemin des Sanctuaires', giver: 'nora', zone: 'plains', autoStart: 'talk',
      desc: 'Nora aimerait que les sanctuaires soient tous réveillés avant la nuit.',
      objectives: [{ type: 'shrine', count: 5, label: 'Se reposer dans 5 sanctuaires différents' }],
      rewards: { xp: 280, gold: 180, potions: { potion: 3 } },
      outro: ['Nora sourit. « La lumière circule à nouveau sous les six terres. »']
    },
    {
      id: 'side_explorateur', type: 'side', title: 'Les Sentiers Oubliés', giver: 'mira', zone: 'plains', autoStart: 'talk',
      desc: 'Mira veut une carte des avant-postes encore debout. Elle paie en matériel.',
      objectives: [{ type: 'outpost', count: 8, label: 'Découvrir 8 avant-postes' }],
      rewards: { xp: 540, gold: 380, gear: 'bottes_dunes' },
      outro: ['Mira déplie la carte et ajoute votre nom en marge. « Les routes se souviendront de toi. »']
    },
    {
      id: 'side_collection', type: 'side', title: 'Le Cabinet des Merveilles', giver: 'bran', zone: 'plains', autoStart: 'level', autoLevel: 8,
      desc: 'Bran rêve d’un cabinet rempli d’armes et d’armures de toutes les terres.',
      objectives: [{ type: 'gearCount', count: 12, label: 'Posséder 12 pièces d’équipement différentes' }],
      rewards: { xp: 520, gold: 320, gear: 'heaume_ecorce' },
      outro: ['Bran contemple votre collection. « Il ne manque qu’une couronne, maintenant. »']
    },
    {
      id: 'side_niveau', type: 'side', title: 'La Trempe du Héros', giver: 'aldric', zone: 'plains', autoStart: 'level', autoLevel: 6,
      desc: 'Aldric estime qu’un héros doit apprendre vite, ou périr vite.',
      objectives: [{ type: 'level', count: 12, label: 'Atteindre le niveau 12' }],
      rewards: { xp: 700, gold: 450, potions: { elixir: 2 } },
      outro: ['Aldric pose une main sur votre épaule. « Tu portes la lumière sans qu’elle te brûle. »']
    },
    {
      id: 'side_materiaux', type: 'side', title: 'La Réserve de l’Herboriste', giver: 'helia', zone: 'plains', autoStart: 'zone',
      desc: 'Hélia prépare l’hiver. Toutes les mains et toutes les bourses sont les bienvenues.',
      objectives: [{ type: 'materialTotal', count: 20, label: 'Récolter 20 matériaux de monstre' }],
      rewards: { xp: 210, gold: 150, potions: { petite: 4, potion: 2 } },
      outro: ['Hélia range les bocaux un à un. « Avec ça, même les nuits les plus longues passeront. »']
    }
  ];
  D.QUEST_BY_ID = Object.fromEntries(D.QUESTS.map(q => [q.id, q]));
  D.MAIN_QUESTS = D.QUESTS.filter(q => q.type === 'main').map(q => q.id);
  D.SIDE_QUESTS = D.QUESTS.filter(q => q.type === 'side').map(q => q.id);

  /* ------------------------------------------------------------
     Succès
     ------------------------------------------------------------ */
  D.ACHIEVEMENTS = [
    { id: 'first_blood', name: 'Première Lame', desc: 'Vaincre votre premier monstre.', stat: 'kills', value: 1, reward: { xp: 25, gold: 30 } },
    { id: 'chasseur', name: 'Chasseur d’Aurore', desc: 'Vaincre 50 monstres.', stat: 'kills', value: 50, reward: { xp: 180, gold: 120 } },
    { id: 'fleau', name: 'Fléau des Biomes', desc: 'Vaincre 200 monstres.', stat: 'kills', value: 200, reward: { xp: 600, gold: 400 } },
    { id: 'elite', name: 'Tueur d’Élites', desc: 'Vaincre 5 créatures d’élite.', stat: 'elites', value: 5, reward: { xp: 300, gold: 220 } },
    { id: 'gardien', name: 'Briseur de Sceau', desc: 'Vaincre un Gardien de biome.', stat: 'bigBosses', value: 1, reward: { xp: 250, gold: 180 } },
    { id: 'six_sceaux', name: 'Les Six Sceaux', desc: 'Vaincre les six Gardiens.', stat: 'bigBosses', value: 6, reward: { xp: 1200, gold: 900 } },
    { id: 'mini_boss', name: 'Chasseur de Couronnes', desc: 'Vaincre 12 mini-boss.', stat: 'miniBosses', value: 12, reward: { xp: 700, gold: 500 } },
    { id: 'aube', name: 'L’Aube Revenue', desc: 'Vaincre Nyx et sauver Aurore.', stat: 'nyxDefeated', value: 1, reward: { xp: 3000, gold: 2500 } },
    { id: 'fouilleur', name: 'Fouilleur', desc: 'Ouvrir 8 coffres d’avant-poste.', stat: 'chests', value: 8, reward: { xp: 260, gold: 200 } },
    { id: 'cartographe', name: 'Cartographe', desc: 'Découvrir 10 avant-postes.', stat: 'outposts', value: 10, reward: { xp: 450, gold: 350 } },
    { id: 'collectionneur', name: 'Collectionneur', desc: 'Posséder 15 pièces d’équipement différentes.', stat: 'gearUnique', value: 15, reward: { xp: 500, gold: 400 } },
    { id: 'fortune', name: 'Fortune d’Aurore', desc: 'Posséder 1 000 pièces d’or.', stat: 'gold', value: 1000, reward: { xp: 300, gold: 200 } },
    { id: 'herboriste', name: 'Herboriste', desc: 'Récolter 40 matériaux de monstre.', stat: 'materials', value: 40, reward: { xp: 350, gold: 260 } },
    { id: 'veteran', name: 'Vétéran', desc: 'Atteindre le niveau 10.', stat: 'level', value: 10, reward: { xp: 250, gold: 200 } },
    { id: 'legende', name: 'Légende Vivante', desc: 'Atteindre le niveau 20.', stat: 'level', value: 20, reward: { xp: 800, gold: 600 } },
    { id: 'chroniqueur', name: 'Chroniqueur', desc: 'Terminer 12 quêtes.', stat: 'quests', value: 12, reward: { xp: 900, gold: 700 } },
    { id: 'artisan', name: 'Maître Forgeron', desc: 'Améliorer votre équipement 10 fois.', stat: 'upgrades', value: 10, reward: { xp: 400, gold: 300 } }
  ];
  D.ACHIEVEMENT_BY_ID = Object.fromEntries(D.ACHIEVEMENTS.map(a => [a.id, a]));

  /* ------------------------------------------------------------
     Textes
     ------------------------------------------------------------ */
  D.INTRO = [
    "Il y a mille lunes, six Gardiens scellèrent l'Ombre sous les terres d'Aurore.",
    "Aujourd'hui, les sceaux se fissurent. Les biomes s'éveillent, les bêtes montent en puissance, et le monolithe noir murmure à nouveau.",
    "Le village d'Aurore n'a plus qu'un espoir : vous.",
    "Vainquez les Gardiens des six biomes, forgez votre légende, puis affrontez Nyx au monolithe. L'aube vous attend."
  ];

  D.CONTROLS = [
    ['ZQSD / WASD / Flèches', 'Se déplacer'],
    ['J / Espace / Clic gauche', 'Attaquer'],
    ['K / Maj', 'Esquiver'],
    ['H', 'Utiliser une potion'],
    ['E', 'Interagir / parler'],
    ['I / Tab', 'Inventaire et équipement'],
    ['L', 'Journal : quêtes, bestiaire, succès'],
    ['M', 'Carte du monde'],
    ['Échap', 'Pause'],
    ['N', 'Couper la musique']
  ];

  D.LEVEL_XP = function (level) {
    return Math.round(45 + level * 32 + Math.pow(level, 1.55) * 7);
  };

  D.CHEST_BY_ID = Object.fromEntries(D.CHESTS.map(c => [c.id, c]));
  D.SHRINE_BY_ID = Object.fromEntries(D.SHRINES.map(s => [s.id, s]));

  /* ------------------------------------------------------------
     Agrandissement du monde
     Toutes les coordonnées ci-dessus sont écrites dans l'espace
     de conception 240 × 240. On les projette une seule fois dans
     l'espace final 480 × 480, sans toucher au reste du code.
     ------------------------------------------------------------ */
  D.scaleWorld = function () {
    const s = D.MAP_SCALE;
    const pt = (o) => {
      if (!o || typeof o.x !== 'number' || typeof o.y !== 'number') return;
      o.x *= s;
      o.y *= s;
    };
    D.ZONES.forEach(z => {
      pt(z.anchor);
      z.arenas.forEach(pt);
    });
    pt(D.VILLAGE);
    pt(D.FINAL_ARENA);
    D.VILLAGE.r *= s;
    D.FINAL_ARENA.r *= s;
    D.NPCS.forEach(pt);
    D.SHRINES.forEach(pt);
    D.VILLAGE_SIGNS.forEach(pt);
    D.OUTPOSTS.forEach(pt);
    D.CHESTS.forEach(pt);
    D.ZONE_SIGNS.forEach(pt);
  };
  D.scaleWorld();

  window.DATA = D;
})();
