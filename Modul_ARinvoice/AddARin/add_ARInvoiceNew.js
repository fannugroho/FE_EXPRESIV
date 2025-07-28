// Fallback for makeAuthenticatedRequest if auth.js is not loaded
if (typeof makeAuthenticatedRequest === 'undefined') {
    console.warn('makeAuthenticatedRequest not found, creating fallback function');
    window.makeAuthenticatedRequest = async function (endpoint, options = {}) {
        console.warn('Using fallback makeAuthenticatedRequest - auth.js may not be loaded properly');

        // Try different BASE_URLs if the default one doesn't work
        const possibleBaseUrls = [
            'http://localhost:5249',
            'http://127.0.0.1:5249',
            'https://expressiv.idsdev.site',
            'https://expressiv-be-sb.idsdev.site'
        ];

        let response = null;
        let lastError = null;

        for (const baseUrl of possibleBaseUrls) {
            try {
                const fullUrl = baseUrl + endpoint;
                console.log('Making request to:', fullUrl);

                // Simple fetch with basic headers
                response = await fetch(fullUrl, {
                    ...options,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        ...(options.headers || {})
                    }
                });

                if (response.ok) {
                    console.log('✅ Success with BASE_URL:', baseUrl);
                    break;
                } else {
                    console.warn(`⚠️ BASE_URL ${baseUrl} returned status: ${response.status}`);
                    lastError = new Error(`Failed to load document: ${response.status} - ${response.statusText}`);
                }
            } catch (error) {
                console.warn(`⚠️ BASE_URL ${baseUrl} failed:`, error.message);
                lastError = error;
            }
        }

        if (!response || !response.ok) {
            throw lastError || new Error('All BASE_URLs failed');
        }

        return response;
    };
}

// Fallback for BASE_URL if auth.js is not loaded
if (typeof BASE_URL === 'undefined') {
    console.warn('BASE_URL not found, setting fallback');
    window.BASE_URL = 'http://localhost:5249'; // Default development URL
}

// Function to load attachments from API
async function loadAttachmentsFromAPI(stagingId) {
    try {
        // Use ARInvoice attachments endpoint
        const response = await makeAuthenticatedRequest(`/api/ar-invoices/${stagingId}/attachments`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`No attachments found for AR Invoice ${stagingId}`);
                // Show no attachments message
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
    }
}

// Function to get file icon based on file type
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

// Enhanced attachment display function
function displayExistingAttachments(attachments) {
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

    // Create attachment list
    const attachmentList = document.createElement('div');
    attachmentList.className = 'space-y-2';

    attachments.forEach((attachment, index) => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex items-center justify-between p-2 bg-gray-50 rounded border';

        const fileInfo = document.createElement('div');
        fileInfo.className = 'flex items-center space-x-2';

        // File icon based on type
        const fileIcon = getFileIcon(attachment.fileName || attachment.name);

        fileInfo.innerHTML = `
            <span class="text-lg">${fileIcon}</span>
            <div>
                <div class="font-medium text-sm">${attachment.fileName || attachment.name || 'Unknown File'}</div>
                <div class="text-xs text-gray-500">${formatFileSize(attachment.fileSize || attachment.size)} • ${attachment.fileType || attachment.contentType || 'Unknown Type'}</div>
                <div class="text-xs text-gray-400">Uploaded: ${formatDate(attachment.uploadDate || attachment.createdAt)}</div>
            </div>
        `;

        const actions = document.createElement('div');
        actions.className = 'flex space-x-2';

        // View button only (no delete in optimized version)
        const viewBtn = document.createElement('button');
        viewBtn.className = 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50';
        viewBtn.innerHTML = 'View';
        viewBtn.onclick = () => viewAttachment(attachment);

        actions.appendChild(viewBtn);

        attachmentItem.appendChild(fileInfo);
        attachmentItem.appendChild(actions);
        attachmentList.appendChild(attachmentItem);
    });

    container.appendChild(attachmentList);
}

