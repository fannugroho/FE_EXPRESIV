/**
 * Sidebar Loader - Loads the sidebar template into any page with an element with id="sidebar"
 * Enhanced version with better error handling and glitch prevention
 */

// Global flag to prevent multiple loads
let sidebarLoaded = false;

document.addEventListener('DOMContentLoaded', async function() {
    const sidebarElement = document.getElementById('sidebar');
    
    if (!sidebarElement) {
        console.error('No sidebar element found on this page');
        return;
    }
    
    // Prevent multiple loads
    if (sidebarLoaded) {
        return;
    }
    
    try {
        // Calculate the relative path to the components directory
        const currentPath = window.location.pathname;
        const pathSegments = currentPath.split('/').filter(Boolean);
        
        // Calculate relative path depth
        let basePath = '';
        const depth = pathSegments.length - 1; // -1 because we don't count the HTML file itself
        
        if (depth > 0) {
            basePath = '../'.repeat(depth);
        }
        
        // Show loading state
        sidebarElement.innerHTML = '<div class="flex items-center justify-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>';
        
        // Fetch the sidebar template
        const response = await fetch(`${basePath}components/shared/sidebar-template.html`);
        if (!response.ok) {
            throw new Error(`Failed to fetch sidebar template: ${response.status}`);
        }
        
        const templateHtml = await response.text();
        sidebarElement.innerHTML = templateHtml;
        
        // Add the sidebar styles if not already included
        if (!document.querySelector('link[href*="sidebar-styles.css"]')) {
            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = `${basePath}components/shared/sidebar-styles.css`;
            document.head.appendChild(linkElement);
        }
        
        // Fix image paths in the sidebar (Seiho.png)
        const logoImg = sidebarElement.querySelector('.sidebar-logo-container img');
        if (logoImg) {
            // Update the src attribute to point to the correct path
            const currentSrc = logoImg.getAttribute('src');
            if (currentSrc.includes('../image/')) {
                logoImg.src = `${basePath}image/Seiho.png`;
            }
        }
        
        // Initialize sidebar functionality
        initializeSidebarFunctionality();
        
        // Mark as loaded
        sidebarLoaded = true;
        
        // Dispatch custom event to notify other scripts
        document.dispatchEvent(new CustomEvent('sidebarLoaded'));
        
    } catch (error) {
        console.error('Error loading sidebar:', error);
        // Show fallback content
        sidebarElement.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <i class="fas fa-exclamation-triangle mb-2"></i>
                <p>Sidebar loading failed</p>
                <button onclick="location.reload()" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm">
                    Retry
                </button>
            </div>
        `;
    }
});

// Initialize sidebar functionality
function initializeSidebarFunctionality() {
    // Set active menu item based on current page
    setActiveMenuItem();
    
    // Initialize submenu toggles
    initializeSubmenuToggles();
    
    // Ensure sidebar is visible and stable
    ensureSidebarStability();
}

// Set active menu item
function setActiveMenuItem() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();
    
    // Remove all active classes
    const allMenuItems = document.querySelectorAll('.menu-btn, .submenu-btn');
    allMenuItems.forEach(item => {
        item.classList.remove('active-menu-item');
    });
    
    // Find and set active menu based on current page
    const menuMappings = {
        'dashboard.html': '.menu-btn[onclick*="goToMenu()"]',
        'menuPR.html': '.submenu-btn[onclick*="goToMenuPR()"]',
        'menuReim.html': '.submenu-btn[onclick*="goToMenuReim()"]',
        'menuCash.html': '.submenu-btn[onclick*="goToMenuCash()"]',
        'menuSettle.html': '.submenu-btn[onclick*="goToMenuSettle()"]',
        'menuOPReim.html': '.submenu-btn[onclick*="goToMenuOPReim()"]',
        'dashboard-users.html': '.submenu-btn[onclick*="goToMenuUser()"]',
        'dashboard-roles.html': '.submenu-btn[onclick*="goToMenuRole()"]',
        'register.html': '.submenu-btn[onclick*="goToMenuRegist()"]'
    };
    
    const activeSelector = menuMappings[currentPage];
    if (activeSelector) {
        const activeElement = document.querySelector(activeSelector);
        if (activeElement) {
            activeElement.classList.add('active-menu-item');
            
            // Expand parent submenu if it's a submenu item
            const parentSubmenu = activeElement.closest('div[id^="Menu"], #settings, #OutgoingPayment');
            if (parentSubmenu && !parentSubmenu.classList.contains('hidden')) {
                const parentButton = parentSubmenu.previousElementSibling;
                const chevron = parentButton.querySelector('.fa-chevron-right');
                if (chevron) {
                    chevron.style.transform = 'rotate(90deg)';
                }
            }
        }
    }
}

// Initialize submenu toggles
function initializeSubmenuToggles() {
    // Remove existing event listeners to prevent duplicates
    const existingButtons = document.querySelectorAll('.menu-btn[onclick*="toggleSubMenu"]');
    existingButtons.forEach(button => {
        button.onclick = null;
    });
    
    // Add new event listeners
    const submenuButtons = document.querySelectorAll('.menu-btn[onclick*="toggleSubMenu"]');
    submenuButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const submenuId = this.getAttribute('onclick').match(/toggleSubMenu\('([^']+)'\)/)[1];
            toggleSubMenu(submenuId);
        });
    });
}

// Enhanced toggle submenu function
function toggleSubMenu(id) {
    const submenu = document.getElementById(id);
    const button = submenu.previousElementSibling;
    const chevron = button.querySelector('.fa-chevron-right');
    
    if (submenu.classList.contains('hidden')) {
        submenu.classList.remove('hidden');
        if (chevron) {
            chevron.style.transform = 'rotate(90deg)';
        }
    } else {
        submenu.classList.add('hidden');
        if (chevron) {
            chevron.style.transform = 'rotate(0deg)';
        }
    }
    
    // Close other submenus (optional - comment out if you want multiple open)
    /*
    const allSubmenus = document.querySelectorAll('div[id^="Menu"], #settings, #OutgoingPayment');
    allSubmenus.forEach(menu => {
        if (menu.id !== id) {
            menu.classList.add('hidden');
            const menuButton = menu.previousElementSibling;
            const menuChevron = menuButton.querySelector('.fa-chevron-right');
            if (menuChevron) {
                menuChevron.style.transform = 'rotate(0deg)';
            }
        }
    });
    */
}

// Ensure sidebar stability
function ensureSidebarStability() {
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
}

// Global function to ensure sidebar visibility (for compatibility with existing code)
window.ensureSidebarVisible = function() {
    ensureSidebarStability();
};

// Prevent multiple interval calls
let sidebarCheckInterval = null;

// Function to start sidebar monitoring (for pages that need it)
window.startSidebarMonitoring = function() {
    if (sidebarCheckInterval) {
        clearInterval(sidebarCheckInterval);
    }
    
    sidebarCheckInterval = setInterval(ensureSidebarStability, 1000);
};

// Function to stop sidebar monitoring
window.stopSidebarMonitoring = function() {
    if (sidebarCheckInterval) {
        clearInterval(sidebarCheckInterval);
        sidebarCheckInterval = null;
    }
}; 