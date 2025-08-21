// components/InspectionsPage.js
import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import InspectionsTable from '../components/InspectionsTable';
import InspectionModal from '../components/InspectionModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { inspectionService } from '../services/inspectionService';
import '../styles/inspections.css';

const InspectionsPage = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    selectedBranch: '',
    startDate: '',
    endDate: ''
  });

  const branches = ['KANDY', 'COLOMBO', 'GALLE', 'JAFFNA', 'MATARA', 'KURUNEGALA', 'ANURADHAPURA'];

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const data = await inspectionService.getAllInspections();
      
      // Add dummy data for fields not in backend
      const enrichedData = data.map(inspection => ({
        ...inspection,
        // Dummy data for additional fields
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
      // Fallback to mock data if API fails
      setInspections(getMockData());
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for dummy data
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
    date.setMonth(date.getMonth() + 6); // 6 months later
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

  const getMockData = () => {
    return [
      {
        inspectionId: '000000001',
        branch: 'KANDY',
        transformerId: 'AZ-9867',
        dateOfInspection: '2024-08-15',
        timeOfInspection: '09:30:00',
        inspectorName: 'John Silva',
        status: 'Completed',
        priority: 'Medium',
        findings: 'All systems normal',
        nextInspectionDate: '2025-02-15',
        location: 'Main Distribution Center',
        weather: 'Clear',
        duration: '3 hrs'
      },
      {
        inspectionId: '000000002',
        branch: 'COLOMBO',
        transformerId: 'BZ-1234',
        dateOfInspection: '2024-08-16',
        timeOfInspection: '14:15:00',
        inspectorName: 'Mary Fernando',
        status: 'In Progress',
        priority: 'High',
        findings: 'Minor maintenance required',
        nextInspectionDate: '2025-02-16',
        location: 'Substation A-12',
        weather: 'Rainy',
        duration: '4 hrs'
      },
      {
        inspectionId: '000000003',
        branch: 'GALLE',
        transformerId: 'CZ-5678',
        dateOfInspection: '2024-08-17',
        timeOfInspection: '11:45:00',
        inspectorName: 'David Perera',
        status: 'Pending',
        priority: 'Low',
        findings: 'Oil level low',
        nextInspectionDate: '2025-02-17',
        location: 'Industrial Zone',
        weather: 'Cloudy',
        duration: '2.5 hrs'
      }
    ];
  };

  const handleCreate = async (formData) => {
    try {
      await inspectionService.createInspection(formData);
      fetchInspections();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating inspection:', error);
      alert('Error creating inspection. Please try again.');
    }
  };

  const handleEdit = async (formData) => {
    try {
      await inspectionService.updateInspection(selectedInspection.inspectionId, formData);
      fetchInspections();
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
        fetchInspections();
      } catch (error) {
        console.error('Error deleting inspection:', error);
        alert('Error deleting inspection. Please try again.');
      }
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = filters.searchTerm === '' || 
      inspection.transformerId.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      inspection.inspectionId.includes(filters.searchTerm) ||
      inspection.branch.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      inspection.inspectorName.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesBranch = filters.selectedBranch === '' || inspection.branch === filters.selectedBranch;
    
    const matchesDateRange = (!filters.startDate || inspection.dateOfInspection >= filters.startDate) &&
      (!filters.endDate || inspection.dateOfInspection <= filters.endDate);
    
    return matchesSearch && matchesBranch && matchesDateRange;
  });

  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentInspections = filteredInspections.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="inspections-page">
      <PageHeader onNewInspection={() => setShowCreateModal(true)} />
      
      <FilterSection 
        filters={filters}
        setFilters={setFilters}
        branches={branches}
      />

      <InspectionsTable 
        inspections={currentInspections}
        onEdit={(inspection) => {
          setSelectedInspection(inspection);
          setShowEditModal(true);
        }}
        onDelete={handleDelete}
        startIndex={startIndex}
      />

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredInspections.length}
        startIndex={startIndex}
        onPageChange={setCurrentPage}
      />

      {showCreateModal && (
        <InspectionModal
          title="Create New Inspection"
          inspection={null}
          branches={branches}
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}




    </div>
  );
};

export default InspectionsPage;