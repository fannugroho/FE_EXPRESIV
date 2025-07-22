let reimbursementId = '';

// Global variables for data storage
let businessPartners = [];
let allCategories = [];
let allAccountNames = [];
let transactionTypes = [];



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
    if (files.length > 5) {
        Swal.fire({
            icon: 'warning',
            title: 'Too Many Files',
            text: 'Maximum 5 PDF files are allowed.'
        });
        return;
    }

    // Validate all files are PDF
    const pdfFiles = Array.from(files).filter(file => {
        if (file.type !== 'application/pdf') {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File Type',
                text: `File "${file.name}" is not a PDF. Only PDF files are allowed.`
            });
            return false;
        }
        return true;
    });

    if (pdfFiles.length > 0) {
        // Upload files immediately
        uploadAttachments(pdfFiles);
    }
    
    // Clear the file input
    event.target.value = '';
}

function displayFileList() {
    const attachmentsList = document.getElementById('attachmentsList');
    attachmentsList.innerHTML = '';
    
    // First, display existing attachments from database (if any)
    if (window.existingAttachments && window.existingAttachments.length > 0) {
        window.existingAttachments.forEach((attachment, index) => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';
            
            attachmentItem.innerHTML = `
                <span>${attachment.fileName}</span>
                <div class="flex items-center space-x-2">
                    <a href="${BASE_URL}/${attachment.filePath}" target="_blank" class="text-blue-500 hover:text-blue-700">View</a>
                    <button type="button" class="delete-attachment-btn text-red-500 hover:text-red-700 font-bold text-lg" data-attachment-id="${attachment.id}" data-file-name="${attachment.fileName}">×</button>
                </div>
            `;
            
            // Add event listener to the delete button
            const deleteBtn = attachmentItem.querySelector('.delete-attachment-btn');
            deleteBtn.addEventListener('click', function() {
                const attachmentId = this.getAttribute('data-attachment-id');
                const fileName = this.getAttribute('data-file-name');
                deleteAttachment(attachmentId, fileName);
            });
            
            attachmentsList.appendChild(attachmentItem);
        });
    }
    
    // Note: New files are now uploaded immediately, so this section is simplified
    // The uploadedFiles array will be empty since files are uploaded directly
}

// Function removeFile is no longer needed since files are uploaded immediately

