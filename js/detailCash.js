// Global variable for file uploads
let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep

// Global variables
let rowCounter = 1;
let cashAdvanceData = null;

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
    const departmentSelect = document.getElementById("departmentId"); // Use correct field ID
    const transactionTypeSelect = document.getElementById("transactionType"); // Use correct field ID
    const requesterSearchInput = document.getElementById("requesterSearch");
    
    categoryInput.addEventListener('input', async function() {
        const departmentId = departmentSelect.value;
        const transactionType = transactionTypeSelect.value;
        const requesterValue = requesterSearchInput.value;
        
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
            category.toLowerCase().includes(searchText)
        );
        
        // Add historical categories to filtered list if they match search
        const historicalCategories = categoryInput.historicalCategories || [];
        const filteredHistoricalCategories = historicalCategories.filter(category => 
            category.toLowerCase().includes(searchText) && 
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
                    
                    // Update account name dropdown
                    updateAccountNameDropdown(row, category, departmentId, transactionType);
                    
                    // Clear COA when category changes
                    if (coaInput) coaInput.value = '';
                    
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
                    
                    // Update account name dropdown for historical category
                    updateAccountNameDropdown(row, category, departmentId, transactionType);
                    
                    // Clear COA when category changes
                    if (coaInput) coaInput.value = '';
                    
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
        const departmentId = departmentSelect.value;
        const transactionType = transactionTypeSelect.value;
        const requesterValue = requesterSearchInput.value;
        
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
                    
                    // Update account name dropdown
                    updateAccountNameDropdown(row, category, departmentId, transactionType);
                    
                    // Clear COA when category changes
                    if (coaInput) coaInput.value = '';
                    
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
                        
                        // Update account name dropdown for historical category
                        updateAccountNameDropdown(row, category, departmentId, transactionType);
                        
                        // Clear COA when category changes
                        if (coaInput) coaInput.value = '';
                        
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
    
    const departmentSelect = document.getElementById("departmentId"); // Use correct field ID
    const transactionTypeSelect = document.getElementById("transactionType"); // Use correct field ID
    const requesterSearchInput = document.getElementById("requesterSearch");
    
    const departmentId = departmentSelect?.value;
    const transactionType = transactionTypeSelect?.value;
    const requesterValue = requesterSearchInput?.value;
    const categoryValue = categoryInput?.value;
    
    if (!requesterValue || !departmentId || !transactionType) {
        // Disable category input
        if (categoryInput) {
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
        accountNameSelect.disabled = false;
        accountNameSelect.classList.remove('bg-gray-100');
    }
}

// Function to ensure category exists in available options (for historical data)
async function ensureCategoryAvailable(categoryInput, existingCategory, departmentId, transactionType) {
    if (!existingCategory || !categoryInput) return;
    
    // Get available categories
    const availableCategories = await getAvailableCategories(departmentId, transactionType);
    
    // Check if existing category exists in available options
    const categoryExists = availableCategories.some(cat => cat.toLowerCase() === existingCategory.toLowerCase());
    
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
    
    // Set the selected value
    if (currentSelectedValue) {
        accountNameSelect.value = currentSelectedValue;
        // Also set the COA if we have it
        if (existingCoa && coaInput) {
            coaInput.value = existingCoa;
        }
    }
    
    // Remove existing event listeners to avoid conflicts
    const newAccountNameSelect = accountNameSelect.cloneNode(true);
    accountNameSelect.parentNode.replaceChild(newAccountNameSelect, accountNameSelect);
    
    // Add event listener for account name selection - use dataset.coa instead of API call
    newAccountNameSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const selectedAccountName = this.value;
        
        if (selectedAccountName && selectedOption) {
            // Use COA data that's already available from dataset
            const coa = selectedOption.dataset.coa || '';
            console.log('Using COA from dataset:', coa, 'for account:', selectedAccountName);
            if (coaInput) coaInput.value = coa;
        } else {
            if (coaInput) coaInput.value = '';
        }
    });
    
    // Enable the account name field
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

// Function to add visual emphasis to requester selection
function emphasizeRequesterSelection() {
    const requesterSearchInput = document.getElementById("requesterSearch");
    if (requesterSearchInput && !requesterSearchInput.value) {
        requesterSearchInput.style.border = '2px solid #ef4444';
        requesterSearchInput.style.backgroundColor = '#fef2f2';
        
        // Add a helper text
        const helperText = document.createElement('div');
        helperText.id = 'requester-helper';
        helperText.className = 'text-red-600 text-sm mt-1 font-medium';
        helperText.textContent = '⚠️ Please select a requester first to auto-fill department';
        
        if (!document.getElementById('requester-helper')) {
            requesterSearchInput.parentElement.appendChild(helperText);
        }
    }
}

// Function to remove requester emphasis
function removeRequesterEmphasis() {
    const requesterSearchInput = document.getElementById("requesterSearch");
    const helperText = document.getElementById('requester-helper');
    
    if (requesterSearchInput) {
        requesterSearchInput.style.border = '';
        requesterSearchInput.style.backgroundColor = '';
    }
    
    if (helperText) {
        helperText.remove();
    }
}

// Function to add visual emphasis to transaction type selection
function emphasizeTransactionTypeSelection() {
    const transactionTypeSelect = document.getElementById("transactionType"); // Use correct field ID
    if (transactionTypeSelect && !transactionTypeSelect.value) {
        transactionTypeSelect.style.border = '2px solid #f59e0b';
        transactionTypeSelect.style.backgroundColor = '#fef3c7';
        
        // Add a helper text
        const helperText = document.createElement('div');
        helperText.id = 'transaction-type-helper';
        helperText.className = 'text-amber-600 text-sm mt-1 font-medium';
        helperText.textContent = '⚠️ Please select transaction type to enable expense categories';
        
        if (!document.getElementById('transaction-type-helper')) {
            transactionTypeSelect.parentElement.appendChild(helperText);
        }
    }
}

// Function to remove transaction type emphasis
function removeTransactionTypeEmphasis() {
    const transactionTypeSelect = document.getElementById("transactionType"); // Use correct field ID
    const helperText = document.getElementById('transaction-type-helper');
    
    if (transactionTypeSelect) {
        transactionTypeSelect.style.border = '';
        transactionTypeSelect.style.backgroundColor = '';
    }
    
    if (helperText) {
        helperText.remove();
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
    const departmentSelect = document.getElementById("departmentId"); // Use correct field ID
    if (!departmentSelect) return;
    
    // Clear and create options from API data like revisionCash.js
    departmentSelect.innerHTML = '<option value="" disabled>Select Department</option>';

    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.id;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
    });
    
    // Set the value from stored data if available
    if (window.currentValues && window.currentValues.departmentId) {
        departmentSelect.value = window.currentValues.departmentId;
    } else if (window.currentValues && window.currentValues.departmentName) {
        // Try to find by name if ID not available
        const matchingDept = departments.find(dept => dept.name === window.currentValues.departmentName);
        if (matchingDept) {
            departmentSelect.value = matchingDept.id;
        }
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
function populateUserSelects(users, caData = null) {
    // Store users globally for search functionality
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
                    
                    // Remove requester emphasis when selected
                    removeRequesterEmphasis();
                    
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

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!requesterSearchInput.contains(event.target) && !requesterDropdown.contains(event.target)) {
                requesterDropdown.classList.add('hidden');
            }
        });

        // Initial population
        populateRequesterDropdown();
    }

    // Handle employee fields from stored values or current user
    if (window.currentValues && window.currentValues.employeeId) {
        const employee = users.find(user => user.id === window.currentValues.employeeId);
        if (employee) {
            const employeeIdentifier = employee.kansaiEmployeeId || employee.username || employee.id;
            document.getElementById('employeeId').value = employeeIdentifier;
            document.getElementById('employeeName').value = employee.fullName;
        }
    } else {
        // Auto-populate with logged-in user if no data from API
        const loggedInUserId = getUserId();
        if (loggedInUserId && window.employees) {
            const loggedInEmployee = window.employees.find(emp => emp.id === loggedInUserId);
            if (loggedInEmployee) {
                const employeeNIK = loggedInEmployee.kansaiEmployeeId || '';
                const employeeName = loggedInEmployee.fullName || '';
                
                document.getElementById("employeeId").value = employeeNIK;
                document.getElementById("employeeName").value = employeeName;
            }
        }
    }

    // Populate approval dropdowns
    const approvalSelects = [
        { id: 'Approval.PreparedById', searchId: 'Approval.PreparedByIdSearch', approvalKey: 'preparedById' },
        { id: 'Approval.CheckedById', searchId: 'Approval.CheckedByIdSearch', approvalKey: 'checkedById' },
        { id: 'Approval.ApprovedById', searchId: 'Approval.ApprovedByIdSearch', approvalKey: 'approvedById' },
        { id: 'Approval.AcknowledgedById', searchId: 'Approval.AcknowledgedByIdSearch', approvalKey: 'acknowledgedById' },
        { id: 'Approval.ReceivedById', searchId: 'Approval.ReceivedByIdSearch', approvalKey: 'receivedById' },
        { id: 'Approval.ClosedById', searchId: 'Approval.ClosedByIdSearch', approvalKey: 'closedById' }
    ];

    approvalSelects.forEach(selectInfo => {
        const select = document.getElementById(selectInfo.id);
        if (select) {
            select.innerHTML = '<option value="" disabled>Select User</option>';
            
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.fullName;
                select.appendChild(option);
            });
            
            // Set the value from cash advance data if available and update search input
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
            
            // Auto-select and disable for Proposed by
            if (selectInfo.id === "Approval.PreparedById") {
                const loggedInUserId = getUserId();
                const loggedInUser = users.find(user => user.id === loggedInUserId);
                if (loggedInUser && !caData) {
                    select.value = loggedInUserId;
                    select.disabled = true;
                    const searchInput = document.getElementById(selectInfo.searchId);
                    if (searchInput) {
                        searchInput.value = loggedInUser.fullName;
                        searchInput.disabled = true;
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

// Function to fetch transaction types from API
function fetchTransactionType() {
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
            console.error('Error fetching transaction type:', error);
        });
}

// Function to populate transaction type select
function populateTransactionTypeSelect(transactionTypes) {
    const transactionTypeSelect = document.getElementById("transactionType"); // Use correct field ID
    if (!transactionTypeSelect) return;
    
    // Clear and create options from API data like revisionCash.js
    transactionTypeSelect.innerHTML = '<option value="" disabled>Select Transaction Type</option>';

    transactionTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type.name; // Use name as value like addCash.js
        option.textContent = type.name;
        transactionTypeSelect.appendChild(option);
    });
    
    // Set the value from stored data if available
    if (window.currentValues && window.currentValues.transactionType) {
        // Direct match by name since we're using name as value
        transactionTypeSelect.value = window.currentValues.transactionType;
        // Remove transaction type emphasis since we have a value
        removeTransactionTypeEmphasis();
    } else {
        // Add initial emphasis if no value is selected
        emphasizeTransactionTypeSelection();
    }

    // Add event listener for transaction type change
    transactionTypeSelect.addEventListener('change', function() {
        // Remove emphasis when transaction type is selected
        if (this.value) {
            removeTransactionTypeEmphasis();
        }
        
        // Refresh all category dropdowns when transaction type changes
        refreshAllCategoryDropdowns();
    });
}

