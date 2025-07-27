# Currency Search Implementation

## Overview

This document describes the implementation of the currency search functionality in the Outgoing Payment Reimbursement form (`addOPReim.html` and `addOPReim.js`).

## Requirements

- Add auto-complete functionality to currency fields using API `/api/MasterCurrency/search`
- Allow manual input and auto-complete selection
- Display currency code, name, and symbol in dropdown
- Send only the currency code (e.g., "IDR") when form is submitted
- Support for both existing and new rows in the table

## API Integration

### Endpoint

```
GET /api/MasterCurrency/search?searchTerm={searchTerm}
```

### Request Parameters

- `searchTerm` (string, query): Search term for currency (e.g., "indon", "usd")

### Response Format

```json
{
  "success": true,
  "message": "Search completed. Found 1 currencies matching 'indon'",
  "searchTerm": "indon",
  "data": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "code": "IDR",
      "name": "Indonesian Rupiah",
      "symbol": "Rp",
      "description": "Official currency of Indonesia",
      "createdAt": "2025-07-25T09:00:00",
      "updatedAt": "2025-07-25T09:00:00"
    }
  ],
  "timestamp": "2025-07-26T04:42:42.6575586Z"
}
```

## Implementation Details

### 1. HTML Changes (`addPages/addOPReim.html`)

Updated the currency field structure to include dropdown:

```html
<td id="tdCurrencyItem" class="p-2 border">
  <div class="relative">
    <input
      type="text"
      id="CurrencyItem"
      maxlength="10"
      class="w-full currency-search-input"
      autocomplete="off"
      onkeyup="searchCurrencies(this)"
      onfocus="showCurrencyDropdown(this)"
    />
    <div
      id="CurrencyItemDropdown"
      class="absolute z-20 hidden w-full mt-1 bg-white border rounded shadow-lg max-h-40 overflow-y-auto currency-dropdown"
    ></div>
  </div>
</td>
```

**Key Features:**

- Input field with `currency-search-input` class
- Dropdown container with `currency-dropdown` class
- Event handlers for search and focus
- Proper z-index and positioning

### 2. CSS Styling

Added currency-specific styling:

```css
/* Currency dropdown styling */
.currency-dropdown {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  max-height: 160px;
  overflow-y: auto;
  z-index: 50;
}
.currency-search-input:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
```

### 3. JavaScript Functions (`js/addOPReim.js`)

#### A. Search Function

```javascript
async function searchCurrencies(inputElement) {
  const searchTerm = inputElement.value.trim();
  const dropdownId = inputElement.id + "Dropdown";
  const dropdown = document.getElementById(dropdownId);

  if (!dropdown) return;

  if (searchTerm.length < 2) {
    dropdown.classList.add("hidden");
    return;
  }

  try {
    const response = await makeAuthenticatedRequest(
      `/api/MasterCurrency/search?searchTerm=${encodeURIComponent(searchTerm)}`
    );

    if (response.success && response.data && response.data.length > 0) {
      displayCurrencyResults(dropdown, response.data);
      dropdown.classList.remove("hidden");
    } else {
      dropdown.classList.add("hidden");
    }
  } catch (error) {
    console.error("Error searching currencies:", error);
    dropdown.classList.add("hidden");
  }
}
```

#### B. Display Results Function

```javascript
function displayCurrencyResults(dropdown, currencies) {
  dropdown.innerHTML = "";

  currencies.forEach((currency) => {
    const item = document.createElement("div");
    item.className =
      "p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200";
    item.innerHTML = `
            <div class="font-medium">${currency.code}</div>
            <div class="text-sm text-gray-600">${currency.name} (${currency.symbol})</div>
        `;
    item.onclick = () => selectCurrency(currency, dropdown);
    dropdown.appendChild(item);
  });
}
```

#### C. Selection Function

```javascript
function selectCurrency(currency, dropdown) {
  const inputElement = dropdown.previousElementSibling;
  if (inputElement) {
    inputElement.value = currency.code;
    dropdown.classList.add("hidden");

    // Trigger any necessary events
    const event = new Event("input", { bubbles: true });
    inputElement.dispatchEvent(event);
  }
}
```

