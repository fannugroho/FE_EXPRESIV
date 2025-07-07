let uploadedFiles = [];

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
        noResults.innerText = 'No matching requesters';
        dropdown.appendChild(noResults);
    }
    
    // Tampilkan dropdown
    dropdown.classList.remove('hidden');
}

// Function to display the list of uploaded files
function displayFileList() {
    // Get existing file list or create new one if it doesn't exist
    let fileListContainer = document.getElementById("fileList");
    
    // If container doesn't exist, create it
    if (!fileListContainer) {
        fileListContainer = document.createElement("div");
        fileListContainer.id = "fileList";
        
        // Find the file input element
        const fileInput = document.getElementById("Reference");
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

function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("department");
    departments.forEach(department => {
        const option = document.createElement('option');
        option.value = department.id;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
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
            populateUserSelects(data.data);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
}

function fetchTransactionType() {
    fetch(`${BASE_URL}/api/transactiontypes/filter?category=Settlement`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            populateTransactionTypeSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching transaction type:', error);
        });
}

function fetchBusinessPartners() {
    fetch(`${BASE_URL}/api/business-partners/type/all`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            setupBusinessPartnerSearch(data.data);
        })
        .catch(error => {
            console.error('Error fetching business partners:', error);
        });
}

function populateTransactionTypeSelect(transactionTypes) {
    const transactionTypeSelect = document.getElementById("type");
    if (transactionTypeSelect) {
        // Clear existing options and add the default selection option
        transactionTypeSelect.innerHTML = '<option value="" disabled selected>Select Type Of Transaction</option>';
        
    transactionTypes.forEach(transactionType => {
        const option = document.createElement('option');
        option.value = transactionType.name;
        option.textContent = transactionType.name;
        transactionTypeSelect.appendChild(option);
    });

        // Add event listener for transaction type change
        transactionTypeSelect.addEventListener('change', function() {
            // Remove emphasis when transaction type is selected
            if (this.value) {
                removeTransactionTypeEmphasis();
            }
            
            // Refresh all category dropdowns when transaction type changes
            refreshAllCategoryDropdowns();
        });
        
        // Add initial emphasis to transaction type since no value is selected by default
        emphasizeTransactionTypeSelection();
    }
}

function setupBusinessPartnerSearch(businessPartners) {
    // Store business partners globally for search functionality
    window.businessPartners = businessPartners.filter(bp => bp.active).map(bp => ({
        id: bp.id,
        code: bp.code,
        name: bp.name
    }));

    // Setup search functionality for paid to
    const paidToSearchInput = document.getElementById('paidToSearch');
    const paidToDropdown = document.getElementById('paidToDropdown');
    const paidToHiddenInput = document.getElementById('paidTo');
    
    if (paidToSearchInput && paidToDropdown && paidToHiddenInput) {
        // Function to filter business partners
        window.filterBusinessPartners = function() {
            const searchText = paidToSearchInput.value.toLowerCase();
            populateBusinessPartnerDropdown(searchText);
            paidToDropdown.classList.remove('hidden');
        };

        // Function to populate dropdown with filtered business partners
        function populateBusinessPartnerDropdown(filter = '') {
            paidToDropdown.innerHTML = '';
            
            const filteredPartners = window.businessPartners.filter(bp => 
                bp.code.toLowerCase().includes(filter) || 
                bp.name.toLowerCase().includes(filter)
            );
            
            filteredPartners.forEach(partner => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerHTML = `<span class="font-medium">${partner.code}</span> - ${partner.name}`;
                option.onclick = function() {
                    paidToSearchInput.value = `${partner.code} - ${partner.name}`;
                    paidToHiddenInput.value = partner.id;
                    paidToDropdown.classList.add('hidden');
                };
                paidToDropdown.appendChild(option);
            });
            
            if (filteredPartners.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No matching business partners';
                paidToDropdown.appendChild(noResults);
            }
        }

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!paidToSearchInput.contains(event.target) && !paidToDropdown.contains(event.target)) {
                paidToDropdown.classList.add('hidden');
            }
        });

        // Initial population
        populateBusinessPartnerDropdown();
    }
}

