let uploadedFiles = [];

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
        
        // Add file attachments
        const fileInput = document.getElementById("Attachments");
        if (fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('Attachments', fileInput.files[i]);
            }
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

function populateUserSelects(users) {
    // Store users globally for search functionality
    window.requesters = users.map(user => ({
        id: user.id,
        fullName: user.name || `${user.firstName} ${user.middleName} ${user.lastName}`,
        department: user.department
    }));
    
    // Store employees globally for employee search functionality
    window.employees = users.map(user => ({
        id: user.id,
        kansaiEmployeeId: user.kansaiEmployeeId,
        fullName: user.name || `${user.firstName} ${user.middleName} ${user.lastName}`,
        department: user.department
    }));

    // Populate RequesterId dropdown with search functionality
    const requesterSelect = document.getElementById("RequesterId");
    if (requesterSelect) {
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name || `${user.firstName} ${user.lastName}`;
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
                    // Auto-fill the paidTo field with the selected requester name
                    const paidToField = document.getElementById('paidTo');
                    if (paidToField) {
                        paidToField.value = requester.fullName;
                    }
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
        "Approval.AcknowledgedById"
    ];

    approvalSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name || `${user.firstName} ${user.lastName}`;
                select.appendChild(option);
                // Auto-select and disable for Proposed by (Approval.PreparedById)
                if(selectId == "Approval.PreparedById"){
                   if(user.id == getUserId()){
                    option.selected = true;
                    select.disabled = true;
                   }
                }
            });
        }
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
    }
}

// Initialize all dropdowns when page loads
document.addEventListener('DOMContentLoaded', function() {
    fetchDepartments();
    fetchUsers();
    fetchTransactionType();
});