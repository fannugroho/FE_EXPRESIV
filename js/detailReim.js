// Global variables for data storage
let reimbursementId = '';
let allCategories = [];
let allAccountNames = [];
let transactionTypes = [];
let businessPartners = [];
let previousTransactionTypeValue = null;

// Currency formatting functions
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

// Currency input handlers (IDR formatting)
function onCurrencyInput(e) {
    const input = e.target;
    const oldValue = input.value || '';
    const caret = input.selectionStart != null ? input.selectionStart : oldValue.length;
    // Count numeric chars (digits and '.') to the left of caret in old value
    const leftText = oldValue.slice(0, caret);
    const leftNumericCount = (leftText.match(/[0-9.]/g) || []).length;

    // Build numeric string and number
    const raw = oldValue.replace(/[^\d.-]/g, '');
    const num = parseFloat(raw);

    // If not a number, allow clearing
    if (isNaN(num)) {
        input.value = '';
        updateTotalAmount();
        return;
    }

    // Format full value
    const formatted = formatCurrencyIDR(num);
    input.value = formatted;

    // Restore caret to position matching same count of numeric chars from start
    let newCaret = formatted.length;
    if (input === document.activeElement) {
        let count = 0;
        for (let i = 0; i < formatted.length; i++) {
            if (/[0-9.]/.test(formatted[i])) {
                count++;
            }
            if (count >= leftNumericCount) {
                newCaret = i + 1;
                break;
            }
        }
        try {
            input.setSelectionRange(newCaret, newCaret);
        } catch (_) { /* ignore */ }
    }

    updateTotalAmount();
}

function onCurrencyBlur(e) {
    const input = e.target;
    const value = parseFloat((input.value || '0').replace(/[^\d.-]/g, '')) || 0;
    input.value = formatCurrencyIDR(value);
    updateTotalAmount();
}

// Document ready event listener
document.addEventListener("DOMContentLoaded", function () {
    console.log('DOMContentLoaded event fired');
    console.log('BASE_URL:', BASE_URL);

    // Check if BASE_URL is valid
    if (!BASE_URL || BASE_URL.trim() === '') {
        console.error('BASE_URL is not defined or empty');
        showError('Application configuration is invalid. Please contact administrator.');
        return;
    }

    // Check if we have a valid reimbursement ID
    reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId) {
        console.error('No valid reimbursement ID found in URL');
        showError('No valid reimbursement ID found in URL. Please go back and try again.');
        return;
    }

    // Check authentication
    if (!isAuthenticated()) {
        console.error('User not authenticated');
        showError('Please login again to access this page.');
        setTimeout(() => {
            logoutAuth();
        }, 2000);
        return;
    }

    // Fetch all data
    fetchAllData();
});

// Function to fetch all required data
async function fetchAllData() {
    try {
        // Fetch all data in parallel
        await Promise.all([
            fetchUsers(),
            fetchDepartments(),
            fetchTransactionTypes(),
            fetchBusinessPartners()
        ]);

        // Fetch reimbursement data after other data is loaded
        await fetchReimbursementData();
    } catch (error) {
        console.error('Error fetching data:', error);
        showError('Failed to load data. Please try again.');
    }
}

// Function to get reimbursement ID from URL
function getReimbursementIdFromUrl() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const reimId = urlParams.get('reim-id');

        console.log('URL parameters:', window.location.search);
        console.log('Extracted reim-id:', reimId);

        if (!reimId) {
            console.error('No reim-id parameter found in URL');
            return null;
        }

        if (typeof reimId === 'string' && reimId.trim() === '') {
            console.error('reim-id parameter is empty');
            return null;
        }

        const cleanId = reimId.trim();

        if (!isNaN(cleanId)) {
            const numId = parseInt(cleanId);
            if (numId <= 0) {
                console.error('Invalid reim-id: must be a positive number');
                return null;
            }
            return numId.toString();
        }

        return cleanId;

    } catch (error) {
        console.error('Error parsing URL parameters:', error);
        return null;
    }
}

// Function to fetch reimbursement data
async function fetchReimbursementData() {
    reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId) {
        console.error('No reimbursement ID found in URL');
        showError('No reimbursement ID found in URL. Please go back and try again.');
        return;
    }

    try {
        console.log('Fetching reimbursement data for ID:', reimbursementId);
        console.log('API URL:', `${BASE_URL}/api/reimbursements/${reimbursementId}`);

        // Check authentication
        const token = getAccessToken();
        if (!token) {
            console.error('No access token found');
            showError('Please login again to access this page.');
            setTimeout(() => {
                logoutAuth();
            }, 2000);
            return;
        }

        if (!isAuthenticated()) {
            console.error('Token is expired');
            showError('Your session has expired. Please login again.');
            setTimeout(() => {
                logoutAuth();
            }, 2000);
            return;
        }

        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        // Handle different HTTP status codes
        if (response.status === 400) {
            console.error('Bad Request (400): Invalid reimbursement ID or malformed request');
            showError('The reimbursement ID is invalid or the request is malformed. Please check the URL and try again.');
            return;
        }

        if (response.status === 401) {
            console.error('Unauthorized (401): Authentication required');
            showError('Please login again to access this page.');
            setTimeout(() => {
                logoutAuth();
            }, 2000);
            return;
        }

        if (response.status === 404) {
            console.error('Not Found (404): Reimbursement not found');
            showError('The requested reimbursement document was not found. It may have been deleted or you may not have permission to view it.');
            return;
        }

        if (response.status === 500) {
            console.error('Internal Server Error (500): Server error');
            showError('An internal server error occurred. Please try again later.');
            return;
        }

        if (!response.ok) {
            console.error('HTTP Error:', response.status, response.statusText);
            showError(`Failed to fetch reimbursement data. Status: ${response.status} ${response.statusText}`);
            return;
        }

        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            showError('The server returned an invalid response. Please try again.');
            return;
        }

        // Check if we got a valid response
        if (!result) {
            console.error('No response received from API');
            showError('No response received from the server. Please try again.');
            return;
        }

        if (result && result.status && result.code === 200) {
            if (!result.data) {
                console.error('No data received from API');
                showError('No reimbursement data was received from the server.');
                return;
            }

            console.log('Reimbursement data received:', result.data);

            // Copy data to expected properties if not present
            if (!result.data.reimbursementDetails && result.data.details) {
                console.log('Copying details to reimbursementDetails');
                result.data.reimbursementDetails = result.data.details;
            }

            if (!result.data.reimbursementAttachments && result.data.attachments) {
                console.log('Copying attachments to reimbursementAttachments');
                result.data.reimbursementAttachments = result.data.attachments;
            }

            // Populate form data
            populateFormData(result.data);

            // Display attachments
            if (result.data.reimbursementAttachments && result.data.reimbursementAttachments.length > 0) {
                console.log('Displaying attachments:', result.data.reimbursementAttachments.length, 'files');
                displayAttachments(result.data.reimbursementAttachments);
            } else if (result.data.attachments && result.data.attachments.length > 0) {
                console.log('Displaying attachments:', result.data.attachments.length, 'files');
                displayAttachments(result.data.attachments);
            } else {
                console.log('No attachments to display');
                document.getElementById('attachmentsList').innerHTML = '';
            }

            // Display revision history
            renderRevisionHistory(result.data.revisions);

            // Display rejection remarks
            displayRejectionRemarks(result.data);

        } else {
            console.error('Failed to fetch reimbursement data:', result);
            let errorMessage = 'Failed to load reimbursement data. Please try again.';

            if (result && typeof result === 'object') {
                errorMessage = result.message || result.error || result.errorMessage || errorMessage;
            } else if (typeof result === 'string') {
                errorMessage = result;
            }

            showError(errorMessage);
        }
    } catch (error) {
        console.error('Error fetching reimbursement data:', error);

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showError('Unable to connect to the server. Please check your internet connection and try again.');
        } else if (error.name === 'SyntaxError') {
            showError('The server returned an invalid response format. Please try again.');
        } else {
            showError(`An unexpected error occurred: ${error.message}`);
        }
    }
}

