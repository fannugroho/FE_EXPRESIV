// Using BASE_URL from auth.js instead of hardcoded baseUrl
let reimbursementId = '';
let uploadedFiles = [];

// Get reimbursement ID from URL
function getReimbursementIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('reim-id');
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
        
        // Populate dropdowns
        populateDropdown("preparedBySelect", users);
        populateDropdown("acknowledgeBySelect", users);
        populateDropdown("checkedBySelect", users);
        populateDropdown("approvedBySelect", users);
        
        // Make all dropdowns readonly by disabling them
        document.getElementById("preparedBySelect").disabled = true;
        document.getElementById("acknowledgeBySelect").disabled = true;
        document.getElementById("checkedBySelect").disabled = true;
        document.getElementById("approvedBySelect").disabled = true;
        
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

// Helper function to populate a dropdown with user data
function populateDropdown(dropdownId, users) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    // Clear existing options
    dropdown.innerHTML = "";
    
    // Add users as options
    users.forEach(user => {
        const option = document.createElement("option");
        option.value = user.id;
        
        // Combine names with spaces, handling empty middle/last names
        let displayName = user.firstName;
        if (user.middleName) displayName += ` ${user.middleName}`;
        if (user.lastName) displayName += ` ${user.lastName}`;
        
        option.textContent = displayName;
        dropdown.appendChild(option);
    });
}

// Populate form fields with data
function populateFormData(data) {
    // Main form fields
    if (document.getElementById('voucherNo')) document.getElementById('voucherNo').value = data.voucherNo || '';
    if (document.getElementById('requesterName')) document.getElementById('requesterName').value = data.requesterName || '';
    if (document.getElementById('department')) document.getElementById('department').value = data.department || '';
    if (document.getElementById('currency')) document.getElementById('currency').value = data.currency || '';
    if (document.getElementById('payTo')) document.getElementById('payTo').value = data.payTo || '';
    
    // Format date for the date input (YYYY-MM-DD)
    if (data.submissionDate && document.getElementById('submissionDate')) {
        const date = new Date(data.submissionDate);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('submissionDate').value = formattedDate;
    }
    
    if (document.getElementById('status')) document.getElementById('status').value = data.status || '';
    if (document.getElementById('referenceDoc')) document.getElementById('referenceDoc').value = data.referenceDoc || '';
    if (document.getElementById('typeOfTransaction')) document.getElementById('typeOfTransaction').value = data.typeOfTransaction || '';
    if (document.getElementById('remarks')) document.getElementById('remarks').value = data.remarks || '';
    
    // Approvers information - safely check if elements exist
    if (document.getElementById('preparedBySelect')) document.getElementById('preparedBySelect').value = data.preparedBy || '';
    if (document.getElementById('checkedBySelect')) document.getElementById('checkedBySelect').value = data.checkedBy || '';
    if (document.getElementById('acknowledgedBySelect')) document.getElementById('acknowledgedBySelect').value = data.acknowledgedBy || '';
    if (document.getElementById('approvedBySelect')) document.getElementById('approvedBySelect').value = data.approvedBy || '';
    
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
}

// Populate reimbursement details table
function populateReimbursementDetails(details) {
    const tableBody = document.getElementById('reimbursementDetails');
    if (!tableBody) {
        console.error('reimbursementDetails table body not found');
        return;
    }
    
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (details && details.length > 0) {
        details.forEach(detail => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-2 border">
                    <input type="text" value="${detail.description || ''}" maxlength="200" class="w-full" required readonly />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.glAccount || ''}" maxlength="10" class="w-full" required readonly />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.accountName || ''}" maxlength="30" class="w-full" required readonly />
                </td>
                <td class="p-2 border">
                    <input type="number" value="${detail.amount || 0}" maxlength="10" class="w-full" required readonly />
                </td>
                <td class="p-2 border text-center">
                    <button type="button" onclick="deleteRow(this)" data-id="${detail.id}" class="text-red-500 hover:text-red-700" disabled>
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
}

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

// Add a new empty row to the reimbursement details table
function addRow() {
    const tableBody = document.getElementById('reimbursementDetails');
    if (!tableBody) {
        console.error('reimbursementDetails table body not found');
        return;
    }
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" required readonly />
        </td>
        <td class="p-2 border">
            <input type="number" maxlength="10" class="w-full" required readonly />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="30" class="w-full" required readonly />
        </td>
        <td class="p-2 border">
            <input type="number" maxlength="10" class="w-full" required readonly />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700" disabled>
                🗑
            </button>
        </td>
    `;
    tableBody.appendChild(newRow);
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
        payTo: document.getElementById('payTo').value,
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

// Event listener for document type change
document.addEventListener('DOMContentLoaded', function() {
    // Load users first
    fetchUsers().then(() => {
        // Then load reimbursement data
        fetchReimbursementData();
    });
});

    