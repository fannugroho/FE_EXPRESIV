# Export Functionality Troubleshooting Guide

## Masalah yang Ditemukan dan Solusi

### 1. Masalah Utama: Inkonsistensi Variabel `filteredDocuments`

**Masalah:**

- Fungsi export menggunakan `window.filteredDocuments`
- Tetapi beberapa fungsi lain menggunakan `filteredDocuments` (variabel lokal)
- Ini menyebabkan data tidak tersedia saat export

**Solusi yang Diterapkan:**

- Mengubah semua penggunaan `filteredDocuments` menjadi `window.filteredDocuments`
- Memastikan variabel global tersedia di seluruh aplikasi

### 2. Masalah Library Loading

**Masalah:**

- Library XLSX dan jsPDF mungkin tidak dimuat dengan benar
- Tidak ada error handling untuk library yang tidak tersedia

**Solusi yang Diterapkan:**

- Menambahkan pengecekan ketersediaan library
- Menambahkan error handling yang lebih baik
- Menambahkan debugging untuk library loading

### 3. Masalah Data Loading

**Masalah:**

- Data mungkin belum dimuat saat tombol export ditekan
- Tidak ada mekanisme untuk memuat data terlebih dahulu

**Solusi yang Diterapkan:**

- Menambahkan pengecekan data sebelum export
- Menambahkan mekanisme auto-load data jika belum tersedia
- Menambahkan retry mechanism

## Perubahan yang Dilakukan

### 1. File `menuOPReim.js`

#### Variabel Global

```javascript
// Sebelum
let filteredDocuments = [];

// Sesudah
window.filteredDocuments = []; // Make it global
```

#### Fungsi Export dengan Error Handling

```javascript
function downloadExcel() {
  console.log("downloadExcel called");
  console.log("window.filteredDocuments:", window.filteredDocuments);
  console.log("XLSX available:", typeof XLSX !== "undefined");

  // Check if data is loaded
  if (!window.filteredDocuments || window.filteredDocuments.length === 0) {
    // Try to load data first
    const userId = getUserId();
    if (userId) {
      loadDashboard().then(() => {
        if (window.filteredDocuments && window.filteredDocuments.length > 0) {
          downloadExcel(); // Retry
        } else {
          alert("No data available to export.");
        }
      });
    }
    return;
  }

  if (typeof XLSX === "undefined") {
    alert("Excel library not loaded. Please refresh the page.");
    return;
  }

  try {
    // Export logic...
  } catch (error) {
    console.error("Error generating Excel file:", error);
    alert("Error generating Excel file. Please try again.");
  }
}
```

#### Fungsi loadDashboard yang Mengembalikan Promise

```javascript
async function loadDashboard() {
  // ... existing logic ...

  // Return the documents for external use
  return window.filteredDocuments;

  // ... error handling ...
}
```

### 2. File Test `test-export.html`

Dibuat file test untuk memverifikasi bahwa library dan fungsi export bekerja dengan benar.

## Cara Testing

### 1. Test Library Loading

1. Buka browser developer tools (F12)
2. Buka Console tab
3. Refresh halaman `menuOPReim.html`
4. Periksa log untuk:
   ```
   Checking required libraries...
   XLSX available: true
   jsPDF available: true
   ```

### 2. Test Data Loading

1. Buka Console
2. Periksa apakah data dimuat:
   ```
   Loading dashboard with userId: [user_id]
   Total documents fetched for dashboard: [number]
   ```

### 3. Test Export Functions

1. Klik tombol Excel atau PDF
2. Periksa Console untuk:
   ```
   downloadExcel called
   window.filteredDocuments: [array]
   XLSX available: true
   Excel file generated successfully: [filename]
   ```

### 4. Test File Test

1. Buka `test-export.html`
2. Klik tombol "Test Excel Export" atau "Test PDF Export"
3. Verifikasi file terdownload

## Troubleshooting Steps

### Jika Export Tidak Berfungsi:

1. **Periksa Console Error**

   - Buka Developer Tools (F12)
   - Lihat Console tab
   - Cari error messages

2. **Periksa Library Loading**

   ```javascript
   console.log("XLSX:", typeof XLSX);
   console.log("jsPDF:", typeof window.jspdf);
   ```

3. **Periksa Data Availability**

   ```javascript
   console.log("filteredDocuments:", window.filteredDocuments);
   console.log("filteredDocuments length:", window.filteredDocuments?.length);
   ```

4. **Periksa Network**

   - Lihat Network tab di Developer Tools
   - Pastikan API calls berhasil
   - Periksa response dari API

5. **Test dengan File Test**
   - Buka `test-export.html`
   - Test export dengan data dummy
   - Jika berhasil, masalah ada di data loading

### Common Issues:

1. **"No data to export"**

   - Data belum dimuat
   - API call gagal
   - User tidak terautentikasi

2. **"Library not loaded"**

   - CDN tidak tersedia
   - Network issue
   - Script loading order

3. **"Error generating file"**
   - Data format tidak sesuai
   - Library version conflict
   - Browser compatibility

## Prevention

1. **Selalu gunakan `window.filteredDocuments`** untuk konsistensi
2. **Tambahkan error handling** di semua fungsi export
3. **Test library availability** sebelum menggunakan
4. **Log debugging information** untuk troubleshooting
5. **Gunakan try-catch** untuk menangkap error

## File yang Dimodifikasi

1. `FE_EXPRESIV/js/menuOPReim.js` - Fixed variable consistency and added error handling
2. `FE_EXPRESIV/test-export.html` - Created test file
3. `FE_EXPRESIV/EXPORT_TROUBLESHOOTING.md` - This documentation
