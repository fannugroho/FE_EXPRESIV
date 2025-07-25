# Invoice Item Check Pages

## Overview
This directory contains the invoice item checking functionality for the approval system. The pages allow checkers to review and approve/reject invoice items with the same structure as the add invoice item page but with read-only functionality and approval workflow.

## Files

### 1. checkInvItem.html
**Purpose**: Main interface for checking invoice items

**Key Features**:
- **Read-only Display**: All form fields are disabled and display data in read-only mode
- **Same Structure**: Uses identical column structure as `addINVItem.html`
- **Approval Workflow**: Implements checker approval functionality similar to `checkedPR.html`
- **Responsive Design**: Maintains responsive table layout with horizontal scrolling
- **Text Wrapping**: Automatic text wrapping for long content in table cells

**Form Fields**:
- **Header Information**: Invoice No., Customer Code, Customer Name, Base Ref, Currency
- **Document Details**: Document Date, Group Number, Transport Code, Shipping Type, Payment Group, UDF fields
- **Item Table**: Same columns as add page (No., Item Code, Item Name, Catatan, Sales Qty, Inv. Qty, Sales Price, Price, Disc, Tax Code, Total Price)
- **Totals**: Total Before Discount, Total Tax, Total Amount
- **Comments**: Read-only comments field
- **Approval Info**: Prepared by, Acknowledge by, Checked by, Approved by, Received by (all read-only)

**Action Buttons**:
- **Reject**: Reject the invoice item with remarks
- **Checked**: Approve the invoice item for checking

### 2. checkInvItem.js
**Purpose**: JavaScript functionality for the invoice item checking page

**Key Functions**:
- `initializePage()`: Initialize page and load data
- `loadInvItemData()`: Load invoice item data from URL parameters
- `loadInvItemFromAPI()`: Simulate API call to load invoice item data
- `populateInvItemData()`: Populate form fields with loaded data
- `populateItemsTable()`: Populate items table with invoice line items
- `createItemRow()`: Create table row for each item
- `approveInvItem()`: Handle approval action with confirmation
- `rejectInvItem()`: Handle rejection action with remarks input
- `updateInvItemStatus()`: Update invoice item status via API
- `goToMenuCheckInvItem()`: Navigation back to check menu

**Data Structure**:
```javascript
{
    DocEntry: "123",
    DocNum: "INV-2024-001",
    CardCode: "C001",
    CardName: "PT Sample Customer",
    NumAtCard: "EXT-REF-001",
    DocCur: "IDR",
    DocDate: "2024-01-15",
    GroupNum: 1,
    TrnspCode: 1,
    U_BSI_ShippingType: "Standard",
    U_BSI_PaymentGroup: "Group A",
    U_BSI_UDF1: "Custom Field 1",
    U_BSI_UDF2: "Custom Field 2",
    PriceBefDi: 1000000,
    VatSum: 100000,
    DocTotal: 1100000,
    Comments: "Sample invoice item for checking",
    Items: [
        {
            LineNum: 0,
            ItemCode: "ITEM001",
            ItemName: "Sample Item 1",
            FreeTxt: "Sample notes for item 1",
            Quantity: 10,
            InvQty: 10,
            UoM: "PCS",
            SalesPrice: 50000,
            Price: 50000,
            DiscPrcnt: 0,
            TaxCode: "VAT",
            LineTotal: 500000,
            AccountCode: "4000",
            BaseType: 0,
            BaseEntry: 0,
            BaseLine: 0,
            LineType: 0
        }
    ],
    ApprovalInfo: {
        PreparedBy: "John Doe",
        AcknowledgeBy: "Jane Smith",
        CheckedBy: "",
        ApprovedBy: "",
        ReceivedBy: ""
    },
    Status: "Draft",
    RejectionRemarks: ""
}
```

## Key Differences from Add Page

### 1. Read-only Mode
- All form fields are disabled and have gray background
- No editing capabilities for data fields
- Table cells are read-only with disabled inputs

### 2. Approval Workflow
- **Reject Button**: Allows rejection with mandatory remarks
- **Checked Button**: Approves the invoice item for checking
- **No Revision**: Removed revision functionality unlike `checkedPR.html`

### 3. Data Display
- Shows existing approval information
- Displays rejection remarks if document was previously rejected
- All totals are calculated and displayed

### 4. Navigation
- Back button navigates to invoice item check menu
- Success actions redirect to check menu

## Usage

### Accessing the Page
```
URL: checkInvItem.html?docEntry=123
```

### Workflow
1. **Load Data**: Page loads invoice item data based on `docEntry` parameter
2. **Review**: Checker reviews all invoice item details in read-only mode
3. **Decision**: Checker can either:
   - **Approve**: Click "Checked" button to approve
   - **Reject**: Click "Reject" button and provide remarks
4. **Navigation**: After action, redirects to check menu

## Dependencies
- `auth.js`: User authentication and current user functions
- `sweetalert2`: For confirmation dialogs and notifications
- `tailwindcss`: For styling and responsive design

## Integration Points
- **API Integration**: Replace mock data with actual API calls
- **Menu Integration**: Connect to invoice item check dashboard
- **Authentication**: Integrate with existing auth system
- **Database**: Connect to invoice item database tables

## Styling Features
- **Responsive Table**: Horizontal scrolling for wide tables
- **Text Wrapping**: Automatic wrapping for long content
- **Consistent Design**: Matches existing approval page styling
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Security Considerations
- **Authentication**: Requires valid user session
- **Authorization**: Only checkers can access this page
- **Data Validation**: Server-side validation for all inputs
- **Audit Trail**: Log all approval/rejection actions 