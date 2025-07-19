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
        populateDropdown("acknowledgeBySelect", users);
        populateDropdown("checkedBySelect", users);
        populateDropdown("approvedBySelect", users);
        populateDropdown("receivedBySelect", users);
        
        // Make all dropdowns readonly
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
    
    // Store users data for searching in searchable fields
    const searchableFields = [
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
                let displayName = user.fullName || '';
                if (!displayName.trim()) {
                    displayName = user.username || `User ${user.id}`;
                }
                return {
                    id: user.id,
                    name: displayName.trim()
                };
            }));
        }
    }
    
    console.log(`Finished populating ${dropdownId}`);
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
    if (fieldId === 'preparedBySelect' || 
        fieldId === 'acknowledgeBySelect' || 
        fieldId === 'checkedBySelect' || 
        fieldId === 'approvedBySelect' ||
        fieldId === 'receivedBySelect') {
        try {
            const users = JSON.parse(searchInput.dataset.users || '[]');
            filteredUsers = users.filter(user => user.name.toLowerCase().includes(searchText));
            
            // Show search results - readonly for checker view
            filteredUsers.forEach(user => {
                const option = document.createElement('div');
                option.className = 'dropdown-item';
                option.innerText = user.name;
                option.onclick = function() {
                    searchInput.value = user.name;
                    dropdown.classList.add('hidden');
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
    if (document.getElementById('typeOfTransaction')) document.getElementById('typeOfTransaction').value = data.typeOfTransaction || '';
    if (document.getElementById('remarks')) document.getElementById('remarks').value = data.remarks || '';
    
    // Call toggleButtonsBasedOnStatus after setting the status
    toggleButtonsBasedOnStatus();
    
    // Set approval values in both select and search inputs
    setApprovalValue('preparedBy', data.preparedBy);
    setApprovalValue('acknowledgeBy', data.acknowledgedBy);
    setApprovalValue('checkedBy', data.checkedBy);
    setApprovalValue('approvedBy', data.approvedBy);
    setApprovalValue('receivedBy', data.receivedBy);
    
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
                    <input type="text" value="${detail.category || ''}" maxlength="200" class="w-full" required readonly />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.accountName || ''}" maxlength="30" class="w-full" required readonly />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.glAccount || ''}" maxlength="10" class="w-full" required readonly />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.description || ''}" maxlength="200" class="w-full" required readonly />
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
    
    // Calculate and update the total amount
    if (typeof updateTotalAmount === 'function') {
        updateTotalAmount();
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
    
    // Update the total amount after removing a row
    if (typeof updateTotalAmount === 'function') {
        updateTotalAmount();
    }
}

// Function to go back to menu
function goToMenuReim() {
    window.location.href = '../../../dashboard/dashboardCheck/reimbursement/menuReimCheck.html';
}

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
            fetch(`${BASE_URL}/api/reimbursements/checker/${id}/reject`, {
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
                        goToMenuReim();
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
            fetch(`${BASE_URL}/api/reimbursements/checker/${id}/approve`, {
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
    console.log('Files uploaded:', uploadedFiles);
}

// Function to toggle buttons visibility based on status
function toggleButtonsBasedOnStatus() {
    const statusSelect = document.getElementById('status');
    const rejectButton = document.querySelector('button[onclick="onReject()"]');
    const approveButton = document.querySelector('button[onclick="onApprove()"]');
    const revisionButton = document.getElementById('revisionButton');
    const addRevisionBtn = document.getElementById('addRevisionBtn');
    const deleteButtons = document.querySelectorAll('#reimbursementDetails button[onclick*="deleteRow"]');
    
    if (statusSelect) {
        const currentStatus = statusSelect.value;
        const isPrepared = currentStatus === 'Prepared';
        const isRejected = currentStatus === 'Rejected';
        
        // Hide buttons if status is not "prepared" or if status is "rejected"
        if (!isPrepared || isRejected) {
            // Hide delete buttons in action column
            deleteButtons.forEach(btn => {
                btn.style.display = 'none';
            });
            
            // Hide other buttons
            if (rejectButton) rejectButton.style.display = 'none';
            if (approveButton) approveButton.style.display = 'none';
            if (revisionButton) revisionButton.style.display = 'none';
            if (addRevisionBtn) addRevisionBtn.style.display = 'none';
            
            // Hide revision container
            const revisionContainer = document.getElementById('revisionContainer');
            if (revisionContainer) {
                revisionContainer.classList.add('hidden');
            }
        } else {
            // Show buttons if status is "prepared" and not "rejected"
            deleteButtons.forEach(btn => {
                btn.style.display = 'inline-block';
            });
            
            if (rejectButton) rejectButton.style.display = 'inline-block';
            if (approveButton) approveButton.style.display = 'inline-block';
            if (revisionButton) revisionButton.style.display = 'inline-block';
            if (addRevisionBtn) addRevisionBtn.style.display = 'inline-block';
        }
    }
}

// Event listener for document ready
document.addEventListener('DOMContentLoaded', function() {
    // Load users and departments first
    Promise.all([fetchUsers(), fetchDepartments()]).then(() => {
        // Then load reimbursement data
        fetchReimbursementData();
    });
    
    // Setup event listeners for search dropdowns
    const searchFields = [
        'preparedBySearch',
        'acknowledgeBySearch',
        'checkedBySearch',
        'approvedBySearch',
        'receivedBySearch'
    ];
    
    searchFields.forEach(fieldId => {
        const searchInput = document.getElementById(fieldId);
        if (searchInput) {
            // Disable search input for read-only view
            searchInput.readOnly = true;
            
            // Add input event for real-time filtering
            searchInput.addEventListener('input', function() {
                const actualFieldId = fieldId.replace('Search', 'Select');
                filterUsers(actualFieldId);
            });
            
            // Add focus event to show dropdown
            searchInput.addEventListener('focus', function() {
                const actualFieldId = fieldId.replace('Search', 'Select');
                filterUsers(actualFieldId);
            });
        }
    });
    
    // Setup event listener to hide dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdowns = [
            'preparedBySelectDropdown', 
            'acknowledgeBySelectDropdown', 
            'checkedBySelectDropdown', 
            'approvedBySelectDropdown',
            'receivedBySelectDropdown'
        ];
        
        const searchInputs = [
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
    });

    // Add event listener for status select element
    const statusSelect = document.getElementById('status');
    if (statusSelect) {
        statusSelect.addEventListener('change', toggleButtonsBasedOnStatus);
    }

    // Call toggleButtonsBasedOnStatus initially
    toggleButtonsBasedOnStatus();
});

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
    let userRole = 'Checker'; // Default role for this page
    
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

    