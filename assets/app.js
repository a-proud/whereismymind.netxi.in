/*
 * Welcome to your app's main JavaScript file!
 *
 * We recommend including the built version of this JavaScript file
 * (and its CSS file) in your base layout (base.html.twig).
 */

// any CSS you import will output into a single css file (app.css in this case)
import './styles/app.css';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';


import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactFlow from 'react-flow-renderer';

const nodes = [
  {
    id: '1',
    data: { label: 'Блок 1' },
    position: { x: 100, y: 100 },
  },
  {
    id: '2',
    data: { label: 'Блок 2' },
    position: { x: 300, y: 100 },
  },
];

const edges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
  },
];

function MindMap() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow nodes={nodes} edges={edges} />
    </div>
  );
}

// монтируем React в div#mindmap из Twig
const root = ReactDOM.createRoot(document.getElementById('mindmap'));
root.render(<MindMap />);
