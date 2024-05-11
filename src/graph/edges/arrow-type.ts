import { Arrow } from "@antv/g6";

export const ArrowType: any = {
    1: {
        path: Arrow.triangle(6, 8, 0),
        d: 0,
        lineWidth: 0,
    },
    2: {
        path: Arrow.vee(6, 8, 0),
        d: 0,
        lineWidth: 0,
    },
    3: {
        path: Arrow.circle(3, 0),
        d: 0,
        lineWidth: 0,
    },
    4: {
        path: Arrow.rect(8, 8, 0),
        d: 0,
        lineWidth: 0,
    },
    5: {
        path: Arrow.triangleRect(6, 8, 6, 2, 4, -4),
        d: 4,
        lineWidth: 0,
    }
}