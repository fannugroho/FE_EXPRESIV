/**
 * Script untuk inject data AR Invoice ke database
 * Menggunakan user yang sama untuk semua tahap approval
 */

// Configuration
const BASE_URL = 'http://localhost:5249'; // Sesuaikan dengan backend URL
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI';

// User data (same person for all approval stages)
const USER_DATA = {
    id: 'df1d0bd0-fed5-4854-89c9-a70e5b1eb274',
    username: 'annisakusumawardani',
    name: 'Annisa Kusumawardani'
};

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

// Function untuk generate random AR Invoice data
function generateARInvoiceData(index) {
    const timestamp = Date.now() + (index * 1000);
    const docNum = 3000 + index;
    const invoiceNum = String(index + 1).padStart(3, '0');
    
    return {
        docNum: docNum,
        docType: "A",
        docDate: new Date(timestamp).toISOString(),
        docDueDate: new Date(timestamp + (30 * 24 * 60 * 60 * 1000)).toISOString(),
        cardCode: `C${String(index + 1).padStart(3, '0')}`,
        cardName: `PT. Customer ${index + 1}`,
        address: `Jl. Customer No. ${index + 1}, Jakarta`,
        numAtCard: `EXT-INV-2025-${invoiceNum}`,
        comments: `AR Invoice #${invoiceNum} - Injection Test Data`,
        u_BSI_Expressiv_PreparedByNIK: USER_DATA.username,
        u_BSI_Expressiv_PreparedByName: USER_DATA.name,
        docCur: "IDR",
        docRate: 1,
        vatSum: (index + 1) * 11000,
        vatSumFC: (index + 1) * 11000,
        wtSum: 0,
        wtSumFC: 0,
        docTotal: (index + 1) * 121000,
        docTotalFC: (index + 1) * 121000,
        trnspCode: 0,
        u_BSI_ShippingType: "Regular",
        groupNum: 1,
        u_BSI_PaymentGroup: "Net 30",
        u_bsi_invnum: `AR-2025-${invoiceNum}`,
        u_bsi_udf1: `Test Field 1 - ${index + 1}`,
        u_bsi_udf2: `Test Field 2 - ${index + 1}`,
        trackNo: `TRK${timestamp}`,
        u_BSI_Expressiv_IsTransfered: "N",
        createdAt: new Date(timestamp).toISOString(),
        updatedAt: new Date(timestamp).toISOString(),
        arInvoiceDetails: [
            {
                lineNum: 0,
                visOrder: 0,
                itemCode: `ITEM${String(index + 1).padStart(3, '0')}`,
                dscription: `Product ${index + 1} - Main Item`,
                acctCode: "4100",
                quantity: (index % 5) + 1,
                invQty: (index % 5) + 1,
                priceBefDi: (index + 1) * 10000,
                u_bsi_salprice: (index + 1) * 10000,
                u_bsi_source: "AR",
                vatgroup: "VAT10",
                wtLiable: "N",
                lineTotal: (index + 1) * 10000 * ((index % 5) + 1),
                totalFrgn: (index + 1) * 10000 * ((index % 5) + 1),
                lineVat: (index + 1) * 1000 * ((index % 5) + 1),
                lineVatIF: (index + 1) * 1000 * ((index % 5) + 1),
                ocrCode3: "",
                unitMsr: "PCS",
                numPerMsr: 1,
                freeTxt: "",
                text: `Product ${index + 1} description`,
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
            preparedBy: USER_DATA.id,
            preparedByName: USER_DATA.username,
            preparedDate: new Date(timestamp).toISOString(),
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
            remarks: `Initial AR Invoice creation - Test Data #${invoiceNum}`,
            rejectionReason: null
        }
    };
}

// Function untuk create AR Invoice
async function createARInvoice(data, index) {
    console.log(`\n🆕 Creating AR Invoice #${index + 1}...`);
    
    try {
        const response = await makeAuthenticatedRequest('/api/ar-invoices', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log(`✅ AR Invoice #${index + 1} created successfully`);
        console.log(`   DocNum: ${data.docNum}`);
        console.log(`   CardName: ${data.cardName}`);
        console.log(`   Total: ${data.docTotal.toLocaleString('id-ID')}`);
        console.log(`   StagingId: ${result.data?.stagingId || result.stagingId}`);
        
        return result.data?.stagingId || result.stagingId;
        
    } catch (error) {
        console.error(`❌ Failed to create AR Invoice #${index + 1}:`, error.message);
        throw error;
    }
}

// Function untuk update approval dengan delay
async function updateApprovalStatus(stagingId, approvalData, statusName, index) {
    console.log(`   📝 Updating to ${statusName}...`);
    
    try {
        const response = await makeAuthenticatedRequest(`/api/ar-invoices/approval/${stagingId}`, {
            method: 'PATCH',
            body: JSON.stringify(approvalData)
        });
        
        const result = await response.json();
        console.log(`   ✅ Status updated to ${statusName}`);
        
        return result;
        
    } catch (error) {
        console.error(`   ❌ Failed to update to ${statusName}:`, error.message);
        throw error;
    }
}

// Function untuk complete approval workflow
async function completeApprovalWorkflow(stagingId, index) {
    console.log(`\n🔄 Completing approval workflow for AR Invoice #${index + 1}...`);
    
    const baseTimestamp = Date.now();
    
    try {
        // Step 1: Checked
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay 0.5 detik
        await updateApprovalStatus(stagingId, {
            approvalStatus: "Checked",
            checkedBy: USER_DATA.id,
            checkedByName: USER_DATA.username,
            checkedDate: new Date(baseTimestamp + 1000).toISOString(),
            remarks: `Checked by ${USER_DATA.name} - Auto injection`
        }, "Checked", index);

        // Step 2: Acknowledged
        await new Promise(resolve => setTimeout(resolve, 500));
        await updateApprovalStatus(stagingId, {
            approvalStatus: "Acknowledged",
            acknowledgedBy: USER_DATA.id,
            acknowledgedByName: USER_DATA.username,
            acknowledgedDate: new Date(baseTimestamp + 2000).toISOString(),
            remarks: `Acknowledged by ${USER_DATA.name} - Auto injection`
        }, "Acknowledged", index);

        // Step 3: Approved
        await new Promise(resolve => setTimeout(resolve, 500));
        await updateApprovalStatus(stagingId, {
            approvalStatus: "Approved",
            approvedBy: USER_DATA.id,
            approvedByName: USER_DATA.username,
            approvedDate: new Date(baseTimestamp + 3000).toISOString(),
            remarks: `Approved by ${USER_DATA.name} - Auto injection`
        }, "Approved", index);

        // Step 4: Received
        await new Promise(resolve => setTimeout(resolve, 500));
        await updateApprovalStatus(stagingId, {
            approvalStatus: "Received",
            receivedBy: USER_DATA.id,
            receivedByName: USER_DATA.username,
            receivedDate: new Date(baseTimestamp + 4000).toISOString(),
            remarks: `Received by ${USER_DATA.name} - Auto injection`
        }, "Received", index);

        console.log(`   🎉 AR Invoice #${index + 1} workflow completed successfully!`);
        
    } catch (error) {
        console.error(`   💥 Workflow failed for AR Invoice #${index + 1}:`, error.message);
        throw error;
    }
}

// Function untuk inject multiple AR Invoices
async function injectMultipleARInvoices(count = 5, completeWorkflow = true) {
    console.log(`🎯 Starting injection of ${count} AR Invoices...`);
    console.log(`👤 User: ${USER_DATA.name} (${USER_DATA.username})`);
    console.log(`🔄 Complete Workflow: ${completeWorkflow ? 'Yes' : 'No'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const results = [];
    
    for (let i = 0; i < count; i++) {
        try {
            // Generate data
            const invoiceData = generateARInvoiceData(i);
            
            // Create AR Invoice
            const stagingId = await createARInvoice(invoiceData, i);
            
            if (stagingId && completeWorkflow) {
                // Complete approval workflow
                await completeApprovalWorkflow(stagingId, i);
            }
            
            results.push({
                index: i + 1,
                docNum: invoiceData.docNum,
                cardName: invoiceData.cardName,
                stagingId: stagingId,
                status: completeWorkflow ? 'Received' : 'Prepared',
                success: true
            });
            
            // Delay antar invoice
            if (i < count - 1) {
                console.log(`\n⏳ Waiting 2 seconds before next invoice...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
        } catch (error) {
            console.error(`💥 Failed to inject AR Invoice #${i + 1}:`, error.message);
            results.push({
                index: i + 1,
                error: error.message,
                success: false
            });
        }
    }
    
    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 INJECTION COMPLETE - SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${count}`);
    console.log(`❌ Failed: ${failed.length}/${count}`);
    
    if (successful.length > 0) {
        console.log('\n📋 SUCCESSFUL INJECTIONS:');
        successful.forEach(r => {
            console.log(`   ${r.index}. ${r.cardName} (DocNum: ${r.docNum}) - ${r.status}`);
            console.log(`      StagingId: ${r.stagingId}`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n💥 FAILED INJECTIONS:');
        failed.forEach(r => {
            console.log(`   ${r.index}. Error: ${r.error}`);
        });
    }
    
    console.log('\n🎯 Data injection process completed!');
    return results;
}

// Function untuk inject AR Invoices dengan berbagai status
async function injectMixedStatusARInvoices(count = 10) {
    console.log(`🎯 Starting injection of ${count} AR Invoices with mixed statuses...`);
    console.log(`👤 User: ${USER_DATA.name} (${USER_DATA.username})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const results = [];
    
    for (let i = 0; i < count; i++) {
        try {
            // Generate data
            const invoiceData = generateARInvoiceData(i);
            
            // Create AR Invoice
            const stagingId = await createARInvoice(invoiceData, i);
            
            if (stagingId) {
                // Determine final status based on index
                const statusIndex = i % 5; // 0-4 untuk 5 status berbeda
                const baseTimestamp = Date.now();
                
                switch (statusIndex) {
                    case 0: // Prepared (no additional updates)
                        console.log(`   📝 Keeping status as Prepared`);
                        results.push({
                            index: i + 1,
                            docNum: invoiceData.docNum,
                            cardName: invoiceData.cardName,
                            stagingId: stagingId,
                            status: 'Prepared',
                            success: true
                        });
                        break;
                        
                    case 1: // Checked only
                        await new Promise(resolve => setTimeout(resolve, 500));
                        await updateApprovalStatus(stagingId, {
                            approvalStatus: "Checked",
                            checkedBy: USER_DATA.id,
                            checkedByName: USER_DATA.username,
                            checkedDate: new Date(baseTimestamp + 1000).toISOString(),
                            remarks: `Checked by ${USER_DATA.name} - Mixed status injection`
                        }, "Checked", i);
                        
                        results.push({
                            index: i + 1,
                            docNum: invoiceData.docNum,
                            cardName: invoiceData.cardName,
                            stagingId: stagingId,
                            status: 'Checked',
                            success: true
                        });
                        break;
                        
                    case 2: // Up to Acknowledged
                        await new Promise(resolve => setTimeout(resolve, 500));
                        await updateApprovalStatus(stagingId, {
                            approvalStatus: "Checked",
                            checkedBy: USER_DATA.id,
                            checkedByName: USER_DATA.username,
                            checkedDate: new Date(baseTimestamp + 1000).toISOString(),
                            remarks: `Checked by ${USER_DATA.name} - Mixed status injection`
                        }, "Checked", i);
                        
                        await new Promise(resolve => setTimeout(resolve, 500));
                        await updateApprovalStatus(stagingId, {
                            approvalStatus: "Acknowledged",
                            acknowledgedBy: USER_DATA.id,
                            acknowledgedByName: USER_DATA.username,
                            acknowledgedDate: new Date(baseTimestamp + 2000).toISOString(),
                            remarks: `Acknowledged by ${USER_DATA.name} - Mixed status injection`
                        }, "Acknowledged", i);
                        
                        results.push({
                            index: i + 1,
                            docNum: invoiceData.docNum,
                            cardName: invoiceData.cardName,
                            stagingId: stagingId,
                            status: 'Acknowledged',
                            success: true
                        });
                        break;
                        
                    case 3: // Up to Approved
                        await completeApprovalWorkflow(stagingId, i);
                        // Rollback to Approved
                        await new Promise(resolve => setTimeout(resolve, 500));
                        await updateApprovalStatus(stagingId, {
                            approvalStatus: "Approved",
                            approvedBy: USER_DATA.id,
                            approvedByName: USER_DATA.username,
                            approvedDate: new Date(baseTimestamp + 3000).toISOString(),
                            remarks: `Approved by ${USER_DATA.name} - Mixed status injection`
                        }, "Approved (Final)", i);
                        
                        results.push({
                            index: i + 1,
                            docNum: invoiceData.docNum,
                            cardName: invoiceData.cardName,
                            stagingId: stagingId,
                            status: 'Approved',
                            success: true
                        });
                        break;
                        
                    case 4: // Complete workflow to Received
                        await completeApprovalWorkflow(stagingId, i);
                        results.push({
                            index: i + 1,
                            docNum: invoiceData.docNum,
                            cardName: invoiceData.cardName,
                            stagingId: stagingId,
                            status: 'Received',
                            success: true
                        });
                        break;
                }
            }
            
            // Delay antar invoice
            if (i < count - 1) {
                console.log(`\n⏳ Waiting 2 seconds before next invoice...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
        } catch (error) {
            console.error(`💥 Failed to inject AR Invoice #${i + 1}:`, error.message);
            results.push({
                index: i + 1,
                error: error.message,
                success: false
            });
        }
    }
    
    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 MIXED STATUS INJECTION COMPLETE - SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${count}`);
    console.log(`❌ Failed: ${failed.length}/${count}`);
    
    // Group by status
    const statusGroups = {};
    successful.forEach(r => {
        if (!statusGroups[r.status]) statusGroups[r.status] = [];
        statusGroups[r.status].push(r);
    });
    
    console.log('\n📊 STATUS DISTRIBUTION:');
    Object.keys(statusGroups).forEach(status => {
        console.log(`   ${status}: ${statusGroups[status].length} invoices`);
    });
    
    console.log('\n📋 DETAILED RESULTS:');
    successful.forEach(r => {
        console.log(`   ${r.index}. ${r.cardName} (DocNum: ${r.docNum}) - Status: ${r.status}`);
    });
    
    if (failed.length > 0) {
        console.log('\n💥 FAILED INJECTIONS:');
        failed.forEach(r => {
            console.log(`   ${r.index}. Error: ${r.error}`);
        });
    }
    
    console.log('\n🎯 Mixed status data injection process completed!');
    return results;
}

// Export functions
if (typeof window !== 'undefined') {
    // Browser environment
    window.injectMultipleARInvoices = injectMultipleARInvoices;
    window.injectMixedStatusARInvoices = injectMixedStatusARInvoices;
    window.generateARInvoiceData = generateARInvoiceData;
    window.createARInvoice = createARInvoice;
    window.completeApprovalWorkflow = completeApprovalWorkflow;
    
    console.log('✅ AR Invoice Injection Functions loaded to window object');
    console.log('🚀 Available functions:');
    console.log('   - injectMultipleARInvoices(count, completeWorkflow)');
    console.log('   - injectMixedStatusARInvoices(count)');
    console.log('');
    console.log('📖 Examples:');
    console.log('   injectMultipleARInvoices(5, true)  // 5 invoices with full workflow');
    console.log('   injectMultipleARInvoices(3, false) // 3 invoices prepared only');
    console.log('   injectMixedStatusARInvoices(10)    // 10 invoices with mixed statuses');
} else {
    // Node.js environment
    module.exports = {
        injectMultipleARInvoices,
        injectMixedStatusARInvoices,
        generateARInvoiceData,
        createARInvoice,
        completeApprovalWorkflow
    };
}