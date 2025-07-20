let uploadedFiles = [];

let prId; // Declare global variable
let prType; // Declare global variable
let currentTab; // Declare global variable for tab

// Function to navigate back to the PR Acknowledge menu
function goToMenuAcknowPR() {
    window.location.href = "../../../dashboard/dashboardAcknowledge/purchaseRequest/menuPRAcknow.html";
}

// Function to fetch PR details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    prId = urlParams.get('pr-id');
    prType = urlParams.get('pr-type');
    currentTab = urlParams.get('tab'); // Get the tab parameter
    
    if (prId && prType) {
        fetchPRDetails(prId, prType);
    }
    
    // Hide approve/reject buttons if viewing from acknowledged or rejected tabs
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
    
    // Hide buttons if status is "Acknowledged"
    if (data.status === 'Acknowledged') {
        hideApprovalButtons();
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
            } else if (data.rejectionRemarks) {
                rejectionRemarks = data.rejectionRemarks;
            }
            
            if (rejectionRemarks) {
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
    
    // Check if there are any revisions
    const hasRevisions = data.revisions && data.revisions.length > 0;
    
    if (hasRevisions) {
        revisedRemarksSection.style.display = 'block';
        
        // Clear existing revision content from the revisedRemarksSection
        revisedRemarksSection.innerHTML = `
            <h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>
            <div class="bg-gray-50 p-4 rounded-lg border">
                <div class="mb-2">
                    <span class="text-sm font-medium text-gray-600">Total Revisions: </span>
                    <span id="revisedCount" class="text-sm font-bold text-blue-600">${data.revisions.length}</span>
                </div>
                <!-- Dynamic revision content will be inserted here by JavaScript -->
            </div>
        `;
        
        // Group revisions by stage
        const revisionsByStage = {};
        data.revisions.forEach(revision => {
            // Map enum values to display names
            let stageName = 'Unknown';
            if (revision.stage === 'Checked' || revision.stage === 1) {
                stageName = 'Checked';
            } else if (revision.stage === 'Acknowledged' || revision.stage === 2) {
                stageName = 'Acknowledged';
            } else if (revision.stage === 'Approved' || revision.stage === 3) {
                stageName = 'Approved';
            } else if (revision.stage === 'Received' || revision.stage === 4) {
                stageName = 'Received';
            }
            
            if (!revisionsByStage[stageName]) {
                revisionsByStage[stageName] = [];
            }
            revisionsByStage[stageName].push(revision);
        });
        
        // Display revisions grouped by stage
        Object.keys(revisionsByStage).forEach(stage => {
            const stageRevisions = revisionsByStage[stage];
            
            // Create stage header
            const stageHeader = document.createElement('div');
            stageHeader.className = 'mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded';
            stageHeader.innerHTML = `
                <h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${stageRevisions.length})</h4>
            `;
            revisedRemarksSection.appendChild(stageHeader);
            
            // Display each revision in this stage
            stageRevisions.forEach((revision, index) => {
                const revisionContainer = document.createElement('div');
                revisionContainer.className = 'mb-3 ml-4';
                revisionContainer.innerHTML = `
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <label class="text-sm font-medium text-gray-700">Revision ${index + 1}:</label>
                            <div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${revision.remarks || ''}</div>
                            <div class="text-xs text-gray-500 mt-1">
                                Date: ${revision.revisionDate ? new Date(revision.revisionDate).toLocaleDateString() : 'N/A'}
                                ${revision.revisedByName ? ` | By: ${revision.revisedByName}` : ''}
                            </div>
                        </div>
                    </div>
                `;
                revisedRemarksSection.appendChild(revisionContainer);
            });
        });
    } else {
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
    
    if (items && items.length > 0) {
        items.forEach((item, index) => {
            addItemRow(item);
        });
    } else {
        // Add an empty row if no items
        addItemRow();
    }
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
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="200" disabled title="${item?.description || ''}" style="height: 40px;">${item?.description || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-detail text-center overflow-x-auto whitespace-nowrap bg-gray-100" maxlength="100" readonly style="resize: none; height: 40px;">${item?.detail || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-purpose text-center overflow-x-auto whitespace-nowrap bg-gray-100" maxlength="100" readonly style="resize: none; height: 40px;">${item?.purpose || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-quantity overflow-x-auto whitespace-nowrap bg-gray-100" maxlength="10" readonly style="resize: none; height: 40px; text-align: center;">${item?.quantity || ''}</textarea>
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

// Update the approvePR, rejectPR, and revisionPR functions
function approvePR() {
    Swal.fire({
        title: 'Acknowledge Purchase Request',
        text: 'Are you sure you want to acknowledge this purchase request?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, acknowledge it',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updatePRStatus('approve');
        }
    });
}

function rejectPR() {
    // Create custom dialog with single field
    Swal.fire({
        title: 'Reject Purchase Request',
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
            // Initialize the field with user prefix
            const firstField = document.getElementById('rejectionField1');
            if (firstField) {
                initializeWithRejectionPrefix(firstField);
            }
            
            // Add event listener for input protection
            const field = document.querySelector('#rejectionFieldsContainer textarea');
            if (field) {
                field.addEventListener('input', handleRejectionInput);
            }
        },
        preConfirm: () => {
            // Get the rejection remark
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
            updatePRStatusWithRemarks('reject', result.value);
        }
    });
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
        // Restore the prefix
        const userInfo = getUserInfo();
        const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
        
        // Only restore if the prefix is damaged
        if (!textarea.value.startsWith(prefix)) {
            const userText = textarea.value.substring(prefixLength);
            textarea.value = prefix + userText;
            
            // Reset cursor position after the prefix
            textarea.setSelectionRange(prefixLength, prefixLength);
        } else {
            // Just move cursor after prefix
            textarea.setSelectionRange(prefixLength, prefixLength);
        }
    }
}

function revisionPR() {
    // Get all revision fields
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    if (!revisionFields.length) {
        Swal.fire({
            icon: 'error',
            title: 'No Revision Details',
            text: 'Please add revision details before submitting'
        });
        return;
    }
    
    // Collect all revision remarks
    let revisionRemarks = '';
    revisionFields.forEach(field => {
        revisionRemarks += field.value.trim() + '\n\n';
    });
    
    // Confirm with user
    Swal.fire({
        title: 'Request Revision',
        text: 'Are you sure you want to request revision for this purchase request?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, request revision',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updatePRStatusWithRemarks('revise', revisionRemarks.trim());
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

    // Set processing flag to prevent double-clicks
    isProcessing = true;

    const userId = getUserId();
    if (!userId) {
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'Unable to get user ID from token. Please login again.'
        });
        isProcessing = false;
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
            isProcessing = false; // Reset flag on error
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to ${status} PR. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        isProcessing = false; // Reset flag on error
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

    // Set processing flag to prevent double-clicks
    isProcessing = true;

    const userId = getUserId();
    if (!userId) {
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'Unable to get user ID from token. Please login again.'
        });
        isProcessing = false;
        return;
    }

    console.log('updatePRStatusWithRemarks called with:', status, remarks);
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
            isProcessing = false; // Reset flag on error
            return response.json().then(errorData => {
                throw new Error(errorData.message || `Failed to ${status} PR. Status: ${response.status}`);
            });
        }
    })
    .catch(error => {
        isProcessing = false; // Reset flag on error
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

// Function to validate quantity input (only numbers allowed)
function validateQuantity(textarea) {
    // Remove any non-numeric characters except decimal point
    let value = textarea.value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Update the textarea value
    textarea.value = value;
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
    // Make all input fields read-only with gray background
    const inputFields = document.querySelectorAll('input[type="text"]:not([id$="Search"]), input[type="date"], input[type="number"], textarea');
    inputFields.forEach(field => {
        field.readOnly = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
        field.classList.remove('bg-white');
    });
    
    // Make search inputs read-only with gray background
    const searchInputs = document.querySelectorAll('input[id$="Search"]');
    searchInputs.forEach(field => {
        field.readOnly = true;
        field.classList.add('bg-gray-100');
        field.classList.remove('bg-gray-50', 'bg-white');
        // Remove the onkeyup event to prevent search triggering
        field.removeAttribute('onkeyup');
    });
    
    // Disable all select fields with gray background
    const selectFields = document.querySelectorAll('select');
    selectFields.forEach(field => {
        field.disabled = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
        field.classList.remove('bg-white');
    });
    
    // Disable all checkboxes
    const checkboxFields = document.querySelectorAll('input[type="checkbox"]');
    checkboxFields.forEach(field => {
        field.disabled = true;
        field.classList.add('cursor-not-allowed');
    });
    
    // Handle table inputs and textareas - make them all gray
    const tableInputs = document.querySelectorAll('#tableBody input, #tableBody textarea');
    tableInputs.forEach(input => {
        input.readOnly = true;
        input.classList.add('bg-gray-100');
        input.classList.remove('bg-white');
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
        fileInput.classList.remove('bg-white');
    }
}

// Function to hide approval buttons
function hideApprovalButtons() {
    const approveButton = document.querySelector('button[onclick="approvePR()"]');
    const rejectButton = document.querySelector('button[onclick="rejectPR()"]');
    const addRevisionBtn = document.getElementById('addRevisionBtn');
    const revisionButton = document.getElementById('revisionButton');
    
    if (approveButton) {
        approveButton.style.display = 'none';
    }
    if (rejectButton) {
        rejectButton.style.display = 'none';
    }
    if (addRevisionBtn) {
        addRevisionBtn.style.display = 'none';
    }
    if (revisionButton) {
        revisionButton.style.display = 'none';
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize revision functionality
    const revisionContainer = document.getElementById('revisionContainer');
    if (revisionContainer) {
        // Use event delegation to handle input events on all textareas
        revisionContainer.addEventListener('input', function(event) {
            if (event.target.tagName === 'TEXTAREA') {
                checkRevisionButton();
            }
        });
        
        // Initialize button states
        checkRevisionButton();
        updateAddButtonState();
    }
});

