# Error Fix Documentation - addOPReim.html

## 🐛 **Error yang Diperbaiki**

### **Error Original:**
```
Error loading reimbursement data: TypeError: Cannot read properties of undefined (reading 'replace')
    at formatCurrency (addOPReim.html:317:37)
    at updateTotalAmountDue (addOPReim.js:537:31)
    at addRowWithData (addOPReim.js:188:5)
    at addOPReim.js:122:21
    at Array.forEach (<anonymous>)
    at loadReimbursementData (addOPReim.js:112:52)
    at initializePage (addOPReim.js:25:13)
```

## 🔍 **Analisis Masalah**

### **Root Cause:**
1. **Konflik Fungsi:** Ada dua fungsi `formatCurrency` yang berbeda:
   - **HTML:** `formatCurrency(input, decimalSeparator)` - menerima 2 parameter (DOM element + separator)
   - **JS File:** `formatCurrency(number)` - menerima 1 parameter (number)

2. **Panggilan Fungsi Salah:** Di `addOPReim.js`, fungsi `updateTotalAmountDue` dan `populateFormFields` memanggil fungsi HTML `formatCurrency` dengan parameter number, padahal fungsi HTML mengharapkan DOM element

3. **Nilai Undefined:** Data `reimbursementData.totalAmount` dan `data.trsfrSum` bisa `undefined` atau `null`

## ✅ **Perbaikan yang Dilakukan**

### **1. Buat Fungsi Terpisah di HTML**
```javascript
// Function to format number to currency string (for JS file compatibility)
function formatNumberToCurrencyString(number) {
    // Handle empty or invalid input
    if (number === null || number === undefined || number === '') {
        return '';
    }
    
    // Parse the number
    let num;
    try {
        if (typeof number === 'string') {
            const cleanedStr = number.replace(/[^\d.-]/g, '');
            num = parseFloat(cleanedStr);
        } else {
            num = parseFloat(number);
        }
        
        if (isNaN(num)) {
            return '';
        }
    } catch (e) {
        console.error('Error parsing number:', e);
        return '';
    }
    
    // Format with Indonesian locale
    try {
        const numStr = num.toString();
        const hasDecimal = numStr.includes('.');
        
        if (hasDecimal) {
            const decimalPlaces = numStr.split('.')[1].length;
            return num.toLocaleString('id-ID', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
            });
        } else {
            return num.toLocaleString('id-ID', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        }
    } catch (e) {
        // Fallback for very large numbers
        console.error('Error formatting number:', e);
        // Manual formatting implementation...
    }
}

// Make function available globally for JS file
window.formatNumberToCurrencyString = formatNumberToCurrencyString;
```

### **2. Perbaiki Fungsi formatCurrencyValue di JS**
```javascript
// Rename the function to avoid conflict with HTML formatCurrency
function formatCurrencyValue(number) {
    try {
        // Use the function from HTML instead of local formatCurrency
        if (typeof window.formatNumberToCurrencyString === 'function') {
            return window.formatNumberToCurrencyString(number);
        } else {
            // Use fallback function if HTML function not available
            return formatCurrencyFallback(number);
        }
    } catch (e) {
        console.error('Error in formatCurrencyValue:', e);
        // Return empty string as fallback
        return '';
    }
}
```

### **3. Tambah Fallback Function**
```javascript
// Fallback function for currency formatting (used when HTML function is not available)
function formatCurrencyFallback(number) {
    // Handle empty or invalid input
    if (number === null || number === undefined || number === '') {
        return '';
    }
    
    // Parse the number
    let num;
    try {
        if (typeof number === 'string') {
            const cleanedStr = number.replace(/[^\d.-]/g, '');
            num = parseFloat(cleanedStr);
        } else {
            num = parseFloat(number);
        }
        
        if (isNaN(num)) {
            return '';
        }
    } catch (e) {
        console.error('Error parsing number in fallback:', e);
        return '';
    }
    
    // Simple formatting with comma as thousand separator
    try {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } catch (e) {
        // Manual formatting if toLocaleString fails
        const numStr = num.toFixed(2);
        const parts = numStr.split('.');
        const wholePart = parts[0];
        const decimalPart = parts[1] || '00';
        
        let formattedWhole = '';
        for (let i = 0; i < wholePart.length; i++) {
            if (i > 0 && (wholePart.length - i) % 3 === 0) {
                formattedWhole += ',';
            }
            formattedWhole += wholePart[i];
        }
        
        return formattedWhole + '.' + decimalPart;
    }
}
```