function saveDocument() {
    const docNumber = (JSON.parse(localStorage.getItem("documents")) || []).length + 1;
    const documentData = {
        docNumber,
        invoiceNo : document.getElementById("invoiceNo").value,
        requester: document.getElementById("requester").value,
        department: document.getElementById("department").value,
        vendor: document.getElementById("vendor").value,
        name: document.getElementById("name").value,
        contactPerson: document.getElementById("contactPerson").value,
        vendorRefNo: document.getElementById("vendorRefNo").value,
        postingDate: document.getElementById("postingDate").value,
        dueDate: document.getElementById("dueDate").value,
        requiredDate: document.getElementById("requiredDate").value,
        classification: document.getElementById("classification").value,
        docType: document.getElementById("docType").value,
        docStatus: document.getElementById("docStatus").value,
        approvals: {
            prepared: document.getElementById("prepared").checked,
            checked: document.getElementById("checked").checked,
            approved: document.getElementById("approved").checked,
            knowledge: document.getElementById("knowledge").checked,
        }
    };
    
    let documents = JSON.parse(localStorage.getItem("documents")) || [];
    documents.push(documentData);
    localStorage.setItem("documents", JSON.stringify(documents));
    alert("Dokumen berhasil disimpan!");
}

function goToMenuCash() {
    window.location.href = "../pages/MenuCash.html";
}

