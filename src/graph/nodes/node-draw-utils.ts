import { NodeConfig, ShapeStyle } from "@antv/g6";
import { NameString } from "../constaints";
import { EdgeTextPadding } from "../nodeTemplate/constant";
import { isSafari, isWin } from "../utils/testDevice";
import {
    addRadius,
    paddingH,
    radius,
} from "../variable";
import {
    getDotPoints
} from "./node-utils";
// startY 由于不同浏览器的展示规则不一致，导致垂直居中会存在1px误差，所以需要细调
const diffY = isSafari ? -3 : isWin ? 2 : 0;
export function getAttribute(cfg: any) {
    const {
        width,
        height,
        nameHeight,
        descFontSize,
        descHeight,
        opacity = 1,
        imageIconWidth,
        descFontWeight,
        beforeWidth,
        afterWidth,
    } = getShapeStyle(cfg);
    const { nodeStyle, btnStyle, btnTextStyle, style, btnTypeStyle, nameStyle } = cfg;
    const NameStyle = {
        x: beforeWidth + paddingH,
        y: (height || 0) * 0.5 + (isWin ? 2 : 0),
        text: nameStyle.text,
        cursor: "pointer",
        opacity,
        ...btnTextStyle,
    }
    const ContainerStyle = {
        x: 0,
        y: 0,
        width: width + beforeWidth + afterWidth,
        height,
        fill: 'transparent',
        stroke: 'transparent',
        lineWidth: 0,
        cursor: 'pointer'
    }
    const CusorStyle = {
        x: beforeWidth + paddingH + nameStyle.lastWidth,
        y: (isWin ? 2 : 0) + nameStyle.height - nameStyle.lineHeight + nameStyle.lineHeight * 0.1,
        width: 1,
        height: nameStyle.lineHeight * 0.8,
        fill: btnTextStyle.fill
    }
    const RectStyle: any = {
        x: beforeWidth,
        y: 0,
        width: nodeStyle?.width || width,
        height: nodeStyle?.height || height,
        radius,
        cursor: "pointer",
        opacity,
        ...btnStyle,
        stroke: style.headIcon ? style.headIcon.fill : 'transparent',
    };
    const TextStyle = {
        x: beforeWidth + paddingH,
        y: diffY + (isWin ? -1 : 0),
        text: cfg?.title,
        cursor: "pointer",
        opacity,
        textIndent: imageIconWidth,
        ...btnTextStyle
    };
    const IconStyle = {
        x: beforeWidth + paddingH,
        y: cfg.style.height * 0.5,
        opacity,
        textAlign: 'center',
        textBaseline: 'middle',
        ...(style.headIcon || {}),
        text: btnTypeStyle?.show ? style.headIcon?.text : undefined,
    };
    const DescWrapper = {
        x: beforeWidth,
        y: nameHeight,
        width,
        height: descHeight,
        radius: [0, 0, radius, radius],
        fill: descHeight ? "rgba(255,255,255,0.3)" : "transparent",
        cursor: "pointer",
        stroke: "transparent",
        lineWidth: 2,
        opacity,
    };
    const DescText = {
        x: beforeWidth + paddingH,
        y: nameHeight,
        text: cfg?.desc,
        fontSize: descFontSize,
        fontWeight: descFontWeight,
        cursor: "pointer",
        opacity,
    };
    return { ContainerStyle, RectStyle, TextStyle, DescWrapper, DescText, IconStyle, NameStyle, CusorStyle };
}

const getNode = (group: any, name: string) => group.findAllByName(name)[0];
const getWrapper = (group: any) => getNode(group, NameString.nodeWrapper);

const AddIcon = '\ue606';
const ReduceIcon = '\ue69d';

export function handleNodeHover(state: any, node: any) {
    const model = node.getModel();
    const { btnHoverStyle, btnStyle, collapsedNumberTextStyle, btnTextStyle, collapsedNumberStyle, btnTypeStyle, style } = model;
    const group = node.getContainer();

    if (node.hasState('selected') || model.collapse) {
        return;
    }
    // 设置节点边框颜色
    const wrapper = getWrapper(group);
    const title = group.findAllByName('title')[0];

    if (state) {
        if (btnHoverStyle.stroke) {
            wrapper?.attr("stroke", btnHoverStyle.stroke);
            wrapper?.attr('lineWidth', btnHoverStyle.lineWidth || 1);
        }
        if (btnHoverStyle.fill) {
            wrapper?.attr("fill", btnHoverStyle.fill)
        }
        if (btnHoverStyle.textColor) {
            title?.attr('fill', btnHoverStyle.textColor)
        }
    } else {
        wrapper?.attr("stroke", btnStyle.stroke);
        wrapper?.attr('lineWidth', btnStyle.lineWidth || 2);
        wrapper?.attr("fill", btnStyle.fill);
        title?.attr('fill', btnTextStyle.fill)
    }

    const collapseGroup = group.findAllByName('collapse-group')[0];
    const collapseNode = group.findAllByName(NameString.collapseCircle)[0];
    const collapseText = group.findAllByName('collapse-text')[0];

    if (state) {
        collapseGroup && collapseGroup.show();
    } else if (!model.collapsed) {
        collapseGroup && collapseGroup.hide();
        return;
    }

    if (!model.collapsed) {
        collapseText?.attr({
            y: collapseNode.attrs.y - 0.8,
            text: model.children.length == 0 || model.children[0].visible === false ? AddIcon : ReduceIcon //+-
        });
    } else {
        collapseNode?.attr({
            ...collapsedNumberStyle
        })
        collapseText?.attr({
            y: collapseNode.attrs.y,
            text: model.children.length,
            ...collapsedNumberTextStyle
        });
    }

}

