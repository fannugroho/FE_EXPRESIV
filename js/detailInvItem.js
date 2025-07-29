// Global variables
let invoiceData = null;
let currentUser = null;
let employeesData = []; // Add this to store employee data

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
        console.log('No invoice identifier found, using default STG-001');
        loadInvoiceData('STG-001');
    }
    
    // Load employee data for approval dropdowns
    loadEmployeesData();
    
    // Setup approval input listeners
    setupApprovalInputListeners();
});

// Load employees data from API
async function loadEmployeesData() {
    try {
        console.log('Loading employees data from API...');
        
        const response = await fetch(`${API_BASE_URL}/employees`, {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Employees API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Employees API response:', result);
        
        if (result.status && result.data) {
            employeesData = result.data;
            console.log('Employees data loaded:', employeesData);
            
            // Setup approval dropdowns with employee data
            setupApprovalDropdowns();
            
            // If form is already populated, refresh the dropdowns
            if (invoiceData) {
                refreshApprovalDropdowns();
            }
        } else {
            throw new Error('Invalid response format from employees API');
        }
        
    } catch (error) {
        console.error('Error loading employees data:', error);
        // Don't show error to user as this is not critical for main functionality
    }
}

// Setup approval dropdowns with employee data
function setupApprovalDropdowns() {
    // Setup dropdowns for acknowledge, check, approve, and receive (excluding prepared by)
    const approvalFields = [
        { inputId: 'acknowledgeByName', dropdownId: 'acknowledgeBySelectDropdown', selectId: 'acknowledgeBy' },
        { inputId: 'checkedByName', dropdownId: 'checkedBySelectDropdown', selectId: 'checkedBy' },
        { inputId: 'approvedByName', dropdownId: 'approvedBySelectDropdown', selectId: 'approvedBy' },
        { inputId: 'receivedByName', dropdownId: 'receivedBySelectDropdown', selectId: 'receivedBy' }
    ];
    
    approvalFields.forEach(field => {
        setupEmployeeDropdown(field.inputId, field.dropdownId, field.selectId);
    });
    
    console.log('Approval dropdowns setup completed with employee data');
}

// Setup individual employee dropdown
function setupEmployeeDropdown(inputId, dropdownId, selectId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const select = document.getElementById(selectId);
    
    if (!input || !dropdown || !select) {
        console.warn(`Missing elements for dropdown setup: ${inputId}`);
        return;
    }
    
    // Populate select options
    select.innerHTML = '<option value="" disabled selected>Choose Name</option>';
    employeesData.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.fullName;
        option.textContent = employee.fullName;
        select.appendChild(option);
    });
    
            // Setup input event listeners
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredEmployees = employeesData.filter(employee => 
                employee.fullName.toLowerCase().includes(searchTerm)
            );
        
        displayEmployeeDropdown(dropdown, filteredEmployees, input, select);
    });
    
    input.addEventListener('focus', function() {
        const searchTerm = this.value.toLowerCase();
        const filteredEmployees = employeesData.filter(employee => 
            employee.fullName.toLowerCase().includes(searchTerm)
        );
        
        displayEmployeeDropdown(dropdown, filteredEmployees, input, select);
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

// Display employee dropdown with filtered results
function displayEmployeeDropdown(dropdown, employees, input, select) {
    dropdown.innerHTML = '';
    
    if (employees.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item no-results">No employees found</div>';
    } else {
        employees.forEach(employee => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `
                <div class="flex items-center">
                    <span class="font-medium">${employee.fullName}</span>
                </div>
            `;
            
            item.addEventListener('click', function() {
                input.value = employee.fullName;
                select.value = employee.fullName;
                dropdown.classList.add('hidden');
                
                // Trigger input event to mark as modified
                input.dispatchEvent(new Event('input'));
            });
            
            dropdown.appendChild(item);
        });
    }
    
    dropdown.classList.remove('hidden');
}

// Refresh approval dropdowns when employee data is loaded after form population
function refreshApprovalDropdowns() {
    const approvalFields = [
        { inputId: 'acknowledgeByName', selectId: 'acknowledgeBy' },
        { inputId: 'checkedByName', selectId: 'checkedBy' },
        { inputId: 'approvedByName', selectId: 'approvedBy' },
        { inputId: 'receivedByName', selectId: 'receivedBy' }
    ];
    
    approvalFields.forEach(field => {
        const input = document.getElementById(field.inputId);
        const select = document.getElementById(field.selectId);
        
        if (input && select) {
            // Update select options with employee data
            select.innerHTML = '<option value="" disabled selected>Choose Name</option>';
            employeesData.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.fullName;
                option.textContent = employee.fullName;
                select.appendChild(option);
            });
            
            // Update select value to match input value
            if (input.value) {
                select.value = input.value;
            }
        }
    });
    
    console.log('Approval dropdowns refreshed with employee data');
}

