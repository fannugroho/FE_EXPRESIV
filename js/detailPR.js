let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep

let prId; // Declare global variable

// Helper function to format date as YYYY-MM-DD without timezone issues
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Function to setup date fields with validation and defaults
function setupDateFields() {
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    
    const submissionDateInput = document.getElementById("submissionDate");
    const requiredDateInput = document.getElementById("requiredDate");
    
    if (submissionDateInput && requiredDateInput) {
        // Set minimum date for submission date to today
        submissionDateInput.min = formattedDate;
        
        // Function to update required date minimum based on submission date
        const updateRequiredDateMin = function() {
            const submissionValue = submissionDateInput.value;
            if (submissionValue) {
                const selectedDate = new Date(submissionValue + 'T00:00:00'); // Add time to avoid timezone issues
                const minRequiredDate = new Date(selectedDate);
                minRequiredDate.setDate(selectedDate.getDate() + 14); // 2 weeks = 14 days
                
                const minRequiredFormatted = formatDateForInput(minRequiredDate);
                requiredDateInput.min = minRequiredFormatted;
                
                // If current required date is less than minimum, update it
                if (requiredDateInput.value) {
                    const currentRequiredDate = new Date(requiredDateInput.value + 'T00:00:00');
                    if (currentRequiredDate < minRequiredDate) {
                        requiredDateInput.value = minRequiredFormatted;
                    }
                } else {
                    // If no required date is set, set it to minimum (2 weeks from submission)
                    requiredDateInput.value = minRequiredFormatted;
                }
            }
        };
        
        // Add event listener to automatically update required date when submission date changes
        submissionDateInput.addEventListener('change', updateRequiredDateMin);
        
        // Store the update function globally so it can be called after data is populated
        window.updateRequiredDateMin = updateRequiredDateMin;
    }
}

// Function to set default dates (called after checking if fields are empty)
function setDefaultDatesIfEmpty() {
    const submissionDateInput = document.getElementById("submissionDate");
    const requiredDateInput = document.getElementById("requiredDate");
    
    // Only set defaults if the PR is in Draft status and fields are empty
    const status = window.currentValues?.status || document.getElementById('status')?.value;
    if (status === 'Draft') {
        const today = new Date();
        const formattedDate = formatDateForInput(today);
        
        // Set default issuance date to today if empty
        if (!submissionDateInput.value) {
            submissionDateInput.value = formattedDate;
        }
        
        // Set default required date to 2 weeks from issuance date if empty
        if (!requiredDateInput.value) {
            const issuanceDate = submissionDateInput.value ? new Date(submissionDateInput.value + 'T00:00:00') : today;
            const twoWeeksFromIssuance = new Date(issuanceDate);
            twoWeeksFromIssuance.setDate(issuanceDate.getDate() + 14);
            const requiredDateFormatted = formatDateForInput(twoWeeksFromIssuance);
            
            requiredDateInput.value = requiredDateFormatted;
        }
    }
}

