// Global variables
let currentInvItemData = null;
let currentUser = null;
let allUsers = []; // Store all users for kansaiEmployeeId lookup

// API Configuration
const API_BASE_URL = 'https://expressiv-be-sb.idsdev.site/api';

/*
 * REJECTION FEATURES IMPLEMENTED:
 * 
 * 1. Enhanced Rejection Dialog:
 *    - User prefix functionality (e.g., "[John Doe - Approver]: ")
 *    - Character count with color coding (red/yellow/gray)
 *    - Minimum character validation (10 characters)
 *    - Maximum character limit (500 characters)
 *    - Prefix protection (cannot be deleted)
 * 
 * 2. Rejection Remarks Display:
 *    - Conditional display based on rejection status
 *    - Enhanced styling with warning icon
 *    - Animation when remarks are shown
 *    - Monospace font for better readability
 * 
 * 3. Status Validation:
 *    - Only allows rejection for "Acknowledged" status
 *    - Clear error messages for invalid actions
 *    - Visual status indicators
 * 
 * 4. Enhanced UI/UX:
 *    - Gradient rejection button styling
 *    - Hover effects and animations
 *    - Responsive design for mobile devices
 *    - Accessibility improvements
 * 
 * 5. Data Persistence:
 *    - Rejection remarks saved to API
 *    - User information tracked (rejectedBy, rejectedByName)
 *    - Timestamp recording (rejectedDate)
 * 
 * 6. Error Handling:
 *    - Comprehensive validation
 *    - User-friendly error messages
 *    - Network error handling
 *    - Graceful fallbacks
 */

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

// Function to get current user role
function getCurrentUserRole() {
    if (!currentUser) {
        return 'User';
    }
    
    // Check if user has role information
    if (currentUser.role) {
        return currentUser.role;
    }
    
    // Default role based on context
    return 'Approver';
}

// Function to initialize textarea with user prefix for rejection
function initializeWithRejectionPrefix(textarea) {
    const userInfo = getCurrentUserFullName() || 'Unknown User';
    const role = getCurrentUserRole();
    const prefix = `[${userInfo} - ${role}]: `;
    textarea.value = prefix;
    
    // Store the prefix length as a data attribute
    textarea.dataset.prefixLength = prefix.length;
    
    // Set selection range after the prefix
    textarea.setSelectionRange(prefix.length, prefix.length);
    textarea.focus();
}

