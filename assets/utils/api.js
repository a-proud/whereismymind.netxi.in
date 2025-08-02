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
     * Gets full context of node including parents
     * @param {Array} nodes - array of all nodes
     * @param {string} nodeId - node ID
     * @returns {string} - full context
     */
    getFullContext(nodes, nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return '';
        
        let context = node.data.context || '';
        let parentId = node.parentId;
        
        // Add context of all parents
        while (parentId) {
            const parent = nodes.find(n => n.id === parentId);
            if (parent) {
                context = (parent.data.context || '') + ' > ' + context;
                parentId = parent.parentId;
            } else {
                break;
            }
        }
        
        return context;
    },

    /**
     * Sends AI request for node
     * @param {string} nodeId - node ID
     * @param {string} responseType - 'text' or 'options'
     * @returns {Promise<Object>} - AI response
     */
    async aiRequest(nodeId, responseType = 'options') {
        try {
            const response = await fetch('/api/nodes/ai-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    node_id: nodeId,
                    response_type: responseType
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
    }
}; 