// Function to populate form data
function populateFormData(data) {
    console.log('Populating form data with:', data);

    // Populate basic fields
    document.getElementById('voucherNo').value = data.voucherNo || '';
    // Requester Name should display only the name (no employee id)
    const requesterInput = document.getElementById('requesterNameSearch');
    if (requesterInput) {
        requesterInput.value = (data.requesterName || '').toString().split(' - ').slice(-1)[0];
    }
    document.getElementById('department').value = data.department || '';
    document.getElementById('currency').value = data.currency || '';
    document.getElementById('status').value = data.status || '';
    document.getElementById('referenceDoc').value = data.referenceDoc || '';
    document.getElementById('typeOfTransaction').value = data.typeOfTransaction || '';
    document.getElementById('remarks').value = data.remarks || '';

    // Populate submission date
    if (data.submissionDate) {
        const date = new Date(data.submissionDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        document.getElementById('submissionDate').value = formattedDate;
    }

    // Populate payTo field
    console.log('💰 Processing Pay To field with data.payTo:', data.payTo);
    populatePayToField(data.payTo);

    // Populate approval fields
    console.log('👥 Processing approval fields...');
    populateApprovalField('preparedBy', data.preparedBy);
    populateApprovalField('acknowledgeBy', data.acknowledgedBy);
    populateApprovalField('checkedBy', data.checkedBy);
    populateApprovalField('approvedBy', data.approvedBy);
    populateApprovalField('receivedBy', data.receivedBy);

    // Populate reimbursement details table
    if (data.reimbursementDetails && data.reimbursementDetails.length > 0) {
        console.log('Populating reimbursement details:', data.reimbursementDetails.length, 'rows');
        populateReimbursementDetails(data.reimbursementDetails);
    } else if (data.details && data.details.length > 0) {
        console.log('Populating details:', data.details.length, 'rows');
        populateReimbursementDetails(data.details);
    } else {
        console.warn('No reimbursement details found to populate');
        const tableBody = document.getElementById('reimbursementDetails');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">No details available</td></tr>';
        }
    }

    // Disable all form fields for view-only mode
    disableAllFormFields();

    console.log('Form fields disabled, now enabling action buttons...');
    
    // Enable action buttons when data is loaded (only for Draft status)
    enableActionButtons();
    
    // Enable form fields for editing if status is Draft
    enableFormFieldsForEditing();
}

// Function to populate payTo field
function populatePayToField(payToId) {
    if (!payToId || !window.allUsers) {
        console.log('⚠️ populatePayToField: Missing payToId or allUsers not loaded');
        return;
    }

    console.log('💰 populatePayToField called with payToId:', payToId);
    console.log('📊 Available users:', window.allUsers.length);

    // Convert both to string for comparison
    const payToIdStr = payToId.toString();

    // Log sample users for debugging
    console.log('🔍 Sample users for comparison:', window.allUsers.slice(0, 3).map(user => ({
        id: user.id,
        idType: typeof user.id,
        idString: user.id.toString(),
        fullName: user.fullName
    })));

    const matchingUser = window.allUsers.find(user => {
        const userStr = user.id.toString();
        const isMatch = userStr === payToIdStr;
        if (isMatch) {
            console.log('🎯 Found matching user for Pay To:', {
                userId: user.id,
                fullName: user.fullName,
                employeeId: user.employeeId,
                kansaiEmployeeId: user.kansaiEmployeeId
            });
        }
        return isMatch;
    });

    if (matchingUser) {
        const displayText = matchingUser.kansaiEmployeeId ?
            `${matchingUser.kansaiEmployeeId} - ${matchingUser.fullName}` :
            `${matchingUser.employeeId || ''} - ${matchingUser.fullName}`;

        console.log('✅ Pay To display text:', displayText);
        const payToInput = document.getElementById('payToSearch');
        if (payToInput) {
            payToInput.value = displayText;
            // Save selected user id for submission
            payToInput.dataset.userId = matchingUser.id;
        }
    } else {
        console.log('❌ No matching user found for Pay To ID:', payToId);
        console.log('🔍 Available user IDs:', window.allUsers.map(u => u.id.toString()));
        document.getElementById('payToSearch').value = `User ID: ${payToId}`;
    }
}

// Function to populate approval field
function populateApprovalField(fieldPrefix, userId) {
    if (!userId || !window.allUsers) {
        console.log(`⚠️ populateApprovalField: Missing userId or allUsers not loaded for ${fieldPrefix}`);
        return;
    }

    console.log(`👤 populateApprovalField called for ${fieldPrefix} with userId:`, userId);

    // Convert both to string for comparison
    const userIdStr = userId.toString();

    const matchingUser = window.allUsers.find(user => {
        const userStr = user.id.toString();
        const isMatch = userStr === userIdStr;
        if (isMatch) {
            console.log(`🎯 Found matching user for ${fieldPrefix}:`, {
                userId: user.id,
                fullName: user.fullName
            });
        }
        return isMatch;
    });

    if (matchingUser) {
        const searchInput = document.getElementById(`${fieldPrefix}Search`);
        if (searchInput) {
            const displayName = matchingUser.fullName || matchingUser.name || matchingUser.username || '';
            console.log(`✅ ${fieldPrefix} display name:`, displayName);
            searchInput.value = displayName;
            // Save selected user id for submission
            searchInput.dataset.userId = matchingUser.id;
        } else {
            console.log(`⚠️ ${fieldPrefix}Search input not found`);
        }
    } else {
        console.log(`❌ No matching user found for ${fieldPrefix} ID:`, userId);
        const searchInput = document.getElementById(`${fieldPrefix}Search`);
        if (searchInput) {
            searchInput.value = `User ID: ${userId}`;
        }
    }
}

// Function to populate reimbursement details table
function populateReimbursementDetails(details) {
    console.log('populateReimbursementDetails called with:', details);

    const tableBody = document.getElementById('reimbursementDetails');
    if (!tableBody) {
        console.error('Table body #reimbursementDetails not found!');
        return;
    }

    tableBody.innerHTML = '';

    if (details && details.length > 0) {
        console.log(`Populating ${details.length} reimbursement detail rows`);

        details.forEach((detail, index) => {
            console.log(`Processing detail row ${index + 1}:`, detail);

            const row = document.createElement('tr');
            if (detail.id) {
                row.dataset.detailId = detail.id;
            }
            row.innerHTML = `
                <td class="p-2 border">
                    <div class="relative">
                        <input type="text" class="w-full p-1 border rounded search-input category-search" value="${detail.category || ''}" placeholder="Search category..." autocomplete="off">
                        <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden category-dropdown z-50"></div>
                        <select class="hidden category-select">
                            <option value="" disabled>Choose Category</option>
                        </select>
                    </div>
                </td>
                <td class="p-2 border">
                    <div class="relative">
                        <input type="text" class="w-full p-1 border rounded search-input account-name-search" value="${detail.accountName || ''}" placeholder="Search account name..." autocomplete="off">
                        <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden account-name-dropdown z-50"></div>
                        <select class="hidden account-name-select">
                            <option value="" disabled>Choose Account Name</option>
                        </select>
                    </div>
                </td>
                <td class="p-2 border">
                    <input type="text" class="w-full p-1 border rounded bg-gray-200 cursor-not-allowed gl-account" value="${detail.glAccount || ''}" readonly>
                </td>
                <td class="p-2 border">
                    <input type="text" class="w-full p-1 border rounded" value="${detail.description || ''}" placeholder="Description">
                </td>
                <td class="p-2 border">
                    <input type="text" class="w-full p-1 border rounded text-right currency-input-idr" value="${formatCurrencyIDR(detail.amount || 0)}" placeholder="0.00">
                </td>
            `;
            tableBody.appendChild(row);
            
            // Add action buttons to the row if in Draft mode
            const status = document.getElementById('status')?.value;
            if (status === 'Draft') {
                addActionButtonsToRow(row);
                // Setup dropdown functionality for existing rows
                setupRowDropdowns(row);
                
                // Add event listeners to amount input for formatting & total
                const amountInput = row.querySelector('input.currency-input-idr');
                if (amountInput) {
                    amountInput.addEventListener('input', onCurrencyInput);
                    amountInput.addEventListener('blur', onCurrencyBlur);
                }
            }
        });
    } else {
        console.log('No details found, showing empty message');
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">No details available</td></tr>';
    }

    // Calculate and update the total amount
    updateTotalAmount();
}

// Function to calculate total amount
function updateTotalAmount() {
    const amountCells = document.querySelectorAll('#reimbursementDetails tr td:nth-child(5)');
    console.log(`updateTotalAmount: Found ${amountCells.length} amount cells`);

    let total = 0;

    amountCells.forEach((cell, index) => {
        let numericValue = 0;
        
        // Check if cell contains input field (for editable rows)
        const input = cell.querySelector('input');
        if (input) {
            const raw = input.value || '0';
            const cleaned = raw.replace(/,/g, '').replace(/[^\d.-]/g, '');
            numericValue = parseFloat(cleaned) || 0;
        } else {
            // Static text content (for existing rows)
        const amountText = cell.textContent.trim();
            const cleaned = amountText.replace(/,/g, '').replace(/[^\d.-]/g, '');
            numericValue = parseFloat(cleaned) || 0;
        }
        
        console.log(`Row ${index + 1} amount: ${numericValue}`);
        total += numericValue;
    });

    const formattedTotal = formatCurrencyIDR(total);
    console.log(`Total amount: ${total} -> ${formattedTotal}`);

    const totalAmountField = document.getElementById('totalAmount');
    if (totalAmountField) {
        totalAmountField.value = formattedTotal;
    } else {
        console.error('totalAmount field not found!');
    }
}

