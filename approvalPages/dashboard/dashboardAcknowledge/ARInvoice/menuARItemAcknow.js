// Current tab state
let currentTab = 'checked'; // Default tab - showing checked invoices ready for acknowledgment
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
    window.isAuthenticated = function () {
        console.log('Development mode: Authentication check bypassed');
        return true;
    };
}

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', async function () {
    await loadUserData();
    await loadDashboard();

    // Add auto-refresh functionality
    setupAutoRefresh();

    // Add event listener for search input with debouncing
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                await handleSearch();
            }, 500); // Debounce search by 500ms
        });
    }

    // Add event listener to the search type dropdown
    const searchType = document.getElementById('searchType');
    if (searchType) {
        searchType.addEventListener('change', async function () {
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
            await loadDashboard();
        });
    }
});

// Function to setup auto-refresh functionality
function setupAutoRefresh() {
    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            console.log('Page became visible, refreshing data...');
            loadDashboard();
        }
    });

    // Refresh data when window gains focus (user returns to window)
    window.addEventListener('focus', function () {
        console.log('Window gained focus, refreshing data...');
        loadDashboard();
    });

    // Refresh data when page is loaded from cache (back/forward navigation)
    window.addEventListener('pageshow', function (event) {
        if (event.persisted) {
            console.log('Page loaded from cache, refreshing data...');
            loadDashboard();
        }
    });

    // Refresh data when user navigates to this page
    if (window.performance && window.performance.navigation) {
        if (window.performance.navigation.type === window.performance.navigation.TYPE_NAVIGATE) {
            console.log('Page navigated to, refreshing data...');
            loadDashboard();
        }
    }

    // Additional refresh on page load for better reliability
    setTimeout(() => {
        console.log('Initial page load refresh...');
        loadDashboard();
    }, 1000);
}

// Function to load user data
async function loadUserData() {
    try {
        // Get user ID from localStorage or session
        const userId = localStorage.getItem('userId') || '7e0e0ad6-bceb-4e92-8a38-e14b7fb097ae'; // Default for development

        // Fetch user data
        const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status && result.data) {
            const userData = result.data;
            console.log('User data loaded:', userData);

            // Display user name and avatar
            try {
                if (userData.fullName) {
                    const userNameDisplay = document.getElementById('userNameDisplay');
                    if (userNameDisplay) {
                        userNameDisplay.textContent = userData.fullName;
                    }
                }

                // Set default avatar
                const dashboardUserIcon = document.getElementById('dashboardUserIcon');
                if (dashboardUserIcon) {
                    dashboardUserIcon.src = '../../../../image/profil.png';
                }

                // Show user profile section
                const userProfile = document.querySelector('.user-profile');
                if (userProfile) {
                    userProfile.style.display = 'flex';
                }

                // Store user data for later use
                localStorage.setItem('currentUser', JSON.stringify(userData));

            } catch (error) {
                console.log('Error setting user display elements:', error);
            }
        } else {
            console.error('Failed to get user data:', result.message);
            // Fallback to dummy data
            setDummyUserData();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to dummy data
        setDummyUserData();
    }
}

// Fallback function for dummy user data
function setDummyUserData() {
    const dummyUserData = {
        name: 'Development User',
        avatar: '../../../../image/profil.png'
    };

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
        console.log('Error setting dummy user display elements:', error);
    }
}

// Helper function to get user ID (for development mode)
async function getUserId() {
    try {
        // Get user ID from localStorage or session
        const userId = localStorage.getItem('userId') || '7e0e0ad6-bceb-4e92-8a38-e14b7fb097ae'; // Default for development

        // Fetch user data to get kansaiEmployeeId
        const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status && result.data) {
            console.log('User data fetched:', result.data);
            return result.data.kansaiEmployeeId;
        } else {
            console.error('Failed to get user data:', result.message);
            return '02403121'; // Fallback for development
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        return '02403121'; // Fallback for development
    }
}

