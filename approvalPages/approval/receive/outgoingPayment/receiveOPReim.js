// Global variables
// Using BASE_URL from auth.js instead of hardcoded apiBaseUrl
let outgoingPaymentData = null;
let docId = null;

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

// Helper function to format number as currency with Indonesian format
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
    
    // Get the string representation to check if it has decimal places
    const numStr = num.toString();
    const hasDecimal = numStr.includes('.');
    
    try {
        // Format with Indonesian locale (thousand separator: '.', decimal separator: ',')
        if (hasDecimal) {
            const decimalPlaces = numStr.split('.')[1].length;
            return num.toLocaleString('id-ID', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
            });
        } else {
            return num.toLocaleString('id-ID', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
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
        
        return sign + formattedInteger + decimalPart;
    }
}

// Helper function to parse Indonesian formatted currency back to number
function parseCurrencyIDR(formattedValue) {
    if (!formattedValue) return 0;
    
    try {
        // Handle Indonesian format (thousand separator: '.', decimal separator: ',')
        // Replace dots (thousand separators) with nothing, and comma (decimal separator) with dot
        const numericValue = formattedValue.toString()
            .replace(/\./g, '') // Remove thousand separators (dots)
            .replace(',', '.'); // Replace decimal separator (comma) with dot
        
        return parseFloat(numericValue) || 0;
    } catch (e) {
        console.error('Error parsing currency:', e);
        return 0;
    }
}

// Function to navigate back to the menu
function goToMenuReceiveOPReim() {
    window.location.href = '../../../dashboard/dashboardReceive/OPReim/menuOPReimReceive.html';
}

// Function to load document details when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Get document ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    docId = urlParams.get('id');
    
    if (!docId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No document ID provided'
        }).then(() => {
            goToMenuReceiveOPReim();
        });
        return;
    }
    
    // Load document details
    loadOutgoingPaymentDetails();
    
    // Add event listeners for revision fields
    document.addEventListener('input', function(e) {
        if (e.target.tagName === 'TEXTAREA' && e.target.closest('#revisionContainer')) {
            checkRevisionButton();
        }
    });
});

// Function to load outgoing payment details from API
async function loadOutgoingPaymentDetails() {
    try {
        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Fetch document details from API using the new staging endpoint
        const response = await fetch(`${BASE_URL}/api/staging-outgoing-payments/headers/${docId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        let result;
        try {
            result = await response.json();
            console.log('API Response:', result);
        } catch (jsonError) {
            console.error('Error parsing JSON response:', jsonError);
            const responseText = await response.text();
            console.error('Raw response:', responseText);
            throw new Error(`Invalid JSON response: ${jsonError.message}`);
        }
        
        // Handle API response - data is returned directly
        let documentData = result;
        
        outgoingPaymentData = documentData;
        
        // Populate form fields with document data
        populateFormFields(outgoingPaymentData);
        
        // Hide buttons based on document status
        hideButtonsBasedOnStatus(outgoingPaymentData);
        
        // Close loading indicator
        Swal.close();
    } catch (error) {
        console.error('Error loading document details:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Failed to load document details: ${error.message}`
        }).then(() => {
            goToMenuReceiveOPReim();
        });
    }
}

