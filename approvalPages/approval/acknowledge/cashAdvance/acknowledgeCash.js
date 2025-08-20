let uploadedFiles = [];

let caId; // Declare global variable
let currentTab; // Declare global variable for tab

// Function to get available categories based on department and transaction type from API
async function getAvailableCategories(departmentId, transactionType) {
    if (!departmentId || !transactionType) return [];
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/categories?departmentId=${departmentId}&menu=Cash Advance&transactionType=${transactionType}`);
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        return data.data || data; // Handle both wrapped and direct array responses
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

// Function to get available account names based on category, department, and transaction type from API
async function getAvailableAccountNames(category, departmentId, transactionType) {
    if (!category || !departmentId || !transactionType) return [];
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/account-names?category=${encodeURIComponent(category)}&departmentId=${departmentId}&menu=Cash Advance&transactionType=${transactionType}`);
        if (!response.ok) {
            throw new Error('Failed to fetch account names');
        }
        const data = await response.json();
        return data.data || data; // Handle both wrapped and direct array responses
    } catch (error) {
        console.error('Error fetching account names:', error);
        return [];
    }
}

// Function to get COA based on category, account name, department, and transaction type from API
async function getCOA(category, accountName, departmentId, transactionType) {
    if (!category || !accountName || !departmentId || !transactionType) return '';
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/coa?category=${encodeURIComponent(category)}&accountName=${encodeURIComponent(accountName)}&departmentId=${departmentId}&menu=Cash Advance&transactionType=${transactionType}`);
        if (!response.ok) {
            throw new Error('Failed to fetch COA');
        }
        const data = await response.json();
        return data.data?.coa || data.coa || ''; // Handle different response structures
    } catch (error) {
        console.error('Error fetching COA:', error);
        return '';
    }
}

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    caId = urlParams.get('ca-id');
    currentTab = urlParams.get('tab');
    if (caId) fetchCADetails(caId);
    if (currentTab === 'acknowledged' || currentTab === 'rejected') hideApprovalButtons();
    if (currentTab === 'acknowledged' || currentTab === 'rejected') hideRevisionButton();
};

function fetchCADetails(caId) {
    fetch(`${BASE_URL}/api/cash-advance/${caId}`)
        .then(response => response.ok ? response.json() : response.json().then(e => { throw new Error(e.message || `HTTP error! Status: ${response.status}`); }))
        .then(response => { if (response.data) populateCADetails(response.data); })
        .catch(error => { console.error('Error:', error); alert('Error fetching CA details: ' + error.message); });
}

function populateCADetails(data) {
    document.getElementById('invno').value = data.cashAdvanceNo;
    document.getElementById('Employee').value = data.employeeNIK || '';
    document.getElementById('EmployeeName').value = data.employeeName || '';
    document.getElementById('requester').value = data.requesterName;
    document.getElementById('purposed').value = data.purpose;
    document.getElementById('paidTo').value = data.payToName || data.payToBusinessPartnerName || '';
    document.getElementById('postingDate').value = data.submissionDate ? data.submissionDate.split('T')[0] : '';
    document.getElementById('remarks').value = data.remarks || '';
    document.getElementById('Currency').value = data.currency || '';
    const transactionTypeSelect = document.getElementById('typeTransaction');
    if (data.transactionType && transactionTypeSelect) {
        transactionTypeSelect.innerHTML = '';
        const option = document.createElement('option');
        option.value = data.transactionType;
        option.textContent = data.transactionType;
        option.selected = true;
        transactionTypeSelect.appendChild(option);
        if (typeof toggleClosedBy === 'function') toggleClosedBy();
    }
    const departmentSelect = document.getElementById('department');
    if (data.departmentName && departmentSelect) {
        departmentSelect.innerHTML = '';
        const option = document.createElement('option');
        option.value = data.departmentName;
        option.textContent = data.departmentName;
        option.selected = true;
        departmentSelect.appendChild(option);
    }
    if (data && data.status) {
        const statusSelect = document.getElementById('docStatus');
        if (statusSelect) {
            statusSelect.innerHTML = '';
            const option = document.createElement('option');
            option.value = data.status;
            option.textContent = data.status;
            option.selected = true;
            statusSelect.appendChild(option);
        }
    }
    if (data.cashAdvanceDetails) populateCashAdvanceDetails(data.cashAdvanceDetails);
    if (data.attachments) displayAttachments(data.attachments);
    else displayAttachments([]);
    displayRevisedRemarks(data);
    makeAllFieldsReadOnly();
    const approvalMap = [
      { id: 'preparedBySearch', value: data.preparedName },
      { id: 'checkedBySearch', value: data.checkedName },
      { id: 'acknowledgedBySearch', value: data.acknowledgedName },
      { id: 'approvedBySearch', value: data.approvedName },
      { id: 'receivedBySearch', value: data.receivedName },
      { id: 'closedBySearch', value: data.closedName }
    ];
    approvalMap.forEach(f => {
      const el = document.getElementById(f.id);
      if (el) {
        el.value = f.value || '';
        el.readOnly = true;
        el.classList.add('bg-gray-100');
      }
    });
}

function populateCashAdvanceDetails(details) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (details.length === 0) {
        return;
    }
    
    console.log('Cash advance details:', details);
    
    details.forEach(detail => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border">
                <input type="text" value="${detail.category || ''}" class="category-input w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" value="${detail.accountName || ''}" class="account-name w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" value="${detail.coa || ''}" class="coa w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" value="${detail.description || ''}" class="w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="number" value="${detail.amount ? parseFloat(detail.amount).toFixed(2) : '0.00'}" class="total w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border text-center">
                <!-- Read-only view, no action buttons -->
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Calculate total amount after populating all rows
    calculateTotalAmount();
}

// Function to calculate total amount from all rows
function calculateTotalAmount() {
    const totalInputs = document.querySelectorAll('.total');
    let sum = 0;
    
    totalInputs.forEach(input => {
        // Only add to sum if the input has a valid numeric value
        const value = input.value.trim();
        if (value && !isNaN(parseFloat(value))) {
            sum += parseFloat(value);
        }
    });
    
    // Format the sum with 2 decimal places
    const formattedSum = sum.toFixed(2);
    
    // Update the total amount display
    const totalAmountDisplay = document.getElementById('totalAmountDisplay');
    if (totalAmountDisplay) {
        totalAmountDisplay.textContent = formattedSum;
    }
}

// Function to fetch all dropdown options
function fetchDropdownOptions(caData = null) {
    // This function is no longer needed
}

// Function to approve CA (acknowledge)
function approveCash() {
    Swal.fire({
        title: 'Confirm Acknowledgment',
        text: 'Are you sure you want to acknowledge this Cash Advance?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Acknowledge',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateCAStatus('approve');
        }
    });
}

// Function to reject CA
function rejectCash() {
    Swal.fire({
        title: 'Confirm Rejection',
        text: 'Are you sure you want to reject this Cash Advance?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Reject',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Rejection Remarks',
                html: `
                    <div class="text-left">
                        <div class="font-semibold">Rejection Remarks</div>
                        <div class="text-sm text-gray-600 mb-2">Please provide remarks for rejection:</div>
                        <textarea id="rejectionTextarea" class="swal2-textarea" style="height: 150px;"></textarea>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Submit Rejection',
                cancelButtonText: 'Cancel',
                didOpen: () => {
                    const textarea = document.getElementById('rejectionTextarea');
                    const userInfo = getUserInfo();
                    const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
                    textarea.value = prefix;
                    textarea.dataset.prefixLength = String(prefix.length);
                    textarea.setSelectionRange(prefix.length, prefix.length);
                    textarea.focus();

                    const enforcePrefix = (el) => {
                        const expectedPrefix = `[${userInfo.name} - ${userInfo.role}]: `;
                        const prefixLength = parseInt(el.dataset.prefixLength || '0');
                        if (!el.value.startsWith(expectedPrefix)) {
                            const userText = el.value.slice(prefixLength);
                            el.value = expectedPrefix + userText;
                        }
                        if (el.selectionStart < prefixLength) {
                            el.setSelectionRange(prefixLength, prefixLength);
                        }
                    };

                    textarea.addEventListener('input', (e) => enforcePrefix(e.target));
                    textarea.addEventListener('keydown', (e) => {
                        const el = e.target;
                        const prefixLength = parseInt(el.dataset.prefixLength || '0');
                        if ((e.key === 'Backspace' && el.selectionStart <= prefixLength) ||
                            (e.key === 'ArrowLeft' && el.selectionStart <= prefixLength)) {
                            e.preventDefault();
                            el.setSelectionRange(prefixLength, prefixLength);
                        }
                    });
                },
                preConfirm: () => {
                    const el = document.getElementById('rejectionTextarea');
                    const prefixLength = parseInt(el.dataset.prefixLength || '0');
                    if (!el.value || el.value.trim().length <= prefixLength) {
                        Swal.showValidationMessage('Remarks are required for rejection');
                        return false;
                    }
                    return el.value;
                }
            }).then((remarksResult) => {
                if (remarksResult.isConfirmed) {
                    updateCAStatusWithRemarks('reject', remarksResult.value);
                }
            });
        }
    });
}

