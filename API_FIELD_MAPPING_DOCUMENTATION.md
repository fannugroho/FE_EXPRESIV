# API Field Mapping Documentation

## Overview
This document provides a comprehensive mapping between the API response fields and the HTML form fields used in the Invoice Item approval pages (Check and Acknowledge).

## API Endpoint
```
GET https://expressiv-be-sb.idsdev.site/api/ar-invoices/{stagingId}/details
```

## API Response Structure
```json
{
  "status": true,
  "data": {
    "stagingID": "STG-C41174-002",
    "docNum": "INV-2024-001",
    "cardCode": "C001",
    "cardName": "PT Sample Customer",
    "address": "Jl. Sample Address No. 123",
    "numAtCard": "EXT-REF-001",
    "docCur": "IDR",
    "docRate": 1.0,
    "docDate": "2024-01-15T00:00:00",
    "docDueDate": "2024-02-15T00:00:00",
    "groupNum": 1,
    "trnspCode": 1,
    "taxNo": "123456789",
    "u_BSI_ShippingType": "Standard",
    "u_BSI_PaymentGroup": "Group A",
    "u_BSI_Expressiv_IsTransfered": "N",
    "u_bsi_udf1": "Custom Field 1",
    "u_bsi_udf2": "Custom Field 2",
    "u_BSI_Expressiv_PreparedByName": "John Doe",
    "docTotal": 1100000,
    "vatSum": 100000,
    "downPayment": 0,
    "freight": 0,
    "wtaxAmount": 0,
    "balanceDue": 1100000,
    "comments": "Sample invoice comments",
    "arInvoiceApprovalSummary": {
      "approvalStatus": "Checked",
      "preparedByName": "John Doe",
      "acknowledgedByName": "",
      "checkedByName": "Checker User",
      "approvedByName": "",
      "receivedByName": "",
      "revisionRemarks": "",
      "rejectionRemarks": ""
    },
    "arInvoiceDetails": [
      {
        "lineNum": 0,
        "itemCode": "ITEM001",
        "dscription": "Sample Item 1",
        "text": "Sample notes for item 1",
        "unitMsr": "PCS",
        "quantity": 10,
        "invQty": 10,
        "u_bsi_salprice": 50000,
        "priceBefDi": 50000,
        "discount": 0,
        "vatgroup": "VAT",
        "wtaxLiable": "Y",
        "lineTotal": 500000,
        "acctCode": "4000",
        "baseType": 0,
        "baseEntry": 0,
        "baseLine": 0,
        "lineType": 0
      }
    ],
    "arInvoiceAttachments": [
      {
        "id": 1,
        "fileName": "invoice.pdf",
        "originalFileName": "invoice.pdf",
        "filePath": "/attachments/invoice.pdf",
        "fileSize": 1024000,
        "description": "Invoice document"
      }
    ]
  }
}
```

## Form Field Mappings

### Header Information Fields

| HTML Field ID | API Field | Description | Data Type |
|---------------|-----------|-------------|-----------|
| `DocEntry` | `stagingID` | Document Entry/Staging ID | String |
| `DocNum` | `docNum` | Invoice Number | String |
| `CardCode` | `cardCode` | Customer Code | String |
| `CardName` | `cardName` | Customer Name | String |
| `address` | `address` | Customer Address | String |
| `NumAtCard` | `numAtCard` | External Document Number | String |
| `DocCur` | `docCur` | Currency | String |
| `docRate` | `docRate` | Document Rate | Number |
| `DocDate` | `docDate` | Document Date | Date |
| `DocDueDate` | `docDueDate` | Due Date | Date |
| `GroupNum` | `groupNum` | Group Number | Number |
| `TrnspCode` | `trnspCode` | Transport Code | Number |
| `TaxNo` | `taxNo` | Tax Number | String |
| `U_BSI_ShippingType` | `u_BSI_ShippingType` | Shipping Type | String |
| `U_BSI_PaymentGroup` | `u_BSI_PaymentGroup` | Payment Group | String |
| `U_BSI_Expressiv_IsTransfered` | `u_BSI_Expressiv_IsTransfered` | Transfer Status | String |
| `U_BSI_UDF1` | `u_bsi_udf1` | User Defined Field 1 | String |
| `U_BSI_UDF2` | `u_bsi_udf2` | User Defined Field 2 | String |
| `SalesEmployee` | `u_BSI_Expressiv_PreparedByName` | Sales Employee/Prepared By | String |
| `Status` | `arInvoiceApprovalSummary.approvalStatus` | Document Status | String |

