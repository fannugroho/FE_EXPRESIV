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
                
                // Update closedBy visibility based on transaction type
                toggleClosedBy();
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
  
    // Format and set dates
    const submissionDate = data.submissionDate ? data.submissionDate.split('T')[0] : '';
    document.getElementById('postingDate').value = submissionDate;
    document.getElementById('remarks').value = data.remarks || '';
    
    // Set transaction type - create option directly from backend data
    const transactionTypeSelect = document.getElementById('typeTransaction');
    if (data.transactionType && transactionTypeSelect) {
        transactionTypeSelect.innerHTML = ''; // Clear existing options
        const option = document.createElement('option');
        option.value = data.transactionType;
        option.textContent = data.transactionType;
        option.selected = true;
        transactionTypeSelect.appendChild(option);
        
        // Call toggleClosedBy after setting transaction type
        if (typeof toggleClosedBy === 'function') {
            toggleClosedBy();
        }
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
        const statusSelect = document.getElementById('docStatus');
        if (statusSelect) {
            statusSelect.innerHTML = ''; // Clear existing options
            const option = document.createElement('option');
            option.value = data.status;
            option.textContent = data.status;
            option.selected = true;
            statusSelect.appendChild(option);
        }
    }
    
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
    
    // Make all fields read-only since this is a close page
    makeAllFieldsReadOnly();
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
    fetchUsers(caData);
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

// Function to filter users for the search dropdown in approval section
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
                case 'closedBy': selectId = 'Closed'; break;
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

// Function to populate user select dropdowns
function populateUserSelects(users, caData = null) {
    // Store users globally for search functionality
    window.allUsers = users;
    
    const selects = [
        { id: 'prepared', approvalKey: 'preparedById', searchId: 'preparedBySearch' },
        { id: 'Checked', approvalKey: 'checkedById', searchId: 'checkedBySearch' },
        { id: 'Acknowledged', approvalKey: 'acknowledgedById', searchId: 'acknowledgedBySearch' },
        { id: 'Approved', approvalKey: 'approvedById', searchId: 'approvedBySearch' },
        { id: 'Received', approvalKey: 'receivedById', searchId: 'receivedBySearch' },
        { id: 'Closed', approvalKey: 'closedById', searchId: 'closedBySearch' }
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
                        const userName = selectedUser.fullName;
                        searchInput.value = userName;
                    }
                }
            }
        }
    });
    
    // Find and populate the employee NIK using the stored employeeId
    if (window.currentEmployeeId) {
        const employee = users.find(user => user.id === window.currentEmployeeId);
        if (employee) {
            // Use kansaiEmployeeId if available, otherwise use username or id
            const employeeIdentifier = employee.kansaiEmployeeId || employee.username || employee.id;
            document.getElementById('Employee').value = employeeIdentifier;
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
    });
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
    
    // Hide add row button
    const addRowButton = document.querySelector('button[onclick="addRow()"]');
    if (addRowButton) {
        addRowButton.style.display = 'none';
    }
    
    // Hide all delete row buttons
    const deleteButtons = document.querySelectorAll('button[onclick="deleteRow(this)"]');
    deleteButtons.forEach(button => {
        button.style.display = 'none';
    });
    
    // Disable file upload
    const fileInput = document.getElementById('Reference');
    if (fileInput) {
        fileInput.disabled = true;
        fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
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