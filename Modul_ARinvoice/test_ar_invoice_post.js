/**
 * Test Script untuk POST AR Invoice
 * Menggunakan data dari accessToken yang disediakan
 */

// Configuration
const BASE_URL = 'http://localhost:5249'; // Sesuaikan dengan backend URL
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI';

// User data dari token
const USER_ID = 'df1d0bd0-fed5-4854-89c9-a70e5b1eb274';
const USERNAME = 'annisakusumawardani';

// Function untuk membuat authenticated request
async function makeAuthenticatedRequest(endpoint, options = {}) {
    const url = BASE_URL + endpoint;
    
    const defaultOptions = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            ...(options.headers || {})
        }
    };

    const requestOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        console.log(`🚀 Making request to: ${url}`);
        console.log(`📄 Method: ${requestOptions.method || 'GET'}`);
        
        const response = await fetch(url, requestOptions);
        
        console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.Message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        return response;
    } catch (error) {
        console.error('❌ API Request failed:', error);
        throw error;
    }
}

// Data AR Invoice untuk testing
const arInvoiceTestData = {
    docNum: Math.floor(Math.random() * 10000) + 1000, // Random doc number
    docType: "A",
    docDate: new Date().toISOString(),
    docDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    cardCode: "C001",
    cardName: "PT. Kansai Paint Indonesia",
    address: "Jl. Industri No. 123, Jakarta Barat",
    numAtCard: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    comments: "AR Invoice untuk testing - Created via API",
    u_BSI_Expressiv_PreparedByNIK: USERNAME,
    u_BSI_Expressiv_PreparedByName: "Annisa Kusumawardani",
    docCur: "IDR",
    docRate: 1,
    vatSum: 110000,
    vatSumFC: 110000,
    wtSum: 0,
    wtSumFC: 0,
    docTotal: 1210000,
    docTotalFC: 1210000,
    trnspCode: 0,
    u_BSI_ShippingType: "Regular",
    groupNum: 1,
    u_BSI_PaymentGroup: "Net 30",
    u_bsi_invnum: `AR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    u_bsi_udf1: "Test Field 1",
    u_bsi_udf2: "Test Field 2",
    trackNo: `TRK${Date.now()}`,
    u_BSI_Expressiv_IsTransfered: "N",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    arInvoiceDetails: [
        {
            lineNum: 0,
            visOrder: 0,
            itemCode: "PAINT001",
            dscription: "Cat Tembok Premium 25kg",
            acctCode: "4100",
            quantity: 10,
            invQty: 10,
            priceBefDi: 100000,
            u_bsi_salprice: 100000,
            u_bsi_source: "AR",
            vatgroup: "VAT10",
            wtLiable: "N",
            lineTotal: 1000000,
            totalFrgn: 1000000,
            lineVat: 100000,
            lineVatIF: 100000,
            ocrCode3: "",
            unitMsr: "KG",
            numPerMsr: 1,
            freeTxt: "",
            text: "Cat Tembok Premium untuk proyek renovasi",
            baseType: 0,
            baseEntry: 0,
            baseRef: "",
            baseLine: 0,
            cogsOcrCod: "",
            cogsOcrCo2: "",
            cogsOcrCo3: ""
        },
        {
            lineNum: 1,
            visOrder: 1,
            itemCode: "PAINT002",
            dscription: "Cat Kayu Premium 5L",
            acctCode: "4100",
            quantity: 5,
            invQty: 5,
            priceBefDi: 20000,
            u_bsi_salprice: 20000,
            u_bsi_source: "AR",
            vatgroup: "VAT10",
            wtLiable: "N",
            lineTotal: 100000,
            totalFrgn: 100000,
            lineVat: 10000,
            lineVatIF: 10000,
            ocrCode3: "",
            unitMsr: "L",
            numPerMsr: 1,
            freeTxt: "",
            text: "Cat Kayu Premium untuk finishing furniture",
            baseType: 0,
            baseEntry: 0,
            baseRef: "",
            baseLine: 0,
            cogsOcrCod: "",
            cogsOcrCo2: "",
            cogsOcrCo3: ""
        }
    ],
    arInvoiceAttachments: [],
    approval: {
        approvalStatus: "Prepared",
        preparedBy: USER_ID,
        preparedByName: USERNAME,
        preparedDate: new Date().toISOString(),
        checkedBy: null,
        checkedByName: null,
        checkedDate: null,
        acknowledgedBy: null,
        acknowledgedByName: null,
        acknowledgedDate: null,
        approvedBy: null,
        approvedByName: null,
        approvedDate: null,
        receivedBy: null,
        receivedByName: null,
        receivedDate: null,
        remarks: "Initial AR Invoice creation for testing purposes",
        rejectionReason: null
    }
};

// Function untuk test CREATE AR Invoice
async function testCreateARInvoice() {
    console.log('\n🧪 ===== TESTING CREATE AR INVOICE =====');
    console.log('📝 Data yang akan dikirim:', JSON.stringify(arInvoiceTestData, null, 2));
    
    try {
        const response = await makeAuthenticatedRequest('/api/ar-invoices', {
            method: 'POST',
            body: JSON.stringify(arInvoiceTestData)
        });
        
        const result = await response.json();
        console.log('✅ SUCCESS - AR Invoice created:', JSON.stringify(result, null, 2));
        
        // Return stagingId untuk testing selanjutnya
        return result.data?.stagingId || result.stagingId;
        
    } catch (error) {
        console.error('❌ FAILED - Create AR Invoice:', error.message);
        throw error;
    }
}

// Function untuk test GET AR Invoice
async function testGetARInvoice(stagingId) {
    console.log(`\n🔍 ===== TESTING GET AR INVOICE: ${stagingId} =====`);
    
    try {
        const response = await makeAuthenticatedRequest(`/api/ar-invoices/${stagingId}`, {
            method: 'GET'
        });
        
        const result = await response.json();
        console.log('✅ SUCCESS - AR Invoice retrieved:', JSON.stringify(result, null, 2));
        
        return result;
        
    } catch (error) {
        console.error('❌ FAILED - Get AR Invoice:', error.message);
        throw error;
    }
}

// Function untuk test UPDATE AR Invoice Approval
async function testUpdateARInvoiceApproval(stagingId) {
    console.log(`\n📝 ===== TESTING UPDATE AR INVOICE APPROVAL: ${stagingId} =====`);
    
    const approvalData = {
        approvalStatus: "Checked",
        checkedBy: USER_ID,
        checkedByName: USERNAME,
        checkedDate: new Date().toISOString(),
        remarks: "Checked and approved for testing"
    };
    
    console.log('📝 Approval data:', JSON.stringify(approvalData, null, 2));
    
    try {
        const response = await makeAuthenticatedRequest(`/api/ar-invoices/approval/${stagingId}`, {
            method: 'PATCH',
            body: JSON.stringify(approvalData)
        });
        
        const result = await response.json();
        console.log('✅ SUCCESS - AR Invoice approval updated:', JSON.stringify(result, null, 2));
        
        return result;
        
    } catch (error) {
        console.error('❌ FAILED - Update AR Invoice approval:', error.message);
        throw error;
    }
}

// Function untuk test LIST AR Invoices
async function testListARInvoices() {
    console.log('\n📋 ===== TESTING LIST AR INVOICES =====');
    
    try {
        const params = new URLSearchParams({
            pageNumber: '1',
            pageSize: '10',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
        
        const response = await makeAuthenticatedRequest(`/api/ar-invoices?${params.toString()}`, {
            method: 'GET'
        });
        
        const result = await response.json();
        console.log('✅ SUCCESS - AR Invoices list:', JSON.stringify(result, null, 2));
        
        return result;
        
    } catch (error) {
        console.error('❌ FAILED - List AR Invoices:', error.message);
        throw error;
    }
}

// Function untuk test GET AR Invoices by Preparer
async function testGetARInvoicesByPreparer() {
    console.log(`\n👤 ===== TESTING GET AR INVOICES BY PREPARER: ${USERNAME} =====`);
    
    try {
        const response = await makeAuthenticatedRequest(`/api/ar-invoices/by-preparer/${USERNAME}`, {
            method: 'GET'
        });
        
        const result = await response.json();
        console.log('✅ SUCCESS - AR Invoices by preparer:', JSON.stringify(result, null, 2));
        
        return result;
        
    } catch (error) {
        console.error('❌ FAILED - Get AR Invoices by preparer:', error.message);
        throw error;
    }
}

// Main test runner
async function runAllTests() {
    console.log('🎯 ===== STARTING AR INVOICE API TESTS =====');
    console.log(`🔑 User ID: ${USER_ID}`);
    console.log(`👤 Username: ${USERNAME}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);
    
    let stagingId = null;
    
    try {
        // Test 1: Create AR Invoice
        stagingId = await testCreateARInvoice();
        
        if (stagingId) {
            // Test 2: Get AR Invoice
            await testGetARInvoice(stagingId);
            
            // Test 3: Update AR Invoice Approval
            await testUpdateARInvoiceApproval(stagingId);
            
            // Test 4: Get AR Invoice again (with updated approval)
            await testGetARInvoice(stagingId);
        }
        
        // Test 5: List AR Invoices
        await testListARInvoices();
        
        // Test 6: Get AR Invoices by Preparer
        await testGetARInvoicesByPreparer();
        
        console.log('\n🎉 ===== ALL TESTS COMPLETED SUCCESSFULLY =====');
        
    } catch (error) {
        console.error('\n💥 ===== TESTS FAILED =====');
        console.error('Error:', error.message);
    }
}

// Export functions untuk testing manual
if (typeof window !== 'undefined') {
    // Browser environment
    window.testCreateARInvoice = testCreateARInvoice;
    window.testGetARInvoice = testGetARInvoice;
    window.testUpdateARInvoiceApproval = testUpdateARInvoiceApproval;
    window.testListARInvoices = testListARInvoices;
    window.testGetARInvoicesByPreparer = testGetARInvoicesByPreparer;
    window.runAllTests = runAllTests;
    window.makeAuthenticatedRequest = makeAuthenticatedRequest;
    
    console.log('✅ AR Invoice Test Functions loaded to window object');
    console.log('🚀 Run runAllTests() to start all tests');
} else {
    // Node.js environment
    module.exports = {
        testCreateARInvoice,
        testGetARInvoice,
        testUpdateARInvoiceApproval,
        testListARInvoices,
        testGetARInvoicesByPreparer,
        runAllTests,
        makeAuthenticatedRequest
    };
}