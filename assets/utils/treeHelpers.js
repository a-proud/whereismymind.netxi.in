/**
 * Updates the subtreeHeight field for each node, starting from parentId.
 * Returns the subtree height for parentId.
 */
export function updateSubtreeHeights(nodes, parentId) {
  const children = nodes.filter((n) => n.parentId === parentId);
  let height = 1;

  for (const child of children) {
    height += updateSubtreeHeights(nodes, child.id);
  }

  const nodeIndex = nodes.findIndex((n) => n.id === parentId);
  if (nodeIndex >= 0) {
    nodes[nodeIndex] = {
      ...nodes[nodeIndex],
      subtreeHeight: height,
    };
  }

  return height;
}
/**
 * Arranges nodes as a tree starting from rootId, using startX and startY.
 * Returns new nodes with updated positions.
 */
export function layoutSubtree(nodes, rootId, startX, startY) {
  const layouted = [...nodes];
  const spacingY = 150;
  const spacingX = 200;

/**
 * Recursively arranges the position of the node and its children.
 * Returns the current Y offset.
 */
  const recurse = (id, x, y) => {
    const nodeIndex = layouted.findIndex((n) => n.id === id);
    if (nodeIndex === -1) return y;

    const node = layouted[nodeIndex];
    layouted[nodeIndex] = {
      ...node,
      position: { x, y },
    };

    const children = layouted
      .filter((n) => n.parentId === id)
      .sort((a, b) => a.id.localeCompare(b.id));

    let offsetY = y;
    for (const child of children) {
      offsetY = recurse(child.id, x + spacingX, offsetY + spacingY);
    }

    return offsetY;
  };

  recurse(rootId, startX, startY);
  return layouted;
}

/**
 * Collects a set of ids for removal — the node and all its descendants.
 */
export function collectNodeIdsToRemove(nodes, nodeId) {
  const idsToRemove = new Set();

  const collect = (id) => {
    idsToRemove.add(id);
    nodes.filter((n) => n.parentId === id).forEach((n) => collect(n.id));
  };

  collect(nodeId);
  return idsToRemove;
}
