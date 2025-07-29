import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'react-flow-renderer';

export function EditableNode({ id, data, addChildNode, removeNode, onEditClick }) {
  const [label, setLabel] = useState(data.label);
  const textareaRef = useRef(null);

  useEffect(() => {
    setLabel(data.label);
  }, [data.label]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const stopDragging = (e) => e.stopPropagation();
    textarea.addEventListener('mousedown', stopDragging, true);

    return () => {
      textarea.removeEventListener('mousedown', stopDragging, true);
    };
  }, []);

  return (
    <div className="editable-node">
      <textarea
        ref={textareaRef}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="node-textarea"
        rows={3}
        placeholder="Insert text here..."
      />
      <div className="editable-node__buttons">
        <button
          className="editable-node__btn editable-node__btn--edit"
          onClick={() => onEditClick(label, id)}
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
