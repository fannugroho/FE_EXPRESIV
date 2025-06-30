let uploadedFiles = [];

function updateApprovalStatus(id, statusKey) {
    let documents = JSON.parse(localStorage.getItem("documents")) || [];
    let docIndex = documents.findIndex(doc => doc.id === id);
    if (docIndex !== -1) {
        documents[docIndex].approvals[statusKey] = true;
        localStorage.setItem("documents", JSON.stringify(documents));
        alert(`Document ${statusKey} updated!`);
    }
}


document.getElementById("docType")?.addEventListener("change", function () {
    const prTable = document.getElementById("prTable");
    prTable.style.display = this.value === "choose" ? "none" : "table";
});

function previewPDF(event) {
    const files = event.target.files;

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
    // Get existing file list or create new one if it doesn't exist
    let fileListContainer = document.getElementById("fileList");
    
    // If container doesn't exist, create it
    if (!fileListContainer) {
        fileListContainer = document.createElement("div");
        fileListContainer.id = "fileList";
        
        // Find the file input element
        const fileInput = document.getElementById("filePath");
        if (fileInput && fileInput.parentNode) {
            // Add the container after the file input
            fileInput.parentNode.appendChild(fileListContainer);
        }
    }
    
    // Clear existing content
    fileListContainer.innerHTML = "";
    
    // Add header if there are files
    if (uploadedFiles.length > 0) {
        const header = document.createElement("div");
        header.className = "font-bold mt-2 mb-1";
        header.textContent = "Selected Files:";
        fileListContainer.appendChild(header);
    }
    
    // Add each file to the list
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement("div");
        fileItem.className = "flex justify-between items-center p-2 border-b";
        fileItem.innerHTML = `
            <span>${file.name}</span>
            <div>
                <button type="button" onclick="viewFile(${index})" class="text-blue-500 mr-2">View</button>
                <button type="button" onclick="removeFile(${index})" class="text-red-500">X</button>
            </div>
        `;
        fileListContainer.appendChild(fileItem);
    });
}

function viewFile(index) {
    const file = uploadedFiles[index];
    if (!file) return;
    
    // Create URL for the file
    const fileURL = URL.createObjectURL(file);
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.id = 'pdfViewerModal';
    
    // Create modal content
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-4/5 h-4/5 flex flex-col">
            <div class="flex justify-between items-center p-4 border-b">
                <h3 class="text-lg font-semibold">${file.name}</h3>
                <button type="button" class="text-gray-500 hover:text-gray-700" onclick="closeModal()">
                    <span class="text-2xl">&times;</span>
                </button>
            </div>
            <div class="flex-grow p-4 overflow-auto">
                <iframe src="${fileURL}" class="w-full h-full" frameborder="0"></iframe>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(modal);
    
    // Prevent scrolling on the body
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('pdfViewerModal');
    if (modal) {
        modal.remove();
        // Restore scrolling
        document.body.style.overflow = '';
    }
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    displayFileList();
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
    
    // Setup searchable item dropdown for the new row
    setupItemDropdown(newRow);
}

function deleteRow(button) {
    button.closest("tr").remove();
}

// Data pengguna contoh (mockup)
const mockUsers = [
    { id: 1, name: "Ahmad Baihaki", department: "Finance" },
    { id: 2, name: "Budi Santoso", department: "Purchasing" },
    { id: 3, name: "Cahya Wijaya", department: "IT" },
    { id: 4, name: "Dewi Sartika", department: "HR" },
    { id: 5, name: "Eko Purnomo", department: "Logistics" },
    { id: 6, name: "Fajar Nugraha", department: "Production" },
    { id: 7, name: "Gita Nirmala", department: "Finance" },
    { id: 8, name: "Hadi Gunawan", department: "Marketing" },
    { id: 9, name: "Indah Permata", department: "Sales" },
    { id: 10, name: "Joko Widodo", department: "Management" }
];

// Fungsi untuk memfilter dan menampilkan dropdown pengguna
function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    
    // Kosongkan dropdown
    dropdown.innerHTML = '';
    
    // Filter pengguna berdasarkan teks pencarian
    const filteredUsers = window.requesters ? 
        window.requesters.filter(user => user.fullName.toLowerCase().includes(searchText)) : 
        mockUsers.filter(user => user.name.toLowerCase().includes(searchText));
    
    // Tampilkan hasil pencarian
    filteredUsers.forEach(user => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        option.innerText = user.name || user.fullName;
        option.onclick = function() {
            searchInput.value = user.name || user.fullName;
            document.getElementById(fieldId).value = user.id;
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(option);
    });
    
    // Tampilkan pesan jika tidak ada hasil
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'Tidak ada pengguna yang cocok';
        dropdown.appendChild(noResults);
    }
    
    // Tampilkan dropdown
    dropdown.classList.remove('hidden');
}

