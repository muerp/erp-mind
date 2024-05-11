export const getCircleCenterByPoints = (p1, p2, p3) => {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;
    const c = p1.x - p3.x;
    const d = p1.y - p3.y;
    const e = (p1.x * p1.x - p2.x * p2.x - p2.y * p2.y + p1.y * p1.y) / 2;
    const f = (p1.x * p1.x - p3.x * p3.x - p3.y * p3.y + p1.y * p1.y) / 2;
    const denominator = b * c - a * d;
    return {
        x: -(d * e - b * f) / denominator,
        y: -(a * f - c * e) / denominator,
    };
};
export const distance = (p1, p2): number => {
    const vx = p1.x - p2.x;
    const vy = p1.y - p2.y;
    return Math.sqrt(vx * vx + vy * vy);
};
