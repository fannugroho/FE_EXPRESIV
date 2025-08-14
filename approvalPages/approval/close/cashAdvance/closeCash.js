let uploadedFiles = [];

let caId; // Declare global variable
let currentTab; // Declare global variable for tab

// Function to fetch CA details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    caId = urlParams.get('ca-id');
    currentTab = urlParams.get('tab'); // Get the tab parameter
    
    if (caId) {
        fetchCADetails(caId);
    }
    
    // Hide close button if viewing from closed or rejected tabs
    if (currentTab === 'closed' || currentTab === 'rejected') {
        hideCloseButton();
    }
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
                <input type="text" value="${detail.description || ''}" class="w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="number" value="${detail.amount || ''}" class="w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border text-center">
                <!-- Read-only view, no action buttons -->
            </td>
        `;
        tableBody.appendChild(row);
    });
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

// Function to close CA (main action for this page)
function closeCash() {
    // First check if this is a Personal Loan transaction
    const transactionType = document.getElementById('typeTransaction').value;
    
    if (transactionType !== 'Personal Loan') {
        Swal.fire({
            icon: 'warning',
            title: 'Invalid Transaction Type',
            text: 'Only Personal Loan transactions can be closed.'
        });
        return;
    }
    
    Swal.fire({
        title: 'Confirm Close',
        text: 'Are you sure you want to close this Cash Advance?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Close',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateCAStatus('close');
        }
    });
}

// Function to update CA status for close action
function updateCAStatus(action) {
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
        StatusAt: "Close",
        Action: action,
        Remarks: ''
    };

    // Show loading
    Swal.fire({
        title: 'Closing Cash Advance...',
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
                text: 'Cash Advance closed successfully',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the close dashboard
                window.location.href = '../../../dashboard/dashboardClose/cashAdvance/menuCloser.html';
            });
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to close CA. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error closing CA: ' + error.message
        });
    });
}

function goToMenuCash() {
    window.location.href = "../../../dashboard/dashboardClose/cashAdvance/menuCloser.html";
}

// Function to make all fields read-only for close view
function makeAllFieldsReadOnly() {
    document.querySelectorAll('input, textarea, select').forEach(el => {
        if (!el.classList.contains('action-btn')) {
            el.readOnly = true;
            el.disabled = true;
            el.classList.add('bg-gray-100');
        }
    });
}

// Function to hide close button
function hideCloseButton() {
    const closeButton = document.querySelector('button[onclick="closeCash()"]');
    
    if (closeButton) {
        closeButton.style.display = 'none';
    }
    
    // Also hide any parent container if needed
    const buttonContainer = document.querySelector('.close-buttons, .button-container');
    if (buttonContainer) {
        buttonContainer.style.display = 'none';
    }
}

// Function to toggle closedBy visibility based on transaction type
function toggleClosedBy() {
    const transactionType = document.getElementById('typeTransaction').value;
    const closedBySection = document.getElementById('closedBySection');
    
    if (transactionType === 'Personal Loan') {
        if (closedBySection) {
            closedBySection.style.display = 'block';
        }
    } else {
        if (closedBySection) {
            closedBySection.style.display = 'none';
        }
    }
}

// Legacy functions kept for compatibility
function saveDocument() {
    // This function is kept for backward compatibility but shouldn't be used in close flow
    console.warn('saveDocument() called in close flow - this should not happen');
}

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
            <input type="text" maxlength="30" class="w-full" required />
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

function printCashAdvanceVoucher() {
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
    // Get form values
    const cashAdvanceNo = document.getElementById('invno').value || '';
    const employeeId = document.getElementById('Employee').value || '';
    const employeeName = document.getElementById('EmployeeName').value || '';
    const requesterName = document.getElementById('requester').value || '';
    const purpose = document.getElementById('purposed').value || '';
    const paidTo = document.getElementById('paidTo').value || '';
    
    // Get department
    const departmentSelect = document.getElementById('department');
    const department = departmentSelect ? 
        (departmentSelect.options[departmentSelect.selectedIndex] ? 
            departmentSelect.options[departmentSelect.selectedIndex].text : '') : '';
    
    // Get date and status
    const submissionDate = document.getElementById('postingDate').value || '';
    const statusSelect = document.getElementById('docStatus');
    const status = statusSelect ? 
        (statusSelect.options[statusSelect.selectedIndex] ? 
            statusSelect.options[statusSelect.selectedIndex].value : '') : '';
    
    // Get transaction type
    const transactionTypeSelect = document.getElementById('typeTransaction');
    const transactionType = transactionTypeSelect ? 
        (transactionTypeSelect.options[transactionTypeSelect.selectedIndex] ? 
            transactionTypeSelect.options[transactionTypeSelect.selectedIndex].value : '') : '';
    
    // Get remarks if exists
    const remarks = document.getElementById('remarks').value || '';
    
    // Get approval signatories
    const preparedBySelect = document.getElementById('preparedSelect');
    const preparedBy = preparedBySelect ? 
        (preparedBySelect.options[preparedBySelect.selectedIndex] ? 
            preparedBySelect.options[preparedBySelect.selectedIndex].text : '') : '';
    
    const checkedBySelect = document.getElementById('checkedSelect');
    const checkedBy = checkedBySelect ? 
        (checkedBySelect.options[checkedBySelect.selectedIndex] ? 
            checkedBySelect.options[checkedBySelect.selectedIndex].text : '') : '';
    
    const acknowledgedBySelect = document.getElementById('acknowledgedSelect');
    const acknowledgedBy = acknowledgedBySelect ? 
        (acknowledgedBySelect.options[acknowledgedBySelect.selectedIndex] ? 
            acknowledgedBySelect.options[acknowledgedBySelect.selectedIndex].text : '') : '';
    
    const approvedBySelect = document.getElementById('approvedSelect');
    const approvedBy = approvedBySelect ? 
        (approvedBySelect.options[approvedBySelect.selectedIndex] ? 
            approvedBySelect.options[approvedBySelect.selectedIndex].text : '') : '';
    
    const receivedBySelect = document.getElementById('receivedSelect');
    const receivedBy = receivedBySelect ? 
        (receivedBySelect.options[receivedBySelect.selectedIndex] ? 
            receivedBySelect.options[receivedBySelect.selectedIndex].text : '') : '';
    
    const closedBySelect = document.getElementById('closedSelect');
    const closedBy = closedBySelect ? 
        (closedBySelect.options[closedBySelect.selectedIndex] ? 
            closedBySelect.options[closedBySelect.selectedIndex].text : '') : '';
    
    // Collect table items
    const tableItems = [];
    const rows = document.querySelectorAll('#tableBody tr');
    let hasValidItems = false;
    
    rows.forEach(row => {
        const descriptionInput = row.querySelector('input[type="text"]');
        const amountInput = row.querySelector('input[type="number"]');
        
        if (descriptionInput && amountInput && 
            descriptionInput.value.trim() !== '' && 
            amountInput.value.trim() !== '') {
            tableItems.push({
                description: descriptionInput.value,
                amount: amountInput.value
            });
            hasValidItems = true;
        }
    });
    
    // Convert items array to JSON string and encode for URL
    const itemsParam = encodeURIComponent(JSON.stringify(tableItems));
    
    // Create URL with parameters
    const url = `printCashAdv.html?cashAdvanceNo=${encodeURIComponent(cashAdvanceNo)}`
        + `&employeeNik=${encodeURIComponent(employeeId)}`
        + `&employeeName=${encodeURIComponent(employeeName)}`
        + `&requesterName=${encodeURIComponent(requesterName)}`
        + `&purpose=${encodeURIComponent(purpose)}`
        + `&paidTo=${encodeURIComponent(paidTo)}`
        + `&department=${encodeURIComponent(department)}`
        + `&submissionDate=${encodeURIComponent(submissionDate)}`
        + `&status=${encodeURIComponent(status)}`
        + `&transactionType=${encodeURIComponent(transactionType)}`
        + `&remarks=${encodeURIComponent(remarks)}`
        + `&proposedBy=${encodeURIComponent(preparedBy)}`
        + `&checkedBy=${encodeURIComponent(checkedBy)}`
        + `&acknowledgedBy=${encodeURIComponent(acknowledgedBy)}`
        + `&approvedBy=${encodeURIComponent(approvedBy)}`
        + `&receivedBy=${encodeURIComponent(receivedBy)}`
        + `&closedBy=${encodeURIComponent(closedBy)}`
        + `&items=${itemsParam}`;
    
    console.log("Opening print URL:", url); // Debug log
    
    // Open the print page in a new tab
    window.open(url, '_blank');
}

// Function to approve CA - Legacy function (kept for compatibility)
function approveCash() {
    // This should not be called in close flow, redirect to close action
    console.warn('approveCash() called in close flow - redirecting to close action');
    closeCash();
}

// Function to reject CA - Legacy function (kept for compatibility)
function rejectCash() {
    // This should not be called in close flow
    console.warn('rejectCash() called in close flow - this should not happen');
}

// Legacy functions for backward compatibility
function updateCAStatus(status) {
    if (status === 'approve') {
        // In close flow, "approve" should mean "close"
        updateCAStatus('close');
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

    const requestData = {
        id: caId,
        UserId: userId,
        StatusAt: "Close",
        Action: status,
        Remarks: ''
    };

    // Show loading
    Swal.fire({
        title: 'Processing...',
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
                text: 'Operation completed successfully',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                window.location.href = '../../../dashboard/dashboardClose/cashAdvance/menuCloser.html';
            });
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to process request. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error processing request: ' + error.message
        });
    });
}

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
        StatusAt: "Close",
        Action: status,
        Remarks: remarks || ''
    };

    // Show loading
    Swal.fire({
        title: 'Processing...',
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
                text: 'Operation completed successfully',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                window.location.href = '../../../dashboard/dashboardClose/cashAdvance/menuCloser.html';
            });
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to process request. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error processing request: ' + error.message
        });
    });
}

// Function to submit revision - Not applicable for close flow
function submitRevision() {
    console.warn('submitRevision() called in close flow - this should not happen');
    Swal.fire({
        icon: 'info',
        title: 'Not Applicable',
        text: 'Revision is not applicable for closing cash advances.'
    });
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