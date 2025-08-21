/* // components/FilterSection.js
import React from 'react';
import { Search, MapPin, Calendar } from 'lucide-react';
import '../styles/filter-section.css';

const FilterSection = ({ filters, setFilters, branches }) => {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="filter-section">
      <div className="filter-grid">
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
        
        <div className="filter-item">
          <div className="input-with-icon">
            <MapPin className="input-icon" />
            <select
              className="filter-select"
              value={filters.selectedBranch}
              onChange={(e) => handleFilterChange('selectedBranch', e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
        </div>
        
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
      </div>
    </div>
  );
};

export default FilterSection; */


// components/FilterSection.js
import React from 'react';
import { Search, Calendar } from 'lucide-react';
import '../styles/filter-section.css';

const FilterSection = ({ filters, setFilters, statuses = [] }) => {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
              value={filters?.searchTerm ?? ""}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="filter-item">
          <div className="input-with-icon">
            <select
              className="filter-select"
              value={filters?.selectedStatus ?? ""}
              onChange={(e) => handleFilterChange('selectedStatus', e.target.value)}
            >
              <option value="">All Statuses</option>
              {Array.isArray(statuses) && statuses.map(status => (
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
              className="filter-input"
              value={filters?.startDate ?? ""}
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
              className="filter-input"
              value={filters?.endDate ?? ""}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