// Function to approve or reject the CA
function updateCAStatus(status) {
    if (!caId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'CA ID not found'
        });
        return;
    }

    const userId = getUserId();
    if (!userId) {
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'Unable to get user ID from token. Please login again.'
        });
        return;
    }

    const requestData = {
        id: caId,
        UserId: userId,
        StatusAt: "Acknowledge",
        Action: status,
        Remarks: ''
    };

    // Show loading
    Swal.fire({
        title: `${status === 'approve' ? 'Acknowledging' : 'Processing'}...`,
        text: 'Please wait while we process your request.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    fetch(`${BASE_URL}/api/cash-advance/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: `CA ${status === 'approve' ? 'acknowledged' : 'rejected'} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                window.location.href = '../../../dashboard/dashboardAcknowledge/cashAdvance/menuCashAcknow.html';
            });
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to ${status} CA. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error ${status === 'approve' ? 'acknowledging' : 'rejecting'} CA: ` + error.message
        });
    });
}

// Function to approve or reject the CA with remarks
function updateCAStatusWithRemarks(status, remarks) {
    if (!caId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'CA ID not found'
        });
        return;
    }

    const userId = getUserId();
    if (!userId) {
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'Unable to get user ID from token. Please login again.'
        });
        return;
    }

    const requestData = {
        id: caId,
        UserId: userId,
        StatusAt: "Acknowledge",
        Action: status,
        Remarks: remarks || ''
    };

    // Show loading
    Swal.fire({
        title: status === 'revise' ? 'Submitting Revision...' : (status === 'approve' ? 'Approving...' : 'Rejecting...'),
        text: 'Please wait while we process your request.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    fetch(`${BASE_URL}/api/cash-advance/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: status === 'revise'
                    ? 'Revision submitted successfully'
                    : `CA ${status === 'approve' ? 'approved' : 'rejected'} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                window.location.href = '../../../dashboard/dashboardAcknowledge/cashAdvance/menuCashAcknow.html';
            });
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to ${status} CA. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        let errorAction = 'processing';
        if (status === 'approve') errorAction = 'approving';
        else if (status === 'reject') errorAction = 'rejecting';
        else if (status === 'revise') errorAction = 'submitting revision for';
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error ${errorAction} CA: ` + error.message
        });
    });
}