### **4. Perbaiki updateTotalAmountDue Function**
```javascript
function updateTotalAmountDue() {
    let total = 0;
    
    // Get all DocTotal inputs from the table
    const docTotalInputs = document.querySelectorAll('[id^="DocTotal_"]');
    docTotalInputs.forEach(input => {
        total += parseCurrency(input.value);
    });
    
    // Also include the first row if it exists
    const firstRowDocTotal = document.getElementById('DocTotal');
    if (firstRowDocTotal) {
        total += parseCurrency(firstRowDocTotal.value);
    }
    
    // Update the net total
    const netTotalInput = document.getElementById('netTotal');
    if (netTotalInput) {
        netTotalInput.value = formatCurrencyValue(total);
        netTotalInput.numericValue = total;
    }

    // Update the total tax
    const totalTaxInput = document.getElementById('totalTax');
    if (totalTaxInput) {
        totalTaxInput.value = formatCurrencyValue(total);
        totalTaxInput.numericValue = total;
    }
    
    // Update the total amount due
    const totalAmountDueInput = document.getElementById('totalAmountDue');
    if (totalAmountDueInput) {
        totalAmountDueInput.value = formatCurrencyValue(total);
        totalAmountDueInput.numericValue = total;
    }
    
    // Update the total transfer (TrsfrSum)
    const trsfrSumInput = document.getElementById('TrsfrSum');
    if (trsfrSumInput) {
        trsfrSumInput.value = formatCurrencyValue(total);
        trsfrSumInput.numericValue = total;
    }
}
```

### **5. Perbaiki populateFormFields Function**
```javascript
// Set transfer information
if (data.trsfrDate) {
    document.getElementById('TrsfrDate').value = data.trsfrDate.split('T')[0];
}
document.getElementById('TrsfrAcct').value = data.trsfrAcct || '';
document.getElementById('TrsfrSum').value = formatCurrencyValue(data.trsfrSum) || '';

// Populate the first row if it exists
if (data.lines && data.lines.length > 0) {
    const firstItem = data.lines[0];
    document.getElementById('AcctCode').value = firstItem.acctCode || '';
    document.getElementById('AcctName').value = firstItem.acctName || '';
    document.getElementById('description').value = firstItem.descrip || '';
    document.getElementById('division').value = firstItem.ocrCode3 || '';
    document.getElementById('DocTotal').value = formatCurrencyValue(firstItem.sumApplied) || '';
    
    // Add additional rows for remaining items
    for (let i = 1; i < data.lines.length; i++) {
        addRow();
        const item = data.lines[i];
        const rowId = `row_${rowCounter - 1}`;
        
        document.getElementById(`AcctCode_${rowId}`).value = item.acctCode || '';
        document.getElementById(`AcctName_${rowId}`).value = item.acctName || '';
        document.getElementById(`description_${rowId}`).value = item.descrip || '';
        document.getElementById(`division_${rowId}`).value = item.ocrCode3 || '';
        document.getElementById(`DocTotal_${rowId}`).value = formatCurrencyValue(item.sumApplied) || '';
    }
}
```

### **6. Tambah Safe Format Function**
```javascript
// Helper function to safely format currency (with error handling)
function safeFormatCurrency(number) {
    try {
        return formatCurrencyValue(number);
    } catch (e) {
        console.error('Error in safeFormatCurrency:', e);
        return '';
    }
}
```

## 🆕 **Penambahan Fitur Baru: Type of Transaction**

### **Kolom Type of Transaction:**
```html
<h3 class="text-lg font-semibold mb-2">Type of Transaction</h3>
<select id="TypeOfTransaction" class="w-full p-2 border rounded" autocomplete="off">
    <option value="" disabled>Select Type of Transaction</option>
    <option value="REIMBURSEMENT" selected>Reimbursement</option>
    <option value="ADVANCE">Advance</option>
    <option value="SETTLEMENT">Settlement</option>
    <option value="LOAN">Loan</option>
</select>
```

### **API Mapping:**
```javascript
// FORM FIELDS → API RESPONSE BODY MAPPING:
// - TypeOfTransaction (Type of Transaction) → type

// Request Data:
type: document.getElementById("TypeOfTransaction").value,  // Type of Transaction

// Response Data:
if (responseData.type) document.getElementById("TypeOfTransaction").value = responseData.type;
```

