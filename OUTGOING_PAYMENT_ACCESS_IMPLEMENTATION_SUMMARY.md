# Outgoing Payment Access Implementation Summary

## Overview

This implementation adds authorization control for the Outgoing Payment feature. When a user logs in, the system checks if they have access to Outgoing Payment functionality and shows/hides the menu accordingly.

## Implementation Details

### 1. API Integration

**Endpoint:** `GET /api/employee-superior-document-approvals/employee/{userId}/document-type/OP`

**Response Format:**
```json
{
  "status": true,
  "code": 200,
  "message": "Operation successful",
  "data": [
    {
      "id": 5405,
      "userID": "ec998d39-81a9-4468-afa7-35bd8e6f4e98",
      "typeDocument": "OP",
      "typeTransaction": "ALL",
      "superiorUserId": "1b7137ab-e63c-4a21-8a6d-d0e2575b6254",
      "superiorLevel": "CH",
      "createdAt": "2025-07-19T22:11:55",
      "updatedAt": "2025-07-19T22:11:55",
      "userName": "elisantia",
      "superiorName": "ida"
    }
  ]
}
```

**Empty Response (No Access):**
```json
{
  "status": true,
  "code": 200,
  "message": "Operation successful",
  "data": []
}
```

### 2. Login Process Integration

**File:** `js/login.js`

**Function:** `checkOutgoingPaymentAccess(userId)`

- Called during successful login
- Makes API call to check user access
- Stores result in localStorage as `hasOutgoingPaymentAccess`
- Defaults to `false` if API call fails

**Code:**
```javascript
async function checkOutgoingPaymentAccess(userId) {
  try {
    // Clear existing Outgoing Payment access first
    localStorage.removeItem("hasOutgoingPaymentAccess");
    
    const response = await fetch(`${BASE_URL}/api/employee-superior-document-approvals/employee/${userId}/document-type/OP`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    const result = await response.json();
    
    if (result.status && result.code === 200) {
      const hasAccess = result.data && result.data.length > 0;
      localStorage.setItem("hasOutgoingPaymentAccess", hasAccess.toString());
      return hasAccess;
    }
    
    localStorage.setItem("hasOutgoingPaymentAccess", "false");
    return false;
  } catch (error) {
    console.error('Error checking Outgoing Payment access:', error);
    localStorage.setItem("hasOutgoingPaymentAccess", "false");
    return false;
  }
}
```

### 3. Menu Visibility Control

**Files Updated:**
- `js/shared-menu.js`
- `approvalPages/dashboard/js/shared-menu.js`
- `decisionReportApproval/js/shared-menu.js`

**Function:** `checkOutgoingPaymentAccess()`

- Checks localStorage for access permission
- Shows/hides menu based on access status
- Called during sidebar initialization

**Code:**
```javascript
function checkOutgoingPaymentAccess() {
  const outgoingPaymentMenu = document.getElementById('outgoingPaymentMenu');
  
  if (outgoingPaymentMenu) {
    const hasAccess = localStorage.getItem('hasOutgoingPaymentAccess');
    
    if (hasAccess === 'true') {
      outgoingPaymentMenu.style.display = 'block';
    } else {
      outgoingPaymentMenu.style.display = 'none';
    }
  }
}
```

### 4. Dashboard Card Control

**File:** `js/dashboard.js`

**Function:** `checkOutgoingPaymentAccess()`

- Finds Outgoing Payment card by searching for title text
- Shows/hides card based on access status
- Called during dashboard initialization

**Code:**
```javascript
function checkOutgoingPaymentAccess() {
  const cards = document.querySelectorAll('.stat-card');
  let outgoingPaymentCard = null;
  
  cards.forEach(card => {
    const title = card.querySelector('h3');
    if (title && title.textContent.includes('Outgoing Payment')) {
      outgoingPaymentCard = card;
    }
  });
  
  if (outgoingPaymentCard) {
    const hasAccess = localStorage.getItem('hasOutgoingPaymentAccess');
    
    if (hasAccess === 'true') {
      outgoingPaymentCard.style.display = 'block';
    } else {
      outgoingPaymentCard.style.display = 'none';
    }
  }
}
```

### 5. React Component Integration

**File:** `src/Dashboard.jsx`

- Already has conditional rendering for Outgoing Payment card
- Uses `hasOutgoingPaymentAccess` state
- Calls `checkOutgoingPaymentAccess()` on component mount

**Code:**
```jsx
{hasOutgoingPaymentAccess && (
  <div className="p-6 bg-white rounded-lg shadow-lg text-center card-hover stat-card">
    <div className="text-green-600 mb-2"><i className="text-2xl"></i></div>
    <h3 className="text-lg font-semibold text-gray-800">Outgoing Payment</h3>
    <p id="receivedDocs" className="text-3xl font-bold text-green-600 mt-2">{stats.receivedDocs}</p>
    <p className="text-gray-500 text-sm mt-1">Pending Approvals</p>
  </div>
)}
```

## Files Modified

1. **js/login.js**
   - Updated `checkOutgoingPaymentAccess()` function to use correct API endpoint
   - Fixed API call to use the endpoint without user ID in path

2. **js/shared-menu.js**
   - Added `checkOutgoingPaymentAccess()` function
   - Called during sidebar initialization

3. **approvalPages/dashboard/js/shared-menu.js**
   - Added `checkOutgoingPaymentAccess()` function
   - Called during sidebar initialization

4. **decisionReportApproval/js/shared-menu.js**
   - Added `checkOutgoingPaymentAccess()` function
   - Called during sidebar initialization

5. **js/dashboard.js**
   - Added `checkOutgoingPaymentAccess()` function
   - Called during dashboard initialization

6. **components/shared/sidebar-template.html**
   - Already has `id="outgoingPaymentMenu"` on menu container

## Testing

A test file `test-outgoing-payment-implementation.html` has been created to verify the implementation:

- Test with access granted (localStorage = "true")
- Test with access denied (localStorage = "false")
- Test with no access setting (localStorage = null)
- Visual verification of menu and card visibility

## Usage

1. User logs in to the system
2. During login, the system calls the API to check if the user has Outgoing Payment access
3. The result is stored in localStorage as `hasOutgoingPaymentAccess`
4. On each page load, the system checks this value and shows/hides the Outgoing Payment menu and dashboard card accordingly

## Security

- Access is checked on every login
- Result is cached in localStorage for performance
- If API call fails, access is denied by default
- Access is cleared on logout

## Browser Compatibility

- Works with all modern browsers
- Uses standard localStorage API
- No external dependencies required 