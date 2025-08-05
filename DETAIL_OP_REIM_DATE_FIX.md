# Detail OP Reim Document Date Fix

## **Perubahan yang Diterapkan**

Saya telah menerapkan logika yang benar untuk menampilkan Document Date dari `receivedDate` yang berasal dari **API approval reimbursement**, bukan dari API outgoing payment.

### **1. Update Fungsi `handleReimbursementData()` di `detailOPReim.js`**

**Logika Baru:**

```javascript
// Update Document Date from reimbursement receivedDate
if (reimResult.data.receivedDate) {
  console.log(
    "📅 Reimbursement receivedDate found:",
    reimResult.data.receivedDate
  );
  const formattedDate = new Date(reimResult.data.receivedDate)
    .toISOString()
    .split("T")[0];
  setElementValue("DocDate", formattedDate);
  console.log(
    "✅ DocDate updated from reimbursement receivedDate:",
    formattedDate
  );
} else if (reimResult.data.docDate) {
  console.log("📅 Reimbursement docDate found:", reimResult.data.docDate);
  const formattedDate = new Date(reimResult.data.docDate)
    .toISOString()
    .split("T")[0];
  setElementValue("DocDate", formattedDate);
  console.log("✅ DocDate updated from reimbursement docDate:", formattedDate);
}
```

### **2. Update Fungsi `mapDateFields()` di `detailOPReim.js`**

**Logika Prioritas:**

```javascript
// Document Date will be set from reimbursement API in handleReimbursementData()
// Only set DocDate here if no reimbursement data is available
const currentDocDate = document.getElementById("DocDate")?.value;
if (!currentDocDate) {
  // Set from outgoing payment API as fallback
  if (data.docDate) {
    // Set from outgoing payment docDate
  } else if (data.receivedDate) {
    // Set from outgoing payment receivedDate
  }
} else {
  console.log("📅 DocDate already set from reimbursement API:", currentDocDate);
}
```

## **Sumber Data yang Benar**

### **API yang Digunakan:**

1. **API Outgoing Payment:** `/api/staging-outgoing-payments/headers/{id}`

   - Menyediakan data outgoing payment
   - **TIDAK** digunakan untuk Document Date

2. **API Reimbursement:** `/api/reimbursements/{expressivNo}`
   - Menyediakan data reimbursement approval
   - **DIGUNAKAN** untuk Document Date dari `receivedDate`

### **Flow Data:**

```
1. Load Outgoing Payment Data
   ↓
2. Extract expressivNo from outgoing payment
   ↓
3. Call Reimbursement API with expressivNo
   ↓
4. Get receivedDate from reimbursement approval
   ↓
5. Set Document Date = receivedDate
```

## **Logika Document Date yang Benar**

### **Prioritas Field untuk Document Date:**

1. **`reimbursement.receivedDate`** - Tanggal approval received dari API reimbursement (prioritas utama)
2. **`reimbursement.docDate`** - Tanggal dokumen dari API reimbursement (fallback)
3. **`outgoingPayment.docDate`** - Tanggal dokumen dari API outgoing payment (fallback terakhir)
4. **`outgoingPayment.receivedDate`** - Tanggal approval dari API outgoing payment (fallback terakhir)

### **Contoh Data API:**

**API Reimbursement Response:**

```javascript
{
    "data": {
        "receivedDate": "2025-07-30T10:40:36.635",  // ✅ Prioritas utama
        "docDate": "2025-07-25T00:00:00",           // 🔄 Fallback
        "voucherNo": "REIM/025/0725"
    }
}
```

**API Outgoing Payment Response:**

```javascript
{
    "docDate": "2025-07-25T00:00:00",               // 🔄 Fallback terakhir
    "receivedDate": "2025-07-30T10:40:36.635",      // ❌ Tidak digunakan
    "expressivNo": "6832b7ed-e24d-4e82-bf13-f6ac84f8d919"
}
```

### **Hasil yang Diharapkan:**

- **Document Date akan menampilkan:** `2025-07-30` (dari `reimbursement.receivedDate`)

## **Console Log yang Akan Muncul**

### **Saat Load Document:**

```javascript
📋 Reimbursement API Response: {data: {receivedDate: "2025-07-30T10:40:36.635", ...}}

📅 Reimbursement receivedDate found: 2025-07-30T10:40:36.635
✅ DocDate updated from reimbursement receivedDate: 2025-07-30

📅 Date Fields Mapping (Outgoing Payment API):
- data.docDate: 2025-07-25T00:00:00
- data.receivedDate: 2025-07-30T10:40:36.635
- data.submissionDate: undefined
📅 DocDate already set from reimbursement API: 2025-07-30
```

## **Perbedaan dengan Sebelumnya**

### **Sebelum (Salah):**

- Document Date diambil dari API outgoing payment
- `receivedDate` dari outgoing payment digunakan
- Tidak memanggil API reimbursement untuk date

### **Sekarang (Benar):**

- Document Date diambil dari API reimbursement
- `receivedDate` dari reimbursement approval digunakan
- API reimbursement dipanggil untuk mendapatkan date yang benar

## **Testing**

### **Cara Test:**

1. **Buka halaman `detailOPReim.html`**
2. **Load existing document** dengan ID yang valid
3. **Buka Developer Tools** (`F12`)
4. **Pilih tab Console**
5. **Cari output debug** dengan format di atas

### **Expected Result:**

- **Document Date field** akan menampilkan tanggal dari `reimbursement.receivedDate`
- **Console log** akan menunjukkan data dari API reimbursement
- **Prioritas field** akan bekerja sesuai logika yang benar

## **Konsistensi dengan addOPReim.js**

Sekarang kedua file menggunakan logika yang konsisten:

- **addOPReim.js:** Document Date dari `docDate` (outgoing payment)
- **detailOPReim.js:** Document Date dari `receivedDate` (reimbursement approval)
- **Console debug** untuk troubleshooting
- **Format tanggal:** `YYYY-MM-DD`

## **Catatan Penting**

1. **Sumber data yang benar:** `receivedDate` dari API reimbursement approval
2. **Console debug** membantu troubleshooting
3. **Fallback mechanism** memastikan data selalu ditampilkan
4. **Format tanggal** sesuai standar HTML date input
5. **Read-only field** di detail page (tidak bisa diubah)
6. **Prioritas API:** Reimbursement API > Outgoing Payment API

Sekarang Document Date di `detailOPReim.html` akan menampilkan data yang benar dari API reimbursement approval!
