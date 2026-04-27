// French UI strings — single source of truth for all user-visible text.
// Swap this import for another locale file to add a new language.
export const t = {

  // ─── Server Setup ──────────────────────────────────────────────────────────
  serverSetup: {
    appName: 'Musonic',
    subtitle: 'Connecte ton serveur Subsonic',
    serverNameLabel: 'Nom du serveur',
    serverNamePlaceholder: 'Mon serveur',
    serverUrlLabel: 'URL du serveur',
    serverUrlPlaceholder: 'https://music.exemple.com',
    usernameLabel: 'Identifiant',
    usernamePlaceholder: 'admin',
    passwordLabel: 'Mot de passe',
    connectButton: 'Se connecter',
    successMessage: '✓ Connecté ! Chargement...',
    missingFieldsTitle: 'Champs manquants',
    missingFieldsBody: 'URL, identifiant et mot de passe requis.',
    errors: {
      wrongCredentials: 'Identifiant ou mot de passe incorrect',
      clientError: (code: number) => `Erreur serveur (${code}) — vérifie l'URL`,
      serverError: (code: number) => `Erreur serveur (${code}) — le serveur est en panne`,
      timeout: "Connexion trop lente — délai dépassé",
      unreachable: "Serveur introuvable — vérifie l'URL",
      generic: 'Connexion impossible',
    },
  },

  // ─── Tab Bar ───────────────────────────────────────────────────────────────
  tabs: {
    home: 'Accueil',
    search: 'Recherche',
    library: 'Bibliothèque',
  },

  // ─── Drawer / Navigation ───────────────────────────────────────────────────
  drawer: {
    settings: 'Paramètres',
    logout: 'Se déconnecter',
    logoutTitle: 'Se déconnecter',
    logoutMessage: (name: string, url: string) =>
      `Voulez-vous vous déconnecter de :\n\n${name}\n${url}`,
    logoutConfirm: 'Déconnecter',
    cancelButton: 'Annuler',
  },

  // ─── Home ──────────────────────────────────────────────────────────────────
  home: {
    likedSongs: 'Titres likés',
    unknownTitle: 'Titre inconnu',
    unknownArtist: 'Artiste inconnu',
    filters: {
      all: 'Tout',
      recent: 'Récent',
      frequent: 'Fréquent',
      reco: 'Recommandations',
      discover: 'À découvrir',
    },
    sections: {
      recentlyPlayed: 'Récemment joués',
      frequentlyPlayed: 'Joués fréquemment',
      recommendations: 'Recommandations',
      discover: 'À découvrir',
    },
  },

  // ─── Search ────────────────────────────────────────────────────────────────
  search: {
    headerTitle: 'Rechercher',
    placeholder: 'Que souhaitez-vous écouter ?',
    browseAll: 'Parcourir tout',
    trackType: 'Titre',
    noResults: (q: string) => `Aucun résultat pour "${q}"`,
    sections: {
      songs: 'Titres',
      artists: 'Artistes',
      albums: 'Albums',
    },
  },

  // ─── Library ───────────────────────────────────────────────────────────────
  library: {
    title: 'Bibliothèque',
    sortTitle: 'Trier par',
    emptyState: 'Aucun élément',
    loadError: 'Impossible de charger la bibliothèque',
    likedTrackCount: (n: number) =>
      `${n} titre${n !== 1 ? 's' : ''} aimé${n !== 1 ? 's' : ''}`,
    sort: {
      recent: 'Récents',
      added: 'Ajoutés récemment',
      alpha: 'Alphabétique',
      custom: 'Personnalisé',
    },
  },

  // ─── Liked Songs ───────────────────────────────────────────────────────────
  likedSongs: {
    title: 'Titres likés',
    emptyState: "Aucun titre liké pour l'instant",
    trackCount: (n: number) => `${n} titre${n !== 1 ? 's' : ''}`,
  },

  // ─── Playlist Detail ───────────────────────────────────────────────────────
  playlistDetail: {
    owner: 'Doodz',
    trackCount: (n: number) => `${n} titre${n !== 1 ? 's' : ''}`,
    contextLabel: 'LECTURE À PARTIR DE PLAYLIST',
    searchPlaceholder: 'Rechercher sur cette page',
    pills: {
      add: '+ Ajouter',
      mix: 'Mixer',
      edit: 'Modifier',
    },
    editHeader: 'Modifier la playlist',
    saveButton: 'Sauvegarder',
    savedToast: 'Playlist mise à jour',
    saveError: 'Erreur lors de la sauvegarde',
    recommendations: {
      title: 'Titres recommandés',
      subtitle: 'Basée sur les titres de cette playlist',
    },
  },

  // ─── Song Options Sheet ────────────────────────────────────────────────────
  songOptions: {
    addToPlaylist: 'Ajouter à la playlist',
    removeFromPlaylist: 'Supprimer de cette playlist',
    addToQueue: "Ajouter à la file d'attente",
    goToAlbum: "Accéder à l'album",
    goToArtist: "Accéder à l'artiste",
    addedToQueue: "Ajouté à la file d'attente",
    removedFromPlaylist: 'Titre supprimé de la playlist',
    addError: "Erreur lors de l'ajout",
    removeError: 'Erreur lors de la suppression',
  },

  // ─── Playlist Options Sheet ────────────────────────────────────────────────
  playlistOptions: {
    addToQueue: "Ajouter à la file d'attente",
    download: 'Télécharger',
    pin: 'Épingler la playlist',
    unpin: 'Désépingler la playlist',
    rename: 'Renommer la playlist',
    delete: 'Supprimer la playlist',
    pinnedToast: 'Playlist épinglée',
    unpinnedToast: 'Playlist désépinglée',
    renamedToast: 'Playlist renommée',
    deletedToast: 'Playlist supprimée',
    queuedToast: (n: number) =>
      `${n} titre${n !== 1 ? 's' : ''} ajouté${n !== 1 ? 's' : ''} à la file d'attente`,
    deleteTitle: 'Supprimer la playlist',
    deleteMessage: (name: string) => `Supprimer "${name}" définitivement ?`,
    deleteConfirm: 'Supprimer',
    cancelButton: 'Annuler',
    byYou: 'par Vous',
    trackCount: (n: number) => `${n} titre${n !== 1 ? 's' : ''}`,
    queueError: "Erreur lors de l'ajout à la file d'attente",
    renameError: 'Erreur lors du renommage',
    deleteError: 'Erreur lors de la suppression',
    comingSoon: 'Bientôt disponible',
  },

  // ─── Rename Modal ──────────────────────────────────────────────────────────
  renameModal: {
    title: 'Renommer la playlist',
    cancelButton: 'Annuler',
    confirmButton: 'Renommer',
  },

  // ─── Add to Playlist Sheet ─────────────────────────────────────────────────
  addToPlaylist: {
    searchPlaceholder: 'Trouver une playlist',
    sortButton: 'Trier',
    newPlaylist: 'Nouvelle playlist',
    savedIn: 'Enregistrée dans',
    addedTo: (name: string) => `Ajouté à ${name}.`,
    removedFrom: (name: string) => `Supprimé de ${name}.`,
    queuedTracks: (n: number) => `${n} titres ajoutés à la file d'attente`,
    queueError: "Erreur lors de l'ajout à la file d'attente",
    trackCount: (n: number) => `${n} titre${n !== 1 ? 's' : ''}`,
  },

  // ─── Create Playlist Modal ─────────────────────────────────────────────────
  createPlaylist: {
    title: 'Donnez un nom à votre playlist',
    placeholder: 'Ma playlist',
    cancelButton: 'Annuler',
    createButton: 'Créer',
  },

  // ─── Queue Sheet ───────────────────────────────────────────────────────────
  queue: {
    title: "File d'attente",
    editTitle: (count: number) => `Modifier la file d'attente (${count})`,
    modifyButton: 'Modifier',
    nowPlaying: (name: string) => `En cours : ${name}`,
    fallbackName: 'Musique',
    moveToTop: 'Déplacer vers le haut',
    removeButton: 'Supprimer',
    shuffle: 'Lecture aléatoire',
    repeat: 'Répéter',
    timer: 'Minuteur',
  },

  // ─── Like Retry Manager ────────────────────────────────────────────────────
  likes: {
    addedToLiked: 'Ajouté aux titres likés',
    removedFromLiked: 'Supprimé des titres likés',
    indexError: "Impossible d'ajouter : titre non indexé sur le serveur",
  },

  // ─── Offline Banner ────────────────────────────────────────────────────────
  offline: {
    noInternet: 'Pas de connexion internet',
  },

  // ─── Settings ──────────────────────────────────────────────────────────────
  settings: {
    title: 'Paramètres',
    sections: {
      player: 'Lecteur Musonic',
      transitions: 'Transitions entre les titres',
      playback: "Contrôles d'écoute",
      display: 'Affichage',
    },
    player: {
      progressLabel: 'Style de la barre de progression',
      progressDesc:
        "Choisissez comment visualiser l'avancement de la musique dans le lecteur complet.",
      classic: 'Classique',
      waveform: 'Onde Sonore',
    },
    transitions: {
      crossfadeLabel: 'Fondu enchaîné',
      crossfadeDesc:
        'Ajustez la durée du fondu et de la superposition entre les titres.',
    },
    playback: {
      monoLabel: 'Contenu audio mono',
      monoDesc: 'Les enceintes gauche et droite diffusent le même contenu audio.',
    },
    display: {
      lockRotationLabel: 'Verrouiller la rotation',
      lockRotationDesc:
        "Force l'affichage en portrait, même si le téléphone est penché.",
    },
  },

  // ─── Full Screen Player ────────────────────────────────────────────────────
  fullScreenPlayer: {
    lyricsTitle: 'Paroles',
  },

  // ─── Artist Detail ─────────────────────────────────────────────────────────
  artistDetail: {
    unknownArtist: 'Artiste inconnu',
    loading: 'Chargement...',
    popularSongs: 'Populaires',
    popularReleases: 'Sorties populaires',
  },

  // ─── Album Detail ──────────────────────────────────────────────────────────
  albumDetail: {
    unknownYear: 'Année inconnue',
    unknownAlbum: 'Album inconnu',
    addedToLibrary: 'Album ajouté à la bibliothèque',
    removedFromLibrary: 'Album retiré de la bibliothèque',
  },

} as const;

export type Translations = typeof t;
