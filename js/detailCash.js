// Global variable for file uploads
let uploadedFiles = [];

function saveDocument() {
    const docNumber = (JSON.parse(localStorage.getItem("documents")) || []).length + 1;
    const documentData = {
        docNumber,
        invoiceNo : document.getElementById("invoiceNo").value,
        requester: document.getElementById("requester").value,
        department: document.getElementById("department").value,
        vendor: document.getElementById("vendor").value,
        name: document.getElementById("name").value,
        contactPerson: document.getElementById("contactPerson").value,
        vendorRefNo: document.getElementById("vendorRefNo").value,
        postingDate: document.getElementById("postingDate").value,
        dueDate: document.getElementById("dueDate").value,
        requiredDate: document.getElementById("requiredDate").value,
        classification: document.getElementById("classification").value,
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

function goToMenuCash() {
    window.location.href = "../pages/MenuCash.html";
}

// Only add event listener if the element exists (to prevent errors)
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
    // Simple display of uploaded files count
    console.log(`${uploadedFiles.length} file(s) uploaded`);
    // You can implement a more sophisticated file list display here if needed
}

function addRow() {
    const tableBody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" required />
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
    const baseUrl = 'https://t246vds2-5246.asse.devtunnels.ms';
    
    // Get the ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('ca-id');
    
    if (!id) {
        Swal.fire('Error!', 'ID cash advance tidak ditemukan.', 'error');
        return;
    }
    
    // Call the DELETE API
    fetch(`${baseUrl}/api/cash-advance/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status === 204) {
            // 204 No Content - Success case
            Swal.fire('Terhapus!', 'Dokumen berhasil dihapus.', 'success')
            .then(() => {
                // Redirect to previous page or list page after successful deletion
                window.history.back();
            });
        } else if (response.ok) {
            // If there's a response body, try to parse it
            return response.json().then(data => {
                if (data.status) {
                    Swal.fire('Terhapus!', 'Dokumen berhasil dihapus.', 'success')
                    .then(() => {
                        window.history.back();
                    });
                } else {
                    Swal.fire('Error!', data.message || 'Gagal menghapus dokumen karena status dokumen sudah bukan draft.', 'error');
                }
            });
        } else {
            Swal.fire('Error!', `Gagal menghapus dokumen. Status: ${response.status}`, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire('Error!', 'Terjadi kesalahan saat menghapus dokumen.', 'error');
    });
}

function loadCashAdvanceData() {
    const baseUrl = 'https://t246vds2-5246.asse.devtunnels.ms';
    
    // Get the ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('ca-id');
    
    if (!id) {
        Swal.fire('Error!', 'ID cash advance tidak ditemukan di URL.', 'error');
        return;
    }
    
    // Call the GET API
    fetch(`${baseUrl}/api/cash-advance/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status === 200) {
            return response.json();
        } else if (response.status === 404) {
            throw new Error('Data cash advance tidak ditemukan');
        } else {
            throw new Error(`Error: ${response.status}`);
        }
    })
    .then(result => {
        if (result.status && result.data) {
            populateForm(result.data);
        } else {
            Swal.fire('Error!', result.message || 'Gagal memuat data cash advance.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.message.includes('tidak ditemukan')) {
            Swal.fire('Error!', 'Data cash advance tidak ditemukan.', 'error');
        } else {
            Swal.fire('Error!', 'Terjadi kesalahan saat memuat data cash advance.', 'error');
        }
    });
}

function populateForm(data) {
    // Populate basic fields with updated IDs
    document.getElementById("cashAdvanceNo").value = data.cashAdvanceNo || '';
    document.getElementById("employeeId").value = data.employeeId || '';
    document.getElementById("employeeName").value = data.employeeName || '';
    document.getElementById("requesterName").value = data.requesterName || '';
    document.getElementById("purpose").value = data.purpose || '';
    document.getElementById("paidTo").value = data.requesterName || '';
    document.getElementById("departmentId").value = data.departmentId || '';
    
    // Handle submission date - convert from ISO to YYYY-MM-DD format for date input
    if (data.submissionDate) {
        const date = new Date(data.submissionDate);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById("submissionDate").value = formattedDate;
    }
    
    document.getElementById("status").value = data.status || '';
    document.getElementById("transactionType").value = data.transactionType || '';
    
    // Populate table with cash advance details
    populateTable(data.cashAdvanceDetails || []);
    
    // Populate approval section
    if (data.approval) {
        populateApprovals(data.approval);
    }
    
    // Handle remarks if exists
    const remarksTextarea = document.querySelector('textarea');
    if (remarksTextarea && data.remarks) {
        remarksTextarea.value = data.remarks;
    }
}

function populateTable(cashAdvanceDetails) {
    const tableBody = document.getElementById("tableBody");
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add rows for each detail
    cashAdvanceDetails.forEach((detail, index) => {
        const newRow = document.createElement("tr");
        
        newRow.innerHTML = `
            <td class="p-2 border">
                <input type="text" maxlength="200" class="w-full" value="${detail.description || ''}" />
            </td>
            <td class="p-2 border">
                <input type="number" maxlength="10" class="w-full" value="${detail.amount || ''}" required />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
        `;
        
        tableBody.appendChild(newRow);
    });
    
    // If no details exist, add one empty row
    if (cashAdvanceDetails.length === 0) {
        addRow();
    }
}

function populateApprovals(approval) {
    // Proposed by
    const preparedCheckbox = document.getElementById("preparedCheckbox");
    if (preparedCheckbox && approval.preparedById) {
        preparedCheckbox.checked = true;
    }
    
    // Checked by
    const checkedCheckbox = document.getElementById("checkedCheckbox");
    if (checkedCheckbox && approval.checkedById) {
        checkedCheckbox.checked = true;
    }
    
    // Approved by
    const approvedCheckbox = document.getElementById("approvedCheckbox");
    if (approvedCheckbox && approval.approvedById) {
        approvedCheckbox.checked = true;
    }
    
    // Acknowledged by
    const acknowledgedCheckbox = document.getElementById("acknowledgedCheckbox");
    if (acknowledgedCheckbox && approval.acknowledgedById) {
        acknowledgedCheckbox.checked = true;
    }
}

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadCashAdvanceData();
});

function updateCash() {
    // TODO: Implement update functionality
    Swal.fire('Info', 'Update functionality belum diimplementasikan.', 'info');
}