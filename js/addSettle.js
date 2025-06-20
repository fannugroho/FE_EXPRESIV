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
        noResults.innerText = 'Tidak ada pengguna yang cocok';
        dropdown.appendChild(noResults);
    }
    
    // Tampilkan dropdown
    dropdown.classList.remove('hidden');
}

// Function to display the list of uploaded files
function displayFileList() {
    // This function can be implemented to show uploaded files if needed
    // For now, it's a placeholder to prevent errors
    console.log('Files uploaded:', uploadedFiles.length);
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
            console.log("User data:", data);
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
            console.log("Transaction Type data:", data);
            populateTransactionTypeSelect(data.data);
        })
        .catch(error => {
            console.error('Error fetching transaction type:', error);
        });
}

function fetchBusinessPartners() {
    fetch(`${BASE_URL}/api/business-partners`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Business Partners data:", data);
            setupBusinessPartnerSearch(data.data);
        })
        .catch(error => {
            console.error('Error fetching business partners:', error);
        });
}

function populateTransactionTypeSelect(transactionTypes) {
    const transactionTypeSelect = document.getElementById("type");
    transactionTypes.forEach(transactionType => {
        const option = document.createElement('option');
        option.value = transactionType.name;
        option.textContent = transactionType.name;
        transactionTypeSelect.appendChild(option);
    });
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

                    window.kansaiEmployeeId = requester.kansaiEmployeeId;
                    console.log("requester", requester);
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
    console.log("Logged in user ID:", loggedInUserId);
    console.log("Available employees:", window.employees);
    
    if(loggedInUserId && window.employees) {
        const loggedInEmployee = window.employees.find(emp => emp.id === loggedInUserId);
        console.log("Found logged in employee:", loggedInEmployee);
        
        if(loggedInEmployee) {
            const employeeNIK = loggedInEmployee.kansaiEmployeeId || '';
            const employeeName = loggedInEmployee.fullName || '';
            
            document.getElementById("Employee").value = employeeNIK;
            document.getElementById("EmployeeName").value = employeeName;
            
            console.log("Auto-populated employee fields:", {
                employeeNIK: employeeNIK,
                employeeName: employeeName
            });
        } else {
            console.warn("Could not find logged in employee in employees array");
        }
    } else {
        console.warn("Missing logged in user ID or employees array");
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
            console.log("Kansai Employee ID:", window.kansaiEmployeeId);
            kansaiEmployeeId = window.kansaiEmployeeId;
        }else{
            kansaiEmployeeId = document.getElementById("Employee").value;
        }

        console.log("Kansai Employee ID:", kansaiEmployeeId);
        const cashAdvanceReferenceId = document.getElementById("cashAdvanceDoc").value;
        
        console.log("Validation check values:", {
            kansaiEmployeeId: kansaiEmployeeId,
            cashAdvanceReferenceId: cashAdvanceReferenceId
        });
        
        
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
        
        // Collect settlement items from table
        const tableRows = document.querySelectorAll("#tableBody tr");
        tableRows.forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 4) {
                const description = inputs[0].value; // Description input
                const glAccount = inputs[1].value;   // GLAccount input
                const accountName = inputs[2].value; // AccountName input
                const amount = inputs[3].value;      // Amount input
                
                if (description) formData.append(`SettlementItems[${index}].Description`, description);
                if (glAccount) formData.append(`SettlementItems[${index}].GLAccount`, glAccount);
                if (accountName) formData.append(`SettlementItems[${index}].AccountName`, accountName);
                if (amount) formData.append(`SettlementItems[${index}].Amount`, amount);
            }
        });
        
        // Handle approval fields 
    
        const preparedById = document.getElementById("preparedDropdown").value;
        if (preparedById) formData.append('PreparedById', preparedById);
            
        

        const checkedById = document.getElementById("checkedDropdown").value;
        if (checkedById) formData.append('CheckedById', checkedById);
     
        
        const approvedById = document.getElementById("approvedDropdown").value;
        if (approvedById) formData.append('ApprovedById', approvedById);
     
        
        const acknowledgedById = document.getElementById("acknowledgedDropdown").value;
        if (acknowledgedById) formData.append('AcknowledgedById', acknowledgedById);
        
        const receivedById = document.getElementById("receivedDropdown").value;
        if (receivedById) formData.append('ReceivedById', receivedById);
        
        // Send API request
        const response = await fetch(`${BASE_URL}/api/settlements`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            // Success response (status 200)
            if (isSubmit) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Settlement berhasil di-submit',
                    confirmButtonColor: '#3085d6'
                });
            } else {
                await Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Settlement has been saved as draft',
                    confirmButtonColor: '#3085d6'
                });
            }
            
            // Redirect back to menu page
            window.location.href = "../pages/menuSettle.html";
        } else if (response.status === 404) {
            // Handle 404 error for Cash Advance not found
            const errorData = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: errorData.Message || 'Cash Advance is not found',
                confirmButtonColor: '#d33'
            });
        } else {
            // Handle other errors
            let errorMessage = `Failed to ${isSubmit ? 'submit' : 'save'} settlement. Please try again.`;
            try {
                const errorData = await response.json();
                if (errorData.message || errorData.Message) {
                    errorMessage = errorData.message || errorData.Message;
                }
            } catch (parseError) {
                console.log("Could not parse error response:", parseError);
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: errorMessage,
                confirmButtonColor: '#d33'
            });
        }
        
    } catch (error) {
        console.error('Error saving settlement:', error);
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

        function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" required />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full bg-gray-100" disabled />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full bg-gray-100" disabled />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" required />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;

    tableBody.appendChild(newRow);
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
                console.log("Cash Advance:", cashAdvance);
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
        
        console.log("Default posting date set to:", currentDate);
    }
}

// Load cash advance options when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadCashAdvanceOptions();
    fetchDepartments();
    fetchUsers();
    fetchTransactionType();
    fetchBusinessPartners();
    setDefaultDate(); // Set default date
    
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
