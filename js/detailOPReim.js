// Global variables
let currentDocumentId = null;
let documentData = null;

// Function to map API response data to form fields
function mapResponseToForm(data) {
    documentData = data;
    
    // Map header fields
    document.getElementById('CounterRef').value = data.counterRef || '';
    document.getElementById('RequesterName').value = data.requesterName || ''; // Use requesterName directly from API
    document.getElementById('CardName').value = data.cardName || '';
    document.getElementById('Address').value = data.address || '';
    document.getElementById('DocNum').value = data.docNum || '';
    document.getElementById('Comments').value = data.comments || '';
    document.getElementById('JrnlMemo').value = data.jrnlMemo || '';
    document.getElementById('DocCurr').value = data.docCurr || 'IDR';
    document.getElementById('TrsfrAcct').value = data.trsfrAcct || '';
    document.getElementById('TrsfrSum').value = formatCurrencyIDR(data.trsfrSum || 0);
    
    // Map date fields
    if (data.docDate) {
        const docDate = new Date(data.docDate);
        document.getElementById('DocDate').value = docDate.toISOString().split('T')[0];
    }
    
    if (data.docDueDate) {
        const docDueDate = new Date(data.docDueDate);
        document.getElementById('DocDueDate').value = docDueDate.toISOString().split('T')[0];
    }
    
    if (data.taxDate) {
        const taxDate = new Date(data.taxDate);
        document.getElementById('TaxDate').value = taxDate.toISOString().split('T')[0];
    }
    
    if (data.trsfrDate) {
        const trsfrDate = new Date(data.trsfrDate);
        document.getElementById('TrsfrDate').value = trsfrDate.toISOString().split('T')[0];
    }
    

    
    // Calculate totals from lines
    let netTotal = 0;
    let totalAmountDue = 0;
    
    if (data.lines && data.lines.length > 0) {
        data.lines.forEach(line => {
            netTotal += line.sumApplied || 0;
            totalAmountDue += line.sumApplied || 0;
        });
    }
    
    // Map totals
    document.getElementById('netTotal').value = formatCurrencyIDR(netTotal);
    document.getElementById('totalTax').value = formatCurrencyIDR(0); // Not available in response
    document.getElementById('totalAmountDue').value = formatCurrencyIDR(totalAmountDue);
    
    // Map remarks
    document.getElementById('remarks').value = ''; // Not available in response
    document.getElementById('journalRemarks').value = ''; // Not available in response
    
    // Map approval data
    if (data.approval) {
        mapApprovalData(data.approval);
        
        // Show rejection remarks if status is rejected
        if (data.approval.approvalStatus === 'Rejected') {
            document.getElementById('rejectionRemarksSection').style.display = 'block';
            document.getElementById('rejectionRemarks').value = data.approval.rejectionRemarks || '';
        }
    }
    
    // Map table lines
    if (data.lines && data.lines.length > 0) {
        populateTableLines(data.lines);
    }
}

// Function to map approval data
function mapApprovalData(approval) {
    // Map prepared by - use preparedByName for display
    if (approval.preparedByName) {
        document.getElementById('Approval.PreparedByIdSearch').value = approval.preparedByName || '';
        document.getElementById('Approval.PreparedById').value = approval.preparedBy || '';
    }
    
    // Map checked by - use checkedByName for display
    if (approval.checkedByName) {
        document.getElementById('Approval.CheckedByIdSearch').value = approval.checkedByName || '';
        document.getElementById('Approval.CheckedById').value = approval.checkedBy || '';
    }
    
    // Map acknowledged by - use acknowledgedByName for display
    if (approval.acknowledgedByName) {
        document.getElementById('Approval.AcknowledgedByIdSearch').value = approval.acknowledgedByName || '';
        document.getElementById('Approval.AcknowledgedById').value = approval.acknowledgedBy || '';
    }
    
    // Map approved by - use approvedByName for display
    if (approval.approvedByName) {
        document.getElementById('Approval.ApprovedByIdSearch').value = approval.approvedByName || '';
        document.getElementById('Approval.ApprovedById').value = approval.approvedBy || '';
    }
    
    // Map received by - use receivedByName for display
    if (approval.receivedByName) {
        document.getElementById('Approval.ReceivedByIdSearch').value = approval.receivedByName || '';
        document.getElementById('Approval.ReceivedById').value = approval.receivedBy || '';
    }
    

}

