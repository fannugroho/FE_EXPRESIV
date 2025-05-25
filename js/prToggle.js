/**
 * PR Type Toggle Functionality
 * This script handles toggling between Item and Service PR types
 * It's designed to be used by all PR-related pages
 */

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
    if (tableBody) {
        while (tableBody.firstChild) {
            tableBody.removeChild(tableBody.firstChild);
        }
    }
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
    if (!tableBody) return;
    
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
    defaultOption.innerText = "Select Item Code";
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
    detailInput.maxLength = 100;
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
    purposeInput.maxLength = 100;
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
    
    tableBody.appendChild(newRow);
}

function addServiceRow() {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) return;
    
    const newRow = document.createElement("tr");
    
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
}

function deleteRow(button) {
    if (button && button.closest) {
        const row = button.closest("tr");
        if (row) row.remove();
    }
}

function fillItemDetails() {
    // Get the selected item code
    const itemCode = this.value;
    
    // Find the row containing this select element
    const row = this.closest('tr');
    if (!row) return;
    
    // Find the item name input in the same row
    const itemName = row.querySelector('td#tdItemName input');
    if (!itemName) return;
    
    const itemData = {
        "ITM001": { name: "Laptop" },
        "ITM002": { name: "Printer" },
        "ITM003": { name: "Scanner" }
    };

    if (itemData[itemCode]) {
        itemName.value = itemData[itemCode].name;
    } else {
        itemName.value = "";
        alert("Item No not found!");
    }
}

// Initialize table on page load
window.addEventListener('DOMContentLoaded', function() {
    const prType = document.getElementById("prType");
    if (prType) {
        // Set default value to "Item"
        prType.value = "Item";
        
        // Call toggleFields to initialize the table
        toggleFields();
    }
}); 