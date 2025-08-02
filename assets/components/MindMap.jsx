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

  // AI modal state
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiOptions, setAiOptions] = useState([]);
  const [aiNodeId, setAiNodeId] = useState(null);





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

  const openAiModal = (question, options, nodeId) => {
    setAiQuestion(question);
    setAiOptions(options);
    setAiNodeId(nodeId);
    setAiModalVisible(true);
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
          onAiRequest={openAiModal}
        />
      ),
    }),
    [addChildNode, removeNode, openAiModal]
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

      {/* AI Modal */}
      {aiModalVisible && (
        <div
          className="modal fade show"
          id="aiModal"
          style={{ display: 'block' }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">AI Assistant</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setAiModalVisible(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="ai-question">
                  <h6>Question:</h6>
                  <p>{aiQuestion}</p>
                </div>
                <div className="ai-options">
                  <h6>Options:</h6>
                  <div className="ai-options-grid">
                    {aiOptions.map((option, index) => (
                      <button
                        key={index}
                        className="btn btn-outline-primary ai-option-btn"
                        onClick={() => {
                          console.log('Selected option:', option);
                          setAiModalVisible(false);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAiModalVisible(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {aiModalVisible && <div className="modal-backdrop fade show"></div>}
    </>
  );
}
