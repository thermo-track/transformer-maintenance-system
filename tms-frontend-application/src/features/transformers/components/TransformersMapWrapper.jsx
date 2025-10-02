// src/features/transformers/components/TransformersMapWrapper.jsx
import React from 'react';
import TransformersMapView from './TransformersMapView';
import transformerService from '../services/LocationService';

/**
 * Wrapper component that provides the transformerService to TransformersMapView
 * This keeps the routing clean and centralizes service dependencies
 */
export default function TransformersMapWrapper() {
  return (
    <TransformersMapView transformerService={transformerService} />
  );
}