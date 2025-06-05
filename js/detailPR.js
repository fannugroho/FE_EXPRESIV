let uploadedFiles = [];

let prId; // Declare global variable
let prType; // Declare global variable

// Function to fetch PR details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    prId = urlParams.get('pr-id');
    prType = urlParams.get('pr-type');
    fetchPRDetails(prId, prType);
    
    // Ensure all description fields are initially empty and properly styled
    document.querySelectorAll('.item-description').forEach(input => {
        input.value = '';
        input.disabled = true;
        input.classList.add('bg-gray-100');
    });
};

function populateUserSelects(users, approvalData = null) {
    // Store users globally for search functionality
    window.requesters = users.map(user => ({
        id: user.id,
        fullName: user.name || `${user.firstName} ${user.middleName} ${user.lastName}`,
        department: user.department
    }));

    // Populate RequesterId dropdown with search functionality
    const requesterSelect = document.getElementById("RequesterId");
    if (requesterSelect) {
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

    const selects = [
        { id: 'preparedBy', approvalKey: 'preparedById' },
        { id: 'checkedBy', approvalKey: 'checkedById' },
        { id: 'acknowledgeBy', approvalKey: 'acknowledgedById' },
        { id: 'approvedBy', approvalKey: 'approvedById' },
        { id: 'receivedBy', approvalKey: 'receivedById' }
    ];
    
    selects.forEach(selectInfo => {
        const select = document.getElementById(selectInfo.id);
        if (select) {
            // Store the currently selected value
            const currentValue = select.value;
            
            users.forEach(user => {
                // console.log("user", user);
                const option = document.createElement("option");
                option.value = user.id;
                option.textContent = user.name || `${user.firstName} ${user.middleName} ${user.lastName}`;
                select.appendChild(option);
            });
            // Set the value from approval data if available
            if (approvalData && approvalData[selectInfo.approvalKey]) {
                select.value = approvalData[selectInfo.approvalKey];
                
                // Find the user and update the search input
                const searchInput = document.getElementById(selectInfo.searchId);
                if (searchInput) {
                    const selectedUser = users.find(user => user.id === approvalData[selectInfo.approvalKey]);
                    if (selectedUser) {
                        searchInput.value = selectedUser.name || `${selectedUser.firstName} ${selectedUser.lastName}`;
                    }
                }
                
                // Auto-select and disable for Prepared by if it matches logged in user
                if(selectInfo.id === "preparedBy" && select.value == getUserId()){
                    select.disabled = true;
                }
            } else if (currentValue) {
                // Restore the selected value if it exists
                select.value = currentValue;
            }
        }

        console.log("printing preparedBy", document.getElementById('preparedBy').value);
    });
}


function fetchPRDetails(prId, prType) {
    const endpoint = prType.toLowerCase() === 'service' ? 'service' : 'item';
    fetch(`${BASE_URL}/api/pr/${endpoint}/${prId}`)
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
                populatePRDetails(response.data);
                document.getElementById('prType').value = prType;
                toggleFields();
                
                // Always fetch dropdown options
                fetchDropdownOptions(response.data);
                
        
                const isEditable = response.data && response.data.status === 'Draft';
                toggleEditableFields(isEditable);
                
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error fetching PR details: ' + error.message);
        });
}

// Function to fetch all dropdown options
function fetchDropdownOptions(approvalData = null) {
    fetchDepartments();
    fetchUsers(approvalData);
    fetchClassifications();
    if (document.getElementById("prType").value === "Item") {
        fetchItemOptions();
    }
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
            // console.log("User data:", data);
            populateUserSelects(data.data, approvalData);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
}

// Function to fetch classifications from API
function fetchClassifications() {
    fetch(`${BASE_URL}/api/classifications`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            populateClassificationSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching classifications:', error);
        });
}

