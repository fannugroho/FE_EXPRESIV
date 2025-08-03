// Global variables for data storage
let reimbursementId = '';
let allCategories = [];
let allAccountNames = [];
let transactionTypes = [];
let businessPartners = [];

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
    const reimbursementId = getReimbursementIdFromUrl();
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
    document.getElementById('requesterNameSearch').value = data.requesterName || '';
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
        document.getElementById('payToSearch').value = displayText;
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
            row.innerHTML = `
                <td class="p-2 border">${detail.category || ''}</td>
                <td class="p-2 border">${detail.accountName || ''}</td>
                <td class="p-2 border">${detail.glAccount || ''}</td>
                <td class="p-2 border">${detail.description || ''}</td>
                <td class="p-2 border text-right">${formatCurrencyIDR(detail.amount) || '0.00'}</td>
            `;
            tableBody.appendChild(row);
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
        const amountText = cell.textContent.trim();
        const numericValue = parseFloat(amountText.replace(/[^\d.-]/g, '')) || 0;
        console.log(`Row ${index + 1} amount: ${amountText} -> ${numericValue}`);
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

        attachments.forEach(attachment => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';

            attachmentItem.innerHTML = `
                <span>${attachment.fileName}</span>
                <div>
                    <a href="${BASE_URL}/${attachment.filePath}" target="_blank" class="text-blue-500 hover:text-blue-700">View</a>
                </div>
            `;

            attachmentsList.appendChild(attachmentItem);
        });
    } else {
        console.log('No attachments to display');
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

    // Hide file input
    const fileInput = document.getElementById('filePath');
    if (fileInput) {
        fileInput.style.display = 'none';
    }

    // Hide file input label
    const fileInputLabel = fileInput ? fileInput.previousElementSibling : null;
    if (fileInputLabel && fileInputLabel.tagName === 'H3') {
        fileInputLabel.style.display = 'none';
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
        window.allUsers = users;
        console.log('✅ Stored', users.length, 'users in global cache');

        // Log sample users for debugging
        console.log('👥 Sample users data:', users.slice(0, 3).map(user => ({
            id: user.id,
            idType: typeof user.id,
            idString: user.id.toString(),
            username: user.username,
            fullName: user.fullName,
            employeeId: user.employeeId,
            kansaiEmployeeId: user.kansaiEmployeeId
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

