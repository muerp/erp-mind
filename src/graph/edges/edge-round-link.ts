import { EdgeConfig, ShapeStyle, registerEdge } from '@antv/g6';
import {mix} from '@antv/util'
import { getPathWithBorderRadiusByPolyline } from '../utils/polyline-utils';
registerEdge('edge-round-link', {
    getShapeStyle(cfg: EdgeConfig): ShapeStyle {
        return mix({ radius: 10, stroke: 'rgb(19, 128, 255)' }, cfg.style || {})
    },
    draw(cfg: any, group) {
        const style = this.getShapeStyle(cfg);
        let { startPoint, endPoint, sourceNode, targetNode } = cfg;
        let start = startPoint;
        let end = endPoint;
        if (sourceNode) {
            start = sourceNode.get('anchorPointsCache')[0];
        }
        if (targetNode) {
            end = targetNode.get('anchorPointsCache')[1];
        }
        const offsetX = Math.min(Math.abs(start.x - end.x) * 1 / 3, 40);
        const endOffsetX = 0;

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
        let path = getPathWithBorderRadiusByPolyline(points,style.radius);
        return group.addShape('path', {
            attrs: {
                ...style,
                path: path
            }
        })
    }
})
