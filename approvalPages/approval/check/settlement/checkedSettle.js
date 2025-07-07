let uploadedFiles = [];

let settlementId = null;
let currentTab; // Global variable for tab

// Add CSS styles for dropdown
document.head.insertAdjacentHTML('beforeend', `
<style>
    /* Dropdown styling */
    .dropdown-item {
        padding: 8px 12px;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    .dropdown-item:hover {
        background-color: #f3f4f6;
    }
    .search-dropdown {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        max-height: 200px;
        overflow-y: auto;
        z-index: 50;
    }
    .search-input:focus {
        border-color: #3b82f6;
        outline: none;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    }
</style>
`);

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
    
    // Hide approve/reject buttons if viewing from checked or rejected tabs
    if (currentTab === 'checked' || currentTab === 'rejected') {
        hideApprovalButtons();
    }
});

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
    
    // Store department data to be set after dropdown is populated
    window.departmentData = {
        departmentId: data.departmentId,
        departmentName: data.departmentName
    };
    

    document.getElementById('cashAdvanceNumber').value = data.cashAdvanceNumber  || '';
    
    // Handle submission date - extract date part directly to avoid timezone issues
    if (data.submissionDate) {
        const formattedDate = data.submissionDate.split('T')[0];
        document.getElementById('SubmissionDate').value = formattedDate;
    }
    
    document.getElementById('purpose').value = data.purpose || '';
    document.getElementById('paidTo').value = data.payToBusinessPartnerName || '';
    const transactionType = document.getElementById('TransactionType');
    var option = document.createElement('option');
    option.value = data.transactionType;
    option.textContent = data.transactionType;
    transactionType.appendChild(option);
    
    option.selected = true;
    
    // Set status
    if (data.status) {
        document.getElementById('docStatus').value = data.status;
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

// Function to approve settlement
function approveSettle() {
    if (!settlementId) {
        alert('Settlement ID not found');
        return;
    }
    
    // Get remarks
    const remarks = document.getElementById('remarks').value;
    
    // Show confirmation dialog
    Swal.fire({
        title: 'Approve Settlement',
        text: 'Are you sure you want to approve this settlement?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
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
    
    // Show confirmation dialog first
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
        alert('Unable to get user ID from token. Please login again.');
        return;
    }
    
    // Show loading
    Swal.fire({
        title: 'Processing...',
        text: `Please wait while we ${status === 'approve' ? 'approve' : 'reject'} the settlement.`,
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    const requestBody = {
        id: settlementId,
        UserId: userId,
        StatusAt: "Check",
        Action: status,
        Remarks: remarks
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
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            });
        }
        return response;
    })
    .then(result => {
        console.log('Status update response:', result);
        
        if (result.status) {
            Swal.fire({
                title: 'Success!',
                text: `Settlement has been ${status === 'approve' ? 'approved' : 'rejected'} successfully.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to dashboard
                window.location.href = '../../../dashboard/dashboardCheck/settlement/menuSettleCheck.html';
            });
        } else {
            throw new Error(result.message || 'Failed to update settlement status');
        }
    })
    .catch(error => {
        console.error('Error updating settlement status:', error);
        Swal.fire({
            title: 'Error!',
            text: `Failed to ${status === 'approve' ? 'approve' : 'reject'} settlement: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    });
}

// Navigation functions
function goBack() {
    window.history.back();
}

function goToMenuSettle() {
    window.location.href = '../../../dashboard/dashboardCheck/settlement/menuSettleCheck.html';
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
            populateEmployeeField(data.data, settlementData);
            populateApprovalFields(data.data);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
}

// Function to populate approval fields (Prepared by, Checked by, etc.)
function populateApprovalFields(users) {
    // Store users globally for search functionality
    window.allUsers = users;
    
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
            console.log(select);
            // Clear existing options
            select.innerHTML = '<option value="" disabled>Select User</option>';
            
            // Add user options
            users.forEach(user => {
                const option = document.createElement("option");
                option.value = user.id;
                option.textContent = user.fullName || user.username;
                select.appendChild(option);
            });
            
            // Set the value from settlement approval data if available
            if (window.approvalData && window.approvalData[selectInfo.dataKey]) {
                console.log(window.approvalData[selectInfo.dataKey]);
                select.value = window.approvalData[selectInfo.dataKey];
                console.log(select.value);
                
                // Update the search input to display the selected user's name
                const searchInput = document.getElementById(selectInfo.searchId);
                if (searchInput) {
                    const selectedUser = users.find(user => user.id === window.approvalData[selectInfo.dataKey]);
                    if (selectedUser) {
                        searchInput.value = selectedUser.name || `${selectedUser.fullName}` || selectedUser.username;
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
        const userName = user.name || `${user.fullName || ''}`;
        return userName.toLowerCase().includes(searchText);
    });
    
    // Display search results
    filteredUsers.forEach(user => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        const userName = user.name || `${user.fullName || ''}`;
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
    if (buttonContainer && currentTab !== 'prepared') {
        buttonContainer.style.display = 'none';
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
