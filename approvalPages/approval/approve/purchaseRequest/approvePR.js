let uploadedFiles = [];
const baseUrl = "https://t246vds2-5246.asse.devtunnels.ms";

// Fungsi untuk mendapatkan parameter dari URL
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Fungsi untuk mengambil data dokumen dari API berdasarkan ID
async function fetchDocumentById(id) {
    try {
        const response = await fetch(`${baseUrl}/api/purchase-requests/${id}`);
        if (!response.ok) {
            throw new Error('Gagal mengambil data dokumen');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat mengambil data dokumen: ' + error.message);
    }
}

// Fungsi untuk mengisi form dengan data dokumen
function populateFormWithDocumentData(document) {
    // Mengisi data form
    document.getElementById('purchaseRequestNo').value = document.purchaseRequestNo || '';
    document.getElementById('requesterName').value = document.requesterName || '';
    document.getElementById('department').value = document.departmentName || '';
    document.getElementById('submissionDate').value = document.submissionDate || '';
    document.getElementById('requiredDate').value = document.requiredDate || '';
    document.getElementById('classification').value = document.classification || '';
    document.getElementById('prType').value = document.prType || '';
    document.getElementById('status').value = document.status || '';
    
    // Menampilkan item-item PR
    if (document.items && document.items.length > 0) {
        // Menghapus semua baris yang ada
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        
        // Menambahkan baris baru untuk setiap item
        document.items.forEach(item => {
            addRowWithData(item);
        });
    }
    
    // Mengatur checkbox approval jika ada
    if (document.approvals) {
        document.getElementById('prepared').checked = document.approvals.prepared || false;
        document.getElementById('checked').checked = document.approvals.checked || false;
        document.getElementById('knowledge').checked = document.approvals.acknowledge || false;
        document.getElementById('approved').checked = document.approvals.approved || false;
        document.getElementById('purchasing').checked = document.approvals.purchasing || false;
    }
}

// Fungsi untuk menambahkan baris tabel dengan data
function addRowWithData(itemData) {
    const tableBody = document.getElementById("tableBody");
    const prType = document.getElementById("prType").value;
    const newRow = document.createElement("tr");
    
    if (prType === "Item") {
        newRow.innerHTML = `
            <td id="tdItemCode" class="p-2 border">
                <select class="w-full p-2 border rounded" onchange="fillItemDetails()">
                    <option value="${itemData.itemCode}" selected>${itemData.itemCode}</option>
                </select>
            </td>
            <td id="tdItemName" class="p-2 border">
                <input type="text" maxlength="200" class="w-full" readonly value="${itemData.description || ''}" />
            </td>
            <td id="tdDetail" class="p-2 border">
                <input type="number" maxlength="10" class="w-full" required value="${itemData.price || ''}" />
            </td>
            <td id="tdPurposed" class="p-2 border">
                <input type="text" maxlength="10" class="w-full" required value="${itemData.purpose || ''}" />
            </td>
            <td id="tdQuantity" class="p-2 border">
                <input type="number" maxlength="10" class="w-full" required value="${itemData.quantity || ''}" />
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
                <input type="text" maxlength="200" class="w-full" required value="${itemData.description || ''}" />
            </td>
            <td id="tdPurposeds" class="p-2 border">
                <input type="text" maxlength="10" class="w-full" required value="${itemData.purpose || ''}" />
            </td>
            <td id="tdQty" class="p-2 border">
                <input type="text" maxlength="10" class="w-full" required value="${itemData.quantity || ''}" />
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

// Inisialisasi ketika halaman dimuat
window.addEventListener("DOMContentLoaded", async function() {
    // Mendapatkan ID dokumen dari URL
    const documentId = getParameterByName('id');
    
    if (documentId) {
        try {
            // Mengambil data dokumen dari API
            const documentData = await fetchDocumentById(documentId);
            
            if (documentData) {
                // Mengisi form dengan data dokumen
                populateFormWithDocumentData(documentData);
                
                // Menampilkan tabel sesuai dengan tipe PR
                toggleFields();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat memuat data dokumen: ' + error.message);
        }
    }
    
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

function saveDocument() {
    // Mendapatkan ID dokumen dari URL
    const documentId = getParameterByName('id');
    
    // Mengumpulkan data dokumen
    const documentData = {
        id: documentId || document.getElementById("id")?.value || `PR${Date.now()}`,
        purchaseRequestNo: document.getElementById("purchaseRequestNo").value,
        requesterName: document.getElementById("requesterName").value,
        departmentName: document.getElementById("department").value,
        submissionDate: document.getElementById("submissionDate").value,
        requiredDate: document.getElementById("requiredDate").value,
        classification: document.getElementById("classification").value,
        prType: document.getElementById("prType").value,
        status: document.getElementById("status").value,
        approvals: {
            prepared: document.getElementById("prepared").checked,
            checked: document.getElementById("checked").checked,
            approved: document.getElementById("approved").checked,
            acknowledge: document.getElementById("knowledge").checked,
            purchasing: document.getElementById("purchasing").checked,
        }
    };

    // Mengumpulkan data item dari tabel
    const items = [];
    const tableBody = document.getElementById("tableBody");
    const rows = tableBody.querySelectorAll("tr");
    
    rows.forEach(row => {
        const prType = document.getElementById("prType").value;
        if (prType === "Item") {
            const itemCode = row.querySelector("#tdItemCode select")?.value;
            const description = row.querySelector("#tdItemName input")?.value;
            const price = row.querySelector("#tdDetail input")?.value;
            const purpose = row.querySelector("#tdPurposed input")?.value;
            const quantity = row.querySelector("#tdQuantity input")?.value;
            
            if (description) {
                items.push({
                    itemCode,
                    description,
                    price,
                    purpose,
                    quantity
                });
            }
        } else if (prType === "Service") {
            const description = row.querySelector("#tdDescription input")?.value;
            const purpose = row.querySelector("#tdPurposeds input")?.value;
            const quantity = row.querySelector("#tdQty input")?.value;
            
            if (description) {
                items.push({
                    description,
                    purpose,
                    quantity
                });
            }
        }
    });
    
    documentData.items = items;
    
    // Mendapatkan catatan dari textarea jika ada
    const remarksTextarea = document.querySelector('textarea');
    if (remarksTextarea) {
        documentData.remarks = remarksTextarea.value;
    }
    
    if (documentId) {
        // Update dokumen yang sudah ada
        updateDocumentToAPI(documentId, documentData);
    } else {
        // Simpan dokumen baru
        saveDocumentToAPI(documentData);
    }
}

// Fungsi untuk menyimpan dokumen baru ke API
async function saveDocumentToAPI(documentData) {
    try {
        const response = await fetch(`${baseUrl}/api/purchase-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentData)
        });
        
        if (!response.ok) {
            throw new Error('Gagal menyimpan dokumen');
        }
        
        alert('Dokumen berhasil disimpan!');
        // Redirect ke halaman daftar dokumen
        window.location.href = "../../../dashboard/dashboardApprove/purchaseRequest/menuPRApprove.html";
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menyimpan dokumen: ' + error.message);
    }
}

