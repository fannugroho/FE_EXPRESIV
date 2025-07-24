# Auto-Print Feature for Reimbursement Approval

## Overview

Fitur auto-print telah diimplementasikan pada halaman `receiveReim.html` untuk secara otomatis menghasilkan dokumen print dan menyimpannya sebagai attachment saat dokumen reimbursement di-approve.

## Fitur yang Diimplementasikan

### 1. Auto-Print Configuration
- Checkbox untuk mengaktifkan/menonaktifkan fitur auto-print
- Default: Enabled (checked)
- User dapat memilih apakah ingin menggunakan fitur ini atau tidak

### 2. Auto-Print Process
Saat dokumen di-approve dan auto-print diaktifkan:
1. **Generate Print Data**: Mengumpulkan semua data dari form
2. **Create HTML Content**: Membuat HTML yang profesional untuk print
3. **Convert to PDF**: Menggunakan library html2pdf untuk konversi HTML ke PDF
4. **Save as Attachment**: Menyimpan PDF sebagai attachment ke reimbursement
5. **Trigger Print Dialog**: Membuka dialog print untuk user
6. **Fallback**: Jika PDF generation gagal, akan menyimpan HTML sebagai attachment

### 3. Print Document Features
- **Professional Layout**: Header dengan logo perusahaan dan informasi dokumen
- **Complete Information**: Semua data reimbursement termasuk details dan approvals
- **Signature Section**: Area tanda tangan untuk semua approver
- **Amount in Words**: Konversi angka ke kata-kata
- **Print-friendly CSS**: Styling khusus untuk print

## Technical Implementation

### Libraries Used
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
```

### Key Functions

#### 1. `autoPrintAndSaveAsAttachment(reimbursementId)`
- Main function untuk handle auto-print process
- Menggunakan html2pdf untuk konversi HTML ke PDF
- Fallback ke HTML jika PDF generation gagal

#### 2. `generatePrintData()`
- Mengumpulkan semua data dari form fields
- Menyiapkan data untuk print generation

#### 3. `generatePrintContent(printData)`
- Membuat HTML content yang profesional
- Include styling untuk print
- Format yang sesuai dengan standar perusahaan

#### 4. `savePrintAsAttachment(reimbursementId, blob, fileType)`
- Menyimpan file (PDF/HTML) sebagai attachment
- Menggunakan endpoint `/api/reimbursements/{id}/attachments/upload`

#### 5. `numberToWords(num)`
- Konversi angka ke kata-kata dalam bahasa Inggris
- Digunakan untuk "Amount in Words"

### API Endpoints Used
- `POST /api/reimbursements/{id}/attachments/upload` - Untuk menyimpan attachment

## User Experience

### Approval Process
1. User mengisi form reimbursement
2. User menekan tombol "Receive"
3. Konfirmasi approval muncul
4. Jika auto-print diaktifkan:
   - Loading indicator ditampilkan
   - PDF/HTML document di-generate
   - File disimpan sebagai attachment
   - Print dialog muncul
   - Success message ditampilkan
5. User dikembalikan ke menu

### Error Handling
- Jika PDF generation gagal, sistem akan fallback ke HTML
- Jika attachment save gagal, approval tetap berhasil tapi dengan warning
- User tetap bisa manually print dokumen

## Configuration

### Enable/Disable Auto-Print
```html
<input type="checkbox" id="autoPrintEnabled" class="rounded" checked>
```

### Default Settings
- Auto-print: Enabled by default
- File format: PDF (fallback ke HTML)
- Attachment type: Print document

## File Structure

```
approvalPages/approval/receive/reimbursement/
├── receiveReim.html          # Main page dengan fitur auto-print
├── receiveReim.js           # JavaScript dengan fungsi auto-print
└── printReim.html           # Existing print page (tidak berubah)
```

## Benefits

1. **Automation**: Tidak perlu manual print dan save attachment
2. **Consistency**: Format print yang konsisten untuk semua dokumen
3. **Audit Trail**: Print document tersimpan sebagai attachment
4. **User Control**: User bisa enable/disable fitur sesuai kebutuhan
5. **Professional Output**: Print document dengan layout yang profesional

## Future Enhancements

1. **Email Integration**: Kirim print document via email
2. **Multiple Formats**: Support untuk format lain (DOCX, XLSX)
3. **Template System**: Template yang dapat dikustomisasi
4. **Batch Processing**: Auto-print untuk multiple documents
5. **Print History**: Tracking history print documents

## Troubleshooting

### Common Issues

1. **PDF Generation Failed**
   - Check browser console untuk error
   - Fallback ke HTML akan digunakan
   - Pastikan library html2pdf ter-load dengan benar

2. **Attachment Save Failed**
   - Check network connection
   - Verify API endpoint availability
   - Check file size limits

3. **Print Dialog Not Appearing**
   - Check browser popup blocker
   - Ensure JavaScript is enabled
   - Try manual print button

### Debug Information
- Console logs tersedia untuk debugging
- Error messages ditampilkan ke user
- Fallback mechanisms untuk reliability 