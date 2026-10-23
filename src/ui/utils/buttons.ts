import { setIcon } from "obsidian";

export interface ButtonOptions {
    cls?: string;
    text?: string;
    icon?: string;
    label?: string;
    onClick?: (e: MouseEvent) => void;
}

export function makeButton(opts: ButtonOptions): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    if (opts.cls) btn.className = opts.cls;
    if (opts.label) btn.setAttribute("aria-label", opts.label);
    if (opts.onClick) btn.onclick = opts.onClick;

    if (opts.icon) {
        const iconWrap = document.createElement("span");
        iconWrap.className = "mr-btn-icon";
        setIcon(iconWrap, opts.icon);
        btn.appendChild(iconWrap);
    }

    if (opts.text != null) {
        const textWrap = document.createElement("span");
        textWrap.className = "mr-btn-text";
        textWrap.textContent = opts.text;
        btn.appendChild(textWrap);
    }

    return btn;
}

export function button(
    text: string,
    onClick: (e: MouseEvent) => void
): HTMLButtonElement {
    return makeButton({ text, onClick });
}

export function iconButton(
    icon: string,
    label: string,
    onClick: () => void,
    extraClass?: string
): HTMLButtonElement {
    return makeButton({
        icon,
        label,
        cls: `music-icon-btn${extraClass ? " " + extraClass : ""}`,
        onClick: () => onClick(),
    });
}

export function sidebarButton(
    icon: string,
    label: string,
    onClick: () => void
): HTMLButtonElement {
    return makeButton({
        icon,
        label,
        cls: "music-rating-sidebar-btn",
        onClick: () => onClick(),
    });
}

export function arrowButton(
    dir: "left" | "right",
    onClick: () => void
): HTMLButtonElement {
    const btn = makeButton({
        cls: `music-action-btn ${dir === "left" ? "music-action-prev" : "music-action-next"}`,
        onClick: () => onClick(),
    });

    const iconWrap = document.createElement("span");
    iconWrap.className = "mr-btn-icon";

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.classList.add("music-action-arrow");

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute(
        "d",
        dir === "left" ? "M15 18 L9 12 L15 6" : "M9 6 L15 12 L9 18"
    );
    svg.appendChild(path);
    iconWrap.appendChild(svg);
    btn.appendChild(iconWrap);

    return btn;
}