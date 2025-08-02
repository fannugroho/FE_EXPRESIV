// Global variables
let invoiceData = null;
let currentUser = null;
let employeesData = []; // Add this to store employee data

// API Configuration
const API_BASE_URL = 'https://expressiv-be-sb.idsdev.site/api';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Get stagingID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const stagingID = urlParams.get('invoice-id');
    
    // Debug logging
    console.log('URL search params:', window.location.search);
    console.log('All URL params:', Object.fromEntries(urlParams.entries()));
    console.log('Staging ID from URL:', stagingID);
    
    // Populate debug info (with null checks)
    const debugUrlElement = document.getElementById('debugUrl');
    const debugInvoiceIdElement = document.getElementById('debugInvoiceId');
    
    if (debugUrlElement) {
        debugUrlElement.textContent = window.location.href;
    }
    if (debugInvoiceIdElement) {
        debugInvoiceIdElement.textContent = stagingID || 'Not found';
    }
    
    if (stagingID && stagingID.trim() !== '') {
        console.log('Loading invoice data for stagingID:', stagingID.trim());
        loadInvoiceData(stagingID.trim());
    } else {
        console.log('No stagingID found in URL');
        Swal.fire({
            icon: 'warning',
            title: 'No Staging ID Found',
            text: 'Please provide a valid staging ID in the URL parameter.',
            confirmButtonText: 'OK'
        });
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
        option.setAttribute('data-employee-id', employee.kansaiEmployeeId || '');
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
                
                // Store employee ID in a data attribute for later use
                input.setAttribute('data-employee-id', employee.kansaiEmployeeId || '');
                select.setAttribute('data-employee-id', employee.kansaiEmployeeId || '');
                
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
                option.setAttribute('data-employee-id', employee.kansaiEmployeeId || '');
                select.appendChild(option);
            });
            
            // If input has a value, try to find and set the corresponding employee ID
            if (input.value) {
                const selectedEmployee = employeesData.find(emp => emp.fullName === input.value);
                if (selectedEmployee) {
                    input.setAttribute('data-employee-id', selectedEmployee.kansaiEmployeeId || '');
                    select.setAttribute('data-employee-id', selectedEmployee.kansaiEmployeeId || '');
                }
            }
        }
    });
}

