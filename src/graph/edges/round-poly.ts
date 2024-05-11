import { Arrow, EdgeConfig, ShapeStyle, registerEdge } from '@antv/g6';
import {mix} from '@antv/util'
import { getPathWithBorderRadiusByPolyline } from '../utils/polyline-utils';
import { ArrowType } from './arrow-type';
import { NodeType } from '../constaints';
registerEdge('round-poly', {
    getShapeStyle(cfg: EdgeConfig): ShapeStyle {
        return mix({ radius: 10, stroke: 'rgb(19, 128, 255)',lineAppendWidth:10 }, cfg.style || {})
    },
    draw(cfg: any, group) {
        const style = this.getShapeStyle(cfg);
        let { startPoint, endPoint, sourceNode, targetNode } = cfg;
        const sourceModel = sourceNode.getModel();
        const targetModel = targetNode.getModel();
        if (!sourceModel.style.visible || !targetModel.style.visible) {
            const shape = group.addShape('rect', {
               attrs: {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    fill: 'transparent'
               }
            })
            return shape
        }

        let startArrow: any;
        let endArrow: any;
        let delp = 0;
        if (sourceModel.edgeConfig) {
            const config = sourceModel.edgeConfig[targetModel.id];
            if (config) {
                if (config.color) {
                    style.stroke = config.color;
                }
                if (config.arrowType) {
                    if (!config.orientation) {
                        startArrow = endArrow = {...ArrowType[config.arrowType]};
                    } else if (config.orientation === -1) {
                        startArrow = {...ArrowType[config.arrowType]};
                    } else if (config.orientation === 1) {
                        endArrow = {...ArrowType[config.arrowType]};
                    }
                    if (startArrow) {
                        startArrow.fill = style.stroke;
                        startArrow.stroke = style.stroke;
                    } 
                    
                    if (endArrow) {
                        endArrow.fill = style.stroke;
                        endArrow.stroke = style.stroke;
                    }
                    if (config.arrowType === 6) {
                        delp = 6;
                    }
                }
            }
        }
        if (sourceModel.type === NodeType.shrinkRoot) {
            startArrow = undefined;
        }
        let start = startPoint;
        let end = endPoint;
        let isLeft = false;
        start.x += delp;
        end.x -= delp;
        if (startPoint.x < endPoint.x) {
            if (sourceNode) {
                start = sourceNode.get('anchorPointsCache')[0];
            }
            if (targetNode) {
                end = targetNode.get('anchorPointsCache')[1];
            }
        } else {
            isLeft = true;
            if (sourceNode) {
                start = sourceNode.get('anchorPointsCache')[1];
            }
            if (targetNode) {
                end = targetNode.get('anchorPointsCache')[0];
            }
        }
        
        let offsetX = Math.min(Math.abs(start.x - end.x) * 1 / 3, 40);
        const endOffsetX = 0;
        if (isLeft) {
            offsetX = -offsetX;
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
        let path = getPathWithBorderRadiusByPolyline(points,style.radius);
        if (sourceModel.type === NodeType.shrinkRoot) {
            startArrow = {
                path: Arrow.circle(3, 0),
                d: 0,
                fill: style.stroke
            }
        }
        return group.addShape('path', {
            attrs: {
                ...style,
                path: path,
                cursor: 'pointer',
                startArrow,
                endArrow,
                lineDash: sourceModel.type === NodeType.shrinkRoot? [10, 1]:undefined,
            }
        })
    }
})
