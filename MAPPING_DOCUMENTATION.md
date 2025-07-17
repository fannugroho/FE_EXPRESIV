# Mapping Kolom Form dengan Response Body API

## 📋 **Informasi API Endpoint**

- **Endpoint:** `/api/staging-outgoing-payments/headers`
- **Base URL:** `https://api-dev.expressiv.id`
- **Method:** 
  - `POST` - Submit/Save document
  - `GET` - Load document by ID
- **Content-Type:** `application/json`

## 🔄 **Mapping Lengkap Form → Response Body**

### **1. Header Fields (Form Inputs)**

| **Form Label** | **Element ID** | **Response Field** | **Tipe Data** | **Contoh Value** | **Required** |
|----------------|----------------|-------------------|----------------|-------------------|--------------|
| Reimburse No | `CounterRef` | `counterRef` | String | "REIM-2024-001" | ✅ |
| Requester Reimbursement | `RequesterName` | `requesterName` | String | "John Doe" | ✅ |
| Pay To | `CardName` | `cardName` | String | "PT Supplier ABC" | ✅ |
| Pay To Address | `Address` | `address` | String | "Jl. Sudirman No. 123" | ✅ |
| Document Date | `DocDate` | `docDate` | DateTime | "2024-01-15T00:00:00.000Z" | ✅ |
| Due Date | `DocDueDate` | `docDueDate` | DateTime | "2024-01-20T00:00:00.000Z" | ❌ |
| Tax Date | `TaxDate` | `taxDate` | DateTime | "2024-01-15T00:00:00.000Z" | ❌ |
| DocNum | `DocNum` | `docNum` | Integer | 12345 | ❌ |
| Comments | `Comments` | `comments` | String | "Reimbursement untuk biaya transport" | ❌ |
| Journal Memo | `JrnlMemo` | `jrnlMemo` | String | "Memo jurnal reimbursement" | ❌ |
| Document Currency | `DocCurr` | `docCurr` | String | "IDR" | ✅ |
| Document Currency | `DiffCurr` | `diffCurr` | String | "IDR" | ✅ |
| Transfer Date | `TrsfrDate` | `trsfrDate` | DateTime | "2024-01-16T00:00:00.000Z" | ❌ |
| Account Bank Transfer | `TrsfrAcct` | `trsfrAcct` | String | "1234567890" | ❌ |
| Total Transfer | `TrsfrSum` | `trsfrSum` | Decimal | 1000000.00 | ❌ |

### **2. Total Fields (Readonly)**

| **Form Label** | **Element ID** | **Response Field** | **Tipe Data** | **Contoh Value** | **Auto Calculated** |
|----------------|----------------|-------------------|----------------|-------------------|-------------------|
| Net Total | `netTotal` | `netTotal` | Decimal | 1000000.00 | ✅ |
| Total Tax | `totalTax` | `totalTax` | Decimal | 100000.00 | ✅ |
| Total Amount Due | `totalAmountDue` | `totalAmountDue` | Decimal | 1100000.00 | ✅ |

### **3. Remarks Fields**

| **Form Label** | **Element ID** | **Response Field** | **Tipe Data** | **Contoh Value** | **Required** |
|----------------|----------------|-------------------|----------------|-------------------|--------------|
| Remarks | `remarks` | `remarks` | String | "Catatan tambahan" | ❌ |
| Journal Remarks | `journalRemarks` | `journalRemarks` | String | "Catatan jurnal" | ❌ |
| Rejection Reason | `rejectionRemarks` | `approval.rejectionRemarks` | String | "Dokumen ditolak" | ❌ |

### **4. Table Lines (Dynamic Rows)**

