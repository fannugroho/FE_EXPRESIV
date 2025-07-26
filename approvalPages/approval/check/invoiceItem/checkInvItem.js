// Global variables
let currentInvItemData = null;
let currentUser = null;

// Development mode - bypass authentication
const isDevelopmentMode = true;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

// Initialize page functionality
function initializePage() {
    // Get current user
    if (isDevelopmentMode) {
        // Use dummy user for development
        currentUser = {
            id: 1,
            name: 'Development User',
            username: 'dev.user',
            role: 'Admin'
        };
        console.log('Development mode: Using dummy user');
    } else {
        currentUser = getCurrentUser();
        if (!currentUser) {
            Swal.fire({
                icon: 'error',
                title: 'Authentication Error',
                text: 'Please login to continue'
            }).then(() => {
                window.location.href = '../../../../pages/login.html';
            });
            return;
        }
    }

    // Load invoice item data from URL parameters
    loadInvItemData();
    
    // Setup event listeners
    setupEventListeners();
}

// Load invoice item data
function loadInvItemData() {
    const urlParams = new URLSearchParams(window.location.search);
    const docEntry = urlParams.get('docEntry');
    
    if (!docEntry) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No document entry provided'
        }).then(() => {
            goToMenuCheckInvItem();
        });
        return;
    }

    // Load data from API or use dummy data
    if (isDevelopmentMode) {
        loadInvItemFromDummyData(docEntry);
    } else {
        loadInvItemFromAPI(docEntry);
    }
}

// Load invoice item data from dummy data for development
function loadInvItemFromDummyData(docEntry) {
    const mockData = {
        DocEntry: docEntry,
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
        Comments: "Sample invoice item for checking",
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
    
    console.log('Development mode: Using dummy invoice item data');
    populateInvItemData(mockData);
}

// Load invoice item data from API
function loadInvItemFromAPI(docEntry) {
    // Simulate API call - replace with actual API endpoint
    const mockData = {
        DocEntry: docEntry,
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
        Comments: "Sample invoice item for checking",
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
    
    populateInvItemData(mockData);
}

// Populate invoice item data in the form
function populateInvItemData(data) {
    // Populate header fields
    document.getElementById('DocEntry').value = data.DocEntry || '';
    document.getElementById('DocNum').value = data.DocNum || '';
    document.getElementById('CardCode').value = data.CardCode || '';
    document.getElementById('CardName').value = data.CardName || '';
    document.getElementById('NumAtCard').value = data.NumAtCard || '';
    document.getElementById('DocCur').value = data.DocCur || '';
    document.getElementById('DocDate').value = data.DocDate || '';
    document.getElementById('GroupNum').value = data.GroupNum || '';
    document.getElementById('TrnspCode').value = data.TrnspCode || '';
    document.getElementById('U_BSI_ShippingType').value = data.U_BSI_ShippingType || '';
    document.getElementById('U_BSI_PaymentGroup').value = data.U_BSI_PaymentGroup || '';
    document.getElementById('U_BSI_UDF1').value = data.U_BSI_UDF1 || '';
    document.getElementById('U_BSI_UDF2').value = data.U_BSI_UDF2 || '';
    
    // Populate totals
    document.getElementById('PriceBefDi').value = data.PriceBefDi || 0;
    document.getElementById('VatSum').value = data.VatSum || 0;
    document.getElementById('DocTotal').value = data.DocTotal || 0;
    
    // Populate comments
    document.getElementById('comments').value = data.Comments || '';
    
    // Populate approval info
    document.getElementById('preparedBySearch').value = data.preparedBy || '';
    document.getElementById('acknowledgeBySearch').value = data.acknowledgeBy || '';
    document.getElementById('checkedBySearch').value = data.checkedBy || '';
    document.getElementById('approvedBySearch').value = data.approvedBy || '';
    document.getElementById('receivedBySearch').value = data.receivedBy || '';
    
    // Populate items table
    populateItemsTable(data.Items || []);
    
    // Show rejection remarks if exists
    if (data.RejectionRemarks) {
        document.getElementById('rejectionRemarks').value = data.RejectionRemarks;
        document.getElementById('rejectionRemarksSection').style.display = 'block';
    }
    
    // Apply text wrapping
    refreshTextWrapping();
}

// Populate items table
function populateItemsTable(items) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    items.forEach((item, index) => {
        const row = createItemRow(item, index);
        tableBody.appendChild(row);
    });
}

// Create item row
function createItemRow(item, index) {
    const row = document.createElement('tr');
    row.className = 'border-b';
    
    row.innerHTML = `
        <td class="p-2 border no-column">
            <input type="number" class="line-num-input no-input p-2 border rounded bg-gray-100" value="${item.LineNum || index}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border item-code-column">
            <input type="text" class="item-code-input p-2 border rounded bg-gray-100" value="${item.ItemCode || ''}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border description-column">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off">${item.ItemName || ''}</textarea>
        </td>
        <td class="p-2 border description-column">
            <textarea class="w-full item-free-txt bg-gray-100 resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" style="height: 40px; vertical-align: top;" disabled autocomplete="off">${item.FreeTxt || ''}</textarea>
        </td>
        <td class="p-2 border h-12 quantity-column">
            <textarea class="quantity-input item-sls-qty bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: center;" disabled autocomplete="off">${item.Quantity || ''}</textarea>
        </td>
        <td class="p-2 border h-12 quantity-column">
            <textarea class="quantity-input item-quantity bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: center;" disabled autocomplete="off">${item.InvQty || ''}</textarea>
        </td>
        <td class="p-2 border uom-column" style="display: none;">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="10" disabled autocomplete="off" value="${item.UoM || ''}" />
        </td>
        <td class="p-2 border h-12 price-column">
            <textarea class="price-input item-sls-price bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" disabled autocomplete="off">${item.SalesPrice || ''}</textarea>
        </td>
        <td class="p-2 border h-12 price-column">
            <textarea class="price-input item-price bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" disabled autocomplete="off">${item.Price || ''}</textarea>
        </td>
        <td class="p-2 border discount-column">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="8" disabled autocomplete="off" value="${item.DiscPrcnt || ''}" />
        </td>
        <td class="p-2 border tax-code-column">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="8" disabled autocomplete="off" value="${item.TaxCode || ''}" />
        </td>
        <td class="p-2 border h-12 line-total-column">
            <textarea class="line-total-input item-line-total bg-gray-100 overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" disabled autocomplete="off">${item.LineTotal || ''}</textarea>
        </td>
        <td class="p-2 border account-code-column" style="display: none;">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="15" disabled autocomplete="off" value="${item.AccountCode || ''}" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" disabled autocomplete="off" value="${item.BaseType || 0}" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" disabled autocomplete="off" value="${item.BaseEntry || 0}" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" disabled autocomplete="off" value="${item.BaseLine || 0}" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" disabled autocomplete="off" value="${item.LineType || 0}" />
        </td>
    `;
    
    return row;
}

// Setup event listeners
function setupEventListeners() {
    // Add any additional event listeners here
}

// Approve invoice item
function approveInvItem() {
    if (!currentInvItemData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice item data available'
        });
        return;
    }

    Swal.fire({
        title: 'Confirm Approval',
        text: 'Are you sure you want to approve this invoice item?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, approve it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Update status to checked
            updateInvItemStatus('Checked');
        }
    });
}

