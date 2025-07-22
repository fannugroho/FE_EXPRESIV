// Using BASE_URL from auth.js instead of hardcoded baseUrl
let uploadedFiles = [];
let businessPartners = []; // Added to store business partners
let transactionTypes = []; // Added to store transaction types
let allCategories = []; // Global cache for categories
let allAccountNames = []; // Global cache for account names
let categoryCache = new Map(); // Cache for categories by department+transactionType
let accountNameCache = new Map(); // Cache for account names by category+department+transactionType

// Fungsi untuk memformat tanggal ke format ISO (YYYY-MM-DD) dengan menghindari masalah zona waktu
function formatDateToISO(dateString) {
    // Use the utility function for consistent date handling
    return formatDateToYYYYMMDD(dateString);
}

// Data pengguna akan diambil dari API

// Fungsi untuk memfilter dan menampilkan dropdown pengguna
function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId.replace('Select', '')}Search`);
    if (!searchInput) return;
    
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    if (!dropdown) return;
    
    // Kosongkan dropdown
    dropdown.innerHTML = '';
    
    let filteredUsers = [];
    
    // Handle payToSelect dropdown separately
    if (fieldId === 'payToSelect') {
        try {
            // Use users data instead of business partners
            const users = JSON.parse(searchInput.dataset.users || '[]');
            const filtered = users.filter(user => 
                user && user.fullName && 
                (user.fullName.toLowerCase().includes(searchText) || 
                user.employeeId && user.employeeId.toLowerCase().includes(searchText) ||
                user.kansaiEmployeeId && user.kansaiEmployeeId.toLowerCase().includes(searchText))
            );
            
            // Tampilkan hasil pencarian
            filtered.forEach(user => {
                if (!user || !user.fullName) return; // Skip users without names
                const option = document.createElement('div');
                option.className = 'dropdown-item';
                const displayText = user.kansaiEmployeeId ? 
                    `${user.kansaiEmployeeId} - ${user.fullName}` : 
                    `${user.employeeId || ''} - ${user.fullName}`;
                option.innerText = displayText;
                option.onclick = function() {
                    searchInput.value = displayText;
                    const selectElement = document.getElementById(fieldId);
                    if (selectElement) {
                        // Find or create option with this user
                        let optionExists = false;
                        for (let i = 0; i < selectElement.options.length; i++) {
                            if (selectElement.options[i].value === user.id) {
                                selectElement.selectedIndex = i;
                                optionExists = true;
                                break;
                            }
                        }
                        
                        if (!optionExists && selectElement.options.length > 0) {
                            const newOption = document.createElement('option');
                            newOption.value = user.id;
                            newOption.textContent = displayText;
                            selectElement.appendChild(newOption);
                            selectElement.value = user.id;
                        }
                    }
                    
                    dropdown.classList.add('hidden');
                };
                dropdown.appendChild(option);
            });
            
            // Tampilkan pesan jika tidak ada hasil
            if (filtered.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No User Found';
                dropdown.appendChild(noResults);
            }
            
            // Tampilkan dropdown
            dropdown.classList.remove('hidden');
            return;
        } catch (error) {
            console.error("Error filtering users:", error);
        }
    }
    
    // Handle all other searchable selects
    if (fieldId === 'requesterNameSelect' || 
        fieldId === 'preparedBySelect' || 
        fieldId === 'acknowledgeBySelect' || 
        fieldId === 'checkedBySelect' || 
        fieldId === 'approvedBySelect' ||
        fieldId === 'receivedBySelect') {
        try {
            const users = JSON.parse(searchInput.dataset.users || '[]');
            filteredUsers = users.filter(user => user && user.name && user.name.toLowerCase().includes(searchText));
            
            // Tampilkan hasil pencarian
            filteredUsers.forEach(user => {
                if (!user || !user.name) return; // Skip users without names
                const option = document.createElement('div');
                option.className = 'dropdown-item';
                option.innerText = user.name;
                option.onclick = function() {
                    searchInput.value = user.name;
                    const selectElement = document.getElementById(fieldId);
                    if (selectElement) {
                        // For requesterName, store the name as the value since we send the name to the API
                        if (fieldId === 'requesterNameSelect') {
                            // Find the matching option or create a new one
                            let optionExists = false;
                            for (let i = 0; i < selectElement.options.length; i++) {
                                if (selectElement.options[i].textContent === user.name) {
                                    selectElement.selectedIndex = i;
                                    optionExists = true;
                                    break;
                                }
                            }
                            
                            if (!optionExists && selectElement.options.length > 0) {
                                const newOption = document.createElement('option');
                                newOption.value = user.name;
                                newOption.textContent = user.name;
                                selectElement.appendChild(newOption);
                                selectElement.value = user.name;
                            }
                        } else {
                            // For approval fields, store the ID as the value
                            let optionExists = false;
                            for (let i = 0; i < selectElement.options.length; i++) {
                                if (selectElement.options[i].value === user.id.toString()) {
                                    selectElement.selectedIndex = i;
                                    optionExists = true;
                                    break;
                                }
                            }
                            
                            if (!optionExists && selectElement.options.length > 0) {
                                const newOption = document.createElement('option');
                                newOption.value = user.id;
                                newOption.textContent = user.name;
                                selectElement.appendChild(newOption);
                                selectElement.value = user.id;
                            }
                        }
                    }
                    
                    dropdown.classList.add('hidden');
                    
                                            // Auto-fill department when requesterName is selected
                        if (fieldId === 'requesterNameSelect') {
                            console.log('Requester selected:', user.name, 'ID:', user.id);
                            
                            // Auto-fill department based on selected user ID
                            console.log('Calling autoFillDepartmentFromRequesterById with user ID:', user.id);
                            autoFillDepartmentFromRequesterById(user.id);
                            
                            // Trigger category fetch if transaction type is already selected
                            setTimeout(() => {
                                const transactionType = document.getElementById('typeOfTransaction').value;
                                if (transactionType) {
                                    console.log('Transaction type already selected, triggering category fetch after department auto-fill...');
                                    handleDependencyChange();
                                }
                            }, 500);
                        }
                };
                dropdown.appendChild(option);
            });
        } catch (error) {
            console.error("Error parsing users data:", error);
        }
    }
    
    // Tampilkan pesan jika tidak ada hasil
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'Name Not Found';
        dropdown.appendChild(noResults);
    }
    
    // Tampilkan dropdown
    dropdown.classList.remove('hidden');
}

// Setup file input listener when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById("filePath");
    if (fileInput) {
        fileInput.addEventListener('change', previewPDF);
    }
    
    // Fetch users and departments from API to populate dropdowns
    fetchUsers();
    fetchDepartments();
    fetchBusinessPartners(); // Added to fetch business partners
    fetchTransactionTypes(); // Added to fetch transaction types
    
    // Preload common categories and account names for faster loading
    preloadCommonData();
    
    // Check if department and transaction type are already selected and trigger category fetch
    setTimeout(() => {
        const departmentName = document.getElementById('department').value;
        const transactionType = document.getElementById('typeOfTransaction').value;
        
        if (departmentName && transactionType) {
            console.log('Department and transaction type already selected, triggering initial category fetch...');
            handleDependencyChange();
        }
    }, 1000); // Delay to ensure other data is loaded first
    
    // Also check for pre-filled data after a longer delay to ensure all data is loaded
    setTimeout(() => {
        checkAndLoadPreFilledData();
    }, 2000);
    
    // Set min dan max pada input postingDate agar hanya bisa memilih hari ini
    const postingDateInput = document.getElementById('postingDate');
    if (postingDateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;
        
        postingDateInput.min = todayString;
        postingDateInput.max = todayString;
        // Selalu set value ke hari ini setiap kali halaman dibuka
        postingDateInput.value = todayString;
    }
    
    // Setup event listener untuk hide dropdown saat klik di luar
    document.addEventListener('click', function(event) {
        const dropdowns = [
            'preparedBySelectDropdown', 
            'acknowledgeBySelectDropdown', 
            'checkedBySelectDropdown', 
            'approvedBySelectDropdown',
            'receivedBySelectDropdown',
            'requesterNameSelectDropdown',
            'payToSelectDropdown' // Add payTo dropdown
        ];
        
        const searchInputs = [
            'preparedBySearch', 
            'acknowledgeBySearch', 
            'checkedBySearch', 
            'approvedBySearch',
            'receivedBySearch',
            'requesterNameSearch',
            'payToSearch' // Add payTo search input
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
        
        // Handle table row dropdowns
        const categoryDropdowns = document.querySelectorAll('.category-dropdown');
        const accountNameDropdowns = document.querySelectorAll('.account-name-dropdown');
        
        categoryDropdowns.forEach(dropdown => {
            const input = dropdown.parentElement.querySelector('.category-search');
            if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
        
        accountNameDropdowns.forEach(dropdown => {
            const input = dropdown.parentElement.querySelector('.account-name-search');
            if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
    });
    
    // Trigger initial dropdown on focus for each search field
    const searchFields = [
        'preparedBySearch',
        'acknowledgeBySearch',
        'checkedBySearch',
        'approvedBySearch',
        'receivedBySearch',
        'requesterNameSearch',
        'payToSearch' // Add payTo search field
    ];
    
    searchFields.forEach(fieldId => {
        const searchInput = document.getElementById(fieldId);
        if (searchInput) {
            searchInput.addEventListener('focus', function() {
                const actualFieldId = fieldId.replace('Search', 'Select');
                filterUsers(actualFieldId);
            });
            
            // Add input event for real-time filtering
            searchInput.addEventListener('input', function() {
                const actualFieldId = fieldId.replace('Search', 'Select');
                filterUsers(actualFieldId);
            });
        }
    });
    
    // Setup event listeners for the first row that already exists
    const firstRow = document.querySelector('#tableBody tr');
    if (firstRow) {
        setupRowEventListeners(firstRow);
        
        // Pre-populate categories if already available
        const categorySearch = firstRow.querySelector('.category-search');
        if (categorySearch && allCategories.length > 0) {
            categorySearch.dataset.categories = JSON.stringify(allCategories);
            console.log('Pre-populated categories for first row:', allCategories.length, 'categories');
        }
    }
    
    // Setup event listeners for department and transaction type changes
    const departmentSelect = document.getElementById('department');
    const transactionTypeSelect = document.getElementById('typeOfTransaction');
    
    if (departmentSelect) {
        departmentSelect.addEventListener('change', handleDependencyChange);
        // Also trigger on focus for faster response
        departmentSelect.addEventListener('focus', function() {
            if (this.value && document.getElementById('typeOfTransaction').value) {
                handleDependencyChange();
            }
        });
        
        // Also trigger when department is selected and transaction type is available
        departmentSelect.addEventListener('change', function() {
            const transactionType = document.getElementById('typeOfTransaction').value;
            if (this.value && transactionType) {
                console.log('Department changed and transaction type available, triggering category fetch...');
                handleDependencyChange();
            }
        });
    }
    
    if (transactionTypeSelect) {
        transactionTypeSelect.addEventListener('change', handleDependencyChange);
        // Also trigger on focus for faster response
        transactionTypeSelect.addEventListener('focus', function() {
            if (this.value && document.getElementById('department').value) {
                handleDependencyChange();
            }
        });
        
        // Also trigger when transaction type is selected and department is available
        transactionTypeSelect.addEventListener('change', function() {
            const departmentName = document.getElementById('department').value;
            if (this.value && departmentName) {
                console.log('Transaction type changed and department available, triggering category fetch...');
                handleDependencyChange();
            }
        });
    }
});

function saveDocument() {
    Swal.fire({
        title: 'Confirmation',
        text: 'Is the document correct?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await processDocument(false);
                Swal.fire({
                    title: 'Success',
                    text: 'Document saved successfully.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    goToMenuReim(); // Navigate to menu page after clicking OK
                });
            } catch (error) {
                console.error("Error saving reimbursement:", error);
                Swal.fire({
                    title: 'Error',
                    text: `Error: ${error.message}`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        }
    });
}

function submitDocument() {
    Swal.fire({
        title: 'Confirmation',
        text: 'Is the document correct?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await processDocument(true);
                Swal.fire({
                    title: 'Success',
                    text: 'Document submitted successfully.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    goToMenuReim(); // Navigate to menu page after clicking OK
                });
            } catch (error) {
                console.error("Error submitting reimbursement:", error);
                Swal.fire({
                    title: 'Error',
                    text: `Error: ${error.message}`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
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


document.getElementById("docType")?.addEventListener("change", function () {
    const reimTable = document.getElementById("reimTable");
    reimTable.style.display = this.value === "Choose" ? "none" : "table";
});

function previewPDF(event) {
    const files = event.target.files;
    
    Array.from(files).forEach(file => {
        // Check if file with same name already exists
        const fileExists = uploadedFiles.some(existingFile => 
            existingFile.name === file.name && 
            existingFile.size === file.size
        );
        
        // Only add if it doesn't exist
        if (!fileExists) {
            uploadedFiles.push(file);
        }
    });

    displayFileList();
}

function displayFileList() {
    // Get existing file list 
    const fileListContainer = document.getElementById("fileList");
    
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
        <td class="p-2 border">
            <div class="relative">
                <input type="text" placeholder="Search category..." class="w-full p-1 border rounded search-input category-search" required />
                <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden category-dropdown"></div>
                <select class="hidden category-select">
                    <option value="" disabled selected>Choose Category</option>
                </select>
            </div>
        </td>
        <td class="p-2 border">
            <div class="relative">
                <input type="text" placeholder="Search account name..." class="w-full p-1 border rounded search-input account-name-search" required />
                <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden account-name-dropdown"></div>
                <select class="hidden account-name-select">
                    <option value="" disabled selected>Choose Account Name</option>
                </select>
            </div>
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full p-1 border rounded bg-gray-200 cursor-not-allowed gl-account" disabled />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="250" class="w-full p-1 border rounded" required />
        </td>
        <td class="p-2 border">
            <input type="text" value="0.00" class="w-full p-1 border rounded currency-input-idr" oninput="formatCurrencyInputIDR(this)" required />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;

    tableBody.appendChild(newRow);
    
    // Setup event listeners for the new row immediately
    setupRowEventListeners(newRow);
    
    // Pre-populate categories for the new row if data is available
    const categorySearch = newRow.querySelector('.category-search');
    if (categorySearch && allCategories.length > 0) {
        categorySearch.dataset.categories = JSON.stringify(allCategories);
        console.log('Pre-populated categories for new row:', allCategories.length, 'categories');
    }
    
    // Pre-populate account names for the new row if data is available
    const accountNameSearch = newRow.querySelector('.account-name-search');
    if (accountNameSearch && allAccountNames.length > 0) {
        accountNameSearch.dataset.accountNames = JSON.stringify(allAccountNames);
        console.log('Pre-populated account names for new row:', allAccountNames.length, 'account names');
    }
    
    // Also populate if department and transaction type are already selected
    const departmentName = document.getElementById('department').value;
    const transactionType = document.getElementById('typeOfTransaction').value;
    
    if (departmentName && transactionType) {
        if (allCategories.length === 0) {
            console.log('Department and transaction type are selected, triggering category fetch for new row...');
            handleDependencyChange().then(() => {
                if (allCategories.length > 0) {
                    categorySearch.dataset.categories = JSON.stringify(allCategories);
                    console.log('Categories populated after fetch for new row');
                }
            });
        } else {
            // Categories already available, just populate
            categorySearch.dataset.categories = JSON.stringify(allCategories);
            console.log('Categories already available for new row:', allCategories.length, 'categories');
        }
        
        // Also check if we have account names for the first category
        if (allCategories.length > 0) {
            const firstCategory = allCategories[0];
            // Get department ID if not already available
            getDepartmentIdByName(departmentName).then(departmentId => {
                if (departmentId) {
                    const cacheKey = `${firstCategory}-${departmentId}-${transactionType}`;
                    if (accountNameCache.has(cacheKey)) {
                        const cachedAccountNames = accountNameCache.get(cacheKey);
                        const accountNameSearch = newRow.querySelector('.account-name-search');
                        if (accountNameSearch) {
                            accountNameSearch.dataset.accountNames = JSON.stringify(cachedAccountNames);
                            console.log('Pre-populated account names for new row from cache:', cachedAccountNames.length, 'account names');
                        }
                    } else {
                        // Pre-fetch account names for the first category
                        fetchAccountNames(firstCategory, departmentId, transactionType).then(accountNames => {
                            const accountNameSearch = newRow.querySelector('.account-name-search');
                            if (accountNameSearch && accountNames.length > 0) {
                                accountNameSearch.dataset.accountNames = JSON.stringify(accountNames);
                                console.log('Pre-fetched account names for new row:', accountNames.length, 'account names');
                            }
                        });
                    }
                } else {
                    console.log('Department ID not found for:', departmentName);
                }
            }).catch(error => {
                console.error('Error getting department ID for new row:', error);
            });
        }
    }
}

function deleteRow(button) {
    button.closest("tr").remove();
}

function goToMenuPR() { window.location.href = "../pages/menuPR.html"; }
function goToAddDoc() {window.location.href = "../addPages/addPR.html"; }
function goToAddReim() {window.location.href = "../addPages/addReim.html"; }
function goToAddCash() {window.location.href = "AddCash.html"; }
function goToAddSettle() {window.location.href = "AddSettle.html"; }
function goToAddPO() {window.location.href = "AddPO.html"; }
function goToMenuPR() { window.location.href = "MenuPR.html"; }
function goToMenuReim() { window.location.href = "../pages/menuReim.html"; }
function goToMenuCash() { window.location.href = "MenuCash.html"; }
function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
function goToMenuPO() { window.location.href = "MenuPO.html"; }
function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; }

// Fetch users from API and populate dropdown selects
async function fetchUsers() {
    try {
        const response = await fetch(`${BASE_URL}/api/users`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch users');
        }
        
        const users = result.data;
        
        // Store users globally for later use
        window.allUsers = users;
        console.log('Stored', users.length, 'users in global cache');
        
        // Populate dropdowns
        populateDropdown("requesterNameSelect", users);
        populateDropdown("payToSelect", users);
        
        // For approval fields, we'll populate them based on transaction type selection
        // Don't populate them with all users initially
        
        // Auto-fill preparedBy with logged-in user
        autoFillPreparedBy(users);
        
        // Add event listener to requesterNameSelect for department only (remove payToSelect related code)
        const requesterSelect = document.getElementById("requesterNameSelect");
        const requesterSearchInput = document.getElementById("requesterNameSearch");
        
        if (requesterSelect) {
            requesterSelect.addEventListener("change", function() {
                const selectedName = this.value;
                
                // Auto-fill department based on requester
                autoFillDepartmentFromRequester(selectedName, users);
            });
        }
        
        // Add change event for the search input as well
        if (requesterSearchInput) {
            requesterSearchInput.addEventListener("change", function() {
                const selectedName = this.value;
                
                // Auto-fill department based on requester
                autoFillDepartmentFromRequester(selectedName, users);
            });
        }
        
        // Add event listener for transaction type dropdown to populate superior employees
        const transactionTypeSelect = document.getElementById("typeOfTransaction");
        if (transactionTypeSelect) {
            transactionTypeSelect.addEventListener("change", function() {
                const selectedTransactionType = this.value;
                if (selectedTransactionType) {
                    console.log('Transaction type changed to:', selectedTransactionType);
                    populateAllSuperiorEmployeeDropdowns(selectedTransactionType);
                }
            });
        }
        
    } catch (error) {
        console.error("Error fetching users:", error);
    }
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
            console.log("Department data:", data);
            populateDepartmentSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching departments:', error);
        });
}

// Helper function to populate department dropdown
function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("department");
    if (!departmentSelect) return;
    
    // Clear existing options except the first one (if any)
    departmentSelect.innerHTML = '<option value="" disabled selected>Select Department</option>';
    
    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.name;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
    });
    
    // Disable department selection since it will be auto-filled based on requester
    departmentSelect.disabled = true;
    departmentSelect.classList.add('bg-gray-200', 'cursor-not-allowed');
}

// Helper function to auto-fill preparedBy with logged-in user
function autoFillPreparedBy(users) {
    const currentUserId = getUserId();
    if (!currentUserId) return;
    
    // Find the current user in the users array
    const currentUser = users.find(user => user.id == currentUserId);
    if (!currentUser) return;
    
    // Construct full name
    let displayName = currentUser.fullName;
    
    // Set the preparedBy search input value and disable it
    const preparedBySearch = document.getElementById("preparedBySearch");
    if (preparedBySearch) {
        preparedBySearch.value = displayName;
        preparedBySearch.disabled = true;
        preparedBySearch.classList.add('bg-gray-200', 'cursor-not-allowed');
    }
    
    // Also set the select element value to ensure it's available for form submission
    const preparedBySelect = document.getElementById("preparedBySelect");
    if (preparedBySelect) {
        // Clear existing options
        preparedBySelect.innerHTML = '<option value="" disabled selected>Choose Name</option>';
        
        // Add current user as an option
        const option = document.createElement('option');
        option.value = currentUserId;
        option.textContent = displayName;
        option.selected = true;
        preparedBySelect.appendChild(option);
        
        console.log('Auto-filled preparedBy select with current user:', currentUserId);
    }
}

// Helper function to auto-fill department based on selected requester ID
async function autoFillDepartmentFromRequesterById(userId) {
    console.log('Auto-filling department for user ID:', userId);
    
    try {
        // First try to use cached users data from window.allUsers
        if (window.allUsers && window.allUsers.length > 0) {
            const user = window.allUsers.find(u => u.id === userId);
            if (user && user.department) {
                console.log('Found user in cached data:', user);
                console.log('Department from cache:', user.department);
                setDepartmentValue(user.department);
                return;
            } else {
                console.log('User not found in cache or no department in cached data');
            }
        }
        
        // Fallback: Fetch full user details from API to get department
        console.log('Fetching user details from API...');
        const response = await fetch(`${BASE_URL}/api/users/${userId}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch user details');
        }
        
        const user = result.data;
        console.log('User details from API:', user);
        
        // Try different department field names that might exist
        const userDepartment = user.department || 
                              user.departmentName || 
                              user.dept ||
                              user.departement;
        
        console.log('User department from API:', userDepartment);
        
        if (!userDepartment) {
            console.log('No department found for user, checking if user has employeeId for additional lookup');
            
            // Try to fetch department via employee endpoint if available
            if (user.employeeId) {
                try {
                    const employeeResponse = await fetch(`${BASE_URL}/api/employees/${user.employeeId}`);
                    if (employeeResponse.ok) {
                        const employeeResult = await employeeResponse.json();
                        if (employeeResult.status && employeeResult.data) {
                            const employeeDepartment = employeeResult.data.department || 
                                                     employeeResult.data.departmentName ||
                                                     employeeResult.data.dept;
                            if (employeeDepartment) {
                                console.log('Found department via employee lookup:', employeeDepartment);
                                setDepartmentValue(employeeDepartment);
                                return;
                            }
                        }
                    }
                } catch (error) {
                    console.log('Employee lookup failed:', error);
                }
            }
            
            const departmentSelect = document.getElementById("department");
            if (departmentSelect) {
                departmentSelect.disabled = false;
                departmentSelect.classList.remove('bg-gray-200', 'cursor-not-allowed');
                departmentSelect.classList.add('bg-white');
                
                // Update the default option to indicate manual selection is needed
                const defaultOption = departmentSelect.querySelector('option[value=""]');
                if (defaultOption) {
                    defaultOption.textContent = 'Please select department manually';
                    defaultOption.style.color = '#f59e0b'; // amber color for attention
                }
            }
            return;
        }
        
        // Set department value (will create option if it doesn't exist)
        setDepartmentValue(userDepartment);
        
    } catch (error) {
        console.error('Error fetching user department:', error);
    }
}

