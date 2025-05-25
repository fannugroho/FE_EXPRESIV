const BASE_URL = "http://localhost:5246";
let uploadedFiles = [];

let prId; // Declare global variable
let prType; // Declare global variable

// Function to fetch PR details when the page loads
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    prId = urlParams.get('pr-id');
    prType = urlParams.get('pr-type');
    fetchPRDetails(prId, prType);
};

function populateUserSelects(users) {
    const selects = [
        'prepared', 'checkedBy', 'acknowledgeBy', 'approvedBy', 'receivedBy'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            // Store the currently selected value
            const currentValue = select.value;
            
            select.innerHTML = '<option value="" disabled>Select User</option>';
            
            users.forEach(user => {
                const option = document.createElement("option");
                option.value = user.id;
                option.textContent = user.name || `${user.firstName} ${user.lastName}`;
                select.appendChild(option);
            });
            
            // Restore the selected value if it exists
            if (currentValue) {
                select.value = currentValue;
            }
        }
    });
}

// function populateItemSelect(items, selectElement) {
//     selectElement.innerHTML = '<option value="" disabled>Select Item</option>';

//     items.forEach(item => {
//         const option = document.createElement("option");
//         option.value = item.id || item.itemCode;
//         option.textContent = `${item.itemNo || item.itemCode} - ${item.name || item.itemName}`;
//         selectElement.appendChild(option);
//     });
// }

// function populateClassificationSelect(classifications) {
//     const classificationSelect = document.getElementById("classification");
//     classificationSelect.innerHTML = '<option value="" disabled>Select Classification</option>';

//     classifications.forEach(classification => {
//         const option = document.createElement("option");
//         option.value = classification.id;
//         option.textContent = classification.name;
//         classificationSelect.appendChild(option);
//     });
// }

