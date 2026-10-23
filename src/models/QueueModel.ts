import type { ModeState, PersistedQueue, QueueMode, TrackLike } from "../types";
import type { TrackRepository } from "./TrackRepository";

const MODES: QueueMode[] = ["all", "unrated"];

export class QueueModel {
    private _state: PersistedQueue;
    private _onTrackChanged: (() => void) | null = null;

    constructor(
        private _repo: TrackRepository,
        initial: PersistedQueue | null,
        private _onPersist: (state: PersistedQueue) => void
    ) {
        this._state = {
            all: initial?.all ?? { queue: [], index: 0 },
            unrated: initial?.unrated ?? { queue: [], index: 0 },
            mode: initial?.mode ?? "all",
            autoAdvance: initial?.autoAdvance ?? false,
        };
    }

    get snapshot(): PersistedQueue { return this._state; }
    get mode(): QueueMode { return this._state.mode; }
    get autoAdvance(): boolean { return this._state.autoAdvance; }
    get active(): ModeState { return this._state[this._state.mode]; }

    get currentPath(): string | null {
        const a = this.active;
        return a.queue.length ? a.queue[a.index] ?? null : null;
    }

    get currentTrack(): TrackLike | null {
        const path = this.currentPath;
        return path ? this._repo.findTrackByPath(path) : null;
    }

    get position(): { index: number; total: number } {
        const a = this.active;
        return { index: a.index, total: a.queue.length };
    }

    set onTrackChanged(handler: (() => void) | null) {
        this._onTrackChanged = handler;
    }

    initialize(): void {
        this._withTrackChangeDetection(() => {
            this._eachMode((mode) => {
                if (this._state[mode].queue.length) this._pruneQueueFor(mode);
                else this._rebuildQueueFor(mode);
            });
        });
    }

    next(): boolean { return this._withTrackChangeDetection(() => this._step(+1)); }
    prev(): boolean { return this._withTrackChangeDetection(() => this._step(-1)); }
    autoNext(): boolean { return this._withTrackChangeDetection(() => this._step(+1)); }

    findNextPath(predicate: (path: string) => boolean): string | null {
        const a = this.active;
        if (!a.queue.length) return null;
        const n = a.queue.length;
        for (let step = 1; step <= n; step++) {
            const idx = (a.index + step) % n;
            const path = a.queue[idx];
            if (path && predicate(path)) return path;
        }
        return null;
    }

    setIndexByPath(path: string): boolean {
        return this._withTrackChangeDetection(() => {
            const a = this.active;
            const index = a.queue.indexOf(path);
            if (index === -1) return false;
            a.index = index;
            this._persist();
            return true;
        });
    }

    refresh(): void {
        this._withTrackChangeDetection(() => {
            this._eachMode((mode) => this._rebuildQueueFor(mode));
            this._persist();
        });
    }

    toggleMode(): void {
        this._withTrackChangeDetection(() => {
            const next = this._nextMode();
            this._state.mode = next;
            if (!this._state[next].queue.length) this._rebuildQueueFor(next);
            this._persist();
        });
    }

    toggleAutoAdvance(): void {
        this._state.autoAdvance = !this._state.autoAdvance;
        this._persist();
    }

    shuffleQueue(): void {
        this._withTrackChangeDetection(() => {
            const a = this.active;
            if (!a.queue.length) return;
            a.queue = this._state.mode === "all"
                ? this._shuffleAllGrouped(a.queue)
                : this._shuffle(a.queue);
            a.index = 0;
            this._persist();
        });
    }

    private _withTrackChangeDetection<T>(fn: () => T): T {
        const before = this.currentPath;
        const result = fn();
        if (this.currentPath !== before) this._onTrackChanged?.();
        return result;
    }

    private _nextMode(): QueueMode {
        return this._state.mode === "all" ? "unrated" : "all";
    }

    private _eachMode(fn: (mode: QueueMode) => void): void {
        for (const mode of MODES) fn(mode);
    }

    private _step(direction: 1 | -1): boolean {
        const a = this.active;
        if (!a.queue.length) return false;
        a.index = (a.index + direction + a.queue.length) % a.queue.length;
        this._persist();
        return true;
    }

    private _rebuildQueueFor(mode: QueueMode): void {
        const currentPath = this._state[mode].queue[this._state[mode].index] ?? null;
        const pool = this._poolForMode(mode);

        if (!pool.length) {
            this._state[mode] = { queue: [], index: 0 };
            return;
        }

        const ordered = this._orderForMode(mode, pool);
        this._state[mode].queue = this._mergeOrder(this._state[mode].queue, ordered);
        this._state[mode].index = this._indexAfterRebuild(currentPath, this._state[mode].queue);
    }

    private _poolForMode(mode: QueueMode): TrackLike[] {
        const all = this._repo.collectTracks();
        return mode === "unrated" ? all.filter((t) => t.rating == null) : all;
    }

    private _mergeOrder(previous: string[], ordered: string[]): string[] {
        const previousSet = new Set(previous);
        const orderedSet = new Set(ordered);
        const stillValid = previous.filter((p) => orderedSet.has(p));
        const added = ordered.filter((p) => !previousSet.has(p));
        return [...stillValid, ...added];
    }

    private _indexAfterRebuild(currentPath: string | null, queue: string[]): number {
        if (!currentPath) return 0;
        const index = queue.indexOf(currentPath);
        return index >= 0 ? index : 0;
    }

    private _orderForMode(mode: QueueMode, pool: TrackLike[]): string[] {
        if (mode === "unrated") {
            return this._shuffle(pool.map((t) => t.file.path));
        }
        const rated = pool.filter((t) => t.rating != null);
        const unrated = pool.filter((t) => t.rating == null);
        return [
            ...this._shuffle(rated.map((t) => t.file.path)),
            ...this._shuffle(unrated.map((t) => t.file.path)),
        ];
    }

    private _shuffleAllGrouped(paths: string[]): string[] {
        const rated: string[] = [];
        const unrated: string[] = [];
        for (const path of paths) {
            const track = this._repo.findTrackByPath(path);
            if (!track) continue;
            (track.rating == null ? unrated : rated).push(path);
        }
        return [...this._shuffle(rated), ...this._shuffle(unrated)];
    }

    private _pruneQueueFor(mode: QueueMode): void {
        const existing = new Set(this._repo.collectTracks().map((t) => t.file.path));
        const a = this._state[mode];
        const before = a.queue.length;
        a.queue = a.queue.filter((p) => existing.has(p));
        if (a.index >= a.queue.length) a.index = 0;
        if (a.queue.length !== before) this._persist();
    }

    private _persist(): void {
        this._onPersist(this._state);
    }

    private _shuffle<T>(items: T[]): T[] {
        return items
            .map((v) => ({ v, r: Math.random() }))
            .sort((a, b) => a.r - b.r)
            .map((x) => x.v);
    }
}