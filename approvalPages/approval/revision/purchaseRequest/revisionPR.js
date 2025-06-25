let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep

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
    
    // Setup button visibility based on tab
    setupButtonVisibility();
};

// Function to setup button visibility based on tab parameter
function setupButtonVisibility() {
    const submitButtonContainer = document.getElementById('submitButtonContainer');
    
    if (currentTab === 'revision') {
        // Show only submit button for revision tab
        // Button visibility will be controlled by status in fetchPRDetails
    } else if (currentTab === 'prepared') {
        // Hide submit button for prepared tab
        if (submitButtonContainer) {
            submitButtonContainer.style.display = 'none';
        }
    }
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
                
                // Check if fields should be editable
                const isEditable = response.data.status === 'Revision';
                toggleEditableFields(isEditable);
                
                // Setup submit button for revision status
                if (response.data.status === 'Revision') {
                    document.getElementById('submitButtonContainer').style.display = 'block';
                }
            }
        })
        .catch(error => {
            // console.error('Error:', error);
            // alert('Error fetching PR details: ' + error.message);
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
        document.getElementById('remarks').value = data.remarks || '';
    }

    // Set status
    if (data && data.status) {
        console.log('Status:', data.status);
        var option = document.createElement('option');
        option.value = data.status;
        option.textContent = data.status;
        document.getElementById('status').appendChild(option);
        document.getElementById('status').value = data.status;
    }
    
    // Store and display attachments
    if (data.attachments) {
        existingAttachments = data.attachments;
        attachmentsToKeep = data.attachments.map(att => att.id); // Initially keep all existing attachments
        displayAttachments(data.attachments);
    }
    
    // Store the values to be used after fetching options
    window.currentValues = {
        department: data.departmentName,
        classification: data.classification,
        status: data.status,
        requesterId: data.requesterId,
        departmentId: data.departmentId
    };
    
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
    
    // Make fields read-only if not editable
    if (data.status !== 'Revision') {
        makeAllFieldsReadOnly();
    }
}

// Function to display revised remarks from API
function displayRevisedRemarks(data) {
    const revisedRemarksSection = document.getElementById('revisedRemarksSection');
    const revisedCountElement = document.getElementById('revisedCount');
    
    // Check if there are any revision remarks
    const hasRevisions = data.revisedCount && parseInt(data.revisedCount) > 0;
    
    if (hasRevisions) {
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
    } else {
        revisedRemarksSection.style.display = 'none';
    }
}

// Function to submit PR (similar to detailPR.js)
function submitPR() {
    if (!prId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'PR ID not found'
        });
        return;
    }

    // Show confirmation dialog
    Swal.fire({
        title: 'Submit PR',
        text: 'Are you sure you want to submit this revised PR?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, submit it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updatePR(true);
        }
    });
}