// Load invoice data from API using stagingID
async function loadInvoiceData(stagingID) {
    try {
        console.log('loadInvoiceData called with stagingID:', stagingID);
        
        // Construct API URL using stagingID
        const apiUrl = `${API_BASE_URL}/ar-invoices/${stagingID}/details`;
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
                'accept': 'text/plain'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            // Get the response text for better error information
            const errorText = await response.text();
            console.error('API Error response body:', errorText);
            
            let errorMessage = 'Failed to load invoice data';
            
            if (response.status === 404) {
                errorMessage = `Invoice with Staging ID "${stagingID}" not found. Please check if the invoice exists or try a different Staging ID.`;
                console.error('404 Error - Invoice not found:', {
                    stagingID: stagingID,
                    apiUrl: apiUrl,
                    responseText: errorText
                });
            } else if (response.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (response.status === 0) {
                errorMessage = 'Network error. Please check your connection.';
            } else {
                errorMessage = `API Error (${response.status}): ${errorText}`;
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('API response result:', result);
        
        if (result.status && result.data) {
            invoiceData = result.data;
            console.log('Invoice data loaded from API:', invoiceData);
            
            // Populate form with data
            populateFormData(invoiceData);
            
            // Populate invoice service details table - use arInvoiceDetails instead of arInvoiceServiceDetails
            if (invoiceData.arInvoiceDetails && invoiceData.arInvoiceDetails.length > 0) {
                populateInvoiceServiceDetails(invoiceData.arInvoiceDetails);
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
        
        // Close loading indicator
        Swal.close();
        
        // Show error message with more details
        Swal.fire({
            icon: 'error',
            title: 'Error Loading Invoice',
            text: error.message,
            confirmButtonText: 'OK',
            footer: `Staging ID: ${stagingID}<br>API URL: ${API_BASE_URL}/ar-invoices/${stagingID}/details`
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
    document.getElementById('TaxNo').value = data.trackNo || '';
    document.getElementById('U_BSI_ShippingType').value = data.u_BSI_ShippingType || '';
    document.getElementById('U_BSI_PaymentGroup').value = data.u_BSI_PaymentGroup || '';
    document.getElementById('U_BSI_Expressiv_IsTransfered').value = data.u_BSI_Expressiv_IsTransfered || 'N';
    document.getElementById('U_BSI_UDF1').value = data.u_bsi_udf1 || '';
    document.getElementById('U_BSI_UDF2').value = data.u_bsi_udf2 || '';
    document.getElementById('account').value = data.account || '';
    document.getElementById('acctName').value = data.acctName || '';
    document.getElementById('comments').value = data.comments || '';
    
    // Populate status from approval summary
    const status = getStatusFromInvoice(data);
    document.getElementById('Status').value = status;
    
    // Check if submit button should be shown based on status
    updateSubmitButtonVisibility(status);
    
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
        const acknowledgeByNameField = document.getElementById('acknowledgeByName');
        const checkedByNameField = document.getElementById('checkedByName');
        const approvedByNameField = document.getElementById('approvedByName');
        const receivedByNameField = document.getElementById('receivedByName');
        
        acknowledgeByNameField.value = data.arInvoiceApprovalSummary.acknowledgedByName || '';
        checkedByNameField.value = data.arInvoiceApprovalSummary.checkedByName || '';
        approvedByNameField.value = data.arInvoiceApprovalSummary.approvedByName || '';
        receivedByNameField.value = data.arInvoiceApprovalSummary.receivedByName || '';
        
        // Store employee IDs from API data
        acknowledgeByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.acknowledgedBy || '');
        checkedByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.checkedBy || '');
        approvedByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.approvedBy || '');
        receivedByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.receivedBy || '');
        preparedByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.preparedBy || '');
        
        // Update corresponding select elements
        document.getElementById('acknowledgeBy').value = data.arInvoiceApprovalSummary.acknowledgedByName || '';
        document.getElementById('checkedBy').value = data.arInvoiceApprovalSummary.checkedByName || '';
        document.getElementById('approvedBy').value = data.arInvoiceApprovalSummary.approvedByName || '';
        document.getElementById('receivedBy').value = data.arInvoiceApprovalSummary.receivedByName || '';
        
        // Store employee IDs in select elements as well
        document.getElementById('acknowledgeBy').setAttribute('data-employee-id', data.arInvoiceApprovalSummary.acknowledgedBy || '');
        document.getElementById('checkedBy').setAttribute('data-employee-id', data.arInvoiceApprovalSummary.checkedBy || '');
        document.getElementById('approvedBy').setAttribute('data-employee-id', data.arInvoiceApprovalSummary.approvedBy || '');
        document.getElementById('receivedBy').setAttribute('data-employee-id', data.arInvoiceApprovalSummary.receivedBy || '');
        
        console.log('Stored employee IDs from API:', {
            acknowledgedBy: data.arInvoiceApprovalSummary.acknowledgedBy,
            checkedBy: data.arInvoiceApprovalSummary.checkedBy,
            approvedBy: data.arInvoiceApprovalSummary.approvedBy,
            receivedBy: data.arInvoiceApprovalSummary.receivedBy,
            preparedBy: data.arInvoiceApprovalSummary.preparedBy
        });
    } else {
        console.log('No approval summary data found');
    }
    
    // Try to load saved approval data from localStorage
    loadApprovalDataFromLocalStorage();
    
    // Populate totals
    document.getElementById('PriceBefDi').value = data.docTotal - data.vatSum || '0.00';
    document.getElementById('VatSum').value = data.vatSum || '0.00';
    document.getElementById('DocTotal').value = data.docTotal || '0.00';
    
    // Populate table with invoice service details - use arInvoiceDetails instead of arInvoiceServiceDetails
    populateInvoiceServiceDetails(data.arInvoiceDetails || [], data);
    
    // Enable submit button after data is loaded
    enableSubmitButton();
}

// Populate table with invoice service details
function populateInvoiceServiceDetails(details, invoiceData) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    if (details.length === 0) {
                        // Add empty row message
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `
                    <td colspan="8" class="p-4 text-center text-gray-500">
                        No invoice service details found
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
            <td class="p-2 border description-column">
                <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto" maxlength="100" disabled autocomplete="off">${detail.dscription || ''}</textarea>
            </td>
            <td class="p-2 border account-code-column">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.acctCode || ''}" disabled autocomplete="off" />
            </td>
                                <td class="p-2 border account-name-column">
                        <input type="text" class="w-full p-2 border rounded bg-gray-100" value="-" disabled autocomplete="off" />
                    </td>
            <td class="p-2 border tax-code-column">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.vatgroup || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border wtax-liable-column">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.wtLiable || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border total-lc-column">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.lineTotal || '0.00'}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border source-column">
                <input type="text" class="w-full p-2 border rounded bg-gray-100" value="-" disabled autocomplete="off" />
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
        acknowledgeById: document.getElementById('acknowledgeByName').getAttribute('data-employee-id') || '',
        checkedById: document.getElementById('checkedByName').getAttribute('data-employee-id') || '',
        approvedById: document.getElementById('approvedByName').getAttribute('data-employee-id') || '',
        receivedById: document.getElementById('receivedByName').getAttribute('data-employee-id') || '',
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
                const acknowledgeByNameField = document.getElementById('acknowledgeByName');
                const checkedByNameField = document.getElementById('checkedByName');
                const approvedByNameField = document.getElementById('approvedByName');
                const receivedByNameField = document.getElementById('receivedByName');
                
                acknowledgeByNameField.value = approvalData.acknowledgeByName || '';
                checkedByNameField.value = approvalData.checkedByName || '';
                approvedByNameField.value = approvalData.approvedByName || '';
                receivedByNameField.value = approvalData.receivedByName || '';
                
                // Set employee IDs from localStorage
                acknowledgeByNameField.setAttribute('data-employee-id', approvalData.acknowledgeById || '');
                checkedByNameField.setAttribute('data-employee-id', approvalData.checkedById || '');
                approvedByNameField.setAttribute('data-employee-id', approvalData.approvedById || '');
                receivedByNameField.setAttribute('data-employee-id', approvalData.receivedById || '');
                
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

// Submit invoice service data to API
async function submitInvoiceServiceData() {
    try {
        // Show confirmation dialog first
        const confirmResult = await Swal.fire({
            title: 'Confirm Submission',
            text: 'Are you sure you want to submit this invoice service data?',
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
        submitButtonText.textContent = 'Updating Status...';
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
        
        // Debug: Log current invoice data for troubleshooting
        console.log('=== DEBUG: Current Invoice Data ===');
        console.log('Staging ID:', stagingID);
        console.log('Invoice Number:', invoiceData.docNum);
        console.log('Customer Code:', invoiceData.cardCode);
        console.log('Customer Name:', invoiceData.cardName);
        console.log('Current Status:', invoiceData.arInvoiceApprovalSummary?.approvalStatus || 'Draft');
        console.log('Approval Summary:', invoiceData.arInvoiceApprovalSummary);
        console.log('===================================');
        
        // Prepare the request payload for PATCH endpoint
        const payload = prepareApprovalPayload();
        
        console.log('Submitting approval data:', payload);
        console.log('API URL:', `${API_BASE_URL}/ar-invoices/approval/${stagingID}`);
        console.log('Request body:', JSON.stringify(payload, null, 2));
        console.log('Payload keys:', Object.keys(payload));
        console.log('Payload size:', JSON.stringify(payload).length, 'characters');
        
        // Log specific information about preparedDate if it's being sent
        if (payload.preparedDate) {
            console.log('📅 preparedDate included in payload:', payload.preparedDate);
        } else {
            console.log('📅 No preparedDate in payload (status not changing from Draft to Prepared)');
        }
        
        // Try different approaches - first try with PUT method
        let success = false;
        let apiResult = null;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (!success && retryCount <= maxRetries) {
            try {
                console.log(`Attempt ${retryCount + 1} with PATCH method`);
                
                // Modify payload for retry attempts
                let currentPayload = { ...payload };
                
                if (retryCount === 1) {
                    // First retry: Remove employee IDs and use only names
                    console.log('First retry: Using only names without employee IDs');
                    currentPayload = {
                        approvalStatus: payload.approvalStatus,
                        preparedByName: payload.preparedByName,
                        checkedByName: payload.checkedByName,
                        acknowledgedByName: payload.acknowledgedByName,
                        approvedByName: payload.approvedByName,
                        receivedByName: payload.receivedByName,
                        updatedAt: payload.updatedAt
                    };
                    
                    if (payload.preparedDate) {
                        currentPayload.preparedDate = payload.preparedDate;
                    }
                } else if (retryCount === 2) {
                    // Second retry: Minimal payload with only essential fields
                    console.log('Second retry: Using minimal payload');
                    currentPayload = {
                        approvalStatus: payload.approvalStatus,
                        updatedAt: payload.updatedAt
                    };
                    
                    if (payload.preparedDate) {
                        currentPayload.preparedDate = payload.preparedDate;
                    }
                }
                
                console.log('Current payload for attempt:', currentPayload);
                
                const response = await fetch(`${API_BASE_URL}/ar-invoices/approval/${stagingID}`, {
                    method: 'PATCH',
                    headers: {
                        'accept': 'text/plain',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(currentPayload)
                });
                
                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);
                
                if (response.ok) {
                    success = true;
                    apiResult = await response.json();
                    console.log('Success with PATCH method:', apiResult);
                } else {
                    console.log(`PATCH method failed on attempt ${retryCount + 1}:`, response.status);
                    const errorText = await response.text();
                    console.error('API Error response:', errorText);
                    
                    // Try to parse error response as JSON for better error handling
                    let errorDetails = errorText;
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorDetails = errorJson.message || errorJson.error || errorText;
                        console.error('Parsed error details:', errorJson);
                        
                        // Check if it's the specific "Sequence contains more than one element" error
                        if (errorDetails.includes('Sequence contains more than one element')) {
                            console.log('Detected duplicate records error, will retry with different payload');
                            
                            if (retryCount < maxRetries) {
                                retryCount++;
                                console.log(`Retrying with attempt ${retryCount + 1}...`);
                                continue; // Continue to next retry attempt
                            } else {
                                // Show specific error message for duplicate records
                                throw new Error(`Database Error: Multiple approval records found for this invoice. Please contact system administrator to resolve duplicate records for Staging ID: ${stagingID}`);
                            }
                        }
                    } catch (parseError) {
                        console.error('Could not parse error response as JSON:', parseError);
                    }
                    
                    throw new Error(`API Error: ${response.status} - ${errorDetails}`);
                }
            } catch (error) {
                console.log(`PATCH method error on attempt ${retryCount + 1}:`, error);
                
                if (retryCount < maxRetries && error.message.includes('Sequence contains more than one element')) {
                    retryCount++;
                    console.log(`Retrying with attempt ${retryCount + 1}...`);
                    continue; // Continue to next retry attempt
                } else {
                    throw error;
                }
            }
        }
        
        // If all attempts failed, throw error
        if (!success) {
            throw new Error('All API attempts failed. Please try again later or contact system administrator.');
        }
        
        console.log('API Response:', apiResult);
        console.log('Approval data successfully submitted to API');
        
        // Handle file uploads if there are any uploaded files
        if (uploadedFiles.length > 0) {
            try {
                console.log('Uploading', uploadedFiles.length, 'files...');
                
                // Show loading message for file upload
                Swal.fire({
                    title: 'Uploading Attachments',
                    text: 'Please wait while we upload your files...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                // Prepare FormData for file upload
                const formData = new FormData();
                
                // Add all files to formData
                uploadedFiles.forEach(file => {
                    formData.append('files', file);
                    console.log('Adding file for upload:', file.name);
                });
                
                // Upload files to server using the provided API endpoint
                const uploadResponse = await fetch(`${API_BASE_URL}/ar-invoices/${stagingID}/attachments/upload`, {
                    method: 'POST',
                    headers: {
                        'accept': '*/*'
                        // Don't set Content-Type for FormData, let browser set it with boundary
                    },
                    body: formData
                });
                
                console.log('Upload response status:', uploadResponse.status);
                
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    console.log('File upload successful:', uploadResult);
                    
                    // Clear uploaded files after successful upload
                    clearUploadedFiles();
                    
                    // Show success message for file upload
                    Swal.fire({
                        icon: 'success',
                        title: 'Files Uploaded Successfully!',
                        text: `${uploadedFiles.length} file(s) have been uploaded.`,
                        confirmButtonText: 'OK'
                    });
                } else {
                    const uploadError = await uploadResponse.text();
                    console.error('File upload failed:', uploadError);
                    
                    // Try to parse error response as JSON
                    let errorDetails = uploadError;
                    try {
                        const errorJson = JSON.parse(uploadError);
                        errorDetails = errorJson.message || errorJson.error || uploadError;
                    } catch (parseError) {
                        console.error('Could not parse upload error response as JSON:', parseError);
                    }
                    
                    throw new Error(`File upload failed: ${uploadResponse.status} - ${errorDetails}`);
                }
                
            } catch (uploadError) {
                console.error('Error uploading files:', uploadError);
                
                // Show error message for file upload
                Swal.fire({
                    icon: 'error',
                    title: 'File Upload Failed',
                    text: `Failed to upload files: ${uploadError.message}`,
                    confirmButtonText: 'OK'
                });
                
                // Don't throw error here as the approval data was already submitted successfully
            }
        }
        
        // Show success message with details
        const approvalModified = window.approvalDataModified || false;
        const approvalInfo = approvalModified ? '<p><strong>Approval data has been updated successfully</strong></p>' : '';
        
        // Check if approval status was updated from Draft to Prepared
        const originalStatus = invoiceData.arInvoiceApprovalSummary?.approvalStatus || 'Draft';
        const newStatus = apiResult.approvalStatus || 'Updated';
        const isStatusChangedFromDraftToPrepared = originalStatus === 'Draft' && newStatus === 'Prepared';
        const statusChangeInfo = isStatusChangedFromDraftToPrepared 
            ? '<p><strong>✅ Approval Status Updated:</strong> Draft → Prepared</p>' 
            : '';
        
        // Add preparedDate info when status changes from Draft to Prepared
        const preparedDateInfo = isStatusChangedFromDraftToPrepared 
            ? '<p><strong>📅 Prepared Date Set:</strong> Current timestamp has been recorded</p>' 
            : '';
        
        console.log('Submission completed successfully');
        console.log('Approval data was modified:', approvalModified);
        console.log('Status change:', originalStatus, '→', newStatus);
        
        Swal.fire({
            icon: 'success',
            title: 'Invoice Service Approval Updated Successfully!',
            html: `
                <div class="text-left">
                    <p><strong>Invoice Number:</strong> ${invoiceData.docNum || 'N/A'}</p>
                    <p><strong>Customer:</strong> ${invoiceData.cardName || 'N/A'}</p>
                    <p><strong>Staging ID:</strong> ${stagingID}</p>
                    <p><strong>Current Approval Status:</strong> ${newStatus}</p>
                    ${statusChangeInfo}
                    ${preparedDateInfo}
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
        console.error('Error submitting invoice service data:', error);
        
        // Show error message with specific handling for duplicate records
        let errorMessage = error.message;
        let errorTitle = 'Submission Failed';
        
        if (error.message.includes('Sequence contains more than one element')) {
            errorTitle = 'Database Error - Duplicate Records';
            errorMessage = `Multiple approval records found for this invoice. This is a system issue that needs to be resolved by the administrator. Please contact support with Staging ID: ${invoiceData?.stagingID || 'Unknown'}`;
        } else if (error.message.includes('Database Error')) {
            errorTitle = 'Database Error';
            errorMessage = error.message;
        }
        
        console.log('Submission failed:', errorMessage);
        
        // Show detailed error information with troubleshooting options
        const errorDetails = `
            <div class="text-left">
                <div class="mb-4">
                    <h4 class="font-semibold text-red-600 mb-2">Error Details:</h4>
                    <p class="text-sm bg-red-50 p-3 rounded border-l-4 border-red-400">
                        ${errorMessage}
                    </p>
                </div>
                
                <div class="mb-4">
                    <h4 class="font-semibold text-blue-600 mb-2">Invoice Information:</h4>
                    <ul class="text-sm space-y-1">
                        <li><strong>Staging ID:</strong> ${invoiceData?.stagingID || 'N/A'}</li>
                        <li><strong>Invoice Number:</strong> ${invoiceData?.docNum || 'N/A'}</li>
                        <li><strong>Customer:</strong> ${invoiceData?.cardName || 'N/A'}</li>
                        <li><strong>Current Status:</strong> ${invoiceData?.arInvoiceApprovalSummary?.approvalStatus || 'Draft'}</li>
                    </ul>
                </div>
                
                ${error.message.includes('Sequence contains more than one element') ? `
                <div class="mb-4">
                    <h4 class="font-semibold text-yellow-600 mb-2">⚠️ Troubleshooting Steps:</h4>
                    <ol class="text-sm space-y-1 list-decimal list-inside">
                        <li>Contact system administrator with Staging ID: <strong>${invoiceData?.stagingID || 'Unknown'}</strong></li>
                        <li>Inform them about the "Sequence contains more than one element" error</li>
                        <li>Request them to check for duplicate approval records in the database</li>
                        <li>Ask them to clean up duplicate records for this invoice</li>
                        <li>Try submitting again after the database is cleaned</li>
                    </ol>
                </div>
                ` : ''}
                
                <div class="mt-4 p-3 bg-gray-50 rounded">
                    <h4 class="font-semibold text-gray-700 mb-2">📋 Additional Information:</h4>
                    <p class="text-xs text-gray-600">
                        • Error occurred at: ${new Date().toLocaleString()}<br>
                        • API Endpoint: ${API_BASE_URL}/ar-invoices/approval/${invoiceData?.stagingID || 'N/A'}<br>
                        • Browser: ${navigator.userAgent}<br>
                        • Check browser console (F12) for detailed logs
                    </p>
                </div>
            </div>
        `;
        
        Swal.fire({
            icon: 'error',
            title: errorTitle,
            html: errorDetails,
            width: '600px',
            confirmButtonText: 'OK',
            showCloseButton: true,
            customClass: {
                container: 'error-modal-container'
            },
            footer: error.message.includes('Sequence contains more than one element') ? 
                'This error indicates duplicate records in the database. Please contact system administrator.' : ''
        });
    } finally {
        // Reset button state
        const submitButton = document.getElementById('submitButton');
        const submitButtonText = document.getElementById('submitButtonText');
        const submitSpinner = document.getElementById('submitSpinner');
        
        submitButton.disabled = false;
        submitButtonText.textContent = 'Submit & Update Status';
        submitSpinner.classList.add('hidden');
    }
}

