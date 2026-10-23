import { App, Notice, TFile, normalizePath } from "obsidian";
import { t } from "../../i18n";
import type { RatingStore } from "../../models/RatingStore";
import type { TrackRepository } from "../../models/TrackRepository";
import type { TrackLike, TrackMetaInput } from "../../types";
import { parseWikilink, wikilinkFileName } from "../../utils/wikilink";
import { TrackFormModal } from "./TrackFormModal";

export class TrackEditModal extends TrackFormModal {
    constructor(
        app: App,
        private _track: TrackLike,
        private _store: RatingStore,
        repo: TrackRepository,
        private _onSaved: () => void
    ) {
        super(app, repo);
    }

    protected getTitle(): string {
        return t("track.editTitle");
    }

    protected getInitialMeta(): TrackMetaInput {
        return {
            artist: parseWikilink(this._track.artist ?? ""),
            title: this._track.title,
            localFileLink: wikilinkFileName(this._track.local_file?.path ?? ""),
            youtubeLink: this._track.youtube_link ?? "",
        };
    }

    protected getSubmitLabel(): string {
        return t("common.save");
    }

    protected async submit(meta: TrackMetaInput): Promise<boolean> {
        if (!(await this._save(meta))) return false;
        this._onSaved();
        return true;
    }

    private async _save(meta: TrackMetaInput): Promise<boolean> {
        await this._store.saveMeta(this._track, meta);
        await this._renameArtistIfChanged(meta);
        if (!(await this._moveFileIfPathChanged(meta))) return false;
        new Notice(t("notice.trackUpdated"));
        return true;
    }

    private async _renameArtistIfChanged(meta: TrackMetaInput): Promise<void> {
        const oldArtist = parseWikilink(this._track.artist ?? "");
        if (!oldArtist || oldArtist === meta.artist) return;
        await this.repo.renameArtist(oldArtist, meta.artist);
    }

    private async _moveFileIfPathChanged(meta: TrackMetaInput): Promise<boolean> {
        const newPath = this.repo.trackFilePath(meta.artist, meta.title);
        if (newPath === this._track.file.path) return true;

        if (this._isPathTakenByOther(newPath)) {
            new Notice(t("notice.trackExists"));
            return false;
        }

        await this._ensureParentFolder(newPath);
        await this.app.fileManager.renameFile(this._track.file, newPath);
        return true;
    }

    private _isPathTakenByOther(path: string): boolean {
        const existing = this.app.vault.getAbstractFileByPath(path);
        return existing instanceof TFile && existing.path !== this._track.file.path;
    }

    private async _ensureParentFolder(path: string): Promise<void> {
        const parent = this._parentPath(path);
        if (this.app.vault.getAbstractFileByPath(parent)) return;
        await this.app.vault.createFolder(parent);
    }

    private _parentPath(path: string): string {
        return normalizePath(path.substring(0, path.lastIndexOf("/")));
    }
}