// services/LocationService.js

const API_BASE_URL = "/api/transformers";

export const locationService = {
  /**
   * Update transformer location by transformer number (not ID)
   */
  async updateTransformerLocation(transformerNo, locationData) {
    try {
      console.log('🎯 Updating transformer location:', { transformerNo, locationData });
      
      const requestBody = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address
      };
      
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/${transformerNo}/location`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Location updated successfully:', data);
      return data;
    } catch (error) {
      console.error("❌ Error updating transformer location:", {
        message: error.message,
        stack: error.stack,
        transformerNo,
        locationData
      });
      throw error;
    }
  },

  /**
   * Delete transformer location by transformer number (not ID)
   */
  async deleteTransformerLocation(transformerNo) {
    try {
      console.log('🗑️ Deleting transformer location for:', transformerNo);
      
      const response = await fetch(`${API_BASE_URL}/${transformerNo}/location`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📊 Delete response status:', response.status);
      console.log('📊 Delete response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Delete API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // Check if there's a response body
      let data = null;
      try {
        const responseText = await response.text();
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.log('ℹ️ No JSON response body (this is normal for DELETE operations)');
        data = { success: true, message: 'Location deleted successfully' };
      }

      console.log('✅ Location deleted successfully:', data);
      return data || { success: true, message: 'Location deleted successfully' };
    } catch (error) {
      console.error("❌ Error deleting transformer location:", {
        message: error.message,
        stack: error.stack,
        transformerNo
      });
      throw error;
    }
  },

  /**
   * Get transformer location by transformer number (not ID)
   */
  async getTransformerLocation(transformerNo) {
    try {
      console.log('🔍 Fetching transformer location for number:', transformerNo);
      
      const url = `${API_BASE_URL}/${transformerNo}/location`;
      console.log('📡 Location API URL:', url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📊 Location response status:', response.status);
      console.log('📊 Location response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Location API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Location fetched successfully:', data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching transformer location:", {
        message: error.message,
        stack: error.stack,
        transformerNo
      });
      throw error;
    }
  },

  /**
   * Check if transformer has location data
   */
  async checkTransformerHasLocation(transformerNo) {
    try {
      console.log('🔍 Checking if transformer has location:', transformerNo);
      
      const locationData = await this.getTransformerLocation(transformerNo);
      
      const hasLocation = !!(locationData && locationData.latitude && locationData.longitude);
      
      console.log('📍 Location check result:', {
        transformerNo,
        hasLocation,
        locationData
      });
      
      return {
        hasLocation,
        locationData
      };
    } catch (error) {
      console.log('ℹ️ Location check failed (probably no location set):', {
        transformerNo,
        error: error.message
      });
      return {
        hasLocation: false,
        locationData: null
      };
    }
  }
};

// Extended transformer service with location methods
export const transformerService = {
  async getTransformerByNumber(transformerNo) {
    try {
      console.log('🔍 Fetching transformer details for:', transformerNo);
      
      const url = `${API_BASE_URL}?page=0&size=1&q=${encodeURIComponent(transformerNo)}&by=transformerNo`;
      console.log('📡 Transformer API URL:', url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📊 Transformer response status:', response.status);
      console.log('📊 Transformer response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Transformer API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Raw API Response:', {
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        numberOfElements: data.numberOfElements,
        contentLength: data.content?.length,
        firstTransformer: data.content?.[0]
      });
      
      const transformer = data?.content?.[0] || null;
      
      if (transformer) {
        console.log('🎯 Extracted transformer details:', {
          id: transformer.id,
          transformerNo: transformer.transformerNo,
          poleNo: transformer.poleNo,
          region: transformer.region,
          type: transformer.type,
          hasLatitude: !!transformer.latitude,
          hasLongitude: !!transformer.longitude,
          latitude: transformer.latitude,
          longitude: transformer.longitude,
          address: transformer.address,
          locationComplete: !!(transformer.latitude && transformer.longitude)
        });
      } else {
        console.warn('⚠️ No transformer found in response');
      }
      
      return transformer;
    } catch (error) {
      console.error("❌ Error fetching transformer details:", {
        message: error.message,
        stack: error.stack,
        transformerNo
      });
      throw error;
    }
  },

  /**
   * Get transformer with detailed location check
   */
  async getTransformerWithLocationCheck(transformerNo) {
    try {
      console.log('🔍📍 Getting transformer with location check for:', transformerNo);
      
      // First get the transformer basic data
      const transformer = await this.getTransformerByNumber(transformerNo);
      
      if (!transformer) {
        console.warn('⚠️ No transformer found, skipping location check');
        return null;
      }
      
      // Check location data embedded in transformer
      const embeddedLocationExists = !!(transformer.latitude && transformer.longitude);
      console.log('📍 Embedded location check:', {
        exists: embeddedLocationExists,
        latitude: transformer.latitude,
        longitude: transformer.longitude
      });
      
      // Also try to fetch dedicated location data
      let dedicatedLocationData = null;
      try {
        dedicatedLocationData = await locationService.getTransformerLocation(transformerNo);
        console.log('📍 Dedicated location data:', dedicatedLocationData);
      } catch (error) {
        console.log('ℹ️ No dedicated location data found (this may be normal)');
      }
      
      // Determine final location status
      const hasLocation = embeddedLocationExists || !!(dedicatedLocationData?.latitude && dedicatedLocationData?.longitude);
      
      const result = {
        ...transformer,
        hasLocation,
        embeddedLocationExists,
        dedicatedLocationData
      };
      
      console.log('🎯 Final transformer with location status:', {
        transformerNo: result.transformerNo,
        hasLocation,
        embeddedLocationExists,
        hasDedicatedLocation: !!dedicatedLocationData
      });
      
      return result;
    } catch (error) {
      console.error("❌ Error in getTransformerWithLocationCheck:", {
        message: error.message,
        stack: error.stack,
        transformerNo
      });
      throw error;
    }
  },

  /**
   * Update transformer location using transformer number directly
   */
  async updateLocationByNumber(transformerNo, locationData) {
    try {
      console.log('🎯 Updating location for transformer number:', transformerNo);
      console.log('📍 Location data to update:', locationData);
      
      // Directly call the location service with transformer number
      const result = await locationService.updateTransformerLocation(transformerNo, locationData);
      console.log('✅ Location update completed:', result);
      return result;
    } catch (error) {
      console.error("❌ Error updating location by transformer number:", {
        message: error.message,
        stack: error.stack,
        transformerNo,
        locationData
      });
      throw error;
    }
  },

  /**
   * Delete transformer location using transformer number directly
   */
  async deleteLocationByNumber(transformerNo) {
    try {
      console.log('🗑️ Deleting location for transformer number:', transformerNo);
      
      // Directly call the location service with transformer number
      const result = await locationService.deleteTransformerLocation(transformerNo);
      console.log('✅ Location deletion completed:', result);
      return result;
    } catch (error) {
      console.error("❌ Error deleting location by transformer number:", {
        message: error.message,
        stack: error.stack,
        transformerNo
      });
      throw error;
    }
  }
};