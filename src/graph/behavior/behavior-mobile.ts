import G6 from "@antv/g6";
// pc端自定义行为
import { dragMoveSize } from "../variable";
import {
    getBezierParams,
    getBezierPath,
    getControlPoint,
    getDotPoints,
    getDragPoint,
    getRotateByPoint,
    setArrowPosition
} from "../nodes/node-utils";
import { EventName, MindmapEvent } from "../graph/mindmap-events";
import { IDString, NameString, NodeType, nameHideRoot } from "../constaints";
import { EdgeTextPadding } from "../nodeTemplate/constant";
import { distance } from "../utils/math";

import { Util } from '@antv/g6-core';
import { isBoolean, isObject } from '@antv/util';
const { cloneEvent, isNaN } = Util;
const { abs } = Math;
const DRAG_OFFSET = 10;

G6.registerBehavior("behavior-mobile", {
    _mouseBegin: undefined,
    dragStatus: "",
    upClientInfo: [],
    lastClickTime: 0,
    moveLinkBegin: undefined,
    enableDelegate: true,
    edgeDragOffset: { x: 0, y: 0 },
    isDragging: false,
    dragReady: undefined,
    edgeDragReady: undefined,
    getEvents() {
        return {
            "node:touchstart": "onDragStart",
            "node:touchend": "onNodeTouchEnd",
            "node:touchmove": "onDragNode",
            "edge:touchend": "onClickEdge",
            "edge:touchstart": "onEdgeDragStart",
            "edge:touchmove": "onEdgeDrag",
            "canvas:touchstart": "onClickCanvas",
            "canvas:touchend": "onCanvasEnd",
            "canvas:touchmove": "onCanvasDarag",
        };
    },
    onDragNode(evt) {
        if (this.dragCanvas) return;
        this.onDrag(evt);
    },
    onEdgeDouble(evt) {
        const name = evt.target.get('name');
        if (name === NameString.edgeTitleBg) {
            this.graph.edgeEditLabel(evt.item, evt.target);
        }
    },
    cancelSelectLabel() {
        if (this.selectLabelNode && !this.selectLabelNode.destroyed) {
            this.selectLabelNode.attr({
                stroke: 'transparent'
            })
            this.selectLabelNode = undefined;
        }
    },
    onClickEdge(evt) {
        if (evt.item._cfg.currentShape === "round-poly") {
            this.graph.emit(EventName.change, {
                type: MindmapEvent.edgeClick,
                options: {
                    node: evt.item
                }
            })
            return;
        }
        if (this.dragReady) {
            this.onDragEnd(evt)
            return;
        }
        if (this.isDragging) {
            this.onEdgeDragEnd(evt);
            this.edgeDragReady = undefined;
            return;
        }
        if (this.graph.tempVariable.moveLinkEdge) {
            return;
        }
        if (evt.target.get('name') === NameString.edgeTitleBg) {
            this.graph.cancelSelectNode();
            this.cancelSelectLabel();
            evt.target.attr({
                ...this.graph.edgeLinkStyle.edgeLabelSelectedStyle
            })


            this.selectLabelNode = evt.target;
            
            
            if (this.graph.isDoubleEdit) {
                if (!this.edgeTimer) {
                    this.edgeTimer = setTimeout(() => {
                        this.edgeTimer = undefined;
                    }, 240);
                } else {
                    //双击
                    // this.editNode(evt);
                    this.graph.emit('change', {
                        type: MindmapEvent.labelDoubleClick,
                        options: {
                            node: evt.target
                        }
                    })
                }
            }
            this.graph.emit(EventName.change, {
                type: MindmapEvent.mobileClickNode,
                options: {
                    node: evt.item
                }
            })
            this.graph.emit('change', {
                type: MindmapEvent.labelClick,
                options: {
                    node: evt.target,
                    edge: evt.item
                }
            })
            
            return
        }
        const name = evt.item.getModel().name;
        if (name === NameString.edgeLink) {
            this.cancelSelectLabel();
            evt.item.toFront();
            this.graph.editClickEdge(evt.item, true);
            this.graph.findById(IDString.linkTargetDot)?.toFront();
            this.graph.findById(IDString.linkSourceDot)?.toFront();
        }

    },
    onEdgeDragReady(evt) {
        if (!this.edgeDragReady || !this.edgeDragReady.node || this.edgeDragReady.node.destroyed) return;
        this.isDragging = true;
        const name = this.edgeDragReady.name;
        if (name === NameString.edgeTitleBg) {
            const { dotPos } = this.edgeDragReady.node.getModel();
            let pos = this.graph.getPointByClient(evt.clientX, evt.clientY);
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
    onEdgeDragStart(evt) {
        this.graph.editDisabled();
        this.edgeDragReady = {
            node: evt.item,
            name: evt.target.get('name'),
            target: evt.target
        }
        this.onTouchStart(evt);
    },
    onEdgeDrag(evt) {
        if (this.dragCanvas) return;
        if (this.dragReady) {
            this.onDrag(evt)
            return;
        }
        if (!this.edgeDragReady) return;
        if (!this.isDragging) {
            this.onEdgeDragReady(evt);
            return;
        }
        const { name, node, target } = this.edgeDragReady;
        if (name === NameString.edgeLinkDot ||
            name === NameString.edgeTitleBg) {
            const pos = this.graph.getPointByClient(evt.clientX, evt.clientY);
            const { start, end, labelStyle, labelStyle1, labelStyle2, labelType } = node.getModel();
            pos.x -= this.edgeDragOffset.x;
            pos.y -= this.edgeDragOffset.y;
            const control = getControlPoint(start, end, pos, 0.5);
            const textBg = node.getContainer().findAllByName(NameString.edgeTitleBg)[0]
            if (!labelType) {
                const text = node.getContainer().findAllByName(NameString.edgeTitle)[0];
                textBg.attr({
                    x: pos.x - labelStyle.width * 0.5 - EdgeTextPadding.h,
                    y: pos.y - labelStyle.height * 0.5 - EdgeTextPadding.v,
                })
                text.attr({
                    x: pos.x - labelStyle.width * 0.5,
                    y: pos.y,
                })
            } else if (labelType === 2) {
                const text = node.getContainer().findAllByName(NameString.edgeTitle)
                const textBg = node.getContainer().findAllByName(NameString.edgeTitleBg)
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
                const edgeArrowUp = node.getContainer().findAllByName(NameString.edgeArrowUp)[0];
                const edgeArrowDown = node.getContainer().findAllByName(NameString.edgeArrowDown)[0];
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
                const dot = node.getContainer().findAllByName(NameString.edgeLinkDot)[0];
                if (dot) {
                    dot.attr({
                        ...pos
                    })
                }
            } else {
                target.attr({
                    ...pos
                })
            }
            const path = node.getContainer().findAllByName(NameString.edgeLinkPath)[0];
            path.attr({
                path: getBezierPath(start, end, control)
            });
        }
    },
    onEdgeDragEnd(evt) {
        if (!this.edgeDragReady) {
            this.isDragging = false;
            return;
        };
        this.isDragging = false;
        const name = this.edgeDragReady.name;
        if (name === NameString.edgeLinkDot ||
            name === NameString.edgeTitleBg) {
            const pos = this.graph.getPointByClient(evt.clientX, evt.clientY);
            pos.x -= this.edgeDragOffset.x;
            pos.y -= this.edgeDragOffset.y;
            const { start, end } = evt.item.getModel();
            const control = getControlPoint(start, end, pos, 0.5);
            let be = getBezierParams(
                start,
                end,
                control);
            this.graph.modifyEdgeOptions({
                target: this.edgeDragReady.node.getTarget().get('id'),
                source: this.edgeDragReady.node.getSource().get('id'),
                offset: be.offset,
                curve: be.percent
            });
        }
        this.edgeDragReady = undefined;
    },
    onNodeTouchEnd(evt) {
        clearTimeout(this.timer);
        this.isDragStart = false;
        this.cancelSelectLabel();
        evt.preventDefault();
        if (this.graph.isDoubleEdit) {
            if (!this.isDragging) {
                this.dragReady = undefined;
                this.onClickNode(evt);
                if (!this.nodeTimer) {
                    this.nodeTimer = setTimeout(() => {
                        this.nodeTimer = undefined;
                    }, 240);
                } else {
                    //双击
                    this.editNode(evt);
                }

            } else {
                this.onDragEnd(evt);
            }
        } else {
            this.onDragEnd(evt);
        }

    },
    onDragReady(evt) {
        if (!this.dragReady) return;
        this.isDragging = true;
        if (this.moveLinkBegin) {
            return;
        }

        const name = this.dragReady.name;

        if (name === NameString.linkSelectDot ||
            name === NameString.linkCircle) {
            this.dragEdgeDot(evt);
            return;
        }

        if (name === NameString.nodeContainer) {
            this.dragNode(evt);
        }
    },
    onDragStart(evt) {
        if (this.isDragStart) return;

        this.graph.editDisabled();
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.isDragStart = true;
            this.dragReady = {
                name: evt.target.get('name'),
                node: evt.item,
                target: evt.target
            }
        }, 200);

        this.onTouchStart(evt);

    },
    onCanvasEnd(evt) {
        this.dragCanvas = false;
        this.onDragEnd(evt);
    },
    onCanvasDarag(evt) {
        this.dragCanvas = true;
        this.onDrag(evt);
    },
    onDrag(evt) {
        this.graph.emit(EventName.change, {
            type: MindmapEvent.canvasMove
        })
        clearTimeout(this.timer);
        if (this.edgeDragReady && (this.edgeDragReady.name === NameString.edgeLinkDot || this.edgeDragReady.name === NameString.edgeTitleBg)) {
            this.onEdgeDrag(evt);
            return;
        }

        if (!this.isDragging && this.dragReady) {
            this.onDragReady(evt);
            return;
        }
        if (this.moveLinkBegin && this.dragReady) {
            this.linkMove(evt);
            return;
        }
        if (this._mouseBegin && this.isDragStart && this.dragReady) {
            this.dragNodeMove(evt);
            return;
        }
        this.onTouchCanvasMove(evt)
    },
    onDragEnd(evt) {
        if (this.isTouchMove) {
            this.isTouchMove = false;
            return;
        }
        this.isDragStart = false;
        this.edgeDragReady = undefined;
        this.dragReady = undefined;
        if (!this.isDragging) {
            this.onClickNode(evt);
            return;
        }

        this.isDragging = false;
        if (this.moveLinkBegin) {
            if (this.moveLinkBegin.mouseNode) {
                this.moveLinkBegin.mouseNode.enableCapture(true);
                this.moveLinkBegin.mouseNode.toFront();
            }
            if (this.graph.tempVariable.moveLinkEdge) {
                this.graph.tempVariable.moveLinkEdge.enableCapture(false);
            }
            this.graph.deleteLinkBtn();
            this.linkMoveEnd(evt);
            return;
        }
        if (this._mouseBegin) {
            const moveNodeId = this._mouseBegin.startNode.get('id');
            this.dragChangeOpacity(this._mouseBegin.startNode, 1);
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
        this.onTouchUp(evt);
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
            // evt.propagationStopped = true
        }
    },
    onClick(evt) {
        if (this.moveLinkBegin) {
            this.linkMoveEnd(evt);
            // evt.propagationStopped = true;
            return;
        } else {
        }
    },
    dragEdgeDot(evt) {
        const { node, target } = this.dragReady;
        const name = target.get('name')
        if (name === NameString.linkCircle) {
            const linkModel = target.get('model');
            this.moveLinkBegin = {
                sourceNode: node,
                startIndex: linkModel.index,
            }
            this.graph.closeLinkBtn();

            this.moveLinkBegin.mouseNode = this.graph.createLinkDot(evt.x, evt.y);
            this.moveLinkBegin.mouseNode.toFront();
            this.moveLinkBegin.mouseNode.enableCapture(false);
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
            this.graph.tempVariable.moveLinkEdge.enableCapture(false);
        } else if (name === NameString.linkSelectDot) {
            let selectNode = this.graph._curSelectedNode;
            if (!selectNode) return;
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
                this.moveLinkBegin.mouseNode.enableCapture(false);
                this.graph.tempVariable.moveLinkEdge.enableCapture(false);
            }
        }
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
                if (this.moveLinkBegin.mouseNode && !this.moveLinkBegin.mouseNode?.destroyed) {
                    this.moveLinkBegin.mouseNode.enableCapture(true);
                }
                this.moveLinkBegin.mouseNode = undefined;
                if (this.graph.tempVariable.moveLinkEdge && !this.graph.tempVariable.moveLinkEdge?.destroyed) {
                    this.graph.removeItem(this.graph.tempVariable.moveLinkEdge, false);
                }
            } else {
                this.graph.removeItem(this.graph.tempVariable.moveLinkEdge, false);
                this.graph.removeItem(this.moveLinkBegin.mouseNode, false);
            }
            if (this.graph.tempVariable.moveLinkEdge && !this.graph.tempVariable.moveLinkEdge?.destroyed) {
                this.graph.tempVariable.moveLinkEdge.enableCapture(true);
            }
            this.graph.tempVariable.moveLinkEdge = undefined;
            if (this.moveLinkBegin.mouseNode && !this.moveLinkBegin.mouseNode?.destroyed) {
                this.moveLinkBegin.mouseNode.enableCapture(true);
            }
            this.moveLinkBegin.mouseNode = undefined;
        }
        if (this.moveLinkBegin.sourceNode) {
            this.moveLinkBegin.sourceNode.toBack();
        }
        if (this.moveLinkBegin.targetNode) {
            this.moveLinkBegin.targetNode.toBack();
        }

        if (this.graph.tempVariable.moveLinkEdge && !this.graph.tempVariable.moveLinkEdge?.destroyed) {
            this.graph.tempVariable.moveLinkEdge.enableCapture(true);
        }
        this.graph.tempVariable.moveLinkEdge = undefined;
        this.moveLinkBegin = undefined;
    },
    onClickCanvas(evt) {
        this.graph.editDisabled();
        this.cancelSelectLabel();
        this.graph.cancelSelect();
        this.graph.closeLinkBtn();
        this.graph.emit(EventName.change, {
            type: MindmapEvent.canvasClick
        })

        this.onTouchStart(evt);

    },
    onClickNode(evt) {
        if (this.moveLinkBegin) {
            return;
        }
        const name = evt.target.get('name');
        if (name === NameString.linkCircle) {
            // evt.propagationStopped = true;
            this.dragEdgeDot(evt);
            return;
        } else if (name === NameString.collapseClick) {
            // evt.propagationStopped = true;
            this.graph.editCollapse(evt.item);
            return;
        } else if (name === NameString.nodeContainer) {
            if (Date.now() - this.lastClickTime < 500) return; //  如果500ms内连续点击了两次为双击行为，不做任何处理
            this.lastClickTime = Date.now();
            this.graph.editSelectedNode(evt.item, true);
            this.graph.emit(EventName.change, {
                type: MindmapEvent.mobileClickNode,
                options: {
                    node: evt.item
                }
            })
        } else if (evt.item && evt.item.getModel().type === NodeType.shrinkRoot) {
            if (evt.target.get('name') === 'box-recover') {
                this.graph.recoverParent(evt.item);
            }
        }
    },
    editNode(evt) {
        this.graph.editDisabled();
        const model = evt.item.getModel()
        if (model.type === NodeType.shrinkRoot) return;
        if (model.id === 'root' || !model.id) return;
        this.graph.editItem(evt.item);
    },
    dragNode(evt) {
        const { node } = this.dragReady;
        const model = node.get('model')
        if (model.isRoot) return;
        const { x, y } = this.graph.getPointByClient(evt.clientX, evt.clientY);
        this._mouseBegin = {
            clientX: evt.clientX,
            clientY: evt.clientY,
            startNode: node,
            offset: { x: (x - model.x) / model.style.width * 40 - 6, y: (y - model.y) / model.style.height * 20 }
        }

        this.dragChangeOpacity(node);


        this._mouseBegin.mouseNode = this.graph.createDragNode(x - this._mouseBegin.offset.x, y - this._mouseBegin.offset.y);
        this._mouseBegin.mouseEdge = this.graph.createDragEdge({ source: this._mouseBegin.startNode.get('parent').getModel().id });
        this._mouseBegin.mouseNode.toFront();
        this._mouseBegin.mouseEdge.toFront();
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
    dragNodeMove(evt) {
        if (!this._mouseBegin) {
            return;
        }
        const { x, y } = this.graph.getPointByClient(evt.clientX, evt.clientY);
        let pos = {
            x: x - this._mouseBegin.offset.x,
            y: y - this._mouseBegin.offset.y,
        }
        this.graph.updateItem(this._mouseBegin.mouseNode, pos, false);
        const edge = {
            x: evt.clientX - this._mouseBegin.offset.x - 12,
            y: evt.clientY - dragMoveSize.height * 0.5,
        }
        const win = {
            width: window.document.body.clientWidth,
            height: window.document.body.clientHeight
        }
        this.checkTargetNode(pos, edge.y < 0 || edge.y > win.height || edge.x < 0 || edge.x > win.width)
    },
    checkTargetNode({ x, y }, noTarget = false) {
        if (!this._mouseBegin.startNode.get('parent')) return;
        const mouse = { x: x - 6, y: y + dragMoveSize.height * 0.5 }
        const offset = { left: 0, top: 0, bottom: 0, right: 18 };
        let nodes = this.graph.getNodes(),
            nodeParent,
            minVerticalDis = 99999;
        let testLog = '';
        if (!noTarget) {
            for (let i = 0; i < nodes.length; ++i) {
                let node = nodes[i];

                const model: any = node.getModel();
                if (model.type !== 'mindmap-node' || model.isRoot) {
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

        const source = this._mouseBegin.mouseEdge.getSource();
        if (source && (!nodeParent || nodeParent.getModel().id !== source.getModel().id)) {
            this.graph.editSelectedNode(source, false, false);
        }
        if (nodeParent) {
            this._mouseBegin.mouseEdge.show();
            this.graph.updateItem(this._mouseBegin.mouseEdge, {
                source: nodeParent.getModel().id
            }, false)
            this.graph.editSelectedNode(nodeParent, true, false);
        } else {
            this._mouseBegin.mouseEdge.hide();
        }
    },
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
                    if (bbox.y === undefined) {

                        changeIndex = -1;
                        break;
                    }
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
                let idx = children.findIndex(item => item.id === startModel.id);
                if (idx < changeIndex) {
                    changeIndex -= 1;
                }
            }
        }


        let iconType = startModel.iconType === 0 ? 99 : startModel.iconType === 0 ? 99 : startModel.iconType;
        let oldSortId = startModel.sortId;
        const updateParams: any = {
            articleId: startModel.id,
            title: startModel.title,
            parentId: source.getModel().id !== startModel.id && source.getModel().id !== 'root' ? source.getModel().id : undefined,
            iconType: iconType,
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
        p.children.splice(changeIndex, 0, startData);
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
    //drag canvas
    updateViewport(e) {
        const { origin } = this;
        const clientX = +e.clientX;
        const clientY = +e.clientY;

        if (isNaN(clientX) || isNaN(clientY)) {
            return;
        }
        let dx = clientX - origin.x;
        let dy = clientY - origin.y;

        if (this.get('direction') === 'x') {
            dy = 0;
        } else if (this.get('direction') === 'y') {
            dx = 0;
        }
        this.origin = {
            x: clientX,
            y: clientY,
        };
        const width = this.graph.get('width');
        const height = this.graph.get('height');
        const graphCanvasBBox = this.graph.get('canvas').getCanvasBBox();

        let expandWidth = this.scalableRange;
        let expandHeight = this.scalableRange;
        // 若 scalableRange 是 0~1 的小数，则作为比例考虑
        if (expandWidth < 1 && expandWidth > -1) {
            expandWidth = width * expandWidth;
            expandHeight = height * expandHeight;
        }
        if (
            (graphCanvasBBox.minX <= width + expandWidth &&
                graphCanvasBBox.minX + dx > width + expandWidth) ||
            (graphCanvasBBox.maxX + expandWidth >= 0 &&
                graphCanvasBBox.maxX + expandWidth + dx < 0)
        ) {
            dx = 0;
        }
        if (
            (graphCanvasBBox.minY <= height + expandHeight &&
                graphCanvasBBox.minY + dy > height + expandHeight) ||
            (graphCanvasBBox.maxY + expandHeight >= 0 &&
                graphCanvasBBox.maxY + expandHeight + dy < 0)
        ) {
            dy = 0;
        }
        this.graph.translate(dx, dy);
    },
    onTouchStart(e) {
        const self = this as any;
        const touches = (e.originalEvent as TouchEvent).touches;
        const event1 = touches[0];
        const event2 = touches[1];
        // 如果是双指操作，不允许拖拽画布
        if (event1 && event2) {
            return;
        }
        this.mousedown = true;
        e.preventDefault();
        const event = e.originalEvent as MouseEvent;
        if (event && e.name !== 'touchstart' && event.button !== 0) {
            return;
        }
        if (
            e.name !== 'touchstart' &&
            typeof window !== 'undefined' &&
            window.event &&
            !(window.event as any).buttons &&
            !(window.event as any).button
        ) {
            return;
        }

        if (!this.shouldBegin(e, this)) {
            return;
        }

        if (self.keydown) return;
        if (!this.allowDrag(e)) return;

        self.origin = { x: e.clientX, y: e.clientY };
        self.dragging = false;

        if (this.enableOptimize) {
            // 拖动 canvas 过程中隐藏所有的边及label
            const graph = this.graph;
            const edges = graph.getEdges();
            for (let i = 0, len = edges.length; i < len; i++) {
                const shapes = edges[i].get('group').get('children');
                if (!shapes) continue;
                shapes.forEach((shape) => {
                    shape.set('ori-visibility', shape.get('ori-visibility') || shape.get('visible'));
                    shape.hide();
                });
            }
            const nodes = graph.getNodes();
            for (let j = 0, nodeLen = nodes.length; j < nodeLen; j++) {
                const container = nodes[j].getContainer();
                const children = container.get('children');
                for (const child of children) {
                    const isKeyShape = child.get('isKeyShape');
                    if (!isKeyShape) {
                        child.set('ori-visibility', child.get('ori-visibility') || child.get('visible'));
                        child.hide();
                    }
                }
            }
        }
    },
    onTouchCanvasMove(e: any) {
        const self = this as any;
        const touches = (e.originalEvent as TouchEvent).touches;
        const event1 = touches[0];
        const event2 = touches[1];

        // 如果是双指操作，不允许拖拽画布，结束拖拽
        if (event1 && event2) {
            this.onTouchUp(e);
            return;
        }
        e.preventDefault();
        self.onTouchDragCanvas(e);
    },
    onTouchUp(e) {
        this.mousedown = false;
        this.dragstart = false;
        const { graph } = this;

        if (this.keydown) return;

        const currentZoom = graph.getZoom();
        const modeController = graph.get('modeController');
        const zoomCanvas = modeController?.modes[modeController.mode]?.filter(behavior => behavior.type === 'zoom-canvas')?.[0];
        const optimizeZoom = zoomCanvas ? zoomCanvas.optimizeZoom || 0.1 : 0;

        if (this.enableOptimize) {
            // 拖动结束后显示所有的边
            const edges = graph.getEdges();
            for (let i = 0, len = edges.length; i < len; i++) {
                const shapes = edges[i].get('group').get('children');
                if (!shapes) continue;
                shapes.forEach((shape) => {
                    const oriVis = shape.get('ori-visibility');
                    shape.set('ori-visibility', undefined);
                    if (oriVis) shape.show();
                });
            }
            if (currentZoom > optimizeZoom) {
                const nodes = graph.getNodes();
                for (let j = 0, nodeLen = nodes.length; j < nodeLen; j++) {
                    const container = nodes[j].getContainer();
                    const children = container.get('children');
                    for (const child of children) {
                        const isKeyShape = child.get('isKeyShape');
                        if (!isKeyShape) {
                            const oriVis = child.get('ori-visibility');
                            child.set('ori-visibility', undefined);
                            if (oriVis) child.show();
                        }
                    }
                }
            }
        }

        if (!this.dragging) {
            this.origin = null;
            return;
        }

        e = cloneEvent(e);

        if (this.shouldEnd(e, this)) {
            this.updateViewport(e);
        }
        e.type = 'dragend';
        e.dx = e.clientX - this.originPosition.x;
        e.dy = e.clientY - this.originPosition.y;

        graph.emit('canvas:dragend', e);
        this.endDrag();

        // 结束拖拽时移除浏览器右键监听
        if (typeof window !== 'undefined') {
            document.body.removeEventListener('contextmenu', this.handleDOMContextMenu);
        }
    },
    onTouchDragCanvas(e) {
        if (!this.mousedown) return;
        const { graph } = this;
        if (this.keydown) return;
        if (!this.allowDrag(e)) return;

        e = cloneEvent(e);
        if (!this.origin) {
            return;
        }
        this.isTouchMove = true;

        if (!this.dragging) {
            if (abs(this.origin.x - e.clientX) + abs(this.origin.y - e.clientY) < DRAG_OFFSET) {
                return;
            }
            if (this.shouldBegin(e, this)) {
                e.type = 'dragstart';
                graph.emit('canvas:dragstart', e);
                this.originPosition = { x: e.clientX, y: e.clientY };
                this.dragging = true;
            }
        } else {
            e.type = 'drag';
            graph.emit('canvas:drag', e);
        }

        if (this.shouldUpdate(e, this)) {
            this.updateViewport(e);
        }
    },
    allowDrag(evt) {
        const target = evt.target;
        const targetIsCanvas = target && target.isCanvas && target.isCanvas();
        if (isBoolean(this.allowDragOnItem) && !this.allowDragOnItem && !targetIsCanvas) return false;
        if (isObject(this.allowDragOnItem)) {
            const { node, edge, combo } = this.allowDragOnItem;
            const itemType = evt.item?.getType?.();
            if (!node && itemType === 'node') return false;
            if (!edge && itemType === 'edge') return false;
            if (!combo && itemType === 'combo') return false;
        }
        return true;
    },
    endDrag() {
        this.origin = null;
        this.dragging = false;
        this.dragbegin = false;
        this.mousedown = false;
        this.dragstart = false;
    },

});
