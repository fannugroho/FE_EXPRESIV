// Global variable for file uploads
let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep
let settlementData = null;
let currentRequesterData = null; // Store current requester data globally

let settlementId; // Declare global variable
let currentTab; // Declare global variable for tab

// Function to get available categories based on department and transaction type from API
async function getAvailableCategories(departmentId, transactionType) {
    if (!departmentId || !transactionType) return [];
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/categories?departmentId=${departmentId}&menu=Cash Advance Settlement&transactionType=${transactionType}`);
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
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/account-names?category=${encodeURIComponent(category)}&departmentId=${departmentId}&menu=Cash Advance Settlement&transactionType=${transactionType}`);
        if (!response.ok) {
            throw new Error('Failed to fetch account names');
        }
        const data = await response.json();
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
        const response = await fetch(`${BASE_URL}/api/expenses/coa?category=${encodeURIComponent(category)}&accountName=${encodeURIComponent(accountName)}&departmentId=${departmentId}&menu=Cash Advance Settlement&transactionType=${transactionType}`);
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
    
    const departmentSelect = document.getElementById("department");
    const transactionTypeSelect = document.getElementById("TransactionType");
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
    
    const departmentSelect = document.getElementById("department");
    const transactionTypeSelect = document.getElementById("TransactionType");
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
    
    console.log(`populateAccountNameDropdownForInitialLoad called with:`, {
        category,
        departmentId,
        transactionType,
        existingAccountName,
        existingCoa
    });
    
    if (!accountNameSelect) {
        console.error('Account name select not found');
        return;
    }
    
    if (!category) {
        console.warn('No category provided');
        showValidationMessage(accountNameSelect, 'Please select a category first');
        return;
    }
    
    console.log(`Fetching account names for category: ${category}`);
    const accountNames = await getAvailableAccountNames(category, departmentId, transactionType);
    console.log(`Found ${accountNames.length} account names:`, accountNames);
    
    let existingAccountNameFound = false;
    
    // Clear the dropdown and add the default option
    accountNameSelect.innerHTML = '<option value="">Select Account Name</option>';
    
    if (existingAccountName) {
        const existingOption = document.createElement('option');
        existingOption.value = existingAccountName;
        existingOption.textContent = existingAccountName;
        existingOption.dataset.coa = existingCoa || '';
        existingOption.dataset.remarks = '';
        existingOption.selected = true;
        accountNameSelect.appendChild(existingOption);
        console.log(`✅ Preserved existing account name: ${existingAccountName}`);
    } else {
        console.log('No existing account name to preserve');
    }
    
    accountNames.forEach(item => {
        if (existingAccountName && item.accountName === existingAccountName) {
            existingAccountNameFound = true;
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
        const existingOption = accountNameSelect.querySelector(`option[value="${existingAccountName}"]`);
        if (existingOption) {
            existingOption.textContent = `${existingAccountName} (Historical)`;
            existingOption.dataset.remarks = 'Historical data - no longer in master data';
            existingOption.style.fontStyle = 'italic';
            existingOption.style.color = '#6b7280';
        }
        console.log(`Marked account name as historical: ${existingAccountName}`);
    }
    
    if (existingCoa && coaInput) {
        coaInput.value = existingCoa;
    }
    
    // Store the current selected value before cloning
    const currentSelectedValue = accountNameSelect.value;
    console.log(`Current selected value before cloning: ${currentSelectedValue}`);
    
    const newAccountNameSelect = accountNameSelect.cloneNode(true);
    accountNameSelect.parentNode.replaceChild(newAccountNameSelect, accountNameSelect);
    
    // Restore the selected value after cloning
    if (currentSelectedValue) {
        newAccountNameSelect.value = currentSelectedValue;
        console.log(`Restored selected value after cloning: ${newAccountNameSelect.value}`);
    }
    
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
    
    // Debug: Log final dropdown state
    console.log(`Final dropdown state for ${existingAccountName}:`);
    console.log(`Selected value: ${newAccountNameSelect.value}`);
    console.log(`Selected text: ${newAccountNameSelect.options[newAccountNameSelect.selectedIndex]?.textContent}`);
    console.log(`Total options: ${newAccountNameSelect.options.length}`);
    console.log(`All option values:`, Array.from(newAccountNameSelect.options).map(opt => opt.value));
}

// Function to fetch Settlement details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    settlementId = urlParams.get('settle-id') || urlParams.get('settlement-id'); // Support both parameter names
    currentTab = urlParams.get('tab'); // Get the tab parameter
    
    if (settlementId) {
        fetchSettlementDetails(settlementId);
    }
    
    // Initialize dropdowns
    fetchDropdownOptions();
    
    // Add file input change handler
    const fileInput = document.getElementById('attachments');
    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            const files = Array.from(event.target.files);
            files.forEach(file => {
                uploadedFiles.push(file);
            });
            updateAttachmentsDisplay();
            // Clear the input so the same file can be selected again
            event.target.value = '';
        });
    }
    
    // Apply tab-based behavior after data is loaded
    setTimeout(() => {
        applyTabBasedBehavior();
    }, 1000);
};