// Helper function to format date as YYYY-MM-DD without timezone issues
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Fungsi untuk mengatur tanggal minimum pada field Issuance Date dan set default values
function setMinDateToday() {
    const today = new Date();
    // Format tanggal ke YYYY-MM-DD untuk input type="date" without timezone conversion
    const formattedDate = formatDateForInput(today);
    
    // Set nilai minimum untuk field Issuance Date ke hari ini
    const submissionDateInput = document.getElementById("submissionDate");
    submissionDateInput.min = formattedDate;
    
    // Set default issuance date to today
    submissionDateInput.value = formattedDate;
    
    // Set default required date to 2 weeks from today
    const twoWeeksFromToday = new Date(today);
    twoWeeksFromToday.setDate(today.getDate() + 14);
    const requiredDateFormatted = formatDateForInput(twoWeeksFromToday);
    
    const requiredDateInput = document.getElementById("requiredDate");
    requiredDateInput.value = requiredDateFormatted;
    
    // Set minimum date for required date to 2 weeks from today
    requiredDateInput.min = requiredDateFormatted;
    
    // Add event listener to automatically update required date when issuance date changes
    submissionDateInput.addEventListener('change', function() {
        const selectedDate = new Date(this.value + 'T00:00:00'); // Add time to avoid timezone issues
        const minRequiredDate = new Date(selectedDate);
        minRequiredDate.setDate(selectedDate.getDate() + 14);
        
        const minRequiredFormatted = formatDateForInput(minRequiredDate);
        requiredDateInput.min = minRequiredFormatted;
        
        // If current required date is less than minimum, update it
        const currentRequiredDate = new Date(requiredDateInput.value + 'T00:00:00');
        if (currentRequiredDate < minRequiredDate) {
            requiredDateInput.value = minRequiredFormatted;
        }
    });
}

