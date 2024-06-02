import { dotRadius } from "../variable";
import { vec2, ext } from '@antv/matrix-util';

export const setArrowPosition = (node, x, y, angle: number) => {
    let matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    matrix = ext.transform(matrix, [['r', angle],['t', x, y]]);
    node.setMatrix(matrix);
};

export const getDotPoints = ({ width, height, beforeWidth, afterWidth }, offset = 0) => {
    return [
        { x: -offset + beforeWidth, y: height * 0.5 },
        { x: (beforeWidth + afterWidth + width) * 0.5, y: -offset },
        { x: beforeWidth + offset + width + afterWidth, y: height * 0.5 },
        { x: (beforeWidth + afterWidth + width) * 0.5, y: offset + height }
    ]
}
export const getDotPoint = ({ width, height, beforeWidth, afterWidth }, index, offset = 0) => {
    if (index === 0) return { x: -offset + beforeWidth, y: height * 0.5 };
    else if (index === 1) return { x: (beforeWidth + afterWidth + width) * 0.5, y: -offset };
    else if (index === 2) return { x: beforeWidth + afterWidth + offset + width, y: height * 0.5 };
    else return { x: (beforeWidth + afterWidth + width) * 0.5, y: offset + height }
}
export const getCanvasPointByNode = (node, index) => {
    const { style: { width, height, beforeWidth, afterWidth } } = node.getModel();
    const { x, y } = node.getBBox();
    const pos = getDotPoint({ width, height, beforeWidth, afterWidth }, index);
    return { x: pos.x + x + dotRadius * 0.5, y: pos.y + y + dotRadius * 0.5 }
}
export const getDotId = (nodeId, index) => {
    return nodeId + '-' + index;
}
export const getLinkId = (source, target) => {
    return `link-${source}-${target}`
}
export const getRotateByPoint = (p1, p2) => {
    //求两点之间的角度
    const radian = (p2.x - p1.x>0? Math.PI:0)+Math.atan((p2.y - p1.y) / (p2.x - p1.x));
    return radian;
}
export const getDragPoint = (start, end, control, percent = 0.5) => {
    // 二次贝塞尔曲线上运动轨迹的运算方式
    // x = Math.pow(1 - t, 2) * x1 + 2 * t * (1 - t) * cx + Math.pow(t, 2) * x2
    // y = Math.pow(1 - t, 2) * y1 + 2 * t * (1 - t) * cy + Math.pow(t, 2) * y2

    // 三次的贝塞尔曲线运动轨迹的计算方式
    // x = x1 * Math.pow((1 - t), 3) + 3 * cx1 * t * Math.pow((1 - t), 2) + 3 * cx2 * Math.pow(t, 2) * (1 - t) + x2 * Math.pow(t, 3)
    // y = y1 * Math.pow((1 - t), 3) + 3 * cy1 * t * Math.pow((1 - t), 2) + 3 * cy2 * Math.pow(t, 2) * (1 - t) + y2 * Math.pow(t, 3)

    const t = percent;
    const x = Math.pow(1 - t, 2) * start.x + 2 * t * (1 - t) * control.x + Math.pow(t, 2) * end.x;
    const y = Math.pow(1 - t, 2) * start.y + 2 * t * (1 - t) * control.y + Math.pow(t, 2) * end.y;
    return { x, y };
}
export const getControlPoint = (start, end, point, percent) => {
    const t = percent;
    const x = (point.x - Math.pow(1 - t, 2) * start.x - Math.pow(t, 2) * end.x) / (2 * t * (1 - t));
    const y = (point.y - Math.pow(1 - t, 2) * start.y - Math.pow(t, 2) * end.y) / (2 * t * (1 - t));
    return { x, y }
}
export const getBezierPath = (start, end, control) => {
    return [
        ['M', start.x, start.y],
        ['Q', control.x, control.y, end.x, end.y],
    ]
}
export const getBezierParams = (start, end, control) => {
    let percent = 0, offset = 0;
    if (start.x === end.x && start.y === end.y) {
        percent = 0;
        offset = 0;
    } else if (start.x === end.x) {
        offset = start.x - control.x;
        percent = (control.y - start.y) / (end.y - start.y);
    } else if (start.y === end.y) {
        offset = control.y - start.y;
        percent = (control.x - start.x) / (end.x - start.x);
    } else {
        let dir: vec2 = [0, 0];
        vec2.normalize(dir, [end.x - start.x, end.y - start.y]);

        const normal = {
            x: -dir[1],
            y: dir[0]
        }
        const lineFunc = (x, y) => {
            return normal.x * (x - start.x) + normal.y * (y - start.y)
        }
        const k = (end.y - start.y) / (end.x - start.x);
        let cx = (k * k * start.x + k * (control.y - start.y) + control.x) / (k * k + 1);
        // let cy = k*(cx-start.x)+start.y;
        offset = lineFunc(control.x, control.y);
        percent = (cx - start.x) / (end.x - start.x);
    }

    return {
        offset,
        percent
    }
}
export const getControlPointByParams = (
    startPoint: any,
    endPoint: any,
    percent: number = 0,
    offset: number = 0,
) => {
    const point = {
        x: (1 - percent) * startPoint.x + percent * endPoint.x,
        y: (1 - percent) * startPoint.y + percent * endPoint.y,
    };

    let tangent: vec2 = [0, 0];
    vec2.normalize(tangent, [endPoint.x - startPoint.x, endPoint.y - startPoint.y]);

    if (!tangent || (!tangent[0] && !tangent[1])) {
        tangent = [0, 0];
    }
    const perpendicular = [-tangent[1] * offset, tangent[0] * offset]; // 垂直向量
    point.x += perpendicular[0];
    point.y += perpendicular[1];
    return point;
};
export const isAddBtnShow = (node: any) => {
    const group = node.getContainer();
    const collapseText = group.findAllByName('collapse-text')[0];
    const attrs = collapseText.attrs;
    return attrs.text === '+'
}