// Function to fetch PR details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    prId = urlParams.get('pr-id');
    prType = urlParams.get('pr-type');
    
    // Set up date validation and defaults
    setupDateFields();
    
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
    // Handle case when users is null, undefined, or empty
    if (!users || users.length === 0) {
        users = [];
    }

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
        console.log("Before populating users, RequesterId value:", requesterSelect.value);
        const currentValue = requesterSelect.value; // Store current value
        
        // Get requester ID from approval data if available
        const requesterIdFromData = approvalData?.requesterId;
        const targetRequesterId = requesterIdFromData || currentValue;
        
        // Clear existing options except the currently selected one
        requesterSelect.innerHTML = '<option value="" disabled>Select Requester</option>';
        
        if (users && users.length > 0) {
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.fullName;
                // Pre-select if this matches the target requester ID
                if (targetRequesterId && user.id === targetRequesterId) {
                    option.selected = true;
                }
                requesterSelect.appendChild(option);
            });
        }
        
        // Ensure the correct value is set
        if (targetRequesterId) {
            requesterSelect.value = targetRequesterId;
            
            // Update the search input to show the selected requester's name
            const requesterSearchInput = document.getElementById('requesterSearch');
            if (requesterSearchInput) {
                const selectedUser = users.find(user => user.id === targetRequesterId);
                if (selectedUser) {
                    requesterSearchInput.value = selectedUser.fullName;
                }
            }
        }
        
        console.log("After populating users, RequesterId value:", requesterSelect.value);
        console.log("Target RequesterId was:", targetRequesterId);
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
            
            // Check if window.requesters exists and is an array
            if (!window.requesters || !Array.isArray(window.requesters) || window.requesters.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No requesters available';
                requesterDropdown.appendChild(noResults);
                return;
            }
            
            const filteredRequesters = window.requesters.filter(r => 
                r.fullName && r.fullName.toLowerCase().includes(filter)
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
        if (window.requesters && window.requesters.length > 0) {
            populateRequesterDropdown();
        }
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
            
            if (users && users.length > 0) {
                users.forEach(user => {
                    // console.log("user", user);
                    const option = document.createElement("option");
                    option.value = user.id;
                    option.textContent = user.fullName;
                    select.appendChild(option);
                });
            }
            
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
    const filteredUsers = window.employees && window.employees.length > 0 ? 
        window.employees.filter(user => user.fullName && user.fullName.toLowerCase().includes(searchText)) : 
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
            console.log("API Response Data:", responseData.data);
            console.log("Requester ID from API:", responseData.data.requesterId);
            console.log("Requester Name from API:", responseData.data.requesterName);
            console.log("Classification from API:", responseData.data.classification);
            
            // Simpan nilai klasifikasi terlebih dahulu
            window.currentValues = {
                department: responseData.data.departmentName,
                classification: responseData.data.classification,
                status: responseData.data.status 
            };
            
            // Fetch dropdown options FIRST, especially items
            await fetchDropdownOptions(responseData.data);
            
            // Then populate PR details so items can be properly matched
            populatePRDetails(responseData.data);
            
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
async function fetchDropdownOptions(approvalData = null) {
    // Fetch items first since they're critical for proper item selection
    await fetchItemOptions();
    
    // Fetch other dropdown options in parallel
    await Promise.all([
        fetchDepartments(),
        fetchClassifications(),
        fetchUsers() // Don't pass approval data here, will be handled later in populatePRDetails
    ]);
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
        // Jika gagal fetch departments, populate dengan array kosong
        populateDepartmentSelect([]);
        // Tampilkan pesan error kepada pengguna
        console.warn('Failed to load departments from API. Please check your connection and try again.');
    }
}

