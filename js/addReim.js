let uploadedFiles = [];
const baseUrl = "https://expressiv.idsdev.site";

// Setup file input listener when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById("filePath");
    if (fileInput) {
        fileInput.addEventListener('change', previewPDF);
    }
    
    // Fetch users from API to populate dropdowns
    fetchUsers();
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
            <button type="button" onclick="removeFile(${index})" class="text-red-500">Remove</button>
        `;
        fileListContainer.appendChild(fileItem);
    });
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
        const response = await fetch(`${baseUrl}/api/users`);
        
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
    dropdown.innerHTML = "";
    
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
    const response = await fetch(`${baseUrl}/api/reimbursements`, {
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

        const uploadResponse = await fetch(`${baseUrl}/api/reimbursements/${reimbursementId}/attachments/upload`, {
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
    