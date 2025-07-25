// Current tab state
let currentTab = 'prepared'; // Default tab
let currentSearchTerm = '';
let currentSearchType = 'invoice';
let allInvoices = [];
let filteredInvoices = [];
let currentPage = 1;
const itemsPerPage = 10;

// API Base URL is defined in auth.js - using that instead of redeclaring
// const BASE_URL = 'http://localhost:5000'; // Update with your actual API base URL

// ========================================
// DEVELOPMENT MODE: AUTHENTICATION BYPASSED
// ========================================
// Authentication has been temporarily disabled for development purposes.
// 
// To re-enable authentication:
// 1. Comment out the dummy user data section (lines 28-58)
// 2. Uncomment the original authentication check (lines 60-75)
// 3. Remove or comment out the isAuthenticated override (lines 12-18)
// ========================================

// Override authentication check for development
if (typeof isAuthenticated === 'function') {
    const originalIsAuthenticated = isAuthenticated;
    window.isAuthenticated = function() {
        console.log('Development mode: Authentication check bypassed');
        return true;
    };
}

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    loadDashboard();
    
    // Add event listener for search input with debouncing
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearch();
            }, 500); // Debounce search by 500ms
        });
    }
    
    // Add event listener to the search type dropdown
    const searchType = document.getElementById('searchType');
    if (searchType) {
        searchType.addEventListener('change', function() {
            const searchInput = document.getElementById('searchInput');
            
            // Update input type and placeholder based on search type
            if (this.value === 'date') {
                searchInput.type = 'date';
                searchInput.placeholder = 'Select date...';
            } else {
                searchInput.type = 'text';
                searchInput.placeholder = `Search by ${this.options[this.selectedIndex].text}...`;
            }
            
            // Clear current search and trigger new search
            searchInput.value = '';
            currentSearchTerm = '';
            currentSearchType = this.value;
            loadDashboard();
        });
    }
});

// Function to load user data
function loadUserData() {
    // DEVELOPMENT MODE: Bypass authentication check
    console.log('Development mode: Bypassing authentication check');
    
    // Set dummy user data for development
    const dummyUserData = {
        name: 'Development User',
        avatar: '../../../../image/profil.png'
    };
    
    // Display user name and avatar
    try {
        if (dummyUserData.name) {
            const userNameDisplay = document.getElementById('userNameDisplay');
            if (userNameDisplay) {
                userNameDisplay.textContent = dummyUserData.name;
            }
        }
        
        if (dummyUserData.avatar) {
            const dashboardUserIcon = document.getElementById('dashboardUserIcon');
            if (dashboardUserIcon) {
                dashboardUserIcon.src = dummyUserData.avatar;
            }
        }
        
        // Show user profile section
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            userProfile.style.display = 'flex';
        }
    } catch (error) {
        console.log('Development mode: Error setting user display elements:', error);
    }
}

// Helper function to get user ID (for development mode)
function getUserId() {
    // For development, return a dummy user ID
    return 'dev-user-001';
}

async function loadDashboard() {
    try {
        // Get user ID for checker ID
        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }

        // Build base URL and params
        let baseUrl;
        const params = new URLSearchParams();
        params.append('CheckerId', userId);
        params.append('CheckerRole', 'checked');
        
        // Build URL based on current tab
        if (currentTab === 'prepared') {
            baseUrl = `${BASE_URL}/api/invoice/dashboard/check`;
            params.append('isChecked', 'false');
        } else if (currentTab === 'checked') {
            baseUrl = `${BASE_URL}/api/invoice/dashboard/check`;
            params.append('isChecked', 'true');
        } else if (currentTab === 'rejected') {
            baseUrl = `${BASE_URL}/api/invoice/dashboard/rejected`;
        }
        
        // Add search parameters if available
        if (currentSearchTerm) {
            switch (currentSearchType) {
                case 'invoice':
                    params.append('invoiceNo', currentSearchTerm);
                    break;
                case 'customer':
                    params.append('customerName', currentSearchTerm);
                    break;
                case 'status':
                    params.append('status', currentSearchTerm);
                    break;
                case 'date':
                    // For date search, try to parse and use date range
                    const dateValue = new Date(currentSearchTerm);
                    if (!isNaN(dateValue.getTime())) {
                        params.append('invoiceDateFrom', dateValue.toISOString().split('T')[0]);
                        params.append('invoiceDateTo', dateValue.toISOString().split('T')[0]);
                    }
                    break;
            }
        }
        
        const url = `${baseUrl}?${params.toString()}`;
        console.log('Fetching data from:', url);

        // For development, use mock data
        const mockData = getMockInvoiceData();
        allInvoices = mockData;
        filteredInvoices = mockData;
        
        // Update counters and table
        updateCounters();
        updateTable(filteredInvoices);
        
        // In production, uncomment this:
        /*
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allInvoices = data.invoices || [];
        filteredInvoices = allInvoices;
        
        // Update counters and table
        updateCounters();
        updateTable(filteredInvoices);
        */
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error loading dashboard data. Please try again.');
    }
}

