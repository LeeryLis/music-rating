import { Plugin, WorkspaceLeaf } from "obsidian";
import { setLocale, t } from "./i18n";
import { TrackRepository } from "./models/TrackRepository";
import { MusicRatingView, VIEW_TYPE_MUSIC_RATING } from "./ui/views/music-rating/MusicRatingView";
import { MusicRatingSettingTab } from "./ui/settings/MusicRatingSettingsTab";
import { TrackCreateModal } from "./ui/modals/TrackCreateModal";
import { DEFAULT_SETTINGS, MusicRatingSettings } from "./types";
import { PlaybackService } from "./services/PlaybackService";
import { QueuePersistence } from "./services/QueuePersistence";

export default class MusicRatingPlugin extends Plugin {
    settings: MusicRatingSettings = { ...DEFAULT_SETTINGS };

    repo!: TrackRepository;
    playback!: PlaybackService;

    private _persistence!: QueuePersistence;

    async onload(): Promise<void> {
        await this._loadData();

        this._setupRepository();
        this._setupPlayback();

        this._registerView();
        this._registerRibbon();
        this._registerCommands();
        this.addSettingTab(new MusicRatingSettingTab(this.app, this));
    }

    onunload(): void {
        this.playback?.destroy();
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_MUSIC_RATING);
    }

    async saveSettings(): Promise<void> {
        await this._persistence.save();
    }

    private async _loadData() {
        this._persistence = new QueuePersistence(this, () => this.settings);
        const { settings } = await this._persistence.load();
        this.settings = { ...DEFAULT_SETTINGS, ...settings };
        setLocale(this.settings.language);
    }

    private _setupRepository() {
        this.repo = new TrackRepository(
            this.app,
            () => this.settings.musicFolder,
            () => this.settings.audioFolder,
            () => this.settings.artistsIndexName
        );
    }

    private _setupPlayback() {
        this.playback = new PlaybackService({
            app: this.app,
            repo: this.repo,
            initialQueue: this._persistence.state,
            onQueuePersist: (state) => {
                this._persistence.state = state;
                void this._persistence.save();
            },
            onChanged: () => this._rebuildAllViews(),
        });
        void this.playback.start();
    }

    private _registerView(): void {
        this.registerView(
            VIEW_TYPE_MUSIC_RATING,
            (leaf) => new MusicRatingView(
                leaf,
                this.settings,
                this.repo,
                this.playback.queue,
                this.playback.player,
            )
        );
    }

    private _registerRibbon(): void {
        this.addRibbonIcon("music", t("plugin.ribbon"), () => void this._activateView());
    }

    private _registerCommands(): void {
        this.addCommand({
            id: "open",
            name: t("plugin.openCommand"),
            callback: () => void this._activateView(),
        });
        this.addCommand({
            id: "create-track",
            name: t("track.add"),
            callback: () => this._createTrack(),
        });
    }

    private async _activateView(): Promise<void> {
        const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_MUSIC_RATING);
        if (existing.length) {
            await this.app.workspace.revealLeaf(existing[0]);
            return;
        }
        const leaf: WorkspaceLeaf = this.app.workspace.getLeaf("tab");
        await leaf.setViewState({ type: VIEW_TYPE_MUSIC_RATING, active: true });
        await this.app.workspace.revealLeaf(leaf);
    }

    private _createTrack(): void {
        new TrackCreateModal(this.app, this.repo, () => this._rebuildAllViews()).open();
    }

    private _getViews(): MusicRatingView[] {
        return this.app.workspace
            .getLeavesOfType(VIEW_TYPE_MUSIC_RATING)
            .map((leaf) => leaf.view)
            .filter((view): view is MusicRatingView => view instanceof MusicRatingView);
    }

    private _rebuildAllViews(): void {
        for (const view of this._getViews()) view.rebuild();
    }
}