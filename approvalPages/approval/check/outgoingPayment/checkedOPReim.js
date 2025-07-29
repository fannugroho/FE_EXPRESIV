// checkedOPReim.js - JavaScript for the Outgoing Payment Reimbursement checking page

// Global variables
let outgoingPaymentReimData = null;
let uploadedFiles = [];
let existingAttachments = [];
let attachmentsToKeep = [];
let documentId = null;

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get document ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    documentId = urlParams.get('id');
    

    
    if (documentId) {
        // Load document details
        loadOPReimDetails(documentId);
    } else {
        Swal.fire({
            title: 'Error',
            text: 'No document ID provided',
            icon: 'error'
        }).then(() => {
            // Redirect back to menu
            goToMenuCheckOPReim();
        });
    }
    
    // Initialize event listeners
    initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {
            // Initialize button states
        // Note: Revision functionality has been removed
}

// Load outgoing payment reimbursement details from API
async function loadOPReimDetails(id) {
    try {
        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            text: 'Fetching document details',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Make API request to get document details
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/headers/${id}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        // Parse response data
        const data = await response.json();
        outgoingPaymentReimData = data;
        
        // Load users data to get names
        await loadUsersData();
        
        // Populate form with data
        populateFormFields(data);
        
        // Check user permissions and update UI accordingly
        checkUserPermissions(data);
        
        // Close loading indicator
        Swal.close();
        
    } catch (error) {
        console.error('Error loading document:', error);
        
        Swal.fire({
            title: 'Error',
            text: `Failed to load document: ${error.message}`,
            icon: 'error'
        }).then(() => {
            // Redirect back to menu
            goToMenuCheckOPReim();
        });
    }
}