// Function to display attachments
function displayAttachments(attachments) {
    const attachmentsList = document.getElementById('attachmentsList');
    attachmentsList.innerHTML = '';

    if (attachments && attachments.length > 0) {
        console.log('Displaying attachments:', attachments.length, 'files');

        // Determine if Draft to show delete buttons
        const isDraft = (document.getElementById('status')?.value || '') === 'Draft';

        attachments.forEach(attachment => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';
            if (attachment.id) {
                attachmentItem.dataset.attachmentId = attachment.id;
            }

            const left = document.createElement('span');
            left.textContent = attachment.fileName || attachment.name || 'Attachment';

            const right = document.createElement('div');
            right.className = 'flex items-center gap-3';

            const view = document.createElement('a');
            view.href = `${BASE_URL}/${attachment.filePath}`;
            view.target = '_blank';
            view.className = 'text-blue-500 hover:text-blue-700';
            view.textContent = 'View';

            right.appendChild(view);

            if (isDraft && attachment.id) {
                const del = document.createElement('button');
                del.className = 'text-red-600 hover:text-red-800';
                del.textContent = 'Delete';
                del.onclick = () => deleteAttachment(attachment.id);
                right.appendChild(del);
            }

            attachmentItem.appendChild(left);
            attachmentItem.appendChild(right);
            attachmentsList.appendChild(attachmentItem);
        });
    } else {
        console.log('No attachments to display');
    }
}

// Helper to append a single attachment to the list (uses same structure as displayAttachments)
function appendAttachmentToList(attachment) {
    const list = document.getElementById('attachmentsList');
    if (!list) return;
    const isDraft = (document.getElementById('status')?.value || '') === 'Draft';
    const attachmentItem = document.createElement('div');
    attachmentItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';
    if (attachment.id) attachmentItem.dataset.attachmentId = attachment.id;

    const left = document.createElement('span');
    left.textContent = attachment.fileName || attachment.name || 'Attachment';

    const right = document.createElement('div');
    right.className = 'flex items-center gap-3';

    if (attachment.filePath) {
        const view = document.createElement('a');
        view.href = `${BASE_URL}/${attachment.filePath}`;
        view.target = '_blank';
        view.className = 'text-blue-500 hover:text-blue-700';
        view.textContent = 'View';
        right.appendChild(view);
    } else {
        const uploaded = document.createElement('span');
        uploaded.className = 'text-gray-400';
        uploaded.textContent = 'Uploaded';
        right.appendChild(uploaded);
    }

    if (isDraft && attachment.id) {
        const del = document.createElement('button');
        del.className = 'text-red-600 hover:text-red-800';
        del.textContent = 'Delete';
        del.onclick = () => deleteAttachment(attachment.id);
        right.appendChild(del);
    }

    attachmentItem.appendChild(left);
    attachmentItem.appendChild(right);
    list.appendChild(attachmentItem);
}

// Upload attachments handler (input onchange)
async function uploadAttachmentsHandler(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    try {
        await uploadAttachments(files);
    } catch (e) {
        console.error('uploadAttachmentsHandler error:', e);
        showError('Failed to upload attachments');
    } finally {
        event.target.value = '';
    }
}

// POST /api/reimbursements/{reimbursementId}/attachments/upload
async function uploadAttachments(files) {
    const rid = reimbursementId || getReimbursementIdFromUrl();
    if (!rid) {
        showError('Reimbursement ID not found');
        return;
    }
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('files', f));
    const resp = await fetch(`${BASE_URL}/api/reimbursements/${rid}/attachments/upload`, {
        method: 'POST',
        body: formData
    });
    const result = await resp.json();
    if (!result.status || result.code !== 200) {
        throw new Error(result.message || 'Upload failed');
    }
    // Optimistically append new attachments to the list without refetching the whole page
    let uploaded = [];
    if (Array.isArray(result.data)) uploaded = result.data;
    else if (result.data && Array.isArray(result.data.attachments)) uploaded = result.data.attachments;
    else if (result.data) uploaded = [ result.data ];

    if (uploaded.length === 0) {
        // Fallback: append placeholders using local File objects (without view/delete if IDs unknown)
        const list = document.getElementById('attachmentsList');
        if (list) {
            Array.from(files).forEach(f => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';
                const left = document.createElement('span');
                left.textContent = f.name;
                const right = document.createElement('div');
                right.className = 'flex items-center gap-3 text-gray-400';
                right.textContent = 'Uploaded';
                item.appendChild(left);
                item.appendChild(right);
                list.appendChild(item);
            });
        }
    } else {
        uploaded.forEach(att => appendAttachmentToList(att));
    }
}

// DELETE /api/reimbursements/{reimbursementId}/attachments/{attachmentId}
async function deleteAttachment(attachmentId) {
    const rid = reimbursementId || getReimbursementIdFromUrl();
    if (!rid) {
        showError('Reimbursement ID not found');
        return;
    }
    try {
        const confirm = await Swal.fire({
            title: 'Delete Attachment',
            text: 'Are you sure you want to delete this attachment?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Delete'
        });
        if (!confirm.isConfirmed) return;
        const resp = await fetch(`${BASE_URL}/api/reimbursements/${rid}/attachments/${attachmentId}`, {
            method: 'DELETE'
        });
        const result = await resp.json();
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Delete failed');
        }
        // Optimistically update UI without re-fetching whole page
        const list = document.getElementById('attachmentsList');
        const toRemove = list && list.querySelector(`[data-attachment-id="${attachmentId}"]`);
        if (toRemove && toRemove.parentNode) {
            toRemove.parentNode.removeChild(toRemove);
        } else {
            // fallback: rebuild list with remaining attachments if we have them
            // no-op since we don't maintain attachments in memory here
        }
    } catch (e) {
        console.error('deleteAttachment error:', e);
        showError('Failed to delete attachment');
    }
}

// Function to disable all form fields for view-only mode
function disableAllFormFields() {
    // Disable all input fields
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = true;
        input.classList.add('bg-gray-100', 'cursor-not-allowed');
    });

    // Hide action buttons
    const actionButtons = document.querySelectorAll('button[onclick*="confirmDelete"], button[onclick*="updateReim"], button[onclick*="confirmSubmit"]');
    actionButtons.forEach(button => {
        button.style.display = 'none';
    });

    // Hide file input (will be shown only in Draft by enableFormFieldsForEditing)
    const fileInput = document.getElementById('filePath');
    if (fileInput) fileInput.style.display = 'none';
    const fileInputLabel = fileInput ? fileInput.previousElementSibling : null;
    if (fileInputLabel && fileInputLabel.tagName === 'H3') fileInputLabel.style.display = 'none';
}

// Function to enable form fields for editing (only for Draft status)
function enableFormFieldsForEditing() {
    const status = document.getElementById('status')?.value;
    
    if (status === 'Draft') {
        // Set submission date to current date
        const submissionDateField = document.getElementById('submissionDate');
        if (submissionDateField) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            submissionDateField.value = `${year}-${month}-${day}`;
        }

        // Enable specific fields for editing
        const editableFields = [
            'requesterNameSearch',
            'currency',
            'payToSearch',
            'referenceDoc',
            'typeOfTransaction',
            'remarks',
            'preparedBySearch',
            'acknowledgeBySearch',
            'checkedBySearch',
            'approvedBySearch',
            'receivedBySearch'
        ];

        editableFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.disabled = false;
                field.classList.remove('bg-gray-100', 'cursor-not-allowed');
                field.classList.add('bg-white', 'cursor-text');
            }
        });

        // Keep these fields disabled
        const disabledFields = ['voucherNo', 'status', 'totalAmount', 'department'];
        disabledFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.disabled = true;
                field.classList.add('bg-gray-100', 'cursor-not-allowed');
            }
        });

        // Enable dropdown functionality for searchable fields
        enableDropdownSearch();
        
        // Add table row management buttons
        addTableRowManagement();
        
        // Show and enable attachments input in Draft
        const fileInput = document.getElementById('filePath');
    const fileInputLabel = fileInput ? fileInput.previousElementSibling : null;
        if (fileInput) {
            fileInput.style.display = '';
            fileInput.disabled = false;
            fileInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
        }
        if (fileInputLabel && fileInputLabel.tagName === 'H3') fileInputLabel.style.display = '';

        // Enable table item fields for editing (GL Account stays read-only but selectable)
        const tableFields = document.querySelectorAll('#reimbursementDetails input, #reimbursementDetails select, #reimbursementDetails textarea');
        tableFields.forEach(el => {
            if (el.classList.contains('gl-account')) {
                el.disabled = false; // allow focus/copy
                el.readOnly = true;
                el.classList.add('bg-gray-100', 'cursor-not-allowed');
            } else {
                el.disabled = false;
                try { el.readOnly = false; } catch (e) {}
                el.classList.remove('bg-gray-100', 'cursor-not-allowed');
                el.classList.add('bg-white', 'cursor-text');
            }
        });

        // Add event listeners for department and transaction type changes
        addDependencyChangeListeners();
        // Remember initial transaction type to detect changes
        previousTransactionTypeValue = document.getElementById('typeOfTransaction')?.value || null;
        
        // Fetch categories if department and transaction type are selected
        const department = document.getElementById('department')?.value;
        const transactionType = document.getElementById('typeOfTransaction')?.value;
        if (department && transactionType) {
            fetchCategories(department, transactionType);
        }
        
        console.log('Form fields enabled for editing (Draft status)');
    }
}