// Function to handle input and protect the prefix for rejection
function handleRejectionInput(event) {
    const textarea = event.target;
    const prefixLength = parseInt(textarea.dataset.prefixLength || '0');
    
    // Get the expected prefix
    const userInfo = getCurrentUserFullName() || 'Unknown User';
    const role = getCurrentUserRole();
    const expectedPrefix = `[${userInfo} - ${role}]: `;
    
    // Check if the prefix is still intact
    const currentValue = textarea.value;
    if (!currentValue.startsWith(expectedPrefix)) {
        // Restore the prefix
        const contentAfterPrefix = currentValue.substring(prefixLength);
        textarea.value = expectedPrefix + contentAfterPrefix;
        textarea.setSelectionRange(expectedPrefix.length, expectedPrefix.length);
    }
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
            
            // Load attachments
            await loadAttachments(stagingId);
            
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
    if (!currentInvItemData) {
        console.log('No current invoice data available for button visibility update');
        return;
    }
    
    const status = getStatusFromInvoice(currentInvItemData);
    const actionButtonsContainer = document.getElementById('actionButtonsContainer');
    const approveButton = document.getElementById('approveButton');
    const rejectButton = document.getElementById('rejectButton');
    const printButton = document.getElementById('printButton');
    
    console.log('Current document status:', status);
    console.log('Available buttons:', {
        actionButtonsContainer: !!actionButtonsContainer,
        approveButton: !!approveButton,
        rejectButton: !!rejectButton,
        printButton: !!printButton
    });
    
    // Show the action buttons container
    if (actionButtonsContainer) {
        actionButtonsContainer.style.display = 'flex';
        console.log('Action buttons container displayed');
    }
    
    // Hide all buttons first
    if (approveButton) approveButton.style.display = 'none';
    if (rejectButton) rejectButton.style.display = 'none';
    if (printButton) printButton.style.display = 'none';
    console.log('All buttons hidden initially');
    
    // Show buttons based on status
    if (status === 'Approved' || status === 'Received') {
        // For approved/received documents, only show print button
        if (printButton) {
            printButton.style.display = 'inline-block';
            console.log('Print button shown for approved/received document (status:', status, ')');
        } else {
            console.warn('Print button not found in DOM');
        }
        console.log('Approve and Reject buttons hidden for approved/received document');
    } else if (status === 'Rejected') {
        // For rejected documents, show print button and reject button (for re-rejection)
        if (printButton) {
            printButton.style.display = 'inline-block';
            console.log('Print button shown for rejected document (status:', status, ')');
        }
        if (rejectButton) {
            rejectButton.style.display = 'inline-block';
            console.log('Reject button shown for rejected document (status:', status, ')');
        }
        console.log('Approve button hidden for rejected document');
    } else if (status === 'Acknowledged') {
        // For acknowledged status, show both approve and reject buttons, hide print button
        if (approveButton) {
            approveButton.style.display = 'inline-block';
            console.log('Approve button shown for acknowledged document (status:', status, ')');
        } else {
            console.warn('Approve button not found in DOM');
        }
        if (rejectButton) {
            rejectButton.style.display = 'inline-block';
            console.log('Reject button shown for acknowledged document (status:', status, ')');
        } else {
            console.warn('Reject button not found in DOM');
        }
        console.log('Print button hidden for acknowledged document');
    } else {
        // For other statuses (Draft, Prepared, Checked), show only approve button, hide reject and print buttons
        if (approveButton) {
            approveButton.style.display = 'inline-block';
            console.log('Approve button shown for non-acknowledged document (status:', status, ')');
        } else {
            console.warn('Approve button not found in DOM');
        }
        if (rejectButton) {
            rejectButton.style.display = 'none';
            console.log('Reject button hidden for non-acknowledged document (status:', status, ')');
        }
        console.log('Reject and Print buttons hidden for non-acknowledged document');
    }
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
    
    // Populate summary fields with currency formatting
    const docCur = data.docCur || 'IDR';
    
    // Total Amount (totalAmount) - from docCur and netPrice fields
    const totalAmount = data.netPrice || 0;
    safeSetValue('docTotal', formatCurrencyIDR(totalAmount));
    
    // Discounted Amount (discountAmount) - from docCur and discSum fields
    const discountAmount = data.discSum || 0;
    safeSetValue('discSum', formatCurrencyIDR(discountAmount));
    
    // Sales Amount (salesAmount) - from docCur and netPriceAfterDiscount fields
    const salesAmount = data.netPriceAfterDiscount || 0;
    safeSetValue('netPriceAfterDiscount', formatCurrencyIDR(salesAmount));
    
    console.log('Summary fields populated:', {
        docCur: data.docCur,
        netPrice: data.netPrice,
        discSum: data.discSum,
        netPriceAfterDiscount: data.netPriceAfterDiscount,
        docTax: data.docTax,
        vatSum: data.vatSum,
        grandTotal: data.grandTotal,
        note: 'Using specific API fields with currency'
    });
    
            // Tax Base Other Value (taxBase) - from dpp1112 field
        const taxBase = data.dpp1112 || 0;
        safeSetValue('dpp1112', formatCurrencyIDR(taxBase));
    
    // VAT 12% (vatAmount) - from docCur and vatSum fields
    const vatAmount = data.vatSum || 0;
    safeSetValue('vatSum', formatCurrencyIDR(vatAmount));
    
    // GRAND TOTAL (grandTotal) - from docCur and grandTotal fields
    const grandTotal = data.grandTotal || 0;
    safeSetValue('grandTotal', formatCurrencyIDR(grandTotal));
    
    // Populate comments
    safeSetValue('comments', data.comments || '');
    
    // Populate approval info from approval summary
    if (data.arInvoiceApprovalSummary) {
        console.log('Approval summary data:', data.arInvoiceApprovalSummary);
        
        safeSetValue('preparedByName', data.arInvoiceApprovalSummary.preparedByName || '');
        safeSetValue('acknowledgeByName', data.arInvoiceApprovalSummary.acknowledgedByName || '');
        safeSetValue('checkedByName', data.arInvoiceApprovalSummary.checkedByName || '');
        safeSetValue('approvedByName', data.arInvoiceApprovalSummary.approvedByName || '');
        safeSetValue('receivedByName', data.arInvoiceApprovalSummary.receivedByName || '');
    }
    
    // Handle rejection remarks display
    handleRejectionRemarksDisplay(data);
    
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
            <input type="number" class="line-num-input no-input p-2 border rounded bg-gray-100" value="${index + 1}" disabled autocomplete="off" />
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

    // Check if user has permission to reject
    if (!currentUser) {
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'Please login to continue'
        });
        return;
    }

    // Check if document status allows rejection
    const status = getStatusFromInvoice(currentInvItemData);
    if (status !== 'Acknowledged') {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Action',
            text: `Cannot reject document with status: ${status}. Only documents with status "Acknowledged" can be rejected.`
        });
        return;
    }

    Swal.fire({
        title: 'Reject Invoice Item',
        html: `
            <div class="text-left">
                <p class="mb-4 text-gray-600">Please provide a reason for rejecting this invoice item:</p>
                <div id="rejectionFieldsContainer">
                    <textarea id="rejectionRemarksInput" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                        placeholder="Enter detailed rejection reason..." 
                        rows="4" 
                        maxlength="500"></textarea>
                </div>
                <div class="mt-2 text-sm text-gray-500">
                    <span id="charCount">0</span>/500 characters
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        focusConfirm: false,
        width: '600px',
        preConfirm: () => {
            const textarea = document.getElementById('rejectionRemarksInput');
            const remarks = textarea ? textarea.value.trim() : '';
            
            // Check if there's content beyond the prefix
            const prefixLength = parseInt(textarea?.dataset.prefixLength || '0');
            const contentAfterPrefix = remarks.substring(prefixLength).trim();
            
            if (!contentAfterPrefix) {
                Swal.showValidationMessage('Please enter rejection remarks');
                return false;
            }
            
            if (contentAfterPrefix.length < 10) {
                Swal.showValidationMessage('Rejection remarks must be at least 10 characters long');
                return false;
            }
            
            return remarks;
        },
        didOpen: () => {
            const textarea = document.getElementById('rejectionRemarksInput');
            const charCount = document.getElementById('charCount');
            
            if (textarea && charCount) {
                // Initialize with user prefix
                initializeWithRejectionPrefix(textarea);
                
                textarea.addEventListener('input', function() {
                    // Handle prefix protection
                    handleRejectionInput({ target: this });
                    
                    // Update character count
                    const contentAfterPrefix = this.value.substring(parseInt(this.dataset.prefixLength || '0'));
                    charCount.textContent = contentAfterPrefix.length;
                    
                    if (contentAfterPrefix.length > 450) {
                        charCount.className = 'text-red-500';
                    } else if (contentAfterPrefix.length > 400) {
                        charCount.className = 'text-yellow-500';
                    } else {
                        charCount.className = 'text-gray-500';
                    }
                });
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Show confirmation dialog
            Swal.fire({
                title: 'Confirm Rejection',
                text: 'Are you sure you want to reject this invoice item? This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, Reject',
                cancelButtonText: 'Cancel'
            }).then((confirmResult) => {
                if (confirmResult.isConfirmed) {
                    // Update status to Rejected with remarks
                    updateInvItemStatus('Rejected', result.value);
                }
            });
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
            
            // Add rejectedBy information
            payload.rejectedBy = getCurrentUserKansaiEmployeeId();
            payload.rejectedByName = getCurrentUserFullName();
            console.log('Added rejectedBy information to payload:', {
                rejectedBy: payload.rejectedBy,
                rejectedByName: payload.rejectedByName
            });
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
    const textElements = document.querySelectorAll('.description-column textarea, .item-code-column input, .bp-catalog-column input, .quantity-column textarea, .price-column textarea, .packing-size-column textarea');
    
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

// Function to print invoice
function printInvoice() {
    if (!currentInvItemData) {
        Swal.fire({
            icon: 'error',
            title: 'No Data Available',
            text: 'Please load invoice data first before printing.'
        });
        return;
    }
    
    // Get the identifier (stagingID or docEntry)
    const identifier = currentInvItemData.stagingID || currentInvItemData.docEntry;
    
    if (!identifier) {
        Swal.fire({
            icon: 'error',
            title: 'Missing Identifier',
            text: 'Cannot print invoice: missing stagingID or docEntry.'
        });
        return;
    }
    
    // Save current invoice data to storage for the print page
    try {
        localStorage.setItem(`invoice_${identifier}`, JSON.stringify(currentInvItemData));
        sessionStorage.setItem(`invoice_${identifier}`, JSON.stringify(currentInvItemData));
        console.log('Invoice data saved to storage for printing:', identifier);
    } catch (error) {
        console.error('Error saving invoice data to storage:', error);
        Swal.fire({
            icon: 'error',
            title: 'Storage Error',
            text: 'Failed to save invoice data for printing.'
        });
        return;
    }
    
    // Open print page in new window/tab
    const printUrl = `printARInvItem.html?stagingID=${identifier}`;
    window.open(printUrl, '_blank');
    
    console.log('Opening print page with identifier:', identifier);
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
    const summaryFields = ['docTotal', 'discSum', 'netPriceAfterDiscount', 'dpp1112', 'vatSum', 'grandTotal'];
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

// Function to handle rejection remarks display
function handleRejectionRemarksDisplay(data) {
    const rejectionRemarksSection = document.getElementById('rejectionRemarksSection');
    const rejectionRemarksTextarea = document.getElementById('rejectionRemarks');
    const statusElement = document.getElementById('Status');
    
    if (!rejectionRemarksSection || !rejectionRemarksTextarea) {
        console.warn('Rejection remarks elements not found');
        return;
    }
    
    // Check for rejection remarks in approval summary
    let remarksToShow = null;
    
    if (data.arInvoiceApprovalSummary) {
        const summary = data.arInvoiceApprovalSummary;
        remarksToShow = summary.rejectionRemarks || summary.revisionRemarks;
    }
    
    if (remarksToShow && remarksToShow.trim() !== '' && remarksToShow !== null && remarksToShow !== undefined) {
        // Show rejection remarks
        rejectionRemarksTextarea.value = remarksToShow.trim();
        
        // Populate rejection information if available
        if (data.arInvoiceApprovalSummary) {
            const summary = data.arInvoiceApprovalSummary;
            
            // Rejected By
            const rejectedByElement = document.getElementById('rejectedByName');
            if (rejectedByElement) {
                rejectedByElement.value = summary.rejectedByName || '';
            }
            
            // Rejected Date
            const rejectedDateElement = document.getElementById('rejectedDate');
            if (rejectedDateElement && summary.rejectedDate) {
                const rejectedDate = new Date(summary.rejectedDate);
                if (!isNaN(rejectedDate.getTime())) {
                    rejectedDateElement.value = rejectedDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } else {
                    rejectedDateElement.value = summary.rejectedDate || '';
                }
            }
        }
        
        rejectionRemarksSection.style.display = 'block';
        
        // Add visual indicator for rejection status
        if (statusElement && statusElement.value === 'Rejected') {
            statusElement.classList.add('status-rejected');
        }
        
        // Add animation
        rejectionRemarksSection.classList.add('rejection-animation');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            rejectionRemarksSection.classList.remove('rejection-animation');
        }, 2000);
        
        console.log('Showing rejection remarks:', remarksToShow);
    } else {
        // Hide rejection remarks section
        rejectionRemarksSection.style.display = 'none';
        rejectionRemarksTextarea.value = '';
        
        // Remove rejection status styling
        if (statusElement) {
            statusElement.classList.remove('status-rejected');
        }
        
        console.log('Hiding rejection remarks section - no valid remarks found');
    }
}

// Load attachments from API
async function loadAttachments(stagingId) {
    try {
        console.log('Loading attachments for stagingId:', stagingId);
        
        // Construct API URL for attachments
        const apiUrl = `${API_BASE_URL}/ar-invoices/${stagingId}/attachments`;
        console.log('Attachments API URL:', apiUrl);
        
        // Fetch attachments from API
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'accept': '*/*'
            }
        });
        
        console.log('Attachments response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Attachments API response result:', result);
        
        if (result.status && result.data) {
            console.log('Attachments loaded from API:', result.data);
            displayAttachments(result.data);
        } else {
            throw new Error('Invalid response format from attachments API');
        }
        
    } catch (error) {
        console.error('Error loading attachments:', error);
        
        // Show no attachments message instead of error for better UX
        displayNoAttachments();
    }
}

// Display attachments in the container
function displayAttachments(attachments) {
    const attachmentsContainer = document.getElementById('attachmentsContainer');
    const noAttachmentsDiv = document.getElementById('noAttachments');
    
    if (!attachmentsContainer) {
        console.error('Attachments container not found');
        return;
    }
    
    // Clear loading content
    attachmentsContainer.innerHTML = '';
    
    if (!attachments || attachments.length === 0) {
        displayNoAttachments();
        return;
    }
    
    // Hide no attachments message
    if (noAttachmentsDiv) {
        noAttachmentsDiv.classList.add('hidden');
    }
    
    // Filter out invalid entries (like the "string" example)
    const validAttachments = attachments.filter(attachment => 
        attachment.fileName && 
        attachment.fileName !== 'string' && 
        attachment.fileName.trim() !== '' &&
        attachment.fileUrl && 
        attachment.fileUrl !== 'string' &&
        attachment.fileUrl.trim() !== '' &&
        attachment.id // Ensure attachment has a valid ID
    );
    
    if (validAttachments.length === 0) {
        displayNoAttachments();
        return;
    }
    
    // Create attachment list
    validAttachments.forEach((attachment, index) => {
        const attachmentItem = createAttachmentItem(attachment, index);
        attachmentsContainer.appendChild(attachmentItem);
    });
    
    console.log(`Displayed ${validAttachments.length} valid attachments`);
}

// Create individual attachment item
function createAttachmentItem(attachment, index) {
    const attachmentDiv = document.createElement('div');
    attachmentDiv.className = 'attachment-item border rounded-lg p-3 mb-2 bg-gray-50 hover:bg-gray-100 transition-colors';
    
    // Format file date if available
    const fileDate = formatAttachmentDate(attachment.createdAt);
    const fileName = attachment.fileName || 'Unknown file';
    const description = attachment.description || '';
    
    // Determine file type icon
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const fileIcon = getFileIcon(fileExtension);
    
    attachmentDiv.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3 flex-1">
                <div class="file-icon text-2xl">
                    ${fileIcon}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="file-name font-medium text-gray-900 truncate" title="${fileName}">
                        ${fileName}
                    </div>
                    <div class="file-info text-sm text-gray-500">
                        <span>Uploaded: ${fileDate}</span>
                        ${description ? `<span class="ml-2">• ${description}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button type="button" 
                        class="view-btn px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        onclick="viewAttachment('${attachment.stagingID}', '${attachment.fileUrl}', '${fileName.replace(/'/g, "\\'")}')"
                        title="View ${fileName}">
                    <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
                    </svg>
                    View
                </button>
            </div>
        </div>
    `;
    
    return attachmentDiv;
}

// Display no attachments message
function displayNoAttachments() {
    const attachmentsContainer = document.getElementById('attachmentsContainer');
    const noAttachmentsDiv = document.getElementById('noAttachments');
    
    if (attachmentsContainer) {
        attachmentsContainer.innerHTML = '';
    }
    
    if (noAttachmentsDiv) {
        noAttachmentsDiv.classList.remove('hidden');
    }
}

// Get file icon based on extension
function getFileIcon(extension) {
    switch (extension) {
        case 'pdf':
            return '📄';
        case 'doc':
        case 'docx':
            return '📝';
        case 'xls':
        case 'xlsx':
            return '📊';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return '🖼️';
        case 'zip':
        case 'rar':
            return '🗜️';
        default:
            return '📎';
    }
}

// Format attachment date
function formatAttachmentDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Unknown date';
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Unknown date';
    }
}

// View attachment in modal/new tab
function viewAttachment(stagingId, fileUrl, fileName) {
    try {
        console.log('Viewing attachment:', { stagingId, fileUrl, fileName });
        
        // Construct full view URL
        let viewUrl;
        if (fileUrl.startsWith('http')) {
            viewUrl = fileUrl;
        } else if (fileUrl.startsWith('/api')) {
            // Remove duplicate /api since API_BASE_URL already includes it
            const cleanFileUrl = fileUrl.replace('/api', '');
            viewUrl = `${API_BASE_URL}${cleanFileUrl}`;
        } else {
            viewUrl = `${API_BASE_URL}${fileUrl}`;
        }
        console.log('View URL:', viewUrl);
        
        // Determine file type
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        if (fileExtension === 'pdf') {
            // For PDF files, try to embed in iframe first, fallback to new tab
            showPDFViewer(viewUrl, fileName);
        } else {
            // For other file types, open in new tab with specific headers
            openInNewTab(viewUrl, fileName);
        }
        
    } catch (error) {
        console.error('Error viewing attachment:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'View Failed',
            text: `Failed to open ${fileName}. Please try again.`,
            confirmButtonText: 'OK'
        });
    }
}

// Show PDF in a modal viewer
async function showPDFViewer(pdfUrl, fileName) {
    try {
        // Show loading
        Swal.fire({
            title: 'Loading PDF...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Fetch the PDF as blob for viewing
        const response = await fetch(pdfUrl, {
            method: 'GET',
            headers: {
                'accept': 'application/pdf,*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Close loading and show PDF viewer
        Swal.fire({
            title: fileName,
            html: `
                <div style="width: 100%; height: 70vh; margin: 10px 0;">
                    <iframe 
                        src="${blobUrl}" 
                        style="width: 100%; height: 100%; border: none;"
                        type="application/pdf">
                        <p>Your browser doesn't support PDF viewing. 
                           <a href="${blobUrl}" target="_blank">Click here to open the PDF</a>
                        </p>
                    </iframe>
                </div>
            `,
            width: '90%',
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Close',
            customClass: {
                container: 'pdf-viewer-modal'
            },
            willClose: () => {
                // Clean up blob URL when modal closes
                URL.revokeObjectURL(blobUrl);
            }
        });

    } catch (error) {
        console.error('Error loading PDF for viewing:', error);
        
        // Fallback to Google Docs viewer
        Swal.fire({
            title: fileName,
            html: `
                <div style="width: 100%; height: 70vh; margin: 10px 0;">
                    <iframe 
                        src="https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true" 
                        style="width: 100%; height: 100%; border: none;"
                        allow="fullscreen">
                    </iframe>
                </div>
            `,
            width: '90%',
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Close'
        });
    }
}

// Open in new tab with proper handling
function openInNewTab(fileUrl, fileName) {
    // Show loading message
    const loadingToast = Swal.fire({
        title: 'Opening Document...',
        text: `Loading ${fileName}`,
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: true,
        toast: true,
        position: 'top-end'
    });
    
    // Create a temporary link to force view behavior
    const tempLink = document.createElement('a');
    tempLink.href = fileUrl;
    tempLink.target = '_blank';
    tempLink.rel = 'noopener noreferrer';
    
    // Add parameters to hint at viewing instead of downloading
    const viewUrl = `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}view=1&inline=1`;
    
    // Try to open in new tab
    const newWindow = window.open(viewUrl, '_blank', 'noopener,noreferrer');
    
    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        loadingToast.close();
        Swal.fire({
            icon: 'warning',
            title: 'Popup Blocked',
            html: `
                <p>Your browser blocked the popup. Please allow popups for this site or</p>
                <a href="${viewUrl}" target="_blank" class="text-blue-600 underline">click here to view the document manually</a>
            `,
            confirmButtonText: 'OK'
        });
    }
}

// Export functions for global access
window.approveInvItem = approveInvItem;
window.rejectInvItem = rejectInvItem;
window.goToMenuApproveInvItem = goToMenuApproveInvItem;
window.printInvoice = printInvoice; 