let uploadedFiles = [];
let reimbursementId = '';

// Add document ready event listener
document.addEventListener("DOMContentLoaded", function() {
    // Call function to control button visibility
    controlButtonVisibility();
    
    // Other initialization code can go here
});

function saveDocument() {
    let documents = JSON.parse(localStorage.getItem("documentsReim")) || [];
    const docNumber = `REIM${Date.now()}`; // Gunakan timestamp agar unik

    const documentData = {
        docNumber,
        outno: document.getElementById("outgoingNo").value,
                requester: document.getElementById("requester").value,
                department: document.getElementById("department").value,
                toOrderOf : document.getElementById("toOrderOf").value,
                payTo : document.getElementById("PayTo").value,
                docCurrency : document.getElementById("docCurrency").value,
                Reference : document.getElementById("reference").value,
                ReferenceDoc : document.getElementById("referenceDoc").value,
                postingDate: document.getElementById("postingDate").value,
                classification: document.getElementById("classification").value,
                type: document.getElementById("type").value,
                docStatus: document.getElementById("docStatus").value,
                approvals: {
                    prepared: document.getElementById("prepared").checked,
                    checked: document.getElementById("checked").checked,
                    approved: document.getElementById("approved").checked,
                    knowledge: document.getElementById("knowledge").checked,
                }
    };

    documents.push(documentData);
    localStorage.setItem("documentsReim", JSON.stringify(documents));
    alert("Dokumen berhasil disimpan!");
}

function updateApprovalStatus(docNumber, statusKey) {
    let documents = JSON.parse(localStorage.getItem("documentsReim")) || [];
    let docIndex = documents.findIndex(doc => doc.docNumber === docNumber);
    if (docIndex !== -1) {
        documents[docIndex].approvals[statusKey] = true;
        localStorage.setItem("documentsReim", JSON.stringify(documents));
        alert(`Document ${statusKey} updated!`);
    }
}


document.getElementById("docType")?.addEventListener("change", function () {
    const prTable = document.getElementById("prTable");
    prTable.style.display = this.value === "Pilih" ? "none" : "table";
});

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

function addRow() {
    const tableBody = document.getElementById('reimbursementDetails');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td class="p-2 border">
            <div class="relative">
                <input type="text" placeholder="Search category..." class="w-full p-1 border rounded search-input category-search" />
                <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden category-dropdown"></div>
                <select class="hidden category-select">
                    <option value="" disabled selected>Choose Category</option>
                </select>
            </div>
        </td>
        <td class="p-2 border">
            <div class="relative">
                <input type="text" placeholder="Search account name..." class="w-full p-1 border rounded search-input account-name-search" />
                <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden account-name-dropdown"></div>
                <select class="hidden account-name-select">
                    <option value="" disabled selected>Choose Account Name</option>
                </select>
            </div>
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full p-1 border rounded bg-gray-200 cursor-not-allowed gl-account" disabled />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="10" class="w-full p-1 border rounded" required />
        </td>
        <td class="p-2 border">
            <input type="number" maxlength="10" class="w-full p-1 border rounded" required />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;
    tableBody.appendChild(newRow);
    
    // Setup event listeners for the new row
    setupRowEventListeners(newRow);
    
    // Populate categories for the new row if data is available
    populateCategoriesForNewRow(newRow);
}

function deleteRow(button) {
    button.closest("tr").remove();
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

async function deleteDocument() {
    // Get the ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('reim-id');
    
    if (!id) {
        Swal.fire('Error!', 'ID reimbursement tidak ditemukan.', 'error');
        return;
    }
    
    try {
        // Call the DELETE API
        const response = await fetch(`${BASE_URL}/api/reimbursements/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.status) {
            Swal.fire('Terhapus!', 'Dokumen berhasil dihapus.', 'success')
            .then(() => {
                // Redirect to previous page or list page after successful deletion
                window.history.back();
            });
        } else {
            Swal.fire('Error!', data.message || 'Gagal menghapus dokumen karena status dokumen sudah bukan draft.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error!', 'Terjadi kesalahan saat menghapus dokumen.', 'error');
    }
}

function confirmSubmit() {
    Swal.fire({
        title: 'Konfirmasi',
        text: 'Apakah dokumen sudah benar?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya',
        cancelButtonText: 'Batal',
    }).then((result) => {
        if (result.isConfirmed) {
            submitDocument();
        }
    });
}

async function submitDocument() {
    const id = getReimbursementIdFromUrl();
    if (!id) {
        Swal.fire('Error', 'No reimbursement ID found', 'error');
        return;
    }
    
    try {
        // Call the API to prepare the document
        const response = await fetch(`${BASE_URL}/api/reimbursements/prepared/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            Swal.fire(
                'Submitted!',
                result.message || 'Reimbursement prepared successfully.',
                'success'
            ).then(() => {
                // After successful submission, preparedDate will no longer be null
                // Update the button state directly and refresh data
                updateSubmitButtonState(new Date().toISOString());
                fetchReimbursementData();
            });
        } else {
            Swal.fire(
                'Error',
                result.message || 'Failed to prepare reimbursement',
                'error'
            );
        }
    } catch (error) {
        console.error('Error preparing reimbursement:', error);
        Swal.fire(
            'Error',
            'An error occurred while preparing the reimbursement',
            'error'
        );
    }
}

function getReimbursementIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('reim-id');
}

