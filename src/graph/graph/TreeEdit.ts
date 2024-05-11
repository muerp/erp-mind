import { paddingH, placeholderText, radius } from "../variable";
import { EventName, MindmapEvent } from "./mindmap-events";
import { NameString } from "../constaints";
import { EdgeTextPadding, defaultLabelText } from "../nodeTemplate/constant";
enum EditType {
    node = 0,
    edgeLabel
}

const defaultEditStyle = {
    'display': 'block',
    'position': 'fixed',
    'box-sizing': 'border-box',
    'white-space': 'normal',
    'word-break': 'break-all',
    'word-wrap': 'break-word',
    'overflow': `auto`,
    'resize': `none`,
    'outline': `none`,
    'z-index': 10,
    'transform-origin': '0 0',
    'background-color': 'transparent',
    'height': 'auto',
    'width': 'auto',
    'min-width': 'auto',
    'max-width': 'auto',
}

export class TreeEdit {
    el: HTMLTextAreaElement
    type: EditType = EditType.node
    node: any
    target: any
    changeKey: string
    graph: any
    heightOffset: number = 0
    maxHeight: number = 120
    maxWidth: number = 200
    paddingH: number = 0
    value: string = ''
    originateValue = ''
    timer: any
    center: { x: 0, y: 0 }
    edgeLabelTextStyle: any
    isFocus: boolean = false
    visibility: boolean = true
    constructor(props) {
        this.el = props.editEl;
        this.el.setAttribute("data-key", "mindmap-input");
        this.graph = props.graph;
        if (this.el) {
            this.el.addEventListener('input', this.onChange.bind(this));
            this.el.addEventListener('focus', this.onFocus.bind(this));
            this.el.addEventListener('blur', this.onBlur.bind(this));
            this.el.addEventListener('keydown', this.onKeyDown.bind(this));
        }
        if (this.graph.isMobile) {
            document.addEventListener("touchstart", this.disabledInput.bind(this));
        }
    }

    onChange() {
        if (!this.node) return;
        if (this.type === EditType.node) {
            let height = this.el.scrollHeight + this.heightOffset;
            height = height > this.maxHeight ? this.maxHeight : height;
            if (height - this.el.offsetHeight > 4) {
                this.el.style.height = height + 'px';
            }
            if (this.el.innerText !== this.value) {
                this.value = this.el.innerText;
                this.graph.emit(EventName.change, {
                    type: MindmapEvent.nodeTitleChange,
                    options: {
                        model: this.node.getModel(),
                        title: this.value
                    }
                })
            }
        } else if (this.type === EditType.edgeLabel) {
            let ratio = this.graph.getZoom();
            const size = this.graph.getTextSize(this.el.innerText ? this.el.innerText.replace(/\n/g, '') : defaultLabelText, { ...this.edgeLabelTextStyle });
            let width = size.width + this.paddingH;
            if (width >= this.maxWidth) {
                width = this.maxWidth;
            }

            this.el.style.width = width + 'px';

            this.el.style.left = `${this.center.x - width * 0.5 * ratio}px`;
            let height = this.el.scrollHeight + this.heightOffset;
            this.el.style.top = `${this.center.y - height * 0.5 * ratio}px`;
            this.el.scrollTop = this.el.scrollHeight - height;
            if (this.el.innerText !== this.value) {
                this.value = this.el.innerText;
                this.graph.emit(EventName.change, {
                    type: MindmapEvent.edgeTitleChange,
                    options: {
                        model: this.node.getModel(),
                        title: this.value
                    }
                })
            }
        }
    }

    blur() {
        if (this.node) {
            this.el.blur();
        }
    }

    focus() {
        if (this.node) {
            this.el.focus();
        }
    }
    disabledInput(e: any) {
        let key = e.target.getAttribute('data-key')
        if (key === 'mindmap-input') {
            return;
        }
        this.blur();
    }

    onFocus(e) {
        this.isFocus = true;
        this.graph.emit(EventName.change, {
            type: MindmapEvent.focus,
            options: {
                target: e.target
            }
        });
        if (!this.node) return;
    }

