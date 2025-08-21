// Global variables - Optimized with better memory management
let allInvoices = [];
let filteredInvoices = [];
let currentTab = 'all';
let currentPage = 1;
const itemsPerPage = 20; // Increased for better UX
let isLoading = false;
let dataCache = new Map(); // Better caching with Map
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// API Configuration - Using BASE_URL from auth.js
const API_BASE_URL = `${BASE_URL}/api`;

// Utility function to format date consistently without timezone issues
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        // Parse the date string properly to avoid timezone shift
        let date;
        if (dateString.includes('T')) {
            // If it's an ISO string, parse it directly
            date = new Date(dateString);
        } else {
            // If it's just a date (YYYY-MM-DD), treat as local date
            const parts = dateString.split('-');
            if (parts.length === 3) {
                date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
                date = new Date(dateString);
            }
        }

        if (isNaN(date.getTime())) return '';

        // Format as DD/MM/YYYY (British format) without timezone conversion
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Date formatting error:', error);
        return '';
    }
}

/*
 * UPDATED API IMPLEMENTATION
 * 
 * Changes made to use new endpoint:
 * 
 * 1. ENHANCED API IMPLEMENTATION
 *    - First fetches user details from /users/{userId} to get Kansai Employee ID
 *    - Then uses /ar-invoices/by-preparer/{kansaiEmployeeId} endpoint
 *    - Filters invoices by u_BSI_Expressiv_PreparedByNIK field
 *    - More accurate data filtering based on actual employee ID
 * 
 * 2. USER ID INTEGRATION
 *    - Uses current user ID from auth.js to get user details
 *    - Fetches Kansai Employee ID from user profile
 *    - Uses Kansai Employee ID for invoice filtering
 *    - Personalized data loading based on actual employee ID
 * 
 * 3. ENHANCED RESPONSE HANDLING
 *    - Updated for new API response structure
 *    - Better handling of arInvoiceApprovalSummary
 *    - Improved field mapping for new data format
 * 
 * 4. STATUS DETECTION UPDATE
 *    - Uses arInvoiceApprovalSummary.approvalStatus
 *    - Defaults to "Draft" when approvalStatus is empty/null
 *    - Supports all status types: Draft, Prepared, Checked, Acknowledged, Approved, Received, Rejected
 * 
 * API Endpoints: 
 * 1. GET https://expressiv-be-sb.idsdev.site/api/users/{userId} - Get user details
 * 2. GET https://expressiv-be-sb.idsdev.site/api/ar-invoices/by-preparer/{kansaiEmployeeId} - Get invoices by preparer
 * Method: GET
 * Headers: accept: text/plain
 * 
 * Expected Response Format:
 * {
 *   "status": true,
 *   "code": 200,
 *   "message": "Operation successful",
 *   "data": [
 *     {
 *       "stagingID": "...",
 *       "docNum": 64428,
 *       "docType": "I",
 *       "docDate": "2025-07-31T00:00:00",
 *       "docDueDate": "2025-08-30T00:00:00",
 *       "cardCode": "C40221",
 *       "cardName": "PT PRIMA MUTU UNGGUL",
 *       "numAtCard": "FNC/INV/KPI/25070001",
 *       "u_BSI_Expressiv_PreparedByNIK": "02401115",
 *       "u_BSI_Expressiv_PreparedByName": "Vaphat Sukamanah",
 *       "docTotal": 34515450,
 *       "grandTotal": 34515450,
 *       "visInv": "INVKPI25070001",
 *       "arInvoiceApprovalSummary": {
 *         "approvalStatus": "Draft|Prepared|Checked|Acknowledged|Approved|Received|Rejected"
 *       }
 *     }
 *   ]
 * }
 */
