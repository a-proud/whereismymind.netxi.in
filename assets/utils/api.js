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
    }
}; 