// ====================================
// DETAIL OUTGOING PAYMENT REIMBURSEMENT
// Enhanced JavaScript Module
// ====================================

// Global state management
const AppState = {
    currentDocumentId: null,
    documentData: null,
    BASE_CURRENCY: 'IDR'
};

// Configuration constants
const CONFIG = {
    MAX_AMOUNT: 100000000000000,
    DECIMAL_PLACES: 2,
    API_ENDPOINTS: {
        OUTGOING_PAYMENTS: '/api/staging-outgoing-payments/headers',
        ATTACHMENTS: '/api/staging-outgoing-payments/attachments',
        USERS: '/api/users',
        REIMBURSEMENTS: '/api/reimbursements'
    },
    FILE_ICONS: {
        pdf: '📄',
        doc: '📝',
        docx: '📝',
        xls: '📊',
        xlsx: '📊',
        jpg: '🖼️',
        jpeg: '🖼️',
        png: '🖼️',
        default: '📄'
    },
    STATUS_OPTIONS: ['Prepared', 'Checked', 'Acknowledged', 'Approved', 'Received', 'Rejected']
};

// ====================================
// CORE MAPPING FUNCTIONS
// ====================================

/**
 * Maps API response data to form fields
 * @param {Object} data - API response data
 */
function mapResponseToForm(data) {
    console.log('🔄 Mapping API Response to Form Fields...');
    console.log('📊 Data received:', data);

    AppState.documentData = data;

    // Map header fields
    mapHeaderFields(data);

    // Map date fields
    mapDateFields(data);

    // Calculate and map totals
    calculateAndMapTotals(data);

    // Map approval data
    mapApprovalSection(data);

    // Map table lines
    mapTableData(data);

    // Display additional components
    displayPrintOutReimbursement(data);

    console.log('✅ Form mapping completed successfully!');
}

/**
 * Maps header fields from API response
 * @param {Object} data - API response data
 */
function mapHeaderFields(data) {
    console.log('📝 Header Fields Mapping:');

    const headerMapping = [
        { id: 'CounterRef', value: data.counterRef, log: 'CounterRef' },
        { id: 'RequesterName', value: data.requesterName, log: 'RequesterName' },
        { id: 'Division', value: data.division, log: 'Division' },
        { id: 'CardName', value: data.cardName, log: 'CardName' },
        { id: 'Address', value: data.address, log: 'Address' },
        { id: 'DocNum', value: data.counterRef, log: 'DocNum' },
        { id: 'JrnlMemo', value: data.jrnlMemo, log: 'JrnlMemo' },
        { id: 'DocCurr', value: data.docCurr || AppState.BASE_CURRENCY, log: 'DocCurr' },
        { id: 'TrsfrAcct', value: data.trsfrAcct, log: 'TrsfrAcct' },
        { id: 'TrsfrSum', value: formatCurrencyWithTwoDecimals(data.trsfrSum || 0), log: 'TrsfrSum' }
    ];

    headerMapping.forEach(field => {
        console.log(`- ${field.log}:`, field.value);
        setElementValue(field.id, field.value || '');
    });

    // Handle RemittanceRequestAmount with both field name variations
    const remittanceAmount = data.RemittanceRequestAmount || data.remittanceRequestAmount || 0;
    console.log('💰 RemittanceRequestAmount:', remittanceAmount);
    setElementValue('RemittanceRequestAmount', formatCurrencyWithTwoDecimals(remittanceAmount));

    // Load division information if available
    loadDivisionInfo(data);
}

/**
 * Maps date fields from API response
 * @param {Object} data - API response data
 */
function mapDateFields(data) {
    const dateFields = [
        { id: 'DocDate', value: data.docDate },
        { id: 'DocDueDate', value: data.docDueDate },
        { id: 'TaxDate', value: data.taxDate },
        { id: 'TrsfrDate', value: data.trsfrDate }
    ];

    dateFields.forEach(field => {
        if (field.value) {
            const formattedDate = new Date(field.value).toISOString().split('T')[0];
            setElementValue(field.id, formattedDate);
        }
    });
}

/**
 * Calculates and maps total amounts
 * @param {Object} data - API response data
 */
