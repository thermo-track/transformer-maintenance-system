import apiClient from '../config/api';

/**
 * Service for annotation feedback operations
 */
class AnnotationService {
    
    /**
     * Get all annotations for an inspection
     * @param {number} inspectionId 
     * @returns {Promise} - Returns { aiDetections, userAnnotations, inactiveDetections }
     */
    async getAnnotations(inspectionId) {
        console.log([AnnotationService] Fetching annotations for inspection: ${inspectionId});
        try {
            const response = await apiClient.get('/api/annotations', {
                params: { inspectionId }
            });
            console.log([AnnotationService] Annotations fetched:, response.data);
            return response.data;
        } catch (error) {
            console.error('[AnnotationService] Error fetching annotations:', error);
            throw error;
        }
    }

    /**
     * Create a new user annotation
     * @param {Object} annotationData 
     * @returns {Promise}
     */
    async createAnnotation(annotationData) {
        console.log('[AnnotationService] Creating annotation:', annotationData);
        try {
            const response = await apiClient.post('/api/annotations', {
                ...annotationData,
                action: 'CREATED'
            });
            console.log('[AnnotationService] Annotation created:', response.data);
            return response.data;
        } catch (error) {
            console.error('[AnnotationService] Error creating annotation:', error);
            throw error;
        }
    }

    /**
     * Edit an existing annotation
     * @param {number} anomalyId 
     * @param {Object} editData 
     * @returns {Promise}
     */
    async editAnnotation(anomalyId, editData) {
        console.log([AnnotationService] Editing annotation ${anomalyId}:, editData);
        try {
            const response = await apiClient.post('/api/annotations', {
                ...editData,
                anomalyId,
                action: 'EDITED'
            });
            console.log('[AnnotationService] Annotation edited:', response.data);
            return response.data;
        } catch (error) {
            console.error('[AnnotationService] Error editing annotation:', error);
            throw error;
        }
    }

    /**
     * Delete an annotation (soft delete)
     * @param {number} anomalyId 
     * @param {number} inspectionId 
     * @param {string} comment 
     * @param {number} userId 
     * @returns {Promise}
     */
    async deleteAnnotation(anomalyId, inspectionId, comment, userId) {
        console.log([AnnotationService] Deleting annotation ${anomalyId});
        try {
            const response = await apiClient.post('/api/annotations', {
                anomalyId,
                inspectionId,
                comment,
                userId,
                action: 'DELETED'
            });
            console.log('[AnnotationService] Annotation deleted:', response.data);
            return response.data;
        } catch (error) {
            console.error('[AnnotationService] Error deleting annotation:', error);
            throw error;
        }
    }

    /**
     * Add comment to an annotation
     * @param {number} anomalyId 
     * @param {number} inspectionId 
     * @param {string} comment 
     * @param {number} userId 
     * @returns {Promise}
     */
    async addComment(anomalyId, inspectionId, comment, userId) {
        console.log([AnnotationService] Adding comment to annotation ${anomalyId});
        try {
            const response = await apiClient.post('/api/annotations', {
                anomalyId,
                inspectionId,
                comment,
                userId,
                action: 'COMMENTED'
            });
            console.log('[AnnotationService] Comment added:', response.data);
            return response.data;
        } catch (error) {
            console.error('[AnnotationService] Error adding comment:', error);
            throw error;
        }
    }

    /**
     * Accept an AI detection
     * @param {number} anomalyId 
     * @param {number} inspectionId 
     * @param {number} userId 
     * @returns {Promise}
     */
    async acceptAiDetection(anomalyId, inspectionId, userId) {
        console.log([AnnotationService] Accepting AI detection ${anomalyId});
        try {
            const response = await apiClient.post('/api/annotations', {
                anomalyId,
                inspectionId,
                userId,
                action: 'APPROVED'
            });
            console.log('[AnnotationService] AI detection accepted:', response.data);
            return response.data;
        } catch (error) {
            console.error('[AnnotationService] Error accepting AI detection:', error);
            throw error;
        }
    }

    /**
     * Reject an AI detection
     * @param {number} anomalyId 
     * @param {number} inspectionId 
     * @param {string} reason 
     * @param {number} userId 
     * @returns {Promise}
     */
    async rejectAiDetection(anomalyId, inspectionId, reason, userId) {
        console.log([AnnotationService] Rejecting AI detection ${anomalyId});
        try {
            const response = await apiClient.post('/api/annotations', {
                anomalyId,
                inspectionId,
                comment: reason,
                userId,
                action: 'REJECTED'
            });
            console.log('[AnnotationService] AI detection rejected:', response.data);
            return response.data;
        } catch (error) {
            console.error('[AnnotationService] Error rejecting AI detection:', error);
            throw error;
        }
    }

    /**
     * Get annotation history for a specific anomaly
     * @param {number} anomalyId 
     * @returns {Promise}
     */
    async getAnnotationHistory(anomalyId) {
        console.log([AnnotationService] Fetching history for annotation ${anomalyId});
        try {
            const response = await apiClient.get(/api/annotations/${anomalyId}/history);
            console.log('[AnnotationService] History fetched:', response.data);
            return response.data;
        } catch (error) {
            console.error('[AnnotationService] Error fetching history:', error);
            throw error;
        }
    }

    /**
     * Alias for getAnnotationHistory
     * @param {number} anomalyId 
     * @returns {Promise}
     */
    async getHistory(anomalyId) {
        return this.getAnnotationHistory(anomalyId);
    }

    /**
     * Get all actions for an inspection
     * @param {number} inspectionId 
     * @returns {Promise}
     */
    async getInspectionActions(inspectionId) {
        console.log([AnnotationService] Fetching actions for inspection ${inspectionId});
        try {
            const response = await apiClient.get(/api/annotations/inspection/${inspectionId}/actions);
            console.log('[AnnotationService] Actions fetched:', response.data);
            return response.data;
        } catch (error) {
            console.error('[AnnotationService] Error fetching actions:', error);
            throw error;
        }
    }
}

export default new AnnotationService();