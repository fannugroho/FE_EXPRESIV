# Mock API Server untuk addReim.js

Mock API server ini dibuat untuk testing endpoint-endpoint yang digunakan dalam `addReim.js`. Server ini akan menghasilkan random data yang konsisten dengan struktur data yang diharapkan oleh aplikasi.

## 🚀 Cara Menjalankan

### 1. Install Dependencies

```bash
npm install
```

### 2. Jalankan Mock Server

```bash
npm start
# atau
node mock-api-server.js
```

### 3. Test Endpoints

```bash
node test-endpoints.js
```

## 📋 Endpoints yang Tersedia

### 1. **GET /api/users**

**Fungsi:** Mengambil data semua users

```bash
curl http://localhost:3000/api/users
```

**Response:**

```json
{
  "status": true,
  "code": 200,
  "data": [
    {
      "id": 1,
      "fullName": "John Smith",
      "employeeId": "EMP001",
      "kansaiEmployeeId": "KAN001",
      "department": "IT Department",
      "name": "John Smith"
    }
  ]
}
```

### 2. **GET /api/users/:id**

**Fungsi:** Mengambil detail user berdasarkan ID

```bash
curl http://localhost:3000/api/users/1
```

### 3. **GET /api/department**

**Fungsi:** Mengambil data semua departments

```bash
curl http://localhost:3000/api/department
```

**Response:**

```json
{
  "status": true,
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "IT Department"
    },
    {
      "id": 2,
      "name": "Finance Department"
    }
  ]
}
```

### 4. **GET /api/transactiontypes/filter**

**Fungsi:** Mengambil transaction types untuk kategori Reimbursement

```bash
curl "http://localhost:3000/api/transactiontypes/filter?category=Reimbursement"
```

**Response:**

```json
{
  "status": true,
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "Travel",
      "category": "Reimbursement"
    },
    {
      "id": 2,
      "name": "Office Supplies",
      "category": "Reimbursement"
    }
  ]
}
```

### 5. **GET /api/expenses/categories**

**Fungsi:** Mengambil categories berdasarkan department, menu, dan transaction type

```bash
curl "http://localhost:3000/api/expenses/categories?departmentId=1&menu=Reimbursement&transactionType=Travel"
```

**Response:**

```json
["Transportation", "Accommodation", "Meals", "Airfare"]
```

### 6. **GET /api/expenses/account-names**

**Fungsi:** Mengambil account names berdasarkan category, department, menu, dan transaction type

```bash
curl "http://localhost:3000/api/expenses/account-names?category=Transportation&departmentId=1&menu=Reimbursement&transactionType=Travel"
```

**Response:**

```json
[
  {
    "accountName": "Taxi Fare",
    "coa": "5101.001"
  },
  {
    "accountName": "Bus Fare",
    "coa": "5101.002"
  }
]
```

### 7. **GET /api/employee-superior-document-approvals/user/:userId/document-type/:documentType**

**Fungsi:** Mengambil superior employees untuk approval

```bash
curl http://localhost:3000/api/employee-superior-document-approvals/user/1/document-type/RE
```

**Response:**

```json
{
  "status": true,
  "code": 200,
  "data": [
    {
      "superiorUserId": 2,
      "superiorName": "Jane Smith",
      "typeTransaction": "TR",
      "superiorLevel": "CH"
    }
  ]
}
```

### 8. **POST /api/reimbursements**

**Fungsi:** Membuat reimbursement baru

```bash
curl -X POST http://localhost:3000/api/reimbursements \
  -H "Content-Type: application/json" \
  -d '{
    "voucherNo": "REIM-2024-001",
    "requesterName": "John Doe",
    "department": "IT Department",
    "typeOfTransaction": "Travel",
    "reimbursementDetails": [
      {
        "category": "Transportation",
        "accountName": "Taxi Fare",
        "glAccount": "5101.001",
        "description": "Taxi from airport",
        "amount": "150000"
      }
    ]
  }'
```

**Response:**

```json
{
  "status": true,
  "code": 200,
  "data": {
    "id": 123,
    "voucherNo": "REIM-2024-001",
    "message": "Reimbursement created successfully"
  }
}
```

### 9. **POST /api/reimbursements/:id/attachments/upload**

**Fungsi:** Upload attachments untuk reimbursement

```bash
curl -X POST http://localhost:3000/api/reimbursements/1/attachments/upload
```

### 10. **GET /api/business-partners/type/employee**

**Fungsi:** Mengambil business partners dengan tipe employee

```bash
curl http://localhost:3000/api/business-partners/type/employee
```

### 11. **GET /api/employees/:employeeId**

**Fungsi:** Mengambil detail employee berdasarkan employee ID

```bash
curl http://localhost:3000/api/employees/EMP001
```

## 🔧 Konfigurasi untuk addReim.js

Untuk menggunakan mock API server dengan `addReim.js`, ubah `BASE_URL` di file `auth.js` atau file konfigurasi yang sesuai:

```javascript
// Di auth.js atau file konfigurasi
const BASE_URL = "http://localhost:3000"; // Ganti dengan URL mock server
```

## 📊 Data yang Dihasilkan

### Random Data Categories berdasarkan Transaction Type:

- **Travel:** Transportation, Accommodation, Meals, Airfare, Car Rental, Parking, Toll
- **Office Supplies:** Stationery, Paper, Ink Cartridges, Office Equipment, Furniture
- **Entertainment:** Client Dinner, Team Lunch, Conference, Event Tickets
- **Medical:** Medicine, Medical Checkup, Dental Care, Health Insurance
- **Training:** Course Fee, Certification, Workshop, Conference Registration
- **Equipment:** Computer, Phone, Tablet, Accessories
- **Software:** License, Subscription, Development Tools, Cloud Services
- **Other:** Miscellaneous, Emergency, Special Project, Consultation

### Random Data Account Names berdasarkan Category:

- **Transportation:** Taxi Fare, Bus Fare, Train Ticket, Gasoline, Maintenance
- **Accommodation:** Hotel Room, Guest House, Apartment Rent, Lodging
- **Meals:** Restaurant Bill, Catering, Coffee, Snacks
- **Stationery:** Pens, Notebooks, Staplers, Markers
- **Computer:** Laptop, Desktop, Monitor, Keyboard
- **License:** Software License, Annual Subscription, Premium Plan

## 🧪 Testing

Jalankan test script untuk melihat semua endpoint dalam aksi:

```bash
node test-endpoints.js
```

Script ini akan:

1. Test semua endpoint yang tersedia
2. Menampilkan response dari setiap endpoint
3. Memvalidasi struktur data yang dikembalikan

## 📝 Catatan

- Server berjalan di port 3000
- Semua data di-generate secara random setiap request
- Response format konsisten dengan struktur `{status, code, data}`
- Error handling sudah diimplementasikan
- CORS diaktifkan untuk testing dari browser

## 🐛 Troubleshooting

Jika ada error:

1. Pastikan port 3000 tidak digunakan aplikasi lain
2. Check apakah dependencies sudah terinstall: `npm install`
3. Restart server jika diperlukan
4. Check console untuk error messages
