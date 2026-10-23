export function formatDuration(seconds?: number | null): string {
    if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "0:00";
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
}