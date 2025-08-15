// Current tab state
let currentTab = 'approved'; // Default tab for receive dashboard
let currentSearchTerm = '';
let currentSearchType = 'invoice';
let allInvoices = [];
let filteredInvoices = [];
let currentPage = 1;
const itemsPerPage = 10;

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', async function () {
    await loadUserData();
    await loadDashboard();

    // Add event listener for search input with debouncing
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearch();
            }, 500);
        });
    }

    // Add event listener to the search type dropdown
    const searchType = document.getElementById('searchType');
    if (searchType) {
        searchType.addEventListener('change', function () {
            const searchInput = document.getElementById('searchInput');

            if (this.value === 'date') {
                searchInput.type = 'date';
                searchInput.placeholder = 'Select date...';
            } else {
                searchInput.type = 'text';
                searchInput.placeholder = `Search by ${this.options[this.selectedIndex].text}...`;
            }

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
        // Get user ID from localStorage
        const userId = localStorage.getItem('userId');
        if (!userId) {
            console.warn('No user ID found in localStorage');
            return;
        }

        // Fetch user data from API
        const userApiUrl = `${BASE_URL}/api/users/${userId}`;
        console.log('Fetching user data from:', userApiUrl);

        const response = await fetch(userApiUrl, {
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
        console.log('User API Response:', result);

        if (result.status && result.data) {
            const user = result.data;

            // Display user name
            if (user.fullName) {
                const userNameDisplay = document.getElementById('userNameDisplay');
                if (userNameDisplay) {
                    userNameDisplay.textContent = user.fullName;
                }
            }

            // Set avatar (use default if none provided)
            const dashboardUserIcon = document.getElementById('dashboardUserIcon');
            if (dashboardUserIcon) {
                dashboardUserIcon.src = '../../../../image/profil.png';
            }

            // Show user profile
            const userProfile = document.querySelector('.user-profile');
            if (userProfile) {
                userProfile.style.display = 'flex';
            }
        }

    } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to default avatar and name
        const dashboardUserIcon = document.getElementById('dashboardUserIcon');
        if (dashboardUserIcon) {
            dashboardUserIcon.src = '../../../../image/profil.png';
        }

        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            userProfile.style.display = 'flex';
        }
    }
}

// Function to get user ID from token
async function getUserId() {
    try {
        // First, get the user ID from localStorage
        const userId = localStorage.getItem('userId');
        if (!userId) {
            console.warn('No user ID found in localStorage');
            return null;
        }

        // Fetch user data from API to get kansaiEmployeeId
        const userApiUrl = `${BASE_URL}/api/users/${userId}`;
        console.log('Fetching user data from:', userApiUrl);

        const response = await fetch(userApiUrl, {
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
        console.log('User API Response:', result);

        if (result.status && result.data && result.data.kansaiEmployeeId) {
            console.log('Found kansaiEmployeeId:', result.data.kansaiEmployeeId);
            return result.data.kansaiEmployeeId;
        } else {
            console.warn('No kansaiEmployeeId found in user data');
            return null;
        }

    } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
}

// Main function to load dashboard data
async function loadDashboard() {
    try {
        const kansaiEmployeeId = await getUserId();
        if (!kansaiEmployeeId) {
            console.error('No kansaiEmployeeId found. Please login again.');
            // Show empty state when no user ID
            allInvoices = [];
            filteredInvoices = [];
            updateCounters();
            updateTable([]);
            return;
        }

        // Build API URL for AR Invoices by receivedBy NIK
        const apiUrl = `${BASE_URL}/api/ar-invoices/by-received/${kansaiEmployeeId}`;
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

                // Determine status based on approval summary
                let status = 'Draft';
                if (invoice.arInvoiceApprovalSummary) {
                    const summary = invoice.arInvoiceApprovalSummary;
                    // Use the approvalStatus field from the API response
                    if (summary.approvalStatus) {
                        status = summary.approvalStatus;
                    } else if (summary.receivedDate && summary.receivedBy) {
                        status = 'Received';
                    } else if (summary.approvedDate && summary.approvedBy) {
                        status = 'Approved';
                    } else if (summary.rejectedDate && summary.rejectedBy) {
                        status = 'Rejected';
                    } else if (summary.acknowledgedDate && summary.acknowledgedBy) {
                        status = 'Acknowledged';
                    } else if (summary.checkedDate && summary.checkedBy) {
                        status = 'Checked';
                    }
                }

                const transformedInvoice = {
                    // Core display fields
                    id: invoice.stagingID,
                    invoiceNo: invoice.u_bsi_invnum || invoice.numAtCard,
                    customerName: invoice.cardName,
                    salesEmployee: invoice.u_BSI_Expressiv_PreparedByName || 'N/A',
                    invoiceDate: invoice.docDate,
                    dueDate: invoice.docDueDate,
                    status: status,
                    totalAmount: invoice.docTotal,
                    invoiceType: displayType,

                    // Document details from API response
                    docNum: invoice.docNum,
                    docType: invoice.docType,
                    cardCode: invoice.cardCode,
                    address: invoice.address,
                    numAtCard: invoice.numAtCard,
                    comments: invoice.comments,
                    preparedByNIK: invoice.u_BSI_Expressiv_PreparedByNIK,

                    // Financial information
                    docCur: invoice.docCur,
                    docRate: invoice.docRate,
                    vatSum: invoice.vatSum,
                    vatSumFC: invoice.vatSumFC,
                    wtSum: invoice.wtSum,
                    wtSumFC: invoice.wtSumFC,
                    docTotal: invoice.docTotal,
                    docTotalFC: invoice.docTotalFC,
                    grandTotal: invoice.grandTotal,
                    netAmount: invoice.netAmount,
                    docTax: invoice.docTax,
                    discSum: invoice.discSum,
                    taxRate: invoice.taxRate,
                    docBaseAmount: invoice.docBaseAmount,
                    sysRate: invoice.sysRate,

                    // Additional details
                    visInv: invoice.visInv,
                    trackNo: invoice.trackNo,
                    trnspCode: invoice.trnspCode,
                    u_BSI_ShippingType: invoice.u_BSI_ShippingType,
                    groupNum: invoice.groupNum,
                    u_BSI_PaymentGroup: invoice.u_BSI_PaymentGroup,
                    u_bsi_udf1: invoice.u_bsi_udf1,
                    u_bsi_udf2: invoice.u_bsi_udf2,
                    u_bsi_udf3: invoice.u_bsi_udf3,
                    licTradNum: invoice.licTradNum,
                    dpp1112: invoice.dpp1112,
                    qrCodeSrc: invoice.qrCodeSrc,

                    // Banking information
                    u_BankCode: invoice.u_BankCode,
                    account: invoice.account,
                    acctName: invoice.acctName,
                    netPrice: invoice.netPrice,
                    netPriceAfterDiscount: invoice.netPriceAfterDiscount,

                    // System fields
                    u_BSI_Expressiv_IsTransfered: invoice.u_BSI_Expressiv_IsTransfered,
                    docEntryHeader: invoice.docEntryHeader,
                    signedFilePath: invoice.signedFilePath,
                    createdAt: invoice.createdAt,
                    updatedAt: invoice.updatedAt,

                    // Related data
                    approvalSummary: invoice.arInvoiceApprovalSummary,
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



// Helper function to filter invoices by tab
function filterInvoicesByTab(invoices, tab) {
    switch (tab) {
        case 'approved':
            return invoices.filter(inv => inv.status === 'Approved');
        case 'received':
            return invoices.filter(inv => inv.status === 'Received');
        case 'rejected':
            return invoices.filter(inv => inv.status === 'Rejected');
        default:
            return invoices.filter(inv => inv.status === 'Approved'); // Default to approved for receive dashboard
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

// Function to update counters
async function updateCounters() {
    try {
        const totalCount = allInvoices.length;
        const approvedCount = allInvoices.filter(inv => inv.status === 'Approved').length;
        const receivedCount = allInvoices.filter(inv => inv.status === 'Received').length;
        const rejectedCount = allInvoices.filter(inv => inv.status === 'Rejected').length;

        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('approvedCount').textContent = approvedCount;
        document.getElementById('receivedCount').textContent = receivedCount;
        document.getElementById('rejectedCount').textContent = rejectedCount;

    } catch (error) {
        console.error('Error updating counters:', error);
    }
}

// Function to update table with invoice data
function updateTable(invoices) {
    const tbody = document.getElementById('recentDocs');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!invoices || invoices.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="11" class="text-center py-4 text-gray-500">No documents found</td>`;
        tbody.appendChild(row);
        updatePaginationInfo(0);
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedInvoices = invoices.slice(startIndex, endIndex);

    paginatedInvoices.forEach((invoice, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 border-b';

        const rowNumber = startIndex + index + 1;

        // Debug logging for status
        console.log(`Invoice ${index + 1} status:`, invoice.status);
        console.log(`Invoice ${index + 1} status class:`, `status-${invoice.status.toLowerCase()}`);

        const customerCellHtml = (invoice.customerName && invoice.customerName.length > 15)
            ? `<div class="scrollable-cell-sm">${invoice.customerName}</div>`
            : `${invoice.customerName}`;
        row.innerHTML = `
            <td class="p-2">${rowNumber}</td>
            <td class="p-2">${invoice.invoiceNo}</td>
            <td class="p-2">${customerCellHtml}</td>
            <td class="p-2">${formatDate(invoice.invoiceDate)}</td>
            <td class="p-2">${formatDate(invoice.dueDate)}</td>
            <td class="p-2">
                <span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span>
            </td>
            <td class="p-2">${invoice.invoiceType}</td>
            <td class="p-2 text-right">${formatCurrency(invoice.totalAmount)}</td>
            <td class="p-2">
                <button onclick="viewInvoiceDetails('${invoice.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    updatePaginationInfo(invoices.length);
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
}

// Helper function to format currency
function formatCurrency(amount) {
    if (!amount) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Function to update pagination information
function updatePaginationInfo(totalItems) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    document.getElementById('startItem').textContent = totalItems > 0 ? startItem : 0;
    document.getElementById('endItem').textContent = endItem;
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('currentPage').textContent = currentPage;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        prevBtn.classList.toggle('disabled', currentPage <= 1);
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.classList.toggle('disabled', currentPage >= totalPages);
    }
}

// Function to switch tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1;

    document.querySelectorAll('[id$="TabBtn"]').forEach(btn => {
        btn.classList.remove('tab-active');
    });

    // Try to find the tab button and make it active
    const tabBtn = document.getElementById(tabName + 'TabBtn');
    if (tabBtn) {
        tabBtn.classList.add('tab-active');
    }

    loadDashboard();
}

// Function to handle search
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    currentSearchTerm = searchInput.value.trim();
    currentPage = 1;
    loadDashboard();
}

// Function to change page
function changePage(direction) {
    const newPage = currentPage + direction;
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable(filteredInvoices);
    }
}

// Function to go to total documents
function goToTotalDocs() {
    console.log('Navigate to total documents');
}

// Function to view invoice details
window.viewInvoiceDetails = function (id) {
    // Cari data invoice untuk dapatkan docType
    const invoice = allInvoices.find(inv => inv.id === id);

    if (invoice) {
        if (invoice.docType === 'I') {
            // Invoice Item Approval
            window.location.href = `../../../approval/02.ARInvoice/Approval/PartApprovalInvItem.html?stagingID=${id}`;
        } else if (invoice.docType === 'S') {
            // Invoice Service Approval (kalau ada file khususnya)
            window.location.href = `../../../approval/02.ARInvoice/Approval/PartApprovalInvItem.html?stagingID=${id}`;
        } else {
            // Default ke Invoice Item Approval
            window.location.href = `../../../approval/02.ARInvoice/Approval/PartApprovalInvItem.html?stagingID=${id}`;
        }
    } else {
        // Kalau data invoice tidak ditemukan, default ke Invoice Item Approval
        window.location.href = `../../../approval/02.ARInvoice/Approval/PartApprovalInvItem.html?stagingID=${id}`;
    }
};

// Function to receive invoice
function receiveInvoice(id) {
    console.log('Receive invoice for ID:', id);
    if (confirm('Are you sure you want to receive this invoice?')) {
        alert('Invoice received successfully!');
        loadDashboard();
    }
}

// Function to print invoice
function printInvoice(id) {
    console.log('Print invoice for ID:', id);
    window.open(`/api/invoice/${id}/print`, '_blank');
}

// Function to toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

// Function to go to profile
function goToProfile() {
    console.log('Navigate to profile');
}

// Export functions for Excel and PDF
function downloadExcel() {
    try {
        const worksheet = XLSX.utils.json_to_sheet(filteredInvoices.map(invoice => ({
            'Invoice No': invoice.invoiceNo,
            'Customer': invoice.customerName,
            'Sales Employee': invoice.salesEmployee,
            'Date': formatDate(invoice.invoiceDate),
            'Due Date': formatDate(invoice.dueDate),
            'Status': invoice.status,
            'Type': invoice.invoiceType,
            'Total': invoice.totalAmount,
            'Remarks': invoice.remarks || ''
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'AR Invoice Receive');

        XLSX.writeFile(workbook, `AR_Invoice_Receive_${currentTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
        console.error('Error downloading Excel:', error);
        alert('Error downloading Excel file. Please try again.');
    }
}

function downloadPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('AR Invoice Receive Report', 14, 20);
        doc.setFontSize(12);
        doc.text(`Status: ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleDateString('id-ID')}`, 14, 40);

        const tableData = filteredInvoices.map(invoice => [
            invoice.invoiceNo,
            invoice.customerName,
            invoice.salesEmployee,
            formatDate(invoice.invoiceDate),
            formatDate(invoice.dueDate),
            invoice.status,
            invoice.invoiceType,
            formatCurrency(invoice.totalAmount),
            invoice.remarks || ''
        ]);

        doc.autoTable({
            head: [['Invoice No', 'Customer', 'Sales Employee', 'Date', 'Due Date', 'Status', 'Type', 'Total', 'Remarks']],
            body: tableData,
            startY: 50,
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [66, 139, 202],
                textColor: 255
            }
        });

        doc.save(`AR_Invoice_Receive_${currentTab}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Error downloading PDF file. Please try again.');
    }
} 