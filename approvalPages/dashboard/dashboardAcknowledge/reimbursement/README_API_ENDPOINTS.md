# API Endpoint Implementation for Reimbursement Acknowledge Dashboard

## Overview
This document explains how the Reimbursement Acknowledge Dashboard uses different API endpoints for each tab (Checked, Acknowledged, Rejected) instead of client-side filtering.

## API Endpoints Used

### 1. Tab "Checked"
- **Endpoint**: `/api/reimbursements/acknowledger/{userId}/checked`
- **Method**: GET
- **Description**: Fetches all reimbursement documents with "Checked" status for specific acknowledger
- **Usage**: When user clicks on "Checked" tab

### 2. Tab "Acknowledged" 
- **Endpoint**: `/api/reimbursements/acknowledger/{userId}/acknowledged`
- **Method**: GET
- **Description**: Fetches all reimbursement documents with "Acknowledged" status for specific acknowledger
- **Usage**: When user clicks on "Acknowledged" tab

### 3. Tab "Rejected"
- **Endpoint**: `/api/reimbursements/acknowledger/{userId}/rejected`
- **Method**: GET
- **Description**: Fetches all reimbursement documents with "Rejected" status for specific acknowledger
- **Usage**: When user clicks on "Rejected" tab

## Implementation Details

### Function: `fetchReimbursementsByStatus(status)`
This function replaces the previous client-side filtering approach with server-side filtering:

```javascript
function fetchReimbursementsByStatus(status) {
    const userId = getUserId();
    let endpoint;
    
    // Map tab names to role-specific endpoints
    const endpointMap = {
        'checked': `/api/reimbursements/acknowledger/${userId}/checked`,
        'acknowledged': `/api/reimbursements/acknowledger/${userId}/acknowledged`,
        'rejected': `/api/reimbursements/acknowledger/${userId}/rejected`
    };
    
    endpoint = endpointMap[status];
    
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

## Expected Response Format

The API endpoints return data in the following format:

```json
{
  "status": true,
  "code": 200,
  "message": "Checked reimbursements for acknowledger 'f17f5373-61af-4d48-9686-2d3f64ade525' retrieved successfully",
  "data": [
    {
      "id": "60f794e3-d962-404a-82ac-97b0fcfde2a2",
      "voucherNo": "REIM/032/0725",
      "requesterName": "Dalari",
      "department": "Production Direct",
      "currency": "IDR",
      "submissionDate": "2025-07-15T03:05:25.388832",
      "status": "Checked",
      "referenceDoc": "INV09",
      "typeOfTransaction": "Entertainment",
      "remarks": "entertainment",
      "totalAmount": 2524313,
      "createdAt": "2025-07-15T10:05:25.3896358",
      "updatedAt": "2025-07-15T13:09:59.3253648",
      "reimbursementDetails": [...],
      "reimbursementAttachments": [...]
    }
  ]
}
```

### Supported Status Values:
- `Checked` - Green badge  
- `Acknowledged` - Blue badge
- `Approved` - Purple badge
- `Received` - Indigo badge
- `Rejected` - Red badge
- `Closed` - Gray badge

## Benefits of This Approach

1. **Better Performance**: Server-side filtering reduces data transfer and client-side processing
2. **Real-time Data**: Each tab fetches fresh data from the server
3. **Scalability**: Can handle large datasets more efficiently
4. **Consistency**: Data is always up-to-date with the server
5. **Reduced Memory Usage**: Only loads data for the active tab
6. **Role-based Access**: Endpoints are specific to acknowledger role, ensuring proper authorization
7. **Cleaner URLs**: More RESTful endpoint structure with role and status clearly defined
8. **Better Security**: User ID is embedded in the URL, preventing unauthorized access to other users' data

## Error Handling

- If API call fails, the system displays an error message
- Network errors are logged to console
- User experience is maintained by showing clear error messages

## Search Functionality

Search functionality works with the new implementation:
- Search is applied after fetching data from the specific endpoint
- Search filters are applied client-side for better responsiveness
- Search works across all fields (Reimbursement Number, Requester, Date)
- Since server-side filtering handles status, search only filters by search criteria

## Status Counts

Status counts are fetched separately using:
- **Endpoint**: `/api/reimbursements/status-counts/acknowledger/${userId}`
- **Purpose**: Updates the dashboard cards showing total counts for each status 