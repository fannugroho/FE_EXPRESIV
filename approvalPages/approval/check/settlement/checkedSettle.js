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
            // Fetch departments to populate dropdown options
            fetchDepartments();
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
    
    // Handle submission date - convert from ISO to YYYY-MM-DD format for date input
    if (data.submissionDate) {
        const date = new Date(data.submissionDate);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('SubmissionDate').value = formattedDate;
    }
    
    document.getElementById('purpose').value = data.purpose || '';
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
        approvedById: data.approvedById
    };
    
    // Populate settlement items in table if available (settlementItems not settlementDetails)
    if (data.settlementItems && data.settlementItems.length > 0) {
        populateSettleDetailsTable(data.settlementItems);
    }
    
    // Show remarks if exists
    if (data.remarks) {
        document.getElementById('remarks').value = data.remarks;
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
            <input type="text" class="w-full bg-gray-100" value="${item ? item.description || '' : ''}" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full bg-gray-100" value="${item ? (item.accountName || item.glAccount || '') : ''}" readonly />
        </td>
        <td class="p-2 border">
            <input type="number" class="w-full bg-gray-100" value="${item ? item.amount || '' : ''}" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full bg-gray-100" value="${item ? (item.receipt || '') : ''}" readonly />
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
        alert('Settlement ID not found');
        return;
    }
    
    // Get remarks (should be required for rejection)
    const remarks = document.getElementById('remarks').value;
    
    if (!remarks.trim()) {
        alert('Please provide remarks for rejection');
        return;
    }
    
    // Show confirmation dialog
    Swal.fire({
        title: 'Reject Settlement',
        text: 'Are you sure you want to reject this settlement?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, reject it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateSettleStatus('reject', remarks);
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
        Status: status,
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
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            });
        }
        return response.json();
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

// Function to fetch departments from API
function fetchDepartments() {
    fetch(`${BASE_URL}/api/department`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            populateDepartmentSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching departments:', error);
        });
}

// Function to populate department select options
function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("department");
    if (!departmentSelect) return;
    
    // Clear and add new options
    departmentSelect.innerHTML = '<option value="" disabled>Select Department</option>';
    
    // Create options for each department
    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.id;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
    });
    
    // Set the department value if we have stored department data
    if (window.departmentData) {
        // Try to match by ID first, then by name
        if (window.departmentData.departmentId) {
            departmentSelect.value = window.departmentData.departmentId;
        } else if (window.departmentData.departmentName) {
            // If ID doesn't work, try to find by name
            const matchingOption = Array.from(departmentSelect.options).find(
                option => option.textContent === window.departmentData.departmentName
            );
            if (matchingOption) {
                departmentSelect.value = matchingOption.value;
            }
        }
        
        console.log('Department set to:', departmentSelect.value, 'Display name:', window.departmentData.departmentName);
    }
}

// Function to populate approval fields (Prepared by, Checked by, etc.)
function populateApprovalFields(users) {
    const approvalSelects = [
        { id: 'prepared', dataKey: 'preparedById' },
        { id: 'Checked', dataKey: 'checkedById' },
        { id: 'Approved', dataKey: 'approvedById' },
        { id: 'Acknowledged', dataKey: 'acknowledgedById' }
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
                option.textContent = user.name || `${user.firstName} ${user.lastName}` || user.username;
                select.appendChild(option);
            });
            
            // Set the value from settlement approval data if available
            if (window.approvalData && window.approvalData[selectInfo.dataKey]) {
                select.value = window.approvalData[selectInfo.dataKey];
                // Also check the corresponding checkbox
                const checkbox = select.parentElement.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = true;
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
}
