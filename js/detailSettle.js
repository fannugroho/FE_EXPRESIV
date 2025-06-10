// Global variable for file uploads
let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep
let settlementData = null;
let currentRequesterData = null; // Store current requester data globally


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
            option.textContent = user.name || `${user.firstName} ${user.middleName} ${user.lastName}`;
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
                    
                    // Update global requester data
                    currentRequesterData = {
                        id: requester.id,
                        name: requester.fullName
                    };
                    console.log("Updated global requester data:", currentRequesterData);
                    
                    requesterDropdown.classList.add('hidden');
                    //update department
                    const departmentSelect = document.getElementById('department');
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

    // Populate approval select dropdowns with search functionality
    const approvalSelects = [
        { id: 'preparedDropdown', searchId: 'preparedDropdownSearch', approvalKey: 'preparedById' },
        { id: 'checkedDropdown', searchId: 'checkedDropdownSearch', approvalKey: 'checkedById' },
        { id: 'approvedDropdown', searchId: 'approvedDropdownSearch', approvalKey: 'approvedById' },
        { id: 'acknowledgedDropdown', searchId: 'acknowledgedDropdownSearch', approvalKey: 'acknowledgedById' }
    ];
    
    approvalSelects.forEach(selectInfo => {
        const select = document.getElementById(selectInfo.id);
        const searchInput = document.getElementById(selectInfo.searchId);
        
        if (select && searchInput) {
            // Clear and populate the hidden select
            select.innerHTML = '<option value="" disabled>Select User</option>';
            
            users.forEach(user => {
                const option = document.createElement("option");
                option.value = user.id;
                option.textContent = user.name || `${user.firstName} ${user.middleName} ${user.lastName}`;
                select.appendChild(option);
            });
            
            // Set the value from approval data if available and update search input
            if (approvalData && approvalData[selectInfo.approvalKey]) {
                select.value = approvalData[selectInfo.approvalKey];
                
                // Find the user and update the search input
                const selectedUser = users.find(user => user.id === approvalData[selectInfo.approvalKey]);
                if (selectedUser) {
                    searchInput.value = selectedUser.name || `${selectedUser.firstName} ${selectedUser.lastName}`;
                }
                
                // Auto-select and disable for Prepared by if it matches logged in user
                if(selectInfo.id === "preparedDropdown" && select.value == getUserId()){
                    searchInput.disabled = true;
                    searchInput.classList.add('bg-gray-100');
                }
            }
            
            // Always disable and auto-select preparedDropdown to logged-in user
            if(selectInfo.id === "preparedDropdown"){
                const loggedInUserId = getUserId();
                if(loggedInUserId) {
                    select.value = loggedInUserId;
                    const loggedInUser = users.find(user => user.id === loggedInUserId);
                    if(loggedInUser) {
                        searchInput.value = loggedInUser.name || `${loggedInUser.firstName} ${loggedInUser.lastName}`;
                    }
                    searchInput.disabled = true;
                    searchInput.classList.add('bg-gray-100');
                }
            }
        }
    });
}