// Mock data for development
function getMockInvoiceData() {
    const mockInvoices = [
        {
            id: 1,
            invoiceNo: 'INV-2024-001',
            customerName: 'PT Maju Bersama',
            salesEmployee: 'John Doe',
            invoiceDate: '2024-01-15',
            dueDate: '2024-02-15',
            status: 'prepared',
            totalAmount: 15000000,
            invoiceType: 'Regular'
        },
        {
            id: 2,
            invoiceNo: 'INV-2024-002',
            customerName: 'CV Sukses Mandiri',
            salesEmployee: 'Jane Smith',
            invoiceDate: '2024-01-16',
            dueDate: '2024-02-16',
            status: 'checked',
            totalAmount: 25000000,
            invoiceType: 'Regular'
        },
        {
            id: 3,
            invoiceNo: 'INV-2024-003',
            customerName: 'PT Global Trading',
            salesEmployee: 'Mike Johnson',
            invoiceDate: '2024-01-17',
            dueDate: '2024-02-17',
            status: 'rejected',
            totalAmount: 18000000,
            invoiceType: 'Regular'
        },
        {
            id: 4,
            invoiceNo: 'INV-2024-004',
            customerName: 'PT Sejahtera Abadi',
            salesEmployee: 'Sarah Wilson',
            invoiceDate: '2024-01-18',
            dueDate: '2024-02-18',
            status: 'prepared',
            totalAmount: 12000000,
            invoiceType: 'Regular'
        },
        {
            id: 5,
            invoiceNo: 'INV-2024-005',
            customerName: 'CV Berkah Jaya',
            salesEmployee: 'David Brown',
            invoiceDate: '2024-01-19',
            dueDate: '2024-02-19',
            status: 'checked',
            totalAmount: 30000000,
            invoiceType: 'Regular'
        }
    ];
    
    // Filter based on current tab
    if (currentTab === 'prepared') {
        return mockInvoices.filter(inv => inv.status === 'prepared');
    } else if (currentTab === 'checked') {
        return mockInvoices.filter(inv => inv.status === 'checked');
    } else if (currentTab === 'rejected') {
        return mockInvoices.filter(inv => inv.status === 'rejected');
    }
    
    return mockInvoices;
}

async function updateCounters() {
    try {
        const userId = getUserId();
        
        // For development, calculate from mock data
        const totalCount = allInvoices.length;
        const preparedCount = allInvoices.filter(inv => inv.status === 'prepared').length;
        const checkedCount = allInvoices.filter(inv => inv.status === 'checked').length;
        const rejectedCount = allInvoices.filter(inv => inv.status === 'rejected').length;
        
        // Update counter displays
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('preparedCount').textContent = preparedCount;
        document.getElementById('checkedCount').textContent = checkedCount;
        document.getElementById('rejectedCount').textContent = rejectedCount;
        
        // In production, uncomment this:
        /*
        const response = await fetch(`${BASE_URL}/api/invoice/dashboard/counters?CheckerId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('totalCount').textContent = data.total || 0;
            document.getElementById('preparedCount').textContent = data.prepared || 0;
            document.getElementById('checkedCount').textContent = data.checked || 0;
            document.getElementById('rejectedCount').textContent = data.rejected || 0;
        }
        */
        
    } catch (error) {
        console.error('Error updating counters:', error);
    }
}