| **Table Header** | **Element ID** | **Response Field** | **Tipe Data** | **Contoh Value** | **Required** |
|------------------|----------------|-------------------|----------------|-------------------|--------------|
| G/L Account | `AcctCode` | `lines[].acctCode` | String | "12345" | ✅ |
| Account Name | `AcctName` | `lines[].acctName` | String | "Transportation Expense" | ✅ |
| Description | `description` | `lines[].descrip` | String | "Biaya transport kantor" | ❌ |
| Division | `division` | `lines[].ocrCode3` | String | "DIV001" | ❌ |
| Net Amount | `DocTotal` | `lines[].sumApplied` | Decimal | 500000.00 | ✅ |

### **5. Approval Fields**

| **Form Label** | **Element ID** | **Response Field** | **Tipe Data** | **Contoh Value** | **Required** |
|----------------|----------------|-------------------|----------------|-------------------|--------------|
| Proposed by | `Approval.PreparedById` | `approval.preparedBy` | String | "user123" | ✅ |
| Checked by | `Approval.CheckedById` | `approval.checkedBy` | String | "user456" | ❌ |
| Acknowledged by | `Approval.AcknowledgedById` | `approval.acknowledgedBy` | String | "user789" | ❌ |
| Approved by | `Approval.ApprovedById` | `approval.approvedBy` | String | "user101" | ❌ |
| Received by | `Approval.ReceivedById` | `approval.receivedBy` | String | "user102" | ❌ |
| Closed by | `Approval.ClosedById` | `approval.closedBy` | String | "user103" | ❌ |

## 📄 **Contoh Request Body (POST)**

```json
{
  "stagingID": "string",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "docEntry": 0,
  "counterRef": "REIM-2024-001",
  "requesterName": "John Doe",
  "cardName": "PT Supplier ABC",
  "address": "Jl. Sudirman No. 123, Jakarta",
  "docDate": "2024-01-15T00:00:00.000Z",
  "docDueDate": "2024-01-20T00:00:00.000Z",
  "taxDate": "2024-01-15T00:00:00.000Z",
  "docNum": 12345,
  "comments": "Reimbursement untuk biaya transport",
  "jrnlMemo": "Memo jurnal reimbursement",
  "doctype": "A",
  "docCurr": "IDR",
  "diffCurr": "IDR",
  "trsfrDate": "2024-01-16T00:00:00.000Z",
  "trsfrAcct": "1234567890",
  "trsfrSum": 1000000.00,
  "isTransferred": true,
  "type": "REIMBURSEMENT",
  "expressivNo": "EXP-2024-001",
  "netTotal": 1000000.00,
  "totalTax": 100000.00,
  "totalAmountDue": 1100000.00,
  "remarks": "Catatan tambahan",
  "journalRemarks": "Catatan jurnal",
  "lines": [
    {
      "lineID": 0,
      "lineNum": 0,
      "acctCode": "12345",
      "acctName": "Transportation Expense",
      "descrip": "Biaya transport kantor",
      "sumApplied": 500000.00,
      "ocrCode3": "DIV001",
      "category": "EXPENSE",
      "header": "string"
    }
  ],
  "approval": {
    "stagingID": "string",
    "approvalStatus": "Draft",
    "preparedBy": "user123",
    "checkedBy": "user456",
    "acknowledgedBy": "user789",
    "approvedBy": "user101",
    "receivedBy": "user102",
    "closedBy": "user103",
    "preparedDate": "2024-01-15T10:30:00.000Z",
    "checkedDate": null,
    "acknowledgedDate": null,
    "approvedDate": null,
    "receivedDate": null,
    "rejectedDate": null,
    "rejectionRemarks": "",
    "revisionNumber": 0,
    "revisionDate": null,
    "revisionRemarks": "",
    "header": "string"
  },
  "attachments": []
}
```

## 📄 **Contoh Response Body (Success)**

