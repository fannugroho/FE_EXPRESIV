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
    
    // Setup click-outside-to-close behavior for all dropdowns
    document.addEventListener('click', function(event) {
        const dropdowns = document.querySelectorAll('.search-dropdown');
        dropdowns.forEach(dropdown => {
            const searchInput = document.getElementById(dropdown.id.replace('Dropdown', 'Search'));
            if (searchInput && !searchInput.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
    });
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
    if (buttonContainer && currentTab !== 'acknowledge') {
        buttonContainer.style.display = 'none';
    }
}

// Function to filter users for the search dropdown in approval section
function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    // Use stored users or mock data if not available
    const usersList = window.allUsers || [];
    
    // Filter users based on search text
    const filteredUsers = usersList.filter(user => {
        const userName = user.fullName;
        return userName.toLowerCase().includes(searchText);
    });
    
    // Display search results
    filteredUsers.forEach(user => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        const userName = user.fullName;
        option.innerText = userName;
        option.onclick = function() {
            searchInput.value = userName;
            
            // Get the correct select element based on fieldId
            let selectId;
            switch(fieldId) {
                case 'preparedBy': selectId = 'prepared'; break;
                case 'checkedBy': selectId = 'Checked'; break;
                case 'approvedBy': selectId = 'Approved'; break;
                case 'acknowledgedBy': selectId = 'Acknowledged'; break;
                case 'receivedBy': selectId = 'Received'; break;
                default: selectId = fieldId;
            }
            
            document.getElementById(selectId).value = user.id;
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(option);
    });
    
    // Display message if no results
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'No matching users found';
        dropdown.appendChild(noResults);
    }
    
    // Show dropdown
    dropdown.classList.remove('hidden');
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
            // Fetch users to populate Employee field properly and approval dropdowns
            fetchUsers(result.data);
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

    // Set transaction type - create option directly from backend data
    const transactionTypeSelect = document.getElementById('TransactionType');
    if (data.transactionType && transactionTypeSelect) {
        transactionTypeSelect.innerHTML = ''; // Clear existing options
        const option = document.createElement('option');
        option.value = data.transactionType;
        option.textContent = data.transactionType;
        option.selected = true;
        transactionTypeSelect.appendChild(option);
    }
    
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
    
    // Store approval IDs for later population when users are fetched
    window.approvalData = {
        preparedById: data.preparedById,
        checkedById: data.checkedById,
        acknowledgedById: data.acknowledgedById,
        approvedById: data.approvedById,
        receivedById: data.receivedById
    };
    
    // Populate settlement items in table if available (settlementItems not settlementDetails)
    if (data.settlementItems && data.settlementItems.length > 0) {
        populateSettleDetailsTable(data.settlementItems);
    }
    
    // Show remarks if exists
    if (data.remarks) {
        document.getElementById('remarks').value = data.remarks;
    }
    
    // Display revision and rejection remarks
    displayRevisionRemarks(data);
    displayRejectionRemarks(data);
    
    // Display attachments if they exist
    console.log('Attachments data:', data.attachments);
    if (data.attachments) {
        console.log('Displaying attachments:', data.attachments.length, 'attachments found');
        displayAttachments(data.attachments);
    } else {
        console.log('No attachments found in data');
    }
    
    // Make all fields read-only since this is an approval page
    makeAllFieldsReadOnly();
    
    console.log('Settlement details populated successfully');
}

function populateSettleDetailsTable(settlementItems) {
    const tableBody = document.getElementById('tableBody');
    
    // Clear existing rows first
    tableBody.innerHTML = '';
    
    settlementItems.forEach((item, index) => {
        addSettleDetailRow(item, index);
    });
}

function addSettleDetailRow(item = null, index = 0) {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" class="w-full bg-gray-100" value="${item ? item.category || '' : ''}" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full bg-gray-100" value="${item ? item.accountName || '' : ''}" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full bg-gray-100" value="${item ? item.glAccount || '' : ''}" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full bg-gray-100" value="${item ? item.description || '' : ''}" readonly />
        </td>
        <td class="p-2 border">
            <input type="number" class="w-full bg-gray-100" value="${item ? item.amount || '' : ''}" readonly />
        </td>
        <td class="p-2 border text-center">
            <!-- Action column - disabled in approval view -->
            <span class="text-gray-400">View Only</span>
        </td>
    `;
    
    tableBody.appendChild(newRow);
}

// Function to acknowledge settlement
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
        title: 'Confirm Acknowledgment',
        text: 'Are you sure you want to acknowledge this Settlement?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Acknowledge',
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
        title: `${status === 'approve' ? 'Acknowledging' : 'Rejecting'}...`,
        text: 'Please wait while we process your request.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    const requestBody = {
        id: settlementId,
        UserId: userId,
        StatusAt: "Acknowledge",
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
                text: `Settlement ${status === 'approve' ? 'acknowledged' : 'rejected'} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to dashboard
                window.location.href = '../../../dashboard/dashboardAcknowledge/settlement/menuSettleAcknow.html';
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
            text: `Error ${status === 'approve' ? 'acknowledging' : 'rejecting'} settlement: ` + error.message
        });
    });
}

// Navigation functions
function goBack() {
    window.history.back();
}

