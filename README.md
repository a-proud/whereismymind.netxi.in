# 🧠 whereismymind

AI-driven mind map for project decomposition and idea generation.  
Define your goal — get clarifying questions, build structure, fill in content.

## 🚀 How It Works

1. Enter your main idea in the first node.
2. AI asks follow-up questions and suggests possible answers.
3. Your answers form a context used in child nodes.
4. Each node can be:
   - ✂️ "Split" (AI suggests branches)
   - 📝 "Filled" (via AI or manually)
5. Everything is stored in JSON for now, MongoDB later.

## 🛠 Tech Stack

- Symfony 6 (backend)
- React 19 + React Flow (frontend)
- Webpack Encore
- Cohere API
- JSON (temporary DB)

## 🚧 Roadmap

- [x] Basic node/edge rendering from JSON
- [ ] Mindmap import/export
- [ ] AI follow-up questions on root node
- [ ] Context propagation to child nodes
- [ ] "Split" button → AI-generated branches
- [ ] Text generation via prompt
- [ ] Manual text editing
- [ ] Save map to JSON (Mongo later)

## 📦 Setup

```bash
git clone https://github.com/a-proud/whereismymind.netxi.in .
cd whereismymind.netxi.in

composer install
npm install
npm run dev

---
File structure:
Frontend
/assets
    /components       — Reusable React components
        EditableNode.jsx — Editable node component (input, buttons)
        MindMap.jsx      — Mind map component (renders nodes/edges)
    /hooks            — Custom React hooks
        useMindMapLogic.js — Tree logic: add, remove, layout
    /utils            — Utility functions
        layout.js         — Node positioning calculations
        treeHelpers.js    — Tree operations (height, removal, etc.)
    /styles           — Project styles
        app.css           — Styles for nodes and UI
    app.js            — Entry point: renders `MindMap`, imports styles