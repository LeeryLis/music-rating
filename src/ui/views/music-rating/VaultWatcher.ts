import { App, EventRef, TFile } from "obsidian";
import type { TrackRepository } from "../../../models/TrackRepository";
import { FM, FM_TYPE } from "../../../frontmatter";

export class VaultWatcher {
    private _refs: EventRef[] = [];
    private _timer: number | null = null;

    constructor(
        private _app: App,
        private _repo: TrackRepository,
        private _onChanged: () => void,
        private _debounceMs = 250
    ) { }

    start(): void {
        this._refs.push(
            this._app.vault.on("create", (file) => this._onTrackFileChanged(file)),
            this._app.vault.on("delete", (file) => this._onTrackFileChanged(file)),
            this._app.vault.on("rename", (file, oldPath) => this._onTrackFileRenamed(file, oldPath)),
            this._app.metadataCache.on("changed", (file) => this._onTrackMetaChanged(file))
        );
    }

    stop(): void {
        for (const ref of this._refs) this._app.vault.offref(ref);
        this._refs = [];
        this._cancelTimer();
    }

    private _onTrackFileChanged(file: TFile | unknown): void {
        if (file instanceof TFile && this._isTrackPath(file.path)) this._schedule();
    }

    private _onTrackFileRenamed(file: TFile | unknown, oldPath: string): void {
        if (!(file instanceof TFile)) return;
        if (this._isTrackPath(file.path) || this._isTrackPath(oldPath)) this._schedule();
    }

    private _onTrackMetaChanged(file: TFile | unknown): void {
        if (!(file instanceof TFile)) return;
        if (!this._isTrackPath(file.path)) return;
        if (this._isTrackFile(file)) this._schedule();
    }

    private _isTrackPath(path: string): boolean {
        return path.startsWith(this._repo.tracksPath() + "/");
    }

    private _isTrackFile(file: TFile): boolean {
        const fm = this._app.metadataCache.getFileCache(file)?.frontmatter;
        return fm?.[FM.type] === FM_TYPE.track;
    }

    private _schedule(): void {
        this._cancelTimer();
        this._timer = window.setTimeout(() => {
            this._timer = null;
            this._onChanged();
        }, this._debounceMs);
    }

    private _cancelTimer(): void {
        if (this._timer === null) return;
        window.clearTimeout(this._timer);
        this._timer = null;
    }
}