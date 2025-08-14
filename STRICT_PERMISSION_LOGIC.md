# 🔐 STRICT PERMISSION LOGIC IMPLEMENTATION

## 📋 **Overview**

Implementasi sistem permission yang ketat untuk Outgoing Payment Reimbursement dengan aturan:

- User hanya bisa melakukan action ketika statusnya tepat satu step sebelum role mereka
- PreparedBy yang melihat dokumen Prepared = Detail mode (semua tombol hidden)
- Setiap role hanya bisa approve pada status yang tepat

## 🎯 **Permission Matrix**

| User Role          | Document Status | Can Approve | Page Title                       | Button State                |
| ------------------ | --------------- | ----------- | -------------------------------- | --------------------------- |
| **PreparedBy**     | Prepared        | ❌ No       | "Detail Outgoing Payment"        | 🙈 All Hidden               |
| **CheckedBy**      | Prepared        | ✅ Yes      | "Check Outgoing Payment"         | ✅ "Check" + "Reject"       |
| **AcknowledgedBy** | Checked         | ✅ Yes      | "Acknowledge Outgoing Payment"   | ✅ "Acknowledge" + "Reject" |
| **ApprovedBy**     | Acknowledged    | ✅ Yes      | "Approve Outgoing Payment"       | ✅ "Approve" + "Reject"     |
| **ReceivedBy**     | Approved        | ✅ Yes      | "Receive Outgoing Payment"       | ✅ "Receive" + "Reject"     |
| **Any Role**       | Wrong Status    | ❌ No       | "View Outgoing Payment (Status)" | ⚠️ Disabled                 |

## 🔧 **Key Implementation Changes**

### 1. **Strict Permission Check** (`canUserApproveAtCurrentStep`)

```javascript
const allowedTransitions = {
  Checked: "Prepared", // CheckedBy hanya bisa approve jika status = Prepared
  Acknowledged: "Checked", // AcknowledgedBy hanya bisa approve jika status = Checked
  Approved: "Acknowledged", // ApprovedBy hanya bisa approve jika status = Acknowledged
  Received: "Approved", // ReceivedBy hanya bisa approve jika status = Approved
};

const requiredStatus = allowedTransitions[userRole];
if (currentStatus !== requiredStatus) {
  return false; // Permission denied
}
```

### 2. **Title Logic Enhancement** (`updatePageTitle`)

```javascript
// Cek kombinasi role dan status untuk menentukan title
if (userRoles.includes("PreparedBy") && currentStatus === "Prepared") {
  newTitle = "Detail Outgoing Payment Reimbursement";
} else if (userRoles.includes("CheckedBy") && currentStatus === "Prepared") {
  newTitle = "Check Outgoing Payment Reimbursement";
}
// ... dst
```

### 3. **Button State Management** (`updateButtonStates`)

```javascript
// Special case: PreparedBy melihat dokumen Prepared = semua tombol hidden
const isPreparedByViewingPrepared =
  approval.preparedBy === currentUserId && currentStatus === "Prepared";

if (isPreparedByViewingPrepared) {
  this.hideAllButtons(receiveButton, rejectButton);
}
```

## 📝 **Business Logic Rules**

### ✅ **Allowed Scenarios**

1. **Document Creator (PreparedBy)**

   - Status: Prepared
   - Action: View only (Detail mode)
   - Buttons: Hidden
   - Reason: Creator should only view their prepared document

2. **Sequential Approval Chain**
   - CheckedBy → Can approve when status = Prepared
   - AcknowledgedBy → Can approve when status = Checked
   - ApprovedBy → Can approve when status = Acknowledged
   - ReceivedBy → Can approve when status = Approved

### ❌ **Denied Scenarios**

1. **Wrong Status for Role**

   - CheckedBy trying to approve Checked document
   - ReceivedBy trying to approve Checked document
   - Any role trying to approve wrong status

2. **Document Already Completed**

   - Any action on Received or Rejected documents

3. **Not Assigned User**
   - User not assigned to any approval role

## 🧪 **Testing Scenarios**

### Test Cases Covered:

1. ✅ PreparedBy + Status Prepared → Detail mode, buttons hidden
2. ✅ CheckedBy + Status Prepared → Check mode, buttons enabled
3. ✅ AcknowledgedBy + Status Checked → Acknowledge mode, buttons enabled
4. ✅ ApprovedBy + Status Acknowledged → Approve mode, buttons enabled
5. ✅ ReceivedBy + Status Approved → Receive mode, buttons enabled
6. ❌ CheckedBy + Status Checked → View mode, buttons disabled
7. ❌ ReceivedBy + Status Checked → View mode, buttons disabled

## 📁 **Files Modified**

### `receiveOPReim.js`

- `canUserApproveAtCurrentStep()` - Added strict transition rules
- `updatePageTitle()` - Enhanced title logic based on role+status
- `updateButtonStates()` - Added button hiding for PreparedBy
- `hideAllButtons()` - New helper method

### Test Files Created:

- `test_strict_permission.html` - Comprehensive permission testing
- `STRICT_PERMISSION_LOGIC.md` - This documentation

## 🎯 **Usage Examples**

### Scenario 1: PreparedBy User

```javascript
// User: preparedBy = "user1", Status: "Prepared"
// Result: Title = "Detail Outgoing Payment", Buttons = Hidden
```

### Scenario 2: CheckedBy User

```javascript
// User: checkedBy = "user2", Status: "Prepared"
// Result: Title = "Check Outgoing Payment", Buttons = "Check" + "Reject"
```

### Scenario 3: Wrong Combination

```javascript
// User: checkedBy = "user2", Status: "Checked" (already done by this user)
// Result: Title = "View Outgoing Payment (Checked)", Buttons = Disabled
```

## ⚠️ **Important Notes**

1. **Sequential Nature**: Each user can only approve at their designated step
2. **No Skip**: Cannot skip steps (e.g., AcknowledgedBy cannot approve Prepared)
3. **Creator View**: PreparedBy gets special "Detail" view without action buttons
4. **Status Dependency**: User role must match current document status progression

## 🔄 **Next Steps**

1. Test with real user data and document statuses
2. Verify button visibility in actual application
3. Confirm title updates work correctly
4. Test rejection flow with new permission logic

---

**Status**: ✅ IMPLEMENTED - Ready for testing