// Function to get current logged-in user using auth.js
function getCurrentLoggedInUser() {
    try {
        const currentUser = getCurrentUser(); // Use function from auth.js
        if (!currentUser) return null;
        
        return {
            id: currentUser.userId,
            name: currentUser.username || ''
        };
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Function to auto-fill preparedBy with current logged-in user
function autofillPreparedByWithCurrentUser(users) {
    const currentUser = getCurrentLoggedInUser();
    if (!currentUser) return;
    
    // Find the current user in the users list to get their full name
    const matchingUser = users.find(user => user.id.toString() === currentUser.id.toString());
    
    if (matchingUser) {
        // Combine names with spaces, handling empty middle/last names
        let displayName = matchingUser.fullName;
        
        // Set the preparedBy select and search input
        const preparedBySelect = document.getElementById('preparedBySelect');
        const preparedBySearch = document.getElementById('preparedBySearch');
        
        if (preparedBySelect) {
            preparedBySelect.value = matchingUser.id;
        }
        
        if (preparedBySearch) {
            preparedBySearch.value = displayName;
            // Disable the preparedBy field since it's auto-filled with current user
            preparedBySearch.disabled = true;
            preparedBySearch.classList.add('bg-gray-200', 'cursor-not-allowed');
        }
    }
}

async function fetchReimbursementData() {
    reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId) {
        console.error('No reimbursement ID found in URL');
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}`);
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            console.log('Reimbursement data received:', result.data);
            console.log('Status:', result.data.status);
            console.log('Rejection remarks:', result.data.rejectionRemarks);
            populateFormData(result.data);
            updateSubmitButtonState(result.data.preparedDate);
        } else {
            console.error('Failed to fetch reimbursement data:', result.message);
        }
    } catch (error) {
        console.error('Error fetching reimbursement data:', error);
    }
}

// Function to update Submit button state based on preparedDate
function updateSubmitButtonState(preparedDate) {
    const submitButton = document.querySelector('button[onclick="confirmSubmit()"]');
    if (submitButton) {
        if (preparedDate === null) {
            // Enable the button if preparedDate is null
            submitButton.disabled = false;
            submitButton.classList.remove('bg-gray-400', 'hover:bg-gray-400', 'cursor-not-allowed');
            submitButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
        } else {
            // Disable the button if preparedDate is not null
            submitButton.disabled = true;
            submitButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            submitButton.classList.add('bg-gray-400', 'hover:bg-gray-400', 'cursor-not-allowed');
        }
    }
}

// Function to fetch departments from API
async function fetchDepartments() {
    try {
        const response = await fetch(`${BASE_URL}/api/department`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        
        const data = await response.json();
        console.log("Department data:", data);
        populateDepartmentSelect(data.data);
    } catch (error) {
        console.error('Error fetching departments:', error);
    }
}

// Helper function to populate department dropdown
function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("department");
    if (!departmentSelect) return;
    
    // Clear existing options except the first one (if any)
    departmentSelect.innerHTML = '<option value="" disabled>Select Department</option>';
    
    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.name;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
    });
    
    // Disable department selection since it will be auto-filled based on requester
    departmentSelect.disabled = true;
    departmentSelect.classList.add('bg-gray-200', 'cursor-not-allowed');
}

// Helper function to set department value, creating option if it doesn't exist
function setDepartmentValue(departmentName) {
    const departmentSelect = document.getElementById("department");
    if (!departmentSelect || !departmentName) return;
    
    // Try to find existing option
    let optionExists = false;
    for (let i = 0; i < departmentSelect.options.length; i++) {
        if (departmentSelect.options[i].value === departmentName || 
            departmentSelect.options[i].textContent === departmentName) {
            departmentSelect.selectedIndex = i;
            optionExists = true;
            break;
        }
    }
    
    // If option doesn't exist, create and add it
    if (!optionExists) {
        const newOption = document.createElement('option');
        newOption.value = departmentName;
        newOption.textContent = departmentName;
        newOption.selected = true;
        departmentSelect.appendChild(newOption);
    }
    
    // Trigger dependency change to update categories if transaction type is also selected
    const transactionType = document.getElementById('typeOfTransaction').value;
    if (transactionType) {
        handleDependencyChange();
    }
}

// Helper function to auto-fill department based on selected requester
function autoFillDepartmentFromRequester(requesterName, users) {
    console.log('Auto-filling department for requester:', requesterName);
    console.log('Available users:', users);
    
    // Find the user by name from the users data passed from API
    const selectedUser = users.find(user => {
        // In detailReim, the users are stored with simplified structure {id, name}
        return user.name === requesterName;
    });
    
    console.log('Selected user:', selectedUser);
    
    if (!selectedUser) {
        console.log('User not found in users list');
        return;
    }
    
    // Use the improved department fetching function
    autoFillDepartmentFromRequesterById(selectedUser.id);
}

// Helper function to auto-fill department based on selected requester ID (improved version)
async function autoFillDepartmentFromRequesterById(userId) {
    console.log('Auto-filling department for user ID:', userId);
    
    try {
        // First try to use cached users data from window.allUsers
        if (window.allUsers && window.allUsers.length > 0) {
            const user = window.allUsers.find(u => u.id === userId);
            if (user && user.department) {
                console.log('Found user in cached data:', user);
                console.log('Department from cache:', user.department);
                setDepartmentValue(user.department);
                return;
            } else {
                console.log('User not found in cache or no department in cached data');
            }
        }
        
        // Fallback: Fetch full user details from API to get department
        console.log('Fetching user details from API...');
        const response = await fetch(`${BASE_URL}/api/users/${userId}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch user details');
        }
        
        const user = result.data;
        console.log('User details from API:', user);
        
        // Try different department field names that might exist
        const userDepartment = user.department || 
                              user.departmentName || 
                              user.dept ||
                              user.departement;
        
        console.log('User department from API:', userDepartment);
        
        if (!userDepartment) {
            console.log('No department found for user, checking if user has employeeId for additional lookup');
            
            // Try to fetch department via employee endpoint if available
            if (user.employeeId) {
                try {
                    const employeeResponse = await fetch(`${BASE_URL}/api/employees/${user.employeeId}`);
                    if (employeeResponse.ok) {
                        const employeeResult = await employeeResponse.json();
                        if (employeeResult.status && employeeResult.data) {
                            const employeeDepartment = employeeResult.data.department || 
                                                     employeeResult.data.departmentName ||
                                                     employeeResult.data.dept;
                            if (employeeDepartment) {
                                console.log('Found department via employee lookup:', employeeDepartment);
                                setDepartmentValue(employeeDepartment);
                                return;
                            }
                        }
                    }
                } catch (error) {
                    console.log('Employee lookup failed:', error);
                }
            }
            
            console.log('No department found for user, enabling manual selection');
            // Enable manual department selection as fallback
            const departmentSelect = document.getElementById("department");
            if (departmentSelect) {
                departmentSelect.disabled = false;
                departmentSelect.classList.remove('bg-gray-200', 'cursor-not-allowed');
                departmentSelect.classList.add('bg-white');
                
                // Update the default option to indicate manual selection is needed
                const defaultOption = departmentSelect.querySelector('option[value=""]');
                if (defaultOption) {
                    defaultOption.textContent = 'Please select department manually';
                    defaultOption.style.color = '#f59e0b'; // amber color for attention
                }
            }
            return;
        }
        
        // Set department value (will create option if it doesn't exist)
        setDepartmentValue(userDepartment);
        
    } catch (error) {
        console.error('Error fetching user department:', error);
    }
}

