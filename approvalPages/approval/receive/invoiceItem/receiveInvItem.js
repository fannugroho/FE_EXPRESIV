// Global variables
let currentInvItemData = null;
let currentUser = null;
let allUsers = []; // Store all users for kansaiEmployeeId lookup

// API Configuration
const API_BASE_URL = 'https://expressiv-be-sb.idsdev.site/api';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

// Function to initialize summary fields with default values
function initializeSummaryFields() {
    const summaryFields = ['docTotal', 'discSum', 'netPriceAfterDiscount', 'dpp1112', 'vatSum', 'grandTotal'];
    summaryFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '0.00';
            field.classList.add('currency-input-idr');
        }
    });
}

// Initialize page functionality
function initializePage() {
    // Get current user
    try {
        currentUser = window.getCurrentUser();
        if (!currentUser) {
            Swal.fire({
                icon: 'error',
                title: 'Authentication Error',
                text: 'Please login to continue'
            }).then(() => {
                window.location.href = '../../../../pages/login.html';
            });
            return;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: error.message || 'Authentication system error. Please contact administrator.'
        }).then(() => {
            window.location.href = '../../../../pages/login.html';
        });
        return;
    }

    // Load users from API to get kansaiEmployeeId
    fetchUsers();
    
    // Load invoice item data from URL parameters
    loadInvItemData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize summary fields with default values
    initializeSummaryFields();
    
    // Initially hide attachment section until status is determined
    toggleAttachmentSectionVisibility('Draft'); // Hide by default
}

// Function to fetch users from API
async function fetchUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.data) {
            allUsers = result.data;
            console.log('Users loaded from API:', allUsers);
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        // Don't show error to user as this is not critical for basic functionality
    }
}

// Function to get kansaiEmployeeId for current user
function getCurrentUserKansaiEmployeeId() {
    if (!currentUser || !allUsers.length) {
        console.warn('No current user or users data available');
        return currentUser?.userId || currentUser?.username || 'unknown';
    }
    
    // Find the current user in the allUsers array
    const currentUserData = allUsers.find(user => 
        user.id === currentUser.userId || 
        user.username === currentUser.username ||
        user.name === currentUser.username
    );
    
    if (currentUserData && currentUserData.kansaiEmployeeId) {
        console.log('Found kansaiEmployeeId for current user:', currentUserData.kansaiEmployeeId);
        return currentUserData.kansaiEmployeeId;
    }
    
    console.warn('kansaiEmployeeId not found for current user, falling back to userId/username');
    return currentUser.userId || currentUser.username || 'unknown';
}

// Function to get full name of the current user
function getCurrentUserFullName() {
    if (!currentUser || !allUsers.length) {
        console.warn('No current user or users data available for full name');
        return currentUser?.username || 'Unknown User';
    }
    
    // Find the current user in the allUsers array
    const currentUserData = allUsers.find(user => 
        user.id === currentUser.userId || 
        user.username === currentUser.username ||
        user.name === currentUser.username
    );
    
    if (currentUserData && currentUserData.name) {
        return currentUserData.name;
    }
    
    console.warn('Full name not found for current user, falling back to username');
    return currentUser.username || 'Unknown User';
}

// Load invoice item data
function loadInvItemData() {
    const urlParams = new URLSearchParams(window.location.search);
    const stagingId = urlParams.get('stagingID');
    
    if (!stagingId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No staging ID provided'
        }).then(() => {
            goToMenuReceiveInvItem();
        });
        return;
    }

    // Load data from API
    loadInvItemFromAPI(stagingId);
}

// Load invoice item data from API
async function loadInvItemFromAPI(stagingId) {
    try {
        console.log('Loading invoice item data for stagingId:', stagingId);
        
        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Construct API URL
        const apiUrl = `${API_BASE_URL}/ar-invoices/${stagingId}/details`;
        console.log('API URL:', apiUrl);
        
        // Fetch data from API
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API response result:', result);
        
        if (result.status && result.data) {
            currentInvItemData = result.data;
            console.log('Invoice item data loaded from API:', currentInvItemData);
            
            // Populate form with data
            populateInvItemData(currentInvItemData);
            
            // Update button visibility based on status
            updateButtonVisibility();
            
            // Close loading indicator
            Swal.close();
        } else {
            throw new Error('Invalid response format from API');
        }
        
    } catch (error) {
        console.error('Error loading invoice item data:', error);
        
        let errorMessage = 'Failed to load invoice item data';
        
        if (error.message.includes('404')) {
            errorMessage = 'Invoice item not found. Please check the staging ID.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network error. Please check your connection.';
        } else {
            errorMessage = `Failed to load invoice item data: ${error.message}`;
        }
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage
        }).then(() => {
            goToMenuReceiveInvItem();
        });
    }
}

