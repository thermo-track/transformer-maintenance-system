// services/inspectionService.js
const API_BASE_URL = 'http://localhost:8080/api/inspections';

class InspectionService {
  async getAllInspections() {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error('Error fetching inspections:', error);
      throw error;
    }
  }

  async getInspectionById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching inspection:', error);
      throw error;
    }
  }
  async getInspectionsByTransformer(transformerNo) {
    try {
      console.log("Fetching inspections for transformer ID:", transformerNo);
      const response = await fetch(`${API_BASE_URL}/transformer/${transformerNo}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Error response from backend:", errorData);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Response data from backend:", responseData);
      return responseData;
    } catch (error) {
      console.error('Error fetching inspections for transformer:', error);
      throw error;
    }
  }

async createInspection(inspectionData) {
  try {
    // Log the data being sent
    console.log("Sending inspection data to backend:", inspectionData);

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inspectionData)
    });

    // Log the raw response status
    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Error response from backend:", errorData);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    
    // Log the response data
    console.log("Response data from backend:", responseData);

    return responseData;
  } catch (error) {
    console.error('Error creating inspection:', error);
    throw error;
  }
}


  async updateInspection(id, inspectionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inspectionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating inspection:', error);
      throw error;
    }
  }

  async deleteInspection(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting inspection:', error);
      throw error;
    }
  }

  async getInspectionsByBranch(branch) {
    try {
      const response = await fetch(`${API_BASE_URL}/branch/${encodeURIComponent(branch)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error('Error fetching inspections by branch:', error);
      throw error;
    }
  }

  async getInspectionsByDateRange(startDate, endDate) {
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      });
      
      const response = await fetch(`${API_BASE_URL}/date-range?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error('Error fetching inspections by date range:', error);
      throw error;
    }
  }
// Image-related methods
async uploadInspectionImage(inspectionId, imageFile, environmentalCondition) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Create a Blob with the correct content type for JSON
    const jsonBlob = new Blob([JSON.stringify({
      environmentalCondition: environmentalCondition
    })], { type: 'application/json' });
    
    formData.append('data', jsonBlob);

    console.log("Uploading image for inspection ID:", inspectionId);
    
    const response = await fetch(`${API_BASE_URL}/${inspectionId}/image`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary for multipart
    });

    console.log("Image upload response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image upload error response:", errorText);
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("Image upload response data:", responseData);
    return responseData;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

  async getInspectionImage(inspectionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/${inspectionId}/image`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error fetching image:', error);
      throw error;
    }
  }

  async deleteInspectionImage(inspectionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/${inspectionId}/image`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
  async checkIfInspectionHasImage(inspectionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/${inspectionId}/has-image`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking image:', error);
      return false;
    }
  }

  async getEnvironmentalConditions() {
    try {
      const response = await fetch(`${API_BASE_URL}/environmental-conditions`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching environmental conditions:', error);
      // Return default conditions if API fails
      return ['SUNNY', 'CLOUDY', 'RAINY'];
    }
  }

  async getInspectionsByEnvironmentalCondition(condition) {
    try {
      const response = await fetch(`${API_BASE_URL}/by-condition/${condition}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching inspections by condition:', error);
      throw error;
    }
  }
  


}
  
export const inspectionService = new InspectionService();