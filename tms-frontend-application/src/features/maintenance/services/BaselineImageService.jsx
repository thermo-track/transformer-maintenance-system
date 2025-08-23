// baselineImageService.js

const API_BASE_URL = '/api/transformers'; // Adjust this to match your backend API base URL

class BaselineImageService {
  
  /**
   * Upload baseline image for a transformer
   * @param {string} transformerNo - The transformer number
   * @param {File} imageFile - The image file to upload
   * @param {string} weatherCondition - The weather condition (sunny, cloudy, rainy)
   * @returns {Promise<Object>} Upload response
   */
  async uploadBaselineImage(transformerNo, imageFile, weatherCondition) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Create a Blob with the correct content type for JSON
      const jsonBlob = new Blob([JSON.stringify({
        weatherCondition: weatherCondition,
        adminUserId: "admin_user", // Dummy admin user ID for now
        description: `Baseline image for ${weatherCondition} weather condition`
      })], { type: 'application/json' });
      
      formData.append('data', jsonBlob);

      console.log(`Uploading baseline image for transformer ${transformerNo}, condition: ${weatherCondition}`);
      
      const response = await fetch(`${API_BASE_URL}/${transformerNo}/image`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary for multipart
      });

      console.log("Baseline image upload response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Baseline image upload error response:", errorText);
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Baseline image upload response data:", responseData);
      return responseData;
    } catch (error) {
      console.error('Error uploading baseline image:', error);
      throw error;
    }
  }

  /**
   * Get baseline image for specific weather condition
   * @param {string} transformerNo - The transformer number
   * @param {string} weatherCondition - The weather condition
   * @returns {Promise<Blob>} Image blob data
   */
  async getImage(transformerNo, weatherCondition) {
    try {
      console.log(`Fetching baseline image for transformer ${transformerNo}, condition: ${weatherCondition}`);
      
      const response = await fetch(`${API_BASE_URL}/${transformerNo}/image/${weatherCondition}`, {
        method: 'GET',
        headers: {
          'Accept': 'image/*'
        }
      });

      if (response.status === 404) {
        return null; // No image found
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error(`Error fetching baseline image for ${weatherCondition}:`, error);
      throw error;
    }
  }

  /**
   * Get baseline image URL for display
   * @param {string} transformerNo - The transformer number
   * @param {string} weatherCondition - The weather condition
   * @returns {Promise<string|null>} Image URL or null if not found
   */
  async getImageUrl(transformerNo, weatherCondition) {
    try {
      const blob = await this.getImage(transformerNo, weatherCondition);
      if (!blob) return null;
      
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(`Error creating image URL for ${weatherCondition}:`, error);
      return null;
    }
  }

  /**
   * Get transformer images info (which weather conditions have images)
   * @param {string} transformerNo - The transformer number
   * @returns {Promise<Object>} Object with boolean values for each weather condition
   */
  async getTransformerImagesInfo(transformerNo) {
    try {
      console.log(`Fetching transformer images info for ${transformerNo}`);
      
      const response = await fetch(`${API_BASE_URL}/${transformerNo}/images/info`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Return empty info if transformer not found
          return { sunny: false, cloudy: false, rainy: false };
        }
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const imageInfo = await response.json();
      console.log("Transformer images info:", imageInfo);
      return imageInfo;
    } catch (error) {
      console.error('Error fetching transformer images info:', error);
      throw error;
    }
  }

  /**
   * Delete baseline image for specific weather condition
   * @param {string} transformerNo - The transformer number
   * @param {string} weatherCondition - The weather condition
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteBaselineImage(transformerNo, weatherCondition) {
    try {
      console.log(`Deleting baseline image for transformer ${transformerNo}, condition: ${weatherCondition}`);
      
      const response = await fetch(`${API_BASE_URL}/${transformerNo}/image/${weatherCondition}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Image not found');
        }
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const result = await response.text();
      console.log("Delete result:", result);
      return true;
    } catch (error) {
      console.error('Error deleting baseline image:', error);
      throw error;
    }
  }

  /**
   * Get all baseline images for a transformer
   * @param {string} transformerNo - The transformer number
   * @returns {Promise<Object>} Object with image URLs for each weather condition
   */
  async getAllBaselineImages(transformerNo) {
    try {
      console.log(`Loading all baseline images for transformer: ${transformerNo}`);
      const images = {};

      // Try to fetch images for each weather condition directly
      const weatherConditions = ['sunny', 'cloudy', 'rainy'];
      
      for (const condition of weatherConditions) {
        try {
          console.log(`Checking for ${condition} image...`);
          const imageUrl = await this.getImageUrl(transformerNo, condition);
          images[condition] = imageUrl;
          console.log(`✓ ${condition} image loaded successfully`);
        } catch (error) {
          console.log(`✗ No ${condition} image found:`, error.message);
          images[condition] = null;
        }
      }

      console.log('Final images object:', images);
      return images;
    } catch (error) {
      console.error('Error fetching all baseline images:', error);
      throw error;
    }
  }

  /**
   * Check if image exists for specific weather condition
   * @param {string} transformerNo - The transformer number
   * @param {string} weatherCondition - The weather condition
   * @returns {Promise<boolean>} True if image exists
   */
  async imageExists(transformerNo, weatherCondition) {
    try {
      const imageInfo = await this.getTransformerImagesInfo(transformerNo);
      return imageInfo[weatherCondition] || false;
    } catch (error) {
      console.error('Error checking image existence:', error);
      return false;
    }
  }
}

// Export singleton instance
export const baselineImageService = new BaselineImageService();