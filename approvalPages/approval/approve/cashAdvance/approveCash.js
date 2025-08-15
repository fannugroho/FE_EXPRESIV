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
    if (currentTab === 'approved' || currentTab === 'rejected') hideApprovalButtons();
    if (currentTab === 'approved' || currentTab === 'rejected') hideRevisionButton();
    // Apply tab-based behavior for field editability and button visibility
    applyTabBasedBehavior();
};

async function fetchCADetails(caId) {
    try {
        const response = await fetch(`${BASE_URL}/api/cash-advance/${caId}`);
        const result = response.ok ? await response.json() : await response.json().then(e => { throw new Error(e.message || `HTTP error! Status: ${response.status}`); });
        if (result.data) {
            await populateCADetails(result.data);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error fetching CA details: ' + error.message);
    }
}

async function populateCADetails(data) {
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
    if (data && data.status) {
        // Populate approval fields from detail data
        await populateApprovalFieldsFromDetail(data);
    }
    if (data && data.cashAdvanceDetails && data.cashAdvanceDetails.length > 0) {
        populateCashAdvanceDetails(data.cashAdvanceDetails);
    }
    if (data && data.attachments && data.attachments.length > 0) {
        displayAttachments(data.attachments);
    }
    if (data && data.revisions && data.revisions.length > 0) {
        displayRevisedRemarks(data);
    }
    makeAllFieldsReadOnly();
    
    // Populate approval fields in readonly mode
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
    
    // Apply tab-based behavior after populating data
    applyTabBasedBehavior();
}

// Helper function to fetch user name by ID
async function fetchUserNameById(userId) {
    if (!userId) return null;
    
    try {
        // First try to get from cached users
        if (window.requesters && window.requesters.length > 0) {
            const user = window.requesters.find(u => u.id === userId);
            if (user && user.fullName) {
                console.log(`Found full name in cache for ${userId}: ${user.fullName}`);
                return user.fullName;
            }
        }
        
        // If not in cache, fetch from API
        const response = await fetch(`${BASE_URL}/api/users/${userId}`);
        if (response.ok) {
            const result = await response.json();
            if (result.status && result.data && result.data.fullName) {
                console.log(`Fetched full name from API for ${userId}: ${result.data.fullName}`);
                return result.data.fullName;
            }
        }
    } catch (error) {
        console.warn(`Failed to fetch full name for user ${userId}:`, error);
    }
    
    return null;
}

// Function to populate approval fields from detail data
async function populateApprovalFieldsFromDetail(data) {
    // Populate approval fields with data from the detail response
    if (data.preparedById) {
        const preparedField = document.getElementById('prepared');
        if (preparedField) {
            const fullName = await fetchUserNameById(data.preparedById);
            const displayName = fullName || data.preparedName || '';
            
            preparedField.innerHTML = '';
            const option = document.createElement('option');
            option.value = data.preparedById || '';
            option.textContent = displayName;
            option.selected = true;
            preparedField.appendChild(option);
            preparedField.disabled = true;
        }
    }
    
    if (data.checkedById) {
        const checkedField = document.getElementById('Checked');
        if (checkedField) {
            const fullName = await fetchUserNameById(data.checkedById);
            const displayName = fullName || data.checkedName || '';
            
            checkedField.innerHTML = '';
            const option = document.createElement('option');
            option.value = data.checkedById || '';
            option.textContent = displayName;
            option.selected = true;
            checkedField.appendChild(option);
            checkedField.disabled = true;
        }
    }
    
    if (data.acknowledgedById) {
        const acknowledgedField = document.getElementById('Acknowledged');
        if (acknowledgedField) {
            const fullName = await fetchUserNameById(data.acknowledgedById);
            const displayName = fullName || data.acknowledgedName || '';
            
            acknowledgedField.innerHTML = '';
            const option = document.createElement('option');
            option.value = data.acknowledgedById || '';
            option.textContent = displayName;
            option.selected = true;
            acknowledgedField.appendChild(option);
            acknowledgedField.disabled = true;
        }
    }
    
    if (data.approvedById) {
        const approvedField = document.getElementById('Approved');
        if (approvedField) {
            const fullName = await fetchUserNameById(data.approvedById);
            const displayName = fullName || data.approvedName || '';
            
            approvedField.innerHTML = '';
            const option = document.createElement('option');
            option.value = data.approvedById || '';
            option.textContent = displayName;
            option.selected = true;
            approvedField.appendChild(option);
            approvedField.disabled = true;
        }
    }
    
    if (data.receivedById) {
        const receivedField = document.getElementById('Received');
        if (receivedField) {
            const fullName = await fetchUserNameById(data.receivedById);
            const displayName = fullName || data.receivedName || '';
            
            receivedField.innerHTML = '';
            const option = document.createElement('option');
            option.value = data.receivedById || '';
            option.textContent = displayName;
            option.selected = true;
            receivedField.appendChild(option);
            receivedField.disabled = true;
        }
    }
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
                <input type="text" value="${detail.description || ''}" class="description w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="number" value="${detail.amount ? parseFloat(detail.amount).toFixed(2) : '0.00'}" class="total w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border text-center">
                <!-- Read-only view, no action buttons -->
                <span class="text-gray-400">View Only</span>
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

// Function to toggle closedBy visibility based on transaction type
function toggleClosedBy() {
    const transactionType = document.getElementById('typeTransaction').value;
    const closedBySection = document.getElementById('closedBySection');
    
    if (transactionType === 'Personal Loan') {
        closedBySection.style.display = 'block';
    } else {
        closedBySection.style.display = 'none';
    }
}

// Function to fetch all dropdown options
function fetchDropdownOptions(caData = null) {
    // Removed as per edit hint
}

// Function to filter users for the search dropdown in approval section
function filterUsers(fieldId) {
    // Removed as per edit hint
}

// Function to populate user select dropdowns
function populateUserSelects(users, caData = null) {
    // Removed as per edit hint
}

// Function to approve CA
function approveCash() {
    Swal.fire({
        title: 'Confirm Approval',
        text: 'Are you sure you want to approve this Cash Advance?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Approve',
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
            // Ask for rejection remarks
            Swal.fire({
                title: 'Rejection Remarks',
                text: 'Please provide remarks for rejection:',
                input: 'textarea',
                inputPlaceholder: 'Enter your remarks here...',
                inputValidator: (value) => {
                    if (!value || value.trim() === '') {
                        return 'Remarks are required for rejection';
                    }
                },
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Submit Rejection',
                cancelButtonText: 'Cancel'
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
        StatusAt: "Approve",
        Action: status,
        Remarks: ''
    };

    // Show loading
    Swal.fire({
        title: `${status === 'approve' ? 'Approving' : 'Processing'}...`,
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
                text: `CA ${status === 'approve' ? 'approved' : 'rejected'} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                window.location.href = '../../../dashboard/dashboardApprove/cashAdvance/menuCashApprove.html';
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
            text: `Error ${status === 'approve' ? 'approving' : 'rejecting'} CA: ` + error.message
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
        StatusAt: "Approve",
        Action: status,
        Remarks: remarks || ''
    };

    // Show loading
    Swal.fire({
        title: `${status === 'approve' ? 'Approving' : 'Rejecting'}...`,
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
            console.log('status', status);
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
                window.location.href = '../../../dashboard/dashboardApprove/cashAdvance/menuCashApprove.html';
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

function goToMenuCash() {
    window.location.href = "../../../dashboard/dashboardApprove/cashAdvance/menuCashApprove.html";
}

function goToMenuApprovCash() {
    window.location.href = "../../../dashboard/dashboardApprove/cashAdvance/menuCashApprove.html";
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
    if (buttonContainer && currentTab !== 'acknowledge') {
        buttonContainer.style.display = 'none';
    }
}

// Function to hide revision button
function hideRevisionButton() {
    const revisionButton = document.querySelector('button[onclick="revisionCash()"]');
    const revisionBtn = document.getElementById('revisionBtn');
    const addRevisionBtn = document.getElementById('addRevisionBtn');
    const revisionContainer = document.getElementById('revisionContainer');
    const revisionLabel = document.getElementById('revisionLabel');
    
    if (revisionButton) {
        revisionButton.style.display = 'none';
    }
    if (revisionBtn) {
        revisionBtn.style.display = 'none';
    }
    if (addRevisionBtn) {
        addRevisionBtn.style.display = 'none';
    }
    if (revisionContainer) {
        revisionContainer.style.display = 'none';
    }
    if (revisionLabel) {
        revisionLabel.style.display = 'none';
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
            attachmentItem.className = 'flex items-center justify-between p-2 bg-white border rounded mb-2 hover:bg-gray-50';
            attachmentItem.innerHTML = `
                <div class="flex items-center">
                    <span class="text-blue-600 mr-2">📄</span>
                    <span class="text-sm font-medium">${attachment.fileName}</span>
                </div>
                <a href="${attachment.fileUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm font-semibold px-3 py-1 border border-blue-500 rounded hover:bg-blue-50 transition">
                    View
                </a>
            `;
            attachmentsList.appendChild(attachmentItem);
        });
    } else {
        attachmentsList.innerHTML = '<p class="text-gray-500 text-sm text-center py-2">No attachments found</p>';
    }
}

// Function to print cash advance
function printCash() {
    // Get cash advance ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const caId = urlParams.get('ca-id');
    
    if (!caId) {
        alert('No cash advance ID found');
        return;
    }
    
    // Open the print page in a new window/tab
    window.open(`printCashAdv.html?ca-id=${caId}`, '_blank');
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

// Function to handle revision for Cash Advance
function revisionCash() {
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    let allRemarks = '';
    revisionFields.forEach((field, index) => {
        if (field.value.trim() !== '') {
            if (allRemarks !== '') allRemarks += '\n\n';
            allRemarks += field.value.trim();
        }
    });
    if (revisionFields.length === 0 || allRemarks.trim() === '') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please add and fill revision field first'
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

// Function to apply tab-based behavior for field editability and button visibility
function applyTabBasedBehavior() {
    if (currentTab === 'approved' || currentTab === 'rejected') {
        // For approved/rejected tabs, make all fields read-only and hide action buttons
        makeAllFieldsReadOnly();
        hideApprovalButtons();
        hideRevisionButton();
    } else {
        // For other tabs (like 'approve'), make fields read-only but show action buttons
        makeAllFieldsReadOnly();
        showApprovalButtons();
        showRevisionButton();
    }
}

// Function to show approval buttons
function showApprovalButtons() {
    const approveButton = document.querySelector('button[onclick="approveCash()"]');
    const rejectButton = document.querySelector('button[onclick="rejectCash()"]');
    
    if (approveButton) {
        approveButton.style.display = 'inline-block';
    }
    if (rejectButton) {
        rejectButton.style.display = 'inline-block';
    }
    
    // Show button container if it exists
    const buttonContainer = document.querySelector('.approval-buttons, .button-container');
    if (buttonContainer) {
        buttonContainer.style.display = 'flex';
    }
}

// Function to show revision button
function showRevisionButton() {
    const revisionButton = document.querySelector('button[onclick="revisionCash()"]');
    const revisionBtn = document.getElementById('revisionBtn');
    
    if (revisionButton) {
        revisionButton.style.display = 'inline-block';
    }
    if (revisionBtn) {
        revisionBtn.style.display = 'inline-block';
    }
}

// Function to submit revision with multiple fields
function submitRevision() {
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    
    // Check if revision button is disabled
    const revisionBtn = document.getElementById('revisionBtn');
    if (revisionBtn && revisionBtn.disabled) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please add and fill revision field first'
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
            text: 'Please add and fill revision field first'
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
            title: 'Maximum Limit',
            text: 'Maximum 4 revision fields allowed'
        });
        return;
    }
    
    // Check if current user already has a revision field
    if (hasUserAlreadyAddedRevision()) {
        Swal.fire({
            icon: 'warning',
            title: 'Revision Already Added',
            text: 'You have already added a revision. Each user is only allowed to add one revision.'
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
    deleteButton.title = 'Delete this revision field';
    deleteButton.onclick = function() {
        // Check if user can delete this field (only allow deleting own field)
        const userInfo = getUserInfo();
        const userPrefix = `[${userInfo.name} - ${userInfo.role}]: `;
        
        if (!newField.value.startsWith(userPrefix)) {
            Swal.fire({
                icon: 'error',
                title: 'Not Allowed',
                text: 'You can only delete revision fields that you created'
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
        addBtn.textContent = 'Maximum 4 revisions reached';
        addBtn.style.display = 'none';
    } else if (hasUserRevision) {
        // User already has a revision
        addBtn.textContent = 'You have already added a revision';
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
    let userRole = 'Approver'; // Default role for this page since we're on the approver page
    
    try {
        // Get user info from getCurrentUser function in auth.js
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.username) {
            userName = currentUser.username;
        }
        
        // Get user role based on the current page
        // Since we're on the approver page, the role is Approver
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
    const revisionButton = document.getElementById('revisionButton');
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
    
    // Enable/disable revision button based on content
    if (revisionButton) {
        if (hasContent) {
            revisionButton.disabled = false;
            revisionButton.classList.remove('opacity-50', 'cursor-not-allowed');
            revisionButton.classList.add('opacity-100', 'cursor-pointer');
        } else {
            revisionButton.disabled = true;
            revisionButton.classList.add('opacity-50', 'cursor-not-allowed');
            revisionButton.classList.remove('opacity-100', 'cursor-pointer');
        }
    }
}

// Function to update add button state (for compatibility)
function updateAddButtonState() {
    updateAddButton();
}

// Function to preview PDF files
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