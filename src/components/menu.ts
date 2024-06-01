import { ElNotification } from "element-plus";
import { MindGraph, randomUUID } from "..";

const Ctr = "Meta + ";
export const nodeMenuConfig = [
    {
        label: "打开文档",
        key: "open",
        icon: "",
        shortcutKey: Ctr + "O",
        hide: false,
        code: 'o',
        control: ["cmd", "ctrl"],
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
        code: 'enter',
    },
    {
        label: "添加父节点",
        key: "add-parent",
        icon: "",
        shortcutKey: "Shift + Tab",
        control: ["shift"],
        code: 'tab',
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
        control: ["shift"],
        code: 'backspace',
    },
    {
        label: "关联模型",
        key: "add-link",
        icon: "",
        shortcutKey: Ctr + "L",
        control: ["cmd", "ctrl"],
        code: 'l',
    },
    {
        label: "复制模型",
        key: "copy",
        icon: "",
        shortcutKey: Ctr + "C",
        control: ["cmd", "ctrl"],
        code: 'c',
    },
    {
        label: "剪切模型",
        key: "cut",
        icon: "",
        shortcutKey: Ctr + "X",
        control: ["cmd", "ctrl"],
        code: 'x',
    },
    {
        label: "粘贴模型",
        key: "pasted",
        icon: "",
        shortcutKey: Ctr + "V",
        control: ["cmd", "ctrl"],
        code: 'v',
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
        shortcutKey: "",
    },
    {
        label: "缩小",
        key: "zoom-in",
        icon: "",
        shortcutKey: "",
    },
];

const copyNode = (node: any, isNewUUID = false) => {
    const item: any = {
        id: isNewUUID ? randomUUID() : node.id,
        title: node.title
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
            addChild(graph, node, emit);
        }
    },
    'add-parent': {
        handler: (graph: MindGraph, node: any, emit: (key: string, data?: any) => void) => {
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
            graph.menuExpand(node, false);
        }
    },
    'no-expand': {
        handler: (graph: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            graph.menuExpand(node, true);
        }
    },
    'delete': {
        handler: (graph: MindGraph, node: any, _: (key: string, data?: any) => void) => {
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
            graph.editSelectLink(node, 2);
        }
    },
    'copy': {
        handler: (__: MindGraph, node: any, _: (key: string, data?: any) => void) => {
            Menus.tempCopyItem = node.getModel();
            ElNotification({
                message: 'Copy success!!!',
            })
        }
    },
    'pasted': {
        handler: (graph: MindGraph, node: any, emit: (key: string, data?: any) => void) => {
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
            Menus.tempCopyItem = node.getModel();
            graph.deleteNode(node);
            ElNotification({
                message: 'Cut success!!!',
            })
        }
    }
}