function populateUserSelects(users) {
    // Store users globally for search functionality
    window.requesters = users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        department: user.department,
        kansaiEmployeeId: user.kansaiEmployeeId
    }));
    
    // Store employees globally for employee search functionality
    window.employees = users.map(user => ({
        id: user.id,
        kansaiEmployeeId: user.kansaiEmployeeId,
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

                    // Remove requester emphasis when selected
                    removeRequesterEmphasis();

                    window.kansaiEmployeeId = requester.kansaiEmployeeId;
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
                    
                    // Refresh category dropdowns after requester selection
                    refreshAllCategoryDropdowns();
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

    // Populate approval dropdowns with auto-selection for prepared by
    const approvalSelects = [
        { id: "preparedDropdown", isPreparerField: true },
        { id: "checkedDropdown", isPreparerField: false },
        { id: "approvedDropdown", isPreparerField: false },
        { id: "acknowledgedDropdown", isPreparerField: false },
        { id: "receivedDropdown", isPreparerField: false }
    ];

    approvalSelects.forEach(selectInfo => {
        const select = document.getElementById(selectInfo.id);
        if (select) {
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.fullName;
                select.appendChild(option);
                // Auto-select and disable for Prepared by
                if(selectInfo.isPreparerField && user.id == getUserId()){
                    option.selected = true;
                    select.disabled = true;
                }
            });
        }
    });
    
    // Auto-populate and disable PreparedBy search field for logged-in user
    const loggedInUserId = getUserId();
    if (loggedInUserId) {
        const loggedInUser = users.find(user => user.id === loggedInUserId);
        if (loggedInUser) {
            const preparedSearchInput = document.getElementById('preparedDropdownSearch');
            const preparedSelect = document.getElementById('preparedDropdown');
            
            if (preparedSearchInput && preparedSelect) {
                const userName = loggedInUser.fullName;
                preparedSearchInput.value = userName;
                preparedSearchInput.disabled = true;
                preparedSearchInput.classList.add('bg-gray-100');
                preparedSelect.value = loggedInUserId;
            }
        }
    }
    
    // Auto-populate employee fields with logged-in user data (like in addCash)
    if(loggedInUserId && window.employees) {
        const loggedInEmployee = window.employees.find(emp => emp.id === loggedInUserId);
        
        if(loggedInEmployee) {
            const employeeNIK = loggedInEmployee.kansaiEmployeeId || '';
            const employeeName = loggedInEmployee.fullName || '';
            
            document.getElementById("Employee").value = employeeNIK;
            document.getElementById("EmployeeName").value = employeeName;
        }
    }
}

