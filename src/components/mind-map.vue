<template>
  <div class="w-full h-full mu-mind-map">
    <div ref="mindmap" class="mindmap-container w-full h-full" />
    <div
      ref="mindmapInput"
      class="mindmap-label-edit"
      spellCheck="false"
      style="display: none"
      contenteditable="true"
    />
    <ul ref="nodeMenu" class="mind-menu">
      <li
        v-for="item in nodeMenuConfig"
        :key="item.key"
        :code="item.key"
        v-show="!item.hide"
      >
        <span class="d-flex">{{ item.label }}</span>
        <span class="mind-shortcut" v-if="item.shortcutKey">
          {{ item.shortcutKey }}
        </span>
      </li>
    </ul>
    <ul ref="canvasMenu" class="mind-menu">
      <li
        v-for="item in canvasMenuConfig"
        :key="item.key"
        :code="item.key"
        v-show="!item.hide"
      >
        <span class="d-flex">{{ item.label }}</span>
        <span class="mind-shortcut" v-if="item.shortcutKey">
          {{ item.shortcutKey }}
        </span>
      </li>
    </ul>
  </div>
</template>
<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted, defineEmits } from "vue";
import { MindGraph, Menu, randomUUID } from "../graph";

defineOptions({
  name: "MuMindMap",
});
const props = defineProps({
  // 脑图数据
  modelValue: { required: true },

  hideEdge: { type: Boolean, default: false },
  defaultNodeStyle: { type: Object, default: {} },
  defaultEdgeStyle: { type: Object, default: {} },
  defaultEdgeLinkStyle: { type: Object, default: {} },
  initShowDepth: { type: Number, default: 3 },
  clickEdgeShowLabel: { type: Boolean, default: false },
  mode: { type: String, default: "default" },
  links: { type: Object, default: {} },
  vGap: { type: Number },
  hGap: { type: Number },
  edges: { type: Array, default: [] },
  scaleRatio: { type: Number, default: 1 },
  sharpCorner: { type: Boolean, default: false },
});
const emit = defineEmits(['change'])
const Ctr = "Meta + ";
const nodeMenuConfig = [
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
  },
  {
    label: "仅删除当前节点",
    key: "delete",
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
const canvasMenuConfig = [
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
const mindmap = ref();
const graph = ref();
const mindmapInput = ref();
const nodeMenu = ref();
const canvasMenu = ref();
watch(
  () => props.modelValue,
  () => {}
);

const defaultMode = ["behavior-canvas", "drag-canvas", "behavior-default-node"];

const editMode = ["behavior-shortcut"];
const isMobile = ref(false);

onMounted(() => {
  editMode.unshift("drag-canvas", "behavior-canvas", "behavior-pc");
  initGraph();
});
onUnmounted(() => {
  graph.value?.destroy();
  graph.value = undefined;
});


const hideMenu = (el: any, key: string) => {
  el?.querySelector(`[code="${key}"]`).classList.add("hide");
};

const getNodeMenusDom = (item: any) => {
  console.log(nodeMenu.value?.childNodes.forEach);
  nodeMenu.value?.childNodes.forEach((el: any) => {
    if (el.nodeName === "LI") {
      el.classList.remove("hide");
    }
  });
  const model = item.getModel();
  if (item.get("parent")?.getModel()?.id === "hide-root") {
    hideMenu(nodeMenu.value, "add-parent");
  }
  if (!model.children || model.children.length === 0) {
    hideMenu(nodeMenu.value, "no-expand");
    hideMenu(nodeMenu.value, "expand");
  } else if (model.collapsed) {
    hideMenu(nodeMenu.value, "no-expand");
  } else {
    hideMenu(nodeMenu.value, "expand");
  }
  return nodeMenu.value;
};
const getEdgeMenusDom = (item: any) => {
  return nodeMenu.value;
};
const getCanvasMenusDom = () => {
  return canvasMenu.value;
};

const getMenus = () => {
  const toolbar = new Menu({
    className: "active-menu",
    shouldBegin: (e: any) => {
      const isCanvas = e?.target.isCanvas && e.target.isCanvas();
      const isEdge = e?.item?.get("type") === "edge";
      if (props.mode === "default" && !isCanvas) return false;
      if (props.mode === "connect" && !isEdge) return false;
      return true;
    },
    getContent: (e: any) => {
      const isCanvas = e?.target.isCanvas && e.target.isCanvas();
      const isEdge = e?.item?.get("type") === "edge";
      if (props.mode === "default" && !isCanvas) return null; // 阅读模式不支持右键
      if (props.mode === "connect" && !isEdge) return; // 联系模式只支持连线和切换线条
      if (!isCanvas && !isEdge) {
        return getNodeMenusDom(e.item);
      } else if (isEdge) {
        return getEdgeMenusDom(e.item);
      }
      return getCanvasMenusDom();
    },
    itemTypes: ["node", "canvas", "edge"],
    handleMenuClick: (target: any, node: any) => {
      const code = target.getAttribute("code");
      if (code === 'add-child') {
        console.log('---node', node);
        const newItem = {
          id: randomUUID(),
          title: "新建模型",
        };
        graph.value?.editAddNode(node, newItem);
        emit('change', {
          type: 'add-child',
          data: newItem
        })
      } else if (code === 'add-parent') {
        const newItem = {
          id: randomUUID(),
          title: "新建模型",
        };
        graph.value?.addParent(node, newItem);
        emit('change', {
          type: 'add-parent',
          data: newItem
        })
      } else if (code === 'add-parallel') {
        const newItem = {
          id: randomUUID(),
          title: "新建模型",
        };
        graph.value?.addParallelNode(node, newItem);
        emit('change', {
          type: 'add-parent',
          data: newItem
        })
      }
    },
  });
  return toolbar;
};
const initGraph = (isInit = true) => {
  if (graph.value) return;
  graph.value = createGraph(props);
  if (props.modelValue && isInit) {
    graph.value.updateData(props.modelValue, props.edges, {});
  }
};
const createGraph = (layoutConfig: any) => {
  const config = {
    width: mindmap.value.offsetWidth,
    height: mindmap.value.offsetHeight,
    plugins: [getMenus()],
    layout: {
      workerEnabled: true,
      type: "mindmap",
      direction: "H",
      getHeight: (node: any) => {
        return node.style.visible ? node.style?.height : 0;
      },
      getWidth: (node: any) => {
        return node.style.visible ? node.style?.width : 0;
      },
      getVGap: (node: any) => {
        return node.style.visible ? props.vGap || 10 : 0;
      },
      getHGap: (node: any) => {
        return node.style.visible
          ? (props.hGap || 30) + (node.style.beforeWidth || 0)
          : 0;
      },
      getSide: (node: any) => {
        return node.data?.side || "right";
      },
    },
    defaultNode: {
      linkPoints: {
        top: true,
        bottom: true,
        left: true,
        right: true,
      },
    },
    defaultEdge: {
      type: layoutConfig?.sharpCorner ? "round-poly" : "cubic-horizontal",
      style: props.defaultEdgeStyle,
    },
    modes: {
      default: props.mode === "edit" ? editMode : defaultMode,
    },
    groupByTypes: false,
    enableStack: true,
    animate: false,
    renderer: "canvas",
  };
  const graph = new MindGraph(
    {
      ...config,
      container: mindmap.value,
    },
    {
      editEl: mindmapInput.value,
      config: layoutConfig,
      hideEdge: props.hideEdge,
      nodeStyle: props.defaultNodeStyle,
      edgeLinkStyle: props.defaultEdgeLinkStyle,
      initShowDepth: props.initShowDepth,
      clickEdgeShowLabel: props.clickEdgeShowLabel,
      isMobile: isMobile.value,
      quadtreeType: "hor",
      mode: props.mode,
      links: props.links,
      collapsedAll: false,
      shortcuts: [
        {
          key: "Tab",
          label: "添加子节点",
          Event: (_: any) => {
            console.log("--添加子节点--");
          },
        },
        {
          key: "x",
          label: "剪切节点",
          control: ["cmd", "ctrl"],
          Event: (_: any) => {
            console.log("--剪切节点--");
          },
        },
      ],
    }
  );
  graph.selectEditEnabled = true;
  // setTimeout(() => {
  //   this.$emit(EventName.change, {
  //     type: MindmapEvent.openQuadtree
  //   });
  // }, 500);
  return graph;
};
</script>

<style lang="scss">
.mu-mind-map {
  position: relative;
  outline: none;
}
.mind-menu {
  color: #333;
  margin: 10px;
  padding: 6px 0;
  box-shadow: 0 4px 12px 0 hsla(0, 0%, 69%, 0.5);
  background-color: #fff;
  border-radius: 4px;
  display: none;
  li {
    list-style: none;
    padding: 6px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    // transition: all 0.25s;
    &:hover {
      background-color: #f3f3f3;
    }
    span {
      pointer-events: none;
    }
  }
  li.hide {
    display: none;
  }
  animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.mind-shortcut {
  margin-left: 3rem;
  color: #999;
  font-size: 13px;
}
.active-menu {
  .mind-menu {
    display: block;
  }
}
@keyframes slideIn {
  0% {
    opacity: 0;
    -webkit-transform: translateY(10px);
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    -webkit-transform: translateY(0);
    transform: translateY(0);
  }
}

.mindmap-label-edit:empty:before {
  -webkit-user-modify: read-write-plaintext-only;
  content: attr(placeholder);
  opacity: 0.7;

  &::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    cursor: pointer;
    border-radius: 1rem;
    background-color: rgba(157, 165, 183, 0);
    background-clip: padding-box;
    transition: all 0.25s;
  }

  &:hover::-webkit-scrollbar-thumb {
    cursor: pointer;
    background-color: rgba(157, 165, 183, 0.4);
  }

  &::-webkit-scrollbar-thumb:hover {
    cursor: pointer;
    background-color: rgba(157, 165, 183, 0.7);
  }
}
</style>
