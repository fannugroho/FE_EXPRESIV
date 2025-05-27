// Global variable for file uploads
let uploadedFiles = [];

// Global variables
let rowCounter = 1;
let cashAdvanceData = null;

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
    Swal.fire({
        title: 'Update Cash Advance',
        text: 'Are you sure you want to update this Cash Advance?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Show loading
            Swal.fire({
                title: 'Updating...',
                text: 'Please wait while we update the Cash Advance.',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Simulate API call delay
            setTimeout(() => {
                // TODO: Implement update API call
                Swal.fire({
                    title: 'Success!',
                    text: 'Cash Advance has been updated successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }, 1500);
        }
    });
}

// Function to convert amount to words
function numberToWords(num) {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    if (num === 0) return 'zero';
    
    function convertLessThanOneThousand(num) {
        if (num < 20) {
            return ones[num];
        }
        
        const ten = Math.floor(num / 10);
        const unit = num % 10;
        
        return tens[ten] + (unit !== 0 ? '-' + ones[unit] : '');
    }
    
    function convert(num) {
        if (num < 1000) {
            return convertLessThanOneThousand(num);
        }
        
        const billions = Math.floor(num / 1000000000);
        const millions = Math.floor((num % 1000000000) / 1000000);
        const thousands = Math.floor((num % 1000000) / 1000);
        const remainder = num % 1000;
        
        let result = '';
        
        if (billions) {
            result += convertLessThanOneThousand(billions) + ' billion ';
        }
        
        if (millions) {
            result += convertLessThanOneThousand(millions) + ' million ';
        }
        
        if (thousands) {
            result += convertLessThanOneThousand(thousands) + ' thousand ';
        }
        
        if (remainder) {
            result += convertLessThanOneThousand(remainder);
        }
        
        return result.trim();
    }
    
    // Split number into whole and decimal parts
    const parts = Number(num).toFixed(2).split('.');
    const wholePart = parseInt(parts[0]);
    const decimalPart = parseInt(parts[1]);
    
    let result = convert(wholePart);
    
    if (decimalPart) {
        result += ' point ' + convert(decimalPart);
    }
    
    return result + ' rupiah';
}

// Function to print the cash advance voucher
function printCashAdvanceVoucher() {
    // Get data from the form
    const cashAdvanceNo = document.getElementById("cashAdvanceNo").value;
    const departmentId = document.getElementById("departmentId").value;
    const paidTo = document.getElementById("paidTo").value;
    const purpose = document.getElementById("purpose").value;
    const submissionDate = document.getElementById("submissionDate").value;
    
    // Get approval data
    const proposedName = document.getElementById("preparedSelect").value;
    const checkedName = document.getElementById("checkedSelect").value;
    const approvedName = document.getElementById("approvedSelect").value;
    const acknowledgedName = document.getElementById("acknowledgedSelect").value;
    
    // Get checkbox states
    const proposedChecked = document.getElementById("preparedCheckbox").checked;
    const checkedChecked = document.getElementById("checkedCheckbox").checked;
    const approvedChecked = document.getElementById("approvedCheckbox").checked;
    const acknowledgedChecked = document.getElementById("acknowledgedCheckbox").checked;
    
    // Get table data
    const tableBody = document.getElementById("tableBody");
    const rows = tableBody.querySelectorAll("tr");
    const tableData = [];
    let totalAmount = 0;
    
    rows.forEach(row => {
        const descriptionInput = row.querySelector("td:first-child input");
        const amountInput = row.querySelector("td:nth-child(2) input");
        
        if (descriptionInput && amountInput && descriptionInput.value && amountInput.value) {
            const amount = parseFloat(amountInput.value);
            tableData.push({
                description: descriptionInput.value,
                amount: amount
            });
            totalAmount += amount;
        }
    });
    
    // Convert total amount to words
    const amountInWords = numberToWords(totalAmount);
    
    // Create the printable HTML
    const printContent = `
    <div id="print-container" style="width: 800px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: left; margin-bottom: 20px;">
            <h3 style="margin: 0;">PT KANSAI PAINT INDONESIA</h3>
            <p style="margin: 0;">Blok DD-7 & DD-6 Kawasan Industri MM2100 Danaludah</p>
            <p style="margin: 0;">Cikarang Barat Kab. Bekasi Jawa Barat 17530</p>
        </div>
        
        <div style="text-align: right; margin-bottom: 20px;">
            <p style="margin: 0;"><strong>Batch No:</strong> _____________</p>
            <p style="margin: 0;"><strong>Voucher No:</strong> ${cashAdvanceNo}</p>
            <p style="margin: 0;"><strong>Submission date:</strong> ${submissionDate}</p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <h2 style="text-decoration: underline;">CASH ADVANCE VOUCHER</h2>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Production' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Production</span>
                        </div>
                    </td>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Marketing' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Marketing</span>
                        </div>
                    </td>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Technical' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Technical</span>
                        </div>
                    </td>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Admninistration' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Administration</span>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Cash advance is paid to</td>
                    <td style="width: 80%;">: ${paidTo}</td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0; display: flex; justify-content: space-between;">
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Proposed by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${proposedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
            
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Advance is checked by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${checkedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
        </div>
        
        <div style="margin: 20px 0; display: flex; justify-content: space-between;">
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Advance is approved by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${approvedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
            
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Cash is received by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${acknowledgedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Payment through [√]:</td>
                    <td style="width: 80%;">
                        <input type="checkbox" style="transform: scale(1.5); margin-right: 5px;"> Cash
                        <input type="checkbox" style="transform: scale(1.5); margin-right: 5px; margin-left: 20px;"> Bank remittance
                        <span style="margin-left: 20px;">[Bank Ref: _______________ ]</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Estimated cost</td>
                    <td style="width: 80%;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 30%; border: 1px solid #000; padding: 5px;">Rp ${totalAmount.toLocaleString()}</td>
                                <td style="width: 70%;">In words: ${amountInWords}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Purpose of Advance</td>
                    <td style="width: 80%;">: ${purpose}</td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <p><strong>Settlement of advance:</strong></p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #000; padding: 8px; width: 60%;">Description</th>
                        <th style="border: 1px solid #000; padding: 8px; width: 20%;">Debit</th>
                        <th style="border: 1px solid #000; padding: 8px; width: 20%;">Credit</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableData.map(item => `
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px;">${item.description}</td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right;">${item.amount.toLocaleString()}</td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                    </tr>
                    `).join('')}
                    ${Array(8 - tableData.length).fill().map(() => `
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; height: 30px;"></td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                    </tr>
                    `).join('')}
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; text-align: center;"><strong>Total</strong></td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>${totalAmount.toLocaleString()}</strong></td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div style="margin: 40px 0 20px; text-align: right;">
            <p><strong>Return Date:</strong> _____________</p>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 40%;">
                        <p>Total cash must be returned to the<br>Company (paid to the Employee)</p>
                    </td>
                    <td style="width: 60%;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 30%; border: 1px solid #000; padding: 5px;">Rp ${totalAmount.toLocaleString()}</td>
                                <td style="width: 70%;">In words: ${amountInWords}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0; display: flex; justify-content: flex-end;">
            <div style="width: 45%; border: 1px solid #000; padding: 10px; margin-right: 10px;">
                <p style="text-align: center;"><strong>Cash is received by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ____________</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
            
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Settlement is approved by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ____________</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
        </div>
        
        <div style="margin: 20px 0; font-size: 10px; line-height: 1.2;">
            <p>The payment through cash is valid, at the time you sign on the column of "Cash is received by".</p>
            <p>The Cash Advance Must be Settled within 1 Month, Otherwise The Company has full authority to deduct from the Salary.</p>
        </div>
    </div>
    `;
    
    // Create a temporary container to hold the printable content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = printContent;
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    
    // Generate the PDF
    const element = document.getElementById('print-container');
    const opt = {
        margin: 10,
        filename: `Cash_Advance_${cashAdvanceNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate PDF
    html2pdf().set(opt).from(element).save().then(() => {
        // Remove the temporary container after PDF is generated
        document.body.removeChild(tempDiv);
    });
}

// Load data when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Get cash advance ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const cashAdvanceId = urlParams.get('id');
    
    if (cashAdvanceId) {
        loadCashAdvanceData(cashAdvanceId);
    } else {
        // If this is a new cash advance, initialize with default values
        setDefaultValues();
    }
});

// Function to load cash advance data from API/localStorage
function loadCashAdvanceData(id) {
    // In a real application, you would fetch data from your API
    // For this example, we'll simulate data loading
    
    // Example: fetch(`/api/cashAdvance/${id}`)
    //    .then(response => response.json())
    //    .then(data => {
    //        populateFormWithData(data);
    //    });
    
    // Simulate API call with sample data
    setTimeout(() => {
        // Sample data (would come from your API)
        cashAdvanceData = {
            cashAdvanceNo: 'CA-2024-002',
            employeeId: 'greenss21',
            employeeName: 'greenss21',
            requesterName: 'redss21',
            purpose: 'Office Event Expenses',
            paidTo: 'redss21',
            departmentId: 'Marketing',
            submissionDate: '2025-05-26',
            status: 'Draft',
            transactionType: 'Entertainment',
            items: [
                {
                    description: 'Catering for office meeting',
                    amount: 750000
                },
                {
                    description: 'Venue decoration',
                    amount: 250000
                }
            ]
        };
        
        populateFormWithData(cashAdvanceData);
    }, 300);
}

// Function to populate form with data
function populateFormWithData(data) {
    document.getElementById('cashAdvanceNo').value = data.cashAdvanceNo || '';
    document.getElementById('employeeId').value = data.employeeId || '';
    document.getElementById('employeeName').value = data.employeeName || '';
    document.getElementById('requesterName').value = data.requesterName || '';
    document.getElementById('purpose').value = data.purpose || '';
    document.getElementById('paidTo').value = data.paidTo || '';
    
    // Set department
    const departmentSelect = document.getElementById('departmentId');
    for (let i = 0; i < departmentSelect.options.length; i++) {
        if (departmentSelect.options[i].value === data.departmentId) {
            departmentSelect.selectedIndex = i;
            break;
        }
    }
    
    // Format date for input (yyyy-MM-dd)
    if (data.submissionDate) {
        document.getElementById('submissionDate').value = data.submissionDate;
    }
    
    // Set status
    const statusSelect = document.getElementById('status');
    for (let i = 0; i < statusSelect.options.length; i++) {
        if (statusSelect.options[i].value === data.status) {
            statusSelect.selectedIndex = i;
            break;
        }
    }
    
    // Set transaction type
    const transactionTypeSelect = document.getElementById('transactionType');
    for (let i = 0; i < transactionTypeSelect.options.length; i++) {
        if (transactionTypeSelect.options[i].value === data.transactionType) {
            transactionTypeSelect.selectedIndex = i;
            break;
        }
    }
    
    // Populate items/rows
    if (data.items && data.items.length > 0) {
        // Clear existing rows except the first one
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        
        // Add rows for each item
        data.items.forEach((item, index) => {
            addItemRow(item);
        });
    }
}

// Function to set default values for a new cash advance
function setDefaultValues() {
    const today = new Date();
    const formattedDate = today.toISOString().substring(0, 10);
    document.getElementById('submissionDate').value = formattedDate;
    
    // Generate a new cash advance number
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const year = today.getFullYear();
    document.getElementById('cashAdvanceNo').value = `CA-${year}-${randomNum}`;
}

// Function to add a new row to the table
function addRow() {
    addItemRow({description: '', amount: ''});
}

// Function to add an item row to the table
function addItemRow(item) {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full item-description" value="${item.description || ''}" />
        </td>
        <td class="p-2 border">
            <input type="number" maxlength="10" class="w-full item-amount" value="${item.amount || ''}" required />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
    rowCounter++;
}

// Function to delete a row from the table
function deleteRow(button) {
    const row = button.closest('tr');
    const tableBody = document.getElementById('tableBody');
    
    // Ensure we always have at least one row
    if (tableBody.rows.length > 1) {
        tableBody.removeChild(row);
    } else {
        // Clear the inputs if it's the last row
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            input.value = '';
        });
    }
}

// Function to update cash advance data
function updateCash() {
    // Collect form data
    const formData = {
        cashAdvanceNo: document.getElementById('cashAdvanceNo').value,
        employeeId: document.getElementById('employeeId').value,
        employeeName: document.getElementById('employeeName').value,
        requesterName: document.getElementById('requesterName').value,
        purpose: document.getElementById('purpose').value,
        paidTo: document.getElementById('paidTo').value,
        departmentId: document.getElementById('departmentId').value,
        submissionDate: document.getElementById('submissionDate').value,
        status: document.getElementById('status').value,
        transactionType: document.getElementById('transactionType').value,
        items: []
    };
    
    // Collect items data
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const descriptionInput = row.querySelector('.item-description');
        const amountInput = row.querySelector('.item-amount');
        
        if (descriptionInput && amountInput && descriptionInput.value.trim() !== '') {
            formData.items.push({
                description: descriptionInput.value,
                amount: amountInput.value
            });
        }
    });
    
    // In a real application, you would send this data to your API
    console.log('Updating cash advance:', formData);
    
    // Example API call:
    // fetch('/api/cashAdvance', {
    //     method: 'PUT',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(formData)
    // })
    // .then(response => response.json())
    // .then(data => {
    //     showSuccessMessage('Cash advance updated successfully');
    // })
    // .catch(error => {
    //     showErrorMessage('Error updating cash advance');
    // });
    
    // For this example, just show a success message
    showSuccessMessage('Cash advance updated successfully');
}

// Function to confirm delete
function confirmDelete() {
    if (confirm('Are you sure you want to delete this cash advance?')) {
        // In a real application, you would call your API to delete the record
        // Example: 
        // fetch(`/api/cashAdvance/${cashAdvanceId}`, { method: 'DELETE' })
        //   .then(() => {
        //     window.location.href = "../menuPages/menuCash.html";
        //   });
        
        // For this example, just redirect
        window.location.href = "../menuPages/menuCash.html";
    }
}

// Function to show success message
function showSuccessMessage(message) {
    alert(message); // Replace with your preferred notification method
}

// Function to show error message
function showErrorMessage(message) {
    alert('Error: ' + message); // Replace with your preferred notification method
}