function calculateAndMapTotals(data) {
    console.log('📊 Lines Data:', data.lines);

    let netTotal = 0;
    let totalAmountDue = 0;
    const currencySummary = {};

    if (data.lines?.length > 0) {
        data.lines.forEach((line, index) => {
            console.log(`📋 Line ${index}:`, line);
            const amount = line.sumApplied || 0;
            const currency = line.CurrencyItem || line.currencyItem || AppState.BASE_CURRENCY;

            netTotal += amount;
            totalAmountDue += amount;

            currencySummary[currency] = (currencySummary[currency] || 0) + amount;
        });
    }

    console.log('💰 Totals Calculation:', { netTotal, totalAmountDue, currencySummary });

    // Update total fields
    setElementValue('netTotal', formatCurrencyIDR(netTotal));
    setElementValue('totalTax', formatCurrencyIDR(0));
    setElementValue('totalAmountDue', formatCurrencyIDR(totalAmountDue));

    // Display currency summaries
    displayCurrencySummary(currencySummary);
    updateTotalOutstandingTransfers(currencySummary);

    // Map remarks
    setElementValue('remarks', data.remarks || '');
    setElementValue('journalRemarks', data.journalRemarks || '');
}

/**
 * Maps approval section data
 * @param {Object} data - API response data
 */
function mapApprovalSection(data) {
    console.log('👥 Approval Data:', data.approval);

    if (data.approval) {
        mapApprovalData(data.approval);
        handleRejectionRemarks(data.approval);
        displayApprovalStatus(data.approval);
    } else {
        displayApprovalStatus({ approvalStatus: 'Prepared' });
    }
}

/**
 * Maps table data from API response
 * @param {Object} data - API response data
 */
function mapTableData(data) {
    console.log('📋 Populating Table Lines...');

    if (data.lines?.length > 0) {
        populateTableLines(data.lines);
    } else {
        console.log('⚠️ No lines data found');
    }
}

// ====================================
// APPROVAL MANAGEMENT
// ====================================

/**
 * Maps approval data to form fields
 * @param {Object} approval - Approval data object
 */
function mapApprovalData(approval) {
    const approvalMapping = [
        { searchId: 'Approval.PreparedByIdSearch', valueId: 'Approval.PreparedById', name: approval.preparedByName, id: approval.preparedBy },
        { searchId: 'Approval.CheckedByIdSearch', valueId: 'Approval.CheckedById', name: approval.checkedByName, id: approval.checkedBy },
        { searchId: 'Approval.AcknowledgedByIdSearch', valueId: 'Approval.AcknowledgedById', name: approval.acknowledgedByName, id: approval.acknowledgedBy },
        { searchId: 'Approval.ApprovedByIdSearch', valueId: 'Approval.ApprovedById', name: approval.approvedByName, id: approval.approvedBy },
        { searchId: 'Approval.ReceivedByIdSearch', valueId: 'Approval.ReceivedById', name: approval.receivedByName, id: approval.receivedBy }
    ];

    approvalMapping.forEach(field => {
        if (field.name) {
            setElementValue(field.searchId, field.name);
            setElementValue(field.valueId, field.id || '');
        }
    });
}

/**
 * Handles rejection remarks display
 * @param {Object} approval - Approval data object
 */
function handleRejectionRemarks(approval) {
    const rejectionSection = document.getElementById('rejectionRemarksSection');
    const rejectionText = document.getElementById('rejectionRemarks');

    if (approval.approvalStatus === 'Rejected') {
        showElement(rejectionSection);
        setElementValue('rejectionRemarks', approval.rejectionRemarks || '');
    } else {
        hideElement(rejectionSection);
        setElementValue('rejectionRemarks', '');
    }
}

/**
 * Displays approval status in select dropdown
 * @param {Object} approval - Approval data object
 */
function displayApprovalStatus(approval) {
    const statusSelect = document.getElementById('status');
    if (!statusSelect) {
        console.error('Status select element not found');
        return;
    }

    const status = determineApprovalStatus(approval);

    if (CONFIG.STATUS_OPTIONS.includes(status)) {
        statusSelect.value = status;
    } else {
        statusSelect.value = 'Prepared';
    }
}

/**
 * Determines approval status based on approval data
 * @param {Object} approval - Approval data object
 * @returns {string} - Determined status
 */
function determineApprovalStatus(approval) {
    if (!approval) return 'Prepared';

    if (approval.approvalStatus) return approval.approvalStatus;
    if (approval.rejectedDate) return 'Rejected';
    if (approval.receivedBy) return 'Received';
    if (approval.approvedBy) return 'Approved';
    if (approval.acknowledgedBy) return 'Acknowledged';
    if (approval.checkedBy) return 'Checked';
    if (approval.preparedBy) return 'Prepared';

    return 'Prepared';
}

// ====================================
// TABLE MANAGEMENT
// ====================================

/**
 * Populates table lines with data
 * @param {Array} lines - Array of line data
 */
