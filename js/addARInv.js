// Global variables
let customers = [];
let items = [];
let users = [];
let currentUser = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadCustomers();
    loadItems();
    loadUsers();
    setupEventListeners();
    calculateTotals();
});

// Initialize page elements
function initializePage() {
    // Set current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('docDate').value = today;
    
    // Set default currency
    document.getElementById('docCur').value = 'IDR';
    
    // Set default status
    document.getElementById('docStatus').value = 'D';
    
    // Initialize totals
    document.getElementById('docTotal').value = '0.00';
    document.getElementById('vatSum').value = '0.00';
}

// Load customers from API
async function loadCustomers() {
    try {
        const response = await fetch('/api/customers');
        if (response.ok) {
            customers = await response.json();
        } else {
            console.error('Failed to load customers');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// Load items from API
async function loadItems() {
    try {
        const response = await fetch('/api/items');
        if (response.ok) {
            items = await response.json();
        } else {
            console.error('Failed to load items');
        }
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

// Load users from API
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (response.ok) {
            users = await response.json();
            populateUserDropdowns();
        } else {
            console.error('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Filter customers
function filterCustomers() {
    const searchTerm = document.getElementById('cardCodeSearch').value.toLowerCase();
    const dropdown = document.getElementById('cardCodeDropdown');
    const select = document.getElementById('cardCode');
    
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
    document.getElementById('cardCode').value = customer.cardCode;
    document.getElementById('cardName').value = customer.cardName;
    document.getElementById('cardCodeDropdown').classList.add('hidden');
}

// Filter items
function filterItems(input) {
    const searchTerm = input.value.toLowerCase();
    const row = input.closest('tr');
    const dropdown = row.querySelector('.item-dropdown');
    
    // Clear previous options
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
    
    itemInput.value = item.itemCode;
    descriptionTextarea.value = item.itemName;
    
    // Hide dropdown
    row.querySelector('.item-dropdown').classList.add('hidden');
    
    // Calculate line total
    calculateLineTotal(row);
}

// Validate quantity input
function validateQuantity(input) {
    const value = input.value;
    const numericValue = parseFloat(value);
    
    if (isNaN(numericValue) || numericValue < 0) {
        input.value = '';
        return;
    }
    
    // Limit to 6 decimal places
    if (value.includes('.') && value.split('.')[1].length > 6) {
        input.value = parseFloat(numericValue.toFixed(6));
    }
    
    calculateLineTotal(input.closest('tr'));
}

// Validate price input
function validatePrice(input) {
    const value = input.value;
    const numericValue = parseFloat(value);
    
    if (isNaN(numericValue) || numericValue < 0) {
        input.value = '';
        return;
    }
    
    // Limit to 6 decimal places
    if (value.includes('.') && value.split('.')[1].length > 6) {
        input.value = parseFloat(numericValue.toFixed(6));
    }
    
    calculateLineTotal(input.closest('tr'));
}

// Calculate line total
function calculateLineTotal(row) {
    const quantityInput = row.querySelector('.item-quantity');
    const priceInput = row.querySelector('.item-price');
    const lineTotalInput = row.querySelector('.item-line-total');
    
    const quantity = parseFloat(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const lineTotal = quantity * price;
    
    lineTotalInput.value = lineTotal.toFixed(6);
    
    calculateTotals();
}

// Calculate document totals
function calculateTotals() {
    const rows = document.querySelectorAll('#tableBody tr');
    let docTotal = 0;
    let vatSum = 0;
    
    rows.forEach(row => {
        const lineTotalInput = row.querySelector('.item-line-total');
        const lineTotal = parseFloat(lineTotalInput.value) || 0;
        docTotal += lineTotal;
    });
    
    // Calculate VAT (assuming 11% for IDR)
    const currency = document.getElementById('docCur').value;
    if (currency === 'IDR') {
        vatSum = docTotal * 0.11;
    }
    
    document.getElementById('docTotal').value = docTotal.toFixed(6);
    document.getElementById('vatSum').value = vatSum.toFixed(6);
}

// Add new row
function addRow() {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td class="p-2 border relative item-code-column">
            <input type="text" class="item-input item-code-input p-2 border rounded" autocomplete="off" />
            <div class="item-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-40 overflow-y-auto"></div>
        </td>
        <td class="p-2 border description-column">
            <textarea class="w-full item-description bg-white resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" disabled style="height: 40px; vertical-align: top;" autocomplete="off"></textarea>
        </td>
        <td class="p-2 border h-12 quantity-column">
            <textarea class="quantity-input item-quantity bg-white overflow-x-auto whitespace-nowrap" maxlength="15" required style="resize: none; height: 40px; text-align: center;" autocomplete="off" oninput="validateQuantity(this)"></textarea>
        </td>
        <td class="p-2 border h-12 price-column">
            <textarea class="price-input item-price bg-white overflow-x-auto whitespace-nowrap" maxlength="15" required style="resize: none; height: 40px; text-align: right;" autocomplete="off" oninput="validatePrice(this)"></textarea>
        </td>
        <td class="p-2 border h-12 line-total-column">
            <textarea class="line-total-input item-line-total bg-white overflow-x-auto whitespace-nowrap" maxlength="15" required style="resize: none; height: 40px; text-align: right;" autocomplete="off" disabled></textarea>
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full p-2 border rounded" maxlength="8" autocomplete="off" />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full p-2 border rounded" maxlength="8" autocomplete="off" />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full p-2 border rounded" maxlength="15" autocomplete="off" />
        </td>
        <td class="p-2 border">
            <input type="number" class="w-full p-2 border rounded" autocomplete="off" />
        </td>
        <td class="p-2 border">
            <input type="number" class="w-full p-2 border rounded" autocomplete="off" />
        </td>
        <td class="p-2 border">
            <input type="number" class="w-full p-2 border rounded" autocomplete="off" />
        </td>
        <td class="p-2 border text-center action-column">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
    setupRowEventListeners(newRow);
}

// Delete row
function deleteRow(button) {
    const row = button.closest('tr');
    if (document.querySelectorAll('#tableBody tr').length > 1) {
        row.remove();
        calculateTotals();
    } else {
        Swal.fire({
            icon: 'warning',
            title: 'Cannot Delete',
            text: 'At least one item row must remain.'
        });
    }
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
    
    // Currency change
    document.getElementById('docCur').addEventListener('change', calculateTotals);
    
    // Setup existing rows
    document.querySelectorAll('#tableBody tr').forEach(row => {
        setupRowEventListeners(row);
    });
}

// Setup row event listeners
function setupRowEventListeners(row) {
    const itemInput = row.querySelector('.item-input');
    
    itemInput.addEventListener('input', () => filterItems(itemInput));
    itemInput.addEventListener('blur', () => {
        setTimeout(() => {
            row.querySelector('.item-dropdown').classList.add('hidden');
        }, 200);
    });
}

// Populate user dropdowns
function populateUserDropdowns() {
    const userFields = ['preparedBy', 'acknowledgeBy', 'checkedBy', 'approvedBy', 'receivedBy'];
    
    userFields.forEach(field => {
        const select = document.getElementById(field);
        const searchInput = document.getElementById(field + 'Search');
        const dropdown = document.getElementById(field + 'SelectDropdown');
        
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
    try {
        // Validate required fields
        if (!validateForm()) {
            return;
        }
        
        const formData = collectFormData(isSubmit);
        
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
                title: isSubmit ? 'Document Submitted Successfully!' : 'Document Saved Successfully!',
                text: `AR Invoice ${result.docNum} has been ${isSubmit ? 'submitted' : 'saved'}.`,
                confirmButtonText: 'OK'
            }).then(() => {
                goToMenuARInv();
            });
        } else {
            const error = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to save document'
            });
        }
    } catch (error) {
        console.error('Error submitting document:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while saving the document'
        });
    }
}

// Validate form
function validateForm() {
    const requiredFields = [
        { id: 'cardCode', name: 'Customer Code' },
        { id: 'docCur', name: 'Currency' }
    ];
    
    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element.value.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: `${field.name} is required.`
            });
            element.focus();
            return false;
        }
    }
    
    // Validate at least one item row
    const rows = document.querySelectorAll('#tableBody tr');
    let hasValidRow = false;
    
    rows.forEach(row => {
        const itemCode = row.querySelector('.item-input').value;
        const quantity = row.querySelector('.item-quantity').value;
        const price = row.querySelector('.item-price').value;
        
        if (itemCode && quantity && price) {
            hasValidRow = true;
        }
    });
    
    if (!hasValidRow) {
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
        docEntry: document.getElementById('docEntry').value,
        docNum: document.getElementById('docNum').value,
        docDate: document.getElementById('docDate').value,
        cardCode: document.getElementById('cardCode').value,
        cardName: document.getElementById('cardName').value,
        docTotal: parseFloat(document.getElementById('docTotal').value) || 0,
        vatSum: parseFloat(document.getElementById('vatSum').value) || 0,
        docCur: document.getElementById('docCur').value,
        docStatus: isSubmit ? 'O' : 'D',
        numAtCard: document.getElementById('numAtCard').value,
        comments: document.getElementById('comments').value,
        series: parseInt(document.getElementById('series').value) || 0,
        cntctCode: parseInt(document.getElementById('cntctCode').value) || 0,
        slpCode: parseInt(document.getElementById('slpCode').value) || 0
    };
    
    const details = [];
    const rows = document.querySelectorAll('#tableBody tr');
    
    rows.forEach((row, index) => {
        const itemCode = row.querySelector('.item-input').value;
        const description = row.querySelector('.item-description').value;
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const lineTotal = parseFloat(row.querySelector('.item-line-total').value) || 0;
        const vatGroup = row.querySelector('td:nth-child(6) input').value;
        const whsCode = row.querySelector('td:nth-child(7) input').value;
        const accountCode = row.querySelector('td:nth-child(8) input').value;
        const baseEntry = parseInt(row.querySelector('td:nth-child(9) input').value) || 0;
        const baseLine = parseInt(row.querySelector('td:nth-child(10) input').value) || 0;
        const baseType = parseInt(row.querySelector('td:nth-child(11) input').value) || 0;
        
        if (itemCode && quantity && price) {
            details.push({
                lineNum: index + 1,
                itemCode: itemCode,
                dscription: description,
                quantity: quantity,
                price: price,
                lineTotal: lineTotal,
                vatGroup: vatGroup,
                whsCode: whsCode,
                accountCode: accountCode,
                baseEntry: baseEntry,
                baseLine: baseLine,
                baseType: baseType
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
        header: header,
        details: details,
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