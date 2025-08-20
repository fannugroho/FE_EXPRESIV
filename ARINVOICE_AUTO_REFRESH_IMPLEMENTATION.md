# ARInvoice Auto-Refresh Implementation

## Overview

Fitur auto-refresh telah ditambahkan pada semua halaman dashboard ARInvoice untuk memastikan data selalu ter-update setiap kali halaman dibuka atau difokuskan kembali.

## Halaman yang Telah Diupdate

1. **Dashboard Acknowledge ARInvoice** - `menuARItemAcknow.js`
2. **Dashboard Approve ARInvoice** - `menuARItemApprove.js`
3. **Dashboard Check ARInvoice** - `menuARItemCheck.js`
4. **Dashboard Receive ARInvoice** - `menuARItemReceive.js`

## Fitur Auto-Refresh yang Ditambahkan

### 1. Visibility Change Detection

- **Event**: `visibilitychange`
- **Trigger**: Ketika user kembali ke tab browser
- **Action**: Memanggil `loadDashboard()` untuk refresh data

### 2. Window Focus Detection

- **Event**: `focus`
- **Trigger**: Ketika window browser mendapatkan fokus kembali
- **Action**: Memanggil `loadDashboard()` untuk refresh data

### 3. Page Cache Detection

- **Event**: `pageshow`
- **Trigger**: Ketika halaman dimuat dari cache (back/forward navigation)
- **Action**: Memanggil `loadDashboard()` untuk refresh data

### 4. Navigation Detection

- **Event**: `performance.navigation`
- **Trigger**: Ketika user navigasi ke halaman ini
- **Action**: Memanggil `loadDashboard()` untuk refresh data

### 5. Initial Load Refresh

- **Trigger**: 1 detik setelah halaman dimuat
- **Action**: Memanggil `loadDashboard()` untuk memastikan data ter-update

## Implementasi Teknis

### Fungsi `setupAutoRefresh()`

```javascript
function setupAutoRefresh() {
  // Refresh data when page becomes visible (user returns to tab)
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      console.log("Page became visible, refreshing data...");
      loadDashboard();
    }
  });

  // Refresh data when window gains focus (user returns to window)
  window.addEventListener("focus", function () {
    console.log("Window gained focus, refreshing data...");
    loadDashboard();
  });

  // Refresh data when page is loaded from cache (back/forward navigation)
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      console.log("Page loaded from cache, refreshing data...");
      loadDashboard();
    }
  });

  // Refresh data when user navigates to this page
  if (window.performance && window.performance.navigation) {
    if (
      window.performance.navigation.type ===
      window.performance.navigation.TYPE_NAVIGATE
    ) {
      console.log("Page navigated to, refreshing data...");
      loadDashboard();
    }
  }

  // Additional refresh on page load for better reliability
  setTimeout(() => {
    console.log("Initial page load refresh...");
    loadDashboard();
  }, 1000);
}
```

### Integrasi dengan Event Listener

```javascript
document.addEventListener("DOMContentLoaded", async function () {
  await loadUserData();
  await loadDashboard();

  // Add auto-refresh functionality
  setupAutoRefresh();

  // ... existing event listeners
});
```

## Manfaat Fitur Auto-Refresh

### 1. Data Real-Time

- Data selalu ter-update setiap kali user membuka halaman
- Tidak perlu manual refresh untuk mendapatkan data terbaru

### 2. User Experience yang Lebih Baik

- User tidak perlu khawatir tentang data yang outdated
- Otomatis refresh saat kembali dari halaman lain

### 3. Konsistensi Data

- Memastikan semua user melihat data yang sama
- Mengurangi kemungkinan konflik data

### 4. Multi-Tab Support

- Bekerja dengan baik saat user membuka multiple tab
- Refresh otomatis saat tab menjadi aktif

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

Untuk testing fitur auto-refresh:

1. Buka halaman ARInvoice
2. Buka tab lain atau aplikasi lain
3. Kembali ke tab ARInvoice
4. Data akan otomatis refresh
5. Cek console untuk log refresh

## Maintenance

Fitur ini tidak memerlukan maintenance khusus dan akan bekerja secara otomatis. Jika ada perubahan pada fungsi `loadDashboard()`, fitur auto-refresh akan tetap berfungsi dengan baik.
