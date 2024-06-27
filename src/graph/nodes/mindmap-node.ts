import { IShape, registerNode } from "@antv/g6";
import Shape from "../nodeTemplate/draw/shape";
import { NameString } from "../constaints";
import {
    drawCollapse, drawLabel, drawLinkBtn,
    drawReadyLink, getAttribute, handleNodeHover,
    handleNodeSelected
} from "./node-draw-utils";
import { EdgeTextPadding, IconLabelSize } from "../nodeTemplate/constant";
import { isWin } from "../utils/testDevice";
import { openSingleLink } from "../utils/config";
import { ItemType } from "..";

registerNode('mindmap-node', {
    // 自定义节点时的配置
    options: {},
    shapeType: 'mindmap-node',
    // 文本位置
    labelPosition: 'center',
    draw(cfg: any, group): IShape {
        if (!cfg.label) {
            return this.drawMindmapNode(cfg, group);
        } else {
            return this.drawLabelNode(cfg, group);
        }
    },
    drawMindmapNode(cfg: any, group: any) {
        const { readyLink, link2, link1, linkIconStyle, nodeType, url, nameStyle } = cfg;
        const visible = cfg.style.visible;
        const newNode = new Shape(group);
        if (!visible) {
            const shape = newNode.Rect(NameString.nodeWrapper, {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                fill: 'transparent'
            })
            return shape
        }

        const { ContainerStyle, RectStyle, NameStyle, DescWrapper, DescText, IconStyle, CusorStyle, ContentStyle, CenterStyle } = getAttribute(cfg);
        const maxNodeWidth = cfg.style.maxWidth;
        const { depth } = cfg;
        const rest = { draggable: false, capture: false }
        const keyShape = newNode.Rect(NameString.nodeContainer, ContainerStyle, { draggable: depth > 0 })
        if (readyLink) {
            RectStyle.lineWidth = 1;
            RectStyle.stroke = cfg.linkReadyStyle.stroke
        }
        newNode.Rect(NameString.nodeWrapper, RectStyle, rest)

        if (IconStyle.text) {
            newNode.group.addShape('text', { attrs: IconStyle })
        }
        if (nodeType === ItemType.image || nodeType === ItemType.video) {
            newNode.group.addShape('image', {
                attrs: {
                    img: url,
                    ...ContentStyle,
                },
                capture: false,
            })
            if (nodeType === ItemType.video) {
                newNode.group.addShape('text', {
                    attrs: {
                        text: '\ue904',
                        fontFamily: 'iconfont',
                        x: CenterStyle.x - 12,
                        y: CenterStyle.y + 12,
                        fontSize: 32,
                        fill: 'white',
                    },
                    capture: false,
                })
            }
        } else if (NameStyle.text) {
            newNode.addText('title', NameStyle, rest);
        }

        if (cfg.isFocus) {
            const cusor = newNode.Rect(NameString.textCusor, CusorStyle, rest)
            cusor.animate((r: number) => {
                return {
                    opacity: r <= 0.5 ? 1 - r * 2 : r * 2 - 1
                }
            }, {
                duration: 1200,
                repeat: true
            })
        }
        if (DescText.text) {
            newNode.inner()
            newNode.Rect('desc-wrapper', DescWrapper, rest)
            newNode.Text('desc', DescText, maxNodeWidth, rest)
        }
        drawCollapse(group, cfg);

        if (readyLink >= 0) {
            drawReadyLink(group, cfg)
        }

        if (link2) {
            newNode.group.addShape('image', {
                attrs: {
                    img: linkIconStyle.link2,
                    y: cfg.style.height * 0.5 + (isWin ? 1 : 0) - IconLabelSize.width * 0.5,
                    x: RectStyle.x + RectStyle.width - IconLabelSize.width - 8 - (link1 && openSingleLink ? IconLabelSize.width + 4 : 0),
                    width: IconLabelSize.width,
                    height: IconLabelSize.width,
                }
            })
        }
        if (link1 && openSingleLink) {
            newNode.group.addShape('image', {
                attrs: {
                    img: linkIconStyle.link1,
                    y: cfg.style.height * 0.5 + (isWin ? 1 : 0) - IconLabelSize.width * 0.5,
                    x: RectStyle.x + RectStyle.width - IconLabelSize.width - 8,
                    width: IconLabelSize.width,
                    height: IconLabelSize.width,
                }
            })
        }
        return keyShape;
    },
    drawLabelNode(cfg: any, group: any) {
        const { readyLink, label, labelStyle, style, linkLabelLineStyle } = cfg;
        const visible = cfg.style.visible;
        const newNode = new Shape(group);
        if (!visible) {
            const shape = newNode.Rect(NameString.nodeWrapper, {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                fill: 'transparent'
            })
            return shape
        }
        const { ContainerStyle, RectStyle, NameStyle, DescWrapper, DescText, IconStyle } = getAttribute(cfg);
        if (label) {
            const delta = labelStyle.marginRight;
            const cy = style.height * 0.5;
            drawLabel(cfg, { x: labelStyle.width * 0.5 + EdgeTextPadding.h, y: cy }, newNode.group, '');
            newNode.group.addShape('path', {
                attrs: {
                    path: `M ${labelStyle.width + EdgeTextPadding.h * 2},${cy} L ${labelStyle.width + 16 + delta},${cy} L ${labelStyle.width + 28 + delta},${cy} Z`,
                    stroke: linkLabelLineStyle.stoke,
                    lineWidth: 2,
                }
            })

            RectStyle.x += labelStyle.width + EdgeTextPadding.h * 2 + delta;
            NameStyle.x += labelStyle.width + EdgeTextPadding.h * 2 + delta;
            RectStyle.y = cy - RectStyle.height * 0.5;
        }
        const maxNodeWidth = cfg.style.maxWidth;
        const { depth } = cfg;
        const rest = { draggable: false, capture: false }
        // ContainerStyle.fill = '#ff000030'
        const keyShape = newNode.Rect(NameString.nodeContainer, ContainerStyle, { draggable: depth > 0 })
        if (readyLink) {
            RectStyle.lineWidth = 1;
            RectStyle.stroke = cfg.linkReadyStyle.stroke
        }
        newNode.Rect(NameString.nodeWrapper, RectStyle, rest)
        if (cfg.iconPath) {
            newNode.inner()
            newNode.Image('icon', IconStyle, rest)
        }
        newNode.addText('title', NameStyle, rest);
        if (cfg.desc) {
            newNode.inner()
            newNode.Rect('desc-wrapper', DescWrapper, rest)
            newNode.Text('desc', DescText, maxNodeWidth, rest)
        }
        drawCollapse(group, cfg);

        if (readyLink >= 0) {
            drawReadyLink(group, cfg)
        }
        return keyShape;
    },
    getAnchorPoints(cfg) {
        return [
            [1, 0.5],//right
            [0, 0.5],//left
            [0.5, 0],//top
            [0.5, 1],//bottom
        ]
    },
    setState(name: any, state: any, node: any) {
        if (name === "hover") handleNodeHover(state, node);
        else if (name === "selected") {
            handleNodeSelected(state, node);
        } else if (name === "link" && state) {
            drawLinkBtn(state, node);
            node.toFront();
        }
    },
});