// Function to upload attachments to server
async function uploadAttachments(files) {
    const reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId) {
        Swal.fire('Error', 'Reimbursement ID not found', 'error');
        return;
    }
    
    // Validate that all files are PDF
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== 'application/pdf') {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File Type',
                text: `File "${file.name}" is not a PDF. Only PDF files are allowed.`
            });
            return;
        }
    }
    
    try {
        // Prepare FormData for file upload
        const formData = new FormData();
        
        // Add all files to formData
        Array.from(files).forEach(file => {
            formData.append('files', file);
            console.log('Adding file for upload:', file.name);
        });
        
        // Show loading message
        Swal.fire({
            title: 'Uploading Attachments',
            text: 'Please wait while we upload your files...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Send to server using API endpoint
        console.log(`Uploading attachments to: ${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/upload`);
        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/upload`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            console.log('Upload attachment successful:', result);
            
            // Refresh data to show new attachments
            await fetchReimbursementData();
            
            Swal.fire({
                icon: 'success',
                title: 'Upload Successful',
                text: 'Attachments have been uploaded successfully.'
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: result.message || 'Failed to upload attachments'
            });
            console.error('Upload attachment failed:', result);
        }
    } catch (error) {
        console.error('Error uploading attachments:', error);
        Swal.fire({
            icon: 'error',
            title: 'Upload Error',
            text: 'An error occurred while uploading files'
        });
    }
}

// Function to format number with US format (comma as thousands separator, period as decimal separator)
function formatCurrencyIDR(number) {
    // Handle empty or invalid input
    if (number === null || number === undefined || number === '') {
        return '0.00';
    }
    
    // Parse number, handle large values
    let num;
    try {
        // Handle input string which might be very large
        if (typeof number === 'string') {
            // Remove all non-numeric characters except decimal point and comma
            const cleanedStr = number.replace(/[^\d,.]/g, '');
            // Use parseFloat for small numbers, use string technique for large numbers
            if (cleanedStr.length > 15) {
                // For very large numbers, handle carefully
                // Remove commas and parse
                num = Number(cleanedStr.replace(/,/g, ''));
            } else {
                num = parseFloat(cleanedStr.replace(/,/g, ''));
            }
        } else {
            num = Number(number); // Use Number for better handling of large numbers
        }
        
        // If parsing fails, return zero
        if (isNaN(num)) {
            return '0.00';
        }
    } catch (e) {
        console.error('Error parsing number:', e);
        return '0.00';
    }
    
    // Limit to maximum 100 trillion
    const maxAmount = 100000000000000; // 100 trillion
    if (num > maxAmount) {
        Swal.fire({
            icon: 'warning',
            title: 'Amount Exceeds Limit',
            text: 'Total amount cannot exceed 100 trillion rupiah'
        });
        num = maxAmount;
    }
    
    // Format with US format (comma as thousands separator, period as decimal separator)
    // For very large numbers, use manual method
    if (num >= 1e12) { // If number >= 1 trillion
        let strNum = num.toString();
        let result = '';
        let count = 0;
        
        // Add comma every 3 digits from right to left
        for (let i = strNum.length - 1; i >= 0; i--) {
            result = strNum[i] + result;
            count++;
            if (count % 3 === 0 && i > 0) {
                result = ',' + result;
            }
        }
        
        // Add 2 decimals
        return result + '.00';
    } else {
        // For smaller numbers, use toLocaleString
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

// Function to parse US format back to number
function parseCurrencyIDR(formattedValue) {
    if (!formattedValue) return 0;
    
    try {
        // Handle US format (thousands separator: ',', decimal separator: '.')
        // Remove commas (thousands separator)
        const numericValue = formattedValue.toString().replace(/,/g, '');
        
        return parseFloat(numericValue) || 0;
    } catch (e) {
        console.error('Error parsing currency:', e);
        return 0;
    }
}

// Function to format input field value as currency while user is typing
function formatCurrencyInputIDR(input) {
    // Save cursor position
    const cursorPos = input.selectionStart;
    const originalLength = input.value.length;
    
    // Get value and remove all non-digit, period and comma characters
    let value = input.value.replace(/[^\d,.]/g, '');
    
    // Ensure there is only one decimal separator
    let parts = value.split('.');
    if (parts.length > 1) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Parse value to number for calculation
    const numValue = parseCurrencyIDR(value);
    
    // Format with US format
    const formattedValue = formatCurrencyIDR(numValue);
    
    // Update input value
    input.value = formattedValue;
    
    // Calculate and update total
    updateTotalAmount();
    
    // Adjust cursor position
    const newLength = input.value.length;
    const newCursorPos = cursorPos + (newLength - originalLength);
    input.setSelectionRange(Math.max(0, newCursorPos), Math.max(0, newCursorPos));
}

// Function to calculate total amount from all rows
function updateTotalAmount() {
    const amountInputs = document.querySelectorAll('#reimbursementDetails tr td:nth-child(5) input');
    let total = 0;
    
    amountInputs.forEach(input => {
        // Extract numeric value from input
        const amountText = input.value.trim();
        // Convert from US format to standard format for calculation
        const numericValue = parseCurrencyIDR(amountText);
        total += numericValue;
    });
    
    // Check if total exceeds 100 trillion
    const maxAmount = 100000000000000; // 100 trillion
    if (total > maxAmount) {
        Swal.fire({
            icon: 'warning',
            title: 'Amount Exceeds Limit',
            text: 'Total amount cannot exceed 100 trillion rupiah'
        });
        total = maxAmount;
    }
    
    // Format total with US format and display
    const formattedTotal = formatCurrencyIDR(total);
    
    // Update total amount field
    const totalAmountField = document.getElementById('totalAmount');
    if (totalAmountField) {
        totalAmountField.value = formattedTotal;
    }
}

function addRow() {
    const tableBody = document.getElementById('reimbursementDetails');
    
    // Check if status is "Prepared" to disable table inputs
    const status = document.getElementById('status').value;
    const isPreparedStatus = status === 'Prepared';
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td class="p-2 border">
            <div class="relative">
                <input type="text" placeholder="Search category..." class="w-full p-1 border rounded search-input category-search ${isPreparedStatus ? 'bg-gray-100 cursor-not-allowed' : ''}" ${isPreparedStatus ? 'disabled' : ''} />
                <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden category-dropdown"></div>
                <select class="hidden category-select">
                    <option value="" disabled selected>Choose Category</option>
                </select>
            </div>
        </td>
        <td class="p-2 border">
            <div class="relative">
                <input type="text" placeholder="Search account name..." class="w-full p-1 border rounded search-input account-name-search ${isPreparedStatus ? 'bg-gray-100 cursor-not-allowed' : ''}" ${isPreparedStatus ? 'disabled' : ''} />
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
            <input type="text" maxlength="200" class="w-full p-1 border rounded ${isPreparedStatus ? 'bg-gray-100 cursor-not-allowed' : ''}" ${isPreparedStatus ? 'disabled' : ''} required />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full p-1 border rounded currency-input-idr ${isPreparedStatus ? 'bg-gray-100 cursor-not-allowed' : ''}" ${isPreparedStatus ? 'disabled' : ''} oninput="formatCurrencyInputIDR(this)" required />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700 ${isPreparedStatus ? 'opacity-50 cursor-not-allowed' : ''}" ${isPreparedStatus ? 'disabled' : ''}>
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
    // Update total amount after row deletion
    updateTotalAmount();
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
                // Update the button state directly but don't refresh form data
                updateSubmitButtonState(new Date().toISOString());
                // Don't call fetchReimbursementData() to preserve user changes
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
    const submitButton = document.querySelector('button[onclick="submitReim()"]');
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
        setTimeout(() => {
            handleDependencyChange();
        }, 100); // Small delay to ensure DOM is updated
    }
}

// Helper function to auto-fill department based on selected requester
function autoFillDepartmentFromRequester(requesterName, users) {
    console.log('Auto-filling department for requester:', requesterName);
    console.log('Available users:', users);
    
    // Find the user by name from the users data passed from API
    const selectedUser = users.find(user => {
        // In revision, the users are stored with simplified structure {id, name}
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
        let displayName = user.fullName || 'Unknown User';
        
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
                let displayName = user.fullName || 'Unknown User';
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
    const submitButton = document.querySelector("button[onclick='submitReim()']");
    
    // Get all form fields that should be controlled
    const inputFields = document.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea');
    const fileInput = document.getElementById('filePath');
    const tableRows = document.querySelectorAll('#reimbursementDetails tr');
    
    // Jika status bukan Draft dan Revised, sembunyikan tombol dan nonaktifkan field
    if (status !== "Draft" && status !== "Revised") {
        // Hide buttons
        addRowButton.style.display = "none";
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
        
        // Additional handling for "Prepared" status - make all fields readonly
        if (status === "Prepared") {
            // Disable all form inputs including textareas
            const allFormElements = document.querySelectorAll('input, select, textarea');
            allFormElements.forEach(element => {
                element.disabled = true;
                element.classList.add('bg-gray-100', 'cursor-not-allowed');
            });
            
            // Disable all table input fields
            const tableInputs = document.querySelectorAll('#reimbursementDetails input');
            tableInputs.forEach(input => {
                input.disabled = true;
                input.classList.add('bg-gray-100', 'cursor-not-allowed');
            });
            
            // Disable all dropdowns in the table
            const tableDropdowns = document.querySelectorAll('#reimbursementDetails .search-input');
            tableDropdowns.forEach(dropdown => {
                dropdown.disabled = true;
                dropdown.classList.add('bg-gray-100', 'cursor-not-allowed');
            });
        }
    } else {
        // Show buttons
        addRowButton.style.display = "block";
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
    
    // Format date for the date input (YYYY-MM-DD) with local timezone
    if (data.submissionDate) {
        // Buat objek Date dari string tanggal
        const date = new Date(data.submissionDate);
        
        // Gunakan metode yang mempertahankan zona waktu lokal
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
        const day = String(date.getDate()).padStart(2, '0');
        
        // Format tanggal dalam format YYYY-MM-DD untuk input date
        const formattedDate = `${year}-${month}-${day}`;
        
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
    
    if (data.revisions) {
        renderRevisionHistory(data.revisions);
    } else {
        renderRevisionHistory([]);
    }
    
    // Trigger category loading if department and transaction type are populated
    setTimeout(() => {
        const departmentName = document.getElementById('department').value;
        const transactionType = document.getElementById('typeOfTransaction').value;
        
        if (departmentName && transactionType) {
            handleDependencyChange();
        }
    }, 500); // Small delay to ensure form is fully populated
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
    
    // Check if status is "Prepared" to disable table inputs
    const status = document.getElementById('status').value;
    const isPreparedStatus = status === 'Prepared';
    
    if (details && details.length > 0) {
        details.forEach(detail => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-2 border">
                    <div class="relative">
                        <input type="text" value="${detail.category || ''}" placeholder="Search category..." class="w-full p-1 border rounded search-input category-search ${isPreparedStatus ? 'bg-gray-100 cursor-not-allowed' : ''}" ${isPreparedStatus ? 'disabled' : ''} />
                        <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden category-dropdown"></div>
                        <select class="hidden category-select">
                            <option value="" disabled selected>Choose Category</option>
                        </select>
                    </div>
                </td>
                <td class="p-2 border">
                    <div class="relative">
                        <input type="text" value="${detail.accountName || ''}" placeholder="Search account name..." class="w-full p-1 border rounded search-input account-name-search ${isPreparedStatus ? 'bg-gray-100 cursor-not-allowed' : ''}" ${isPreparedStatus ? 'disabled' : ''} />
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
                    <input type="text" value="${detail.description || ''}" maxlength="200" class="w-full p-1 border rounded ${isPreparedStatus ? 'bg-gray-100 cursor-not-allowed' : ''}" ${isPreparedStatus ? 'disabled' : ''} required />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${formatCurrencyIDR(detail.amount) || '0.00'}" class="w-full p-1 border rounded currency-input-idr ${isPreparedStatus ? 'bg-gray-100 cursor-not-allowed' : ''}" ${isPreparedStatus ? 'disabled' : ''} oninput="formatCurrencyInputIDR(this)" required />
                </td>
                <td class="p-2 border text-center">
                    <button type="button" onclick="deleteRow(this)" data-id="${detail.id}" class="text-red-500 hover:text-red-700 ${isPreparedStatus ? 'opacity-50 cursor-not-allowed' : ''}" ${isPreparedStatus ? 'disabled' : ''}>
                        🗑
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
            
            // Setup event listeners for the new row
            setupRowEventListeners(row);
            
            // Populate categories for the new row if data is available
            populateCategoriesForNewRow(row);
        });
    } else {
        addRow();
    }
    
    // Calculate total amount after populating details
    updateTotalAmount();
}

function displayAttachments(attachments) {
    // Store existing attachments in global variable for use in displayFileList
    window.existingAttachments = attachments || [];
    
    // Use displayFileList to show both existing and new attachments
    displayFileList();
}

// Function to delete attachment
async function deleteAttachment(attachmentId, fileName) {
    // Check if status is "Prepared" to prevent deletion
    const status = document.getElementById('status').value;
    if (status === 'Prepared') {
        Swal.fire('Error', 'Cannot delete attachments when document status is Prepared', 'error');
        return;
    }
    
    // Get reimbursement ID from URL
    const reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId) {
        Swal.fire('Error', 'Reimbursement ID not found', 'error');
        return;
    }
    
    Swal.fire({
        title: 'Are you sure?',
        text: `You are about to delete the attachment: ${fileName}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // Use the correct API endpoint with reimbursement ID
                const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/${attachmentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                // Check if response is ok before trying to parse JSON
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Attachment not found or already deleted');
                    } else {
                        throw new Error(`Server error: ${response.status}`);
                    }
                }
                
                const result = await response.json();
                
                if (result.status && result.code === 200) {
                    Swal.fire(
                        'Deleted!',
                        'Attachment has been deleted successfully.',
                        'success'
                    ).then(() => {
                        // Remove the deleted attachment from window.existingAttachments
                        if (window.existingAttachments) {
                            window.existingAttachments = window.existingAttachments.filter(
                                attachment => attachment.id.toString() !== attachmentId.toString()
                            );
                        }
                        // Update the display
                        displayFileList();
                    });
                } else {
                    Swal.fire(
                        'Error',
                        result.message || 'Failed to delete attachment',
                        'error'
                    );
                }
            } catch (error) {
                console.error('Error deleting attachment:', error);
                Swal.fire(
                    'Error',
                    error.message || 'An error occurred while deleting the attachment',
                    'error'
                );
            }
        }
    });
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
            submitReimbursementUpdate().then(() => {
                submitDocument();
            });
        }
    });
}

