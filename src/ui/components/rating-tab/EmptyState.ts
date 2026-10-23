import { t } from "../../../i18n";
import type { QueueMode } from "../../../types";
import { button } from "../../utils/buttons";
import { el } from "../../utils/dom";

export function renderEmptyForMode(
    mode: QueueMode,
    onShowAll: () => void
): HTMLElement {
    if (mode === "unrated") {
        return _renderEmptyWithAction(
            t("view.empty.allRated"),
            t("view.empty.showAll"),
            onShowAll
        );
    }
    return _renderEmptySimple(t("view.empty.noTracks"));
}

function _renderEmptySimple(msg: string): HTMLElement {
    return el("div", "music-rating-empty", msg);
}

function _renderEmptyWithAction(
    msg: string,
    actionText: string,
    onClick: () => void
): HTMLElement {
    const box = el("div", "music-rating-empty");
    box.appendChild(el("div", "music-rating-empty-msg", msg));
    const btn = button(actionText, onClick);
    btn.className = "music-rating-empty-action";
    box.appendChild(btn);
    return box;
}