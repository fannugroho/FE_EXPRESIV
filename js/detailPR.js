let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep

let prId; // Declare global variable

// Function to fetch PR details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    prId = urlParams.get('pr-id');
    prType = urlParams.get('pr-type');
    fetchPRDetails(prId, prType);
    
    // Ensure all description and UOM fields are initially empty and properly styled
    document.querySelectorAll('.item-description').forEach(input => {
        input.value = '';
        input.disabled = true;
        input.classList.add('bg-gray-100');
    });
    
    document.querySelectorAll('.item-uom').forEach(input => {
        input.value = '';
        input.disabled = true;
        input.classList.add('bg-gray-100');
    });
};

function populateUserSelects(users, approvalData = null) {
    // Store users globally for search functionality
    window.requesters = users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        department: user.department
    }));



    // Store employees globally for reference
    window.employees = users.map(user => ({
        id: user.id,
        kansaiEmployeeId: user.kansaiEmployeeId,
        fullName: user.fullName,
        department: user.department
    }));

    // Populate RequesterId dropdown with search functionality
    const requesterSelect = document.getElementById("RequesterId");
    if (requesterSelect) {
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.fullName;
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
                    requesterDropdown.classList.add('hidden');
                    console.log("Requester selected:", requester);
                    //update department
                    const departmentSelect = document.getElementById('department');
                    
                    if (requester.department) {
                        // Find the department option and select it
                        const departmentOptions = departmentSelect.options;
                        for (let i = 0; i < departmentOptions.length; i++) {
                            if (departmentOptions[i].textContent === requester.department) {
                                console.log("Department matches current text");
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

    // Populate approval select dropdowns with search functionality
    const selects = [
        { id: 'preparedBy', searchId: 'preparedBySearch', approvalKey: 'preparedById' },
        { id: 'checkedBy', searchId: 'checkedBySearch', approvalKey: 'checkedById' },
        { id: 'acknowledgeBy', searchId: 'acknowledgeBySearch', approvalKey: 'acknowledgedById' },
        { id: 'approvedBy', searchId: 'approvedBySearch', approvalKey: 'approvedById' },
        { id: 'receivedBy', searchId: 'receivedBySearch', approvalKey: 'receivedById' }
    ];
    
    selects.forEach(selectInfo => {
        const select = document.getElementById(selectInfo.id);
        const searchInput = document.getElementById(selectInfo.searchId);
        
        if (select && searchInput) {
            // Clear and populate the hidden select
            select.innerHTML = '<option value="" disabled>Select User</option>';
            
            users.forEach(user => {
                // console.log("user", user);
                const option = document.createElement("option");
                option.value = user.id;
                option.textContent = user.fullName;
                select.appendChild(option);
            });
            
            // Set the value from approval data if available and update search input
            if (approvalData && approvalData[selectInfo.approvalKey]) {
                select.value = approvalData[selectInfo.approvalKey];
                
                // Find the user and update the search input
                const selectedUser = users.find(user => user.id === approvalData[selectInfo.approvalKey]);
                if (selectedUser) {
                    searchInput.value = selectedUser.fullName;
                }
                
                // Auto-select and disable for Prepared by if it matches logged in user
                if(selectInfo.id === "preparedBy" && select.value == getUserId()){
                    searchInput.disabled = true;
                    searchInput.classList.add('bg-gray-100');
                }
            }
            
            // Always disable and auto-select preparedBy to logged-in user
            if(selectInfo.id === "preparedBy"){
                const loggedInUserId = getUserId();
                if(loggedInUserId) {
                    select.value = loggedInUserId;
                    const loggedInUser = users.find(user => user.id === loggedInUserId);
                    if(loggedInUser) {
                        searchInput.value = loggedInUser.fullName;
                    }
                    searchInput.disabled = true;
                    searchInput.classList.add('bg-gray-100');
                }
            }
        }
    });
}

// Function to filter users for approval dropdowns (like addPR.js)
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

async function fetchPRDetails(prId, prType) {
    try {
        const response = await makeAuthenticatedRequest(`/api/pr/item/${prId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        const responseData = await response.json();
        if (responseData.data) {
            console.log(responseData.data);
            populatePRDetails(responseData.data);
            
            // Always fetch dropdown options
            fetchDropdownOptions(responseData.data);
            
            const isEditable = responseData.data && responseData.data.status === 'Draft';
            toggleEditableFields(isEditable);
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Error fetching PR details: ' + error.message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to fetch all dropdown options
function fetchDropdownOptions(approvalData = null) {
    fetchDepartments();
    fetchUsers(approvalData);
    fetchClassifications();
    fetchItemOptions();
}

// Function to fetch departments from API
async function fetchDepartments() {
    try {
        const response = await makeAuthenticatedRequest('/api/department');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        console.log("Department data:", data);
        populateDepartmentSelect(data.data);
    } catch (error) {
        console.error('Error fetching departments:', error);
    }
}

// Function to fetch users from API
async function fetchUsers(approvalData = null) {
    try {
        const response = await makeAuthenticatedRequest('/api/users');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        // console.log("User data:", data);
        populateUserSelects(data.data, approvalData);
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// Function to fetch classifications from API
async function fetchClassifications() {
    try {
        const response = await makeAuthenticatedRequest('/api/classifications');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        populateClassificationSelect(data.data);
    } catch (error) {
        console.error('Error fetching classifications:', error);
    }
}

// Function to fetch items from API
async function fetchItemOptions() {
    try {
        const response = await makeAuthenticatedRequest('/api/items');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        console.log("Item data:", data);
        // Populate all item selects in the document
        document.querySelectorAll('.item-no').forEach(select => {
            populateItemSelect(data.data, select);
        });
    } catch (error) {
        console.error('Error fetching items:', error);
    }
}

// Function to fetch items for a specific select element (no pre-selection)
async function fetchItemOptionsForSelect(selectElement) {
    try {
        const response = await makeAuthenticatedRequest('/api/items');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        populateItemSelectClean(data.data, selectElement);
    } catch (error) {
        console.error('Error fetching items:', error);
    }
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

        if (window.currentValues && window.currentValues.department && department.name === window.currentValues.department) {
            option.selected = true;
        }
    });
    
    // If we have a current value and it wasn't matched by text, try to select by value
    if (currentValue && departmentSelect.value !== currentValue) {
        departmentSelect.value = currentValue;
    }
}

// Function to populate classification select
function populateClassificationSelect(classifications) {
    const classificationSelect = document.getElementById("classification");
    if (!classificationSelect) return;
    
    // Store the currently selected value
    const currentValue = classificationSelect.value;
    const currentText = classificationSelect.options[classificationSelect.selectedIndex]?.text;

    console.log(currentValue);
    console.log(currentText);
    console.log("Saved classification:", window.currentValues?.classification);
    
    classificationSelect.innerHTML = '<option value="" disabled>Select Classification</option>';

    let matchFound = false;
    classifications.forEach(classification => {
        const option = document.createElement("option");
        option.value = classification.id;
        option.textContent = classification.name;
        classificationSelect.appendChild(option);
        
        // First priority: match with saved classification from API data
        if (window.currentValues && window.currentValues.classification && classification.name === window.currentValues.classification) {
            console.log("Classification matches saved value:", classification.name);
            option.selected = true;
            matchFound = true;
        }
        // Second priority: match with current text if no match with saved value
        else if (!matchFound && classification.name === currentText) {
            console.log("Classification matches current text");
            option.selected = true;
            matchFound = true;
        }
    });
    
    // If we have a current value and it wasn't matched by text, try to select by value
    if (!matchFound && currentValue && classificationSelect.value !== currentValue) {
        classificationSelect.value = currentValue;
    }
}

// Function to populate item select
function populateItemSelect(items, selectElement) {
    if (!selectElement) return;
    
    // Check if this select has a pre-selected item code
    const selectedItemCode = selectElement.getAttribute('data-selected-item-code');
    
    selectElement.innerHTML = '<option value="" disabled>Select Item</option>';

    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item.itemCode; // Use itemCode instead of id
        option.textContent = `${item.itemCode} - ${item.itemName}`;
        // Store the description and UOM as data attributes
        option.setAttribute('data-item-code', item.itemCode);
        option.setAttribute('data-description', item.description || item.name || item.itemName || '');
        option.setAttribute('data-uom', item.uom || item.unitOfMeasure || '');
        selectElement.appendChild(option);
        
        // If this item matches the selected item code, select it
        if (selectedItemCode && item.itemCode === selectedItemCode) {
            option.selected = true;
            // Trigger the update after setting as selected
            setTimeout(() => {
                updateItemDescription(selectElement);
            }, 0);
        }
    });

    // Add onchange event listener to auto-fill description and UOM
    selectElement.onchange = function() {
        updateItemDescription(this);
    };
}

// Function to populate item select without any pre-selection (for new rows)
function populateItemSelectClean(items, selectElement) {
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="" disabled selected>Select Item</option>';

    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item.itemCode; // Use itemCode instead of id
        option.textContent = `${item.itemCode} - ${item.itemName}`;
        // Store the description and UOM as data attributes
        option.setAttribute('data-item-code', item.itemCode);
        option.setAttribute('data-description', item.description || item.name || item.itemName || '');
        option.setAttribute('data-uom', item.uom || item.unitOfMeasure || '');
        selectElement.appendChild(option);
    });

    // Add onchange event listener to auto-fill description and UOM
    selectElement.onchange = function() {
        updateItemDescription(this);
    };
}

// Function to toggle editable fields based on PR status
function toggleEditableFields(isEditable) {
    // List all input fields that should be controlled by editable state
    const editableFields = [
        'requesterSearch', // Requester name search input
        'classification',
        'submissionDate',
        'requiredDate',
        'remarks',
        'PO',
        'NonPO'
    ];
    
    // Fields that should always be disabled/readonly (autofilled)
    const alwaysDisabledFields = [
        'purchaseRequestNo',
        'department', 
        'status',
        'prType'
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
            } else {
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
            field.classList.add('bg-gray-100');
        }
    });
    
    // Handle requester dropdown
    const requesterDropdown = document.getElementById('requesterDropdown');
    if (requesterDropdown) {
        if (!isEditable) {
            requesterDropdown.style.display = 'none';
        }
    }
    
    // Handle table inputs - only for editable fields in table
    const tableInputs = document.querySelectorAll('#tableBody input:not(.item-description), #tableBody select.item-no');
    tableInputs.forEach(input => {
        if (input.tagName === 'SELECT' || input.type === 'checkbox' || input.type === 'radio') {
            input.disabled = !isEditable;
        } else {
            input.readOnly = !isEditable;
        }
        
        if (!isEditable) {
            input.classList.add('bg-gray-100');
        } else {
            input.classList.remove('bg-gray-100');
        }
    });
    
    // Handle item description and UOM fields - always disabled but follow the item selection logic
    const itemDescriptions = document.querySelectorAll('.item-description');
    itemDescriptions.forEach(input => {
        input.disabled = true; // Always disabled
        input.classList.add('bg-gray-100'); // Always gray
    });
    
    const itemUoms = document.querySelectorAll('.item-uom');
    itemUoms.forEach(input => {
        input.disabled = true; // Always disabled
        input.classList.add('bg-gray-100'); // Always gray
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
    
    // Disable file upload input when not editable
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.disabled = !isEditable;
        if (!isEditable) {
            fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        } else {
            fileInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
        }
    }
    
    // Update attachments display to show/hide remove buttons based on editable state
    updateAttachmentsDisplay();
    
    // Handle action buttons - enable/disable based on Draft status
    const deleteButton = document.querySelector('button[onclick="confirmDelete()"]');
    const updateButton = document.querySelector('button[onclick="submitPR(false)"]');
    const submitButton = document.querySelector('button[onclick="submitPR(true)"]');
    
    [deleteButton, updateButton, submitButton].forEach(button => {
        if (button) {
            button.disabled = !isEditable;
            if (!isEditable) {
                button.classList.add('opacity-50', 'cursor-not-allowed');
                button.title = 'You can only perform this action on PRs with Draft status';
            } else {
                button.classList.remove('opacity-50', 'cursor-not-allowed');
                button.title = '';
            }
        }
    });
    
    // Handle approval fields


    const selects = [
        { id: 'preparedBy', searchId: 'preparedBySearch', approvalKey: 'preparedById' },
        { id: 'checkedBy', searchId: 'checkedBySearch', approvalKey: 'checkedById' },
        { id: 'acknowledgeBy', searchId: 'acknowledgeBySearch', approvalKey: 'acknowledgedById' },
        { id: 'approvedBy', searchId: 'approvedBySearch', approvalKey: 'approvedById' },
        { id: 'receivedBy', searchId: 'receivedBySearch', approvalKey: 'receivedById' }
    ];
    
    selects.forEach(fieldInfo => {
        const field = document.getElementById(fieldInfo.id);
        const searchInput = document.getElementById(fieldInfo.searchId);
        if (field && searchInput) {
            if (fieldInfo.id === 'preparedBy') {
                const userId = getUserId();
                console.log(field.value);
                console.log(userId);
                // if (field.value && field.value == userId) {
                    searchInput.disabled = true;
                    searchInput.classList.add('bg-gray-100');
                // } 
            } else {
                // Other approval fields follow normal editable logic
                searchInput.disabled = !isEditable;
                if (!isEditable) {
                    searchInput.classList.add('bg-gray-100');
                } else {
                    searchInput.classList.add('bg-white');
                }
            }
        }
    });
}

function populatePRDetails(data) {
    // Populate basic PR information
    document.getElementById('purchaseRequestNo').value = data.purchaseRequestNo;
    
    // Handle requester name with search functionality
    if (data.requesterName) {
        document.getElementById('requesterSearch').value = data.requesterName;
        // Store the requester ID if available
        if (data.requesterId) {
            document.getElementById('RequesterId').value = data.requesterId;
        }
    }
    
    // Format and set dates - extract date part directly to avoid timezone issues
    const submissionDate = data.submissionDate ? data.submissionDate.split('T')[0] : '';
    const requiredDate = data.requiredDate ? data.requiredDate.split('T')[0] : '';
    document.getElementById('submissionDate').value = submissionDate;
    document.getElementById('requiredDate').value = requiredDate;
    
    // Set remarks
    document.getElementById('remarks').value = data.remarks || '';
    
    // Handle rejection remarks if status is Rejected
    if (data.status === 'Rejected' && data.rejectedRemarks) {
        // Show the rejection remarks section
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        const rejectionTextarea = document.getElementById('rejectionRemarks');
        
        if (rejectionSection && rejectionTextarea) {
            rejectionSection.style.display = 'block';
            rejectionTextarea.value = data.rejectedRemarks;
        }
    } else {
        // Hide the rejection remarks section if status is not Rejected
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        if (rejectionSection) {
            rejectionSection.style.display = 'none';
        }
    }

    // Set status
    if (data && data.status) {
        document.getElementById('status').value = data.status;
        console.log(data.status);
    }

    // Store and display attachments
    if (data.attachments) {
        existingAttachments = data.attachments;
        attachmentsToKeep = data.attachments.map(att => att.id); // Initially keep all existing attachments
        displayAttachments(data.attachments);
    }

    // Store the values to be used after fetching options
    window.currentValues = {
        department: data.departmentName,
        classification: data.classification,
        status: data.status 
    };
    
    
    // Handle item details
    if (data.itemDetails) {
        populateItemDetails(data.itemDetails);
    }
    
    // Check if editable after populating data
    const isEditable = window.currentValues.status === 'Draft';
    toggleEditableFields(isEditable);
}



function populateItemDetails(items) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (items.length === 0) {
        addRow(); // Add empty row if no items
        return;
    }
    
    items.forEach(item => {
        addItemRow(item);
    });
}

function addItemRow(item = null) {
    const tableBody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="p-2 border bg-gray-100">
            <select class="w-full p-2 border rounded item-no" onchange="updateItemDescription(this)">
                <option value="" disabled ${!item ? 'selected' : ''}>Select Item</option>
            </select>
        </td>
        <td class="p-2 border bg-gray-100">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto whitespace-pre-wrap break-words" rows="3" maxlength="200" disabled title="${item?.description || ''}" style="word-wrap: break-word; white-space: pre-wrap;">${item?.description || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <input type="text" value="${item?.detail || ''}" class="w-full h-full item-detail text-center" maxlength="100" required />
        </td>
        <td class="p-2 border h-12">
            <input type="text" value="${item?.purpose || ''}" class="w-full h-full item-purpose text-center" maxlength="100" required />
        </td>
        <td class="p-2 border h-12">
            <input type="number" value="${item?.quantity || ''}" class="w-full h-full item-quantity text-center" min="1" required />
        </td>
        <td class="p-2 border bg-gray-100">
            <input type="text" value="${item?.uom || ''}" class="w-full item-uom bg-gray-100" disabled />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;
    
    tableBody.appendChild(row);
    
    // Store the item data to be used after fetching options
    if (item) {
        const selectElement = row.querySelector('.item-no');
        selectElement.setAttribute('data-selected-item-code', item.itemNo); // itemNo is actually the itemCode
    }
    
    fetchItemOptions();
}

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");
    
    newRow.innerHTML = `
        <td class="p-2 border bg-gray-100">
            <select class="w-full p-2 border rounded item-no" onchange="updateItemDescription(this)">
                <option value="" disabled selected>Select Item</option>
            </select>
        </td>
        <td class="p-2 border bg-gray-100">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto whitespace-pre-wrap break-words" rows="3" maxlength="200" disabled style="word-wrap: break-word; white-space: pre-wrap;"></textarea>
        </td>
        <td class="p-2 border h-12">
            <input type="text" class="w-full h-full item-detail text-center" maxlength="100" required />
        </td>
        <td class="p-2 border h-12">
            <input type="text" class="w-full h-full item-purpose text-center" maxlength="100" required />
        </td>
        <td class="p-2 border h-12">
            <input type="number" class="w-full h-full item-quantity text-center" min="1" required />
        </td>
        <td class="p-2 border bg-gray-100">
            <input type="text" class="w-full item-uom bg-gray-100" disabled />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
    
    // Populate the new item select with items (no pre-selection)
    const newItemSelect = newRow.querySelector('.item-no');
    fetchItemOptionsForSelect(newItemSelect);
}

function updateItemDescription(selectElement) {
    const row = selectElement.closest('tr');
    const descriptionInput = row.querySelector('.item-description');
    const uomInput = row.querySelector('.item-uom');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    
    // Check if a valid item is selected (not the placeholder option)
    if (selectedOption && !selectedOption.disabled && selectedOption.value && selectedOption.value !== "") {
        // Get the item code and set it as the text content
        const itemCode = selectedOption.getAttribute('data-item-code');
        selectedOption.textContent = itemCode || '';
        
        // Force the select element to resize to fit only the item code
        // selectElement.style.width = 'auto';
        // const tempOption = document.createElement('option');
        // tempOption.textContent = itemCode;
        // selectElement.appendChild(tempOption);
        // const newWidth = tempOption.offsetWidth + 120; // Add some padding
        // selectElement.removeChild(tempOption);
        // selectElement.style.width = newWidth + 'px';
        
        // Get description and UOM from data attributes and fill them automatically
        const itemDescription = selectedOption.getAttribute('data-description');
        const itemUom = selectedOption.getAttribute('data-uom');
        
        descriptionInput.value = itemDescription || '';
        descriptionInput.textContent = itemDescription || ''; // For textarea
        descriptionInput.title = itemDescription || ''; // For tooltip
        
        uomInput.value = itemUom || '';
        uomInput.title = itemUom || ''; // For tooltip
        
        // Keep the fields disabled and gray (not editable by user)
        descriptionInput.disabled = true;
        descriptionInput.classList.add('bg-gray-100');
        uomInput.disabled = true;
        uomInput.classList.add('bg-gray-100');
    } else {
        // No valid item selected, clear the fields
        descriptionInput.value = '';
        descriptionInput.textContent = '';
        descriptionInput.title = '';
        uomInput.value = '';
        uomInput.title = '';
        
        // Keep the fields disabled and gray
        descriptionInput.disabled = true;
        descriptionInput.classList.add('bg-gray-100');
        uomInput.disabled = true;
        uomInput.classList.add('bg-gray-100');
    }
}

function deleteRow(button) {
    button.closest("tr").remove();
}

async function confirmDelete() {
    if (!prId) {
        Swal.fire({
            title: 'Error!',
            text: 'PR ID not found',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    // Check if status is Draft before allowing delete
    const status = document.getElementById('status').value;
    if (status !== 'Draft') {
        Swal.fire({
            title: 'Not Allowed!',
            text: 'You can only delete PRs with Draft status',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        return;
    }

    const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'You are about to delete this PR. This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
            title: 'Deleting...',
            text: 'Please wait while we delete the PR.',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        makeAuthenticatedRequest(`/api/pr/item/${prId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                Swal.fire({
                    title: 'Deleted!',
                    text: 'PR has been deleted successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '../pages/menuPR.html';
                });
            } else {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `Failed to delete PR. Status: ${response.status}`);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Error deleting PR: ' + error.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
    }
}

async function updatePR(isSubmit = false) {
    console.log("masuk");
    if (!prId) {
        Swal.fire({
            title: 'Error!',
            text: 'PR ID not found',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }

    // Check the status before updating
    const status = window.currentValues?.status || document.getElementById('status')?.value;
    if (status !== 'Draft') {
        Swal.fire({
            title: 'Not Allowed!',
            text: 'You can only update PRs with Draft status',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        return;
    }

    // Show confirmation dialog only for submit
    if (isSubmit) {
        const result = await Swal.fire({
            title: 'Submit PR',
            text: 'Are you sure you want to submit this PR? You won\'t be able to edit it after submission.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, submit it!',
            cancelButtonText: 'Cancel'
        });
        
        if (!result.isConfirmed) {
            return;
        }
    }

    try {
        // Create FormData object for the update
        const formData = new FormData();
        
        // Add basic fields
        formData.append('Id', prId);
        formData.append('PurchaseRequestNo', document.getElementById('purchaseRequestNo').value);
        

        const userId = getUserId();
        if (!userId) {
            Swal.fire({
                title: 'Authentication Error!',
                text: 'Unable to get user ID from token. Please login again.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        // Show loading state
        const actionText = isSubmit ? 'Submit' : 'Update';
        Swal.fire({
            title: `${actionText.slice(0, -1)}ing...`,
            text: `Please wait while we ${isSubmit ? 'submit' : 'update'} the PR.`,
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });


        formData.append('RequesterId', document.getElementById("RequesterId").value || userId);
        formData.append('IsSubmit', isSubmit.toString()); // Add IsSubmit parameter
        
        // Use the department ID from the select
        const departmentSelect = document.getElementById('department');
        formData.append('DepartmentId', departmentSelect.value);
        
        // Format dates
        const requiredDate = document.getElementById('requiredDate').value;
        if (requiredDate) {
            formData.append('RequiredDate', new Date(requiredDate).toISOString());
        }
        
        const submissionDate = document.getElementById('submissionDate').value;
        if (submissionDate) {
            // Send date value directly without timezone conversion
            formData.append('SubmissionDate', submissionDate);
        }
        
        // Use the classification text from the select
        const classificationSelect = document.getElementById('classification');
        const selectedClassification = classificationSelect.options[classificationSelect.selectedIndex].text;
        formData.append('Classification', selectedClassification);
        
        formData.append('Remarks', document.getElementById('remarks').value);
        
        // Approvals
 
        formData.append('PreparedById', document.getElementById('preparedBy')?.value);
        formData.append('CheckedById', document.getElementById('checkedBy')?.value);
        formData.append('AcknowledgedById', document.getElementById('acknowledgeBy')?.value);
        formData.append('ApprovedById', document.getElementById('approvedBy')?.value);
        formData.append('ReceivedById', document.getElementById('receivedBy')?.value);
        
        // Item details
        const rows = document.querySelectorAll('#tableBody tr');
        
        rows.forEach((row, index) => {
            formData.append(`ItemDetails[${index}].ItemNo`, row.querySelector('.item-no').value);
            formData.append(`ItemDetails[${index}].Description`, row.querySelector('.item-description').value);
            formData.append(`ItemDetails[${index}].Detail`, row.querySelector('.item-detail').value);
            formData.append(`ItemDetails[${index}].Purpose`, row.querySelector('.item-purpose').value);
            formData.append(`ItemDetails[${index}].Quantity`, row.querySelector('.item-quantity').value);
            formData.append(`ItemDetails[${index}].UOM`, row.querySelector('.item-uom').value);
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


        
        // Submit the form data
        makeAuthenticatedRequest(`/api/pr/item/${prId}`, {
            method: 'PUT',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                console.log("PR submitted successfully");
                Swal.fire({
                    title: 'Success!',
                    text: `PR has been ${isSubmit ? 'submitted' : 'updated'} successfully.`,
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    // Reload the PR data to show updated information
                    fetchPRDetails(prId, prType);
                    
                    // Clear uploaded files since they're now saved
                    uploadedFiles = [];
                    
                    // Update file input
                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput) {
                        fileInput.value = '';
                    }
                });
            } else {
                return response.json().then(errorData => {
                    console.log("errorData", errorData);
                    throw new Error(errorData.message || `Failed to ${isSubmit ? 'submit' : 'update'} PR. Status: ${response.status}`);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error!',
                text: `Error ${isSubmit ? 'submitting' : 'updating'} PR: ` + error.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Error preparing update data: ' + error.message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function specifically for submitting PR
function submitPR(isSubmit = true) {
    console.log(isSubmit);
    updatePR(isSubmit);
}

function previewPDF(event) {
    const files = event.target.files;
    const totalExistingFiles = attachmentsToKeep.length + uploadedFiles.length;
    
    if (files.length + totalExistingFiles > 5) {
        Swal.fire({
            title: 'File Limit Exceeded!',
            text: 'Maximum 5 PDF files are allowed.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        event.target.value = ''; // Clear the file input
        return;
    }
    
    Array.from(files).forEach(file => {
        if (file.type === 'application/pdf') {
            uploadedFiles.push(file);
        } else {
            Swal.fire({
                title: 'Invalid File Type!',
                text: 'Please upload a valid PDF file',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
        }
    });

    displayFileList();
    updateAttachmentsDisplay();
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
                ${window.currentValues && window.currentValues.status && window.currentValues.status.toLowerCase() === 'draft' ? 
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
                ${window.currentValues && window.currentValues.status && window.currentValues.status.toLowerCase() === 'draft' ? 
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

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateAttachmentsDisplay();
}

function saveDocument() {
    let documents = JSON.parse(localStorage.getItem("documents")) || [];
    const docNumber = `PR${Date.now()}`; // Gunakan timestamp agar unik

    const documentData = {
        id: document.getElementById("id").value,
        prno: document.getElementById("purchaseRequestNo").value,
        requester: document.getElementById("requesterName").value,
        department: document.getElementById("department").value,
        postingDate: document.getElementById("submissionDate").value,
        requiredDate: document.getElementById("requiredDate").value,
        classification: document.getElementById("classification").value,
        prType: document.getElementById("prType").value,
        status: document.getElementById("status").value,
        approvals: {
            prepared: document.getElementById("preparedByName").checked,
            checked: document.getElementById("checkedByName").checked,
            approved: document.getElementById("approvedByName").checked,
            acknowledge: document.getElementById("acknowledgeByName").checked,
            purchasing: document.getElementById("purchasingByName").checked,
        }
    };

    documents.push(documentData);
    localStorage.setItem("documents", JSON.stringify(documents));
    alert("Dokumen berhasil disimpan!");
}

function updateApprovalStatus(id, statusKey) {
    let documents = JSON.parse(localStorage.getItem("documents")) || [];
    let docIndex = documents.findIndex(doc => doc.id === id);
    if (docIndex !== -1) {
        documents[docIndex].approvals[statusKey] = true;
        localStorage.setItem("documents", JSON.stringify(documents));
        alert(`Document ${statusKey} updated!`);
    }
}



function fillItemDetails() {
    const itemCode = document.getElementById("itemNo").value;
    const itemName = document.getElementById("itemName");
    const itemPrice = document.getElementById("itemPrice");

    const itemData = {
        "ITM001": { name: "Laptop", price: "15,000,000" },
        "ITM002": { name: "Printer", price: "3,500,000" },
        "ITM003": { name: "Scanner", price: "2,000,000" }
    };

    if (itemData[itemCode]) {
        itemName.value = itemData[itemNo].name;
        itemPrice.value = itemData[itemNo].price;
    } else {
        itemName.value = "";
        itemPrice.value = "";
        alert("Item No not found!");
    }
}

document.getElementById("docType")?.addEventListener("change", function () {
    const prTable = document.getElementById("prTable");
    prTable.style.display = this.value === "choose" ? "none" : "table";
});

// 
// Function to display attachments (initial load)
function displayAttachments(attachments) {
    // Just call the update function which handles both existing and new files
    updateAttachmentsDisplay();
}

// Add DOMContentLoaded event listener for dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    // Setup event listener untuk hide dropdown saat klik di luar
    document.addEventListener('click', function(event) {
        const dropdowns = [
            'preparedByDropdown', 
            'checkedByDropdown', 
            'acknowledgeByDropdown', 
            'approvedByDropdown', 
            'receivedByDropdown'
        ];
        
        const searchInputs = [
            'preparedBySearch', 
            'checkedBySearch', 
            'acknowledgeBySearch', 
            'approvedBySearch', 
            'receivedBySearch'
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
});