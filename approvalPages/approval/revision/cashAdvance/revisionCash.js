// Global variables
let uploadedFiles = [];
let existingAttachments = [];
let attachmentsToKeep = [];
let cashAdvanceData = null;
let caId;
let currentTab;

// Function to get available categories based on department and transaction type from API
async function getAvailableCategories(departmentId, transactionType) {
    if (!departmentId || !transactionType) return [];
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/categories?departmentId=${departmentId}&menu=Cash Advance&transactionType=${transactionType}`);
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        return data.data || data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

// Function to get available account names based on category, department, and transaction type from API
async function getAvailableAccountNames(category, departmentId, transactionType) {
    if (!category || !departmentId || !transactionType) return [];
    
    console.log(`🔍 getAvailableAccountNames called with:`, { category, departmentId, transactionType });
    
    try {
        const url = `${BASE_URL}/api/expenses/account-names?category=${encodeURIComponent(category)}&departmentId=${departmentId}&menu=Cash Advance&transactionType=${transactionType}`;
        console.log(`🔍 API URL:`, url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch account names');
        }
        const data = await response.json();
        console.log(`🔍 API response:`, data);
        return data.data || data;
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
        return data.data?.coa || data.coa || '';
    } catch (error) {
        console.error('Error fetching COA:', error);
        return '';
    }
}

// Function to setup category dropdown for a row
async function setupCategoryDropdown(row) {
    const categoryInput = row.querySelector('.category-input');
    const categoryDropdown = row.querySelector('.category-dropdown');
    const accountNameSelect = row.querySelector('.account-name');
    const coaInput = row.querySelector('.coa');
    
    if (!categoryInput || !categoryDropdown) return;
    
    updateFieldsBasedOnPrerequisites(row);
    
    const departmentSelect = document.getElementById("departmentId");
    const transactionTypeSelect = document.getElementById("transactionType");
    const requesterSearchInput = document.getElementById("requesterSearch");
    
    categoryInput.addEventListener('input', async function() {
        const departmentId = departmentSelect.value;
        const transactionType = transactionTypeSelect.value;
        const requesterValue = requesterSearchInput.value;
        
        if (!requesterValue || !departmentId || !transactionType) {
            showValidationMessage(categoryInput, 'Please select requester and transaction type first');
            categoryDropdown.classList.add('hidden');
            return;
        }
        
        const searchText = this.value.toLowerCase();
        const availableCategories = await getAvailableCategories(departmentId, transactionType);
        
        categoryDropdown.innerHTML = '';
        
        const filteredCategories = availableCategories.filter(category => 
            category.toLowerCase().includes(searchText)
        );
        
        const historicalCategories = categoryInput.historicalCategories || [];
        const filteredHistoricalCategories = historicalCategories.filter(category => 
            category.toLowerCase().includes(searchText) && 
            !filteredCategories.includes(category)
        );
        
        const allFilteredCategories = [...filteredCategories, ...filteredHistoricalCategories];
        
        if (allFilteredCategories.length > 0) {
            filteredCategories.forEach(category => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.textContent = category;
                option.onclick = function() {
                    categoryInput.value = category;
                    categoryDropdown.classList.add('hidden');
                    updateAccountNameDropdown(row, category, departmentId, transactionType);
                    if (coaInput) coaInput.value = '';
                    enableAccountNameField(row);
                };
                categoryDropdown.appendChild(option);
            });
            
            filteredHistoricalCategories.forEach(category => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerHTML = `<span style="font-style: italic; color: #6b7280;">${category} (Historical)</span>`;
                option.onclick = function() {
                    categoryInput.value = category;
                    categoryDropdown.classList.add('hidden');
                    updateAccountNameDropdown(row, category, departmentId, transactionType);
                    if (coaInput) coaInput.value = '';
                    enableAccountNameField(row);
                };
                categoryDropdown.appendChild(option);
            });
            
            categoryDropdown.classList.remove('hidden');
        } else {
            categoryDropdown.classList.add('hidden');
        }
    });
    
    categoryInput.addEventListener('focus', async function() {
        const departmentId = departmentSelect.value;
        const transactionType = transactionTypeSelect.value;
        const requesterValue = requesterSearchInput.value;
        
        if (!requesterValue || !departmentId || !transactionType) {
            showValidationMessage(this, 'Please select requester and transaction type first');
            this.blur();
            return;
        }
        
        const availableCategories = await getAvailableCategories(departmentId, transactionType);
        categoryDropdown.innerHTML = '';
        
        const historicalCategories = categoryInput.historicalCategories || [];
        const allCategories = [...availableCategories];
        
        historicalCategories.forEach(histCat => {
            if (!availableCategories.includes(histCat)) {
                allCategories.push(histCat);
            }
        });
        
        if (allCategories.length > 0) {
            availableCategories.forEach(category => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.textContent = category;
                option.onclick = function() {
                    categoryInput.value = category;
                    categoryDropdown.classList.add('hidden');
                    updateAccountNameDropdown(row, category, departmentId, transactionType);
                    if (coaInput) coaInput.value = '';
                    enableAccountNameField(row);
                };
                categoryDropdown.appendChild(option);
            });
            
            historicalCategories.forEach(category => {
                if (!availableCategories.includes(category)) {
                    const option = document.createElement('div');
                    option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                    option.innerHTML = `<span style="font-style: italic; color: #6b7280;">${category} (Historical)</span>`;
                    option.onclick = function() {
                        categoryInput.value = category;
                        categoryDropdown.classList.add('hidden');
                        updateAccountNameDropdown(row, category, departmentId, transactionType);
                        if (coaInput) coaInput.value = '';
                        enableAccountNameField(row);
                    };
                    categoryDropdown.appendChild(option);
                }
            });
            
            categoryDropdown.classList.remove('hidden');
        }
    });
    
    document.addEventListener('click', function(event) {
        if (!categoryInput.contains(event.target) && !categoryDropdown.contains(event.target)) {
            categoryDropdown.classList.add('hidden');
        }
    });
}

function showValidationMessage(element, message) {
    const existingMessage = element.parentElement.querySelector('.validation-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'validation-message text-red-500 text-sm mt-1';
    messageDiv.textContent = message;
    element.parentElement.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 3000);
}

function updateFieldsBasedOnPrerequisites(row) {
    const categoryInput = row.querySelector('.category-input');
    const accountNameSelect = row.querySelector('.account-name');
    
    const departmentSelect = document.getElementById("departmentId");
    const transactionTypeSelect = document.getElementById("transactionType");
    const requesterSearchInput = document.getElementById("requesterSearch");
    
    const departmentId = departmentSelect?.value;
    const transactionType = transactionTypeSelect?.value;
    const requesterValue = requesterSearchInput?.value;
    const categoryValue = categoryInput?.value;
    
    if (!requesterValue || !departmentId || !transactionType) {
        if (categoryInput) {
            categoryInput.disabled = true;
            categoryInput.placeholder = 'Select requester and transaction type first';
            categoryInput.classList.add('bg-gray-100');
        }
        if (accountNameSelect) {
            accountNameSelect.disabled = true;
            accountNameSelect.classList.add('bg-gray-100');
        }
    } else {
        if (categoryInput) {
            categoryInput.disabled = false;
            categoryInput.placeholder = 'Search category...';
            categoryInput.classList.remove('bg-gray-100');
        }
        
        if (!categoryValue) {
            if (accountNameSelect) {
                accountNameSelect.disabled = true;
                accountNameSelect.classList.add('bg-gray-100');
            }
        } else {
            enableAccountNameField(row);
        }
    }
}

function enableAccountNameField(row) {
    const accountNameSelect = row.querySelector('.account-name');
    if (accountNameSelect) {
        accountNameSelect.disabled = false;
        accountNameSelect.classList.remove('bg-gray-100');
    }
}

async function ensureCategoryAvailable(categoryInput, existingCategory, departmentId, transactionType) {
    if (!existingCategory || !categoryInput) return;
    
    const availableCategories = await getAvailableCategories(departmentId, transactionType);
    const categoryExists = availableCategories.some(cat => cat.toLowerCase() === existingCategory.toLowerCase());
    
    if (!categoryExists) {
        if (!categoryInput.historicalCategories) {
            categoryInput.historicalCategories = [];
        }
        if (!categoryInput.historicalCategories.includes(existingCategory)) {
            categoryInput.historicalCategories.push(existingCategory);
            console.log(`Added historical category: ${existingCategory}`);
        }
    }
}

async function updateAccountNameDropdown(row, category, departmentId, transactionType, existingAccountName = null, existingCoa = null) {
    const accountNameSelect = row.querySelector('.account-name');
    const coaInput = row.querySelector('.coa');
    
    if (!accountNameSelect) return;
    
    if (!category) {
        showValidationMessage(accountNameSelect, 'Please select a category first');
        return;
    }
    
    const currentSelectedValue = accountNameSelect.value || existingAccountName;
    accountNameSelect.innerHTML = '<option value="">Select Account Name</option>';
    
    const accountNames = await getAvailableAccountNames(category, departmentId, transactionType);
    let existingAccountNameFound = false;
    
    accountNames.forEach(item => {
        const option = document.createElement('option');
        option.value = item.accountName;
        option.textContent = item.accountName;
        option.dataset.coa = item.coa;
        option.dataset.remarks = item.remarks || '';
        accountNameSelect.appendChild(option);
        
        if (currentSelectedValue && item.accountName === currentSelectedValue) {
            existingAccountNameFound = true;
        }
    });
    
    if (currentSelectedValue && !existingAccountNameFound) {
        const option = document.createElement('option');
        option.value = currentSelectedValue;
        option.textContent = `${currentSelectedValue} (Historical)`;
        option.dataset.coa = existingCoa || '';
        option.dataset.remarks = 'Historical data - no longer in master data';
        option.style.fontStyle = 'italic';
        option.style.color = '#6b7280';
        accountNameSelect.appendChild(option);
        console.log(`Added historical account name: ${currentSelectedValue}`);
    }
    
    if (currentSelectedValue) {
        accountNameSelect.value = currentSelectedValue;
        if (existingCoa && coaInput) {
            coaInput.value = existingCoa;
        }
    }
    
    const newAccountNameSelect = accountNameSelect.cloneNode(true);
    accountNameSelect.parentNode.replaceChild(newAccountNameSelect, accountNameSelect);
    
    newAccountNameSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const selectedAccountName = this.value;
        
        if (selectedAccountName && selectedOption) {
            const coa = selectedOption.dataset.coa || '';
            console.log('Using COA from dataset:', coa, 'for account:', selectedAccountName);
            if (coaInput) coaInput.value = coa;
        } else {
            if (coaInput) coaInput.value = '';
        }
    });
    
    enableAccountNameField(row);
}

async function populateAccountNameDropdownForInitialLoad(row, category, departmentId, transactionType, existingAccountName, existingCoa) {
    const accountNameSelect = row.querySelector('.account-name');
    const coaInput = row.querySelector('.coa');
    
    if (!accountNameSelect) return;
    
    if (!category) {
        showValidationMessage(accountNameSelect, 'Please select a category first');
        return;
    }
    
    const accountNames = await getAvailableAccountNames(category, departmentId, transactionType);
    console.log(`🔍 populateAccountNameDropdownForInitialLoad - API returned ${accountNames.length} account names:`, accountNames);
    console.log(`🔍 Looking for existing account name: "${existingAccountName}" in results`);
    
    let existingAccountNameFound = false;
    
    if (existingAccountName) {
        const existingOption = document.createElement('option');
        existingOption.value = existingAccountName;
        existingOption.textContent = existingAccountName;
        existingOption.dataset.coa = existingCoa || '';
        existingOption.dataset.remarks = '';
        existingOption.selected = true;
        accountNameSelect.appendChild(existingOption);
        console.log(`Preserved existing account name: ${existingAccountName}`);
    }
    
    accountNames.forEach(item => {
        console.log(`🔍 Checking item:`, item);
        if (existingAccountName && item.accountName === existingAccountName) {
            existingAccountNameFound = true;
            console.log(`✅ Found matching account name: "${item.accountName}"`);
            return;
        }
        
        const option = document.createElement('option');
        option.value = item.accountName;
        option.textContent = item.accountName;
        option.dataset.coa = item.coa;
        option.dataset.remarks = item.remarks || '';
        accountNameSelect.appendChild(option);
    });
    
    if (existingAccountName && !existingAccountNameFound) {
        console.log(`⚠️ Account name "${existingAccountName}" not found in API results - marking as historical`);
        const existingOption = accountNameSelect.querySelector(`option[value="${existingAccountName}"]`);
        if (existingOption) {
            existingOption.textContent = `${existingAccountName} (Historical)`;
            existingOption.dataset.remarks = 'Historical data - no longer in master data';
            existingOption.style.fontStyle = 'italic';
            existingOption.style.color = '#6b7280';
        }
        console.log(`Marked account name as historical: ${existingAccountName}`);
    } else if (existingAccountName && existingAccountNameFound) {
        console.log(`✅ Account name "${existingAccountName}" found in API results - keeping as normal`);
    }
    
    // If we have a valid COA for the existing account name, don't mark it as historical
    // This prevents marking valid data as historical when the API might have issues
    if (existingAccountName && existingCoa && existingCoa.trim() !== '') {
        const existingOption = accountNameSelect.querySelector(`option[value="${existingAccountName}"]`);
        if (existingOption) {
            console.log(`✅ Account name "${existingAccountName}" has valid COA "${existingCoa}" - ensuring it's not marked as historical`);
            existingOption.textContent = existingAccountName; // Remove any "(Historical)" text
            existingOption.dataset.remarks = '';
            existingOption.style.fontStyle = 'normal';
            existingOption.style.color = 'inherit';
        }
    }
    
    // Additional safety check: if the API returned no results but we have valid data,
    // ensure we don't mark it as historical
    if (accountNames.length === 0 && existingAccountName && existingCoa && existingCoa.trim() !== '') {
        console.log(`⚠️ API returned no results, but we have valid data for "${existingAccountName}" with COA "${existingCoa}" - treating as valid`);
        const existingOption = accountNameSelect.querySelector(`option[value="${existingAccountName}"]`);
        if (existingOption) {
            existingOption.textContent = existingAccountName;
            existingOption.dataset.remarks = '';
            existingOption.style.fontStyle = 'normal';
            existingOption.style.color = 'inherit';
        }
    }
    
    if (existingCoa && coaInput) {
        coaInput.value = existingCoa;
    }
    
    const newAccountNameSelect = accountNameSelect.cloneNode(true);
    accountNameSelect.parentNode.replaceChild(newAccountNameSelect, accountNameSelect);
    
    newAccountNameSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const selectedAccountName = this.value;
        
        if (selectedAccountName && selectedOption) {
            const coa = selectedOption.dataset.coa || '';
            console.log('Using COA from dataset:', coa, 'for account:', selectedAccountName);
            if (coaInput) coaInput.value = coa;
        } else {
            if (coaInput) coaInput.value = '';
        }
    });
    
    enableAccountNameField(row);
}