async function saveDocument(isSubmit = false) {
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
    
    try {
        // Get user ID from JWT token using auth.js function
        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }
        
        // Basic validation
        let kansaiEmployeeId;
        if(window.kansaiEmployeeId){
            kansaiEmployeeId = window.kansaiEmployeeId;
        }else{
            kansaiEmployeeId = document.getElementById("Employee").value;
        }

        const cashAdvanceReferenceId = document.getElementById("cashAdvanceDoc").value;
        
        
        if (!kansaiEmployeeId) {
            Swal.fire({
                icon: 'warning',
                title: 'Validation Error!',
                text: 'Employee NIK is required',
                confirmButtonColor: '#3085d6'
            });
            return;
        }
        
        if (!cashAdvanceReferenceId || cashAdvanceReferenceId === '') {
            Swal.fire({
                icon: 'warning',
                title: 'Validation Error!',
                text: 'Please select a Cash Advance Document',
                confirmButtonColor: '#3085d6'
            });
            return;
        }
        
        // Show loading alert
        Swal.fire({
            title: isSubmit ? 'Submitting...' : 'Saving...',
            text: `Please wait while we ${isSubmit ? 'submit' : 'save'} your settlement`,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Create FormData object for multipart/form-data
        const formData = new FormData();
        
        // Basic settlement fields
        const settlementRefNo = document.getElementById("contactPerson").value;
        const purpose = document.getElementById("purposed").value;
        const transactionType = document.getElementById("type").value;
        const remarks = document.getElementById("Remarks").value;
        
        // Add basic fields to FormData
        formData.append('KansaiEmployeeId', kansaiEmployeeId);
        formData.append('CashAdvanceReferenceId', cashAdvanceReferenceId);
        // Add requester ID
        // const requesterId = document.getElementById("RequesterId").value;
        // if (requesterId) formData.append('RequesterId', requesterId);
        
        if (settlementRefNo) formData.append('SettlementRefNo', settlementRefNo);
        if (purpose) formData.append('Purpose', purpose);
        if (transactionType) formData.append('TransactionType', transactionType);
        if (remarks) formData.append('Remarks', remarks);
        
        // Add Business Partner ID (Paid To)
        const paidToId = document.getElementById("paidTo").value;
        if (paidToId) {
            formData.append('PayTo', paidToId);
        }
        
        // Handle posting date
        const postingDate = document.getElementById("postingDate").value;
        if (postingDate) {
            // Send date value directly without timezone conversion
            formData.append('SubmissionDate', postingDate);
        }
        
        // Set submit flag
        formData.append('IsSubmit', isSubmit.toString());
        
        // Handle file attachments
        const fileInput = document.getElementById("Reference");
        if (fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('Attachments', fileInput.files[i]);
            }
        }
        
        // Handle table data with new structure
        const tableRows = document.getElementById("tableBody").querySelectorAll("tr");
        let detailIndex = 0;
        
        tableRows.forEach((row, index) => {
            const category = row.querySelector('.category-input').value;
            const accountName = row.querySelector('.account-name').value;
            const glAccount = row.querySelector('.coa').value;
            const description = row.querySelector('.description').value;
            const amount = row.querySelector('.total').value;
            
            if (description && amount) {
                // Add settlement items using proper model binding format
                formData.append(`SettlementItems[${detailIndex}][Category]`, category || '');
                formData.append(`SettlementItems[${detailIndex}][AccountName]`, accountName || '');
                formData.append(`SettlementItems[${detailIndex}][GLAccount]`, glAccount || '');
                formData.append(`SettlementItems[${detailIndex}][Description]`, description);
                formData.append(`SettlementItems[${detailIndex}][Amount]`, amount);
                detailIndex++;
            }
        });
        
        // Validate that we have at least one item
        if (detailIndex === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Validation Error!',
                text: 'Please add at least one item with Description and Amount',
                confirmButtonColor: '#3085d6'
            });
            return;
        }
        
        // Validate categories and account names for submit
        if (isSubmit) {
            let invalidRows = [];
            tableRows.forEach((row, index) => {
                const category = row.querySelector('.category-input').value;
                const accountName = row.querySelector('.account-name').value;
                const description = row.querySelector('.description').value;
                const amount = row.querySelector('.total').value;
                
                if (description && amount && (!category || !accountName)) {
                    invalidRows.push(index + 1);
                }
            });
            
            if (invalidRows.length > 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Validation Error!',
                    text: `Please complete category and account name selection for row(s): ${invalidRows.join(', ')}`,
                    confirmButtonColor: '#3085d6'
                });
                return;
            }
        }
        
        // Add approval workflow users
        const preparedById = document.getElementById("preparedDropdown").value;
        const checkedById = document.getElementById("checkedDropdown").value;
        const acknowledgedById = document.getElementById("acknowledgedDropdown").value;
        const approvedById = document.getElementById("approvedDropdown").value;
        const receivedById = document.getElementById("receivedDropdown").value;
        
        if (preparedById) formData.append('PreparedById', preparedById);
        if (checkedById) formData.append('CheckedById', checkedById);
        if (acknowledgedById) formData.append('AcknowledgedById', acknowledgedById);
        if (approvedById) formData.append('ApprovedById', approvedById);
        if (receivedById) formData.append('ReceivedById', receivedById);
        
        // Send the request
        const response = await fetch(`${BASE_URL}/api/settlements`, {
            method: 'POST',
            // headers: {
            //     'Authorization': `Bearer ${getToken()}`
            // },
            body: formData
        });
        
        const responseData = await response.json();
        
        if (response.ok && responseData.status) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: isSubmit ? 'Settlement has been submitted successfully!' : 'Settlement has been saved successfully!',
                confirmButtonColor: '#3085d6'
            }).then(() => {
                // Redirect to menu page
                window.location.href = '../pages/menuSettle.html';
            });
        } else {
            // Show error message
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: responseData.message || 'An error occurred while saving the settlement.',
                confirmButtonColor: '#d33'
            });
        }
    } catch (error) {
        console.error('Error saving settlement:', error);
        
        // Show error alert
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Network error. Please check your connection and try again.',
            confirmButtonColor: '#d33'
        });
    }
}

