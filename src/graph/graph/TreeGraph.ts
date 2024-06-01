import { Edge, TreeGraph } from "@antv/g6";
// import Hierarchy from '../hierarchy/index.js';
import { EdgeOptions, InputData, NodeData } from "../interface.js";
import {
    addRadius,
    maxFontCount,
    paddingH,
    placeholderText,
} from "../variable.js";
import { TreeEdit } from "./TreeEdit.js";
import { EventName, MindmapEvent } from "./mindmap-events.js";
import {
    getCanvasPointByNode,
    getLinkId
} from "../nodes/node-utils.js";
import { IDString, NameString, NodeType, nameHideRoot } from "../constaints/index.js";
import { EdgeTextPadding, IconLabelSize, defaultLabelText } from "../nodeTemplate/constant.js";
import { isC } from "../nodes/node-draw-utils.js";
import { openSingleLink } from "../utils/config.js";
import { dragNodeMove, dragNodeReady } from "./check-drag-node.js";
export interface ShortcutKey {
    key: string
    label: string
    control: boolean
    Event: (graph: MindGraph) => void
}
export class MindGraph extends TreeGraph {
    tempVariable: any = {
        linkNode: undefined,
        moveLinkEdge: undefined
    }
    _curSelectedNode: any
    _hideEdge?: boolean
    _config: any
    _edges: EdgeOptions[] = []
    _editor?: TreeEdit
    _isInit: boolean = false
    _tempNode?: any
    _tempAddLinkType?: number
    _tempCollapsedSelected?: any
    _tempShirnkMap: any = new Map()

    nodeStyle: any
    shortcuts: ShortcutKey[] = []
    edgeLinkStyle: any
    initShowDepth: number = 3
    isMobile: boolean = false
    clickEdgeShowLabel: boolean = false
    quadtreeType: string = "ver"
    scaleRatio: number = 1
    quadtrees: any = []
    links: any[] = [];
    mode: string
    _cache: any = {}
    collapsedAll: boolean = false;
    hideDragExternalNode = false;


    selectEditEnabled: boolean = false;
    constructor(props: any, options?: any) {
        super(props);
        this.collapsedAll = !!options.collapsedAll;
        this._config = options.config;
        this._hideEdge = options.hideEdge
        this.initShowDepth = options.initShowDepth;
        this.clickEdgeShowLabel = options.clickEdgeShowLabel
        this.isMobile = options.isMobile;
        this.quadtreeType = options.quadtreeType;
        this.scaleRatio = options.config.scaleRatio;
        this.shortcuts = options.shortcuts || [];
        this.mode = options.mode;
        this.setTheme(options);
        this.links = options.links;
        this.hideDragExternalNode = options.hideDragExternalNode;

        this._editor = new TreeEdit({
            graph: this,
            editEl: options.editEl
        });
        if (options.mode === 'edit') {
            // props.container.addEventListener('keydown', (e: KeyboardEvent) => {
            //     if ((e.key?.length > 1 && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Delete') || e.metaKey || e.ctrlKey || e.altKey) return;
            //     if (this.selectEditEnabled && this._curSelectedNode && !this._editor.isFocus) {
            //         const model = this._curSelectedNode.getModel();
            //         if (model.type === NodeType.defaultNode) {
            //             if ((e.key === 'Backspace' || e.key === 'Enter') && !model.isFocus) {
            //                 return;
            //             } else if (e.key === 'Enter' && e.shiftKey) {
            //                 model.title += '\n';
            //                 this.updateNodeTitle(this._curSelectedNode, model.title, true, false);
            //                 return;
            //             } else if (e.key === 'Enter') {
            //                 if (model.isFocus) {
            //                     this.emit(EventName.change, {
            //                         type: MindmapEvent.nodeTitleBlur,
            //                         options: {
            //                             model: model,
            //                             title: model.title.trim()
            //                         }
            //                     })
            //                     setTimeout(() => {
            //                         model.isFocus = false;
            //                         this.layout();
            //                     }, 50);
            //                 }
            //                 return;
            //             } else if (e.key === 'Backspace' || e.key === 'Delete') {
            //                 model.title = model.title.substring(0, model.title.length - 1);
            //                 this.updateNodeTitle(this._curSelectedNode, model.title, true, false);
            //                 return;
            //             }
            //             if (model.title === '新建模型') {
            //                 model.title = '';
            //             }
            //             model.title += e.key;
            //             this.updateNodeTitle(this._curSelectedNode, model.title, true, false);
            //         }
            //     }
            // })
        }
        this._windowMove = this.windowMove.bind(this);
        this._windwoUp = this.windwoUp.bind(this);
    }
    _windowMove: any = undefined;
    _windwoUp: any = undefined;
    _tempExternal: any = undefined;
    _isValidTempExternal = false;
    _mouseBegin: any = undefined
    windowMove(e: MouseEvent) {
        if (!this._tempExternal) return;
        const bound = this.getContainer().getBoundingClientRect();
        if ((e.clientX < bound.left || e.clientX > bound.left + bound.width) ||
            (e.clientY < bound.top || e.clientY > bound.top + bound.height)) {
            this._isValidTempExternal = false;
            this.dragExternalEnd();
        } else {
            this._isValidTempExternal = true;
            if (!this._mouseBegin) {
                this._mouseBegin = dragNodeReady(e, this);
                if (this.hideDragExternalNode) {
                    this._mouseBegin.mouseNode.hide();
                }
            } else {
                dragNodeMove(e, this._mouseBegin, this);
            }
        }
    }
    windwoUp() {
        this.dragExternalEnd();
        this._tempExternal = undefined;
        window.removeEventListener('mousemove', this._windowMove)
    }
    dragExternalEnd() {
        this._isValidTempExternal = false;
        if (this._mouseBegin && !this._mouseBegin.startNode) {
            const source = this._mouseBegin.mouseEdge.getSource();
            if (source && this._mouseBegin.mouseEdge.get('visible')) {
                const children = source.getModel().children;
                let changeIndex = -1;
                const dragY = this._mouseBegin.mouseEdge.getTarget().getBBox().y;

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
                this.emit(EventName.change, {
                    type: MindmapEvent.dragExternal,
                    options: {
                        parentId: source.getModel().id,
                        sort: changeIndex,
                        external: this._tempExternal
                    }
                });
            }

            this.removeItem(this._mouseBegin.mouseEdge);
            this.removeItem(this._mouseBegin.mouseNode);
            this._mouseBegin = undefined;
        }
    }
    checkShortcut(e: KeyboardEvent) {
        if (this.mode !== 'edit') return true;
        const idx = this.shortcuts.findIndex(shortcut => {
            return shortcut.key.toLowerCase() === e.key.toLowerCase() && (!shortcut.control || (shortcut.control && (e.ctrlKey || e.metaKey)));
        })
        if (idx !== -1) {
            this.shortcuts[idx].Event(this);
            return true;
        }
        return false;
    }
    setCollapsedAll(enabled: boolean) {
        this.collapsedAll = enabled;
        if (enabled) {
            this.data(this.get('data'));
            this.layout();
        } else {
            this.data(this.tempData);
            this.layout();
        }

    }
    setTheme(theme: any) {
        const themeColor = theme.nodeStyle && theme.nodeStyle.themeColor || '#5a6ef0';
        this.nodeStyle = {
            //node button
            //节点默认背景颜色
            btnStyle: {
                fill: 'transparent',
                stroke: 'transparent',
                lineWidth: 2
            },
            //节点背景颜色数组
            btnStyles: [
                { fill: themeColor, stroke: 'transparent', lineWidth: 2 },
                { fill: '#e9e9e9', stroke: '#e9e9e9', lineWidth: 2 }
            ],
            //节点hover默认颜色
            btnHoverStyle: {
                stroke: themeColor
            },
            //节点hover多层样式
            btnHoverStyles: [
                {
                    stroke: themeColor,
                }
            ],
            //节点selected边框颜色
            btnSelectedStyle: {
                stroke: themeColor,
            },
            //节点selected多层边框颜色
            btnSelectedStyles: [
                {
                    stroke: themeColor,
                }
            ],
            //重要果实hover和selected样式
            btnTypeStyles: {
                1: {
                    hoverFill: '#ffd6d6',
                    selectedFill: '#ffd6d6',
                    hoverStroke: '#DF7271',
                    selectStroke: '#DF7271',
                    hoverTextColor: '#333',
                    selectTextColor: '#333',
                    show: false,    //图标是否显示
                }
            },
            //重要果实的配置
            specialStyle: {
                1: {
                    fontFamily: 'iconfont',
                    fill: '#DF7271',
                    text: '\ue604',
                    fontSize: 14,
                    fontWeight: 700
                }
            },
            //节点文本默认颜色
            btnTextStyle: {
                fill: '#444',
                fontSize: 13,
                fontStyle: 'normal',
                fontWeight: 400,
                fontFamily: '"Microsoft YaHei", "PingFang SC", "Microsoft JhengHei", sans-serif',
                textBaseline: 'middle',
                lineHeight: 25,
                maxCount: 16,
                maxWidth: 200,
            },
            //节点文本颜色数组
            btnTextStyles: [
                { fill: '#fff', fontWeight: 700, fontSize: 16 },
                { fill: '#444', fontWeight: 600, fontSize: 14 }
            ],
            //collapsed
            //数字文本颜色
            collapsedNumberTextStyle: {
                fill: themeColor,
                fontSize: 12,
            },
            //数字背景颜色
            collapsedNumberStyle: {
                fill: 'transparent',
            },
            //加减号背景颜色
            collapsedSelectedStyle: {
                r: 9,
                lineWidth: 2,
                fill: themeColor,
                stroke: themeColor
            },
            //加减号文本颜色
            collapsedSelectedTextStyle: {
                fill: 'white',
                fontSize: 14,
                lineHeight: 18,
                fontWeight: 400,
                fontFamily: 'iconfont',
            },
            linkIconStyle: {
                link2: 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20x%3D%220.6%22%20y%3D%220.6%22%20width%3D%2214.8%22%20height%3D%2214.8%22%20rx%3D%223.4%22%20stroke%3D%22%235CAEFA%22%20stroke-width%3D%221.2%22%2F%3E%3Crect%20x%3D%22-0.5%22%20y%3D%220.5%22%20width%3D%225%22%20height%3D%225%22%20rx%3D%220.5%22%20transform%3D%22matrix(-1%200%200%201%2010%205)%22%20stroke%3D%22%235CAEFA%22%2F%3E%3Crect%20width%3D%224%22%20height%3D%224%22%20rx%3D%221%22%20transform%3D%22matrix(-1%200%200%201%2013%209)%22%20fill%3D%22%235CAEFA%22%2F%3E%3Crect%20width%3D%224%22%20height%3D%224%22%20rx%3D%221%22%20transform%3D%22matrix(-1%200%200%201%207%203)%22%20fill%3D%22%235CAEFA%22%2F%3E%3C%2Fsvg%3E',
                link1: 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20x%3D%220.6%22%20y%3D%220.6%22%20width%3D%2214.8%22%20height%3D%2214.8%22%20rx%3D%223.4%22%20stroke%3D%22%23A48AFF%22%20stroke-width%3D%221.2%22%2F%3E%3Cpath%20d%3D%22M5.66602%209.66602C5.66602%209.4375%205.83618%209.24475%206.06293%209.2164L6.37332%209.1776C7.83949%208.99433%208.99433%207.83949%209.1776%206.37332L9.2164%206.06293C9.24475%205.83618%209.4375%205.66602%209.66602%205.66602C9.89453%205.66602%2010.0873%205.83618%2010.1156%206.06293L10.1544%206.37332C10.3377%207.83949%2011.4925%208.99433%2012.9587%209.1776L13.2691%209.2164C13.4959%209.24475%2013.666%209.4375%2013.666%209.66602C13.666%209.89453%2013.4959%2010.0873%2013.2691%2010.1156L12.9587%2010.1544C11.4925%2010.3377%2010.3377%2011.4925%2010.1544%2012.9587L10.1156%2013.2691C10.0873%2013.4959%209.89453%2013.666%209.66602%2013.666C9.4375%2013.666%209.24475%2013.4959%209.2164%2013.2691L9.1776%2012.9587C8.99433%2011.4925%207.83949%2010.3377%206.37332%2010.1544L6.06293%2010.1156C5.83618%2010.0873%205.66602%209.89453%205.66602%209.66602Z%22%20fill%3D%22%23A48AFF%22%2F%3E%3Cpath%20d%3D%22M2.33203%204.9987C2.33203%204.84849%202.44743%204.7228%202.59716%204.71082C3.72502%204.62059%204.62059%203.72502%204.71082%202.59716C4.7228%202.44743%204.84849%202.33203%204.9987%202.33203C5.1489%202.33203%205.2746%202.44743%205.28657%202.59716C5.3768%203.72502%206.27238%204.62059%207.40024%204.71082C7.54996%204.7228%207.66536%204.84849%207.66536%204.9987C7.66536%205.1489%207.54996%205.2746%207.40024%205.28657C6.27238%205.3768%205.3768%206.27238%205.28657%207.40024C5.2746%207.54996%205.1489%207.66536%204.9987%207.66536C4.84849%207.66536%204.7228%207.54996%204.71082%207.40024C4.62059%206.27238%203.72502%205.3768%202.59716%205.28657C2.44743%205.2746%202.33203%205.1489%202.33203%204.9987Z%22%20fill%3D%22%23A48AFF%22%2F%3E%3C%2Fsvg%3E'
            },
            //双线图标
            doubleIconStyle: {
                fontFamily: 'iconfont',
                fill: '#A48AFF',
                text: '\ue8d3',
                fontSize: 14,
                fontWeight: 700
            },
            doubleIconBg: {
                fill: '#291F42',
                stroke: '#6C6ADF',
                radius: 6,
            },
            //link ready
            linkReadyStyle: {
                stroke: '#3dcc3d',
                btnStyle: {
                    fill: '#3dcc3d',
                },
                btnTextStyle: {
                    fontFamily: 'iconfont',
                    fill: '#fff',
                    text: '\ue606',
                    fontWeight: 600,
                    fontSize: 6,
                }
            },
            linkDotStyle: {
                fill: '#3dcc3d',
                r: 4,
            },
            linkLabelBgStyle: {
                fill: '#666',
                marginRight: 50,
                borderStyle: {
                    lineDash: [8, 8], // 虚线的形状：[实线长度，间隔长度]
                    stroke: '#999', // 边的颜色
                    lineWidth: 2, // 边的宽度
                }
            },
            linkLabelLineStyle: {
                stoke: '#8B738C',
            },
            linkLabelTextStyle: {
                fontStyle: 'normal',
                fontFamily: '"Microsoft YaHei", "PingFang SC", "Microsoft JhengHei", sans-serif',
                fill: 'white',
                fontSize: 12,
                fontWeight: 400,
                textAlign: 'left',
                textBaseline: 'middle',
                lineHeight: 20,
                maxWidth: 200
            },
            dragStyle: {
                opacity: 0.6,
                radius: 4,
                themeColor: themeColor,
                dragMoveSize: { width: 40, height: 20 }
            },
            shrinkRoot: {
                virtual: 14,
                width: 22,
                height: 22,
                fill: '#fff',
                fontColor: '#333',
                stroke: '#5F65EF',
                fontFamily: 'MiSans',
                lineWidth: 2,
                radius: 8,
            },
            ...theme.nodeStyle
        }
        const lineThemeColor = theme.edgeLinkStyle && theme.edgeLinkStyle.lineThemeColor || '#a9ea7a';//#3dcc3d
        this.edgeLinkStyle = {
            //双线标签背景
            edgeLabelBgStyle: {
                fill: lineThemeColor,
            },
            edgeLabelSelectedStyle: {
                stroke: 'blue',
                lineWidth: 2,
            },
            //双线标签文字
            edgeLabelTextStyle: {
                fontStyle: 'normal',
                fontFamily: '"Microsoft YaHei", "PingFang SC", "Microsoft JhengHei", sans-serif',
                fill: '#222',
                fontSize: 12,
                fontWeight: 400,
                textAlign: 'left',
                textBaseline: 'middle',
                lineHeight: 20,
                maxWidth: 200,
            },
            //线条样式
            edgePathStyle: {
                stroke: lineThemeColor,
                shadowColor: '#4f8946',
            },
            //线条中间点样式
            edgeDotStyle: {
                fill: lineThemeColor,
                r: 2,
            },
            //线条两端小圆圈
            circleDotStyle: {
                r: 4,
                lineWidth: 2,
                stroke: lineThemeColor,
                fill: '#fff',
            },
            //双线中间的箭头
            arrowStyle: {
                path: `M 0,0 L 9,9, L 0,0 L 9,-9 Z`,
                stroke: lineThemeColor,
                fill: lineThemeColor,
                lineDash: [1, 1],
            },
            ...theme.edgeLinkStyle
        }
    }
    // getLayout() {
    //     const layout = this.get('layout');

