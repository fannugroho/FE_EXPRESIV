// Global variables
let currentInvServiceData = null;
let currentUser = null;
let allUsers = []; // Store all users for kansaiEmployeeId lookup
let uploadedFiles = [];

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

    // Initialize button visibility (hide by default)
    updateButtonVisibility();
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
        console.log('Found full name for current user:', currentUserData.name);
        return currentUserData.name;
    }

    console.warn('Full name not found for current user, falling back to username');
    return currentUser.username || 'Unknown User';
}

// Function to load invoice service data from URL parameters
function loadInvServiceData() {
    const urlParams = new URLSearchParams(window.location.search);
    const stagingId = urlParams.get('stagingId') || urlParams.get('staging-id') || urlParams.get('invoice-id');

    console.log('URL search params:', window.location.search);
    console.log('All URL params:', Object.fromEntries(urlParams.entries()));
    console.log('Staging ID from URL:', stagingId);

    if (stagingId) {
        console.log('Loading invoice service data for staging ID:', stagingId);
        loadInvServiceFromAPI(stagingId);
    } else {
        console.error('No staging ID provided in URL parameters');
        Swal.fire({
            icon: 'error',
            title: 'Missing Data',
            text: 'No invoice service ID provided. Please return to the menu and select a valid invoice service.'
        }).then(() => {
            goToMenuAcknowInvService();
        });
    }
}

// Function to load invoice service data from API
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
            populateInvServiceData(result.data);

            // Always fetch dropdown options
            fetchDropdownOptions(result.data);

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
            goToMenuAcknowInvService();
        });
    }
}

// Function to update button visibility based on current status
function updateButtonVisibility() {
    if (!currentInvServiceData) return;

    const status = getStatusFromInvoice(currentInvServiceData);
    const acknowledgeButton = document.getElementById('acknowledgeButton');
    const rejectButton = document.getElementById('rejectButton');

    console.log('Current status:', status);
    console.log('Button visibility check for status:', status);

    // Hide buttons if status is already acknowledged or rejected
    if (status === 'Acknowledged' || status === 'Rejected') {
        acknowledgeButton.style.display = 'none';
        rejectButton.style.display = 'none';
        console.log('Hiding buttons - status is:', status);
    } else {
        acknowledgeButton.style.display = 'inline-block';
        rejectButton.style.display = 'inline-block';
        console.log('Showing buttons - status is:', status);
    }
}

// Function to populate invoice service data
function populateInvServiceData(data) {
    console.log('Populating invoice service data:', data);

    // Populate header fields with correct API field mapping
    document.getElementById('DocEntry').value = data.stagingID || '';
    document.getElementById('DocNum').value = data.docNum || '';
    document.getElementById('CardCode').value = data.cardCode || '';
    document.getElementById('CardName').value = data.cardName || '';
    document.getElementById('address').value = data.address || '';
    document.getElementById('NumAtCard').value = data.u_bsi_invnum || '';
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

    // Total Amount (totalAmount) - from docCur and netPrice fields
    const totalAmount = data.netPrice || 0;
    document.getElementById('docTotal').value = formatCurrencyIDR(totalAmount);

    // Discounted Amount (discountAmount) - from docCur and discSum fields
    const discountAmount = data.discSum || 0;
    document.getElementById('discSum').value = formatCurrencyIDR(discountAmount);

    // Sales Amount (salesAmount) - from docCur and netPriceAfterDiscount fields
    const salesAmount = data.netPriceAfterDiscount || 0;
    document.getElementById('netPriceAfterDiscount').value = formatCurrencyIDR(salesAmount);

    // Tax Base Other Value (taxBase) - from docCur and docTax fields
    const taxBase = data.docTax || 0;
    document.getElementById('dpp1112').value = formatCurrencyIDR(taxBase);

    // VAT 12% (vatAmount) - from docCur and vatSum fields
    const vatAmount = data.vatSum || 0;
    document.getElementById('vatSum').value = formatCurrencyIDR(vatAmount);

    // GRAND TOTAL (grandTotal) - from docCur and grandTotal fields
    const grandTotal = data.grandTotal || 0;
    document.getElementById('grandTotal').value = formatCurrencyIDR(grandTotal);

    // Populate comments
    document.getElementById('comments').value = data.comments || '';

    // Populate services table using arInvoiceDetails
    populateServicesTable(data.arInvoiceDetails || []);

    // Populate approval fields
    populateApprovalFields(data.arInvoiceApprovalSummary);

    // Display existing attachments
    displayExistingAttachments(data.arInvoiceAttachments || []);

    // Update button visibility
    updateButtonVisibility();

    // Apply text wrapping
    setTimeout(() => {
        applyTextWrappingToAll();
    }, 100);
}