// Update button visibility based on document status
function updateButtonVisibility() {
    if (!currentInvItemData) return;
    
    const status = getStatusFromInvoice(currentInvItemData);
    const receiveButton = document.querySelector('button[onclick="receiveInvItem()"]');
    const rejectButton = document.querySelector('button[onclick="rejectInvItem()"]');
    const eSignButton = document.getElementById('eSignButton');
    
    console.log('Current document status:', status);
    
    // Hide Reject and Receive buttons if status is "Received"
    if (status === 'Received') {
        if (receiveButton) receiveButton.style.display = 'none';
        if (rejectButton) rejectButton.style.display = 'none';
    } else {
        // Show buttons for other statuses
        if (receiveButton) receiveButton.style.display = 'inline-block';
        if (rejectButton) rejectButton.style.display = 'inline-block';
    }
    
    // Print button has been removed from main submit section
    // Print functionality is now only available in the E-Signing section
    
    // Show E-Sign button if status is "Received"
    if (eSignButton) {
        if (status === 'Received') {
            eSignButton.style.display = 'inline-block';
        } else {
            eSignButton.style.display = 'none';
        }
    }
    
    console.log('Button visibility updated based on status');
}

// Populate invoice item data in the form
function populateInvItemData(data) {
    console.log('Populating invoice item data:', data);
    
    // Helper function to safely set element value
    function safeSetValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        } else {
            console.warn(`Element with id '${elementId}' not found`);
        }
    }
    
    // Helper function to safely set element style
    function safeSetStyle(elementId, styleProperty, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style[styleProperty] = value;
        } else {
            console.warn(`Element with id '${elementId}' not found`);
        }
    }
    
    // Populate header fields
    safeSetValue('DocEntry', data.stagingID || '');
    safeSetValue('DocNum', data.docNum || '');
    safeSetValue('CardCode', data.cardCode || '');
    safeSetValue('CardName', data.cardName || '');
    safeSetValue('address', data.address || '');
    safeSetValue('NumAtCard', data.numAtCard || '');
    safeSetValue('DocCur', data.docCur || '');
    safeSetValue('docRate', data.docRate || '');
    safeSetValue('DocDate', formatDate(data.docDate));
    safeSetValue('DocDueDate', formatDate(data.docDueDate));
    safeSetValue('GroupNum', data.groupNum || '');
    safeSetValue('TrnspCode', data.trnspCode || '');
            safeSetValue('TaxNo', data.licTradNum || '');
        safeSetValue('U_BSI_ShippingType', data.u_BSI_ShippingType || '');
        safeSetValue('U_BSI_PaymentGroup', data.u_BSI_PaymentGroup || '');
    safeSetValue('U_BSI_Expressiv_IsTransfered', data.u_BSI_Expressiv_IsTransfered || 'N');
    safeSetValue('U_BSI_UDF1', data.u_bsi_udf1 || '');
    safeSetValue('U_BSI_UDF2', data.u_bsi_udf2 || '');
    safeSetValue('account', data.account || '');
    safeSetValue('acctName', data.acctName || '');
    

    
    // Populate status from approval summary
    const status = getStatusFromInvoice(data);
    safeSetValue('Status', status);
    
    // Toggle attachment section visibility based on approval status
    toggleAttachmentSectionVisibility(status);
    
    // Populate summary fields with currency formatting
    const docCur = data.docCur || 'IDR';
    
    // Total Amount (docTotal) - API Field: "docCur" "docTotal"
    const docTotal = data.docTotal || 0;
    safeSetValue('docTotal', formatCurrencyIDR(docTotal));
    
    // Discounted Amount (discSum) - API Field: "docCur" "discSum"
    const discSum = data.discSum || 0;
    safeSetValue('discSum', formatCurrencyIDR(discSum));
    
    // Sales Amount (netPriceAfterDiscount) - API Field: "docCur" "netPriceAfterDiscount"
    // Use netPriceAfterDiscount if available, otherwise use netPrice, fallback to docTotal
    const netPriceAfterDiscount = data.netPriceAfterDiscount !== null && data.netPriceAfterDiscount !== undefined 
        ? data.netPriceAfterDiscount 
        : (data.netPrice || data.docTotal || 0);
    safeSetValue('netPriceAfterDiscount', formatCurrencyIDR(netPriceAfterDiscount));
    
    console.log('Summary fields populated:', {
        docTotal: data.docTotal,
        discSum: data.discSum,
        netPriceAfterDiscount: data.netPriceAfterDiscount,
        netPrice: data.netPrice,
        dpp1112: data.dpp1112,
        vatSum: data.vatSum,
        grandTotal: data.grandTotal
    });
    
    // Tax Base Other Value (dpp1112) - API Field: "docCur" "dpp1112"
    const dpp1112 = data.dpp1112 || 0;
    safeSetValue('dpp1112', formatCurrencyIDR(dpp1112));
    
    // VAT 12% (vatSum) - API Field: "docCur" "vatSum"
    const vatSum = data.vatSum || 0;
    safeSetValue('vatSum', formatCurrencyIDR(vatSum));
    
    // GRAND TOTAL (grandTotal) - API Field: "docCur" "grandTotal"
    const grandTotal = data.grandTotal || data.docTotal || 0;
    safeSetValue('grandTotal', formatCurrencyIDR(grandTotal));
    
    // Populate comments
    safeSetValue('comments', data.comments || '');
    
    // Populate approval info from approval summary
    if (data.arInvoiceApprovalSummary) {
        console.log('Approval summary data:', data.arInvoiceApprovalSummary);
        
        safeSetValue('preparedBySearch', data.arInvoiceApprovalSummary.preparedByName || '');
        safeSetValue('acknowledgeBySearch', data.arInvoiceApprovalSummary.acknowledgedByName || '');
        safeSetValue('checkedBySearch', data.arInvoiceApprovalSummary.checkedByName || '');
        safeSetValue('approvedBySearch', data.arInvoiceApprovalSummary.approvedByName || '');
        safeSetValue('receivedBySearch', data.arInvoiceApprovalSummary.receivedByName || '');
        
        // Show rejection remarks if exists and has valid value
        const revisionRemarks = data.arInvoiceApprovalSummary.revisionRemarks;
        const rejectionRemarks = data.arInvoiceApprovalSummary.rejectionRemarks;
        
        // Check both revisionRemarks and rejectionRemarks fields
        const remarksToShow = revisionRemarks || rejectionRemarks;
        
        if (remarksToShow && remarksToShow.trim() !== '' && remarksToShow !== null && remarksToShow !== undefined) {
            safeSetValue('rejectionRemarks', remarksToShow);
            safeSetStyle('rejectionRemarksSection', 'display', 'block');
            console.log('Showing rejection remarks:', remarksToShow);
        } else {
            safeSetStyle('rejectionRemarksSection', 'display', 'none');
            console.log('Hiding rejection remarks section - no valid remarks found');
        }
    }
    
    // Populate items table
    populateItemsTable(data.arInvoiceDetails || []);
    
    // Apply text wrapping
    refreshTextWrapping();
    
    // Apply currency formatting to table cells and summary fields
    setTimeout(() => {
        applyCurrencyFormattingToTable();
        
        // Apply currency formatting to summary fields
        const summaryFields = ['docTotal', 'discSum', 'netPriceAfterDiscount', 'dpp1112', 'vatSum', 'grandTotal'];
        summaryFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.add('currency-input-idr');
                if (field.value && field.value !== '0.00') {
                    formatCurrencyInputIDR(field);
                }
            }
        });
    }, 200);
    
    // Make all fields read-only since this is a receive page
    makeAllFieldsReadOnly();
    
    // Save data to storage for print functionality
    if (data.stagingID) {
        saveInvoiceDataToStorage(data.stagingID, data);
    }
}

