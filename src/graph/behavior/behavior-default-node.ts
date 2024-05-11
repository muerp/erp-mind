import G6 from "@antv/g6";
import { NameString, NodeType } from "../constaints";
import { isC } from "../nodes/node-draw-utils";
G6.registerBehavior("behavior-default-node", {
    getEvents() {
        return {
            "node:click": "onClickNode",
            "node:mouseover": "onMouseOverNode",
            "node:mouseleave": "onMouseLeaveNode",
        }
    },
    onClickNode(evt: any) {
        const name = evt.target.get('name');
        if (name === NameString.collapseClick) {
            evt.propagationStopped = true;
            this.graph.editCollapse(evt.item);
            return;
        }
    },
    onMouseOverNode(evt: any) {
        const { item: node } = evt;
        const name = evt.target.get('name');
        if (name !== NameString.nodeContainer) return;
        if (node.getModel().children.length>0) {
            if (isC) {
                node.setState("selected", true);
            } else {
                node.setState("hover", true);
            }
            node.toFront();
        }
    },
    onMouseLeaveNode(evt: any) {
        const { item: node } = evt;
        if (node.getModel().type === NodeType.defaultNode) {
            if (node.hasState(isC? 'selected':'hover')) {
                if (isC) {
                    node.setState("selected", false);
                } else {
                    node.setState("hover", false);
                }
                node.toBack();
            }
        }

    },
});