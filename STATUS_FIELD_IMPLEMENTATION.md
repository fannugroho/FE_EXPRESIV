# Status Field Implementation for Invoice Menu

## Overview
This document explains the implementation of the status field in the invoice menu (`menuInvoice.html`).

## API Field Mapping

### Primary Field
- **Field**: `arInvoiceApprovalSummary.approvalStatus`
- **Source**: API response from `/ar-invoices` endpoint
- **Type**: String

### Implementation Logic

```javascript
function getStatusFromInvoice(invoice) {
    // Check if approval summary exists
    if (invoice.arInvoiceApprovalSummary === null || invoice.arInvoiceApprovalSummary === undefined) {
        return 'Draft';
    }
    
    const summary = invoice.arInvoiceApprovalSummary;
    
    // Use approvalStatus if available and not empty
    if (summary.approvalStatus && summary.approvalStatus.trim() !== '') {
        return validateStatus(summary.approvalStatus);
    }
    
    // Default to Draft if approvalStatus is empty/null/undefined
    return 'Draft';
}
```

## Status Values

### Valid Statuses
1. **Draft** - Default status when approvalStatus is empty
2. **Prepared** - Document has been prepared
3. **Checked** - Document has been checked
4. **Acknowledged** - Document has been acknowledged
5. **Approved** - Document has been approved
6. **Received** - Document has been received
7. **Rejected** - Document has been rejected

### Status Validation
```javascript
function validateStatus(status) {
    const validStatuses = ['Draft', 'Prepared', 'Checked', 'Acknowledged', 'Approved', 'Received', 'Rejected'];
    if (status && validStatuses.includes(status)) {
        return status;
    }
    console.warn(`Invalid status value: "${status}", defaulting to "Draft"`);
    return 'Draft';
}
```

## API Response Structure

### Expected API Response
```json
{
  "status": true,
  "code": 200,
  "message": "Operation successful",
  "data": [
    {
      "id": "invoice_id",
      "numAtCard": "INV-001",
      "cardName": "Customer Name",
      "docDate": "2024-01-01",
      "docDueDate": "2024-01-31",
      "docTotal": 1000000,
      "arInvoiceApprovalSummary": {
        "approvalStatus": "Draft"
      }
    }
  ]
}
```

### Status Display Logic
1. **If `approvalStatus` has a value**: Display the status from API
2. **If `approvalStatus` is empty/null/undefined**: Display "Draft"
3. **If `approvalStatus` has invalid value**: Convert to "Draft"

## Visual Styling

### Status Color Classes
- **Draft**: `bg-yellow-100 text-yellow-800`
- **Prepared**: `bg-blue-100 text-blue-800`
- **Checked/Acknowledged/Approved/Received**: `bg-green-100 text-green-800`
- **Rejected**: `bg-red-100 text-red-800`
- **Invalid/Unknown**: `bg-gray-100 text-gray-800`

## Debugging

### Console Logs
The implementation includes detailed console logging:

```javascript
// When approvalStatus is used
console.log('✅ Using approvalStatus from API:', summary.approvalStatus);

// When approvalStatus is empty
console.log('❌ approvalStatus is empty/null/undefined, returning Draft');
console.log('approvalStatus value:', summary.approvalStatus);
console.log('approvalStatus type:', typeof summary.approvalStatus);
```

## Testing Scenarios

### Test Cases
1. **Valid Status**: `approvalStatus: "Approved"` → Display "Approved"
2. **Empty Status**: `approvalStatus: ""` → Display "Draft"
3. **Null Status**: `approvalStatus: null` → Display "Draft"
4. **Undefined Status**: `approvalStatus: undefined` → Display "Draft"
5. **Invalid Status**: `approvalStatus: "InvalidStatus"` → Display "Draft"
6. **Missing Field**: No `arInvoiceApprovalSummary` → Display "Draft"

## Implementation Notes

### Key Changes Made
1. **Simplified Logic**: Removed complex fallback logic, now focuses on `approvalStatus` field only
2. **Default to Draft**: Any empty/null/undefined `approvalStatus` returns "Draft"
3. **Status Validation**: Added validation to ensure only valid statuses are displayed
4. **Enhanced Logging**: Added detailed console logging for debugging

### Benefits
- **Consistency**: All empty statuses show as "Draft"
- **Reliability**: Status validation prevents invalid values
- **Debugging**: Detailed logging helps troubleshoot issues
- **Maintainability**: Simplified logic is easier to maintain

## Files Modified
- `js/menuInvoice.js` - Main implementation file
- `STATUS_FIELD_IMPLEMENTATION.md` - This documentation file 