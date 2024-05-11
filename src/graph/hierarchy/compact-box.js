import TreeLayout from './layout/base'
import nonLayeredTidyTree from './layout/non-layered-tidy';
import doTreeLayout from './layout/do-layout';
import util from './util';

class CompactBoxTreeLayout extends TreeLayout {
  execute() {
    const me = this;
    return doTreeLayout(me.rootNode, me.options, nonLayeredTidyTree);
  }
}

const DEFAULT_OPTIONS = {
};

function compactBoxLayout(root, options) {
  options = util.assign({}, DEFAULT_OPTIONS, options);
  return new CompactBoxTreeLayout(root, options).execute();
}

export default compactBoxLayout;