// Function to update PR (similar to detailPR.js)
async function updatePR(isSubmit = false) {
    try {
        // Create FormData object for the update
        const formData = new FormData();
        
        // Add basic fields
        formData.append('Id', prId);
        formData.append('PurchaseRequestNo', document.getElementById('purchaseRequestNo').value);
        
        const userId = getUserId();
        if (!userId) {
            Swal.fire({
                title: 'Authentication Error!',
                text: 'Unable to get user ID from token. Please login again.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        // Show loading state
        const actionText = isSubmit ? 'Submit' : 'Update';
        Swal.fire({
            title: `${actionText.slice(0, -1)}ing...`,
            text: `Please wait while we ${isSubmit ? 'submit' : 'update'} the PR.`,
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        formData.append('RequesterId', window.currentValues?.requesterId || userId);
        formData.append('IsSubmit', isSubmit.toString());
        
        // Use the department ID from stored values
        if (window.currentValues?.departmentId) {
            formData.append('DepartmentId', window.currentValues.departmentId);
        }
        
        // Format dates
        const requiredDate = document.getElementById('requiredDate').value;
        if (requiredDate) {
            formData.append('RequiredDate', new Date(requiredDate).toISOString());
        }
        
        const submissionDate = document.getElementById('submissionDate').value;
        if (submissionDate) {
            formData.append('SubmissionDate', submissionDate);
        }
        
        // Use the classification from stored values
        if (window.currentValues?.classification) {
            formData.append('Classification', window.currentValues.classification);
        }
        
        formData.append('Remarks', document.getElementById('remarks').value);
        
        // Approvals
        formData.append('PreparedById', document.getElementById('preparedBy')?.value);
        formData.append('CheckedById', document.getElementById('checkedBy')?.value);
        formData.append('AcknowledgedById', document.getElementById('acknowledgedBy')?.value);
        formData.append('ApprovedById', document.getElementById('approvedBy')?.value);
        formData.append('ReceivedById', document.getElementById('receivedBy')?.value);
        
        // Item details
        const rows = document.querySelectorAll('#tableBody tr');
        
        rows.forEach((row, index) => {
            formData.append(`ItemDetails[${index}].ItemNo`, row.querySelector('.item-no').value);
            formData.append(`ItemDetails[${index}].Description`, row.querySelector('.item-description').value);
            formData.append(`ItemDetails[${index}].Detail`, row.querySelector('.item-detail').value);
            formData.append(`ItemDetails[${index}].Purpose`, row.querySelector('.item-purpose').value);
            formData.append(`ItemDetails[${index}].Quantity`, row.querySelector('.item-quantity').value);
            formData.append(`ItemDetails[${index}].UOM`, row.querySelector('.item-uom').value);
        });
        
        // Handle attachments according to backend logic
        // Add existing attachments to keep (with their IDs)
        attachmentsToKeep.forEach((attachmentId, index) => {
            const existingAttachment = existingAttachments.find(att => att.id === attachmentId);
            if (existingAttachment) {
                formData.append(`Attachments[${index}].Id`, attachmentId);
                formData.append(`Attachments[${index}].FileName`, existingAttachment.fileName || '');
            }
        });
        
        // Add new file uploads (with empty GUIDs)
        uploadedFiles.forEach((file, index) => {
            const attachmentIndex = attachmentsToKeep.length + index;
            formData.append(`Attachments[${attachmentIndex}].Id`, '00000000-0000-0000-0000-000000000000');
            formData.append(`Attachments[${attachmentIndex}].File`, file);
        });
        
        // Submit the form data
        const endpoint = prType.toLowerCase() === 'service' ? 'service' : 'item';
        fetch(`${BASE_URL}/api/pr/${endpoint}/${prId}`, {
            method: 'PUT',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                Swal.fire({
                    title: 'Success!',
                    text: `PR has been ${isSubmit ? 'submitted' : 'updated'} successfully.`,
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    // Navigate back to the revision dashboard
                    // window.location.href = '../../../dashboard/dashboardRevision/purchaseRequest/menuPRRevision.html';
                });
            } else {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `Failed to ${isSubmit ? 'submit' : 'update'} PR. Status: ${response.status}`);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error!',
                text: `Error ${isSubmit ? 'submitting' : 'updating'} PR: ` + error.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Error preparing update data: ' + error.message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to toggle editable fields based on PR status (similar to detailPR.js)
function toggleEditableFields(isEditable) {
    // List all input fields that should be controlled by editable state
    const editableFields = [
        'requesterName',
        'classification',
        'submissionDate',
        'requiredDate',
        'remarks'
    ];
    
    // Fields that should always be disabled/readonly (autofilled)
    const alwaysDisabledFields = [
        'purchaseRequestNo',
        'status'
    ];
    
    // Toggle editable fields
    editableFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            if ((field.tagName === 'INPUT' && field.type !== 'checkbox' && field.type !== 'radio') || field.tagName === 'TEXTAREA') {
                field.readOnly = !isEditable;
            } else {
                field.disabled = !isEditable;
            }
            
            // Visual indication for non-editable fields
            if (!isEditable) {
                field.classList.add('bg-gray-100', 'cursor-not-allowed');
            } else {
                field.classList.remove('bg-gray-100', 'cursor-not-allowed');
                field.classList.add('bg-white');
            }
        }
    });
    
    // Always keep autofilled fields disabled and gray
    alwaysDisabledFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            if ((field.tagName === 'INPUT' && field.type !== 'checkbox' && field.type !== 'radio') || field.tagName === 'TEXTAREA') {
                field.readOnly = true;
            } else {
                field.disabled = true;
            }
            field.classList.add('bg-gray-100', 'cursor-not-allowed');
        }
    });
    
    // Handle table inputs - only for editable fields in table
    const tableInputs = document.querySelectorAll('#tableBody input:not(.item-description), #tableBody select.item-no');
    tableInputs.forEach(input => {
        if (input.tagName === 'SELECT' || input.type === 'checkbox' || input.type === 'radio') {
            input.disabled = !isEditable;
        } else {
            input.readOnly = !isEditable;
        }
        
        if (!isEditable) {
            input.classList.add('bg-gray-100', 'cursor-not-allowed');
        } else {
            input.classList.remove('bg-gray-100', 'cursor-not-allowed');
        }
    });
    
    // Handle item description and UOM fields - always disabled but follow the item selection logic
    const itemDescriptions = document.querySelectorAll('.item-description');
    itemDescriptions.forEach(input => {
        input.disabled = true; // Always disabled
        input.classList.add('bg-gray-100'); // Always gray
    });
    
    const itemUoms = document.querySelectorAll('.item-uom');
    itemUoms.forEach(input => {
        input.disabled = true; // Always disabled
        input.classList.add('bg-gray-100'); // Always gray
    });
    
    // Disable file upload input when not editable
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.disabled = !isEditable;
        if (!isEditable) {
            fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        } else {
            fileInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
        }
    }
    
    // Update attachments display to show/hide remove buttons based on editable state
    updateAttachmentsDisplay();
    
    // Handle approval search fields - make them editable if status is Revision
    const approvalSearchFields = [
        'preparedBySearch', 'checkedBySearch', 'acknowledgedBySearch', 
        'approvedBySearch', 'receivedBySearch'
    ];
    
    approvalSearchFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.readOnly = !isEditable;
            if (!isEditable) {
                field.classList.add('bg-gray-50');
                // Remove the onkeyup event to prevent search triggering
                field.removeAttribute('onkeyup');
            } else {
                field.classList.remove('bg-gray-50');
                // Re-enable search functionality
                const fieldName = fieldId.replace('Search', '');
                field.setAttribute('onkeyup', `filterUsers('${fieldName}')`);
            }
        }
    });
}

