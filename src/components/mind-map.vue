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
  </div>
</template>
<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { MindGraph } from "../graph";

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
  sharpCorner: {type: Boolean, default: false},
});
const mindmap = ref();
const graph = ref();
const mindmapInput = ref();
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
      // type: NodeType.defaultNode,
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
</style>
