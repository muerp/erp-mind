<template>
  <div class="w-full h-full">
    <mu-mind-map
      ref="mindMapRef"
      class="container"
      :clickEdgeShowLabel="clickEdgeShowLabel"
      v-model="data"
      theme="white"
      v-model:mode="mode"
      v-model:edges="edges"
      :mindmap="true"
      :sharp-corner="true"
      @change="onChange"
      :default-edge-style="themeEdgeStyle[theme]"
      :default-node-style="themeConfig[theme]"
      :showEdgesChangeRoot="true"
      :scaleRatio="1.0"
      :allowChangeRoot="true"
    />
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import learn from "./learn.json";
const data = ref(learn);
const clickEdgeShowLabel = ref(false);
const mode = ref("edit");
const edges = ref([]);
const themeEdgeStyle = {
  default: {
    lineWidth: 2,
    stroke: "#8B738C",
  },
  dark: {
    lineWidth: 2,
    stroke: "#5a6ef0",
  },
};
const themeConfig = {
  white: {},
  dark: {
    btnStyle: {
      fill: "transparent",
      stroke: "transparent",
      lineWidth: 2,
    },
    btnTextStyle: {
      fill: "#fff",
      fontSize: 13,
    },
  },
};
const theme = ref("default");
</script>
<style lang="scss">
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
