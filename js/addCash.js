function saveDocument() {
    // Create FormData object
    const formData = new FormData();
    
    // Add all form fields to FormData
    formData.append('CashAdvanceNo', document.getElementById("CashAdvanceNo").value);
    formData.append('EmployeeNIK', document.getElementById("EmployeeNIK").value);
    formData.append('RequesterId', document.getElementById("RequesterId").value);
    formData.append('Purpose', document.getElementById("Purpose").value);
    formData.append('DepartmentId', document.getElementById("department").value);
    formData.append('SubmissionDate', document.getElementById("SubmissionDate").value);
    formData.append('Status', document.getElementById("Status").value);
    formData.append('TransactionType', document.getElementById("TransactionType").value);
    formData.append('Remarks', document.getElementById("Remarks").value);
    
    // Approval fields
    formData.append('Approval.PreparedById', document.getElementById("Approval.PreparedById").value);
    formData.append('Approval.CheckedById', document.getElementById("Approval.CheckedById").value);
    formData.append('Approval.ApprovedById', document.getElementById("Approval.ApprovedById").value);
    formData.append('Approval.AcknowledgedById', document.getElementById("Approval.AcknowledgedById").value);
    
    // Add file attachments
    const fileInput = document.getElementById("Attachments");
    if (fileInput.files.length > 0) {
        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append('Attachments', fileInput.files[i]);
        }
    }
    
    // Add CashAdvanceDetails - collect all rows from the table
    const tableRows = document.querySelectorAll('#tableBody tr');
    tableRows.forEach((row, index) => {
        const description = row.querySelector('input[type="text"]').value;
        const amount = row.querySelector('input[type="number"]').value;
        
        if (description && amount) {
            formData.append(`CashAdvanceDetails[${index}][Description]`, description);
            formData.append(`CashAdvanceDetails[${index}][Amount]`, amount);
        }
    });
    
    // API endpoint
    const baseUrl = 'https://t246vds2-5246.asse.devtunnels.ms';
    const endpoint = `${baseUrl}/api/cash-advance`;
    
    // Send the request
    fetch(endpoint, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.status === 201) {
            // Success - Show sweet alert
            Swal.fire({
                title: 'Success!',
                text: 'Cash advance request has been saved successfully',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } else {
            // Error handling
            Swal.fire({
                title: 'Error!',
                text: `Failed to save: ${response.status}`,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    })
    .catch(error => {
        // Network or other error
        Swal.fire({
            title: 'Error!',
            text: `An error occurred: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    });
}

function goToMenuCash() {
    window.location.href = "../pages/MenuCash.html";
}

document.getElementById("docType").addEventListener("change", function() {
const selectedValue = this.value;
const cashTable = document.getElementById("cashTable");

if (selectedValue === "Pilih") {
cashTable.style.display = "none";
} else {
cashTable.style.display = "table";
}
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

function deleteRow(button) {
button.closest("tr").remove(); // Hapus baris tempat tombol diklik
}