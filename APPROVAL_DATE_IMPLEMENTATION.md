# Implementasi Approval Date di Halaman Receive PR

## Overview
Implementasi ini menambahkan dukungan untuk mengambil approval dates dari API endpoint dan menggunakannya di halaman print, sama seperti yang sudah ada di halaman approve.

## API Endpoint
```
GET https://expressiv.idsdev.site/api/pr/item/{id}
```

## Response Fields yang Ditambahkan
API response sekarang menyertakan field berikut untuk approval dates:
- `preparedDateFormatted`
- `checkedDateFormatted` 
- `acknowledgedDateFormatted`
- `approvedDateFormatted`
- `receivedDateFormatted`

## Perubahan yang Dilakukan

### 1. receivePR.html
**Lokasi:** `approvalPages/approval/receive/purchaseRequest/receivePR.html`

**Perubahan:**
- Menambahkan hidden fields untuk approval dates
- Fields tidak ditampilkan di UI (hidden) karena hanya untuk keperluan print

```html
<!-- Hidden Approval Date Fields untuk Print PR -->
<div style="display: none;">
    <input type="hidden" id="preparedDateFormatted" value="">
    <input type="hidden" id="checkedDateFormatted" value="">
    <input type="hidden" id="acknowledgedDateFormatted" value="">
    <input type="hidden" id="approvedDateFormatted" value="">
    <input type="hidden" id="receivedDateFormatted" value="">
</div>
```

### 2. receivePR.js
**Lokasi:** `approvalPages/approval/receive/purchaseRequest/receivePR.js`

**Perubahan:**

#### a. populatePRDetails Function
- Menambahkan logic untuk mengisi hidden fields dengan data dari API
- Menggunakan approval dates dari response API

```javascript
// Set approval dates from API response - NEW ADDITION
if (data.preparedDateFormatted) {
    document.getElementById('preparedDateFormatted').value = data.preparedDateFormatted;
}
if (data.checkedDateFormatted) {
    document.getElementById('checkedDateFormatted').value = data.checkedDateFormatted;
}
if (data.acknowledgedDateFormatted) {
    document.getElementById('acknowledgedDateFormatted').value = data.acknowledgedDateFormatted;
}
if (data.approvedDateFormatted) {
    document.getElementById('approvedDateFormatted').value = data.approvedDateFormatted;
}
if (data.receivedDateFormatted) {
    document.getElementById('receivedDateFormatted').value = data.receivedDateFormatted;
}
```

#### b. printPR Function
- Mengupdate untuk menggunakan approval dates dari hidden fields
- Menambahkan fallback ke current date jika data API tidak tersedia
- Menambahkan logging untuk debugging

```javascript
// Get approval dates from hidden fields (from API) - IMPROVED
const preparedDateFormatted = document.getElementById('preparedDateFormatted').value;
const checkedDateFormatted = document.getElementById('checkedDateFormatted').value;
const acknowledgedDateFormatted = document.getElementById('acknowledgedDateFormatted').value;
const approvedDateFormatted = document.getElementById('approvedDateFormatted').value;
const receivedDateFormatted = document.getElementById('receivedDateFormatted').value;

// Set approval dates from API or use current date as fallback - IMPROVED
params.append('preparedDateFormatted', preparedDateFormatted || currentDate);
params.append('checkedDateFormatted', checkedDateFormatted || currentDate);
params.append('acknowledgedDateFormatted', acknowledgedDateFormatted || currentDate);
params.append('approvedDateFormatted', approvedDateFormatted || currentDate);
params.append('receivedDate', receivedDateFormatted || currentDate);
```

### 3. printPR.html (Receive)
**Lokasi:** `approvalPages/approval/receive/purchaseRequest/printPR.html`

**Perubahan:**
- Mengupdate script untuk menggunakan approval dates dari URL parameters
- Menambahkan logging untuk debugging
- Memperbaiki parameter name untuk receivedDate

```javascript
// Set approval dates from URL parameters - IMPROVED
document.getElementById('preparedDate').textContent = urlParams.get('preparedDateFormatted') || '';
document.getElementById('checkedDate').textContent = urlParams.get('checkedDateFormatted') || '';
document.getElementById('acknowledgedDate').textContent = urlParams.get('acknowledgedDateFormatted') || '';
document.getElementById('approvedDate').textContent = urlParams.get('approvedDateFormatted') || '';
document.getElementById('receivedDate').textContent = urlParams.get('receivedDate') || '';
```

## Keuntungan Implementasi

1. **Konsistensi Data**: Halaman receive sekarang menggunakan approval dates yang sama dengan halaman approve
2. **Akurasi Timestamp**: Menggunakan timestamp asli dari API, bukan current date
3. **Fallback Aman**: Tetap menggunakan current date jika data API tidak tersedia
4. **Hidden UI**: Approval dates tidak ditampilkan di UI, hanya digunakan untuk print
5. **Debugging**: Menambahkan console.log untuk memudahkan troubleshooting

## Testing

### Test Case 1: API dengan Approval Dates
1. Buka halaman receive PR
2. Pastikan API response menyertakan approval dates
3. Klik tombol Print
4. Verifikasi bahwa approval dates di print page sesuai dengan data API

### Test Case 2: API tanpa Approval Dates
1. Buka halaman receive PR
2. Pastikan API response tidak menyertakan approval dates
3. Klik tombol Print
4. Verifikasi bahwa approval dates menggunakan current date sebagai fallback

### Test Case 3: Console Logging
1. Buka Developer Tools
2. Buka halaman receive PR
3. Klik tombol Print
4. Verifikasi console.log menampilkan approval dates yang benar

## Troubleshooting

### Jika approval dates tidak muncul:
1. Periksa API response apakah menyertakan field approval dates
2. Periksa console.log untuk melihat data yang diterima
3. Pastikan hidden fields terisi dengan benar
4. Periksa URL parameters yang dikirim ke print page

### Jika print page tidak menampilkan approval dates:
1. Periksa URL parameters yang diterima di print page
2. Periksa console.log di print page
3. Pastikan parameter names sesuai antara receivePR.js dan printPR.html 