async function refreshAllCategoryDropdowns() {
    const tableRows = document.querySelectorAll('#tableBody tr');
    for (const row of tableRows) {
        const categoryInput = row.querySelector('.category-input');
        const accountNameSelect = row.querySelector('.account-name');
        const coaInput = row.querySelector('.coa');
        
        if (categoryInput && !categoryInput.value) categoryInput.value = '';
        if (accountNameSelect && !accountNameSelect.value) accountNameSelect.innerHTML = '<option value="">Select Account Name</option>';
        if (coaInput && !coaInput.value) coaInput.value = '';
        
        updateFieldsBasedOnPrerequisites(row);
        await setupCategoryDropdown(row);
    }
}

function getUserId() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.id : null;
}

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

function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("departmentId");
    if (!departmentSelect) return;
    
    departmentSelect.innerHTML = '<option value="" disabled>Select Department</option>';

    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.id;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
    });
    
    if (window.currentValues && window.currentValues.departmentId) {
        departmentSelect.value = window.currentValues.departmentId;
    } else if (window.currentValues && window.currentValues.departmentName) {
        const matchingDept = departments.find(dept => dept.name === window.currentValues.departmentName);
        if (matchingDept) {
            departmentSelect.value = matchingDept.id;
        }
    }
    
    departmentSelect.addEventListener('change', function() {
        refreshAllCategoryDropdowns();
    });
}

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