function fetchPRDetails(prId, prType) {
    const endpoint = prType.toLowerCase() === 'service' ? 'service' : 'item';
    fetch(`${BASE_URL}/api/pr/${endpoint}/${prId}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(response => {
            if (response.data) {
                console.log(response.data);
                populatePRDetails(response.data);
                document.getElementById('prType').value = prType;
                toggleFields();
                
                // Always fetch dropdown options
                fetchDropdownOptions();
                
                // Enable fields only if status is Draft
                const isEditable = response.data.approval && response.data.approval.status === 'Draft';
                toggleEditableFields(isEditable);
                
                // Enable or disable the Update button based on status
                const updateButton = document.querySelector('button[onclick="updatePR()"]');
                if (updateButton) {
                    updateButton.disabled = !isEditable;
                    if (!isEditable) {
                        updateButton.classList.add('opacity-50', 'cursor-not-allowed');
                        updateButton.title = 'You can only update PRs with Draft status';
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error fetching PR details: ' + error.message);
        });
}

// Function to fetch all dropdown options
function fetchDropdownOptions() {
    fetchDepartments();
    fetchUsers();
    fetchClassifications();
    if (document.getElementById("prType").value === "Item") {
        fetchItemOptions();
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

// Function to fetch users from API
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

// Function to fetch classifications from API
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

// Function to fetch items from API
function fetchItemOptions() {
    fetch(`${BASE_URL}/api/items`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Item data:", data);
            // Populate all item selects in the document
            document.querySelectorAll('.item-no').forEach(select => {
                populateItemSelect(data.data, select);
            });
        })
        .catch(error => {
            console.error('Error fetching items:', error);
        });
}

// Function to populate department select
function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("department");
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

// Function to populate classification select
function populateClassificationSelect(classifications) {
    const classificationSelect = document.getElementById("classification");
    if (!classificationSelect) return;
    
    // Store the currently selected value
    const currentValue = classificationSelect.value;
    const currentText = classificationSelect.options[classificationSelect.selectedIndex]?.text;

    console.log(currentValue);
    console.log(currentText);
    
    classificationSelect.innerHTML = '<option value="" disabled>Select Classification</option>';

    classifications.forEach(classification => {
        const option = document.createElement("option");
        option.value = classification.id;
        option.textContent = classification.name;
        classificationSelect.appendChild(option);
        
        // If this classification matches the current text, select it
        if (classification.name === currentText) {
            console.log("Classification matches current text");
            option.selected = true;
        }

        
    });
    
    // If we have a current value and it wasn't matched by text, try to select by value
    if (currentValue && classificationSelect.value !== currentValue) {
        classificationSelect.value = currentValue;
    }
}

// Function to populate item select
function populateItemSelect(items, selectElement) {
    if (!selectElement) return;
    
    // Store the currently selected value
    const currentValue = selectElement.value;
    const currentText = selectElement.options[selectElement.selectedIndex]?.text;
    
    selectElement.innerHTML = '<option value="" disabled>Select Item</option>';

    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id || item.itemCode;
        option.textContent = `${item.itemNo || item.itemCode} - ${item.name || item.itemName}`;
        selectElement.appendChild(option);
        
        // If this item matches the current text or value, select it
        if (option.textContent === currentText || option.value === currentValue) {
            option.selected = true;
        }
    });
}

// Function to toggle editable fields based on PR status
function toggleEditableFields(isEditable) {
    // List all input fields that should be editable or not
    const inputFields = [
        'purchaseRequestNo',
        'requesterName',
        'department',
        'classification',
        // 'prType',
        'submissionDate',
        'requiredDate',
        // 'status',
        'remarks',
        'PO',
        'NonPO'
    ];
    
    // Toggle readonly/disabled attribute for each field
    inputFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            if ((field.tagName === 'INPUT' && field.type !== 'checkbox') || field.tagName === 'TEXTAREA') {
                field.readOnly = !isEditable;
            } else {
                field.disabled = !isEditable;
            }
            
            // Add visual indication for non-editable fields
            if (!isEditable) {
                field.classList.add('bg-gray-100');
            } else {
                field.classList.remove('bg-gray-100');
            }
        }
    });
    
    // Handle table inputs
    const tableInputs = document.querySelectorAll('#tableBody input, #tableBody select');
    tableInputs.forEach(input => {
        if (input.type !== 'checkbox') {
            input.readOnly = !isEditable;
        } else {
            input.disabled = !isEditable;
        }
        
        // Add visual indication for non-editable fields
        if (!isEditable) {
            input.classList.add('bg-gray-100');
        } else {
            input.classList.remove('bg-gray-100');
        }
    });
    
    // Enable/disable add row button
    const addRowButton = document.querySelector('button[onclick="addRow()"]');
    if (addRowButton) {
        addRowButton.style.display = isEditable ? 'block' : 'none';
    }
    
    // Enable/disable delete row buttons
    const deleteButtons = document.querySelectorAll('button[onclick="deleteRow(this)"]');
    deleteButtons.forEach(button => {
        button.style.display = isEditable ? 'block' : 'none';
    });
    
    // Handle approval checkboxes and selects
    const approvalFields = [
        'preparedByCheck', 'prepared',
        'checkedByCheck', 'checkedBy',
        'acknowledgeByCheck', 'acknowledgeBy',
        'approvedByCheck', 'approvedBy',
        'receivedByCheck', 'receivedBy'
    ];
    
    approvalFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = !isEditable;
            if (!isEditable) {
                field.classList.add('bg-gray-100');
            } else {
                field.classList.remove('bg-gray-100');
            }
        }
    });
}

function populatePRDetails(data) {
    // Populate basic PR information
    document.getElementById('purchaseRequestNo').value = data.purchaseRequestNo;
    document.getElementById('requesterName').value = data.requesterName;
    document.getElementById('prType').value = data.prType;
    
    // Format and set dates
    const submissionDate = new Date(data.submissionDate).toISOString().split('T')[0];
    const requiredDate = new Date(data.requiredDate).toISOString().split('T')[0];
    document.getElementById('submissionDate').value = submissionDate;
    document.getElementById('requiredDate').value = requiredDate;
    
    // Set document type checkboxes
    document.getElementById('PO').checked = data.documentType === 'PO';
    document.getElementById('NonPO').checked = data.documentType === 'NonPO';
    
    // Set remarks
    document.getElementById('remarks').value = data.remarks;

    // Store the values to be used after fetching options
    window.currentValues = {
        department: data.departmentName,
        classification: data.classification,
        status: data.approval?.status || 'Draft'
    };
    
    // Set approval checkboxes and names
    if (data.approval) {
        // Store approval values
        window.currentValues.approvals = {
            prepared: data.approval.preparedByName,
            checked: data.approval.checkedByName,
            acknowledged: data.approval.acknowledgedByName,
            approved: data.approval.approvedByName,
            received: data.approval.receivedByName
        };

        // Set checkboxes
        if (data.approval.preparedById) {
            document.getElementById('preparedByCheck').checked = true;
        }
        if (data.approval.checkedById) {
            document.getElementById('checkedByCheck').checked = true;
        }
        if (data.approval.acknowledgedById) {
            document.getElementById('acknowledgeByCheck').checked = true;
        }
        if (data.approval.approvedById) {
            document.getElementById('approvedByCheck').checked = true;
        }
        if (data.approval.receivedById) {
            document.getElementById('receivedByCheck').checked = true;
        }
    }
    
    // Handle service/item details based on PR type
    if (data.prType === 'Service' && data.serviceDetails) {
        populateServiceDetails(data.serviceDetails);
    } else if (data.itemDetails) {
        populateItemDetails(data.itemDetails);
    }
}

function populateServiceDetails(services) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (services.length === 0) {
        addRow(); // Add empty row if no services
        return;
    }
    
    services.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border">
                <input type="text" value="${service.description}" class="w-full service-description" maxlength="200" required />
            </td>
            <td class="p-2 border">
                <input type="text" value="${service.purpose}" class="w-full service-purpose" maxlength="10" required />
            </td>
            <td class="p-2 border">
                <input type="text" value="${service.quantity}" class="w-full service-quantity" maxlength="10" required />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function populateItemDetails(items) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (items.length === 0) {
        addRow(); // Add empty row if no items
        return;
    }
    
    items.forEach(item => {
        console.log(item);
        addItemRow(item);
    });
}

function addItemRow(item = null) {
    const tableBody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td class="p-2 border item-field">
            <select class="w-full p-2 border rounded item-no" onchange="updateItemDescription(this)">
                <option value="" disabled ${!item ? 'selected' : ''}>Select Item</option>
                ${item ? `<option value="${item.itemCode}" selected>${item.itemCode}</option>` : ''}
            </select>
        </td>
        <td class="p-2 border item-field">
            <input type="text" value="${item?.description || ''}" class="w-full item-description" maxlength="200" required />
        </td>
        <td class="p-2 border item-field">
            <input type="text" value="${item?.detail || ''}" class="w-full item-detail" maxlength="100" required />
        </td>
        <td class="p-2 border item-field">
            <input type="text" value="${item?.purpose || ''}" class="w-full item-purpose" maxlength="100" required />
        </td>
        <td class="p-2 border item-field">
            <input type="number" value="${item?.quantity || ''}" class="w-full item-quantity" min="1" required />
        </td>
        <td class="p-2 border text-center item-field">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;
    
    tableBody.appendChild(row);
    
    // Fetch item options for the new dropdown
    const itemNoSelect = row.querySelector('.item-no');
    fetchItemOptions(itemNoSelect);
}

function addRow() {
    const prType = document.getElementById("prType").value;
    if (prType === "Service") {
        const tableBody = document.getElementById("tableBody");
        const newRow = document.createElement("tr");
        
        newRow.innerHTML = `
            <td class="p-2 border">
                <input type="text" class="w-full service-description" maxlength="200" required />
            </td>
            <td class="p-2 border">
                <input type="text" class="w-full service-purpose" maxlength="10" required />
            </td>
            <td class="p-2 border">
                <input type="text" class="w-full service-quantity" maxlength="10" required />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
            </td>
        `;
        
        tableBody.appendChild(newRow);
    } else {
        addItemRow();
    }
}

function updateItemDescription(selectElement) {
    const row = selectElement.closest('tr');
    const descriptionInput = row.querySelector('.item-description');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    
    if (selectedOption && !selectedOption.disabled) {
        const itemText = selectedOption.text;
        const itemName = itemText.split(' - ')[1];
        descriptionInput.value = itemName || '';
    } else {
        descriptionInput.value = '';
    }
}

function deleteRow(button) {
    button.closest("tr").remove();
}

function confirmDelete() {
    if (!prId) {
        alert('PR ID not found');
        return;
    }

    const endpoint = prType.toLowerCase() === 'service' ? 'service' : 'item';
    
    // Check if status is Draft before allowing delete
    const status = document.getElementById('status').value;
    if (status !== 'Draft') {
        alert('You can only delete PRs with Draft status');
        return;
    }

    if (confirm('Are you sure you want to delete this PR?')) {
        fetch(`${BASE_URL}/api/pr/${endpoint}/${prId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                alert('PR deleted successfully');
                window.location.href = '../pages/menuPR.html';
            } else {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `Failed to delete PR. Status: ${response.status}`);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting PR: ' + error.message);
        });
    }
}