// Legacy function for backward compatibility
async function fetchUserDepartment(userId) {
    // Redirect to the improved function
    await autoFillDepartmentFromRequesterById(userId);
}

// Fetch users from API and populate dropdown selects
async function fetchUsers() {
    try {
        const response = await fetch(`${BASE_URL}/api/users`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch users');
        }
        
        const users = result.data;
        
        // Store users globally for later use
        window.allUsers = users;
        console.log('Stored', users.length, 'users in global cache');
        
        // Populate dropdowns
        populateDropdown("requesterNameSelect", users, true); // Use name as value
        populateDropdown("preparedBySelect", users, false);
        populateDropdown("acknowledgeBySelect", users, false);
        populateDropdown("checkedBySelect", users, false);
        populateDropdown("approvedBySelect", users, false);
        populateDropdown("receivedBySelect", users, false);
        
        // Auto-fill preparedBy with current logged-in user
        autofillPreparedByWithCurrentUser(users);
        
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

// Function to filter and display user dropdown
function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId.replace('Select', '')}Search`);
    if (!searchInput) return;
    
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    if (!dropdown) return;
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    let filteredUsers = [];
    
    // Handle payToSelect dropdown separately
    if (fieldId === 'payToSelect') {
        try {
            const filtered = businessPartners.filter(bp => 
                bp.name.toLowerCase().includes(searchText) || 
                bp.code.toLowerCase().includes(searchText)
            );
            
            // Display search results
            filtered.forEach(bp => {
                const option = document.createElement('div');
                option.className = 'dropdown-item';
                option.innerText = `${bp.code} - ${bp.name}`;
                option.onclick = function() {
                    searchInput.value = `${bp.code} - ${bp.name}`;
                    const selectElement = document.getElementById(fieldId);
                    if (selectElement) {
                        // Find or create option with this business partner
                        let optionExists = false;
                        for (let i = 0; i < selectElement.options.length; i++) {
                            if (selectElement.options[i].value === bp.id) {
                                selectElement.selectedIndex = i;
                                optionExists = true;
                                break;
                            }
                        }
                        
                        if (!optionExists && selectElement.options.length > 0) {
                            const newOption = document.createElement('option');
                            newOption.value = bp.id;
                            newOption.textContent = `${bp.code} - ${bp.name}`;
                            selectElement.appendChild(newOption);
                            selectElement.value = bp.id;
                        }
                    }
                    
                    dropdown.classList.add('hidden');
                };
                dropdown.appendChild(option);
            });
            
            // Show message if no results
            if (filtered.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No Business Partner Found';
                dropdown.appendChild(noResults);
            }
            
            // Show dropdown
            dropdown.classList.remove('hidden');
            return;
        } catch (error) {
            console.error("Error filtering business partners:", error);
        }
    }
    
    // Handle all other searchable selects
    if (fieldId === 'requesterNameSelect' || 
        fieldId === 'preparedBySelect' || 
        fieldId === 'acknowledgeBySelect' || 
        fieldId === 'checkedBySelect' || 
        fieldId === 'approvedBySelect' ||
        fieldId === 'receivedBySelect') {
        try {
            const users = JSON.parse(searchInput.dataset.users || '[]');
            filteredUsers = users.filter(user => user.name.toLowerCase().includes(searchText));
            
            // Show search results
            filteredUsers.forEach(user => {
                const option = document.createElement('div');
                option.className = 'dropdown-item';
                option.innerText = user.name;
                option.onclick = function() {
                    searchInput.value = user.name;
                    const selectElement = document.getElementById(fieldId);
                    if (selectElement) {
                        // For requesterName, store the name as the value 
                        if (fieldId === 'requesterNameSelect') {
                            // Find matching option or create a new one
                            let optionExists = false;
                            for (let i = 0; i < selectElement.options.length; i++) {
                                if (selectElement.options[i].textContent === user.name) {
                                    selectElement.selectedIndex = i;
                                    optionExists = true;
                                    break;
                                }
                            }
                            
                            if (!optionExists && selectElement.options.length > 0) {
                                const newOption = document.createElement('option');
                                newOption.value = user.name; // For requesterName, value is the name itself
                                newOption.textContent = user.name;
                                selectElement.appendChild(newOption);
                                selectElement.value = user.name;
                            }
                        } else {
                            // For other fields (payTo, approvals), store the ID as the value
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
                    }
                    
                    dropdown.classList.add('hidden');
                    
                    // Auto-fill payToSelect and department when requesterName is selected
                    if (fieldId === 'requesterNameSelect') {
                        // Auto-fill payTo with the same user (find in business partners)
                        const payToSearch = document.getElementById('payToSearch');
                        const payToSelect = document.getElementById('payToSelect');
                        
                        if (payToSearch && payToSelect) {
                            // Find matching business partner by name
                            const matchingBP = businessPartners.find(bp => 
                                bp.name.toLowerCase() === user.name.toLowerCase()
                            );
                            
                            if (matchingBP) {
                                payToSearch.value = `${matchingBP.code} - ${matchingBP.name}`;
                                
                                // Set the business partner ID as the value in the select element
                                let optionExists = false;
                                for (let i = 0; i < payToSelect.options.length; i++) {
                                    if (payToSelect.options[i].value === matchingBP.id.toString()) {
                                        payToSelect.selectedIndex = i;
                                        optionExists = true;
                                        break;
                                    }
                                }
                                
                                if (!optionExists && payToSelect.options.length > 0) {
                                    const newOption = document.createElement('option');
                                    newOption.value = matchingBP.id;
                                    newOption.textContent = `${matchingBP.code} - ${matchingBP.name}`;
                                    payToSelect.appendChild(newOption);
                                    payToSelect.value = matchingBP.id;
                                }
                            }
                        }
                        
                        // Auto-fill department based on selected user
                        const users = JSON.parse(searchInput.dataset.users || '[]');
                        autoFillDepartmentFromRequester(user.name, users);
                    }
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
}

// Helper function to populate a dropdown with user data
// useDisplayNameAsValue: if true, use the display name as the value (for requesterNameSelect)
function populateDropdown(dropdownId, users, useDisplayNameAsValue = false) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    // Clear existing options
    dropdown.innerHTML = "";
    
    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Choose Name";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    dropdown.appendChild(defaultOption);
    
    // Add users as options
    users.forEach(user => {
        const option = document.createElement("option");
        
        // Combine names with spaces, handling empty middle/last names
        let displayName = user.fullName;
        
        // For requesterNameSelect, use the display name as the value instead of ID
        if (useDisplayNameAsValue) {
            option.value = displayName;
        } else {
            option.value = user.id;
        }
        
        option.textContent = displayName;
        dropdown.appendChild(option);
    });
    
    // Store users data for searching in searchable fields
    const searchableFields = [
        "requesterNameSelect", 
        "preparedBySelect", 
        "acknowledgeBySelect", 
        "checkedBySelect", 
        "approvedBySelect",
        "receivedBySelect"
    ];
    
    if (searchableFields.includes(dropdownId)) {
        const searchInput = document.getElementById(dropdownId.replace("Select", "Search"));
        if (searchInput) {
            // Store users data for searching
            searchInput.dataset.users = JSON.stringify(users.map(user => {
                let displayName = user.fullName;
                return {
                    id: user.id,
                    name: displayName
                };
            }));
        }
    }
}

// Function to control visibility of buttons based on status
function controlButtonVisibility() {
    const status = document.getElementById("status").value;
    const addRowButton = document.querySelector("button[onclick='addRow()']");
    const deleteButton = document.querySelector("button[onclick='confirmDelete()']");
    const updateButton = document.querySelector("button[onclick='updateReim()']");
    const submitButton = document.querySelector("button[onclick='confirmSubmit()']");
    
    // Get all form fields that should be controlled
    const inputFields = document.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea');
    const fileInput = document.getElementById('filePath');
    const tableRows = document.querySelectorAll('#reimbursementDetails tr');
    
    // Jika status bukan Draft, sembunyikan tombol dan nonaktifkan field
    if (status !== "Draft") {
        // Hide buttons
        addRowButton.style.display = "none";
        deleteButton.style.display = "none";
        updateButton.style.display = "none";
        submitButton.style.display = "none";
        
        // Disable all input fields
        inputFields.forEach(field => {
            field.disabled = true;
            field.classList.add('bg-gray-100', 'cursor-not-allowed');
        });
        
        // Disable file input
        if (fileInput) {
            fileInput.disabled = true;
            fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        }
        
        // Disable delete buttons in table rows
        tableRows.forEach(row => {
            const deleteBtn = row.querySelector('button[onclick="deleteRow(this)"]');
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        });
    } else {
        // Show buttons
        addRowButton.style.display = "block";
        deleteButton.style.display = "block";
        updateButton.style.display = "block";
        submitButton.style.display = "block";
        
        // Enable input fields (except those that should remain disabled)
        inputFields.forEach(field => {
            // Skip fields that should remain disabled
            if (field.id === 'voucherNo' || field.id === 'status' || 
                field.classList.contains('gl-account')) {
                return;
            }
            
            field.disabled = false;
            field.classList.remove('bg-gray-100', 'cursor-not-allowed');
        });
        
        // Enable file input
        if (fileInput) {
            fileInput.disabled = false;
            fileInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
        }
        
        // Enable delete buttons in table rows
        tableRows.forEach(row => {
            const deleteBtn = row.querySelector('button[onclick="deleteRow(this)"]');
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });
    }
}

function populateFormData(data) {
    document.getElementById('voucherNo').value = data.voucherNo || '';
    
    // Update for searchable requesterName
    const requesterNameSearch = document.getElementById('requesterNameSearch');
    const requesterNameSelect = document.getElementById('requesterNameSelect');
    if (requesterNameSearch) {
        requesterNameSearch.value = data.requesterName || '';
        
        // Also set the select value to match
        if (requesterNameSelect) {
            // For requesterNameSelect, find or create option with the display name as value
            let optionExists = false;
            for (let i = 0; i < requesterNameSelect.options.length; i++) {
                if (requesterNameSelect.options[i].textContent === data.requesterName) {
                    requesterNameSelect.selectedIndex = i;
                    optionExists = true;
                    break;
                }
            }
            
            if (!optionExists && data.requesterName) {
                const newOption = document.createElement('option');
                newOption.value = data.requesterName; // Value is the same as text for requesterName
                newOption.textContent = data.requesterName;
                requesterNameSelect.appendChild(newOption);
                requesterNameSelect.value = data.requesterName;
            }
        }
    }
    
    // Set department value, creating option if it doesn't exist
    setDepartmentValue(data.department);
    document.getElementById('currency').value = data.currency || '';
    
    // Update for searchable payTo with business partners
    const payToSearch = document.getElementById('payToSearch');
    const payToSelect = document.getElementById('payToSelect');
    if (payToSearch && data.payTo) {
        // Find the corresponding business partner for the payTo ID
        const matchingBP = businessPartners.find(bp => bp.id.toString() === data.payTo.toString());
        
        if (matchingBP) {
            const displayText = `${matchingBP.code} - ${matchingBP.name}`;
            payToSearch.value = displayText;
            
            if (payToSelect) {
                // Find or create option with this business partner
                let optionExists = false;
                for (let i = 0; i < payToSelect.options.length; i++) {
                    if (payToSelect.options[i].value === data.payTo.toString()) {
                        payToSelect.selectedIndex = i;
                        optionExists = true;
                        break;
                    }
                }
                
                if (!optionExists) {
                    const newOption = document.createElement('option');
                    newOption.value = matchingBP.id;
                    newOption.textContent = displayText;
                    payToSelect.appendChild(newOption);
                    payToSelect.value = matchingBP.id;
                }
            }
        }
    }
    
    if (data.submissionDate) {
        const date = new Date(data.submissionDate);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('submissionDate').value = formattedDate;
    }
    
    document.getElementById('status').value = data.status || '';
    document.getElementById('referenceDoc').value = data.referenceDoc || '';
    document.getElementById('typeOfTransaction').value = data.typeOfTransaction || '';
    document.getElementById('remarks').value = data.remarks || '';
    
    // Set approval values in both select and search inputs
    setApprovalValue('preparedBy', data.preparedBy);
    setApprovalValue('acknowledgeBy', data.acknowledgedBy);
    setApprovalValue('checkedBy', data.checkedBy);
    setApprovalValue('approvedBy', data.approvedBy);
    setApprovalValue('receivedBy', data.receivedBy);
    
    // Update Submit button state based on preparedDate
    updateSubmitButtonState(data.preparedDate);
    
    // Control button visibility based on status
    controlButtonVisibility();
    
    populateReimbursementDetails(data.reimbursementDetails);
    displayAttachments(data.reimbursementAttachments);
    
    // Display revision history
    displayRevisionHistory(data);
    
    // Display rejection remarks if available
    displayRejectionRemarks(data);
}

// Helper function to set approval values in both select and search input
function setApprovalValue(fieldPrefix, userId) {
    if (!userId) return;
    
    const selectElement = document.getElementById(`${fieldPrefix}Select`);
    const searchInput = document.getElementById(`${fieldPrefix}Search`);
    
    if (selectElement) {
        selectElement.value = userId;
        
        // Also set the search input value
        if (searchInput && selectElement.selectedOptions[0]) {
            searchInput.value = selectElement.selectedOptions[0].textContent;
        }
    }
}

function populateReimbursementDetails(details) {
    const tableBody = document.getElementById('reimbursementDetails');
    tableBody.innerHTML = '';
    
    if (details && details.length > 0) {
        details.forEach(detail => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-2 border">
                    <div class="relative">
                        <input type="text" value="${detail.category || ''}" placeholder="Search category..." class="w-full p-1 border rounded search-input category-search" />
                        <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden category-dropdown"></div>
                        <select class="hidden category-select">
                            <option value="" disabled selected>Choose Category</option>
                        </select>
                    </div>
                </td>
                <td class="p-2 border">
                    <div class="relative">
                        <input type="text" value="${detail.accountName || ''}" placeholder="Search account name..." class="w-full p-1 border rounded search-input account-name-search" />
                        <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden account-name-dropdown"></div>
                        <select class="hidden account-name-select">
                            <option value="" disabled selected>Choose Account Name</option>
                        </select>
                    </div>
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.glAccount || ''}" class="w-full p-1 border rounded bg-gray-200 cursor-not-allowed gl-account" disabled />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.description || ''}" maxlength="10" class="w-full p-1 border rounded" required />
                </td>
                <td class="p-2 border">
                    <input type="number" value="${detail.amount || 0}" maxlength="10" class="w-full p-1 border rounded" required />
                </td>
                <td class="p-2 border text-center">
                    <button type="button" onclick="deleteRow(this)" data-id="${detail.id}" class="text-red-500 hover:text-red-700">
                        🗑
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
            
            // Setup event listeners for this row
            setupRowEventListeners(row);
            
            // Populate categories for this row if available
            populateCategoriesForNewRow(row);
        });
    } else {
        addRow();
    }
}

function displayAttachments(attachments) {
    const attachmentsList = document.getElementById('attachmentsList');
    attachmentsList.innerHTML = '';
    
    if (attachments && attachments.length > 0) {
        attachments.forEach(attachment => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';
            attachmentItem.innerHTML = `
                <span>${attachment.fileName}</span>
                <a href="${BASE_URL}/${attachment.filePath}" target="_blank" class="text-blue-500 hover:text-blue-700">View</a>
            `;
            attachmentsList.appendChild(attachmentItem);
        });
    }
}

function updateReim() {
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to update this reimbursement",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!'
    }).then((result) => {
        if (result.isConfirmed) {
            submitReimbursementUpdate();
        }
    });
}

async function submitReimbursementUpdate() {
    const id = getReimbursementIdFromUrl();
    if (!id) {
        Swal.fire('Error', 'No reimbursement ID found', 'error');
        return;
    }
    
    const detailsTable = document.getElementById('reimbursementDetails');
    const rows = detailsTable.querySelectorAll('tr');
    const reimbursementDetails = [];
    
    rows.forEach(row => {
        // Get category from search input
        const categoryInput = row.querySelector('.category-search');
        const accountNameInput = row.querySelector('.account-name-search');
        const glAccountInput = row.querySelector('.gl-account');
        const inputs = row.querySelectorAll("input[type='text']:not(.category-search):not(.account-name-search):not(.gl-account), input[type='number']");
        const deleteButton = row.querySelector('button');
        const detailId = deleteButton.getAttribute('data-id') || null;
        
        if (categoryInput && accountNameInput && glAccountInput && inputs.length >= 2) {
            reimbursementDetails.push({
                id: detailId,
                category: categoryInput.value || "",
                accountName: accountNameInput.value || "",
                glAccount: glAccountInput.value || "",
                description: inputs[0].value || "", // Description input
                amount: parseFloat(inputs[1].value) || 0 // Amount input
            });
        }
    });
    
    // Get requesterName from the search input (text value)
    const requesterName = document.getElementById('requesterNameSearch').value;
    
    // Get payTo ID from the hidden select element
    const payToSelect = document.getElementById('payToSelect');
    const payTo = payToSelect ? payToSelect.value : null;
    
    const requestData = {
        requesterName: requesterName,
        department: document.getElementById('department').value,
        currency: document.getElementById('currency').value,
        payTo: payTo,
        referenceDoc: document.getElementById('referenceDoc').value,
        typeOfTransaction: document.getElementById('typeOfTransaction').value,
        remarks: document.getElementById('remarks').value,
        preparedBy: document.getElementById('preparedBySelect').value || null,
        acknowledgedBy: document.getElementById('acknowledgeBySelect').value || null,
        checkedBy: document.getElementById('checkedBySelect').value || null,
        approvedBy: document.getElementById('approvedBySelect').value || null,
        receivedBy: document.getElementById('receivedBySelect').value || null,
        reimbursementDetails: reimbursementDetails
    };
    
    try {
        const response = await fetch(`${BASE_URL}/api/reimbursements/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            Swal.fire(
                'Updated!',
                'Reimbursement has been updated successfully.',
                'success'
            ).then(() => {
                fetchReimbursementData();
            });
        } else {
            Swal.fire(
                'Error',
                result.message || 'Failed to update reimbursement',
                'error'
            );
        }
    } catch (error) {
        console.error('Error updating reimbursement:', error);
        Swal.fire(
            'Error',
            'An error occurred while updating the reimbursement',
            'error'
        );
    }
}

