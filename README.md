# Musonic

🌍 **English** | [Lire en Français](README.fr.md)

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![React Native](https://img.shields.io/badge/React%20Native-0.85-61DAFB?logo=react)](https://reactnative.dev)

A modern, minimalist Subsonic/Navidrome client built with React Native.

> 🚧 **Note:** The user interface is currently available in **French only**. The i18n engine is in place and ready — English translation will be provided in **v1.0.0**.

---

## Features

- **Full music player** — full-screen player, mini player, queue management with drag & drop reordering
- **Playlist management** — create, rename, delete, and edit playlists; drag & drop track reordering
- **Library** — browse albums and playlists with multiple sort options
- **Artist & Album detail screens** — cover art, top songs, discography
- **Home screen** — filter pills (Recent, Frequent, Recommendations, Discover)
- **Liked Songs** — star/unstar tracks with offline retry
- **Search** — songs, artists, and albums
- **Custom slide-in drawer** — animated side navigation
- **i18n-ready** — all UI strings centralised in `src/i18n/fr.ts`; swap the import for another locale file to add a new language
- **Offline resilience** — credentials and preferences persisted via MMKV

---

## Requirements

- Node >= 22.11.0 (see `.nvmrc`)
- React Native 0.85 (New Architecture enabled)
- A running [Navidrome](https://www.navidrome.org/) or any Subsonic-compatible server

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/musonic.git
cd musonic

# 2. Use the correct Node version
nvm use

# 3. Install dependencies
npm install

# 4. Set up your API keys (see Security section below)
cp src/api/apiKeys.example.ts src/api/apiKeys.ts
# Edit src/api/apiKeys.ts and fill in your keys

# 5. Android
npm run android

# 6. iOS (macOS only)
bundle install
bundle exec pod install
npm run ios
```

---

## Security

API keys (e.g. Last.fm) are **never committed** to the repository.

A template file is provided:

```
src/api/apiKeys.example.ts   ← committed, no real keys
src/api/apiKeys.ts           ← git-ignored, your actual keys
```

Copy the example file and fill in your credentials before running the app.

---

## Project Structure

```
src/
├── api/            Subsonic client, URL helpers, API key template
├── components/     Shared UI components (player, sheets, icons…)
├── hooks/          Custom React hooks
├── i18n/           Locale files (fr.ts is the single source of truth)
├── navigation/     Tab navigator, stack navigators, type definitions
├── screens/        Full screens (Home, Search, Library, ArtistDetail…)
├── services/       Player actions, background services
├── store/          Zustand stores (player, settings)
└── utils/          Pure utility functions
```

---

## License

This project is licensed under the [CC BY-NC 4.0](LICENSE) license.  
Free to use and adapt for personal, non-commercial purposes.
