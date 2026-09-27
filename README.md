# La Plagne 3D - Next.js

Visualisation cartographique 3D interactive haute performance du domaine et du relief montagneux de **La Plagne** (massif de la Vanoise, Savoie, France).

## 🏔️ Caractéristiques 3D & Données en ligne

- **Moteur 3D** : [MapLibre GL JS](https://maplibre.org/) avec WebGL et maillage de relief numérique (DEM) en temps réel.
- **Modèle Numérique de Terrain (DEM)** : Tuiles d'élévation AWS Open Data Terrarium (haute précision pour les Alpes françaises).
- **Fournisseurs d'imagerie au choix** :
  - **Satellite HD** : Esri World Imagery (haute résolution avec sommets enneigés, crêtes et glaciers).
  - **IGN France** : BD ORTHO® Géoplateforme France (photographies aériennes officielles).
  - **Topographique** : OpenTopoMap / OpenStreetMap (lignes de niveau et sentiers).
- **Fonctionnalités** :
  - Navigation 3D libre : inclinaison, rotation, altitude, zoom.
  - Raccourcis sommets & stations (Sommet de Bellecôte 3 417 m, Roche de Mio 2 739 m, Plagne Centre, Belle Plagne, Champagny, etc.).
  - Mode vol orbite 360° automatique.
  - Réglage de l'exagération du relief (1.0x à 1.8x).
  - Coordonnées géographiques en direct.

## 🚀 Lancement

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🕹️ Contrôles 3D
- **Clic gauche + glisser** : Déplacer la carte
- **Clic droit + glisser** ou **Ctrl + Clic gauche** : Incliner la vue 3D et tourner autour des montagnes
- **Molette** : Zoomer / dézoomer
