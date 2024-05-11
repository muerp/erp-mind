import { Arrow, IShape, registerNode } from "@antv/g6";
import { getAttribute } from "./node-draw-utils";

registerNode('shrink-root', {
    draw(cfg: any, group): IShape {
        group = group.addGroup();
        const { shrinkRoot, lineStyle, style, hideNum } = cfg;
        const { ContainerStyle, RectStyle, NameStyle } = getAttribute(cfg);
        const width = shrinkRoot.width * Math.sqrt(2);
        RectStyle.width -= width + shrinkRoot.virtual + 4;
        // ContainerStyle.cursor = 'no-drop';
        ContainerStyle.cursor = undefined;
        RectStyle.cursor = undefined;
        NameStyle.cursor = undefined;
        const rect = group.addShape('rect', {
            attrs: ContainerStyle,
        });

        group.addShape('rect', {
            attrs: RectStyle,
            capture: false,
            draggable: false
        });
        group.addShape('text', {
            attrs: NameStyle,
            capture: false,
            draggable: false
        })

        const x = RectStyle.x + RectStyle.width;
        const y = ContainerStyle.height * 0.5;
        group.addShape('path', {
            attrs: {
                path: `M ${x} ${y} L ${x + shrinkRoot.virtual + style.afterWidth} ${y}`,
                stroke: 'rgb(19, 128, 255)',
                lineDash: [10, 1],
                lineAppendWidth: 10,
                ...lineStyle,
                endArrow: {
                    path: Arrow.circle(3, 0),
                    d: 0,
                    fill: lineStyle.stroke
                }
            }
        })

        const tl = group.addShape('rect', {
            name: 'box-recover',
            attrs: {
                // x: x+shrinkRoot.virtual + style.afterWidth,
                // y: ContainerStyle.height*0.5 - shrinkRoot.height*0.5,
                radius: width * 0.5,
                ...shrinkRoot,
                cursor: 'pointer',
            }
        });
        tl.rotate(Math.PI / 4)
        tl.translate(x + shrinkRoot.virtual + style.afterWidth + width * 0.5 + 2, RectStyle.height*0.5 - width*0.5)

        group.addShape('text', {
            attrs: {
                x: x + shrinkRoot.virtual + width * 0.5 + style.afterWidth + 2,
                textAlign: 'center',
                textBaseline: 'middle',
                fontFamily: shrinkRoot.fontFamily || 'Arial',
                stroke: shrinkRoot.fontColor,
                fontSize: 14,
                y: ContainerStyle.height * 0.5,
                text: hideNum || 0
            },
            capture: false,
            draggable: false
        })
        return rect
    },
    getAnchorPoints(cfg) {
        return [
            [1, 0.5],//right
            [0, 0.5],//left
            [0.5, 0],//top
            [0.5, 1],//bottom
        ]
    },

})