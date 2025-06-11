let uploadedFiles = [];
let reimbursementId = '';

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
            <input type="text" maxlength="200" class="w-full" required />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="10" class="w-full bg-gray-200" disabled/>
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="10" class="w-full bg-gray-200" disabled/>
        </td>
        <td class="p-2 border">
            <input type="number" maxlength="10" class="w-full" required />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;
    tableBody.appendChild(newRow);
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
        let displayName = matchingUser.firstName;
        if (matchingUser.middleName) displayName += ` ${matchingUser.middleName}`;
        if (matchingUser.lastName) displayName += ` ${matchingUser.lastName}`;
        
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
        populateDropdown("payToSelect", users, false); // Use ID as value
        populateDropdown("preparedBySelect", users, false);
        populateDropdown("acknowledgeBySelect", users, false);
        populateDropdown("checkedBySelect", users, false);
        populateDropdown("approvedBySelect", users, false);
        
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
    
    // Handle all searchable selects
    if (fieldId === 'requesterNameSelect' || 
        fieldId === 'payToSelect' ||
        fieldId === 'preparedBySelect' || 
        fieldId === 'acknowledgeBySelect' || 
        fieldId === 'checkedBySelect' || 
        fieldId === 'approvedBySelect') {
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
                        const payToSearch = document.getElementById('payToSearch');
                        const payToSelect = document.getElementById('payToSelect');
                        
                        if (payToSearch && payToSelect) {
                            // Find the matching user to get the ID
                            payToSearch.value = user.name;
                            
                            // Set the ID as the value in the select element
                            for (let i = 0; i < payToSelect.options.length; i++) {
                                if (payToSelect.options[i].textContent === user.name) {
                                    payToSelect.selectedIndex = i;
                                    break;
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
        let displayName = user.firstName;
        if (user.middleName) displayName += ` ${user.middleName}`;
        if (user.lastName) displayName += ` ${user.lastName}`;
        
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
        "payToSelect",
        "preparedBySelect", 
        "acknowledgeBySelect", 
        "checkedBySelect", 
        "approvedBySelect"
    ];
    
    if (searchableFields.includes(dropdownId)) {
        const searchInput = document.getElementById(dropdownId.replace("Select", "Search"));
        if (searchInput) {
            // Store users data for searching
            searchInput.dataset.users = JSON.stringify(users.map(user => {
                let displayName = user.firstName;
                if (user.middleName) displayName += ` ${user.middleName}`;
                if (user.lastName) displayName += ` ${user.lastName}`;
                return {
                    id: user.id,
                    name: displayName
                };
            }));
        }
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
    
    // Update for searchable payTo
    const payToSearch = document.getElementById('payToSearch');
    const payToSelect = document.getElementById('payToSelect');
    if (payToSearch && data.payTo) {
        // Find the corresponding name for the payTo ID
        if (payToSelect) {
            for (let i = 0; i < payToSelect.options.length; i++) {
                if (payToSelect.options[i].value === data.payTo.toString()) {
                    payToSelect.selectedIndex = i;
                    payToSearch.value = payToSelect.options[i].textContent;
                    break;
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
    
    // Update Submit button state based on preparedDate
    updateSubmitButtonState(data.preparedDate);
    
    populateReimbursementDetails(data.reimbursementDetails);
    displayAttachments(data.reimbursementAttachments);
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
                    <input type="text" value="${detail.description || ''}" maxlength="200" class="w-full" required />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.glAccount || ''}" maxlength="10" class="w-full bg-gray-200" disabled/>
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.accountName || ''}" maxlength="10" class="w-full bg-gray-200" disabled/>
                </td>
                <td class="p-2 border">
                    <input type="number" value="${detail.amount || 0}" maxlength="10" class="w-full" required />
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
        const inputs = row.querySelectorAll('input');
        const deleteButton = row.querySelector('button');
        const detailId = deleteButton.getAttribute('data-id') || null;
        
        reimbursementDetails.push({
            id: detailId,
            description: inputs[0].value,
            glAccount: inputs[1].value,
            accountName: inputs[2].value,
            amount: parseFloat(inputs[3].value) || 0
        });
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
    // Load users and departments first
    Promise.all([fetchUsers(), fetchDepartments()]).then(() => {
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
        'approvedBySearch'
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
            'approvedBySelectDropdown'
        ];
        
        const searchInputs = [
            'requesterNameSearch',
            'payToSearch',
            'preparedBySearch', 
            'acknowledgeBySearch', 
            'checkedBySearch', 
            'approvedBySearch'
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
});

    