// Function to submit document (calls saveDocument with isSubmit=true)
async function submitDocument() {
    await saveDocument(true);
}

function goToMenuSettle() {
    window.location.href = "../pages/menuSettle.html";
}

// Commented out because docType element doesn't exist in this HTML
// document.getElementById("docType").addEventListener("change", function() {
// const selectedValue = this.value;
// const prTable = document.getElementById("settleTable");

// if (selectedValue === "Pilih") {
//     prTable.style.display = "none";
// } else {
//     prTable.style.display = "table";
// }
// });

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

async function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td class="p-2 border relative">
            <input type="text" class="category-input w-full" placeholder="Select requester and transaction type first" disabled />
            <div class="category-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-40 overflow-y-auto"></div>
        </td>
        <td class="p-2 border">
            <select class="account-name w-full bg-gray-100" disabled>
                <option value="">Select Account Name</option>
            </select>
        </td>
        <td class="p-2 border">
            <input type="text" class="coa w-full" readonly style="background-color: #f3f4f6;" />
        </td>
        <td class="p-2 border">
            <input type="text" class="description w-full" maxlength="200" />
        </td>
        <td class="p-2 border">
            <input type="number" class="total w-full" maxlength="10" required step="0.01"/>
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;

    tableBody.appendChild(newRow);
    
    // Setup category dropdown for the new row
    await setupCategoryDropdown(newRow);
}

function deleteRow(button) {
    button.closest("tr").remove(); // Hapus baris tempat tombol diklik
}

// Add function to fetch and populate cash advance dropdown
async function loadCashAdvanceOptions() {
    const dropdown = document.getElementById('cashAdvanceDoc');
    
    try {
        // Show loading state
        dropdown.innerHTML = '<option value="" disabled selected>Loading...</option>';
        const userid = getUserId();
        
        const response = await fetch(`${BASE_URL}/api/cash-advance/approved/prepared-by/${userid}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Clear dropdown and add default option
        dropdown.innerHTML = '<option value="" disabled selected>Select Cash Advance</option>';
        
        // Populate dropdown with API data
        if (responseData.status && responseData.data && Array.isArray(responseData.data)) {
            responseData.data.forEach(cashAdvance => {
                const option = document.createElement('option');
                option.value = cashAdvance.id;
                option.textContent = cashAdvance.cashAdvanceNo;
                dropdown.appendChild(option);           
            });
        } else {
            dropdown.innerHTML = '<option value="" disabled selected>No data available</option>';
        }
        
    } catch (error) {
        console.error('Error loading cash advance options:', error);
        dropdown.innerHTML = '<option value="" disabled selected>Error loading data</option>';
        
        // Show error alert
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to load cash advance options. Please refresh the page and try again.',
            confirmButtonColor: '#d33'
        });
    }
}

// Function to set current date as default
function setDefaultDate() {
    const postingDateInput = document.getElementById("postingDate");
    if (postingDateInput) {
        const now = new Date();
        // Format date for date input (YYYY-MM-DD)
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        
        const currentDate = `${year}-${month}-${day}`;
        postingDateInput.value = currentDate;
    }
}



// Load cash advance options when page loads
document.addEventListener('DOMContentLoaded', async function() {
    loadCashAdvanceOptions();
    fetchDepartments();
    fetchUsers();
    fetchTransactionType();
    fetchBusinessPartners();
    setDefaultDate(); // Set default date
    
    // Setup initial row after a small delay to ensure DOM is ready
    setTimeout(async () => {
        const firstRow = document.querySelector('#tableBody tr');
        if (firstRow) {
            await setupCategoryDropdown(firstRow);
        }
        
        // Add initial emphasis to both requester and transaction type
        emphasizeRequesterSelection();
        emphasizeTransactionTypeSelection();
    }, 500);
    
    // Add event listener for department change
    const departmentSelect = document.getElementById("department");
    if (departmentSelect) {
        departmentSelect.addEventListener('change', function() {
            refreshAllCategoryDropdowns();
        });
    }
    
    // Setup event listener untuk hide dropdown saat klik di luar
    document.addEventListener('click', function(event) {
        const dropdowns = [
            'preparedDropdownDropdown', 
            'checkedDropdownDropdown', 
            'approvedDropdownDropdown', 
            'acknowledgedDropdownDropdown',
            'receivedDropdownDropdown'
        ];
        
        const searchInputs = [
            'preparedDropdownSearch', 
            'checkedDropdownSearch', 
            'approvedDropdownSearch', 
            'acknowledgedDropdownSearch',
            'receivedDropdownSearch'
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
    
    // Trigger initial dropdown on focus for each search field
    const searchFields = [
        'preparedDropdownSearch',
        'checkedDropdownSearch',
        'approvedDropdownSearch',
        'acknowledgedDropdownSearch',
        'receivedDropdownSearch'
    ];
    
    searchFields.forEach(fieldId => {
        const searchInput = document.getElementById(fieldId);
        if (searchInput) {
            searchInput.addEventListener('focus', function() {
                const actualFieldId = fieldId.replace('Search', '');
                filterUsers(actualFieldId);
            });
        }
    });
});

// Function to get available categories based on department and transaction type from API
async function getAvailableCategories(departmentId, transactionType) {
    if (!departmentId || !transactionType) return [];
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/categories?departmentId=${departmentId}&menu=Cash Advance Settlement&transactionType=${transactionType}`);
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        return data.data || data; // Handle both wrapped and direct array responses
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

// Function to get available account names based on category, department, and transaction type from API
async function getAvailableAccountNames(category, departmentId, transactionType) {
    if (!category || !departmentId || !transactionType) return [];
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/account-names?category=${encodeURIComponent(category)}&departmentId=${departmentId}&menu=Cash Advance Settlement&transactionType=${transactionType}`);
        if (!response.ok) {
            throw new Error('Failed to fetch account names');
        }
        const data = await response.json();
        return data.data || data; // Handle both wrapped and direct array responses
    } catch (error) {
        console.error('Error fetching account names:', error);
        return [];
    }
}

// Function to get COA based on category, account name, department, and transaction type from API
async function getCOA(category, accountName, departmentId, transactionType) {
    if (!category || !accountName || !departmentId || !transactionType) return '';
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/coa?category=${encodeURIComponent(category)}&accountName=${encodeURIComponent(accountName)}&departmentId=${departmentId}&menu=Cash Advance Settlement&transactionType=${transactionType}`);
        if (!response.ok) {
            throw new Error('Failed to fetch COA');
        }
        const data = await response.json();
        return data.data?.coa || data.coa || ''; // Handle different response structures
    } catch (error) {
        console.error('Error fetching COA:', error);
        return '';
    }
}

