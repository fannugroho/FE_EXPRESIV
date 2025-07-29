// Global variables
let allInvoices = [];
let filteredInvoices = [];
let currentTab = 'all';
let currentPage = 1;
const itemsPerPage = 10;

// API Configuration
const API_BASE_URL = 'https://expressiv-be-sb.idsdev.site/api';

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, loading data immediately');
    
    // Load user data immediately
    loadUserData();
    
    // Fetch invoice data
    fetchInvoiceData();
    
    // Set up search functionality
    setupSearch();
});

// Function to load user data
function loadUserData() {
    console.log('loadUserData called');
    
    // Get user data from localStorage
    const loggedInUser = localStorage.getItem('loggedInUser');
    let userData = null;
    
    if (loggedInUser) {
        try {
            userData = JSON.parse(loggedInUser);
            console.log('User data loaded:', userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    } else {
        console.log('No loggedInUser found in localStorage');
        // Set default user data for testing
        userData = {
            name: 'Test User',
            avatar: '../image/profil.png'
        };
    }
    
    // Display user name and avatar if available
    if (userData && userData.name) {
        document.getElementById('userNameDisplay').textContent = userData.name;
    } else {
        // Fallback to default name
        document.getElementById('userNameDisplay').textContent = 'Test User';
    }
    
    if (userData && userData.avatar) {
        document.getElementById('dashboardUserIcon').src = userData.avatar;
    } else {
        document.getElementById('dashboardUserIcon').src = '../image/profil.png';
    }
    
    // Show user profile section
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.style.display = 'flex';
    }
}

// Function to fetch invoice data from API
async function fetchInvoiceData() {
    try {
        // Show loading state
        document.getElementById('recentDocs').innerHTML = '<tr><td colspan="10" class="text-center py-4"><div class="flex items-center justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span class="ml-2">Loading data...</span></div></td></tr>';
        
        // Fetch data from real API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(`${API_BASE_URL}/ar-invoices`, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status && result.data) {
            allInvoices = result.data;
            console.log('Invoice data loaded from API:', allInvoices);
            
            // Debug: Log the structure of the first invoice
            if (allInvoices.length > 0) {
                console.log('First invoice structure:', allInvoices[0]);
                console.log('Available fields:', Object.keys(allInvoices[0]));
            }
        } else {
            throw new Error('Invalid API response format');
        }
        
        // Update counters
        updateCounters();
        
        // Set filtered invoices to all invoices initially
        filteredInvoices = [...allInvoices];
        
        // Display invoices
        displayInvoices();
        
    } catch (error) {
        console.error('Error fetching invoice data:', error);
        
        let errorMessage = error.message;
        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout. Please check your connection and try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        }
        
        document.getElementById('recentDocs').innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4">
                    <div class="text-red-500 mb-2">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        ${errorMessage}
                    </div>
                    <button onclick="fetchInvoiceData()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        <i class="fas fa-redo mr-2"></i>Retry
                    </button>
                </td>
            </tr>`;
        
        // Set empty data when API fails
        allInvoices = [];
        filteredInvoices = [];
        updateCounters();
    }
}

// Function to update counters
function updateCounters() {
    // Count total documents
    document.getElementById('totalCount').textContent = allInvoices.length;
    
    // Count by status
    const draftCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Draft').length;
    const preparedCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Prepared').length;
    const checkedCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Checked').length;
    const acknowledgedCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Acknowledged').length;
    const approvedCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Approved').length;
    const receivedCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Received').length;
    const rejectedCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Rejected').length;
    
    // Update UI
    document.getElementById('draftCount').textContent = draftCount;
    document.getElementById('preparedCount').textContent = preparedCount;
    document.getElementById('checkedCount').textContent = checkedCount;
    document.getElementById('acknowledgedCount').textContent = acknowledgedCount;
    document.getElementById('approvedCount').textContent = approvedCount;
    document.getElementById('receivedCount').textContent = receivedCount;
    document.getElementById('rejectedCount').textContent = rejectedCount;
}

// Helper function to determine status from invoice data
function getStatusFromInvoice(invoice) {
    // Debug logging for arInvoiceApprovalSummary
    console.log('Invoice arInvoiceApprovalSummary:', invoice.arInvoiceApprovalSummary);
    console.log('Invoice arInvoiceApprovalSummary type:', typeof invoice.arInvoiceApprovalSummary);
    
    // Check if invoice has approval summary - if null, return Draft
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
    
    // Check transfer status
    if (invoice.u_BSI_Expressiv_IsTransfered === 'Y') return 'Received';
    
    // Check if it's a staging document (draft)
    if (invoice.stagingID && invoice.stagingID.startsWith('STG')) return 'Draft';
    
    // Check if document has been transferred (received)
    if (invoice.u_BSI_Expressiv_IsTransfered === 'Y') return 'Received';
    
    // Check if document is in preparation stage
    if (invoice.docNum && invoice.docNum > 0) return 'Prepared';
    
    // Default to Draft for new documents
    return 'Draft';
}

// Helper function to get status class
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'draft':
            return 'bg-yellow-100 text-yellow-800';
        case 'prepared':
            return 'bg-blue-100 text-blue-800';
        case 'checked':
        case 'acknowledged':
        case 'approved':
        case 'received':
            return 'bg-green-100 text-green-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Function to display invoices based on current filters and pagination
function displayInvoices() {
    const tableBody = document.getElementById('recentDocs');
    tableBody.innerHTML = '';
    
    // Filter invoices based on current tab
    let displayInvoices = [...filteredInvoices];
    if (currentTab !== 'all') {
        displayInvoices = filteredInvoices.filter(invoice => {
            const status = getStatusFromInvoice(invoice).toLowerCase();
            return status === currentTab;
        });
    }
    
    // Update pagination info
    const totalItems = displayInvoices.length;
    document.getElementById('totalItems').textContent = totalItems;
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    document.getElementById('startItem').textContent = totalItems === 0 ? 0 : startIndex + 1;
    document.getElementById('endItem').textContent = endIndex;
    document.getElementById('currentPage').textContent = currentPage;
    
    // Enable/disable pagination buttons
    document.getElementById('prevPage').classList.toggle('disabled', currentPage === 1);
    document.getElementById('nextPage').classList.toggle('disabled', endIndex >= totalItems);
    
    // Display invoices for current page
    const pageInvoices = displayInvoices.slice(startIndex, endIndex);
    
    pageInvoices.forEach((invoice, index) => {
        // Debug logging for stagingID
        console.log(`Invoice ${index + 1} stagingID:`, invoice.stagingID);
        console.log(`Invoice ${index + 1} id:`, invoice.id);
        console.log(`Invoice ${index + 1} docNum:`, invoice.docNum);
        console.log(`Invoice ${index + 1} all fields:`, Object.keys(invoice));
        console.log(`Invoice ${index + 1} final ID used:`, invoice.stagingID || invoice.id || 'NO_ID');
        
        // Try to find the correct ID field
        let invoiceId = null;
        if (invoice.stagingID && invoice.stagingID.trim() !== '') {
            invoiceId = invoice.stagingID;
        } else if (invoice.docNum && invoice.docNum > 0) {
            // Use docNum as the primary identifier when stagingID is not available
            invoiceId = `DOC_${invoice.docNum}`;
        } else if (invoice.numAtCard && invoice.numAtCard.trim() !== '') {
            // Use numAtCard as fallback
            invoiceId = `NUM_${invoice.numAtCard}`;
        } else if (invoice.u_bsi_invnum && invoice.u_bsi_invnum.trim() !== '') {
            // Use u_bsi_invnum as another fallback
            invoiceId = `UBSI_${invoice.u_bsi_invnum}`;
        } else {
            invoiceId = 'NO_VALID_ID';
        }
        
        console.log(`Invoice ${index + 1} selected ID:`, invoiceId);
        console.log(`Invoice ${index + 1} stagingID (empty?):`, invoice.stagingID === '');
        console.log(`Invoice ${index + 1} docNum:`, invoice.docNum);
        console.log(`Invoice ${index + 1} numAtCard:`, invoice.numAtCard);
        console.log(`Invoice ${index + 1} u_bsi_invnum:`, invoice.u_bsi_invnum);
        
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        
        // Handle both string and Date object for docDate
        let docDate;
        if (typeof invoice.docDate === 'string') {
            docDate = new Date(invoice.docDate);
        } else {
            docDate = invoice.docDate;
        }
        const formattedDate = docDate.toLocaleDateString('en-GB');
        
        // Handle both string and Date object for docDueDate
        let dueDate;
        if (typeof invoice.docDueDate === 'string') {
            dueDate = new Date(invoice.docDueDate);
        } else {
            dueDate = invoice.docDueDate;
        }
        const formattedDueDate = dueDate.toLocaleDateString('en-GB');
        
        const status = getStatusFromInvoice(invoice);
        const statusClass = getStatusClass(status);
        
        // Debug logging for status
        console.log(`Invoice ${index + 1} status:`, status);
        console.log(`Invoice ${index + 1} status class:`, statusClass);
        
        // Create row content
        const detailButtonDisabled = invoiceId === 'NO_VALID_ID';
        const detailButtonClass = detailButtonDisabled ? 'bg-gray-400 text-white px-2 py-1 rounded cursor-not-allowed' : 'bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600';
        const detailButtonText = detailButtonDisabled ? 'No Details' : 'Detail';
        const detailButtonOnClick = detailButtonDisabled ? '' : `onclick="viewInvoiceDetails('${invoiceId}')"`;
        const detailButtonTitle = detailButtonDisabled ? 'This invoice does not have a valid identifier for details view' : '';
        
        row.innerHTML = `
            <td class="p-2 border-b">${startIndex + index + 1}</td>
            <td class="p-2 border-b scrollable-cell">${invoice.numAtCard || invoice.u_bsi_invnum || '-'}</td>
            <td class="p-2 border-b">${invoice.cardName || '-'}</td>
            <td class="p-2 border-b">${invoice.u_BSI_Expressiv_PreparedByName || '-'}</td>
            <td class="p-2 border-b">${formattedDate}</td>
            <td class="p-2 border-b">${formattedDueDate}</td>
            <td class="p-2 border-b"><span class="px-2 py-1 rounded-full text-xs ${statusClass}">${status}</span></td>
            <td class="p-2 border-b text-right">${formatCurrency(invoice.docTotal)}</td>
            <td class="p-2 border-b">${getDocumentType(invoice.docType)}</td>
            <td class="p-2 border-b">
                <button ${detailButtonOnClick} class="${detailButtonClass}" title="${detailButtonTitle}">${detailButtonText}</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Helper function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Helper function to get document type display name
function getDocumentType(docType) {
    switch (docType) {
        case 'S':
            return 'Services';
        case 'I':
            return 'Item';
        case 'C':
            return 'Credit Memo';
        case 'R':
            return 'Return';
        case 'D':
            return 'Debit Memo';
        default:
            return docType || 'Unknown';
    }
}

// Function to handle tab switching
function switchTab(tab) {
    currentTab = tab;
    currentPage = 1;
    
    // Update active tab UI
    document.querySelectorAll('.px-4.py-2').forEach(btn => {
        btn.classList.remove('tab-active');
    });
    
    // Try to find the tab button and make it active
    const tabBtn = document.getElementById(`${tab}TabBtn`);
    if (tabBtn) {
        tabBtn.classList.add('tab-active');
    }
    
    // Display invoices for selected tab
    displayInvoices();
}

// Function to handle pagination
function changePage(direction) {
    const newPage = currentPage + direction;
    
    // Calculate total pages
    let displayInvoices = [...filteredInvoices];
    if (currentTab !== 'all') {
        displayInvoices = filteredInvoices.filter(invoice => {
            const status = getStatusFromInvoice(invoice).toLowerCase();
            return status === currentTab;
        });
    }
    
    const totalPages = Math.ceil(displayInvoices.length / itemsPerPage);
    
    // Validate new page
    if (newPage < 1 || newPage > totalPages) {
        return;
    }
    
    currentPage = newPage;
    displayInvoices();
}

// Function to set up search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    
    searchInput.addEventListener('input', performSearch);
    searchType.addEventListener('change', performSearch);
}