// Function to populate form fields with document data
function populateFormFields(data) {
    console.log('Populating form with data:', data);
    
    // Helper function to safely set value
    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };
    
    // Map header fields - Updated to match detailOPReim.js approach
    setValue('CounterRef', data.counterRef || '');
    setValue('RequesterName', data.requesterName || '');
    setValue('CardName', data.cardName || '');
    setValue('Address', data.address || '');
    setValue('DocNum', data.counterRef || ''); // Updated to use counterRef like detailOPReim.js
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
        console.log('Remarks data:', data.remarks);
        console.log('Journal Remarks data:', data.journalRemarks);
        console.log('Comments data:', data.comments);
        console.log('JrnlMemo data:', data.jrnlMemo);
        setValue('remarks', data.remarks || data.comments || '');
        setValue('journalRemarks', data.journalRemarks || data.jrnlMemo || '');
    
    // Map approval data
    if (data.approval) {
        // Show/hide rejection remarks based on status
        const rejSec = document.getElementById('rejectionRemarksSection');
        const rejTxt = document.getElementById('rejectionRemarks');
        if (data.approval.approvalStatus === 'Rejected') {
            if (rejSec) rejSec.style.display = 'block';
            if (rejTxt) rejTxt.value = data.approval.rejectionRemarks || '';
        } else {
            if (rejSec) rejSec.style.display = 'none';
            if (rejTxt) rejTxt.value = '';
        }
        
        // Populate approval fields
        setValue('preparedBySearch', data.approval.preparedByName || '');
        setValue('checkedBySearch', data.approval.checkedByName || '');
        setValue('acknowledgedBySearch', data.approval.acknowledgedByName || '');
        setValue('approvedBySearch', data.approval.approvedByName || '');
        setValue('receivedBySearch', data.approval.receivedByName || '');
        
        // Display status
        displayApprovalStatus(data.approval);
    } else {
        // If no approval data, show as Prepared
        displayApprovalStatus({ approvalStatus: 'Prepared' });
    }
    
    // Map table lines
    if (data.lines && data.lines.length > 0) {
        const tableBody = document.getElementById('tableBody');
        if (tableBody) {
            tableBody.innerHTML = '';
            data.lines.forEach(line => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="p-2 border">${line.acctCode || ''}</td>
                    <td class="p-2 border">${line.acctName || ''}</td>
                    <td class="p-2 border">${line.descrip || ''}</td>
                    <td class="p-2 border text-right">${formatCurrency(line.sumApplied || 0)}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    }
    
    // Display Print Out Reimbursement document
    displayPrintOutReimbursement(data);
    
    // Display attachments if available - Updated to match detailOPReim.js approach
    if (data.attachments && data.attachments.length > 0) {
        displayReimbursementAttachments(data.attachments);
    } else {
        // Show "No attachments found" message
        const container = document.getElementById('attachmentsList');
        if (container) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
        }
    }
}