// Helper function to set department value, creating option if it doesn't exist
function setDepartmentValue(departmentName) {
    console.log('setDepartmentValue called with:', departmentName);
    
    const departmentSelect = document.getElementById("department");
    if (!departmentSelect) {
        console.error('Department select element not found');
        return;
    }
    
    if (!departmentName) {
        console.error('Department name is empty or null');
        return;
    }
    
    console.log('Current department options:', Array.from(departmentSelect.options).map(opt => ({value: opt.value, text: opt.textContent})));
    
    // Temporarily enable the select to change its value
    const wasDisabled = departmentSelect.disabled;
    departmentSelect.disabled = false;
    
    // Try to find existing option
    let optionExists = false;
    for (let i = 0; i < departmentSelect.options.length; i++) {
        if (departmentSelect.options[i].value === departmentName || 
            departmentSelect.options[i].textContent === departmentName) {
            departmentSelect.selectedIndex = i;
            optionExists = true;
            console.log('Found existing department option at index:', i);
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
        console.log('New department option created and selected:', departmentName);
    }
    
    // Restore disabled state
    departmentSelect.disabled = wasDisabled;
    console.log('Department auto-filled successfully:', departmentName);
    console.log('Final selected value:', departmentSelect.value);
    
    // Trigger dependency change to update categories if transaction type is also selected
    const transactionType = document.getElementById('typeOfTransaction').value;
    if (transactionType) {
        handleDependencyChange();
    }
}

// Legacy function for backward compatibility (keeping the old function name)
function autoFillDepartmentFromRequester(requesterName, users) {
    // Find user by name and get their ID
    const selectedUser = users.find(user => {
        return user.name === requesterName;
    });
    
    if (selectedUser) {
        autoFillDepartmentFromRequesterById(selectedUser.id);
    }
}

// Helper function to populate a dropdown with user data
function populateDropdown(dropdownId, users) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    // Clear existing options
    // dropdown.innerHTML = "";
    
    // Add users as options
    users.forEach(user => {
        if (!user || !user.fullName) return; // Skip users without names
        const option = document.createElement("option");
        
        // Combine names with spaces, handling empty middle/last names
        let displayName = user.fullName;
        
        // For requesterNameSelect, use full name as value instead of ID
        if (dropdownId === "requesterNameSelect") {
            option.value = displayName;
        } else {
            option.value = user.id;
        }
        
        option.textContent = displayName;
        dropdown.appendChild(option);
        
        // Auto-select for preparedBy if it's the current user
        if (dropdownId === "preparedBySelect" && user.id == getUserId()) {
            option.selected = true;
        }
    });
    
    // Store users data for searching in searchable fields
    const searchableFields = [
        "requesterNameSelect", 
        "preparedBySelect", 
        "acknowledgeBySelect", 
        "checkedBySelect", 
        "approvedBySelect",
        "receivedBySelect",
        "payToSelect"
    ];
    
    if (searchableFields.includes(dropdownId)) {
        const searchInput = document.getElementById(dropdownId.replace("Select", "Search"));
        if (searchInput) {
            // Store users data for searching
            if (dropdownId === "payToSelect") {
                // For payToSelect, store the full user object to access kansaiEmployeeId and fullName
                searchInput.dataset.users = JSON.stringify(users
                    .filter(user => user && user.fullName) // Filter out users without names
                    .map(user => ({
                        id: user.id,
                        name: user.fullName,
                        fullName: user.fullName,
                        kansaiEmployeeId: user.kansaiEmployeeId,
                        employeeId: user.employeeId
                    })));
            } else {
                // For other fields, store simplified user data
                searchInput.dataset.users = JSON.stringify(users
                    .filter(user => user && user.fullName) // Filter out users without names
                    .map(user => {
                        let displayName = user.fullName;
                        return {
                            id: user.id,
                            name: displayName
                        };
                    }));
            }
        }
    }
}

