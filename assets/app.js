import './styles/app.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import ReactFlow, {
  Handle,
  Position,
  Background,
  applyNodeChanges,
} from 'react-flow-renderer';

function EditableNode({ id, data, addChildNode }) {
  const [label, setLabel] = useState(data.label);

  return (
    <div
      style={{
        padding: 10,
        border: '1px solid #555',
        borderRadius: 5,
        background: '#fff',
        position: 'relative',
        minWidth: 120,
      }}
    >
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        style={{ width: '100%', border: 'none', outline: 'none' }}
      />
      <button
        onClick={() => addChildNode(id)}
        title="Добавить под-ноду"
        style={{
          position: 'absolute',
          bottom: 5,
          right: 5,
          padding: '2px 6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          borderRadius: 3,
          border: '1px solid #555',
          background: '#eee',
        }}
      >
        ➕
      </button>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
}

const initialNodes = [
  {
    id: '1',
    type: 'editable',
    data: { label: 'Главная нода' },
    position: { x: 250, y: 50 },
    parentId: null,
    level: 0,
    subtreeHeight: 1, // кол-во всех поднод + 1 (себя)
  },
];

const initialEdges = [];

function MindMap() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const updateSubtreeHeights = (nodes, parentId) => {
    // рекурсивный перерасчет высот поддеревьев
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
  };

  const layoutSubtree = (nodes, rootId, startX, startY) => {
    const layouted = [...nodes];
    const spacingY = 100;
    const spacingX = 200;

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
  };

  const addChildNode = useCallback((parentId) => {
    setNodes((prevNodes) => {
      const parent = prevNodes.find((n) => n.id === parentId);
      if (!parent) return prevNodes;

      const newId = (Math.max(0, ...prevNodes.map((n) => +n.id)) + 1).toString();

      const newNode = {
        id: newId,
        type: 'editable',
        data: { label: `Нода ${newId}` },
        position: { x: 0, y: 0 }, // будет пересчитано
        parentId,
        level: parent.level + 1,
        subtreeHeight: 1,
      };

      const newNodes = [...prevNodes, newNode];

      updateSubtreeHeights(newNodes, '1'); // предполагаем, что '1' — корень
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

  const nodeTypes = useMemo(() => {
    return {
      editable: (props) => <EditableNode {...props} addChildNode={addChildNode} />,
    };
  }, [addChildNode]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        fitView
      >
        <Background />
      </ReactFlow>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('mindmap'));
root.render(<MindMap />);