function goToMenuSettle() {
    window.location.href = '../../../dashboard/dashboardAcknowledge/settlement/menuSettleAcknow.html';
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

// Function to fetch users from API
function fetchUsers(settlementData = null) {
    fetch(`${BASE_URL}/api/users`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // Store users globally for search functionality
            window.allUsers = data.data;
            populateEmployeeField(data.data, settlementData);
            populateApprovalFields(data.data);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
}

// Function to populate approval fields (Prepared by, Checked by, etc.)
function populateApprovalFields(users) {
    const approvalSelects = [
        { id: 'prepared', dataKey: 'preparedById', searchId: 'preparedBySearch' },
        { id: 'Checked', dataKey: 'checkedById', searchId: 'checkedBySearch' },
        { id: 'Approved', dataKey: 'approvedById', searchId: 'approvedBySearch' },
        { id: 'Acknowledged', dataKey: 'acknowledgedById', searchId: 'acknowledgedBySearch' },
        { id: 'Received', dataKey: 'receivedById', searchId: 'receivedBySearch' }
    ];
    
    approvalSelects.forEach(selectInfo => {
        const select = document.getElementById(selectInfo.id);
        if (select) {
            // Clear existing options
            select.innerHTML = '<option value="" disabled>Select User</option>';
            
            // Add user options
            users.forEach(user => {
                const option = document.createElement("option");
                option.value = user.id;
                option.textContent = user.fullName || user.username;
                select.appendChild(option);
            });
            
            // Set the value from settlement approval data if available and update search input
            if (window.approvalData && window.approvalData[selectInfo.dataKey]) {
                select.value = window.approvalData[selectInfo.dataKey];
                
                // Update the search input to display the selected user's name
                const searchInput = document.getElementById(selectInfo.searchId);
                if (searchInput) {
                    const selectedUser = users.find(user => user.id === window.approvalData[selectInfo.dataKey]);
                    if (selectedUser) {
                        searchInput.value = selectedUser.fullName || selectedUser.username;
                    }
                }
            }
        }
    });
}

// Function to populate the Employee field with kansaiEmployeeId
function populateEmployeeField(users, settlementData = null) {
    // Find and populate the employee NIK using the stored requester ID
    if (window.currentEmployeeId) {
        const employee = users.find(user => user.id === window.currentEmployeeId);
        if (employee) {
            // Use kansaiEmployeeId if available, otherwise use username or id
            const employeeIdentifier = employee.kansaiEmployeeId || employee.username || employee.id;
            document.getElementById('Employee').value = employeeIdentifier;
            
            // Also update employee name if we have better data from users API
            if (employee.name) {
                document.getElementById('EmployeeName').value = employee.name;
            }
        }
    }
}

// Function to make all fields read-only for approval view
function makeAllFieldsReadOnly() {
    // Make all input fields read-only
    const inputFields = document.querySelectorAll('input[type="text"], input[type="date"], input[type="number"], textarea');
    inputFields.forEach(field => {
        field.readOnly = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
    });
    
    // Make search inputs read-only but with normal styling
    const searchInputs = document.querySelectorAll('input[id$="Search"]');
    searchInputs.forEach(field => {
        field.readOnly = true;
        field.classList.add('bg-gray-50');
        // Remove the onkeyup event to prevent search triggering
        field.removeAttribute('onkeyup');
    });
    
    // Disable all select fields
    const selectFields = document.querySelectorAll('select');
    selectFields.forEach(field => {
        field.disabled = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
    });
    
    // Disable file upload if it exists
    const fileInput = document.getElementById('Reference');
    if (fileInput) {
        fileInput.disabled = true;
        fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
}

// Function to display revision remarks from API
function displayRevisionRemarks(data) {
    const revisedRemarksSection = document.getElementById('revisedRemarksSection');
    
    const hasRevisions = data.revisions && data.revisions.length > 0;
    
    if (hasRevisions) {
        revisedRemarksSection.style.display = 'block';
        
        revisedRemarksSection.innerHTML = `
            <h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>
            <div class="bg-gray-50 p-4 rounded-lg border">
                <div class="mb-2">
                    <span class="text-sm font-medium text-gray-600">Total Revisions: </span>
                    <span id="revisedCount" class="text-sm font-bold text-blue-600">${data.revisions.length}</span>
                </div>
            </div>
        `;
        
        const revisionsByStage = {};
        data.revisions.forEach(revision => {
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
        
        Object.keys(revisionsByStage).forEach(stage => {
            const stageRevisions = revisionsByStage[stage];
            
            const stageHeader = document.createElement('div');
            stageHeader.className = 'mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded';
            stageHeader.innerHTML = `
                <h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${stageRevisions.length})</h4>
            `;
            revisedRemarksSection.appendChild(stageHeader);
            
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

// Helper function to get logged-in user ID
function getUserId() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.id : null;
}

// Function to handle revision for Settlement
function revisionSettle() {
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    
    // Check if revision button is disabled
    if (document.getElementById('revisionButton').disabled) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please add and fill revision field first'
        });
        return;
    }
    
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
    
    // Call the existing function with the collected remarks
    updateSettleStatusWithRemarks('revise', allRemarks);
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
        StatusAt: "Acknowledge",
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
                window.location.href = '../../../dashboard/dashboardAcknowledge/settlement/menuSettleAcknowledge.html';
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
