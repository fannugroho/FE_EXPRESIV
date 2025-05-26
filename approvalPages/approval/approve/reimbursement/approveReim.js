const baseUrl = 'https://t246vds2-5246.asse.devtunnels.ms';
let reimbursementId = '';
let uploadedFiles = [];

// Get reimbursement ID from URL
function getReimbursementIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('reim-id');
}

// Fetch reimbursement data from API
async function fetchReimbursementData() {
    reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId) {
        console.error('No reimbursement ID found in URL');
        return;
    }
    
    try {
        const response = await fetch(`${baseUrl}/api/reimbursements/${reimbursementId}`);
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            populateFormData(result.data);
        } else {
            console.error('Failed to fetch reimbursement data:', result.message);
        }
    } catch (error) {
        console.error('Error fetching reimbursement data:', error);
    }
}

// Populate form fields with data
function populateFormData(data) {
    // Main form fields
    document.getElementById('voucherNo').value = data.voucherNo || '';
    document.getElementById('requesterName').value = data.requesterName || '';
    document.getElementById('department').value = data.department || '';
    document.getElementById('currency').value = data.currency || '';
    document.getElementById('payTo').value = data.payTo || '';
    
    // Format date for the date input (YYYY-MM-DD)
    if (data.submissionDate) {
        const date = new Date(data.submissionDate);
        const formattedDate = date.toISOString().split('T')[0];
        document.getElementById('submissionDate').value = formattedDate;
    }
    
    document.getElementById('status').value = data.status || '';
    document.getElementById('referenceDoc').value = data.referenceDoc || '';
    document.getElementById('typeOfTransaction').value = data.typeOfTransaction || '';
    document.getElementById('remarks').value = data.remarks || '';
    
    // Approvers information
    document.getElementById('preparedBy').value = data.preparedBy || '';
    document.getElementById('checkedBy').value = data.checkedBy || '';
    document.getElementById('acknowledgedBy').value = data.acknowledgedBy || '';
    document.getElementById('approvedBy').value = data.approvedBy || '';
    
    // Set checkbox states based on if values exist
    document.getElementById('preparedByCheck').checked = data.preparedBy ? true : false;
    document.getElementById('checkedByCheck').checked = data.checkedBy ? true : false;
    document.getElementById('acknowledgedByCheck').checked = data.acknowledgedBy ? true : false;
    document.getElementById('approvedByCheck').checked = data.approvedBy ? true : false;
    
    // Handle reimbursement details (table rows)
    populateReimbursementDetails(data.reimbursementDetails);
    
    // Display attachment information
    displayAttachments(data.reimbursementAttachments);
}

// Populate reimbursement details table
function populateReimbursementDetails(details) {
    const tableBody = document.getElementById('reimbursementDetails');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (details && details.length > 0) {
        details.forEach(detail => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-2 border">
                    <input type="text" value="${detail.description || ''}" maxlength="200" class="w-full" required />
                </td>
                <td class="p-2 border">
                    <input type="number" value="${detail.glAccount || ''}" maxlength="10" class="w-full" required />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.accountName || ''}" maxlength="30" class="w-full" required />
                </td>
                <td class="p-2 border">
                    <input type="number" value="${detail.amount || 0}" maxlength="10" class="w-full" required />
                </td>
                <td class="p-2 border text-center">
                    <button type="button" onclick="deleteRow(this)" data-id="${detail.id}" class="text-red-500 hover:text-red-700">
                        🗑
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        // Add an empty row if no details
        addRow();
    }
}

// Display attachments
function displayAttachments(attachments) {
    const attachmentsList = document.getElementById('attachmentsList');
    attachmentsList.innerHTML = ''; // Clear existing attachments
    
    if (attachments && attachments.length > 0) {
        attachments.forEach(attachment => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';
            attachmentItem.innerHTML = `
                <span>${attachment.fileName}</span>
                <a href="${baseUrl}/${attachment.filePath}" target="_blank" class="text-blue-500 hover:text-blue-700">View</a>
            `;
            attachmentsList.appendChild(attachmentItem);
        });
    }
}

// Add a new empty row to the reimbursement details table
function addRow() {
    const tableBody = document.getElementById('reimbursementDetails');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" required />
        </td>
        <td class="p-2 border">
            <input type="number" maxlength="10" class="w-full" required />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="30" class="w-full" required />
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

// Delete a row from the reimbursement details table
function deleteRow(button) {
    const row = button.closest('tr');
    row.remove();
}

// Update reimbursement data
function updateReim() {
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to update this reimbursement",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!'
    }).then((result) => {
        if (result.isConfirmed) {
            submitReimbursementUpdate();
        }
    });
}

// Submit reimbursement update to API
async function submitReimbursementUpdate() {
    // Get reimbursement ID from URL
    const id = getReimbursementIdFromUrl();
    if (!id) {
        Swal.fire('Error', 'No reimbursement ID found', 'error');
        return;
    }
    
    // Collect reimbursement details from table
    const detailsTable = document.getElementById('reimbursementDetails');
    const rows = detailsTable.querySelectorAll('tr');
    const reimbursementDetails = [];
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const deleteButton = row.querySelector('button');
        const detailId = deleteButton.getAttribute('data-id') || null;
        
        reimbursementDetails.push({
            id: detailId,
            description: inputs[0].value,
            glAccount: inputs[1].value,
            accountName: inputs[2].value,
            amount: parseFloat(inputs[3].value) || 0
        });
    });
    
    // Build request data
    const requestData = {
        requesterName: document.getElementById('requesterName').value,
        department: document.getElementById('department').value,
        currency: document.getElementById('currency').value,
        payTo: document.getElementById('payTo').value,
        referenceDoc: document.getElementById('referenceDoc').value,
        typeOfTransaction: document.getElementById('typeOfTransaction').value,
        remarks: document.getElementById('remarks').value,
        reimbursementDetails: reimbursementDetails
    };
    
    try {
        const response = await fetch(`${baseUrl}/api/reimbursements/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            Swal.fire(
                'Updated!',
                'Reimbursement has been updated successfully.',
                'success'
            ).then(() => {
                // Reload the data to show the latest changes
                fetchReimbursementData();
            });
        } else {
            Swal.fire(
                'Error',
                result.message || 'Failed to update reimbursement',
                'error'
            );
        }
    } catch (error) {
        console.error('Error updating reimbursement:', error);
        Swal.fire(
            'Error',
            'An error occurred while updating the reimbursement',
            'error'
        );
    }
}

// Function to go back to menu
function goToMenuReim() {
    window.location.href = '../menuReim.html';
}

// Function to confirm deletion
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
    // Implementation for displaying file list
    // This function was referenced but not defined in the original code
    console.log('Files uploaded:', uploadedFiles);
}

// Event listener for document type change
document.addEventListener('DOMContentLoaded', function() {
    // Load data when page loads
    fetchReimbursementData();
    
    // Add event listener for docType if it exists
    const docTypeElement = document.getElementById("docType");
    if (docTypeElement) {
        docTypeElement.addEventListener("change", function () {
            const prTable = document.getElementById("prTable");
            if (prTable) {
                prTable.style.display = this.value === "Pilih" ? "none" : "table";
            }
        });
    }
});

    