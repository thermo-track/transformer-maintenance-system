// src/features/transformers/components/TransformerLocationView.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, MapPin, Navigation, Copy, ExternalLink, Trash2 } from 'lucide-react';
import '../styles/transformer-location-view.css'; // Import the dedicated CSS file

export default function TransformerLocationView({ transformer, onEditLocation, onDeleteLocation }) {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerIdRef = useRef(`map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  const [isMapLoading, setIsMapLoading] = useState(true);

  useEffect(() => {
    // Only initialize map if we have valid transformer data with coordinates
    if (transformer && transformer.latitude && transformer.longitude) {
      console.log('🗺️ Valid transformer data received, initializing map:', {
        transformerNo: transformer.transformerNo,
        latitude: transformer.latitude,
        longitude: transformer.longitude,
        hasValidCoords: !isNaN(parseFloat(transformer.latitude)) && !isNaN(parseFloat(transformer.longitude))
      });
      loadLeafletAndInitMap();
    } else {
      console.warn('⚠️ No valid transformer coordinates available:', {
        transformer: !!transformer,
        latitude: transformer?.latitude,
        longitude: transformer?.longitude
      });
    }
    
    return () => {
      cleanupMap();
    };
  }, [transformer]); // Depend on transformer object

  const cleanupMap = () => {
    if (mapInstanceRef.current) {
      try {
        console.log('🧹 Cleaning up map instance');
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      } catch (error) {
        console.warn('⚠️ Error during map cleanup:', error);
        mapInstanceRef.current = null;
      }
    }
    if (markerRef.current) {
      markerRef.current = null;
    }
  };

  const loadLeafletAndInitMap = async () => {
    if (typeof window !== 'undefined' && !window.L) {
      try {
        console.log('📦 Loading Leaflet library...');
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

        // Add a longer delay to ensure Leaflet is fully loaded
        setTimeout(() => {
          initializeMap();
        }, 200);
        
      } catch (error) {
        console.error('💥 Failed to load Leaflet:', error);
        setIsMapLoading(false);
      }
    } else if (window.L) {
      console.log('📦 Leaflet already loaded, initializing map...');
      // Add small delay even when Leaflet is already loaded
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
  };

  const initializeMap = () => {
    if (!window.L) {
      console.error('❌ Leaflet not available');
      setIsMapLoading(false);
      return;
    }

    if (!mapRef.current) {
      console.error('❌ Map container ref not available');
      setIsMapLoading(false);
      return;
    }

    if (!transformer || !transformer.latitude || !transformer.longitude) {
      console.error('❌ No valid transformer data for map initialization:', {
        transformer: !!transformer,
        latitude: transformer?.latitude,
        longitude: transformer?.longitude
      });
      setIsMapLoading(false);
      return;
    }

    // Clean up any existing map first
    cleanupMap();

    try {
      const lat = parseFloat(transformer.latitude);
      const lng = parseFloat(transformer.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.error('❌ Invalid coordinates:', {
          latitude: transformer.latitude,
          longitude: transformer.longitude,
          parsedLat: lat,
          parsedLng: lng
        });
        setIsMapLoading(false);
        return;
      }
      
      console.log('🗺️ Initializing view map for transformer:', transformer.transformerNo, 'at:', lat, lng);
      
      // Clear the map container and reset its state
      mapRef.current.innerHTML = '';
      mapRef.current.id = mapContainerIdRef.current;
      
      // Remove any Leaflet-related classes or attributes that might interfere
      mapRef.current.className = 'map';
      mapRef.current.removeAttribute('data-leaflet-map');
      
      // Wait a moment before creating the map to ensure container is ready
      setTimeout(() => {
        try {
          // Double-check that we don't already have a map instance
          if (mapInstanceRef.current) {
            console.log('🧹 Found existing map instance, cleaning up before creating new one');
            cleanupMap();
          }

          const map = window.L.map(mapRef.current, {
            center: [lat, lng],
            zoom: 16,
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            touchZoom: true
          });

          // Store map reference immediately
          mapInstanceRef.current = map;

          // Add tile layer
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            tileSize: 256,
            zoomOffset: 0
          }).addTo(map);

          map.whenReady(() => {
            console.log('✅ View map is ready');
            
            // Add transformer location marker with a slight delay to ensure everything is ready
            setTimeout(() => {
              addTransformerMarker(lat, lng);
              map.invalidateSize();
              setIsMapLoading(false);
              console.log('🎯 Map initialization completed successfully');
            }, 150);
          });

          // Handle map events
          map.on('error', (e) => {
            console.error('🗺️ Map error:', e);
          });
          
        } catch (error) {
          console.error('💥 Error creating map:', error);
          setIsMapLoading(false);
          
          // If we get the "already initialized" error, try to clean up and retry once
          if (error.message.includes('already initialized')) {
            console.log('🔄 Attempting to recover from "already initialized" error');
            cleanupMap();
            // Generate a new unique container ID
            mapContainerIdRef.current = `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            mapRef.current.id = mapContainerIdRef.current;
            
            // Try one more time after a longer delay
            setTimeout(() => {
              try {
                const retryMap = window.L.map(mapRef.current, {
                  center: [lat, lng],
                  zoom: 16,
                  zoomControl: true,
                  scrollWheelZoom: true,
                  doubleClickZoom: true,
                  touchZoom: true
                });

                mapInstanceRef.current = retryMap;

                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '© OpenStreetMap contributors',
                  maxZoom: 19,
                  tileSize: 256,
                  zoomOffset: 0
                }).addTo(retryMap);

                retryMap.whenReady(() => {
                  setTimeout(() => {
                    addTransformerMarker(lat, lng);
                    retryMap.invalidateSize();
                    setIsMapLoading(false);
                    console.log('🎯 Map recovery successful');
                  }, 150);
                });
              } catch (retryError) {
                console.error('💥 Map recovery failed:', retryError);
                setIsMapLoading(false);
              }
            }, 500);
          }
        }
      }, 100);
      
    } catch (error) {
      console.error('💥 Error initializing view map:', error);
      setIsMapLoading(false);
    }
  };

  const addTransformerMarker = (lat, lng) => {
    console.log('📍 Attempting to add marker at:', lat, lng);
    console.log('🔍 Map instance available:', !!mapInstanceRef.current);
    console.log('🔍 Leaflet available:', !!window.L);
    
    if (!mapInstanceRef.current || !window.L) {
      console.error('❌ Cannot add marker: map or Leaflet not available', {
        mapInstance: !!mapInstanceRef.current,
        leaflet: !!window.L,
        windowL: window.L
      });
      return;
    }

    try {
      console.log('🎨 Creating transformer icon...');
      const transformerIcon = window.L.divIcon({
        html: `<div style="
          background: linear-gradient(135deg, #27ae60, #229954);
          width: 35px; height: 35px; border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: bold; font-size: 18px;
          position: relative;
        ">⚡</div>`,
        iconSize: [43, 43],
        iconAnchor: [21, 21],
        popupAnchor: [0, -21]
      });

      console.log('🎯 Adding marker to map...');
      markerRef.current = window.L.marker([lat, lng], { 
        icon: transformerIcon 
      }).addTo(mapInstanceRef.current)
      .bindPopup(`
        <div style="text-align: center; padding: 5px;">
          <strong style="color: #27ae60;">⚡ Transformer ${transformer.transformerNo}</strong><br/>
          <small style="color: #666;">Pole: ${transformer.poleNo || 'N/A'}</small><br/>
          <small style="color: #666;">${transformer.region || 'No region'}</small>
        </div>
      `);

      console.log('✅ Marker added successfully at:', lat, lng);
    } catch (error) {
      console.error('💥 Error adding marker:', {
        error: error.message,
        stack: error.stack,
        lat,
        lng,
        mapInstance: !!mapInstanceRef.current,
        leaflet: !!window.L
      });
    }
  };

  const handleDeleteLocation = () => {
    if (!onDeleteLocation) {
      console.error('❌ onDeleteLocation function not provided');
      alert('Delete function not available');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the location for Transformer ${transformer.transformerNo}?\n\nThis action cannot be undone.`
    );
    
    if (confirmDelete) {
      onDeleteLocation();
    }
  };

  const copyCoordinates = () => {
    const coordinates = `${transformer.latitude}, ${transformer.longitude}`;
    navigator.clipboard.writeText(coordinates).then(() => {
      alert('Coordinates copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy coordinates');
    });
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${transformer.latitude},${transformer.longitude}`;
    window.open(url, '_blank');
  };

  const openInDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${transformer.latitude},${transformer.longitude}`;
    window.open(url, '_blank');
  };

  // Show loading if we don't have transformer data yet
  if (!transformer) {
    return (
      <div className="transformer-view-container">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading transformer data...</p>
        </div>
      </div>
    );
  }

  // Show error if we don't have valid coordinates
  if (!transformer.latitude || !transformer.longitude || isNaN(parseFloat(transformer.latitude)) || isNaN(parseFloat(transformer.longitude))) {
    return (
      <div className="transformer-view-container">
        <div className="error-container">
          <p>❌ Invalid location data for transformer {transformer.transformerNo}</p>
          <p>Coordinates: {transformer.latitude}, {transformer.longitude}</p>
          <button onClick={onEditLocation} className="btn-primary">
            Set Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transformer-view-container">
      <div className="transformer-view-sidebar">
        <div className="transformer-view-header">
          <button 
            onClick={() => navigate('/transformers')} 
            className="transformer-view-back-btn"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="transformer-view-title">📍 Transformer Location</h1>
          <p className="transformer-view-subtitle">Current location details</p>
        </div>

        {/* Transformer Info */}
        <div className="transformer-details-card">
          <h3>📋 Transformer Details</h3>
          <div className="transformer-detail-row">
            <span className="transformer-detail-label">Number:</span>
            <span className="transformer-detail-value">{transformer.transformerNo}</span>
          </div>
          <div className="transformer-detail-row">
            <span className="transformer-detail-label">Pole:</span>
            <span className="transformer-detail-value">{transformer.poleNo || 'N/A'}</span>
          </div>
          <div className="transformer-detail-row">
            <span className="transformer-detail-label">Region:</span>
            <span className="transformer-detail-value">{transformer.region || 'No region'}</span>
          </div>
          <div className="transformer-detail-row">
            <span className="transformer-detail-label">Type:</span>
            <span className="transformer-detail-value">{transformer.type || 'N/A'}</span>
          </div>
        </div>

        {/* Location Information */}
        <div className="location-info-section">
          <div className="location-info-card">
            <h4>📍 Current Location</h4>
            <div className="location-detail-row">
              <span className="location-detail-label">Address:</span>
              <span className="location-detail-value">{transformer.address || 'Address not available'}</span>
            </div>
            <div className="location-detail-row">
              <span className="location-detail-label">Coordinates:</span>
              <span className="location-detail-value">
                {parseFloat(transformer.latitude).toFixed(6)}, {parseFloat(transformer.longitude).toFixed(6)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons-section">
          <div className="primary-actions">
            <button
              className="edit-location-btn"
              onClick={onEditLocation}
            >
              <Edit size={16} />
              Edit Location
            </button>

            <button
              className="delete-location-btn"
              onClick={handleDeleteLocation}
              title="Delete location data"
            >
              <Trash2 size={16} />
              Delete Location
            </button>
          </div>

          <div className="quick-actions">
            <button
              className="quick-action-btn"
              onClick={copyCoordinates}
              title="Copy coordinates"
            >
              <Copy size={16} />
              Copy Coordinates
            </button>

            <button
              className="quick-action-btn"
              onClick={openInGoogleMaps}
              title="Open in Google Maps"
            >
              <ExternalLink size={16} />
              Open in Google Maps
            </button>

            <button
              className="quick-action-btn"
              onClick={openInDirections}
              title="Get directions"
            >
              <Navigation size={16} />
              Get Directions
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="instructions-section">
          <h3 className="instructions-title">🗺️ Map Controls</h3>
          <ul className="instructions-list">
            <li>Use mouse wheel to zoom in/out</li>
            <li>Click and drag to pan around the map</li>
            <li>Click the transformer marker for details</li>
            <li>Use action buttons for quick navigation</li>
          </ul>
        </div>
      </div>
      
      <div className="map-container">
        {isMapLoading && (
          <div className="map-loading-overlay">
            <div className="loading-content">
              <div className="loader"></div>
              <p>Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="map"></div>
        <div className="map-overlay">
          <h4>📍 Transformer Location</h4>
          <p>Transformer {transformer.transformerNo} is located here</p>
        </div>
      </div>
    </div>
  );
}