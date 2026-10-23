import { App, TFolder } from "obsidian";
import { InputSuggest } from "./InputSuggest";

export class FolderSuggest extends InputSuggest<TFolder> {
    constructor(app: App, inputEl: HTMLInputElement) {
        const folders = app.vault
            .getAllLoadedFiles()
            .filter((file): file is TFolder => file instanceof TFolder);
        super(app, inputEl, folders);
    }

    protected toText(folder: TFolder): string {
        return folder.path;
    }
}