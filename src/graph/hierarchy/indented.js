import TreeLayout from './layout/base';
import indentedTree from './layout/indented';
import separateTree from './layout/separate-root';
import util from './util';


const VALID_DIRECTIONS = [
  'LR', // left to right
  'RL', // right to left
  'H' // horizontal
];
const DEFAULT_DIRECTION = VALID_DIRECTIONS[0];

class IndentedLayout extends TreeLayout {
  execute() {
    const me = this;
    const options = me.options;
    const root = me.rootNode;
    options.isHorizontal = true;
    // default indent 20 and sink first children;
    const { indent = 20, dropCap = true, direction = DEFAULT_DIRECTION, align } = options;
    if (direction && VALID_DIRECTIONS.indexOf(direction) === -1) {
      throw new TypeError(`Invalid direction: ${direction}`);
    }
    if (direction === VALID_DIRECTIONS[0]) { // LR
      indentedTree(root, indent, dropCap, align);
    } else if (direction === VALID_DIRECTIONS[1]) { // RL
      indentedTree(root, indent, dropCap, align);
      root.right2left();
    } else if (direction === VALID_DIRECTIONS[2]) { // H
      // separate into left and right trees
      const { left, right } = separateTree(root, options);
      indentedTree(left, indent, dropCap, align);
      left.right2left();
      indentedTree(right, indent, dropCap, align);
      const bbox = left.getBoundingBox();
      right.translate(bbox.width, 0);
      root.x = right.x - root.width / 2;
    }
    return root;
  }
}

const DEFAULT_OPTIONS = {
};

function indentedLayout(root, options) {
  options = util.assign({}, DEFAULT_OPTIONS, options);
  return new IndentedLayout(root, options).execute();
}

export default indentedLayout;
