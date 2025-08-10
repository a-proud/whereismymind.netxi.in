export const api = {
    /**
     * Saves node data to server
     * @param {Object} nodeData - node data
     * @returns {Promise<Object>} - server response
     */
    async saveNode(nodeData) {
        try {
            const response = await fetch('/api/nodes/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(nodeData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving node:', error);
            throw error;
        }
    },

    /**
     * Gets available AI providers
     * @returns {Promise<Array<string>>} - list of provider names
     */
    async getAIProviders() {
        try {
            const response = await fetch('/api/nodes/ai-providers', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data?.providers || [];
        } catch (error) {
            console.error('Error getting AI providers:', error);
            throw error;
        }
    },

    /**
     * Gets full context of node including parents with priorities
     * @param {Array} nodes - array of all nodes
     * @param {string} nodeId - node ID
     * @returns {Array<{context: string, priority: number}>} - context with priorities
     */
    getFullContext(nodes, nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return [];
        
        const contexts = [];
        let current = node;
        let priority = 10; // Current node has highest priority
        
        // Add current node context
        if (current.data.context && current.data.context.trim()) {
            contexts.push({
                context: current.data.context.trim(),
                priority: priority
            });
        }
        
        // Add parent contexts with decreasing priority
        while (current.parentId) {
            const parent = nodes.find(n => n.id === current.parentId);
            if (parent) {
                priority -= 2; // Each level up reduces priority by 2
                if (parent.data.context && parent.data.context.trim()) {
                    contexts.push({
                        context: parent.data.context.trim(),
                        priority: priority
                    });
                }
                current = parent;
            } else {
                break;
            }
        }
        
        return contexts;
    },

    /**
     * Sends AI request for node with cascading context
     * @param {string} body - detailed information text from the node
     * @param {Array} nodes - full nodes array from React Flow state
     * @param {string} nodeId - node ID
     * @param {string} responseType - 'text' | 'simple_qna'
     * @param {string} provider - AI provider name (optional)
     * @returns {Promise<Object>} - AI response
     */
    async aiRequest(body, nodes, nodeId, responseType = 'text', provider = null) {
        try {
            const contexts = this.getFullContext(nodes, nodeId);
            const response = await fetch('/api/nodes/ai-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    body: body,
                    contexts: contexts,
                    node_id: nodeId,
                    response_type: responseType,
                    provider_name: provider
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error making AI request:', error);
            throw error;
        }
    },

    /**
     * Extract theses with summaries using AI from raw body
     * @param {string} body
     * @param {Array} nodes
     * @param {string} nodeId
     * @param {string} provider - AI provider name (optional)
     * @returns {Promise<{theses: Array, label: string}>}
     */
    async aiThesisExtract(body, nodes, nodeId, provider = null) {
        try {
            const contexts = this.getFullContext(nodes, nodeId);
            const response = await fetch('/api/nodes/ai-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    body: body,
                    contexts: contexts,
                    node_id: nodeId,
                    response_type: 'thesis_extract',
                    provider_name: provider
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                theses: data?.theses || [],
                label: (data && data.meta && typeof data.meta.label === 'string') ? data.meta.label : ''
            };
        } catch (error) {
            console.error('Error making thesis extract AI request:', error);
            throw error;
        }
    }
}; 