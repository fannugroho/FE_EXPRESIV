// Global variables
let allInvoices = [];
let filteredInvoices = [];
let currentTab = 'all';
let currentPage = 1;
const itemsPerPage = 10;

// API Configuration
const API_BASE_URL = 'https://expressiv-be-sb.idsdev.site/api';

// Reusable function to fetch AR invoice documents by approval step
async function fetchARInvoiceDocuments(step, userId, onlyCurrentStep = false) {
    try {
        const params = new URLSearchParams({
            step: step,
            userId: userId,
            onlyCurrentStep: onlyCurrentStep.toString(),
            includeDetails: 'false'
        });

        const response = await fetch(`${API_BASE_URL}/ar-invoices?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(`API response for step ${step} (onlyCurrentStep: ${onlyCurrentStep}):`, result);

        // Debug: Log first document structure if available
        if (result.data && result.data.length > 0) {
            console.log('First document structure:', result.data[0]);
            console.log('First document status fields:', {
                approval: result.data[0].approval,
                status: result.data[0].status,
                type: result.data[0].type,
                doctype: result.data[0].doctype
            });
        }

        // Handle different response structures
        if (result.status && result.data) {
            return result.data;
        } else if (Array.isArray(result)) {
            return result;
        } else if (result.data) {
            return result.data;
        } else {
            return [];
        }
    } catch (error) {
        console.error(`Error fetching documents for step ${step}:`, error);
        
        // Fallback to original API call if role-based API fails
        console.log('Falling back to original API call...');
        try {
            const fallbackResponse = await fetch(`${API_BASE_URL}/ar-invoices`, {
                method: 'GET',
                headers: {
                    'accept': 'text/plain',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!fallbackResponse.ok) {
                throw new Error(`Fallback API error! status: ${fallbackResponse.status}`);
            }
            
            const fallbackResult = await fallbackResponse.json();
            console.log('Fallback API response:', fallbackResult);
            
            if (fallbackResult.status && fallbackResult.data) {
                return fallbackResult.data;
            } else if (Array.isArray(fallbackResult)) {
                return fallbackResult;
            } else {
                return [];
            }
        } catch (fallbackError) {
            console.error('Fallback API also failed:', fallbackError);
            return [];
        }
    }
}

// Function to fetch all documents for "All Documents" tab
async function fetchAllDocuments(userId) {
    try {
        // For "All Documents" tab, we want all documents regardless of status
        return await fetchARInvoiceDocuments('preparedBy', userId, false);
    } catch (error) {
        console.error('Error fetching all documents:', error);
        return [];
    }
}

// Function to fetch documents by specific approval status
async function fetchDocumentsByStatus(userId, status) {
    try {
        // For specific status tabs, we want documents with that specific approval status
        const allDocuments = await fetchARInvoiceDocuments('preparedBy', userId, false);
        console.log(`Total documents fetched: ${allDocuments.length}`);

        const filteredDocuments = allDocuments.filter(doc => {
            // Check approval status from the approval object
            const approvalStatus = doc.approval?.approvalStatus || doc.status || doc.type || doc.doctype || '';
            const isMatchingStatus = approvalStatus.toLowerCase() === status.toLowerCase();

            // Debug logging for first few documents
            if (allDocuments.indexOf(doc) < 3) {
                console.log(`Document ${doc.stagingID || doc.id}: approvalStatus="${approvalStatus}", isMatchingStatus=${isMatchingStatus}`);
            }

            return isMatchingStatus;
        });

        console.log(`Filtered to ${status} documents: ${filteredDocuments.length}`);
        return filteredDocuments;
    } catch (error) {
        console.error(`Error fetching ${status} documents:`, error);
        return [];
    }
}

// Function to get user ID
function getUserId() {
    // Use the getUserId function from auth.js if available
    if (typeof window.getUserId === 'function' && window.getUserId !== getUserId) {
        return window.getUserId();
    }

    // Fallback to our implementation
    const token = localStorage.getItem("accessToken");
    if (token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const userInfo = JSON.parse(jsonPayload);
            const userId = userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
            if (userId) return userId;
        } catch (e) {
            console.error('Error parsing JWT token:', e);
        }
    }

    // Fallback to localStorage method
    const userStr = localStorage.getItem('loggedInUser');
    if (!userStr) return null;

    try {
        const user = JSON.parse(userStr);
        return user.id || null;
    } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
    }
}

// Function to get access token
function getAccessToken() {
    return localStorage.getItem("accessToken");
}

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

// Function to fetch invoice data from API with role-based filtering
async function fetchInvoiceData() {
    try {
        // Show loading state
        document.getElementById('recentDocs').innerHTML = '<tr><td colspan="10" class="text-center py-4"><div class="flex items-center justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span class="ml-2">Loading data...</span></div></td></tr>';
        
        const userId = getUserId();
        if (!userId) {
            console.error('User ID not found. Please login again.');
            throw new Error('User ID not found');
        }

        console.log('Fetching invoice data for user:', userId);
        
        // Fetch data using role-based approach
        const documents = await fetchAllDocuments(userId);
        
        if (Array.isArray(documents)) {
            allInvoices = documents;
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
    
    // Count by status using the current filtered documents
    const draftCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Draft').length;
    const preparedCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Prepared').length;
    const checkedCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Checked').length;
    const acknowledgedCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Acknowledged').length;
    const approvedCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Approved').length;
    const receivedCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Received').length;
    const rejectedCount = allInvoices.filter(invoice => getStatusFromInvoice(invoice) === 'Rejected').length;
    
    // Update counter displays
    document.getElementById('draftCount').textContent = draftCount;
    document.getElementById('preparedCount').textContent = preparedCount;
    document.getElementById('checkedCount').textContent = checkedCount;
    document.getElementById('acknowledgedCount').textContent = acknowledgedCount;
    document.getElementById('approvedCount').textContent = approvedCount;
    document.getElementById('receivedCount').textContent = receivedCount;
    document.getElementById('rejectedCount').textContent = rejectedCount;
    
    console.log('Counters updated:', {
        total: allInvoices.length,
        draft: draftCount,
        prepared: preparedCount,
        checked: checkedCount,
        acknowledged: acknowledgedCount,
        approved: approvedCount,
        received: receivedCount,
        rejected: rejectedCount
    });
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

// Function to display invoices in the table
function displayInvoices() {
    const tableBody = document.getElementById('recentDocs');
    tableBody.innerHTML = '';
    
    if (filteredInvoices.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4 text-gray-500">
                    <i class="fas fa-inbox mr-2"></i>
                    No invoices found
                </td>
            </tr>`;
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredInvoices.length);
    const pageInvoices = filteredInvoices.slice(startIndex, endIndex);
    
    // Update pagination info
    updatePagination();
    
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

// Function to switch between tabs
async function switchTab(tab) {
    currentTab = tab;
    currentPage = 1; // Reset to first page when switching tabs
    
    console.log(`Switching to tab: ${tab}`);
    
    // Update active tab styling
    document.querySelectorAll('.tab-active').forEach(el => el.classList.remove('tab-active'));
    
    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found');
        return;
    }
    
    try {
        let documents = [];
        
        if (tab === 'all') {
            document.getElementById('allTabBtn').classList.add('tab-active');
            console.log('Fetching all documents...');
            documents = await fetchAllDocuments(userId);
            console.log(`All documents fetched: ${documents.length} documents`);
        } else if (tab === 'draft') {
            document.getElementById('draftTabBtn').classList.add('tab-active');
            console.log('Fetching draft documents...');
            documents = await fetchDocumentsByStatus(userId, 'draft');
            console.log(`Draft documents fetched: ${documents.length} documents`);
        } else if (tab === 'prepared') {
            document.getElementById('preparedTabBtn').classList.add('tab-active');
            console.log('Fetching prepared documents...');
            documents = await fetchDocumentsByStatus(userId, 'prepared');
            console.log(`Prepared documents fetched: ${documents.length} documents`);
        }
        
        // Update the filtered documents
        filteredInvoices = documents;
        allInvoices = documents;
        
        // Apply search filter if there's a search term
        const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
        const searchType = document.getElementById('searchType')?.value || 'invoice';
        
        console.log(`Search term: "${searchTerm}", Search type: "${searchType}"`);
        console.log(`Documents before search filter: ${filteredInvoices.length}`);
        
        if (searchTerm) {
            filteredInvoices = filteredInvoices.filter(doc => {
                switch (searchType) {
                    case 'invoice':
                        return (doc.numAtCard && doc.numAtCard.toLowerCase().includes(searchTerm)) ||
                               (doc.u_bsi_invnum && doc.u_bsi_invnum.toLowerCase().includes(searchTerm)) ||
                               (doc.docNum && doc.docNum.toString().includes(searchTerm));
                    case 'customer':
                        return doc.cardName && doc.cardName.toLowerCase().includes(searchTerm);
                    case 'date':
                        const docDate = doc.docDate || doc.postingDate;
                        return docDate && new Date(docDate).toLocaleDateString().toLowerCase().includes(searchTerm);
                    case 'status':
                        const status = getStatusFromInvoice(doc);
                        return status.toLowerCase().includes(searchTerm);
                    default:
                        return true;
                }
            });
            console.log(`Documents after search filter: ${filteredInvoices.length}`);
        }
        
        // Update counters
        updateCounters();
        
        // Display documents
        displayInvoices();
        
    } catch (error) {
        console.error('Error switching tabs:', error);
        // Show error message to user
        document.getElementById('recentDocs').innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4">
                    <div class="text-red-500 mb-2">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Error loading documents: ${error.message}
                    </div>
                    <button onclick="switchTab('${tab}')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        <i class="fas fa-redo mr-2"></i>Retry
                    </button>
                </td>
            </tr>`;
    }
}

// Function to change page
function changePage(direction) {
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    
    if (direction === -1 && currentPage > 1) {
        currentPage--;
    } else if (direction === 1 && currentPage < totalPages) {
        currentPage++;
    }
    
    console.log(`Changing page to: ${currentPage} of ${totalPages}`);
    
    // Display invoices for the new page
    displayInvoices();
}

// Function to setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    
    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
    }
    
    if (searchType) {
        searchType.addEventListener('change', performSearch);
    }
}

// Function to update pagination controls
function updatePagination() {
    const totalItems = filteredInvoices.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Update pagination info
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('currentPage').textContent = currentPage;
    
    // Calculate start and end items for current page
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
    
    document.getElementById('startItem').textContent = startIndex;
    document.getElementById('endItem').textContent = endIndex;
    
    // Enable/disable pagination buttons
    document.getElementById('prevPage').classList.toggle('disabled', currentPage === 1);
    document.getElementById('nextPage').classList.toggle('disabled', currentPage >= totalPages);
    
    console.log('Pagination updated:', {
        totalItems,
        totalPages,
        currentPage,
        startIndex,
        endIndex
    });
}

// Function to perform search
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const searchType = document.getElementById('searchType').value;
    
    console.log('Performing search:', { searchTerm, searchType, currentTab });
    
    // Apply search filter to the current documents
    if (searchTerm) {
        filteredInvoices = allInvoices.filter(invoice => {
            switch (searchType) {
                case 'invoice':
                    return (invoice.numAtCard && invoice.numAtCard.toLowerCase().includes(searchTerm)) ||
                           (invoice.u_bsi_invnum && invoice.u_bsi_invnum.toLowerCase().includes(searchTerm)) ||
                           (invoice.docNum && invoice.docNum.toString().includes(searchTerm));
                case 'customer':
                    return invoice.cardName && invoice.cardName.toLowerCase().includes(searchTerm);
                case 'date':
                    const docDate = invoice.docDate || invoice.postingDate;
                    return docDate && new Date(docDate).toLocaleDateString().toLowerCase().includes(searchTerm);
                case 'status':
                    const status = getStatusFromInvoice(invoice);
                    return status.toLowerCase().includes(searchTerm);
                default:
                    return true;
            }
        });
    } else {
        // If no search term, show all documents for current tab
        filteredInvoices = [...allInvoices];
    }
    
    console.log(`Search results: ${filteredInvoices.length} documents found`);
    
    // Reset to first page when searching
    currentPage = 1;
    
    // Update pagination
    updatePagination();
    
    // Display filtered results
    displayInvoices();
}

// Navigation functions
function goToCheckedDocs() {
    console.log('Navigating to checked documents...');
    // Navigate to the checked documents page
    if (typeof navigateToPage === 'function') {
        navigateToPage('approvalPages/dashboard/dashboardCheck/invoiceItem/menuInvoiceCheck.html');
    } else {
        window.location.href = 'approvalPages/dashboard/dashboardCheck/invoiceItem/menuInvoiceCheck.html';
    }
}

function goToApprovedDocs() {
    console.log('Navigating to approved documents...');
    // Navigate to the approved documents page
    if (typeof navigateToPage === 'function') {
        navigateToPage('approvalPages/dashboard/dashboardApprove/invoiceItem/menuInvoiceApprove.html');
    } else {
        window.location.href = 'approvalPages/dashboard/dashboardApprove/invoiceItem/menuInvoiceApprove.html';
    }
}

function goToRejectDocs() {
    console.log('Navigating to rejected documents...');
    // Navigate to the rejected documents page
    if (typeof navigateToPage === 'function') {
        navigateToPage('approvalPages/dashboard/dashboardCheck/invoiceItem/menuInvoiceCheck.html');
    } else {
        window.location.href = 'approvalPages/dashboard/dashboardCheck/invoiceItem/menuInvoiceCheck.html';
    }
}

function goToAddInvoice() {
    console.log('Navigating to add invoice page...');
    // Navigate to the add invoice page
    if (typeof navigateToPage === 'function') {
        navigateToPage('addPages/addInvoice.html');
    } else {
        window.location.href = 'addPages/addInvoice.html';
    }
}

// Function to view invoice details
function viewInvoiceDetails(id) {
    console.log('Viewing invoice details for ID:', id);
    
    // Find the invoice data to determine its type
    const invoice = allInvoices.find(inv => {
        const invId = inv.stagingID || inv.id || inv.docNum || inv.numAtCard || inv.u_bsi_invnum;
        return invId && invId.toString() === id.toString();
    });
    
    // Determine which detail page to use based on document type
    let detailPage = 'detailINVItem.html'; // Default to item page
    
    if (invoice && invoice.docType) {
        switch (invoice.docType) {
            case 'S':
                detailPage = 'detailINVService.html';
                break;
            case 'I':
            default:
                detailPage = 'detailINVItem.html';
                break;
        }
    }
    
    console.log(`Redirecting to ${detailPage} for invoice type: ${invoice?.docType || 'unknown'}`);
    
    // Navigate to the appropriate invoice detail page
    if (typeof navigateToPage === 'function') {
        navigateToPage(`detailPages/${detailPage}?invoice-id=${id}`);
    } else {
        window.location.href = `detailPages/${detailPage}?invoice-id=${id}`;
    }
}

// Function to edit invoice
function editInvoice(id) {
    console.log('Editing invoice with ID:', id);
    // Navigate to the edit invoice page
    if (typeof navigateToPage === 'function') {
        navigateToPage(`addPages/editInvoice.html?invoice-id=${id}`);
    } else {
        window.location.href = `addPages/editInvoice.html?invoice-id=${id}`;
    }
}

// Function to print invoice
function printInvoice(id) {
    console.log('Printing invoice with ID:', id);
    // Open print dialog for the invoice
    window.open(`printPages/printInvoice.html?invoice-id=${id}`, '_blank');
}

// Function to download data as Excel
function downloadExcel() {
    try {
        // Get current filtered data
        const dataToExport = [...filteredInvoices];
        
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
        const dataToExport = [...filteredInvoices];
        
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

// Function to go to profile
function goToProfile() {
    console.log('Navigating to profile page...');
    if (typeof navigateToPage === 'function') {
        navigateToPage('pages/changepass.html');
    } else {
        window.location.href = 'pages/changepass.html';
    }
}

// Function to refresh data
function refreshData() {
    console.log('Refreshing invoice data...');
    fetchInvoiceData();
}

// Add refresh button functionality
document.addEventListener('DOMContentLoaded', function() {
    // Refresh button functionality removed as requested
});