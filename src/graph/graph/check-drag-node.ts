import { nameHideRoot } from "../constaints";
import { distance } from "../utils/math";
import { dragMoveSize } from "../variable";




export function dragNodeReady(evt: any, graph: any) {
    const { item: node } = evt;
    const offset = {x: -12, y: 6}
    const { x, y } = graph.getPointByClient(evt.clientX, evt.clientY);
    if (node) {
        const model = node.get('model')
        if (model.isRoot) return;
        offset.x = (x - model.x) / model.style.width * 40 - 6;
        offset.y = (y - model.y) / model.style.height * 20;
    }
    
    const mouseBegin: any = {
        clientX: evt.clientX,
        clientY: evt.clientY,
        startNode: node || undefined,
        offset
    }
    mouseBegin.mouseNode = graph.createDragNode(x - mouseBegin.offset.x, y - mouseBegin.offset.y);

    mouseBegin.mouseEdge = graph.createDragEdge({ source: node? node.get('parent').getModel().id:graph.get('data').children[0].id });
    mouseBegin.mouseNode.toFront();
    mouseBegin.mouseEdge.toFront();
    if (!node) {
        mouseBegin.mouseEdge.hide();
    }
    return mouseBegin;
}

export function dragNodeMove(evt: any, mouseBegin: any, graph: any) {
    if (!mouseBegin) {
        return;
    }
    const { x, y } = graph.getPointByClient(evt.clientX, evt.clientY);
    let pos = {
        x: x - mouseBegin.offset.x,
        y: y - mouseBegin.offset.y,
    }
    graph.updateItem(mouseBegin.mouseNode, pos, false);
    const edge = {
        x: evt.clientX - mouseBegin.offset.x - 12,
        y: evt.clientY - dragMoveSize.height * 0.5,
    }
    const win = {
        width: window.document.body.clientWidth,
        height: window.document.body.clientHeight
    }
    checkTargetNode(graph, mouseBegin, pos, edge.y < 0 || edge.y > win.height || edge.x < 0 || edge.x > win.width)
}
export  function checkTargetNode(graph: any, mouseBegin: any, { x, y }, noTarget = false) {
    if (mouseBegin.startNode && !mouseBegin.startNode.get('parent')) return;
    const mouse = { x: x - 6, y: y + dragMoveSize.height * 0.5 }
    const offset = { left: 0, top: 0, bottom: 0, right: 18 };
    let nodes = graph.getNodes(),
        nodeParent,
        minVerticalDis = 99999;
    let testLog = '';
    if (!noTarget) {
        for (let i = 0; i < nodes.length; ++i) {
            let node = nodes[i];

            const model: any = node.getModel();

            if (model.type !== 'mindmap-node' || model.id === nameHideRoot) {
                continue;
            }
            if (node.get('group').attr('opacity') < 1) {
                continue;
            }
            const bbox = node.getBBox();
            const isLeft = x < bbox.x - offset.left;
            const isRight = x > bbox.x + bbox.width + offset.right;
            const isTop = y < bbox.y - offset.top;
            const isBottom = y > bbox.y + bbox.height + offset.bottom;
            if (isLeft) {
                continue;
            }
            let parent = node.get('parent');


            if (parent.getModel().id === nameHideRoot) {
                parent = undefined
            }

            if (isRight) {
                let dis = distance(mouse, {
                    x: bbox.x + bbox.width + offset.right,
                    y: bbox.y + bbox.height * 0.5
                });
                if (minVerticalDis > dis) {
                    minVerticalDis = dis;
                    nodeParent = node;
                    testLog = 'right';
                }
            } else if (isBottom) {
                let dis = Math.abs(y - (bbox.y + bbox.height + offset.bottom));
                if (minVerticalDis > dis) {
                    minVerticalDis = dis;
                    nodeParent = parent;
                    testLog = 'bottom';
                }
            } else if (isTop) {
                let dis = Math.abs(bbox.y - offset.top - y);
                if (minVerticalDis > dis) {
                    minVerticalDis = dis;
                    nodeParent = parent;
                    testLog = 'top';
                }
            } else {
                nodeParent = parent;
                testLog = 'center';
            }
        }
    }

    const source = mouseBegin.mouseEdge.getSource();
    if (source && (!nodeParent || nodeParent.getModel().id !== source.getModel().id)) {
        graph.editSelectedNode(source, false, false);
    }
    if (nodeParent) {
        mouseBegin.mouseEdge.show();
        graph.updateItem(mouseBegin.mouseEdge, {
            source: nodeParent.getModel().id
        }, false)
        graph.editSelectedNode(nodeParent, true, false);
    } else {
        mouseBegin.mouseEdge.hide();
    }
}