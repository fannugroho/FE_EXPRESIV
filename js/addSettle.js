async function saveDocument() {
    const baseUrl = 'https://t246vds2-5246.asse.devtunnels.ms';
    
    try {
        // Basic validation
        const settlementNumber = document.getElementById("invno").value;
        const kansaiEmployeeId = document.getElementById("Employee").value;
        const cashAdvanceReferenceId = document.getElementById("requiredDate").value;
        
        if (!settlementNumber) {
            Swal.fire({
                icon: 'warning',
                title: 'Validation Error!',
                text: 'Settlement Number is required',
                confirmButtonColor: '#3085d6'
            });
            return;
        }
        
        if (!kansaiEmployeeId) {
            Swal.fire({
                icon: 'warning',
                title: 'Validation Error!',
                text: 'Employee NIK is required',
                confirmButtonColor: '#3085d6'
            });
            return;
        }
        
        if (!cashAdvanceReferenceId || cashAdvanceReferenceId === 'Pilih') {
            Swal.fire({
                icon: 'warning',
                title: 'Validation Error!',
                text: 'Please select a Cash Advance Document',
                confirmButtonColor: '#3085d6'
            });
            return;
        }
        
        // Show loading alert
        Swal.fire({
            title: 'Saving...',
            text: 'Please wait while we save your settlement',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Create FormData object for multipart/form-data
        const formData = new FormData();
        
        // Basic settlement fields
        const settlementRefNo = document.getElementById("contactPerson").value;
        const purpose = document.getElementById("purposed").value;
        const transactionType = document.getElementById("type").value;
        const remarks = document.getElementById("Remarks").value;
        
        // Add basic fields to FormData
        formData.append('SettlementNumber', settlementNumber);
        formData.append('KansaiEmployeeId', kansaiEmployeeId);
        formData.append('CashAdvanceReferenceId', cashAdvanceReferenceId);
        if (settlementRefNo) formData.append('SettlementRefNo', settlementRefNo);
        if (purpose) formData.append('Purpose', purpose);
        if (transactionType) formData.append('TransactionType', transactionType);
        if (remarks) formData.append('Remarks', remarks);
        
        // Handle file attachments
        const fileInput = document.getElementById("Reference");
        if (fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('Attachments', fileInput.files[i]);
            }
        }
        
        // Collect settlement items from table
        const tableRows = document.querySelectorAll("#tableBody tr");
        tableRows.forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 4) {
                const description = inputs[0].value; // Description input
                const glAccount = inputs[1].value;   // GLAccount input
                const accountName = inputs[2].value; // AccountName input
                const amount = inputs[3].value;      // Amount input
                
                if (description) formData.append(`SettlementItems[${index}].Description`, description);
                if (glAccount) formData.append(`SettlementItems[${index}].GLAccount`, glAccount);
                if (accountName) formData.append(`SettlementItems[${index}].AccountName`, accountName);
                if (amount) formData.append(`SettlementItems[${index}].Amount`, amount);
            }
        });
        
        // Handle approval fields - only add if checkbox is checked
        if (document.getElementById("prepared").checked) {
            const preparedById = document.getElementById("preparedDropdown").value;
            if (preparedById) formData.append('Approval.PreparedById', preparedById);
        }
        
        if (document.getElementById("checked").checked) {
            const checkedById = document.getElementById("checkedDropdown").value;
            if (checkedById) formData.append('Approval.CheckedById', checkedById);
        }
        
        if (document.getElementById("approved").checked) {
            const approvedById = document.getElementById("approvedDropdown").value;
            if (approvedById) formData.append('Approval.ApprovedById', approvedById);
        }
        
        if (document.getElementById("purchasing").checked) {
            const acknowledgedById = document.getElementById("acknowledgedDropdown").value;
            if (acknowledgedById) formData.append('Approval.AcknowledgedById', acknowledgedById);
        }
        
        // Send API request
        const response = await fetch(`${baseUrl}/api/settlements`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            // Success response (status 200)
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Settlement has been saved successfully',
                confirmButtonColor: '#3085d6'
            });
        } else if (response.status === 404) {
            // Handle 404 error for Cash Advance not found
            const errorData = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: errorData.Message || 'Cash Advance is not found',
                confirmButtonColor: '#d33'
            });
        } else {
            // Handle other errors
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Failed to save settlement. Please try again.',
                confirmButtonColor: '#d33'
            });
        }
        
    } catch (error) {
        console.error('Error saving settlement:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Network error. Please check your connection and try again.',
            confirmButtonColor: '#d33'
        });
    }
}

function goToMenuSettle() {
    window.location.href = "MenuSettle.html";
}


document.getElementById("docType").addEventListener("change", function() {
const selectedValue = this.value;
const prTable = document.getElementById("settleTable");

if (selectedValue === "Pilih") {
    prTable.style.display = "none";
} else {
    prTable.style.display = "table";
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
            <input type="text" maxlength="200" class="w-full" required />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" required />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" required />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full" required />
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