// Function to add event listeners for dependency changes
function addDependencyChangeListeners() {
    const departmentSelect = document.getElementById('department');
    const transactionTypeSelect = document.getElementById('typeOfTransaction');
    
    if (departmentSelect) {
        departmentSelect.addEventListener('change', handleDependencyChange);
    }
    
    if (transactionTypeSelect) {
        transactionTypeSelect.addEventListener('change', handleDependencyChange);
    }
}

// Function to handle dependency changes
async function handleDependencyChange() {
    const department = document.getElementById('department')?.value;
    const transactionType = document.getElementById('typeOfTransaction')?.value;
    
    if (department && transactionType) {
        // If transaction type changed and there are items, confirm before clearing
        const tbody = document.getElementById('reimbursementDetails');
        const hasRows = tbody && tbody.querySelectorAll('tr').length > 0;
        const typeChanged = previousTransactionTypeValue !== null && previousTransactionTypeValue !== transactionType;

        if (typeChanged && hasRows) {
            const result = await Swal.fire({
                title: 'Change Transaction Type?',
                text: 'Changing Type of Transaction will clear all item rows. Are you sure?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes, change it',
                cancelButtonText: 'Cancel'
            });
            if (!result.isConfirmed) {
                // revert selection
                const typeSelect = document.getElementById('typeOfTransaction');
                if (typeSelect && previousTransactionTypeValue !== null) {
                    typeSelect.value = previousTransactionTypeValue;
                }
                return;
            }
            // Clear rows
            if (tbody) tbody.innerHTML = '';
            updateTotalAmount();
        }

        // Proceed to fetch categories for new combination
        console.log('Dependencies changed, fetching categories for:', department, transactionType);
        await fetchCategories(department, transactionType);

        // Update previous value
        previousTransactionTypeValue = transactionType;
    }
}

// Function to enable dropdown search functionality
function enableDropdownSearch() {
    // Enable requester name search
    enableUserSearch('requesterNameSearch', 'requesterNameDropdown');
    
    // Enable pay to search
    enableUserSearch('payToSearch', 'payToDropdown');
    
    // Enable approval fields search
    enableUserSearch('preparedBySearch', 'preparedByDropdown');
    enableUserSearch('acknowledgeBySearch', 'acknowledgeByDropdown');
    enableUserSearch('checkedBySearch', 'checkedByDropdown');
    enableUserSearch('approvedBySearch', 'approvedByDropdown');
    enableUserSearch('receivedBySearch', 'receivedByDropdown');
}

// Function to enable user search for a specific field
function enableUserSearch(inputId, dropdownId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Create dropdown container if it doesn't exist
    let dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = dropdownId;
        dropdown.className = 'absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto hidden';
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(dropdown);
    }
    
    // Add event listeners
    input.addEventListener('input', (e) => {
        // Clear any previously selected user id when user types
        try { delete input.dataset.userId; } catch (_) {}
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length < 2) {
            dropdown.classList.add('hidden');
            return;
        }
        
        // Filter users based on search term
        const filteredUsers = window.allUsers.filter(user => {
            // Check if user and required properties exist before filtering
            if (!user) return false;
            
            const fullName = user.fullName || '';
            const employeeId = user.employeeId || '';
            const kansaiEmployeeId = user.kansaiEmployeeId || '';
            
            return fullName.toLowerCase().includes(searchTerm) ||
                   employeeId.toLowerCase().includes(searchTerm) ||
                   kansaiEmployeeId.toLowerCase().includes(searchTerm);
        });
        
        // Populate dropdown
        populateUserDropdown(dropdown, filteredUsers, input);
        dropdown.classList.remove('hidden');
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

// Function to populate user dropdown
function populateUserDropdown(dropdown, users, input) {
    dropdown.innerHTML = '';
    
    if (users.length === 0) {
        dropdown.innerHTML = '<div class="p-2 text-gray-500">No users found</div>';
        return;
    }
    
    users.forEach(user => {
        if (!user) return; // Skip null/undefined users
        
        const item = document.createElement('div');
        item.className = 'p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200';
        
        // Safely get user properties with fallbacks
        const fullName = user.fullName || 'Unknown Name';
        const employeeId = user.employeeId || '';
        const kansaiEmployeeId = user.kansaiEmployeeId || '';
        
        const displayText = kansaiEmployeeId ? 
            `${kansaiEmployeeId} - ${fullName}` : 
            `${employeeId} - ${fullName}`;
        
        item.textContent = displayText;
        item.addEventListener('click', async () => {
            // Display: requester should show only name; others can show id - name
            if (input.id === 'requesterNameSearch') {
                input.value = fullName;
                input.dataset.fullName = fullName;
            } else {
                input.value = displayText;
            }
            dropdown.classList.add('hidden');
            // Store selected user id for saving
            input.dataset.userId = user.id;

            // If selecting requester, auto-fill department based on selected user
            if (input.id === 'requesterNameSearch') {
                try {
                    await autoFillDepartmentFromRequesterById(user.id);
                } catch (e) {
                    console.error('Failed to auto-fill department:', e);
                }
            }
        });
        
        dropdown.appendChild(item);
    });
}

// Auto-fill department from requester ID (cache first, then API)
async function autoFillDepartmentFromRequesterById(userId) {
    try {
        if (window.allUsers && window.allUsers.length > 0) {
            const user = window.allUsers.find(u => u.id === userId);
            const dep = user && (user.department || user.departmentName || user.dept || user.departement);
            if (dep) {
                setDepartmentValue(dep);
                return;
            }
        }
        const response = await fetch(`${BASE_URL}/api/users/${userId}`);
        if (!response.ok) throw new Error(`API ${response.status}`);
        const result = await response.json();
        if (!result.status || result.code !== 200) throw new Error(result.message || 'Failed to fetch user');
        const user = result.data;
        const dep = user && (user.department || user.departmentName || user.dept || user.departement);
        if (dep) setDepartmentValue(dep);
    } catch (err) {
        console.error('autoFillDepartmentFromRequesterById error:', err);
    }
}

function setDepartmentValue(departmentName) {
    const departmentSelect = document.getElementById('department');
    if (!departmentSelect) return;
    let option = Array.from(departmentSelect.options).find(o => o.value === departmentName);
    if (!option) {
        option = document.createElement('option');
        option.value = departmentName;
        option.textContent = departmentName;
        departmentSelect.appendChild(option);
    }
    departmentSelect.value = departmentName;
    const transactionType = document.getElementById('typeOfTransaction')?.value;
    if (transactionType) {
        fetchCategories(departmentName, transactionType);
    }
}

// Function to add table row management
function addTableRowManagement() {
    const table = document.getElementById('reimTable');
    if (!table) return;
    
    // Add header row for actions
    const thead = table.querySelector('thead tr');
    if (thead && !thead.querySelector('.action-header')) {
        const actionHeader = document.createElement('th');
        actionHeader.className = 'p-2 action-header';
        actionHeader.textContent = 'Actions';
        thead.appendChild(actionHeader);
    }
    
    // Add row management buttons below table (only once)
    const tableContainer = table.parentNode;
    let buttonContainer = document.getElementById('reimTableControls');
    if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.id = 'reimTableControls';
        buttonContainer.className = 'flex gap-2 mt-2';
        buttonContainer.innerHTML = `
            <button onclick="addTableRow()" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Row
            </button>
        `;
    }
    // Always position below the table
    if (table.nextSibling) {
        tableContainer.insertBefore(buttonContainer, table.nextSibling);
    } else {
        tableContainer.appendChild(buttonContainer);
    }
    
    // Add action buttons to existing rows
    const tbody = table.querySelector('tbody');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => addActionButtonsToRow(row));
    }
}

// Function to add action buttons to a table row
function addActionButtonsToRow(row) {
    if (row.querySelector('.action-buttons')) return; // Already has buttons
    
    const actionCell = document.createElement('td');
    actionCell.className = 'p-2 border action-buttons';
    actionCell.innerHTML = `
        <button onclick="deleteTableRow(this)" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">
            <svg class="w-3 h-3 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
        </button>
    `;
    
    row.appendChild(actionCell);
}

