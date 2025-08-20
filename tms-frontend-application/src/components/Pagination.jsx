// components/Pagination.js
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/pagination.css';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  itemsPerPage, 
  totalItems, 
  startIndex, 
  onPageChange 
}) => {
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        <span className="pagination-text">
          Showing {startIndex + 1} to {endIndex} of {totalItems} entries
        </span>
      </div>
      
      <div className="pagination-controls">
        <button 
          className="pagination-btn"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="icon-xs" />
          Prev
        </button>
        
        <div className="pagination-numbers">
          {getVisiblePages().map(page => (
            <button
              key={page}
              className={`pagination-number ${page === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
        </div>
        
        <button 
          className="pagination-btn"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="icon-xs" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;