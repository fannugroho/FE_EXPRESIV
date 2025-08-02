let uploadedFiles = [];

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
    const transactionTypeSelect = document.getElementById("TransactionType");
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
    const transactionTypeSelect = document.getElementById("TransactionType");
    const helperText = document.getElementById('transaction-type-helper');
    
    if (transactionTypeSelect) {
        transactionTypeSelect.style.border = '';
        transactionTypeSelect.style.backgroundColor = '';
    }
    
    if (helperText) {
        helperText.remove();
    }
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
    
    // Format the sum with 2 decimal places (no thousands separator to avoid confusion)
    const formattedSum = sum.toFixed(2);
    
    // Update the total amount display
    const totalAmountDisplay = document.getElementById('totalAmountDisplay');
    if (totalAmountDisplay) {
        totalAmountDisplay.textContent = formattedSum;
    }
}

// Function to update field states based on prerequisites
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
    const transactionTypeSelect = document.getElementById("TransactionType");
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
        
        if (filteredCategories.length > 0) {
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
        
        if (availableCategories.length > 0) {
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

// Function to enable account name field
function enableAccountNameField(row) {
    const accountNameSelect = row.querySelector('.account-name');
    if (accountNameSelect) {
        accountNameSelect.disabled = false;
        accountNameSelect.classList.remove('bg-gray-100');
    }
}

// Function to update account name dropdown based on selected category
async function updateAccountNameDropdown(row, category, departmentId, transactionType) {
    const accountNameSelect = row.querySelector('.account-name');
    const coaInput = row.querySelector('.coa');
    
    if (!accountNameSelect) return;
    
    // Validate prerequisites
    if (!category) {
        showValidationMessage(accountNameSelect, 'Please select a category first');
        return;
    }
    
    // Clear existing options
    accountNameSelect.innerHTML = '<option value="">Select Account Name</option>';
    
    // Get available account names for the selected category
    const accountNames = await getAvailableAccountNames(category, departmentId, transactionType);
    
    accountNames.forEach(item => {
        const option = document.createElement('option');
        option.value = item.accountName;
        option.textContent = item.accountName;
        option.dataset.coa = item.coa;
        option.dataset.remarks = item.remarks || '';
        accountNameSelect.appendChild(option);
    });
    
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
        
        // Clear existing values
        if (categoryInput) categoryInput.value = '';
        if (accountNameSelect) accountNameSelect.innerHTML = '<option value="">Select Account Name</option>';
        if (coaInput) coaInput.value = '';
        
        // Update field states based on prerequisites
        updateFieldsBasedOnPrerequisites(row);
        
        // Re-setup dropdown
        await setupCategoryDropdown(row);
    }
}

async function saveDocument(isSubmit = false) {
    // Show confirmation dialog only for submit
    if (isSubmit) {
        const result = await Swal.fire({
            title: 'Confirmation',
            text: 'Are you sure you want to submit this document?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) {
            return;
        }
    }

    try {
        // Validate required fields before submission
        const validationResult = validateFormFields(isSubmit);
        if (!validationResult.isValid) {
            await Swal.fire({
                title: 'Validation Error',
                text: validationResult.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        // Get user ID from JWT token using auth.js function
        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }

        // Create FormData object
        const formData = new FormData();
        
        // Add all form fields to FormData
        formData.append('CashAdvanceNo', document.getElementById("CashAdvanceNo").value);
        formData.append('EmployeeNIK', document.getElementById("EmployeeNIK").value);
        // Requester must be explicitly selected
        const requesterId = document.getElementById("RequesterId").value;
        if (!requesterId) {
            Swal.fire({
                title: 'Error!',
                text: 'Please select a requester before submitting the Cash Advance.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        formData.append('RequesterId', requesterId);
        formData.append('Purpose', document.getElementById("Purpose").value);
        formData.append('DepartmentId', document.getElementById("department").value);
        formData.append('SubmissionDate', document.getElementById("SubmissionDate").value);
        formData.append('TransactionType', document.getElementById("TransactionType").value);
        formData.append('Remarks', document.getElementById("Remarks").value);
        
        // Approval fields
        formData.append('PreparedById', document.getElementById("Approval.PreparedById").value);
        formData.append('CheckedById', document.getElementById("Approval.CheckedById").value);
        formData.append('ApprovedById', document.getElementById("Approval.ApprovedById").value);
        formData.append('AcknowledgedById', document.getElementById("Approval.AcknowledgedById").value);
        formData.append('ReceivedById', document.getElementById("Approval.ReceivedById").value);
        formData.append('ClosedById', document.getElementById("Approval.ClosedById").value);

        
        // Add file attachments
        const fileInput = document.getElementById("Attachments");
        if (uploadedFiles.length > 0) {
            for (let i = 0; i < uploadedFiles.length; i++) {
                formData.append('Attachments', uploadedFiles[i]);
            }
        }
        
        // Add CashAdvanceDetails - collect all rows from the table with new fields and validation
        const tableRows = document.querySelectorAll('#tableBody tr');
        let detailIndex = 0;
        tableRows.forEach((row) => {
            const category = row.querySelector('.category-input').value;
            const accountName = row.querySelector('.account-name').value;
            const coa = row.querySelector('.coa').value;
            const description = row.querySelector('.description').value;
            const amount = row.querySelector('.total').value;
            
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
            formData.append('PayToCode', paidToId);
        }

        // Set submit flag
        formData.append('IsSubmit', isSubmit.toString());
        
        // API endpoint
        const endpoint = `${BASE_URL}/api/cash-advance`;
        
        // Send the request
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        if (response.status === 201) {
            // Success - Show appropriate message
            if (isSubmit) {
                await Swal.fire({
                    title: 'Berhasil',
                    text: 'Cash advance request berhasil di-submit',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            } else {
                await Swal.fire({
                    title: 'Success!',
                    text: 'Cash advance request has been saved as draft',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            }
            
            // Redirect back to menu page
            window.location.href = "../pages/MenuCash.html";
        } else {
            // Error handling
            let errorMessage = `Failed to ${isSubmit ? 'submit' : 'save'}: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.message || errorData.Message) {
                    errorMessage = errorData.message || errorData.Message;
                }
            } catch (parseError) {
                console.log("Could not parse error response:", parseError);
            }

            await Swal.fire({
                title: 'Error!',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        // Network or other error
        console.error("Error processing cash advance:", error);
        await Swal.fire({
            title: 'Error!',
            text: `An error occurred: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to validate form fields
function validateFormFields(isSubmit) {
    // Check requester selection
    const requesterSearch = document.getElementById("requesterSearch").value;
    if (!requesterSearch) {
        emphasizeRequesterSelection(); // Tampilkan helper text saat validasi
        return {
            isValid: false,
            message: 'Please select a requester first.'
        };
    } else {
        removeRequesterEmphasis(); // Hapus helper text jika sudah terisi
    }

    // Check transaction type
    const transactionType = document.getElementById("TransactionType").value;
    if (!transactionType) {
        emphasizeTransactionTypeSelection(); // Tampilkan helper text saat validasi
        return {
            isValid: false,
            message: 'Please select a transaction type.'
        };
    } else {
        removeTransactionTypeEmphasis(); // Hapus helper text jika sudah terisi
    }

    // Check department (via requester)
    const department = document.getElementById("department").value;
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

// Helper function to validate a single row (returns {isValid, message})
function validateRow(row, rowIndex) {
    const category = row.querySelector('.category-input')?.value.trim();
    const accountName = row.querySelector('.account-name')?.value.trim();
    const coa = row.querySelector('.coa')?.value.trim();
    const amount = row.querySelector('.total')?.value.trim();
    // Details/description is optional

    let missing = [];
    if (!category) missing.push('Category');
    if (!accountName) missing.push('Account Name');
    if (!coa) missing.push('COA');
    if (!amount) missing.push('Amount');

    if (missing.length > 0) {
        return {
            isValid: false,
            message: `Row ${rowIndex + 1}: Please fill in ${missing.join(', ')}.`
        };
    }
    return { isValid: true };
}

// Validate all rows before submit or addRow
function validateAllRows() {
    const tableRows = document.querySelectorAll('#tableBody tr');
    for (let i = 0; i < tableRows.length; i++) {
        const row = tableRows[i];
        // Only validate rows that have any input (ignore completely empty rows)
        const hasAnyInput = Array.from(row.querySelectorAll('input, select')).some(input => input.value.trim() !== '');
        if (hasAnyInput) {
            const result = validateRow(row, i);
            if (!result.isValid) return result;
        }
    }
    return { isValid: true };
}

// Patch addRow to validate before adding
if (typeof window._addRowPatched === 'undefined') {
    window._addRowPatched = true;
    const originalAddRow = addRow;
    addRow = async function() {
      const validation = validateAllRows();
      if (!validation.isValid) {
        await Swal.fire({
          title: 'Validation Error',
          text: validation.message,
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }
      await originalAddRow();
    };
  }

// Helper function to validate header fields (returns {isValid, message})
function validateHeaderFields() {
    // List of required header field IDs and their labels
    const requiredFields = [
        { id: 'requesterSearch', label: 'Requester' },
        { id: 'RequesterId', label: 'Requester (hidden)' }, // hidden select, must have value
        { id: 'department', label: 'Department' },
        { id: 'TransactionType', label: 'Transaction Type' },
        { id: 'Purpose', label: 'Purpose' },
        { id: 'SubmissionDate', label: 'Submission Date' },
        { id: 'EmployeeNIK', label: 'Employee NIK' },
        { id: 'EmployeeName', label: 'Employee Name' }
    ];
    let missing = [];
    for (const field of requiredFields) {
        const el = document.getElementById(field.id);
        if (!el || !el.value || el.value.trim() === '') {
            missing.push(field.label);
        }
    }
    if (missing.length > 0) {
        return {
            isValid: false,
            message: `Please fill in the following header fields: ${missing.join(', ')}`
        };
    }
    return { isValid: true };
}

// Patch saveDocument to validate header fields and rows before submit
const originalSaveDocument = saveDocument;
saveDocument = async function(isSubmit = false) {
    // Validate header fields first
    const headerValidation = validateHeaderFields();
    if (!headerValidation.isValid) {
        await Swal.fire({
            title: 'Validation Error',
            text: headerValidation.message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }
    // Then validate rows
    const validation = validateAllRows();
    if (!validation.isValid) {
        await Swal.fire({
            title: 'Validation Error',
            text: validation.message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }
    await originalSaveDocument(isSubmit);
};

// Function to submit document (calls saveDocument with isSubmit=true)
async function submitDocument() {
    await saveDocument(true);
}

function goToMenuCash() {
    window.location.href = "../pages/MenuCash.html";
}


function previewPDF(event) {
const files = event.target.files;
if (files.length + uploadedFiles.length > 5) {
alert('Maximum 5 PDF files are allowed.');
event.target.value = ''; // Reset file input
return;
}

for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type === 'application/pdf') {
        uploadedFiles.push(file);
    } else {
        alert(`File "${file.name}" is not a valid PDF file`);
    }
}

displayFileList();
}

// Function to display the list of uploaded files
function displayFileList() {
    const fileListContainer = document.getElementById('fileList');
    if (!fileListContainer) return;
    
    fileListContainer.innerHTML = '';
    
    if (uploadedFiles.length === 0) {
        fileListContainer.innerHTML = '<p class="text-gray-500 text-sm p-2">No files uploaded</p>';
        return;
    }
    
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'flex items-center justify-between p-2 border-b';
        
        const fileName = document.createElement('div');
        fileName.className = 'text-sm truncate flex-grow';
        fileName.textContent = file.name;
        
        const actionButtons = document.createElement('div');
        actionButtons.className = 'flex space-x-2';
        
        const viewButton = document.createElement('button');
        viewButton.className = 'text-blue-600 hover:text-blue-800 text-sm';
        viewButton.textContent = 'View';
        viewButton.onclick = () => viewFile(index);
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'text-red-600 hover:text-red-800 text-sm';
        deleteButton.textContent = 'X';
        deleteButton.onclick = () => deleteFile(index);
        
        actionButtons.appendChild(viewButton);
        actionButtons.appendChild(deleteButton);
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(actionButtons);
        
        fileListContainer.appendChild(fileItem);
    });
}

// Function to view a file
function viewFile(index) {
    const file = uploadedFiles[index];
    if (!file) return;
    
    // Create object URL for the file
    const fileURL = URL.createObjectURL(file);
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.id = 'pdfViewerModal';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-xl w-4/5 h-4/5 flex flex-col';
    
    // Create header with close button
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-4 border-b';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold';
    title.textContent = file.name;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-500 hover:text-gray-700';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        document.body.removeChild(modal);
        URL.revokeObjectURL(fileURL);
    };
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Create iframe to display PDF
    const iframe = document.createElement('iframe');
    iframe.className = 'w-full flex-grow';
    iframe.src = fileURL;
    
    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(iframe);
    modal.appendChild(modalContent);
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
            URL.revokeObjectURL(fileURL);
        }
    });
}

// Function to delete a file
function deleteFile(index) {
    if (index >= 0 && index < uploadedFiles.length) {
        uploadedFiles.splice(index, 1);
        displayFileList();
    }
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
            <input type="number" class="total w-full" maxlength="10" required step="0.01" oninput="calculateTotalAmount()"/>
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
    calculateTotalAmount(); // Recalculate total after removing a row
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
    const departmentSelect = document.getElementById("department");
    departmentSelect.innerHTML = '<option value="" disabled selected>Select Department</option>';

    if (departmentSelect) {
        departments.forEach(department => {
            const option = document.createElement('option');
            option.value = department.id;
            option.textContent = department.name;
            departmentSelect.appendChild(option);
        });
    }
}

function fetchUsers() {
    fetch(`${BASE_URL}/api/users`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("User data:", data);
            populateUserSelects(data.data);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
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
        code: bp.code,
        name: bp.name
    }));

    // Setup search functionality for paid to
    const paidToSearchInput = document.getElementById('paidToSearch');
    const paidToDropdown = document.getElementById('paidToDropdown');
    const paidToHiddenInput = document.getElementById('paidTo');
    
    // Function to populate dropdown with filtered business partners
    function populateBusinessPartnerDropdown(filter = '') {
        if (!paidToDropdown) return;
        
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
                if (paidToSearchInput) {
                    paidToSearchInput.value = `${partner.code} - ${partner.name}`;
                }
                if (paidToHiddenInput) {
                    paidToHiddenInput.value = partner.code;
                }
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

    // Function to filter business partners - always define globally
    window.filterBusinessPartners = function() {
        if (paidToSearchInput && paidToDropdown) {
            const searchText = paidToSearchInput.value.toLowerCase();
            populateBusinessPartnerDropdown(searchText);
            paidToDropdown.classList.remove('hidden');
        }
    };
    
    if (paidToSearchInput && paidToDropdown && paidToHiddenInput) {

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

// // Data pengguna contoh (mockup)
const mockUsers = [
    { id: 1, name: "Ahmad Baihaki", department: "Finance" },
    { id: 2, name: "Budi Santoso", department: "Purchasing" },
    { id: 3, name: "Cahya Wijaya", department: "IT" },
    { id: 4, name: "Dewi Sartika", department: "HR" },
    { id: 5, name: "Eko Purnomo", department: "Logistics" },
    { id: 6, name: "Fajar Nugraha", department: "Production" },
    { id: 7, name: "Gita Nirmala", department: "Finance" },
    { id: 8, name: "Hadi Gunawan", department: "Marketing" },
    { id: 9, name: "Indah Permata", department: "Sales" },
    { id: 10, name: "Joko Widodo", department: "Management" }
];

// Fungsi untuk memfilter dan menampilkan dropdown pengguna
function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    if (!searchInput) {
        console.error(`Search input not found for fieldId: ${fieldId}`);
        return;
    }
    
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    if (!dropdown) {
        console.error(`Dropdown not found for fieldId: ${fieldId}`);
        return;
    }
    
    console.log(`filterUsers called for fieldId: ${fieldId}, searchText: "${searchText}"`);
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    let filteredUsers = [];
    
    // Handle approval fields - use superior data from dataset
    if (fieldId === 'Approval.PreparedById' || 
        fieldId === 'Approval.CheckedById' || 
        fieldId === 'Approval.AcknowledgedById' || 
        fieldId === 'Approval.ApprovedById' ||
        fieldId === 'Approval.ReceivedById' ||
        fieldId === 'Approval.ClosedById') {
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
                            selectElement.appendChild(option);
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
    } else {
        // Handle other fields (requester, etc.) - use window.requesters
        filteredUsers = window.requesters ? 
            window.requesters.filter(user => (user.fullName || '').toLowerCase().includes(searchText)) : 
            mockUsers.filter(user => (user.name || '').toLowerCase().includes(searchText));
        
        // Show search results
        filteredUsers.forEach(user => {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            option.innerText = user.name || user.fullName;
            option.onclick = function() {
                searchInput.value = user.name || user.fullName;
                document.getElementById(fieldId).value = user.id;
                dropdown.classList.add('hidden');
            };
            dropdown.appendChild(option);
        });
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

// Modifikasi di fungsi populateUserSelects untuk setup searchbar approval
function populateUserSelects(users) {
    // Store users globally for search functionality
    window.requesters = users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        department: user.department
    }));
    
    // Store employees globally for employee search functionality
    window.employees = users.map(user => ({
        id: user.id,
        kansaiEmployeeId: user.kansaiEmployeeId,
        fullName: user.fullName,
        department: user.department
    }));

    // Populate RequesterId dropdown with search functionality
    const requesterSelect = document.getElementById("RequesterId");
    if (requesterSelect) {
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
    
    // Function to populate dropdown with filtered requesters
    function populateRequesterDropdown(filter = '') {
        if (!requesterDropdown) return;
        
        requesterDropdown.innerHTML = '';
        const filteredRequesters = window.requesters.filter(r => r.fullName && r.fullName.toLowerCase().includes(filter));
        
        filteredRequesters.forEach(requester => {
            const option = document.createElement('div');
            option.className = 'p-2 cursor-pointer hover:bg-gray-100';
            option.innerText = requester.fullName;
            option.onclick = function() {
                if (requesterSearchInput) {
                    requesterSearchInput.value = requester.fullName;
                }
                const requesterIdElement = document.getElementById('RequesterId');
                if (requesterIdElement) {
                    requesterIdElement.value = requester.id;
                }
                requesterDropdown.classList.add('hidden');
                
                // Remove requester emphasis when selected
                removeRequesterEmphasis();
                
                //update department
                const departmentSelect = document.getElementById('department');
                if (requester.department) {
                    console.log(requester.department)
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

    // Function to filter requesters - always define globally
    window.filterRequesters = function() {
        if (requesterSearchInput && requesterDropdown) {
            const searchText = requesterSearchInput.value.toLowerCase();
            populateRequesterDropdown(searchText);
            requesterDropdown.classList.remove('hidden');
        }
    };
    
    if (requesterSearchInput && requesterDropdown) {

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!requesterSearchInput.contains(event.target) && !requesterDropdown.contains(event.target)) {
                requesterDropdown.classList.add('hidden');
            }
        });

        // Initial population
        populateRequesterDropdown();
    }

    // Auto-populate employee fields with logged-in user data (same as addSettle)
    const loggedInUserId = getUserId();
    console.log("Logged in user ID:", loggedInUserId);
    console.log("Available employees:", window.employees);
    
    if(loggedInUserId && window.employees) {
        const loggedInEmployee = window.employees.find(emp => emp.id === loggedInUserId);
        console.log("Found logged in employee:", loggedInEmployee);
        
        if(loggedInEmployee) {
            const employeeNIK = loggedInEmployee.kansaiEmployeeId || '';
            const employeeName = loggedInEmployee.fullName || '';
            
            document.getElementById("EmployeeNIK").value = employeeNIK;
            document.getElementById("EmployeeName").value = employeeName;
            
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

    // Auto-fill preparedBy with logged-in user (like addPR.js and addReim.js)
    autoFillPreparedBy(users);
    
    // Note: Other approval dropdowns (Checked, Acknowledged, Approved, Received, Closed) 
    // are populated using superior API in populateAllSuperiorEmployeeDropdowns
    // This is handled separately to ensure proper superior hierarchy
}

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

function populateTransactionTypeSelect(transactionTypes) {
    const transactionTypeSelect = document.getElementById("TransactionType");
    if (transactionTypeSelect) {
        // Clear existing options and add the default selection option
        transactionTypeSelect.innerHTML = '<option value="" disabled selected>Select Type Of Transaction</option>';
        
        transactionTypes.forEach(transactionType => {
            const option = document.createElement('option');
            option.value = transactionType.name;
            option.textContent = transactionType.name;
            transactionTypeSelect.appendChild(option);
        });

        // Add event listener for TransactionType change
        transactionTypeSelect.addEventListener('change', async function() {
            const closedBySection = document.getElementById('closedBySection');
            const closedByLabel = document.getElementById('Approval.ClosedByIdLabel');
            
            if (this.value === 'Personal Loan') {
                closedBySection.style.display = 'block';
                closedByLabel.style.display = 'block';
            } else {
                closedBySection.style.display = 'none';
                closedByLabel.style.display = 'none';
            }
            
            // Remove emphasis when transaction type is selected
            if (this.value) {
                removeTransactionTypeEmphasis();
            }
            
            // Refresh all category dropdowns when transaction type changes
            refreshAllCategoryDropdowns();
            
            // Refresh approval dropdowns with new transaction type
            await populateAllSuperiorEmployeeDropdowns(this.value);
        });

        // Hide closed by section by default
        const closedBySection = document.getElementById('closedBySection');
        const closedByLabel = document.getElementById('Approval.ClosedByIdLabel');
        closedBySection.style.display = 'none';
        closedByLabel.style.display = 'none';
        
        // Helper text akan ditampilkan hanya saat validasi, bukan saat inisialisasi
    }
}

// Helper function to auto-fill preparedBy with logged-in user (like addPR.js and addReim.js)
function autoFillPreparedBy(users) {
    const currentUserId = getUserId();
    if (!currentUserId) return;
    
    // Find the current user in the users array
    const currentUser = users.find(user => user.id == currentUserId);
    if (!currentUser) return;
    
    // Construct full name
    let displayName = currentUser.fullName;
    
    // Set the preparedBy search input value and disable it
    const preparedBySearch = document.getElementById("Approval.PreparedByIdSearch");
    if (preparedBySearch) {
        preparedBySearch.value = displayName;
        preparedBySearch.disabled = true;
        preparedBySearch.classList.add('bg-gray-200', 'cursor-not-allowed');
    }
    
    // Also set the select element value to ensure it's available for form submission
    const preparedBySelect = document.getElementById("Approval.PreparedById");
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

// Note: Other approval dropdowns are now handled by superior API functions
// These legacy functions are kept for reference but not used

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
        'Approval.ReceivedById': 'RE',
        'Approval.ClosedById': 'RE' // Use same level as ReceivedById
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
    
    // Update the search input dataset (don't auto-fill, let user pick)
    const searchInput = document.getElementById(fieldId + 'Search');
    if (searchInput) {
        searchInput.dataset.users = JSON.stringify(superiors.map(s => ({
            id: s.superiorUserId,
            name: s.superiorFullName
        })));
    }
    
    // Note: Prepared By is handled by autoFillPreparedBy function, not here
    
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
    
    // Update the search input dataset (don't auto-fill, let user pick)
    const searchInput = document.getElementById(fieldId + 'Search');
    if (searchInput) {
        searchInput.dataset.users = JSON.stringify(superiors.map(s => ({
            id: s.superiorUserId,
            name: s.superiorFullName
        })));
    }
    
    // Note: Prepared By is handled by autoFillPreparedBy function, not here
    
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
    
    console.log(`populateAllSuperiorEmployeeDropdowns called with transactionType: "${transactionType}", documentType: ${documentType}`);
    console.log(`Transaction type type: ${typeof transactionType}`);
    
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
        
        // Filter by transaction type - map Cash Advance transaction types to API transaction types
        const transactionTypeMap = {
            'NRM': 'NRM',
            'Entertainment': 'EN',
            'Golf Competition': 'GC',
            'Medical': 'ME',
            'Others': 'OT',
            'Travelling': 'TR',
            'Personal Loan': 'LO'
        };
        
        const apiTransactionType = transactionTypeMap[transactionType] || 'NRM';
        console.log(`Transaction type mapping: "${transactionType}" -> "${apiTransactionType}"`);
        console.log(`Available transaction types in API response:`, [...new Set(allSuperiors.map(s => s.typeTransaction))]);
        
        const filteredSuperiors = allSuperiors.filter(superior => superior.typeTransaction === apiTransactionType);
        console.log(`Found ${filteredSuperiors.length} superiors with ${apiTransactionType} transaction type`);
        console.log('Filtered superiors:', filteredSuperiors);
        
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
        // Note: Prepared By is handled by autoFillPreparedBy function, not superior API
        const approvalFields = [
            { id: 'Approval.CheckedById', level: 'CH' },
            { id: 'Approval.AcknowledgedById', level: 'AC' },
            { id: 'Approval.ApprovedById', level: 'AP' },
            { id: 'Approval.ReceivedById', level: 'RE' },
            { id: 'Approval.ClosedById', level: 'RE' } // Use same level as ReceivedById
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

// --- Initialization for Approval Dropdowns ---
document.addEventListener('DOMContentLoaded', async function() {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("SubmissionDate").value = today;
    
    fetchDepartments();
    fetchUsers();
    fetchTransactionType();
    fetchBusinessPartners();
    
    // Initialize total amount calculation
    calculateTotalAmount();
    
    // Setup initial row after a small delay to ensure DOM is ready
    setTimeout(async () => {
        const firstRow = document.querySelector('#tableBody tr');
        if (firstRow) {
            await setupCategoryDropdown(firstRow);
        }
        
        // Helper text tidak ditampilkan saat halaman pertama kali dimuat
        // Akan ditampilkan hanya saat validasi
    }, 500);
    
    // Add event listener for department change
    const departmentSelect = document.getElementById("department");
    if (departmentSelect) {
        departmentSelect.addEventListener('change', function() {
            refreshAllCategoryDropdowns();
        });
    }
    
    // Approval dropdowns initialization - only populate when transaction type is selected
    // Don't populate on initial load since no transaction type is selected yet
    console.log('Initial transaction type:', document.getElementById("TransactionType")?.value);

    // When fetchUsers completes, populate all dropdowns
    fetchUsers = async function() {
        try {
            const response = await fetch(`${BASE_URL}/api/users`);
            if (!response.ok) throw new Error('Network response was not ok: ' + response.statusText);
            const data = await response.json();
            const users = data.data;
            // Populate user selects for requester, etc (but not approval dropdowns)
            populateUserSelects(users);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };
    // Call fetchUsers (now patched) to trigger all population
    fetchUsers();
    
    // Add event listeners for approval search inputs to show dropdowns on focus
    const approvalSearchInputs = [
        'Approval.PreparedByIdSearch', 
        'Approval.CheckedByIdSearch', 
        'Approval.AcknowledgedByIdSearch', 
        'Approval.ApprovedByIdSearch', 
        'Approval.ReceivedByIdSearch',
        'Approval.ClosedByIdSearch'
    ];
    
    approvalSearchInputs.forEach(inputId => {
        const searchInput = document.getElementById(inputId);
        if (searchInput) {
            // Show dropdown on focus
            searchInput.addEventListener('focus', function() {
                console.log(`Approval search input focused: ${inputId}`);
                const fieldId = inputId.replace('Search', '');
                filterUsers(fieldId);
            });
        }
    });
    

    
    // Add event listener untuk menyembunyikan dropdown saat klik di luar
    document.addEventListener('click', function(event) {
        // Handle approval dropdowns
        const approvalDropdowns = [
            'Approval.PreparedByIdDropdown',
            'Approval.CheckedByIdDropdown',
            'Approval.AcknowledgedByIdDropdown',
            'Approval.ApprovedByIdDropdown',
            'Approval.ReceivedByIdDropdown',
            'Approval.ClosedByIdDropdown'
        ];
        
        approvalDropdowns.forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                const inputId = dropdownId.replace('Dropdown', 'Search');
                const input = document.getElementById(inputId);
                if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
                    dropdown.classList.add('hidden');
                }
            }
        });
    });
});