    //     if (!layout) {
    //         return null;
    //     }
    //     if (typeof layout === 'function') {
    //         return layout;
    //     }
    //     if (!layout.type) {
    //         layout.type = 'dendrogram';
    //     }
    //     if (!layout.direction) {
    //         layout.direction = layout.type === 'indented' ? 'LR' : 'TB';
    //     }
    //     if (layout.radial) {
    //         return (data: any) => {
    //             const layoutData = Hierarchy[layout.type](data, layout);
    //             // radialLayout(layoutData);
    //             return layoutData;
    //         };
    //     }
    //     return (data: any) => Hierarchy[layout.type](data, layout);
    // }

    tempData?: any;
    public data(data: any, maxDepth = -1, isReadyCache = false) {
        this.tempData = this.get('data');
        super.data(this.formatData(data, maxDepth, isReadyCache));
    }

    public setConfig(config: any) {
        this._config = config;
    }

    private formatData(items: any, maxDepth: number = -1, isReadyCache = false) {
        let _data: any;
        if (items?.length > 1) {
            _data = {
                id: nameHideRoot,
                children: items,
                visible: false,
                branchColor: 'transparent'
            }
        } else if (items?.length == 1) {
            if (items[0].id !== nameHideRoot) {
                _data = {
                    id: nameHideRoot,
                    visible: false,
                    children: [items[0]],
                }
            } else {
                _data = items[0];
            }

        } else {
            if (items.id !== nameHideRoot) {
                _data = {
                    id: nameHideRoot,
                    visible: false,
                    children: [items],
                }
            } else {
                _data = items;
            }

        }


        const data = this.createDataFromData(_data, -1, maxDepth, '0', true, isReadyCache);
        return data;
    }

