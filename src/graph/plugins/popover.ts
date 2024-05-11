import { modifyCSS, createDom } from '@antv/dom-util';
import { isString } from '@antv/util';
import { IAbstractGraph as IGraph, IG6GraphEvent, Item } from '@antv/g6-core';
import PluginBase, { IPluginBaseConfig } from './base';
import insertCss from 'insert-css';
interface PopoverConfig extends IPluginBaseConfig {
  handleClick?: (target: HTMLElement, item: Item) => void;
  getContent?: (evt?: IG6GraphEvent) => HTMLDivElement | string;
  shouldBegin?: (evt?: IG6GraphEvent) => boolean;
  itemTypes?: string[];
  offsetX?: number;
  offsetY?: number;
}


typeof document !== 'undefined' &&
  insertCss(`
  .plugin-popover-container {
  background: #262626;
  color: #fefefe;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.4;
  &::after{
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    border: 4px solid transparent;
    border-top-color: #262626;
    transform: translate(-50%,99%);
  }

  &>ul {
    display: flex;
    padding: 6px;
    margin:0;
  }

  & li {
    padding: 3px 5px;
    list-style:none;
  }

  & li+li {
    position: relative;
    &::before {
      content: '';
      width: 1px;
      height: 60%;
      position: absolute;
      left: 0;
      top: 50%;
      background: #fefefe;
      transform: translateY(-50%);
      border-radius: 4px;
      opacity: 0.3;
    }
  }
}
`);


export default class Popover extends PluginBase {
  constructor(config?: PopoverConfig) {
    super(config);
  }

  public getDefaultCfgs(): PopoverConfig {
    return {
      handleClick: undefined,
      offsetX: 0,
      offsetY: 10,
      itemTypes: ['node'],
      getContent: (e) => {
        return `
          <ul>
            <li>菜单项1</li>
            <li>菜单项2</li>
          </ul>
        `;
      },
      shouldBegin: (e) => {
        return true;
      }
    };
  }

  // class-methods-use-this
  public getEvents() {
    return {
      click: 'onMenuShow',
      touchend: 'onMenuShow',
      wheel: 'onMenuHide',
      touchmove: 'onMenuHide'
    };
  }

  public init() {
    const className = this.get('className');
    const menu = createDom(`<div class=${className || 'plugin-popover-container'}></div>`);
    modifyCSS(menu, { top: '0px', position: 'absolute', visibility: 'hidden' });
    let container: HTMLDivElement | null = this.get('container');
    if (!container) {
      container = this.get('graph').get('container');
    }
    if (isString(container)) {
      container = document.getElementById(container) as HTMLDivElement;
    }

    container.appendChild(menu);

    this.set('menu', menu);
  }

  protected onMenuShow(e: IG6GraphEvent) {
    const self = this;
    e.preventDefault();

    const itemTypes = this.get('itemTypes');
    if (!e.item) {
      if (itemTypes.indexOf('canvas') === -1) {
        self.onMenuHide();
        return;
      }
    } else {
      if (e.item && e.item.getType && itemTypes.indexOf(e.item.getType()) === -1) {
        self.onMenuHide();
        return;
      }
    }

    const shouldBegin = this.get('shouldBegin');
    if (!shouldBegin(e)) return;

    const menuDom = this.get('menu');
    const getContent = this.get('getContent');
    const graph: IGraph = this.get('graph');
    const menu = getContent(e, graph);
    if (isString(menu)) {
      menuDom.innerHTML = menu;
    } else {
      menuDom.innerHTML = menu.outerHTML;
    }
    // 清除之前监听的事件
    this.removeMenuEventListener();

    const handleClick = this.get('handleClick');
    if (handleClick) {
      const handleMenuClickWrapper = (evt) => {
        handleClick(evt.target, e.item, graph);
      };
      this.set('handleMenuClickWrapper', handleMenuClickWrapper);
      menuDom.addEventListener('click', handleMenuClickWrapper);
    }

    const bbox = menuDom.getBoundingClientRect();

    const offsetX = this.get('offsetX') || 0;
    const offsetY = this.get('offsetY') || 0;

    const cbox = graph.getContainer().getBoundingClientRect();


    const { x: nodeX, y: nodeY, height: nodeHeight, width: nodeWidth } = e.item.getBBox();
    const { x: nodeClientX, y: nodeClientY } = graph.getClientByPoint(nodeX, nodeY)

    const zoom = graph.getZoom();

    let x = nodeClientX - cbox.x - offsetX * zoom + (nodeWidth * zoom - bbox.width) / 2;
    let y = nodeClientY - cbox.y - offsetY * zoom - bbox.height;

    modifyCSS(menuDom, {
      top: `${y}px`,
      left: `${x}px`,
      visibility: 'visible',
      transform: `scale(${zoom})`,
      transformOrigin: `0 0`
    });

    // 左键单击会触发 body 上监听的 click 事件，导致菜单展示出来后又立即被隐藏了，需要过滤掉
    let triggeredByFirstClick = this.get('trigger') === 'click';
    const handler = (evt) => {
      if (triggeredByFirstClick) {
        triggeredByFirstClick = false;
        return;
      }
      self.onMenuHide();
    };

    // 如果在页面中其他任意地方进行click, 隐去菜单
    document.body.addEventListener('click', handler);
    this.set('handler', handler);
  }

  private removeMenuEventListener() {
    const handleMenuClickWrapper = this.get('handleMenuClickWrapper');
    const handler = this.get('handler');

    if (handleMenuClickWrapper) {
      const menuDom = this.get('menu');
      menuDom.removeEventListener('click', handleMenuClickWrapper);
      this.set('handleMenuClickWrapper', null);
    }
    if (handler) {
      document.body.removeEventListener('click', handler);
    }
  }

  private onMenuHide() {
    const menuDom = this.get('menu');
    if (menuDom) {
      modifyCSS(menuDom, { visibility: 'hidden' });
    }

    // 隐藏菜单后需要移除事件监听
    this.removeMenuEventListener();
  }

  public hide(){
    this.onMenuHide();
  }

  public destroy() {
    const menu = this.get('menu');
    this.removeMenuEventListener();

    if (menu) {
      let container: HTMLDivElement | null = this.get('container');
      if (!container) {
        container = this.get('graph').get('container');
      }
      if (isString(container)) {
        container = document.getElementById(container) as HTMLDivElement;
      }
      container.removeChild(menu);
    }
  }
}