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
| L | Journal (quêtes, bestiaire, succès) |
| M | Carte du monde |
| Échap | Pause |
| N | Couper la musique |

## Contenu

- Monde ouvert de 240 × 240 tuiles, 6 biomes.
- Villages et avant-postes sûrs, 12 coffres répartis dans les camps.
- 3 classes, éditeur de personnage, origines, équipement sur 5 slots.
- Monstres nivelés, élites, mini-boss et 6 Gardiens de biome, boss final Nyx.
- Quêtes principales et secondaires, bestiaire, succès.
- Fabrication, amélioration, vendeurs, sanctuaires, sauvegarde locale.

## Développement

Site 100 % statique, sans dépendance ni build :

```powershell
python -m http.server 8123 --bind 127.0.0.1
```

Puis ouvrir `http://127.0.0.1:8123/`.

## Déploiement

Le site est publié automatiquement par GitHub Pages depuis la branche `main` à chaque `git push`.
