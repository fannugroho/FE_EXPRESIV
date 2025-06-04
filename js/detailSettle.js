// Global variable for file uploads
let uploadedFiles = [];
let settlementData = null;

// Function to fetch all dropdown options
function fetchDropdownOptions(approvalData = null) {
    fetchDepartments();
    fetchUsers(approvalData);
    fetchTransactionType();
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
            console.log("Department data:", data);
            populateDepartmentSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching departments:', error);
        });
}

// Function to populate department select
function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("department");
    if (!departmentSelect) return;
    
    // Store the currently selected value
    const currentValue = departmentSelect.value;
    const currentText = departmentSelect.options[departmentSelect.selectedIndex]?.text;
    
    departmentSelect.innerHTML = '<option value="" disabled>Select Department</option>';

    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.id;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
        
        // If this department matches the current text, select it
        if (department.name === currentText) {
            option.selected = true;
        }
    });
    
    // If we have a current value and it wasn't matched by text, try to select by value
    if (currentValue && departmentSelect.value !== currentValue) {
        departmentSelect.value = currentValue;
    }
}

// Function to fetch users from API
function fetchUsers(approvalData = null) {
    fetch(`${BASE_URL}/api/users`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("User data:", data);
            populateUserSelects(data.data, approvalData);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
}

// Function to populate user selects
function populateUserSelects(users, approvalData = null) {
    // Store users globally for search functionality
    window.requesters = users.map(user => ({
        id: user.id,
        fullName: user.name || `${user.firstName} ${user.middleName} ${user.lastName}`,
        department: user.department
    }));
    
    // Store employees globally for reference
    window.employees = users.map(user => ({
        id: user.id,
        kansaiEmployeeId: user.kansaiEmployeeId,
        fullName: user.name || `${user.firstName} ${user.middleName} ${user.lastName}`,
        department: user.department
    }));

    // Populate RequesterId dropdown with search functionality (like addCash.js)
    const requesterSelect = document.getElementById("RequesterId");
    if (requesterSelect) {
        // Clear existing options first
        requesterSelect.innerHTML = '<option value="">Select a requester</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name || `${user.firstName} ${user.lastName}`;
            requesterSelect.appendChild(option);
        });
    }

    // Setup search functionality for requester
    const requesterSearchInput = document.getElementById('requesterSearch');
    const requesterDropdown = document.getElementById('requesterDropdown');
    
    if (requesterSearchInput && requesterDropdown) {
        // Function to filter requesters
        window.filterRequesters = function() {
            const searchText = requesterSearchInput.value.toLowerCase();
            populateRequesterDropdown(searchText);
            requesterDropdown.classList.remove('hidden');
        };

        // Function to populate dropdown with filtered requesters
        function populateRequesterDropdown(filter = '') {
            requesterDropdown.innerHTML = '';
            
            const filteredRequesters = window.requesters.filter(r => 
                r.fullName.toLowerCase().includes(filter)
            );
            
            filteredRequesters.forEach(requester => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerText = requester.fullName;
                option.onclick = function() {
                    requesterSearchInput.value = requester.fullName;
                    document.getElementById('RequesterId').value = requester.id;
                    // Auto-fill the paidTo field with the selected requester name
                    const paidToField = document.getElementById('paidTo');
                    if (paidToField) {
                        paidToField.value = requester.fullName;
                    }
                    requesterDropdown.classList.add('hidden');
                    //update department
                    const departmentSelect = document.getElementById('departmentId');
                    if (requester.department) {
                        // Find the department option and select it
                        const departmentOptions = departmentSelect.options;
                        for (let i = 0; i < departmentOptions.length; i++) {
                            if (departmentOptions[i].textContent === requester.department) {
                                departmentSelect.selectedIndex = i;
                                break;
                            }
                        }
                        // If no matching option found, create and select a new one
                        if (departmentSelect.value === "" || departmentSelect.selectedIndex === 0) {
                            const newOption = document.createElement('option');
                            newOption.value = requester.department;
                            newOption.textContent = requester.department;
                            newOption.selected = true;
                            departmentSelect.appendChild(newOption);
                        }
                    }
                };
                requesterDropdown.appendChild(option);
            });
            
            if (filteredRequesters.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No matching requesters';
                requesterDropdown.appendChild(noResults);
            }
        }

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!requesterSearchInput.contains(event.target) && !requesterDropdown.contains(event.target)) {
                requesterDropdown.classList.add('hidden');
            }
        });

        // Initial population
        populateRequesterDropdown();
    }

    const selects = [
        { id: 'preparedById', approvalKey: 'preparedById' },
        { id: 'checkedById', approvalKey: 'checkedById' },
        { id: 'approvedById', approvalKey: 'approvedById' },
        { id: 'acknowledgedById', approvalKey: 'acknowledgedById' }
    ];
    
    selects.forEach(selectInfo => {
        const select = document.getElementById(selectInfo.id);
        if (select) {
            // Store the currently selected value
            const currentValue = select.value;
            
            select.innerHTML = '<option value="" disabled>Select User</option>';
            
            users.forEach(user => {
                const option = document.createElement("option");
                option.value = user.id;
                option.textContent = user.name || `${user.firstName} ${user.lastName}`;
                select.appendChild(option);
            });
            
            // Set the value from approval data if available
            if (approvalData && approvalData[selectInfo.approvalKey]) {
                select.value = approvalData[selectInfo.approvalKey];
                // Auto-select and disable for Prepared by if it matches logged in user
                if(selectInfo.id === "preparedById" && approvalData[selectInfo.approvalKey] == getUserId()){
                    select.disabled = true;
                }
            } else if (currentValue) {
                // Restore the selected value if it exists
                select.value = currentValue;
            }
            
            // Always disable and auto-select preparedById to logged-in user
            if(selectInfo.id === "preparedById"){
                const loggedInUserId = getUserId();
                if(loggedInUserId) {
                    select.value = loggedInUserId;
                    select.disabled = true;
                }
            }
        }
    });
    
    // Auto-populate employee fields with logged-in user data (same as addCash)
    const loggedInUserId = getUserId();
    console.log("Logged in user ID:", loggedInUserId);
    console.log("Available employees:", window.employees);
    
    if(loggedInUserId && window.employees) {
        const loggedInEmployee = window.employees.find(emp => emp.id === loggedInUserId);
        console.log("Found logged in employee:", loggedInEmployee);
        
        if(loggedInEmployee) {
            const employeeNIK = loggedInEmployee.kansaiEmployeeId || '';
            const employeeName = loggedInEmployee.fullName || '';
            
            // Auto-fill employee fields
            document.getElementById("requester").value = employeeNIK;
            document.getElementById("requesterName").value = employeeName;
            
            console.log("Auto-populated employee fields:", {
                employeeNIK: employeeNIK,
                employeeName: employeeName
            });
        } else {
            console.warn("Could not find logged in employee in employees array");
        }
    } else {
        console.warn("Missing logged in user ID or employees array");
    }
}