function goToMenuReim() {
    window.location.href = '../pages/menuReim.html';
}

document.addEventListener('DOMContentLoaded', function() {
    // Load users, departments, business partners, and transaction types first
    Promise.all([fetchUsers(), fetchDepartments(), fetchBusinessPartners(), fetchTransactionTypes()]).then(() => {
        // Then load reimbursement data
        fetchReimbursementData();
    });
    
    // Setup event listeners for search dropdowns
    const searchFields = [
        'requesterNameSearch',
        'payToSearch',
        'preparedBySearch',
        'acknowledgeBySearch',
        'checkedBySearch',
        'approvedBySearch',
        'receivedBySearch'
    ];
    
    searchFields.forEach(fieldId => {
        const searchInput = document.getElementById(fieldId);
        if (searchInput) {
            searchInput.addEventListener('focus', function() {
                const actualFieldId = fieldId.replace('Search', 'Select');
                filterUsers(actualFieldId);
            });
            
            // Add input event for real-time filtering
            searchInput.addEventListener('input', function() {
                const actualFieldId = fieldId.replace('Search', 'Select');
                filterUsers(actualFieldId);
            });
        }
    });
    
    // Setup event listener to hide dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdowns = [
            'requesterNameSelectDropdown',
            'payToSelectDropdown',
            'preparedBySelectDropdown', 
            'acknowledgeBySelectDropdown', 
            'checkedBySelectDropdown', 
            'approvedBySelectDropdown',
            'receivedBySelectDropdown'
        ];
        
        const searchInputs = [
            'requesterNameSearch',
            'payToSearch',
            'preparedBySearch', 
            'acknowledgeBySearch', 
            'checkedBySearch', 
            'approvedBySearch',
            'receivedBySearch'
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
        
        // Handle table row dropdowns
        const categoryDropdowns = document.querySelectorAll('.category-dropdown');
        const accountNameDropdowns = document.querySelectorAll('.account-name-dropdown');
        
        categoryDropdowns.forEach(dropdown => {
            const input = dropdown.parentElement.querySelector('.category-search');
            if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
        
        accountNameDropdowns.forEach(dropdown => {
            const input = dropdown.parentElement.querySelector('.account-name-search');
            if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
    });
    
    // Setup event listeners for department and transaction type changes
    const departmentSelect = document.getElementById('department');
    const transactionTypeSelect = document.getElementById('typeOfTransaction');
    
    if (departmentSelect) {
        departmentSelect.addEventListener('change', handleDependencyChange);
    }
    
    if (transactionTypeSelect) {
        transactionTypeSelect.addEventListener('change', handleDependencyChange);
    }
});

// Display revision history based on API data
function displayRevisionHistory(data) {
    // Check if we have any revision data to display
    if (!data || (!data.firstRevisionDate && !data.secondRevisionDate && !data.thirdRevisionDate && !data.fourthRevisionDate)) {
        return; // No revision history to display
    }
    
    const revisedRemarksSection = document.getElementById('revisedRemarksSection');
    const revisedCount = document.getElementById('revisedCount');
    
    if (revisedRemarksSection && revisedCount) {
        // Count the number of revisions based on date fields
        let revisionCount = 0;
        if (data.firstRevisionDate) revisionCount++;
        if (data.secondRevisionDate) revisionCount++;
        if (data.thirdRevisionDate) revisionCount++;
        if (data.fourthRevisionDate) revisionCount++;
        
        // Only show revision history section if at least one revision exists
        if (data.firstRevisionDate) {
            // Show the revision history section
            revisedRemarksSection.style.display = 'block';
            revisedCount.textContent = revisionCount;
            
            // Display each revision container that has data
            if (data.firstRevisionDate) {
                const container = document.getElementById('firstRevisionContainer');
                const remarks = document.getElementById('firstRevisionRemarks');
                if (container && remarks) {
                    container.style.display = 'block';
                    remarks.textContent = data.firstRevisionRemarks || 'No remarks provided';
                }
            }
            
            if (data.secondRevisionDate) {
                const container = document.getElementById('secondRevisionContainer');
                const remarks = document.getElementById('secondRevisionRemarks');
                if (container && remarks) {
                    container.style.display = 'block';
                    remarks.textContent = data.secondRevisionRemarks || 'No remarks provided';
                }
            }
            
            if (data.thirdRevisionDate) {
                const container = document.getElementById('thirdRevisionContainer');
                const remarks = document.getElementById('thirdRevisionRemarks');
                if (container && remarks) {
                    container.style.display = 'block';
                    remarks.textContent = data.thirdRevisionRemarks || 'No remarks provided';
                }
            }
            
            if (data.fourthRevisionDate) {
                const container = document.getElementById('fourthRevisionContainer');
                const remarks = document.getElementById('fourthRevisionRemarks');
                if (container && remarks) {
                    container.style.display = 'block';
                    remarks.textContent = data.fourthRevisionRemarks || 'No remarks provided';
                }
            }
        }
    }
}

// Function to display rejection remarks if available
function displayRejectionRemarks(data) {
    // Check if we have rejection data to display
    if (!data || !data.rejectionRemarks || data.status !== 'Rejected') {
        return; // No rejection remarks to display or document is not rejected
    }
    
    const rejectionRemarksSection = document.getElementById('rejectionRemarksSection');
    const rejectionRemarks = document.getElementById('rejectionRemarks');
    
    if (rejectionRemarksSection && rejectionRemarks) {
        // Show the rejection remarks section
        rejectionRemarksSection.style.display = 'block';
        rejectionRemarks.textContent = data.rejectionRemarks;
        
        // Add a visual indicator that the document was rejected
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.classList.add('bg-red-100', 'text-red-800', 'font-semibold');
        }
    }
}

// Store global data for categories and account names
let allCategories = [];
let allAccountNames = [];
let transactionTypes = []; // Added to store transaction types
let businessPartners = []; // Added to store business partners

// Function to get department ID by name
async function getDepartmentIdByName(departmentName) {
    try {
        const response = await fetch(`${BASE_URL}/api/department`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        const departments = result.data;
        
        const department = departments.find(dept => dept.name === departmentName);
        return department ? department.id : null;
    } catch (error) {
        console.error("Error fetching department ID:", error);
        return null;
    }
}

// Function to fetch categories based on department and transaction type
async function fetchCategories(departmentId, transactionType) {
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/categories?departmentId=${departmentId}&menu=Reimbursement&transactionType=${encodeURIComponent(transactionType)}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const categories = await response.json();
        allCategories = categories;
        console.log('Fetched categories:', categories);
        
        // Update all category dropdowns in table rows
        updateAllCategoryDropdowns();
        
    } catch (error) {
        console.error("Error fetching categories:", error);
        allCategories = [];
        updateAllCategoryDropdowns();
    }
}

// Function to fetch account names based on category, department and transaction type
async function fetchAccountNames(category, departmentId, transactionType) {
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/account-names?category=${encodeURIComponent(category)}&departmentId=${departmentId}&menu=Reimbursement&transactionType=${encodeURIComponent(transactionType)}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const accountNames = await response.json();
        allAccountNames = accountNames;
        console.log('Fetched account names:', accountNames);
        
        return accountNames;
        
    } catch (error) {
        console.error("Error fetching account names:", error);
        return [];
    }
}