// Function to control attachment section visibility based on approval status
function toggleAttachmentSectionVisibility(approvalStatus) {
    console.log('toggleAttachmentSectionVisibility called with status:', approvalStatus);
    
    const attachmentSection = document.querySelector('.attachment-section');
    if (attachmentSection) {
        if (approvalStatus === 'Received') {
            attachmentSection.style.display = 'block';
            console.log('✅ Showing attachment section - Status is Received');
        } else {
            attachmentSection.style.display = 'none';
            console.log('❌ Hiding attachment section - Status is:', approvalStatus);
        }
    } else {
        console.warn('⚠️ Attachment section not found in DOM');
    }
}

// Helper function to determine status from invoice data
function getStatusFromInvoice(invoice) {
    // Check if invoice has approval summary
    if (invoice.arInvoiceApprovalSummary === null || invoice.arInvoiceApprovalSummary === undefined) {
        return 'Draft';
    }
    
    // If arInvoiceApprovalSummary exists, use approvalStatus field
    if (invoice.arInvoiceApprovalSummary) {
        const summary = invoice.arInvoiceApprovalSummary;
        
        // First priority: use approvalStatus field from arInvoiceApprovalSummary
        if (summary.approvalStatus && summary.approvalStatus.trim() !== '') {
            return summary.approvalStatus;
        }
        
        // Fallback: check individual status flags
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

// Format date to YYYY-MM-DD
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Populate items table
function populateItemsTable(items) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.warn('Element with id "tableBody" not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (items.length === 0) {
        // Add empty row message
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="13" class="p-4 text-center text-gray-500">
                No invoice details found
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    // Populate table with sequential numbering starting from 1
    items.forEach((item, index) => {
        const row = createItemRow(item, index);
        tableBody.appendChild(row);
    });
}

// Create item row with sequential numbering
function createItemRow(item, index) {
    const row = document.createElement('tr');
    row.className = 'border-b';
    
    row.innerHTML = `
        <td class="p-2 border no-column">
            <!-- Sequential numbering starting from 1 -->
            <input type="number" class="line-num-input no-input p-2 border rounded bg-gray-100 cursor-not-allowed" value="${index + 1}" disabled autocomplete="off" readonly />
        </td>
        <td class="p-2 border item-code-column">
            <input type="text" class="item-code-input p-2 border rounded bg-gray-100" value="${item.itemCode || ''}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border bp-catalog-column">
                            <input type="text" class="bp-catalog-input p-2 border rounded bg-gray-100" value="${item.catalogNo || ''}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border description-column">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off">${item.dscription || ''}</textarea>
        </td>
        <td class="p-2 border uom-column">
            <textarea class="w-full item-uom bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off">${item.unitMsr || ''}</textarea>
        </td>
        <td class="p-2 border packing-size-column">
            <textarea class="w-full item-packing-size bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off">${item.unitMsr2 || ''}</textarea>
        </td>
        <td class="p-2 border h-12 quantity-column">
            <textarea class="quantity-input item-sls-qty bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: center;" disabled autocomplete="off">${item.quantity || ''}</textarea>
        </td>
        <td class="p-2 border h-12 quantity-column">
            <textarea class="quantity-input item-quantity bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: center;" disabled autocomplete="off">${item.invQty || ''}</textarea>
        </td>
        <td class="p-2 border uom-column" style="display: none;">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="10" disabled autocomplete="off" value="${item.unitMsr || ''}" />
        </td>
        <td class="p-2 border h-12 price-column">
            <textarea class="price-input item-sls-price bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" disabled autocomplete="off">${item.u_bsi_salprice || ''}</textarea>
        </td>
        <td class="p-2 border h-12 price-column">
            <textarea class="price-input item-price bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" disabled autocomplete="off">${item.priceBefDi || ''}</textarea>
        </td>
        <td class="p-2 border tax-code-column">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="8" disabled autocomplete="off" value="${item.vatgroup || ''}" />
        </td>
        <td class="p-2 border h-12 line-total-column">
            <textarea class="line-total-input item-line-total bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" disabled autocomplete="off">${item.lineTotal || ''}</textarea>
        </td>
        <td class="p-2 border account-code-column" style="display: none;">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="15" disabled autocomplete="off" value="${item.acctCode || ''}" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" disabled autocomplete="off" value="${item.baseType || 0}" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" disabled autocomplete="off" value="${item.baseEntry || 0}" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" disabled autocomplete="off" value="${item.baseLine || 0}" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" disabled autocomplete="off" value="${item.lineType || 0}" />
        </td>
    `;
    
    return row;
}

// Setup event listeners
function setupEventListeners() {
    // Add any additional event listeners here
}

// Receive invoice item
function receiveInvItem() {
    if (!currentInvItemData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice item data available'
        });
        return;
    }

    Swal.fire({
        title: 'Confirm Receipt',
        text: 'Are you sure you want to receive this invoice item?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Receive',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Update status to Received
            updateInvItemStatus('Received');
        }
    });
}