    onBlur(e) {
        this.isFocus = false;

        this.graph.emit(EventName.change, {
            type: MindmapEvent.blur,
            options: {
                target: e.target
            }
        });
        if (!this.node) return;

        if (this.type === EditType.node) {
            if (this.value !== this.node.getModel().title) {
                this.graph.emit(EventName.change, {
                    type: MindmapEvent.nodeTitleBlur,
                    options: {
                        model: this.node.getModel(),
                        title: this.value.trim()
                    }
                })

                if (this.value) {
                    // let model = this.node.getModel();
                    // model.title = this.value;
                    this.graph.updateNodeTitle(this.node, this.value);
                    // this.graph.data(this.graph.get('data'))
                    // this.graph.layout();
                }
            }
        } else if (this.type === EditType.edgeLabel) {
            if (this.value !== this.node.getModel()[this.changeKey]) {
                let model = this.node.getModel();

                let text = this.value.replace(/\n/g, '');

                const labelStyle = this.graph.getTextSize(text || defaultLabelText, { ...this.edgeLabelTextStyle })
                const options: any = {
                    source: model.source,
                    target: model.target
                }
                options[this.changeKey] = text
                if (this.changeKey === 'title') {
                    options.labelStyle = labelStyle;
                } else if (this.changeKey === 'label1') {
                    options.labelStyle1 = labelStyle;
                } else if (this.changeKey === 'label2') {
                    options.labelStyle2 = labelStyle;
                }

                this.graph.modifyEdgeOptions(options)
            }
        }

        this.el.style.display = 'none';
        this.el.style.top = '-300px';
        this.el.style.left = '-300px';
        if (this.type === EditType.edgeLabel) {
            if (this.target.getParent()) this.target.getParent().show();
        } else {
            this.node.show();
        }
        this.node = undefined;
        if (this.originateValue === this.value && !this.visibility) {
            return;
        }
        if (!this.graph.isMobile) {
            let timer = setTimeout(() => {
                this.graph.get('container').focus();
                clearTimeout(timer);
            }, 500);
        }
    }

