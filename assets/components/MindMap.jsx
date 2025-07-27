import React, { useMemo } from 'react';
import ReactFlow, { Background } from 'react-flow-renderer';

import { useMindMapLogic } from '../hooks/useMindMapLogic';
import { EditableNode } from './EditableNode';

export function MindMap() {
  const {
    nodes,
    edges,
    onNodesChange,
    addChildNode,
    removeNode,
  } = useMindMapLogic();

  const nodeTypes = useMemo(() => ({
    editable: (props) => (
      <EditableNode
        {...props}
        addChildNode={addChildNode}
        removeNode={removeNode}
      />
    ),
  }), [addChildNode, removeNode]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        defaultEdgeOptions={{ type: 'step' }}
        fitView
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
