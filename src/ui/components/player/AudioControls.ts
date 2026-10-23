import { setIcon } from "obsidian";
import type { MusicPlayer } from "../../../models/MusicPlayer";
import { formatDuration } from "../../../utils/format";
import { el } from "../../utils/dom";
import { makeButton } from "../../utils/buttons";

export class AudioControls {
    private _root: HTMLElement;
    private _playBtn: HTMLButtonElement;
    private _playIcon: HTMLElement;
    private _bar: HTMLElement;
    private _fill!: HTMLElement;
    private _timeEl: HTMLElement;
    private _volumeIcon: HTMLButtonElement;
    private _volumeIconWrap: HTMLElement;
    private _volumeSlider: HTMLInputElement;
    private _dragging = false;

    constructor(private _player: MusicPlayer) {
        this._root = el("div", "music-audio-controls");

        this._playBtn = makeButton({
            cls: "music-audio-btn music-audio-play",
            label: "Play / pause",
            icon: "play",
            onClick: () => this._handlePlayClick(),
        });
        this._playIcon = this._playBtn.querySelector<HTMLElement>(".mr-btn-icon")!;

        this._bar = this._makeBar();
        this._timeEl = el("div", "music-audio-time", "0:00 / 0:00");

        this._volumeIcon = makeButton({
            cls: "music-audio-btn music-audio-volume",
            label: "Mute",
            icon: "volume-2",
            onClick: () => this._handleMuteClick(),
        });
        this._volumeIconWrap = this._volumeIcon.querySelector<HTMLElement>(".mr-btn-icon")!;

        this._volumeSlider = this._makeVolumeSlider();

        this._root.append(
            this._playBtn,
            this._bar,
            this._timeEl,
            this._volumeIcon,
            this._volumeSlider
        );

        this._bindPlayer();
        this._refresh();
        this._refreshVolume();
    }

    element(): HTMLElement { return this._root; }

    refresh(): void { this._refresh(); }

    private _bindPlayer(): void {
        this._player.onTimeUpdate = () => this._refresh();
        this._player.onPlayStateChange = () => this._refresh();
        this._player.onLoaded = () => this._refresh();
        this._player.onVolumeChange = () => this._refreshVolume();
    }

    private _handlePlayClick(): void {
        this._player.toggle();
        this._refresh();
    }

    private _handleMuteClick(): void {
        this._player.toggleMute();
        this._refreshVolume();
    }

    private _refresh(): void {
        setIcon(this._playIcon, this._player.isPlaying() ? "pause" : "play");
        this._updateProgress();
    }

    private _updateProgress(): void {
        const dur = this._player.getDuration();
        const cur = this._player.getCurrentTime();
        const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
        this._fill.style.width = `${pct}%`;
        this._timeEl.textContent = `${formatDuration(cur)} / ${formatDuration(dur)}`;
    }

    private _refreshVolume(): void {
        const muted = this._player.isMuted();
        setIcon(this._volumeIconWrap, muted ? "volume-x" : "volume-2");
        if (document.activeElement === this._volumeSlider) return;
        this._volumeSlider.value = String(muted ? 0 : this._player.getVolume());
    }

    private _makeBar(): HTMLElement {
        const bar = el("div", "music-audio-bar");
        this._fill = el("div", "music-audio-fill");
        bar.appendChild(this._fill);
        this._bindSeekEvents(bar);
        return bar;
    }

    private _bindSeekEvents(bar: HTMLElement): void {
        bar.addEventListener("pointerdown", (e) => this._onPointerDown(bar, e));
        bar.addEventListener("pointermove", (e) => this._onPointerMove(bar, e));
        bar.addEventListener("pointerup", (e) => this._onPointerUp(bar, e));
        bar.addEventListener("pointercancel", () => { this._dragging = false; });
    }

    private _onPointerDown(bar: HTMLElement, e: PointerEvent): void {
        this._dragging = true;
        bar.setPointerCapture(e.pointerId);
        this._seekToPointer(bar, e);
    }

    private _onPointerMove(bar: HTMLElement, e: PointerEvent): void {
        if (!this._dragging) return;
        this._seekToPointer(bar, e);
    }

    private _onPointerUp(bar: HTMLElement, e: PointerEvent): void {
        this._dragging = false;
        bar.releasePointerCapture(e.pointerId);
    }

    private _seekToPointer(bar: HTMLElement, e: PointerEvent): void {
        const rect = bar.getBoundingClientRect();
        const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
        const ratio = rect.width > 0 ? x / rect.width : 0;
        const dur = this._player.getDuration();
        if (dur > 0) this._player.seek(ratio * dur);
    }

    private _makeVolumeSlider(): HTMLInputElement {
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = "0";
        slider.max = "1";
        slider.step = "0.01";
        slider.className = "music-audio-volume-slider";
        slider.value = String(this._player.getVolume());
        slider.addEventListener("input", () => this._onVolumeInput(slider));
        return slider;
    }

    private _onVolumeInput(slider: HTMLInputElement): void {
        this._player.setVolume(Number(slider.value));
        this._refreshVolume();
    }
}