// Function to fetch transaction types
async function fetchTransactionTypes() {
    try {
        const response = await fetch(`${BASE_URL}/api/transactiontypes/filter?category=Reimbursement`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch transaction types');
        }
        
        transactionTypes = result.data;
        console.log('Stored', transactionTypes.length, 'transaction types in global cache');
        
        // Populate transaction types dropdown
        populateTransactionTypesDropdown(transactionTypes);
        
    } catch (error) {
        console.error("Error fetching transaction types:", error);
    }
}

// Function to populate transaction types dropdown
function populateTransactionTypesDropdown(types) {
    const typeSelect = document.getElementById("typeOfTransaction");
    if (!typeSelect) return;
    
    // Clear existing options
    typeSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Transaction Type";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    typeSelect.appendChild(defaultOption);
    
    // Add transaction types
    types.forEach(type => {
        const option = document.createElement("option");
        option.value = type.name; // Send name as the value
        option.textContent = type.name;
        typeSelect.appendChild(option);
    });
}

// Function to fetch business partners
async function fetchBusinessPartners() {
    try {
        const response = await fetch(`${BASE_URL}/api/business-partners/type/employee`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch business partners');
        }
        
        businessPartners = result.data;
        console.log('Stored', businessPartners.length, 'business partners in global cache');
        
    } catch (error) {
        console.error("Error fetching business partners:", error);
    }
}