// Function to perform search
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    
    const query = searchInput.value.trim().toLowerCase();
    const type = searchType.value;
    
    if (!query) {
        filteredInvoices = [...allInvoices];
    } else {
        filteredInvoices = allInvoices.filter(invoice => {
            switch (type) {
                case 'invoice':
                    const invoiceNo = (invoice.numAtCard || invoice.u_bsi_invnum || '').toLowerCase();
                    return invoiceNo.includes(query);
                case 'customer':
                    return (invoice.cardName || '').toLowerCase().includes(query);
                case 'date':
                    // Handle both string and Date object for date search
                    let docDate;
                    if (typeof invoice.docDate === 'string') {
                        docDate = new Date(invoice.docDate);
                    } else {
                        docDate = invoice.docDate;
                    }
                    const date = docDate.toLocaleDateString('en-GB').toLowerCase();
                    return date.includes(query);
                case 'status':
                    const status = getStatusFromInvoice(invoice).toLowerCase();
                    return status.includes(query);
                default:
                    return true;
            }
        });
    }
    
    // Reset to first page and display results
    currentPage = 1;
    displayInvoices();
}

// Function to view invoice details
function viewInvoiceDetails(id) {
    console.log('viewInvoiceDetails called with ID:', id);
    
    // Extract the actual identifier from the formatted ID
    let actualId = id;
    if (id.startsWith('DOC_')) {
        actualId = id.replace('DOC_', '');
    } else if (id.startsWith('NUM_')) {
        actualId = id.replace('NUM_', '');
    } else if (id.startsWith('UBSI_')) {
        actualId = id.replace('UBSI_', '');
    }
    
    console.log('Actual ID for API call:', actualId);
    console.log('Redirecting to:', `../detailPages/detailINVItem.html?id=${actualId}`);
    
    // Redirect to detailINVItem.html page with invoice ID for viewing details
    window.location.href = `../detailPages/detailINVItem.html?id=${actualId}`;
}

