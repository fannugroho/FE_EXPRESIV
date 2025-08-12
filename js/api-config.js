// Global API Configuration
// This file provides BASE_URL configuration that can be imported by other modules

// Check if BASE_URL is already defined (from auth.js or other sources)
if (typeof window !== 'undefined' && typeof window.BASE_URL !== 'undefined') {
    // Use BASE_URL from global scope (likely from auth.js)
    var API_BASE_URL = `${window.BASE_URL}/api`;
    console.log('✅ Using BASE_URL from global scope:', window.BASE_URL);
} else if (typeof BASE_URL !== 'undefined') {
    // Use BASE_URL from local scope
    var API_BASE_URL = `${BASE_URL}/api`;
    console.log('✅ Using BASE_URL from local scope:', BASE_URL);
} else {
    // Fallback to production URL if BASE_URL is not available
    console.warn('⚠️ BASE_URL not found, using fallback production URL');
    var API_BASE_URL = 'https://expressiv-be-sb.idsdev.site/api';
}

// Make API_BASE_URL available globally
if (typeof window !== 'undefined') {
    window.API_BASE_URL = API_BASE_URL;
}

console.log('🔧 API_BASE_URL configured:', API_BASE_URL);