// Function to fetch classifications from API
async function fetchClassifications() {
    try {
        console.log("Fetching classifications with currentValues:", window.currentValues);
        const response = await makeAuthenticatedRequest('/api/classifications');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        console.log("Classification data:", data);
        populateClassificationSelect(data.data);
    } catch (error) {
        console.error('Error fetching classifications:', error);
        // Jika gagal fetch classifications, populate dengan array kosong
        populateClassificationSelect([]);
        // Tampilkan pesan error kepada pengguna
        console.warn('Failed to load classifications from API. Please check your connection and try again.');
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
        
        // Store users globally first
        window.allUsers = data.data;
        window.requesters = data.data.map(user => ({
            id: user.id,
            fullName: user.fullName,
            department: user.department
        }));
        window.employees = data.data.map(user => ({
            id: user.id,
            kansaiEmployeeId: user.kansaiEmployeeId,
            fullName: user.fullName,
            department: user.department
        }));
        
        // Only call populateUserSelects if we have approval data (i.e., when called from fetchDropdownOptions)
        if (approvalData) {
            populateUserSelects(data.data, approvalData);
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        // Jika gagal fetch users, set array kosong
        window.allUsers = [];
        window.requesters = [];
        window.employees = [];
        // Tampilkan pesan error kepada pengguna
        console.warn('Failed to load users from API. Please check your connection and try again.');
    }
}

// Store items globally for search functionality
let allItems = [];

// Function to fetch items from API
async function fetchItemOptions() {
    try {
        const response = await makeAuthenticatedRequest('/api/items');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        console.log("Item data:", data);
        allItems = data.data; // Store items globally
        
        // Note: Item dropdowns will be set up properly when populateItemDetails() 
        // is called after items are loaded, so no need to set them up here
    } catch (error) {
        console.error('Error fetching items:', error);
        // Jika gagal fetch items, set allItems ke array kosong
        allItems = [];
        // Tampilkan pesan error kepada pengguna
        console.warn('Failed to load items from API. Please check your connection and try again.');
    }
}

// Function to setup searchable item dropdown for a row
function setupItemDropdown(row, existingItemCode = null) {
    const itemInput = row.querySelector('.item-input');
    const itemDropdown = row.querySelector('.item-dropdown');
    const descriptionInput = row.querySelector('.item-description');
    const uomInput = row.querySelector('.item-uom');
    
    if (!itemInput || !itemDropdown) return;
    
    // Set existing item code if provided
    if (existingItemCode) {
        itemInput.value = existingItemCode;
        const existingItem = allItems.find(item => item.itemCode === existingItemCode);
        if (existingItem) {
            updateItemDescriptionFromData(row, existingItem);
        }
    }
    
    itemInput.addEventListener('input', function() {
        const searchText = this.value.toLowerCase();
        
        // Clear dropdown
        itemDropdown.innerHTML = '';
        
        // Filter items based on search text (search in both itemCode and itemName)
        const filteredItems = allItems && allItems.length > 0 ? allItems.filter(item => 
            item.itemCode && item.itemCode.toLowerCase().includes(searchText) ||
            item.itemName && item.itemName.toLowerCase().includes(searchText)
        ) : [];
        
        if (filteredItems.length > 0) {
            filteredItems.forEach(item => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerHTML = `<span class="font-medium">${item.itemCode}</span> - ${item.itemName}`;
                option.onclick = function() {
                    itemInput.value = item.itemCode;
                    itemInput.setAttribute('data-selected-item', JSON.stringify(item));
                    itemDropdown.classList.add('hidden');
                    
                    // Update description and UOM
                    updateItemDescriptionFromData(row, item);
                };
                itemDropdown.appendChild(option);
            });
            itemDropdown.classList.remove('hidden');
        } else {
            itemDropdown.classList.add('hidden');
        }
    });
    
    itemInput.addEventListener('focus', function() {
        if (allItems && allItems.length > 0) {
            // Show all items on focus
            itemDropdown.innerHTML = '';
            
            allItems.forEach(item => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerHTML = `<span class="font-medium">${item.itemCode}</span> - ${item.itemName}`;
                option.onclick = function() {
                    itemInput.value = item.itemCode;
                    itemInput.setAttribute('data-selected-item', JSON.stringify(item));
                    itemDropdown.classList.add('hidden');
                    
                    // Update description and UOM
                    updateItemDescriptionFromData(row, item);
                };
                itemDropdown.appendChild(option);
            });
            itemDropdown.classList.remove('hidden');
        }
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!itemInput.contains(event.target) && !itemDropdown.contains(event.target)) {
            itemDropdown.classList.add('hidden');
        }
    });
}

// Function to update description and UOM from item data
function updateItemDescriptionFromData(row, item) {
    const descriptionInput = row.querySelector('.item-description');
    const uomInput = row.querySelector('.item-uom');
    
    if (!item) {
        descriptionInput.value = '';
        uomInput.value = '';
        return;
    }
    
    const itemDescription = item.description || item.name || item.itemName || '';
    const itemUom = item.uom || item.unitOfMeasure || '';
    
    descriptionInput.value = itemDescription;
    descriptionInput.textContent = itemDescription; // For textarea
    descriptionInput.title = itemDescription; // For tooltip
    
    uomInput.value = itemUom;
    uomInput.title = itemUom; // For tooltip
    
    // Keep the fields disabled and gray (not editable by user)
    descriptionInput.disabled = true;
    descriptionInput.classList.add('bg-gray-100');
    uomInput.disabled = true;
    uomInput.classList.add('bg-gray-100');
}

// Function to populate department select
function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("department");
    if (!departmentSelect) return;
    
    // Store the currently selected value
    const currentValue = departmentSelect.value;
    const currentText = departmentSelect.options[departmentSelect.selectedIndex]?.text;
    
    departmentSelect.innerHTML = '<option value="" disabled>Select Department</option>';

    if (departments && departments.length > 0) {
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
    }
    
    // If we have a current value and it wasn't matched by text, try to select by value
    if (currentValue && departmentSelect.value !== currentValue) {
        departmentSelect.value = currentValue;
    }
}