// Function to edit invoice
function editInvoice(id) {
    // Redirect to edit page with invoice ID
    window.location.href = `../addPages/addInvoice.html?id=${id}`;
}

// Function to print invoice
function printInvoice(id) {
    // Redirect to print page with invoice ID
    window.location.href = `../approvalPages/approve/invoiceItem/printInvoice.html?id=${id}`;
}

// Function to go to add invoice page
function goToAddInvoice() {
    window.location.href = '../addPages/addINVItem.html';
}

// Function to navigate to checked documents
function goToCheckedDocs() {
    // Redirect to checked documents page
    window.location.href = '../approvalPages/dashboard/dashboardCheck/invoiceItem/menuInvoiceCheck.html';
}

// Function to navigate to approved documents
function goToApprovedDocs() {
    // Redirect to approved documents page
    window.location.href = '../approvalPages/dashboard/dashboardApprove/invoiceItem/menuInvoiceApprove.html';
}

// Function to navigate to rejected documents
function goToRejectDocs() {
    // Filter to show only rejected documents
    currentTab = 'rejected';
    currentPage = 1;
    
    // Update active tab UI
    document.querySelectorAll('.px-4.py-2').forEach(btn => {
        btn.classList.remove('tab-active');
    });
    
    // Display invoices for rejected tab
    displayInvoices();
}

