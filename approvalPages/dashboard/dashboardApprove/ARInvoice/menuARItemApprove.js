// Current tab state
let currentTab = 'acknowledged'; // Default tab
let currentSearchTerm = '';
let currentSearchType = 'invoice';
let allInvoices = [];
let filteredInvoices = [];
let currentPage = 1;
const itemsPerPage = 10;

// ========================================
// DEVELOPMENT MODE: AUTHENTICATION BYPASSED
// ========================================
// Authentication has been temporarily disabled for development purposes.
// 
// To re-enable authentication:
// 1. Comment out the authentication override section (lines 23-31)
// 2. Set BYPASS_AUTH_FOR_DEVELOPMENT to false in auth.js
// 3. Remove or comment out the isAuthenticated override
// ========================================

// Override authentication check for development
if (typeof isAuthenticated === 'function') {
    const originalIsAuthenticated = isAuthenticated;
    window.isAuthenticated = function() {
        console.log('Development mode: Authentication check bypassed');
        return true;
    };
}

// Helper function to check authentication with development mode support
function checkAuthentication() {
    console.log('Development mode: Authentication check bypassed');
        return true; // Always return true in development mode
}

// API Base URL is defined in auth.js - using that instead of redeclaring
// const BASE_URL = 'http://localhost:5000'; // Update with your actual API base URL

// ========================================
// AUTHENTICATION ENABLED
// ========================================
// Authentication is now properly enabled.
// The system will use real user authentication and tokens.
// ========================================

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', async function() {
    // Development mode: Skip authentication check
    console.log('Development mode: Skip authentication check');
    
    await loadUserData();
    await loadDashboard();
    
    // Start polling for real-time updates
    startPolling();
    
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
async function loadUserData() {
    try {
        // Development mode: Use dummy data like in acknowledge page
            console.log('Development mode: Using dummy user data');
            
        // Get user ID from localStorage or use default
        const userId = localStorage.getItem('userId') || '7e0e0ad6-bceb-4e92-8a38-e14b7fb097ae';
        
        // Try to fetch user data from API, but don't fail if it doesn't work
        try {
            const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                }
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.status && result.data) {
                    const userData = result.data;
                    console.log('User data loaded:', userData);
            
            // Display user name and avatar
                    if (userData.fullName) {
            const userNameDisplay = document.getElementById('userNameDisplay');
            if (userNameDisplay) {
                            userNameDisplay.textContent = userData.fullName;
                        }
                    }
                    
                    // Store user data for later use
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                } else {
                    throw new Error('Failed to get user data');
                }
            } else {
                throw new Error('API request failed');
            }
        } catch (apiError) {
            console.log('API call failed, using fallback dummy data:', apiError);
            // Fallback to dummy data
            setDummyUserData();
        }
        
        // Set default avatar and show profile
            const dashboardUserIcon = document.getElementById('dashboardUserIcon');
            if (dashboardUserIcon) {
            dashboardUserIcon.src = '../../../../image/profil.png';
            }
            
            // Show user profile section
            const userProfile = document.querySelector('.user-profile');
            if (userProfile) {
                userProfile.style.display = 'flex';
            }
            
            return;
        
    } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to dummy data on any error
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
        // Development mode: Use consistent approach like acknowledge page
        const userId = localStorage.getItem('userId') || '7e0e0ad6-bceb-4e92-8a38-e14b7fb097ae';
        
        // Try to fetch user data to get kansaiEmployeeId
        try {
            const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                }
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.status && result.data) {
                    console.log('User data fetched for ID:', result.data);
                    return result.data.kansaiEmployeeId;
                } else {
                    console.log('Failed to get user data, using fallback');
                    return '02403121'; // Fallback for development
                }
            } else {
                throw new Error('API request failed');
            }
        } catch (apiError) {
            console.log('API call failed, using fallback user ID:', apiError);
            return '02403121'; // Fallback for development
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        return '02403121'; // Fallback for development
    }
}