### Totals Fields

| HTML Field ID | API Field | Description | Data Type |
|---------------|-----------|-------------|-----------|
| `PriceBefDi` | `docTotal - vatSum` | Total Before Discount | Calculated |
| `DownPayment` | `downPayment` | Total Down Payment | Number |
| `Freight` | `freight` | Freight Amount | Number |
| `VatSum` | `vatSum` | Total Tax | Number |
| `WTaxAmount` | `wtaxAmount` | Withholding Tax Amount | Number |
| `DocTotal` | `docTotal` | Total Amount | Number |
| `BalanceDue` | `balanceDue` | Balance Due | Number |

### Comments Field

| HTML Field ID | API Field | Description | Data Type |
|---------------|-----------|-------------|-----------|
| `comments` | `comments` | Document Comments | String |

### Approval Information Fields

| HTML Field ID | API Field | Description | Data Type |
|---------------|-----------|-------------|-----------|
| `preparedBySearch` | `arInvoiceApprovalSummary.preparedByName` | Prepared By Name | String |
| `acknowledgeBySearch` | `arInvoiceApprovalSummary.acknowledgedByName` | Acknowledged By Name | String |
| `checkedBySearch` | `arInvoiceApprovalSummary.checkedByName` | Checked By Name | String |
| `approvedBySearch` | `arInvoiceApprovalSummary.approvedByName` | Approved By Name | String |
| `receivedBySearch` | `arInvoiceApprovalSummary.receivedByName` | Received By Name | String |
| `rejectionRemarks` | `arInvoiceApprovalSummary.rejectionRemarks` | Rejection Remarks | String |

### Table Column Mappings

#### Invoice Details Table (arInvoiceDetails array)

| Table Column | API Field | Description | Data Type |
|--------------|-----------|-------------|-----------|
| No. | `lineNum` | Line Number | Number |
| Item Code | `itemCode` | Item Code | String |
| Item Name | `dscription` | Item Description | String |
| Catatan | `text` | Free Text/Notes | String |
| Sales Employee | `unitMsr` | Unit of Measure | String |
| Sales Qty | `quantity` | Sales Quantity | Number |
| Inv. Qty | `invQty` | Invoice Quantity | Number |
| UoM | `unitMsr` | Unit of Measure | String |
| Sales Price | `u_bsi_salprice` | Sales Price | Number |
| Price | `priceBefDi` | Price Before Discount | Number |
| Disc | `discount` | Discount | Number |
| Tax Code | `vatgroup` | VAT Group | String |
| Wtax Liable | `wtaxLiable` | Withholding Tax Liable | String |
| Total Price | `lineTotal` | Line Total | Number |
| Account Code | `acctCode` | Account Code | String |
| BaseType | `baseType` | Base Type | Number |
| BaseEntry | `baseEntry` | Base Entry | Number |
| BaseLine | `baseLine` | Base Line | Number |
| LineType | `lineType` | Line Type | Number |

## Status Mapping Logic