async function loadDashboard() {
    try {
        // Get user ID for approver ID
        const userId = await getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }

        console.log('Using kansaiEmployeeId for API call:', userId);

        // Build API URL for AR Invoices by acknowledged status
        const apiUrl = `${BASE_URL}/api/ar-invoices/by-acknowledged/${userId}`;
        console.log('Fetching data from:', apiUrl);

        // Make API call
        console.log('Making API call to:', apiUrl);
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/plain'
            }
        });

        console.log('API Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('API Response data:', result);

        if (result.status && result.data) {
            console.log('Transforming API data...');
            // Transform API data to match our expected format
            allInvoices = result.data.map(invoice => {
                // Map docType to display type
                let displayType = 'Regular';
                if (invoice.docType === 'I') {
                    displayType = 'Item';
                } else if (invoice.docType === 'S') {
                    displayType = 'Services';
                }

                const transformedInvoice = {
                    id: invoice.stagingID,
                    invoiceNo: invoice.u_bsi_invnum || invoice.numAtCard,
                    customerName: invoice.cardName,
                    salesEmployee: invoice.u_BSI_Expressiv_PreparedByName || 'N/A',
                    invoiceDate: invoice.docDate,
                    dueDate: invoice.docDueDate,
                    status: getInvoiceStatus(invoice), // We'll need to determine status based on approval data
                    totalAmount: invoice.docTotal,
                    invoiceType: displayType,
                    // Additional fields from API
                    cardCode: invoice.cardCode,
                    address: invoice.address,
                    comments: invoice.comments,
                    preparedByNIK: invoice.u_BSI_Expressiv_PreparedByNIK,
                    currency: invoice.docCur,
                    vatSum: invoice.vatSum,
                    isTransfered: invoice.u_BSI_Expressiv_IsTransfered,
                    createdAt: invoice.createdAt,
                    updatedAt: invoice.updatedAt,
                    approvalSummary: invoice.arInvoiceApprovalSummary,
                    docType: invoice.docType // Keep original docType for reference
                };
                console.log('Transformed invoice:', transformedInvoice);
                return transformedInvoice;
            });

            // Filter based on current tab
            filteredInvoices = filterInvoicesByTab(allInvoices, currentTab);

            // Apply search filter if any
            if (currentSearchTerm) {
                filteredInvoices = applySearchFilter(filteredInvoices, currentSearchTerm, currentSearchType);
            }

            // Update counters and table
            updateCounters();
            updateTable(filteredInvoices);
        } else {
            console.error('API returned error:', result.message);
            allInvoices = [];
            filteredInvoices = [];
            updateCounters();
            updateTable([]);
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error loading dashboard data. Please try again.');

        // Show empty state when API fails
        allInvoices = [];
        filteredInvoices = [];
        updateCounters();
        updateTable([]);
    }
}

// Helper function to determine invoice status based on approval data
function getInvoiceStatus(invoice) {
    console.log('Invoice arInvoiceApprovalSummary:', invoice.arInvoiceApprovalSummary);
    console.log('Invoice arInvoiceApprovalSummary type:', typeof invoice.arInvoiceApprovalSummary);

    if (invoice.arInvoiceApprovalSummary === null || invoice.arInvoiceApprovalSummary === undefined) {
        console.log('arInvoiceApprovalSummary is null/undefined, returning Draft');
        return 'Draft';
    }

    // If arInvoiceApprovalSummary exists, use the approvalStatus field from API
    if (invoice.arInvoiceApprovalSummary) {
        const summary = invoice.arInvoiceApprovalSummary;
        console.log('arInvoiceApprovalSummary properties:', summary);

        // Use the approvalStatus field from the API response
        if (summary.approvalStatus) {
            console.log('Using approvalStatus from API:', summary.approvalStatus);
            return summary.approvalStatus;
        }

        // Fallback to old logic if approvalStatus is not available
        if (summary.isRejected) return 'Rejected';
        if (summary.isApproved) return 'Approved';
        if (summary.isAcknowledged) return 'Acknowledged';
        if (summary.isChecked) return 'Checked';
        if (summary.isReceived) return 'Received';
    }

    if (invoice.u_BSI_Expressiv_IsTransfered === 'Y') return 'Received';
    if (invoice.stagingID && invoice.stagingID.startsWith('STG')) return 'Draft';
    if (invoice.u_BSI_Expressiv_IsTransfered === 'Y') return 'Received';
    if (invoice.docNum && invoice.docNum > 0) return 'Prepared';

    return 'Draft';
}

