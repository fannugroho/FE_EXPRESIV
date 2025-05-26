// Shared Menu Functionality for Kansai Paint Expressiv System

// Initialize sidebar to expanded state
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    // Ensure sidebar has the expanded class and correct icon
    if (sidebar) {
        // Reset to expanded state
        sidebar.classList.remove('w-20');
        sidebar.classList.add('w-64');
        
        if (sidebarToggle) {
            // Hide the toggle button since we want the sidebar permanently open
            sidebarToggle.style.display = 'none';
            sidebarToggle.innerHTML = '<i class="fas fa-chevron-left"></i>';
        }
        
        // Show all text elements and arrows
        document.querySelectorAll('#sidebar .ml-3, .menu-category, #sidebar .fa-chevron-right').forEach(el => {
            el.classList.remove('hidden');
        });
        
        // Reset icon alignment
        document.querySelectorAll('.menu-icon').forEach(el => {
            el.classList.remove('mx-auto');
        });
    }
}

// Toggle sidebar collapse/expand - modified to always keep sidebar open
function toggleSidebar() {
    // No-op function - sidebar toggle is disabled to keep it permanently open
    // This function is kept for compatibility with existing code
    return;
}

// Show/hide submenu and rotate chevron
function toggleSubMenu(id) {
    const submenu = document.getElementById(id);
    const button = submenu.previousElementSibling;
    const chevron = button.querySelector('.fa-chevron-right');
    
    if (submenu.classList.contains('hidden')) {
        submenu.classList.remove('hidden');
        chevron.style.transform = 'rotate(90deg)';
    } else {
        submenu.classList.add('hidden');
        chevron.style.transform = 'rotate(0deg)';
    }
    
    // Close other submenus
    const allSubmenus = document.querySelectorAll('div[id^="Menu"], #settings, #ApprovalReport');
    const allChevrons = document.querySelectorAll('.fa-chevron-right');
    
    allSubmenus.forEach(menu => {
        if (menu.id !== id && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            const menuButton = menu.previousElementSibling;
            const menuChevron = menuButton.querySelector('.fa-chevron-right');
            if (menuChevron) {
                menuChevron.style.transform = 'rotate(0deg)';
            }
        }
    });
}

// Toggle notification dropdown
function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.toggle('hidden');
}

// Close notifications when clicking outside
document.addEventListener('click', function(event) {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    if (notificationDropdown && !notificationDropdown.classList.contains('hidden')) {
        if (!notificationBtn.contains(event.target) && !notificationDropdown.contains(event.target)) {
            notificationDropdown.classList.add('hidden');
        }
    }
});

// Set active menu item based on current page
function setActiveMenuItem() {
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop();
    
    // Remove all active classes first
    document.querySelectorAll('.menu-btn, .submenu-btn').forEach(el => {
        el.classList.remove('active-menu-item');
    });
    
    // Add active class based on current page
    if (filename === 'dashboard.html') {
        document.querySelector('button[onclick="goToMenu()"]').classList.add('active-menu-item');
    } else if (filename === 'menuPR.html') {
        document.querySelector('button[onclick="goToMenuPR()"]').classList.add('active-menu-item');
    } else if (filename === 'menuReim.html') {
        document.querySelector('button[onclick="goToMenuReim()"]').classList.add('active-menu-item');
    } else if (filename === 'menuCash.html') {
        document.querySelector('button[onclick="goToMenuCash()"]').classList.add('active-menu-item');
    } else if (filename === 'menuSettle.html') {
        document.querySelector('button[onclick="goToMenuSettle()"]').classList.add('active-menu-item');
    }
}

// Load user information
function loadUserInfo() {
    try {
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
        const userNameDisplay = document.getElementById('userNameDisplay');
        const dashboardUserIcon = document.getElementById('dashboardUserIcon');
        
        if (loggedInUser) {
            if (userNameDisplay) {
                userNameDisplay.textContent = loggedInUser.name;
            }
            
            if (dashboardUserIcon) {
                if (loggedInUser.profilePicture) {
                    dashboardUserIcon.src = loggedInUser.profilePicture;
                } else {
                    // Default profile picture with user initials
                    const initials = loggedInUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
                    dashboardUserIcon.src = `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff`;
                }
            }
        }
    } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        // Clear invalid data
        localStorage.removeItem("loggedInUser");
    }
}

// Set greeting based on time of day
function setGreeting() {
    const greeting = document.getElementById('greeting');
    if (greeting) {
        const hour = new Date().getHours();
        let greetingText = "Good Morning";
        
        if (hour >= 12 && hour < 17) {
            greetingText = "Good Afternoon";
        } else if (hour >= 17) {
            greetingText = "Good Evening";
        }
        
        greeting.textContent = greetingText;
    }
}

// Initialize common UI elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar first
    initializeSidebar();
    
    setActiveMenuItem();
    loadUserInfo();
    setGreeting();
    
    // Add event listener for notification button if it exists
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            toggleNotifications();
        });
    }
}); 