// Function to add new table row
function addTableRow() {
    const tbody = document.getElementById('reimbursementDetails');
    if (!tbody) return;
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td class="p-2 border">
            <div class="relative">
                <input type="text" class="w-full p-1 border rounded search-input category-search" placeholder="Search category..." autocomplete="off">
                <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden category-dropdown z-50"></div>
                <select class="hidden category-select">
                    <option value="" disabled selected>Choose Category</option>
                </select>
            </div>
        </td>
        <td class="p-2 border">
            <div class="relative">
                <input type="text" class="w-full p-1 border rounded search-input account-name-search" placeholder="Search account name..." autocomplete="off">
                <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden account-name-dropdown z-50"></div>
                <select class="hidden account-name-select">
                    <option value="" disabled selected>Choose Account Name</option>
                </select>
            </div>
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full p-1 border rounded bg-gray-200 cursor-not-allowed gl-account" readonly>
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full p-1 border rounded" placeholder="Description">
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full p-1 border rounded text-right currency-input-idr" placeholder="0.00">
        </td>
        <td class="p-2 border action-buttons">
            <button onclick="deleteTableRow(this)" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">
                <svg class="w-3 h-3 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </td>
    `;
    
    tbody.appendChild(newRow);
    
    // Setup dropdown functionality for the new row
    setupRowDropdowns(newRow);
    
    // Add event listeners to new inputs for total calculation & formatting
    const amtInput = newRow.querySelector('input.currency-input-idr');
    if (amtInput) {
        amtInput.addEventListener('input', onCurrencyInput);
        amtInput.addEventListener('blur', onCurrencyBlur);
    }
    
    // Ensure categories are loaded for the new row
    if (allCategories.length > 0) {
        const categorySearch = newRow.querySelector('.category-search');
        if (categorySearch) {
            categorySearch.dataset.categories = JSON.stringify(allCategories);
            console.log('✅ Categories loaded for new row:', allCategories.length);
        }
    } else {
        console.log('⚠️ No categories available for new row, fetching...');
        // Try to fetch categories if not available
        const department = document.getElementById('department')?.value;
        const transactionType = document.getElementById('typeOfTransaction')?.value;
        if (department && transactionType) {
            fetchCategories(department, transactionType).then(() => {
                // Update the new row with categories after they're fetched
                const categorySearch = newRow.querySelector('.category-search');
                if (categorySearch && allCategories.length > 0) {
                    categorySearch.dataset.categories = JSON.stringify(allCategories);
                    console.log('✅ Categories loaded for new row after fetch:', allCategories.length);
                }
            });
        }
    }
}

// Function to delete table row
function deleteTableRow(button) {
    const row = button.closest('tr');
    if (row) {
        row.remove();
        updateTotalAmount();
    }
}

// Function to setup dropdown functionality for a table row
function setupRowDropdowns(row) {
    const categorySearch = row.querySelector('.category-search');
    const categoryDropdown = row.querySelector('.category-dropdown');
    const accountNameSearch = row.querySelector('.account-name-search');
    const accountNameDropdown = row.querySelector('.account-name-dropdown');

    if (categorySearch && categoryDropdown) {
        // Store categories data for searching
        if (allCategories.length > 0) {
            categorySearch.dataset.categories = JSON.stringify(allCategories);
            console.log('✅ Categories loaded for row:', allCategories.length);
        } else {
            console.log('⚠️ No categories available, will load on focus/click');
        }

        categorySearch.addEventListener('input', function() {
            filterCategories(this);
        });

        categorySearch.addEventListener('focus', function() {
            if (allCategories.length > 0) {
                this.dataset.categories = JSON.stringify(allCategories);
                filterCategories(this);
            } else {
                // Try to fetch categories if not available
                const department = document.getElementById('department')?.value;
                const transactionType = document.getElementById('typeOfTransaction')?.value;
                if (department && transactionType) {
                    console.log('🔄 Fetching categories on focus...');
                    fetchCategories(department, transactionType).then(() => {
                        if (allCategories.length > 0) {
                            this.dataset.categories = JSON.stringify(allCategories);
                            filterCategories(this);
                            console.log('✅ Categories loaded on focus:', allCategories.length);
                        }
                    });
                }
            }
        });

        categorySearch.addEventListener('click', function() {
            if (allCategories.length > 0) {
                this.dataset.categories = JSON.stringify(allCategories);
                filterCategories(this);
            } else {
                // Try to fetch categories if not available
                const department = document.getElementById('department')?.value;
                const transactionType = document.getElementById('typeOfTransaction')?.value;
                if (department && transactionType) {
                    console.log('🔄 Fetching categories on click...');
                    fetchCategories(department, transactionType).then(() => {
                        if (allCategories.length > 0) {
                            this.dataset.categories = JSON.stringify(allCategories);
                            filterCategories(this);
                            console.log('✅ Categories loaded on click:', allCategories.length);
                        }
                    });
                }
            }
        });
    }

    if (accountNameSearch && accountNameDropdown) {
        accountNameSearch.addEventListener('input', function() {
            // Try multiple sources for category value
            let category = row.querySelector('.category-search')?.value;
            if (!category) {
                category = this.dataset.selectedCategory;
            }
            if (!category) {
                category = row.dataset.selectedCategory;
            }
            
            console.log('🔍 Account name input - category value:', category, 'from:', {
                inputValue: row.querySelector('.category-search')?.value,
                inputDataset: this.dataset.selectedCategory,
                rowDataset: row.dataset.selectedCategory
            });
            
            if (category) {
                filterAccountNames(this, category);
            } else {
                // Show message if no category is selected
                const dropdown = this.parentElement.querySelector('.account-name-dropdown');
                if (dropdown) {
                    dropdown.innerHTML = '<div class="p-2 text-gray-500">Please select a category first</div>';
                    dropdown.classList.remove('hidden');
                }
            }
        });

        accountNameSearch.addEventListener('focus', function() {
            // Try multiple sources for category value
            let category = row.querySelector('.category-search')?.value;
            if (!category) {
                category = this.dataset.selectedCategory;
            }
            if (!category) {
                category = row.dataset.selectedCategory;
            }
            
            console.log('🔍 Account name focus - category value:', category, 'from:', {
                inputValue: row.querySelector('.category-search')?.value,
                inputDataset: this.dataset.selectedCategory,
                rowDataset: row.dataset.selectedCategory
            });
            
            if (category) {
                filterAccountNames(this, category);
            } else {
                // Show message if no category is selected
                const dropdown = this.parentElement.querySelector('.account-name-dropdown');
                if (dropdown) {
                    dropdown.innerHTML = '<div class="p-2 text-gray-500">Please select a category first</div>';
                    dropdown.classList.remove('hidden');
                }
            }
        });
    }

    // Hide dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!row.contains(e.target)) {
            if (categoryDropdown) categoryDropdown.classList.add('hidden');
            if (accountNameDropdown) accountNameDropdown.classList.add('hidden');
        }
    });
}

// Function to filter and display categories
function filterCategories(input) {
    const searchText = input.value.toLowerCase();
    const dropdown = input.parentElement.querySelector('.category-dropdown');

    if (!dropdown) return;

    // Clear dropdown
    dropdown.innerHTML = '';

    try {
        const categories = JSON.parse(input.dataset.categories || '[]');
        const filtered = categories.filter(category =>
            category && category.toLowerCase().includes(searchText)
        );

        if (filtered.length === 0) {
            dropdown.innerHTML = '<div class="p-2 text-gray-500">No categories found</div>';
        } else {
                    // Display search results
        filtered.forEach(category => {
            const option = document.createElement('div');
            option.className = 'p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200';
            option.textContent = category;
            option.addEventListener('click', function() {
                console.log('🎯 Category selected:', category);
                input.value = category;
                dropdown.classList.add('hidden');

                // Clear account name and GL account when category changes
                const row = input.closest('tr');
                console.log('🔍 Row found for category selection:', !!row);
                console.log('🔍 Row element:', row);
                
                const accountNameSearch = row.querySelector('.account-name-search');
                const glAccount = row.querySelector('.gl-account');
                
                console.log('🔍 Account name search field found:', !!accountNameSearch);
                console.log('🔍 GL account field found:', !!glAccount);
                
                if (accountNameSearch) {
                    accountNameSearch.value = '';
                    console.log('✅ Cleared account name field');
                }
                if (glAccount) {
                    glAccount.value = '';
                    console.log('✅ Cleared GL account field');
                }

                // Load account names for this category
                console.log('🔄 Loading account names for category:', category);
                console.log('🔍 About to call loadAccountNamesForCategory with:', { row, category });
                loadAccountNamesForCategory(row, category);
            });
            dropdown.appendChild(option);
        });
        }

        dropdown.classList.remove('hidden');
    } catch (error) {
        console.error('Error filtering categories:', error);
        dropdown.innerHTML = '<div class="p-2 text-red-500">Error loading categories</div>';
        dropdown.classList.remove('hidden');
    }
}

// Function to filter and display account names
async function filterAccountNames(input, category) {
    const searchText = input.value.toLowerCase();
    const dropdown = input.parentElement.querySelector('.account-name-dropdown');

    if (!dropdown) return;

    // Clear dropdown
    dropdown.innerHTML = '';

    try {
        // Get account names for the selected category
        const accountNames = await getAccountNamesForCategory(category);
        const filtered = accountNames.filter(accountName =>
            accountName && accountName.toLowerCase().includes(searchText)
        );

        if (filtered.length === 0) {
            dropdown.innerHTML = '<div class="p-2 text-gray-500">No account names found</div>';
        } else {
            // Display search results
            filtered.forEach(accountName => {
                const option = document.createElement('div');
                option.className = 'p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200';
                option.textContent = accountName;
                option.addEventListener('click', function() {
                    console.log('🎯 Account name selected:', accountName);
                    input.value = accountName;
                    dropdown.classList.add('hidden');

                    // Load GL account for this category and account name
                    const row = input.closest('tr');
                    console.log('🔍 Row found for GL account lookup:', !!row);
                    console.log('🔍 Row element:', row);
                    
                    // Get the category value from multiple sources
                    let categoryToUse = category; // Start with the parameter
                    if (row) {
                        // Try to get category from the row input first
                        const categoryInput = row.querySelector('.category-search');
                        if (categoryInput && categoryInput.value) {
                            categoryToUse = categoryInput.value;
                            console.log('🔍 Category from input field:', categoryToUse);
                        } else if (input.dataset.selectedCategory) {
                            categoryToUse = input.dataset.selectedCategory;
                            console.log('🔍 Category from input dataset:', categoryToUse);
                        } else if (row.dataset.selectedCategory) {
                            categoryToUse = row.dataset.selectedCategory;
                            console.log('🔍 Category from row dataset:', categoryToUse);
                        }
                    }
                    
                    console.log('🔍 Final category for GL lookup:', categoryToUse);
                    console.log('🔍 About to call loadGLAccountForRow with:', { row, categoryToUse, accountName });
                    
                    if (row && categoryToUse) {
                        console.log('✅ Calling loadGLAccountForRow...');
                        loadGLAccountForRow(row, categoryToUse, accountName);
                    } else {
                        console.error('❌ Missing row or category for GL account lookup');
                        if (!row) console.error('❌ Row not found');
                        if (!categoryToUse) console.error('❌ Category not found');
                    }
                });
                dropdown.appendChild(option);
            });
        }

        dropdown.classList.remove('hidden');
    } catch (error) {
        console.error('Error filtering account names:', error);
        dropdown.innerHTML = '<div class="p-2 text-red-500">Error loading account names</div>';
        dropdown.classList.remove('hidden');
    }
}

// Function to get account names for a category
async function getAccountNamesForCategory(category) {
    if (!category) return [];
    
    const department = document.getElementById('department')?.value;
    const transactionType = document.getElementById('typeOfTransaction')?.value;
    
    if (!department || !transactionType) {
        console.log('Department or transaction type not selected, cannot fetch account names');
        return [];
    }
    
    try {
        console.log('Fetching account names for category:', category, 'department:', department, 'transaction:', transactionType);
        const response = await fetch(`${BASE_URL}/api/expenses-coa/filter?departmentName=${encodeURIComponent(department)}&menu=Reimbursement&transaction=${encodeURIComponent(transactionType)}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch account names');
        }
        
        if (!result.data || !Array.isArray(result.data)) {
            throw new Error('Invalid data format from API');
        }
        
        // Filter account names for the specific category
        const accountNames = [...new Set(result.data
            .filter(item => item.category === category && item.accountName)
            .map(item => item.accountName)
        )];
        
        console.log('Fetched account names for category:', category, ':', accountNames);
        return accountNames;
        
    } catch (error) {
        console.error('Error fetching account names:', error);
        return [];
    }
}

