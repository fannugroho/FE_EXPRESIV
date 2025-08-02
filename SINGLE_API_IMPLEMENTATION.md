# Single API Implementation for Expenses COA

## Overview

Implementasi baru ini menggunakan satu API endpoint saja (`/api/expenses-coa/filter`) untuk menggantikan multiple API calls yang sebelumnya digunakan untuk mengambil kategori dan account names.

## API Endpoint

```
GET /api/expenses-coa/filter
```

### Parameters

- `departmentName` (required): Nama department
- `menu` (required): Menu type (e.g., "Reimbursement")
- `transaction` (required): Transaction type (e.g., "Medical", "Entertainment", etc.)
- `category` (optional): Category filter
- `isActive` (optional): Filter by active status (default: true)

### Example Request

```
GET /api/expenses-coa/filter?departmentName=Technical&menu=Reimbursement&transaction=Medical&category=Other&isActive=true
```

### Response Format

```json
{
  "status": true,
  "code": 200,
  "message": "ExpensesCOA filtered successfully",
  "data": [
    {
      "category": "Other",
      "accountName": "Account Name 1",
      "coa": "GL001",
      "glAccount": "GL001"
    }
  ]
}
```

## Implementation Details

### 1. Main Function: `fetchExpensesCoa()`

Fungsi utama yang memanggil API dengan parameter yang sesuai:

```javascript
async function fetchExpensesCoa(
  departmentName,
  menu,
  transaction,
  category = null,
  isActive = true
) {
  // Build cache key
  const cacheKey = `${departmentName}-${menu}-${transaction}-${
    category || "all"
  }-${isActive}`;

  // Check cache first
  if (expensesCoaCache.has(cacheKey)) {
    return expensesCoaCache.get(cacheKey);
  }

  // Build query parameters
  const params = new URLSearchParams({
    departmentName: departmentName,
    menu: menu,
    transaction: transaction,
    isActive: isActive,
  });

  if (category) {
    params.append("category", category);
  }

  const response = await fetch(
    `${BASE_URL}/api/expenses-coa/filter?${params.toString()}`
  );
  const result = await response.json();

  if (result.status && result.data) {
    expensesCoaCache.set(cacheKey, result.data);
    return result.data;
  }

  return [];
}
```

### 2. Category Fetching: `fetchCategories()`

Menggunakan API tunggal untuk mengambil kategori:

```javascript
async function fetchCategories(departmentName, transactionType) {
  const expensesCoaData = await fetchExpensesCoa(
    departmentName,
    "Reimbursement",
    transactionType
  );

  // Extract unique categories from the data
  const categories = [
    ...new Set(expensesCoaData.map((item) => item.category).filter(Boolean)),
  ];

  return categories;
}
```

### 3. Account Names Fetching: `fetchAccountNames()`

Menggunakan API tunggal untuk mengambil account names:

```javascript
async function fetchAccountNames(category, departmentName, transactionType) {
  const expensesCoaData = await fetchExpensesCoa(
    departmentName,
    "Reimbursement",
    transactionType,
    category
  );

  // Extract account names with their COA codes
  const accountNames = expensesCoaData
    .filter((item) => item.category === category)
    .map((item) => ({
      accountName: item.accountName,
      coa: item.coa || item.glAccount || "",
    }));

  return accountNames;
}
```

## Filter Flow

### 1. Department Selection

- User memilih Requester Name
- Department otomatis terisi berdasarkan Requester Name

### 2. Transaction Type Selection

- User memilih Type of Transaction
- Trigger `handleDependencyChange()`

### 3. Category Selection (in table)

- Categories di-populate berdasarkan Department + Transaction Type
- Menggunakan `fetchCategories(departmentName, transactionType)`

### 4. Account Name Selection

- Account names di-populate berdasarkan Category + Department + Transaction Type
- Menggunakan `fetchAccountNames(category, departmentName, transactionType)`

### 5. GL Account Auto-fill

- GL Account otomatis terisi ketika Account Name dipilih
- Mengambil nilai dari field `coa` atau `glAccount` dari response API

## Caching Strategy

### 1. Expenses COA Cache

```javascript
let expensesCoaCache = new Map(); // Cache for expenses COA data
```

### 2. Category Cache

```javascript
let categoryCache = new Map(); // Cache for categories by department+transactionType
```

### 3. Account Name Cache

```javascript
let accountNameCache = new Map(); // Cache for account names by category+department+transactionType
```

## Event Listeners

### 1. Department Change

```javascript
departmentSelect.addEventListener("change", function () {
  handleDependencyChange();
});
```

### 2. Transaction Type Change

```javascript
transactionTypeSelect.addEventListener("change", function () {
  handleDependencyChange();
});
```

### 3. Category Selection

```javascript
categorySearch.addEventListener("input", function () {
  filterCategories(this);
});
```

### 4. Account Name Selection

```javascript
accountNameSearch.addEventListener("input", function () {
  filterAccountNames(this);
});
```

## Benefits

1. **Single API Call**: Mengurangi jumlah API calls dari 3 menjadi 1
2. **Better Performance**: Caching yang lebih efisien
3. **Simplified Logic**: Logika yang lebih sederhana dan mudah di-maintain
4. **Consistent Data**: Data yang konsisten karena berasal dari satu sumber
5. **Reduced Network Traffic**: Mengurangi traffic jaringan

## Migration Notes

- Fungsi `getDepartmentIdByName()` masih tersedia untuk backward compatibility
- Cache keys diubah dari menggunakan department ID menjadi department name
- Semua fungsi yang menggunakan department ID diubah untuk menggunakan department name

## Testing

Untuk testing, pastikan API endpoint `/api/expenses-coa/filter` berfungsi dengan parameter yang benar:

1. Test dengan department yang valid
2. Test dengan transaction type yang valid
3. Test dengan category yang valid
4. Test response format sesuai dengan yang diharapkan