// Fungsi untuk mengupdate dokumen yang sudah ada ke API
async function updateDocumentToAPI(documentId, documentData) {
    try {
        const response = await fetch(`${baseUrl}/api/purchase-requests/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentData)
        });
        
        if (!response.ok) {
            throw new Error('Gagal mengupdate dokumen');
        }
        
        alert('Dokumen berhasil diupdate!');
        // Redirect ke halaman daftar dokumen
        window.location.href = "../../../dashboard/dashboardApprove/purchaseRequest/menuPRApprove.html";
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat mengupdate dokumen: ' + error.message);
    }
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

function deleteRow(button) {
    button.closest("tr").remove();
}

// add pages
function goToMenu() { window.location.href = "../pages/dashboard.html"; }
function goToMenuPR() { window.location.href = "../pages/menuPR.html"; }
function goToAddPR() {window.location.href = "../addPages/addPR.html"; }
function goToAddReim() {window.location.href = "../addPages/AddReim.html"; }
function goToAddCash() {window.location.href = "../addPages/AddCash.html"; }
function goToAddSettle() {window.location.href = "../addPages/AddSettle.html"; }
function goToAddPO() {window.location.href = "../addPages/AddPO.html"; }

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

function printPurchaseRequest() {
    // Get form values
    const purchaseRequestNo = document.getElementById('purchaseRequestNo').value || '';
    const requesterName = document.getElementById('requesterName').value || '';
    const department = document.getElementById('department').value || '';
    const submissionDate = document.getElementById('submissionDate').value || '';
    const classification = document.getElementById('classification').value || '';
    const prType = document.getElementById('prType').value || '';
    
    // Get signatories
    const requestedBy = document.getElementById('prepared').checked ? 
        document.getElementById('prepared').nextElementSibling.querySelector('select').value : '';
    const checkedBy = document.getElementById('checked').checked ? 
        document.getElementById('Checked').value : '';
    const acknowledgedBy = document.getElementById('knowledge').checked ? 
        document.getElementById('Knowledge').value : '';
    const approvedBy = document.getElementById('approved').checked ? 
        document.getElementById('Approved').value : '';
    const purchasingBy = document.getElementById('purchasing').checked ? 
        document.getElementById('Approved').nextElementSibling.querySelector('select').value : '';
    
    // Get remarks if exists
    const remarksElement = document.querySelector('textarea');
    const remarks = remarksElement ? remarksElement.value : '';
    
    // Collect table items
    const tableItems = [];
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.querySelectorAll('tr');
    
    if (prType === 'Item') {
        rows.forEach(row => {
            const itemCodeSelect = row.querySelector('select');
            const itemNameInput = row.querySelector('#tdItemName input');
            const detailInput = row.querySelector('#tdDetail input');
            const purposeInput = row.querySelector('#tdPurposed input');
            const quantityInput = row.querySelector('#tdQuantity input');
            
            if (itemNameInput && itemNameInput.value.trim() !== '') {
                tableItems.push({
                    description: itemNameInput.value,
                    purpose: purposeInput ? purposeInput.value : '',
                    quantity: quantityInput ? quantityInput.value : '',
                    price: detailInput ? detailInput.value : '',
                    eta: '' // Optional field
                });
            }
        });
    } else if (prType === 'Service') {
        rows.forEach(row => {
            const descriptionInput = row.querySelector('#tdDescription input');
            const purposeInput = row.querySelector('#tdPurposeds input');
            const qtyInput = row.querySelector('#tdQty input');
            
            if (descriptionInput && descriptionInput.value.trim() !== '') {
                tableItems.push({
                    description: descriptionInput.value,
                    purpose: purposeInput ? purposeInput.value : '',
                    quantity: qtyInput ? qtyInput.value : '',
                    price: '',
                    eta: ''
                });
            }
        });
    }
    
    // Convert items array to JSON string and encode for URL
    const itemsParam = encodeURIComponent(JSON.stringify(tableItems));
    
    // Create URL with parameters
    const url = `printPR.html?purchaseRequestNo=${encodeURIComponent(purchaseRequestNo)}`
        + `&requesterName=${encodeURIComponent(requesterName)}`
        + `&department=${encodeURIComponent(department)}`
        + `&dateIssued=${encodeURIComponent(submissionDate)}`
        + `&classification=${encodeURIComponent(classification)}`
        + `&prType=${encodeURIComponent(prType)}`
        + `&checkedBy=${encodeURIComponent(checkedBy)}`
        + `&acknowledgedBy=${encodeURIComponent(acknowledgedBy)}`
        + `&approvedBy=${encodeURIComponent(approvedBy)}`
        + `&receivedDate=${encodeURIComponent(purchasingBy)}`
        + `&items=${itemsParam}`;
    
    // Open the print page in a new tab
    window.open(url, '_blank');
}

// Fungsi untuk menyetujui dokumen
async function approveDocument() {
    const documentId = getParameterByName('id');
    if (!documentId) {
        alert('Tidak dapat menyetujui dokumen: ID dokumen tidak ditemukan.');
        return;
    }
    
    try {
        // Mengambil data dokumen terlebih dahulu
        const documentData = await fetchDocumentById(documentId);
        
        if (!documentData) {
            throw new Error('Dokumen tidak ditemukan');
        }
        
        // Mengubah status dokumen menjadi "Approved"
        documentData.status = "Approved";
        
        // Menyimpan perubahan ke API
        const response = await fetch(`${baseUrl}/api/purchase-requests/${documentId}/approve`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentData)
        });
        
        if (!response.ok) {
            throw new Error('Gagal menyetujui dokumen');
        }
        
        alert('Dokumen berhasil disetujui!');
        // Kembali ke halaman daftar dokumen
        window.location.href = "../../../dashboard/dashboardApprove/purchaseRequest/menuPRApprove.html";
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menyetujui dokumen: ' + error.message);
    }
}

// Fungsi untuk menolak dokumen
async function rejectDocument() {
    const documentId = getParameterByName('id');
    if (!documentId) {
        alert('Tidak dapat menolak dokumen: ID dokumen tidak ditemukan.');
        return;
    }
    
    // Mendapatkan alasan penolakan
    const remarks = document.querySelector('textarea')?.value;
    if (!remarks) {
        alert('Silakan masukkan alasan penolakan pada kolom Remarks.');
        return;
    }
    
    try {
        // Mengambil data dokumen terlebih dahulu
        const documentData = await fetchDocumentById(documentId);
        
        if (!documentData) {
            throw new Error('Dokumen tidak ditemukan');
        }
        
        // Mengubah status dokumen menjadi "Rejected" dan menambahkan alasan
        documentData.status = "Rejected";
        documentData.remarks = remarks;
        
        // Menyimpan perubahan ke API
        const response = await fetch(`${baseUrl}/api/purchase-requests/${documentId}/reject`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documentData)
        });
        
        if (!response.ok) {
            throw new Error('Gagal menolak dokumen');
        }
        
        alert('Dokumen telah ditolak!');
        // Kembali ke halaman daftar dokumen
        window.location.href = "../../../dashboard/dashboardApprove/purchaseRequest/menuPRApprove.html";
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menolak dokumen: ' + error.message);
    }
}