// Function to update all category dropdowns
function updateAllCategoryDropdowns() {
    const categorySearchInputs = document.querySelectorAll('.category-search');
    
    categorySearchInputs.forEach(input => {
        // Store categories data for searching
        input.dataset.categories = JSON.stringify(allCategories);
        
        // Clear current value if categories changed
        const currentValue = input.value;
        if (currentValue && !allCategories.includes(currentValue)) {
            input.value = '';
            const row = input.closest('tr');
            const accountNameSearch = row.querySelector('.account-name-search');
            const glAccount = row.querySelector('.gl-account');
            if (accountNameSearch) accountNameSearch.value = '';
            if (glAccount) glAccount.value = '';
        }
    });
}

// Function to setup event listeners for table rows
function setupRowEventListeners(row) {
    const categorySearch = row.querySelector('.category-search');
    const categoryDropdown = row.querySelector('.category-dropdown');
    const accountNameSearch = row.querySelector('.account-name-search');
    const accountNameDropdown = row.querySelector('.account-name-dropdown');
    
    if (categorySearch) {
        // Populate with existing categories if available
        if (allCategories.length > 0) {
            categorySearch.dataset.categories = JSON.stringify(allCategories);
        }
        
        categorySearch.addEventListener('focus', function() {
            filterCategories(this);
        });
        
        categorySearch.addEventListener('input', function() {
            filterCategories(this);
        });
    }
    
    if (accountNameSearch) {
        accountNameSearch.addEventListener('focus', function() {
            filterAccountNames(this);
        });
        
        accountNameSearch.addEventListener('input', function() {
            filterAccountNames(this);
        });
    }
}

