# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.9.4] - 2026-05-06

### Added
- **Deezer public API** — artist images now fetched via `api.deezer.com/search/artist` (no API key required)
- **CI/CD GitHub Actions** — `android-release.yml` builds a signed release APK on tag push; `ios-release.yml` builds an unsigned IPA for sideloading (AltStore / Sideloadly)
- **Release keystore** — `musonic-release.keystore` (PKCS12, RSA 2048, 10 000 days); keystore path + credentials wired into `android/keystore.properties` and `build.gradle` signing config
- **Screenshots** — 13 S21 Ultra screenshots added to `docs/assets/img/screenshots/` and embedded in README

### Changed
- **Version bump** — `package.json` and `android/app/build.gradle` updated to `0.9.4` (versionCode 11)
- **README** — Last.fm section removed; Deezer integration documented; CI/CD section added; JDK requirement updated to 21; screenshots section added
- **CI workflow** — `android-release.yml` fixed: JDK 17 → 21, keystore filename aligned, `keystore.properties` now written from secrets at build time so Gradle signing config resolves correctly

### Removed
- **Last.fm integration** — `src/api/lastfm.ts` deleted; `LASTFM_API_KEY` removed from `apiKeys.example.ts`; all imports replaced by `src/api/deezer.ts`

---

## [0.9.1] - 2026-05-01

### Fixed
- Playlist bug fixes and artist navigation improvements
- Global documentation pass

---

## [0.9.0] - 2026-04-30

### Added
- Full-text search across songs, artists, and albums
- Offline resilience improvements
- i18n EN/FR support
- CI/CD skeleton

---

## [0.8.0] - 2026-04-27

### Added

#### Player
- Full-screen music player with animated cover art, waveform/classic progress bar toggle
- Mini player with swipe-to-dismiss gesture
- Queue sheet with drag & drop track reordering
- Crossfade support and configurable audio transitions
- Repeat (off / all / one) and shuffle modes
- Like/unlike tracks directly from the player with offline retry queue

#### Playlists
- Create, rename, and delete playlists
- Full playlist editor with drag & drop reordering
- Contextual song options sheet (add to queue, go to album/artist, remove from playlist)
- Add to playlist sheet with inline playlist creation
- Playlist recommendations based on current tracks

#### Library & Browse
- Library screen with albums, playlists, and Liked Songs sections
- Sort options: recently played, recently added, alphabetical, custom
- Liked Songs screen with full song list and playback
- Artist detail screen with cover art, top songs, and discography
- Album detail screen with dominant-color gradient, track listing, and star/unstar

#### Home
- Home screen with filter pills: All, Recent, Frequent, Recommendations, Discover
- Recently played and frequently played sections

#### Search
- Full-text search across songs, artists, and albums
- Dedicated search result screen with grouped sections

#### Navigation & UI
- Bottom tab navigator (Home, Search, Library)
- Animated slide-in drawer for account/settings access
- Settings screen with player style, crossfade duration, mono audio, and rotation lock options
- Offline connectivity banner

#### Infrastructure
- i18n engine: all user-facing strings centralised in `src/i18n/fr.ts`
- MMKV-based persistence for credentials and preferences
- React Native 0.85 with New Architecture (Bridgeless) enabled
