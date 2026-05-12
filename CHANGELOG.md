# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-05-12

### Added
- **Offline mode (Beta)** — manual toggle or auto-detected via connectivity ping; settings store, offline banner, Library and PlaylistDetail adapt to offline state
- **Playlist caching** — `playlistCacheStore` persists playlist metadata and songs for offline access; download progress tracked per track
- **Track downloads** — per-track and per-playlist download to device local storage (Navidrome-indexed tracks only); MMKV-backed persistence survives app restarts
- **Download management** — delete individual downloads or full playlist batches via native confirmation dialogs across FSP, PlaylistDetail, AlbumDetail, and Library screens
- **Storage indicator** in drawer — shows total downloaded music size (Musonic usage only, in Ko/Mo/Go)
- **Autoplay** — automatic queue extension with Deezer + Navidrome similar tracks when queue ends; lock mechanism prevents parallel fetches
- **Shuffle Magic** — genre-aware third shuffle state; inserts Deezer recommendations interleaved with Navidrome tracks; isMagic flag preserved across RNTP queue operations
- **Deezer Recommendations** — Home (album cards), Search Discover (6 sections), PlaylistDetail footer, and ArtistDetail "Dans le même style" section
- **Lucide icon redesign** — all tab icons and action icons replaced with Lucide-sourced SVG variants; mask-based `TrackMagicIcon` and `CheckCircleGreenIcon` added

### Changed
- **Performance** — React.memo on QueueRow, FlashList for long lists, lazy RNTP track insertion (deferred to play time), Set-based selectedIds for edit mode
- **Reanimated migration** — SongOptionsSheet, AlbumOptionsSheet, PlaylistOptionsSheet, AddToPlaylistSheet ported to Reanimated; GestureDetector replaces PanResponder in QueueSheet, DrawerContainer, MiniPlayer, AddToPlaylistSheet handle
- **HTTP client** — `axios` removed; all API calls use native `fetch` with `AbortController` and `URLSearchParams`
- **Deezer in-memory cache** — Promise-based `artistCache` and `albumCache` prevent redundant Deezer lookups within a session
- **Audio Focus** — `RemoteDuck` handler captures playing state before ducking; only resumes if was actually playing (fixes auto-resume after alarm / Instagram / voice assistant)
- **SVG consolidation** — 22 icon components in `src/components/icons/`; inline SVG functions removed from 8 source files

### Removed
- **Dead dependencies** — `react-native-video`, `flash-list`, worklets conflict packages, `@react-native-community/new-app-screen`
- **FSP cover carousel** — swipe gesture and 3-slot carousel removed (Android `<Modal>` + RNGH incompatibility); single `CoverArt` retained with adjacent-track prefetch
- **`axios`** — replaced by native `fetch`

### Known Limitations
- **iOS audio background**: audio cuts when app is backgrounded — `UIBackgroundModes: audio` missing from `Info.plist`
- **iOS Dynamic Island**: `GlobalHeader` uses no safe-area insets; header partially hidden on notched devices
- **FSP swipe**: unavailable on Android due to RNGH + `<Modal>` incompatibility; may be revisited post-v1.0.0
- iOS build is unsigned — install via AltStore or Sideloadly; no App Store distribution planned

---

## [0.9.5] - 2026-05-08

### Added
- **Deezer recommendations in Search** — Discover tab with 6 sections: albums from liked songs, tracks from liked songs, albums from recent listens, 3 "same style" sub-sections each with artist sub-heading, horizontal album row, and track list
- **Deezer recommendations in PlaylistDetail** — footer section fetches top tracks from top 3 playlist artists; single tap plays via OctoFiesta, `+` adds to playlist
- **Deezer recommendations in Home** — Recommendations section now shows Deezer album cards from recent listened artists
- **Deezer recommendations in ArtistDetail** — "Dans le même style" section below Popular Releases; 6 related artists → enrich → deduped album cards
- **Shuffle Magic** — 3-state shuffle cycle (off → on → magic); Magic mode inserts genre-aware Deezer + Navidrome tracks into the queue
- **Autoplay** — automatic similar-track queue extension triggered by PlaybackService on last track

### Fixed
- **Audio Focus** — music no longer auto-resumes after interruptions (Instagram, alarm, Google voice) when it was paused before the interruption

### Changed
- **ArtistDetail top songs** — CoverArt added per song row; index column left-aligned

---

## [0.9.4] - 2026-05-06

### Added
- **Deezer public API** — artist images now fetched via `api.deezer.com/search/artist` (no API key required)
- **CI/CD GitHub Actions** — `android-release.yml` builds a signed release APK on tag push; `ios-release.yml` builds an unsigned IPA for sideloading (AltStore / Sideloadly)
- **Release keystore** — `musonic-release.keystore` (PKCS12, RSA 2048, 10 000 days); keystore path + credentials wired into `android/keystore.properties` and `build.gradle` signing config
- **Screenshots** — 13 S21 Ultra screenshots added to `docs/assets/img/screenshots/` and embedded in README

### Changed
- **Version bump** — `package.json` and `android/app/build.gradle` updated to `1.0.0` (versionCode 11)
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
