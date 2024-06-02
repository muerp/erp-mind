import { ElNotification } from "element-plus";
import { MindGraph, randomUUID } from "..";


const Ctr = "Meta + ";

export const ToolbarMenus = [
    {
        icon: 'icon-undo',
        label: '后退',
        key: 'undo',
        handler(graph: MindGraph, _: any) {
            //
        }
    },
    {
        icon: 'icon-redo',
        label: '前进',
        key: 'redo',
        handler(graph: MindGraph, _: any) {
            //
        }
    },
    {
        icon: 'icon-article',
        label: '创作内容',
        key: 'create-article',
        handler(graph: MindGraph, _: any) {
            //
        }
    },
    // {
    //     icon: 'icon-link2',
    //     label: '创建关联',
    //     key: 'create-label',
    //     handler(graph: MindGraph, _: any) {
    //         if (!graph._curSelectedNode || !graph.isNode(graph._curSelectedNode)) return;
    //         graph.editSelectLink(graph._curSelectedNode, 2);
    //     }
    // },
    {
        icon: 'icon-relevance',
        label: '隐藏关联',
        key: 'hide-link',
        handler(graph: MindGraph, item: any) {
            item.active = !item.active;
            item.label = item.active ? "显示关联" : "隐藏关联";
            graph.setEdgeVisible(item.active);
        }
    },
    // {
    //     icon: 'icon-label2',
    //     label: '隐藏标签',
    //     key: 'hide-label',
    //     handler(graph: MindGraph, item: any) {
    //         item.active = !item.active;
    //         item.label = item.active ? "显示标签" : "隐藏标签";
    //         // graph.setEdgeVisible(item.active);
    //     }
    // },
    {
        icon: 'icon-img',
        label: '图片',
        key: 'image',
        handler() {

        }
    },
    {
        icon: 'icon-icon',
        label: '图标',
        key: 'icon',
        handler() {

        }
    },
    {
        icon: 'icon-fx',
        label: '公式',
        key: 'func',
        handler() {

        }
    },
    {
        icon: 'icon-link1',
        label: '连接',
        key: 'link',
        handler() {

        }
    },
    {
        icon: 'icon-full-out',
        label: '全屏',
        key: 'fullscreen',
        handler() {

        }
    },
]

export const DocMenus = [
    {
        icon: 'icon-doc',
        label: '文件夹',
        key: 'import-doc',
        handler(graph: MindGraph, _: any) {
            //
        }
    },
    {
        icon: 'icon-new',
        label: '导入文件',
        key: 'import-file',
        handler(graph: MindGraph, _: any) {
            //
        }
    },
    {
        icon: 'icon-dr2',
        label: '导入',
        key: 'export-in',
        handler(graph: MindGraph, _: any) {
            //
        }
    },
    {
        icon: 'icon-dc2',
        label: '导出',
        key: 'export-out',
        handler(graph: MindGraph, _: any) {
            //
        }
    },
]

export const nodeMenuConfig = [
    {
        label: "打开文档",
        key: "open",
        icon: "",
        shortcutKey: Ctr + "O",
        hide: false,
    },
    {
        label: "添加子级节点",
        key: "add-child",
        icon: "",
        shortcutKey: "Tab",
        code: 'tab',
    },
    {
        label: "添加同级节点",
        key: "add-parallel",
        icon: "",
        shortcutKey: "Enter",
    },
    {
        label: "添加父节点",
        key: "add-parent",
        icon: "",
        shortcutKey: "Shift + Tab",
    },
    {
        label: "删除节点",
        key: "delete",
        icon: "",
        shortcutKey: "Delete",
        code: 'delete',
    },
    {
        label: "仅删除当前节点",
        key: "delete-cur",
        icon: "",
        shortcutKey: "Shift + Backspace",
    },
    {
        label: "关联模型",
        key: "add-link",
        icon: "",
        shortcutKey: Ctr + "L",
    },
    {
        label: "复制模型",
        key: "copy",
        icon: "",
        shortcutKey: Ctr + "C",
    },
    {
        label: "剪切模型",
        key: "cut",
        icon: "",
        shortcutKey: Ctr + "X",
    },
    {
        label: "粘贴模型",
        key: "pasted",
        icon: "",
        shortcutKey: Ctr + "V",
    },
    {
        label: "展开模型",
        key: "expand",
        icon: "",
        shortcutKey: "",
    },
    {
        label: "收起模型",
        key: "no-expand",
        icon: "",
        shortcutKey: "",
    },
    {
        label: "查看关联",
        key: "view-link",
        icon: "",
        shortcutKey: "",
    },
];
export const canvasMenuConfig = [
    {
        label: "回到根节点",
        key: "root",
        icon: "",
        shortcutKey: Ctr + "Enter",
        hide: false,
    },
    {
        label: "适应画布",
        key: "zoom-fit",
        icon: "",
        shortcutKey: Ctr + "I",
        hide: false,
    },
    {
        label: "展开所有",
        key: "expand-all",
        icon: "",
        shortcutKey: "",
        hide: false,
    },
    {
        label: "收起所有",
        key: "no-expand-all",
        icon: "",
        shortcutKey: "",
    },
    {
        label: "放大",
        key: "zoom-out",
        icon: "",
        shortcutKey: Ctr + "+",

    },
    {
        label: "缩小",
        key: "zoom-in",
        icon: "",
        shortcutKey: Ctr + "-",
    },
];
export const edgeMenuConfig = [
    {
        label: "无箭头",
        key: "edge-no-arrow",
        icon: "",
        hide: false,
    },
    {
        label: "双向箭头",
        key: "edge-double-arrow",
        icon: "",
        hide: false,
    },
    {
        label: "左箭头",
        key: "edge-left-arrow",
        icon: "",
        hide: false,
    },
    {
        label: "右箭头",
        key: "edge-right-arrow",
        icon: "",
        hide: false,
    },
    {
        label: "属性编辑",
        key: "edge-edit",
        icon: "",
        hide: false,
    },
    {
        label: "删除",
        key: "link-delete",
        icon: "",
        hide: false,
    },
]

