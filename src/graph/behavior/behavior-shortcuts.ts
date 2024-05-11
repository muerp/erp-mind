import G6 from "@antv/g6";

G6.registerBehavior("behavior-shortcut", {
  focusCanvasId: "mxs-mindmap_container",
  options: {
    hotList: [],
    shouldBegin: () => true,
  },
  getEvents: function getEvents() {
    return {
      keydown: "handleKeydown",
    };
  },
  handleKeydown(evt) {
    if (document.activeElement !== this.graph.get('container')) return;
    const { key, shiftKey, ctrlKey, altKey, metaKey } = evt;
    let handler = this.get("hotList").filter((item) => item.key === key) || [];
    if (shiftKey || ctrlKey || altKey || metaKey) {
      if (shiftKey) {
        handler = handler.filter((item) => item.control?.indexOf("shift") > -1);
      }
      if (ctrlKey) {
        handler = handler.filter((item) => item.control?.indexOf("ctrl") > -1);
      }
      if (metaKey) {
        handler = handler.filter((item) => item.control?.indexOf("cmd") > -1);
      }
      if (altKey) {
        handler = handler.filter((item) => item.control?.indexOf("alt") > -1);
      }
    } else if (handler.length === 1 && handler[0].control) {
      handler = [];
    }
    if (!this.get("shouldBegin")(this.graph) || !handler.length) return;
    // 识别到快捷键，处理快捷键
    evt.preventDefault(); // 禁止默认事件
    handler[0].Event.call(this, this.graph);
  },
});
