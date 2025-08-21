import { useParams, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "../styles/inspections.css";
import InspectionModal from "../components/InspectionModal";
import { inspectionService } from "../services/inspectionService";
import InspectionsTable from "../components/InspectionsTableST";
import FilterSection from "../components/FilterSection";
import Pagination from "../components/Pagination";
import PageHeaderST from "../components/PageHeaderST.jsx";

function InspectionsST() {
  const { transformerNo } = useParams();
  const { state } = useLocation(); // optional: data passed from Link state
  // state may already contain: { id, transformerNo, poleNo, region, type, locationDetails }

  // --- transformer meta (from state or fetch by number) ---
  const [transformer, setTransformer] = useState(
    state && state.transformerNo ? state : null
  );
  const [tLoading, setTLoading] = useState(!(state && state.transformerNo));
  const [tError, setTError] = useState(null);

  // --- inspections data ---
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- pagination/filter/ui ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: "",
    selectedStatus: "",
    startDate: "",
    endDate: "",
  });

  const branches = [
    "KANDY",
    "COLOMBO",
    "GALLE",
    "JAFFNA",
    "MATARA",
    "KURUNEGALA",
    "ANURADHAPURA",
  ];
  const statuses = ["Completed", "In Progress", "Pending", "Scheduled"];

  // Fetch transformer meta by number if we don't have state (refresh/direct link)
  useEffect(() => {
    if (!transformerNo) return;

    if (!transformer) {
      setTLoading(true);
      fetch(
        `/api/transformers?page=0&size=1&q=${encodeURIComponent(
          transformerNo
        )}&by=transformerNo`
      )
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json(); // Page<TransformerResponse>
        })
        .then((page) => {
          const item = page?.content?.[0];
          if (!item) throw new Error("Transformer not found");
          setTransformer(item);
          setTError(null);
        })
        .catch((err) => setTError(err.message))
        .finally(() => setTLoading(false));
    } else {
      setTLoading(false);
    }
  }, [transformer, transformerNo]);

  // Load inspections for this transformer number
  useEffect(() => {
    if (!transformerNo) return;
    fetchInspectionsByTransformer(transformerNo);
  }, [transformerNo]);

  // ---- fetch inspections for a specific transformerNo ----
  const fetchInspectionsByTransformer = async (tNo) => {
    try {
      setLoading(true);
      const data = await inspectionService.getInspectionsByTransformer(tNo);

      // Enrich client-side fields (dummy data and combined date-time)
      const enrichedData = data.map((inspection) => ({
        ...inspection,
        inspectedDateTime:
          inspection.inspectedDateTime ||
          combineDateTime(inspection.dateOfInspection, inspection.timeOfInspection),
        maintenanceDateTime: getRandomMaintenanceDateTime(),
        inspectorName: getRandomInspector(),
        status: getRandomStatus(),
        priority: getRandomPriority(),
        findings: getRandomFindings(),
        nextInspectionDate: getNextInspectionDate(inspection.dateOfInspection),
        location: getRandomLocation(),
        weather: getRandomWeather(),
        duration: getRandomDuration(),
      }));

      setInspections(enrichedData);
    } catch (error) {
      console.error("Error fetching inspections for transformer:", error);
      const mockData = getMockData();
      const filteredMockData = mockData.filter(
        (inspection) => inspection.transformerNo === tNo
      );
      setInspections(filteredMockData);
    } finally {
      setLoading(false);
    }
  };

  // ---- helpers for dummy/enrichment fields ----
  const getRandomInspector = () => {
    const inspectors = [
      "John Silva",
      "Mary Fernando",
      "David Perera",
      "Sarah Wickramasinghe",
      "Mike Rajapaksa",
    ];
    return inspectors[Math.floor(Math.random() * inspectors.length)];
  };

  const getRandomStatus = () => {
    const xs = ["Completed", "In Progress", "Pending", "Scheduled"];
    return xs[Math.floor(Math.random() * xs.length)];
  };

  const getRandomPriority = () => {
    const xs = ["High", "Medium", "Low"];
    return xs[Math.floor(Math.random() * xs.length)];
  };

  const getRandomFindings = () => {
    const xs = [
      "All systems normal",
      "Minor maintenance required",
      "Oil level low",
      "Temperature sensors need calibration",
      "Cooling system working efficiently",
      "Electrical connections secure",
    ];
    return xs[Math.floor(Math.random() * xs.length)];
  };

  const getNextInspectionDate = (currentDate) => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + 6);
    return date.toISOString().split("T")[0];
  };

  const getRandomLocation = () => {
    const xs = [
      "Main Distribution Center",
      "Substation A-12",
      "Industrial Zone",
      "Residential Area Block 5",
      "Commercial District",
      "Power Grid Station 7",
    ];
    return xs[Math.floor(Math.random() * xs.length)];
  };

  const getRandomWeather = () => {
    const xs = ["Clear", "Rainy", "Cloudy", "Sunny", "Overcast"];
    return xs[Math.floor(Math.random() * xs.length)];
  };

  const getRandomDuration = () => {
    const xs = ["2.5 hrs", "3 hrs", "4 hrs", "1.5 hrs", "5 hrs"];
    return xs[Math.floor(Math.random() * xs.length)];
  };

  const getRandomMaintenanceDateTime = () => {
    const dates = [
      "2024-03-15T09:30:00",
      "2024-04-22T14:15:00",
      "2024-05-10T11:00:00",
      "2024-06-18T16:45:00",
      "2024-07-25T08:20:00",
      "2024-08-12T13:30:00",
      "Not scheduled",
    ];
    const randomDate = dates[Math.floor(Math.random() * dates.length)];
    if (randomDate === "Not scheduled") return "Not scheduled";
    const dateObj = new Date(randomDate);
    const options = {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return dateObj.toLocaleDateString("en-US", options);
  };

  const combineDateTime = (date, time) => {
    if (!date || !time) return "";
    const dt = new Date(`${date}T${time}`);
    return isNaN(dt.getTime()) ? "" : dt.toISOString();
  };

  // Mock data fallback
  const getMockData = () => {
    return [];
  };

  // ---- create / edit / delete handlers ----
  const handleCreate = async (formData) => {
    try {
      const inspectionData = {
        ...formData,
        transformerNo, // backend expects transformerNo
      };
      await inspectionService.createInspection(inspectionData);
      fetchInspectionsByTransformer(transformerNo);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating inspection:", error);
      alert("Error creating inspection. Please try again.");
    }
  };

  const handleEdit = async (formData) => {
    try {
      await inspectionService.updateInspection(
        selectedInspection.inspectionId,
        formData
      );
      fetchInspectionsByTransformer(transformerNo);
      setShowEditModal(false);
      setSelectedInspection(null);
    } catch (error) {
      console.error("Error updating inspection:", error);
      alert("Error updating inspection. Please try again.");
    }
  };

  const handleDelete = async (inspectionId) => {
    if (window.confirm("Are you sure you want to delete this inspection?")) {
      try {
        await inspectionService.deleteInspection(inspectionId);
        fetchInspectionsByTransformer(transformerNo);
      } catch (error) {
        console.error("Error deleting inspection:", error);
        alert("Error deleting inspection. Please try again.");
      }
    }
  };

  // ---- filters/pagination ----
  const filteredInspections = inspections.filter((inspection) => {
    const term = (filters.searchTerm || "").toLowerCase();

    const matchesSearch =
      term === "" ||
      (inspection.transformerNo || "").toLowerCase().includes(term) ||
      (inspection.inspectionId || "").includes(filters.searchTerm || "") ||
      (inspection.inspectorName || "").toLowerCase().includes(term);

    const matchesStatus =
      filters.selectedStatus === "" ||
      (inspection.status || "").toLowerCase() ===
        (filters.selectedStatus || "").toLowerCase();

    const matchesDateRange =
      (!filters.startDate ||
        (inspection.dateOfInspection || "") >= filters.startDate) &&
      (!filters.endDate ||
        (inspection.dateOfInspection || "") <= filters.endDate);

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentInspections = filteredInspections.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // ---- render ----
  return (
    <div className="inspections-page">
      <PageHeaderST
        onNewInspection={() => setShowCreateModal(true)}
        transformerNo={transformer.transformerNo}
        transformerLocation={transformer.locationDetails}
        transformerRegion={transformer.region}
        transformerPoleno={transformer.poleNo}
        transformerType={transformer.type}
      />

      {showCreateModal && (
        <InspectionModal
          title="Create New Inspection"
          inspection={null}
          branches={branches}
          transformerNo={transformerNo} // ensure modal/form includes transformerNo in payload
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      <FilterSection
        filters={filters}
        setFilters={setFilters}
        statuses={statuses}
      />

      <h2>Inspections for Transformer {transformer.transformerNo}</h2>

      {loading ? (
        <div>Loading inspections...</div>
      ) : (
        <InspectionsTable
          inspections={currentInspections}
          onEdit={(inspection) => {
            setSelectedInspection(inspection);
            setShowEditModal(true);
          }}
          onDelete={handleDelete}
          startIndex={startIndex}
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredInspections.length}
        startIndex={startIndex}
        onPageChange={setCurrentPage}
      />

      {showEditModal && selectedInspection && (
        <InspectionModal
          title="Edit Inspection"
          inspection={selectedInspection}
          branches={branches}
          onSubmit={handleEdit}
          onClose={() => {
            setShowEditModal(false);
            setSelectedInspection(null);
          }}
        />
      )}
    </div>
  );
}

export default InspectionsST;
