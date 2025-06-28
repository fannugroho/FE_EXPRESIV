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
    
    // Hide approve/reject buttons if viewing from received or rejected tabs
    if (currentTab === 'received' || currentTab === 'rejected') {
        hideApprovalButtons();
    }
};

function fetchCADetails(caId) {
    fetch(`${BASE_URL}/api/cash-advance/${caId}`)
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
                populateCADetails(response.data);
                
                // Always fetch dropdown options
                fetchDropdownOptions(response.data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error fetching CA details: ' + error.message);
        });
}

function populateCADetails(data) {
    // Populate basic CA information
    document.getElementById('invno').value = data.cashAdvanceNo;
    // Store employeeId to be populated when users are fetched
    window.currentEmployeeId = data.employeeId || '';
    document.getElementById('EmployeeName').value = data.employeeName || '';
    document.getElementById('requester').value = data.requesterName;
    document.getElementById('purposed').value = data.purpose;
    document.getElementById('paidTo').value = data.payToBusinessPartnerName || '';
    document.getElementById('remarks').value = data.remarks || '';

    // Format and set dates
    const submissionDate = data.submissionDate ? data.submissionDate.split('T')[0] : '';
    document.getElementById('postingDate').value = submissionDate;
    
    // Store the values to be used after fetching options
    window.currentValues = {
        transactionType: data.transactionType,
        departmentName: data.departmentName,
        status: data.status,
        employeeId: data.employeeId,
        departmentId: data.departmentId
    };
    
    // Handle cash advance details (amount breakdown)
    if (data.cashAdvanceDetails) {
        populateCashAdvanceDetails(data.cashAdvanceDetails);
    }
    
    // Display attachments if they exist
    console.log('Attachments data:', data.attachments);
    if (data.attachments) {
        console.log('Displaying attachments:', data.attachments.length, 'attachments found');
        displayAttachments(data.attachments);
    } else {
        console.log('No attachments found in data');
    }
    
    // Display revision remarks if they exist
    displayRevisionRemarks(data);
    
    // Check if fields should be editable
    const isEditable = data.status === 'Revision';
    toggleEditableFields(isEditable);
    
    // Setup submit button for revision status
    if (data.status === 'Revision') {
        const submitButtonContainer = document.querySelector('.flex.justify-between.space-x-4.mt-6');
        if (submitButtonContainer) {
            submitButtonContainer.style.display = 'flex';
        }
    }
}

// Function to display revision remarks from API
function displayRevisionRemarks(data) {
    const revisedRemarksSection = document.getElementById('revisedRemarksSection');
    const revisedCountElement = document.getElementById('revisedCount');
    
    // Check if there are any revision remarks
    const hasRevisions = data.revisionCount && parseInt(data.revisionCount) > 0;
    
    if (hasRevisions) {
        if (revisedRemarksSection) {
            revisedRemarksSection.style.display = 'block';
        }
        if (revisedCountElement) {
            revisedCountElement.textContent = data.revisionCount || '0';
        }
        
        // Display individual revision remarks
        const revisionFields = [
            { data: data.firstRevisionRemarks, containerId: 'firstRevisionContainer', elementId: 'firstRevisionRemarks' },
            { data: data.secondRevisionRemarks, containerId: 'secondRevisionContainer', elementId: 'secondRevisionRemarks' },
            { data: data.thirdRevisionRemarks, containerId: 'thirdRevisionContainer', elementId: 'thirdRevisionRemarks' },
            { data: data.fourthRevisionRemarks, containerId: 'fourthRevisionContainer', elementId: 'fourthRevisionRemarks' }
        ];
        
        revisionFields.forEach(field => {
            if (field.data && field.data.trim() !== '') {
                const container = document.getElementById(field.containerId);
                const element = document.getElementById(field.elementId);
                
                if (container && element) {
                    container.style.display = 'block';
                    element.textContent = field.data;
                }
            }
        });
    } else {
        if (revisedRemarksSection) {
            revisedRemarksSection.style.display = 'none';
        }
    }
}