// Function to add visual emphasis to requester selection
function emphasizeRequesterSelection() {
    const requesterSearchInput = document.getElementById("requesterSearch");
    if (requesterSearchInput && !requesterSearchInput.value) {
        requesterSearchInput.style.border = '2px solid #ef4444';
        requesterSearchInput.style.backgroundColor = '#fef2f2';
        
        // Add a helper text
        const helperText = document.createElement('div');
        helperText.id = 'requester-helper';
        helperText.className = 'text-red-600 text-sm mt-1 font-medium';
        helperText.textContent = '⚠️ Please select a requester first to auto-fill department';
        
        if (!document.getElementById('requester-helper')) {
            requesterSearchInput.parentElement.appendChild(helperText);
        }
    }
}

// Function to remove requester emphasis
function removeRequesterEmphasis() {
    const requesterSearchInput = document.getElementById("requesterSearch");
    const helperText = document.getElementById('requester-helper');
    
    if (requesterSearchInput) {
        requesterSearchInput.style.border = '';
        requesterSearchInput.style.backgroundColor = '';
    }
    
    if (helperText) {
        helperText.remove();
    }
}

// Function to add visual emphasis to transaction type selection
function emphasizeTransactionTypeSelection() {
    const transactionTypeSelect = document.getElementById("type");
    if (transactionTypeSelect && !transactionTypeSelect.value) {
        transactionTypeSelect.style.border = '2px solid #f59e0b';
        transactionTypeSelect.style.backgroundColor = '#fef3c7';
        
        // Add a helper text
        const helperText = document.createElement('div');
        helperText.id = 'transaction-type-helper';
        helperText.className = 'text-amber-600 text-sm mt-1 font-medium';
        helperText.textContent = '⚠️ Please select transaction type to enable expense categories';
        
        if (!document.getElementById('transaction-type-helper')) {
            // Insert the helper text right after the transaction type select element
            transactionTypeSelect.insertAdjacentElement('afterend', helperText);
        }
    }
}

