# Auto-Print Feature Testing Guide

## Testing Scenarios

### 1. Basic Auto-Print Functionality

#### Test Case: Enable Auto-Print and Approve
**Steps:**
1. Buka halaman `receiveReim.html` dengan ID reimbursement yang valid
2. Pastikan checkbox "Enable auto-print" ter-checked
3. Klik tombol "Receive"
4. Konfirmasi approval
5. Tunggu proses auto-print selesai

**Expected Results:**
- Loading indicator muncul
- PDF document di-generate
- File tersimpan sebagai attachment
- Print dialog muncul
- Success message ditampilkan
- User dikembalikan ke menu

#### Test Case: Disable Auto-Print and Approve
**Steps:**
1. Buka halaman `receiveReim.html` dengan ID reimbursement yang valid
2. Uncheck checkbox "Enable auto-print"
3. Klik tombol "Receive"
4. Konfirmasi approval

**Expected Results:**
- Approval berhasil tanpa auto-print
- Tidak ada print dialog
- Success message sederhana
- User dikembalikan ke menu

### 2. Error Handling Tests

#### Test Case: PDF Generation Failure
**Steps:**
1. Simulasi error pada html2pdf library
2. Enable auto-print
3. Approve document

**Expected Results:**
- Fallback ke HTML generation
- HTML file tersimpan sebagai attachment
- Print dialog tetap muncul
- Warning message ditampilkan

#### Test Case: Attachment Save Failure
**Steps:**
1. Simulasi network error atau API failure
2. Enable auto-print
3. Approve document

**Expected Results:**
- Approval tetap berhasil
- Warning message tentang attachment failure
- User bisa manually print

### 3. Print Document Quality Tests

#### Test Case: Print Layout Verification
**Steps:**
1. Approve document dengan auto-print enabled
2. Check generated PDF/HTML file
3. Verify print layout

**Expected Results:**
- Header dengan logo perusahaan
- Informasi dokumen lengkap
- Table dengan data reimbursement
- Signature section
- Amount in words
- Professional formatting

#### Test Case: Print Dialog Functionality
**Steps:**
1. Approve document dengan auto-print enabled
2. Check print dialog yang muncul
3. Test print functionality

**Expected Results:**
- Print dialog muncul dengan content yang benar
- Print preview terlihat baik
- Print berhasil

### 4. Data Validation Tests

#### Test Case: Complete Data
**Steps:**
1. Isi semua field dengan data lengkap
2. Enable auto-print
3. Approve document

**Expected Results:**
- Semua data tercetak dengan benar
- Format sesuai standar
- Tidak ada data yang hilang

#### Test Case: Partial Data
**Steps:**
1. Isi field dengan data parsial (beberapa field kosong)
2. Enable auto-print
3. Approve document

**Expected Results:**
- Data yang ada tercetak dengan benar
- Field kosong ditampilkan sebagai "-" atau kosong
- Tidak ada error

### 5. Browser Compatibility Tests

#### Test Case: Chrome Browser
**Steps:**
1. Test di Chrome browser
2. Enable auto-print
3. Approve document

**Expected Results:**
- PDF generation berhasil
- Print dialog muncul
- Attachment tersimpan

#### Test Case: Firefox Browser
**Steps:**
1. Test di Firefox browser
2. Enable auto-print
3. Approve document

**Expected Results:**
- PDF generation berhasil
- Print dialog muncul
- Attachment tersimpan

#### Test Case: Edge Browser
**Steps:**
1. Test di Edge browser
2. Enable auto-print
3. Approve document

**Expected Results:**
- PDF generation berhasil
- Print dialog muncul
- Attachment tersimpan

## Manual Testing Checklist

### Pre-Test Setup
- [ ] Pastikan reimbursement data tersedia
- [ ] Pastikan user memiliki permission untuk approve
- [ ] Pastikan network connection stabil
- [ ] Pastikan browser popup blocker disabled

### Functionality Tests
- [ ] Auto-print checkbox berfungsi
- [ ] Approval process berjalan normal
- [ ] PDF generation berhasil
- [ ] Attachment tersimpan di database
- [ ] Print dialog muncul
- [ ] Error handling berfungsi

### UI/UX Tests
- [ ] Loading indicator muncul
- [ ] Success/error messages jelas
- [ ] Checkbox label mudah dipahami
- [ ] Print document layout profesional

### Performance Tests
- [ ] Auto-print tidak terlalu lama
- [ ] Tidak ada memory leak
- [ ] Browser tidak freeze
- [ ] Network request optimal

## Debug Information

### Console Logs to Check
```javascript
// Check these console logs during testing
console.log('Auto-print enabled:', document.getElementById('autoPrintEnabled').checked);
console.log('Print data generated:', printData);
console.log('PDF generation result:', pdfBlob);
console.log('Attachment save result:', result);
```

### Common Error Messages
- "PDF generation failed" - Check html2pdf library
- "Attachment save failed" - Check API endpoint
- "Print dialog failed" - Check browser popup blocker

### Network Tab Monitoring
- Check API calls to `/api/reimbursements/{id}/attachments/upload`
- Verify response status codes
- Check file upload size

## Test Data Examples

### Sample Reimbursement Data
```javascript
{
    voucherNo: "REIM-2024-001",
    payTo: "John Doe",
    submissionDate: "2024-01-15",
    department: "Sales & Marketing",
    typeOfTransaction: "Medical",
    totalAmount: "1500000.00",
    details: [
        {
            category: "Medical",
            accountName: "Medical Expense",
            glAccount: "6054",
            description: "Hospital bill",
            amount: 1500000.00
        }
    ],
    remarks: "Medical reimbursement for hospital visit",
    preparedBy: "Admin User",
    checkedBy: "Finance User",
    acknowledgeBy: "Supervisor User",
    approvedBy: "Manager User",
    receivedBy: "Receiver User"
}
```

## Performance Benchmarks

### Expected Performance
- PDF generation: < 5 seconds
- Attachment upload: < 3 seconds
- Total auto-print process: < 10 seconds
- Memory usage: < 50MB additional

### Load Testing
- Test dengan 10+ concurrent approvals
- Test dengan large reimbursement data
- Test dengan slow network connection

## Security Considerations

### File Upload Security
- [ ] File size limits enforced
- [ ] File type validation
- [ ] Malicious content scanning
- [ ] Access control verification

### Data Privacy
- [ ] Sensitive data tidak terekspos
- [ ] Print content tidak disimpan di cache
- [ ] Temporary files dibersihkan

## Regression Testing

### Existing Functionality
- [ ] Manual print button masih berfungsi
- [ ] Approval tanpa auto-print masih normal
- [ ] Existing attachments tidak terpengaruh
- [ ] UI/UX tidak berubah untuk fitur lain

### Integration Testing
- [ ] Attachment list ter-update setelah auto-print
- [ ] Print document muncul di attachment list
- [ ] File dapat di-download dan di-view
- [ ] File dapat di-delete (jika status Draft) 