// Function to load account names for a category
async function loadAccountNamesForCategory(row, category) {
    console.log('🔄 loadAccountNamesForCategory called with category:', category);
    
    // Clear the account name field when category changes
    const accountNameSearch = row.querySelector('.account-name-search');
    if (accountNameSearch) {
        accountNameSearch.value = '';
        console.log('✅ Cleared account name field');
    }
    
    // Also clear the GL account field
    const glAccount = row.querySelector('.gl-account');
    if (glAccount) {
        glAccount.value = '';
        console.log('✅ Cleared GL account field');
    }
    
    // Store the category in the account name input for reference
    if (accountNameSearch) {
        accountNameSearch.dataset.selectedCategory = category;
        console.log('✅ Stored category in dataset:', category);
    }
    
    // Also store the category in the row for easier access
    row.dataset.selectedCategory = category;
    console.log('✅ Stored category in row dataset:', category);
}

// Function to load GL account for a row
async function loadGLAccountForRow(row, category, accountName) {
    console.log('🚀 loadGLAccountForRow called with:', { category, accountName });
    
    if (!category || !accountName) {
        console.log('❌ Missing category or account name for GL account lookup');
        console.log('Category:', category, 'Account Name:', accountName);
        return;
    }
    
    const department = document.getElementById('department')?.value;
    const transactionType = document.getElementById('typeOfTransaction')?.value;
    
    console.log('🔍 Department and Transaction Type:', { department, transactionType });
    
    if (!department || !transactionType) {
        console.log('❌ Department or transaction type not selected, cannot fetch GL account');
        return;
    }
    
    try {
        console.log('🔍 Fetching GL account for:', { category, accountName, department, transactionType });
        const apiUrl = `${BASE_URL}/api/expenses-coa/filter?departmentName=${encodeURIComponent(department)}&menu=Reimbursement&transaction=${encodeURIComponent(transactionType)}`;
        console.log('🔍 API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📊 Raw API response:', result);
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch GL account');
        }
        
        if (!result.data || !Array.isArray(result.data)) {
            throw new Error('Invalid data format from API');
        }
        
        console.log('📊 API response data:', result.data);
        console.log('🔍 Total data items:', result.data.length);
        
        // Find the GL account for the specific category and account name
        console.log('🔍 Looking for exact matches with:', { category, accountName });
        
        // Log first few items to see the structure
        console.log('🔍 Sample data items:', result.data.slice(0, 3).map(item => ({
            category: item.category,
            accountName: item.accountName,
            glAccount: item.glAccount
        })));
        
        const matchingItem = result.data.find(item => {
            const categoryMatch = item.category === category;
            const accountNameMatch = item.accountName === accountName;
            
            // Also try case-insensitive matching
            const categoryMatchCI = item.category && item.category.toLowerCase() === category.toLowerCase();
            const accountNameMatchCI = item.accountName && item.accountName.toLowerCase() === accountName.toLowerCase();
            
            console.log('🔍 Checking item:', { 
                itemCategory: item.category, 
                itemAccountName: item.accountName, 
                categoryMatch, 
                accountNameMatch,
                categoryMatchCI,
                accountNameMatchCI,
                itemGLAccount: item.glAccount
            });
            
            // Use case-insensitive matching if exact match fails
            return (categoryMatch && accountNameMatch) || (categoryMatchCI && accountNameMatchCI);
        });
        
        console.log('Matching item found:', matchingItem);
        
        const glAccount = row.querySelector('.gl-account');
        
        if (glAccount) {
            if (matchingItem && matchingItem.coa) {
                glAccount.value = matchingItem.coa;
                console.log('GL Account populated:', matchingItem.coa);
                
                // Force a DOM update
                glAccount.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                glAccount.value = '';
                console.log('No GL account found for this combination');
            }
        } else {
            console.error('GL account input field not found in row');
        }
        
    } catch (error) {
        console.error('❌ Error fetching GL account:', error);
        const glAccount = row.querySelector('.gl-account');
        if (glAccount) {
            glAccount.value = '';
        }
    }
}

// Enable action buttons when data is loaded (only for Draft status)
function enableActionButtons() {
    console.log('enableActionButtons called');
    
    // Get current status from the Status field
    const statusField = document.getElementById('status');
    const currentStatus = statusField ? statusField.value : '';
    
    console.log('Status field found:', !!statusField);
    console.log('Current status value:', currentStatus);

    // Use the helper function to update visibility
    updateActionButtonsVisibility(currentStatus);
}

