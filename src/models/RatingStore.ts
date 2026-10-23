import { App, TFile } from "obsidian";
import type { TrackLike, TrackMetaInput } from "../types";
import { wikilinkFileName } from "../utils/wikilink";
import { FM } from "../frontmatter";

const METADATA_TIMEOUT_MS = 500;

export class RatingStore {
    constructor(private _app: App) { }

    async saveRating(track: TrackLike, rating: number): Promise<void> {
        await this._setRating(track, rating);
    }

    async clearRating(track: TrackLike): Promise<void> {
        await this._setRating(track, "");
    }

    async saveMeta(track: TrackLike, input: TrackMetaInput): Promise<void> {
        await this._app.fileManager.processFrontMatter(track.file, (fm) => {
            fm[FM.artist] = `[[${input.artist}]]`;
            fm[FM.localFile] = input.localFileLink
                ? `[[${wikilinkFileName(input.localFileLink)}]]`
                : "";
            fm[FM.youtubeLink] = input.youtubeLink;
        });
        await this._waitForMetadata(track.file);
    }

    private async _setRating(track: TrackLike, value: number | ""): Promise<void> {
        await this._app.fileManager.processFrontMatter(track.file, (fm) => {
            fm[FM.rating] = value;
        });
        await this._waitForMetadata(track.file);
    }

    private _waitForMetadata(file: TFile): Promise<void> {
        return new Promise((resolve) => {
            let settled = false;

            const finish = (): void => {
                if (settled) return;
                settled = true;
                this._app.metadataCache.offref(ref);
                window.clearTimeout(timer);
                resolve();
            };

            const ref = this._app.metadataCache.on("changed", (f) => {
                if (f.path === file.path) finish();
            });
            const timer = window.setTimeout(finish, METADATA_TIMEOUT_MS);
        });
    }
}