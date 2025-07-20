let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep
let fileObjectUrls = new Map(); // Track object URLs for uploaded files

let prId; // Declare global variable
let prType; // Declare global variable
let currentTab; // Declare global variable for tab
let allItems = []; // Store items globally for search functionality

// Helper function to format date as YYYY-MM-DD without timezone issues
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Function to setup date fields with validation and defaults
function setupDateFields() {
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    
    const submissionDateInput = document.getElementById("submissionDate");
    const requiredDateInput = document.getElementById("requiredDate");
    
    if (submissionDateInput && requiredDateInput) {
        // Set minimum date for submission date to today
        submissionDateInput.min = formattedDate;
        
        // Function to update required date minimum based on submission date
        const updateRequiredDateMin = function() {
            const submissionValue = submissionDateInput.value;
            if (submissionValue) {
                const selectedDate = new Date(submissionValue + 'T00:00:00'); // Add time to avoid timezone issues
                const minRequiredDate = new Date(selectedDate);
                minRequiredDate.setDate(selectedDate.getDate() + 14); // 2 weeks = 14 days
                
                const minRequiredFormatted = formatDateForInput(minRequiredDate);
                requiredDateInput.min = minRequiredFormatted;
                
                // If current required date is less than minimum, update it
                if (requiredDateInput.value) {
                    const currentRequiredDate = new Date(requiredDateInput.value + 'T00:00:00');
                    if (currentRequiredDate < minRequiredDate) {
                        requiredDateInput.value = minRequiredFormatted;
                    }
                } else {
                    // If no required date is set, set it to minimum (2 weeks from submission)
                    requiredDateInput.value = minRequiredFormatted;
                }
            }
        };
        
        // Add event listener to automatically update required date when submission date changes
        if (submissionDateInput) {
            submissionDateInput.addEventListener('change', updateRequiredDateMin);
        }
        
        // Store the update function globally so it can be called after data is populated
        window.updateRequiredDateMin = updateRequiredDateMin;
    }
}

// Function to set default dates (called after checking if fields are empty)
function setDefaultDatesIfEmpty() {
    const submissionDateInput = document.getElementById("submissionDate");
    const requiredDateInput = document.getElementById("requiredDate");
    
    // Only set defaults if the PR is in Revision status and fields are empty
    const status = window.currentValues?.status || document.getElementById('status')?.value;
    if (status === 'Revision') {
        const today = new Date();
        const formattedDate = formatDateForInput(today);
        
        // Set default submission date to today if empty
        if (!submissionDateInput.value) {
            submissionDateInput.value = formattedDate;
        }
        
        // Set default required date to 2 weeks (14 days) from submission date if empty
        if (!requiredDateInput.value) {
            const submissionDate = submissionDateInput.value ? new Date(submissionDateInput.value + 'T00:00:00') : today;
            const twoWeeksFromSubmission = new Date(submissionDate);
            twoWeeksFromSubmission.setDate(submissionDate.getDate() + 14); // 2 weeks = 14 days
            const requiredDateFormatted = formatDateForInput(twoWeeksFromSubmission);
            
            requiredDateInput.value = requiredDateFormatted;
        }
    }
}

// Function to fetch PR details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    prId = urlParams.get('pr-id');
    prType = urlParams.get('pr-type');
    currentTab = urlParams.get('tab'); // Get the tab parameter
    
    // Set up date validation and defaults
    setupDateFields();
    
    if (prId && prType) {
        fetchPRDetails(prId, prType);
    }
    
    // Setup button visibility based on tab
    setupButtonVisibility();
    
    // Ensure all description and UOM fields are initially empty and properly styled
    document.querySelectorAll('.item-description').forEach(input => {
        input.value = '';
        input.disabled = true;
        input.classList.add('bg-gray-100');
    });
    
    document.querySelectorAll('.item-uom').forEach(input => {
        input.value = '';
        input.disabled = true;
        input.classList.add('bg-gray-100');
    });
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