// Function to fetch transaction types from API
function fetchTransactionType() {
    fetch(`${BASE_URL}/api/transactiontypes`)
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
            console.error('Error fetching transaction type:', error);
        });
}

// Function to populate transaction type select
function populateTransactionTypeSelect(transactionTypes) {
    const transactionTypeSelect = document.getElementById("transactionType");
    if (!transactionTypeSelect) return;
    
    // Store the currently selected value
    const currentValue = transactionTypeSelect.value;
    const currentText = transactionTypeSelect.options[transactionTypeSelect.selectedIndex]?.text;
    
    transactionTypeSelect.innerHTML = '<option value="" disabled>Select Transaction Type</option>';

    transactionTypes.forEach(transactionType => {
        const option = document.createElement("option");
        option.value = transactionType.name;
        option.textContent = transactionType.name;
        transactionTypeSelect.appendChild(option);
        
        // If this transaction type matches the current text, select it
        if (transactionType.name === currentText) {
            option.selected = true;
        }
    });

    
    
    // If we have a current value and it wasn't matched by text, try to select by value
    if (currentValue && transactionTypeSelect.value !== currentValue) {
        transactionTypeSelect.value = currentValue;
    }
}

// Get settlement ID from URL parameters
function getSettlementIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('settle-id');
}

