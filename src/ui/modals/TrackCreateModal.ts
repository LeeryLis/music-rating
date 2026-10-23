import { App, Notice } from "obsidian";
import { t } from "../../i18n";
import type { TrackRepository } from "../../models/TrackRepository";
import type { TrackMetaInput } from "../../types";
import { TrackFormModal } from "./TrackFormModal";

export class TrackCreateModal extends TrackFormModal {
    constructor(
        app: App,
        repo: TrackRepository,
        private onCreated: () => void
    ) {
        super(app, repo);
    }

    protected getTitle(): string {
        return t("track.createTitle");
    }

    protected getInitialMeta(): TrackMetaInput {
        return {
            artist: "",
            title: "",
            localFileLink: "",
            youtubeLink: "",
        };
    }

    protected getSubmitLabel(): string {
        return t("common.create");
    }

    protected async submit(meta: TrackMetaInput): Promise<boolean> {
        const file = await this.repo.createTrack(meta);
        if (!file) {
            new Notice(t("notice.trackExists"));
            return false;
        }
        new Notice(t("notice.trackCreated"));
        this.onCreated();
        return true;
    }
}