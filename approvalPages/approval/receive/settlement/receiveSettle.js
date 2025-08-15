let uploadedFiles = [];

let settlementId; // Declare global variable
let currentTab; // Declare global variable for tab

// Global variables to track revision fields
let revisionFieldsByUser = new Map(); // Track which users have added fields
const MAX_REVISION_FIELDS = 4;

// Function to fetch Settlement details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    settlementId = urlParams.get('settlement-id');
    currentTab = urlParams.get('tab'); // Get the tab parameter
    
    if (settlementId) {
        fetchSettlementDetails(settlementId);
    }
    
    // Hide approve/reject buttons if viewing from received or rejected tabs
    if (currentTab === 'received' || currentTab === 'rejected') {
        hideApprovalButtons();
    }
    
    // Initialize revision functionality
    const revisionContainer = document.getElementById('revisionContainer');
    if (revisionContainer) {
        // Use event delegation to handle input events on all textareas
        revisionContainer.addEventListener('input', function(event) {
            if (event.target.tagName === 'TEXTAREA') {
                checkRevisionButton();
            }
        });
        
        // Initialize button states
        checkRevisionButton();
        updateAddButtonState();
    }
};

// Function to hide approval buttons
function hideApprovalButtons() {
    const approveButton = document.querySelector('button[onclick="receiveSettle()"]');
    const rejectButton = document.querySelector('button[onclick="rejectSettle()"]');
    
    if (approveButton) {
        approveButton.style.display = 'none';
    }
    if (rejectButton) {
        rejectButton.style.display = 'none';
    }
    
    // Also hide any parent container if needed
    const buttonContainer = document.querySelector('.approval-buttons, .button-container');
    if (buttonContainer && currentTab !== 'receive') {
        buttonContainer.style.display = 'none';
    }
}

// Function to hide revision buttons based on document status
function hideRevisionButtons(data) {
    const addRevisionBtn = document.getElementById('addRevisionBtn');
    const revisionButton = document.getElementById('revisionButton');
    const revisionContainer = document.getElementById('revisionContainer');
    
    // Hide revision buttons only when status is 'acknowledged' or 'rejected'
    if (data.status === 'Acknowledged' || data.status === 'Rejected' || 
        data.status === 'acknowledged' || data.status === 'rejected') {
        
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
        // Show revision buttons when status allows (including in 'receive' tab)
        if (addRevisionBtn) {
            addRevisionBtn.style.display = 'block';
        }
        if (revisionButton) {
            revisionButton.style.display = 'block';
        }
    }
}

