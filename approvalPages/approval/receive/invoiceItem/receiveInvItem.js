// Global variables
let currentInvItemData = null;
let currentUser = null;
let isProcessing = false;

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
    
    // Initialize print button visibility
    togglePrintButton();
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
            goToMenuReceiveInvItem();
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
        Comments: "Sample invoice item for receiving",
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
        receivedBy: ""
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
        Comments: "Sample invoice item for receiving",
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
        receivedBy: ""
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
    
    // Make all fields read-only since this is a receive page
    makeAllFieldsReadOnly();
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

// Receive invoice item
function receiveInvItem() {
    if (!currentInvItemData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice item data available'
        });
        return;
    }

    // Prevent double-clicking
    if (isProcessing) {
        return;
    }

    Swal.fire({
        title: 'Confirm Receipt',
        text: 'Are you sure you want to receive this invoice item?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Receive',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateInvItemStatus('Received');
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

    // Create custom dialog with single field
    Swal.fire({
        title: 'Reject Invoice Item',
        html: `
            <div class="mb-4">
                <p class="text-sm text-gray-600 mb-3">Please provide a reason for rejection:</p>
                <div id="rejectionFieldsContainer">
                    <textarea id="rejectionField1" class="w-full p-2 border rounded-md" placeholder="Enter rejection reason" rows="3"></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        width: '600px',
        didOpen: () => {
            // Initialize the field with user prefix
            const firstField = document.getElementById('rejectionField1');
            if (firstField) {
                initializeWithRejectionPrefix(firstField);
            }
            
            // Add event listener for input protection
            const field = document.querySelector('#rejectionFieldsContainer textarea');
            if (field) {
                field.addEventListener('input', handleRejectionInput);
            }
        },
        preConfirm: () => {
            // Get the rejection remark
            const field = document.querySelector('#rejectionFieldsContainer textarea');
            const remarks = field ? field.value.trim() : '';
            
            if (remarks === '') {
                Swal.showValidationMessage('Please enter a rejection reason');
                return false;
            }
            
            return remarks;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            updateInvItemStatusWithRemarks('Rejected', result.value);
        }
    });
}

// Update invoice item status
function updateInvItemStatus(status) {
    if (!currentInvItemData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice item data available'
        });
        return;
    }

    // Set processing flag to prevent double-clicks
    isProcessing = true;

    const userId = getUserId();
    if (!userId) {
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'Unable to get user ID from token. Please login again.'
        });
        isProcessing = false;
        return;
    }

    // Prepare data for API call
    const updateData = {
        DocEntry: currentInvItemData.DocEntry,
        Status: status,
        ReceivedBy: currentUser.username,
        ReceivedDate: new Date().toISOString(),
        Remarks: ''
    };

    // Show loading
    Swal.fire({
        title: `${status === 'Received' ? 'Receiving' : 'Processing'}...`,
        text: 'Please wait while we process your request.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Simulate API call
    // In real implementation, this would be an actual API call
    console.log('Updating invoice item status:', updateData);

    // Simulate API delay
    setTimeout(() => {
        isProcessing = false;
        
        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `Invoice item has been ${status.toLowerCase()} successfully`,
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            // Navigate back to menu
            goToMenuReceiveInvItem();
        });
    }, 1000);
}

// Update invoice item status with remarks
function updateInvItemStatusWithRemarks(status, remarks) {
    if (!currentInvItemData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice item data available'
        });
        return;
    }

    const userId = getUserId();
    if (!userId) {
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'Unable to get user ID from token. Please login again.'
        });
        return;
    }

    // Prepare data for API call
    const updateData = {
        DocEntry: currentInvItemData.DocEntry,
        Status: status,
        ReceivedBy: currentUser.username,
        ReceivedDate: new Date().toISOString(),
        Remarks: remarks || ''
    };

    // Show loading
    Swal.fire({
        title: `${status === 'Received' ? 'Receiving' : 'Rejecting'}...`,
        text: 'Please wait while we process your request.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Simulate API call
    // In real implementation, this would be an actual API call
    console.log('Updating invoice item status with remarks:', updateData);

    // Simulate API delay
    setTimeout(() => {
        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `Invoice item has been ${status.toLowerCase()} successfully`,
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            // Navigate back to menu
            goToMenuReceiveInvItem();
        });
    }, 1000);
}

// Print invoice item
function printInvItem() {
    try {
        console.log("Print function started");
        
        // Get all necessary data from the form
        const invData = {
            DocNum: document.getElementById('DocNum').value || '',
            CardName: document.getElementById('CardName').value || '',
            CardCode: document.getElementById('CardCode').value || '',
            DocDate: document.getElementById('DocDate').value || '',
            DocCur: document.getElementById('DocCur').value || '',
            preparedBy: document.getElementById('preparedBySearch').value || '',
            acknowledgedBy: document.getElementById('acknowledgeBySearch').value || '',
            checkedBy: document.getElementById('checkedBySearch').value || '',
            approvedBy: document.getElementById('approvedBySearch').value || '',
            receivedBy: document.getElementById('receivedBySearch').value || '',
        };
        
        // Get items from the table
        const items = [];
        const rows = document.querySelectorAll('#tableBody tr');
        
        rows.forEach(row => {
            // Extract data from each row
            const lineNum = row.querySelector('.line-num-input') ? row.querySelector('.line-num-input').value || '' : '';
            const itemCode = row.querySelector('.item-code-input') ? row.querySelector('.item-code-input').value || '' : '';
            const itemName = row.querySelector('.item-description') ? row.querySelector('.item-description').value || '' : '';
            const freeTxt = row.querySelector('.item-free-txt') ? row.querySelector('.item-free-txt').value || '' : '';
            const salesQty = row.querySelector('.item-sls-qty') ? row.querySelector('.item-sls-qty').value || '' : '';
            const invQty = row.querySelector('.item-quantity') ? row.querySelector('.item-quantity').value || '' : '';
            const salesPrice = row.querySelector('.item-sls-price') ? row.querySelector('.item-sls-price').value || '' : '';
            const price = row.querySelector('.item-price') ? row.querySelector('.item-price').value || '' : '';
            const lineTotal = row.querySelector('.item-line-total') ? row.querySelector('.item-line-total').value || '' : '';
            
            items.push({
                lineNum: lineNum,
                itemCode: itemCode,
                itemName: itemName,
                freeTxt: freeTxt,
                salesQty: salesQty,
                invQty: invQty,
                salesPrice: salesPrice,
                price: price,
                lineTotal: lineTotal
            });
        });
        
        // Create URL parameters for the print page
        const params = new URLSearchParams();
        params.append('DocNum', invData.DocNum);
        params.append('CardName', invData.CardName);
        params.append('CardCode', invData.CardCode);
        params.append('DocDate', invData.DocDate);
        params.append('DocCur', invData.DocCur);
        
        // Add comments from the form
        const comments = document.getElementById('comments').value || '';
        params.append('comments', comments);
        
        // Add approval information
        params.append('preparedBy', invData.preparedBy);
        params.append('acknowledgedBy', invData.acknowledgedBy);
        params.append('checkedBy', invData.checkedBy);
        params.append('approvedBy', invData.approvedBy);
        params.append('receivedBy', invData.receivedBy);
        
        // Add items data as JSON
        params.append('items', encodeURIComponent(JSON.stringify(items)));
        
        console.log("Opening print page");
        
        // Open the print page in a new window
        window.open(`printInvItem.html?${params.toString()}`, '_blank');
    } catch (error) {
        console.error("Error in printInvItem function:", error);
        alert("Terjadi kesalahan saat mencetak: " + error.message);
    }
}

// Function to make all fields read-only for receive view
function makeAllFieldsReadOnly() {
    // Make all input fields read-only with gray background
    const inputFields = document.querySelectorAll('input[type="text"]:not([id$="Search"]), input[type="date"], input[type="number"], textarea');
    inputFields.forEach(field => {
        field.readOnly = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
        field.classList.remove('bg-white');
    });
    
    // Make search inputs read-only with gray background
    const searchInputs = document.querySelectorAll('input[id$="Search"]');
    searchInputs.forEach(field => {
        field.readOnly = true;
        field.classList.add('bg-gray-100');
        field.classList.remove('bg-gray-50', 'bg-white');
        // Remove the onkeyup event to prevent search triggering
        field.removeAttribute('onkeyup');
    });
    
    // Disable all select fields with gray background
    const selectFields = document.querySelectorAll('select');
    selectFields.forEach(field => {
        field.disabled = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
        field.classList.remove('bg-white');
    });
    
    // Disable all checkboxes
    const checkboxFields = document.querySelectorAll('input[type="checkbox"]');
    checkboxFields.forEach(field => {
        field.disabled = true;
        field.classList.add('cursor-not-allowed');
    });
    
    // Handle table inputs and textareas - make them all gray
    const tableInputs = document.querySelectorAll('#tableBody input, #tableBody textarea');
    tableInputs.forEach(input => {
        input.readOnly = true;
        input.classList.add('bg-gray-100');
        input.classList.remove('bg-white');
    });
}

// Function to toggle print button visibility based on document status
function togglePrintButton() {
    const printButton = document.getElementById('printButton');
    
    // Show print button if status is "Received"
    if (printButton) {
        printButton.style.display = 'block';
    }
}

// Function to initialize textarea with user prefix for rejection
function initializeWithRejectionPrefix(textarea) {
    const userInfo = getUserInfo();
    const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
    textarea.value = prefix;
    
    // Store the prefix length as a data attribute
    textarea.dataset.prefixLength = prefix.length;
    
    // Set selection range after the prefix
    textarea.setSelectionRange(prefix.length, prefix.length);
    textarea.focus();
}

// Function to handle input and protect the prefix for rejection
function handleRejectionInput(event) {
    const textarea = event.target;
    const prefixLength = parseInt(textarea.dataset.prefixLength || '0');
    
    // If user tries to modify content before the prefix length
    if (textarea.selectionStart < prefixLength || textarea.selectionEnd < prefixLength) {
        // Restore the prefix
        const userInfo = getUserInfo();
        const prefix = `[${userInfo.name} - ${userInfo.role}]: `;
        
        // Only restore if the prefix is damaged
        if (!textarea.value.startsWith(prefix)) {
            const userText = textarea.value.substring(prefixLength);
            textarea.value = prefix + userText;
            
            // Reset cursor position after the prefix
            textarea.setSelectionRange(prefixLength, prefixLength);
        } else {
            // Just move cursor after prefix
            textarea.setSelectionRange(prefixLength, prefixLength);
        }
    }
}

// Function to get current user information
function getUserInfo() {
    // Use functions from auth.js to get user information
    let userName = 'Unknown User';
    let userRole = 'Receiver'; // Default role for this page since we're on the receiver page
    
    try {
        // Get user info from getCurrentUser function in auth.js
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.username) {
            userName = currentUser.username;
        }
        
        // Get user role based on the current page
        // Since we're on the receiver page, the role is Receiver
    } catch (e) {
        console.error('Error getting user info:', e);
    }
    
    return { name: userName, role: userRole };
}

// Navigation function
function goToMenuReceiveInvItem() {
    // Navigate to the invoice item receive menu
    window.location.href = '../../../dashboard/dashboardReceive/invoiceItem/menuInvItemReceive.html';
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
                role: 'Receiver'
            };
        }
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Get user ID from auth.js
function getUserId() {
    try {
        // This function should be available from auth.js
        if (typeof getUserId === 'function') {
            return getUserId();
        } else {
            // Fallback for testing
            return 'test-user-id';
        }
    } catch (error) {
        console.error('Error getting user ID:', error);
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
window.receiveInvItem = receiveInvItem;
window.rejectInvItem = rejectInvItem;
window.printInvItem = printInvItem;
window.goToMenuReceiveInvItem = goToMenuReceiveInvItem; 