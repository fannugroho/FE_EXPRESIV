// Mock API Server untuk addReim.js
// Jalankan dengan: node mock-api-server.js
// Akses di: http://localhost:3000

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper untuk generate random data
const generateRandomId = () => Math.floor(Math.random() * 1000) + 1;
const generateRandomName = () => {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'James', 'Maria'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
};

const generateRandomDepartment = () => {
    const departments = [
        'IT Department', 'Finance Department', 'HR Department', 'Marketing Department',
        'Sales Department', 'Operations Department', 'Legal Department', 'Engineering Department'
    ];
    return departments[Math.floor(Math.random() * departments.length)];
};

const generateRandomTransactionType = () => {
    const types = ['Travel', 'Office Supplies', 'Entertainment', 'Medical', 'Training', 'Equipment', 'Software', 'Other'];
    return types[Math.floor(Math.random() * types.length)];
};

const generateRandomCategory = (transactionType) => {
    const categories = {
        'Travel': ['Transportation', 'Accommodation', 'Meals', 'Airfare', 'Car Rental', 'Parking', 'Toll'],
        'Office Supplies': ['Stationery', 'Paper', 'Ink Cartridges', 'Office Equipment', 'Furniture'],
        'Entertainment': ['Client Dinner', 'Team Lunch', 'Conference', 'Event Tickets'],
        'Medical': ['Medicine', 'Medical Checkup', 'Dental Care', 'Health Insurance'],
        'Training': ['Course Fee', 'Certification', 'Workshop', 'Conference Registration'],
        'Equipment': ['Computer', 'Phone', 'Tablet', 'Accessories'],
        'Software': ['License', 'Subscription', 'Development Tools', 'Cloud Services'],
        'Other': ['Miscellaneous', 'Emergency', 'Special Project', 'Consultation']
    };
    const typeCategories = categories[transactionType] || categories['Other'];
    return typeCategories[Math.floor(Math.random() * typeCategories.length)];
};

const generateRandomAccountName = (category) => {
    const accountNames = {
        'Transportation': ['Taxi Fare', 'Bus Fare', 'Train Ticket', 'Gasoline', 'Maintenance'],
        'Accommodation': ['Hotel Room', 'Guest House', 'Apartment Rent', 'Lodging'],
        'Meals': ['Restaurant Bill', 'Catering', 'Coffee', 'Snacks'],
        'Stationery': ['Pens', 'Notebooks', 'Staplers', 'Markers'],
        'Computer': ['Laptop', 'Desktop', 'Monitor', 'Keyboard'],
        'License': ['Software License', 'Annual Subscription', 'Premium Plan'],
        'Miscellaneous': ['General Expense', 'Other Cost', 'Additional Charge']
    };
    const categoryAccounts = accountNames[category] || accountNames['Miscellaneous'];
    return {
        accountName: categoryAccounts[Math.floor(Math.random() * categoryAccounts.length)],
        coa: `${Math.floor(Math.random() * 9999)}.${Math.floor(Math.random() * 999)}`
    };
};

// 1. GET /api/users
app.get('/api/users', (req, res) => {
    const users = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        fullName: generateRandomName(),
        employeeId: `EMP${String(i + 1).padStart(3, '0')}`,
        kansaiEmployeeId: `KAN${String(i + 1).padStart(3, '0')}`,
        department: generateRandomDepartment(),
        name: generateRandomName() // untuk backward compatibility
    }));

    res.json({
        status: true,
        code: 200,
        data: users
    });
});

// 2. GET /api/users/:id
app.get('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = {
        id: userId,
        fullName: generateRandomName(),
        employeeId: `EMP${String(userId).padStart(3, '0')}`,
        kansaiEmployeeId: `KAN${String(userId).padStart(3, '0')}`,
        department: generateRandomDepartment(),
        name: generateRandomName()
    };

    res.json({
        status: true,
        code: 200,
        data: user
    });
});

// 3. GET /api/department
app.get('/api/department', (req, res) => {
    const departments = [
        { id: 1, name: 'IT Department' },
        { id: 2, name: 'Finance Department' },
        { id: 3, name: 'HR Department' },
        { id: 4, name: 'Marketing Department' },
        { id: 5, name: 'Sales Department' },
        { id: 6, name: 'Operations Department' },
        { id: 7, name: 'Legal Department' },
        { id: 8, name: 'Engineering Department' }
    ];

    res.json({
        status: true,
        code: 200,
        data: departments
    });
});

// 4. GET /api/transactiontypes/filter
app.get('/api/transactiontypes/filter', (req, res) => {
    const { category } = req.query;
    const transactionTypes = [
        { id: 1, name: 'Travel', category: 'Reimbursement' },
        { id: 2, name: 'Office Supplies', category: 'Reimbursement' },
        { id: 3, name: 'Entertainment', category: 'Reimbursement' },
        { id: 4, name: 'Medical', category: 'Reimbursement' },
        { id: 5, name: 'Training', category: 'Reimbursement' },
        { id: 6, name: 'Equipment', category: 'Reimbursement' },
        { id: 7, name: 'Software', category: 'Reimbursement' },
        { id: 8, name: 'Other', category: 'Reimbursement' }
    ];

    res.json({
        status: true,
        code: 200,
        data: transactionTypes
    });
});