// Renamed function to match the button's new name
function submitReim() {
    console.log('=== DEBUG: submitReim() called ===');
    
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to submit this reimbursement",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, submit it!'
    }).then((result) => {
        console.log('User choice:', result.isConfirmed);
        if (result.isConfirmed) {
            console.log('User confirmed submission, calling submitReimbursementUpdate()');
            submitReimbursementUpdate().then(() => {
                console.log('submitReimbursementUpdate completed, calling submitDocument()');
                submitDocument();
            }).catch((error) => {
                console.error('Error in submitReimbursementUpdate:', error);
            });
        }
    });
}

async function submitReimbursementUpdate() {
    console.log('=== DEBUG: Starting submitReimbursementUpdate ===');
    console.log('BASE_URL available:', typeof BASE_URL !== 'undefined');
    console.log('BASE_URL value:', BASE_URL);
    
    const id = getReimbursementIdFromUrl();
    if (!id) {
        Swal.fire('Error', 'No reimbursement ID found', 'error');
        return;
    }
    
    console.log('Reimbursement ID:', id);
    
    // Collect all form data first
    const formData = {
        requesterName: document.getElementById('requesterNameSearch').value,
        department: document.getElementById('department').value,
        currency: document.getElementById('currency').value,
        referenceDoc: document.getElementById('referenceDoc').value,
        typeOfTransaction: document.getElementById('typeOfTransaction').value,
        remarks: document.getElementById('remarks').value,
        preparedBy: document.getElementById('preparedBySelect').value || null,
        acknowledgedBy: document.getElementById('acknowledgeBySelect').value || null,
        checkedBy: document.getElementById('checkedBySelect').value || null,
        approvedBy: document.getElementById('approvedBySelect').value || null,
        receivedBy: document.getElementById('receivedBySelect').value || null
    };
    
    // Get payTo ID from the hidden select element
    const payToSelect = document.getElementById('payToSelect');
    formData.payTo = payToSelect ? payToSelect.value : null;
    
    console.log('Form data collected:', formData);
    console.log('Form elements found:');
    console.log('- requesterNameSearch:', document.getElementById('requesterNameSearch'));
    console.log('- department:', document.getElementById('department'));
    console.log('- currency:', document.getElementById('currency'));
    console.log('- referenceDoc:', document.getElementById('referenceDoc'));
    console.log('- typeOfTransaction:', document.getElementById('typeOfTransaction'));
    console.log('- remarks:', document.getElementById('remarks'));
    console.log('- preparedBySelect:', document.getElementById('preparedBySelect'));
    console.log('- acknowledgeBySelect:', document.getElementById('acknowledgeBySelect'));
    console.log('- checkedBySelect:', document.getElementById('checkedBySelect'));
    console.log('- approvedBySelect:', document.getElementById('approvedBySelect'));
    console.log('- receivedBySelect:', document.getElementById('receivedBySelect'));
    console.log('- payToSelect:', payToSelect);
    
    // Validate required fields
    if (!formData.requesterName) {
        Swal.fire('Error', 'Requester name is required', 'error');
        return;
    }
    
    if (!formData.department) {
        Swal.fire('Error', 'Department is required', 'error');
        return;
    }
    
    if (!formData.currency) {
        Swal.fire('Error', 'Currency is required', 'error');
        return;
    }
    
    if (!formData.payTo) {
        Swal.fire('Error', 'Pay To is required', 'error');
        return;
    }
    
    // Collect reimbursement details from table
    const detailsTable = document.getElementById('reimbursementDetails');
    const rows = detailsTable.querySelectorAll('tr');
    const existingDetails = [];
    const newDetails = [];
    
    console.log('Total rows found:', rows.length);
    
    rows.forEach((row, index) => {
        console.log(`--- Processing row ${index + 1} ---`);
        
        // Get all input elements in the row
        const categoryInput = row.querySelector('.category-search');
        const accountNameInput = row.querySelector('.account-name-search');
        const glAccountInput = row.querySelector('.gl-account');
        const descriptionInput = row.querySelector('input[type="text"]:not(.category-search):not(.account-name-search):not(.gl-account)');
        const amountInput = row.querySelector('input[type="text"].currency-input-idr, input[type="number"]');
        const deleteButton = row.querySelector('button');
        const detailId = deleteButton ? deleteButton.getAttribute('data-id') : null;
        
        console.log('Row elements found:');
        console.log('- categoryInput:', categoryInput);
        console.log('- accountNameInput:', accountNameInput);
        console.log('- glAccountInput:', glAccountInput);
        console.log('- descriptionInput:', descriptionInput);
        console.log('- amountInput:', amountInput);
        console.log('- deleteButton:', deleteButton);
        console.log('- detailId:', detailId);
        
        // Process row if it has the required inputs
        if (categoryInput && accountNameInput && glAccountInput && descriptionInput && amountInput) {
            const amountText = amountInput.value;
            const amount = parseCurrencyIDR(amountText);
            
            const detail = {
                category: categoryInput.value || "",
                accountName: accountNameInput.value || "",
                glAccount: glAccountInput.value || "",
                description: descriptionInput.value || "",
                amount: amount
            };
            
            // Separate existing and new details
            if (detailId) {
                detail.id = detailId;
                existingDetails.push(detail);
                console.log('Adding existing detail:', detail);
            } else {
                newDetails.push(detail);
                console.log('Adding new detail:', detail);
            }
        } else {
            console.log('Skipping row - missing required inputs');
        }
    });
    
    console.log('Existing details count:', existingDetails.length);
    console.log('New details count:', newDetails.length);
    
    if (existingDetails.length === 0 && newDetails.length === 0) {
        Swal.fire('Error', 'At least one reimbursement detail is required', 'error');
        return;
    }
    
    try {
        // First, update existing reimbursement details
        if (existingDetails.length > 0) {
            console.log('Updating existing reimbursement details...');
            const updateResponse = await fetch(`${BASE_URL}/api/reimbursements/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    reimbursementDetails: existingDetails
                })
            });
            
            console.log('Update response status:', updateResponse.status);
            const updateResult = await updateResponse.json();
            console.log('Update response data:', updateResult);
            
            if (!updateResult.status || updateResult.code !== 200) {
                throw new Error(updateResult.message || 'Failed to update existing reimbursement details');
            }
        }
        
        // Then, add new reimbursement details if any
        if (newDetails.length > 0) {
            console.log('Adding new reimbursement details...');
            const addResponse = await fetch(`${BASE_URL}/api/reimbursements/detail/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newDetails)
            });
            
            console.log('Add response status:', addResponse.status);
            const addResult = await addResponse.json();
            console.log('Add response data:', addResult);
            
            if (!addResult.status || addResult.code !== 200) {
                throw new Error(addResult.message || 'Failed to add new reimbursement details');
            }
        }
        
        Swal.fire(
            'Updated!',
            'Reimbursement has been updated successfully.',
            'success'
        ).then(() => {
            // Redirect to menuReimRevision.html after successful submission
            window.location.href = '../../../dashboard/dashboardRevision/reimbursement/menuReimRevision.html';
        });
        
    } catch (error) {
        console.error('Error updating reimbursement:', error);
        Swal.fire(
            'Error',
            error.message || 'An error occurred while updating the reimbursement',
            'error'
        );
    }
}

