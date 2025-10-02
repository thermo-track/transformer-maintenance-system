import React from 'react';
import { Search, Calendar } from 'lucide-react'; // Removed MapPin
import '../styles/filter-section.css';

const FilterSection = ({ filters, setFilters, statuses }) => { // statuses instead of branches
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReset = () => {
    setFilters({
      searchTerm: '',
      selectedStatus: '',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <div className="filter-section">
      <div className="filter-grid">
        {/* Search */}
        <div className="filter-item">
          <div className="input-with-icon">
            <Search className="input-icon" />
            <input
              type="text"
              placeholder="Search inspections..."
              className="filter-input"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="filter-item">
          <div className="input-with-icon">
            <select
              className="filter-select"
              value={filters.selectedStatus}
              onChange={(e) => handleFilterChange('selectedStatus', e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Date */}
        <div className="filter-item">
          <div className="input-with-icon">
            <Calendar className="input-icon" />
            <input
              type="date"
              placeholder="Start Date"
              className="filter-input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
        </div>

        {/* End Date */}
        <div className="filter-item">
          <div className="input-with-icon">
            <Calendar className="input-icon" />
            <input
              type="date"
              placeholder="End Date"
              className="filter-input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-item">
          <button 
            type="button" 
            className="reset-button"
            onClick={handleReset}
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