### **Validasi:**
```javascript
// Validate required fields
const typeOfTransaction = document.getElementById("TypeOfTransaction").value;
if (!typeOfTransaction) {
    Swal.fire({
        title: 'Validation Error',
        text: 'Please select Type of Transaction',
        icon: 'error',
        confirmButtonText: 'OK'
    });
    return;
}
```

### **Event Listener:**
```javascript
// Add event listener for Type of Transaction
const typeOfTransactionSelect = document.getElementById('TypeOfTransaction');
if (typeOfTransactionSelect) {
    typeOfTransactionSelect.addEventListener('change', function() {
        toggleClosedByVisibility();
    });
}
```

### **Conditional Visibility:**
```javascript
function toggleClosedByVisibility() {
    const transactionType = document.getElementById('TypeOfTransaction')?.value;
    const closedByContainer = document.getElementById('closed')?.parentElement;
    
    if (closedByContainer) {
        if (transactionType === 'LOAN') {
            closedByContainer.style.display = 'block';
        } else {
            closedByContainer.style.display = 'none';
        }
    }
}
```

## 📎 **Penambahan Fitur Baru: Attachment Management**

### **HTML Structure:**
```html
<h3 class="text-lg font-semibold mb-2">Attachment</h3>
<input type="file" id="attachment" class="w-full p-2 border rounded" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" autocomplete="off">

<!-- Area untuk menampilkan attachment yang sudah ada -->
<div id="existingAttachments" class="mt-2">
    <!-- Attachment yang sudah ada akan ditampilkan di sini -->
</div>
```

## 📅 **Penambahan Fitur Baru: Document Date dengan submissionDate**

### **Field Mapping Update:**
```javascript
// FORM FIELDS → API RESPONSE BODY MAPPING:
// - DocDate (Document Date) → docDate OR submissionDate

// Response Data Handling:
if (responseData.docDate) {
    document.getElementById("DocDate").value = responseData.docDate.split('T')[0];
} else if (responseData.submissionDate) {
    document.getElementById("DocDate").value = responseData.submissionDate.split('T')[0];
}
```

## 🔗 **Perbaikan Navigation Path**

### **Error Original:**
```
GET http://127.0.0.1:5500/dashboard/dashboardCheck/outgoingPayment/menuOPCheck.html 404 (Not Found)
```

### **Root Cause:**
Path yang salah di fungsi `goToMenuOP()`:
- **Salah**: `../../../dashboard/dashboardCheck/outgoingPayment/menuOPCheck.html`
- **Benar**: `../../../approvalPages/dashboard/dashboardCheck/OPReim/menuOPReimCheck.html`

### **Perbaikan:**
```javascript
// Function to navigate back to the Outgoing Payment menu
function goToMenuOP() {
    window.location.href = '../../../approvalPages/dashboard/dashboardCheck/OPReim/menuOPReimCheck.html';
}
```

### **Struktur Direktori yang Benar:**
```
approvalPages/
└── dashboard/
    └── dashboardCheck/
        └── OPReim/
            ├── menuOPReimCheck.html ✅
            ├── menuOPReimCheck.css
            └── menuOPReimCheck.js
```

### **API Mapping:**
```javascript
// FORM FIELDS → API RESPONSE BODY MAPPING:
// - attachment (File Upload) → attachments[] OR reimbursementAttachments[]

// Response Data Structure:
reimbursementAttachments: [
    {
        id: "5811f5de-ec1e-4509-a9d1-c6a3ff352e95",
        fileName: "Primaya Hospital-Inv. TMR-2504056-RJ.pdf",
        filePath: "reimbursements/09e1209f-6b8c-419e-a131-3e438f0fb4cb/947eb4e3-ad20-4654-b9f1-ed341fcc588e_Primaya Hospital-Inv. TMR-2504056-RJ.pdf",
        fileSize: 240025,
        fileType: "application/pdf",
        reimbursementId: "09e1209f-6b8c-419e-a131-3e438f0fb4cb",
        uploadDate: "2025-07-16T02:00:57.9589776"
    }
]

// Response Data Handling:
if (responseData.attachments && responseData.attachments.length > 0) {
    displayExistingAttachments(responseData.attachments);
} else if (responseData.reimbursementAttachments && responseData.reimbursementAttachments.length > 0) {
    displayExistingAttachments(responseData.reimbursementAttachments);
}
```

