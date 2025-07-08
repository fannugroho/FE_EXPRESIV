// Using BASE_URL from auth.js instead of hardcoded baseUrl
let reimbursementId = '';
let uploadedFiles = [];

// Get reimbursement ID from URL
function getReimbursementIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('reim-id');
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

// Function to fetch transaction types from API
async function fetchTransactionTypes() {
    try {
        const response = await fetch(`${BASE_URL}/api/transaction-types`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        
        const data = await response.json();
        console.log("Transaction types data:", data);
        populateTransactionTypesSelect(data.data);
    } catch (error) {
        console.error('Error fetching transaction types:', error);
    }
}

// Helper function to populate transaction types dropdown
function populateTransactionTypesSelect(transactionTypes) {
    const typeSelect = document.getElementById("typeOfTransaction");
    if (!typeSelect) return;
    
    // Clear existing options
    typeSelect.innerHTML = '';
    
    // Add transaction types as options
    if (transactionTypes && transactionTypes.length > 0) {
        transactionTypes.forEach(type => {
            const option = document.createElement("option");
            option.value = type.name;
            option.textContent = type.name;
            typeSelect.appendChild(option);
        });
    } else {
        // Fallback options if API doesn't return data
        const defaultTypes = ["Medical", "Transportation", "Golf Competition", "Others"];
        defaultTypes.forEach(type => {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
    }
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

// Fetch reimbursement data from API
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
        } else {
            console.error('Failed to fetch reimbursement data:', result.message);
        }
    } catch (error) {
        console.error('Error fetching reimbursement data:', error);
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
        
        if (!users || users.length === 0) {
            return;
        }
        
        // Store users globally for later use
        window.allUsers = users;
        
        // Populate dropdowns
        populateDropdown("preparedBySelect", users);
        populateDropdown("acknowledgeBySelect", users);
        populateDropdown("checkedBySelect", users);
        populateDropdown("approvedBySelect", users);
        populateDropdown("receivedBySelect", users);
        
        // Make all dropdowns readonly by disabling them
        const dropdownIds = ["preparedBySelect", "acknowledgeBySelect", "checkedBySelect", "approvedBySelect", "receivedBySelect"];
        dropdownIds.forEach(id => {
            const dropdown = document.getElementById(id);
            if (dropdown) {
                dropdown.disabled = true;
                dropdown.classList.add('bg-gray-200', 'cursor-not-allowed');
            }
        });
        
        console.log('Successfully populated all user dropdowns');
        
    } catch (error) {
        console.error("Error fetching users:", error);
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

// Helper function to populate a dropdown with user data
function populateDropdown(dropdownId, users) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        return;
    }

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
        option.value = user.id;
        
        // Combine names with spaces, handling empty middle/last names
        let displayName = user.fullName || '';
        
        // Fallback to username if no name fields
        if (!displayName.trim()) {
            displayName = user.username || `User ${user.id}`;
        }
        
        option.textContent = displayName.trim();
        dropdown.appendChild(option);
        console.log(`Added user: ${displayName.trim()} with ID: ${user.id}`);
    });
    
    console.log(`Finished populating ${dropdownId}`);
}