    private createDataFromData(
        item: InputData,
        depth = -1,
        maxDepth = -1,
        sortId = '0',
        isChildren = true,
        isReadyCache = false,
    ): NodeData {
        const {
            children,
            _children,
            collapsed,
            isSubView,
            id,
            style
        } = item;

        // { style: {...this.nodeStyle.shrinkRoot, visible: true}, title: '' }
        let nStyle: any = this.getNodeStyle({
            ...Object.assign({}, item, style, { name: item.title, depth, iconDetail: item.iconDetail })
        });
        if (item.type === NodeType.shrinkRoot) {
            nStyle.style.width += this.nodeStyle.shrinkRoot.width * Math.sqrt(2) + 4 + this.nodeStyle.shrinkRoot.virtual;
            nStyle.shrinkRoot = { ...this.nodeStyle.shrinkRoot }
            nStyle.lineStyle = { ...this.cfg.defaultEdge?.style };
        }

        const labelStyle = item.label && item.type !== NodeType.shrinkRoot ? this.getTextSize(item.label, { ...this.nodeStyle.linkLabelTextStyle }) as any : undefined;
        if (labelStyle && item.type !== NodeType.shrinkRoot) {
            nStyle.nodeStyle = {
                width: nStyle.style.width,
                height: nStyle.style.height,
            }
            labelStyle.marginRight = this.nodeStyle.linkLabelBgStyle.marginRight;
            nStyle.style.width += labelStyle.width + EdgeTextPadding.h * 2 + labelStyle.marginRight;
            nStyle.style.height = Math.max(labelStyle.height + EdgeTextPadding.v * 2, nStyle.style.height);
        }

        if (item.link2 && item.type !== NodeType.shrinkRoot) {
            nStyle.style.width += IconLabelSize.width + 4;
        }
        if (item.link1 && item.type !== NodeType.shrinkRoot && openSingleLink) {
            nStyle.style.width += IconLabelSize.width + 4;
        }
        let isCollapsed = (!children || children.length === 0) ? false : (maxDepth > 0 && depth >= maxDepth ? true : (collapsed || false));
        if (isReadyCache && (this._cache[id] === false || this._cache[id] === true)) {
            isCollapsed = !this._cache[id];
        }
        const data: NodeData = {
            isHor: item.isHor,
            id: id,
            visible: item.visible,
            side: item.side,
            sortId,
            hideNum: item.hideNum,
            isSubView: isSubView || false,
            collapsed: this.collapsedAll ? false : isCollapsed,
            children: [],
            _children: [],
            isRoot: depth < 1,
            depth,
            realDepth: depth,
            label: item.label,
            type: item.type || NodeType.defaultNode,
            link2: item.link2,
            link1: item.link1,
            iconType: item.iconType,
            iconDetail: item.iconDetail,
            labelStyle,
            ...nStyle,
            edgeConfig: this.links[item.id]
        };

        if (children && isChildren) {
            data.children = children.filter((t) => !t.destroyed)
                .map((child, idx) => {
                    child.side = item.side;
                    return this.createDataFromData(child, depth + 1, maxDepth, sortId + '-' + idx, true, isReadyCache);
                })
        }
        if (_children && isChildren) {
            data._children = _children.filter((t) => !t.destroyed)
                .map((child, idx) => {
                    child.side = item.side;
                    return this.createDataFromData(child, depth + 1, maxDepth, sortId + '-' + idx, true, isReadyCache);
                })
        }

        return data;
    }

    getNodeStyle({
        name = placeholderText,
        desc = "",
        depth,
        iconType = 0,
        nodeStyle,
        visible = true,
        iconDetail
    }: any) {
        name === "" && (name = placeholderText);
        const btnTextStyle = {
            ...this.nodeStyle.btnTextStyle,
            ...this.nodeStyle.btnTextStyles[depth]
        }
        const fontSize = btnTextStyle.fontSize || 12;
        const fontWeight = btnTextStyle.fontWeight || 400;
        const descFontWeight = 400;
        const maxNodeSize = fontSize * maxFontCount + paddingH * 2; // 节点最多显示12个字
        const descFontSize = fontSize - 2; // 描述比标题小两个字号
        let headIcon: any, btnTypeStyle: any;
        // let headIcon = this.nodeStyle.specialStyle[iconType];
        // const btnTypeStyle = this.nodeStyle.btnTypeStyles[iconType];
        const imageIconWidth = btnTypeStyle?.show && headIcon ? paddingH : 0;

        if ((!iconDetail && iconType === 1) || (iconDetail && iconDetail.marked)) {
            headIcon = this.nodeStyle.specialStyle[iconType] || this.nodeStyle.specialStyle[1];
            btnTypeStyle = this.nodeStyle.btnTypeStyles[iconType] || this.nodeStyle.btnTypeStyles[1];
        }


        const nameStyle: any = this.getTextSize(name, btnTextStyle)

        const desStyle: any = this.getTextSize(desc, {
            ...btnTextStyle,
            fontSize: descFontSize,
            fontWeight: descFontWeight
        })
        const height = nameStyle.height + (desStyle?.height || 0) + 2;
        let beforeWidth = 0, afterWidth = 0;
        if (depth >= 2) {
            beforeWidth = 0;
            afterWidth = 0;
        } else {
            beforeWidth = 10;
            afterWidth = 10;
        }

        const obj = {
            title: name,
            desc: desc,
            style: {
                fontSize,
                fontWeight,
                descFontSize,
                width: visible ? Math.max(nameStyle.width, desStyle?.width || 0) + paddingH * 2 : 0,
                maxWidth: maxNodeSize,
                height: visible ? height : 0,
                // fillColor,
                // fontColor,
                stroke: 2,
                // strokeColor: "transparent",
                nameHeight: nameStyle.height,
                descHeight: desStyle?.height || 0,
                descFontWeight,
                imageIconWidth,
                headIcon,
                // branchColor,
                visible,
                beforeWidth,
                afterWidth,
                nodeStyle,
            },
            nameStyle,
            desStyle,
            ...this.nodeStyle,
            btnStyle: this.nodeStyle.btnStyles[depth] || this.nodeStyle.btnStyle,
            btnTextStyle,
            btnHoverStyle: this.nodeStyle.btnHoverStyles[depth] || this.nodeStyle.btnHoverStyle,
            btnSelectedStyle: this.nodeStyle.btnSelectedStyles[depth] || this.nodeStyle.btnSelectedStyle,
            btnTypeStyle,
        };
        return obj;
    }

    getLinkEdgeStyle() {
        return {
            ...this.edgeLinkStyle
        }
    }
    hideLinkBtn(selected = false) {
        if (!this.tempVariable.linkNode) return;
        let node: any = this.tempVariable.linkNode;
        const group = node.getContainer();
        if (node.hasState('link')) {
            node.clearStates('link');
            let linkCircles = group.findAllByName(NameString.linkCircle);
            let linkTexts = group.findAllByName('link-add');

            linkCircles.forEach((circle: any) => {
                circle.stopAnimate();
                circle.animate((ratio: any) => {
                    return {
                        r: (1 - ratio) * addRadius,
                        opacity: 1 - ratio
                    }
                }, {
                    duration: 250
                })
            })
            linkTexts.forEach((text: any) => {
                text.stopAnimate();
                text.animate((ratio: any) => {
                    return {
                        fontSize: (1 - ratio) * 18,
                        opacity: 1 - ratio
                    }
                }, {
                    duration: 250
                })
            })
        }
        // 设置节点边框颜色
        if (!selected) {
            let wrapper = group.findAllByName(NameString.nodeWrapper)[0];
            wrapper?.attr("stroke", "transparent");
        }

    }

    closeLinkBtn(selected = false) {
        if (!this.tempVariable.linkNode) return;
        if (!this.tempVariable.linkNode.hasState('link')) {
            this.deleteLinkBtn(this.tempVariable.linkNode);
            this.tempVariable.linkNode = undefined;
            return;
        }
        this.hideLinkBtn(selected);
        let node: any = this.tempVariable.linkNode;
        this.tempVariable.linkNode = undefined;

        setTimeout(() => {
            this.deleteLinkBtn(node);
        }, 250)
    }

    deleteLinkBtn(node = this.tempVariable.linkNode) {
        this.tempVariable.linkNode = undefined;
        if (!node) return;
        const group = node.getContainer();
        let linkGroup = group.findAllByName(NameString.linkGroup)[0];
        if (linkGroup) {
            group.removeChild(linkGroup);
        }
    }

    checkValidEdge(options: EdgeOptions) {
        const node = this.findById(options.source);
        if (!node) return false;
        const node2 = this.findById(options.target);
        if (!node2) return false;
        return true;
    }
    editAddEdge(options: EdgeOptions) {
        if (!this.checkValidEdge(options)) return;
        this.newEdge(options, false);
    }
    createEdge(options: EdgeOptions) {
        this.emit(EventName.change, {
            type: MindmapEvent.edgeCreate,
            options: {
                data: options,
                sourceData: this.findDataById(options.source),
                targetData: this.findDataById(options.target),
                type: this._tempAddLinkType
            }
        });
    }
    editCreateEdge(options: EdgeOptions, type?: number) {
        this._tempAddLinkType = type;
        this.newEdge(options);
    }

    refreshData() {
        this.data(this.get('data'));
        this.layout();
    }
    newEdge(options: EdgeOptions, isNotify = true) {
        options.id = getLinkId(options.source, options.target);
        if (this._tempAddLinkType) {
            options.labelType = this._tempAddLinkType;
        }
        let p = this.findById(options.id);
        if (p) {
            if (isNotify) {
                this.emit(EventName.change, {
                    type: MindmapEvent.edgeExist
                });
            }
            return false;
        }
        this._edges.push(options);

        const edge: any = this.addItem('edge', {
            name: NameString.edgeLink,
            ...options,
            zIndex: 5,
            type: NodeType.linkEdge,
            style: this.getLinkEdgeStyle()
        })


        if (this._tempAddLinkType || options.labelType === 2) {
            const data1 = this.findDataById(options.target)
            if (data1)
                data1.link2 = true;
            const data2 = this.findDataById(options.source);
            if (data2)
                data2.link2 = true;
            this.refreshData();
            this.edgeEditDoubleLable(edge, false);
        } else {
            const data1 = this.findDataById(options.target)
            if (data1)
                data1.link1 = true;
            const data2 = this.findDataById(options.source);
            if (data2)
                data2.link1 = true;
            this.refreshData();
            this.editClickEdge(edge, true);
            if (isNotify) {
                this.edgeEditLabel(edge);
            }
        }

        if (isNotify) {
            this.emit(EventName.change, {
                type: MindmapEvent.edgeAdd,
                options: {
                    data: options,
                    edges: this._edges
                }
            });
        }
        return true;
    }

    resetEdge(options: any) {
        let p = this.findById(options.id);
        if (p) {
            return false;
        }
        const edge: any = this.addItem('edge', {
            name: NameString.edgeLink,
            ...options,
            zIndex: 5,
            type: NodeType.linkEdge,
            selected: this.clickEdgeShowLabel ? true : false,
            style: this.getLinkEdgeStyle()
        })
        this._curSelectedNode = undefined;
        this.editClickEdge(edge, true);
    }

