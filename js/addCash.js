let uploadedFiles = [];

async function saveDocument(isSubmit = false) {
    // Show confirmation dialog only for submit
    if (isSubmit) {
        const result = await Swal.fire({
            title: 'Confirmation',
            text: 'Are you sure you want to submit this document?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel'
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

        // Create FormData object
        const formData = new FormData();
        
        // Add all form fields to FormData
        formData.append('CashAdvanceNo', document.getElementById("CashAdvanceNo").value);
        formData.append('EmployeeNIK', document.getElementById("EmployeeNIK").value);
        formData.append('RequesterId', document.getElementById("RequesterId").value || userId);
        formData.append('Purpose', document.getElementById("Purpose").value);
        formData.append('DepartmentId', document.getElementById("department").value);
        formData.append('SubmissionDate', document.getElementById("SubmissionDate").value);
        formData.append('TransactionType', document.getElementById("TransactionType").value);
        formData.append('Remarks', document.getElementById("Remarks").value);
        
        // Approval fields
        formData.append('PreparedById', document.getElementById("Approval.PreparedById").value);
        formData.append('CheckedById', document.getElementById("Approval.CheckedById").value);
        formData.append('ApprovedById', document.getElementById("Approval.ApprovedById").value);
        formData.append('AcknowledgedById', document.getElementById("Approval.AcknowledgedById").value);
        formData.append('ClosedById', document.getElementById("Approval.ClosedById").value);
        
        // Add file attachments
        const fileInput = document.getElementById("Attachments");
        if (uploadedFiles.length > 0) {
            for (let i = 0; i < uploadedFiles.length; i++) {
                formData.append('Attachments', uploadedFiles[i]);
            }
        }
        
        // Add ReceivedById field
        const receivedById = document.getElementById("Approval.ReceivedById").value;
        if (receivedById) {
            formData.append('ReceivedById', receivedById);
        }
        
        // Add CashAdvanceDetails - collect all rows from the table
        const tableRows = document.querySelectorAll('#tableBody tr');
        tableRows.forEach((row, index) => {
            const description = row.querySelector('input[type="text"]').value;
            const amount = row.querySelector('input[type="number"]').value;
            
            if (description && amount) {
                formData.append(`CashAdvanceDetails[${index}][Description]`, description);
                formData.append(`CashAdvanceDetails[${index}][Amount]`, amount);
            }
        });

        // Add Business Partner ID (Paid To)
        const paidToId = document.getElementById("paidTo").value;
        if (paidToId) {
            formData.append('PayTo', paidToId);
        }

        // Set submit flag
        formData.append('IsSubmit', isSubmit.toString());
        
        // API endpoint
        const endpoint = `${BASE_URL}/api/cash-advance`;
        
        // Send the request
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        if (response.status === 201) {
            // Success - Show appropriate message
            if (isSubmit) {
                await Swal.fire({
                    title: 'Berhasil',
                    text: 'Cash advance request berhasil di-submit',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            } else {
                await Swal.fire({
                    title: 'Success!',
                    text: 'Cash advance request has been saved as draft',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            }
            
            // Redirect back to menu page
            window.location.href = "../pages/MenuCash.html";
        } else {
            // Error handling
            let errorMessage = `Failed to ${isSubmit ? 'submit' : 'save'}: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.message || errorData.Message) {
                    errorMessage = errorData.message || errorData.Message;
                }
            } catch (parseError) {
                console.log("Could not parse error response:", parseError);
            }

            await Swal.fire({
                title: 'Error!',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        // Network or other error
        console.error("Error processing cash advance:", error);
        await Swal.fire({
            title: 'Error!',
            text: `An error occurred: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to submit document (calls saveDocument with isSubmit=true)
async function submitDocument() {
    await saveDocument(true);
}

function goToMenuCash() {
    window.location.href = "../pages/MenuCash.html";
}

// document.getElementById("docType").addEventListener("change", function() {
// const selectedValue = this.value;
// const cashTable = document.getElementById("cashTable");

// if (selectedValue === "Pilih") {
// cashTable.style.display = "none";
// } else {
// cashTable.style.display = "table";
// }
// });

function previewPDF(event) {
const files = event.target.files;
if (files.length + uploadedFiles.length > 5) {
alert('Maximum 5 PDF files are allowed.');
event.target.value = ''; // Reset file input
return;
}

for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type === 'application/pdf') {
        uploadedFiles.push(file);
    } else {
        alert(`File "${file.name}" is not a valid PDF file`);
    }
}

displayFileList();
}

// Function to display the list of uploaded files
function displayFileList() {
    const fileListContainer = document.getElementById('fileList');
    if (!fileListContainer) return;
    
    fileListContainer.innerHTML = '';
    
    if (uploadedFiles.length === 0) {
        fileListContainer.innerHTML = '<p class="text-gray-500 text-sm p-2">No files uploaded</p>';
        return;
    }
    
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'flex items-center justify-between p-2 border-b';
        
        const fileName = document.createElement('div');
        fileName.className = 'text-sm truncate flex-grow';
        fileName.textContent = file.name;
        
        const actionButtons = document.createElement('div');
        actionButtons.className = 'flex space-x-2';
        
        const viewButton = document.createElement('button');
        viewButton.className = 'text-blue-600 hover:text-blue-800 text-sm';
        viewButton.textContent = 'View';
        viewButton.onclick = () => viewFile(index);
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'text-red-600 hover:text-red-800 text-sm';
        deleteButton.textContent = 'X';
        deleteButton.onclick = () => deleteFile(index);
        
        actionButtons.appendChild(viewButton);
        actionButtons.appendChild(deleteButton);
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(actionButtons);
        
        fileListContainer.appendChild(fileItem);
    });
}

// Function to view a file
function viewFile(index) {
    const file = uploadedFiles[index];
    if (!file) return;
    
    // Create object URL for the file
    const fileURL = URL.createObjectURL(file);
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.id = 'pdfViewerModal';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-xl w-4/5 h-4/5 flex flex-col';
    
    // Create header with close button
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-4 border-b';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold';
    title.textContent = file.name;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-500 hover:text-gray-700';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        document.body.removeChild(modal);
        URL.revokeObjectURL(fileURL);
    };
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Create iframe to display PDF
    const iframe = document.createElement('iframe');
    iframe.className = 'w-full flex-grow';
    iframe.src = fileURL;
    
    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(iframe);
    modal.appendChild(modalContent);
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
            URL.revokeObjectURL(fileURL);
        }
    });
}

// Function to delete a file
function deleteFile(index) {
    if (index >= 0 && index < uploadedFiles.length) {
        uploadedFiles.splice(index, 1);
        displayFileList();
    }
}

function addRow() {
const tableBody = document.getElementById("tableBody");
const newRow = document.createElement("tr");

newRow.innerHTML = `
<td class="p-2 border">
    <input type="text" maxlength="30" class="w-full" required />
</td>
<td class="p-2 border">
    <input type="number" maxlength="10" class="w-full" required />
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
    departmentSelect.innerHTML = '<option value="" disabled selected>Select Department</option>';

    if (departmentSelect) {
        departments.forEach(department => {
            const option = document.createElement('option');
            option.value = department.id;
            option.textContent = department.name;
            departmentSelect.appendChild(option);
        });
    }
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

// Modifikasi di fungsi populateUserSelects untuk setup searchbar approval
function populateUserSelects(users) {
    // Store users globally for search functionality
    window.requesters = users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        department: user.department
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
                    //update department
                    const departmentSelect = document.getElementById('department');
                    if (requester.department) {
                        console.log(requester.department)
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

    // Auto-populate employee fields with logged-in user data (same as addSettle)
    const loggedInUserId = getUserId();
    console.log("Logged in user ID:", loggedInUserId);
    console.log("Available employees:", window.employees);
    
    if(loggedInUserId && window.employees) {
        const loggedInEmployee = window.employees.find(emp => emp.id === loggedInUserId);
        console.log("Found logged in employee:", loggedInEmployee);
        
        if(loggedInEmployee) {
            const employeeNIK = loggedInEmployee.kansaiEmployeeId || '';
            const employeeName = loggedInEmployee.fullName || '';
            
            document.getElementById("EmployeeNIK").value = employeeNIK;
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

    // Populate approval dropdowns
    const approvalSelects = [
        "Approval.PreparedById",
        "Approval.CheckedById", 
        "Approval.ApprovedById",
        "Approval.AcknowledgedById",
        "Approval.ReceivedById",
        "Approval.ClosedById"
    ];

    approvalSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.fullName;
                select.appendChild(option);
                // Auto-select and disable for Proposed by (Approval.PreparedById)
                if(selectId == "Approval.PreparedById"){
                   if(user.id == getUserId()){
                    option.selected = true;
                    select.disabled = true;
                    // Update the search input for Proposed by
                    const proposedBySearch = document.getElementById('Approval.PreparedByIdSearch');
                    if (proposedBySearch) {
                                                    proposedBySearch.value = user.fullName;
                        proposedBySearch.disabled = true;
                    }
                   }
                }
            });
        }
    });

    // Tambahkan event listener untuk semua dropdown pencarian approval
    document.addEventListener('DOMContentLoaded', function() {
        // Setup event listener untuk hide dropdown saat klik di luar
        document.addEventListener('click', function(event) {
            const dropdowns = [
                'Approval.PreparedByIdDropdown', 
                'Approval.CheckedByIdDropdown', 
                'Approval.ApprovedByIdDropdown', 
                'Approval.AcknowledgedByIdDropdown',
                'Approval.ReceivedByIdDropdown',
                'Approval.ClosedByIdDropdown'
            ];
            
            const searchInputs = [
                'Approval.PreparedByIdSearch', 
                'Approval.CheckedByIdSearch', 
                'Approval.ApprovedByIdSearch', 
                'Approval.AcknowledgedByIdSearch',
                'Approval.ReceivedByIdSearch',
                'Approval.ClosedByIdSearch'
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
            'Approval.PreparedByIdSearch',
            'Approval.CheckedByIdSearch',
            'Approval.ApprovedByIdSearch',
            'Approval.AcknowledgedByIdSearch',
            'Approval.ReceivedByIdSearch',
            'Approval.ClosedByIdSearch'
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
}

function fetchTransactionType() {
    fetch(`${BASE_URL}/api/transactiontypes`)
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

function populateTransactionTypeSelect(transactionTypes) {
    const transactionTypeSelect = document.getElementById("TransactionType");
    if (transactionTypeSelect) {
        transactionTypes.forEach(transactionType => {
            const option = document.createElement('option');
            option.value = transactionType.name;
            option.textContent = transactionType.name;
            transactionTypeSelect.appendChild(option);
        });

        // Add event listener for TransactionType change
        transactionTypeSelect.addEventListener('change', function() {
            const closedBySection = document.getElementById('closedBySection');
            const closedByLabel = document.getElementById('Approval.ClosedByIdLabel');
            
            if (this.value === 'Personal Loan') {
                closedBySection.style.display = 'block';
                closedByLabel.style.display = 'block';
            } else {
                closedBySection.style.display = 'none';
                closedByLabel.style.display = 'none';
            }
        });

        // Hide closed by section by default
        const closedBySection = document.getElementById('closedBySection');
        const closedByLabel = document.getElementById('Approval.ClosedByIdLabel');
        closedBySection.style.display = 'none';
        closedByLabel.style.display = 'none';
    }
}

// Initialize all dropdowns when page loads
document.addEventListener('DOMContentLoaded', function() {
    fetchDepartments();
    fetchUsers();
    fetchTransactionType();
    fetchBusinessPartners();
});