function populateTableLines(lines) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

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
 * Creates a table row element
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
        line.divisionCode || '',
        line.CurrencyItem || line.currencyItem || '',
        formatCurrencyWithTwoDecimals(amount)
    ];

    row.innerHTML = cells.map(cell =>
        `<td class="p-2${cell === cells[5] ? ' text-right' : ''}">${cell}</td>`
    ).join('');

    return row;
}

// ====================================
// CURRENCY DISPLAY FUNCTIONS
// ====================================

/**
 * Displays currency summary
 * @param {Object} currencySummary - Currency summary object
 */
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

/**
 * Updates total outstanding transfers with English number words
 * @param {Object} currencySummary - Currency summary object
 */
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

// ====================================
// NUMBER TO WORDS CONVERSION
// ====================================

/**
 * Converts number to English words
 * @param {number} num - Number to convert
 * @returns {string} - Number in words
 */
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

// ====================================
// FILE MANAGEMENT FUNCTIONS
// ====================================

/**
 * Gets file icon based on file extension
 * @param {string} fileName - File name
 * @returns {string} - File icon emoji
 */
function getFileIcon(fileName) {
    if (!fileName || typeof fileName !== 'string') return CONFIG.FILE_ICONS.default;

    const extension = fileName.split('.').pop()?.toLowerCase();
    return CONFIG.FILE_ICONS[extension] || CONFIG.FILE_ICONS.default;
}

/**
 * Constructs file URL properly
 * @param {string} filePath - File path
 * @returns {string|null} - Constructed URL or null if error
 */
function constructFileUrl(filePath) {
    if (!filePath) {
        console.error('No file path provided');
        return null;
    }

    try {
        const decodedPath = decodeURIComponent(filePath);
        const cleanPath = decodedPath.replace(/^\/+/, '');
        const fileUrl = `${BASE_URL}/${cleanPath}`;

        console.log('File URL construction:', {
            originalPath: filePath,
            decodedPath,
            cleanPath,
            finalURL: fileUrl
        });

        return fileUrl;
    } catch (error) {
        console.error('Error constructing file URL:', error);
        return null;
    }
}

/**
 * Formats file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Formats date string
 * @param {string} dateString - Date string
 * @returns {string} - Formatted date
 */
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

// ====================================
// ATTACHMENT MANAGEMENT
// ====================================

/**
 * Displays existing attachments
 * @param {Array} attachments - Array of attachment objects
 */
