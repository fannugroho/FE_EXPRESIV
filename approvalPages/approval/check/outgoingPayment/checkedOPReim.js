// checkedOPReim.js - JavaScript for the Outgoing Payment Reimbursement checking page

// Global variables
let outgoingPaymentReimData = null;
let uploadedFiles = [];
let existingAttachments = [];
let attachmentsToKeep = [];
let documentId = null;

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
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

        // Console log untuk melihat struktur data lengkap
        console.log('=== DATA LENGKAP DARI API ===');
        console.log('Data:', data);
        console.log('Remittance Request Amount:', data.remittanceRequestAmount);
        console.log('Document Currency (docCurr):', data.docCurr);
        console.log('Transfer Sum (trsfrSum):', data.trsfrSum);
        console.log('=== END DATA LENGKAP ===');

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

    // Console log untuk melihat data yang masuk
    console.log('Data yang masuk ke populateFormFields:', data);
    console.log('Remittance Request Amount:', data.remittanceRequestAmount);

    // Map header fields
    setValue('CounterRef', data.counterRef || '');
    setValue('RequesterName', data.requesterName || '');
    setValue('CardName', data.cardName || '');
    setValue('Address', data.address || '');
    // DocNum should use counterRef like in detail page
    setValue('DocNum', data.counterRef || data.docNum || '');
    setValue('JrnlMemo', data.jrnlMemo || '');
    setValue('DocCurr', data.docCurr || 'IDR');
    setValue('RemittanceRequestAmount', formatCurrency(data.remittanceRequestAmount || 0));
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
    let netTotal = 0;
    let totalAmountDue = 0;
    const currencySummary = {};

    if (data.lines && data.lines.length > 0) {
        data.lines.forEach((line, index) => {
            console.log(`Line ${index}:`, line);
            const amount = line.sumApplied || 0;
            const currency = line.CurrencyItem || line.currencyItem || 'IDR';

            netTotal += amount;
            totalAmountDue += amount;

            currencySummary[currency] = (currencySummary[currency] || 0) + amount;
        });
    }

    console.log('Totals Calculation:', { netTotal, totalAmountDue, currencySummary });

    // Update total fields
    setValue('netTotal', formatCurrency(netTotal));
    setValue('totalTax', formatCurrency(0));
    setValue('totalAmountDue', formatCurrency(totalAmountDue));

    // Display currency summaries
    displayCurrencySummary(currencySummary);
    updateTotalOutstandingTransfers(currencySummary);

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

    // Handle attachments like detail page
    handleAttachments(data, documentId);

    // Display Print Out Reimbursement document
    displayPrintOutReimbursement(data);

    // Handle reimbursement data if exists
    handleReimbursementData(data);
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
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Clear existing rows

    if (!lines || lines.length === 0) {
        // Add empty row if no lines
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" class="p-8 text-center text-gray-500">
                <div class="loading-shimmer h-4 rounded mx-auto w-1/2 mb-2"></div>
                <div class="loading-shimmer h-4 rounded mx-auto w-1/3"></div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    // Add each line as a row
    lines.forEach((line, index) => {
        const amount = line.sumApplied || 0;

        console.log(`📋 Line ${index} data:`, {
            acctCode: line.acctCode,
            acctName: line.acctName,
            descrip: line.descrip,
            division: line.division,
            divisionCode: line.divisionCode,
            currencyItem: line.CurrencyItem || line.currencyItem,
            sumApplied: amount
        });

        const row = createTableRow(line, amount);
        tableBody.appendChild(row);
    });
}

/**
 * Creates a table row element with all 6 columns
 * @param {Object} line - Line data object
 * @param {number} amount - Amount value
 * @returns {HTMLElement} - Table row element
 */
