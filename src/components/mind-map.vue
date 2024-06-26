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
    <ul ref="nodeMenuRef" class="mind-menu">
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
    <ul ref="edgeMenuRef" class="mind-menu">
      <li
        v-for="item in edgeMenuConfig"
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
    <div class="mind-toolbar-layer">
      <div class="mind-content">
        <ul class="mind-toolbar">
          <li
            v-for="item in toolbarMenus"
            :key="item.key"
            v-show="!item.hide"
            :class="{ active: item.active, disabled: item.disabled }"
            @click="onToolbar(item)"
          >
            <el-button>
              <i class="toolbar-icon" :class="item.icon"></i>
            </el-button>
            <div class="tollbar-label">
              {{ item.label }}
            </div>
          </li>
        </ul>
        <ul class="mind-toolbar">
          <li
            v-for="item in docMenus"
            :key="item.key"
            v-show="!item.hide"
            :class="item.active ? 'active' : ''"
            @click="onToolbar(item)"
          >
            <el-button>
              <i class="toolbar-icon" :class="item.icon"></i>
            </el-button>
            <div class="tollbar-label">
              {{ item.label }}
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted, defineEmits } from "vue";
import { MindGraph, Menu, randomUUID, MindmapEvent } from "../graph";
import {
  Menus,
  nodeMenuConfig,
  edgeMenuConfig,
  canvasMenuConfig,
  ToolbarMenus,
  DocMenus,
} from "./menu";
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
const emit = defineEmits(["change"]);
const mindmap = ref();
const graph = ref();
const mindmapInput = ref();
const nodeMenuRef = ref();
const edgeMenuRef = ref();
const canvasMenu = ref();
const toolbarMenus = ref(ToolbarMenus);
const docMenus = ref(DocMenus);
const selectNode = ref();
watch(
  () => props.modelValue,
  () => {}
);

const defaultMode = ["behavior-canvas", "drag-canvas", "behavior-default-node"];

const editMode = [];
const isMobile = ref(false);
const shortcuts = ref([]);

const formatMenus = (menus: any[]) => {
  const p = [];
  menus.forEach((menu) => {
    if (menu.shortcutKey) {
      p.push({
        label: menu.label,
        shortcutKey: menu.shortcutKey.toLowerCase().replace(/\s/g, ""),
        handler: (graph: MindGraph) => {
          if (Menus[menu.key]) {
            const node = graph._curSelectedNode;
            Menus[menu.key].handler(graph, node, emit);
            return;
          }
        },
      });
    }
  });
  return p;
};
const getToolbarsMap = () => {
  const map = {};
  toolbarMenus.value.forEach((menu) => {
    map[menu.key] = menu;
  });
  return map;
};
onMounted(() => {
  const map = getToolbarsMap();
  map["image"].disabled = true;
  map["icon"].disabled = true;
  map["func"].disabled = true;
  map["link"].disabled = true;
  map["create-article"].disabled = true;
  map['hide-link'].active = props.hideEdge;

  editMode.unshift("drag-canvas", "behavior-canvas", "behavior-pc");
  const p = formatMenus(nodeMenuConfig);
  const p2 = formatMenus(canvasMenuConfig);
  shortcuts.value = p.concat(p2);
  editMode.push({
    type: "behavior-shortcut",
    hotList: shortcuts.value,
  });
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
  nodeMenuRef.value?.childNodes.forEach((el: any) => {
    if (el.nodeName === "LI") {
      el.classList.remove("hide");
    }
  });
  const model = item.getModel();
  if (item.get("parent")?.getModel()?.id === "hide-root") {
    hideMenu(nodeMenuRef.value, "add-parent");
  }
  if (!model.children || model.children.length === 0) {
    hideMenu(nodeMenuRef.value, "no-expand");
    hideMenu(nodeMenuRef.value, "expand");
  } else if (model.collapsed) {
    hideMenu(nodeMenuRef.value, "no-expand");
  } else {
    hideMenu(nodeMenuRef.value, "expand");
  }
  return nodeMenuRef.value;
};
const getEdgeMenusDom = (node: any) => {
  const model = node.getModel();
  edgeMenuRef.value?.childNodes.forEach((el: any) => {
    if (el.nodeName === "LI") {
      el.classList.remove("hide");
    }
  });
  if (model.type === "edge-quadratic") {
    hideMenu(edgeMenuRef.value, "edge-no-arrow");
    hideMenu(edgeMenuRef.value, "edge-double-arrow");
    hideMenu(edgeMenuRef.value, "edge-left-arrow");
    hideMenu(edgeMenuRef.value, "edge-right-arrow");
    hideMenu(edgeMenuRef.value, "edge-edit");
  } else if (model.type === "round-poly") {
    const config = graph.value.getEdgeArrorConfig(node);
    console.log("-config--", config);
    if (!config || !config.arrowType) {
      hideMenu(edgeMenuRef.value, "edge-no-arrow");
    } else if (config.orientation === 0) {
      hideMenu(edgeMenuRef.value, "edge-double-arrow");
    } else if (config.orientation === 1) {
      hideMenu(edgeMenuRef.value, "edge-right-arrow");
    } else if (config.orientation === -1) {
      hideMenu(edgeMenuRef.value, "edge-left-arrow");
    }
    hideMenu(edgeMenuRef.value, "link-delete");
  }

  return edgeMenuRef.value;
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
      console.log("-code--", code);
      if (Menus[code] && Menus[code].handler) {
        Menus[code].handler(graph.value, node, emit);
        return;
      }
    },
  });
  return toolbar;
};
const getToolbars = () => {};
const createEdge = (options) => {
  if (options.type !== 2) {
    graph.value.editCreateEdge(options.data, options.type);
  } else {
    graph.value.editCreateEdge(options.data, options.type);
  }
};
const initGraph = (isInit = true) => {
  if (graph.value) return;
  graph.value = createGraph(props);
  if (props.modelValue && isInit) {
    graph.value.updateData(props.modelValue, props.edges, {});
  }
  graph.value.on("change", (e) => {
    if (Menus[e.type]) {
      Menus[e.type].handler(graph.value, e.options.node, emit);
      return;
    }
    if (e.type === MindmapEvent.edgeCreate) {
      createEdge(e.options);
    } else if (e.type === MindmapEvent.nodeSelect) {
      selectNode.value = e.options.node;
      const map = getToolbarsMap();
      map["image"].disabled = !e.options.node;
      map["icon"].disabled = !e.options.node;
      map["func"].disabled = !e.options.node;
      map["link"].disabled = !e.options.node;
      map["create-article"].disabled = !e.options.node;
    }
  });
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
      shortcuts: shortcuts.value,
      //   shortcuts: [
      //     {
      //       key: "Tab",
      //       label: "添加子节点",
      //       Event: (node: any) => {
      //         console.log("--添加子节点--", node);
      //       },
      //     },
      //     {
      //       key: "x",
      //       label: "剪切节点",
      //       control: ["cmd", "ctrl"],
      //       Event: (_: any) => {
      //         console.log("--剪切节点--");
      //       },
      //     },
      //   ],
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

const onToolbar = (item) => {
  if (!graph.value) return;
  item.handler(graph.value, item);
};
</script>

<style lang="scss"></style>
