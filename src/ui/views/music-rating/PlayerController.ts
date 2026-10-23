import { Notice, TFile } from "obsidian";
import { t } from "../../../i18n";
import type { MusicPlayer } from "../../../models/MusicPlayer";
import type { QueueModel } from "../../../models/QueueModel";
import type { TrackRepository } from "../../../models/TrackRepository";

export class PlayerController {
    constructor(
        private _player: MusicPlayer,
        private _queue: QueueModel,
        private _repo: TrackRepository,
        private _onChanged: () => void
    ) { }

    loadCurrent(): void {
        const file = this._currentFile();
        if (!file) {
            this._player.stop();
            return;
        }
        this._player.ensureFile(file);
    }

    playCurrent(): void {
        const file = this._currentFile();
        if (!file) {
            this._player.stop();
            return;
        }
        this._player.playFile(file);
    }

    stop(): void {
        this._player.stop();
    }

    onEnded(): void {
        if (!this._queue.autoAdvance) return;
        if (!this._queue.position.total) return;

        const nextPath = this._queue.findNextPath((path) => this._pathHasFile(path));
        if (nextPath && nextPath !== this._queue.currentPath) {
            this._queue.setIndexByPath(nextPath);
            this.playCurrent();
            this._onChanged();
            return;
        }

        if (this._currentFile()) {
            this.playCurrent();
        } else {
            this._player.stop();
            this._notifyNoPlayable();
        }
        this._onChanged();
    }

    handleMissingFile(): void {
        this._player.stop();
        if (!this._queue.autoAdvance) return;

        const nextPath = this._queue.findNextPath((path) => this._pathHasFile(path));
        if (!nextPath) {
            this._notifyNoPlayable();
            return;
        }

        this._queue.setIndexByPath(nextPath);
        this.playCurrent();
        window.setTimeout(() => this._onChanged(), 0);
    }

    private _pathHasFile(path: string): boolean {
        const track = this._repo.findTrackByPath(path);
        return track != null && this._repo.resolveLocalFile(track) != null;
    }

    private _notifyNoPlayable(): void {
        new Notice(t("notice.noPlayable"));
    }

    private _currentFile(): TFile | null {
        const track = this._queue.currentTrack;
        return track ? this._repo.resolveLocalFile(track) : null;
    }
}