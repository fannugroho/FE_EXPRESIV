# Tab-Based Data Fetching Implementation for Outgoing Payments

## Overview
This implementation provides efficient tab-based data fetching for Outgoing Payments on two separate pages using the `onlyCurrentStep` parameter to distinguish between "To-Do" lists and historical views.

## Implementation Details

### Core Functionality
The implementation uses a reusable `fetchOutgoingPaymentDocuments` function that accepts an additional `onlyCurrentStep` boolean parameter:

```javascript
async function fetchOutgoingPaymentDocuments(step, userId, onlyCurrentStep = false)
```

### API Endpoint
- **Method**: GET
- **Endpoint**: `/api/staging-outgoing-payments/headers`
- **Query Parameters**:
  - `step`: The approval stage to filter by (e.g., PreparedBy, CheckedBy)
  - `userId`: The unique identifier of the currently logged-in user
  - `onlyCurrentStep`: Boolean parameter (true/false)
  - `includeDetails`: Set to false for performance

### Parameter Behavior
- **`onlyCurrentStep = true`**: Fetches only documents currently waiting at the specified step (To-Do list)
- **`onlyCurrentStep = false`**: Fetches all documents the user is involved with at that step, including historical data

## Part 1: Preparer's Page (`/pages/menuOPReim.html`)

### Tab Structure
1. **"All Documents" Tab** (Default)
   - **API Call**: `fetchOutgoingPaymentDocuments('PreparedBy', userId, true)`
   - **Behavior**: Shows only documents currently waiting at the prepared step
   - **Use Case**: Active work list for documents waiting to be processed

2. **"Prepared" Tab**
   - **API Call**: `fetchOutgoingPaymentDocuments('PreparedBy', userId, false)`
   - **Behavior**: Shows complete history of all documents the user has prepared
   - **Use Case**: Historical view for tracking all prepared documents

### Implementation Files
- **HTML**: `pages/menuOPReim.html`
- **JavaScript**: `js/menuOPReim.js`

### Key Functions Modified
1. `fetchOutgoingPaymentDocuments()` - Added `onlyCurrentStep` parameter
2. `fetchAllDocuments()` - Uses `onlyCurrentStep = false` for historical view
3. `fetchPreparedDocuments()` - Uses `onlyCurrentStep = true` for active work
4. `switchTab()` - Updated to handle both views correctly
5. `loadDashboard()` - Defaults to "All Documents" view

## Part 2: Checker's Page (`/approvalPages/dashboard/dashboardCheck/OPReim/menuOPReimCheck.html`)

### Tab Structure
1. **"All Documents" Tab** (Default)
   - **API Call**: `fetchOutgoingPaymentDocuments('CheckedBy', userId, false)`
   - **Behavior**: Shows all documents this user is assigned to check, regardless of current status
   - **Use Case**: Historical view for tracking all checked documents

2. **"Checked" Tab**
   - **API Call**: `fetchOutgoingPaymentDocuments('CheckedBy', userId, true)`
   - **Behavior**: Shows only documents currently waiting for this user's check
   - **Use Case**: Active To-Do list for documents requiring immediate attention

3. **"Rejected" Tab**
   - **API Call**: `fetchOutgoingPaymentDocuments('RejectedBy', userId, false)`
   - **Behavior**: Shows all rejected documents
   - **Use Case**: Historical view of rejected documents

### Implementation Files
- **HTML**: `approvalPages/dashboard/dashboardCheck/OPReim/menuOPReimCheck.html`
- **JavaScript**: `approvalPages/dashboard/dashboardCheck/OPReim/menuOPReimCheck.js`

### Key Functions Modified
1. `fetchOutgoingPaymentDocuments()` - Added `onlyCurrentStep` parameter
2. `fetchAllDocuments()` - Uses `onlyCurrentStep = false` for historical view
3. `fetchCheckedDocuments()` - Uses `onlyCurrentStep = true` for active work
4. `switchTab()` - Updated to handle all three views correctly
5. `loadDashboard()` - Defaults to "All Documents" view
6. `updateCounters()` - Updated to reflect correct labels

## API Response Structure
The API returns an array of objects with the following structure:

```json
[
  {
    "stagingID": "OP_1752906434370_bx94lw9tg",
    "cardName": "Dalari",
    "counterRef": "REIM/087/0725",
    "comments": "entertainment A",
    "trsfrSum": 200,
    "requesterName": "Steve Wisnu Perdana",
    "approval": {
      "approvalStatus": "Checked",
      "preparedByName": "Steve Wisnu Perdana",
      "checkedByName": "Dalari",
      "checkedDate": "2025-07-19T07:27:14.374"
    },
    "attachments": [
        { "attachmentID": 8, "fileName": "TESTING ATTACH DOCUMENT.pdf" },
        { "attachmentID": 9, "fileName": "PR PRINT OUT APPROVED.pdf" }
    ]
  }
]
```

## User Experience Improvements

### Preparer's Page
- **Default View**: "All Documents" shows complete history
- **Active Work**: "Prepared" tab shows only current work items
- **Clear Labels**: Tab names clearly indicate functionality

### Checker's Page
- **Default View**: "All Documents" shows complete history
- **Active Work**: "Checked" tab shows only pending items
- **Updated Labels**: Status cards reflect correct functionality

## Technical Benefits
1. **Efficient API Calls**: Single API call per tab with appropriate parameters
2. **Clear Separation**: To-Do lists vs. historical views
3. **Consistent Interface**: Same pattern across both pages
4. **Performance**: Reduced data transfer with `includeDetails=false`
5. **Scalability**: Easy to extend to other approval stages

## Error Handling
- Graceful fallback to empty state on API errors
- Console logging for debugging
- User-friendly error messages
- Network error recovery

## Future Enhancements
1. Add caching for frequently accessed data
2. Implement real-time updates using WebSocket
3. Add export functionality for filtered data
4. Implement advanced search and filtering options
5. Add bulk operations for selected documents 