function populateUserSelects(users, caData = null) {
    // Store users globally for search functionality like detailCash.js
    window.requesters = users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        department: user.department
    }));
    
    // Store all users globally
    window.allUsers = users;
    
    // Store employees globally for reference
    window.employees = users.map(user => ({
        id: user.id,
        kansaiEmployeeId: user.kansaiEmployeeId,
        fullName: user.fullName,
        department: user.department
    }));

    // Set status select from stored data
    if (window.currentValues && window.currentValues.status) {
        const statusSelect = document.getElementById('status');
        if (statusSelect) {
            statusSelect.value = window.currentValues.status;
        }
    }

    // Populate RequesterId dropdown
    const requesterSelect = document.getElementById("RequesterId");
    if (requesterSelect) {
        requesterSelect.innerHTML = '<option value="">Select a requester</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.fullName;
            requesterSelect.appendChild(option);
        });
        
        // Set the requester value from cash advance data if available
        if (caData && caData.requesterId) {
            requesterSelect.value = caData.requesterId;
        }
    }

    // Setup search functionality for requester like detailCash.js
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
            if (!window.requesters || !Array.isArray(window.requesters)) {
                console.warn('window.requesters is not available or not an array');
                return;
            }
            
            const filteredRequesters = window.requesters.filter(r => 
                r && r.fullName && r.fullName.toLowerCase().includes(filter)
            );
            
            filteredRequesters.forEach(requester => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerText = requester.fullName;
                option.onclick = function() {
                    requesterSearchInput.value = requester.fullName;
                    document.getElementById('RequesterId').value = requester.id;
                    requesterDropdown.classList.add('hidden');
                    
                    // Update department - use correct field ID
                    const departmentSelect = document.getElementById('departmentId');
                    if (requester.department && departmentSelect) {
                        const departmentOptions = departmentSelect.options;
                        for (let i = 0; i < departmentOptions.length; i++) {
                            if (departmentOptions[i].textContent === requester.department) {
                                departmentSelect.selectedIndex = i;
                                break;
                            }
                        }
                    }
                    
                    // Refresh category dropdowns after requester selection
                    refreshAllCategoryDropdowns();
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

        // Show dropdown when input is clicked
        requesterSearchInput.addEventListener('click', function() {
            requesterDropdown.classList.remove('hidden');
            populateRequesterDropdown();
        });

        // Show dropdown when input is focused
        requesterSearchInput.addEventListener('focus', function() {
            requesterDropdown.classList.remove('hidden');
            populateRequesterDropdown();
        });

        // Filter and show dropdown when input value changes
        requesterSearchInput.addEventListener('input', function() {
            filterRequesters();
        });

        // Show dropdown when key is pressed
        requesterSearchInput.addEventListener('keydown', function() {
            requesterDropdown.classList.remove('hidden');
            filterRequesters();
        });
    }
    
    // Populate approval fields if data is available
    if (caData) {
        populateApprovalFields(caData);
        populateSuperiorEmployeesWithData(caData);
    }
    
    // Setup click handlers for approval dropdowns to show dropdown when clicked
    document.addEventListener('click', function(event) {
        const dropdowns = document.querySelectorAll('.search-dropdown');
        dropdowns.forEach(dropdown => {
            const parentDiv = dropdown.parentElement;
            if (parentDiv && !parentDiv.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
    });
}

// Comprehensive approval field handling similar to detailCash.js
// Global variable to store approval field values from API
window.approvalFieldValues = {};

function populateApprovalFields(data) {
    console.log('Populating approval fields with data:', data);
    
    // Store approval field values globally for later use
    window.approvalFieldValues = {
        preparedById: data.preparedById,
        preparedName: data.preparedName,
        checkedById: data.checkedById,
        checkedName: data.checkedName,
        acknowledgedById: data.acknowledgedById,
        acknowledgedName: data.acknowledgedName,
        approvedById: data.approvedById,
        approvedName: data.approvedName,
        receivedById: data.receivedById,
        receivedName: data.receivedName,
        closedById: data.closedById,
        closedName: data.closedName
    };
    
    // Toggle closed by visibility based on transaction type
    toggleClosedBy();
    
    console.log('Stored approval field values globally:', window.approvalFieldValues);
    
    // Map of field names to API response field names - using the actual API field names from Cash Advance
    const approvalFieldMapping = {
        'preparedBy': {
            searchInput: 'Approval.PreparedByIdSearch',
            selectElement: 'Approval.PreparedById',
            apiField: 'preparedName',
            apiIdField: 'preparedById'
        },
        'checkedBy': {
            searchInput: 'Approval.CheckedByIdSearch',
            selectElement: 'Approval.CheckedById',
            apiField: 'checkedName',
            apiIdField: 'checkedById'
        },
        'acknowledgeBy': {
            searchInput: 'Approval.AcknowledgedByIdSearch',
            selectElement: 'Approval.AcknowledgedById',
            apiField: 'acknowledgedName',
            apiIdField: 'acknowledgedById'
        },
        'approvedBy': {
            searchInput: 'Approval.ApprovedByIdSearch',
            selectElement: 'Approval.ApprovedById',
            apiField: 'approvedName',
            apiIdField: 'approvedById'
        },
        'receivedBy': {
            searchInput: 'Approval.ReceivedByIdSearch',
            selectElement: 'Approval.ReceivedById',
            apiField: 'receivedName',
            apiIdField: 'receivedById'
        },
        'closedBy': {
            searchInput: 'Approval.ClosedByIdSearch',
            selectElement: 'Approval.ClosedById',
            apiField: 'closedName',
            apiIdField: 'closedById'
        }
    };
    
    // Toggle closed by visibility based on transaction type
    toggleClosedBy();
    
    // Populate each approval field
    Object.entries(approvalFieldMapping).forEach(([fieldKey, fieldConfig]) => {
        const searchInput = document.getElementById(fieldConfig.searchInput);
        const selectElement = document.getElementById(fieldConfig.selectElement);
        
        console.log(`Processing field: ${fieldKey}`);
        console.log(`API data - ${fieldConfig.apiField}:`, data[fieldConfig.apiField]);
        console.log(`API data - ${fieldConfig.apiIdField}:`, data[fieldConfig.apiIdField]);
        console.log(`Search input found:`, !!searchInput);
        console.log(`Select element found:`, !!selectElement);
        
        // Populate the search input with the name
        if (searchInput && data[fieldConfig.apiField]) {
            console.log(`Setting ${fieldConfig.searchInput} to: ${data[fieldConfig.apiField]}`);
            searchInput.value = data[fieldConfig.apiField];
            
            // Disable prepared by field
            if (fieldKey === 'preparedBy') {
                searchInput.readOnly = true;
                searchInput.classList.add('bg-gray-100');
            }
        }
        
        // Populate the hidden select with the ID
        if (selectElement && data[fieldConfig.apiIdField]) {
            console.log(`Setting ${fieldConfig.selectElement} to: ${data[fieldConfig.apiIdField]}`);
            
            // First add the option if it doesn't exist
            const existingOption = Array.from(selectElement.options).find(opt => opt.value === data[fieldConfig.apiIdField]);
            if (!existingOption) {
                const option = document.createElement('option');
                option.value = data[fieldConfig.apiIdField];
                option.textContent = data[fieldConfig.apiField] || 'Unknown User';
                option.selected = true;
                selectElement.appendChild(option);
                console.log(`Added option for ${fieldConfig.selectElement}: ${data[fieldConfig.apiIdField]} - ${data[fieldConfig.apiField]}`);
            }
            
            // Set the value
            selectElement.value = data[fieldConfig.apiIdField];
            console.log(`Final value for ${fieldConfig.selectElement}: ${selectElement.value}`);
        }
    });
    
    // Debug: Check all approval field values after population
    console.log('Final approval field values:');
    Object.values(approvalFieldMapping).forEach(fieldConfig => {
        const selectElement = document.getElementById(fieldConfig.selectElement);
        const searchInput = document.getElementById(fieldConfig.searchInput);
        console.log(`${fieldConfig.selectElement}: ${selectElement ? selectElement.value : 'NOT FOUND'}`);
        console.log(`${fieldConfig.searchInput}: ${searchInput ? searchInput.value : 'NOT FOUND'}`);
    });
}

async function populateSuperiorEmployeesWithData(data) {
    console.log('Populating superior employees with data:', data);
    
    // Use the comprehensive approval field handling similar to detailPR.js
    populateApprovalFields(data);
}

function setupApprovalFieldEventListeners() {
    console.log('Setting up approval field event listeners');
    
    // Setup click handlers for approval dropdowns to show dropdown when clicked
    const approvalFields = [
        'Approval.PreparedById',
        'Approval.CheckedById', 
        'Approval.AcknowledgedById',
        'Approval.ApprovedById',
        'Approval.ReceivedById',
        'Approval.ClosedById'
    ];
    
    approvalFields.forEach(fieldId => {
        const searchInput = document.getElementById(fieldId + 'Search');
        const dropdown = document.getElementById(fieldId + 'Dropdown');
        
        if (searchInput && dropdown) {
            console.log(`Setting up event listeners for ${fieldId}`);
            
            // Remove existing event listeners to avoid duplicates
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
            
            // Show dropdown when input is clicked
            newSearchInput.addEventListener('click', function() {
                if (!newSearchInput.readOnly) {
                    console.log(`Clicked ${fieldId}, showing dropdown`);
                    dropdown.classList.remove('hidden');
                    filterUsers(fieldId);
                }
            });
            
            // Show dropdown when input is focused
            newSearchInput.addEventListener('focus', function() {
                if (!newSearchInput.readOnly) {
                    console.log(`Focused ${fieldId}, showing dropdown`);
                    dropdown.classList.remove('hidden');
                    filterUsers(fieldId);
                }
            });
            
            // Show dropdown when input value changes (for backspace, typing, etc.)
            newSearchInput.addEventListener('input', function() {
                if (!newSearchInput.readOnly) {
                    console.log(`Input changed for ${fieldId}, showing dropdown`);
                    dropdown.classList.remove('hidden');
                    filterUsers(fieldId);
                }
            });
            
            // Show dropdown when key is pressed (for backspace, delete, etc.)
            newSearchInput.addEventListener('keydown', function(e) {
                if (!newSearchInput.readOnly) {
                    // Slight delay to allow the input value to update first
                    setTimeout(() => {
                        console.log(`Key pressed for ${fieldId} (${e.key}), showing dropdown`);
                        dropdown.classList.remove('hidden');
                        filterUsers(fieldId);
                    }, 10);
                }
            });
        } else {
            console.warn(`Search input or dropdown not found for ${fieldId}`);
        }
    });
}

function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const searchText = searchInput ? searchInput.value.toLowerCase() : '';
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    
    console.log(`filterUsers called for ${fieldId} with search text: "${searchText}"`);
    
    if (!searchInput || !dropdown) {
        console.error(`Search input or dropdown not found for ${fieldId}`);
        return;
    }
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    // For approval fields, use superior employees if available
    let usersToFilter = [];
    
    if (fieldId.startsWith('Approval.')) {
        // Use superior employees for approval fields
        const superiorLevel = getSuperiorLevelForField(fieldId);
        console.log(`Filtering for field: ${fieldId}, superiorLevel: ${superiorLevel}`);
        console.log(`window.superiorEmployees:`, window.superiorEmployees);
        console.log(`Available superior levels:`, Object.keys(window.superiorEmployees || {}));
        
        if (superiorLevel && window.superiorEmployees && window.superiorEmployees[superiorLevel]) {
            usersToFilter = window.superiorEmployees[superiorLevel];
            console.log(`Using superior employees for level ${superiorLevel}:`, usersToFilter);
        } else {
            console.warn(`No superior employees found for level ${superiorLevel}, falling back to regular users`);
            // Fallback to regular users if superior employees not available
            usersToFilter = window.requesters || [];
            console.log(`Falling back to regular users:`, usersToFilter);
        }
    } else {
        // Use regular users for non-approval fields
        usersToFilter = window.requesters || [];
        console.log(`Using regular users for non-approval field:`, usersToFilter);
    }
    
    console.log(`Total users to filter: ${usersToFilter.length}`);
    
    // Filter users based on search text
    const filteredUsers = usersToFilter.filter(user => {
        const userName = user.fullName || user.superiorFullName || user.name || '';
        const matches = userName.toLowerCase().includes(searchText);
        console.log(`User: ${userName}, matches "${searchText}": ${matches}`);
        return matches;
    });
    
    console.log(`Filtered users count: ${filteredUsers.length}`);
    
    // Display search results
    filteredUsers.forEach(user => {
        const option = document.createElement('div');
        option.className = 'dropdown-item p-2 cursor-pointer hover:bg-gray-100';
        option.innerText = user.fullName || user.superiorFullName || user.name || '';
        option.onclick = function() {
            const userName = user.fullName || user.superiorFullName || user.name || '';
            const userId = user.id || user.superiorUserId || '';
            console.log(`Selected user: ${userName} (${userId})`);
            searchInput.value = userName;
            document.getElementById(fieldId).value = userId;
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(option);
    });
    
    // Show message if no results
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = `No matching users found for "${searchText}"`;
        dropdown.appendChild(noResults);
    }
    
    // Show dropdown
    dropdown.classList.remove('hidden');
    console.log(`Dropdown shown with ${filteredUsers.length} results`);
}

function fetchTransactionTypes() {
    fetch(`${BASE_URL}/api/transactiontypes/filter?category=CashAdvance`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Transaction Type data:", data);
            populateTransactionTypeSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching transaction types:', error);
        });
}

function populateTransactionTypeSelect(transactionTypes) {
    const transactionTypeSelect = document.getElementById("transactionType");
    if (!transactionTypeSelect) return;
    
    transactionTypeSelect.innerHTML = '<option value="" disabled>Select Transaction Type</option>';

    transactionTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type.name;
        option.textContent = type.name;
        transactionTypeSelect.appendChild(option);
    });
    
    if (window.currentValues && window.currentValues.transactionType) {
        transactionTypeSelect.value = window.currentValues.transactionType;
    }
    
    transactionTypeSelect.addEventListener('change', function() {
        refreshAllCategoryDropdowns();
        populateAllSuperiorEmployeeDropdowns(this.value);
    });
}