// Fetch settlement data from API
async function fetchSettlementData(settlementId) {
    try {
        const response = await fetch(`${BASE_URL}/api/settlements/${settlementId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.status && result.code === 200) {
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to fetch settlement data');
            }
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching settlement data:', error);
        alert('Error loading settlement data: ' + error.message);
        return null;
    }
}

// Populate form fields with settlement data
function populateFormWithData(data) {
    settlementData = data;

    console.log(data);

    // Basic settlement information
    document.getElementById('settlementNumber').value = data.settlementNumber || '';
    
    // Auto-populate employee fields with data from API (but don't override auto-filled logged-in user data)
    if (!document.getElementById("requester").value) {
        // Handle employee - find user by ID and use kansaiEmployeeId
        if (data.requester && window.employees) {
            const employee = window.employees.find(emp => emp.id === data.requester);
            if (employee && employee.kansaiEmployeeId) {
                document.getElementById('requester').value = employee.kansaiEmployeeId;
            } else {
                // Fallback to original value if not found
                document.getElementById('requester').value = data.requester;
            }
        }
    }

  
    document.getElementById('transactionType').value = data.transactionType;
    if (!document.getElementById("requesterName").value) {
        document.getElementById('requesterName').value = data.requesterName || '';
    }
    
    // Handle requester name with search functionality  
    if (data.requesterName) {
        document.getElementById('requesterSearch').value = data.requesterName;
        // Store the requester ID if available - since options are pre-populated, we can directly set the value
        if (data.requesterId) {
            // Always store in global variable as backup
            window.settlementRequesterId = data.requesterId;
            
            const requesterIdElement = document.getElementById('RequesterId');
            if (requesterIdElement) {
                requesterIdElement.value = data.requesterId;
            } else {
                console.warn("RequesterId element not found in DOM, but stored in global variable");
            }
        } else {
            console.error("No requesterId found in API data - this is a business logic error");
        }
    }
    
    document.getElementById('settlementRefNo').value = data.settlementRefNo || '';
    document.getElementById('purpose').value = data.purpose || '';
    
    // Set transaction type
    if (data.transactionType) {
        document.getElementById('transactionType').value = data.transactionType;
    }
    
    // Set department to Finance as specified
    document.getElementById('department').value = data.departmentId;
    
    // Format and set submission date
    if (data.submissionDate) {
        const date = new Date(data.submissionDate);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('submissionDate').value = formattedDate;
    }
    
    // Set status
    document.getElementById('status').value = data.status || '';
    
    // Set cash advance reference ID
    if (data.cashAdvanceReferenceId) {
        document.getElementById('cashAdvanceReferenceId').value = data.cashAdvanceReferenceId;
    }
    
    // Set remarks
    document.getElementById('remarks').value = data.remarks || '';

    // Populate settlement items table
    populateSettlementItemsTable(data.settlementItems || []);

    // Populate approval section
    if (data) {
        populateApprovalSection(data);
    }

    // Check if status is not Draft and make fields read-only
    if (data.status && data.status.toLowerCase() !== 'draft') {
        makeAllFieldsReadOnlyForNonDraft();
    }

    // Fetch dropdown options with approval data
    fetchDropdownOptions(data);
}

// Populate settlement items table
function populateSettlementItemsTable(settlementItems) {
    const tableBody = document.getElementById('tableBody');
    
    // Clear existing rows
    tableBody.innerHTML = '';

    if (settlementItems.length === 0) {
        // Add empty row if no items
        addEmptyRow();
        return;
    }

    // Add rows for each settlement item
    settlementItems.forEach((item, index) => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td class="p-2 border">
                <input type="text" value="${item.description || ''}" maxlength="200" class="w-full" />
            </td>
            <td class="p-2 border">
                <input type="text" value="${item.glAccount || ''}" maxlength="200" class="w-full" />
            </td>
            <td class="p-2 border">
                <input type="text" value="${item.accountName || ''}" maxlength="200" class="w-full" />
            </td>
            <td class="p-2 border">
                <input type="number" value="${item.amount || 0}" maxlength="200" class="w-full" />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
        `;
        tableBody.appendChild(newRow);
    });
}

