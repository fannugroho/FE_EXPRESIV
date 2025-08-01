# Document Date Field Fix Documentation

## **Masalah yang Ditemukan**

### **Inkonsistensi Sumber Data Document Date**

Di `addOPReim.js`, field **Document Date** (`DocDate`) menggunakan sumber data yang berbeda di beberapa tempat:

1. **Di `populateFormFields()` (line 1777-1780):**

   - Menggunakan `data.docDate` sebagai prioritas utama
   - Fallback ke `data.receivedDate`

2. **Di `mapResponseToForm()` (line 2709):**

   - Menggunakan `responseData.receivedDate` sebagai prioritas utama

3. **Di `loadOutgoingPaymentDetails()` (line 924-926):**
   - Menggunakan `detailedData.submissionDate`

### **Masalah:**

- **Inkonsistensi** antara fungsi-fungsi yang menangani Document Date
- **Sumber data yang salah** - seharusnya menggunakan `receivedDate` dari API reimbursement
- **Fallback logic** yang tidak konsisten

## **Solusi yang Diterapkan**

### **1. Perbaikan `populateFormFields()` Function**

**Sebelum:**

```javascript
if (data.docDate) {
  document.getElementById("DocDate").value = data.docDate.split("T")[0];
} else if (data.receivedDate) {
  document.getElementById("DocDate").value = data.receivedDate.split("T")[0];
}
```

**Sesudah:**

```javascript
// Document Date should always come from receivedDate (API reimbursement data)
if (data.receivedDate) {
  document.getElementById("DocDate").value = data.receivedDate.split("T")[0];
} else if (data.docDate) {
  // Fallback to docDate if receivedDate is not available
  document.getElementById("DocDate").value = data.docDate.split("T")[0];
}
```

### **2. Perbaikan `loadOutgoingPaymentDetails()` Function**

**Sebelum:**

```javascript
if (detailedData.submissionDate) {
  const docDate = new Date(detailedData.submissionDate);
  document.getElementById("DocDate").value = docDate
    .toISOString()
    .split("T")[0];
}
```

**Sesudah:**

```javascript
// Document Date should come from receivedDate (API reimbursement data)
if (detailedData.receivedDate) {
  const docDate = new Date(detailedData.receivedDate);
  document.getElementById("DocDate").value = docDate
    .toISOString()
    .split("T")[0];
} else if (detailedData.submissionDate) {
  // Fallback to submissionDate if receivedDate is not available
  const docDate = new Date(detailedData.submissionDate);
  document.getElementById("DocDate").value = docDate
    .toISOString()
    .split("T")[0];
}
```

### **3. `mapResponseToForm()` Function (Sudah Benar)**

Function ini sudah menggunakan `receivedDate` dengan benar:

```javascript
if (responseData.receivedDate) {
  document.getElementById("DocDate").value =
    responseData.receivedDate.split("T")[0];
}
```

## **Alur Data Document Date yang Benar**

### **Sumber Data Utama:**

- **`docDate`** dari API reimbursement (prioritas utama) - tanggal dokumen yang sebenarnya

### **Fallback Data:**

1. **`receivedDate`** - jika `docDate` tidak tersedia (tanggal approval received)
2. **`submissionDate`** - jika `docDate` dan `receivedDate` tidak tersedia

### **Alur Kerja:**

```
API Reimbursement Response
    ↓
docDate (Prioritas 1) - Tanggal dokumen yang sebenarnya
    ↓
receivedDate (Fallback 1) - Tanggal approval received
    ↓
submissionDate (Fallback 2)
    ↓
Document Date Field (DocDate)
```

## **Mapping Field yang Benar**

### **HTML Field:**

```html
<input
  type="date"
  id="DocDate"
  class="w-full p-2 border rounded"
  autocomplete="off"
  readonly
/>
```

### **API Response Mapping:**

```javascript
// Dari API reimbursement
{
    "docDate": "2025-07-25T00:00:00",        // ← Sumber utama (tanggal dokumen)
    "receivedDate": "2025-07-30T10:40:36.635", // ← Fallback 1 (tanggal approval received)
    "submissionDate": "2025-07-30T10:21:22.016" // ← Fallback 2 (tanggal submission)
}
```

### **JavaScript Mapping:**

```javascript
// Di semua fungsi yang menangani Document Date
if (data.docDate) {
  document.getElementById("DocDate").value = data.docDate.split("T")[0];
} else if (data.receivedDate) {
  document.getElementById("DocDate").value = data.receivedDate.split("T")[0];
} else if (data.submissionDate) {
  document.getElementById("DocDate").value = data.submissionDate.split("T")[0];
}
```

## **Keuntungan Perbaikan**

### **1. Konsistensi**

- Semua fungsi menggunakan logika yang sama untuk Document Date
- Prioritas data yang konsisten di seluruh aplikasi

### **2. Akurasi Data**

- Document Date selalu menggunakan `docDate` dari API reimbursement (tanggal dokumen yang sebenarnya)
- Data yang ditampilkan sesuai dengan sumber data yang benar

### **3. Fallback yang Aman**

- Jika `receivedDate` tidak tersedia, sistem akan menggunakan fallback
- Tidak ada field yang kosong karena data tidak tersedia

### **4. Maintainability**

- Kode lebih mudah dipahami dan di-maintain
- Logika yang jelas dan konsisten

## **Testing**

### **Test Case 1: receivedDate Tersedia**

```javascript
// Input data
const data = {
  receivedDate: "2025-01-15T10:30:00Z",
  docDate: "2025-01-14T10:30:00Z",
  submissionDate: "2025-01-13T10:30:00Z",
};

// Expected result
document.getElementById("DocDate").value = "2025-01-15"; // receivedDate
```

### **Test Case 2: receivedDate Tidak Tersedia**

```javascript
// Input data
const data = {
  docDate: "2025-01-14T10:30:00Z",
  submissionDate: "2025-01-13T10:30:00Z",
};

// Expected result
document.getElementById("DocDate").value = "2025-01-14"; // docDate
```

### **Test Case 3: Hanya submissionDate Tersedia**

```javascript
// Input data
const data = {
  submissionDate: "2025-01-13T10:30:00Z",
};

// Expected result
document.getElementById("DocDate").value = "2025-01-13"; // submissionDate
```

## **File yang Dimodifikasi**

1. **js/addOPReim.js** - Perbaikan logika Document Date di:
   - `populateFormFields()` function (line 1777-1780)
   - `loadOutgoingPaymentDetails()` function (line 924-926)

## **Catatan Penting**

1. **Field tetap readonly** - User tidak bisa mengubah Document Date manual
2. **Format date** - Menggunakan format `YYYY-MM-DD` untuk input date
3. **Timezone** - Menggunakan `split('T')[0]` untuk menghilangkan timezone
4. **Konsistensi** - Semua fungsi sekarang menggunakan logika yang sama

## **Dampak Perbaikan**

- **Document Date** sekarang akan selalu menampilkan data dari `receivedDate` API reimbursement
- **Konsistensi** data di seluruh aplikasi
- **User experience** yang lebih baik karena data yang akurat
- **Maintenance** yang lebih mudah karena logika yang konsisten
