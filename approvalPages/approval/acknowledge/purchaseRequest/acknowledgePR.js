let uploadedFiles = [];

let prId; // Declare global variable
let prType; // Declare global variable
let currentTab; // Declare global variable for tab

// Function to fetch PR details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    prId = urlParams.get('pr-id');
    prType = urlParams.get('pr-type');
    currentTab = urlParams.get('tab'); // Get the tab parameter
    
    if (prId && prType) {
        fetchPRDetails(prId, prType);
    }
    
    // Hide approve/reject buttons if viewing from checked or rejected tabs
    if (currentTab === 'acknowledged' || currentTab === 'rejected') {
        hideApprovalButtons();
    }
    
    // Setup click-outside-to-close behavior for all dropdowns
    document.addEventListener('click', function(event) {
        const dropdowns = document.querySelectorAll('.search-dropdown');
        dropdowns.forEach(dropdown => {
            const searchInput = document.getElementById(dropdown.id.replace('Dropdown', 'Search'));
            if (searchInput && !searchInput.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
    });
};

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
        const userName = user.fullName;
        return userName.toLowerCase().includes(searchText);
    });
    
    // Display search results
    filteredUsers.forEach(user => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        const userName = user.fullName;
        option.innerText = userName;
        option.onclick = function() {
            searchInput.value = userName;
            
            // Get the correct select element based on fieldId
            let selectId;
            switch(fieldId) {
                case 'preparedBy': selectId = 'prepared'; break;
                case 'knowledgeBy': selectId = 'Knowledge'; break;
                case 'checkedBy': selectId = 'Checked'; break;
                case 'approvedBy': selectId = 'Approved'; break;
                case 'receivedBy': selectId = 'Received'; break;
                default: selectId = fieldId;
            }
            
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

function fetchPRDetails(prId, prType) {
    const endpoint = prType.toLowerCase() === 'service' ? 'service' : 'item';
    fetch(`${BASE_URL}/api/pr/${endpoint}/${prId}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(response => {
            if (response.data) {
                console.log(response.data);
                populatePRDetails(response.data);
                // Always fetch dropdown options
                fetchDropdownOptions(response.data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error fetching PR details: ' + error.message);
        });
}

function populatePRDetails(data) {
    // Populate basic PR information
    document.getElementById('purchaseRequestNo').value = data.purchaseRequestNo;
    document.getElementById('requesterName').value = data.requesterName;
  
    // Format and set dates
    const submissionDate = data.submissionDate ? data.submissionDate.split('T')[0] : '';
    const requiredDate = data.requiredDate ? data.requiredDate.split('T')[0] : '';
    document.getElementById('submissionDate').value = submissionDate;
    document.getElementById('requiredDate').value = requiredDate;
    
    // Set remarks
    if (document.getElementById('remarks')) {
        document.getElementById('remarks').value = data.remarks;
    }

    // Set department - create option directly from backend data
    const departmentSelect = document.getElementById('department');
    if (data.departmentName && departmentSelect) {
        departmentSelect.innerHTML = ''; // Clear existing options
        const option = document.createElement('option');
        option.value = data.departmentName; // Use department name as value since backend returns string
        option.textContent = data.departmentName;
        option.selected = true;
        departmentSelect.appendChild(option);
    }

    // Set classification - create option directly from backend data
    const classificationSelect = document.getElementById('classification');
    if (data.classification && classificationSelect) {
        classificationSelect.innerHTML = ''; // Clear existing options
        console.log('Classification:', data.classification);
        const option = document.createElement('option');
        option.value = data.classification; // Use classification as value since backend returns string
        option.textContent = data.classification;
        option.selected = true;
        classificationSelect.appendChild(option);
    }

    // Set status - create option directly from backend data
    if (data && data.status) {
        console.log('Status:', data.status);
        const statusSelect = document.getElementById('status');
        if (statusSelect) {
            statusSelect.innerHTML = ''; // Clear existing options
            const option = document.createElement('option');
            option.value = data.status;
            option.textContent = data.status;
            option.selected = true;
            statusSelect.appendChild(option);
        }
    }
    
    // Handle item details (only item type is supported now)
    if (data.itemDetails) {
        populateItemDetails(data.itemDetails);
    }
    
    // Display revised remarks if available
    displayRevisedRemarks(data);
    
    // Display attachments if they exist
    console.log('Attachments data:', data.attachments);
    if (data.attachments) {
        console.log('Displaying attachments:', data.attachments.length, 'attachments found');
        displayAttachments(data.attachments);
    } else {
        console.log('No attachments found in data');
    }
    
    // Make all fields read-only since this is an approval page
    makeAllFieldsReadOnly();
}

// Function to display revised remarks from API
function displayRevisedRemarks(data) {
    const revisedRemarksSection = document.getElementById('revisedRemarksSection');
    const revisedCountElement = document.getElementById('revisedCount');
    
    // Check if there are any revision remarks
    const hasRevisions = data.revisedCount && parseInt(data.revisedCount) > 0;
    
    if (hasRevisions && revisedRemarksSection) {
        revisedRemarksSection.style.display = 'block';
        revisedCountElement.textContent = data.revisedCount || '0';
        
        // Display individual revision remarks
        const revisionFields = [
            { data: data.firstRevisionRemarks, containerId: 'firstRevisionContainer', elementId: 'firstRevisionRemarks' },
            { data: data.secondRevisionRemarks, containerId: 'secondRevisionContainer', elementId: 'secondRevisionRemarks' },
            { data: data.thirdRevisionRemarks, containerId: 'thirdRevisionContainer', elementId: 'thirdRevisionRemarks' },
            { data: data.fourthRevisionRemarks, containerId: 'fourthRevisionContainer', elementId: 'fourthRevisionRemarks' }
        ];
        
        revisionFields.forEach(field => {
            if (field.data && field.data.trim() !== '') {
                const container = document.getElementById(field.containerId);
                const element = document.getElementById(field.elementId);
                
                if (container && element) {
                    container.style.display = 'block';
                    element.textContent = field.data;
                }
            }
        });
    } else if (revisedRemarksSection) {
        revisedRemarksSection.style.display = 'none';
    }
}

function populateServiceDetails(services) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (services.length === 0) {
        return;
    }
    
    console.log('Service details:', services);
    
    services.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border">
                <input type="text" value="${service.description || ''}" class="w-full service-description" maxlength="200" required />
            </td>
            <td class="p-2 border">
                <input type="text" value="${service.purpose || ''}" class="w-full service-purpose" maxlength="10" required />
            </td>
            <td class="p-2 border">
                <input type="text" value="${service.quantity || ''}" class="w-full service-quantity" maxlength="10" required />
            </td>
            <td class="p-2 border text-center">
                <!-- Read-only view, no action buttons -->
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function populateItemDetails(items) {
    const tableBody = document.getElementById('tableBody');
    
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (items.length === 0) {
        console.log('No items to display');
        return;
    }
    
    items.forEach((item, index) => {
        try {
            console.log('Adding item row with data:', item);
            addItemRow(item);
        } catch (error) {
        }
    });
    
}

function addItemRow(item = null) {
    console.log('Adding');
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.error('tableBody element not found!');
        return;
    }
    
    const row = document.createElement('tr');
    
    // console.log('Adding item row with data:', item);

    // Display the actual API data in readonly inputs with consistent styling
    row.innerHTML = `
        <td class="p-2 border bg-gray-100">
            <select class="w-full p-2 border rounded item-no bg-gray-100" disabled>
                <option value="${item?.itemNo || ''}" selected>${item?.itemCode || item?.itemNo || ''}</option>
            </select>
        </td>
        <td class="p-2 border bg-gray-100">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto whitespace-pre-wrap break-words" rows="3" maxlength="200" disabled title="${item?.description || ''}" style="word-wrap: break-word; white-space: pre-wrap;">${item?.description || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <input type="text" value="${item?.detail || ''}" class="w-full h-full item-detail text-center bg-gray-100" maxlength="100" readonly />
        </td>
        <td class="p-2 border h-12">
            <input type="text" value="${item?.purpose || ''}" class="w-full h-full item-purpose text-center bg-gray-100" maxlength="100" readonly />
        </td>
        <td class="p-2 border h-12">
            <input type="number" value="${item?.quantity || ''}" class="w-full h-full item-quantity text-center bg-gray-100" readonly />
        </td>
        <td class="p-2 border bg-gray-100">
            <input type="text" value="${item?.uom || ''}" class="w-full item-uom bg-gray-100" disabled />
        </td>
        <td class="p-2 border text-center">
            <!-- Read-only view, no action buttons -->
        </td>
    `;
    
    tableBody.appendChild(row);
    
    console.log('Item row added with values:', {
        itemNo: item?.itemNo || '',
        description: item?.description || '',
        detail: item?.detail || '',
        purpose: item?.purpose || '',
        quantity: item?.quantity || '',
        uom: item?.uom || ''
    });
}

// Function to fetch all dropdown options
function fetchDropdownOptions(prData = null) {
    fetchUsers(prData);
    fetchItemOptions();
}

// Function to fetch users from API
function fetchUsers(prData = null) {
    fetch(`${BASE_URL}/api/users`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // Store users globally for search functionality
            window.allUsers = data.data;
            populateUserSelects(data.data, prData);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
}

// Function to fetch item options from API
function fetchItemOptions() {
    fetch(`${BASE_URL}/api/items`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Items data:', data.data);
            // Populate all item selects in the document
            document.querySelectorAll('.item-no').forEach(select => {
                populateItemSelect(data.data, select);
            });
        })
        .catch(error => {
            console.error('Error fetching items:', error);
        });
}

function populateUserSelects(users, prData = null) {
    const selects = [
        { id: 'prepared', approvalKey: 'preparedById', searchId: 'preparedBySearch' },
        { id: 'Checked', approvalKey: 'checkedById', searchId: 'checkedBySearch' },
        { id: 'Knowledge', approvalKey: 'acknowledgedById', searchId: 'knowledgeBySearch' },
        { id: 'Approved', approvalKey: 'approvedById', searchId: 'approvedBySearch' },
        { id: 'Received', approvalKey: 'receivedById', searchId: 'receivedBySearch' }
    ];
    
    selects.forEach(selectInfo => {
        const select = document.getElementById(selectInfo.id);
        if (select) {
            select.innerHTML = '<option value="" disabled>Select User</option>';
            
            users.forEach(user => {
                const option = document.createElement("option");
                option.value = user.id;
                option.textContent = user.fullName;
                select.appendChild(option);
            });
            
            // Set the value from PR data if available and update search input
            if (prData && prData[selectInfo.approvalKey]) {
                select.value = prData[selectInfo.approvalKey];
                
                // Update the search input to display the selected user's name
                const searchInput = document.getElementById(selectInfo.searchId);
                if (searchInput) {
                    const selectedUser = users.find(user => user.id === prData[selectInfo.approvalKey]);
                    if (selectedUser) {
                        searchInput.value = selectedUser.fullName;
                    }
                }
            }
        }
    });
}

// Function to approve PR
function approvePR() {
    Swal.fire({
        title: 'Confirm Acknowledgment',
        text: 'Are you sure you want to acknowledge this Purchase Request?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Acknowledge',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updatePRStatus('approve');
        }
    });
}

// Function to reject PR
function rejectPR() {
    Swal.fire({
        title: 'Reject PR',
        input: 'textarea',
        inputLabel: 'Please provide a reason for rejection',
        inputPlaceholder: 'Enter your reason here...',
        inputAttributes: {
            'aria-label': 'Rejection reason'
        },
        showCancelButton: true,
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        preConfirm: (remarks) => {
            if (!remarks.trim()) {
                Swal.showValidationMessage('Please enter a reason for rejection');
                return false;
            }
            return remarks;
        }
    }).then((remarksResult) => {
        if (remarksResult.isConfirmed) {
            updatePRStatusWithRemarks('reject', remarksResult.value);
        }
    });
}

// Function to approve or reject the PR
function updatePRStatus(status) {
    if (!prId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'PR ID not found'
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
        id: prId,
        UserId: userId,
        StatusAt: "Acknowledge",
        Action: status,
        Remarks: ''
    };

    // Show loading
    Swal.fire({
        title: `${status === 'approve' ? 'Acknowledging' : 'Processing'}...`,
        text: 'Please wait while we process your request.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const endpoint = prType.toLowerCase() === 'service' ? 'service' : 'item';
    
    fetch(`${BASE_URL}/api/pr/${endpoint}/status`, {
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
                text: `PR ${status === 'approve' ? 'acknowledged' : 'rejected'} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                goToMenuAcknowPR();
            });
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to ${status} PR. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error ${status === 'approve' ? 'acknowledging' : 'rejecting'} PR: ` + error.message
        });
    });
}

// Function to approve or reject the PR with remarks
function updatePRStatusWithRemarks(status, remarks) {
    if (!prId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'PR ID not found'
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
        id: prId,
        UserId: userId,
        StatusAt: "Acknowledge",
        Action: status,
        Remarks: remarks || ''
    };

    // Show loading
    Swal.fire({
        title: `${status === 'approve' ? 'Acknowledging' : (status === 'reject' ? 'Rejecting' : 'Requesting Revision')}...`,
        text: 'Please wait while we process your request.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const endpoint = prType.toLowerCase() === 'service' ? 'service' : 'item';
    
    fetch(`${BASE_URL}/api/pr/${endpoint}/status`, {
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
                text: `PR ${status === 'approve' ? 'acknowledged' : (status === 'reject' ? 'rejected' : 'sent for revision')} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                goToMenuAcknowPR();
            });
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to ${status} PR. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error ${status === 'approve' ? 'acknowledging' : (status === 'reject' ? 'rejecting' : 'requesting revision for')} PR: ` + error.message
        });
    });
}

// toggleFields function removed - only item type is supported

// addRow function removed - not needed for approval pages

function deleteRow(button) {
    button.closest("tr").remove();
}

// Initialize table display on page load
window.addEventListener("DOMContentLoaded", function() {
    // Panggil fungsi untuk memuat data dokumen
    loadDocumentById();
    
    // Hide service fields by default
    const serviceFields = ["thDescription", "thPurposes", "thQty", "thActions", 
                          "tdDescription", "tdPurposeds", "tdQty", "tdActions"];
    serviceFields.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.style.display = "none";
    });
    
    // If PR type is already selected, toggle fields accordingly

});

// Function to make all fields read-only for approval view
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
    
    // Disable all checkboxes
    const checkboxFields = document.querySelectorAll('input[type="checkbox"]');
    checkboxFields.forEach(field => {
        field.disabled = true;
        field.classList.add('cursor-not-allowed');
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

// Function to hide approval buttons
function hideApprovalButtons() {
    const approveButton = document.querySelector('button[onclick="approvePR()"]');
    const rejectButton = document.querySelector('button[onclick="rejectPR()"]');
    
    if (approveButton) {
        approveButton.style.display = 'none';
    }
    if (rejectButton) {
        rejectButton.style.display = 'none';
    }
    
    // Also hide any parent container if needed
    const buttonContainer = document.querySelector('.approval-buttons, .button-container');
    if (buttonContainer && currentTab !== 'prepared') {
        buttonContainer.style.display = 'none';
    }
}

function updateItemDescription(selectElement) {
    const row = selectElement.closest('tr');
    const descriptionInput = row.querySelector('.item-description');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    
    // Check if a valid item is selected (not the placeholder option)
    if (selectedOption && !selectedOption.disabled && selectedOption.value && selectedOption.value !== "") {
        // Get description from data attribute first, fallback to parsing text
        const itemDescription = selectedOption.getAttribute('data-description');
        if (itemDescription) {
            descriptionInput.value = itemDescription;
            descriptionInput.textContent = itemDescription; // For textarea
            descriptionInput.title = itemDescription; // For tooltip
        } else {
            // Fallback to old method for backward compatibility
            const itemText = selectedOption.text;
            const itemName = itemText.split(' - ')[1];
            descriptionInput.value = itemName || '';
            descriptionInput.textContent = itemName || '';
            descriptionInput.title = itemName || '';
        }
    } else {
        // No valid item selected, clear the description
        descriptionInput.value = '';
        descriptionInput.textContent = '';
        descriptionInput.title = '';
    }
    
    // Always keep description field disabled and gray
    descriptionInput.disabled = true;
    descriptionInput.classList.add('bg-gray-100');
}

// Function to display attachments (similar to detail pages)
function displayAttachments(attachments) {
    console.log('displayAttachments called with:', attachments);
    const attachmentsList = document.getElementById('attachmentsList');
    if (!attachmentsList) {
        console.error('attachmentsList element not found');
        return;
    }
    
    attachmentsList.innerHTML = ''; // Clear existing attachments
    
    if (attachments && attachments.length > 0) {
        attachments.forEach(attachment => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'flex justify-between items-center py-1 border-b last:border-b-0';
            
            attachmentItem.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-sm text-gray-700">${attachment.fileName}</span>
                </div>
                <a href="${attachment.fileUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm">
                    View
                </a>
            `;
            
            attachmentsList.appendChild(attachmentItem);
        });
    } else {
        attachmentsList.innerHTML = '<p class="text-gray-500 text-sm">No attachments available</p>';
    }
}