let uploadedFiles = [];

let settlementId = null;
let currentTab; // Global variable for tab



// Parse URL parameters when page loads
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    settlementId = urlParams.get('settle-id');
    currentTab = urlParams.get('tab');
    
    if (settlementId) {
        fetchSettleDetails(settlementId);
    } else {
        alert('Settlement ID not provided');
        window.history.back();
    }
    
    // Hide approve/reject buttons if viewing from approved or rejected tabs
    if (currentTab === 'approved' || currentTab === 'rejected') {
        hideApprovalButtons();
    }
    

});

// Function to hide approval buttons
function hideApprovalButtons() {
    const approveButton = document.querySelector('button[onclick="approveSettle()"]');
    const rejectButton = document.querySelector('button[onclick="rejectSettle()"]');
    
    if (approveButton) {
        approveButton.style.display = 'none';
    }
    if (rejectButton) {
        rejectButton.style.display = 'none';
    }
    
    // Also hide any parent container if needed
    const buttonContainer = document.querySelector('.approval-buttons, .button-container');
    if (buttonContainer && currentTab !== 'approve') {
        buttonContainer.style.display = 'none';
    }
}

// Function to hide revision buttons based on document status
function hideRevisionButtons(data) {
    const addRevisionBtn = document.getElementById('addRevisionBtn');
    const revisionButton = document.getElementById('revisionButton');
    const revisionContainer = document.getElementById('revisionContainer');
    
    // Hide revision buttons only when status is 'acknowledged' or 'rejected'
    if (data.status === 'Approved' || data.status === 'Rejected' || 
        data.status === 'approved' || data.status === 'rejected') {
        
        if (addRevisionBtn) {
            addRevisionBtn.style.display = 'none';
        }
        if (revisionButton) {
            revisionButton.style.display = 'none';
        }
        if (revisionContainer) {
            revisionContainer.style.display = 'none';
        }
    } else {
        // Show revision buttons when status allows (including in 'approve' tab)
        if (addRevisionBtn) {
            addRevisionBtn.style.display = 'block';
        }
        if (revisionButton) {
            revisionButton.style.display = 'block';
        }
    }
}

