# Les Légendes d'Aurore

RPG d'action en vue de dessus, en pixel art, jouable dans le navigateur. Tout le monde, les personnages, les monstres et la musique sont générés procéduralement : aucun asset externe n'est téléchargé.

## Jouer

**https://mathiasmerle1-cmd.github.io/legendes-aurore/**

Le jeu fonctionne hors ligne une fois la page chargée. La sauvegarde est stockée dans le navigateur (`localStorage`).

## Commandes

| Touche | Action |
| --- | --- |
| ZQSD / flèches | Se déplacer |
| J / Espace / clic | Attaquer |
| K / Maj | Esquiver |
| H | Potion |
| E / Entrée | Interagir |
| I / Tab | Inventaire et équipement |
| L | Journal des quêtes |
| M | Carte du monde (clic : poser un repère, clic droit : l'effacer) |
| Échap | Pause |
| N | Couper la musique |

## Contenu

- Monde ouvert de 480 × 480 tuiles, 6 biomes.
- Carte détaillée avec relief, courbes de niveau, côtes, routes, brume de guerre persistante et texturée, infobulles de lieux et fil d'Ariane vers la quête suivie.
- Repère personnel posé d'un clic sur la carte, avec boussole et distance dans le HUD ; clic droit pour l'effacer.
- Villages et avant-postes sûrs, 12 coffres répartis dans les camps, bâtiments aux collisions précises.
- 7 maisons entièrement meublées : un intérieur unique par maison, avec 12 à 15 meubles, éclairage d'ambiance et objets à examiner.
- Faune procédurale propre à chaque biome : oiseaux, papillons, écureuils, lapins, renards, lézards, grenouilles, lucioles et libellules, qui fuient le joueur sans jamais engager le combat.
- Flore variée : fleurs par biome, hautes herbes, buissons à baies, rondins, nénuphars, galets, champignons lumineux et bouleaux.
- 3 classes, 6 origines et un éditeur de personnage complet : 14 teints, 15 coiffures, 21 couleurs de cheveux, 12 iris, 5 barbes, 4 marques, 3 silhouettes, 4 tenues, 16 accessoires et 8 auras persistantes, avec aperçu animé et nom aléatoire.
- Monstres nivelés, élites, mini-boss et 6 Gardiens de biome, boss final Nyx.
- 8 quêtes principales et 16 quêtes annexes, journal de quêtes sur `L`.
- Matériaux de monstre, amélioration à la forge, vendeurs spécialisés, sanctuaires, sauvegarde locale.
- Rendu procédural : transitions de biomes par dithering, eau et lave animées, écume sur les rives, végétation qui ondule, ombres de nuages, ambiances propres à chaque terre (rayons de forêt, brume des marais, chaleur du désert, givre de la toundra, lueur volcanique) et colorimétrie par biome.

## Développement

Site 100 % statique, sans dépendance ni build :

```powershell
python -m http.server 8123 --bind 127.0.0.1
```

Puis ouvrir `http://127.0.0.1:8123/`.

## Déploiement

Le site est publié automatiquement par GitHub Pages depuis la branche `main` à chaque `git push`.
