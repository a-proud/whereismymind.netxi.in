export const api = {
    /**
     * Сохраняет данные ноды на сервер
     * @param {Object} nodeData - данные ноды
     * @returns {Promise<Object>} - ответ сервера
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
     * Получает полный контекст ноды включая родителей
     * @param {Array} nodes - массив всех нод
     * @param {string} nodeId - ID ноды
     * @returns {string} - полный контекст
     */
    getFullContext(nodes, nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return '';
        
        let context = node.data.context || '';
        let parentId = node.parentId;
        
        // Добавляем контекст всех родителей
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