// Helper function to filter invoices by tab
function filterInvoicesByTab(invoices, tab) {
    switch (tab) {
        case 'all':
            return invoices;
        case 'checked':
            // Tab checked: menampilkan dokumen yang statusnya Checked saja
            return invoices.filter(inv => inv.status === 'Checked');
        case 'acknowledged':
            // Tab acknowledged: menampilkan dokumen yang statusnya acknowledged, approved, received
            return invoices.filter(inv =>
                inv.status === 'Acknowledged' ||
                inv.status === 'Approved' ||
                inv.status === 'Received'
            );
        case 'rejected':
            return invoices.filter(inv => inv.status === 'Rejected');
        default:
            return invoices;
    }
}

// Helper function to apply search filter
function applySearchFilter(invoices, searchTerm, searchType) {
    if (!searchTerm) return invoices;

    const term = searchTerm.toLowerCase();

    return invoices.filter(invoice => {
        switch (searchType) {
            case 'invoice':
                return invoice.invoiceNo.toLowerCase().includes(term);
            case 'customer':
                return invoice.customerName.toLowerCase().includes(term);
            case 'date':
                return invoice.invoiceDate.includes(term);
            case 'status':
                return invoice.status.toLowerCase().includes(term);
            default:
                return invoice.invoiceNo.toLowerCase().includes(term) ||
                    invoice.customerName.toLowerCase().includes(term);
        }
    });
}

// Mock data for development
function getMockInvoiceData() {
    const mockInvoices = [
        {
            id: 1,
            stagingId: 'STG-C41174-001',
            invoiceNo: 'INV-2024-001',
            customerName: 'PT Maju Bersama',
            salesEmployee: 'John Doe',
            invoiceDate: '2024-01-15',
            dueDate: '2024-02-15',
            status: 'Checked',
            totalAmount: 15000000,
            invoiceType: 'Regular'
        },
        {
            id: 2,
            stagingId: 'STG-C41174-002',
            invoiceNo: 'INV-2024-002',
            customerName: 'CV Sukses Mandiri',
            salesEmployee: 'Jane Smith',
            invoiceDate: '2024-01-16',
            dueDate: '2024-02-16',
            status: 'Acknowledged',
            totalAmount: 25000000,
            invoiceType: 'Regular'
        },
        {
            id: 3,
            stagingId: 'STG-C41174-003',
            invoiceNo: 'INV-2024-003',
            customerName: 'PT Global Trading',
            salesEmployee: 'Mike Johnson',
            invoiceDate: '2024-01-17',
            dueDate: '2024-02-17',
            status: 'Rejected',
            totalAmount: 18000000,
            invoiceType: 'Regular'
        },
        {
            id: 4,
            stagingId: 'STG-C41174-004',
            invoiceNo: 'INV-2024-004',
            customerName: 'PT Sejahtera Abadi',
            salesEmployee: 'Sarah Wilson',
            invoiceDate: '2024-01-18',
            dueDate: '2024-02-18',
            status: 'Checked',
            totalAmount: 12000000,
            invoiceType: 'Regular'
        },
        {
            id: 5,
            stagingId: 'STG-C41174-005',
            invoiceNo: 'INV-2024-005',
            customerName: 'CV Berkah Jaya',
            salesEmployee: 'David Brown',
            invoiceDate: '2024-01-19',
            dueDate: '2024-02-19',
            status: 'Acknowledged',
            totalAmount: 30000000,
            invoiceType: 'Regular'
        }
    ];

    // Filter based on current tab
    if (currentTab === 'checked') {
        return mockInvoices.filter(inv => inv.status === 'Checked');
    } else if (currentTab === 'acknowledged') {
        return mockInvoices.filter(inv => inv.status === 'Acknowledged');
    } else if (currentTab === 'rejected') {
        return mockInvoices.filter(inv => inv.status === 'Rejected');
    }

    return mockInvoices;
}

