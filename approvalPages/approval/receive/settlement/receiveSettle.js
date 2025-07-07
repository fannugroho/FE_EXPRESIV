let uploadedFiles = [];

let settlementId; // Declare global variable
let currentTab; // Declare global variable for tab

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
};

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
    document.getElementById('paidTo').value = data.payToBusinessPartnerName || '';
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
    
    // Handle settlement items (amount breakdown)
    if (data.settlementItems) {
        populateSettlementItems(data.settlementItems);
    }
    
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