import { registerEdge, Edge } from '@antv/g6';
import {
    getBezierPath,
    getControlPointByParams,
    getDragPoint,
    getRotateByPoint,
    setArrowPosition
} from "../nodes/node-utils";
import { NameString } from "../constaints";
import { EdgeTextPadding } from "../nodeTemplate/constant";
import { distance } from "../utils/math";
import { isWin } from '../utils/testDevice';

const p = [1, 2, 0, 3];
const drawLabel = ({ style, edgeLabelBgStyle, edgeLabelTextStyle }, pos, group, key) => {
    const textGroup = group.addGroup({
        name: NameString.edgeTitleGroup,
    })

    const size = { width: style.width, height: style.height }
    const textStyle = {
        ...edgeLabelTextStyle,
        x: pos.x - size.width * 0.5,
        y: pos.y + (isWin? 2:0),
        text: style.text,
    }

    const bgStyle = {
        ...edgeLabelBgStyle,
        width: size.width + EdgeTextPadding.h * 2,
        height: size.height + EdgeTextPadding.v * 2,
        x: pos.x - size.width * 0.5 - EdgeTextPadding.h,
        y: pos.y - size.height * 0.5 - EdgeTextPadding.v,
        radius: 4,
    }

    const bg = textGroup.addShape('rect', {
        name: NameString.edgeTitleBg,
        attrs: {
            ...bgStyle,
            changeKey: key
        },
        zIndex: 1,
        draggable: true
    })
    textGroup.addShape('text', {
        name: NameString.edgeTitle,
        // @ts-ignore
        attrs: {
            ...textStyle,
        },
        zIndex: 2,
        capture: false,
    })
    return bg;
}


const drawArrow = (style, pos, angle, group, name) => {
    let arrow = group.addShape('path', {
        name,
        attrs: style
    });
    setArrowPosition(arrow, pos.x, pos.y, angle);
}

registerEdge('edge-quadratic', {
    draw(cfg: any, group) {
        let {
            startPoint, endPoint, sourceNode, targetNode,
            startIndex, endIndex, selected, dragging,
            offset, curve, title, labelStyle, labelStyle1, labelStyle2,
            editType, labelType,
            style: {
                edgeLabelBgStyle, edgeLabelTextStyle,
                edgePathStyle, edgeDotStyle,
                circleDotStyle, arrowStyle
            }
        } = cfg;

        let start = startPoint, end = endPoint;
        let startOffsetX = 0;
        let endOffsetX = 0;
        const curvePosition = curve || 0.5

        if (startIndex >= 0 && sourceNode && sourceNode.get('anchorPointsCache')[p[startIndex]]) {
            start = sourceNode.get('anchorPointsCache')[p[startIndex]];
            const model = sourceNode.getModel();
            if (startIndex === 0) {
                startOffsetX = model.style.beforeWidth;
            } else if (startIndex === 2) {
                startOffsetX = -model.style.afterWidth;
            }
        }
        if (endIndex >= 0 && targetNode && targetNode.get('anchorPointsCache')[p[endIndex]]) {
            end = targetNode.get('anchorPointsCache')[p[endIndex]];
            const model = targetNode.getModel();
            if (endIndex === 0) {
                endOffsetX = model.style.beforeWidth;
            } else if (endIndex === 2) {
                endOffsetX = -model.style.afterWidth;
            }
        }
        end = { x: parseInt(end.x + endOffsetX), y: end.y }
        start = { x: parseInt(start.x + startOffsetX), y: start.y }

        cfg.start = start;
        cfg.end = end;

        let dis = distance(start, end);
        let curveOffset = offset || dis * 0.3;
        const control = getControlPointByParams(
            { x: start.x, y: start.y },
            { x: end.x, y: end.y },
            curvePosition,
            curveOffset,
        );

        const shapePath = group.addShape('path', {
            attrs: {
                lineDash: [2, 1],
                path: getBezierPath(start, end, control),
                endArrow: labelType !== 2 || (labelType===2 && editType===0),
                startArrow: labelType===2 && editType===1,
                shadowBlur: 0,
                lineAppendWidth: 6,
                // cursor: 'pointer',
                ...edgePathStyle,
            },
            zIndex: 1,
            draggable: false,
            name: NameString.edgeLinkPath,
        });

        const dotPos = getDragPoint(start, end, control, 0.5);
        cfg.dotPos = dotPos;
        if (selected) {
            const circleStyle = {
                ...dotPos,
                cursor: 'pointer',
                ...edgeDotStyle
            }
            group.addShape('circle', {
                name: NameString.edgeLinkDot,
                attrs: {
                    ...circleStyle
                },
                draggable: true,
                zIndex: 2
            })
        }
        if (dragging) {
            group.addShape('circle', {
                name: NameString.linkEdgeCircle,
                attrs: {
                    ...start,
                    cursor: 'pointer',
                    ...circleDotStyle,
                },
                zIndex: 99,
                draggable: true
                // capture: false,
            })
            group.addShape('circle', {
                name: NameString.linkEdgeCircle,
                attrs: {
                    ...end,
                    cursor: 'pointer',
                    ...circleDotStyle,
                },
                zIndex: 99,
                capture: false,
                draggable: true
            })
        }
        if (labelType == 2) {
            if (labelStyle1 && labelStyle2) {
                if (editType === 0 || editType === 2 || selected) {
                    let dot = editType === 0 ? dotPos : getDragPoint(start, end, control, 0.2);
                    drawLabel({ style: labelStyle1, edgeLabelBgStyle, edgeLabelTextStyle }, dot, group, 'label1');
                    if (selected) {
                        let aPos = getDragPoint(start, end, control, 0.11);
                        let aPos1 = getDragPoint(start, end, control, 0.1);
                        let angle = getRotateByPoint(aPos, aPos1);
                        drawArrow(arrowStyle, aPos, angle, group, NameString.edgeArrowUp);
                    }
                }
                if (editType === 1 || editType === 2 || selected) {
                    let dot = editType === 1 ? dotPos : getDragPoint(start, end, control, 0.8);
                    drawLabel({ style: labelStyle2, edgeLabelBgStyle, edgeLabelTextStyle }, dot, group, 'label2');
                    if (selected) {
                        let bPos = getDragPoint(start, end, control, 0.91);
                        let bPos1 = getDragPoint(start, end, control, 0.9);
                        let angle = Math.PI + getRotateByPoint(bPos, bPos1);
                        drawArrow(arrowStyle, bPos, angle, group, NameString.edgeArrowDown);
                    }
                }
            }
        }
        else if (editType === 0 || title) {

            drawLabel({ style: labelStyle, edgeLabelBgStyle, edgeLabelTextStyle }, dotPos, group, 'title');
        }
        return shapePath;
    },
    setState(name, state, node: Edge) {
        if (name === 'hover') {
            let path = node.getContainer().findAllByName(NameString.edgeLinkPath)[0];
            path.attr({
                shadowBlur: state ? 18 : 0
            })
        }
    }
});

