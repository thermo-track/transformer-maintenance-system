


// services/TransformerService.js
const API_BASE_URL = "/api/transformers";

export const transformerService = {
    async getTransformerByNumber(transformerNo) {
    try {
      console.log('🔍 Fetching transformer details for:', transformerNo);
      
      const url = `${API_BASE_URL}?page=0&size=1&q=${encodeURIComponent(transformerNo)}&by=transformerNo`;
      console.log('📡 API URL:', url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Raw API Response:', data);
      
      // Check the structure of the response
      if (data && typeof data === 'object') {
        console.log('📋 Response structure:', {
          hasContent: 'content' in data,
          contentType: Array.isArray(data.content) ? 'array' : typeof data.content,
          contentLength: data.content?.length,
          keys: Object.keys(data)
        });
      }
      
      const transformer = data?.content?.[0] || null;
      console.log('🎯 Extracted transformer:', transformer);
      
      return transformer;
    } catch (error) {
      console.error("❌ Error fetching transformer details:", error);
      throw error;
    }
  },
  async getTransformerById(transformerId) {
    try {
      console.log('Fetching transformer details for ID:', transformerId);
      
      // Use the direct endpoint that works in Postman
      const url = `${API_BASE_URL}/${encodeURIComponent(transformerId)}`;
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const transformer = await response.json();
      console.log('Transformer loaded successfully:', transformer);
      
      return transformer;
    } catch (error) {
      console.error("Error fetching transformer details:", error);
      throw error;
    }
  },

  // Keep your existing search method if you need it elsewhere
  async searchTransformers(query, page = 0, size = 10, searchBy = 'transformerId') {
    try {
      const url = `${API_BASE_URL}?page=${page}&size=${size}&q=${encodeURIComponent(query)}&by=${searchBy}`;
      console.log('Search API URL:', url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Search results:', data);
      
      return data;
    } catch (error) {
      console.error("Error searching transformers:", error);
      throw error;
    }
  }
};