function populateCashAdvanceDetails(details) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (details.length === 0) {
        addRow(); // Add empty row if no details
        return;
    }
    
    console.log('Cash advance details:', details);
    
    details.forEach(detail => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border">
                <input type="text" value="${detail.description || ''}" class="w-full cash-description" maxlength="200" required />
            </td>
            <td class="p-2 border">
                <input type="number" value="${detail.amount || ''}" class="w-full cash-amount" min="0" step="0.01" required />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to add a new row to the cash advance table
function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");
    
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" class="w-full cash-description" maxlength="200" required />
        </td>
        <td class="p-2 border">
            <input type="number" class="w-full cash-amount" min="0" step="0.01" required />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
}

// Function to delete a row from the table
function deleteRow(button) {
    button.closest("tr").remove();
}

// Function to fetch all dropdown options
function fetchDropdownOptions(caData = null) {
    fetchUsers(caData);
    fetchDepartments();
    fetchTransactionTypes();
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

// Function to fetch transaction types from API
function fetchTransactionTypes() {
    fetch(`${BASE_URL}/api/transaction-types`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            populateTransactionTypeSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching transaction types:', error);
        });
}

// Function to fetch users from API
function fetchUsers(caData = null) {
    fetch(`${BASE_URL}/api/users`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            populateUserSelects(data.data, caData);
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
                case 'preparedBy': selectId = 'prepared'; break;
                case 'checkedBy': selectId = 'Checked'; break;
                case 'acknowledgedBy': selectId = 'Acknowledged'; break;
                case 'approvedBy': selectId = 'Approved'; break;
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

// Function to filter requesters for the search dropdown
function filterRequesters() {
    const searchInput = document.getElementById('requester');
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById('requesterDropdown');
    
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
            document.getElementById('requesterSelect').value = user.id;
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(option);
    });
    
    // Display message if no results
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'No matching requesters found';
        dropdown.appendChild(noResults);
    }
    
    // Show dropdown
    dropdown.classList.remove('hidden');
}

// Function to populate department select
function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("department");
    if (!departmentSelect) return;
    
    departmentSelect.innerHTML = '<option value="" disabled>Select Department</option>';

    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.id;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
    });
    
    // Set the value from stored data if available
    if (window.currentValues && window.currentValues.departmentId) {
        departmentSelect.value = window.currentValues.departmentId;
    } else if (window.currentValues && window.currentValues.departmentName) {
        // Try to find by name if ID not available
        const matchingDept = departments.find(dept => dept.name === window.currentValues.departmentName);
        if (matchingDept) {
            departmentSelect.value = matchingDept.id;
        }
    }
}

// Function to populate transaction type select
function populateTransactionTypeSelect(transactionTypes) {
    const transactionTypeSelect = document.getElementById("typeTransaction");
    if (!transactionTypeSelect) return;
    
    transactionTypeSelect.innerHTML = '<option value="" disabled>Select Transaction Type</option>';

    transactionTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type.id || type.name;
        option.textContent = type.name;
        transactionTypeSelect.appendChild(option);
    });
    
    // Set the value from stored data if available
    if (window.currentValues && window.currentValues.transactionType) {
        // Try to find by name first
        const matchingType = transactionTypes.find(type => type.name === window.currentValues.transactionType);
        if (matchingType) {
            transactionTypeSelect.value = matchingType.id || matchingType.name;
        } else {
            transactionTypeSelect.value = window.currentValues.transactionType;
        }
    }
}

