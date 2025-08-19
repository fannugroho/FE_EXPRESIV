# AR Invoice Item Mode Header Fix

## Problem Identified

Header fields in Item mode were not displaying data because of **duplicate field IDs** between Service mode and Item mode, causing JavaScript data population to conflict.

## Root Cause

1. **Duplicate IDs**: Both Service and Item mode used the same HTML field IDs (e.g., `DocNum`, `CardCode`, etc.)
2. **Data Population Conflict**: JavaScript was populating the same IDs for both modes, causing data to only appear in the first rendered mode (Service mode)
3. **CSS Mode Switching**: While CSS classes worked for visibility, the underlying data population was failing

## Solution Implemented

### 1. HTML Changes (`PartApprovalInvItem.html`)

- **Separated field IDs**: Created unique IDs for Item mode fields with `item` prefix
- **Examples**:
  - `DocNum` → `itemDocNum`
  - `CardCode` → `itemCardCode`
  - `U_BSI_ShippingType` → `itemShippingType`
  - `U_BSI_UDF1` → `itemUDF1`
  - etc.

### 2. JavaScript Changes (`PartApprovalinvItem.js`)

#### A. Data Population Logic

```javascript
// Before: Single headerFields object with conflicts
const headerFields = {
  DocNum: data.docNum || "",
  CardCode: data.cardCode || "",
  // ... same IDs for both modes
};

// After: Mode-specific field mapping
const serviceModeFields = {
  DocNum: data.docNum || "",
  CardCode: data.cardCode || "",
  u_bsi_udf1: data.u_bsi_invnum || "", // Service uses u_bsi_invnum
  // ... service-specific mapping
};

const itemModeFields = {
  itemDocNum: data.docNum || "",
  itemCardCode: data.cardCode || "",
  itemUDF1: data.u_bsi_sjnum || data.u_bsi_udf1 || "", // Item uses u_bsi_sjnum
  // ... item-specific mapping
};

const headerFields = { ...sharedFields };
if (AppState.docType === "S") {
  Object.assign(headerFields, serviceModeFields);
} else {
  Object.assign(headerFields, itemModeFields);
}
```

#### B. Data Mapping Corrections

- **Service Mode**: Uses `u_bsi_invnum` for "No Surat Jalan"
- **Item Mode**: Uses `u_bsi_sjnum` for "No Surat Jalan" and `u_bsi_pono` for "P/O No"

#### C. Attachment Container Support

- **Service Mode**: Uses `attachmentsContainer` and `noAttachments`
- **Item Mode**: Uses `itemAttachmentsContainer` and `itemNoAttachments`

### 3. Debug Functions Added

- `debugFieldVisibility()`: Checks field visibility and data population
- Enhanced logging for mode-specific field population
- Console output to verify correct mode switching

## Key Benefits

1. ✅ **No More Conflicts**: Each mode has unique field IDs
2. ✅ **Proper Data Mapping**: Correct API field mapping for each mode
3. ✅ **Consistent Behavior**: Both modes now populate header fields correctly
4. ✅ **Debug Support**: Added debugging tools for future maintenance

## Testing Verification

- Service mode: All fields populate correctly
- Item mode: All fields now populate correctly (previously empty)
- Mode switching works seamlessly
- No JavaScript errors in console

## Files Modified

1. `approvalPages/approval/02.ARInvoice/Approval/PartApprovalInvItem.html`
2. `approvalPages/approval/02.ARInvoice/Approval/PartApprovalinvItem.js`

The header fields in Item mode should now display all data correctly, matching the behavior of Service mode.
