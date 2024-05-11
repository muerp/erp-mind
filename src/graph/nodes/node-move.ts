import { registerNode } from "@antv/g6";
registerNode('node-move', {
    draw(cfg, group) {
        const {dragMoveSize,radius,themeColor,opacity} = cfg.style;
        const circle = group.addShape('rect', {
            attrs: {
                width: dragMoveSize.width,
                height: dragMoveSize.height,
                fill: themeColor,
                radius: radius,
                opacity,            
                // cursor: "grabbing",
            },
            capture: false,
        })
        group.addShape('circle', {
            attrs: {
                y: 10,
                x: -10,
                r: 4,
                lineWidth: 2,
                stroke: themeColor,
                opacity,
            }
        })
        return circle
    },
    getAnchorPoints(cfg) {
        return [
            [0, 0.5],//left
            [1, 0.5],//right
        ]
    },
})