function fetchBusinessPartners() {
    fetch(`${BASE_URL}/api/business-partners/type/all`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Business Partners data:", data);
            setupBusinessPartnerSearch(data.data);
        })
        .catch(error => {
            console.error('Error fetching business partners:', error);
        });
}

function setupBusinessPartnerSearch(businessPartners) {
    window.businessPartners = businessPartners.filter(bp => bp.active).map(bp => ({
        id: bp.id,
        code: bp.code,
        name: bp.name
    }));

    const paidToSearchInput = document.getElementById('paidToSearch');
    const paidToDropdown = document.getElementById('paidToDropdown');
    const paidToHiddenInput = document.getElementById('paidTo');
    
    if (paidToSearchInput && paidToDropdown && paidToHiddenInput) {
        window.filterBusinessPartners = function() {
            const searchText = paidToSearchInput.value.toLowerCase();
            populateBusinessPartnerDropdown(searchText);
            paidToDropdown.classList.remove('hidden');
        };

        function populateBusinessPartnerDropdown(filter = '') {
            paidToDropdown.innerHTML = '';
            
            const filteredPartners = window.businessPartners.filter(bp => 
                bp.code.toLowerCase().includes(filter) || 
                bp.name.toLowerCase().includes(filter)
            );
            
            filteredPartners.forEach(partner => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerHTML = `<span class="font-medium">${partner.code}</span> - ${partner.name}`;
                option.onclick = function() {
                    paidToSearchInput.value = `${partner.code} - ${partner.name}`;
                    paidToHiddenInput.value = partner.code;
                    paidToDropdown.classList.add('hidden');
                };
                paidToDropdown.appendChild(option);
            });
            
            if (filteredPartners.length === 0) {
                const noResult = document.createElement('div');
                noResult.className = 'p-2 text-gray-500';
                noResult.textContent = 'No matching business partners found';
                paidToDropdown.appendChild(noResult);
            }
        }

        paidToSearchInput.addEventListener('focus', function() {
            populateBusinessPartnerDropdown('');
            paidToDropdown.classList.remove('hidden');
        });
        
        paidToSearchInput.addEventListener('input', function() {
            filterBusinessPartners();
        });
    }
}

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    caId = urlParams.get('ca-id');
    currentTab = urlParams.get('tab');
    
    if (caId) {
        fetchCADetails(caId);
    }
    
    fetchDepartments();
    fetchUsers();
    fetchTransactionTypes();
    fetchBusinessPartners();
    
    // Initialize superior employees for prepared by (level PR) like detailCash.js
    fetchSuperiorEmployees('CA', '', 'PR').then(superiors => {
        if (!window.superiorEmployees) {
            window.superiorEmployees = {};
        }
        window.superiorEmployees['PR'] = superiors.map(superior => ({
            id: superior.id,
            superiorUserId: superior.id,
            fullName: superior.fullName,
            superiorFullName: superior.fullName,
            superiorLevel: superior.superiorLevel,
            transactionType: superior.transactionType
        }));
        console.log('Initialized superior employees for level PR:', window.superiorEmployees['PR']);
        
        populateSuperiorEmployeeDropdownWithData('Approval.PreparedById', window.superiorEmployees['PR']);
        
        // Setup approval field event listeners early
        setupApprovalFieldEventListeners();
    });
    
    // Apply tab-based behavior after data is loaded
    setTimeout(() => {
        applyTabBasedBehavior();
    }, 1000);
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
                populateForm(response.data);
                fetchDropdownOptions(response.data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error fetching CA details: ' + error.message);
        });
}

