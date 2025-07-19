# Total LC Search Fix

## Masalah
Pencarian berdasarkan "Total LC" pada dropdown search tidak berfungsi dengan benar karena:

1. **Inkonsistensi field names**: Data dari API menggunakan berbagai nama field untuk Total LC:
   - `trsfrSum`
   - `totalLC` 
   - `docTotal`
   - `totalAmount`

2. **Logika pencarian yang tidak konsisten**: Kode sebelumnya menggunakan conditional chaining yang tidak menangani semua kemungkinan field names.

## Solusi yang Diterapkan

### 1. Perbaikan Logika Pencarian
```javascript
// Sebelum (tidak konsisten)
const totalLC = doc.trsfrSum ? doc.trsfrSum.toString() : 
               (doc.totalLC ? doc.totalLC.toString() : 
               (doc.docTotal ? doc.docTotal.toString() : ''));

// Sesudah (konsisten)
const totalLCValue = doc.trsfrSum || doc.totalLC || doc.docTotal || doc.totalAmount || 0;
const totalLCString = totalLCValue.toString().toLowerCase();
return totalLCString.includes(searchTerm.toLowerCase());
```

### 2. Perbaikan Display Data
```javascript
// Sebelum
const totalLCValue = doc.trsfrSum ? doc.trsfrSum.toLocaleString() : 
                    (doc.totalLC ? doc.totalLC.toLocaleString() : 
                    (doc.docTotal ? doc.docTotal.toLocaleString() : '-'));

// Sesudah
const totalLCValue = (doc.trsfrSum || doc.totalLC || doc.docTotal || doc.totalAmount || 0).toLocaleString();
```

### 3. Perbaikan Export Functions
- Excel export: Menggunakan logika yang sama untuk konsistensi
- PDF export: Menggunakan logika yang sama untuk konsistensi

### 4. Debugging
Menambahkan console.log untuk membantu debugging:
```javascript
console.log('Total LC Search:', {
    searchTerm: searchTerm,
    totalLCValue: totalLCValue,
    totalLCString: totalLCString,
    includes: totalLCString.includes(searchTerm.toLowerCase())
});
```

## File yang Diperbaiki
- `js/menuOPReim.js`: Perbaikan logika pencarian dan display
- `test-total-lc.html`: File testing untuk memverifikasi fungsi

## Cara Testing
1. Buka `test-total-lc.html` di browser
2. Masukkan angka yang ingin dicari (misal: "1500000")
3. Klik "Test Search"
4. Periksa console untuk melihat detail pencarian

## Field Names yang Didukung
- `trsfrSum` (prioritas tertinggi)
- `totalLC`
- `docTotal` 
- `totalAmount`
- Default: 0 (jika semua field null/undefined)

## Catatan
- Pencarian bersifat case-insensitive
- Menggunakan `includes()` untuk partial matching
- Fallback ke 0 jika semua field null/undefined
- Format angka menggunakan `toLocaleString()` untuk display 