// Helper function to manage all action buttons visibility
function updateActionButtonsVisibility(status) {
    console.log('updateActionButtonsVisibility called with status:', status);
    
    const deleteButton = document.getElementById('deleteButton');
    const updateButton = document.getElementById('updateButton');
    const submitButton = document.getElementById('submitButton');
    const actionButtonsContainer = deleteButton ? deleteButton.closest('.action-buttons-section') : null;

    console.log('Delete button found:', !!deleteButton);
    console.log('Update button found:', !!updateButton);
    console.log('Submit button found:', !!submitButton);
    console.log('Action buttons container found:', !!actionButtonsContainer);

    if (actionButtonsContainer) {
        if (status === 'Draft') {
            // Show all action buttons for Draft status
            actionButtonsContainer.style.display = 'block';
            
            if (deleteButton) {
                deleteButton.style.display = 'inline-block';
                deleteButton.disabled = false;
            }
            
            if (updateButton) {
                updateButton.style.display = 'inline-block';
                updateButton.disabled = false;
            }
            
            if (submitButton) {
                submitButton.style.display = 'inline-block';
                submitButton.disabled = false;
            }
            
            console.log('All action buttons shown for Draft status');
        } else {
            // Hide all action buttons for non-Draft status
            actionButtonsContainer.style.display = 'none';
            
            if (deleteButton) deleteButton.style.display = 'none';
            if (updateButton) updateButton.style.display = 'none';
            if (submitButton) submitButton.style.display = 'none';
            
            console.log(`All action buttons hidden for status: ${status}`);
        }
    } else {
        console.warn('Action buttons container not found');
    }
}

// Function to fetch departments
async function fetchDepartments() {
    try {
        const response = await fetch(`${BASE_URL}/api/department`);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }

        const data = await response.json();
        console.log("Department data:", data);
        populateDepartmentSelect(data.data);
    } catch (error) {
        console.error('Error fetching departments:', error);
    }
}

// Function to populate department select
function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("department");
    if (!departmentSelect) return;

    departmentSelect.innerHTML = '<option value="" disabled>Select Department</option>';

    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.name;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
    });
}

// Function to fetch users
async function fetchUsers() {
    try {
        console.log('🔍 Fetching users from API...');
        const response = await fetch(`${BASE_URL}/api/users`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch users');
        }

        const users = result.data;
        
        // Filter out invalid users and ensure required properties exist
        const validUsers = users.filter(user => 
            user && 
            typeof user === 'object' && 
            user.id && 
            (user.fullName || user.name || user.username)
        );
        
        window.allUsers = validUsers;
        console.log('✅ Stored', validUsers.length, 'valid users in global cache');
        console.log('⚠️ Filtered out', users.length - validUsers.length, 'invalid users');

        // Log sample users for debugging
        console.log('👥 Sample users data:', validUsers.slice(0, 3).map(user => ({
            id: user.id,
            idType: typeof user.id,
            idString: user.id.toString(),
            username: user.username || 'N/A',
            fullName: user.fullName || user.name || user.username || 'N/A',
            employeeId: user.employeeId || 'N/A',
            kansaiEmployeeId: user.kansaiEmployeeId || 'N/A'
        })));

    } catch (error) {
        console.error("❌ Error fetching users:", error);
    }
}

// Function to fetch transaction types
async function fetchTransactionTypes() {
    try {
        const response = await fetch(`${BASE_URL}/api/transactiontypes/filter?category=Reimbursement`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch transaction types');
        }

        transactionTypes = result.data;
        console.log('Stored', transactionTypes.length, 'transaction types in global cache');
        populateTransactionTypesDropdown(transactionTypes);

    } catch (error) {
        console.error("Error fetching transaction types:", error);
    }
}

// Function to populate transaction types dropdown
function populateTransactionTypesDropdown(types) {
    const typeSelect = document.getElementById("typeOfTransaction");
    if (!typeSelect) return;

    typeSelect.innerHTML = '';
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Transaction Type";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    typeSelect.appendChild(defaultOption);

    types.forEach(type => {
        const option = document.createElement("option");
        option.value = type.name;
        option.textContent = type.name;
        typeSelect.appendChild(option);
    });
}

// Function to fetch business partners
async function fetchBusinessPartners() {
    try {
        const response = await fetch(`${BASE_URL}/api/business-partners/type/employee`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch business partners');
        }

        businessPartners = result.data;
        console.log('Stored', businessPartners.length, 'business partners in global cache');

    } catch (error) {
        console.error("Error fetching business partners:", error);
    }
}

// Function to fetch categories based on department and transaction type
async function fetchCategories(departmentName, transactionType) {
    if (!departmentName || !transactionType) {
        console.log('Department or transaction type not selected, skipping category fetch');
        return;
    }

    try {
        console.log('Fetching categories for department:', departmentName, 'transaction:', transactionType);
        const response = await fetch(`${BASE_URL}/api/expenses-coa/filter?departmentName=${encodeURIComponent(departmentName)}&menu=Reimbursement&transaction=${encodeURIComponent(transactionType)}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        console.log('API Response:', result);

        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch categories');
        }

        if (!result.data || !Array.isArray(result.data)) {
            throw new Error('Invalid data format from API');
        }

        // Extract unique categories from the response data
        const categories = [...new Set(result.data.map(item => item.category).filter(category => category))];
        allCategories = categories;

        console.log('Fetched categories:', categories);

        // Update all category dropdowns in table rows
        updateAllCategoryDropdowns();

    } catch (error) {
        console.error("Error fetching categories:", error);
        allCategories = [];
        updateAllCategoryDropdowns();
    }
}

// Function to update all category dropdowns
function updateAllCategoryDropdowns() {
    const categorySearchInputs = document.querySelectorAll('.category-search');
    
    categorySearchInputs.forEach(input => {
        if (allCategories.length > 0) {
            input.dataset.categories = JSON.stringify(allCategories);
        }
    });
}

// Function to render revision history
function renderRevisionHistory(revisions) {
    const section = document.getElementById('revisedRemarksSection');
    if (!section) return;

    if (!Array.isArray(revisions) || revisions.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    // Group revisions by stage
    const grouped = {};
    revisions.forEach(rev => {
        if (!grouped[rev.stage]) grouped[rev.stage] = [];
        grouped[rev.stage].push(rev);
    });

    // Build HTML
    let html = '';
    html += `<h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>`;
    html += `<div class="bg-gray-50 p-4 rounded-lg border"><div class="mb-2"><span class="text-sm font-medium text-gray-600">Total Revisions: </span><span id="revisedCount" class="text-sm font-bold text-blue-600">${revisions.length}</span></div></div>`;

    Object.entries(grouped).forEach(([stage, items]) => {
        html += `<div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded"><h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${items.length})</h4></div>`;
        items.forEach((rev, idx) => {
            html += `<div class="mb-3 ml-4"><div class="flex items-start justify-between"><div class="flex-1"><label class="text-sm font-medium text-gray-700">Revision ${idx + 1}:</label><div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${rev.remarks || ''}</div><div class="text-xs text-gray-500 mt-1">Date: ${formatDateToDDMMYYYY(rev.createdAt)} | By: ${rev.revisedByName || ''}</div></div></div></div>`;
        });
    });

    section.innerHTML = html;
}

// Function to display rejection remarks
function displayRejectionRemarks(data) {
    if (data.status !== 'Rejected') {
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        if (rejectionSection) {
            rejectionSection.style.display = 'none';
        }
        return;
    }

    const rejectionSection = document.getElementById('rejectionRemarksSection');
    const rejectionTextarea = document.getElementById('rejectionRemarks');

    if (rejectionSection && rejectionTextarea) {
        let rejectionRemarks = '';

        if (data.remarksRejectByChecker) {
            rejectionRemarks = data.remarksRejectByChecker;
        } else if (data.remarksRejectByAcknowledger) {
            rejectionRemarks = data.remarksRejectByAcknowledger;
        } else if (data.remarksRejectByApprover) {
            rejectionRemarks = data.remarksRejectByApprover;
        } else if (data.remarksRejectByReceiver) {
            rejectionRemarks = data.remarksRejectByReceiver;
        } else if (data.rejectedRemarks) {
            rejectionRemarks = data.rejectedRemarks;
        } else if (data.remarks) {
            rejectionRemarks = data.remarks;
        }

        if (rejectionRemarks.trim() !== '') {
            rejectionSection.style.display = 'block';
            rejectionTextarea.value = rejectionRemarks;
        } else {
            rejectionSection.style.display = 'none';
        }
    }
}

// Helper function to format date as DD/MM/YYYY
function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Function to navigate back to menu
function goToMenuReim() {
    try {
        window.location.href = '../pages/menuReim.html';
    } catch (error) {
        console.error('Error navigating to menu:', error);
        window.location.href = '../pages/approval-dashboard.html';
    }
}

// Error display function
function showError(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            confirmButtonText: 'OK'
        });
    } else {
        alert(message);
    }
}

