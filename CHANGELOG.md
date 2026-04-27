# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Artist detail screen with cover art (via Deezer fallback), top songs, and discography
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
- `apiKeys.ts` pattern — git-ignored file keeps third-party keys out of the repo
- React Native 0.85 with New Architecture (Bridgeless) enabled

---

## [Unreleased]

### Planned for v1.0.0
- English UI translation
- Download tracks for offline playback
- Last.fm scrobbling
- Android Auto / CarPlay support
