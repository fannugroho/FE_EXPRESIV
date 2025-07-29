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
        console.error('Error loading user data:', error);
    }
}

// Function to get user ID from token
function getUserId() {
    // DEVELOPMENT MODE: Return dummy user ID
    return 'dev-user-001';
    
    // In production, uncomment this:
    /*
    try {
        const token = getAccessToken();
        if (!token) return null;
        
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload.sub;
    } catch (error) {
        console.error('Error parsing token:', error);
        return null;
    }
    */
}

async function loadDashboard() {
    try {
        // Get user ID for approver ID
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
            status: 'acknowledge',
            totalAmount: 15000000,
            invoiceType: 'Regular',
            remarks: 'Pending approval'
        },
        {
            id: 2,
            invoiceNo: 'INV-2024-002',
            customerName: 'CV Sukses Mandiri',
            salesEmployee: 'Jane Smith',
            invoiceDate: '2024-01-16',
            dueDate: '2024-02-16',
            status: 'approved',
            totalAmount: 25000000,
            invoiceType: 'Regular',
            remarks: 'Approved by manager'
        },
        {
            id: 3,
            invoiceNo: 'INV-2024-003',
            customerName: 'PT Global Solutions',
            salesEmployee: 'Mike Johnson',
            invoiceDate: '2024-01-17',
            dueDate: '2024-02-17',
            status: 'rejected',
            totalAmount: 8500000,
            invoiceType: 'Special',
            remarks: 'Rejected - incomplete documentation'
        },
        {
            id: 4,
            invoiceNo: 'INV-2024-004',
            customerName: 'PT Teknologi Maju',
            salesEmployee: 'Sarah Wilson',
            invoiceDate: '2024-01-18',
            dueDate: '2024-02-18',
            status: 'acknowledge',
            totalAmount: 12000000,
            invoiceType: 'Regular',
            remarks: 'Awaiting approval'
        },
        {
            id: 5,
            invoiceNo: 'INV-2024-005',
            customerName: 'CV Inovasi Baru',
            salesEmployee: 'David Brown',
            invoiceDate: '2024-01-19',
            dueDate: '2024-02-19',
            status: 'approved',
            totalAmount: 18000000,
            invoiceType: 'Special',
            remarks: 'Approved with conditions'
        }
    ];
    
    // Filter based on current tab
    return mockInvoices.filter(invoice => {
        if (currentTab === 'acknowledge') return invoice.status === 'acknowledge';
        if (currentTab === 'approved') return invoice.status === 'approved';
        if (currentTab === 'rejected') return invoice.status === 'rejected';
        return true;
    });
}

async function updateCounters() {
    try {
        const userId = getUserId();
        if (!userId) return;

        // Calculate from actual data
        const totalCount = allInvoices.length;
        const acknowledgeCount = allInvoices.filter(inv => inv.status === 'Acknowledged').length;
        const approveCount = allInvoices.filter(inv => inv.status === 'Approved').length;
        const rejectedCount = allInvoices.filter(inv => inv.status === 'Rejected').length;

        // Update counter displays
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('acknowledgeCount').textContent = acknowledgeCount;
        document.getElementById('approveCount').textContent = approveCount;
        document.getElementById('rejectedCount').textContent = rejectedCount;
        
    } catch (error) {
        console.error('Error updating counters:', error);
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
            <td class="p-2 scrollable-cell">${invoice.salesEmployee}</td>
            <td class="p-2">${formatDate(invoice.invoiceDate)}</td>
            <td class="p-2">${formatDate(invoice.dueDate)}</td>
            <td class="p-2">
                <span class="status-badge ${statusClass}">${invoice.status}</span>
            </td>
            <td class="p-2 text-right">${formatCurrency(invoice.totalAmount)}</td>
            <td class="p-2">${invoice.invoiceType}</td>
            <td class="p-2">
                <div class="approval-actions">
                    <button onclick="viewInvoiceDetails(${invoice.id})" class="tool-btn tool-btn-view">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });

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
    console.log('View invoice details:', id);
    // Implement view details functionality
    window.open(`../approval/approve/invoiceItem/approveInvItem.html?id=${id}`, '_blank');
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
    window.open(`../approval/approve/invoiceItem/approveInvItem.html?id=${id}&mode=edit`, '_blank');
}

function printInvoice(id) {
    console.log('Print invoice:', id);
    // Implement print functionality
    window.open(`../approval/approve/invoiceItem/printInvItem.html?id=${id}`, '_blank');
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
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
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        // Mock notification count for development
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

// Start polling for real-time updates
setInterval(pollAcknowledgeDocs, 30000); // Poll every 30 seconds
setInterval(pollApprovedDocs, 30000);
setInterval(pollRejectedDocs, 30000);

// Update notification badge periodically
setInterval(updateNotificationBadge, 60000); // Update every minute 