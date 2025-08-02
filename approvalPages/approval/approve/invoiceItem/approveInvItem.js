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
    
    if (currentUserData && currentUserData.fullName) {
        console.log('Found full name for current user:', currentUserData.fullName);
        return currentUserData.fullName;
    }
    
    console.warn('Full name not found for current user, falling back to username');
    return currentUser.username || 'Unknown User';
}

// Load invoice item data
function loadInvItemData() {
    const urlParams = new URLSearchParams(window.location.search);
    const stagingId = urlParams.get('stagingId');
    
    if (!stagingId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No staging ID provided'
        }).then(() => {
            goToMenuApproveInvItem();
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
            goToMenuApproveInvItem();
        });
    }
}

// Update button visibility based on document status
function updateButtonVisibility() {
    if (!currentInvItemData) return;
    
    const status = getStatusFromInvoice(currentInvItemData);
    const approveButton = document.querySelector('button[onclick="approveInvItem()"]');
    const rejectButton = document.querySelector('button[onclick="rejectInvItem()"]');
    
    console.log('Current document status:', status);
    
    // Always show buttons regardless of status
    if (approveButton) approveButton.style.display = 'inline-block';
    if (rejectButton) rejectButton.style.display = 'inline-block';
    console.log('Buttons always shown regardless of status');
}

