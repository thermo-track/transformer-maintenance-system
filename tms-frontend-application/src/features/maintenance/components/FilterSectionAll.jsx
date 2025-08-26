import React from 'react';
import { Search, Calendar } from 'lucide-react';
import '../styles/filter-section.css';

const FilterSectionAll = ({ filters, setFilters, branches }) => {
  // Debug logging
  console.log('FilterSectionAll props:', { filters, setFilters, branches });
  console.log('branches type:', typeof branches);
  console.log('branches value:', branches);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Safety checks
  if (!branches) {
    console.error('branches is undefined or null');
    return <div>Loading filters...</div>;
  }

  if (!Array.isArray(branches)) {
    console.error('branches is not an array:', branches);
    return <div>Error: Invalid branches data</div>;
  }

  const handleReset = () => {
    setFilters({
      searchTerm: '',
      selectedBranch: '',
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
              value={filters?.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>
        
        {/* Branch Selection */}
        <div className="filter-item">
          <div className="input-with-icon">
            <select
              className="filter-select"
              value={filters?.selectedBranch || ''}
              onChange={(e) => handleFilterChange('selectedBranch', e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map((branch, index) => (
                <option key={`${branch}-${index}`} value={branch}>
                  {branch}
                </option>
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
              value={filters?.startDate || ''}
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
              value={filters?.endDate || ''}
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

export default FilterSectionAll;