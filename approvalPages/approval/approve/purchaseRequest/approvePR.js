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
    document.getElementById('prType').value = document.prType || '';
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
    const prType = document.getElementById("prType").value;
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
                
                // Menampilkan tabel sesuai dengan tipe PR
                toggleFields();
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
    const prType = document.getElementById("prType");
    if (prType && prType.value !== "choose") {
        toggleFields();
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
                document.getElementById('prType').value = prType;
                toggleFields();
                
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

    // Set status
    if (data && data.status) {
        console.log('Status:', data.status);
        var option = document.createElement('option');
        option.value = data.status;
        option.textContent = data.status;
        document.getElementById('status').appendChild(option);
        document.getElementById('status').value = data.status;
    }
    
    // Handle item details (only item type is supported now)
    if (data.itemDetails) {
        populateItemDetails(data.itemDetails);
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
}

// Function to fetch all dropdown options
function fetchDropdownOptions(prData = null) {
    fetchDepartments();
    fetchUsers(prData);
    fetchClassifications();
    fetchItemOptions(); // Always fetch items for item PRs
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
    Swal.fire({
        title: 'Confirm Rejection',
        text: 'Are you sure you want to reject this Purchase Request?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Reject',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Ask for rejection remarks
            Swal.fire({
                title: 'Rejection Remarks',
                text: 'Please provide remarks for rejection:',
                input: 'textarea',
                inputPlaceholder: 'Enter your remarks here...',
                inputValidator: (value) => {
                    if (!value || value.trim() === '') {
                        return 'Remarks are required for rejection';
                    }
                },
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Submit Rejection',
                cancelButtonText: 'Cancel'
            }).then((remarksResult) => {
                if (remarksResult.isConfirmed) {
                    updatePRStatusWithRemarks('reject', remarksResult.value);
                }
            });
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
            text: `Error ${status === 'approve' ? 'approving' : 'rejecting'} PR: ` + error.message
        });
    });
}



function deleteRow(button) {
    button.closest("tr").remove();
}

// Initialize page
window.addEventListener("DOMContentLoaded", function() {
    // Page initialization complete
    console.log('Approve PR page initialized');
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
    if (buttonContainer && currentTab !== 'acknowledge') {
        buttonContainer.style.display = 'none';
    }
}

// Function to fetch items from API
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
    
    // Store the currently selected value
    const currentValue = selectElement.value;
    const currentText = selectElement.options[selectElement.selectedIndex]?.text;
    
    selectElement.innerHTML = '<option value="" disabled>Select Item</option>';

    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id || item.itemCode;
        option.textContent = `${item.itemNo || item.itemCode} - ${item.name || item.itemName}`;
        // Store the description as a data attribute
        option.setAttribute('data-description', item.description || item.name || item.itemName || '');
        selectElement.appendChild(option);
        
        // If this item matches the current text or value, select it
        if (option.textContent === currentText || option.value === currentValue) {
            option.selected = true;
        }
    });

    // Add onchange event listener to auto-fill description
    selectElement.onchange = function() {
        updateItemDescription(this);
    };
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

// Function to print purchase request
function printPR() {
    // Kumpulkan semua data yang diperlukan dari form
    const purchaseRequestNo = document.getElementById('purchaseRequestNo').value;
    const dateIssued = document.getElementById('submissionDate').value;
    const department = document.getElementById('department').value;
    const classification = document.getElementById('classification').value;
    const requesterName = document.getElementById('requesterName').value;
    
    // Ambil data approved/checked by dari input search
    const checkedBy = document.getElementById('checkedBySearch').value;
    const acknowledgedBy = document.getElementById('acknowledgeBySearch').value;
    const approvedBy = document.getElementById('approvedBySearch').value;
    const receivedDate = new Date().toISOString().split('T')[0]; // Tanggal saat ini
    
    // Ambil data item dari tabel
    const items = [];
    const tableRows = document.getElementById('tableBody').querySelectorAll('tr');
    const prType = document.getElementById('prType').value;
    
    tableRows.forEach(row => {
        let item = {};
        
        if (prType === 'Item') {
            const description = row.querySelector('td[id="tdItemName"] input')?.value || '';
            const purpose = row.querySelector('td[id="tdPurposed"] input')?.value || '';
            const quantity = row.querySelector('td[id="tdQuantity"] input')?.value || '';
            const price = row.querySelector('td[id="tdDetail"] input')?.value || '';
            
            item = {
                description,
                purpose,
                quantity,
                price,
                eta: document.getElementById('requiredDate').value
            };
        } else if (prType === 'Service') {
            const description = row.querySelector('td[id="tdDescription"] input')?.value || '';
            const purpose = row.querySelector('td[id="tdPurposeds"] input')?.value || '';
            const quantity = row.querySelector('td[id="tdQty"] input')?.value || '';
            
            item = {
                description,
                purpose,
                quantity,
                price: 0,
                eta: document.getElementById('requiredDate').value
            };
        }
        
        if (item.description) {
            items.push(item);
        }
    });
    
    // Buat URL dengan parameter
    const url = new URL('printPR.html', window.location.href);
    
    // Tambahkan parameter dasar
    url.searchParams.set('dateIssued', dateIssued);
    url.searchParams.set('department', department);
    url.searchParams.set('purchaseRequestNo', purchaseRequestNo);
    url.searchParams.set('classification', classification);
    url.searchParams.set('requesterName', requesterName);
    url.searchParams.set('checkedBy', checkedBy);
    url.searchParams.set('acknowledgedBy', acknowledgedBy);
    url.searchParams.set('approvedBy', approvedBy);
    url.searchParams.set('receivedDate', receivedDate);
    
    // Tambahkan items sebagai JSON string
    url.searchParams.set('items', encodeURIComponent(JSON.stringify(items)));
    
    // Buka halaman print dalam tab baru
    window.open(url.toString(), '_blank');
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