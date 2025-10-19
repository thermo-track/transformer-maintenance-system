// services/AnomalyNoteService.js
import authFetch from '../../../lib/authFetch.js';

class AnomalyNoteService {
  constructor() {
    const env = import.meta.env;
    this.backendApiUrl = env.VITE_BACKEND_API_URL || 'http://localhost:8080/api';
  }

  /**
   * Get all notes for a specific anomaly
   */
  async getAnomalyNotes(inspectionId, anomalyId) {
    try {
      const response = await authFetch(
        `${this.backendApiUrl}/inspections/${inspectionId}/anomalies/${anomalyId}/notes`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to get notes: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching anomaly notes:', error);
      return { notes: [], count: 0 };
    }
  }

  /**
   * Add a new note to an anomaly
   */
  async addAnomalyNote(inspectionId, anomalyId, noteText, createdBy = 'System User') {
    try {
      const response = await authFetch(
        `${this.backendApiUrl}/inspections/${inspectionId}/anomalies/${anomalyId}/notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            note: noteText,
            createdBy: createdBy
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to add note: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding anomaly note:', error);
      throw error;
    }
  }

  /**
   * Update an existing note
   */
  async updateAnomalyNote(inspectionId, anomalyId, noteId, noteText) {
    try {
      const response = await authFetch(
        `${this.backendApiUrl}/inspections/${inspectionId}/anomalies/${anomalyId}/notes/${noteId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            note: noteText
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update note: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating anomaly note:', error);
      throw error;
    }
  }

  /**
   * Delete a note
   */
  async deleteAnomalyNote(inspectionId, anomalyId, noteId) {
    try {
      const response = await authFetch(
        `${this.backendApiUrl}/inspections/${inspectionId}/anomalies/${anomalyId}/notes/${noteId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete note: ${response.status}`);
      }

      // DELETE might return empty response
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    } catch (error) {
      console.error('Error deleting anomaly note:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const anomalyNoteService = new AnomalyNoteService();
export default anomalyNoteService;