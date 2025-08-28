// TransformersMapView.jsx - Clean version with custom markers and separate CSS
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Zap, Factory, Eye, Navigation, ExternalLink } from 'lucide-react';
import '../styles/transformers-map-view.css'; // Import the separate CSS file

export default function TransformersMapView({ transformerService }) {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const mapContainerIdRef = useRef(`transformers-map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [transformers, setTransformers] = useState([]);
  const [loadingTransformers, setLoadingTransformers] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransformer, setSelectedTransformer] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [mapInitialized, setMapInitialized] = useState(false);

  // Get unique regions for filter
  const uniqueRegions = [...new Set(transformers.map(t => t.region))].filter(Boolean);

  // Filter transformers based on selected filters
  const filteredTransformers = transformers.filter(transformer => {
    const typeMatch = filterType === 'ALL' || transformer.type === filterType;
    const regionMatch = filterRegion === 'ALL' || transformer.region === filterRegion;
    return typeMatch && regionMatch;
  });

  // Stats for display
  const stats = {
    total: transformers.length,
    distribution: transformers.filter(t => t.type === 'Distribution').length,
    bulk: transformers.filter(t => t.type === 'Bulk').length,
    regions: uniqueRegions.length
  };

  // Load transformers on mount
  useEffect(() => {
    if (transformerService && typeof transformerService.getAllTransformersForMap === 'function') {
      loadTransformers();
    } else {
      setError('TransformerService not available. Please check your service configuration.');
      setLoadingTransformers(false);
    }
    
    return () => {
      cleanupMap();
    };
  }, [transformerService]);

  // Initialize map when transformers are loaded
  useEffect(() => {
    if (transformers.length > 0 && !mapInitialized) {
      initializeMap();
    }
  }, [transformers, mapInitialized]);

  // Update markers when filters change
  useEffect(() => {
    if (mapInitialized && mapInstanceRef.current) {
      updateMapMarkers();
    }
  }, [filterType, filterRegion, mapInitialized]);

  const loadTransformers = async () => {
    try {
      setLoadingTransformers(true);
      setError(null);
      
      if (!transformerService || typeof transformerService.getAllTransformersForMap !== 'function') {
        throw new Error('TransformerService.getAllTransformersForMap method not available');
      }
      
      const data = await transformerService.getAllTransformersForMap();
      setTransformers(data);
      
      if (data.length === 0) {
        setError('No transformers with location data found');
      }
    } catch (error) {
      setError(error.message || 'Failed to load transformer locations');
    } finally {
      setLoadingTransformers(false);
    }
  };

  const cleanupMap = () => {
    // Clear existing markers
    if (markersRef.current && markersRef.current.length > 0) {
      markersRef.current.forEach((marker) => {
        try {
          if (marker && typeof marker.remove === 'function') {
            marker.remove();
          }
        } catch (e) {
          console.warn('Error removing marker:', e);
        }
      });
      markersRef.current = [];
    }

    // Clean up map instance
    if (mapInstanceRef.current) {
      try {
        if (typeof mapInstanceRef.current.off === 'function') {
          mapInstanceRef.current.off();
        }
        if (typeof mapInstanceRef.current.remove === 'function') {
          mapInstanceRef.current.remove();
        }
        mapInstanceRef.current = null;
        setMapInitialized(false);
      } catch (error) {
        console.warn('Error during map cleanup:', error);
        mapInstanceRef.current = null;
        setMapInitialized(false);
      }
    }
  };

  // Create custom icon based on transformer type
  const createCustomIcon = (transformerType) => {
    const iconHtml = transformerType === 'Distribution' 
      ? `<div class="map-custom-distribution-icon"></div>`
      : `<div class="map-custom-bulk-icon"></div>`;

    return window.L.divIcon({
      html: iconHtml,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  };

  const loadLeafletAndInitMap = async () => {
    try {
      // Check if Leaflet is already loaded
      if (window.L) {
        return createMapInstance();
      }

      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }

      // Load Leaflet JavaScript
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.crossOrigin = 'anonymous';

      return new Promise((resolve, reject) => {
        script.onload = () => {
          resolve(createMapInstance());
        };
        script.onerror = (error) => {
          reject(new Error('Failed to load Leaflet library'));
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      throw error;
    }
  };

  const createMapInstance = () => {
    try {
      if (!mapRef.current) {
        throw new Error('Map container ref not available');
      }

      if (!window.L) {
        throw new Error('Leaflet library not loaded');
      }

      // Set the container ID
      mapRef.current.id = mapContainerIdRef.current;

      // Sri Lanka coordinates (center of the country)
      const sriLankaCenter = [7.8731, 80.7718];
      const zoomLevel = 8;

      // Create map instance
      const map = window.L.map(mapRef.current, {
        center: sriLankaCenter,
        zoom: zoomLevel,
        zoomControl: true,
        attributionControl: true
      });

      // Add tile layer
      const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });

      tileLayer.addTo(map);

      // Store map instance
      mapInstanceRef.current = map;

      // Add map event listeners
      map.on('load', () => {
        setIsMapLoading(false);
      });

      map.on('ready', () => {
        setIsMapLoading(false);
      });

      // Force map ready after a short delay
      setTimeout(() => {
        setIsMapLoading(false);
      }, 1000);

      return map;
    } catch (error) {
      throw error;
    }
  };

  const initializeMap = async () => {
    try {
      setIsMapLoading(true);

      // Clean up any existing map
      if (mapInstanceRef.current) {
        cleanupMap();
      }

      // Load Leaflet and create map
      await loadLeafletAndInitMap();
      
      setMapInitialized(true);
      
      // Add markers for transformers
      updateMapMarkers();
      
    } catch (error) {
      setError(`Failed to initialize map: ${error.message}`);
      setIsMapLoading(false);
    }
  };

  const updateMapMarkers = () => {
    try {
      if (!mapInstanceRef.current || !window.L) {
        return;
      }

      // Clear existing markers
      markersRef.current.forEach(marker => {
        try {
          if (marker && typeof marker.remove === 'function') {
            marker.remove();
          }
        } catch (e) {
          console.warn('Error removing marker:', e);
        }
      });
      markersRef.current = [];

      // Add new markers
      let markersAdded = 0;
      let markersSkipped = 0;

      filteredTransformers.forEach((transformer) => {
        try {
          const lat = parseFloat(transformer.latitude);
          const lng = parseFloat(transformer.longitude);

          if (isNaN(lat) || isNaN(lng)) {
            markersSkipped++;
            return;
          }

          // Create custom marker based on type
          const customIcon = createCustomIcon(transformer.type);
          const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current);
          
          // Create popup content
          const typeIcon = transformer.type === 'Distribution' ? '⚡' : '🏭';
          const typeColor = transformer.type === 'Distribution' ? '#3498db' : '#e74c3c';

          const popupContent = `
            <div style="font-family: Arial, sans-serif; min-width: 200px;">
              <h3 style="margin: 0 0 10px 0; color: ${typeColor}; display: flex; align-items: center; gap: 8px;">
                ${typeIcon} ${transformer.transformerNo}
              </h3>
              <p style="margin: 5px 0;"><strong>Type:</strong> ${transformer.type}</p>
              <p style="margin: 5px 0;"><strong>Region:</strong> ${transformer.region}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
              ${transformer.address ? `<p style="margin: 5px 0;"><strong>Address:</strong> ${transformer.address}</p>` : ''}
              <div style="margin-top: 10px;">
                <button onclick="window.open('https://www.google.com/maps?q=${lat},${lng}', '_blank')" 
                        style="background: #4285f4; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px; display: inline-flex; align-items: center; gap: 4px;">
                  📍 Google Maps
                </button>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);

          // Add click event
          marker.on('click', () => {
            setSelectedTransformer(transformer);
          });

          markersRef.current.push(marker);
          markersAdded++;

        } catch (error) {
          markersSkipped++;
        }
      });

      // Fit map to markers if we have any
      if (markersAdded > 0) {
        try {
          const group = new window.L.featureGroup(markersRef.current);
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        } catch (error) {
          console.warn('Error fitting map to markers:', error);
        }
      }

    } catch (error) {
      console.error('Error updating map markers:', error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    if (type === 'type') {
      setFilterType(value);
    } else if (type === 'region') {
      setFilterRegion(value);
    }
  };

  // Show error state if service is missing
  if (!transformerService) {
    return (
      <div className="map-transformers-container">
        <div className="map-error-container">
          <h2>❌ Service Configuration Error</h2>
          <p>TransformerService prop is not provided to TransformersMapView component.</p>
          <div style={{ textAlign: 'left', background: '#f3f4f6', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
            <h3>To fix this:</h3>
            <ol>
              <li>Make sure your transformerService has the <code>getAllTransformersForMap</code> method</li>
              <li>Pass it as a prop: <code>&lt;TransformersMapView transformerService=&#123;transformerService&#125; /&gt;</code></li>
              <li>Check your route configuration</li>
            </ol>
          </div>
          <button onClick={() => navigate('/transformers')} className="map-btn-primary" style={{ marginTop: '16px' }}>
            Back to Transformers
          </button>
        </div>
      </div>
    );
  }

  if (typeof transformerService.getAllTransformersForMap !== 'function') {
    return (
      <div className="map-transformers-container">
        <div className="map-error-container">
          <h2>❌ Method Missing Error</h2>
          <p>TransformerService is missing the <code>getAllTransformersForMap</code> method.</p>
          <button onClick={() => navigate('/transformers')} className="map-btn-primary" style={{ marginTop: '16px' }}>
            Back to Transformers
          </button>
        </div>
      </div>
    );
  }

  if (loadingTransformers) {
    return (
      <div className="map-transformers-container">
        <div className="map-loading-container">
          <div className="map-loader"></div>
          <p>Loading transformer locations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-transformers-container">
        <div className="map-error-container">
          <p>❌ {error}</p>
          <button onClick={loadTransformers} className="map-btn-primary">
            Retry
          </button>
          <button 
            onClick={() => navigate('/transformers')} 
            className="map-btn-secondary"
          >
            Back to Transformers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-transformers-container">
      {/* Sidebar */}
      <div className="map-sidebar">
        <div className="map-header">
          <button 
            onClick={() => navigate('/transformers')} 
            className="map-back-btn"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="map-title">🗺️ Transformers Map</h1>
          <p className="map-subtitle">View all transformer locations</p>
        </div>

        {/* Stats */}
        <div className="map-stats-section">
          <h3>📊 Overview</h3>
          <div className="map-stats-grid">
            <div className="map-stat-item">
              <span className="map-stat-value">{stats.total}</span>
              <span className="map-stat-label">Total</span>
            </div>
            <div className="map-stat-item">
              <span className="map-stat-value distribution">{stats.distribution}</span>
              <span className="map-stat-label">⚡ Distribution</span>
            </div>
            <div className="map-stat-item">
              <span className="map-stat-value bulk">{stats.bulk}</span>
              <span className="map-stat-label">🏭 Bulk</span>
            </div>
            <div className="map-stat-item">
              <span className="map-stat-value regions">{stats.regions}</span>
              <span className="map-stat-label">Regions</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="map-filters-section">
          <h3>🔍 Filters</h3>
          
          <div className="map-filter-group">
            <label className="map-filter-label">Type:</label>
            <select 
              value={filterType} 
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="map-filter-select"
            >
              <option value="ALL">All Types</option>
              <option value="Distribution">⚡ Distribution</option>
              <option value="Bulk">🏭 Bulk</option>
            </select>
          </div>

          <div className="map-filter-group">
            <label className="map-filter-label">Region:</label>
            <select 
              value={filterRegion} 
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="map-filter-select"
            >
              <option value="ALL">All Regions</option>
              {uniqueRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected transformer info */}
        {selectedTransformer && (
          <div className="map-selected-transformer">
            <h4>📍 Selected Transformer</h4>
            <p><strong>Number:</strong> {selectedTransformer.transformerNo}</p>
            <p><strong>Type:</strong> {selectedTransformer.type}</p>
            <p><strong>Region:</strong> {selectedTransformer.region}</p>
            {selectedTransformer.address && (
              <p><strong>Address:</strong> {selectedTransformer.address}</p>
            )}
            <button 
              onClick={() => setSelectedTransformer(null)}
              className="map-clear-selection-btn"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>
      
      {/* Map Area */}
      <div className="map-main">
        {isMapLoading && (
          <div className="map-loading-overlay">
            <div className="map-loading-content">
              <div className="map-loader"></div>
              <p>Loading map...</p>
              <small>Placing {filteredTransformers.length} transformer{filteredTransformers.length !== 1 ? 's' : ''}</small>
            </div>
          </div>
        )}
        
        <div 
          ref={mapRef} 
          className="map-container"
        ></div>
        
        <div className="map-overlay-info">
          <h4>🗺️ Transformers Map</h4>
          <p>
            {filteredTransformers.length} transformer{filteredTransformers.length !== 1 ? 's' : ''} displayed
          </p>
        </div>

        {/* Legend */}
        <div className="map-legend">
          <h4>Legend</h4>
          <div className="map-legend-item">
            <div className="map-legend-marker distribution">⚡</div>
            <span>Distribution Transformer</span>
          </div>
          <div className="map-legend-item">
            <div className="map-legend-marker bulk">🏭</div>
            <span>Bulk Transformer</span>
          </div>
        </div>
      </div>
    </div>
  );
}