import { Plugin, WorkspaceLeaf } from "obsidian";
import { setLocale, t } from "./i18n";
import { TrackRepository } from "./models/TrackRepository";
import { MusicRatingView, VIEW_TYPE_MUSIC_RATING } from "./ui/views/music-rating/MusicRatingView";
import { MusicRatingSettingTab } from "./ui/settings/MusicRatingSettingsTab";
import { TrackCreateModal } from "./ui/modals/TrackCreateModal";
import { DEFAULT_SETTINGS, MusicRatingSettings, PersistedQueue } from "./types";

interface PluginData extends MusicRatingSettings {
    queueState?: PersistedQueue | null;
}

export default class MusicRatingPlugin extends Plugin {
    settings: MusicRatingSettings = { ...DEFAULT_SETTINGS };
    private _repo!: TrackRepository;
    private _queueState: PersistedQueue | null = null;

    async onload(): Promise<void> {
        await this._loadData();
        this._setupRepository();
        this._registerView();
        this._registerRibbon();
        this._registerCommands();
        this.addSettingTab(new MusicRatingSettingTab(this.app, this));
    }

    onunload(): void {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_MUSIC_RATING);
    }

    async saveSettings(): Promise<void> {
        await this._saveData();
    }

    private _setupRepository(): void {
        this._repo = new TrackRepository(
            this.app,
            () => this.settings.musicFolder,
            () => this.settings.audioFolder,
            () => this.settings.artistsIndexName
        );
    }

    private _registerView(): void {
        this.registerView(
            VIEW_TYPE_MUSIC_RATING,
            (leaf) =>
                new MusicRatingView(
                    leaf,
                    this.settings,
                    this._repo,
                    this._queueState,
                    (state) => this._handleQueueStateChange(state)
                )
        );
    }

    private _registerRibbon(): void {
        this.addRibbonIcon("music", t("plugin.ribbon"), () => {
            void this._activateView();
        });
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
        new TrackCreateModal(this.app, this._repo, () => this._rebuildAllViews()).open();
    }

    private _handleQueueStateChange(state: PersistedQueue): void {
        this._queueState = state;
        void this._saveData();
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

    private async _loadData(): Promise<void> {
        const raw = (await this.loadData()) as Partial<PluginData> | null;
        const { queueState, ...settingsRaw } = raw ?? {};
        this.settings = { ...DEFAULT_SETTINGS, ...settingsRaw };
        this._queueState = queueState ?? null;
        setLocale(this.settings.language);
    }

    private async _saveData(): Promise<void> {
        const data: PluginData = {
            ...this.settings,
            queueState: this._queueState,
        };
        await this.saveData(data);
    }
}