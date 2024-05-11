import TreeLayout from './layout/base';
import mindmap from './layout/mindmap';
import doTreeLayout from './layout/do-layout';
import util from './util';

class MindmapLayout extends TreeLayout {
  execute() {
    const me = this;
    return doTreeLayout(me.rootNode, me.options, mindmap);
  }
}

const DEFAULT_OPTIONS = {
};

function mindmapLayout(root, options) {
  options = util.assign({}, DEFAULT_OPTIONS, options);
  return new MindmapLayout(root, options).execute();
}

export default mindmapLayout;