// Prepare approval payload for PATCH API submission
function prepareApprovalPayload() {
    const now = new Date().toISOString();
    
    // Get current approval values from form inputs and their corresponding employee IDs
    const preparedByName = document.getElementById('preparedByName').value || '';
    const acknowledgeByName = document.getElementById('acknowledgeByName').value || '';
    const checkedByName = document.getElementById('checkedByName').value || '';
    const approvedByName = document.getElementById('approvedByName').value || '';
    const receivedByName = document.getElementById('receivedByName').value || '';
    
    // Get employee IDs from data attributes
    const preparedByElement = document.getElementById('preparedByName');
    const acknowledgeByElement = document.getElementById('acknowledgeByName');
    const checkedByElement = document.getElementById('checkedByName');
    const approvedByElement = document.getElementById('approvedByName');
    const receivedByElement = document.getElementById('receivedByName');
    
    const preparedById = preparedByElement ? preparedByElement.getAttribute('data-employee-id') || '' : '';
    const acknowledgedById = acknowledgeByElement ? acknowledgeByElement.getAttribute('data-employee-id') || '' : '';
    const checkedById = checkedByElement ? checkedByElement.getAttribute('data-employee-id') || '' : '';
    const approvedById = approvedByElement ? approvedByElement.getAttribute('data-employee-id') || '' : '';
    const receivedById = receivedByElement ? receivedByElement.getAttribute('data-employee-id') || '' : '';
    
    console.log('Preparing approval payload with values:', {
        preparedByName,
        acknowledgeByName,
        checkedByName,
        approvedByName,
        receivedByName,
        preparedById,
        acknowledgedById,
        checkedById,
        approvedById,
        receivedById
    });
    
    // Determine the new approval status
    // If current status is "Draft", automatically change to "Prepared" when submitting
    let newApprovalStatus = invoiceData.arInvoiceApprovalSummary?.approvalStatus || 'Draft';
    const isStatusChangingFromDraftToPrepared = newApprovalStatus === 'Draft';
    
    if (isStatusChangingFromDraftToPrepared) {
        newApprovalStatus = 'Prepared';
        console.log('Approval status automatically updated from Draft to Prepared');
    }
    
    // Try sending data in the format that matches the API response structure
    const payload = {
        // Remove stagingID from payload since it's already in the URL path
        // stagingID: invoiceData.stagingID || '',
        approvalStatus: newApprovalStatus, // Use the updated approval status
        preparedBy: preparedById, // Use employee ID instead of name
        checkedBy: checkedById, // Use employee ID instead of name
        acknowledgedBy: acknowledgedById, // Use employee ID instead of name
        approvedBy: approvedById, // Use employee ID instead of name
        receivedBy: receivedById, // Use employee ID instead of name
        preparedByName: preparedByName,
        checkedByName: checkedByName,
        acknowledgedByName: acknowledgeByName,
        approvedByName: approvedByName,
        receivedByName: receivedByName,
        updatedAt: now
    };
    
    // Add preparedDate when status changes from Draft to Prepared
    if (isStatusChangingFromDraftToPrepared) {
        payload.preparedDate = now;
        console.log('Added preparedDate to payload:', now);
    }
    
    console.log('Prepared simplified approval payload for submission:', payload);
    console.log('Approval status updated to:', newApprovalStatus);
    return payload;
} 

