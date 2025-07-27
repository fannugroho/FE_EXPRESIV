// Global variables
let invoiceData = null;
let currentUser = null;

// API Configuration
const API_BASE_URL = 'https://expressiv-be-sb.idsdev.site/api';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Get invoice ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('id');
    
    // Debug logging
    console.log('URL search params:', window.location.search);
    console.log('All URL params:', Object.fromEntries(urlParams.entries()));
    console.log('Invoice ID from URL:', invoiceId);
    
    // Populate debug info (with null checks)
    const debugUrlElement = document.getElementById('debugUrl');
    const debugInvoiceIdElement = document.getElementById('debugInvoiceId');
    
    if (debugUrlElement) {
        debugUrlElement.textContent = window.location.href;
    }
    if (debugInvoiceIdElement) {
        debugInvoiceIdElement.textContent = invoiceId || 'Not found';
    }
    
    if (invoiceId && invoiceId.trim() !== '') {
        console.log('Loading invoice data for identifier:', invoiceId.trim());
        loadInvoiceData(invoiceId.trim());
    } else {
        console.log('No invoice identifier found, using default STG-001');
        loadInvoiceData('STG-001');
    }
});


// Load invoice data from API
async function loadInvoiceData(invoiceId) {
    try {
        console.log('loadInvoiceData called with invoiceId:', invoiceId);
        
        // Construct API URL
        const apiUrl = `${API_BASE_URL}/ar-invoices/${invoiceId}/details`;
        console.log('API URL:', apiUrl);
        
        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Fetch data from API
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API response result:', result);
        
        if (result.status && result.data) {
            invoiceData = result.data;
            console.log('Invoice data loaded from API:', invoiceData);
            
            // Populate form with data
            populateFormData(invoiceData);
            
            // Populate invoice details table
            if (invoiceData.arInvoiceDetails && invoiceData.arInvoiceDetails.length > 0) {
                populateInvoiceDetails(invoiceData.arInvoiceDetails);
            }
            
            // Load attachments from the main response
            loadAttachmentsFromData(invoiceData.arInvoiceAttachments);
            
            // Close loading indicator
            Swal.close();
        } else {
            throw new Error('Invalid response format from API');
        }
        
    } catch (error) {
        console.error('Error loading invoice data:', error);
        
        let errorMessage = 'Failed to load invoice data';
        
        if (error.message.includes('404')) {
            errorMessage = 'Invoice not found. Please check the invoice identifier.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network error. Please check your connection.';
        } else {
            errorMessage = `Failed to load invoice data: ${error.message}`;
        }
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage
        });
    }
}

// Populate form with invoice data
function populateFormData(data) {
    // Populate header fields
    document.getElementById('DocEntry').value = data.stagingID || '';
    document.getElementById('DocNum').value = data.docNum || '';
    document.getElementById('CardCode').value = data.cardCode || '';
    document.getElementById('CardName').value = data.cardName || '';
    document.getElementById('address').value = data.address || '';
    document.getElementById('NumAtCard').value = data.numAtCard || '';
    document.getElementById('DocCur').value = data.docCur || 'IDR';
    document.getElementById('docRate').value = data.docRate || '1';
    document.getElementById('DocDate').value = formatDate(data.docDate);
    document.getElementById('DocDueDate').value = formatDate(data.docDueDate);
    document.getElementById('GroupNum').value = data.groupNum || '1';
    document.getElementById('TrnspCode').value = data.trnspCode || '1';
    document.getElementById('U_BSI_ShippingType').value = data.u_BSI_ShippingType || '';
    document.getElementById('U_BSI_PaymentGroup').value = data.u_BSI_PaymentGroup || '';
    document.getElementById('U_BSI_Expressiv_IsTransfered').value = data.u_BSI_Expressiv_IsTransfered || 'N';
    document.getElementById('U_BSI_UDF1').value = data.u_bsi_udf1 || '';
    document.getElementById('U_BSI_UDF2').value = data.u_bsi_udf2 || '';
    document.getElementById('u_BSI_Expressiv_PreparedByNIK').value = data.u_BSI_Expressiv_PreparedByNIK || '';
    document.getElementById('u_BSI_Expressiv_PreparedByName').value = data.u_BSI_Expressiv_PreparedByName || '';
    document.getElementById('comments').value = data.comments || '';
    
    // Populate approval fields from approval summary
    if (data.arInvoiceApprovalSummary) {
        document.getElementById('preparedByName').value = data.arInvoiceApprovalSummary.preparedBy || '';
        document.getElementById('acknowledgeByName').value = data.arInvoiceApprovalSummary.acknowledgedBy || '';
        document.getElementById('checkedByName').value = data.arInvoiceApprovalSummary.checkedBy || '';
        document.getElementById('approvedByName').value = data.arInvoiceApprovalSummary.approvedBy || '';
        document.getElementById('receivedByName').value = data.arInvoiceApprovalSummary.receivedBy || '';
    }
    
    // Populate totals
    document.getElementById('PriceBefDi').value = data.docTotal - data.vatSum || '0.00';
    document.getElementById('VatSum').value = data.vatSum || '0.00';
    document.getElementById('DocTotal').value = data.docTotal || '0.00';
    
    // Populate table with invoice details
    populateInvoiceDetails(data.arInvoiceDetails || []);
    
    // Enable submit button after data is loaded
    enableSubmitButton();
}

