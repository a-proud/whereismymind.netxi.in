import './styles/app.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { MindMap } from './components/MindMap';

const root = ReactDOM.createRoot(document.getElementById('mindmap'));
root.render(<MindMap />);
