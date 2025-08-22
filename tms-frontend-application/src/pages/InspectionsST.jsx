import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import '../styles/global.css';
import '../styles/inspections.css';
import InspectionModal from '../components/InspectionModal';
import { inspectionService } from '../services/inspectionService';
import InspectionsTable from '../components/InspectionsTableST';
import FilterSection from '../components/FilterSection';
import Pagination from '../components/Pagination';
import PageHeaderST from '../components/PageHeaderST.jsx';

function InspectionsST() {
  const { transformerId } = useParams();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    selectedStatus: '',
    startDate: '',
    endDate: ''
  });

  const branches = ['KANDY', 'COLOMBO', 'GALLE', 'JAFFNA', 'MATARA', 'KURUNEGALA', 'ANURADHAPURA'];
  const statuses = ['Completed', 'In Progress', 'Pending', 'Scheduled'];


  useEffect(() => {
    console.log("Transformer ID passed:", transformerId);
    if (transformerId) {
      fetchInspectionsByTransformer(transformerId);
    }
  }, [transformerId]);

  // Modified to fetch inspections for specific transformer
// Modified fetchInspectionsByTransformer method
const fetchInspectionsByTransformer = async (transformerId) => {
  try {
    setLoading(true);
    // Call the service method with transformer ID
    const data = await inspectionService.getInspectionsByTransformer(transformerId);
    
    console.log('Raw data from backend:', data); // Debug log
    
    // Add dummy data for fields not in backend
    const enrichedData = data.map(inspection => ({
      ...inspection,
      // Make sure to combine date and time if needed
      inspectedDateTime: inspection.inspectedDateTime || 
        combineDateTime(inspection.dateOfInspection, inspection.timeOfInspection),
      // Add maintenance date/time - THIS IS THE KEY ADDITION
      maintenanceDateTime: getRandomMaintenanceDateTime(),
      inspectorName: getRandomInspector(),
      status: getRandomStatus(),
      priority: getRandomPriority(),
      findings: getRandomFindings(),
      nextInspectionDate: getNextInspectionDate(inspection.dateOfInspection),
      location: getRandomLocation(),
      weather: getRandomWeather(),
      duration: getRandomDuration()
    }));
    
    console.log('Enriched data with maintenance:', enrichedData); // Debug log
    
    setInspections(enrichedData);
  } catch (error) {
    console.error('Error fetching inspections for transformer:', error);
    // Fallback to filtered mock data if API fails
    const mockData = getMockData();
    const filteredMockData = mockData.filter(inspection => 
      inspection.transformerId === transformerId
    );
    setInspections(filteredMockData);
  } finally {
    setLoading(false);
  }
};

  // Fallback method for all inspections (if needed)
  const fetchInspections = async () => {
    try {
      setLoading(true);
      const data = await inspectionService.getAllInspections();
      
      // Filter by transformer ID on frontend if backend doesn't support it
      const transformerInspections = transformerId ? 
        data.filter(inspection => inspection.transformerId === transformerId) : 
        data;
      
      const enrichedData = transformerInspections.map(inspection => ({
        ...inspection,
        // Combine existing date and time
        inspectedDateTime: combineDateTime(inspection.dateOfInspection, inspection.timeOfInspection),
        // Add dummy maintenance date
        maintenanceDateTime: getRandomMaintenanceDateTime(),
        inspectorName: getRandomInspector(),
        status: getRandomStatus(),
        priority: getRandomPriority(),
        findings: getRandomFindings(),
        nextInspectionDate: getNextInspectionDate(inspection.dateOfInspection),
        location: getRandomLocation(),
        weather: getRandomWeather(),
        duration: getRandomDuration()
      }));
      
      setInspections(enrichedData);
    } catch (error) {
      console.error('Error fetching inspections:', error);
      setInspections(getMockData().filter(inspection => 
        inspection.transformerId === transformerId
      ));
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for dummy data (unchanged)
  const getRandomInspector = () => {
    const inspectors = ['John Silva', 'Mary Fernando', 'David Perera', 'Sarah Wickramasinghe', 'Mike Rajapaksa'];
    return inspectors[Math.floor(Math.random() * inspectors.length)];
  };

  const getRandomStatus = () => {
    const statuses = ['Completed', 'In Progress', 'Pending', 'Scheduled'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getRandomPriority = () => {
    const priorities = ['High', 'Medium', 'Low'];
    return priorities[Math.floor(Math.random() * priorities.length)];
  };

  const getRandomFindings = () => {
    const findings = [
      'All systems normal',
      'Minor maintenance required',
      'Oil level low',
      'Temperature sensors need calibration',
      'Cooling system working efficiently',
      'Electrical connections secure'
    ];
    return findings[Math.floor(Math.random() * findings.length)];
  };

  const getNextInspectionDate = (currentDate) => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + 6);
    return date.toISOString().split('T')[0];
  };

  const getRandomLocation = () => {
    const locations = [
      'Main Distribution Center',
      'Substation A-12',
      'Industrial Zone',
      'Residential Area Block 5',
      'Commercial District',
      'Power Grid Station 7'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  };

  const getRandomWeather = () => {
    const weather = ['Clear', 'Rainy', 'Cloudy', 'Sunny', 'Overcast'];
    return weather[Math.floor(Math.random() * weather.length)];
  };

  const getRandomDuration = () => {
    const durations = ['2.5 hrs', '3 hrs', '4 hrs', '1.5 hrs', '5 hrs'];
    return durations[Math.floor(Math.random() * durations.length)];
  };

  const getRandomMaintenanceDateTime = () => {
    const maintenanceDates = [
        '2024-03-15T09:30:00',
        '2024-04-22T14:15:00',
        '2024-05-10T11:00:00',
        '2024-06-18T16:45:00',
        '2024-07-25T08:20:00',
        '2024-08-12T13:30:00',
        'Not scheduled'
    ];
    
    const randomDate = maintenanceDates[Math.floor(Math.random() * maintenanceDates.length)];
    
    if (randomDate === 'Not scheduled') {
        return 'Not scheduled';
    }
    
    const dateObj = new Date(randomDate);
    const options = {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    
    return dateObj.toLocaleDateString('en-US', options);
    };

    // Add this to combine inspection date and time
    const combineDateTime = (date, time) => {
    return new Date(`${date}T${time}`).toISOString();
    };


  // Mock data function (you'll need to implement this)
  const getMockData = () => {
    // Return your mock inspection data here
    return [];
  };

  const handleCreate = async (formData) => {
    try {
      // Make sure to include the transformer ID in the form data
      const inspectionData = {
        ...formData,
        transformerId: transformerId
      };
      await inspectionService.createInspection(inspectionData);
      fetchInspectionsByTransformer(transformerId);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating inspection:', error);
      alert('Error creating inspection. Please try again.');
    }
  };

  const handleEdit = async (formData) => {
    try {
      await inspectionService.updateInspection(selectedInspection.inspectionId, formData);
      fetchInspectionsByTransformer(transformerId);
      setShowEditModal(false);
      setSelectedInspection(null);
    } catch (error) {
      console.error('Error updating inspection:', error);
      alert('Error updating inspection. Please try again.');
    }
  };

  const handleDelete = async (inspectionId) => {
    if (window.confirm('Are you sure you want to delete this inspection?')) {
      try {
        await inspectionService.deleteInspection(inspectionId);
        fetchInspectionsByTransformer(transformerId);
      } catch (error) {
        console.error('Error deleting inspection:', error);
        alert('Error deleting inspection. Please try again.');
      }
    }
  };

// 2. Update your filteredInspections logic
const filteredInspections = inspections.filter(inspection => {
  const matchesSearch = filters.searchTerm === '' || 
    inspection.transformerId.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
    inspection.inspectionId.includes(filters.searchTerm) ||
    inspection.inspectorName.toLowerCase().includes(filters.searchTerm.toLowerCase());
  
  // Changed from matchesBranch to matchesStatus
  const matchesStatus = filters.selectedStatus === '' || 
    inspection.status.toLowerCase() === filters.selectedStatus.toLowerCase();
  
  const matchesDateRange = (!filters.startDate || inspection.dateOfInspection >= filters.startDate) &&
    (!filters.endDate || inspection.dateOfInspection <= filters.endDate);
  
  // Updated to use matchesStatus instead of matchesBranch
  return matchesSearch && matchesStatus && matchesDateRange;
});

  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentInspections = filteredInspections.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="inspections-page">
      <PageHeaderST 
        onNewInspection={() => setShowCreateModal(true)} 
        transformerId={transformerId} 
      />
      
      {showCreateModal && (
        <InspectionModal
          title="Create New Inspection"
          inspection={null}
          branches={branches}
          transformerId={transformerId} // Pass transformer ID to modal
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      
      <FilterSection 
        filters={filters}
        setFilters={setFilters}
        statuses={statuses}
      />

      <h2>Inspections for Transformer {transformerId}</h2>
      
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