// Enable submit button when data is loaded (only for Draft status)
function enableSubmitButton() {
    // Get current status from the Status field
    const statusField = document.getElementById('Status');
    const currentStatus = statusField ? statusField.value : '';
    
    // Use the helper function to update visibility
    updateSubmitButtonVisibility(currentStatus);
}

// Helper function to manage submit button and status message visibility
function updateSubmitButtonVisibility(status) {
    const submitButton = document.getElementById('submitButton');
    const submitButtonContainer = submitButton ? submitButton.closest('.text-center') : null;
    
    if (submitButton && submitButtonContainer) {
        if (status === 'Draft') {
            // Show submit button for Draft status
            submitButtonContainer.style.display = 'block';
            submitButton.disabled = false;
            console.log('Submit button shown for Draft status');
        } else {
            // Hide submit button for non-Draft status
            submitButtonContainer.style.display = 'none';
            submitButton.disabled = true;
            console.log(`Submit button hidden for status: ${status}`);
        }
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
                
                // Try to find and update employee ID based on entered name
                if (this.value.trim()) {
                    const selectedEmployee = employeesData.find(emp => 
                        emp.fullName.toLowerCase() === this.value.toLowerCase()
                    );
                    
                    if (selectedEmployee) {
                        this.setAttribute('data-employee-id', selectedEmployee.kansaiEmployeeId || '');
                        console.log(`Updated employee ID for ${inputId}: ${selectedEmployee.kansaiEmployeeId}`);
                    } else {
                        // Clear employee ID if no match found
                        this.setAttribute('data-employee-id', '');
                        console.log(`No employee found for name: ${this.value}`);
                    }
                } else {
                    // Clear employee ID if input is empty
                    this.setAttribute('data-employee-id', '');
                }
                
                console.log(`Current approval data state:`, {
                    preparedByName: document.getElementById('preparedByName').value,
                    acknowledgeByName: document.getElementById('acknowledgeByName').value,
                    checkedByName: document.getElementById('checkedByName').value,
                    approvedByName: document.getElementById('approvedByName').value,
                    receivedByName: document.getElementById('receivedByName').value,
                    acknowledgeById: document.getElementById('acknowledgeByName').getAttribute('data-employee-id'),
                    checkedById: document.getElementById('checkedByName').getAttribute('data-employee-id'),
                    approvedById: document.getElementById('approvedByName').getAttribute('data-employee-id'),
                    receivedById: document.getElementById('receivedByName').getAttribute('data-employee-id')
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
        'docx': '��',
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

// File upload functionality
let uploadedFiles = [];

// Function to handle file selection and validation
function previewPDF(event) {
    const files = event.target.files;
    
    // Validate all files are PDF
    const pdfFiles = Array.from(files).filter(file => {
        if (file.type !== 'application/pdf') {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File Type',
                text: `File "${file.name}" is not a PDF. Only PDF files are allowed.`
            });
            return false;
        }
        return true;
    });

    // Add valid PDF files to the uploaded files array
    pdfFiles.forEach(file => {
        // Check if file with same name already exists
        const fileExists = uploadedFiles.some(existingFile => 
            existingFile.name === file.name && 
            existingFile.size === file.size
        );
        
        // Only add if it doesn't exist
        if (!fileExists) {
            uploadedFiles.push(file);
        }
    });

    displayFileList();
    
    // Clear the file input
    event.target.value = '';
}

// Function to display the list of selected files
function displayFileList() {
    const fileListContainer = document.getElementById("fileList");
    
    if (!fileListContainer) {
        console.error('File list container not found');
        return;
    }
    
    // Clear existing content
    fileListContainer.innerHTML = "";
    
    // Add each file to the list
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement("div");
        fileItem.className = "file-item";
        fileItem.innerHTML = `
            <div class="file-item-header">
                <div class="flex items-center flex-1">
                    <span class="text-sm text-gray-600 mr-2">📄</span>
                    <span class="file-item-name">${file.name}</span>
                    <span class="file-item-size">(${formatFileSize(file.size)})</span>
                </div>
                <div class="file-item-actions">
                    <button type="button" onclick="viewFile(${index})" class="btn-view">
                        View
                    </button>
                    <button type="button" onclick="removeFile(${index})" class="btn-remove">
                        Remove
                    </button>
                </div>
            </div>
        `;
        fileListContainer.appendChild(fileItem);
    });
}