export function handleNodeSelected(state: any, node: any) {
    const model = node.getModel();
    const { btnSelectedStyle, btnStyle, btnTextStyle } = model;
    // 选中节点置于最上方
    const group = node.getContainer();
    // 设置节点边框颜色
    const wrapper = getWrapper(group);
    const title = group.findAllByName('title')[0];

    wrapper?.attr("stroke", state ? btnSelectedStyle.stroke : btnStyle.stroke);
    wrapper?.attr("lineWidth", state ? btnSelectedStyle.lineWidth : btnStyle.lineWidth);
    wrapper?.attr("fill", state && btnSelectedStyle.fill ? btnSelectedStyle.fill : btnStyle.fill);
    title?.attr('fill', state && btnSelectedStyle.textColor ? btnSelectedStyle.textColor : btnTextStyle.fill)


    const collapseGroup = group.findAllByName('collapse-group')[0];
    if (!state && !model.collapsed) {
        collapseGroup.hide();
        return;
    }
    const collapseNode = group.findAllByName(NameString.collapseCircle)[0];
    const collapseText = group.findAllByName('collapse-text')[0];
    if (model.children.length > 0 && model.collapsed) {
        collapseText?.attr({
            y: collapseNode.attrs.y,
            text: model.children.length,
            textAlign: 'center',
            textBaseline: 'middle',
        });
    } else {   
        collapseText?.attr({
            y: collapseNode.attrs.y - 0.8,
            text: state && ( (model.children.length > 0 && !model.collapsed) || model.children.length === 0) ? AddIcon : ReduceIcon
        });
    }
    if (state) {
        collapseGroup.show();
    }
}

function drawAdd(group: any, pos = { x: 0, y: 0 }, index: any, style: any) {
    const bgStyle = {
        x: pos.x,
        y: pos.y,
        r: 0,
        cursor: 'pointer',
        ...style.btnStyle
    };

    const textStyle = {
        ...style.btnTextStyle,
        cursor: "pointer",
        textAlign: 'center',
        textBaseline: 'middle',
    }
    const circle = group.addShape('circle', {
        name: NameString.linkCircle,
        attrs: bgStyle,
        model: {
            index
        },
        draggable: true
    })
    const text = group.addShape('text', {
        name: 'link-add',
        attrs: {
            x: bgStyle.x,
            y: bgStyle.y,
            ...textStyle
        },
        capture: false,
    })
    circle.animate((ratio: number) => {
        return {
            r: ratio * addRadius,
            opacity: ratio
        }
    }, {
        duration: 250
    })
    text.animate((ratio: number) => {
        return {
            fontSize: ratio * 16,
            opacity: ratio
        }
    }, {
        duration: 250
    })
}

export function drawLinkBtn(state: string, node: any) {
    const {
        style: {
            beforeWidth,
            afterWidth,
            height
        },
        linkReadyStyle
    } = node._cfg?.model;

    const width = node._cfg?.model.style?.nodeStyle?.width || node._cfg?.model.style.width

    const group = node.getContainer();
    // 设置节点边框颜色
    let wrapper = getWrapper(group);
    wrapper?.attr("stroke", state ? linkReadyStyle.stroke : "transparent");

    const collapseGroup = group.findAllByName('collapse-group')[0];
    collapseGroup.hide();

    group.addGroup({
        name: NameString.linkGroup
    });
    const points = getDotPoints({
        beforeWidth,
        afterWidth,
        width,
        height
    }, addRadius + 10);
    points.forEach((pos, idx) => {
        drawAdd(group, pos, idx, linkReadyStyle);
    })
}