    editChangeEdge({ newItem, oldItem }: any) {
        if (oldItem && (newItem.target !== oldItem.target || newItem.source !== oldItem.source)) {
            oldItem.id = getLinkId(oldItem.source, oldItem.target);
            this.cancelSelect();
            this.closeLinkBtn();
            this.deleteEdgeByModel(oldItem, false);
            if (this.checkValidEdge(newItem)) {
                if (newItem.labelType === 2) {
                    newItem.labelStyle1 = this.getTextSize(newItem.label1 || defaultLabelText, this.edgeLinkStyle.edgeLabelTextStyle)
                    newItem.labelStyle2 = this.getTextSize(newItem.label2 || defaultLabelText, this.edgeLinkStyle.edgeLabelTextStyle)
                } else {
                    newItem.labelStyle = this.getTextSize(newItem.title, this.edgeLinkStyle.edgeLabelTextStyle)
                }
                this.newEdge(newItem, false);
            }
        } else {
            if (!this.checkValidEdge(newItem)) return;
            this.cancelSelect();
            this.closeLinkBtn();
            const linkId = getLinkId(newItem.source, newItem.target);
            const model: any = this.findById(linkId).getModel();
            if (model.title !== newItem.title) {
                newItem.labelStyle = this.getTextSize(newItem.title, this.edgeLinkStyle.edgeLabelTextStyle)
            } else {
                newItem.labelStyle = model.labelStyle
            }
            if (model.label1 !== newItem.label1) {
                newItem.labelStyle1 = this.getTextSize(newItem.label1 || defaultLabelText, this.edgeLinkStyle.edgeLabelTextStyle)
            } else {
                newItem.labelStyle1 = model.labelStyle1
            }
            if (model.label2 !== newItem.label2) {
                newItem.labelStyle2 = this.getTextSize(newItem.label2 || defaultLabelText, this.edgeLinkStyle.edgeLabelTextStyle)
            } else {
                newItem.labelStyle2 = model.labelStyle2
            }
            this.modifyEdgeOptions(newItem, false);
        }
    }
    modifyEdgeTargetOrSource(modify: any, isNotify = true) {
        this.cancelSelect();
        modify.options.id = getLinkId(modify.options.source, modify.options.target);
        let p = this.findById(modify.options.id);
        if (p) {
            if (isNotify) {
                this.emit("change", {
                    type: MindmapEvent.edgeExist
                });
            }
            return false;
        }
        const idx = this._edges.findIndex(r => r.target === modify.old.target && r.source === modify.old.source);
        let old: any = {}
        if (idx !== -1) {
            old = this._edges.splice(idx, 1)[0];
        }
        let options = {
            ...old,
            ...modify.options,
        }
        this._edges.push(options);
        if (old.source) {
            let checkId = modify.options.source === old.source ? old.target : old.source;
            if (!this.checkHasLabel(checkId, old.labelType)) {
                const data = this.findDataById(checkId);
                if (data) {
                    data['link' + (old.labelType || 1)] = false;
                }
            }
            checkId = modify.options.source === old.source ? modify.options.target : modify.options.source;
            const data = this.findDataById(checkId);
            if (data) {
                data['link' + (old.labelType || 1)] = true;
            }
            this.refreshData();
        }
        this.refreshData();
        const edge: any = this.addItem('edge', {
            name: NameString.edgeLink,
            ...options,
            zIndex: 5,
            type: NodeType.linkEdge,
            selected: this.clickEdgeShowLabel ? true : true,
            style: this.getLinkEdgeStyle()
        })
        this.editClickEdge(edge, true);

        if (isNotify) {
            this.emit("change", {
                type: MindmapEvent.edgeChange,
                options: {
                    modify: modify.options,
                    old,
                    edge: options,
                    edges: this._edges
                }
            });
        }


        return true;
    }
    updateNodeTitleById(nodeId: string, title: string) {
        const node = this.findById(nodeId);
        if (node) {
            this.updateNodeTitle(node, title);
        }
    }
    updateNodeTitle(node: any, title: string, isFocus = false, isTrim = true) {
        const model = node.getModel();
        model.title = isTrim ? title.trim() : title;
        let newModel = this.createDataFromData(model, model.realDepth, -1, model.sortId)
        if (model.nodeStyle) {
            model.nodeStyle = newModel.nodeStyle
        }
        model.nameStyle = newModel.nameStyle
        model.style = newModel.style;
        model.isFocus = isFocus;
        this.layout();
    }
    updateModel(id: string, model: any) {
        const oldModel: any = this.findDataById(id);
        if (!oldModel) return;

        let newModel = this.createDataFromData({ ...oldModel, ...model }, oldModel.realDepth, -1, oldModel.sortId, false)
        if (model.nodeStyle) {
            model.nodeStyle = newModel.nodeStyle
        }
        if (newModel.iconDetail) {
            model.iconDetail = newModel.iconDetail;
        }
        if (newModel.btnTypeStyle) {
            model.btnTypeStyle = newModel.btnTypeStyle;
        }
        if (newModel.headIcon) {
            model.headIcon = newModel.headIcon;
        }
        model.nameStyle = newModel.nameStyle
        model.style = newModel.style;


        this.updateItem(this.findById(id), {
            ...model
        });
    }
    modifyEdgeLabel(edgeId: string, { label1, label2, title }: any) {
        const idx = this._edges.findIndex(r => r.id === edgeId);
        if (idx !== -1) {
            const options: any = {}
            if (label1) {
                options.label1 = label1;
                options.labelStyle1 = this.getTextSize(label1 || defaultLabelText, this.edgeLinkStyle.edgeLabelTextStyle)
            }
            if (label2) {
                options.label2 = label2;
                options.labelStyle2 = this.getTextSize(label2 || defaultLabelText, this.edgeLinkStyle.edgeLabelTextStyle)
            }
            if (title) {
                options.title = title;
                options.labelStyle = this.getTextSize(title || defaultLabelText, this.edgeLinkStyle.edgeLabelTextStyle)
            }
            options.source = this._edges[idx].source;
            options.target = this._edges[idx].target;
            this.modifyEdgeOptions(options);
        }
    }
    modifyEdgeOptions(options: any, isNotify = true) {
        options.id = getLinkId(options.source, options.target);
        const idx = this._edges.findIndex(r => r.target === options.target && r.source === options.source);
        const old = this._edges[idx];
        if (idx !== -1) {
            this._edges[idx] = {
                ...this._edges[idx],
                ...options
            }
        }
        let node = this.findById(options.id);
        if (node) {
            if (this._edges[idx].labelType !== 2) {
                this.updateItem(node, {
                    ...this._edges[idx],
                    editType: undefined
                })
            } else {
                this.updateItem(options.id, {
                    ...this._edges[idx],
                })
            }
        }

        if (isNotify) {
            let p = { ...options }
            delete p.labelStyle;
            delete p.labelStyle1;
            delete p.labelStyle2;
            this.emit("change", {
                type: MindmapEvent.edgeChange,
                options: {
                    modify: p,
                    old: { ...old },
                    edge: { ...this._edges[idx] },
                    edges: this._edges
                }
            });
        }
    }
    checkHasLabel(id: string, type: number) {
        return this._edges.findIndex(r => {
            return r.labelType === type && (r.target === id || r.source === id);
        }) !== -1;
    }
    deleteEdgeByModel(model: any, isNotify = true) {
        if (!model.id) model.id = getLinkId(model.source, model.target);
        let p = this.findById(model.id);
        if (p) {
            if (this._curSelectedNode && model.id === this._curSelectedNode.getModel().id) {
                this.checkCloseSelected(p);
            }
            if (!p.destroyed) {
                this.removeItem(p);
            }
        }
        const idx = this._edges.findIndex(r => r.target === model.target && r.source === model.source);
        if (idx !== -1) {
            const [old]: any = this._edges.splice(idx, 1);
            let isUpdateNode = false;
            if (!this.checkHasLabel(model.target, old.labelType)) {
                let data = this.findDataById(model.target);
                if (data) {
                    data['link' + (old.labelType || 1)] = false;
                    isUpdateNode = true;
                }
            }
            if (!this.checkHasLabel(model.source, old.labelType)) {
                let data = this.findDataById(model.source);
                if (data) {
                    data['link' + (old.labelType || 1)] = false;
                    isUpdateNode = true;
                }
            }
            if (isUpdateNode) {
                this.refreshData();
            }
        }

        if (isNotify) {
            this.emit("change", {
                type: MindmapEvent.edgeDelete,
                options: {
                    data: {
                        source: model.source,
                        target: model.target
                    },
                    edges: this._edges
                }
            });
        }
    }
    deleteEdge(node: any, isNotify = true) {
        const options = node.getModel();
        this.deleteEdgeByModel(options, isNotify);
    }

    edgeEditLabel(node: any, target?: any) {
        if (!target) {
            let model = node.getModel();
            const idx = this._edges.findIndex(r => r.target === model.target && r.source === model.source);
            const labelStyle = this.getTextSize(model.title || defaultLabelText, this.edgeLinkStyle.edgeLabelTextStyle)
            const options = {
                labelStyle
            }
            if (idx !== -1) {
                this._edges[idx] = {
                    ...this._edges[idx],
                    ...options
                }
            }
            this.updateItem(model.id, {
                ...options,
                editType: 0,
                labelStyle
            })

            target = node.getContainer().findAllByName(NameString.edgeTitleBg)[0];
        }

        this._editor?.showEdgeLabel(node, target);
    }
    edgeEditDoubleLable(node: any, isNotify = true) {
        let model = node.getModel();
        const idx = this._edges.findIndex(r => r.target === model.target && r.source === model.source);

        const labelStyle1 = this.getTextSize(model.label1 || defaultLabelText, this.edgeLinkStyle.edgeLabelTextStyle)
        const labelStyle2 = this.getTextSize(model.label2 || defaultLabelText, this.edgeLinkStyle.edgeLabelTextStyle)
        const options = {
            labelType: 2,
            labelStyle1: labelStyle1,
            labelStyle2: labelStyle2
        }
        if (idx !== -1) {
            this._edges[idx] = {
                ...this._edges[idx],
                ...options
            }
        }
        this.updateItem(node, {
            ...options,
            editType: 0
        })
        node.toFront();

        if (isNotify) {
            this.emit("change", {
                type: MindmapEvent.edgeChange,
                options: {
                    modify: options,
                    edge: { ...this._edges[idx] },
                    edges: this._edges
                }
            });
        }
    }

    edgeDeleteLabel(node: any, isNotify = true) {
        const model = node.getModel();
        this.modifyEdgeOptions({
            source: model.source,
            target: model.target,
            title: '',
            labelStyle: undefined,
            editType: undefined
        }, isNotify);
    }


