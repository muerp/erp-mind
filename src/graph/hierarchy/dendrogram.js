import TreeLayout from './layout/base';
import dendrogram from './layout/dendrogram';
import doTreeLayout from './layout/do-layout';
import util from './util';

class DendrogramLayout extends TreeLayout {
  execute() {
    const me = this;
    me.rootNode.width = 0;
    return doTreeLayout(me.rootNode, me.options, dendrogram);
  }
}

const DEFAULT_OPTIONS = {
};

function dendrogramLayout(root, options) {
  options = util.assign({}, DEFAULT_OPTIONS, options);
  return new DendrogramLayout(root, options).execute();
}

export default dendrogramLayout;
