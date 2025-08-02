import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { api } from '../utils/api';

export function EditableNode({ id, data, addChildNode, removeNode, onEditClick }) {
  const [label, setLabel] = useState(data.label || '');
  const [context, setContext] = useState(data.context || '');
  const [body, setBody] = useState(data.body || '');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setLabel(data.label || '');
    setContext(data.context || '');
    setBody(data.body || '');
  }, [data.label, data.context, data.body]);



  const handleInput = (setter) => (e) => {
    setter(e.target.value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const nodeData = {
        id,
        label,
        context,
        body,
        timestamp: new Date().toISOString()
      };
      
      const result = await api.saveNode(nodeData);
      console.log('Node saved successfully:', result);
      
      // Can add notification for successful save
      alert('Node saved successfully!');
    } catch (error) {
      console.error('Failed to save node:', error);
      alert('Error saving node!');
    } finally {
      setIsSaving(false);
    }
  };



  useEffect(() => {
    const editableDiv = textareaRef.current;
    if (!editableDiv) return;
    const stopDragging = (e) => e.stopPropagation();
    editableDiv.addEventListener('mousedown', stopDragging, true);

    return () => {
      editableDiv.removeEventListener('mousedown', stopDragging, true);
    };
  }, []);

  return (
    <div className="editable-node">
                  <div ref={textareaRef} className="node-data">
        <textarea
          className="label"
          value={label}
          onChange={handleInput(setLabel)}
          rows={2}
          placeholder="Label..."
        />
        <textarea
          className="context"
          value={context}
          onChange={handleInput(setContext)}
          rows={1}
          placeholder="Context..."
        />
      </div>
      <div className="editable-node__buttons">
        <button
          className="editable-node__btn editable-node__btn--edit"
          onClick={() => onEditClick({ label, context, body }, id)}
        >
          ✏️
        </button>
        <button
          className="editable-node__btn editable-node__btn--save"
          onClick={handleSave}
          disabled={isSaving}
          title="Save node"
        >
          {isSaving ? '⏳' : '💾'}
        </button>
        <button
          className="editable-node__btn"
          onClick={() => addChildNode(id)}
          title="Add child node"
        >
          ➕
        </button>
        {!data.isRoot && (
          <button
            className="editable-node__btn editable-node__btn--remove"
            onClick={() => removeNode(id)}
            title="Remove node"
          >
            ❌
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