// Common function to process document with isSubmit parameter
async function processDocument(isSubmit) {
    // Step 1: Collect reimbursement details from the form
    const reimbursementDetails = [];
    const tableRows = document.querySelectorAll("#tableBody tr");
    
    tableRows.forEach(row => {
        // Get category from search input
        const categoryInput = row.querySelector('.category-search');
        const accountNameInput = row.querySelector('.account-name-search');
        const glAccountInput = row.querySelector('.gl-account');
        const inputs = row.querySelectorAll("input[type='text']:not(.category-search):not(.account-name-search):not(.gl-account), input[type='number']");
        
        if (categoryInput && accountNameInput && glAccountInput && inputs.length >= 2) {
            reimbursementDetails.push({
                category: categoryInput.value || "",
                accountName: accountNameInput.value || "",
                glAccount: glAccountInput.value || "",
                description: inputs[0].value || "", // Description input
                amount: inputs[1].value || "" // Amount input
            });
        }
    });

    // Step 2: Prepare the request data
    const getElementValue = (id) => {
        const element = document.getElementById(id);
        return element ? element.value : "";
    };
    
    // Get approval values directly from select elements or search inputs
    const getApprovalValue = (id) => {
        const selectElement = document.getElementById(`${id}Select`);
        
        // Always use the select element value which contains the ID
        let value = selectElement ? selectElement.value : "";
        
        // Special handling for preparedBy - if empty, use current user ID
        if (id === "preparedBy" && !value) {
            const currentUserId = getUserId();
            if (currentUserId) {
                value = currentUserId;
                console.log('Using current user ID for preparedBy:', currentUserId);
            }
        }
        
        return value;
    };

    // Get the selected user for payTo to extract additional information
    const payToUserId = getApprovalValue("payTo");
    let payToUser = null;
    if (payToUserId && window.allUsers) {
        payToUser = window.allUsers.find(user => user.id === payToUserId);
    }

    const reimbursementData = {
        voucherNo: getElementValue("voucherNo"),
        requesterName: document.getElementById("requesterNameSearch").value, // Use the search input value
        department: getElementValue("department"),
        payTo: getApprovalValue("payTo"), // Use select element value which contains the ID
        currency: getElementValue("currency"),
        submissionDate: getElementValue("postingDate"), // Kirim tanggal langsung tanpa konversi
        status: getElementValue("status"),
        referenceDoc: getElementValue("referenceDoc"),
        typeOfTransaction: getElementValue("typeOfTransaction"),
        remarks: getElementValue("remarks"),
        preparedBy: getApprovalValue("preparedBy"),
        checkedBy: getApprovalValue("checkedBy"),
        acknowledgedBy: getApprovalValue("acknowledgeBy"),
        approvedBy: getApprovalValue("approvedBy"),
        receivedBy: getApprovalValue("receivedBy"),
        reimbursementDetails: reimbursementDetails,
        isSubmit: isSubmit,
        // Add user information from selected payTo user
        payToNIK: payToUser ? payToUser.kansaiEmployeeId : null,
        payToName: payToUser ? payToUser.fullName : null
    };

    console.log("Sending data:", JSON.stringify(reimbursementData, null, 2));

    // Step 3: Send the POST request to create reimbursement
    const response = await fetch(`${BASE_URL}/api/reimbursements`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reimbursementData)
    });

    let errorText = '';
    try {
        const errorData = await response.clone().json();
        if (errorData && errorData.message) {
            errorText = errorData.message;
        }
        if (errorData && errorData.errors) {
            errorText += ': ' + JSON.stringify(errorData.errors);
        }
    } catch (e) {
        // If we can't parse the error as JSON, use text
        errorText = await response.clone().text();
    }

    if (!response.ok) {
        throw new Error(errorText || `API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.status || result.code !== 200) {
        throw new Error(result.message || 'Failed to create reimbursement');
    }

    // Step 4: Upload attachments if there are any
    const reimbursementId = result.data.id;
    
    if (uploadedFiles.length > 0) {
        const formData = new FormData();
        
        uploadedFiles.forEach(file => {
            formData.append('files', file);
        });

        const uploadResponse = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/upload`, {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.message || `Upload error: ${uploadResponse.status}`);
        }

        const uploadResult = await uploadResponse.json();
        
        if (!uploadResult.status || uploadResult.code !== 200) {
            throw new Error(uploadResult.message || 'Failed to upload attachments');
        }
    }
    
    return result;
}