async function populateForm(data) {
    cashAdvanceData = data;
    console.log("cashAdvanceData", cashAdvanceData);
    
    window.currentValues = {
        transactionType: data.transactionType,
        departmentName: data.departmentName,
        departmentId: data.departmentId,
        status: data.status,
        employeeId: data.employeeId
    };
    
    document.getElementById("cashAdvanceNo").value = data.cashAdvanceNo || '';
    document.getElementById("purpose").value = data.purpose || '';
    
    document.getElementById("employeeNIK").value = data.employeeNIK || '';
    document.getElementById("employeeName").value = data.employeeName || '';
    document.getElementById('Currency').value = data.currency || '';
    
    if (data.departmentId) {
        document.getElementById("departmentId").value = data.departmentId;
    }
    if (data.transactionType) {
        document.getElementById("transactionType").value = data.transactionType;
    }
    
    // Handle PayTo business partner
    if (data.payToCode && data.payToName) {
        const paidToSearchInput = document.getElementById('paidToSearch');
        const paidToHiddenInput = document.getElementById('paidTo');
        
        if (paidToSearchInput && paidToHiddenInput) {
            console.log('Setting PayTo field - payToName:', data.payToName, 'payToCode:', data.payToCode);
            paidToSearchInput.value = data.payToName;
            paidToHiddenInput.value = data.payToCode;
            console.log('PayTo field values after setting - search:', paidToSearchInput.value, 'hidden:', paidToHiddenInput.value);
        }
    }
    
    if (data.submissionDate) {
        const formattedDate = data.submissionDate.split('T')[0];
        document.getElementById("submissionDate").value = formattedDate;
    }
    
    if (data.requesterName) {
        document.getElementById("requesterSearch").value = data.requesterName;
        // Store requester ID for later use
        if (data.requesterId) {
            const requesterSelect = document.getElementById('RequesterId');
            if (requesterSelect) {
                requesterSelect.value = data.requesterId;
            }
        }
    }
    
    document.getElementById("remarks").value = data.remarks || '';
    
    // Populate status
    const statusSelect = document.getElementById("status");
    if (statusSelect && data.status) {
        statusSelect.innerHTML = `<option value="${data.status}" selected>${data.status}</option>`;
    }
    
    if (data.cashAdvanceDetails) {
        await populateTable(data.cashAdvanceDetails);
    }
    
    if (data.attachments) {
        console.log('Displaying attachments:', data.attachments.length, 'attachments found');
        existingAttachments = data.attachments;
        attachmentsToKeep = data.attachments.map(att => att.id);
        updateAttachmentsDisplay();
    } else {
        console.log('No attachments found in data');
    }
    
    displayRevisedRemarks(data);
    displayRejectionRemarks(data);
    
    // Auto-populate superior fields when transaction type is available
    if (data.transactionType) {
        await populateAllSuperiorEmployeeDropdowns(data.transactionType);
        
        // Setup event listeners for approval fields after superior employees are loaded
        setupApprovalFieldEventListeners();
    }
    
    // Fetch currencies and populate dropdown
    await fetchCurrencies(cashAdvanceData);
    
    // Apply tab-based behavior after form is populated
    // Ensure fixed fields remain locked even in revision
    lockFixedFields();
    applyTabBasedBehavior();
}

async function populateTable(cashAdvanceDetails) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    if (cashAdvanceDetails.length === 0) {
        addRow();
        return;
    }
    
    console.log('Cash advance details:', cashAdvanceDetails);
    
    for (const detail of cashAdvanceDetails) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border relative">
                <input type="text" class="category-input w-full" placeholder="Search category..." value="${detail.category || ''}" />
                <div class="category-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-40 overflow-y-auto"></div>
            </td>
            <td class="p-2 border">
                <select class="account-name w-full">
                    ${detail.accountName 
                        ? `<option value="${detail.accountName}" selected>${detail.accountName}</option>` 
                        : `<option value="" selected>Select Account Name</option>`
                    }
                </select>
            </td>
            <td class="p-2 border">
                <input type="text" class="coa w-full" readonly style="background-color: #f3f4f6;" value="${detail.coa || ''}" />
            </td>
            <td class="p-2 border">
                <input type="text" value="${detail.description || ''}" class="w-full description" maxlength="200" required />
            </td>
            <td class="p-2 border">
                <input type="text" value="${detail.amount ? new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(detail.amount)) : '0.00'}" class="w-full total" required onkeydown="handleAmountKeydown(this, event)" />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
            </td>
        `;
        tableBody.appendChild(row);
        
        // Setup amount input event listeners for existing rows
        const amountInput = row.querySelector('.total');
        if (amountInput) {
            amountInput.addEventListener('input', function() { formatNumberAsYouType(this); });
        }
        
        await setupCategoryDropdown(row);
        
        if (detail.category) {
            const categoryInput = row.querySelector('.category-input');
            const departmentId = document.getElementById("departmentId").value;
            const transactionType = document.getElementById("transactionType").value;
            await ensureCategoryAvailable(categoryInput, detail.category, departmentId, transactionType);
        }
        
        if (detail.category && detail.accountName) {
            await populateAccountNameDropdownForInitialLoad(
                row, 
                detail.category, 
                document.getElementById("departmentId").value, 
                document.getElementById("transactionType").value, 
                detail.accountName, 
                detail.coa
            );
        }
    }
    
    // Calculate total amount after populating all rows
    calculateTotalAmount();
}

async function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");
    
    newRow.innerHTML = `
        <td class="p-2 border relative">
            <input type="text" class="category-input w-full" placeholder="Select requester and transaction type first" disabled />
            <div class="category-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-40 overflow-y-auto"></div>
        </td>
        <td class="p-2 border">
            <select class="account-name w-full bg-gray-100" disabled>
                <option value="">Select Account Name</option>
            </select>
        </td>
        <td class="p-2 border">
            <input type="text" class="coa w-full" readonly style="background-color: #f3f4f6;" />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full description" maxlength="200" required />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full total" value="0.00" required onkeydown="handleAmountKeydown(this, event)" />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
    await setupCategoryDropdown(newRow);
    
    // Setup amount input: format with thousand separators as the user types
    const amountInput = newRow.querySelector('.total');
    if (amountInput) {
        amountInput.addEventListener('input', function() { formatNumberAsYouType(this); });
    }
    
    // Calculate total amount after adding new row
    calculateTotalAmount();
}

function deleteRow(button) {
    button.closest("tr").remove();
    calculateTotalAmount(); // Recalculate total after removing a row
}

// Helper: parse formatted number string (e.g., "1,234.56") to Number
function parseFormattedNumber(value) {
    if (!value) return 0;
    // Remove commas and spaces
    const sanitized = String(value).replace(/[,\s]/g, '');
    const num = parseFloat(sanitized);
    return isNaN(num) ? 0 : num;
}

// Helper: format number with thousands separators and 2 decimals (en-US)
function formatWithThousands(amount) {
    const num = typeof amount === 'number' ? amount : parseFormattedNumber(amount);
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

// Function to calculate total amount from all rows
function calculateTotalAmount() {
    const totalInputs = document.querySelectorAll('.total');
    let sum = 0;
    
    totalInputs.forEach(input => {
        const numeric = parseFormattedNumber(input.value);
        sum += numeric;
    });
    
    // Update the total amount display with delimiters
    const totalAmountDisplay = document.getElementById('totalAmountDisplay');
    if (totalAmountDisplay) {
        totalAmountDisplay.textContent = formatWithThousands(sum);
    }
}

// Caret-preserving formatter reused in JS context
function formatNumberAsYouType(input) {
    const oldValue = (input.value || '').toString();
    const selectionStart = input.selectionStart || 0;
    
    // Count digits before cursor position for cursor restoration
    const digitsBeforeCaret = oldValue.slice(0, selectionStart).replace(/[^0-9]/g, '').length;

    // Clean the input: remove all non-numeric except decimal point
    let raw = oldValue.replace(/,/g, '');
    const firstDot = raw.indexOf('.');
    if (firstDot !== -1) {
        // Keep only the first decimal point
        raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, '');
    }
    raw = raw.replace(/[^0-9.]/g, '');

    if (!raw) {
        input.value = '';
        try { input.setSelectionRange(0, 0); } catch (e) {}
        calculateTotalAmount();
        return;
    }

    // Split into integer and decimal parts
    const parts = raw.split('.');
    let intPart = parts[0] || '';
    let decPart = parts.length > 1 ? parts[1] : '';
    
    // Limit decimal part to 2 digits
    if (decPart.length > 2) {
        decPart = decPart.substring(0, 2);
    }
    
    // Remove leading zeros from integer part (but keep at least one digit)
    intPart = intPart.replace(/^0+/, '') || '0';
    
    // Format integer part with thousand separators
    const formattedInt = intPart ? Number(intPart).toLocaleString('en-US') : '0';
    
    // Construct the new value
    const newValue = decPart !== '' ? `${formattedInt}.${decPart}` : formattedInt;
    input.value = newValue;

    // Restore cursor position based on digit count before cursor
    let newPos = 0;
    let seenDigits = 0;
    for (let i = 0; i < newValue.length; i++) {
        if (/\d/.test(newValue[i])) {
            seenDigits++;
            if (seenDigits >= digitsBeforeCaret) {
                newPos = i + 1;
                break;
            }
        }
        if (i === newValue.length - 1) {
            newPos = newValue.length;
        }
    }
    
    try { 
        input.setSelectionRange(newPos, newPos); 
    } catch (e) {}

    calculateTotalAmount();
}

