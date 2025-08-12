// Global variables
let customers = [];
let items = [];
let users = [];
let currentUser = null;

// API Configuration - Using BASE_URL from auth.js
const API_BASE_URL = `${BASE_URL}/api`;
let invoiceId = null;
let isEditMode = false;

// Development mode - bypass authentication
const isDevelopmentMode = true;

// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    // Check if we're in edit mode by looking for invoice ID in URL
    checkEditMode();

    initializePage();
    loadCustomers();
    loadItems();
    loadUsers();
    setupEventListeners();

    // Add initial row if not in edit mode
    if (!isEditMode) {
        addRow();
    }

    calculateTotals();

    // Apply text wrapping after page initialization
    if (window.refreshTextWrapping) {
        setTimeout(() => {
            window.refreshTextWrapping();
        }, 200);
    }
});

// Function to check if we're in edit mode and get invoice ID
function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    invoiceId = urlParams.get('id');

    if (invoiceId && invoiceId.trim() !== '') {
        isEditMode = true;
        console.log('Edit mode detected. Invoice ID:', invoiceId);
        // Load invoice details from API
        loadInvoiceDetails(invoiceId);
    } else {
        console.log('Create new invoice mode');
    }
}

// Function to load invoice details from API
async function loadInvoiceDetails(stagingId) {
    try {
        console.log('Loading invoice details for staging ID:', stagingId);

        // Show loading state
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = 'Loading invoice details...';
        }

        const response = await fetch(`${API_BASE_URL}/ar-invoices/${stagingId}/details`, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('API Response:', result);

        if (result.status && result.data) {
            console.log('Successfully loaded invoice data:', result.data);
            populateInvoiceForm(result.data);
        } else {
            console.error('Invalid API response format:', result);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load invoice details. Invalid response format.'
            });
        }

    } catch (error) {
        console.error('Error loading invoice details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load invoice details. Please check your connection and try again.'
        });
    }
}