// Load invoice data from API
async function loadInvoiceData(invoiceId) {
    try {
        console.log('loadInvoiceData called with invoiceId:', invoiceId);
        
        // Construct API URL
        const apiUrl = `${API_BASE_URL}/ar-invoices/${invoiceId}/details`;
        console.log('API URL:', apiUrl);
        
        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Fetch data from API
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
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
            
            // Load attachments from the main response
            loadAttachmentsFromData(invoiceData.arInvoiceAttachments);
            
            // Close loading indicator
            Swal.close();
        } else {
            throw new Error('Invalid response format from API');
        }
        
    } catch (error) {
        console.error('Error loading invoice data:', error);
        
        let errorMessage = 'Failed to load invoice data';
        
        if (error.message.includes('404')) {
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
        });
    }
}

// Populate form with invoice data
function populateFormData(data) {
    // Debug: Log the complete data structure
    console.log('Complete invoice data:', data);
    console.log('Track number:', data.trackNo);
    console.log('Invoice number:', data.u_bsi_invnum);
    
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
    document.getElementById('GroupNum').value = data.groupNum || '1';
    document.getElementById('TrnspCode').value = data.trnspCode || '1';
    document.getElementById('U_BSI_ShippingType').value = data.u_BSI_ShippingType || '';
    document.getElementById('U_BSI_PaymentGroup').value = data.u_BSI_PaymentGroup || '';
    document.getElementById('U_BSI_Expressiv_IsTransfered').value = data.u_BSI_Expressiv_IsTransfered || 'N';
    document.getElementById('U_BSI_UDF1').value = data.u_bsi_udf1 || '';
    document.getElementById('U_BSI_UDF2').value = data.u_bsi_udf2 || '';
    document.getElementById('comments').value = data.comments || '';
    
    // Populate Sales Employee field
    const salesEmployeeField = document.getElementById('SalesEmployee');
    const salesEmployeeValue = data.u_BSI_Expressiv_PreparedByName || '';
    salesEmployeeField.value = salesEmployeeValue;
    console.log('Sales Employee from API:', data.u_BSI_Expressiv_PreparedByName);
    console.log('Sales Employee field value:', salesEmployeeField.value);
    console.log('Sales Employee field disabled:', salesEmployeeField.disabled);
    
    // Populate status from approval summary
    const status = getStatusFromInvoice(data);
    document.getElementById('Status').value = status;
    

    
    // Populate approval fields from approval summary - make them editable
    if (data.arInvoiceApprovalSummary) {
        console.log('Approval summary data:', data.arInvoiceApprovalSummary);
        
        // Populate prepared by name (disabled as requested)
        const preparedByNameField = document.getElementById('preparedByName');
        const preparedByNameValue = data.arInvoiceApprovalSummary.preparedByName || '';
        preparedByNameField.value = preparedByNameValue;
        console.log('Prepared by name from API:', data.arInvoiceApprovalSummary.preparedByName);
        console.log('Prepared by name field value:', preparedByNameField.value);
        console.log('Prepared by name field disabled:', preparedByNameField.disabled);
        
        // Populate other approval fields (acknowledge, check, approve, receive)
        document.getElementById('acknowledgeByName').value = data.arInvoiceApprovalSummary.acknowledgedByName || '';
        document.getElementById('checkedByName').value = data.arInvoiceApprovalSummary.checkedByName || '';
        document.getElementById('approvedByName').value = data.arInvoiceApprovalSummary.approvedByName || '';
        document.getElementById('receivedByName').value = data.arInvoiceApprovalSummary.receivedByName || '';
        
        // Update corresponding select elements
        document.getElementById('acknowledgeBy').value = data.arInvoiceApprovalSummary.acknowledgedByName || '';
        document.getElementById('checkedBy').value = data.arInvoiceApprovalSummary.checkedByName || '';
        document.getElementById('approvedBy').value = data.arInvoiceApprovalSummary.approvedByName || '';
        document.getElementById('receivedBy').value = data.arInvoiceApprovalSummary.receivedByName || '';
    } else {
        console.log('No approval summary data found');
    }
    
    // Try to load saved approval data from localStorage
    loadApprovalDataFromLocalStorage();
    
    // Populate totals
    document.getElementById('PriceBefDi').value = data.docTotal - data.vatSum || '0.00';
    document.getElementById('VatSum').value = data.vatSum || '0.00';
    document.getElementById('DocTotal').value = data.docTotal || '0.00';
    
    // Populate table with invoice details
    populateInvoiceDetails(data.arInvoiceDetails || []);
    
    // Enable submit button after data is loaded
    enableSubmitButton();
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
                <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto" maxlength="100" disabled autocomplete="off">${detail.dscription || ''}</textarea>
            </td>
            <td class="p-2 border description-column">
                <textarea class="w-full item-free-txt bg-gray-100 resize-none overflow-auto" maxlength="100" disabled autocomplete="off">${detail.text || ''}</textarea>
            </td>
            <td class="p-2 border sales-employee-column">
                <textarea class="w-full item-sales-employee bg-gray-100 resize-none overflow-auto" maxlength="100" disabled autocomplete="off">${detail.unitMsr || ''}</textarea>
            </td>
            <td class="p-2 border quantity-column">
                <textarea class="quantity-input item-sls-qty bg-gray-100 overflow-auto" maxlength="15" disabled style="resize: none;" autocomplete="off">${detail.quantity || '0'}</textarea>
            </td>
            <td class="p-2 border quantity-column">
                <textarea class="quantity-input item-quantity bg-gray-100 overflow-auto" maxlength="15" disabled style="resize: none;" autocomplete="off">${detail.invQty || '0'}</textarea>
            </td>
            <td class="p-2 border uom-column" style="display: none;">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.uom || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border price-column">
                <textarea class="price-input item-sls-price bg-gray-100 overflow-auto" maxlength="15" disabled style="resize: none;" autocomplete="off">${detail.u_bsi_salprice || '0.00'}</textarea>
            </td>
            <td class="p-2 border price-column">
                <textarea class="price-input item-price bg-gray-100 overflow-auto" maxlength="15" disabled style="resize: none;" autocomplete="off">${detail.priceBefDi || '0.00'}</textarea>
            </td>
            <td class="p-2 border discount-column">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.discount || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border tax-code-column">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.vatgroup || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border line-total-column">
                <textarea class="line-total-input item-line-total bg-gray-100 overflow-auto" maxlength="15" disabled style="resize: none;" autocomplete="off">${detail.lineTotal || '0.00'}</textarea>
            </td>
            <td class="p-2 border account-code-column" style="display: none;">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.acctCode || ''}" disabled autocomplete="off" />
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
    
    // Adjust textarea heights based on content
    adjustTextareaHeights();
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

