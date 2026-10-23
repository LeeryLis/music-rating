import { t } from "../i18n";

export function parseWikilink(value: string): string {
    const m = value.match(/\[\[(.*?)(\|.*?)?\]\]/);
    return (m ? m[1] : value).trim();
}

export function wikilinkFileName(value: string): string {
    const inner = parseWikilink(value);
    const parts = inner.split("/");
    return parts[parts.length - 1];
}

export function formatArtist(raw?: string): string {
    if (!raw) return t("common.artist.unknown");
    return parseWikilink(raw);
}