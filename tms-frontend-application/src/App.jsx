import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Transformer from './features/transformers/pages/Transformer.jsx';
import InspectionsST from './features/maintenance/pages/InspectionsST.jsx';
import InspectionsPage from './features/maintenance/pages/Inspections.jsx';
import InspectionsSTImage from "./features/maintenance/pages/InspectionsSTImage.jsx";
import BaselineImage from "./features/maintenance/pages/BaseLineImage.jsx";
import './App.css';
import avatar from './assets/pic.jpg'

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
      </Routes>
    </Layout>
  );
}