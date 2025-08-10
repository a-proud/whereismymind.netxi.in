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

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // AI provider state
  const [availableProviders, setAvailableProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('groq');

  // AI state (legacy for simple_qna)
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
    'и','в','во','не','что','он','на','я','с','со','как','а','то','все','она','так','его','но','да','ты','к','у','же','вы','за','бы','по','только','ее','мне','было','вот','от','меня','еще','нет','о','из','ему','теперь','когда','даже','ну','вдруг','ли','если','уже','или','ни','быть','был','него','до','вас','нибудь','опять','уж','вам','ведь','там','потом','себя','ничего','ей','может','они','тут','где','есть','надо','ней','для','мы','тебя','их','чем','была','сам','чтоб','без','будет','ж','тогда','кто','этот','того','потому','этого','какой','совсем','ним','здесь','этом','один','почти','мой','тем','чтобы','нее','сейчас','были','куда','зачем','всех','никогда','можно','при','наконец','два','об','другой','хоть','после','над','больше','тот','через','эти','нас','про','всего','них','какая','много','разве','три','эту','моя','впрочем','хорошо','свою','этой','перед','иногда','лучше','чуть','том','нельзя','такой','им','более','всегда','конечно','всю','между',
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

  const openModal = useCallback(async (data, nodeId) => {
    setModalLabel(data.label || '');
    setModalContext(data.context || '');
    setModalBody(data.body || '');
    setActiveNodeId(nodeId);
    setModalVisible(true);
    setChatMessages([]); // Reset chat on modal open
    
    // Fetch available providers
    try {
      const providers = await api.getAIProviders();
      setAvailableProviders(providers);
      if (providers.length > 0 && !providers.includes(selectedProvider)) {
        setSelectedProvider(providers[0]);
      }
    } catch (error) {
      console.error('Failed to fetch AI providers:', error);
      setAvailableProviders(['groq', 'cohere', 'gemini']); // Fallback
    }
  }, [selectedProvider]);

  const handleAiRequest = useCallback(async (responseType) => {
    if (!activeNodeId) return;
    setIsAiLoading(true);
    try {
      const result = await api.aiRequest(modalBody, nodes, activeNodeId, responseType, selectedProvider);
      setAiQuestions(result.questions);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('Failed to get AI response:', error);
    } finally {
      setIsAiLoading(false);
    }
  }, [activeNodeId, modalBody, nodes, selectedProvider]);

  // Chat functionality
  const sendChatMessage = useCallback(async () => {
    if (!chatInput.trim() || !activeNodeId) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsChatLoading(true);
    
    try {
      // Send chat request with context from nodes and current body
      const result = await api.aiRequest(modalBody + '\n\nUser question: ' + userMessage, nodes, activeNodeId, 'text', selectedProvider);
      const aiResponse = result.response || result.text || 'Sorry, I could not generate a response.';
      
      // Add AI response to chat
      setChatMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('Failed to get chat response:', error);
      setChatMessages(prev => [...prev, { type: 'ai', content: 'Sorry, there was an error processing your request.' }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, activeNodeId, modalBody, nodes, selectedProvider]);

  const handleChatKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      sendChatMessage();
    }
  }, [sendChatMessage]);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

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
        extracted = await api.aiThesisExtract(modalBody, nodes, activeNodeId, selectedProvider);
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
    setChatMessages([]);
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
          <div className="modal-dialog modal-xl" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <div className="d-flex align-items-center gap-3">
                  <h5 className="modal-title mb-0">Edit Node</h5>
                  <div className="d-flex align-items-center gap-2">
                    <label className="form-label mb-0 small">AI Provider:</label>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 'auto' }}
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                    >
                      {availableProviders.map((provider) => (
                        <option key={provider} value={provider}>
                          {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalVisible(false)}
                ></button>
              </div>
              <div className="modal-body p-0">
                <div className="row g-0" style={{ height: '70vh' }}>
                  {/* Left side - AI Chat */}
                  <div className="col-6 border-end">
                    <div className="d-flex flex-column h-100">
                      <div className="p-3 border-bottom">
                        <h6 className="mb-0">AI Assistant ({selectedProvider})</h6>
                        <small className="text-muted">Ask questions about your node content</small>
                      </div>
                      
                      {/* Chat messages */}
                      <div className="flex-grow-1 p-3" style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 140px)' }}>
                        {chatMessages.length === 0 && (
                          <div className="text-center text-muted mt-4">
                            <p>Start a conversation with AI about your node content</p>
                          </div>
                        )}
                        
                        {chatMessages.map((message, index) => (
                          <div key={index} className={`mb-3 ${message.type === 'user' ? 'text-end' : ''}`}>
                            <div className={`d-inline-block p-2 rounded ${message.type === 'user' ? 'bg-primary text-white' : 'bg-light'}`} style={{ maxWidth: '80%' }}>
                              {message.content}
                            </div>
                          </div>
                        ))}
                        
                        {isChatLoading && (
                          <div className="mb-3">
                            <div className="d-inline-block p-2 rounded bg-light">
                              <div className="d-flex align-items-center">
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                                AI is thinking...
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={chatEndRef} />
                      </div>
                      
                      {/* Chat input */}
                      <div className="p-3 border-top">
                        <div className="input-group">
                          <textarea
                            className="form-control"
                            placeholder="Ask AI about your content..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={handleChatKeyDown}
                            rows={2}
                            style={{ resize: 'none' }}
                          />
                          <button
                            className="btn btn-primary"
                            onClick={sendChatMessage}
                            disabled={!chatInput.trim() || isChatLoading}
                          >
                            {isChatLoading ? (
                              <span className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </span>
                            ) : (
                              'Send'
                            )}
                          </button>
                        </div>
                        <small className="text-muted">Press Enter to send, Shift+Enter for new line</small>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Node editing */}
                  <div className="col-6">
                    <div className="p-3 h-100 d-flex flex-column">
                      <div className="flex-grow-1">
                        <div className="mb-3">
                          <label className="form-label fw-bold">Label</label>
                          <textarea
                            className="form-control"
                            value={modalLabel}
                            onChange={handleModalInput(setModalLabel)}
                            rows={1}
                            placeholder="Node label..."
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label fw-bold">Context</label>
                          <textarea
                            className="form-control"
                            value={modalContext}
                            onChange={handleModalInput(setModalContext)}
                            rows={2}
                            placeholder="Context..."
                          />
                        </div>
                        
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label fw-bold mb-0">Detailed Information</label>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleAiRequest('simple_qna')}
                              disabled={isAiLoading}
                              title="Ask AI for questions"
                            >
                              {isAiLoading ? '⏳' : '❓'} Get Questions
                            </button>
                          </div>
                          <textarea
                            className="form-control"
                            value={modalBody}
                            onChange={handleModalInput(setModalBody)}
                            rows={8}
                            placeholder="Detailed information about this node..."
                            style={{ resize: 'none' }}
                          />
                        </div>
                        
                        {/* Legacy AI Questions Section */}
                        {aiQuestions.length > 0 && currentQuestionIndex < aiQuestions.length && (
                          <div className="mb-3 p-3 border rounded bg-light">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="badge bg-primary">Question {currentQuestionIndex + 1} of {aiQuestions.length}</span>
                            </div>
                            <h6>AI Question:</h6>
                            <p className="mb-2">{aiQuestions[currentQuestionIndex].question}</p>
                            <div className="d-flex flex-wrap gap-1">
                              {aiQuestions[currentQuestionIndex].options.map((option, index) => (
                                <button
                                  key={index}
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => {
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
                        )}
                      </div>
                    </div>
                  </div>
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
