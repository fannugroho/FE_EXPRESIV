// Global variable for file uploads
let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep

// Global variables
let rowCounter = 1;
let outgoingPaymentData = null;
// Using BASE_URL from auth.js instead of hardcoded apiBaseUrl

// Helper function to get logged-in user ID
function getUserId() {
    try {
        const user = getCurrentUser();
        return user ? user.userId : null;
    } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
}

// Helper function to format number as currency with Indonesian format (thousand separator: '.', decimal separator: ',')
function formatCurrencyIDR(number) {
    // Handle empty or invalid input
    if (number === null || number === undefined || number === '') {
        return '';
    }
    
    // Parse the number, ensuring we can handle very large values
    let num;
    try {
        // Handle string inputs that might be very large
        if (typeof number === 'string') {
            // Remove all non-numeric characters except decimal point and comma
            const cleanedStr = number.replace(/[^\d,-]/g, '').replace(',', '.');
            num = parseFloat(cleanedStr);
        } else {
            num = parseFloat(number);
        }
        
        // If parsing failed, return empty string
        if (isNaN(num)) {
            return '';
        }
    } catch (e) {
        console.error('Error parsing number:', e);
        return '';
    }
    
    // Format with Indonesian format (thousand separator: '.', decimal separator: ',')
    try {
        // Convert to string with fixed decimal places
        let parts = num.toFixed(2).split('.');
        let integerPart = parts[0];
        let decimalPart = parts.length > 1 ? parts[1] : '00';
        
        // Add thousand separators (dot) to integer part
        let formattedInteger = '';
        for (let i = 0; i < integerPart.length; i++) {
            if (i > 0 && (integerPart.length - i) % 3 === 0) {
                formattedInteger += '.'; // Use dot as thousand separator for Indonesian format
            }
            formattedInteger += integerPart.charAt(i);
        }
        
        // Return with comma as decimal separator
        return formattedInteger + ',' + decimalPart;
    } catch (e) {
        console.error('Error formatting number:', e);
        return number.toString();
    }
}

// Helper function to parse Indonesian formatted currency back to number
function parseCurrencyIDR(formattedValue) {
    if (!formattedValue) return 0;
    
    try {
        // Handle Indonesian format (thousand separator: '.', decimal separator: ',')
        // Replace dots (thousand separators) with nothing, and comma (decimal separator) with dot
        const numericValue = formattedValue.toString()
            .replace(/\./g, '') // Remove thousand separators (dots)
            .replace(',', '.'); // Replace decimal separator (comma) with dot
        
        return parseFloat(numericValue) || 0;
    } catch (e) {
        console.error('Error parsing currency:', e);
        return 0;
    }
}

// Function to initialize the VPM2 table
function initializeVPM2Table() {
    // Clear existing rows except the first one
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    // Add initial empty row
    addVPM2Row();
    
    // Setup event listeners for the total amount calculation
    document.addEventListener('input', function(e) {
        if (e.target.id.startsWith('sumApplied_') || e.target.id.startsWith('wTaxSum_')) {
            const rowId = e.target.id.split('_')[1];
            calculateBalanceDue(rowId);
            updateTotalAmountDue();
        }
    });
}

