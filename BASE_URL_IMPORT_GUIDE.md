# Base URL Import Guide

## Menggunakan BASE_URL dari auth.js

File `js/auth.js` sudah menyediakan `BASE_URL` yang dapat digunakan di seluruh aplikasi. Berikut cara menggunakannya:

### ✅ Cara yang Benar

**Sebelum:**

```javascript
// ❌ Hardcoded URL
const API_BASE_URL = "https://expressiv-be-sb.idsdev.site/api";
```

**Sesudah:**

```javascript
// ✅ Menggunakan BASE_URL dari auth.js
const API_BASE_URL = `${BASE_URL}/api`;
```

### Persyaratan

1. **Pastikan auth.js dimuat terlebih dahulu** dalam file HTML:

```html
<!-- Muat auth.js terlebih dahulu -->
<script src="../../../../js/auth.js"></script>

<!-- Kemudian muat file yang menggunakan BASE_URL -->
<script src="yourFile.js"></script>
```

2. **BASE_URL sudah tersedia global** setelah auth.js dimuat

### Contoh Implementasi

#### File HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- Load auth.js first -->
    <script src="../../../../js/auth.js"></script>

    <!-- Then load your module -->
    <script src="yourModule.js"></script>
  </head>
</html>
```

#### File JavaScript

```javascript
// yourModule.js
// BASE_URL sudah tersedia dari auth.js
const API_BASE_URL = `${BASE_URL}/api`;

// Gunakan API_BASE_URL untuk request
fetch(`${API_BASE_URL}/endpoint`)
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Keuntungan

1. **Sentralisasi konfigurasi** - Semua URL dikonfigurasi di satu tempat
2. **Mudah switch environment** - Cukup ubah di auth.js
3. **Konsistensi** - Semua file menggunakan URL yang sama
4. **Maintenance yang lebih mudah** - Tidak perlu update URL di banyak file

### File yang Sudah Diupdate

- ✅ `approvalPages/approval/acknowledge/InvoiceItem/acknowInvItem.js`
- ✅ `js/detailInvService.js`
- ✅ `js/menuInvoice.js`
- ✅ `approvalPages/dashboard/dashboardCheck/ARInvoice/menuARItemCheck.js`
- ✅ `js/detailInvItem.js` (Fixed script loading order in HTML)
- ✅ `approvalPages/approval/approve/invoiceItem/printARInvItem.js` (Added auth.js loading in HTML)

## Status Update Implementasi BASE_URL

### ✅ Files yang sudah diupdate:

1. ✅ **acknowInvItem.js** - approvalPages/approval/acknowledge/InvoiceItem/
2. ✅ **detailInvService.js** - js/
3. ✅ **menuInvoice.js** - js/
4. ✅ **menuARItemCheck.js** - approvalPages/dashboard/dashboardCheck/ARInvoice/
5. ✅ **detailInvItem.js** - js/ (Fixed script loading order in HTML)
6. ✅ **printARInvItem.js** - approvalPages/approval/approve/invoiceItem/ (Added auth.js loading in HTML)
7. ✅ **checkInvService.js** - approvalPages/approval/check/invoiceServices/
8. ✅ **acknowInvService.js** - approvalPages/approval/acknowledge/InvoiceService/
9. ✅ **approveInvService.js** - approvalPages/approval/approve/invoiceService/
10. ✅ **checkInvItem.js** - approvalPages/approval/check/invoiceItem/
11. ✅ **menuReimAcknow.js** - decisionReportApproval/dashboardAcknowledge/reimbursement/ (Added auth.js loading in HTML)
12. ✅ **addARInv.js** - js/

### 🔧 Perbaikan Script Loading Order

**Masalah yang ditemukan:** detailINVItem.html memuat script dalam urutan yang salah:

- detailInvItem.js dimuat sebelum auth.js
- Menyebabkan BASE_URL undefined saat detailInvItem.js dijalankan

**Perbaikan yang dilakukan:**

1. **detailINVItem.html**: Mengubah urutan script loading

   ```html
   <!-- SEBELUM (SALAH) -->
   <script src="../js/detailInvItem.js"></script>
   <script src="../js/auth.js"></script>

   <!-- SESUDAH (BENAR) -->
   <script src="../js/auth.js"></script>
   <script src="../js/detailInvItem.js"></script>
   ```

2. **auth.js**: Menambahkan `window.BASE_URL = BASE_URL;` langsung setelah definisi untuk memastikan tersedia global segera

### File yang Perlu Diupdate

**Semua file sudah diupdate!** 🎉

### Contoh Update untuk File Lain

```javascript
// Ubah dari:
const API_BASE_URL = "https://expressiv-be-sb.idsdev.site/api";

// Menjadi:
const API_BASE_URL = `${BASE_URL}/api`;
```

Dan pastikan auth.js dimuat di file HTML yang sesuai.

### Summary Perbaikan Hari Ini

**Total 12 file JavaScript berhasil diupdate:**

- ✅ 6 file approval pages (acknowledge, check, approve)
- ✅ 3 file dashboard/menu pages
- ✅ 2 file detail pages
- ✅ 1 file add/create page

**HTML files yang diperbaiki:**

- ✅ printARInvItem.html - ditambahkan auth.js loading
- ✅ detailINVItem.html - diperbaiki script loading order
- ✅ menuReimAcknow.html - ditambahkan auth.js loading

**Semua file sekarang menggunakan BASE_URL dari auth.js!**
