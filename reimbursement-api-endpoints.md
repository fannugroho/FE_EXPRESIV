# Reimbursement API Endpoints

This document provides a comprehensive overview of all API endpoints related to the Reimbursement system, as implemented based on the requirements in the Kansai Paint Indonesia blueprint document.

## Reimbursement Controller Endpoints

| Endpoint | Method | Description | Notes |
|----------|--------|-------------|-------|
| `/api/reimbursements` | GET | Retrieves all reimbursements | Returns all reimbursement documents in the system |
| `/api/reimbursements/{id}` | GET | Retrieves a specific reimbursement by ID | Used for viewing detailed information about a reimbursement |
| `/api/reimbursements/status/{status}` | GET | Retrieves reimbursements filtered by status | Useful for dashboard views based on status (Draft, Checked, Approved, Paid, Closed, Rejected) |
| `/api/reimbursements/user/{username}` | GET | Retrieves reimbursements for a specific user | Allows users to view their own reimbursement requests |
| `/api/reimbursements/status-counts` | GET | Retrieves count of reimbursements by status | Powers the dashboard cards showing counts by status |
| `/api/reimbursements` | POST | Creates a new reimbursement | When users click "Create Reimbursement" button |
| `/api/reimbursements/{id}` | PUT | Updates an existing reimbursement | Used when editing a reimbursement (only allowed in Draft or Rejected status) |
| `/api/reimbursements/{id}` | DELETE | Deletes a reimbursement | Should only be allowed for draft reimbursements |
| `/api/reimbursements/{id}/status` | PATCH | Updates the status of a reimbursement | Used during approval workflow (Checker and Approver) |

## Reimbursement Attachment Controller Endpoints

| Endpoint | Method | Description | Notes |
|----------|--------|-------------|-------|
| `/api/reimbursements/{reimbursementId}/attachments/upload` | POST | Uploads attachment files | Allows multiple file uploads; only allowed when reimbursement is in Draft or Rejected status |
| `/api/reimbursements/{reimbursementId}/attachments/{attachmentId}` | DELETE | Deletes a specific attachment | Only allowed when reimbursement is in Draft or Rejected status |
| `/api/reimbursements/{reimbursementId}/attachments` | GET | Retrieves all attachments for a reimbursement | Used to display attached documents in the UI |

## Reimbursement SAP Integration Controller Endpoints

| Endpoint | Method | Description | Notes |
|----------|--------|-------------|-------|
| `/api/reimbursements/sap/pending-payments` | GET | Retrieves reimbursements pending payment | Used by finance team to see approved reimbursements ready for payment |
| `/api/reimbursements/sap/interface-to-sap` | POST | Interfaces an approved reimbursement to SAP | Creates "Outgoing Payments Draft" in SAP; only works with "Approved" status reimbursements |
| `/api/reimbursements/sap/update-payment-status` | POST | Updates payment status from SAP | Updates reimbursement status based on payment result (Completed → Closed, Failed → Approved with remarks) |

## Important Notes

1. **Status Flow**: Reimbursements follow a specific status progression:
   - Draft → Checked → Approved → Paid → Closed
   - Can be rejected at Checker or Approver stage

2. **Attachment Restrictions**: 
   - Document attachments can only be uploaded or deleted when the reimbursement is in Draft or Rejected status
   - Support document uploads are required as per the business process

3. **SAP Integration**:
   - Only approved reimbursements can be interfaced to SAP
   - Payment status updates come from SAP to close the workflow loop
   - The "Paid" status is set when the reimbursement is interfaced to SAP
   - The "Closed" status is set when payment is confirmed completed

4. **Security Considerations**:
   - Authorization is currently commented out but should be implemented in production
   - SAP integration endpoints should be restricted to Finance and Administrator roles

5. **Data Requirements**:
   - Reimbursement requires information like Voucher No, Requester, Department, Currency, etc.
   - Transaction details including GL Account, Account Name, and Amount are required
   - Reference documents and type of transaction must be specified 

# Implementasi Fitur Upload dan Delete Attachment untuk Reimbursement

## Endpoint API yang Digunakan

1. **Upload Attachment**:
   ```
   ${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/upload
   ```
   - Method: POST
   - Body: FormData dengan field 'files' (dapat multiple)

2. **Delete Attachment**:
   ```
   ${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/${attachmentId}
   ```
   - Method: DELETE

## Alur Kerja Fitur

### Upload Attachment
1. User memilih file melalui input file di halaman detailReim.html
2. Event `onchange` memicu fungsi `previewPDF(event)`
3. Fungsi `previewPDF` memanggil `uploadAttachments(files)`
4. `uploadAttachments` mengirim file ke server menggunakan endpoint upload
5. Setelah upload berhasil, `fetchReimbursementData()` dipanggil untuk refresh data

### Delete Attachment
1. Attachment ditampilkan dengan tombol View dan Delete (X) melalui fungsi `displayAttachments()`
2. Tombol Delete (X) hanya muncul jika status dokumen adalah "Draft"
3. Klik tombol Delete memanggil fungsi `deleteAttachment(attachmentId)`
4. `deleteAttachment` menghapus file dari server menggunakan endpoint delete
5. Setelah berhasil dihapus, `fetchReimbursementData()` dipanggil untuk refresh data

## Komponen Utama

### HTML (detailReim.html)
```html
<!-- Input untuk upload attachment - hanya bisa menambah/hapus jika status Draft -->
<h3 class="text-lg font-semibold mb-2">Attach Doc</h3>
<input type="file" id="filePath" accept="application/pdf" class="w-full p-2 border rounded" multiple onchange="previewPDF(event)" />
<!-- Container untuk menampilkan daftar attachment dengan tombol View dan Delete (jika Draft) -->
<div id="attachmentsList" class="mt-2"></div>
```

