# Outgoing Payment Access Implementation

## Overview

This implementation adds a feature to check if a user has access to the Outgoing Payment feature based on an API call during login. If the user has access, the Outgoing Payment menu is shown; otherwise, it's hidden.

## Implementation Details

### 1. API Integration

**Endpoint:** `GET /api/employee-superior-document-approvals/user/{userId}/document-type/OP`

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
- Makes API call to check user access using the correct endpoint with user ID
- Stores result in localStorage as `hasOutgoingPaymentAccess`
- Defaults to `false` if API call fails

**Code:**
```javascript
async function checkOutgoingPaymentAccess(userId) {
  try {
    // Make API call to check if user has access to Outgoing Payment
    const response = await fetch(`${BASE_URL}/api/employee-superior-document-approvals/user/${userId}/document-type/OP`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
      }
    });
    
    const result = await response.json();
    
    if (result.status && result.code === 200) {
      // Check if the response data array has any items (user has access)
      const hasAccess = result.data && result.data.length > 0;
      
      // Store the result in localStorage
      localStorage.setItem("hasOutgoingPaymentAccess", hasAccess.toString());
      console.log('Outgoing Payment access check:', hasAccess);
      
      return hasAccess;
    }
    
    // If API call fails, default to no access
    localStorage.setItem("hasOutgoingPaymentAccess", "false");
    return false;
  } catch (error) {
    console.error('Error checking Outgoing Payment access:', error);
    // If there's an error, default to no access
    localStorage.setItem("hasOutgoingPaymentAccess", "false");
    return false;
  }
}
```

### 3. Menu Visibility Control

**File:** `js/shared-menu.js`

**Function:** `checkOutgoingPaymentAccess()`

- Checks localStorage for `hasOutgoingPaymentAccess` flag
- Shows/hides the Outgoing Payment menu based on the flag
- Called during sidebar initialization

**Code:**
```javascript
function checkOutgoingPaymentAccess() {
    const outgoingPaymentMenu = document.getElementById('outgoingPaymentMenu');
    
    if (outgoingPaymentMenu) {
        const hasAccess = localStorage.getItem('hasOutgoingPaymentAccess');
        
        if (hasAccess === 'true') {
            // User has access, show the menu
            outgoingPaymentMenu.style.display = 'block';
        } else {
            // User doesn't have access, hide the menu
            outgoingPaymentMenu.style.display = 'none';
        }
    }
}
```

### 4. React Dashboard Integration

**File:** `src/Dashboard.jsx`

- Added state management for outgoing payment access
- Conditional rendering of the Outgoing Payment card in the Approval Overview section
- Checks localStorage on component mount

**Code:**
```javascript
const [hasOutgoingPaymentAccess, setHasOutgoingPaymentAccess] = useState(false);

const checkOutgoingPaymentAccess = () => {
    const hasAccess = localStorage.getItem('hasOutgoingPaymentAccess');
    setHasOutgoingPaymentAccess(hasAccess === 'true');
};

// In JSX:
{hasOutgoingPaymentAccess && (
    <div className="p-6 bg-white rounded-lg shadow-lg text-center card-hover stat-card">
        <div className="text-green-600 mb-2"><i className="text-2xl"></i></div>
        <h3 className="text-lg font-semibold text-gray-800">Outgoing Payment</h3>
        <p id="receivedDocs" className="text-3xl font-bold text-green-600 mt-2">{stats.receivedDocs}</p>
        <p className="text-gray-500 text-sm mt-1">Pending Approvals</p>
    </div>
)}
```

### 5. Menu Element Structure

**File:** `components/shared/sidebar-template.html`

- Added `id="outgoingPaymentMenu"` to the Outgoing Payment menu container
- Menu is hidden by default and shown/hidden based on user access

**HTML:**
```html
<div class="mb-1" id="outgoingPaymentMenu">
    <button onclick="toggleSubMenu('OutgoingPayment')" class="menu-btn w-full text-left flex items-center justify-between py-2.5 px-3 rounded">
        <div class="flex items-center">
            <span class="menu-icon"><i class="fas fa-money-bill-wave"></i></span>
            <span class="ml-3">Outgoing Payment</span>
        </div>
        <i class="fas fa-chevron-right text-xs transition-transform duration-200"></i>
    </button>
    <div id="OutgoingPayment" class="hidden pl-10 mt-1 mb-1">
        <!-- Submenu items -->
    </div>
</div>
```

## Files Modified

1. **js/login.js**
   - Updated `checkOutgoingPaymentAccess()` function to use correct API endpoint
   - Fixed API call to include user ID in URL path

2. **js/shared-menu.js**
   - Added `checkOutgoingPaymentAccess()` function
   - Called during sidebar initialization

3. **approvalPages/dashboard/js/shared-menu.js**
   - Added `checkOutgoingPaymentAccess()` function
   - Called during sidebar initialization

4. **decisionReportApproval/js/shared-menu.js**
   - Added `checkOutgoingPaymentAccess()` function
   - Called during sidebar initialization

5. **src/Dashboard.jsx**
   - Added state management for outgoing payment access
   - Added conditional rendering for Outgoing Payment card
   - Added `checkOutgoingPaymentAccess()` function

6. **components/shared/sidebar-template.html**
   - Added `id="outgoingPaymentMenu"` to menu container

## Testing

A test file `test-outgoing-payment-access.html` has been created to verify the implementation:

- Test with access granted (localStorage = "true")
- Test with access denied (localStorage = "false")
- Test with no access setting (localStorage = null)
- Visual verification of menu visibility

## Usage

1. User logs in to the system
2. During login, the system calls the API to check if the user has Outgoing Payment access
3. The result is stored in localStorage as `hasOutgoingPaymentAccess`
4. On all pages with the sidebar, the Outgoing Payment menu is shown/hidden based on this flag
5. In the React Dashboard, the Outgoing Payment card is conditionally rendered based on the same flag

## Security

- API calls are made with proper authentication headers
- Access is checked on every login
- Default behavior is to deny access if API call fails
- Access state is cleared on logout 