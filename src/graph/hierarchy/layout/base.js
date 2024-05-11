
import hierarchy from './hierarchy';

class Layout {
  constructor(root, options = {}) {
    const me = this;
    me.options = options;
    me.rootNode = hierarchy(root, options);
  }

  execute() {
    throw new Error('please override this method');
  }
}

export default Layout;
