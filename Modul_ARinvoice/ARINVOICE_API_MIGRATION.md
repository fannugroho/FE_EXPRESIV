# ARInvoice API Migration Guide

## Overview

This document outlines the migration from the old staging-outgoing-payments API to the new ARInvoice API for the ARInvoice module.

## API Endpoints Mapping

### Old API (staging-outgoing-payments) → New API (ar-invoices)

| Old Endpoint                                      | New Endpoint                                                       | Method | Description                 |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------ | --------------------------- |
| `/api/staging-outgoing-payments/headers`          | `/api/ar-invoices`                                                 | POST   | Create AR Invoice           |
| `/api/staging-outgoing-payments/headers/{id}`     | `/api/ar-invoices/{stagingId}`                                     | GET    | Get AR Invoice              |
| `/api/staging-outgoing-payments/headers/{id}`     | `/api/ar-invoices/{stagingId}`                                     | PUT    | Update AR Invoice           |
| `/api/staging-outgoing-payments/headers/{id}`     | `/api/ar-invoices/{stagingId}`                                     | DELETE | Delete AR Invoice           |
| `/api/staging-outgoing-payments/attachments/{id}` | `/api/ar-invoices/{stagingId}/attachments`                         | GET    | Get attachments             |
| N/A                                               | `/api/ar-invoices/{stagingId}/attachments/upload`                  | POST   | Upload attachments          |
| N/A                                               | `/api/ar-invoices/{stagingId}/attachments/{attachmentId}/download` | GET    | Download attachment         |
| N/A                                               | `/api/ar-invoices/{stagingId}/attachments/{attachmentId}`          | DELETE | Delete attachment           |
| N/A                                               | `/api/ar-invoices/{stagingId}/details`                             | GET    | Get AR Invoice with details |
| N/A                                               | `/api/ar-invoices/approval/{stagingId}`                            | PATCH  | Update approval status      |

### Additional ARInvoice API Endpoints

| Endpoint                                            | Method | Description                        |
| --------------------------------------------------- | ------ | ---------------------------------- |
| `/api/ar-invoices/by-card-code/{cardCode}`          | GET    | Get AR Invoices by card code       |
| `/api/ar-invoices/by-preparer/{preparerNIK}`        | GET    | Get AR Invoices by preparer        |
| `/api/ar-invoices/by-date-range`                    | GET    | Get AR Invoices by date range      |
| `/api/ar-invoices/by-acknowledged/{acknowledgedBy}` | GET    | Get AR Invoices by acknowledged by |
| `/api/ar-invoices/by-prepared/{preparedBy}`         | GET    | Get AR Invoices by prepared by     |
| `/api/ar-invoices/by-checked/{checkedBy}`           | GET    | Get AR Invoices by checked by      |
| `/api/ar-invoices/by-approved/{approvedBy}`         | GET    | Get AR Invoices by approved by     |
| `/api/ar-invoices/by-received/{receivedBy}`         | GET    | Get AR Invoices by received by     |

## Data Structure Changes

### Request Body Structure

#### Old Structure (staging-outgoing-payments)

```json
{
  "stagingID": "OP_1234567890_abc123",
  "docEntry": 123,
  "address": "Customer Address",
  "cardName": "Customer Name",
  "docDate": "2024-01-01T00:00:00Z",
  "docDueDate": "2024-01-31T00:00:00Z",
  "counterRef": "REF123",
  "docNum": 123,
  "comments": "Comments",
  "jrnlMemo": "Journal Memo",
  "docCurr": "IDR",
  "trsfrSum": 1000000,
  "lines": [
    {
      "lineNum": 0,
      "acctCode": "1100",
      "acctName": "Cash",
      "descrip": "Description",
      "CurrencyItem": "IDR",
      "sumApplied": 1000000
    }
  ],
  "approval": {
    "approvalStatus": "Prepared",
    "preparedBy": "USER123",
    "checkedBy": "USER456"
  }
}
```

#### New Structure (ar-invoices)

