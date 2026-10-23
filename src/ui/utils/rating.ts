export type RatingTier = "none" | "low" | "mid" | "high" | "top";

export function ratingTier(rating: number | null): RatingTier {
    if (typeof rating !== "number" || !Number.isFinite(rating)) return "none";
    if (rating <= 3) return "low";
    if (rating <= 6) return "mid";
    if (rating <= 8) return "high";
    return "top";
}

export function applyRatingTier(node: HTMLElement, rating: number | null): void {
    node.dataset.ratingTier = ratingTier(rating);
}