// Function to populate the form with invoice data
function populateInvoiceForm(invoiceData) {
    try {
        console.log('Populating form with invoice data:', invoiceData);

        // Populate header fields
        if (invoiceData.stagingID) {
            const docEntryField = document.getElementById('DocEntry');
            if (docEntryField) {
                docEntryField.value = invoiceData.stagingID;
            }
        }

        if (invoiceData.docNum) {
            const docNumField = document.getElementById('DocNum');
            if (docNumField) {
                docNumField.value = invoiceData.docNum;
            }
        }

        if (invoiceData.cardCode) {
            const cardCodeField = document.getElementById('CardCode');
            const cardCodeSearchField = document.getElementById('cardCodeSearch');
            if (cardCodeField) {
                cardCodeField.value = invoiceData.cardCode;
            }
            if (cardCodeSearchField) {
                cardCodeSearchField.value = invoiceData.cardCode;
            }
        }

        if (invoiceData.cardName) {
            const cardNameField = document.getElementById('CardName');
            if (cardNameField) {
                cardNameField.value = invoiceData.cardName;
            }
        }

        if (invoiceData.numAtCard) {
            const numAtCardField = document.getElementById('NumAtCard');
            if (numAtCardField) {
                numAtCardField.value = invoiceData.numAtCard;
            }
        }

        if (invoiceData.docCur) {
            const docCurField = document.getElementById('DocCur');
            if (docCurField) {
                docCurField.value = invoiceData.docCur;
            }
        }

        if (invoiceData.docDate) {
            const docDateField = document.getElementById('DocDate');
            if (docDateField) {
                const docDate = new Date(invoiceData.docDate);
                docDateField.value = docDate.toISOString().split('T')[0];
            }
        }

        if (invoiceData.groupNum) {
            const groupNumField = document.getElementById('GroupNum');
            if (groupNumField) {
                groupNumField.value = invoiceData.groupNum;
            }
        }

        if (invoiceData.trnspCode) {
            const trnspCodeField = document.getElementById('TrnspCode');
            if (trnspCodeField) {
                trnspCodeField.value = invoiceData.trnspCode;
            }
        }

        if (invoiceData.u_BSI_ShippingType) {
            const shippingTypeField = document.getElementById('U_BSI_ShippingType');
            if (shippingTypeField) {
                shippingTypeField.value = invoiceData.u_BSI_ShippingType;
            }
        }

        if (invoiceData.u_BSI_PaymentGroup) {
            const paymentGroupField = document.getElementById('U_BSI_PaymentGroup');
            if (paymentGroupField) {
                paymentGroupField.value = invoiceData.u_BSI_PaymentGroup;
            }
        }

        if (invoiceData.u_BSI_Expressiv_IsTransfered) {
            const isTransferedField = document.getElementById('U_BSI_Expressiv_IsTransfered');
            if (isTransferedField) {
                isTransferedField.value = invoiceData.u_BSI_Expressiv_IsTransfered;
            }
        }

        if (invoiceData.u_bsi_udf1) {
            const udf1Field = document.getElementById('U_BSI_UDF1');
            if (udf1Field) {
                udf1Field.value = invoiceData.u_bsi_udf1;
            }
        }

        if (invoiceData.u_bsi_udf2) {
            const udf2Field = document.getElementById('U_BSI_UDF2');
            if (udf2Field) {
                udf2Field.value = invoiceData.u_bsi_udf2;
            }
        }

        // Populate totals
        if (invoiceData.docTotal) {
            const docTotalField = document.getElementById('DocTotal');
            if (docTotalField) {
                docTotalField.value = invoiceData.docTotal;
            }
        }

        if (invoiceData.vatSum) {
            const vatSumField = document.getElementById('VatSum');
            if (vatSumField) {
                vatSumField.value = invoiceData.vatSum;
            }
        }

        if (invoiceData.comments) {
            const commentsField = document.getElementById('comments');
            if (commentsField) {
                commentsField.value = invoiceData.comments;
            }
        }

        // Populate approval fields if available
        if (invoiceData.arInvoiceApprovalSummary) {
            const approval = invoiceData.arInvoiceApprovalSummary;

            if (approval.preparedBy) {
                const preparedByField = document.getElementById('preparedBy');
                const preparedBySearchField = document.getElementById('preparedBySearch');
                if (preparedByField) {
                    preparedByField.value = approval.preparedBy;
                }
                if (preparedBySearchField) {
                    preparedBySearchField.value = approval.preparedBy;
                }
            }

            if (approval.acknowledgedBy) {
                const acknowledgeByField = document.getElementById('acknowledgeBy');
                const acknowledgeBySearchField = document.getElementById('acknowledgeBySearch');
                if (acknowledgeByField) {
                    acknowledgeByField.value = approval.acknowledgedBy;
                }
                if (acknowledgeBySearchField) {
                    acknowledgeBySearchField.value = approval.acknowledgedBy;
                }
            }

            if (approval.checkedBy) {
                const checkedByField = document.getElementById('checkedBy');
                const checkedBySearchField = document.getElementById('checkedBySearch');
                if (checkedByField) {
                    checkedByField.value = approval.checkedBy;
                }
                if (checkedBySearchField) {
                    checkedBySearchField.value = approval.checkedBy;
                }
            }

            if (approval.approvedBy) {
                const approvedByField = document.getElementById('approvedBy');
                const approvedBySearchField = document.getElementById('approvedBySearch');
                if (approvedByField) {
                    approvedByField.value = approval.approvedBy;
                }
                if (approvedBySearchField) {
                    approvedBySearchField.value = approval.approvedBy;
                }
            }

            if (approval.receivedBy) {
                const receivedByField = document.getElementById('receivedBy');
                const receivedBySearchField = document.getElementById('receivedBySearch');
                if (receivedByField) {
                    receivedByField.value = approval.receivedBy;
                }
                if (receivedBySearchField) {
                    receivedBySearchField.value = approval.receivedBy;
                }
            }
        }

        // Populate invoice details if available
        if (invoiceData.arInvoiceDetails && invoiceData.arInvoiceDetails.length > 0) {
            populateInvoiceDetails(invoiceData.arInvoiceDetails);
        }

        // Update page title to indicate edit mode
        document.title = `Edit AR Invoice - ${invoiceData.stagingID || 'Invoice'}`;
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = `Edit AR Invoice - ${invoiceData.stagingID || 'Invoice'}`;
        }

        console.log('Form populated successfully');

    } catch (error) {
        console.error('Error populating form:', error);
        alert('Error populating form data. Please try again.');
    }
}

// Function to populate invoice details table
function populateInvoiceDetails(details) {
    try {
        console.log('Populating invoice details:', details);

        // Clear existing rows except the first one
        const tableBody = document.getElementById('tableBody');
        const firstRow = tableBody.querySelector('tr');
        tableBody.innerHTML = '';
        tableBody.appendChild(firstRow);

        // Add rows for each detail
        details.forEach((detail, index) => {
            if (index === 0) {
                // Use the first existing row
                populateRow(firstRow, detail, index);
            } else {
                // Add new rows
                addRow();
                const newRow = tableBody.querySelector('tr:last-child');
                populateRow(newRow, detail, index);
            }
        });

        // Recalculate totals
        calculateTotals();

        // Apply text wrapping to new rows
        if (window.refreshTextWrapping) {
            setTimeout(() => {
                window.refreshTextWrapping();
            }, 100);
        }

    } catch (error) {
        console.error('Error populating invoice details:', error);
    }
}