// Function to download data as Excel
function downloadExcel() {
    try {
        // Get current filtered data
        let dataToExport = [...filteredInvoices];
        if (currentTab !== 'all') {
            dataToExport = filteredInvoices.filter(invoice => {
                const status = getStatusFromInvoice(invoice).toLowerCase();
                return status === currentTab;
            });
        }
        
        // Format data for Excel
        const excelData = dataToExport.map((invoice, index) => {
            // Handle both string and Date object for docDate
            let docDate;
            if (typeof invoice.docDate === 'string') {
                docDate = new Date(invoice.docDate);
            } else {
                docDate = invoice.docDate;
            }
            const formattedDate = docDate.toLocaleDateString('en-GB');
            
            // Handle both string and Date object for docDueDate
            let dueDate;
            if (typeof invoice.docDueDate === 'string') {
                dueDate = new Date(invoice.docDueDate);
            } else {
                dueDate = invoice.docDueDate;
            }
            const formattedDueDate = dueDate.toLocaleDateString('en-GB');
            
            return {
                'No': index + 1,
                'Invoice No.': invoice.numAtCard || invoice.u_bsi_invnum || '-',
                'Customer': invoice.cardName || '-',
                'Sales Employee': invoice.u_BSI_Expressiv_PreparedByName || '-',
                'Date': formattedDate,
                'Due Date': formattedDueDate,
                'Status': getStatusFromInvoice(invoice),
                'Total (IDR)': invoice.docTotal,
                'Type': getDocumentType(invoice.docType)
            };
        });
        
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
        
        // Generate Excel file
        const today = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `Invoice_Report_${today}.xlsx`);
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Failed to export data to Excel. Please try again.');
    }
}

