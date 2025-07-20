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
        // Don't set minimum date for submission date since it's readonly and filled from API
        // submissionDateInput.min = formattedDate;
        
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
        
        // Don't add event listener to submission date since it's readonly
        // submissionDateInput.addEventListener('change', updateRequiredDateMin);
        
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
        
        // Don't set default issuance date - it should be filled with preparedDateFormatted from API
        // The submission date is always readonly and populated from the API data
        
        // Set default required date to 2 weeks from today if empty
        if (!requiredDateInput.value) {
            const twoWeeksFromToday = new Date(today);
            twoWeeksFromToday.setDate(today.getDate() + 14);
            const requiredDateFormatted = formatDateForInput(twoWeeksFromToday);
            
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

async function populateUserSelects(users, approvalData = null) {
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

    // For approval fields, we'll populate them based on transaction type selection
    // Don't populate them with all users initially
    
    // Auto-fill preparedBy with logged-in user if not already set
    autoFillPreparedBy(users);
    
    // For PR documents, always use "NRM" as transaction type
    // Populate superior employees immediately and return a promise
    console.log('Starting to populate superior employees for PR with NRM transaction type...');
    await populateAllSuperiorEmployeeDropdowns("NRM");
    
    // Add event listeners for search inputs to show dropdowns
    const searchInputs = [
        'preparedBySearch', 
        'acknowledgeBySearch', 
        'checkedBySearch', 
        'approvedBySearch', 
        'receivedBySearch'
    ];
    
    searchInputs.forEach(inputId => {
        const searchInput = document.getElementById(inputId);
        if (searchInput) {
            // Show dropdown on focus
            searchInput.addEventListener('focus', function() {
                console.log(`Search input focused: ${inputId}`);
                filterUsers(inputId.replace('Search', ''));
            });
            
            // Handle input changes
            searchInput.addEventListener('input', function() {
                console.log(`Search input changed: ${inputId}`);
                filterUsers(inputId.replace('Search', ''));
            });
        }
    });
    
    return true; // Return a resolved promise
}

// Helper function to auto-fill preparedBy with logged-in user
function autoFillPreparedBy(users) {
    const currentUserId = getUserId();
    if (!currentUserId) return;
    
    // Find the current user in the users array
    const currentUser = users.find(user => user.id == currentUserId);
    if (!currentUser) return;
    
    // Construct full name
    let displayName = currentUser.fullName;
    
    // Set the preparedBy search input value and disable it
    const preparedBySearch = document.getElementById("preparedBySearch");
    if (preparedBySearch) {
        preparedBySearch.value = displayName;
        preparedBySearch.disabled = true;
        preparedBySearch.classList.add('bg-gray-200', 'cursor-not-allowed');
    }
    
    // Also set the select element value to ensure it's available for form submission
    const preparedBySelect = document.getElementById("preparedBy");
    if (preparedBySelect) {
        // Clear existing options
        preparedBySelect.innerHTML = '<option value="" disabled selected>Choose Name</option>';
        
        // Add current user as an option
        const option = document.createElement('option');
        option.value = currentUserId;
        option.textContent = displayName;
        option.selected = true;
        preparedBySelect.appendChild(option);
        
        console.log('Auto-filled preparedBy select with current user:', currentUserId);
    }
}

// Function to filter and display user dropdown
function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    if (!searchInput) {
        console.error(`Search input not found for fieldId: ${fieldId}`);
        return;
    }
    
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}SelectDropdown`);
    if (!dropdown) {
        console.error(`Dropdown not found for fieldId: ${fieldId}`);
        return;
    }
    
    console.log(`filterUsers called for fieldId: ${fieldId}, searchText: "${searchText}"`);
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    let filteredUsers = [];
    
    // Handle all searchable selects
    if (fieldId === 'preparedBy' || 
        fieldId === 'acknowledgeBy' || 
        fieldId === 'checkedBy' || 
        fieldId === 'approvedBy' ||
        fieldId === 'receivedBy') {
        try {
            const users = JSON.parse(searchInput.dataset.users || '[]');
            console.log(`Users from dataset for ${fieldId}:`, users);
            
            filteredUsers = users.filter(user => user && user.name && user.name.toLowerCase().includes(searchText));
            console.log(`Filtered users for ${fieldId}:`, filteredUsers);
            
            // Show search results
    filteredUsers.forEach(user => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
                option.innerText = user.name;
        option.onclick = function() {
                    searchInput.value = user.name;
                    const selectElement = document.getElementById(fieldId);
                    if (selectElement) {
                        // Store the ID as the value
                        let optionExists = false;
                        for (let i = 0; i < selectElement.options.length; i++) {
                            if (selectElement.options[i].value === user.id.toString()) {
                                selectElement.selectedIndex = i;
                                optionExists = true;
                                break;
                            }
                        }
                        
                        if (!optionExists && selectElement.options.length > 0) {
                            const newOption = document.createElement('option');
                            newOption.value = user.id;
                            newOption.textContent = user.name;
                            selectElement.appendChild(newOption);
                            selectElement.value = user.id;
                        }
                    }
                    
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(option);
    });
        } catch (error) {
            console.error("Error parsing users data:", error);
        }
    }
    
    // Show message if no results
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'Name Not Found';
        dropdown.appendChild(noResults);
    }
    
    // Show dropdown
    dropdown.classList.remove('hidden');
    console.log(`Dropdown shown for ${fieldId} with ${filteredUsers.length} results`);
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
            await populatePRDetails(responseData.data);
            
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
        'prType',
        'submissionDate' // Always readonly, filled with preparedDateFormatted
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
                field.classList.remove('bg-gray-100');
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
    
    // Handle ALL table inputs and textareas - make them non-editable when not Draft
    const tableInputs = document.querySelectorAll('#tableBody input, #tableBody textarea');
    tableInputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.disabled = !isEditable;
        } else {
            input.readOnly = !isEditable;
        }
        
        if (!isEditable) {
            input.classList.add('bg-gray-100');
            input.classList.remove('bg-white');
        } else {
            // For editable state, only remove gray background from non-description/non-uom fields
            if (!input.classList.contains('item-description') && !input.classList.contains('item-uom')) {
                input.classList.remove('bg-gray-100');
                input.classList.add('bg-white');
            }
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
                    searchInput.classList.remove('bg-white');
                } else {
                    searchInput.classList.remove('bg-gray-100');
                    searchInput.classList.add('bg-white');
                }
            }
        }
    });
}

async function populatePRDetails(data) {
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
    // Use preparedDateFormatted for submission date if available, otherwise fall back to submissionDate
    const submissionDate = data.preparedDateFormatted ? data.preparedDateFormatted.split('/').reverse().join('-') : (data.submissionDate ? data.submissionDate.split('T')[0] : '');
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
        await populateUserSelects(window.allUsers, data);
    }
    
    // Populate approval fields with existing values from API AFTER superior employee dropdowns are populated
    console.log('About to populate approval fields with data:', {
        preparedByName: data.preparedByName,
        checkedByName: data.checkedByName,
        acknowledgedByName: data.acknowledgedByName,
        approvedByName: data.approvedByName,
        receivedByName: data.receivedByName
    });
    populateApprovalFields(data);
    
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



// Function to populate approval fields with existing values from API
function populateApprovalFields(data) {
    console.log('Populating approval fields with data:', data);
    
    // Map of field names to API response field names
    const approvalFieldMapping = {
        'preparedBy': {
            searchInput: 'preparedBySearch',
            selectElement: 'preparedBy',
            apiField: 'preparedByName',
            apiIdField: 'preparedById'
        },
        'checkedBy': {
            searchInput: 'checkedBySearch',
            selectElement: 'checkedBy',
            apiField: 'checkedByName',
            apiIdField: 'checkedById'
        },
        'acknowledgeBy': {
            searchInput: 'acknowledgeBySearch',
            selectElement: 'acknowledgeBy',
            apiField: 'acknowledgedByName',
            apiIdField: 'acknowledgedById'
        },
        'approvedBy': {
            searchInput: 'approvedBySearch',
            selectElement: 'approvedBy',
            apiField: 'approvedByName',
            apiIdField: 'approvedById'
        },
        'receivedBy': {
            searchInput: 'receivedBySearch',
            selectElement: 'receivedBy',
            apiField: 'receivedByName',
            apiIdField: 'receivedById'
        }
    };
    
    // Populate each approval field
    Object.entries(approvalFieldMapping).forEach(([fieldKey, fieldConfig]) => {
        const searchInput = document.getElementById(fieldConfig.searchInput);
        const selectElement = document.getElementById(fieldConfig.selectElement);
        
        console.log(`Processing field: ${fieldKey}`);
        console.log(`API data - ${fieldConfig.apiField}:`, data[fieldConfig.apiField]);
        console.log(`API data - ${fieldConfig.apiIdField}:`, data[fieldConfig.apiIdField]);
        console.log(`Search input found:`, !!searchInput);
        console.log(`Select element found:`, !!selectElement);
        
        if (searchInput && data[fieldConfig.apiField]) {
            console.log(`Setting ${fieldConfig.searchInput} to: ${data[fieldConfig.apiField]}`);
            searchInput.value = data[fieldConfig.apiField];
            
            // Handle the select element value
            if (selectElement && data[fieldConfig.apiIdField]) {
                console.log(`Setting ${fieldConfig.selectElement} to: ${data[fieldConfig.apiIdField]}`);
                console.log(`Current select options:`, Array.from(selectElement.options).map(opt => ({ value: opt.value, text: opt.textContent })));
                
                // Check if the user ID already exists in the select options
                let userExists = false;
                for (let i = 0; i < selectElement.options.length; i++) {
                    if (selectElement.options[i].value === data[fieldConfig.apiIdField]) {
                        selectElement.selectedIndex = i;
                        userExists = true;
                        console.log(`Found existing option for ${fieldConfig.selectElement} with value: ${data[fieldConfig.apiIdField]}`);
                        break;
                    }
                }
                
                // If the user doesn't exist in the select options, add them
                if (!userExists) {
                    console.log(`Adding new option for ${fieldConfig.selectElement} with value: ${data[fieldConfig.apiIdField]}`);
                    const option = document.createElement('option');
                    option.value = data[fieldConfig.apiIdField];
                    option.textContent = data[fieldConfig.apiField];
                    option.selected = true;
                    selectElement.appendChild(option);
                }
                
                // Also update the search input dataset to include this user
                if (searchInput.dataset.users) {
                    try {
                        const users = JSON.parse(searchInput.dataset.users);
                        const userExists = users.find(u => u.id === data[fieldConfig.apiIdField]);
                        if (!userExists) {
                            users.push({
                                id: data[fieldConfig.apiIdField],
                                name: data[fieldConfig.apiField]
                            });
                            searchInput.dataset.users = JSON.stringify(users);
                            console.log(`Added user to search dataset for ${fieldConfig.searchInput}`);
                        }
                    } catch (error) {
                        console.error(`Error updating search dataset for ${fieldConfig.searchInput}:`, error);
                    }
                }
                
                console.log(`Final select value for ${fieldConfig.selectElement}:`, selectElement.value);
            }
        } else if (searchInput && data[fieldConfig.apiIdField]) {
            // If we have the ID but not the name, try to find the name from the select options
            console.log(`No name found for ${fieldKey}, but ID exists: ${data[fieldConfig.apiIdField]}`);
            if (selectElement) {
                for (let i = 0; i < selectElement.options.length; i++) {
                    if (selectElement.options[i].value === data[fieldConfig.apiIdField]) {
                        const userName = selectElement.options[i].textContent;
                        searchInput.value = userName;
                        selectElement.selectedIndex = i;
                        console.log(`Found user name from select options: ${userName}`);
                        break;
                    }
                }
            }
        } else {
            console.log(`Field ${fieldConfig.searchInput} not found or no data for ${fieldConfig.apiField}`);
        }
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
        addItemRow(item);
    });
}

function addItemRow(item = null) {
    const tableBody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    
    // Check current editable state
    const isEditable = window.currentValues?.status === 'Draft';
    
    row.innerHTML = `
        <td class="p-2 border relative">
            <input type="text" class="item-input w-full p-2 border rounded ${!isEditable ? 'bg-gray-100' : 'bg-white'}" placeholder="Search item..." value="${item?.itemNo || ''}" ${!isEditable ? 'readonly' : ''} />
            <div class="item-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-40 overflow-y-auto"></div>
        </td>
        <td class="p-2 border">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="200" disabled title="${item?.description || ''}" style="height: 40px;">${item?.description || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-detail text-center overflow-x-auto whitespace-nowrap ${!isEditable ? 'bg-gray-100' : 'bg-white'}" maxlength="100" required style="resize: none; height: 40px;" ${!isEditable ? 'readonly' : ''}>${item?.detail || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-purpose text-center overflow-x-auto whitespace-nowrap ${!isEditable ? 'bg-gray-100' : 'bg-white'}" maxlength="100" required style="resize: none; height: 40px;" ${!isEditable ? 'readonly' : ''}>${item?.purpose || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-quantity overflow-x-auto whitespace-nowrap ${!isEditable ? 'bg-gray-100' : 'bg-white'}" maxlength="10" required style="resize: none; height: 40px; text-align: center;" oninput="validateQuantity(this)" ${!isEditable ? 'readonly' : ''}>${item?.quantity || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <input type="text" value="${item?.uom || ''}" class="w-full item-uom bg-gray-100" disabled />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700" ${!isEditable ? 'style="display: none;"' : ''}>🗑</button>
        </td>
    `;
    
    tableBody.appendChild(row);
    
    // Setup searchable item dropdown for the new row
    setupItemDropdown(row, item?.itemNo);
}

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");
    
    // Check current editable state
    const isEditable = window.currentValues?.status === 'Draft';
    
    newRow.innerHTML = `
        <td class="p-2 border relative">
            <input type="text" class="item-input w-full p-2 border rounded ${!isEditable ? 'bg-gray-100' : 'bg-white'}" placeholder="Search item..." ${!isEditable ? 'readonly' : ''} />
            <div class="item-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-40 overflow-y-auto"></div>
        </td>
        <td class="p-2 border bg-gray-100">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="200" disabled style="height: 40px;"></textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-detail text-center overflow-x-auto whitespace-nowrap ${!isEditable ? 'bg-gray-100' : 'bg-white'}" maxlength="100" required style="resize: none; height: 40px;" ${!isEditable ? 'readonly' : ''}></textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-purpose text-center overflow-x-auto whitespace-nowrap ${!isEditable ? 'bg-gray-100' : 'bg-white'}" maxlength="100" required style="resize: none; height: 40px;" ${!isEditable ? 'readonly' : ''}></textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-quantity overflow-x-auto whitespace-nowrap ${!isEditable ? 'bg-gray-100' : 'bg-white'}" maxlength="10" required style="resize: none; height: 40px; text-align: center;" oninput="validateQuantity(this)" ${!isEditable ? 'readonly' : ''}></textarea>
        </td>
        <td class="p-2 border bg-gray-100">
            <input type="text" class="w-full item-uom bg-gray-100" disabled />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700" ${!isEditable ? 'style="display: none;"' : ''}>🗑</button>
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

// Function to validate quantity input (only numbers allowed)
function validateQuantity(textarea) {
    // Remove any non-numeric characters except decimal point
    let value = textarea.value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Update the textarea value
    textarea.value = value;
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
        formData.append('TypeOfTransaction', 'NRM'); // PR documents always use "NRM"
        
        formData.append('Remarks', document.getElementById('remarks').value);
        
        // Approvals with special handling for preparedBy
        const preparedByValue = document.getElementById('preparedBy')?.value;
        const currentUserId = getUserId();
 
        // Use current user ID if preparedBy is empty
        const finalPreparedById = preparedByValue || currentUserId;
        
        // Debug logging for approval field values
        console.log('Approval field values being submitted:');
        console.log('PreparedById:', finalPreparedById);
        console.log('CheckedById:', document.getElementById('checkedBy')?.value);
        console.log('AcknowledgedById:', document.getElementById('acknowledgeBy')?.value);
        console.log('ApprovedById:', document.getElementById('approvedBy')?.value);
        console.log('ReceivedById:', document.getElementById('receivedBy')?.value);
        
        formData.append('PreparedById', finalPreparedById);
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
                    // Check if this is an update or submit operation for a Draft document
                    if (status === 'Draft') {
                        // Redirect to menu page for Draft updates and submissions
                        goToMenuPR();
                    } else {
                        // Reload the PR data to show updated information for other cases
                        fetchPRDetails(prId, prType);
                    }
                    
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

// Function to view a newly uploaded file
function viewUploadedFile(index) {
    if (index >= 0 && index < uploadedFiles.length) {
        const file = uploadedFiles[index];
        
        // Create a blob URL for the file
        const blobUrl = URL.createObjectURL(file);
        
        // Open the file in a new tab/window
        const newWindow = window.open(blobUrl, '_blank');
        
        // Clean up the blob URL after a delay to ensure the window has loaded
        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
        }, 1000);
        
        // If the window couldn't be opened (e.g., popup blocked), show a fallback
        if (!newWindow) {
            Swal.fire({
                title: 'File Viewer',
                html: `
                    <div class="text-left">
                        <p><strong>File Name:</strong> ${file.name}</p>
                        <p><strong>File Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                        <p><strong>File Type:</strong> ${file.type}</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'OK',
                showCancelButton: true,
                cancelButtonText: 'Download',
                showDenyButton: true,
                denyButtonText: 'Try Again'
            }).then((result) => {
                if (result.isDenied) {
                    // Try opening again
                    window.open(blobUrl, '_blank');
                } else if (result.isDismissed) {
                    // Download the file
                    const downloadLink = document.createElement('a');
                    downloadLink.href = blobUrl;
                    downloadLink.download = file.name;
                    downloadLink.click();
                }
                // Clean up the blob URL
                setTimeout(() => {
                    URL.revokeObjectURL(blobUrl);
                }, 1000);
            });
        }
    } else {
        Swal.fire({
            title: 'Error',
            text: 'File not found',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
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
        attachmentItem.className = 'attachment-item flex items-center justify-between p-3 bg-white border rounded mb-2 hover:bg-gray-50';
        attachmentItem.innerHTML = `
            <div class="flex items-center">
                <span class="file-type-indicator file-type-pdf mr-3">PDF</span>
                <div>
                    <span class="text-sm font-medium text-gray-900">${attachment.fileName}</span>
                    <span class="text-xs text-gray-500 ml-2">(existing)</span>
                </div>
            </div>
            <div class="attachment-buttons flex items-center gap-2">
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
        attachmentItem.className = 'attachment-item flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded mb-2';
        attachmentItem.innerHTML = `
            <div class="flex items-center">
                <span class="file-type-indicator file-type-new mr-3">NEW</span>
                <div>
                    <span class="text-sm font-medium text-gray-900">${file.name}</span>
                    <span class="text-xs text-green-600 ml-2">(new)</span>
                </div>
            </div>
            <div class="attachment-buttons flex items-center gap-2">
                <button onclick="viewUploadedFile(${index})" class="text-blue-500 hover:text-blue-700 text-sm font-semibold px-3 py-1 border border-blue-500 rounded hover:bg-blue-50 transition">
                    View
                </button>
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
            actionButtons.className = 'flex items-center gap-2';
            
            // View button
            const viewButton = document.createElement('button');
            viewButton.type = 'button';
            viewButton.className = 'text-blue-500 hover:text-blue-700 text-sm font-semibold px-3 py-1 border border-blue-500 rounded hover:bg-blue-50 transition';
            viewButton.textContent = 'View';
            viewButton.title = 'View attachment';
            viewButton.onclick = function() {
                window.open(attachment.filePath, '_blank');
            };
            actionButtons.appendChild(viewButton);
            

            
            // Delete button (only shown for Draft status)
            if (window.currentValues?.status === 'Draft') {
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1 border border-red-500 rounded hover:bg-red-50 transition';
                deleteButton.textContent = 'Remove';
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
    
    // Check if there are any revisions
    const hasRevisions = data.revisions && data.revisions.length > 0;
    
    if (hasRevisions) {
        revisedRemarksSection.style.display = 'block';
        
        // Clear existing revision content from the revisedRemarksSection
        revisedRemarksSection.innerHTML = `
            <h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>
            <div class="bg-gray-50 p-4 rounded-lg border">
                <div class="mb-2">
                    <span class="text-sm font-medium text-gray-600">Total Revisions: </span>
                    <span id="revisedCount" class="text-sm font-bold text-blue-600">${data.revisions.length}</span>
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

// New function to fetch superior employees based on document type, transaction type, and superior level
async function fetchSuperiorEmployees(documentType, transactionType, superiorLevel) {
    try {
        const currentUserId = getUserId();
        if (!currentUserId) {
            console.error('No current user ID found');
            return [];
        }

        const apiUrl = `${BASE_URL}/api/employee-superior-document-approvals/user/${currentUserId}/document-type/${documentType}`;
        console.log(`Fetching superior employees from: ${apiUrl}`);
        console.log(`Parameters: documentType=${documentType}, transactionType=${transactionType}, superiorLevel=${superiorLevel}`);

        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch superior employees');
        }
        
        const allSuperiors = result.data;
        console.log('All superiors from API:', allSuperiors);
        
        // Filter by transaction type and superior level
        const filteredSuperiors = allSuperiors.filter(superior => {
            // Map transaction type to API transaction type
            const transactionTypeMap = {
                'NRM': 'NRM', // PR documents always use NRM
                'Entertainment': 'EN',
                'Golf Competition': 'GC',
                'Medical': 'ME',
                'Others': 'OT',
                'Travelling': 'TR'
            };
            
            const apiTransactionType = transactionTypeMap[transactionType];
            if (!apiTransactionType) {
                console.warn(`Unknown transaction type: ${transactionType}`);
                return false;
            }
            
            return superior.typeTransaction === apiTransactionType && superior.superiorLevel === superiorLevel;
        });
        
        console.log(`Found ${filteredSuperiors.length} superior employees for ${documentType}/${transactionType}/${superiorLevel}`);
        console.log('Filtered superiors:', filteredSuperiors);
        
        // Fetch full user details for each superior to get full names
        const superiorsWithFullNames = [];
        
        for (const superior of filteredSuperiors) {
            try {
                // Try to get full name from cached users first
                let fullName = superior.superiorName; // Default to the name from API
                
                if (window.requesters && window.requesters.length > 0) {
                    const user = window.requesters.find(u => u.id === superior.superiorUserId);
                    if (user && user.fullName) {
                        fullName = user.fullName;
                        console.log(`Found full name in cache for ${superior.superiorUserId}: ${fullName}`);
                    }
                } else {
                    // Fetch user details from API if not in cache
                    try {
                        const userResponse = await fetch(`${BASE_URL}/api/users/${superior.superiorUserId}`);
                        if (userResponse.ok) {
                            const userResult = await userResponse.json();
                            if (userResult.status && userResult.data && userResult.data.fullName) {
                                fullName = userResult.data.fullName;
                                console.log(`Fetched full name from API for ${superior.superiorUserId}: ${fullName}`);
                            }
                        }
                    } catch (error) {
                        console.warn(`Failed to fetch full name for user ${superior.superiorUserId}:`, error);
                        // Keep the original superiorName if API call fails
                    }
                }
                
                superiorsWithFullNames.push({
                    ...superior,
                    superiorFullName: fullName
                });
                
            } catch (error) {
                console.warn(`Error processing superior ${superior.superiorUserId}:`, error);
                // Add the superior with original name if there's an error
                superiorsWithFullNames.push({
                    ...superior,
                    superiorFullName: superior.superiorName
                });
            }
        }
        
        return superiorsWithFullNames;
        
    } catch (error) {
        console.error("Error fetching superior employees:", error);
        return [];
    }
}

// Function to map superior level to field ID
function getSuperiorLevelForField(fieldId) {
    const levelMap = {
        'preparedBy': 'PR',
        'checkedBy': 'CH',
        'acknowledgeBy': 'AC',
        'approvedBy': 'AP',
        'receivedBy': 'RE'
    };
    return levelMap[fieldId] || null;
}

// Function to populate superior employee dropdown with provided data
async function populateSuperiorEmployeeDropdownWithData(fieldId, superiors) {
    console.log(`populateSuperiorEmployeeDropdownWithData called for fieldId: ${fieldId} with ${superiors.length} superiors`);
    
    // Clear existing options
    const selectElement = document.getElementById(fieldId);
    if (!selectElement) {
        console.error(`Select element not found for fieldId: ${fieldId}`);
        return;
    }
    
    selectElement.innerHTML = '<option value="" disabled selected>Select User</option>';
    
    // Add superior employees to dropdown
    console.log(`Adding ${superiors.length} superiors to dropdown for fieldId: ${fieldId}`);
    superiors.forEach(superior => {
        const option = document.createElement('option');
        option.value = superior.superiorUserId;
        option.textContent = superior.superiorFullName; // Use superiorFullName
        selectElement.appendChild(option);
        console.log(`Added superior: ${superior.superiorFullName} (${superior.superiorUserId}) to ${fieldId}`);
    });
    
    // Update the search input dataset
    const searchInput = document.getElementById(fieldId + 'Search');
    if (searchInput) {
        searchInput.dataset.users = JSON.stringify(superiors.map(s => ({
            id: s.superiorUserId,
            name: s.superiorFullName
        })));
    }
    
    // Special handling for preparedBy - auto-select current user if they are in the superiors list
    if (fieldId === 'preparedBy') {
        const currentUserId = getUserId();
        if (currentUserId) {
            const currentUserInSuperiors = superiors.find(s => s.superiorUserId === currentUserId);
            if (currentUserInSuperiors) {
                selectElement.value = currentUserId;
                console.log('Auto-selected current user for preparedBy from superiors list');
            } else {
                // If current user is not in superiors list, add them as an option
                const currentUser = window.requesters ? window.requesters.find(u => u.id === currentUserId) : null;
                if (currentUser) {
                    const option = document.createElement('option');
                    option.value = currentUserId;
                    option.textContent = currentUser.fullName || currentUser.name;
                    option.selected = true;
                    selectElement.appendChild(option);
                    console.log('Added current user to preparedBy select (not in superiors list)');
                }
            }
        }
    }
    
    // Set pending approval values if they exist
    if (window.pendingApprovalValues) {
        const pendingUserId = window.pendingApprovalValues[fieldId];
        if (pendingUserId) {
            // Check if the user exists in the superiors list
            const matchingSuperior = superiors.find(s => s.superiorUserId === pendingUserId);
            if (matchingSuperior) {
                selectElement.value = pendingUserId;
                const searchInput = document.getElementById(fieldId + 'Search');
                if (searchInput) {
                    searchInput.value = matchingSuperior.superiorFullName; // Use superiorFullName
                }
                console.log(`Set pending approval value for ${fieldId}:`, pendingUserId);
            }
        }
    }
}

// Function to populate superior employee dropdown (legacy - kept for backward compatibility)
async function populateSuperiorEmployeeDropdown(fieldId, documentType, transactionType) {
    const superiorLevel = getSuperiorLevelForField(fieldId);
    if (!superiorLevel) {
        console.error(`No superior level mapping found for field: ${fieldId}`);
        return;
    }
    
    const superiors = await fetchSuperiorEmployees(documentType, transactionType, superiorLevel);
    
    // Clear existing options
    const selectElement = document.getElementById(fieldId);
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="" disabled selected>Select User</option>';
    
    // Add superior employees to dropdown
    superiors.forEach(superior => {
        const option = document.createElement('option');
        option.value = superior.superiorUserId;
        option.textContent = superior.superiorFullName; // Use superiorFullName
        selectElement.appendChild(option);
    });
    
    // Update the search input dataset
    const searchInput = document.getElementById(fieldId + 'Search');
    if (searchInput) {
        searchInput.dataset.users = JSON.stringify(superiors.map(s => ({
            id: s.superiorUserId,
            name: s.superiorFullName
        })));
    }
    
    // Special handling for preparedBy - auto-select current user if they are in the superiors list
    if (fieldId === 'preparedBy') {
        const currentUserId = getUserId();
        if (currentUserId) {
            const currentUserInSuperiors = superiors.find(s => s.superiorUserId === currentUserId);
            if (currentUserInSuperiors) {
                selectElement.value = currentUserId;
                console.log('Auto-selected current user for preparedBy from superiors list');
            } else {
                // If current user is not in superiors list, add them as an option
                const currentUser = window.requesters ? window.requesters.find(u => u.id === currentUserId) : null;
                if (currentUser) {
                    const option = document.createElement('option');
                    option.value = currentUserId;
                    option.textContent = currentUser.fullName || currentUser.name;
                    option.selected = true;
                    selectElement.appendChild(option);
                    console.log('Added current user to preparedBy select (not in superiors list)');
                }
            }
        }
    }
    
    // Set pending approval values if they exist
    if (window.pendingApprovalValues) {
        const pendingUserId = window.pendingApprovalValues[fieldId];
        if (pendingUserId) {
            // Check if the user exists in the superiors list
            const matchingSuperior = superiors.find(s => s.superiorUserId === pendingUserId);
            if (matchingSuperior) {
                selectElement.value = pendingUserId;
                const searchInput = document.getElementById(fieldId + 'Search');
                if (searchInput) {
                    searchInput.value = matchingSuperior.superiorFullName; // Use superiorFullName
                }
                console.log(`Set pending approval value for ${fieldId}:`, pendingUserId);
            }
        }
    }
}

// Function to populate all superior employee dropdowns
async function populateAllSuperiorEmployeeDropdowns(transactionType) {
    const documentType = 'PR'; // Purchase Request
    
    console.log(`populateAllSuperiorEmployeeDropdowns called with transactionType: ${transactionType}, documentType: ${documentType}`);
    
    // Fetch all superiors once
    const currentUserId = getUserId();
    if (!currentUserId) {
        console.error('No current user ID found');
        return;
    }

    const apiUrl = `${BASE_URL}/api/employee-superior-document-approvals/user/${currentUserId}/document-type/${documentType}`;
    console.log(`Fetching all superior employees from: ${apiUrl}`);

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch superior employees');
        }
        
        const allSuperiors = result.data;
        console.log('All superiors from API:', allSuperiors);
        
        // Filter by transaction type (NRM for PR documents)
        const filteredSuperiors = allSuperiors.filter(superior => superior.typeTransaction === 'NRM');
        console.log(`Found ${filteredSuperiors.length} superiors with NRM transaction type`);
        
        // Fetch full names for all superiors
        const superiorsWithFullNames = [];
        for (const superior of filteredSuperiors) {
            try {
                let fullName = superior.superiorName; // Default to the name from API
                
                if (window.requesters && window.requesters.length > 0) {
                    const user = window.requesters.find(u => u.id === superior.superiorUserId);
                    if (user && user.fullName) {
                        fullName = user.fullName;
                        console.log(`Found full name in cache for ${superior.superiorUserId}: ${fullName}`);
                    }
                }
                
                superiorsWithFullNames.push({
                    ...superior,
                    superiorFullName: fullName
                });
                
            } catch (error) {
                console.warn(`Error processing superior ${superior.superiorUserId}:`, error);
                superiorsWithFullNames.push({
                    ...superior,
                    superiorFullName: superior.superiorName
                });
            }
        }
        
        // Now populate each field with the appropriate superiors
        const approvalFields = [
            { id: 'preparedBy', level: 'PR' },
            { id: 'checkedBy', level: 'CH' },
            { id: 'acknowledgeBy', level: 'AC' },
            { id: 'approvedBy', level: 'AP' },
            { id: 'receivedBy', level: 'RE' }
        ];
        
        console.log(`Will populate ${approvalFields.length} approval fields:`, approvalFields.map(f => f.id));
        
        for (const fieldInfo of approvalFields) {
            console.log(`Populating field: ${fieldInfo.id} with level: ${fieldInfo.level}`);
            
            // Filter superiors for this specific level
            const levelSuperiors = superiorsWithFullNames.filter(superior => superior.superiorLevel === fieldInfo.level);
            console.log(`Found ${levelSuperiors.length} superiors for level ${fieldInfo.level}`);
            
            // Populate the dropdown
            await populateSuperiorEmployeeDropdownWithData(fieldInfo.id, levelSuperiors);
        }
        
        console.log('Finished populating all superior employee dropdowns');
        
    } catch (error) {
        console.error("Error fetching superior employees:", error);
    }
}