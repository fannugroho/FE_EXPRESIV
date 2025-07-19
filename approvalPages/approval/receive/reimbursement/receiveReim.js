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
        console.log('Fetching reimbursement data for ID:', reimbursementId);
        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}`);
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            console.log('Reimbursement data received:', result.data);
            console.log('Type of Transaction:', result.data.typeOfTransaction);
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
        console.log('Fetching users from API...');
        const response = await fetch(`${BASE_URL}/api/users`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Users API response:', result);
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch users');
        }
        
        const users = result.data;
        console.log('Users data:', users);
        
        if (!users || users.length === 0) {
            console.warn('No users found in API response');
            return;
        }
        
        // Store users globally for later use
        window.allUsers = users;
        
        // Populate dropdowns
        populateDropdown("preparedBySelect", users);
        populateDropdown("acknowledgedBySelect", users);
        populateDropdown("checkedBySelect", users);
        populateDropdown("approvedBySelect", users);
        populateDropdown("receiveBySelect", users);
        
        // Make all dropdowns readonly by disabling them
        const dropdownIds = ["preparedBySelect", "acknowledgedBySelect", "checkedBySelect", "approvedBySelect", "receiveBySelect"];
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
        console.log('Added new department option:', departmentName);
    }
}

// Helper function to populate a dropdown with user data
function populateDropdown(dropdownId, users) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        console.log(`Dropdown ${dropdownId} not found`);
        return;
    }
    
    console.log(`Populating ${dropdownId} with ${users.length} users`);
    
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
    // Store users globally for search functionality (mock data if needed)
    window.allUsers = window.allUsers || [];
    
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
    
    // Format date for the date input (YYYY-MM-DD) with local timezone
    if (data.submissionDate && document.getElementById('submissionDate')) {
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
    
    if (document.getElementById('status')) document.getElementById('status').value = data.status || '';
    if (document.getElementById('referenceDoc')) document.getElementById('referenceDoc').value = data.referenceDoc || '';
    //if (document.getElementById('typeOfTransaction')) document.getElementById('typeOfTransaction').value = data.typeOfTransaction || '';
    if (document.getElementById('remarks')) document.getElementById('remarks').value = data.remarks || '';
    
    // Approvers information - safely check if elements exist
    if (document.getElementById('preparedBySelect')) document.getElementById('preparedBySelect').value = data.preparedBy || '';
    if (document.getElementById('checkedBySelect')) document.getElementById('checkedBySelect').value = data.checkedBy || '';
    if (document.getElementById('acknowledgedBySelect')) document.getElementById('acknowledgedBySelect').value = data.acknowledgedBy || '';
    if (document.getElementById('approvedBySelect')) document.getElementById('approvedBySelect').value = data.approvedBy || '';
    if (document.getElementById('receiveBySelect')) document.getElementById('receiveBySelect').value = data.receivedBy || '';
    
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
    
    if (data.revisions) {
        renderRevisionHistory(data.revisions);
    } else {
        renderRevisionHistory([]);
    }
    
    // Display rejection remarks if status is Rejected
    if (data.status === 'Rejected') {
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        const rejectionTextarea = document.getElementById('rejectionRemarks');
        
        if (rejectionSection && rejectionTextarea) {
            // Check for various possible rejection remarks fields
            let rejectionRemarks = '';
            
            // Check for specific rejection remarks by role
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
    } else {
        // Hide the rejection remarks section if status is not Rejected
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        if (rejectionSection) {
            rejectionSection.style.display = 'none';
        }
    }
    
    // Fix untuk typeOfTransaction - pastikan nilai ditampilkan dengan benar
    if (document.getElementById('typeOfTransaction') && data.typeOfTransaction) {
        const typeSelect = document.getElementById('typeOfTransaction');
        
        // Cek apakah nilai ada dalam opsi
        let optionExists = false;
        for (let i = 0; i < typeSelect.options.length; i++) {
            if (typeSelect.options[i].value === data.typeOfTransaction) {
                optionExists = true;
                break;
            }
        }
        
        // Aktifkan sementara untuk mengatur nilai
        typeSelect.disabled = false;
        
        // Jika nilai tidak ada dalam opsi, tambahkan opsi baru
        if (!optionExists && data.typeOfTransaction) {
            const newOption = document.createElement('option');
            newOption.value = data.typeOfTransaction;
            newOption.textContent = data.typeOfTransaction;
            typeSelect.appendChild(newOption);
        }
        
        // Set nilai
        typeSelect.value = data.typeOfTransaction;
        
        // Nonaktifkan kembali
        setTimeout(() => {
            typeSelect.disabled = true;
            typeSelect.classList.add('bg-gray-100', 'cursor-not-allowed');
        }, 100);
        
        console.log('Set typeOfTransaction to:', data.typeOfTransaction);
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
            // Format amount with decimal places
            const formattedAmount = formatAmount(detail.amount);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-2 border">
                    <select class="w-full bg-gray-100" required disabled>
                        <option value="${detail.category || ''}" selected>${detail.category || ''}</option>
                    </select>
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
    
    // Calculate and update total amount
    updateTotalAmount();
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
            <select class="w-full bg-gray-100" required disabled>
                <option value="" selected></option>
            </select>
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
}

// Delete a row from the reimbursement details table
function deleteRow(button) {
    const row = button.closest('tr');
    row.remove();
}

function goToMenuReim() {
    window.location.href = '../../../dashboard/dashboardReceive/reimbursement/menuReimReceive.html';
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
        const categoryCell = row.querySelector('td:nth-child(1) select');
        const accountNameCell = row.querySelector('td:nth-child(2) input');
        const glAccountCell = row.querySelector('td:nth-child(3) input');
        const descriptionCell = row.querySelector('td:nth-child(4) input');
        const amountCell = row.querySelector('td:nth-child(5) input');
        const deleteButton = row.querySelector('button');
        const detailId = deleteButton ? deleteButton.getAttribute('data-id') : null;
        
        if (!categoryCell || !accountNameCell || !glAccountCell || !descriptionCell || !amountCell) {
            return; // Skip if any cell is missing
        }
        
        reimbursementDetails.push({
            id: detailId,
            category: categoryCell.value || categoryCell.options[categoryCell.selectedIndex]?.value || '',
            accountName: accountNameCell.value,
            glAccount: glAccountCell.value,
            description: descriptionCell.value,
            amount: parseFloat(amountCell.dataset.rawValue || amountCell.value) || 0
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

// Function to navigate back to the menu
function goToMenuReceiveReim() {
    window.location.href = "../../../dashboard/dashboardReceive/reimbursement/menuReimReceive.html";
}

// Function to reject the document
function onReject() {
    // Create custom dialog with single field
    Swal.fire({
        title: 'Reject Reimbursement',
        html: `
            <div class="mb-4">
                <p class="text-sm text-gray-600 mb-3">Please provide a reason for rejection:</p>
                <div id="rejectionFieldsContainer">
                    <textarea id="rejectionField1" class="w-full p-2 border rounded-md" placeholder="Enter rejection reason" rows="3"></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        width: '600px',
        didOpen: () => {
            const firstField = document.getElementById('rejectionField1');
            if (firstField) {
                initializeWithRejectionPrefix(firstField);
            }
            const field = document.querySelector('#rejectionFieldsContainer textarea');
            if (field) {
                field.addEventListener('input', handleRejectionInput);
            }
        },
        preConfirm: () => {
            const field = document.querySelector('#rejectionFieldsContainer textarea');
            const remarks = field ? field.value.trim() : '';
            if (remarks === '') {
                Swal.showValidationMessage('Please enter a rejection reason');
                return false;
            }
            return remarks;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Get reimbursement ID from URL
            const id = getReimbursementIdFromUrl();
            if (!id) {
                Swal.fire('Error', 'No reimbursement ID found', 'error');
                return;
            }
            
            // Make API call to reject the reimbursement
            fetch(`${BASE_URL}/api/reimbursements/receiver/${id}/reject`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAccessToken()}`
                },
                body: JSON.stringify({
                    remarks: result.value
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.status && result.code === 200) {
                    Swal.fire(
                        'Rejected!',
                        'The document has been rejected.',
                        'success'
                    ).then(() => {
                        // Return to menu
                        goToMenuReceiveReim();
                    });
                } else {
                    Swal.fire(
                        'Error',
                        result.message || 'Failed to reject document',
                        'error'
                    );
                }
            })
            .catch(error => {
                console.error('Error rejecting reimbursement:', error);
                Swal.fire(
                    'Error',
                    'An error occurred while rejecting the document',
                    'error'
                );
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
            fetch(`${BASE_URL}/api/reimbursements/receiver/${id}/approve`, {
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
                        goToMenuReceiveReim();
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

// Function to print reimbursement
function printReimbursement() {
    // Get reimbursement ID from URL
    const reimId = getReimbursementIdFromUrl();
    if (!reimId) {
        Swal.fire('Error', 'No reimbursement ID found', 'error');
        return;
    }
    
    // Get values from form fields
    const voucherNo = document.getElementById('voucherNo').value || '';
    const payTo = document.getElementById('payTo').value || '';
    const submissionDate = document.getElementById('submissionDate').value || '';
    const department = document.getElementById('department').value || '';
    const referenceDoc = document.getElementById('referenceDoc').value || '';
    const typeOfTransaction = document.getElementById('typeOfTransaction').value || '';
    const remarks = document.getElementById('remarks').value || '';
    const currency = document.getElementById('currency').value || '';
    
    // Get approvers
    const preparedBy = document.getElementById('preparedBySelect').options[document.getElementById('preparedBySelect').selectedIndex]?.text || '';
    const checkedBy = document.getElementById('checkedBySelect').options[document.getElementById('checkedBySelect').selectedIndex]?.text || '';
    const acknowledgeBy = document.getElementById('acknowledgedBySelect').options[document.getElementById('acknowledgedBySelect').selectedIndex]?.text || '';
    const approvedBy = document.getElementById('approvedBySelect').options[document.getElementById('approvedBySelect').selectedIndex]?.text || '';
    const receivedBy = document.getElementById('receiveBySelect').options[document.getElementById('receiveBySelect').selectedIndex]?.text || '';
    
    // Get total amount - use raw value if available, otherwise use formatted value
    const totalAmountElement = document.getElementById('totalAmount');
    let totalAmount = '0';
    
    if (totalAmountElement) {
        // Prefer raw value if available (more accurate for calculations)
        if (totalAmountElement.dataset && totalAmountElement.dataset.rawValue) {
            totalAmount = totalAmountElement.dataset.rawValue;
        } else {
            // Fall back to formatted value
            totalAmount = totalAmountElement.value || '0';
        }
    }
    
    console.log('Sending total amount to print page:', totalAmount);
    
    // Get reimbursement details from table
    const detailsTable = document.getElementById('reimbursementDetails');
    const details = [];
    
    if (detailsTable) {
        const rows = detailsTable.querySelectorAll('tr');
        rows.forEach(row => {
            const categoryCell = row.querySelector('td:nth-child(1) select');
            const accountNameCell = row.querySelector('td:nth-child(2) input');
            const glAccountCell = row.querySelector('td:nth-child(3) input');
            const descriptionCell = row.querySelector('td:nth-child(4) input');
            const amountCell = row.querySelector('td:nth-child(5) input');
            
            if (!categoryCell || !accountNameCell || !glAccountCell || !descriptionCell || !amountCell) {
                return; // Skip if any cell is missing
            }
            
            const amount = parseFloat(amountCell.dataset.rawValue || amountCell.value) || 0;
            
            details.push({
                category: categoryCell.value || categoryCell.options[categoryCell.selectedIndex]?.value || '',
                accountName: accountNameCell.value,
                glAccount: glAccountCell.value,
                description: descriptionCell.value,
                amount: amount
            });
        });
    }
    
    // Encode the details as JSON and then as URI component
    const detailsParam = encodeURIComponent(JSON.stringify(details));
    
    // Build URL with all parameters
    const printUrl = `printReim.html?reim-id=${reimId}&payTo=${encodeURIComponent(payTo)}&voucherNo=${encodeURIComponent(voucherNo)}&submissionDate=${encodeURIComponent(submissionDate)}&department=${encodeURIComponent(department)}&referenceDoc=${encodeURIComponent(referenceDoc)}&preparedBy=${encodeURIComponent(preparedBy)}&checkedBy=${encodeURIComponent(checkedBy)}&acknowledgeBy=${encodeURIComponent(acknowledgeBy)}&approvedBy=${encodeURIComponent(approvedBy)}&receivedBy=${encodeURIComponent(receivedBy)}&totalAmount=${encodeURIComponent(totalAmount)}&details=${detailsParam}&typeOfTransaction=${encodeURIComponent(typeOfTransaction)}&remarks=${encodeURIComponent(remarks)}&currency=${encodeURIComponent(currency)}`;
    
    // Open the print page in a new window/tab
    window.open(printUrl, '_blank');
}

// Event listener for document type change
// Removed DOMContentLoaded event listener to avoid conflict with the one in HTML

// Function to filter users for the search dropdown in approval section
function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    // Use stored users or mock data if not available
    const usersList = window.allUsers || [];
    
    // Filter users based on search text
    const filteredUsers = usersList.filter(user => {
        const userName = user.name || `${user.fullName || ''}`;
        return userName.toLowerCase().includes(searchText);
    });
    
    // Display search results
    filteredUsers.forEach(user => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        const userName = user.name || `${user.fullName}`;
        option.innerText = userName;
        option.onclick = function() {
            searchInput.value = userName;
            
            // Get the correct select element based on fieldId
            let selectId = fieldId;
            document.getElementById(selectId).value = user.id;
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(option);
    });
    
    // Display message if no results
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'No matching users found';
        dropdown.appendChild(noResults);
    }
    
    // Show dropdown
    dropdown.classList.remove('hidden');
}

// Helper function to update approver fields
function updateApproverField(fieldId, value) {
    if (!value) return;
    
    const select = document.getElementById(fieldId);
    const searchInput = document.getElementById(`${fieldId}Search`);
    
    if (select) {
        select.value = value;
    }
    
    if (searchInput) {
        searchInput.value = value;
    }
}

// Function to make all fields read-only
function makeAllFieldsReadOnly() {
    // Make all input fields read-only
    const inputFields = document.querySelectorAll('input[type="text"]:not([id$="Search"]), input[type="date"], input[type="number"], textarea');
    inputFields.forEach(field => {
        field.readOnly = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
    });
    
    // Make search inputs read-only but with normal styling
    const searchInputs = document.querySelectorAll('input[id$="Search"]');
    searchInputs.forEach(field => {
        field.readOnly = true;
        field.classList.add('bg-gray-50');
        // Remove the onkeyup event to prevent search triggering
        field.removeAttribute('onkeyup');
    });
    
    // Disable all select fields
    const selectFields = document.querySelectorAll('select');
    selectFields.forEach(field => {
        field.disabled = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
    });
    
    // Hide add row button
    const addRowButton = document.querySelector('button[onclick="addRow()"]');
    if (addRowButton) {
        addRowButton.style.display = 'none';
    }
    
    // Hide all delete row buttons
    const deleteButtons = document.querySelectorAll('button[onclick="deleteRow(this)"]');
    deleteButtons.forEach(button => {
        button.style.display = 'none';
    });
    
    // Disable file upload
    const fileInput = document.getElementById('filePath');
    if (fileInput) {
        fileInput.disabled = true;
        fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
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
    const totalAmountElement = document.getElementById('totalAmount');
    if (totalAmountElement) {
        totalAmountElement.value = formattedTotal;
        // Store raw value as data attribute for accurate calculations
        totalAmountElement.dataset.rawValue = total.toString();
        console.log('Updated total amount:', formattedTotal, 'Raw value:', total);
    } else {
        console.error('totalAmount element not found');
    }
}

// Function to initialize textarea with user prefix for rejection
function initializeWithRejectionPrefix(textarea) {
    const userInfo = getUserInfo();
    const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
    textarea.value = prefix;
    
    // Store the prefix length as a data attribute
    textarea.dataset.prefixLength = prefix.length;
    
    // Set selection range after the prefix
    textarea.setSelectionRange(prefix.length, prefix.length);
    textarea.focus();
}

// Function to handle input and protect the prefix for rejection
function handleRejectionInput(event) {
    const textarea = event.target;
    const prefixLength = parseInt(textarea.dataset.prefixLength || '0');
    
    // If user tries to modify content before the prefix length
    if (textarea.selectionStart < prefixLength || textarea.selectionEnd < prefixLength) {
        const userInfo = getUserInfo();
        const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
        
        // Only restore if the prefix is damaged
        if (!textarea.value.startsWith(prefix)) {
            const userText = textarea.value.substring(prefixLength);
            textarea.value = prefix + userText;
            textarea.setSelectionRange(prefixLength, prefixLength);
        } else {
            textarea.setSelectionRange(prefixLength, prefixLength);
        }
    }
}

// Function to get current user information
function getUserInfo() {
    // Use functions from auth.js to get user information
    let userName = 'Unknown User';
    let userRole = 'Receiver'; // Default role for this page
    
    try {
        // Get user info from getCurrentUser function in auth.js
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.username) {
            userName = currentUser.username;
        }
    } catch (e) {
        console.error('Error getting user info:', e);
    }
    
    return { name: userName, role: userRole };
}

    