// Function to download data as PDF
function downloadPDF() {
    try {
        // Get current filtered data
        let dataToExport = [...filteredInvoices];
        if (currentTab !== 'all') {
            dataToExport = filteredInvoices.filter(invoice => {
                const status = getStatusFromInvoice(invoice).toLowerCase();
                return status === currentTab;
            });
        }
        
        // Format data for PDF
        const pdfData = dataToExport.map((invoice, index) => {
            // Handle both string and Date object for docDate
            let docDate;
            if (typeof invoice.docDate === 'string') {
                docDate = new Date(invoice.docDate);
            } else {
                docDate = invoice.docDate;
            }
            const formattedDate = docDate.toLocaleDateString('en-GB');
            
            // Handle both string and Date object for docDueDate
            let dueDate;
            if (typeof invoice.docDueDate === 'string') {
                dueDate = new Date(invoice.docDueDate);
            } else {
                dueDate = invoice.docDueDate;
            }
            const formattedDueDate = dueDate.toLocaleDateString('en-GB');
            
            return [
                index + 1,
                invoice.numAtCard || invoice.u_bsi_invnum || '-',
                invoice.cardName || '-',
                invoice.u_BSI_Expressiv_PreparedByName || '-',
                formattedDate,
                formattedDueDate,
                getStatusFromInvoice(invoice),
                new Intl.NumberFormat('id-ID').format(invoice.docTotal),
                getDocumentType(invoice.docType)
            ];
        });
        
        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text('Invoice Report', 14, 22);
        
        // Add date
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 30);
        
        // Add table
        doc.autoTable({
            startY: 35,
            head: [['No', 'Invoice No.', 'Customer', 'Sales Employee', 'Date', 'Due Date', 'Status', 'Total (IDR)', 'Type']],
            body: pdfData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10 },
                7: { halign: 'right' }
            }
        });
        
        // Save PDF
        const today = new Date().toISOString().slice(0, 10);
        doc.save(`Invoice_Report_${today}.pdf`);
        
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Failed to export data to PDF. Please try again.');
    }
}

// Function to go to profile page
function goToProfile() {
    window.location.href = '../pages/profile.html';
}

// Function to refresh data
function refreshData() {
    console.log('Refreshing invoice data...');
    currentPage = 1;
    fetchInvoiceData();
}

// Add refresh button functionality
document.addEventListener('DOMContentLoaded', function() {
    // Refresh button functionality removed as requested
});