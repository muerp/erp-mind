import util from '../util';

function secondWalk(node, options) {
  let totalHeight = 0;
    if (!node.children.length) {
      totalHeight = node.height;
    } else {
      node.children.forEach(c => {
        // console.log('-secondWalk-1', c.data.title)
        totalHeight += secondWalk(c, options);
      });
    }
  
    node._subTreeSep = options.getSubTreeSep(node.data);
    // console.log("node._subTreeSep", totalHeight, node._subTreeSep)
    node.totalHeight = Math.max(node.height, totalHeight) + 2 * node._subTreeSep;
    return node.totalHeight;
}

function thirdWalk(node) {
  const children = node.children;
  const len = children.length;
  if (len) {
    children.forEach(c => {
      thirdWalk(c);
    });
    const first = children[0];
    const last = children[len - 1];
    // if (node.data.title === '思维导图思维导图2') {
      // console.log('-333-root', node.data.title)
    // }
    const childrenHeight = last.y - first.y + last.height;
    let childrenTotalHeight = 0;
    children.forEach(child => {
      childrenTotalHeight += child.totalHeight;
    });
    if (childrenHeight > node.height) {
      // 当子节点总高度大于父节点高度
      node.y = first.y + childrenHeight / 2 - node.height / 2;
    } else if (children.length !== 1 || node.height > childrenTotalHeight) {
      // 多于一个子节点或者父节点大于所有子节点的总高度
      const offset = node.y + (node.height - childrenHeight) / 2 - first.y;
      children.forEach(c => {
        c.translate(0, offset);
      });
    } else {
      // 只有一个子节点
      node.y = (first.y + first.height / 2 + last.y + last.height / 2) / 2 - node.height / 2;
    }
  }
}

const DEFAULT_OPTIONS = {
  getSubTreeSep() {
    return 0;
  }
};

export default (root, options = {}) => {

  options = util.assign({}, DEFAULT_OPTIONS, options);
  root.parent = {
    x: 0,
    width: 0,
    height: 0,
    y: 0
  };
  // first walk
  if (root.data.isHor) {
    root.x = 0;
    let maxX = 0;
    root.children.forEach(c => {
      let lastX = 0;
      let isFirst = true;
      c.BFTraverse(node => {
        if (isFirst) {
          node.x = maxX + node.parent.x + node.parent.width + 50; // simply get x
          isFirst = false;
        } else {
          node.x = node.parent.x + node.parent.width; // simply get x
        }
      
        lastX = node.x + node.width;
      })
      maxX = lastX;
    })
  } else {
    root.BFTraverse(node => {
      node.x = node.parent.x + node.parent.width; // simply get x
    });
  }
  
  root.parent = null;
  // second walk
  if (root.data.isHor) {
    let maxHeight = root.height;
    root.children.forEach(c => {
      c.parent.y = 0;
      c.parent.height = 0;
      const totalHeight = secondWalk(c, options);
      maxHeight = Math.max(totalHeight, maxHeight);
      // console.log('==maxHeight===', maxHeight)
    })
    root.totalHeight = maxHeight;
  } else {
    secondWalk(root, options); // assign sub tree totalHeight
  }
  
  // adjusting
  // separating nodes
  root.startY = 0;
  root.y = root.totalHeight / 2 - root.height / 2;
  // console.log('=====', root.data.title, root.y)
  if (root.data.isHor) {
    root.startY = 0;
    root.y = root.totalHeight / 2 - root.height / 2;
    const centerY = root.totalHeight / 2 - root.height / 2;
    root.children.forEach(c => {
      c.startY = (root.totalHeight - c.totalHeight) / 2;
      c.y = root.totalHeight / 2 - c.height / 2;
      // console.log('===111==', c.data.title, root.y)
      c.eachNode(node => {
        const children = node.children;
        const len = children.length;
        if (len) {
          const first = children[0];
          first.startY = node.startY + node._subTreeSep;
          if (len === 1) {
            first.y = node.y + node.height / 2 - first.height / 2;
          } else {
            first.y = first.startY + first.totalHeight / 2 - first.height / 2;
            for (let i = 1; i < len; i++) {
              const c = children[i];
              c.startY = children[i - 1].startY + children[i - 1].totalHeight;
              c.y = c.startY + c.totalHeight / 2 - c.height / 2;
            }
          }
        }
      });
    });
  } else {
    root.eachNode(node => {
      const children = node.children;
      const len = children.length;
      if (len) {
        const first = children[0];
        first.startY = node.startY + node._subTreeSep;
        if (len === 1) {
          first.y = node.y + node.height / 2 - first.height / 2;
        } else {
          first.y = first.startY + first.totalHeight / 2 - first.height / 2;
          for (let i = 1; i < len; i++) {
            const c = children[i];
            c.startY = children[i - 1].startY + children[i - 1].totalHeight;
            c.y = c.startY + c.totalHeight / 2 - c.height / 2;
          }
        }
      }
    });
  }
  

  // third walk
  if (root.data.isHor) {
    root.children.forEach(c => {
      thirdWalk(c);  
    });
  } else {
    thirdWalk(root);
  }
};