### **Attachment Display Functions:**
```javascript
// Function to display existing attachments
function displayExistingAttachments(attachments) {
    const container = document.getElementById('existingAttachments');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    if (!attachments || attachments.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
        return;
    }
    
    // Create attachment list with file info and actions
    attachments.forEach((attachment, index) => {
        // Create attachment item with file icon, name, size
        // Add download and delete buttons
    });
}

// Function to get file icon based on file type
function getFileIcon(fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
        case 'pdf': return '📄';
        case 'doc': case 'docx': return '📝';
        case 'xls': case 'xlsx': return '📊';
        case 'jpg': case 'jpeg': case 'png': return '🖼️';
        default: return '📄';
    }
}

// Function to format file size
function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}
```

### **File Upload Handling:**
```javascript
// Handle attachments during submit
const attachments = [];
const attachmentInput = document.getElementById('attachment');
if (attachmentInput && attachmentInput.files && attachmentInput.files.length > 0) {
    for (let i = 0; i < attachmentInput.files.length; i++) {
        const file = attachmentInput.files[i];
        attachments.push({
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
            fileData: await fileToBase64(file)
        });
    }
}

// Function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}
```

### **Download and Delete Functions:**
```javascript
// Function to download attachment
function downloadAttachment(attachment) {
    try {
        if (attachment.filePath) {
            // Download from filePath (new API structure)
            const baseUrl = window.location.origin;
            const downloadUrl = `${baseUrl}/api/files/${encodeURIComponent(attachment.filePath)}`;
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = attachment.fileName || attachment.name || 'download';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (attachment.fileUrl || attachment.url) {
            // Download from URL
            const link = document.createElement('a');
            link.href = attachment.fileUrl || attachment.url;
            link.download = attachment.fileName || attachment.name || 'download';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (attachment.fileData || attachment.data) {
            // Download from base64 data
            const link = document.createElement('a');
            link.href = `data:${attachment.fileType || attachment.contentType || 'application/octet-stream'};base64,${attachment.fileData || attachment.data}`;
            link.download = attachment.fileName || attachment.name || 'download';
            link.click();
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Unable to download attachment. File data not available.',
                icon: 'error'
            });
        }
    } catch (error) {
        console.error('Error downloading attachment:', error);
        Swal.fire({
            title: 'Error',
            text: 'Failed to download attachment. Please try again.',
            icon: 'error'
        });
    }
}

// Function to delete attachment
function deleteAttachment(attachmentId) {
    Swal.fire({
        title: 'Confirm Delete',
        text: 'Are you sure you want to delete this attachment?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // Show loading
                Swal.fire({
                    title: 'Deleting...',
                    text: 'Please wait while we delete the attachment',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                // Call API to delete attachment
                const response = await fetch(`${apiBaseUrl}/api/attachments/${attachmentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to delete attachment: ${response.status}`);
                }
                
                // Remove attachment from the list
                const container = document.getElementById('existingAttachments');
                if (container) {
                    const attachmentItems = container.querySelectorAll('.flex.items-center.justify-between');
                    attachmentItems.forEach(item => {
                        const deleteBtn = item.querySelector('button[onclick*="deleteAttachment"]');
                        if (deleteBtn && deleteBtn.onclick.toString().includes(attachmentId)) {
                            item.remove();
                        }
                    });
                }
                
                Swal.fire({
                    title: 'Deleted',
                    text: 'Attachment has been deleted successfully.',
                    icon: 'success'
                });
                
            } catch (error) {
                console.error('Error deleting attachment:', error);
                Swal.fire({
                    title: 'Error',
                    text: `Failed to delete attachment: ${error.message}`,
                    icon: 'error'
                });
            }
        }
    });
}
```

## 🛠 **Struktur Fungsi Baru**

### **HTML Functions:**
1. **`formatCurrency(input, decimalSeparator)`** - Untuk input formatting
2. **`formatNumberToCurrencyString(number)`** - Untuk value formatting (global)
3. **`parseCurrencyValue(value)`** - Untuk parsing currency string

### **JS File Functions:**
1. **`formatCurrencyValue(number)`** - Wrapper untuk memanggil fungsi HTML
2. **`formatCurrencyFallback(number)`** - Fallback jika fungsi HTML tidak tersedia
3. **`safeFormatCurrency(number)`** - Safe wrapper dengan error handling
4. **`formatCurrency(number)`** - Fungsi lokal (tidak digunakan lagi)

## 📋 **Testing Checklist**

### **Test Cases yang Harus Dilakukan:**

1. **✅ Load halaman tanpa data reimbursement**
   - Tidak ada error di console
   - Form kosong dan siap diisi
   - Type of Transaction default ke "Reimbursement"

2. **✅ Load halaman dengan data reimbursement valid**
   - Data ter-load dengan benar
   - Currency formatting berfungsi dengan format Indonesia
   - Table rows ter-populate
   - Type of Transaction ter-populate dari API

3. **✅ Load halaman dengan data reimbursement invalid**
   - Tidak ada error
   - Form tetap bisa digunakan
   - Console error yang informatif

4. **✅ Test dengan nilai undefined/null**
   - `totalAmount: undefined`
   - `totalAmount: null`
   - `reimbursementDetails: null`
   - `reimbursementDetails: undefined`

5. **✅ Test dengan array kosong**
   - `reimbursementDetails: []`
   - Tidak ada error
   - Table tetap berfungsi

6. **✅ Test dengan detail object invalid**
   - `detail: null`
   - `detail: undefined`
   - `detail.amount: undefined`

7. **✅ Test fallback function**
   - Hapus fungsi HTML sementara
   - Pastikan fallback function bekerja
   - Format currency tetap berfungsi

8. **✅ Test updateTotalAmountDue**
   - Tambah baris baru
   - Hapus baris
   - Update nilai di baris
   - Pastikan total ter-update dengan benar

9. **✅ Test populateFormFields**
   - Load data dari API
   - Pastikan semua field ter-populate
   - Pastikan currency formatting berfungsi

10. **✅ Test Type of Transaction**
    - Pilih berbagai jenis transaction
    - Pastikan data terkirim ke API dengan benar
    - Test validasi required field
    - Test conditional visibility untuk "Closed by"

11. **✅ Test API Integration**
    - Submit dengan berbagai Type of Transaction
    - Load data dari API dengan Type of Transaction
    - Pastikan mapping field berfungsi dengan benar

12. **✅ Test Attachment Management**
    - Upload file baru
    - Tampilkan attachment yang sudah ada
    - Download attachment
    - Delete attachment
    - Test dengan berbagai tipe file (PDF, DOC, XLS, JPG)
    - Test dengan file besar dan kecil
    - Test error handling untuk file invalid

13. **✅ Test Document Date dengan submissionDate**
    - Load data dengan docDate (primary)
    - Load data dengan submissionDate (fallback)
    - Load data tanpa keduanya (empty)
    - Test priority order (docDate > submissionDate)
    - Test date formatting (YYYY-MM-DD)
    - Test dengan berbagai format tanggal

14. **✅ Test Navigation Path**
    - Test tombol "Back" di addOPReim.html
    - Test redirect setelah submit/save
    - Test path navigation yang benar
    - Test file menuOPReimCheck.html dapat diakses
    - Test tidak ada error 404

## 🎯 **Hasil Perbaikan**

### **Sebelum:**
- ❌ Error `Cannot read properties of undefined (reading 'replace')`
- ❌ Konflik fungsi `formatCurrency` (HTML vs JS)
- ❌ Panggilan fungsi dengan parameter salah
- ❌ Crash ketika data invalid
- ❌ Error di `updateTotalAmountDue` dan `populateFormFields`
- ❌ Tidak ada kolom Type of Transaction

### **Sesudah:**
- ✅ Tidak ada error di console
- ✅ Fungsi terpisah dengan jelas (HTML vs JS)
- ✅ Fungsi global untuk kompatibilitas
- ✅ Fallback function untuk keamanan
- ✅ Safe format function dengan error handling
- ✅ Validasi lengkap untuk semua nilai
- ✅ Graceful handling untuk data invalid
- ✅ Error logging yang informatif
- ✅ Format Indonesia (thousand separator: '.', decimal separator: ',')
- ✅ **Kolom Type of Transaction dengan 4 opsi:**
  - REIMBURSEMENT (default)
  - ADVANCE
  - SETTLEMENT
  - LOAN
- ✅ **API Integration untuk Type of Transaction**
- ✅ **Validasi required field**
- ✅ **Conditional visibility untuk "Closed by" (hanya muncul saat LOAN)**
- ✅ **Attachment Management** dengan upload, display, download, dan delete
- ✅ **File type support** (PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG)
- ✅ **Base64 encoding** untuk file upload ke API
- ✅ **File size formatting** dan icon berdasarkan tipe file
- ✅ **Error handling** untuk attachment operations
- ✅ **Document Date support** untuk docDate dan submissionDate
- ✅ **Priority handling** (docDate > submissionDate)
- ✅ **Date formatting** (YYYY-MM-DD format)
- ✅ **Navigation path fix** - Path yang benar untuk menuOPReimCheck.html
- ✅ **404 error resolution** - Tidak ada lagi error 404 untuk navigation 