// Function to populate a single row with detail data
function populateRow(row, detail, index) {
    try {
        // Set line number
        const lineNumInput = row.querySelector('.line-num-input');
        if (lineNumInput) {
            lineNumInput.value = index;
        }

        // Set item code
        const itemCodeInput = row.querySelector('.item-input');
        if (itemCodeInput && detail.itemCode) {
            itemCodeInput.value = detail.itemCode;
        }

        // Set item description
        const itemDescTextarea = row.querySelector('.item-description');
        if (itemDescTextarea && detail.itemName) {
            itemDescTextarea.value = detail.itemName;
        }

        // Set free text
        const freeTextTextarea = row.querySelector('.item-free-txt');
        if (freeTextTextarea && detail.freeText) {
            freeTextTextarea.value = detail.freeText;
        }

        // Set sales employee
        const salesEmployeeTextarea = row.querySelector('.item-sales-employee');
        if (salesEmployeeTextarea && detail.salesEmployee) {
            salesEmployeeTextarea.value = detail.salesEmployee;
        }

        // Set quantities
        const salesQtyTextarea = row.querySelector('.item-sls-qty');
        if (salesQtyTextarea && detail.salesQuantity) {
            salesQtyTextarea.value = detail.salesQuantity;
        }

        const invQtyTextarea = row.querySelector('.item-quantity');
        if (invQtyTextarea && detail.inventoryQuantity) {
            invQtyTextarea.value = detail.inventoryQuantity;
        }

        // Set prices
        const salesPriceTextarea = row.querySelector('.item-sls-price');
        if (salesPriceTextarea && detail.salesPrice) {
            salesPriceTextarea.value = detail.salesPrice;
        }

        const priceTextarea = row.querySelector('.item-price');
        if (priceTextarea && detail.price) {
            priceTextarea.value = detail.price;
        }

        // Set discount
        const discountInput = row.querySelector('input[class*="discount"]');
        if (discountInput && detail.discount) {
            discountInput.value = detail.discount;
        }

        // Set tax code
        const taxCodeInput = row.querySelector('input[class*="tax"]');
        if (taxCodeInput && detail.taxCode) {
            taxCodeInput.value = detail.taxCode;
        }

        // Set line total
        const lineTotalTextarea = row.querySelector('.item-line-total');
        if (lineTotalTextarea && detail.lineTotal) {
            lineTotalTextarea.value = detail.lineTotal;
        }

        // Recalculate line total
        calculateLineTotal(row);

    } catch (error) {
        console.error('Error populating row:', error);
    }
}

// Initialize page elements
function initializePage() {
    // Only set defaults if not in edit mode
    if (!isEditMode) {
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

    // Update page title and button text based on mode
    if (isEditMode) {
        document.title = 'Edit AR Invoice';
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = 'Edit AR Invoice';
        }
        // Update button text to indicate edit mode
        const submitButtonText = document.getElementById('submitButtonText');
        if (submitButtonText) {
            submitButtonText.textContent = 'Update';
        }
    } else {
        document.title = 'Add AR Invoice';
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = 'Add AR Invoice';
        }
        // Update button text
        const submitButtonText = document.getElementById('submitButtonText');
        if (submitButtonText) {
            submitButtonText.textContent = 'Submit';
        }
    }
}