async function fetchPRDetails(prId, prType) {
    try {
        const endpoint = prType.toLowerCase() === 'service' ? 'service' : 'item';
        const response = await makeAuthenticatedRequest(`/api/pr/${endpoint}/${prId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        const responseData = await response.json();
        if (responseData.data) {
            console.log(responseData.data);
            populatePRDetails(responseData.data);
            
            // Always fetch dropdown options
            fetchDropdownOptions(responseData.data);
            
            // Check if fields should be editable
            const isEditable = responseData.data.status === 'Revision';
            toggleEditableFields(isEditable);
            
            // Setup submit button for revision status
            if (responseData.data.status === 'Revision') {
                document.getElementById('submitButtonContainer').style.display = 'block';
            }
        }
    } catch (error) {
        // console.error('Error:', error);
        // alert('Error fetching PR details: ' + error.message);
    }
}

function populatePRDetails(data) {
    // Populate basic PR information
    document.getElementById('purchaseRequestNo').value = data.purchaseRequestNo;
    
    // Handle requester name with search functionality (editable in revision)
    if (data.requesterName) {
        console.log("Setting requesterSearch to:", data.requesterName);
        const requesterSearchInput = document.getElementById('requesterSearch');
        if (requesterSearchInput) {
            requesterSearchInput.value = data.requesterName;
        }
        // Store the requester ID if available
        if (data.requesterId) {
            console.log("Setting RequesterId to:", data.requesterId);
            const requesterIdInput = document.getElementById('RequesterId');
            if (requesterIdInput) {
                requesterIdInput.value = data.requesterId;
            }
            console.log("RequesterId:", requesterIdInput.value);
        } else {
            console.log("No requesterId found in data. Available fields:", Object.keys(data));
        }
    } else {
        console.log("No requesterName found in data");
    }
  
    // Format and set dates - extract date part directly to avoid timezone issues
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

    // Set classification - add a temporary option with name as value
    const classificationSelect = document.getElementById('classification');
    if (data.classification && classificationSelect) {
        console.log('Setting classification to:', data.classification);
        // Create a temporary option that will be replaced when API data loads
        const tempOption = document.createElement('option');
        tempOption.value = data.classification; // Use name as value (e.g., "Material")
        tempOption.textContent = data.classification; // Use name as text
        tempOption.selected = true;
        classificationSelect.innerHTML = '';
        classificationSelect.appendChild(tempOption);
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
    
    // Set default dates if fields are empty (only for Revision status)
    setDefaultDatesIfEmpty();
    
    // Apply date validation after data is populated
    if (window.updateRequiredDateMin) {
        window.updateRequiredDateMin();
    }
    
    // Make fields read-only if not editable
    if (data.status !== 'Revision') {
        makeAllFieldsReadOnly();
    }
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
                    <span id="revisedCount" class="text-sm font-bold text-blue-600">0</span>
                </div>
                <!-- Dynamic revision content will be inserted here by JavaScript -->
            </div>
        `;
        
        const revisedCountElement = document.getElementById('revisedCount');
        revisedCountElement.textContent = data.revisions.length || '0';
        
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
        const actionText = isSubmit ? 'Submitting' : 'Updating';
        Swal.fire({
            title: `${actionText}...`,
            text: `Please wait while we ${isSubmit ? 'submit' : 'update'} the PR.`,
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Use the selected requester (now editable in revision mode)
        const requesterIdElement = document.getElementById("RequesterId");
        console.log("RequesterId element found:", !!requesterIdElement);
        if (requesterIdElement) {
            console.log("RequesterId element value:", requesterIdElement.value);
            console.log("All options in RequesterId select:", Array.from(requesterIdElement.options).map(opt => ({ value: opt.value, text: opt.textContent })));
        }
        
        const requesterIdValue = requesterIdElement?.value;
        if (!requesterIdValue) {
            console.log("RequesterId is empty, current value:", requesterIdValue);
            Swal.fire({
                title: 'Error!',
                text: 'Requester ID is missing. Please select a requester.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        formData.append('RequesterId', requesterIdValue);
        console.log("RequesterId:", requesterIdValue);
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
        
        // Use the classification from the select (always current value)
        const classificationSelect = document.getElementById('classification');
        const selectedClassification = classificationSelect ? classificationSelect.value : '';
        formData.append('Classification', selectedClassification);
        console.log("Classification:", selectedClassification);
        
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
            formData.append(`ItemDetails[${index}].ItemNo`, row.querySelector('.item-input').value);
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
        makeAuthenticatedRequest(`/api/pr/${endpoint}/${prId}`, {
            method: 'PUT',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                // Clean up object URLs after successful submission
                uploadedFiles.forEach(file => {
                    if (file && file instanceof File) {
                        const objectUrl = fileObjectUrls.get(file);
                        if (objectUrl) {
                            URL.revokeObjectURL(objectUrl);
                            fileObjectUrls.delete(file);
                        }
                    }
                });
                
                Swal.fire({
                    title: 'Success!',
                    text: `PR has been ${isSubmit ? 'submitted' : 'updated'} successfully.`,
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    // Navigate back to the revision dashboard
                    goToMenuRevisionPR();
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
        'requesterSearch', // Requester name search input (now editable in revision)
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
    
    // Handle requester dropdown
    const requesterDropdown = document.getElementById('requesterDropdown');
    if (requesterDropdown) {
        if (!isEditable) {
            requesterDropdown.style.display = 'none';
        }
    }
    
    // Handle table inputs - only for editable fields in table
    const tableInputs = document.querySelectorAll('#tableBody input:not(.item-description):not(.item-uom)');
    tableInputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
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
        // Block editing for preparedBySearch always
        if (fieldId === 'preparedBySearch') {
            if (field) {
                field.readOnly = true;
                field.classList.add('bg-gray-100', 'cursor-not-allowed');
                field.removeAttribute('onkeyup');
            }
        } else if (field) {
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

    // Block editing for preparedBy select always
    const preparedBySelect = document.getElementById('preparedBy');
    if (preparedBySelect) {
        preparedBySelect.disabled = true;
        preparedBySelect.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
}

// Function to handle file upload (similar to detailPR.js)
function previewPDF(event) {
    const files = event.target.files;
    
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
        
        // Create object URL for the file to enable viewing
        const fileUrl = URL.createObjectURL(file);
        fileObjectUrls.set(file, fileUrl); // Store the object URL
        
        attachmentItem.innerHTML = `
            <div class="flex items-center">
                <span class="text-green-600 mr-2">📄</span>
                <span class="text-sm font-medium">${file.name}</span>
                <span class="text-xs text-green-600 ml-2">(new)</span>
            </div>
            <div class="flex items-center gap-2">
                <a href="${fileUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm font-semibold px-3 py-1 border border-blue-500 rounded hover:bg-blue-50 transition">
                    View
                </a>
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
    // Revoke the object URL to prevent memory leaks
    const file = uploadedFiles[index];
    if (file) {
        const objectUrl = fileObjectUrls.get(file);
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            fileObjectUrls.delete(file);
        }
    }
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
    
    items.forEach(item => {
        addItemRow(item);
    });
}

function addItemRow(item = null) {
    const tableBody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="p-2 border relative">
            <input type="text" class="item-input w-full p-2 border rounded" placeholder="Search item..." value="${item?.itemNo || ''}" />
            <div class="item-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-40 overflow-y-auto"></div>
        </td>
        <td class="p-2 border bg-gray-100">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="200" disabled title="${item?.description || ''}" style="height: 40px;">${item?.description || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-detail text-center overflow-x-auto whitespace-nowrap" maxlength="100" required style="resize: none; height: 40px;">${item?.detail || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-purpose text-center overflow-x-auto whitespace-nowrap" maxlength="100" required style="resize: none; height: 40px;">${item?.purpose || ''}</textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-quantity overflow-x-auto whitespace-nowrap" maxlength="10" required style="resize: none; height: 40px; text-align: center;" oninput="validateQuantity(this)">${item?.quantity || ''}</textarea>
        </td>
        <td class="p-2 border bg-gray-100">
            <input type="text" value="${item?.uom || ''}" class="w-full item-uom bg-gray-100" disabled />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;
    
    tableBody.appendChild(row);
    
    // Setup searchable item dropdown for the new row
    setupItemDropdown(row, item?.itemNo);
}

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");
    
    newRow.innerHTML = `
        <td class="p-2 border relative">
            <input type="text" class="item-input w-full p-2 border rounded" placeholder="Search item..." />
            <div class="item-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-40 overflow-y-auto"></div>
        </td>
        <td class="p-2 border bg-gray-100">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="200" disabled style="height: 40px;"></textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-detail text-center overflow-x-auto whitespace-nowrap" maxlength="100" required style="resize: none; height: 40px;"></textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-purpose text-center overflow-x-auto whitespace-nowrap" maxlength="100" required style="resize: none; height: 40px;"></textarea>
        </td>
        <td class="p-2 border h-12">
            <textarea class="w-full item-quantity overflow-x-auto whitespace-nowrap" maxlength="10" required style="resize: none; height: 40px; text-align: center;" oninput="validateQuantity(this)"></textarea>
        </td>
        <td class="p-2 border bg-gray-100">
            <input type="text" class="w-full item-uom bg-gray-100" disabled />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
    
    // Setup searchable item dropdown for the new row
    setupItemDropdown(newRow);
}

// Function to fetch all dropdown options
function fetchDropdownOptions(prData = null) {
    fetchDepartments();
    fetchUsers(prData);
    fetchClassifications();
    fetchItemOptions();
}

// Legacy item select functions removed - now using modern searchable dropdowns

// Function to fetch departments from API
async function fetchDepartments() {
    try {
        const response = await makeAuthenticatedRequest('/api/department');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        populateDepartmentSelect(data.data);
    } catch (error) {
        console.error('Error fetching departments:', error);
    }
}

// Function to fetch users from API
async function fetchUsers(prData = null) {
    try {
        const response = await makeAuthenticatedRequest('/api/users');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        
        // Ensure data.data exists and is an array
        if (!data.data || !Array.isArray(data.data)) {
            console.error('Invalid users data received:', data);
            return;
        }
        
        populateUserSelects(data.data, prData);
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// Function to fetch classifications from API
async function fetchClassifications() {
    try {
        const response = await makeAuthenticatedRequest('/api/classifications');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        populateClassificationSelect(data.data);
    } catch (error) {
        console.error('Error fetching classifications:', error);
    }
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
    
    // Store the currently selected value and text
    const currentValue = classificationSelect.value;
    const currentText = classificationSelect.options[classificationSelect.selectedIndex]?.text;
    
    classificationSelect.innerHTML = '<option value="" disabled>Select Classification</option>';

    classifications.forEach(classification => {
        const option = document.createElement("option");
        option.value = classification.name; // Use name as value
        option.textContent = classification.name; // Use name as text
        classificationSelect.appendChild(option);
        
        // If this classification matches the current text or stored value, select it
        if (classification.name === currentText || classification.name === currentValue) {
            option.selected = true;
        }

        if (window.currentValues && window.currentValues.classification && classification.name === window.currentValues.classification) {
            option.selected = true;
        }
    });
}

// Function to filter requesters for the requester search dropdown
function filterRequesters() {
    const requesterSearchInput = document.getElementById('requesterSearch');
    const requesterDropdown = document.getElementById('requesterDropdown');
    
    if (!requesterSearchInput || !requesterDropdown) return;
    
    // Check if window.requesters is available
    if (!window.requesters || !Array.isArray(window.requesters)) {
        console.warn('window.requesters is not available for filtering');
        return;
    }
    
    const searchText = requesterSearchInput.value.toLowerCase();
    
    // Clear dropdown
    requesterDropdown.innerHTML = '';
    
    // Filter requesters based on search text
    const filteredRequesters = window.requesters ? 
        window.requesters.filter(r => r.fullName && r.fullName.toLowerCase().includes(searchText)) : 
        [];
    
    // Show filtered results
    filteredRequesters.forEach(requester => {
        const option = document.createElement('div');
        option.className = 'p-2 cursor-pointer hover:bg-gray-100';
        option.innerText = requester.fullName;
        option.onclick = function() {
            requesterSearchInput.value = requester.fullName;
            const requesterIdSelect = document.getElementById('RequesterId');
            if (requesterIdSelect) {
                requesterIdSelect.value = requester.id;
            }
            requesterDropdown.classList.add('hidden');
            console.log("Requester selected:", requester);
            
            // Update department
            const departmentSelect = document.getElementById('department');
            if (requester.department && departmentSelect) {
                // Find the department option and select it
                const departmentOptions = departmentSelect.options;
                for (let i = 0; i < departmentOptions.length; i++) {
                    if (departmentOptions[i].textContent === requester.department) {
                        console.log("Department matches current text");
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
        };
        requesterDropdown.appendChild(option);
    });
    
    // Show "no results" message if no requesters found
    if (filteredRequesters.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'No matching requesters';
        requesterDropdown.appendChild(noResults);
    }
    
    // Show dropdown
    requesterDropdown.classList.remove('hidden');
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
    
    // Check if usersList is valid
    if (!Array.isArray(usersList)) {
        console.warn('window.allUsers is not an array');
        return;
    }
    
    // Filter users based on search text
    const filteredUsers = usersList.filter(user => {
        const userName = user.fullName;
        return userName && userName.toLowerCase().includes(searchText);
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
    // Ensure users is an array
    if (!users || !Array.isArray(users)) {
        console.error('Invalid users data provided to populateUserSelects:', users);
        return;
    }
    
    // Store users globally for search functionality
    window.allUsers = users;
    
    // Store requesters globally for search functionality
    window.requesters = users.map(user => ({
        id: user.id || '',
        fullName: user.fullName || '',
        department: user.department || ''
    }));

    // Store employees globally for reference
    window.employees = users.map(user => ({
        id: user.id || '',
        kansaiEmployeeId: user.kansaiEmployeeId || '',
        fullName: user.fullName || '',
        department: user.department || ''
    }));

    // Populate RequesterId dropdown with search functionality
    const requesterSelect = document.getElementById("RequesterId");
    if (requesterSelect) {
        console.log("Before populating users, RequesterId value:", requesterSelect.value);
        
        // Store the current value or use the value from PR data
        let currentValue = requesterSelect.value;
        if (!currentValue && prData && prData.requesterId) {
            currentValue = prData.requesterId;
            console.log("Using requesterId from PR data:", currentValue);
        }
        
        // Clear existing options except the currently selected one
        requesterSelect.innerHTML = '<option value="" disabled>Select Requester</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.fullName;
            requesterSelect.appendChild(option);
        });
        
        // Restore the value that was set from PR data
        if (currentValue) {
            requesterSelect.value = currentValue;
            console.log("Restored RequesterId value to:", currentValue);
        }
        
        console.log("After populating users, RequesterId value:", requesterSelect.value);
    }

    // Setup search functionality for requester
    const requesterSearchInput = document.getElementById('requesterSearch');
    const requesterDropdown = document.getElementById('requesterDropdown');
    
    if (requesterSearchInput && requesterDropdown) {
        // Function to filter requesters
        window.filterRequesters = function() {
            const searchText = requesterSearchInput.value.toLowerCase();
            populateRequesterDropdown(searchText);
            requesterDropdown.classList.remove('hidden');
        };

        // Function to populate dropdown with filtered requesters
        function populateRequesterDropdown(filter = '') {
            requesterDropdown.innerHTML = '';
            
            // Check if window.requesters exists and is an array
            if (!window.requesters || !Array.isArray(window.requesters)) {
                console.warn('window.requesters is not available or not an array');
                return;
            }
            
            const filteredRequesters = window.requesters.filter(r => 
                r.fullName && r.fullName.toLowerCase().includes(filter)
            );
            
            filteredRequesters.forEach(requester => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerText = requester.fullName;
                option.onclick = function() {
                    requesterSearchInput.value = requester.fullName;
                    const requesterIdSelect = document.getElementById('RequesterId');
                    if (requesterIdSelect) {
                        requesterIdSelect.value = requester.id;
                    }
                    requesterDropdown.classList.add('hidden');
                    console.log("Requester selected:", requester);
                    
                    // Update department
                    const departmentSelect = document.getElementById('department');
                    if (requester.department && departmentSelect) {
                        // Find the department option and select it
                        const departmentOptions = departmentSelect.options;
                        for (let i = 0; i < departmentOptions.length; i++) {
                            if (departmentOptions[i].textContent === requester.department) {
                                console.log("Department matches current text");
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

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (requesterSearchInput && requesterDropdown && !requesterSearchInput.contains(event.target) && !requesterDropdown.contains(event.target)) {
                requesterDropdown.classList.add('hidden');
            }
        });

        // Initial population - only if requesters are available
        if (window.requesters && window.requesters.length > 0) {
            populateRequesterDropdown();
        }
    }
    
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
            if (searchInput && dropdown && !searchInput.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
    });
}

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

// Function to fetch items from API
async function fetchItemOptions() {
    try {
        const response = await makeAuthenticatedRequest('/api/items');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        console.log("Item data:", data);
        allItems = data.data; // Store items globally
        
        // Setup searchable dropdowns for all existing item inputs
        document.querySelectorAll('.item-input').forEach(input => {
            const row = input.closest('tr');
            setupItemDropdown(row);
        });
    } catch (error) {
        console.error('Error fetching items:', error);
    }
}

// Function to setup searchable item dropdown for a row
function setupItemDropdown(row, existingItemCode = null) {
    const itemInput = row.querySelector('.item-input');
    const itemDropdown = row.querySelector('.item-dropdown');
    const descriptionInput = row.querySelector('.item-description');
    const uomInput = row.querySelector('.item-uom');
    
    if (!itemInput || !itemDropdown) return;
    
    // Set existing item code if provided
    if (existingItemCode) {
        itemInput.value = existingItemCode;
        const existingItem = allItems.find(item => item.itemCode === existingItemCode);
        if (existingItem) {
            updateItemDescriptionFromData(row, existingItem);
        }
    }
    
    itemInput.addEventListener('input', function() {
        const searchText = this.value.toLowerCase();
        
        // Clear dropdown
        itemDropdown.innerHTML = '';
        
        // Filter items based on search text (search in both itemCode and itemName)
        const filteredItems = allItems.filter(item => 
            item.itemCode.toLowerCase().includes(searchText) ||
            item.itemName.toLowerCase().includes(searchText)
        );
        
        if (filteredItems.length > 0) {
            filteredItems.forEach(item => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerHTML = `<span class="font-medium">${item.itemCode}</span> - ${item.itemName}`;
                option.onclick = function() {
                    itemInput.value = item.itemCode;
                    itemInput.setAttribute('data-selected-item', JSON.stringify(item));
                    itemDropdown.classList.add('hidden');
                    
                    // Update description and UOM
                    updateItemDescriptionFromData(row, item);
                };
                itemDropdown.appendChild(option);
            });
            itemDropdown.classList.remove('hidden');
        } else {
            itemDropdown.classList.add('hidden');
        }
    });
    
    itemInput.addEventListener('focus', function() {
        if (allItems.length > 0) {
            // Show all items on focus
            itemDropdown.innerHTML = '';
            
            allItems.forEach(item => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerHTML = `<span class="font-medium">${item.itemCode}</span> - ${item.itemName}`;
                option.onclick = function() {
                    itemInput.value = item.itemCode;
                    itemInput.setAttribute('data-selected-item', JSON.stringify(item));
                    itemDropdown.classList.add('hidden');
                    
                    // Update description and UOM
                    updateItemDescriptionFromData(row, item);
                };
                itemDropdown.appendChild(option);
            });
            itemDropdown.classList.remove('hidden');
        }
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (itemInput && itemDropdown && !itemInput.contains(event.target) && !itemDropdown.contains(event.target)) {
            itemDropdown.classList.add('hidden');
        }
    });
}

// Function to update description and UOM from item data
function updateItemDescriptionFromData(row, item) {
    const descriptionInput = row.querySelector('.item-description');
    const uomInput = row.querySelector('.item-uom');
    
    const itemDescription = item.description || item.name || item.itemName || '';
    const itemUom = item.uom || item.unitOfMeasure || '';
    
    descriptionInput.value = itemDescription;
    descriptionInput.textContent = itemDescription; // For textarea
    descriptionInput.title = itemDescription; // For tooltip
    
    uomInput.value = itemUom;
    uomInput.title = itemUom; // For tooltip
    
    // Keep the fields disabled and gray (not editable by user)
    descriptionInput.disabled = true;
    descriptionInput.classList.add('bg-gray-100');
    uomInput.disabled = true;
    uomInput.classList.add('bg-gray-100');
}

// Legacy functions kept for backward compatibility but no longer used
// The new searchable implementation uses setupItemDropdown and updateItemDescriptionFromData instead

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
                    <span class="text-blue-600 mr-2">📄</span>
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

// Navigation function to go back to revision dashboard
function goToMenuRevisionPR() {
    window.location.href = '../../../dashboard/dashboardRevision/purchaseRequest/menuPRRevision.html';
}

// Add DOMContentLoaded event listener for dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    // Setup event listener to hide dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdowns = [
            'requesterDropdown',
            'preparedByDropdown', 
            'checkedByDropdown', 
            'acknowledgedByDropdown', 
            'approvedByDropdown', 
            'receivedByDropdown'
        ];
        
        const searchInputs = [
            'requesterSearch',
            'preparedBySearch', 
            'checkedBySearch', 
            'acknowledgedBySearch', 
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
    
    // Clean up object URLs when page is unloaded
    window.addEventListener('beforeunload', function() {
        uploadedFiles.forEach(file => {
            if (file && file instanceof File) {
                const objectUrl = fileObjectUrls.get(file);
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                    fileObjectUrls.delete(file);
                }
            }
        });
    });
});