// Only add event listener if the element exists (to prevent errors)
const docTypeElement = document.getElementById("docType");
if (docTypeElement) {
    docTypeElement.addEventListener("change", function() {
        const selectedValue = this.value;
        const prTable = document.getElementById("prTable");

        if (selectedValue === "Pilih") {
            prTable.style.display = "none";
        } else {
            prTable.style.display = "table";
        }
    });
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
                ${cashAdvanceData && cashAdvanceData.status && cashAdvanceData.status.toLowerCase() === 'draft' ? 
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
                ${cashAdvanceData && cashAdvanceData.status && cashAdvanceData.status.toLowerCase() === 'draft' ? 
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
}

function deleteRow(button) {
    button.closest("tr").remove(); // Hapus baris tempat tombol diklik
}

function confirmDelete() {
    Swal.fire({
        title: 'Apakah dokumen ini akan dihapus?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteDocument(); // Memanggil fungsi delete setelah konfirmasi
        }
    });
}

function deleteDocument() {
    // Get the ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('ca-id');
    
    if (!id) {
        Swal.fire('Error!', 'ID cash advance tidak ditemukan.', 'error');
        return;
    }
    
    // Call the DELETE API
    fetch(`${BASE_URL}/api/cash-advance/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status === 204) {
            // 204 No Content - Success case
            Swal.fire('Terhapus!', 'Dokumen berhasil dihapus.', 'success')
            .then(() => {
                // Redirect to previous page or list page after successful deletion
                window.history.back();
            });
        } else if (response.ok) {
            // If there's a response body, try to parse it
            return response.json().then(data => {
                if (data.status) {
                    Swal.fire('Terhapus!', 'Dokumen berhasil dihapus.', 'success')
                    .then(() => {
                        window.history.back();
                    });
                } else {
                    Swal.fire('Error!', data.message || 'Gagal menghapus dokumen karena status dokumen sudah bukan draft.', 'error');
                }
            });
        } else {
            Swal.fire('Error!', `Gagal menghapus dokumen. Status: ${response.status}`, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire('Error!', 'Terjadi kesalahan saat menghapus dokumen.', 'error');
    });
}

// Old loadCashAdvanceData function removed - replaced by fetchCashAdvanceDetail

async function populateForm(data) {
    // Store the global cash advance data
    cashAdvanceData = data;
    console.log("cashAdvanceData", cashAdvanceData);
    
    // Store values to be used after fetching options
    window.currentValues = {
        transactionType: data.transactionType,
        departmentName: data.departmentName,
        departmentId: data.departmentId,
        status: data.status,
        employeeId: data.employeeId
    };
    
    // Populate basic fields with correct IDs to match HTML
    document.getElementById("cashAdvanceNo").value = data.cashAdvanceNo || '';
    document.getElementById("purpose").value = data.purpose || '';
    
    // Handle PayTo business partner
    if (data.payTo && data.payToBusinessPartnerName) {
        const paidToSearchInput = document.getElementById('paidToSearch');
        const paidToHiddenInput = document.getElementById('paidTo');
        
        if (paidToSearchInput && paidToHiddenInput) {
            paidToSearchInput.value = data.payToBusinessPartnerName;
            paidToHiddenInput.value = data.payTo;
        }
    }
    
    // Handle submission date - convert from ISO to YYYY-MM-DD format for date input
    if (data.submissionDate) {
        const formattedDate = data.submissionDate.split('T')[0];
        document.getElementById("submissionDate").value = formattedDate;
    }
    
    // Handle requester name with search functionality  
    if (data.requesterName) {
        document.getElementById("requesterSearch").value = data.requesterName;
        // Store the requester ID for later use
        window.cashAdvanceRequesterId = data.requesterId;
        removeRequesterEmphasis();
    }
    
    // Handle remarks if exists
    const remarksTextarea = document.querySelector('textarea');
    if (remarksTextarea) {
        remarksTextarea.value = data.remarks || '';
    }
    
    // Handle rejection remarks if status is Rejected
    if (data.status === 'Rejected' && data.rejectedRemarks) {
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        const rejectionTextarea = document.getElementById('rejectionRemarks');
        
        if (rejectionSection && rejectionTextarea) {
            rejectionSection.style.display = 'block';
            rejectionTextarea.value = data.rejectedRemarks;
        }
    } else {
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        if (rejectionSection) {
            rejectionSection.style.display = 'none';
        }
    }

    // Handle revision remarks display
    displayRevisionRemarks(data);

    // Store and display attachments
    if (data.attachments) {
        existingAttachments = data.attachments;
        attachmentsToKeep = data.attachments.map(att => att.id);
        displayAttachments(data.attachments);
    }

    // Populate table with cash advance details
    await populateTable(data.cashAdvanceDetails || []);

    // Check if status is not Draft and make fields read-only
    if (data.status && data.status.toLowerCase() !== 'draft' && data.status.toLowerCase() !== 'revision') {
        makeAllFieldsReadOnlyForNonDraft();
    }
}

// Function to display revision remarks from API
function displayRevisionRemarks(data) {
    const revisedRemarksSection = document.getElementById('revisedRemarksSection');
    const revisedCountElement = document.getElementById('revisedCount');
    
    // Check if there are any revision remarks
    const hasRevisions = data.revisionCount && parseInt(data.revisionCount) > 0;
    
    if (hasRevisions) {
        if (revisedRemarksSection) {
            revisedRemarksSection.style.display = 'block';
        }
        if (revisedCountElement) {
            revisedCountElement.textContent = data.revisionCount || '0';
        }
        
        // Display individual revision remarks
        const revisionFields = [
            { data: data.firstRevisionRemarks, containerId: 'firstRevisionContainer', elementId: 'firstRevisionRemarks' },
            { data: data.secondRevisionRemarks, containerId: 'secondRevisionContainer', elementId: 'secondRevisionRemarks' },
            { data: data.thirdRevisionRemarks, containerId: 'thirdRevisionContainer', elementId: 'thirdRevisionRemarks' },
            { data: data.fourthRevisionRemarks, containerId: 'fourthRevisionContainer', elementId: 'fourthRevisionRemarks' }
        ];
        
        revisionFields.forEach(field => {
            if (field.data && field.data.trim() !== '') {
                const container = document.getElementById(field.containerId);
                const element = document.getElementById(field.elementId);
                
                if (container && element) {
                    container.style.display = 'block';
                    element.textContent = field.data;
                }
            }
        });
    } else {
        if (revisedRemarksSection) {
            revisedRemarksSection.style.display = 'none';
        }
    }
}

async function populateTable(cashAdvanceDetails) {
    const tableBody = document.getElementById("tableBody");
    
    console.log("cashAdvanceDetails", cashAdvanceDetails);
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add rows for each detail
    for (const detail of cashAdvanceDetails) {
        const newRow = document.createElement("tr");
        
        newRow.innerHTML = `
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
                <input type="text" class="description w-full" maxlength="200" value="${detail.description || ''}" />
            </td>
            <td class="p-2 border">
                <input type="number" class="total w-full" maxlength="10" value="${detail.amount || ''}" required step="0.01"/>
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
        `;
        
        tableBody.appendChild(newRow);
        
        // Get department and transaction type values
        const departmentId = document.getElementById("departmentId").value;
        const transactionType = document.getElementById("transactionType").value;
        
        // Setup category dropdown for each row
        await setupCategoryDropdown(newRow);
        
        // Ensure historical category is available if it doesn't exist in master data
        if (detail.category) {
            const categoryInput = newRow.querySelector('.category-input');
            await ensureCategoryAvailable(categoryInput, detail.category, departmentId, transactionType);
        }
        
        // If row has account name and category, populate account name dropdown with historical support
        if (detail.category) {
            await updateAccountNameDropdown(
                newRow, 
                detail.category, 
                departmentId, 
                transactionType, 
                detail.accountName, // Pass existing account name
                detail.coa // Pass existing COA
            );
        }
    }
    
    // If no details exist, add one empty row
    if (cashAdvanceDetails.length === 0) {
        await addRow();
    }
}

// Function to filter users for approval fields (same as addCash)
function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    
    // Map field IDs to their corresponding role names for display
    const fieldMapping = {
        'Approval.PreparedById': 'Proposed',
        'Approval.CheckedById': 'Checked', 
        'Approval.ApprovedById': 'Approved',
        'Approval.AcknowledgedById': 'Acknowledged',
        'Approval.ReceivedById': 'Received',
        'Approval.ClosedById': 'Closed'
    };
    
    // Kosongkan dropdown
    dropdown.innerHTML = '';
    
    // Filter pengguna berdasarkan teks pencarian
    const filteredUsers = window.requesters ? 
        window.requesters.filter(user => user.fullName.toLowerCase().includes(searchText)) : 
        [];
    
    // Tampilkan hasil pencarian
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
    
    // Tampilkan pesan jika tidak ada hasil
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'Tidak ada pengguna yang cocok';
        dropdown.appendChild(noResults);
    }
    
    // Tampilkan dropdown
    dropdown.classList.remove('hidden');
}



// Initialize all dropdowns when page loads
document.addEventListener('DOMContentLoaded', async function() {
    fetchDepartments();
    fetchUsers();
    fetchTransactionType();
    fetchBusinessPartners();
    
    // Get cash advance ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const cashAdvanceId = urlParams.get('ca-id'); // Use 'ca-id' to be consistent with existing code
    
    if (cashAdvanceId) {
        await fetchCashAdvanceDetail(cashAdvanceId);
    } else {
        console.warn('No cash advance ID found in URL parameters');
        Swal.fire('Error!', 'Cash advance ID not found in URL.', 'error');
    }
    
    // Setup initial rows after a small delay to ensure DOM is ready
    setTimeout(async () => {
        const rows = document.querySelectorAll('#tableBody tr');
        for (const row of rows) {
            await setupCategoryDropdown(row);
        }
        
        // Add initial emphasis if fields are empty after data load
        const requesterValue = document.getElementById("requesterSearch")?.value;
        const transactionTypeValue = document.getElementById("transactionType")?.value; // Use correct field ID
        
        if (!requesterValue) {
            emphasizeRequesterSelection();
        }
        
        if (!transactionTypeValue) {
            emphasizeTransactionTypeSelection();
        }
    }, 500);
    
    // Add event listener for department change
    const departmentSelect = document.getElementById("departmentId"); // Use correct field ID
    if (departmentSelect) {
        departmentSelect.addEventListener('change', function() {
            refreshAllCategoryDropdowns();
        });
    }
    
    // Add event listener for transaction type change
    const transactionTypeSelect = document.getElementById("transactionType"); // Use correct field ID
    if (transactionTypeSelect) {
        transactionTypeSelect.addEventListener('change', function() {
            removeTransactionTypeEmphasis();
            refreshAllCategoryDropdowns();
        });
    }
});

function updateCash(isSubmit = false) {
    const actionText = isSubmit ? 'Submit' : 'Update';
    const actionConfirmText = isSubmit ? 'submit' : 'update';
    const actioningText = isSubmit ? 'Submitting' : 'Updating';
    
    Swal.fire({
        title: `${actionText} Cash Advance`,
        text: `Are you sure you want to ${actionConfirmText} this Cash Advance?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: `Yes, ${actionConfirmText} it!`,
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Validate required fields before submission
            const validationResult = validateFormFields(isSubmit);
            if (!validationResult.isValid) {
                Swal.fire({
                    title: 'Validation Error',
                    text: validationResult.message,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
                return;
            }

            // Get the ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('ca-id');
            
            if (!id) {
                Swal.fire('Error!', 'ID cash advance tidak ditemukan.', 'error');
                return;
            }

            // Show loading
            Swal.fire({
                title: `${actioningText}...`,
                text: `Please wait while we ${actionConfirmText} the Cash Advance.`,
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Create FormData object
            const formData = new FormData();
        
            // Get RequesterId value with fallback
            const requesterIdElement = document.getElementById('RequesterId');
            let requesterId = '';
            
            console.log('RequesterId element found:', requesterIdElement);
            console.log('RequesterId element value:', requesterIdElement ? requesterIdElement.value : 'element not found');
            console.log('Global fallback value:', window.cashAdvanceRequesterId);
            
            if (requesterIdElement && requesterIdElement.value) {
                requesterId = requesterIdElement.value;
                console.log('Using RequesterId from form element:', requesterId);
            } else if (window.cashAdvanceRequesterId) {
                // Use the global fallback variable
                requesterId = window.cashAdvanceRequesterId;
                console.warn('Using global fallback RequesterId:', requesterId);
            } else {
                // No valid RequesterId found - this is a business logic error
                console.error('No valid RequesterId found - cannot proceed with update');
                Swal.fire('Error!', 'RequesterId tidak ditemukan. Data cash advance mungkin rusak.', 'error');
                return;
            }
        
            // Add all form fields to FormData
            formData.append('CashAdvanceNo', document.getElementById("cashAdvanceNo").value);
            formData.append('EmployeeNIK', document.getElementById("employeeId").value);
            formData.append('RequesterId', requesterId);
            formData.append('Purpose', document.getElementById("purpose").value);
            formData.append('DepartmentId', document.getElementById("departmentId").value); // Use correct field ID
            formData.append('SubmissionDate', document.getElementById("submissionDate").value);
            formData.append('TransactionType', document.getElementById("transactionType").value); // Use correct field ID
            
            // Handle remarks if exists
            const remarksTextarea = document.querySelector('textarea');
            if (remarksTextarea) {
                formData.append('Remarks', remarksTextarea.value);
            }
            
            // Approval fields
            formData.append('PreparedById', document.getElementById("Approval.PreparedById")?.value || '');
            formData.append('CheckedById', document.getElementById("Approval.CheckedById")?.value || '');
            formData.append('ApprovedById', document.getElementById("Approval.ApprovedById")?.value || '');
            formData.append('AcknowledgedById', document.getElementById("Approval.AcknowledgedById")?.value || '');
            formData.append('ReceivedById', document.getElementById("Approval.ReceivedById")?.value || '');
            formData.append('ClosedById', document.getElementById("Approval.ClosedById")?.value || '');
            
            // Add CashAdvanceDetails - collect all rows from the table with validation
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
                const amount = amountInput?.value;
                
                if (description && amount) {
                    formData.append(`CashAdvanceDetails[${detailIndex}][Category]`, category || '');
                    formData.append(`CashAdvanceDetails[${detailIndex}][AccountName]`, accountName || '');
                    formData.append(`CashAdvanceDetails[${detailIndex}][Coa]`, coa || '');
                    formData.append(`CashAdvanceDetails[${detailIndex}][Description]`, description);
                    formData.append(`CashAdvanceDetails[${detailIndex}][Amount]`, amount);
                    detailIndex++;
                }
            });

            // Add Business Partner ID (Paid To)
            const paidToId = document.getElementById("paidTo").value;
            if (paidToId) {
                formData.append('PayTo', paidToId);
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
            
            // Set IsSubmit based on the parameter
            formData.append('IsSubmit', isSubmit);
            
            // Log the data being sent for debugging
            console.log('FormData being sent:');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }
            
            // Call the PUT API
            fetch(`${BASE_URL}/api/cash-advance/${id}`, {
                method: 'PUT',
                body: formData
            })
            .then(response => {
                if (response.status === 200 || response.status === 204) {
                    // Success
                    Swal.fire({
                        title: 'Success!',
                        text: `Cash Advance has been ${isSubmit ? 'submitted' : 'updated'} successfully.`,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        // Reload the cash advance data to show updated information
                        fetchCashAdvanceDetail(id);
                        
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
                    text: `Failed to ${actionConfirmText} Cash Advance: ${error.message}`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            });
        }
    });
}

// Function to convert amount to words
function numberToWords(num) {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    if (num === 0) return 'zero';
    
    function convertLessThanOneThousand(num) {
        if (num < 20) {
            return ones[num];
        }
        
        const ten = Math.floor(num / 10);
        const unit = num % 10;
        
        return tens[ten] + (unit !== 0 ? '-' + ones[unit] : '');
    }
    
    function convert(num) {
        if (num < 1000) {
            return convertLessThanOneThousand(num);
        }
        
        const billions = Math.floor(num / 1000000000);
        const millions = Math.floor((num % 1000000000) / 1000000);
        const thousands = Math.floor((num % 1000000) / 1000);
        const remainder = num % 1000;
        
        let result = '';
        
        if (billions) {
            result += convertLessThanOneThousand(billions) + ' billion ';
        }
        
        if (millions) {
            result += convertLessThanOneThousand(millions) + ' million ';
        }
        
        if (thousands) {
            result += convertLessThanOneThousand(thousands) + ' thousand ';
        }
        
        if (remainder) {
            result += convertLessThanOneThousand(remainder);
        }
        
        return result.trim();
    }
    
    // Split number into whole and decimal parts
    const parts = Number(num).toFixed(2).split('.');
    const wholePart = parseInt(parts[0]);
    const decimalPart = parseInt(parts[1]);
    
    let result = convert(wholePart);
    
    if (decimalPart) {
        result += ' point ' + convert(decimalPart);
    }
    
    return result + ' rupiah';
}

// Function to print the cash advance voucher
function printCashAdvanceVoucher() {
    // Get data from the form
    const cashAdvanceNo = document.getElementById("cashAdvanceNo").value;
    const departmentId = document.getElementById("department").value;
    const paidTo = document.getElementById("paidTo").value;
    const purpose = document.getElementById("purpose").value;
    const submissionDate = document.getElementById("submissionDate").value;
    
    // Get approval data
    const proposedName = document.getElementById("preparedSelect").value;
    const checkedName = document.getElementById("checkedSelect").value;
    const approvedName = document.getElementById("approvedSelect").value;
    const acknowledgedName = document.getElementById("acknowledgedSelect").value;
    
    // Get checkbox states
    const proposedChecked = document.getElementById("preparedCheckbox").checked;
    const checkedChecked = document.getElementById("checkedCheckbox").checked;
    const approvedChecked = document.getElementById("approvedCheckbox").checked;
    const acknowledgedChecked = document.getElementById("acknowledgedCheckbox").checked;
    
    // Get table data
    const tableBody = document.getElementById("tableBody");
    const rows = tableBody.querySelectorAll("tr");
    const tableData = [];
    let totalAmount = 0;
    
    rows.forEach(row => {
        const descriptionInput = row.querySelector("td:first-child input");
        const amountInput = row.querySelector("td:nth-child(2) input");
        
        if (descriptionInput && amountInput && descriptionInput.value && amountInput.value) {
            const amount = parseFloat(amountInput.value);
            tableData.push({
                description: descriptionInput.value,
                amount: amount
            });
            totalAmount += amount;
        }
    });
    
    // Convert total amount to words
    const amountInWords = numberToWords(totalAmount);
    
    // Create the printable HTML
    const printContent = `
    <div id="print-container" style="width: 800px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: left; margin-bottom: 20px;">
            <h3 style="margin: 0;">PT KANSAI PAINT INDONESIA</h3>
            <p style="margin: 0;">Blok DD-7 & DD-6 Kawasan Industri MM2100 Danaludah</p>
            <p style="margin: 0;">Cikarang Barat Kab. Bekasi Jawa Barat 17530</p>
        </div>
        
        <div style="text-align: right; margin-bottom: 20px;">
            <p style="margin: 0;"><strong>Batch No:</strong> _____________</p>
            <p style="margin: 0;"><strong>Voucher No:</strong> ${cashAdvanceNo}</p>
            <p style="margin: 0;"><strong>Submission date:</strong> ${submissionDate}</p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <h2 style="text-decoration: underline;">CASH ADVANCE VOUCHER</h2>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Production' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Production</span>
                        </div>
                    </td>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Marketing' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Marketing</span>
                        </div>
                    </td>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Technical' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Technical</span>
                        </div>
                    </td>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Admninistration' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Administration</span>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Cash advance is paid to</td>
                    <td style="width: 80%;">: ${paidTo}</td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0; display: flex; justify-content: space-between;">
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Proposed by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${proposedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
            
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Advance is checked by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${checkedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
        </div>
        
        <div style="margin: 20px 0; display: flex; justify-content: space-between;">
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Advance is approved by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${approvedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
            
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Cash is received by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${acknowledgedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Payment through [√]:</td>
                    <td style="width: 80%;">
                        <input type="checkbox" style="transform: scale(1.5); margin-right: 5px;"> Cash
                        <input type="checkbox" style="transform: scale(1.5); margin-right: 5px; margin-left: 20px;"> Bank remittance
                        <span style="margin-left: 20px;">[Bank Ref: _______________ ]</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Estimated cost</td>
                    <td style="width: 80%;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 30%; border: 1px solid #000; padding: 5px;">Rp ${totalAmount.toLocaleString()}</td>
                                <td style="width: 70%;">In words: ${amountInWords}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Purpose of Advance</td>
                    <td style="width: 80%;">: ${purpose}</td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <p><strong>Settlement of advance:</strong></p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #000; padding: 8px; width: 60%;">Description</th>
                        <th style="border: 1px solid #000; padding: 8px; width: 20%;">Debit</th>
                        <th style="border: 1px solid #000; padding: 8px; width: 20%;">Credit</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableData.map(item => `
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px;">${item.description}</td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right;">${item.amount.toLocaleString()}</td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                    </tr>
                    `).join('')}
                    ${Array(8 - tableData.length).fill().map(() => `
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; height: 30px;"></td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                    </tr>
                    `).join('')}
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; text-align: center;"><strong>Total</strong></td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>${totalAmount.toLocaleString()}</strong></td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div style="margin: 40px 0 20px; text-align: right;">
            <p><strong>Return Date:</strong> _____________</p>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 40%;">
                        <p>Total cash must be returned to the<br>Company (paid to the Employee)</p>
                    </td>
                    <td style="width: 60%;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 30%; border: 1px solid #000; padding: 5px;">Rp ${totalAmount.toLocaleString()}</td>
                                <td style="width: 70%;">In words: ${amountInWords}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0; display: flex; justify-content: flex-end;">
            <div style="width: 45%; border: 1px solid #000; padding: 10px; margin-right: 10px;">
                <p style="text-align: center;"><strong>Cash is received by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ____________</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
            
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Settlement is approved by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ____________</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
        </div>
        
        <div style="margin: 20px 0; font-size: 10px; line-height: 1.2;">
            <p>The payment through cash is valid, at the time you sign on the column of "Cash is received by".</p>
            <p>The Cash Advance Must be Settled within 1 Month, Otherwise The Company has full authority to deduct from the Salary.</p>
        </div>
    </div>
    `;
    
    // Create a temporary container to hold the printable content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = printContent;
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    
    // Generate the PDF
    const element = document.getElementById('print-container');
    const opt = {
        margin: 10,
        filename: `Cash_Advance_${cashAdvanceNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate PDF
    html2pdf().set(opt).from(element).save().then(() => {
        // Remove the temporary container after PDF is generated
        document.body.removeChild(tempDiv);
    });
}

// Function to make all fields read-only when status is not Draft or Revision
function makeAllFieldsReadOnlyForNonDraft() {
    console.log('Status is not Draft or Revision - making all fields read-only');
    
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
    
    // Hide all approval dropdown divs
    const approvalDropdowns = [
        'Approval.PreparedByIdDropdown',
        'Approval.CheckedByIdDropdown', 
        'Approval.ApprovedByIdDropdown',
        'Approval.AcknowledgedByIdDropdown',
        'Approval.ReceivedByIdDropdown',
        'Approval.ClosedByIdDropdown'
    ];
    
    approvalDropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    });
    
    // Hide PayTo dropdown
    const paidToDropdown = document.getElementById('paidToDropdown');
    if (paidToDropdown) {
        paidToDropdown.style.display = 'none';
    }
    
    // Hide action buttons (Update, Submit, Delete)
    const actionButtons = document.querySelectorAll('button[onclick*="updateCash"], button[onclick*="confirmDelete"]');
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
    
    // Disable file upload input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.disabled = true;
        fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
    
    // Update attachments display to hide remove buttons
    updateAttachmentsDisplay();
}

// Function to display attachments (initial load)
function displayAttachments(attachments) {
    // Just call the update function which handles both existing and new files
    updateAttachmentsDisplay();
}

function fetchBusinessPartners() {
    fetch(`${BASE_URL}/api/business-partners/type/employee`)
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
    // Store business partners globally for search functionality - only store active employee business partners
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
                bp.code.toLowerCase().includes(filter) || 
                bp.name.toLowerCase().includes(filter)
            );
            
            filteredPartners.forEach(partner => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerHTML = `<span class="font-medium">${partner.code}</span> - ${partner.name}`;
                option.onclick = function() {
                    paidToSearchInput.value = `${partner.code} - ${partner.name}`;
                    paidToHiddenInput.value = partner.id;
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

// Function to validate form fields
function validateFormFields(isSubmit) {
    // Check requester selection
    const requesterSearch = document.getElementById("requesterSearch").value;
    if (!requesterSearch) {
        return {
            isValid: false,
            message: 'Please select a requester first.'
        };
    }

    // Check transaction type
    const transactionType = document.getElementById("transactionType").value; // Use correct field ID
    if (!transactionType) {
        return {
            isValid: false,
            message: 'Please select a transaction type.'
        };
    }

    // Check department (via requester)
    const department = document.getElementById("departmentId").value; // Use correct field ID
    if (!department) {
        return {
            isValid: false,
            message: 'Please select a requester to auto-fill the department.'
        };
    }

    // Check expense details if submitting
    const tableRows = document.querySelectorAll('#tableBody tr');
    let hasValidDetails = false;
    let invalidRows = [];

    tableRows.forEach((row, index) => {
        const category = row.querySelector('.category-input').value;
        const accountName = row.querySelector('.account-name').value;
        const coa = row.querySelector('.coa').value;
        const description = row.querySelector('.description').value;
        const amount = row.querySelector('.total').value;

        if (description && amount) {
            hasValidDetails = true;
            
            if (isSubmit && (!category || !accountName || !coa)) {
                invalidRows.push(index + 1);
            }
        }
    });

    if (!hasValidDetails) {
        return {
            isValid: false,
            message: 'Please add at least one expense detail with description and amount.'
        };
    }

    if (isSubmit && invalidRows.length > 0) {
        return {
            isValid: false,
            message: `Please complete category and account name selection for row(s): ${invalidRows.join(', ')}`
        };
    }

    return { isValid: true };
}

// Function to fetch cash advance details when the page loads (similar to detailPR.js)
async function fetchCashAdvanceDetail(cashAdvanceId) {
    try {
        // Show loading state
        console.log('Fetching cash advance details for ID:', cashAdvanceId);
        
        const response = await fetch(`${BASE_URL}/api/cash-advance/${cashAdvanceId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200) {
            const result = await response.json();
            if (result.status && result.data) {
                console.log("Cash advance data fetched:", result.data);
                
                // Always fetch dropdown options first, then populate form
                fetchDropdownOptions(result.data);
                await populateForm(result.data);
            } else {
                Swal.fire('Error!', result.message || 'Failed to load cash advance data.', 'error');
            }
        } else if (response.status === 404) {
            Swal.fire('Error!', 'Cash advance not found.', 'error');
        } else {
            Swal.fire('Error!', `Error: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('Error fetching cash advance details:', error);
        if (error.message.includes('not found')) {
            Swal.fire('Error!', 'Cash advance not found.', 'error');
        } else {
            Swal.fire('Error!', 'An error occurred while loading cash advance data.', 'error');
        }
    }
}

// Function to fetch all dropdown options (consistent with detailPR.js pattern)
function fetchDropdownOptions(caData = null) {
    fetchDepartments();
    fetchUsers(caData);
    fetchTransactionType();
    fetchBusinessPartners();
}