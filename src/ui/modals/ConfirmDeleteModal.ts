import { App, Modal } from "obsidian";
import { t } from "../../i18n";

export interface ConfirmDeleteOptions {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm: () => void;
}

export class ConfirmDeleteModal extends Modal {
    constructor(app: App, private _opts: ConfirmDeleteOptions) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h2", { text: this._opts.title });
        contentEl.createEl("p", { text: this._opts.message });

        const actions = contentEl.createDiv({ cls: "music-modal-actions" });

        const confirmBtn = actions.createEl("button", {
            text: this._opts.confirmLabel,
            cls: "mod-warning",
        });
        confirmBtn.onclick = () => {
            this.close();
            this._opts.onConfirm();
        };

        const cancelBtn = actions.createEl("button", {
            text: this._opts.cancelLabel ?? t("common.cancel"),
        });
        cancelBtn.onclick = () => this.close();
    }

    onClose(): void {
        this.contentEl.empty();
    }
}