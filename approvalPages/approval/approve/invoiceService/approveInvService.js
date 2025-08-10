// Global variables
let currentInvServiceData = null;
let currentUser = null;
let allUsers = []; // Store all users for kansaiEmployeeId lookup

// API Configuration - Using BASE_URL from auth.js
const API_BASE_URL = `${BASE_URL}/api`;

// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
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

    // Load invoice service data from URL parameters
    loadInvServiceData();

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

// Load invoice service data
function loadInvServiceData() {
    const urlParams = new URLSearchParams(window.location.search);
    const stagingId = urlParams.get('stagingId');

    if (!stagingId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No staging ID provided'
        }).then(() => {
            goToMenuApproveInvService();
        });
        return;
    }

    // Load data from API
    loadInvServiceFromAPI(stagingId);
}

// Load invoice service data from API
async function loadInvServiceFromAPI(stagingId) {
    try {
        console.log('Loading invoice service data for stagingId:', stagingId);

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
            currentInvServiceData = result.data;
            console.log('Invoice service data loaded from API:', currentInvServiceData);

            // Populate form with data
            populateInvServiceData(currentInvServiceData);

            // Update button visibility based on status
            updateButtonVisibility();

            // Close loading indicator
            Swal.close();
        } else {
            throw new Error('Invalid response format from API');
        }

    } catch (error) {
        console.error('Error loading invoice service data:', error);

        let errorMessage = 'Failed to load invoice service data';

        if (error.message.includes('404')) {
            errorMessage = 'Invoice service not found. Please check the staging ID.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network error. Please check your connection.';
        } else {
            errorMessage = `Failed to load invoice service data: ${error.message}`;
        }

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage
        }).then(() => {
            goToMenuApproveInvService();
        });
    }
}

// Update button visibility based on document status
function updateButtonVisibility() {
    if (!currentInvServiceData) return;

    const status = getStatusFromInvoice(currentInvServiceData);
    const approveButton = document.querySelector('button[onclick="approveInvService()"]');
    const rejectButton = document.querySelector('button[onclick="rejectInvService()"]');

    console.log('Current document status:', status);

    // Always show buttons regardless of status
    if (approveButton) approveButton.style.display = 'inline-block';
    if (rejectButton) rejectButton.style.display = 'inline-block';
    console.log('Buttons always shown regardless of status');
}

// Populate invoice service data in the form
function populateInvServiceData(data) {
    console.log('Populating invoice service data:', data);

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
    document.getElementById('TaxNo').value = data.licTradNum || '';
    document.getElementById('U_BSI_ShippingType').value = data.u_BSI_ShippingType || '';
    document.getElementById('U_BSI_PaymentGroup').value = data.u_BSI_PaymentGroup || '';
    document.getElementById('U_BSI_Expressiv_IsTransfered').value = data.u_BSI_Expressiv_IsTransfered || 'N';
    document.getElementById('U_BSI_UDF1').value = data.u_bsi_udf1 || '';
    document.getElementById('U_BSI_UDF2').value = data.u_bsi_udf2 || '';
    document.getElementById('account').value = data.account || '';
    document.getElementById('acctName').value = data.acctName || '';

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

        // Populate approval fields
        populateApprovalFields(data.arInvoiceApprovalSummary);

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

    // Populate services table using arInvoiceDetails
    populateServicesTable(data.arInvoiceDetails || []);

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

// Function to populate approval fields
function populateApprovalFields(approvalSummary) {
    if (!approvalSummary) return;

    // Populate prepared by
    if (approvalSummary.preparedByName) {
        document.getElementById('preparedBySearch').value = approvalSummary.preparedByName;
        document.getElementById('preparedBy').value = approvalSummary.preparedById || '';
    }

    // Populate acknowledged by
    if (approvalSummary.acknowledgedByName) {
        document.getElementById('acknowledgeBySearch').value = approvalSummary.acknowledgedByName;
        document.getElementById('acknowledgeBy').value = approvalSummary.acknowledgedById || '';
    }

    // Populate checked by
    if (approvalSummary.checkedByName) {
        document.getElementById('checkedBySearch').value = approvalSummary.checkedByName;
        document.getElementById('checkedBy').value = approvalSummary.checkedById || '';
    }

    // Populate approved by
    if (approvalSummary.approvedByName) {
        document.getElementById('approvedBySearch').value = approvalSummary.approvedByName;
        document.getElementById('approvedBy').value = approvalSummary.approvedById || '';
    }

    // Populate received by
    if (approvalSummary.receivedByName) {
        document.getElementById('receivedBySearch').value = approvalSummary.receivedByName;
        document.getElementById('receivedBy').value = approvalSummary.receivedById || '';
    }
}

// Populate services table
function populateServicesTable(services) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    if (!services || services.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = '<td colspan="8" class="text-center text-gray-500 py-4">No service items found</td>';
        tableBody.appendChild(noDataRow);
        return;
    }

    services.forEach((service, index) => {
        const row = createServiceRow(service, index);
        tableBody.appendChild(row);
    });
}