// Function to fetch items from API
function fetchItemOptions() {
    fetch(`${BASE_URL}/api/items`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Item data:", data);
            // Populate all item selects in the document
            document.querySelectorAll('.item-no').forEach(select => {
                populateItemSelect(data.data, select);
            });
        })
        .catch(error => {
            console.error('Error fetching items:', error);
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

// Function to populate classification select
function populateClassificationSelect(classifications) {
    const classificationSelect = document.getElementById("classification");
    if (!classificationSelect) return;
    
    // Store the currently selected value
    const currentValue = classificationSelect.value;
    const currentText = classificationSelect.options[classificationSelect.selectedIndex]?.text;

    console.log(currentValue);
    console.log(currentText);
    
    classificationSelect.innerHTML = '<option value="" disabled>Select Classification</option>';

    classifications.forEach(classification => {
        const option = document.createElement("option");
        option.value = classification.id;
        option.textContent = classification.name;
        classificationSelect.appendChild(option);
        
        // If this classification matches the current text, select it
        if (classification.name === currentText) {
            console.log("Classification matches current text");
            option.selected = true;
        }

        
    });
    
    // If we have a current value and it wasn't matched by text, try to select by value
    if (currentValue && classificationSelect.value !== currentValue) {
        classificationSelect.value = currentValue;
    }
}

// Function to populate item select
function populateItemSelect(items, selectElement) {
    if (!selectElement) return;
    
    // Store the currently selected value
    const currentValue = selectElement.value;
    const currentText = selectElement.options[selectElement.selectedIndex]?.text;
    
    selectElement.innerHTML = '<option value="" disabled>Select Item</option>';

    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id || item.itemCode;
        option.textContent = `${item.itemNo || item.itemCode} - ${item.name || item.itemName}`;
        // Store the description as a data attribute
        option.setAttribute('data-description', item.description || item.name || item.itemName || '');
        selectElement.appendChild(option);
        
        // If this item matches the current text or value, select it
        if (option.textContent === currentText || option.value === currentValue) {
            option.selected = true;
        }
    });

    // Add onchange event listener to auto-fill description
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
        if (input.type !== 'checkbox' && input.type !== 'radio') {
            input.readOnly = !isEditable;
        } else {
            input.disabled = !isEditable;
        }
        
        if (!isEditable) {
            input.classList.add('bg-gray-100');
        } else {
            input.classList.remove('bg-gray-100');
        }
    });
    
    // Handle item description fields - always disabled but follow the item selection logic
    const itemDescriptions = document.querySelectorAll('.item-description');
    itemDescriptions.forEach(input => {
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
        { id: 'preparedBy', approvalKey: 'preparedById' },
        { id: 'checkedBy', approvalKey: 'checkedById' },
        { id: 'acknowledgeBy', approvalKey: 'acknowledgedById' },
        { id: 'approvedBy', approvalKey: 'approvedById' },
        { id: 'receivedBy', approvalKey: 'receivedById' }
    ];
    
    selects.forEach(fieldId => {
        const field = document.getElementById(fieldId.id);
        if (field) {
            if (fieldId.id === 'preparedBy') {
                const userId = getUserId();
                console.log(field.value);
                console.log(userId);
                // if (field.value && field.value == userId) {
                    field.disabled = true;
                    field.classList.add('bg-gray-100');
                // } 
            } else {
                // Other approval fields follow normal editable logic
                field.disabled = !isEditable;
                if (!isEditable) {
                    field.classList.add('bg-gray-100');
                } else {
                    field.classList.add('bg-white');
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
    
    document.getElementById('prType').value = data.prType;
    
    // Format and set dates
    const submissionDate = new Date(data.submissionDate).toISOString().split('T')[0];
    const requiredDate = new Date(data.requiredDate).toISOString().split('T')[0];
    document.getElementById('submissionDate').value = submissionDate;
    document.getElementById('requiredDate').value = requiredDate;
    
    // Set document type radio buttons
    document.getElementById('PO').checked = data.documentType === 'PO';
    document.getElementById('NonPO').checked = data.documentType === 'NonPO';
    
    // Set remarks
    document.getElementById('remarks').value = data.remarks;

    // Set status
    if (data && data.status) {
        document.getElementById('status').value = data.status;
        console.log(data.status);
    }

    // Display attachments
    if (data.attachments) {
        displayAttachments(data.attachments);
    }

    // Store the values to be used after fetching options
    window.currentValues = {
        department: data.departmentName,
        classification: data.classification,
        status: data.status 
    };
    
    
    // Handle service/item details based on PR type
    if (data.prType === 'Service' && data.serviceDetails) {
        populateServiceDetails(data.serviceDetails);
    } else if (data.itemDetails) {
        populateItemDetails(data.itemDetails);
    }
    
    // Check if editable after populating data
    const isEditable = window.currentValues.status === 'Draft';
    toggleEditableFields(isEditable);
}

function populateServiceDetails(services) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (services.length === 0) {
        addRow(); // Add empty row if no services
        return;
    }
    
    services.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border">
                <input type="text" value="${service.description}" class="w-full service-description" maxlength="200" required />
            </td>
            <td class="p-2 border">
                <input type="text" value="${service.purpose}" class="w-full service-purpose" maxlength="10" required />
            </td>
            <td class="p-2 border">
                <input type="text" value="${service.quantity}" class="w-full service-quantity" maxlength="10" required />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function populateItemDetails(items) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (items.length === 0) {
        addRow(); // Add empty row if no items
        return;
    }
    
    items.forEach(item => {
        console.log(item);
        addItemRow(item);
    });
}

function addItemRow(item = null) {
    const tableBody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td class="p-2 border item-field bg-gray-100">
            <select class="w-full p-2 border rounded item-no" onchange="updateItemDescription(this)">
                <option value="" disabled ${!item ? 'selected' : ''}>Select Item</option>
                ${item ? `<option value="${item.itemCode}" selected>${item.itemCode}</option>` : ''}
            </select>
        </td>
        <td class="p-2 border item-field bg-gray-100">
            <input type="text" value="${item?.description || ''}" class="w-full item-description bg-gray-100" maxlength="200" disabled />
        </td>
        <td class="p-2 border item-field">
            <input type="text" value="${item?.detail || ''}" class="w-full item-detail" maxlength="100" required />
        </td>
        <td class="p-2 border item-field">
            <input type="text" value="${item?.purpose || ''}" class="w-full item-purpose" maxlength="100" required />
        </td>
        <td class="p-2 border item-field">
            <input type="number" value="${item?.quantity || ''}" class="w-full item-quantity" min="1" required />
        </td>
        <td class="p-2 border text-center item-field">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;
    
    tableBody.appendChild(row);
    
    // Fetch item options for the new dropdown
    const itemNoSelect = row.querySelector('.item-no');
    fetchItemOptions(itemNoSelect);
}

function addRow() {
    const prType = document.getElementById("prType").value;
    if (prType === "Service") {
        const tableBody = document.getElementById("tableBody");
        const newRow = document.createElement("tr");
        
        newRow.innerHTML = `
            <td class="p-2 border">
                <input type="text" class="w-full service-description" maxlength="200" required />
            </td>
            <td class="p-2 border">
                <input type="text" class="w-full service-purpose" maxlength="10" required />
            </td>
            <td class="p-2 border">
                <input type="text" class="w-full service-quantity" maxlength="10" required />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
            </td>
        `;
        
        tableBody.appendChild(newRow);
    } else {
        addItemRow();
    }
}

function updateItemDescription(selectElement) {
    const row = selectElement.closest('tr');
    const descriptionInput = row.querySelector('.item-description');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    
    // Check if a valid item is selected (not the placeholder option)
    if (selectedOption && !selectedOption.disabled && selectedOption.value && selectedOption.value !== "") {
        // Get description from data attribute first, fallback to parsing text
        const itemDescription = selectedOption.getAttribute('data-description');
        if (itemDescription) {
            descriptionInput.value = itemDescription;
        } else {
            // Fallback to old method for backward compatibility
            const itemText = selectedOption.text;
            const itemName = itemText.split(' - ')[1];
            descriptionInput.value = itemName || '';
        }
    } else {
        // No valid item selected, clear the description
        descriptionInput.value = '';
    }
    
    // Always keep description field disabled and gray
    descriptionInput.disabled = true;
    descriptionInput.classList.add('bg-gray-100');
}

function deleteRow(button) {
    button.closest("tr").remove();
}

function confirmDelete() {
    if (!prId) {
        alert('PR ID not found');
        return;
    }

    const endpoint = prType.toLowerCase() === 'service' ? 'service' : 'item';
    
    // Check if status is Draft before allowing delete
    const status = document.getElementById('status').value;
    if (status !== 'Draft') {
        alert('You can only delete PRs with Draft status');
        return;
    }

    if (confirm('Are you sure you want to delete this PR?')) {
        fetch(`${BASE_URL}/api/pr/${endpoint}/${prId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                alert('PR deleted successfully');
                window.location.href = '../pages/menuPR.html';
            } else {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `Failed to delete PR. Status: ${response.status}`);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting PR: ' + error.message);
        });
    }
}

function updatePR(isSubmit = false) {
    console.log("masuk");
    if (!prId) {
        alert('PR ID not found');
        return;
    }

    // Check the status before updating
    const status = window.currentValues?.status || document.getElementById('status')?.value;
    if (status !== 'Draft') {
        alert('You can only update PRs with Draft status');
        return;
    }

    // Show confirmation dialog only for submit
    if (isSubmit) {
        if (!confirm('Are you sure you want to submit this PR? You won\'t be able to edit it after submission.')) {
            return;
        }
    }

    const endpoint = prType.toLowerCase() === 'service' ? 'service' : 'item';

    try {
        // Create FormData object for the update
        const formData = new FormData();
        
        // Add basic fields
        formData.append('Id', prId);
        formData.append('PurchaseRequestNo', document.getElementById('purchaseRequestNo').value);
        

        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }


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
            formData.append('SubmissionDate', new Date(submissionDate).toISOString());
        }
        
        // Use the classification text from the select
        const classificationSelect = document.getElementById('classification');
        const selectedClassification = classificationSelect.options[classificationSelect.selectedIndex].text;
        formData.append('Classification', selectedClassification);
        
        formData.append('Remarks', document.getElementById('remarks').value);
        
        // Document type (PO or Non PO)
        const isPO = document.getElementById('PO').checked;
        const isNonPO = document.getElementById('NonPO').checked;
        formData.append('DocumentType', isPO ? 'PO' : (isNonPO ? 'NonPO' : ''));
        
        // Approvals - only include if checkboxes are checked
 
        formData.append('PreparedById', document.getElementById('preparedBy')?.value);
        formData.append('CheckedById', document.getElementById('checkedBy')?.value);
        formData.append('AcknowledgedById', document.getElementById('acknowledgeBy')?.value);
        formData.append('ApprovedById', document.getElementById('approvedBy')?.value);
        formData.append('ReceivedById', document.getElementById('receivedBy')?.value);
        
        // Item/Service details
        const rows = document.querySelectorAll('#tableBody tr');
        
        if (prType === 'Item') {
            rows.forEach((row, index) => {
                formData.append(`ItemDetails[${index}].ItemNo`, row.querySelector('.item-no').value);
                formData.append(`ItemDetails[${index}].Description`, row.querySelector('.item-description').value);
                formData.append(`ItemDetails[${index}].Detail`, row.querySelector('.item-detail').value);
                formData.append(`ItemDetails[${index}].Purpose`, row.querySelector('.item-purpose').value);
                formData.append(`ItemDetails[${index}].Quantity`, row.querySelector('.item-quantity').value);
            });
        } else if (prType === 'Service') {
            rows.forEach((row, index) => {
                formData.append(`ServiceDetails[${index}].Description`, row.querySelector('.service-description').value);
                formData.append(`ServiceDetails[${index}].Purpose`, row.querySelector('.service-purpose').value);
                formData.append(`ServiceDetails[${index}].Quantity`, row.querySelector('.service-quantity').value);
            });
        }
        
        // File attachments
        uploadedFiles.forEach(file => {
            formData.append('Attachments', file);
        });


        
        // Submit the form data
        fetch(`${BASE_URL}/api/pr/${endpoint}/${prId}`, {
            method: 'PUT',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                console.log("PR submitted successfully");
                if (isSubmit) {
                    alert('PR submitted successfully');
                } else {
                    alert('PR updated successfully');
                }
                // Refresh the page to show updated data
                location.reload();
            } else {
                return response.json().then(errorData => {
                    console.log("errorData", errorData);
                    throw new Error(errorData.message || `Failed to ${isSubmit ? 'submit' : 'update'} PR. Status: ${response.status}`);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`Error ${isSubmit ? 'submitting' : 'updating'} PR: ` + error.message);
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Error preparing update data: ' + error.message);
    }
}

// Function specifically for submitting PR
function submitPR(isSubmit = true) {
    console.log(isSubmit);
    updatePR(isSubmit);
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

function displayFileList() {
    const fileListContainer = document.getElementById("fileList");
    if (fileListContainer) {
        fileListContainer.innerHTML = '';
        uploadedFiles.forEach((file, index) => {
            const fileItem = document.createElement("div");
            fileItem.className = "flex justify-between items-center p-2 border-b";
            fileItem.innerHTML = `
                <span>${file.name}</span>
                <button type="button" onclick="removeFile(${index})" class="text-red-500 hover:text-red-700">
                    Remove
                </button>
            `;
            fileListContainer.appendChild(fileItem);
        });
    }
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    displayFileList();
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

function toggleFields() {
    const prType = document.getElementById("prType").value;
    console.log("PR Type selected:", prType);
    
    const itemFields = document.querySelectorAll('.item-field');
    const serviceFields = document.querySelectorAll('.service-field');

    if (prType === "Item") {
        itemFields.forEach(field => field.style.display = "table-cell");
        serviceFields.forEach(field => field.style.display = "none");
    } else if (prType === "Service") {
        itemFields.forEach(field => field.style.display = "none");
        serviceFields.forEach(field => field.style.display = "table-cell");
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
// Function to display attachments
function displayAttachments(attachments) {
    const attachmentsList = document.getElementById('attachmentsList');
    if (!attachmentsList) return;
    
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