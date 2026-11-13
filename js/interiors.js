/* ============================================================
   LES LÉGENDES D'AURORE — intérieurs de maisons
   Pièces uniques, mobilier procédural, transitions au noir
   ============================================================ */
(function () {
  'use strict';
  const U = window.U, Art = window.Art;

  const ROOM_W = 384, ROOM_H = 256;
  const WALL_H = 60;
  const OX = 128, OY = 52;
  const TILE = 16;
  const DOOR_X = 192, DOOR_Y = 250;

  const R = Art.R, E = Art.E, line = Art.line;
  const cvs = Art.cvs;
  const Interiors = {};
  const cache = new Map();

  function shadow(ctx, cx, cy, rx, ry, alpha) {
    ctx.globalAlpha = alpha === undefined ? 0.2 : alpha;
    E(ctx, cx, cy, rx, ry, '#1e1721');
    ctx.globalAlpha = 1;
  }

  function prop(key, w, h, draw) {
    return Art.cached('interior:' + key, () => {
      const c = cvs(w, h);
      draw(c.getContext('2d'), w, h);
      return Art.outline(c, '#2a212b');
    });
  }

  /* ------------------------------------------------------------
     Thèmes : chaque maison a sa palette et sa décoration
     ------------------------------------------------------------ */
  const THEMES = [
    {
      id: 'herbes', title: 'LA MAISON DES HERBES', short: 'HERBORISTE',
      wall: { paper: '#cbd4a8', paper2: '#d9e0b7', timber: '#5f4a35', wainscot: '#7d5e40', trim: '#b59766' },
      floor: { base: '#8a633d', alt: '#946c44', light: '#a57a4d', dark: '#785533', joint: '#5e4127', grain: '#7b5837' },
      rug: { border: '#8f7442', field: '#78935f', accent: '#d8ce9b', pattern: 'leaf' },
      curtain: '#8fae6d', art: ['herbs', 'painting'], light: '#ffcf7a',
      loreShelf: [
        'Des bottes de sauge, de romarin et de menthe sèchent ici.',
        'Une étiquette manuscrite : « Ne pas donner la tisane rouge aux enfants. »'
      ],
      loreCauldron: [
        'Le chaudron mijote une décoction vert pâle.',
        'Ça sent la forêt après la pluie... et un peu le chou.'
      ]
    },
    {
      id: 'chasseur', title: 'LA MAISON DU CHASSEUR', short: 'CHASSEUR',
      wall: { paper: '#c7ad86', paper2: '#d4bb94', timber: '#513a29', wainscot: '#6d4d34', trim: '#a98658' },
      floor: { base: '#7c5737', alt: '#87613e', light: '#946b44', dark: '#68482e', joint: '#50351f', grain: '#6c4a2d' },
      rug: { border: '#6c4d33', field: '#9a7651', accent: '#d3b184', pattern: 'fur' },
      curtain: '#7f6a4d', art: ['antlers', 'map'], light: '#ffb667',
      loreFire: [
        'La cheminée crépite. Des braises rouges dansent sous les bûches.',
        'Une odeur de résine et de viande fumée imprègne la pièce.'
      ],
      loreRack: [
        'Des armes entretenues avec soin : une épée courte, une hache et un arc.',
        'Sur le manche de la hache : « Pour les jours où la forêt répond. »'
      ]
    },
    {
      id: 'tisserand', title: 'L’ATELIER DE TISSE', short: 'TISSERAND',
      wall: { paper: '#b6c4ce', paper2: '#c4d1da', timber: '#4d5962', wainscot: '#6e7a82', trim: '#9daab0' },
      floor: { base: '#9b7a52', alt: '#a7855b', light: '#b69366', dark: '#826340', joint: '#63492e', grain: '#8b6a43' },
      rug: { border: '#5f7e95', field: '#7fa2b8', accent: '#dbe6e2', pattern: 'weave' },
      curtain: '#7f9bb0', art: ['painting', 'bunting'], light: '#ffd192',
      loreLoom: [
        'Le métier à tisser est chargé d’un drap bleu presque terminé.',
        'Des fils de toutes les couleurs pendent comme une pluie d’arc-en-ciel.'
      ],
      loreWardrobe: [
        'Des étoffes pliées avec soin : laine, lin, et un tissu si doux qu’il semble vivant.',
        'Une note : « Livraison pour la garde-robe du doyen. Ne pas froisser. »'
      ]
    },
    {
      id: 'savoir', title: 'LE CABINET DU SAVOIR', short: 'ÉRUDIT',
      wall: { paper: '#c6b18d', paper2: '#d3bf9b', timber: '#543c2a', wainscot: '#74553a', trim: '#ad8a5c' },
      floor: { base: '#795535', alt: '#845e3b', light: '#926a43', dark: '#65442a', joint: '#4d321d', grain: '#6b482c' },
      rug: { border: '#7d4137', field: '#9d5144', accent: '#e2c9a4', pattern: 'diamond' },
      curtain: '#8d6b52', art: ['painting', 'map'], light: '#ffd79a',
      loreShelf: [
        'Des rayonnages entiers de livres : chroniques d’Aurore, herbiers, traités d’escrime.',
        'Un ouvrage dépasse : « Des six sceaux et de ce qui dort dessous. »'
      ],
      loreDesk: [
        'Le bureau est couvert de cartes annotées et de plumes d’oie.',
        'Une lettre inachevée commence par : « Si le monolithe se réveille... »'
      ]
    },
    {
      id: 'cuisine', title: 'LA MAISON DU PAIN', short: 'CUISINIER',
      wall: { paper: '#ddcba7', paper2: '#e8d7b6', timber: '#6a4a2f', wainscot: '#8a6240', trim: '#bb9563' },
      floor: { base: '#9a7a54', alt: '#a5835b', light: '#b28e63', dark: '#816343', joint: '#624a31', grain: '#896844' },
      rug: { border: '#a65f36', field: '#c8814e', accent: '#efd9ae', pattern: 'stripe' },
      curtain: '#c49a68', art: ['herbs', 'painting'], light: '#ffb35e',
      loreFire: [
        'Un grand feu ronronne dans l’âtre. Une marmite y suspend son ombre.',
        'Le pain du jour refroidit sur la pierre, et l’odeur est insupportable de bonté.'
      ],
      loreTable: [
        'La table est couverte de miches dorées, d’un pot de miel et d’un couteau.',
        'Un mot : « Pour les voyageurs. Prenez une part, laissez la mie. »'
      ]
    },
    {
      id: 'musique', title: 'LA MAISON DES ACCORDS', short: 'MUSICIEN',
      wall: { paper: '#c8bcd3', paper2: '#d5cade', timber: '#56415a', wainscot: '#6f5873', trim: '#a792b4' },
      floor: { base: '#856242', alt: '#906c49', light: '#9e7952', dark: '#715035', joint: '#573c26', grain: '#785435' },
      rug: { border: '#6f5a91', field: '#8f7ab4', accent: '#eee2c6', pattern: 'note' },
      curtain: '#8f7ab4', art: ['instrument', 'bunting'], light: '#ffd192',
      loreLute: [
        'Un luth est posé contre le mur. Ses cordes vibrent encore d’un accord ancien.',
        'Quelqu’un a gravé sur le manche : « On ne joue pas fort quand la nuit écoute. »'
      ],
      loreDrum: [
        'Un tambour de voyage, tendu de peau claire.',
        'Deux baguettes croisées rappellent les marches des anciens gardes.'
      ]
    },
    {
      id: 'enfant', title: 'LA CHAMBRE DES JEUX', short: 'ENFANTS',
      wall: { paper: '#e2d7ab', paper2: '#efe6c1', timber: '#7a5a3a', wainscot: '#987349', trim: '#c8a76d' },
      floor: { base: '#a07c53', alt: '#ac875c', light: '#b99567', dark: '#876642', joint: '#684c30', grain: '#8f6c45' },
      rug: { border: '#c08b3e', field: '#e0b45d', accent: '#f6e6b8', pattern: 'toy' },
      curtain: '#d3a860', art: ['drawings', 'bunting'], light: '#ffe0a0',
      loreToybox: [
        'Un coffre à jouets débordant de soldats de bois et de cailloux peints.',
        'Sur le couvercle : « TRÉSOR DE TIMO — NE PAS TOUCHER (sauf les amis). »'
      ],
      loreTeddy: [
        'Un ours en peluche tout rond veille sur la pièce.',
        'Il lui manque un bouton d’œil. Il n’a pas l’air de s’en plaindre.'
      ]
    },
    {
      id: 'garde', title: 'LE POSTE DE GARDE', short: 'GARDE',
      wall: { paper: '#b6bdc2', paper2: '#c5ccd0', timber: '#4b4842', wainscot: '#66635c', trim: '#9a978e' },
      floor: { base: '#747a7e', alt: '#7e8488', light: '#8d9397', dark: '#62686c', joint: '#4c5155', grain: '#6b7175' },
      rug: { border: '#6d3838', field: '#8f4a4a', accent: '#d8b7a0', pattern: 'stripe' },
      curtain: '#7d858a', art: ['shield', 'map'], light: '#ffbd72',
      loreRack: [
        'Des armes de garde alignées : lances, boucliers, une masse d’armes.',
        'Chaque lame est affûtée. Quelqu’un veille ici, même quand tout est calme.'
      ],
      loreTable: [
        'Une grande carte de la région est dépliée, couverte de punaises et de traits.',
        'Un cercle rouge entoure le nord : « NE PAS S’Y AVENTURER SEUL. »'
      ]
    }
  ];

  /* ------------------------------------------------------------
     Mobilier
     ------------------------------------------------------------ */
  function bedSprite(blanket, frame, key) {
    return prop('bed:' + key, 38, 52, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, w * 0.4, 4);
      R(ctx, 3, 5, w - 6, h - 9, U.shade(frame, -24));
      R(ctx, 4, 6, w - 8, h - 11, frame);
      R(ctx, 4, 6, w - 8, 2, U.shade(frame, 18));
      R(ctx, 2, 2, w - 4, 5, U.shade(frame, -18));
      R(ctx, 3, 3, w - 6, 2, U.shade(frame, 16));
      R(ctx, 7, 9, w - 14, 13, '#efe6d2');
      R(ctx, 7, 9, w - 14, 2, '#fffaee');
      R(ctx, 9, 10, w - 18, 8, '#fbf5e6');
      R(ctx, 10, 11, w - 22, 2, '#e4dac6');
      R(ctx, 5, 23, w - 10, h - 31, blanket);
      R(ctx, 5, 23, w - 10, 2, U.shade(blanket, 20));
      R(ctx, 5, h - 12, w - 10, 4, U.shade(blanket, -20));
      for (let x = 8; x < w - 8; x += 6) R(ctx, x, 27, 1, h - 40, U.shade(blanket, -12));
      R(ctx, 3, h - 8, w - 6, 4, U.shade(frame, -26));
      R(ctx, 5, h - 7, w - 10, 2, U.shade(frame, 8));
      R(ctx, 11, 12, w - 22, 1, '#ffffff');
    });
  }

  function tableSprite(item, wood, cloth, key) {
    return prop('table:' + item + ':' + key, 46, 40, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 19, 4);
      R(ctx, 8, 20, 3, 15, U.shade(wood, -24));
      R(ctx, w - 11, 20, 3, 15, U.shade(wood, -24));
      R(ctx, 5, 18, w - 10, 8, U.shade(wood, -12));
      R(ctx, 4, 17, w - 8, 2, U.shade(wood, 18));
      R(ctx, 2, 16, w - 4, 8, wood);
      R(ctx, 3, 17, w - 6, 2, U.shade(wood, 22));
      R(ctx, 3, 22, w - 6, 2, U.shade(wood, -24));
      if (cloth) {
        R(ctx, w / 2 - 11, 16, 22, 14, cloth);
        R(ctx, w / 2 - 10, 17, 20, 2, U.shade(cloth, 18));
        R(ctx, w / 2 - 10, 27, 20, 2, U.shade(cloth, -16));
      }
      const cx = w / 2, ty = 8;
      if (item === 'books') {
        R(ctx, cx - 11, ty + 3, 22, 6, '#a1493f'); R(ctx, cx - 10, ty + 4, 20, 2, '#c96a58');
        R(ctx, cx - 9, ty - 1, 19, 4, '#4f6f93'); R(ctx, cx - 8, ty, 17, 1, '#7b9bbd');
        R(ctx, cx - 7, ty - 4, 15, 3, '#c8a85a'); R(ctx, cx - 6, ty - 3, 13, 1, '#e5ca80');
        R(ctx, cx + 12, ty + 2, 4, 8, '#e8e0cc');
      } else if (item === 'map') {
        R(ctx, cx - 13, ty, 26, 14, '#e6d7ac');
        R(ctx, cx - 12, ty + 1, 24, 2, '#f2e6c4');
        line(ctx, cx - 9, ty + 5, cx + 8, ty + 10, '#8c7550', 1);
        line(ctx, cx - 7, ty + 11, cx + 10, ty + 4, '#8c7550', 1);
        R(ctx, cx + 5, ty + 3, 2, 2, '#b44a3f');
        R(ctx, cx - 2, ty + 7, 2, 2, '#b44a3f');
        R(ctx, cx - 15, ty + 1, 2, 12, '#9a7744');
      } else if (item === 'bread') {
        E(ctx, cx, ty + 8, 13, 5, '#d9b979');
        R(ctx, cx - 10, ty + 2, 20, 8, '#c98a4b');
        E(ctx, cx, ty + 5, 9, 4, '#e0a35c');
        R(ctx, cx - 6, ty + 2, 3, 1, '#f4d296');
        R(ctx, cx + 2, ty + 3, 4, 1, '#f4d296');
        R(ctx, cx + 13, ty + 3, 2, 9, '#d9d3c4');
        R(ctx, cx + 11, ty + 2, 6, 2, '#b8b2a4');
      } else if (item === 'herbs') {
        E(ctx, cx - 8, ty + 9, 7, 3, '#8b6d47');
        E(ctx, cx + 8, ty + 9, 6, 3, '#8b6d47');
        R(ctx, cx - 11, ty + 8, 7, 1, '#c9a875');
        R(ctx, cx + 5, ty + 8, 7, 1, '#c9a875');
        for (let i = 0; i < 5; i++) R(ctx, cx - 4 + i * 2, ty + 2 + (i % 2), 2, 5, i % 2 ? '#6e9a55' : '#82ad62');
        R(ctx, cx - 1, ty, 2, 7, '#5b7f46');
      } else if (item === 'fabrics') {
        R(ctx, cx - 13, ty + 1, 10, 13, '#7f9db4');
        R(ctx, cx - 12, ty + 2, 8, 2, '#a8c2d4');
        R(ctx, cx - 1, ty + 4, 12, 10, '#b6715b');
        R(ctx, cx, ty + 5, 10, 2, '#d39a80');
        R(ctx, cx + 10, ty + 1, 5, 13, '#d7caa4');
        R(ctx, cx + 11, ty + 2, 3, 2, '#f0e6c8');
      } else if (item === 'music') {
        R(ctx, cx - 13, ty + 2, 26, 13, '#efe4c6');
        R(ctx, cx - 12, ty + 3, 2, 11, '#cbbd9a');
        for (let i = 0; i < 4; i++) R(ctx, cx - 7 + i * 4, ty + 4, 1, 9, '#8b7a56');
        R(ctx, cx + 4, ty + 5, 3, 2, '#4a3a2a');
        R(ctx, cx + 8, ty + 8, 3, 2, '#4a3a2a');
      } else if (item === 'toys') {
        R(ctx, cx - 12, ty + 4, 7, 7, '#c95f55');
        R(ctx, cx - 11, ty + 5, 5, 5, '#e28276');
        R(ctx, cx - 3, ty + 7, 7, 7, '#5f8fc9');
        R(ctx, cx - 2, ty + 8, 5, 5, '#82aede');
        E(ctx, cx + 10, ty + 9, 5, 5, '#d8b95c');
        R(ctx, cx + 8, ty + 5, 4, 2, '#e8d187');
      } else {
        R(ctx, cx - 2, ty + 7, 4, 9, '#e9dcc2');
        R(ctx, cx - 2, ty + 7, 4, 1, '#fff4da');
        R(ctx, cx - 3, ty + 14, 6, 2, '#b9a37e');
        R(ctx, cx - 3, ty + 2, 6, 4, '#c7e2ec');
        R(ctx, cx - 2, ty + 3, 4, 2, '#f4e7a2');
        R(ctx, cx - 1, ty, 2, 2, '#ffd76a');
      }
    });
  }

  function chairSprite(wood, stool) {
    return prop('chair:' + wood + ':' + !!stool, 18, 26, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 7, 2);
      R(ctx, 4, 12, 2, 11, U.shade(wood, -28));
      R(ctx, w - 6, 12, 2, 11, U.shade(wood, -28));
      R(ctx, 3, 10, w - 6, 6, wood);
      R(ctx, 3, 10, w - 6, 2, U.shade(wood, 19));
      if (!stool) {
        R(ctx, 3, 2, 2, 10, wood);
        R(ctx, w - 5, 2, 2, 10, wood);
        R(ctx, 4, 2, w - 8, 2, U.shade(wood, 16));
        R(ctx, 5, 5, w - 10, 2, U.shade(wood, -6));
      }
    });
  }

  function shelfSprite(kind, pal, key) {
    return prop('shelf:' + kind + ':' + key, 52, 62, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 22, 4);
      R(ctx, 3, 3, w - 6, h - 7, U.shade(pal, -34));
      R(ctx, 4, 4, w - 8, h - 9, pal);
      R(ctx, 4, 4, w - 8, 2, U.shade(pal, 18));
      R(ctx, 4, 16, w - 8, 3, U.shade(pal, -20));
      R(ctx, 4, 31, w - 8, 3, U.shade(pal, -20));
      R(ctx, 4, 46, w - 8, 3, U.shade(pal, -20));
      R(ctx, 2, h - 5, w - 4, 3, U.shade(pal, -30));
      const rng = U.mulberry32(U.hashString('shelf' + kind + key));
      if (kind === 'books') {
        const cols = ['#a1493f', '#4f6f93', '#c8a85a', '#5f8a5a', '#8b5f91', '#b97242', '#4f8a83'];
        [8, 20, 35, 50].forEach(by => {
          let x = 7;
          while (x < w - 9) {
            const bw = 2 + Math.floor(rng() * 3);
            const bh = 7 + Math.floor(rng() * 4);
            R(ctx, x, by + (10 - bh), bw, bh, cols[Math.floor(rng() * cols.length)]);
            if (rng() < 0.5) R(ctx, x, by + (10 - bh), bw, 1, '#f0e2c2');
            x += bw + 1;
          }
        });
      } else if (kind === 'jars') {
        const cols = ['#8fbf6e', '#c47f5a', '#d5b45c', '#7fa8c4', '#b47fb4'];
        [10, 25, 40, 55].forEach(by => {
          for (let i = 0; i < 5; i++) {
            const x = 7 + i * 8 + Math.floor(rng() * 2);
            const col = cols[Math.floor(rng() * cols.length)];
            R(ctx, x, by - 5, 5, 7, '#c9d3c7');
            R(ctx, x + 1, by - 2, 3, 3, col);
            R(ctx, x, by - 6, 5, 2, '#e6e0cf');
            R(ctx, x + 1, by - 6, 1, 1, '#9a9a86');
          }
        });
      } else if (kind === 'herbs') {
        for (let i = 0; i < 12; i++) {
          const x = 7 + i * 3.5, y = 10 + Math.floor(rng() * 42);
          R(ctx, x, y, 2, 6, i % 2 ? '#7a9e55' : '#8caf62');
          R(ctx, x - 1, y + 5, 4, 2, '#6a8b48');
        }
        R(ctx, 5, 52, 12, 6, '#9a7744');
      } else {
        const cols = ['#c76f5c', '#6f93b8', '#c9b05c', '#7fa06a', '#a97fb5'];
        [10, 25, 40].forEach(by => {
          for (let i = 0; i < 4; i++) {
            const x = 8 + i * 9;
            R(ctx, x, by, 7, 6, cols[Math.floor(rng() * cols.length)]);
            R(ctx, x + 1, by + 1, 5, 1, '#f0e2c2');
            R(ctx, x + 2, by + 3, 3, 1, '#6b4f3a');
          }
        });
      }
    });
  }

  function wardrobeSprite(wood, cloth) {
    return prop('wardrobe:' + wood + ':' + cloth, 36, 60, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 14, 4);
      R(ctx, 3, 6, w - 6, h - 10, U.shade(wood, -26));
      R(ctx, 4, 7, w - 8, h - 12, wood);
      R(ctx, 4, 7, w - 8, 2, U.shade(wood, 18));
      R(ctx, w / 2, 10, 1, h - 18, U.shade(wood, -28));
      R(ctx, 7, 12, w / 2 - 9, h - 22, U.shade(wood, 8));
      R(ctx, w / 2 + 2, 12, w / 2 - 9, h - 22, U.shade(wood, 4));
      R(ctx, 9, 14, w / 2 - 13, h - 26, U.shade(wood, 14));
      R(ctx, w / 2 + 5, 14, w / 2 - 13, h - 26, U.shade(wood, 10));
      R(ctx, w / 2 - 4, 31, 2, 4, '#d8b45c');
      R(ctx, w / 2 + 2, 31, 2, 4, '#d8b45c');
      R(ctx, 2, 3, w - 4, 5, U.shade(wood, -30));
      R(ctx, 3, 4, w - 6, 2, U.shade(wood, 12));
      R(ctx, 4, h - 6, 3, 3, U.shade(wood, -34));
      R(ctx, w - 7, h - 6, 3, 3, U.shade(wood, -34));
      R(ctx, 6, 18, 6, 12, cloth);
      R(ctx, 7, 19, 4, 2, U.shade(cloth, 22));
    });
  }

  function fireplaceSprite(stone, wood) {
    return prop('fireplace:' + stone + ':' + wood, 60, 50, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 26, 4);
      R(ctx, 3, 8, w - 6, h - 11, U.shade(stone, -28));
      R(ctx, 4, 9, w - 8, h - 13, stone);
      R(ctx, 4, 9, w - 8, 3, U.shade(stone, 18));
      R(ctx, 6, 15, w - 12, 10, U.shade(stone, -12));
      R(ctx, 8, 39, w - 16, 4, U.shade(stone, -38));
      R(ctx, 6, 12, w - 12, 4, wood);
      R(ctx, 6, 12, w - 12, 1, U.shade(wood, 20));
      R(ctx, 16, 21, w - 32, 20, '#2a1a1c');
      R(ctx, 18, 24, w - 36, 17, '#3d2020');
      R(ctx, 20, 32, w - 40, 9, '#6a3322');
      R(ctx, 24, 34, w - 48, 3, '#8a4428');
      R(ctx, w / 2 - 9, 29, 6, 5, '#6b4227');
      R(ctx, w / 2 + 3, 31, 6, 4, '#7d4d2c');
      R(ctx, w / 2 - 3, 24, 5, 8, '#e88732');
      R(ctx, w / 2, 21, 3, 10, '#ffcf54');
      R(ctx, w / 2 + 1, 18, 1, 6, '#ffe9a0');
      for (let i = 0; i < 6; i++) {
        const x = 8 + i * 7;
        R(ctx, x, 10 + (i % 2) * 2, 6, 2, U.shade(stone, 8));
        R(ctx, x + 1, 21 + (i % 3) * 5, 5, 2, U.shade(stone, -4));
      }
      R(ctx, 2, h - 5, w - 4, 4, U.shade(stone, -34));
    });
  }

  function cauldronSprite(brew) {
    return prop('cauldron:' + brew, 34, 36, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 13, 3);
      R(ctx, 8, h - 7, 3, 5, '#3a3030');
      R(ctx, w - 11, h - 7, 3, 5, '#3a3030');
      E(ctx, w / 2, h / 2 + 3, 12, 9, '#3a3438');
      E(ctx, w / 2, h / 2 + 2, 10, 7, '#565056');
      R(ctx, 7, 17, w - 14, 5, '#252125');
      E(ctx, w / 2, 17, 10, 4, brew);
      R(ctx, 9, 16, 7, 2, U.shade(brew, 22));
      E(ctx, w / 2 - 3, 15, 2, 1, '#d9ffc0');
      E(ctx, w / 2 + 4, 16, 2, 1, '#d9ffc0');
      ctx.globalAlpha = 0.5;
      R(ctx, w / 2 - 3, 7, 2, 7, '#cfe4d0');
      R(ctx, w / 2 + 2, 4, 1, 9, '#cfe4d0');
      ctx.globalAlpha = 1;
      R(ctx, 6, h - 9, w - 12, 2, '#2a2528');
    });
  }

  function plantSprite(leaf) {
    return prop('plant:' + leaf, 24, 34, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 8, 2);
      R(ctx, 8, h - 9, 8, 7, '#a6633e');
      R(ctx, 7, h - 10, 10, 3, '#c17b4e');
      R(ctx, 8, h - 8, 7, 5, '#8e5134');
      R(ctx, w / 2 - 1, 10, 2, 18, '#54763e');
      E(ctx, w / 2 - 5, 12, 5, 4, leaf);
      E(ctx, w / 2 + 5, 9, 5, 4, U.shade(leaf, 14));
      E(ctx, w / 2 - 4, 19, 4, 3, U.shade(leaf, -12));
      E(ctx, w / 2 + 4, 17, 4, 3, leaf);
      R(ctx, w / 2 - 6, 6, 1, 4, U.shade(leaf, 20));
    });
  }

  function loomSprite(wood, cloth) {
    return prop('loom:' + wood + ':' + cloth, 52, 52, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 20, 4);
      R(ctx, 3, 5, 3, h - 9, U.shade(wood, -20));
      R(ctx, w - 6, 5, 3, h - 9, U.shade(wood, -20));
      R(ctx, 2, 4, w - 4, 4, wood);
      R(ctx, 2, h - 8, w - 4, 4, wood);
      for (let x = 8; x < w - 7; x += 4) R(ctx, x, 9, 1, h - 18, '#e2d6b8');
      R(ctx, 8, 18, w - 16, 18, cloth);
      R(ctx, 9, 19, w - 18, 2, U.shade(cloth, 18));
      for (let y = 22; y < 35; y += 4) R(ctx, 8, y, w - 16, 1, U.shade(cloth, -12));
      R(ctx, 5, 12, w - 10, 3, U.shade(wood, 16));
      R(ctx, 6, 13, w - 12, 1, U.shade(wood, 30));
      R(ctx, 5, h - 13, w - 10, 2, U.shade(wood, -28));
      R(ctx, w / 2 - 2, 39, 4, 5, U.shade(cloth, 12));
    });
  }

  function rackSprite(wood) {
    return prop('rack:' + wood, 48, 54, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 18, 4);
      R(ctx, 4, 6, 3, h - 10, U.shade(wood, -24));
      R(ctx, w - 7, 6, 3, h - 10, U.shade(wood, -24));
      R(ctx, 2, 5, w - 4, 4, wood);
      R(ctx, 2, 22, w - 4, 3, U.shade(wood, -16));
      R(ctx, 2, h - 8, w - 4, 3, U.shade(wood, -20));
      // épée
      R(ctx, 13, 10, 2, 26, '#c9d5dc');
      R(ctx, 13, 10, 1, 24, '#eef7fb');
      R(ctx, 10, 34, 8, 2, '#c8a85a');
      R(ctx, 12, 36, 4, 5, '#6b4a30');
      R(ctx, 13, 38, 2, 1, '#e8d18c');
      // hache
      R(ctx, 32, 12, 2, 28, '#6b4a30');
      E(ctx, 28, 15, 6, 5, '#aab4ba');
      R(ctx, 28, 11, 5, 3, '#d6e0e5');
      // arc
      ctx.strokeStyle = '#8a613e'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(24, 28, 10, -1.2, 1.2); ctx.stroke();
      R(ctx, 24, 16, 1, 22, '#d8cfa8');
    });
  }

  function toyboxSprite() {
    return prop('toybox', 30, 26, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 11, 3);
      R(ctx, 3, 8, w - 6, h - 10, '#8f4f3f');
      R(ctx, 4, 9, w - 8, h - 12, '#b5664f');
      R(ctx, 2, 5, w - 4, 5, '#a95c46');
      R(ctx, 3, 6, w - 6, 2, '#cf8266');
      R(ctx, w / 2 - 2, 11, 4, 4, '#e3c46a');
      R(ctx, 7, 2, 5, 5, '#5f8fc9');
      R(ctx, 15, 1, 4, 4, '#d8b95c');
      R(ctx, 20, 3, 4, 3, '#7fa06a');
      R(ctx, 4, h - 5, 4, 3, '#6e3c30');
      R(ctx, w - 8, h - 5, 4, 3, '#6e3c30');
    });
  }

  function teddySprite() {
    return prop('teddy', 22, 26, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 7, 2);
      E(ctx, w / 2, 4, 4, 4, '#a97a4e');
      E(ctx, 5, 6, 4, 4, '#a97a4e');
      E(ctx, w - 5, 6, 4, 4, '#a97a4e');
      E(ctx, w / 2, 9, 7, 6, '#b98a5d');
      R(ctx, 6, 14, w - 12, 8, '#b98a5d');
      R(ctx, 8, 15, w - 16, 5, '#c99a6b');
      R(ctx, 8, 3, 2, 2, '#3a2a20');
      R(ctx, w - 10, 3, 2, 2, '#3a2a20');
      R(ctx, w / 2 - 1, 7, 3, 2, '#6b4a30');
      R(ctx, 6, h - 6, 4, 4, '#a97a4e');
      R(ctx, w - 10, h - 6, 4, 4, '#a97a4e');
      R(ctx, w / 2 - 2, 16, 4, 6, '#8f633f');
    });
  }

  function drumSprite() {
    return prop('drum', 26, 30, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 9, 2);
      R(ctx, 4, 8, w - 8, h - 14, '#8a5a38');
      R(ctx, 5, 9, w - 10, h - 16, '#b57a4e');
      E(ctx, w / 2, 9, 9, 3, '#e7dcc2');
      R(ctx, 3, 8, w - 6, 2, '#6b4a30');
      R(ctx, 3, h - 9, w - 6, 2, '#6b4a30');
      ctx.strokeStyle = '#e8d8b0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(5, 11); ctx.lineTo(w - 5, h - 11); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w - 5, 11); ctx.lineTo(5, h - 11); ctx.stroke();
      R(ctx, 3, 12, 1, 18, '#d8b95c');
      R(ctx, 6, 12, 1, 18, '#d8b95c');
      R(ctx, 12, 3, 2, 10, '#c8a85a');
      R(ctx, 16, 5, 2, 8, '#c8a85a');
    });
  }

  function luteSprite() {
    return prop('lute', 22, 44, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 7, 2);
      E(ctx, w / 2, 28, 8, 10, '#9a6b3e');
      E(ctx, w / 2, 28, 6, 8, '#c58a4d');
      E(ctx, w / 2, 28, 3, 5, '#6b4a2c');
      R(ctx, w / 2 - 1, 4, 3, 18, '#6b4a2c');
      R(ctx, w / 2, 5, 1, 16, '#c8a85a');
      R(ctx, w / 2 - 3, 2, 7, 4, '#5a3b24');
      R(ctx, w / 2 - 5, 18, 11, 2, '#d6c39a');
      for (let i = 0; i < 3; i++) R(ctx, w / 2 - 3 + i * 3, 21, 1, 9, '#efe2b8');
      R(ctx, w / 2 - 4, 37, 8, 2, '#5a3b24');
    });
  }

  function globeSprite() {
    return prop('globe', 24, 32, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 8, 2);
      E(ctx, w / 2, 11, 8, 8, '#5f8aa8');
      E(ctx, w / 2, 11, 7, 7, '#79a7c3');
      E(ctx, w / 2 - 3, 9, 3, 2, '#8fbc6a');
      E(ctx, w / 2 + 3, 13, 2, 3, '#a7c77a');
      R(ctx, w / 2 - 2, 3, 4, 2, '#c8a85a');
      ctx.strokeStyle = '#c8a85a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(w / 2, 11, 9, -0.6, 0.6); ctx.stroke();
      R(ctx, w / 2 - 1, 19, 2, 6, '#8a6a45');
      R(ctx, w / 2 - 5, 25, 10, 2, '#6b4a30');
      R(ctx, w / 2 - 4, 27, 8, 2, '#8a6a45');
      R(ctx, w / 2 - 7, 25, 2, 4, '#5a3b24');
      R(ctx, w / 2 + 5, 25, 2, 4, '#5a3b24');
    });
  }

  function sackSprite() {
    return prop('sack', 26, 24, (ctx, w, h) => {
      shadow(ctx, w / 2, h - 3, 9, 2);
      E(ctx, w / 2, 13, 10, 9, '#b99a68');
      E(ctx, w / 2, 12, 9, 8, '#cdb07c');
      R(ctx, w / 2 - 4, 4, 8, 4, '#b99a68');
      R(ctx, w / 2 - 3, 3, 6, 2, '#d8c090');
      R(ctx, w / 2 - 3, 6, 6, 1, '#8f7448');
      R(ctx, 8, 9, 3, 1, '#a38354');
      R(ctx, w - 11, 14, 2, 1, '#a38354');
      R(ctx, 5, h - 4, 16, 2, '#8f7448');
    });
  }

  /* ------------------------------------------------------------
     Décors muraux
     ------------------------------------------------------------ */
  function drawWindow(ctx, x, y, w, h, theme) {
    R(ctx, x - 3, y - 3, w + 6, h + 6, U.shade(theme.wall.timber, -10));
    R(ctx, x - 1, y - 1, w + 2, h + 2, '#d7c9a9');
    const sky = ctx.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, '#9ed3e6');
    sky.addColorStop(0.68, '#d7eef4');
    sky.addColorStop(1, '#f0e9c8');
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, w, h);
    E(ctx, x + 16, y + 10, 6, 5, '#fff4c8');
    R(ctx, x, y + h - 8, w, 8, '#8fb47c');
    E(ctx, x + 14, y + h - 9, 10, 4, '#7aa36b');
    E(ctx, x + w - 14, y + h - 7, 12, 5, '#90b97b');
    R(ctx, x + w / 2, y, 2, h, '#f0e6d0');
    R(ctx, x, y + h / 2, w, 2, '#f0e6d0');
    R(ctx, x, y, w, 2, '#f8f2e2');
    R(ctx, x, y, 2, h, '#f8f2e2');
    R(ctx, x + w - 2, y, 2, h, '#f8f2e2');
    R(ctx, x - 4, y + h + 1, w + 8, 4, '#8a6a49');
    R(ctx, x - 2, y + h + 1, w + 4, 1, '#b99a6a');
    // rideaux
    const cc = theme.curtain;
    R(ctx, x - 9, y - 4, 7, h + 7, cc);
    R(ctx, x - 8, y - 3, 3, h + 5, U.shade(cc, 16));
    R(ctx, x + w + 2, y - 4, 7, h + 7, cc);
    R(ctx, x + w + 3, y - 3, 3, h + 5, U.shade(cc, 16));
    R(ctx, x - 10, y - 5, w + 20, 3, U.shade(cc, -24));
    // lumière sur le sol
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#ffe9b0';
    ctx.beginPath();
    ctx.moveTo(x + 6, WALL_H);
    ctx.lineTo(x + w - 6, WALL_H);
    ctx.lineTo(x + w + 22, WALL_H + 52);
    ctx.lineTo(x - 14, WALL_H + 52);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawPainting(ctx, cx, y, seed) {
    const w = 46, h = 32, x = cx - w / 2;
    R(ctx, x - 2, y - 2, w + 4, h + 4, '#5d432e');
    R(ctx, x, y, w, h, '#8a6a45');
    R(ctx, x + 2, y + 2, w - 4, h - 4, '#c9b98f');
    const rng = U.mulberry32(seed || 7);
    if (rng() < 0.5) {
      const sky = ctx.createLinearGradient(0, y + 2, 0, y + h - 2);
      sky.addColorStop(0, '#9fc7d4');
      sky.addColorStop(1, '#e8ddb9');
      ctx.fillStyle = sky;
      ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
      E(ctx, x + w - 13, y + 9, 4, 4, '#f7dd83');
      R(ctx, x + 3, y + 20, w - 6, 9, '#7fa06a');
      E(ctx, x + 15, y + 21, 10, 5, '#8fb47c');
      E(ctx, x + 30, y + 23, 9, 4, '#6f9160');
      R(ctx, x + 20, y + 17, 2, 8, '#5a7d4f');
      R(ctx, x + 19, y + 14, 5, 4, '#6f9160');
    } else {
      ctx.fillStyle = '#b9cfd8';
      ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
      E(ctx, x + w / 2, y + 14, 7, 8, '#e0b98f');
      R(ctx, x + w / 2 - 8, y + 21, 16, 8, '#7d5a86');
      E(ctx, x + w / 2, y + 10, 7, 5, '#5a3a26');
      R(ctx, x + w / 2 - 5, y + 12, 10, 2, '#5a3a26');
    }
    R(ctx, x + 1, y + 1, w - 2, 1, '#e8d8b0');
  }

  function drawHerbsWall(ctx, cx, y) {
    R(ctx, cx - 26, y, 52, 2, '#6d4b30');
    R(ctx, cx - 26, y + 2, 52, 1, '#8d6742');
    const cols = ['#6f9452', '#82a65f', '#5d8046', '#93b46d'];
    for (let i = 0; i < 5; i++) {
      const x = cx - 20 + i * 10;
      const hgt = 14 + (i % 3) * 4;
      R(ctx, x, y + 3, 1, hgt, '#8a7555');
      for (let j = 0; j < 4; j++) {
        E(ctx, x + (j % 2 ? 2 : -1), y + 9 + j * 3, 2, 2, cols[(i + j) % cols.length]);
      }
      R(ctx, x - 1, y + 3 + hgt, 3, 2, '#c8a85a');
    }
  }

  function drawAntlers(ctx, cx, y) {
    ctx.strokeStyle = '#d8c9a6'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 18, y + 20); ctx.quadraticCurveTo(cx - 14, y + 8, cx - 6, y + 4);
    ctx.moveTo(cx - 12, y + 12); ctx.lineTo(cx - 20, y + 6);
    ctx.moveTo(cx - 8, y + 6); ctx.lineTo(cx - 10, y - 1);
    ctx.moveTo(cx + 18, y + 20); ctx.quadraticCurveTo(cx + 14, y + 8, cx + 6, y + 4);
    ctx.moveTo(cx + 12, y + 12); ctx.lineTo(cx + 20, y + 6);
    ctx.moveTo(cx + 8, y + 6); ctx.lineTo(cx + 10, y - 1);
    ctx.stroke();
    R(ctx, cx - 8, y + 18, 16, 4, '#8a6a45');
    R(ctx, cx - 6, y + 19, 12, 1, '#b99a6a');
    R(ctx, cx - 2, y + 16, 4, 6, '#6d4b30');
  }

  function drawWallMap(ctx, cx, y) {
    const w = 54, h = 34, x = cx - w / 2;
    R(ctx, x - 1, y - 1, w + 2, h + 2, '#6d4b30');
    R(ctx, x, y, w, h, '#e2d3a8');
    R(ctx, x + 2, y + 2, w - 4, h - 4, '#eee0bd');
    ctx.strokeStyle = '#8d7550'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 8); ctx.lineTo(x + 16, y + 5); ctx.lineTo(x + 24, y + 12);
    ctx.lineTo(x + 37, y + 9); ctx.lineTo(x + 48, y + 16); ctx.lineTo(x + 42, y + 26);
    ctx.lineTo(x + 28, y + 22); ctx.lineTo(x + 16, y + 28); ctx.lineTo(x + 6, y + 22);
    ctx.closePath(); ctx.stroke();
    R(ctx, x + 30, y + 6, 2, 2, '#b44a3f');
    R(ctx, x + 13, y + 20, 2, 2, '#b44a3f');
    R(ctx, x + 24, y + 15, 1, 1, '#6b4a30');
    R(ctx, x + 25, y + 15, 1, 1, '#6b4a30');
    ctx.strokeStyle = '#a58a5a';
    ctx.beginPath(); ctx.moveTo(x + 44, y + 23); ctx.lineTo(x + 44, y + 30);
    ctx.moveTo(x + 41, y + 27); ctx.lineTo(x + 47, y + 27); ctx.stroke();
    R(ctx, x - 2, y - 3, 8, 3, '#b9a06a');
    R(ctx, x + w - 6, y - 3, 8, 3, '#b9a06a');
  }

  function drawShield(ctx, cx, y) {
    E(ctx, cx, y + 18, 18, 18, '#6d4b30');
    E(ctx, cx, y + 18, 17, 17, '#9a7444');
    E(ctx, cx, y + 18, 13, 13, '#b68a50');
    E(ctx, cx, y + 18, 6, 6, '#8a6a45');
    R(ctx, cx - 1, y + 8, 2, 20, '#d8c9a6');
    R(ctx, cx - 5, y + 14, 10, 2, '#d8c9a6');
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      R(ctx, cx + Math.cos(a) * 13 - 1, y + 18 + Math.sin(a) * 13 - 1, 2, 2, '#5d432e');
    }
    R(ctx, cx - 8, y + 3, 3, 6, '#7d5a34');
    R(ctx, cx + 5, y + 3, 3, 6, '#7d5a34');
  }

  function drawDrawings(ctx, cx, y) {
    const cols = ['#c95f55', '#5f8fc9', '#6fa05a', '#c9a33f'];
    const spots = [[-28, 2], [-6, 0], [16, 3], [30, 1]];
    spots.forEach(([ox, oy], i) => {
      const x = cx + ox, yy = y + oy;
      R(ctx, x, yy, 18, 20, '#efe6cc');
      R(ctx, x + 1, yy + 1, 16, 18, '#f8f2e0');
      R(ctx, x + 8, yy - 2, 3, 3, '#d8b95c');
      if (i % 2) {
        E(ctx, x + 9, yy + 8, 4, 4, cols[i % cols.length]);
        R(ctx, x + 4, yy + 12, 10, 1, cols[(i + 1) % cols.length]);
        R(ctx, x + 5, yy + 14, 8, 1, cols[(i + 2) % cols.length]);
      } else {
        R(ctx, x + 4, yy + 9, 10, 1, cols[i % cols.length]);
        R(ctx, x + 4, yy + 13, 10, 1, cols[(i + 1) % cols.length]);
        R(ctx, x + 8, yy + 4, 3, 3, '#e0b04a');
        R(ctx, x + 3, yy + 16, 12, 1, cols[(i + 2) % cols.length]);
      }
    });
  }

  function drawBunting(ctx, cx, y) {
    ctx.strokeStyle = '#6d4b30'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 34, y);
    ctx.quadraticCurveTo(cx, y + 10, cx + 34, y);
    ctx.stroke();
    const cols = ['#c95f55', '#d8b95c', '#5f8fc9', '#6fa05a', '#a97fb5'];
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const x = cx - 32 + t * 64;
      const yy = y + Math.sin(t * Math.PI) * 8;
      R(ctx, x - 3, yy, 7, 6, cols[i % cols.length]);
      R(ctx, x - 2, yy + 6, 5, 2, U.shade(cols[i % cols.length], -18));
    }
  }

  function drawInstrumentWall(ctx, cx, y) {
    ctx.strokeStyle = '#c8a85a'; ctx.lineWidth = 2;
    E(ctx, cx, y + 18, 11, 13, '#9a6b3e');
    E(ctx, cx, y + 18, 8, 10, '#c58a4d');
    E(ctx, cx, y + 18, 4, 6, '#6b4a2c');
    R(ctx, cx - 1, y - 2, 3, 14, '#6b4a2c');
    R(ctx, cx, y - 1, 1, 12, '#d8c9a6');
    R(ctx, cx - 3, y - 4, 7, 3, '#5a3b24');
    R(ctx, cx - 4, y + 11, 9, 2, '#d6c39a');
    ctx.strokeStyle = '#efe2b8'; ctx.lineWidth = 1;
    R(ctx, cx + 16, y + 6, 1, 1, '#efe2b8');
    R(ctx, cx + 20, y + 2, 1, 1, '#efe2b8');
    R(ctx, cx + 24, y + 8, 1, 1, '#efe2b8');
    R(ctx, cx + 18, y + 1, 4, 1, '#efe2b8');
    R(ctx, cx + 20, y + 3, 4, 1, '#efe2b8');
  }

  function drawWallArt(ctx, type, cx, y, seed) {
    if (type === 'painting') drawPainting(ctx, cx, y, seed);
    else if (type === 'herbs') drawHerbsWall(ctx, cx, y);
    else if (type === 'antlers') drawAntlers(ctx, cx, y);
    else if (type === 'map') drawWallMap(ctx, cx, y);
    else if (type === 'shield') drawShield(ctx, cx, y);
    else if (type === 'drawings') drawDrawings(ctx, cx, y);
    else if (type === 'bunting') drawBunting(ctx, cx, y);
    else if (type === 'instrument') drawInstrumentWall(ctx, cx, y);
  }

  /* ------------------------------------------------------------
     Sol et murs
     ------------------------------------------------------------ */
  function drawFloor(ctx, theme, rng) {
    const f = theme.floor;
    R(ctx, 0, WALL_H, ROOM_W, ROOM_H - WALL_H, f.base);
    if (theme.id === 'garde') {
      const size = 24;
      for (let y = WALL_H; y < ROOM_H; y += size) {
        for (let x = -Math.floor(rng() * 20); x < ROOM_W; x += size) {
          const col = rng() < 0.5 ? f.base : f.alt;
          R(ctx, x, y, size - 1, size - 1, col);
          R(ctx, x, y, size - 1, 1, f.light);
          R(ctx, x, y + size - 2, size - 1, 1, f.dark);
          if (rng() < 0.3) R(ctx, x + 4 + rng() * 12, y + 6 + rng() * 10, 4, 1, f.grain);
        }
      }
    } else {
      const boardH = 12;
      let row = 0;
      for (let y = WALL_H; y < ROOM_H; y += boardH, row++) {
        const off = (row % 2) * 20;
        for (let x = -off; x < ROOM_W; x += 52) {
          const col = rng() < 0.5 ? f.base : f.alt;
          R(ctx, x, y, 50, boardH - 1, col);
          R(ctx, x, y, 50, 1, f.light);
          R(ctx, x, y + boardH - 2, 50, 1, f.dark);
          R(ctx, x + 50, y, 2, boardH - 1, f.joint);
          for (let i = 0; i < 3; i++) {
            R(ctx, x + 4 + rng() * 38, y + 2 + rng() * 7, 2 + rng() * 7, 1, f.grain);
          }
          if (rng() < 0.16) {
            E(ctx, x + 8 + rng() * 34, y + 4 + rng() * 4, 2, 1, f.dark);
            R(ctx, x + 10 + rng() * 30, y + 5, 3, 1, f.light);
          }
        }
      }
    }
    // tapis
    const rug = theme.rug;
    const rx = 118, ry = 168, rw = 148, rh = 78;
    ctx.globalAlpha = 0.18;
    E(ctx, rx + rw / 2, ry + rh / 2 + 3, rw / 2, rh / 2, '#1c1620');
    ctx.globalAlpha = 1;
    R(ctx, rx, ry, rw, rh, rug.border);
    R(ctx, rx + 3, ry + 3, rw - 6, rh - 6, rug.field);
    R(ctx, rx + 7, ry + 7, rw - 14, rh - 14, U.shade(rug.field, 10));
    R(ctx, rx + 7, ry + 7, rw - 14, 1, rug.accent);
    R(ctx, rx + 7, ry + rh - 8, rw - 14, 1, rug.accent);
    if (rug.pattern === 'fur') {
      for (let i = 0; i < 40; i++) {
        const x = rx + 8 + rng() * (rw - 16), y = ry + 8 + rng() * (rh - 16);
        R(ctx, x, y, 3 + rng() * 4, 1, U.shade(rug.field, rng() < 0.5 ? 16 : -16));
      }
    } else if (rug.pattern === 'weave') {
      for (let x = rx + 10; x < rx + rw - 10; x += 6) R(ctx, x, ry + 10, 1, rh - 20, U.shade(rug.field, -10));
      for (let y = ry + 12; y < ry + rh - 12; y += 6) R(ctx, rx + 10, y, rw - 20, 1, U.shade(rug.field, 8));
    } else if (rug.pattern === 'diamond') {
      for (let i = 0; i < 5; i++) {
        const x = rx + 18 + i * 28;
        R(ctx, x, ry + rh / 2 - 1, 12, 3, rug.accent);
        R(ctx, x + 3, ry + rh / 2 - 5, 6, 11, rug.accent);
        R(ctx, x + 5, ry + rh / 2 - 3, 2, 7, rug.field);
      }
    } else if (rug.pattern === 'stripe') {
      for (let i = 0; i < 4; i++) R(ctx, rx + 10, ry + 14 + i * 14, rw - 20, 3, rug.accent);
    } else if (rug.pattern === 'note') {
      [[36, 22], [64, 38], [92, 20], [116, 44]].forEach(([ox, oy]) => {
        E(ctx, rx + ox, ry + oy, 4, 3, rug.accent);
        R(ctx, rx + ox + 3, ry + oy - 10, 1, 11, rug.accent);
        R(ctx, rx + ox + 3, ry + oy - 10, 6, 1, rug.accent);
      });
    } else if (rug.pattern === 'toy') {
      const cols = ['#c95f55', '#5f8fc9', '#6fa05a', '#d8b95c'];
      for (let i = 0; i < 9; i++) {
        R(ctx, rx + 12 + rng() * (rw - 24), ry + 12 + rng() * (rh - 24), 4, 4, cols[i % cols.length]);
      }
    } else if (rug.pattern === 'leaf') {
      for (let i = 0; i < 6; i++) {
        const x = rx + 20 + i * 20, y = ry + 20 + (i % 2) * 26;
        E(ctx, x, y, 5, 3, rug.accent);
        R(ctx, x - 6, y + 1, 6, 1, U.shade(rug.accent, -16));
      }
    }
    // franges
    for (let i = 0; i < 12; i++) {
      R(ctx, rx + 4 + i * 12, ry + rh, 1, 3, rug.accent);
      R(ctx, rx + 4 + i * 12, ry - 3, 1, 3, rug.accent);
    }
  }

  function drawWalls(ctx, theme, rng, seed) {
    const w = theme.wall;
    R(ctx, 0, 0, ROOM_W, WALL_H, w.paper);
    for (let x = 0; x < ROOM_W; x += 14) {
      R(ctx, x, 6, 7, WALL_H - 22, w.paper2);
    }
    // lambris
    R(ctx, 0, WALL_H - 16, ROOM_W, 16, w.wainscot);
    R(ctx, 0, WALL_H - 18, ROOM_W, 2, w.trim);
    R(ctx, 0, WALL_H - 4, ROOM_W, 4, U.shade(w.wainscot, -26));
    for (let x = 0; x < ROOM_W; x += 24) R(ctx, x, WALL_H - 16, 1, 14, U.shade(w.wainscot, -18));
    // poutres
    R(ctx, 0, 0, ROOM_W, 6, w.timber);
    R(ctx, 0, 5, ROOM_W, 1, U.shade(w.timber, 22));
    [8, 188, 368].forEach(x => {
      R(ctx, x, 0, 5, WALL_H - 16, w.timber);
      R(ctx, x + 1, 0, 1, WALL_H - 16, U.shade(w.timber, 18));
      R(ctx, x, WALL_H - 20, 5, 4, U.shade(w.timber, -12));
    });
    R(ctx, 0, WALL_H - 19, ROOM_W, 3, U.shade(w.timber, -6));
    // fenêtre et tableaux
    drawWindow(ctx, 34, 12, 62, 32, theme);
    drawWallArt(ctx, theme.art[0], 148, 10, seed);
    drawWallArt(ctx, theme.art[1], 286, 10, seed + 17);
    // murs latéraux
    R(ctx, 0, WALL_H, 12, ROOM_H - WALL_H, '#2e2632');
    R(ctx, 10, WALL_H, 2, ROOM_H - WALL_H, '#17131d');
    R(ctx, ROOM_W - 12, WALL_H, 12, ROOM_H - WALL_H, '#2e2632');
    R(ctx, ROOM_W - 12, WALL_H, 2, ROOM_H - WALL_H, '#4a3f50');
    R(ctx, 12, WALL_H, 1, ROOM_H - WALL_H, '#564a5c');
    // plinthes latérales
    R(ctx, 12, ROOM_H - 6, ROOM_W - 24, 6, '#221b28');
    // sortie
    R(ctx, DOOR_X - 30, ROOM_H - 14, 60, 10, '#5c432c');
    R(ctx, DOOR_X - 28, ROOM_H - 13, 56, 8, '#7b5a3a');
    for (let x = DOOR_X - 26; x < DOOR_X + 26; x += 5) R(ctx, x, ROOM_H - 12, 1, 6, '#9a7444');
    R(ctx, DOOR_X - 34, ROOM_H - 4, 68, 4, '#17121b');
    R(ctx, DOOR_X - 34, ROOM_H - 18, 4, 14, '#4a3423');
    R(ctx, DOOR_X + 30, ROOM_H - 18, 4, 14, '#4a3423');
    Art.drawText(ctx, 'SORTIE', DOOR_X, ROOM_H - 28, '#ffe0a0', 1, true, 'center');
    // poussière / usure
    for (let i = 0; i < 30; i++) {
      R(ctx, 16 + rng() * (ROOM_W - 32), WALL_H + 10 + rng() * 150, 2, 1, 'rgba(0,0,0,0.10)');
    }
  }

  /* ------------------------------------------------------------
     Construction d'une pièce
     ------------------------------------------------------------ */
  function addProp(props, solids, img, x, y, solidW, solidD) {
    const p = { img, x, y };
    props.push(p);
    if (solidW && solidD) {
      solids.push({ x1: x - solidW / 2, x2: x + solidW / 2, y1: y - solidD, y2: y - 2 });
    }
    return p;
  }

  function build(house) {
    const index = ((house.index || 0) % THEMES.length + THEMES.length) % THEMES.length;
    const theme = THEMES[index];
    const key = 'room:' + house.id + ':' + index;
    if (cache.has(key)) return cache.get(key);

    const seed = (U.hashString(house.id || ('house_' + index)) ^ (index * 7919)) >>> 0;
    const rng = U.mulberry32(seed);
    const bg = cvs(ROOM_W, ROOM_H);
    const ctx = bg.getContext('2d');
    drawFloor(ctx, theme, rng);
    drawWalls(ctx, theme, rng, seed);

    const props = [], solids = [], lights = [], lore = [];
    const add = (img, x, y, sw, sd) => addProp(props, solids, img, x, y, sw, sd);
    const wood = theme.wall.timber;
    const addLore = (x, y, name, lines, action) => {
      // On choisit le meuble le plus proche comme portrait de dialogue.
      let img = null, best = 1e9;
      for (const p of props) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < best) { best = d; img = p.img; }
      }
      lore.push({ kind: 'lore', x, y, name, lines, action: action || 'EXAMINER', img });
    };

    if (theme.id === 'herbes') {
      add(shelfSprite('jars', '#8a6a45', 'herbes'), 82, 128, 44, 46);
      add(shelfSprite('herbs', '#8a6a45', 'herbes2'), 304, 128, 44, 46);
      add(tableSprite('herbs', '#8a633d', null, 'herbes'), 148, 208, 40, 22);
      add(cauldronSprite('#86c46a'), 292, 216, 24, 18);
      add(plantSprite('#6f9a52'), 42, 240, 14, 10);
      add(plantSprite('#7fae5c'), 344, 240, 14, 10);
      add(Art.crate(), 116, 244, 18, 14);
      lights.push({ x: 292, y: 202, r: 82, color: '#9fe07a', seed: 1 });
      addLore(304, 150, 'Étagère d’herbes', theme.loreShelf, 'LIRE');
      addLore(292, 230, 'Chaudron', theme.loreCauldron, 'EXAMINER');
    } else if (theme.id === 'chasseur') {
      add(fireplaceSprite('#8f8778', wood), 192, 130, 52, 38);
      add(bedSprite('#8d5a3f', '#6b4a30', 'chasseur'), 64, 180, 32, 44);
      add(rackSprite(wood), 320, 180, 38, 40);
      add(tableSprite('map', '#7c5737', null, 'chasseur'), 140, 216, 40, 22);
      add(Art.crate(), 268, 242, 18, 14);
      add(Art.barrel(), 292, 238, 16, 16);
      lights.push({ x: 192, y: 112, r: 96, color: '#ffb667', seed: 2 });
      addLore(192, 144, 'Cheminée', theme.loreFire, 'EXAMINER');
      addLore(320, 194, 'Râtelier d’armes', theme.loreRack, 'EXAMINER');
    } else if (theme.id === 'tisserand') {
      add(loomSprite('#7a5a3a', '#7f9db4'), 90, 186, 44, 38);
      add(wardrobeSprite('#7a5a3a', '#b6715b'), 316, 174, 30, 50);
      add(shelfSprite('jars', '#8a6a45', 'tisserand'), 68, 128, 44, 46);
      add(tableSprite('fabrics', '#8a633d', '#b9c6ce', 'tisserand'), 220, 212, 40, 22);
      add(plantSprite('#6f9a52'), 344, 240, 14, 10);
      add(Art.barrel(), 148, 244, 16, 16);
      addLore(90, 200, 'Métier à tisser', theme.loreLoom, 'EXAMINER');
      addLore(316, 188, 'Armoire à étoffes', theme.loreWardrobe, 'EXAMINER');
    } else if (theme.id === 'savoir') {
      add(shelfSprite('books', '#7a5533', 'savoir1'), 76, 128, 44, 46);
      add(shelfSprite('books', '#7a5533', 'savoir2'), 140, 128, 44, 46);
      add(shelfSprite('books', '#7a5533', 'savoir3'), 310, 128, 44, 46);
      add(tableSprite('books', '#75502f', null, 'savoir'), 208, 210, 40, 22);
      add(chairSprite('#6b4a30', false), 166, 224, 0, 0);
      add(globeSprite(), 300, 216, 16, 14);
      add(plantSprite('#6f9a52'), 42, 240, 14, 10);
      addLore(140, 150, 'Rayonnages', theme.loreShelf, 'LIRE');
      addLore(208, 224, 'Bureau', theme.loreDesk, 'LIRE');
    } else if (theme.id === 'cuisine') {
      add(fireplaceSprite('#9b9381', wood), 192, 132, 52, 38);
      add(shelfSprite('jars', '#8a6a45', 'cuisine1'), 76, 128, 44, 46);
      add(shelfSprite('jars', '#8a6a45', 'cuisine2'), 308, 128, 44, 46);
      add(tableSprite('bread', '#8a633d', '#c8814e', 'cuisine'), 132, 216, 40, 22);
      add(cauldronSprite('#c9a45c'), 260, 206, 24, 18);
      add(sackSprite(), 302, 244, 18, 12);
      add(Art.crate(), 334, 244, 18, 14);
      lights.push({ x: 192, y: 114, r: 98, color: '#ffb35e', seed: 4 });
      addLore(192, 146, 'Âtre', theme.loreFire, 'EXAMINER');
      addLore(132, 230, 'Table du pain', theme.loreTable, 'EXAMINER');
    } else if (theme.id === 'musique') {
      add(bedSprite('#8f7ab4', '#6b4a30', 'musique'), 62, 180, 32, 44);
      add(luteSprite(), 316, 184, 14, 30);
      add(drumSprite(), 278, 240, 18, 12);
      add(tableSprite('music', '#7c5737', '#8f7ab4', 'musique'), 214, 212, 40, 22);
      add(chairSprite('#6b4a30', false), 170, 224, 0, 0);
      add(chairSprite('#6b4a30', true), 258, 224, 0, 0);
      add(plantSprite('#6f9a52'), 344, 240, 14, 10);
      addLore(316, 198, 'Luth', theme.loreLute, 'EXAMINER');
      addLore(278, 248, 'Tambour', theme.loreDrum, 'EXAMINER');
    } else if (theme.id === 'enfant') {
      add(bedSprite('#e0b45d', '#8a633d', 'enfant'), 64, 174, 32, 44);
      add(toyboxSprite(), 306, 220, 22, 14);
      add(tableSprite('toys', '#8a633d', null, 'enfant'), 156, 216, 40, 22);
      add(teddySprite(), 250, 242, 0, 0);
      add(Art.crate(), 344, 244, 18, 14);
      addLore(306, 234, 'Coffre à jouets', theme.loreToybox, 'EXAMINER');
      addLore(250, 248, 'Ours en peluche', theme.loreTeddy, 'EXAMINER');
    } else {
      add(bedSprite('#8f4a4a', '#5d432e', 'garde'), 60, 180, 32, 44);
      add(rackSprite('#5d432e'), 320, 178, 38, 40);
      add(tableSprite('map', '#747a7e', null, 'garde'), 152, 216, 40, 22);
      add(Art.crate(), 260, 244, 18, 14);
      add(Art.barrel(), 284, 240, 16, 16);
      addLore(320, 192, 'Râtelier de garde', theme.loreRack, 'EXAMINER');
      addLore(152, 230, 'Carte de la région', theme.loreTable, 'EXAMINER');
    }

    lore.unshift({ kind: 'exit', x: DOOR_X, y: DOOR_Y, name: 'Sortie', action: 'SORTIR' });

    const motes = [];
    for (let i = 0; i < 26; i++) {
      motes.push({
        x: 20 + rng() * (ROOM_W - 40),
        y: WALL_H + 12 + rng() * (ROOM_H - WALL_H - 24),
        phase: rng() * Math.PI * 2
      });
    }

    const room = {
      houseId: house.id,
      theme: theme.id,
      title: theme.title,
      short: theme.short,
      zoneId: house.zoneId || 'plains',
      bg, props, solids, lights, lore, motes,
      interactables: lore,
      spawn: { x: DOOR_X, y: 218 },
      exit: { x: DOOR_X, y: DOOR_Y },
      bounds: { x1: 14, y1: 66, x2: ROOM_W - 14, y2: ROOM_H - 5 }
    };
    cache.set(key, room);
    return room;
  }

  /* ------------------------------------------------------------
     Rendu
     ------------------------------------------------------------ */
  function drawLights(ctx, room, time) {
    room.lights.forEach(l => {
      const flicker = 0.9 + Math.sin(time * 5.2 + l.seed) * 0.055 + Math.sin(time * 11.7 + l.seed * 3) * 0.025;
      const sx = OX + l.x, sy = OY + l.y;
      const r = l.r * flicker;
      const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, r);
      g.addColorStop(0, U.rgba(l.color, 0.3));
      g.addColorStop(0.45, U.rgba(l.color, 0.13));
      g.addColorStop(1, U.rgba(l.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    });
  }

  function drawEmbers(ctx, room, time) {
    room.lights.forEach(l => {
      for (let i = 0; i < 6; i++) {
        const t = (time * 0.55 + i * 0.173 + l.seed * 0.13) % 1;
        const x = OX + l.x + Math.sin(time * 1.7 + i * 2.1 + l.seed) * 5;
        const y = OY + l.y + 4 - t * 30;
        ctx.globalAlpha = (1 - t) * 0.65;
        ctx.fillStyle = l.color;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        ctx.globalAlpha = 1;
      }
    });
  }

  /* ------------------------------------------------------------
     Déplacement et collisions dans une pièce
     ------------------------------------------------------------ */
  function canStand(room, x, y, footW, footH) {
    const x1 = x - footW / 2, x2 = x + footW / 2;
    const y1 = y - footH, y2 = y;
    if (x1 < room.bounds.x1 || x2 > room.bounds.x2) return false;
    if (y1 < room.bounds.y1 || y2 > room.bounds.y2) return false;
    for (let i = 0; i < room.solids.length; i++) {
      const s = room.solids[i];
      if (x2 > s.x1 && x1 < s.x2 && y2 > s.y1 && y1 < s.y2) return false;
    }
    return true;
  }

  Interiors.canStand = canStand;

  Interiors.move = function (room, e, dx, dy, footW, footH) {
    footW = footW || 10;
    footH = footH || 8;
    let moved = false;
    if (dx) {
      const nx = e.x + dx;
      if (canStand(room, nx, e.y, footW, footH)) {
        e.x = nx;
        moved = true;
      }
    }
    if (dy) {
      const ny = e.y + dy;
      if (canStand(room, e.x, ny, footW, footH)) {
        e.y = ny;
        moved = true;
      }
    }
    return moved;
  };

  Interiors.SCENE = { OX, OY, ROOM_W, ROOM_H, WALL_H, DOOR_X, DOOR_Y };
  Interiors.themes = THEMES;
  Interiors.create = build;

  Interiors.draw = function (ctx, game, time) {
    const room = game.interior;
    if (!room) return;
    const player = game.player;

    ctx.fillStyle = '#08070c';
    ctx.fillRect(0, 0, 640, 360);
    // halo extérieur très discret
    const halo = ctx.createRadialGradient(320, 180, 60, 320, 180, 330);
    halo.addColorStop(0, 'rgba(64,48,72,0.20)');
    halo.addColorStop(1, 'rgba(8,7,12,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, 640, 360);

    // ombre et cadre de la pièce
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(OX - 12, OY - 8, ROOM_W + 24, ROOM_H + 20);
    ctx.fillStyle = '#3a2b24';
    ctx.fillRect(OX - 6, OY - 6, ROOM_W + 12, ROOM_H + 12);
    ctx.fillStyle = '#1c151c';
    ctx.fillRect(OX - 3, OY - 3, ROOM_W + 6, ROOM_H + 6);
    ctx.drawImage(room.bg, OX, OY);

    drawLights(ctx, room, time);

    const drawables = [];
    room.props.forEach(p => drawables.push({ y: p.y, img: p.img, x: p.x }));
    if (player) {
      drawables.push({ y: player.y, draw: () => player.draw(ctx, -OX, -OY, time) });
    }
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) {
      if (d.draw) { d.draw(); continue; }
      const img = d.img;
      ctx.drawImage(img, OX + Math.round(d.x - img.width / 2), OY + Math.round(d.y - img.height));
    }

    drawEmbers(ctx, room, time);

    // poussière en suspension
    room.motes.forEach(m => {
      const x = OX + m.x + Math.sin(time * 0.35 + m.phase) * 7;
      const y = OY + m.y + Math.cos(time * 0.28 + m.phase * 1.3) * 5;
      ctx.globalAlpha = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(time * 0.9 + m.phase));
      ctx.fillStyle = '#ffe6b0';
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    });
    ctx.globalAlpha = 1;

    // vignette douce
    const vg = ctx.createRadialGradient(320, 176, 150, 320, 176, 390);
    vg.addColorStop(0, 'rgba(8,6,12,0)');
    vg.addColorStop(0.72, 'rgba(8,6,12,0.16)');
    vg.addColorStop(1, 'rgba(8,6,12,0.62)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 640, 360);
  };

  window.Interiors = Interiors;
})();
