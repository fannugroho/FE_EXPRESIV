# Currency Search Usage Guide

## Cara Menggunakan Currency Search

### 1. Buka Form Outgoing Payment Reimbursement

- Buka file `addPages/addOPReim.html`
- Atau gunakan file test `test_currency_simple.html` untuk testing

### 2. Cara Menggunakan Currency Search

#### A. Klik Field Currency

- Klik pada field "Currency" di tabel
- Dropdown akan muncul dengan semua currency yang tersedia
- Anda akan melihat daftar currency dengan format:
  ```
  IDR
  Indonesian Rupiah
  Symbol: Rp
  ```

#### B. Type Search

- Ketik minimal 2 karakter untuk mencari currency
- Contoh pencarian:
  - Ketik "indon" → akan muncul "IDR - Indonesian Rupiah"
  - Ketik "usd" → akan muncul "USD - US Dollar"
  - Ketik "eur" → akan muncul "EUR - Euro"
  - Ketik "jpy" → akan muncul "JPY - Japanese Yen"

#### C. Pilih Currency

- Klik pada currency yang diinginkan dari dropdown
- Currency code (misal "IDR") akan otomatis terisi di field
- Dropdown akan tertutup otomatis
- Field akan memberikan visual feedback (background biru sebentar)

### 3. Fitur yang Tersedia

#### A. API Integration (Production)

Currency data diambil dari API endpoint:

- **Endpoint**: `/api/MasterCurrency/search`
- **Method**: GET
- **Parameters**: `searchTerm` (optional)
- **Response Format**: JSON dengan struktur:
  ```json
  {
    "success": true,
    "message": "Search completed. Found X currencies matching 'term'",
    "searchTerm": "term",
    "data": [
      {
        "id": "uuid",
        "code": "IDR",
        "name": "Indonesian Rupiah",
        "symbol": "Rp",
        "description": "Official currency of Indonesia"
      }
    ]
  }
  ```

#### B. Available Currencies (from API)

Currency yang tersedia dari database:

- **IDR** - Indonesian Rupiah (Rp) - Official currency of Indonesia
- **USD** - US Dollar ($) - Official currency of the United States
- **EUR** - Euro (€) - Official currency of the European Union
- **SGD** - Singapore Dollar (S$) - Official currency of Singapore
- **JPY** - Japanese Yen (¥) - Official currency of Japan

#### B. Search Behavior

- **Case Insensitive**: "indon", "INDON", "Indon" semua akan menemukan "IDR"
- **Partial Match**: "indon" akan menemukan "Indonesian Rupiah"
- **Code Match**: "idr" akan menemukan "IDR"
- **Real-time**: Hasil pencarian muncul saat mengetik

#### C. UI Features

- **Hover Effect**: Background berubah saat mouse di atas item
- **Visual Feedback**: Field berubah warna saat currency dipilih
- **Auto-close**: Dropdown tertutup otomatis setelah selection
- **Click Outside**: Dropdown tertutup saat klik di luar

### 4. Testing

#### A. File Test Sederhana

Gunakan `test_currency_simple.html` untuk testing:

1. Buka file di browser
2. Klik field currency
3. Lihat semua currency muncul
4. Ketik untuk search
5. Klik untuk select
6. Lihat hasil di field "Selected Currency"

#### B. Test Scenarios

- ✅ Klik field → dropdown muncul
- ✅ Ketik "indon" → IDR muncul
- ✅ Ketik "usd" → USD muncul
- ✅ Klik currency → terisi otomatis
- ✅ Click outside → dropdown tertutup

### 5. Troubleshooting

#### A. Jika Dropdown Tidak Muncul

1. Pastikan field currency memiliki class `currency-search-input`
2. Pastikan ada div dengan class `currency-dropdown`
3. Cek console browser untuk error

#### B. Jika Search Tidak Berfungsi

1. Pastikan API endpoint `/api/MasterCurrency/search` tersedia
2. Cek apakah backend server berjalan di `http://localhost:5249`
3. Cek console untuk error JavaScript atau network error
4. Pastikan authentication token valid (jika diperlukan)

#### C. Jika Selection Tidak Berfungsi

1. Pastikan event handler `onclick` terpasang
2. Cek apakah dropdown ID sesuai
3. Cek console untuk error

### 6. Integrasi dengan API

#### A. Production Ready

- ✅ Menggunakan API endpoint `/api/MasterCurrency/search`
- ✅ Mendukung search dengan parameter `searchTerm`
- ✅ Response format sesuai dengan API specification
- ✅ Error handling untuk network issues
- ✅ Fallback ke mock data jika API tidak tersedia (untuk testing)

#### B. API Endpoint Details

- **URL**: `http://localhost:5249/api/MasterCurrency/search`
- **Method**: GET
- **Authentication**: Menggunakan `makeAuthenticatedRequest`
- **Parameters**:
  - `searchTerm` (optional): String untuk mencari currency
- **Response**: JSON dengan format yang sudah ditentukan

### 7. Customization

#### A. Menambah Currency

Currency ditambahkan melalui database backend:

1. Tambahkan data currency baru di database
2. API akan otomatis menyediakan currency baru tersebut
3. Tidak perlu mengubah kode frontend

#### B. Testing dengan Mock Data

Untuk testing tanpa backend, edit array `mockCurrencies` di `getMockCurrencyData()`:

```javascript
const mockCurrencies = [
  {
    id: "uuid",
    code: "IDR",
    name: "Indonesian Rupiah",
    symbol: "Rp",
    description: "...",
  },
  {
    id: "uuid",
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    description: "...",
  },
  // Tambah currency baru di sini
  {
    id: "uuid",
    code: "MYR",
    name: "Malaysian Ringgit",
    symbol: "RM",
    description: "...",
  },
];
```

#### B. Mengubah Styling

Edit CSS di file HTML:

```css
.currency-dropdown {
  /* Ubah styling dropdown */
}
.currency-search-input {
  /* Ubah styling input */
}
```

### 8. Browser Support

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ❌ Internet Explorer (tidak support ES6+)

### 9. Performance Tips

- Mock data sudah dioptimasi untuk kecepatan
- Search menggunakan filter JavaScript native
- Tidak ada delay atau lag
- Responsive untuk semua ukuran layar

### 10. Next Steps

1. ✅ **Test dengan file sederhana** - `test_currency_simple.html`
2. ✅ **Pastikan UI berfungsi** - Currency search sudah berfungsi
3. ✅ **Integrasikan dengan API** - Menggunakan `/api/MasterCurrency/search`
4. ✅ **Customize styling** - Dropdown styling sudah dioptimasi
5. **Deploy ke production** - Siap untuk production use

### 11. Production Checklist

- ✅ API endpoint tersedia dan berfungsi
- ✅ Authentication menggunakan `makeAuthenticatedRequest`
- ✅ Error handling untuk network issues
- ✅ UI responsive dan user-friendly
- ✅ Search functionality real-time
- ✅ Data format sesuai API specification

---

**Note**: Fitur ini sudah diimplementasikan dengan API integration yang sebenarnya. Menggunakan endpoint `/api/MasterCurrency/search` dengan proper error handling dan fallback ke mock data untuk testing.
