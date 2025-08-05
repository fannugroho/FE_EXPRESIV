# Fitur Wrap Text untuk Tabel AR Invoice

## Deskripsi
Fitur ini menambahkan kemampuan wrap text otomatis pada kolom-kolom tabel yang memiliki karakter lebih dari 15 karakter. Fitur ini diterapkan pada halaman `addINVItem.html`.

## Kolom yang Mendukung Wrap Text
- **Item Code** - Kolom kode item
- **Item Name** - Kolom nama item (description)
- **Catatan** - Kolom catatan/free text
- **Sales Qty** - Kolom quantity penjualan
- **Inv. Qty** - Kolom quantity inventory
- **Sales Price** - Kolom harga penjualan
- **Price** - Kolom harga
- **Total Price** - Kolom total harga

## Cara Kerja

### 1. Deteksi Panjang Karakter
- Sistem akan mendeteksi panjang karakter pada setiap input/textarea
- Jika karakter > 15: menerapkan mode wrap text
- Jika karakter ≤ 15: menggunakan mode no-wrap dengan ellipsis

### 2. Styling CSS
```css
.wrap-text {
    white-space: normal !important;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    min-height: 40px;
    max-height: 80px;
    overflow-y: auto;
}

.no-wrap {
    white-space: nowrap !important;
    overflow: hidden;
    text-overflow: ellipsis;
}
```

### 3. Auto-resize Height
- Untuk textarea dengan konten panjang, tinggi akan otomatis menyesuaikan
- Minimum height: 40px
- Maximum height: 80px
- Jika melebihi max height, akan muncul scrollbar vertikal

## Implementasi JavaScript

### Fungsi Utama
1. `handleTextWrapping(element)` - Mengatur wrap text berdasarkan panjang karakter
2. `applyTextWrappingToAll()` - Menerapkan wrap text ke semua elemen
3. `setupTextWrapping()` - Setup event listeners untuk perubahan dinamis
4. `refreshTextWrapping()` - Refresh wrap text setelah perubahan konten

### Event Listeners
- `input` - Trigger saat user mengetik
- `blur` - Trigger saat user selesai mengedit
- `DOMContentLoaded` - Trigger saat halaman dimuat

### Integrasi dengan Fungsi Existing
- `addRow()` - Wrap text diterapkan pada row baru
- `selectItem()` - Wrap text diterapkan setelah item dipilih
- `initializePage()` - Wrap text diterapkan saat inisialisasi

## Keuntungan
1. **User Experience** - Teks panjang tidak terpotong
2. **Responsive** - Tabel tetap rapi meski ada konten panjang
3. **Otomatis** - Tidak perlu manual setting
4. **Performance** - Hanya diterapkan saat diperlukan

## Kompatibilitas
- Bekerja dengan semua browser modern
- Mendukung dynamic content (row baru, item selection)
- Tidak mengganggu fungsi existing

## Troubleshooting
Jika wrap text tidak berfungsi:
1. Pastikan JavaScript di-load dengan benar
2. Periksa console untuk error
3. Pastikan CSS classes diterapkan dengan benar
4. Refresh halaman jika diperlukan 