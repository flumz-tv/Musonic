# Musonic

🌍 **English** | [Lire en Français](#français)

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![React Native](https://img.shields.io/badge/React%20Native-0.85-61DAFB?logo=react)](https://reactnative.dev)
[![Version](https://img.shields.io/badge/version-0.9.1-orange)](https://github.com/DoodzProg/Musonic/releases)

A modern, Spotify-inspired Subsonic/Navidrome client built with React Native (New Architecture).  
Designed for OctoFiesta + Navidrome but compatible with any Subsonic-compatible server.

---

## Features

- **Full-screen player** — ambient halo background, swipeable cover carousel, waveform scrubber
- **Mini player** — sticky bottom bar with swipe-to-skip gesture
- **Queue management** — drag-and-drop reordering, remove, move-to-top
- **Playlist management** — create, rename, edit cover, delete; drag-and-drop track reordering
- **Library** — albums and playlists with sort options, pin support, pull-to-refresh
- **Artist & Album detail** — cover art, top songs, discography, artist photo
- **Home screen** — quick-access grid, filter pills (Recent, Frequent, Recommendations, Discover)
- **Liked Songs** — star/unstar with optimistic UI and offline retry
- **Search** — songs, artists, albums; Deezer artist images enriched asynchronously
- **Offline resilience** — credentials and preferences persisted via MMKV
- **i18n ready** — French and English UI strings; language switchable in Settings

---

## Requirements

| Tool | Version |
|------|---------|
| Node.js | ≥ 22.11.0 (see `.nvmrc`) |
| React Native | 0.85 (New Architecture / Fabric enabled) |
| JDK | 17 (Microsoft OpenJDK recommended) |
| Android SDK | 34 or 36 |
| NDK | 27.1 |
| Navidrome | any recent version (or OctoFiesta proxy) |

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/DoodzProg/Musonic.git
cd Musonic

# 2. Use the correct Node version
nvm use          # reads .nvmrc

# 3. Install JS dependencies
npm install

# 4. Configure API keys (see API Keys section)
cp src/api/apiKeys.example.ts src/api/apiKeys.ts
# Edit src/api/apiKeys.ts and fill in your Last.fm key

# 5. Run on Android (device or emulator)
adb reverse tcp:8081 tcp:8081
npm start -- --reset-cache   # Terminal 1 — Metro bundler
npm run android               # Terminal 2
```

### iOS (macOS only)

```bash
bundle install
cd ios && bundle exec pod install && cd ..
npm run ios
```

---

## Server Setup

### Standard Navidrome

Point Musonic at your Navidrome instance via **Settings → Server**:

```
Server URL : https://your-navidrome-domain.tld
Username   : your_navidrome_username
Password   : your_navidrome_password
```

No extra configuration required. All Subsonic API endpoints are used as-is.

### OctoFiesta (Navidrome + Deezer proxy)

[OctoFiesta](https://github.com/DoodzProg/octo-fiesta) is a Navidrome reverse-proxy that adds on-demand Deezer streaming via the Subsonic API. Configuration is identical:

```
Server URL : https://your-octofiesta-domain.tld
Username   : your_navidrome_username
Password   : your_navidrome_password
```

Musonic handles `ext-deezer:` prefixed IDs transparently — no client-side ID mangling needed. Cover art, artist images, and stream URLs all resolve correctly.

---

## Last.fm Configuration

Musonic uses Last.fm in two distinct ways:

### 1. Client-side — Artist images (temporary)

The Last.fm REST API is called directly from the client to fetch artist cover photos when Subsonic provides none. This requires a free Last.fm API key stored in `src/api/apiKeys.ts` (git-ignored).

> **Note:** This will be replaced by Deezer in v0.9.4 (no API key will be required).

To get a Last.fm API key:
1. Create a free account at [last.fm](https://www.last.fm)
2. Go to [https://www.last.fm/api/account/create](https://www.last.fm/api/account/create)
3. Copy the **API key** and paste it into `src/api/apiKeys.ts`:

```typescript
export const LASTFM_API_KEY = 'your_api_key_here';
```

### 2. Server-side — Recommendations (Navidrome admin config)

The Recommendations feature (v0.10.0) uses `getSimilarSongs2` from the Subsonic API, which internally calls Last.fm. This does **not** require a client-side API key — it must be configured **once** on the Navidrome server by an admin:

1. Log in to Navidrome admin UI (`/app`)
2. Go to **Settings → External Integrations**
3. Enter your Last.fm API key and secret
4. Save — Navidrome will now scrobble plays and fetch similar-song data

---

## API Keys

| Key | Where | Purpose | Required |
|-----|-------|---------|----------|
| `LASTFM_API_KEY` | `src/api/apiKeys.ts` | Artist cover images (client) | Optional (images fall back to initials) |

```
src/api/apiKeys.example.ts   ← committed, template only, no real keys
src/api/apiKeys.ts           ← git-ignored, your actual keys
```

---

## Build — Signed Android APK

```bash
# 1. Ensure keystore is configured
# android/keystore.properties must reference your keystore file (git-ignored)

# 2. Build release APK
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

> The keystore file (`android/app/musonic-release.keystore`) and `android/keystore.properties` are git-ignored. Keep a secure backup.

---

## Project Structure

```
src/
├── api/
│   ├── client.ts          Subsonic axios client, URL helpers
│   ├── types.ts           TypeScript type definitions
│   ├── lastfm.ts          Last.fm artist-image helper (→ Deezer in v0.9.4)
│   ├── apiKeys.example.ts API key template (copy → apiKeys.ts)
│   └── endpoints/
│       ├── library.ts     getRecentAlbums, getStarred, star/unstar, similar songs
│       ├── playlists.ts   CRUD playlist operations
│       └── search.ts      search() + Deezer async image enrichment
├── components/            Shared UI (player, sheets, icons, cards…)
├── hooks/                 useSetupPlayer, useImageColor
├── i18n/                  fr.ts (source of truth) + en.ts + index.ts hook
├── navigation/            RootNavigator, TabNavigator, stacks, type definitions
├── screens/               Home, Search, Library, AlbumDetail, ArtistDetail,
│                          PlaylistDetail, LikedSongs, Settings, ServerSetup
├── services/              PlaybackService (headless), playerActions, connectivity
├── store/                 Zustand stores: player, settings, network, search history,
│                          playlist membership cache
├── theme/                 Design tokens, dark theme object
└── utils/                 colorUtils (hex blending, ID-to-colour mapping)
```

---

## Architecture Notes

### Audio Engine
React Native Track Player 4.1.2, patched for New Architecture (37 `scope.launch` fixes). `playerStore` is the UI source of truth; RNTP is the audio source of truth. `AudioPlayer.tsx` bridges RNTP events → store.

### Drawer Navigation
`@react-navigation/drawer` is **not used directly** — it caused a `WorkletsError` with react-native-reanimated v4. A custom `DrawerContainer` (React context + `Animated`) replaces it. `react-native-reanimated/plugin` must remain **last** in `babel.config.js`.

### Playlist Orange Indicator
Songs turn orange only when they are playing **in the context of the open playlist** (checked via `currentPlaylistId`). Playing from album/search/liked-songs correctly clears the playlist context. Duplicate songs in a playlist are disambiguated by **RNTP track index**, not by song ID.

### New Architecture
`newArchEnabled=true` is required in `gradle.properties`. `UIManager.setLayoutAnimationEnabledExperimental` must not be called (Fabric incompatible).

---

## License

This project is licensed under the [CC BY-NC 4.0](LICENSE) license.  
Free to use and adapt for personal, non-commercial purposes. Commercial use is prohibited.

---

---

# Français

🌍 [Read in English](#musonic) | **Français**

Client Subsonic/Navidrome moderne et minimaliste, inspiré de Spotify, développé avec React Native (New Architecture).  
Conçu pour OctoFiesta + Navidrome, mais compatible avec tout serveur compatible Subsonic.

---

## Fonctionnalités

- **Lecteur plein écran** — fond ambiant, carousel de pochettes, scrubber waveform
- **Mini-lecteur** — barre sticky avec geste swipe-to-skip
- **File d'attente** — réorganisation drag-and-drop, suppression, monter en tête
- **Gestion des playlists** — créer, renommer, modifier la pochette, supprimer ; réorganisation drag-and-drop
- **Bibliothèque** — albums et playlists avec tri, épinglage, pull-to-refresh
- **Détail Artiste & Album** — pochette, titres populaires, discographie, photo artiste
- **Accueil** — grille d'accès rapide, filtres (Récent, Fréquent, Recommandations, À découvrir)
- **Titres likés** — aimer/dé-liker avec UI optimiste et retry hors-ligne
- **Recherche** — titres, artistes, albums ; images artiste Deezer enrichies de façon asynchrone
- **Résilience hors-ligne** — identifiants et préférences persistés via MMKV
- **i18n** — français et anglais ; langue changeante dans les Paramètres

---

## Prérequis

| Outil | Version |
|-------|---------|
| Node.js | ≥ 22.11.0 (voir `.nvmrc`) |
| React Native | 0.85 (New Architecture / Fabric activée) |
| JDK | 17 (Microsoft OpenJDK recommandé) |
| Android SDK | 34 ou 36 |
| NDK | 27.1 |
| Navidrome | toute version récente (ou proxy OctoFiesta) |

---

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/DoodzProg/Musonic.git
cd Musonic

# 2. Utiliser la bonne version de Node
nvm use

# 3. Installer les dépendances JS
npm install

# 4. Configurer les clés API (voir section Clés API)
cp src/api/apiKeys.example.ts src/api/apiKeys.ts
# Éditer src/api/apiKeys.ts et renseigner votre clé Last.fm

# 5. Lancer sur Android (appareil ou émulateur)
adb reverse tcp:8081 tcp:8081
npm start -- --reset-cache   # Terminal 1 — Metro bundler
npm run android               # Terminal 2
```

### iOS (macOS uniquement)

```bash
bundle install
cd ios && bundle exec pod install && cd ..
npm run ios
```

---

## Configuration serveur

### Navidrome standard

Configurer Musonic via **Paramètres → Serveur** :

```
URL du serveur : https://votre-domaine-navidrome.tld
Nom d'utilisateur : votre_utilisateur_navidrome
Mot de passe : votre_mot_de_passe_navidrome
```

### OctoFiesta (proxy Navidrome + Deezer)

[OctoFiesta](https://github.com/DoodzProg/octo-fiesta) est un reverse-proxy Navidrome qui ajoute le streaming Deezer à la demande via l'API Subsonic. La configuration est identique :

```
URL du serveur : https://votre-domaine-octofiesta.tld
Nom d'utilisateur : votre_utilisateur_navidrome
Mot de passe : votre_mot_de_passe_navidrome
```

Les IDs préfixés `ext-deezer:` sont gérés de façon transparente — aucune manipulation côté client.

---

## Configuration Last.fm

### 1. Côté client — Images artiste (temporaire)

L'API REST Last.fm est appelée depuis le client pour récupérer les photos d'artiste quand Subsonic n'en fournit pas. Nécessite une clé API Last.fm gratuite dans `src/api/apiKeys.ts` (ignoré par git).

> **Note :** Sera remplacé par Deezer dans la v0.9.4 (aucune clé API ne sera nécessaire).

Pour obtenir une clé API Last.fm :
1. Créer un compte gratuit sur [last.fm](https://www.last.fm)
2. Aller sur [https://www.last.fm/api/account/create](https://www.last.fm/api/account/create)
3. Copier la **clé API** et la coller dans `src/api/apiKeys.ts` :

```typescript
export const LASTFM_API_KEY = 'votre_cle_api_ici';
```

### 2. Côté serveur — Recommandations (config admin Navidrome)

La fonctionnalité de recommandations (v0.10.0) utilise `getSimilarSongs2` de l'API Subsonic, qui interroge Last.fm en interne. Cela ne nécessite **pas** de clé côté client — à configurer **une fois** sur le serveur Navidrome par un administrateur :

1. Se connecter à l'UI admin Navidrome (`/app`)
2. Aller dans **Paramètres → Intégrations externes**
3. Renseigner votre clé API et secret Last.fm
4. Sauvegarder — Navidrome scrobblera les lectures et récupérera les données de titres similaires

---

## Clés API

| Clé | Emplacement | Utilité | Obligatoire |
|-----|-------------|---------|-------------|
| `LASTFM_API_KEY` | `src/api/apiKeys.ts` | Images artiste (client) | Non (repli sur initiales) |

```
src/api/apiKeys.example.ts   ← commité, modèle uniquement, sans vraies clés
src/api/apiKeys.ts           ← ignoré par git, vos vraies clés
```

---

## Build — APK Android signé

```bash
# 1. Vérifier que le keystore est configuré
# android/keystore.properties doit référencer votre fichier keystore (ignoré par git)

# 2. Construire l'APK release
cd android
./gradlew assembleRelease

# Résultat : android/app/build/outputs/apk/release/app-release.apk
```

> Le fichier keystore (`android/app/musonic-release.keystore`) et `android/keystore.properties` sont ignorés par git. Faites-en une sauvegarde sécurisée.

---

## Structure du projet

```
src/
├── api/
│   ├── client.ts          Client axios Subsonic, helpers URL
│   ├── types.ts           Définitions de types TypeScript
│   ├── lastfm.ts          Helper images artiste Last.fm (→ Deezer en v0.9.4)
│   ├── apiKeys.example.ts Modèle de clés API (copier → apiKeys.ts)
│   └── endpoints/
│       ├── library.ts     getRecentAlbums, getStarred, star/unstar, titres similaires
│       ├── playlists.ts   Opérations CRUD playlists
│       └── search.ts      search() + enrichissement images Deezer asynchrone
├── components/            UI partagée (lecteur, sheets, icônes, cartes…)
├── hooks/                 useSetupPlayer, useImageColor
├── i18n/                  fr.ts (source de vérité) + en.ts + hook index.ts
├── navigation/            RootNavigator, TabNavigator, stacks, types
├── screens/               Home, Search, Library, AlbumDetail, ArtistDetail,
│                          PlaylistDetail, LikedSongs, Settings, ServerSetup
├── services/              PlaybackService (headless), playerActions, connectivité
├── store/                 Stores Zustand : lecteur, paramètres, réseau,
│                          historique de recherche, cache d'appartenance playlist
├── theme/                 Design tokens, objet dark theme
└── utils/                 colorUtils (mélange hex, mapping ID → couleur)
```

---

## Licence

Ce projet est distribué sous licence [CC BY-NC 4.0](LICENSE).  
Libre d'utilisation et d'adaptation à des fins personnelles et non commerciales. Tout usage commercial est interdit.
