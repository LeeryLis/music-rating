import { t } from "../../../i18n";
import type { MusicPlayer } from "../../../models/MusicPlayer";
import type { QueueModel } from "../../../models/QueueModel";
import type { TrackRepository } from "../../../models/TrackRepository";
import { formatArtist } from "../../../utils/wikilink";
import { iconButton } from "../../utils/buttons";
import { el } from "../../utils/dom";
import { applyRatingTier } from "../../utils/rating";

export interface TrackListContext {
    queue: QueueModel;
    repo: TrackRepository;
    player: MusicPlayer;
    onSelect: (path: string) => void;
    onRerender: () => void;
}

export function renderTrackList(ctx: TrackListContext): HTMLElement {
    const wrap = el("div", "music-track-list");
    const active = ctx.queue.active;

    if (!active.queue.length) {
        wrap.appendChild(el("div", "music-rating-empty", t("view.empty.noTracks")));
        return wrap;
    }

    active.queue.forEach((path, i) => {
        const track = ctx.repo.findTrackByPath(path);
        if (!track) return;
        wrap.appendChild(_renderRow(ctx, track, path, i, active.index));
    });

    return wrap;
}

function _renderRow(
    ctx: TrackListContext,
    track: NonNullable<ReturnType<TrackRepository["findTrackByPath"]>>,
    path: string,
    index: number,
    currentIndex: number
): HTMLElement {
    const row = el("div", "music-track-row");
    if (index === currentIndex) row.classList.add("is-current");

    row.appendChild(el("div", "music-track-num", String(index + 1)));
    row.appendChild(_renderPlayButton(ctx, path, index, currentIndex));
    row.appendChild(_renderTitle(track));
    row.appendChild(_renderRating(track));

    row.addEventListener("dblclick", () => ctx.onSelect(path));
    return row;
}

function _renderPlayButton(
    ctx: TrackListContext,
    path: string,
    index: number,
    currentIndex: number
): HTMLButtonElement {
    const isPlaying = index === currentIndex && ctx.player.isPlaying();
    return iconButton(
        isPlaying ? "pause" : "play",
        t("track.playPause"),
        () => _handlePlayClick(ctx, path, index, currentIndex),
        "music-track-btn"
    );
}

function _handlePlayClick(
    ctx: TrackListContext,
    path: string,
    index: number,
    currentIndex: number
): void {
    if (index !== currentIndex) {
        ctx.onSelect(path);
        return;
    }
    if (ctx.player.isPlaying()) ctx.player.pause();
    else ctx.player.play();
    ctx.onRerender();
}

function _renderTitle(track: { artist?: string; title: string }): HTMLElement {
    const title = el("div", "music-track-title");
    title.appendChild(el("span", "music-track-artist", formatArtist(track.artist)));
    title.appendChild(el("span", "music-track-sep", " — "));
    title.appendChild(el("span", "music-track-name", track.title));
    return title;
}

function _renderRating(track: { rating?: number | null }): HTMLElement {
    const text = typeof track.rating === "number"
        ? String(track.rating)
        : t("common.empty");
    const ratingEl = el("div", "music-track-rating", text);
    applyRatingTier(ratingEl, track.rating ?? null);
    return ratingEl;
}