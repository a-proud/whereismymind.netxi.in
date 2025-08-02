import { useState, useCallback } from 'react';
import { applyNodeChanges } from 'react-flow-renderer';
import { updateSubtreeHeights, layoutSubtree, collectNodeIdsToRemove } from '../utils/treeHelpers';

const initialNodes = [
    {
        id: '1',
        type: 'editable',
        data: { 
            label: '',
            context: '',
            body: '',
            isRoot: true
        },
        position: { x: 250, y: 50 },
        parentId: null,
        level: 0,
        subtreeHeight: 1,
    },
];

const initialEdges = [];

export function useMindMapLogic() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const addChildNode = useCallback((parentId) => {
    setNodes((prevNodes) => {
      const parent = prevNodes.find((n) => n.id === parentId);
      if (!parent) return prevNodes;

      const newId = (Math.max(0, ...prevNodes.map((n) => +n.id)) + 1).toString();

      const newNode = {
        id: newId,
        type: 'editable',
        data: { 
          label: '',
          context: '',
          body: '',
          isRoot: false
        },
        position: { x: 0, y: 0 },
        parentId,
        level: parent.level + 1,
        subtreeHeight: 1,
      };

      const newNodes = [...prevNodes, newNode];

      updateSubtreeHeights(newNodes, '1');
      const layoutedNodes = layoutSubtree(newNodes, '1', 250, 50);

      setEdges((prevEdges) => [
        ...prevEdges,
        {
          id: `e${parentId}-${newId}`,
          source: parentId,
          target: newId,
        },
      ]);

      return layoutedNodes;
    });
  }, []);

  const removeNode = useCallback((nodeId) => {
    setNodes((prevNodes) => {
      const idsToRemove = collectNodeIdsToRemove(prevNodes, nodeId);

      const remainingNodes = prevNodes.filter((n) => !idsToRemove.has(n.id));
      setEdges((prevEdges) =>
        prevEdges.filter(
          (e) => !idsToRemove.has(e.source) && !idsToRemove.has(e.target)
        )
      );

      updateSubtreeHeights(remainingNodes, '1');
      return layoutSubtree(remainingNodes, '1', 250, 50);
    });
  }, []);

  return {
    nodes,
    edges,
    onNodesChange,
    addChildNode,
    removeNode,
    setNodes,
    setEdges,
  };
}
