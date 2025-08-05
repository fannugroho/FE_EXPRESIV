# ARInvoice Form Structure Fixes

## Overview

This document outlines the comprehensive changes made to fix the ARInvoice form structure, converting it from an outgoing payment/reimbursement form to a proper AR Invoice form that matches the backend API requirements.

## Major Changes Made

### 1. Form Header Fields (Left Column)

**Before (Outgoing Payment Fields):**

- Reimburse No (CounterRef)
- Requester Payment (RequesterName)
- Pay To (CardName)
- Pay To Address (Address) - hidden
- Document Date (DocDate)
- Due Date (DocDueDate)

**After (AR Invoice Fields):**

- Document Number (DocNum)
- Document Type (Doctype) - dropdown with A/S/D options
- Card Code (CardCode)
- Card Name (CardName)
- Address (Address) - visible
- Number at Card (NumAtCard)
- Document Date (DocDate)
- Due Date (DocDueDate)

### 2. Form Header Fields (Right Column)

**Before (Outgoing Payment Fields):**

- DocNum (readonly)
- Journal Memo (jrnlMemo)
- Remittance Request Currency (DocCurr)
- Remittance Request Amount (RemittanceRequestAmount)
- Transfer Date (TrsfrDate)
- Account Bank Transfer (TrsfrAcct)

**After (AR Invoice Fields):**

- Document Currency (DocCurr)
- Document Rate (DocRate)
- VAT Sum (VatSum)
- VAT Sum FC (VatSumFC)
- WT Sum (WTSum)
- WT Sum FC (WTSumFC)
- Document Total (DocTotal)
- Document Total FC (DocTotalFC)
- Transport Code (TrnspCode)
- Shipping Type (ShippingType)
- Group Number (GroupNum)
- Payment Group (PaymentGroup)
- Invoice Number (InvNum)
- UDF1 (UDF1)
- UDF2 (UDF2)
- Track Number (TrackNo)
- Is Transfered (IsTransfered) - dropdown
- Prepared By NIK (PreparedByNIK)
- Prepared By Name (PreparedByName)

### 3. Line Items Table Structure

**Before (Outgoing Payment Structure):**

- G/L Account (AcctCode)
- Account Name (AcctName)
- Description (description)
- Currency (CurrencyItem)
- Net Amount (DocTotal)

**After (AR Invoice Structure):**

- Line # (LineNum)
- Item Code (ItemCode)
- Description (Dscription)
- G/L Account (AcctCode)
- Quantity (Quantity)
- Unit Price (PriceBefDi)
- Line Total (LineTotal)

### 4. Totals Section

**Before:**

- Net Total (hidden)
- Total Tax (hidden)
- Total Amount Due (currency summary)
- Total Outstanding Transfers

**After:**

- Sub Total (subTotal)
- VAT Total (vatTotal)
- WT Total (wtTotal)
- Document Total (documentTotal)

### 5. Remarks Section

**Before:**

- Remarks (remarks)
- Journal Remarks (journalRemarks)

**After:**

- Comments (remarks) - simplified to single field

### 6. Attachments Section

**Before:**

- Hidden/commented out file upload
- Print Out Reimbursement section

**After:**

- Active file upload section with proper ID (attachment)
- Existing attachments display
- Removed reimbursement-specific sections

## JavaScript Changes

### 1. Data Collection Logic

**Updated `collectFormData` function:**

- Changed field mappings to match new ARInvoice structure
- Updated line item collection to use new field names
- Added proper validation for new required fields
- Removed outgoing payment specific logic

### 2. Validation Logic

**Updated validation rules:**

- Added CardCode as required field
- Updated line item validation to check ItemCode
- Changed validation messages to match ARInvoice terminology

### 3. Total Calculation

**Updated `updateTotalAmountDue` function:**

- Changed from currency-based calculation to line total summation
- Added VAT and WT total calculations
- Updated to use new total field IDs
- Added automatic line total calculation based on quantity × unit price

### 4. Form Mapping

**Updated `mapResponseToForm` function:**

- Changed field mappings to match ARInvoice DTO structure
- Updated to handle new field names and data types
- Removed outgoing payment specific field mappings

### 5. Event Listeners

**Added new functions:**

- `calculateLineTotal()` - Automatically calculates line total from quantity and unit price
- `setupLineItemListeners()` - Sets up event listeners for automatic calculations

## API Integration

### 1. Endpoint Updates

- All API calls now use `/api/ar-invoices` endpoints
- Attachment upload uses `/api/ar-invoices/{stagingId}/attachments/upload`
- Proper FormData handling for file uploads

### 2. Data Structure

- Request body matches `ARInvoiceForCreationDto`
- Line items use `ARInvoiceDetailForCreationDto` structure
- Attachments use `ARInvoiceAttachmentForCreationDto` structure

## Form Behavior

### 1. Automatic Calculations

- Line totals automatically calculated when quantity or unit price changes
- Document totals automatically updated when line items change
- VAT and WT totals can be manually entered and affect document total

### 2. Validation

- Required fields: Document Number, Card Code, Card Name, Document Date, Due Date
- Line items require: Item Code, Description, G/L Account, Line Total > 0
- Real-time validation with user-friendly error messages

### 3. File Upload

- Multiple file selection supported
- Files uploaded after document creation
- Proper error handling for upload failures

## Benefits of Changes

1. **Proper AR Invoice Structure**: Form now matches standard AR Invoice business logic
2. **Better User Experience**: Automatic calculations and real-time validation
3. **API Compliance**: Form data structure matches backend API requirements
4. **Maintainability**: Cleaner code structure with proper separation of concerns
5. **Scalability**: Easy to add new fields or modify existing ones

## Testing Recommendations

1. **Form Validation**: Test all required field validations
2. **Line Item Calculations**: Test automatic line total calculations
3. **Document Totals**: Test VAT/WT total calculations
4. **File Upload**: Test attachment upload functionality
5. **API Integration**: Test document creation and retrieval
6. **Data Persistence**: Test form data loading and saving

## Migration Notes

- Existing outgoing payment data will need to be migrated to new ARInvoice structure
- Users will need training on new field requirements
- Validation rules are stricter than before
- File upload behavior has changed

## Future Enhancements

1. **Item Master Data**: Add item code lookup functionality
2. **Customer Master Data**: Add card code/card name lookup
3. **Tax Calculations**: Add automatic VAT calculations
4. **Currency Conversion**: Add multi-currency support
5. **Template Support**: Add invoice templates