function fetchSettlementDetails(settlementId) {
    fetch(`${BASE_URL}/api/settlements/${settlementId}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(response => {
            if (response.status && response.data) {
                console.log(response.data);
                populateSettlementDetails(response.data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error fetching Settlement details: ' + error.message);
        });
}

function populateSettlementDetails(data) {
    // Store settlement data globally for use in attachment functions
    settlementData = data;
    
    // Populate basic Settlement information from DTO
    document.getElementById('settlementNumber').value = data.settlementNumber || '';
    document.getElementById('settlementRefNo').value = data.settlementRefNo || '';
    document.getElementById('purpose').value = data.purpose || '';
    
    // Handle paid to field with business partner search
    const paidToSearchInput = document.getElementById('paidToSearch');
    const paidToHiddenInput = document.getElementById('paidTo');
    if (paidToSearchInput && paidToHiddenInput) {
        if (data.payToCode && data.payToName) {
            paidToSearchInput.value = `${data.payToCode} - ${data.payToName}`;
            paidToHiddenInput.value = data.payToCode;
        } else {
            paidToSearchInput.value = data.payToCode || '';
            paidToHiddenInput.value = data.payToCode || '';
        }
    }
    
    // Handle requester search field  
    const requesterSearchInput = document.getElementById('requesterSearch');
    const requesterIdInput = document.getElementById('RequesterId');
    if (requesterSearchInput && data.requesterName) {
        requesterSearchInput.value = data.requesterName;
        if (data.requester && requesterIdInput) {
            requesterIdInput.value = data.requester;
        }
        
        // Store requester data globally for later use
        currentRequesterData = {
            id: data.requester,
            name: data.requesterName
        };
    }
    
    // Handle cash advance reference dropdown
    const cashAdvanceDropdown = document.getElementById('cashAdvanceReferenceId');
    if (cashAdvanceDropdown && data.cashAdvanceReferenceId) {
        // Store the cash advance ID to select it later when options are loaded
        window.selectedCashAdvanceId = data.cashAdvanceReferenceId;
        console.log('Set selectedCashAdvanceId from API data:', data.cashAdvanceReferenceId);
    }
    document.getElementById('remarks').value = data.remarks || '';

    // Set department and transaction type directly
    const departmentSelect = document.getElementById("department");
    if (departmentSelect && data.departmentName) {
        departmentSelect.innerHTML = `<option value="${data.departmentId || ''}" selected>${data.departmentName}</option>`;
    }
    
    const transactionTypeSelect = document.getElementById("TransactionType");
    if (transactionTypeSelect && data.transactionType) {
        transactionTypeSelect.innerHTML = `<option value="${data.transactionType}" selected>${data.transactionType}</option>`;
    }

    // Format and set dates
    const submissionDate = data.submissionDate ? data.submissionDate.split('T')[0] : '';
    document.getElementById('submissionDate').value = submissionDate;
    
    // Set status
    const statusSelect = document.getElementById('status');
    if (statusSelect && data.status) {
        statusSelect.innerHTML = `<option value="${data.status}" selected>${data.status}</option>`;
    }
    
    // Handle settlement items (amount breakdown)
    if (data.settlementItems && data.settlementItems.length > 0) {
        populateSettlementItems(data.settlementItems);
    }
    
    // Display attachments if they exist
    if (data.attachments && data.attachments.length > 0) {
        displayAttachments(data.attachments);
    }
    
    // Display revision remarks if they exist
    displayRevisionRemarks(data);
    
    // Display rejection remarks if they exist
    displayRejectionRemarks(data);
    
    // Populate approval fields
    populateApprovalFields(data);
    
    // Make fields editable for revision status
    const isEditable = data.status === 'Revision';
    toggleEditableFields(isEditable);
    
    // Setup submit button for revision status
    if (data.status === 'Revision') {
        const submitButtonContainer = document.querySelector('.flex.justify-between.space-x-4.mt-6');
        if (submitButtonContainer) {
            submitButtonContainer.style.display = 'flex';
        }
    }
    
    // Fetch dropdown options with approval data
    fetchDropdownOptions(data);
    
    // Apply tab-based behavior after form is populated
    applyTabBasedBehavior();
}

// Function to fetch dropdown options
function fetchDropdownOptions(approvalData = null) {
    fetchDepartments();
    fetchUsers(approvalData);
    fetchTransactionType();
    fetchBusinessPartners();
    loadCashAdvanceOptions();
    
    // Superior employee dropdowns will be initialized after users are loaded
    // See populateUserSelects function for the trigger
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
    
    // Add event listener to refresh category dropdowns when department changes
    departmentSelect.addEventListener('change', function() {
        refreshAllCategoryDropdowns();
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
    
    // Auto-fill preparedBy with current user (like addSettle.js)
    autoFillPreparedBy(users);
    
    // Setup event listeners for approval fields
    setupApprovalFieldEventListeners();
    
    // Now that users are loaded in cache, check if we need to load superior employees
    console.log(`✅ Users loaded into cache (${users.length} users). Cache available for superior employee lookup.`);
    
    // If transaction type is already available, load superior employees now
    const transactionTypeSelect = document.getElementById("TransactionType");
    if (transactionTypeSelect && transactionTypeSelect.value) {
        console.log(`Transaction type already available: ${transactionTypeSelect.value}, loading superior employees...`);
        populateAllSuperiorEmployeeDropdowns(transactionTypeSelect.value);
    }

    // Populate RequesterId dropdown with search functionality
    const requesterSelect = document.getElementById("RequesterId");
    if (requesterSelect) {
        // Clear existing options first
        requesterSelect.innerHTML = '<option value="">Select a requester</option>';
        
        users.forEach(user => {
            const option = document.createElement("option");
            option.value = user.id;
            option.textContent = `${user.fullName} (${user.kansaiEmployeeId})`;
            requesterSelect.appendChild(option);
        });
        
        // Set selected value if approval data is provided
        if (approvalData && approvalData.requesterId) {
            requesterSelect.value = approvalData.requesterId;
        }
    }

    // Populate approval fields if approval data is provided
    if (approvalData) {
        const approvalFields = [
            { searchId: 'preparedBySearch', name: approvalData.preparedName },
            { searchId: 'checkedBySearch', name: approvalData.checkedName },
            { searchId: 'acknowledgedBySearch', name: approvalData.acknowledgedName },
            { searchId: 'approvedBySearch', name: approvalData.approvedName },
            { searchId: 'receivedBySearch', name: approvalData.receivedName }
        ];
        
        approvalFields.forEach(field => {
            const searchInput = document.getElementById(field.searchId);
            if (searchInput && field.name) {
                searchInput.value = field.name;
            }
        });
    }
}

// Function to fetch transaction types from API (aligned with detailSettle.js)
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

// Function to populate transaction type select (aligned with detailSettle.js)
function populateTransactionTypeSelect(transactionTypes) {
    const transactionTypeSelect = document.getElementById("TransactionType");
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
        
        // Refresh category dropdowns with new transaction type
        refreshAllCategoryDropdowns();
        
        // Refresh superior employee dropdowns with new transaction type
        populateAllSuperiorEmployeeDropdowns(this.value);
    });
    
    // If we have a current value and it wasn't matched by text, try to select by value
    if (currentValue && newTransactionTypeSelect.value !== currentValue) {
        newTransactionTypeSelect.value = currentValue;
    }
    
    // Initialize superior employee dropdowns with the current transaction type
    const finalTransactionType = newTransactionTypeSelect.value;
    if (finalTransactionType) {
        populateAllSuperiorEmployeeDropdowns(finalTransactionType);
    }
}

// Function to fetch business partners
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

// Function to setup business partner search
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

// Function to filter users for approval fields
function filterUsers(fieldId) {
    const searchInput = document.getElementById(fieldId + 'Search');
    const searchText = searchInput ? searchInput.value.toLowerCase() : '';
    const dropdown = document.getElementById(fieldId + 'Dropdown');
    
    console.log(`filterUsers called for ${fieldId} with search text: "${searchText}"`);
    
    if (!searchInput || !dropdown) {
        console.error(`Search input or dropdown not found for ${fieldId}`);
        return;
    }
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    // For approval fields, use superior employees if available
    let usersToFilter = [];
    
    // Check if this is an approval field (checkedBy, acknowledgedBy, approvedBy, receivedBy)
    const approvalFields = ['checkedBy', 'acknowledgedBy', 'approvedBy', 'receivedBy'];
    if (approvalFields.includes(fieldId)) {
        // Use superior employees for approval fields
        const levelMap = {
            'checkedBy': 'CH',
            'acknowledgedBy': 'AC',
            'approvedBy': 'AP',
            'receivedBy': 'RE'
        };
        const superiorLevel = levelMap[fieldId];
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
        
        // Get the display name (prioritize fullName, then superiorFullName)
        const displayName = user.fullName || user.superiorFullName || user.name || user.superiorName || 'Unknown User';
        console.log(`Creating dropdown option for user:`, user);
        console.log(`Display name: ${displayName}`);
        
        option.innerText = displayName;
        option.onclick = function() {
            const userName = user.fullName || user.superiorFullName || user.name || user.superiorName || 'Unknown User';
            const userId = user.id || user.superiorUserId || '';
            console.log(`Selected user: ${userName} (${userId})`);
            searchInput.value = userName;
            const hiddenInput = document.getElementById(fieldId);
            if (hiddenInput) {
                hiddenInput.value = userId;
            }
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

// Function to filter requesters
function filterRequesters() {
    const searchInput = document.getElementById('requesterSearch');
    const dropdown = document.getElementById('requesterDropdown');
    
    if (!searchInput || !dropdown) return;
    
    const searchText = searchInput.value.toLowerCase();
    dropdown.innerHTML = '';
    
    if (!window.requesters) return;
    
    const filteredRequesters = window.requesters.filter(requester => 
        requester.fullName && requester.fullName.toLowerCase().includes(searchText)
    );
    
    filteredRequesters.forEach(requester => {
        const option = document.createElement('div');
        option.className = 'p-2 cursor-pointer hover:bg-gray-100';
        option.innerHTML = requester.fullName;
        option.onclick = function() {
            searchInput.value = requester.fullName;
            document.getElementById('RequesterId').value = requester.id;
            
            // Update global requester data
            currentRequesterData = {
                id: requester.id,
                name: requester.fullName
            };
            console.log("Updated global requester data:", currentRequesterData);
            
            dropdown.classList.add('hidden');
            
            // Update department
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
        dropdown.appendChild(option);
    });
    
    if (filteredRequesters.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'No matching requesters';
        dropdown.appendChild(noResults);
    }
    
    dropdown.classList.remove('hidden');
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
        
        // Map transaction type to API transaction type
        const transactionTypeMap = {
            'NRM': 'NRM',
            'Entertainment': 'EN',
            'Golf Competition': 'GC',
            'Medical': 'ME',
            'Others': 'OT',
            'Travelling': 'TR',
            'Personal Loan': 'LO',
            'Business Trip': 'BT'
        };
        
        const apiTransactionType = transactionTypeMap[transactionType] || transactionType;
        console.log(`Mapping transaction type '${transactionType}' to API type '${apiTransactionType}'`);
        
        // Filter by transaction type
        const filteredSuperiors = allSuperiors.filter(superior => superior.typeTransaction === apiTransactionType);
        console.log(`Found ${filteredSuperiors.length} superiors with ${apiTransactionType} transaction type`);
        
        // Ensure we have users loaded in cache before processing superiors
        if (!window.requesters || window.requesters.length === 0) {
            console.log('⚠️ Users cache is empty, this might cause issues with full name lookup');
        }
        
        // Fetch full user details for each superior to get full names (like revisionCash.js)
        const superiorsWithFullNames = [];
        
        for (const superior of filteredSuperiors) {
            try {
                // ALWAYS try to get full name from cached users first (this is our best source)
                let fullName = superior.superiorName; // Default to the username from API
                let foundInCache = false;
                
                console.log(`🔍 Looking up superior ${superior.superiorUserId} (${superior.superiorName}) in cache...`);
                
                if (window.requesters && window.requesters.length > 0) {
                    const user = window.requesters.find(u => u.id === superior.superiorUserId);
                    if (user) {
                        console.log(`Found user in cache:`, user);
                        if (user.fullName && user.fullName.trim() !== '') {
                            fullName = user.fullName;
                            foundInCache = true;
                            console.log(`✅ Using cached full name for ${superior.superiorUserId}: ${fullName}`);
                        } else {
                            console.log(`⚠️ User found in cache but fullName is empty/null for ${superior.superiorUserId}`);
                        }
                    } else {
                        console.log(`❌ User ${superior.superiorUserId} not found in cache of ${window.requesters.length} users`);
                    }
                } else {
                    console.log(`❌ No requesters cache available`);
                }
                
                // If not found in cache, fetch user details from API
                if (!foundInCache) {
                    try {
                        console.log(`User ${superior.superiorUserId} not found in cache, fetching from API...`);
                        const userResponse = await fetch(`${BASE_URL}/api/users/${superior.superiorUserId}`);
                        if (userResponse.ok) {
                            const userResult = await userResponse.json();
                            console.log(`Full API response for ${superior.superiorUserId}:`, userResult);
                            
                            // Try different ways to get the full name
                            if (userResult.status && userResult.data) {
                                const data = userResult.data;
                                
                                // Method 1: Use fullName if it exists and is not null
                                if (data.fullName && data.fullName.trim() !== '') {
                                    fullName = data.fullName;
                                    console.log(`✅ Found fullName in userResult.data.fullName: ${fullName}`);
                                }
                                // Method 2: Build from firstName + lastName if fullName is null/empty
                                else if (data.firstName || data.lastName) {
                                    const firstName = data.firstName || '';
                                    const lastName = data.lastName || '';
                                    fullName = `${firstName} ${lastName}`.trim();
                                    console.log(`✅ Built fullName from firstName + lastName: ${fullName}`);
                                }
                                // Method 3: Use username as last resort
                                else if (data.username) {
                                    fullName = data.username;
                                    console.log(`✅ Using username as fallback: ${fullName}`);
                                }
                                else {
                                    console.warn(`❌ Could not determine full name for ${superior.superiorUserId}, using original superior name`);
                                    console.log(`Available data:`, data);
                                }
                            } else {
                                console.warn(`❌ Invalid API response structure for ${superior.superiorUserId}:`, userResult);
                            }
                        } else {
                            console.warn(`Failed to fetch user details for ${superior.superiorUserId}: ${userResponse.status}`);
                        }
                    } catch (userError) {
                        console.warn(`Failed to fetch user details for ${superior.superiorUserId}:`, userError);
                    }
                }
                
                const superiorData = {
                    id: superior.superiorUserId,
                    superiorUserId: superior.superiorUserId,
                    fullName: fullName,
                    superiorFullName: fullName,
                    superiorLevel: superior.superiorLevel,
                    transactionType: superior.typeTransaction,
                    originalSuperiorName: superior.superiorName  // Keep original for debugging
                };
                
                console.log(`💾 Storing superior data:`, superiorData);
                superiorsWithFullNames.push(superiorData);
                
            } catch (error) {
                console.error(`Error processing superior ${superior.superiorUserId}:`, error);
                superiorsWithFullNames.push({
                    id: superior.superiorUserId,
                    superiorUserId: superior.superiorUserId,
                    fullName: superior.superiorName,
                    superiorFullName: superior.superiorName,
                    superiorLevel: superior.superiorLevel,
                    transactionType: superior.typeTransaction
                });
            }
        }
        
        // Store superior employees globally for use in filterUsers
        window.superiorEmployees = {};
        console.log('Initialized window.superiorEmployees as empty object');
        
        // Now populate each field with the appropriate superiors (excluding preparedBy which is auto-filled)
        const approvalFields = [
            { id: 'checkedBy', level: 'CH' },
            { id: 'acknowledgedBy', level: 'AC' },
            { id: 'approvedBy', level: 'AP' },
            { id: 'receivedBy', level: 'RE' }
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

// Function to populate superior employee dropdown
async function populateSuperiorEmployeeDropdown(fieldId, documentType, transactionType) {
    try {
        const superiors = await fetchSuperiorEmployees(documentType, transactionType, getSuperiorLevelForField(fieldId));
        await populateSuperiorEmployeeDropdownWithData(fieldId, superiors);
    } catch (error) {
        console.error(`Error populating superior employee dropdown for ${fieldId}:`, error);
    }
}

// Function to get superior level for field
function getSuperiorLevelForField(fieldId) {
    const levelMap = {
        'preparedBySearch': 1,
        'checkedBySearch': 2,
        'acknowledgedBySearch': 3,
        'approvedBySearch': 4,
        'receivedBySearch': 5
    };
    return levelMap[fieldId] || 1;
}

// Function to fetch superior employees
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
        
        if (result.status && result.data) {
            return result.data.filter(superior => 
                superior.superiorLevel === superiorLevel && 
                superior.transactionType === transactionType
            );
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching superior employees:', error);
        return [];
    }
}

// Function to populate superior employee dropdown with data
async function populateSuperiorEmployeeDropdownWithData(fieldId, superiors) {
    console.log(`populateSuperiorEmployeeDropdownWithData called for fieldId: ${fieldId} with ${superiors.length} superiors`);
    
    // Get the search input and dropdown elements
    const searchInput = document.getElementById(fieldId + 'Search');
    const dropdown = document.getElementById(fieldId + 'Dropdown');
    const hiddenInput = document.getElementById(fieldId);
    
    if (!searchInput || !dropdown) {
        console.error(`Search input or dropdown not found for fieldId: ${fieldId}`);
        return;
    }
    
    // Clear existing options
    dropdown.innerHTML = '';
    
    if (superiors.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'No superiors available';
        dropdown.appendChild(noResults);
        return;
    }
    
    // Add superior employees to dropdown
    console.log(`Adding ${superiors.length} superiors to dropdown for fieldId: ${fieldId}`);
    superiors.forEach(superior => {
        const option = document.createElement('div');
        option.className = 'p-2 cursor-pointer hover:bg-gray-100';
        option.innerHTML = superior.superiorFullName;
        option.onclick = function() {
            searchInput.value = superior.superiorFullName;
            if (hiddenInput) {
                hiddenInput.value = superior.superiorUserId;
            }
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(option);
        console.log(`Added superior: ${superior.superiorFullName} (${superior.superiorUserId}) to ${fieldId}`);
    });
    
    // PreparedBy is handled separately by autoFillPreparedBy function, not superior employees
    
    // Set pending approval values if they exist
    if (window.pendingApprovalValues) {
        const pendingUserId = window.pendingApprovalValues[fieldId];
        if (pendingUserId) {
            // Check if the user exists in the superiors list
            const matchingSuperior = superiors.find(s => s.superiorUserId === pendingUserId);
            if (matchingSuperior) {
                searchInput.value = matchingSuperior.superiorFullName;
                if (hiddenInput) {
                    hiddenInput.value = pendingUserId;
                }
                console.log(`Set pending approval value for ${fieldId}:`, pendingUserId);
            }
        }
    }
}

// Function to display revision remarks from API
function displayRevisionRemarks(data) {
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

// Function to display rejection remarks
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

// Function to populate approval fields
function populateApprovalFields(data) {
    const approvalFields = [
        { searchId: 'preparedBySearch', hiddenId: 'preparedBy', name: data.preparedName, id: data.preparedById },
        { searchId: 'checkedBySearch', hiddenId: 'checkedBy', name: data.checkedName, id: data.checkedById },
        { searchId: 'acknowledgedBySearch', hiddenId: 'acknowledgedBy', name: data.acknowledgedName, id: data.acknowledgedById },
        { searchId: 'approvedBySearch', hiddenId: 'approvedBy', name: data.approvedName, id: data.approvedById },
        { searchId: 'receivedBySearch', hiddenId: 'receivedBy', name: data.receivedName, id: data.receivedById }
    ];
    
    console.log('Populating approval fields with data:', data);
    
    approvalFields.forEach(field => {
        const searchInput = document.getElementById(field.searchId);
        const hiddenInput = document.getElementById(field.hiddenId);
        
        console.log(`Processing field: ${field.searchId} - Name: ${field.name}, ID: ${field.id}`);
        
        // Set the search input (visible name)
        if (searchInput && field.name) {
            searchInput.value = field.name;
            console.log(`Set ${field.searchId} to: ${field.name}`);
        }
        
        // Set the hidden input (user ID)
        if (hiddenInput && field.id) {
            hiddenInput.value = field.id;
            console.log(`Set ${field.hiddenId} to: ${field.id}`);
        }
    });
    
    // Debug: Log final values
    console.log('Final approval field values after population:');
    approvalFields.forEach(field => {
        const hiddenInput = document.getElementById(field.hiddenId);
        console.log(`${field.hiddenId}: ${hiddenInput ? hiddenInput.value : 'NOT FOUND'}`);
    });
}

// Function to populate settlement items (aligned with revisionCash.js)
async function populateSettlementItems(items) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (items.length === 0) {
        return;
    }
    
    let totalAmount = 0;
    
    for (const item of items) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border relative">
                <input type="text" class="category-input w-full" placeholder="Search category..." value="${item.category || ''}" />
                <div class="category-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-40 overflow-y-auto"></div>
            </td>
            <td class="p-2 border">
                <select class="account-name w-full">
                    <option value="">Select Account Name</option>
                </select>
            </td>
            <td class="p-2 border">
                <input type="text" class="coa w-full" readonly style="background-color: #f3f4f6;" value="${item.glAccount || ''}" />
            </td>
            <td class="p-2 border">
                <input type="text" value="${item.description || ''}" class="w-full description" maxlength="200" required />
            </td>
            <td class="p-2 border">
                <input type="number" value="${item.amount ? parseFloat(item.amount).toFixed(2) : '0.00'}" class="w-full total" maxlength="10" required step="0.01" oninput="calculateTotalAmount()" onblur="formatNumberWithDecimals(this)" />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
            </td>
        `;
        tableBody.appendChild(row);
        
        await setupCategoryDropdown(row);
        
        if (item.category) {
            const categoryInput = row.querySelector('.category-input');
            const departmentId = document.getElementById("department").value;
            const transactionType = document.getElementById("TransactionType").value;
            await ensureCategoryAvailable(categoryInput, item.category, departmentId, transactionType);
        }
        
        if (item.category) {
            const departmentValue = document.getElementById("department").value;
            const transactionTypeValue = document.getElementById("TransactionType").value;
            
            console.log(`Processing item with category: ${item.category}, accountName: ${item.accountName}`);
            console.log(`Department: ${departmentValue}, TransactionType: ${transactionTypeValue}`);
            
            await populateAccountNameDropdownForInitialLoad(
                row, 
                item.category, 
                departmentValue, 
                transactionTypeValue, 
                item.accountName, // This can be null/empty for new items
                item.glAccount
            );
        }
        
        // Calculate total
        totalAmount += parseFloat(item.amount || 0);
    }
    
    // Update total amount display
    const totalAmountDisplay = document.getElementById('totalAmountDisplay');
    if (totalAmountDisplay) {
        totalAmountDisplay.textContent = totalAmount.toFixed(2);
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

// Function to calculate total amount (for any dynamic changes)
function calculateTotalAmount() {
    const totalInputs = document.querySelectorAll('.total');
    let sum = 0;
    
    totalInputs.forEach(input => {
        const value = input.value.trim();
        if (value && !isNaN(parseFloat(value))) {
            sum += parseFloat(value);
        }
    });
    
    const formattedSum = sum.toFixed(2);
    const totalAmountDisplay = document.getElementById('totalAmountDisplay');
    if (totalAmountDisplay) {
        totalAmountDisplay.textContent = formattedSum;
    }
}

// Helper function to get logged-in user ID
function getUserId() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.id : null;
}

// Helper function to auto-fill preparedBy with logged-in user (like addSettle.js)
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
    
    // Also set the hidden input value
    const preparedByHidden = document.getElementById("preparedBy");
    if (preparedByHidden) {
        preparedByHidden.value = currentUserId;
        console.log('Auto-filled preparedBy with current user:', currentUserId);
    }
}

