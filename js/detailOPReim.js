// Global variables
let currentDocumentId = null;
let documentData = null;

// Function to map API response data to form fields
function mapResponseToForm(data) {
    documentData = data;
    // Helper to safely set value
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
    // TypeOfTransaction field removed
    setValue('TrsfrAcct', data.trsfrAcct || '');
    setValue('TrsfrSum', formatCurrencyWithTwoDecimals(data.trsfrSum || 0));
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
    if (data.lines && data.lines.length > 0) {
        data.lines.forEach(line => {
            netTotal += line.sumApplied || 0;
            totalAmountDue += line.sumApplied || 0;
        });
    }
    // Map totals
    setValue('netTotal', formatCurrencyIDR(netTotal));
    setValue('totalTax', formatCurrencyIDR(0)); // Not available in response
    setValue('totalAmountDue', formatCurrencyIDR(totalAmountDue));
    // Map remarks
    setValue('remarks', data.remarks || '');
    setValue('journalRemarks', data.journalRemarks || '');
    // Map approval data
    if (data.approval) {
        mapApprovalData(data.approval);
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
        // If no approval data, show as Prepared (instead of Draft)
        displayApprovalStatus({ approvalStatus: 'Prepared' });
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

// Function to display approval status with select dropdown
// This function updates the status select dropdown to show the current approval status
// The select is disabled (read-only) to prevent user modification
function displayApprovalStatus(approval) {
    const statusSelect = document.getElementById('status');
    
    if (!statusSelect) {
        console.error('Status select element not found');
        return;
    }
    
    let status = 'Prepared'; // Default to Prepared instead of Draft
    
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
        
        // Remove revision status handling since it's no longer needed
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
            <td class="p-2 text-right">${formatCurrencyIDR(line.sumApplied || 0)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to get file icon based on file extension
function getFileIcon(fileName) {
    if (!fileName || typeof fileName !== 'string') return '📄';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
        case 'pdf': return '📄';
        case 'doc':
        case 'docx': return '📝';
        case 'xls':
        case 'xlsx': return '📊';
        case 'jpg':
        case 'jpeg':
        case 'png': return '🖼️';
        default: return '📄';
    }
}

// Function to construct file URL properly
function constructFileUrl(filePath) {
    if (!filePath) {
        console.error('No file path provided');
        return null;
    }
    
    try {
        // Decode the file path
        const decodedPath = decodeURIComponent(filePath);
        
        // Remove any leading slashes to avoid double slashes
        const cleanPath = decodedPath.replace(/^\/+/, '');
        
        // Construct the full URL
        const fileUrl = `${BASE_URL}/${cleanPath}`;
        
        console.log('File URL construction:');
        console.log('  Original path:', filePath);
        console.log('  Decoded path:', decodedPath);
        console.log('  Clean path:', cleanPath);
        console.log('  Final URL:', fileUrl);
        
        return fileUrl;
    } catch (error) {
        console.error('Error constructing file URL:', error);
        return null;
    }
}

// Function to format file size
function formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Function to format date (YYYY-MM-DD to DD MMM YYYY)
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Function to display existing attachments
function displayExistingAttachments(attachments) {
    const container = document.getElementById('attachmentsList');
    
    if (!container) {
        console.error('Attachments container not found');
        return;
    }
    
    if (!attachments || attachments.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
        return;
    }
    
    console.log('Displaying attachments:', attachments);
    
    let html = '';
    attachments.forEach((attachment, index) => {
        const fileName = attachment.fileName || attachment.name || `Attachment ${index + 1}`;
        const fileIcon = getFileIcon(fileName);
        const fileSize = formatFileSize(attachment.fileSize || attachment.size);
        const uploadDate = formatDate(attachment.uploadDate || attachment.createdAt);
        
        console.log(`Attachment ${index + 1}:`, {
            fileName,
            filePath: attachment.filePath,
            fileSize: attachment.fileSize,
            uploadDate: attachment.uploadDate
        });
        
        html += `
            <div class="flex items-center justify-between p-2 mb-2 bg-gray-50 rounded border">
                <div class="flex items-center space-x-2">
                    <span class="text-lg">${fileIcon}</span>
                    <div>
                        <div class="font-medium text-sm">${fileName}</div>
                        <div class="text-xs text-gray-500">${fileSize} • ${attachment.fileType || attachment.contentType || 'Unknown Type'}</div>
                        <div class="text-xs text-gray-400">Uploaded: ${uploadDate}</div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="viewAttachment(${JSON.stringify(attachment).replace(/"/g, '&quot;')})" 
                            class="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50">
                        View
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Function to view attachment
async function viewAttachment(attachmentOrPath, fileName) {
    try {
        console.log('viewAttachment called with:', { attachmentOrPath, fileName });
        
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

        // Get document ID from URL parameters or from attachment object
        const urlParams = new URLSearchParams(window.location.search);
        let docId = urlParams.get('id');
        
        console.log('Document ID from URL:', docId);
        
        // If no docId in URL, try to get it from attachment object
        if (!docId && attachmentOrPath.reimbursementId) {
            docId = attachmentOrPath.reimbursementId;
            console.log('Document ID from attachment object:', docId);
        }
        
        // If still no docId, try to get it from global variable
        if (!docId && window.currentDocumentId) {
            docId = window.currentDocumentId;
            console.log('Document ID from global variable:', docId);
        }
        
        // If still no docId, try to get it from localStorage
        if (!docId) {
            docId = localStorage.getItem('currentStagingOutgoingPaymentId');
            console.log('Document ID from localStorage:', docId);
        }
        
        if (!docId) {
            throw new Error('Document ID not found. Please ensure you are viewing an existing document.');
        }

        // Handle both parameter types: (filePath, fileName) or (attachmentObject)
        let attachment;
        if (typeof attachmentOrPath === 'string') {
            // Called with (filePath, fileName) - this is legacy format
            attachment = {
                filePath: attachmentOrPath,
                fileName: fileName
            };
        } else {
            // Called with (attachmentObject)
            attachment = attachmentOrPath;
        }

        // If attachment already has filePath, use it directly
        if (attachment.filePath) {
            console.log('Using direct filePath:', attachment.filePath);
            
            // Close loading indicator
            Swal.close();
            
            // Construct file URL using helper function
            const fileUrl = constructFileUrl(attachment.filePath);
            
            if (!fileUrl) {
                throw new Error('Failed to construct file URL');
            }
            
            // Open file in new tab
            window.open(fileUrl, '_blank');
            
            Swal.fire({
                title: 'Success',
                text: 'Attachment opened in new tab',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        // If no filePath, try to fetch attachment data from API
        console.log('Fetching attachments from API for document:', docId);
        
        let response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/attachments/${docId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('API response status:', response.status);

        if (!response.ok) {
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
                console.warn('GET method not allowed on attachments endpoint, trying main document endpoint');
                // Try to get attachments from the main document endpoint
                response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/headers/${docId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch attachment: ${response.status}`);
                }
                
                const mainResult = await response.json();
                console.log('Main document response data:', mainResult);
                
                if (!mainResult.attachments || mainResult.attachments.length === 0) {
                    throw new Error('No attachments found');
                }
                
                // Find the specific attachment by ID or fileName
                const targetAttachment = mainResult.attachments.find(att => 
                    att.id === attachment.id || 
                    att.fileName === attachment.fileName ||
                    att.filePath === attachment.filePath
                );
                
                console.log('Looking for attachment:', attachment);
                console.log('Available attachments:', mainResult.attachments);
                console.log('Found target attachment:', targetAttachment);
                
                if (!targetAttachment) {
                    throw new Error('Attachment not found');
                }
                
                // Close loading indicator
                Swal.close();
                
                // Construct the file URL using the filePath from API response
                if (targetAttachment.filePath) {
                    console.log('Using filePath from main response:', targetAttachment.filePath);
                    
                    // Construct file URL using helper function
                    const fileUrl = constructFileUrl(targetAttachment.filePath);
                    
                    if (!fileUrl) {
                        throw new Error('Failed to construct file URL');
                    }
                    
                    // Open file in new tab
                    window.open(fileUrl, '_blank');
                    
                    Swal.fire({
                        title: 'Success',
                        text: 'Attachment opened in new tab',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    throw new Error('File path not available');
                }
                
                return;
            }
            
            throw new Error(`Failed to fetch attachment: ${response.status}`);
        }

        const result = await response.json();
        console.log('API response data:', result);
        
        if (!result.data || result.data.length === 0) {
            throw new Error('No attachments found');
        }

        // Find the specific attachment by ID or fileName
        const targetAttachment = result.data.find(att => 
            att.id === attachment.id || 
            att.fileName === attachment.fileName ||
            att.filePath === attachment.filePath
        );

        console.log('Looking for attachment:', attachment);
        console.log('Available attachments:', result.data);
        console.log('Found target attachment:', targetAttachment);

        if (!targetAttachment) {
            throw new Error('Attachment not found');
        }

        // Close loading indicator
        Swal.close();
        
        // Construct the file URL using the filePath from API response
        if (targetAttachment.filePath) {
            console.log('Using filePath from API response:', targetAttachment.filePath);
            
            // Construct file URL using helper function
            const fileUrl = constructFileUrl(targetAttachment.filePath);
            
            if (!fileUrl) {
                throw new Error('Failed to construct file URL');
            }
            
            // Open file in new tab
            window.open(fileUrl, '_blank');
            
            Swal.fire({
                title: 'Success',
                text: 'Attachment opened in new tab',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            throw new Error('File path not available');
        }
        
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
                
                // Check if attachments are included in the main response
                if (result.attachments && result.attachments.length > 0) {
                    console.log('Attachments found in main response:', result.attachments);
                    displayExistingAttachments(result.attachments);
                } else {
                    // Try to load attachments from separate API endpoint
                    await loadAttachmentsFromAPI(docId);
                }
                
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
        console.log('Attempting to load attachments for document:', docId);
        
        // Try to fetch attachments from the dedicated attachments endpoint
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/attachments/${docId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Attachments API response status:', response.status);

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`No attachments found for document ${docId}`);
                const container = document.getElementById('attachmentsList');
                if (container) {
                    container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
                }
                return;
            }
            
            if (response.status === 405) {
                console.warn('GET method not allowed on attachments endpoint, trying alternative approach');
                // Try to get attachments from the main document endpoint
                const mainResponse = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/headers/${docId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (mainResponse.ok) {
                    const mainResult = await mainResponse.json();
                    if (mainResult.attachments && mainResult.attachments.length > 0) {
                        console.log('Found attachments in main response:', mainResult.attachments);
                        displayExistingAttachments(mainResult.attachments);
                        return;
                    }
                }
                
                // If still no attachments, show message
                const container = document.getElementById('attachmentsList');
                if (container) {
                    container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
                }
                return;
            }
            
            console.warn(`Failed to load attachments: ${response.status}`);
            return;
        }

        const result = await response.json();
        console.log('Attachments API response data:', result);
        
        if (result.data && result.data.length > 0) {
            // Display attachments from API response
            displayExistingAttachments(result.data);
        } else {
            // Show no attachments message
            const container = document.getElementById('attachmentsList');
            if (container) {
                container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
            }
        }
        
    } catch (error) {
        console.error("Error loading attachments:", error);
        // Don't show error to user as this is not critical
        const container = document.getElementById('attachmentsList');
        if (container) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Error loading attachments</p>';
        }
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

        // Fetch attachments from API using the dedicated attachments endpoint
        const response = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/attachments/${docId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`No attachments found for document ${docId}`);
                const container = document.getElementById('attachmentsList');
                if (container) {
                    container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
                }
                return;
            }
            
            if (response.status === 405) {
                console.warn('GET method not allowed on attachments endpoint, trying alternative approach');
                // Try to get attachments from the main document endpoint
                const mainResponse = await makeAuthenticatedRequest(`/api/staging-outgoing-payments/headers/${docId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (mainResponse.ok) {
                    const mainResult = await mainResponse.json();
                    if (mainResult.attachments && mainResult.attachments.length > 0) {
                        console.log('Found attachments in main response:', mainResult.attachments);
                        displayExistingAttachments(mainResult.attachments);
                        return;
                    }
                }
                
                // If still no attachments, show message
                const container = document.getElementById('attachmentsList');
                if (container) {
                    container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
                }
                return;
            }
            
            throw new Error(`Failed to refresh attachments: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
            displayExistingAttachments(result.data);
        } else {
            const container = document.getElementById('attachmentsList');
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
        return '0';
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
            return '0';
        }
    } catch (e) {
        console.error('Error parsing number:', e);
        return '0';
    }
    
    const maxAmount = 100000000000000;
    if (num > maxAmount) {
        num = maxAmount;
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

// Function to format currency with exactly 2 decimal places (like HTML version)
function formatCurrencyWithTwoDecimals(number) {
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