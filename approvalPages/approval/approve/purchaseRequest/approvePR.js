let uploadedFiles = [];
// Using BASE_URL from auth.js instead of hardcoded baseUrl

// Fungsi untuk mendapatkan parameter dari URL
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Fungsi untuk mengambil data dokumen dari API berdasarkan ID
async function fetchDocumentById(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/purchase-requests/${id}`);
        if (!response.ok) {
            throw new Error('Gagal mengambil data dokumen');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat mengambil data dokumen: ' + error.message);
    }
}

// Fungsi untuk mengisi form dengan data dokumen
function populateFormWithDocumentData(document) {
    // Mengisi data form
    document.getElementById('purchaseRequestNo').value = document.purchaseRequestNo || '';
    document.getElementById('requesterName').value = document.requesterName || '';
    document.getElementById('department').value = document.departmentName || '';
    document.getElementById('submissionDate').value = document.submissionDate || '';
    document.getElementById('requiredDate').value = document.requiredDate || '';
    document.getElementById('classification').value = document.classification || '';
    document.getElementById('status').value = document.status || '';
    
    // Menampilkan item-item PR
    if (document.items && document.items.length > 0) {
        // Menghapus semua baris yang ada
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        
        // Menambahkan baris baru untuk setiap item
        document.items.forEach(item => {
            addRowWithData(item);
        });
    }
    
    // Mengatur checkbox approval jika ada
    if (document.approvals) {
        document.getElementById('prepared').checked = document.approvals.prepared || false;
        document.getElementById('checked').checked = document.approvals.checked || false;
        document.getElementById('knowledge').checked = document.approvals.acknowledge || false;
        document.getElementById('approved').checked = document.approvals.approved || false;
        document.getElementById('purchasing').checked = document.approvals.purchasing || false;
    }
}

// Fungsi untuk menambahkan baris tabel dengan data
function addRowWithData(itemData) {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");
    
    if (prType === "Item") {
        newRow.innerHTML = `
            <td id="tdItemCode" class="p-2 border">
                <select class="w-full p-2 border rounded" onchange="fillItemDetails()">
                    <option value="${itemData.itemCode}" selected>${itemData.itemCode}</option>
                </select>
            </td>
            <td id="tdItemName" class="p-2 border">
                <input type="text" maxlength="200" class="w-full" readonly value="${itemData.description || ''}" />
            </td>
            <td id="tdDetail" class="p-2 border">
                <input type="number" maxlength="10" class="w-full" required value="${itemData.price || ''}" />
            </td>
            <td id="tdPurposed" class="p-2 border">
                <input type="text" maxlength="10" class="w-full" required value="${itemData.purpose || ''}" />
            </td>
            <td id="tdQuantity" class="p-2 border">
                <input type="number" maxlength="10" class="w-full" required value="${itemData.quantity || ''}" />
            </td>
            <td id="tdAction" class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
            <td id="tdDescription" class="p-2 border" style="display: none;">
                <input type="text" maxlength="200" class="w-full" readonly />
            </td>
            <td id="tdPurposeds" class="p-2 border" style="display: none;">
                <input type="text" maxlength="10" class="w-full" required />
            </td>
            <td id="tdQty" class="p-2 border" style="display: none;">
                <input type="text" maxlength="10" class="w-full" required />
            </td>
            <td id="tdActions" class="p-2 border text-center" style="display: none;">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
        `;
    } else if (prType === "Service") {
        newRow.innerHTML = `
            <td id="tdItemCode" class="p-2 border" style="display: none;">
                <select class="w-full p-2 border rounded">
                    <option value="" disabled selected>Pilih Kode Item</option>
                </select>
            </td>
            <td id="tdItemName" class="p-2 border" style="display: none;">
                <input type="text" maxlength="200" class="w-full" readonly />
            </td>
            <td id="tdDetail" class="p-2 border" style="display: none;">
                <input type="number" maxlength="10" class="w-full" required />
            </td>
            <td id="tdPurposed" class="p-2 border" style="display: none;">
                <input type="text" maxlength="10" class="w-full" required />
            </td>
            <td id="tdQuantity" class="p-2 border" style="display: none;">
                <input type="number" maxlength="10" class="w-full" required />
            </td>
            <td id="tdAction" class="p-2 border text-center" style="display: none;">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
            <td id="tdDescription" class="p-2 border">
                <input type="text" maxlength="200" class="w-full" required value="${itemData.description || ''}" />
            </td>
            <td id="tdPurposeds" class="p-2 border">
                <input type="text" maxlength="10" class="w-full" required value="${itemData.purpose || ''}" />
            </td>
            <td id="tdQty" class="p-2 border">
                <input type="text" maxlength="10" class="w-full" required value="${itemData.quantity || ''}" />
            </td>
            <td id="tdActions" class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
        `;
    }

    tableBody.appendChild(newRow);
}

// Inisialisasi ketika halaman dimuat
window.addEventListener("DOMContentLoaded", async function() {
    // Mendapatkan ID dokumen dari URL
    const documentId = getParameterByName('id');
    
    if (documentId) {
        try {
            // Mengambil data dokumen dari API
            const documentData = await fetchDocumentById(documentId);
            
            if (documentData) {
                // Mengisi form dengan data dokumen
                populateFormWithDocumentData(documentData);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat memuat data dokumen: ' + error.message);
        }
    }
    
    // Hide service fields by default
    const serviceFields = ["thDescription", "thPurposes", "thQty", "thActions", "tdDescription", "tdPurposeds", "tdQty", "tdActions"];
    serviceFields.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.style.display = "none";
    });
    
    // If PR type is already selected, toggle fields accordingly
    
    // Initialize button visibility
    updateButtonVisibility();
    
    // Add event listener for status changes
    const statusInput = document.getElementById('status');
    if (statusInput) {
        statusInput.addEventListener('input', updateButtonVisibility);
    }
});

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
    
    // Hide approve/reject buttons if viewing from approved or rejected tabs
    if (currentTab === 'approved' || currentTab === 'rejected') {
        hideApprovalButtons();
    }
};

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
        const option = document.createElement('option');
        option.value = data.classification; // Use classification as value since backend returns string
        option.textContent = data.classification;
        option.selected = true;
        classificationSelect.appendChild(option);
    }

    // Set status and update button visibility
    const statusInput = document.getElementById('status');
    if (statusInput && data.status) {
        statusInput.value = data.status;
    }
    
    // Update button visibility based on status
    updateButtonVisibility();
    
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
    
    // Set approval dates dari API (hidden fields untuk print)
    if (data.preparedDateFormatted) {
        document.getElementById('preparedDateFormatted').value = data.preparedDateFormatted;
    }
    if (data.checkedDateFormatted) {
        document.getElementById('checkedDateFormatted').value = data.checkedDateFormatted;
    }
    if (data.acknowledgedDateFormatted) {
        document.getElementById('acknowledgedDateFormatted').value = data.acknowledgedDateFormatted;
    }
    if (data.approvedDateFormatted) {
        document.getElementById('approvedDateFormatted').value = data.approvedDateFormatted;
    }
    
    // Make all fields read-only since this is an approval page
    makeAllFieldsReadOnly();
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
            addItemRow(item);
        } catch (error) {
        }
    });
    
}

function addItemRow(item = null) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.error('tableBody element not found!');
        return;
    }
    
    const row = document.createElement('tr');

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
            populateUserSelects(data.data, prData);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
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
                case 'preparedBy': selectId = 'prepared'; break;
                case 'acknowledgeBy': selectId = 'Knowledge'; break;
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

// Modified populateUserSelects to store users globally
function populateUserSelects(users, prData = null) {
    // Store users globally for search functionality
    window.allUsers = users;
    
    const selects = [
        { id: 'prepared', approvalKey: 'preparedById', searchId: 'preparedBySearch' },
        { id: 'Checked', approvalKey: 'checkedById', searchId: 'checkedBySearch' },
        { id: 'Knowledge', approvalKey: 'acknowledgedById', searchId: 'acknowledgeBySearch' },
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

// Function to approve PR
function approvePR() {
    // Prevent double-clicking
    if (isProcessing) {
        return;
    }
    
    Swal.fire({
        title: 'Confirm Approval',
        text: 'Are you sure you want to approve this Purchase Request?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Approve',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updatePRStatus('approve');
        }
    });
}

// Function to reject PR
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
        StatusAt: 'Approved',
        Action: status,
        Remarks: ''
    };

    // Show loading
    Swal.fire({
        title: `${status === 'approve' ? 'Approving' : 'Processing'}...`,
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
                text: `PR ${status === 'approve' ? 'approved' : 'rejected'} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                goToMenuApprovPR();
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
            text: `Error ${status === 'approve' ? 'approving' : 'rejecting'} PR: ` + error.message
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

    const requestData = {
        id: prId,
        UserId: userId,
        StatusAt: 'Approved',
        Action: status,
        Remarks: remarks || ''
    };

    // Show loading
    Swal.fire({
        title: `${status === 'approve' ? 'Approving' : 'Rejecting'}...`,
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
                text: `PR ${status === 'approve' ? 'approved' : 'rejected'} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // Navigate back to the dashboard
                goToMenuApprovPR();
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
            text: `Error ${status === 'approve' ? 'approving' : 'rejecting'} PR: ` + error.message
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

// Initialize page
window.addEventListener("DOMContentLoaded", function() {
    // Page initialization complete
    console.log('Approve PR page initialized');
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
    
    if (approveButton) {
        approveButton.style.display = 'none';
    }
    if (rejectButton) {
        rejectButton.style.display = 'none';
    }
    
    // Also hide any parent container if needed
    const buttonContainer = document.querySelector('.approval-buttons, .button-container');
    if (buttonContainer && currentTab !== 'acknowledge') {
        buttonContainer.style.display = 'none';
    }
}

// Note: Item fetching functions removed since ItemNo now stores ItemCode directly

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

// Function to print purchase request
function printPR() {
    try {
        console.log("Print function started");
        // Kumpulkan semua data yang diperlukan dari form
        const purchaseRequestNo = document.getElementById('purchaseRequestNo').value;
        const dateIssued = document.getElementById('submissionDate').value;
        const department = document.getElementById('department').value;
        const classification = document.getElementById('classification').value;
        const requesterName = document.getElementById('requesterName').value;
        const requiredDate = document.getElementById('requiredDate').value;
        const remarks = document.getElementById('remarks').value;
        
        // Debug: Log remarks value
        console.log('Remarks value being passed to print:', remarks);
        
        // Ambil data approved/checked by dari input search
        const checkedBy = document.getElementById('checkedBySearch').value;
        const acknowledgedBy = document.getElementById('acknowledgeBySearch').value;
        const approvedBy = document.getElementById('approvedBySearch').value;
        const receivedBy = document.getElementById('receivedBySearch').value;
        
        // Ambil approval dates dari hidden fields (dari API)
        const preparedDateFormatted = document.getElementById('preparedDateFormatted').value;
        const checkedDateFormatted = document.getElementById('checkedDateFormatted').value;
        const acknowledgedDateFormatted = document.getElementById('acknowledgedDateFormatted').value;
        const approvedDateFormatted = document.getElementById('approvedDateFormatted').value;
        
        // Get PR type from select element
        const prTypeSelect = document.getElementById('prType');
        const prType = prTypeSelect ? prTypeSelect.value : 'Item';
        
        // Get document status
        const status = document.getElementById('status').value;
        const isApproved = status === 'Approved' || status === 'Open'; // Consider "Open" as approved for printing purposes
        
        // Ambil data item dari tabel
        const items = [];
        const tableRows = document.getElementById('tableBody').querySelectorAll('tr');
        
        tableRows.forEach((row, index) => {
            let description = '';
            let price = 0;
            let purpose = '';
            let quantity = '';
            let uom = '';
            let itemCode = '';
            
            // Extract data based on the current structure of the table
            description = row.querySelector('.item-description')?.value || 
                         row.querySelector('.item-description')?.textContent || '';
            
            purpose = row.querySelector('.item-purpose')?.value || '';
            quantity = row.querySelector('.item-quantity')?.value || '';
            uom = row.querySelector('.item-uom')?.value || 'Pcs'; // Default to 'Pcs' if not found
            
            // Extract Item Code from the select element
            const itemNoSelect = row.querySelector('.item-no');
            if (itemNoSelect) {
                const selectedOption = itemNoSelect.querySelector('option[selected]');
                if (selectedOption) {
                    itemCode = selectedOption.textContent || selectedOption.value || '';
                }
            }
            
            // Try to get price from detail field or set to 0
            price = parseFloat(row.querySelector('.item-detail')?.value || '0');
            
            // Skip empty rows
            if (!description && !purpose && !quantity) {
                return;
            }
            
            // Hitung total amount (quantity * price)
            const qty = parseFloat(quantity) || 0;
            const totalAmount = price * qty;
            
            const item = {
                itemNo: index + 1,
                itemCode: itemCode || 'N/A',
                description: description || 'N/A',
                purpose: purpose || 'N/A',
                quantity: quantity || '0',
                uom: uom || 'Pcs', // Default UoM if not specified
                price: price || 0,
                totalAmount: totalAmount || 0,
                eta: requiredDate // Gunakan required date sebagai ETA
            };
            
            items.push(item);
        });
        
        console.log("Items collected:", items);
        
        // Buat URL dengan parameter
        const url = new URL('printPR.html', window.location.href);
        
        // Get current date for approval dates (fallback jika tidak ada dari API)
        const currentDate = new Date().toISOString().split('T')[0]; // Tanggal saat ini dalam format YYYY-MM-DD
        const formattedDate = new Date().toLocaleDateString('en-GB'); // Format: DD/MM/YYYY
        
        // Tambahkan parameter dasar
        url.searchParams.set('dateIssued', dateIssued);
        url.searchParams.set('department', department);
        url.searchParams.set('purchaseRequestNo', purchaseRequestNo);
        url.searchParams.set('classification', classification);
        url.searchParams.set('remarks', remarks);
        
        // Debug: Log URL parameters being set
        console.log('URL parameters being set:', {
            remarks: remarks,
            requesterName: requesterName,
            purchaseRequestNo: purchaseRequestNo,
            department: department,
            classification: classification
        });
        
        url.searchParams.set('requesterName', requesterName);
        url.searchParams.set('checkedBy', checkedBy);
        url.searchParams.set('acknowledgedBy', acknowledgedBy);
        url.searchParams.set('approvedBy', approvedBy);
        url.searchParams.set('receivedBy', receivedBy);
        
        // Set approval dates dari API atau gunakan current date sebagai fallback
        url.searchParams.set('preparedDateFormatted', preparedDateFormatted || formattedDate);
        url.searchParams.set('checkedDateFormatted', checkedDateFormatted || formattedDate);
        url.searchParams.set('acknowledgedDateFormatted', acknowledgedDateFormatted || formattedDate);
        url.searchParams.set('approvedDateFormatted', approvedDateFormatted || formattedDate);
        url.searchParams.set('receivedDate', formattedDate);
        
        // Add approval status parameters
        url.searchParams.set('requestedApproved', 'true'); // Requester is always approved
        url.searchParams.set('checkedApproved', isApproved ? 'true' : 'false');
        url.searchParams.set('acknowledgedApproved', isApproved ? 'true' : 'false');
        url.searchParams.set('finalApproved', isApproved ? 'true' : 'false');
        
        // Tambahkan items sebagai JSON string
        url.searchParams.set('items', encodeURIComponent(JSON.stringify(items)));
        
        console.log("Opening print page:", url.toString());
        
        // Buka halaman print dalam tab baru
        window.open(url.toString(), '_blank');
    } catch (error) {
        console.error("Error in printPR function:", error);
        alert("Terjadi kesalahan saat mencetak: " + error.message);
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
            attachmentItem.className = 'flex items-center justify-between p-2 bg-white border rounded mb-2 hover:bg-gray-50';
            attachmentItem.innerHTML = `
                <div class="flex items-center">
                    <span class="text-blue-600 mr-2">📄</span>
                    <span class="text-sm font-medium">${attachment.fileName}</span>
                </div>
                <a href="${attachment.fileUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm font-semibold px-3 py-1 border border-blue-500 rounded hover:bg-blue-50 transition">
                    View
                </a>
            `;
            attachmentsList.appendChild(attachmentItem);
        });
    } else {
        attachmentsList.innerHTML = '<p class="text-gray-500 text-sm text-center py-2">No attachments found</p>';
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

// Function to handle revision for Purchase Request
function revisionPR() {
    const revisionFields = document.querySelectorAll('#revisionContainer textarea');
    
    // Check if revision button is disabled
    if (document.getElementById('revisionButton').disabled) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please add and fill revision field first'
        });
        return;
    }
    
    let allRemarks = '';
    
    revisionFields.forEach((field, index) => {
        // Include the entire content including the prefix
        if (field.value.trim() !== '') {
            if (allRemarks !== '') allRemarks += '\n\n';
            allRemarks += field.value.trim();
        }
    });
    
    if (revisionFields.length === 0 || allRemarks.trim() === '') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please add and fill revision field first'
        });
        return;
    }
    
    // Call the existing function with the collected remarks
    updatePRStatusWithRemarks('revise', allRemarks);
}

// Navigation function to go back to approve dashboard  
function goToMenuApprovPR() {
    window.location.href = '../../../dashboard/dashboardApprove/purchaseRequest/menuPRApprove.html';
}

// Add variable to prevent double-clicking
let isProcessing = false;

// Function to update button visibility based on status
function updateButtonVisibility() {
    const statusInput = document.getElementById('status');
    const printButton = document.querySelector('button[onclick="printPR()"]');
    const addRevisionBtn = document.getElementById('addRevisionBtn');
    
    if (statusInput) {
        const currentStatus = statusInput.value;
        
        // Tampilkan tombol print hanya jika status = "Approved"
        if (printButton) {
            if (currentStatus === "Approved") {
                printButton.style.display = "block";
            } else {
                printButton.style.display = "none";
            }
        }
        
        // Sembunyikan tombol addRevision jika status = "Approved" atau "Received"
        if (addRevisionBtn) {
            if (currentStatus === "Approved" || currentStatus === "Received") {
                addRevisionBtn.style.display = "none";
            } else {
                addRevisionBtn.style.display = "block";
            }
        }
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

// Function to get current user information
function getUserInfo() {
    // Use functions from auth.js to get user information
    let userName = 'Unknown User';
    let userRole = 'Approver'; // Default role for this page since we're on the approver page
    
    try {
        // Get user info from getCurrentUser function in auth.js
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.username) {
            userName = currentUser.username;
        }
        
        // Get user role based on the current page
        // Since we're on the approver page, the role is Approver
    } catch (e) {
        console.error('Error getting user info:', e);
    }
    
    return { name: userName, role: userRole };
}