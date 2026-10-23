import { App, TFile, TFolder, normalizePath } from "obsidian";
import type { TrackLike, TrackMetaInput } from "../types";
import { parseWikilink, wikilinkFileName } from "../utils/wikilink";
import { FM, FM_TYPE } from "../frontmatter";

const ARTISTS_DIR = "Artists";
const TRACKS_DIR = "Tracks";
const DEFAULT_ARTISTS_INDEX = "Artists";
const AUDIO_EXT = /\.(mp3|flac|ogg|wav|m4a|aac|opus)$/i;

export class TrackRepository {
    constructor(
        private _app: App,
        private _getMusicFolder: () => string,
        private _getAudioFolder?: () => string,
        private _getArtistsIndexName?: () => string
    ) { }

    rootPath(): string {
        return normalizePath(this._getMusicFolder().replace(/\/+$/, ""));
    }

    artistsPath(): string {
        return normalizePath(`${this.rootPath()}/${ARTISTS_DIR}`);
    }

    tracksPath(): string {
        return normalizePath(`${this.rootPath()}/${TRACKS_DIR}`);
    }

    audioPath(): string {
        return normalizePath(
            (this._getAudioFolder?.() ?? this._getMusicFolder()).replace(/\/+$/, "")
        );
    }

    artistsIndexPath(): string {
        return normalizePath(
            `${this.rootPath()}/${this._safeName(this._configuredArtistsIndexName())}.md`
        );
    }

    trackFilePath(artist: string, title: string): string {
        return normalizePath(
            `${this.tracksPath()}/${this._safeName(artist)}/${this._safeName(title)}.md`
        );
    }

    artistsNoteFor(artist: string): string {
        return normalizePath(`${this.artistsPath()}/${this._safeName(artist)}.md`);
    }

    tracksDirFor(artist: string): string {
        return normalizePath(`${this.tracksPath()}/${this._safeName(artist)}`);
    }

    collectTracks(): TrackLike[] {
        const prefix = this._trackPrefix();
        return this._app.vault
            .getMarkdownFiles()
            .filter((f) => f.path.startsWith(prefix))
            .map((f) => this.readTrack(f))
            .filter((t): t is TrackLike => t !== null);
    }

    readTrack(file: TFile): TrackLike | null {
        const fm = this._app.metadataCache.getFileCache(file)?.frontmatter;
        if (!fm || fm[FM.type] !== FM_TYPE.track) return null;
        return this._toTrack(file, fm);
    }

    findTrackByPath(path: string): TrackLike | null {
        const file = this._app.vault.getAbstractFileByPath(path);
        return file instanceof TFile ? this.readTrack(file) : null;
    }

    resolveLocalFile(track: TrackLike): TFile | null {
        if (!track.local_file?.path) return null;

        const direct = this._app.vault.getAbstractFileByPath(track.local_file.path);
        if (direct instanceof TFile) return direct;

        return this._findAudioFileByName(track.local_file.path);
    }

    listArtists(): string[] {
        const prefix = this._artistPrefix();
        return this._app.vault
            .getMarkdownFiles()
            .filter((f) => f.path.startsWith(prefix))
            .map((f) => f.basename)
            .sort((a, b) => a.localeCompare(b));
    }

    findAudioByTemplate(artist: string, title: string): string | null {
        const prefix = this._audioPrefix();
        const template = `${artist} - ${title}`.toLowerCase();

        for (const file of this._app.vault.getFiles()) {
            if (!AUDIO_EXT.test(file.path)) continue;
            if (!file.path.startsWith(prefix)) continue;
            if (file.basename.toLowerCase() === template) return file.path;
        }
        return null;
    }

    async ensureBaseFolders(): Promise<void> {
        await this._ensureFolder(this.artistsPath());
        await this._ensureFolder(this.tracksPath());
        await this._ensureArtistsIndex();
    }

