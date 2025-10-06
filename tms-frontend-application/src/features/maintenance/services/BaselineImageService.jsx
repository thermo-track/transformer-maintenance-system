// services/BaselineImageService.js
class BaselineImageService {
  constructor() {
    const env = import.meta.env;

    this.cloudName = env.VITE_CLOUDINARY_CLOUD_NAME;
    this.uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET;
    this.apiKey = env.VITE_CLOUDINARY_API_KEY;
    this.backendApiUrl = env.VITE_BACKEND_API_URL || 'http://localhost:8080/api';

    if (!this.cloudName || !this.uploadPreset) {
      console.error('Cloudinary configuration missing. Please set environment variables for cloud name and upload preset');
      console.log('Expected variables:', ['VITE_CLOUDINARY_CLOUD_NAME', 'VITE_CLOUDINARY_UPLOAD_PRESET']);
    }
  }

  /**
   * Upload baseline image to Cloudinary and save metadata to backend
   * @param {string} transformerId - Transformer ID
   * @param {File} file - Image file to upload
   * @param {string} weatherCondition - sunny/cloudy/rainy
   * @returns {Promise<Object>} Combined response with Cloudinary data and backend response
   */
  async uploadBaselineImage(transformerId, file, weatherCondition) {
    try {
      console.log('Starting baseline image upload for transformer:', transformerId, 'condition:', weatherCondition);
      
      // Validate file before upload
      this.validateImageFile(file);

      // Step 1: Upload to Cloudinary
      const cloudinaryResult = await this.uploadToCloudinary(file, transformerId, weatherCondition);
      
      // Step 2: Save metadata to backend
      const backendResponse = await this.saveImageMetadataToBackend(transformerId, cloudinaryResult, file, weatherCondition);
      
      console.log('Baseline image upload completed successfully');
      return {
        cloudinary: cloudinaryResult,
        backend: backendResponse,
        success: true
      };
      
    } catch (error) {
      console.error('Baseline image upload process failed:', error);
      
      // If backend save failed but Cloudinary upload succeeded, clean up Cloudinary
      if (error.cloudinaryResult && error.cloudinaryResult.publicId) {
        try {
          // TODO: Implement cleanup through backend API if needed
          // await this.deleteImageFromCloudinary(error.cloudinaryResult.publicId);
          console.log('Cloudinary cleanup skipped - should be handled by backend if needed');
        } catch (cleanupError) {
          console.error('Failed to cleanup Cloudinary image:', cleanupError);
        }
      }
      
      throw new Error(`Baseline image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload image to Cloudinary only
   * @param {File} file - Image file to upload
   * @param {string} transformerId - Transformer ID for folder organization
   * @param {string} weatherCondition - Weather condition
   * @returns {Promise<Object>} Cloudinary response
   */
  async uploadToCloudinary(file, transformerId, weatherCondition) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    
    // Organize images in folders by transformer ID
    formData.append('folder', `transformers/baseline/${transformerId}`);
    
    // Add context metadata
    formData.append('context', JSON.stringify({
      transformer_id: transformerId,
      weather_condition: weatherCondition,
      image_type: 'baseline',
      upload_date: new Date().toISOString()
    }));
    
    // Add tags for easier searching
    formData.append('tags', `baseline,transformer,${weatherCondition},${transformerId}`);
    
    // Generate public ID for consistent naming
    const timestamp = Date.now();
    formData.append('public_id', `baseline_${transformerId}_${weatherCondition}_${timestamp}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Cloudinary upload failed');
    }

    const result = await response.json();
    console.log('Cloudinary upload successful:', result);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      cloudinaryId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      uploadedAt: result.created_at
    };
  }