// Function to view a file in a modal
function viewFile(index) {
    const file = uploadedFiles[index];
    if (!file) return;
    
    // Create URL for the file
    const fileURL = URL.createObjectURL(file);
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.id = 'pdfViewerModal';
    
    // Create modal content
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-4/5 h-4/5 flex flex-col">
            <div class="flex justify-between items-center p-4 border-b">
                <h3 class="text-lg font-semibold">${file.name}</h3>
                <button type="button" class="text-gray-500 hover:text-gray-700" onclick="closeModal()">
                    <span class="text-2xl">&times;</span>
                </button>
            </div>
            <div class="flex-grow p-4 overflow-auto">
                <iframe src="${fileURL}" class="w-full h-full" frameborder="0"></iframe>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById('pdfViewerModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Function to remove a file from the list
function removeFile(index) {
    if (index >= 0 && index < uploadedFiles.length) {
        uploadedFiles.splice(index, 1);
        displayFileList();
    }
}

// Function to get uploaded files for submission
function getUploadedFiles() {
    return uploadedFiles;
}

// Function to clear uploaded files
function clearUploadedFiles() {
    uploadedFiles = [];
    displayFileList();
}

// Function to download an attachment
function downloadAttachment(fileUrl, fileName) {
    try {
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Download initiated for:', fileName);
    } catch (error) {
        console.error('Error downloading file:', error);
        Swal.fire({
            icon: 'error',
            title: 'Download Failed',
            text: 'Failed to download the file. Please try again.',
            confirmButtonText: 'OK'
        });
    }
}

// Function to preview an attachment
function previewAttachment(fileUrl, fileName) {
    try {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
        modal.id = 'attachmentViewerModal';
        
        // Create modal content
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-4/5 h-4/5 flex flex-col">
                <div class="flex justify-between items-center p-4 border-b">
                    <h3 class="text-lg font-semibold">${fileName}</h3>
                    <button type="button" class="text-gray-500 hover:text-gray-700" onclick="closeAttachmentModal()">
                        <span class="text-2xl">&times;</span>
                    </button>
                </div>
                <div class="flex-grow p-4 overflow-auto">
                    <iframe src="${fileUrl}" class="w-full h-full" frameborder="0"></iframe>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAttachmentModal();
            }
        });
        
        console.log('Preview opened for:', fileName);
    } catch (error) {
        console.error('Error previewing file:', error);
        Swal.fire({
            icon: 'error',
            title: 'Preview Failed',
            text: 'Failed to preview the file. Please try again.',
            confirmButtonText: 'OK'
        });
    }
}