// Function to populate table lines
function populateTableLines(lines) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    lines.forEach((line, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2">${line.acctCode || ''}</td>
            <td class="p-2">${line.acctName || ''}</td>
            <td class="p-2">${line.descrip || ''}</td>
            <td class="p-2">${line.ocrCode3 || ''}</td>
            <td class="p-2 text-right">${formatCurrencyIDR(line.sumApplied || 0)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to display existing attachments
function displayExistingAttachments(attachments) {
    const container = document.getElementById('existingAttachments');
    
    if (!attachments || attachments.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
        return;
    }
    
    let html = '';
    attachments.forEach((attachment, index) => {
        const fileName = attachment.fileName || attachment.name || `Attachment ${index + 1}`;
        const filePath = attachment.filePath || attachment.path || '';
        
        html += `
            <div class="flex items-center justify-between p-2 mb-2 bg-gray-50 rounded border">
                <div class="flex items-center space-x-2">
                    <span class="text-blue-600">📎</span>
                    <span class="text-sm font-medium">${fileName}</span>
                </div>
                <div class="flex space-x-2">
                    <button onclick="downloadAttachment('${filePath}', '${fileName}')" 
                            class="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50">
                        📥 Download
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Function to download attachment
async function downloadAttachment(filePath, fileName) {
    if (!filePath) {
        Swal.fire({
            title: 'Error',
            text: 'File path not available',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    try {
        // Create download link using BASE_URL from auth.js
        const link = document.createElement('a');
        // Remove /api/files and decode %2F to /
        const decodedPath = decodeURIComponent(filePath);
        link.href = `${BASE_URL}/${decodedPath}`;
        link.download = fileName || 'attachment';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Swal.fire({
            title: 'Success',
            text: 'Download started',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
        
    } catch (error) {
        console.error('Error downloading attachment:', error);
        Swal.fire({
            title: 'Error',
            text: 'Failed to download attachment',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to parse currency string back to number
function parseCurrencyValue(value) {
    if (!value) return 0;
    // Handle Indonesian format (thousand separator: '.', decimal separator: ',')
    // Replace dots (thousand separators) with nothing and commas (decimal separators) with dots
    const numericValue = value.toString()
        .replace(/\./g, '') // Remove thousand separators (dots)
        .replace(/,/g, '.'); // Replace decimal separators (commas) with dots
    
    return parseFloat(numericValue) || 0;
}

// Function to format number to currency string (for JS file compatibility)
function formatNumberToCurrencyString(number) {
    // Handle empty or invalid input
    if (number === null || number === undefined || number === '') {
        return '';
    }
    
    // Parse the number
    let num;
    try {
        if (typeof number === 'string') {
            const cleanedStr = number.replace(/[^\d.-]/g, '');
            num = parseFloat(cleanedStr);
        } else {
            num = parseFloat(number);
        }
        
        if (isNaN(num)) {
            return '';
        }
    } catch (e) {
        console.error('Error parsing number:', e);
        return '';
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



// Function to load document data from API
async function loadDocumentData() {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('id');
    
    if (docId) {
        // Store document ID globally for attachment functions
        window.currentDocumentId = docId;
        
        try {
            // Show loading indicator
            Swal.fire({
                title: 'Loading...',
                text: 'Loading document data, please wait...',
                icon: 'info',
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Fetch document data from API
            const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/headers/${docId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load document: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result) {
                // Map response data to form
                mapResponseToForm(result);
                
                // Load attachments from API
                await loadAttachmentsFromAPI(docId);
                
                // Show success message
                Swal.fire({
                    title: 'Success',
                    text: 'Document data loaded successfully',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            }
            
        } catch (error) {
            console.error("Error loading document:", error);
            
            Swal.fire({
                title: 'Error',
                text: `Failed to load document: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
}

// Function to load attachments from API
async function loadAttachmentsFromAPI(docId) {
    try {
        // Fetch attachments from API - using the same endpoint as main data since attachments are included in response
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/headers/${docId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn(`Failed to load attachments: ${response.status}`);
            return;
        }

        const result = await response.json();
        
        if (result.attachments && result.attachments.length > 0) {
            // Display attachments from API response
            displayExistingAttachments(result.attachments);
        } else {
            // Show no attachments message
            const container = document.getElementById('existingAttachments');
            if (container) {
                container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
            }
        }
        
    } catch (error) {
        console.error("Error loading attachments:", error);
        // Don't show error to user as this is not critical
    }
}

// Function to refresh attachments
async function refreshAttachments() {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('id');
    
    if (!docId) {
        Swal.fire({
            title: 'Error',
            text: 'Document ID not found. Please ensure you are viewing an existing document.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }

    try {
        // Show loading indicator
        Swal.fire({
            title: 'Refreshing...',
            text: 'Loading attachments, please wait...',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Fetch document data again to get updated attachments
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/headers/${docId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to refresh attachments: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.attachments && result.attachments.length > 0) {
            displayExistingAttachments(result.attachments);
        } else {
            const container = document.getElementById('existingAttachments');
            if (container) {
                container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
            }
        }

        // Close loading indicator
        Swal.close();

        Swal.fire({
            title: 'Success',
            text: 'Attachments refreshed successfully',
            icon: 'success',
            confirmButtonText: 'OK'
        });

    } catch (error) {
        console.error("Error refreshing attachments:", error);
        Swal.fire({
            title: 'Error',
            text: `Failed to refresh attachments: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to go back to menu
function goToMenuOP() {
    window.location.href = '../pages/menuOPReim.html';
}

// Function to format currency with IDR format
function formatCurrencyIDR(number) {
    if (number === null || number === undefined || number === '') {
        return '0.00';
    }
    
    let num;
    try {
        if (typeof number === 'string') {
            const cleanedStr = number.replace(/[^\d,.]/g, '');
            if (cleanedStr.length > 15) {
                num = Number(cleanedStr.replace(/,/g, ''));
            } else {
                num = parseFloat(cleanedStr.replace(/,/g, ''));
            }
        } else {
            num = Number(number);
        }
        
        if (isNaN(num)) {
            return '0.00';
        }
    } catch (e) {
        console.error('Error parsing number:', e);
        return '0.00';
    }
    
    const maxAmount = 100000000000000;
    if (num > maxAmount) {
        num = maxAmount;
    }
    
    if (num >= 1e12) {
        let strNum = num.toString();
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
    } else {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

// Function to parse currency IDR format
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

// Make functions available globally
window.formatCurrencyIDR = formatCurrencyIDR;
window.parseCurrencyIDR = parseCurrencyIDR;
window.downloadAttachment = downloadAttachment;
window.refreshAttachments = refreshAttachments;
window.goToMenuOP = goToMenuOP; 