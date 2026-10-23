import { t } from "../../../i18n";
import { makeButton } from "../../utils/buttons";
import { el } from "../../utils/dom";
import { ratingTier } from "../../utils/rating";

export interface RatingScaleContext {
    current: number;
    onRate: (value: number) => void;
    onClear: () => void;
}

export function renderRatingScale(ctx: RatingScaleContext): HTMLElement {
    const wrap = el("div", "music-rating-scale-wrap");
    wrap.appendChild(_renderScale(ctx));
    wrap.appendChild(_renderClear(ctx));
    return wrap;
}

function _renderScale(ctx: RatingScaleContext): HTMLElement {
    const scale = el("div", "music-rating-scale");
    scale.setAttribute("role", "radiogroup");
    for (let i = 1; i <= 10; i++) {
        scale.appendChild(_makeSegment(i, ctx));
    }
    return scale;
}

function _makeSegment(value: number, ctx: RatingScaleContext): HTMLButtonElement {
    const seg = makeButton({
        text: String(value),
        cls: "music-rating-seg",
        onClick: () => ctx.onRate(value),
    });
    seg.dataset.rating = String(value);
    seg.dataset.ratingTier = ratingTier(value);
    seg.setAttribute("role", "radio");
    seg.setAttribute("aria-checked", String(value === ctx.current));
    if (value === ctx.current) seg.classList.add("is-current");
    return seg;
}

function _renderClear(ctx: RatingScaleContext): HTMLButtonElement {
    const clear = makeButton({
        text: "✕",
        cls: "music-rating-clear",
        onClick: () => ctx.onClear(),
    });
    clear.setAttribute("aria-label", t("rating.clear"));
    if (ctx.current === 0) clear.classList.add("is-disabled");
    return clear;
}