import { App, TFile } from "obsidian";

const VOLUME_KEY = "music-engine-volume";

export class MusicPlayer {
    private _audio: HTMLAudioElement;
    private _currentSrc: string | null = null;

    onTimeUpdate: (() => void) | null = null;
    onPlayStateChange: (() => void) | null = null;
    onLoaded: (() => void) | null = null;
    onVolumeChange: (() => void) | null = null;
    onEnded: (() => void) | null = null;

    constructor(private _app: App) {
        this._audio = document.createElement("audio");
        this._audio.controls = false;
        this._audio.style.width = "100%";
        this._audio.volume = this._loadVolume();
        this._bindAudioEvents();
    }

    ensureFile(file: TFile): void {
        const src = this._app.vault.getResourcePath(file);
        if (this._currentSrc === src) return;

        this._audio.pause();
        this._audio.src = src;
        this._audio.load();
        this._audio.currentTime = 0;
        this._currentSrc = src;
    }

    playFile(file: TFile): void {
        const prevSrc = this._currentSrc;
        this.ensureFile(file);
        this._restartIfEnded(prevSrc);
        this.play();
    }

    play(): void { void this._audio.play().catch(() => { }); }
    pause(): void { this._audio.pause(); }
    toggle(): void { this.isPlaying() ? this.pause() : this.play(); }
    isPlaying(): boolean { return !this._audio.paused && !this._audio.ended; }

    getVolume(): number { return this._audio.volume; }
    setVolume(value: number): void {
        this._audio.volume = this._clampVolume(value);
        this._audio.muted = false;
        this.onVolumeChange?.();
    }
    isMuted(): boolean { return this._audio.muted || this._audio.volume === 0; }
    toggleMute(): void {
        this._audio.muted = !this._audio.muted;
        this.onVolumeChange?.();
    }

    getCurrentTime(): number { return this._audio.currentTime || 0; }
    getDuration(): number {
        const duration = this._audio.duration;
        return Number.isFinite(duration) && duration > 0 ? duration : 0;
    }
    seek(seconds: number): void {
        const duration = this.getDuration();
        if (duration <= 0) return;
        this._audio.currentTime = Math.min(Math.max(seconds, 0), duration);
    }

    stop(): void {
        this._audio.pause();
        this._audio.removeAttribute("src");
        this._audio.load();
        this._currentSrc = null;
    }

    playYoutube(url?: string): void {
        if (!url || url === "-") return;
        window.open(url, "_blank");
    }

    destroy(): void {
        this.stop();
        this.onTimeUpdate = null;
        this.onPlayStateChange = null;
        this.onLoaded = null;
        this.onVolumeChange = null;
        this.onEnded = null;
        this._audio.remove();
    }

    getElement(): HTMLAudioElement {
        return this._audio;
    }

    private _bindAudioEvents(): void {
        this._audio.onvolumechange = () => this._handleVolumeChange();
        this._audio.addEventListener("timeupdate", () => this.onTimeUpdate?.());
        this._audio.addEventListener("play", () => this.onPlayStateChange?.());
        this._audio.addEventListener("pause", () => this.onPlayStateChange?.());
        this._audio.addEventListener("ended", () => this._handleEnded());
        this._audio.addEventListener("loadedmetadata", () => this.onLoaded?.());
    }

    private _handleVolumeChange(): void {
        this._saveVolume(this._audio.volume);
        this.onVolumeChange?.();
    }

    private _handleEnded(): void {
        this.onPlayStateChange?.();
        this.onEnded?.();
    }

    private _restartIfEnded(prevSrc: string | null): void {
        if (prevSrc !== this._currentSrc) return;
        if (!this._audio.ended) return;
        this._audio.currentTime = 0;
    }

    private _loadVolume(): number {
        const stored = localStorage.getItem(VOLUME_KEY);
        return stored === null ? 1 : Number(stored);
    }

    private _saveVolume(volume: number): void {
        localStorage.setItem(VOLUME_KEY, String(volume));
    }

    private _clampVolume(value: number): number {
        return Math.min(Math.max(value, 0), 1);
    }
}