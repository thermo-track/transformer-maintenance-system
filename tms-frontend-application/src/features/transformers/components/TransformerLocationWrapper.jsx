// src/features/transformers/components/TransformerLocationWrapper.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transformerService } from '../services/LocationService';
import TransformerLocationPage from './TransformerLocationPage';
import TransformerLocationView from './TransformerLocationView';
import { Loader2 } from 'lucide-react';

export default function TransformerLocationWrapper() {
  const { transformerNo } = useParams();
  const navigate = useNavigate();
  const [transformer, setTransformer] = useState(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    console.log('🚀 TransformerLocationWrapper mounted with transformerNo:', transformerNo);
    checkTransformerLocation();
  }, [transformerNo]);

  const checkTransformerLocation = async () => {
    console.log('🔄 Starting checkTransformerLocation for:', transformerNo);
    
    try {
      setIsLoading(true);
      console.log('⏳ Setting loading state to true');
      
      // Use the enhanced service method for detailed checking
      const data = await transformerService.getTransformerWithLocationCheck(transformerNo);
      console.log('📥 Received transformer data with location check:', {
        found: !!data,
        transformerNo: data?.transformerNo,
        id: data?.id,
        hasLocation: data?.hasLocation,
        embeddedLocationExists: data?.embeddedLocationExists,
        hasDedicatedLocation: !!data?.dedicatedLocationData,
        latitude: data?.latitude,
        longitude: data?.longitude,
        address: data?.address,
        fullData: data
      });
      
      if (!data) {
        console.error('❌ No transformer data returned');
        alert('Transformer not found');
        return;
      }
      
      // Enhanced transformer object creation - ensure location data is properly included
      const enhancedTransformer = {
        ...data,
        // Explicitly include coordinates from dedicatedLocationData if available
        latitude: data.latitude || data.dedicatedLocationData?.latitude,
        longitude: data.longitude || data.dedicatedLocationData?.longitude,
        address: data.address || data.dedicatedLocationData?.address
      };
      
      console.log('🔧 Enhanced transformer object:', {
        original: data,
        enhanced: enhancedTransformer,
        hasCoordinatesNow: !!(enhancedTransformer.latitude && enhancedTransformer.longitude),
        coordinateSource: data.latitude ? 'direct' : (data.dedicatedLocationData?.latitude ? 'dedicatedLocationData' : 'none')
      });
      
      setTransformer(enhancedTransformer);
      console.log('✅ Transformer state updated with enhanced data');
      
      // Use the enhanced location checking from service
      const hasLocationData = data.hasLocation && (enhancedTransformer.latitude && enhancedTransformer.longitude);
      
      console.log('🔍 Enhanced location analysis:', {
        serviceReportedHasLocation: data.hasLocation,
        embeddedLocationExists: data.embeddedLocationExists,
        dedicatedLocationExists: !!data.dedicatedLocationData,
        enhancedObjectHasCoords: !!(enhancedTransformer.latitude && enhancedTransformer.longitude),
        finalDecision: hasLocationData,
        latitude: {
          value: enhancedTransformer.latitude,
          type: typeof enhancedTransformer.latitude,
          exists: !!enhancedTransformer.latitude,
          notNull: enhancedTransformer.latitude !== null,
          notEmpty: enhancedTransformer.latitude !== ''
        },
        longitude: {
          value: enhancedTransformer.longitude,
          type: typeof enhancedTransformer.longitude,
          exists: !!enhancedTransformer.longitude,
          notNull: enhancedTransformer.longitude !== null,
          notEmpty: enhancedTransformer.longitude !== ''
        },
        componentDecision: {
          willShowViewMode: hasLocationData && !editMode,
          willShowEditMode: !hasLocationData || editMode,
          currentEditMode: editMode
        }
      });
      
      setHasLocation(hasLocationData);
      console.log('📍 Location state updated to:', hasLocationData);
      
      console.log('🎯 Final component decision:', {
        transformerNo: enhancedTransformer.transformerNo,
        hasLocation: hasLocationData,
        editMode,
        componentToShow: hasLocationData && !editMode ? 'TransformerLocationView' : 'TransformerLocationPage'
      });
      
    } catch (error) {
      console.error('💥 Error in checkTransformerLocation:', {
        message: error.message,
        stack: error.stack,
        transformerNo,
        name: error.name
      });
      alert('Error loading transformer data: ' + error.message);
    } finally {
      setIsLoading(false);
      console.log('✅ Loading completed, isLoading set to false');
    }
  };

  const handleEditLocation = () => {
    console.log('✏️ Edit location requested for transformer:', transformer?.transformerNo);
    setEditMode(true);
    console.log('📝 Edit mode activated');
  };

  const handleDeleteLocation = async () => {
    console.log('🗑️ Delete location requested for transformer:', transformer?.transformerNo);
    
    try {
      // Call your service to delete the location using the correct method name
      await transformerService.deleteLocationByNumber(transformerNo);
      console.log('✅ Location deleted successfully');
      
      // Refresh the data and navigate back or show success message
      setHasLocation(false);
      alert('Location deleted successfully!');
      
      // Optionally navigate back to transformers list or refresh data
      checkTransformerLocation();
      
    } catch (error) {
      console.error('💥 Error deleting location:', error);
      alert('Failed to delete location: ' + error.message);
    }
  };

  const handleLocationUpdated = () => {
    console.log('💾 Location updated callback triggered');
    console.log('🔄 Refreshing transformer data and exiting edit mode');
    setEditMode(false);
    checkTransformerLocation();
  };

  const handleBackToView = () => {
    console.log('◀️ Back to view requested');
    setEditMode(false);
    console.log('🔄 Refreshing data in case it was updated');
    checkTransformerLocation();
  };

  console.log('🎨 Render decision:', {
    isLoading,
    hasTransformer: !!transformer,
    hasLocation,
    editMode,
    willRenderLoading: isLoading,
    willRenderError: !isLoading && !transformer,
    willRenderView: !isLoading && transformer && hasLocation && !editMode,
    willRenderEdit: !isLoading && transformer && (!hasLocation || editMode)
  });

  if (isLoading) {
    console.log('🔄 Rendering loading component');
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
    console.log('❌ Rendering error component - no transformer found');
    return (
      <div className="transformer-locations-container">
        <div className="error-container">
          <p>Transformer not found</p>
        </div>
      </div>
    );
  }

  // If transformer has location and we're not in edit mode, show the view component
  if (hasLocation && !editMode) {
    console.log('👁️ Rendering TransformerLocationView component with data:', {
      transformerNo: transformer.transformerNo,
      hasCoordinates: !!(transformer.latitude && transformer.longitude),
      coordinates: `${transformer.latitude}, ${transformer.longitude}`,
      validCoordinates: !isNaN(parseFloat(transformer.latitude)) && !isNaN(parseFloat(transformer.longitude)),
      fullTransformerObject: transformer
    });
    
    // Additional safety check
    if (!transformer.latitude || !transformer.longitude) {
      console.error('❌ Transformer marked as having location but coordinates are missing:', {
        transformer,
        hasLatitude: !!transformer.latitude,
        hasLongitude: !!transformer.longitude,
        latValue: transformer.latitude,
        lngValue: transformer.longitude
      });
      // Force edit mode if coordinates are missing
      setEditMode(true);
      return (
        <TransformerLocationPage 
          transformer={transformer}
          editMode={true}
          onLocationUpdated={handleLocationUpdated}
          onBackToView={handleBackToView}
        />
      );
    }
    
    return (
      <TransformerLocationView 
        transformer={transformer}
        onEditLocation={handleEditLocation}
        onDeleteLocation={handleDeleteLocation}
      />
    );
  }

  // Otherwise, show the location setting/editing component
  console.log('✏️ Rendering TransformerLocationPage component in', hasLocation ? 'EDIT' : 'CREATE', 'mode');
  return (
    <TransformerLocationPage 
      transformer={transformer}
      editMode={hasLocation} // Pass whether this is edit mode or not
      onLocationUpdated={handleLocationUpdated}
      onBackToView={hasLocation ? handleBackToView : null}
    />
  );
}