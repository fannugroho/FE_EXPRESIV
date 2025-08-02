// Current tab state
let currentTab = 'all'; // Default tab
let currentSearchTerm = '';
let currentSearchType = 'invoice';
let allInvoices = [];
let filteredInvoices = [];
let currentPage = 1;
const itemsPerPage = 10;

// API Base URL is defined in auth.js - using that instead of redeclaring
// const BASE_URL = 'http://localhost:5000'; // Update with your actual API base URL

// Authentication check - using original authentication
if (typeof isAuthenticated === 'function') {
    if (!isAuthenticated()) {
        window.location.href = '../../../../pages/login.html';
    }
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
    try {
        // Get user data from authentication token
        const userData = getCurrentUser();
        
        if (userData && userData.username) {
            const userNameDisplay = document.getElementById('userNameDisplay');
            if (userNameDisplay) {
                userNameDisplay.textContent = userData.username;
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
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Helper function to get user ID
function getUserId() {
    try {
        const userData = getCurrentUser();
        return userData ? userData.userId : null;
    } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
}

async function loadDashboard() {
    try {
        // Get user ID for checker ID
        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }

        // Build API URL for AR Invoices
        const apiUrl = `${BASE_URL}/api/ar-invoices`;
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
        case 'prepared':
            return invoices.filter(inv => inv.status === 'Prepared');
        case 'checked':
            return invoices.filter(inv => inv.status === 'Checked');
        case 'rejected':
            return invoices.filter(inv => inv.status === 'Rejected');
        case 'draft':
            return invoices.filter(inv => inv.status === 'Draft');
        case 'acknowledged':
            return invoices.filter(inv => inv.status === 'Acknowledged');
        case 'approved':
            return invoices.filter(inv => inv.status === 'Approved');
        case 'received':
            return invoices.filter(inv => inv.status === 'Received');
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



async function updateCounters() {
    try {
        const userId = getUserId();
        
        // Calculate from actual data
        const totalCount = allInvoices.length;
        const preparedCount = allInvoices.filter(inv => inv.status === 'Prepared').length;
        const checkedCount = allInvoices.filter(inv => inv.status === 'Checked').length;
        const rejectedCount = allInvoices.filter(inv => inv.status === 'Rejected').length;
        
        // Update counter displays
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('preparedCount').textContent = preparedCount;
        document.getElementById('checkedCount').textContent = checkedCount;
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
        
        // Invoice Number
        const cellInvoice = row.insertCell();
        cellInvoice.className = 'p-2';
        cellInvoice.innerHTML = `<div class="scrollable-cell">${invoice.invoiceNo}</div>`;
        
        // Customer
        const cellCustomer = row.insertCell();
        cellCustomer.className = 'p-2';
        cellCustomer.innerHTML = `<div class="scrollable-cell">${invoice.customerName}</div>`;
        
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
    
    // Try to find the tab button and make it active
    const tabBtn = document.getElementById(tabName + 'TabBtn');
    if (tabBtn) {
        tabBtn.classList.add('tab-active');
    }
    
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
    // Find the invoice data to get docType
    const invoice = allInvoices.find(inv => inv.id === id);
    
    if (invoice) {
        // Route based on docType
        if (invoice.docType === 'I') {
            // Navigate to invoice item check page
            window.location.href = `../../../approval/check/invoiceItem/checkInvItem.html?stagingId=${id}`;
        } else if (invoice.docType === 'S') {
            // Navigate to invoice service check page
            window.location.href = `../../../approval/check/invoiceServices/checkInvService.html?stagingId=${id}`;
        } else {
            // Default fallback to invoice item page
            window.location.href = `../../../approval/check/invoiceItem/checkInvItem.html?stagingId=${id}`;
        }
    } else {
        // Fallback if invoice not found
        window.location.href = `../../../approval/check/invoiceItem/checkInvItem.html?stagingId=${id}`;
    }
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
    // Find the invoice data to get docType
    const invoice = allInvoices.find(inv => inv.id === id);
    
    if (invoice) {
        // Route based on docType
        if (invoice.docType === 'I') {
            // Navigate to invoice item check page
            window.location.href = `../../../approval/check/invoiceItem/checkInvItem.html?stagingId=${id}`;
        } else if (invoice.docType === 'S') {
            // Navigate to invoice service check page
            window.location.href = `../../../approval/check/invoiceServices/checkInvService.html?stagingId=${id}`;
        } else {
            // Default fallback to invoice item page
            window.location.href = `../../../approval/check/invoiceItem/checkInvItem.html?stagingId=${id}`;
        }
    } else {
        // Fallback if invoice not found
        window.location.href = `../../../approval/check/invoiceItem/checkInvItem.html?stagingId=${id}`;
    }
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
        
        // Prepare data for export with additional API fields
        const exportData = filteredInvoices.map(invoice => ({
            'Invoice No.': invoice.invoiceNo,
            'Customer': invoice.customerName,
            'Sales Employee': invoice.salesEmployee,
            'Date': formatDate(invoice.invoiceDate),
            'Due Date': formatDate(invoice.dueDate),
            'Status': invoice.status,
            'Total (IDR)': invoice.totalAmount,
            'Type': invoice.invoiceType,
            'Doc Type': invoice.docType || '',
            'Customer Code': invoice.cardCode,
            'Address': invoice.address,
            'Prepared By NIK': invoice.preparedByNIK,
            'Currency': invoice.currency,
            'VAT Sum': invoice.vatSum,
            'Comments': invoice.comments,
            'Is Transfered': invoice.isTransfered,
            'Created At': formatDate(invoice.createdAt),
            'Updated At': formatDate(invoice.updatedAt)
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
        
        // Prepare table data with additional API fields
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
                fontSize: 7,
                cellPadding: 1
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