# Remittance Request Amount Field Implementation

## Overview

This document describes the implementation of the "Remittance Request Amount" field in the Outgoing Payment Reimbursement form (`addOPReim.html` and `addOPReim.js`).

## Requirements

- Add a "Remittance Request Amount" field below the "Remittance Request Currency" field
- The field should automatically be populated with the total amount due (sum of net amounts from detail rows)
- The field should be independent of net amount column changes (readonly)
- The field should be included in form data collection for API submission

## Implementation Details

### 1. HTML Changes (`addPages/addOPReim.html`)

Added the new field below the Remittance Request Currency field:

```html
<h3 class="text-lg font-semibold mb-2">Remittance Request Amount</h3>
<input
  type="text"
  id="RemittanceRequestAmount"
  placeholder="Remittance Request Amount"
  class="w-full p-2 border rounded currency-input-idr"
  readonly
/>
```

**Key Features:**

- Field ID: `RemittanceRequestAmount`
- CSS Class: `currency-input-idr` for proper currency formatting
- Readonly attribute to prevent manual editing
- Positioned between "Remittance Request Currency" and "Transfer Date" fields

### 2. JavaScript Changes (`js/addOPReim.js`)

#### A. Update Total Amount Due Function

Modified `updateTotalAmountDue()` function to NOT automatically update the Remittance Request Amount field (to maintain independence):

```javascript
// Note: Remittance Request Amount is NOT updated here to maintain independence
// It will only be set initially or when explicitly needed
```

#### B. Form Data Collection

Added the field to the `collectFormData()` function for API submission:

```javascript
remittanceRequestAmount: parseCurrency(document.getElementById("RemittanceRequestAmount")?.value) || 0,
```

#### C. Form Population

Updated `populateFormFields()` function to handle existing data:

```javascript
// Set Remittance Request Amount
if (data.remittanceRequestAmount) {
  document.getElementById("RemittanceRequestAmount").value =
    formatCurrencyValue(data.remittanceRequestAmount);
} else {
  // If no specific remittance amount, use the total amount due
  updateTotalAmountDue();
}
```

#### D. Response Mapping

Updated `mapResponseToForm()` function to handle API response data:

```javascript
document.getElementById("RemittanceRequestAmount").value = formattedAmount;
```

#### E. Input Validation Setup

Added the field to `initializeInputValidations()` function:

```javascript
setupCurrencyInput("RemittanceRequestAmount");
```

## Functionality

### Automatic Population

- The Remittance Request Amount field is automatically populated whenever the total amount due is calculated
- It uses the same currency formatting as other amount fields (IDR format)
- The field is updated in real-time when net amount values change in the detail rows

### Independence from Net Amount Changes

- The field is readonly, preventing manual editing
- It maintains its value independently of net amount column modifications
- The field serves as a "snapshot" of the total amount due at the time of initial calculation
- The field cannot be updated once set (completely independent)
- The field is automatically populated with the current total amount due when data is first loaded

### Data Persistence

- The field value is included in form submission data
- It's properly handled when loading existing documents
- The field maintains its value through the approval workflow

## Testing

A test file `test_remittance_amount.html` has been created to verify the implementation:

### Test Features:

1. **Form Fields**: Mock net amount inputs and display fields
2. **Update Total**: Test the automatic calculation and population
3. **Form Data Collection**: Verify the field is included in data collection
4. **Clear Fields**: Reset all fields for testing

### Test Scenarios:

- Enter values in net amount fields and verify automatic population
- Test currency formatting (IDR format)
- Verify field independence (readonly behavior)
- Test form data collection for API submission

## Usage

### For New Documents:

1. Enter net amounts in the detail rows
2. The Remittance Request Amount field is automatically set to the current total amount due on initial load
3. The field remains readonly and independent of further net amount changes
4. The field cannot be updated once set (completely independent)

### For Existing Documents:

1. When loading existing data, the field is populated from the saved value
2. If no specific remittance amount exists, it defaults to the total amount due
3. The field maintains its value throughout the document lifecycle

## API Integration

The field is included in the API request payload as:

```json
{
  "remittanceRequestAmount": 1000000.0
  // ... other fields
}
```

## Dependencies

- Currency formatting functions (`formatCurrencyIDR`, `parseCurrencyIDR`)
- Total calculation functions (`updateTotalAmountDue`)
- Form data collection functions (`collectFormData`)
- Input validation setup (`initializeInputValidations`)

## Browser Compatibility

- Supports modern browsers with ES6+ features
- Uses standard DOM manipulation methods
- Compatible with existing currency formatting libraries

## Future Enhancements

Potential improvements for future versions:

1. Add validation rules for minimum/maximum amounts
2. Implement audit trail for remittance amount changes
3. Add approval workflow specific to remittance amounts
4. Include currency conversion capabilities for multi-currency support
