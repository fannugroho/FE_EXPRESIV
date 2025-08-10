/**
 * Sidebar Compatibility Layer
 * Handles compatibility with existing page scripts and prevents glitches
 */

// Global compatibility object
window.SidebarCompatibility = {
    // Track if sidebar is being loaded
    isLoading: false,
    
    // Track if sidebar is loaded
    isLoaded: false,
    
    // Prevent multiple initialization
    isInitialized: false,
    
    // Initialize compatibility layer
    init() {
        if (this.isInitialized) {
            return;
        }
        
        this.isInitialized = true;
        this.setupEventListeners();
        this.overrideConflictingFunctions();
    },
    
    // Setup event listeners for sidebar events
    setupEventListeners() {
        // Listen for sidebar loaded event
        document.addEventListener('sidebarLoaded', () => {
            this.isLoaded = true;
            this.isLoading = false;
            this.cleanupConflictingScripts();
        });
        
        // Listen for page unload to cleanup
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    },
    
    // Override functions that might conflict
    overrideConflictingFunctions() {
        // Override any existing toggleSidebar function
        if (typeof window.toggleSidebar === 'function') {
            const originalToggleSidebar = window.toggleSidebar;
            window.toggleSidebar = function() {
                // Prevent sidebar from being toggled during loading
                if (window.SidebarCompatibility.isLoading) {
                    return false;
                }
                return originalToggleSidebar.apply(this, arguments);
            };
        }
        
        // Override any existing ensureSidebarVisible function
        if (typeof window.ensureSidebarVisible === 'function') {
            const originalEnsureSidebarVisible = window.ensureSidebarVisible;
            window.ensureSidebarVisible = function() {
                // Use the enhanced version from sidebar-loader.js
                if (typeof window.ensureSidebarStability === 'function') {
                    window.ensureSidebarStability();
                } else {
                    originalEnsureSidebarVisible.apply(this, arguments);
                }
            };
        }
    },
    
    // Cleanup conflicting scripts
    cleanupConflictingScripts() {
        // Remove any existing intervals that might interfere
        const intervals = window.setInterval(() => {}, 0);
        for (let i = 1; i <= intervals; i++) {
            window.clearInterval(i);
        }
        
        // Remove any existing timeouts that might interfere
        const timeouts = window.setTimeout(() => {}, 0);
        for (let i = 1; i <= timeouts; i++) {
            window.clearTimeout(i);
        }
        
        // Stop any existing sidebar monitoring
        if (typeof window.stopSidebarMonitoring === 'function') {
            window.stopSidebarMonitoring();
        }
    },
    
    // Cleanup on page unload
    cleanup() {
        this.isLoading = false;
        this.isLoaded = false;
        this.isInitialized = false;
        
        // Stop any monitoring
        if (typeof window.stopSidebarMonitoring === 'function') {
            window.stopSidebarMonitoring();
        }
    }
};

// Initialize compatibility layer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.SidebarCompatibility.init();
});

// Enhanced function to replace existing ensureSidebarVisible calls
window.enhancedEnsureSidebarVisible = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        // Set consistent styles
        sidebar.style.width = '280px';
        sidebar.style.position = 'sticky';
        sidebar.style.top = '0';
        sidebar.style.height = '100vh';
        sidebar.style.overflowY = 'auto';
        sidebar.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
        sidebar.style.boxShadow = '0 0 20px rgba(0,0,0,0.1)';
        sidebar.style.zIndex = '1000';
        
        // Prevent any transform or margin changes
        sidebar.style.transform = 'none';
        sidebar.style.marginLeft = '0';
        sidebar.style.visibility = 'visible';
        sidebar.style.display = 'block';
        sidebar.style.opacity = '1';
    }
};

// Function to safely add event listeners without conflicts
window.safeAddEventListener = function(element, event, handler) {
    if (element && typeof element.addEventListener === 'function') {
        // Remove existing listeners to prevent duplicates
        element.removeEventListener(event, handler);
        // Add new listener
        element.addEventListener(event, handler);
    }
};

// Function to safely remove event listeners
window.safeRemoveEventListener = function(element, event, handler) {
    if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(event, handler);
    }
};

// Enhanced tab switching function that maintains sidebar
window.enhancedSwitchTab = function(tabFunction) {
    return function(tab) {
        // Call the original function
        if (typeof tabFunction === 'function') {
            tabFunction(tab);
        }
        
        // Ensure sidebar remains visible
        setTimeout(() => {
            window.enhancedEnsureSidebarVisible();
        }, 10);
    };
};

// Function to replace existing switchTab functions
window.replaceSwitchTab = function(originalFunction) {
    if (typeof originalFunction === 'function') {
        return window.enhancedSwitchTab(originalFunction);
    }
    return originalFunction;
}; 