// Create service row
function createServiceRow(service, index) {
    const row = document.createElement('tr');
    row.className = 'border-b hover:bg-gray-50';

    row.innerHTML = `
        <td class="p-2 no-column">
            <input type="text" value="${service.lineNum || index + 1}" class="no-input bg-gray-100" readonly>
        </td>
        <td class="p-2 description-column">
            <textarea value="${service.dscription || ''}" class="w-full bg-gray-100" readonly>${service.dscription || ''}</textarea>
        </td>
        <td class="p-2 account-code-column">
            <input type="text" value="${service.acctCode || ''}" class="account-code-input bg-gray-100" readonly>
        </td>
        <td class="p-2 account-name-column">
            <input type="text" value="-" class="account-name-input bg-gray-100" readonly>
        </td>
        <td class="p-2 tax-code-column">
            <input type="text" value="${service.vatgroup || ''}" class="tax-code-input bg-gray-100" readonly>
        </td>
        <td class="p-2 wtax-liable-column">
            <input type="text" value="${service.wtLiable || ''}" class="wtax-liable-input bg-gray-100" readonly>
        </td>
        <td class="p-2 total-lc-column">
            <input type="text" value="${formatCurrency(service.lineTotal || 0)}" class="total-lc-input bg-gray-100" readonly>
        </td>
        <td class="p-2 source-column">
            <input type="text" value="-" class="source-input bg-gray-100" readonly>
        </td>
    `;

    return row;
}

// Setup event listeners
function setupEventListeners() {
    // Add any additional event listeners here
}

// Approve invoice service
function approveInvService() {
    if (!currentInvServiceData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice service data available'
        });
        return;
    }

    Swal.fire({
        title: 'Confirm Approval',
        text: 'Are you sure you want to approve this invoice service?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Update status to Approved
            updateInvServiceStatus('Approved');
        }
    });
}

// Reject invoice service
function rejectInvService() {
    if (!currentInvServiceData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice service data available'
        });
        return;
    }

    Swal.fire({
        title: 'Reject Invoice Service',
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
            updateInvServiceStatus('Rejected', result.value);
        }
    });
}

// Update invoice service status using PATCH API
async function updateInvServiceStatus(status, remarks = '') {
    if (!currentInvServiceData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice service data available'
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
        const stagingID = currentInvServiceData.stagingID;
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
        if (currentInvServiceData.arInvoiceApprovalSummary) {
            const existingSummary = currentInvServiceData.arInvoiceApprovalSummary;

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

        console.log('Updating invoice service status with payload:', payload);
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
            text: `Invoice service has been ${actionText} successfully. Do you want to return to the menu?`,
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
                goToMenuApproveInvService();
            }
        });

    } catch (error) {
        console.error('Error updating invoice service status:', error);

        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: error.message || 'Failed to update invoice service status. Please try again.',
            confirmButtonText: 'OK'
        });
    }
}

// Navigation function
function goToMenuApproveInvService() {
    // Navigate to the invoice service approve menu
    window.location.href = '../../../dashboard/dashboardApprove/ARInvoice/menuARServiceApprove.html';
}

// Function to refresh text wrapping for all elements
function refreshTextWrapping() {
    setTimeout(() => {
        applyTextWrappingToAll();
    }, 50);
}

// Function to apply text wrapping to all relevant elements
function applyTextWrappingToAll() {
    const textElements = document.querySelectorAll('.description-column textarea, .account-code-column input, .account-name-column input, .total-lc-column input');

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

// Function to format currency
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0.00';
    return parseFloat(amount).toFixed(2);
}

// Export functions for global access
window.approveInvService = approveInvService;
window.rejectInvService = rejectInvService;
window.goToMenuApproveInvService = goToMenuApproveInvService;
