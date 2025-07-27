import './styles/app.css';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import ReactFlow, { Handle, Position, Background, applyNodeChanges } from 'react-flow-renderer';

function EditableNode({ data }) {
  const [label, setLabel] = useState(data.label);

  return (
    <div style={{ padding: 10, border: '1px solid #555', borderRadius: 5, background: '#fff' }}>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        style={{ width: '100%', border: 'none', outline: 'none' }}
      />
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

const nodeTypes = {
  editable: EditableNode,
};

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

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
];

function MindMap() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  function onNodesChange(changes) {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }

  // Добавляем новую ноду рядом с указанной по id
  function addNodeNextTo(id) {
    setNodes((nds) => {
      const node = nds.find(n => n.id === id);
      if (!node) return nds;

      // Считаем новый id
      const newId = (nds.length + 1).toString();

      // Новая позиция справа на 150px от выбранной ноды
      const newPosition = { x: node.position.x + 150, y: node.position.y };

      const newNode = {
        id: newId,
        type: 'editable',
        data: { label: `Блок ${newId}` },
        position: newPosition,
      };

      return [...nds, newNode];
    });
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <button onClick={() => addNodeNextTo('1')} style={{ marginBottom: 10 }}>
        Добавить ноду рядом с Блок 1
      </button>
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
