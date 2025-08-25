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
  /**
 * Get weather condition for a specific inspection
 * @param {string} inspectionId - The inspection ID
 * @returns {Promise<string>} Weather condition
 */
async getInspectionWeatherCondition(inspectionId) {
  try {
    console.log(`Fetching weather condition for inspection: ${inspectionId}`);
    
    const response = await fetch(`${API_BASE_URL}/${inspectionId}/weather-condition`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Weather condition response:', data);
    
    return data.weatherCondition || data.condition || 'sunny'; // Handle different response formats
  } catch (error) {
    console.error('Error fetching weather condition:', error);
    throw error;
  }
}

async getLatestInspectionPerTransformer() {
  try {
    const response = await fetch(`${API_BASE_URL}/latest-per-transformer`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Latest inspections per transformer:', data);
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error fetching latest inspections per transformer:', error);
    throw error;
  }
}  

/**
 * Update inspection status
 * @param {string} inspectionId - The inspection ID
 * @param {string} status - New status (IN_PROGRESS, COMPLETED, PENDING, SCHEDULED)
 * @returns {Promise<Object>} Updated inspection data
 */
async updateInspectionStatus(inspectionId, status) {
  try {
    console.log(`Updating inspection ${inspectionId} status to: ${status}`);
    
    const response = await fetch(`${API_BASE_URL}/${inspectionId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: status })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Status update error response:", errorData);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("Status update response:", responseData);
    return responseData;
  } catch (error) {
    console.error('Error updating inspection status:', error);
    throw error;
  }
}

/**
 * Get current status of an inspection
 * @param {string} inspectionId - The inspection ID
 * @returns {Promise<Object>} Inspection status data
 */
async getInspectionStatus(inspectionId) {
  try {
    console.log(`Fetching status for inspection: ${inspectionId}`);
    
    const response = await fetch(`${API_BASE_URL}/${inspectionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Inspection data response:', data);
    
    return {
      inspectionId: data.inspectionId,
      transformerNo: data.transformerNo,
      status: data.status || null
    };
  } catch (error) {
    console.error('Error fetching inspection status:', error);
    throw error;
  }
}

/**
 * Get all available status options
 * @returns {Array} Array of status options
 */
getStatusOptions() {
  return [
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'SCHEDULED', label: 'Scheduled' }
  ];
}



}
  
export const inspectionService = new InspectionService();