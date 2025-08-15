// Global variable for file uploads
let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep
let settlementData = null;
let currentRequesterData = null; // Store current requester data globally

// Function to get available categories based on department and transaction type from API
async function getAvailableCategories(departmentId, transactionType) {
    if (!departmentId || !transactionType) return [];
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/categories?departmentId=${departmentId}&menu=Cash Advance Settlement&transactionType=${transactionType}`);
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
        const response = await fetch(`${BASE_URL}/api/expenses/account-names?category=${encodeURIComponent(category)}&departmentId=${departmentId}&menu=Cash Advance Settlement&transactionType=${transactionType}`);
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
        const response = await fetch(`${BASE_URL}/api/expenses/coa?category=${encodeURIComponent(category)}&accountName=${encodeURIComponent(accountName)}&departmentId=${departmentId}&menu=Cash Advance Settlement&transactionType=${transactionType}`);
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

// Function to setup category dropdown for a row
async function setupCategoryDropdown(row) {
    const categoryInput = row.querySelector('.category-input');
    const categoryDropdown = row.querySelector('.category-dropdown');
    const accountNameSelect = row.querySelector('.account-name');
    const coaInput = row.querySelector('.coa');
    
    if (!categoryInput || !categoryDropdown) return;
    
    // Initially disable category input and account name
    updateFieldsBasedOnPrerequisites(row);
    
    // Get current values
    const departmentSelect = document.getElementById("department");
    const transactionTypeSelect = document.getElementById("transactionType");
    const requesterSearchInput = document.getElementById("requesterSearch");
    
    categoryInput.addEventListener('input', async function() {
        const departmentId = departmentSelect?.value;
        const transactionType = transactionTypeSelect?.value;
        const requesterValue = requesterSearchInput?.value;

        console.log("Department ID:", departmentId);
        console.log("Transaction Type:", transactionType);
        console.log("Requester Value:", requesterValue);
        
        // Validate prerequisites
        if (!requesterValue || !departmentId || !transactionType) {
            showValidationMessage(categoryInput, 'Please select requester and transaction type first');
            categoryDropdown.classList.add('hidden');
            return;
        }
        
        const searchText = this.value.toLowerCase();
        const availableCategories = await getAvailableCategories(departmentId, transactionType);
        
        // Clear dropdown
        categoryDropdown.innerHTML = '';
        
        // Filter categories based on search text
        const filteredCategories = availableCategories.filter(category => 
            category && category.toLowerCase().includes(searchText)
        );
        
        // Add historical categories to filtered list if they match search
        const historicalCategories = categoryInput.historicalCategories || [];
        const filteredHistoricalCategories = historicalCategories.filter(category => 
            category && category.toLowerCase().includes(searchText) && 
            !filteredCategories.includes(category)
        );
        
        const allFilteredCategories = [...filteredCategories, ...filteredHistoricalCategories];
        
        if (allFilteredCategories.length > 0) {
            // Add regular categories
            filteredCategories.forEach(category => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.textContent = category;
                option.onclick = function() {
                    categoryInput.value = category;
                    categoryDropdown.classList.add('hidden');
                    
                    // Clear account name and COA when category changes
                    const accountNameSelect = row.querySelector('.account-name');
                    if (accountNameSelect) accountNameSelect.value = '';
                    if (coaInput) coaInput.value = '';
                    
                    // Update account name dropdown (this will repopulate with new category's account names)
                    updateAccountNameDropdown(row, category, departmentId, transactionType);
                    
                    // Enable account name dropdown now that category is selected
                    enableAccountNameField(row);
                };
                categoryDropdown.appendChild(option);
            });
            
            // Add historical categories with visual distinction
            filteredHistoricalCategories.forEach(category => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerHTML = `<span style="font-style: italic; color: #6b7280;">${category} (Historical)</span>`;
                option.onclick = function() {
                    categoryInput.value = category;
                    categoryDropdown.classList.add('hidden');
                    
                    // Clear account name and COA when category changes
                    const accountNameSelect = row.querySelector('.account-name');
                    if (accountNameSelect) accountNameSelect.value = '';
                    if (coaInput) coaInput.value = '';
                    
                    // Update account name dropdown for historical category (this will repopulate with new category's account names)
                    updateAccountNameDropdown(row, category, departmentId, transactionType);
                    
                    // Enable account name dropdown now that category is selected
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
        const departmentId = departmentSelect?.value;
        const transactionType = transactionTypeSelect?.value;
        const requesterValue = requesterSearchInput?.value;

        console.log("Department ID:", departmentId);
        console.log("Transaction Type:", transactionType);
        console.log("Requester Value:", requesterValue);
        
        // Validate prerequisites
        if (!requesterValue || !departmentId || !transactionType) {
            showValidationMessage(this, 'Please select requester and transaction type first');
            this.blur(); // Remove focus
            return;
        }
        
        const availableCategories = await getAvailableCategories(departmentId, transactionType);
        
        // Clear dropdown
        categoryDropdown.innerHTML = '';
        
        // Combine available categories with historical ones
        const historicalCategories = categoryInput.historicalCategories || [];
        const allCategories = [...availableCategories];
        
        // Add historical categories that aren't already in available categories
        historicalCategories.forEach(histCat => {
            if (!availableCategories.includes(histCat)) {
                allCategories.push(histCat);
            }
        });
        
        if (allCategories.length > 0) {
            // Add regular categories
            availableCategories.forEach(category => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.textContent = category;
                option.onclick = function() {
                    categoryInput.value = category;
                    categoryDropdown.classList.add('hidden');
                    
                    // Clear account name and COA when category changes
                    const accountNameSelect = row.querySelector('.account-name');
                    if (accountNameSelect) accountNameSelect.value = '';
                    if (coaInput) coaInput.value = '';
                    
                    // Update account name dropdown (this will repopulate with new category's account names)
                    updateAccountNameDropdown(row, category, departmentId, transactionType);
                    
                    // Enable account name dropdown now that category is selected
                    enableAccountNameField(row);
                };
                categoryDropdown.appendChild(option);
            });
            
            // Add historical categories with visual distinction
            historicalCategories.forEach(category => {
                if (!availableCategories.includes(category)) {
                    const option = document.createElement('div');
                    option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                    option.innerHTML = `<span style="font-style: italic; color: #6b7280;">${category} (Historical)</span>`;
                    option.onclick = function() {
                        categoryInput.value = category;
                        categoryDropdown.classList.add('hidden');
                        
                        // Clear account name and COA when category changes
                        const accountNameSelect = row.querySelector('.account-name');
                        if (accountNameSelect) accountNameSelect.value = '';
                        if (coaInput) coaInput.value = '';
                        
                        // Update account name dropdown for historical category (this will repopulate with new category's account names)
                        updateAccountNameDropdown(row, category, departmentId, transactionType);
                        
                        // Enable account name dropdown now that category is selected
                        enableAccountNameField(row);
                    };
                    categoryDropdown.appendChild(option);
                }
            });
            
            categoryDropdown.classList.remove('hidden');
        }
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!categoryInput.contains(event.target) && !categoryDropdown.contains(event.target)) {
            categoryDropdown.classList.add('hidden');
        }
    });
}

// Function to show validation messages
function showValidationMessage(element, message) {
    // Remove existing validation message
    const existingMessage = element.parentElement.querySelector('.validation-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create and show new validation message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'validation-message text-red-500 text-sm mt-1';
    messageDiv.textContent = message;
    element.parentElement.appendChild(messageDiv);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 3000);
}

// Function to update field states based on prerequisites
function updateFieldsBasedOnPrerequisites(row) {
    const categoryInput = row.querySelector('.category-input');
    const accountNameSelect = row.querySelector('.account-name');
    
    const departmentSelect = document.getElementById("department");
    const transactionTypeSelect = document.getElementById("transactionType");
    const requesterSearchInput = document.getElementById("requesterSearch");
    
    const departmentId = departmentSelect?.value;
    const transactionType = transactionTypeSelect?.value;
    const requesterValue = requesterSearchInput?.value;
    const categoryValue = categoryInput?.value;
    
    // Check if settlement is editable (Draft status only)
    const isEditable = settlementData ? (settlementData.status === 'Draft') : true;
    
    if (!isEditable) {
        // If settlement is not editable, disable all fields
        if (categoryInput) {
            categoryInput.disabled = true;
            categoryInput.classList.add('bg-gray-100');
        }
        if (accountNameSelect) {
            accountNameSelect.disabled = true;
            accountNameSelect.classList.add('bg-gray-100');
        }
        return;
    }
    
    if (!requesterValue || !departmentId || !transactionType) {
        // Disable category input
        if (categoryInput) {
            console.log("Disabling category input");
            categoryInput.disabled = true;
            categoryInput.placeholder = 'Select requester and transaction type first';
            categoryInput.classList.add('bg-gray-100');
        }
        // Disable account name
        if (accountNameSelect) {
            accountNameSelect.disabled = true;
            accountNameSelect.classList.add('bg-gray-100');
        }
    } else {
        // Enable category input
        if (categoryInput) {
            categoryInput.disabled = false;
            categoryInput.placeholder = 'Search category...';
            categoryInput.classList.remove('bg-gray-100');
        }
        
        // Check if category is selected to enable account name
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

// Function to enable account name field
function enableAccountNameField(row) {
    const accountNameSelect = row.querySelector('.account-name');
    if (accountNameSelect) {
        // Check if settlement is editable (Draft status only)
        const isEditable = settlementData ? (settlementData.status === 'Draft') : true;
        
        if (isEditable) {
            accountNameSelect.disabled = false;
            accountNameSelect.classList.remove('bg-gray-100');
        }
    }
}

// Function to ensure category exists in available options (for historical data)
async function ensureCategoryAvailable(categoryInput, existingCategory, departmentId, transactionType) {
    if (!existingCategory || !categoryInput) return;
    
    // Get available categories
    const availableCategories = await getAvailableCategories(departmentId, transactionType);
    
    // Check if existing category exists in available options
    const categoryExists = availableCategories.some(cat => cat && existingCategory && cat.toLowerCase() === existingCategory.toLowerCase());
    
    if (!categoryExists) {
        // Add the historical category to a global list for this input
        if (!categoryInput.historicalCategories) {
            categoryInput.historicalCategories = [];
        }
        if (!categoryInput.historicalCategories.includes(existingCategory)) {
            categoryInput.historicalCategories.push(existingCategory);
            console.log(`Added historical category: ${existingCategory}`);
        }
    }
}

// Function to update account name dropdown based on selected category
async function updateAccountNameDropdown(row, category, departmentId, transactionType, existingAccountName = null, existingCoa = null) {
    const accountNameSelect = row.querySelector('.account-name');
    const coaInput = row.querySelector('.coa');
    
    if (!accountNameSelect) return;
    
    // Validate prerequisites
    if (!category) {
        showValidationMessage(accountNameSelect, 'Please select a category first');
        return;
    }
    
    // Store the current selected value before clearing
    const currentSelectedValue = accountNameSelect.value || existingAccountName;
    
    // Clear existing options
    accountNameSelect.innerHTML = '<option value="">Select Account Name</option>';
    
    // Get available account names for the selected category
    const accountNames = await getAvailableAccountNames(category, departmentId, transactionType);
    
    // Check if existing account name exists in the fetched options
    let existingAccountNameFound = false;
    
    accountNames.forEach(item => {
        const option = document.createElement('option');
        option.value = item.accountName;
        option.textContent = item.accountName;
        option.dataset.coa = item.coa;
        option.dataset.remarks = item.remarks || '';
        accountNameSelect.appendChild(option);
        
        // Check if this matches the existing account name
        if (currentSelectedValue && item.accountName === currentSelectedValue) {
            existingAccountNameFound = true;
        }
    });
    
    // If existing account name doesn't exist in current options, add it
    if (currentSelectedValue && !existingAccountNameFound) {
        const option = document.createElement('option');
        option.value = currentSelectedValue;
        option.textContent = `${currentSelectedValue} (Historical)`;
        option.dataset.coa = existingCoa || '';
        option.dataset.remarks = 'Historical data - no longer in master data';
        option.style.fontStyle = 'italic';
        option.style.color = '#6b7280'; // Gray color to indicate historical
        accountNameSelect.appendChild(option);
        console.log(`Added historical account name: ${currentSelectedValue}`);
    }
    
    // Remove existing event listeners by cloning the element
    const newAccountNameSelect = accountNameSelect.cloneNode(true);
    accountNameSelect.parentNode.replaceChild(newAccountNameSelect, accountNameSelect);
    
    // Set the selected value
    if (currentSelectedValue) {
        newAccountNameSelect.value = currentSelectedValue;
        // Also set the COA if we have it
        if (existingCoa && coaInput) {
            coaInput.value = existingCoa;
        }
    }
    
    // Add event listener for account name selection with proper variable capture
    newAccountNameSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const selectedAccountName = this.value;
        
        // Re-query the COA input to make sure we have the right element
        const currentCoaInput = row.querySelector('.coa');
        
        console.log('Account name changed to:', selectedAccountName);
        console.log('Selected option:', selectedOption);
        console.log('COA from dataset:', selectedOption ? selectedOption.dataset.coa : 'no option');
        console.log('COA input found:', currentCoaInput);
        
        if (selectedAccountName && selectedOption && currentCoaInput) {
            // Get COA from the selected option's dataset (already fetched with account names)
            const coa = selectedOption.dataset.coa || '';
            currentCoaInput.value = coa;
            console.log('COA set to:', coa, 'Input value now:', currentCoaInput.value);
        } else {
            if (currentCoaInput) currentCoaInput.value = '';
            console.log('Clearing COA input or missing data');
        }
    });
    
    // Enable the account name field (update the row to use the new select element)
    enableAccountNameField(row);
}

// Function to refresh all category dropdowns when department or transaction type changes
async function refreshAllCategoryDropdowns() {
    const tableRows = document.querySelectorAll('#tableBody tr');
    for (const row of tableRows) {
        const categoryInput = row.querySelector('.category-input');
        const accountNameSelect = row.querySelector('.account-name');
        const coaInput = row.querySelector('.coa');
        
        // Don't clear existing values if they exist, just update states
        if (categoryInput && !categoryInput.value) categoryInput.value = '';
        if (accountNameSelect && !accountNameSelect.value) accountNameSelect.innerHTML = '<option value="">Select Account Name</option>';
        if (coaInput && !coaInput.value) coaInput.value = '';
        
        // Update field states based on prerequisites
        updateFieldsBasedOnPrerequisites(row);
        
        // Re-setup dropdown
        await setupCategoryDropdown(row);
    }
}

// Helper function to get logged-in user ID
function getUserId() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.id : null;
}



// Function to fetch all dropdown options
function fetchDropdownOptions(approvalData = null) {
    fetchDepartments();
    fetchUsers(approvalData);
    fetchTransactionType();
    fetchBusinessPartners();
    
    // Initialize superior employee dropdowns
    const transactionType = document.getElementById("TransactionType")?.value || 'NRM';
    populateAllSuperiorEmployeeDropdowns(transactionType);
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

    // Populate RequesterId dropdown with search functionality (like addCash.js)
    const requesterSelect = document.getElementById("RequesterId");
    if (requesterSelect) {
        // Clear existing options first
        requesterSelect.innerHTML = '<option value="">Select a requester</option>';
        
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
                r.fullName && r.fullName.toLowerCase().includes(filter)
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
        { id: 'Approval.PreparedById', searchId: 'Approval.PreparedByIdSearch', nameKey: 'preparedName', idKey: 'preparedById' },
        { id: 'Approval.CheckedById', searchId: 'Approval.CheckedByIdSearch', nameKey: 'checkedName', idKey: 'checkedById' },
        { id: 'Approval.ApprovedById', searchId: 'Approval.ApprovedByIdSearch', nameKey: 'approvedName', idKey: 'approvedById' },
        { id: 'Approval.AcknowledgedById', searchId: 'Approval.AcknowledgedByIdSearch', nameKey: 'acknowledgedName', idKey: 'acknowledgedById' },
        { id: 'Approval.ReceivedById', searchId: 'Approval.ReceivedByIdSearch', nameKey: 'receivedName', idKey: 'receivedById' }
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
                option.textContent = user.fullName;
                select.appendChild(option);
            });
            
            // Set the value from approval data if available and update search input
            if (approvalData) {
                // Set the ID value
                if (approvalData[selectInfo.idKey]) {
                    select.value = approvalData[selectInfo.idKey];
                }
                
                // Set the name value directly from API response
                if (approvalData[selectInfo.nameKey]) {
                    searchInput.value = approvalData[selectInfo.nameKey];
                }
                
                // Auto-select and disable for Prepared by if it matches logged in user
                if(selectInfo.id === "Approval.PreparedById" && select.value == getUserId()){
                    searchInput.disabled = true;
                    searchInput.classList.add('bg-gray-100');
                }
            }
            
            // Always disable and auto-select Approval.PreparedById to logged-in user
            if(selectInfo.id === "Approval.PreparedById"){
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

// Function to filter users for approval dropdowns (like addSettle.js)
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

// Function to fetch transaction types from API
function fetchTransactionType() {
    fetch(`${BASE_URL}/api/transactiontypes/filter?category=Settlement`)
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

    // Remove any existing event listeners to prevent duplicates
    const newTransactionTypeSelect = transactionTypeSelect.cloneNode(true);
    transactionTypeSelect.parentNode.replaceChild(newTransactionTypeSelect, transactionTypeSelect);
    
    // Add event listener for transaction type change
    newTransactionTypeSelect.addEventListener('change', function() {
        console.log("Transaction type changed to:", this.value);
        
        // Refresh all category dropdowns when transaction type changes
        refreshAllCategoryDropdowns();
    });
    
    // If we have a current value and it wasn't matched by text, try to select by value
    if (currentValue && newTransactionTypeSelect.value !== currentValue) {
        newTransactionTypeSelect.value = currentValue;
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
async function populateFormWithData(data) {
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
    
    // Handle PayTo business partner
    if (data.payToCode && data.payToName) {
        // Set the search input and hidden field for PayTo
        const paidToSearchInput = document.getElementById('paidToSearch');
        const paidToHiddenInput = document.getElementById('paidTo');
        
        if (paidToSearchInput && paidToHiddenInput) {
            paidToSearchInput.value = data.payToName;
            paidToHiddenInput.value = data.payToCode;
        }
    }
    
    // Set transaction type
    if (data.transactionType) {
        const transactionTypeSelect = document.getElementById('transactionType');
        if (transactionTypeSelect) {
            transactionTypeSelect.value = data.transactionType;
        }
    }
    
    // Set department using departmentId from API response
    if (data.departmentId) {
        document.getElementById('department').value = data.departmentId;
    }
    
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
    
    // Handle rejection remarks if status is Rejected
    if (data.status === 'Rejected') {
        // Show the rejection remarks section
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        const rejectionTextarea = document.getElementById('rejectionRemarks');
        
        if (rejectionSection && rejectionTextarea) {
            // Check for various possible rejection remarks fields
            let rejectionRemarks = '';
            let rejectedByName = '';
            
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
            
            // Get rejected by name for settlement
            if (data.rejectedByName) {
                rejectedByName = data.rejectedByName;
            }
            
            if (rejectionRemarks && rejectionRemarks.trim() !== '') {
                rejectionSection.style.display = 'block';
                rejectionTextarea.value = rejectionRemarks;
                
                // Update the rejection info display if it exists
                const rejectionInfo = document.getElementById('rejectionInfo');
                if (rejectionInfo && rejectedByName) {
                    rejectionInfo.innerHTML = `
                        <div class="text-sm text-gray-600 mb-2">
                            <span class="font-medium">Rejected by:</span> ${rejectedByName}
                            ${data.rejectedByNIK ? `(${data.rejectedByNIK})` : ''}
                            ${data.rejectedDate ? `on ${new Date(data.rejectedDate).toLocaleDateString()}` : ''}
                        </div>
                    `;
                }
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

    // Handle revision remarks display
    displayRevisionRemarks(data);

    // Populate settlement items table
    populateSettlementItemsTable(data.settlementItems || []);

    // Check if status is not Draft and make fields read-only
    if (data.status && data.status.toLowerCase() !== 'draft') {
        makeAllFieldsReadOnlyForNonDraft();
    }
    
    // Hide Update and Submit buttons when status is "Revision"
    if (data.status && data.status.toLowerCase() === 'revision') {
        hideUpdateSubmitButtons();
        
        // Also hide delete button for revision status
        const deleteDocumentButton = document.querySelector('button[onclick="confirmDelete()"]');
        if (deleteDocumentButton) {
            deleteDocumentButton.style.display = 'none';
        }
    }

    // Check if editable after populating data
    const isEditable = data.status === 'Draft';
    toggleEditableFields(isEditable);

    // Fetch dropdown options with approval data
    fetchDropdownOptions(data);

    // Populate superior employees with data (like detailCash.js)
    await populateSuperiorEmployeesWithData(data);

    // Store and display attachments
    if (data.attachments) {
        existingAttachments = data.attachments;
        attachmentsToKeep = data.attachments.map(att => att.id); // Initially keep all existing attachments
    }
    displayAttachments(data.attachments || []);
}

// Function to display revision remarks from API
function displayRevisionRemarks(data) {
    const revisedRemarksSection = document.getElementById('revisedRemarksSection');
    const revisedCountElement = document.getElementById('revisedCount');
    
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

// Populate settlement items table
async function populateSettlementItemsTable(settlementItems) {
    const tableBody = document.getElementById('tableBody');
    
    // Clear existing rows
    tableBody.innerHTML = '';

    if (settlementItems.length === 0) {
        // Add empty row if no items
        await addEmptyRow();
        return;
    }

    // Add rows for each settlement item
    for (const item of settlementItems) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td class="p-2 border relative">
                <input type="text" class="category-input w-full" value="${item.category || ''}" placeholder="Select requester and transaction type first" disabled />
                <div class="category-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-40 overflow-y-auto"></div>
            </td>
            <td class="p-2 border">
                <select class="account-name w-full bg-gray-100" disabled>
                    <option value="">Select Account Name</option>
                </select>
            </td>
            <td class="p-2 border">
                <input type="text" class="coa w-full" value="${item.glAccount || ''}" readonly style="background-color: #f3f4f6;" />
            </td>
                    <td class="p-2 border">
            <input type="text" class="description w-full" value="${item.description || ''}" maxlength="200" ${settlementData && settlementData.status !== 'Draft' ? 'readonly' : ''} ${settlementData && settlementData.status !== 'Draft' ? 'style="background-color: #f3f4f6;"' : ''} />
        </td>
        <td class="p-2 border">
            <input type="number" class="total w-full" value="${item.amount ? parseFloat(item.amount).toFixed(2) : '0.00'}" maxlength="10" required step="0.01" oninput="calculateTotalAmount()" ${settlementData && settlementData.status !== 'Draft' ? 'readonly' : ''} ${settlementData && settlementData.status !== 'Draft' ? 'style="background-color: #f3f4f6;"' : ''} />
        </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
        `;
        tableBody.appendChild(newRow);
        
        // Setup category dropdown for the new row
        await setupCategoryDropdown(newRow);
        
        // Setup amount formatting for the populated row
        const amountInput = newRow.querySelector('.total');
        if (amountInput) {
            amountInput.addEventListener('blur', function() {
                formatNumberWithDecimals(this);
            });
            amountInput.addEventListener('input', function() {
                formatNumberAsYouType(this);
            });
        }
        
        // Populate existing data regardless of whether category is null or not
        const departmentSelect = document.getElementById("department");
        const transactionTypeSelect = document.getElementById("transactionType");
        const categoryInput = newRow.querySelector('.category-input');
        const accountNameSelect = newRow.querySelector('.account-name');
        const coaInput = newRow.querySelector('.coa');
        
        if (departmentSelect?.value && transactionTypeSelect?.value) {
            // Handle category - set value or leave empty if null
            if (item.category) {
                categoryInput.value = item.category;
                // Ensure the category is available (add as historical if needed)
                await ensureCategoryAvailable(categoryInput, item.category, departmentSelect.value, transactionTypeSelect.value);
                
                // Update account name dropdown with existing data
                await updateAccountNameDropdown(newRow, item.category, departmentSelect.value, transactionTypeSelect.value, item.accountName, item.glAccount);
            } else {
                // Category is null, but we still have account name and COA
                categoryInput.value = '';
                
                // Manually populate account name and COA since we can't use the normal dropdown flow
                if (item.accountName) {
                    // Create option for existing account name
                    const option = document.createElement('option');
                    option.value = item.accountName;
                    option.textContent = `${item.accountName} (Historical)`;
                    option.dataset.coa = item.glAccount || '';
                    option.style.fontStyle = 'italic';
                    option.style.color = '#6b7280';
                    option.selected = true;
                    
                    accountNameSelect.innerHTML = '<option value="">Select Account Name</option>';
                    accountNameSelect.appendChild(option);
                    accountNameSelect.value = item.accountName;
                    
                    // Add change event listener for historical account name
                    accountNameSelect.addEventListener('change', function() {
                        const selectedOption = this.options[this.selectedIndex];
                        if (selectedOption && selectedOption.dataset.coa && coaInput) {
                            coaInput.value = selectedOption.dataset.coa;
                        }
                    });
                }
                
                // Set COA value
                if (item.glAccount && coaInput) {
                    coaInput.value = item.glAccount;
                }
                
                // Enable account name field
                enableAccountNameField(newRow);
            }
        }
        
        // Update field states based on prerequisites and settlement status
        updateFieldsBasedOnPrerequisites(newRow);
    }
    
    // Calculate and display total amount after populating all items
    calculateTotalAmount();
}