// Helper function to determine status from invoice data
function getStatusFromInvoice(invoice) {
    // Debug logging for arInvoiceApprovalSummary
    console.log('Invoice arInvoiceApprovalSummary:', invoice.arInvoiceApprovalSummary);
    console.log('Invoice arInvoiceApprovalSummary type:', typeof invoice.arInvoiceApprovalSummary);
    
    // Check if invoice has approval summary - if null, return Draft
    if (invoice.arInvoiceApprovalSummary === null || invoice.arInvoiceApprovalSummary === undefined) {
        console.log('arInvoiceApprovalSummary is null/undefined, returning Draft');
        return 'Draft';
    }
    
    // If arInvoiceApprovalSummary exists, use approvalStatus field first
    if (invoice.arInvoiceApprovalSummary) {
        const summary = invoice.arInvoiceApprovalSummary;
        console.log('arInvoiceApprovalSummary properties:', summary);
        
        // First priority: use approvalStatus field from arInvoiceApprovalSummary
        if (summary.approvalStatus && summary.approvalStatus.trim() !== '') {
            console.log('Using approvalStatus from arInvoiceApprovalSummary:', summary.approvalStatus);
            return summary.approvalStatus;
        }
        
        // Fallback: check individual status flags
        if (summary.isRejected) return 'Rejected';
        if (summary.isApproved) return 'Approved';
        if (summary.isAcknowledged) return 'Acknowledged';
        if (summary.isChecked) return 'Checked';
        if (summary.isReceived) return 'Received';
    }
    
    // Check transfer status
    if (invoice.u_BSI_Expressiv_IsTransfered === 'Y') return 'Received';
    
    // Check if it's a staging document (draft)
    if (invoice.stagingID && invoice.stagingID.startsWith('STG')) return 'Draft';
    
    // Check if document has been transferred (received)
    if (invoice.u_BSI_Expressiv_IsTransfered === 'Y') return 'Received';
    
    // Check if document is in preparation stage
    if (invoice.docNum && invoice.docNum > 0) return 'Prepared';
    
    // Default to Draft for new documents
    return 'Draft';
}



// Save approval data to localStorage
function saveApprovalDataToLocalStorage() {
    if (!invoiceData || !invoiceData.stagingID) return;
    
    const approvalData = {
        stagingID: invoiceData.stagingID,
        acknowledgeByName: document.getElementById('acknowledgeByName').value || '',
        checkedByName: document.getElementById('checkedByName').value || '',
        approvedByName: document.getElementById('approvedByName').value || '',
        receivedByName: document.getElementById('receivedByName').value || '',
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`approval_${invoiceData.stagingID}`, JSON.stringify(approvalData));
    console.log('Approval data saved to localStorage');
    console.log('Saved approval data:', approvalData);
}

