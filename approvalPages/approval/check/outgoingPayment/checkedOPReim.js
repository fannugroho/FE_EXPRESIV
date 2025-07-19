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
    // Set up revision field handling
    document.addEventListener('input', function(event) {
        if (event.target.tagName === 'TEXTAREA' && event.target.closest('#revisionContainer')) {
            checkRevisionButton();
        }
    });
    
    // Initialize button states
    checkRevisionButton();
    updateAddButtonState();
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
    
    // Update button states based on user permissions
    const approveButton = document.getElementById('approveButton');
    const rejectButton = document.getElementById('rejectButton');
    const revisionButton = document.getElementById('revisionButton');
    
    if (currentStatus === 'Prepared' && isAssignedChecker) {
        // User is the assigned checker and document is ready for checking
        approveButton.disabled = false;
        approveButton.classList.remove('opacity-50', 'cursor-not-allowed');
        rejectButton.disabled = false;
        rejectButton.classList.remove('opacity-50', 'cursor-not-allowed');
        revisionButton.disabled = false;
        revisionButton.classList.remove('opacity-50', 'cursor-not-allowed');
        
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
        revisionButton.disabled = true;
        revisionButton.classList.add('opacity-50', 'cursor-not-allowed');
        
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
        revisionButton.disabled = true;
        revisionButton.classList.add('opacity-50', 'cursor-not-allowed');
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

// Populate form fields with data from API
function populateFormFields(data) {
    console.log('Populating form fields with data:', data);
    console.log('Attachments data:', data.attachments);
    
    // Populate header fields
    document.getElementById('CounterRef').value = data.counterRef || '';
    document.getElementById('RequesterName').value = getUserNameById(data.requesterId) || 'Unknown Requester';
    document.getElementById('CardName').value = data.cardName || '';
    document.getElementById('Address').value = data.address || '';
    document.getElementById('DocNum').value = data.docNum || '';
    document.getElementById('Comments').value = data.comments || '';
    document.getElementById('JrnlMemo').value = data.jrnlMemo || '';
    document.getElementById('DocCurr').value = data.docCurr || 'IDR';
    document.getElementById('DiffCurr').value = data.diffCurr || 'IDR';
    document.getElementById('TrsfrAcct').value = data.trsfrAcct || '';
    document.getElementById('TrsfrSum').value = formatCurrency(data.trsfrSum) || '0';
    
    // Set dates if available
    if (data.docDate) {
        document.getElementById('DocDate').value = new Date(data.docDate).toISOString().split('T')[0];
    }
    
    if (data.docDueDate) {
        document.getElementById('DocDueDate').value = new Date(data.docDueDate).toISOString().split('T')[0];
    }
    
    if (data.taxDate) {
        document.getElementById('TaxDate').value = new Date(data.taxDate).toISOString().split('T')[0];
    }
    
    if (data.trsfrDate) {
        document.getElementById('TrsfrDate').value = new Date(data.trsfrDate).toISOString().split('T')[0];
    }
    
    // Populate remarks fields
    document.getElementById('remarks').value = data.remarks || '';
    document.getElementById('journalRemarks').value = data.journalRemarks || '';
    
    // Populate line items in table
    populateTableRows(data.lines || []);
    
    // Populate approval information with user names
    populateApprovalInfo(data.approval);
    
    // Handle revision history if any
    handleRevisionHistory(data.approval);
    
    // Display attachments if any
    displayAttachments(data.attachments || []);
    
    // Update totals
    updateTotals(data.lines || []);
    
    // Show rejection remarks if status is rejected
    if (data.approval && data.approval.approvalStatus === 'Rejected') {
        document.getElementById('rejectionRemarksSection').style.display = 'block';
        document.getElementById('rejectionRemarks').value = data.approval.rejectionRemarks || '';
    }
    
    // Toggle visibility of closed by field based on transaction type
    toggleClosedByVisibility(data.type);
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
            <td class="p-2 border">${line.ocrCode3 || ''}</td>
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
    
    // Set closed by
    if (approval.closedBy) {
        const closedByName = getUserNameById(approval.closedBy);
        document.getElementById('closedBySearch').value = closedByName;
    }
}

// Handle revision history
function handleRevisionHistory(approval) {
    if (!approval || !approval.revisionNumber || approval.revisionNumber <= 0) {
        return;
    }
    
    // Show revision history section
    const revisedRemarksSection = document.getElementById('revisedRemarksSection');
    revisedRemarksSection.style.display = 'block';
    
    // Update revision count
    document.getElementById('revisedCount').textContent = approval.revisionNumber;
    
    // Create revision history content
    const revisionsContainer = document.createElement('div');
    revisionsContainer.className = 'mt-2 space-y-2';
    
    // Add revision remarks if available
    if (approval.revisionRemarks) {
        const revisionEntry = document.createElement('div');
        revisionEntry.className = 'p-2 bg-blue-50 border border-blue-200 rounded';
        
        const revisionDate = approval.revisionDate ? new Date(approval.revisionDate).toLocaleString() : 'Unknown date';
        
        revisionEntry.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-blue-700">Revision #${approval.revisionNumber}</span>
                <span class="text-xs text-gray-500">${revisionDate}</span>
            </div>
            <p class="text-sm text-gray-800">${approval.revisionRemarks}</p>
        `;
        
        revisionsContainer.appendChild(revisionEntry);
    }
    
    // Append to the section
    revisedRemarksSection.appendChild(revisionsContainer);
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
function toggleClosedByVisibility(transactionType) {
    const closedByContainer = document.getElementById('closedByContainer');
    
    if (closedByContainer) {
        if (transactionType === 'LOAN') {
            closedByContainer.style.display = 'block';
        } else {
            closedByContainer.style.display = 'none';
        }
    }
}

// Format currency with Indonesian format
function formatCurrency(number) {
    // Handle empty or invalid input
    if (number === null || number === undefined || number === '') {
        return '0';
    }
    
    // Parse the number
    const num = parseFloat(number);
    if (isNaN(num)) {
        return '0';
    }
    
    // Format with Indonesian locale (thousand separator: '.', decimal separator: ',')
    return num.toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
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
        
        // Prompt for rejection reason
        const { value: rejectionReason } = await Swal.fire({
            title: 'Rejection Reason',
            input: 'textarea',
            inputLabel: 'Please provide a reason for rejection',
            inputPlaceholder: 'Type your reason here...',
            inputAttributes: {
                'aria-label': 'Type your reason here'
            },
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to provide a reason for rejection';
                }
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
        
        // Prepare request data
        const requestData = {
            stagingID: documentId,
            userId: userId,
            rejectionRemarks: rejectionReason
        };
        
        // Make API request to reject document
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/headers/${documentId}/reject`, {
            method: 'POST',
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

// Request revision for the outgoing payment reimbursement
async function revisionOPReim() {
    try {
        // Validate document status and user permissions
        if (!validateDocumentStatus()) {
            return;
        }
        
        // Check if revision button is disabled
        if (document.getElementById('revisionButton').disabled) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please add and fill in the revision field first'
            });
            return;
        }
        
        // Collect all revision remarks
        const revisionFields = document.querySelectorAll('#revisionContainer textarea');
        let allRemarks = '';
        
        revisionFields.forEach((field, index) => {
            // Include the entire content including the prefix
            if (field.value.trim() !== '') {
                if (allRemarks !== '') allRemarks += '\n\n';
                allRemarks += field.value.trim();
            }
        });
        
        if (revisionFields.length === 0 || allRemarks.trim() === '') {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please add and fill in the revision field first'
            });
            return;
        }
        
        // Show loading indicator
        Swal.fire({
            title: 'Processing...',
            text: 'Requesting revision, please wait...',
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
        
        // Prepare request data
        const requestData = {
            stagingID: documentId,
            userId: userId,
            revisionRemarks: allRemarks
        };
        
        // Make API request to request revision
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/headers/${documentId}/revise`, {
            method: 'POST',
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
        
        // Show success message
        await Swal.fire({
            title: 'Success',
            text: 'Revision has been requested',
            icon: 'success'
        });
        
        // Redirect back to menu
        goToMenuCheckOPReim();
        
    } catch (error) {
        console.error('Error requesting revision:', error);
        
        // Show error message
        await Swal.fire({
            title: 'Error',
            text: `Failed to request revision: ${error.message}`,
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