// Function to populate classification select
function populateClassificationSelect(classifications) {
    const classificationSelect = document.getElementById("classification");
    if (!classificationSelect) return;
    
    // Log untuk debugging
    console.log("Classifications from API:", classifications);
    console.log("Current classification value:", window.currentValues?.classification);
    
    // Store the currently selected value
    const currentValue = classificationSelect.value;
    const currentText = classificationSelect.options[classificationSelect.selectedIndex]?.text;
    
    classificationSelect.innerHTML = '<option value="" disabled>Select Classification</option>';

    if (classifications && classifications.length > 0) {
        classifications.forEach(classification => {
            const option = document.createElement("option");
            option.value = classification.id;
            option.textContent = classification.name;
            classificationSelect.appendChild(option);
            
            // Coba cocokkan berdasarkan nama atau ID
            if ((window.currentValues && window.currentValues.classification && 
                (classification.name === window.currentValues.classification || 
                 classification.id === window.currentValues.classification)) ||
                classification.name === currentText) {
                option.selected = true;
                console.log("Classification matched:", classification.name);
            }
        });
    }
    
    // Jika masih belum ada yang terpilih, coba pilih berdasarkan nilai
    if (currentValue && classificationSelect.value !== currentValue) {
        classificationSelect.value = currentValue;
    }
}

