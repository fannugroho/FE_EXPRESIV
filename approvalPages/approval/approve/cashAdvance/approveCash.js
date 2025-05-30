// Initialize uploadedFiles array
const uploadedFiles = [];

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
    window.location.href = "MenuCash.html";
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
    
    // Show file names instead of calling displayFileList
    const fileInput = document.getElementById('Reference');
    let fileNames = Array.from(files).map(file => file.name).join(', ');
    if (fileNames) {
        fileInput.title = fileNames;
    }
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
    button.closest("tr").remove();
}

function printCashAdvanceVoucher() {
    // Get form values
    const cashAdvanceNo = document.getElementById('invno').value || '';
    const employeeId = document.getElementById('Employee').value || '';
    const employeeName = document.getElementById('EmployeeName').value || '';
    const requesterName = document.getElementById('requester').value || '';
    const purpose = document.getElementById('purposed').value || '';
    const paidTo = document.getElementById('paidTo').value || '';
    const departmentSelect = document.getElementById('department');
    const department = departmentSelect.options[departmentSelect.selectedIndex].text;
    const submissionDate = document.getElementById('postingDate').value || '';
    const statusSelect = document.getElementById('docStatus');
    const status = statusSelect.options[statusSelect.selectedIndex].value;
    const transactionTypeSelect = document.getElementById('typeTransaction');
    const transactionType = transactionTypeSelect.options[transactionTypeSelect.selectedIndex].value;
    
    // Get remarks if exists
    const remarksElement = document.querySelector('textarea');
    const remarks = remarksElement ? remarksElement.value : '';
    
    // Get approval signatories
    const proposedBy = document.getElementById('prepared').checked ? 
        document.getElementById('prepared').nextElementSibling.querySelector('select').value : '';
    const checkedBy = document.getElementById('checked').checked ? 
        document.getElementById('Checked').value : '';
    const approvedBy = document.getElementById('approved').checked ? 
        document.getElementById('Approved').value : '';
    const acknowledgedBy = document.getElementById('approved').nextElementSibling.querySelector('input').checked ? 
        document.getElementById('approved').nextElementSibling.querySelector('select').value : '';
    
    // Collect table items
    const tableItems = [];
    const rows = document.querySelectorAll('#tableBody tr');
    let hasValidItems = false;
    
    rows.forEach(row => {
        const descriptionInput = row.querySelector('input[type="text"]');
        const amountInput = row.querySelector('input[type="number"]');
        
        if (descriptionInput && amountInput && 
            descriptionInput.value.trim() !== '' && 
            amountInput.value.trim() !== '') {
            tableItems.push({
                description: descriptionInput.value,
                amount: amountInput.value
            });
            hasValidItems = true;
        }
    });
    
    // Convert items array to JSON string and encode for URL
    const itemsParam = encodeURIComponent(JSON.stringify(tableItems));
    
    // Create URL with parameters
    const url = `../../../detailPages/printCashAdvance.html?cashAdvanceNo=${encodeURIComponent(cashAdvanceNo)}`
        + `&employeeNik=${encodeURIComponent(employeeId)}`
        + `&employeeName=${encodeURIComponent(employeeName)}`
        + `&requesterName=${encodeURIComponent(requesterName)}`
        + `&purpose=${encodeURIComponent(purpose)}`
        + `&paidTo=${encodeURIComponent(paidTo)}`
        + `&department=${encodeURIComponent(department)}`
        + `&submissionDate=${encodeURIComponent(submissionDate)}`
        + `&status=${encodeURIComponent(status)}`
        + `&transactionType=${encodeURIComponent(transactionType)}`
        + `&remarks=${encodeURIComponent(remarks)}`
        + `&proposedBy=${encodeURIComponent(proposedBy)}`
        + `&checkedBy=${encodeURIComponent(checkedBy)}`
        + `&approvedBy=${encodeURIComponent(approvedBy)}`
        + `&acknowledgedBy=${encodeURIComponent(acknowledgedBy)}`
        + `&items=${itemsParam}`;
    
    // Open the print page in a new tab
    window.open(url, '_blank');
}