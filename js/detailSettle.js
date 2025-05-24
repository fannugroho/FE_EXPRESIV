// Initialize uploaded files array
let uploadedFiles = [];

function saveDocument() {
    const docNumber = (JSON.parse(localStorage.getItem("documents")) || []).length + 1;
    const documentData = {
        docNumber,
        invno: document.getElementById("Invoice no").value,
        requester: document.getElementById("requester").value,
        department: document.getElementById("department").value,

        vendor: document.getElementById("vendor").value,
        name: document.getElementById("name").value,
        contactPerson: document.getElementById("contactPerson").value,
        vendorRefNo: document.getElementById("vendorRefNo").value,

        postingDate: document.getElementById("postingDate").value,
        dueDate: document.getElementById("dueDate").value,
        requiredDate: document.getElementById("requiredDate").value,
        purposed: document.getElementById("purposed").value,
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
            <input type="text" maxlength="200" class="w-full" required />
        </td>
        <td class="p-2 border">
            <input type="number" maxlength="10" class="w-full" required />
        </td>
            <td class="p-2 border">
            <input type="number" maxlength="10" class="w-full" required />
        </td>
            <td class="p-2 border">
            <input type="number" maxlength="10" class="w-full" required />
        </td>
            <td class="p-2 border">
            <input type="number" maxlength="10" class="w-full" required />
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

function goToMenuSettle() {
    window.location.href = "../pages/MenuSettle.html";
}

function displayFileList() {
    // Function placeholder for displaying file list
    // This function was referenced but not defined in the original HTML
    console.log('Uploaded files:', uploadedFiles);
}

function confirmDelete() {
    // Function placeholder for delete confirmation
    // This function was referenced but not defined in the original HTML
    if (confirm('Are you sure you want to delete this settlement?')) {
        alert('Settlement deleted successfully!');
        // Add delete logic here
    }
}

function updateSettle() {
    // Function placeholder for update settlement
    // This function was referenced but not defined in the original HTML
    alert('Settlement updated successfully!');
    // Add update logic here
}

// Initialize page functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for docType dropdown
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
}); 