export interface Song {
  title: string;
  artist: string;
  /** Path under /public, e.g. "/music/my-song.mp3". */
  src: string;
}

/**
 * Songs in the Music window. Put mp3 files in public/music/ and list them here.
 * Only add songs you have the right to share: anyone can download these files.
 */
export const songs: Song[] = [];