function displayExistingAttachments(attachments) {
    const container = document.getElementById('attachmentsList');
    if (!container) {
        console.error('Attachments container not found');
        return;
    }

    // Clear the container completely to prevent duplication
    container.innerHTML = '';

    if (!attachments?.length) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
        return;
    }

    console.log('Displaying attachments:', attachments);

    const attachmentItems = attachments.map((attachment, index) => {
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
}

/**
 * Creates attachment item HTML
 * @param {Object} attachment - Attachment object
 * @param {string} fileName - File name
 * @param {string} fileIcon - File icon
 * @param {string} fileSize - File size
 * @param {string} uploadDate - Upload date
 * @returns {string} - HTML string
 */
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
                <button onclick="viewAttachment(${attachmentJson})" 
                        class="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50">
                    View
                </button>
            </div>
        </div>
    `;
}

/**
 * Views attachment file
 * @param {Object|string} attachmentOrPath - Attachment object or file path
 * @param {string} fileName - File name (optional)
 */
async function viewAttachment(attachmentOrPath, fileName) {
    try {
        showLoadingIndicator('Loading attachment, please wait...');

        const docId = getDocumentId();
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
        showErrorMessage('Failed to view attachment', error.message);
    }
}

/**
 * Normalizes attachment parameter
 * @param {Object|string} attachmentOrPath - Attachment object or path
 * @param {string} fileName - File name
 * @returns {Object} - Normalized attachment object
 */
function normalizeAttachment(attachmentOrPath, fileName) {
    if (typeof attachmentOrPath === 'string') {
        return { filePath: attachmentOrPath, fileName: fileName };
    }
    return attachmentOrPath;
}

/**
 * Opens attachment file directly
 * @param {string} filePath - File path
 */
async function openAttachmentFile(filePath) {
    console.log('Using direct filePath:', filePath);

    Swal.close();

    const fileUrl = constructFileUrl(filePath);
    if (!fileUrl) {
        throw new Error('Failed to construct file URL');
    }

    window.open(fileUrl, '_blank');
    showSuccessMessage('Attachment opened in new tab');
}

/**
 * Fetches and opens attachment from API
 * @param {string} docId - Document ID
 * @param {Object} attachment - Attachment object
 */
async function fetchAndOpenAttachment(docId, attachment) {
    console.log('Fetching attachments from API for document:', docId);

    const response = await makeAuthenticatedRequest(`${CONFIG.API_ENDPOINTS.ATTACHMENTS}/${docId}`, {
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

/**
 * Handles attachment fetch errors
 * @param {Response} response - HTTP response
 * @param {string} docId - Document ID
 * @param {Object} attachment - Attachment object
 */
async function handleAttachmentFetchError(response, docId, attachment) {
    if (response.status === 404) {
        console.warn(`No attachments found for document ${docId}`);
        Swal.close();
        showInfoMessage('No Attachments', 'No attachments found for this document.');
        return;
    }

    if (response.status === 405) {
        await tryAlternativeAttachmentFetch(docId, attachment);
        return;
    }

    throw new Error(`Failed to fetch attachment: ${response.status}`);
}

/**
 * Tries alternative attachment fetch method
 * @param {string} docId - Document ID
 * @param {Object} attachment - Attachment object
 */
async function tryAlternativeAttachmentFetch(docId, attachment) {
    console.warn('GET method not allowed on attachments endpoint, trying main document endpoint');

    const mainResponse = await makeAuthenticatedRequest(`${CONFIG.API_ENDPOINTS.OUTGOING_PAYMENTS}/${docId}`, {
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

/**
 * Finds target attachment in array
 * @param {Array} attachments - Array of attachments
 * @param {Object} target - Target attachment
 * @returns {Object|null} - Found attachment or null
 */
function findTargetAttachment(attachments, target) {
    if (!attachments?.length) return null;

    return attachments.find(att =>
        att.id === target.id ||
        att.fileName === target.fileName ||
        att.filePath === target.filePath
    );
}

// ====================================
// DATA LOADING FUNCTIONS
// ====================================

/**
 * Loads document data from API
 */
async function loadDocumentData() {
    const docId = getDocumentId();
    if (!docId) return;

    AppState.currentDocumentId = docId;

    try {
        showLoadingIndicator('Loading document data, please wait...');

        const result = await fetchDocumentData(docId);

        if (result) {
            mapResponseToForm(result);
            await handleAttachments(result, docId);
            await handleReimbursementData(result);
            showSuccessMessage('Document data loaded successfully');
        }

    } catch (error) {
        console.error("Error loading document:", error);
        showErrorMessage('Failed to load document', error.message);
    }
}

/**
 * Fetches document data from API
 * @param {string} docId - Document ID
 * @returns {Object} - Document data
 */
async function fetchDocumentData(docId) {
    console.log('🌐 API Request:', `GET ${CONFIG.API_ENDPOINTS.OUTGOING_PAYMENTS}/${docId}`);

    const response = await makeAuthenticatedRequest(`${CONFIG.API_ENDPOINTS.OUTGOING_PAYMENTS}/${docId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });

    console.log('📡 Response Status:', response.status, response.statusText);

    if (!response.ok) {
        throw new Error(`Failed to load document: ${response.status}`);
    }

    const result = await response.json();
    console.log('📋 API Response:', result);

    return result;
}

/**
 * Handles attachment loading
 * @param {Object} result - Document data
 * @param {string} docId - Document ID
 */
async function handleAttachments(result, docId) {
    if (result.attachments?.length > 0) {
        console.log('Attachments found in main response:', result.attachments);
        displayExistingAttachments(result.attachments);
    } else {
        await loadAttachmentsFromAPI(docId);
    }
}

/**
 * Handles reimbursement related data
 * @param {Object} result - Document data
 */
