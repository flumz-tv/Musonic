# Musonic

🌍 [Read in English](README.md) | **Français**

[![Licence : CC BY-NC 4.0](https://img.shields.io/badge/Licence-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/deed.fr)
[![React Native](https://img.shields.io/badge/React%20Native-0.85-61DAFB?logo=react)](https://reactnative.dev)

Un client Subsonic/Navidrome moderne et minimaliste, développé avec React Native.

> 🚧 **Note :** L'interface utilisateur est actuellement disponible **en français uniquement**. Le moteur d'internationalisation est en place et prêt — la traduction anglaise sera fournie dans la **v1.0.0**.

---

## Fonctionnalités

- **Lecteur musical complet** — lecteur plein écran, mini-lecteur, gestion de la file d'attente avec réorganisation par glisser-déposer
- **Gestion des playlists** — création, renommage, suppression et édition ; réorganisation des titres par glisser-déposer
- **Bibliothèque** — parcourir albums et playlists avec plusieurs options de tri
- **Écrans Artiste & Album** — pochette, titres populaires, discographie
- **Écran d'accueil** — filtres en pastilles (Récent, Fréquent, Recommandations, À découvrir)
- **Titres likés** — aimer/dé-liker des titres avec synchronisation hors-ligne
- **Recherche** — titres, artistes et albums
- **Tiroir de navigation animé** — menu latéral personnalisé
- **Prêt pour l'i18n** — toutes les chaînes de l'interface centralisées dans `src/i18n/fr.ts` ; remplacer l'import par un autre fichier de locale pour ajouter une langue
- **Résilience hors-ligne** — identifiants et préférences persistés via MMKV

---

## Prérequis

- Node >= 22.11.0 (voir `.nvmrc`)
- React Native 0.85 (New Architecture activée)
- Un serveur [Navidrome](https://www.navidrome.org/) ou tout serveur compatible Subsonic en cours d'exécution

---

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/your-username/musonic.git
cd musonic

# 2. Utiliser la bonne version de Node
nvm use

# 3. Installer les dépendances
npm install

# 4. Configurer les clés API (voir section Sécurité)
cp src/api/apiKeys.example.ts src/api/apiKeys.ts
# Éditer src/api/apiKeys.ts et renseigner vos clés

# 5. Android
npm run android

# 6. iOS (macOS uniquement)
bundle install
bundle exec pod install
npm run ios
```

---

## Sécurité

Les clés API (ex. Last.fm) ne sont **jamais commitées** dans le dépôt.

Un fichier modèle est fourni :

```
src/api/apiKeys.example.ts   ← commité, sans vraies clés
src/api/apiKeys.ts           ← ignoré par git, vos vraies clés
```

Copier le fichier exemple et renseigner vos identifiants avant de lancer l'application.

---

## Structure du projet

```
src/
├── api/            Client Subsonic, helpers d'URL, modèle de clés API
├── components/     Composants UI partagés (lecteur, sheets, icônes…)
├── hooks/          Hooks React personnalisés
├── i18n/           Fichiers de locale (fr.ts est la source de vérité)
├── navigation/     Navigateur à onglets, navigateurs en pile, types
├── screens/        Écrans complets (Accueil, Recherche, Bibliothèque…)
├── services/       Actions du lecteur, services en arrière-plan
├── store/          Stores Zustand (lecteur, paramètres)
└── utils/          Fonctions utilitaires pures
```

---

## Licence

Ce projet est distribué sous licence [CC BY-NC 4.0](LICENSE).  
Libre d'utilisation et d'adaptation à des fins personnelles et non commerciales.