function updateTable(invoices) {
    const tbody = document.getElementById('recentDocs');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!invoices || invoices.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 10;
        cell.className = 'text-center py-4 text-gray-500';
        cell.textContent = 'No documents found';
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedInvoices = invoices.slice(startIndex, endIndex);
    
    paginatedInvoices.forEach((invoice, index) => {
        const row = tbody.insertRow();
        row.className = 'hover:bg-gray-50';
        
        // Row number
        const cellNo = row.insertCell();
        cellNo.className = 'p-2 text-center';
        cellNo.textContent = startIndex + index + 1;
        
        // Invoice Number
        const cellInvoice = row.insertCell();
        cellInvoice.className = 'p-2';
        cellInvoice.innerHTML = `<div class="scrollable-cell">${invoice.invoiceNo}</div>`;
        
        // Customer
        const cellCustomer = row.insertCell();
        cellCustomer.className = 'p-2';
        cellCustomer.innerHTML = `<div class="scrollable-cell">${invoice.customerName}</div>`;
        
        // Sales Employee
        const cellEmployee = row.insertCell();
        cellEmployee.className = 'p-2';
        cellEmployee.innerHTML = `<div class="scrollable-cell">${invoice.salesEmployee}</div>`;
        
        // Date
        const cellDate = row.insertCell();
        cellDate.className = 'p-2';
        cellDate.textContent = formatDate(invoice.invoiceDate);
        
        // Due Date
        const cellDueDate = row.insertCell();
        cellDueDate.className = 'p-2';
        cellDueDate.textContent = formatDate(invoice.dueDate);
        
        // Status
        const cellStatus = row.insertCell();
        cellStatus.className = 'p-2';
        cellStatus.innerHTML = `<span class="status-badge status-${invoice.status}">${invoice.status}</span>`;
        
        // Total Amount
        const cellAmount = row.insertCell();
        cellAmount.className = 'p-2 text-right';
        cellAmount.textContent = formatCurrency(invoice.totalAmount);
        
        // Type
        const cellType = row.insertCell();
        cellType.className = 'p-2';
        cellType.textContent = invoice.invoiceType;
        
        // Tools
        const cellTools = row.insertCell();
        cellTools.className = 'p-2';
        cellTools.innerHTML = `
            <div class="flex space-x-1">
                <button onclick="viewInvoiceDetails(${invoice.id})" class="tool-btn tool-btn-view">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editInvoice(${invoice.id})" class="tool-btn tool-btn-edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="printInvoice(${invoice.id})" class="tool-btn tool-btn-print">
                    <i class="fas fa-print"></i>
                </button>
            </div>
        `;
    });
    
    // Update pagination info
    updatePaginationInfo(invoices.length);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function updatePaginationInfo(totalItems) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    document.getElementById('startItem').textContent = startItem;
    document.getElementById('endItem').textContent = endItem;
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('currentPage').textContent = currentPage;
    
    // Update pagination buttons
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.disabled = currentPage <= 1;
    prevBtn.className = currentPage <= 1 ? 'pagination-btn disabled' : 'pagination-btn';
    
    nextBtn.disabled = endItem >= totalItems;
    nextBtn.className = endItem >= totalItems ? 'pagination-btn disabled' : 'pagination-btn';
}

// Global function definitions
window.switchTab = function(tabName) {
    currentTab = tabName;
    currentPage = 1;
    
    // Update tab button styles
    document.querySelectorAll('[id$="TabBtn"]').forEach(btn => {
        btn.classList.remove('tab-active');
    });
    
    const tabBtn = document.getElementById(tabName + 'TabBtn');
    if (tabBtn) {
        tabBtn.classList.add('tab-active');
    }
    
    // Reload dashboard with new tab
    loadDashboard();
};

function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1;
    
    // Update tab button styles
    document.querySelectorAll('[id$="TabBtn"]').forEach(btn => {
        btn.classList.remove('tab-active');
    });
    
    document.getElementById(tabName + 'TabBtn').classList.add('tab-active');
    
    // Reload dashboard with new tab
    loadDashboard();
}

function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    currentSearchTerm = searchInput.value.trim();
    currentPage = 1;
    loadDashboard();
}

window.changePage = function(direction) {
    const newPage = currentPage + direction;
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable(filteredInvoices);
    }
};

function changePage(direction) {
    const newPage = currentPage + direction;
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable(filteredInvoices);
    }
}

// Navigation functions
window.goToTotalDocs = function() {
    // Navigate to total documents view
    console.log('Navigate to total documents');
};

function goToTotalDocs() {
    // Navigate to total documents view
    console.log('Navigate to total documents');
}

window.viewInvoiceDetails = function(id) {
    // Navigate to invoice details page
    window.location.href = `../../../../detailPages/detailInvoice.html?id=${id}`;
};

window.editInvoice = function(id) {
    // Navigate to edit invoice page
    window.location.href = `../../../../addPages/addInvoice.html?id=${id}`;
};

window.printInvoice = function(id) {
    // Open print dialog for invoice
    window.open(`../../../../pages/printInvoice.html?id=${id}`, '_blank');
};

function viewInvoiceDetails(id) {
    // Navigate to invoice details page
    window.location.href = `../../../../detailPages/detailInvoice.html?id=${id}`;
}

function editInvoice(id) {
    // Navigate to edit invoice page
    window.location.href = `../../../../addPages/addInvoice.html?id=${id}`;
}