// Load approval data from localStorage
function loadApprovalDataFromLocalStorage() {
    if (!invoiceData || !invoiceData.stagingID) return;
    
    const savedData = localStorage.getItem(`approval_${invoiceData.stagingID}`);
    if (savedData) {
        try {
            const approvalData = JSON.parse(savedData);
            
            // Check if data is not too old (within 24 hours)
            const savedTime = new Date(approvalData.timestamp);
            const now = new Date();
            const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                document.getElementById('acknowledgeByName').value = approvalData.acknowledgeByName || '';
                document.getElementById('checkedByName').value = approvalData.checkedByName || '';
                document.getElementById('approvedByName').value = approvalData.approvedByName || '';
                document.getElementById('receivedByName').value = approvalData.receivedByName || '';
                
                console.log('Loaded approval data from localStorage');
                console.log('Approval data details:', approvalData);
            } else {
                // Remove old data
                localStorage.removeItem(`approval_${invoiceData.stagingID}`);
                console.log('Removed old approval data from localStorage (older than 24 hours)');
            }
        } catch (error) {
            console.error('Error loading approval data from localStorage:', error);
        }
    } else {
        console.log('No saved approval data found in localStorage');
    }
}



// Navigation function
function goToMenuARInv() {
    window.location.href = '../pages/menuInvoice.html';
}