// Function to format number with decimals on blur
function formatNumberWithDecimals(input) {
    let value = (input.value || '').toString().replace(/,/g, '').replace(/[^\d.]/g, '');
    if (!value || value === '.') {
        input.value = '0.00';
        calculateTotalAmount();
        return;
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
        input.value = '0.00';
        calculateTotalAmount();
        return;
    }
    input.value = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    calculateTotalAmount();
}

// Function to handle keydown events for amount input
function handleAmountKeydown(input, event) {
    const key = event.key;
    const cursorPos = input.selectionStart;
    const value = input.value;
    
    // Allow navigation keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab'].includes(key)) {
        return true;
    }
    
    // Allow backspace and delete
    if (['Backspace', 'Delete'].includes(key)) {
        return true;
    }
    
    // Allow decimal point (only one)
    if (key === '.' && !value.includes('.')) {
        return true;
    }
    
    // Allow only digits
    if (/^\d$/.test(key)) {
        return true;
    }
    
    // Prevent other keys
    event.preventDefault();
    return false;
}

function fetchDropdownOptions(caData = null) {
    fetchDepartments();
    fetchUsers(caData);
    fetchTransactionTypes();
    fetchBusinessPartners();
}

function displayRevisedRemarks(data) {
    const revisedRemarksSection = document.getElementById('revisedRemarksSection');
    
    const hasRevisions = data.revisions && data.revisions.length > 0;
    
    if (hasRevisions) {
        revisedRemarksSection.style.display = 'block';
        
        revisedRemarksSection.innerHTML = `
            <h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>
            <div class="bg-gray-50 p-4 rounded-lg border">
                <div class="mb-2">
                    <span class="text-sm font-medium text-gray-600">Total Revisions: </span>
                    <span id="revisedCount" class="text-sm font-bold text-blue-600">${data.revisions.length}</span>
                </div>
            </div>
        `;
        
        const revisionsByStage = {};
        data.revisions.forEach(revision => {
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
        
        Object.keys(revisionsByStage).forEach(stage => {
            const stageRevisions = revisionsByStage[stage];
            
            const stageHeader = document.createElement('div');
            stageHeader.className = 'mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded';
            stageHeader.innerHTML = `
                <h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${stageRevisions.length})</h4>
            `;
            revisedRemarksSection.appendChild(stageHeader);
            
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

function displayRejectionRemarks(data) {
    if (data.status !== 'Rejected') {
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        if (rejectionSection) {
            rejectionSection.style.display = 'none';
        }
        return;
    }
    
    const rejectionSection = document.getElementById('rejectionRemarksSection');
    const rejectionTextarea = document.getElementById('rejectionRemarks');
    
    if (rejectionSection && rejectionTextarea) {
        let rejectionRemarks = '';
        
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
        } else if (data.remarks) {
            rejectionRemarks = data.remarks;
        }
        
        if (rejectionRemarks.trim() !== '') {
            rejectionSection.style.display = 'block';
            rejectionTextarea.value = rejectionRemarks;
        } else {
            rejectionSection.style.display = 'none';
        }
    }
}

function previewPDF(event) {
    const files = event.target.files;
    const totalExistingFiles = attachmentsToKeep.length + uploadedFiles.length;
    
    if (files.length + totalExistingFiles > 5) {
        alert('Maximum 5 PDF files are allowed.');
        event.target.value = '';
        return;
    }
    
    Array.from(files).forEach(file => {
        if (file.type === 'application/pdf') {
            uploadedFiles.push(file);
        } else {
            alert('Please upload a valid PDF file');
        }
    });
    
    updateAttachmentsDisplay();
}

function removeUploadedFile(index) {
    uploadedFiles.splice(index, 1);
    updateAttachmentsDisplay();
}

function removeExistingAttachment(attachmentId) {
    const index = attachmentsToKeep.indexOf(attachmentId);
    if (index > -1) {
        attachmentsToKeep.splice(index, 1);
        updateAttachmentsDisplay();
    }
}

function updateAttachmentsDisplay() {
    const attachmentsList = document.getElementById('attachmentsList');
    if (!attachmentsList) return;
    
    attachmentsList.innerHTML = '';
    
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
                <button onclick="removeExistingAttachment('${attachment.id}')" class="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1 border border-red-500 rounded hover:bg-red-50 transition">
                    Remove
                </button>
            </div>
        `;
        attachmentsList.appendChild(attachmentItem);
    });
    
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
                <button onclick="removeUploadedFile(${index})" class="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1 border border-red-500 rounded hover:bg-red-50 transition">
                    Remove
                </button>
            </div>
        `;
        attachmentsList.appendChild(attachmentItem);
    });
    
    if (existingToKeep.length === 0 && uploadedFiles.length === 0) {
        attachmentsList.innerHTML = '<p class="text-gray-500 text-sm text-center py-2">No attachments</p>';
    }
    
    const totalAttachments = existingToKeep.length + uploadedFiles.length;
    console.log(`Total attachments: ${totalAttachments} (${existingToKeep.length} existing, ${uploadedFiles.length} new)`);
}

function submitRevision() {
    if (!caId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'CA ID not found'
        });
        return;
    }

    Swal.fire({
        title: 'Submit Revision',
        text: 'Are you sure you want to submit this revision?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Submit',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateCashAdvance(true);
        }
    });
}

async function updateCashAdvance(isSubmit = false) {
    Swal.fire({
        title: 'Processing...',
        text: 'Please wait while we update the Cash Advance.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const formData = new FormData();
    
    formData.append('CashAdvanceNo', document.getElementById("cashAdvanceNo").value);
    formData.append('Purpose', document.getElementById("purpose").value);
    formData.append('SubmissionDate', document.getElementById("submissionDate").value);
    formData.append('Remarks', document.getElementById("remarks").value);
    
    // Get requester ID from the hidden select
    const requesterSelect = document.getElementById('RequesterId');
    if (requesterSelect && requesterSelect.value) {
        formData.append('RequesterId', requesterSelect.value);
    }
    
    formData.append('PayToCode', document.getElementById("paidTo").value);
    formData.append('DepartmentId', document.getElementById("departmentId").value);
    formData.append('TransactionType', document.getElementById("transactionType").value);
    formData.append('Currency', document.getElementById("Currency").value);
    
    // Add EmployeeNIK which is required by the API
    formData.append('EmployeeNIK', document.getElementById("employeeNIK").value);
    
    // Add approval fields using the correct IDs - with debugging
    const approvalFields = {
        'PreparedById': 'Approval.PreparedById',
        'CheckedById': 'Approval.CheckedById',
        'AcknowledgedById': 'Approval.AcknowledgedById',
        'ApprovedById': 'Approval.ApprovedById',
        'ReceivedById': 'Approval.ReceivedById',
        'ClosedById': 'Approval.ClosedById'
    };
    
    Object.entries(approvalFields).forEach(([apiField, elementId]) => {
        const element = document.getElementById(elementId);
        const value = element ? element.value : '';
        console.log(`${apiField}: elementId=${elementId}, value=${value}`);
        formData.append(apiField, value || '');
    });
    
    const closedBySelect = document.getElementById('Approval.ClosedById');
    if (closedBySelect && closedBySelect.value) {
        console.log(`ClosedById: value=${closedBySelect.value}`);
        formData.append('ClosedById', closedBySelect.value);
    }
    
    const tableRows = document.querySelectorAll('#tableBody tr');
    let detailIndex = 0;
    tableRows.forEach((row) => {
        const categoryInput = row.querySelector('.category-input');
        const accountNameSelect = row.querySelector('.account-name');
        const coaInput = row.querySelector('.coa');
        const descriptionInput = row.querySelector('.description');
        const amountInput = row.querySelector('.total');
        
        const category = categoryInput?.value;
        const accountName = accountNameSelect?.value;
        const coa = coaInput?.value;
        const description = descriptionInput?.value;
        // Normalize amount for backend: strip trailing .00 to avoid being interpreted as cents multiplier
        const rawAmount = amountInput ? parseFormattedNumber(amountInput.value) : 0;
        const amount = rawAmount.toString().replace(/\.00$/, '');
        
        if (description && amount) {
            formData.append(`CashAdvanceDetails[${detailIndex}][Category]`, category || '');
            formData.append(`CashAdvanceDetails[${detailIndex}][AccountName]`, accountName || '');
            formData.append(`CashAdvanceDetails[${detailIndex}][Coa]`, coa || '');
            formData.append(`CashAdvanceDetails[${detailIndex}][Description]`, description);
            formData.append(`CashAdvanceDetails[${detailIndex}][Amount]`, amount);
            detailIndex++;
        }
    });

    attachmentsToKeep.forEach((attachmentId, index) => {
        const existingAttachment = existingAttachments.find(att => att.id === attachmentId);
        if (existingAttachment) {
            formData.append(`Attachments[${index}].Id`, attachmentId);
            formData.append(`Attachments[${index}].FileName`, existingAttachment.fileName || '');
        }
    });
    
    uploadedFiles.forEach((file, index) => {
        const attachmentIndex = attachmentsToKeep.length + index;
        formData.append(`Attachments[${attachmentIndex}].Id`, '00000000-0000-0000-0000-000000000000');
        formData.append(`Attachments[${attachmentIndex}].File`, file);
    });
    
    formData.append('IsSubmit', isSubmit);
    
    // Debug: Log all form data
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    
    try {
        const response = await fetch(`${BASE_URL}/api/cash-advance/${caId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok || response.status === 204) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: isSubmit ? 'Cash Advance revision submitted successfully' : 'Cash Advance updated successfully',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = '../../../dashboard/dashboardRevision/cashAdvance/menuCashRevision.html';
            });
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to update Cash Advance: ${response.status}`);
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error updating Cash Advance: ' + error.message
        });
    }
}

