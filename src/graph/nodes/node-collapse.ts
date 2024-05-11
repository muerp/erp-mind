import {registerNode} from "@antv/g6";
import {dotRadius, linkStrokeColor} from "../variable";
registerNode('node-collapse', {
    draw (cfg, group) {
        return this.drawDragRect(cfg, group)
    },
    drawDragRect (cfg, group) {
        const circle = group.addShape('circle', {
            attrs: {
                x: -dotRadius*0.5,
                y: -dotRadius*0.5,
                r: dotRadius,
                lineWidth: 2,
                stroke: linkStrokeColor.value
            },
            capture: false,
        })
        return circle
    }
})