// Submit invoice data to API
async function submitInvoiceData() {
    try {
        // Show confirmation dialog first
        const confirmResult = await Swal.fire({
            title: 'Confirm Submission',
            text: 'Are you sure you want to submit this invoice data?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Submit',
            cancelButtonText: 'Cancel'
        });
        
        if (!confirmResult.isConfirmed) {
            return;
        }
        
        // Show loading state
        const submitButton = document.getElementById('submitButton');
        const submitButtonText = document.getElementById('submitButtonText');
        const submitSpinner = document.getElementById('submitSpinner');
        
        submitButton.disabled = true;
        submitButtonText.textContent = 'Submitting...';
        submitSpinner.classList.remove('hidden');
        
        // Get current invoice data
        if (!invoiceData) {
            throw new Error('No invoice data available');
        }
        
        // Validate required fields
        if (!invoiceData.docNum) {
            throw new Error('Invoice number is required');
        }
        
        if (!invoiceData.cardCode) {
            throw new Error('Customer code is required');
        }
        
        if (!invoiceData.cardName) {
            throw new Error('Customer name is required');
        }
        
        // Validate approval data if modified (excluding prepared by as requested)
        const approvalInputs = [
            { id: 'acknowledgeByName', label: 'Acknowledge by' },
            { id: 'checkedByName', label: 'Checked by' },
            { id: 'approvedByName', label: 'Approved by' },
            { id: 'receivedByName', label: 'Received by' }
        ];
        
        for (const input of approvalInputs) {
            const value = document.getElementById(input.id).value.trim();
            if (value && value.length < 2) {
                throw new Error(`${input.label} name must be at least 2 characters long`);
            }
        }
        
        // Get staging ID for the API endpoint
        const stagingID = invoiceData.stagingID;
        if (!stagingID) {
            throw new Error('Staging ID is required for submission');
        }
        
        // Prepare the request payload for PATCH endpoint
        const payload = prepareApprovalPayload();
        
        console.log('Submitting approval data:', payload);
        console.log('API URL:', `${API_BASE_URL}/ar-invoices/approval/${stagingID}`);
        console.log('Request body:', JSON.stringify(payload, null, 2));
        
        // Try different approaches - first try with wrapped data
        let requestBody = { data: payload };
        let success = false;
        let apiResult = null;
        
        // First attempt: wrapped in data property
        try {
            console.log('Attempt 1: Wrapped in data property');
            const response1 = await fetch(`${API_BASE_URL}/ar-invoices/approval/${stagingID}`, {
                method: 'PATCH',
                headers: {
                    'accept': 'text/plain',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (response1.ok) {
                success = true;
                apiResult = await response1.json();
                console.log('Success with wrapped data:', apiResult);
            } else {
                console.log('Attempt 1 failed:', response1.status);
            }
        } catch (error) {
            console.log('Attempt 1 error:', error);
        }
        
        // Second attempt: direct payload
        if (!success) {
            try {
                console.log('Attempt 2: Direct payload');
                const response2 = await fetch(`${API_BASE_URL}/ar-invoices/approval/${stagingID}`, {
                    method: 'PATCH',
                    headers: {
                        'accept': 'text/plain',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response2.ok) {
                    success = true;
                    apiResult = await response2.json();
                    console.log('Success with direct payload:', apiResult);
                } else {
                    console.log('Attempt 2 failed:', response2.status);
                    const errorText = await response2.text();
                    console.error('API Error response:', errorText);
                    throw new Error(`API Error: ${response2.status} - ${errorText}`);
                }
            } catch (error) {
                console.log('Attempt 2 error:', error);
                throw error;
            }
        }
        
        // If both attempts failed, throw error
        if (!success) {
            throw new Error('All API attempts failed');
        }
        
        console.log('API Response:', apiResult);
        console.log('Approval data successfully submitted to API');
        
        // Show success message with details
        const approvalModified = window.approvalDataModified || false;
        const approvalInfo = approvalModified ? '<p><strong>Approval data has been updated successfully</strong></p>' : '';
        
        console.log('Submission completed successfully');
        console.log('Approval data was modified:', approvalModified);
        
        Swal.fire({
            icon: 'success',
            title: 'Invoice Approval Updated Successfully!',
            html: `
                <div class="text-left">
                    <p><strong>Invoice Number:</strong> ${invoiceData.docNum || 'N/A'}</p>
                    <p><strong>Customer:</strong> ${invoiceData.cardName || 'N/A'}</p>
                    <p><strong>Staging ID:</strong> ${stagingID}</p>
                    <p><strong>Approval Status:</strong> ${apiResult.approvalStatus || 'Updated'}</p>
                    ${approvalInfo}
                </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#10b981'
        }).then(() => {
            // Clear localStorage after successful submission
            if (invoiceData && invoiceData.stagingID) {
                localStorage.removeItem(`approval_${invoiceData.stagingID}`);
                console.log('Cleared approval data from localStorage after successful submission');
            }
            
            // Optionally redirect or refresh
            window.location.reload();
        });
        
    } catch (error) {
        console.error('Error submitting invoice data:', error);
        
        // Show error message
        console.log('Submission failed:', error.message);
        Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: error.message || 'Failed to submit invoice data. Please try again.',
            confirmButtonText: 'OK'
        });
    } finally {
        // Reset button state
        const submitButton = document.getElementById('submitButton');
        const submitButtonText = document.getElementById('submitButtonText');
        const submitSpinner = document.getElementById('submitSpinner');
        
        submitButton.disabled = false;
        submitButtonText.textContent = 'Submit Invoice';
        submitSpinner.classList.add('hidden');
    }
}



// Prepare approval payload for PATCH API submission
function prepareApprovalPayload() {
    const now = new Date().toISOString();
    
    // Get current approval values from form inputs
    const preparedByName = document.getElementById('preparedByName').value || '';
    const acknowledgeByName = document.getElementById('acknowledgeByName').value || '';
    const checkedByName = document.getElementById('checkedByName').value || '';
    const approvedByName = document.getElementById('approvedByName').value || '';
    const receivedByName = document.getElementById('receivedByName').value || '';
    
    console.log('Preparing approval payload with values:', {
        preparedByName,
        acknowledgeByName,
        checkedByName,
        approvedByName,
        receivedByName
    });
    
    // Try sending data in the format that matches the API response structure
    const payload = {
        stagingID: invoiceData.stagingID || '',
        createdAt: invoiceData.arInvoiceApprovalSummary?.createdAt || now,
        updatedAt: now,
        approvalStatus: invoiceData.arInvoiceApprovalSummary?.approvalStatus || 'Draft',
        preparedBy: preparedByName,
        checkedBy: checkedByName,
        acknowledgedBy: acknowledgeByName,
        approvedBy: approvedByName,
        receivedBy: receivedByName,
        preparedById: invoiceData.arInvoiceApprovalSummary?.preparedById || '',
        preparedByName: preparedByName,
        checkedById: invoiceData.arInvoiceApprovalSummary?.checkedById || '',
        checkedByName: checkedByName,
        acknowledgedById: invoiceData.arInvoiceApprovalSummary?.acknowledgedById || '',
        acknowledgedByName: acknowledgeByName,
        approvedById: invoiceData.arInvoiceApprovalSummary?.approvedById || '',
        approvedByName: approvedByName,
        receivedById: invoiceData.arInvoiceApprovalSummary?.receivedById || '',
        receivedByName: receivedByName,
        preparedDate: invoiceData.arInvoiceApprovalSummary?.preparedDate || now,
        checkedDate: invoiceData.arInvoiceApprovalSummary?.checkedDate || now,
        acknowledgedDate: invoiceData.arInvoiceApprovalSummary?.acknowledgedDate || now,
        approvedDate: invoiceData.arInvoiceApprovalSummary?.approvedDate || now,
        receivedDate: invoiceData.arInvoiceApprovalSummary?.receivedDate || now,
        rejectedDate: invoiceData.arInvoiceApprovalSummary?.rejectedDate || null,
        rejectionRemarks: invoiceData.arInvoiceApprovalSummary?.rejectionRemarks || '',
        revisionNumber: parseInt(invoiceData.arInvoiceApprovalSummary?.revisionNumber) || 0,
        revisionDate: invoiceData.arInvoiceApprovalSummary?.revisionDate || null,
        revisionRemarks: invoiceData.arInvoiceApprovalSummary?.revisionRemarks || ''
    };
    
    console.log('Prepared approval payload for PATCH submission:', payload);
    return payload;
}

// Prepare invoice payload for API submission (legacy function - kept for reference)
function prepareInvoicePayload(data) {
    const now = new Date().toISOString();
    
    // Get current approval values from form inputs (excluding prepared by as requested)
    const preparedByName = document.getElementById('preparedByName').value || '';
    const acknowledgeByName = document.getElementById('acknowledgeByName').value || '';
    const checkedByName = document.getElementById('checkedByName').value || '';
    const approvedByName = document.getElementById('approvedByName').value || '';
    const receivedByName = document.getElementById('receivedByName').value || '';
    
    console.log('Submitting approval data:', {
        preparedByName,
        acknowledgeByName,
        checkedByName,
        approvedByName,
        receivedByName
    });

    // Prepare invoice details
    const invoiceDetails = (data.arInvoiceDetails || []).map(detail => ({
        lineNum: detail.lineNum || 0,
        visOrder: detail.visOrder || 0,
        itemCode: detail.itemCode || '',
        dscription: detail.dscription || '',
        acctCode: detail.acctCode || '',
        quantity: parseFloat(detail.quantity) || 0,
        invQty: parseFloat(detail.invQty) || 0,
        priceBefDi: parseFloat(detail.priceBefDi) || 0,
        u_bsi_salprice: parseFloat(detail.u_bsi_salprice) || 0,
        u_bsi_source: detail.u_bsi_source || '',
        vatgroup: detail.vatgroup || '',
        wtLiable: detail.wtLiable || '',
        lineTotal: parseFloat(detail.lineTotal) || 0,
        totalFrgn: parseFloat(detail.totalFrgn) || 0,
        lineVat: parseFloat(detail.lineVat) || 0,
        lineVatIF: parseFloat(detail.lineVatIF) || 0,
        ocrCode3: detail.ocrCode3 || '',
        unitMsr: detail.unitMsr || '',
        numPerMsr: parseFloat(detail.numPerMsr) || 0,
        freeTxt: detail.freeTxt || '',
        text: detail.text || '',
        baseType: parseInt(detail.baseType) || 0,
        baseEntry: parseInt(detail.baseEntry) || 0,
        baseRef: detail.baseRef || '',
        baseLine: parseInt(detail.baseLine) || 0,
        cogsOcrCod: detail.cogsOcrCod || '',
        cogsOcrCo2: detail.cogsOcrCo2 || '',
        cogsOcrCo3: detail.cogsOcrCo3 || '',
        docEntrySAP: parseInt(detail.docEntrySAP) || 0
    }));
    
    // Prepare attachments
    const invoiceAttachments = (data.arInvoiceAttachments || []).map(attachment => ({
        fileName: attachment.fileName || '',
        filePath: attachment.filePath || '',
        fileUrl: attachment.fileUrl || '',
        description: attachment.description || ''
    }));
    
    // Prepare approval summary with updated values from form
    const approvalSummary = {
        stagingID: data.arInvoiceApprovalSummary?.stagingID || data.stagingID || '',
        createdAt: data.arInvoiceApprovalSummary?.createdAt || now,
        updatedAt: now,
        approvalStatus: data.arInvoiceApprovalSummary?.approvalStatus || '',
        preparedBy: preparedByName,
        checkedBy: checkedByName,
        acknowledgedBy: acknowledgeByName,
        approvedBy: approvedByName,
        receivedBy: receivedByName,
        preparedDate: data.arInvoiceApprovalSummary?.preparedDate || now,
        checkedDate: data.arInvoiceApprovalSummary?.checkedDate || now,
        acknowledgedDate: data.arInvoiceApprovalSummary?.acknowledgedDate || now,
        approvedDate: data.arInvoiceApprovalSummary?.approvedDate || now,
        receivedDate: data.arInvoiceApprovalSummary?.receivedDate || now,
        rejectedDate: data.arInvoiceApprovalSummary?.rejectedDate || now,
        rejectionRemarks: data.arInvoiceApprovalSummary?.rejectionRemarks || '',
        revisionNumber: parseInt(data.arInvoiceApprovalSummary?.revisionNumber) || 0,
        revisionDate: data.arInvoiceApprovalSummary?.revisionDate || now,
        revisionRemarks: data.arInvoiceApprovalSummary?.revisionRemarks || ''
    };
    
    console.log('Prepared approval summary for submission:', approvalSummary);
    
    // Return the complete payload
    const payload = {
        docNum: parseInt(data.docNum) || 0,
        docType: data.docType || 's',
        docDate: data.docDate || now,
        docDueDate: data.docDueDate || now,
        cardCode: data.cardCode || '',
        cardName: data.cardName || '',
        address: data.address || '',
        numAtCard: data.numAtCard || '',
        comments: data.comments || '',
        u_BSI_Expressiv_PreparedByNIK: data.u_BSI_Expressiv_PreparedByNIK || '',
        u_BSI_Expressiv_PreparedByName: data.u_BSI_Expressiv_PreparedByName || '',
        docCur: data.docCur || 'IDR',
        docRate: parseFloat(data.docRate) || 1,
        vatSum: parseFloat(data.vatSum) || 0,
        vatSumFC: parseFloat(data.vatSumFC) || 0,
        wtSum: parseFloat(data.wtSum) || 0,
        wtSumFC: parseFloat(data.wtSumFC) || 0,
        docTotal: parseFloat(data.docTotal) || 0,
        docTotalFC: parseFloat(data.docTotalFC) || 0,
        trnspCode: parseInt(data.trnspCode) || 0,
        u_BSI_ShippingType: data.u_BSI_ShippingType || '',
        groupNum: parseInt(data.groupNum) || 0,
        u_BSI_PaymentGroup: data.u_BSI_PaymentGroup || '',
        u_bsi_invnum: data.u_bsi_invnum || '',
        u_bsi_udf1: data.u_bsi_udf1 || '',
        u_bsi_udf2: data.u_bsi_udf2 || '',
        trackNo: data.trackNo || '',
        u_BSI_Expressiv_IsTransfered: data.u_BSI_Expressiv_IsTransfered || 'N',
        docEntrySAP: parseInt(data.docEntrySAP) || 0,
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now,
        arInvoiceDetails: invoiceDetails,
        arInvoiceAttachments: invoiceAttachments,
        arInvoiceApprovalSummary: approvalSummary
    };
    
    console.log('Complete payload prepared for submission:', payload);
    return payload;
}

// Enable submit button when data is loaded
function enableSubmitButton() {
    const submitButton = document.getElementById('submitButton');
    if (submitButton) {
        submitButton.disabled = false; // Enable when data is loaded
    }
}

// Add event listeners for approval inputs to track changes
function setupApprovalInputListeners() {
    const approvalInputs = [
        'acknowledgeByName', 
        'checkedByName',
        'approvedByName',
        'receivedByName'
    ];
    
    approvalInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', function() {
                // Mark that approval data has been modified
                window.approvalDataModified = true;
                console.log(`Approval data modified: ${inputId} = ${this.value}`);
                console.log(`Current approval data state:`, {
                    preparedByName: document.getElementById('preparedByName').value,
                    acknowledgeByName: document.getElementById('acknowledgeByName').value,
                    checkedByName: document.getElementById('checkedByName').value,
                    approvedByName: document.getElementById('approvedByName').value,
                    receivedByName: document.getElementById('receivedByName').value
                });
                
                // Save to localStorage as backup
                saveApprovalDataToLocalStorage();
                
                // Show subtle notification that data has been modified
                showApprovalModifiedNotification();
            });
        }
    });
}

// Show notification when approval data is modified
function showApprovalModifiedNotification() {
    // Remove existing notification if any
    const existingNotification = document.getElementById('approvalModifiedNotification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'approvalModifiedNotification';
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    notification.innerHTML = `
        <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Approval data modified</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Reset approval data to original values
function resetApprovalData() {
    if (!invoiceData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice data available to reset'
        });
        return;
    }
    
    // Show confirmation dialog
    Swal.fire({
        title: 'Reset Approval Data',
        text: 'Are you sure you want to reset all approval fields to their original values?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, Reset',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Reset to original values from invoiceData (excluding prepared by as requested)
            if (invoiceData.arInvoiceApprovalSummary) {
                document.getElementById('acknowledgeByName').value = invoiceData.arInvoiceApprovalSummary.acknowledgedBy || '';
                document.getElementById('checkedByName').value = invoiceData.arInvoiceApprovalSummary.checkedBy || '';
                document.getElementById('approvedByName').value = invoiceData.arInvoiceApprovalSummary.approvedBy || '';
                document.getElementById('receivedByName').value = invoiceData.arInvoiceApprovalSummary.receivedBy || '';
                console.log('Reset approval data to original values from API');
            } else {
                // Clear all fields if no approval summary (excluding prepared by)
                document.getElementById('acknowledgeByName').value = '';
                document.getElementById('checkedByName').value = '';
                document.getElementById('approvedByName').value = '';
                document.getElementById('receivedByName').value = '';
                console.log('Cleared all approval fields (no original data available)');
            }
            
            // Reset modification flag
            window.approvalDataModified = false;
            
            // Clear localStorage for this invoice
            if (invoiceData && invoiceData.stagingID) {
                localStorage.removeItem(`approval_${invoiceData.stagingID}`);
                console.log('Cleared approval data from localStorage');
            }
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Reset Successful',
                text: 'Approval data has been reset to original values',
                timer: 2000,
                showConfirmButton: false
            });
        }
    });
}

 

// Load attachments from the main API response data
function loadAttachmentsFromData(attachments) {
    try {
        console.log('Loading attachments from data:', attachments);
        
        // Hide loading indicator
        const attachmentLoading = document.getElementById('attachmentLoading');
        const attachmentList = document.getElementById('attachmentList');
        const noAttachments = document.getElementById('noAttachments');
        
        if (attachmentLoading) {
            attachmentLoading.style.display = 'none';
        }
        if (attachmentList) {
            attachmentList.innerHTML = '';
        }
        if (noAttachments) {
            noAttachments.style.display = 'none';
        }
        
        if (attachments && attachments.length > 0) {
            displayAttachments(attachments);
        } else {
            showNoAttachments();
        }
        
    } catch (error) {
        console.error('Error loading attachments from data:', error);
        showNoAttachments();
    }
}

// Load attachments for the invoice (legacy function for separate API call)


// Display attachments in the UI
function displayAttachments(attachments) {
    const attachmentList = document.getElementById('attachmentList');
    const attachmentLoading = document.getElementById('attachmentLoading');
    const noAttachments = document.getElementById('noAttachments');
    
    if (attachmentLoading) {
        attachmentLoading.style.display = 'none';
    }
    if (noAttachments) {
        noAttachments.style.display = 'none';
    }
    if (attachmentList) {
        attachmentList.innerHTML = '';
        
        attachments.forEach((attachment, index) => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'attachment-item flex items-center justify-between';
            
            const fileIcon = getFileIcon(attachment.fileName);
            const fileName = attachment.fileName || `Attachment ${index + 1}`;
            const fileUrl = attachment.fileUrl || '#';
            const description = attachment.description || '';
            const createdAt = formatDate(attachment.createdAt);
            
            attachmentItem.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="file-icon">${fileIcon}</div>
                    <div class="flex-1 min-w-0">
                        <div class="file-name" title="${fileName}">${fileName}</div>
                        <div class="file-description">${description}</div>
                        <div class="text-xs text-gray-400">Created: ${createdAt}</div>
                    </div>
                </div>
                <div class="attachment-actions">
                    <button onclick="downloadAttachment('${fileUrl}', '${fileName}')" 
                            class="btn-download">
                        Download
                    </button>
                    <button onclick="previewAttachment('${fileUrl}', '${fileName}')" 
                            class="btn-preview">
                        Preview
                    </button>
                </div>
            `;
            
            attachmentList.appendChild(attachmentItem);
        });
    }
}

// Show no attachments message
function showNoAttachments() {
    const attachmentLoading = document.getElementById('attachmentLoading');
    const attachmentList = document.getElementById('attachmentList');
    const noAttachments = document.getElementById('noAttachments');
    
    if (attachmentLoading) {
        attachmentLoading.style.display = 'none';
    }
    if (attachmentList) {
        attachmentList.innerHTML = '';
    }
    if (noAttachments) {
        noAttachments.style.display = 'block';
    }
}

// Get file icon based on file extension
function getFileIcon(fileName) {
    if (!fileName) return '📄';
    
    const extension = fileName.split('.').pop().toLowerCase();
    
    const iconMap = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'xls': '📊',
        'xlsx': '📊',
        'ppt': '📽️',
        'pptx': '📽️',
        'txt': '📄',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🖼️',
        'bmp': '🖼️',
        'zip': '📦',
        'rar': '📦',
        '7z': '📦',
        'mp4': '🎥',
        'avi': '🎥',
        'mov': '🎥',
        'mp3': '🎵',
        'wav': '🎵'
    };
    
    return iconMap[extension] || '📄';
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}





// Adjust textarea heights based on content length
function adjustTextareaHeights() {
    const textareas = document.querySelectorAll('.table-container textarea');
    
    textareas.forEach(textarea => {
        const content = textarea.value || textarea.textContent || '';
        const charLength = content.length;
        
        // Set uniform height for all textareas
        textarea.style.height = '50px';
        textarea.style.minHeight = '50px';
        textarea.style.maxHeight = '50px';
        
        // Add scroll indicator if content is long
        if (charLength > 100) {
            textarea.style.borderRight = '2px solid #3b82f6';
        } else {
            textarea.style.borderRight = '';
        }
        
        // Ensure consistent vertical alignment
        textarea.style.verticalAlign = 'middle';
    });
}