    async createArtistIfMissing(artist: string): Promise<void> {
        const path = this.artistsNoteFor(artist);
        if (this._app.vault.getAbstractFileByPath(path)) return;
        await this._app.vault
            .create(path, this._serializeArtist(this._actualArtistsIndexName()))
            .catch(() => { });
    }

    async createTrack(input: TrackMetaInput): Promise<TFile | null> {
        await this.ensureBaseFolders();
        await this.createArtistIfMissing(input.artist);

        const dir = this.tracksDirFor(input.artist);
        await this._ensureFolder(dir);

        const path = this.trackFilePath(input.artist, input.title);
        if (this._app.vault.getAbstractFileByPath(path)) return null;

        return this._app.vault.create(path, this._serializeTrack(input));
    }

    async deleteTrack(track: TrackLike): Promise<void> {
        const artist = parseWikilink(track.artist ?? "");
        const trackPath = track.file.path;
        await this._app.vault.delete(track.file);

        if (!artist) return;
        await this._deleteArtistIfEmpty(artist);
    }

    async renameArtist(oldName: string, newName: string): Promise<void> {
        if (!oldName || !newName || oldName === newName) return;

        await this._renameArtistNote(oldName, newName);
        await this._renameArtistFolder(oldName, newName);
        await this._updateArtistFrontmatter(newName);
    }

    private async _renameArtistNote(oldName: string, newName: string): Promise<void> {
        const oldPath = this.artistsNoteFor(oldName);
        const newPath = this.artistsNoteFor(newName);
        const file = this._app.vault.getAbstractFileByPath(oldPath);
        if (!(file instanceof TFile)) return;
        await this._app.fileManager.renameFile(file, newPath).catch(() => { });
    }

    private async _renameArtistFolder(oldName: string, newName: string): Promise<void> {
        const oldPath = this.tracksDirFor(oldName);
        const newPath = this.tracksDirFor(newName);
        const folder = this._app.vault.getAbstractFileByPath(oldPath);
        if (!(folder instanceof TFolder)) return;
        await this._app.fileManager.renameFile(folder, newPath).catch(() => { });
    }

    private async _updateArtistFrontmatter(newName: string): Promise<void> {
        const prefix = this.tracksDirFor(newName).replace(/\/+$/, "") + "/";
        const tracks = this._app.vault
            .getMarkdownFiles()
            .filter((f) => f.path.startsWith(prefix));

        for (const file of tracks) {
            if (!this._needsArtistUpdate(file, newName)) continue;
            await this._app.fileManager.processFrontMatter(file, (fm) => {
                fm[FM.artist] = `[[${newName}]]`;
            });
        }
    }

    private _needsArtistUpdate(file: TFile, newName: string): boolean {
        const fm = this._app.metadataCache.getFileCache(file)?.frontmatter;
        if (!fm || fm[FM.type] !== FM_TYPE.track) return false;
        const current = fm[FM.artist] as string | undefined;
        if (!current) return false;
        return parseWikilink(current) !== newName;
    }

    private async _deleteArtistIfEmpty(artist: string): Promise<void> {
        if (!this._isArtistTracksDirEmpty(artist)) return;

        const artistNote = this._app.vault.getAbstractFileByPath(this.artistsNoteFor(artist));
        if (artistNote) await this._app.vault.delete(artistNote).catch(() => { });

        const artistDir = this._app.vault.getAbstractFileByPath(this.tracksDirFor(artist));
        if (artistDir instanceof TFolder) {
            await this._app.vault.delete(artistDir, true).catch(() => { });
        }
    }

    private _isArtistTracksDirEmpty(artist: string): boolean {
        const dir = this.tracksDirFor(artist);
        const prefix = dir + "/";
        return !this._app.vault
            .getMarkdownFiles()
            .some((f) => f.path.startsWith(prefix));
    }

    private async _ensureArtistsIndex(): Promise<void> {
        if (this._findArtistsIndex()) return;

        const path = this.artistsIndexPath();
        await this._app.vault.create(path, this._serializeArtistsIndex()).catch(() => { });
    }

