/**
 * @file types.ts
 * @description React Navigation param-list type definitions for all stacks.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
export type LibraryStackParams = {
  LibraryHome: undefined;
  LikedSongs: undefined;
  PlaylistDetail: {playlistId: string};
  AlbumDetail: {albumId: string};
  ArtistDetail: {artistId?: string; artistName?: string};
};