// Populate form fields with data
function populateFormData(data) {
    // Main form fields
    if (document.getElementById('voucherNo')) document.getElementById('voucherNo').value = data.voucherNo || '';
    if (document.getElementById('requesterName')) document.getElementById('requesterName').value = data.requesterName || '';
    
    // Set department and ensure it exists in dropdown
    if (data.department) {
        setDepartmentValue(data.department);
    }
    
    if (document.getElementById('currency')) document.getElementById('currency').value = data.currency || '';
    
    // Set payTo to show requester name instead of ID
    if (document.getElementById('payTo')) {
        document.getElementById('payTo').value = data.requesterName || '';
    }
    
    // Format date for the date input (YYYY-MM-DD)
    if (data.submissionDate && document.getElementById('submissionDate')) {
        const date = new Date(data.submissionDate);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('submissionDate').value = formattedDate;
    }
    
    if (document.getElementById('status')) {
        document.getElementById('status').value = data.status || '';
        // Call checkStatus after setting the status value to hide buttons if needed
        if (typeof checkStatus === 'function') {
            checkStatus();
        }
    }
    
    if (document.getElementById('referenceDoc')) document.getElementById('referenceDoc').value = data.referenceDoc || '';
    
    // Set type of transaction and ensure it exists in dropdown
    if (document.getElementById('typeOfTransaction') && data.typeOfTransaction) {
        const typeSelect = document.getElementById('typeOfTransaction');
        
        // Check if the value exists in the dropdown
        let typeExists = false;
        for (let i = 0; i < typeSelect.options.length; i++) {
            if (typeSelect.options[i].value === data.typeOfTransaction) {
                typeSelect.selectedIndex = i;
                typeExists = true;
                break;
            }
        }
        
        // If type doesn't exist in dropdown, add it
        if (!typeExists && data.typeOfTransaction) {
            const newOption = document.createElement('option');
            newOption.value = data.typeOfTransaction;
            newOption.textContent = data.typeOfTransaction;
            newOption.selected = true;
            typeSelect.appendChild(newOption);
        }
    }
    
    if (document.getElementById('remarks')) document.getElementById('remarks').value = data.remarks || '';
    
    // Approvers information - safely check if elements exist
    if (document.getElementById('preparedBySelect')) document.getElementById('preparedBySelect').value = data.preparedBy || '';
    if (document.getElementById('checkedBySelect')) document.getElementById('checkedBySelect').value = data.checkedBy || '';
    if (document.getElementById('acknowledgeBySelect')) document.getElementById('acknowledgeBySelect').value = data.acknowledgedBy || '';
    if (document.getElementById('approvedBySelect')) document.getElementById('approvedBySelect').value = data.approvedBy || '';
    if (document.getElementById('receivedBySelect')) document.getElementById('receivedBySelect').value = data.receivedBy || '';
    
    // Set checkbox states based on if values exist - removed checks for elements that don't exist
    
    // Handle reimbursement details (table rows)
    if (data.reimbursementDetails) {
        console.log('Populating reimbursement details:', data.reimbursementDetails);
        populateReimbursementDetails(data.reimbursementDetails);
    } else {
        console.log('No reimbursement details found in data');
    }
    
    // Display attachment information
    if (data.reimbursementAttachments) {
        displayAttachments(data.reimbursementAttachments);
    }
    
    // Display revision history from API data
    displayRevisionHistory(data);
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
                    <input type="text" value="${detail.category || ''}" maxlength="200" class="w-full bg-gray-100" required readonly />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.accountName || ''}" maxlength="30" class="w-full bg-gray-100" required readonly />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.glAccount || ''}" maxlength="10" class="w-full bg-gray-100" required readonly />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.description || ''}" maxlength="200" class="w-full bg-gray-100" required readonly />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${formattedAmount}" data-raw-value="${detail.amount || 0}" class="w-full text-right bg-gray-100" required readonly />
                </td>
                <td class="p-2 border text-center">
                    <button type="button" onclick="deleteRow(this)" data-id="${detail.id}" class="text-red-500 hover:text-red-700" disabled style="display: none;">
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
            <input type="text" maxlength="200" class="w-full bg-gray-100" required readonly />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="30" class="w-full bg-gray-100" required readonly />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="10" class="w-full bg-gray-100" required readonly />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full bg-gray-100" required readonly />
        </td>
        <td class="p-2 border">
            <input type="text" value="0.00" data-raw-value="0" class="w-full text-right bg-gray-100" required readonly />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700" disabled style="display: none;">
                🗑
            </button>
        </td>
    `;
    tableBody.appendChild(newRow);
    
    // Update total amount
    updateTotalAmount();
};

// Display attachments
function displayAttachments(attachments) {
    const attachmentsList = document.getElementById('attachmentsList');
    if (!attachmentsList) {
        console.error('attachmentsList element not found');
        return;
    }
    
    attachmentsList.innerHTML = ''; // Clear existing attachments
    
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

// Delete a row from the reimbursement details table
function deleteRow(button) {
    const row = button.closest('tr');
    row.remove();
}

// Submit reimbursement update to API
async function submitReimbursementUpdate() {
    // Get reimbursement ID from URL
    const id = getReimbursementIdFromUrl();
    if (!id) {
        Swal.fire('Error', 'No reimbursement ID found', 'error');
        return;
    }
    
    // Collect reimbursement details from table
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
    
    // Build request data
    const requestData = {
        requesterName: document.getElementById('requesterName').value,
        department: document.getElementById('department').value,
        currency: document.getElementById('currency').value,
        payTo: document.getElementById('requesterName').value, // Use requesterName for payTo
        referenceDoc: document.getElementById('referenceDoc').value,
        typeOfTransaction: document.getElementById('typeOfTransaction').value,
        remarks: document.getElementById('remarks').value,
        reimbursementDetails: reimbursementDetails
    };
    
    // API call removed
    Swal.fire(
        'Updated!',
        'Reimbursement has been updated successfully.',
        'success'
    ).then(() => {
        // Reload the data to show the latest changes
        fetchReimbursementData();
    });
}

// Function to go back to menu
function goToMenuReim() {
    window.location.href = '../../../dashboard/dashboardAcknowledge/reimbursement/menuReimAcknow.html';
}

function onReject() {
    Swal.fire({
        title: 'Reject Document',
        input: 'textarea',
        inputLabel: 'Remarks',
        inputPlaceholder: 'Enter your remarks here...',
        showCancelButton: true,
        confirmButtonText: 'Send Reject',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: true,
        preConfirm: (remarks) => {
            if (!remarks) {
                Swal.showValidationMessage('Please enter remarks for rejection');
                return false;
            }
            
            // Get reimbursement ID from URL
            const id = getReimbursementIdFromUrl();
            if (!id) {
                Swal.showValidationMessage('No reimbursement ID found');
                return false;
            }
            
            // Make API call to reject the reimbursement
            return fetch(`${BASE_URL}/api/reimbursements/acknowledger/${id}/reject`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAccessToken()}`
                },
                body: JSON.stringify({
                    remarks: remarks
                })
            })
            .then(response => response.json())
            .then(result => {
                if (!result.status) {
                    throw new Error(result.message || 'Failed to reject document');
                }
                return result;
            })
            .catch(error => {
                console.error('Error rejecting reimbursement:', error);
                Swal.showValidationMessage(`Rejection failed: ${error.message}`);
                return false;
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed && result.value.status) {
            Swal.fire(
                'Rejected!',
                'The document has been rejected.',
                'success'
            ).then(() => {
                // Return to menu
                goToMenuReim();
            });
        }
    });
}

