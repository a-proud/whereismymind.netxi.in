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

  // Helpers for thesis handling
  const hashString = (s) => {
    let hash = 5381;
    for (let i = 0; i < s.length; i += 1) {
      hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  };

  const stopwords = new Set([
    // RU stopwords (subset)
    'и','в','во','не','что','он','на','я','с','со','как','а','то','все','она','так','его','но','да','ты','к','у','же','вы','за','бы','по','только','ее','мне','было','вот','от','меня','еще','нет','о','из','ему','теперь','когда','даже','ну','вдруг','ли','если','уже','или','ни','быть','был','него','до','вас','нибудь','опять','уж','вам','ведь','там','потом','себя','ничего','ей','может','они','тут','где','есть','надо','ней','для','мы','тебя','их','чем','была','сам','чтоб','без','будто','чего','раз','тоже','себе','под','будет','ж','тогда','кто','этот','того','потому','этого','какой','совсем','ним','здесь','этом','один','почти','мой','тем','чтобы','нее','сейчас','были','куда','зачем','всех','никогда','можно','при','наконец','два','об','другой','хоть','после','над','больше','тот','через','эти','нас','про','всего','них','какая','много','разве','три','эту','моя','впрочем','хорошо','свою','этой','перед','иногда','лучше','чуть','том','нельзя','такой','им','более','всегда','конечно','всю','между',
    // EN stopwords (subset)
    'the','a','an','and','or','but','if','then','else','this','that','these','those','of','to','in','on','for','with','as','by','from','at','is','are','was','were','be','been','being','it','its','into','about','over','after','before','up','down','out','not','no','yes','do','did','does','done','can','could','should','would','will','may','might','we','you','they','he','she','i','me','my','our','your','their'
  ]);

  const summarizeText = (text, maxWords = 7) => {
    const cleaned = (text || '')
      .replace(/\s+/g, ' ')
      .replace(/["'`()\[\]{}<>]/g, '')
      .trim();
    const firstClause = cleaned.split(/[.!?;\n]/)[0] || '';
    const tokens = firstClause.split(/\s+/).filter(Boolean);
    const meaningful = tokens.filter((t) => t.length > 2 && !stopwords.has(t.toLowerCase()));
    const picked = (meaningful.length ? meaningful : tokens).slice(0, Math.max(3, Math.min(maxWords, 8)));
    return picked.join(' ').trim();
  };

  const extractExistingBracketed = (body) => {
    const segments = [];
    const re = /\[\[(.*?)\]\]/gs;
    let match;
    while ((match = re.exec(body)) !== null) {
      segments.push((match[1] || '').trim());
    }
    return segments;
  };
  const buildBracketedBody = (segments) => segments.map((s) => `[[${s}]]`).join('\n\n');

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
      const result = await api.aiRequest(modalBody, nodes, activeNodeId, responseType);
      setAiQuestions(result.questions);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('Failed to get AI response:', error);
    } finally {
      setIsAiLoading(false);
    }
  }, [activeNodeId, modalBody, nodes]);

  const handleModalSave = () => {
    if (!activeNodeId) return;

    (async () => {
      const currentNode = nodes.find((n) => n.id === activeNodeId);
      const prevTheses = (currentNode && currentNode.data && currentNode.data.theses) || [];
      const prevByKey = new Map(prevTheses.map((t) => [t.key, t]));

      const existingBracketed = extractExistingBracketed(modalBody);
      let extracted = { theses: [], label: '' };
      try {
        // AI-based logical segmentation with summaries
        extracted = await api.aiThesisExtract(modalBody, nodes, activeNodeId);
      } catch (e) {
        extracted = { theses: [], label: '' };
      }

      // If AI returned nothing, fallback to existing bracketed or whole body
      const segments = (extracted.theses.length > 0 ? extracted.theses.map((x) => x.text) : (existingBracketed.length > 0 ? existingBracketed : [(modalBody || '').trim()])).filter(Boolean);

      const newTheses = segments.map((seg, idx) => {
        const key = hashString(seg);
        const existing = prevByKey.get(key);
        const aiSummary = extracted.theses[idx]?.summary || extracted.theses.find((x) => x.text === seg)?.summary || '';
        return existing && existing.text === seg
          ? existing
          : { key, text: seg, thesis: (aiSummary || summarizeText(seg)) };
      });

      const nextContext = newTheses
        .map((t) => (t.thesis || '').trim())
        .filter(Boolean)
        .join('; ');

      const nextBody = buildBracketedBody(segments);

      let nextLabel = (modalLabel || currentNode?.data?.label || '').trim();
      if (!nextLabel && typeof extracted.label === 'string' && extracted.label.trim()) {
        nextLabel = extracted.label.trim();
      }

      setNodes((prev) =>
        prev.map((node) =>
          node.id === activeNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: nextLabel,
                  context: nextContext,
                  body: nextBody,
                  theses: newTheses,
                },
              }
            : node
        )
      );
    })();

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
