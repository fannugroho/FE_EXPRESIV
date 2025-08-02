// Global variable for file uploads
let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep
let settlementData = null;
let currentRequesterData = null; // Store current requester data globally

let settlementId; // Declare global variable
let currentTab; // Declare global variable for tab

// Function to fetch Settlement details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    settlementId = urlParams.get('settle-id') || urlParams.get('settlement-id'); // Support both parameter names
    currentTab = urlParams.get('tab'); // Get the tab parameter
    
    if (settlementId) {
        fetchSettlementDetails(settlementId);
    }
    
    // // Hide approve/reject buttons if viewing from received or rejected tabs
    // if (currentTab === 'received' || currentTab === 'rejected') {
    //     hideApprovalButtons();
    // }
    
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
    
    document.getElementById('cashAdvanceReferenceId').value = data.cashAdvanceNumber || '';
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
}

// Function to fetch dropdown options
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

// Function to fetch transaction types
function fetchTransactionType() {
    fetch(`${BASE_URL}/api/transaction-types`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Transaction types data:", data);
            populateTransactionTypeSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching transaction types:', error);
        });
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
    const dropdown = document.getElementById(fieldId + 'Dropdown');
    
    if (!searchInput || !dropdown) return;
    
    const searchText = searchInput.value.toLowerCase();
    dropdown.innerHTML = '';
    
    if (!window.employees) return;
    
    const filteredUsers = window.employees.filter(user => 
        user.fullName && user.fullName.toLowerCase().includes(searchText)
    );
    
    filteredUsers.forEach(user => {
        const option = document.createElement('div');
        option.className = 'p-2 cursor-pointer hover:bg-gray-100';
        option.innerHTML = `${user.fullName} (${user.kansaiEmployeeId})`;
        option.onclick = function() {
            searchInput.value = `${user.fullName} (${user.kansaiEmployeeId})`;
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(option);
    });
    
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'No matching users';
        dropdown.appendChild(noResults);
    }
    
    dropdown.classList.remove('hidden');
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
    const fields = [
        { id: 'preparedBySearch', level: 1 },
        { id: 'checkedBySearch', level: 2 },
        { id: 'acknowledgedBySearch', level: 3 },
        { id: 'approvedBySearch', level: 4 },
        { id: 'receivedBySearch', level: 5 }
    ];
    
    for (const field of fields) {
        await populateSuperiorEmployeeDropdown(field.id, 'Settlement', transactionType);
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
    const searchInput = document.getElementById(fieldId);
    const dropdown = document.getElementById(fieldId.replace('Search', 'Dropdown'));
    
    if (!searchInput || !dropdown) return;
    
    // Clear existing options
    dropdown.innerHTML = '';
    
    if (superiors.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'No superiors available';
        dropdown.appendChild(noResults);
        return;
    }
    
    superiors.forEach(superior => {
        const option = document.createElement('div');
        option.className = 'p-2 cursor-pointer hover:bg-gray-100';
        option.innerHTML = `${superior.superiorName}`;
        option.onclick = function() {
            searchInput.value = `${superior.superiorKansaiEmployeeId}`;
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(option);
    });
}

// Function to display revision remarks from API
function displayRevisionRemarks(data) {
    const revisedRemarksSection = document.getElementById('revisedRemarksSection');
    
    // Check if there are revisions
    if (data.revisions && data.revisions.length > 0) {
        if (revisedRemarksSection) {
            revisedRemarksSection.style.display = 'block';
            revisedRemarksSection.innerHTML = '';
            
            const title = document.createElement('label');
            title.className = 'font-semibold text-orange-600';
            title.textContent = `Revision History (${data.revisions.length} revision(s))`;
            revisedRemarksSection.appendChild(title);
            
            data.revisions.forEach((revision, index) => {
                const revisionDiv = document.createElement('div');
                revisionDiv.className = 'mt-2 p-3 bg-orange-50 border border-orange-200 rounded';
                revisionDiv.innerHTML = `
                    <p class="text-sm text-gray-600">Revision ${index + 1}:</p>
                    <p class="text-sm">${revision.remarks || 'No remarks'}</p>
                `;
                revisedRemarksSection.appendChild(revisionDiv);
            });
        }
    } else {
        if (revisedRemarksSection) {
            revisedRemarksSection.style.display = 'none';
        }
    }
}

// Function to display rejection remarks
function displayRejectionRemarks(data) {
    const rejectionRemarksSection = document.getElementById('rejectionRemarksSection');
    const rejectionRemarks = document.getElementById('rejectionRemarks');
    
    if (data.rejectedRemarks && data.rejectedRemarks.trim() !== '') {
        if (rejectionRemarksSection) {
            rejectionRemarksSection.style.display = 'block';
        }
        if (rejectionRemarks) {
            rejectionRemarks.value = data.rejectedRemarks;
        }
    } else {
        if (rejectionRemarksSection) {
            rejectionRemarksSection.style.display = 'none';
        }
    }
}

// Function to fetch dropdown options
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

// Function to fetch transaction types
function fetchTransactionType() {
    fetch(`${BASE_URL}/api/transactiontypes`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Transaction types data:", data);
            populateTransactionTypeSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching transaction types:', error);
        });
}