#### D. Click Outside Handler

```javascript
function initializeCurrencyDropdownHandlers() {
  document.addEventListener("click", function (e) {
    const currencyDropdowns = document.querySelectorAll(".currency-dropdown");
    currencyDropdowns.forEach((dropdown) => {
      const inputElement = dropdown.previousElementSibling;
      if (!dropdown.contains(e.target) && !inputElement.contains(e.target)) {
        dropdown.classList.add("hidden");
      }
    });
  });
}
```

### 4. Dynamic Row Support

Updated `addRow()` function to include currency search for new rows:

```javascript
<td class="p-2 border">
  <div class="relative">
    <input
      type="text"
      id="CurrencyItem_${newRowId}"
      maxlength="10"
      class="w-full currency-search-input"
      autocomplete="off"
      onkeyup="searchCurrencies(this)"
      onfocus="showCurrencyDropdown(this)"
    />
    <div
      id="CurrencyItem_${newRowId}Dropdown"
      class="absolute z-20 hidden w-full mt-1 bg-white border rounded shadow-lg max-h-40 overflow-y-auto currency-dropdown"
    ></div>
  </div>
</td>
```

## Functionality

### Search Behavior

- **Minimum Characters**: Search triggers after 2 or more characters
- **Real-time Search**: Results update as user types
- **Case Insensitive**: Search works with any case combination
- **Partial Matching**: Supports partial matches (e.g., "indon" finds "Indonesian Rupiah")

### Selection Behavior

- **Click to Select**: User clicks on currency item to select
- **Code Only**: Only the currency code (e.g., "IDR") is stored in the input field
- **Auto-close**: Dropdown closes automatically after selection
- **Manual Input**: Users can still type currency codes manually

### UI/UX Features

- **Hover Effects**: Visual feedback on hover
- **Loading States**: Proper error handling for API failures
- **Responsive Design**: Dropdown adapts to input field width
- **Keyboard Navigation**: Support for keyboard input and selection

## Data Flow

### 1. User Input

1. User types in currency field
2. After 2+ characters, search function is triggered
3. API call is made to `/api/MasterCurrency/search`

### 2. API Response

1. Server returns matching currencies
2. Results are displayed in dropdown
3. Each result shows code, name, and symbol

### 3. Selection

1. User clicks on desired currency
2. Currency code is inserted into input field
3. Dropdown closes automatically

### 4. Form Submission

1. Only the currency code is sent with form data
2. No additional currency metadata is included

## Testing

### Test File

Created `test_currency_search.html` for testing:

**Features:**

- Mock API responses for testing without backend
- Visual feedback for search results
- Error handling demonstration
- Multiple currency examples

**Test Scenarios:**

- Type "indon" → Should find "IDR - Indonesian Rupiah"
- Type "usd" → Should find "USD - US Dollar"
- Type "eur" → Should find "EUR - Euro"
- Test click outside to close dropdown
- Test manual input vs selection

## Error Handling

### API Failures

- Graceful fallback when API is unavailable
- Console logging for debugging
- Dropdown hidden on errors
- User can still input manually

### Network Issues

- Timeout handling
- Retry logic (if needed)
- User-friendly error messages

## Browser Compatibility

- **Modern Browsers**: Full support for ES6+ features
- **Event Handling**: Standard DOM event listeners
- **CSS**: Tailwind CSS classes for styling
- **Async/Await**: Modern JavaScript for API calls

## Future Enhancements

Potential improvements for future versions:

1. **Caching**: Cache frequently searched currencies
2. **Debouncing**: Reduce API calls with input debouncing
3. **Keyboard Navigation**: Arrow keys for dropdown navigation
4. **Recent Searches**: Remember user's recent currency selections
5. **Favorites**: Allow users to mark favorite currencies
6. **Multi-language**: Support for different language displays
7. **Currency Conversion**: Real-time exchange rate display

## Dependencies

- **API Endpoint**: `/api/MasterCurrency/search`
- **Authentication**: Uses existing `makeAuthenticatedRequest` function
- **Styling**: Tailwind CSS for responsive design
- **Event Handling**: Standard DOM manipulation methods
