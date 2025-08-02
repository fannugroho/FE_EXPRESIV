# AR Invoice Check Dashboard

## API Integration

This page has been integrated with the AR Invoice API endpoint:

### API Endpoint
- **URL**: `https://expressiv-be-sb.idsdev.site/api/ar-invoices`
- **Method**: GET
- **Headers**: 
  - `Content-Type: application/json`
  - `Accept: text/plain`

### API Response Structure
The API returns data in the following format:
```json
{
  "status": true,
  "code": 200,
  "message": "Operation successful",
  "data": [
    {
      "stagingID": "STG-001",
      "docNum": 1001,
      "docType": "I",
      "docDate": "2024-06-01T00:00:00",
      "docDueDate": "2024-06-15T00:00:00",
      "cardCode": "C0001",
      "cardName": "PT. Example Customer",
      "address": "Jl. Example 123",
      "numAtCard": "INV-001",
      "comments": "First AR Invoice",
      "u_BSI_Expressiv_PreparedByNIK": "EMP001",
      "u_BSI_Expressiv_PreparedByName": "John Doe",
      "docCur": "IDR",
      "docRate": 1,
      "vatSum": 10000,
      "vatSumFC": 0,
      "wtSum": 0,
      "wtSumFC": 0,
      "docTotal": 110000,
      "docTotalFC": 0,
      "trnspCode": 1,
      "u_BSI_ShippingType": "REG",
      "groupNum": 1,
      "u_BSI_PaymentGroup": "CASH",
      "u_bsi_invnum": "INV-001",
      "u_bsi_udf1": "UDF1",
      "u_bsi_udf2": "UDF2",
      "trackNo": "TRK-001",
      "u_BSI_Expressiv_IsTransfered": "N",
      "createdAt": "2025-07-24T15:29:05.71",
      "updatedAt": "2025-07-24T15:29:05.71",
      "arInvoiceDetails": [],
      "arInvoiceAttachments": [],
      "arInvoiceApprovalSummary": null
    }
  ]
}
```

### Data Transformation
The API response is transformed to match the dashboard's expected format:

| API Field | Dashboard Field | Description |
|-----------|----------------|-------------|
| `stagingID` | `id` | Unique identifier |
| `u_bsi_invnum` or `numAtCard` | `invoiceNo` | Invoice number |
| `cardCode` | `cardCode` | Customer code |
| `cardName` | `customerName` | Customer name |
| `u_BSI_Expressiv_PreparedByName` | `salesEmployee` | Sales employee name |
| `docDate` | `invoiceDate` | Invoice date |
| `docDueDate` | `dueDate` | Due date |
| `docTotal` | `totalAmount` | Total amount |
| `docCur` | `currency` | Currency |
| `u_BSI_Expressiv_IsTransfered` | `isTransfered` | Transfer status |
| `arInvoiceApprovalSummary` | `approvalSummary` | Approval data |

### Status Determination
The invoice status is determined based on the `arInvoiceApprovalSummary`:
- **prepared**: Default status when no approval data exists
- **checked**: When `isChecked` is true or status is 'checked'/'approved'
- **rejected**: When `isRejected` is true or status is 'rejected'

### Features
- **Real-time data**: Fetches data from the API on page load
- **Search functionality**: Search by invoice number, customer code, customer name, date, or status
- **Tab filtering**: Filter by prepared, checked, or rejected status
- **Export functionality**: Export to Excel or PDF with all API fields
- **Pagination**: Navigate through large datasets
- **Responsive design**: Works on desktop and mobile devices

### Error Handling
- Falls back to mock data if API call fails
- Displays error messages to users
- Console logging for debugging

### Development Mode
The page includes development mode features:
- Authentication bypass for testing
- Mock data fallback
- Console logging for API responses

## Files Modified
- `menuARItemCheck.html`: Updated table structure and search options
- `menuARItemCheck.js`: Integrated API calls and data transformation
- `README.md`: This documentation file 