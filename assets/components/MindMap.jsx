import React, { useMemo, useState, useRef, useCallback } from 'react';
import ReactFlow, { Background } from 'react-flow-renderer';

import { EditableNode } from './EditableNode';
import { useMindMapLogic } from '../hooks/useMindMapLogic';
import { api } from '../utils/api';

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

  // AI state
  const [aiQuestions, setAiQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);





  const handleModalInput = (setter) => (e) => {
    setter(e.target.value);
  };

  const openModal = useCallback((data, nodeId) => {
    setModalLabel(data.label || '');
    setModalContext(data.context || '');
    setModalBody(data.body || '');
    setActiveNodeId(nodeId);
    setModalVisible(true);
  }, []);

  const handleAiRequest = useCallback(async (responseType) => {
    if (!activeNodeId) return;
    setIsAiLoading(true);
    try {
      const result = await api.aiRequest(modalBody, modalContext, activeNodeId, responseType);
      setAiQuestions(result.questions);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('Failed to get AI response:', error);
    } finally {
      setIsAiLoading(false);
    }
  }, [activeNodeId, modalBody, modalContext]);

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
    [addChildNode, removeNode, openModal]
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
                                  {/* AI Section */}
                {aiQuestions.length > 0 && currentQuestionIndex < aiQuestions.length && (
                  <div className="ai-section">
                    <div className="ai-progress">
                      <span>Question {currentQuestionIndex + 1} of {aiQuestions.length}</span>
                    </div>
                    <div className="ai-question">
                      <h6>AI Question:</h6>
                      <p>{aiQuestions[currentQuestionIndex].question}</p>
                    </div>
                    <div className="ai-options">
                      <h6>Options:</h6>
                      <div className="ai-options-grid">
                        {aiQuestions[currentQuestionIndex].options.map((option, index) => (
                          <button
                            key={index}
                            className="btn btn-outline-primary ai-option-btn"
                            onClick={() => {
                              console.log('Selected option:', option);
                              
                              if (option === 'Next ->') {
                                const nextIndex = currentQuestionIndex + 1;
                                if (nextIndex < aiQuestions.length) {
                                  setCurrentQuestionIndex(nextIndex);
                                } else {
                                  setAiQuestions([]);
                                  setCurrentQuestionIndex(0);
                                }
                              } else {
                                setModalBody(prev => prev + '\n\n' + option);
                              }
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                  
                  {/* Node Data Section */}
                  <div className="node-data">
                    <div className="body-section">
                      <div className="body-header">
                        <label>Detailed Information</label>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleAiRequest('simple_qna')}
                          disabled={isAiLoading}
                          title="Ask AI"
                        >
                          {isAiLoading ? '⏳' : '❓'} Ask AI
                        </button>
                      </div>
                      <textarea
                        className="body"
                        value={modalBody}
                        onChange={handleModalInput(setModalBody)}
                        rows={4}
                        placeholder="Detailed information..."
                        autoFocus
                      />
                    </div>
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