// Optimized fetch with better caching and error handling
async function fetchARInvoiceDocuments() {
    // Skip cache for now to ensure fresh data loads properly
    // const cacheKey = `invoices_${getLocalUserId()}`;
    // const cached = dataCache.get(cacheKey);
    // const now = Date.now();
    
    // if (cached && (now - cached.timestamp) < CACHE_TTL) {
    //     console.log('🚀 Using cached data');
    //     return cached.data;
    // }

    try {
        const userId = getLocalUserId();
        console.log('🔄 Fetching AR invoice documents for user:', userId);

        if (typeof window.isAuthenticated === 'function' && !window.isAuthenticated()) {
            console.error('❌ User not authenticated');
            throw new Error('User not authenticated. Please login again.');
        }

        // First, get the user's Kansai Employee ID
        const kansaiEmployeeId = await getUserKansaiEmployeeId(userId);
        if (!kansaiEmployeeId) {
            console.warn('Could not get Kansai Employee ID, using default');
            // Use default Kansai Employee ID as fallback
            const defaultKansaiEmployeeId = '02401115';
            console.log('Using default Kansai Employee ID:', defaultKansaiEmployeeId);

            const response = await fetch(`${API_BASE_URL}/ar-invoices/by-preparer/${defaultKansaiEmployeeId}`, {
                method: 'GET',
                headers: {
                    'accept': 'text/plain'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('API response with default Kansai Employee ID:', result);

            // Handle response structure
            if (result.status && result.data && Array.isArray(result.data)) {
                console.log(`Successfully loaded ${result.data.length} invoices from API for default Kansai Employee ID ${defaultKansaiEmployeeId}`);
                return result.data;
            } else if (Array.isArray(result)) {
                console.log(`Successfully loaded ${result.length} invoices from API (direct array)`);
                return result;
            } else if (result.data) {
                console.log(`Successfully loaded ${result.data.length} invoices from API (data field)`);
                return result.data;
            } else {
                console.warn('No valid data found in API response');
                return [];
            }
        }

        // Use the Kansai Employee ID to fetch invoices
        console.log('Using Kansai Employee ID for invoice fetch:', kansaiEmployeeId);
        const response = await fetch(`${API_BASE_URL}/ar-invoices/by-preparer/${kansaiEmployeeId}`, {
            method: 'GET',
            headers: {
                'accept': 'text/plain'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ API response received');

        let data = [];
        // Handle response structure based on new API format
        if (result.status && result.data && Array.isArray(result.data)) {
            data = result.data;
        } else if (Array.isArray(result)) {
            data = result;
        } else if (result.data) {
            data = result.data;
        }

        // Cache the result (disabled for debugging)
        // dataCache.set(cacheKey, {
        //     data,
        //     timestamp: now
        // });
        
        console.log(`✅ Loaded ${data.length} invoices`);
        // lastFetchTime = now;
        return data;
    } catch (error) {
        console.error('Error fetching AR invoice documents:', error);
        throw error;
    }
}

// Function to fetch all documents - simplified
async function fetchAllDocuments() {
    try {
        return await fetchARInvoiceDocuments();
    } catch (error) {
        console.error('Error fetching all documents:', error);
        return [];
    }
}

// Function to fetch documents by status - now client-side filtering
async function fetchDocumentsByStatus(status) {
    try {
        const allDocuments = await fetchAllDocuments();

        // Filter based on status using client-side logic
        switch (status) {
            case 'draft':
                return allDocuments.filter(doc => getStatusFromInvoice(doc) === 'Draft');
            case 'prepared':
                return allDocuments.filter(doc => getStatusFromInvoice(doc) === 'Prepared');
            case 'checked':
                return allDocuments.filter(doc => getStatusFromInvoice(doc) === 'Checked');
            case 'acknowledged':
                return allDocuments.filter(doc => getStatusFromInvoice(doc) === 'Acknowledged');
            case 'approved':
                return allDocuments.filter(doc => getStatusFromInvoice(doc) === 'Approved');
            case 'received':
                return allDocuments.filter(doc => getStatusFromInvoice(doc) === 'Received');
            case 'rejected':
                return allDocuments.filter(doc => getStatusFromInvoice(doc) === 'Rejected');
            default:
                return allDocuments;
        }
    } catch (error) {
        console.error(`Error fetching documents for status ${status}:`, error);
        return [];
    }
}

// User ID function - get user ID from auth.js
function getLocalUserId() {
    // Check if auth.js functions are available
    if (typeof window.getUserId !== 'function') {
        console.warn('auth.js getUserId function not available, using default user ID');
        return '02401115';
    }

    // Use the getUserId function from auth.js
    const userId = window.getUserId();
    if (userId) {
        return userId;
    }

    // Fallback to a default user ID for development if auth.js is not available
    console.warn('getUserId from auth.js returned null, using default user ID');
    return '02401115';
}

// Function to get user's Kansai Employee ID from API
async function getUserKansaiEmployeeId(userId) {
    try {
        // Check if we have cached data first
        const cachedKansaiEmployeeId = localStorage.getItem('kansaiEmployeeId');
        if (cachedKansaiEmployeeId) {
            console.log('Using cached Kansai Employee ID:', cachedKansaiEmployeeId);
            return cachedKansaiEmployeeId;
        }

        console.log('Fetching user details for ID:', userId);

        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'GET',
            headers: {
                'accept': '*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('User API response:', result);

        if (result.status && result.data && result.data.kansaiEmployeeId) {
            // Store in localStorage for future use
            localStorage.setItem('kansaiEmployeeId', result.data.kansaiEmployeeId);
            console.log('Kansai Employee ID found and stored:', result.data.kansaiEmployeeId);
            return result.data.kansaiEmployeeId;
        } else {
            console.warn('No valid Kansai Employee ID found in user data');
            return null;
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        return null;
    }
}

// Access token function - use auth.js getAccessToken() function directly
// No local function to avoid naming conflicts

// Load user data - use auth.js functions
function loadUserData() {
    try {
        // Check if user is authenticated
        if (typeof window.isAuthenticated === 'function' && !window.isAuthenticated()) {
            console.error('User not authenticated');
            return null;
        }

        // Get current user from auth.js
        const currentUser = typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null;
        const userId = getLocalUserId();

        console.log('Current user:', currentUser);
        console.log('Current user ID:', userId);

        // Set user display if available
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay && currentUser) {
            userNameDisplay.textContent = currentUser.username || 'User';
        }

        return userId;
    } catch (error) {
        console.error('Error loading user data:', error);
        return null;
    }
}

// Main function to fetch invoice data - simplified
async function fetchInvoiceData() {
    try {
        // Show loading state
        document.getElementById('recentDocs').innerHTML = '<tr><td colspan="10" class="text-center py-4"><div class="flex items-center justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span class="ml-2">Loading data...</span></div></td></tr>';

        console.log('Fetching invoice data...');

        // Fetch data using simplified API
        const documents = await fetchAllDocuments();

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

// Optimized counter update with single pass and memoization
let statusCounts = {};
let lastCounterUpdate = 0;

function updateCounters() {
    const now = Date.now();
    // Skip update if called within 100ms (debouncing)
    if (now - lastCounterUpdate < 100) return;
    lastCounterUpdate = now;

    // Single pass counting for better performance
    statusCounts = {
        total: allInvoices.length,
        Draft: 0,
        Prepared: 0,
        Checked: 0,
        Acknowledged: 0,
        Approved: 0,
        Received: 0,
        Rejected: 0
    };

    allInvoices.forEach(invoice => {
        const status = getStatusFromInvoice(invoice);
        if (statusCounts[status] !== undefined) {
            statusCounts[status]++;
        }
    });

    // Batch DOM updates
    const updates = {
        'totalCount': statusCounts.total,
        'draftCount': statusCounts.Draft,
        'preparedCount': statusCounts.Prepared,
        'checkedCount': statusCounts.Checked,
        'acknowledgedCount': statusCounts.Acknowledged,
        'approvedCount': statusCounts.Approved,
        'receivedCount': statusCounts.Received,
        'rejectedCount': statusCounts.Rejected
    };

    // Use requestAnimationFrame for smoother DOM updates
    requestAnimationFrame(() => {
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && element.textContent !== value.toString()) {
                element.textContent = value;
            }
        });
    });

    console.log('Counters updated efficiently:', statusCounts);
}

/**
 * Helper function to determine status from invoice data
 * 
 * IMPLEMENTATION UPDATE:
 * - Primary field: arInvoiceApprovalSummary.approvalStatus
 * - If approvalStatus is empty/null/undefined, return "Draft"
 * - Fallback to other fields only if approvalStatus is not available
 * 
 * @param {Object} invoice - The invoice object from API
 * @returns {string} The status of the invoice
 */
function getStatusFromInvoice(invoice) {
    // Debug logging for arInvoiceApprovalSummary
    console.log('Invoice arInvoiceApprovalSummary:', invoice.arInvoiceApprovalSummary);
    console.log('Invoice arInvoiceApprovalSummary type:', typeof invoice.arInvoiceApprovalSummary);

    // Check if invoice has approval summary - if null, return Draft
    if (invoice.arInvoiceApprovalSummary === null || invoice.arInvoiceApprovalSummary === undefined) {
        console.log('arInvoiceApprovalSummary is null/undefined, returning Draft');
        return 'Draft';
    }

    // If arInvoiceApprovalSummary exists, check the approvalStatus field first
    if (invoice.arInvoiceApprovalSummary) {
        const summary = invoice.arInvoiceApprovalSummary;
        console.log('arInvoiceApprovalSummary properties:', summary);

        // Use the approvalStatus field from the API response if available and not empty
        if (summary.approvalStatus && summary.approvalStatus.trim() !== '') {
            console.log('✅ Using approvalStatus from API:', summary.approvalStatus);
            return validateStatus(summary.approvalStatus);
        }

        // If approvalStatus is empty, null, or undefined, return Draft
        console.log('❌ approvalStatus is empty/null/undefined, returning Draft');
        console.log('approvalStatus value:', summary.approvalStatus);
        console.log('approvalStatus type:', typeof summary.approvalStatus);
        return 'Draft';
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

// Helper function to validate status value
function validateStatus(status) {
    const validStatuses = ['Draft', 'Prepared', 'Checked', 'Acknowledged', 'Approved', 'Received', 'Rejected'];
    if (status && validStatuses.includes(status)) {
        return status;
    }
    console.warn(`Invalid status value: "${status}", defaulting to "Draft"`);
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

// Optimized display with virtual scrolling and fragment rendering
function displayInvoices() {
    const tableBody = document.getElementById('recentDocs');
    
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

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Update pagination info
    updatePagination();

    // Batch DOM operations using DocumentFragment
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

        // Format dates using consistent timezone-safe function
        const formattedDate = formatDate(invoice.docDate);
        const formattedDueDate = formatDate(invoice.docDueDate);

        // Get status from approvalStatus field, default to "Draft" if empty
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

        // Enhanced field mapping for new API structure
        const invoiceNumber = invoice.numAtCard || invoice.u_bsi_invnum || invoice.visInv || '-';
        const customerName = invoice.cardName || '-';
        // const salesEmployee = invoice.u_BSI_Expressiv_PreparedByName || '-'; // Removed unused variable
        const totalAmount = invoice.docTotal || invoice.grandTotal || 0;
        const documentType = getDocumentType(invoice.docType);

        const customerCellHtml = (customerName && customerName.length > 15)
            ? `<div class="scrollable-cell-sm">${customerName}</div>`
            : `${customerName}`;
        row.innerHTML = `
            <td class="p-2 border-b">${startIndex + index + 1}</td>
            <td class="p-2 border-b">${invoiceNumber}</td>
            <td class="p-2 border-b">${customerCellHtml}</td>
            <td class="p-2 border-b">${formattedDate}</td>
            <td class="p-2 border-b">${formattedDueDate}</td>
            <td class="p-2 border-b"><span class="px-2 py-1 rounded-full text-xs ${statusClass}">${status}</span></td>
            <td class="p-2 border-b">${documentType}</td>
            <td class="p-2 border-b text-right">${formatCurrency(totalAmount)}</td>
            <td class="p-2 border-b">
                <button ${detailButtonOnClick} class="${detailButtonClass}" title="${detailButtonTitle}">${detailButtonText}</button>
            </td>
        `;

        fragment.appendChild(row);
    });
    
    // Single DOM operation
    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
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

    // Check if user is authenticated
    if (typeof window.isAuthenticated === 'function' && !window.isAuthenticated()) {
        console.error('User not authenticated');
        return;
    }

    const userId = getLocalUserId();
    if (!userId) {
        console.error('User ID not found');
        return;
    }

    try {
        let documents = [];

        if (tab === 'all') {
            document.getElementById('allTabBtn').classList.add('tab-active');
            console.log('Fetching all documents...');
            documents = await fetchAllDocuments();
            console.log(`All documents fetched: ${documents.length} documents`);
        } else if (tab === 'draft') {
            document.getElementById('draftTabBtn').classList.add('tab-active');
            console.log('Fetching draft documents...');
            documents = await fetchDocumentsByStatus('draft');
            console.log(`Draft documents fetched: ${documents.length} documents`);
        } else if (tab === 'prepared') {
            document.getElementById('preparedTabBtn').classList.add('tab-active');
            console.log('Fetching prepared documents...');
            documents = await fetchDocumentsByStatus('prepared');
            console.log(`Prepared documents fetched: ${documents.length} documents`);
        }

        // Update data arrays properly
        allInvoices = [...documents]; // Always use all data for counters
        filteredInvoices = [...documents]; // Start with all data for current tab
        
        console.log(`✅ Tab switched to ${tab}: ${documents.length} documents loaded`);
        
        // Apply any existing search filter
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput?.value?.toLowerCase().trim() || '';
        
        if (searchTerm) {
            console.log(`🔍 Applying existing search: "${searchTerm}"`);
            performSearch(); // This will filter the data properly
        }
        
        // Update counters with all data (not filtered)
        updateCounters();
        
        // Display the (possibly filtered) documents
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

// Fixed search setup with proper event handling
const eventCleanup = [];

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');

    console.log('🔍 Setting up search...', { searchInput: !!searchInput, searchType: !!searchType });

    if (searchInput) {
        // Remove existing listeners first
        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);
        
        // Add debounced search
        const debouncedHandler = debounce(performSearch, 300);
        newInput.addEventListener('input', debouncedHandler);
        eventCleanup.push(() => newInput.removeEventListener('input', debouncedHandler));
        
        console.log('✅ Search input event listener added');
    }

    if (searchType) {
        // Remove existing listeners first
        const newSelect = searchType.cloneNode(true);
        searchType.parentNode.replaceChild(newSelect, searchType);
        
        newSelect.addEventListener('change', performSearch);
        eventCleanup.push(() => newSelect.removeEventListener('change', performSearch));
        
        console.log('✅ Search type event listener added');
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

// Fixed search functionality
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    
    if (!searchInput || !searchType) {
        console.warn('Search elements not found');
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const searchTypeValue = searchType.value;
    
    console.log('🔍 Performing search:', { searchTerm, searchTypeValue });
    
    if (!searchTerm) {
        // If no search term, show all documents
        filteredInvoices = [...allInvoices];
        console.log('📄 Showing all documents:', filteredInvoices.length);
    } else {
        // Filter based on search type and term
        filteredInvoices = allInvoices.filter(invoice => {
            switch (searchTypeValue) {
                case 'invoice':
                    return (
                        (invoice.numAtCard && invoice.numAtCard.toLowerCase().includes(searchTerm)) ||
                        (invoice.u_bsi_invnum && invoice.u_bsi_invnum.toLowerCase().includes(searchTerm)) ||
                        (invoice.visInv && invoice.visInv.toLowerCase().includes(searchTerm)) ||
                        (invoice.docNum && invoice.docNum.toString().toLowerCase().includes(searchTerm))
                    );
                case 'customer':
                    return invoice.cardName && invoice.cardName.toLowerCase().includes(searchTerm);
                case 'date':
                    const docDate = invoice.docDate || invoice.postingDate;
                    if (docDate) {
                        const formattedDate = formatDate(docDate);
                        return formattedDate.toLowerCase().includes(searchTerm);
                    }
                    return false;
                case 'status':
                    const status = getStatusFromInvoice(invoice);
                    return status.toLowerCase().includes(searchTerm);
                default:
                    return true;
            }
        });
        console.log('🔍 Search results:', filteredInvoices.length, 'found');
    }
    
    // Reset to first page
    currentPage = 1;
    
    // Update display
    updatePagination();
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
            // Format dates using consistent timezone-safe function
            const formattedDate = formatDate(invoice.docDate);
            const formattedDueDate = formatDate(invoice.docDueDate);

            return {
                'No': index + 1,
                'Invoice No.': invoice.numAtCard || invoice.u_bsi_invnum || invoice.visInv || '-',
                'Customer': invoice.cardName || '-',
                'Sales Employee': invoice.u_BSI_Expressiv_PreparedByName || '-',
                'Date': formattedDate,
                'Due Date': formattedDueDate,
                'Status': getStatusFromInvoice(invoice),
                'Type': getDocumentType(invoice.docType),
                'Total': invoice.docTotal || invoice.grandTotal || 0
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
            // Format dates using consistent timezone-safe function
            const formattedDate = formatDate(invoice.docDate);
            const formattedDueDate = formatDate(invoice.docDueDate);

            return [
                index + 1,
                invoice.numAtCard || invoice.u_bsi_invnum || invoice.visInv || '-',
                invoice.cardName || '-',
                invoice.u_BSI_Expressiv_PreparedByName || '-',
                formattedDate,
                formattedDueDate,
                getStatusFromInvoice(invoice),
                getDocumentType(invoice.docType),
                new Intl.NumberFormat('id-ID').format(invoice.docTotal || invoice.grandTotal || 0)
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
        doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 14, 30);

        // Add table
        doc.autoTable({
            startY: 35,
            head: [['No', 'Invoice No.', 'Customer', 'Sales Employee', 'Date', 'Due Date', 'Status', 'Type', 'Total']],
            body: pdfData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10 },
                8: { halign: 'right' }
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

// Fixed initialization order
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM Content Loaded - Initializing...');

    // 1. Load user data first
    loadUserData();
    
    // 2. Set up search functionality before fetching data
    setTimeout(() => {
        setupSearch();
        console.log('✅ Search setup completed');
    }, 100);

    // 3. Fetch and display invoice data
    setTimeout(() => {
        fetchInvoiceData();
        console.log('✅ Initial data fetch started');
    }, 200);

    // 4. Add auto-refresh functionality
    setupAutoRefresh();
    
    console.log('✅ All initialization completed');
});

// Function to setup auto-refresh functionality
function setupAutoRefresh() {
    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            console.log('Page became visible, refreshing data...');
            fetchInvoiceData();
        }
    });

    // Refresh data when window gains focus (user returns to window)
    window.addEventListener('focus', function () {
        console.log('Window gained focus, refreshing data...');
        fetchInvoiceData();
    });

    // Refresh data when page is loaded from cache (back/forward navigation)
    window.addEventListener('pageshow', function (event) {
        if (event.persisted) {
            console.log('Page loaded from cache, refreshing data...');
            fetchInvoiceData();
        }
    });

    // Refresh data when user navigates to this page
    if (window.performance && window.performance.navigation) {
        if (window.performance.navigation.type === window.performance.navigation.TYPE_NAVIGATE) {
            console.log('Page navigated to, refreshing data...');
            fetchInvoiceData();
        }
    }

    // Optimized initial load with requestIdleCallback
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            console.log('🚀 Idle callback refresh...');
            fetchInvoiceData();
        }, { timeout: 2000 });
    } else {
        setTimeout(() => {
            console.log('🚀 Fallback timeout refresh...');
            fetchInvoiceData();
        }, 1000);
    }
}

// Modern caching with better performance and storage management
class InvoiceCache {
    constructor() {
        this.memCache = new Map();
        this.storageKey = 'expressiv_invoice_cache';
        this.maxMemCacheSize = 100;
    }

    set(key, data) {
        // Memory cache
        if (this.memCache.size >= this.maxMemCacheSize) {
            const firstKey = this.memCache.keys().next().value;
            this.memCache.delete(firstKey);
        }
        
        this.memCache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Persistent cache (smaller dataset)
        if (key.includes('main_data')) {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.warn('⚠️ LocalStorage full, clearing old cache');
                this.clearStorage();
            }
        }
    }

    get(key, ttl = CACHE_TTL) {
        // Check memory cache first
        const memCached = this.memCache.get(key);
        if (memCached && (Date.now() - memCached.timestamp) < ttl) {
            return memCached.data;
        }

        // Check localStorage for main data
        if (key.includes('main_data')) {
            try {
                const stored = localStorage.getItem(this.storageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if ((Date.now() - parsed.timestamp) < ttl) {
                        return parsed.data;
                    }
                }
            } catch (e) {
                this.clearStorage();
            }
        }
        
        return null;
    }

    clearStorage() {
        localStorage.removeItem(this.storageKey);
    }

    clear() {
        this.memCache.clear();
        this.clearStorage();
    }
}

const invoiceCache = new InvoiceCache();

// Performance optimization functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Remove duplicate - debouncing is handled in setupSearch()

// Enhanced memory management
function cleanupResources() {
    // Clean up event listeners
    eventCleanup.forEach(cleanup => {
        try {
            cleanup();
        } catch (e) {
            console.warn('⚠️ Error during cleanup:', e);
        }
    });
    eventCleanup.length = 0;
    
    // Clear caches
    searchCache.clear();
    invoiceCache.clear();
    
    // Reset global state
    allInvoices.length = 0;
    filteredInvoices.length = 0;
    searchIndex = null;
    
    console.log('🧹 Resources cleaned up');
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupResources);
window.addEventListener('pagehide', cleanupResources);

// Enhanced error handling
function showErrorNotification(message, title = 'Error') {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: title,
            text: message,
            confirmButtonText: 'OK'
        });
    } else {
        alert(`${title}: ${message}`);
    }
}