function goToMenuRevisionCash() {
    window.location.href = "../../../dashboard/dashboardRevision/cashAdvance/menuCashRevision.html";
}

// Superior employee functions - same as detailCash.js
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
        console.log('Raw API response:', result);

        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch superior employees');
        }

        const allSuperiors = result.data;
        console.log('All superiors from API:', allSuperiors);

        // Filter by transaction type and superior level
        const filteredSuperiors = allSuperiors.filter(superior => {
            // Map transaction type to API transaction type
            const transactionTypeMap = {
                'NRM': 'NRM',
                'Entertainment': 'EN',
                'Golf Competition': 'GC',
                'Medical': 'ME',
                'Others': 'OT',
                'Travelling': 'TR',
                'Personal Loan': 'LO'
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
                    } catch (userError) {
                        console.warn(`Failed to fetch user details for ${superior.superiorUserId}:`, userError);
                    }
                }
                
                superiorsWithFullNames.push({
                    id: superior.superiorUserId,
                    superiorUserId: superior.superiorUserId,
                    fullName: fullName,
                    superiorFullName: fullName,
                    superiorLevel: superior.superiorLevel,
                    transactionType: superior.typeTransaction
                });
                
            } catch (error) {
                console.error(`Error processing superior ${superior.superiorUserId}:`, error);
            }
        }

        console.log(`Final superior employees for level ${superiorLevel}:`, superiorsWithFullNames);
        return superiorsWithFullNames;

    } catch (error) {
        console.error('Error fetching superior employees:', error);
        return [];
    }
}

function getSuperiorLevelForField(fieldId) {
    const levelMap = {
        'Approval.PreparedById': 'PR',
        'Approval.CheckedById': 'CH',
        'Approval.AcknowledgedById': 'AC',
        'Approval.ApprovedById': 'AP',
        'Approval.ReceivedById': 'RE',
        'Approval.ClosedById': 'RE'
    };
    return levelMap[fieldId] || null;
}

async function populateSuperiorEmployeeDropdownWithData(fieldId, superiors) {
    console.log(`populateSuperiorEmployeeDropdownWithData called for fieldId: ${fieldId} with ${superiors.length} superiors`);
    
    // Get the select element
    const selectElement = document.getElementById(fieldId);
    if (!selectElement) {
        console.error(`Select element not found for fieldId: ${fieldId}`);
        return;
    }
    
    // Store the current value before any changes
    const currentValue = selectElement.value;
    console.log(`Current value for ${fieldId}: ${currentValue}`);
    
    // Also check if we have the value in the search input (as a backup)
    const searchInputElement = document.getElementById(fieldId + 'Search');
    const searchInputValue = searchInputElement ? searchInputElement.value : '';
    console.log(`Search input value for ${fieldId}: ${searchInputValue}`);
    
    // Get the value from global storage as fallback
    const fieldKey = fieldId.replace('Approval.', '').toLowerCase();
    const globalValue = window.approvalFieldValues ? window.approvalFieldValues[fieldKey] : null;
    console.log(`Global value for ${fieldId} (key: ${fieldKey}): ${globalValue}`);
    console.log(`Available global values:`, window.approvalFieldValues);
    
    // Don't clear existing options - preserve them and add new ones
    // Only clear if there are no existing options (except the default one)
    const existingOptions = Array.from(selectElement.options);
    const hasExistingOptions = existingOptions.length > 1 || (existingOptions.length === 1 && existingOptions[0].value !== '');
    
    if (!hasExistingOptions) {
        selectElement.innerHTML = '<option value="" disabled selected>Select User</option>';
    }
    
    // Add superior employees to dropdown (only if they don't already exist)
    console.log(`Adding ${superiors.length} superiors to dropdown for fieldId: ${fieldId}`);
    superiors.forEach(superior => {
        // Check if this superior already exists in the options
        const existingOption = Array.from(selectElement.options).find(opt => opt.value === superior.superiorUserId);
        
        if (!existingOption) {
            const option = document.createElement('option');
            option.value = superior.superiorUserId;
            option.textContent = superior.superiorFullName; // Use superiorFullName
            selectElement.appendChild(option);
            console.log(`Added superior: ${superior.superiorFullName} (${superior.superiorUserId}) to ${fieldId}`);
        } else {
            console.log(`Superior ${superior.superiorFullName} (${superior.superiorUserId}) already exists in ${fieldId}`);
        }
    });
    
    // Restore the current value if it exists and is valid
    let valueToRestore = currentValue;
    
    // If no current value, try global value
    if ((!valueToRestore || valueToRestore.trim() === '') && globalValue) {
        valueToRestore = globalValue;
        console.log(`Using global value for ${fieldId}: ${valueToRestore}`);
    }
    
    // If still no value, try to find it from search input by matching name
    if ((!valueToRestore || valueToRestore.trim() === '') && searchInputValue) {
        const matchingSuperior = superiors.find(s => s.superiorFullName === searchInputValue);
        if (matchingSuperior) {
            valueToRestore = matchingSuperior.superiorUserId;
            console.log(`Found value from search input for ${fieldId}: ${valueToRestore} (${searchInputValue})`);
        }
    }
    
    if (valueToRestore && valueToRestore.trim() !== '') {
        console.log(`Attempting to restore value for ${fieldId}: ${valueToRestore}`);
        console.log(`Available options:`, Array.from(selectElement.options).map(opt => ({ value: opt.value, text: opt.textContent })));
        
        const optionExists = Array.from(selectElement.options).some(option => option.value === valueToRestore);
        if (optionExists) {
            selectElement.value = valueToRestore;
            console.log(`✅ Successfully restored value for ${fieldId}: ${valueToRestore}`);
        } else {
            console.log(`❌ Value ${valueToRestore} not found in options for ${fieldId}, keeping current value`);
            console.log(`Final select value for ${fieldId}:`, selectElement.value);
        }
    } else {
        console.log(`No value to restore for ${fieldId}, keeping current value:`, selectElement.value);
    }
    
    // Update the search input dataset
    const searchInput = document.getElementById(fieldId + 'Search');
    if (searchInput) {
        searchInput.dataset.users = JSON.stringify(superiors.map(s => ({
            id: s.superiorUserId,
            name: s.superiorFullName
        })));
    }

    console.log(`Populated ${fieldId} dropdown with ${superiors.length} superior employees`);
}

async function populateSuperiorEmployeeDropdown(fieldId, documentType, transactionType) {
    console.log(`Populating superior dropdown for ${fieldId} with documentType: ${documentType}, transactionType: ${transactionType}`);
    
    try {
        const superiorLevel = getSuperiorLevelForField(fieldId);
        console.log(`Superior level for ${fieldId}: ${superiorLevel}`);
        
        const superiors = await fetchSuperiorEmployees(documentType, transactionType, superiorLevel);
        console.log(`Fetched ${superiors.length} superiors for ${fieldId}`);
        
        // Store superior employees by level in global window object like detailCash.js
        if (!window.superiorEmployees) {
            window.superiorEmployees = {};
        }
        window.superiorEmployees[superiorLevel] = superiors.map(superior => ({
            id: superior.id,
            superiorUserId: superior.id,
            fullName: superior.fullName,
            superiorFullName: superior.fullName,
            superiorLevel: superior.superiorLevel,
            transactionType: superior.transactionType
        }));
        
        console.log(`Stored superior employees for level ${superiorLevel}:`, window.superiorEmployees[superiorLevel]);
        
        await populateSuperiorEmployeeDropdownWithData(fieldId, window.superiorEmployees[superiorLevel]);
        
    } catch (error) {
        console.error(`Error populating ${fieldId} dropdown:`, error);
    }
}