function printInvoice(id) {
    // Open print dialog for invoice
    window.open(`../../../../pages/printInvoice.html?id=${id}`, '_blank');
}

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
};

window.toggleSubMenu = function(menuId) {
    const submenu = document.getElementById(menuId);
    if (submenu) {
        submenu.classList.toggle('hidden');
    }
};

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

function toggleSubMenu(menuId) {
    const submenu = document.getElementById(menuId);
    if (submenu) {
        submenu.classList.toggle('hidden');
    }
}

// Export functions
window.downloadExcel = async function() {
    try {
        const workbook = XLSX.utils.book_new();
        
        // Prepare data for export
        const exportData = filteredInvoices.map(invoice => ({
            'Invoice No.': invoice.invoiceNo,
            'Customer': invoice.customerName,
            'Sales Employee': invoice.salesEmployee,
            'Date': formatDate(invoice.invoiceDate),
            'Due Date': formatDate(invoice.dueDate),
            'Status': invoice.status,
            'Total (IDR)': invoice.totalAmount,
            'Type': invoice.invoiceType
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'AR Invoices');
        
        // Generate filename
        const date = new Date().toISOString().split('T')[0];
        const filename = `AR_Invoice_Check_${currentTab}_${date}.xlsx`;
        
        XLSX.writeFile(workbook, filename);
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Error exporting to Excel. Please try again.');
    }
}

window.downloadPDF = async function() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.text('AR Invoice Check Report', 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString('id-ID')}`, 14, 30);
        doc.text(`Status: ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}`, 14, 40);
        
        // Prepare table data
        const tableData = filteredInvoices.map(invoice => [
            invoice.invoiceNo,
            invoice.customerName,
            invoice.salesEmployee,
            formatDate(invoice.invoiceDate),
            formatDate(invoice.dueDate),
            invoice.status,
            formatCurrency(invoice.totalAmount),
            invoice.invoiceType
        ]);
        
        // Add table
        doc.autoTable({
            head: [['Invoice No.', 'Customer', 'Sales Employee', 'Date', 'Due Date', 'Status', 'Total (IDR)', 'Type']],
            body: tableData,
            startY: 50,
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [66, 153, 225],
                textColor: 255
            }
        });
        
        // Generate filename
        const date = new Date().toISOString().split('T')[0];
        const filename = `AR_Invoice_Check_${currentTab}_${date}.pdf`;
        
        doc.save(filename);
        
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Error exporting to PDF. Please try again.');
    }
}

// Profile navigation
window.goToProfile = function() {
    window.location.href = '../../../../pages/profile.html';
};

function goToProfile() {
    window.location.href = '../../../../pages/profile.html';
}

// Notification functions
function updateNotificationBadge() {
    // Implementation for notification badge
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        // Update badge count based on notifications
        const count = 0; // Get from API
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.toggle('hidden');
    } else {
        createNotificationPanel();
    }
}

function createNotificationPanel() {
    // Create notification panel if it doesn't exist
    const panel = document.createElement('div');
    panel.id = 'notificationPanel';
    panel.className = 'absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 hidden z-50';
    panel.innerHTML = `
        <div class="p-4">
            <h3 class="text-lg font-semibold mb-2">Notifications</h3>
            <div id="notificationList" class="space-y-2">
                <p class="text-gray-500 text-sm">No new notifications</p>
            </div>
        </div>
    `;
    
    document.getElementById('notificationBellWrapper').appendChild(panel);
    showNotificationPanel();
}

function showNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.remove('hidden');
    }
}

function hideNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.add('hidden');
    }
}

function updateNotificationContent() {
    const notificationList = document.getElementById('notificationList');
    if (notificationList) {
        // Update notification content from API
        notificationList.innerHTML = '<p class="text-gray-500 text-sm">No new notifications</p>';
    }
}

function showNotification(message, invoiceNo) {
    // Show notification toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function removeNotification(invoiceNo) {
    // Remove notification from list
    console.log('Remove notification for invoice:', invoiceNo);
}

// Polling functions for real-time updates
async function pollPreparedDocs() {
    // Poll for new prepared documents
    setInterval(async () => {
        if (currentTab === 'prepared') {
            await loadDashboard();
        }
    }, 30000); // Poll every 30 seconds
}

async function pollCheckedDocs() {
    // Poll for new checked documents
    setInterval(async () => {
        if (currentTab === 'checked') {
            await loadDashboard();
        }
    }, 30000); // Poll every 30 seconds
}

// Start polling when page loads
document.addEventListener('DOMContentLoaded', function() {
    pollPreparedDocs();
    pollCheckedDocs();
}); 