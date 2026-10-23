export const FM = {
    type: "music_rating_type",
    artist: "music_rating_artist",
    rating: "music_rating_rating",
    localFile: "music_rating_local_file",
    youtubeLink: "music_rating_youtube_link",
    moc: "music_rating_moc",
} as const;

export const FM_TYPE = {
    track: "track",
    artist: "artist",
    artistsIndex: "artists_index",
} as const;