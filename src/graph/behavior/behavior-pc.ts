import G6 from "@antv/g6";
// pc端自定义行为
import {
    getBezierParams,
    getBezierPath,
    getControlPoint,
    getDotPoints,
    getDragPoint,
    getRotateByPoint,
    setArrowPosition
} from "../nodes/node-utils";
import { MindmapEvent } from "../graph/mindmap-events";
import { IDString, NameString, NodeType } from "../constaints";
import { EdgeTextPadding } from "../nodeTemplate/constant";
import { distance } from "../utils/math";
import { dragNodeMove, dragNodeReady } from "../graph/check-drag-node";
import { MindGraph } from "..";


G6.registerBehavior("behavior-pc", {
    _mouseBegin: undefined,
    dragStatus: "",
    upClientInfo: [],
    lastClickTime: 0,
    moveLinkBegin: undefined,
    enableDelegate: true,
    edgeDragOffset: { x: 0, y: 0 },
    isDragging: false,
    getEvents() {
        return {
            "node:click": "onClickNode",
            "node:dblclick": "editNode",
            "node:mouseover": "onMouseOverNode",
            "node:mouseleave": "onMouseLeaveNode",
            "node:dragstart": "onDragStart",
            "node:dragend": "onDragEnd",
            "node:drag": "onDrag",
            "node:contextmenu": "contextMenu",
            "mousemove": "onCanvasMove",
            "wheel": "onWheel",
            "edge:click": "onClickEdge",
            "edge:mouseenter": "onEdgeEnter",
            "edge:mouseleave": "onEdgeLeave",
            "edge:dragstart": "onEdgeDragStart",
            "edge:drag": "onEdgeDrag",
            "edge:dblclick": "onEdgeDouble",
            "edge:dragend": "onEdgeDragEnd",
            "click": "onClick",
            "canvas:click": "onClickCanvas",
        };
    },
    onEdgeDouble(evt: { target: { get: (arg0: string) => any; }; item: any; }) {
        const graph = this.graph as MindGraph;
        const name = evt.target.get('name');
        if (name === NameString.edgeTitleBg) {
            graph.edgeEditLabel(evt.item, evt.target);
        }
    },
    onClickEdge(evt: any) {
        const graph = this.graph as MindGraph;
        if (graph.tempVariable.moveLinkEdge) {
            return;
        }

        const name = evt.item.getModel().name;
        if (evt.target.get('name') === NameString.edgeTitleBg) {
            // 可以做单点编辑
            return
        }
        if (name === NameString.edgeLink) {
            graph.editClickEdge(evt.item, true);
        }
    },
    onEdgeDragStart(evt: any) {
        this.isDragging = true;
        const graph = this.graph as MindGraph;
        const name = evt.target.get('name');
        if (name === NameString.edgeTitleBg) {
            const { dotPos } = evt.item.getModel();
            let pos = graph.getPointByClient(evt.clientX, evt.clientY);
            this.edgeDragOffset = {
                x: pos.x - dotPos.x,
                y: pos.y - dotPos.y,
            }
        } else {
            this.edgeDragOffset = {
                x: 0,
                y: 0
            }
        }
    },
    onEdgeDrag(evt: any) {
        const graph = this.graph as MindGraph;
        const name = evt.target.get('name');
        if (name === NameString.edgeLinkDot ||
            name === NameString.edgeTitleBg) {
            let pos = graph.getPointByClient(evt.clientX, evt.clientY);
            const { start, end, labelStyle, labelStyle1, labelStyle2, labelType } = evt.item.getModel();
            pos.x -= this.edgeDragOffset.x;
            pos.y -= this.edgeDragOffset.y;
            const control = getControlPoint(start, end, pos, 0.5);

            const textBg = evt.item.getContainer().findAllByName(NameString.edgeTitleBg)[0]
            if (!labelType) {
                const text = evt.item.getContainer().findAllByName(NameString.edgeTitle)[0];
                textBg.attr({
                    x: pos.x - labelStyle.width * 0.5 - EdgeTextPadding.h,
                    y: pos.y - labelStyle.height * 0.5 - EdgeTextPadding.v,
                })
                text.attr({
                    x: pos.x - labelStyle.width * 0.5,
                    y: pos.y,
                })
            } else if (labelType === 2) {
                const text = evt.item.getContainer().findAllByName(NameString.edgeTitle)
                const textBg = evt.item.getContainer().findAllByName(NameString.edgeTitleBg)
                const changePos = (node, text) => {
                    const changeKey = node.attr('changeKey');
                    let dPos: any;
                    let style: any = changeKey === 'label1' ? labelStyle1 : labelStyle2;
                    if (textBg.length === 1) {
                        dPos = pos;
                    } else {
                        dPos = getDragPoint(start, end, control, changeKey === 'label1' ? 0.2 : 0.8);
                    }
                    node.attr({
                        x: dPos.x - style.width * 0.5 - EdgeTextPadding.h,
                        y: dPos.y - style.height * 0.5 - EdgeTextPadding.v,
                    })
                    text.attr({
                        x: dPos.x - style.width * 0.5,
                        y: dPos.y,
                    })
                }
                if (textBg[0]) {
                    changePos(textBg[0], text[0]);
                }
                if (textBg[1]) {
                    changePos(textBg[1], text[1]);
                }
            }
            if (textBg.length > 1) {
                const edgeArrowUp = evt.item.getContainer().findAllByName(NameString.edgeArrowUp)[0];
                const edgeArrowDown = evt.item.getContainer().findAllByName(NameString.edgeArrowDown)[0];
                if (edgeArrowUp) {
                    let aPos = getDragPoint(start, end, control, 0.11);
                    let aPos1 = getDragPoint(start, end, control, 0.1);
                    let angle = getRotateByPoint(aPos, aPos1);
                    setArrowPosition(edgeArrowUp, aPos.x, aPos.y, angle);
                }
                if (edgeArrowDown) {
                    let aPos = getDragPoint(start, end, control, 0.91);
                    let aPos1 = getDragPoint(start, end, control, 0.9);
                    let angle = Math.PI + getRotateByPoint(aPos, aPos1);
                    setArrowPosition(edgeArrowDown, aPos.x, aPos.y, angle);
                }
            }


            if (name === NameString.edgeTitleBg) {
                const dot = evt.item.getContainer().findAllByName(NameString.edgeLinkDot)[0];
                if (dot) {
                    dot.attr({
                        ...pos
                    })
                }
            } else {
                evt.target.attr({
                    ...pos
                })
            }
            const path = evt.item.getContainer().findAllByName(NameString.edgeLinkPath)[0];
            path.attr({
                path: getBezierPath(start, end, control)
            });
        }
    },
    onEdgeDragEnd(evt: any) {
        const graph = this.graph as MindGraph;
        this.isDragging = false;
        const name = evt.target.get('name');
        if (name === NameString.edgeLinkDot ||
            name === NameString.edgeTitleBg) {
            const pos = graph.getPointByClient(evt.clientX, evt.clientY);
            pos.x -= this.edgeDragOffset.x;
            pos.y -= this.edgeDragOffset.y;
            const { start, end } = evt.item.getModel();
            const control = getControlPoint(start, end, pos, 0.5);
            let be = getBezierParams(
                start,
                end,
                control);
            this.graph.modifyEdgeOptions({
                target: evt.item.getTarget().get('id'),
                source: evt.item.getSource().get('id'),
                offset: be.offset,
                curve: be.percent
            });
        }
    },
    onDragStart(evt) {
        this.isDragging = true;
        if (this.moveLinkBegin) {
            return;
        }

        const name = evt.target.get('name');

        if (name === NameString.linkSelectDot ||
            name === NameString.linkCircle) {
            this.dragEdgeDot(evt);
            return;
        }

        if (name === NameString.nodeContainer) {
            this.dragNode(evt);
        }
    },
    onDrag(evt) {
        const name = evt.target.get('name');
        if (this.moveLinkBegin) {
            this.linkMove(evt);
            return;
        }
        if (this._mouseBegin) {
            dragNodeMove(evt, this._mouseBegin, this.graph);
            return;
        }
    },
    onDragEnd(evt) {
        this.isDragging = false;
        if (this.moveLinkBegin) {
            this.graph.deleteLinkBtn();
            this.linkMoveEnd(evt);
            return;
        }
        if (this._mouseBegin) {
            const moveNodeId = this._mouseBegin.startNode.get('id');
            this.dragChangeOpacity(evt.item, 1);
            this.dragNodeEnd();
            if (moveNodeId) {
                const node = this.graph.findById(moveNodeId);
                if (node) {
                    this.graph.editSelectedNode(node, true, true);
                }
            }
            this.graph.removeItem(this._mouseBegin.mouseEdge);
            this.graph.removeItem(this._mouseBegin.mouseNode);
            this._mouseBegin = undefined;
        }
        this.tempSelectNodeId = undefined;
    },
    hideEdgeHoverStatus() {
        if (!this.hoverNodeEdge || this.hoverNodeEdge.destroyed) return;

        const node = this.hoverNodeEdge.get('sourceNode');
        if (node) {
            node.setState('hover', false);
            node.toBack()
        }
        this.hoverNodeEdge = null
    },
    onCanvasMove(evt) {
        if (this.moveLinkBegin) {
            this.linkMove(evt);
            evt.propagationStopped = true
        }
    },
    onClick(evt) {
        if (this.moveLinkBegin) {
            this.linkMoveEnd(evt);
            evt.propagationStopped = true;
            return;
        } else {
        }
    },
    dragEdgeDot(evt) {
        const { item: node } = evt;
        let name = evt.target.get('name');

        if (name === NameString.linkCircle) {
            const linkModel = evt.target.get('model');
            evt.propagationStopped = true;
            this.moveLinkBegin = {
                sourceNode: node,
                startIndex: linkModel.index,
            }
            this.graph.closeLinkBtn();

            this.moveLinkBegin.mouseNode = this.graph.createLinkDot(evt.x, evt.y);
            this.moveLinkBegin.mouseNode.toFront();

            let edgeOptions = {
                id: 'link-mouse-edge',
                source: this.moveLinkBegin.sourceNode.getModel().id,
                target: IDString.linkMouseNode,
                endIndex: 0,
                type: NodeType.linkEdge,
                startIndex: this.moveLinkBegin.startIndex,
                dragging: true,
            }
            this.graph.tempVariable.moveLinkEdge = this.graph.createMouseLinkEdge(edgeOptions);
            this.graph.tempVariable.moveLinkEdge.toFront();
        } else if (name === NameString.linkSelectDot) {

            let selectNode = this.graph._curSelectedNode;
            if (!selectNode) return;
            evt.propagationStopped = true;
            const model = selectNode.getModel();
            if (node.get('id') === IDString.linkTargetDot ||
                node.get('id') === IDString.linkSourceDot) {
                const { x, y } = node.getModel();
                this.moveLinkBegin = {
                    sourceNode: selectNode.getSource(),
                    targetNode: selectNode.getTarget(),
                    startIndex: model.startIndex,
                    endIndex: model.endIndex,
                    modify: true,
                    dotPoint: { x, y }
                }
                this.graph.tempVariable.moveLinkEdge = this.graph._curSelectedNode;
                this.moveLinkBegin.mouseNode = node;
            }
        }
    },
    onEdgeEnter(evt) {
        // if (this.graph._curSelectedNode) return;
        const name = evt.item.getModel().name;
        if (name === NameString.edgeLink) {
            this.graph.updateEdgeState(evt.item, { hover: true })
        }
        if (this.hoverNodeEdge) this.hideEdgeHoverStatus();
        this.hoverNodeEdge = evt.item;
        const node = this.hoverNodeEdge.get('sourceNode');
        // node.setState('hover', true);
        node.toFront();
    },
    onEdgeLeave(evt) {
        // if (this.graph._curSelectedNode) return;
        const name = evt.item.getModel().name;
        if (name === NameString.edgeLink) {
            this.graph.updateEdgeState(evt.item, { hover: false })
        }
        if (this.hoverNodeEdge && evt.item.get('id') === this.hoverNodeEdge.get('id')) {
            clearTimeout(this.hideEdgeHoverTimer);
            const sourceNode = evt.item.get('sourceNode');
            this.hideEdgeHoverTimer = setTimeout(() => {
                clearTimeout(this.hideEdgeHoverTimer);
                if (this.hoverNode && (this.hoverNode.destroyed || this.hoverNode.get('id') === sourceNode.get('id'))) return;
                this.hideEdgeHoverStatus();
            }, 300);
        }
    },
    onWheel() {
        this.graph.editDisabled();
    },
    linkMove(evt) {
        let end = this.graph.getPointByClient(evt.clientX, evt.clientY);
        if (this.moveLinkBegin) {
            this.graph.updateItem(this.moveLinkBegin.mouseNode, {
                x: end.x,
                y: end.y
            }, false)

            const isDragTarget = this.moveLinkBegin.mouseNode.get('id') !== IDString.linkSourceDot;
            let nodes = this.graph.getNodes();
            let isSelected = false, isLinkDot = false;
            for (let i = 0; i < nodes.length; ++i) {
                let node = nodes[i];
                let model = node.get('model');
                if (model.type === NodeType.defaultNode && model.style.visible) {
                    let rect = {
                        x: model.x - 10,
                        y: model.y - 10,
                        width: model.style.width + 40,
                        height: model.style.height + 40
                    };
                    if (end.x > rect.x &&
                        end.x < rect.x + rect.width &&
                        end.y > rect.y &&
                        end.y < rect.y + rect.height) {

                        const isValid = (!isDragTarget && node.get('id') !== this.moveLinkBegin.targetNode.get('id')) ||
                            (isDragTarget && node.get('id') !== this.moveLinkBegin.sourceNode.get('id'));
                        if (isValid) {
                            if (this.moveLinkBegin.curSelectNode &&
                                this.moveLinkBegin.curSelectNode.get('id') !== node.get('id')) {
                                this.graph.updateItem(this.moveLinkBegin.curSelectNode, {
                                    readyLink: undefined
                                }, false)
                            }
                            this.moveLinkBegin.curSelectNode = node;
                            isSelected = true;
                            let readyLink = -1;
                            const { x, y, style: { width, height, beforeWidth, afterWidth } } = node.get('model');
                            const points = getDotPoints({ width, height, beforeWidth, afterWidth });
                            for (let k = 0; k < points.length; ++k) {
                                let pos = points[k];
                                let dis = distance(end, { x: x + pos.x, y: y + pos.y });
                                if (dis < 30) {
                                    //连接
                                    isLinkDot = true;
                                    const edgeModel = this.graph.tempVariable.moveLinkEdge.getModel();
                                    if (isDragTarget && (edgeModel.target !== model.id || edgeModel.endIndex !== k)) {
                                        this.graph.updateItem(this.graph.tempVariable.moveLinkEdge, {
                                            target: model.id,
                                            endIndex: k
                                        }, false)
                                    } else if (!isDragTarget && (edgeModel.source !== model.id || edgeModel.startIndex !== k)) {
                                        this.graph.updateItem(this.graph.tempVariable.moveLinkEdge, {
                                            source: model.id,
                                            startIndex: k
                                        }, false)
                                    }
                                    readyLink = k;
                                    break;
                                }
                            }
                            if (model.readyLink !== readyLink) {
                                this.graph.updateItem(node, {
                                    readyLink
                                }, false)
                            }
                        }
                        break;
                    }
                }
            }

            if (!isLinkDot) {
                if (!isDragTarget) {
                    this.graph.updateItem(this.graph.tempVariable.moveLinkEdge, {
                        source: this.moveLinkBegin.mouseNode.get('id'),
                        startIndex: undefined
                    }, false)
                } else {
                    this.graph.updateItem(this.graph.tempVariable.moveLinkEdge, {
                        target: this.moveLinkBegin.mouseNode.get('id'),
                        endIndex: undefined
                    }, false)
                }

            }
            if (!isSelected) {
                if (this.moveLinkBegin.curSelectNode) {
                    this.graph.updateItem(this.moveLinkBegin.curSelectNode, {
                        readyLink: undefined
                    }, false)
                    this.moveLinkBegin.curSelectNode = undefined;
                }
            }
        }
    },
    linkMoveEnd() {
        if (this.moveLinkBegin.mouseNode) {
            const { moveLinkEdge } = this.graph.tempVariable;
            if (moveLinkEdge) {
                let edgeModel = moveLinkEdge.get('model');
                if (edgeModel.target === IDString.linkTargetDot) {
                    this.dragLinkReset(true, true);
                    return;
                } else if (edgeModel.source === IDString.linkSourceDot) {
                    this.dragLinkReset(true, false);
                    return;
                } else if (edgeModel.target === IDString.linkMouseNode) {
                    this.dragLinkReset(false, false);
                    return;
                }

                const options = {
                    startIndex: edgeModel.startIndex,
                    endIndex: edgeModel.endIndex,
                    target: edgeModel.target,
                    source: edgeModel.source,
                }
                if (this.moveLinkBegin.sourceNode && this.moveLinkBegin.targetNode) {

                    //modify
                    const old = {
                        startIndex: this.moveLinkBegin.startIndex,
                        endIndex: this.moveLinkBegin.endIndex,
                        target: this.moveLinkBegin.targetNode.get('id'),
                        source: this.moveLinkBegin.sourceNode.get('id'),
                    }
                    if (old.startIndex === options.startIndex &&
                        old.endIndex === options.endIndex &&
                        old.target === options.target &&
                        old.source === options.source) {
                        this.dragLinkReset(false, false);
                        this.graph.resetEdge({ ...edgeModel, ...options });
                        return;
                    }

                    if ((old.target !== options.target || old.source !== options.source) && this.graph.exsitLink(options.source, options.target)) {
                        this.dragLinkReset(false, false);
                        this.graph.resetEdge({ ...edgeModel, ...old });
                        return;
                    }
                    const modify = {
                        old,
                        options,
                    }
                    this.dragLinkReset(false, false);
                    this.graph.modifyEdgeTargetOrSource(modify)

                    return;
                } else {
                    this.dragLinkReset(false, false);
                    this.graph.createEdge(options);
                }
            }
        }
    },
    dragLinkReset(reset = false, isTarget = false) {
        const { moveLinkEdge } = this.graph.tempVariable;
        if (this.moveLinkBegin.curSelectNode) {
            this.graph.updateItem(this.moveLinkBegin.curSelectNode, {
                readyLink: undefined
            }, false)
        }
        if (reset) {
            if (isTarget) {
                this.graph.updateItem(moveLinkEdge, {
                    target: this.moveLinkBegin.targetNode.get('id'),
                    endIndex: this.moveLinkBegin.endIndex,
                }, false)
            } else {
                this.graph.updateItem(moveLinkEdge, {
                    source: this.moveLinkBegin.sourceNode.get('id'),
                    startIndex: this.moveLinkBegin.startIndex,
                }, false)
            }
            // moveLinkEdge.toBack();
            this.graph.updateItem(this.moveLinkBegin.mouseNode, {
                ...this.moveLinkBegin.dotPoint
            })
            this.moveLinkBegin.mouseNode.toFront();
        } else {
            const dotId = this.moveLinkBegin.mouseNode.get('id');
            this.graph.cancelSelect();
            if (dotId === IDString.linkSourceDot || dotId === IDString.linkTargetDot) {
                this.moveLinkBegin.mouseNode = undefined;
                if (!this.graph.tempVariable.moveLinkEdge.destroyed) {
                    this.graph.removeItem(this.graph.tempVariable.moveLinkEdge, false);
                }
            } else {
                this.graph.removeItem(this.graph.tempVariable.moveLinkEdge, false);
                this.graph.removeItem(this.moveLinkBegin.mouseNode, false);
            }
            this.graph.tempVariable.moveLinkEdge = undefined;
            this.moveLinkBegin.mouseNode = undefined;
        }
        if (this.moveLinkBegin.sourceNode) {
            this.moveLinkBegin.sourceNode.toBack();
        }
        if (this.moveLinkBegin.targetNode) {
            this.moveLinkBegin.targetNode.toBack();
        }

        this.graph.tempVariable.moveLinkEdge = undefined;
        this.moveLinkBegin = undefined;
    },
    onClickCanvas(evt: any) {
        this.graph.cancelSelect();
        this.graph.closeLinkBtn();
    },
    onClickNode(evt: any) {
        if (this.moveLinkBegin) {
            return;
        }
        const name = evt.target.get('name');
        if (name === NameString.linkCircle) {
            evt.propagationStopped = true;
            this.dragEdgeDot(evt);
            return;
        } else if (name === NameString.collapseClick) {
            evt.propagationStopped = true;
            this.graph.editCollapse(evt.item);
            return;
        } else if (name === NameString.nodeContainer) {
            if (Date.now() - this.lastClickTime < 500) return; //  如果500ms内连续点击了两次为双击行为，不做任何处理
            this.lastClickTime = Date.now();
            this.graph.editSelectedNode(evt.item, true);
        } else if (evt.item.getModel().type === NodeType.shrinkRoot) {
            if (evt.target.get('name') === 'box-recover') {
                this.graph.recoverParent(evt.item);
            }
        }
    },
    contextMenu(evt) {
        evt.propagationStopped = true;
    },
    editNode(evt) {
        const model = evt.item.getModel()
        if (model.type === NodeType.shrinkRoot) return;
        if (model.id === 'root' || !model.id) return;
        this.graph.editItem(evt.item);
    },
    onMouseOverNode(evt) {
        if (this.isDragging) {
            return;
        }
        const { item: node } = evt;
        this.hoverNode = node;
        const name = evt.target.get('name');
        if (name === NameString.linkSelectDot) {
            evt.target.toFront();
            return;
        }
        if (this.graph._curSelectedNode && !this.graph._curSelectedNode.destroyed
            && this.graph._curSelectedNode.get('type') === 'edge') {
            return;
        }
        if (this.moveLinkBegin) {
            return;
        }
        if (this.graph.tempVariable.linkNode &&
            this.graph.tempVariable.linkNode.getModel().id === node.getModel().id) {
            return;
        }

        if (name === NameString.linkEdgeCircle) {
            return;
        }
        if (name !== NameString.nodeContainer) return;
        node.setState("hover", true);
        node.toFront();
        if (this.graph.tempVariable?.linkNode) {
            this.graph.tempVariable?.linkNode.toFront();
        }
        return true;
    },
    onMouseLeaveNode(evt) {
        if (this.isDragging) {
            return;
        }
        const { item: node } = evt;
        if (this.graph.tempVariable.linkNode &&
            this.graph.tempVariable.linkNode.getModel().id === node.getModel().id) {
            return;
        }
        if (this.graph.tempVariable.moveLinkEdge) {
            return;
        }
        if (node.getModel().type === NodeType.defaultNode) {
            if (node.hasState('hover')) {
                node.setState("hover", false);
                this.hoverNode = null;
                if (!node.hasState('selected')) {
                    node.toBack();
                }
            }
        }

    },

    dragNode(evt) {
        const mouseBegin = dragNodeReady(evt, this.graph);
        if (mouseBegin) {
            this.dragChangeOpacity(evt.item);
            this._mouseBegin = mouseBegin;
            this.graph.emit('change', {
                type: MindmapEvent.dragNode,
                options: {
                    id: evt.item?.getModel().id
                }
            })
        }
        // const { item: node } = evt;
        // const model = node.get('model')
        // if (model.isRoot) return;
        // const { x, y } = this.graph.getPointByClient(evt.clientX, evt.clientY);
        // this._mouseBegin = {
        //     clientX: evt.clientX,
        //     clientY: evt.clientY,
        //     startNode: node,
        //     offset: { x: (x - model.x) / model.style.width * 40 - 6, y: (y - model.y) / model.style.height * 20 }
        // }

        // this.dragChangeOpacity(evt.item);

        // this._mouseBegin.mouseNode = this.graph.createDragNode(x - this._mouseBegin.offset.x, y - this._mouseBegin.offset.y);
        // this._mouseBegin.mouseEdge = this.graph.createDragEdge({ source: this._mouseBegin.startNode.get('parent').getModel().id });
        // this._mouseBegin.mouseNode.toFront();
        // this._mouseBegin.mouseEdge.toFront();
    },

    dragChangeOpacity(node, opacity = 0.2) {
        if (node) {
            node.get('group').attr('opacity', opacity)
            node.get("edges").forEach((edge) => {
                edge.get('group').attr('opacity', opacity)
            });
            const children = node.get('children');
            if (children) {
                children.forEach(node => {
                    this.dragChangeOpacity(node, opacity);
                })
            }
        }
    },
    // dragNodeMove(evt) {
    //     if (!this._mouseBegin) {
    //         return;
    //     }
    //     const { x, y } = this.graph.getPointByClient(evt.clientX, evt.clientY);
    //     let pos = {
    //         x: x - this._mouseBegin.offset.x,
    //         y: y - this._mouseBegin.offset.y,
    //     }
    //     this.graph.updateItem(this._mouseBegin.mouseNode, pos, false);
    //     const edge = {
    //         x: evt.clientX - this._mouseBegin.offset.x - 12,
    //         y: evt.clientY - dragMoveSize.height * 0.5,
    //     }
    //     const win = {
    //         width: window.document.body.clientWidth,
    //         height: window.document.body.clientHeight
    //     }
    //     this.checkTargetNode(pos, edge.y < 0 || edge.y > win.height || edge.x < 0 || edge.x > win.width)
    // },

    // checkTargetNode({ x, y }, noTarget = false) {
    //     if (this._mouseBegin.startNode && !this._mouseBegin.startNode.get('parent')) return;
    //     const mouse = { x: x - 6, y: y + dragMoveSize.height * 0.5 }
    //     const offset = { left: 0, top: 0, bottom: 0, right: 18 };
    //     let nodes = this.graph.getNodes(),
    //         nodeParent,
    //         minVerticalDis = 99999;
    //     let testLog = '';
    //     if (!noTarget) {
    //         for (let i = 0; i < nodes.length; ++i) {
    //             let node = nodes[i];

    //             const model: any = node.getModel();

    //             if (model.type !== 'mindmap-node' || model.id === nameHideRoot) {
    //                 continue;
    //             }
    //             if (node.get('group').attr('opacity') < 1) {
    //                 continue;
    //             }
    //             const bbox = node.getBBox();
    //             const isLeft = x < bbox.x - offset.left;
    //             const isRight = x > bbox.x + bbox.width + offset.right;
    //             const isTop = y < bbox.y - offset.top;
    //             const isBottom = y > bbox.y + bbox.height + offset.bottom;
    //             if (isLeft) {
    //                 continue;
    //             }
    //             let parent = node.get('parent');


    //             if (parent.getModel().id === nameHideRoot) {
    //                 parent = undefined
    //             }

    //             if (isRight) {
    //                 let dis = distance(mouse, {
    //                     x: bbox.x + bbox.width + offset.right,
    //                     y: bbox.y + bbox.height * 0.5
    //                 });
    //                 if (minVerticalDis > dis) {
    //                     minVerticalDis = dis;
    //                     nodeParent = node;
    //                     testLog = 'right';
    //                 }
    //             } else if (isBottom) {
    //                 let dis = Math.abs(y - (bbox.y + bbox.height + offset.bottom));
    //                 if (minVerticalDis > dis) {
    //                     minVerticalDis = dis;
    //                     nodeParent = parent;
    //                     testLog = 'bottom';
    //                 }
    //             } else if (isTop) {
    //                 let dis = Math.abs(bbox.y - offset.top - y);
    //                 if (minVerticalDis > dis) {
    //                     minVerticalDis = dis;
    //                     nodeParent = parent;
    //                     testLog = 'top';
    //                 }
    //             } else {
    //                 nodeParent = parent;
    //                 testLog = 'center';
    //             }
    //         }
    //     }

    //     const source = this._mouseBegin.mouseEdge.getSource();
    //     if (source && (!nodeParent || nodeParent.getModel().id !== source.getModel().id)) {
    //         this.graph.editSelectedNode(source, false, false);
    //     }
    //     if (nodeParent) {
    //         this._mouseBegin.mouseEdge.show();
    //         this.graph.updateItem(this._mouseBegin.mouseEdge, {
    //             source: nodeParent.getModel().id
    //         }, false)
    //         this.graph.editSelectedNode(nodeParent, true, false);
    //     } else {
    //         this._mouseBegin.mouseEdge.hide();
    //     }
    // },
    dragNodeEnd() {
        if (!this._mouseBegin.startNode.get('parent')) return;
        const source = this._mouseBegin.mouseEdge.getSource();
        const startParent = this._mouseBegin.startNode.get('parent');
        if (!source || !startParent || !this._mouseBegin.mouseEdge.get('visible')) return;

        const startParentModel = startParent.getModel();
        const children = source.getModel().children;

        const startModel = this._mouseBegin.startNode.getModel()
        const dragY = this._mouseBegin.mouseEdge.getTarget().getBBox().y;


        let changeIndex = -1;
        if (source.getModel().collapsed) {
            changeIndex = children.length;
        } else {
            if (children && children.length > 0) {
                for (let i = 0; i < children.length; ++i) {
                    const child = children[i];
                    const bbox = child;
                    if (bbox.y > dragY) {
                        changeIndex = i;
                        break;
                    }
                }
                if (changeIndex === -1) {
                    changeIndex = children.length;
                }
            } else {
                changeIndex = 0;
            }
        }

        if (startParentModel.id === source.getModel().id) {
            if (changeIndex === 0) {
                if (children[changeIndex] && children[changeIndex].id === startModel.id) {
                    return;
                }
            } else if (changeIndex >= children.length) {
                if (children[children.length - 1].id === startModel.id) {
                    return;
                }
            } else {
                if ((children[changeIndex - 1].id === startModel.id) ||
                    (children[changeIndex].id === startModel.id)) {
                    return;
                }
                let idx = children.findIndex((item: any) => item.id === startModel.id);
                if (idx < changeIndex) {
                    changeIndex -= 1;
                }
            }
        }

        let oldSortId = startModel.sortId;
        const updateParams: any = {
            articleId: startModel.id,
            title: startModel.title,
            parentId: source.getModel().id !== startModel.id && source.getModel().id !== 'root' ? source.getModel().id : undefined,
            sort: 0
        }, updateSorts = [];

        let startData, p, isRepaintEdge = false, idx;
        if (startParentModel.id === source.getModel().id) {
            p = this.graph.findDataById(source.getModel().id);
            idx = p.children.findIndex(r => r.id === startModel.id);
            startData = p.children.splice(idx, 1)[0];
        } else {
            startData = this.graph.findDataById(startModel.id);
            let pdx = startParentModel.children.findIndex(r => r.id === startModel.id);
            if (pdx !== -1) {
                for (let i = pdx + 1; i < startParentModel.children.length; ++i) {
                    updateSorts.push({
                        articleId: startParentModel.children[i].id,
                        sort: i - 1
                    })
                }
            }
            this.graph.removeChild(startModel.id);
            p = this.graph.findDataById(source.getModel().id);
            isRepaintEdge = true;
        }

        updateParams.sort = changeIndex >= p.children.length ? p.children.length : changeIndex;

        if (p.children[0] && p.children[0].visible === false) {
            p.children.splice(0, 1, startData);
            updateParams.sort = 0;
        } else {
            p.children.splice(changeIndex, 0, startData);
        }

        p.collapsed = false;
        this.graph.data(this.graph.get('data'))

        this.graph.layout();

        if (isRepaintEdge) {
            this.graph.repaintEdge();
        }

        let ps = idx >= 0 && idx < updateParams.sort ? idx : updateParams.sort;
        for (let i = ps; i < p.children.length; ++i) {
            if (i !== updateParams.sort) {
                updateSorts.push({
                    articleId: p.children[i].id,
                    sort: i
                })
            }
        }


        updateParams.updateSorts = updateSorts;
        let newSortId = this.graph.findById(p.id).getModel().sortId;
        const s = oldSortId.split('-');
        s.shift()
        const t = newSortId.split('-');
        t.shift()
        this.graph.emit("change", {
            type: MindmapEvent.nodeMove,
            options: {
                model: {
                    oldIndexArr: s,
                    newIndexArr: t,
                    oldId: startModel.id,
                    newId: p.id,
                    sort: updateParams.sort,
                },
                updateParams,
                p: {
                    nodes: startData,
                    edges: this.graph.getNodeAndChildrenEdgesById(startData.id)
                }
            }
        });
    },
});