// Load customers from API
async function loadCustomers() {
    try {
        if (isDevelopmentMode) {
            // Use dummy data for development
            customers = [
                { cardCode: 'C001', cardName: 'PT Sample Customer 1' },
                { cardCode: 'C002', cardName: 'PT Sample Customer 2' },
                { cardCode: 'C003', cardName: 'PT Sample Customer 3' }
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
                { itemCode: 'ITEM001', itemName: 'Sample Item 1', unitMsr: 'PCS', price: 100000 },
                { itemCode: 'ITEM002', itemName: 'Sample Item 2', unitMsr: 'PCS', price: 150000 },
                { itemCode: 'ITEM003', itemName: 'Sample Item 3', unitMsr: 'PCS', price: 200000 }
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

    // Auto-fill sales price if available
    const salesPriceInput = row.querySelector('.item-sls-price');
    if (item.price) {
        salesPriceInput.value = item.price;
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
        <td class="p-2 border no-column">
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
        <td class="p-2 border sales-employee-column">
            <textarea class="w-full item-sales-employee bg-white resize-none overflow-auto overflow-x-auto whitespace-nowrap" maxlength="100" style="height: 40px; vertical-align: top;" autocomplete="off"></textarea>
        </td>
        <td class="p-2 border h-12 quantity-column">
            <textarea class="quantity-input item-sls-qty bg-white overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: center;" autocomplete="off" oninput="validateQuantity(this)"></textarea>
        </td>
        <td class="p-2 border h-12 quantity-column">
            <textarea class="quantity-input item-quantity bg-white overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: center;" autocomplete="off" oninput="validateQuantity(this)"></textarea>
        </td>
        <td class="p-2 border uom-column" style="display: none;">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" maxlength="10" autocomplete="off" disabled />
        </td>
        <td class="p-2 border h-12 price-column">
            <textarea class="price-input item-sls-price bg-white overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" autocomplete="off" oninput="validatePrice(this)"></textarea>
        </td>
        <td class="p-2 border h-12 price-column">
            <textarea class="price-input item-price bg-white overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" autocomplete="off" oninput="validatePrice(this)"></textarea>
        </td>
        <td class="p-2 border discount-column">
            <input type="text" class="w-full p-2 border rounded" maxlength="8" autocomplete="off" />
        </td>
        <td class="p-2 border tax-code-column">
            <input type="text" class="w-full p-2 border rounded" maxlength="8" autocomplete="off" />
        </td>
        <td class="p-2 border h-12 line-total-column">
            <textarea class="line-total-input item-line-total bg-white overflow-x-auto whitespace-nowrap" maxlength="15" style="resize: none; height: 40px; text-align: right;" autocomplete="off" disabled></textarea>
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

    // Show confirmation that all fields are optional
    const result = await Swal.fire({
        icon: 'info',
        title: 'Submit Document',
        text: 'All fields are optional. You can submit the document with empty fields.',
        showCancelButton: true,
        confirmButtonText: 'Continue',
        cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
        return;
    }

    const formData = collectFormData(isSubmit);

    try {
        let url, method;

        if (isEditMode && invoiceId) {
            // Update existing invoice
            url = `${API_BASE_URL}/ar-invoices/${invoiceId}`;
            method = 'PUT';
        } else {
            // Create new invoice
            url = `${API_BASE_URL}/ar-invoices`;
            method = 'POST';
        }

        console.log('Submitting data to:', url);
        console.log('Request data:', JSON.stringify(formData, null, 2));

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('API Response:', result);

            if (result.status && result.code === 200) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: isEditMode
                        ? (isSubmit ? 'Document updated and submitted successfully!' : 'Document updated successfully!')
                        : (isSubmit ? 'Document created and submitted successfully!' : 'Document saved successfully!'),
                    footer: `Staging ID: ${result.data?.stagingID || 'N/A'}, DocNum: ${result.data?.docNum || 'N/A'}`
                }).then(() => {
                    goToMenuARInv();
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Warning',
                    text: result.message || 'Document processed but with warnings'
                });
            }
        } else {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                console.log('Could not parse error response as JSON');
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
        }
    } catch (error) {
        console.error('Error submitting document:', error);
        Swal.fire({
            icon: 'error',
            title: 'Network Error',
            text: `An error occurred while ${isEditMode ? 'updating' : 'submitting'} the document. Please check your connection and try again.`
        });
    }
}

// Validate form - All fields are now optional
function validateForm() {
    // All fields are optional, so validation always passes
    // Previously required fields: CardCode, CardName, DocCur, and at least one item
    // Now all fields can be empty and document can still be submitted
    return true;
}

// Collect form data
function collectFormData(isSubmit) {
    // Get current date for document date
    const currentDate = new Date().toISOString();

    // Collect header data with default values for empty fields
    // All fields are now optional with appropriate default values
    const header = {
        docType: "s", // Sales document type
        docDate: currentDate,
        docDueDate: currentDate,
        cardCode: document.getElementById('CardCode').value || "",
        cardName: document.getElementById('CardName').value || "",
        address: "", // Will be populated from customer data if available
        numAtCard: document.getElementById('NumAtCard').value || "",
        comments: document.getElementById('comments').value || "",
        u_BSI_Expressiv_PreparedByNIK: "", // Will be populated from user data
        u_BSI_Expressiv_PreparedByName: document.getElementById('preparedBySearch').value || "",
        docCur: document.getElementById('DocCur').value || "IDR", // Default to IDR
        docRate: 1, // Default exchange rate
        vatSum: parseFloat(document.getElementById('VatSum').value) || 0,
        vatSumFC: parseFloat(document.getElementById('VatSum').value) || 0,
        wtSum: 0, // Withholding tax sum
        wtSumFC: 0, // Withholding tax sum in foreign currency
        docTotal: parseFloat(document.getElementById('DocTotal').value) || 0,
        docTotalFC: parseFloat(document.getElementById('DocTotal').value) || 0,
        trnspCode: parseInt(document.getElementById('TrnspCode').value) || 1,
        u_BSI_ShippingType: document.getElementById('U_BSI_ShippingType').value || "",
        groupNum: parseInt(document.getElementById('GroupNum').value) || 1,
        u_BSI_PaymentGroup: document.getElementById('U_BSI_PaymentGroup').value || "",
        u_bsi_invnum: document.getElementById('DocNum').value || "",
        u_bsi_udf1: document.getElementById('U_BSI_UDF1').value || "",
        u_bsi_udf2: document.getElementById('U_BSI_UDF2').value || "",
        trackNo: "", // Tracking number
        u_BSI_Expressiv_IsTransfered: document.getElementById('U_BSI_Expressiv_IsTransfered').value || "N"
    };

    // Collect invoice details
    const arInvoiceDetails = [];
    const rows = document.querySelectorAll('#tableBody tr');

    rows.forEach((row, index) => {
        const itemCodeElement = row.querySelector('.item-input');
        const itemNameElement = row.querySelector('.item-description');
        const freeTextElement = row.querySelector('.item-free-txt');
        const salesEmployeeElement = row.querySelector('.item-sales-employee');
        const salesQuantityElement = row.querySelector('.item-sls-qty');
        const inventoryQuantityElement = row.querySelector('.item-quantity');
        const unitMsrElement = row.querySelector('td:nth-child(7) input');
        const salesPriceElement = row.querySelector('.item-sls-price');
        const priceElement = row.querySelector('.item-price');
        const discountElement = row.querySelector('td:nth-child(10) input');
        const taxCodeElement = row.querySelector('td:nth-child(11) input');
        const lineTotalElement = row.querySelector('.item-line-total');

        const itemCode = itemCodeElement ? itemCodeElement.value : "";
        const itemName = itemNameElement ? itemNameElement.value : "";
        const freeText = freeTextElement ? freeTextElement.value : "";
        const salesEmployee = salesEmployeeElement ? salesEmployeeElement.value : "";
        const salesQuantity = salesQuantityElement ? parseFloat(salesQuantityElement.value) || 0 : 0;
        const inventoryQuantity = inventoryQuantityElement ? parseFloat(inventoryQuantityElement.value) || 0 : 0;
        const unitMsr = unitMsrElement ? unitMsrElement.value || 'PCS' : 'PCS';
        const salesPrice = salesPriceElement ? parseFloat(salesPriceElement.value) || 0 : 0;
        const price = priceElement ? parseFloat(priceElement.value) || 0 : 0;
        const discount = discountElement ? discountElement.value || "" : "";
        const taxCode = taxCodeElement ? taxCodeElement.value || "" : "";
        const lineTotal = lineTotalElement ? parseFloat(lineTotalElement.value) || 0 : 0;

        // Include all rows, even if they have empty values
        // Previously only included rows with itemCode, inventoryQuantity, and price
        // Now includes all rows with default values for empty fields
        arInvoiceDetails.push({
            lineNum: index,
            itemCode: itemCode || "",
            itemName: itemName || "",
            freeText: freeText || "",
            salesEmployee: salesEmployee || "",
            salesQuantity: salesQuantity || 0,
            inventoryQuantity: inventoryQuantity || 0,
            unitMsr: unitMsr || "PCS",
            salesPrice: salesPrice || 0,
            price: price || 0,
            discount: discount || "",
            taxCode: taxCode || "",
            lineTotal: lineTotal || 0
        });
    });

    // Collect approval data with default values for empty fields
    const arInvoiceApprovalSummary = {
        approvalStatus: isSubmit ? "Submitted" : "Draft",
        preparedBy: document.getElementById('preparedBySearch').value || "",
        checkedBy: document.getElementById('checkedBySearch').value || "",
        acknowledgedBy: document.getElementById('acknowledgeBySearch').value || "",
        approvedBy: document.getElementById('approvedBySearch').value || "",
        receivedBy: document.getElementById('receivedBySearch').value || "",
        preparedDate: isSubmit ? currentDate : null,
        checkedDate: null,
        acknowledgedDate: null,
        approvedDate: null,
        receivedDate: null,
        rejectedDate: null,
        rejectionRemarks: "",
        revisionNumber: 0,
        revisionDate: null,
        revisionRemarks: ""
    };

    return {
        ...header,
        arInvoiceDetails: arInvoiceDetails,
        arInvoiceApprovalSummary: arInvoiceApprovalSummary
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