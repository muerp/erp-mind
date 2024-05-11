import G6 from "@antv/g6";
import {controlMoveDirection} from "../variable";

G6.registerBehavior("behavior-canvas", {
    options:{
        shouldBegin:(ctrl)=>true
    },
    getEvents: function getEvents() {
        return {
            wheel: "onWheel",
        };
    },
    reCalcDir: true,
    timer: null,
    onWheel: function onWheel(ev) {
        ev.preventDefault();
        const shouldBegin = this.get('shouldBegin');
        if (ev.ctrlKey) {
            if(!shouldBegin(true)) return;
            const canvas = this.graph.get("canvas");
            const point = canvas.getPointByClient(ev.clientX, ev.clientY);
            let ratio = this.graph.getZoom();
            if (ev.wheelDelta > 0) {
                ratio = ratio + ratio * 0.05;
            } else {
                ratio = ratio - ratio * 0.05;
            }
            this.graph.zoomTo(ratio, {
                x: point.x,
                y: point.y,
            });
        } else {
            if(!shouldBegin(false)) return;
            let direction = "all";
            let x = ev.deltaX || ev.movementX;
            let y = ev.deltaY || ev.movementY;
    
            if (controlMoveDirection.value) {
                direction = Math.abs(x) < Math.abs(y) ? "v" : "h";
                this.reCalcDir = false;
                clearTimeout(this.timer);
                this.timer = setTimeout(() => {
                    this.reCalcDir = true;
                }, 1000);
            }
            if (!y && navigator.userAgent.indexOf("Firefox") > -1)
                y = (-ev.wheelDelta * 125) / 3;
            if (direction === "h") {
                y = 0;
            } else if (direction === "v") {
                x = 0;
            }
            this.graph.translate(-x, -y);
        }
    },
});
