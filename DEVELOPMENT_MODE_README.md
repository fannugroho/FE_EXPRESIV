# Mode Development - Bypass Autentikasi

## Deskripsi
Modifikasi ini telah dibuat untuk menonaktifkan sistem autentikasi pada halaman-halaman tertentu selama tahap development. Hal ini dilakukan untuk menghindari gangguan dari notifikasi error autentikasi yang muncul saat mengakses halaman.

## Halaman yang Dimodifikasi

### 1. addINVItem.html
- **Lokasi**: `addPages/addINVItem.html`
- **Perubahan**: Script auth.js dinonaktifkan
- **File JS**: `js/addARInv.js` - ditambahkan mode development dengan data dummy

### 2. detailINVItem.html
- **Lokasi**: `detailPages/detailINVItem.html`
- **Perubahan**: Script auth.js dinonaktifkan
- **File JS**: `js/detailInvItem.js` - ditambahkan mode development dengan data dummy

### 3. checkInvItem.html
- **Lokasi**: `approvalPages/approval/check/invoiceItem/checkInvItem.html`
- **Perubahan**: Script auth.js dinonaktifkan
- **File JS**: `approvalPages/approval/check/invoiceItem/checkInvItem.js` - ditambahkan mode development

### 4. approveInvItem.html
- **Lokasi**: `approvalPages/approval/approve/invoiceItem/approveInvItem.html`
- **Perubahan**: Script auth.js dinonaktifkan
- **File JS**: `approvalPages/approval/approve/invoiceItem/approveInvItem.js` - ditambahkan mode development

### 5. receiveInvItem.html
- **Lokasi**: `approvalPages/approval/receive/invoiceItem/receiveInvItem.html`
- **Perubahan**: Script auth.js dinonaktifkan
- **File JS**: `approvalPages/approval/receive/invoiceItem/receiveInvItem.js` - ditambahkan mode development

### 6. acknowInvItem.html
- **Lokasi**: `approvalPages/approval/acknowledge/InvoiceItem/acknowInvItem.html`
- **Perubahan**: Script auth.js dinonaktifkan
- **File JS**: `approvalPages/approval/acknowledge/InvoiceItem/acknowInvItem.js` - ditambahkan mode development

## Perubahan yang Dilakukan

### 1. HTML Files
- Script auth.js dikomentari dengan `<!-- Authentication is disabled for development -->`
- Menambahkan komentar untuk menunjukkan bahwa autentikasi dinonaktifkan

### 2. JavaScript Files
- Menambahkan variabel `const isDevelopmentMode = true;`
- Menambahkan data dummy untuk customers, items, dan users
- Menambahkan fungsi untuk load data dummy
- Menambahkan user dummy untuk development

## Data Dummy yang Tersedia

### Customers
- C001 - PT Sample Customer 1
- C002 - PT Sample Customer 2
- C003 - PT Sample Customer 3

### Items
- ITEM001 - Sample Item 1
- ITEM002 - Sample Item 2
- ITEM003 - Sample Item 3

### Users
- John Doe (john.doe)
- Jane Smith (jane.smith)
- Bob Johnson (bob.johnson)

### Sample Invoice Data
- Invoice Number: INV-2024-001
- Customer: PT Sample Customer
- Currency: IDR
- Total Amount: 1,100,000
- Items: 2 sample items dengan total 800,000

## Cara Mengaktifkan Kembali Autentikasi

Untuk mengaktifkan kembali autentikasi pada halaman-halaman ini:

1. **HTML Files**: Uncomment script auth.js
   ```html
   <!-- <script src="../js/auth.js"></script> -->
   ```
   Menjadi:
   ```html
   <script src="../js/auth.js"></script>
   ```

2. **JavaScript Files**: Set `isDevelopmentMode = false`
   ```javascript
   const isDevelopmentMode = false;
   ```

## Catatan Penting

- Mode development ini hanya untuk keperluan development
- Jangan deploy ke production dengan mode development aktif
- Semua data yang ditampilkan adalah data dummy
- Fungsi submit dan approval akan menggunakan data dummy
- Console akan menampilkan pesan "Development mode: Using dummy data"

## Troubleshooting

Jika masih muncul error autentikasi:

1. Pastikan semua file HTML telah dimodifikasi
2. Pastikan semua file JavaScript telah dimodifikasi
3. Clear browser cache dan reload halaman
4. Periksa console browser untuk pesan error
5. Pastikan tidak ada script auth.js lain yang masih aktif

## Status

✅ **SELESAI** - Semua halaman yang diminta telah dimodifikasi untuk bypass autentikasi selama development. 