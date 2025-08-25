import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Transformer from './features/transformers/pages/Transformer.jsx';
import InspectionsST from './features/maintenance/pages/InspectionsST.jsx';
import InspectionsPage from './features/maintenance/pages/Inspections.jsx';
import InspectionsSTImage from "./features/maintenance/pages/InspectionsSTImage.jsx";
import BaselineImage from "./features/maintenance/pages/BaseLineImage.jsx";
import TransformerLocations from "./features/maintenance/pages/TransformerLocation.jsx";
import TransformerLocationPage from './features/transformers/components/TransformerLocationPage.jsx';
import TransformerLocationWrapper from './features/transformers/components/TransformerLocationWrapper';
import TransformersMapWrapper from './features/transformers/components/TransformersMapWrapper';

import './App.css';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/transformers" replace />} />
        <Route path="/transformers" element={<Transformer />} />
        <Route path="/inspections" element={<InspectionsPage />} />
        <Route path="/transformer/:transformerNo" element={<InspectionsST />} />
        <Route path="*" element={<p>Not found</p>} />
        <Route path="/transformer/:transformerNo/:inspectionId/image" element={<InspectionsSTImage />} />
        <Route path="/transformer/:transformerNo/baseimage" element={<BaselineImage />} />
        <Route path="/transformers/locations" element={<TransformerLocations />} />
        <Route path="/transformers/:transformerNo/location" element={<TransformerLocationWrapper />} />
        <Route path="/transformers/map" element={<TransformersMapWrapper />} />
      </Routes>
    </Layout>
  );
}