import { App, PluginSettingTab, Setting } from "obsidian";
import { setLocale, t } from "../../i18n";
import type { LocaleSetting } from "../../i18n/types";
import type MusicRatingPlugin from "../../main";
import { DEFAULT_SETTINGS } from "../../types";
import { FolderSuggest } from "../utils/suggest/FolderSuggest";

export class MusicRatingSettingTab extends PluginSettingTab {
    plugin: MusicRatingPlugin;

    constructor(app: App, plugin: MusicRatingPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        this._addLanguageSetting(containerEl);
        this._addMusicFolderSetting(containerEl);
        this._addAudioFolderSetting(containerEl);
        this._addArtistsIndexNameSetting(containerEl);
        this._addShowNoticeSetting(containerEl);
        this._addAdvanceOnRateSetting(containerEl);
    }

    private _addLanguageSetting(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(t("settings.language.name"))
            .setDesc(t("settings.language.desc"))
            .addDropdown((d) =>
                d
                    .addOption("auto", t("settings.language.auto"))
                    .addOption("en", "English")
                    .addOption("ru", "Русский")
                    .setValue(this.plugin.settings.language)
                    .onChange(async (value) => {
                        this.plugin.settings.language = value as LocaleSetting;
                        setLocale(this.plugin.settings.language);
                        await this.plugin.saveSettings();
                        this.display();
                    })
            );
    }

    private _addMusicFolderSetting(containerEl: HTMLElement): void {
        this._addFolderText(
            containerEl,
            t("settings.musicFolder.name"),
            t("settings.musicFolder.desc"),
            "Music",
            this.plugin.settings.musicFolder,
            (v) => { this.plugin.settings.musicFolder = v; }
        );
    }

    private _addAudioFolderSetting(containerEl: HTMLElement): void {
        this._addFolderText(
            containerEl,
            t("settings.audioFolder.name"),
            t("settings.audioFolder.desc"),
            "Music/Audio",
            this.plugin.settings.audioFolder,
            (v) => { this.plugin.settings.audioFolder = v; }
        );
    }

    private _addArtistsIndexNameSetting(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(t("settings.artistsIndexName.name"))
            .setDesc(t("settings.artistsIndexName.desc"))
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.artistsIndexName)
                    .setValue(this.plugin.settings.artistsIndexName)
                    .onChange(async (value) => {
                        this.plugin.settings.artistsIndexName =
                            value.trim() || DEFAULT_SETTINGS.artistsIndexName;
                        await this.plugin.saveSettings();
                    })
            );
    }

    private _addShowNoticeSetting(containerEl: HTMLElement): void {
        this._addToggle(
            containerEl,
            t("settings.showNotice.name"),
            null,
            this.plugin.settings.showNoticeOnRate,
            (v) => { this.plugin.settings.showNoticeOnRate = v; }
        );
    }

    private _addAdvanceOnRateSetting(containerEl: HTMLElement): void {
        this._addToggle(
            containerEl,
            t("settings.advanceOnRate.name"),
            t("settings.advanceOnRate.desc"),
            this.plugin.settings.advanceOnRate,
            (v) => { this.plugin.settings.advanceOnRate = v; }
        );
    }

    private _addFolderText(
        containerEl: HTMLElement,
        name: string,
        desc: string,
        placeholder: string,
        value: string,
        apply: (v: string) => void
    ): void {
        new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addText((text) => {
                text
                    .setPlaceholder(placeholder)
                    .setValue(value)
                    .onChange(async (v) => {
                        apply(v.trim());
                        await this.plugin.saveSettings();
                    });
                new FolderSuggest(this.app, text.inputEl);
            });
    }

    private _addToggle(
        containerEl: HTMLElement,
        name: string,
        desc: string | null,
        value: boolean,
        apply: (v: boolean) => void
    ): void {
        const setting = new Setting(containerEl).setName(name);
        if (desc != null) setting.setDesc(desc);
        setting.addToggle((toggle) =>
            toggle
                .setValue(value)
                .onChange(async (v) => {
                    apply(v);
                    await this.plugin.saveSettings();
                })
        );
    }
}