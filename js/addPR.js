let uploadedFiles = [];
const BASE_URL = 'http://localhost:5246/api'; // Update with your actual API base URL

function saveDocument() {
    let documents = JSON.parse(localStorage.getItem("documents")) || [];
    const itemDataArray = []; // Array to hold the extracted item data
    const rows = document.querySelectorAll("#tableBody tr"); // Select all rows in the table body
    document.getElementById("requesterId").value = "deda05c6-8688-4d19-8f52-c0856a5752f4";
    const documentData = {
        id: document.getElementById("requesterId").value,
        prno: document.getElementById("purchaseRequestNo").value,
        requester: document.getElementById("requesterName").value,
        department: document.getElementById("department").value,
        postingDate: document.getElementById("submissionDate").value,
        requiredDate: document.getElementById("requiredDate").value,
        classification: document.getElementById("classification").value,
        prType: document.getElementById("prType").value,
        status: document.getElementById("status").value,
        approvals: {
            prepared: document.getElementById("preparedByName").checked,
            checked: document.getElementById("checkedByName").checked,
            approved: document.getElementById("approvedByName").checked,
            acknowledge: document.getElementById("acknowledgeByName").checked,
            purchasing: document.getElementById("purchasingByName").checked,
        }
    };

    documents.push(documentData);
    console.log(documents);
    localStorage.setItem("documents", JSON.stringify(documents));
    alert("Dokumen berhasil disimpan!");
}

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
    console.log("PR Type selected:", prType);
    
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

function fillItemDetails() {
    const itemCode = document.getElementById("itemNo").value;
    const itemName = document.getElementById("itemName");
    const itemPrice = document.getElementById("itemPrice");

    const itemData = {
        "ITM001": { name: "Laptop", price: "15,000,000" },
        "ITM002": { name: "Printer", price: "3,500,000" },
        "ITM003": { name: "Scanner", price: "2,000,000" }
    };

    if (itemData[itemCode]) {
        itemName.value = itemData[itemNo].name;
        itemPrice.value = itemData[itemNo].price;
    } else {
        itemName.value = "";
        itemPrice.value = "";
        alert("Item No not found!");
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
    const fileListContainer = document.getElementById("fileList");
    if (fileListContainer) {
        fileListContainer.innerHTML = '';
        uploadedFiles.forEach((file, index) => {
            const fileItem = document.createElement("div");
            fileItem.className = "flex justify-between items-center p-2 border-b";
            fileItem.innerHTML = `
                <span>${file.name}</span>
                <button type="button" onclick="removeFile(${index})" class="text-red-500 hover:text-red-700">
                    Remove
                </button>
            `;
            fileListContainer.appendChild(fileItem);
        });
    }
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    displayFileList();
}

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");
    const prType = document.getElementById("prType").value;
    
    if (prType === "Item") {
        newRow.innerHTML = `
            <td class="p-2 border item-field">
                <select class="w-full p-2 border rounded item-no">
                    <option value="" disabled selected>Select Item</option>
                </select>
            </td>
            <td class="p-2 border item-field">
                <input type="text" class="w-full item-description" maxlength="200" required />
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
            <td class="p-2 border text-center item-field">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
            </td>
        `;
    } else if (prType === "Service") {
        newRow.innerHTML = `
            <td class="p-2 border service-field">
                <input type="text" class="w-full service-description" maxlength="200" required />
            </td>
            <td class="p-2 border service-field">
                <input type="text" class="w-full service-purpose" maxlength="100" required />
            </td>
            <td class="p-2 border service-field">
                <input type="number" class="w-full service-quantity" min="1" required />
            </td>
            <td class="p-2 border text-center service-field">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
            </td>
        `;
    }

    tableBody.appendChild(newRow);
    
    // If we just added an item row, populate its dropdown
    if (prType === "Item") {
        fetchItemOptions(newRow.querySelector('.item-no'));
    }
}

function deleteRow(button) {
    button.closest("tr").remove();
}

function goToMenuPR() { window.location.href = "../pages/menuPR.html"; }
function goToAddDoc() {window.location.href = "../addPages/addPR.html"; }
function goToAddReim() {window.location.href = "AddReim.html"; }
function goToAddCash() {window.location.href = "AddCash.html"; }
function goToAddSettle() {window.location.href = "AddSettle.html"; }
function goToAddPO() {window.location.href = "AddPO.html"; }
// function goToMenuPR() { window.location.href = "MenuPR.html"; }
function goToMenuReim() { window.location.href = "MenuReim.html"; }
function goToMenuCash() { window.location.href = "MenuCash.html"; }
function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
function goToMenuPO() { window.location.href = "MenuPO.html"; }
function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; }