// Reject invoice item
function rejectInvItem() {
    if (!currentInvItemData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice item data available'
        });
        return;
    }

    Swal.fire({
        title: 'Reject Invoice Item',
        input: 'textarea',
        inputLabel: 'Rejection Remarks',
        inputPlaceholder: 'Enter rejection reason...',
        inputAttributes: {
            'aria-label': 'Enter rejection remarks',
            'aria-describedby': 'rejection-remarks-help'
        },
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
            if (!value || value.trim() === '') {
                return 'Please enter rejection remarks';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Update status to rejected with remarks
            updateInvItemStatus('Rejected', result.value);
        }
    });
}

// Update invoice item status
function updateInvItemStatus(status, remarks = '') {
    if (!currentInvItemData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice item data available'
        });
        return;
    }

    // Prepare data for API call
    const updateData = {
        DocEntry: currentInvItemData.DocEntry,
        Status: status,
        CheckedBy: currentUser.username,
        CheckedDate: new Date().toISOString(),
        Remarks: remarks
    };

    // Simulate API call
    // In real implementation, this would be an actual API call
    console.log('Updating invoice item status:', updateData);

    // Show success message
    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Invoice item has been ${status.toLowerCase()} successfully`,
        timer: 2000,
        showConfirmButton: false
    }).then(() => {
        // Navigate back to menu
        goToMenuCheckInvItem();
    });
}

// Navigation function
function goToMenuCheckInvItem() {
    // Navigate to the invoice item check menu
    window.location.href = '../../dashboardCheck/invoiceItem/menuInvItemCheck.html';
}

// Get current user from auth.js
function getCurrentUser() {
    try {
        // This function should be available from auth.js
        if (typeof getCurrentUser === 'function') {
            return getCurrentUser();
        } else {
            // Fallback for testing
            return {
                username: 'TestUser',
                role: 'Checker'
            };
        }
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
    }).format(amount);
}

// Utility function to validate numeric input
function validateNumericInput(input) {
    const value = input.value;
    const numericValue = value.replace(/[^0-9.-]/g, '');
    
    if (value !== numericValue) {
        input.value = numericValue;
    }
}

// Export functions for global access
window.approveInvItem = approveInvItem;
window.rejectInvItem = rejectInvItem;
window.goToMenuCheckInvItem = goToMenuCheckInvItem; 