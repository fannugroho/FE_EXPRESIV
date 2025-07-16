// Global variables
let apiBaseUrl = 'https://api.example.com'; // Replace with actual API URL
let outgoingPaymentData = null;
let docId = null;

// Helper function to get logged-in user ID
function getUserId() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.id : null;
}

// Helper function to format number as currency with Indonesian format
function formatCurrencyIDR(number) {
    // Handle empty or invalid input
    if (number === null || number === undefined || number === '') {
        return '';
    }
    
    // Parse the number, ensuring we can handle very large values
    let num;
    try {
        // Handle string inputs that might be very large
        if (typeof number === 'string') {
            // Remove all non-numeric characters except decimal point and comma
            const cleanedStr = number.replace(/[^\d,-]/g, '').replace(',', '.');
            num = parseFloat(cleanedStr);
        } else {
            num = parseFloat(number);
        }
        
        // If parsing failed, return empty string
        if (isNaN(num)) {
            return '';
        }
    } catch (e) {
        console.error('Error parsing number:', e);
        return '';
    }
    
    // Format with Indonesian format (thousand separator: '.', decimal separator: ',')
    try {
        // Convert to string with fixed decimal places
        let parts = num.toFixed(2).split('.');
        let integerPart = parts[0];
        let decimalPart = parts.length > 1 ? parts[1] : '00';
        
        // Add thousand separators (dot) to integer part
        let formattedInteger = '';
        for (let i = 0; i < integerPart.length; i++) {
            if (i > 0 && (integerPart.length - i) % 3 === 0) {
                formattedInteger += '.'; // Use dot as thousand separator for Indonesian format
            }
            formattedInteger += integerPart.charAt(i);
        }
        
        // Return with comma as decimal separator
        return formattedInteger + ',' + decimalPart;
    } catch (e) {
        console.error('Error formatting number:', e);
        return number.toString();
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
    window.location.href = '../../../approvalPages/dashboard/dashboardReceive/OPReim/menuOPReimReceive.html';
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
        
        // Fetch document details from API
        const response = await fetch(`${apiBaseUrl}/api/op-reim/${docId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status && result.data) {
            outgoingPaymentData = result.data;
            
            // Populate form fields with document data
            populateFormFields(outgoingPaymentData);
            
            // Close loading indicator
            Swal.close();
        } else {
            throw new Error(result.message || 'Failed to load document details');
        }
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
    // Populate header fields
    document.getElementById('CounterRef').value = data.counterRef || '';
    document.getElementById('RequesterName').value = data.requesterName || '';
    document.getElementById('CardName').value = data.cardName || '';
    document.getElementById('Address').value = data.address || '';
    document.getElementById('DocNum').value = data.docNum || '';
    document.getElementById('Comments').value = data.comments || '';
    document.getElementById('JrnlMemo').value = data.jrnlMemo || '';
    
    // Format and set dates
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
    
    // Populate transfer account
    document.getElementById('TrsfrAcct').value = data.trsfrAcct || '';
    
    // Populate table rows
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    if (data.lines && data.lines.length > 0) {
        data.lines.forEach(line => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-2 border">${line.acctCode || ''}</td>
                <td class="p-2 border">${line.acctName || ''}</td>
                <td class="p-2 border">${line.description || ''}</td>
                <td class="p-2 border">${line.division || ''}</td>
                <td class="p-2 border text-right">${formatCurrencyIDR(line.docTotal || 0)}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Populate totals
    document.getElementById('netTotal').value = data.netTotal || 0;
    document.getElementById('totalTax').value = data.totalTax || 0;
    document.getElementById('totalAmountDue').value = data.totalAmountDue || 0;
    document.getElementById('TrsfrSum').value = data.trsfrSum || 0;
    
    // Populate remarks
    document.getElementById('remarks').value = data.remarks || '';
    document.getElementById('journalRemarks').value = data.journalRemarks || '';
    
    // Populate attachments
    if (data.attachments && data.attachments.length > 0) {
        const attachmentsList = document.getElementById('attachmentsList');
        attachmentsList.innerHTML = '';
        
        data.attachments.forEach(attachment => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'flex items-center justify-between p-2 border-b last:border-b-0';
            
            attachmentItem.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-sm">${attachment.fileName || 'Attachment'}</span>
                </div>
                <a href="${attachment.fileUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm">View</a>
            `;
            
            attachmentsList.appendChild(attachmentItem);
        });
    } else {
        document.getElementById('attachmentsList').innerHTML = '<div class="text-sm text-gray-500 p-2">No attachments</div>';
    }
    
    // Populate approval information
    if (data.preparedBy) {
        document.getElementById('preparedBySearch').value = data.preparedBy;
    }
    if (data.checkedBy) {
        document.getElementById('checkedBySearch').value = data.checkedBy;
    }
    if (data.acknowledgedBy) {
        document.getElementById('acknowledgedBySearch').value = data.acknowledgedBy;
    }
    if (data.approvedBy) {
        document.getElementById('approvedBySearch').value = data.approvedBy;
    }
    if (data.receivedBy) {
        document.getElementById('receivedBySearch').value = data.receivedBy;
    }
    if (data.closedBy) {
        document.getElementById('closedBySearch').value = data.closedBy;
    }
    
    // Show rejection remarks if document is rejected
    if (data.status === 'Rejected' && data.rejectionRemarks) {
        document.getElementById('rejectionRemarksSection').style.display = 'block';
        document.getElementById('rejectionRemarks').value = data.rejectionRemarks;
    } else {
        document.getElementById('rejectionRemarksSection').style.display = 'none';
    }
    
    // Show revision history if document has revisions
    if (data.revisions && data.revisions.length > 0) {
        document.getElementById('revisedRemarksSection').style.display = 'block';
        document.getElementById('revisedCount').textContent = data.revisions.length;
        
        const revisionsContainer = document.querySelector('#revisedRemarksSection .bg-gray-50');
        
        // Clear existing content after the count display
        const countDisplay = revisionsContainer.querySelector('.mb-2');
        revisionsContainer.innerHTML = '';
        revisionsContainer.appendChild(countDisplay);
        
        // Add each revision
        data.revisions.forEach((revision, index) => {
            const revisionItem = document.createElement('div');
            revisionItem.className = 'border-t pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0';
            
            revisionItem.innerHTML = `
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-semibold">${revision.revisedBy || 'Unknown User'}</span>
                    <span class="text-xs text-gray-500">${new Date(revision.revisedDate).toLocaleString()}</span>
                </div>
                <p class="text-sm">${revision.remarks || 'No remarks provided'}</p>
            `;
            
            revisionsContainer.appendChild(revisionItem);
        });
    } else {
        document.getElementById('revisedRemarksSection').style.display = 'none';
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
        
        // Prepare request data
        const requestData = {
            stagingID: docId,
            approvalStatus: "Received", // Status for Received
            preparedBy: outgoingPaymentData.preparedBy || null,
            checkedBy: outgoingPaymentData.checkedBy || null,
            acknowledgedBy: outgoingPaymentData.acknowledgedBy || null,
            approvedBy: outgoingPaymentData.approvedBy || null,
            receivedBy: userId, // Current user as receiver
            preparedDate: outgoingPaymentData.preparedDate || null,
            checkedDate: outgoingPaymentData.checkedDate || null,
            acknowledgedDate: outgoingPaymentData.acknowledgedDate || null,
            approvedDate: outgoingPaymentData.approvedDate || null,
            receivedDate: new Date().toISOString(), // Current date as received date
            header: outgoingPaymentData || {}
        };
        
        // Make API request to update approval status
        const response = await fetch(`${baseUrlDevAmiru}/api/staging-outgoing-payments/approvals/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
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

// Function to reject outgoing payment reimbursement
async function rejectOPReim() {
    try {
        // Prompt for rejection reason
        const result = await Swal.fire({
            title: 'Reject Document',
            input: 'textarea',
            inputLabel: 'Rejection Reason',
            inputPlaceholder: 'Enter reason for rejection...',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to provide a reason for rejection';
                }
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
        
        // Prepare data for API
        const rejectData = {
            id: docId,
            rejectedBy: userId,
            rejectionRemarks: result.value,
            rejectedDate: new Date().toISOString()
        };
        
        // Call API to reject document
        const response = await fetch(`${apiBaseUrl}/api/op-reim/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify(rejectData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        if (responseData.status) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Outgoing payment reimbursement rejected successfully'
            }).then(() => {
                goToMenuReceiveOPReim();
            });
        } else {
            throw new Error(responseData.message || 'Failed to reject document');
        }
    } catch (error) {
        console.error('Error rejecting document:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Failed to reject document: ${error.message}`
        });
    }
}

