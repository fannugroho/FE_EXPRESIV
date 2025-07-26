// Global variables
let invoiceData = null;
let currentUser = null;

// API Configuration
const API_BASE_URL = 'https://expressiv-be-sb.idsdev.site/api';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Get invoice ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('id');
    
    // Debug logging
    console.log('URL search params:', window.location.search);
    console.log('All URL params:', Object.fromEntries(urlParams.entries()));
    console.log('Invoice ID from URL:', invoiceId);
    
    // Populate debug info (with null checks)
    const debugUrlElement = document.getElementById('debugUrl');
    const debugInvoiceIdElement = document.getElementById('debugInvoiceId');
    
    if (debugUrlElement) {
        debugUrlElement.textContent = window.location.href;
    }
    if (debugInvoiceIdElement) {
        debugInvoiceIdElement.textContent = invoiceId || 'Not found';
    }
    
    if (invoiceId && invoiceId.trim() !== '') {
        console.log('Loading invoice data for identifier:', invoiceId.trim());
        loadInvoiceData(invoiceId.trim());
    } else {
        console.error('No invoice identifier found in URL parameters');
        
        // Test API connectivity first
        testAPIConnectivity().then(validId => {
            if (validId) {
                console.log('Found valid invoice identifier from API:', validId);
                loadInvoiceData(validId);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No invoice identifier provided and no valid invoices found in API'
                }).then(() => {
                    goToMenuARInv();
                });
            }
        });
    }
});

// Load invoice data from API
async function loadInvoiceData(invoiceId) {
    try {
        console.log('loadInvoiceData called with invoiceId:', invoiceId);
        
        // Determine the API endpoint based on the ID format
        let apiUrl;
        if (invoiceId && !isNaN(invoiceId)) {
            // If it's a number, it's likely a docNum
            apiUrl = `${API_BASE_URL}/ar-invoices/docnum/${invoiceId}/details`;
            console.log('Using docNum endpoint:', apiUrl);
        } else if (invoiceId && invoiceId.includes('-')) {
            // If it contains hyphens, it might be a stagingID
            apiUrl = `${API_BASE_URL}/ar-invoices/${invoiceId}/details`;
            console.log('Using stagingID endpoint:', apiUrl);
        } else {
            // Default to stagingID endpoint
            apiUrl = `${API_BASE_URL}/ar-invoices/${invoiceId}/details`;
            console.log('Using default endpoint:', apiUrl);
        }
        
        console.log('Full URL being called:', apiUrl);
        
        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Fetch data from real API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        console.log('Making API call to:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('API response status:', response.status);
        console.log('API response ok:', response.ok);
        console.log('API response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('API error response body:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('API response result:', result);
        
        if (result.status && result.data) {
            invoiceData = result.data;
            console.log('Invoice data loaded from API:', invoiceData);
            
            // Populate form with data
            populateFormData(invoiceData);
            
            // Populate invoice details table
            if (invoiceData.arInvoiceDetails && invoiceData.arInvoiceDetails.length > 0) {
                populateInvoiceDetails(invoiceData.arInvoiceDetails);
            }
            
            // Close loading indicator
            Swal.close();
        } else {
            throw new Error('Invalid response format from API');
        }
        
    } catch (error) {
        console.error('Error loading invoice data:', error);
        
        let errorMessage = 'Failed to load invoice data';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('404')) {
            errorMessage = 'Invoice not found. Please check the invoice identifier.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network error. Please check your connection.';
        } else {
            errorMessage = `Failed to load invoice data: ${error.message}`;
        }
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage
        }).then(() => {
            goToMenuARInv();
        });
    }
}

// Populate form with invoice data
function populateFormData(data) {
    // Populate header fields
    document.getElementById('DocEntry').value = data.stagingID || '';
    document.getElementById('DocNum').value = data.docNum || '';
    document.getElementById('CardCode').value = data.cardCode || '';
    document.getElementById('CardName').value = data.cardName || '';
    document.getElementById('address').value = data.address || '';
    document.getElementById('NumAtCard').value = data.numAtCard || '';
    document.getElementById('DocCur').value = data.docCur || 'IDR';
    document.getElementById('docRate').value = data.docRate || '1';
    document.getElementById('DocDate').value = formatDate(data.docDate);
    document.getElementById('DocDueDate').value = formatDate(data.docDueDate);
    document.getElementById('GroupNum').value = data.u_BSI_PaymentGroup || '1';
    document.getElementById('TrnspCode').value = data.u_BSI_ShippingType || '1';
    document.getElementById('U_BSI_ShippingType').value = data.u_BSI_ShippingType || '';
    document.getElementById('U_BSI_PaymentGroup').value = data.u_BSI_PaymentGroup || '';
    document.getElementById('U_BSI_Expressiv_IsTransfered').value = data.trackNo || 'N';
    document.getElementById('U_BSI_UDF1').value = data.u_BSI_UDF1 || '';
    document.getElementById('U_BSI_UDF2').value = data.u_BSI_UDF2 || '';
    document.getElementById('u_BSI_Expressiv_PreparedByNIK').value = data.u_BSI_Expressiv_PreparedByNIK || '';
    document.getElementById('u_BSI_Expressiv_PreparedByName').value = data.u_BSI_Expressiv_PreparedByName || '';
    document.getElementById('comments').value = data.comments || '';
    
    // Populate approval fields from approval summary
    if (data.arInvoiceApprovalSummary) {
        document.getElementById('preparedByName').value = data.arInvoiceApprovalSummary.preparedBy || '';
        document.getElementById('acknowledgeByName').value = data.arInvoiceApprovalSummary.acknowledgedBy || '';
        document.getElementById('checkedByName').value = data.arInvoiceApprovalSummary.checkedBy || '';
        document.getElementById('approvedByName').value = data.arInvoiceApprovalSummary.approvedBy || '';
        document.getElementById('receivedByName').value = data.arInvoiceApprovalSummary.receivedBy || '';
    }
    
    // Populate totals
    document.getElementById('PriceBefDi').value = data.docTotal - data.vatSum || '0.00';
    document.getElementById('VatSum').value = data.vatSum || '0.00';
    document.getElementById('DocTotal').value = data.docTotal || '0.00';
    
    // Populate table with invoice details
    populateInvoiceDetails(data.arInvoiceDetails || []);
}

