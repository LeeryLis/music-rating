import type { TFile } from "obsidian";
import type { LocaleSetting } from "./i18n/types";

export interface MusicRatingSettings {
    musicFolder: string;
    audioFolder: string;
    artistsIndexName: string;
    showNoticeOnRate: boolean;
    advanceOnRate: boolean;
    language: LocaleSetting;
}

export const DEFAULT_SETTINGS: MusicRatingSettings = {
    musicFolder: "Music",
    audioFolder: "Music/Audio",
    artistsIndexName: "Artists",
    showNoticeOnRate: true,
    advanceOnRate: true,
    language: "auto",
};

export type QueueMode = "all" | "unrated";
export type ViewTab = "rating" | "queue";

export interface ModeState {
    queue: string[];
    index: number;
}

export interface PersistedQueue {
    all: ModeState;
    unrated: ModeState;
    mode: QueueMode;
    autoAdvance: boolean;
}

export interface TrackLike {
    file: TFile;
    artist?: string;
    title: string;
    rating?: number | null;
    local_file?: { path: string };
    youtube_link?: string;
}

export interface TrackMetaInput {
    artist: string;
    title: string;
    localFileLink: string;
    youtubeLink: string;
}