// Reject invoice item
function rejectInvItem() {
    if (!currentInvItemData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice item data available'
        });
        return;
    }

    Swal.fire({
        title: 'Reject Invoice Item',
        input: 'textarea',
        inputLabel: 'Rejection Remarks',
        inputPlaceholder: 'Enter rejection reason...',
        inputAttributes: {
            'aria-label': 'Enter rejection remarks',
            'aria-describedby': 'rejection-remarks-help'
        },
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
            if (!value || value.trim() === '') {
                return 'Please enter rejection remarks';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Update status to Rejected with remarks
            updateInvItemStatus('Rejected', result.value);
        }
    });
}

// Update invoice item status using PATCH API
async function updateInvItemStatus(status, remarks = '') {
    if (!currentInvItemData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice item data available'
        });
        return;
    }

    try {
        // Show loading indicator
        Swal.fire({
            title: 'Updating Status...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Get staging ID for the API endpoint
        const stagingID = currentInvItemData.stagingID;
        if (!stagingID) {
            throw new Error('Staging ID is required for submission');
        }

        // Create timestamp in ISO format
        const now = new Date().toISOString();
        console.log('Current timestamp for status update:', now);
        
        // Prepare payload for PATCH API - preserve existing approval data
        const payload = {
            approvalStatus: status,
            receivedBy: getCurrentUserKansaiEmployeeId(),
            receivedByName: getCurrentUserFullName(),
            updatedAt: now
        };

        // Handle status-specific fields
        if (status === 'Received') {
            // Add receivedDate when status is "Received"
            payload.receivedDate = now;
            console.log('✅ Added receivedDate to payload:', now);
            console.log('📅 receivedDate format:', typeof now, now);
        } else if (status === 'Rejected') {
            // Add rejectedDate when status is "Rejected"
            payload.rejectedDate = now;
            console.log('✅ Added rejectedDate to payload:', now);
            console.log('📅 rejectedDate format:', typeof now, now);
            
            // Add rejection remarks if provided
            if (remarks && remarks.trim() !== '') {
                payload.rejectionRemarks = remarks.trim();
                console.log('✅ Added rejectionRemarks to payload:', remarks.trim());
            }
        }

        // Preserve existing approval data if available
        if (currentInvItemData.arInvoiceApprovalSummary) {
            const existingSummary = currentInvItemData.arInvoiceApprovalSummary;
            
            // Preserve existing approval data
            if (existingSummary.preparedBy) payload.preparedBy = existingSummary.preparedBy;
            if (existingSummary.preparedByName) payload.preparedByName = existingSummary.preparedByName;
            if (existingSummary.preparedDate) payload.preparedDate = existingSummary.preparedDate;
            
            if (existingSummary.checkedBy) payload.checkedBy = existingSummary.checkedBy;
            if (existingSummary.checkedByName) payload.checkedByName = existingSummary.checkedByName;
            if (existingSummary.checkedDate) payload.checkedDate = existingSummary.checkedDate;
            
            if (existingSummary.acknowledgedBy) payload.acknowledgedBy = existingSummary.acknowledgedBy;
            if (existingSummary.acknowledgedByName) payload.acknowledgedByName = existingSummary.acknowledgedByName;
            if (existingSummary.acknowledgedDate) payload.acknowledgedDate = existingSummary.acknowledgedDate;
            
            if (existingSummary.approvedBy) payload.approvedBy = existingSummary.approvedBy;
            if (existingSummary.approvedByName) payload.approvedByName = existingSummary.approvedByName;
            if (existingSummary.approvedDate) payload.approvedDate = existingSummary.approvedDate;
            
            // Preserve existing rejection remarks if any (but don't override new ones)
            if (existingSummary.rejectionRemarks && !payload.rejectionRemarks) {
                payload.rejectionRemarks = existingSummary.rejectionRemarks;
            }
            if (existingSummary.revisionRemarks) payload.revisionRemarks = existingSummary.revisionRemarks;
        }

        console.log('📤 Updating invoice item status with payload:', payload);
        console.log('🌐 API URL:', `${API_BASE_URL}/ar-invoices/approval/${stagingID}`);

        // Make PATCH API call
        const response = await fetch(`${API_BASE_URL}/ar-invoices/approval/${stagingID}`, {
            method: 'PATCH',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error response:', errorText);
            
            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = errorJson.message || errorJson.error || errorText;
            } catch (parseError) {
                console.error('Could not parse error response as JSON:', parseError);
            }
            
            throw new Error(`API Error: ${response.status} - ${errorDetails}`);
        }

        const result = await response.json();
        console.log('✅ API Response:', result);

        // Update the current data with the new status
        if (currentInvItemData && currentInvItemData.arInvoiceApprovalSummary) {
            currentInvItemData.arInvoiceApprovalSummary.approvalStatus = status;
            if (status === 'Received') {
                currentInvItemData.arInvoiceApprovalSummary.receivedBy = getCurrentUserKansaiEmployeeId();
                currentInvItemData.arInvoiceApprovalSummary.receivedByName = getCurrentUserFullName();
                currentInvItemData.arInvoiceApprovalSummary.receivedDate = now;
            } else if (status === 'Rejected') {
                currentInvItemData.arInvoiceApprovalSummary.rejectedBy = getCurrentUserKansaiEmployeeId();
                currentInvItemData.arInvoiceApprovalSummary.rejectedByName = getCurrentUserFullName();
                currentInvItemData.arInvoiceApprovalSummary.rejectedDate = now;
                if (remarks && remarks.trim() !== '') {
                    currentInvItemData.arInvoiceApprovalSummary.rejectionRemarks = remarks.trim();
                }
            }
        }

        // Update button visibility based on new status
        updateButtonVisibility();

        // Show success message with confirmation
        const actionText = status === 'Received' ? 'received' : 'rejected';
        const dateField = status === 'Received' ? 'receivedDate' : 'rejectedDate';
        
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `Invoice item has been ${actionText} successfully with ${dateField}: ${new Date(now).toLocaleString()}. Do you want to return to the menu?`,
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Return to Menu',
            cancelButtonText: 'Stay Here',
            timer: null,
            timerProgressBar: false
        }).then((result) => {
            if (result.isConfirmed) {
                // Navigate back to menu
                goToMenuReceiveInvItem();
            }
        });

    } catch (error) {
        console.error('❌ Error updating invoice item status:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: error.message || 'Failed to update invoice item status. Please try again.',
            confirmButtonText: 'OK'
        });
    }
}

