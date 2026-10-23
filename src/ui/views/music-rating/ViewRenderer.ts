import { t } from "../../../i18n";
import type { MusicPlayer } from "../../../models/MusicPlayer";
import type { QueueModel } from "../../../models/QueueModel";
import type { RatingStore } from "../../../models/RatingStore";
import type { TrackRepository } from "../../../models/TrackRepository";
import type { MusicRatingSettings, ViewTab } from "../../../types";
import { el } from "../../utils/dom";
import { iconButton } from "../../utils/buttons";
import { renderTrackCard } from "../../components/rating-tab/TrackCard";
import { renderSidebar } from "../../components/rating-tab/Sidebar";
import { renderEmptyForMode } from "../../components/rating-tab/EmptyState";
import { renderTrackList } from "../../components/queue-tab/TrackList";

export interface ViewRendererDeps {
    queue: QueueModel;
    player: MusicPlayer;
    repo: TrackRepository;
    store: RatingStore;
    settings: MusicRatingSettings;
    getTab: () => ViewTab;
    onTabChange: (tab: ViewTab) => void;
    onEdit: () => void;
    onCreate: () => void;
    onDeleteTrack: () => void;
    onRerender: () => void;
    onPrev: () => void;
    onNext: () => void;
    onSelectTrack: () => void;
    onMissingFile: () => void;
}

export class ViewRenderer {
    private _queueScrollTop = 0;
    private _focusQueueOnNextRender = false;

    constructor(private _deps: ViewRendererDeps) { }

    focusQueueOnNextRender(): void {
        this._focusQueueOnNextRender = true;
    }

    render(root: HTMLElement): void {
        this._captureQueueScroll(root);

        root.empty();
        root.appendChild(this._renderHeader());
        root.appendChild(this._renderOuter());
    }

    private _captureQueueScroll(root: HTMLElement): void {
        if (this._deps.getTab() !== "queue") return;
        const list = root.querySelector<HTMLElement>(".music-track-list");
        if (list) this._queueScrollTop = list.scrollTop;
    }

    private _renderHeader(): HTMLElement {
        const row = el("div", "music-tabs-row");
        row.appendChild(this._renderTabs());
        row.appendChild(this._renderHeaderActions());
        return row;
    }

    private _renderOuter(): HTMLElement {
        const outer = el("div", "music-rating-outer");
        if (this._deps.getTab() === "rating") {
            outer.appendChild(this._renderSidebar());
        }
        outer.appendChild(this._renderMain());
        return outer;
    }

    private _renderSidebar(): HTMLElement {
        return renderSidebar(this._deps.queue, () => this._deps.onRerender());
    }

    private _renderMain(): HTMLElement {
        const main = el("div", "music-rating-main");
        if (this._deps.getTab() === "rating") this._renderRatingTab(main);
        else this._renderQueueTab(main);
        return main;
    }

    private _renderTabs(): HTMLElement {
        const tabs = el("div", "music-tabs");
        tabs.appendChild(this._makeTab("rating", t("tab.rating")));
        tabs.appendChild(this._makeTab("queue", t("tab.queue")));
        return tabs;
    }

    private _renderHeaderActions(): HTMLElement {
        const actions = el("div", "music-tabs-actions");
        actions.appendChild(iconButton("pencil", t("track.edit"), () => this._deps.onEdit()));
        actions.appendChild(iconButton("plus", t("track.add"), () => this._deps.onCreate()));
        actions.appendChild(
            iconButton("trash-2", t("track.delete"), () => this._deps.onDeleteTrack(), "music-icon-btn-danger")
        );
        return actions;
    }

    private _makeTab(id: ViewTab, label: string): HTMLButtonElement {
        const btn = el("button", "music-tab", label);
        if (this._deps.getTab() === id) btn.classList.add("is-active");
        btn.onclick = () => this._handleTabClick(id);
        return btn;
    }

    private _handleTabClick(id: ViewTab): void {
        if (this._deps.getTab() === id) return;
        this.focusQueueOnNextRender();
        this._deps.onTabChange(id);
    }

    private _renderRatingTab(main: HTMLElement): void {
        const track = this._deps.queue.currentTrack;
        if (!this._deps.queue.position.total || !track) {
            main.appendChild(this._renderRatingEmpty());
            return;
        }
        main.appendChild(this._renderTrackCard());
    }

    private _renderRatingEmpty(): HTMLElement {
        return renderEmptyForMode(this._deps.queue.mode, () => this._handleShowAll());
    }

    private _handleShowAll(): void {
        if (this._deps.queue.mode !== "unrated") return;
        this._deps.queue.toggleMode();
        this._deps.onRerender();
    }

    private _renderTrackCard(): HTMLElement {
        return renderTrackCard({
            track: this._deps.queue.currentTrack!,
            queue: this._deps.queue,
            player: this._deps.player,
            repo: this._deps.repo,
            store: this._deps.store,
            settings: this._deps.settings,
            onChanged: () => this._deps.onRerender(),
            onPrev: () => this._deps.onPrev(),
            onNext: () => this._deps.onNext(),
            onMissingFile: () => this._deps.onMissingFile(),
        });
    }

    private _renderQueueTab(main: HTMLElement): void {
        const list = this._renderTrackList();
        main.appendChild(list);
        this._restoreQueueScroll(list);
    }

    private _renderTrackList(): HTMLElement {
        return renderTrackList({
            queue: this._deps.queue,
            repo: this._deps.repo,
            player: this._deps.player,
            onSelect: (path) => this._handleSelectTrack(path),
            onRerender: () => this._deps.onRerender(),
        });
    }

    private _handleSelectTrack(path: string): void {
        if (!this._deps.queue.setIndexByPath(path)) return;
        this._deps.onSelectTrack();
    }

    private _restoreQueueScroll(list: HTMLElement): void {
        const needFocus = this._focusQueueOnNextRender;
        this._focusQueueOnNextRender = false;

        window.requestAnimationFrame(() => {
            const maxScroll = Math.max(0, list.scrollHeight - list.clientHeight);
            const target = needFocus
                ? list.querySelector<HTMLElement>(".music-track-row.is-current")
                : null;
            list.scrollTop = target
                ? Math.min(target.offsetTop, maxScroll)
                : Math.min(this._queueScrollTop, maxScroll);
        });
    }
}