// Hide buttons based on document status
function hideButtonsBasedOnStatus(data) {
    const receiveButton = document.querySelector('button[onclick="receiveOPReim()"]');
    const rejectButton = document.querySelector('button[onclick="rejectOPReim()"]');
    const printButton = document.getElementById('printButton');
    
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
    
    // Hide both buttons if status is not 'Approved'
    if (currentStatus !== 'Approved') {
        if (receiveButton) {
            receiveButton.style.display = 'none';
        }
        if (rejectButton) {
            rejectButton.style.display = 'none';
        }
    } else {
        // Show buttons if status is 'Approved'
        if (receiveButton) {
            receiveButton.style.display = 'inline-block';
        }
        if (rejectButton) {
            rejectButton.style.display = 'inline-block';
        }
    }
    
    // Show print button only if status is 'Received'
    if (printButton) {
        if (currentStatus === 'Received') {
            printButton.style.display = 'inline-block';
        } else {
            printButton.style.display = 'none';
        }
    }
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

// Function to receive outgoing payment reimbursement
async function receiveOPReim() {
    try {
        // Show loading indicator
        Swal.fire({
            title: 'Processing...',
            text: 'Submitting receipt confirmation',
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
        
        // Get transfer date
        const transferDate = document.getElementById('TrsfrDate').value;
        if (!transferDate) {
            throw new Error('Transfer date is required');
        }
        
        // Update outgoing payment data with transfer date
        outgoingPaymentData.trsfrDate = transferDate;
        
        // Get current user information
        const currentUser = getCurrentUser();
        const currentDate = new Date().toISOString();
        
        // Prepare request data based on the API structure
        const requestData = {
            stagingID: docId,
            createdAt: outgoingPaymentData.createdAt || currentDate,
            updatedAt: currentDate,
            approvalStatus: "Received",
            preparedBy: outgoingPaymentData.approval?.preparedBy || null,
            checkedBy: outgoingPaymentData.approval?.checkedBy || null,
            acknowledgedBy: outgoingPaymentData.approval?.acknowledgedBy || null,
            approvedBy: outgoingPaymentData.approval?.approvedBy || null,
            receivedBy: userId,
            preparedDate: outgoingPaymentData.approval?.preparedDate || null,
            preparedByName: outgoingPaymentData.approval?.preparedByName || null,
            checkedByName: outgoingPaymentData.approval?.checkedByName || null,
            acknowledgedByName: outgoingPaymentData.approval?.acknowledgedByName || null,
            approvedByName: outgoingPaymentData.approval?.approvedByName || null,
            receivedByName: currentUser?.username || null,
            checkedDate: outgoingPaymentData.approval?.checkedDate || null,
            acknowledgedDate: outgoingPaymentData.approval?.acknowledgedDate || null,
            approvedDate: outgoingPaymentData.approval?.approvedDate || null,
            receivedDate: currentDate,
            rejectedDate: outgoingPaymentData.approval?.rejectedDate || null,
            rejectionRemarks: outgoingPaymentData.approval?.rejectionRemarks || "",
            revisionNumber: outgoingPaymentData.approval?.revisionNumber || null,
            revisionDate: outgoingPaymentData.approval?.revisionDate || null,
            revisionRemarks: outgoingPaymentData.approval?.revisionRemarks || null,
            header: {}
        };
        
        // Make API request to update approval status using PUT method
        const response = await fetch(`${BASE_URL}/api/staging-outgoing-payments/approvals/${docId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json-patch+json',
                'Authorization': `Bearer ${getAccessToken()}`
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
            text: 'Document has been received successfully',
            icon: 'success'
        }).then(() => {
            // Redirect back to menu
            goToMenuReceiveOPReim();
        });
        
    } catch (error) {
        console.error('Error receiving document:', error);
        
        Swal.fire({
            title: 'Error',
            text: `Failed to receive document: ${error.message}`,
            icon: 'error'
        });
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
    let userRole = 'Receiver'; // Default role for this page
    
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

// Function to reject outgoing payment reimbursement
async function rejectOPReim() {
    try {
        // Create custom dialog with single field
        const result = await Swal.fire({
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
        
        if (!result.isConfirmed || !result.value) {
            return;
        }
        
        // Show loading indicator
        Swal.fire({
            title: 'Processing...',
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
        
        // Prepare request data for rejection
        const requestData = {
            stagingID: docId,
            createdAt: outgoingPaymentData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvalStatus: "Rejected",
            preparedBy: outgoingPaymentData.approval?.preparedBy || null,
            checkedBy: outgoingPaymentData.approval?.checkedBy || null,
            acknowledgedBy: outgoingPaymentData.approval?.acknowledgedBy || null,
            approvedBy: outgoingPaymentData.approval?.approvedBy || null,
            receivedBy: outgoingPaymentData.approval?.receivedBy || null,
            preparedDate: outgoingPaymentData.approval?.preparedDate || null,
            preparedByName: outgoingPaymentData.approval?.preparedByName || null,
            checkedByName: outgoingPaymentData.approval?.checkedByName || null,
            acknowledgedByName: outgoingPaymentData.approval?.acknowledgedByName || null,
            approvedByName: outgoingPaymentData.approval?.approvedByName || null,
            receivedByName: outgoingPaymentData.approval?.receivedByName || null,
            checkedDate: outgoingPaymentData.approval?.checkedDate || null,
            acknowledgedDate: outgoingPaymentData.approval?.acknowledgedDate || null,
            approvedDate: outgoingPaymentData.approval?.approvedDate || null,
            receivedDate: outgoingPaymentData.approval?.receivedDate || null,
            rejectedDate: new Date().toISOString(),
            rejectionRemarks: result.value,
            revisionNumber: outgoingPaymentData.approval?.revisionNumber || null,
            revisionDate: outgoingPaymentData.approval?.revisionDate || null,
            revisionRemarks: outgoingPaymentData.approval?.revisionRemarks || null,
            header: {}
        };
        
        // Also add rejectionRemarks at root level in case backend expects it there
        requestData.rejectionRemarks = result.value;
        
        // Call API to reject document using the approvals endpoint
        const response = await fetch(`${BASE_URL}/api/staging-outgoing-payments/approvals/${docId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
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
        goToMenuReceiveOPReim();
    } catch (error) {
        console.error('Error rejecting document:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Failed to reject document: ${error.message}`
        });
    }
}

// Function to print OP Reimbursement voucher
function printOPReim() {
    try {
        // Store current data in localStorage for the print page to access
        if (outgoingPaymentData) {
            localStorage.setItem(`opReimData_${docId}`, JSON.stringify(outgoingPaymentData));
        }
        
        // Open print page in new window
        const printUrl = `printOPReim.html?docId=${docId}`;
        window.open(printUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    } catch (error) {
        console.error('Error opening print page:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to open print page. Please try again.'
        });
    }
}

// Function to display reimbursement attachments (matching detailOPReim.js approach)
function displayReimbursementAttachments(attachments) {
    const container = document.getElementById('attachmentsList');
    if (!container) {
        console.warn('Attachments container not found: attachmentsList');
        return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    if (!attachments || attachments.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
        return;
    }
    
    // Add header
    const header = document.createElement('div');
    header.className = 'mt-4 mb-2';
    header.innerHTML = '<h4 class="text-md font-medium text-blue-800">Reimbursement Attachments</h4>';
    container.appendChild(header);
    
    // Create attachment list
    const attachmentList = document.createElement('div');
    attachmentList.className = 'space-y-2 mb-4';
    
    attachments.forEach((attachment, index) => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'flex items-center space-x-2';
        
        // File icon based on type
        const fileIcon = getFileIcon(attachment.fileName || attachment.name);
        
        fileInfo.innerHTML = `
            <span class="text-lg">${fileIcon}</span>
            <div>
                <div class="font-medium text-sm">${attachment.fileName || attachment.name || 'Unknown File'}</div>
                <div class="text-xs text-gray-500">${formatFileSize(attachment.fileSize || attachment.size)} • ${attachment.fileType || attachment.contentType || 'Unknown Type'}</div>
                <div class="text-xs text-blue-600">Reimbursement Attachment • Uploaded: ${formatDate(attachment.uploadDate || attachment.createdAt)}</div>
            </div>
        `;
        
        const actions = document.createElement('div');
        actions.className = 'flex space-x-2';
        
        // View button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50';
        viewBtn.innerHTML = 'View';
        viewBtn.onclick = () => viewReimbursementAttachment(attachment);
        
        actions.appendChild(viewBtn);
        
        attachmentItem.appendChild(fileInfo);
        attachmentItem.appendChild(actions);
        attachmentList.appendChild(attachmentItem);
    });
    
    container.appendChild(attachmentList);
}

// Function to get file icon based on file name
function getFileIcon(fileName) {
    if (!fileName) return '📄';
    
    const extension = fileName.toLowerCase().split('.').pop();
    
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
        case 'txt':
            return '📄';
        default:
            return '📄';
    }
}

// Function to format file size
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to format date
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return 'Unknown';
    }
}

// Function to view reimbursement attachment
async function viewReimbursementAttachment(attachment) {
    try {
        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            text: 'Loading attachment, please wait...',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Use the filePath from the attachment
        if (attachment.filePath) {
            // Close loading indicator
            Swal.close();
            
            // Use the base URL from the API endpoint
            const decodedPath = decodeURIComponent(attachment.filePath);
            const fileUrl = `${BASE_URL}${decodedPath.startsWith('/') ? decodedPath : '/' + decodedPath}`;
            
            // Open file in new tab
            window.open(fileUrl, '_blank');
            return;
        }

        throw new Error('No file path available for this attachment');

    } catch (error) {
        console.error('Error viewing reimbursement attachment:', error);
        
        // Close loading indicator
        Swal.close();
        
        Swal.fire({
            title: 'Error',
            text: `Failed to view attachment: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}