// Print invoice item
function printInvItem() {
    try {
        console.log("Print function started");
        
        // Helper function to safely get element value
        function safeGetValue(elementId, defaultValue = '') {
            const element = document.getElementById(elementId);
            if (element) {
                return element.value || defaultValue;
            } else {
                console.warn(`Element with id '${elementId}' not found`);
                return defaultValue;
            }
        }
        
        // Helper function to safely get element value as number
        function safeGetNumber(elementId, defaultValue = 0) {
            const element = document.getElementById(elementId);
            if (element) {
                return parseFloat(element.value) || defaultValue;
            } else {
                console.warn(`Element with id '${elementId}' not found`);
                return defaultValue;
            }
        }
        
        // Get current stagingID
        const stagingID = currentInvItemData?.stagingID || 'STG-UNKNOWN';
        
        // Get all necessary data from the form
        const invData = {
            stagingID: stagingID,
            docNum: safeGetValue('DocNum'),
            cardName: safeGetValue('CardName'),
            cardCode: safeGetValue('CardCode'),
            numAtCard: safeGetValue('NumAtCard'),
            docDate: safeGetValue('DocDate'),
            docCur: safeGetValue('DocCur'),
            groupNum: safeGetValue('GroupNum'),
            trnspCode: safeGetValue('TrnspCode'),
            u_BSI_ShippingType: safeGetValue('U_BSI_ShippingType'),
            u_BSI_PaymentGroup: safeGetValue('U_BSI_PaymentGroup'),
            u_bsi_udf1: safeGetValue('U_BSI_UDF1'),
            u_bsi_udf2: safeGetValue('U_BSI_UDF2'),
            account: safeGetValue('account'),
            acctName: safeGetValue('acctName'),
            docTotal: safeGetNumber('DocTotal'),
            vatSum: safeGetNumber('VatSum'),
            priceBefDi: safeGetNumber('PriceBefDi'),
            comments: safeGetValue('comments'),
            preparedBy: safeGetValue('preparedBySearch'),
            acknowledgedBy: safeGetValue('acknowledgeBySearch'),
            checkedBy: safeGetValue('checkedBySearch'),
            approvedBy: safeGetValue('approvedBySearch'),
            receivedBy: safeGetValue('receivedBySearch'),
        };
        
        // Get items from the table
        const items = [];
        const tableBody = document.getElementById('tableBody');
        
        if (!tableBody) {
            console.warn('Table body not found, skipping item extraction');
        } else {
            const rows = tableBody.querySelectorAll('tr');
            
            rows.forEach((row, index) => {
                // Helper function to safely get element value from row
                function safeGetRowValue(selector, defaultValue = '') {
                    const element = row.querySelector(selector);
                    return element ? (element.value || defaultValue) : defaultValue;
                }
                
                // Helper function to safely get element value as number from row
                function safeGetRowNumber(selector, defaultValue = 0) {
                    const element = row.querySelector(selector);
                    return element ? (parseFloat(element.value) || defaultValue) : defaultValue;
                }
                
                // Helper function to safely get element value as integer from row
                function safeGetRowInt(selector, defaultValue = 0) {
                    const element = row.querySelector(selector);
                    return element ? (parseInt(element.value) || defaultValue) : defaultValue;
                }
                
                // Extract data from each row
                const lineNum = safeGetRowNumber('.line-num-input', index);
                const itemCode = safeGetRowValue('.item-code-input');
                const itemName = safeGetRowValue('.item-description');
                const freeTxt = safeGetRowValue('.item-free-txt');
                const salesQty = safeGetRowNumber('.item-sls-qty');
                const invQty = safeGetRowNumber('.item-quantity');
                const uom = safeGetRowValue('.item-uom', 'PCS');
                const salesPrice = safeGetRowNumber('.item-sls-price');
                const price = safeGetRowNumber('.item-price');
                const discPrcnt = safeGetRowNumber('.item-discount');
                const taxCode = safeGetRowValue('.item-tax-code', 'VAT');
                const lineTotal = safeGetRowNumber('.item-line-total');
                const accountCode = safeGetRowValue('.item-account-code', '4000');
                const baseType = safeGetRowInt('.item-base-type');
                const baseEntry = safeGetRowInt('.item-base-entry');
                const baseLine = safeGetRowInt('.item-base-line');
                const lineType = safeGetRowInt('.item-line-type');
            
            items.push({
                lineNum: parseInt(lineNum),
                itemCode: itemCode,
                dscription: itemName,
                text: freeTxt,
                quantity: salesQty,
                invQty: invQty,
                unitMsr: uom,
                u_bsi_salprice: salesPrice,
                priceBefDi: price,
                discount: discPrcnt,
                vatgroup: taxCode,
                lineTotal: lineTotal,
                acctCode: accountCode,
                baseType: baseType,
                baseEntry: baseEntry,
                baseLine: baseLine,
                lineType: lineType
            });
            });
        }
        
        // Add items to invoice data
        invData.arInvoiceDetails = items;
        
        // Save data to storage
        if (typeof saveInvoiceDataToStorage === 'function') {
            saveInvoiceDataToStorage(stagingID, invData);
        } else {
            // Fallback: save to localStorage directly
            localStorage.setItem(`invoice_${stagingID}`, JSON.stringify(invData));
            sessionStorage.setItem(`invoice_${stagingID}`, JSON.stringify(invData));
        }
        
        console.log("Invoice data saved to storage, opening print page");
        
        // First load the data directly into the print page
        const printWindow = window.open(`printARItem.html?stagingID=${stagingID}`, '_blank');
        
        // Ensure data is loaded in the new window
        if (printWindow) {
            printWindow.onload = function() {
                try {
                    // Pass the invoice data directly to the print page
                    if (printWindow.populateInvoiceData) {
                        console.log("Directly populating invoice data in print window");
                        printWindow.populateInvoiceData(invData);
                    } else {
                        console.log("Print window loaded but populateInvoiceData function not available yet");
                    }
                } catch (e) {
                    console.error("Error passing data to print window:", e);
                }
            };
        }
    } catch (error) {
        console.error("Error in printInvItem function:", error);
        alert("Terjadi kesalahan saat mencetak: " + error.message);
    }
}