    private _findArtistsIndex(): TFile | null {
        const root = this.rootPath();
        const configuredPath = this.artistsIndexPath();

        for (const file of this._app.vault.getMarkdownFiles()) {
            if (file.parent?.path !== root) continue;
            if (file.path === configuredPath) return file;
            const fm = this._app.metadataCache.getFileCache(file)?.frontmatter;
            if (fm?.[FM.type] === FM_TYPE.artistsIndex) return file;
        }
        return null;
    }

    private _actualArtistsIndexName(): string {
        return this._findArtistsIndex()?.basename ?? this._configuredArtistsIndexName();
    }

    private _configuredArtistsIndexName(): string {
        return this._getArtistsIndexName?.() || DEFAULT_ARTISTS_INDEX;
    }

    private _findAudioFileByName(name: string): TFile | null {
        const wanted = normalizePath(name);
        const prefix = this._audioPrefix();
        for (const file of this._app.vault.getFiles()) {
            if (!file.path.startsWith(prefix)) continue;
            if (file.path === wanted || file.name === wanted) return file;
        }
        return null;
    }

    private async _ensureFolder(path: string): Promise<void> {
        if (this._app.vault.getAbstractFileByPath(path)) return;
        await this._app.vault.createFolder(path).catch(() => { });
    }

    private _toTrack(file: TFile, fm: Record<string, unknown>): TrackLike {
        return {
            file,
            artist: fm[FM.artist] as string | undefined,
            title: file.basename,
            rating: this._normalizeRating(fm[FM.rating]),
            local_file: this._resolveLink(fm[FM.localFile]),
            youtube_link: fm[FM.youtubeLink] as string | undefined,
        };
    }

    private _normalizeRating(raw: unknown): number | null {
        if (raw == null) return null;
        if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;

        const text = String(raw).trim();
        if (text === "" || text === "-") return null;

        const value = Number(text);
        return Number.isFinite(value) ? value : null;
    }

    private _resolveLink(link: unknown): { path: string } | undefined {
        if (!link) return undefined;
        if (this._isPathObject(link)) return { path: link.path };

        const inner = parseWikilink(String(link));
        const direct = this._app.vault.getAbstractFileByPath(inner);
        return { path: direct?.path ?? inner };
    }

    private _isPathObject(value: unknown): value is { path: string } {
        return typeof value === "object"
            && value !== null
            && "path" in value
            && typeof (value as { path: unknown }).path === "string";
    }

    private _serializeArtist(indexName: string): string {
        return [
            "---",
            `${FM.type}: ${FM_TYPE.artist}`,
            `${FM.moc}:`,
            `  - "[[${indexName}]]"`,
            "---",
            "",
        ].join("\n");
    }

    private _serializeArtistsIndex(): string {
        return [
            "---",
            `${FM.type}: ${FM_TYPE.artistsIndex}`,
            "---",
            "",
            "# Artists",
            "",
        ].join("\n");
    }

    private _serializeTrack(input: TrackMetaInput): string {
        const lines: string[] = [
            "---",
            `${FM.type}: ${FM_TYPE.track}`,
            `${FM.artist}: "[[${input.artist}]]"`,
            `${FM.rating}:`,
        ];

        if (input.localFileLink.trim()) {
            lines.push(`${FM.localFile}: "[[${wikilinkFileName(input.localFileLink)}]]"`);
        }
        if (input.youtubeLink.trim()) {
            lines.push(`${FM.youtubeLink}: ${input.youtubeLink.trim()}`);
        }

        lines.push("---", "");
        return lines.join("\n");
    }

    private _trackPrefix(): string {
        return this.tracksPath() + "/";
    }

    private _artistPrefix(): string {
        return this.artistsPath() + "/";
    }

    private _audioPrefix(): string {
        return this.audioPath() + "/";
    }

    private _safeName(name: string): string {
        return name
            .replace(/[\\/:*?"<>|#^[\]]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }
}