// Populate approval section
function populateApprovalSection(approval) {
    // Set approval IDs and checkbox states
    if (approval.preparedById) {
        document.getElementById('preparedById').value = approval.preparedById;
        document.getElementById('preparedCheckbox').checked = approval.isPrepared || false;
    }
    
    if (approval.checkedById) {
        console.log("checkedById:", approval.checkedById);
        document.getElementById('checkedById').value = approval.checkedById;
        document.getElementById('checkedCheckbox').checked = approval.isChecked || false;
    }
    
    if (approval.approvedById) {
        console.log("approvedById:", approval.approvedById);
        document.getElementById('approvedById').value = approval.approvedById;
        document.getElementById('approvedCheckbox').checked = approval.isApproved || false;
    }
    
    if (approval.acknowledgedById) {
        console.log("acknowledgedById:", approval.acknowledgedById);
        document.getElementById('acknowledgedById').value = approval.acknowledgedById;
        document.getElementById('acknowledgedCheckbox').checked = approval.isAcknowledged || false;
    }
}

// Add empty row to table
function addEmptyRow() {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="number" maxlength="200" class="w-full" />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
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

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="number" maxlength="200" class="w-full" />
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

function goToMenuSettle() {
    window.location.href = "../pages/MenuSettle.html";
}

function displayFileList() {
    console.log('Uploaded files:', uploadedFiles);
}

// Add function to fetch and populate cash advance dropdown
async function loadCashAdvanceOptions() {
    const dropdown = document.getElementById('cashAdvanceReferenceId');
    
    try {
        // Show loading state
        dropdown.innerHTML = '<option value="" disabled selected>Loading...</option>';
        
        const response = await fetch(`${BASE_URL}/api/cash-advance`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Clear dropdown and add default option
        dropdown.innerHTML = '<option value="" disabled selected>Select Cash Advance</option>';
        
        // Populate dropdown with API data
        if (responseData.status && responseData.data && Array.isArray(responseData.data)) {
            responseData.data.forEach(cashAdvance => {
                const option = document.createElement('option');
                option.value = cashAdvance.id;
                option.textContent = cashAdvance.cashAdvanceNo;
                dropdown.appendChild(option);
            });
        } else {
            dropdown.innerHTML = '<option value="" disabled selected>No data available</option>';
        }
        
    } catch (error) {
        console.error('Error loading cash advance options:', error);
        dropdown.innerHTML = '<option value="" disabled selected>Error loading data</option>';
    }
}

async function confirmDelete() {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'You are about to delete this settlement. This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
        const settlementId = getSettlementIdFromUrl();
        if (settlementId) {
            // Show loading state
            Swal.fire({
                title: 'Deleting...',
                text: 'Please wait while we delete the settlement.',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                // Implement delete API call
                const response = await fetch(`${BASE_URL}/api/settlements/${settlementId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.status === 204) {
                    // Success - Settlement deleted
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Settlement has been deleted successfully.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        // Redirect to menu after successful deletion
                        window.location.href = "../pages/MenuSettle.html";
                    });
                } else if (response.status === 500) {
                    // Note: API currently returns 500 for not found cases, should be 404
                    // TODO: Update API to return 404 status code when settlement ID is not found
                    const errorData = await response.json();
                    Swal.fire({
                        title: 'Error!',
                        text: errorData.Message || 'Failed to delete settlement.',
                        icon: 'error'
                    });
                } else {
                    // Other error status codes
                    Swal.fire({
                        title: 'Error!',
                        text: `Failed to delete settlement. Status: ${response.status}`,
                        icon: 'error'
                    });
                }
            } catch (error) {
                console.error('Error deleting settlement:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Network error occurred while deleting settlement.',
                    icon: 'error'
                });
            }
        } else {
            Swal.fire({
                title: 'Error!',
                text: 'Settlement ID not found.',
                icon: 'error'
            });
        }
    }
}

function updateSettle(isSubmit = false) {
    const actionText = isSubmit ? 'Submit' : 'Update';
    const actionConfirmText = isSubmit ? 'submit' : 'update';
    
    Swal.fire({
        title: `${actionText} Settlement`,
        text: `Are you sure you want to ${actionConfirmText} this settlement?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: `Yes, ${actionConfirmText} it!`,
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Get the ID from URL parameters
            const settlementId = getSettlementIdFromUrl();
            
            if (!settlementId) {
                Swal.fire('Error!', 'Settlement ID not found.', 'error');
                return;
            }

            // Show loading
            Swal.fire({
                title: `${actionText.slice(0, -1)}ing...`,
                text: `Please wait while we ${actionConfirmText} the settlement.`,
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Create FormData object
            const formData = new FormData();
            
            // Add all form fields to FormData
            formData.append('SettlementNumber', document.getElementById("settlementNumber").value);
            formData.append('KansaiEmployeeId', document.getElementById("requester").value);
            console.log("KansaiEmployeeId:", document.getElementById("requester").value);
            formData.append('SettlementRefNo', document.getElementById("settlementRefNo").value);
            formData.append('Purpose', document.getElementById("purpose").value);
            formData.append('TransactionType', document.getElementById("transactionType").value);
            formData.append('Department', document.getElementById("department").value);
            formData.append('SubmissionDate', document.getElementById("submissionDate").value);
            formData.append('CashAdvanceReferenceId', document.getElementById("cashAdvanceReferenceId").value);
            formData.append('Remarks', document.getElementById("remarks").value);
            
            // Approval fields
            formData.append('PreparedById', document.getElementById("preparedById")?.value || '');
            formData.append('CheckedById', document.getElementById("checkedById")?.value || '');
            formData.append('ApprovedById', document.getElementById("approvedById")?.value || '');
            formData.append('AcknowledgedById', document.getElementById("acknowledgedById")?.value || '');
            
            // Add SettlementItems - collect all rows from the table
            const tableRows = document.querySelectorAll('#tableBody tr');
            tableRows.forEach((row, index) => {
                const description = row.children[0]?.querySelector('input')?.value;
                const glAccount = row.children[1]?.querySelector('input')?.value;
                const accountName = row.children[2]?.querySelector('input')?.value;
                const amount = row.children[3]?.querySelector('input')?.value;
                
                if (description && amount) {
                    formData.append(`SettlementItems[${index}][Description]`, description);
                    formData.append(`SettlementItems[${index}][GLAccount]`, glAccount || '');
                    formData.append(`SettlementItems[${index}][AccountName]`, accountName || '');
                    console.log("Amount:", amount);
                    console.log("accountName:", accountName);
                    console.log("glAccount:", glAccount);
                    console.log("description:", description);
                    formData.append(`SettlementItems[${index}][Amount]`, amount);
                }
            });

            // Set IsSubmit based on the parameter
            formData.append('IsSubmit', isSubmit);
            
            // Call the PUT API
            fetch(`${BASE_URL}/api/settlements/${settlementId}`, {
                method: 'PUT',
                body: formData
            })
            .then(response => {
                if (response.status === 200 || response.status === 204) {
                    // Success
                    Swal.fire({
                        title: 'Success!',
                        text: `Settlement has been ${isSubmit ? 'submitted' : 'updated'} successfully.`,
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        // Refresh the page to show updated data
                        location.reload();
                    });
                } else {
                    // Error handling
                    return response.json().then(data => {
                        console.log("Error:", data);
                        throw new Error(data.message || `Failed to ${actionConfirmText}: ${response.status}`);
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error!',
                    text: `Failed to ${actionConfirmText} Settlement: ${error.message}`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            });
        }
    });
}

// Function to make all fields read-only when status is not Draft
function makeAllFieldsReadOnlyForNonDraft() {
    console.log('Status is not Draft - making all fields read-only');
    
    // Make all input fields read-only
    const inputFields = document.querySelectorAll('input[type="text"], input[type="date"], input[type="number"], input[type="file"], textarea');
    inputFields.forEach(field => {
        field.readOnly = true;
        field.disabled = true;
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
    
    // Hide action buttons (Update, Submit, Delete)
    const actionButtons = document.querySelectorAll('button[onclick*="updateSettle"], button[onclick*="confirmDelete"]');
    actionButtons.forEach(button => {
        button.style.display = 'none';
    });
    
    // Hide add row button
    const addRowButton = document.querySelector('button[onclick="addRow()"]');
    if (addRowButton) {
        addRowButton.style.display = 'none';
    }
    
    // Hide all delete row buttons in table
    const deleteButtons = document.querySelectorAll('button[onclick="deleteRow(this)"]');
    deleteButtons.forEach(button => {
        button.style.display = 'none';
    });
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Load cash advance options and other dropdown options first
    await loadCashAdvanceOptions();
    fetchDropdownOptions();
    
    // Get settlement ID from URL
    const settlementId = getSettlementIdFromUrl();
    
    if (!settlementId) {
        alert('Settlement ID not found in URL');
        return;
    }

    // Fetch and populate settlement data
    const data = await fetchSettlementData(settlementId);
    if (data) {
        populateFormWithData(data);
    }
}); 