```json
{
  "docNum": 123,
  "docType": "A",
  "docDate": "2024-01-01T00:00:00Z",
  "docDueDate": "2024-01-31T00:00:00Z",
  "cardCode": "C001",
  "cardName": "Customer Name",
  "address": "Customer Address",
  "numAtCard": "REF123",
  "comments": "Comments",
  "u_BSI_Expressiv_PreparedByNIK": "USER123",
  "u_BSI_Expressiv_PreparedByName": "User Name",
  "docCur": "IDR",
  "docRate": 1,
  "vatSum": 0,
  "vatSumFC": 0,
  "wtSum": 0,
  "wtSumFC": 0,
  "docTotal": 1000000,
  "docTotalFC": 1000000,
  "trnspCode": 0,
  "u_BSI_ShippingType": "",
  "groupNum": 0,
  "u_BSI_PaymentGroup": "",
  "u_bsi_invnum": "",
  "u_bsi_udf1": "",
  "u_bsi_udf2": "",
  "trackNo": "",
  "u_BSI_Expressiv_IsTransfered": "N",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "arInvoiceDetails": [
    {
      "lineNum": 0,
      "visOrder": 0,
      "itemCode": "ITEM001",
      "dscription": "Description",
      "acctCode": "1100",
      "quantity": 1,
      "invQty": 1,
      "priceBefDi": 1000000,
      "u_bsi_salprice": 1000000,
      "u_bsi_source": "AR",
      "vatgroup": "VAT",
      "wtLiable": "N",
      "lineTotal": 1000000,
      "totalFrgn": 1000000,
      "lineVat": 0,
      "lineVatIF": 0,
      "ocrCode3": "",
      "unitMsr": "PCS",
      "numPerMsr": 1,
      "freeTxt": "",
      "text": "Description",
      "baseType": 0,
      "baseEntry": 0,
      "baseRef": "",
      "baseLine": 0,
      "cogsOcrCod": "",
      "cogsOcrCo2": "",
      "cogsOcrCo3": ""
    }
  ],
  "arInvoiceAttachments": [
    {
      "fileName": "document.pdf",
      "filePath": "/uploads/ar-invoices/document.pdf",
      "fileUrl": "http://localhost:5249/uploads/ar-invoices/document.pdf",
      "description": "Document attachment"
    }
  ]
}
```

## Form Field Mapping

### Header Fields

| Form Field        | Old API Field                    | New API Field                    | Required |
| ----------------- | -------------------------------- | -------------------------------- | -------- |
| Document Number   | `docNum`                         | `docNum`                         | Yes      |
| Document Type     | `doctype`                        | `docType`                        | Yes      |
| Document Date     | `docDate`                        | `docDate`                        | Yes      |
| Due Date          | `docDueDate`                     | `docDueDate`                     | Yes      |
| Card Code         | N/A                              | `cardCode`                       | Yes      |
| Card Name         | `cardName`                       | `cardName`                       | Yes      |
| Address           | `address`                        | `address`                        | No       |
| Number at Card    | N/A                              | `numAtCard`                      | No       |
| Comments          | `comments`                       | `comments`                       | No       |
| Prepared By NIK   | `u_BSI_Expressiv_PreparedByNIK`  | `u_BSI_Expressiv_PreparedByNIK`  | Yes      |
| Prepared By Name  | `u_BSI_Expressiv_PreparedByName` | `u_BSI_Expressiv_PreparedByName` | Yes      |
| Document Currency | `docCurr`                        | `docCur`                         | Yes      |
| Document Rate     | N/A                              | `docRate`                        | Yes      |
| VAT Sum           | N/A                              | `vatSum`                         | Yes      |
| VAT Sum FC        | N/A                              | `vatSumFC`                       | Yes      |
| WT Sum            | N/A                              | `wtSum`                          | Yes      |
| WT Sum FC         | N/A                              | `wtSumFC`                        | Yes      |
| Document Total    | `docTotal`                       | `docTotal`                       | Yes      |
| Document Total FC | N/A                              | `docTotalFC`                     | Yes      |

### Line Item Fields

