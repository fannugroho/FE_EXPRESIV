let uploadedFiles = [];

let caId; // Declare global variable
let currentTab; // Declare global variable for tab

// Function to get available categories based on department and transaction type from API
async function getAvailableCategories(departmentId, transactionType) {
    if (!departmentId || !transactionType) return [];
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/categories?departmentId=${departmentId}&menu=Cash Advance&transactionType=${transactionType}`);
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        return data.data || data; // Handle both wrapped and direct array responses
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

// Function to get available account names based on category, department, and transaction type from API
async function getAvailableAccountNames(category, departmentId, transactionType) {
    if (!category || !departmentId || !transactionType) return [];
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/account-names?category=${encodeURIComponent(category)}&departmentId=${departmentId}&menu=Cash Advance&transactionType=${transactionType}`);
        if (!response.ok) {
            throw new Error('Failed to fetch account names');
        }
        const data = await response.json();
        return data.data || data; // Handle both wrapped and direct array responses
    } catch (error) {
        console.error('Error fetching account names:', error);
        return [];
    }
}

// Function to get COA based on category, account name, department, and transaction type from API
async function getCOA(category, accountName, departmentId, transactionType) {
    if (!category || !accountName || !departmentId || !transactionType) return '';
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/coa?category=${encodeURIComponent(category)}&accountName=${encodeURIComponent(accountName)}&departmentId=${departmentId}&menu=Cash Advance&transactionType=${transactionType}`);
        if (!response.ok) {
            throw new Error('Failed to fetch COA');
        }
        const data = await response.json();
        return data.data?.coa || data.coa || ''; // Handle different response structures
    } catch (error) {
        console.error('Error fetching COA:', error);
        return '';
    }
}

// Function to fetch CA details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    caId = urlParams.get('ca-id');
    currentTab = urlParams.get('tab'); // Get the tab parameter
    
    if (caId) {
        fetchCADetails(caId);
    }
    
    // Hide approve/reject buttons if viewing from acknowledged or rejected tabs
    if (currentTab === 'acknowledged' || currentTab === 'rejected') {
        hideApprovalButtons();
    }
    
    // Hide revision button if viewing from acknowledged or rejected tabs
    if (currentTab === 'acknowledged' || currentTab === 'rejected') {
        hideRevisionButton();
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
    
    // Make all fields read-only since this is an approval page
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
                <input type="text" value="${detail.category || ''}" class="category-input w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" value="${detail.accountName || ''}" class="account-name w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" value="${detail.coa || ''}" class="coa w-full bg-gray-100" readonly />
            </td>
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

function populateUserSelects(users, caData = null) {
    const selects = [
        { id: 'prepared', approvalKey: 'preparedById', searchId: 'preparedBySearch' },
        { id: 'Checked', approvalKey: 'checkedById', searchId: 'checkedBySearch' },
        { id: 'Acknowledged', approvalKey: 'acknowledgedById', searchId: 'knowledgeBySearch' },
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
                        searchInput.value = selectedUser.fullName;
                    }
                }
            }
        }
    });
    
    // Find and populate the employee NIK using the stored employeeId
    if (window.currentEmployeeId) {
        const employee = users.find(user => user.id === window.currentEmployeeId);
        if (employee) {
            // Use NIK if available, otherwise use username or id
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

// Function to approve CA (acknowledge)
function approveCash() {
    Swal.fire({
        title: 'Confirm Acknowledgment',
        text: 'Are you sure you want to acknowledge this Cash Advance?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Acknowledge',
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
        StatusAt: "Acknowledge",
        Action: status,
        Remarks: ''
    };

    // Show loading
    Swal.fire({
        title: `${status === 'approve' ? 'Acknowledging' : 'Processing'}...`,
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
                text: `CA ${status === 'approve' ? 'acknowledged' : 'rejected'} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                window.location.href = '../../../dashboard/dashboardAcknowledge/cashAdvance/menuCashAcknow.html';
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
            text: `Error ${status === 'approve' ? 'acknowledging' : 'rejecting'} CA: ` + error.message
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

    const requestData = {
        id: caId,
        UserId: userId,
        StatusAt: "Acknowledge",
        Action: status,
        Remarks: remarks || ''
    };

    // Show loading
    Swal.fire({
        title: `${status === 'approve' ? 'Acknowledging' : 'Rejecting'}...`,
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
                text: `CA ${status === 'approve' ? 'acknowledged' : 'rejected'} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                window.location.href = '../../../dashboard/dashboardAcknowledge/cashAdvance/menuCashAcknow.html';
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
            text: `Error ${status === 'approve' ? 'acknowledging' : 'rejecting'} CA: ` + error.message
        });
    });
}

function goToMenuCash() {
    window.location.href = "../../../dashboard/dashboardAcknowledge/cashAdvance/menuCashAcknow.html";
}

// Function for Back button navigation
function goToMenuAcknowCash() {
    window.location.href = "../../../dashboard/dashboardAcknowledge/cashAdvance/menuCashAcknow.html";
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
            <input type="text" class="category-input w-full bg-gray-100" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" class="account-name w-full bg-gray-100" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" class="coa w-full bg-gray-100" readonly />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" required />
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

// Function to make all fields read-only for approval view
function makeAllFieldsReadOnly() {
    // Make all input fields read-only except revision textarea
    const inputFields = document.querySelectorAll('input[type="text"]:not([id$="Search"]), input[type="date"], input[type="number"], textarea:not(#revision)');
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
    
    // Disable all checkboxes
    const checkboxFields = document.querySelectorAll('input[type="checkbox"]');
    checkboxFields.forEach(field => {
        field.disabled = true;
        field.classList.add('cursor-not-allowed');
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
    if (buttonContainer && currentTab !== 'prepared') {
        buttonContainer.style.display = 'none';
    }
}

// Function to hide revision button
function hideRevisionButton() {
    const revisionButton = document.querySelector('button[onclick="submitRevision()"]');
    const revisionBtn = document.getElementById('revisionBtn');
    
    if (revisionButton) {
        revisionButton.style.display = 'none';
    }
    if (revisionBtn) {
        revisionBtn.style.display = 'none';
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

// Function to submit revision with multiple fields
function submitRevision() {
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    
    // Check if revision button is disabled
    if (document.getElementById('revisionBtn').disabled) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Silakan tambahkan dan isi field revision terlebih dahulu'
        });
        return;
    }
    
    let allRemarks = '';
    
    revisionFields.forEach((field, index) => {
        // Include the entire content including the prefix
        if (field.value.trim() !== '') {
            if (allRemarks !== '') allRemarks += '\n\n';
            allRemarks += field.value.trim();
        }
    });
    
    if (revisionFields.length === 0 || allRemarks.trim() === '') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Silakan tambahkan dan isi field revision terlebih dahulu'
        });
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
            // Prepare revision data
            const revisionData = {
                id: caId,
                UserId: userId,
                Status: 'revise',
                RevisionRemarks: allRemarks.trim()
            };

            // Show loading
            Swal.fire({
                title: 'Submitting Revision...',
                text: 'Please wait while we process your revision request.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // TODO: Replace with actual revision API endpoint when available
            // For now, this is a dummy implementation
            console.log('Revision data to be sent:', revisionData);
            
            // Simulate API call delay
            setTimeout(() => {
                // TODO: Replace this simulation with actual API call
                /*
                fetch(`${BASE_URL}/api/cash-advance/revision`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(revisionData)
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        return response.json().then(errorData => {
                            throw new Error(errorData.message || `Failed to submit revision. Status: ${response.status}`);
                        });
                    }
                })
                .then(data => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Revision Submitted!',
                        text: 'Your revision request has been submitted successfully.',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        // Navigate back to the dashboard
                        window.location.href = '../../../dashboard/dashboardAcknowledge/cashAdvance/menuCashAcknow.html';
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Error submitting revision: ' + error.message
                    });
                });
                */
                
                // Dummy success response
                Swal.fire({
                    icon: 'success',
                    title: 'Revision Submitted!',
                    text: 'Your revision request has been submitted successfully. (This is a dummy response - integrate with actual API)',
                    timer: 3000,
                    showConfirmButton: true
                }).then(() => {
                    // Clear the revision fields
                    const revisionContainer = document.getElementById('revisionContainer');
                    revisionContainer.innerHTML = '';
                    revisionContainer.classList.add('hidden');
                    
                    // Reset add button
                    const addBtn = document.getElementById('addRevisionBtn');
                    addBtn.textContent = '+ Add revision';
                    addBtn.style.display = 'block';
                    
                    // Disable revision button again
                    const revisionBtn = document.getElementById('revisionBtn');
                    revisionBtn.disabled = true;
                    revisionBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    
                    // Optionally navigate back to dashboard
                    // window.location.href = '../../../dashboard/dashboardAcknowledge/cashAdvance/menuCashAcknow.html';
                });
            }, 1500); // Simulate API delay
        }
    });
}

// Function to toggle revision field visibility and add first field
function toggleRevisionField() {
    const container = document.getElementById('revisionContainer');
    const addBtn = document.getElementById('addRevisionBtn');
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    
    // Check if maximum limit is reached
    if (revisionFields.length >= 4) {
        Swal.fire({
            icon: 'warning',
            title: 'Batas Maksimal',
            text: 'Maksimal hanya 4 revision field yang diperbolehkan'
        });
        return;
    }
    
    // Check if current user already has a revision field
    if (hasUserAlreadyAddedRevision()) {
        Swal.fire({
            icon: 'warning',
            title: 'Sudah Ada Revision',
            text: 'Anda sudah menambahkan revision. Setiap user hanya diperbolehkan menambahkan satu revision.'
        });
        return;
    }
    
    if (container.classList.contains('hidden')) {
        // Show container and add first field
        container.classList.remove('hidden');
        addRevisionField();
        updateAddButton();
    } else {
        // Add another field
        addRevisionField();
        updateAddButton();
    }
}

// Function to add revision field
function addRevisionField() {
    const container = document.getElementById('revisionContainer');
    
    // Create wrapper div for the textarea and delete button
    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = 'flex items-center space-x-2 mt-2';
    
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
    deleteButton.title = 'Hapus field revision ini';
    deleteButton.onclick = function() {
        // Check if user can delete this field (only allow deleting own field)
        const userInfo = getUserInfo();
        const userPrefix = `[${userInfo.name} - ${userInfo.role}]: `;
        
        if (!newField.value.startsWith(userPrefix)) {
            Swal.fire({
                icon: 'error',
                title: 'Tidak Diizinkan',
                text: 'Anda hanya bisa menghapus revision field yang Anda buat sendiri'
            });
            return;
        }
        
        fieldWrapper.remove();
        checkRevisionButton(); // Update button state after removing a field
        checkRevisionContainer(); // Check if container should be hidden
    };
    
    // Add textarea and delete button to wrapper
    fieldWrapper.appendChild(newField);
    fieldWrapper.appendChild(deleteButton);
    
    // Add wrapper to container
    container.appendChild(fieldWrapper);
    
    // Update the revision button state
    checkRevisionButton();
    updateAddButton();
}

// Check if revision container should be hidden when all fields are removed
function checkRevisionContainer() {
    const container = document.getElementById('revisionContainer');
    const addBtn = document.getElementById('addRevisionBtn');
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    
    if (revisionFields.length === 0) {
        container.classList.add('hidden');
        addBtn.textContent = '+ Add revision';
        addBtn.style.display = 'block';
    } else {
        updateAddButton();
    }
}

// Check if current user already has a revision field
function hasUserAlreadyAddedRevision() {
    const userInfo = getUserInfo();
    const userPrefix = `[${userInfo.name} - ${userInfo.role}]: `;
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    
    for (let field of revisionFields) {
        if (field.value.startsWith(userPrefix)) {
            return true;
        }
    }
    return false;
}

// Update add button based on current state
function updateAddButton() {
    const addBtn = document.getElementById('addRevisionBtn');
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    const hasUserRevision = hasUserAlreadyAddedRevision();
    
    if (revisionFields.length >= 4) {
        // Maximum limit reached
        addBtn.textContent = 'Maksimal 4 revision tercapai';
        addBtn.style.display = 'none';
    } else if (hasUserRevision) {
        // User already has a revision
        addBtn.textContent = 'Anda sudah menambahkan revision';
        addBtn.style.display = 'none';
    } else {
        // User can still add revision
        if (revisionFields.length === 0) {
            addBtn.textContent = '+ Add revision';
        } else {
            addBtn.textContent = '+ Add more revision';
        }
        addBtn.style.display = 'block';
    }
}

// Function to get current user information
function getUserInfo() {
    // Use functions from auth.js to get user information
    let userName = 'Unknown User';
    let userRole = 'Acknowledger'; // Default role for this page since we're on the acknowledger page
    
    try {
        // Get user info from getCurrentUser function in auth.js
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.username) {
            userName = currentUser.username;
        }
        
        // Get user role based on the current page
        // Since we're on the acknowledger page, the role is Acknowledger
    } catch (e) {
        console.error('Error getting user info:', e);
    }
    
    return { name: userName, role: userRole };
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
    
    // Update revision button state
    checkRevisionButton();
}

// Check if revision remarks are filled to enable/disable revision button
function checkRevisionButton() {
    const revisionButton = document.getElementById('revisionBtn');
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

