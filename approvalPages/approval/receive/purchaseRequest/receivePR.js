let uploadedFiles = [];

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
    const itemFields = ["thitemCode", "thItemName", "thDetail", "thPurposed", "thQuantity", "thAction", "tdItemCode", "tdItemName", "tdDetail", "tdPurposed", "tdQuantity", "tdAction"];
    const serviceFields = ["thDescription", "thPurposes", "thQty", "thActions", "tdDescription", "tdPurposeds", "tdQty", "tdActions"];

    if (prType === "Item") {
        itemFields.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.style.display = "table-cell";
        });
        serviceFields.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.style.display = "none";
        });
    } else if (prType === "Service") {
        itemFields.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.style.display = "none";
        });
        serviceFields.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.style.display = "table-cell";
        });
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

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const prType = document.getElementById("prType").value;
    const newRow = document.createElement("tr");
    
    if (prType === "Item") {
        newRow.innerHTML = `
            <td id="tdItemCode" class="p-2 border">
                <select class="w-full p-2 border rounded" onchange="fillItemDetails()">
                    <option value="" disabled selected>Pilih Kode Item</option>
                    <option value="ITM001">ITM001 - Laptop</option>
                    <option value="ITM002">ITM002 - Printer</option>
                    <option value="ITM003">ITM003 - Scanner</option>
                </select>
            </td>
            <td id="tdItemName" class="p-2 border">
                <input type="text" maxlength="200" class="w-full" readonly />
            </td>
            <td id="tdDetail" class="p-2 border">
                <input type="number" maxlength="10" class="w-full" required />
            </td>
            <td id="tdPurposed" class="p-2 border">
                <input type="text" maxlength="10" class="w-full" required />
            </td>
            <td id="tdQuantity" class="p-2 border">
                <input type="number" maxlength="10" class="w-full" required />
            </td>
            <td id="tdAction" class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
            <td id="tdDescription" class="p-2 border" style="display: none;">
                <input type="text" maxlength="200" class="w-full" readonly />
            </td>
            <td id="tdPurposeds" class="p-2 border" style="display: none;">
                <input type="text" maxlength="10" class="w-full" required />
            </td>
            <td id="tdQty" class="p-2 border" style="display: none;">
                <input type="text" maxlength="10" class="w-full" required />
            </td>
            <td id="tdActions" class="p-2 border text-center" style="display: none;">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
        `;
    } else if (prType === "Service") {
        newRow.innerHTML = `
            <td id="tdItemCode" class="p-2 border" style="display: none;">
                <select class="w-full p-2 border rounded">
                    <option value="" disabled selected>Pilih Kode Item</option>
                    <option value="ITM001">ITM001 - Laptop</option>
                    <option value="ITM002">ITM002 - Printer</option>
                    <option value="ITM003">ITM003 - Scanner</option>
                </select>
            </td>
            <td id="tdItemName" class="p-2 border" style="display: none;">
                <input type="text" maxlength="200" class="w-full" readonly />
            </td>
            <td id="tdDetail" class="p-2 border" style="display: none;">
                <input type="number" maxlength="10" class="w-full" required />
            </td>
            <td id="tdPurposed" class="p-2 border" style="display: none;">
                <input type="text" maxlength="10" class="w-full" required />
            </td>
            <td id="tdQuantity" class="p-2 border" style="display: none;">
                <input type="number" maxlength="10" class="w-full" required />
            </td>
            <td id="tdAction" class="p-2 border text-center" style="display: none;">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
            <td id="tdDescription" class="p-2 border">
                <input type="text" maxlength="200" class="w-full" required />
            </td>
            <td id="tdPurposeds" class="p-2 border">
                <input type="text" maxlength="10" class="w-full" required />
            </td>
            <td id="tdQty" class="p-2 border">
                <input type="text" maxlength="10" class="w-full" required />
            </td>
            <td id="tdActions" class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
        `;
    }

    tableBody.appendChild(newRow);
}

// Initialize table display on page load
window.addEventListener("DOMContentLoaded", function() {
    // Hide service fields by default
    const serviceFields = ["thDescription", "thPurposes", "thQty", "thActions", "tdDescription", "tdPurposeds", "tdQty", "tdActions"];
    serviceFields.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.style.display = "none";
    });
    
    // If PR type is already selected, toggle fields accordingly
    const prType = document.getElementById("prType");
    if (prType && prType.value !== "choose") {
        toggleFields();
    }
});

function deleteRow(button) {
    button.closest("tr").remove();
}

// add pages
function goToMenu() { window.location.href = "../../../../pages/dashboard.html"; }
function goToMenuPR() { window.location.href = "../../../../pages/menuPR.html"; }
function goToAddPR() {window.location.href = "../../../../addPages/addPR.html"; }
function goToAddReim() {window.location.href = "../../../../addPages/AddReim.html"; }
function goToAddCash() {window.location.href = "../../../../addPages/AddCash.html"; }
function goToAddSettle() {window.location.href = "../../../../addPages/AddSettle.html"; }
function goToAddPO() {window.location.href = "../../../../addPages/AddPO.html"; }

// detail pages
function goToDetailReim(reimId) {
    window.location.href = `/detailPages/detailReim.html?reim-id=${reimId}`;
}

// menu pages
function goToMenuAPR() { window.location.href = "menuPR.html"; }
function goToMenuPO() { window.location.href = "MenuPO.html"; }
function goToMenuReim() { window.location.href = "menuReim.html"; }
function goToMenuCash() { window.location.href = "menuCash.html"; }
function goToMenuSettle() { window.location.href = "menuSettle.html"; }
function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; }

//checked pages
function goToCheckedPR() { window.location.href = "../confirmPage/check/purchaseRequest/checkedPR.html"; }
function goToCheckedReim() { window.location.href = "../confirmPage/check/reimbursement/checkedReim.html"; }

window.onload = loadDashboard;