// Function to filter and display categories
function filterCategories(input) {
    const searchText = input.value.toLowerCase();
    const dropdown = input.parentElement.querySelector('.category-dropdown');
    
    if (!dropdown) return;
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    try {
        const categories = JSON.parse(input.dataset.categories || '[]');
        const filtered = categories.filter(category => 
            category.toLowerCase().includes(searchText)
        );
        
        // Display search results
        filtered.forEach(category => {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            option.innerText = category;
            option.onclick = function() {
                input.value = category;
                const selectElement = input.parentElement.querySelector('.category-select');
                if (selectElement) {
                    selectElement.value = category;
                }
                dropdown.classList.add('hidden');
                
                // Clear account name and GL account when category changes
                const row = input.closest('tr');
                const accountNameSearch = row.querySelector('.account-name-search');
                const glAccount = row.querySelector('.gl-account');
                if (accountNameSearch) accountNameSearch.value = '';
                if (glAccount) glAccount.value = '';
                
                // Trigger account names fetch
                loadAccountNamesForRow(row);
            };
            dropdown.appendChild(option);
        });
        
        // Show message if no results
        if (filtered.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'p-2 text-gray-500';
            noResults.innerText = 'No Categories Found';
            dropdown.appendChild(noResults);
        }
        
        // Show dropdown
        dropdown.classList.remove('hidden');
        
    } catch (error) {
        console.error("Error filtering categories:", error);
    }
}

// Function to filter and display account names
function filterAccountNames(input) {
    const searchText = input.value.toLowerCase();
    const dropdown = input.parentElement.querySelector('.account-name-dropdown');
    
    if (!dropdown) return;
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    try {
        const accountNames = JSON.parse(input.dataset.accountNames || '[]');
        const filtered = accountNames.filter(account => 
            account.accountName.toLowerCase().includes(searchText)
        );
        
        // Display search results
        filtered.forEach(account => {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            option.innerText = account.accountName;
            option.onclick = function() {
                input.value = account.accountName;
                const selectElement = input.parentElement.querySelector('.account-name-select');
                if (selectElement) {
                    selectElement.value = account.accountName;
                }
                dropdown.classList.add('hidden');
                
                // Auto-fill GL Account
                const row = input.closest('tr');
                const glAccount = row.querySelector('.gl-account');
                if (glAccount) {
                    glAccount.value = account.coa;
                }
            };
            dropdown.appendChild(option);
        });
        
        // Show message if no results
        if (filtered.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'p-2 text-gray-500';
            noResults.innerText = 'No Account Names Found';
            dropdown.appendChild(noResults);
        }
        
        // Show dropdown
        dropdown.classList.remove('hidden');
        
    } catch (error) {
        console.error("Error filtering account names:", error);
    }
}

