// Helper functions for addOPReim.js - append to end of file

// Helper function to get user GUID
function getUserGuid(userId) {
    try {
        // If userId is already a GUID format, return it
        if (userId && userId.length === 36 && userId.includes('-')) {
            return userId;
        }
        
        // Try to get from JWT token
        const token = localStorage.getItem('accessToken');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.sub) {
                return payload.sub;
            }
            if (payload.nameid) {
                return payload.nameid;
            }
        }
        
        // Fallback: generate GUID from userId hash
        if (userId) {
            return generateGuidFromString(userId);
        }
        
        return null;
    } catch (e) {
        console.warn('Error getting user GUID:', e);
        return null;
    }
}

// Helper function to generate GUID from string
function generateGuidFromString(str) {
    // Simple GUID generation for demo purposes
    const hash = btoa(str).replace(/[^a-zA-Z0-9]/g, '').padEnd(32, '0').slice(0, 32);
    return [
        hash.slice(0, 8),
        hash.slice(8, 12),
        hash.slice(12, 16),
        hash.slice(16, 20),
        hash.slice(20, 32)
    ].join('-');
}