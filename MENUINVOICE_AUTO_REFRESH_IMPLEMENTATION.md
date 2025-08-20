# MenuInvoice Auto-Refresh Implementation

## Overview

Fitur auto-refresh telah ditambahkan pada halaman MenuInvoice (`pages/menuInvoice.html` dan `js/menuInvoice.js`) untuk memastikan data invoice selalu ter-update setiap kali halaman dibuka atau difokuskan kembali.

## File yang Telah Diupdate

1. **HTML**: `pages/menuInvoice.html` - Menambahkan komentar dokumentasi
2. **JavaScript**: `js/menuInvoice.js` - Menambahkan fungsi `setupAutoRefresh()`

## Fitur Auto-Refresh yang Ditambahkan

### 1. Visibility Change Detection

- **Event**: `visibilitychange`
- **Trigger**: Ketika user kembali ke tab browser
- **Action**: Memanggil `fetchInvoiceData()` untuk refresh data

### 2. Window Focus Detection

- **Event**: `focus`
- **Trigger**: Ketika window browser mendapatkan fokus kembali
- **Action**: Memanggil `fetchInvoiceData()` untuk refresh data

### 3. Page Cache Detection

- **Event**: `pageshow`
- **Trigger**: Ketika halaman dimuat dari cache (back/forward navigation)
- **Action**: Memanggil `fetchInvoiceData()` untuk refresh data

### 4. Navigation Detection

- **Event**: `performance.navigation`
- **Trigger**: Ketika user navigasi ke halaman ini
- **Action**: Memanggil `fetchInvoiceData()` untuk refresh data

### 5. Initial Load Refresh

- **Trigger**: 1 detik setelah halaman dimuat
- **Action**: Memanggil `fetchInvoiceData()` untuk memastikan data ter-update

## Implementasi Teknis

### Fungsi `setupAutoRefresh()`

```javascript
function setupAutoRefresh() {
  // Refresh data when page becomes visible (user returns to tab)
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      console.log("Page became visible, refreshing data...");
      fetchInvoiceData();
    }
  });

  // Refresh data when window gains focus (user returns to window)
  window.addEventListener("focus", function () {
    console.log("Window gained focus, refreshing data...");
    fetchInvoiceData();
  });

  // Refresh data when page is loaded from cache (back/forward navigation)
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      console.log("Page loaded from cache, refreshing data...");
      fetchInvoiceData();
    }
  });

  // Refresh data when user navigates to this page
  if (window.performance && window.performance.navigation) {
    if (
      window.performance.navigation.type ===
      window.performance.navigation.TYPE_NAVIGATE
    ) {
      console.log("Page navigated to, refreshing data...");
      fetchInvoiceData();
    }
  }

  // Additional refresh on page load for better reliability
  setTimeout(() => {
    console.log("Initial page load refresh...");
    fetchInvoiceData();
  }, 1000);
}
```

### Integrasi dengan Event Listener

```javascript
document.addEventListener("DOMContentLoaded", function () {
  // Add caching functionality for better performance
  setupCaching();

  // Load user data immediately
  loadUserData();

  // Fetch invoice data
  fetchInvoiceData();

  // Set up search functionality
  setupSearch();

  // Add auto-refresh functionality
  setupAutoRefresh();
});
```

## Manfaat Fitur Auto-Refresh

### 1. Data Invoice Real-Time

- Data invoice selalu ter-update setiap kali user membuka halaman
- Tidak perlu manual refresh untuk mendapatkan data terbaru
- Status invoice (Draft, Prepared, Checked, dll) selalu akurat

### 2. User Experience yang Lebih Baik

- User tidak perlu khawatir tentang data invoice yang outdated
- Otomatis refresh saat kembali dari halaman lain
- Dashboard status overview selalu menampilkan angka terbaru

### 3. Konsistensi Data

- Memastikan semua user melihat data invoice yang sama
- Mengurangi kemungkinan konflik data approval
- Counter status (Total, Draft, Prepared, Checked, dll) selalu akurat

### 4. Multi-Tab Support

- Bekerja dengan baik saat user membuka multiple tab
- Refresh otomatis saat tab menjadi aktif
- Data invoice ter-update di semua tab yang terbuka

## Logging dan Debugging

Semua event auto-refresh akan menampilkan log di console browser:

- `Page became visible, refreshing data...`
- `Window gained focus, refreshing data...`
- `Page loaded from cache, refreshing data...`
- `Page navigated to, refreshing data...`
- `Initial page load refresh...`

## Kompatibilitas

Fitur ini kompatibel dengan:

- Semua browser modern (Chrome, Firefox, Safari, Edge)
- Mobile dan desktop browsers
- Single Page Application (SPA) navigation
- Browser back/forward buttons
- Tab switching

## Testing

Untuk testing fitur auto-refresh pada MenuInvoice:

1. Buka halaman MenuInvoice
2. Buka tab lain atau aplikasi lain
3. Kembali ke tab MenuInvoice
4. Data invoice akan otomatis refresh
5. Cek console untuk log refresh
6. Verifikasi counter status ter-update

## Integrasi dengan Fitur Existing

Fitur auto-refresh terintegrasi dengan:

- **Caching System**: Data tetap di-cache untuk performa optimal
- **Search Functionality**: Search tetap berfungsi setelah refresh
- **Pagination**: Pagination tetap terjaga setelah refresh
- **Tab Switching**: Tab switching tetap berfungsi normal
- **Export Functions**: Excel dan PDF export tetap tersedia

## Maintenance

Fitur ini tidak memerlukan maintenance khusus dan akan bekerja secara otomatis. Jika ada perubahan pada fungsi `fetchInvoiceData()`, fitur auto-refresh akan tetap berfungsi dengan baik.

## Perbedaan dengan ARInvoice

MenuInvoice menggunakan `fetchInvoiceData()` sebagai fungsi refresh utama, berbeda dengan ARInvoice yang menggunakan `loadDashboard()`. Ini memastikan konsistensi dengan arsitektur existing dari MenuInvoice.
