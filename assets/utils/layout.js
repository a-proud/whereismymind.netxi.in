export function layoutSubtree(nodes, rootId, startX = 0, startY = 0) {
  const levelGapY = 100;
  const siblingGapX = 150;

  const positions = new Map();

  // Position the nodes recursively
  function dfs(nodeId, x, y) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 0;

    let subtreeWidth = 0;
    const children = nodes.filter(n => n.parentId === nodeId);

    if (children.length === 0) {
      node.position = { x, y };
      return siblingGapX;
    }

    let currentX = x;
    for (const child of children) {
      const childWidth = dfs(child.id, currentX, y + levelGapY);
      currentX += childWidth;
      subtreeWidth += childWidth;
    }

    // Center the node under its children
    node.position = {
      x: x + subtreeWidth / 2 - siblingGapX / 2,
      y,
    };

    return subtreeWidth;
  }

  dfs(rootId, startX, startY);

  return [...nodes];
}

export function updateSubtreeHeights(nodes, rootId) {
  function calcHeight(nodeId) {
    const children = nodes.filter(n => n.parentId === nodeId);
    if (children.length === 0) return 1;
    return 1 + Math.max(...children.map(c => calcHeight(c.id)));
  }
  const rootHeight = calcHeight(rootId);
  nodes.forEach(n => {
    n.subtreeHeight = calcHeight(n.id);
  });
  return rootHeight;
}