// Function to display existing attachments
function displayExistingAttachments(attachments) {
    const fileList = document.getElementById('fileList');

    if (!attachments || attachments.length === 0) {
        // Show message if no attachments
        const noAttachmentsMsg = document.createElement('div');
        noAttachmentsMsg.className = 'text-sm text-gray-500 mt-2';
        noAttachmentsMsg.textContent = 'No existing attachments found.';
        fileList.appendChild(noAttachmentsMsg);
        return;
    }

    // Clear existing content
    fileList.innerHTML = '';

    // Add existing attachments section
    const existingSection = document.createElement('div');
    existingSection.className = 'mb-4';
    existingSection.innerHTML = '<h4 class="font-semibold text-gray-700 mb-2">Existing Attachments:</h4>';
    fileList.appendChild(existingSection);

    attachments.forEach((attachment, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        fileItem.innerHTML = `
            <div class="file-item-header">
                <div class="file-item-name">${attachment.fileName}</div>
                <div class="file-item-actions">
                    <button type="button" class="btn-view" onclick="viewExistingPDF('${attachment.fileUrl}')">View</button>
                </div>
            </div>
        `;

        fileList.appendChild(fileItem);
    });
}

// Function to view existing PDF
function viewExistingPDF(fileUrl) {
    if (fileUrl) {
        // Construct full URL if it's a relative path
        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${API_BASE_URL}${fileUrl}`;
        window.open(fullUrl, '_blank');
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

// Function to format date
function formatDate(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
}

// Function to populate approval fields
function populateApprovalFields(approvalSummary) {
    if (!approvalSummary) return;

    // Populate prepared by
    if (approvalSummary.preparedByName) {
        document.getElementById('preparedByName').value = approvalSummary.preparedByName;
        document.getElementById('preparedBy').value = approvalSummary.preparedById || '';
    }

    // Populate acknowledged by
    if (approvalSummary.acknowledgedByName) {
        document.getElementById('acknowledgeByName').value = approvalSummary.acknowledgedByName;
        document.getElementById('acknowledgeBy').value = approvalSummary.acknowledgedById || '';
    }

    // Populate checked by
    if (approvalSummary.checkedByName) {
        document.getElementById('checkedByName').value = approvalSummary.checkedByName;
        document.getElementById('checkedBy').value = approvalSummary.checkedById || '';
    }

    // Populate approved by
    if (approvalSummary.approvedByName) {
        document.getElementById('approvedByName').value = approvalSummary.approvedByName;
        document.getElementById('approvedBy').value = approvalSummary.approvedById || '';
    }

    // Populate received by
    if (approvalSummary.receivedByName) {
        document.getElementById('receivedByName').value = approvalSummary.receivedByName;
        document.getElementById('receivedBy').value = approvalSummary.receivedById || '';
    }
}

// Function to populate services table
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

// Function to create service row
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

// Function to setup event listeners
function setupEventListeners() {
    // Setup user search dropdowns
    setupUserSearchDropdowns();
}

// Function to setup user search dropdowns
function setupUserSearchDropdowns() {
    const userFields = ['acknowledgeBy', 'checkedBy', 'approvedBy', 'receivedBy'];

    userFields.forEach(fieldName => {
        const input = document.getElementById(`${fieldName}Name`);
        const dropdown = document.getElementById(`${fieldName}SelectDropdown`);
        const select = document.getElementById(fieldName);

        if (input && dropdown && select) {
            // Setup search functionality
            input.addEventListener('input', function () {
                const searchTerm = this.value.toLowerCase();
                const options = Array.from(select.options).slice(1); // Skip first option

                dropdown.innerHTML = '';

                if (searchTerm.length > 0) {
                    const filteredOptions = options.filter(option =>
                        option.text.toLowerCase().includes(searchTerm)
                    );

                    filteredOptions.forEach(option => {
                        const div = document.createElement('div');
                        div.className = 'dropdown-item';
                        div.textContent = option.text;
                        div.onclick = () => {
                            input.value = option.text;
                            select.value = option.value;
                            dropdown.classList.add('hidden');
                        };
                        dropdown.appendChild(div);
                    });

                    if (filteredOptions.length > 0) {
                        dropdown.classList.remove('hidden');
                    } else {
                        dropdown.classList.add('hidden');
                    }
                } else {
                    dropdown.classList.add('hidden');
                }
            });

            // Hide dropdown when clicking outside
            document.addEventListener('click', function (e) {
                if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            });
        }
    });
}

// Function to fetch dropdown options
async function fetchDropdownOptions(invServiceData = null) {
    try {
        // Fetch users for dropdowns
        const usersResponse = await fetch(`${API_BASE_URL}/users`);
        if (usersResponse.ok) {
            const usersResult = await usersResponse.json();
            if (usersResult.data) {
                populateUserSelects(usersResult.data, invServiceData);
            }
        }
    } catch (error) {
        console.error('Error fetching dropdown options:', error);
    }
}

// Function to populate user selects
function populateUserSelects(users, invServiceData = null) {
    const userFields = ['preparedBy', 'acknowledgeBy', 'checkedBy', 'approvedBy', 'receivedBy'];

    userFields.forEach(fieldName => {
        const select = document.getElementById(fieldName);
        const input = document.getElementById(`${fieldName}Name`);

        if (select && input) {
            // Clear existing options except the first one
            while (select.options.length > 1) {
                select.remove(1);
            }

            // Add user options
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name || user.username;
                select.appendChild(option);
            });

            // Set current user for acknowledge field if not already set
            if (fieldName === 'acknowledgeBy' && !input.value) {
                const currentUserFullName = getCurrentUserFullName();
                input.value = currentUserFullName;

                // Find and set the corresponding select value
                const currentUserOption = Array.from(select.options).find(option =>
                    option.textContent === currentUserFullName
                );
                if (currentUserOption) {
                    select.value = currentUserOption.value;
                }
            }

            // Populate existing values if available
            if (invServiceData && invServiceData.arInvoiceApprovalSummary) {
                const approvalSummary = invServiceData.arInvoiceApprovalSummary;
                let fieldValue = '';
                let fieldNameValue = '';

                switch (fieldName) {
                    case 'preparedBy':
                        fieldValue = approvalSummary.preparedById;
                        fieldNameValue = approvalSummary.preparedByName;
                        break;
                    case 'acknowledgeBy':
                        fieldValue = approvalSummary.acknowledgedById;
                        fieldNameValue = approvalSummary.acknowledgedByName;
                        break;
                    case 'checkedBy':
                        fieldValue = approvalSummary.checkedById;
                        fieldNameValue = approvalSummary.checkedByName;
                        break;
                    case 'approvedBy':
                        fieldValue = approvalSummary.approvedById;
                        fieldNameValue = approvalSummary.approvedByName;
                        break;
                    case 'receivedBy':
                        fieldValue = approvalSummary.receivedById;
                        fieldNameValue = approvalSummary.receivedByName;
                        break;
                }

                if (fieldValue || fieldNameValue) {
                    const userOption = Array.from(select.options).find(option =>
                        option.value === fieldValue || option.textContent === fieldNameValue
                    );
                    if (userOption) {
                        select.value = userOption.value;
                        input.value = userOption.textContent;
                    }
                }
            }
        }
    });
}

// Function to acknowledge invoice service
function acknowledgeInvService() {
    if (!currentInvServiceData) {
        Swal.fire({
            icon: 'error',
            title: 'No Data',
            text: 'No invoice service data available to acknowledge.'
        });
        return;
    }

    const acknowledgeByName = document.getElementById('acknowledgeByName').value;
    if (!acknowledgeByName) {
        Swal.fire({
            icon: 'error',
            title: 'Missing Information',
            text: 'Please select an acknowledge by person.'
        });
        return;
    }

    Swal.fire({
        title: 'Confirm Acknowledge',
        text: 'Are you sure you want to acknowledge this invoice service?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Acknowledge',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateInvServiceStatus('Acknowledged');
        }
    });
}

// Function to reject invoice service
function rejectInvService() {
    if (!currentInvServiceData) {
        Swal.fire({
            icon: 'error',
            title: 'No Data',
            text: 'No invoice service data available to reject.'
        });
        return;
    }

    const acknowledgeByName = document.getElementById('acknowledgeByName').value;
    if (!acknowledgeByName) {
        Swal.fire({
            icon: 'error',
            title: 'Missing Information',
            text: 'Please select an acknowledge by person.'
        });
        return;
    }

    Swal.fire({
        title: 'Confirm Reject',
        text: 'Are you sure you want to reject this invoice service?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, Reject',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateInvServiceStatus('Rejected');
        }
    });
}

// Function to update invoice service status
async function updateInvServiceStatus(status) {
    const acknowledgeButton = document.getElementById('acknowledgeButton');
    const rejectButton = document.getElementById('rejectButton');
    const acknowledgeSpinner = document.getElementById('acknowledgeSpinner');
    const rejectSpinner = document.getElementById('rejectSpinner');

    // Show loading state
    if (status === 'Acknowledged') {
        acknowledgeButton.disabled = true;
        acknowledgeSpinner.classList.remove('hidden');
    } else {
        rejectButton.disabled = true;
        rejectSpinner.classList.remove('hidden');
    }

    try {
        const acknowledgeByName = document.getElementById('acknowledgeByName').value;
        const acknowledgeBy = document.getElementById('acknowledgeBy').value;

        const now = new Date().toISOString();

        // Prepare payload for PATCH API - preserve existing approval data
        const payload = {
            approvalStatus: status,
            acknowledgedBy: getCurrentUserKansaiEmployeeId(), // Use kansaiEmployeeId instead of acknowledgeBy
            acknowledgedByName: acknowledgeByName,
            acknowledgedDate: now,
            updatedAt: now
        };

        // Handle status-specific fields
        if (status === 'Acknowledged') {
            // Add acknowledgedDate when status is "Acknowledged"
            payload.acknowledgedDate = now;
            console.log('Added acknowledgedDate to payload:', now);
        } else if (status === 'Rejected') {
            // Add rejectedDate when status is "Rejected"
            payload.rejectedDate = now;
            console.log('Added rejectedDate to payload:', now);
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

            if (existingSummary.approvedBy) payload.approvedBy = existingSummary.approvedBy;
            if (existingSummary.approvedByName) payload.approvedByName = existingSummary.approvedByName;
            if (existingSummary.approvedDate) payload.approvedDate = existingSummary.approvedDate;

            if (existingSummary.receivedBy) payload.receivedBy = existingSummary.receivedBy;
            if (existingSummary.receivedByName) payload.receivedByName = existingSummary.receivedByName;
            if (existingSummary.receivedDate) payload.receivedDate = existingSummary.receivedDate;

            // Preserve existing rejection remarks if any
            if (existingSummary.rejectionRemarks) payload.rejectionRemarks = existingSummary.rejectionRemarks;
            if (existingSummary.revisionRemarks) payload.revisionRemarks = existingSummary.revisionRemarks;
        }

        console.log('Updating invoice service status with payload:', payload);

        // Get staging ID for the API endpoint
        const stagingID = currentInvServiceData.stagingID;
        if (!stagingID) {
            throw new Error('Staging ID is required for submission');
        }

        console.log('API URL:', `${API_BASE_URL}/ar-invoices/approval/${stagingID}`);

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
        const actionText = status === 'Acknowledged' ? 'acknowledged' : 'rejected';
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
                // Update local data
                if (!currentInvServiceData.arInvoiceApprovalSummary) {
                    currentInvServiceData.arInvoiceApprovalSummary = {};
                }
                currentInvServiceData.arInvoiceApprovalSummary.approvalStatus = status;
                currentInvServiceData.arInvoiceApprovalSummary.acknowledgedBy = getCurrentUserKansaiEmployeeId(); // Use kansaiEmployeeId
                currentInvServiceData.arInvoiceApprovalSummary.acknowledgedByName = acknowledgeByName;
                currentInvServiceData.arInvoiceApprovalSummary.acknowledgedDate = payload.acknowledgedDate;

                // Update display
                document.getElementById('Status').value = status;
                updateButtonVisibility();

                // Navigate back to menu
                goToMenuAcknowInvService();
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
    } finally {
        // Hide loading state
        if (status === 'Acknowledged') {
            acknowledgeButton.disabled = false;
            acknowledgeSpinner.classList.add('hidden');
        } else {
            rejectButton.disabled = false;
            rejectSpinner.classList.add('hidden');
        }
    }
}

// Function to navigate back to menu
function goToMenuAcknowInvService() {
    window.location.href = '../../../../dashboard/dashboardAcknowledge/ARInvoice/menuARItemAcknow.html';
}

// Function to format currency
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0.00';
    return parseFloat(amount).toFixed(2);
}

// Function to validate numeric input
function validateNumericInput(input) {
    const value = input.value;
    const numericValue = value.replace(/[^0-9.-]/g, '');
    input.value = numericValue;
}

// Function to refresh text wrapping
function refreshTextWrapping() {
    setTimeout(() => {
        applyTextWrappingToAll();
    }, 100);
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

// Function to preview PDF files
function previewPDF(event) {
    const files = event.target.files;
    const fileList = document.getElementById('fileList');

    if (!files || files.length === 0) {
        fileList.innerHTML = '';
        uploadedFiles = [];
        return;
    }

    uploadedFiles = Array.from(files);
    fileList.innerHTML = '';

    uploadedFiles.forEach((file, index) => {
        if (file.type === 'application/pdf') {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            const fileSize = (file.size / 1024 / 1024).toFixed(2);

            fileItem.innerHTML = `
                <div class="file-item-header">
                    <div class="file-item-name">${file.name}</div>
                    <div class="file-item-size">${fileSize} MB</div>
                    <div class="file-item-actions">
                        <button type="button" class="btn-view" onclick="viewPDF(${index})">View</button>
                        <button type="button" class="btn-remove" onclick="removeFile(${index})">Remove</button>
                    </div>
                </div>
            `;

            fileList.appendChild(fileItem);
        }
    });
}

// Function to view PDF
function viewPDF(index) {
    const file = uploadedFiles[index];
    if (file) {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
    }
}

// Function to remove file
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    previewPDF({ target: { files: uploadedFiles } });
}