// Function to view attachment
async function viewAttachment(attachment) {
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

        // Get document ID from URL parameters or from attachment object
        const urlParams = new URLSearchParams(window.location.search);
        let docId = urlParams.get('id');

        // If no docId in URL, try to get it from attachment object
        if (!docId && attachment.reimbursementId) {
            docId = attachment.reimbursementId;
        }

        // If still no docId, try to get it from global variable
        if (!docId && window.currentDocumentId) {
            docId = window.currentDocumentId;
        }

        // If still no docId, try to get it from localStorage
        if (!docId) {
            docId = localStorage.getItem('currentStagingOutgoingPaymentId');
        }

        if (!docId) {
            throw new Error('Document ID not found. Please ensure you are viewing an existing document.');
        }

        // If attachment already has filePath, use it directly
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

        // Fetch attachment data from API - use staging AR invoice attachments endpoint
        const response = await makeAuthenticatedRequest(`/api/ar-invoices/${docId}/attachments`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

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
            throw new Error(`Failed to fetch attachment: ${response.status}`);
        }

        const result = await response.json();

        if (!result.data || result.data.length === 0) {
            throw new Error('No attachments found');
        }

        // Find the specific attachment by ID or fileName
        const targetAttachment = result.data.find(att =>
            att.id === attachment.id ||
            att.fileName === attachment.fileName ||
            att.filePath === attachment.filePath
        );

        if (!targetAttachment) {
            throw new Error('Attachment not found');
        }

        // Close loading indicator
        Swal.close();

        // Construct the file URL using the filePath from API response
        if (targetAttachment.filePath) {
            const decodedPath = decodeURIComponent(targetAttachment.filePath);
            const fileUrl = `${BASE_URL}${decodedPath.startsWith('/') ? decodedPath : '/' + decodedPath}`;

            // Open file in new tab
            window.open(fileUrl, '_blank');
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

// Function to display Print Out Reimbursement document
function displayPrintOutReimbursement(reimbursementData) {
    const container = document.getElementById('printOutReimbursementList');
    if (!container) {
        console.warn('Print Out Reimbursement container not found: printOutReimbursementList');
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Get reimbursement ID from various possible sources
    let reimbursementId = null;

    // Try to get from URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    reimbursementId = urlParams.get('reimbursement-id') || urlParams.get('id');

    // If not in URL, try to get from form data
    if (!reimbursementId) {
        const counterRefField = document.getElementById('CounterRef');
        if (counterRefField && counterRefField.value) {
            reimbursementId = counterRefField.value;
        }
    }

    // If still not found, try to get from reimbursement data
    if (!reimbursementId && reimbursementData && reimbursementData.id) {
        reimbursementId = reimbursementData.id;
    }

    if (!reimbursementId) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Reimbursement ID not found</p>';
        return;
    }

    // Build the Print Receive Reimbursement URL with parameters
    const baseUrl = window.location.origin;
    const printReimUrl = `${baseUrl}/approvalPages/approval/receive/reimbursement/printReim.html?reim-id=${reimbursementId}`;

    // Add additional parameters if available from reimbursement data
    let fullUrl = printReimUrl;
    if (reimbursementData) {
        const params = new URLSearchParams();

        // Add all available parameters from reimbursement data
        if (reimbursementData.payToName) params.append('payTo', encodeURIComponent(reimbursementData.payToName));
        if (reimbursementData.voucherNo) params.append('voucherNo', encodeURIComponent(reimbursementData.voucherNo));
        if (reimbursementData.submissionDate) params.append('submissionDate', reimbursementData.submissionDate);
        if (reimbursementData.department) params.append('department', encodeURIComponent(reimbursementData.department));
        if (reimbursementData.referenceDoc) params.append('referenceDoc', encodeURIComponent(reimbursementData.referenceDoc));
        if (reimbursementData.preparedByName) params.append('preparedBy', encodeURIComponent(reimbursementData.preparedByName));
        if (reimbursementData.checkedByName) params.append('checkedBy', encodeURIComponent(reimbursementData.checkedByName));
        if (reimbursementData.acknowledgedByName) params.append('acknowledgeBy', encodeURIComponent(reimbursementData.acknowledgedByName));
        if (reimbursementData.approvedByName) params.append('approvedBy', encodeURIComponent(reimbursementData.approvedByName));
        if (reimbursementData.receivedByName) params.append('receivedBy', encodeURIComponent(reimbursementData.receivedByName));
        if (reimbursementData.totalAmount) params.append('totalAmount', reimbursementData.totalAmount);
        if (reimbursementData.currency) params.append('currency', reimbursementData.currency);
        if (reimbursementData.remarks) params.append('remarks', encodeURIComponent(reimbursementData.remarks));
        if (reimbursementData.typeOfTransaction) params.append('typeOfTransaction', encodeURIComponent(reimbursementData.typeOfTransaction));

        // Add details if available
        if (reimbursementData.reimbursementDetails && reimbursementData.reimbursementDetails.length > 0) {
            const details = reimbursementData.reimbursementDetails.map(detail => ({
                category: detail.category || '',
                accountName: detail.accountName || '',
                glAccount: detail.glAccount || '',
                description: detail.description || '',
                amount: detail.amount || 0
            }));
            params.append('details', encodeURIComponent(JSON.stringify(details)));
        }

        // If we have parameters, append them to the URL
        if (params.toString()) {
            fullUrl += '&' + params.toString();
        }
    }

    // Create the document item
    const documentItem = document.createElement('div');
    documentItem.className = 'flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200';

    const fileInfo = document.createElement('div');
    fileInfo.className = 'flex items-center space-x-2';

    // Use a document icon for the print reimbursement
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

    // View button
    const viewBtn = document.createElement('button');
    viewBtn.className = 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50';
    viewBtn.innerHTML = 'View';
    viewBtn.onclick = () => viewPrintReimbursement(fullUrl);

    // Open in new tab button
    const openBtn = document.createElement('button');
    openBtn.className = 'text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded border border-green-300 hover:bg-green-50';
    openBtn.innerHTML = 'Open';
    openBtn.onclick = () => openPrintReimbursement(fullUrl);

    actions.appendChild(viewBtn);
    actions.appendChild(openBtn);

    documentItem.appendChild(fileInfo);
    documentItem.appendChild(actions);
    container.appendChild(documentItem);
}

// Function to view Print Reimbursement document
async function viewPrintReimbursement(url) {
    try {
        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            text: 'Loading Print Receive Reimbursement document...',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Open the URL in a new window/tab
        const newWindow = window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

        if (newWindow) {
            // Close loading indicator
            Swal.close();

            // Show success message
            Swal.fire({
                title: 'Success',
                text: 'Print Receive Reimbursement document opened in new window',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } else {
            throw new Error('Failed to open document window');
        }

    } catch (error) {
        console.error('Error viewing Print Reimbursement document:', error);

        Swal.fire({
            title: 'Error',
            text: `Failed to open Print Receive Reimbursement document: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to open Print Reimbursement document in new tab
function openPrintReimbursement(url) {
    try {
        window.open(url, '_blank');
    } catch (error) {
        console.error('Error opening Print Reimbursement document:', error);

        Swal.fire({
            title: 'Error',
            text: `Failed to open Print Receive Reimbursement document: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Enhanced refresh attachments function
async function refreshAttachments() {
    const urlParams = new URLSearchParams(window.location.search);
    let docId = urlParams.get('id');

    // If no docId in URL, try to get it from localStorage
    if (!docId) {
        docId = localStorage.getItem('currentStagingOutgoingPaymentId');
    }

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

        await loadAttachmentsFromAPI(docId);

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
}// detailOPAcct.js - Optimized Version with View and Print Features

// Global variables
let arInvoiceData = null;
let existingAttachments = []; // Track existing attachments from API

// Function to check authentication
function checkAuthentication() {
    if (typeof isAuthenticated === 'function') {
        if (!isAuthenticated()) {
            logoutAuth();
            return false;
        }
        return true;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '../pages/login.html';
        return false;
    }

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const userInfo = JSON.parse(jsonPayload);

        if (userInfo.exp && Date.now() >= userInfo.exp * 1000) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('loggedInUser');
            window.location.href = '../pages/login.html';
            return false;
        }
    } catch (error) {
        console.error('Error checking token expiration:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('loggedInUser');
        window.location.href = '../pages/login.html';
        return false;
    }

    return true;
}

// Function to initialize the page
async function initializePage() {
    console.log('initializePage called');
    try {
        if (!checkAuthentication()) return;

        const urlParams = new URLSearchParams(window.location.search);
        const opId = urlParams.get('op-id');
        const reimbursementId = urlParams.get('reimbursement-id');
        const docId = urlParams.get('id');

        console.log('URL parameters - opId:', opId, 'reimbursementId:', reimbursementId, 'docId:', docId);

        // Set reimbursement ID in CounterRef field if available
        if (reimbursementId) {
            const counterRefField = document.getElementById('CounterRef');
            if (counterRefField) {
                counterRefField.value = reimbursementId;
            }
        }

        // Set default value for jrnlMemo field if empty
        const jrnlMemoField = document.getElementById('jrnlMemo');
        if (jrnlMemoField && !jrnlMemoField.value.trim()) {
            jrnlMemoField.value = 'REIMBURSEMENT';
        }

        // Ensure Remarks and Journal Remarks fields are empty for manual input
        const remarksField = document.getElementById('remarks');
        if (remarksField) {
            remarksField.value = '';
        }
        const journalRemarksField = document.getElementById('journalRemarks');
        if (journalRemarksField) {
            journalRemarksField.value = '';
        }

        if (opId) {
            loadARInvoiceDetails(opId);
        } else if (reimbursementId) {
            loadReimbursementDataFromUrl(reimbursementId);
        } else if (!docId) {
            await fetchAndSetLastSerialNumber();
        } else {
            loadReimbursementData();
        }

        await initializeUserDropdowns();
        initializeInputValidations();

        setTimeout(() => {
            loadDocumentData();
        }, 500);

        if (docId) {
            setTimeout(() => {
                loadDocumentData();
            }, 1000);

            // Load existing attachments if editing
            setTimeout(() => {
                loadAttachmentsFromAPI(docId);
            }, 1500);
        }

        initializeCurrencyDropdownHandlers();

        // Setup line item listeners for automatic calculation
        setupLineItemListeners();

        setTimeout(async () => {
            await ensureApprovalFieldValues();
            autofillPreparedByWithCurrentUser();
            updateTotalAmountDue();
            // Set initial Remittance Request Amount from net amount (only once)
            setTimeout(() => {
                console.log('🔄 Initializing RemittanceRequestAmount field from net amount...');
                setInitialRemittanceRequestAmount();
                console.log('✅ RemittanceRequestAmount initialization completed');
            }, 100);
        }, 1000);

    } catch (error) {
        console.error('Error in initializePage:', error);
        if (!error.message.includes('authentication') && !error.message.includes('login')) {
            Swal.fire({
                title: 'Error',
                text: `Failed to initialize page: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
}

// Function to set Remittance Request Amount from initial total - only called once on data load
function setInitialRemittanceRequestAmount() {
    console.log('🔄 Setting Initial Remittance Request Amount from net amount...');
    const remittanceField = document.getElementById('RemittanceRequestAmount');
    console.log('Remittance field element:', remittanceField);

    if (remittanceField) {
        // Jika sudah ada nilai awal, jangan ubah (hanya set sekali)
        if (remittanceField.getAttribute('data-initial-set')) {
            console.log('⚠️ Field already initialized, skipping...');
            return;
        }

        // Ambil nilai dari currency utama (pertama kali)
        const currencyTotals = {};
        const tableRows = document.querySelectorAll('#tableBody tr');
        console.log('Table rows found:', tableRows.length);

        tableRows.forEach((row, index) => {
            const currencyInput = row.querySelector('.currency-search-input');
            const amountInput = row.querySelector('.currency-input-idr');
            console.log(`Row ${index}:`, { currencyInput, amountInput });

            if (!currencyInput || !amountInput) return;
            const currency = (currencyInput.value || 'IDR').trim().toUpperCase();
            let amount = 0;
            if (typeof window.parseCurrencyIDR === 'function') {
                amount = window.parseCurrencyIDR(amountInput.value);
            } else {
                amount = parseCurrency(amountInput.value);
            }
            if (!currencyTotals[currency]) currencyTotals[currency] = 0;
            currencyTotals[currency] += amount;
            console.log(`Row ${index} - Currency: ${currency}, Amount: ${amount}`);
        });

        console.log('Currency totals:', currencyTotals);

        // Ambil currency utama dan totalnya
        const currencyKeys = Object.keys(currencyTotals);
        const mainCurrency = currencyKeys[0] || 'IDR';
        const mainTotal = currencyTotals[mainCurrency] || 0;

        console.log('Main currency:', mainCurrency);
        console.log('Main total:', mainTotal);

        // Set nilai awal (hanya sekali)
        const formattedValue = typeof window.formatCurrencyIDR === 'function' ?
            window.formatCurrencyIDR(mainTotal) : formatCurrencyValue(mainTotal);

        console.log('💰 Setting RemittanceRequestAmount field:');
        console.log('- Main total (raw):', mainTotal);
        console.log('- Main total type:', typeof mainTotal);
        console.log('- Formatted value:', formattedValue);
        console.log('- Formatted value type:', typeof formattedValue);

        remittanceField.value = formattedValue;
        remittanceField.setAttribute('data-initial-set', 'true'); // Mark as initialized

        // Verify the field was set correctly
        console.log('- Field value after setting:', remittanceField.value);
        console.log('- Field value type after setting:', typeof remittanceField.value);

        console.log('✅ Set initial Remittance Request Amount to:', formattedValue);
        console.log('🔒 Field locked - will not change when net amount changes');
    } else {
        console.error('❌ RemittanceRequestAmount field not found!');
    }
}

// Call initialization when the page loads
window.onload = async function () {
    await initializePage();
    setTimeout(() => {
        updateTotalAmountDue();
    }, 100);
};

// Helper function to get logged-in user ID
function getUserId() {
    const token = localStorage.getItem('accessToken');
    if (token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const userInfo = JSON.parse(jsonPayload);
            return userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        } catch (error) {
            console.error('Error decoding JWT token:', error);
        }
    }

    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.id : null;
}

// Function to get current logged-in user information
function getCurrentLoggedInUser() {
    try {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const userInfo = JSON.parse(jsonPayload);

                return {
                    id: userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
                    name: userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || userInfo.name || ''
                };
            } catch (error) {
                console.error('Error decoding JWT token:', error);
            }
        }

        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (user) {
            return {
                id: user.id,
                name: user.name || user.username || ''
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting current logged-in user:', error);
        return null;
    }
}

// Function to auto-fill preparedBy with current logged-in user
function autofillPreparedByWithCurrentUser() {
    const currentUser = getCurrentLoggedInUser();
    if (!currentUser) {
        console.warn('Could not get current logged-in user information');
        return;
    }

    const preparedByField = document.getElementById('Approval.PreparedById');
    const preparedBySearch = document.getElementById('Approval.PreparedByIdSearch');

    if (preparedByField && preparedBySearch) {
        if (preparedByField.value && preparedBySearch.value.trim()) {
            console.log('PreparedBy field already has a value, not overwriting');
            return;
        }
    }

    console.log('Auto-filling preparedBy with current user:', currentUser);
    setApprovalFieldValue('Approval.PreparedById', currentUser.id, currentUser.name);

    if (preparedBySearch) {
        let displayName = currentUser.name;
        if (window.users && window.users.length > 0) {
            const user = window.users.find(u => u.id === currentUser.id);
            if (user && user.fullName) {
                displayName = user.fullName;
            }
        }

        preparedBySearch.value = displayName;
        preparedBySearch.disabled = true;
        preparedBySearch.readOnly = true;
        preparedBySearch.classList.add('bg-gray-100', 'cursor-not-allowed');
        preparedBySearch.title = 'Auto-filled with current user';

        var dropdown = document.getElementById('Approval.PreparedByIdDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }
}

// Function to load data from reimbursement document (from localStorage)
async function loadReimbursementData() {
    const reimbursementDataStr = localStorage.getItem('selectedReimbursementData');
    if (!reimbursementDataStr) {
        console.log('No reimbursement data found in localStorage');
        return;
    }

    try {
        const reimbursementData = JSON.parse(reimbursementDataStr);
        console.log('Loaded reimbursement data from localStorage:', reimbursementData);

        if (!reimbursementData) {
            console.error('Reimbursement data is null or undefined');
            return;
        }

        const reimbursementId = reimbursementData.id;
        if (!reimbursementId) {
            console.error('Reimbursement ID not found in data');
            return;
        }

        await loadReimbursementDataFromUrl(reimbursementId);

    } catch (error) {
        console.error('Error loading reimbursement data from localStorage:', error);
        Swal.fire({
            title: 'Error',
            text: `Failed to load reimbursement data: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to load reimbursement data from URL parameter
async function loadReimbursementDataFromUrl(reimbursementId) {
    if (!reimbursementId) {
        console.error('Reimbursement ID not found in URL');
        return;
    }

    Swal.fire({
        title: 'Loading...',
        text: 'Loading reimbursement data, please wait...',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // Try different endpoints for reimbursement data
        const endpoints = [
            `/api/ar-invoices/${reimbursementId}`,
            `/api/ar-invoices/${reimbursementId}/details`,
            `/api/reimbursements/${reimbursementId}`,
            `/api/documents/${reimbursementId}`
        ];

        let response = null;
        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                console.log('🌐 Trying to fetch data from:', endpoint);

                response = await makeAuthenticatedRequest(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'text/plain'
                    }
                });

                if (response.ok) {
                    console.log('✅ Success with endpoint:', endpoint);
                    break;
                } else {
                    console.warn(`⚠️ Endpoint ${endpoint} returned status: ${response.status}`);
                    lastError = new Error(`Failed to fetch data: ${response.status}`);
                }
            } catch (error) {
                console.warn(`⚠️ Endpoint ${endpoint} failed:`, error.message);
                lastError = error;
            }
        }

        if (!response || !response.ok) {
            throw lastError || new Error('All endpoints failed');
        }

        const result = await response.json();

        if (!result.status || !result.data) {
            throw new Error('Invalid response from API');
        }

        const detailedData = result.data;
        console.log('Detailed reimbursement data:', detailedData);

        // Populate form fields
        document.getElementById('CounterRef').value = detailedData.voucherNo || reimbursementId || '';
        document.getElementById('RequesterName').value = detailedData.receivedByName || '';

        if (detailedData.payTo) {
            document.getElementById('CardName').value = detailedData.payTo;
            function tryReplaceWithFullName() {
                if (Array.isArray(users) && users.length > 0) {
                    const user = users.find(u => u.id === detailedData.payTo);
                    if (user) {
                        document.getElementById('CardName').value = user.fullName;
                        return true;
                    } else if (detailedData.payToName) {
                        document.getElementById('CardName').value = detailedData.payToName;
                        return true;
                    }
                }
                return false;
            }
            if (!tryReplaceWithFullName()) {
                const interval = setInterval(() => {
                    if (tryReplaceWithFullName()) clearInterval(interval);
                }, 100);
            }
        } else if (detailedData.payToName) {
            document.getElementById('CardName').value = detailedData.payToName;
        }

        document.getElementById('Address').value = '';

        if (detailedData.submissionDate) {
            const docDate = new Date(detailedData.submissionDate);
            document.getElementById('DocDate').value = docDate.toISOString().split('T')[0];
        }

        const today = new Date();
        document.getElementById('DocDueDate').value = today.toISOString().split('T')[0];
        document.getElementById('TrsfrDate').value = today.toISOString().split('T')[0];

        await fetchAndSetLastSerialNumber();

        const jrnlMemoValue = detailedData.typeOfTransaction || detailedData.jrnlMemo || 'REIMBURSEMENT';
        document.getElementById('jrnlMemo').value = jrnlMemoValue;

        // Remarks field is left empty for manual input
        // document.getElementById('remarks').value = detailedData.remarks || '';
        document.getElementById('TrsfrAcct').value = '';

        if (detailedData.totalAmount !== null && detailedData.totalAmount !== undefined) {
            const formattedAmount = formatCurrencyValue(detailedData.totalAmount);
            document.getElementById('TrsfrSum').value = formattedAmount;

            const netTotalField = document.getElementById('netTotal');
            const totalTaxField = document.getElementById('totalTax');
            const totalAmountDueField = document.getElementById('totalAmountDue');

            if (netTotalField) netTotalField.value = formattedAmount;
            if (totalTaxField) totalTaxField.value = formattedAmount;
            if (totalAmountDueField) totalAmountDueField.value = formattedAmount;
        }

        // Display attachments if available
        if (detailedData.reimbursementAttachments && Array.isArray(detailedData.reimbursementAttachments)) {
            console.log('=== REIMBURSEMENT ATTACHMENTS DEBUG ===');
            console.log('Raw reimbursementAttachments:', detailedData.reimbursementAttachments);
            console.log('Number of attachments:', detailedData.reimbursementAttachments.length);

            detailedData.reimbursementAttachments.forEach((att, index) => {
                console.log(`Attachment ${index}:`, att);
                console.log(`  - id: ${att.id}`);
                console.log(`  - attachmentID: ${att.attachmentID}`);
                console.log(`  - attachmentId: ${att.attachmentId}`);
                console.log(`  - fileName: ${att.fileName}`);
                console.log(`  - filePath: ${att.filePath}`);
            });

            console.log('Displaying attachments:', detailedData.reimbursementAttachments);
            displayExistingAttachments(detailedData.reimbursementAttachments);

            // Store attachments for later use
            window.existingAttachments = [...detailedData.reimbursementAttachments];
            existingAttachments = window.existingAttachments;

            console.log('=== ATTACHMENT STORAGE DEBUG ===');
            console.log('existingAttachments stored:', existingAttachments);
            console.log('Global existingAttachments variable:', window.existingAttachments);
        } else {
            console.log('No reimbursement attachments found in detailedData');
            window.existingAttachments = [];
            existingAttachments = window.existingAttachments;
        }

        // Display Print Out Reimbursement document
        displayPrintOutReimbursement(detailedData);
        const tableBody = document.getElementById('tableBody');
        if (detailedData.reimbursementDetails && Array.isArray(detailedData.reimbursementDetails) && detailedData.reimbursementDetails.length > 0) {
            // Clear existing rows
            tableBody.innerHTML = '';

            detailedData.reimbursementDetails.forEach((detail) => {
                if (detail && typeof detail === 'object') {
                    const lineData = {
                        acctCode: detail.glAccount || '',
                        acctName: detail.accountName || '',
                        descrip: detail.description || '',
                        sumApplied: detail.amount || 0
                    };
                    addRowWithData(lineData);
                }
            });

            setTimeout(() => {
                updateTotalAmountDue();
                // Set initial Remittance Request Amount from first total calculation
                setInitialRemittanceRequestAmount();
            }, 100);
        }

        // Set approval information
        const setUserField = (fieldId, userId, userName) => {
            const hiddenSelect = document.getElementById(fieldId);
            const searchInput = document.getElementById(`${fieldId}Search`);

            if (hiddenSelect && searchInput) {
                hiddenSelect.value = userId || '';
                if (!fieldId.startsWith('Approval.')) {
                    searchInput.value = userName || '';
                }
            } else if (hiddenSelect) {
                hiddenSelect.value = userId || '';
            }
        };

        const currentUserId = getUserId();
        const preparedBy = detailedData.preparedBy || currentUserId;
        const preparedByName = detailedData.preparedByName || '';
        setUserField('Approval.PreparedById', preparedBy, preparedByName);

        if (detailedData.checkedBy) {
            setUserField('Approval.CheckedById', detailedData.checkedBy, detailedData.checkedByName);
        }
        if (detailedData.acknowledgedBy) {
            setUserField('Approval.AcknowledgedById', detailedData.acknowledgedBy, detailedData.acknowledgedByName);
        }
        if (detailedData.approvedBy) {
            setUserField('Approval.ApprovedById', detailedData.approvedBy, detailedData.approvedByName);
        }
        if (detailedData.receivedBy) {
            setUserField('Approval.ReceivedById', detailedData.receivedBy, detailedData.receivedByName);
        }

        localStorage.removeItem('selectedReimbursementData');
        updateTotalAmountDue();

        Swal.close();
        Swal.fire({
            title: 'Success',
            text: 'Reimbursement data loaded successfully',
            icon: 'success',
            confirmButtonText: 'OK'
        });

    } catch (error) {
        console.error('Error loading reimbursement data:', error);
        Swal.close();

        if (!error.message.includes('authentication') && !error.message.includes('login')) {
            let errorMessage = `Failed to load reimbursement data: ${error.message}`;

            // Add more specific error messages
            if (error.message.includes('404')) {
                errorMessage = `Reimbursement not found (404). Please check if the reimbursement ID is correct: ${reimbursementId}`;
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = `Cannot connect to server. Please check if the backend server is running.`;
            } else if (error.message.includes('All endpoints failed')) {
                errorMessage = `All API endpoints failed. Please check server connection and reimbursement ID: ${reimbursementId}`;
            }

            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
}

// Function to add a row with predefined data (simplified, read-only)
function addRowWithData(lineData) {
    console.log('addRowWithData called with:', lineData);
    if (!lineData || typeof lineData !== 'object') {
        console.error('Invalid lineData provided to addRowWithData');
        return;
    }

    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }

    const newRow = tableBody.insertRow();

    // Create editable cells for G/L Account and Account Name, with per-row dropdowns and event listeners
    const rowId = `row_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // G/L Account
    const acctCodeCell = newRow.insertCell();
    acctCodeCell.className = 'p-2 border';
    const acctCodeInputId = `AcctCode_${rowId}`;
    const acctCodeDropdownId = `AcctCodeDropdown_${rowId}`;
    acctCodeCell.innerHTML = `
        <div class="relative">
            <input type="text" class="w-full search-input acct-code-input" value="${lineData.acctCode || ''}" maxlength="255" id="${acctCodeInputId}" autocomplete="off" />
            <div id="${acctCodeDropdownId}" class="absolute z-20 hidden w-full mt-1 bg-white border rounded shadow-lg max-h-40 overflow-y-auto search-dropdown"></div>
        </div>
    `;

    // Account Name
    const acctNameCell = newRow.insertCell();
    acctNameCell.className = 'p-2 border';
    const acctNameInputId = `AcctName_${rowId}`;
    const acctNameDropdownId = `AcctNameDropdown_${rowId}`;
    acctNameCell.innerHTML = `
        <div class="relative">
            <input type="text" class="w-full search-input acct-name-input" value="${lineData.acctName || ''}" id="${acctNameInputId}" autocomplete="off" />
            <div id="${acctNameDropdownId}" class="absolute z-20 hidden w-full mt-1 bg-white border rounded shadow-lg max-h-40 overflow-y-auto search-dropdown"></div>
        </div>
    `;

    // Attach event listeners for G/L Account input
    setTimeout(() => {
        const acctCodeInput = document.getElementById(acctCodeInputId);
        const acctCodeDropdown = document.getElementById(acctCodeDropdownId);
        if (acctCodeInput && acctCodeDropdown) {
            acctCodeInput.addEventListener('keyup', function () {
                searchGLAccountCustom(this, acctCodeDropdown, acctNameInputId);
            });
            acctCodeInput.addEventListener('focus', function () {
                showGLAccountDropdownCustom(this, acctCodeDropdown, acctNameInputId);
            });
            acctCodeInput.addEventListener('input', function () {
                searchGLAccountCustom(this, acctCodeDropdown, acctNameInputId);
            });
        }
        // Account Name input
        const acctNameInput = document.getElementById(acctNameInputId);
        const acctNameDropdown = document.getElementById(acctNameDropdownId);
        if (acctNameInput && acctNameDropdown) {
            acctNameInput.addEventListener('keyup', function () {
                searchAccountNameCustom(this, acctNameDropdown, acctCodeInputId);
            });
            acctNameInput.addEventListener('focus', function () {
                showAccountNameDropdownCustom(this, acctNameDropdown, acctCodeInputId);
            });
            acctNameInput.addEventListener('input', function () {
                searchAccountNameCustom(this, acctNameDropdown, acctCodeInputId);
            });
        }
    }, 10);

    const descriptionCell = newRow.insertCell();
    descriptionCell.className = 'p-2 border';
    descriptionCell.innerHTML = `<input type="text" class="w-full" value="${lineData.descrip || ''}" maxlength="255" />`;

    // Editable currency dropdown
    const currencyItemCell = newRow.insertCell();
    currencyItemCell.className = 'p-2 border';
    const currencyId = `currencyItem_${Date.now()}`;
    currencyItemCell.innerHTML = `
        <div class="relative">
            <input type="text" id="${currencyId}" class="w-full currency-search-input" value="${lineData.currencyItem || ''}" maxlength="10" onkeyup="searchCurrencies(this)" onfocus="showCurrencyDropdown(this)" />
            <div id="${currencyId}Dropdown" class="absolute z-20 hidden w-full mt-1 bg-white border rounded shadow-lg max-h-40 overflow-y-auto currency-dropdown"></div>
        </div>
    `;

    // Editable amount field
    const amountCell = newRow.insertCell();
    amountCell.className = 'p-2 border';
    const sumApplied = lineData.sumApplied !== null && lineData.sumApplied !== undefined ? lineData.sumApplied : 0;
    const formattedAmount = typeof window.formatCurrencyIDR === 'function' ?
        window.formatCurrencyIDR(sumApplied) : formatCurrencyValue(sumApplied);
    amountCell.innerHTML = `<input type="text" class="w-full currency-input-idr" value="${formattedAmount}" oninput="formatCurrencyInputIDR(this); updateTotalAmountDue();" />`;

    // Setup currency formatting for the amount input
    const amountInput = amountCell.querySelector('input');
    if (amountInput && amountInput.classList.contains('currency-input-idr')) {
        if (!amountInput.value || amountInput.value === '0') {
            amountInput.value = '0.00';
        }
        amountInput.addEventListener('input', function () {
            if (typeof window.formatCurrencyInputIDR === 'function') {
                window.formatCurrencyInputIDR(this);
            }
            updateTotalAmountDue();
        });
    }

    updateTotalAmountDue();

    // Setelah baris selesai dibuat, tambahkan event listener agar updateTotalAmountDue selalu dipanggil
    setTimeout(() => {
        // Currency input
        const currencyInput = newRow.querySelector('.currency-search-input');
        if (currencyInput) {
            ['input', 'change', 'blur'].forEach(evt => {
                currencyInput.addEventListener(evt, updateTotalAmountDue);
            });
        }
        // Amount input
        const amountInput = newRow.querySelector('.currency-input-idr');
        if (amountInput) {
            ['input', 'change', 'blur'].forEach(evt => {
                amountInput.addEventListener(evt, updateTotalAmountDue);
            });
        }
    }, 10);
}

// Inisialisasi awal untuk baris yang sudah ada di tabel
window.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.currency-search-input').forEach(input => {
        ['input', 'change', 'blur'].forEach(evt => {
            input.addEventListener(evt, updateTotalAmountDue);
        });
    });
    document.querySelectorAll('.currency-input-idr').forEach(input => {
        ['input', 'change', 'blur'].forEach(evt => {
            input.addEventListener(evt, updateTotalAmountDue);
        });
    });
});

// Helper function to format currency
function formatCurrencyValue(number) {
    try {
        if (typeof window.formatNumberToCurrencyString === 'function') {
            return window.formatNumberToCurrencyString(number);
        } else {
            return formatCurrencyFallback(number);
        }
    } catch (e) {
        console.error('Error in formatCurrencyValue:', e);
        return '';
    }
}

// Fallback function for currency formatting
function formatCurrencyFallback(number) {
    if (number === null || number === undefined || number === '') {
        return '';
    }

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
        console.error('Error parsing number in fallback:', e);
        return '';
    }

    // Use manual formatting for large numbers to ensure proper handling
    const numStr = num.toFixed(2);
    const parts = numStr.split('.');
    const wholePart = parts[0];
    const decimalPart = parts[1] || '00';

    // Handle negative number
    const isNegative = wholePart.startsWith('-');
    const absWholePart = isNegative ? wholePart.substring(1) : wholePart;

    let formattedWhole = '';
    for (let i = 0; i < absWholePart.length; i++) {
        if (i > 0 && (absWholePart.length - i) % 3 === 0) {
            formattedWhole += ',';
        }
        formattedWhole += absWholePart[i];
    }

    const result = (isNegative ? '-' : '') + formattedWhole + '.' + decimalPart;
    console.log('💰 Currency formatting:', { input: number, output: result });
    return result;
}

// Helper function to parse formatted currency back to number
function parseCurrency(formattedValue) {
    if (!formattedValue) return 0;

    try {
        if (typeof window.parseCurrencyValue === 'function') {
            return window.parseCurrencyValue(formattedValue);
        }

        // Handle both formats: with commas (7,600,099,990.00) and without commas (7600099990.00)
        let numericValue = formattedValue.toString().trim();
        console.log('💰 Currency parsing - STEP 1 (initial):', numericValue);

        // Remove all commas first (thousand separators)
        numericValue = numericValue.replace(/,/g, '');
        console.log('💰 Currency parsing - STEP 2 (after removing commas):', numericValue);

        // Handle decimal separator
        const parts = numericValue.split('.');
        console.log('💰 Currency parsing - STEP 3 (parts after split):', parts);

        if (parts.length === 1) {
            // No decimal point, treat as whole number
            numericValue = parts[0] + '.00';
            console.log('💰 Currency parsing - STEP 4 (no decimal, adding .00):', numericValue);
        } else if (parts.length === 2) {
            // Has decimal point, ensure 2 decimal places
            const wholePart = parts[0];
            const decimalPart = parts[1].padEnd(2, '0').substring(0, 2);
            numericValue = wholePart + '.' + decimalPart;
            console.log('💰 Currency parsing - STEP 4 (with decimal, ensuring 2 places):', numericValue);
        } else if (parts.length > 2) {
            // Multiple dots, keep only the last one as decimal
            const wholePart = parts.slice(0, -1).join('');
            const decimalPart = parts[parts.length - 1].padEnd(2, '0').substring(0, 2);
            numericValue = wholePart + '.' + decimalPart;
            console.log('💰 Currency parsing - STEP 4 (multiple dots handling):', numericValue);
        }

        const result = parseFloat(numericValue) || 0;
        console.log('💰 Currency parsing - FINAL RESULT:', {
            input: formattedValue,
            cleaned: numericValue,
            output: result,
            isLargeNumber: result > 999999999,
            partsCount: parts.length
        });
        return result;
    } catch (e) {
        console.error('Error parsing currency:', e);
        return 0;
    }
}

// Function to initialize input field validations
function initializeInputValidations() {
    setupCurrencyInput('totalAmountDue');
    setupCurrencyInput('netTotal');
    setupCurrencyInput('totalTax');
    setupCurrencyInput('TrsfrSum');
    // setupCurrencyInput('RemittanceRequestAmount'); // Field is readonly, no need for formatting

    const idrInputs = document.querySelectorAll('.currency-input-idr');
    idrInputs.forEach(input => {
        if (!input.readOnly) {
            if (!input.value || input.value === '0') {
                input.value = '0.00';
            }

            input.addEventListener('input', function () {
                if (typeof window.formatCurrencyInputIDR === 'function') {
                    window.formatCurrencyInputIDR(this);
                }
                updateTotalAmountDue();
            });
        }
    });

    setupTextInput('description');
    setupTextInput('AcctCode');
    setupTextInput('AcctName');

    document.querySelectorAll('.currency-input').forEach(input => {
        input.addEventListener('input', () => {
            updateTotalAmountDue();
        });
    });

    initializeUserDropdowns();
}

// Function to setup currency input with formatting
function setupCurrencyInput(input) {
    const inputElement = typeof input === 'string' ? document.getElementById(input) : input;

    if (inputElement) {
        inputElement.numericValue = 0;
        inputElement.type = 'text';
        inputElement.classList.add('currency-input');

        inputElement.addEventListener('input', function (e) {
            if (this.classList.contains('currency-input-idr')) {
                if (typeof window.formatCurrencyInputIDR === 'function') {
                    window.formatCurrencyInputIDR(this);
                } else {
                    formatCurrency(this, '.');
                }
                updateTotalAmountDue();
                return;
            }

            let rawValue = this.value;
            rawValue = rawValue.replace(/\./g, '');
            rawValue = rawValue.replace(/,/g, '.');
            rawValue = rawValue.replace(/[^\d.-]/g, '');

            try {
                const numericValue = parseFloat(rawValue) || 0;
                this.numericValue = numericValue;

                if (this.value.trim() !== '') {
                    const formattedValue = formatCurrencyValue(rawValue);
                    inputElement.value = formattedValue;
                    inputElement.numericValue = rawValue;

                    inputElement.addEventListener('input', function () {
                        const currentValue = this.value.replace(/[^\d.-]/g, '');
                        const numericValue = parseFloat(currentValue) || 0;
                        this.numericValue = numericValue;
                        this.value = formatCurrencyValue(this.numericValue);
                        updateTotalAmountDue();
                    });

                    inputElement.addEventListener('focus', function () {
                        this.value = this.numericValue || 0;
                    });

                    inputElement.addEventListener('blur', function () {
                        this.value = formatCurrencyValue(this.numericValue);
                    });
                }
            } catch (e) {
                console.error('Error in currency input processing:', e);
                this.value = rawValue;
            }
        });

        inputElement.addEventListener('focus', function () {
            this.select();
        });

        inputElement.addEventListener('blur', function () {
            if (this.value.trim() !== '') {
                try {
                    if (this.classList.contains('currency-input-idr')) {
                        if (typeof window.formatCurrencyIDR === 'function') {
                            this.value = window.formatCurrencyIDR(this.numericValue);
                        } else {
                            this.value = formatCurrencyValue(this.numericValue);
                        }
                    } else {
                        this.value = formatCurrencyValue(this.numericValue);
                    }
                } catch (e) {
                    console.error('Error formatting on blur:', e);
                }
            }
        });
    }
}

// Function to setup text input validation
function setupTextInput(inputId) {
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
        inputElement.maxLength = 255;
    }
}

// Function to update the total amount due
function updateTotalAmountDue() {
    console.log('🔄 Updating Total Amount Due...');

    let subTotal = 0;
    let vatTotal = 0;
    let wtTotal = 0;
    let documentTotal = 0;

    const tableRows = document.querySelectorAll('#tableBody tr');
    console.log('Table rows found for total calculation:', tableRows.length);

    tableRows.forEach(row => {
        const lineTotalInput = row.querySelector('input[id="LineTotal"]');
        if (lineTotalInput) {
            const lineTotal = parseFloat(lineTotalInput.value) || 0;
            subTotal += lineTotal;
        }
    });

    // Get VAT and WT values from header fields
    const vatSum = parseFloat(document.getElementById('VatSum')?.value) || 0;
    const wtSum = parseFloat(document.getElementById('WTSum')?.value) || 0;

    vatTotal = vatSum;
    wtTotal = wtSum;
    documentTotal = subTotal + vatTotal + wtTotal;

    // Update total fields
    const subTotalInput = document.getElementById('subTotal');
    const vatTotalInput = document.getElementById('vatTotal');
    const wtTotalInput = document.getElementById('wtTotal');
    const documentTotalInput = document.getElementById('documentTotal');

    if (subTotalInput) subTotalInput.value = subTotal.toFixed(2);
    if (vatTotalInput) vatTotalInput.value = vatTotal.toFixed(2);
    if (wtTotalInput) wtTotalInput.value = wtTotal.toFixed(2);
    if (documentTotalInput) documentTotalInput.value = documentTotal.toFixed(2);

    // Update header document total fields
    const headerDocTotal = document.getElementById('DocTotal');
    const headerDocTotalFC = document.getElementById('DocTotalFC');

    if (headerDocTotal) headerDocTotal.value = documentTotal.toFixed(2);
    if (headerDocTotalFC) headerDocTotalFC.value = documentTotal.toFixed(2);

    console.log('✅ Total Amount Due update completed');
}

// Function to calculate line total based on quantity and unit price
function calculateLineTotal(row) {
    const quantityInput = row.querySelector('input[id="Quantity"]');
    const priceInput = row.querySelector('input[id="PriceBefDi"]');
    const lineTotalInput = row.querySelector('input[id="LineTotal"]');

    if (quantityInput && priceInput && lineTotalInput) {
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const lineTotal = quantity * price;

        lineTotalInput.value = lineTotal.toFixed(2);
        updateTotalAmountDue();
    }
}

// Function to add event listeners to line item inputs
function setupLineItemListeners() {
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        tableBody.addEventListener('input', function (e) {
            if (e.target.matches('input[id="Quantity"], input[id="PriceBefDi"]')) {
                const row = e.target.closest('tr');
                calculateLineTotal(row);
            }
        });
    }
}

// Currency search and selection functions
async function searchCurrencies(inputElement) {
    console.log('searchCurrencies called with:', inputElement.value);

    const searchTerm = inputElement.value.trim();
    const dropdownId = inputElement.id + 'Dropdown';
    const dropdown = document.getElementById(dropdownId);

    if (!dropdown) {
        console.error('Dropdown not found for ID:', dropdownId);
        return;
    }

    try {
        let url = `${BASE_URL}/api/MasterCurrency/search`;
        if (searchTerm.length > 0) {
            url += `?searchTerm=${encodeURIComponent(searchTerm)}`;
        }

        const response = await makeAuthenticatedRequest(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            displayCurrencyResults(dropdown, result.data);
            dropdown.classList.remove('hidden');
        } else {
            dropdown.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error searching currencies:', error);
        dropdown.innerHTML = '<div class="dropdown-item text-red-500">Error loading currencies. Please try again.</div>';
        dropdown.classList.remove('hidden');
    }
}

function showCurrencyDropdown(inputElement) {
    const dropdownId = inputElement.id + 'Dropdown';
    const dropdown = document.getElementById(dropdownId);

    if (dropdown) {
        searchCurrencies(inputElement);
    }
}

function displayCurrencyResults(dropdown, currencies) {
    dropdown.innerHTML = '';

    currencies.forEach(currency => {
        const item = document.createElement('div');
        item.className = 'p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 transition-colors duration-150';
        item.innerHTML = `
            <div class="font-semibold text-blue-600">${currency.code}</div>
            <div class="text-sm text-gray-700">${currency.name}</div>
            <div class="text-xs text-gray-500">Symbol: ${currency.symbol}</div>
            <div class="text-xs text-gray-400">${currency.description || ''}</div>
        `;
        item.onclick = () => selectCurrency(currency, dropdown);
        dropdown.appendChild(item);
    });
}

function selectCurrency(currency, dropdown) {
    const inputElement = dropdown.previousElementSibling;
    if (inputElement) {
        inputElement.value = currency.code;
        dropdown.classList.add('hidden');

        inputElement.style.backgroundColor = '#f0f9ff';
        inputElement.style.borderColor = '#3b82f6';

        setTimeout(() => {
            inputElement.style.backgroundColor = '';
            inputElement.style.borderColor = '';
        }, 1000);

        const event = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(event);

        console.log(`Selected currency: ${currency.code} - ${currency.name}`);
    }
}

function initializeCurrencyDropdownHandlers() {
    document.addEventListener('click', function (e) {
        const currencyDropdowns = document.querySelectorAll('.currency-dropdown');
        currencyDropdowns.forEach(dropdown => {
            const inputElement = dropdown.previousElementSibling;
            if (!dropdown.contains(e.target) && !inputElement.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    });

    setTimeout(() => {
        const currencyInputs = document.querySelectorAll('.currency-search-input');
        currencyInputs.forEach(input => {
            input.removeEventListener('keyup', handleCurrencyKeyup);
            input.removeEventListener('focus', handleCurrencyFocus);
            input.removeEventListener('click', handleCurrencyClick);

            input.addEventListener('keyup', handleCurrencyKeyup);
            input.addEventListener('focus', handleCurrencyFocus);
            input.addEventListener('click', handleCurrencyClick);
        });
    }, 1000);
}

function handleCurrencyKeyup(event) {
    searchCurrencies(event.target);
}

function handleCurrencyFocus(event) {
    showCurrencyDropdown(event.target);
}

function handleCurrencyClick(event) {
    showCurrencyDropdown(event.target);
}

// Function to navigate back to the AR Invoice menu
function goToMenuAR() {
    window.location.href = '../0_Menu/menuARInvoiceNew.html';
}

// Function to load AR invoice details from API
function loadARInvoiceDetails(arInvoiceId) {
    if (!arInvoiceId) {
        Swal.fire({
            title: 'Error',
            text: 'AR Invoice ID not found in URL',
            icon: 'error'
        });
        return;
    }

    Swal.fire({
        title: 'Loading...',
        text: 'Fetching AR invoice details',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    fetch(`${BASE_URL}/api/outgoing-payments/${outgoingPaymentId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch AR invoice details');
            }
            return response.json();
        })
        .then(data => {
            arInvoiceData = data;
            populateFormFields(data);
            Swal.close();
        })
        .catch(error => {
            console.error('Error fetching AR invoice details:', error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to load AR invoice details. Please try again.',
                icon: 'error'
            });
        });
}

// Function to populate form fields with AR invoice data
function populateFormFields(data) {
    document.getElementById('CounterRef').value = data.counterRef || '';
    document.getElementById('RequesterName').value = data.receivedByName || '';
    document.getElementById('CardName').value = data.cardName || '';
    document.getElementById('Address').value = data.address || '';

    if (data.docDate) {
        document.getElementById('DocDate').value = data.docDate.split('T')[0];
    } else if (data.receivedDate) {
        document.getElementById('DocDate').value = data.receivedDate.split('T')[0];
    }
    if (data.docDueDate) {
        document.getElementById('DocDueDate').value = data.docDueDate.split('T')[0];
    }

    document.getElementById('DocNum').value = data.docNum || '';
    // Remarks field is left empty for manual input
    // document.getElementById('remarks').value = data.remarks || '';
    document.getElementById('DocCurr').value = data.docCurr || 'IDR';

    console.log('💰 PopulateFormFields - RemittanceRequestAmount:');
    console.log('- Raw data value:', data.RemittanceRequestAmount);
    console.log('- Raw data type:', typeof data.RemittanceRequestAmount);

    if (data.RemittanceRequestAmount) {
        const formattedValue = formatCurrencyValue(data.RemittanceRequestAmount);
        console.log('- Formatted value:', formattedValue);
        console.log('- Formatted value type:', typeof formattedValue);

        document.getElementById('RemittanceRequestAmount').value = formattedValue;

        // Verify the field was set correctly
        const fieldValue = document.getElementById('RemittanceRequestAmount').value;
        console.log('- Field value after setting:', fieldValue);
        console.log('- Field value type after setting:', typeof fieldValue);

        console.log('✅ Set RemittanceRequestAmount to:', formattedValue);
    } else {
        console.log('⚠️ No RemittanceRequestAmount data found');
    }

    if (data.trsfrDate) {
        document.getElementById('TrsfrDate').value = data.trsfrDate.split('T')[0];
    }
    document.getElementById('TrsfrAcct').value = data.trsfrAcct || '';
    document.getElementById('TrsfrSum').value = formatCurrencyValue(data.trsfrSum) || '';

    // Clear existing table rows
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    // Populate table rows (read-only)
    if (data.lines && data.lines.length > 0) {
        data.lines.forEach(item => {
            const lineData = {
                acctCode: item.acctCode || '',
                acctName: item.acctName || '',
                descrip: item.descrip || '',
                currencyItem: item.CurrencyItem || item.currencyItem || '',
                sumApplied: item.sumApplied || 0
            };
            addRowWithData(lineData);
        });
    }

    // Display attachments if available
    if (data.attachments && data.attachments.length > 0) {
        displayExistingAttachments(data.attachments);
    } else if (data.reimbursementAttachments && data.reimbursementAttachments.length > 0) {
        displayExistingAttachments(data.reimbursementAttachments);
    }

    // Display Print Out Reimbursement document
    displayPrintOutReimbursement(data);

    updateTotalAmountDue();

    // Set initial Remittance Request Amount from the loaded total (only on data load)
    setTimeout(() => {
        setInitialRemittanceRequestAmount();
    }, 100);

    // Set approval information
    if (data.approval) {
        if (data.approval.preparedBy) {
            setApprovalFieldValue('Approval.PreparedById', data.approval.preparedBy, data.approval.preparedByName);
        }
        if (data.approval.checkedBy) {
            setApprovalFieldValue('Approval.CheckedById', data.approval.checkedBy, data.approval.checkedByName);
        }
        if (data.approval.acknowledgedBy) {
            setApprovalFieldValue('Approval.AcknowledgedById', data.approval.acknowledgedBy, data.approval.acknowledgedByName);
        }
        if (data.approval.approvedBy) {
            setApprovalFieldValue('Approval.ApprovedById', data.approval.approvedBy, data.approval.approvedByName);
        }
        if (data.approval.receivedBy) {
            setApprovalFieldValue('Approval.ReceivedById', data.approval.receivedBy, data.approval.receivedByName);
        }
    }

    // Show rejection remarks if status is Rejected
    if (data.approval && data.approval.approvalStatus === 'Rejected' && data.approval.rejectionRemarks) {
        document.getElementById('rejectionRemarksSection').style.display = 'block';
        document.getElementById('rejectionRemarks').value = data.approval.rejectionRemarks;
    } else {
        document.getElementById('rejectionRemarksSection').style.display = 'none';
    }
}

// Function to submit document
async function submitDocument(isSubmit = false) {
    console.log('=== SUBMIT DOCUMENT STARTED ===');
    console.log('Is Submit:', isSubmit);
    console.log('Current URL:', window.location.href);

    // Get reimbursement ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const reimbursementId = urlParams.get('reimbursement-id');
    console.log('Reimbursement ID:', reimbursementId);

    const validationErrors = validateRequiredFields();
    console.log('=== VALIDATION RESULT ===');
    console.log('Validation Errors:', validationErrors);
    console.log('Errors Count:', validationErrors.length);

    if (validationErrors.length > 0) {
        console.log('=== VALIDATION FAILED - SHOWING ERROR DIALOG ===');
        await Swal.fire({
            title: 'Validation Error',
            html: validationErrors.map(error => `• ${error}`).join('<br>'),
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }

    console.log('=== VALIDATION PASSED ===');

    if (isSubmit) {
        console.log('=== SHOWING SUBMIT CONFIRMATION ===');
        const result = await Swal.fire({
            title: 'Konfirmasi',
            text: 'Apakah dokumen sudah benar?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) {
            console.log('=== SUBMIT CANCELLED BY USER ===');
            return;
        }
        console.log('=== SUBMIT CONFIRMED BY USER ===');
    }

    const loadingTitle = isSubmit ? 'Mengirim...' : 'Menyimpan...';
    const loadingText = isSubmit ? 'Mengirim dokumen, silakan tunggu...' : 'Menyimpan dokumen, silakan tunggu...';

    console.log('=== SHOWING LOADING DIALOG ===');
    console.log('Loading Title:', loadingTitle);
    console.log('Loading Text:', loadingText);

    Swal.fire({
        title: loadingTitle,
        text: loadingText,
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const userId = getUserId();
        if (!userId) {
            throw new Error("Tidak dapat mendapatkan ID pengguna dari token. Silakan login kembali.");
        }

        await ensureApprovalFieldsBeforeSubmit();

        if (isSubmit) {
            const nextSerialNumber = await fetchNextSerialNumber();
            if (nextSerialNumber) {
                const docNumInput = document.getElementById('DocNum');
                if (docNumInput) {
                    docNumInput.value = 'VCR/' + nextSerialNumber;
                }
            } else {
                throw new Error('Failed to generate document number. Please try again.');
            }
        }

        const formData = collectFormData(userId, isSubmit);

        console.log('=== DATA YANG AKAN DIKIRIM KE API ===');
        console.log('Form Data:', JSON.stringify(formData, null, 2));
        console.log('=== REMITTANCE REQUEST AMOUNT DEBUG ===');
        console.log('remittanceRequestAmount in formData:', formData.remittanceRequestAmount);
        console.log('remittanceRequestAmount type:', typeof formData.remittanceRequestAmount);
        console.log('Field value before submit:', document.getElementById('RemittanceRequestAmount')?.value);
        console.log('Field value type before submit:', typeof document.getElementById('RemittanceRequestAmount')?.value);

        // Test the exact value that will be sent
        const testFieldValue = document.getElementById('RemittanceRequestAmount')?.value;
        const testParsedValue = parseCurrency(testFieldValue);
        console.log('Test parsing field value:', testFieldValue, '->', testParsedValue);

        console.log('=== END DATA ===');

        if (!formData.stagingID) {
            throw new Error('Staging ID is missing. Please try again.');
        }

        const requiredFields = [
            { field: 'DocNum', name: 'Document Number' },
            { field: 'CardCode', name: 'Card Code' },
            { field: 'CardName', name: 'Card Name' },
            { field: 'DocDate', name: 'Document Date' },
            { field: 'DocDueDate', name: 'Due Date' },
        ];

        for (const reqField of requiredFields) {
            const value = document.getElementById(reqField.field)?.value?.trim();
            if (!value) {
                throw new Error(`${reqField.name} is required. Please fill in all required fields.`);
            }
        }

        if (!formData.arInvoiceDetails || formData.arInvoiceDetails.length === 0) {
            throw new Error('At least one line item is required. Please add account code and amount in the table.');
        }

        const validLines = formData.arInvoiceDetails.filter(line =>
            line.acctCode && line.acctCode.trim() &&
            line.lineTotal && line.lineTotal > 0
        );

        if (validLines.length === 0) {
            throw new Error('At least one line item with account code and amount greater than 0 is required.');
        }

        const apiUrl = '/api/ar-invoices';
        console.log('=== MAKING API CALL ===');
        console.log('API URL:', apiUrl);
        console.log('Method: POST');
        console.log('Request Headers:', {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        });

        const response = await makeAuthenticatedRequest(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        console.log('=== API RESPONSE RECEIVED ===');
        console.log('Response Status:', response.status);
        console.log('Response OK:', response.ok);

        if (!response.ok) {
            let errorMessage = `Error API: ${response.status}`;
            try {
                const responseText = await response.text();
                console.log('=== ERROR RESPONSE FROM API ===');
                console.log('Response Status:', response.status);
                console.log('Response Text:', responseText);

                const errorData = JSON.parse(responseText);
                console.log('Parsed Error Data:', JSON.stringify(errorData, null, 2));

                if (errorData.Message) {
                    errorMessage = errorData.Message;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }

                if (errorData.Data && Array.isArray(errorData.Data)) {
                    errorMessage = "Error validasi:\n" + errorData.Data.join("\n");
                } else if (errorData.errors && Array.isArray(errorData.errors)) {
                    errorMessage = "Error validasi:\n" + errorData.errors.join("\n");
                }

                console.log('Final Error Message:', errorMessage);
                console.log('=== END ERROR RESPONSE ===');
            } catch (parseError) {
                console.log("Could not parse error response:", parseError);
                console.log("Raw response text:", responseText);
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('=== API SUCCESS RESPONSE ===');
        console.log('Response Result:', JSON.stringify(result, null, 2));

        let stagingId = null;
        if (result.data && result.data.stagingID) {
            stagingId = result.data.stagingID;
        } else if (result.stagingID) {
            stagingId = result.stagingID;
        } else {
            console.log('=== STAGING ID NOT FOUND IN RESPONSE ===');
            throw new Error('Staging ID not found in API response. Please try again.');
        }

        console.log('Extracted Staging ID:', stagingId);

        if (stagingId) {
            localStorage.setItem('currentStagingOutgoingPaymentId', stagingId);
        }

        if (isSubmit) {
            console.log('=== SHOWING SUBMIT SUCCESS MESSAGE ===');
            await Swal.fire({
                title: 'Berhasil',
                text: 'Dokumen berhasil dikirim',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } else {
            console.log('=== SHOWING SAVE SUCCESS MESSAGE ===');
            await Swal.fire({
                title: 'Berhasil!',
                text: 'Dokumen berhasil disimpan sebagai draft',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        }

        // Upload attachments if any files are selected
        if (stagingId && document.getElementById('attachment')?.files?.length > 0) {
            console.log('=== UPLOADING ATTACHMENTS ===');
            try {
                const formData = new FormData();
                const files = document.getElementById('attachment').files;

                for (let i = 0; i < files.length; i++) {
                    formData.append('files', files[i]);
                }

                const uploadResponse = await makeAuthenticatedRequest(`/api/ar-invoices/${stagingId}/attachments/upload`, {
                    method: 'POST',
                    headers: {
                        // Don't set Content-Type for FormData, let browser set it
                    },
                    body: formData
                });

                if (uploadResponse.ok) {
                    console.log('Attachments uploaded successfully');
                } else {
                    console.warn('Failed to upload attachments:', uploadResponse.status);
                }
            } catch (uploadError) {
                console.error('Error uploading attachments:', uploadError);
                // Don't fail the whole process if attachment upload fails
            }
        }

        console.log('=== SUBMIT DOCUMENT COMPLETED SUCCESSFULLY ===');
        goToMenuAR();

    } catch (error) {
        console.log('=== ERROR OCCURRED ===');
        console.error("Error processing document:", error);
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
        console.log('=== END ERROR ===');

        await Swal.fire({
            title: 'Error',
            text: `Gagal ${isSubmit ? 'mengirim' : 'menyimpan'} dokumen: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to collect form data according to API specification
function collectFormData(userId, isSubmit) {
    // Get AR Invoice data from URL or localStorage first
    const urlParams = new URLSearchParams(window.location.search);
    const arInvoiceId = urlParams.get('ar-invoice-id');

    console.log('AR Invoice ID from URL:', arInvoiceId);

    // Generate a unique staging ID for backend
    const stagingID = `AR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get consistent docNum value first
    const docNumValue = parseInt(document.getElementById("DocNum")?.value) || 0;

    // Collect lines data from table
    const lines = [];
    const tableRows = document.querySelectorAll('#tableBody tr');

    console.log('Collecting lines data from table. Total rows:', tableRows.length);

    tableRows.forEach((row, index) => {
        // Look for inputs with multiple possible selectors
        const lineNumInput = row.querySelector('input[id="LineNum"]') ||
            row.querySelector('input[id^="LineNum_"]') ||
            row.querySelector('td:first-child input');

        const itemCodeInput = row.querySelector('input[id="ItemCode"]') ||
            row.querySelector('input[id^="ItemCode_"]') ||
            row.querySelector('td:nth-child(2) input');

        const dscriptionInput = row.querySelector('input[id="Dscription"]') ||
            row.querySelector('input[id^="Dscription_"]') ||
            row.querySelector('td:nth-child(3) input');

        const acctCodeInput = row.querySelector('input[id="AcctCode"]') ||
            row.querySelector('input[id^="AcctCode_"]') ||
            row.querySelector('td:nth-child(4) input');

        const quantityInput = row.querySelector('input[id="Quantity"]') ||
            row.querySelector('input[id^="Quantity_"]') ||
            row.querySelector('td:nth-child(5) input');

        const priceBefDiInput = row.querySelector('input[id="PriceBefDi"]') ||
            row.querySelector('input[id^="PriceBefDi_"]') ||
            row.querySelector('td:nth-child(6) input');

        const lineTotalInput = row.querySelector('input[id="LineTotal"]') ||
            row.querySelector('input[id^="LineTotal_"]') ||
            row.querySelector('td:nth-child(7) input');

        // Parse amount using IDR format if available
        let parsedAmount = 0;
        if (docTotalInput) {
            if (typeof window.parseCurrencyIDR === 'function') {
                parsedAmount = window.parseCurrencyIDR(docTotalInput.value) || 0;
            } else {
                parsedAmount = parseCurrency(docTotalInput.value) || 0;
            }
        }

        console.log(`Row ${index} data collection:`, {
            lineNumInput: lineNumInput,
            itemCodeInput: itemCodeInput,
            dscriptionInput: dscriptionInput,
            acctCodeInput: acctCodeInput,
            quantityInput: quantityInput,
            priceBefDiInput: priceBefDiInput,
            lineTotalInput: lineTotalInput,
            lineNumValue: lineNumInput ? lineNumInput.value : 'N/A',
            itemCodeValue: itemCodeInput ? itemCodeInput.value : 'N/A',
            dscriptionValue: dscriptionInput ? dscriptionInput.value : 'N/A',
            acctCodeValue: acctCodeInput ? acctCodeInput.value : 'N/A',
            quantityValue: quantityInput ? quantityInput.value : 'N/A',
            priceBefDiValue: priceBefDiInput ? priceBefDiInput.value : 'N/A',
            lineTotalValue: lineTotalInput ? lineTotalInput.value : 'N/A'
        });

        if (acctCodeInput && dscriptionInput && lineTotalInput) {
            // Parse values
            const lineNum = parseInt(lineNumInput?.value) || index;
            const itemCode = itemCodeInput?.value || "";
            const dscription = dscriptionInput?.value || "";
            const acctCode = acctCodeInput?.value || "";
            const quantity = parseFloat(quantityInput?.value) || 1;
            const priceBefDi = parseFloat(priceBefDiInput?.value) || 0;
            const lineTotal = parseFloat(lineTotalInput?.value) || 0;

            const lineData = {
                lineNum: lineNum,
                visOrder: index,
                itemCode: itemCode,
                dscription: dscription,
                acctCode: acctCode,
                quantity: quantity,
                invQty: quantity,
                priceBefDi: priceBefDi,
                u_bsi_salprice: priceBefDi,
                u_bsi_source: "AR",
                vatgroup: "VAT",
                wtLiable: "N",
                lineTotal: lineTotal,
                totalFrgn: lineTotal,
                lineVat: 0,
                lineVatIF: 0,
                ocrCode3: "",
                unitMsr: "PCS",
                numPerMsr: 1,
                freeTxt: "",
                text: dscription,
                baseType: 0,
                baseEntry: 0,
                baseRef: "",
                baseLine: 0,
                cogsOcrCod: "",
                cogsOcrCo2: "",
                cogsOcrCo3: ""
            };

            console.log(`Adding line ${index}:`, lineData);
            lines.push(lineData);
        }
    });

    // Collect attachments data
    const attachments = [];
    const attachmentInput = document.getElementById('attachment');

    console.log('Collecting attachments data');
    console.log('Attachment input:', attachmentInput);
    console.log('Files:', attachmentInput ? attachmentInput.files : 'No input found');

    if (attachmentInput && attachmentInput.files && attachmentInput.files.length > 0) {
        for (let i = 0; i < attachmentInput.files.length; i++) {
            const file = attachmentInput.files[i];
            console.log(`Processing file ${i}:`, file);

            const attachmentData = {
                attachmentID: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                stagingID: stagingID,
                fileName: file.name,
                originalFileName: file.name,
                filePath: "",
                fileSize: file.size,
                fileExtension: file.name.split('.').pop() || "",
                mimeType: file.type,
                description: "",
                attachmentType: "Document",
                uploadedBy: userId,
                uploadedDate: new Date().toISOString(),
                isActive: true,
                header: {
                    stagingID: stagingID
                }
            };

            console.log(`Adding attachment ${i}:`, attachmentData);
            attachments.push(attachmentData);
        }
    }

    console.log('Total attachments collected:', attachments.length);



    // Collect approval field values using the new function
    const approvalData = collectApprovalFieldValues();

    console.log('Collected approval data:', approvalData);

    // Get approval field values, ensuring preparedBy is always set to current user if empty
    const preparedById = approvalData.PreparedById || userId;
    const checkedById = approvalData.CheckedById || "";
    const acknowledgedById = approvalData.AcknowledgedById || "";
    const approvedById = approvalData.ApprovedById || "";
    const receivedById = approvalData.ReceivedById || "";
    console.log('Final approval values to be sent:', {
        preparedBy: preparedById,
        checkedBy: checkedById,
        acknowledgedBy: acknowledgedById,
        approvedBy: approvedById,
        receivedBy: receivedById
    });

    // Prepare the main request data according to ARInvoice API specification
    const requestData = {
        docNum: docNumValue,
        docType: document.getElementById("Doctype")?.value || "A",
        docDate: document.getElementById("DocDate")?.value ? new Date(document.getElementById("DocDate").value).toISOString() : new Date().toISOString(),
        docDueDate: document.getElementById("DocDueDate")?.value ? new Date(document.getElementById("DocDueDate").value).toISOString() : new Date().toISOString(),
        cardCode: document.getElementById("CardCode")?.value || "",
        cardName: document.getElementById("CardName")?.value || "",
        address: document.getElementById("Address")?.value || "",
        numAtCard: document.getElementById("NumAtCard")?.value || "",
        comments: document.getElementById("remarks")?.value || "",
        u_BSI_Expressiv_PreparedByNIK: document.getElementById("PreparedByNIK")?.value || userId,
        u_BSI_Expressiv_PreparedByName: document.getElementById("PreparedByName")?.value || "",
        docCur: document.getElementById("DocCurr")?.value || "IDR",
        docRate: parseCurrency(document.getElementById("DocRate")?.value) || 1,
        vatSum: parseCurrency(document.getElementById("VatSum")?.value) || 0,
        vatSumFC: parseCurrency(document.getElementById("VatSumFC")?.value) || 0,
        wtSum: parseCurrency(document.getElementById("WTSum")?.value) || 0,
        wtSumFC: parseCurrency(document.getElementById("WTSumFC")?.value) || 0,
        docTotal: parseCurrency(document.getElementById("DocTotal")?.value) || 0,
        docTotalFC: parseCurrency(document.getElementById("DocTotalFC")?.value) || 0,
        trnspCode: parseInt(document.getElementById("TrnspCode")?.value) || 0,
        u_BSI_ShippingType: document.getElementById("ShippingType")?.value || "",
        groupNum: parseInt(document.getElementById("GroupNum")?.value) || 0,
        u_BSI_PaymentGroup: document.getElementById("PaymentGroup")?.value || "",
        u_bsi_invnum: document.getElementById("InvNum")?.value || "",
        u_bsi_udf1: document.getElementById("UDF1")?.value || "",
        u_bsi_udf2: document.getElementById("UDF2")?.value || "",
        trackNo: document.getElementById("TrackNo")?.value || "",
        u_BSI_Expressiv_IsTransfered: document.getElementById("IsTransfered")?.value || "N",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        arInvoiceDetails: lines,
        arInvoiceAttachments: attachments
    };

    // Collect attachment IDs from existing attachments that were uploaded
    const attachmentIds = [];
    console.log('=== SUBMIT ATTACHMENT DEBUG ===');
    console.log('Checking existingAttachments:', existingAttachments);
    console.log('Global existingAttachments:', window.existingAttachments);
    console.log('Local existingAttachments variable:', typeof existingAttachments);

    // Try to get attachments from multiple sources
    let attachmentsToProcess = existingAttachments || window.existingAttachments || [];

    if (attachmentsToProcess && attachmentsToProcess.length > 0) {
        console.log('Processing attachments:', attachmentsToProcess);
        attachmentsToProcess.forEach((attachment, index) => {
            console.log(`Processing attachment ${index}:`, attachment);
            // Check multiple possible field names for attachment ID
            const attachmentId = attachment.attachmentID || attachment.id || attachment.attachmentId;
            if (attachmentId) {
                attachmentIds.push(attachmentId);
                console.log('Added attachment ID:', attachmentId);
            } else {
                console.warn('No attachment ID found for attachment:', attachment);
            }
        });
    } else {
        console.warn('No attachments found to process');
    }

    // Add attachment IDs to the request
    const requestDataWithAttachments = {
        ...requestData,
        attachmentIds: attachmentIds
    };

    console.log('Final request data to be sent to API:', requestDataWithAttachments);
    console.log('=== REQUEST DATA DEBUG ===');
    console.log('jrnlMemo in request:', requestDataWithAttachments.jrnlMemo);
    console.log('jrnlMemo field in form:', document.getElementById('jrnlMemo')?.value);
    console.log('docNumValue:', docNumValue);
    console.log('stagingID:', stagingID);
    console.log('lines count:', lines.length);
    console.log('=== END REQUEST DATA DEBUG ===');
    console.log('Attachment IDs to be sent:', attachmentIds);
    console.log('Total attachment IDs:', attachmentIds.length);
    console.log('Request data keys:', Object.keys(requestDataWithAttachments));
    console.log('Request data attachmentIds field:', requestDataWithAttachments.attachmentIds);
    console.log('Request data JSON:', JSON.stringify(requestDataWithAttachments, null, 2));

    // Additional debugging for attachment submission
    if (requestDataWithAttachments.attachmentIds && requestDataWithAttachments.attachmentIds.length > 0) {
        console.log('✅ Attachment IDs will be submitted with the request');
    } else {
        console.log('⚠️ No attachment IDs found to submit');
    }

    // Validate that we have at least one line
    if (!lines || lines.length === 0) {
        throw new Error('At least one line item is required. Please add account code and amount in the table.');
    }

    // Validate required fields
    if (!requestData.cardCode || !requestData.cardCode.trim()) {
        throw new Error('Card Code field is required.');
    }

    if (!requestData.cardName || !requestData.cardName.trim()) {
        throw new Error('Card Name field is required.');
    }

    if (!requestData.docNum || requestData.docNum <= 0) {
        throw new Error('Document Number field is required.');
    }

    if (!requestData.docDate) {
        throw new Error('Document Date field is required.');
    }

    if (!requestData.docDueDate) {
        throw new Error('Due Date field is required.');
    }

    // Validate lines have required fields
    lines.forEach((line, index) => {
        if (!line.acctCode || !line.acctCode.trim()) {
            throw new Error(`Line ${index + 1}: G/L Account is required.`);
        }
        if (!line.dscription || !line.dscription.trim()) {
            throw new Error(`Line ${index + 1}: Description is required.`);
        }
        if (!line.lineTotal || line.lineTotal <= 0) {
            throw new Error(`Line ${index + 1}: Line Total must be greater than 0.`);
        }
        if (!line.itemCode || !line.itemCode.trim()) {
            throw new Error(`Line ${index + 1}: Item Code is required.`);
        }
    });

    return requestDataWithAttachments;
}

// Function to validate required fields
function validateRequiredFields() {
    const errors = [];
    const missingFields = [];

    const requiredFields = [
        { id: 'CounterRef', name: 'Nomor Reimbursement' },
        { id: 'RequesterName', name: 'Nama Pemohon Reimbursement' },
        { id: 'CardName', name: 'Dibayar Kepada' },
        { id: 'DocDate', name: 'Tanggal Dokumen' },
    ];

    console.log('=== VALIDASI FIELD YANG DIPERLUKAN ===');
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        const value = element ? element.value.trim() : '';

        console.log(`Field: ${field.name} (${field.id})`);
        console.log(`  - Element exists: ${!!element}`);
        console.log(`  - Value: "${value}"`);
        console.log(`  - Is empty: ${!value}`);

        if (!element || !value) {
            errors.push(`${field.name} wajib diisi`);
            missingFields.push(field.name);
        }
    });

    // Check if at least one line item exists
    const tableRows = document.querySelectorAll('#tableBody tr');
    let hasValidLine = false;
    let lineValidationDetails = [];

    console.log('=== VALIDASI BARIS TABEL ===');
    console.log(`Total rows found: ${tableRows.length}`);

    tableRows.forEach((row, index) => {
        const acctCodeInput = row.querySelector('td:first-child input');
        const docTotalInput = row.querySelector('.currency-input-idr');

        let amount = 0;
        if (docTotalInput) {
            if (typeof window.parseCurrencyIDR === 'function') {
                amount = window.parseCurrencyIDR(docTotalInput.value) || 0;
            } else {
                amount = parseCurrency(docTotalInput.value) || 0;
            }
        }

        const acctCodeValue = acctCodeInput ? acctCodeInput.value.trim() : '';
        const docTotalValue = docTotalInput ? docTotalInput.value : '0';

        console.log(`Row ${index + 1}:`);
        console.log(`  - Account Code: "${acctCodeValue}" (exists: ${!!acctCodeInput})`);
        console.log(`  - Amount: "${docTotalValue}" (parsed: ${amount}) (exists: ${!!docTotalInput})`);
        console.log(`  - Is valid: ${acctCodeValue && amount > 0}`);

        if (acctCodeInput && docTotalInput &&
            acctCodeValue &&
            amount > 0) {
            hasValidLine = true;
        } else {
            lineValidationDetails.push({
                row: index + 1,
                acctCode: acctCodeValue,
                amount: amount,
                acctCodeMissing: !acctCodeValue,
                amountMissing: amount <= 0
            });
        }
    });

    if (!hasValidLine) {
        errors.push('Minimal satu baris item dengan kode akun dan jumlah diperlukan.');
        console.log('=== DETAIL BARIS YANG TIDAK VALID ===');
        lineValidationDetails.forEach(detail => {
            console.log(`Row ${detail.row}:`);
            if (detail.acctCodeMissing) {
                console.log(`  - Account Code kosong`);
            }
            if (detail.amountMissing) {
                console.log(`  - Amount <= 0 (${detail.amount})`);
            }
        });
    }

    console.log('=== HASIL VALIDASI ===');
    console.log(`Total errors: ${errors.length}`);
    console.log(`Missing fields: ${missingFields.join(', ')}`);
    console.log(`Has valid line: ${hasValidLine}`);
    console.log('=== END VALIDASI ===');

    return errors;
}

// Function to load document data from API
async function loadDocumentData() {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('id') || urlParams.get('ar-invoice-id');

    if (!docId) {
        return;
    }

    try {
        Swal.fire({
            title: 'Loading...',
            text: 'Loading AR Invoice data, please wait...',
            icon: 'info',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        if (!window.users || window.users.length === 0) {
            await initializeUserDropdowns();
        }

        const response = await makeAuthenticatedRequest(`/api/ar-invoices/${docId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'text/plain'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load AR Invoice: ${response.status}`);
        }

        const result = await response.json();

        if (result.data) {
            mapResponseToForm(result.data);
            updateUserNamesInApprovalFields();
            updateTotalAmountDue();

            setTimeout(async () => {
                await ensureApprovalFieldValues();
                const preparedByField = document.getElementById('Approval.PreparedById');
                const preparedBySearch = document.getElementById('Approval.PreparedByIdSearch');

                if (preparedByField && (!preparedByField.value || !preparedBySearch.value.trim())) {
                    autofillPreparedByWithCurrentUser();
                }
            }, 500);

            Swal.fire({
                title: 'Success',
                text: 'AR Invoice data loaded successfully',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        }

    } catch (error) {
        console.error("Error loading AR Invoice:", error);
        Swal.fire({
            title: 'Error',
            text: `Failed to load AR Invoice: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to map response data back to form fields
function mapResponseToForm(responseData) {
    if (responseData.docNum) document.getElementById("DocNum").value = responseData.docNum;
    if (responseData.cardName) document.getElementById("CardName").value = responseData.cardName;
    if (responseData.cardCode) document.getElementById("CardCode").value = responseData.cardCode;
    if (responseData.address) document.getElementById("Address").value = responseData.address;
    if (responseData.numAtCard) document.getElementById("NumAtCard").value = responseData.numAtCard;
    if (responseData.comments) document.getElementById("remarks").value = responseData.comments;

    if (responseData.docDate) {
        document.getElementById("DocDate").value = responseData.docDate.split('T')[0];
    }
    document.getElementById("DocDate").readOnly = true;

    if (responseData.docDueDate) {
        document.getElementById("DocDueDate").value = responseData.docDueDate.split('T')[0];
    }

    if (responseData.docType) document.getElementById("Doctype").value = responseData.docType;
    if (responseData.docCur) document.getElementById("DocCurr").value = responseData.docCur;
    if (responseData.docRate) document.getElementById("DocRate").value = responseData.docRate;
    if (responseData.vatSum) document.getElementById("VatSum").value = responseData.vatSum;
    if (responseData.vatSumFC) document.getElementById("VatSumFC").value = responseData.vatSumFC;
    if (responseData.wtSum) document.getElementById("WTSum").value = responseData.wtSum;
    if (responseData.wtSumFC) document.getElementById("WTSumFC").value = responseData.wtSumFC;
    if (responseData.docTotal) document.getElementById("DocTotal").value = responseData.docTotal;
    if (responseData.docTotalFC) document.getElementById("DocTotalFC").value = responseData.docTotalFC;
    if (responseData.trnspCode) document.getElementById("TrnspCode").value = responseData.trnspCode;
    if (responseData.u_BSI_ShippingType) document.getElementById("ShippingType").value = responseData.u_BSI_ShippingType;
    if (responseData.groupNum) document.getElementById("GroupNum").value = responseData.groupNum;
    if (responseData.u_BSI_PaymentGroup) document.getElementById("PaymentGroup").value = responseData.u_BSI_PaymentGroup;
    if (responseData.u_bsi_invnum) document.getElementById("InvNum").value = responseData.u_bsi_invnum;
    if (responseData.u_bsi_udf1) document.getElementById("UDF1").value = responseData.u_bsi_udf1;
    if (responseData.u_bsi_udf2) document.getElementById("UDF2").value = responseData.u_bsi_udf2;
    if (responseData.trackNo) document.getElementById("TrackNo").value = responseData.trackNo;
    if (responseData.u_BSI_Expressiv_IsTransfered) document.getElementById("IsTransfered").value = responseData.u_BSI_Expressiv_IsTransfered;

    if (responseData.u_BSI_Expressiv_PreparedByNIK) document.getElementById("PreparedByNIK").value = responseData.u_BSI_Expressiv_PreparedByNIK;
    if (responseData.u_BSI_Expressiv_PreparedByName) document.getElementById("PreparedByName").value = responseData.u_BSI_Expressiv_PreparedByName;

    if (responseData.docTotal) {
        const formattedAmount = formatCurrencyValue(responseData.docTotal);
        document.getElementById("documentTotal").value = responseData.docTotal;
        document.getElementById("DocTotal").value = responseData.docTotal;
        document.getElementById("DocTotalFC").value = responseData.docTotal;
    }

    // Remarks and Journal Remarks fields are left empty for manual input
    // if (responseData.remarks) document.getElementById("remarks").value = responseData.remarks;

    // Map approval fields
    if (responseData.preparedBy) {
        setApprovalFieldValue("Approval.PreparedById", responseData.preparedBy, responseData.preparedByName);
    } else {
        autofillPreparedByWithCurrentUser();
    }
    if (responseData.checkedBy) {
        setApprovalFieldValue("Approval.CheckedById", responseData.checkedBy, responseData.checkedByName);
    }
    if (responseData.acknowledgedBy) {
        setApprovalFieldValue("Approval.AcknowledgedById", responseData.acknowledgedBy, responseData.acknowledgedByName);
    }
    if (responseData.approvedBy) {
        setApprovalFieldValue("Approval.ApprovedById", responseData.approvedBy, responseData.approvedByName);
    }
    if (responseData.receivedBy) {
        setApprovalFieldValue("Approval.ReceivedById", responseData.receivedBy, responseData.receivedByName);
    }

    // Handle rejection remarks
    if (responseData.status === 'Rejected') {
        let rejectionRemarks = '';
        if (responseData.remarksRejectByChecker) {
            rejectionRemarks = responseData.remarksRejectByChecker;
        } else if (responseData.remarksRejectByAcknowledger) {
            rejectionRemarks = responseData.remarksRejectByAcknowledger;
        } else if (responseData.remarksRejectByApprover) {
            rejectionRemarks = responseData.remarksRejectByApprover;
        } else if (responseData.remarksRejectByReceiver) {
            rejectionRemarks = responseData.remarksRejectByReceiver;
        }

        if (rejectionRemarks) {
            document.getElementById("rejectionRemarks").value = rejectionRemarks;
            document.getElementById("rejectionRemarksSection").style.display = "block";
        }
    }

    // Map reimbursement details to table lines (read-only)
    if (responseData.reimbursementDetails && responseData.reimbursementDetails.length > 0) {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';

        responseData.reimbursementDetails.forEach((detail) => {
            const lineData = {
                acctCode: detail.glAccount || '',
                acctName: detail.accountName || '',
                descrip: detail.description || '',
                currencyItem: detail.currencyItem || 'IDR',
                sumApplied: detail.amount || 0
            };
            addRowWithData(lineData);
        });

        updateTotalAmountDue();

        // Set initial Remittance Request Amount after loading data
        setInitialRemittanceRequestAmount();

        // Display Print Out Reimbursement document
        displayPrintOutReimbursement(responseData);
    }
}

// Function to make authenticated request
async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '../pages/login.html';
        throw new Error('No authentication token found. Please login again.');
    }

    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? url : '/' + url}`;

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    const finalOptions = { ...defaultOptions, ...options };
    const response = await fetch(fullUrl, finalOptions);

    if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('loggedInUser');
        window.location.href = '../pages/login.html';
        throw new Error('Authentication failed. Please login again.');
    }

    return response;
}

// Global variable for users
let users = [];

// Function to initialize user dropdowns
async function initializeUserDropdowns() {
    try {
        Swal.fire({
            title: 'Loading...',
            text: 'Loading user data...',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await makeAuthenticatedRequest('/api/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const result = await response.json();

        if (!result.status || !result.data) {
            throw new Error('Invalid response from API');
        }

        users = result.data;
        window.users = result.data;

        setupUserSearch('Approval.PreparedById');
        setupUserSearch('Approval.CheckedById');
        setupUserSearch('Approval.AcknowledgedById');
        setupUserSearch('Approval.ApprovedById');
        setupUserSearch('Approval.ReceivedById');

        updateUserNamesInApprovalFields();
        autofillPreparedByWithCurrentUser();

        Swal.close();

    } catch (error) {
        console.error('Error loading users:', error);
        Swal.close();

        if (!error.message.includes('authentication') && !error.message.includes('login')) {
            Swal.fire({
                title: 'Error',
                text: `Failed to load user data: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
}

// Function to setup user search for a specific field
function setupUserSearch(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    const hiddenSelect = document.getElementById(fieldId);

    if (!searchInput || !dropdown || !hiddenSelect) {
        console.warn(`User search elements not found for field: ${fieldId}`);
        return;
    }

    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        filterUsersBySearchTerm(fieldId, searchTerm);
    });

    searchInput.addEventListener('focus', function () {
        if (this.value.trim() === '') {
            showAllUsers(fieldId);
        }
    });

    searchInput.addEventListener('click', function () {
        if (this.value.trim() === '') {
            showAllUsers(fieldId);
        }
    });

    document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

// Function to filter users based on search term
function filterUsersBySearchTerm(fieldId, searchTerm) {
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    const hiddenSelect = document.getElementById(fieldId);

    if (!dropdown || !hiddenSelect) return;

    dropdown.innerHTML = '';

    if (!searchTerm.trim()) {
        showAllUsers(fieldId);
        return;
    }

    const exactMatches = users.filter(user =>
        typeof user.fullName === 'string' &&
        user.fullName.toLowerCase().trim() === searchTerm.toLowerCase().trim()
    );

    const startsWithMatches = users.filter(user =>
        typeof user.fullName === 'string' &&
        user.fullName.toLowerCase().startsWith(searchTerm.toLowerCase()) &&
        user.fullName.toLowerCase().trim() !== searchTerm.toLowerCase().trim()
    );

    const partialMatches = users.filter(user =>
        typeof user.fullName === 'string' &&
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.fullName.toLowerCase().startsWith(searchTerm.toLowerCase()) &&
        user.fullName.toLowerCase().trim() !== searchTerm.toLowerCase().trim()
    );

    const filteredUsers = [...exactMatches, ...startsWithMatches, ...partialMatches];

    filteredUsers.forEach(user => {
        const item = document.createElement('div');
        item.className = 'dropdown-item p-2 hover:bg-gray-100 cursor-pointer';
        item.innerHTML = `<div class="font-medium">${user.fullName}</div>`;

        item.addEventListener('click', () => {
            selectUser(fieldId, user);
        });

        dropdown.appendChild(item);
    });

    dropdown.classList.remove('hidden');
}

// Function to show all users
function showAllUsers(fieldId) {
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    const hiddenSelect = document.getElementById(fieldId);

    if (!dropdown || !hiddenSelect) return;

    dropdown.innerHTML = '';

    users.filter(user => typeof user.fullName === 'string' && user.fullName.trim() !== '').slice(0, 20).forEach(user => {
        const item = document.createElement('div');
        item.className = 'dropdown-item p-2 hover:bg-gray-100 cursor-pointer';
        item.innerHTML = `<div class="font-medium">${user.fullName}</div>`;

        item.addEventListener('click', () => {
            selectUser(fieldId, user);
        });

        dropdown.appendChild(item);
    });

    dropdown.classList.remove('hidden');
}

// Function to select a user
function selectUser(fieldId, user) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    const hiddenSelect = document.getElementById(fieldId);

    if (!searchInput || !dropdown || !hiddenSelect) {
        return;
    }

    searchInput.value = user.fullName;

    hiddenSelect.innerHTML = '';
    const option = document.createElement('option');
    option.value = user.id;
    option.text = user.fullName;
    option.selected = true;
    hiddenSelect.appendChild(option);

    hiddenSelect.value = user.id;
    dropdown.classList.add('hidden');

    const changeEvent = new Event('change', { bubbles: true });
    hiddenSelect.dispatchEvent(changeEvent);
    searchInput.dispatchEvent(changeEvent);
}

// Function to update employee names in approval fields after employees are loaded
function updateUserNamesInApprovalFields() {
    if (!window.users || window.users.length === 0) {
        return;
    }

    const approvalFields = [
        'Approval.PreparedById',
        'Approval.CheckedById',
        'Approval.AcknowledgedById',
        'Approval.ApprovedById',
        'Approval.ReceivedById'
    ];

    approvalFields.forEach(fieldId => {
        const hiddenSelect = document.getElementById(fieldId);

        if (hiddenSelect && hiddenSelect.value) {
            const userId = hiddenSelect.value;
            const user = window.users.find(user => user.id === userId);

            if (user) {
                setApprovalFieldValue(fieldId, userId, user.fullName);
            }
        }
    });
}

// Function to set approval field value with proper DOM manipulation
function setApprovalFieldValue(fieldId, userId, userName = null) {
    const hiddenSelect = document.getElementById(fieldId);
    const searchInput = document.getElementById(`${fieldId}Search`);

    if (!hiddenSelect || !searchInput) {
        console.warn(`Approval field elements not found: ${fieldId}`);
        return;
    }

    if (userId) {
        hiddenSelect.value = userId;
        const options = hiddenSelect.querySelectorAll('option');
        options.forEach(option => {
            if (option.value === userId) {
                option.selected = true;
            } else {
                option.selected = false;
            }
        });

        if (!hiddenSelect.querySelector(`option[value="${userId}"]`)) {
            let displayName = userName;
            if (window.users && window.users.length > 0) {
                const user = window.users.find(u => u.id === userId);
                if (user && user.fullName) displayName = user.fullName;
            }
            const newOption = document.createElement('option');
            newOption.value = userId;
            newOption.text = displayName || `User ${userId}`;
            newOption.selected = true;
            hiddenSelect.appendChild(newOption);
        }
    } else {
        hiddenSelect.value = '';
    }

    if (window.users && window.users.length > 0 && userId) {
        const user = window.users.find(u => u.id === userId);
        searchInput.value = user ? user.fullName : (userName || '');
    } else if (userName) {
        searchInput.value = userName;
    } else {
        searchInput.value = '';
    }

    const changeEvent = new Event('change', { bubbles: true });
    const inputEvent = new Event('input', { bubbles: true });
    hiddenSelect.dispatchEvent(changeEvent);
    searchInput.dispatchEvent(inputEvent);
    searchInput.dispatchEvent(changeEvent);
}

// Function to ensure approval field values are properly set after page load
async function ensureApprovalFieldValues() {
    const approvalFields = [
        'Approval.PreparedById',
        'Approval.CheckedById',
        'Approval.AcknowledgedById',
        'Approval.ApprovedById',
        'Approval.ReceivedById'
    ];

    for (const fieldId of approvalFields) {
        const hiddenSelect = document.getElementById(fieldId);
        const searchInput = document.getElementById(`${fieldId}Search`);

        if (hiddenSelect && searchInput) {
            try {
                if (hiddenSelect.value && !searchInput.value.trim()) {
                    setApprovalFieldValue(fieldId, hiddenSelect.value);
                } else if (searchInput.value && searchInput.value.trim() && !hiddenSelect.value) {
                    if (window.users && window.users.length > 0) {
                        const user = window.users.find(u => u.fullName === searchInput.value.trim());
                        if (user) {
                            setApprovalFieldValue(fieldId, user.id);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing approval field ${fieldId}:`, error);
            }
        }
    }
}

// Function to collect approval field values for form submission
function collectApprovalFieldValues() {
    const approvalFields = [
        'Approval.PreparedById',
        'Approval.CheckedById',
        'Approval.AcknowledgedById',
        'Approval.ApprovedById',
        'Approval.ReceivedById'
    ];

    const approvalData = {};

    approvalFields.forEach(fieldId => {
        const hiddenSelect = document.getElementById(fieldId);
        const searchInput = document.getElementById(`${fieldId}Search`);

        if (hiddenSelect && searchInput) {
            let userId = hiddenSelect.value;
            const userName = searchInput.value;

            const fieldName = fieldId.replace('Approval.', '');

            if (userName && userName.trim() && !userId) {
                const user = users.find(u => u.fullName === userName.trim());
                if (user) {
                    userId = user.id;
                }
            }

            approvalData[fieldName] = userId;
            approvalData[`${fieldName}Name`] = userName;
        }
    });

    return approvalData;
}

// Function to ensure approval field values are properly set before submission
async function ensureApprovalFieldsBeforeSubmit() {
    await loadUsersIfNeeded();

    const approvalFields = [
        'Approval.PreparedById',
        'Approval.CheckedById',
        'Approval.AcknowledgedById',
        'Approval.ApprovedById',
        'Approval.ReceivedById'
    ];

    for (const fieldId of approvalFields) {
        const hiddenSelect = document.getElementById(fieldId);
        const searchInput = document.getElementById(`${fieldId}Search`);

        if (hiddenSelect && searchInput) {
            try {
                if (searchInput.value && searchInput.value.trim() && !hiddenSelect.value) {
                    const userId = await findUserIdByName(searchInput.value);
                    if (userId) {
                        hiddenSelect.innerHTML = '';
                        const option = document.createElement('option');
                        option.value = userId;
                        option.text = searchInput.value;
                        option.selected = true;
                        hiddenSelect.appendChild(option);
                        hiddenSelect.value = userId;
                    }
                }

                if (searchInput.value && searchInput.value.trim()) {
                    const selectedOption = hiddenSelect.selectedOptions[0];
                    if (!selectedOption || selectedOption.text !== searchInput.value.trim()) {
                        const user = users.find(u => u.fullName === searchInput.value.trim());
                        if (user) {
                            hiddenSelect.innerHTML = '';
                            const option = document.createElement('option');
                            option.value = user.id;
                            option.text = user.fullName;
                            option.selected = true;
                            hiddenSelect.appendChild(option);
                            hiddenSelect.value = user.id;
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing approval field ${fieldId}:`, error);
            }
        }
    }
}

// Function to find user ID by name
async function findUserIdByName(userName) {
    if (!userName || typeof userName !== 'string' || !userName.trim()) {
        return null;
    }

    if (window.users && window.users.length > 0) {
        let user = window.users.find(user => {
            if (!user || typeof user.fullName !== 'string' || !user.fullName.trim()) {
                return false;
            }
            const searchName = userName.toLowerCase().trim();
            const fullName = user.fullName.toLowerCase().trim();
            return fullName === searchName;
        });

        if (user) {
            return user.id;
        }

        user = window.users.find(user => {
            if (!user || typeof user.fullName !== 'string' || !user.fullName.trim()) {
                return false;
            }
            const searchName = userName.toLowerCase().trim();
            const fullName = user.fullName.toLowerCase().trim();
            return fullName.includes(searchName);
        });

        if (user) {
            return user.id;
        }
    }

    try {
        await loadUsersIfNeeded();

        if (window.users && window.users.length > 0) {
            let user = window.users.find(user => {
                if (!user || typeof user.fullName !== 'string' || !user.fullName.trim()) {
                    return false;
                }
                const searchName = userName.toLowerCase().trim();
                const fullName = user.fullName.toLowerCase().trim();
                return fullName === searchName;
            });

            if (user) {
                return user.id;
            }

            user = window.users.find(user => {
                if (!user || typeof user.fullName !== 'string' || !user.fullName.trim()) {
                    return false;
                }
                const searchName = userName.toLowerCase().trim();
                const fullName = user.fullName.toLowerCase().trim();
                return fullName.includes(searchName);
            });

            if (user) {
                return user.id;
            }
        }

        return null;

    } catch (error) {
        console.error('Error finding user by name:', error);
        return null;
    }
}

// Function to load users from API if not already loaded
async function loadUsersIfNeeded() {
    if (window.users && window.users.length > 0) {
        return;
    }

    try {
        const response = await makeAuthenticatedRequest('/api/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const result = await response.json();

        if (!result.status || !result.data) {
            throw new Error('Invalid response from API');
        }

        window.users = result.data;
        updateUserNamesInApprovalFields();

    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Function to fetch the last serial number for AR Invoice (for display only)
async function fetchAndSetLastSerialNumber() {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        const response = await fetch(`${BASE_URL}/api/outgoing-payment-serial-numbers/last/${year}/${month}`, {
            method: 'GET',
            headers: {
                'accept': '*/*'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.serialNumber) {
                const parts = data.serialNumber.split('/');
                if (parts.length === 2) {
                    let num = parseInt(parts[0], 10);
                    if (!isNaN(num)) {
                        num = num + 1;
                        const paddedNum = num.toString().padStart(parts[0].length, '0');
                        const nextSerial = `${paddedNum}/${parts[1]}`;
                        const docNumInput = document.getElementById('DocNum');
                        if (docNumInput) {
                            docNumInput.value = 'VCR/' + nextSerial;
                        }
                    }
                } else {
                    const docNumInput = document.getElementById('DocNum');
                    if (docNumInput) {
                        docNumInput.value = 'VCR/' + data.serialNumber;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error fetching last serial number:', error);
    }
}

// Function to fetch the next serial number for AR Invoice (for submit only)
async function fetchNextSerialNumber() {
    try {
        const response = await fetch(`${BASE_URL}/api/outgoing-payment-serial-numbers/next`, {
            method: 'POST',
            headers: {
                'accept': '*/*'
            },
            body: ''
        });

        if (response.ok) {
            const data = await response.json();
            if (data.serialNumber) {
                return data.serialNumber;
            }
        }
    } catch (error) {
        console.error('Error fetching next serial number:', error);
    }
    return null;
}

// Helper function to convert number to English text
function numberToWords(num) {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

    if (num === 0) return 'zero';
    if (num < 0) return 'negative ' + numberToWords(Math.abs(num));

    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
        return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    }
    if (num < 1000) {
        return ones[Math.floor(num / 100)] + ' hundred' + (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '');
    }
    if (num < 1000000) {
        return numberToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
    }
    if (num < 1000000000) {
        return numberToWords(Math.floor(num / 1000000)) + ' million' + (num % 1000000 !== 0 ? ' ' + numberToWords(num % 1000000) : '');
    }
    if (num < 1000000000000) {
        return numberToWords(Math.floor(num / 1000000000)) + ' billion' + (num % 1000000000 !== 0 ? ' ' + numberToWords(num % 1000000000) : '');
    }
    return numberToWords(Math.floor(num / 1000000000000)) + ' trillion' + (num % 1000000000000 !== 0 ? ' ' + numberToWords(num % 1000000000000) : '');
}

function updateTotalTransferTerbilang() {
    // Ambil data dari currencySummaryTable (sama seperti Total Amount Due)
    const summaryDiv = document.getElementById('currencySummaryTable');
    const outstandingSpan = document.getElementById('totalOutstandingTransfers');

    if (!outstandingSpan) return;

    if (!summaryDiv || !summaryDiv.innerHTML || summaryDiv.innerHTML.includes('Currency Summary: -')) {
        outstandingSpan.textContent = '-';
        return;
    }

    // Parse data dari currencySummaryTable
    const currencyTotals = {};
    const tableRows = document.querySelectorAll('#tableBody tr');
    tableRows.forEach(row => {
        const currencyInput = row.querySelector('.currency-search-input');
        const amountInput = row.querySelector('.currency-input-idr');
        if (!currencyInput || !amountInput) return;
        const currency = (currencyInput.value || 'IDR').trim().toUpperCase();
        let amount = 0;
        if (typeof window.parseCurrencyIDR === 'function') {
            amount = window.parseCurrencyIDR(amountInput.value);
        } else {
            amount = parseCurrency(amountInput.value);
        }
        if (!currencyTotals[currency]) currencyTotals[currency] = 0;
        currencyTotals[currency] += amount;
    });

    // Convert to text format
    const currencyKeys = Object.keys(currencyTotals);
    if (currencyKeys.length === 0) {
        outstandingSpan.textContent = '-';
        return;
    }

    const textParts = currencyKeys.map(curr => {
        const amount = currencyTotals[curr];
        const amountText = numberToWords(Math.floor(amount));
        return `${curr} ${amountText}`;
    });

    outstandingSpan.innerHTML = textParts.join('<br>');
}

// GL Account and Account Name Dropdown Functions

async function searchGLAccount(input) {
    console.log('searchGLAccount called with value:', input.value);
    const searchTerm = input.value.trim();
    const dropdown = document.getElementById('AcctCodeDropdown');

    if (searchTerm.length < 1) {
        dropdown.classList.add('hidden');
        return;
    }

    try {
        const url = `${BASE_URL}/api/expenses/search?coa=${encodeURIComponent(searchTerm)}&page=1&pageSize=20`;

        const response = await makeAuthenticatedRequest(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('Failed to fetch GL Account data:', response.status);
            dropdown.classList.add('hidden');
            return;
        }

        const result = await response.json();
        displayGLAccountDropdown(result.data || [], dropdown, input);

    } catch (error) {
        console.error('Error searching GL Account:', error);
        dropdown.classList.add('hidden');
    }
}

async function searchAccountName(input) {
    console.log('searchAccountName called with value:', input.value);
    const searchTerm = input.value.trim();
    const dropdown = document.getElementById('AcctNameDropdown');

    if (searchTerm.length < 1) {
        dropdown.classList.add('hidden');
        return;
    }

    try {
        const url = `${BASE_URL}/api/expenses/search?accountName=${encodeURIComponent(searchTerm)}&page=1&pageSize=20`;

        const response = await makeAuthenticatedRequest(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('Failed to fetch Account Name data:', response.status);
            dropdown.classList.add('hidden');
            return;
        }

        const result = await response.json();
        displayAccountNameDropdown(result.data || [], dropdown, input);

    } catch (error) {
        console.error('Error searching Account Name:', error);
        dropdown.classList.add('hidden');
    }
}


function displayGLAccountDropdown(glAccounts, dropdown, input) {
    dropdown.innerHTML = '';

    if (!glAccounts || glAccounts.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item text-gray-500">No GL Accounts found</div>';
        dropdown.classList.remove('hidden');
        return;
    }

    // Remove duplicates based on COA
    const uniqueAccounts = glAccounts.filter((account, index, self) =>
        index === self.findIndex(a => a.coa === account.coa)
    );

    uniqueAccounts.forEach(account => {
        const item = document.createElement('div');
        item.className = 'dropdown-item cursor-pointer hover:bg-gray-100 p-2 border-b';
        item.innerHTML = `
            <div class="font-medium">${account.coa}</div>
            <div class="text-sm text-gray-600">${account.accountName}</div>
        `;
        item.onclick = () => selectGLAccount(account, input, dropdown);
        dropdown.appendChild(item);
    });

    dropdown.classList.remove('hidden');
}

function displayAccountNameDropdown(accounts, dropdown, input) {
    dropdown.innerHTML = '';

    if (!accounts || accounts.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item text-gray-500">No Account Names found</div>';
        dropdown.classList.remove('hidden');
        return;
    }

    // Remove duplicates based on accountName
    const uniqueAccounts = accounts.filter((account, index, self) =>
        index === self.findIndex(a => a.accountName === account.accountName)
    );

    uniqueAccounts.forEach(account => {
        const item = document.createElement('div');
        item.className = 'dropdown-item cursor-pointer hover:bg-gray-100 p-2 border-b';
        item.innerHTML = `
            <div class="font-medium">${account.accountName}</div>
            <div class="text-sm text-gray-600">${account.coa}</div>
        `;
        item.onclick = () => selectAccountName(account, input, dropdown);
        dropdown.appendChild(item);
    });

    dropdown.classList.remove('hidden');
}

function selectGLAccount(account, input, dropdown) {
    input.value = account.coa;
    dropdown.classList.add('hidden');

    // Auto-fill the corresponding Account Name field
    const accountNameInput = input.closest('tr').querySelector('#AcctName');
    if (accountNameInput) {
        accountNameInput.value = account.accountName;
    }
}

function selectAccountName(account, input, dropdown) {
    input.value = account.accountName;
    dropdown.classList.add('hidden');

    // Auto-fill the corresponding GL Account field
    const glAccountInput = input.closest('tr').querySelector('#AcctCode');
    if (glAccountInput) {
        glAccountInput.value = account.coa;
    }
}

function showGLAccountDropdown(input) {
    console.log('showGLAccountDropdown called');
    const dropdown = document.getElementById('AcctCodeDropdown');

    // Show dropdown even if empty, or trigger search if has value
    if (input.value.trim().length > 0) {
        searchGLAccount(input);
    } else {
        // Show a message to start typing
        dropdown.innerHTML = '<div class="dropdown-item text-gray-500">Type to search G/L Account...</div>';
        dropdown.classList.remove('hidden');
    }
}

function showAccountNameDropdown(input) {
    console.log('showAccountNameDropdown called');
    const dropdown = document.getElementById('AcctNameDropdown');

    // Show dropdown even if empty, or trigger search if has value
    if (input.value.trim().length > 0) {
        searchAccountName(input);
    } else {
        // Show a message to start typing
        dropdown.innerHTML = '<div class="dropdown-item text-gray-500">Type to search Account Name...</div>';
        dropdown.classList.remove('hidden');
    }
}

// Hide dropdowns when clicking outside
document.addEventListener('click', function (event) {
    const glDropdown = document.getElementById('AcctCodeDropdown');
    const accountDropdown = document.getElementById('AcctNameDropdown');
    const currencyDropdowns = document.querySelectorAll('[id*="CurrencyItemDropdown"]');

    // Hide GL Account dropdown
    if (glDropdown && !event.target.closest('#tdAcctCode') && !event.target.closest('#AcctCodeDropdown')) {
        glDropdown.classList.add('hidden');
    }

    // Hide Account Name dropdown
    if (accountDropdown && !event.target.closest('#tdAcctName') && !event.target.closest('#AcctNameDropdown')) {
        accountDropdown.classList.add('hidden');
    }

    // Hide currency dropdowns
    currencyDropdowns.forEach(dropdown => {
        if (!event.target.closest('[id*="tdCurrencyItem"]') && !event.target.closest('[id*="CurrencyItemDropdown"]')) {
            dropdown.classList.add('hidden');
        }
    });
});

// Make functions globally available for HTML onclick handlers
window.submitDocument = submitDocument;
window.goToMenuAR = goToMenuAR;
window.updateTotalAmountDue = updateTotalAmountDue;
window.setInitialRemittanceRequestAmount = setInitialRemittanceRequestAmount;
window.searchCurrencies = searchCurrencies;
window.showCurrencyDropdown = showCurrencyDropdown;
window.selectCurrency = selectCurrency;
// Debug: Check if functions are properly loaded
console.log('GL Account dropdown functions loaded');
console.log('searchGLAccount function:', typeof searchGLAccount);
console.log('searchAccountName function:', typeof searchAccountName);

window.searchGLAccount = searchGLAccount;
window.searchAccountName = searchAccountName;
window.showGLAccountDropdown = showGLAccountDropdown;
window.showAccountNameDropdown = showAccountNameDropdown;
window.selectGLAccount = selectGLAccount;
window.selectAccountName = selectAccountName;

// Ensure DOM is ready and setup event listeners for GL Account dropdown
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, setting up GL Account dropdown listeners');

    // Check if dropdown containers exist
    const glDropdown = document.getElementById('AcctCodeDropdown');
    const nameDropdown = document.getElementById('AcctNameDropdown');
    console.log('GL Account dropdown container found:', !!glDropdown);
    console.log('Account Name dropdown container found:', !!nameDropdown);

    // Setup GL Account input
    const glAccountInput = document.getElementById('AcctCode');
    if (glAccountInput) {
        console.log('GL Account input found, adding event listeners');
        console.log('GL Account input readonly:', glAccountInput.readOnly);
        console.log('GL Account input disabled:', glAccountInput.disabled);

        // Remove any existing event handlers from HTML
        glAccountInput.removeAttribute('onkeyup');
        glAccountInput.removeAttribute('onfocus');

        // Force remove readonly/disabled if somehow set
        glAccountInput.readOnly = false;
        glAccountInput.disabled = false;

        // Clear any existing event listeners by cloning
        const newGLInput = glAccountInput.cloneNode(true);
        glAccountInput.parentNode.replaceChild(newGLInput, glAccountInput);

        // Re-get the element reference
        const freshGLInput = document.getElementById('AcctCode');

        // Add event listeners to ensure dropdown works
        freshGLInput.addEventListener('keyup', function () {
            console.log('GL Account keyup triggered:', this.value);
            searchGLAccount(this);
        });

        freshGLInput.addEventListener('focus', function () {
            console.log('GL Account focus triggered');
            showGLAccountDropdown(this);
        });

        freshGLInput.addEventListener('input', function () {
            console.log('GL Account input triggered:', this.value);
            searchGLAccount(this);
        });

        freshGLInput.addEventListener('click', function () {
            console.log('GL Account clicked');
        });

        // Test if input can be manually changed
        freshGLInput.addEventListener('change', function () {
            console.log('GL Account changed:', this.value);
        });

        console.log('GL Account event listeners setup complete');
    } else {
        console.error('GL Account input not found!');
    }

    // Setup Account Name input  
    const accountNameInput = document.getElementById('AcctName');
    if (accountNameInput) {
        console.log('Account Name input found, adding event listeners');
        console.log('Account Name input readonly:', accountNameInput.readOnly);
        console.log('Account Name input disabled:', accountNameInput.disabled);

        // Remove any existing event handlers from HTML
        accountNameInput.removeAttribute('onkeyup');
        accountNameInput.removeAttribute('onfocus');

        // Force remove readonly/disabled if somehow set
        accountNameInput.readOnly = false;
        accountNameInput.disabled = false;

        // Clear any existing event listeners by cloning
        const newNameInput = accountNameInput.cloneNode(true);
        accountNameInput.parentNode.replaceChild(newNameInput, accountNameInput);

        // Re-get the element reference
        const freshNameInput = document.getElementById('AcctName');

        // Add event listeners to ensure dropdown works
        freshNameInput.addEventListener('keyup', function () {
            console.log('Account Name keyup triggered:', this.value);
            searchAccountName(this);
        });

        freshNameInput.addEventListener('focus', function () {
            console.log('Account Name focus triggered');
            showAccountNameDropdown(this);
        });

        freshNameInput.addEventListener('input', function () {
            console.log('Account Name input triggered:', this.value);
            searchAccountName(this);
        });

        freshNameInput.addEventListener('click', function () {
            console.log('Account Name clicked');
        });

        // Test if input can be manually changed
        freshNameInput.addEventListener('change', function () {
            console.log('Account Name changed:', this.value);
        });

        console.log('Account Name event listeners setup complete');
    } else {
        console.error('Account Name input not found!');
    }
});

window.autofillPreparedByWithCurrentUser = autofillPreparedByWithCurrentUser;
window.ensureApprovalFieldValues = ensureApprovalFieldValues;
window.loadUsersIfNeeded = loadUsersIfNeeded;
window.collectApprovalFieldValues = collectApprovalFieldValues;
window.updateUserNamesInApprovalFields = updateUserNamesInApprovalFields;
window.viewAttachment = viewAttachment;
window.refreshAttachments = refreshAttachments;
window.viewPrintReimbursement = viewPrintReimbursement;
window.openPrintReimbursement = openPrintReimbursement;
window.displayPrintOutReimbursement = displayPrintOutReimbursement;

// Ensure jrnlMemo and remarks are always readonly
window.addEventListener('DOMContentLoaded', async function () {
    var jrnlMemo = document.getElementById('jrnlMemo');
    if (jrnlMemo) jrnlMemo.readOnly = true;
    var remarks = document.getElementById('remarks');
    // REMOVE the line below so remarks is always editable
    // if (remarks) remarks.readOnly = true;

    try {
        await initializeUserDropdowns();
        console.log('User dropdowns initialized successfully');
    } catch (error) {
        console.error('Error initializing user dropdowns:', error);
    }
});

// Custom searchGLAccount for per-row dropdown
function searchGLAccountCustom(input, dropdown, acctNameInputId) {
    const searchTerm = input.value.trim();
    if (searchTerm.length < 1) {
        dropdown.classList.add('hidden');
        return;
    }
    makeAuthenticatedRequest(`${BASE_URL}/api/expenses/search?coa=${encodeURIComponent(searchTerm)}&page=1&pageSize=20`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.ok ? response.json() : Promise.reject(response))
        .then(result => {
            displayGLAccountDropdownCustom(result.data || [], dropdown, input, acctNameInputId);
        })
        .catch(() => {
            dropdown.classList.add('hidden');
        });
}
function showGLAccountDropdownCustom(input, dropdown, acctNameInputId) {
    if (input.value.trim().length > 0) {
        searchGLAccountCustom(input, dropdown, acctNameInputId);
    } else {
        dropdown.innerHTML = '<div class="dropdown-item text-gray-500">Type to search G/L Account...</div>';
        dropdown.classList.remove('hidden');
    }
}
function displayGLAccountDropdownCustom(glAccounts, dropdown, input, acctNameInputId) {
    dropdown.innerHTML = '';
    if (!glAccounts || glAccounts.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item text-gray-500">No GL Accounts found</div>';
        dropdown.classList.remove('hidden');
        return;
    }
    const uniqueAccounts = glAccounts.filter((account, index, self) =>
        index === self.findIndex(a => a.coa === account.coa)
    );
    uniqueAccounts.forEach(account => {
        const item = document.createElement('div');
        item.className = 'dropdown-item cursor-pointer hover:bg-gray-100 p-2 border-b';
        item.innerHTML = `
            <div class="font-medium">${account.coa}</div>
            <div class="text-sm text-gray-600">${account.accountName}</div>
        `;
        item.onclick = () => {
            input.value = account.coa;
            dropdown.classList.add('hidden');
            // Auto-fill Account Name
            const acctNameInput = document.getElementById(acctNameInputId);
            if (acctNameInput) {
                acctNameInput.value = account.accountName;
            }
        };
        dropdown.appendChild(item);
    });
    dropdown.classList.remove('hidden');
}
// Custom searchAccountName for per-row dropdown
function searchAccountNameCustom(input, dropdown, acctCodeInputId) {
    const searchTerm = input.value.trim();
    if (searchTerm.length < 1) {
        dropdown.classList.add('hidden');
        return;
    }
    makeAuthenticatedRequest(`${BASE_URL}/api/expenses/search?accountName=${encodeURIComponent(searchTerm)}&page=1&pageSize=20`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.ok ? response.json() : Promise.reject(response))
        .then(result => {
            displayAccountNameDropdownCustom(result.data || [], dropdown, input, acctCodeInputId);
        })
        .catch(() => {
            dropdown.classList.add('hidden');
        });
}
function showAccountNameDropdownCustom(input, dropdown, acctCodeInputId) {
    if (input.value.trim().length > 0) {
        searchAccountNameCustom(input, dropdown, acctCodeInputId);
    } else {
        dropdown.innerHTML = '<div class="dropdown-item text-gray-500">Type to search Account Name...</div>';
        dropdown.classList.remove('hidden');
    }
}
function displayAccountNameDropdownCustom(accounts, dropdown, input, acctCodeInputId) {
    dropdown.innerHTML = '';
    if (!accounts || accounts.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item text-gray-500">No Account Names found</div>';
        dropdown.classList.remove('hidden');
        return;
    }
    const uniqueAccounts = accounts.filter((account, index, self) =>
        index === self.findIndex(a => a.accountName === account.accountName)
    );
    uniqueAccounts.forEach(account => {
        const item = document.createElement('div');
        item.className = 'dropdown-item cursor-pointer hover:bg-gray-100 p-2 border-b';
        item.innerHTML = `
            <div class="font-medium">${account.accountName}</div>
            <div class="text-sm text-gray-600">${account.coa}</div>
        `;
        item.onclick = () => {
            input.value = account.accountName;
            dropdown.classList.add('hidden');
            // Auto-fill G/L Account
            const acctCodeInput = document.getElementById(acctCodeInputId);
            if (acctCodeInput) {
                acctCodeInput.value = account.coa;
            }
        };
        dropdown.appendChild(item);
    });
    dropdown.classList.remove('hidden');
}// Helper functions for addOPReim.js - append to end of file

// Function to update TransferOutgoing status in reimbursement
async function updateTransferOutgoingStatus(reimbursementId, transferOutgoing) {
    try {
        console.log(`Updating TransferOutgoing status for reimbursement ${reimbursementId} to ${transferOutgoing}`);

        const requestData = {
            Id: reimbursementId,
            TransferOutgoing: transferOutgoing
        };

        const response = await makeAuthenticatedRequest('/api/reimbursements/outgoing-status', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update TransferOutgoing status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('TransferOutgoing status update response:', result);

        return result;
    } catch (error) {
        console.error('Error updating TransferOutgoing status:', error);
        throw error;
    }
}

// Helper function to get user GUID
function getUserGuid(userId) {
    try {
        // If userId is already a GUID format, return it
        if (userId && userId.length === 36 && userId.includes('-')) {
            return userId;
        }

        // Try to get from JWT token
        const token = localStorage.getItem('accessToken');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.sub) {
                return payload.sub;
            }
            if (payload.nameid) {
                return payload.nameid;
            }
        }

        // Fallback: generate GUID from userId hash
        if (userId) {
            return generateGuidFromString(userId);
        }

        return null;
    } catch (e) {
        console.warn('Error getting user GUID:', e);
        return null;
    }
}

// Helper function to generate GUID from string
function generateGuidFromString(str) {
    // Simple GUID generation for demo purposes
    const hash = btoa(str).replace(/[^a-zA-Z0-9]/g, '').padEnd(32, '0').slice(0, 32);
    return [
        hash.slice(0, 8),
        hash.slice(8, 12),
        hash.slice(12, 16),
        hash.slice(16, 20),
        hash.slice(20, 32)
    ].join('-');
}

// Make functions available globally
window.goToMenuAR = goToMenuAR;
window.loadReimbursementDataFromUrl = loadReimbursementDataFromUrl;
window.loadARInvoiceDetails = loadARInvoiceDetails;
window.submitDocument = submitDocument;
window.refreshAttachments = refreshAttachments;
window.viewAttachment = viewAttachment;
window.addRowWithData = addRowWithData;
window.searchGLAccount = searchGLAccount;
window.searchAccountName = searchAccountName;
window.searchCurrencies = searchCurrencies;
window.selectCurrency = selectCurrency;
window.selectGLAccount = selectGLAccount;
window.selectAccountName = selectAccountName;
window.selectUser = selectUser;
window.showAllUsers = showAllUsers;
window.updateTotalAmountDue = updateTotalAmountDue;
window.updateTotalTransferTerbilang = updateTotalTransferTerbilang;
window.numberToWords = numberToWords;
window.formatCurrencyValue = formatCurrencyValue;
window.parseCurrency = parseCurrency;