// Function to setup event listeners for approval fields (like detailCash.js)
function setupApprovalFieldEventListeners() {
    console.log('Setting up approval field event listeners');
    
    // Setup event listeners for approval fields (excluding preparedBy which is disabled)
    const approvalFields = ['checkedBy', 'acknowledgedBy', 'approvedBy', 'receivedBy'];
    
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
                console.log(`Clicked ${fieldId}, showing dropdown`);
                dropdown.classList.remove('hidden');
                filterUsers(fieldId);
            });
            
            // Show dropdown when input is focused
            newSearchInput.addEventListener('focus', function() {
                console.log(`Focused ${fieldId}, showing dropdown`);
                dropdown.classList.remove('hidden');
                filterUsers(fieldId);
            });
            
            // Show dropdown when input value changes (for backspace, typing, etc.)
            newSearchInput.addEventListener('input', function() {
                console.log(`Input changed for ${fieldId}, showing dropdown`);
                dropdown.classList.remove('hidden');
                filterUsers(fieldId);
            });
            
            // Show dropdown when key is pressed (for backspace, delete, etc.)
            newSearchInput.addEventListener('keydown', function(e) {
                // Slight delay to allow the input value to update first
                setTimeout(() => {
                    console.log(`Key pressed for ${fieldId} (${e.key}), showing dropdown`);
                    dropdown.classList.remove('hidden');
                    filterUsers(fieldId);
                }, 10);
            });
        } else {
            console.warn(`Search input or dropdown not found for ${fieldId}`);
        }
    });
    
    // Setup click handlers to hide dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        approvalFields.forEach(fieldId => {
            const searchInput = document.getElementById(fieldId + 'Search');
            const dropdown = document.getElementById(fieldId + 'Dropdown');
            
            if (searchInput && dropdown) {
                if (!searchInput.contains(event.target) && !dropdown.contains(event.target)) {
                    dropdown.classList.add('hidden');
                }
            }
        });
    });
}

