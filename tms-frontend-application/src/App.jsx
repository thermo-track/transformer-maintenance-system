import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import LoginPage from './features/auth/LoginPage.jsx';
import RegisterPage from './features/auth/RegisterPage.jsx';
import VerifyOtpPage from './features/auth/VerifyOtpPage.jsx';
import AdminRegisterPage from './features/auth/AdminRegisterPage.jsx';
import AdminApprovalsPage from './features/admin/AdminApprovalsPage.jsx';
import ModelRetrainingPage from './features/admin/ModelRetrainingPage.jsx';
import Transformer from './features/transformers/pages/Transformer.jsx';
import InspectionsST from './features/maintenance/pages/InspectionsST.jsx';
import InspectionsPage from './features/maintenance/pages/Inspections.jsx';
import InspectionsSTImage from "./features/maintenance/pages/InspectionsSTImage.jsx";
import BaselineImage from "./features/maintenance/pages/BaselineImage.jsx";
import TransformerLocations from "./features/maintenance/pages/TransformerLocation.jsx";
import TransformerLocationPage from './features/transformers/components/TransformerLocationPage.jsx';
import TransformerLocationWrapper from './features/transformers/components/TransformerLocationWrapper';
import TransformersMapWrapper from './features/transformers/components/TransformersMapWrapper';
import UserSettings from './components/UserSettings/UserSettings.jsx';
import AnnotationPage from './pages/AnnotationPage.jsx';

import './App.css';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      
      {/* Admin registration routes */}
      <Route path="/admin/register" element={<AdminRegisterPage />} />
      <Route path="/admin/verify-otp" element={<VerifyOtpPage />} />
      
      {/* Protected routes with Layout */}
      <Route path="/" element={
        <PrivateRoute>
          <Layout>
            <Navigate to="/transformers" replace />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/transformers" element={
        <PrivateRoute>
          <Layout>
            <Transformer />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/inspections" element={
        <PrivateRoute>
          <Layout>
            <InspectionsPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/transformer/:transformerNo" element={
        <PrivateRoute>
          <Layout>
            <InspectionsST />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/transformer/:transformerNo/:inspectionId/image" element={
        <PrivateRoute>
          <Layout>
            <InspectionsSTImage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/annotations/:inspectionId" element={
        <PrivateRoute>
          <Layout>
            <AnnotationPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/transformer/:transformerId/baseimage" element={
        <PrivateRoute>
          <Layout>
            <BaselineImage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/transformers/locations" element={
        <PrivateRoute>
          <Layout>
            <TransformerLocations />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/transformers/:transformerNo/location" element={
        <PrivateRoute>
          <Layout>
            <TransformerLocationWrapper />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/transformers/map" element={
        <PrivateRoute>
          <Layout>
            <TransformersMapWrapper />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/settings/user" element={
        <PrivateRoute>
          <Layout>
            <UserSettings />
          </Layout>
        </PrivateRoute>
      } />
      
      {/* Admin routes */}
      <Route path="/admin/approvals" element={
        <PrivateRoute>
          <Layout>
            <AdminApprovalsPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/admin/model-retraining" element={
        <PrivateRoute>
          <Layout>
            <ModelRetrainingPage />
          </Layout>
        </PrivateRoute>
      } />
      
      {/* Regular users can view annotation history (read-only) */}
      <Route path="/annotation-history" element={
        <PrivateRoute>
          <Layout>
            <ModelRetrainingPage />
          </Layout>
        </PrivateRoute>
      } />
      
      {/* 404 */}
      <Route path="*" element={<p>Not found</p>} />
    </Routes>
  );
}