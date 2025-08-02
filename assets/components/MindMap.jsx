import React, { useMemo, useState, useRef } from 'react';
import ReactFlow, { Background } from 'react-flow-renderer';

import { EditableNode } from './EditableNode';
import { useMindMapLogic } from '../hooks/useMindMapLogic';

export function MindMap() {
  const {
    nodes,
    setNodes,
    edges,
    onNodesChange,
    addChildNode,
    removeNode,
  } = useMindMapLogic();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalLabel, setModalLabel] = useState('');
  const [modalContext, setModalContext] = useState('');
  const [modalBody, setModalBody] = useState('');
  const [activeNodeId, setActiveNodeId] = useState(null);





  const handleModalInput = (setter) => (e) => {
    setter(e.target.value);
  };

  const openModal = (data, nodeId) => {
    setModalLabel(data.label || '');
    setModalContext(data.context || '');
    setModalBody(data.body || '');
    setActiveNodeId(nodeId);
    setModalVisible(true);
  };

  const handleModalSave = () => {
    if (!activeNodeId) return;

    setNodes((prev) =>
      prev.map((node) =>
        node.id === activeNodeId
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                label: modalLabel,
                context: modalContext,
                body: modalBody
              } 
            }
          : node
      )
    );

    setModalVisible(false);
    setActiveNodeId(null);
    setModalLabel('');
    setModalContext('');
    setModalBody('');
  };

  const nodeTypes = useMemo(
    () => ({
      editable: (props) => (
        <EditableNode
          {...props}
          addChildNode={addChildNode}
          removeNode={removeNode}
          onEditClick={openModal}
        />
      ),
    }),
    [addChildNode, removeNode]
  );

  return (
    <>
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

      {modalVisible && (
        <div
          className="modal fade show"
          id="globalEditModal"
          style={{ display: 'block' }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalVisible(false)}
                ></button>
              </div>
                              <div className="modal-body">
                  <div className="node-data">
                    <textarea
                      className="body"
                      value={modalBody}
                      onChange={handleModalInput(setModalBody)}
                      rows={4}
                      placeholder="Detailed information..."
                      autoFocus
                    />
                    <textarea
                      className="context"
                      value={modalContext}
                      onChange={handleModalInput(setModalContext)}
                      rows={2}
                      placeholder="Context..."
                    />
                    <textarea
                      className="label"
                      value={modalLabel}
                      onChange={handleModalInput(setModalLabel)}
                      rows={1}
                      placeholder="Label..."
                    />
                  </div>
                </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalVisible(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleModalSave}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalVisible && <div className="modal-backdrop fade show"></div>}
    </>
  );
}