    toData(data: any) {
        if (data.info) {
            data = {
                ...data.info,
                children: data.children ? data.children.map((child: any) => this.toData(child)) : []
            }
            data.link2 = this._edges.findIndex(r => r.labelType === 2 && (r.source === data.id || r.target === data.id)) !== -1;
        }

        return data;
    }
    replaceChildren(data: any, ids: string[]) {
        if (data.children && data.children.length > 0) {
            let tdx = -1;
            for (let i = 0; i < data.children.length; ++i) {
                let idx = ids.findIndex(id => id === data.children[i].id);
                if (idx !== -1) {
                    if (tdx === -1) {
                        tdx = idx;
                    }
                    this.removeChild(ids[idx])
                    ids.splice(idx, 1);
                    // return idx;
                }
                let pdx = this.replaceChildren(data.children[i], ids);
                if (pdx !== -1) {
                    if (tdx === -1) {
                        tdx = pdx;
                    }
                    // return pdx;
                }
            }
            return tdx;
        }
        return -1;
    }
    replaceQuadtreeData(data: any, ids: string[]) {
        let idx = ids.findIndex(id => id === data.id);
        if (idx !== - 1) return false;
        idx = this.replaceChildren(data, ids);
        return idx;
    }

    //同级打开
    addQuadtreeData(data: any) {
        let model = this.get('data');
        const ids = model.children.map((item: any) => item.id);
        let items = this.toData(data);
        const idx = this.replaceQuadtreeData(items, ids);
        if (idx === false) {
            return;
        }
        if (idx >= 0) {
            model.children[idx] = items;
            this.data(model);
            this.layout();
        } else {
            if (this.quadtreeType === 'double') {
                items.side = model.children.length % 2 === 1 ? 'left' : 'right';
            } else {
                items.side = 'right',
                    items.posType = 'right';
            }
            if (this.quadtreeType === 'hor') {
                model.isHor = true;
            } else {
                model.isHor = false;
            }
            let sort = model.children.length;
            let s = this.createDataFromData(items, 0, this.initShowDepth, '0-' + sort);

            model.children.push(s);
            this.layout();
            if (this.quadtreeType === 'hor') {
                const m: any = this.findById(s.id)?.getModel();
                if (m) {
                    this.editMoveTo(m.x, m.y);
                }
            }
        }
        if (this._curSelectedNode && this._curSelectedNode.destroyed) {
            this._curSelectedNode = undefined;
        }
        if (this._curSelectedNode && this._curSelectedNode.getType() !== 'edge') {
            this.showEdge(this._curSelectedNode);
        }
    }
    changeQuadtreeType(type: string) {
        if (this.quadtreeType === type) return;
        this.quadtreeType = type;
        const model = this.get('data');
        model.isHor = this.quadtreeType === 'hor';
        this.layout();
        this.fitCenter();
    }
    editMoveTo(x: number, y: number) {
        let bound = this.getContainer().getBoundingClientRect();
        var viewCenter = {
            x: bound.width / 2,
            y: bound.height / 2
        };
        var modelCenter = this.getPointByCanvas(viewCenter.x, viewCenter.y);

        var viewportMatrix = this.get('group').getMatrix();
        var dx = (modelCenter.x - x) * viewportMatrix[0];
        var dy = (modelCenter.y - y) * viewportMatrix[4];

        this.translate(dx, dy);
    }
    getLastModel() {
        let maxNode: any;
        let nodes: any[] = []
        this.getNodes().forEach((node: any) => {
            const model: any = node.getModel();
            if (model.type === 'mindmap-node' && model.visible !== false) {
                if (model.children.length === 0) {
                    if (!maxNode) {
                        maxNode = node;
                        nodes = [node]
                    } else if (maxNode.getModel().x < node.getModel().x) {
                        maxNode = node;
                        nodes = [node]
                    } else if (maxNode.getModel().x === node.getModel().x) {
                        nodes.push(node)
                    }
                }
            }
        })
        if (nodes.length > 0) {
            let idx = parseInt((nodes.length / 2).toString());
            idx = idx > nodes.length - 1 ? nodes.length - 1 : idx;
            return nodes[idx].getModel();
        }
    }
    updateData(data: any, edges?: EdgeOptions[], cache: any = {}) {

        this._cache = cache;
        if (!Array.isArray(data) && typeof data === "object") {
            data = [data];
        }
        if (!data?.length) return;
        let d = data.map((item: any) => this.toData(item));
        this.data(d, this._isInit ? -1 : (this.initShowDepth || 3), true);
        this.layout();
        if (edges && edges.length > 0) {
            this.formatEdge(edges);
            this._edges = edges;
            this.repaintEdge();
        }
        if (!this._isInit) {
            this._isInit = true;
            const { x, y } = this.getCenterPoint();
            this.zoomTo(this.scaleRatio, { x, y });
        }
        this.fitCenter();
        this.emit(EventName.change, {
            type: MindmapEvent.loaded,
        });

    }


    updateEdges(edges?: EdgeOptions[]) {
        if (!edges || edges.length === 0) return;
        if (edges) {
            this.formatEdge(edges);
            this._edges = edges;
            this.repaintEdge();
        } else {
            this.repaintEdge();
        }
    }
    appendEdges(edges?: EdgeOptions[]) {
        if (!edges || edges.length === 0) return;
        let newEdges = edges.filter(edge => this._edges.findIndex(r => r.source === edge.source && r.target !== edge.target) === -1);
        this.formatEdge(newEdges);
        this._edges.push(...newEdges);
        this.repaintEdge();
    }

    /*
     * attrs: fontSize, fontFamily, fontWeight, lineHeight, maxWidth
    */
    getTextSize(text: string, attrs: any) {
        if (!text) return undefined;
        const ctx = this.get('canvas')?.get('context');
        if (!ctx) return;
        const textArr = text.split('\n');
        let fontSize = attrs.fontSize || 12;
        let lineHeight = attrs.lineHeight || fontSize;
        let width = 0, maxWidth = attrs.maxWidth || 99999;
        ctx.font = `${attrs.fontWeight || 'normal'} ${fontSize}px ${attrs.fontFamily || ''}`;

        let displayStr = '';
        let line = 0;
        // if (!textArr[textArr.length - 1].trim()) {
        //     textArr.length = textArr.length - 1;
        // }
        let lastWidth = 0;

        textArr.forEach((str: string) => {
            let w = ctx.measureText(str).width;
            if (w <= maxWidth) {
                width = Math.max(width, w);
                lastWidth = w;
                displayStr += (displayStr ? '\n' : '') + str;
                line++;
            } else {
                let lineWidth = 0;
                let p = 0;
                let lastStr = '';
                for (let i = 0; i < str.length; ++i) {
                    let m = ctx.measureText(str[i]);
                    lineWidth += m.width;
                    if (lineWidth > maxWidth) {
                        line++;
                        const lineStr = str.substring(p, i - 1);
                        displayStr += (displayStr ? '\n' : '') + lineStr;
                        width = Math.max(width, ctx.measureText(lineStr).width);
                        lineWidth = m.width;
                        p = i - 1;
                        lastStr = '';
                    }
                    lastStr += str[i];
                }
                if (p < str.length - 1) {
                    if (width < lineWidth) {
                        width = lineWidth;
                    }
                    displayStr += (displayStr ? '\n' : '') + str.substring(p, str.length);
                    line++;
                    lastWidth = ctx.measureText(str.substring(p, str.length)).width;
                } else {
                    lastWidth = lineWidth;
                }
            }
        })
        if (text === '新建模型') {
            lastWidth = 0;
        }
        const style = { width, height: lineHeight * line, text: displayStr, maxWidth, lineHeight, lastWidth }
        return style;
    }

    formatEdge(edges: any[]) {
        edges.forEach(edge => {
            edge.id = getLinkId(edge.source, edge.target);
            if (edge.labelType === 2) {
                edge.labelStyle1 = this.getTextSize(edge.label1 || defaultLabelText, this.edgeLinkStyle.edgeLabelTextStyle)
                edge.labelStyle2 = this.getTextSize(edge.label2 || defaultLabelText, this.edgeLinkStyle.edgeLabelTextStyle)
                let data = this.findDataById(edge.target);
                if (data) {
                    data.link2 = true;
                }
                let data2 = this.findDataById(edge.source);
                if (data2) {
                    data2.link2 = true;
                }
            } else {
                edge.labelStyle = this.getTextSize(edge.title || defaultLabelText, this.edgeLinkStyle.edgeLabelTextStyle);
                let data = this.findDataById(edge.target);
                if (data) {
                    data.link1 = true;
                }
                let data2 = this.findDataById(edge.source);
                if (data2) {
                    data2.link1 = true;
                }
            }
        })
        this.data(this.get('data'));
        this.layout();
    }

    initData(data: any, edges: EdgeOptions[] = []) {
        this.data(data, this.initShowDepth);
        this.layout(true);
        this.formatEdge(edges);
        this._edges = edges;
        this.repaintEdge();
    }

