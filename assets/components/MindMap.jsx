import React, { useMemo, useState } from 'react';
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
  const [activeNodeId, setActiveNodeId] = useState(null);

  const openModal = (data, nodeId) => {
    setModalLabel(data.label || '');
    setModalContext(data.context || '');
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
                context: modalContext
              } 
            }
          : node
      )
    );

    setModalVisible(false);
    setActiveNodeId(null);
    setModalLabel('');
    setModalContext('');
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
                <h5 className="modal-title">Редактировать</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalVisible(false)}
                ></button>
              </div>
                              <div className="modal-body">
                  <div className="node-data">
                    <div
                      className="label"
                      contentEditable={true}
                      dangerouslySetInnerHTML={{ __html: modalLabel }}
                      onInput={(e) => setModalLabel(e.currentTarget.innerHTML)}
                      placeholder="Основной текст..."
                      autoFocus
                    />
                    <div
                      className="context"
                      contentEditable={true}
                      dangerouslySetInnerHTML={{ __html: modalContext }}
                      onInput={(e) => setModalContext(e.currentTarget.innerHTML)}
                      placeholder="Контекст..."
                    />
                  </div>
                </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalVisible(false)}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleModalSave}
                >
                  Сохранить
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
