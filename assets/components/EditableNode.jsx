import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'react-flow-renderer';

export function EditableNode({ id, data, addChildNode, removeNode, onEditClick }) {
  const [label, setLabel] = useState(data.label || '');
  const [context, setContext] = useState(data.context || '');
  const [body, setBody] = useState(data.body || '');

  const textareaRef = useRef(null);

  useEffect(() => {
    setLabel(data.label || '');
    setContext(data.context || '');
    setBody(data.body || '');
  }, [data.label, data.context, data.body]);



  const handleInput = (setter) => (e) => {
    setter(e.target.value);
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
