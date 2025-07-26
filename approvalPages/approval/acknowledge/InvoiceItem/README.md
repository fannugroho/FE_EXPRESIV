# Invoice Item Acknowledgment Pages

## Overview
This directory contains the acknowledgment pages for Invoice Item documents in the approval workflow. The pages allow users to view and acknowledge invoice item documents that are pending acknowledgment.

## Files

### 1. acknowInvItem.html
**Purpose**: Main acknowledgment page for invoice item documents

**Key Features**:
- **Document Display**: Shows all invoice item details in read-only format
- **Header Information**: Displays invoice header data (DocNum, CardCode, CardName, etc.)
- **Item Table**: Shows all invoice line items with quantities, prices, and totals
- **Totals Section**: Displays calculated totals (PriceBefDi, VatSum, DocTotal)
- **Comments**: Shows document comments in read-only format
- **Approval Fields**: Displays all approval participants (Prepared, Acknowledged, Checked, Approved, Received)
- **Rejection Remarks**: Shows rejection remarks if document was previously rejected
- **Action Buttons**: Reject and Acknowledge buttons for approval workflow

**Layout Structure**:
- Two-column grid for header information
- Scrollable table for item details
- Footer totals section
- Comments section
- Approval participants section
- Action buttons

**Styling Features**:
- Responsive design with Tailwind CSS
- Custom column widths for better data display
- Text wrapping for long content
- Disabled form fields (read-only mode)
- Custom scrollbars for better UX

### 2. acknowInvItem.js
**Purpose**: JavaScript functionality for the acknowledgment page

**Key Functions**:

#### Data Loading
- `loadDocumentData(documentId)`: Fetches and loads document data from API
- `populateFormFields(data)`: Populates header form fields with document data
- `populateTableData(items)`: Populates the item table with line items
- `populateApprovalFields(data)`: Populates approval participant fields
- `handleDocumentStatus(data)`: Handles document status and shows/hides rejection remarks

#### Table Management
- `createTableRow(item, index)`: Creates table rows for item display
- `addEmptyRow()`: Adds empty row when no items exist
- `refreshTextWrapping()`: Applies text wrapping to table content

#### Approval Actions
- `approveInvItem()`: Handles acknowledgment approval with confirmation dialog
- `rejectInvItem()`: Handles rejection with reason input dialog
- `goToMenuAcknowInvItem()`: Navigation back to acknowledgment menu

**API Integration**:
- GET `/api/invoice-items/{id}`: Fetch document data
- POST `/api/invoice-items/acknowledge`: Submit acknowledgment
- POST `/api/invoice-items/reject`: Submit rejection

## Features

### Document Display
- **Read-only Mode**: All fields are disabled to prevent editing
- **Complete Data**: Shows all invoice item information including header and line items
- **Formatted Display**: Proper formatting for numbers, dates, and text fields

### Approval Workflow
- **Acknowledge Action**: Allows users to acknowledge the document
- **Reject Action**: Allows users to reject with reason
- **Status Tracking**: Tracks approval status and participants
- **Audit Trail**: Maintains approval history

### User Experience
- **Loading States**: Shows loading indicators during API calls
- **Confirmation Dialogs**: SweetAlert2 dialogs for user confirmations
- **Error Handling**: Proper error messages and handling
- **Navigation**: Easy navigation back to menu

### Responsive Design
- **Mobile Friendly**: Responsive layout for different screen sizes
- **Table Scrolling**: Horizontal scroll for wide tables
- **Text Wrapping**: Automatic text wrapping for long content

## Integration Points

### Authentication
- Uses `auth.js` for user authentication
- Gets current user information for approval tracking

### Navigation
- Links to acknowledgment dashboard menu
- Supports URL parameters for document ID

### API Endpoints
- Document retrieval endpoint
- Approval submission endpoints
- Error handling for API failures

## Usage

1. **Access**: Navigate to the page with document ID parameter
2. **Review**: View all document details in read-only format
3. **Approve**: Click "Acknowledge" button to approve the document
4. **Reject**: Click "Reject" button to reject with reason
5. **Navigate**: Use "Back" button to return to menu

## Dependencies

- **Tailwind CSS**: For styling and responsive design
- **SweetAlert2**: For confirmation dialogs and notifications
- **auth.js**: For user authentication and session management
- **Browser APIs**: Fetch API for HTTP requests

## Browser Compatibility

- Modern browsers with ES6+ support
- Fetch API support required
- CSS Grid and Flexbox support needed
- SweetAlert2 library compatibility

## Security Considerations

- All form fields are read-only to prevent unauthorized changes
- User authentication required for approval actions
- API endpoints should validate user permissions
- Input validation on rejection reasons

## Future Enhancements

- **Print Functionality**: Add print capability for documents
- **Email Notifications**: Send notifications on approval/rejection
- **Audit Log**: Enhanced audit trail functionality
- **Bulk Operations**: Support for bulk acknowledgment
- **Advanced Filtering**: Enhanced search and filter capabilities 