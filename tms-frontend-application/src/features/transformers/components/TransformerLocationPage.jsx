// src/features/transformers/components/TransformerLocationPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transformerService } from '../services/LocationService';
import { ArrowLeft, MapPin, Save, Loader2, X } from 'lucide-react';
import '../styles/transformer-location.css';

const TransformerLocationPage = ({ 
  transformer: propTransformer, 
  editMode = false, 
  onLocationUpdated,
  onBackToView 
}) => {
  const { transformerNo } = useParams();
  const navigate = useNavigate();
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const existingMarkerRef = useRef(null);
  
  const [transformer, setTransformer] = useState(propTransformer || null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('Not selected');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTransformer, setIsLoadingTransformer] = useState(!propTransformer);

  // Load transformer data only if not provided via props
  useEffect(() => {
    if (!propTransformer && transformerNo) {
      loadTransformerData();
    }
  }, [transformerNo, propTransformer]);

  // Initialize map
  useEffect(() => {
    if (transformer && typeof window !== 'undefined' && window.L && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [transformer]);

  // Load Leaflet dynamically
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
          
          await new Promise((resolve, reject) => {
            scriptElement.onload = resolve;
            scriptElement.onerror = reject;
            document.head.appendChild(scriptElement);
          });

          setTimeout(() => {
            if (transformer && mapRef.current && window.L) {
              initializeMap();
            }
          }, 100);
          
        } catch (error) {
          console.error('Failed to load Leaflet:', error);
        }
      }
    };

    loadLeaflet();
  }, [transformer]);

  const loadTransformerData = async () => {
    try {
      setIsLoadingTransformer(true);
      const data = await transformerService.getTransformerByNumber(transformerNo);
      
      if (!data) {
        alert('Transformer not found');
        navigate('/transformers');
        return;
      }
      
      setTransformer(data);
      
      // If transformer has existing location, set it
      if (data.latitude && data.longitude) {
        setSelectedLocation({
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude)
        });
        setSelectedAddress(data.address || 'Existing location');
      }
      
    } catch (error) {
      console.error('Error loading transformer:', error);
      alert('Error loading transformer data');
      navigate('/transformers');
    } finally {
      setIsLoadingTransformer(false);
    }
  };

  const initializeMap = () => {
    if (!window.L || mapInstanceRef.current || !mapRef.current || !transformer) {
      return;
    }

    try {
      console.log('Initializing map for transformer:', transformer.transformerNo);
      
      // Initialize map centered on Colombo, Sri Lanka
      let initialLat = 6.9271;
      let initialLng = 79.8612;
      let initialZoom = 13;
      
      // If transformer has location, center on it
      if (transformer.latitude && transformer.longitude) {
        initialLat = parseFloat(transformer.latitude);
        initialLng = parseFloat(transformer.longitude);
        initialZoom = 16;
      }
      
      const map = window.L.map(mapRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
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

      map.whenReady(() => {
        console.log('Map is ready');
        map.on('click', handleMapClick);
        
        // Add existing location marker if available
        if (transformer.latitude && transformer.longitude && !selectedLocation) {
          addExistingLocationMarker(parseFloat(transformer.latitude), parseFloat(transformer.longitude));
        }
        
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      });

      mapInstanceRef.current = map;
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const addExistingLocationMarker = (lat, lng) => {
    if (!mapInstanceRef.current || !window.L) return;

    const existingIcon = window.L.divIcon({
      html: `<div style="
        background: linear-gradient(135deg, #27ae60, #229954);
        width: 25px; height: 25px; border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(39, 174, 96, 0.4);
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: bold; font-size: 12px;
        position: relative;
      ">📍</div>`,
      iconSize: [31, 31],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });

    existingMarkerRef.current = window.L.marker([lat, lng], { 
      icon: existingIcon 
    }).addTo(mapInstanceRef.current)
    .bindPopup(`
      <div style="text-align: center;">
        <strong style="color: #27ae60;">Current Location</strong><br/>
        <small>Click anywhere to move</small>
      </div>
    `);
  };

  const handleMapClick = (e) => {
    if (!e.latlng || !window.L || !mapInstanceRef.current) {
      return;
    }

    const { lat, lng } = e.latlng;
    
    // Remove existing selection marker
    if (selectedMarkerRef.current) {
      mapInstanceRef.current.removeLayer(selectedMarkerRef.current);
    }
    
    // Remove existing location marker
    if (existingMarkerRef.current) {
      mapInstanceRef.current.removeLayer(existingMarkerRef.current);
      existingMarkerRef.current = null;
    }
    
    try {
      // Create new selection marker
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
      
      selectedMarkerRef.current = window.L.marker([lat, lng], { 
        icon: transformerIcon 
      }).addTo(mapInstanceRef.current);

      selectedMarkerRef.current.bindPopup('📍 New transformer location').openPopup();
      
      setSelectedLocation({ lat, lng });
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
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=lk`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 15, {
            animate: true,
            duration: 1.5
          });

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

  const saveLocation = async () => {
    if (!selectedLocation || !transformer) {
      alert('Please select a location on the map');
      return;
    }

    setIsSaving(true);
    
    try {
      const locationData = {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        address: selectedAddress
      };

      await transformerService.updateLocationByNumber(
        transformer.transformerNo, 
        locationData
      );
      
      alert(`Transformer location ${editMode ? 'updated' : 'saved'} successfully!`);
      
      // Call the callback functions if provided (for wrapper component)
      if (onLocationUpdated) {
        onLocationUpdated();
      } else {
        // Default behavior - navigate back to transformers list
        navigate('/transformers');
      }
      
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Error saving location: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (onBackToView) {
      onBackToView();
    } else {
      navigate('/transformers');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchLocation();
    }
  };

  if (isLoadingTransformer) {
    return (
      <div className="transformer-locations-container">
        <div className="loading-container">
          <Loader2 className="animate-spin" size={32} />
          <p>Loading transformer data...</p>
        </div>
      </div>
    );
  }

  if (!transformer) {
    return (
      <div className="transformer-locations-container">
        <div className="error-container">
          <p>Transformer not found</p>
          <button onClick={handleBack} className="btn-primary">
            Back to Transformers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transformer-locations-container">
      <div className="sidebar">
        <div className="header">
          <div className="header-actions">
            <button 
              onClick={handleBack} 
              className="back-button"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            {editMode && onBackToView && (
              <button 
                onClick={onBackToView}
                className="cancel-edit-button"
                title="Cancel editing"
              >
                <X size={18} />
                Cancel
              </button>
            )}
          </div>
          <h1>⚡ {editMode ? 'Update' : 'Set'} Transformer Location</h1>
          <p>Click on map to {editMode ? 'update' : 'set'} precise location</p>
        </div>

        {/* Transformer Info */}
        <div className="transformer-info-card">
          <h3>📋 Transformer Details</h3>
          <div className="info-row">
            <span className="info-label">Number:</span>
            <span className="info-value">{transformer.transformerNo}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Pole:</span>
            <span className="info-value">{transformer.poleNo}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Region:</span>
            <span className="info-value">{transformer.region}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Type:</span>
            <span className="info-value">{transformer.type}</span>
          </div>
        </div>
        
        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search area (e.g., Colombo, Negombo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            onClick={searchLocation} 
            disabled={isLoading}
            className="search-btn"
          >
            {isLoading ? 'Searching...' : 'Find Area'}
          </button>
        </div>

        <button className="btn-secondary" onClick={getCurrentLocation}>
          📱 Find My Area
        </button>
        
        <div className="instructions">
          <h3>📍 How to use:</h3>
          <p>• Search for the general area where transformer is located</p>
          <p>• Navigate and zoom to find the exact spot</p>
          <p>• Click precisely where the transformer is located</p>
          <p>• {editMode ? 'Update' : 'Save'} the location</p>
        </div>
        
        <div className="location-info">
          {selectedLocation && (
            <div className="info-card">
              <h4>📍 {editMode ? 'New' : 'Selected'} Location</h4>
              <div className="info-row">
                <span className="info-label">Address:</span>
                <span className="info-value">{selectedAddress}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Coordinates:</span>
                <span className="info-value">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </span>
              </div>
              
              <button
                className="btn-primary save-btn"
                onClick={saveLocation}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    {editMode ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editMode ? 'Update Location' : 'Save Location'}
                  </>
                )}
              </button>
            </div>
          )}
          
          {transformer.latitude && transformer.longitude && !selectedLocation && (
            <div className="info-card existing-location">
              <h4>✅ Current Location</h4>
              <div className="info-row">
                <span className="info-label">Address:</span>
                <span className="info-value">{transformer.address || 'Not available'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Coordinates:</span>
                <span className="info-value">
                  {parseFloat(transformer.latitude).toFixed(6)}, {parseFloat(transformer.longitude).toFixed(6)}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                Click on the map to set a new location
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="map-container">
        <div ref={mapRef} className="map"></div>
        <div className="map-overlay">
          <h4>🎯 Click to {editMode ? 'Update' : 'Set'} Location</h4>
          <p>Click exactly where the transformer is located</p>
        </div>
      </div>
    </div>
  );
};

export default TransformerLocationPage;