import type { App } from "obsidian";
import { MusicPlayer } from "../models/MusicPlayer";
import { QueueModel } from "../models/QueueModel";
import type { TrackRepository } from "../models/TrackRepository";
import type { PersistedQueue, TrackLike } from "../types";

export interface PlaybackServiceDeps {
    app: App;
    repo: TrackRepository;
    initialQueue: PersistedQueue | null;
    onQueuePersist: (state: PersistedQueue) => void;
    onChanged: () => void;
}

export class PlaybackService {
    readonly player: MusicPlayer;
    readonly queue: QueueModel;

    constructor(private _deps: PlaybackServiceDeps) {
        this.player = new MusicPlayer(_deps.app);
        this.queue = new QueueModel(
            _deps.repo,
            _deps.initialQueue,
            _deps.onQueuePersist
        );

        this.player.onEnded = () => this._handleTrackEnded();
        this.queue.onTrackChanged = () => this._handleTrackChanged();
    }

    async start(): Promise<void> {
        await this._whenMetadataReady();
        this.queue.initialize();
    }

    destroy(): void {
        this.queue.onTrackChanged = null;
        this.player.onEnded = null;
        this.player.destroy();
    }

    next(): boolean {
        if (!this.queue.next()) return false;
        this._playCurrentIfPlaying();
        return true;
    }

    prev(): boolean {
        if (!this.queue.prev()) return false;
        this._playCurrentIfPlaying();
        return true;
    }

    playCurrent(): void {
        const file = this._currentFile();
        if (!file) { this.player.stop(); return; }
        this.player.playFile(file);
    }

    loadCurrent(): void {
        const file = this._currentFile();
        if (!file) { this.player.stop(); return; }
        this.player.ensureFile(file);
    }

    stop(): void {
        this.player.stop();
    }

    private _handleTrackEnded(): void {
        if (!this.queue.autoAdvance) return;
        if (!this.queue.position.total) return;

        const currentPath = this.queue.currentPath;
        const nextPath = this.queue.findNextPath((path) => this._pathHasFile(path));

        if (!nextPath) { this.player.stop(); return; }

        if (nextPath === currentPath) {
            const file = this._currentFile();
            if (file) this.player.playFile(file);
            return;
        }

        this.queue.setIndexByPath(nextPath);

        const file = this._currentFile();
        if (file) this.player.playFile(file);

        this._deps.onChanged();
    }

    private _handleTrackChanged(): void {
        const file = this._currentFile();
        if (!file) { this.player.stop(); return; }
        if (this.player.isPlaying()) this.player.playFile(file);
        else this.player.ensureFile(file);
    }

    private _playCurrentIfPlaying(): void {
        const file = this._currentFile();
        if (!file) { this.player.stop(); return; }
        this.player.playFile(file);
    }

    private _currentFile() {
        const track = this.queue.currentTrack;
        return track ? this._deps.repo.resolveLocalFile(track) : null;
    }

    private _pathHasFile(path: string): boolean {
        const track = this._deps.repo.findTrackByPath(path);
        return track != null && this._deps.repo.resolveLocalFile(track) != null;
    }

    private _whenMetadataReady(): Promise<void> {
        const cache = this._deps.app.metadataCache as unknown as {
            resolved?: boolean;
            on: (name: "resolved", cb: () => void) => unknown;
            offref: (ref: unknown) => void;
        };
        if (cache.resolved) return Promise.resolve();
        return new Promise<void>((resolve) => {
            const ref = cache.on("resolved", () => {
                cache.offref(ref);
                resolve();
            });
        });
    }
}