// Populate table with invoice details
function populateInvoiceDetails(details) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    if (details.length === 0) {
        // Add empty row message
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="12" class="p-4 text-center text-gray-500">
                No invoice details found
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    details.forEach((detail, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="p-2 border no-column">
                <input type="text" class="line-num-input no-input p-2 border rounded bg-gray-100" value="${detail.lineNum || index + 1}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border item-code-column">
                <input type="text" class="item-code-input p-2 border rounded bg-gray-100" value="${detail.itemCode || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border description-column">
                <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off">${detail.itemName || ''}</textarea>
            </td>
            <td class="p-2 border description-column">
                <textarea class="w-full item-free-txt bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off">${detail.freeText || ''}</textarea>
            </td>
            <td class="p-2 border sales-employee-column">
                <textarea class="w-full item-sales-employee bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off">${detail.salesEmployee || ''}</textarea>
            </td>
            <td class="p-2 border h-12 quantity-column">
                <textarea class="quantity-input item-sls-qty bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" disabled style="resize: none; height: 40px; text-align: center;" autocomplete="off">${detail.salesQty || '0'}</textarea>
            </td>
            <td class="p-2 border h-12 quantity-column">
                <textarea class="quantity-input item-quantity bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" disabled style="resize: none; height: 40px; text-align: center;" autocomplete="off">${detail.invQty || '0'}</textarea>
            </td>
            <td class="p-2 border uom-column" style="display: none;">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.uom || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border h-12 price-column">
                <textarea class="price-input item-sls-price bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" disabled style="resize: none; height: 40px; text-align: right;" autocomplete="off">${detail.salesPrice || '0.00'}</textarea>
            </td>
            <td class="p-2 border h-12 price-column">
                <textarea class="price-input item-price bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" disabled style="resize: none; height: 40px; text-align: right;" autocomplete="off">${detail.price || '0.00'}</textarea>
            </td>
            <td class="p-2 border discount-column">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.discount || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border tax-code-column">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.taxCode || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border h-12 line-total-column">
                <textarea class="line-total-input item-line-total bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" disabled style="resize: none; height: 40px; text-align: right;" autocomplete="off">${detail.lineTotal || '0.00'}</textarea>
            </td>
            <td class="p-2 border account-code-column" style="display: none;">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.accountCode || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border base-column" style="display: none;">
                <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${detail.baseType || '0'}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border base-column" style="display: none;">
                <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${detail.baseEntry || '0'}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border base-column" style="display: none;">
                <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${detail.baseLine || '0'}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border base-column" style="display: none;">
                <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${detail.lineType || '0'}" disabled autocomplete="off" />
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Apply text wrapping after populating the table
    if (window.refreshTextWrapping) {
        setTimeout(() => {
            window.refreshTextWrapping();
        }, 100);
    }
}

// Format date to YYYY-MM-DD
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Navigation function
function goToMenuARInv() {
    window.location.href = '../pages/menuInvoice.html';
}

// Print document function
function printDocument() {
    window.print();
}

// Test function for debugging
function testWithSampleId() {
    console.log('Testing with sample ID...');
    // Use the first invoice's docNum from the API response
    loadInvoiceData('202507001');
}

// Test function to check API connectivity
async function testAPIConnectivity() {
    try {
        console.log('Testing API connectivity...');
        const response = await fetch(`${API_BASE_URL}/ar-invoices`, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API connectivity test - Status:', response.status);
        console.log('API connectivity test - OK:', response.ok);
        
        if (response.ok) {
            const result = await response.json();
            console.log('API connectivity test - Response:', result);
            
            if (result.data && result.data.length > 0) {
                // Find the first invoice with a valid docNum
                const validInvoice = result.data.find(inv => inv.docNum && inv.docNum > 0);
                if (validInvoice) {
                    console.log('Available invoice docNums:', result.data.map(inv => inv.docNum));
                    console.log('Using valid docNum:', validInvoice.docNum);
                    return validInvoice.docNum;
                } else {
                    console.log('No invoices with valid docNum found');
                    return null;
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('API connectivity test failed:', error);
        return null;
    }
}

// Test function to check API health
async function testAPIHealth() {
    try {
        console.log('Testing API health...');
        const response = await fetch(`${API_BASE_URL}/ar-invoices`, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API health check - Status:', response.status);
        console.log('API health check - OK:', response.ok);
        
        if (response.ok) {
            console.log('API server is accessible');
            return true;
        } else {
            console.log('API server returned error:', response.status);
            return false;
        }
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
} 