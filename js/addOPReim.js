// detailOPAcct.js - Indonesian Rupiah formatting for G/L Account table

// Global variable for file uploads
let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep

// Global variables
let rowCounter = 1;
let outgoingPaymentData = null;
let apiBaseUrl = baseUrlDevAmiru || 'https://api-dev.expressiv.id'; // Use baseUrlDevAmiru if defined

// Function to initialize the page
async function initializePage() {
    try {
        // Check if we're editing an existing document or creating a new one from reimbursement
        const urlParams = new URLSearchParams(window.location.search);
        const opId = urlParams.get('op-id');
        const reimbursementId = urlParams.get('reimbursement-id');
        
        // Set reimbursement ID in CounterRef field if available
        if (reimbursementId) {
            const counterRefField = document.getElementById('CounterRef');
            if (counterRefField) {
                counterRefField.value = reimbursementId;
            }
        }
        
        if (opId) {
            // Load existing outgoing payment
            loadOutgoingPaymentDetails(opId);
        } else if (reimbursementId) {
            // Load reimbursement data from URL parameter
            loadReimbursementDataFromUrl(reimbursementId);
        } else {
            // Check if we're creating from reimbursement data (fallback to localStorage)
            loadReimbursementData();
        }
        
        // Initialize user dropdowns first
        await initializeUserDropdowns();
        
        // Initialize input validations
        initializeInputValidations();
        
        // Load document data if editing existing document
        loadDocumentData();
        
        // Ensure approval field values are properly set after everything is loaded
        setTimeout(async () => {
            await ensureApprovalFieldValues();
            // Update totals after all data is loaded
            updateTotalAmountDue();
        }, 1000); // Give time for all data to load
    } catch (error) {
        console.error('Error in initializePage:', error);
    }
}

// Call initialization when the page loads
window.onload = async function() {
    await initializePage();
    
    // Ensure there's at least one valid row with default data
    setTimeout(() => {
        const tableBody = document.getElementById('tableBody');
        if (tableBody && tableBody.rows.length === 1) {
            // If there's only one row and it's empty, add some default data
            const firstRow = tableBody.rows[0];
            const acctCodeInput = firstRow.querySelector('input[id="AcctCode"]');
            const docTotalInput = firstRow.querySelector('input[id="DocTotal"]');
            
            if (acctCodeInput && docTotalInput && 
                (!acctCodeInput.value.trim() || !docTotalInput.value.trim())) {
                // Add default values to prevent validation error
                acctCodeInput.value = '1000'; // Default account code
                docTotalInput.value = '0'; // Default amount
                console.log('Added default values to first row to prevent validation error');
            }
        }
        
        // Update totals after page initialization
        updateTotalAmountDue();
    }, 100);
};

// Helper function to get logged-in user ID
function getUserId() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.id : null;
}

