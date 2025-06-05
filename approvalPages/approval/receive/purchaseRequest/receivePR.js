let uploadedFiles = [];

let prId; // Declare global variable
let prType; // Declare global variable
let currentTab; // Declare global variable for tab

// Function to fetch PR details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    prId = urlParams.get('pr-id');
    prType = urlParams.get('pr-type');
    currentTab = urlParams.get('tab'); // Get the tab parameter
    
    if (prId && prType) {
        fetchPRDetails(prId, prType);
    }
    
    // Hide approve/reject buttons if viewing from received or rejected tabs
    if (currentTab === 'received' || currentTab === 'rejected') {
        hideApprovalButtons();
    }
    
    // Hide service fields by default
    const serviceFields = ["thDescription", "thPurposes", "thQty", "thActions", 
                          "tdDescription", "tdPurposeds", "tdQty", "tdActions"];
    serviceFields.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.style.display = "none";
    });
};

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
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error fetching PR details: ' + error.message);
        });
}

function populatePRDetails(data) {
    // Populate basic PR information
    document.getElementById('purchaseRequestNo').value = data.purchaseRequestNo;
    document.getElementById('requesterName').value = data.requesterName;
    document.getElementById('prType').value = data.prType;
  
    // Format and set dates
    const submissionDate = new Date(data.submissionDate).toISOString().split('T')[0];
    const requiredDate = new Date(data.requiredDate).toISOString().split('T')[0];
    document.getElementById('submissionDate').value = submissionDate;
    document.getElementById('requiredDate').value = requiredDate;
    
    // Set document type checkboxes
    document.getElementById('PO').checked = data.documentType === 'PO';
    document.getElementById('NonPO').checked = data.documentType === 'NonPO';
    
    // Set remarks
    if (document.getElementById('remarks')) {
        document.getElementById('remarks').value = data.remarks;
    }

    // Set status
    if (data && data.status) {
        console.log('Status:', data.status);
        var option = document.createElement('option');
        option.value = data.status;
        option.textContent = data.status;
        document.getElementById('status').appendChild(option);
        document.getElementById('status').value = data.status;
    }
    
    // Toggle fields to show correct table headers before populating data
    console.log('Calling toggleFields() for PR type:', data.prType);
    toggleFields();
    
    // Handle service/item details based on PR type
    if (data.prType === 'Service' && data.serviceDetails) {
        populateServiceDetails(data.serviceDetails);
    } else if (data.itemDetails) {
        populateItemDetails(data.itemDetails);
    }
    
    // Make all fields read-only since this is an approval page
    makeAllFieldsReadOnly();
}

function populateServiceDetails(services) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (services.length === 0) {
        return;
    }
    
    console.log('Service details:', services);
    
    services.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border">
                <input type="text" value="${service.description || ''}" class="w-full service-description" maxlength="200" required />
            </td>
            <td class="p-2 border">
                <input type="text" value="${service.purpose || ''}" class="w-full service-purpose" maxlength="10" required />
            </td>
            <td class="p-2 border">
                <input type="text" value="${service.quantity || ''}" class="w-full service-quantity" maxlength="10" required />
            </td>
            <td class="p-2 border text-center">
                <!-- Read-only view, no action buttons -->
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function populateItemDetails(items) {
    const tableBody = document.getElementById('tableBody');
    
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (items.length === 0) {
        console.log('No items to display');
        return;
    }
    
    items.forEach((item, index) => {
        try {
            addItemRow(item);
        } catch (error) {
        }
    });
    
}

function addItemRow(item = null) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.error('tableBody element not found!');
        return;
    }
    
    const row = document.createElement('tr');

    
    // Since itemNo appears to be an ID, we'll display the description as the item identifier for now
    // You might want to fetch the actual item details using the itemNo ID
    row.innerHTML = `
        <td class="p-2 border item-field">
            <input type="text" value="${item?.itemNo || ''}" class="w-full item-no" readonly placeholder="Item ID" />
        </td>
        <td class="p-2 border item-field">
            <input type="text" value="${item?.description || ''}" class="w-full item-description" maxlength="200" readonly />
        </td>
        <td class="p-2 border item-field">
            <input type="text" value="${item?.detail || ''}" class="w-full item-detail" maxlength="100" readonly />
        </td>
        <td class="p-2 border item-field">
            <input type="text" value="${item?.purpose || ''}" class="w-full item-purpose" maxlength="100" readonly />
        </td>
        <td class="p-2 border item-field">
            <input type="number" value="${item?.quantity || ''}" class="w-full item-quantity" min="1" readonly />
        </td>
        <td class="p-2 border text-center item-field">
            <!-- Read-only view, no action buttons -->
        </td>
    `;
    
    tableBody.appendChild(row);
}

