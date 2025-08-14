let uploadedFiles = [];

let caId; // Declare global variable
let currentTab; // Declare global variable for tab

// Function to fetch CA details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    caId = urlParams.get('ca-id');
    currentTab = urlParams.get('tab');
    if (caId) fetchCADetails(caId);
    if (currentTab === 'received' || currentTab === 'rejected') hideApprovalButtons();
    if (currentTab === 'received' || currentTab === 'rejected') hideRevisionButton();
    // Apply tab-based behavior for field editability and button visibility
    applyTabBasedBehavior();
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
    
    // Apply tab-based behavior after populating data
    applyTabBasedBehavior();
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
                <input type="number" value="${detail.coa || ''}" class="coa w-full bg-gray-100" readonly />
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

// Function to fetch all dropdown options
function fetchDropdownOptions(caData = null) {
    // Removed as per edit hint
}

// Function to reject cash advance
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
                    updateCashStatusWithRemarks('reject', remarksResult.value);
                }
            });
        }
    });
}

// Function to update cash advance status
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
        StatusAt: "Receive",
        Action: status,
        Remarks: ''
    };

    // Show loading
    Swal.fire({
        title: `${status === 'approve' ? 'Receiving' : 'Processing'}...`,
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
                text: `CA ${status === 'approve' ? 'received' : 'rejected'} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                goToMenuReceiveCash();
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
            text: `Error ${status === 'approve' ? 'receiving' : 'rejecting'} CA: ` + error.message
        });
    });
}

// Function to update cash advance status with remarks
function updateCashStatusWithRemarks(status, remarks) {
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
        StatusAt: "Receive",
        Action: status,
        Remarks: remarks || ''
    };

    // Show loading
    let actionText = 'Processing';
    if (status === 'approve') actionText = 'Receiving';
    else if (status === 'reject') actionText = 'Rejecting';
    else if (status === 'revise') actionText = 'Submitting Revision';
    
    Swal.fire({
        title: `${actionText}...`,
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
            let successMessage = 'Operation completed successfully';
            if (status === 'approve') successMessage = 'CA received successfully';
            else if (status === 'reject') successMessage = 'CA rejected successfully';
            else if (status === 'revise') successMessage = 'Revision submitted successfully';
            
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: successMessage,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                goToMenuReceiveCash();
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
        if (status === 'approve') errorAction = 'receiving';
        else if (status === 'reject') errorAction = 'rejecting';
        else if (status === 'revise') errorAction = 'submitting revision for';
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error ${errorAction} CA: ` + error.message
        });
    });
}

function goToMenuReceiveCash() {
    window.location.href = "../../../dashboard/dashboardReceive/cashAdvance/menuCashReceive.html";
}

// Function to make all fields read-only for approval view
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
    const receiveButton = document.querySelector('button[onclick="receiveCash()"]');
    
    if (approveButton) {
        approveButton.style.display = 'none';
    }
    if (rejectButton) {
        rejectButton.style.display = 'none';
    }
    if (receiveButton) {
        receiveButton.style.display = 'none';
    }
    
    // Also hide any parent container if needed
    const buttonContainer = document.querySelector('.approval-buttons, .button-container');
    if (buttonContainer && currentTab !== 'approved') {
        buttonContainer.style.display = 'none';
    }
}

