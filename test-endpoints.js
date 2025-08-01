// Test Script untuk Mock API Endpoints
// Jalankan dengan: node test-endpoints.js

const BASE_URL = 'http://localhost:3000';

// Helper function untuk test API
async function testEndpoint(method, endpoint, data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const result = await response.json();

        console.log(`\n✅ ${method} ${endpoint}`);
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));

        return result;
    } catch (error) {
        console.log(`\n❌ ${method} ${endpoint}`);
        console.log('Error:', error.message);
        return null;
    }
}

// Test semua endpoints
async function runAllTests() {
    console.log('🚀 Testing Mock API Endpoints...\n');

    // 1. Test GET /api/users
    await testEndpoint('GET', '/api/users');

    // 2. Test GET /api/users/:id
    await testEndpoint('GET', '/api/users/1');

    // 3. Test GET /api/department
    await testEndpoint('GET', '/api/department');

    // 4. Test GET /api/transactiontypes/filter
    await testEndpoint('GET', '/api/transactiontypes/filter?category=Reimbursement');

    // 5. Test GET /api/expenses/categories
    await testEndpoint('GET', '/api/expenses/categories?departmentId=1&menu=Reimbursement&transactionType=Travel');

    // 6. Test GET /api/expenses/account-names
    await testEndpoint('GET', '/api/expenses/account-names?category=Transportation&departmentId=1&menu=Reimbursement&transactionType=Travel');

    // 7. Test GET /api/employee-superior-document-approvals
    await testEndpoint('GET', '/api/employee-superior-document-approvals/user/1/document-type/RE');

    // 8. Test POST /api/reimbursements
    const reimbursementData = {
        voucherNo: "REIM-2024-001",
        requesterName: "John Doe",
        department: "IT Department",
        payTo: "1",
        currency: "IDR",
        submissionDate: "2024-01-15",
        status: "Draft",
        referenceDoc: "INV-001",
        typeOfTransaction: "Travel",
        remarks: "Business trip expenses",
        preparedBy: "1",
        checkedBy: "2",
        acknowledgedBy: "3",
        approvedBy: "4",
        receivedBy: "5",
        reimbursementDetails: [
            {
                category: "Transportation",
                accountName: "Taxi Fare",
                glAccount: "5101.001",
                description: "Taxi from airport to hotel",
                amount: "150000"
            },
            {
                category: "Accommodation",
                accountName: "Hotel Room",
                glAccount: "5101.002",
                description: "Hotel accommodation for 2 nights",
                amount: "500000"
            }
        ],
        isSubmit: false,
        payToNIK: "KAN001",
        payToName: "John Doe"
    };
    await testEndpoint('POST', '/api/reimbursements', reimbursementData);

    // 9. Test POST /api/reimbursements/:id/attachments/upload
    await testEndpoint('POST', '/api/reimbursements/1/attachments/upload');

    // 10. Test GET /api/business-partners/type/employee
    await testEndpoint('GET', '/api/business-partners/type/employee');

    // 11. Test GET /api/employees/:employeeId
    await testEndpoint('GET', '/api/employees/EMP001');

    console.log('\n🎉 All tests completed!');
}

// Jalankan tests
runAllTests().catch(console.error); 