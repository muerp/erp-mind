/*禁止缩放safari浏览器*/

var scale = {
    enabled: false,
    disabledSafari: function () {/* 阻止双击放大*/
        if (scale.enabled) return;
        scale.enabled = true;
        var lastTouchEnd = 0;
        document.addEventListener("touchstart", function (event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        });
        document.addEventListener("touchend", function (event) {
            var now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);/* 阻止双指指掐放大*/
        document.addEventListener("gesturestart", function (event) {
            event.preventDefault();
        });
    }
};
const randomUUID = () => {
    return "xxxxxxxx4xxxyxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
export {scale, randomUUID}