function updatePR() {
    if (!prId) {
        alert('PR ID not found');
        return;
    }

    // Check the status before updating
    const status = document.getElementById('status').value;
    if (status !== 'Draft') {
        alert('You can only update PRs with Draft status');
        return;
    }

    const endpoint = prType.toLowerCase() === 'service' ? 'service' : 'item';

    try {
        // Create FormData object for the update
        const formData = new FormData();
        
        // Add basic fields
        formData.append('Id', prId);
        formData.append('PurchaseRequestNo', document.getElementById('purchaseRequestNo').value);
        formData.append('RequesterId', "deda05c6-8688-4d19-8f52-c0856a5752f4"); // Add RequesterId
        
        // Use the department ID from the select
        const departmentSelect = document.getElementById('department');
        formData.append('DepartmentId', departmentSelect.value);
        
        // Format dates
        const requiredDate = document.getElementById('requiredDate').value;
        if (requiredDate) {
            formData.append('RequiredDate', new Date(requiredDate).toISOString());
        }
        
        const submissionDate = document.getElementById('submissionDate').value;
        if (submissionDate) {
            formData.append('PostingDate', new Date(submissionDate).toISOString()); // Use PostingDate instead of SubmissionDate
        }
        
        // Use the classification text from the select
        const classificationSelect = document.getElementById('classification');
        const selectedClassification = classificationSelect.options[classificationSelect.selectedIndex].text;
        formData.append('Classification', selectedClassification);
        
        formData.append('Remarks', document.getElementById('remarks').value);
        
        // Document type (PO or Non PO)
        const isPO = document.getElementById('PO').checked;
        const isNonPO = document.getElementById('NonPO').checked;
        formData.append('DocumentType', isPO ? 'PO' : (isNonPO ? 'NonPO' : ''));
        
        // Approvals
        const approvalStatus = document.getElementById('status').value;
        formData.append('Approval.Status', approvalStatus);
        
        // Get all approvers
        const approvers = {
            'PreparedById': document.getElementById('prepared')?.value,
            'CheckedById': document.getElementById('checkedBy')?.value,
            'AcknowledgedById': document.getElementById('acknowledgeBy')?.value, 
            'ApprovedById': document.getElementById('approvedBy')?.value,
            'ReceivedById': document.getElementById('receivedBy')?.value
        };
        
        // Add approvers to the form data
        for (const [key, value] of Object.entries(approvers)) {
            if (value) {
                formData.append(`Approval.${key}`, value);
            }
        }
        
        // Item/Service details
        const rows = document.querySelectorAll('#tableBody tr');
        
        if (prType === 'Item') {
            rows.forEach((row, index) => {
                formData.append(`ItemDetails[${index}].ItemNo`, row.querySelector('.item-no').value);
                formData.append(`ItemDetails[${index}].Description`, row.querySelector('.item-description').value);
                formData.append(`ItemDetails[${index}].Detail`, row.querySelector('.item-detail').value);
                formData.append(`ItemDetails[${index}].Purpose`, row.querySelector('.item-purpose').value);
                formData.append(`ItemDetails[${index}].Quantity`, row.querySelector('.item-quantity').value);
            });
        } else if (prType === 'Service') {
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
        fetch(`${BASE_URL}/api/pr/${endpoint}/${prId}`, {
            method: 'PUT',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                alert('PR updated successfully');
                // Refresh the page to show updated data
                location.reload();
            } else {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `Failed to update PR. Status: ${response.status}`);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error updating PR: ' + error.message);
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Error preparing update data: ' + error.message);
    }
}

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

function saveDocument() {
    let documents = JSON.parse(localStorage.getItem("documents")) || [];
    const docNumber = `PR${Date.now()}`; // Gunakan timestamp agar unik

    const documentData = {
        id: document.getElementById("id").value,
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

function goToMenuPR() { window.location.href = "../pages/menuPR.html"; }
function goToAddDoc() {window.location.href = "../addPages/addPR.html"; }
function goToAddReim() {window.location.href = "AddReim.html"; }
function goToAddCash() {window.location.href = "AddCash.html"; }
function goToAddSettle() {window.location.href = "AddSettle.html"; }
function goToAddPO() {window.location.href = "AddPO.html"; }
function goToMenuPR() { window.location.href = "MenuPR.html"; }
function goToMenuReim() { window.location.href = "MenuReim.html"; }
function goToMenuCash() { window.location.href = "MenuCash.html"; }
function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
function goToMenuPO() { window.location.href = "MenuPO.html"; }
function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; }