// Function to fetch business partners
async function fetchBusinessPartners() {
    try {
        const response = await fetch(`${BASE_URL}/api/business-partners/type/employee`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch business partners');
        }
        
        businessPartners = result.data;
        console.log('Stored', businessPartners.length, 'business partners in global cache');
        
    } catch (error) {
        console.error("Error fetching business partners:", error);
    }
}

// Function to fetch transaction types
async function fetchTransactionTypes() {
    try {
        const response = await fetch(`${BASE_URL}/api/transactiontypes/filter?category=Reimbursement`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch transaction types');
        }
        
        transactionTypes = result.data;
        console.log('Stored', transactionTypes.length, 'transaction types in global cache');
        
        // Populate transaction types dropdown
        populateTransactionTypesDropdown(transactionTypes);
        
    } catch (error) {
        console.error("Error fetching transaction types:", error);
    }
}

// Function to populate transaction types dropdown
function populateTransactionTypesDropdown(types) {
    const typeSelect = document.getElementById("typeOfTransaction");
    if (!typeSelect) return;
    
    // Clear existing options
    typeSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Transaction Type";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    typeSelect.appendChild(defaultOption);
    
    // Add transaction types
    types.forEach(type => {
        const option = document.createElement("option");
        option.value = type.name; // Send name as the value
        option.textContent = type.name;
        typeSelect.appendChild(option);
    });
}

