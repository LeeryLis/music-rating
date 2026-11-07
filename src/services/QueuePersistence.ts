import type { Plugin } from "obsidian";
import type { MusicRatingSettings, PersistedQueue } from "../types";

interface PluginData extends MusicRatingSettings {
    queueState?: PersistedQueue | null;
}

export class QueuePersistence {
    private _state: PersistedQueue | null = null;

    constructor(
        private _plugin: Plugin,
        private _getSettings: () => MusicRatingSettings
    ) { }

    get state(): PersistedQueue | null { return this._state; }
    set state(value: PersistedQueue | null) { this._state = value; }

    async load(): Promise<{ settings: Partial<MusicRatingSettings> }> {
        const raw = (await this._plugin.loadData()) as Partial<PluginData> | null;
        const { queueState, ...settingsRaw } = raw ?? {};
        this._state = queueState ?? null;
        return { settings: settingsRaw };
    }

    async save(): Promise<void> {
        const data: PluginData = {
            ...this._getSettings(),
            queueState: this._state,
        };
        await this._plugin.saveData(data);
    }
}