    hideEdge(node?: any) {
        const model = node.getModel();
        if (this._hideEdge) {
            const edges: any[] = this._edges.filter(r => r.source === model.id || r.target === model.id);
            edges.forEach(edge => {
                if (!this._tempNode || edge.id !== this._tempNode.getModel().id) {
                    if (this.findById(edge.id)) {
                        this.removeItem(edge.id);
                    }
                }
            })
        }
        const edges = node.getEdges().filter((r: any) => {
            let m = r.getModel();
            return m.source === model.id || m.target === model.id
        });
        edges.forEach((edge: any) => {
            let m = edge.getModel();
            if (m.labelType === 2) {
                this.updateItem(edge, {
                    editType: undefined
                })
            }
        })

    }
    showEdge(node?: any) {
        if (this._hideEdge) {
            this.repaintEdge(node);
        }
        const model = node.getModel();
        const edges = node.getEdges().filter((r: any) => {
            let m = r.getModel();
            return m.source === model.id || m.target === model.id
        });

        edges.forEach((edge: any) => {
            let m = edge.getModel();
            if (m.labelType === 2) {
                // edge.update({
                //     editType: m.source === model.id ? 0 : 1
                // })
                this.updateItem(m.id, {
                    editType: m.source === model.id ? 0 : 1
                })
            }
        })
    }
    repaintEdge(node?: any) {
        if (!this._hideEdge) {
            this._edges.forEach((options: any) => {

                let p = this.findById(options.id);
                if (p) return false;
                let s = this.findById(options.source);
                let t = this.findById(options.target);
                if (!s || !t) return;

                this.addItem('edge', {
                    name: NameString.edgeLink,
                    ...options,
                    zIndex: 5,
                    type: NodeType.linkEdge,
                    style: this.getLinkEdgeStyle()
                })
            })
        } else if (node) {
            const model = node.getModel();
            const edges = this._edges.filter(r => r.source === model.id || r.target === model.id);
            edges.forEach((options: any) => {
                let p = this.findById(options.id);
                if (p) return false;
                let s = this.findById(options.source);
                let t = this.findById(options.target);
                if (!s || !t) return;

                this.addItem('edge', {
                    name: NameString.edgeLink,
                    ...options,
                    zIndex: 5,
                    type: NodeType.linkEdge,
                    style: this.getLinkEdgeStyle()
                })
            })
        }
        // let edges = this.findAll('edge', r => {
        //     return r.getModel().name === NameString.edgeLink;
        // })
        // edges.forEach(item => {
        //     this.removeItem(item)
        // })
    }

    editItem(node: any, isReady = false) {
        this._editor?.show(node, isReady);
    }

    editDisabled() {
        this._editor?.blur();
    }
    menuExpand(node: any, expand: any) {
        const model = node.getModel();
        if (model.collapsed != expand) {
            model.collapsed = expand;
            this._cache[model.id] = !expand;
            this.layout();
            node.toFront();
        }
    }
    expandAll(node: any, expand: boolean) {
        const model = node.getModel();
        model.collapsed = expand;
        this._cache[model.id] = !expand;
        if (model.children) {
            model.children.forEach((child: any) => {
                this.updateCollapsed(child, expand);
            })
        }
        this.layout();
        node.toFront();
    }
    updateCollapsed(model: any, expand: boolean) {
        model.collapsed = expand;
        this._cache[model.id] = !expand;
        if (model.children) {
            model.children.forEach((child: any) => {
                this.updateCollapsed(child, expand);
            })
        }
    }
    editCollapse(node: any, expand = false) {
        let model = node.getModel();
        if (expand) {
            if (model.collapsed) {
                model.collapsed = false;
                this.layout();
            }
            return;
        }
        if (isC) {
            if ((!node.hasState('selected') && !model.collapsed) || model.children.length === 0) {
                //如果是hover 或 没有子节点----添加
                this.emit(EventName.change, {
                    type: MindmapEvent.nodeAdd,
                    options: {
                        node
                    }
                })
            } else if (!model.collapsed) {
                //收起节点
                model.collapsed = true;
                this._cache[model.id] = false;
                //判断是否有当前选中，有则去掉_tempCollapsedSelected
                if (this._curSelectedNode || this.tempVariable.linkNode) {
                    const ids = this.getChildrenIds(model);
                    //排除自己
                    ids.splice(0, 1);
                    if (this._curSelectedNode) {
                        this._tempCollapsedSelected = this._curSelectedNode.getModel().id;
                        if (ids.includes(this._curSelectedNode.getModel().id)) {
                            this.cancelSelect();
                        }
                    }
                    if (this.tempVariable.linkNode && ids.includes(this.tempVariable.linkNode.getModel().id)) {
                        this.deleteLinkBtn();
                        this.tempVariable.linkNode = undefined;
                    }
                }
                this.layout();
            } else {
                //展开节点
                model.collapsed = false;
                this._cache[model.id] = true;
                this.layout();
                this.repaintEdge();

                if (this._tempCollapsedSelected && !this._curSelectedNode) {
                    this.editSelectedNode(this.findById(this._tempCollapsedSelected), true, false);
                }
                this._tempCollapsedSelected = undefined;

                this.emit(EventName.change, {
                    type: MindmapEvent.nodeCollapsed,
                    options: {
                        node
                    }
                })
            }
        } else {
            if ((node.hasState('selected') && !model.collapsed) || model.children.length === 0) {
                //如果是hover 或 没有子节点----添加
                this.emit(EventName.change, {
                    type: MindmapEvent.nodeAdd,
                    options: {
                        node
                    }
                })
            } else if (!model.collapsed) {
                //收起节点
                model.collapsed = true;
                this._cache[model.id] = false;
                //判断是否有当前选中，有则去掉_tempCollapsedSelected
                if (this._curSelectedNode || this.tempVariable.linkNode) {
                    const ids = this.getChildrenIds(model);
                    //排除自己
                    ids.splice(0, 1);
                    if (this._curSelectedNode) {
                        this._tempCollapsedSelected = this._curSelectedNode.getModel().id;
                        if (ids.includes(this._curSelectedNode.getModel().id)) {
                            this.cancelSelect();
                        }
                    }
                    if (this.tempVariable.linkNode && ids.includes(this.tempVariable.linkNode.getModel().id)) {
                        this.deleteLinkBtn();
                        this.tempVariable.linkNode = undefined;
                    }
                }
                this.layout();
            } else {
                //展开节点
                model.collapsed = false;
                this._cache[model.id] = true;
                this.layout();
                this.repaintEdge();

                if (this._tempCollapsedSelected && !this._curSelectedNode) {
                    this.editSelectedNode(this.findById(this._tempCollapsedSelected), true, false);
                }
                this._tempCollapsedSelected = undefined;

                this.emit(EventName.change, {
                    type: MindmapEvent.nodeCollapsed,
                    options: {
                        node
                    }
                })
            }
        }
    }
    addNodeById(id: string, item: any) {
        const node = this.findById(id);
        if (!node) return;
        this.addNode(node, item);
    }
    addNode(node: any, item: any, isEdit: boolean = true) {
        const model = node.getModel();
        const newItem = this.createDataFromData({ ...item }, model.realDepth + 1, -1, model.sortId + '-' + model.children.length);
        delete newItem.sort;
        // this.addChild(newItem, node);
        if (item.sort >= 0) {
            model.children.splice(item.sort, 0, newItem);
        } else {
            model.children.push(newItem);
        }

        this.on('afterlayout', () => {
            this.editCollapse(node, true);
            if (isEdit && !this.isMobile) {
                const newNode = this.findById(newItem.id);
                const bbox = newNode.getBBox();
                let { x } = this.getClientByPoint(bbox.x, bbox.y);
                const rect = this.getContainer().getBoundingClientRect();
                if (x + bbox.width > rect.left + rect.width) {
                    const delta = x + bbox.width - rect.left - rect.width + 50;

                    this.translate(-delta, 0, true, {
                        duration: 300,
                        callback: () => {
                            this.editItem(this.findById(newItem.id), false);
                            this.editSelectedNodeById(item.id, true);
                        }
                    });
                } else {
                    this.editItem(this.findById(newItem.id));
                    this.editSelectedNodeById(item.id, true);
                }
            } else {
                this.editSelectedNodeById(item.id, true);
            }
        }, true)
        this.layout();
    }

    addParent(node: any, item: any) {
        const model = node.getModel();
        const parent = node.get('parent');
        const pModel = parent.getModel();
        const idx = pModel.children.findIndex((r: any) => r.id === model.id);
        const m = pModel.children[idx];
        item.children = [{ ...m }];
        this.removeChild(model.id);
        pModel.children.splice(idx, 0, item);
        this.updateChildrenData(pModel.children, pModel.side, pModel.depth, pModel.sortId);
        this.layout();
        return idx;
    }
    updateChildrenData(children: any[], side: string, sortId: string, depth: number) {
        // return children.map((child, idx) => {
        //     child.side = side;
        //     return this.createDataFromData(child, depth + 1, -1, sortId + '-' + idx, true);
        // })

        for (let i = 0; i < children.length; ++i) {
            children[i].side = side;
            children[i] = this.createDataFromData(children[i], depth + 1, -1, sortId + '-' + i, true);
        }
    }

    addParallelNode(node: any, item: any) {
        const model = node.getModel();
        const parent = node.get('parent');
        const pModel = parent.getModel();
        const idx = pModel.children.findIndex((r: any) => r.id === model.id);
        pModel.children.splice(idx + 1, 0, item);
        this.updateChildrenData(pModel.children, pModel.side, pModel.depth, pModel.sortId);
        this.layout();
        return idx + 1;
    }

    editFitCenter() {
        this.fitCenter();
        const { x, y } = this.getCenterPoint();
        this.zoomTo(this._config.scaleRatio, { x, y });
    }

    getCenterPoint() {
        const { width, height } = this.getContainer().getBoundingClientRect();
        return {
            x: parseInt((width / 2).toString()),
            y: parseInt((height / 2).toString()),
        }
    }

    editZoomOut(scale?: number) {
        const { x, y } = this.getCenterPoint()
        if (scale) {
            this.zoomTo(scale, { x, y });
        }
        const currentZoom = this.getZoom();
        const ratioOut = 1 / (1 - 0.05 * 2);
        const maxZoom = this.get('maxZoom');
        if (ratioOut * currentZoom > maxZoom) {
            return;
        }
        this.zoomTo(currentZoom * ratioOut, { x, y });
    }

    editZoomIn() {
        const currentZoom = this.getZoom();
        const ratioIn = 1 - 0.05 * 2;
        const minZoom = this.get('minZoom');
        if (ratioIn * currentZoom < minZoom) {
            return;
        }
        const { x, y } = this.getCenterPoint()
        this.zoomTo(currentZoom * ratioIn, { x, y });
    }

    getChildrenIds(model: any) {
        let p = [model.id];
        if (model.children) {
            model.children.forEach((child: any) => {
                let s = this.getChildrenIds(child);
                p.push(...s);
            })
        }
        return p;
    }

    removeAllEdges(model: any) {
        let ids = this.getChildrenIds(model);
        let d = this._edges.filter(item => ids.includes(item.source) || ids.includes(item.target));
        this._edges = this._edges.filter(item => !ids.includes(item.source) && !ids.includes(item.target));
        return d;
    }