// Function to add a new row to VPM2 table
function addVPM2Row() {
    const tableBody = document.getElementById('tableBody');
    const rowId = Date.now(); // Unique ID for the row
    
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-row-id', rowId);
    
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" id="docNum_${rowId}" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="text" id="objType_${rowId}" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="date" id="date_${rowId}" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="date" id="dueDate_${rowId}" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="number" id="overPayDays_${rowId}" class="w-full" readonly />
        </td>
            <td class="p-2 border">
            <input type="text" id="sumApplied_${rowId}" class="w-full currency-input-idr" oninput="formatCurrencyInputIDR(this)" />
        </td>
        <td class="p-2 border">
            <input type="text" id="wTaxSum_${rowId}" class="w-full currency-input-idr" oninput="formatCurrencyInputIDR(this)" />
        </td>
        <td class="p-2 border">
            <input type="text" id="openSum_${rowId}" class="w-full currency-input-idr" readonly />
        </td>
        <td class="p-2 border">
            <input type="number" id="trsfrdAmnt_${rowId}" class="w-full" step="0.01" min="0" max="100" />
        </td>
        <td class="p-2 border">
            <input type="text" id="cardName_${rowId}" class="w-full" />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteVPM2Row(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
        </td>
        `;
        
        tableBody.appendChild(newRow);
        
    // Setup date change event for calculating overdue days
    const dueDateInput = document.getElementById(`dueDate_${rowId}`);
    if (dueDateInput) {
        dueDateInput.addEventListener('change', function() {
            calculateOverdueDays(rowId);
        });
    }
    
    // Initialize the current date for date fields
    const today = new Date().toISOString().split('T')[0];
    document.getElementById(`date_${rowId}`).value = today;
}

// Function to format currency input with Indonesian format
function formatCurrencyInputIDR(input) {
    // Store the cursor position
    const cursorPos = input.selectionStart;
    const originalLength = input.value.length;
    
    // Get value and remove all non-digits and non-decimal separators
    let value = input.value.replace(/[^\d,]/g, '');
    
    // Ensure only one decimal separator
    let parts = value.split(',');
    if (parts.length > 1) {
        value = parts[0] + ',' + parts.slice(1).join('');
    }
    
    // Parse value to number for calculation
    const numValue = parseCurrencyIDR(value);
    
    // Format with Indonesian format
    const formattedValue = formatCurrencyIDR(numValue);
    
    // Update input value
    input.value = formattedValue;
    
    // Calculate row totals
    if (input.id.startsWith('sumApplied_') || input.id.startsWith('wTaxSum_')) {
        const rowId = input.id.split('_')[1];
        calculateBalanceDue(rowId);
        updateTotalAmountDue();
    }
    
    // Adjust cursor position
    const newLength = input.value.length;
    const newCursorPos = cursorPos + (newLength - originalLength);
    input.setSelectionRange(Math.max(0, newCursorPos), Math.max(0, newCursorPos));
}

// Function to calculate overdue days
function calculateOverdueDays(rowId) {
    const dueDateInput = document.getElementById(`dueDate_${rowId}`);
    const overPayDaysInput = document.getElementById(`overPayDays_${rowId}`);
    
    if (dueDateInput && dueDateInput.value && overPayDaysInput) {
        const dueDate = new Date(dueDateInput.value);
        const today = new Date();
        
        // Set time to midnight for accurate day calculation
        dueDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        // Calculate difference in days
        const diffTime = today - dueDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Only show positive overdue days
        overPayDaysInput.value = diffDays > 0 ? diffDays : 0;
    }
}

// Function to calculate balance due (Total - WTax)
function calculateBalanceDue(rowId) {
    const sumAppliedInput = document.getElementById(`sumApplied_${rowId}`);
    const wTaxSumInput = document.getElementById(`wTaxSum_${rowId}`);
    const openSumInput = document.getElementById(`openSum_${rowId}`);
    
    if (sumAppliedInput && wTaxSumInput && openSumInput) {
        // Parse the currency values
        const sumAppliedValue = parseCurrencyIDR(sumAppliedInput.value) || 0;
        const wTaxSumValue = parseCurrencyIDR(wTaxSumInput.value) || 0;
        
        // Calculate balance due
        const balanceDue = sumAppliedValue - wTaxSumValue;
        
        // Format and set the balance due value
        openSumInput.value = formatCurrencyIDR(balanceDue);
        
        // Update all totals
        updateTotalAmountDue();
    }
}

// Function to update the total amount due
function updateTotalAmountDue() {
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.getElementsByTagName('tr');
    let totalAmount = 0;
    
    // Sum up all open sum values
    for (let i = 0; i < rows.length; i++) {
        const rowId = rows[i].getAttribute('data-row-id');
        if (rowId) {
            const openSumInput = document.getElementById(`openSum_${rowId}`);
            if (openSumInput) {
                totalAmount += parseCurrencyIDR(openSumInput.value);
            }
        }
    }
    
    // Update the total amount due field
    const totalAmountDueInput = document.getElementById('openTotal');
    if (totalAmountDueInput) {
        totalAmountDueInput.value = formatCurrencyIDR(totalAmount);
    }
    
    // Also update the additional fields
    updateAdditionalTotals();
}

// Function to update the additional total fields (WTax Amount, Total Amount Due FC/LC, Open Balance)
function updateAdditionalTotals() {
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.getElementsByTagName('tr');
    
    // Initialize totals
    let wTaxTotal = 0;
    let wTaxSumFrgn = 0;
    let wTaxSum = 0;
    
    // Sum up all values from the table
    for (let i = 0; i < rows.length; i++) {
        const rowId = rows[i].getAttribute('data-row-id');
        if (rowId) {
            // Get WTax Amount
            const wTaxSumInput = document.getElementById(`wTaxSum_${rowId}`);
            if (wTaxSumInput) {
                wTaxTotal += parseCurrencyIDR(wTaxSumInput.value);
            }
            
            // Get Total Amount for FC and LC
            // For demonstration, we'll use the same value for both FC and LC
            // In a real application, you would have separate conversion logic
            const sumAppliedInput = document.getElementById(`sumApplied_${rowId}`);
            if (sumAppliedInput) {
                const sumApplied = parseCurrencyIDR(sumAppliedInput.value);
                wTaxSumFrgn += sumApplied; // Foreign Currency (FC)
                wTaxSum += sumApplied;     // Local Currency (LC)
            }
        }
    }
    
    // Update the WTax Amount total
    const wTaxTotalInput = document.getElementById('wTaxTotal');
    if (wTaxTotalInput) {
        wTaxTotalInput.value = formatCurrencyIDR(wTaxTotal);
    }
    
    // Update Total Amount Due (FC)
    const wTaxSumFrgnInput = document.getElementById('WTaxSumFrgn');
    if (wTaxSumFrgnInput) {
        wTaxSumFrgnInput.value = formatCurrencyIDR(wTaxSumFrgn);
    }
    
    // Update Total Amount Due (LC)
    const wTaxSumInput = document.getElementById('WTaxSum');
    if (wTaxSumInput) {
        wTaxSumInput.value = formatCurrencyIDR(wTaxSum);
    }
}

// Function to populate the VPM2 table with data from API
function populateVPM2Table(data) {
    // Clear existing rows
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    if (data && data.length > 0) {
        // Add rows for each data item
        data.forEach(item => {
            const rowId = Date.now() + Math.floor(Math.random() * 1000); // Unique ID
            
            const newRow = document.createElement('tr');
            newRow.setAttribute('data-row-id', rowId);
            
            // Format dates for display
            const date = item.docDate ? new Date(item.docDate).toISOString().split('T')[0] : '';
            const dueDate = item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '';
        
            newRow.innerHTML = `
                <td class="p-2 border">
                    <input type="text" id="docNum_${rowId}" class="w-full" value="${item.docNum || ''}" />
                </td>
                <td class="p-2 border">
                    <input type="text" id="objType_${rowId}" class="w-full" value="${item.objType || ''}" />
                </td>
                <td class="p-2 border">
                    <input type="date" id="date_${rowId}" class="w-full" value="${date}" />
                </td>
                <td class="p-2 border">
                    <input type="date" id="dueDate_${rowId}" class="w-full" value="${dueDate}" />
                </td>
                <td class="p-2 border">
                    <input type="number" id="overPayDays_${rowId}" class="w-full" readonly value="${item.overPayDays || 0}" />
                </td>
                <td class="p-2 border">
                    <input type="text" id="sumApplied_${rowId}" class="w-full currency-input-idr" value="${formatCurrencyIDR(item.sumApplied || 0)}" oninput="formatCurrencyInputIDR(this)" />
                </td>
                <td class="p-2 border">
                    <input type="text" id="wTaxSum_${rowId}" class="w-full currency-input-idr" value="${formatCurrencyIDR(item.wTaxSum || 0)}" oninput="formatCurrencyInputIDR(this)" />
                </td>
                <td class="p-2 border">
                    <input type="text" id="openSum_${rowId}" class="w-full currency-input-idr" readonly value="${formatCurrencyIDR(item.openSum || 0)}" />
                </td>
                <td class="p-2 border">
                    <input type="number" id="trsfrdAmnt_${rowId}" class="w-full" step="0.01" min="0" max="100" value="${item.trsfrdAmnt || 0}" />
                </td>
                <td class="p-2 border">
                    <input type="text" id="cardName_${rowId}" class="w-full" value="${item.cardName || ''}" />
                </td>
            `;
            
            tableBody.appendChild(newRow);
            
            // Setup event listeners
            const dueDateInput = document.getElementById(`dueDate_${rowId}`);
            if (dueDateInput) {
                dueDateInput.addEventListener('change', function() {
                    calculateOverdueDays(rowId);
                });
                
                // Calculate overdue days initially
                calculateOverdueDays(rowId);
            }
        });
    } else {
        // Add an empty row if no data
        addVPM2Row();
    }
    
    // Update total amount
    updateTotalAmountDue();
}

// Function to collect data from VPM2 table for saving
function collectVPM2Data() {
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.getElementsByTagName('tr');
    const data = [];
    
    for (let i = 0; i < rows.length; i++) {
        const rowId = rows[i].getAttribute('data-row-id');
        if (rowId) {
            const rowData = {
                docNum: document.getElementById(`docNum_${rowId}`).value,
                objType: document.getElementById(`objType_${rowId}`).value,
                docDate: document.getElementById(`date_${rowId}`).value,
                dueDate: document.getElementById(`dueDate_${rowId}`).value,
                overPayDays: parseInt(document.getElementById(`overPayDays_${rowId}`).value || '0'),
                sumApplied: parseCurrencyIDR(document.getElementById(`sumApplied_${rowId}`).value),
                wTaxSum: parseCurrencyIDR(document.getElementById(`wTaxSum_${rowId}`).value),
                openSum: parseCurrencyIDR(document.getElementById(`openSum_${rowId}`).value),
                trsfrdAmnt: parseFloat(document.getElementById(`trsfrdAmnt_${rowId}`).value || '0'),
                cardName: document.getElementById(`cardName_${rowId}`).value
            };
            data.push(rowData);
        }
    }
    
    return data;
}

// Add document ready event listener
document.addEventListener('DOMContentLoaded', function() {
    // Initialize VPM2 table
    initializeVPM2Table();
    
    // Override the addRow function to use our VPM2 row function
    window.addRow = addVPM2Row;
    
    // Modify the existing formatCurrency function in the HTML to use Indonesian format
    window.formatCurrency = function(input, decimalSeparator) {
        // Get input value and remove all non-digits and non-decimal separator
        let value = input.value.replace(/[^\d,]/g, '');
        
        // Ensure only one decimal separator
        let parts = value.split(',');
        if (parts.length > 1) {
            value = parts[0] + ',' + parts.slice(1).join('');
        }
        
        // Parse value to number for calculation
        const numValue = parseCurrencyIDR(value);
        
        // Format with Indonesian format
        const formattedValue = formatCurrencyIDR(numValue);
        
        // Update input value
        input.value = formattedValue;
        
        // Calculate row totals if needed
        if (input.closest('tr')) {
            calculateBalanceDue(input.closest('tr').getAttribute('data-row-id'));
            updateTotalAmountDue();
        }
    };
});