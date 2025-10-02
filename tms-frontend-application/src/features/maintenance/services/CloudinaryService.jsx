// services/CloudinaryService.js
class CloudinaryService {
  constructor() {
    const env = import.meta.env;

    this.cloudName = env.VITE_CLOUDINARY_CLOUD_NAME;
    this.uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET;
    this.backendApiUrl = env.VITE_BACKEND_API_URL || 'http://localhost:8080/api';

    if (!this.cloudName || !this.uploadPreset) {
      console.error('Cloudinary configuration missing. Please set environment variables for cloud name and upload preset');
      console.log('Expected variables:', ['VITE_CLOUDINARY_CLOUD_NAME', 'VITE_CLOUDINARY_UPLOAD_PRESET']);
    }
  }

  /**
   * Upload image to Cloudinary and save metadata to backend
   * @param {File|Object|string} fileInput - Image file to upload (File, Blob, blob URL, or object with blob URLs)
   * @param {string} inspectionId - Inspection ID for folder organization
   * @param {string} environmentalCondition - sunny/cloudy/rainy
   * @returns {Promise<Object>} Combined response with Cloudinary data and backend response
   */
  async uploadInspectionImageCloud(fileInput, inspectionId, environmentalCondition) {
    try {
      // Debug file information
      console.log('🔍 Original file input:', {
        input: fileInput,
        type: typeof fileInput,
        constructor: fileInput?.constructor?.name
      });

      // Process the file input and convert to File object
      const file = await this.processFileInput(fileInput);
      
      console.log('🔍 Processed file info:', {
        name: file?.name,
        type: file?.type,
        size: file?.size,
        lastModified: file?.lastModified,
        constructor: file?.constructor?.name
      });

      // Validate file before upload
      this.validateImageFile(file);

      // Step 1: Upload to Cloudinary
      const cloudinaryResult = await this.uploadToCloudinary(file, inspectionId, environmentalCondition);
      
      // Step 2: Save metadata to backend
      const backendResponse = await this.saveImageMetadataToBackend(inspectionId, cloudinaryResult, file, environmentalCondition);
      
      return {
        cloudinary: cloudinaryResult,
        backend: backendResponse,
        success: true
      };
      
    } catch (error) {
      console.error('Image upload process failed:', error);
      
      // If backend save failed but Cloudinary upload succeeded, clean up Cloudinary
      if (error.cloudinaryResult && error.cloudinaryResult.publicId) {
        try {
          await this.deleteImageFromCloudinary(error.cloudinaryResult.publicId);
          console.log('Cleaned up Cloudinary image after backend save failure');
        } catch (cleanupError) {
          console.error('Failed to cleanup Cloudinary image:', cleanupError);
        }
      }
      
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload image to Cloudinary only
   * @param {File} file - Image file to upload
   * @param {string} inspectionId - Inspection ID for folder organization
   * @param {string} environmentalCondition - Environmental condition
   * @returns {Promise<Object>} Cloudinary response
   */
  async uploadToCloudinary(file, inspectionId, environmentalCondition) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    
    // Organize images in folders by inspection ID
    formData.append('folder', `inspections/${inspectionId}`);
    
    // Add context metadata
    formData.append('context', JSON.stringify({
      inspection_id: inspectionId,
      environmental_condition: environmentalCondition,
      upload_date: new Date().toISOString()
    }));
    
    // Add tags for easier searching
    formData.append('tags', `inspection,${environmentalCondition},${inspectionId}`);
    
    // Generate public ID for consistent naming
    const timestamp = Date.now();
    formData.append('public_id', `${inspectionId}_${environmentalCondition}_${timestamp}`);

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
   * @param {string} inspectionId - Inspection ID
   * @param {Object} cloudinaryResult - Result from Cloudinary upload
   * @param {File} file - Original file for metadata
   * @param {string} environmentalCondition - Environmental condition
   * @returns {Promise<Object>} Backend response
   */
  async saveImageMetadataToBackend(inspectionId, cloudinaryResult, file, environmentalCondition) {
    try {
      const imageMetadata = {
        cloudImageUrl: cloudinaryResult.url,
        cloudinaryPublicId: cloudinaryResult.publicId,
        cloudImageName: file.name,
        cloudImageType: file.type,
        environmentalCondition: environmentalCondition,
        cloudUploadedAt: new Date().toISOString() // Backend expects ZonedDateTime format
      };

      const response = await fetch(`${this.backendApiUrl}/inspections/${inspectionId}/images/image-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(imageMetadata)
      });

      if (!response.ok) {
        const error = new Error(`Backend save failed: ${response.status} ${response.statusText}`);
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
   * Delete image from both Cloudinary and backend
   * @param {string} inspectionId - Inspection ID
   * @param {string} publicId - Cloudinary public ID (optional, will fetch from backend if not provided)
   * @returns {Promise<boolean>} Success status
   */
  async deleteInspectionImage(inspectionId, publicId = null) {
    try {
      // If publicId not provided, get it from backend first
      if (!publicId) {
        const imageUrl = await this.getCloudImageUrlFromBackend(inspectionId);
        if (!imageUrl) {
          throw new Error('No cloud image found for this inspection');
        }
        publicId = this.extractPublicIdFromUrl(imageUrl);
      }

      // Delete from Cloudinary first
      const cloudinaryDeleted = await this.deleteImageFromCloudinary(publicId);
      
      // Then delete metadata from backend
      const backendDeleted = await this.deleteImageMetadataFromBackend(inspectionId);
      
      return cloudinaryDeleted && backendDeleted;
      
    } catch (error) {
      console.error('Image deletion failed:', error);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary only
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteImageFromCloudinary(publicId) {
    try {
      // Generate timestamp and signature for authenticated delete
      const timestamp = Math.round(Date.now() / 1000);
      const signature = await this.generateDeleteSignature(publicId, timestamp);
      
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('signature', signature);
      formData.append('api_key', this.apiKey);
      formData.append('timestamp', timestamp);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();
      return result.result === 'ok';
      
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  /**
   * Delete image metadata from backend
   * @param {string} inspectionId - Inspection ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteImageMetadataFromBackend(inspectionId) {
    try {
      const response = await fetch(`${this.backendApiUrl}/inspections/${inspectionId}/images/image-metadata`, {
        method: 'DELETE',
        headers: {
          // Add authorization header if needed
          // 'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      return response.ok;
      
    } catch (error) {
      console.error('Backend metadata deletion error:', error);
      throw error;
    }
  }

  /**
   * Check if inspection has cloud image
   * @param {string} inspectionId - Inspection ID
   * @returns {Promise<boolean>} Whether inspection has cloud image
   */
  async hasCloudImage(inspectionId) {
    try {
      const response = await fetch(`${this.backendApiUrl}/inspections/${inspectionId}/images/has-cloud-image`, {
        method: 'GET',
        headers: {
          // Add authorization header if needed
          // 'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.hasCloudImage || false;
      
    } catch (error) {
      console.error('Error checking cloud image status:', error);
      return false;
    }
  }

  /**
   * Get cloud image URL from backend
   * @param {string} inspectionId - Inspection ID
   * @returns {Promise<string|null>} Cloud image URL or null
   */
  async getCloudImageUrlFromBackend(inspectionId) {
    try {
      const response = await fetch(`${this.backendApiUrl}/inspections/${inspectionId}/images/cloud-image-url`, {
        method: 'GET',
        headers: {
          // Add authorization header if needed
          // 'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.cloudImageUrl || null;
      
    } catch (error) {
      console.error('Error fetching cloud image URL:', error);
      return null;
    }
  }

  /**
   * Generate optimized image URLs with transformations
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Transformation options
   * @returns {string} Transformed image URL
   */
  getOptimizedImageUrl(publicId, options = {}) {
    const {
      width = 800,
      height = 600,
      crop = 'fit',
      quality = 'auto',
      format = 'auto'
    } = options;

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${publicId}`;
  }

  /**
   * Get thumbnail URL
   * @param {string} publicId - Cloudinary public ID
   * @returns {string} Thumbnail URL
   */
  getThumbnailUrl(publicId) {
    return this.getOptimizedImageUrl(publicId, {
      width: 200,
      height: 150,
      crop: 'fill'
    });
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param {string} url - Cloudinary URL
   * @returns {string} Public ID
   */
  extractPublicIdFromUrl(url) {
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Convert blob URL to File object
   * @param {string} blobUrl - Blob URL to convert
   * @param {string} fileName - Name for the file
   * @returns {Promise<File>} File object
   */
  async blobUrlToFile(blobUrl, fileName = 'thermal-image.jpg') {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      // Create a File object from the blob
      const file = new File([blob], fileName, {
        type: blob.type || 'image/jpeg',
        lastModified: Date.now()
      });
      
      return file;
    } catch (error) {
      console.error('Error converting blob URL to file:', error);
      throw new Error('Failed to convert blob URL to file');
    }
  }

  /**
   * Handle different types of file inputs and convert them to File objects
   * @param {File|Object|string} fileInput - Input that could be a File, blob URL, or object with blob URLs
   * @returns {Promise<File>} File object ready for upload
   */
  async processFileInput(fileInput) {
    console.log('🔄 Processing file input:', fileInput);

    // If it's already a File object, return as is
    if (fileInput instanceof File) {
      return fileInput;
    }

    // If it's a Blob, convert to File
    if (fileInput instanceof Blob) {
      return new File([fileInput], 'thermal-image.jpg', {
        type: fileInput.type || 'image/jpeg',
        lastModified: Date.now()
      });
    }

    // If it's a string (blob URL), convert to File
    if (typeof fileInput === 'string' && fileInput.startsWith('blob:')) {
      return await this.blobUrlToFile(fileInput);
    }

    // If it's an object with blob URLs (like your thermal image data)
    if (fileInput && typeof fileInput === 'object') {
      // Try to find a blob URL in the object
      let blobUrl = null;
      
      if (fileInput.current && typeof fileInput.current === 'string') {
        blobUrl = fileInput.current;
      } else if (fileInput.baseline && typeof fileInput.baseline === 'string') {
        blobUrl = fileInput.baseline;
      } else if (fileInput.url && typeof fileInput.url === 'string') {
        blobUrl = fileInput.url;
      }
      
      if (blobUrl && blobUrl.startsWith('blob:')) {
        return await this.blobUrlToFile(blobUrl, 'thermal-image.jpg');
      }
    }

    throw new Error('Invalid file input: Unable to convert to File object');
  }

  /**
   * Improved file validation with better error messages and debugging
   * @param {File} file - File to validate
   */
  validateImageFile(file) {
    console.log('🔍 Validating file:', file);

    if (!file) {
      throw new Error('Please select a file to upload');
    }

    // Check if it's actually a File object
    if (!(file instanceof File) && !(file instanceof Blob)) {
      console.error('❌ Invalid file object:', file);
      console.error('File type:', typeof file);
      console.error('File constructor:', file?.constructor?.name);
      throw new Error('Invalid file object provided. Expected File or Blob, got: ' + typeof file);
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    
    // More comprehensive MIME type checking
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

    // Also check file extension as backup
    const ALLOWED_EXTENSIONS = [
      '.jpg', '.jpeg', '.png', '.gif', 
      '.bmp', '.webp', '.tiff', '.tif'
    ];

    console.log('📝 File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size should not exceed 5MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    }

    // Primary check: MIME type
    const isValidMimeType = ALLOWED_TYPES.includes(file.type.toLowerCase());
    
    // Secondary check: file extension
    const fileName = file.name ? file.name.toLowerCase() : '';
    const isValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));

    console.log('🔍 Validation checks:', {
      mimeType: file.type,
      isValidMimeType,
      fileName,
      isValidExtension
    });

    // Allow if either MIME type or extension is valid
    if (!isValidMimeType && !isValidExtension) {
      throw new Error(
        `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}. ` +
        `Received: ${file.type || 'unknown'} for file: ${file.name || 'unnamed'}`
      );
    }

    // If MIME type is missing but extension is valid, warn but allow
    if (!file.type && isValidExtension) {
      console.warn('⚠️ File has no MIME type but valid extension, allowing upload');
    }

    console.log('✅ File validation passed');
  }
   /**
   * Generate signature for authenticated delete (placeholder - implement based on your security requirements)
   * @param {string} publicId - Public ID
   * @param {number} timestamp - Timestamp
   * @returns {Promise<string>} Signature
   */
  async generateDeleteSignature(publicId, timestamp) {
    return 'placeholder-signature';
  }
}

export const cloudinaryService = new CloudinaryService();