# Received Date Debug Console Log

## **Console Log yang Ditambahkan**

Saya telah menambahkan console log khusus untuk debugging `receivedDate` di beberapa fungsi utama di `addOPReim.js`:

### **1. Di `loadOutgoingPaymentDetails()` Function (Line 892-900)**

```javascript
// Debug log untuk receivedDate
console.log("=== RECEIVED DATE DEBUG ===");
console.log("receivedDate:", detailedData.receivedDate);
console.log("receivedDate type:", typeof detailedData.receivedDate);
console.log("docDate:", detailedData.docDate);
console.log("docDate type:", typeof detailedData.docDate);
console.log("submissionDate:", detailedData.submissionDate);
console.log("submissionDate type:", typeof detailedData.submissionDate);
console.log("=== END RECEIVED DATE DEBUG ===");
```

### **2. Di `populateFormFields()` Function (Line 1785-1793)**

```javascript
console.log("populateFormFields called with data:", data);

// Debug log untuk receivedDate di populateFormFields
console.log("=== POPULATE FORM FIELDS - DATE DEBUG ===");
console.log("data.receivedDate:", data.receivedDate);
console.log("data.receivedDate type:", typeof data.receivedDate);
console.log("data.docDate:", data.docDate);
console.log("data.docDate type:", typeof data.docDate);
console.log("data.submissionDate:", data.submissionDate);
console.log("data.submissionDate type:", typeof data.submissionDate);
console.log("=== END POPULATE FORM FIELDS - DATE DEBUG ===");
```

### **3. Di `mapResponseToForm()` Function (Line 2722-2730)**

```javascript
console.log("mapResponseToForm called with responseData:", responseData);

// Debug log untuk receivedDate di mapResponseToForm
console.log("=== MAP RESPONSE TO FORM - DATE DEBUG ===");
console.log("responseData.receivedDate:", responseData.receivedDate);
console.log(
  "responseData.receivedDate type:",
  typeof responseData.receivedDate
);
console.log("responseData.docDate:", responseData.docDate);
console.log("responseData.docDate type:", typeof responseData.docDate);
console.log("responseData.submissionDate:", responseData.submissionDate);
console.log(
  "responseData.submissionDate type:",
  typeof responseData.submissionDate
);
console.log("=== END MAP RESPONSE TO FORM - DATE DEBUG ===");
```

## **Cara Melihat Console Log**

### **1. Buka Developer Tools**

- **Chrome/Edge:** `F12` atau `Ctrl+Shift+I`
- **Firefox:** `F12` atau `Ctrl+Shift+I`
- **Safari:** `Cmd+Option+I`

### **2. Pilih Tab Console**

- Klik tab **"Console"** di Developer Tools

### **3. Load Halaman addOPReim**

- Buka halaman `addOPReim.html`
- Atau load data existing document

### **4. Cari Output Debug**

Cari output dengan format:

```
=== RECEIVED DATE DEBUG ===
receivedDate: 2025-07-30T10:40:36.635
receivedDate type: string
docDate: 2025-07-25T00:00:00
docDate type: string
submissionDate: undefined
submissionDate type: undefined
=== END RECEIVED DATE DEBUG ===
```

## **Data yang Akan Ditampilkan**

### **Expected Output untuk Data API Anda:**

```javascript
=== RECEIVED DATE DEBUG ===
receivedDate: "2025-07-30T10:40:36.635"
receivedDate type: "string"
docDate: "2025-07-25T00:00:00"
docDate type: "string"
submissionDate: undefined
submissionDate type: "undefined"
=== END RECEIVED DATE DEBUG ===
```

### **Penjelasan Data:**

- **`receivedDate`**: Tanggal approval received (2025-07-30T10:40:36.635)
- **`docDate`**: Tanggal dokumen yang sebenarnya (2025-07-25T00:00:00)
- **`submissionDate`**: Biasanya undefined atau tidak ada di API response

## **Fungsi yang Akan Menampilkan Debug**

### **1. Saat Load Existing Document**

- `loadOutgoingPaymentDetails()` - Saat load data dari API
- `populateFormFields()` - Saat populate form dengan data

### **2. Saat Load Document Data**

- `mapResponseToForm()` - Saat map response API ke form

### **3. Saat Submit Document**

- `collectFormData()` - Saat collect data untuk dikirim ke API

## **Troubleshooting**

### **Jika Console Log Tidak Muncul:**

1. **Pastikan Developer Tools terbuka**
2. **Refresh halaman** setelah menambahkan console log
3. **Clear browser cache** jika diperlukan
4. **Check Network tab** untuk memastikan API call berhasil

### **Jika Data Tidak Sesuai:**

1. **Check API response** di Network tab
2. **Verify data structure** dari backend
3. **Check field mapping** di JavaScript

## **Contoh Output Lengkap**

```javascript
// Saat load document
Detailed reimbursement data: {stagingID: 'OP_1753870882013_wy0p18bm4', ...}

=== RECEIVED DATE DEBUG ===
receivedDate: "2025-07-30T10:40:36.635"
receivedDate type: "string"
docDate: "2025-07-25T00:00:00"
docDate type: "string"
submissionDate: undefined
submissionDate type: "undefined"
=== END RECEIVED DATE DEBUG ===

// Saat populate form
populateFormFields called with data: {stagingID: 'OP_1753870882013_wy0p18bm4', ...}

=== POPULATE FORM FIELDS - DATE DEBUG ===
data.receivedDate: "2025-07-30T10:40:36.635"
data.receivedDate type: "string"
data.docDate: "2025-07-25T00:00:00"
data.docDate type: "string"
data.submissionDate: undefined
data.submissionDate type: "undefined"
=== END POPULATE FORM FIELDS - DATE DEBUG ===
```

## **Catatan Penting**

1. **Console log akan muncul** setiap kali fungsi tersebut dipanggil
2. **Data akan ditampilkan** sesuai dengan response API yang sebenarnya
3. **Type checking** akan membantu mengidentifikasi masalah data type
4. **Debug ini temporary** dan bisa dihapus setelah masalah teratasi

Sekarang Anda bisa melihat data `receivedDate` dan field date lainnya di console browser!