export function drawCollapse(group: any, {
    side,
    style,
    collapsed,
    children,
    collapsedSelectedStyle,
    collapsedSelectedTextStyle,
    collapsedNumberStyle,
    collapsedNumberTextStyle

}: any) {
    const { beforeWidth, width, height } = style;
    let p = beforeWidth + width + collapsedSelectedStyle.r + 5;
    if (side === 'left') {
        p = beforeWidth > 0 ? -beforeWidth - collapsedSelectedStyle.r : -beforeWidth - collapsedSelectedStyle.r - 12;
    }
    const container = group.addGroup({
        visible: children.length > 0 && collapsed && children[0].visible !== false,
        name: 'collapse-group',
        capture: true,
        zIndex: 9,
    });
    let bgStyle: any = {
        x: p,
        y: height * 0.5,
        cursor: 'pointer',
        ...collapsedSelectedStyle,
    };
    let textStyle: any = {
        text: collapsed ? (children.length > 0 && children[0].visible !== false ? children.length : '+') : '-',
        textAlign: 'center',
        textBaseline: 'middle',
        ...collapsedSelectedTextStyle,
    }
    if (collapsed && children.length > 0 && children[0].visible !== false) {
        bgStyle = { ...bgStyle, ...collapsedNumberStyle }
        textStyle = {
            y: bgStyle.y,
            ...textStyle,
            ...collapsedNumberTextStyle
        }
    }
    const clickRectStyle = {
        width: collapsedSelectedStyle.r * 2 + 10,
        height: collapsedSelectedStyle.r * 2 + 5,
        x: beforeWidth + width,
        y: height * 0.5 - collapsedSelectedStyle.r - 2.5,
        cursor: 'pointer',
        capture: true,
        fill: 'transparent'
    }
    container.addShape('rect', {
        name: NameString.collapseClick,
        attrs: clickRectStyle
    })
    container.addShape('circle', {
        name: NameString.collapseCircle,
        attrs: bgStyle,
        capture: false,
    })
    container.addShape('text', {
        name: 'collapse-text',
        attrs: {
            x: bgStyle.x,
            y: bgStyle.y - 2,
            ...textStyle
        },
        capture: false,
    })
}

export function drawReadyLink(group: any, cfg: any) {
    const container = group.addGroup({
        name: 'link-dot-group',
        capture: true,
        zIndex: 9,
    });

    const { style: { width, height, beforeWidth, afterWidth }, readyLink, linkDotStyle } = cfg;
    let points = getDotPoints({ width, height, beforeWidth, afterWidth });
    points.forEach((pos, index) => {
        const attrs = { ...pos, ...linkDotStyle }
        if (index === readyLink) {
            attrs.r = attrs.r * 1.25;
        }
        container.addShape('circle', {
            capture: false,
            name: 'link-dot',
            attrs
        })
    })
    container.toFront();
}

function getShapeStyle(cfg: any): ShapeStyle {
    const { depth, style } = cfg;
    let params = {};
    if (depth === 0) {
        params = Object.assign({}, style, style.root || {});
    } else if (depth === 1) {
        params = Object.assign({}, style, style.sub || {});
    } else {
        params = Object.assign({}, style, style.leaf || {});
    }
    return params
}

export const drawLabel = ({ labelStyle, linkLabelBgStyle, linkLabelTextStyle }: any, pos: any, group: any, key: string) => {
    const textGroup = group.addGroup()

    const size = { width: labelStyle.width, height: labelStyle.height }
    const textStyle = {
        ...linkLabelTextStyle,
        x: pos.x - size.width * 0.5,
        y: pos.y,
        text: labelStyle.text,
    }

    const bgStyle = {
        ...linkLabelBgStyle,
        cursor: 'pointer',
        width: size.width + EdgeTextPadding.h * 2,
        height: size.height + EdgeTextPadding.v * 2,
        x: pos.x - size.width * 0.5 - EdgeTextPadding.h,
        y: pos.y - size.height * 0.5 - EdgeTextPadding.v,
        radius: 9,
    }

    const bg = textGroup.addShape('rect', {
        attrs: {
            ...bgStyle,
            changeKey: key
        },
        zIndex: 1,
        draggable: true
    })
    textGroup.addShape('rect', {
        attrs: {
            width: bgStyle.width - 2,
            height: bgStyle.height - 2,
            x: bgStyle.x + 1,
            y: bgStyle.y + 1,
            radius: 8,
            changeKey: key,
            ...linkLabelBgStyle.borderStyle
        },
        zIndex: 2,
        draggable: true,
    })
    textGroup.addShape('text', {
        // @ts-ignore
        attrs: {
            ...textStyle,
        },
        zIndex: 2,
        capture: false,
    })
    return bg;
}

export const DoubleIcon = 'M170.666667 170.666667h170.666666v85.333333H170.666667V170.666667z m512 640h170.666666v85.333333h-170.666666v-85.333333zM85.333333 384h213.333334v85.333333H85.333333V384z m298.666667 0h128v85.333333H384V384z m213.333333 0h256v85.333333h-256V384zM170.666667 597.333333h256v85.333334H170.666667v-85.333334z m341.333333 0h128v85.333334h-128v-85.333334z m213.333333 0h213.333334v85.333334h-213.333334v-85.333334zM426.666667 170.666667h512v85.333333H426.666667V170.666667zM85.333333 810.666667h512v85.333333H85.333333v-85.333333z'