// Submit reimbursement function
async function submitReimbursement() {
    if (!reimbursementId) {
        showError('Reimbursement ID not found');
        return;
    }

    // Check the status before submitting
    const status = document.getElementById('status')?.value;
    if (status !== 'Draft') {
        showError('You can only submit reimbursements with Draft status');
        return;
    }

    // Show confirmation dialog
    const dialogResult = await Swal.fire({
        title: 'Submit Reimbursement',
        text: 'Are you sure you want to submit this reimbursement? You won\'t be able to edit it after submission.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, submit it!',
        cancelButtonText: 'Cancel'
    });

    if (!dialogResult.isConfirmed) {
        return;
    }

    try {
        // Show loading state
        const submitButton = document.getElementById('submitButton');
        const submitSpinner = document.getElementById('submitSpinner');
        const submitButtonText = document.getElementById('submitButtonText');
        
        submitButton.disabled = true;
        submitSpinner.classList.remove('hidden');
        submitButtonText.textContent = 'Submitting...';

        // No payload needed for this endpoint - it's a simple status change
        console.log('Submitting reimbursement to Prepared status');

        // Make API call to update status using the correct endpoint
        const response = await fetch(`${BASE_URL}/api/reimbursements/prepared/${reimbursementId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${getAccessToken()}`,
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to submit reimbursement. Status: ${response.status}`);
        }

        const apiResult = await response.json();
        
        if (apiResult.status && apiResult.code === 200) {
            Swal.fire({
                title: 'Success!',
                text: 'Reimbursement has been submitted successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                // Redirect to menu page
                goToMenuReim();
            });
        } else {
            throw new Error(apiResult.message || 'Failed to submit reimbursement');
        }

    } catch (error) {
        console.error('Error submitting reimbursement:', error);
        showError(`Failed to submit reimbursement: ${error.message}`);
    } finally {
        // Reset button state
        const submitButton = document.getElementById('submitButton');
        const submitSpinner = document.getElementById('submitSpinner');
        const submitButtonText = document.getElementById('submitButtonText');
        
        submitButton.disabled = false;
        submitSpinner.classList.add('hidden');
        submitButtonText.textContent = 'Submit';
    }
}

// Reject reimbursement function
async function rejectReimbursement() {
    if (!reimbursementId) {
        showError('Reimbursement ID not found');
        return;
    }

    // Check the status before rejecting
    const status = document.getElementById('status')?.value;
    if (status !== 'Draft') {
        showError('You can only reject reimbursements with Draft status');
        return;
    }

    // Show rejection dialog with remarks input
    const dialogResult = await Swal.fire({
        title: 'Reject Reimbursement',
        text: 'Please provide a reason for rejection:',
        input: 'textarea',
        inputPlaceholder: 'Enter rejection reason...',
        inputAttributes: {
            'aria-label': 'Rejection reason'
        },
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
            if (!value || value.trim() === '') {
                return 'You need to provide a rejection reason';
            }
        }
    });

    if (!dialogResult.isConfirmed) {
        return;
    }

    try {
        // Show loading state
        const rejectButton = document.getElementById('rejectButton');
        rejectButton.disabled = true;
        rejectButton.textContent = 'Rejecting...';

        // Prepare payload for rejection
        const payload = {
            status: 'Rejected',
            remarksRejectByChecker: dialogResult.value.trim()
        };

        console.log('Rejecting reimbursement with payload:', payload);

        // Make API call to update status
        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAccessToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to reject reimbursement. Status: ${response.status}`);
        }

        const apiResult = await response.json();
        
        if (apiResult.status && apiResult.code === 200) {
            Swal.fire({
                title: 'Rejected!',
                text: 'Reimbursement has been rejected successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                // Redirect to menu page
                goToMenuReim();
            });
        } else {
            throw new Error(apiResult.message || 'Failed to reject reimbursement');
        }

    } catch (error) {
        console.error('Error rejecting reimbursement:', error);
        showError(`Failed to reject reimbursement: ${error.message}`);
    } finally {
        // Reset button state
        const rejectButton = document.getElementById('rejectButton');
        rejectButton.disabled = false;
        rejectButton.textContent = 'Reject';
    }
}

// Delete reimbursement function
async function deleteReimbursement() {
    if (!reimbursementId) {
        showError('Reimbursement ID not found');
        return;
    }

    // Check the status before deleting
    const status = document.getElementById('status')?.value;
    if (status !== 'Draft') {
        showError('You can only delete reimbursements with Draft status');
        return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
        title: 'Delete Reimbursement',
        text: 'Are you sure you want to delete this reimbursement? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
        return;
    }

    try {
        // Show loading state
        const deleteButton = document.getElementById('deleteButton');
        deleteButton.disabled = true;
        deleteButton.innerHTML = '<svg class="w-5 h-5 inline-block mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>Deleting...';

        // Make API call to delete reimbursement
        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAccessToken()}`,
                'Accept': '*/*'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to delete reimbursement. Status: ${response.status}`);
        }

        const apiResult = await response.json();
        
        if (apiResult.status && apiResult.code === 200) {
            Swal.fire({
                title: 'Deleted!',
                text: 'Reimbursement has been deleted successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                // Redirect to menu page
                goToMenuReim();
            });
        } else {
            throw new Error(apiResult.message || 'Failed to delete reimbursement');
        }

    } catch (error) {
        console.error('Error deleting reimbursement:', error);
        showError(`Failed to delete reimbursement: ${error.message}`);
    } finally {
        // Reset button state
        const deleteButton = document.getElementById('deleteButton');
        deleteButton.disabled = false;
        deleteButton.innerHTML = '<svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>Delete';
    }
}

// Update reimbursement function
async function updateReimbursement() {
    if (!reimbursementId) {
        showError('Reimbursement ID not found');
        return;
    }

    // Check the status before updating
    const status = document.getElementById('status')?.value;
    if (status !== 'Draft') {
        showError('You can only update reimbursements with Draft status');
        return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
        title: 'Update Reimbursement',
        text: 'Are you sure you want to save the changes you made to this reimbursement?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#007bff',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, save changes!',
        cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
        return;
    }

    try {
        // Show loading state
        const updateButton = document.getElementById('updateButton');
        updateButton.disabled = true;
        updateButton.innerHTML = '<svg class="w-5 h-5 inline-block mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>Updating...';

        // Collect all form data
        const payload = {
            voucherNo: document.getElementById('voucherNo')?.value || '',
            requesterName: document.getElementById('requesterNameSearch')?.value || '',
            department: document.getElementById('department')?.value || '',
            currency: document.getElementById('currency')?.value || '',
            payTo: document.getElementById('payToSearch')?.dataset.userId || '',
            referenceDoc: document.getElementById('referenceDoc')?.value || '',
            typeOfTransaction: document.getElementById('typeOfTransaction')?.value || '',
            remarks: document.getElementById('remarks')?.value || '',
            preparedBy: document.getElementById('preparedBySearch')?.dataset.userId || '',
            checkedBy: document.getElementById('checkedBySearch')?.dataset.userId || '',
            acknowledgedBy: document.getElementById('acknowledgeBySearch')?.dataset.userId || '',
            approvedBy: document.getElementById('approvedBySearch')?.dataset.userId || '',
            receivedBy: document.getElementById('receivedBySearch')?.dataset.userId || ''
        };

        // Collect table data
        const tableRows = document.querySelectorAll('#reimbursementDetails tr');
        const tableData = [];
        
        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 5) {
                const detailId = row.dataset.detailId;
                // Amount: clean formatted currency (e.g., 30,000.00) into number
                const amountInputEl = cells[4].querySelector('input');
                const rawAmount = amountInputEl ? amountInputEl.value : cells[4].textContent;
                const cleanedAmount = (rawAmount || '0').toString().replace(/,/g, '').replace(/[^\d.-]/g, '');
                const numericAmount = parseFloat(cleanedAmount) || 0;

                const rowData = {
                    category: cells[0].querySelector('input')?.value || '',
                    accountName: cells[1].querySelector('input')?.value || '',
                    glAccount: cells[2].querySelector('input')?.value || '',
                    description: cells[3].querySelector('input')?.value || '',
                    amount: numericAmount
                };
                
                // Only include ID if it exists (for existing rows)
                if (detailId) {
                    rowData.id = detailId;
                }
                
                tableData.push(rowData);
            }
        });
        
        payload.reimbursementDetails = tableData;

        console.log('Update payload prepared:', payload);

        // Make API call to update reimbursement
        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAccessToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to update reimbursement. Status: ${response.status}`);
        }

        const apiResult = await response.json();
        
        if (apiResult.status && apiResult.code === 200) {
            Swal.fire({
                title: 'Updated!',
                text: 'Reimbursement has been updated successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                // Refresh the page to show updated data
                window.location.reload();
            });
        } else {
            throw new Error(apiResult.message || 'Failed to update reimbursement');
        }

    } catch (error) {
        console.error('Error updating reimbursement:', error);
        showError(`Failed to update reimbursement: ${error.message}`);
    } finally {
        // Reset button state
        const updateButton = document.getElementById('updateButton');
        updateButton.disabled = false;
        updateButton.innerHTML = '<svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>Update';
    }
}