// Function to load data from reimbursement document (fallback method using localStorage)
async function loadReimbursementData() {
    // Check if we have reimbursement data in localStorage
    const reimbursementDataStr = localStorage.getItem('selectedReimbursementData');
    if (!reimbursementDataStr) {
        console.log('No reimbursement data found in localStorage');
        return;
    }

    try {
        // Parse the reimbursement data
        const reimbursementData = JSON.parse(reimbursementDataStr);
        console.log('Loaded reimbursement data from localStorage:', reimbursementData);

        // Validate that reimbursementData is not null or undefined
        if (!reimbursementData) {
            console.error('Reimbursement data is null or undefined');
            return;
        }

        // Get the reimbursement ID from the data
        const reimbursementId = reimbursementData.id;
        if (!reimbursementId) {
            console.error('Reimbursement ID not found in data');
            return;
        }

        // Use the same logic as loadReimbursementDataFromUrl
        await loadReimbursementDataFromUrl(reimbursementId);
        
    } catch (error) {
        console.error('Error loading reimbursement data from localStorage:', error);
        
        // Show error message
        Swal.fire({
            title: 'Error',
            text: `Failed to load reimbursement data: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to load reimbursement data from URL parameter
async function loadReimbursementDataFromUrl(reimbursementId) {
    if (!reimbursementId) {
        console.error('Reimbursement ID not found in URL');
        return;
    }

    // Show loading indicator
    Swal.fire({
        title: 'Loading...',
        text: 'Loading reimbursement data, please wait...',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // Fetch detailed data from API
        const response = await fetch(`https://expressiv.idsdev.site/api/reimbursements/${reimbursementId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'text/plain'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch reimbursement data: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.status || !result.data) {
            throw new Error('Invalid response from API');
        }

        const detailedData = result.data;
        console.log('Detailed reimbursement data:', detailedData);
        console.log('Approval data from API:', {
            preparedBy: detailedData.preparedBy,
            preparedByName: detailedData.preparedByName,
            checkedBy: detailedData.checkedBy,
            checkedByName: detailedData.checkedByName,
            acknowledgedBy: detailedData.acknowledgedBy,
            acknowledgedByName: detailedData.acknowledgedByName,
            approvedBy: detailedData.approvedBy,
            approvedByName: detailedData.approvedByName,
            receivedBy: detailedData.receivedBy,
            receivedByName: detailedData.receivedByName
        });

        // Check if formatNumberToCurrencyString function is available
        if (typeof window.formatNumberToCurrencyString !== 'function') {
            console.warn('formatNumberToCurrencyString function not available, using fallback');
        }

        // Populate form fields with detailed reimbursement data
        document.getElementById('CounterRef').value = detailedData.voucherNo || reimbursementId || '';
        document.getElementById('RequesterName').value = detailedData.requesterName || '';
        document.getElementById('CardName').value = detailedData.payToName || '';
        document.getElementById('Address').value = ''; // Address not available in new API
        
        // Format dates properly
        if (detailedData.submissionDate) {
            const docDate = new Date(detailedData.submissionDate);
            document.getElementById('DocDate').value = docDate.toISOString().split('T')[0];
        }
        
        // Due date might not be available in the new API
        const today = new Date();
        document.getElementById('DocDueDate').value = today.toISOString().split('T')[0];
        document.getElementById('TaxDate').value = today.toISOString().split('T')[0];
        document.getElementById('TrsfrDate').value = today.toISOString().split('T')[0];
        
        // Set other fields
        document.getElementById('DocNum').value = ''; // Will be generated by the system
        document.getElementById('Comments').value = detailedData.remarks || '';
        document.getElementById('JrnlMemo').value = detailedData.typeOfTransaction || '';
        document.getElementById('TypeOfTransaction').value = detailedData.typeOfTransaction || '';
        document.getElementById('TrsfrAcct').value = ''; // Transfer account not available in new API
        
        // Set transfer sum with proper validation
        if (detailedData.totalAmount !== null && detailedData.totalAmount !== undefined) {
            const formattedAmount = formatCurrencyValue(detailedData.totalAmount);
            document.getElementById('TrsfrSum').value = formattedAmount;
            
            // Also update other total fields
            const netTotalField = document.getElementById('netTotal');
            const totalTaxField = document.getElementById('totalTax');
            const totalAmountDueField = document.getElementById('totalAmountDue');
            
            if (netTotalField) netTotalField.value = formattedAmount;
            if (totalTaxField) totalTaxField.value = formattedAmount;
            if (totalAmountDueField) totalAmountDueField.value = formattedAmount;
        }
        
        // Clear existing rows except the first one
        const tableBody = document.getElementById('tableBody');
        while (tableBody.rows.length > 1) {
            tableBody.deleteRow(tableBody.rows.length - 1);
        }
        
        // Populate rows with reimbursement details
        console.log('Reimbursement details found:', detailedData.reimbursementDetails);
        if (detailedData.reimbursementDetails && Array.isArray(detailedData.reimbursementDetails) && detailedData.reimbursementDetails.length > 0) {
            // Remove the first row if it exists
            if (tableBody.rows.length > 0) {
                tableBody.deleteRow(0);
            }
            
            // Add rows for each detail item
            detailedData.reimbursementDetails.forEach((detail, index) => {
                console.log(`Processing detail ${index}:`, detail);
                // Validate detail object
                if (detail && typeof detail === 'object') {
                    const lineData = {
                        acctCode: detail.glAccount || '',
                        acctName: detail.accountName || '',
                        descrip: detail.description || '',
                        ocrCode3: '', // Division not available in new API
                        sumApplied: detail.amount || 0
                    };
                    console.log(`Line data for row ${index}:`, lineData);
                    addRowWithData(lineData);
                }
            });
            
            // Update totals after populating all rows
            setTimeout(() => {
                updateTotalAmountDue();
            }, 100);
        }
        
        // Display attachments if available
        if (detailedData.reimbursementAttachments && Array.isArray(detailedData.reimbursementAttachments)) {
            console.log('Displaying attachments:', detailedData.reimbursementAttachments);
            displayExistingAttachments(detailedData.reimbursementAttachments);
            
            // Store attachments for later use
            existingAttachments = [...detailedData.reimbursementAttachments];
            attachmentsToKeep = [...detailedData.reimbursementAttachments.map(a => a.id)];
        }
        
        // Set approval information if available
        const setUserField = (fieldId, userId, userName) => {
            const hiddenSelect = document.getElementById(fieldId);
            const searchInput = document.getElementById(`${fieldId}Search`);
            
            console.log(`Setting user field ${fieldId}:`, { userId, userName });
            
            if (hiddenSelect && searchInput) {
                hiddenSelect.value = userId || '';
                searchInput.value = userName || '';
                console.log(`Set ${fieldId} - hiddenSelect.value:`, hiddenSelect.value, 'searchInput.value:', searchInput.value);
            } else {
                console.warn(`Could not find elements for ${fieldId}`);
                // Fallback: try to set the value directly even if dropdowns aren't initialized
                if (hiddenSelect) {
                    hiddenSelect.value = userId || '';
                    console.log(`Fallback: Set ${fieldId} hiddenSelect.value:`, hiddenSelect.value);
                }
                if (searchInput) {
                    searchInput.value = userName || '';
                    console.log(`Fallback: Set ${fieldId} searchInput.value:`, searchInput.value);
                }
            }
        };

        // Get current user ID for fallback
        const currentUserId = getUserId();
        console.log('Current user ID for fallback:', currentUserId);

        // Set prepared by - always set to current user if not available from API
        const preparedBy = detailedData.preparedBy || currentUserId;
        const preparedByName = detailedData.preparedByName || '';
        setUserField('Approval.PreparedById', preparedBy, preparedByName);
        
        // Set checked by
        if (detailedData.checkedBy) {
            setUserField('Approval.CheckedById', detailedData.checkedBy, detailedData.checkedByName);
        }
        
        // Set acknowledged by
        if (detailedData.acknowledgedBy) {
            setUserField('Approval.AcknowledgedById', detailedData.acknowledgedBy, detailedData.acknowledgedByName);
        }
        
        // Set approved by
        if (detailedData.approvedBy) {
            setUserField('Approval.ApprovedById', detailedData.approvedBy, detailedData.approvedByName);
        }
        
        // Set received by
        if (detailedData.receivedBy) {
            setUserField('Approval.ReceivedById', detailedData.receivedBy, detailedData.receivedByName);
        }
        
        // Clear localStorage to prevent duplicate data
        localStorage.removeItem('selectedReimbursementData');
        
        // Update totals after all data is loaded
        updateTotalAmountDue();
        
        // Close loading indicator
        Swal.close();
        
        // Show success message
        Swal.fire({
            title: 'Success',
            text: 'Reimbursement data loaded successfully',
            icon: 'success',
            confirmButtonText: 'OK'
        });
        
    } catch (error) {
        console.error('Error loading reimbursement data:', error);
        
        // Close loading indicator
        Swal.close();
        
        // Show error message
        Swal.fire({
            title: 'Error',
            text: `Failed to load reimbursement data: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to add a row with predefined data
function addRowWithData(lineData) {
    console.log('addRowWithData called with:', lineData);
    // Validate lineData
    if (!lineData || typeof lineData !== 'object') {
        console.error('Invalid lineData provided to addRowWithData');
        return;
    }

    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }

    const newRow = tableBody.insertRow();
    
    // Create cells with input fields
    const acctCodeCell = newRow.insertCell();
    acctCodeCell.className = 'p-2 border';
    acctCodeCell.innerHTML = `<input type="text" id="AcctCode" class="w-full" value="${lineData.acctCode || ''}" autocomplete="off" />`;
    
    const acctNameCell = newRow.insertCell();
    acctNameCell.className = 'p-2 border';
    acctNameCell.innerHTML = `<input type="text" id="AcctName" class="w-full" value="${lineData.acctName || ''}" autocomplete="off" />`;
    
    const descriptionCell = newRow.insertCell();
    descriptionCell.className = 'p-2 border';
    descriptionCell.innerHTML = `<input type="text" id="description" class="w-full" value="${lineData.descrip || ''}" maxlength="255" autocomplete="off" />`;
    
    const divisionCell = newRow.insertCell();
    divisionCell.className = 'p-2 border';
    divisionCell.innerHTML = `<input type="text" id="division" class="w-full" value="${lineData.ocrCode3 || ''}" maxlength="255" autocomplete="off" />`;
    
    const amountCell = newRow.insertCell();
    amountCell.className = 'p-2 border';
    // Ensure sumApplied is a valid number
    const sumApplied = lineData.sumApplied !== null && lineData.sumApplied !== undefined ? lineData.sumApplied : 0;
    const formattedAmount = typeof window.formatCurrencyIDR === 'function' ? 
        window.formatCurrencyIDR(sumApplied) : formatCurrencyValue(sumApplied);
    amountCell.innerHTML = `<input type="text" id="DocTotal" class="w-full currency-input-idr" value="${formattedAmount}" oninput="formatCurrencyInputIDR(this); updateTotalAmountDue();" autocomplete="off" />`;
    
    const actionCell = newRow.insertCell();
    actionCell.className = 'p-2 border text-center';
    actionCell.innerHTML = `<button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">🗑</button>`;
    
    // Setup currency formatting for the new row's amount input
    const amountInput = amountCell.querySelector('input');
    if (amountInput) {
        // Check if this is an IDR input
        if (amountInput.classList.contains('currency-input-idr')) {
            // Set default value
            if (!amountInput.value || amountInput.value === '0') {
                amountInput.value = '0.00';
            }
            
            // Add event listener for IDR formatting
            amountInput.addEventListener('input', function() {
                if (typeof window.formatCurrencyInputIDR === 'function') {
                    window.formatCurrencyInputIDR(this);
                }
            });
        } else {
            setupCurrencyInput(amountInput);
        }
    }
    
    // Update totals
    updateTotalAmountDue();
    
    console.log(`Row ${rowCounter} added successfully with data:`, lineData);
    rowCounter++;
}

// Helper function to format number as currency with support for very large numbers (trillions)
function formatCurrency(number) {
    // Handle empty or invalid input
    if (number === null || number === undefined || number === '') {
        return '';
    }
    
    // Parse the number, ensuring we can handle very large values
    let num;
    try {
        // Handle string inputs that might be very large
        if (typeof number === 'string') {
            // Remove all non-numeric characters except decimal point
            const cleanedStr = number.replace(/[^\d.-]/g, '');
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
    
    // Get the string representation to check if it has decimal places
    const numStr = num.toString();
    const hasDecimal = numStr.includes('.');
    
    try {
        // Format with Indonesian locale (thousand separator: '.', decimal separator: ',')
        if (hasDecimal) {
            // Get the number of decimal places in the original number
            const decimalPlaces = numStr.split('.')[1].length;
            return num.toLocaleString('id-ID', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
            });
        } else {
            // No decimal places in the original number
            return num.toLocaleString('id-ID', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        }
    } catch (e) {
        // Fallback for very large numbers that might cause issues with toLocaleString
        console.error('Error formatting number:', e);
        
        // Manual formatting for extremely large numbers using Indonesian format
        let strNum = num.toString();
        let sign = '';
        
        if (strNum.startsWith('-')) {
            sign = '-';
            strNum = strNum.substring(1);
        }
        
        // Split into integer and decimal parts
        const parts = strNum.split('.');
        const integerPart = parts[0];
        const decimalPart = parts.length > 1 ? ',' + parts[1] : ''; // Use comma as decimal separator
        
        // Add thousand separators (dot) to integer part
        let formattedInteger = '';
        for (let i = 0; i < integerPart.length; i++) {
            if (i > 0 && (integerPart.length - i) % 3 === 0) {
                formattedInteger += '.'; // Use dot as thousand separator
            }
            formattedInteger += integerPart.charAt(i);
        }
        
        return sign + formattedInteger + decimalPart;
    }
}

// Rename the function to avoid conflict with HTML formatCurrency
function formatCurrencyValue(number) {
    try {
        // Use the function from HTML instead of local formatCurrency
        if (typeof window.formatNumberToCurrencyString === 'function') {
            return window.formatNumberToCurrencyString(number);
        } else {
            // Use fallback function if HTML function not available
            return formatCurrencyFallback(number);
        }
    } catch (e) {
        console.error('Error in formatCurrencyValue:', e);
        // Return empty string as fallback
        return '';
    }
}

// Fallback function for currency formatting (used when HTML function is not available)
function formatCurrencyFallback(number) {
    // Handle empty or invalid input
    if (number === null || number === undefined || number === '') {
        return '';
    }
    
    // Parse the number
    let num;
    try {
        if (typeof number === 'string') {
            const cleanedStr = number.replace(/[^\d.-]/g, '');
            num = parseFloat(cleanedStr);
        } else {
            num = parseFloat(number);
        }
        
        if (isNaN(num)) {
            return '';
        }
    } catch (e) {
        console.error('Error parsing number in fallback:', e);
        return '';
    }
    
    // Simple formatting with comma as thousand separator
    try {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } catch (e) {
        // Manual formatting if toLocaleString fails
        const numStr = num.toFixed(2);
        const parts = numStr.split('.');
        const wholePart = parts[0];
        const decimalPart = parts[1] || '00';
        
        let formattedWhole = '';
        for (let i = 0; i < wholePart.length; i++) {
            if (i > 0 && (wholePart.length - i) % 3 === 0) {
                formattedWhole += ',';
            }
            formattedWhole += wholePart[i];
        }
        
        return formattedWhole + '.' + decimalPart;
    }
}

// Helper function to safely format currency (with error handling)
function safeFormatCurrency(number) {
    try {
        return formatCurrencyValue(number);
    } catch (e) {
        console.error('Error in safeFormatCurrency:', e);
        return '';
    }
}

// Helper function to parse formatted currency back to number, supporting very large values
function parseCurrency(formattedValue) {
    if (!formattedValue) return 0;
    
    try {
        // Use HTML's parseCurrencyValue function if available for consistency
        if (typeof window.parseCurrencyValue === 'function') {
            return window.parseCurrencyValue(formattedValue);
        }
        
        // Handle Indonesian format (thousand separator: '.', decimal separator: ',')
        // Replace dots (thousand separators) with nothing and commas (decimal separators) with dots
        const numericValue = formattedValue.toString()
            .replace(/\./g, '') // Remove thousand separators (dots)
            .replace(/,/g, '.'); // Replace decimal separators (commas) with dots
        
        return parseFloat(numericValue) || 0;
    } catch (e) {
        console.error('Error parsing currency:', e);
        return 0;
    }
}

// Function to initialize input field validations
function initializeInputValidations() {
    // Setup numeric input validations with currency formatting
    setupCurrencyInput('DocTotal');
    setupCurrencyInput('tdDocTotal');
    setupCurrencyInput('totalAmountDue');
    setupCurrencyInput('netTotal');
    setupCurrencyInput('totalTax');
    setupCurrencyInput('TrsfrSum');
    
    // Setup IDR currency inputs
    const idrInputs = document.querySelectorAll('.currency-input-idr');
    idrInputs.forEach(input => {
        if (!input.readOnly) {
            // Set default value if empty
            if (!input.value || input.value === '0') {
                input.value = '0.00';
            }
            
            // Add event listener for IDR formatting
            input.addEventListener('input', function() {
                if (typeof window.formatCurrencyInputIDR === 'function') {
                    window.formatCurrencyInputIDR(this);
                }
                // Update totals when IDR input changes
                updateTotalAmountDue();
            });
        }
    });
    
    // Setup text input validations (nvarchar)
    setupTextInput('description');
    setupTextInput('AcctCode');
    setupTextInput('AcctName');
    setupTextInput('division');
    
    // Add event listeners for calculating total
    document.querySelectorAll('.currency-input').forEach(input => {
        input.addEventListener('input', updateTotalAmountDue);
    });
    
    // Initialize user search dropdowns
    initializeUserDropdowns();
    
    // Ensure the first row is properly set up
    const firstRowDocTotal = document.getElementById('DocTotal');
    if (firstRowDocTotal) {
        firstRowDocTotal.addEventListener('input', updateTotalAmountDue);
    }
}

// Function to setup currency input with formatting for very large numbers
function setupCurrencyInput(input) {
    // Handle both element ID strings and direct element references
    const inputElement = typeof input === 'string' ? document.getElementById(input) : input;
    
    if (inputElement) {
        // Store the actual numeric value
        inputElement.numericValue = 0;
        
        // Convert to text input for better formatting control
        inputElement.type = 'text';
        inputElement.classList.add('currency-input');
        
        // Add input event for formatting
        inputElement.addEventListener('input', function(e) {
            // Check if this is an IDR input
            if (this.classList.contains('currency-input-idr')) {
                // Use IDR formatting if available
                if (typeof window.formatCurrencyInputIDR === 'function') {
                    window.formatCurrencyInputIDR(this);
                } else {
                    // Fallback to original formatting
                    formatCurrency(this, '.');
                }
                return;
            }
            
            // Get the cursor position before formatting
            const cursorPos = this.selectionStart;
            const originalLength = this.value.length;
            
            // Store the raw input value
            // For Indonesian format, we need to handle both dots and commas
            let rawValue = this.value;
            
            // First, remove all dots (thousand separators)
            rawValue = rawValue.replace(/\./g, '');
            
            // Then, replace commas (decimal separators) with dots for parsing
            rawValue = rawValue.replace(/,/g, '.');
            
            // Finally, remove any other non-numeric characters
            rawValue = rawValue.replace(/[^\d.-]/g, '');
            
            // Parse the numeric value, handling potentially very large numbers
            try {
                const numericValue = parseFloat(rawValue) || 0;
                this.numericValue = numericValue;
                
                // Only format if there's actual input
                if (this.value.trim() !== '') {
                    // Setup currency formatting for the input
                    const formattedValue = formatCurrencyValue(rawValue);
                    inputElement.value = formattedValue;
                    inputElement.numericValue = rawValue;
                    
                    // Add event listener for input changes
                    inputElement.addEventListener('input', function() {
                        // Parse the current value
                        const currentValue = this.value.replace(/[^\d.-]/g, '');
                        const numericValue = parseFloat(currentValue) || 0;
                        
                        // Update the numeric value
                        this.numericValue = numericValue;
                        
                        // Format the display value
                        this.value = formatCurrencyValue(this.numericValue);
                    });
                    
                    // Add event listener for focus
                    inputElement.addEventListener('focus', function() {
                        // Show raw numeric value when focused
                        this.value = this.numericValue || 0;
                    });
                    
                    // Add event listener for blur
                    inputElement.addEventListener('blur', function() {
                        // Format the value when focus is lost
                        this.value = formatCurrencyValue(this.numericValue);
                    });
                }
            } catch (e) {
                console.error('Error in currency input processing:', e);
                // If there's an error, keep the raw input
                this.value = rawValue;
            }
        });
        
        // Add focus event to select all text when focused
        inputElement.addEventListener('focus', function() {
            this.select();
        });
        
        // Add blur event to ensure proper formatting when leaving the field
        inputElement.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                try {
                    // Check if this is an IDR input
                    if (this.classList.contains('currency-input-idr')) {
                        // Use IDR formatting if available
                        if (typeof window.formatCurrencyIDR === 'function') {
                            this.value = window.formatCurrencyIDR(this.numericValue);
                        } else {
                            this.value = formatCurrencyValue(this.numericValue);
                        }
                    } else {
                        // Format the value, preserving decimal places
                        this.value = formatCurrencyValue(this.numericValue);
                    }
                } catch (e) {
                    console.error('Error formatting on blur:', e);
                }
            }
        });
    }
}

// Function to setup text input validation for nvarchar
function setupTextInput(inputId) {
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
        // Set maxlength for nvarchar fields (adjust as needed)
        inputElement.maxLength = 255;
        
        // Add input validation if needed
        inputElement.addEventListener('input', function() {
            // Implement any specific validation for text fields if needed
            // For example, prevent certain characters, etc.
        });
    }
}

// Function to add a new row to the table
function addRow() {
    // Create a new row with a unique identifier
    const tableBody = document.getElementById('tableBody');
    const newRowId = `row_${rowCounter++}`;
    
    const newRow = document.createElement('tr');
    newRow.id = newRowId;
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" id="AcctCode_${newRowId}" maxlength="255" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="text" id="AcctName_${newRowId}" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="text" id="description_${newRowId}" maxlength="255" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="text" id="division_${newRowId}" maxlength="255" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="text" id="DocTotal_${newRowId}" class="w-full currency-input-idr" value="0.00" oninput="formatCurrencyInputIDR(this); updateTotalAmountDue();" />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
    
    // Setup currency input for the new row
    setupCurrencyInput(`DocTotal_${newRowId}`);
    setupTextInput(`description_${newRowId}`);
    setupTextInput(`AcctCode_${newRowId}`);
    setupTextInput(`AcctName_${newRowId}`);
    setupTextInput(`division_${newRowId}`);
    
    // Add event listener to recalculate total
    document.getElementById(`DocTotal_${newRowId}`).addEventListener('input', updateTotalAmountDue);
}

// Function to delete a row
function deleteRow(button) {
    const row = button.closest('tr');
    if (row) {
        row.remove();
        updateTotalAmountDue();
    }
}

// Function to update the total amount due
function updateTotalAmountDue() {
    let total = 0;
    
    // Get all currency inputs from the table body (both DocTotal and dynamically created ones)
    const docTotalInputs = document.querySelectorAll('#tableBody input.currency-input-idr');
    docTotalInputs.forEach(input => {
        // Use IDR format parsing
        if (typeof window.parseCurrencyIDR === 'function') {
            total += window.parseCurrencyIDR(input.value);
        } else {
            total += parseCurrency(input.value);
        }
    });
    
    // Update the net total
    const netTotalInput = document.getElementById('netTotal');
    if (netTotalInput) {
        if (typeof window.formatCurrencyIDR === 'function') {
            netTotalInput.value = window.formatCurrencyIDR(total);
        } else {
            netTotalInput.value = formatCurrencyValue(total);
        }
        netTotalInput.numericValue = total;
    }

    // Update the total tax
    const totalTaxInput = document.getElementById('totalTax');
    if (totalTaxInput) {
        if (typeof window.formatCurrencyIDR === 'function') {
            totalTaxInput.value = window.formatCurrencyIDR(total);
        } else {
            totalTaxInput.value = formatCurrencyValue(total);
        }
        totalTaxInput.numericValue = total;
    }
    
    // Update the total amount due
    const totalAmountDueInput = document.getElementById('totalAmountDue');
    if (totalAmountDueInput) {
        if (typeof window.formatCurrencyIDR === 'function') {
            totalAmountDueInput.value = window.formatCurrencyIDR(total);
        } else {
            totalAmountDueInput.value = formatCurrencyValue(total);
        }
        totalAmountDueInput.numericValue = total;
    }
    
    // Update the total transfer (TrsfrSum)
    const trsfrSumInput = document.getElementById('TrsfrSum');
    if (trsfrSumInput) {
        if (typeof window.formatCurrencyIDR === 'function') {
            trsfrSumInput.value = window.formatCurrencyIDR(total);
        } else {
            trsfrSumInput.value = formatCurrencyValue(total);
        }
        trsfrSumInput.numericValue = total;
    }
}

// Function to confirm delete
function confirmDelete() {
    Swal.fire({
        title: 'Konfirmasi',
        text: 'Apakah Anda yakin ingin menghapus dokumen ini?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya',
        cancelButtonText: 'Batal',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            deleteDocument();
        }
    });
}

// Function to delete the document
function deleteDocument() {
    // Implementation for deleting the document
    // This would typically involve an API call
    
    Swal.fire(
        'Berhasil!',
        'Dokumen berhasil dihapus.',
        'success'
    ).then(() => {
        // Redirect back to menu
        goToMenuOP();
    });
}

// Function to update the cash document
function updateCash(isSubmit = false) {
    // Implementation for updating the document
    // This would typically involve an API call
    
    Swal.fire(
        'Berhasil!',
        isSubmit ? 'Dokumen berhasil di-submit.' : 'Dokumen berhasil diperbarui.',
        'success'
    ).then(() => {
        if (isSubmit) {
            // Redirect back to menu if submitted
            goToMenuOP();
        }
    });
}

// Function to filter business partners
window.filterBusinessPartners = function() {
    // Implementation for filtering business partners
    // This would typically involve filtering a dropdown based on input
    console.log('Filtering business partners...');
};

// Function to filter requesters
window.filterRequesters = function() {
    // Implementation for filtering requesters
    // This would typically involve filtering a dropdown based on input
    console.log('Filtering requesters...');
};

// Function to filter departments
window.filterDepartments = function() {
    // Implementation for filtering departments
    // This would typically involve filtering a dropdown based on input
    console.log('Filtering departments...');
};

// Function to filter statuses
window.filterStatuses = function() {
    // Implementation for filtering statuses
    // This would typically involve filtering a dropdown based on input
    console.log('Filtering statuses...');
};

// Function to filter transaction types
window.filterTransactionTypes = function() {
    // Implementation for filtering transaction types
    // This would typically involve filtering a dropdown based on input
    console.log('Filtering transaction types...');
};

// Global variable to store users
let users = [];

// Function to initialize user dropdowns
async function initializeUserDropdowns() {
    try {
        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            text: 'Loading user data...',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Fetch users from API
        const response = await fetch('https://expressiv.idsdev.site/api/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.status || !result.data) {
            throw new Error('Invalid response from API');
        }

        users = result.data;
        console.log('Loaded users:', users);

        // Setup user search for each approval field
        setupUserSearch('Approval.PreparedById');
        setupUserSearch('Approval.CheckedById');
        setupUserSearch('Approval.AcknowledgedById');
        setupUserSearch('Approval.ApprovedById');
        setupUserSearch('Approval.ReceivedById');
        setupUserSearch('Approval.ClosedById');

        // Update user names in approval fields if they were set before users were loaded
        updateUserNamesInApprovalFields();

        // Close loading indicator
        Swal.close();

    } catch (error) {
        console.error('Error loading users:', error);
        
        // Close loading indicator
        Swal.close();
        
        // Show error message
        Swal.fire({
            title: 'Error',
            text: `Failed to load user data: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to setup user search for a specific field
function setupUserSearch(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    const hiddenSelect = document.getElementById(fieldId);
    
    if (!searchInput || !dropdown || !hiddenSelect) {
        console.warn(`User search elements not found for field: ${fieldId}`);
        return;
    }

    // Add input event listener for search
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterUsersBySearchTerm(fieldId, searchTerm);
    });

    // Add focus event to show dropdown
    searchInput.addEventListener('focus', function() {
        if (this.value.trim() === '') {
            showAllUsers(fieldId);
        }
    });

    // Add click event to show dropdown when clicking on input
    searchInput.addEventListener('click', function() {
        if (this.value.trim() === '') {
            showAllUsers(fieldId);
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

// Function to filter users based on search term
function filterUsersBySearchTerm(fieldId, searchTerm) {
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    const hiddenSelect = document.getElementById(fieldId);
    
    if (!dropdown || !hiddenSelect) return;

    // Clear dropdown
    dropdown.innerHTML = '';

    if (!searchTerm.trim()) {
        showAllUsers(fieldId);
        return;
    }

    // Filter users
    const filteredUsers = users.filter(user => 
        typeof user.fullName === 'string' &&
        (
            user.fullName.toLowerCase().includes(searchTerm) ||
            (user.kansaiEmployeeId && typeof user.kansaiEmployeeId === 'string' && user.kansaiEmployeeId.toLowerCase().includes(searchTerm)) ||
            (user.position && typeof user.position === 'string' && user.position.toLowerCase().includes(searchTerm)) ||
            (user.department && typeof user.department === 'string' && user.department.toLowerCase().includes(searchTerm))
        )
    );

    // Display filtered users
    filteredUsers.forEach(user => {
        const item = document.createElement('div');
        item.className = 'dropdown-item p-2 hover:bg-gray-100 cursor-pointer';
        item.innerHTML = `
            <div class="font-medium">${user.fullName}</div>
        `;
        
        item.addEventListener('click', () => {
            selectUser(fieldId, user);
        });
        
        dropdown.appendChild(item);
    });

    // Show dropdown
    dropdown.classList.remove('hidden');
}

// Function to show all users
function showAllUsers(fieldId) {
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    const hiddenSelect = document.getElementById(fieldId);
    
    if (!dropdown || !hiddenSelect) return;

    // Clear dropdown
    dropdown.innerHTML = '';

    // Display all users (limit to first 20 for performance)
    users.filter(user => typeof user.fullName === 'string' && user.fullName.trim() !== '').slice(0, 20).forEach(user => {
        const item = document.createElement('div');
        item.className = 'dropdown-item p-2 hover:bg-gray-100 cursor-pointer';
        item.innerHTML = `
            <div class="font-medium">${user.fullName}</div>
        `;
        
        item.addEventListener('click', () => {
            selectUser(fieldId, user);
        });
        
        dropdown.appendChild(item);
    });

    // Show dropdown
    dropdown.classList.remove('hidden');
}

// Function to select a user
function selectUser(fieldId, user) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    const hiddenSelect = document.getElementById(fieldId);
    
    if (!searchInput || !dropdown || !hiddenSelect) return;

    // Set the search input value
    searchInput.value = user.fullName;
    
    // Set the hidden select value
    hiddenSelect.value = user.id;
    
    // Hide dropdown
    dropdown.classList.add('hidden');
}

// Function to filter users (keeping for backward compatibility)
window.filterUsers = function(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    if (searchInput) {
        const searchTerm = searchInput.value.toLowerCase();
        filterUsersBySearchTerm(fieldId, searchTerm);
    }
};

// Function to navigate back to the Outgoing Payment menu
function goToMenuOP() {
    window.location.href = '../../../pages/menuOPReim.html';
}

// Function to load outgoing payment details from API
function loadOutgoingPaymentDetails(outgoingPaymentId) {
    
    if (!outgoingPaymentId) {
        Swal.fire({
            title: 'Error',
            text: 'Outgoing Payment ID not found in URL',
            icon: 'error'
        });
        return;
    }
    
    // Show loading indicator
    Swal.fire({
        title: 'Loading...',
        text: 'Fetching outgoing payment details',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    // Fetch outgoing payment details from API
    fetch(`${apiBaseUrl}/api/outgoing-payments/${outgoingPaymentId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch outgoing payment details');
        }
        return response.json();
    })
    .then(data => {
        // Store the data in the global variable
        outgoingPaymentData = data;
        
        // Populate the form fields with the retrieved data
        populateFormFields(data);
        
        // Close the loading indicator
        Swal.close();
    })
    .catch(error => {
        console.error('Error fetching outgoing payment details:', error);
        
        Swal.fire({
            title: 'Error',
            text: 'Failed to load outgoing payment details. Please try again.',
            icon: 'error'
        });
    });
}

// Function to populate form fields with outgoing payment data
function populateFormFields(data) {
    // Populate header fields
    document.getElementById('CounterRef').value = data.counterRef || '';
    document.getElementById('RequesterName').value = data.requesterName || '';
    document.getElementById('CardName').value = data.cardName || '';
    document.getElementById('Address').value = data.address || '';
    
    // Set document dates
    if (data.docDate) {
        document.getElementById('DocDate').value = data.docDate.split('T')[0];
    } else if (data.submissionDate) {
        document.getElementById('DocDate').value = data.submissionDate.split('T')[0];
    }
    if (data.docDueDate) {
        document.getElementById('DocDueDate').value = data.docDueDate.split('T')[0];
    }
    if (data.taxDate) {
        document.getElementById('TaxDate').value = data.taxDate.split('T')[0];
    }
    
    // Set document number and memo fields
    document.getElementById('DocNum').value = data.docNum || '';
    document.getElementById('Comments').value = data.comments || '';
    document.getElementById('JrnlMemo').value = data.jrnlMemo || '';
    
    // Set currency fields
    document.getElementById('DocCurr').value = data.docCurr || 'IDR';
    document.getElementById('TypeOfTransaction').value = data.type || 'REIMBURSEMENT';
    
    // Set transfer information
    if (data.trsfrDate) {
        document.getElementById('TrsfrDate').value = data.trsfrDate.split('T')[0];
    }
    document.getElementById('TrsfrAcct').value = data.trsfrAcct || '';
    document.getElementById('TrsfrSum').value = formatCurrencyValue(data.trsfrSum) || '';
    
    // Display attachments if available
    if (data.attachments && data.attachments.length > 0) {
        displayExistingAttachments(data.attachments);
    } else if (data.reimbursementAttachments && data.reimbursementAttachments.length > 0) {
        displayExistingAttachments(data.reimbursementAttachments);
    }
    
    // Clear existing table rows except the first one
    const tableBody = document.getElementById('tableBody');
    while (tableBody.rows.length > 1) {
        tableBody.deleteRow(tableBody.rows.length - 1);
    }
    
    // Populate the first row if it exists
    if (data.lines && data.lines.length > 0) {
        const firstItem = data.lines[0];
        document.getElementById('AcctCode').value = firstItem.acctCode || '';
        document.getElementById('AcctName').value = firstItem.acctName || '';
        document.getElementById('description').value = firstItem.descrip || '';
        document.getElementById('division').value = firstItem.ocrCode3 || '';
        document.getElementById('DocTotal').value = formatCurrencyValue(firstItem.sumApplied) || '';
        
        // Add additional rows for remaining items
        for (let i = 1; i < data.lines.length; i++) {
            addRow();
            const item = data.lines[i];
            const rowId = `row_${rowCounter - 1}`; // rowCounter is incremented in addRow()
            
            document.getElementById(`AcctCode_${rowId}`).value = item.acctCode || '';
            document.getElementById(`AcctName_${rowId}`).value = item.acctName || '';
            document.getElementById(`description_${rowId}`).value = item.descrip || '';
            document.getElementById(`division_${rowId}`).value = item.ocrCode3 || '';
            document.getElementById(`DocTotal_${rowId}`).value = formatCurrencyValue(item.sumApplied) || '';
        }
    }
    
    // Update totals
    updateTotalAmountDue();
    
    // Set approval information
    if (data.approval) {
        // Set approval fields using the new function
        if (data.approval.preparedBy) {
            setApprovalFieldValue('Approval.PreparedById', data.approval.preparedBy, data.approval.preparedByName);
        }
        
        if (data.approval.checkedBy) {
            setApprovalFieldValue('Approval.CheckedById', data.approval.checkedBy, data.approval.checkedByName);
        }
        
        if (data.approval.acknowledgedBy) {
            setApprovalFieldValue('Approval.AcknowledgedById', data.approval.acknowledgedBy, data.approval.acknowledgedByName);
        }
        
        if (data.approval.approvedBy) {
            setApprovalFieldValue('Approval.ApprovedById', data.approval.approvedBy, data.approval.approvedByName);
        }
        
        if (data.approval.receivedBy) {
            setApprovalFieldValue('Approval.ReceivedById', data.approval.receivedBy, data.approval.receivedByName);
        }
        
        if (data.approval.closedBy) {
            setApprovalFieldValue('Approval.ClosedById', data.approval.closedBy, data.approval.closedByName);
        }
    }
    
    // Show rejection remarks if status is Rejected
    if (data.approval && data.approval.approvalStatus === 'Rejected' && data.approval.rejectionRemarks) {
        document.getElementById('rejectionRemarksSection').style.display = 'block';
        document.getElementById('rejectionRemarks').value = data.approval.rejectionRemarks;
    } else {
        document.getElementById('rejectionRemarksSection').style.display = 'none';
    }
}

// Function to approve/check the outgoing payment
function approveOP() {
    // Get the outgoing payment ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const outgoingPaymentId = urlParams.get('id');
    
    if (!outgoingPaymentId) {
        Swal.fire({
            title: 'Error',
            text: 'Outgoing Payment ID not found in URL',
            icon: 'error'
        });
        return;
    }
    
    // Get the current user ID for the checker
    const userId = getUserId();
    if (!userId) {
        Swal.fire({
            title: 'Error',
            text: 'User not logged in or session expired',
            icon: 'error'
        });
        return;
    }
    
    // Confirm before approving
    Swal.fire({
        title: 'Confirm Check',
        text: 'Are you sure you want to check this outgoing payment?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            // Show loading indicator
            Swal.fire({
                title: 'Processing...',
                text: 'Checking outgoing payment',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Send approval request to API
            fetch(`${apiBaseUrl}/api/outgoing-payments/${outgoingPaymentId}/check`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    checkedById: userId,
                    checkedDate: new Date().toISOString()
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to check outgoing payment');
                }
                return response.json();
            })
            .then(data => {
                Swal.fire({
                    title: 'Success',
                    text: 'Outgoing payment has been checked successfully',
                    icon: 'success'
                }).then(() => {
                    // Redirect back to menu
                    goToMenuOP();
                });
            })
            .catch(error => {
                console.error('Error checking outgoing payment:', error);
                
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to check outgoing payment. Please try again.',
                    icon: 'error'
                });
            });
        }
    });
}