    deleteNodeById({ id, deleteIds, deleteEdges }: any, isNotify = false) {
        deleteIds.forEach((id: string) => {
            const node = this.findById(id);
            if (!node) return;
            this.deleteNode(node, isNotify);
        })
        deleteEdges.forEach((edge: any) => {
            let idx = this._edges.findIndex(r => r.source === edge.source && r.target === edge.target);
            if (idx !== -1) {
                this._edges.splice(idx, 1);
            }
        })
        //更新 node double label
        this.updateHasDoubleLabel(deleteEdges, id);
        this.refreshData();
    }
    //与id相关的边是否有double label
    updateHasDoubleLabel(edges: EdgeOptions[], id: string) {
        if (!edges || edges.length === 0) return;
        edges.forEach((edge: any) => {
            if (edge.source === id && !this.checkHasLabel(edge.target, edge.labelType)) {
                let data = this.findDataById(edge.target);
                if (data) {
                    data['link' + (edge.labelType || 1)] = false;
                }
            } else if (edge.target === id && !this.checkHasLabel(edge.source, edge.labelType)) {
                let data = this.findDataById(edge.source);
                if (data) {
                    data['link' + (edge.labelType || 1)] = false;
                }
            }
        })
        this.refreshData();
    }
    //检测model是否有选中，如果选中就取消选择
    closeSelectByFilterNode(model: any) {
        let ids = this.getChildrenIds(model);
        if (this._curSelectedNode && ids.includes(this._curSelectedNode.getModel().id)) {
            this.cancelSelect();
        }
        if (this.tempVariable.linkNode && ids.includes(this.tempVariable.linkNode.getModel().id)) {
            this.closeLinkBtn();
        }
    }
    deleteNode(node: any, isNotify = true) {
        const parentNode = node.get('parent');
        let nextSelectNodeId = parentNode?.get('id');
        const model = node.getModel();

        this.closeSelectByFilterNode(model);
        let deleteEdges: any = isNotify ? this.removeAllEdges(model) : undefined;
        this.removeChild(node.get('id'));
        this.refreshData();
        if (isNotify) {
            this.updateHasDoubleLabel(deleteEdges, model.id);
            this.emit(EventName.change, {
                type: MindmapEvent.nodeDelete,
                options: {
                    model,
                    deleteIds: this.getChildrenIds(model),
                    edges: this._edges,
                    deleteEdges
                }
            })
        }
        if (parentNode && parentNode.getModel().visible === false) {
            nextSelectNodeId = parentNode.get('parent')?.get('id');
            this.removeChild(parentNode.get('id'))
        }
        if (!this._curSelectedNode && nextSelectNodeId && nextSelectNodeId !== nameHideRoot) {
            this.editSelectedNodeById(nextSelectNodeId, true, true);
        }
        return deleteEdges;
    }
    deleteOnlyCurrent(node: any) {
        const parent = node.get('parent');
        const model = node.getModel();
        const pModel = parent.getModel();
        const idx = pModel.children.findIndex((r: any) => r.id === model.id);
        if (idx === -1) return;
        this.removeChild(node.get('id'));
        pModel.children.splice(idx, 0, ...model.children);
        this.updateChildrenData(pModel.children, pModel.side, pModel.depth, pModel.sortId);
        this.layout();
    }
    editSelectedNodeById(id: string, selected = true, isNotify = false) {
        const node = this.findById(id);
        if (node) {
            this.editSelectedNode(node, selected, isNotify);
            return true;
        } else {
            this.cancelSelect();
        }
        return false;
    }
    //获取包含节点下的所有关联
    getNodeAndChildrenEdgesById(id: string) {

        const node = this.findById(id)
        if (node) {
            return this.getNodeAndChildrenEdges(node);
        } else {
            return [];
        }

    }
    getNodeAndChildrenEdges(node: any) {
        const ids = this.getChildrenIds(node.getModel());
        const edges = this._edges.filter(r => ids.includes(r.source) && ids.includes(r.target));
        return edges;
    }
    resetData(data: any, _?: EdgeOptions[]) {
        if (!Array.isArray(data) && typeof data === "object") {
            data = [data];
        }
        if (!data?.length) return;
        this._curSelectedNode = undefined;
        this.tempVariable.linkNode = undefined;
        this.tempVariable.moveLinkEdge = undefined;
        const d = data.map((item: any) => this.toData(item));
        this.changeData(this.formatData(d, -1));
        this.layout(true);

        const { x, y } = this.getCenterPoint();
        this.zoomTo(this.scaleRatio, { x, y });
    }
    editChangeRoot(id: string, isNotify = true) {
        const node = this.findById(id);
        if (node) {
            const model = node.getModel();
            const sortId = model.sortId;
            const ids = this.getChildrenIds(model);
            ids.push(nameHideRoot)
            const nodes = this.getNodes().filter(node => !ids.includes(node.getModel().id));
            nodes.forEach(node => {
                this.removeItem(node, false);
            })
            let root = this.get('data');
            if (root.id === nameHideRoot) {
                root.children = [model]
            }
            this._curSelectedNode = undefined;
            this.tempVariable.linkNode = undefined;
            this.tempVariable.moveLinkEdge = undefined;
            this.data(root);
            this.render();
            this.fitCenter();
            if (isNotify) {
                this.emit(EventName.change, {
                    type: MindmapEvent.nodeChangeRoot,
                    options: {
                        id,
                        sortId
                    }
                })
            }
            return true;
        }
        return false;
    }
    editSelectedNode(node: any, selected = true, isNotify = true, isShowEdge = true) {
        if (!node || node.destroyed) return;
        this._tempCollapsedSelected = undefined;
        this.checkCloseSelected(node);
        if (!selected) {
            this.checkNodeEditTitle(node);
        }
        node.setState && node.setState('selected', selected, node);
        this._curSelectedNode = selected ? node : undefined;
        selected && this._curSelectedNode.toFront();
        if (!this.isMobile && selected && this.mode === 'edit') {
            this.editItem(node, true);
        }

        if (selected && isShowEdge) {
            this.showEdge(node);
        }

        if (isNotify) {
            this.emit(EventName.change, {
                type: MindmapEvent.nodeSelect,
                options: {
                    node
                }
            })
        }
    }
    cancelSelectNode() {
        if (this._curSelectedNode) {
            if (this._curSelectedNode.getType() === 'edge') {
                this.updateItem(this._curSelectedNode, {
                    selected: false,
                    editType: undefined
                }, false)
            } else {
                this.checkNodeEditTitle(this._curSelectedNode);
                this._curSelectedNode.setState('selected', false, this._curSelectedNode);
            }
            this._curSelectedNode = this.undoStack;
        }
    }
    cancelSelect() {
        if (this._curSelectedNode && this._curSelectedNode.destroyed) {
            this._curSelectedNode = undefined;
        }
        if (this._curSelectedNode) {
            if (this._curSelectedNode.getType() === 'edge') {
                this._curSelectedNode.getSource().toBack();
                this._curSelectedNode.getTarget().toBack();
                this._curSelectedNode.toBack();
                this.updateItem(this._curSelectedNode, {
                    selected: false,
                    editType: undefined
                }, false)
                let node = this.findById(IDString.linkTargetDot);
                if (node) {
                    this.removeItem(node, false);
                }
                node = this.findById(IDString.linkSourceDot);
                if (node) {
                    this.removeItem(node, false);
                }
                if (this._hideEdge) {
                    this.removeItem(this._curSelectedNode.getModel().id, false);
                }
            } else {
                this.checkNodeEditTitle(this._curSelectedNode);
                this._curSelectedNode.setState('selected', false, this._curSelectedNode);
                this.hideEdge(this._curSelectedNode);
            }
            this._curSelectedNode = undefined;
        }
    }
    checkNodeEditTitle(node: any) {
        if (!node) return;
        const model = node.getModel();
        if (model.type === NodeType.defaultNode && model.isFocus) {
            model.isFocus = false;
            this.updateNodeTitle(node, model.title);
            this.emit(EventName.change, {
                type: MindmapEvent.nodeTitleBlur,
                options: {
                    model: model,
                    title: model.title.trim()
                }
            })
        }
    }

    editSelectLink(node: any, type?: number) {
        this._tempAddLinkType = type;
        this.cancelSelect();
        if (this.tempVariable.linkNode && this.tempVariable.linkNode.getModel().id === node.getModel().id) {
            return;
        }
        if (this.tempVariable.linkNode) {
            this.closeLinkBtn();
        }
        this.tempVariable.linkNode = node;
        node.setState('link', true, node);
    }

    updateEdgeState(edge: any, state: any) {
        if (state.hover) {
            edge.setState('hover', true, edge);
        } else {
            edge.setState('hover', false, edge)
        }
        if (this._curSelectedNode &&
            this._curSelectedNode.getModel().id !== edge.getModel().id) {
            edge.toFront();
        } else {
            edge.toBack();
        }
    }

    checkCloseSelected(node: any) {
        if (this.tempVariable.linkNode) {
            this.closeLinkBtn(this.tempVariable.linkNode.get('id') === node.get('id'));
        }
        this.cancelSelect();
    }

    editClickEdge(node: Edge, selected: boolean) {
        if (this._curSelectedNode && node.get('id') === this._curSelectedNode.get('id')) return;
        this._tempNode = node;
        this.checkCloseSelected(node);
        this._tempNode = undefined;
        this._curSelectedNode = selected ? node : undefined;
        if (selected) {
            this.emit(EventName.change, {
                type: MindmapEvent.edgeClick,
                options: {
                    node: this._curSelectedNode
                }
            })
        }

        if (this.clickEdgeShowLabel) {
            this.updateItem(node, {
                selected
            }, false)
        }

        if (selected) {
            node.toBack();
        } else {
            node.toBack();
        }
        if (selected) {
            this.readyDotIndex(node);
            node.toFront();
        }
    }

    addDotToCanvas(node: any, index: number, id: string) {
        const pos = getCanvasPointByNode(node, index);
        let p: any = this.addItem('node', {
            id,
            name: NameString.linkSelectDot,
            ...pos,
            type: 'node-dot',
            capture: true,
            draggable: true,
            style: this.edgeLinkStyle.circleDotStyle
        })
        p.toFront();
    }