// Populate invoice item data in the form
function populateInvItemData(data) {
    console.log('Populating invoice item data:', data);
    
    // Populate header fields
    document.getElementById('DocEntry').value = data.stagingID || '';
    document.getElementById('DocNum').value = data.docNum || '';
    document.getElementById('CardCode').value = data.cardCode || '';
    document.getElementById('CardName').value = data.cardName || '';
    document.getElementById('address').value = data.address || '';
    document.getElementById('NumAtCard').value = data.numAtCard || '';
    document.getElementById('DocCur').value = data.docCur || '';
    document.getElementById('docRate').value = data.docRate || '';
    document.getElementById('DocDate').value = formatDate(data.docDate);
    document.getElementById('DocDueDate').value = formatDate(data.docDueDate);
    document.getElementById('GroupNum').value = data.groupNum || '';
    document.getElementById('TrnspCode').value = data.trnspCode || '';
    document.getElementById('TaxNo').value = data.taxNo || '';
    document.getElementById('U_BSI_ShippingType').value = data.u_BSI_ShippingType || '';
    document.getElementById('U_BSI_PaymentGroup').value = data.u_BSI_PaymentGroup || '';
    document.getElementById('U_BSI_Expressiv_IsTransfered').value = data.u_BSI_Expressiv_IsTransfered || 'N';
    document.getElementById('U_BSI_UDF1').value = data.u_bsi_udf1 || '';
    document.getElementById('U_BSI_UDF2').value = data.u_bsi_udf2 || '';
    

    
    // Populate status from approval summary
    const status = getStatusFromInvoice(data);
    document.getElementById('Status').value = status;
    
    // Populate totals
    document.getElementById('PriceBefDi').value = data.docTotal - data.vatSum || 0;
    document.getElementById('VatSum').value = data.vatSum || 0;
    document.getElementById('DocTotal').value = data.docTotal || 0;
    
    // Populate comments
    document.getElementById('comments').value = data.comments || '';
    
    // Populate approval info from approval summary
    if (data.arInvoiceApprovalSummary) {
        console.log('Approval summary data:', data.arInvoiceApprovalSummary);
        
        document.getElementById('preparedBySearch').value = data.arInvoiceApprovalSummary.preparedByName || '';
        document.getElementById('acknowledgeBySearch').value = data.arInvoiceApprovalSummary.acknowledgedByName || '';
        document.getElementById('checkedBySearch').value = data.arInvoiceApprovalSummary.checkedByName || '';
        document.getElementById('approvedBySearch').value = data.arInvoiceApprovalSummary.approvedByName || '';
        document.getElementById('receivedBySearch').value = data.arInvoiceApprovalSummary.receivedByName || '';
        
        // Show rejection remarks if exists and has valid value
        const revisionRemarks = data.arInvoiceApprovalSummary.revisionRemarks;
        const rejectionRemarks = data.arInvoiceApprovalSummary.rejectionRemarks;
        
        // Check both revisionRemarks and rejectionRemarks fields
        const remarksToShow = revisionRemarks || rejectionRemarks;
        
        if (remarksToShow && remarksToShow.trim() !== '' && remarksToShow !== null && remarksToShow !== undefined) {
            document.getElementById('rejectionRemarks').value = remarksToShow;
            document.getElementById('rejectionRemarksSection').style.display = 'block';
            console.log('Showing rejection remarks:', remarksToShow);
        } else {
            document.getElementById('rejectionRemarksSection').style.display = 'none';
            console.log('Hiding rejection remarks section - no valid remarks found');
        }
    }
    
    // Populate items table
    populateItemsTable(data.arInvoiceDetails || []);
    
    // Apply text wrapping
    refreshTextWrapping();
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
    tableBody.innerHTML = '';
    
    if (items.length === 0) {
        // Add empty row message
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="15" class="p-4 text-center text-gray-500">
                No invoice details found
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    items.forEach((item, index) => {
        const row = createItemRow(item, index);
        tableBody.appendChild(row);
    });
}

// Create item row
function createItemRow(item, index) {
    const row = document.createElement('tr');
    row.className = 'border-b';
    
    row.innerHTML = `
        <td class="p-2 border no-column">
            <input type="number" class="line-num-input no-input p-2 border rounded bg-gray-100" value="${item.lineNum || index + 1}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border item-code-column">
            <input type="text" class="item-code-input p-2 border rounded bg-gray-100" value="${item.itemCode || ''}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border description-column">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off">${item.dscription || ''}</textarea>
        </td>
        <td class="p-2 border description-column">
            <textarea class="w-full item-free-txt bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" style="height: 40px; vertical-align: top;" disabled autocomplete="off">${item.text || ''}</textarea>
        </td>
        <td class="p-2 border sales-employee-column">
            <textarea class="w-full item-sales-employee bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off">${item.unitMsr || ''}</textarea>
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
        <td class="p-2 border discount-column">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="8" disabled autocomplete="off" value="${item.discount || ''}" />
        </td>
        <td class="p-2 border tax-code-column">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="8" disabled autocomplete="off" value="${item.vatgroup || ''}" />
        </td>
        <td class="p-2 border wtax-liable-column">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="8" disabled autocomplete="off" value="${item.wtaxLiable || ''}" />
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

// Approve invoice item
function approveInvItem() {
    if (!currentInvItemData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice item data available'
        });
        return;
    }

    Swal.fire({
        title: 'Confirm Approval',
        text: 'Are you sure you want to approve this invoice item?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Update status to Approved
            updateInvItemStatus('Approved');
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

        const now = new Date().toISOString();
        
        // Prepare payload for PATCH API - preserve existing approval data
        const payload = {
            approvalStatus: status,
            approvedBy: getCurrentUserKansaiEmployeeId(),
            approvedByName: getCurrentUserFullName(),
            updatedAt: now
        };

        // Handle status-specific fields
        if (status === 'Approved') {
            // Add approvedDate when status is "Approved"
            payload.approvedDate = now;
            console.log('Added approvedDate to payload:', now);
        } else if (status === 'Rejected') {
            // Add rejectedDate when status is "Rejected"
            payload.rejectedDate = now;
            console.log('Added rejectedDate to payload:', now);
            
            // Add rejection remarks if provided
            if (remarks && remarks.trim() !== '') {
                payload.rejectionRemarks = remarks.trim();
                console.log('Added rejectionRemarks to payload:', remarks.trim());
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
            
            if (existingSummary.receivedBy) payload.receivedBy = existingSummary.receivedBy;
            if (existingSummary.receivedByName) payload.receivedByName = existingSummary.receivedByName;
            if (existingSummary.receivedDate) payload.receivedDate = existingSummary.receivedDate;
            
            // Preserve existing rejection remarks if any (but don't override new ones)
            if (existingSummary.rejectionRemarks && !payload.rejectionRemarks) {
                payload.rejectionRemarks = existingSummary.rejectionRemarks;
            }
            if (existingSummary.revisionRemarks) payload.revisionRemarks = existingSummary.revisionRemarks;
        }

        console.log('Updating invoice item status with payload:', payload);
        console.log('API URL:', `${API_BASE_URL}/ar-invoices/approval/${stagingID}`);

        // Make PATCH API call
        const response = await fetch(`${API_BASE_URL}/ar-invoices/approval/${stagingID}`, {
            method: 'PATCH',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error response:', errorText);
            
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
        console.log('API Response:', result);

        // Show success message with confirmation
        const actionText = status === 'Approved' ? 'approved' : 'rejected';
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `Invoice item has been ${actionText} successfully. Do you want to return to the menu?`,
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
                goToMenuApproveInvItem();
            }
        });

    } catch (error) {
        console.error('Error updating invoice item status:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: error.message || 'Failed to update invoice item status. Please try again.',
            confirmButtonText: 'OK'
        });
    }
}

// Navigation function
function goToMenuApproveInvItem() {
    // Navigate to the invoice item approve menu
    window.location.href = '../../../dashboard/dashboardApprove/ARInvoice/menuARItemApprove.html';
}

// Function to refresh text wrapping for all elements
function refreshTextWrapping() {
    setTimeout(() => {
        applyTextWrappingToAll();
    }, 50);
}

// Function to apply text wrapping to all relevant elements
function applyTextWrappingToAll() {
    const textElements = document.querySelectorAll('.description-column textarea, .item-code-column input, .quantity-column textarea, .price-column textarea, .sales-employee-column textarea');
    
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

// Export functions for global access
window.approveInvItem = approveInvItem;
window.rejectInvItem = rejectInvItem;
window.goToMenuApproveInvItem = goToMenuApproveInvItem; 