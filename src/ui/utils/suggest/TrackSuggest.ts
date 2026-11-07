import { App } from "obsidian";
import { InputSuggest } from "./InputSuggest";
import type { TrackLike } from "../../../types";
import { formatArtist } from "../../../utils/wikilink";
import { setInputValue } from "../dom";

export class TrackSuggest extends InputSuggest<TrackLike> {
    constructor(
        app: App,
        inputEl: HTMLInputElement,
        private _getTracks: () => TrackLike[],
        private _onPick: (track: TrackLike) => void
    ) {
        super(app, inputEl, []);
    }

    protected toText(track: TrackLike): string {
        return `${formatArtist(track.artist)} — ${track.title}`;
    }

    getSuggestions(query: string): TrackLike[] {
        const tracks = this._getTracks();
        const q = query.trim().toLowerCase();
        if (!q) return tracks;
        return tracks.filter((t) => {
            const artist = formatArtist(t.artist).toLowerCase();
            return t.title.toLowerCase().includes(q) || artist.includes(q);
        });
    }

    selectSuggestion(item: TrackLike): void {
        setInputValue(this.inputEl, "");
        this.close();
        this._onPick(item);
    }
}