/**
 * @file en.ts
 * @description English UI strings. Mirrors the structure of fr.ts exactly.
 *   Swap the active locale in i18n/index.ts to enable English.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
export const en = {

  // ─── Common ────────────────────────────────────────────────────────────────
  common: {
    retry: 'Retry',
  },

  // ─── Server Setup ──────────────────────────────────────────────────────────
  serverSetup: {
    appName: 'Musonic',
    subtitle: 'Connect your Subsonic server',
    serverNameLabel: 'Server name',
    serverNamePlaceholder: 'My server',
    serverUrlLabel: 'Server URL',
    serverUrlPlaceholder: 'https://music.example.com',
    usernameLabel: 'Username',
    usernamePlaceholder: 'admin',
    passwordLabel: 'Password',
    connectButton: 'Connect',
    successMessage: '✓ Connected! Loading...',
    missingFieldsTitle: 'Missing fields',
    missingFieldsBody: 'URL, username and password are required.',
    errors: {
      wrongCredentials: 'Wrong username or password',
      clientError: (code: number) => `Client error (${code}) — check the URL`,
      serverError: (code: number) => `Server error (${code}) — server is down`,
      timeout: 'Connection timed out',
      unreachable: 'Server not found — check the URL',
      generic: 'Unable to connect',
    },
  },

  // ─── Tab Bar ───────────────────────────────────────────────────────────────
  tabs: {
    home: 'Home',
    search: 'Search',
    library: 'Library',
  },

  // ─── Drawer / Navigation ───────────────────────────────────────────────────
  drawer: {
    settings: 'Settings',
    logout: 'Log out',
    logoutTitle: 'Log out',
    logoutMessage: (name: string, url: string) =>
      `Log out of:\n\n${name}\n${url}`,
    logoutConfirm: 'Log out',
    cancelButton: 'Cancel',
  },

  // ─── Home ──────────────────────────────────────────────────────────────────
  home: {
    likedSongs: 'Liked Songs',
    unknownTitle: 'Unknown title',
    unknownArtist: 'Unknown artist',
    loadError: 'Could not load home',
    typeSingle: 'Single',
    typeAlbum: 'Album',
    filters: {
      all: 'All',
      recent: 'Recent',
      frequent: 'Frequent',
      reco: 'Picks',
      discover: 'Discover',
    },
    sections: {
      recentlyPlayed: 'Recently played',
      frequentlyPlayed: 'Played often',
      recommendations: 'Recommendations',
      discover: 'Discover',
    },
  },

  // ─── Search ────────────────────────────────────────────────────────────────
  search: {
    headerTitle: 'Search',
    placeholder: 'What do you want to listen to?',
    browseAll: 'Browse all',
    trackType: 'Track',
    artistType: 'Artist',
    albumType: 'Album',
    noResults: (q: string) => `No results for "${q}"`,
    sections: {
      songs: 'Songs',
      artists: 'Artists',
      albums: 'Albums',
    },
    history: {
      title: 'Recent searches',
      clear: 'Clear',
    },
  },

  // ─── Library ───────────────────────────────────────────────────────────────
  library: {
    title: 'Library',
    sortTitle: 'Sort by',
    emptyState: 'Nothing here yet',
    loadError: 'Could not load library',
    likedTrackCount: (n: number) => `${n} liked song${n !== 1 ? 's' : ''}`,
    sort: {
      recent: 'Recent',
      added: 'Recently added',
      alpha: 'Alphabetical',
      custom: 'Custom',
    },
  },

  // ─── Liked Songs ───────────────────────────────────────────────────────────
  likedSongs: {
    title: 'Liked Songs',
    emptyState: 'No liked songs yet',
    trackCount: (n: number) => `${n} song${n !== 1 ? 's' : ''}`,
  },

  // ─── Playlist Detail ───────────────────────────────────────────────────────
  playlistDetail: {
    owner: 'Doodz',
    trackCount: (n: number) => `${n} song${n !== 1 ? 's' : ''}`,
    contextLabel: 'PLAYING FROM PLAYLIST',
    searchPlaceholder: 'Search this page',
    pills: {
      edit: 'Edit',
      sort: 'Sort',
      info: 'Name & info',
    },
    comingSoon: 'Coming soon',
    editHeader: 'Edit playlist',
    saveButton: 'Save',
    savedToast: 'Playlist updated',
    saveError: 'Error saving playlist',
    recommendations: {
      title: 'Suggested tracks',
      subtitle: 'Based on this playlist',
    },
  },

  // ─── Song Options Sheet ────────────────────────────────────────────────────
  songOptions: {
    addToPlaylist: 'Add to playlist',
    removeFromPlaylist: 'Remove from playlist',
    addToQueue: 'Add to queue',
    goToAlbum: 'Go to album',
    goToArtist: 'Go to artist',
    addedToQueue: 'Added to queue',
    removedFromPlaylist: 'Removed from playlist',
    addToLiked: 'Add to Liked Songs',
    removeFromLiked: 'Remove from Liked Songs',
    manageInPlaylists: 'Manage in playlists',
    addError: 'Error adding track',
    removeError: 'Error removing track',
  },

  // ─── Playlist Options Sheet ────────────────────────────────────────────────
  playlistOptions: {
    addToQueue: 'Add to queue',
    download: 'Download',
    pin: 'Pin playlist',
    unpin: 'Unpin playlist',
    rename: 'Rename playlist',
    delete: 'Delete playlist',
    pinnedToast: 'Playlist pinned',
    unpinnedToast: 'Playlist unpinned',
    renamedToast: 'Playlist renamed',
    deletedToast: 'Playlist deleted',
    queuedToast: (n: number) => `${n} song${n !== 1 ? 's' : ''} added to queue`,
    deleteTitle: 'Delete playlist',
    deleteMessage: (name: string) => `Delete "${name}" permanently?`,
    deleteConfirm: 'Delete',
    cancelButton: 'Cancel',
    byYou: 'by You',
    trackCount: (n: number) => `${n} song${n !== 1 ? 's' : ''}`,
    queueError: 'Error adding to queue',
    renameError: 'Error renaming playlist',
    deleteError: 'Error deleting playlist',
    comingSoon: 'Coming soon',
    editPlaylist: 'Edit playlist',
    nameAndInfo: 'Name & info',
    editCover: 'Edit cover',
    addAllToPlaylist: 'Add to another playlist',
    addedAllToPlaylist: (n: number, name: string) => `${n} song${n !== 1 ? 's' : ''} added to ${name}`,
    addToPlaylistError: 'Error adding to playlist',
  },

  // ─── Rename Modal ──────────────────────────────────────────────────────────
  renameModal: {
    title: 'Rename playlist',
    cancelButton: 'Cancel',
    confirmButton: 'Rename',
  },

  // ─── Playlist Info Modal ──────────────────────────────────────────────────
  playlistInfo: {
    title: 'Name & info',
    cancel: 'Cancel',
    save: 'Save',
    nameLabel: 'Playlist title',
    namePlaceholder: 'Playlist name',
    descriptionPlaceholder: 'Description (optional)',
    deletePlaylist: 'Delete playlist',
    deleteTitle: 'Delete playlist?',
    deleteMessage: (name: string) => `Delete "${name}" permanently?`,
    deleteConfirm: 'Delete',
    deleteCancel: 'Cancel',
    saved: 'Info saved',
    saveError: 'Error saving info',
    coverTitle: 'Cover',
    resetCover: 'Reset to default',
    editCover: 'Edit cover',
    coverChanged: 'Cover updated',
    coverReset: 'Cover reset',
  },

  // ─── Add to Playlist Sheet ─────────────────────────────────────────────────
  addToPlaylist: {
    searchPlaceholder: 'Find a playlist',
    sortButton: 'Sort',
    newPlaylist: 'New playlist',
    savedIn: 'Saved in',
    addedTo: (name: string) => `Added to ${name}.`,
    removedFrom: (name: string) => `Removed from ${name}.`,
    queuedTracks: (n: number) => `${n} tracks added to queue`,
    queueError: 'Error adding to queue',
    trackCount: (n: number) => `${n} song${n !== 1 ? 's' : ''}`,
    unavailableTrack: 'Track not available locally',
  },

  // ─── Create Playlist Modal ─────────────────────────────────────────────────
  createPlaylist: {
    title: 'Name your playlist',
    placeholder: 'My playlist',
    cancelButton: 'Cancel',
    createButton: 'Create',
  },

  // ─── Queue Sheet ───────────────────────────────────────────────────────────
  queue: {
    title: 'Queue',
    editTitle: (count: number) => `Edit queue (${count})`,
    modifyButton: 'Edit',
    nowPlaying: (name: string) => `Now playing: ${name}`,
    fallbackName: 'Music',
    moveToTop: 'Move to top',
    removeButton: 'Remove',
    shuffle: 'Shuffle',
    repeat: 'Repeat',
    timer: 'Sleep timer',
  },

  // ─── Like Retry Manager ────────────────────────────────────────────────────
  likes: {
    addedToLiked: 'Added to Liked Songs',
    removedFromLiked: 'Removed from Liked Songs',
    indexError: 'Cannot add: track not indexed on server',
    unavailableTrack: 'Track not available locally',
  },

  // ─── Offline Banner ────────────────────────────────────────────────────────
  offline: {
    noInternet: 'No internet connection',
    serverUnreachable: 'Server unreachable',
  },

  // ─── Settings ──────────────────────────────────────────────────────────────
  settings: {
    title: 'Settings',
    language: {
      sectionTitle: 'Language',
    },
    sections: {
      player: 'Musonic Player',
      transitions: 'Track transitions',
      playback: 'Playback controls',
      display: 'Display',
    },
    player: {
      progressLabel: 'Progress bar style',
      progressDesc: 'Choose how playback progress is shown in the full player.',
      classic: 'Classic',
      waveform: 'Waveform',
    },
    transitions: {
      crossfadeLabel: 'Track fade',
      crossfadeDesc: 'Fades out the ending track and fades in the next one.',
    },
    playback: {
      monoLabel: 'Mono audio content',
      monoDesc: 'Left and right speakers output identical audio.',
    },
    display: {
      lockRotationLabel: 'Lock screen rotation',
      lockRotationDesc: 'Force portrait mode, even when the phone is tilted.',
    },
  },

  // ─── Full Screen Player ────────────────────────────────────────────────────
  fullScreenPlayer: {
    lyricsTitle: 'Lyrics',
  },

  // ─── Lyrics Screen ─────────────────────────────────────────────────────────
  lyricsScreen: {
    noLyrics: 'No lyrics available',
  },

  // ─── Artist Detail ─────────────────────────────────────────────────────────
  artistDetail: {
    unknownArtist: 'Unknown artist',
    loading: 'Loading...',
    popularSongs: 'Popular',
    popularReleases: 'Popular releases',
  },

  // ─── Album Detail ──────────────────────────────────────────────────────────
  albumDetail: {
    unknownYear: 'Unknown year',
    unknownAlbum: 'Unknown album',
    addedToLibrary: 'Album added to library',
    removedFromLibrary: 'Album removed from library',
    addToLibrary: 'Add to library',
    removeFromLibraryAction: 'Remove from library',
  },

};
