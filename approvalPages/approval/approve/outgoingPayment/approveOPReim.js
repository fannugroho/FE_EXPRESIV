// approveOPReim.js - JavaScript for the Outgoing Payment Reimbursement approval page

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
            goToMenuApproveOPReim();
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
        
        // Populate form with data
        populateFormFields(data);
        
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
            goToMenuApproveOPReim();
        });
    }
}

// Populate form fields with data from API
function populateFormFields(data) {
    // Populate header fields
    document.getElementById('CounterRef').value = data.counterRef || '';
    document.getElementById('RequesterName').value = data.requesterName || '';
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
    
    // Populate approval information
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
    toggleClosedByVisibility(data.transactionType);
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
    let netTotal = 0;
    
    // Calculate sum of all line amounts
    if (lines && lines.length > 0) {
        netTotal = lines.reduce((sum, line) => sum + (parseFloat(line.sumApplied) || 0), 0);
    }
    
    // Update total fields
    document.getElementById('netTotal').value = formatCurrency(netTotal);
    document.getElementById('totalTax').value = formatCurrency(0); // Assuming no tax for now
    document.getElementById('totalAmountDue').value = formatCurrency(netTotal);
}

// Populate approval information
function populateApprovalInfo(approval) {
    if (!approval) return;
    
    // Set prepared by
    if (approval.preparedBy) {
        document.getElementById('preparedBySearch').value = approval.preparedByName || approval.preparedBy;
    }
    
    // Set checked by
    if (approval.checkedBy) {
        document.getElementById('checkedBySearch').value = approval.checkedByName || approval.checkedBy;
    }
    
    // Set acknowledged by
    if (approval.acknowledgedBy) {
        document.getElementById('acknowledgedBySearch').value = approval.acknowledgedByName || approval.acknowledgedBy;
    }
    
    // Set approved by
    if (approval.approvedBy) {
        document.getElementById('approvedBySearch').value = approval.approvedByName || approval.approvedBy;
    }
    
    // Set received by
    if (approval.receivedBy) {
        document.getElementById('receivedBySearch').value = approval.receivedByName || approval.receivedBy;
    }
    
    // Set closed by
    if (approval.closedBy) {
        document.getElementById('closedBySearch').value = approval.closedByName || approval.closedBy;
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
    attachments.forEach(attachment => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex justify-between items-center p-2 border-b last:border-b-0';
        attachmentItem.dataset.id = attachment.id;
        
        attachmentItem.innerHTML = `
            <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span class="text-sm">${attachment.fileName || 'Attachment'}</span>
            </div>
            <div>
                <button type="button" class="text-blue-500 hover:text-blue-700 text-sm" onclick="viewAttachment('${attachment.id}')">
                    View
                </button>
            </div>
        `;
        
        attachmentsList.appendChild(attachmentItem);
    });
}

// View attachment
function viewAttachment(attachmentId) {
    const attachment = existingAttachments.find(a => a.id === attachmentId);
    
    if (!attachment || !attachment.fileUrl) {
        Swal.fire({
            title: 'Error',
            text: 'Attachment not found or cannot be viewed',
            icon: 'error'
        });
        return;
    }
    
    // Open attachment in new window/tab
    window.open(attachment.fileUrl, '_blank');
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
function goToMenuApproveOPReim() {
    window.location.href = '../../../dashboard/dashboardApprove/OPReim/menuOPReimApprove.html';
}

// Approve the outgoing payment reimbursement
async function approveOPReim() {
    try {
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
        
        // Get current user information
        const currentUser = getCurrentUser();
        const currentDate = new Date().toISOString();
        
        // Prepare request data based on the API structure
        const requestData = {
            stagingID: documentId,
            createdAt: outgoingPaymentReimData.approval?.createdAt || currentDate,
            updatedAt: currentDate,
            approvalStatus: "Approved",
            preparedBy: outgoingPaymentReimData.approval?.preparedBy || null,
            checkedBy: outgoingPaymentReimData.approval?.checkedBy || null,
            acknowledgedBy: outgoingPaymentReimData.approval?.acknowledgedBy || null,
            approvedBy: userId,
            receivedBy: outgoingPaymentReimData.approval?.receivedBy || null,
            preparedDate: outgoingPaymentReimData.approval?.preparedDate || null,
            preparedByName: outgoingPaymentReimData.approval?.preparedByName || null,
            checkedByName: outgoingPaymentReimData.approval?.checkedByName || null,
            acknowledgedByName: outgoingPaymentReimData.approval?.acknowledgedByName || null,
            approvedByName: currentUser?.username || null,
            receivedByName: outgoingPaymentReimData.approval?.receivedByName || null,
            checkedDate: outgoingPaymentReimData.approval?.checkedDate || null,
            acknowledgedDate: outgoingPaymentReimData.approval?.acknowledgedDate || null,
            approvedDate: currentDate,
            receivedDate: outgoingPaymentReimData.approval?.receivedDate || null,
            rejectedDate: outgoingPaymentReimData.approval?.rejectedDate || null,
            rejectionRemarks: outgoingPaymentReimData.approval?.rejectionRemarks || "",
            revisionNumber: outgoingPaymentReimData.approval?.revisionNumber || null,
            revisionDate: outgoingPaymentReimData.approval?.revisionDate || null,
            revisionRemarks: outgoingPaymentReimData.approval?.revisionRemarks || null,
            header: {}
        };
        
        // Make API request to update approval status using PUT method
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/approvals/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json-patch+json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            let errorMessage = `API error: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.Message || errorMessage;
            } catch (e) {
                console.error('Could not parse error response:', e);
            }
            throw new Error(errorMessage);
        }
        
        // Try to parse response data if available
        let responseData = null;
        try {
            responseData = await response.json();
        } catch (e) {
            console.log('Response does not contain JSON data');
        }
        
        // Show success message
        Swal.fire({
            title: 'Success',
            text: 'Document has been approved successfully',
            icon: 'success'
        }).then(() => {
            // Redirect back to menu
            goToMenuApproveOPReim();
        });
        
    } catch (error) {
        console.error('Error approving document:', error);
        
        Swal.fire({
            title: 'Error',
            text: `Failed to approve document: ${error.message}`,
            icon: 'error'
        });
    }
}

// Reject the outgoing payment reimbursement
async function rejectOPReim() {
    try {
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
            documentId: documentId,
            userId: userId,
            action: 'reject',
            remarks: rejectionReason
        };
        
        // Make API request to reject document
        const response = await makeAuthenticatedRequest('/api/approvals/reject-outgoing-payment', {
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
        goToMenuApproveOPReim();
        
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
            documentId: documentId,
            userId: userId,
            action: 'revise',
            remarks: allRemarks
        };
        
        // Make API request to request revision
        const response = await makeAuthenticatedRequest('/api/approvals/revise-outgoing-payment', {
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
        goToMenuApproveOPReim();
        
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