// Store global data for categories and account names
// let allCategories = [];
// let allAccountNames = [];

// Function to get department ID by name
async function getDepartmentIdByName(departmentName) {
    try {
        const response = await fetch(`${BASE_URL}/api/department`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        const departments = result.data;
        
        const department = departments.find(dept => dept.name === departmentName);
        return department ? department.id : null;
    } catch (error) {
        console.error("Error fetching department ID:", error);
        return null;
    }
}

// Function to fetch categories based on department and transaction type
async function fetchCategories(departmentId, transactionType) {
    // Check cache first
    const cacheKey = `${departmentId}-${transactionType}`;
    if (categoryCache.has(cacheKey)) {
        console.log('Using cached categories for:', cacheKey);
        allCategories = categoryCache.get(cacheKey);
        updateAllCategoryDropdowns();
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/categories?departmentId=${departmentId}&menu=Reimbursement&transactionType=${encodeURIComponent(transactionType)}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const categories = await response.json();
        allCategories = categories;
        
        // Cache the result
        categoryCache.set(cacheKey, categories);
        console.log('Fetched and cached categories:', categories);
        
        // Update all category dropdowns in table rows
        updateAllCategoryDropdowns();
        
    } catch (error) {
        console.error("Error fetching categories:", error);
        allCategories = [];
        updateAllCategoryDropdowns();
    }
}

// Function to fetch account names based on category, department and transaction type
async function fetchAccountNames(category, departmentId, transactionType) {
    // Check cache first
    const cacheKey = `${category}-${departmentId}-${transactionType}`;
    if (accountNameCache.has(cacheKey)) {
        console.log('Using cached account names for:', cacheKey);
        return accountNameCache.get(cacheKey);
    }
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/account-names?category=${encodeURIComponent(category)}&departmentId=${departmentId}&menu=Reimbursement&transactionType=${encodeURIComponent(transactionType)}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const accountNames = await response.json();
        allAccountNames = accountNames;
        
        // Cache the result
        accountNameCache.set(cacheKey, accountNames);
        console.log('Fetched and cached account names:', accountNames);
        
        return accountNames;
        
    } catch (error) {
        console.error("Error fetching account names:", error);
        return [];
    }
}

