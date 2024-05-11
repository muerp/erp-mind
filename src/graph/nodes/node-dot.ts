import {registerNode} from "@antv/g6";
registerNode('node-dot', {
    draw (cfg, group) {
        return this.drawDragRect(cfg, group)
    },
    drawDragRect (cfg, group) {
        const circle = group.addShape('circle', {
            id: cfg.id,
            name: cfg.name,
            attrs: {
                x: -cfg.style.r*0.5,
                y: -cfg.style.r*0.5,
                cursor: 'pointer',
                ...cfg.style,
            },
            capture: cfg.capture || false,
            draggable: cfg.draggable || false
        })
        return circle
    },
    getAnchorPoints(cfg) {
        return [
            [0.5, 0.5]
        ]
    },
})
