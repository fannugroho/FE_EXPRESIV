// Utility functions for consistent date handling across the application

/**
 * Format date string to YYYY-MM-DD without timezone conversion
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Date in YYYY-MM-DD format
 */
function formatDateToYYYYMMDD(dateString) {
    if (!dateString) return '';
    
    // Jika parameter adalah Date object, konversi ke string dulu
    if (dateString instanceof Date) {
        const year = dateString.getFullYear();
        const month = String(dateString.getMonth() + 1).padStart(2, '0');
        const day = String(dateString.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Pastikan parameter adalah string
    if (typeof dateString !== 'string') {
        return '';
    }
    
    // If already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }
    
    // If it's an ISO string with time, extract just the date part
    if (dateString.includes('T')) {
        return dateString.split('T')[0];
    }
    
    // For other formats, try to parse and format
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    
    // Format to YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Format date for display (DD/MM/YYYY)
 * @param {string} dateString - Date string in any format
 * @returns {string} Date in DD/MM/YYYY format for display
 */
function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    
    const dateOnly = formatDateToYYYYMMDD(dateString);
    if (!dateOnly) return dateString;
    
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    return dateOnly;
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Compare two dates without timezone issues
 * @param {string} date1 - First date string
 * @param {string} date2 - Second date string
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
function compareDates(date1, date2) {
    const d1 = formatDateToYYYYMMDD(date1);
    const d2 = formatDateToYYYYMMDD(date2);
    
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
}

/**
 * Check if a date is today
 * @param {string} dateString - Date string to check
 * @returns {boolean} True if the date is today
 */
function isToday(dateString) {
    const today = getTodayDate();
    return formatDateToYYYYMMDD(dateString) === today;
}

/**
 * Check if a date is in the past
 * @param {string} dateString - Date string to check
 * @returns {boolean} True if the date is in the past
 */
function isPastDate(dateString) {
    const today = getTodayDate();
    return compareDates(dateString, today) < 0;
}

/**
 * Check if a date is in the future
 * @param {string} dateString - Date string to check
 * @returns {boolean} True if the date is in the future
 */
function isFutureDate(dateString) {
    const today = getTodayDate();
    return compareDates(dateString, today) > 0;
} 