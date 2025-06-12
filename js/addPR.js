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

function toggleFields() {
    const prType = document.getElementById("prType").value;
    
    const itemFields = document.querySelectorAll('.item-field');
    const serviceFields = document.querySelectorAll('.service-field');

    if (prType === "Item") {
        itemFields.forEach(field => field.style.display = "table-cell");
        serviceFields.forEach(field => field.style.display = "none");
    } else if (prType === "Service") {
        itemFields.forEach(field => field.style.display = "none");
        serviceFields.forEach(field => field.style.display = "table-cell");
    }
}


document.getElementById("docType")?.addEventListener("change", function () {
    const prTable = document.getElementById("prTable");
    prTable.style.display = this.value === "choose" ? "none" : "table";
});

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
    const prType = document.getElementById("prType").value;
    if (prType === "Service") {
        const tableBody = document.getElementById("tableBody");
        const newRow = document.createElement("tr");
        
        newRow.innerHTML = `
            <td class="p-2 border service-field">
                <input type="text" class="w-full service-description" maxlength="200" required />
            </td>
            <td class="p-2 border service-field">
                <input type="text" class="w-full service-purpose" maxlength="10" required />
            </td>
            <td class="p-2 border service-field">
                <input type="text" class="w-full service-quantity" maxlength="10" required />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
            </td>
        `;
        
        tableBody.appendChild(newRow);
    } else {
        const tableBody = document.getElementById("tableBody");
        const newRow = document.createElement("tr");
        
        newRow.innerHTML = `
            <td class="p-2 border item-field">
                <select class="w-full p-2 border rounded item-no" onchange="updateItemDescription(this)">
                    <option value="" disabled selected>Select Item</option>
                </select>
            </td>
            <td class="p-2 border item-field">
                <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto whitespace-pre-wrap break-words" rows="3" maxlength="200" disabled style="word-wrap: break-word; white-space: pre-wrap;"></textarea>
            </td>
            <td class="p-2 border item-field">
                <input type="text" class="w-full item-detail" maxlength="100" required />
            </td>
            <td class="p-2 border item-field">
                <input type="text" class="w-full item-purpose" maxlength="100" required />
            </td>
            <td class="p-2 border item-field">
                <input type="number" class="w-full item-quantity" min="1" required />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
            </td>
        `;
        
        tableBody.appendChild(newRow);
        
        // Populate the new item select with items
        const newItemSelect = newRow.querySelector('.item-no');
        fetchItemOptions(newItemSelect);
    }
}

function deleteRow(button) {
    button.closest("tr").remove();
}

// function goToMenuPR() { window.location.href = "../pages/menuPR.html"; }
// function goToAddDoc() {window.location.href = "../addPages/addPR.html"; }
// function goToAddReim() {window.location.href = "AddReim.html"; }
// function goToAddCash() {window.location.href = "AddCash.html"; }
// function goToAddSettle() {window.location.href = "AddSettle.html"; }
// function goToAddPO() {window.location.href = "AddPO.html"; }
// function goToMenuReim() { window.location.href = "MenuReim.html"; }
// function goToMenuCash() { window.location.href = "MenuCash.html"; }
// function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
// function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
// function goToMenuPO() { window.location.href = "MenuPO.html"; }
// function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
// function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
// function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; }

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

// Setup event listener untuk dropdown approval
window.onload = function(){
    // Kode onload yang sudah ada
    fetchDepartments();
    fetchUsers();
    fetchItemOptions();
    fetchClassifications();
    document.getElementById("prType").value = "Item"; // Set default PR Type to Item
    toggleFields();
    
    // Ensure all description fields are initially empty and properly styled
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

function fetchClassifications() {
    fetch(`${BASE_URL}/api/classifications`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Classification data:", data);
            populateClassificationSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching classifications:', error);
        });
}

function fetchDepartments() {
    fetch(`${BASE_URL}/api/department`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Department data:", data);
            populateDepartmentSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching departments:', error);
        });
}