### Status Determination Function
```javascript
function getStatusFromInvoice(invoice) {
    // Check if invoice has approval summary
    if (invoice.arInvoiceApprovalSummary === null || invoice.arInvoiceApprovalSummary === undefined) {
        return 'Draft';
    }
    
    // If arInvoiceApprovalSummary exists, use approvalStatus field
    if (invoice.arInvoiceApprovalSummary) {
        const summary = invoice.arInvoiceApprovalSummary;
        
        // First priority: use approvalStatus field from arInvoiceApprovalSummary
        if (summary.approvalStatus && summary.approvalStatus.trim() !== '') {
            return summary.approvalStatus;
        }
        
        // Fallback: check individual status flags
        if (summary.isRejected) return 'Rejected';
        if (summary.isApproved) return 'Approved';
        if (summary.isAcknowledged) return 'Acknowledged';
        if (summary.isChecked) return 'Checked';
        if (summary.isReceived) return 'Received';
    }
    
    // Check transfer status
    if (invoice.u_BSI_Expressiv_IsTransfered === 'Y') return 'Received';
    
    // Check if it's a staging document (draft)
    if (invoice.stagingID && invoice.stagingID.startsWith('STG')) return 'Draft';
    
    // Check if document has been transferred (received)
    if (invoice.u_BSI_Expressiv_IsTransfered === 'Y') return 'Received';
    
    // Check if document is in preparation stage
    if (invoice.docNum && invoice.docNum > 0) return 'Prepared';
    
    // Default to Draft for new documents
    return 'Draft';
}
```

## Button Visibility Logic

### Check Page
- **Buttons shown when status is "Prepared"**
- **Buttons hidden for other statuses**

### Acknowledge Page
- **Buttons shown when status is "Checked"**
- **Buttons hidden for other statuses**

## API Update Endpoint

### PATCH Endpoint
```
PATCH https://expressiv-be-sb.idsdev.site/api/ar-invoices/approval/{stagingId}
```

### Update Payload Structure
```json
{
  "approvalStatus": "Checked|Acknowledged|Rejected",
  "checkedBy": "username",
  "checkedByName": "User Name",
  "checkedDate": "2024-01-15T10:30:00Z",
  "acknowledgedBy": "username",
  "acknowledgedByName": "User Name",
  "acknowledgedDate": "2024-01-15T10:30:00Z",
  "rejectionRemarks": "Rejection reason (if status is Rejected)",
  "rejectedDate": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Error Handling

### Common Error Scenarios
1. **404 Not Found**: Invoice item not found
2. **500 Server Error**: Server error
3. **Network Error**: Connection issues
4. **Invalid Response Format**: API response structure issues

### Error Messages
- Invoice item not found. Please check the staging ID.
- Server error. Please try again later.
- Network error. Please check your connection.
- Failed to load invoice item data: [specific error]

## Development Mode

### Dummy User Configuration
```javascript
currentUser = {
    id: 1,
    name: 'Development User',
    username: 'dev.user',
    role: 'Admin'
};
```

### Development Mode Flag
```javascript
const isDevelopmentMode = true;
```

## Text Wrapping Functionality

### Applied Elements
- `.description-column textarea`
- `.item-code-column input`
- `.quantity-column textarea`
- `.price-column textarea`
- `.sales-employee-column textarea`

### Wrapping Logic
- **Long content (>15 characters)**: Apply wrap-text and auto-resize
- **Short content (≤15 characters)**: Apply no-wrap styling

## Attachments Handling

### Attachment Structure
```json
{
  "id": 1,
  "fileName": "invoice.pdf",
  "originalFileName": "invoice.pdf",
  "filePath": "/attachments/invoice.pdf",
  "fileSize": 1024000,
  "description": "Invoice document"
}
```

### Attachment Functions
- `loadAttachments(stagingID)`: Load attachments from API
- `displayAttachments(attachments)`: Display attachment list
- `createAttachmentItem(attachment, index)`: Create attachment item HTML
- `downloadAttachment(filePath)`: Download attachment
- `previewAttachment(filePath)`: Preview attachment

## Notes

1. **Field Names**: API uses camelCase, HTML uses PascalCase for most fields
2. **Date Formatting**: API returns ISO date strings, converted to YYYY-MM-DD for HTML date inputs
3. **Calculated Fields**: Some totals are calculated from API data (e.g., PriceBefDi = docTotal - vatSum)
4. **Status Logic**: Complex status determination based on multiple API fields
5. **Error Handling**: Comprehensive error handling with user-friendly messages
6. **Development Mode**: Bypasses authentication for development purposes