// 5. GET /api/expenses/categories
app.get('/api/expenses/categories', (req, res) => {
    const { departmentId, menu, transactionType } = req.query;

    // Generate random categories based on transaction type
    const categories = Array.from({ length: Math.floor(Math.random() * 5) + 3 }, () =>
        generateRandomCategory(transactionType)
    );

    // Remove duplicates
    const uniqueCategories = [...new Set(categories)];

    res.json(uniqueCategories);
});

// 6. GET /api/expenses/account-names
app.get('/api/expenses/account-names', (req, res) => {
    const { category, departmentId, menu, transactionType } = req.query;

    // Generate random account names based on category
    const accountNames = Array.from({ length: Math.floor(Math.random() * 4) + 2 }, () =>
        generateRandomAccountName(category)
    );

    res.json(accountNames);
});

// 7. GET /api/employee-superior-document-approvals/user/:userId/document-type/:documentType
app.get('/api/employee-superior-document-approvals/user/:userId/document-type/:documentType', (req, res) => {
    const { userId, documentType } = req.params;

    const superiorLevels = ['PR', 'CH', 'AC', 'AP', 'RE'];
    const transactionTypes = ['EN', 'GC', 'ME', 'OT', 'TR'];

    const superiors = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
        superiorUserId: generateRandomId(),
        superiorName: generateRandomName(),
        typeTransaction: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
        superiorLevel: superiorLevels[Math.floor(Math.random() * superiorLevels.length)]
    }));

    res.json({
        status: true,
        code: 200,
        data: superiors
    });
});

// 8. POST /api/reimbursements
app.post('/api/reimbursements', (req, res) => {
    const reimbursementData = req.body;

    // Generate random voucher number
    const voucherNo = `REIM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

    const response = {
        status: true,
        code: 200,
        data: {
            id: generateRandomId(),
            voucherNo: voucherNo,
            message: 'Reimbursement created successfully',
            createdData: reimbursementData
        }
    };

    res.json(response);
});

// 9. POST /api/reimbursements/:id/attachments/upload
app.post('/api/reimbursements/:id/attachments/upload', (req, res) => {
    const { id } = req.params;

    const uploadedFiles = [
        {
            fileName: 'receipt1.pdf',
            filePath: `/uploads/receipt1_${id}.pdf`
        },
        {
            fileName: 'invoice.pdf',
            filePath: `/uploads/invoice_${id}.pdf`
        }
    ];

    res.json({
        status: true,
        code: 200,
        data: {
            message: 'Attachments uploaded successfully',
            uploadedFiles: uploadedFiles
        }
    });
});

// 10. GET /api/business-partners/type/employee
app.get('/api/business-partners/type/employee', (req, res) => {
    const businessPartners = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Employee Partner ${i + 1}`,
        type: 'employee',
        employeeId: `EMP${String(i + 1).padStart(3, '0')}`,
        fullName: generateRandomName()
    }));

    res.json({
        status: true,
        code: 200,
        data: businessPartners
    });
});

// 11. GET /api/employees/:employeeId
app.get('/api/employees/:employeeId', (req, res) => {
    const { employeeId } = req.params;

    const employee = {
        employeeId: employeeId,
        fullName: generateRandomName(),
        department: generateRandomDepartment(),
        position: 'Staff',
        email: `${employeeId.toLowerCase()}@company.com`
    };

    res.json({
        status: true,
        code: 200,
        data: employee
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: false,
        code: 500,
        message: 'Internal Server Error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: false,
        code: 404,
        message: 'Endpoint not found'
    });
});

app.listen(PORT, () => {
    console.log(`Mock API Server running on http://localhost:${PORT}`);
    console.log('\nAvailable endpoints:');
    console.log('GET  /api/users');
    console.log('GET  /api/users/:id');
    console.log('GET  /api/department');
    console.log('GET  /api/transactiontypes/filter?category=Reimbursement');
    console.log('GET  /api/expenses/categories?departmentId=1&menu=Reimbursement&transactionType=Travel');
    console.log('GET  /api/expenses/account-names?category=Transportation&departmentId=1&menu=Reimbursement&transactionType=Travel');
    console.log('GET  /api/employee-superior-document-approvals/user/1/document-type/RE');
    console.log('POST /api/reimbursements');
    console.log('POST /api/reimbursements/:id/attachments/upload');
    console.log('GET  /api/business-partners/type/employee');
    console.log('GET  /api/employees/:employeeId');
    console.log('\nTest dengan: curl http://localhost:3000/api/users');
}); 