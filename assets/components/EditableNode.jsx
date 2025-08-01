import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { api } from '../utils/api';

export function EditableNode({ id, data, addChildNode, removeNode, onEditClick }) {
  const [label, setLabel] = useState(data.label || '');
  const [context, setContext] = useState(data.context || '');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setLabel(data.label || '');
    setContext(data.context || '');
  }, [data.label, data.context]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const nodeData = {
        id,
        label,
        context,
        timestamp: new Date().toISOString()
      };
      
      const result = await api.saveNode(nodeData);
      console.log('Node saved successfully:', result);
      
      // Можно добавить уведомление об успешном сохранении
      alert('Нода успешно сохранена!');
    } catch (error) {
      console.error('Failed to save node:', error);
      alert('Ошибка при сохранении ноды!');
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
        <div
          className="label"
          contentEditable={true}
          dangerouslySetInnerHTML={{ __html: label }}
          onInput={(e) => setLabel(e.currentTarget.innerHTML)}
          placeholder="Основной текст..."
        />
        <div
          className="context"
          contentEditable={true}
          dangerouslySetInnerHTML={{ __html: context }}
          onInput={(e) => setContext(e.currentTarget.innerHTML)}
          placeholder="Контекст..."
        />
      </div>
      <div className="editable-node__buttons">
        <button
          className="editable-node__btn editable-node__btn--edit"
          onClick={() => onEditClick({ label, context }, id)}
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