function populateUserSelects(users, caData = null) {
    // Store users globally for search functionality
    window.allUsers = users;
    
    const selects = [
        { id: 'prepared', approvalKey: 'preparedById', searchId: 'preparedBySearch' },
        { id: 'Checked', approvalKey: 'checkedById', searchId: 'checkedBySearch' },
        { id: 'Acknowledged', approvalKey: 'acknowledgedById', searchId: 'acknowledgedBySearch' },
        { id: 'Approved', approvalKey: 'approvedById', searchId: 'approvedBySearch' },
        { id: 'Received', approvalKey: 'receivedById', searchId: 'receivedBySearch' }
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
            
            // Set the value from CA data if available and update search input
            if (caData && caData[selectInfo.approvalKey]) {
                select.value = caData[selectInfo.approvalKey];
                
                // Update the search input to display the selected user's name
                const searchInput = document.getElementById(selectInfo.searchId);
                if (searchInput) {
                    const selectedUser = users.find(user => user.id === caData[selectInfo.approvalKey]);
                    if (selectedUser) {
                        searchInput.value = selectedUser.fullName;
                    }
                }
            }
        }
    });
    
    // Populate requester select
    const requesterSelect = document.getElementById('requesterSelect');
    if (requesterSelect) {
        requesterSelect.innerHTML = '<option value="" disabled>Select Requester</option>';
        
        users.forEach(user => {
            const option = document.createElement("option");
            option.value = user.id;
            option.textContent = user.fullName;
            requesterSelect.appendChild(option);
        });
        
        // Set the requester value from CA data if available
        if (caData && caData.requesterId) {
            requesterSelect.value = caData.requesterId;
            
            // Update the requester input to display the selected user's name
            const requesterInput = document.getElementById('requester');
            if (requesterInput) {
                const selectedRequester = users.find(user => user.id === caData.requesterId);
                if (selectedRequester) {
                    requesterInput.value = selectedRequester.fullName;
                }
            }
        }
    }
    
    // Find and populate the employee NIK using the stored employeeId
    if (window.currentEmployeeId) {
        const employee = users.find(user => user.id === window.currentEmployeeId);
        if (employee) {
            // Use kansaiEmployeeId if available, otherwise use username or id
            const employeeIdentifier = employee.kansaiEmployeeId || employee.username || employee.id;
            document.getElementById('Employee').value = employeeIdentifier;
        }
    }
    
    // Set status select from stored data
    if (window.currentValues && window.currentValues.status) {
        const statusSelect = document.getElementById('docStatus');
        if (statusSelect) {
            statusSelect.innerHTML = '';
            const option = document.createElement('option');
            option.value = window.currentValues.status;
            option.textContent = window.currentValues.status;
            option.selected = true;
            statusSelect.appendChild(option);
        }
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
        
        // Handle requester dropdown
        const requesterDropdown = document.getElementById('requesterDropdown');
        const requesterInput = document.getElementById('requester');
        if (requesterDropdown && requesterInput && !requesterInput.contains(event.target) && !requesterDropdown.contains(event.target)) {
            requesterDropdown.classList.add('hidden');
        }
    });
}