// Add empty row to table
async function addEmptyRow() {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    
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
            <input type="text" class="description w-full" maxlength="200" />
        </td>
        <td class="p-2 border">
            <input type="number" class="total w-full" maxlength="10" required step="0.01"/>
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
    
    // Setup category dropdown for the new row
    await setupCategoryDropdown(newRow);
    
    // Update field states based on prerequisites and settlement status
    updateFieldsBasedOnPrerequisites(newRow);
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
            <input type="text" class="description w-full" maxlength="200" ${settlementData && settlementData.status !== 'Draft' ? 'readonly' : ''} ${settlementData && settlementData.status !== 'Draft' ? 'style="background-color: #f3f4f6;"' : ''} />
        </td>
        <td class="p-2 border">
            <input type="number" class="total w-full" maxlength="10" required step="0.01" oninput="calculateTotalAmount()" ${settlementData && settlementData.status !== 'Draft' ? 'readonly' : ''} ${settlementData && settlementData.status !== 'Draft' ? 'style="background-color: #f3f4f6;"' : ''} />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;

    tableBody.appendChild(newRow);
    
    // Setup category dropdown for the new row
    await setupCategoryDropdown(newRow);
    
    // Setup amount formatting for the new row
    const amountInput = newRow.querySelector('.total');
    if (amountInput) {
        amountInput.value = '0.00';
        amountInput.addEventListener('blur', function() {
            formatNumberWithDecimals(this);
        });
        amountInput.addEventListener('input', function() {
            formatNumberAsYouType(this);
        });
    }
    
    // Update field states based on prerequisites and settlement status
    updateFieldsBasedOnPrerequisites(newRow);
    
    // Recalculate total after adding row
    calculateTotalAmount();
}