// Load users data to get user names
async function loadUsersData() {
    try {
        const response = await makeAuthenticatedRequest('/api/users', {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load users: ${response.status}`);
        }
        
        const usersData = await response.json();
        window.usersList = usersData.data || [];
        
    } catch (error) {
        console.error('Error loading users:', error);
        window.usersList = [];
    }
}

// Get user name by ID
function getUserNameById(userId) {
    if (!window.usersList || !userId) return 'Unknown User';
    
    const user = window.usersList.find(u => u.id === userId);
    return user ? user.fullName : 'Unknown User';
}

// Check user permissions and update UI
function checkUserPermissions(data) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        Swal.fire({
            title: 'Error',
            text: 'User not authenticated. Please login again.',
            icon: 'error'
        }).then(() => {
            window.location.href = getLoginPagePath();
        });
        return;
    }
    
    const approval = data.approval;
    if (!approval) {
        console.error('No approval data found');
        return;
    }
    
    // Determine current status based on dates
    let currentStatus = 'Prepared';
    if (approval.checkedDate) {
        currentStatus = 'Checked';
    }
    if (approval.acknowledgedDate) {
        currentStatus = 'Acknowledged';
    }
    if (approval.approvedDate) {
        currentStatus = 'Approved';
    }
    if (approval.receivedDate) {
        currentStatus = 'Received';
    }
    if (approval.rejectedDate) {
        currentStatus = 'Rejected';
    }
    
    console.log('Current status:', currentStatus);
    console.log('Current user ID:', currentUser.userId);
    console.log('Checked by ID:', approval.checkedBy);
    console.log('Document ID:', documentId);
    
    // Check if current user is the assigned checker
    const isAssignedChecker = approval.checkedBy === currentUser.userId;
    const isAboveChecker = isUserAboveChecker(currentUser.userId, approval.checkedBy);
    
    console.log('Is assigned checker:', isAssignedChecker);
    console.log('Is above checker:', isAboveChecker);
    
    // Hide buttons based on document status
    hideButtonsBasedOnStatus(data);
    
    // Update button states based on user permissions
    const approveButton = document.getElementById('approveButton');
    const rejectButton = document.getElementById('rejectButton');
    
    if (currentStatus === 'Prepared' && isAssignedChecker) {
        // User is the assigned checker and document is ready for checking
        approveButton.disabled = false;
        approveButton.classList.remove('opacity-50', 'cursor-not-allowed');
        rejectButton.disabled = false;
        rejectButton.classList.remove('opacity-50', 'cursor-not-allowed');
        
        console.log('Buttons enabled for checking');
        
        // Show success message
        Swal.fire({
            title: 'Ready for Checking',
            text: 'You can now check this document',
            icon: 'info',
            timer: 2000,
            showConfirmButton: false
        });
        
    } else if (currentStatus === 'Prepared' && isAboveChecker) {
        // User is above the checker, show waiting message
        const checkerName = getUserNameById(approval.checkedBy);
        
        console.log('User is above checker, waiting for:', checkerName);
        
        Swal.fire({
            title: 'Document Pending',
            text: `Please wait for ${checkerName} to check this document first`,
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        
        // Disable all action buttons
        approveButton.disabled = true;
        approveButton.classList.add('opacity-50', 'cursor-not-allowed');
        rejectButton.disabled = true;
        rejectButton.classList.add('opacity-50', 'cursor-not-allowed');
        
    } else if (currentStatus !== 'Prepared') {
        // Document has already been checked or is in a different status
        const statusMessage = getStatusMessage(currentStatus);
        
        console.log('Document status is:', currentStatus);
        
        Swal.fire({
            title: 'Document Status',
            text: statusMessage,
            icon: 'info',
            confirmButtonText: 'OK'
        });
        
        // Disable all action buttons
        approveButton.disabled = true;
        approveButton.classList.add('opacity-50', 'cursor-not-allowed');
        rejectButton.disabled = true;
        rejectButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Hide buttons based on document status
function hideButtonsBasedOnStatus(data) {
    const approveButton = document.getElementById('approveButton');
    const rejectButton = document.getElementById('rejectButton');
    
    // Determine current status based on approval data
    let currentStatus = 'Prepared';
    if (data.approval) {
        if (data.approval.checkedDate) {
            currentStatus = 'Checked';
        }
        if (data.approval.acknowledgedDate) {
            currentStatus = 'Acknowledged';
        }
        if (data.approval.approvedDate) {
            currentStatus = 'Approved';
        }
        if (data.approval.receivedDate) {
            currentStatus = 'Received';
        }
        if (data.approval.rejectedDate) {
            currentStatus = 'Rejected';
        }
    }
    
    // Hide both buttons if status is not 'Prepared'
    if (currentStatus !== 'Prepared') {
        if (approveButton) {
            approveButton.style.display = 'none';
        }
        if (rejectButton) {
            rejectButton.style.display = 'none';
        }
    } else {
        // Show buttons if status is 'Prepared'
        if (approveButton) {
            approveButton.style.display = 'inline-block';
        }
        if (rejectButton) {
            rejectButton.style.display = 'inline-block';
        }
    }
}

// Check if user is above the checker in the hierarchy
function isUserAboveChecker(currentUserId, checkerId) {
    // This is a simplified check - in a real system, you'd have a proper user hierarchy
    // For now, we'll assume that if the current user is not the checker, they might be above
    return currentUserId !== checkerId;
}

// Get status message based on current status
function getStatusMessage(status) {
    switch (status) {
        case 'Checked':
            return 'This document has already been checked.';
        case 'Acknowledged':
            return 'This document has been acknowledged.';
        case 'Approved':
            return 'This document has been approved.';
        case 'Received':
            return 'This document has been received.';
        case 'Rejected':
            return 'This document has been rejected.';
        default:
            return 'This document is not ready for checking.';
    }
}

// Populate form fields with data
function populateFormFields(data) {
    // Helper function to safely set value
    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };
    
    // Map header fields
    setValue('CounterRef', data.counterRef || '');
    setValue('RequesterName', data.requesterName || '');
    setValue('CardName', data.cardName || '');
    setValue('Address', data.address || '');
    setValue('DocNum', data.docNum || '');
    setValue('JrnlMemo', data.jrnlMemo || '');
    setValue('DocCurr', data.docCurr || 'IDR');
    setValue('TrsfrAcct', data.trsfrAcct || '');
    setValue('TrsfrSum', formatCurrency(data.trsfrSum || 0));
    
    // Map date fields
    if (data.docDate) {
        const docDate = new Date(data.docDate);
        setValue('DocDate', docDate.toISOString().split('T')[0]);
    }
    if (data.docDueDate) {
        const docDueDate = new Date(data.docDueDate);
        setValue('DocDueDate', docDueDate.toISOString().split('T')[0]);
    }
    if (data.taxDate) {
        const taxDate = new Date(data.taxDate);
        setValue('TaxDate', taxDate.toISOString().split('T')[0]);
    }
    if (data.trsfrDate) {
        const trsfrDate = new Date(data.trsfrDate);
        setValue('TrsfrDate', trsfrDate.toISOString().split('T')[0]);
    }
    
    // Calculate totals from lines
    let totalAmountDue = 0;
    if (data.lines && data.lines.length > 0) {
        data.lines.forEach(line => {
            totalAmountDue += line.sumApplied || 0;
        });
    }
    setValue('totalAmountDue', formatCurrency(totalAmountDue));
    
    // Map remarks
    setValue('remarks', data.remarks || '');
    setValue('journalRemarks', data.journalRemarks || '');
    
    // Map approval data
    if (data.approval) {
        populateApprovalInfo(data.approval);
        // Show rejection remarks if status is rejected
        if (data.approval.approvalStatus === 'Rejected') {
            const rejSec = document.getElementById('rejectionRemarksSection');
            const rejTxt = document.getElementById('rejectionRemarks');
            if (rejSec) rejSec.style.display = 'block';
            if (rejTxt) rejTxt.value = data.approval.rejectionRemarks || '';
        }
        // Display status
        displayApprovalStatus(data.approval);
    } else {
        // If no approval data, show as Prepared
        displayApprovalStatus({ approvalStatus: 'Prepared' });
    }
    
    // Map table lines
    if (data.lines && data.lines.length > 0) {
        populateTableRows(data.lines);
    }
    
    // Display attachments if available
    if (data.attachments && data.attachments.length > 0) {
        displayAttachments(data.attachments);
    }
    
    // Display Print Out Reimbursement document
    displayPrintOutReimbursement(data);
}

// Function to display approval status with select dropdown
function displayApprovalStatus(approval) {
    const statusSelect = document.getElementById('status');
    
    if (!statusSelect) {
        console.error('Status select element not found');
        return;
    }
    
    let status = 'Prepared'; // Default to Prepared
    
    if (approval) {
        // Determine status based on approval data
        if (approval.approvalStatus) {
            status = approval.approvalStatus;
        } else if (approval.rejectedDate) {
            status = 'Rejected';
        } else if (approval.receivedBy) {
            status = 'Received';
        } else if (approval.approvedBy) {
            status = 'Approved';
        } else if (approval.acknowledgedBy) {
            status = 'Acknowledged';
        } else if (approval.checkedBy) {
            status = 'Checked';
        } else if (approval.preparedBy) {
            status = 'Prepared';
        }
    }
    
    // Update select value - only if the status exists in the select options
    const availableStatuses = ['Prepared', 'Checked', 'Acknowledged', 'Approved', 'Received', 'Rejected'];
    if (availableStatuses.includes(status)) {
        statusSelect.value = status;
    } else {
        // If status is not in available options, default to Prepared
        statusSelect.value = 'Prepared';
    }
}

// Populate table rows with line items
function populateTableRows(lines) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (!lines || lines.length === 0) {
        // Add empty row if no lines
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" class="p-2 border text-center text-gray-500">No items found</td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    // Add each line as a row
    lines.forEach((line, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border">${line.acctCode || ''}</td>
            <td class="p-2 border">${line.acctName || ''}</td>
            <td class="p-2 border">${line.descrip || ''}</td>
            <td class="p-2 border text-right">${formatCurrency(line.sumApplied) || '0'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Update totals based on line items
function updateTotals(lines) {
    let totalAmount = 0;
    
    // Calculate sum of all line amounts
    if (lines && lines.length > 0) {
        totalAmount = lines.reduce((sum, line) => sum + (parseFloat(line.sumApplied) || 0), 0);
    }
    
    // Update total amount due field
    document.getElementById('totalAmountDue').value = formatCurrency(totalAmount);
}

// Populate approval information
function populateApprovalInfo(approval) {
    if (!approval) return;
    
    // Set prepared by
    if (approval.preparedBy) {
        const preparedByName = getUserNameById(approval.preparedBy);
        document.getElementById('preparedBySearch').value = preparedByName;
    }
    
    // Set checked by
    if (approval.checkedBy) {
        const checkedByName = getUserNameById(approval.checkedBy);
        document.getElementById('checkedBySearch').value = checkedByName;
    }
    
    // Set acknowledged by
    if (approval.acknowledgedBy) {
        const acknowledgedByName = getUserNameById(approval.acknowledgedBy);
        document.getElementById('acknowledgedBySearch').value = acknowledgedByName;
    }
    
    // Set approved by
    if (approval.approvedBy) {
        const approvedByName = getUserNameById(approval.approvedBy);
        document.getElementById('approvedBySearch').value = approvedByName;
    }
    
    // Set received by
    if (approval.receivedBy) {
        const receivedByName = getUserNameById(approval.receivedBy);
        document.getElementById('receivedBySearch').value = receivedByName;
    }
    

}



// Display attachments
function displayAttachments(attachments) {
    console.log('Displaying attachments:', attachments);
    
    const attachmentsList = document.getElementById('attachmentsList');
    
    if (!attachmentsList) return;
    
    // Clear existing attachments
    attachmentsList.innerHTML = '';
    
    // Store existing attachments
    existingAttachments = [...attachments];
    attachmentsToKeep = [...attachments.map(a => a.id)];
    
    if (!attachments || attachments.length === 0) {
        attachmentsList.innerHTML = '<div class="text-gray-500 text-center p-2">No attachments</div>';
        return;
    }
    
    // Create attachment items
    attachments.forEach((attachment, index) => {
        console.log(`Attachment ${index}:`, attachment);
        
        // Get attachment ID with fallbacks
        const attachmentId = attachment.id || attachment.attachmentId || attachment.fileId || index;
        
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex justify-between items-center p-2 border-b last:border-b-0';
        attachmentItem.dataset.id = attachmentId;
        
        attachmentItem.innerHTML = `
            <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span class="text-sm">${attachment.fileName || attachment.name || 'Attachment'}</span>
            </div>
            <div>
                <button type="button" class="text-blue-500 hover:text-blue-700 text-sm" onclick="viewAttachment('${attachmentId}')">
                    View
                </button>
            </div>
        `;
        
        attachmentsList.appendChild(attachmentItem);
    });
}

// View attachment
function viewAttachment(attachmentId) {
    console.log('Viewing attachment with ID:', attachmentId);
    console.log('Available attachments:', existingAttachments);
    
    // Find attachment by different possible ID fields
    const attachment = existingAttachments.find(a => 
        a.id === attachmentId || 
        a.attachmentId === attachmentId || 
        a.fileId === attachmentId ||
        a.id === parseInt(attachmentId) ||
        a.attachmentId === parseInt(attachmentId) ||
        a.fileId === parseInt(attachmentId)
    );
    
    if (!attachment) {
        console.error('Attachment not found for ID:', attachmentId);
        Swal.fire({
            title: 'Error',
            text: 'Attachment not found',
            icon: 'error'
        });
        return;
    }
    
    console.log('Found attachment:', attachment);
    
    // Check for different possible URL field names
    const fileUrl = attachment.fileUrl || attachment.url || attachment.downloadUrl || attachment.filePath;
    
    if (!fileUrl) {
        console.error('No file URL found in attachment:', attachment);
        Swal.fire({
            title: 'Error',
            text: 'Attachment file URL not available',
            icon: 'error'
        });
        return;
    }
    
    // Open attachment in new window/tab
    window.open(fileUrl, '_blank');
}

// Toggle visibility of closed by field based on transaction type


// Format currency with Indonesian format
function formatCurrency(number) {
    console.log('formatCurrency input:', number, 'type:', typeof number);
    // Handle empty or invalid input
    if (number === null || number === undefined || number === '') {
        console.log('formatCurrency: returning 0 for null/undefined/empty');
        return '0';
    }
    
    // Parse the number
    const num = parseFloat(number);
    console.log('formatCurrency parsed number:', num);
    if (isNaN(num)) {
        console.log('formatCurrency: returning 0 for NaN');
        return '0';
    }
    
    // Get the string representation to check if it has decimal places
    const numStr = num.toString();
    const hasDecimal = numStr.includes('.');
    
    try {
        // Format with Indonesian locale (thousand separator: '.', decimal separator: ',')
        if (hasDecimal) {
            const decimalPlaces = numStr.split('.')[1].length;
            const formatted = num.toLocaleString('id-ID', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
            });
            console.log('formatCurrency formatted result:', formatted);
            return formatted;
        } else {
            const formatted = num.toLocaleString('id-ID', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            console.log('formatCurrency formatted result:', formatted);
            return formatted;
        }
    } catch (e) {
        // Fallback for very large numbers
        console.error('Error formatting number:', e);
        
        let strNum = num.toString();
        let sign = '';
        
        if (strNum.startsWith('-')) {
            sign = '-';
            strNum = strNum.substring(1);
        }
        
        const parts = strNum.split('.');
        const integerPart = parts[0];
        const decimalPart = parts.length > 1 ? ',' + parts[1] : '';
        
        let formattedInteger = '';
        for (let i = 0; i < integerPart.length; i++) {
            if (i > 0 && (integerPart.length - i) % 3 === 0) {
                formattedInteger += '.';
            }
            formattedInteger += integerPart.charAt(i);
        }
        
        const fallbackResult = sign + formattedInteger + decimalPart;
        console.log('formatCurrency fallback result:', fallbackResult);
        return fallbackResult;
    }
}

// Parse currency string back to number
function parseCurrency(formattedValue) {
    if (!formattedValue) return 0;
    
    // Handle Indonesian format (thousand separator: '.', decimal separator: ',')
    const numericValue = formattedValue.toString()
        .replace(/\./g, '') // Remove thousand separators (dots)
        .replace(/,/g, '.'); // Replace decimal separators (commas) with dots
    
    return parseFloat(numericValue) || 0;
}

// Navigate back to the menu
function goToMenuCheckOPReim() {
    window.location.href = '../../../dashboard/dashboardCheck/OPReim/menuOPReimCheck.html';
}

// Approve (check) the outgoing payment reimbursement
async function approveOPReim() {
    try {
        // Validate document status and user permissions
        if (!validateDocumentStatus()) {
            return;
        }
        
        // Show loading indicator
        Swal.fire({
            title: 'Processing...',
            text: 'Submitting approval',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Get current user ID
        const userId = getUserId();
        
        if (!userId) {
            throw new Error('User ID not found. Please log in again.');
        }
        
        // Get current user info
        const currentUser = getCurrentUser();
        const currentUserName = currentUser ? currentUser.username : 'Unknown User';
        
        // Get current date
        const currentDate = new Date().toISOString();
        
        // Prepare request data according to the API specification
        const requestData = {
            stagingID: documentId,
            createdAt: outgoingPaymentReimData.approval?.createdAt || currentDate,
            updatedAt: currentDate,
            approvalStatus: "Checked",
            preparedBy: outgoingPaymentReimData.approval?.preparedBy || userId,
            checkedBy: userId,
            acknowledgedBy: outgoingPaymentReimData.approval?.acknowledgedBy || userId,
            approvedBy: outgoingPaymentReimData.approval?.approvedBy || userId,
            receivedBy: outgoingPaymentReimData.approval?.receivedBy || userId,
            preparedDate: outgoingPaymentReimData.approval?.preparedDate || currentDate,
            preparedByName: outgoingPaymentReimData.approval?.preparedByName || currentUserName,
            checkedByName: currentUserName,
            acknowledgedByName: outgoingPaymentReimData.approval?.acknowledgedByName || currentUserName,
            approvedByName: outgoingPaymentReimData.approval?.approvedByName || currentUserName,
            receivedByName: outgoingPaymentReimData.approval?.receivedByName || currentUserName,
            checkedDate: currentDate,
            acknowledgedDate: outgoingPaymentReimData.approval?.acknowledgedDate || null,
            approvedDate: outgoingPaymentReimData.approval?.approvedDate || null,
            receivedDate: outgoingPaymentReimData.approval?.receivedDate || null,
            rejectedDate: outgoingPaymentReimData.approval?.rejectedDate || null,
            rejectionRemarks: outgoingPaymentReimData.approval?.rejectionRemarks || "",
            revisionNumber: outgoingPaymentReimData.approval?.revisionNumber || null,
            revisionDate: outgoingPaymentReimData.approval?.revisionDate || null,
            revisionRemarks: outgoingPaymentReimData.approval?.revisionRemarks || null,
            header: {}
        };
        
        // Make API request to update approval status using the correct endpoint
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/approvals/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json-patch+json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        // Parse response data
        const responseData = await response.json();
        
        // Show success message
        Swal.fire({
            title: 'Success',
            text: 'Document has been checked successfully',
            icon: 'success'
        }).then(() => {
            // Redirect back to menu
            goToMenuCheckOPReim();
        });
        
    } catch (error) {
        console.error('Error checking document:', error);
        
        Swal.fire({
            title: 'Error',
            text: `Failed to check document: ${error.message}`,
            icon: 'error'
        });
    }
}

// Reject the outgoing payment reimbursement
async function rejectOPReim() {
    try {
        // Validate document status and user permissions
        if (!validateDocumentStatus()) {
            return;
        }
        
        // Create custom dialog with single field
        const { value: rejectionReason } = await Swal.fire({
            title: 'Reject Outgoing Payment Reimbursement',
            html: `
                <div class="mb-4">
                    <p class="text-sm text-gray-600 mb-3">Please provide a reason for rejection:</p>
                    <div id="rejectionFieldsContainer">
                        <textarea id="rejectionField1" class="w-full p-2 border rounded-md" placeholder="Enter rejection reason" rows="3"></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            width: '600px',
            didOpen: () => {
                const firstField = document.getElementById('rejectionField1');
                if (firstField) {
                    initializeWithRejectionPrefix(firstField);
                }
                const field = document.querySelector('#rejectionFieldsContainer textarea');
                if (field) {
                    field.addEventListener('input', handleRejectionInput);
                }
            },
            preConfirm: () => {
                const field = document.querySelector('#rejectionFieldsContainer textarea');
                const remarks = field ? field.value.trim() : '';
                if (remarks === '') {
                    Swal.showValidationMessage('Please enter a rejection reason');
                    return false;
                }
                return remarks;
            }
        });
        
        if (!rejectionReason) {
            return; // User cancelled or didn't provide a reason
        }
        
        // Show loading indicator
        Swal.fire({
            title: 'Processing...',
            text: 'Rejecting document, please wait...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Get current user ID
        const userId = getUserId();
        if (!userId) {
            throw new Error('Unable to get user ID. Please login again.');
        }
        
        // Prepare request data for rejection
        const requestData = {
            stagingID: documentId,
            createdAt: outgoingPaymentReimData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvalStatus: "Rejected",
            preparedBy: outgoingPaymentReimData.approval?.preparedBy || null,
            checkedBy: outgoingPaymentReimData.approval?.checkedBy || null,
            acknowledgedBy: outgoingPaymentReimData.approval?.acknowledgedBy || null,
            approvedBy: outgoingPaymentReimData.approval?.approvedBy || null,
            receivedBy: outgoingPaymentReimData.approval?.receivedBy || null,
            preparedDate: outgoingPaymentReimData.approval?.preparedDate || null,
            preparedByName: outgoingPaymentReimData.approval?.preparedByName || null,
            checkedByName: outgoingPaymentReimData.approval?.checkedByName || null,
            acknowledgedByName: outgoingPaymentReimData.approval?.acknowledgedByName || null,
            approvedByName: outgoingPaymentReimData.approval?.approvedByName || null,
            receivedByName: outgoingPaymentReimData.approval?.receivedByName || null,
            checkedDate: outgoingPaymentReimData.approval?.checkedDate || null,
            acknowledgedDate: outgoingPaymentReimData.approval?.acknowledgedDate || null,
            approvedDate: outgoingPaymentReimData.approval?.approvedDate || null,
            receivedDate: outgoingPaymentReimData.approval?.receivedDate || null,
            rejectedDate: new Date().toISOString(),
            rejectionRemarks: rejectionReason,
            revisionNumber: outgoingPaymentReimData.approval?.revisionNumber || null,
            revisionDate: outgoingPaymentReimData.approval?.revisionDate || null,
            revisionRemarks: outgoingPaymentReimData.approval?.revisionRemarks || null,
            header: {}
        };
        
        // Also add rejectionRemarks at root level in case backend expects it there
        requestData.rejectionRemarks = rejectionReason;
        
        // Debug: Log the request data to console
        console.log('Rejection request data:', requestData);
        console.log('Rejection reason:', rejectionReason);
        
        // Make API request to reject document using the approvals endpoint
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/approvals/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            // Try to get detailed error message
            let errorMessage = `API error: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.Message || errorMessage;
            } catch (e) {
                console.error('Could not parse error response:', e);
            }
            throw new Error(errorMessage);
        }
        
        // Debug: Log the response data
        try {
            const responseData = await response.json();
            console.log('Rejection response data:', responseData);
        } catch (e) {
            console.log('Response does not contain JSON data');
        }
        
        // Show success message
        await Swal.fire({
            title: 'Success',
            text: 'Document has been rejected',
            icon: 'success'
        });
        
        // Redirect back to menu
        goToMenuCheckOPReim();
        
    } catch (error) {
        console.error('Error rejecting document:', error);
        
        // Show error message
        await Swal.fire({
            title: 'Error',
            text: `Failed to reject document: ${error.message}`,
            icon: 'error'
        });
    }
}



// Validate document status before allowing actions
function validateDocumentStatus() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        Swal.fire({
            title: 'Authentication Error',
            text: 'User not authenticated. Please login again.',
            icon: 'error'
        }).then(() => {
            window.location.href = getLoginPagePath();
        });
        return false;
    }
    
    if (!outgoingPaymentReimData || !outgoingPaymentReimData.approval) {
        Swal.fire({
            title: 'Error',
            text: 'Document data is incomplete. Please refresh the page.',
            icon: 'error'
        });
        return false;
    }
    
    const approval = outgoingPaymentReimData.approval;
    
    // Check if document is already checked
    if (approval.checkedDate) {
        Swal.fire({
            title: 'Already Checked',
            text: 'This document has already been checked.',
            icon: 'info'
        });
        return false;
    }
    
    // Check if current user is the assigned checker
    if (approval.checkedBy !== currentUser.userId) {
        const checkerName = getUserNameById(approval.checkedBy);
        Swal.fire({
            title: 'Not Authorized',
            text: `Only ${checkerName} can check this document.`,
            icon: 'warning'
        });
        return false;
    }
    
    return true;
}

// Helper function to get logged-in user ID
function getUserId() {
    try {
        const user = getCurrentUser();
        return user ? user.userId : null;
    } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
}

// Function to initialize textarea with user prefix for rejection
function initializeWithRejectionPrefix(textarea) {
    const userInfo = getUserInfo();
    const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
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
    
    // If user tries to modify content before the prefix length
    if (textarea.selectionStart < prefixLength || textarea.selectionEnd < prefixLength) {
        const userInfo = getUserInfo();
        const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
        
        // Only restore if the prefix is damaged
        if (!textarea.value.startsWith(prefix)) {
            const userText = textarea.value.substring(prefixLength);
            textarea.value = prefix + userText;
            textarea.setSelectionRange(prefixLength, prefixLength);
        } else {
            textarea.setSelectionRange(prefixLength, prefixLength);
        }
    }
}

// Function to get current user information
function getUserInfo() {
    // Use functions from auth.js to get user information
    let userName = 'Unknown User';
    let userRole = 'Checker'; // Default role for this page
    
    try {
        // Get user info from getCurrentUser function in auth.js
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.username) {
            userName = currentUser.username;
        }
    } catch (e) {
        console.error('Error getting user info:', e);
    }
    
    return { name: userName, role: userRole };
} 