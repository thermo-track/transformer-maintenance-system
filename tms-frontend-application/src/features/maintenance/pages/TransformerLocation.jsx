import React, { useState, useEffect, useRef } from 'react';
import '../styles/transformer-location.css';

const TransformerLocations = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('Not selected');
  const [transformers, setTransformers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    transformerNo: '',
    poleNo: '',
    region: '',
    type: '',
    locationDetails: ''
  });

  // Initialize map on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.L && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, []);

  // Load Leaflet dynamically with better error handling
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !window.L) {
        try {
          // Load Leaflet CSS
          const linkElement = document.createElement('link');
          linkElement.rel = 'stylesheet';
          linkElement.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
          document.head.appendChild(linkElement);

          // Load Leaflet JS
          const scriptElement = document.createElement('script');
          scriptElement.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
          
          // Wait for script to load
          await new Promise((resolve, reject) => {
            scriptElement.onload = resolve;
            scriptElement.onerror = reject;
            document.head.appendChild(scriptElement);
          });

          // Wait a bit more to ensure Leaflet is fully ready
          setTimeout(() => {
            if (mapRef.current && window.L) {
              initializeMap();
            }
          }, 100);
          
        } catch (error) {
          console.error('Failed to load Leaflet:', error);
        }
      } else if (window.L && mapRef.current && !mapInstanceRef.current) {
        // Leaflet already loaded, just initialize
        setTimeout(() => {
          initializeMap();
        }, 100);
      }
    };

    loadLeaflet();
  }, []);

  const initializeMap = () => {
    if (!window.L || mapInstanceRef.current || !mapRef.current) {
      console.log('Cannot initialize map:', {
        leafletLoaded: !!window.L,
        mapExists: !!mapInstanceRef.current,
        mapRefExists: !!mapRef.current
      });
      return;
    }

    try {
      console.log('Initializing map...');
      
      // Initialize map centered on Colombo, Sri Lanka
      const map = window.L.map(mapRef.current, {
        center: [6.9271, 79.8612],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true
      });

      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        tileSize: 256,
        zoomOffset: 0
      }).addTo(map);

      // Wait for map to be ready, then add click event
      map.whenReady(() => {
        console.log('Map is ready, adding click handler...');
        map.on('click', handleMapClick);
        
        // Force a resize to ensure proper rendering
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      });

      mapInstanceRef.current = map;
      console.log('Map initialized successfully');

      // Load existing transformers after map is ready
      setTimeout(() => {
        loadExistingTransformers();
      }, 500);
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const handleMapClick = (e) => {
    console.log('Map clicked at:', e.latlng);
    
    if (!e.latlng || !window.L || !mapInstanceRef.current) {
      console.error('Invalid click event or map not ready');
      return;
    }

    const { lat, lng } = e.latlng;
    
    // Remove existing marker
    if (selectedMarkerRef.current && mapInstanceRef.current) {
      try {
        mapInstanceRef.current.removeLayer(selectedMarkerRef.current);
        console.log('Removed existing marker');
      } catch (error) {
        console.error('Error removing marker:', error);
      }
    }
    
    try {
      // Create custom transformer selection icon with pointer emoji
      const transformerIcon = window.L.divIcon({
        html: `<div style="
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          width: 30px; height: 30px; border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(231, 76, 60, 0.4);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: bold; font-size: 16px;
          position: relative;
        ">📍</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });
      
      // Add new marker
      selectedMarkerRef.current = window.L.marker([lat, lng], { 
        icon: transformerIcon,
        draggable: false
      }).addTo(mapInstanceRef.current);

      // Add popup
      selectedMarkerRef.current.bindPopup('📍 Selected transformer location').openPopup();
      
      console.log('Added new marker at:', lat, lng);
      
      // Store selected location
      setSelectedLocation({ lat, lng });
      
      // Reverse geocode to get address
      reverseGeocode(lat, lng);
      
    } catch (error) {
      console.error('Error creating marker:', error);
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setSelectedAddress(data.display_name);
      } else {
        setSelectedAddress('Address lookup failed');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setSelectedAddress('Address lookup failed');
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    console.log('Searching for:', searchQuery);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=lk`
      );
      const data = await response.json();
      console.log('Search results:', data);

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        console.log('Flying to:', lat, lng);
        
        // Only fly to location - DO NOT automatically place marker
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 15, {
            animate: true,
            duration: 1.5
          });

          // Show message to user about clicking to place marker
          setTimeout(() => {
            if (mapInstanceRef.current && window.L) {
              const popup = window.L.popup({
                closeOnClick: true,
                autoClose: true,
                closeButton: true
              })
                .setLatLng([lat, lng])
                .setContent(`
                  <div style="text-align: center; padding: 5px;">
                    <strong style="color: #e74c3c;">📍 Location Found!</strong><br/>
                    <span style="font-size: 12px; color: #666;">Click anywhere on the map to place transformer marker</span>
                  </div>
                `)
                .openOn(mapInstanceRef.current);
              
              // Auto-close popup after 4 seconds
              setTimeout(() => {
                if (mapInstanceRef.current && popup) {
                  mapInstanceRef.current.closePopup(popup);
                }
              }, 4000);
            }
          }, 1600);
        }
        
      } else {
        alert('Location not found. Try searching for a more specific area in Sri Lanka.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 15);
            
            // Show popup to click for exact location
            setTimeout(() => {
              const popup = window.L.popup()
                .setLatLng([lat, lng])
                .setContent('<div style="text-align: center;"><strong>📍 Your Location</strong><br/>Click on the exact spot to place transformer</div>')
                .openOn(mapInstanceRef.current);
              
              setTimeout(() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.closePopup(popup);
                }
              }, 3000);
            }, 1600);
          }
        },
        (error) => {
          alert('Unable to get current location');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser');
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormValid = () => {
    const { transformerNo, poleNo, region, type } = formData;
    return transformerNo.trim() && poleNo.trim() && region && type && selectedLocation;
  };

  const saveTransformer = async () => {
    if (!isFormValid()) {
      alert('Please fill all required fields and select a location');
      return;
    }

    const transformerData = {
      id: Date.now(),
      ...formData,
      coordinates: selectedLocation,
      address: selectedAddress,
      createdAt: new Date().toISOString()
    };

    try {
      // Here you would typically make an API call to save to your backend
      // For now, we'll just save to local state
      console.log('Saving transformer:', transformerData);
      
      // Add to transformers array
      setTransformers(prev => [...prev, transformerData]);
      
      // Add permanent marker to map
      addPermanentMarker(transformerData);
      
      // Clear form
      clearForm();
      
      alert('Transformer location saved successfully!');
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/transformers', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(transformerData)
      // });
      
    } catch (error) {
      console.error('Error saving transformer:', error);
      alert('Error saving transformer');
    }
  };

  const addPermanentMarker = (transformer) => {
    if (!mapInstanceRef.current || !window.L) return;

    const existingTransformerIcon = window.L.divIcon({
      html: `<div style="
        background: linear-gradient(135deg, #27ae60, #229954);
        width: 20px; height: 20px; border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(39, 174, 96, 0.4);
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: bold; font-size: 10px;
      ">T</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    window.L.marker([transformer.coordinates.lat, transformer.coordinates.lng], { 
      icon: existingTransformerIcon 
    }).addTo(mapInstanceRef.current)
    .bindPopup(`
      <strong>${transformer.transformerNo}</strong><br>
      Pole: ${transformer.poleNo}<br>
      Type: ${transformer.type}<br>
      Region: ${transformer.region}
    `);
  };

  const clearForm = () => {
    setFormData({
      transformerNo: '',
      poleNo: '',
      region: '',
      type: '',
      locationDetails: ''
    });
    
    if (selectedMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }
    
    setSelectedLocation(null);
    setSelectedAddress('Not selected');
  };

  const loadExistingTransformers = () => {
    // Sample transformers for demonstration
    const sampleTransformers = [
      { 
        id: 1,
        transformerNo: 'T001', 
        poleNo: 'P001', 
        region: 'Western Province', 
        type: 'Distribution', 
        coordinates: { lat: 6.9271, lng: 79.8612 },
        locationDetails: 'Sample transformer 1',
        address: 'Colombo, Sri Lanka'
      },
      { 
        id: 2,
        transformerNo: 'T002', 
        poleNo: 'P002', 
        region: 'Western Province', 
        type: 'Power', 
        coordinates: { lat: 6.9150, lng: 79.8750 },
        locationDetails: 'Sample transformer 2',
        address: 'Colombo, Sri Lanka'
      }
    ];

    setTransformers(sampleTransformers);

    // Add markers for existing transformers
    setTimeout(() => {
      sampleTransformers.forEach(transformer => {
        addPermanentMarker(transformer);
      });
    }, 1000);
  };

  const flyToTransformer = (transformer) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([transformer.coordinates.lat, transformer.coordinates.lng], 16);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchLocation();
    }
  };

  return (
    <div className="tl-transformer-locations-container">
      <div className="tl-sidebar">
        <div className="tl-header">
          <h1>⚡ Transformer Location</h1>
          <p>Search area, then click to place 📍</p>
        </div>
        
        <div className="tl-search-section">
          <input
            type="text"
            className="tl-search-input"
            placeholder="🔍 Search area (e.g., Colombo, Negombo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            onClick={searchLocation} 
            disabled={isLoading}
            className="tl-search-btn"
          >
            {isLoading ? 'Searching...' : 'Find Area'}
          </button>
        </div>
        
        <div className="tl-instructions">
          <h3>📍 How to use:</h3>
          <p>• Search for the general area where transformer is located</p>
          <p>• Navigate and zoom to find the exact spot</p>
          <p>• Click precisely where the transformer is located</p>
          <p>• Fill in transformer details and save</p>
        </div>
        
        <div className="tl-location-info">
          {selectedLocation && (
            <div className="tl-info-card">
              <h4>📍 Selected Location</h4>
              <div className="tl-info-row">
                <span className="tl-info-label">Address:</span>
                <span className="tl-info-value">{selectedAddress}</span>
              </div>
              <div className="tl-info-row">
                <span className="tl-info-label">Coordinates:</span>
                <span className="tl-info-value">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </span>
              </div>
              <button className="tl-btn-secondary" onClick={getCurrentLocation}>
                📱 Find My Area
              </button>
            </div>
          )}
          
          {selectedLocation && (
            <div className="tl-transformer-form">
              <h4>⚡ Transformer Details</h4>
              
              <div className="tl-form-group">
                <label className="tl-form-label">Transformer Number *</label>
                <input
                  type="text"
                  className="tl-form-input"
                  placeholder="T001"
                  value={formData.transformerNo}
                  onChange={(e) => handleFormChange('transformerNo', e.target.value)}
                  required
                />
              </div>
              
              <div className="tl-form-group">
                <label className="tl-form-label">Pole Number *</label>
                <input
                  type="text"
                  className="tl-form-input"
                  placeholder="P12345"
                  value={formData.poleNo}
                  onChange={(e) => handleFormChange('poleNo', e.target.value)}
                  required
                />
              </div>
              
              <div className="tl-form-group">
                <label className="tl-form-label">Region *</label>
                <select
                  className="tl-form-select"
                  value={formData.region}
                  onChange={(e) => handleFormChange('region', e.target.value)}
                  required
                >
                  <option value="">Select Region</option>
                  <option value="Western Province">Western Province</option>
                  <option value="Central Province">Central Province</option>
                  <option value="Southern Province">Southern Province</option>
                  <option value="Northern Province">Northern Province</option>
                  <option value="Eastern Province">Eastern Province</option>
                </select>
              </div>
              
              <div className="tl-form-group">
                <label className="tl-form-label">Type *</label>
                <select
                  className="tl-form-select"
                  value={formData.type}
                  onChange={(e) => handleFormChange('type', e.target.value)}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Distribution">Distribution</option>
                  <option value="Power">Power</option>
                  <option value="Instrument">Instrument</option>
                </select>
              </div>
              
              <div className="tl-form-group">
                <label className="tl-form-label">Location Details</label>
                <input
                  type="text"
                  className="tl-form-input"
                  placeholder="Near bus stop, opposite bank..."
                  value={formData.locationDetails}
                  onChange={(e) => handleFormChange('locationDetails', e.target.value)}
                />
              </div>
              
              <button
                className="tl-btn-primary"
                onClick={saveTransformer}
                disabled={!isFormValid()}
              >
                💾 Save Transformer Location
              </button>
            </div>
          )}
          
          <div className="tl-existing-transformers">
            <h4>📋 Existing Transformers ({transformers.length})</h4>
            <div className="tl-transformer-list">
              {transformers.map((transformer) => (
                <div
                  key={transformer.id}
                  className="tl-transformer-marker"
                  onClick={() => flyToTransformer(transformer)}
                >
                  {transformer.transformerNo} ({transformer.region})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="tl-map-container">
        <div ref={mapRef} className="tl-map"></div>
        <div className="tl-map-overlay">
          <h4>🎯 Click to Place 📍</h4>
          <p>Search for area, then click exact transformer location</p>
        </div>
      </div>
    </div>
  );
};

export default TransformerLocations;