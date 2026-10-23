export type TranslationKey = keyof TranslationKeys;

export type LocaleSetting = "auto" | "en" | "ru";

export interface TranslationKeys {
    "plugin.ribbon": string;
    "plugin.openCommand": string;

    "view.title": string;
    "view.empty.noTracks": string;
    "view.empty.allRated": string;
    "view.empty.showAll": string;
    "view.empty.noPlayable": string;

    "sidebar.shuffle": string;
    "sidebar.mode.filter": string;
    "sidebar.mode.list": string;
    "sidebar.auto.on": string;
    "sidebar.auto.off": string;

    "rating.clear": string;
    "rating.cleared": string;
    "rating.saved": string;

    "youtube.open": string;
    "youtube.add": string;
    "youtube.placeholder": string;
    "youtube.save": string;
    "youtube.cancel": string;
    "youtube.empty": string;
    "youtube.saved": string;

    "notice.noPlayable": string;
    "notice.ratingSaved": string;
    "notice.ratingCleared": string;
    "notice.youtubeSaved": string;
    "notice.youtubeEmpty": string;

    "settings.language.name": string;
    "settings.language.desc": string;
    "settings.language.auto": string;
    "settings.musicFolder.name": string;
    "settings.musicFolder.desc": string;
    "settings.audioFolder.name": string;
    "settings.audioFolder.desc": string;
    "settings.artistsIndexName.name": string;
    "settings.artistsIndexName.desc": string;
    "settings.showNotice.name": string;
    "settings.advanceOnRate.name": string;
    "settings.advanceOnRate.desc": string;

    "common.artist.unknown": string;
    "common.empty": string;

    "tab.rating": string;
    "tab.queue": string;

    "track.edit": string;
    "track.add": string;
    "track.delete": string;
    "track.deleteConfirmTitle": string;
    "track.deleteConfirmMessage": string;
    "track.playPause": string;
    "track.editTitle": string;
    "track.createTitle": string;
    "track.field.artist": string;
    "track.field.title": string;
    "track.field.localFile": string;
    "track.field.youtube": string;
    "track.field.required": string;
    "track.sync": string;
    "track.sync.noMatch": string;
    "track.sync.found": string;

    "notice.trackUpdated": string;
    "notice.trackCreated": string;
    "notice.trackExists": string;
    "notice.requiredFields": string;

    "common.save": string;
    "common.cancel": string;
    "common.create": string;
    "common.delete": string;
}