// Setup event listener untuk dropdown approval
window.onload = function(){
    // Kode onload yang sudah ada
    fetchDepartments();
    fetchUsers();
    fetchItemOptions(); // This will now setup searchable dropdowns
    fetchClassifications();
    
    // Set min date untuk Issuance Date
    setMinDateToday();
    
    // Ensure all description and UOM fields are initially empty and properly styled
    document.querySelectorAll('.item-description').forEach(input => {
        input.value = '';
        input.disabled = true;
        input.classList.add('bg-gray-100');
    });
    
    // Tambahkan event listener untuk menyembunyikan dropdown saat klik di luar
    document.addEventListener('click', function(event) {
        const dropdowns = [
            'preparedByDropdown', 
            'acknowledgeByDropdown', 
            'checkedByDropdown', 
            'approvedByDropdown', 
            'receivedByDropdown'
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
}

async function fetchClassifications() {
    try {
        const response = await makeAuthenticatedRequest('/api/classifications');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        console.log("Classification data:", data);
        populateClassificationSelect(data.data);
    } catch (error) {
        console.error('Error fetching classifications:', error);
    }
}

async function fetchDepartments() {
    try {
        const response = await makeAuthenticatedRequest('/api/department');
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

async function fetchUsers() {
    try {
        const response = await makeAuthenticatedRequest('/api/users');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
        console.log("User data:", data);
        populateUserSelects(data.data);
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// Store items globally for search functionality
let allItems = [];

async function fetchItemOptions() {
    try {
        const response = await makeAuthenticatedRequest('/api/items');
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const data = await response.json();
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
function setupItemDropdown(row) {
    const itemInput = row.querySelector('.item-input');
    const itemDropdown = row.querySelector('.item-dropdown');
    const descriptionInput = row.querySelector('.item-description');
    const uomInput = row.querySelector('.item-uom');
    
    if (!itemInput || !itemDropdown) return;
    
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
        if (!itemInput.contains(event.target) && !itemDropdown.contains(event.target)) {
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

function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("department");
    departmentSelect.innerHTML = '<option value="" disabled selected>Select Department</option>';

    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.name;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
    });
}

function populateUserSelects(users) {
    // Jika tidak ada data users dari API, gunakan mockup
    if (!users || users.length === 0) {
        users = mockUsers;
    }

    // Store users globally for search functionality
    window.requesters = users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        department: user.department
    }));

    // Populate RequesterId dropdown with search functionality
    const requesterSelect = document.getElementById("RequesterId");
    if (requesterSelect) {
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.fullName;
            requesterSelect.appendChild(option);
        });
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
            
            const filteredRequesters = window.requesters.filter(r => 
                r.fullName.toLowerCase().includes(filter)
            );
            
            filteredRequesters.forEach(requester => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerText = requester.fullName;
                option.onclick = function() {
                    requesterSearchInput.value = requester.fullName;
                    document.getElementById('RequesterId').value = requester.id;
                    requesterDropdown.classList.add('hidden');
                    //update department
                    
                    const departmentSelect = document.getElementById('department');
                    if (requester.department) {
                        // Find the department option and select it
                        const departmentOptions = departmentSelect.options;
                        for (let i = 0; i < departmentOptions.length; i++) {
                            if (departmentOptions[i].textContent === requester.department) {
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
            if (!requesterSearchInput.contains(event.target) && !requesterDropdown.contains(event.target)) {
                requesterDropdown.classList.add('hidden');
            }
        });

        // Initial population
        populateRequesterDropdown();
    }

    const selects = [
        'preparedBy', 'checkedBy', 'acknowledgeBy', 'approvedBy', 'receivedBy'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="" disabled selected>Select User</option>';
            
            users.forEach(user => {
                const option = document.createElement("option");
                option.value = user.id;
                option.textContent = user.fullName;
                select.appendChild(option);
                if(selectId == "preparedBy"){
                    if(user.id == getUserId()){
                        option.selected = true;
                        // Perbarui kolom pencarian untuk preparedBy
                        const preparedBySearch = document.getElementById('preparedBySearch');
                        if (preparedBySearch) {
                            preparedBySearch.value = user.fullName;
                            preparedBySearch.disabled = true;
                        }
                    }
                }
            });
        }
        
        // Pre-populate dropdown lists for search fields
        const searchInput = document.getElementById(`${selectId}Search`);
        if (searchInput) {
            // Trigger initial dropdown on focus
            searchInput.addEventListener('focus', function() {
                filterUsers(selectId);
            });
        }
    });
}

// Legacy function kept for backward compatibility (no longer used)
function updateItemDescription(selectElement) {
    // This function is kept for backward compatibility but no longer used
    // The new searchable implementation uses updateItemDescriptionFromData instead
}

function populateClassificationSelect(classifications) {
    const classificationSelect = document.getElementById("classification");
    classificationSelect.innerHTML = '<option value="" disabled selected>Select Classification</option>';

    classifications.forEach(classification => {
        const option = document.createElement("option");
        option.value = classification.id;
        option.textContent = classification.name;
        classificationSelect.appendChild(option);
    });
}

// Validation function to check if dates are at least 2 weeks apart
function validateDateDifference(issuanceDate, requiredDate) {
    if (!issuanceDate || !requiredDate) return false;
    
    const issuance = new Date(issuanceDate);
    const required = new Date(requiredDate);
    
    // Calculate difference in milliseconds
    const timeDifference = required.getTime() - issuance.getTime();
    
    // Convert to days (14 days = 2 weeks)
    const daysDifference = timeDifference / (1000 * 3600 * 24);
    
    return daysDifference >= 14;
}

// Validation function to check required fields
function validateRequiredFields() {
    const errors = [];
    
    // Check requester name
    const requesterId = document.getElementById("RequesterId").value;
    if (!requesterId) {
        errors.push("Requester name is required");
    }
    
    // Check remarks
    const remarks = document.getElementById("remarks").value.trim();
    if (!remarks) {
        errors.push("Remarks field is required");
    }
    
    // Check attachments
    if (uploadedFiles.length === 0) {
        errors.push("At least one attachment is required");
    }
    
    // Check approval users
    const approvalFields = ['preparedBy', 'acknowledgeBy', 'checkedBy', 'approvedBy', 'receivedBy'];
    approvalFields.forEach(field => {
        const value = document.getElementById(field).value;
        if (!value) {
            const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase();
            errors.push(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`);
        }
    });
    
    // Check dates
    const issuanceDate = document.getElementById("submissionDate").value;
    const requiredDate = document.getElementById("requiredDate").value;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset waktu ke 00:00:00
    
    if (!issuanceDate) {
        errors.push("Issuance date is required (default has been set to today)");
    } else {
        // Validasi backdate
        const selectedDate = new Date(issuanceDate);
        selectedDate.setHours(0, 0, 0, 0); // Reset waktu ke 00:00:00
        
        if (selectedDate < today) {
            errors.push("Issuance date cannot be backdate (date in the past)");
        }
    }
    
    if (!requiredDate) {
        errors.push("Required date is required (default has been set to 2 weeks from issuance date)");
    }
    
    if (issuanceDate && requiredDate) {
        if (!validateDateDifference(issuanceDate, requiredDate)) {
            errors.push("Required date must be at least 2 weeks after issuance date");
        }
    }
    
    return errors;
}

async function submitDocument(isSubmit = false) {
    // Validate required fields first
    const validationErrors = validateRequiredFields();
    if (validationErrors.length > 0) {
        await Swal.fire({
            title: 'Validation Error',
            html: validationErrors.map(error => `• ${error}`).join('<br>'),
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }

    // Show confirmation dialog only for submit
    if (isSubmit) {
        const result = await Swal.fire({
            title: 'Confirmation',      
            text: 'Is the document correct?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) {
            return;
        }
    }

    // Show loading indicator
    const loadingTitle = isSubmit ? 'Sending...' : 'Saving...';
    const loadingText = isSubmit ? 'Sending document, please wait...' : 'Saving document, please wait...';
    
    Swal.fire({
        title: loadingTitle,
        text: loadingText,
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // Get user ID from JWT token using auth.js function
        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }
        
        // Create the Purchase Request
        const formData = new FormData();
        
        console.log("User ID:", userId);
        console.log("IsSubmit:", isSubmit);
        
        // Add basic fields
        formData.append('RequesterId', document.getElementById("RequesterId").value || userId);
        formData.append('DepartmentId', document.getElementById("department").value);
        formData.append('IsSubmit', isSubmit.toString()); // Convert boolean to string

        // Format dates
        const requiredDate = document.getElementById("requiredDate").value;
        if (requiredDate) {
            console.log("Required Date:", requiredDate);
            formData.append('RequiredDate', new Date(requiredDate).toISOString());
            console.log("Required Date:", new Date(requiredDate).toISOString());
        }
        
        const submissionDate = document.getElementById("submissionDate").value;
        if (submissionDate) {
            console.log("Submission Date:", submissionDate);
            // Send date value directly without timezone conversion
            formData.append('SubmissionDate', submissionDate);
        }
        
        const classificationSelect = document.getElementById("classification");
        const selectedText = classificationSelect.options[classificationSelect.selectedIndex].text;
        formData.append('Classification', selectedText);
        formData.append('Remarks', document.getElementById("remarks").value);
        
        // Approvals
        formData.append('PreparedById', document.getElementById("preparedBy").value);
        formData.append('CheckedById', document.getElementById("checkedBy").value);
        formData.append('AcknowledgedById', document.getElementById("acknowledgeBy").value);
        formData.append('ApprovedById', document.getElementById("approvedBy").value);
        formData.append('ReceivedById', document.getElementById("receivedBy").value);
        
        
        // Item details
        const rows = document.querySelectorAll("#tableBody tr");
        
        rows.forEach((row, index) => {
            formData.append(`ItemDetails[${index}].ItemNo`, row.querySelector('.item-input').value);
            formData.append(`ItemDetails[${index}].Description`, row.querySelector('.item-description').value);
            formData.append(`ItemDetails[${index}].Detail`, row.querySelector('.item-detail').value);
            formData.append(`ItemDetails[${index}].Purpose`, row.querySelector('.item-purpose').value);
            formData.append(`ItemDetails[${index}].Quantity`, row.querySelector('.item-quantity').value);
            formData.append(`ItemDetails[${index}].UOM`, row.querySelector('.item-uom').value);
        });
        
        // File attachments
        uploadedFiles.forEach(file => {
            formData.append('Attachments', file);
        });
        
        // Submit the form data
        const response = await makeAuthenticatedRequest('/api/pr/item', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            // Parse the error response to get the actual error message
            let errorMessage = `API error: ${response.status}`;
            try {
                console.log("Error response status:", response.status);
                console.log("Error response headers:", response.headers.get('content-type'));
                
                const responseText = await response.text();
                console.log("Raw error response:", responseText);
                
                const errorData = JSON.parse(responseText);
                console.log("Parsed error data:", errorData);
                
                // Handle ApiResponse error format
                if (errorData.Message) {
                    errorMessage = errorData.Message;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
                
                // Handle validation errors array in Data field
                if (errorData.Data && Array.isArray(errorData.Data)) {
                    errorMessage = "Validation errors:\n" + errorData.Data.join("\n");
                } else if (errorData.errors && Array.isArray(errorData.errors)) {
                    errorMessage = "Validation errors:\n" + errorData.errors.join("\n");
                }
                
            } catch (parseError) {
                console.log("Could not parse error response:", parseError);
            }
            throw new Error(errorMessage);
        }
        
        // Parse the successful response
        const result = await response.json();
        console.log("Submit PR result:", result);
        
        // Show appropriate success message
        if (isSubmit) {
            // Show success message with SweetAlert for submit
            await Swal.fire({
                title: 'Success',
                text: 'Document has been created successfully',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } else {
            // Show success message with SweetAlert for save
            await Swal.fire({
                title: 'Success!',
                text: 'Purchase Request has been saved as draft',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        }
        
        // Redirect back to menu page
        window.location.href = "../pages/menuPR.html";
        
    } catch (error) {
        console.error("Error processing Purchase Request:", error);
        
        // Show error message with SweetAlert for both submit and save
        await Swal.fire({
            title: 'Error',
            text: `Failed to ${isSubmit ? 'submit' : 'save'} Purchase Request: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

function goToMenuPR() {
    window.location.href = '../pages/menuPR.html';
}