// Function to make all fields read-only for receive view
function makeAllFieldsReadOnly() {
    // Make all input fields read-only with gray background
    const inputFields = document.querySelectorAll('input[type="text"]:not([id$="Search"]), input[type="date"], input[type="number"], textarea');
    inputFields.forEach(field => {
        field.readOnly = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
        field.classList.remove('bg-white');
    });
    
    // Make search inputs read-only with gray background
    const searchInputs = document.querySelectorAll('input[id$="Search"]');
    searchInputs.forEach(field => {
        field.readOnly = true;
        field.classList.add('bg-gray-100');
        field.classList.remove('bg-gray-50', 'bg-white');
        // Remove the onkeyup event to prevent search triggering
        field.removeAttribute('onkeyup');
    });
    
    // Disable all select fields with gray background
    const selectFields = document.querySelectorAll('select');
    selectFields.forEach(field => {
        field.disabled = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
        field.classList.remove('bg-white');
    });
    
    // Disable all checkboxes
    const checkboxFields = document.querySelectorAll('input[type="checkbox"]');
    checkboxFields.forEach(field => {
        field.disabled = true;
        field.classList.add('cursor-not-allowed');
    });
    
    // Handle table inputs and textareas - make them all gray
    const tableInputs = document.querySelectorAll('#tableBody input, #tableBody textarea');
    tableInputs.forEach(input => {
        input.readOnly = true;
        input.classList.add('bg-gray-100');
        input.classList.remove('bg-white');
    });
}