| Form Field  | Old API Field | New API Field | Required |
| ----------- | ------------- | ------------- | -------- |
| G/L Account | `acctCode`    | `acctCode`    | Yes      |
| Description | `dscription`  | `dscription`  | Yes      |
| Amount      | `sumApplied`  | `lineTotal`   | Yes      |
| Item Code   | N/A           | `itemCode`    | Yes      |
| Quantity    | N/A           | `quantity`    | Yes      |
| Unit Price  | N/A           | `priceBefDi`  | Yes      |

## File Changes

### Updated Files

1. `FE_EXPRESIV/Modul_ARinvoice/AddARin/add_ARInvoiceNew.js`

   - Updated API endpoints
   - Updated data structure
   - Updated validation logic
   - Added attachment upload functionality

2. `FE_EXPRESIV/Modul_ARinvoice/AddARin/add_ARInvoiceNew.html`
   - Updated API documentation comments
   - Added new API service script reference

### New Files

1. `FE_EXPRESIV/Modul_ARinvoice/js/arInvoiceApiService.js`
   - Centralized API service for ARInvoice operations
   - Utility methods for formatting and validation
   - Error handling and user feedback

## Usage Examples

### Creating a new AR Invoice

```javascript
// Using the API service
const apiService = window.arInvoiceApiService;

const arInvoiceData = {
  docNum: 123,
  docType: "A",
  docDate: new Date().toISOString(),
  docDueDate: new Date().toISOString(),
  cardCode: "C001",
  cardName: "Customer Name",
  // ... other fields
  arInvoiceDetails: [
    {
      lineNum: 0,
      acctCode: "1100",
      dscription: "Description",
      lineTotal: 1000000,
      // ... other line fields
    },
  ],
};

try {
  const result = await apiService.createARInvoice(arInvoiceData);
  console.log("AR Invoice created:", result);
} catch (error) {
  console.error("Error creating AR Invoice:", error);
}
```

### Uploading attachments

```javascript
const files = document.getElementById("attachment").files;
const stagingId = "AR_1234567890_abc123";

try {
  const result = await apiService.uploadAttachments(stagingId, files);
  console.log("Attachments uploaded:", result);
} catch (error) {
  console.error("Error uploading attachments:", error);
}
```

### Getting AR Invoice with details

```javascript
const stagingId = "AR_1234567890_abc123";

try {
  const result = await apiService.getARInvoiceWithDetails(stagingId);
  console.log("AR Invoice with details:", result);
} catch (error) {
  console.error("Error getting AR Invoice:", error);
}
```

## Migration Checklist

- [x] Update API endpoints in JavaScript files
- [x] Update data structure to match ARInvoice API
- [x] Update form field mapping
- [x] Update validation logic
- [x] Add attachment upload functionality
- [x] Create centralized API service
- [x] Update HTML documentation
- [x] Test API integration

## Notes

1. The new API uses `stagingId` instead of `id` for document identification
2. All monetary values should be sent as numbers, not formatted strings
3. Dates should be sent in ISO format
4. The API service includes utility methods for formatting and parsing
5. Error handling is centralized in the API service
6. SweetAlert2 is used for user feedback (if available)

## Backend Requirements

The backend should implement the following endpoints:

- `GET /api/ar-invoices` - Get all AR Invoices with pagination
- `POST /api/ar-invoices` - Create new AR Invoice
- `GET /api/ar-invoices/{stagingId}` - Get AR Invoice by ID
- `PUT /api/ar-invoices/{stagingId}` - Update AR Invoice
- `DELETE /api/ar-invoices/{stagingId}` - Delete AR Invoice
- `GET /api/ar-invoices/{stagingId}/details` - Get AR Invoice with details
- `PATCH /api/ar-invoices/approval/{stagingId}` - Update approval status
- `POST /api/ar-invoices/{stagingId}/attachments/upload` - Upload attachments
- `GET /api/ar-invoices/{stagingId}/attachments` - Get attachments
- `GET /api/ar-invoices/{stagingId}/attachments/{attachmentId}/download` - Download attachment
- `DELETE /api/ar-invoices/{stagingId}/attachments/{attachmentId}` - Delete attachment
- `GET /api/ar-invoices/dashboard/summary` - Get dashboard summary statistics
- Various filter endpoints for getting AR Invoices by different criteria