// Function to update all category dropdowns
function updateAllCategoryDropdowns() {
    const categorySearchInputs = document.querySelectorAll('.category-search');
    
    categorySearchInputs.forEach(input => {
        // Store categories data for searching
        input.dataset.categories = JSON.stringify(allCategories);
        
        // Clear current value if categories changed
        const currentValue = input.value;
        if (currentValue && !allCategories.includes(currentValue)) {
            input.value = '';
            const row = input.closest('tr');
            const accountNameSearch = row.querySelector('.account-name-search');
            const glAccount = row.querySelector('.gl-account');
            if (accountNameSearch) accountNameSearch.value = '';
            if (glAccount) glAccount.value = '';
        }
    });
}

// Function to setup event listeners for table rows
function setupRowEventListeners(row) {
    const categorySearch = row.querySelector('.category-search');
    const categoryDropdown = row.querySelector('.category-dropdown');
    const accountNameSearch = row.querySelector('.account-name-search');
    const accountNameDropdown = row.querySelector('.account-name-dropdown');
    
    if (categorySearch) {
        // Populate with existing categories if available
        if (allCategories.length > 0) {
            categorySearch.dataset.categories = JSON.stringify(allCategories);
        }
        
        // Add immediate focus handler for faster response
        categorySearch.addEventListener('focus', function() {
            // Pre-populate dropdown immediately if categories are available
            if (allCategories.length > 0) {
                this.dataset.categories = JSON.stringify(allCategories);
                filterCategories(this);
            } else {
                // Try to load categories if department and transaction type are selected
                const departmentName = document.getElementById('department').value;
                const transactionType = document.getElementById('typeOfTransaction').value;
                if (departmentName && transactionType) {
                    console.log('Categories not loaded on focus, triggering fetch...');
                    handleDependencyChange().then(() => {
                        if (allCategories.length > 0) {
                            this.dataset.categories = JSON.stringify(allCategories);
                            filterCategories(this);
                        }
                    });
                }
            }
        });
        
        categorySearch.addEventListener('input', function() {
            // Ensure categories are loaded before filtering
            if (allCategories.length === 0) {
                const departmentName = document.getElementById('department').value;
                const transactionType = document.getElementById('typeOfTransaction').value;
                if (departmentName && transactionType) {
                    console.log('Categories not loaded during input, triggering fetch...');
                    handleDependencyChange().then(() => {
                        if (allCategories.length > 0) {
                            this.dataset.categories = JSON.stringify(allCategories);
                            filterCategories(this);
                        }
                    });
                }
            } else {
                filterCategories(this);
            }
        });
        
        // Add click handler for immediate dropdown display
        categorySearch.addEventListener('click', function() {
            // Ensure categories are loaded if not already available
            if (allCategories.length === 0) {
                const departmentName = document.getElementById('department').value;
                const transactionType = document.getElementById('typeOfTransaction').value;
                if (departmentName && transactionType) {
                    console.log('Categories not loaded, triggering fetch on click...');
                    handleDependencyChange().then(() => {
                        if (allCategories.length > 0) {
                            this.dataset.categories = JSON.stringify(allCategories);
                            filterCategories(this);
                        }
                    });
                }
            } else {
                filterCategories(this);
            }
        });
    }
    
    if (accountNameSearch) {
        // Add immediate focus handler for faster response
        accountNameSearch.addEventListener('focus', function() {
            // Try to load account names if category is selected
            const row = this.closest('tr');
            const categoryInput = row.querySelector('.category-search');
            if (categoryInput && categoryInput.value) {
                loadAccountNamesForRow(row).then(() => {
                    filterAccountNames(this);
                });
            } else {
                filterAccountNames(this);
            }
        });
        
        accountNameSearch.addEventListener('input', function() {
            // Ensure account names are loaded before filtering
            const accountNames = JSON.parse(this.dataset.accountNames || '[]');
            if (accountNames.length === 0) {
                const row = this.closest('tr');
                const categoryInput = row.querySelector('.category-search');
                if (categoryInput && categoryInput.value) {
                    console.log('Account names not loaded during input, triggering fetch...');
                    loadAccountNamesForRow(row).then(() => {
                        const updatedAccountNames = JSON.parse(this.dataset.accountNames || '[]');
                        if (updatedAccountNames.length > 0) {
                            filterAccountNames(this);
                        }
                    });
                }
            } else {
                filterAccountNames(this);
            }
        });
        
        // Add click handler for immediate dropdown display
        accountNameSearch.addEventListener('click', function() {
            const accountNames = JSON.parse(this.dataset.accountNames || '[]');
            if (accountNames.length === 0) {
                // Try to load account names if category is selected
                const row = this.closest('tr');
                const categoryInput = row.querySelector('.category-search');
                if (categoryInput && categoryInput.value) {
                    console.log('Account names not loaded, triggering fetch on click...');
                    loadAccountNamesForRow(row).then(() => {
                        const updatedAccountNames = JSON.parse(this.dataset.accountNames || '[]');
                        if (updatedAccountNames.length > 0) {
                            filterAccountNames(this);
                        }
                    });
                }
            } else {
                filterAccountNames(this);
            }
        });
    }
}