async function loadDashboard() {
    try {
        // Development mode: Bypassing authentication check
            console.log('Development mode: Bypassing authentication check');

        // Get user ID for approver ID
        const userId = await getUserId();
        if (!userId) {
            console.log('Unable to get user ID, using fallback.');
            // Don't redirect, just use fallback data
        }

        console.log('Using kansaiEmployeeId for API call:', userId);

        // Build API URL for AR Invoices by approved status
        const apiUrl = `${BASE_URL}/api/ar-invoices/by-approved/${userId}`;
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
        
        // Show error message to user
        const errorMessage = 'Error loading dashboard data. Please try again.';
        console.error(errorMessage, error);
        
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
    console.log('Filtering invoices by tab:', tab);
    console.log('Total invoices before filtering:', invoices.length);

    switch (tab) {
        case 'acknowledged':
            // Show only documents with 'Acknowledged' status
            const acknowledgedInvoices = invoices.filter(inv => inv.status === 'Acknowledged');
            console.log('Acknowledged invoices found:', acknowledgedInvoices.length);
            return acknowledgedInvoices;
        case 'approved':
            // Show documents with 'Approved' and 'Received' status
            const approvedInvoices = invoices.filter(inv => 
                inv.status === 'Approved' || inv.status === 'Received'
            );
            console.log('Approved/Received invoices found:', approvedInvoices.length);
            return approvedInvoices;
        case 'rejected':
            const rejectedInvoices = invoices.filter(inv => inv.status === 'Rejected');
            console.log('Rejected invoices found:', rejectedInvoices.length);
            return rejectedInvoices;
        case 'all':
            return invoices;
        case 'prepared':
            return invoices.filter(inv => inv.status === 'Prepared');
        case 'checked':
            return invoices.filter(inv => inv.status === 'Checked');
        case 'draft':
            return invoices.filter(inv => inv.status === 'Draft');
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

// Mock data function removed - now using real API data

async function updateCounters() {
    try {
        console.log('Updating counters with all invoices:', allInvoices.length);

        const userId = getUserId();
        if (!userId) {
            console.log('Unable to get user ID, using fallback');
        }

        // Calculate from actual data
        const totalCount = allInvoices.length;
        const acknowledgeCount = allInvoices.filter(inv => inv.status === 'Acknowledged').length;
        // Include both 'Approved' and 'Received' status in approve count
        const approveCount = allInvoices.filter(inv => 
            inv.status === 'Approved' || inv.status === 'Received'
        ).length;
        const rejectedCount = allInvoices.filter(inv => inv.status === 'Rejected').length;

        console.log('Counter calculations:', {
            total: totalCount,
            acknowledged: acknowledgeCount,
            approved: approveCount,
            rejected: rejectedCount
        });

        // Update counter displays
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('acknowledgeCount').textContent = acknowledgeCount;
        document.getElementById('approveCount').textContent = approveCount;
        document.getElementById('rejectedCount').textContent = rejectedCount;
        
    } catch (error) {
        console.error('Error updating counters:', error);
        // Log error for debugging
        console.log('Error in updateCounters:', error);
    }
}

function updateTable(invoices) {
    const tbody = document.getElementById('recentDocs');
    if (!tbody) return;

    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageInvoices = invoices.slice(startIndex, endIndex);

    pageInvoices.forEach((invoice, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        const statusClass = getStatusClass(invoice.status);
        
        // Debug logging for status
        console.log(`Invoice ${index + 1} status:`, invoice.status);
        console.log(`Invoice ${index + 1} status class:`, statusClass);
        
        row.innerHTML = `
            <td class="p-2">${startIndex + index + 1}</td>
            <td class="p-2 scrollable-cell">${invoice.invoiceNo}</td>
            <td class="p-2 scrollable-cell">${invoice.customerName}</td>
            <td class="p-2">${formatDate(invoice.invoiceDate)}</td>
            <td class="p-2">${formatDate(invoice.dueDate)}</td>
            <td class="p-2">
                <span class="status-badge ${statusClass}">${invoice.status}</span>
            </td>
            <td class="p-2 text-right">${formatCurrency(invoice.totalAmount)}</td>
            <td class="p-2">${invoice.invoiceType}</td>
            <td class="p-2">
                <div class="approval-actions">
                    <button onclick="viewInvoiceDetails('${invoice.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });

    updatePaginationInfo(invoices.length);
}

function formatDate(dateString) {
    // Check if user is authenticated


    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
}

function formatCurrency(amount) {
    // Check if user is authenticated


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
    
    prevBtn.classList.toggle('disabled', currentPage <= 1);
    nextBtn.classList.toggle('disabled', endItem >= totalItems);
}

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

function changePage(direction) {


    const newPage = currentPage + direction;
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable(filteredInvoices);
    }
}

function goToTotalDocs() {


    console.log('Navigate to total documents');
    // Implement navigation to total documents view
}

// Approval action functions
function viewInvoiceDetails(id) {


    // Find the invoice data to get docType
    const invoice = allInvoices.find(inv => inv.id == id);
    
    if (!invoice) {
        console.error('Invoice not found with ID:', id);
        alert('Invoice not found. Please try again.');
        return;
    }
    
    // Route based on docType
    if (invoice.docType === 'I') {
        // Route to Invoice Item approval page
        window.location.href = `../../../../approvalPages/approval/approve/invoiceItem/approveInvItem.html?stagingId=${id}`;
    } else if (invoice.docType === 'S') {
        // Route to Invoice Service approval page
        window.location.href = `../../../../approvalPages/approval/approve/invoiceService/approveInvService.html?stagingId=${id}`;
    } else {
        // Default fallback to Invoice Item page
        console.warn('Unknown docType:', invoice.docType, 'Defaulting to Invoice Item page');
        window.location.href = `../../../../approvalPages/approval/approve/invoiceItem/approveInvItem.html?stagingId=${id}`;
    }
}

function approveInvoice(id) {


    if (confirm('Are you sure you want to approve this invoice?')) {
        console.log('Approving invoice:', id);
        // Implement approval API call
        // After successful approval, reload dashboard
        loadDashboard();
    }
}

function rejectInvoice(id) {


    const reason = prompt('Please provide a reason for rejection:');
    if (reason !== null) {
        console.log('Rejecting invoice:', id, 'Reason:', reason);
        // Implement rejection API call
        // After successful rejection, reload dashboard
        loadDashboard();
    }
}

function editInvoice(id) {


    console.log('Edit invoice:', id);
    // Implement edit functionality
    window.location.href = `../approval/approve/invoiceItem/approveInvItem.html?id=${id}&mode=edit`;
}

function printInvoice(id) {


    console.log('Print invoice:', id);
    // Implement print functionality
    window.location.href = `../approval/approve/invoiceItem/printInvItem.html?id=${id}`;
}

function getStatusClass(status) {
    // Check if user is authenticated
    console.log('Getting status class for:', status);

    switch (status.toLowerCase()) {
        case 'acknowledged':
            return 'status-acknowledge';
        case 'acknowledge':
            return 'status-acknowledge';
        case 'approved':
            return 'status-approved';
        case 'rejected':
            return 'status-rejected';
        case 'draft':
            return 'status-draft';
        case 'prepared':
            return 'status-prepared';
        case 'checked':
            return 'status-checked';
        case 'received':
            return 'status-received';
        default:
            return 'status-draft';
    }
}

// Sidebar and navigation functions
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

// Profile and notification functions
function goToProfile() {


    console.log('Navigate to profile');
    // Implement profile navigation
}

function updateNotificationBadge() {
    // Check if user is authenticated
    

    const badge = document.getElementById('notificationBadge');
    if (badge) {
        // TODO: Implement real notification count from API
        // For now, using mock data
        const count = Math.floor(Math.random() * 5);
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

// Export functions
async function downloadExcel() {
    try {


        const data = filteredInvoices.map(invoice => ({
            'Invoice No.': invoice.invoiceNo,
            'Customer': invoice.customerName,
            'Sales Employee': invoice.salesEmployee,
            'Date': formatDate(invoice.invoiceDate),
            'Due Date': formatDate(invoice.dueDate),
            'Status': invoice.status,
            'Total (IDR)': invoice.totalAmount,
            'Type': invoice.invoiceType,
            'Remarks': invoice.remarks || ''
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'AR Invoice Data');
        
        const fileName = `AR_Invoice_${currentTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
    } catch (error) {
        console.error('Error downloading Excel:', error);
        alert('Error downloading Excel file. Please try again.');
    }
}

async function downloadPDF() {
    try {


        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.text('AR Invoice Report', 14, 20);
        doc.setFontSize(10);
        doc.text(`Status: ${currentTab}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);
        
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
            head: [['Invoice No.', 'Customer', 'Sales Employee', 'Date', 'Due Date', 'Status', 'Total', 'Type']],
            body: tableData,
            startY: 45,
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [59, 130, 246]
            }
        });
        
        const fileName = `AR_Invoice_${currentTab}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Error downloading PDF file. Please try again.');
    }
}

// Polling functions for real-time updates
async function pollAcknowledgeDocs() {

    
    if (currentTab === 'acknowledge') {
        await loadDashboard();
    }
}

async function pollApprovedDocs() {

    
    if (currentTab === 'approved') {
        await loadDashboard();
    }
}

async function pollRejectedDocs() {

    
    if (currentTab === 'rejected') {
        await loadDashboard();
    }
}

// Start polling for real-time updates (only if authenticated)
function startPolling() {

    
    console.log('Starting polling for real-time updates');
    setInterval(pollAcknowledgeDocs, 30000); // Poll every 30 seconds
    setInterval(pollApprovedDocs, 30000);
    setInterval(pollRejectedDocs, 30000);
    setInterval(updateNotificationBadge, 60000); // Update every minute
}

 