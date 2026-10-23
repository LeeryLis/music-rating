import { t } from "../../../i18n";
import type { QueueModel } from "../../../models/QueueModel";
import { sidebarButton } from "../../utils/buttons";
import { el } from "../../utils/dom";

export function renderSidebar(
    queue: QueueModel,
    onRerender: () => void
): HTMLElement {
    const sidebar = el("div", "music-rating-sidebar");

    sidebar.appendChild(_renderShuffleButton(queue, onRerender));
    sidebar.appendChild(_renderModeToggle(queue, onRerender));
    sidebar.appendChild(_renderAutoAdvanceToggle(queue, onRerender));

    return sidebar;
}

function _renderShuffleButton(queue: QueueModel, onRerender: () => void): HTMLButtonElement {
    return sidebarButton("shuffle", t("sidebar.shuffle"), () => {
        queue.shuffleQueue();
        onRerender();
    });
}

function _renderModeToggle(queue: QueueModel, onRerender: () => void): HTMLButtonElement {
    const isUnrated = queue.mode === "unrated";
    const btn = sidebarButton(
        isUnrated ? "filter" : "list",
        isUnrated ? t("sidebar.mode.list") : t("sidebar.mode.filter"),
        () => {
            queue.toggleMode();
            onRerender();
        }
    );
    if (isUnrated) btn.classList.add("is-active");
    return btn;
}

function _renderAutoAdvanceToggle(queue: QueueModel, onRerender: () => void): HTMLButtonElement {
    const btn = sidebarButton(
        queue.autoAdvance ? "skip-forward" : "pause",
        queue.autoAdvance ? t("sidebar.auto.on") : t("sidebar.auto.off"),
        () => {
            queue.toggleAutoAdvance();
            onRerender();
        }
    );
    if (queue.autoAdvance) btn.classList.add("is-active");
    return btn;
}