import { EdgeConfig, ShapeStyle, registerEdge } from '@antv/g6';
import { mix } from '@antv/util'
import { getPathWithBorderRadiusByPolyline } from "../utils/polyline-utils";

registerEdge('edge-default', {
    options: {
        radius: 10, stroke: 'rgb(19, 128, 255)'
    },
    getShapeStyle(cfg: EdgeConfig): ShapeStyle {
        return mix(this.options || {}, cfg.style || {})
    },
    draw(cfg: any, group) {
        const style = this.getShapeStyle(cfg);
        let { startPoint, endPoint, sourceNode, targetNode } = cfg;
        let start = startPoint;
        let end = endPoint;

        if (sourceNode) {
            if (sourceNode.getModel().side === 'left') {
                start = sourceNode.get('anchorPointsCache')[1];
            } else {
                start = sourceNode.get('anchorPointsCache')[0];
            }
        }
        
        if (targetNode) {
            if (sourceNode.getModel().side === 'left') {
                end = targetNode.get('anchorPointsCache')[1];
            }else {
                end = targetNode.get('anchorPointsCache')[0];
            }
    
        }
        let offsetX = Math.min(Math.abs(start.x - end.x) * 1 / 3, 40);
        let endOffsetX = -14;
        if (sourceNode.getModel().side === 'left') {
            endOffsetX = 0;
            offsetX = Math.min(Math.abs(start.x - end.x) * 1 / 3, -80);
        }
        let points = [
            {
                ...start
            },
            {
                x: start.x + offsetX,
                y: start.y
            },
            {
                x: start.x + offsetX,
                y: end.y
            },
            {
                x: end.x + endOffsetX,
                y: end.y
            }
        ];
        let path = getPathWithBorderRadiusByPolyline(points, 10);
        return group.addShape('path', {
            attrs: {
                ...style,
                opacity: 0.6,
                path: path
            }
        })
    },
})
