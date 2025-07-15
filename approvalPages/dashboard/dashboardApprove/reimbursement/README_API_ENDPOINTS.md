# Reimbursement Approval API Endpoints

This document describes the API endpoints used in the Reimbursement Approval Dashboard (`menuReimApprove.js`).

## Status Counts Endpoint

```
GET /api/reimbursements/status-counts/approver/{userId}
```

Returns counts of reimbursements in different statuses for a specific approver.

**Response Format:**
```json
{
  "status": true,
  "code": 200,
  "message": "Status counts for approver retrieved successfully",
  "data": {
    "totalCount": 10,
    "acknowledgedCount": 5,
    "approvedCount": 3,
    "rejectedCount": 2
  }
}
```

## Reimbursement List Endpoints

### All Reimbursements for Approver

```
GET /api/reimbursements/approver/{userId}
```

Returns all reimbursements for a specific approver, regardless of status.

### Acknowledged Reimbursements

```
GET /api/reimbursements/approver/{userId}/acknowledged
```

Returns only reimbursements with "Acknowledged" status for a specific approver.

**Response Format:**
```json
{
  "status": true,
  "code": 200,
  "message": "Acknowledged reimbursements for approver '{userId}' retrieved successfully",
  "data": [
    {
      "id": "02b42e18-56e7-4f2c-a7eb-4ad137fe17cd",
      "voucherNo": "REIM/033/0725",
      "requesterName": "Dalari",
      "department": "Production Direct",
      "currency": "IDR",
      "payTo": "5d20eb00-a280-43a9-a372-bb8ebc17842a",
      "submissionDate": "2025-07-15T03:20:46.5834461",
      "status": "Acknowledged",
      "referenceDoc": "INV - 009",
      "typeOfTransaction": "Medical",
      "remarks": "medical expense",
      "preparedBy": "f17f5373-61af-4d48-9686-2d3f64ade525",
      "checkedBy": "f17f5373-61af-4d48-9686-2d3f64ade525",
      "acknowledgedBy": "f17f5373-61af-4d48-9686-2d3f64ade525",
      "approvedBy": "f17f5373-61af-4d48-9686-2d3f64ade525",
      "receivedBy": "f17f5373-61af-4d48-9686-2d3f64ade525",
      "preparedDate": "2025-07-15T03:20:46.5834488",
      "checkedDate": "2025-07-15T06:09:48.1208005",
      "rejectedDateByChecker": null,
      "remarksRejectByChecker": "",
      "acknowledgedDate": "2025-07-15T12:49:33.5809991",
      "rejectedDateByAcknowledger": null,
      "remarksRejectByAcknowledger": "",
      "approvedDate": null,
      "rejectedDateByApprover": null,
      "remarksRejectByApprover": "",
      "receivedDate": null,
      "rejectedDateByReceiver": null,
      "remarksRejectByReceiver": "",
      "isInterfaced": false,
      "interfacedDate": null,
      "firstRevisionDate": null,
      "firstRevisionRemarks": "",
      "secondRevisionDate": null,
      "secondRevisionRemarks": "",
      "thirdRevisionDate": null,
      "thirdRevisionRemarks": "",
      "fourthRevisionDate": null,
      "fourthRevisionRemarks": "",
      "payToNIK": "02104029",
      "payToName": "Dalari",
      "preparedByNIK": "02104029",
      "preparedByName": "Dalari",
      "checkedByNIK": "02104029",
      "checkedByName": "Dalari",
      "acknowledgedByNIK": "02104029",
      "acknowledgedByName": "Dalari",
      "approvedByNIK": "02104029",
      "approvedByName": "Dalari",
      "receivedByNIK": "02104029",
      "receivedByName": "Dalari",
      "totalAmount": 1234534.31,
      "createdAt": "2025-07-15T10:20:46.5841452",
      "updatedAt": "2025-07-15T19:49:33.5819162",
      "reimbursementDetails": [
        {
          "id": "4bccf912-7a90-4369-8ec2-0c19c07cedd1",
          "reimbursementId": "02b42e18-56e7-4f2c-a7eb-4ad137fe17cd",
          "description": "medical expense",
          "amount": 1234534.31,
          "category": "Medical",
          "glAccount": "6054",
          "accountName": "Welfare expense DC"
        }
      ],
      "reimbursementAttachments": [
        {
          "id": "602157be-4810-44b5-81fd-c99ad0a31f21",
          "reimbursementId": "02b42e18-56e7-4f2c-a7eb-4ad137fe17cd",
          "fileName": "UAT 10 Juli 2025.pdf",
          "filePath": "reimbursements/02b42e18-56e7-4f2c-a7eb-4ad137fe17cd/f8716471-c261-4a9e-a832-6c8643a06a9d_UAT 10 Juli 2025.pdf",
          "fileType": "application/pdf",
          "fileSize": 36395,
          "uploadDate": "2025-07-15T03:20:47.1810723"
        }
      ]
    }
  ]
}
```

### Approved Reimbursements

```
GET /api/reimbursements/approver/{userId}/approved
```

Returns only reimbursements with "Approved" status for a specific approver.

**Response Format:** Same structure as the Acknowledged endpoint, but with "Approved" status items.

### Rejected Reimbursements

```
GET /api/reimbursements/approver/{userId}/rejected
```

Returns only reimbursements with "Rejected" status for a specific approver.

**Response Format:** Same structure as the Acknowledged endpoint, but with "Rejected" status items.

## Implementation Details

The dashboard now uses specific endpoints for each tab to improve performance and reduce client-side filtering:

1. When switching tabs, the application calls the appropriate endpoint to fetch only the relevant data.
2. Search filtering is still performed client-side on the data returned from the specific endpoint.
3. Status color coding is handled by the `getStatusColorClass` function, which supports multiple status types.

## Benefits of Server-Side Filtering

1. **Reduced Data Transfer**: Only the necessary data for each tab is transferred over the network.
2. **Improved Performance**: Less client-side processing is needed for filtering.
3. **Better Scalability**: As the number of reimbursements grows, the application will remain responsive. 