// Function to close the attachment modal
function closeAttachmentModal() {
    const modal = document.getElementById('attachmentViewerModal');
    if (modal) {
        document.body.removeChild(modal);
    }
} 

// Function to show debug information for troubleshooting
function showDebugInfo() {
    if (!invoiceData) {
        Swal.fire({
            icon: 'warning',
            title: 'No Data Available',
            text: 'Invoice data has not been loaded yet.',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    const stagingID = invoiceData.stagingID || 'N/A';
    const docNum = invoiceData.docNum || 'N/A';
    const cardCode = invoiceData.cardCode || 'N/A';
    const cardName = invoiceData.cardName || 'N/A';
    const currentStatus = invoiceData.arInvoiceApprovalSummary?.approvalStatus || 'Draft';
    const approvalSummary = invoiceData.arInvoiceApprovalSummary;
    
    // Get current form values
    const preparedByName = document.getElementById('preparedByName')?.value || '';
    const acknowledgeByName = document.getElementById('acknowledgeByName')?.value || '';
    const checkedByName = document.getElementById('checkedByName')?.value || '';
    const approvedByName = document.getElementById('approvedByName')?.value || '';
    const receivedByName = document.getElementById('receivedByName')?.value || '';
    
    // Get employee IDs
    const preparedById = document.getElementById('preparedByName')?.getAttribute('data-employee-id') || '';
    const acknowledgeById = document.getElementById('acknowledgeByName')?.getAttribute('data-employee-id') || '';
    const checkedById = document.getElementById('checkedByName')?.getAttribute('data-employee-id') || '';
    const approvedById = document.getElementById('approvedByName')?.getAttribute('data-employee-id') || '';
    const receivedById = document.getElementById('receivedByName')?.getAttribute('data-employee-id') || '';
    
    // Check if approval data has been modified
    const approvalModified = window.approvalDataModified || false;
    
    // Get localStorage data
    const localStorageKey = `approval_${stagingID}`;
    const savedData = localStorage.getItem(localStorageKey);
    const hasLocalStorageData = savedData ? 'Yes' : 'No';
    
    const debugInfo = `
        <div class="text-left text-sm">
            <h3 class="font-bold text-lg mb-3 text-blue-600">🔧 Debug Information</h3>
            
            <div class="grid grid-cols-1 gap-4">
                <div class="bg-gray-50 p-3 rounded">
                    <h4 class="font-semibold text-blue-800 mb-2">📋 Invoice Information</h4>
                    <p><strong>Staging ID:</strong> ${stagingID}</p>
                    <p><strong>Invoice Number:</strong> ${docNum}</p>
                    <p><strong>Customer Code:</strong> ${cardCode}</p>
                    <p><strong>Customer Name:</strong> ${cardName}</p>
                    <p><strong>Current Status:</strong> ${currentStatus}</p>
                </div>
                
                <div class="bg-gray-50 p-3 rounded">
                    <h4 class="font-semibold text-green-800 mb-2">👥 Approval Information</h4>
                    <p><strong>Prepared By:</strong> ${preparedByName} (ID: ${preparedById || 'N/A'})</p>
                    <p><strong>Acknowledge By:</strong> ${acknowledgeByName} (ID: ${acknowledgeById || 'N/A'})</p>
                    <p><strong>Checked By:</strong> ${checkedByName} (ID: ${checkedById || 'N/A'})</p>
                    <p><strong>Approved By:</strong> ${approvedByName} (ID: ${approvedById || 'N/A'})</p>
                    <p><strong>Received By:</strong> ${receivedByName} (ID: ${receivedById || 'N/A'})</p>
                    <p><strong>Data Modified:</strong> ${approvalModified ? 'Yes' : 'No'}</p>
                </div>
                
                <div class="bg-gray-50 p-3 rounded">
                    <h4 class="font-semibold text-purple-800 mb-2">💾 Storage Information</h4>
                    <p><strong>LocalStorage Key:</strong> ${localStorageKey}</p>
                    <p><strong>Has Saved Data:</strong> ${hasLocalStorageData}</p>
                    <p><strong>API Base URL:</strong> ${API_BASE_URL}</p>
                </div>
                
                <div class="bg-gray-50 p-3 rounded">
                    <h4 class="font-semibold text-orange-800 mb-2">📊 API Data</h4>
                    <p><strong>Approval Summary:</strong> ${approvalSummary ? 'Available' : 'Not Available'}</p>
                    <p><strong>Invoice Details Count:</strong> ${invoiceData.arInvoiceDetails?.length || 0}</p>
                    <p><strong>Attachments Count:</strong> ${invoiceData.arInvoiceAttachments?.length || 0}</p>
                </div>
            </div>
            
            <div class="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                <h4 class="font-semibold text-yellow-800 mb-2">⚠️ Troubleshooting Tips</h4>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>If you see "Sequence contains more than one element" error, it means there are duplicate approval records in the database.</li>
                    <li>Contact system administrator with the Staging ID: <strong>${stagingID}</strong></li>
                    <li>The system will automatically retry with different payload formats.</li>
                    <li>Check browser console for detailed error logs.</li>
                </ul>
            </div>
        </div>
    `;
    
    Swal.fire({
        title: 'Debug Information',
        html: debugInfo,
        width: '800px',
        confirmButtonText: 'Close',
        confirmButtonColor: '#6b7280',
        showCloseButton: true,
        customClass: {
            container: 'debug-modal-container'
        }
    });
} 

 