// Function to populate transaction type select
function populateTransactionTypeSelect(transactionTypes) {
    const transactionTypeSelect = document.getElementById("TransactionType");
    if (!transactionTypeSelect) return;
    
    // Store the currently selected value
    const currentValue = transactionTypeSelect.value;
    
    // Create new select element to avoid issues with event listeners
    const newTransactionTypeSelect = transactionTypeSelect.cloneNode(false);
    newTransactionTypeSelect.innerHTML = '<option value="" disabled>Select Transaction Type</option>';

    transactionTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type.name;
        option.textContent = type.name;
        newTransactionTypeSelect.appendChild(option);
        
        // If this type matches the current value, select it
        if (type.name === currentValue) {
            option.selected = true;
        }
    });
    
    // Replace the old select with the new one
    transactionTypeSelect.parentNode.replaceChild(newTransactionTypeSelect, transactionTypeSelect);
    
    // Add event listener for transaction type change to trigger superior employee updates
    newTransactionTypeSelect.addEventListener('change', async function() {
        console.log("Transaction type changed to:", this.value);
        
        // Refresh approval dropdowns with new transaction type
        await populateAllSuperiorEmployeeDropdowns(this.value);
    });
    
    // If we have a current value and it wasn't matched, try to select by value
    if (currentValue && newTransactionTypeSelect.value !== currentValue) {
        newTransactionTypeSelect.value = currentValue;
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

// Function to populate approval fields
function populateApprovalFields(data) {
    const approvalFields = [
        { searchId: 'preparedBySearch', name: data.preparedName },
        { searchId: 'checkedBySearch', name: data.checkedName },
        { searchId: 'acknowledgedBySearch', name: data.acknowledgedName },
        { searchId: 'approvedBySearch', name: data.approvedName },
        { searchId: 'receivedBySearch', name: data.receivedName }
    ];
    
    approvalFields.forEach(field => {
        const searchInput = document.getElementById(field.searchId);
        if (searchInput && field.name) {
            searchInput.value = field.name;
        }
    });
}

function populateSettlementItems(items) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (items.length === 0) {
        return;
    }
    
    let totalAmount = 0;
    
    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border">
                <input type="text" value="${item.category || ''}" class="w-full" />
            </td>
            <td class="p-2 border">
                <input type="text" value="${item.accountName || ''}" class="w-full" />
            </td>
            <td class="p-2 border">
                <input type="text" value="${item.glAccount || ''}" class="w-full" />
            </td>
            <td class="p-2 border">
                <input type="text" value="${item.description || ''}" class="w-full" />
            </td>
            <td class="p-2 border">
                <input type="number" value="${item.amount || 0}" class="w-full total" step="0.01" />
            </td>
            <td class="p-2 border text-center">
                <button onclick="deleteRow(this)" class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">×</button>
            </td>
        `;
        tableBody.appendChild(row);
        
        // Calculate total
        totalAmount += parseFloat(item.amount || 0);
    });
    
    // Update total amount display
    const totalAmountDisplay = document.getElementById('totalAmountDisplay');
    if (totalAmountDisplay) {
        totalAmountDisplay.textContent = totalAmount.toFixed(2);
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

// Function to submit document with revision
function submitDocument(isSubmit = false) {
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
            updateSettlementStatusWithRemarks('revise', 'Revision');
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

// Function to update settlement status with remarks (for revision)
function updateSettlementStatusWithRemarks(status, remarks) {
    if (!settlementId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Settlement ID not found'
        });
        return;
    }

    const userId = getUserId();
    if (!userId) {
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'Unable to get user ID from token. Please login again.'
        });
        return;
    }

    const requestData = {
        id: settlementId,
        UserId: userId,
        StatusAt: "Revise",
        Action: status,
        Remarks: remarks || ''
    };

    // Show loading
    Swal.fire({
        title: 'Processing Revision...',
        text: 'Please wait while we process your request.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    fetch(`${BASE_URL}/api/settlements/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Settlement revision submitted successfully',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                window.location.href = '../../../dashboard/dashboardRevision/settlement/menuSettleRevision.html';
            });
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to submit revision. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error submitting revision: ' + error.message
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

// Function to add a new row to the settlement items table
function addRow() {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" class="w-full" placeholder="Category" />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full" placeholder="Account Name" />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full" placeholder="G/L Account" />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full" placeholder="Description" />
        </td>
        <td class="p-2 border">
            <input type="number" class="w-full total" placeholder="0.00" step="0.01" oninput="calculateTotalAmount()" />
        </td>
        <td class="p-2 border text-center">
            <button onclick="deleteRow(this)" class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">×</button>
        </td>
    `;
    tableBody.appendChild(newRow);
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

 