function deleteRow(button) {
    button.closest("tr").remove();
    calculateTotalAmount(); // Recalculate total after removing a row
}

// Function to calculate total amount from all rows
function calculateTotalAmount() {
    const totalInputs = document.querySelectorAll('.total');
    let sum = 0;
    
    totalInputs.forEach(input => {
        // Only add to sum if the input has a valid numeric value
        const value = input.value.trim();
        if (value && !isNaN(parseFloat(value))) {
            sum += parseFloat(value);
        }
    });
    
    // Format the sum with 2 decimal places
    const formattedSum = sum.toFixed(2);
    
    // Update the total amount display if exists
    const totalAmountDisplay = document.getElementById('totalAmountDisplay');
    if (totalAmountDisplay) {
        totalAmountDisplay.textContent = formattedSum;
    }
}

// Simple number formatting with .00 decimal places
function formatNumberWithDecimals(input) {
    // Get the numeric value
    let value = input.value.replace(/[^\d.]/g, '');
    
    // If empty, set to 0.00
    if (!value) {
        input.value = '0.00';
        return;
    }
    
    // Parse as float
    let num = parseFloat(value);
    if (isNaN(num)) {
        input.value = '0.00';
        return;
    }
    
    // Format with 2 decimal places
    input.value = num.toFixed(2);
    
    // Calculate total
    calculateTotalAmount();
}

