let uploadedFiles = [];

function saveDocument() {
    let documents = JSON.parse(localStorage.getItem("documentsReim")) || [];
    const docNumber = `REIM${Date.now()}`; // Gunakan timestamp agar unik

    const documentData = {
        docNumber,
        outno: document.getElementById("outgoingNo").value,
                requester: document.getElementById("requester").value,
                department: document.getElementById("department").value,
                toOrderOf : document.getElementById("toOrderOf").value,
                payTo : document.getElementById("PayTo").value,
                docCurrency : document.getElementById("docCurrency").value,
                Reference : document.getElementById("reference").value,
                ReferenceDoc : document.getElementById("referenceDoc").value,
                postingDate: document.getElementById("postingDate").value,
                classification: document.getElementById("classification").value,
                type: document.getElementById("type").value,
                docStatus: document.getElementById("docStatus").value,
                approvals: {
                    prepared: document.getElementById("prepared").checked,
                    checked: document.getElementById("checked").checked,
                    approved: document.getElementById("approved").checked,
                    knowledge: document.getElementById("knowledge").checked,
                }
    };

    documents.push(documentData);
    localStorage.setItem("documentsReim", JSON.stringify(documents));
    alert("Dokumen berhasil disimpan!");
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
    const prTable = document.getElementById("prTable");
    prTable.style.display = this.value === "Pilih" ? "none" : "table";
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

function confirmDelete() {
    Swal.fire({
        title: 'Apakah dokumen ini akan dihapus?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteDocument(); // Memanggil fungsi delete setelah konfirmasi
        }
    });
}

function deleteDocument() {
    const baseUrl = 'https://expressiv.idsdev.site';
    
    // Get the ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('reim-id');
    
    if (!id) {
        Swal.fire('Error!', 'ID reimbursement tidak ditemukan.', 'error');
        return;
    }
    
    // Call the DELETE API
    fetch(`${baseUrl}/api/reimbursements/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status) {
            Swal.fire('Terhapus!', 'Dokumen berhasil dihapus.', 'success')
            .then(() => {
                // Redirect to previous page or list page after successful deletion
                window.history.back();
            });
        } else {
            Swal.fire('Error!', data.message || 'Gagal menghapus dokumen karena status dokumen sudah bukan draft.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire('Error!', 'Terjadi kesalahan saat menghapus dokumen.', 'error');
    });
}

    