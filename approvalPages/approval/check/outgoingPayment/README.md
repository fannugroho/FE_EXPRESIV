# Outgoing Payment Reimbursement Check Page

This page allows authorized users to check outgoing payment reimbursement documents.

## Features

- **Document Loading**: Fetches document details from the API endpoint `/api/staging-outgoing-payments/headers/{id}`
- **User Validation**: Checks if the current user is authorized to check the document
- **Status Management**: Determines document status based on approval dates
- **Action Buttons**: Approve, Reject, and Revision functionality
- **User Names**: Displays user names by fetching from `/api/users` endpoint

## API Integration

### Document Details
- **Endpoint**: `GET /api/staging-outgoing-payments/headers/{id}`
- **Purpose**: Fetches complete document information including approval status

### Users List
- **Endpoint**: `GET /api/users`
- **Purpose**: Gets user information to display names instead of IDs

### Approval Actions
- **Approve**: `POST /api/staging-outgoing-payments/approvals/`
- **Reject**: `POST /api/staging-outgoing-payments/reject`
- **Revision**: `POST /api/staging-outgoing-payments/revise`

## User Permissions

The page implements the following permission logic:

1. **Assigned Checker**: If the current user is the assigned checker and the document status is "Prepared", they can perform checking actions
2. **Above Checker**: If the current user is above the checker in hierarchy, they must wait for the assigned checker to complete their task
3. **Already Checked**: If the document has already been checked, no further actions are allowed

## Status Determination

Document status is determined by checking the presence of approval dates:

- **Prepared**: No approval dates set
- **Checked**: `checkedDate` is set
- **Acknowledged**: `acknowledgedDate` is set
- **Approved**: `approvedDate` is set
- **Received**: `receivedDate` is set
- **Rejected**: `rejectedDate` is set

## Button States

- **Default**: All action buttons are disabled and styled with reduced opacity
- **Enabled**: When user has permission, buttons are enabled and fully styled
- **Disabled**: When user lacks permission or document is already processed

## Error Handling

- Authentication errors redirect to login page
- API errors show user-friendly messages
- Invalid document states prevent actions with appropriate messages

## Usage

1. Navigate to the page with a document ID parameter: `?id=OP_1752765116277_qpo8rqou5`
2. The page automatically loads document details and user permissions
3. If authorized, action buttons become available
4. Perform checking actions as needed

## Dependencies

- `auth.js`: Authentication and API request utilities
- `sweetalert2`: User interface notifications
- `tailwindcss`: Styling framework 