    readyDotIndex(node: Edge) {
        const model: any = node.getModel();
        this.addDotToCanvas(node.getTarget(), model.endIndex, IDString.linkTargetDot);
        this.addDotToCanvas(node.getSource(), model.startIndex, IDString.linkSourceDot);
    }

    changeNodeTitle({ id, title }: any, isNotify = false) {
        let node = this.findById(id);
        if (node) {
            this.updateNodeTitle(node, title);
            if (isNotify) {
                this.emit(EventName.change, {
                    type: MindmapEvent.nodeTitleBlur,
                    options: {
                        model: node.getModel(),
                        title: title
                    }
                })
            }
        }
    }

    changeTheme(theme: any) {
        this.setTheme(theme);
        if (theme.edgeStyle) {
            if (this.cfg.defaultEdge) {
                this.cfg.defaultEdge.style = theme.edgeStyle;
            }
            this.getEdges().forEach(edge => {
                if (edge.getModel().type === NodeType.defaultEdge) {
                    edge.update({
                        style: theme.edgeStyle
                    })
                } else if (edge.getModel().type === NodeType.linkEdge) {
                    edge.update({
                        style: this.getLinkEdgeStyle()
                    })
                }
            })
        }
        this.data(this.get('data'), -1);
        this.layout();
    }
    updateGraphItem(id: string, data: any) {
        const node = this.findById(id);
        if (!node) return;
        const model = node.getModel();
        for (let key in data) {
            model[key] = data[key];
        }
        this.data(this.get('data'));
        this.layout();
    }
    moveNode({
        parentId,
        moveId,
        sort,
        p
    }: any) {
        if (moveId === this.get('data').id) return;
        this.cancelSelect();
        this.closeLinkBtn();
        const node = this.findById(moveId);
        if (node) {
            this.removeChild(moveId);
        }
        let source;
        if (!parentId || parentId === 'root') {
            let data = this.get('data');
            if (!data.id || data.id === 'root') {
                source = data;
            }
        } else {
            source = this.findById(parentId)?.getModel();
        }
        if (!source) return;
        source.children.splice(sort, 0, p.nodes);

        this.data(this.get('data'))
        this.layout();

        p.edges.forEach(edge => {
            const idx = this._edges.findIndex(r => r.target !== edge.target && r.source === edge.source);
            if (idx === -1) {
                edge.id = getLinkId(edge.source, edge.target);
                this._edges.push(edge);
            }
        })
        this.repaintEdge();

    }
    setEdgeVisible(hide: boolean) {
        this._hideEdge = hide;
        if (!hide) {
            this.repaintEdge();
        } else {
            let edges = this.getEdges().filter(r => r.getModel().type === NodeType.linkEdge);
            edges.forEach(edge => {
                this.removeItem(edge);
            })
        }
    }
    exsitLink(source: any, target: any) {
        return !!this.findById(getLinkId(source, target));
    }
    getQuadtreeNodes(nodeId: string) {
        const map = new Set<string>();
        this._edges.filter(edge => {
            if (edge.target === nodeId || edge.source === nodeId) {
                let otherId = edge.target === nodeId ? edge.source : edge.target;
                let ms = this.findDataById(otherId);
                if (!ms && !map.has(otherId)) {
                    map.add(otherId);
                }
            }
        })
        return Array.from(map);
    }
    getNodeCorrelations(nodeId: string) {
        const result: any[] = [];
        const map = new Set<string>();

        this._edges.filter(edge => {
            if (edge.target === nodeId || edge.source === nodeId) {
                let ms: any;
                if (edge.labelType === 2) {
                    ms = edge.target === nodeId ? this.findDataById(edge.source) : this.findDataById(edge.target);
                } else if (edge.source === nodeId) {
                    ms = this.findDataById(edge.target);
                }
                if (ms && !map.has(ms.id)) {
                    map.add(ms.id);
                    result.push(ms)
                }
            }
        })
        return result;
    }
    getChildrenByFilter(map: any, children: any[]) {
        const s: any[] = [];
        children.forEach(child => {
            if (!map.has(child.id)) {
                map.add(child.id);
                s.push({
                    ...child,
                    children: this.getChildrenByFilter(map, child.children),
                    link2: false,
                })
            }
        })
        return s;
    }
    getShowEdgesAndChildrens(node: any) {
        const model = node.getModel();
        const newChildren: any[] = [];
        let map = new Set();
        map.add(model.id);
        const items: any[] = [];
        this._edges.forEach((edge: any) => {
            let item: any, label: string = '';
            if (edge.labelType === 2 && (edge.target === model.id || edge.source === model.id)) {
                item = this.findDataById(edge.target === model.id ? edge.source : edge.target);
                label = edge.target === model.id ? edge.label2 : edge.label1;

            } else if (edge.source === model.id) {
                item = this.findDataById(edge.target);
                label = edge.title;
            }
            if (item && !map.has(item.id)) {
                map.add(item.id);
                items.push({ item, label })
            }
        })
        items.forEach(({ item, label }) => {
            newChildren.push({
                ...item,
                children: this.getChildrenByFilter(map, item.children),
                style: {
                    ...item.style,
                    beforeWidth: undefined,
                    afterWidth: undefined,
                },
                label,
                link2: false,
            });
        })
        return {
            ...model,
            link2: false,
            children: newChildren
        }
    }
    createLinkDot(x: any, y: any) {
        return this.addItem('node', {
            id: IDString.linkMouseNode,
            visible: false,
            x,
            y,
            type: 'node-dot',
            style: this.edgeLinkStyle.circleDotStyle,
        }, false)
    }
    createMouseLinkEdge(options: any) {
        return this.addItem('edge', {
            ...options,
            style: this.getLinkEdgeStyle(),
        }, false)
    }
    createDragNode(x: any, y: any) {
        let options = {
            id: "move-node",
            label: "",
            x,
            y,
            type: "node-move",
            zIndex: 3,
            style: this.nodeStyle.dragStyle
        }
        return this.addItem('node', options, false);
    }
    createDragEdge(options: any) {
        return this.addItem('edge', {
            id: "move-edge",
            target: "move-node",
            type: 'edge-default',
            zIndex: 3,
            ...options
        }, false);
    }
    cloneTo(item: any, sort = -1) {
        const parentId = item.parentId || (item.parent && item.parent.id)
        const parentModel: any = this.findDataById(parentId);
        if (!parentModel) return;
        if (!parentModel.children) {
            parentModel.children = [];
        }
        if (sort === -1) {
            const len = parentModel.children.length;
            const newData = this.createDataFromData(item, parentModel.realDepth + 1, -1, parentModel.sortId + '-' + len);
            this.addChild(newData, parentModel.id);
        } else {
            parentModel.children.splice(sort, 0, item);
            this.data(this.get('data'));
            this.layout();
        }

    }
    destory() {
        if (this._editor) {
            delete this._editor;
            this._editor = undefined;
        }
        window.removeEventListener('mousemove', this._windowMove)
        window.removeEventListener('mouseup', this._windwoUp)
        super.destroy();
    }
    changeEdgeShowLabel(show: boolean) {
        this.clickEdgeShowLabel = show;
    }
    changeEdgeStyle(edge: Edge, options: any) {
        const targetId: any = edge.getTarget().getModel().id;
        const sourceId: any = edge.getSource().getModel().id;
        if (!this.links[sourceId]) {
            this.links[sourceId] = [];
        }
        this.links[sourceId][targetId] = {
            ...this.links[sourceId][targetId],
            ...options
        }
        edge.getSource().getModel().edgeConfig = this.links[sourceId];
        edge.draw();
    }
    canHideParent(node: any) {
        let parent = node.get('parent');
        if (!parent || parent._cfg.id === 'hide-root') {
            return false;
        }
        parent = parent.get('parent')
        return !(!parent || parent._cfg.id === 'hide-root');
    }
    hideParent(node: any) {
        const parent = node.get('parent');
        if (!parent || parent._cfg.id === 'hide-root') return;

        let root = parent.get('parent');
        while (root.get('parent') && root.get('parent')._cfg.id !== 'hide-root') {
            root = root.get('parent');
        }
        if (root) {
            const data = this.get('data');
            const newRoot = parent.getModel();
            const idx = data.children.findIndex(r => r.id === root._cfg.id)

            if (idx !== -1) {
                this.cancelSelect();
                this._tempShirnkMap.set(newRoot.id, { ...root.getModel() });
                this.removeChild(root._cfg.id);
                newRoot.type = NodeType.shrinkRoot;
                newRoot.hideNum = newRoot.depth;
                data.children.splice(idx, 0, newRoot)
            }
            this.data(data)
            this.layout();

        }
    }
    recoverParent(node: any) {
        const model = node.getModel();
        model.type = NodeType.defaultNode;
        const data = this.get('data');
        const idx = data.children.findIndex((r: any) => r.id === model.id);
        if (idx !== -1) {
            let curSelectId: string = '';
            if (this._curSelectedNode) {
                curSelectId = this._curSelectedNode.getModel().id;
            }
            this.cancelSelect();
            const oldRoot = this._tempShirnkMap.get(model.id);
            this.removeChild(model.id);
            data.children.splice(idx, 1, oldRoot);
            const oldModel: any = this.findDataById(model.id)
            oldModel.children = model.children;
            oldModel.type = NodeType.defaultNode;
            oldModel.style = undefined;
            this.data(data)
            this.layout();
            this._tempShirnkMap.delete(model.id);
            if (curSelectId) {
                this.editSelectedNode(this.findById(curSelectId), true, false);
            }
        }
    }
    hasLink(edge: any) {
        const targetId = edge.getTarget().getModel().id;
        const sourceId = edge.getSource().getModel().id;
        if (this.links[sourceId] && this.links[sourceId][targetId]) {
            return this.links[sourceId][targetId].arrowType > 0
        }
        return false;
    }
    dragExternal(item: any) {
        this._tempExternal = item;
        if (item) {
            window.addEventListener('mousemove', this._windowMove)
            window.addEventListener('mouseup', this._windwoUp, { once: true })
        }
    }
    isNode(node: any) {
        const model = node.getModel();
        return model.type === NodeType.defaultNode;
    }
}