// Function to handle file upload (similar to detailPR.js)
function previewPDF(event) {
    const files = event.target.files;
    const totalExistingFiles = attachmentsToKeep.length + uploadedFiles.length;
    
    if (files.length + totalExistingFiles > 5) {
        Swal.fire({
            title: 'File Limit Exceeded!',
            text: 'Maximum 5 PDF files are allowed.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        event.target.value = '';
        return;
    }
    
    Array.from(files).forEach(file => {
        if (file.type === 'application/pdf') {
            uploadedFiles.push(file);
        } else {
            Swal.fire({
                title: 'Invalid File Type!',
                text: 'Please upload a valid PDF file',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
        }
    });

    updateAttachmentsDisplay();
}

// Function to update the attachments display
function updateAttachmentsDisplay() {
    const attachmentsList = document.getElementById('attachmentsList');
    if (!attachmentsList) return;
    
    attachmentsList.innerHTML = '';
    
    // Check if editing is allowed
    const isEditable = window.currentValues && window.currentValues.status === 'Revision';
    
    // Display existing attachments that are marked to keep
    const existingToKeep = existingAttachments.filter(att => attachmentsToKeep.includes(att.id));
    existingToKeep.forEach(attachment => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex items-center justify-between p-2 bg-white border rounded mb-2 hover:bg-gray-50';
        attachmentItem.innerHTML = `
            <div class="flex items-center">
                <span class="text-blue-600 mr-2">📄</span>
                <span class="text-sm font-medium">${attachment.fileName}</span>
                <span class="text-xs text-gray-500 ml-2">(existing)</span>
            </div>
            <div class="flex items-center gap-2">
                <a href="${attachment.fileUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm font-semibold px-3 py-1 border border-blue-500 rounded hover:bg-blue-50 transition">
                    View
                </a>
                ${isEditable ? 
                `<button onclick="removeExistingAttachment('${attachment.id}')" class="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1 border border-red-500 rounded hover:bg-red-50 transition">
                    Remove
                </button>` : ''}
            </div>
        `;
        attachmentsList.appendChild(attachmentItem);
    });
    
    // Display new uploaded files
    uploadedFiles.forEach((file, index) => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded mb-2';
        attachmentItem.innerHTML = `
            <div class="flex items-center">
                <span class="text-green-600 mr-2">📄</span>
                <span class="text-sm font-medium">${file.name}</span>
                <span class="text-xs text-green-600 ml-2">(new)</span>
            </div>
            <div class="flex items-center gap-2">
                ${isEditable ? 
                `<button onclick="removeUploadedFile(${index})" class="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1 border border-red-500 rounded hover:bg-red-50 transition">
                    Remove
                </button>` : ''}
            </div>
        `;
        attachmentsList.appendChild(attachmentItem);
    });
    
    // Show message if no attachments
    if (existingToKeep.length === 0 && uploadedFiles.length === 0) {
        attachmentsList.innerHTML = '<p class="text-gray-500 text-sm text-center py-2">No attachments</p>';
    }
}

// Function to remove a new uploaded file
function removeUploadedFile(index) {
    uploadedFiles.splice(index, 1);
    updateAttachmentsDisplay();
}

// Function to remove an existing attachment
function removeExistingAttachment(attachmentId) {
    const index = attachmentsToKeep.indexOf(attachmentId);
    if (index > -1) {
        attachmentsToKeep.splice(index, 1);
        updateAttachmentsDisplay();
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
        addRow(); // Add empty row if no items
        return;
    }
    
    items.forEach((item, index) => {
        try {
            addItemRow(item);
        } catch (error) {
        }
    });
}

function addItemRow(item = null) {
    const tableBody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="p-2 border bg-gray-100">
            <select class="w-full p-2 border rounded item-no" onchange="updateItemDescription(this)">
                <option value="" disabled ${!item ? 'selected' : ''}>Select Item</option>
            </select>
        </td>
        <td class="p-2 border bg-gray-100">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto whitespace-pre-wrap break-words" rows="3" maxlength="200" disabled title="${item?.description || ''}" style="word-wrap: break-word; white-space: pre-wrap;">${item?.description || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <input type="text" value="${item?.detail || ''}" class="w-full h-full item-detail text-center" maxlength="100" required />
        </td>
        <td class="p-2 border h-12">
            <input type="text" value="${item?.purpose || ''}" class="w-full h-full item-purpose text-center" maxlength="100" required />
        </td>
        <td class="p-2 border h-12">
            <input type="number" value="${item?.quantity || ''}" class="w-full h-full item-quantity text-center" min="1" required />
        </td>
        <td class="p-2 border bg-gray-100">
            <input type="text" value="${item?.uom || ''}" class="w-full item-uom bg-gray-100" disabled />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;
    
    tableBody.appendChild(row);
    
    // Store the item data to be used after fetching options
    if (item) {
        const selectElement = row.querySelector('.item-no');
        selectElement.setAttribute('data-selected-item-code', item.itemNo); // itemNo is actually the itemCode
    }
    
    fetchItemOptions();
}

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");
    
    newRow.innerHTML = `
        <td class="p-2 border bg-gray-100">
            <select class="w-full p-2 border rounded item-no" onchange="updateItemDescription(this)">
                <option value="" disabled selected>Select Item</option>
            </select>
        </td>
        <td class="p-2 border bg-gray-100">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto whitespace-pre-wrap break-words" rows="3" maxlength="200" disabled style="word-wrap: break-word; white-space: pre-wrap;"></textarea>
        </td>
        <td class="p-2 border h-12">
            <input type="text" class="w-full h-full item-detail text-center" maxlength="100" required />
        </td>
        <td class="p-2 border h-12">
            <input type="text" class="w-full h-full item-purpose text-center" maxlength="100" required />
        </td>
        <td class="p-2 border h-12">
            <input type="number" class="w-full h-full item-quantity text-center" min="1" required />
        </td>
        <td class="p-2 border bg-gray-100">
            <input type="text" class="w-full item-uom bg-gray-100" disabled />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
    
    // Populate the new item select with items (no pre-selection)
    const newItemSelect = newRow.querySelector('.item-no');
    fetchItemOptionsForSelect(newItemSelect);
}

// Function to fetch all dropdown options
function fetchDropdownOptions(prData = null) {
    fetchDepartments();
    fetchUsers(prData);
    fetchClassifications();
    fetchItemOptions();
}

// Function to fetch items for a specific select element (no pre-selection)
function fetchItemOptionsForSelect(selectElement) {
    fetch(`${BASE_URL}/api/items`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            populateItemSelectClean(data.data, selectElement);
        })
        .catch(error => {
            console.error('Error fetching items:', error);
        });
}

// Function to populate item select without any pre-selection (for new rows)
function populateItemSelectClean(items, selectElement) {
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="" disabled selected>Select Item</option>';

    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item.itemCode; // Use itemCode instead of id
        option.textContent = `${item.itemCode || item.itemNo} - ${item.itemName || item.name}`;
        // Store the description and UOM as data attributes - handle both possible field names
        option.setAttribute('data-item-code', item.itemCode || item.itemNo);
        option.setAttribute('data-description', item.description || item.name || item.itemName || '');
        option.setAttribute('data-uom', item.uom || item.unitOfMeasure || '');
        selectElement.appendChild(option);
    });

    // Add onchange event listener to auto-fill description and UOM
    selectElement.onchange = function() {
        updateItemDescription(this);
    };
}

// Function to fetch departments from API
function fetchDepartments() {
    fetch(`${BASE_URL}/api/department`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            populateDepartmentSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching departments:', error);
        });
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
            populateUserSelects(data.data, prData);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
}

// Function to fetch classifications from API
function fetchClassifications() {
    fetch(`${BASE_URL}/api/classifications`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            populateClassificationSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching classifications:', error);
        });
}

function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("department");
    if (!departmentSelect) return;
    
    departmentSelect.innerHTML = '<option value="" disabled>Select Department</option>';

    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.id;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
    });
}

function populateClassificationSelect(classifications) {
    const classificationSelect = document.getElementById("classification");
    if (!classificationSelect) return;
    
    classificationSelect.innerHTML = '<option value="" disabled>Select Classification</option>';

    classifications.forEach(classification => {
        const option = document.createElement("option");
        option.value = classification.id;
        option.textContent = classification.name;
        classificationSelect.appendChild(option);
    });
}

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
                case 'preparedBy': selectId = 'preparedBy'; break;
                case 'acknowledgedBy': selectId = 'acknowledgedBy'; break;
                case 'checkedBy': selectId = 'checkedBy'; break;
                case 'approvedBy': selectId = 'approvedBy'; break;
                case 'receivedBy': selectId = 'receivedBy'; break;
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

// Modified populateUserSelects to store users globally and update search inputs
function populateUserSelects(users, prData = null) {
    // Store users globally for search functionality
    window.allUsers = users;
    
    const selects = [
        { id: 'preparedBy', approvalKey: 'preparedById', searchId: 'preparedBySearch' },
        { id: 'checkedBy', approvalKey: 'checkedById', searchId: 'checkedBySearch' },
        { id: 'acknowledgedBy', approvalKey: 'acknowledgedById', searchId: 'acknowledgedBySearch' },
        { id: 'approvedBy', approvalKey: 'approvedById', searchId: 'approvedBySearch' },
        { id: 'receivedBy', approvalKey: 'receivedById', searchId: 'receivedBySearch' }
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
}

function deleteRow(button) {
    button.closest("tr").remove();
}

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
    if (buttonContainer && currentTab !== 'approved') {
        buttonContainer.style.display = 'none';
    }
}

function fetchItemOptions() {
    fetch(`${BASE_URL}/api/items`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Item data:", data);
            // Populate all item selects in the document
            document.querySelectorAll('.item-no').forEach(select => {
                populateItemSelect(data.data, select);
            });
        })
        .catch(error => {
            console.error('Error fetching items:', error);
        });
}

// Function to populate item select
function populateItemSelect(items, selectElement) {
    if (!selectElement) return;
    
    // Check if this select has a pre-selected item code
    const selectedItemCode = selectElement.getAttribute('data-selected-item-code');
    
    selectElement.innerHTML = '<option value="" disabled>Select Item</option>';

    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item.itemCode; // Use itemCode instead of id
        option.textContent = `${item.itemCode || item.itemNo} - ${item.itemName || item.name}`;
        // Store the description and UOM as data attributes - handle both possible field names
        option.setAttribute('data-item-code', item.itemCode || item.itemNo);
        option.setAttribute('data-description', item.description || item.name || item.itemName || '');
        option.setAttribute('data-uom', item.uom || item.unitOfMeasure || '');
        selectElement.appendChild(option);
        
        // If this item matches the selected item code, select it
        if (selectedItemCode && item.itemCode === selectedItemCode) {
            option.selected = true;
            // Trigger the update after setting as selected
            setTimeout(() => {
                updateItemDescription(selectElement);
            }, 0);
        }
    });

    // Add onchange event listener to auto-fill description and UOM
    selectElement.onchange = function() {
        updateItemDescription(this);
    };
}

function updateItemDescription(selectElement) {
    const row = selectElement.closest('tr');
    const descriptionInput = row.querySelector('.item-description');
    const uomInput = row.querySelector('.item-uom');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    
    // Check if a valid item is selected (not the placeholder option)
    if (selectedOption && !selectedOption.disabled && selectedOption.value && selectedOption.value !== "") {
        // Get the item code and set it as the text content
        const itemCode = selectedOption.getAttribute('data-item-code');
        selectedOption.textContent = itemCode || '';
        
        // Get description and UOM from data attributes and fill them automatically
        const itemDescription = selectedOption.getAttribute('data-description');
        const itemUom = selectedOption.getAttribute('data-uom');
        
        descriptionInput.value = itemDescription || '';
        descriptionInput.textContent = itemDescription || ''; // For textarea
        descriptionInput.title = itemDescription || ''; // For tooltip
        
        uomInput.value = itemUom || '';
        uomInput.title = itemUom || ''; // For tooltip
        
        // Keep the fields disabled and gray (not editable by user)
        descriptionInput.disabled = true;
        descriptionInput.classList.add('bg-gray-100');
        uomInput.disabled = true;
        uomInput.classList.add('bg-gray-100');
    } else {
        // No valid item selected, clear the fields
        descriptionInput.value = '';
        descriptionInput.textContent = '';
        descriptionInput.title = '';
        uomInput.value = '';
        uomInput.title = '';
        
        // Keep the fields disabled and gray
        descriptionInput.disabled = true;
        descriptionInput.classList.add('bg-gray-100');
        uomInput.disabled = true;
        uomInput.classList.add('bg-gray-100');
    }
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