// Legacy functions kept for backward compatibility (no longer used)

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
    const tableInputs = document.querySelectorAll('#tableBody input:not(.item-description):not(.item-uom)');
    tableInputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
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
        console.log("Setting requesterSearch to:", data.requesterName);
        document.getElementById('requesterSearch').value = data.requesterName;
        // Store the requester ID if available
        if (data.requesterId) {
            console.log("Setting RequesterId to:", data.requesterId);
            document.getElementById('RequesterId').value = data.requesterId;
        } else {
            console.log("No requesterId found in data. Available fields:", Object.keys(data));
        }
    } else {
        console.log("No requesterName found in data");
    }
    
    // Format and set dates - extract date part directly to avoid timezone issues
    const submissionDate = data.submissionDate ? data.submissionDate.split('T')[0] : '';
    const requiredDate = data.requiredDate ? data.requiredDate.split('T')[0] : '';
    document.getElementById('submissionDate').value = submissionDate;
    document.getElementById('requiredDate').value = requiredDate;
    
    // Set remarks
    document.getElementById('remarks').value = data.remarks || '';
    
    // Handle rejection remarks if status is Rejected
    if (data.status === 'Rejected') {
        // Show the rejection remarks section
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        const rejectionTextarea = document.getElementById('rejectionRemarks');
        
        if (rejectionSection && rejectionTextarea) {
            // Check for various possible rejection remarks fields
            let rejectionRemarks = '';
            
            // Check for specific rejection remarks by role
            if (data.remarksRejectByChecker) {
                rejectionRemarks = data.remarksRejectByChecker;
            } else if (data.remarksRejectByAcknowledger) {
                rejectionRemarks = data.remarksRejectByAcknowledger;
            } else if (data.remarksRejectByApprover) {
                rejectionRemarks = data.remarksRejectByApprover;
            } else if (data.remarksRejectByReceiver) {
                rejectionRemarks = data.remarksRejectByReceiver;
            } else if (data.rejectedRemarks) {
                rejectionRemarks = data.rejectedRemarks;
            } else if (data.rejectionRemarks) {
                rejectionRemarks = data.rejectionRemarks;
            }
            
            if (rejectionRemarks) {
                rejectionSection.style.display = 'block';
                rejectionTextarea.value = rejectionRemarks;
            } else {
                rejectionSection.style.display = 'none';
            }
        }
    } else {
        // Hide the rejection remarks section if status is not Rejected
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        if (rejectionSection) {
            rejectionSection.style.display = 'none';
        }
    }

    // Display revised remarks if available
    displayRevisedRemarks(data);

    // Set status
    if (data && data.status) {
        document.getElementById('status').value = data.status;
        console.log(data.status);
    }

    // Classification will be set when API data is fetched via populateClassificationSelect

    // Store and display attachments
    if (data.attachments) {
        existingAttachments = data.attachments;
        attachmentsToKeep = data.attachments.map(att => att.id); // Initially keep all existing attachments
        displayAttachments(data.attachments);
    }

    // Log untuk debugging nilai klasifikasi yang tersimpan
    console.log("Current values when populating PR details:", window.currentValues);
    
    // Handle item details
    if (data.itemDetails) {
        populateItemDetails(data.itemDetails);
    }
    
    // Now that requester data is set, populate user selects with proper selection
    if (window.allUsers) {
        populateUserSelects(window.allUsers, data);
    }
    
    // Set default dates if fields are empty (only for Draft status)
    setDefaultDatesIfEmpty();
    
    // Apply date validation after data is populated
    if (window.updateRequiredDateMin) {
        window.updateRequiredDateMin();
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
        <td class="p-2 border relative">
            <input type="text" class="item-input w-full p-2 border rounded" placeholder="Search item..." value="${item?.itemNo || ''}" />
            <div class="item-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-40 overflow-y-auto"></div>
        </td>
        <td class="p-2 border bg-gray-100">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="200" disabled title="${item?.description || ''}" style="height: 40px;">${item?.description || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-detail text-center overflow-x-auto whitespace-nowrap" maxlength="100" required style="resize: none; height: 40px;">${item?.detail || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-purpose text-center overflow-x-auto whitespace-nowrap" maxlength="100" required style="resize: none; height: 40px;">${item?.purpose || ''}</textarea>
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
    
    // Setup searchable item dropdown for the new row
    setupItemDropdown(row, item?.itemNo);
}

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");
    
    newRow.innerHTML = `
        <td class="p-2 border relative">
            <input type="text" class="item-input w-full p-2 border rounded" placeholder="Search item..." />
            <div class="item-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-40 overflow-y-auto"></div>
        </td>
        <td class="p-2 border bg-gray-100">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="200" disabled style="height: 40px;"></textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-detail text-center overflow-x-auto whitespace-nowrap" maxlength="100" required style="resize: none; height: 40px;"></textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-purpose text-center overflow-x-auto whitespace-nowrap" maxlength="100" required style="resize: none; height: 40px;"></textarea>
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
    
    // Setup searchable item dropdown for the new row
    setupItemDropdown(newRow);
}

// Legacy function kept for backward compatibility (no longer used)
function updateItemDescription(selectElement) {
    // This function is kept for backward compatibility but no longer used
    // The new searchable implementation uses updateItemDescriptionFromData instead
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
        const actionText = isSubmit ? 'Submitting' : 'Updating';
        Swal.fire({
            title: `${actionText}...`,
            text: `Please wait while we ${isSubmit ? 'submit' : 'update'} the PR.`,
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });


        // Always use the original requester ID, don't fallback to logged-in user
        const requesterIdElement = document.getElementById("RequesterId");
        console.log("RequesterId element found:", !!requesterIdElement);
        if (requesterIdElement) {
            console.log("RequesterId element value:", requesterIdElement.value);
            console.log("All options in RequesterId select:", Array.from(requesterIdElement.options).map(opt => ({ value: opt.value, text: opt.textContent })));
        }
        
        const requesterIdValue = requesterIdElement?.value;
        if (!requesterIdValue) {
            console.log("RequesterId is empty, current value:", requesterIdValue);
            Swal.fire({
                title: 'Error!',
                text: 'Requester ID is missing. Please refresh the page and try again.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        formData.append('RequesterId', requesterIdValue);
        console.log("RequesterId:", requesterIdValue);
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
            formData.append(`ItemDetails[${index}].ItemNo`, row.querySelector('.item-input').value);
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

        console.log("formData", formData);

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
    const attachmentsList = document.getElementById('attachmentsList');
    if (!attachmentsList) return;
    
    // Clear the attachments list
    attachmentsList.innerHTML = '';
    
    if (attachments && attachments.length > 0) {
        attachments.forEach((attachment, index) => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'flex justify-between items-center p-1 mb-1 bg-white rounded';
            
            // Create file name display with icon
            const fileNameDisplay = document.createElement('div');
            fileNameDisplay.className = 'flex items-center';
            
            // Add PDF icon
            const fileIcon = document.createElement('span');
            fileIcon.className = 'text-red-500 mr-2';
            fileIcon.innerHTML = '📄'; // PDF icon
            fileNameDisplay.appendChild(fileIcon);
            
            // Add file name
            const fileName = document.createElement('span');
            fileName.textContent = attachment.fileName || `Attachment ${index + 1}`;
            fileName.className = 'text-sm';
            fileNameDisplay.appendChild(fileName);
            
            attachmentItem.appendChild(fileNameDisplay);
            
            // Add download/view button
            const actionButtons = document.createElement('div');
            actionButtons.className = 'flex space-x-2';
            
            // View button
            const viewButton = document.createElement('button');
            viewButton.type = 'button';
            viewButton.className = 'text-blue-500 hover:text-blue-700 text-sm';
            viewButton.innerHTML = '👁️'; // Eye icon
            viewButton.title = 'View attachment';
            viewButton.onclick = function() {
                window.open(attachment.filePath, '_blank');
            };
            actionButtons.appendChild(viewButton);
            
            // Delete button (only shown for Draft status)
            if (window.currentValues?.status === 'Draft') {
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'text-red-500 hover:text-red-700 text-sm';
                deleteButton.innerHTML = '🗑️'; // Trash icon
                deleteButton.title = 'Remove attachment';
                deleteButton.onclick = function() {
                    removeExistingAttachment(attachment.id);
                };
                actionButtons.appendChild(deleteButton);
            }
            
            attachmentItem.appendChild(actionButtons);
            attachmentsList.appendChild(attachmentItem);
        });
    }
}

// Function to display revised remarks from API
function displayRevisedRemarks(data) {
    const revisedRemarksSection = document.getElementById('revisedRemarksSection');
    const revisedCountElement = document.getElementById('revisedCount');
    
    // Check if there are any revisions
    const hasRevisions = data.revisions && data.revisions.length > 0;
    
    if (hasRevisions) {
        revisedRemarksSection.style.display = 'block';
        revisedCountElement.textContent = data.revisions.length || '0';
        
        // Clear existing revision content from the revisedRemarksSection
        revisedRemarksSection.innerHTML = `
            <h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>
            <div class="bg-gray-50 p-4 rounded-lg border">
                <div class="mb-2">
                    <span class="text-sm font-medium text-gray-600">Total Revisions: </span>
                    <span id="revisedCount" class="text-sm font-bold text-blue-600">0</span>
                </div>
                <!-- Dynamic revision content will be inserted here by JavaScript -->
            </div>
        `;
        
        // Group revisions by stage
        const revisionsByStage = {};
        data.revisions.forEach(revision => {
            // Map enum values to display names
            let stageName = 'Unknown';
            if (revision.stage === 'Checked' || revision.stage === 1) {
                stageName = 'Checked';
            } else if (revision.stage === 'Acknowledged' || revision.stage === 2) {
                stageName = 'Acknowledged';
            } else if (revision.stage === 'Approved' || revision.stage === 3) {
                stageName = 'Approved';
            } else if (revision.stage === 'Received' || revision.stage === 4) {
                stageName = 'Received';
            }
            
            if (!revisionsByStage[stageName]) {
                revisionsByStage[stageName] = [];
            }
            revisionsByStage[stageName].push(revision);
        });
        
        // Display revisions grouped by stage
        Object.keys(revisionsByStage).forEach(stage => {
            const stageRevisions = revisionsByStage[stage];
            
            // Create stage header
            const stageHeader = document.createElement('div');
            stageHeader.className = 'mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded';
            stageHeader.innerHTML = `
                <h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${stageRevisions.length})</h4>
            `;
            revisedRemarksSection.appendChild(stageHeader);
            
            // Display each revision in this stage
            stageRevisions.forEach((revision, index) => {
                const revisionContainer = document.createElement('div');
                revisionContainer.className = 'mb-3 ml-4';
                revisionContainer.innerHTML = `
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <label class="text-sm font-medium text-gray-700">Revision ${index + 1}:</label>
                            <div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${revision.remarks || ''}</div>
                            <div class="text-xs text-gray-500 mt-1">
                                Date: ${revision.revisionDate ? new Date(revision.revisionDate).toLocaleDateString() : 'N/A'}
                                ${revision.revisedByName ? ` | By: ${revision.revisedByName}` : ''}
                            </div>
                        </div>
                    </div>
                `;
                revisedRemarksSection.appendChild(revisionContainer);
            });
        });
    } else {
        revisedRemarksSection.style.display = 'none';
    }
}

function goToMenuPR() {
    window.location.href = '../pages/menuPR.html';
}