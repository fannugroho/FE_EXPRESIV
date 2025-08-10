# Demo Fitur Wrap Text

## Cara Testing Fitur

### 1. Testing dengan Item Code Pendek
```
Input: "ABC123"
Hasil: No-wrap mode, text tetap dalam satu baris
```

### 2. Testing dengan Item Code Panjang
```
Input: "VERY_LONG_ITEM_CODE_THAT_EXCEEDS_15_CHARACTERS"
Hasil: Wrap text mode, text akan wrap ke baris berikutnya
```

### 3. Testing dengan Item Name Pendek
```
Input: "Paint Red"
Hasil: No-wrap mode
```

### 4. Testing dengan Item Name Panjang
```
Input: "Premium Quality Red Paint for Interior Walls with Special Formula"
Hasil: Wrap text mode dengan auto-resize height
```

### 5. Testing dengan Quantity
```
Input: "123456789012345" (15+ karakter)
Hasil: Wrap text mode
```

### 6. Testing dengan Price
```
Input: "999999999999999" (15+ karakter)
Hasil: Wrap text mode
```

## Skenario Testing

### Skenario 1: Menambah Row Baru
1. Klik tombol "+" untuk menambah row
2. Masukkan data dengan karakter > 15
3. Verifikasi wrap text diterapkan otomatis

### Skenario 2: Memilih Item dari Dropdown
1. Ketik kode item di kolom Item Code
2. Pilih item dari dropdown
3. Verifikasi wrap text diterapkan pada Item Name

### Skenario 3: Edit Manual
1. Klik pada kolom yang sudah ada data
2. Edit menjadi karakter > 15
3. Verifikasi wrap text diterapkan saat mengetik

### Skenario 4: Delete Row
1. Hapus row yang memiliki wrap text
2. Verifikasi row lain tidak terpengaruh

## Expected Behavior

### Untuk Karakter ≤ 15:
- `white-space: nowrap`
- `overflow: hidden`
- `text-overflow: ellipsis`
- Height tetap 40px

### Untuk Karakter > 15:
- `white-space: normal`
- `word-wrap: break-word`
- `overflow-wrap: break-word`
- Height auto-adjust (40px - 80px)
- Scrollbar jika melebihi 80px

## Visual Indicators

### Mode No-wrap:
```
┌─────────────────┐
│ ABC123          │
└─────────────────┘
```

### Mode Wrap-text:
```
┌─────────────────┐
│ VERY_LONG_ITEM_ │
│ CODE_THAT_EXCE  │
│ EDS_15_CHARACTE │
│ RS              │
└─────────────────┘
```

## Performance Notes
- Wrap text hanya diterapkan saat diperlukan
- Tidak ada lag saat mengetik
- Smooth transition antara mode
- Memory efficient untuk tabel besar 