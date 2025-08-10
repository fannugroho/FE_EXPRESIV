# Check Invoice Item - PATCH API Implementation

## Overview
This document describes the implementation of PATCH API functionality for the Check Invoice Item page, allowing users to check or reject invoice items with proper status management.

## Features Implemented

### 1. Button Visibility Management
- **Checked Button**: Only visible when document status is "Prepared"
- **Reject Button**: Only visible when document status is "Prepared"
- **Status Messages**: Display informative messages for non-actionable statuses

### 2. API PATCH Implementation
- **Endpoint**: `PATCH /api/ar-invoices/approval/{stagingID}`
- **Status Updates**: 
  - "Checked" when Checked button is clicked
  - "Rejected" when Reject button is clicked
- **Additional Data**: Includes user information, timestamps, and rejection remarks

### 3. Status Validation
- Only documents with status "Prepared" can be checked or rejected
- Proper error messages for invalid actions
- Status-based UI updates

### 4. Rejection Remarks Display
- **Conditional Display**: Rejection remarks section only shows when `revisionRemarks` or `rejectionRemarks` has valid value
- **Validation**: Checks for null, undefined, empty string, and whitespace-only values
- **Fallback Logic**: Checks both `revisionRemarks` and `rejectionRemarks` fields from API response
- **Default State**: Section is hidden by default in HTML

## API Payload Structure

### For Checked Status
```json
{
  "approvalStatus": "Checked",
  "checkedBy": "kansaiEmployeeId",
  "checkedByName": "User Full Name",
  "checkedDate": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### For Rejected Status
```json
{
  "approvalStatus": "Rejected",
  "checkedBy": "kansaiEmployeeId",
  "checkedByName": "User Full Name",
  "checkedDate": "2024-01-01T00:00:00.000Z",
  "rejectionRemarks": "Reason for rejection",
  "rejectedDate": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Status Flow

### Document Statuses
1. **Draft**: Initial status, not ready for checking
2. **Prepared**: Ready for checking (buttons visible)
3. **Checked**: Document has been checked
4. **Rejected**: Document has been rejected
5. **Approved**: Document has been approved
6. **Received**: Document has been received

### Button Visibility Rules
- **Prepared**: Both Checked and Reject buttons visible
- **Other Statuses**: Buttons hidden, status message displayed

## Functions Implemented

### `updateButtonVisibility()`
- Controls button visibility based on document status
- Shows appropriate status messages for non-actionable statuses
- Updates UI dynamically when data loads

### `approveInvItem()`
- Handles Checked button click
- Validates document status is "Prepared"
- Shows confirmation dialog
- Calls PATCH API with "Checked" status

### `rejectInvItem()`
- Handles Reject button click
- Validates document status is "Prepared"
- Shows dialog for rejection remarks
- Calls PATCH API with "Rejected" status and remarks

### `updateInvItemStatus(status, remarks)`
- Core PATCH API implementation
- Prepares payload based on status
- Handles API response and error cases
- Shows success/error messages
- Navigates back to menu on success

## User Data Management

### `fetchUsers()`
- Fetches all users from API endpoint `/api/users`
- Stores user data including kansaiEmployeeId and fullName
- Called during page initialization
- Non-critical error handling (doesn't block page functionality)

### `getCurrentUserKansaiEmployeeId()`
- Finds current user in fetched user data
- Returns kansaiEmployeeId if available
- Falls back to userId/username if kansaiEmployeeId not found
- Used for checkedBy field in API payload

### `getCurrentUserFullName()`
- Finds current user in fetched user data
- Returns fullName if available
- Falls back to username if fullName not found
- Used for checkedByName field in API payload

## Error Handling

### API Errors
- Network errors
- Server errors (500)
- Not found errors (404)
- Invalid response format

### Validation Errors
- Invalid document status for action
- Missing rejection remarks
- No document data available

## UI Components

### Buttons
- **Checked Button**: Green button for approving documents
- **Reject Button**: Red button for rejecting documents
- Both buttons have proper hover effects and transitions

### Status Messages
- **Checked**: Blue background with checkmark icon
- **Rejected**: Red background with X icon
- **Approved**: Green background with checkmark icon
- **Draft**: Yellow background with warning icon
- **Other**: Gray background with info icon

## Development Mode
- Bypasses authentication for development
- Uses dummy user data
- Enables testing without login

## Usage

### Loading the Page
1. Navigate to the check invoice item page with `stagingId` parameter
2. Page automatically loads document data
3. Buttons are shown/hidden based on status
4. Status message displayed if buttons are hidden

### Checking a Document
1. Ensure document status is "Prepared"
2. Click "Checked" button
3. Confirm action in dialog
4. API updates status to "Checked"
5. Success message shown
6. Redirect to menu

### Rejecting a Document
1. Ensure document status is "Prepared"
2. Click "Reject" button
3. Enter rejection remarks
4. Confirm action in dialog
5. API updates status to "Rejected"
6. Success message shown
7. Redirect to menu

## Technical Details

### API Configuration
- **Base URL**: `https://expressiv-be-sb.idsdev.site/api`
- **Method**: PATCH
- **Headers**: 
  - `accept: text/plain`
  - `Content-Type: application/json`

### Data Flow
1. Load user data from API to get kansaiEmployeeId and full name
2. Load document data from API
3. Populate form fields
4. Update button visibility
5. Handle user actions
6. Validate status
7. Prepare API payload with kansaiEmployeeId and full name
8. Make PATCH request
9. Handle response
10. Show feedback
11. Navigate if successful

### Security Considerations
- Status validation prevents unauthorized actions
- User information included in API calls
- Proper error handling for all scenarios
- Input validation for rejection remarks

## Testing

### Test Cases
1. **Valid Check**: Document with "Prepared" status
2. **Valid Reject**: Document with "Prepared" status + remarks
3. **Invalid Status**: Try to check/reject non-Prepared documents
4. **Network Error**: Test with invalid API endpoint
5. **Server Error**: Test with server issues
6. **Missing Data**: Test with incomplete document data

### Test Scenarios
- Load page with valid stagingId
- Load page with invalid stagingId
- Check document successfully
- Reject document successfully
- Try to check already checked document
- Try to reject already rejected document
- Test with different document statuses
- Test error handling scenarios 