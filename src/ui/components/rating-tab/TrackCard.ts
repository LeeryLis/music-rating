import { Notice } from "obsidian";
import { t } from "../../../i18n";
import type { MusicPlayer } from "../../../models/MusicPlayer";
import type { QueueModel } from "../../../models/QueueModel";
import type { RatingStore } from "../../../models/RatingStore";
import type { TrackRepository } from "../../../models/TrackRepository";
import type { MusicRatingSettings, TrackLike } from "../../../types";
import { formatArtist } from "../../../utils/wikilink";
import { arrowButton, button } from "../../utils/buttons";
import { el } from "../../utils/dom";
import { applyRatingTier } from "../../utils/rating";
import { AudioControls } from "../player/AudioControls";
import { renderRatingScale } from "./RatingScale";

export interface TrackCardContext {
    track: TrackLike;
    queue: QueueModel;
    player: MusicPlayer;
    repo: TrackRepository;
    store: RatingStore;
    settings: MusicRatingSettings;
    onChanged: () => void;
    onPrev: () => void;
    onNext: () => void;
    onMissingFile: () => void;
}

export function renderTrackCard(ctx: TrackCardContext): HTMLElement {
    const card = el("div", "music-rating-card");
    card.appendChild(_renderHeader(ctx));
    card.appendChild(_renderPlayer(ctx));
    card.appendChild(_renderRating(ctx));
    card.appendChild(_renderActions(ctx));
    return card;
}

function _renderHeader(ctx: TrackCardContext): HTMLElement {
    const { track, queue } = ctx;
    const header = el("div", "music-header");

    const left = el("div", "music-header-left");
    const { index, total } = queue.position;
    left.appendChild(
        el("div", "music-header-meta", total ? `#${index + 1} / ${total}` : "—")
    );
    left.appendChild(el("h2", "music-title", track.title));
    left.appendChild(el("div", "music-rating-artist", formatArtist(track.artist)));
    header.appendChild(left);

    header.appendChild(_renderRatingBadge(track));
    return header;
}

function _renderRatingBadge(track: TrackLike): HTMLElement {
    const text = String(track.rating ?? t("common.empty"));
    const badge = el("div", "music-rating-badge", text);
    applyRatingTier(badge, track.rating ?? null);
    return badge;
}

function _renderPlayer(ctx: TrackCardContext): HTMLElement {
    const { track, player, repo, onMissingFile } = ctx;
    const box = el("div", "music-rating-player");

    const file = repo.resolveLocalFile(track);
    if (!file) {
        box.classList.add("is-empty");
        onMissingFile();
        return box;
    }

    const controls = new AudioControls(player);
    box.appendChild(controls.element());
    return box;
}

function _renderRating(ctx: TrackCardContext): HTMLElement {
    const { track, store, settings, onChanged, onNext } = ctx;
    const current = typeof track.rating === "number" ? track.rating : 0;

    return renderRatingScale({
        current,
        onRate: (value) => _handleRate(ctx, value),
        onClear: () => _handleClear(ctx),
    });
}

async function _handleRate(ctx: TrackCardContext, value: number): Promise<void> {
    const { track, store, settings, onChanged, onNext } = ctx;
    await store.saveRating(track, value);
    if (settings.showNoticeOnRate) {
        new Notice(t("notice.ratingSaved", { value }));
    }
    if (settings.advanceOnRate) onNext();
    else onChanged();
}

async function _handleClear(ctx: TrackCardContext): Promise<void> {
    const { track, store, onChanged } = ctx;
    await store.clearRating(track);
    new Notice(t("notice.ratingCleared"));
    onChanged();
}

function _renderActions(ctx: TrackCardContext): HTMLElement {
    const { track, player, onPrev, onNext } = ctx;
    const actions = el("div", "music-actions");

    actions.appendChild(arrowButton("left", onPrev));
    actions.appendChild(_renderYoutubeButton(track, player));
    actions.appendChild(arrowButton("right", onNext));

    return actions;
}

function _renderYoutubeButton(track: TrackLike, player: MusicPlayer): HTMLButtonElement {
    const url = track.youtube_link?.trim();
    const hasYt = !!url && url !== "-";
    const btn = button(t("youtube.open"), () => player.playYoutube(url));
    btn.className = "music-action-btn music-action-youtube";
    if (!hasYt) {
        btn.classList.add("none");
        btn.disabled = true;
    }
    return btn;
}