// Function for Back button navigation
function goToMenuAcknowCash() {
    window.location.href = "../../../dashboard/dashboardAcknowledge/cashAdvance/menuCashAcknow.html";
}

// Initialize total amount calculation when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Calculate initial total
    calculateTotalAmount();
});

function previewPDF(event) {
    const files = event.target.files;
    if (files.length + uploadedFiles.length > 5) {
        alert('Maximum 5 PDF files are allowed.');
        return;
    }
    Array.from(files).forEach(file => {
        if (file.type === 'application/pdf') {
            uploadedFiles.push(file);
        } else {
            alert('Please upload a valid PDF file');
        }
    });
    
    // Show file names instead of calling displayFileList
    const fileInput = document.getElementById('Reference');
    let fileNames = Array.from(files).map(file => file.name).join(', ');
    if (fileNames) {
        fileInput.title = fileNames;
    }
}

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" class="category-input w-full bg-gray-100" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" class="account-name w-full bg-gray-100" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" class="coa w-full bg-gray-100" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" required />
        </td>
        <td class="p-2 border">
            <input type="number" maxlength="10" class="w-full" required />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;

    tableBody.appendChild(newRow);
}

function deleteRow(button) {
    button.closest("tr").remove();
}

function makeAllFieldsReadOnly() {
    document.querySelectorAll('input, textarea, select').forEach(el => {
        if (!el.classList.contains('action-btn')) {
            el.readOnly = true;
            el.disabled = true;
            el.classList.add('bg-gray-100');
        }
    });
}