// Populate table with invoice details
function populateInvoiceDetails(details) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    if (details.length === 0) {
        // Add empty row message
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="12" class="p-4 text-center text-gray-500">
                No invoice details found
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    details.forEach((detail, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="p-2 border no-column">
                <input type="text" class="line-num-input no-input p-2 border rounded bg-gray-100" value="${detail.lineNum || index + 1}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border item-code-column">
                <input type="text" class="item-code-input p-2 border rounded bg-gray-100" value="${detail.itemCode || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border description-column">
                <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto" maxlength="100" disabled autocomplete="off">${detail.dscription || ''}</textarea>
            </td>
            <td class="p-2 border description-column">
                <textarea class="w-full item-free-txt bg-gray-100 resize-none overflow-auto" maxlength="100" disabled autocomplete="off">${detail.text || ''}</textarea>
            </td>
            <td class="p-2 border sales-employee-column">
                <textarea class="w-full item-sales-employee bg-gray-100 resize-none overflow-auto" maxlength="100" disabled autocomplete="off">${detail.unitMsr || ''}</textarea>
            </td>
            <td class="p-2 border quantity-column">
                <textarea class="quantity-input item-sls-qty bg-gray-100 overflow-auto" maxlength="15" disabled style="resize: none;" autocomplete="off">${detail.quantity || '0'}</textarea>
            </td>
            <td class="p-2 border quantity-column">
                <textarea class="quantity-input item-quantity bg-gray-100 overflow-auto" maxlength="15" disabled style="resize: none;" autocomplete="off">${detail.invQty || '0'}</textarea>
            </td>
            <td class="p-2 border uom-column" style="display: none;">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.uom || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border price-column">
                <textarea class="price-input item-sls-price bg-gray-100 overflow-auto" maxlength="15" disabled style="resize: none;" autocomplete="off">${detail.u_bsi_salprice || '0.00'}</textarea>
            </td>
            <td class="p-2 border price-column">
                <textarea class="price-input item-price bg-gray-100 overflow-auto" maxlength="15" disabled style="resize: none;" autocomplete="off">${detail.priceBefDi || '0.00'}</textarea>
            </td>
            <td class="p-2 border discount-column">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.discount || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border tax-code-column">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.vatgroup || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border line-total-column">
                <textarea class="line-total-input item-line-total bg-gray-100 overflow-auto" maxlength="15" disabled style="resize: none;" autocomplete="off">${detail.lineTotal || '0.00'}</textarea>
            </td>
            <td class="p-2 border account-code-column" style="display: none;">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.acctCode || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border base-column" style="display: none;">
                <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${detail.baseType || '0'}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border base-column" style="display: none;">
                <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${detail.baseEntry || '0'}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border base-column" style="display: none;">
                <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${detail.baseLine || '0'}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border base-column" style="display: none;">
                <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${detail.lineType || '0'}" disabled autocomplete="off" />
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Apply text wrapping after populating the table
    if (window.refreshTextWrapping) {
        setTimeout(() => {
            window.refreshTextWrapping();
        }, 100);
    }
    
    // Adjust textarea heights based on content
    adjustTextareaHeights();
}

// Format date to YYYY-MM-DD
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}



// Navigation function
function goToMenuARInv() {
    window.location.href = '../pages/menuInvoice.html';
}

// Submit invoice data to API
async function submitInvoiceData() {
    try {
        // Show confirmation dialog first
        const confirmResult = await Swal.fire({
            title: 'Confirm Submission',
            text: 'Are you sure you want to submit this invoice data?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Submit',
            cancelButtonText: 'Cancel'
        });
        
        if (!confirmResult.isConfirmed) {
            return;
        }
        
        // Show loading state
        const submitButton = document.getElementById('submitButton');
        const submitButtonText = document.getElementById('submitButtonText');
        const submitSpinner = document.getElementById('submitSpinner');
        
        submitButton.disabled = true;
        submitButtonText.textContent = 'Submitting...';
        submitSpinner.classList.remove('hidden');
        
        // Get current invoice data
        if (!invoiceData) {
            throw new Error('No invoice data available');
        }
        
        // Validate required fields
        if (!invoiceData.docNum) {
            throw new Error('Invoice number is required');
        }
        
        if (!invoiceData.cardCode) {
            throw new Error('Customer code is required');
        }
        
        if (!invoiceData.cardName) {
            throw new Error('Customer name is required');
        }
        
        // Prepare the request payload
        const payload = prepareInvoicePayload(invoiceData);
        
        console.log('Submitting invoice data:', payload);
        console.log('API URL:', `${API_BASE_URL}/ar-invoices`);
        
        // Make API call
        const response = await fetch(`${API_BASE_URL}/ar-invoices`, {
            method: 'POST',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json-patch+json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error response:', errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.text();
        console.log('API Response:', result);
        
        // Show success message with details
        Swal.fire({
            icon: 'success',
            title: 'Invoice Submitted Successfully!',
            html: `
                <div class="text-left">
                    <p><strong>Invoice Number:</strong> ${invoiceData.docNum || 'N/A'}</p>
                    <p><strong>Customer:</strong> ${invoiceData.cardName || 'N/A'}</p>
                    <p><strong>Total Amount:</strong> ${invoiceData.docTotal ? parseFloat(invoiceData.docTotal).toLocaleString('id-ID', {style: 'currency', currency: 'IDR'}) : 'N/A'}</p>
                    <p><strong>Items Count:</strong> ${invoiceData.arInvoiceDetails ? invoiceData.arInvoiceDetails.length : 0}</p>
                </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#10b981'
        }).then(() => {
            // Optionally redirect or refresh
            window.location.reload();
        });
        
    } catch (error) {
        console.error('Error submitting invoice data:', error);
        
        // Show error message
        Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: error.message || 'Failed to submit invoice data. Please try again.',
            confirmButtonText: 'OK'
        });
    } finally {
        // Reset button state
        const submitButton = document.getElementById('submitButton');
        const submitButtonText = document.getElementById('submitButtonText');
        const submitSpinner = document.getElementById('submitSpinner');
        
        submitButton.disabled = false;
        submitButtonText.textContent = 'Submit Invoice';
        submitSpinner.classList.add('hidden');
    }
}



// Prepare invoice payload for API submission
function prepareInvoicePayload(data) {
    const now = new Date().toISOString();
    
    // Prepare invoice details
    const invoiceDetails = (data.arInvoiceDetails || []).map(detail => ({
        lineNum: detail.lineNum || 0,
        visOrder: detail.visOrder || 0,
        itemCode: detail.itemCode || '',
        dscription: detail.dscription || '',
        acctCode: detail.acctCode || '',
        quantity: parseFloat(detail.quantity) || 0,
        invQty: parseFloat(detail.invQty) || 0,
        priceBefDi: parseFloat(detail.priceBefDi) || 0,
        u_bsi_salprice: parseFloat(detail.u_bsi_salprice) || 0,
        u_bsi_source: detail.u_bsi_source || '',
        vatgroup: detail.vatgroup || '',
        wtLiable: detail.wtLiable || '',
        lineTotal: parseFloat(detail.lineTotal) || 0,
        totalFrgn: parseFloat(detail.totalFrgn) || 0,
        lineVat: parseFloat(detail.lineVat) || 0,
        lineVatIF: parseFloat(detail.lineVatIF) || 0,
        ocrCode3: detail.ocrCode3 || '',
        unitMsr: detail.unitMsr || '',
        numPerMsr: parseFloat(detail.numPerMsr) || 0,
        freeTxt: detail.freeTxt || '',
        text: detail.text || '',
        baseType: parseInt(detail.baseType) || 0,
        baseEntry: parseInt(detail.baseEntry) || 0,
        baseRef: detail.baseRef || '',
        baseLine: parseInt(detail.baseLine) || 0,
        cogsOcrCod: detail.cogsOcrCod || '',
        cogsOcrCo2: detail.cogsOcrCo2 || '',
        cogsOcrCo3: detail.cogsOcrCo3 || '',
        docEntrySAP: parseInt(detail.docEntrySAP) || 0
    }));
    
    // Prepare attachments
    const invoiceAttachments = (data.arInvoiceAttachments || []).map(attachment => ({
        fileName: attachment.fileName || '',
        filePath: attachment.filePath || '',
        fileUrl: attachment.fileUrl || '',
        description: attachment.description || ''
    }));
    
    // Prepare approval summary
    const approvalSummary = data.arInvoiceApprovalSummary ? {
        stagingID: data.arInvoiceApprovalSummary.stagingID || '',
        createdAt: data.arInvoiceApprovalSummary.createdAt || now,
        updatedAt: data.arInvoiceApprovalSummary.updatedAt || now,
        approvalStatus: data.arInvoiceApprovalSummary.approvalStatus || '',
        preparedBy: data.arInvoiceApprovalSummary.preparedBy || '',
        checkedBy: data.arInvoiceApprovalSummary.checkedBy || '',
        acknowledgedBy: data.arInvoiceApprovalSummary.acknowledgedBy || '',
        approvedBy: data.arInvoiceApprovalSummary.approvedBy || '',
        receivedBy: data.arInvoiceApprovalSummary.receivedBy || '',
        preparedDate: data.arInvoiceApprovalSummary.preparedDate || now,
        checkedDate: data.arInvoiceApprovalSummary.checkedDate || now,
        acknowledgedDate: data.arInvoiceApprovalSummary.acknowledgedDate || now,
        approvedDate: data.arInvoiceApprovalSummary.approvedDate || now,
        receivedDate: data.arInvoiceApprovalSummary.receivedDate || now,
        rejectedDate: data.arInvoiceApprovalSummary.rejectedDate || now,
        rejectionRemarks: data.arInvoiceApprovalSummary.rejectionRemarks || '',
        revisionNumber: parseInt(data.arInvoiceApprovalSummary.revisionNumber) || 0,
        revisionDate: data.arInvoiceApprovalSummary.revisionDate || now,
        revisionRemarks: data.arInvoiceApprovalSummary.revisionRemarks || ''
    } : null;
    
    // Return the complete payload
    return {
        docNum: parseInt(data.docNum) || 0,
        docType: data.docType || 's',
        docDate: data.docDate || now,
        docDueDate: data.docDueDate || now,
        cardCode: data.cardCode || '',
        cardName: data.cardName || '',
        address: data.address || '',
        numAtCard: data.numAtCard || '',
        comments: data.comments || '',
        u_BSI_Expressiv_PreparedByNIK: data.u_BSI_Expressiv_PreparedByNIK || '',
        u_BSI_Expressiv_PreparedByName: data.u_BSI_Expressiv_PreparedByName || '',
        docCur: data.docCur || 'IDR',
        docRate: parseFloat(data.docRate) || 1,
        vatSum: parseFloat(data.vatSum) || 0,
        vatSumFC: parseFloat(data.vatSumFC) || 0,
        wtSum: parseFloat(data.wtSum) || 0,
        wtSumFC: parseFloat(data.wtSumFC) || 0,
        docTotal: parseFloat(data.docTotal) || 0,
        docTotalFC: parseFloat(data.docTotalFC) || 0,
        trnspCode: parseInt(data.trnspCode) || 0,
        u_BSI_ShippingType: data.u_BSI_ShippingType || '',
        groupNum: parseInt(data.groupNum) || 0,
        u_BSI_PaymentGroup: data.u_BSI_PaymentGroup || '',
        u_bsi_invnum: data.u_bsi_invnum || '',
        u_bsi_udf1: data.u_bsi_udf1 || '',
        u_bsi_udf2: data.u_bsi_udf2 || '',
        trackNo: data.trackNo || '',
        u_BSI_Expressiv_IsTransfered: data.u_BSI_Expressiv_IsTransfered || 'N',
        docEntrySAP: parseInt(data.docEntrySAP) || 0,
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now,
        arInvoiceDetails: invoiceDetails,
        arInvoiceAttachments: invoiceAttachments,
        arInvoiceApprovalSummary: approvalSummary
    };
}

// Enable submit button when data is loaded
function enableSubmitButton() {
    const submitButton = document.getElementById('submitButton');
    if (submitButton) {
        submitButton.disabled = false; // Enable when data is loaded
    }
}

 

// Load attachments from the main API response data
function loadAttachmentsFromData(attachments) {
    try {
        console.log('Loading attachments from data:', attachments);
        
        // Hide loading indicator
        const attachmentLoading = document.getElementById('attachmentLoading');
        const attachmentList = document.getElementById('attachmentList');
        const noAttachments = document.getElementById('noAttachments');
        
        if (attachmentLoading) {
            attachmentLoading.style.display = 'none';
        }
        if (attachmentList) {
            attachmentList.innerHTML = '';
        }
        if (noAttachments) {
            noAttachments.style.display = 'none';
        }
        
        if (attachments && attachments.length > 0) {
            displayAttachments(attachments);
        } else {
            showNoAttachments();
        }
        
    } catch (error) {
        console.error('Error loading attachments from data:', error);
        showNoAttachments();
    }
}

// Load attachments for the invoice (legacy function for separate API call)


// Display attachments in the UI
function displayAttachments(attachments) {
    const attachmentList = document.getElementById('attachmentList');
    const attachmentLoading = document.getElementById('attachmentLoading');
    const noAttachments = document.getElementById('noAttachments');
    
    if (attachmentLoading) {
        attachmentLoading.style.display = 'none';
    }
    if (noAttachments) {
        noAttachments.style.display = 'none';
    }
    if (attachmentList) {
        attachmentList.innerHTML = '';
        
        attachments.forEach((attachment, index) => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'attachment-item flex items-center justify-between';
            
            const fileIcon = getFileIcon(attachment.fileName);
            const fileName = attachment.fileName || `Attachment ${index + 1}`;
            const fileUrl = attachment.fileUrl || '#';
            const description = attachment.description || '';
            const createdAt = formatDate(attachment.createdAt);
            
            attachmentItem.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="file-icon">${fileIcon}</div>
                    <div class="flex-1 min-w-0">
                        <div class="file-name" title="${fileName}">${fileName}</div>
                        <div class="file-description">${description}</div>
                        <div class="text-xs text-gray-400">Created: ${createdAt}</div>
                    </div>
                </div>
                <div class="attachment-actions">
                    <button onclick="downloadAttachment('${fileUrl}', '${fileName}')" 
                            class="btn-download">
                        Download
                    </button>
                    <button onclick="previewAttachment('${fileUrl}', '${fileName}')" 
                            class="btn-preview">
                        Preview
                    </button>
                </div>
            `;
            
            attachmentList.appendChild(attachmentItem);
        });
    }
}

// Show no attachments message
function showNoAttachments() {
    const attachmentLoading = document.getElementById('attachmentLoading');
    const attachmentList = document.getElementById('attachmentList');
    const noAttachments = document.getElementById('noAttachments');
    
    if (attachmentLoading) {
        attachmentLoading.style.display = 'none';
    }
    if (attachmentList) {
        attachmentList.innerHTML = '';
    }
    if (noAttachments) {
        noAttachments.style.display = 'block';
    }
}

// Get file icon based on file extension
function getFileIcon(fileName) {
    if (!fileName) return '📄';
    
    const extension = fileName.split('.').pop().toLowerCase();
    
    const iconMap = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'xls': '📊',
        'xlsx': '📊',
        'ppt': '📽️',
        'pptx': '📽️',
        'txt': '📄',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🖼️',
        'bmp': '🖼️',
        'zip': '📦',
        'rar': '📦',
        '7z': '📦',
        'mp4': '🎥',
        'avi': '🎥',
        'mov': '🎥',
        'mp3': '🎵',
        'wav': '🎵'
    };
    
    return iconMap[extension] || '📄';
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}





// Adjust textarea heights based on content length
function adjustTextareaHeights() {
    const textareas = document.querySelectorAll('.table-container textarea');
    
    textareas.forEach(textarea => {
        const content = textarea.value || textarea.textContent || '';
        const charLength = content.length;
        
        // Set uniform height for all textareas
        textarea.style.height = '50px';
        textarea.style.minHeight = '50px';
        textarea.style.maxHeight = '50px';
        
        // Add scroll indicator if content is long
        if (charLength > 100) {
            textarea.style.borderRight = '2px solid #3b82f6';
        } else {
            textarea.style.borderRight = '';
        }
        
        // Ensure consistent vertical alignment
        textarea.style.verticalAlign = 'middle';
    });
}