// Function to remove transaction type emphasis
function removeTransactionTypeEmphasis() {
    const transactionTypeSelect = document.getElementById("type");
    const helperText = document.getElementById('transaction-type-helper');
    
    if (transactionTypeSelect) {
        transactionTypeSelect.style.border = '';
        transactionTypeSelect.style.backgroundColor = '';
    }
    
    if (helperText) {
        helperText.remove();
    }
}



// Function to update field states based on prerequisites
function updateFieldsBasedOnPrerequisites(row) {
    const categoryInput = row.querySelector('.category-input');
    const accountNameSelect = row.querySelector('.account-name');
    
    const departmentSelect = document.getElementById("department");
    const transactionTypeSelect = document.getElementById("type");
    const requesterSearchInput = document.getElementById("requesterSearch");
    
    const departmentId = departmentSelect?.value;
    const transactionType = transactionTypeSelect?.value;
    const requesterValue = requesterSearchInput?.value;
    const categoryValue = categoryInput?.value;
    
    if (!requesterValue || !departmentId || !transactionType) {
        // Disable category input
        if (categoryInput) {
            categoryInput.disabled = true;
            categoryInput.placeholder = 'Select requester and transaction type first';
            categoryInput.classList.add('bg-gray-100');
        }
        // Disable account name
        if (accountNameSelect) {
            accountNameSelect.disabled = true;
            accountNameSelect.classList.add('bg-gray-100');
        }
    } else {
        // Enable category input
        if (categoryInput) {
            categoryInput.disabled = false;
            categoryInput.placeholder = 'Search category...';
            categoryInput.classList.remove('bg-gray-100');
        }
        
        // Check if category is selected to enable account name
        if (!categoryValue) {
            if (accountNameSelect) {
                accountNameSelect.disabled = true;
                accountNameSelect.classList.add('bg-gray-100');
            }
        } else {
            enableAccountNameField(row);
        }
    }
}

// Function to setup category dropdown for a row
async function setupCategoryDropdown(row) {
    const categoryInput = row.querySelector('.category-input');
    const categoryDropdown = row.querySelector('.category-dropdown');
    const accountNameSelect = row.querySelector('.account-name');
    const coaInput = row.querySelector('.coa');
    
    if (!categoryInput || !categoryDropdown) return;
    
    // Initially disable category input and account name
    updateFieldsBasedOnPrerequisites(row);
    
    // Get current values
    const departmentSelect = document.getElementById("department");
    const transactionTypeSelect = document.getElementById("type");
    const requesterSearchInput = document.getElementById("requesterSearch");
    
    categoryInput.addEventListener('input', async function() {
        const departmentId = departmentSelect.value;
        const transactionType = transactionTypeSelect.value;
        const requesterValue = requesterSearchInput.value;
        
        // Validate prerequisites
        if (!requesterValue || !departmentId || !transactionType) {
            showValidationMessage(categoryInput, 'Please select requester and transaction type first');
            categoryDropdown.classList.add('hidden');
            return;
        }
        
        const searchText = this.value.toLowerCase();
        const availableCategories = await getAvailableCategories(departmentId, transactionType);
        
        // Clear dropdown
        categoryDropdown.innerHTML = '';
        
        // Filter categories based on search text
        const filteredCategories = availableCategories.filter(category => 
            category.toLowerCase().includes(searchText)
        );
        
        if (filteredCategories.length > 0) {
            filteredCategories.forEach(category => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.textContent = category;
                option.onclick = function() {
                    categoryInput.value = category;
                    categoryDropdown.classList.add('hidden');
                    
                    // Update account name dropdown
                    updateAccountNameDropdown(row, category, departmentId, transactionType);
                    
                    // Clear COA when category changes
                    if (coaInput) coaInput.value = '';
                    
                    // Enable account name dropdown now that category is selected
                    enableAccountNameField(row);
                };
                categoryDropdown.appendChild(option);
            });
            categoryDropdown.classList.remove('hidden');
        } else {
            categoryDropdown.classList.add('hidden');
        }
    });
    
    categoryInput.addEventListener('focus', async function() {
        const departmentId = departmentSelect.value;
        const transactionType = transactionTypeSelect.value;
        const requesterValue = requesterSearchInput.value;
        
        // Validate prerequisites
        if (!requesterValue || !departmentId || !transactionType) {
            showValidationMessage(this, 'Please select requester and transaction type first');
            this.blur(); // Remove focus
            return;
        }
        
        const availableCategories = await getAvailableCategories(departmentId, transactionType);
        
        // Clear dropdown
        categoryDropdown.innerHTML = '';
        
        if (availableCategories.length > 0) {
            availableCategories.forEach(category => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.textContent = category;
                option.onclick = function() {
                    categoryInput.value = category;
                    categoryDropdown.classList.add('hidden');
                    
                    // Update account name dropdown
                    updateAccountNameDropdown(row, category, departmentId, transactionType);
                    
                    // Clear COA when category changes
                    if (coaInput) coaInput.value = '';
                    
                    // Enable account name dropdown now that category is selected
                    enableAccountNameField(row);
                };
                categoryDropdown.appendChild(option);
            });
            categoryDropdown.classList.remove('hidden');
        }
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!categoryInput.contains(event.target) && !categoryDropdown.contains(event.target)) {
            categoryDropdown.classList.add('hidden');
        }
    });
}