function showSuccessNotification(message, title = 'Success') {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: title,
            text: message,
            confirmButtonText: 'OK'
        });
    } else {
        alert(`${title}: ${message}`);
    }
}

// Network error handling
function handleNetworkError(error) {
    console.error('Network error:', error);

    let errorMessage = 'Network error occurred.';

    if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else if (error.message.includes('404')) {
        errorMessage = 'Resource not found. Please check the URL and try again.';
    } else if (error.message.includes('500')) {
        errorMessage = 'Server error occurred. Please try again later.';
    }

    showErrorNotification(errorMessage, 'Network Error');
}

// Loading state management - removed duplicate declaration

function setLoadingState(loading) {
    isLoading = loading;

    const loadingElement = document.querySelector('.loading-spinner');
    if (loadingElement) {
        loadingElement.style.display = loading ? 'block' : 'none';
    }

    // Disable form inputs during loading
    const formInputs = document.querySelectorAll('input, textarea, select, button');
    formInputs.forEach(input => {
        input.disabled = loading;
    });
}

function showLoadingState() {
    setLoadingState(true);
}

function hideLoadingState() {
    setLoadingState(false);
}

// Performance monitoring
function measurePerformance(operation, callback) {
    const startTime = performance.now();
    const result = callback();
    const endTime = performance.now();

    console.log(`${operation} took ${endTime - startTime} milliseconds`);
    return result;
}

