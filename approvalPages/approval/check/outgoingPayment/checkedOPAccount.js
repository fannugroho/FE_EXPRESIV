// detailOPAcct.js - Indonesian Rupiah formatting for G/L Account table

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

// Helper function to parse formatted currency back to number, supporting very large values
function parseCurrency(formattedValue) {
    if (!formattedValue) return 0;
    
    try {
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
    
    // Setup text input validations (nvarchar)
    setupTextInput('description');
    setupTextInput('AcctCode');
    setupTextInput('AcctName');
    
    // Add event listeners for calculating total
    document.querySelectorAll('.currency-input').forEach(input => {
        input.addEventListener('input', updateTotalAmountDue);
    });
}

// Function to setup currency input with formatting for very large numbers
function setupCurrencyInput(inputId) {
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
        // Store the actual numeric value
        inputElement.numericValue = 0;
        
        // Convert to text input for better formatting control
        inputElement.type = 'text';
        inputElement.classList.add('currency-input');
        
        // Add input event for formatting
        inputElement.addEventListener('input', function(e) {
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
                    // Format the value for display, preserving original decimal places
                    const formattedValue = formatCurrency(rawValue);
                    
                    // Update the input value with formatted text
                    this.value = formattedValue;
                    
                    // Restore cursor position, adjusted for change in string length
                    const newLength = this.value.length;
                    const newCursorPos = cursorPos + (newLength - originalLength);
                    this.setSelectionRange(Math.max(0, newCursorPos), Math.max(0, newCursorPos));
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
                    // Format the value, preserving decimal places
                    this.value = formatCurrency(this.numericValue);
                } catch (e) {
                    console.error('Error formatting on blur:', e);
                    // If formatting fails, keep the current value
                }
            }
        });
        
        // Initialize with formatted value if it has a value
        if (inputElement.value && inputElement.value.trim() !== '') {
            try {
                const numericValue = parseFloat(inputElement.value) || 0;
                inputElement.numericValue = numericValue;
                inputElement.value = formatCurrency(numericValue);
            } catch (e) {
                console.error('Error initializing currency input:', e);
                // If formatting fails, keep the original value
            }
        }
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
            <input type="text" id="DocTotal_${newRowId}" class="w-full currency-input" />
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
    
    // Get all DocTotal inputs from the table
    const docTotalInputs = document.querySelectorAll('[id^="DocTotal_"]');
    docTotalInputs.forEach(input => {
        total += parseCurrency(input.value);
    });
    
    // Also include the first row if it exists
    const firstRowDocTotal = document.getElementById('DocTotal');
    if (firstRowDocTotal) {
        total += parseCurrency(firstRowDocTotal.value);
    }
    
    // Update the net total
    const netTotalInput = document.getElementById('tdDocTotal');
    if (netTotalInput) {
        netTotalInput.value = formatCurrency(total);
        netTotalInput.numericValue = total;
    }

    // Update the total tax
    const totalTaxInput = document.getElementById('totalTax');
    if (totalTaxInput) {
        totalTaxInput.value = formatCurrency(total);
        totalTaxInput.numericValue = total;
    }
    
    // Update the total amount due
    const totalAmountDueInput = document.getElementById('totalAmountDue');
    if (totalAmountDueInput) {
        totalAmountDueInput.value = formatCurrency(total);
        totalAmountDueInput.numericValue = total;
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

// Function to toggle closed by visibility based on transaction type
function toggleClosedByVisibility() {
    const transactionType = document.getElementById('transactionType').value;
    const closedByContainer = document.getElementById('closed').parentElement;
    
    if (transactionType === 'LOAN') {
        closedByContainer.style.display = 'block';
    } else {
        closedByContainer.style.display = 'none';
    }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load outgoing payment details from API
    loadOutgoingPaymentDetails();
    
    initializeInputValidations();
    toggleClosedByVisibility();
    
    // Add event listener for transaction type change
    const transactionTypeInput = document.getElementById('transactionType');
    if (transactionTypeInput) {
        transactionTypeInput.addEventListener('change', toggleClosedByVisibility);
    }
    
    // Setup initial row
    const firstRowDocTotal = document.getElementById('DocTotal');
    if (firstRowDocTotal) {
        firstRowDocTotal.addEventListener('input', updateTotalAmountDue);
    }
});

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

// Function to filter users
window.filterUsers = function(fieldId) {
    // Implementation for filtering users
    // This would typically involve filtering a dropdown based on input
    console.log(`Filtering users for field: ${fieldId}...`);
};

// Function to navigate back to the Outgoing Payment menu
function goToMenuOP() {
    window.location.href = '../../../dashboard/dashboardCheck/outgoingPayment/menuOPCheck.html';
}