    onKeyDown(e) {
        if (!this.node) return;
        if (!this.visibility) {
            if (this.graph.checkShortcut(e)) {
                e.preventDefault();
                return false;
            }
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
                e.preventDefault();
                return false
            };
            this.visibility = true;

            this.node.hide();
            this.el.style.opacity = '1';
            this.el.style.cursor = 'text';
            this.el.style.pointerEvents = 'auto';
        }
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            this.el.blur();
            return false;
        }
    }

    buildStyle(obj) {
        let res = "";
        for (let key in obj) {
            res += `${key}:${obj[key]};`;
        }
        return res;
    }

    showEdgeLabel(node, target) {
        if (!this.el) return;
        this.visibility = true;
        this.type = EditType.edgeLabel;
        this.node = node;
        const title = target.getParent().findAllByName(NameString.edgeTitle)[0]
        const { edgeLabelBgStyle, edgeLabelTextStyle } = node.getModel().style;
        this.edgeLabelTextStyle = edgeLabelTextStyle;
        const attrs = target.get('attrs');
        const bgBBox = target.getBBox();
        const textAttr = title.get('attrs');
        const textBBox = title.getBBox();


        this.target = target;
        target.getParent().hide();
        this.changeKey = attrs.changeKey;

        let ratio = this.graph.getZoom();

        let pos = this.graph.getClientByPoint(attrs.x, attrs.y);
        pos.x += attrs.width * 0.5 * ratio;
        pos.y += attrs.height * 0.5 * ratio;
        this.center = pos;
        this.paddingH = bgBBox.width - textBBox.width;
        this.maxWidth = (textAttr.maxWidth || edgeLabelTextStyle.maxWidth) + this.paddingH;


        const configStyle = {
            transform: `scale(${ratio})`,
            'background-color': edgeLabelBgStyle.fill,
            'font-size': `${edgeLabelTextStyle.fontSize}px`,
            'font-weight': edgeLabelTextStyle.fontWeight,
            'line-height': `${edgeLabelTextStyle.lineHeight}px`,
            'font-family': `${edgeLabelTextStyle.fontFamily}`,
            'color': `${edgeLabelTextStyle.fill}`,
            'border-radius': `${4}px`,
            'max-width': `${this.maxWidth}px`,
            // 'padding': `${(bgBBox.height-textBBox.height)*0.5}px ${(this.paddingH)*0.5}px`,
            'padding': `${EdgeTextPadding.v}px ${EdgeTextPadding.h}px`,
        }
        this.el.style.cssText = this.buildStyle({
            ...defaultEditStyle,
            ...configStyle,
            'text-align': 'left',
        });


        this.el.innerText = textAttr.text !== defaultLabelText ? (textAttr.text || '') : '';
        this.el.setAttribute('placeholder', '请输入标签');
        this.value = this.el.innerText;
        this.originateValue = this.el.innerText;
        if (attrs.width) {
            this.el.style.width = `${attrs.width}px`;
        }

        let top = this.center.y - this.el.offsetHeight * 0.5 * ratio;
        let left = this.center.x - this.el.offsetWidth * 0.5 * ratio;
        this.el.style.top = `${top}px`;
        this.el.style.left = `${left}px`;
        this.heightOffset = this.el.offsetHeight - this.el.scrollHeight;

        this.focusEnd();
    }

    show(node, isReady = false) {
        if (this.node && this.node.getModel().id === this.node.getModel().id && this.visibility) return;
        if (!this.el || !node._cfg?.bboxCache) return;
        this.visibility = !isReady;
        this.type = EditType.node;
        this.node = node;
        if (this.visibility) {
            this.node.hide();
        }
        const { x: pointX, y: pointY } = node._cfg?.bboxCache;


        const {
            style: {
                stroke,
                beforeWidth
            },
            nameStyle,
            btnStyle,
            btnTextStyle,
            btnSelectedStyle
        } = node._cfg?.model;
        const titleNode = node.getContainer().findAllByName('title')[0];
        let ratio = this.graph.getZoom();
        let { x, y } = this.graph.getClientByPoint(pointX, pointY);
        this.el.style.cssText = this.buildStyle({
            ...defaultEditStyle,
            transform: `scale(${ratio})`,
            top: `${y - btnStyle.lineWidth * 0.5 * ratio}px`,
            left: `${beforeWidth * ratio + x - stroke * 0.5 * ratio}px`,
            'max-width': `${nameStyle.maxWidth + paddingH * 2}px`,
            'font-size': `${btnTextStyle.fontSize}px`,
            'font-family': `${btnTextStyle.fontFamily}`,
            'font-weight': `${btnTextStyle.fontWeight}`,
            'font-style': `${btnTextStyle.fontStyle}`,
            'text-align': 'left',
            padding: `0 ${paddingH - btnStyle.lineWidth * 0.5}px`,
            'line-height': `${btnTextStyle.lineHeight}px`,
            'background-color': btnStyle.fill === 'transparent' ? '' : btnStyle.fill,
            border: `${stroke}px solid ${btnSelectedStyle.stroke}`,
            color: btnTextStyle.fill,
            "border-radius": `${radius + 1}px`,
            "opacity": this.visibility ? '1' : '0',
            "cursor": this.visibility ? 'text' : 'pointer',
            'pointer-events': this.visibility ? 'auto' : 'none'
        });

        this.el.innerText = placeholderText === nameStyle.text ? "" : nameStyle.text;
        this.value = nameStyle.text || '';
        this.originateValue = this.value;
        this.el.setAttribute('placeholder', placeholderText);
        this.heightOffset = this.el.offsetHeight - this.el.scrollHeight;
        this.el.contentEditable = 'false';
        this.focusEnd();
    }

    focusEnd() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.el.contentEditable = 'true';
            this.el.focus();
            if (window.getSelection) {
                //ie11 10 9 ff safari
                const range = window.getSelection(); //创建range
                range.selectAllChildren(this.el); //range 选择box2下所有子内容
                range.collapseToEnd(); //光标移至最后
            }

        }, this.graph.isMobile ? 300 : 300);
    }
}
