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

function EditableNode({ id, data, addNodeNextTo }) {
  const [label, setLabel] = useState(data.label);

  return (
    <div
      style={{
        padding: 10,
        border: '1px solid #555',
        borderRadius: 5,
        background: '#fff',
        position: 'relative',
      }}
    >
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        style={{ width: '100%', border: 'none', outline: 'none' }}
      />
      <button
        onClick={() => addNodeNextTo(id)}
        title="Добавить ноду справа"
        style={{
          position: 'absolute',
          top: 5,
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
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

const initialNodes = [
  {
    id: '1',
    type: 'editable',
    data: { label: 'Блок 1' },
    position: { x: 100, y: 100 },
  },
  {
    id: '2',
    type: 'editable',
    data: { label: 'Блок 2' },
    position: { x: 300, y: 100 },
  },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

function MindMap() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  const addNodeNextTo = useCallback(
    (id) => {
      setNodes((nds) => {
        const node = nds.find((n) => n.id === id);
        if (!node) return nds;

        const maxId = nds.reduce((max, n) => Math.max(max, Number(n.id)), 0);
        const newId = (maxId + 1).toString();

        const newPosition = { x: node.position.x + 150, y: node.position.y };

        const newNode = {
          id: newId,
          type: 'editable',
          data: { label: `Блок ${newId}` },
          position: newPosition,
        };

        // Добавляем ребро от родителя к новой ноде
        setEdges((eds) => [
          ...eds,
          { id: `e${id}-${newId}`, source: id, target: newId },
        ]);

        return [...nds, newNode];
      });
    },
    [setNodes, setEdges]
  );

  // Мемозируем nodeTypes, чтобы не создавать объект каждый рендер
  const nodeTypes = useMemo(() => {
    return {
      editable: (props) => <EditableNode {...props} addNodeNextTo={addNodeNextTo} />,
    };
  }, [addNodeNextTo]);

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
