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
    const prTable = document.getElementById("prTable");
    const addRowButton = document.querySelector("button[onclick='addRow()']");
    
    // Show table and add button if a PR type is selected
    if (prType === "Item" || prType === "Service") {
        if (prTable) prTable.style.display = "table";
        if (addRowButton) addRowButton.style.display = "block";
    } else {
        if (prTable) prTable.style.display = "none";
        if (addRowButton) addRowButton.style.display = "none";
        return; // Exit if no valid type is selected
    }
    
    // Item fields IDs
    const itemFieldIds = [
        "thItemCode", "thItemName", "thDetail", "thPurposed", "thQuantity", "thAction"
    ];
    
    // Service fields IDs
    const serviceFieldIds = [
        "thDescription", "thPurposes", "thQty", "thActions"
    ];

    if (prType === "Item") {
        // Show Item fields, hide Service fields
        itemFieldIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = "table-cell";
        });
        
        serviceFieldIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = "none";
        });
        
        // Clear existing rows and add an Item row
        clearTableRows();
        addItemRow();
        
    } else if (prType === "Service") {
        // Hide Item fields, show Service fields
        itemFieldIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = "none";
        });
        
        serviceFieldIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = "table-cell";
        });
        
        // Clear existing rows and add a Service row
        clearTableRows();
        addServiceRow();
    }
}

function clearTableRows() {
    const tableBody = document.getElementById("tableBody");
    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }
}

function fillItemDetails() {
    // Get the selected item code
    const itemCode = this.value;
    
    // Find the row containing this select element
    const row = this.closest('tr');
    
    // Find the item name input in the same row
    const itemName = row.querySelector('td#tdItemName input');
    
    const itemData = {
        "ITM001": { name: "Laptop" },
        "ITM002": { name: "Printer" },
        "ITM003": { name: "Scanner" }
    };

    if (itemData[itemCode] && itemName) {
        itemName.value = itemData[itemCode].name;
    } else if (itemName) {
        itemName.value = "";
        if (!itemData[itemCode]) {
            alert("Item No not found!");
        }
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
    const prType = document.getElementById("prType").value;
    if (prType === "Item") {
        addItemRow();
    } else if (prType === "Service") {
        addServiceRow();
    } else {
        alert("Please select a PR Type first (Item or Service)");
    }
}

function addItemRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");
    
    // Create Item No cell
    const tdItemCode = document.createElement("td");
    tdItemCode.className = "p-2 border";
    tdItemCode.id = "tdItemCode";
    const itemSelect = document.createElement("select");
    itemSelect.className = "w-full p-2 border rounded";
    itemSelect.onchange = fillItemDetails;
    
    // Add options to select
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.innerText = "Pilih Kode Item";
    itemSelect.appendChild(defaultOption);
    
    const items = [
        { value: "ITM001", text: "ITM001 - Laptop" },
        { value: "ITM002", text: "ITM002 - Printer" },
        { value: "ITM003", text: "ITM003 - Scanner" }
    ];
    
    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item.value;
        option.innerText = item.text;
        itemSelect.appendChild(option);
    });
    
    tdItemCode.appendChild(itemSelect);
    newRow.appendChild(tdItemCode);
    
    // Create Description cell
    const tdItemName = document.createElement("td");
    tdItemName.className = "p-2 border";
    tdItemName.id = "tdItemName";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = "itemName" + Date.now(); // Generate unique ID
    nameInput.maxLength = 200;
    nameInput.className = "w-full";
    nameInput.readOnly = true;
    tdItemName.appendChild(nameInput);
    newRow.appendChild(tdItemName);
    
    // Create Detail cell
    const tdDetail = document.createElement("td");
    tdDetail.className = "p-2 border";
    tdDetail.id = "tdDetail";
    const detailInput = document.createElement("input");
    detailInput.type = "text";
    detailInput.maxLength = 10;
    detailInput.className = "w-full";
    detailInput.required = true;
    tdDetail.appendChild(detailInput);
    newRow.appendChild(tdDetail);
    
    // Create Purpose cell
    const tdPurpose = document.createElement("td");
    tdPurpose.className = "p-2 border";
    tdPurpose.id = "tdPurposed";
    const purposeInput = document.createElement("input");
    purposeInput.type = "text";
    purposeInput.maxLength = 10;
    purposeInput.className = "w-full";
    purposeInput.required = true;
    tdPurpose.appendChild(purposeInput);
    newRow.appendChild(tdPurpose);
    
    // Create Quantity cell
    const tdQuantity = document.createElement("td");
    tdQuantity.className = "p-2 border";
    tdQuantity.id = "tdQuantity";
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.maxLength = 10;
    qtyInput.className = "w-full";
    qtyInput.required = true;
    tdQuantity.appendChild(qtyInput);
    newRow.appendChild(tdQuantity);
    
    // Create Action cell
    const tdAction = document.createElement("td");
    tdAction.className = "p-2 border text-center";
    tdAction.id = "tdAction";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.onclick = function() { deleteRow(this); };
    deleteButton.className = "text-red-500 hover:text-red-700";
    deleteButton.innerText = "🗑";
    tdAction.appendChild(deleteButton);
    newRow.appendChild(tdAction);
    
    // Add service cells (hidden)
    for (let i = 0; i < 4; i++) {
        const td = document.createElement("td");
        td.style.display = "none";
        newRow.appendChild(td);
    }

    tableBody.appendChild(newRow);
}

function addServiceRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");

    // Create the cells for Item columns (hidden)
    for (let i = 0; i < 6; i++) {
        const td = document.createElement("td");
        td.style.display = "none";
        newRow.appendChild(td);
    }
    
    // Create Description cell
    const tdDescription = document.createElement("td");
    tdDescription.className = "p-2 border";
    tdDescription.id = "tdDescription";
    const descInput = document.createElement("input");
    descInput.type = "text";
    descInput.maxLength = 200;
    descInput.className = "w-full";
    descInput.required = true;
    tdDescription.appendChild(descInput);
    newRow.appendChild(tdDescription);
    
    // Create Purpose cell
    const tdPurpose = document.createElement("td");
    tdPurpose.className = "p-2 border";
    tdPurpose.id = "tdPurposes";
    const purposeInput = document.createElement("input");
    purposeInput.type = "text";
    purposeInput.maxLength = 100;
    purposeInput.className = "w-full";
    purposeInput.required = true;
    tdPurpose.appendChild(purposeInput);
    newRow.appendChild(tdPurpose);
    
    // Create Qty cell
    const tdQty = document.createElement("td");
    tdQty.className = "p-2 border";
    tdQty.id = "tdQty";
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.maxLength = 10;
    qtyInput.className = "w-full";
    qtyInput.required = true;
    tdQty.appendChild(qtyInput);
    newRow.appendChild(tdQty);
    
    // Create Action cell
    const tdAction = document.createElement("td");
    tdAction.className = "p-2 border text-center";
    tdAction.id = "tdActions";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.onclick = function() { deleteRow(this); };
    deleteButton.className = "text-red-500 hover:text-red-700";
    deleteButton.innerText = "🗑";
    tdAction.appendChild(deleteButton);
    newRow.appendChild(tdAction);

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
function goToMenuReim() { window.location.href = "MenuReim.html"; }
function goToMenuCash() { window.location.href = "MenuCash.html"; }
function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
function goToMenuPO() { window.location.href = "MenuPO.html"; }
function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; }

// Call toggleFields on page load to initialize the table correctly
window.onload = function() {
    const prType = document.getElementById("prType");
    const prTable = document.getElementById("prTable");
    
    if (prType) {
        // Set default value to "Item" instead of "choose"
        prType.value = "Item";
        
        // Add event listener to make sure toggleFields is called when prType changes
        prType.addEventListener("change", toggleFields);
        
        // Call toggleFields immediately to set up the table for Item type
        toggleFields();
    }
    
    // We don't need to hide the table now since toggleFields will show it
    // Initially show the add row button
    const addRowButton = document.querySelector("button[onclick='addRow()']");
    if (addRowButton) {
        addRowButton.style.display = "block";
    }
};