async function handleReimbursementData(result) {
    if (!result.expressivNo) return;

    console.log('Outgoing payment created from reimbursement:', result.expressivNo);

    try {
        const reimResponse = await makeAuthenticatedRequest(`${CONFIG.API_ENDPOINTS.REIMBURSEMENTS}/${result.expressivNo}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (reimResponse.ok) {
            const reimResult = await reimResponse.json();
            if (reimResult?.data?.voucherNo) {
                setElementValue('CounterRef', reimResult.data.voucherNo);
            }
        }

        await loadReimbursementAttachments(result.expressivNo);
    } catch (err) {
        console.warn('Could not fetch reimbursement voucherNo:', err);
    }
}

/**
 * Loads attachments from API
 * @param {string} docId - Document ID
 */
async function loadAttachmentsFromAPI(docId) {
    try {
        console.log('Attempting to load attachments for document:', docId);

        const response = await makeAuthenticatedRequest(`${CONFIG.API_ENDPOINTS.ATTACHMENTS}/${docId}`, {
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

/**
 * Handles attachment loading errors
 * @param {Response} response - HTTP response
 * @param {string} docId - Document ID
 */
async function handleAttachmentLoadError(response, docId) {
    if (response.status === 404) {
        console.warn(`No attachments found for document ${docId}`);
        showNoAttachmentsMessage();
        return;
    }

    if (response.status === 405) {
        console.warn('GET method not allowed on attachments endpoint, trying alternative approach');

        const mainResponse = await makeAuthenticatedRequest(`${CONFIG.API_ENDPOINTS.OUTGOING_PAYMENTS}/${docId}`, {
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

/**
 * Loads reimbursement attachments
 * @param {string} reimbursementId - Reimbursement ID
 */
async function loadReimbursementAttachments(reimbursementId) {
    try {
        console.log('Loading reimbursement attachments for ID:', reimbursementId);

        const response = await makeAuthenticatedRequest(`${CONFIG.API_ENDPOINTS.REIMBURSEMENTS}/${reimbursementId}`, {
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

/**
 * Appends reimbursement attachments section
 * @param {Array} attachments - Array of reimbursement attachments
 */
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

/**
 * Displays reimbursement attachments
 * @param {Array} attachments - Array of reimbursement attachments
 */
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

/**
 * Creates reimbursement attachment item
 * @param {Object} attachment - Attachment object
 * @returns {HTMLElement} - Attachment item element
 */
function createReimbursementAttachmentItem(attachment) {
    const attachmentItem = document.createElement('div');
    attachmentItem.className = 'flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200';

    const fileInfo = createReimbursementFileInfo(attachment);
    const actions = createReimbursementActions(attachment);

    attachmentItem.appendChild(fileInfo);
    attachmentItem.appendChild(actions);

    return attachmentItem;
}

/**
 * Creates file info section for reimbursement attachment
 * @param {Object} attachment - Attachment object
 * @returns {HTMLElement} - File info element
 */
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

/**
 * Creates actions section for reimbursement attachment
 * @param {Object} attachment - Attachment object
 * @returns {HTMLElement} - Actions element
 */
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

/**
 * Views reimbursement attachment
 * @param {Object} attachment - Attachment object
 */
async function viewReimbursementAttachment(attachment) {
    try {
        showLoadingIndicator('Loading attachment, please wait...');

        if (attachment.filePath) {
            Swal.close();

            const decodedPath = decodeURIComponent(attachment.filePath);
            const fileUrl = `${BASE_URL}${decodedPath.startsWith('/') ? decodedPath : '/' + decodedPath}`;

            window.open(fileUrl, '_blank');
            return;
        }

        throw new Error('No file path available for this attachment');

    } catch (error) {
        console.error('Error viewing reimbursement attachment:', error);
        Swal.close();
        showErrorMessage('Failed to view attachment', error.message);
    }
}

/**
 * Refreshes attachments display
 */
async function refreshAttachments() {
    const docId = getDocumentId();
    if (!docId) {
        showErrorMessage('Document ID not found', 'Please ensure you are viewing an existing document.');
        return;
    }

    try {
        showLoadingIndicator('Loading attachments, please wait...');
        await loadAttachmentsFromAPI(docId);
        Swal.close();
        showSuccessMessage('Attachments refreshed successfully');
    } catch (error) {
        console.error("Error refreshing attachments:", error);
        showErrorMessage('Failed to refresh attachments', error.message);
    }
}

// ====================================
// DIVISION MANAGEMENT
// ====================================

/**
 * Loads division information based on requester data
 * @param {Object} data - Document data
 */
function loadDivisionInfo(data) {
    if (data.requesterId) {
        loadDivisionForRequester(data.requesterId);
    } else if (data.requesterName) {
        loadDivisionForRequesterByName(data.requesterName);
    }
}

/**
 * Loads division for specific requester ID
 * @param {string} requesterId - Requester ID
 */
async function loadDivisionForRequester(requesterId) {
    try {
        console.log('🔍 Loading division for requester ID:', requesterId);

        const response = await fetch(`${BASE_URL}${CONFIG.API_ENDPOINTS.USERS}/${requesterId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            console.warn('⚠️ Failed to load division information:', response.status, response.statusText);
            return;
        }

        const result = await response.json();
        const userData = result.data;

        if (userData?.department) {
            console.log('✅ Division loaded:', userData.department);
            setElementValue('Division', userData.department);
        } else {
            console.log('ℹ️ No division information available for this user');
            setElementValue('Division', 'N/A');
        }

    } catch (error) {
        console.error('❌ Error loading division information:', error);
        setElementValue('Division', 'Error loading division');
    }
}

/**
 * Loads division for requester by name
 * @param {string} requesterName - Requester name
 */
async function loadDivisionForRequesterByName(requesterName) {
    try {
        console.log('🔍 Loading division for requester name:', requesterName);

        const response = await fetch(`${BASE_URL}${CONFIG.API_ENDPOINTS.USERS}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            console.warn('⚠️ Failed to load users:', response.status, response.statusText);
            return;
        }

        const result = await response.json();
        const users = result.data || [];

        const user = users.find(u =>
            u.fullName === requesterName ||
            `${u.firstName} ${u.lastName}`.trim() === requesterName ||
            u.firstName === requesterName
        );

        if (user?.department) {
            console.log('✅ Division loaded by name:', user.department);
            setElementValue('Division', user.department);
        } else {
            console.log('ℹ️ No division information found for requester name:', requesterName);
            setElementValue('Division', 'N/A');
        }

    } catch (error) {
        console.error('❌ Error loading division information by name:', error);
        setElementValue('Division', 'Error loading division');
    }
}

// ====================================
// CURRENCY FORMATTING FUNCTIONS
// ====================================

/**
 * Formats currency with IDR format
 * @param {number|string} number - Number to format
 * @returns {string} - Formatted currency string
 */
function formatCurrencyIDR(number) {
    if (number === null || number === undefined || number === '') {
        return '0';
    }

    const num = parseNumber(number);
    if (isNaN(num)) return '0';

    const limitedNum = Math.min(num, CONFIG.MAX_AMOUNT);
    const numStr = limitedNum.toString();
    const hasDecimal = numStr.includes('.');

    try {
        if (hasDecimal) {
            const decimalPlaces = numStr.split('.')[1].length;
            return limitedNum.toLocaleString('id-ID', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
            });
        } else {
            return limitedNum.toLocaleString('id-ID', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        }
    } catch (e) {
        console.error('Error formatting number:', e);
        return formatNumberFallback(limitedNum);
    }
}

/**
 * Formats currency with exactly 2 decimal places
 * @param {number|string} number - Number to format
 * @returns {string} - Formatted currency string
 */
function formatCurrencyWithTwoDecimals(number) {
    if (number === null || number === undefined || number === '') {
        return '0.00';
    }

    const num = parseNumber(number);
    if (isNaN(num)) return '0.00';

    const limitedNum = Math.min(num, CONFIG.MAX_AMOUNT);

    if (limitedNum >= 1e12) {
        return formatLargeNumber(limitedNum);
    } else {
        return limitedNum.toLocaleString('en-US', {
            minimumFractionDigits: CONFIG.DECIMAL_PLACES,
            maximumFractionDigits: CONFIG.DECIMAL_PLACES
        });
    }
}

/**
 * Parses currency value back to number
 * @param {string|number} value - Currency value
 * @returns {number} - Parsed number
 */
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

/**
 * Parses number from string or number input
 * @param {string|number} number - Input number
 * @returns {number} - Parsed number
 */
function parseNumber(number) {
    try {
        if (typeof number === 'string') {
            const cleanedStr = number.replace(/[^\d,.]/g, '');
            if (cleanedStr.length > 15) {
                return Number(cleanedStr.replace(/,/g, ''));
            } else {
                return parseFloat(cleanedStr.replace(/,/g, ''));
            }
        } else {
            return Number(number);
        }
    } catch (e) {
        console.error('Error parsing number:', e);
        return 0;
    }
}

/**
 * Formats large numbers as fallback
 * @param {number} num - Number to format
 * @returns {string} - Formatted string
 */
function formatLargeNumber(num) {
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

/**
 * Number formatting fallback for very large numbers
 * @param {number} num - Number to format
 * @returns {string} - Formatted string
 */
function formatNumberFallback(num) {
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

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * Sets element value safely
 * @param {string} id - Element ID
 * @param {string} value - Value to set
 */
function setElementValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value || '';
    }
}

/**
 * Shows element
 * @param {HTMLElement} element - Element to show
 */
function showElement(element) {
    if (element) {
        element.style.display = 'block';
    }
}

/**
 * Hides element
 * @param {HTMLElement} element - Element to hide
 */
function hideElement(element) {
    if (element) {
        element.style.display = 'none';
    }
}

/**
 * Gets document ID from various sources
 * @returns {string|null} - Document ID
 */
function getDocumentId() {
    const urlParams = new URLSearchParams(window.location.search);
    let docId = urlParams.get('id');

    if (!docId && AppState.currentDocumentId) {
        docId = AppState.currentDocumentId;
    }

    if (!docId) {
        docId = localStorage.getItem('currentStagingOutgoingPaymentId');
    }

    return docId;
}

/**
 * Shows loading indicator
 * @param {string} message - Loading message
 */
function showLoadingIndicator(message) {
    Swal.fire({
        title: 'Loading...',
        text: message,
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

/**
 * Shows success message
 * @param {string} message - Success message
 */
function showSuccessMessage(message) {
    Swal.fire({
        title: 'Success',
        text: message,
        icon: 'success',
        confirmButtonText: 'OK'
    });
}

/**
 * Shows error message
 * @param {string} title - Error title
 * @param {string} message - Error message
 */
function showErrorMessage(title, message) {
    Swal.fire({
        title: title,
        text: message,
        icon: 'error',
        confirmButtonText: 'OK'
    });
}

/**
 * Shows info message
 * @param {string} title - Info title
 * @param {string} message - Info message
 */
function showInfoMessage(title, message) {
    Swal.fire({
        title: title,
        text: message,
        icon: 'info',
        confirmButtonText: 'OK'
    });
}

/**
 * Shows no attachments message
 */
function showNoAttachmentsMessage() {
    const container = document.getElementById('attachmentsList');
    if (container) {
        // Clear container completely before showing message
        container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
    }
}

/**
 * Shows attachment error message
 */
function showAttachmentError() {
    const container = document.getElementById('attachmentsList');
    if (container) {
        // Clear container completely before showing error
        container.innerHTML = '<p class="text-gray-500 text-sm">Error loading attachments</p>';
    }
}

/**
 * Navigates back to menu
 */
function goToMenuOP() {
    window.location.href = '../pages/menuOPReim.html';
}

// ====================================
// PRINT OUT REIMBURSEMENT FUNCTIONS
// ====================================

/**
 * Displays Print Out Reimbursement document
 * @param {Object} reimbursementData - Reimbursement data
 */
function displayPrintOutReimbursement(reimbursementData) {
    const container = document.getElementById('printOutReimbursementList');
    if (!container) {
        console.warn('Print Out Reimbursement container not found: printOutReimbursementList');
        return;
    }

    container.innerHTML = '';

    const reimbursementId = getReimbursementId(reimbursementData);
    if (!reimbursementId) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Reimbursement ID not found</p>';
        return;
    }

    const printUrl = buildPrintReimbursementUrl(reimbursementId, reimbursementData);
    const documentItem = createPrintDocumentItem(reimbursementId, printUrl);

    container.appendChild(documentItem);
}

/**
 * Gets reimbursement ID from various sources
 * @param {Object} reimbursementData - Reimbursement data
 * @returns {string|null} - Reimbursement ID
 */
function getReimbursementId(reimbursementData) {
    const urlParams = new URLSearchParams(window.location.search);
    let reimbursementId = urlParams.get('reimbursement-id') || urlParams.get('id');

    if (!reimbursementId) {
        const counterRefField = document.getElementById('CounterRef');
        if (counterRefField?.value) {
            reimbursementId = counterRefField.value;
        }
    }

    if (!reimbursementId && reimbursementData?.id) {
        reimbursementId = reimbursementData.id;
    }

    return reimbursementId;
}

/**
 * Builds print reimbursement URL with parameters
 * @param {string} reimbursementId - Reimbursement ID
 * @param {Object} reimbursementData - Reimbursement data
 * @returns {string} - Complete URL
 */
function buildPrintReimbursementUrl(reimbursementId, reimbursementData) {
    const baseUrl = window.location.origin;
    const printReimUrl = `${baseUrl}/approvalPages/approval/receive/reimbursement/printReim.html?reim-id=${reimbursementId}`;

    if (!reimbursementData) return printReimUrl;

    const params = new URLSearchParams();

    const paramMapping = [
        { key: 'payTo', value: reimbursementData.cardName },
        { key: 'voucherNo', value: reimbursementData.counterRef },
        { key: 'submissionDate', value: reimbursementData.docDate },
        { key: 'preparedBy', value: reimbursementData.requesterName },
        { key: 'totalAmount', value: reimbursementData.totalAmountDue },
        { key: 'currency', value: reimbursementData.docCurr },
        { key: 'remarks', value: reimbursementData.comments }
    ];

    paramMapping.forEach(param => {
        if (param.value) {
            params.append(param.key, encodeURIComponent(param.value));
        }
    });

    if (reimbursementData.lines?.length > 0) {
        const details = reimbursementData.lines.map(line => ({
            category: line.category || '',
            accountName: line.acctName || '',
            glAccount: line.acctCode || '',
            description: line.descrip || '',
            amount: line.sumApplied || 0
        }));
        params.append('details', encodeURIComponent(JSON.stringify(details)));
    }

    return params.toString() ? `${printReimUrl}&${params.toString()}` : printReimUrl;
}

/**
 * Creates print document item element
 * @param {string} reimbursementId - Reimbursement ID
 * @param {string} printUrl - Print URL
 * @returns {HTMLElement} - Document item element
 */
function createPrintDocumentItem(reimbursementId, printUrl) {
    const documentItem = document.createElement('div');
    documentItem.className = 'flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200';

    const fileInfo = document.createElement('div');
    fileInfo.className = 'flex items-center space-x-2';
    fileInfo.innerHTML = `
        <span class="text-lg">📄</span>
        <div>
            <div class="font-medium text-sm text-blue-800">Print Receive Reimbursement</div>
            <div class="text-xs text-gray-500">Document • PDF</div>
            <div class="text-xs text-blue-600">Reimbursement ID: ${reimbursementId}</div>
        </div>
    `;

    const actions = document.createElement('div');
    actions.className = 'flex space-x-2';

    const viewBtn = createPrintButton('View', 'blue', () => viewPrintReimbursement(printUrl));
    const openBtn = createPrintButton('Open', 'green', () => openPrintReimbursement(printUrl));

    actions.appendChild(viewBtn);
    actions.appendChild(openBtn);

    documentItem.appendChild(fileInfo);
    documentItem.appendChild(actions);

    return documentItem;
}

/**
 * Creates print button
 * @param {string} text - Button text
 * @param {string} color - Button color
 * @param {Function} clickHandler - Click handler
 * @returns {HTMLElement} - Button element
 */
function createPrintButton(text, color, clickHandler) {
    const button = document.createElement('button');
    button.className = `text-${color}-600 hover:text-${color}-800 text-sm px-2 py-1 rounded border border-${color}-300 hover:bg-${color}-50`;
    button.innerHTML = text;
    button.onclick = clickHandler;
    return button;
}

/**
 * Views print reimbursement document
 * @param {string} url - Document URL
 */
async function viewPrintReimbursement(url) {
    try {
        showLoadingIndicator('Loading Print Receive Reimbursement document...');

        const newWindow = window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

        if (newWindow) {
            Swal.close();
            showSuccessMessage('Print Receive Reimbursement document opened in new window');
        } else {
            throw new Error('Failed to open document window');
        }

    } catch (error) {
        console.error('Error viewing Print Reimbursement document:', error);
        showErrorMessage('Error', `Failed to open Print Receive Reimbursement document: ${error.message}`);
    }
}

/**
 * Opens print reimbursement document in new tab
 * @param {string} url - Document URL
 */
function openPrintReimbursement(url) {
    try {
        window.open(url, '_blank');
    } catch (error) {
        console.error('Error opening Print Reimbursement document:', error);
        showErrorMessage('Error', `Failed to open Print Receive Reimbursement document: ${error.message}`);
    }
}

// ====================================
// GLOBAL EXPORTS
// ====================================

// Make functions available globally for HTML usage
window.formatCurrencyIDR = formatCurrencyIDR;
window.formatCurrencyWithTwoDecimals = formatCurrencyWithTwoDecimals;
window.parseCurrencyIDR = parseCurrencyIDR;
window.viewAttachment = viewAttachment;
window.refreshAttachments = refreshAttachments;
window.goToMenuOP = goToMenuOP;
window.getFileIcon = getFileIcon;
window.formatFileSize = formatFileSize;
window.formatDate = formatDate;
window.constructFileUrl = constructFileUrl;
window.displayApprovalStatus = displayApprovalStatus;
window.loadReimbursementAttachments = loadReimbursementAttachments;
window.displayReimbursementAttachments = displayReimbursementAttachments;
window.viewReimbursementAttachment = viewReimbursementAttachment;
window.displayCurrencySummary = displayCurrencySummary;
window.updateTotalOutstandingTransfers = updateTotalOutstandingTransfers;
window.numberToWords = numberToWords;
window.loadDivisionForRequester = loadDivisionForRequester;
window.loadDivisionForRequesterByName = loadDivisionForRequesterByName;
window.displayPrintOutReimbursement = displayPrintOutReimbursement;
window.viewPrintReimbursement = viewPrintReimbursement;
window.openPrintReimbursement = openPrintReimbursement;

// ====================================
// INITIALIZATION
// ====================================

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    loadDocumentData();
});