// Function to hide approval buttons
function hideApprovalButtons() {
    const approveButton = document.querySelector('button[onclick="approveCash()"]');
    const rejectButton = document.querySelector('button[onclick="rejectCash()"]');
    
    if (approveButton) {
        approveButton.style.display = 'none';
    }
    if (rejectButton) {
        rejectButton.style.display = 'none';
    }
    
    // Also hide any parent container if needed
    const buttonContainer = document.querySelector('.approval-buttons, .button-container');
    if (buttonContainer && currentTab !== 'prepared') {
        buttonContainer.style.display = 'none';
    }
}

// Function to hide revision button
function hideRevisionButton() {
    const revisionButton = document.querySelector('button[onclick="submitRevision()"]');
    const revisionBtn = document.getElementById('revisionBtn');
    
    if (revisionButton) {
        revisionButton.style.display = 'none';
    }
    if (revisionBtn) {
        revisionBtn.style.display = 'none';
    }
}

// Function to display attachments (similar to detail pages)
function displayAttachments(attachments) {
    console.log('displayAttachments called with:', attachments);
    const attachmentsList = document.getElementById('attachmentsList');
    if (!attachmentsList) {
        console.error('attachmentsList element not found');
        return;
    }
    
    attachmentsList.innerHTML = ''; // Clear existing attachments
    
    if (attachments && attachments.length > 0) {
        attachments.forEach(attachment => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'flex justify-between items-center py-1 border-b last:border-b-0';
            
            attachmentItem.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-sm text-gray-700">${attachment.fileName}</span>
                </div>
                <a href="${attachment.fileUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm">
                    View
                </a>
            `;
            
            attachmentsList.appendChild(attachmentItem);
        });
    } else {
        attachmentsList.innerHTML = '<p class="text-gray-500 text-sm">No attachments available</p>';
    }
}

// Function to submit revision with multiple fields
function submitRevision() {
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    
    // Check if revision button is disabled
    if (document.getElementById('revisionBtn').disabled) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Silakan tambahkan dan isi field revision terlebih dahulu'
        });
        return;
    }
    
    let allRemarks = '';
    
    revisionFields.forEach((field, index) => {
        // Include the entire content including the prefix
        if (field.value.trim() !== '') {
            if (allRemarks !== '') allRemarks += '\n\n';
            allRemarks += field.value.trim();
        }
    });
    
    if (revisionFields.length === 0 || allRemarks.trim() === '') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Silakan tambahkan dan isi field revision terlebih dahulu'
        });
        return;
    }

    if (!caId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'CA ID not found'
        });
        return;
    }

    const userId = getUserId();
    if (!userId) {
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'Unable to get user ID from token. Please login again.'
        });
        return;
    }

    // Show confirmation dialog
    Swal.fire({
        title: 'Submit Revision',
        text: 'Are you sure you want to submit this revision request?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Submit Revision',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateCAStatusWithRemarks('revise', allRemarks);
        }
    });
}

// Function to toggle revision field visibility and add first field
function toggleRevisionField() {
    const container = document.getElementById('revisionContainer');
    const addBtn = document.getElementById('addRevisionBtn');
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    
    // Check if maximum limit is reached
    if (revisionFields.length >= 4) {
        Swal.fire({
            icon: 'warning',
            title: 'Batas Maksimal',
            text: 'Maksimal hanya 4 revision field yang diperbolehkan'
        });
        return;
    }
    
    // Check if current user already has a revision field
    if (hasUserAlreadyAddedRevision()) {
        Swal.fire({
            icon: 'warning',
            title: 'Sudah Ada Revision',
            text: 'Anda sudah menambahkan revision. Setiap user hanya diperbolehkan menambahkan satu revision.'
        });
        return;
    }
    
    if (container.classList.contains('hidden')) {
        // Show container and add first field
        container.classList.remove('hidden');
        addRevisionField();
        updateAddButton();
    } else {
        // Add another field
        addRevisionField();
        updateAddButton();
    }
}

// Function to add revision field
function addRevisionField() {
    const container = document.getElementById('revisionContainer');
    
    // Create wrapper div for the textarea and delete button
    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = 'flex items-center space-x-2 mt-2';
    
    // Create textarea
    const newField = document.createElement('textarea');
    newField.className = 'w-full p-2 border rounded-md';
    newField.placeholder = 'Enter additional revision details';
    
    // Add event listener for input to handle protected prefix
    newField.addEventListener('input', handleRevisionInput);
    
    // Initialize with user prefix
    initializeWithUserPrefix(newField);
    
    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '&times;'; // × symbol
    deleteButton.className = 'bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 focus:outline-none';
    deleteButton.title = 'Hapus field revision ini';
    deleteButton.onclick = function() {
        // Check if user can delete this field (only allow deleting own field)
        const userInfo = getUserInfo();
        const userPrefix = `[${userInfo.name} - ${userInfo.role}]: `;
        
        if (!newField.value.startsWith(userPrefix)) {
            Swal.fire({
                icon: 'error',
                title: 'Tidak Diizinkan',
                text: 'Anda hanya bisa menghapus revision field yang Anda buat sendiri'
            });
            return;
        }
        
        fieldWrapper.remove();
        checkRevisionButton(); // Update button state after removing a field
        checkRevisionContainer(); // Check if container should be hidden
    };
    
    // Add textarea and delete button to wrapper
    fieldWrapper.appendChild(newField);
    fieldWrapper.appendChild(deleteButton);
    
    // Add wrapper to container
    container.appendChild(fieldWrapper);
    
    // Update the revision button state
    checkRevisionButton();
    updateAddButton();
}

// Check if revision container should be hidden when all fields are removed
function checkRevisionContainer() {
    const container = document.getElementById('revisionContainer');
    const addBtn = document.getElementById('addRevisionBtn');
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    
    if (revisionFields.length === 0) {
        container.classList.add('hidden');
        addBtn.textContent = '+ Add revision';
        addBtn.style.display = 'block';
    } else {
        updateAddButton();
    }
}

// Check if current user already has a revision field
function hasUserAlreadyAddedRevision() {
    const userInfo = getUserInfo();
    const userPrefix = `[${userInfo.name} - ${userInfo.role}]: `;
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    
    for (let field of revisionFields) {
        if (field.value.startsWith(userPrefix)) {
            return true;
        }
    }
    return false;
}

// Update add button based on current state
function updateAddButton() {
    const addBtn = document.getElementById('addRevisionBtn');
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    const hasUserRevision = hasUserAlreadyAddedRevision();
    
    if (revisionFields.length >= 4) {
        // Maximum limit reached
        addBtn.textContent = 'Maksimal 4 revision tercapai';
        addBtn.style.display = 'none';
    } else if (hasUserRevision) {
        // User already has a revision
        addBtn.textContent = 'Anda sudah menambahkan revision';
        addBtn.style.display = 'none';
    } else {
        // User can still add revision
        if (revisionFields.length === 0) {
            addBtn.textContent = '+ Add revision';
        } else {
            addBtn.textContent = '+ Add more revision';
        }
        addBtn.style.display = 'block';
    }
}

// Function to get current user information
function getUserInfo() {
    // Use functions from auth.js to get user information
    let userName = 'Unknown User';
    let userRole = 'Acknowledger'; // Default role for this page since we're on the acknowledger page
    
    try {
        // Get user info from getCurrentUser function in auth.js
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.username) {
            userName = currentUser.username;
        }
        
        // Get user role based on the current page
        // Since we're on the acknowledger page, the role is Acknowledger
    } catch (e) {
        console.error('Error getting user info:', e);
    }
    
    return { name: userName, role: userRole };
}

// Function to initialize textarea with user prefix
function initializeWithUserPrefix(textarea) {
    const userInfo = getUserInfo();
    const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
    textarea.value = prefix;
    
    // Store the prefix length as a data attribute
    textarea.dataset.prefixLength = prefix.length;
    
    // Set selection range after the prefix
    textarea.setSelectionRange(prefix.length, prefix.length);
    textarea.focus();
}

// Function to handle input and protect the prefix
function handleRevisionInput(event) {
    const textarea = event.target;
    const prefixLength = parseInt(textarea.dataset.prefixLength || '0');
    
    // If user tries to modify content before the prefix length
    if (textarea.selectionStart < prefixLength || textarea.selectionEnd < prefixLength) {
        // Restore the prefix
        const userInfo = getUserInfo();
        const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
        
        // Only restore if the prefix is damaged
        if (!textarea.value.startsWith(prefix)) {
            const userText = textarea.value.substring(prefixLength);
            textarea.value = prefix + userText;
            
            // Reset cursor position after the prefix
            textarea.setSelectionRange(prefixLength, prefixLength);
        } else {
            // Just move cursor after prefix
            textarea.setSelectionRange(prefixLength, prefixLength);
        }
    }
    
    // Update revision button state
    checkRevisionButton();
}

// Check if revision remarks are filled to enable/disable revision button
function checkRevisionButton() {
    const revisionButton = document.getElementById('revisionBtn');
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    
    let hasContent = false;
    
    // Check if there are any revision fields and if they have content
    if (revisionFields.length > 0) {
        revisionFields.forEach(field => {
            const prefixLength = parseInt(field.dataset.prefixLength || '0');
            // Check if there's content beyond the prefix
            if (field.value.trim().length > prefixLength) {
                hasContent = true;
            }
        });
    }
    
    if (hasContent) {
        revisionButton.classList.remove('opacity-50', 'cursor-not-allowed');
        revisionButton.disabled = false;
    } else {
        revisionButton.classList.add('opacity-50', 'cursor-not-allowed');
        revisionButton.disabled = true;
    }
}

// Function to display revised remarks from API
function displayRevisedRemarks(data) {
    const revisedRemarksSection = document.getElementById('revisedRemarksSection');
    const revisedCountElement = document.getElementById('revisedCount');
    
    // Check if there are any revisions
    const hasRevisions = data.revisions && data.revisions.length > 0;
    
    if (hasRevisions) {
        revisedRemarksSection.style.display = 'block';
        
        // Clear existing revision content from the revisedRemarksSection
        revisedRemarksSection.innerHTML = `
            <h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>
            <div class="bg-gray-50 p-4 rounded-lg border">
                <div class="mb-2">
                    <span class="text-sm font-medium text-gray-600">Total Revisions: </span>
                    <span id="revisedCount" class="text-sm font-bold text-blue-600">${data.revisions.length}</span>
                </div>
                <!-- Dynamic revision content will be inserted here by JavaScript -->
            </div>
        `;
        
        // Group revisions by stage
        const revisionsByStage = {};
        data.revisions.forEach(revision => {
            // Map enum values to display names
            let stageName = 'Unknown';
            if (revision.stage === 'Checked' || revision.stage === 1) {
                stageName = 'Checked';
            } else if (revision.stage === 'Acknowledged' || revision.stage === 2) {
                stageName = 'Acknowledged';
            } else if (revision.stage === 'Approved' || revision.stage === 3) {
                stageName = 'Approved';
            } else if (revision.stage === 'Received' || revision.stage === 4) {
                stageName = 'Received';
            }
            
            if (!revisionsByStage[stageName]) {
                revisionsByStage[stageName] = [];
            }
            revisionsByStage[stageName].push(revision);
        });
        
        // Display revisions grouped by stage
        Object.keys(revisionsByStage).forEach(stage => {
            const stageRevisions = revisionsByStage[stage];
            
            // Create stage header
            const stageHeader = document.createElement('div');
            stageHeader.className = 'mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded';
            stageHeader.innerHTML = `
                <h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${stageRevisions.length})</h4>
            `;
            revisedRemarksSection.appendChild(stageHeader);
            
            // Display each revision in this stage
            stageRevisions.forEach((revision, index) => {
                const revisionContainer = document.createElement('div');
                revisionContainer.className = 'mb-3 ml-4';
                revisionContainer.innerHTML = `
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <label class="text-sm font-medium text-gray-700">Revision ${index + 1}:</label>
                            <div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${revision.remarks || ''}</div>
                            <div class="text-xs text-gray-500 mt-1">
                                Date: ${revision.revisionDate ? new Date(revision.revisionDate).toLocaleDateString() : 'N/A'}
                                ${revision.revisedByName ? ` | By: ${revision.revisedByName}` : ''}
                            </div>
                        </div>
                    </div>
                `;
                revisedRemarksSection.appendChild(revisionContainer);
            });
        });
    } else {
        revisedRemarksSection.style.display = 'none';
    }
}