function fetchSettlementDetails(settlementId) {
    fetch(`${BASE_URL}/api/settlement/${settlementId}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(response => {
            if (response.data) {
                console.log(response.data);
                populateSettlementDetails(response.data);
                
                // Always fetch dropdown options
                fetchDropdownOptions(response.data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error fetching Settlement details: ' + error.message);
        });
}

function populateSettlementDetails(data) {
    // Populate basic Settlement information
    document.getElementById('settlementNumber').value = data.settlementNumber;
    document.getElementById('settlementRefNo').value = data.settlementRefNo;
    document.getElementById('requesterName').value = data.requesterName;
    document.getElementById('purpose').value = data.purpose;
    document.getElementById('paidTo').value = data.payToName || '';
    document.getElementById('cashAdvanceReferenceId').value = data.cashAdvanceNumber || '';
    document.getElementById('remarks').value = data.remarks || '';

    // Format and set dates
    const submissionDate = data.submissionDate ? data.submissionDate.split('T')[0] : '';
    document.getElementById('submissionDate').value = submissionDate;
    
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

    // Set status
    if (data && data.status) {
        console.log('Status:', data.status);
        const statusSelect = document.getElementById('status');
        if (statusSelect) {
            statusSelect.innerHTML = ''; // Clear existing options
            const option = document.createElement('option');
            option.value = data.status;
            option.textContent = data.status;
            option.selected = true;
            statusSelect.appendChild(option);
        }
    }

    // Set docStatus - create option directly from backend data
    const docStatusSelect = document.getElementById('docStatus');
    if (data.status && docStatusSelect) {
        docStatusSelect.innerHTML = ''; // Clear existing options
        const option = document.createElement('option');
        option.value = data.status;
        option.textContent = data.status;
        option.selected = true;
        docStatusSelect.appendChild(option);
    }
    
    // Handle settlement items (amount breakdown)
    if (data.settlementItems) {
        populateSettlementItems(data.settlementItems);
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
    
    // Hide revision buttons based on document status
    hideRevisionButtons(data);
}

function populateSettlementItems(items) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (items.length === 0) {
        return;
    }
    
    console.log('Settlement items:', items);
    
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
                <input type="number" value="${item.amount || ''}" class="w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border text-center">
                <!-- Read-only view, no action buttons -->
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to fetch all dropdown options
function fetchDropdownOptions(settlementData = null) {
    fetchUsers(settlementData);
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
            populateUserSelects(data.data, settlementData);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
}

// Function to filter users for the search dropdown
function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    // Use stored users or empty array if not available
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
                case 'preparedBy': selectId = 'preparedDropdown'; break;
                case 'checkedBy': selectId = 'checkedDropdown'; break;
                case 'acknowledgedBy': selectId = 'acknowledgedDropdown'; break;
                case 'approvedBy': selectId = 'approvedDropdown'; break;
                case 'receivedBy': selectId = 'receivedDropdown'; break;
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

function populateUserSelects(users, settlementData = null) {
    // Store users globally for search functionality
    window.allUsers = users;
    
    const selects = [
        { id: 'preparedDropdown', approvalKey: 'preparedById', searchId: 'preparedBySearch' },
        { id: 'checkedDropdown', approvalKey: 'checkedById', searchId: 'checkedBySearch' },
        { id: 'acknowledgedDropdown', approvalKey: 'acknowledgedById', searchId: 'acknowledgedBySearch' },
        { id: 'approvedDropdown', approvalKey: 'approvedById', searchId: 'approvedBySearch' },
        { id: 'receivedDropdown', approvalKey: 'receivedById', searchId: 'receivedBySearch' }
    ];
    
    selects.forEach(selectInfo => {
        const select = document.getElementById(selectInfo.id);
        if (select) {
            select.innerHTML = '<option value="" disabled>Select User</option>';
            
            users.forEach(user => {
                const option = document.createElement("option");
                option.value = user.id;
                option.textContent = user.fullName;
                select.appendChild(option);
            });
            
            // Set the value from Settlement data if available and update search input
            if (settlementData && settlementData[selectInfo.approvalKey]) {
                select.value = settlementData[selectInfo.approvalKey];
                
                // Update the search input to display the selected user's name
                const searchInput = document.getElementById(selectInfo.searchId);
                if (searchInput) {
                    const selectedUser = users.find(user => user.id === settlementData[selectInfo.approvalKey]);
                    if (selectedUser) {
                        searchInput.value = selectedUser.fullName;
                    }
                }
            }
        }
    });
    
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
}

// Function to approve Settlement (receive)
function approveSettle() {
    Swal.fire({
        title: 'Confirm Receipt',
        text: 'Are you sure you want to receive this Settlement?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Receive',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateSettlementStatus('approve');
        }
    });
}

// Function to reject Settlement
function rejectSettle() {
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
                    updateSettlementStatusWithRemarks('reject', remarksResult.value);
                }
            });
        }
    });
}

// Function to approve or reject the Settlement
function updateSettlementStatus(status) {
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

    fetch(`${BASE_URL}/api/settlement/status`, {
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
                text: `Settlement ${status === 'approve' ? 'received' : 'rejected'} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                window.location.href = '../../../dashboard/dashboardReceive/settlement/menuSettleReceive.html';
            });
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to ${status} Settlement. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error ${status === 'approve' ? 'receiving' : 'rejecting'} Settlement: ` + error.message
        });
    });
}

// Function to approve or reject the Settlement with remarks
function updateSettlementStatusWithRemarks(status, remarks) {
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
        StatusAt: "Receive",
        Action: status,
        Remarks: remarks || ''
    };

    // Show loading
    Swal.fire({
        title: `${status === 'approve' ? 'Receiving' : 'Rejecting'}...`,
        text: 'Please wait while we process your request.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    fetch(`${BASE_URL}/api/settlement/status`, {
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
                text: `Settlement ${status === 'approve' ? 'received' : 'rejected'} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                window.location.href = '../../../dashboard/dashboardReceive/settlement/menuSettleReceive.html';
            });
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to ${status} Settlement. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error ${status === 'approve' ? 'receiving' : 'rejecting'} Settlement: ` + error.message
        });
    });
}

function goToMenuReceiveSettle() {
    window.location.href = "../../../dashboard/dashboardReceive/settlement/menuSettleReceive.html";
}

// Function to make all fields read-only for approval view
function makeAllFieldsReadOnly() {
    // Make all input fields read-only
    const inputFields = document.querySelectorAll('input[type="text"]:not([id$="Search"]), input[type="date"], input[type="number"], textarea');
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
    
    // Disable file upload
    const fileInput = document.getElementById('attachments');
    if (fileInput) {
        fileInput.disabled = true;
        fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
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
    if (buttonContainer && currentTab !== 'approved') {
        buttonContainer.style.display = 'none';
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
                <!-- Dynamic revision content will be inserted here by JavaScript -->
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
    const fileInput = document.getElementById('attachments');
    let fileNames = Array.from(files).map(file => file.name).join(', ');
    if (fileNames) {
        fileInput.title = fileNames;
    }
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

// Function to add revision field functionality
function addRevisionField() {
    const container = document.getElementById('revisionContainer');
    const currentUser = getUserInfo();
    const currentFieldCount = container.querySelectorAll('textarea').length;
    
    // Check if maximum fields reached
    if (currentFieldCount >= MAX_REVISION_FIELDS) {
        Swal.fire({
            icon: 'warning',
            title: 'Maximum Limit',
            text: `Maximum ${MAX_REVISION_FIELDS} revision field allowed`
        });
        return;
    }
    
    // Check if current user already has a field
    if (revisionFieldsByUser.has(currentUser.name)) {
        Swal.fire({
            icon: 'warning',
            title: 'Already exist',
            text: 'You already added a revision field. Each user can only add one field.'
        });
        return;
    }
    
    // Create wrapper div for the textarea and delete button
    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = 'flex items-center space-x-2 mt-2';
    fieldWrapper.dataset.userName = currentUser.name; // Store user name in wrapper
    
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
        // Remove user from tracking when field is deleted
        const userName = fieldWrapper.dataset.userName;
        revisionFieldsByUser.delete(userName);
        
        fieldWrapper.remove();
        checkRevisionButton(); // Update button state after removing a field
        checkRevisionContainer(); // Check if container should be hidden
        updateAddButtonState(); // Update add button state
    };
    
    // Add textarea and delete button to wrapper
    fieldWrapper.appendChild(newField);
    fieldWrapper.appendChild(deleteButton);
    
    // Add wrapper to container
    container.appendChild(fieldWrapper);
    
    // Track that this user has added a field
    revisionFieldsByUser.set(currentUser.name, true);
    
    // Update the revision button state and add button state
    checkRevisionButton();
    updateAddButtonState();
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
    
    if (hasContent) {
        revisionButton.classList.remove('opacity-50', 'cursor-not-allowed');
        revisionButton.disabled = false;
    } else {
        revisionButton.classList.add('opacity-50', 'cursor-not-allowed');
        revisionButton.disabled = true;
    }
}

// Check if revision container should be hidden when all fields are removed
function checkRevisionContainer() {
    const container = document.getElementById('revisionContainer');
    const addBtn = document.getElementById('addRevisionBtn');
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    
    if (revisionFields.length === 0) {
        container.classList.add('hidden');
        addBtn.textContent = '+ Add revision';
        // Clear the tracking map when container is hidden
        revisionFieldsByUser.clear();
    }
}

// Update add button state based on current conditions
function updateAddButtonState() {
    const addBtn = document.getElementById('addRevisionBtn');
    const container = document.getElementById('revisionContainer');
    const currentUser = getUserInfo();
    const currentFieldCount = container.querySelectorAll('textarea').length;
    
    // Check if user can add more fields
    const canAddMore = currentFieldCount < MAX_REVISION_FIELDS && !revisionFieldsByUser.has(currentUser.name);
    
    if (canAddMore) {
        addBtn.style.opacity = '1';
        addBtn.style.cursor = 'pointer';
        addBtn.style.pointerEvents = 'auto';
        if (currentFieldCount === 0) {
            addBtn.textContent = '+ Add revision';
        } else {
            addBtn.textContent = '+ Add more revision';
        }
    } else {
        addBtn.style.opacity = '0.5';
        addBtn.style.cursor = 'not-allowed';
        addBtn.style.pointerEvents = 'none';
        
        if (currentFieldCount >= MAX_REVISION_FIELDS) {
            addBtn.textContent = `Max ${MAX_REVISION_FIELDS} fields reached`;
        } else if (revisionFieldsByUser.has(currentUser.name)) {
            addBtn.textContent = ' ';
        }
    }
}

// Function to toggle revision field visibility
function toggleRevisionField() {
    const container = document.getElementById('revisionContainer');
    const addBtn = document.getElementById('addRevisionBtn');
    const currentUser = getUserInfo();
    const currentFieldCount = container.querySelectorAll('textarea').length;
    
    // Check if user can add a field
    if (currentFieldCount >= MAX_REVISION_FIELDS) {
        Swal.fire({
            icon: 'warning',
            title: 'Maximum Limit',
            text: `Maximum ${MAX_REVISION_FIELDS} revision field allowed`
        });
        return;
    }
    
    if (revisionFieldsByUser.has(currentUser.name)) {
        Swal.fire({
            icon: 'warning',
            title: 'Already exist',
            text: 'You already added a revision field. Each user can only add one field.'
        });
        return;
    }
    
    if (container.classList.contains('hidden')) {
        // Show container and add first field
        container.classList.remove('hidden');
        addRevisionField();
    } else {
        // Add another field
        addRevisionField();
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
            text: 'Please provide revision reason before submitting'
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
        StatusAt: "Receive",
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
                window.location.href = '../../../dashboard/dashboardReceive/settlement/menuSettleReceive.html';
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

// Helper function to get logged-in user ID
function getUserId() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.id : null;
} 