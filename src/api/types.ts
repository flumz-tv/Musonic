export type SubsonicArtist = {
  id: string;
  name: string;
  albumCount?: number;
  coverArt?: string;
  artistImageUrl?: string;
};

export type SubsonicAlbum = {
  id: string;
  name: string;
  artist: string;
  artistId: string;
  coverArt?: string;
  songCount: number;
  duration: number;
  year?: number;
  genre?: string;
};

export type SubsonicSong = {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  coverArt?: string;
  duration: number;
  track?: number;
  year?: number;
  genre?: string;
  size?: number;
  bitRate?: number;
};

export type SubsonicPlaylist = {
  id: string;
  name: string;
  comment?: string;
  songCount: number;
  duration: number;
  coverArt?: string;
  owner?: string;
};

export type SubsonicSearchResult = {
  artists: SubsonicArtist[];
  albums: SubsonicAlbum[];
  songs: SubsonicSong[];
};

export type SubsonicSimilarArtist = {
  id: string;
  name: string;
  coverArt?: string;
  artistImageUrl?: string;
  present?: boolean;
};