// Function to filter users for approval dropdowns (like addSettle.js)
function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    // Filter users based on search text
    const filteredUsers = window.employees ? 
        window.employees.filter(user => user.fullName.toLowerCase().includes(searchText)) : 
        [];
    
    // Show filtered results
    filteredUsers.forEach(user => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        option.innerText = user.fullName;
        option.onclick = function() {
            searchInput.value = user.fullName;
            document.getElementById(fieldId).value = user.id;
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(option);
    });
    
    // Show "no results" message if no users found
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'No matching users';
        dropdown.appendChild(noResults);
    }
    
    // Show dropdown
    dropdown.classList.remove('hidden');
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
    
    // Note: Settlement API doesn't have separate employeeId/employeeName fields like cash advance
    // The employee fields (requester/requesterName inputs) will be auto-populated by populateUserSelects with logged-in user data
    // The data.requester and data.requesterName represent the actual requester (who the settlement is for)

    document.getElementById('transactionType').value = data.transactionType;
    
    // Handle requester name with search functionality  
    // This represents who the settlement is FOR (the actual requester)
    if (data.requesterName) {
        // Store requester data globally for later use
        currentRequesterData = {
            id: data.requester,
            name: data.requesterName
        };
        
        document.getElementById('requesterSearch').value = data.requesterName;
        // Store the requester ID if available - since options are pre-populated, we can directly set the value
        if (data.requester) {
            // Always store in global variable as backup
            window.settlementRequesterId = data.requester;
            
            const requesterIdElement = document.getElementById('RequesterId');
            if (requesterIdElement) {
                requesterIdElement.value = data.requester;
                console.log("RequesterId element value:", requesterIdElement.value);
            } else {
                console.warn("RequesterId element not found in DOM, but stored in global variable");
            }
        } else {
            console.error("No requester found in API data - this is a business logic error");
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
    
    // Format and set submission date - extract date part directly to avoid timezone issues
    if (data.submissionDate) {
        const formattedDate = data.submissionDate.split('T')[0];
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

    // Check if editable after populating data
    const isEditable = data.status === 'Draft';
    toggleEditableFields(isEditable);

    // Fetch dropdown options with approval data
    fetchDropdownOptions(data);

    // Store and display attachments
    if (data.attachments) {
        existingAttachments = data.attachments;
        attachmentsToKeep = data.attachments.map(att => att.id); // Initially keep all existing attachments
    }
    displayAttachments(data.attachments || []);
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
            <td class="p-2 border gray-column">
                <input type="text" value="${item.glAccount || ''}" maxlength="200" class="w-full bg-gray-100" disabled />
            </td>
            <td class="p-2 border gray-column">
                <input type="text" value="${item.accountName || ''}" maxlength="200" class="w-full bg-gray-100" disabled />
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
    // Set approval IDs and update search inputs
    const approvalFields = [
        { selectId: 'preparedDropdown', searchId: 'preparedDropdownSearch', value: approval.preparedById },
        { selectId: 'checkedDropdown', searchId: 'checkedDropdownSearch', value: approval.checkedById },
        { selectId: 'approvedDropdown', searchId: 'approvedDropdownSearch', value: approval.approvedById },
        { selectId: 'acknowledgedDropdown', searchId: 'acknowledgedDropdownSearch', value: approval.acknowledgedById }
    ];

    approvalFields.forEach(field => {
        if (field.value) {
            const selectElement = document.getElementById(field.selectId);
            const searchInput = document.getElementById(field.searchId);
            
            if (selectElement && searchInput) {
                selectElement.value = field.value;
                
                // Find the user name and update search input
                if (window.employees) {
                    const user = window.employees.find(emp => emp.id === field.value);
                    if (user) {
                        searchInput.value = user.fullName;
                    }
                }
            }
        }
    });
}

// Add empty row to table
function addEmptyRow() {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" />
        </td>
        <td class="p-2 border gray-column">
            <input type="text" maxlength="200" class="w-full bg-gray-100" disabled />
        </td>
        <td class="p-2 border gray-column">
            <input type="text" maxlength="200" class="w-full bg-gray-100" disabled />
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
    const totalExistingFiles = attachmentsToKeep.length + uploadedFiles.length;
    
    if (files.length + totalExistingFiles > 5) {
        alert('Maximum 5 PDF files are allowed.');
        event.target.value = ''; // Clear the file input
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
    updateAttachmentsDisplay();
}

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" />
        </td>
        <td class="p-2 border gray-column">
            <input type="text" maxlength="200" class="w-full bg-gray-100" disabled />
        </td>
        <td class="p-2 border gray-column">
            <input type="text" maxlength="200" class="w-full bg-gray-100" disabled />
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
    // Simple display of uploaded files count
    console.log(`${uploadedFiles.length} new file(s) uploaded`);
    // You can implement a more sophisticated file list display here if needed
}

// Function to remove a new uploaded file
function removeUploadedFile(index) {
    uploadedFiles.splice(index, 1);
    updateAttachmentsDisplay();
}

// Function to remove an existing attachment
function removeExistingAttachment(attachmentId) {
    const index = attachmentsToKeep.indexOf(attachmentId);
    if (index > -1) {
        attachmentsToKeep.splice(index, 1);
        updateAttachmentsDisplay();
    }
}

// Function to update the attachments display
function updateAttachmentsDisplay() {
    const attachmentsList = document.getElementById('attachmentsList');
    if (!attachmentsList) return;
    
    attachmentsList.innerHTML = ''; // Clear existing display
    
    // Display existing attachments that are marked to keep
    const existingToKeep = existingAttachments.filter(att => attachmentsToKeep.includes(att.id));
    existingToKeep.forEach(attachment => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex items-center justify-between p-2 bg-white border rounded mb-2 hover:bg-gray-50';
        attachmentItem.innerHTML = `
            <div class="flex items-center">
                <span class="text-blue-600 mr-2">📄</span>
                <span class="text-sm font-medium">${attachment.fileName}</span>
                <span class="text-xs text-gray-500 ml-2">(existing)</span>
            </div>
            <div class="flex items-center gap-2">
                <a href="${attachment.fileUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm font-semibold px-3 py-1 border border-blue-500 rounded hover:bg-blue-50 transition">
                    View
                </a>
                ${settlementData && settlementData.status && settlementData.status.toLowerCase() === 'draft' ? 
                `<button onclick="removeExistingAttachment('${attachment.id}')" class="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1 border border-red-500 rounded hover:bg-red-50 transition">
                    Remove
                </button>` : ''}
            </div>
        `;
        attachmentsList.appendChild(attachmentItem);
    });
    
    // Display new uploaded files
    uploadedFiles.forEach((file, index) => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded mb-2';
        attachmentItem.innerHTML = `
            <div class="flex items-center">
                <span class="text-green-600 mr-2">📄</span>
                <span class="text-sm font-medium">${file.name}</span>
                <span class="text-xs text-green-600 ml-2">(new)</span>
            </div>
            <div class="flex items-center gap-2">
                ${settlementData && settlementData.status && settlementData.status.toLowerCase() === 'draft' ? 
                `<button onclick="removeUploadedFile(${index})" class="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1 border border-red-500 rounded hover:bg-red-50 transition">
                    Remove
                </button>` : ''}
            </div>
        `;
        attachmentsList.appendChild(attachmentItem);
    });
    
    // Show message if no attachments
    if (existingToKeep.length === 0 && uploadedFiles.length === 0) {
        attachmentsList.innerHTML = '<p class="text-gray-500 text-sm text-center py-2">No attachments</p>';
    }
    
    // Show attachment count
    const totalAttachments = existingToKeep.length + uploadedFiles.length;
    console.log(`Total attachments: ${totalAttachments} (${existingToKeep.length} existing, ${uploadedFiles.length} new)`);
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
            
            // Get the KansaiEmployeeId from the selected requester, not the logged-in user
            const selectedRequesterId = document.getElementById("RequesterId").value;
            let kansaiEmployeeId = '';
            console.log("Selected RequesterId:", selectedRequesterId);
            console.log("Employees data:", window.employees);
            
            // Use global requester data if DOM element is empty
            let actualRequesterId = selectedRequesterId;
            if (!actualRequesterId && currentRequesterData) {
                actualRequesterId = currentRequesterData.id;
                console.log("Using global requester data:", actualRequesterId);
            }
            
            if (actualRequesterId && window.employees) {
                const selectedRequester = window.employees.find(emp => emp.id === actualRequesterId);
                if (selectedRequester && selectedRequester.kansaiEmployeeId) {
                    kansaiEmployeeId = selectedRequester.kansaiEmployeeId;
                    console.log("Found KansaiEmployeeId for requester:", kansaiEmployeeId);
                } else {
                    console.warn("KansaiEmployeeId not found for requester:", actualRequesterId);
                }
            } else {
                console.warn("No RequesterId available (neither from DOM nor global data)");
            }
            
            formData.append('KansaiEmployeeId', kansaiEmployeeId);
            console.log("Sending KansaiEmployeeId:", kansaiEmployeeId);
            console.log("Selected RequesterId:", selectedRequesterId);
            formData.append('SettlementRefNo', document.getElementById("settlementRefNo").value);
            formData.append('Purpose', document.getElementById("purpose").value);
            formData.append('TransactionType', document.getElementById("transactionType").value);
            formData.append('Department', document.getElementById("department").value);
            formData.append('SubmissionDate', document.getElementById("submissionDate").value);
            formData.append('CashAdvanceReferenceId', document.getElementById("cashAdvanceReferenceId").value);
            formData.append('Remarks', document.getElementById("remarks").value);
            
            // Approval fields
            formData.append('PreparedById', document.getElementById("preparedDropdown")?.value || '');
            formData.append('CheckedById', document.getElementById("checkedDropdown")?.value || '');
            formData.append('ApprovedById', document.getElementById("approvedDropdown")?.value || '');
            formData.append('AcknowledgedById', document.getElementById("acknowledgedDropdown")?.value || '');
            
            // Add SettlementItems - collect all rows from the table
            const tableRows = document.querySelectorAll('#tableBody tr');
            tableRows.forEach((row, index) => {
                const description = row.children[0]?.querySelector('input')?.value;
                // const glAccount = row.children[1]?.querySelector('input')?.value;
                // const accountName = row.children[2]?.querySelector('input')?.value;
                const amount = row.children[3]?.querySelector('input')?.value;
                
                if (description && amount) {
                    formData.append(`SettlementItems[${index}][Description]`, description);
                    // formData.append(`SettlementItems[${index}][GLAccount]`, glAccount || '');
                    // formData.append(`SettlementItems[${index}][AccountName]`, accountName || '');
                    console.log("Amount:", amount);
                    // console.log("accountName:", accountName);
                    // console.log("glAccount:", glAccount);
                    console.log("description:", description);
                    formData.append(`SettlementItems[${index}][Amount]`, amount);
                }
            });

            // Handle attachments according to backend logic
            // Add existing attachments to keep (with their IDs)
            attachmentsToKeep.forEach((attachmentId, index) => {
                const existingAttachment = existingAttachments.find(att => att.id === attachmentId);
                if (existingAttachment) {
                    formData.append(`Attachments[${index}].Id`, attachmentId);
                    formData.append(`Attachments[${index}].FileName`, existingAttachment.fileName || '');
                }
            });
            
            // Add new file uploads (with empty GUIDs)
            uploadedFiles.forEach((file, index) => {
                const attachmentIndex = attachmentsToKeep.length + index;
                formData.append(`Attachments[${attachmentIndex}].Id`, '00000000-0000-0000-0000-000000000000'); // Empty GUID for new files
                formData.append(`Attachments[${attachmentIndex}].File`, file);
            });
            
            console.log('Attachments to keep:', attachmentsToKeep);
            console.log('New files to upload:', uploadedFiles);

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
                        // Reload the settlement data to show updated information
                        fetchSettlementData(settlementId).then(data => {
                            if (data) {
                                populateFormWithData(data);
                            }
                        });
                        
                        // Clear uploaded files since they're now saved
                        uploadedFiles = [];
                        
                        // Update file input
                        const fileInput = document.querySelector('input[type="file"]');
                        if (fileInput) {
                            fileInput.value = '';
                        }
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

// Function to toggle editable fields based on settlement status
function toggleEditableFields(isEditable) {
    // List all input fields that should be controlled by editable state
    const editableFields = [
        'requesterSearch', // Requester name search input
        'settlementRefNo',
        'purpose',
        'transactionType',
        'submissionDate',
        'cashAdvanceReferenceId',
        'attachments', // File input
        'remarks'
    ];
    
    // Fields that should always be disabled/readonly (autofilled)
    const alwaysDisabledFields = [
        'settlementNumber',
        'requester', // Employee NIK
        'requesterName', // Employee Name
        'department', 
        'status'
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
                field.classList.add('bg-gray-100');
                field.classList.remove('bg-white');
            } else {
                field.classList.add('bg-white');
                field.classList.remove('bg-gray-100');
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
            field.classList.add('bg-gray-100');
            field.classList.remove('bg-white');
        }
    });
    
    // Handle requester dropdown
    const requesterDropdown = document.getElementById('requesterDropdown');
    if (requesterDropdown) {
        if (!isEditable) {
            requesterDropdown.style.display = 'none';
        }
    }
    
    // Handle table inputs
    const tableInputs = document.querySelectorAll('#tableBody input, #tableBody select');
    tableInputs.forEach(input => {
        if (input.type !== 'checkbox' && input.type !== 'radio') {
            input.readOnly = !isEditable;
        } else {
            input.disabled = !isEditable;
        }
        
        if (!isEditable) {
            input.classList.add('bg-gray-100');
            input.classList.remove('bg-white');
        } else {
            input.classList.remove('bg-gray-100');
            input.classList.add('bg-white');
        }
    });
    
    // Enable/disable add row button
    const addRowButton = document.querySelector('button[onclick="addRow()"]');
    if (addRowButton) {
        addRowButton.style.display = isEditable ? 'block' : 'none';
    }
    
    // Enable/disable delete row buttons
    const deleteButtons = document.querySelectorAll('button[onclick="deleteRow(this)"]');
    deleteButtons.forEach(button => {
        button.style.display = isEditable ? 'block' : 'none';
    });
    
    // Handle action buttons - enable/disable based on Draft status
    const deleteButton = document.querySelector('button[onclick="confirmDelete()"]');
    const updateButton = document.querySelector('button[onclick="updateSettle(false)"]');
    const submitButton = document.querySelector('button[onclick="updateSettle(true)"]');
    
    [deleteButton, updateButton, submitButton].forEach(button => {
        if (button) {
            button.disabled = !isEditable;
            if (!isEditable) {
                button.classList.add('opacity-50', 'cursor-not-allowed');
                button.title = 'You can only perform this action on settlements with Draft status';
            } else {
                button.classList.remove('opacity-50', 'cursor-not-allowed');
                button.title = '';
            }
        }
    });
    
    // Handle approval fields
    const approvalSelects = [
        { id: 'preparedDropdown', searchId: 'preparedDropdownSearch', approvalKey: 'preparedById' },
        { id: 'checkedDropdown', searchId: 'checkedDropdownSearch', approvalKey: 'checkedById' },
        { id: 'approvedDropdown', searchId: 'approvedDropdownSearch', approvalKey: 'approvedById' },
        { id: 'acknowledgedDropdown', searchId: 'acknowledgedDropdownSearch', approvalKey: 'acknowledgedById' }
    ];
    
    approvalSelects.forEach(selectInfo => {
        const field = document.getElementById(selectInfo.id);
        const searchInput = document.getElementById(selectInfo.searchId);
        if (field && searchInput) {
            if (selectInfo.id === 'preparedDropdown') {
                // preparedBy is always disabled if it matches logged-in user
                const userId = getUserId();
                if (field.value && field.value == userId) {
                    searchInput.disabled = true;
                    searchInput.classList.add('bg-gray-100');
                }
            } else {
                // Other approval fields follow normal editable logic
                searchInput.disabled = !isEditable;
                if (!isEditable) {
                    searchInput.classList.add('bg-gray-100');
                    searchInput.classList.remove('bg-white');
                } else {
                    searchInput.classList.add('bg-white');
                    searchInput.classList.remove('bg-gray-100');
                }
            }
        }
    });
}

// Function to make all fields read-only when status is not Draft
function makeAllFieldsReadOnlyForNonDraft() {
    toggleEditableFields(false);
}

// Function to display attachments (initial load)
function displayAttachments(attachments) {
    // Just call the update function which handles both existing and new files
    updateAttachmentsDisplay();
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Setup event listener untuk hide dropdown saat klik di luar
    document.addEventListener('click', function(event) {
        const dropdowns = [
            'preparedDropdownDropdown', 
            'checkedDropdownDropdown', 
            'approvedDropdownDropdown', 
            'acknowledgedDropdownDropdown'
        ];
        
        const searchInputs = [
            'preparedDropdownSearch', 
            'checkedDropdownSearch', 
            'approvedDropdownSearch', 
            'acknowledgedDropdownSearch'
        ];
        
        dropdowns.forEach((dropdownId, index) => {
            const dropdown = document.getElementById(dropdownId);
            const input = document.getElementById(searchInputs[index]);
            
            if (dropdown && input) {
                if (!input.contains(event.target) && !dropdown.contains(event.target)) {
                    dropdown.classList.add('hidden');
                }
            }
        });
    });
    
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