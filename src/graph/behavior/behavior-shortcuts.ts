import G6 from "@antv/g6";
import { MindGraph, ShortcutKey } from "..";

G6.registerBehavior("behavior-shortcut", {
  focusCanvasId: "mxs-mindmap_container",
  hotList: [],
  getEvents: function getEvents() {
    return {
      keydown: "handleKeydown",
    };
  },
  handleKeydown(evt: any) {
    const graph = this.graph as MindGraph;
    if (!graph.isEnter) return;
    let { key, shiftKey, ctrlKey, altKey, metaKey } = evt;
    const keys = ['meta', 'shift', 'control', 'alt']
    const shortcuts: string[] = [];
    if (shiftKey || ctrlKey || altKey || metaKey) {
      if (shiftKey) {
        shortcuts.push('shift');
      }
      if (ctrlKey) {
        shortcuts.push('ctrl');
      }
      if (altKey) {
        shortcuts.push('alt');
      }
      if (metaKey) {
        shortcuts.push('meta');
      }
    }
    if (key === '=') {
      key = '+'
    }
    const hotLists = this.hotList as ShortcutKey[];
    const keyStr = keys.findIndex(r => r === key.toLowerCase()) === -1 ? key.toLowerCase() : '';
    const shortcutKey = shortcuts.join('+') + (shortcuts.length > 0 && keyStr ? '+' : '') + keyStr;

    const item = hotLists.find(item => {
      return item.shortcutKey === shortcutKey
    })
    if (item) {
      evt.preventDefault(); // 禁止默认事件
      item.handler.call(this, graph);
    }

  },
});
