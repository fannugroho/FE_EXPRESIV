// acknowledgeOPReim.js - JavaScript for the Outgoing Payment Reimbursement acknowledgment page

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
            goToMenuAcknowOPReim();
        });
    }
    
    // Initialize event listeners
    initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {
    // Event listeners can be added here if needed in the future
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
        const response = await makeAuthenticatedRequest(`/api/staging-ar-invoice-clone/headers/${id}`, {
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
        
        // Hide buttons based on document status
        hideButtonsBasedOnStatus(data);
        
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
            goToMenuAcknowOPReim();
        });
    }
}

// Populate form fields with data
function populateFormFields(data) {
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
    setValue('remarks', data.remarks || '');
    setValue('journalRemarks', data.journalRemarks || '');
    
    // Map approval data
    if (data.approval) {
        populateApprovalInfo(data.approval);
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
    
    // Display Print Out Reimbursement document
    displayPrintOutReimbursement(data);
}

// Hide buttons based on document status
function hideButtonsBasedOnStatus(data) {
    const acknowledgeButton = document.querySelector('button[onclick="acknowledgeOPReim()"]');
    const rejectButton = document.querySelector('button[onclick="rejectOPReim()"]');
    
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
    
    // Hide both buttons if status is not 'Checked'
    if (currentStatus !== 'Checked') {
        if (acknowledgeButton) {
            acknowledgeButton.style.display = 'none';
        }
        if (rejectButton) {
            rejectButton.style.display = 'none';
        }
    } else {
        // Show buttons if status is 'Checked'
        if (acknowledgeButton) {
            acknowledgeButton.style.display = 'inline-block';
        }
        if (rejectButton) {
            rejectButton.style.display = 'inline-block';
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

// Populate table rows with line items
function populateTableRows(lines) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.error('tableBody element not found');
        return;
    }
    
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
    let netTotal = 0;
    
    // Calculate sum of all line amounts
    if (lines && lines.length > 0) {
        netTotal = lines.reduce((sum, line) => sum + (parseFloat(line.sumApplied) || 0), 0);
    }
    
    // Update total fields
    const totalAmountDueElement = document.getElementById('totalAmountDue');
    if (totalAmountDueElement) totalAmountDueElement.value = formatCurrency(netTotal);
}

// Populate approval information
function populateApprovalInfo(approval) {
    if (!approval) return;
    
    // Set prepared by
    if (approval.preparedBy) {
        const preparedBySearch = document.getElementById('preparedBySearch');
        if (preparedBySearch) preparedBySearch.value = approval.preparedByName || approval.preparedBy;
    }
    
    // Set checked by
    if (approval.checkedBy) {
        const checkedBySearch = document.getElementById('checkedBySearch');
        if (checkedBySearch) checkedBySearch.value = approval.checkedByName || approval.checkedBy;
    }
    
    // Set acknowledged by
    if (approval.acknowledgedBy) {
        const acknowledgedBySearch = document.getElementById('acknowledgedBySearch');
        if (acknowledgedBySearch) acknowledgedBySearch.value = approval.acknowledgedByName || approval.acknowledgedBy;
    }
    
    // Set approved by
    if (approval.approvedBy) {
        const approvedBySearch = document.getElementById('approvedBySearch');
        if (approvedBySearch) approvedBySearch.value = approval.approvedByName || approval.approvedBy;
    }
    
    // Set received by
    if (approval.receivedBy) {
        const receivedBySearch = document.getElementById('receivedBySearch');
        if (receivedBySearch) receivedBySearch.value = approval.receivedByName || approval.receivedBy;
    }
    
    // Set closed by

}

// Handle revision history
function handleRevisionHistory(approval) {
    if (!approval || !approval.revisionNumber || approval.revisionNumber <= 0) {
        return;
    }
    
    // Show revision history section
    const revisedRemarksSection = document.getElementById('revisedRemarksSection');
    if (revisedRemarksSection) revisedRemarksSection.style.display = 'block';
    
    // Update revision count
    const revisedCount = document.getElementById('revisedCount');
    if (revisedCount) revisedCount.textContent = approval.revisionNumber;
    
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
    if (revisedRemarksSection) {
        revisedRemarksSection.appendChild(revisionsContainer);
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
function goToMenuAcknowOPReim() {
    window.location.href = '../../../dashboard/dashboardAcknowledge/OPReim/menuOPReimAcknow.html';
}

// Acknowledge the outgoing payment reimbursement
async function acknowledgeOPReim() {
    try {
        // Show loading indicator
        Swal.fire({
            title: 'Processing...',
            text: 'Submitting acknowledgment',
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
            approvalStatus: "Acknowledged",
            preparedBy: outgoingPaymentReimData.approval?.preparedBy || null,
            checkedBy: outgoingPaymentReimData.approval?.checkedBy || null,
            acknowledgedBy: userId,
            approvedBy: outgoingPaymentReimData.approval?.approvedBy || null,
            receivedBy: outgoingPaymentReimData.approval?.receivedBy || null,
            preparedDate: outgoingPaymentReimData.approval?.preparedDate || null,
            preparedByName: outgoingPaymentReimData.approval?.preparedByName || currentUser?.username || null,
            checkedByName: outgoingPaymentReimData.approval?.checkedByName || null,
            acknowledgedByName: currentUser?.username || null,
            approvedByName: outgoingPaymentReimData.approval?.approvedByName || null,
            receivedByName: outgoingPaymentReimData.approval?.receivedByName || null,
            checkedDate: outgoingPaymentReimData.approval?.checkedDate || null,
            acknowledgedDate: currentDate,
            approvedDate: outgoingPaymentReimData.approval?.approvedDate || null,
            receivedDate: outgoingPaymentReimData.approval?.receivedDate || null,
            rejectedDate: outgoingPaymentReimData.approval?.rejectedDate || null,
            rejectionRemarks: outgoingPaymentReimData.approval?.rejectionRemarks || "",
            revisionNumber: outgoingPaymentReimData.approval?.revisionNumber || null,
            revisionDate: outgoingPaymentReimData.approval?.revisionDate || null,
            revisionRemarks: outgoingPaymentReimData.approval?.revisionRemarks || null,
            header: {}
        };
        
        // Make API request to update approval status using PUT method
        const response = await makeAuthenticatedRequest(`/api/staging-ar-invoice-clone/approvals/${documentId}`, {
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
            text: 'Document has been acknowledged successfully',
            icon: 'success'
        }).then(() => {
            // Redirect back to menu
            goToMenuAcknowOPReim();
        });
        
    } catch (error) {
        console.error('Error acknowledging document:', error);
        
        Swal.fire({
            title: 'Error',
            text: `Failed to acknowledge document: ${error.message}`,
            icon: 'error'
        });
    }
}

// Reject the outgoing payment reimbursement
async function rejectOPReim() {
    try {
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
        
        // Make API request to reject document using the approvals endpoint
        const response = await makeAuthenticatedRequest(`/api/staging-ar-invoice-clone/approvals/${documentId}`, {
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
        
        // Show success message
        await Swal.fire({
            title: 'Success',
            text: 'Document has been rejected',
            icon: 'success'
        });
        
        // Redirect back to menu
        goToMenuAcknowOPReim();
        
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
    let userRole = 'Acknowledger'; // Default role for this page
    
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