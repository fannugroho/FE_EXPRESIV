let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep

let cashAdvanceId; // Declare global variable

// Fallback for makeAuthenticatedRequest if auth.js is not loaded
if (typeof makeAuthenticatedRequest === 'undefined') {
    console.warn('makeAuthenticatedRequest not found, creating fallback function');
    window.makeAuthenticatedRequest = async function (endpoint, options = {}) {
        console.warn('Using fallback makeAuthenticatedRequest - auth.js may not be loaded properly');
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Set default headers
        const headers = {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };
        
        // Make the request
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        return response;
    };
}

// Safe JSON parser for fetch responses that may be empty (e.g., 204 No Content)
async function parseJsonSafe(response) {
	const text = await response.text();
	if (!text) return null;
	try {
		return JSON.parse(text);
	} catch (e) {
		throw new Error('Invalid JSON response');
	}
}

// Function to get available categories based on department and transaction type from API
async function getAvailableCategories(departmentId, transactionType) {
    if (!departmentId || !transactionType) return [];

    try {
        const response = await fetch(`${BASE_URL}/api/expenses/categories?departmentId=${departmentId}&menu=Cash Advance&transactionType=${transactionType}`);
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        const data = await parseJsonSafe(response);
        return data.data || data; // Handle both wrapped and direct array responses
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
        const data = await parseJsonSafe(response);
        console.log(`🔍 API response:`, data);
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
        const data = await parseJsonSafe(response);
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

    categoryInput.addEventListener('input', async function () {
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
                option.onclick = function () {
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
                option.onclick = function () {
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

    categoryInput.addEventListener('focus', async function () {
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
                option.onclick = function () {
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
                    option.onclick = function () {
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
    document.addEventListener('click', function (event) {
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
    newAccountNameSelect.addEventListener('change', function () {
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

// Function to populate account name dropdown for initial load without clearing existing value
async function populateAccountNameDropdownForInitialLoad(row, category, departmentId, transactionType, existingAccountName, existingCoa) {
    const accountNameSelect = row.querySelector('.account-name');
    const coaInput = row.querySelector('.coa');
    
    if (!accountNameSelect) return;
    
    // Validate prerequisites
    if (!category) {
        showValidationMessage(accountNameSelect, 'Please select a category first');
        return;
    }
    
    // Get available account names for the selected category
    const accountNames = await getAvailableAccountNames(category, departmentId, transactionType);
    console.log(`🔍 populateAccountNameDropdownForInitialLoad - API returned ${accountNames.length} account names:`, accountNames);
    console.log(`🔍 Looking for existing account name: "${existingAccountName}" in results`);
    
    // Check if existing account name exists in the fetched options
    let existingAccountNameFound = false;
    
    // Add the existing account name as the first option to preserve it
    if (existingAccountName) {
        const existingOption = document.createElement('option');
        existingOption.value = existingAccountName;
        existingOption.textContent = existingAccountName;
        existingOption.dataset.coa = existingCoa || '';
        existingOption.dataset.remarks = '';
        existingOption.selected = true; // Keep it selected
        accountNameSelect.appendChild(existingOption);
        console.log(`Preserved existing account name: ${existingAccountName}`);
    }
    
    // Add other available options
    accountNames.forEach(item => {
        console.log(`🔍 Checking item:`, item);
        // Skip if this is the same as the existing account name
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
    
    // If existing account name doesn't exist in current options, mark it as historical
    if (existingAccountName && !existingAccountNameFound) {
        console.log(`⚠️ Account name "${existingAccountName}" not found in API results - marking as historical`);
        // Update the existing option to show it's historical
        const existingOption = accountNameSelect.querySelector(`option[value="${existingAccountName}"]`);
        if (existingOption) {
            existingOption.textContent = `${existingAccountName} (Historical)`;
            existingOption.dataset.remarks = 'Historical data - no longer in master data';
            existingOption.style.fontStyle = 'italic';
            existingOption.style.color = '#6b7280'; // Gray color to indicate historical
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
    
    // Set the COA if we have it
    if (existingCoa && coaInput) {
        coaInput.value = existingCoa;
    }
    
    // Remove existing event listeners to avoid conflicts
    const newAccountNameSelect = accountNameSelect.cloneNode(true);
    accountNameSelect.parentNode.replaceChild(newAccountNameSelect, accountNameSelect);
    
    // Add event listener for account name selection
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
    fetchCurrencies(approvalData);
    
    // Initialize superior employee dropdowns
    const transactionType = document.getElementById("TransactionType")?.value || 'NRM';
    populateAllSuperiorEmployeeDropdowns(transactionType);
}

// Function to fetch departments from API
async function fetchDepartments() {
    try {
        const response = await fetch(`${BASE_URL}/api/department`);
        if (!response.ok) throw new Error('Network response was not ok: ' + response.statusText);
        const data = await parseJsonSafe(response);
        if (!data) throw new Error('Invalid JSON response for departments');
        console.log("Department data:", data);
        populateDepartmentSelect(data.data || data);
    } catch (error) {
        console.error('Error fetching departments:', error);
    }
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
async function fetchUsers(approvalData = null) {
    try {
        const response = await fetch(`${BASE_URL}/api/users`);
        if (!response.ok) throw new Error('Network response was not ok: ' + response.statusText);
        const data = await parseJsonSafe(response);
        if (!data) throw new Error('Invalid JSON response for users');
        console.log("User data:", data);
        populateUserSelects(data.data || data, approvalData);
    } catch (error) {
        console.error('Error fetching users:', error);
    }
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
        window.filterRequesters = function () {
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
                option.onclick = function () {
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
        
        // Show dropdown when input value changes (for backspace, typing, etc.)
        requesterSearchInput.addEventListener('input', function() {
            requesterDropdown.classList.remove('hidden');
            populateRequesterDropdown();
        });
        
        // Show dropdown when key is pressed (for backspace, delete, etc.)
        requesterSearchInput.addEventListener('keydown', function() {
            requesterDropdown.classList.remove('hidden');
            populateRequesterDropdown();
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', function (event) {
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
            document.getElementById('employeeName').value = employee.fullName;
        }
    } else {
        // Auto-populate with logged-in user if no data from API
        const loggedInUserId = getUserId();
        if (loggedInUserId && window.employees) {
            const loggedInEmployee = window.employees.find(emp => emp.id === loggedInUserId);
            if (loggedInEmployee) {
                const employeeName = loggedInEmployee.fullName || '';

                document.getElementById("employeeName").value = employeeName;
            }
        }
    }

    // Note: Approval dropdowns are now handled by populateSuperiorEmployeesWithData and populateAllSuperiorEmployeeDropdowns
    // This prevents conflicts and ensures only superior employees are shown in approval dropdowns
    
    // Initialize approval dropdowns with empty options to prevent null reference errors
    const approvalSelects = [
        'Approval.PreparedById',
        'Approval.CheckedById',
        'Approval.AcknowledgedById',
        'Approval.ApprovedById',
        'Approval.ReceivedById',
        'Approval.ClosedById'
    ];
    
    approvalSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select User</option>';
        }
    });

    // Setup click-outside-to-close behavior for all dropdowns
    document.addEventListener('click', function (event) {
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
async function fetchTransactionType() {
    try {
        const response = await fetch(`${BASE_URL}/api/transactiontypes/filter?category=CashAdvance`);
        if (!response.ok) throw new Error('Network response was not ok: ' + response.statusText);
        const data = await parseJsonSafe(response);
        if (!data) throw new Error('Invalid JSON response for transaction types');
        console.log("Transaction Type data:", data);
        populateTransactionTypeSelect(data.data || data);
    } catch (error) {
        console.error('Error fetching transaction type:', error);
    }
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
    transactionTypeSelect.addEventListener('change', function () {
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
        invoiceNo: document.getElementById("invoiceNo").value,
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
    docTypeElement.addEventListener("change", function () {
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
            <input type="text" class="total w-full" required onkeydown="handleAmountKeydown(this, event)" />
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
    
    // Recalculate total after adding row
    calculateTotalAmount();
}

function deleteRow(button) {
    button.closest("tr").remove(); // Hapus baris tempat tombol diklik
    calculateTotalAmount(); // Recalculate total after removing a row
}

// Function to calculate total amount from all rows
function calculateTotalAmount() {
    const totalInputs = document.querySelectorAll('.total');
    let sum = 0;
    
    totalInputs.forEach(input => {
        // Only add to sum if the input has a valid numeric value
        // Remove commas before parsing to handle formatted values
        const value = input.value.trim().replace(/,/g, '');
        if (value && !isNaN(parseFloat(value))) {
            sum += parseFloat(value);
        }
    });
    
    // Update the total amount display with thousand separators and 2 decimals
    const totalAmountDisplay = document.getElementById('totalAmountDisplay');
    if (totalAmountDisplay) {
        totalAmountDisplay.textContent = sum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

// Format with thousand separators and 2 decimals on blur
function formatNumberWithDecimals(input) {
    console.log('=== formatNumberWithDecimals DEBUG START ===');
    console.log('Input element:', input);
    console.log('Input value before processing:', input.value);
    console.log('Input type:', input.type);
    console.log('Input classList:', input.classList.toString());
    
    let value = (input.value || '').toString().replace(/,/g, '').replace(/[^\d.]/g, '');
    console.log('After removing commas and non-numeric chars:', value);
    
    if (!value || value === '.') {
        console.log('Empty or just decimal point, setting to 0.00');
        input.value = '0.00';
        calculateTotalAmount();
        return;
    }
    
    const num = parseFloat(value);
    console.log('After parseFloat:', num);
    
    if (isNaN(num)) {
        console.log('Not a valid number, setting to 0.00');
        input.value = '0.00';
        calculateTotalAmount();
        return;
    }
    
    const formattedValue = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    console.log('After toLocaleString formatting:', formattedValue);
    
    console.log('Setting input.value to:', formattedValue);
    input.value = formattedValue;
    
    console.log('Final input.value after setting:', input.value);
    console.log('=== formatNumberWithDecimals DEBUG END ===');
    
    calculateTotalAmount();
}

// Real-time formatting with thousand separators; preserve cursor position
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

// Function to handle keydown events for amount input
function handleAmountKeydown(input, event) {
    const key = event.key;
    const cursorPos = input.selectionStart;
    const value = input.value;
    
    // Allow navigation keys
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'].includes(key)) {
        return true;
    }
    
    // Allow backspace and delete
    if (key === 'Backspace' || key === 'Delete') {
        return true;
    }
    
    // Allow decimal point only if it doesn't already exist
    if (key === '.' && !value.includes('.')) {
        return true;
    }
    
    // Allow only numeric characters
    if (/^\d$/.test(key)) {
        return true;
    }
    
    // Prevent other keys
    event.preventDefault();
    return false;
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
                // If there's a response body, try to parse it safely
                return parseJsonSafe(response).then(data => {
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

async function populateCashAdvanceDetails(data) {
    // Store the global cash advance data
    window.cashAdvanceData = data;
    console.log("cashAdvanceData", window.cashAdvanceData);
    
    // Populate basic cash advance information
    document.getElementById('cashAdvanceNo').value = data.cashAdvanceNo;
    
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
    
    // Populate basic fields with correct IDs to match HTML
    document.getElementById("cashAdvanceNo").value = data.cashAdvanceNo || '';
    document.getElementById("purpose").value = data.purpose || '';
    
    // Handle employee fields
    document.getElementById("employeeNIK").value = data.employeeNIK || '';
    document.getElementById("employeeName").value = data.employeeName || '';
    
    // Handle department and transaction type
    if (data.departmentId) {
        document.getElementById("departmentId").value = data.departmentId;
    }
    if (data.transactionType) {
        document.getElementById("transactionType").value = data.transactionType;
        // Toggle closedBy visibility after setting transaction type
        if (typeof toggleClosedByVisibility === 'function') {
            toggleClosedByVisibility();
        }
    }


    
    // Handle PayTo business partner - map from API response
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
    const remarksTextarea = document.getElementById('remarks');
    if (remarksTextarea) {
        remarksTextarea.value = data.remarks || '';
    }
    
    // Handle rejection remarks display (will be handled by displayRejectionRemarks function)

    // Handle revision remarks display
    displayRevisionRemarks(data);

    // Store and display attachments
    if (data.attachments) {
        existingAttachments = data.attachments;
        attachmentsToKeep = data.attachments.map(att => att.id);
        displayAttachments(data.attachments);
    }

    // Populate table with cash advance details
    console.log('=== CASH ADVANCE DETAILS DEBUG ===');
    console.log('Raw cashAdvanceDetails from API:', data.cashAdvanceDetails);
    if (data.cashAdvanceDetails && data.cashAdvanceDetails.length > 0) {
        data.cashAdvanceDetails.forEach((detail, index) => {
            console.log(`Detail ${index + 1}:`, {
                category: detail.category,
                accountName: detail.accountName,
                coa: detail.coa,
                description: detail.description,
                amount: detail.amount,
                amountType: typeof detail.amount,
                amountRaw: JSON.stringify(detail.amount)
            });
        });
    }
    console.log('=== END CASH ADVANCE DETAILS DEBUG ===');
    
    await populateTable(data.cashAdvanceDetails || []);
    
    // Calculate and display total amount
    calculateTotalAmount();

    // Populate superior employees with existing data
    await populateSuperiorEmployeesWithData(data);

    // Populate superior employee dropdowns for editing
    if (data.transactionType) {
        await populateAllSuperiorEmployeeDropdowns(data.transactionType);
    }

    // Handle rejection remarks display
    displayRejectionRemarks(data);

    // Check if status is not Draft and make fields read-only
    if (data.status && data.status.toLowerCase() !== 'draft' && data.status.toLowerCase() !== 'revision') {
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
    
    // Ensure closedBy visibility is set correctly after all data is populated
    if (typeof toggleClosedByVisibility === 'function') {
        toggleClosedByVisibility();
    }
}

// Function to toggle editable fields based on cash advance status
function toggleEditableFields(isEditable) {
    // List all input fields that should be controlled by editable state
    const editableFields = [
        'requesterSearch', // Requester name search input
        'purpose',
        'departmentId',
        'transactionType',
        'remarks',
        'paidToSearch'
    ];
    
    // Fields that should always be disabled/readonly (autofilled)
    const alwaysDisabledFields = [
        'cashAdvanceNo',
        'status',
        'departmentId',
        'employeeNIK',
        'employeeName'
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
    const tableInputs = document.querySelectorAll('#tableBody input, #tableBody textarea, #tableBody select');
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
            if (!input.classList.contains('coa')) {
                input.classList.remove('bg-gray-100');
                input.classList.add('bg-white');
            }
        }
    });
    
    // Handle COA fields - always disabled but follow the category selection logic
    const coaInputs = document.querySelectorAll('.coa');
    coaInputs.forEach(input => {
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
    const updateButton = document.querySelector('button[onclick="updateCash(false)"]');
    const submitButton = document.querySelector('button[onclick="updateCash(true)"]');
    
    [deleteButton, updateButton, submitButton].forEach(button => {
        if (button) {
            button.disabled = !isEditable;
            if (!isEditable) {
                button.classList.add('opacity-50', 'cursor-not-allowed');
                button.title = 'You can only perform this action on cash advances with Draft status';
            } else {
                button.classList.remove('opacity-50', 'cursor-not-allowed');
                button.title = '';
            }
        }
    });
    
    // Handle approval fields
    const selects = [
        { id: 'Approval.PreparedById', searchId: 'Approval.PreparedByIdSearch' },
        { id: 'Approval.CheckedById', searchId: 'Approval.CheckedByIdSearch' },
        { id: 'Approval.AcknowledgedById', searchId: 'Approval.AcknowledgedByIdSearch' },
        { id: 'Approval.ApprovedById', searchId: 'Approval.ApprovedByIdSearch' },
        { id: 'Approval.ReceivedById', searchId: 'Approval.ReceivedByIdSearch' },
        { id: 'Approval.ClosedById', searchId: 'Approval.ClosedByIdSearch' }
    ];
    
    selects.forEach(fieldInfo => {
        const field = document.getElementById(fieldInfo.id);
        const searchInput = document.getElementById(fieldInfo.searchId);
        if (field && searchInput) {
            if (fieldInfo.id === 'Approval.PreparedById') {
                const userId = getUserId();
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

// Function to populate superior employees with existing data from API
async function populateSuperiorEmployeesWithData(data) {
    console.log('Populating superior employees with data:', data);
    
    // Use the comprehensive approval field handling similar to detailPR.js
    await populateApprovalFields(data);
    
    // Setup event listeners for approval field search inputs
    setupApprovalFieldEventListeners();
}

// Comprehensive approval field handling similar to detailPR.js
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
        receivedName: data.receivedName,
        closedById: data.closedById,
        closedName: data.closedName
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
        receivedName: data.receivedName,
        closedById: data.closedById,
        closedName: data.closedName
    });
    
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
    
    // Populate each approval field
    for (const [fieldKey, fieldConfig] of Object.entries(approvalFieldMapping)) {
        const searchInput = document.getElementById(fieldConfig.searchInput);
        const selectElement = document.getElementById(fieldConfig.selectElement);
        
        console.log(`Processing field: ${fieldKey}`);
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

// Function to display revised remarks from API
function displayRevisionRemarks(data) {
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

// Function to display rejection remarks if available
function displayRejectionRemarks(data) {
    // Check if status is Rejected
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
        // Check for various possible rejection remarks fields
        let rejectionRemarks = '';
        let rejectedByName = '';
        
        // For cash advance, check for rejectedRemarks field first
        if (data.rejectedRemarks) {
            rejectionRemarks = data.rejectedRemarks;
        } else if (data.remarksRejectByChecker) {
            rejectionRemarks = data.remarksRejectByChecker;
        } else if (data.remarksRejectByAcknowledger) {
            rejectionRemarks = data.remarksRejectByAcknowledger;
        } else if (data.remarksRejectByApprover) {
            rejectionRemarks = data.remarksRejectByApprover;
        } else if (data.remarksRejectByReceiver) {
            rejectionRemarks = data.remarksRejectByReceiver;
        } else if (data.remarks) {
            rejectionRemarks = data.remarks;
        }
        
        // Get rejected by name for cash advance
        if (data.rejectedByName) {
            rejectedByName = data.rejectedByName;
        }
        
        if (rejectionRemarks.trim() !== '') {
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
                ${(() => { console.log(`DEBUG: detail.amount raw value: "${detail.amount}", type: ${typeof detail.amount}`); return ''; })()}
                <input type="text" class="total w-full" value="${detail.amount ? Number(detail.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}" required oninput="calculateTotalAmount()"/>
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
        if (detail.category && detail.accountName) {
            // For initial load, we'll populate the dropdown options without clearing the existing value
            // This prevents the account name from being replaced during initial load
            await populateAccountNameDropdownForInitialLoad(
                newRow, 
                detail.category, 
                departmentId, 
                transactionType, 
                detail.accountName, 
                detail.coa
            );
        }

        // Setup amount formatting for existing rows (same as new rows)
        const amountInput = newRow.querySelector('.total');
        if (amountInput) {
            amountInput.addEventListener('blur', function() {
                formatNumberWithDecimals(this);
            });
            amountInput.addEventListener('input', function() {
                formatNumberAsYouType(this);
            });
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
        const displayName = user.fullName || user.superiorFullName || user.name || '';
        option.innerText = displayName;
        option.onclick = function() {
            const userId = user.id || user.superiorUserId || '';
            console.log(`Selected user: ${displayName} (${userId})`);
            searchInput.value = displayName;
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



// Function to fetch cash advance details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    cashAdvanceId = urlParams.get('ca-id');
    
    if (cashAdvanceId) {
        fetchCashAdvanceDetails(cashAdvanceId);
    } else {
        console.warn('No cash advance ID found in URL parameters');
        Swal.fire('Error!', 'Cash advance ID not found in URL.', 'error');
    }
};

async function updateCashAdvance(isSubmit = false) {
    console.log("masuk");
    if (!cashAdvanceId) {
        Swal.fire({
            title: 'Error!',
            text: 'Cash advance ID not found',
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
            text: 'You can only update cash advances with Draft status',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        return;
    }

    // Show confirmation dialog only for submit
    if (isSubmit) {
        const result = await Swal.fire({
            title: 'Submit Cash Advance',
            text: 'Are you sure you want to submit this cash advance? You won\'t be able to edit it after submission.',
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
        formData.append('Id', cashAdvanceId);
        formData.append('CashAdvanceNo', document.getElementById('cashAdvanceNo').value);
        
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
            text: `Please wait while we ${isSubmit ? 'submit' : 'update'} the cash advance.`,
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
        const departmentSelect = document.getElementById('departmentId');
        formData.append('DepartmentId', departmentSelect.value);
        
        // Always use current date for submission
        const currentDate = new Date().toISOString().split('T')[0];
        formData.append('SubmissionDate', currentDate);
        
        // Use the transaction type from the select
        const transactionTypeSelect = document.getElementById('transactionType');
        formData.append('TransactionType', transactionTypeSelect.value);
        
        formData.append('Purpose', document.getElementById('purpose').value);
        formData.append('Remarks', document.getElementById('remarks').value || '');
        // Add EmployeeNIK field which is required by the API
        formData.append('EmployeeNIK', document.getElementById('employeeNIK').value);

        //pay toCode
        formData.append('PayToCode', document.getElementById('paidTo').value);
        
        // Add currency field
        formData.append('Currency', document.getElementById('Currency').value);

        // Approvals with special handling for preparedBy
        const preparedByValue = document.getElementById('Approval.PreparedById')?.value;
        const currentUserId = getUserId();
 
        // Use current user ID if preparedBy is empty
        const finalPreparedById = preparedByValue || currentUserId;
        
        // Debug logging for approval field values
        console.log('Approval field values being submitted:');
        console.log('PreparedById:', finalPreparedById);
        console.log('CheckedById:', document.getElementById('Approval.CheckedById')?.value);
        console.log('AcknowledgedById:', document.getElementById('Approval.AcknowledgedById')?.value);
        console.log('ApprovedById:', document.getElementById('Approval.ApprovedById')?.value);
        console.log('ReceivedById:', document.getElementById('Approval.ReceivedById')?.value);
        console.log('ClosedById:', document.getElementById('Approval.ClosedById')?.value);
        
        formData.append('PreparedById', finalPreparedById);
        formData.append('CheckedById', document.getElementById('Approval.CheckedById')?.value);
        formData.append('AcknowledgedById', document.getElementById('Approval.AcknowledgedById')?.value);
        formData.append('ApprovedById', document.getElementById('Approval.ApprovedById')?.value);
        formData.append('ReceivedById', document.getElementById('Approval.ReceivedById')?.value);
        formData.append('ClosedById', document.getElementById('Approval.ClosedById')?.value);
        
        // Cash advance details
        const rows = document.querySelectorAll('#tableBody tr');
        
        console.log('=== AMOUNT DEBUGGING START ===');
        rows.forEach((row, index) => {
            formData.append(`CashAdvanceDetails[${index}].Category`, row.querySelector('.category-input').value);
            formData.append(`CashAdvanceDetails[${index}].AccountName`, row.querySelector('.account-name').value);
            formData.append(`CashAdvanceDetails[${index}].Coa`, row.querySelector('.coa').value);
            formData.append(`CashAdvanceDetails[${index}].Description`, row.querySelector('.description').value);
            
            const rawAmount = row.querySelector('.total').value || '0';
            console.log(`Row ${index + 1} - Raw amount from DOM: "${rawAmount}"`);
            
            const cleanedAmount = rawAmount.toString().replace(/,/g, '');
            console.log(`Row ${index + 1} - After removing commas: "${cleanedAmount}"`);
            
            const parsedAmount = parseFloat(cleanedAmount);
            console.log(`Row ${index + 1} - After parseFloat: ${parsedAmount}`);
            
            // Normalize amount for backend: strip trailing .00 to avoid being interpreted as cents multiplier
            const normalizedAmount = cleanedAmount.replace(/\.00$/, '');
            console.log(`Row ${index + 1} - Final amount being sent to server: "${normalizedAmount}"`);
            formData.append(`CashAdvanceDetails[${index}].Amount`, normalizedAmount);
        });
        console.log('=== AMOUNT DEBUGGING END ===');
        
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
        
        // Debug: Log all FormData entries
        console.log('=== FORM DATA DEBUG START ===');
        for (let [key, value] of formData.entries()) {
            console.log(`FormData entry: ${key} = ${value}`);
        }
        console.log('=== FORM DATA DEBUG END ===');

        // Submit the form data
        makeAuthenticatedRequest(`/api/cash-advance/${cashAdvanceId}`, {
            method: 'PUT',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                console.log("Cash advance submitted successfully");
                Swal.fire({
                    title: 'Success!',
                    text: `Cash advance has been ${isSubmit ? 'submitted' : 'updated'} successfully.`,
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    // Check if this is an update or submit operation for a Draft document
                    if (status === 'Draft') {
                        // Redirect to menu page for Draft updates and submissions
                        goToMenuCash();
                    } else {
                        // Reload the cash advance data to show updated information for other cases
                        fetchCashAdvanceDetails(cashAdvanceId);
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
                return parseJsonSafe(response).then(errorData => {
                    console.log("errorData", errorData);
                    throw new Error(errorData.message || `Failed to ${isSubmit ? 'submit' : 'update'} cash advance. Status: ${response.status}`);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error!',
                text: `Error ${isSubmit ? 'submitting' : 'updating'} cash advance: ` + error.message,
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

// Function specifically for submitting cash advance
function updateCash(isSubmit = true) {
    console.log(isSubmit);
    updateCashAdvance(isSubmit);
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
            <p style="margin: 0;">Blok DD-7 & DD-6 Kawasan Industri MM2100</p>
            <p style="margin: 0;">Danau Indah, Cikarang Barat Kab. Bekasi Jawa Barat 17847</p>
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

// Function to hide Update and Submit buttons when status is Revision
function hideUpdateSubmitButtons() {
    console.log('Status is Revision - hiding Update and Submit buttons');
    
    // Find and hide the buttons by their onclick attributes
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        const onclick = button.getAttribute('onclick');
        if (onclick && (onclick.includes('updateCash(false)') || onclick.includes('updateCash(true)'))) {
            button.style.display = 'none';
        }
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
    
    // Hide delete document button
    const deleteDocumentButton = document.querySelector('button[onclick="confirmDelete()"]');
    if (deleteDocumentButton) {
        deleteDocumentButton.style.display = 'none';
    }
    
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

async function fetchBusinessPartners() {
    try {
        const response = await fetch(`${BASE_URL}/api/business-partners/type/all`);
        if (!response.ok) throw new Error('Network response was not ok: ' + response.statusText);
        const data = await parseJsonSafe(response);
        if (!data) throw new Error('Invalid JSON response for business partners');
        console.log("Business Partners data:", data);
        setupBusinessPartnerSearch(data.data || data);
    } catch (error) {
        console.error('Error fetching business partners:', error);
    }
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
        window.filterBusinessPartners = function () {
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
                option.onclick = function () {
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
        document.addEventListener('click', function (event) {
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

async function fetchCashAdvanceDetails(cashAdvanceId) {
    try {
        const response = await makeAuthenticatedRequest(`/api/cash-advance/${encodeURIComponent(cashAdvanceId)}`);
        if (!response.ok) {
            let message = `HTTP error! Status: ${response.status}`;
            try {
                const text = await response.text();
                if (text) {
                    try {
                        const err = JSON.parse(text);
                        message = err.message || message;
                    } catch (e) {
                        message = text;
                    }
                }
            } catch (e) {}
            throw new Error(message);
        }
        const responseData = await parseJsonSafe(response);
        if (!responseData || typeof responseData !== 'object') {
            throw new Error('Invalid JSON response');
        }
        if (responseData.data) {
            console.log("API Response Data:", responseData.data);
            console.log("Requester ID from API:", responseData.data.requesterId);
            console.log("Requester Name from API:", responseData.data.requesterName);
            console.log("Transaction Type from API:", responseData.data.transactionType);
            
            // Store current values first
            window.currentValues = {
                department: responseData.data.departmentName,
                departmentId: responseData.data.departmentId,
                transactionType: responseData.data.transactionType,
                status: responseData.data.status 
            };
            
            // Fetch dropdown options FIRST, especially categories
            await fetchDropdownOptions(responseData.data);
            
            // Then populate cash advance details so categories can be properly matched
            await populateCashAdvanceDetails(responseData.data);
            
            const isEditable = responseData.data && responseData.data.status === 'Draft';
            toggleEditableFields(isEditable);
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Error fetching cash advance details: ' + error.message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to fetch all dropdown options (consistent with detailPR.js pattern)
function fetchDropdownOptions(caData = null) {
    fetchDepartments();
    fetchUsers(caData);
    fetchTransactionType();
    fetchBusinessPartners();
    fetchCurrencies(caData);
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
        
        const result = await parseJsonSafe(response);
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
                            const userResult = await parseJsonSafe(userResponse);
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
        'Approval.PreparedById': 'PR',
        'Approval.CheckedById': 'CH',
        'Approval.AcknowledgedById': 'AC',
        'Approval.ApprovedById': 'AP',
        'Approval.ReceivedById': 'RE',
        'Approval.ClosedById': 'CL'
    };
    return levelMap[fieldId] || null;
}

// Function to populate superior employee dropdown with provided data
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
    const documentType = 'CA'; // Cash Advance
    
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
        
        const result = await parseJsonSafe(response);
        console.log('API Response:', result);
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch superior employees');
        }
        
        const allSuperiors = result.data;
        console.log('All superiors from API:', allSuperiors);
        
        // Map transaction types from the form to API transaction types
        const transactionTypeMap = {
            'NRM': 'NRM',
            'Entertainment': 'EN',
            'Medical': 'ME',
            'Travelling': 'TR',
            'Personal Loan': 'LO',
            'Others': 'OT',
            'Golf Competition': 'GC'
        };
        
        const apiTransactionType = transactionTypeMap[transactionType] || 'EN'; // Default to EN if not found
        console.log(`Mapping transaction type '${transactionType}' to API type '${apiTransactionType}'`);
        
        // Filter by transaction type
        const filteredSuperiors = allSuperiors.filter(superior => superior.typeTransaction === apiTransactionType);
        console.log(`Found ${filteredSuperiors.length} superiors with ${apiTransactionType} transaction type`);
        
        // Process superiors and get full names
        const superiorsWithFullNames = [];
        for (const superior of filteredSuperiors) {
            try {
                let fullName = superior.superiorName; // Default to the name from API
                
                // Try to get full name from requesters cache
                if (window.requesters && window.requesters.length > 0) {
                    const user = window.requesters.find(u => u.id === superior.superiorUserId);
                    if (user && user.fullName) {
                        fullName = user.fullName;
                        console.log(`Found full name in cache for ${superior.superiorUserId}: ${fullName}`);
                    }
                }
                
                // Create superior object with proper structure
                superiorsWithFullNames.push({
                    superiorUserId: superior.superiorUserId,
                    superiorFullName: fullName,
                    superiorLevel: superior.superiorLevel,
                    typeTransaction: superior.typeTransaction
                });
                
            } catch (error) {
                console.warn(`Error processing superior ${superior.superiorUserId}:`, error);
                superiorsWithFullNames.push({
                    superiorUserId: superior.superiorUserId,
                    superiorFullName: superior.superiorName,
                    superiorLevel: superior.superiorLevel,
                    typeTransaction: superior.typeTransaction
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
            { id: 'Approval.ReceivedById', level: 'RE' },
            { id: 'Approval.ClosedById', level: 'CL' }
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

// Function to setup event listeners for approval field search inputs
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
        input.addEventListener('blur', function() {
            formatNumberWithDecimals(this);
        });
        
        input.addEventListener('input', function() {
            formatNumberAsYouType(this);
        });
    });
    
    // Calculate initial total
    calculateTotalAmount();
});