function goToMenuReim() {
    window.location.href = '../../../dashboard/dashboardRevision/reimbursement/menuReimRevision.html';
}

function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function renderRevisionHistory(revisions) {
    const section = document.getElementById('revisedRemarksSection');
    if (!section) return;

    if (!Array.isArray(revisions) || revisions.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    // Group revisions by stage
    const grouped = {};
    revisions.forEach(rev => {
        if (!grouped[rev.stage]) grouped[rev.stage] = [];
        grouped[rev.stage].push(rev);
    });
    // Build HTML
    let html = '';
    html += `<h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>`;
    html += `<div class="bg-gray-50 p-4 rounded-lg border"><div class="mb-2"><span class="text-sm font-medium text-gray-600">Total Revisions: </span><span id="revisedCount" class="text-sm font-bold text-blue-600">${revisions.length}</span></div></div>`;
    Object.entries(grouped).forEach(([stage, items]) => {
        html += `<div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded"><h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${items.length})</h4></div>`;
        items.forEach((rev, idx) => {
            html += `<div class="mb-3 ml-4"><div class="flex items-start justify-between"><div class="flex-1"><label class="text-sm font-medium text-gray-700">Revision ${idx + 1}:</label><div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${rev.remarks || ''}</div><div class="text-xs text-gray-500 mt-1">Date: ${formatDateToDDMMYYYY(rev.createdAt)} | By: ${rev.revisedByName || ''}</div></div></div></div>`;
        });
    });
    section.innerHTML = html;
}

// Function to filter and display user dropdown
function filterUsers(fieldId) {
    console.log('filterUsers called with fieldId:', fieldId);
    
    const searchInput = document.getElementById(`${fieldId.replace('Select', '')}Search`);
    if (!searchInput) {
        console.log('Search input not found for fieldId:', fieldId);
        return;
    }
    
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    if (!dropdown) {
        console.log('Dropdown not found for fieldId:', fieldId);
        return;
    }
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    let filteredUsers = [];
    
    // Handle payToSelect dropdown separately
    if (fieldId === 'payToSelect') {
        console.log('Processing payToSelect...');
        console.log('businessPartners length:', businessPartners ? businessPartners.length : 'undefined');
        console.log('searchText:', searchText);
        
        try {
            const filtered = businessPartners.filter(bp => 
                (bp.name && bp.name.toLowerCase().includes(searchText)) || 
                (bp.code && bp.code.toLowerCase().includes(searchText))
            );
            
            console.log('Filtered business partners:', filtered.length);
            
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
            filteredUsers = users.filter(user => user.name && user.name.toLowerCase().includes(searchText));
            
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
                                bp.name && user.name && bp.name.toLowerCase() === user.name.toLowerCase()
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
        console.log('Fetching business partners...');
        console.log('BASE_URL:', BASE_URL);
        
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
        console.log('Sample business partner:', businessPartners[0]);
        
    } catch (error) {
        console.error("Error fetching business partners:", error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    console.log('BASE_URL available:', typeof BASE_URL !== 'undefined');
    
    // Call function to control button visibility
    controlButtonVisibility();
    
    // Load users, departments, business partners, and transaction types first
    Promise.all([fetchUsers(), fetchDepartments(), fetchBusinessPartners(), fetchTransactionTypes()]).then(() => {
        console.log('All initial data loaded');
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
    
    console.log('Setting up event listeners for search fields:', searchFields);
    
    searchFields.forEach(fieldId => {
        const searchInput = document.getElementById(fieldId);
        console.log(`Setting up event listener for ${fieldId}:`, searchInput ? 'found' : 'not found');
        
        if (searchInput) {
            searchInput.addEventListener('focus', function() {
                console.log(`Focus event for ${fieldId}`);
                const actualFieldId = fieldId.replace('Search', 'Select');
                filterUsers(actualFieldId);
            });
            
            // Add input event for real-time filtering
            searchInput.addEventListener('input', function() {
                console.log(`Input event for ${fieldId}, value:`, this.value);
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
    
    // Setup event listeners for existing table rows
    const existingRows = document.querySelectorAll('#reimbursementDetails tr');
    existingRows.forEach(row => {
        setupRowEventListeners(row);
        populateCategoriesForNewRow(row);
    });
    
    // Initialize total amount calculation
    updateTotalAmount();
    
    // Convert any existing amount inputs to use currency formatting
    const existingAmountInputs = document.querySelectorAll('#reimbursementDetails tr td:nth-child(5) input');
    existingAmountInputs.forEach(input => {
        input.classList.add('currency-input-idr');
        input.addEventListener('input', function() {
            formatCurrencyInputIDR(this);
        });
        
        // Format initial values
        if (input.value) {
            formatCurrencyInputIDR(input);
        }
    });
});

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
            category && category.toLowerCase().includes(searchText)
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
            account.accountName && account.accountName.toLowerCase().includes(searchText)
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