// Function to show validation messages
function showValidationMessage(element, message) {
    // Remove existing validation message
    const existingMessage = element.parentElement.querySelector('.validation-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create and show new validation message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'validation-message text-red-500 text-sm mt-1';
    messageDiv.textContent = message;
    element.parentElement.appendChild(messageDiv);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 3000);
}

// Function to enable account name field
function enableAccountNameField(row) {
    const accountNameSelect = row.querySelector('.account-name');
    if (accountNameSelect) {
        accountNameSelect.disabled = false;
        accountNameSelect.classList.remove('bg-gray-100');
    }
}

// Function to update account name dropdown based on selected category
async function updateAccountNameDropdown(row, category, departmentId, transactionType) {
    const accountNameSelect = row.querySelector('.account-name');
    const coaInput = row.querySelector('.coa');
    
    if (!accountNameSelect) return;
    
    // Validate prerequisites
    if (!category) {
        showValidationMessage(accountNameSelect, 'Please select a category first');
        return;
    }
    
    // Clear existing options
    accountNameSelect.innerHTML = '<option value="">Select Account Name</option>';
    
    // Get available account names for the selected category
    const accountNames = await getAvailableAccountNames(category, departmentId, transactionType);
    
    accountNames.forEach(item => {
        const option = document.createElement('option');
        option.value = item.accountName;
        option.textContent = item.accountName;
        option.dataset.coa = item.coa;
        option.dataset.remarks = item.remarks || '';
        accountNameSelect.appendChild(option);
    });
    
    // Remove existing event listeners to avoid conflicts
    const newAccountNameSelect = accountNameSelect.cloneNode(true);
    accountNameSelect.parentNode.replaceChild(newAccountNameSelect, accountNameSelect);
    
    // Add event listener for account name selection - use dataset.coa instead of API call
    newAccountNameSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const selectedAccountName = this.value;
        
        if (selectedAccountName && selectedOption) {
            // Use COA data that's already available from dataset
            const coa = selectedOption.dataset.coa || '';
            console.log('Using COA from dataset:', coa, 'for account:', selectedAccountName);
            if (coaInput) coaInput.value = coa;
        } else {
            if (coaInput) coaInput.value = '';
        }
    });
    
    // Enable the account name field
    enableAccountNameField(row);
}

// Function to refresh all category dropdowns when department or transaction type changes
async function refreshAllCategoryDropdowns() {
    const tableRows = document.querySelectorAll('#tableBody tr');
    for (const row of tableRows) {
        const categoryInput = row.querySelector('.category-input');
        const accountNameSelect = row.querySelector('.account-name');
        const coaInput = row.querySelector('.coa');
        
        // Clear existing values
        if (categoryInput) categoryInput.value = '';
        if (accountNameSelect) accountNameSelect.innerHTML = '<option value="">Select Account Name</option>';
        if (coaInput) coaInput.value = '';
        
        // Update field states based on prerequisites
        updateFieldsBasedOnPrerequisites(row);
        
        // Re-setup dropdown
        await setupCategoryDropdown(row);
    }
}