// Function to fetch all dropdown options
function fetchDropdownOptions(prData = null) {
    fetchDepartments();
    fetchUsers(prData);
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
            populateDepartmentSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching departments:', error);
        });
}

// Function to fetch users from API
function fetchUsers(prData = null) {
    fetch(`${BASE_URL}/api/users`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            populateUserSelects(data.data, prData);
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
}

function populateClassificationSelect(classifications) {
    const classificationSelect = document.getElementById("classification");
    if (!classificationSelect) return;
    
    classificationSelect.innerHTML = '<option value="" disabled>Select Classification</option>';

    classifications.forEach(classification => {
        const option = document.createElement("option");
        option.value = classification.id;
        option.textContent = classification.name;
        classificationSelect.appendChild(option);
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
        const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`;
        return userName.toLowerCase().includes(searchText);
    });
    
    // Display search results
    filteredUsers.forEach(user => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`;
        option.innerText = userName;
        option.onclick = function() {
            searchInput.value = userName;
            
            // Get the correct select element based on fieldId
            let selectId;
            switch(fieldId) {
                case 'preparedBy': selectId = 'preparedBy'; break;
                case 'acknowledgeBy': selectId = 'knowledgeBy'; break;
                case 'checkedBy': selectId = 'checkedBy'; break;
                case 'approvedBy': selectId = 'approvedBy'; break;
                case 'receivedBy': selectId = 'receivedBy'; break;
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

// Modified populateUserSelects to store users globally and update search inputs
function populateUserSelects(users, prData = null) {
    // Store users globally for search functionality
    window.allUsers = users;
    
    const selects = [
        { id: 'preparedBy', approvalKey: 'preparedById', searchId: 'preparedBySearch' },
        { id: 'checkedBy', approvalKey: 'checkedById', searchId: 'checkedBySearch' },
        { id: 'knowledgeBy', approvalKey: 'knowledgeById', searchId: 'acknowledgeBySearch' },
        { id: 'approvedBy', approvalKey: 'approvedById', searchId: 'approvedBySearch' },
        { id: 'receivedBy', approvalKey: 'receivedById', searchId: 'receivedBySearch' }
    ];
    
    selects.forEach(selectInfo => {
        const select = document.getElementById(selectInfo.id);
        if (select) {
            select.innerHTML = '<option value="" disabled>Select User</option>';
            
            users.forEach(user => {
                const option = document.createElement("option");
                option.value = user.id;
                option.textContent = user.name || `${user.firstName} ${user.lastName}`;
                select.appendChild(option);
            });
            
            // Set the value from PR data if available and update search input
            if (prData && prData[selectInfo.approvalKey]) {
                select.value = prData[selectInfo.approvalKey];
                
                // Update the search input to display the selected user's name
                const searchInput = document.getElementById(selectInfo.searchId);
                if (searchInput) {
                    const selectedUser = users.find(user => user.id === prData[selectInfo.approvalKey]);
                    if (selectedUser) {
                        searchInput.value = selectedUser.name || `${selectedUser.firstName} ${selectedUser.lastName}`;
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

// Function to approve or reject the PR
function updatePRStatus(status) {
    if (!prId) {
        alert('PR ID not found');
        return;
    }

    let remarks = '';
    if (status === 'reject') {
        remarks = prompt('Please provide remarks for rejection:');
        if (remarks === null) {
            return; // User cancelled
        }
    }

    const userId = getUserId();
    if (!userId) {
        alert("Unable to get user ID from token. Please login again.");
        return;
    }

    const requestData = {
        id: prId,
        UserId: userId,
        Status: status,
        Remarks: remarks
    };

    const endpoint = prType.toLowerCase() === 'service' ? 'service' : 'item';
    
    fetch(`${BASE_URL}/api/pr/${endpoint}/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (response.ok) {
            alert(`PR ${status === 'approve' ? 'received' : 'rejected'} successfully`);
            // Navigate back to the receive dashboard
            window.location.href = '../../../dashboard/dashboardReceive/menuPRReceive.html';
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to ${status} PR. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error ${status === 'approve' ? 'receiving' : 'rejecting'} PR: ` + error.message);
    });
}

// Function to receive PR (approve)
function approvePR() {
    updatePRStatus('approve');
}

// Function to reject PR
function rejectPR() {
    updatePRStatus('reject');
}

function toggleFields() {
    const prType = document.getElementById("prType").value;
    
    const itemFields = ["thItemCode", "thItemName", "thDetail", "thPurposed", "thQuantity", "thAction", 
                        "tdItemCode", "tdItemName", "tdDetail", "tdPurposed", "tdQuantity", "tdAction"];
    const serviceFields = ["thDescription", "thPurposes", "thQty", "thActions", 
                          "tdDescription", "tdPurposeds", "tdQty", "tdActions"];

    console.log('Item fields to show/hide:', itemFields);
    console.log('Service fields to show/hide:', serviceFields);

    if (prType === "Item") {
        console.log('Showing item fields, hiding service fields');
        itemFields.forEach(id => {
            const elem = document.getElementById(id);
            console.log(`Item field ${id}:`, elem);
            if (elem) {
                elem.style.display = "table-cell";
                console.log(`Set ${id} to table-cell`);
            } else {
                console.log(`Element ${id} not found!`);
            }
        });
        serviceFields.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = "none";
                console.log(`Set ${id} to none`);
            }
        });
    } else if (prType === "Service") {
        console.log('Showing service fields, hiding item fields');
        itemFields.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = "none";
            }
        });
        serviceFields.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = "table-cell";
            }
        });
    }
    
    console.log('toggleFields completed');
}

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");
    const prType = document.getElementById("prType").value;

    if (prType === "Item") {
        newRow.innerHTML = `
            <td id="tdItemCode" class="p-2 border">
                <select class="w-full p-2 border rounded" onchange="fillItemDetails()">
                    <option value="" disabled selected>Select Item Code</option>
                    <option value="ITM001">ITM001 - Laptop</option>
                    <option value="ITM002">ITM002 - Printer</option>
                    <option value="ITM003">ITM003 - Scanner</option>
                </select>
            </td>
            <td id="tdItemName" class="p-2 border"><input type="text" maxlength="200" class="w-full" readonly /></td>
            <td id="tdDetail" class="p-2 border"><input type="number" maxlength="10" class="w-full" required /></td>
            <td id="tdPurposed" class="p-2 border"><input type="text" maxlength="200" class="w-full" required /></td>
            <td id="tdQuantity" class="p-2 border"><input type="number" maxlength="10" class="w-full" required /></td>
            <td id="tdAction" class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
            </td>
        `;
    } else if (prType === "Service") {
        newRow.innerHTML = `
            <td id="tdDescription" class="p-2 border"><input type="text" maxlength="200" class="w-full" required /></td>
            <td id="tdPurposeds" class="p-2 border"><input type="text" maxlength="200" class="w-full" required /></td>
            <td id="tdQty" class="p-2 border"><input type="number" maxlength="10" class="w-full" required /></td>
            <td id="tdActions" class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
            </td>
        `;
    }

    tableBody.appendChild(newRow);
}

function deleteRow(button) {
    button.closest("tr").remove();
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
    const fileInput = document.getElementById('filePath');
    if (fileInput) {
        fileInput.disabled = true;
        fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
}

// Function to hide approval buttons
function hideApprovalButtons() {
    const approveButton = document.querySelector('button[onclick="approvePR()"]');
    const rejectButton = document.querySelector('button[onclick="rejectPR()"]');
    
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

function updateItemDescription(selectElement) {
    const row = selectElement.closest('tr');
    const descriptionInput = row.querySelector('.item-description');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    
    if (selectedOption && !selectedOption.disabled) {
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
        descriptionInput.value = '';
    }
}