async function populateAllSuperiorEmployeeDropdowns(transactionType) {
    console.log(`Populating all superior employee dropdowns for transaction type: ${transactionType}`);
    
    if (!transactionType || transactionType.trim() === '') {
        console.warn('No transaction type provided for superior employee dropdowns');
        return;
    }

    const documentType = 'CA'; // Cash Advance
    const fieldIds = ['Approval.PreparedById', 'Approval.CheckedById', 'Approval.AcknowledgedById', 'Approval.ApprovedById', 'Approval.ReceivedById'];
    
    // Add closedBy only for Personal Loan
    if (transactionType === 'Personal Loan') {
        fieldIds.push('Approval.ClosedById');
    }
    
    // Toggle closed by visibility
    toggleClosedBy();

    // Populate all dropdowns in parallel
    const promises = fieldIds.map(fieldId => 
        populateSuperiorEmployeeDropdown(fieldId, documentType, transactionType)
    );
    
    try {
        await Promise.all(promises);
        console.log('All superior employee dropdowns populated successfully');
        console.log('Final window.superiorEmployees:', window.superiorEmployees);
    } catch (error) {
        console.error('Error populating superior employee dropdowns:', error);
    }
} 

// Initialize amount formatting for existing rows when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set up amount formatting for existing rows
    const amountInputs = document.querySelectorAll('.total');
    amountInputs.forEach(input => {
        // Set default value if empty
        if (!input.value) {
            input.value = '0.00';
        }
        
        // Add event listeners for formatting
        input.addEventListener('input', function() {
            formatNumberAsYouType(this);
        });
        
        // Add keydown handler for better input control
        input.addEventListener('keydown', function(event) {
            handleAmountKeydown(this, event);
        });
    });
    
    // Calculate initial total
    calculateTotalAmount();
}); 

// Function to apply tab-based behavior
function applyTabBasedBehavior() {
    console.log('Applying tab-based behavior for tab:', currentTab);
    
    if (currentTab === 'prepared') {
        // For "prepared" tab: Make all fields read-only and hide submit button
        makeAllFieldsReadOnly();
        hideSubmitButton();
        console.log('Applied read-only mode for prepared tab');
    } else if (currentTab === 'revision') {
        // For "revision" tab: Allow editing and show submit button
        makeAllFieldsEditable();
        showSubmitButton();
        console.log('Applied editable mode for revision tab');
    } else {
        // Default: Make fields read-only for any other tab
        makeAllFieldsReadOnly();
        hideSubmitButton();
        console.log('Applied read-only mode for unknown tab:', currentTab);
    }
}

// Function to make all fields read-only (like detailCash.js)
function makeAllFieldsReadOnly() {
    // Make all input fields read-only
    document.querySelectorAll('input, textarea, select').forEach(el => {
        if (!el.classList.contains('action-btn') && !el.classList.contains('delete-btn')) {
            el.readOnly = true;
            el.disabled = true;
            el.classList.add('bg-gray-100');
        }
    });
    
    // Make table rows read-only
    const tableRows = document.querySelectorAll('#tableBody tr');
    tableRows.forEach(row => {
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.readOnly = true;
            input.disabled = true;
            input.classList.add('bg-gray-100');
        });
        
        // Hide delete buttons in table
        const deleteButtons = row.querySelectorAll('button[onclick*="deleteRow"]');
        deleteButtons.forEach(btn => {
            btn.style.display = 'none';
        });
    });
    
    // Hide add row button
    const addRowButton = document.querySelector('button[onclick*="addRow"]');
    if (addRowButton) {
        addRowButton.style.display = 'none';
    }
    
    // Disable file upload
    const fileInput = document.getElementById('Reference');
    if (fileInput) {
        fileInput.disabled = true;
        fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
}

// Function to make all fields editable
function makeAllFieldsEditable() {
    // Make all input fields editable
    document.querySelectorAll('input, textarea, select').forEach(el => {
        if (!el.classList.contains('action-btn') && !el.classList.contains('delete-btn')) {
            el.readOnly = false;
            el.disabled = false;
            el.classList.remove('bg-gray-100');
        }
    });
    
    // Make table rows editable
    const tableRows = document.querySelectorAll('#tableBody tr');
    tableRows.forEach(row => {
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.readOnly = false;
            input.disabled = false;
            input.classList.remove('bg-gray-100');
        });
        
        // Show delete buttons in table
        const deleteButtons = row.querySelectorAll('button[onclick*="deleteRow"]');
        deleteButtons.forEach(btn => {
            btn.style.display = 'inline-block';
        });
    });
    
    // Show add row button
    const addRowButton = document.querySelector('button[onclick*="addRow"]');
    if (addRowButton) {
        addRowButton.style.display = 'inline-block';
    }
    
    // Enable file upload
    const fileInput = document.getElementById('Reference');
    if (fileInput) {
        fileInput.disabled = false;
        fileInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
    }
    
    // Keep specific fields locked (not editable) even in revision
    lockFixedFields();
}

// Function to hide submit button
function hideSubmitButton() {
    const submitButton = document.querySelector('button[onclick="submitRevision()"]');
    if (submitButton) {
        submitButton.style.display = 'none';
    }
}

// Function to show submit button
async function fetchCurrencies(caData = null) {
    try {
        const response = await fetch(`${BASE_URL}/api/MasterCurrency/search`);
        if (!response.ok) {
            throw new Error('Failed to fetch currencies');
        }
        
        const result = await response.json();
        
        if (result.status && result.data) {
            populateCurrencySelect(result.data, caData);
        } else {
            console.error('Failed to fetch currencies:', result.message);
            // Fallback to default currencies
            populateCurrencySelect([
                { code: 'IDR', description: 'Indonesian Rupiah' },
                { code: 'USD', description: 'US Dollar' },
                { code: 'SGD', description: 'Singapore Dollar' }
            ], caData);
        }
    } catch (error) {
        console.error('Error fetching currencies:', error);
        // Fallback to default currencies
        populateCurrencySelect([
            { code: 'IDR', description: 'Indonesian Rupiah' },
            { code: 'USD', description: 'US Dollar' },
            { code: 'SGD', description: 'Singapore Dollar' }
        ], caData);
    }
}

function populateCurrencySelect(currencies, caData = null) {
    const currencySelect = document.getElementById('Currency');
    if (!currencySelect) return;

    // The value to set should come from caData first, then window.currentValues
    let valueToSet = null;
    if (caData && caData.currency) {
        valueToSet = caData.currency;
    } else if (window.currentValues && window.currentValues.currency) {
        valueToSet = window.currentValues.currency;
    }

    console.log('Attempting to set currency to:', valueToSet);

    // Clear existing options except the first (placeholder)
    currencySelect.innerHTML = '<option value="" disabled selected>Select Currency</option>';

    currencies.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = currency.code;
        currencySelect.appendChild(option);
    });

    // Set the value from caData or window.currentValues
    if (valueToSet) {
        currencySelect.value = valueToSet;
        console.log(`Set currency select to: ${valueToSet}`);
    } else {
        console.log('No currency value to set from caData or window.currentValues.');
    }
}

function showSubmitButton() {
    const submitButton = document.querySelector('button[onclick="submitRevision()"]');
    if (submitButton) {
        submitButton.style.display = 'inline-block';
    }
}

// Lock fields that must not be edited in revision mode
function lockFixedFields() {
    try {
        const cashAdvanceNo = document.getElementById('cashAdvanceNo');
        const employeeNIK = document.getElementById('employeeNIK');
        const employeeName = document.getElementById('employeeName');
        const department = document.getElementById('departmentId');

        if (cashAdvanceNo) {
            cashAdvanceNo.readOnly = true;
            cashAdvanceNo.disabled = true;
            cashAdvanceNo.classList.add('bg-gray-100');
        }
        if (employeeNIK) {
            employeeNIK.readOnly = true;
            employeeNIK.disabled = true;
            employeeNIK.classList.add('bg-gray-100');
        }
        if (employeeName) {
            employeeName.readOnly = true;
            employeeName.disabled = true;
            employeeName.classList.add('bg-gray-100');
        }
        if (department) {
            department.disabled = true;
            department.classList.add('bg-gray-100');
        }
    } catch (e) {
        console.warn('Failed to lock fixed fields:', e);
    }
}