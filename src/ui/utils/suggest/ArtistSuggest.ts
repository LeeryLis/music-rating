import { App } from "obsidian";
import { InputSuggest } from "./InputSuggest";

export class ArtistSuggest extends InputSuggest<string> {
    constructor(app: App, inputEl: HTMLInputElement, artists: string[]) {
        super(app, inputEl, artists);
    }

    protected toText(artist: string): string {
        return artist;
    }
}