// Function to submit document with revision (aligned with detailSettle.js)
function submitDocument(isSubmit = true) {
    console.log('submitDocument called with isSubmit:', isSubmit);
    console.log('settlementId:', settlementId);
    
    if (!settlementId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Settlement ID not found'
        });
        return;
    }

    // Show confirmation dialog
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
            updateSettlement(isSubmit);
        }
    });
}

function goToMenuReceiveSettle() {
    window.location.href = "../../../dashboard/dashboardReceive/settlement/menuSettleReceive.html";
}

// Function to toggle editable fields based on Settlement status
function toggleEditableFields(isEditable) {
    // List all input fields that should be controlled by editable state
    const editableFields = [
        'settlementRefNo',
        'purpose',
        'paidToSearch', // Business partner search field
        'cashAdvanceReferenceId',
        'submissionDate',
        'TransactionType',
        'attachments', // File input
        'remarks'
    ];
    
    // Fields that should always be disabled/readonly (autofilled)
    const alwaysDisabledFields = [
        'settlementNumber',
        'requesterName',
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
    
    // Handle table inputs
    const tableInputs = document.querySelectorAll('#tableBody input, #tableBody select');
    tableInputs.forEach(input => {
        if (isEditable) {
            input.readOnly = false;
            input.disabled = false;
            input.classList.remove('bg-gray-100');
            input.classList.add('bg-white');
        } else {
            input.readOnly = true;
            input.disabled = true;
            input.classList.add('bg-gray-100');
            input.classList.remove('bg-white');
        }
    });
    
    // Handle add row button
    const addRowButton = document.querySelector('button[onclick="addRow()"]');
    if (addRowButton) {
        if (isEditable) {
            addRowButton.style.display = 'inline-block';
        } else {
            addRowButton.style.display = 'none';
        }
    }
    
    // Handle file upload
    const fileInput = document.getElementById('attachments');
    if (fileInput) {
        if (isEditable) {
            fileInput.disabled = false;
            fileInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
        } else {
            fileInput.disabled = true;
            fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        }
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
                ${settlementData && settlementData.status === 'Revision' ? 
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
                ${settlementData && settlementData.status === 'Revision' ? 
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
 
// Function to display attachments (legacy function - now uses updateAttachmentsDisplay)
function displayAttachments(attachments) {
    // Store existing attachments and mark them all to keep initially
    existingAttachments = attachments || [];
    attachmentsToKeep = existingAttachments.map(att => att.id);
    
    // Update display
    updateAttachmentsDisplay();
}

// Function to update settlement (aligned with detailSettle.js)
function updateSettlement(isSubmit = false) {
    const actionText = isSubmit ? 'Submit' : 'Update';
    const actionConfirmText = isSubmit ? 'submit' : 'update';
    const actioningText = isSubmit ? 'Submitting' : 'Updating';
    
    if (!settlementId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Settlement ID not found'
        });
        return;
    }

    // Get the KansaiEmployeeId from the selected requester
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
    
    // Basic settlement fields
    const settlementRefNo = document.getElementById("settlementRefNo").value;
    const purpose = document.getElementById("purpose").value;
    const transactionType = document.getElementById("TransactionType").value;
    console.log("Transaction type value:", transactionType);
    const submissionDate = document.getElementById("submissionDate").value;
    const cashAdvanceReferenceId = document.getElementById("cashAdvanceReferenceId").value;
    const remarks = document.getElementById("remarks").value;

    // Basic validation
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
    
    // Add basic fields to FormData
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
    
    // Handle submission date
    if (submissionDate) {
        formData.append('SubmissionDate', submissionDate);
    }
    
    // Add approval workflow users
    const preparedById = document.getElementById("preparedBy")?.value || '';
    const checkedById = document.getElementById("checkedBy")?.value || '';
    const acknowledgedById = document.getElementById("acknowledgedBy")?.value || '';
    const approvedById = document.getElementById("approvedBy")?.value || '';
    const receivedById = document.getElementById("receivedBy")?.value || '';
    
    console.log('Approval field values:', {
        preparedById,
        checkedById,
        acknowledgedById,
        approvedById,
        receivedById
    });
    
    if (preparedById) formData.append('PreparedById', preparedById);
    if (checkedById) formData.append('CheckedById', checkedById);
    if (acknowledgedById) formData.append('AcknowledgedById', acknowledgedById);
    if (approvedById) formData.append('ApprovedById', approvedById);
    if (receivedById) formData.append('ReceivedById', receivedById);
    
    // Handle table data
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
        const categoryInput = row.querySelector('.category-input');
        const accountNameSelect = row.querySelector('.account-name');
        const glAccountInput = row.querySelector('.coa');
        const descriptionInput = row.querySelector('.description');
        const amountInput = row.querySelector('.total');

        const category = categoryInput ? categoryInput.value : '';
        const accountName = accountNameSelect ? accountNameSelect.value : '';
        const glAccount = glAccountInput ? glAccountInput.value : '';
        const description = descriptionInput ? descriptionInput.value : '';
        const amount = amountInput ? amountInput.value : '';
        
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
    
    // Validate required approval fields for submission
    if (isSubmit) {
        const missingApprovals = [];
        if (!checkedById) missingApprovals.push('Checked By');
        if (!acknowledgedById) missingApprovals.push('Acknowledged By');
        if (!approvedById) missingApprovals.push('Approved By');
        if (!receivedById) missingApprovals.push('Received By');
        
        if (missingApprovals.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Validation Error!',
                text: `Please assign the following approval roles: ${missingApprovals.join(', ')}`,
                confirmButtonColor: '#3085d6'
            });
            return;
        }
    }
    
    // Handle attachments
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

    // Set submit flag
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
                text: `Settlement revision has been ${isSubmit ? 'submitted' : 'updated'} successfully.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the revision dashboard
                window.location.href = '../../../dashboard/dashboardRevision/settlement/menuSettleRevision.html';
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

// Function to hide approval buttons when viewing from received or rejected tabs
function hideApprovalButtons() {
    const submitButton = document.querySelector('button[onclick="submitDocument(true)"]');
    if (submitButton) {
        submitButton.style.display = 'none';
    }
}

// Function to add a new row to the settlement items table (aligned with revisionCash.js)
async function addRow() {
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
            <input type="text" class="w-full description" maxlength="200" required />
        </td>
        <td class="p-2 border">
            <input type="number" class="w-full total" maxlength="10" value="0.00" required step="0.01" oninput="calculateTotalAmount()" onblur="formatNumberWithDecimals(this)" />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
    await setupCategoryDropdown(newRow);
    
    // Calculate total amount after adding new row
    calculateTotalAmount();
}

// Simple number formatting with .00 decimal places
function formatNumberWithDecimals(input) {
    // Get the numeric value
    let value = input.value.replace(/[^\d.]/g, '');
    
    // Handle empty input
    if (!value) {
        input.value = '0.00';
        return;
    }
    
    // Convert to number and format with 2 decimal places
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
        input.value = numericValue.toFixed(2);
    }
}

// Function to format number as user types (allows decimal input)
function formatNumberAsYouType(input) {
    // Allow digits and one decimal point
    let value = input.value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    input.value = value;
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

// Function to delete a row from the settlement items table
function deleteRow(button) {
    const row = button.closest('tr');
    row.remove();
    calculateTotalAmount();
}

// Legacy function kept for compatibility
function previewPDF(event) {
    // Handle file preview if needed
    return;
}

// Function to load cash advance options (aligned with detailSettle.js)
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
            
            // Select the stored cash advance ID if it exists
            if (window.selectedCashAdvanceId) {
                console.log('Attempting to select cash advance ID:', window.selectedCashAdvanceId);
                console.log('Available options:', Array.from(dropdown.options).map(opt => ({ value: opt.value, text: opt.textContent })));
                dropdown.value = window.selectedCashAdvanceId;
                console.log('✅ Selected cash advance ID:', window.selectedCashAdvanceId);
                console.log('Final dropdown value:', dropdown.value);
                console.log('Final dropdown text:', dropdown.options[dropdown.selectedIndex]?.textContent);
            } else {
                console.log('❌ No selectedCashAdvanceId found to select');
            }
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

// Helper function to get settlement ID from URL
function getSettlementIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('settle-id') || urlParams.get('settlement-id');
}

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

// Function to make all fields read-only
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
    const fileInput = document.getElementById('attachments');
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
    const fileInput = document.getElementById('attachments');
    if (fileInput) {
        fileInput.disabled = false;
        fileInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
    }
}

// Function to hide submit button
function hideSubmitButton() {
    const submitButton = document.querySelector('button[onclick="submitDocument(true)"]');
    if (submitButton) {
        submitButton.style.display = 'none';
    }
}

// Function to show submit button
function showSubmitButton() {
    const submitButton = document.querySelector('button[onclick="submitDocument(true)"]');
    if (submitButton) {
        submitButton.style.display = 'inline-block';
    }
}

 