async function updateCounters() {
    try {
        // Calculate from actual data
        const totalCount = allInvoices.length;
        const checkedCount = allInvoices.filter(inv => inv.status === 'Checked').length;
        // Count acknowledged includes: Acknowledged, Approved, Received
        const acknowledgedCount = allInvoices.filter(inv =>
            inv.status === 'Acknowledged' ||
            inv.status === 'Approved' ||
            inv.status === 'Received'
        ).length;
        const rejectedCount = allInvoices.filter(inv => inv.status === 'Rejected').length;

        // Update counter displays
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('checkedCount').textContent = checkedCount;
        document.getElementById('acknowledgedCount').textContent = acknowledgedCount;
        document.getElementById('rejectedCount').textContent = rejectedCount;

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

        // Invoice Number (no scroll)
        const cellInvoice = row.insertCell();
        cellInvoice.className = 'p-2';
        cellInvoice.textContent = `${invoice.invoiceNo}`;

        // Customer (small scroll if > 15 chars)
        const cellCustomer = row.insertCell();
        const useSmallScroll = invoice.customerName && invoice.customerName.length > 15;
        cellCustomer.className = 'p-2';
        cellCustomer.innerHTML = useSmallScroll
            ? `<div class=\"scrollable-cell-sm\">${invoice.customerName}</div>`
            : `${invoice.customerName}`;

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

        // Debug logging for status
        console.log(`Invoice ${index + 1} status:`, invoice.status);
        console.log(`Invoice ${index + 1} status class:`, `status-${invoice.status.toLowerCase()}`);

        cellStatus.innerHTML = `<span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span>`;

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
            <button onclick="viewInvoiceDetails('${invoice.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
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
window.switchTab = async function (tabName) {
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
    await loadDashboard();
};

async function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1;

    // Update tab button styles
    document.querySelectorAll('[id$="TabBtn"]').forEach(btn => {
        btn.classList.remove('tab-active');
    });

    // Try to find the tab button and make it active
    const tabBtn = document.getElementById(tabName + 'TabBtn');
    if (tabBtn) {
        tabBtn.classList.add('tab-active');
    }

    // Reload dashboard with new tab
    await loadDashboard();
}

async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    currentSearchTerm = searchInput.value.trim();
    currentPage = 1;
    await loadDashboard();
}