### JavaScript (detailReim.js)

#### Fungsi Upload
```javascript
// Fungsi untuk menampilkan preview PDF dan mengupload file ke server
// Dipanggil saat user memilih file melalui input file
function previewPDF(event) {
    // Mendapatkan file yang dipilih oleh user
    const files = event.target.files;
    if (files.length === 0) return;
    
    // Validasi: Maksimum 5 file yang diperbolehkan
    if (files.length > 5) {
        alert('Maksimum 5 file yang diperbolehkan');
        return;
    }

    // Panggil fungsi untuk upload file ke server
    uploadAttachments(files);
}

// Fungsi untuk mengupload attachment ke server
// Menggunakan endpoint: ${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/upload
async function uploadAttachments(files) {
    // Dapatkan ID reimbursement dari URL
    const reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId) {
        alert('ID reimbursement tidak ditemukan');
        return;
    }
    
    try {
        // Persiapkan FormData untuk upload file
        const formData = new FormData();
        
        // Tambahkan semua file ke formData
        Array.from(files).forEach(file => {
            formData.append('files', file);
            console.log('Menambahkan file untuk upload:', file.name);
        });
        
        // Kirim ke server menggunakan API endpoint upload attachment
        console.log(`Uploading attachments to: ${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/upload`);
        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/upload`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            console.log('Upload attachment berhasil:', result);
            
            // Refresh data untuk menampilkan attachment baru
            fetchReimbursementData();
        } else {
            alert('Gagal mengupload file: ' + (result.message || 'Terjadi kesalahan'));
            console.error('Upload attachment gagal:', result);
        }
    } catch (error) {
        console.error('Error uploading attachments:', error);
        alert('Terjadi kesalahan saat mengupload file');
    }
}
```

#### Fungsi Display dan Delete
```javascript
// Fungsi untuk menampilkan daftar attachment dengan tombol hapus (jika status Draft)
function displayAttachments(attachments) {
    const attachmentsList = document.getElementById('attachmentsList');
    attachmentsList.innerHTML = '';
    
    // Dapatkan status dokumen untuk menentukan apakah tombol hapus ditampilkan
    const status = document.getElementById('status').value;
    console.log('Status dokumen:', status);
    
    if (attachments && attachments.length > 0) {
        console.log('Jumlah attachment:', attachments.length);
        
        attachments.forEach(attachment => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';
            
            // Tambahkan tombol hapus hanya jika status dokumen adalah Draft
            if (status === 'Draft') {
                console.log('Menampilkan tombol hapus untuk attachment:', attachment.fileName);
                attachmentItem.innerHTML = `
                    <span>${attachment.fileName}</span>
                    <div>
                        <a href="${BASE_URL}/${attachment.filePath}" target="_blank" class="text-blue-500 hover:text-blue-700 mr-3">View</a>
                        <button type="button" onclick="deleteAttachment('${attachment.id}')" class="text-red-500 hover:text-red-700">X</button>
                    </div>
                `;
            } else {
                // Jika bukan Draft, hanya tampilkan tombol View
                console.log('Status bukan Draft, hanya menampilkan tombol View untuk:', attachment.fileName);
                attachmentItem.innerHTML = `
                    <span>${attachment.fileName}</span>
                    <a href="${BASE_URL}/${attachment.filePath}" target="_blank" class="text-blue-500 hover:text-blue-700">View</a>
                `;
            }
            
            attachmentsList.appendChild(attachmentItem);
        });
    } else {
        console.log('Tidak ada attachment untuk ditampilkan');
    }
}

// Fungsi untuk menghapus attachment
// Menggunakan endpoint: ${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/${attachmentId}
async function deleteAttachment(attachmentId) {
    // Dapatkan ID reimbursement dari URL
    const reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId || !attachmentId) {
        alert('ID tidak ditemukan');
        return;
    }

    try {
        console.log(`Menghapus attachment ID: ${attachmentId} dari reimbursement ID: ${reimbursementId}`);
        
        // Panggil API untuk menghapus attachment
        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/${attachmentId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.status && data.code === 200) {
            console.log('Attachment berhasil dihapus:', data);
            
            // Refresh data reimbursement untuk memperbarui daftar attachment
            fetchReimbursementData();
        } else {
            alert('Gagal menghapus attachment: ' + (data.message || 'Terjadi kesalahan'));
            console.error('Gagal menghapus attachment:', data);
        }
    } catch (error) {
        console.error('Error saat menghapus attachment:', error);
        alert('Terjadi kesalahan saat menghapus attachment');
    }
}
```

## Catatan Penting

1. Fitur upload dan delete attachment hanya tersedia untuk dokumen dengan status "Draft"
2. Maksimum 5 file yang diperbolehkan untuk diupload
3. Format file yang diperbolehkan adalah PDF (diatur melalui `accept="application/pdf"` pada input file)
4. Setelah upload atau delete berhasil, data akan direfresh secara otomatis
5. Jika terjadi error, akan ditampilkan pesan alert dan log error di console

## Debugging

Untuk memudahkan debugging, telah ditambahkan console.log pada beberapa bagian kode:
- Saat upload file: nama file yang diupload
- Saat upload berhasil/gagal: response dari server
- Saat menampilkan attachment: status dokumen dan jumlah attachment
- Saat menghapus attachment: ID attachment dan ID reimbursement
- Saat hapus berhasil/gagal: response dari server

## Integrasi dengan Sistem

Fitur ini terintegrasi dengan sistem yang ada melalui:
1. Fungsi `getReimbursementIdFromUrl()` untuk mendapatkan ID reimbursement dari URL
2. Fungsi `fetchReimbursementData()` untuk refresh data setelah upload/delete
3. Penggunaan variabel global `BASE_URL` untuk endpoint API 