// Function to hide revision button
function hideRevisionButton() {
    const revisionButton = document.querySelector('button[onclick="reviseCash()"]');
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

// Function to apply tab-based behavior for field editability and button visibility
function applyTabBasedBehavior() {
    if (currentTab === 'received' || currentTab === 'rejected') {
        // For received/rejected tabs, make all fields read-only and hide action buttons
        makeAllFieldsReadOnly();
        hideApprovalButtons();
        hideRevisionButton();
    } else {
        // For other tabs (like 'approved'), make fields read-only but show action buttons
        makeAllFieldsReadOnly();
        showApprovalButtons();
        showRevisionButton();
    }
}

// Function to show approval buttons
function showApprovalButtons() {
    const receiveButton = document.querySelector('button[onclick="receiveCash()"]');
    
    if (receiveButton) {
        receiveButton.style.display = 'inline-block';
    }
    
    // Show button container if it exists
    const buttonContainer = document.querySelector('.approval-buttons, .button-container');
    if (buttonContainer) {
        buttonContainer.style.display = 'flex';
    }
}

// Function to show revision button
function showRevisionButton() {
    const revisionButton = document.querySelector('button[onclick="reviseCash()"]');
    const revisionBtn = document.getElementById('revisionBtn');
    const addRevisionBtn = document.getElementById('addRevisionBtn');
    
    if (revisionButton) {
        revisionButton.style.display = 'inline-block';
    }
    if (revisionBtn) {
        revisionBtn.style.display = 'inline-block';
    }
    if (addRevisionBtn) {
        addRevisionBtn.style.display = 'inline-block';
    }
}

// Function to display attachments
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

// Legacy functions kept for compatibility
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

// Function to print cash advance
function printCash() {
    // Get the cash advance ID
    const caId = new URLSearchParams(window.location.search).get('ca-id');
    
    // Collect all data from the form
    const data = {
        transactionType: document.getElementById('typeTransaction').value,
        invno: document.getElementById('invno').value,
        postingDate: document.getElementById('postingDate').value,
        department: document.getElementById('department').value,
        paidTo: document.getElementById('paidTo').value,
        prepared: document.getElementById('preparedBySearch').value,
        Checked: document.getElementById('checkedBySearch').value,
        Acknowledged: document.getElementById('acknowledgedBySearch').value,
        Approved: document.getElementById('approvedBySearch').value,
        Received: document.getElementById('receivedBySearch').value,
        Closed: document.getElementById('closedBySearch') ? document.getElementById('closedBySearch').value : '',
        remarks: document.getElementById('remarks').value,
        purposed: document.getElementById('purposed').value
    };
    
    // Collect items data from table rows for category and description
    const items = [];
    const tableRows = document.querySelectorAll('#tableBody tr');
    tableRows.forEach(row => {
        // Menggunakan selectors yang lebih spesifik dengan indeks untuk menghindari ambiguitas
        const inputs = row.querySelectorAll('input');
        
        // Pastikan ada cukup input di baris ini
        if (inputs.length >= 5) {
            const categoryInput = inputs[0]; // Input pertama adalah category
            const accountNameInput = inputs[1]; // Input kedua adalah account name
            const coaInput = inputs[2]; // Input ketiga adalah COA
            const descriptionInput = inputs[3]; // Input keempat adalah description
            const amountInput = inputs[4]; // Input kelima adalah amount
            
            items.push({
                category: categoryInput.value || '',
                accountName: accountNameInput.value || '',
                coa: coaInput.value || '',
                description: descriptionInput.value || '',
                amount: amountInput.value || '0',
                typeTransaction: document.getElementById('typeTransaction').value || '' // Using transaction type as category
            });
        }
    });
    
    // Add items data to the data object
    if (items.length > 0) {
        data.items = encodeURIComponent(JSON.stringify(items));
    }
    
    // Calculate total amount from table rows
    let totalAmount = 0;
    const amountInputs = document.querySelectorAll('#tableBody .amount');
    amountInputs.forEach(input => {
        const amount = parseFloat(input.value) || 0;
        totalAmount += amount;
    });
    data.amount = totalAmount.toString();
    
    // Build URL with query parameters
    let url = 'receivePrintCA.html?';
    for (const key in data) {
        if (data[key]) {
            url += `${key}=${encodeURIComponent(data[key])}&`;
        }
    }
    
    // Add cash advance ID if available
    if (caId) {
        url += `ca-id=${caId}&`;
    }
    
    // Add approval status flags
    url += 'proposedApproved=true&checkedApproved=true&acknowledgedApproved=true&approvedApproved=true&receivedApproved=true';
    
    // Open print page in new window
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
        alert('Please allow popups for this website to print the document.');
    }
}

// Function to receive cash advance
function receiveCash() {
    Swal.fire({
        title: 'Confirm Receipt',
        text: 'Are you sure you want to receive this Cash Advance?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Receive',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateCAStatus('approve');
        }
    });
}

// Function to revise cash advance
function reviseCash() {
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
            updateCashStatusWithRemarks('revise', allRemarks);
        }
    });
}

// Function to get current user information
function getUserInfo() {
    // Use functions from auth.js to get user information
    let userName = 'Unknown User';
    let userRole = 'Receiver'; // Default role for this page since we're on the receiver page
    
    try {
        // Get user info from getCurrentUser function in auth.js
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.username) {
            userName = currentUser.username;
        }
        
        // Get user role based on the current page
        // Since we're on the receiver page, the role is Receiver
    } catch (e) {
        console.error('Error getting user info:', e);
    }
    
    return { name: userName, role: userRole };
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