  /**
   * Save image metadata to backend
   * @param {string} transformerId - Transformer ID
   * @param {Object} cloudinaryResult - Result from Cloudinary upload
   * @param {File} file - Original file for metadata
   * @param {string} weatherCondition - Weather condition
   * @returns {Promise<Object>} Backend response
   */
  async saveImageMetadataToBackend(transformerId, cloudinaryResult, file, weatherCondition) {
    try {
      const imageMetadata = {
        baseImageUrl: cloudinaryResult.url,
        baseCloudinaryPublicId: cloudinaryResult.publicId,
        baseImageName: file.name,
        baseImageType: file.type,
        weatherCondition: weatherCondition,
        adminUserId: 'SYSTEM' // You might want to get this from auth context
      };

      const response = await fetch(`${this.backendApiUrl}/transformers/${transformerId}/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(imageMetadata)
      });

      if (!response.ok) {
        const errorData = await response.text();
        const error = new Error(`Backend save failed: ${response.status} ${response.statusText} - ${errorData}`);
        error.cloudinaryResult = cloudinaryResult; // Attach for cleanup
        throw error;
      }

      const result = await response.json();
      console.log('Backend metadata save successful:', result);
      return result;

    } catch (error) {
      error.cloudinaryResult = cloudinaryResult; // Attach for cleanup
      throw error;
    }
  }

  /**
   * Get baseline image URL for specific weather condition
   * @param {string} transformerId - Transformer ID
   * @param {string} weatherCondition - Weather condition
   * @returns {Promise<string|null>} Image URL or null
   */
  async getBaselineImage(transformerId, weatherCondition) {
    try {
      const response = await fetch(`${this.backendApiUrl}/transformers/${transformerId}/image/${weatherCondition}`, {
        method: 'GET',
        headers: {
          // Add authorization header if needed
          // 'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No image found
        }
        throw new Error(`Failed to get baseline image: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.imageUrl;
      
    } catch (error) {
      console.error('Error getting baseline image:', error);
      return null;
    }
  }

  /**
   * Get all baseline images for a transformer
   * @param {string} transformerId - Transformer ID
   * @returns {Promise<Object>} Object with sunny, cloudy, rainy image URLs
   */
  async getAllBaselineImages(transformerId) {
    try {
      console.log('Loading all baseline images for transformer:', transformerId);
      
      const [sunny, cloudy, rainy] = await Promise.allSettled([
        this.getBaselineImage(transformerId, 'sunny'),
        this.getBaselineImage(transformerId, 'cloudy'),
        this.getBaselineImage(transformerId, 'rainy')
      ]);

      const result = {
        sunny: sunny.status === 'fulfilled' ? sunny.value : null,
        cloudy: cloudy.status === 'fulfilled' ? cloudy.value : null,
        rainy: rainy.status === 'fulfilled' ? rainy.value : null
      };

      console.log('All baseline images loaded:', result);
      return result;
      
    } catch (error) {
      console.error('Error loading all baseline images:', error);
      throw error;
    }
  }

  /**
   * Delete baseline image from both Cloudinary and backend
   * @param {string} transformerId - Transformer ID
   * @param {string} weatherCondition - Weather condition
   * @returns {Promise<boolean>} Success status
   */
  async deleteBaselineImage(transformerId, weatherCondition) {
    try {
      console.log('Deleting baseline image for transformer:', transformerId, 'condition:', weatherCondition);
      
      // First get the image info to find the Cloudinary public ID
      const imageInfo = await this.getTransformerImagesInfo(transformerId);
      
      let publicId = null;
      if (imageInfo) {
        const imageData = imageInfo[weatherCondition + 'Image'];
        if (imageData && imageData.baseCloudinaryPublicId) {
          publicId = imageData.baseCloudinaryPublicId;
        }
      }

      // Delete from backend first
      const response = await fetch(`${this.backendApiUrl}/transformers/${transformerId}/image/${weatherCondition}`, {
        method: 'DELETE',
        headers: {
          // Add authorization header if needed
          // 'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Backend delete failed: ${response.status} ${response.statusText}`);
      }

      // Backend deletion should handle both metadata and Cloudinary cleanup
      if (publicId) {
        console.log('Backend should handle Cloudinary deletion for:', publicId);
        // The backend deleteImage endpoint should handle Cloudinary cleanup
      }

      console.log('Baseline image deleted successfully');
      return true;
      
    } catch (error) {
      console.error('Error deleting baseline image:', error);
      throw error;
    }
  }

  /**
   * Get transformer images info (all weather conditions with metadata)
   * @param {string} transformerId - Transformer ID
   * @returns {Promise<Object|null>} Images info or null
   */
  async getTransformerImagesInfo(transformerId) {
    try {
      const response = await fetch(`${this.backendApiUrl}/transformers/${transformerId}/images/info`, {
        method: 'GET',
        headers: {
          // Add authorization header if needed
          // 'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get transformer images info: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('Error getting transformer images info:', error);
      return null;
    }
  }

  /**
   * Delete image from Cloudinary only
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<boolean>} Success status
   * 
   * NOTE: This should be handled by the backend, not frontend
   */
  /*
  async deleteImageFromCloudinary(publicId) {
    try {
      // For delete operations, you typically need to use the admin API with authentication
      // This is a simplified version - in production, you should handle this through your backend
      console.log('Attempting to delete image from Cloudinary:', publicId);
      
      // Note: Direct deletion from frontend requires exposing API secrets, which is not secure
      // In production, this should be handled by your backend
      const timestamp = Math.round(Date.now() / 1000);
      
      // For now, we'll just log the attempt since secure deletion requires backend handling
      console.log('Cloudinary deletion would be handled by backend in production');
      return true;
      
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }
  
  /**
   * Get transformer last updated time
   * @param {string} transformerId - Transformer ID
   * @returns {Promise<Object|string>} Last updated info object or message string
   */
  async getTransformerLastUpdated(transformerId) {
    try {
      console.log('Getting last updated time for transformer:', transformerId);
      
      const response = await fetch(`${this.backendApiUrl}/transformers/${transformerId}/last-updated`, {
        method: 'GET',
        headers: {
          // Add authorization header if needed
          // 'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Transformer not found: ${transformerId}`);
        }
        throw new Error(`Failed to get transformer last updated time: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle case where result is a string message (no images uploaded)
      if (typeof result === 'string') {
        console.log('No images uploaded for transformer:', transformerId);
        return { message: result, lastImageUpdatedAt: null };
      }
      
      console.log('Transformer last updated info:', result);
      return result;
      
    } catch (error) {
      console.error('Error getting transformer last updated time:', error);
      throw error;
    }
  }

  /**
   * Generate optimized image URLs with transformations
   * @param {string} url - Original Cloudinary URL
   * @param {Object} options - Transformation options
   * @returns {string} Transformed image URL
   */
  getOptimizedImageUrl(url, options = {}) {
    const {
      width = 800,
      height = 600,
      crop = 'fit',
      quality = 'auto',
      format = 'auto'
    } = options;

    // Extract the public ID from the URL and rebuild with transformations
    const publicId = this.extractPublicIdFromUrl(url);
    if (!publicId) return url;

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${publicId}`;
  }

  /**
   * Get thumbnail URL
   * @param {string} url - Original Cloudinary URL
   * @returns {string} Thumbnail URL
   */
  getThumbnailUrl(url) {
    return this.getOptimizedImageUrl(url, {
      width: 200,
      height: 150,
      crop: 'fill'
    });
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param {string} url - Cloudinary URL
   * @returns {string|null} Public ID
   */
  extractPublicIdFromUrl(url) {
    if (!url) return null;
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Validate image file
   * @param {File} file - File to validate
   */
  validateImageFile(file) {
    console.log('Validating baseline image file:', file);

    if (!file) {
      throw new Error('Please select a file to upload');
    }

    if (!(file instanceof File) && !(file instanceof Blob)) {
      throw new Error('Invalid file object provided. Expected File or Blob, got: ' + typeof file);
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    
    const ALLOWED_TYPES = [
      'image/jpeg',
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/bmp',
      'image/webp',
      'image/tiff',
      'image/tif'
    ];

    const ALLOWED_EXTENSIONS = [
      '.jpg', '.jpeg', '.png', '.gif', 
      '.bmp', '.webp', '.tiff', '.tif'
    ];

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size should not exceed 5MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    }

    const isValidMimeType = ALLOWED_TYPES.includes(file.type.toLowerCase());
    const fileName = file.name ? file.name.toLowerCase() : '';
    const isValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (!isValidMimeType && !isValidExtension) {
      throw new Error(
        `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}. ` +
        `Received: ${file.type || 'unknown'} for file: ${file.name || 'unnamed'}`
      );
    }

    if (!file.type && isValidExtension) {
      console.warn('File has no MIME type but valid extension, allowing upload');
    }

    console.log('File validation passed');
  }
}

export const baselineImageService = new BaselineImageService();