window.onload = function(){
    fetchDepartments();
    fetchUsers();
    fetchItemOptions();
    fetchClassifications();
    document.getElementById("prType").value = "Item"; // Set default PR Type to Item
    toggleFields();
}

function fetchClassifications() {
    fetch(`${BASE_URL}/classifications`)
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
    fetch(`${BASE_URL}/department`)
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
    fetch(`${BASE_URL}/users`)
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
    fetch(`${BASE_URL}/items`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Item data:", data);
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
        option.value = department.id;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
    });
}

function populateUserSelects(users) {
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
                option.textContent = user.name || `${user.firstName} ${user.lastName}`;
                select.appendChild(option);
            });
        }
    });
}

function populateItemSelect(items, selectElement) {
    selectElement.innerHTML = '<option value="" disabled selected>Select Item</option>';

    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id || item.itemCode;
        option.textContent = `${item.itemNo || item.itemCode} - ${item.name || item.itemName}`;
        selectElement.appendChild(option);
    });
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
async function submitPurchaseRequest() {
    try {
        const prType = document.getElementById("prType").value;
        
        // Create FormData object
        const formData = new FormData();
        
        // Add basic fields
        formData.append('PurchaseRequestNo', document.getElementById("purchaseRequestNo").value);
        formData.append('RequesterId', "deda05c6-8688-4d19-8f52-c0856a5752f4");
        // formData.append('RequesterId', document.getElementById("requesterId").value);
        formData.append('DepartmentId', document.getElementById("department").value);
        
        // Format dates
        const requiredDate = document.getElementById("requiredDate").value;
        if (requiredDate) {
            formData.append('RequiredDate', new Date(requiredDate).toISOString());
        }
        
        const submissionDate = document.getElementById("submissionDate").value;
        if (submissionDate) {
            formData.append('SubmissionDate', new Date(submissionDate).toISOString());
        }
        
        // formData.append('Classification', document.getElementById("classification").value);
        const classificationSelect = document.getElementById("classification");
        const selectedText = classificationSelect.options[classificationSelect.selectedIndex].text;
        formData.append('Classification', selectedText);
        formData.append('Remarks', document.getElementById("remarks").value);
        
        // Document type (PO or Non PO)
        const isPO = document.getElementById("PO").checked;
        const isNonPO = document.getElementById("NonPO").checked;
        formData.append('DocumentType', isPO ? 'PO' : (isNonPO ? 'NonPO' : ''));
        
        // Approvals
        formData.append('Approval.PreparedById', document.getElementById("preparedBy").value);
        formData.append('Approval.CheckedById', document.getElementById("checkedBy").value);
        formData.append('Approval.AcknowledgedById', document.getElementById("acknowledgeBy").value);
        formData.append('Approval.ApprovedById', document.getElementById("approvedBy").value);
        formData.append('Approval.ReceivedById', document.getElementById("receivedBy").value);
        formData.append('Approval.Status', document.getElementById("status").value);
        
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
            // Handle service details similarly
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
        const response = await fetch(`${BASE_URL}/pr/${prType.toLowerCase()}`, {
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
                    // Format 1: { "StatusCode": 404, "Message": "..." }
                    errorMessage = errorData.Message;
                } else if (errorData.message) {
                    // Format 1 (lowercase): { "message": "..." }
                    errorMessage = errorData.message;
                } else if (errorData.errors && Array.isArray(errorData.errors)) {
                    // Format 2: { "success": false, "errors": ["error1", "error2", ...] }
                    errorMessage = "Validation errors:\n" + errorData.errors.join("\n");
                } else {
                    console.log("No Message property found in error response");
                }
            } catch (parseError) {
                console.log("Could not parse error response:", parseError);
            }
            throw new Error(errorMessage);
        }

        
        
        // const result = await response.json();
        // console.log("Submit result:", result);
        
        alert("Purchase Request submitted successfully!");
        window.location.href = "../pages/menuPR.html";
    } catch (error) {
        console.error("Error submitting form:", error);
        alert(`Failed to submit Purchase Request: ${error.message}`);
    }
}

function saveAsDraft() {
    const currentStatus = document.getElementById("status").value;
    document.getElementById("status").value = "Draft";
    submitPurchaseRequest();
}