// Navigation function
function goToMenuReceiveInvItem() {
    // Navigate to the invoice item receive menu
    window.location.href = '../../../dashboard/dashboardReceive/ARInvoice/menuARItemReceive.html';
}

// Function to refresh text wrapping for all elements
function refreshTextWrapping() {
    setTimeout(() => {
        applyTextWrappingToAll();
    }, 50);
}

// Function to apply text wrapping to all relevant elements
function applyTextWrappingToAll() {
    const textElements = document.querySelectorAll('.description-column textarea, .item-code-column input, .quantity-column textarea, .price-column textarea, .packing-size-column textarea');
    
    textElements.forEach(element => {
        handleTextWrapping(element);
    });
}

// Function to handle text wrapping based on character length
function handleTextWrapping(element) {
    const text = element.value || element.textContent || '';
    const charLength = text.length;
    
    // Remove existing classes
    element.classList.remove('wrap-text', 'no-wrap', 'auto-resize');
    
    if (charLength > 15) {
        // Apply wrap text styling for long content
        element.classList.add('wrap-text', 'auto-resize');
        
        // Auto-adjust height for textarea elements
        if (element.tagName === 'TEXTAREA') {
            const lineHeight = 20; // Approximate line height
            const lines = Math.ceil(charLength / 20); // Rough estimate of lines needed
            const newHeight = Math.min(Math.max(40, lines * lineHeight), 80);
            element.style.height = newHeight + 'px';
        }
    } else {
        // Apply no-wrap styling for short content
        element.classList.add('no-wrap');
        
        // Reset height for textarea elements
        if (element.tagName === 'TEXTAREA') {
            element.style.height = '40px';
        }
    }
}

// Function to save invoice data to storage (for print functionality)
function saveInvoiceDataToStorage(stagingID, invoiceData) {
    try {
        localStorage.setItem(`invoice_${stagingID}`, JSON.stringify(invoiceData));
        sessionStorage.setItem(`invoice_${stagingID}`, JSON.stringify(invoiceData));
        console.log('Invoice data saved to storage for stagingID:', stagingID);
        return true;
    } catch (error) {
        console.error('Error saving invoice data to storage:', error);
        return false;
    }
}

