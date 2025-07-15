# API Endpoint Implementation for Reimbursement Check Dashboard

## Overview
This document explains how the Reimbursement Check Dashboard uses different API endpoints for each tab (Prepared, Checked, Rejected) instead of client-side filtering.

## API Endpoints Used

### 1. Tab "Prepared"
- **Endpoint**: `/api/reimbursements/checker/{userId}/prepared`
- **Method**: GET
- **Description**: Fetches all reimbursement documents with "Prepared" status for specific checker
- **Usage**: When user clicks on "Prepared" tab

### 2. Tab "Checked" 
- **Endpoint**: `/api/reimbursements/checker/{userId}/checked`
- **Method**: GET
- **Description**: Fetches all reimbursement documents with "Checked" status for specific checker
- **Usage**: When user clicks on "Checked" tab

### 3. Tab "Rejected"
- **Endpoint**: `/api/reimbursements/checker/{userId}/rejected`
- **Method**: GET
- **Description**: Fetches all reimbursement documents with "Rejected" status for specific checker
- **Usage**: When user clicks on "Rejected" tab

## Implementation Details

### Function: `fetchReimbursementsByStatus(status)`
This function replaces the previous client-side filtering approach with server-side filtering:

```javascript
function fetchReimbursementsByStatus(status) {
    const userId = getUserId();
    let endpoint;
    
    // Map tab names to specific endpoints
    const endpointMap = {
        'prepared': `/api/reimbursements/checker/${userId}/prepared`,
        'checked': `/api/reimbursements/checker/${userId}/checked`,
        'rejected': `/api/reimbursements/checker/${userId}/rejected`
    };
    
    endpoint = endpointMap[status];
    if (!endpoint) {
        console.error('Invalid status:', status);
        return;
    }
    
    // Fetch data from specific endpoint
    fetch(`${BASE_URL}${endpoint}`)
        .then(response => response.json())
        .then(data => {
            if (data.status && data.code === 200) {
                allReimbursements = data.data;
                // Apply search filter if active
                const searchTerm = document.getElementById('searchInput').value.toLowerCase();
                if (searchTerm) {
                    filterReimbursements(searchTerm, status, searchType);
                } else {
                    filteredData = allReimbursements;
                    updateTable();
                    updatePagination();
                }
            }
        });
}
```

### Function: `switchTab(tabName)`
Modified to use specific API endpoints instead of client-side filtering:

```javascript
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    // ... (styling code)
    
    // Fetch data from specific API endpoint for each tab
    setTimeout(() => {
        fetchReimbursementsByStatus(tabName);
    }, 200);
}
```

## Benefits of This Approach

1. **Better Performance**: Server-side filtering reduces data transfer and client-side processing
2. **Real-time Data**: Each tab fetches fresh data from the server
3. **Scalability**: Can handle large datasets more efficiently
4. **Consistency**: Data is always up-to-date with the server
5. **Reduced Memory Usage**: Only loads data for the active tab
6. **Role-based Access**: Endpoints are specific to checker role, ensuring proper authorization
7. **Cleaner URLs**: More RESTful endpoint structure with role and status clearly defined
8. **Better Security**: User ID is embedded in the URL, preventing unauthorized access to other users' data

## Error Handling

- If API call fails, the system falls back to sample data
- Network errors are logged to console
- User experience is maintained even if API is unavailable

## Search Functionality

Search functionality works with the new implementation:
- Search is applied after fetching data from the specific endpoint
- Search filters are applied client-side for better responsiveness
- Search works across all fields (Reimbursement Number, Requester, Date)
- Since server-side filtering handles status, search only filters by search criteria

## Expected Response Format

The API endpoints return data in the following format:

```json
{
  "status": true,
  "code": 200,
  "message": "Prepared reimbursements for checker 'f17f5373-61af-4d48-9686-2d3f64ade525' retrieved successfully",
  "data": [
    {
      "id": "136928db-7a1f-409f-8a5f-7e447a0ec675",
      "voucherNo": "REIM/036/0725",
      "requesterName": "Dalari",
      "department": "Production Direct",
      "currency": "IDR",
      "payTo": "5d20eb00-a280-43a9-a372-bb8ebc17842a",
      "submissionDate": "2025-07-15T13:11:45.0757604",
      "status": "Prepared",
      "referenceDoc": "INV-2025-0010",
      "typeOfTransaction": "Entertainment",
      "remarks": "",
      "preparedBy": "f17f5373-61af-4d48-9686-2d3f64ade525",
      "checkedBy": "f17f5373-61af-4d48-9686-2d3f64ade525",
      "acknowledgedBy": "f17f5373-61af-4d48-9686-2d3f64ade525",
      "approvedBy": "f17f5373-61af-4d48-9686-2d3f64ade525",
      "receivedBy": "f17f5373-61af-4d48-9686-2d3f64ade525",
      "preparedDate": "2025-07-15T13:11:45.0760775",
      "checkedDate": null,
      "rejectedDateByChecker": null,
      "remarksRejectByChecker": "",
      "acknowledgedDate": null,
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
      "totalAmount": 11111110,
      "createdAt": "2025-07-15T20:11:45.0945318",
      "updatedAt": "2025-07-15T20:11:45.0945318",
      "reimbursementDetails": [...],
      "reimbursementAttachments": [...]
    }
  ]
}
```

### Supported Status Values:
- `Prepared` / `Draft` - Yellow badge
- `Checked` - Green badge  
- `Acknowledged` - Blue badge
- `Approved` - Purple badge
- `Received` - Indigo badge
- `Rejected` - Red badge
- `Closed` - Gray badge

## Status Counts

Status counts are fetched separately using:
- **Endpoint**: `/api/reimbursements/status-counts/checker/${userId}`
- **Purpose**: Updates the dashboard cards showing total counts for each status

## Comparison with Previous Endpoints

### Previous Endpoints (Generic)
```
/api/reimbursements/status/Prepared?checkerId={userId}
/api/reimbursements/status/Checked?checkerId={userId}
/api/reimbursements/status/Rejected?checkerId={userId}
```

### New Endpoints (Role-Specific)
```
/api/reimbursements/checker/{userId}/prepared
/api/reimbursements/checker/{userId}/checked
/api/reimbursements/checker/{userId}/rejected
```

### Advantages of New Endpoints:
1. **More RESTful**: Clear hierarchy with role and status
2. **Better Security**: User ID is part of the path, not query parameter
3. **Cleaner Code**: No need to append query parameters
4. **Role-specific**: Endpoints are designed specifically for checker role
5. **Easier to Cache**: URLs are more predictable and cacheable

## Backward Compatibility

The implementation maintains backward compatibility:
- Falls back to sample data if API is unavailable
- Maintains the same UI/UX as before
- Search functionality remains unchanged
- Export functionality (Excel/PDF) continues to work 