function createTableRow(line, amount) {
    const row = document.createElement('tr');
    const cells = [
        line.acctCode || '',
        line.acctName || '',
        line.descrip || '',
        line.divisionCode || line.division || '',
        line.CurrencyItem || line.currencyItem || 'IDR',
        formatCurrencyWithTwoDecimals(amount)
    ];

    row.innerHTML = cells.map((cell, index) => {
        const isLastCell = index === 5;
        const cellClass = `p-3 border-b${isLastCell ? ' text-right font-mono' : ''}`;
        return `<td class="${cellClass}">${cell}</td>`;
    }).join('');

    return row;
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



// Legacy display attachments function - now redirects to enhanced version
function displayAttachments(attachments) {
    console.log('Legacy displayAttachments called, redirecting to displayExistingAttachments:', attachments);

    // Use the enhanced display function instead
    displayExistingAttachments(attachments);

    // Also store for backward compatibility with old viewAttachment function
    existingAttachments = attachments ? [...attachments] : [];
    attachmentsToKeep = attachments ? [...attachments.map(a => a.id || a.attachmentId || a.fileId)] : [];
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Currency Summary Display Functions
function displayCurrencySummary(currencySummary) {
    const container = document.getElementById('currencySummaryTable');
    if (!container) {
        console.warn('Currency summary container not found');
        return;
    }

    if (!currencySummary || Object.keys(currencySummary).length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No amounts to display</p>';
        return;
    }

    const summaryEntries = Object.entries(currencySummary)
        .map(([currency, amount]) =>
            `<div class="text-base text-gray-700 font-mono font-semibold">
                ${currency} ${formatCurrencyWithTwoDecimals(amount)}
            </div>`
        ).join('');

    container.innerHTML = `
        <div class="space-y-2">
            <div class="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-2">
                Total Amount Due by Currency:
            </div>
            ${summaryEntries}
        </div>
    `;
}

function updateTotalOutstandingTransfers(currencySummary) {
    const container = document.getElementById('totalOutstandingTransfers');
    if (!container) {
        console.warn('Total outstanding transfers container not found');
        return;
    }

    if (!currencySummary || Object.keys(currencySummary).length === 0) {
        container.textContent = 'No outstanding transfers';
        return;
    }

    const transferEntries = Object.entries(currencySummary)
        .filter(([, amount]) => amount > 0)
        .map(([currency, amount]) =>
            `<div class="text-base text-gray-700 font-mono font-semibold leading-relaxed">
                ${currency} ${numberToWords(amount)}
            </div>`
        ).join('');

    container.innerHTML = `<div class="space-y-3">${transferEntries}</div>`;
}

// Number to Words Conversion (same as detail page)
function numberToWords(num) {
    if (num === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    function convertLessThanOneThousand(n) {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanOneThousand(n % 100) : '');
    }

    function convert(n) {
        if (n === 0) return 'Zero';

        const scales = [
            { value: 1000000000000, name: 'Trillion' },
            { value: 1000000000, name: 'Billion' },
            { value: 1000000, name: 'Million' },
            { value: 1000, name: 'Thousand' }
        ];

        let result = '';
        let remaining = n;

        for (const scale of scales) {
            const count = Math.floor(remaining / scale.value);
            if (count > 0) {
                result += (result ? ' ' : '') + convertLessThanOneThousand(count) + ' ' + scale.name;
                remaining %= scale.value;
            }
        }

        if (remaining > 0) {
            result += (result ? ' ' : '') + convertLessThanOneThousand(remaining);
        }

        return result;
    }

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let result = convert(integerPart);
    if (decimalPart > 0) {
        result += ' and ' + convert(decimalPart) + ' Cents';
    }

    return result;
}

// Enhanced currency formatting with two decimals
function formatCurrencyWithTwoDecimals(number) {
    if (number === null || number === undefined || number === '') {
        return '0.00';
    }

    let num;
    try {
        if (typeof number === 'string') {
            const cleanedStr = number.replace(/[^\d,.]/g, '');
            num = cleanedStr.length > 15 ?
                Number(cleanedStr.replace(/,/g, '')) :
                parseFloat(cleanedStr.replace(/,/g, ''));
        } else {
            num = Number(number);
        }

        if (isNaN(num)) return '0.00';
    } catch (e) {
        console.error('Error parsing number:', e);
        return '0.00';
    }

    const maxAmount = 100000000000000;
    const limitedNum = Math.min(num, maxAmount);

    if (limitedNum >= 1e12) {
        return formatLargeNumberFallback(limitedNum);
    } else {
        return limitedNum.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

function formatLargeNumberFallback(num) {
    const strNum = num.toString();
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
}

// Enhanced Attachment Handling Functions (same as detail page)

// Handles attachment loading like detail page
async function handleAttachments(result, docId) {
    console.log('handleAttachments called with result:', result);
    console.log('Document ID:', docId);
    console.log('result.attachments:', result.attachments);
    console.log('result.attachments length:', result.attachments?.length);

    if (result.attachments?.length > 0) {
        console.log('Attachments found in main response:', result.attachments);
        displayExistingAttachments(result.attachments);
    } else {
        console.log('No attachments in main response, trying API endpoint');
        await loadAttachmentsFromAPI(docId);
    }
}

// Handle reimbursement related data
async function handleReimbursementData(result) {
    if (!result.expressivNo) return;

    console.log('Outgoing payment created from reimbursement:', result.expressivNo);

    try {
        const reimResponse = await makeAuthenticatedRequest(`/api/reimbursements/${result.expressivNo}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (reimResponse.ok) {
            const reimResult = await reimResponse.json();
            if (reimResult?.data?.voucherNo) {
                const setValue = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.value = value;
                };
                setValue('CounterRef', reimResult.data.voucherNo);
            }
        }

        await loadReimbursementAttachments(result.expressivNo);
    } catch (err) {
        console.warn('Could not fetch reimbursement voucherNo:', err);
    }
}

// Enhanced attachment display like detail page
function displayExistingAttachments(attachments) {
    const container = document.getElementById('attachmentsList');
    if (!container) {
        console.error('Attachments container not found');
        return;
    }

    console.log('displayExistingAttachments called with:', attachments);
    console.log('Attachments is array:', Array.isArray(attachments));
    console.log('Attachments length:', attachments?.length);

    // Clear the container completely to prevent duplication
    container.innerHTML = '';

    // Enhanced debugging
    if (!attachments) {
        console.log('No attachments provided (null/undefined)');
        container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
        return;
    }

    if (!Array.isArray(attachments)) {
        console.log('Attachments is not an array:', typeof attachments);
        container.innerHTML = '<p class="text-gray-500 text-sm">Invalid attachment data</p>';
        return;
    }

    if (attachments.length === 0) {
        console.log('Attachments array is empty');
        container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
        return;
    }

    console.log('Displaying', attachments.length, 'attachments:', attachments);

    const attachmentItems = attachments.map((attachment, index) => {
        console.log(`Processing attachment ${index}:`, attachment);

        const fileName = attachment.fileName || attachment.name || `Attachment ${index + 1}`;
        const fileIcon = getFileIcon(fileName);
        const fileSize = formatFileSize(attachment.fileSize || attachment.size);
        const uploadDate = formatDate(attachment.uploadDate || attachment.createdAt);

        return createAttachmentItem(attachment, fileName, fileIcon, fileSize, uploadDate);
    }).join('');

    container.innerHTML = `
        <h4 class="text-md font-medium text-gray-700 mb-2">Outgoing Payment Attachments</h4>
        ${attachmentItems}
    `;

    console.log('Successfully displayed attachment items in container');
}

// Creates attachment item HTML like detail page
function createAttachmentItem(attachment, fileName, fileIcon, fileSize, uploadDate) {
    const attachmentJson = JSON.stringify(attachment).replace(/"/g, '&quot;');

    return `
        <div class="flex items-center justify-between p-2 mb-2 bg-gray-50 rounded border">
            <div class="flex items-center space-x-2">
                <span class="text-lg">${fileIcon}</span>
                <div>
                    <div class="font-medium text-sm">${fileName}</div>
                    <div class="text-xs text-gray-500">${fileSize} • ${attachment.fileType || attachment.contentType || 'Unknown Type'}</div>
                    <div class="text-xs text-gray-400">Outgoing Payment Attachment • Uploaded: ${uploadDate}</div>
                </div>
            </div>
            <div class="flex space-x-2">
                <button onclick="viewEnhancedAttachment(${attachmentJson})" 
                        class="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50">
                    View
                </button>
            </div>
        </div>
    `;
}

// Enhanced attachment viewing like detail page
async function viewEnhancedAttachment(attachmentOrPath, fileName) {
    try {
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

        const docId = documentId;
        if (!docId) {
            throw new Error('Document ID not found. Please ensure you are viewing an existing document.');
        }

        const attachment = normalizeAttachment(attachmentOrPath, fileName);

        if (attachment.filePath) {
            await openAttachmentFile(attachment.filePath);
            return;
        }

        await fetchAndOpenAttachment(docId, attachment);

    } catch (error) {
        console.error('Error viewing attachment:', error);
        Swal.fire({
            title: 'Error',
            text: `Failed to view attachment: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// File icon helper like detail page
function getFileIcon(fileName) {
    if (!fileName || typeof fileName !== 'string') return '📄';

    const extension = fileName.split('.').pop()?.toLowerCase();
    const icons = {
        pdf: '📄',
        doc: '📝',
        docx: '📝',
        xls: '📊',
        xlsx: '📊',
        jpg: '🖼️',
        jpeg: '🖼️',
        png: '🖼️'
    };
    return icons[extension] || '📄';
}

// Format date helper like detail page
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

// Loads attachments from API like detail page
async function loadAttachmentsFromAPI(docId) {
    try {
        console.log('Attempting to load attachments for document:', docId);

        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/attachments/${docId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('Attachments API response status:', response.status);

        if (!response.ok) {
            await handleAttachmentLoadError(response, docId);
            return;
        }

        const result = await response.json();
        console.log('Attachments API response data:', result);

        if (result.data?.length > 0) {
            displayExistingAttachments(result.data);
        } else {
            showNoAttachmentsMessage();
        }

    } catch (error) {
        console.error("Error loading attachments:", error);
        showAttachmentError();
    }
}

// Handle attachment loading errors like detail page
async function handleAttachmentLoadError(response, docId) {
    if (response.status === 404) {
        console.warn(`No attachments found for document ${docId}`);
        showNoAttachmentsMessage();
        return;
    }

    if (response.status === 405) {
        console.warn('GET method not allowed on attachments endpoint, trying alternative approach');

        const mainResponse = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/headers/${docId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (mainResponse.ok) {
            const mainResult = await mainResponse.json();
            if (mainResult.attachments?.length > 0) {
                console.log('Found attachments in main response:', mainResult.attachments);
                displayExistingAttachments(mainResult.attachments);
                return;
            }
        }

        showNoAttachmentsMessage();
        return;
    }

    console.warn(`Failed to load attachments: ${response.status}`);
    showAttachmentError();
}

// Normalize attachment parameter like detail page
function normalizeAttachment(attachmentOrPath, fileName) {
    if (typeof attachmentOrPath === 'string') {
        return { filePath: attachmentOrPath, fileName: fileName };
    }
    return attachmentOrPath;
}

// Open attachment file like detail page
async function openAttachmentFile(filePath) {
    console.log('Using direct filePath:', filePath);

    Swal.close();

    const fileUrl = constructFileUrl(filePath);
    if (!fileUrl) {
        throw new Error('Failed to construct file URL');
    }

    window.open(fileUrl, '_blank');
    Swal.fire({
        title: 'Success',
        text: 'Attachment opened in new tab',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    });
}

// Construct file URL like detail page (using correct BASE_URL)
function constructFileUrl(filePath) {
    if (!filePath) {
        console.error('No file path provided');
        return null;
    }

    try {
        const decodedPath = decodeURIComponent(filePath);
        const cleanPath = decodedPath.replace(/^\/+/, '');
        // Use BASE_URL from auth.js instead of window.location.origin
        const fileUrl = `${BASE_URL}/${cleanPath}`;

        console.log('File URL construction:', {
            originalPath: filePath,
            decodedPath,
            cleanPath,
            baseUrl: BASE_URL,
            finalURL: fileUrl
        });

        return fileUrl;
    } catch (error) {
        console.error('Error constructing file URL:', error);
        return null;
    }
}

// Fetch and open attachment from API like detail page
async function fetchAndOpenAttachment(docId, attachment) {
    console.log('Fetching attachments from API for document:', docId);

    const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/attachments/${docId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        await handleAttachmentFetchError(response, docId, attachment);
        return;
    }

    const result = await response.json();
    const targetAttachment = findTargetAttachment(result.data, attachment);

    if (!targetAttachment?.filePath) {
        throw new Error('Attachment not found or file path not available');
    }

    await openAttachmentFile(targetAttachment.filePath);
}

// Handle attachment fetch errors like detail page
async function handleAttachmentFetchError(response, docId, attachment) {
    if (response.status === 404) {
        console.warn(`No attachments found for document ${docId}`);
        Swal.close();
        Swal.fire({
            title: 'No Attachments',
            text: 'No attachments found for this document.',
            icon: 'info',
            confirmButtonText: 'OK'
        });
        return;
    }

    if (response.status === 405) {
        await tryAlternativeAttachmentFetch(docId, attachment);
        return;
    }

    throw new Error(`Failed to fetch attachment: ${response.status}`);
}

// Try alternative attachment fetch like detail page
async function tryAlternativeAttachmentFetch(docId, attachment) {
    console.warn('GET method not allowed on attachments endpoint, trying main document endpoint');

    const mainResponse = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/headers/${docId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!mainResponse.ok) {
        throw new Error(`Failed to fetch attachment: ${mainResponse.status}`);
    }

    const mainResult = await mainResponse.json();
    const targetAttachment = findTargetAttachment(mainResult.attachments, attachment);

    if (!targetAttachment?.filePath) {
        throw new Error('Attachment not found');
    }

    await openAttachmentFile(targetAttachment.filePath);
}

// Find target attachment like detail page
function findTargetAttachment(attachments, target) {
    if (!attachments?.length) return null;

    return attachments.find(att =>
        att.id === target.id ||
        att.fileName === target.fileName ||
        att.filePath === target.filePath
    );
}

// Load reimbursement attachments like detail page
async function loadReimbursementAttachments(reimbursementId) {
    try {
        console.log('Loading reimbursement attachments for ID:', reimbursementId);

        const response = await makeAuthenticatedRequest(`/api/reimbursements/${reimbursementId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            console.warn(`Failed to load reimbursement data: ${response.status}`);
            return;
        }

        const result = await response.json();

        if (result.data?.reimbursementAttachments?.length > 0) {
            console.log('Found reimbursement attachments:', result.data.reimbursementAttachments);
            appendReimbursementAttachmentsSection(result.data.reimbursementAttachments);
        } else {
            console.log('No reimbursement attachments found');
        }

    } catch (error) {
        console.error("Error loading reimbursement attachments:", error);
    }
}

// Append reimbursement attachments section like detail page
function appendReimbursementAttachmentsSection(attachments) {
    const container = document.getElementById('attachmentsList');
    if (!container) return;

    // Check if reimbursement header already exists to prevent duplication
    const existingHeader = container.querySelector('.reimbursement-header');
    if (!existingHeader) {
        const reimbursementHeader = document.createElement('div');
        reimbursementHeader.className = 'mt-4 mb-2 reimbursement-header';
        reimbursementHeader.innerHTML = '<h4 class="text-md font-medium text-blue-800">Reimbursement Attachments</h4>';
        container.appendChild(reimbursementHeader);
    }

    displayReimbursementAttachments(attachments);
}

// Display reimbursement attachments like detail page
function displayReimbursementAttachments(attachments) {
    const container = document.getElementById('attachmentsList');
    if (!container || !attachments?.length) return;

    // Check if reimbursement attachment list already exists to prevent duplication
    let attachmentList = container.querySelector('.reimbursement-attachments-list');
    if (!attachmentList) {
        attachmentList = document.createElement('div');
        attachmentList.className = 'space-y-2 mb-4 reimbursement-attachments-list';
        container.appendChild(attachmentList);
    } else {
        // Clear existing content if list already exists
        attachmentList.innerHTML = '';
    }

    attachments.forEach(attachment => {
        const attachmentItem = createReimbursementAttachmentItem(attachment);
        attachmentList.appendChild(attachmentItem);
    });
}

// Create reimbursement attachment item like detail page
function createReimbursementAttachmentItem(attachment) {
    const attachmentItem = document.createElement('div');
    attachmentItem.className = 'flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200';

    const fileInfo = createReimbursementFileInfo(attachment);
    const actions = createReimbursementActions(attachment);

    attachmentItem.appendChild(fileInfo);
    attachmentItem.appendChild(actions);

    return attachmentItem;
}

// Create file info for reimbursement attachment like detail page
function createReimbursementFileInfo(attachment) {
    const fileInfo = document.createElement('div');
    fileInfo.className = 'flex items-center space-x-2';

    const fileIcon = getFileIcon(attachment.fileName || attachment.name);
    const fileName = attachment.fileName || attachment.name || 'Unknown File';
    const fileSize = formatFileSize(attachment.fileSize || attachment.size);
    const fileType = attachment.fileType || attachment.contentType || 'Unknown Type';
    const uploadDate = formatDate(attachment.uploadDate || attachment.createdAt);

    fileInfo.innerHTML = `
        <span class="text-lg">${fileIcon}</span>
        <div>
            <div class="font-medium text-sm">${fileName}</div>
            <div class="text-xs text-gray-500">${fileSize} • ${fileType}</div>
            <div class="text-xs text-blue-600">Reimbursement Attachment • Uploaded: ${uploadDate}</div>
        </div>
    `;

    return fileInfo;
}

// Create actions for reimbursement attachment like detail page
function createReimbursementActions(attachment) {
    const actions = document.createElement('div');
    actions.className = 'flex space-x-2';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50';
    viewBtn.innerHTML = 'View';
    viewBtn.onclick = () => viewReimbursementAttachment(attachment);

    actions.appendChild(viewBtn);
    return actions;
}

// View reimbursement attachment like detail page
async function viewReimbursementAttachment(attachment) {
    try {
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

        if (attachment.filePath) {
            Swal.close();

            const decodedPath = decodeURIComponent(attachment.filePath);
            // Use BASE_URL from auth.js instead of window.location.origin
            const fileUrl = `${BASE_URL}${decodedPath.startsWith('/') ? decodedPath : '/' + decodedPath}`;

            console.log('Reimbursement attachment URL construction:', {
                originalPath: attachment.filePath,
                decodedPath,
                baseUrl: BASE_URL,
                finalURL: fileUrl
            });

            window.open(fileUrl, '_blank');
            return;
        }

        throw new Error('No file path available for this attachment');

    } catch (error) {
        console.error('Error viewing reimbursement attachment:', error);
        Swal.close();
        Swal.fire({
            title: 'Error',
            text: `Failed to view attachment: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Helper functions like detail page
function showNoAttachmentsMessage() {
    const container = document.getElementById('attachmentsList');
    if (container) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
    }
}

function showAttachmentError() {
    const container = document.getElementById('attachmentsList');
    if (container) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Error loading attachments</p>';
    }
}

// View attachment
function viewAttachment(attachmentId) {
    console.log('Viewing attachment with ID:', attachmentId);
    console.log('Available attachments:', existingAttachments);

    if (!existingAttachments || existingAttachments.length === 0) {
        console.error('No attachments available');
        Swal.fire({
            title: 'Error',
            text: 'No attachments are currently available',
            icon: 'error'
        });
        return;
    }

    // Find attachment by different possible ID fields with more comprehensive matching
    const attachment = existingAttachments.find(a => {
        return a.id === attachmentId ||
            a.attachmentId === attachmentId ||
            a.fileId === attachmentId ||
            a.documentId === attachmentId ||
            a.id === parseInt(attachmentId) ||
            a.attachmentId === parseInt(attachmentId) ||
            a.fileId === parseInt(attachmentId) ||
            a.documentId === parseInt(attachmentId) ||
            `attachment_${existingAttachments.indexOf(a)}` === attachmentId;
    });

    if (!attachment) {
        console.error('Attachment not found for ID:', attachmentId);
        console.error('Available attachment IDs:', existingAttachments.map(a => ({
            id: a.id,
            attachmentId: a.attachmentId,
            fileId: a.fileId,
            documentId: a.documentId,
            fileName: a.fileName || a.name
        })));

        Swal.fire({
            title: 'Error',
            text: 'Attachment not found. Please refresh the page and try again.',
            icon: 'error'
        });
        return;
    }

    console.log('Found attachment:', attachment);

    // Check for different possible URL field names with comprehensive fallbacks
    const fileUrl = attachment.fileUrl ||
        attachment.url ||
        attachment.downloadUrl ||
        attachment.filePath ||
        attachment.link ||
        attachment.attachmentUrl ||
        attachment.documentUrl;

    if (!fileUrl) {
        console.error('No file URL found in attachment:', attachment);
        console.error('Available URL fields:', {
            fileUrl: attachment.fileUrl,
            url: attachment.url,
            downloadUrl: attachment.downloadUrl,
            filePath: attachment.filePath,
            link: attachment.link,
            attachmentUrl: attachment.attachmentUrl,
            documentUrl: attachment.documentUrl
        });

        Swal.fire({
            title: 'Error',
            text: 'Attachment file URL is not available. The attachment may not be properly uploaded.',
            icon: 'error'
        });
        return;
    }

    console.log('Opening attachment URL:', fileUrl);

    try {
        // Show loading indicator
        Swal.fire({
            title: 'Opening Attachment',
            text: 'Loading attachment...',
            icon: 'info',
            timer: 1000,
            timerProgressBar: true,
            showConfirmButton: false
        });

        // Open attachment in new window/tab
        const newWindow = window.open(fileUrl, '_blank');

        if (!newWindow) {
            throw new Error('Pop-up blocked or failed to open');
        }

    } catch (error) {
        console.error('Error opening attachment:', error);
        Swal.fire({
            title: 'Error',
            text: `Failed to open attachment: ${error.message}`,
            icon: 'error'
        });
    }
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