// Function to reject the outgoing payment
function rejectOP() {
    // Get the outgoing payment ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const outgoingPaymentId = urlParams.get('id');
    
    if (!outgoingPaymentId) {
        Swal.fire({
            title: 'Error',
            text: 'Outgoing Payment ID not found in URL',
            icon: 'error'
        });
        return;
    }
    
    // Get the current user ID for the checker
    const userId = getUserId();
    if (!userId) {
        Swal.fire({
            title: 'Error',
            text: 'User not logged in or session expired',
            icon: 'error'
        });
        return;
    }
    
    // Prompt for rejection reason
    Swal.fire({
        title: 'Rejection Reason',
        input: 'textarea',
        inputLabel: 'Please provide a reason for rejection',
        inputPlaceholder: 'Enter rejection reason here...',
        inputAttributes: {
            'aria-label': 'Rejection reason'
        },
        showCancelButton: true,
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        inputValidator: (value) => {
            if (!value) {
                return 'You need to provide a rejection reason';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const rejectionRemarks = result.value;
            
            // Show loading indicator
            Swal.fire({
                title: 'Processing...',
                text: 'Rejecting outgoing payment',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Send rejection request to API
            fetch(`${apiBaseUrl}/api/outgoing-payments/${outgoingPaymentId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rejectedById: userId,
                    rejectedDate: new Date().toISOString(),
                    rejectionRemarks: rejectionRemarks
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to reject outgoing payment');
                }
                return response.json();
            })
            .then(data => {
                Swal.fire({
                    title: 'Success',
                    text: 'Outgoing payment has been rejected',
                    icon: 'success'
                }).then(() => {
                    // Redirect back to menu
                    goToMenuOP();
                });
            })
            .catch(error => {
                console.error('Error rejecting outgoing payment:', error);
                
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to reject outgoing payment. Please try again.',
                    icon: 'error'
                });
            });
        }
    });
}

// Function to display existing attachments
function displayExistingAttachments(attachments) {
    const container = document.getElementById('existingAttachments');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    if (!attachments || attachments.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
        return;
    }
    
    // Create attachment list
    const attachmentList = document.createElement('div');
    attachmentList.className = 'space-y-2';
    
    attachments.forEach((attachment, index) => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex items-center justify-between p-2 bg-gray-50 rounded border';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'flex items-center space-x-2';
        
        // File icon based on type
        const fileIcon = getFileIcon(attachment.fileName || attachment.name);
        
        fileInfo.innerHTML = `
            <span class="text-lg">${fileIcon}</span>
            <div>
                <div class="font-medium text-sm">${attachment.fileName || attachment.name || 'Unknown File'}</div>
                <div class="text-xs text-gray-500">${formatFileSize(attachment.fileSize || attachment.size)} • ${attachment.fileType || attachment.contentType || 'Unknown Type'}</div>
                <div class="text-xs text-gray-400">Uploaded: ${formatDate(attachment.uploadDate || attachment.createdAt)}</div>
            </div>
        `;
        
        const actions = document.createElement('div');
        actions.className = 'flex space-x-2';
        
        // View button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50';
        viewBtn.innerHTML = '👁️ View';
        viewBtn.onclick = () => viewAttachment(attachment);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded border border-red-300 hover:bg-red-50';
        deleteBtn.innerHTML = '🗑️ Delete';
        deleteBtn.onclick = () => deleteAttachment(attachment.id || index);
        
        actions.appendChild(viewBtn);
        actions.appendChild(deleteBtn);
        
        attachmentItem.appendChild(fileInfo);
        attachmentItem.appendChild(actions);
        attachmentList.appendChild(attachmentItem);
    });
    
    container.appendChild(attachmentList);
}

// Function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove data URL prefix to get only base64 data
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// Function to get file icon based on file type
function getFileIcon(fileName) {
    if (!fileName) return '📄';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
        case 'pdf': return '📄';
        case 'doc':
        case 'docx': return '📝';
        case 'xls':
        case 'xlsx': return '📊';
        case 'jpg':
        case 'jpeg':
        case 'png': return '🖼️';
        default: return '📄';
    }
}

// Function to format file size
function formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Function to format date (YYYY-MM-DD to DD MMM YYYY)
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Function to view attachment
async function viewAttachment(attachment) {
    try {
        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            text: 'Loading attachment, please wait...',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Get document ID from URL parameters or from attachment object
        const urlParams = new URLSearchParams(window.location.search);
        let docId = urlParams.get('id');
        
        // If no docId in URL, try to get it from attachment object
        if (!docId && attachment.reimbursementId) {
            docId = attachment.reimbursementId;
        }
        
        // If still no docId, try to get it from global variable
        if (!docId && window.currentDocumentId) {
            docId = window.currentDocumentId;
        }
        
        if (!docId) {
            throw new Error('Document ID not found. Please ensure you are viewing an existing document.');
        }

        // If attachment already has filePath, use it directly
        if (attachment.filePath) {
            // Close loading indicator
            Swal.close();
            
            // Use the base URL from the API endpoint
            const baseUrl = 'https://expressiv.idsdev.site';
            const fileUrl = `${baseUrl}/api/files/${encodeURIComponent(attachment.filePath)}`;
            
            // Open file in new tab
            window.open(fileUrl, '_blank');
            return;
        }

        // Fetch attachment data from API - use reimbursement attachments endpoint
        const response = await fetch(`${apiBaseUrl}/api/reimbursements/${docId}/attachments`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch attachment: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.data || result.data.length === 0) {
            throw new Error('No attachments found');
        }

        // Find the specific attachment by ID or fileName
        const targetAttachment = result.data.find(att => 
            att.id === attachment.id || 
            att.fileName === attachment.fileName ||
            att.filePath === attachment.filePath
        );

        if (!targetAttachment) {
            throw new Error('Attachment not found');
        }

        // Close loading indicator
        Swal.close();

        // Construct the file URL using the filePath from API response
        if (targetAttachment.filePath) {
            // Use the base URL from the API endpoint
            const baseUrl = 'https://expressiv.idsdev.site';
            const fileUrl = `${baseUrl}/api/files/${encodeURIComponent(targetAttachment.filePath)}`;
            
            // Open file in new tab
            window.open(fileUrl, '_blank');
        } else {
            throw new Error('File path not available');
        }

    } catch (error) {
        console.error('Error viewing attachment:', error);
        Swal.fire({
            title: 'Error',
            text: `Failed to view attachment: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to refresh attachments


// Function to delete attachment
function deleteAttachment(attachmentId) {
    Swal.fire({
        title: 'Confirm Delete',
        text: 'Are you sure you want to delete this attachment?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // Show loading
                Swal.fire({
                    title: 'Deleting...',
                    text: 'Please wait while we delete the attachment',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                // Call API to delete attachment - use reimbursement attachments endpoint
                const response = await fetch(`${apiBaseUrl}/api/reimbursements/attachments/${attachmentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to delete attachment: ${response.status}`);
                }
                
                // Remove attachment from the list
                const container = document.getElementById('existingAttachments');
                if (container) {
                    const attachmentItems = container.querySelectorAll('.flex.items-center.justify-between');
                    attachmentItems.forEach(item => {
                        const deleteBtn = item.querySelector('button[onclick*="deleteAttachment"]');
                        if (deleteBtn && deleteBtn.onclick.toString().includes(attachmentId)) {
                            item.remove();
                        }
                    });
                }
                
                Swal.fire({
                    title: 'Deleted',
                    text: 'Attachment has been deleted successfully.',
                    icon: 'success'
                });
                
            } catch (error) {
                console.error('Error deleting attachment:', error);
                Swal.fire({
                    title: 'Error',
                    text: `Failed to delete attachment: ${error.message}`,
                    icon: 'error'
                });
            }
        }
    });
}

// Function to submit document with API endpoint implementation
async function submitDocument(isSubmit = false) {
    // Validate required fields first
    const validationErrors = validateRequiredFields();
    if (validationErrors.length > 0) {
        await Swal.fire({
            title: 'Validation Error',
            html: validationErrors.map(error => `• ${error}`).join('<br>'),
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }

    // Show confirmation dialog only for submit
    if (isSubmit) {
        const result = await Swal.fire({
            title: 'Konfirmasi',      
            text: 'Apakah dokumen sudah benar?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) {
            return;
        }
    }

    // Show loading indicator
    const loadingTitle = isSubmit ? 'Mengirim...' : 'Menyimpan...';
    const loadingText = isSubmit ? 'Mengirim dokumen, silakan tunggu...' : 'Menyimpan dokumen, silakan tunggu...';
    
    Swal.fire({
        title: loadingTitle,
        text: loadingText,
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // Get user ID from JWT token using auth.js function
        const userId = getUserId();
        if (!userId) {
            throw new Error("Tidak dapat mendapatkan ID pengguna dari token. Silakan login kembali.");
        }
        
        // Ensure approval field values are properly set before submission
        await ensureApprovalFieldsBeforeSubmit();
        
        // Collect form data
        const formData = collectFormData(userId, isSubmit);
        
        // Submit the form data to API
        const response = await fetch(`https://expressiv.idsdev.site/api/staging-outgoing-payments/headers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json-patch+json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'accept': '/'
            },
            body: JSON.stringify(formData)
        });
        
                    if (!response.ok) {
                // Parse the error response to get the actual error message
                let errorMessage = `Error API: ${response.status}`;
                try {
                    const responseText = await response.text();
                    console.log("Raw error response:", responseText);
                    
                    const errorData = JSON.parse(responseText);
                    console.log("Parsed error data:", errorData);
                    
                    // Handle ApiResponse error format
                    if (errorData.Message) {
                        errorMessage = errorData.Message;
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                    
                    // Handle validation errors array in Data field
                    if (errorData.Data && Array.isArray(errorData.Data)) {
                        errorMessage = "Error validasi:\n" + errorData.Data.join("\n");
                    } else if (errorData.errors && Array.isArray(errorData.errors)) {
                        errorMessage = "Error validasi:\n" + errorData.errors.join("\n");
                    }
                    
                } catch (parseError) {
                    console.log("Could not parse error response:", parseError);
                }
                throw new Error(errorMessage);
            }
        
        // Parse the successful response
        const result = await response.json();
        console.log("Submit result:", result);
        
        // Show appropriate success message
        if (isSubmit) {
            await Swal.fire({
                title: 'Berhasil',
                text: 'Dokumen berhasil dikirim',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } else {
            await Swal.fire({
                title: 'Berhasil!',
                text: 'Dokumen berhasil disimpan sebagai draft',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        }
        
        // Redirect back to menu page
        goToMenuOP();
        
    } catch (error) {
        console.error("Error processing document:", error);
        
        // Show error message with SweetAlert for both submit and save
        await Swal.fire({
            title: 'Error',
            text: `Gagal ${isSubmit ? 'mengirim' : 'menyimpan'} dokumen: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to collect form data according to API specification
function collectFormData(userId, isSubmit) {
    // Get reimbursement data from URL or localStorage first
    const urlParams = new URLSearchParams(window.location.search);
    const reimbursementId = urlParams.get('reimbursement-id');
    
    console.log('Reimbursement ID from URL:', reimbursementId);
    
    // Generate a unique staging ID for backend
    const stagingID = `OP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Collect lines data from table
    const lines = [];
    const tableRows = document.querySelectorAll('#tableBody tr');
    
    console.log('Collecting lines data from table. Total rows:', tableRows.length);
    
    tableRows.forEach((row, index) => {
        // Look for inputs with multiple possible selectors
        const acctCodeInput = row.querySelector('input[id="AcctCode"]') || 
                             row.querySelector('input[id^="AcctCode_"]') ||
                             row.querySelector('td:first-child input');
        
        const acctNameInput = row.querySelector('input[id="AcctName"]') || 
                             row.querySelector('input[id^="AcctName_"]') ||
                             row.querySelector('td:nth-child(2) input');
        
        const descriptionInput = row.querySelector('input[id="description"]') || 
                               row.querySelector('input[id^="description_"]') ||
                               row.querySelector('td:nth-child(3) input');
        
        const divisionInput = row.querySelector('input[id="division"]') || 
                            row.querySelector('input[id^="division_"]') ||
                            row.querySelector('td:nth-child(4) input');
        
        const docTotalInput = row.querySelector('input[id="DocTotal"]') || 
                             row.querySelector('input[id^="DocTotal_"]') ||
                             row.querySelector('input.currency-input-idr') ||
                             row.querySelector('td:nth-child(5) input');
        
        // Parse amount using IDR format if available
        let parsedAmount = 0;
        if (docTotalInput) {
            if (typeof window.parseCurrencyIDR === 'function') {
                parsedAmount = window.parseCurrencyIDR(docTotalInput.value) || 0;
            } else {
                parsedAmount = parseCurrency(docTotalInput.value) || 0;
            }
        }
        
        console.log(`Row ${index} data collection:`, {
            acctCodeInput: acctCodeInput,
            acctNameInput: acctNameInput,
            descriptionInput: descriptionInput,
            divisionInput: divisionInput,
            docTotalInput: docTotalInput,
            acctCodeValue: acctCodeInput ? acctCodeInput.value : 'N/A',
            acctNameValue: acctNameInput ? acctNameInput.value : 'N/A',
            descriptionValue: descriptionInput ? descriptionInput.value : 'N/A',
            divisionValue: divisionInput ? divisionInput.value : 'N/A',
            docTotalValue: docTotalInput ? docTotalInput.value : 'N/A',
            parsedAmount: parsedAmount
        });
        
        if (acctCodeInput && acctNameInput && descriptionInput && divisionInput && docTotalInput) {
            // Parse amount using IDR format if available
            let amount = 0;
            if (typeof window.parseCurrencyIDR === 'function') {
                amount = window.parseCurrencyIDR(docTotalInput.value) || 0;
            } else {
                amount = parseCurrency(docTotalInput.value) || 0;
            }
            
            const lineData = {
                lineID: index,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                stagingID: stagingID,
                docNum: 0,
                lineNum: index,
                acctCode: acctCodeInput.value || "",
                acctName: acctNameInput.value || "",
                descrip: descriptionInput.value || "",
                sumApplied: amount,
                ocrCode3: divisionInput.value || "",
                category: "REIMBURSEMENT",
                header: {
                    stagingID: stagingID
                }
            };
            
            console.log(`Adding line ${index}:`, lineData);
            lines.push(lineData);
        }
    });
    
    // Collect attachments data
    const attachments = [];
    const attachmentInput = document.getElementById('attachment');
    
    console.log('Collecting attachments data');
    console.log('Attachment input:', attachmentInput);
    console.log('Files:', attachmentInput ? attachmentInput.files : 'No input found');
    
    if (attachmentInput && attachmentInput.files && attachmentInput.files.length > 0) {
        for (let i = 0; i < attachmentInput.files.length; i++) {
            const file = attachmentInput.files[i];
            console.log(`Processing file ${i}:`, file);
            
            const attachmentData = {
                attachmentID: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                stagingID: stagingID,
                fileName: file.name,
                originalFileName: file.name,
                filePath: "",
                fileSize: file.size,
                fileExtension: file.name.split('.').pop() || "",
                mimeType: file.type,
                description: "",
                attachmentType: "REIMBURSEMENT",
                uploadedBy: userId,
                uploadedDate: new Date().toISOString(),
                isActive: true,
                header: {
                    stagingID: stagingID
                }
            };
            
            console.log(`Adding attachment ${i}:`, attachmentData);
            attachments.push(attachmentData);
        }
    }
    
    console.log('Total attachments collected:', attachments.length);
    
    // Debug approval field values
    console.log('Approval field values:');
    console.log('PreparedById:', document.getElementById("Approval.PreparedById")?.value);
    console.log('CheckedById:', document.getElementById("Approval.CheckedById")?.value);
    console.log('AcknowledgedById:', document.getElementById("Approval.AcknowledgedById")?.value);
    console.log('ApprovedById:', document.getElementById("Approval.ApprovedById")?.value);
    console.log('ReceivedById:', document.getElementById("Approval.ReceivedById")?.value);
    
    // Collect approval field values using the new function
    const approvalData = collectApprovalFieldValues();
    
    console.log('Collected approval data:', approvalData);
    
    // Get approval field values, ensuring preparedBy is always set to current user if empty
    const preparedById = approvalData.PreparedById || userId;
    const checkedById = approvalData.CheckedById || "";
    const acknowledgedById = approvalData.AcknowledgedById || "";
    const approvedById = approvalData.ApprovedById || "";
    const receivedById = approvalData.ReceivedById || "";
    const closedById = approvalData.ClosedById || "";
    
    console.log('Final approval values to be sent:', {
        preparedBy: preparedById,
        checkedBy: checkedById,
        acknowledgedBy: acknowledgedById,
        approvedBy: approvedById,
        receivedBy: receivedById,
        closedBy: closedById
    });
    
    // Prepare the main request data according to API specification
    const requestData = {
        stagingID: stagingID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        docEntry: 0,
        address: document.getElementById("Address")?.value || "",
        cardName: document.getElementById("CardName")?.value || "",
        docDate: document.getElementById("DocDate")?.value ? new Date(document.getElementById("DocDate").value).toISOString() : null,
        docDueDate: document.getElementById("DocDueDate")?.value ? new Date(document.getElementById("DocDueDate").value).toISOString() : null,
        taxDate: document.getElementById("TaxDate")?.value ? new Date(document.getElementById("TaxDate").value).toISOString() : null,
        counterRef: document.getElementById("CounterRef")?.value || "",
        docNum: document.getElementById("DocNum")?.value ? parseInt(document.getElementById("DocNum").value) : 0,
        comments: document.getElementById("Comments")?.value || "",
        jrnlMemo: document.getElementById("JrnlMemo")?.value || "",
        doctype: document.getElementById("Doctype")?.value || "A",
        docCurr: document.getElementById("DocCurr")?.value || "IDR",
        diffCurr: document.getElementById("DocCurr")?.value || "IDR",
        trsfrDate: document.getElementById("TrsfrDate")?.value ? new Date(document.getElementById("TrsfrDate").value).toISOString() : null,
        trsfrAcct: document.getElementById("TrsfrAcct")?.value || "",
        trsfrSum: parseCurrency(document.getElementById("TrsfrSum")?.value) || 0,
        isInterfaced: false,
        type: document.getElementById("TypeOfTransaction")?.value || "REIMBURSEMENT",
        expressivNo: reimbursementId || document.getElementById("CounterRef")?.value || "",
        requesterId: userId,
        lines: lines,
        approval: {
            stagingID: stagingID,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvalStatus: isSubmit ? "Prepared" : "Draft",
            preparedBy: preparedById,
            checkedBy: checkedById,
            acknowledgedBy: acknowledgedById,
            approvedBy: approvedById,
            receivedBy: receivedById,
            preparedDate: new Date().toISOString(),
            checkedDate: null,
            acknowledgedDate: null,
            approvedDate: null,
            receivedDate: null,
            rejectedDate: null,
            rejectionRemarks: document.getElementById("rejectionRemarks")?.value || "",
            revisionNumber: 0,
            revisionDate: null,
            revisionRemarks: "",
            header: {
                stagingID: stagingID
            }
        },
        attachments: attachments
    };
    
    console.log('Final request data to be sent to API:', requestData);
    
    return requestData;
}

// Function to validate required fields
function validateRequiredFields() {
    const errors = [];
    
    // Check required fields
    const requiredFields = [
        { id: 'CounterRef', name: 'Nomor Reimbursement' },
        { id: 'RequesterName', name: 'Nama Pemohon Reimbursement' },
        { id: 'CardName', name: 'Dibayar Kepada' },
        { id: 'DocDate', name: 'Tanggal Dokumen' },
        { id: 'TypeOfTransaction', name: 'Jenis Transaksi' }
    ];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element || !element.value.trim()) {
            errors.push(`${field.name} wajib diisi`);
        }
    });
    
    // Check if at least one line item exists
    const tableRows = document.querySelectorAll('#tableBody tr');
    let hasValidLine = false;
    
    console.log('Validating table rows. Total rows found:', tableRows.length);
    
    tableRows.forEach((row, index) => {
        // Look for account code input - check multiple possible selectors
        const acctCodeInput = row.querySelector('input[id="AcctCode"]') || 
                             row.querySelector('input[id^="AcctCode_"]') ||
                             row.querySelector('input[placeholder*="account" i]') ||
                             row.querySelector('td:first-child input');
        
        // Look for amount input - check multiple possible selectors
        const docTotalInput = row.querySelector('input[id="DocTotal"]') || 
                             row.querySelector('input[id^="DocTotal_"]') ||
                             row.querySelector('input.currency-input-idr') ||
                             row.querySelector('td:nth-child(5) input');
        
        // Parse amount using IDR format if available
        let amount = 0;
        if (docTotalInput) {
            if (typeof window.parseCurrencyIDR === 'function') {
                amount = window.parseCurrencyIDR(docTotalInput.value) || 0;
            } else {
                amount = parseCurrency(docTotalInput.value) || 0;
            }
        }
        
        console.log(`Row ${index} validation:`, {
            row: row,
            acctCodeInput: acctCodeInput,
            docTotalInput: docTotalInput,
            acctCodeValue: acctCodeInput ? acctCodeInput.value : 'N/A',
            docTotalValue: docTotalInput ? docTotalInput.value : 'N/A',
            parsedAmount: amount
        });
        
        if (acctCodeInput && docTotalInput && 
            acctCodeInput.value.trim() && 
            amount > 0) {
            hasValidLine = true;
            console.log('Valid line found:', {
                accountCode: acctCodeInput.value.trim(),
                amount: amount
            });
        }
    });
    
    if (!hasValidLine) {
        errors.push('Minimal satu baris item dengan kode akun dan jumlah diperlukan. Silakan tambahkan kode akun dan jumlah di tabel di bawah.');
        console.log('No valid line items found. Total rows:', tableRows.length);
        
        // Show a helpful message to the user
        Swal.fire({
            title: 'Error Validasi',
            text: 'Minimal satu baris item dengan kode akun dan jumlah diperlukan. Silakan tambahkan kode akun dan jumlah di tabel di bawah.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    }
    
    return errors;
}

// Function to load document data from API
async function loadDocumentData() {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('id') || urlParams.get('reimbursement-id');
    
    if (!docId) {
        return; // No document ID, this is a new document
    }
    
    try {
        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            text: 'Loading document data, please wait...',
            icon: 'info',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Ensure user dropdowns are initialized first
        if (!window.users || window.users.length === 0) {
            console.log('Initializing user dropdowns before loading document data...');
            await initializeUserDropdowns();
        }
        
        // Fetch document data from API - use reimbursement endpoint
        const response = await fetch(`https://expressiv.idsdev.site/api/reimbursements/${docId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
                'accept': 'text/plain'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load document: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.data) {
            console.log('Document data loaded:', result.data);
            console.log('Approval data:', result.data.approval);
            
            // Map response data to form
            mapResponseToForm(result.data);
            
            // Update user names in approval fields after mapping
            updateUserNamesInApprovalFields();
            
            // Update totals after data is loaded
            updateTotalAmountDue();
            
            // Ensure approval field values are properly set
            setTimeout(async () => {
                await ensureApprovalFieldValues();
            }, 500);
            
            // Load attachments from API
            await loadAttachmentsFromAPI(docId);
            
            // Show success message
            Swal.fire({
                title: 'Success',
                text: 'Document data loaded successfully',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        }
        
    } catch (error) {
        console.error("Error loading document:", error);
        
        Swal.fire({
            title: 'Error',
            text: `Failed to load document: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Function to map response data back to form fields
function mapResponseToForm(responseData) {
    // Map header fields based on new API response structure
    if (responseData.voucherNo) document.getElementById("CounterRef").value = responseData.voucherNo;
    if (responseData.requesterName) document.getElementById("RequesterName").value = responseData.requesterName;
    if (responseData.payToName) document.getElementById("CardName").value = responseData.payToName;
    // Address field is not available in new API response
    if (responseData.submissionDate) document.getElementById("DocDate").value = responseData.submissionDate.split('T')[0];
    
    // Set default dates for fields not available in API
    const today = new Date();
    document.getElementById("DocDueDate").value = today.toISOString().split('T')[0];
    document.getElementById("TaxDate").value = today.toISOString().split('T')[0];
    document.getElementById("TrsfrDate").value = today.toISOString().split('T')[0];
    
    // Map other fields
    if (responseData.referenceDoc) document.getElementById("DocNum").value = responseData.referenceDoc;
    if (responseData.remarks) document.getElementById("Comments").value = responseData.remarks;
    if (responseData.typeOfTransaction) document.getElementById("JrnlMemo").value = responseData.typeOfTransaction;
    if (responseData.currency) document.getElementById("DocCurr").value = responseData.currency;
    if (responseData.typeOfTransaction) document.getElementById("TypeOfTransaction").value = responseData.typeOfTransaction;
    
    // Transfer account and sum not available in new API
    document.getElementById("TrsfrAcct").value = '';
    
    // Map total fields
    if (responseData.totalAmount) {
        const formattedAmount = formatCurrencyValue(responseData.totalAmount);
        document.getElementById("netTotal").value = formattedAmount;
        document.getElementById("totalTax").value = formattedAmount;
        document.getElementById("totalAmountDue").value = formattedAmount;
        document.getElementById("TrsfrSum").value = formattedAmount;
    }
    
    // Map remarks fields
    if (responseData.remarks) document.getElementById("remarks").value = responseData.remarks;
    // Journal remarks not available in new API
    
    // Map approval fields with proper employee name lookup
    if (responseData.preparedBy) {
        setApprovalFieldValue("Approval.PreparedById", responseData.preparedBy, responseData.preparedByName);
    }
    if (responseData.checkedBy) {
        setApprovalFieldValue("Approval.CheckedById", responseData.checkedBy, responseData.checkedByName);
    }
    if (responseData.acknowledgedBy) {
        setApprovalFieldValue("Approval.AcknowledgedById", responseData.acknowledgedBy, responseData.acknowledgedByName);
    }
    if (responseData.approvedBy) {
        setApprovalFieldValue("Approval.ApprovedById", responseData.approvedBy, responseData.approvedByName);
    }
    if (responseData.receivedBy) {
        setApprovalFieldValue("Approval.ReceivedById", responseData.receivedBy, responseData.receivedByName);
    }
    
    // Handle rejection remarks if status is rejected
    if (responseData.status === 'Rejected') {
        // Check which level was rejected and show appropriate remarks
        let rejectionRemarks = '';
        if (responseData.remarksRejectByChecker) {
            rejectionRemarks = responseData.remarksRejectByChecker;
        } else if (responseData.remarksRejectByAcknowledger) {
            rejectionRemarks = responseData.remarksRejectByAcknowledger;
        } else if (responseData.remarksRejectByApprover) {
            rejectionRemarks = responseData.remarksRejectByApprover;
        } else if (responseData.remarksRejectByReceiver) {
            rejectionRemarks = responseData.remarksRejectByReceiver;
        }
        
        if (rejectionRemarks) {
            document.getElementById("rejectionRemarks").value = rejectionRemarks;
            document.getElementById("rejectionRemarksSection").style.display = "block";
        }
    }
    
    // Map reimbursement details to table lines
    if (responseData.reimbursementDetails && responseData.reimbursementDetails.length > 0) {
        // Clear existing table rows except the first one
        const tableBody = document.getElementById('tableBody');
        const firstRow = tableBody.querySelector('tr');
        tableBody.innerHTML = '';
        if (firstRow) tableBody.appendChild(firstRow);
        
        // Add lines from response
        responseData.reimbursementDetails.forEach((detail, index) => {
            if (index === 0) {
                // Update first row
                const firstRow = tableBody.querySelector('tr');
                if (firstRow) {
                    firstRow.querySelector('[id^="AcctCode"]').value = detail.glAccount || '';
                    firstRow.querySelector('[id^="AcctName"]').value = detail.accountName || '';
                    firstRow.querySelector('[id^="description"]').value = detail.description || '';
                    firstRow.querySelector('[id^="division"]').value = detail.category || '';
                    firstRow.querySelector('[id^="DocTotal"]').value = formatCurrencyValue(detail.amount || 0);
                }
            } else {
                // Add new rows
                addRow();
                const newRow = tableBody.lastElementChild;
                newRow.querySelector('[id^="AcctCode"]').value = detail.glAccount || '';
                newRow.querySelector('[id^="AcctName"]').value = detail.accountName || '';
                newRow.querySelector('[id^="description"]').value = detail.description || '';
                newRow.querySelector('[id^="division"]').value = detail.category || '';
                newRow.querySelector('[id^="DocTotal"]').value = formatCurrencyValue(detail.amount || 0);
            }
        });
        
        // Update totals after mapping lines
        updateTotalAmountDue();
    }
}

// Function to load attachments from API
async function loadAttachmentsFromAPI(docId) {
    try {
        // Fetch attachments from API - use reimbursement attachments endpoint
        const response = await fetch(`https://expressiv.idsdev.site/api/reimbursements/${docId}/attachments`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn(`Failed to load attachments: ${response.status}`);
            return;
        }

        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
            // Display attachments from API response
            displayExistingAttachments(result.data);
        } else {
            // Show no attachments message
            const container = document.getElementById('existingAttachments');
            if (container) {
                container.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
            }
        }
        
    } catch (error) {
        console.error("Error loading attachments:", error);
        // Don't show error to user as this is not critical
    }
}

// Function to toggle closed by visibility based on transaction type
function toggleClosedByVisibility() {
    const transactionType = document.getElementById('TypeOfTransaction')?.value;
    const closedByContainer = document.getElementById('closed')?.parentElement;
    
    if (closedByContainer) {
        if (transactionType === 'LOAN') {
            closedByContainer.style.display = 'block';
        } else {
            closedByContainer.style.display = 'none';
        }
    }
}

// Function to make authenticated request (helper function)
async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    return fetch(url, finalOptions);
}

// Make functions globally available for HTML onclick handlers
window.submitDocument = submitDocument;
window.viewAttachment = viewAttachment;
window.deleteAttachment = deleteAttachment;
window.toggleClosedByVisibility = toggleClosedByVisibility;

// Function to update totals (compatible with HTML implementation)
function updateTotals() {
    // Get all DocTotal inputs from the table
    const docTotalInputs = document.querySelectorAll('#tableBody input[id^="DocTotal"]');
    let total = 0;
    
    // Sum all values
    docTotalInputs.forEach(input => {
        total += parseCurrency(input.value);
    });
    
    // Format the total with currency formatting
    const formattedTotal = formatCurrencyValue(total);
    
    // Update Net Total and Total Amount Due fields
    const netTotalField = document.getElementById('netTotal');
    const totalTaxField = document.getElementById('totalTax');
    const totalAmountDueField = document.getElementById('totalAmountDue');
    
    if (netTotalField) netTotalField.value = formattedTotal;
    if (totalTaxField) totalTaxField.value = formattedTotal;
    if (totalAmountDueField) totalAmountDueField.value = formattedTotal;
    
    // Also update the transfer sum field
    const trsfrSumField = document.getElementById('TrsfrSum');
    if (trsfrSumField) trsfrSumField.value = formattedTotal;
}

// Make updateTotalAmountDue globally available
window.updateTotalAmountDue = updateTotalAmountDue;

// Make updateTotals globally available
window.updateTotals = updateTotals;

// Make formatCurrency globally available for HTML
window.formatCurrency = formatCurrency;

// Make addRow and deleteRow globally available for HTML
window.addRow = addRow;
window.deleteRow = deleteRow;

// Function to update employee names in approval fields after employees are loaded
function updateUserNamesInApprovalFields() {
    if (!window.users || window.users.length === 0) {
        return;
    }
    
    const approvalFields = [
        'Approval.PreparedById',
        'Approval.CheckedById', 
        'Approval.AcknowledgedById',
        'Approval.ApprovedById',
        'Approval.ReceivedById',
        'Approval.ClosedById'
    ];
    
    approvalFields.forEach(fieldId => {
        const hiddenSelect = document.getElementById(fieldId);
        
        if (hiddenSelect && hiddenSelect.value) {
            const userId = hiddenSelect.value;
            const user = window.users.find(user => user.id === userId);
            
            if (user) {
                setApprovalFieldValue(fieldId, userId, user.fullName);
            }
        }
    });
}

// Make updateUserNamesInApprovalFields globally available
window.updateUserNamesInApprovalFields = updateUserNamesInApprovalFields;

// Function to set approval field value with proper DOM manipulation
function setApprovalFieldValue(fieldId, userId, userName = null) {
    const hiddenSelect = document.getElementById(fieldId);
    const searchInput = document.getElementById(`${fieldId}Search`);
    
    if (!hiddenSelect || !searchInput) {
        console.warn(`Approval field elements not found: ${fieldId}`);
        return;
    }
    
    console.log(`Setting ${fieldId}: userId=${userId}, userName=${userName}`);
    
    // Set the hidden select value - use setAttribute to ensure it's set
    if (userId) {
        hiddenSelect.value = userId;
        // Also set the selected attribute on the option if it exists
        const options = hiddenSelect.querySelectorAll('option');
        options.forEach(option => {
            if (option.value === userId) {
                option.selected = true;
            } else {
                option.selected = false;
            }
        });
        
        // If no matching option exists, create one
        if (!hiddenSelect.querySelector(`option[value="${userId}"]`)) {
            const newOption = document.createElement('option');
            newOption.value = userId;
            newOption.text = userName || `User ${userId}`;
            newOption.selected = true;
            hiddenSelect.appendChild(newOption);
        }
    } else {
        hiddenSelect.value = '';
    }
    
    // Set the search input value
    if (userName) {
        searchInput.value = userName;
    } else if (userId && window.users && window.users.length > 0) {
        // Try to find user name from global users array
        const user = window.users.find(user => user.id === userId);
        if (user) {
            searchInput.value = user.fullName;
        } else {
            searchInput.value = `User ID: ${userId}`;
        }
    } else if (userId) {
        searchInput.value = `User ID: ${userId}`;
    } else {
        searchInput.value = '';
    }
    
    // Trigger change event to ensure any listeners are notified
    const changeEvent = new Event('change', { bubbles: true });
    const inputEvent = new Event('input', { bubbles: true });
    
    hiddenSelect.dispatchEvent(changeEvent);
    searchInput.dispatchEvent(inputEvent);
    searchInput.dispatchEvent(changeEvent);
    
    console.log(`Set ${fieldId}: ID=${hiddenSelect.value}, Name=${searchInput.value}`);
    
    // Verify the value was set correctly
    setTimeout(() => {
        console.log(`Verification - ${fieldId}: hiddenSelect.value=${hiddenSelect.value}, searchInput.value=${searchInput.value}`);
    }, 100);
}

// Function to ensure approval field values are properly set after page load
async function ensureApprovalFieldValues() {
    const approvalFields = [
        'Approval.PreparedById',
        'Approval.CheckedById', 
        'Approval.AcknowledgedById',
        'Approval.ApprovedById',
        'Approval.ReceivedById',
        'Approval.ClosedById'
    ];
    
    for (const fieldId of approvalFields) {
        const hiddenSelect = document.getElementById(fieldId);
        const searchInput = document.getElementById(`${fieldId}Search`);
        
        if (hiddenSelect && searchInput) {
            // If hidden select has a value but search input is empty, try to set the name
            if (hiddenSelect.value && !searchInput.value.trim()) {
                const userId = hiddenSelect.value;
                if (window.users && window.users.length > 0) {
                    const user = window.users.find(user => user.id === userId);
                    if (user) {
                        searchInput.value = user.fullName;
                    } else {
                        searchInput.value = `User ID: ${userId}`;
                    }
                } else {
                    searchInput.value = `User ID: ${userId}`;
                }
            }
            // If search input has value but hidden select is empty, try to find user ID
            else if (searchInput.value.trim() && !hiddenSelect.value) {
                const userId = await findUserIdByName(searchInput.value);
                if (userId) {
                    hiddenSelect.value = userId;
                    console.log(`Set ${fieldId}: ${userId} for ${searchInput.value}`);
                }
            }
        }
    }
}

// Make ensureApprovalFieldValues globally available
window.ensureApprovalFieldValues = ensureApprovalFieldValues;

// Debug function to check approval field values (can be called from browser console)
function debugApprovalFields() {
    const approvalFields = [
        'Approval.PreparedById',
        'Approval.CheckedById', 
        'Approval.AcknowledgedById',
        'Approval.ApprovedById',
        'Approval.ReceivedById',
        'Approval.ClosedById'
    ];
    
    console.log('=== Approval Fields Debug ===');
    approvalFields.forEach(fieldId => {
        const hiddenSelect = document.getElementById(fieldId);
        const searchInput = document.getElementById(`${fieldId}Search`);
        
        console.log(`${fieldId}:`);
        console.log(`  Hidden Select Value: ${hiddenSelect ? hiddenSelect.value : 'Element not found'}`);
        console.log(`  Search Input Value: ${searchInput ? searchInput.value : 'Element not found'}`);
        console.log(`  Search Input Element:`, searchInput);
    });
    
    console.log('Global users:', window.users);
    console.log('========================');
}

// Make debug function globally available
window.debugApprovalFields = debugApprovalFields;

// Function to collect approval field values for form submission
function collectApprovalFieldValues() {
    const approvalFields = [
        'Approval.PreparedById',
        'Approval.CheckedById', 
        'Approval.AcknowledgedById',
        'Approval.ApprovedById',
        'Approval.ReceivedById',
        'Approval.ClosedById'
    ];
    
    const approvalData = {};
    
    approvalFields.forEach(fieldId => {
        const hiddenSelect = document.getElementById(fieldId);
        const searchInput = document.getElementById(`${fieldId}Search`);
        
        if (hiddenSelect && searchInput) {
            const userId = hiddenSelect.value;
            const userName = searchInput.value;
            
            // Extract the field name (e.g., "PreparedById" from "Approval.PreparedById")
            const fieldName = fieldId.replace('Approval.', '');
            
            approvalData[fieldName] = userId;
            approvalData[`${fieldName}Name`] = userName;
            
            console.log(`Collected ${fieldName}: ID=${userId}, Name=${userName}`);
        }
    });
    
    return approvalData;
}

// Make collectApprovalFieldValues globally available
window.collectApprovalFieldValues = collectApprovalFieldValues;

// Function to ensure approval field values are properly set before submission
async function ensureApprovalFieldsBeforeSubmit() {
    console.log('Ensuring approval field values before submission...');
    
    // Load users if not already loaded
    await loadUsersIfNeeded();
    
    const approvalFields = [
        'Approval.PreparedById',
        'Approval.CheckedById', 
        'Approval.AcknowledgedById',
        'Approval.ApprovedById',
        'Approval.ReceivedById',
        'Approval.ClosedById'
    ];
    
    for (const fieldId of approvalFields) {
        const hiddenSelect = document.getElementById(fieldId);
        const searchInput = document.getElementById(`${fieldId}Search`);
        
        if (hiddenSelect && searchInput) {
            // If search input has value but hidden select is empty, try to find user
            if (searchInput.value.trim() && !hiddenSelect.value) {
                console.log(`Searching for user ID for ${fieldId}: ${searchInput.value}`);
                const userId = await findUserIdByName(searchInput.value);
                if (userId) {
                    hiddenSelect.value = userId;
                    console.log(`Found user for ${fieldId}: ${userId} - ${searchInput.value}`);
                    
                    // Create option if it doesn't exist
                    if (!hiddenSelect.querySelector(`option[value="${userId}"]`)) {
                        const newOption = document.createElement('option');
                        newOption.value = userId;
                        newOption.text = searchInput.value;
                        newOption.selected = true;
                        hiddenSelect.appendChild(newOption);
                    }
                } else {
                    console.warn(`Could not find user ID for ${fieldId}: ${searchInput.value}`);
                }
            }
            
            console.log(`${fieldId}: hiddenSelect.value=${hiddenSelect.value}, searchInput.value=${searchInput.value}`);
        }
    }
}

// Make ensureApprovalFieldsBeforeSubmit globally available
window.ensureApprovalFieldsBeforeSubmit = ensureApprovalFieldsBeforeSubmit;

// Function to find user ID by name when users array is not available
async function findUserIdByName(userName) {
    if (!userName || typeof userName !== 'string' || !userName.trim()) {
        return null;
    }
    
    // Try to find in global users array first
    if (window.users && window.users.length > 0) {
        const user = window.users.find(user => 
            typeof user.fullName === 'string' &&
            (
                user.fullName.toLowerCase().includes(userName.toLowerCase()) ||
                user.fullName.toLowerCase() === userName.toLowerCase()
            )
        );
        if (user) {
            console.log(`Found user by name in global array: ${user.id} - ${user.fullName}`);
            return user.id;
        }
    }
    
    // If not found in global array, try to fetch from API
    console.log(`User not found in global array, trying to fetch from API for: ${userName}`);
    
    try {
        // Load users from API if not already loaded
        await loadUsersIfNeeded();
        
        // Try to find again after loading
        if (window.users && window.users.length > 0) {
            const user = window.users.find(user => 
                user.fullName.toLowerCase().includes(userName.toLowerCase()) ||
                user.fullName.toLowerCase() === userName.toLowerCase()
            );
            if (user) {
                console.log(`Found user by name after loading: ${user.id} - ${user.fullName}`);
                return user.id;
            }
        }
        
        console.log(`Could not find user ID for: ${userName}`);
        return null;
        
    } catch (error) {
        console.error('Error finding user by name:', error);
        return null;
    }
}

// Function to load users from API if not already loaded
async function loadUsersIfNeeded() {
    if (window.users && window.users.length > 0) {
        console.log('Users already loaded, skipping...');
        return;
    }
    
    console.log('Loading users from API...');
    
    try {
        const response = await fetch('https://expressiv.idsdev.site/api/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.status || !result.data) {
            throw new Error('Invalid response from API');
        }

        window.users = result.data;
        console.log('Users loaded successfully:', window.users.length);
        
        // Update approval field values after loading users
        updateUserNamesInApprovalFields();
        
    } catch (error) {
        console.error('Error loading users:', error);
        // Don't throw error as this is not critical for form submission
    }
}

// Make loadUsersIfNeeded globally available
window.loadUsersIfNeeded = loadUsersIfNeeded;