// Function to fetch and populate settlement details
function fetchSettleDetails(id) {
    const token = getAccessToken();
    
    if (!token) {
        alert('Please login first');
        return;
    }
    
    console.log('Fetching settlement details for ID:', id);
    
    fetch(`${BASE_URL}/api/settlements/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        console.log('Settlement Details API response:', result);
        
        if (result.status && result.data) {
            populateSettleDetails(result.data);
        } else {
            console.error('API returned error:', result.message);
            alert('Failed to load settlement details: ' + (result.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error fetching settlement details:', error);
        alert('Error fetching settlement details: ' + error.message);
    });
}

function populateSettleDetails(data) {
    // Populate basic settlement information
    document.getElementById('invno').value = data.settlementNumber || '';
    document.getElementById('settlementRefNo').value = data.settlementRefNo || '';
    
    // Store requester ID for user lookup instead of employeeId
    window.currentEmployeeId = data.requester || '';
    
    // Use the provided requesterName directly
    document.getElementById('Employee').value = data.requesterName || '';
    document.getElementById('EmployeeName').value = data.requesterName || '';
    document.getElementById('requester').value = data.requesterName || '';
    
    // Set department - create option directly from backend data
    const departmentSelect = document.getElementById('department');
    if (data.departmentName && departmentSelect) {
        departmentSelect.innerHTML = ''; // Clear existing options
        const option = document.createElement('option');
        option.value = data.departmentName; // Use department name as value since backend returns string
        option.textContent = data.departmentName;
        option.selected = true;
        departmentSelect.appendChild(option);
    }
    
    document.getElementById('cashAdvanceNumber').value = data.cashAdvanceNumber || '';
    
    // Handle submission date - convert from ISO to YYYY-MM-DD format for date input
    if (data.submissionDate) {
        const formattedDate = data.submissionDate.split('T')[0];
        document.getElementById('SubmissionDate').value = formattedDate;
    }
    
    document.getElementById('purpose').value = data.purpose || '';
    document.getElementById('paidTo').value = data.payToName || '';

    // Set status - create option directly from backend data
    const statusSelect = document.getElementById('docStatus');
    if (data.status && statusSelect) {
        statusSelect.innerHTML = ''; // Clear existing options
        const option = document.createElement('option');
        option.value = data.status;
        option.textContent = data.status;
        option.selected = true;
        statusSelect.appendChild(option);
    }

    // Populate approval fields from DTO data
    populateApprovalFieldsFromDetail(data);
    
    // Populate settlement items table
    if (data.settlementItems && data.settlementItems.length > 0) {
        populateSettlementItems(data.settlementItems);
    }
    
    // Show remarks if exists
    if (data.remarks) {
        document.getElementById('remarks').value = data.remarks;
    }
    
    // Display attachments if any
    if (data.attachments && data.attachments.length > 0) {
        displayAttachments(data.attachments);
    }
    
    // Display revision and rejection remarks
    displayRevisionRemarks(data);
    displayRejectionRemarks(data);
    
    // Make all fields readonly
    makeAllFieldsReadOnly();
    
    // Hide revision buttons based on document status
    hideRevisionButtons(data);
}

function populateSettlementItems(items) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (items.length === 0) {
        return;
    }
    
    let totalAmount = 0;
    
    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border">
                <input type="text" value="${item.category || ''}" class="w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" value="${item.accountName || ''}" class="w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" value="${item.glAccount || ''}" class="w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" value="${item.description || ''}" class="w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="number" value="${item.amount || 0}" class="w-full bg-gray-100 total" readonly step="0.01" />
            </td>
            <td class="p-2 border text-center">
                <span class="text-gray-400">View Only</span>
            </td>
        `;
        tableBody.appendChild(row);
        
        // Calculate total
        totalAmount += parseFloat(item.amount || 0);
    });
    
    // Update total amount display
    const totalAmountDisplay = document.getElementById('totalAmountDisplay');
    if (totalAmountDisplay) {
        totalAmountDisplay.textContent = totalAmount.toFixed(2);
    }
}

// Function to approve settlement
function approveSettle() {
    if (!settlementId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Settlement ID not found'
        });
        return;
    }
    
    Swal.fire({
        title: 'Confirm Approval',
        text: 'Are you sure you want to approve this Settlement?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Approve',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            const remarks = document.getElementById('remarks').value;
            updateSettleStatus('approve', remarks);
        }
    });
}

// Function to reject settlement
function rejectSettle() {
    if (!settlementId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Settlement ID not found'
        });
        return;
    }
    
    Swal.fire({
        title: 'Confirm Rejection',
        text: 'Are you sure you want to reject this Settlement?',
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
                    updateSettleStatus('reject', remarksResult.value);
                }
            });
        }
    });
}

// Function to update settlement status
function updateSettleStatus(status, remarks) {
    const token = getAccessToken();
    const userId = getUserId();
    
    if (!userId) {
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'Unable to get user ID from token. Please login again.'
        });
        return;
    }
    
    // Show loading
    Swal.fire({
        title: `${status === 'approve' ? 'Approving' : 'Rejecting'}...`,
        text: 'Please wait while we process your request.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    const requestBody = {
        id: settlementId,
        UserId: userId,
        StatusAt: "Approve",
        Action: status,
        Remarks: remarks || ''
    };
    
    console.log('Sending status update request:', requestBody);
    
    fetch(`${BASE_URL}/api/settlements/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                console.log('Error data:', errorData);
                throw new Error(errorData.message || `HTTP error! status: ${errorData.Message}`);
            });
        }
        return response;
    })
    .then(result => {
        console.log('Status update response:', result);
        
        if (result.status) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: `Settlement ${status === 'approve' ? 'approved' : 'rejected'} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to dashboard
                window.location.href = '../../../dashboard/dashboardApprove/settlement/menuSettleApprove.html';
            });
        } else {
            throw new Error(result.message || 'Failed to update settlement status');
        }
    })
    .catch(error => {
        console.error('Error updating settlement status:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error ${status === 'approve' ? 'approving' : 'rejecting'} settlement: ` + error.message
        });
    });
}