window.changePage = function (direction) {
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
window.goToTotalDocs = function () {
    // Navigate to total documents view
    console.log('Navigate to total documents');
};

function goToTotalDocs() {
    // Navigate to total documents view
    console.log('Navigate to total documents');
}

window.viewInvoiceDetails = function (stagingId) {
    // Cari data invoice untuk dapatkan docType
    const invoice = allInvoices.find(inv => inv.id === stagingId);

    if (invoice) {
        // Routing berdasarkan docType dengan status Acknowledged
        if (invoice.docType === 'I') {
            // AR Invoice Item Approval
            window.location.href = `../../../approval/02.ARInvoice/Approval/PartApprovalInvItem.html?stagingID=${stagingId}&status=Acknowledged&source=acknowledge`;
        } else if (invoice.docType === 'S') {
            // AR Invoice Service Approval
            window.location.href = `../../../approval/02.ARInvoice/Approval/PartApprovalInvItem.html?stagingID=${stagingId}&status=Acknowledged&source=acknowledge`;
        } else {
            // Default ke Invoice Item Approval
            window.location.href = `../../../approval/02.ARInvoice/Approval/PartApprovalInvItem.html?stagingID=${stagingId}&status=Acknowledged&source=acknowledge`;
        }
    } else {
        // Kalau invoice tidak ditemukan
        window.location.href = `../../../approval/02.ARInvoice/Approval/PartApprovalInvItem.html?stagingId=${stagingId}&status=Acknowledged&source=acknowledge`;
    }
};

window.acknowledgeInvoice = async function (id) {
    // Acknowledge invoice
    if (confirm('Are you sure you want to acknowledge this invoice?')) {
        // In production, make API call to acknowledge
        console.log('Acknowledging invoice:', id);
        await loadDashboard(); // Reload to update status
    }
};

window.rejectInvoice = async function (id) {
    // Reject invoice
    if (confirm('Are you sure you want to reject this invoice?')) {
        // In production, make API call to reject
        console.log('Rejecting invoice:', id);
        await loadDashboard(); // Reload to update status
    }
};

window.printInvoice = function (id) {
    // Open print dialog for invoice
    window.open(`../../../../pages/printInvoice.html?id=${id}`, '_blank');
};

function viewInvoiceDetails(stagingId) {
    // Find the invoice data to get docType
    const invoice = allInvoices.find(inv => inv.id === stagingId);

    if (invoice) {
        // Route based on docType
        if (invoice.docType === 'I') {
            // Navigate to acknowledge invoice item page
            window.location.href = `../../../approval/acknowledge/InvoiceItem/acknowInvItem.html?stagingId=${stagingId}`;
        } else if (invoice.docType === 'S') {
            // Navigate to acknowledge invoice service page
            window.location.href = `../../../approval/acknowledge/InvoiceService/acknowInvService.html?stagingId=${stagingId}`;
        } else {
            // Default fallback to invoice item page
            window.location.href = `../../../approval/acknowledge/InvoiceItem/acknowInvItem.html?stagingId=${stagingId}`;
        }
    } else {
        // If invoice not found, default to invoice item page
        window.location.href = `../../../approval/acknowledge/InvoiceItem/acknowInvItem.html?stagingId=${stagingId}`;
    }
}

async function acknowledgeInvoice(id) {
    // Acknowledge invoice
    if (confirm('Are you sure you want to acknowledge this invoice?')) {
        // In production, make API call to acknowledge
        console.log('Acknowledging invoice:', id);
        await loadDashboard(); // Reload to update status
    }
}

async function rejectInvoice(id) {
    // Reject invoice
    if (confirm('Are you sure you want to reject this invoice?')) {
        // In production, make API call to reject
        console.log('Rejecting invoice:', id);
        await loadDashboard(); // Reload to update status
    }
}

function printInvoice(id) {
    // Open print dialog for invoice
    window.open(`../../../../pages/printInvoice.html?id=${id}`, '_blank');
}

window.toggleSidebar = function () {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
};

window.toggleSubMenu = function (menuId) {
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
window.downloadExcel = async function () {
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
            'Type': invoice.invoiceType,
            'Total': invoice.totalAmount
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'AR Invoices');

        // Generate filename
        const date = new Date().toISOString().split('T')[0];
        const filename = `AR_Invoice_Acknowledge_${currentTab}_${date}.xlsx`;

        XLSX.writeFile(workbook, filename);

    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Error exporting to Excel. Please try again.');
    }
}

window.downloadPDF = async function () {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(16);
        doc.text('AR Invoice Acknowledge Report', 14, 20);

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
            invoice.invoiceType,
            formatCurrency(invoice.totalAmount)
        ]);

        // Add table
        doc.autoTable({
            head: [['Invoice No.', 'Customer', 'Sales Employee', 'Date', 'Due Date', 'Status', 'Type', 'Total']],
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
        const filename = `AR_Invoice_Acknowledge_${currentTab}_${date}.pdf`;

        doc.save(filename);

    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Error exporting to PDF. Please try again.');
    }
}

// Profile navigation
window.goToProfile = function () {
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
async function pollCheckedDocs() {
    // Poll for new checked documents
    setInterval(async () => {
        if (currentTab === 'checked') {
            await loadDashboard();
        }
    }, 30000); // Poll every 30 seconds
}

async function pollAcknowledgedDocs() {
    // Poll for new acknowledged documents
    setInterval(async () => {
        if (currentTab === 'acknowledged') {
            await loadDashboard();
        }
    }, 30000); // Poll every 30 seconds
}

async function pollRejectedDocs() {
    // Poll for new rejected documents
    setInterval(async () => {
        if (currentTab === 'rejected') {
            await loadDashboard();
        }
    }, 30000); // Poll every 30 seconds
}

// Start polling when page loads
document.addEventListener('DOMContentLoaded', async function () {
    // Wait a bit before starting polling to avoid conflicts with initial load
    setTimeout(() => {
        pollCheckedDocs();
        pollAcknowledgedDocs();
        pollRejectedDocs();
    }, 5000); // Start polling after 5 seconds
}); 