// Function to submit revision for outgoing payment reimbursement
async function revisionOPReim() {
    try {
        // Get revision remarks from all textarea fields in the revision container
        const revisionFields = document.querySelectorAll('#revisionContainer textarea');
        
        if (revisionFields.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Revision',
                text: 'Please add revision details before submitting'
            });
            return;
        }
        
        // Collect all revision remarks
        const revisionRemarks = Array.from(revisionFields).map(field => field.value.trim()).filter(Boolean);
        
        if (revisionRemarks.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Empty Revision',
                text: 'Please enter revision details before submitting'
            });
            return;
        }
        
        // Confirm action
        const result = await Swal.fire({
            title: 'Confirm Revision',
            text: 'Are you sure you want to submit this revision?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, submit revision',
            cancelButtonText: 'Cancel'
        });
        
        if (!result.isConfirmed) {
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
        
        // Prepare data for API
        const revisionData = {
            id: docId,
            revisedBy: userId,
            remarks: revisionRemarks.join('\n'),
            revisedDate: new Date().toISOString()
        };
        
        // Call API to submit revision
        const response = await fetch(`${apiBaseUrl}/api/op-reim/revision`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify(revisionData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        if (responseData.status) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Revision submitted successfully'
            }).then(() => {
                goToMenuReceiveOPReim();
            });
        } else {
            throw new Error(responseData.message || 'Failed to submit revision');
        }
    } catch (error) {
        console.error('Error submitting revision:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Failed to submit revision: ${error.message}`
        });
    }
} 