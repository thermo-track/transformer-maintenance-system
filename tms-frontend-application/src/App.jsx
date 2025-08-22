//<Route> Defines a specific URL path and the component to render.
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Inspection from "./pages/Inspections";
import InspectionsST from "./pages/InspectionsST";
import InspectionsSTImage from "./pages/InspectionsSTImage.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* All inspections */}
        <Route path="/inspections" element={<Inspection/>} />

        {/* Inspections for a single transformer */}
        <Route path="/inspections/:transformerId" element={<InspectionsST />} />
        {/* Inspections for a single transformer */}
        <Route path="/inspections/:transformerId/:inspectionId/image" element={<InspectionsSTImage />} />
      </Routes>
    </Router>
  );
}

export default App;