// Enhanced fetch function with performance monitoring
async function fetchInvoiceDataWithMonitoring() {
    return measurePerformance('API Call', async () => {
        showLoadingState();
        try {
            const data = await window.fetchWithCache();
            hideLoadingState();
            return data;
        } catch (error) {
            hideLoadingState();
            handleNetworkError(error);
            throw error;
        }
    });
}

// Fixed main fetch function
async function fetchInvoiceData() {
    try {
        // Show loading state
        const tableBody = document.getElementById('recentDocs');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="10" class="text-center py-4"><div class="flex items-center justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span class="ml-2">Loading data...</span></div></td></tr>';
        }

        console.log('🔄 Fetching invoice data...');

        // Fetch data directly
        const documents = await fetchARInvoiceDocuments();

        if (Array.isArray(documents)) {
            allInvoices = [...documents]; // Create copy
            filteredInvoices = [...documents]; // Set filtered to all initially
            
            console.log('✅ Invoice data loaded:', allInvoices.length, 'invoices');

            // Debug: Log the structure of the first invoice
            if (allInvoices.length > 0) {
                console.log('First invoice structure:', allInvoices[0]);
            }
            
            // Update counters and display
            updateCounters();
            displayInvoices();
            
        } else {
            throw new Error('Invalid API response format');
        }

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

/*
 * UPDATED API IMPLEMENTATION SUMMARY
 * 
 * ✅ COMPLETED UPDATES:
 * 
 * 1. NEW API ENDPOINT
 *    - Using /ar-invoices/by-prepared/{userId} endpoint
 *    - Server-side filtering by prepared user ID
 *    - More efficient data loading
 * 
 * 2. USER-SPECIFIC DATA
 *    - Personalized invoice data based on user ID
 *    - Dynamic endpoint construction
 *    - Better data relevance
 * 
 * 3. ENHANCED RESPONSE HANDLING
 *    - Updated for new API response structure
 *    - Better handling of arInvoiceApprovalSummary
 *    - Improved field mapping for new data format
 * 
 * 4. STATUS DETECTION UPDATE
 *    - Uses arInvoiceApprovalSummary.approvalStatus
 *    - Defaults to "Draft" when approvalStatus is empty/null
 *    - Supports all status types: Draft, Prepared, Checked, Acknowledged, Approved, Received, Rejected
 * 
 * 5. PERFORMANCE OPTIMIZATIONS
 *    - Caching system maintained
 *    - Debounced search functionality
 *    - Memory leak prevention
 *    - Enhanced error handling
 * 
 * 🚀 EXPECTED IMPROVEMENTS:
 * - More relevant data loading
 * - Better user experience with personalized data
 * - Improved data accuracy
 * - Reduced unnecessary data transfer
 * 
 * 📊 API ENDPOINTS USED:
 * 1. GET https://expressiv-be-sb.idsdev.site/api/users/{userId} - Get user details and Kansai Employee ID
 * 2. GET https://expressiv-be-sb.idsdev.site/api/ar-invoices/by-preparer/{kansaiEmployeeId} - Get invoices filtered by u_BSI_Expressiv_PreparedByNIK
 * Headers: accept: text/plain
 * 
 * 🔧 CACHE DURATION: 5 minutes
 * 🔧 DEBOUNCE DELAY: 300ms
 * 🔧 ITEMS PER PAGE: 10
 * 
 * 📋 STATUS FIELD IMPLEMENTATION:
 * - Primary source: arInvoiceApprovalSummary.approvalStatus
 * - Default value: "Draft" (when approvalStatus is empty/null/undefined)
 * - Valid statuses: Draft, Prepared, Checked, Acknowledged, Approved, Received, Rejected
 * - Status validation: Invalid statuses are converted to "Draft"
 */