```json
{
  "success": true,
  "message": "Document saved successfully",
  "data": {
    "stagingID": "stg-001",
    "docEntry": 123,
    "docNum": "OPR-2024-001",
    "counterRef": "REIM-2024-001",
    "requesterName": "John Doe",
    "cardName": "PT Supplier ABC",
    "address": "Jl. Sudirman No. 123, Jakarta",
    "docDate": "2024-01-15T00:00:00.000Z",
    "docDueDate": "2024-01-20T00:00:00.000Z",
    "taxDate": "2024-01-15T00:00:00.000Z",
    "comments": "Reimbursement untuk biaya transport",
    "jrnlMemo": "Memo jurnal reimbursement",
    "doctype": "A",
    "docCurr": "IDR",
    "diffCurr": "IDR",
    "trsfrDate": "2024-01-16T00:00:00.000Z",
    "trsfrAcct": "1234567890",
    "trsfrSum": 1000000.00,
    "isTransferred": true,
    "type": "REIMBURSEMENT",
    "expressivNo": "EXP-2024-001",
    "netTotal": 1000000.00,
    "totalTax": 100000.00,
    "totalAmountDue": 1100000.00,
    "remarks": "Catatan tambahan",
    "journalRemarks": "Catatan jurnal",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "lines": [
      {
        "lineID": 0,
        "lineNum": 0,
        "acctCode": "12345",
        "acctName": "Transportation Expense",
        "descrip": "Biaya transport kantor",
        "sumApplied": 500000.00,
        "ocrCode3": "DIV001",
        "category": "EXPENSE",
        "header": "stg-001"
      }
    ],
    "approval": {
      "stagingID": "stg-001",
      "approvalStatus": "Draft",
      "preparedBy": "user123",
      "checkedBy": "user456",
      "acknowledgedBy": "user789",
      "approvedBy": "user101",
      "receivedBy": "user102",
      "closedBy": "user103",
      "preparedDate": "2024-01-15T10:30:00.000Z",
      "checkedDate": null,
      "acknowledgedDate": null,
      "approvedDate": null,
      "receivedDate": null,
      "rejectedDate": null,
      "rejectionRemarks": "",
      "revisionNumber": 0,
      "revisionDate": null,
      "revisionRemarks": "",
      "header": "stg-001"
    },
    "attachments": []
  }
}
```

## 📄 **Contoh Response Body (Error)**

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "cardName",
        "message": "Card name is required"
      },
      {
        "field": "trsfrSum",
        "message": "Transfer sum must be greater than 0"
      }
    ]
  }
}
```

## 🔧 **JavaScript Functions**

### **1. submitDocument(isSubmit)**
- **Purpose:** Submit atau save document
- **Method:** POST
- **Endpoint:** `/api/staging-outgoing-payments/headers`
- **Parameters:** `isSubmit` (boolean) - true untuk submit, false untuk save

### **2. loadDocumentData()**
- **Purpose:** Load document data dari API
- **Method:** GET
- **Endpoint:** `/api/staging-outgoing-payments/headers/{id}`
- **Trigger:** URL parameter `?id={documentId}`

### **3. mapResponseToForm(responseData)**
- **Purpose:** Map response data kembali ke form fields
- **Used by:** `loadDocumentData()` dan `submitDocument()`

## 🎯 **Status Codes**

- **200 OK:** Success
- **201 Created:** Document created successfully
- **400 Bad Request:** Validation error
- **401 Unauthorized:** Authentication required
- **403 Forbidden:** Access denied
- **404 Not Found:** Document not found
- **500 Internal Server Error:** Server error

## 📝 **Notes**

1. **Currency Formatting:** Semua field amount menggunakan format currency dengan separator koma (1,000,000.00)
2. **Date Formatting:** Date fields menggunakan ISO 8601 format
3. **Dynamic Rows:** Table lines dapat ditambah/dihapus secara dinamis
4. **Auto Calculation:** Total fields dihitung otomatis berdasarkan input di tabel
5. **User Search:** Approval fields menggunakan search dropdown untuk mencari user
6. **File Upload:** Attachment field menerima file PDF, DOC, XLS, dan gambar 