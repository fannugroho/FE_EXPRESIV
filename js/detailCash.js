// Global variable for file uploads
let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep

// Global variables
let rowCounter = 1;
let cashAdvanceData = null;

// Helper function to get logged-in user ID
function getUserId() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.id : null;
}

// Function to fetch all dropdown options
function fetchDropdownOptions(approvalData = null) {
    fetchDepartments();
    fetchUsers(approvalData);
    fetchTransactionType();
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

// Function to populate department select
function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("departmentId");
    if (!departmentSelect) return;
    
    // Store the currently selected value
    const currentValue = departmentSelect.value;
    const currentText = departmentSelect.options[departmentSelect.selectedIndex]?.text;
    
    departmentSelect.innerHTML = '<option value="" disabled>Select Department</option>';

    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.id;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
        
        // If this department matches the current text, select it
        if (department.name === currentText) {
            option.selected = true;
        }
    });
    
    // If we have a current value and it wasn't matched by text, try to select by value
    if (currentValue && departmentSelect.value !== currentValue) {
        departmentSelect.value = currentValue;
    }
}

// Function to fetch users from API
function fetchUsers(approvalData = null) {
    fetch(`${BASE_URL}/api/users`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("User data:", data);
            populateUserSelects(data.data, approvalData);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
}

// Function to populate user selects
function populateUserSelects(users, approvalData = null) {
    // Store users globally for search functionality
    window.requesters = users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        department: user.department
    }));
    
    // Store employees globally for reference
    window.employees = users.map(user => ({
        id: user.id,
        kansaiEmployeeId: user.kansaiEmployeeId,
        fullName: user.fullName,
        department: user.department
    }));

    // Populate RequesterId dropdown with search functionality (like addCash.js)
    const requesterSelect = document.getElementById("RequesterId");
    if (requesterSelect) {
        // Clear existing options first
        requesterSelect.innerHTML = '<option value="">Select a requester</option>';
        
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
                    console.log("Requester ID2:", requester.id);
                    // Auto-fill the paidTo field with the selected requester name
                    const paidToField = document.getElementById('paidTo');
                    if (paidToField) {
                        paidToField.value = requester.fullName;
                    }
                    requesterDropdown.classList.add('hidden');
                    //update department
                    const departmentSelect = document.getElementById('departmentId');
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

    // Auto-populate employee fields with logged-in user data (same as addCash)
    const loggedInUserId = getUserId();
    console.log("Logged in user ID:", loggedInUserId);
    console.log("Available employees:", window.employees);
    
    if(loggedInUserId && window.employees) {
        const loggedInEmployee = window.employees.find(emp => emp.id === loggedInUserId);
        console.log("Found logged in employee:", loggedInEmployee);
        
        if(loggedInEmployee) {
            const employeeNIK = loggedInEmployee.kansaiEmployeeId || '';
            const employeeName = loggedInEmployee.fullName || '';
            
            // Auto-fill employee fields
            document.getElementById("employeeId").value = employeeNIK;
            document.getElementById("employeeName").value = employeeName;
            
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

    // Populate approval dropdowns with search functionality (same as addCash)
    const approvalSelects = [
        "Approval.PreparedById",
        "Approval.CheckedById", 
        "Approval.ApprovedById",
        "Approval.AcknowledgedById"
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
    
    // Set approval values from approvalData if available (after populating options)
    if (approvalData) {
        populateApprovals(approvalData);
    }
}

// Function to fetch transaction types from API
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

// Function to populate transaction type select
function populateTransactionTypeSelect(transactionTypes) {
    const transactionTypeSelect = document.getElementById("transactionType");
    if (!transactionTypeSelect) return;
    
    // Store the currently selected value
    const currentValue = transactionTypeSelect.value;
    const currentText = transactionTypeSelect.options[transactionTypeSelect.selectedIndex]?.text;
    
    transactionTypeSelect.innerHTML = '<option value="" disabled>Select Transaction Type</option>';

    transactionTypes.forEach(transactionType => {
        const option = document.createElement("option");
        option.value = transactionType.name;
        option.textContent = transactionType.name;
        transactionTypeSelect.appendChild(option);
        
        // If this transaction type matches the current text, select it
        if (transactionType.name === currentText) {
            option.selected = true;
        }
    });
    
    // If we have a current value and it wasn't matched by text, try to select by value
    if (currentValue && transactionTypeSelect.value !== currentValue) {
        transactionTypeSelect.value = currentValue;
    }
}

function saveDocument() {
    const docNumber = (JSON.parse(localStorage.getItem("documents")) || []).length + 1;
    const documentData = {
        docNumber,
        invoiceNo : document.getElementById("invoiceNo").value,
        requester: document.getElementById("requester").value,
        department: document.getElementById("department").value,
        vendor: document.getElementById("vendor").value,
        name: document.getElementById("name").value,
        contactPerson: document.getElementById("contactPerson").value,
        vendorRefNo: document.getElementById("vendorRefNo").value,
        postingDate: document.getElementById("postingDate").value,
        dueDate: document.getElementById("dueDate").value,
        requiredDate: document.getElementById("requiredDate").value,
        classification: document.getElementById("classification").value,
        docType: document.getElementById("docType").value,
        docStatus: document.getElementById("docStatus").value,
        approvals: {
            prepared: document.getElementById("prepared").checked,
            checked: document.getElementById("checked").checked,
            approved: document.getElementById("approved").checked,
            knowledge: document.getElementById("knowledge").checked,
        }
    };
    
    let documents = JSON.parse(localStorage.getItem("documents")) || [];
    documents.push(documentData);
    localStorage.setItem("documents", JSON.stringify(documents));
    alert("Dokumen berhasil disimpan!");
}

function goToMenuCash() {
    window.location.href = "../pages/MenuCash.html";
}

// Only add event listener if the element exists (to prevent errors)
const docTypeElement = document.getElementById("docType");
if (docTypeElement) {
    docTypeElement.addEventListener("change", function() {
        const selectedValue = this.value;
        const prTable = document.getElementById("prTable");

        if (selectedValue === "Pilih") {
            prTable.style.display = "none";
        } else {
            prTable.style.display = "table";
        }
    });
}

function previewPDF(event) {
    const files = event.target.files;
    const totalExistingFiles = attachmentsToKeep.length + uploadedFiles.length;
    
    if (files.length + totalExistingFiles > 5) {
        alert('Maximum 5 PDF files are allowed.');
        event.target.value = ''; // Clear the file input
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
    updateAttachmentsDisplay();
}

function displayFileList() {
    // Simple display of uploaded files count
    console.log(`${uploadedFiles.length} new file(s) uploaded`);
    // You can implement a more sophisticated file list display here if needed
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

// Function to update the attachments display
function updateAttachmentsDisplay() {
    const attachmentsList = document.getElementById('attachmentsList');
    if (!attachmentsList) return;
    
    attachmentsList.innerHTML = ''; // Clear existing display
    
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
                ${cashAdvanceData && cashAdvanceData.status && cashAdvanceData.status.toLowerCase() === 'draft' ? 
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
                ${cashAdvanceData && cashAdvanceData.status && cashAdvanceData.status.toLowerCase() === 'draft' ? 
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
    
    // Show attachment count
    const totalAttachments = existingToKeep.length + uploadedFiles.length;
    console.log(`Total attachments: ${totalAttachments} (${existingToKeep.length} existing, ${uploadedFiles.length} new)`);
}

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" required />
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

function confirmDelete() {
    Swal.fire({
        title: 'Apakah dokumen ini akan dihapus?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteDocument(); // Memanggil fungsi delete setelah konfirmasi
        }
    });
}

function deleteDocument() {
    // Get the ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('ca-id');
    
    if (!id) {
        Swal.fire('Error!', 'ID cash advance tidak ditemukan.', 'error');
        return;
    }
    
    // Call the DELETE API
    fetch(`${BASE_URL}/api/cash-advance/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status === 204) {
            // 204 No Content - Success case
            Swal.fire('Terhapus!', 'Dokumen berhasil dihapus.', 'success')
            .then(() => {
                // Redirect to previous page or list page after successful deletion
                window.history.back();
            });
        } else if (response.ok) {
            // If there's a response body, try to parse it
            return response.json().then(data => {
                if (data.status) {
                    Swal.fire('Terhapus!', 'Dokumen berhasil dihapus.', 'success')
                    .then(() => {
                        window.history.back();
                    });
                } else {
                    Swal.fire('Error!', data.message || 'Gagal menghapus dokumen karena status dokumen sudah bukan draft.', 'error');
                }
            });
        } else {
            Swal.fire('Error!', `Gagal menghapus dokumen. Status: ${response.status}`, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire('Error!', 'Terjadi kesalahan saat menghapus dokumen.', 'error');
    });
}

function loadCashAdvanceData() {
    // Get the ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('ca-id');
    
    if (!id) {
        Swal.fire('Error!', 'ID cash advance tidak ditemukan di URL.', 'error');
        return;
    }
    
    // Call the GET API
    fetch(`${BASE_URL}/api/cash-advance/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status === 200) {
            return response.json();
        } else if (response.status === 404) {
            throw new Error('Data cash advance tidak ditemukan');
        } else {
            throw new Error(`Error: ${response.status}`);
        }
    })
    .then(result => {
        if (result.status && result.data) {
            console.log("result", result);
            populateForm(result.data);
        } else {
            Swal.fire('Error!', result.message || 'Gagal memuat data cash advance.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.message.includes('tidak ditemukan')) {
            Swal.fire('Error!', 'Data cash advance tidak ditemukan.', 'error');
        } else {
            Swal.fire('Error!', 'Terjadi kesalahan saat memuat data cash advance.', 'error');
        }
    });
}

function populateForm(data) {
    // Store the global cash advance data
    cashAdvanceData = data;
    console.log("cashAdvanceData", cashAdvanceData);
    // Populate basic fields with updated IDs
    document.getElementById("cashAdvanceNo").value = data.cashAdvanceNo || '';
    
    // Auto-populate employee fields with data from API (but don't override auto-filled logged-in user data)
    if (!document.getElementById("employeeId").value) {
        // Handle employee NIK - find user by ID and use kansaiEmployeeId
        if (data.employeeId && window.employees) {
            const employee = window.employees.find(emp => emp.id === data.employeeId);
            if (employee && employee.kansaiEmployeeId) {
                document.getElementById("employeeId").value = employee.kansaiEmployeeId;
            } else {
                // Fallback to original value if not found
                document.getElementById("employeeId").value = data.employeeId;
            }
        }
    }
    
    if (!document.getElementById("employeeName").value) {
        document.getElementById("employeeName").value = data.employeeName || '';
    }
    
    // Handle requester name with search functionality  
    if (data.requesterName) {
        document.getElementById("requesterSearch").value = data.requesterName;
        // Store the requester ID if available - since options are pre-populated, we can directly set the value
        if (data.requesterId) {
            const requesterIdElement = document.getElementById('RequesterId');
            // Always store in global variable as backup
            window.cashAdvanceRequesterId = data.requesterId;
            
            if (requesterIdElement) {
                requesterIdElement.value = data.requesterId;
                console.log("Requester ID:", data.requesterId);
                console.log("Requester ID2:", requesterIdElement.value);
            } else {
                console.warn("RequesterId element not found in DOM, but stored in global variable");
            }
        } else {
            console.error("No requesterId found in API data - this is a business logic error");
        }
    }
    
    document.getElementById("purpose").value = data.purpose || '';
    document.getElementById("paidTo").value = data.requesterName || '';
    
    // Handle department - try to set by ID first, then by name
    const departmentSelect = document.getElementById("departmentId");
    if (data.departmentId && data.departmentId !== "00000000-0000-0000-0000-000000000000") {
        departmentSelect.value = data.departmentId;
    } else if (data.departmentName) {
        // If department ID is not valid, try to find by name
        const departmentOptions = departmentSelect.options;
        for (let i = 0; i < departmentOptions.length; i++) {
            if (departmentOptions[i].textContent === data.departmentName) {
                departmentSelect.selectedIndex = i;
                break;
            }
        }
        // If no matching option found, create and select a new one
        if (departmentSelect.value === "" || departmentSelect.selectedIndex === 0) {
            const newOption = document.createElement('option');
            newOption.value = data.departmentName;
            newOption.textContent = data.departmentName;
            newOption.selected = true;
            departmentSelect.appendChild(newOption);
        }
    }
    
    // Handle submission date - convert from ISO to YYYY-MM-DD format for date input
    if (data.submissionDate) {
        // Extract date part directly to avoid timezone issues
        const formattedDate = data.submissionDate.split('T')[0];
        document.getElementById("submissionDate").value = formattedDate;
    }
    
    document.getElementById("status").value = data.status || '';
    document.getElementById("transactionType").value = data.transactionType || '';
    
    // Populate table with cash advance details
    populateTable(data.cashAdvanceDetails || []);
    
    // Populate approval section using the direct fields from API response
    const approvalData = {
        preparedById: data.preparedById,
        checkedById: data.checkedById,
        approvedById: data.approvedById,
        acknowledgedById: data.acknowledgedById
    };
    populateApprovals(approvalData);
    
    // Handle remarks if exists
    const remarksTextarea = document.querySelector('textarea');
    if (remarksTextarea) {
        remarksTextarea.value = data.remarks || '';
    }
    
    // Handle rejection remarks if status is Rejected
    if (data.status === 'Rejected' && data.rejectedRemarks) {
        // Show the rejection remarks section
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        const rejectionTextarea = document.getElementById('rejectionRemarks');
        
        if (rejectionSection && rejectionTextarea) {
            rejectionSection.style.display = 'block';
            rejectionTextarea.value = data.rejectedRemarks;
        }
    } else {
        // Hide the rejection remarks section if status is not Rejected
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        if (rejectionSection) {
            rejectionSection.style.display = 'none';
        }
    }

    // Handle attachments if they exist
    if (data.attachments && data.attachments.length > 0) {
        console.log('Attachments found:', data.attachments);
        // You can implement attachment display logic here if needed
    }

    // Store and display attachments
    if (data.attachments) {
        existingAttachments = data.attachments;
        attachmentsToKeep = data.attachments.map(att => att.id); // Initially keep all existing attachments
        displayAttachments(data.attachments);
    }

    // Check if status is not Draft and make fields read-only
    if (data.status && data.status.toLowerCase() !== 'draft') {
        makeAllFieldsReadOnlyForNonDraft();
    }

    // Fetch dropdown options with approval data
    fetchDropdownOptions(approvalData);
}

function populateTable(cashAdvanceDetails) {
    const tableBody = document.getElementById("tableBody");
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add rows for each detail
    cashAdvanceDetails.forEach((detail, index) => {
        const newRow = document.createElement("tr");
        
        newRow.innerHTML = `
            <td class="p-2 border">
                <input type="text" maxlength="200" class="w-full" value="${detail.description || ''}" />
            </td>
            <td class="p-2 border">
                <input type="number" maxlength="10" class="w-full" value="${detail.amount || ''}" required />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
        `;
        
        tableBody.appendChild(newRow);
    });
    
    // If no details exist, add one empty row
    if (cashAdvanceDetails.length === 0) {
        addRow();
    }
}

// Function to filter users for approval fields (same as addCash)
function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    
    // Kosongkan dropdown
    dropdown.innerHTML = '';
    
    // Filter pengguna berdasarkan teks pencarian
    const filteredUsers = window.requesters ? 
        window.requesters.filter(user => user.fullName.toLowerCase().includes(searchText)) : 
        [];
    
    // Tampilkan hasil pencarian
    filteredUsers.forEach(user => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        option.innerText = user.fullName;
        option.onclick = function() {
            searchInput.value = user.fullName;
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

// Update the populateApprovals function to work with new search structure
function populateApprovals(approval) {
    // Check if requesters data is available, if not, retry after a short delay
    if (!window.requesters) {
        console.log('Requesters data not yet available, retrying in 100ms...');
        setTimeout(() => populateApprovals(approval), 100);
        return;
    }
    
    // Proposed by - find user and set in search input if there's a preparedById
    const preparedSelect = document.getElementById("Approval.PreparedById");
    if (preparedSelect && approval.preparedById) {
        preparedSelect.value = approval.preparedById;
        const preparedUser = window.requesters.find(user => user.id === approval.preparedById);
        if (preparedUser) {
            const preparedSearchInput = document.getElementById('Approval.PreparedByIdSearch');
            if (preparedSearchInput) {
                preparedSearchInput.value = preparedUser.fullName;
            }
        }
    }
    
    // Checked by - find user and set in search input if there's a checkedById
    const checkedSelect = document.getElementById("Approval.CheckedById");
    if (checkedSelect && approval.checkedById) {
        checkedSelect.value = approval.checkedById;
        const checkedUser = window.requesters.find(user => user.id === approval.checkedById);
        if (checkedUser) {
            const checkedSearchInput = document.getElementById('Approval.CheckedByIdSearch');
            if (checkedSearchInput) {
                checkedSearchInput.value = checkedUser.fullName;
            }
        }
    }
    
    // Approved by - find user and set in search input if there's an approvedById
    const approvedSelect = document.getElementById("Approval.ApprovedById");
    if (approvedSelect && approval.approvedById) {
        approvedSelect.value = approval.approvedById;
        const approvedUser = window.requesters.find(user => user.id === approval.approvedById);
        if (approvedUser) {
            const approvedSearchInput = document.getElementById('Approval.ApprovedByIdSearch');
            if (approvedSearchInput) {
                approvedSearchInput.value = approvedUser.fullName;
            }
        }
    }
    
    // Acknowledged by - find user and set in search input if there's an acknowledgedById
    const acknowledgedSelect = document.getElementById("Approval.AcknowledgedById");
    if (acknowledgedSelect && approval.acknowledgedById) {
        acknowledgedSelect.value = approval.acknowledgedById;
        const acknowledgedUser = window.requesters.find(user => user.id === approval.acknowledgedById);
        if (acknowledgedUser) {
            const acknowledgedSearchInput = document.getElementById('Approval.AcknowledgedByIdSearch');
            if (acknowledgedSearchInput) {
                acknowledgedSearchInput.value = acknowledgedUser.fullName;
            }
        }
    }
}

// Load data when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Fetch dropdown options first
    fetchDropdownOptions();
    
    // Then load cash advance data
    loadCashAdvanceData();
    
    // Setup event listener untuk hide dropdown saat klik di luar
    document.addEventListener('click', function(event) {
        const dropdowns = [
            'Approval.PreparedByIdDropdown', 
            'Approval.CheckedByIdDropdown', 
            'Approval.ApprovedByIdDropdown', 
            'Approval.AcknowledgedByIdDropdown'
        ];
        
        const searchInputs = [
            'Approval.PreparedByIdSearch', 
            'Approval.CheckedByIdSearch', 
            'Approval.ApprovedByIdSearch', 
            'Approval.AcknowledgedByIdSearch'
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
        'Approval.AcknowledgedByIdSearch'
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

function updateCash(isSubmit = false) {
    const actionText = isSubmit ? 'Submit' : 'Update';
    const actionConfirmText = isSubmit ? 'submit' : 'update';
    
    Swal.fire({
        title: `${actionText} Cash Advance`,
        text: `Are you sure you want to ${actionConfirmText} this Cash Advance?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: `Yes, ${actionConfirmText} it!`,
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Get the ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('ca-id');
            
            if (!id) {
                Swal.fire('Error!', 'ID cash advance tidak ditemukan.', 'error');
                return;
            }

            // Show loading
            Swal.fire({
                title: `${actionText.slice(0, -1)}ing...`,
                text: `Please wait while we ${actionConfirmText} the Cash Advance.`,
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Create FormData object
            const formData = new FormData();
        
            // Get RequesterId value with fallback
            const requesterIdElement = document.getElementById('RequesterId');
            let requesterId = '';
            
            console.log('RequesterId element found:', requesterIdElement);
            console.log('RequesterId element value:', requesterIdElement ? requesterIdElement.value : 'element not found');
            console.log('Global fallback value:', window.cashAdvanceRequesterId);
            
            if (requesterIdElement && requesterIdElement.value) {
                requesterId = requesterIdElement.value;
                console.log('Using RequesterId from form element:', requesterId);
            } else if (window.cashAdvanceRequesterId) {
                // Use the global fallback variable
                requesterId = window.cashAdvanceRequesterId;
                console.warn('Using global fallback RequesterId:', requesterId);
            } else {
                // No valid RequesterId found - this is a business logic error
                console.error('No valid RequesterId found - cannot proceed with update');
                Swal.fire('Error!', 'RequesterId tidak ditemukan. Data cash advance mungkin rusak.', 'error');
                return;
            }
        
            // Add all form fields to FormData
            formData.append('CashAdvanceNo', document.getElementById("cashAdvanceNo").value);
            formData.append('EmployeeNIK', document.getElementById("employeeId").value);
            formData.append('RequesterId', requesterId);
            formData.append('Purpose', document.getElementById("purpose").value);
            formData.append('DepartmentId', document.getElementById("departmentId").value);
            formData.append('SubmissionDate', document.getElementById("submissionDate").value);
            formData.append('TransactionType', document.getElementById("transactionType").value);
            
            // Handle remarks if exists
            const remarksTextarea = document.querySelector('textarea');
            if (remarksTextarea) {
                formData.append('Remarks', remarksTextarea.value);
            }
            
            // Approval fields
            formData.append('PreparedById', document.getElementById("Approval.PreparedById")?.value || '');
            formData.append('CheckedById', document.getElementById("Approval.CheckedById")?.value || '');
            formData.append('ApprovedById', document.getElementById("Approval.ApprovedById")?.value || '');
            formData.append('AcknowledgedById', document.getElementById("Approval.AcknowledgedById")?.value || '');
            
            // Add CashAdvanceDetails - collect all rows from the table
            const tableRows = document.querySelectorAll('#tableBody tr');
            tableRows.forEach((row, index) => {
                const description = row.querySelector('input[type="text"]')?.value;
                const amount = row.querySelector('input[type="number"]')?.value;
                
                if (description && amount) {
                    formData.append(`CashAdvanceDetails[${index}][Description]`, description);
                    formData.append(`CashAdvanceDetails[${index}][Amount]`, amount);
                }
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
                formData.append(`Attachments[${attachmentIndex}].Id`, '00000000-0000-0000-0000-000000000000'); // Empty GUID for new files
                formData.append(`Attachments[${attachmentIndex}].File`, file);
            });
            
            console.log('Attachments to keep:', attachmentsToKeep);
            console.log('New files to upload:', uploadedFiles);
            
            // Set IsSubmit based on the parameter
            formData.append('IsSubmit', isSubmit);
            
            // Log the data being sent for debugging
            console.log('FormData being sent:');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }
            
            // Call the PUT API
            fetch(`${BASE_URL}/api/cash-advance/${id}`, {
                method: 'PUT',
                body: formData
            })
            .then(response => {
                if (response.status === 200 || response.status === 204) {
                    // Success
                    Swal.fire({
                        title: 'Success!',
                        text: `Cash Advance has been ${isSubmit ? 'submitted' : 'updated'} successfully.`,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        // Reload the cash advance data to show updated information
                        loadCashAdvanceData();
                        
                        // Clear uploaded files since they're now saved
                        uploadedFiles = [];
                        
                        // Update file input
                        const fileInput = document.querySelector('input[type="file"]');
                        if (fileInput) {
                            fileInput.value = '';
                        }
                    });
                } else {
                    // Error handling
                    return response.json().then(data => {
                        console.log("Error:", data);
                        throw new Error(data.message || `Failed to ${actionConfirmText}: ${response.status}`);
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error!',
                    text: `Failed to ${actionConfirmText} Cash Advance: ${error.message}`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            });
        }
    });
}

// Function to convert amount to words
function numberToWords(num) {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    if (num === 0) return 'zero';
    
    function convertLessThanOneThousand(num) {
        if (num < 20) {
            return ones[num];
        }
        
        const ten = Math.floor(num / 10);
        const unit = num % 10;
        
        return tens[ten] + (unit !== 0 ? '-' + ones[unit] : '');
    }
    
    function convert(num) {
        if (num < 1000) {
            return convertLessThanOneThousand(num);
        }
        
        const billions = Math.floor(num / 1000000000);
        const millions = Math.floor((num % 1000000000) / 1000000);
        const thousands = Math.floor((num % 1000000) / 1000);
        const remainder = num % 1000;
        
        let result = '';
        
        if (billions) {
            result += convertLessThanOneThousand(billions) + ' billion ';
        }
        
        if (millions) {
            result += convertLessThanOneThousand(millions) + ' million ';
        }
        
        if (thousands) {
            result += convertLessThanOneThousand(thousands) + ' thousand ';
        }
        
        if (remainder) {
            result += convertLessThanOneThousand(remainder);
        }
        
        return result.trim();
    }
    
    // Split number into whole and decimal parts
    const parts = Number(num).toFixed(2).split('.');
    const wholePart = parseInt(parts[0]);
    const decimalPart = parseInt(parts[1]);
    
    let result = convert(wholePart);
    
    if (decimalPart) {
        result += ' point ' + convert(decimalPart);
    }
    
    return result + ' rupiah';
}

// Function to print the cash advance voucher
function printCashAdvanceVoucher() {
    // Get data from the form
    const cashAdvanceNo = document.getElementById("cashAdvanceNo").value;
    const departmentId = document.getElementById("departmentId").value;
    const paidTo = document.getElementById("paidTo").value;
    const purpose = document.getElementById("purpose").value;
    const submissionDate = document.getElementById("submissionDate").value;
    
    // Get approval data
    const proposedName = document.getElementById("preparedSelect").value;
    const checkedName = document.getElementById("checkedSelect").value;
    const approvedName = document.getElementById("approvedSelect").value;
    const acknowledgedName = document.getElementById("acknowledgedSelect").value;
    
    // Get checkbox states
    const proposedChecked = document.getElementById("preparedCheckbox").checked;
    const checkedChecked = document.getElementById("checkedCheckbox").checked;
    const approvedChecked = document.getElementById("approvedCheckbox").checked;
    const acknowledgedChecked = document.getElementById("acknowledgedCheckbox").checked;
    
    // Get table data
    const tableBody = document.getElementById("tableBody");
    const rows = tableBody.querySelectorAll("tr");
    const tableData = [];
    let totalAmount = 0;
    
    rows.forEach(row => {
        const descriptionInput = row.querySelector("td:first-child input");
        const amountInput = row.querySelector("td:nth-child(2) input");
        
        if (descriptionInput && amountInput && descriptionInput.value && amountInput.value) {
            const amount = parseFloat(amountInput.value);
            tableData.push({
                description: descriptionInput.value,
                amount: amount
            });
            totalAmount += amount;
        }
    });
    
    // Convert total amount to words
    const amountInWords = numberToWords(totalAmount);
    
    // Create the printable HTML
    const printContent = `
    <div id="print-container" style="width: 800px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: left; margin-bottom: 20px;">
            <h3 style="margin: 0;">PT KANSAI PAINT INDONESIA</h3>
            <p style="margin: 0;">Blok DD-7 & DD-6 Kawasan Industri MM2100 Danaludah</p>
            <p style="margin: 0;">Cikarang Barat Kab. Bekasi Jawa Barat 17530</p>
        </div>
        
        <div style="text-align: right; margin-bottom: 20px;">
            <p style="margin: 0;"><strong>Batch No:</strong> _____________</p>
            <p style="margin: 0;"><strong>Voucher No:</strong> ${cashAdvanceNo}</p>
            <p style="margin: 0;"><strong>Submission date:</strong> ${submissionDate}</p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <h2 style="text-decoration: underline;">CASH ADVANCE VOUCHER</h2>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Production' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Production</span>
                        </div>
                    </td>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Marketing' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Marketing</span>
                        </div>
                    </td>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Technical' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Technical</span>
                        </div>
                    </td>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Admninistration' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Administration</span>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Cash advance is paid to</td>
                    <td style="width: 80%;">: ${paidTo}</td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0; display: flex; justify-content: space-between;">
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Proposed by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${proposedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
            
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Advance is checked by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${checkedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
        </div>
        
        <div style="margin: 20px 0; display: flex; justify-content: space-between;">
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Advance is approved by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${approvedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
            
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Cash is received by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${acknowledgedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Payment through [√]:</td>
                    <td style="width: 80%;">
                        <input type="checkbox" style="transform: scale(1.5); margin-right: 5px;"> Cash
                        <input type="checkbox" style="transform: scale(1.5); margin-right: 5px; margin-left: 20px;"> Bank remittance
                        <span style="margin-left: 20px;">[Bank Ref: _______________ ]</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Estimated cost</td>
                    <td style="width: 80%;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 30%; border: 1px solid #000; padding: 5px;">Rp ${totalAmount.toLocaleString()}</td>
                                <td style="width: 70%;">In words: ${amountInWords}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Purpose of Advance</td>
                    <td style="width: 80%;">: ${purpose}</td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <p><strong>Settlement of advance:</strong></p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #000; padding: 8px; width: 60%;">Description</th>
                        <th style="border: 1px solid #000; padding: 8px; width: 20%;">Debit</th>
                        <th style="border: 1px solid #000; padding: 8px; width: 20%;">Credit</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableData.map(item => `
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px;">${item.description}</td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right;">${item.amount.toLocaleString()}</td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                    </tr>
                    `).join('')}
                    ${Array(8 - tableData.length).fill().map(() => `
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; height: 30px;"></td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                    </tr>
                    `).join('')}
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; text-align: center;"><strong>Total</strong></td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>${totalAmount.toLocaleString()}</strong></td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div style="margin: 40px 0 20px; text-align: right;">
            <p><strong>Return Date:</strong> _____________</p>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 40%;">
                        <p>Total cash must be returned to the<br>Company (paid to the Employee)</p>
                    </td>
                    <td style="width: 60%;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 30%; border: 1px solid #000; padding: 5px;">Rp ${totalAmount.toLocaleString()}</td>
                                <td style="width: 70%;">In words: ${amountInWords}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0; display: flex; justify-content: flex-end;">
            <div style="width: 45%; border: 1px solid #000; padding: 10px; margin-right: 10px;">
                <p style="text-align: center;"><strong>Cash is received by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ____________</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
            
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Settlement is approved by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ____________</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
        </div>
        
        <div style="margin: 20px 0; font-size: 10px; line-height: 1.2;">
            <p>The payment through cash is valid, at the time you sign on the column of "Cash is received by".</p>
            <p>The Cash Advance Must be Settled within 1 Month, Otherwise The Company has full authority to deduct from the Salary.</p>
        </div>
    </div>
    `;
    
    // Create a temporary container to hold the printable content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = printContent;
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    
    // Generate the PDF
    const element = document.getElementById('print-container');
    const opt = {
        margin: 10,
        filename: `Cash_Advance_${cashAdvanceNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate PDF
    html2pdf().set(opt).from(element).save().then(() => {
        // Remove the temporary container after PDF is generated
        document.body.removeChild(tempDiv);
    });
}

// Function to make all fields read-only when status is not Draft
function makeAllFieldsReadOnlyForNonDraft() {
    console.log('Status is not Draft - making all fields read-only');
    
    // Make all input fields read-only
    const inputFields = document.querySelectorAll('input[type="text"], input[type="date"], input[type="number"], input[type="file"], textarea');
    inputFields.forEach(field => {
        field.readOnly = true;
        field.disabled = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
    });
    
    // Disable all select fields
    const selectFields = document.querySelectorAll('select');
    selectFields.forEach(field => {
        field.disabled = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
    });
    
    // Hide all approval dropdown divs
    const approvalDropdowns = [
        'Approval.PreparedByIdDropdown',
        'Approval.CheckedByIdDropdown', 
        'Approval.ApprovedByIdDropdown',
        'Approval.AcknowledgedByIdDropdown'
    ];
    
    approvalDropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    });
    
    // Hide action buttons (Update, Submit, Delete)
    const actionButtons = document.querySelectorAll('button[onclick*="updateCash"], button[onclick*="confirmDelete"]');
    actionButtons.forEach(button => {
        button.style.display = 'none';
    });
    
    // Hide add row button
    const addRowButton = document.querySelector('button[onclick="addRow()"]');
    if (addRowButton) {
        addRowButton.style.display = 'none';
    }
    
    // Hide all delete row buttons in table
    const deleteButtons = document.querySelectorAll('button[onclick="deleteRow(this)"]');
    deleteButtons.forEach(button => {
        button.style.display = 'none';
    });
    
    // Disable file upload input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.disabled = true;
        fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
    
    // Update attachments display to hide remove buttons
    updateAttachmentsDisplay();
}

// Function to display attachments (initial load)
function displayAttachments(attachments) {
    // Just call the update function which handles both existing and new files
    updateAttachmentsDisplay();
}