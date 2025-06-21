/**
 * Sidebar Loader - Loads the sidebar template into any page with an element with id="sidebar"
 */

document.addEventListener('DOMContentLoaded', async function() {
    const sidebarElement = document.getElementById('sidebar');
    
    if (!sidebarElement) {
        console.error('No sidebar element found on this page');
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
    } catch (error) {
        console.error('Error loading sidebar:', error);
    }
});

// Toggle submenu function
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
    
    allSubmenus.forEach(menu => {
        if (menu.id !== id && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            const menuButton = menu.previousElementSibling;
            const menuChevron = menuButton.querySelector('.fa-chevron-right');
            menuChevron.style.transform = 'rotate(0deg)';
        }
    });
} 