// Function to clear invoice data from storage
function clearInvoiceDataFromStorage(stagingID) {
    try {
        localStorage.removeItem(`invoice_${stagingID}`);
        sessionStorage.removeItem(`invoice_${stagingID}`);
        console.log('Invoice data cleared from storage for stagingID:', stagingID);
        return true;
    } catch (error) {
        console.error('Error clearing invoice data from storage:', error);
        return false;
    }
}

// Currency formatting functions
function formatCurrencyIDR(number) {
    if (number === null || number === undefined || number === '') {
        return '0.00';
    }
    
    let num;
    try {
        if (typeof number === 'string') {
            const cleanedStr = number.replace(/[^\d,.]/g, '');
            if (cleanedStr.length > 15) {
                num = Number(cleanedStr.replace(/,/g, ''));
            } else {
                num = parseFloat(cleanedStr.replace(/,/g, ''));
            }
        } else {
            num = Number(number);
        }
        
        if (isNaN(num)) {
            return '0.00';
        }
    } catch (e) {
        console.error('Error parsing number:', e);
        return '0.00';
    }
    
    const maxAmount = 100000000000000;
    if (num > maxAmount) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Amount Exceeds Limit',
                text: 'Total amount must not exceed 100 trillion rupiah'
            });
        } else {
            alert('Total amount must not exceed 100 trillion rupiah');
        }
        num = maxAmount;
    }
    
    if (num >= 1e12) {
        let strNum = num.toString();
        let result = '';
        let count = 0;
        
        for (let i = strNum.length - 1; i >= 0; i--) {
            result = strNum[i] + result;
            count++;
            if (count % 3 === 0 && i > 0) {
                result = ',' + result;
            }
        }
        
        return result + '.00';
    } else {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

function parseCurrencyIDR(formattedValue) {
    if (!formattedValue) return 0;
    
    try {
        const numericValue = formattedValue.toString().replace(/,/g, '');
        return parseFloat(numericValue) || 0;
    } catch (e) {
        console.error('Error parsing currency:', e);
        return 0;
    }
}

function formatCurrencyInputIDR(input) {
    // Change input type to text for currency formatting
    if (input.type === 'number') {
        input.type = 'text';
    }
    
    const cursorPos = input.selectionStart;
    const originalLength = input.value.length;
    
    let value = input.value.replace(/[^\d,.]/g, '');
    
    let parts = value.split('.');
    if (parts.length > 1) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    const numValue = parseCurrencyIDR(value);
    const formattedValue = formatCurrencyIDR(numValue);
    
    input.value = formattedValue;
    
    const newLength = input.value.length;
    const newCursorPos = cursorPos + (newLength - originalLength);
    input.setSelectionRange(Math.max(0, newCursorPos), Math.max(0, newCursorPos));
}

// Apply currency formatting to table cells
function applyCurrencyFormattingToTable() {
    // Format Price per UoM columns
    const pricePerUoMInputs = document.querySelectorAll('.item-sls-price');
    pricePerUoMInputs.forEach(input => {
        input.classList.add('currency-input-idr');
        input.addEventListener('input', function() {
            formatCurrencyInputIDR(this);
        });
        if (input.value) {
            formatCurrencyInputIDR(input);
        } else {
            input.value = '0.00';
        }
    });

    // Format Price per Unit columns
    const pricePerUnitInputs = document.querySelectorAll('.item-price');
    pricePerUnitInputs.forEach(input => {
        input.classList.add('currency-input-idr');
        input.addEventListener('input', function() {
            formatCurrencyInputIDR(this);
        });
        if (input.value) {
            formatCurrencyInputIDR(input);
        } else {
            input.value = '0.00';
        }
    });

    // Format Amount columns
    const amountInputs = document.querySelectorAll('.item-line-total');
    amountInputs.forEach(input => {
        input.classList.add('currency-input-idr');
        input.addEventListener('input', function() {
            formatCurrencyInputIDR(this);
        });
        if (input.value) {
            formatCurrencyInputIDR(input);
        } else {
            input.value = '0.00';
        }
    });

    // Format summary fields
    const summaryFields = ['PriceBefDi', 'VatSum', 'DocTotal'];
    summaryFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('currency-input-idr');
            field.addEventListener('input', function() {
                formatCurrencyInputIDR(this);
            });
            if (field.value) {
                formatCurrencyInputIDR(field);
            } else {
                field.value = '0.00';
            }
        }
    });
}

// Export functions for global access
window.receiveInvItem = receiveInvItem;
window.rejectInvItem = rejectInvItem;
window.printInvItem = printInvItem;
window.goToMenuReceiveInvItem = goToMenuReceiveInvItem;
window.saveInvoiceDataToStorage = saveInvoiceDataToStorage;
window.clearInvoiceDataFromStorage = clearInvoiceDataFromStorage; 