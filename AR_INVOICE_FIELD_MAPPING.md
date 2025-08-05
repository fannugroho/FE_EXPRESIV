# AR Invoice Field Mapping Documentation

## Overview
Dokumentasi ini menjelaskan mapping field yang benar untuk AR Invoice, khususnya untuk field-field yang sering mengalami inkonsistensi.

## Field Mapping yang Benar

### Header Fields

| **Form Label** | **Element ID** | **API Field** | **Tipe Data** | **Contoh Value** | **Keterangan** |
|----------------|----------------|----------------|----------------|-------------------|----------------|
| Tax Identification Number (NPWP) | `TaxNo` | `licTradNum` | String | "12.345.678.9-123.000" | **PENTING**: Gunakan `licTradNum`, bukan `taxNo` atau `trackNo` |
| Shipping Type | `U_BSI_ShippingType` | `u_BSI_ShippingType` | String | "Regular", "Express" | Mapping sudah benar |
| Payment Terms | `U_BSI_PaymentGroup` | `u_BSI_PaymentGroup` | String | "Net 30", "Cash" | Mapping sudah benar |

### Implementasi JavaScript

```javascript
// Mapping yang BENAR untuk AR Invoice
safeSetValue('TaxNo', data.licTradNum || '');
safeSetValue('U_BSI_ShippingType', data.u_BSI_ShippingType || '');
safeSetValue('U_BSI_PaymentGroup', data.u_BSI_PaymentGroup || '');
```

## File yang Sudah Diperbaiki

Berikut adalah file-file yang telah diperbaiki untuk menggunakan mapping yang benar:

### Detail Pages
- ✅ `js/detailInvItem.js` - Sudah benar
- ✅ `js/detailInvService.js` - Diperbaiki

### Approval Pages
- ✅ `approvalPages/approval/acknowledge/InvoiceItem/acknowInvItem.js` - Diperbaiki
- ✅ `approvalPages/approval/acknowledge/InvoiceService/acknowInvService.js` - Diperbaiki
- ✅ `approvalPages/approval/check/invoiceItem/checkInvItem.js` - Diperbaiki
- ✅ `approvalPages/approval/check/invoiceServices/checkInvService.js` - Diperbaiki
- ✅ `approvalPages/approval/approve/invoiceItem/approveInvItem.js` - Diperbaiki
- ✅ `approvalPages/approval/approve/invoiceService/approveInvService.js` - Diperbaiki
- ✅ `approvalPages/approval/receive/invoiceItem/receiveInvItem.js` - Diperbaiki

## Perubahan yang Dilakukan

### Sebelum (SALAH)
```javascript
// Beberapa file menggunakan mapping yang salah
safeSetValue('TaxNo', data.taxNo || '');           // ❌ SALAH
safeSetValue('TaxNo', data.trackNo || '');         // ❌ SALAH
```

### Sesudah (BENAR)
```javascript
// Semua file sekarang menggunakan mapping yang benar
safeSetValue('TaxNo', data.licTradNum || '');      // ✅ BENAR
safeSetValue('U_BSI_ShippingType', data.u_BSI_ShippingType || '');  // ✅ BENAR
safeSetValue('U_BSI_PaymentGroup', data.u_BSI_PaymentGroup || '');  // ✅ BENAR
```

## Validasi Mapping

Untuk memastikan mapping yang benar, gunakan pola berikut:

```javascript
// Fungsi helper untuk validasi mapping
function validateFieldMapping(data) {
    const mappings = {
        'TaxNo': data.licTradNum,
        'U_BSI_ShippingType': data.u_BSI_ShippingType,
        'U_BSI_PaymentGroup': data.u_BSI_PaymentGroup
    };
    
    console.log('Field Mapping Validation:', mappings);
    return mappings;
}
```

## Catatan Penting

1. **TaxNo** harus menggunakan field `licTradNum` dari API, bukan `taxNo` atau `trackNo`
2. **Shipping Type** dan **Payment Terms** sudah menggunakan mapping yang benar
3. Semua file approval dan detail pages sekarang konsisten menggunakan mapping yang sama
4. Mapping ini berlaku untuk semua tipe AR Invoice (Item dan Service)

## Testing

Untuk memastikan mapping berfungsi dengan benar:

1. Load AR Invoice data dari API
2. Periksa console log untuk memastikan field ter-populate dengan benar
3. Verifikasi bahwa TaxNo menampilkan NPWP yang benar
4. Verifikasi bahwa Shipping Type dan Payment Terms menampilkan data yang sesuai

## Troubleshooting

Jika field tidak ter-populate dengan benar:

1. Periksa response API untuk memastikan field `licTradNum` ada
2. Periksa console log untuk error JavaScript
3. Pastikan element ID di HTML sesuai dengan yang digunakan di JavaScript
4. Verifikasi bahwa data API tidak null atau undefined 