// Function to approve CA (receive)
function approveCash() {
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
                window.location.href = '../../../dashboard/dashboardReceive/cashAdvance/menuCashReceive.html';
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

    let statusAt, successMessage, redirectUrl;
    
    if (status === 'revise') {
        statusAt = "Revise";
        successMessage = 'Cash Advance revision submitted successfully';
        redirectUrl = '../../../dashboard/dashboardRevision/cashAdvance/menuCashRevision.html';
    } else {
        statusAt = "Receive";
        successMessage = `CA ${status === 'approve' ? 'received' : 'rejected'} successfully`;
        redirectUrl = '../../../dashboard/dashboardReceive/cashAdvance/menuCashReceive.html';
    }

    const requestData = {
        id: caId,
        UserId: userId,
        StatusAt: statusAt,
        Action: status,
        Remarks: remarks || ''
    };

    // Show loading
    Swal.fire({
        title: status === 'revise' ? 'Processing Revision...' : `${status === 'approve' ? 'Receiving' : 'Rejecting'}...`,
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
                text: successMessage,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                window.location.href = redirectUrl;
            });
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to ${status === 'revise' ? 'submit revision' : status + ' CA'}. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error ${status === 'revise' ? 'submitting revision' : (status === 'approve' ? 'receiving' : 'rejecting') + ' CA'}: ` + error.message
        });
    });
}

function goToMenuReceiveCash() {
    window.location.href = "../../../dashboard/dashboardReceive/cashAdvance/menuCashReceive.html";
}

// Function to toggle editable fields based on CA status (similar to detailCash.js)
function toggleEditableFields(isEditable) {
    // List all input fields that should be controlled by editable state
    const editableFields = [
        'purposed',
        'paidTo',
        'postingDate',
        'remarks'
    ];
    
    // Fields that should always be disabled/readonly (autofilled)
    const alwaysDisabledFields = [
        'invno',
        'Employee',
        'EmployeeName',
        'docStatus'
    ];
    
    // Toggle editable fields
    editableFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            if ((field.tagName === 'INPUT' && field.type !== 'checkbox' && field.type !== 'radio') || field.tagName === 'TEXTAREA') {
                field.readOnly = !isEditable;
            } else {
                field.disabled = !isEditable;
            }
            
            // Visual indication for non-editable fields
            if (!isEditable) {
                field.classList.add('bg-gray-100', 'cursor-not-allowed');
            } else {
                field.classList.remove('bg-gray-100', 'cursor-not-allowed');
                field.classList.add('bg-white');
            }
        }
    });
    
    // Always keep autofilled fields disabled and gray
    alwaysDisabledFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            if ((field.tagName === 'INPUT' && field.type !== 'checkbox' && field.type !== 'radio') || field.tagName === 'TEXTAREA') {
                field.readOnly = true;
            } else {
                field.disabled = true;
            }
            field.classList.add('bg-gray-100', 'cursor-not-allowed');
        }
    });
    
    // Handle department and transaction type selects
    const departmentSelect = document.getElementById('department');
    const transactionTypeSelect = document.getElementById('typeTransaction');
    
    if (departmentSelect) {
        departmentSelect.disabled = !isEditable;
        if (!isEditable) {
            departmentSelect.classList.add('bg-gray-100', 'cursor-not-allowed');
        } else {
            departmentSelect.classList.remove('bg-gray-100', 'cursor-not-allowed');
        }
    }
    
    if (transactionTypeSelect) {
        transactionTypeSelect.disabled = !isEditable;
        if (!isEditable) {
            transactionTypeSelect.classList.add('bg-gray-100', 'cursor-not-allowed');
        } else {
            transactionTypeSelect.classList.remove('bg-gray-100', 'cursor-not-allowed');
        }
    }
    
    // Handle table inputs
    const tableInputs = document.querySelectorAll('#tableBody input');
    tableInputs.forEach(input => {
        input.readOnly = !isEditable;
        if (!isEditable) {
            input.classList.add('bg-gray-100', 'cursor-not-allowed');
        } else {
            input.classList.remove('bg-gray-100', 'cursor-not-allowed');
        }
    });
    
    // Handle Add Row button and delete buttons
    const addRowButton = document.querySelector('button[onclick="addRow()"]');
    if (addRowButton) {
        if (!isEditable) {
            addRowButton.style.display = 'none';
        } else {
            addRowButton.style.display = 'inline-block';
        }
    }
    
    // Handle delete row buttons
    const deleteButtons = document.querySelectorAll('button[onclick="deleteRow(this)"]');
    deleteButtons.forEach(button => {
        if (!isEditable) {
            button.style.display = 'none';
        } else {
            button.style.display = 'inline-block';
        }
    });
    
    // Disable file upload input when not editable
    const fileInput = document.getElementById('Reference');
    if (fileInput) {
        fileInput.disabled = !isEditable;
        if (!isEditable) {
            fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        } else {
            fileInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
        }
    }
    
    // Handle requester search field
    const requesterField = document.getElementById('requester');
    if (requesterField) {
        requesterField.readOnly = !isEditable;
        if (!isEditable) {
            requesterField.classList.add('bg-gray-50');
            requesterField.removeAttribute('onkeyup');
        } else {
            requesterField.classList.remove('bg-gray-50');
            requesterField.setAttribute('onkeyup', 'filterRequesters()');
        }
    }
    
    // Handle approval search fields - make them editable if status is Revision
    const approvalSearchFields = [
        'preparedBySearch', 'checkedBySearch', 'acknowledgedBySearch', 
        'approvedBySearch', 'receivedBySearch', 'closedBySearch'
    ];
    
    approvalSearchFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.readOnly = !isEditable;
            if (!isEditable) {
                field.classList.add('bg-gray-50');
                // Remove the onkeyup event to prevent search triggering
                field.removeAttribute('onkeyup');
            } else {
                field.classList.remove('bg-gray-50');
                // Re-enable search functionality
                const fieldName = fieldId.replace('Search', '');
                field.setAttribute('onkeyup', `filterUsers('${fieldName}')`);
            }
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
    const fileInput = document.getElementById('Reference');
    let fileNames = Array.from(files).map(file => file.name).join(', ');
    if (fileNames) {
        fileInput.title = fileNames;
    }
} 