/**
 * AR Invoice Check Dashboard
 * Updated to use the new API endpoint: /api/ar-invoices/by-checked/{kansaiEmployeeId}
 * This dashboard shows invoices that have been checked by the current user
 */

// Current tab state
let currentTab = 'prepared'; // Default tab - changed to prepared for checker view
let currentSearchTerm = '';
let currentSearchType = 'invoice';
let allInvoices = [];
let filteredInvoices = [];
let currentPage = 1;
const itemsPerPage = 10;

// API Configuration - Using BASE_URL from auth.js
const API_BASE_URL = `${BASE_URL}/api`;

// Authentication check - using original authentication
if (typeof isAuthenticated === 'function') {
    if (!isAuthenticated()) {
        window.location.href = '../../../../pages/login.html';
    }
}

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function () {
    loadUserData();
    loadDashboard();

    // Add auto-refresh functionality
    setupAutoRefresh();

    // Add event listener for search input with debouncing
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearch();
            }, 500); // Debounce search by 500ms
        });
    }

    // Add event listener to the search type dropdown
    const searchType = document.getElementById('searchType');
    if (searchType) {
        searchType.addEventListener('change', function () {
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
        if (userData && userData.userId) {
            return userData.userId;
        }

        // Fallback to default user ID for development
        const defaultUserId = '7e0e0ad6-bceb-4e92-8a38-e14b7fb097ae';
        console.log('Using default user ID:', defaultUserId);
        return defaultUserId;
    } catch (error) {
        console.error('Error getting user ID:', error);
        // Fallback to default user ID
        return '7e0e0ad6-bceb-4e92-8a38-e14b7fb097ae';
    }
}

// Function to fetch user data from API
async function fetchUserData(userId) {
    try {
        console.log('Fetching user data for ID:', userId);

        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'GET',
            headers: {
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('User API Response:', result);

        if (result.status && result.data) {
            console.log('User data fetched successfully:', result.data);
            return result.data;
        } else {
            throw new Error('Invalid user API response format');
        }

    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

// Function to fetch AR invoices by checked NIK
async function fetchARInvoicesByCheckedNIK(kansaiEmployeeId) {
    try {
        console.log('Fetching AR invoices for checked NIK:', kansaiEmployeeId);

        // Use the by-checked endpoint with the kansaiEmployeeId
        const apiUrl = `${API_BASE_URL}/ar-invoices/by-checked/${kansaiEmployeeId}`;
        console.log('Fetching data from:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain'
            }
        });

        console.log('API Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('AR Invoices API Response:', result);

        if (result.status && result.data) {
            console.log(`Successfully loaded ${result.data.length} invoices for checked NIK ${kansaiEmployeeId}`);
            return result.data;
        } else {
            console.error('API returned error:', result.message);
            return [];
        }

    } catch (error) {
        console.error('Error fetching AR invoices:', error);
        throw error;
    }
}

async function loadDashboard() {
    try {
        // Get user ID
        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }

        console.log('Loading dashboard for user ID:', userId);

        // Step 1: Fetch user data to get kansaiEmployeeId
        const userData = await fetchUserData(userId);
        const kansaiEmployeeId = userData.kansaiEmployeeId;

        if (!kansaiEmployeeId) {
            console.error('No kansaiEmployeeId found in user data');
            alert('User data is incomplete. Please contact administrator.');
            return;
        }

        console.log('Using kansaiEmployeeId for invoice filtering:', kansaiEmployeeId);

        // Step 2: Fetch AR invoices that have been checked by this user
        const invoices = await fetchARInvoicesByCheckedNIK(kansaiEmployeeId);

        console.log('Transforming API data...');
        // Transform API data to match our expected format
        allInvoices = invoices.map(invoice => {
            // Map docType to display type
            let displayType = 'Regular';
            if (invoice.docType === 'I') {
                displayType = 'Item';
            } else if (invoice.docType === 'S') {
                displayType = 'Services';
            }

            const transformedInvoice = {
                id: invoice.stagingID,
                invoiceNo: invoice.u_bsi_invnum || invoice.numAtCard || invoice.visInv,
                customerName: invoice.cardName,
                salesEmployee: invoice.u_BSI_Expressiv_PreparedByName || 'N/A',
                invoiceDate: invoice.docDate,
                dueDate: invoice.docDueDate,
                status: getInvoiceStatus(invoice), // We'll need to determine status based on approval data
                totalAmount: invoice.docTotal || invoice.grandTotal,
                invoiceType: displayType,
                // Additional fields from API
                cardCode: invoice.cardCode,
                address: invoice.address,
                comments: invoice.comments,
                preparedByNIK: invoice.u_BSI_Expressiv_PreparedByNIK,
                currency: invoice.docCur,
                vatSum: invoice.vatSum,
                vatSumFC: invoice.vatSumFC,
                wtSum: invoice.wtSum,
                wtSumFC: invoice.wtSumFC,
                isTransfered: invoice.u_BSI_Expressiv_IsTransfered,
                createdAt: invoice.createdAt,
                updatedAt: invoice.updatedAt,
                approvalSummary: invoice.arInvoiceApprovalSummary,
                docType: invoice.docType, // Keep original docType for reference
                // Additional fields from new API response
                docNum: invoice.docNum,
                docRate: invoice.docRate,
                docTotalFC: invoice.docTotalFC,
                grandTotal: invoice.grandTotal,
                netAmount: invoice.netAmount,
                docTax: invoice.docTax,
                discSum: invoice.discSum,
                sysRate: invoice.sysRate,
                docBaseAmount: invoice.docBaseAmount,
                licTradNum: invoice.licTradNum,
                taxRate: invoice.taxRate,
                dpp1112: invoice.dpp1112,
                qrCodeSrc: invoice.qrCodeSrc,
                u_BankCode: invoice.u_BankCode,
                account: invoice.account,
                acctName: invoice.acctName,
                netPrice: invoice.netPrice,
                netPriceAfterDiscount: invoice.netPriceAfterDiscount,
                trackNo: invoice.trackNo,
                trnspCode: invoice.trnspCode,
                u_BSI_ShippingType: invoice.u_BSI_ShippingType,
                groupNum: invoice.groupNum,
                u_BSI_PaymentGroup: invoice.u_BSI_PaymentGroup,
                u_bsi_udf1: invoice.u_bsi_udf1,
                u_bsi_udf2: invoice.u_bsi_udf2,
                u_bsi_udf3: invoice.u_bsi_udf3,
                docEntryHeader: invoice.docEntryHeader,
                signedFilePath: invoice.signedFilePath,
                arInvoiceDetails: invoice.arInvoiceDetails,
                arInvoiceAttachments: invoice.arInvoiceAttachments
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

        // Enhanced fallback logic based on date fields
        if (summary.rejectedDate) return 'Rejected';
        if (summary.receivedDate) return 'Received';
        if (summary.approvedDate) return 'Approved';
        if (summary.acknowledgedDate) return 'Acknowledged';
        if (summary.checkedDate) return 'Checked';
        if (summary.preparedDate) return 'Prepared';

        // Legacy fallback to old logic if dates are not available
        if (summary.isRejected) return 'Rejected';
        if (summary.isApproved) return 'Approved';
        if (summary.isAcknowledged) return 'Acknowledged';
        if (summary.isChecked) return 'Checked';
        if (summary.isReceived) return 'Received';
    }

    // Additional checks based on other fields
    if (invoice.u_BSI_Expressiv_IsTransfered === 'Y') return 'Received';
    if (invoice.stagingID && invoice.stagingID.startsWith('STG')) return 'Draft';
    if (invoice.docNum && invoice.docNum > 0) return 'Prepared';

    return 'Draft';
}

// Helper function to filter invoices by tab
function filterInvoicesByTab(invoices, tab) {
    switch (tab) {
        case 'all':
            return invoices;
        case 'prepared':
            // Tab prepared: hanya menampilkan dokumen yang statusnya Prepared saja
            return invoices.filter(inv => inv.status === 'Prepared');
        case 'checked':
            // Tab checked: menampilkan dokumen yang statusnya checked, acknowledged, approved, received
            return invoices.filter(inv =>
                inv.status === 'Checked' ||
                inv.status === 'Acknowledged' ||
                inv.status === 'Approved' ||
                inv.status === 'Received'
            );
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
        // Calculate from actual data
        const totalCount = allInvoices.length;
        const preparedCount = allInvoices.filter(inv => inv.status === 'Prepared').length;
        // Checked count: termasuk dokumen dengan status Checked, Acknowledged, Approved, Received
        const checkedCount = allInvoices.filter(inv =>
            inv.status === 'Checked' ||
            inv.status === 'Acknowledged' ||
            inv.status === 'Approved' ||
            inv.status === 'Received'
        ).length;
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

        // Invoice Number (no scroll)
        const cellInvoice = row.insertCell();
        cellInvoice.className = 'p-2';
        cellInvoice.textContent = `${invoice.invoiceNo}`;

        // Customer (small scroll if > 15 chars)
        const cellCustomer = row.insertCell();
        const useSmallScroll = invoice.customerName && invoice.customerName.length > 15;
        cellCustomer.className = 'p-2';
        cellCustomer.innerHTML = useSmallScroll
            ? `<div class="scrollable-cell-sm">${invoice.customerName}</div>`
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

        // Type
        const cellType = row.insertCell();
        cellType.className = 'p-2';
        cellType.textContent = invoice.invoiceType;

        // Total Amount
        const cellAmount = row.insertCell();
        cellAmount.className = 'p-2 text-right';
        cellAmount.textContent = formatCurrency(invoice.totalAmount);

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
window.switchTab = function (tabName) {
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

// window.viewInvoiceDetails = function (id) {
//     // Find the invoice data to get docType
//     const invoice = allInvoices.find(inv => inv.id === id);

//     if (invoice) {
//         // Route based on docType
//         if (invoice.docType === 'I') {
//             // Navigate to invoice item check page
//             window.location.href = `../../../approval/check/invoiceItem/checkInvItem.html?stagingId=${id}`;
//         } else if (invoice.docType === 'S') {
//             // Navigate to invoice service check page
//             window.location.href = `../../../approval/check/invoiceServices/checkInvService.html?stagingId=${id}`;
//         } else {
//             // Default fallback to invoice item page
//             window.location.href = `../../../approval/check/invoiceItem/checkInvItem.html?stagingId=${id}`;
//         }
//     } else {
//         // Fallback if invoice not found
//         window.location.href = `../../../approval/check/invoiceItem/checkInvItem.html?stagingId=${id}`;
//     }
// };

window.viewInvoiceDetails = function (id) {
    // Selalu redirect ke halaman PartApprovalInvItem.html dengan status Checked
    window.location.href = `../../../approval/02.ARInvoice/Approval/PartApprovalInvItem.html?stagingID=${id}&status=Checked&source=check`;
};

window.editInvoice = function (id) {
    // Navigate to edit invoice page
    window.location.href = `../../../../addPages/addInvoice.html?id=${id}`;
};

window.printInvoice = function (id) {
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

        // Prepare data for export with additional API fields
        const exportData = filteredInvoices.map(invoice => ({
            'Invoice No.': invoice.invoiceNo,
            'Customer': invoice.customerName,
            'Sales Employee': invoice.salesEmployee,
            'Date': formatDate(invoice.invoiceDate),
            'Due Date': formatDate(invoice.dueDate),
            'Status': invoice.status,
            'Type': invoice.invoiceType,
            'Total': invoice.totalAmount,
            'Doc Type': invoice.docType || '',
            'Customer Code': invoice.cardCode,
            'Address': invoice.address,
            'Prepared By NIK': invoice.preparedByNIK,
            'Currency': invoice.currency,
            'VAT Sum': invoice.vatSum,
            'VAT Sum FC': invoice.vatSumFC,
            'WT Sum': invoice.wtSum,
            'WT Sum FC': invoice.wtSumFC,
            'Comments': invoice.comments,
            'Is Transfered': invoice.isTransfered,
            'Created At': formatDate(invoice.createdAt),
            'Updated At': formatDate(invoice.updatedAt),
            // Additional fields from new API
            'Doc Number': invoice.docNum,
            'Doc Rate': invoice.docRate,
            'Doc Total FC': invoice.docTotalFC,
            'Grand Total': invoice.grandTotal,
            'Net Amount': invoice.netAmount,
            'Tax Amount': invoice.docTax,
            'Discount Sum': invoice.discSum,
            'System Rate': invoice.sysRate,
            'Doc Base Amount': invoice.docBaseAmount,
            'Tax Rate': invoice.taxRate,
            'License Number': invoice.licTradNum,
            'DPP 11-12': invoice.dpp1112,
            'Bank Code': invoice.u_BankCode,
            'Account': invoice.account,
            'Account Name': invoice.acctName,
            'Net Price': invoice.netPrice,
            'Net Price After Discount': invoice.netPriceAfterDiscount,
            'Tracking Number': invoice.trackNo,
            'Transport Code': invoice.trnspCode,
            'Shipping Type': invoice.u_BSI_ShippingType,
            'Group Number': invoice.groupNum,
            'Payment Group': invoice.u_BSI_PaymentGroup,
            'UDF1': invoice.u_bsi_udf1,
            'UDF2': invoice.u_bsi_udf2,
            'UDF3': invoice.u_bsi_udf3,
            'Doc Entry Header': invoice.docEntryHeader,
            'Signed File Path': invoice.signedFilePath
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

window.downloadPDF = async function () {
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
            invoice.invoiceType,
            formatCurrency(invoice.totalAmount)
        ]);

        // Add table
        doc.autoTable({
            head: [['Invoice No.', 'Customer', 'Sales Employee', 'Date', 'Due Date', 'Status', 'Type', 'Total']],
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
document.addEventListener('DOMContentLoaded', function () {
    pollPreparedDocs();
    pollCheckedDocs();
}); 