// Function to load outgoing payment details from API
function loadOutgoingPaymentDetails() {
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
            fetch(`${BASE_URL}/api/outgoing-payments/${outgoingPaymentId}`, {
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
    document.getElementById('cashAdvanceNo').value = data.docNum || '';
    document.getElementById('employeeId').value = data.employeeId || '';
    document.getElementById('employeeName').value = data.employeeName || '';
    document.getElementById('purpose').value = data.purpose || '';
    document.getElementById('paidTo').value = data.paidTo || '';
    document.getElementById('paidToSearch').value = data.paidToName || '';
    
    // Set requester information
    if (data.requesterId) {
        document.getElementById('RequesterId').value = data.requesterId;
        document.getElementById('requesterSearch').value = data.requesterName || '';
    }
    
    // Set department information
    if (data.departmentId) {
        document.getElementById('departmentId').value = data.departmentId;
        document.getElementById('departmentSearch').value = data.departmentName || '';
    }
    
    // Set submission date
    if (data.submissionDate) {
        document.getElementById('submissionDate').value = data.submissionDate.split('T')[0];
    }
    
    // Set status
    document.getElementById('status').value = data.status || '';
    document.getElementById('statusSearch').value = data.statusName || '';
    
    // Set transaction type
    document.getElementById('transactionType').value = data.transactionType || '';
    document.getElementById('transactionTypeSearch').value = data.transactionTypeName || '';
    
    // Clear existing table rows except the first one
    const tableBody = document.getElementById('tableBody');
    while (tableBody.rows.length > 1) {
        tableBody.deleteRow(tableBody.rows.length - 1);
    }
    
    // Populate the first row if it exists
    if (data.items && data.items.length > 0) {
        const firstItem = data.items[0];
        document.getElementById('AcctCode').value = firstItem.acctCode || '';
        document.getElementById('AcctName').value = firstItem.acctName || '';
        document.getElementById('description').value = firstItem.description || '';
        document.getElementById('DocTotal').value = formatCurrency(firstItem.docTotal) || '';
        
        // Add additional rows for remaining items
        for (let i = 1; i < data.items.length; i++) {
            addRow();
            const item = data.items[i];
            const rowId = `row_${rowCounter - 1}`; // rowCounter is incremented in addRow()
            
            document.getElementById(`AcctCode_${rowId}`).value = item.acctCode || '';
            document.getElementById(`AcctName_${rowId}`).value = item.acctName || '';
            document.getElementById(`description_${rowId}`).value = item.description || '';
            document.getElementById(`DocTotal_${rowId}`).value = formatCurrency(item.docTotal) || '';
        }
    }
    
    // Update totals
    updateTotalAmountDue();
    
    // Set approval information
    if (data.approval) {
        // Prepared by
        if (data.approval.preparedBy) {
            document.getElementById('Approval.PreparedById').value = data.approval.preparedBy.id || '';
            document.getElementById('Approval.PreparedByIdSearch').value = data.approval.preparedBy.name || '';
        }
        
        // Checked by
        if (data.approval.checkedBy) {
            document.getElementById('Approval.CheckedById').value = data.approval.checkedBy.id || '';
            document.getElementById('Approval.CheckedByIdSearch').value = data.approval.checkedBy.name || '';
        }
        
        // Acknowledged by
        if (data.approval.acknowledgedBy) {
            document.getElementById('Approval.AcknowledgedById').value = data.approval.acknowledgedBy.id || '';
            document.getElementById('Approval.AcknowledgedByIdSearch').value = data.approval.acknowledgedBy.name || '';
        }
        
        // Approved by
        if (data.approval.approvedBy) {
            document.getElementById('Approval.ApprovedById').value = data.approval.approvedBy.id || '';
            document.getElementById('Approval.ApprovedByIdSearch').value = data.approval.approvedBy.name || '';
        }
        
        // Received by
        if (data.approval.receivedBy) {
            document.getElementById('Approval.ReceivedById').value = data.approval.receivedBy.id || '';
            document.getElementById('Approval.ReceivedByIdSearch').value = data.approval.receivedBy.name || '';
        }
        
        // Closed by
        if (data.approval.closedBy) {
            document.getElementById('Approval.ClosedById').value = data.approval.closedBy.id || '';
            document.getElementById('Approval.ClosedByIdSearch').value = data.approval.closedBy.name || '';
        }
    }
    
    // Show rejection remarks if status is Rejected
    if (data.status === 'R' && data.rejectionRemarks) {
        document.getElementById('rejectionRemarksSection').style.display = 'block';
        document.getElementById('rejectionRemarks').value = data.rejectionRemarks;
    } else {
        document.getElementById('rejectionRemarksSection').style.display = 'none';
    }
    
    // Toggle closed by visibility based on transaction type
    toggleClosedByVisibility();
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
            fetch(`${BASE_URL}/api/outgoing-payments/${outgoingPaymentId}/check`, {
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
            fetch(`${BASE_URL}/api/outgoing-payments/${outgoingPaymentId}/reject`, {
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
