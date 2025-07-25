# Invoice Item Approval Pages

## Overview
This directory contains the new invoice item approval functionality for the Expressiv System. The pages are designed to handle the approval workflow for invoice items, similar to the existing purchase request approval system.

## Files Created

### 1. `approveInvItem.html`
**Location**: `approvalPages/approval/approve/invoiceItem/approveInvItem.html`

**Purpose**: Main approval page for invoice items

**Features**:
- Displays invoice item details in a read-only format
- Shows all invoice header information (DocEntry, DocNum, CardCode, CardName, etc.)
- Displays item details in a table format with columns:
  - No. (line number)
  - Item Code
  - Item Name
  - Catatan (Notes)
  - Sales Qty
  - Inv. Qty
  - Sales Price
  - Price
  - Disc (Discount)
  - Tax Code
  - Total Price
- Shows totals (Total Before Discount, Total Tax, Total Amount)
- Displays comments section
- Shows approval signatories (Prepared by, Acknowledge by, Checked by, Approved by, Received by)
- Action buttons: Reject and Approved
- Responsive design with text wrapping functionality
- Rejection remarks display section

**Key Differences from Check Page**:
- Button text changed from "Checked" to "Approved"
- Navigation function points to approve menu
- Uses approval API endpoints instead of check endpoints

### 2. `approveInvItem.js`
**Location**: `approvalPages/approval/approve/invoiceItem/approveInvItem.js`

**Purpose**: JavaScript functionality for the approval page

**Key Functions**:
- `loadDocumentData(documentId)`: Loads invoice item data from API
- `populateFormFields(data)`: Populates form fields with document data
- `populateTableData(items)`: Populates table with item details
- `createTableRow(item, index)`: Creates table rows for items
- `populateApprovalFields(data)`: Populates approval signatory fields
- `handleDocumentStatus(data)`: Handles document status and rejection remarks
- `approveInvItem()`: Handles approval action
- `rejectInvItem()`: Handles rejection action
- `goToMenuApproveInvItem()`: Navigation to approve menu

**API Endpoints Used**:
- `GET /api/invoice-items/{id}`: Fetch invoice item data
- `POST /api/invoice-items/approve`: Approve invoice item
- `POST /api/invoice-items/reject`: Reject invoice item

## Design Decisions

### 1. Consistent Structure
- Follows the same structure as existing approval pages
- Uses the same styling and layout as `checkInvItem.html`
- Maintains consistency with the overall system design

### 2. Read-Only Interface
- All form fields are disabled/read-only
- Users can only approve or reject, not edit data
- Maintains data integrity during approval process

### 3. Approval Workflow
- Implements standard approval workflow (approve/reject)
- Includes rejection reason requirement
- Shows approval history and signatories

### 4. Responsive Design
- Uses Tailwind CSS for responsive design
- Implements text wrapping for long content
- Optimized for different screen sizes

### 5. Error Handling
- Comprehensive error handling for API calls
- User-friendly error messages using SweetAlert2
- Loading states during operations

## Integration Points

### 1. Authentication
- Uses `auth.js` for user authentication
- Gets current user information for approval tracking

### 2. Navigation
- Integrates with existing dashboard navigation
- Points to appropriate menu pages

### 3. API Integration
- Uses `BASE_URL` from auth.js for API calls
- Follows RESTful API patterns
- Handles JSON responses

## Usage

### Accessing the Page
The approval page can be accessed via:
```
approvalPages/approval/approve/invoiceItem/approveInvItem.html?id={documentId}
```

### Required Parameters
- `id`: The document ID of the invoice item to approve

### User Permissions
- Users must have appropriate approval permissions
- Current user information is used for approval tracking

## Future Enhancements

### 1. Print Functionality
- Could add print capability similar to purchase request approval
- Generate PDF reports of approved documents

### 2. Email Notifications
- Integrate with email notification system
- Send approval/rejection notifications

### 3. Audit Trail
- Enhanced audit trail functionality
- Detailed approval history tracking

### 4. Bulk Operations
- Support for bulk approval operations
- Batch processing capabilities

## Testing Considerations

### 1. API Testing
- Test all API endpoints
- Verify error handling
- Test with various document states

### 2. UI Testing
- Test responsive design
- Verify text wrapping functionality
- Test approval/rejection workflows

### 3. Integration Testing
- Test with authentication system
- Verify navigation flows
- Test with existing dashboard

## Dependencies

### External Libraries
- Tailwind CSS 2.2.19
- SweetAlert2 11
- HTML2PDF.js (for future print functionality)

### Internal Dependencies
- `auth.js`: Authentication and user management
- `BASE_URL`: API base URL configuration

## Maintenance

### Code Organization
- Clear separation of concerns
- Modular JavaScript functions
- Consistent naming conventions

### Documentation
- Comprehensive inline comments
- Clear function documentation
- README file for reference

### Version Control
- Follows existing project structure
- Consistent with existing codebase
- Ready for version control integration 