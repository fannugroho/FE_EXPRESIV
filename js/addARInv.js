// Global variables
let customers = [];
let items = [];
let users = [];
let currentUser = null;

// Development mode - bypass authentication
const isDevelopmentMode = true;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadCustomers();
    loadItems();
    loadUsers();
    setupEventListeners();
    calculateTotals();
    
    // Apply text wrapping after page initialization
    if (window.refreshTextWrapping) {
        setTimeout(() => {
            window.refreshTextWrapping();
        }, 200);
    }
});

// Initialize page elements
function initializePage() {
    // Set current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('DocDate').value = today;
    
    // Set default currency
    document.getElementById('DocCur').value = 'IDR';
    
    // Set default values for new fields
    document.getElementById('GroupNum').value = '1';
    document.getElementById('TrnspCode').value = '1';
    document.getElementById('U_BSI_Expressiv_IsTransfered').value = 'N';
    
    // Initialize totals
    document.getElementById('DocTotal').value = '0.00';
    document.getElementById('VatSum').value = '0.00';
    document.getElementById('PriceBefDi').value = '0.00';
}

// Load customers from API
async function loadCustomers() {
    try {
        if (isDevelopmentMode) {
            // Use dummy data for development
            customers = [
                { CardCode: 'C001', CardName: 'PT Sample Customer 1' },
                { CardCode: 'C002', CardName: 'PT Sample Customer 2' },
                { CardCode: 'C003', CardName: 'PT Sample Customer 3' }
            ];
            console.log('Development mode: Using dummy customers data');
        } else {
            const response = await fetch('/api/customers');
            if (response.ok) {
                customers = await response.json();
            } else {
                console.error('Failed to load customers');
            }
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// Load items from API
async function loadItems() {
    try {
        if (isDevelopmentMode) {
            // Use dummy data for development
            items = [
                { ItemCode: 'ITEM001', ItemName: 'Sample Item 1', UoM: 'PCS' },
                { ItemCode: 'ITEM002', ItemName: 'Sample Item 2', UoM: 'PCS' },
                { ItemCode: 'ITEM003', ItemName: 'Sample Item 3', UoM: 'PCS' }
            ];
            console.log('Development mode: Using dummy items data');
        } else {
            const response = await fetch('/api/items');
            if (response.ok) {
                items = await response.json();
            } else {
                console.error('Failed to load items');
            }
        }
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

// Load users from API
async function loadUsers() {
    try {
        if (isDevelopmentMode) {
            // Use dummy data for development
            users = [
                { id: 1, name: 'John Doe', username: 'john.doe' },
                { id: 2, name: 'Jane Smith', username: 'jane.smith' },
                { id: 3, name: 'Bob Johnson', username: 'bob.johnson' }
            ];
            console.log('Development mode: Using dummy users data');
            populateUserDropdowns();
        } else {
            const response = await fetch('/api/users');
            if (response.ok) {
                users = await response.json();
                populateUserDropdowns();
            } else {
                console.error('Failed to load users');
            }
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Filter customers
function filterCustomers() {
    const searchTerm = document.getElementById('cardCodeSearch').value.toLowerCase();
    const dropdown = document.getElementById('cardCodeDropdown');
    const select = document.getElementById('CardCode');
    
    // Clear previous options
    dropdown.innerHTML = '';
    select.innerHTML = '<option value="">Select a customer</option>';
    
    if (searchTerm.length < 2) {
        dropdown.classList.add('hidden');
        return;
    }
    
    const filteredCustomers = customers.filter(customer => 
        customer.cardCode.toLowerCase().includes(searchTerm) ||
        customer.cardName.toLowerCase().includes(searchTerm)
    );
    
    if (filteredCustomers.length > 0) {
        filteredCustomers.forEach(customer => {
            // Add to dropdown
            const dropdownItem = document.createElement('div');
            dropdownItem.className = 'dropdown-item';
            dropdownItem.textContent = `${customer.cardCode} - ${customer.cardName}`;
            dropdownItem.onclick = () => selectCustomer(customer);
            dropdown.appendChild(dropdownItem);
            
            // Add to select
            const option = document.createElement('option');
            option.value = customer.cardCode;
            option.textContent = `${customer.cardCode} - ${customer.cardName}`;
            select.appendChild(option);
        });
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
}

// Select customer
function selectCustomer(customer) {
    document.getElementById('cardCodeSearch').value = `${customer.cardCode} - ${customer.cardName}`;
    document.getElementById('CardCode').value = customer.cardCode;
    document.getElementById('CardName').value = customer.cardName;
    document.getElementById('cardCodeDropdown').classList.add('hidden');
}

// Filter items
function filterItems(input) {
    const searchTerm = input.value.toLowerCase();
    const row = input.closest('tr');
    const dropdown = row.querySelector('.item-dropdown');
    
    dropdown.innerHTML = '';
    
    if (searchTerm.length < 2) {
        dropdown.classList.add('hidden');
        return;
    }
    
    const filteredItems = items.filter(item => 
        item.itemCode.toLowerCase().includes(searchTerm) ||
        item.itemName.toLowerCase().includes(searchTerm)
    );
    
    if (filteredItems.length > 0) {
        filteredItems.forEach(item => {
            const dropdownItem = document.createElement('div');
            dropdownItem.className = 'dropdown-item';
            dropdownItem.innerHTML = `<span class="item-code">${item.itemCode}</span><span class="item-name">${item.itemName}</span>`;
            dropdownItem.onclick = () => selectItem(item, row);
            dropdown.appendChild(dropdownItem);
        });
        dropdown.classList.remove('hidden');
    } else {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No items found';
        dropdown.appendChild(noResults);
        dropdown.classList.remove('hidden');
    }
}

// Select item
function selectItem(item, row) {
    const itemInput = row.querySelector('.item-input');
    const descriptionTextarea = row.querySelector('.item-description');
    const unitMsrInput = row.querySelector('td:nth-child(7) input'); // UoM field (hidden)
    const dropdown = row.querySelector('.item-dropdown');
    
    itemInput.value = item.itemCode;
    descriptionTextarea.value = item.itemName;
    
    // Auto-fill UoM if available
    if (item.unitMsr) {
        unitMsrInput.value = item.unitMsr;
    } else {
        unitMsrInput.value = 'PCS'; // Default unit of measure
    }
    
    dropdown.classList.add('hidden');
    
    // Auto-fill price if available
    const priceInput = row.querySelector('.item-price');
    if (item.price) {
        priceInput.value = item.price;
    }
    
    calculateLineTotal(row);
    
    // Apply text wrapping after item selection
    if (window.refreshTextWrapping) {
        setTimeout(() => {
            window.refreshTextWrapping();
        }, 50);
    }
}

// Validate quantity input
function validateQuantity(input) {
    const value = input.value;
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    if (value !== numericValue) {
        input.value = numericValue;
    }
    
    calculateLineTotal(input.closest('tr'));
}

// Validate price input
function validatePrice(input) {
    const value = input.value;
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    if (value !== numericValue) {
        input.value = numericValue;
    }
    
    calculateLineTotal(input.closest('tr'));
}

// Calculate line total
function calculateLineTotal(row) {
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const lineTotal = quantity * price;
    
    row.querySelector('.item-line-total').value = lineTotal.toFixed(2);
    
    calculateTotals();
}

// Calculate totals
function calculateTotals() {
    let totalBeforeDiscount = 0;
    let totalTax = 0;
    
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach(row => {
        const lineTotal = parseFloat(row.querySelector('.item-line-total').value) || 0;
        totalBeforeDiscount += lineTotal;
    });
    
    // For now, tax calculation is simplified - you may need to implement proper tax logic
    totalTax = totalBeforeDiscount * 0.11; // 11% tax rate example
    
    const totalAmount = totalBeforeDiscount + totalTax;
    
    document.getElementById('PriceBefDi').value = totalBeforeDiscount.toFixed(2);
    document.getElementById('VatSum').value = totalTax.toFixed(2);
    document.getElementById('DocTotal').value = totalAmount.toFixed(2);
}

// Add new row
function addRow() {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    const rowIndex = tableBody.children.length;
    
    newRow.innerHTML = `
        <td class="p-2 border item-code-column">
            <input type="number" class="line-num-input p-2 border rounded bg-gray-100" value="${rowIndex}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border relative item-code-column">
            <input type="text" class="item-input item-code-input p-2 border rounded" autocomplete="off" />
            <div class="item-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-40 overflow-y-auto"></div>
        </td>
        <td class="p-2 border description-column">
            <textarea class="w-full item-description bg-white resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off"></textarea>
        </td>
        <td class="p-2 border description-column">
            <textarea class="w-full item-free-txt bg-white resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" style="height: 40px; vertical-align: top;" autocomplete="off"></textarea>
        </td>
        <td class="p-2 border h-12 quantity-column">
            <textarea class="quantity-input item-sls-qty bg-white overflow-x-auto whitespace-nowrap" maxlength="15" required style="resize: none; height: 40px; text-align: center;" autocomplete="off" oninput="validateQuantity(this)"></textarea>
        </td>
        <td class="p-2 border h-12 quantity-column">
            <textarea class="quantity-input item-quantity bg-white overflow-x-auto whitespace-nowrap" maxlength="15" required style="resize: none; height: 40px; text-align: center;" autocomplete="off" oninput="validateQuantity(this)"></textarea>
        </td>
        <td class="p-2 border uom-column" style="display: none;">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="10" autocomplete="off" disabled />
        </td>
        <td class="p-2 border h-12 price-column">
            <textarea class="price-input item-sls-price bg-white overflow-x-auto whitespace-nowrap" maxlength="15" required style="resize: none; height: 40px; text-align: right;" autocomplete="off" oninput="validatePrice(this)"></textarea>
        </td>
        <td class="p-2 border h-12 price-column">
            <textarea class="price-input item-price bg-white overflow-x-auto whitespace-nowrap" maxlength="15" required style="resize: none; height: 40px; text-align: right;" autocomplete="off" oninput="validatePrice(this)"></textarea>
        </td>
        <td class="p-2 border discount-column">
            <input type="text" class="w-full p-2 border rounded" maxlength="8" autocomplete="off" />
        </td>
        <td class="p-2 border tax-code-column">
            <input type="text" class="w-full p-2 border rounded" maxlength="8" autocomplete="off" />
        </td>
        <td class="p-2 border h-12 line-total-column">
            <textarea class="line-total-input item-line-total bg-white overflow-x-auto whitespace-nowrap" maxlength="15" required style="resize: none; height: 40px; text-align: right;" autocomplete="off" disabled></textarea>
        </td>
        <td class="p-2 border account-code-column" style="display: none;">
            <input type="text" class="w-full p-2 border rounded" maxlength="15" autocomplete="off" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" value="0" disabled autocomplete="off" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" value="0" disabled autocomplete="off" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" value="0" disabled autocomplete="off" />
        </td>
        <td class="p-2 border base-column" style="display: none;">
            <input type="number" class="w-full p-2 border rounded bg-gray-100" value="0" disabled autocomplete="off" />
        </td>
        <td class="p-2 border text-center action-column">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
    setupRowEventListeners(newRow);
    
    // Apply text wrapping to new row
    if (window.refreshTextWrapping) {
        setTimeout(() => {
            window.refreshTextWrapping();
        }, 100);
    }
}

// Delete row
function deleteRow(button) {
    const row = button.closest('tr');
    row.remove();
    calculateTotals();
    
    // Update line numbers
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach((row, index) => {
        const lineNumInput = row.querySelector('.line-num-input');
        if (lineNumInput) {
            lineNumInput.value = index;
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Customer search
    document.getElementById('cardCodeSearch').addEventListener('input', filterCustomers);
    document.getElementById('cardCodeSearch').addEventListener('blur', () => {
        setTimeout(() => {
            document.getElementById('cardCodeDropdown').classList.add('hidden');
        }, 200);
    });
    
    // Setup existing rows
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach(row => setupRowEventListeners(row));
}

// Setup row event listeners
function setupRowEventListeners(row) {
    const itemInput = row.querySelector('.item-input');
    if (itemInput) {
        itemInput.addEventListener('input', () => filterItems(itemInput));
        itemInput.addEventListener('blur', () => {
            setTimeout(() => {
                const dropdown = row.querySelector('.item-dropdown');
                if (dropdown) {
                    dropdown.classList.add('hidden');
                }
            }, 200);
        });
    }
}

// Populate user dropdowns
function populateUserDropdowns() {
    const userFields = ['preparedBy', 'acknowledgeBy', 'checkedBy', 'approvedBy', 'receivedBy'];
    
    userFields.forEach(field => {
        const select = document.getElementById(field);
        const searchInput = document.getElementById(field + 'Search');
        const dropdown = document.getElementById(field + 'SelectDropdown');
        
        if (select && searchInput && dropdown) {
            // Clear existing options
            select.innerHTML = '<option value="" disabled selected>Choose Name</option>';
            
            // Add user options
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                select.appendChild(option);
            });
            
            // Setup search functionality
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase();
                dropdown.innerHTML = '';
                
                if (searchTerm.length < 2) {
                    dropdown.classList.add('hidden');
                    return;
                }
                
                const filteredUsers = users.filter(user => 
                    user.name.toLowerCase().includes(searchTerm)
                );
                
                if (filteredUsers.length > 0) {
                    filteredUsers.forEach(user => {
                        const dropdownItem = document.createElement('div');
                        dropdownItem.className = 'dropdown-item';
                        dropdownItem.textContent = user.name;
                        dropdownItem.onclick = () => selectUser(user, field);
                        dropdown.appendChild(dropdownItem);
                    });
                    dropdown.classList.remove('hidden');
                } else {
                    dropdown.classList.add('hidden');
                }
            });
            
            searchInput.addEventListener('blur', () => {
                setTimeout(() => {
                    dropdown.classList.add('hidden');
                }, 200);
            });
        }
    });
}

// Select user
function selectUser(user, field) {
    const searchInput = document.getElementById(field + 'Search');
    const select = document.getElementById(field);
    
    searchInput.value = user.name;
    select.value = user.id;
    
    document.getElementById(field + 'SelectDropdown').classList.add('hidden');
}

// Submit document
async function submitDocument(isSubmit = false) {
    if (!validateForm()) {
        return;
    }
    
    const formData = collectFormData(isSubmit);
    
    try {
        const response = await fetch('/api/arinvoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const result = await response.json();
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: isSubmit ? 'Document submitted successfully!' : 'Document saved successfully!'
            }).then(() => {
                goToMenuARInv();
            });
        } else {
            const errorData = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorData.message || 'Failed to save document'
            });
        }
    } catch (error) {
        console.error('Error submitting document:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while submitting the document'
        });
    }
}

// Validate form
function validateForm() {
    const requiredFields = [
        'CardCode',
        'CardName',
        'DocCur',
        'DocDate'
    ];
    
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: `Please fill in all required fields. Missing: ${fieldId}`
            });
            return false;
        }
    }
    
    // Check if at least one item is added
    const rows = document.querySelectorAll('#tableBody tr');
    let hasValidItem = false;
    
    rows.forEach(row => {
        const itemCode = row.querySelector('.item-input').value;
        const quantity = row.querySelector('.item-quantity').value;
        const price = row.querySelector('.item-price').value;
        
        if (itemCode && quantity && price) {
            hasValidItem = true;
        }
    });
    
    if (!hasValidItem) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'At least one item with code, quantity, and price is required.'
        });
        return false;
    }
    
    return true;
}

// Collect form data
function collectFormData(isSubmit) {
    const header = {
        DocEntry: document.getElementById('DocEntry').value,
        DocNum: document.getElementById('DocNum').value,
        DocDate: document.getElementById('DocDate').value,
        CardCode: document.getElementById('CardCode').value,
        CardName: document.getElementById('CardName').value,
        NumAtCard: document.getElementById('NumAtCard').value,
        DocCur: document.getElementById('DocCur').value,
        GroupNum: parseInt(document.getElementById('GroupNum').value) || 1,
        TrnspCode: parseInt(document.getElementById('TrnspCode').value) || 1,
        U_BSI_ShippingType: document.getElementById('U_BSI_ShippingType').value,
        U_BSI_PaymentGroup: document.getElementById('U_BSI_PaymentGroup').value,
        U_BSI_Expressiv_IsTransfered: document.getElementById('U_BSI_Expressiv_IsTransfered').value,
        U_BSI_UDF1: document.getElementById('U_BSI_UDF1').value,
        U_BSI_UDF2: document.getElementById('U_BSI_UDF2').value,
        PriceBefDi: parseFloat(document.getElementById('PriceBefDi').value) || 0,
        VatSum: parseFloat(document.getElementById('VatSum').value) || 0,
        DocTotal: parseFloat(document.getElementById('DocTotal').value) || 0,
        comments: document.getElementById('comments').value
    };
    
    const details = [];
    const rows = document.querySelectorAll('#tableBody tr');
    
    rows.forEach((row, index) => {
        const lineNum = parseInt(row.querySelector('.line-num-input').value) || 0;
        const itemCode = row.querySelector('.item-input').value;
        const dscription = row.querySelector('.item-description').value;
        const freeTxt = row.querySelector('.item-free-txt').value;
        const slsQty = parseFloat(row.querySelector('.item-sls-qty').value) || 0;
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const unitMsr = row.querySelector('td:nth-child(7) input').value; // UoM column (hidden)
        const slsPrice = parseFloat(row.querySelector('.item-sls-price').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const discount = row.querySelector('td:nth-child(10) input').value; // Discount column
        const vatGroup = row.querySelector('td:nth-child(11) input').value; // Tax Code column
        const lineTotal = parseFloat(row.querySelector('.item-line-total').value) || 0;
        const acctCode = row.querySelector('td:nth-child(13) input').value; // Account Code column (hidden)
        const baseType = parseInt(row.querySelector('td:nth-child(14) input').value) || 0; // BaseType column (hidden)
        const baseEntry = parseInt(row.querySelector('td:nth-child(15) input').value) || 0; // BaseEntry column (hidden)
        const baseLine = parseInt(row.querySelector('td:nth-child(16) input').value) || 0; // BaseLine column (hidden)
        const lineType = parseInt(row.querySelector('td:nth-child(17) input').value) || 0; // LineType column (hidden)
        
        if (itemCode && quantity && price) {
            details.push({
                DocEntry: 0,
                LineNum: lineNum,
                ItemCode: itemCode,
                Dscription: dscription,
                FreeTxt: freeTxt,
                SlsQty: slsQty,
                Quantity: quantity,
                UnitMsr: unitMsr,
                SlsPrice: slsPrice,
                PriceBefDi: price,
                Discount: discount,
                VatGroup: vatGroup,
                LineTotal: lineTotal,
                AcctCode: acctCode,
                BaseType: baseType,
                BaseEntry: baseEntry,
                BaseLine: baseLine,
                LineType: lineType
            });
        }
    });
    
    const approval = {
        preparedBy: document.getElementById('preparedBy').value,
        acknowledgeBy: document.getElementById('acknowledgeBy').value,
        checkedBy: document.getElementById('checkedBy').value,
        approvedBy: document.getElementById('approvedBy').value,
        receivedBy: document.getElementById('receivedBy').value
    };
    
    return {
        ...header,
        arInvoiceDetails: details,
        approval: approval,
        isSubmit: isSubmit
    };
}

// Navigation function
function goToMenuARInv() {
    window.location.href = '../pages/approval-dashboard.html';
}

// Preview PDF function (placeholder)
function previewPDF(event) {
    const files = event.target.files;
    const fileList = document.getElementById('fileList');
    
    if (fileList) {
        fileList.innerHTML = '';
        for (let file of files) {
            const fileItem = document.createElement('div');
            fileItem.className = 'text-sm text-gray-600';
            fileItem.textContent = file.name;
            fileList.appendChild(fileItem);
        }
    }
} 