// Navigation functions
function goBack() {
    window.history.back();
}

function goToMenuSettle() {
    window.location.href = '../../../dashboard/dashboardApprove/settlement/menuSettleApprove.html';
}

function goToMenuApprovSettle() {
    window.location.href = '../../../dashboard/dashboardApprove/settlement/menuSettleApprove.html';
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
    displayFileList();
}

// Display file list function - if needed
function displayFileList() {
    // Implementation for displaying uploaded files if needed
}

// Function to populate approval fields (Prepared by, Checked by, etc.) - REMOVED
// Now using populateApprovalFieldsFromDetail function that gets data from detail response

// Function to populate approval fields from DTO data
function populateApprovalFieldsFromDetail(data) {
    const approvalMap = [
      { id: 'preparedBySearch', value: data.preparedName },
      { id: 'checkedBySearch', value: data.checkedName },
      { id: 'acknowledgedBySearch', value: data.acknowledgedName },
      { id: 'approvedBySearch', value: data.approvedName },
      { id: 'receivedBySearch', value: data.receivedName }
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

// Function to populate the Employee field with kansaiEmployeeId - REMOVED
// Now using data directly from detail response

// Function to make all fields read-only for approval view
function makeAllFieldsReadOnly() {
    // Make all input fields read-only including search inputs
    const inputFields = document.querySelectorAll('input[type="text"], input[type="date"], input[type="number"], textarea');
    inputFields.forEach(field => {
        field.readOnly = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
        
        // Remove onkeyup event for search inputs to disable search functionality
        if (field.id.includes('Search')) {
            field.removeAttribute('onkeyup');
        }
    });
    
    // Disable all select fields
    const selectFields = document.querySelectorAll('select');
    selectFields.forEach(field => {
        field.disabled = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
    });
    
    // Disable all checkboxes
    const checkboxFields = document.querySelectorAll('input[type="checkbox"]');
    checkboxFields.forEach(field => {
        field.disabled = true;
        field.classList.add('cursor-not-allowed');
    });
    
    // Hide add row button if it exists
    const addRowButton = document.querySelector('button[onclick="addRow()"]');
    if (addRowButton) {
        addRowButton.style.display = 'none';
    }
    
    // Hide all delete row buttons
    const deleteButtons = document.querySelectorAll('button[onclick="deleteRow(this)"]');
    deleteButtons.forEach(button => {
        button.style.display = 'none';
    });
    
    // Disable file upload if it exists
    const fileInput = document.getElementById('Reference');
    if (fileInput) {
        fileInput.disabled = true;
        fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
    
    // Also disable the attachment input
    const attachmentInput = document.getElementById('attachments');
    if (attachmentInput) {
        attachmentInput.disabled = true;
        attachmentInput.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
    
    // Hide all search dropdowns
    const searchDropdowns = document.querySelectorAll('.search-dropdown');
    searchDropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
    });
}

// Function to display revised remarks from API
function displayRevisionRemarks(data) {
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

// Function to display rejection remarks
function displayRejectionRemarks(data) {
    const rejectionRemarksSection = document.getElementById('rejectionRemarksSection');
    const rejectionRemarks = document.getElementById('rejectionRemarks');
    
    if (data.rejectedRemarks && data.rejectedRemarks.trim() !== '') {
        if (rejectionRemarksSection) {
            rejectionRemarksSection.style.display = 'block';
        }
        if (rejectionRemarks) {
            rejectionRemarks.value = data.rejectedRemarks;
        }
    } else {
        if (rejectionRemarksSection) {
            rejectionRemarksSection.style.display = 'none';
        }
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

// Function to hide approval buttons
function hideApprovalButtons() {
    const approveButton = document.querySelector('button[onclick="approveSettle()"]');
    const rejectButton = document.querySelector('button[onclick="rejectSettle()"]');
    
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

// Function to print settlement
function printSettle() {
    // Get settlement ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const settleId = urlParams.get('settle-id');
    
    if (!settleId) {
        alert('No settlement ID found');
        return;
    }
    
    // Open the print page in a new window/tab
    window.open(`printSettle.html?settle-id=${settleId}`, '_blank');
}

// Helper function to get logged-in user ID
function getUserId() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.id : null;
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



// Function to toggle revision field
function toggleRevisionField() {
    const revisionContainer = document.getElementById('revisionContainer');
    const addRevisionBtn = document.getElementById('addRevisionBtn');
    
    if (revisionContainer.classList.contains('hidden')) {
        revisionContainer.classList.remove('hidden');
        addRevisionBtn.textContent = '- Remove revision';
        
        // Add revision textarea
        const revisionField = document.createElement('div');
        revisionField.className = 'mt-2';
        revisionField.innerHTML = `
            <textarea 
                class="w-full p-2 border rounded-md" 
                placeholder="Enter revision remarks..."
                rows="3"
                data-prefix-length="0"
            ></textarea>
        `;
        revisionContainer.appendChild(revisionField);
        
        // Enable the revision button
        const revisionButton = document.getElementById('revisionButton');
        if (revisionButton) {
            revisionButton.classList.remove('opacity-50', 'cursor-not-allowed');
            revisionButton.onclick = revisionSettle;
        }
    } else {
        revisionContainer.classList.add('hidden');
        addRevisionBtn.textContent = '+ Add revision';
        revisionContainer.innerHTML = '';
        
        // Disable the revision button
        const revisionButton = document.getElementById('revisionButton');
        if (revisionButton) {
            revisionButton.classList.add('opacity-50', 'cursor-not-allowed');
            revisionButton.onclick = null;
        }
    }
}

// Function to submit revision
function submitRevision() {
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    let allRemarks = '';
    
    revisionFields.forEach((field, index) => {
        // Include the entire content including the prefix
        if (field.value.trim() !== '') {
            if (allRemarks !== '') allRemarks += '\n\n';
            allRemarks += field.value.trim();
        }
    });
    
    const prefixLength = parseInt(revisionFields[0]?.dataset.prefixLength || '0');
    if (allRemarks.length <= prefixLength) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Silakan berikan alasan revisi sebelum mengirim'
        });
        return;
    }
    
    console.log("revisionRemarks");
    console.log(allRemarks);

    if (!settlementId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Settlement ID not found'
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
            // Call the existing function with the collected remarks
            updateSettleStatusWithRemarks('revise', allRemarks);
        }
    });
}

// Function to revision settlement
function revisionSettle() {
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    let hasContent = false;
    
    revisionFields.forEach(field => {
        const prefixLength = parseInt(field.dataset.prefixLength || '0');
        const content = field.value.trim();
        if (content.length > prefixLength) {
            hasContent = true;
        }
    });
    
    if (!hasContent) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Silakan berikan alasan revisi sebelum mengirim'
        });
        return;
    }
    
    // Enable the revision button
    const revisionButton = document.getElementById('revisionButton');
    if (revisionButton) {
        revisionButton.classList.remove('opacity-50', 'cursor-not-allowed');
        revisionButton.onclick = submitRevision;
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
            submitRevision();
        }
    });
}

// Function to update settlement status with remarks (for revision)
function updateSettleStatusWithRemarks(status, remarks) {
    if (!settlementId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Settlement ID not found'
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
        id: settlementId,
        UserId: userId,
        StatusAt: "Approve",
        Action: status,
        Remarks: remarks || ''
    };

    // Show loading
    Swal.fire({
        title: 'Processing Revision...',
        text: 'Please wait while we process your request.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    fetch(`${BASE_URL}/api/settlements/status`, {
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
                text: 'Settlement revision submitted successfully',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                window.location.href = '../../../dashboard/dashboardApprove/settlement/menuSettleApprove.html';
            });
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to submit revision. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error submitting revision: ' + error.message
        });
    });
}
