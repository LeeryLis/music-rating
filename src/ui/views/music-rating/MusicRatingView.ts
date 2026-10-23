import { ItemView, WorkspaceLeaf } from "obsidian";
import { t } from "../../../i18n";
import { MusicPlayer } from "../../../models/MusicPlayer";
import { QueueModel } from "../../../models/QueueModel";
import { RatingStore } from "../../../models/RatingStore";
import type { TrackRepository } from "../../../models/TrackRepository";
import type { MusicRatingSettings, PersistedQueue, TrackLike, ViewTab } from "../../../types";
import { el } from "../../utils/dom";
import { TrackCreateModal } from "../../modals/TrackCreateModal";
import { TrackEditModal } from "../../modals/TrackEditModal";
import { PlayerController } from "./PlayerController";
import { VaultWatcher } from "./VaultWatcher";
import { ViewRenderer } from "./ViewRenderer";
import { formatArtist } from "../../../utils/wikilink";
import { ConfirmDeleteModal } from "../../modals/ConfirmDeleteModal";

export const VIEW_TYPE_MUSIC_RATING = "music-rating-view";

export class MusicRatingView extends ItemView {
    private _player = new MusicPlayer(this.app);
    private _store = new RatingStore(this.app);
    private _queue: QueueModel;
    private _tab: ViewTab = "rating";

    private _rootEl!: HTMLElement;
    private _audioHost!: HTMLElement;

    private _playerCtl!: PlayerController;
    private _vaultWatcher!: VaultWatcher;
    private _renderer!: ViewRenderer;

    constructor(
        leaf: WorkspaceLeaf,
        private _settings: MusicRatingSettings,
        private _repo: TrackRepository,
        initialState: PersistedQueue | null,
        onStateChange: (s: PersistedQueue) => void
    ) {
        super(leaf);
        this._queue = new QueueModel(_repo, initialState, onStateChange);
    }

    getViewType(): string {
        return VIEW_TYPE_MUSIC_RATING;
    }
    getDisplayText(): string {
        return t("view.title");
    }
    getIcon(): string {
        return "music";
    }

    async onOpen(): Promise<void> {
        this._setupDom();
        this._queue.initialize();
        this._queue.onTrackChanged = () => this._handleTrackChanged();
        this._setupControllers();
        this._bindPlayer();
        this._startWatcher();
        this._render();
    }

    async onClose(): Promise<void> {
        this._queue.onTrackChanged = null;
        this._vaultWatcher?.stop();
        this._player.onEnded = null;
        this._player.destroy();
        this.contentEl.empty();
    }

    next(): void {
        if (!this._queue.next()) return;
        this._playerCtl.playCurrent();
        this._render();
    }

    prev(): void {
        if (!this._queue.prev()) return;
        this._playerCtl.playCurrent();
        this._render();
    }

    rebuild(): void {
        this._queue.refresh();
        this._render();
    }

    private _setupDom(): void {
        this.contentEl.addClass("music-rating-view");
        this.contentEl.empty();

        this._audioHost = el("div", "music-rating-audio-host");
        this._audioHost.appendChild(this._player.getElement());
        this.contentEl.appendChild(this._audioHost);

        this._rootEl = el("div", "music-rating-root");
        this.contentEl.appendChild(this._rootEl);
    }

    private _handleTrackChanged(): void {
        if (!this._queue.currentTrack) return;
        if (this._player.isPlaying()) this._playerCtl.playCurrent();
        else this._playerCtl.loadCurrent();
    }

    private _setupControllers(): void {
        this._playerCtl = new PlayerController(
            this._player,
            this._queue,
            this._repo,
            () => this._render()
        );
        this._vaultWatcher = new VaultWatcher(
            this.app,
            this._repo,
            () => this._handleVaultChange()
        );
        this._renderer = new ViewRenderer(this._buildRendererDeps());
    }

    private _buildRendererDeps() {
        return {
            queue: this._queue,
            player: this._player,
            repo: this._repo,
            store: this._store,
            settings: this._settings,
            getTab: () => this._tab,
            onTabChange: (tab: ViewTab) => this._handleTabChange(tab),
            onEdit: () => this._openEdit(),
            onCreate: () => this._openCreate(),
            onDeleteTrack: () => this._confirmDeleteCurrentTrack(),
            onRerender: () => this._render(),
            onPrev: () => this.prev(),
            onNext: () => this.next(),
            onSelectTrack: () => this._handleSelectTrack(),
            onMissingFile: () => this._playerCtl.handleMissingFile(),
        };
    }

    private _confirmDeleteCurrentTrack(): void {
        const track = this._queue.currentTrack;
        if (!track) return;

        new ConfirmDeleteModal(this.app, {
            title: t("track.deleteConfirmTitle"),
            message: t("track.deleteConfirmMessage", {
                artist: formatArtist(track.artist),
                title: track.title,
            }),
            confirmLabel: t("common.delete"),
            onConfirm: () => void this._deleteCurrentTrack(track),
        }).open();
    }

    private async _deleteCurrentTrack(track: TrackLike): Promise<void> {
        await this._repo.deleteTrack(track);
        this._queue.refresh();

        if (!this._queue.currentTrack) {
            this._playerCtl.stop();
        } else {
            this._playerCtl.playCurrent();
        }
        this._render();
    }

    private _bindPlayer(): void {
        this._player.onEnded = () => this._playerCtl.onEnded();
        this._playerCtl.loadCurrent();
    }

    private _startWatcher(): void {
        this._vaultWatcher.start();
    }

    private _handleTabChange(tab: ViewTab): void {
        this._tab = tab;
        this._render();
    }

    private _handleVaultChange(): void {
        this._queue.refresh();
        this._render();
    }

    private _handleSelectTrack(): void {
        this._playerCtl.playCurrent();
        this._render();
    }

    private _render(): void {
        this._renderer.render(this._rootEl);
    }

    private _openEdit(): void {
        const track = this._queue.currentTrack;
        if (!track) return;
        new TrackEditModal(this.app, track, this._store, this._repo, () => this._handleVaultChange()).open();
    }

    private _openCreate(): void {
        new TrackCreateModal(this.app, this._repo, () => this._handleVaultChange()).open();
    }
}