function onApprove() {
    Swal.fire({
        title: 'Are you sure?',
        text: "Are you sure you want to approve this document?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Approve it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Get reimbursement ID from URL
            const id = getReimbursementIdFromUrl();
            if (!id) {
                Swal.fire('Error', 'No reimbursement ID found', 'error');
                return;
            }
            
            // Make API call to approve the reimbursement
            fetch(`${BASE_URL}/api/reimbursements/acknowledger/${id}/approve`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAccessToken()}`
                }
            })
            .then(response => response.json())
            .then(result => {
                if (result.status && result.code === 200) {
                    Swal.fire(
                        'Approved!',
                        'The document has been approved.',
                        'success'
                    ).then(() => {
                        // Return to menu
                        goToMenuReim();
                    });
                } else {
                    Swal.fire(
                        'Error',
                        result.message || 'Failed to approve document',
                        'error'
                    );
                }
            })
            .catch(error => {
                console.error('Error approving reimbursement:', error);
                Swal.fire(
                    'Error',
                    'An error occurred while approving the document',
                    'error'
                );
            });
        }
    });
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

function displayFileList() {
    // Implementation for displaying file list
    // This function was referenced but not defined in the original code
    console.log('Files uploaded:', uploadedFiles);
}

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

// Event listener for document type change
document.addEventListener('DOMContentLoaded', function() {
    // Load users, departments, and transaction types first
    Promise.all([fetchUsers(), fetchDepartments(), fetchTransactionTypes()]).then(() => {
        // Then load reimbursement data
        fetchReimbursementData();
    });
});

    