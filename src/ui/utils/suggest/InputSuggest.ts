import { AbstractInputSuggest, App } from "obsidian";
import { setInputValue } from "../dom";

export abstract class InputSuggest<T> extends AbstractInputSuggest<T> {
    protected constructor(
        app: App,
        protected readonly inputEl: HTMLInputElement,
        protected readonly items: T[]
    ) {
        super(app, inputEl);
    }

    protected abstract toText(item: T): string;

    getSuggestions(query: string): T[] {
        const q = query.trim().toLowerCase();
        if (!q) return this.items;
        return this.items.filter((item) =>
            this.toText(item).toLowerCase().includes(q)
        );
    }

    renderSuggestion(item: T, el: HTMLElement): void {
        el.createEl("div", { text: this.toText(item) });
    }

    selectSuggestion(item: T): void {
        setInputValue(this.inputEl, this.toText(item));
        this.close();
    }
}