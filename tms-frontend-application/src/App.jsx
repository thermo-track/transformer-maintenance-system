import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import List from './features/transformers/pages/List.jsx';
import Create from './features/transformers/pages/Create.jsx';
import Edit from './features/transformers/pages/Edit.jsx';
import InspectionsST from './features/maintenance/pages/InspectionsST.jsx';
import InspectionsPage from './features/maintenance/pages/Inspections.jsx';
import InspectionsSTImage from "./features/maintenance/pages/InspectionsSTImage.jsx";
import './App.css';
import avatar from './assets/pic.jpg'

export default function App() {
  return (
    <Layout>
      {/* Persistent user corner */}
      {/* <UserCorner /> */}

      <Routes>
        <Route path="/" element={<Navigate to="/transformers" replace />} />
        <Route path="/transformers" element={<List />} />
        <Route path="/inspections" element={<InspectionsPage />} />
        <Route path="/transformers/new" element={<Create />} />
        <Route path="/transformer/:transformerNo" element={<InspectionsST />} />
        <Route path="/transformer/:id/edit" element={<Edit />} />
        <Route path="*" element={<p>Not found</p>} />
        <Route path="/transformer/:transformerNo/:inspectionId/image" element={<InspectionsSTImage />} />
      </Routes>
    </Layout>
  );
}