// Function to filter and display categories
function filterCategories(input) {
    const searchText = input.value.toLowerCase();
    const dropdown = input.parentElement.querySelector('.category-dropdown');
    
    if (!dropdown) return;
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    try {
        const categories = JSON.parse(input.dataset.categories || '[]');
        const filtered = categories.filter(category => 
            category.toLowerCase().includes(searchText)
        );
        
        // Display search results with highlighting
        filtered.forEach(category => {
            const option = document.createElement('div');
            option.className = 'dropdown-item hover:bg-blue-50 cursor-pointer';
            option.innerText = category;
            option.onclick = function() {
                input.value = category;
                const selectElement = input.parentElement.querySelector('.category-select');
                if (selectElement) {
                    selectElement.value = category;
                }
                dropdown.classList.add('hidden');
                
                // Clear account name and GL account when category changes
                const row = input.closest('tr');
                const accountNameSearch = row.querySelector('.account-name-search');
                const glAccount = row.querySelector('.gl-account');
                if (accountNameSearch) accountNameSearch.value = '';
                if (glAccount) glAccount.value = '';
                
                // Trigger account names fetch immediately
                loadAccountNamesForRow(row).then(() => {
                    console.log('Account names loaded for category:', category);
                });
            };
            dropdown.appendChild(option);
        });
        
        // Show message if no results
        if (filtered.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'p-2 text-gray-500';
            noResults.innerText = 'No Categories Found';
            dropdown.appendChild(noResults);
        }
        
        // Show dropdown immediately
        dropdown.classList.remove('hidden');
        
    } catch (error) {
        console.error("Error filtering categories:", error);
    }
}

// Function to filter and display account names
function filterAccountNames(input) {
    const searchText = input.value.toLowerCase();
    const dropdown = input.parentElement.querySelector('.account-name-dropdown');
    
    if (!dropdown) return;
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    try {
        const accountNames = JSON.parse(input.dataset.accountNames || '[]');
        const filtered = accountNames.filter(account => 
            account.accountName.toLowerCase().includes(searchText)
        );
        
        // Display search results with highlighting
        filtered.forEach(account => {
            const option = document.createElement('div');
            option.className = 'dropdown-item hover:bg-blue-50 cursor-pointer';
            option.innerText = account.accountName;
            option.onclick = function() {
                input.value = account.accountName;
                const selectElement = input.parentElement.querySelector('.account-name-select');
                if (selectElement) {
                    selectElement.value = account.accountName;
                }
                dropdown.classList.add('hidden');
                
                // Auto-fill GL Account immediately
                const row = input.closest('tr');
                const glAccount = row.querySelector('.gl-account');
                if (glAccount) {
                    glAccount.value = account.coa;
                    console.log('GL Account auto-filled:', account.coa);
                }
            };
            dropdown.appendChild(option);
        });
        
        // Show message if no results
        if (filtered.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'p-2 text-gray-500';
            noResults.innerText = 'No Account Names Found';
            dropdown.appendChild(noResults);
        }
        
        // Show dropdown immediately
        dropdown.classList.remove('hidden');
        
    } catch (error) {
        console.error("Error filtering account names:", error);
    }
}

// Function to load account names for a specific row
async function loadAccountNamesForRow(row) {
    const categoryInput = row.querySelector('.category-search');
    const accountNameInput = row.querySelector('.account-name-search');
    
    if (!categoryInput || !accountNameInput) return;
    
    const category = categoryInput.value;
    if (!category) return;
    
    // Get current department and transaction type
    const departmentName = document.getElementById('department').value;
    const transactionType = document.getElementById('typeOfTransaction').value;
    
    if (!departmentName || !transactionType) {
        console.log('Department or transaction type not selected');
        return;
    }
    
    try {
        const departmentId = await getDepartmentIdByName(departmentName);
        if (!departmentId) {
            console.error('Could not find department ID');
            return;
        }
        
        // Check if we already have account names for this combination
        const cacheKey = `${category}-${departmentId}-${transactionType}`;
        if (accountNameCache.has(cacheKey)) {
            const cachedAccountNames = accountNameCache.get(cacheKey);
            accountNameInput.dataset.accountNames = JSON.stringify(cachedAccountNames);
            console.log('Using cached account names for:', cacheKey);
            return;
        }
        
        const accountNames = await fetchAccountNames(category, departmentId, transactionType);
        
        // Store account names data for this row
        accountNameInput.dataset.accountNames = JSON.stringify(accountNames);
        
    } catch (error) {
        console.error('Error loading account names for row:', error);
    }
}

// Function to handle department or transaction type changes
async function handleDependencyChange() {
    const departmentName = document.getElementById('department').value;
    const transactionType = document.getElementById('typeOfTransaction').value;
    
    if (!departmentName || !transactionType) {
        console.log('Department or transaction type not fully selected');
        allCategories = [];
        updateAllCategoryDropdowns();
        return;
    }
    
    try {
        const departmentId = await getDepartmentIdByName(departmentName);
        if (!departmentId) {
            console.error('Could not find department ID');
            return;
        }
        
        // Fetch new categories
        await fetchCategories(departmentId, transactionType);
        
    } catch (error) {
        console.error('Error handling dependency change:', error);
    }
}

// Function to preload common data for faster loading
async function preloadCommonData() {
    try {
        // Preload categories for common department-transaction type combinations
        const commonCombinations = [
            { departmentId: 1, transactionType: 'Travel' },
            { departmentId: 1, transactionType: 'Office Supplies' },
            { departmentId: 2, transactionType: 'Travel' },
            { departmentId: 2, transactionType: 'Office Supplies' }
        ];
        
        console.log('Preloading common categories...');
        for (const combo of commonCombinations) {
            await fetchCategories(combo.departmentId, combo.transactionType);
        }
        console.log('Common categories preloaded');
        
    } catch (error) {
        console.error('Error preloading common data:', error);
    }
}

// Function to check and load pre-filled data
function checkAndLoadPreFilledData() {
    const departmentName = document.getElementById('department').value;
    const transactionType = document.getElementById('typeOfTransaction').value;
    
    if (departmentName && transactionType) {
        console.log('Pre-filled data detected, triggering category fetch...');
        handleDependencyChange();
        
        // Also check if there are existing rows and populate them
        const existingRows = document.querySelectorAll('#tableBody tr');
        existingRows.forEach(row => {
            const categorySearch = row.querySelector('.category-search');
            if (categorySearch && allCategories.length > 0) {
                categorySearch.dataset.categories = JSON.stringify(allCategories);
                console.log('Pre-populated categories for existing row');
            }
        });
    }
}

// Function to populate categories for a new row
function populateCategoriesForNewRow(row) {
    const categorySearch = row.querySelector('.category-search');
    
    if (categorySearch && allCategories.length > 0) {
        // Store categories data for the new row
        categorySearch.dataset.categories = JSON.stringify(allCategories);
        console.log('Populated categories for new row:', allCategories.length, 'categories');
    } else if (categorySearch) {
        console.log('No categories available to populate for new row');
        
        // Check if department and transaction type are selected, if so trigger fetch
        const departmentName = document.getElementById('department').value;
        const transactionType = document.getElementById('typeOfTransaction').value;
        
        if (departmentName && transactionType) {
            console.log('Department and transaction type are selected, triggering category fetch...');
            handleDependencyChange().then(() => {
                // After categories are fetched, populate this row
                if (allCategories.length > 0) {
                    categorySearch.dataset.categories = JSON.stringify(allCategories);
                    console.log('Categories populated after fetch for new row');
                }
            });
        }
    }
}

