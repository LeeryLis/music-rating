import { App, Modal, Notice } from "obsidian";
import { t } from "../../i18n";
import type { TrackMetaInput } from "../../types";
import type { TrackRepository } from "../../models/TrackRepository";
import { ArtistSuggest } from "../utils/suggest/ArtistSuggest";
import { iconButton } from "../utils/buttons";

export abstract class TrackFormModal extends Modal {
    protected artistInp!: HTMLInputElement;
    protected titleInp!: HTMLInputElement;
    protected localInp!: HTMLInputElement;
    protected ytInp!: HTMLInputElement;

    constructor(
        app: App,
        protected readonly repo: TrackRepository
    ) {
        super(app);
    }

    protected abstract getTitle(): string;
    protected abstract getInitialMeta(): TrackMetaInput;
    protected abstract getSubmitLabel(): string;
    protected abstract submit(meta: TrackMetaInput): Promise<boolean>;

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h2", { text: this.getTitle() });

        const initial = this.getInitialMeta();

        this.artistInp = this.addInput(t("track.field.artist"), true, initial.artist);
        new ArtistSuggest(this.app, this.artistInp, this.repo.listArtists());

        this.titleInp = this.addInput(t("track.field.title"), true, initial.title);

        this.addLocalFileRow(initial.localFileLink);

        this.ytInp = this.addInput(t("track.field.youtube"), false, initial.youtubeLink);

        this.addActions();
    }

    onClose(): void {
        this.contentEl.empty();
    }

    private addLocalFileRow(value: string): void {
        const row = this.contentEl.createDiv({ cls: "music-modal-row" });
        this.addLabel(row, t("track.field.localFile"), false);

        const wrap = row.createDiv({ cls: "music-modal-input-wrap" });
        const inp = wrap.createEl("input", { type: "text", cls: "music-modal-input" });
        inp.value = value;
        this.localInp = inp;

        wrap.appendChild(
            iconButton("refresh-cw", t("track.sync"), () => this.syncLocalFile())
        );
    }

    private syncLocalFile(): void {
        const artist = this.artistInp.value.trim();
        const title = this.titleInp.value.trim();
        if (!artist || !title) {
            new Notice(t("notice.requiredFields"));
            return;
        }
        const found = this.repo.findAudioByTemplate(artist, title);
        if (!found) {
            new Notice(t("track.sync.noMatch"));
            return;
        }
        const name = found.split("/").pop() ?? found;
        this.localInp.value = name;
        new Notice(t("track.sync.found", { name }));
    }

    private addActions(): void {
        const actions = this.contentEl.createDiv({ cls: "music-modal-actions" });

        const submitBtn = actions.createEl("button", {
            text: this.getSubmitLabel(),
            cls: "mod-cta",
        });
        submitBtn.onclick = () => void this.handleSubmit();

        const cancelBtn = actions.createEl("button", { text: t("common.cancel") });
        cancelBtn.onclick = () => this.close();
    }

    private async handleSubmit(): Promise<void> {
        const meta = this.readMeta();
        if (!meta) return;

        if (await this.submit(meta)) {
            this.close();
        }
    }

    private readMeta(): TrackMetaInput | null {
        const meta: TrackMetaInput = {
            artist: this.artistInp.value.trim(),
            title: this.titleInp.value.trim(),
            localFileLink: this.localInp.value.trim(),
            youtubeLink: this.ytInp.value.trim(),
        };
        if (!meta.artist || !meta.title) {
            new Notice(t("notice.requiredFields"));
            return null;
        }
        return meta;
    }

    private addLabel(parent: HTMLElement, text: string, required: boolean): void {
        const label = parent.createEl("label", { cls: "music-modal-label" });
        label.setText(text);
        if (required) {
            label.createEl("span", { cls: "music-modal-required", text: " *" });
        }
    }

    private addInput(
        labelText: string,
        required: boolean,
        value: string
    ): HTMLInputElement {
        this.addLabel(this.contentEl, labelText, required);
        const inp = this.contentEl.createEl("input", {
            type: "text",
            cls: "music-modal-input",
        });
        inp.value = value;
        return inp;
    }
}