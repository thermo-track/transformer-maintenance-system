  export const formatInspectedDateTime = (inspection) => {
    try {
      // Check for the new timestamp field first
      if (inspection.inspectionTimestamp) {
        const date = new Date(inspection.inspectionTimestamp);
        if (isNaN(date.getTime())) {
          console.warn('Invalid inspectionTimestamp:', inspection.inspectionTimestamp);
          return 'Invalid date';
        }
        
        // Convert to local timezone and format - FIXED OPTIONS
        return date.toLocaleString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Colombo' // Explicitly use Sri Lankan timezone
        });
      }
      // Fallback to legacy fields for backward compatibility
      else if (inspection.inspectedDateTime) {
        const date = new Date(inspection.inspectedDateTime);
        if (isNaN(date.getTime())) {
          console.warn('Invalid inspectedDateTime:', inspection.inspectedDateTime);
          return 'Invalid date';
        }
        return date.toLocaleString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Colombo' // Explicitly use Sri Lankan timezone
        });
      } 
      // Legacy separate date and time fields
      else if (inspection.dateOfInspection) {
        const date = new Date(inspection.dateOfInspection);
        if (isNaN(date.getTime())) {
          console.warn('Invalid dateOfInspection:', inspection.dateOfInspection);
          return 'Invalid date';
        }
        
        // Format the date part with 2-digit day
        const formattedDate = date.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          timeZone: 'Asia/Colombo'
        });
        
        // Handle time part
        const timeStr = inspection.timeOfInspection || '00:00';
        if (timeStr.includes(':')) {
          // Convert 24-hour time to 12-hour format with leading zeros
          const [hours, minutes] = timeStr.split(':');
          const hour = parseInt(hours, 10);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          const formattedHour = displayHour.toString().padStart(2, '0');
          const formattedMinutes = minutes.padStart(2, '0');
          return `${formattedDate} ${formattedHour}:${formattedMinutes} ${ampm}`;
        }
        
        return `${formattedDate} ${timeStr}`;
      }
      return 'Not specified';
    } catch (error) {
      console.error('Error formatting inspected date:', error, inspection);
      return 'Invalid date';
    }
  };

  // Helper function to format maintenance date (date only)
  export const formatMaintenanceDate = (maintenanceDateTime) => {
    // Handle null, undefined, or empty string
    if (!maintenanceDateTime || maintenanceDateTime === '') {
      return 'Not scheduled';
    }
    
    // Convert to string to handle different data types
    const dateStr = String(maintenanceDateTime).trim();
    
    // Handle empty or whitespace-only strings
    if (!dateStr) {
      return 'Not scheduled';
    }
    
    try {
      // Create date object
      const date = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid maintenance date:', maintenanceDateTime);
        return 'Invalid date';
      }
      
      // Format the valid date in the same style as inspected date (but date only)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Colombo' // Use Sri Lankan timezone
      });
    } catch (error) {
      console.error('Error formatting maintenance date:', error, maintenanceDateTime);
      return 'Invalid date';
    }
  };

  export const formatInspectionDateTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleString('en-LK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};