// New function to fetch superior employees based on document type, transaction type, and superior level
async function fetchSuperiorEmployees(documentType, transactionType, superiorLevel) {
    try {
        const currentUserId = getUserId();
        if (!currentUserId) {
            console.error('No current user ID found');
            return [];
        }

        const response = await fetch(`${BASE_URL}/api/employee-superior-document-approvals/user/${currentUserId}/document-type/${documentType}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch superior employees');
        }
        
        const allSuperiors = result.data;
        
        // Filter by transaction type and superior level
        const filteredSuperiors = allSuperiors.filter(superior => {
            // Map transaction type to API transaction type
            const transactionTypeMap = {
                'Entertainment': 'EN',
                'Golf Competition': 'GC',
                'Medical': 'ME',
                'Others': 'OT',
                'Travelling': 'TR'
            };
            
            const apiTransactionType = transactionTypeMap[transactionType];
            if (!apiTransactionType) {
                console.warn(`Unknown transaction type: ${transactionType}`);
                return false;
            }
            
            return superior.typeTransaction === apiTransactionType && superior.superiorLevel === superiorLevel;
        });
        
        console.log(`Found ${filteredSuperiors.length} superior employees for ${documentType}/${transactionType}/${superiorLevel}`);
        
        // Fetch full user details for each superior to get full names
        const superiorsWithFullNames = [];
        
        for (const superior of filteredSuperiors) {
            try {
                // Try to get full name from cached users first
                let fullName = superior.superiorName; // Default to the name from API
                
                if (window.allUsers && window.allUsers.length > 0) {
                    const user = window.allUsers.find(u => u.id === superior.superiorUserId);
                    if (user && user.fullName) {
                        fullName = user.fullName;
                        console.log(`Found full name in cache for ${superior.superiorUserId}: ${fullName}`);
                    }
                } else {
                    // Fetch user details from API if not in cache
                    try {
                        const userResponse = await fetch(`${BASE_URL}/api/users/${superior.superiorUserId}`);
                        if (userResponse.ok) {
                            const userResult = await userResponse.json();
                            if (userResult.status && userResult.data && userResult.data.fullName) {
                                fullName = userResult.data.fullName;
                                console.log(`Fetched full name from API for ${superior.superiorUserId}: ${fullName}`);
                            }
                        }
                    } catch (error) {
                        console.warn(`Failed to fetch full name for user ${superior.superiorUserId}:`, error);
                        // Keep the original superiorName if API call fails
                    }
                }
                
                superiorsWithFullNames.push({
                    ...superior,
                    superiorFullName: fullName
                });
                
            } catch (error) {
                console.warn(`Error processing superior ${superior.superiorUserId}:`, error);
                // Add the superior with original name if there's an error
                superiorsWithFullNames.push({
                    ...superior,
                    superiorFullName: superior.superiorName
                });
            }
        }
        
        return superiorsWithFullNames;
        
    } catch (error) {
        console.error("Error fetching superior employees:", error);
        return [];
    }
}

// Function to map superior level to field ID
function getSuperiorLevelForField(fieldId) {
    const levelMap = {
        'preparedBySelect': 'PR',
        'checkedBySelect': 'CH',
        'acknowledgeBySelect': 'AC',
        'approvedBySelect': 'AP',
        'receivedBySelect': 'RE'
    };
    return levelMap[fieldId] || null;
}

// Function to populate superior employee dropdown
async function populateSuperiorEmployeeDropdown(fieldId, documentType, transactionType) {
    const superiorLevel = getSuperiorLevelForField(fieldId);
    if (!superiorLevel) {
        console.error(`No superior level mapping found for field: ${fieldId}`);
        return;
    }
    
    const superiors = await fetchSuperiorEmployees(documentType, transactionType, superiorLevel);
    
    // Clear existing options
    const selectElement = document.getElementById(fieldId);
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="" disabled selected>Choose Name</option>';
    
    // Add superior employees to dropdown
    superiors.forEach(superior => {
        const option = document.createElement('option');
        option.value = superior.superiorUserId;
        option.textContent = superior.superiorFullName; // Use superiorFullName
        selectElement.appendChild(option);
    });
    
    // Update the search input dataset
    const searchInput = document.getElementById(fieldId.replace('Select', '') + 'Search');
    if (searchInput) {
        searchInput.dataset.users = JSON.stringify(superiors.map(s => ({
            id: s.superiorUserId,
            name: s.superiorFullName // Use superiorFullName
        })));
    }
    
    // Special handling for preparedBy - auto-select current user if they are in the superiors list
    if (fieldId === 'preparedBySelect') {
        const currentUserId = getUserId();
        if (currentUserId) {
            const currentUserInSuperiors = superiors.find(s => s.superiorUserId === currentUserId);
            if (currentUserInSuperiors) {
                selectElement.value = currentUserId;
                console.log('Auto-selected current user for preparedBy from superiors list');
            } else {
                // If current user is not in superiors list, add them as an option
                const currentUser = window.allUsers ? window.allUsers.find(u => u.id === currentUserId) : null;
                if (currentUser) {
                    const option = document.createElement('option');
                    option.value = currentUserId;
                    option.textContent = currentUser.fullName || currentUser.name;
                    option.selected = true;
                    selectElement.appendChild(option);
                    console.log('Added current user to preparedBy select (not in superiors list)');
                }
            }
        }
    }
    
    // Set pending approval values if they exist
    if (window.pendingApprovalValues) {
        const fieldPrefix = fieldId.replace('Select', '');
        const pendingUserId = window.pendingApprovalValues[fieldPrefix];
        if (pendingUserId) {
            // Check if the user exists in the superiors list
            const matchingSuperior = superiors.find(s => s.superiorUserId === pendingUserId);
            if (matchingSuperior) {
                selectElement.value = pendingUserId;
                const searchInput = document.getElementById(fieldId.replace('Select', '') + 'Search');
                if (searchInput) {
                    searchInput.value = matchingSuperior.superiorFullName; // Use superiorFullName
                }
                console.log(`Set pending approval value for ${fieldPrefix}:`, pendingUserId);
            }
        }
    }
}

// Function to populate all superior employee dropdowns
async function populateAllSuperiorEmployeeDropdowns(transactionType) {
    const documentType = 'RE'; // Reimbursement
    
    const approvalFields = [
        'preparedBySelect',
        'checkedBySelect', 
        'acknowledgeBySelect',
        'approvedBySelect',
        'receivedBySelect'
    ];
    
    for (const fieldId of approvalFields) {
        await populateSuperiorEmployeeDropdown(fieldId, documentType, transactionType);
    }
}
    