function fetchUsers() {
    fetch(`${BASE_URL}/api/users`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("User data:", data);
            populateUserSelects(data.data);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
}

function fetchItemOptions(selectElement = null) {
    fetch(`${BASE_URL}/api/items`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (selectElement) {
                populateItemSelect(data.data, selectElement);
            } else {
                // Populate all item selects in the document
                document.querySelectorAll('.item-no').forEach(select => {
                    populateItemSelect(data.data, select);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching items:', error);
        });
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
        fullName: user.name || `${user.firstName} ${user.middleName} ${user.lastName}`,
        department: user.department
    }));

    // Populate RequesterId dropdown with search functionality
    const requesterSelect = document.getElementById("RequesterId");
    if (requesterSelect) {
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name || `${user.firstName} ${user.middleName} ${user.lastName}`;
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
                option.textContent = user.name || `${user.firstName} ${user.middleName} ${user.lastName}`;
                select.appendChild(option);
                if(selectId == "preparedBy"){
                    if(user.id == getUserId()){
                        option.selected = true;
                        // Perbarui kolom pencarian untuk preparedBy
                        const preparedBySearch = document.getElementById('preparedBySearch');
                        if (preparedBySearch) {
                            preparedBySearch.value = user.name || `${user.firstName} ${user.middleName} ${user.lastName}`;
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

function populateItemSelect(items, selectElement) {
    selectElement.innerHTML = '<option value="" disabled selected>Select Item</option>';

    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id || item.itemCode;
        option.textContent = `${item.itemCode}`;
        // Store the description as a data attribute
        option.setAttribute('data-description', item.description || item.name || item.itemName || '');
        selectElement.appendChild(option);
    });

    // Add onchange event listener to auto-fill description
    selectElement.onchange = function() {
        updateItemDescription(this);
    };
}

// Function to update description field when item is selected
function updateItemDescription(selectElement) {
    const row = selectElement.closest('tr');
    const descriptionInput = row.querySelector('.item-description');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    
    // Check if a valid item is selected (not the placeholder option)
    if (selectedOption && !selectedOption.disabled && selectedOption.value && selectedOption.value !== "") {
        // Get description from data attribute and fill it automatically
        const itemDescription = selectedOption.getAttribute('data-description');
        descriptionInput.value = itemDescription || '';
        descriptionInput.textContent = itemDescription || ''; // For textarea
        descriptionInput.title = itemDescription || ''; // For tooltip
        // Keep the description field disabled and gray (not editable by user)
        descriptionInput.disabled = true;
        descriptionInput.classList.add('bg-gray-100');
    } else {
        // No valid item selected, clear the description
        descriptionInput.value = '';
        descriptionInput.textContent = '';
        descriptionInput.title = '';
        // Keep the description field disabled and gray
        descriptionInput.disabled = true;
        descriptionInput.classList.add('bg-gray-100');
    }
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

async function submitDocument(isSubmit = false) {
    // Show confirmation dialog only for submit
    if (isSubmit) {
        const result = await Swal.fire({
            title: 'Konfirmasi',
            text: 'Apakah dokumen sudah benar?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) {
            return;
        }
    }

    // Show loading indicator
    const loadingTitle = isSubmit ? 'Mengirim...' : 'Menyimpan...';
    const loadingText = isSubmit ? 'Sedang mengirim dokumen, harap tunggu...' : 'Sedang menyimpan dokumen, harap tunggu...';
    
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
        const prType = document.getElementById("prType").value;
        
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
        // formData.append('PurchaseRequestNo', document.getElementById("purchaseRequestNo").value);
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
        
        // Document type (PO or Non PO)
        const isPO = document.getElementById("PO").checked;
        const isNonPO = document.getElementById("NonPO").checked;
        formData.append('DocumentType', isPO ? 'PO' : (isNonPO ? 'NonPO' : ''));
        
        // Approvals
        formData.append('PreparedById', document.getElementById("preparedBy").value);
        formData.append('CheckedById', document.getElementById("checkedBy").value);
        formData.append('AcknowledgedById', document.getElementById("acknowledgeBy").value);
        formData.append('ApprovedById', document.getElementById("approvedBy").value);
        formData.append('ReceivedById', document.getElementById("receivedBy").value);
        
        // Item details
        const rows = document.querySelectorAll("#tableBody tr");
        
        if (prType === "Item") {
            rows.forEach((row, index) => {
                formData.append(`ItemDetails[${index}].ItemNo`, row.querySelector('.item-no').value);
                formData.append(`ItemDetails[${index}].Description`, row.querySelector('.item-description').value);
                formData.append(`ItemDetails[${index}].Detail`, row.querySelector('.item-detail').value);
                formData.append(`ItemDetails[${index}].Purpose`, row.querySelector('.item-purpose').value);
                formData.append(`ItemDetails[${index}].Quantity`, row.querySelector('.item-quantity').value);
            });
        } else if (prType === "Service") {
            rows.forEach((row, index) => {
                formData.append(`ServiceDetails[${index}].Description`, row.querySelector('.service-description').value);
                formData.append(`ServiceDetails[${index}].Purpose`, row.querySelector('.service-purpose').value);
                formData.append(`ServiceDetails[${index}].Quantity`, row.querySelector('.service-quantity').value);
            });
        }
        
        // File attachments
        uploadedFiles.forEach(file => {
            formData.append('Attachments', file);
        });
        
        // Submit the form data
        const response = await fetch(`${BASE_URL}/api/pr/${prType.toLowerCase()}`, {
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
                
                if (errorData.Message) {
                    errorMessage = errorData.Message;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.errors && Array.isArray(errorData.errors)) {
                    errorMessage = "Validation errors:\n" + errorData.errors.join("\n");
                } else {
                    console.log("No Message property found in error response");
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
                title: 'Berhasil',
                text: 'dokumen sudah berhasil dibuat',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } else {
            // Show success message with SweetAlert for save
            await Swal.fire({
                title: 'Berhasil',
                text: 'Purchase Request berhasil disimpan sebagai draft',
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