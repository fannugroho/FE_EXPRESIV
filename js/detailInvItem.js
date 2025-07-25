// Global variables
let invoiceData = null;
let currentUser = null;

// Development mode - bypass authentication
const isDevelopmentMode = true;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Authentication is disabled for this page
    // checkAuthentication();
    
    // Get invoice ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('id');
    
    if (invoiceId) {
        loadInvoiceData(invoiceId);
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice ID provided'
        }).then(() => {
            goToMenuARInv();
        });
    }
});

// Check if user is authenticated - disabled for this page
/*
function checkAuthentication() {
    // This function would typically check if the user is logged in
    // For now, we'll just set a dummy current user
    currentUser = {
        id: 1,
        name: 'Current User',
        role: 'Admin'
    };
}
*/

// Load invoice data from API
async function loadInvoiceData(invoiceId) {
    try {
        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        if (isDevelopmentMode) {
            // Use dummy data for development
            invoiceData = {
                DocEntry: invoiceId,
                DocNum: "INV-2024-001",
                CardCode: "C001",
                CardName: "PT Sample Customer",
                NumAtCard: "EXT-REF-001",
                DocCur: "IDR",
                DocDate: "2024-01-15",
                GroupNum: 1,
                TrnspCode: 1,
                U_BSI_ShippingType: "Standard",
                U_BSI_PaymentGroup: "Group A",
                U_BSI_UDF1: "Custom Field 1",
                U_BSI_UDF2: "Custom Field 2",
                PriceBefDi: 1000000,
                VatSum: 100000,
                DocTotal: 1100000,
                comments: "Sample invoice for development",
                Items: [
                    {
                        LineNum: 0,
                        ItemCode: "ITEM001",
                        ItemName: "Sample Item 1",
                        FreeTxt: "Sample notes for item 1",
                        Quantity: 10,
                        InvQty: 10,
                        UoM: "PCS",
                        SalesPrice: 50000,
                        Price: 50000,
                        DiscPrcnt: 0,
                        TaxCode: "VAT",
                        LineTotal: 500000,
                        AccountCode: "4000",
                        BaseType: 0,
                        BaseEntry: 0,
                        BaseLine: 0,
                        LineType: 0
                    },
                    {
                        LineNum: 1,
                        ItemCode: "ITEM002",
                        ItemName: "Sample Item 2",
                        FreeTxt: "Sample notes for item 2",
                        Quantity: 5,
                        InvQty: 5,
                        UoM: "PCS",
                        SalesPrice: 60000,
                        Price: 60000,
                        DiscPrcnt: 0,
                        TaxCode: "VAT",
                        LineTotal: 300000,
                        AccountCode: "4000",
                        BaseType: 0,
                        BaseEntry: 0,
                        BaseLine: 0,
                        LineType: 0
                    }
                ],
                preparedBy: "John Doe",
                acknowledgeBy: "Jane Smith",
                checkedBy: "Bob Johnson",
                approvedBy: "Alice Brown",
                receivedBy: "Charlie Wilson"
            };
            console.log('Development mode: Using dummy invoice data');
            populateFormData(invoiceData);
            Swal.close();
        } else {
            // Fetch invoice data from API
            const response = await fetch(`/api/arinvoice/${invoiceId}`);
            
            if (response.ok) {
                invoiceData = await response.json();
                populateFormData(invoiceData);
                Swal.close();
            } else {
                const errorData = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorData.message || 'Failed to load invoice data'
                }).then(() => {
                    goToMenuARInv();
                });
            }
        }
    } catch (error) {
        console.error('Error loading invoice data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while loading invoice data'
        }).then(() => {
            goToMenuARInv();
        });
    }
}

