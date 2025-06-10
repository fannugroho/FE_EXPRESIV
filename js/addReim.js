// Using BASE_URL from auth.js instead of hardcoded baseUrl
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
    const searchInput = document.getElementById(`${fieldId.replace('Select', '')}Search`);
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    
    // Kosongkan dropdown
    dropdown.innerHTML = '';
    
    // Filter pengguna berdasarkan teks pencarian
    const filteredUsers = mockUsers.filter(user => user.name.toLowerCase().includes(searchText));
    
    // Tampilkan hasil pencarian
    filteredUsers.forEach(user => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        option.innerText = user.name;
        option.onclick = function() {
            searchInput.value = user.name;
            document.getElementById(fieldId).value = user.id;
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(option);
    });
    
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
    
    // Fetch users from API to populate dropdowns
    fetchUsers();
    
    // Setup event listener untuk hide dropdown saat klik di luar
    document.addEventListener('click', function(event) {
        const dropdowns = [
            'preparedBySelectDropdown', 
            'acknowledgeBySelectDropdown', 
            'checkedBySelectDropdown', 
            'approvedBySelectDropdown'
        ];
        
        const searchInputs = [
            'preparedBySearch', 
            'acknowledgeBySearch', 
            'checkedBySearch', 
            'approvedBySearch'
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
        'preparedBySearch',
        'acknowledgeBySearch',
        'checkedBySearch',
        'approvedBySearch'
    ];
    
    searchFields.forEach(fieldId => {
        const searchInput = document.getElementById(fieldId);
        if (searchInput) {
            searchInput.addEventListener('focus', function() {
                const actualFieldId = fieldId.replace('Search', 'Select');
                filterUsers(actualFieldId);
            });
        }
    });
});

async function saveDocument() {
    try {
        Swal.fire({
            title: 'Konfirmasi',
            text: 'Apakah dokumen sudah benar?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await processDocument(false);
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Dokumen berhasil disimpan.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    goToMenuReim(); // Navigate to menu page after clicking OK
                });
            }
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
    reimTable.style.display = this.value === "Pilih" ? "none" : "table";
});

function previewPDF(event) {
    const files = event.target.files;
    if (files.length + uploadedFiles.length > 5) {
        alert('Maximum 5 files are allowed.');
        return;
    }

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
        <td class="p-2 border"><input type="text" maxlength="30" class="w-full" required /></td>
        <td class="p-2 border"><input type="number" maxlength="200" class="w-full" required /></td>
        <td class="p-2 border"><input type="text" maxlength="10" class="w-full" required /></td>
        <td class="p-2 border"><input type="number" maxlength="10" class="w-full" required /></td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;

    tableBody.appendChild(newRow);
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
        
        // Populate dropdowns
        populateDropdown("preparedBySelect", users);
        populateDropdown("acknowledgeBySelect", users);
        populateDropdown("checkedBySelect", users);
        populateDropdown("approvedBySelect", users);
        
    } catch (error) {
        console.error("Error fetching users:", error);
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
        const option = document.createElement("option");
        option.value = user.id;
        
        // Combine names with spaces, handling empty middle/last names
        let displayName = user.firstName;
        if (user.middleName) displayName += ` ${user.middleName}`;
        if (user.lastName) displayName += ` ${user.lastName}`;
        
        option.textContent = displayName;
        dropdown.appendChild(option);
    });
}

function submitDocument() {
    Swal.fire({
        title: 'Konfirmasi',
        text: 'Apakah dokumen sudah benar?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await processDocument(true);
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Dokumen berhasil di-submit.',
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

// Common function to process document with isSubmit parameter
async function processDocument(isSubmit) {
    // Step 1: Collect reimbursement details from the form
    const reimbursementDetails = [];
    const tableRows = document.querySelectorAll("#tableBody tr");
    
    tableRows.forEach(row => {
        const inputs = row.querySelectorAll("input");
        if (inputs.length >= 4) {
            reimbursementDetails.push({
                description: inputs[0].value || "",
                glAccount: inputs[1].value || "",
                accountName: inputs[2].value || "",
                amount: parseFloat(inputs[3].value) || 0
            });
        }
    });

    // Step 2: Prepare the request data
    const getElementValue = (id) => {
        const element = document.getElementById(id);
        return element ? element.value : "";
    };
    
    // Get approval values directly from select elements
    const getApprovalValue = (id) => {
        const selectElement = document.getElementById(`${id}Select`);
        return selectElement ? selectElement.value : "";
    };

    const reimbursementData = {
        voucherNo: getElementValue("voucherNo"),
        requesterName: getElementValue("requesterName"),
        department: getElementValue("department"),
        payTo: getElementValue("payTo"),
        currency: getElementValue("currency"),
        submissionDate: getElementValue("postingDate"),
        status: getElementValue("status"),
        referenceDoc: getElementValue("referenceDoc"),
        typeOfTransaction: getElementValue("typeOfTransaction"),
        remarks: getElementValue("remarks"),
        preparedBy: getApprovalValue("preparedBy"),
        checkedBy: getApprovalValue("checkedBy"),
        acknowledgedBy: getApprovalValue("acknowledgeBy"),
        approvedBy: getApprovalValue("approvedBy"),
        reimbursementDetails: reimbursementDetails,
        isSubmit: isSubmit
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
    