// Real-time formatting as user types
function formatNumberAsYouType(input) {
    // Get the numeric value
    let value = input.value.replace(/[^\d.]/g, '');
    
    // If empty, set to 0.00
    if (!value) {
        input.value = '0.00';
        return;
    }
    
    // Parse as float
    let num = parseFloat(value);
    if (isNaN(num)) {
        input.value = '0.00';
        return;
    }
    
    // Check if user has typed a decimal point
    const hasDecimal = input.value.includes('.');
    
    if (hasDecimal) {
        // User is typing decimals, preserve their input
        // Just ensure it's a valid number
        input.value = num.toString();
    } else {
        // User typed a whole number, add .00
        input.value = num.toFixed(2);
    }
    
    // Calculate total
    calculateTotalAmount();
}

function goToMenuSettle() {
    window.location.href = "../pages/menuSettle.html";
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

// Add function to fetch and populate cash advance dropdown (same as addSettle.js)
async function loadCashAdvanceOptions() {
    const dropdown = document.getElementById('cashAdvanceReferenceId');
    
    try {
        // Show loading state
        dropdown.innerHTML = '<option value="" disabled selected>Loading...</option>';
        const userid = getUserId();
        
        // Get settlement ID to include Cash Advances already associated with this settlement
        const settlementId = getSettlementIdFromUrl();
        let apiUrl = `${BASE_URL}/api/cash-advance/approved/prepared-by/${userid}`;
        
        // Add settlement ID as query parameter if available (for editing existing settlement)
        if (settlementId) {
            apiUrl += `?settlementId=${settlementId}`;
        }
        
        const response = await fetch(apiUrl);
        
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
                option.textContent = cashAdvance.cashAdvanceNo + ' - ' + cashAdvance.totalAmount.toFixed(2);
                dropdown.appendChild(option);           
            });
        } else {
            dropdown.innerHTML = '<option value="" disabled selected>No data available</option>';
        }
        
    } catch (error) {
        console.error('Error loading cash advance options:', error);
        dropdown.innerHTML = '<option value="" disabled selected>Error loading data</option>';
        
        // Show error alert
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to load cash advance options. Please refresh the page and try again.',
            confirmButtonColor: '#d33'
        });
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
    const actioningText = isSubmit ? 'Submitting' : 'Updating';
    
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
            
            // Basic settlement fields - matching addSettle.js format
            const settlementRefNo = document.getElementById("settlementRefNo").value;
            const purpose = document.getElementById("purpose").value;
            const transactionType = document.getElementById("transactionType").value;
            console.log("Transaction type value:", transactionType);
            const submissionDate = document.getElementById("submissionDate").value;
            const cashAdvanceReferenceId = document.getElementById("cashAdvanceReferenceId").value;
            const remarks = document.getElementById("remarks").value;

            // Basic validation (same as addSettle.js)
            if (!kansaiEmployeeId) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Validation Error!',
                    text: 'Employee NIK is required',
                    confirmButtonColor: '#3085d6'
                });
                return;
            }
            
            if (!cashAdvanceReferenceId || cashAdvanceReferenceId === '') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Validation Error!',
                    text: 'Please select a Cash Advance Document',
                    confirmButtonColor: '#3085d6'
                });
                return;
            }

            // Show loading
            Swal.fire({
                title: `${actioningText}...`,
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
            
            // Add basic fields to FormData (same as addSettle.js)
            formData.append('KansaiEmployeeId', kansaiEmployeeId);
            formData.append('CashAdvanceReferenceId', cashAdvanceReferenceId);
            
            if (settlementRefNo) formData.append('SettlementRefNo', settlementRefNo);
            if (purpose) formData.append('Purpose', purpose);
            if (transactionType) formData.append('TransactionType', transactionType);
            if (remarks) formData.append('Remarks', remarks);
            
            // Add Business Partner ID (Paid To)
            const paidToId = document.getElementById("paidTo").value;
            if (paidToId) {
                formData.append('PayToCode', paidToId);
            }
            
            // Handle submission date (same as addSettle.js postingDate handling)
            if (submissionDate) {
                formData.append('SubmissionDate', submissionDate);
            }
            
            // Add approval workflow users (same as addSettle.js)
            const preparedById = document.getElementById("Approval.PreparedById")?.value || '';
            const checkedById = document.getElementById("Approval.CheckedById")?.value || '';
            const acknowledgedById = document.getElementById("Approval.AcknowledgedById")?.value || '';
            const approvedById = document.getElementById("Approval.ApprovedById")?.value || '';
            const receivedById = document.getElementById("Approval.ReceivedById")?.value || '';
            
            if (preparedById) formData.append('PreparedById', preparedById);
            if (checkedById) formData.append('CheckedById', checkedById);
            if (acknowledgedById) formData.append('AcknowledgedById', acknowledgedById);
            if (approvedById) formData.append('ApprovedById', approvedById);
            if (receivedById) formData.append('ReceivedById', receivedById);
            
            // Handle table data with new structure (same as addSettle.js)
            const tableRows = document.getElementById("tableBody").querySelectorAll("tr");
            let detailIndex = 0;
            
            // Debug: Check prerequisites
            const departmentValue = document.getElementById("department").value;
            console.log("Prerequisites for category selection:", {
                department: departmentValue,
                transactionType: transactionType,
                requesterValue: document.getElementById("requesterSearch").value
            });
            
            tableRows.forEach((row, index) => {
                const category = row.querySelector('.category-input').value;
                const accountName = row.querySelector('.account-name').value;
                const glAccount = row.querySelector('.coa').value;
                const description = row.querySelector('.description').value;
                const amount = row.querySelector('.total').value;
                
                if (description && amount) {
                    // Debug: Log the values being sent
                    console.log(`Row ${detailIndex + 1} data:`, {
                        category: category,
                        accountName: accountName,
                        glAccount: glAccount,
                        description: description,
                        amount: amount
                    });
                    
                    // Add settlement items using proper model binding format
                    formData.append(`SettlementItems[${detailIndex}][Category]`, category || '');
                    formData.append(`SettlementItems[${detailIndex}][AccountName]`, accountName || '');
                    formData.append(`SettlementItems[${detailIndex}][GLAccount]`, glAccount || '');
                    formData.append(`SettlementItems[${detailIndex}][Description]`, description);
                    formData.append(`SettlementItems[${detailIndex}][Amount]`, amount);
                    detailIndex++;
                }
            });
            
            // Validate that we have at least one item
            if (detailIndex === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Validation Error!',
                    text: 'Please add at least one item with Description and Amount',
                    confirmButtonColor: '#3085d6'
                });
                return;
            }
            
            // Validate categories and account names for submit
            if (isSubmit) {
                let invalidRows = [];
                tableRows.forEach((row, index) => {
                    const category = row.querySelector('.category-input').value;
                    const accountName = row.querySelector('.account-name').value;
                    const description = row.querySelector('.description').value;
                    const amount = row.querySelector('.total').value;
                    
                    if (description && amount && (!category || !accountName)) {
                        invalidRows.push(index + 1);
                    }
                });
                
                if (invalidRows.length > 0) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Validation Error!',
                        text: `Please complete category and account name selection for row(s): ${invalidRows.join(', ')}`,
                        confirmButtonColor: '#3085d6'
                    });
                    return;
                }
            }

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

            // Set submit flag (same as addSettle.js)
            formData.append('IsSubmit', isSubmit.toString());
            
            // Debug: Log all FormData entries
            console.log('=== FormData being sent ===');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }
            
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
                        fetchSettlementData(settlementId).then(async data => {
                            if (data) {
                                await populateFormWithData(data);
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
        'paidToSearch', // PayTo business partner search input
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
    
    // Handle PayTo dropdown
    const paidToDropdown = document.getElementById('paidToDropdown');
    if (paidToDropdown) {
        if (!isEditable) {
            paidToDropdown.style.display = 'none';
        }
    }
    
    // Handle table inputs
    const tableInputs = document.querySelectorAll('#tableBody input, #tableBody select');
    tableInputs.forEach(input => {
        // Special handling for COA field which should always be readonly
        if (input.classList.contains('coa')) {
            input.readOnly = true;
            return;
        }
        
        if (input.tagName === 'SELECT' || input.type === 'checkbox' || input.type === 'radio') {
            input.disabled = !isEditable;
        } else {
            input.readOnly = !isEditable;
        }
        
        if (!isEditable) {
            input.classList.add('bg-gray-100');
            input.classList.remove('bg-white');
        } else {
            // Don't change COA field styling as it should always be gray
            if (!input.classList.contains('coa')) {
                input.classList.remove('bg-gray-100');
                input.classList.add('bg-white');
            }
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
    
    // Handle action buttons - hide based on Draft status only
    const deleteButton = document.querySelector('button[onclick="confirmDelete()"]');
    const updateButton = document.querySelector('button[onclick="updateSettle(false)"]');
    const submitButton = document.querySelector('button[onclick="updateSettle(true)"]');
    
    [deleteButton, updateButton, submitButton].forEach(button => {
        if (button) {
            if (!isEditable) {
                button.style.display = 'none';
            } else {
                button.style.display = 'block';
                button.disabled = false;
                button.classList.remove('opacity-50', 'cursor-not-allowed');
                button.title = '';
            }
        }
    });
    
    // Handle approval fields
    const approvalSelects = [
        { id: 'Approval.PreparedById', searchId: 'Approval.PreparedByIdSearch', nameKey: 'preparedName', idKey: 'preparedById' },
        { id: 'Approval.CheckedById', searchId: 'Approval.CheckedByIdSearch', nameKey: 'checkedName', idKey: 'checkedById' },
        { id: 'Approval.ApprovedById', searchId: 'Approval.ApprovedByIdSearch', nameKey: 'approvedName', idKey: 'approvedById' },
        { id: 'Approval.AcknowledgedById', searchId: 'Approval.AcknowledgedByIdSearch', nameKey: 'acknowledgedName', idKey: 'acknowledgedById' },
        { id: 'Approval.ReceivedById', searchId: 'Approval.ReceivedByIdSearch', nameKey: 'receivedName', idKey: 'receivedById' }
    ];
    
    approvalSelects.forEach(selectInfo => {
        const field = document.getElementById(selectInfo.id);
        const searchInput = document.getElementById(selectInfo.searchId);
        if (field && searchInput) {
            if (selectInfo.id === 'Approval.PreparedById') {
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

// Function to hide Update and Submit buttons when status is Revision
function hideUpdateSubmitButtons() {
    console.log('Status is Revision - hiding Update and Submit buttons');
    
    // Find and hide the buttons by their onclick attributes
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        const onclick = button.getAttribute('onclick');
        if (onclick && (onclick.includes('updateSettle(false)') || onclick.includes('updateSettle(true)'))) {
            button.style.display = 'none';
        }
    });
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
            'Approval.PreparedByIdDropdown', 
            'Approval.CheckedByIdDropdown', 
            'Approval.ApprovedByIdDropdown', 
            'Approval.AcknowledgedByIdDropdown',
            'Approval.ReceivedByIdDropdown'
        ];
        
        const searchInputs = [
            'Approval.PreparedByIdSearch', 
            'Approval.CheckedByIdSearch', 
            'Approval.ApprovedByIdSearch', 
            'Approval.AcknowledgedByIdSearch',
            'Approval.ReceivedByIdSearch'
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
    
    // Add event listener for department change
    const departmentSelect = document.getElementById("department");
    if (departmentSelect) {
        departmentSelect.addEventListener('change', function() {
            refreshAllCategoryDropdowns();
        });
    }
    
    // Get settlement ID from URL
    const settlementId = getSettlementIdFromUrl();
    
    if (!settlementId) {
        alert('Settlement ID not found in URL');
        return;
    }

    // Fetch and populate settlement data
    const data = await fetchSettlementData(settlementId);
    if (data) {
        await populateFormWithData(data);
    }
    
    // Setup category dropdowns for any existing rows after a small delay to ensure DOM is ready
    setTimeout(async () => {
        const tableRows = document.querySelectorAll('#tableBody tr');
        for (const row of tableRows) {
            await setupCategoryDropdown(row);
        }
    }, 500);
});

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
    // Store business partners globally for search functionality
    window.businessPartners = businessPartners.filter(bp => bp.active).map(bp => ({
        id: bp.id,
        code: bp.code,
        name: bp.name
    }));

    // Setup search functionality for paid to
    const paidToSearchInput = document.getElementById('paidToSearch');
    const paidToDropdown = document.getElementById('paidToDropdown');
    const paidToHiddenInput = document.getElementById('paidTo');
    
    if (paidToSearchInput && paidToDropdown && paidToHiddenInput) {
        // Function to filter business partners
        window.filterBusinessPartners = function() {
            const searchText = paidToSearchInput.value.toLowerCase();
            populateBusinessPartnerDropdown(searchText);
            paidToDropdown.classList.remove('hidden');
        };

        // Function to populate dropdown with filtered business partners
        function populateBusinessPartnerDropdown(filter = '') {
            paidToDropdown.innerHTML = '';
            
            const filteredPartners = window.businessPartners.filter(bp => 
                (bp.code && bp.code.toLowerCase().includes(filter)) || 
                (bp.name && bp.name.toLowerCase().includes(filter))
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
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No matching business partners';
                paidToDropdown.appendChild(noResults);
            }
        }

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!paidToSearchInput.contains(event.target) && !paidToDropdown.contains(event.target)) {
                paidToDropdown.classList.add('hidden');
            }
        });

        // Initial population
        populateBusinessPartnerDropdown();
    }
}

// --- Superior Employee Functions ---
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
        'Approval.CheckedById': 'CH',
        'Approval.AcknowledgedById': 'AC',
        'Approval.ApprovedById': 'AP',
        'Approval.ReceivedById': 'RE'
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
    if (fieldId === 'Approval.PreparedById') {
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
    if (fieldId === 'Approval.PreparedById') {
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
    const documentType = 'SE'; // Settlement
    
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
        
        // Filter by transaction type (NRM for ST documents)
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
        
        // Store superior employees globally for use in filterUsers
        window.superiorEmployees = {};
        console.log('Initialized window.superiorEmployees as empty object');
        
        // Now populate each field with the appropriate superiors
        const approvalFields = [
            { id: 'Approval.PreparedById', level: 'PR' },
            { id: 'Approval.CheckedById', level: 'CH' },
            { id: 'Approval.AcknowledgedById', level: 'AC' },
            { id: 'Approval.ApprovedById', level: 'AP' },
            { id: 'Approval.ReceivedById', level: 'RE' }
        ];
        
        console.log(`Will populate ${approvalFields.length} approval fields:`, approvalFields.map(f => f.id));
        
        for (const fieldInfo of approvalFields) {
            console.log(`Populating field: ${fieldInfo.id} with level: ${fieldInfo.level}`);
            
            // Filter superiors for this specific level
            const levelSuperiors = superiorsWithFullNames.filter(superior => superior.superiorLevel === fieldInfo.level);
            console.log(`Found ${levelSuperiors.length} superiors for level ${fieldInfo.level}`);
            
            // Store superiors for this level globally
            window.superiorEmployees[fieldInfo.level] = levelSuperiors;
            
            // Populate the dropdown
            await populateSuperiorEmployeeDropdownWithData(fieldInfo.id, levelSuperiors);
        }
        
        console.log('Finished populating all superior employee dropdowns');
        console.log('Final window.superiorEmployees state:', window.superiorEmployees);
        
    } catch (error) {
        console.error("Error fetching superior employees:", error);
    }
}

// Function to populate superior employees with data (like detailCash.js)
async function populateSuperiorEmployeesWithData(data) {
    console.log('Populating superior employees with data:', data);
    
    // Use the comprehensive approval field handling similar to detailCash.js
    await populateApprovalFields(data);
    
    // Setup click handlers for approval dropdowns to show dropdown when clicked
    const approvalFields = [
        'Approval.PreparedById',
        'Approval.CheckedById', 
        'Approval.AcknowledgedById',
        'Approval.ApprovedById',
        'Approval.ReceivedById'
    ];
    
    approvalFields.forEach(fieldId => {
        const searchInput = document.getElementById(fieldId + 'Search');
        const dropdown = document.getElementById(fieldId + 'Dropdown');
        
        if (searchInput && dropdown) {
            // Show dropdown when input is clicked
            searchInput.addEventListener('click', function() {
                dropdown.classList.remove('hidden');
                filterUsers(fieldId);
            });
            
            // Show dropdown when input is focused
            searchInput.addEventListener('focus', function() {
                dropdown.classList.remove('hidden');
                filterUsers(fieldId);
            });
            
            // Show dropdown when input value changes (for backspace, typing, etc.)
            searchInput.addEventListener('input', function() {
                dropdown.classList.remove('hidden');
                filterUsers(fieldId);
            });
            
            // Show dropdown when key is pressed (for backspace, delete, etc.)
            searchInput.addEventListener('keydown', function() {
                dropdown.classList.remove('hidden');
                filterUsers(fieldId);
            });
        }
    });
}

// Comprehensive approval field handling similar to detailCash.js
// Global variable to store approval field values from API
window.approvalFieldValues = {};

// Helper function to fetch user name by ID
async function fetchUserNameById(userId) {
    if (!userId) return null;
    
    try {
        // First try to get from cached users
        if (window.requesters && window.requesters.length > 0) {
            const user = window.requesters.find(u => u.id === userId);
            if (user && user.fullName) {
                console.log(`Found full name in cache for ${userId}: ${user.fullName}`);
                return user.fullName;
            }
        }
        
        // If not in cache, fetch from API
        const response = await fetch(`${BASE_URL}/api/users/${userId}`);
        if (response.ok) {
            const result = await response.json();
            if (result.status && result.data && result.data.fullName) {
                console.log(`Fetched full name from API for ${userId}: ${result.data.fullName}`);
                return result.data.fullName;
            }
        }
    } catch (error) {
        console.warn(`Failed to fetch full name for user ${userId}:`, error);
    }
    
    return null;
}

async function populateApprovalFields(data) {
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
        receivedName: data.receivedName
    };
    
    console.log('Stored approval field values globally:', window.approvalFieldValues);
    console.log('Available approval fields in data:', {
        preparedById: data.preparedById,
        preparedName: data.preparedName,
        checkedById: data.checkedById,
        checkedName: data.checkedName,
        acknowledgedById: data.acknowledgedById,
        acknowledgedName: data.acknowledgedName,
        approvedById: data.approvedById,
        approvedName: data.approvedName,
        receivedById: data.receivedById,
        receivedName: data.receivedName
    });
    
    // Map of field names to API response field names - using the actual API field names from Settlement
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
        'acknowledgedBy': {
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
        }
    };
    
    // Populate each approval field
    for (const [fieldName, fieldConfig] of Object.entries(approvalFieldMapping)) {
        const searchInput = document.getElementById(fieldConfig.searchInput);
        const selectElement = document.getElementById(fieldConfig.selectElement);
        
        console.log(`Processing field: ${fieldName}`);
        console.log(`API data - ${fieldConfig.apiField}:`, data[fieldConfig.apiField]);
        console.log(`API data - ${fieldConfig.apiIdField}:`, data[fieldConfig.apiIdField]);
        console.log(`Search input found:`, !!searchInput);
        console.log(`Select element found:`, !!selectElement);
        
        if (searchInput && data[fieldConfig.apiIdField]) {
            // Always fetch the full name by user ID to ensure we display the name instead of username
            const fullName = await fetchUserNameById(data[fieldConfig.apiIdField]);
            const displayName = fullName || data[fieldConfig.apiField] || '';
            
            console.log(`Setting ${fieldConfig.searchInput} to: ${displayName}`);
            searchInput.value = displayName;
            
            // Handle the select element value
            if (selectElement) {
                console.log(`Setting ${fieldConfig.selectElement} to: ${data[fieldConfig.apiIdField]}`);
                
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
                    option.textContent = displayName;
                    option.selected = true;
                    selectElement.appendChild(option);
                }
                
                console.log(`Final select value for ${fieldConfig.selectElement}:`, selectElement.value);
                
                // Verify the value was set correctly
                setTimeout(() => {
                    const currentValue = document.getElementById(fieldConfig.selectElement)?.value;
                    console.log(`Verification - ${fieldConfig.selectElement} value:`, currentValue);
                }, 100);
            }
        } else {
            console.log(`Field ${fieldConfig.searchInput} not found or no data for ${fieldConfig.apiIdField}`);
        }
    }
}