const copyNode = (node: any, isNewUUID = false) => {
    const item: any = {
        id: isNewUUID ? randomUUID() : node.id,
        title: node.title,
        rectStyle: node.rectStyle,
        textStyle: node.textStyle
    }
    if (node.children && node.children.length > 0) {
        item.children = node.children.map((child: any) => {
            return copyNode(child, isNewUUID);
        })
    }
    return item;
}

const addChild = (graph: MindGraph, node: any, emit: (key: string, data?: any) => void, options?: any) => {
    const newItem = options || {
        id: randomUUID(),
        title: "新建模型",
    };
    graph.addNode(node, newItem);
    emit("change", {
        type: "add-child",
        data: {
            parentId: node.getModel().id,
            newItem,
        },
    });
}

export const Menus = {
    tempCopyItem: null,
    'add-child': {
        handler: (graph: MindGraph, node: any, emit: (key: string, data?: any) => void) => {
            if (!node) return;
            addChild(graph, node, emit);
        }
    },
    'add-parent': {
        handler: (graph: MindGraph, node: any, emit: (key: string, data?: any) => void) => {
            if (!node) return;
            const newItem = {
                id: randomUUID(),
                title: "新建模型",
            };
            const idx = graph.addParent(node, newItem);
            emit("change", {
                type: "add-parent",
                data: {
                    newItem,
                    sort: idx,
                },
            });
        }
    },
    'add-parallel': {
        handler: (graph: MindGraph, node: any, emit: (key: string, data?: any) => void) => {
            if (!node) return;
            //添加同级
            const newItem = {
                id: randomUUID(),
                title: "新建模型",
            };
            const idx = graph.addParallelNode(node, newItem);
            emit("change", {
                type: "add-child",
                data: {
                    parentId: node.get("parent").getModel().id,
                    sort: idx,
                    newItem,
                },
            });
        }
    },
    'expand': {
        handler: (graph: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            if (!node) return;
            graph.editCollapse(node, false);
        }
    },
    'no-expand': {
        handler: (graph: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            if (!node) return;
            graph.editCollapse(node, true);
        }
    },
    'delete': {
        handler: (graph: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            if (!node) return;
            graph.deleteNode(node);
        }
    },
    'delete-cur': {
        handler: (graph: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            graph.deleteOnlyCurrent(node);
        }
    },
    'add-link': {
        handler: (graph: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            if (!node) return;
            graph.editSelectLink(node, 2);
        }
    },
    'copy': {
        handler: (__: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            if (!node) return;
            Menus.tempCopyItem = node.getModel();
            ElNotification({
                message: 'Copy success!!!',
            })
        }
    },
    'pasted': {
        handler: (graph: MindGraph, node: any, emit: (key: string, data?: any) => void) => {
            if (!node) return;
            if (!Menus.tempCopyItem) return;
            const item = Menus.tempCopyItem as any

            if (graph.findById(item.id)) {
                const newNode = copyNode(item, true);
                addChild(graph, node, emit, newNode)
            } else {
                const newNode = copyNode(item);
                addChild(graph, node, emit, newNode)
            }
            ElNotification({
                message: 'Paste success!!!',
            })
        }
    },
    'cut': {
        handler: (graph: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            if (!node) return;
            Menus.tempCopyItem = node.getModel();
            graph.deleteNode(node);
            ElNotification({
                message: 'Cut success!!!',
            })
        }
    },
    'root': {
        handler: (graph: MindGraph, __: any, _: (key: string, data?: any) => void) => {
            graph.editFitCenter();
        }
    },
    'zoom-fit': {
        handler: (graph: MindGraph, __: any, _: (key: string, data?: any) => void) => {
            graph.editFitCenter();
        }
    },
    'expand-all': {
        handler: (graph: MindGraph, __: any, _: (key: string, data?: any) => void) => {
            graph.setCollapsedAll(true);
        }
    },
    'no-expand-all': {
        handler: (graph: MindGraph, __: any, _: (key: string, data?: any) => void) => {
            graph.setCollapsedAll(false);
        }
    },
    'zoom-out': {
        handler: (graph: MindGraph, __: any, _: (key: string, data?: any) => void) => {
            graph.editZoomOut();
        }
    },
    'zoom-in': {
        handler: (graph: MindGraph, __: any, _: (key: string, data?: any) => void) => {
            graph.editZoomIn();
        }
    },
    'edge-double-arrow': {
        handler: (graph: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            graph.changeEdgeStyle(node, {arrowType: 1, orientation: 0});
        }
    },
    'edge-left-arrow': {
        handler: (graph: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            graph.changeEdgeStyle(node, {arrowType: 1, orientation: -1});
        }
    },
    'edge-right-arrow': {
        handler: (graph: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            graph.changeEdgeStyle(node, {arrowType: 1, orientation: 1});
        }
    },
    'edge-no-arrow': {
        handler: (graph: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            graph.changeEdgeStyle(node);
        }
    },
    'link-delete': {
        handler: (graph: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            graph.deleteEdge(node);
        }
    }
}