// Function to load account names for a specific row
async function loadAccountNamesForRow(row) {
    const categoryInput = row.querySelector('.category-search');
    const accountNameInput = row.querySelector('.account-name-search');
    
    if (!categoryInput || !accountNameInput) return;
    
    const category = categoryInput.value;
    if (!category) return;
    
    // Get current department and transaction type
    const departmentName = document.getElementById('department').value;
    const transactionType = document.getElementById('typeOfTransaction').value;
    
    if (!departmentName || !transactionType) {
        console.log('Department or transaction type not selected');
        return;
    }
    
    try {
        const departmentId = await getDepartmentIdByName(departmentName);
        if (!departmentId) {
            console.error('Could not find department ID');
            return;
        }
        
        const accountNames = await fetchAccountNames(category, departmentId, transactionType);
        
        // Store account names data for this row
        accountNameInput.dataset.accountNames = JSON.stringify(accountNames);
        
    } catch (error) {
        console.error('Error loading account names for row:', error);
    }
}

// Function to handle department or transaction type changes
async function handleDependencyChange() {
    const departmentName = document.getElementById('department').value;
    const transactionType = document.getElementById('typeOfTransaction').value;
    
    if (!departmentName || !transactionType) {
        console.log('Department or transaction type not fully selected');
        allCategories = [];
        updateAllCategoryDropdowns();
        return;
    }
    
    try {
        const departmentId = await getDepartmentIdByName(departmentName);
        if (!departmentId) {
            console.error('Could not find department ID');
            return;
        }
        
        // Fetch new categories
        await fetchCategories(departmentId, transactionType);
        
    } catch (error) {
        console.error('Error handling dependency change:', error);
    }
}

// Function to populate categories for a new row
function populateCategoriesForNewRow(row) {
    const categorySearch = row.querySelector('.category-search');
    
    if (categorySearch && allCategories.length > 0) {
        // Store categories data for the new row
        categorySearch.dataset.categories = JSON.stringify(allCategories);
        console.log('Populated categories for new row:', allCategories.length, 'categories');
    } else if (categorySearch) {
        console.log('No categories available to populate for new row');
        
        // Check if department and transaction type are selected, if so trigger fetch
        const departmentName = document.getElementById('department').value;
        const transactionType = document.getElementById('typeOfTransaction').value;
        
        if (departmentName && transactionType) {
            console.log('Department and transaction type are selected, triggering category fetch...');
            handleDependencyChange().then(() => {
                // After categories are fetched, populate this row
                if (allCategories.length > 0) {
                    categorySearch.dataset.categories = JSON.stringify(allCategories);
                    console.log('Categories populated after fetch for new row');
                }
            });
        }
    }
}

// Function to format amount with decimal places
function formatAmount(amount) {
    // Ensure amount is a number
    const numericValue = parseFloat(amount) || 0;
    
    // Format with thousands separator and 2 decimal places
    return numericValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Function to calculate and update the total amount
function updateTotalAmount() {
    const amountInputs = document.querySelectorAll('#reimbursementDetails input[data-raw-value]');
    let total = 0;
    
    amountInputs.forEach(input => {
        // Get numeric value from data-raw-value attribute
        const numericValue = parseFloat(input.getAttribute('data-raw-value')) || 0;
        total += numericValue;
    });
    
    // Format total with thousands separator
    const formattedTotal = total.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Update total amount field
    document.getElementById('totalAmount').value = formattedTotal;
}

// Override populateReimbursementDetails to use proper amount formatting
const originalPopulateReimbursementDetails = window.populateReimbursementDetails;
window.populateReimbursementDetails = function(details) {
    const tableBody = document.getElementById('reimbursementDetails');
    if (!tableBody) {
        console.error('reimbursementDetails table body not found');
        return;
    }
    
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (details && details.length > 0) {
        details.forEach(detail => {
            // Format amount with decimal places
            const formattedAmount = formatAmount(detail.amount);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-2 border">
                    <input type="text" value="${detail.category || ''}" maxlength="200" class="w-full" required />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.accountName || ''}" maxlength="30" class="w-full" required />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.glAccount || ''}" maxlength="10" class="w-full" required />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.description || ''}" maxlength="200" class="w-full" required />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${formattedAmount}" data-raw-value="${detail.amount || 0}" class="w-full text-right" required oninput="formatInputAmount(this)" />
                </td>
                <td class="p-2 border text-center">
                    <button type="button" onclick="deleteRow(this)" data-id="${detail.id}" class="text-red-500 hover:text-red-700">
                        🗑
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        // Add an empty row if no details
        addRow();
    }
    
    // Calculate and update the total amount
    updateTotalAmount();
};

// Format input amount as user types
function formatInputAmount(input) {
    // Get the raw input value without formatting
    const rawValue = input.value.replace(/[^\d.-]/g, '');
    const numericValue = parseFloat(rawValue) || 0;
    
    // Store the raw numeric value as an attribute
    input.setAttribute('data-raw-value', numericValue);
    
    // Format the display value
    input.value = formatAmount(numericValue);
    
    // Update the total amount
    updateTotalAmount();
}

// Override addRow to use the same amount formatting
window.addRow = function() {
    const tableBody = document.getElementById('reimbursementDetails');
    if (!tableBody) {
        console.error('reimbursementDetails table body not found');
        return;
    }
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" required />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="30" class="w-full" required />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="10" class="w-full" required />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" required />
        </td>
        <td class="p-2 border">
            <input type="text" value="0.00" data-raw-value="0" class="w-full text-right" required oninput="formatInputAmount(this)" />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;
    tableBody.appendChild(newRow);
    
    // Update total amount
    updateTotalAmount();
};

// Override deleteRow to update total amount after deletion
const originalDeleteRow = window.deleteRow;
window.deleteRow = function(button) {
    if (typeof originalDeleteRow === 'function') {
        originalDeleteRow(button);
    } else {
        // Default implementation if original function doesn't exist
        const row = button.closest('tr');
        if (row) {
            row.remove();
        }
    }
    
    // Update total amount after row deletion
    updateTotalAmount();
};

    