// Populate form with invoice data
function populateFormData(data) {
    // Populate header fields
    document.getElementById('DocEntry').value = data.DocEntry || '';
    document.getElementById('DocNum').value = data.DocNum || '';
    document.getElementById('CardCode').value = data.CardCode || '';
    document.getElementById('CardName').value = data.CardName || '';
    document.getElementById('NumAtCard').value = data.NumAtCard || '';
    document.getElementById('DocCur').value = data.DocCur || 'IDR';
    document.getElementById('DocDate').value = formatDate(data.DocDate);
    document.getElementById('GroupNum').value = data.GroupNum || '1';
    document.getElementById('TrnspCode').value = data.TrnspCode || '1';
    document.getElementById('U_BSI_ShippingType').value = data.U_BSI_ShippingType || '';
    document.getElementById('U_BSI_PaymentGroup').value = data.U_BSI_PaymentGroup || '';
    document.getElementById('U_BSI_Expressiv_IsTransfered').value = data.U_BSI_Expressiv_IsTransfered || 'N';
    document.getElementById('U_BSI_UDF1').value = data.U_BSI_UDF1 || '';
    document.getElementById('U_BSI_UDF2').value = data.U_BSI_UDF2 || '';
    document.getElementById('comments').value = data.comments || '';
    
    // Populate approval fields
    document.getElementById('preparedByName').value = data.approval?.preparedByName || '';
    document.getElementById('acknowledgeByName').value = data.approval?.acknowledgeByName || '';
    document.getElementById('checkedByName').value = data.approval?.checkedByName || '';
    document.getElementById('approvedByName').value = data.approval?.approvedByName || '';
    document.getElementById('receivedByName').value = data.approval?.receivedByName || '';
    
    // Populate totals
    document.getElementById('PriceBefDi').value = data.PriceBefDi || '0.00';
    document.getElementById('VatSum').value = data.VatSum || '0.00';
    document.getElementById('DocTotal').value = data.DocTotal || '0.00';
    
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
                <input type="text" class="line-num-input no-input p-2 border rounded bg-gray-100" value="${detail.LineNum || index}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border item-code-column">
                <input type="text" class="item-code-input p-2 border rounded bg-gray-100" value="${detail.ItemCode || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border description-column">
                <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off">${detail.Dscription || ''}</textarea>
            </td>
            <td class="p-2 border description-column">
                <textarea class="w-full item-free-txt bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off">${detail.FreeTxt || ''}</textarea>
            </td>
            <td class="p-2 border h-12 quantity-column">
                <textarea class="quantity-input item-sls-qty bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" disabled style="resize: none; height: 40px; text-align: center;" autocomplete="off">${detail.SlsQty || '0'}</textarea>
            </td>
            <td class="p-2 border h-12 quantity-column">
                <textarea class="quantity-input item-quantity bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" disabled style="resize: none; height: 40px; text-align: center;" autocomplete="off">${detail.Quantity || '0'}</textarea>
            </td>
            <td class="p-2 border uom-column" style="display: none;">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.UnitMsr || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border h-12 price-column">
                <textarea class="price-input item-sls-price bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" disabled style="resize: none; height: 40px; text-align: right;" autocomplete="off">${detail.SlsPrice || '0.00'}</textarea>
            </td>
            <td class="p-2 border h-12 price-column">
                <textarea class="price-input item-price bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" disabled style="resize: none; height: 40px; text-align: right;" autocomplete="off">${detail.PriceBefDi || '0.00'}</textarea>
            </td>
            <td class="p-2 border discount-column">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.Discount || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border tax-code-column">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.VatGroup || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border h-12 line-total-column">
                <textarea class="line-total-input item-line-total bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" disabled style="resize: none; height: 40px; text-align: right;" autocomplete="off">${detail.LineTotal || '0.00'}</textarea>
            </td>
            <td class="p-2 border account-code-column" style="display: none;">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.AcctCode || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border base-column" style="display: none;">
                <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${detail.BaseType || '0'}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border base-column" style="display: none;">
                <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${detail.BaseEntry || '0'}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border base-column" style="display: none;">
                <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${detail.BaseLine || '0'}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border base-column" style="display: none;">
                <input type="number" class="w-full p-2 border rounded bg-gray-100" value="${detail.LineType || '0'}" disabled autocomplete="off" />
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
    window.location.href = '../pages/approval-dashboard.html';
}

// Print document function
function printDocument() {
    window.print();
} 