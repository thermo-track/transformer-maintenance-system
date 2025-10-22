/**
 * Utility functions for fault type classification
 * Maps fault types to their corresponding class IDs based on YOLO dataset
 */

// Fault types matching YOLO dataset classes (must match exactly with data.yaml)
export const FAULT_TYPES = [
    'Full wire overload',
    'Loose Joint -Faulty',
    'Loose Joint -Potential',
    'Point Overload - Faulty',
    'normal'
];

/**
 * Get class ID for a given fault type
 * @param {string} faultType - The fault type name
 * @returns {number} The class ID (0-based index)
 */
export const getClassIdForFaultType = (faultType) => {
    if (!faultType) {
        return 0; // Default to first class if not specified
    }
    
    const classId = FAULT_TYPES.indexOf(faultType);
    
    if (classId === -1) {
        console.warn(`Unknown fault type: ${faultType}, defaulting to class 0`);
        return 0;
    }
    
    return classId;
};

/**
 * Get fault type for a given class ID
 * @param {number} classId - The class ID
 * @returns {string} The fault type name
 */
export const getFaultTypeForClassId = (classId) => {
    if (classId === null || classId === undefined || classId < 0 || classId >= FAULT_TYPES.length) {
        console.warn(`Invalid class ID: ${classId}, defaulting to class 0`);
        return FAULT_TYPES[0];
    }
    
    return FAULT_TYPES[classId];
};

/**
 * Validate if a fault type is valid
 * @param {string} faultType - The fault type name
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidFaultType = (faultType) => {
    return FAULT_TYPES.includes(faultType);
};
