// Global variables
let invoiceData = null;
let currentUser = null;
let employeesData = []; // Add this to store employee data

// File upload variables
let uploadedFiles = [];

// API Configuration
const API_BASE_URL = `${BASE_URL}/api`;

/*
 * DOCUMENT EDITABILITY CONTROL
 * 
 * This page implements status-based form editing restrictions:
 * - Only documents with status "Draft" can be edited
 * - All other statuses (Prepared, Checked, Acknowledged, Approved, Received, Rejected) are read-only
 * 
 * Features implemented:
 * 1. Form fields (approval section, remarks) are disabled for non-Draft status
 * 2. File upload is prevented for non-Draft status
 * 3. Employee dropdown search is disabled for non-Draft status
 * 4. Table editing (if any) is restricted for non-Draft status
 * 5. Visual indicator shows read-only status with color-coded badges
 * 6. User warnings when attempting to edit non-Draft documents
 *
 * Status color coding:
 * - Draft: No indicator (fully editable)
 * - Prepared: Blue badge
 * - Checked: Yellow badge
 * - Acknowledged: Purple badge
 * - Approved: Green badge
 * - Received: Emerald badge
 * - Rejected: Red badge
 */

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Get invoice ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('invoice-id') || urlParams.get('id'); // Try both parameter names
    
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
    
    // Try to resolve current user (if auth is enabled)
    try {
        if (typeof window.getCurrentUser === 'function') {
            currentUser = window.getCurrentUser();
            console.log('Resolved currentUser:', currentUser);
        }
    } catch (e) {
        console.warn('Unable to resolve currentUser (auth may be disabled).');
    }

    // Load employee data for approval dropdowns
    loadEmployeesData();
    
    // Setup approval input listeners
    setupApprovalInputListeners();
    
    // Setup other form field listeners
    setupOtherFieldListeners();
    
    // Initialize action buttons visibility based on status once data is loaded
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
            if (response.status === 404) {
                console.warn('Employees API endpoint not found (404) - continuing without employee data');
                return;
            }
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
        // Just log the error and continue
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
        // Check if document is editable
        const statusField = document.getElementById('Status');
        const currentStatus = statusField ? statusField.value : '';
        
        if (currentStatus !== 'Draft') {
            // If not Draft, hide dropdown and don't filter
            dropdown.classList.add('hidden');
            return;
        }
        
        const searchTerm = this.value.toLowerCase();
        const filteredEmployees = employeesData.filter(employee => 
            employee.fullName.toLowerCase().includes(searchTerm)
        );
    
        displayEmployeeDropdown(dropdown, filteredEmployees, input, select);
    });
    
    input.addEventListener('focus', function() {
        // Check if document is editable
        const statusField = document.getElementById('Status');
        const currentStatus = statusField ? statusField.value : '';
        
        if (currentStatus !== 'Draft') {
            // If not Draft, hide dropdown and don't filter
            dropdown.classList.add('hidden');
            return;
        }
        
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
            console.log('Invoice data structure:', invoiceData);
            console.log('arInvoiceAttachments from API:', invoiceData.arInvoiceAttachments);
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
            console.warn('Invoice not found (404) - this might be expected for new invoices');
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network error. Please check your connection.';
        } else {
            errorMessage = `Failed to load invoice data: ${error.message}`;
        }
        
        // Close loading indicator if it's still open
        if (Swal.isVisible()) {
            Swal.close();
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
    
    // Helper function to safely set element value
    function safeSetValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        } else {
            console.warn(`Element with id '${elementId}' not found`);
        }
    }
    
    // Helper function to safely set element attribute
    function safeSetAttribute(elementId, attribute, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.setAttribute(attribute, value);
        } else {
            console.warn(`Element with id '${elementId}' not found`);
        }
    }
    
    // Populate header fields
    safeSetValue('DocEntry', data.stagingID || '');
    safeSetValue('DocNum', data.docNum || '');
    safeSetValue('CardCode', data.cardCode || '');
    safeSetValue('CardName', data.cardName || '');
    safeSetValue('address', data.address || '');
    safeSetValue('NumAtCard', data.numAtCard || '');
    safeSetValue('DocCur', data.docCur || 'IDR');
    safeSetValue('docRate', data.docRate || '1');
    safeSetValue('DocDate', formatDate(data.docDate));
    safeSetValue('DocDueDate', formatDate(data.docDueDate));
    safeSetValue('GroupNum', data.groupNum || '1');
    safeSetValue('TrnspCode', data.trnspCode || '1');
    safeSetValue('TaxNo', data.licTradNum || '');
    safeSetValue('U_BSI_ShippingType', data.u_BSI_ShippingType || '');
    safeSetValue('U_BSI_PaymentGroup', data.u_BSI_PaymentGroup || '');
    safeSetValue('U_BSI_Expressiv_IsTransfered', data.u_BSI_Expressiv_IsTransfered || 'N');
    safeSetValue('U_BSI_UDF1', data.u_bsi_udf1 || '');
    safeSetValue('U_BSI_UDF2', data.u_bsi_udf2 || '');
    safeSetValue('account', data.account || '');
    safeSetValue('acctName', data.acctName || '');
    safeSetValue('comments', data.comments || '');
    

    
    // Populate status from approval summary
    const status = getStatusFromInvoice(data);
    safeSetValue('Status', status);
    
    // Check if submit button should be shown based on status
    updateSubmitAndRejectVisibility(status);

    
    // Populate approval fields from approval summary - make them editable
    if (data.arInvoiceApprovalSummary) {
        console.log('Approval summary data:', data.arInvoiceApprovalSummary);
        
        // Populate prepared by name (disabled as requested)
        const preparedByNameField = document.getElementById('preparedByName');
        if (preparedByNameField) {
            const preparedByNameValue = data.arInvoiceApprovalSummary.preparedByName || '';
            preparedByNameField.value = preparedByNameValue;
            console.log('Prepared by name from API:', data.arInvoiceApprovalSummary.preparedByName);
            console.log('Prepared by name field value:', preparedByNameField.value);
            console.log('Prepared by name field disabled:', preparedByNameField.disabled);
        } else {
            console.warn('Element with id "preparedByName" not found');
        }
        
        // Populate other approval fields (acknowledge, check, approve, receive)
        const acknowledgeByNameField = document.getElementById('acknowledgeByName');
        const checkedByNameField = document.getElementById('checkedByName');
        const approvedByNameField = document.getElementById('approvedByName');
        const receivedByNameField = document.getElementById('receivedByName');
        
        if (acknowledgeByNameField) {
            acknowledgeByNameField.value = data.arInvoiceApprovalSummary.acknowledgedByName || '';
        }
        if (checkedByNameField) {
            checkedByNameField.value = data.arInvoiceApprovalSummary.checkedByName || '';
        }
        if (approvedByNameField) {
            approvedByNameField.value = data.arInvoiceApprovalSummary.approvedByName || '';
        }
        if (receivedByNameField) {
            receivedByNameField.value = data.arInvoiceApprovalSummary.receivedByName || '';
        }
        
        // Store employee IDs from API data
        if (acknowledgeByNameField) {
            acknowledgeByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.acknowledgedBy || '');
        }
        if (checkedByNameField) {
            checkedByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.checkedBy || '');
        }
        if (approvedByNameField) {
            approvedByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.approvedBy || '');
        }
        if (receivedByNameField) {
            receivedByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.receivedBy || '');
        }
        if (preparedByNameField) {
            preparedByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.preparedBy || '');
        }
        
        // Update corresponding select elements
        safeSetValue('acknowledgeBy', data.arInvoiceApprovalSummary.acknowledgedByName || '');
        safeSetValue('checkedBy', data.arInvoiceApprovalSummary.checkedByName || '');
        safeSetValue('approvedBy', data.arInvoiceApprovalSummary.approvedByName || '');
        safeSetValue('receivedBy', data.arInvoiceApprovalSummary.receivedByName || '');
        
        // Store employee IDs in select elements as well
        safeSetAttribute('acknowledgeBy', 'data-employee-id', data.arInvoiceApprovalSummary.acknowledgedBy || '');
        safeSetAttribute('checkedBy', 'data-employee-id', data.arInvoiceApprovalSummary.checkedBy || '');
        safeSetAttribute('approvedBy', 'data-employee-id', data.arInvoiceApprovalSummary.approvedBy || '');
        safeSetAttribute('receivedBy', 'data-employee-id', data.arInvoiceApprovalSummary.receivedBy || '');
        
        console.log('Stored employee IDs from API:', {
            acknowledgedBy: data.arInvoiceApprovalSummary.acknowledgedBy,
            checkedBy: data.arInvoiceApprovalSummary.checkedBy,
            approvedBy: data.arInvoiceApprovalSummary.approvedBy,
            receivedBy: data.arInvoiceApprovalSummary.receivedBy,
            preparedBy: data.arInvoiceApprovalSummary.preparedBy
        });
        
        // Handle rejection remarks if status is Rejected
        if (data.arInvoiceApprovalSummary.approvalStatus === 'Rejected' && data.arInvoiceApprovalSummary.rejectionRemarks) {
            const rejectionSection = document.getElementById('rejectionRemarksSection');
            const rejectionTextarea = document.getElementById('rejectionRemarks');
            
            if (rejectionSection && rejectionTextarea) {
                rejectionSection.style.display = 'block';
                rejectionTextarea.value = data.arInvoiceApprovalSummary.rejectionRemarks;
                console.log('Rejection remarks displayed:', data.arInvoiceApprovalSummary.rejectionRemarks);
            } else {
                console.warn('Rejection remarks section elements not found');
            }
        } else {
            // Hide the rejection remarks section if status is not Rejected
            const rejectionSection = document.getElementById('rejectionRemarksSection');
            if (rejectionSection) {
                rejectionSection.style.display = 'none';
            }
        }
    } else {
        console.log('No approval summary data found');
    }
    
    // Try to load saved approval data from localStorage
    loadApprovalDataFromLocalStorage();
    
    // Get currency code
    const currencyCode = data.docCur || 'IDR';
    
    // Populate totals with correct API field mapping
    console.log('💰 Populating financial summary with API fields:', {
        docCur: data.docCur,
        netPrice: data.netPrice,
        discSum: data.discSum,
        netPriceAfterDiscount: data.netPriceAfterDiscount,
        docTax: data.docTax,
        vatSum: data.docTax,
        grandTotal: data.grandTotal
    });
    
    // 1. Total (totalAmount) - API Field: "docCur" "netPrice"
    safeSetValue('docTotal', `${currencyCode} ${formatCurrencyIDR(data.netPrice || '0.00')}`);
    
    // 2. Discounted (discountAmount) - API Field: "docCur" "discSum"
    safeSetValue('discSum', `${currencyCode} ${formatCurrencyIDR(data.discSum || '0.00')}`);
    
    // 3. Sales Amount (salesAmount) - API Field: "docCur" "netPriceAfterDiscount"
    safeSetValue('netPriceAfterDiscount', `${currencyCode} ${formatCurrencyIDR(data.netPriceAfterDiscount || '0.00')}`);
    
            // 4. Tax Base Other Value (taxBase) - API Field: "dpp1112"
        safeSetValue('dpp1112', `${currencyCode} ${formatCurrencyIDR(data.dpp1112 || '0.00')}`);
    
    // 5. VAT 12% (vatAmount) - API Field: "docCur" "docTax"
    safeSetValue('vatSum', `${currencyCode} ${formatCurrencyIDR(data.docTax || '0.00')}`);
    
    // 6. GRAND TOTAL (grandTotal) - API Field: "docCur" "grandTotal"
    safeSetValue('grandTotal', `${currencyCode} ${formatCurrencyIDR(data.grandTotal || '0.00')}`);
    
    // Populate table with invoice details
    populateInvoiceDetails(data.arInvoiceDetails || []);
    
    // Enable submit button after data is loaded
    enableSubmitButton();
}

// Populate table with invoice details
function populateInvoiceDetails(details) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.warn('Element with id "tableBody" not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (details.length === 0) {
        // Add empty row message
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="13" class="p-4 text-center text-gray-500">
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
                <input type="text" class="line-num-input no-input p-2 border rounded bg-gray-100" value="${index + 1}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border item-code-column">
                <input type="text" class="item-code-input p-2 border rounded bg-gray-100" value="${detail.itemCode || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border bp-catalog-column">
                <input type="text" class="bp-catalog-input p-2 border rounded bg-gray-100" value="${detail.catalogNo || ''}" disabled autocomplete="off" />
            </td>
            <td class="p-2 border description-column">
                <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto" maxlength="100" disabled autocomplete="off">${detail.dscription || ''}</textarea>
            </td>
            <td class="p-2 border uom-column">
                <textarea class="w-full item-uom bg-gray-100 resize-none overflow-auto" maxlength="100" disabled autocomplete="off">${detail.unitMsr || ''}</textarea>
            </td>
            <td class="p-2 border packing-size-column">
                <textarea class="w-full item-packing-size bg-gray-100 resize-none overflow-auto" maxlength="100" disabled autocomplete="off">${detail.unitMsr2 || ''}</textarea>
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
    
    // Apply currency formatting to table cells
    setTimeout(() => {
        applyCurrencyFormattingToTable();
    }, 200);
    
    // Ensure all inputs in the table have autocomplete disabled
    const tableInputs = tableBody.querySelectorAll('input, textarea, select');
    tableInputs.forEach(element => {
        element.setAttribute('autocomplete', 'off');
    });
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
        
        // If approvalStatus is empty, null, or undefined, return Draft
        console.log('approvalStatus is empty/null/undefined, returning Draft');
        return 'Draft';
        
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
                
                if (acknowledgeByNameField) {
                    acknowledgeByNameField.value = approvalData.acknowledgeByName || '';
                    acknowledgeByNameField.setAttribute('data-employee-id', approvalData.acknowledgeById || '');
                }
                if (checkedByNameField) {
                    checkedByNameField.value = approvalData.checkedByName || '';
                    checkedByNameField.setAttribute('data-employee-id', approvalData.checkedById || '');
                }
                if (approvedByNameField) {
                    approvedByNameField.value = approvalData.approvedByName || '';
                    approvedByNameField.setAttribute('data-employee-id', approvalData.approvedById || '');
                }
                if (receivedByNameField) {
                    receivedByNameField.value = approvalData.receivedByName || '';
                    receivedByNameField.setAttribute('data-employee-id', approvalData.receivedById || '');
                }
                
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
            text: 'Are you sure you want to submit this invoice data and upload attachments?',
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
        
        // PATCH method with payload
        try {
            console.log('PATCH method with payload');
            
            console.log('Payload for PATCH:', payload);
            
            const response = await fetch(`${API_BASE_URL}/ar-invoices/approval/${stagingID}`, {
                method: 'PATCH',
                headers: {
                    'accept': 'text/plain',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (response.ok) {
                success = true;
                apiResult = await response.json();
                console.log('Success with PATCH method:', apiResult);
            } else {
                console.log('PATCH method failed:', response.status);
                const errorText = await response.text();
                console.error('API Error response:', errorText);
                
                // Handle 404 errors specifically
                if (response.status === 404) {
                    console.warn('Approval endpoint not found (404) - this might be expected for new invoices');
                    throw new Error('Approval endpoint not available for this invoice');
                }
                
                // Try to parse error response as JSON for better error handling
                let errorDetails = errorText;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorDetails = errorJson.message || errorJson.error || errorText;
                    console.error('Parsed error details:', errorJson);
                } catch (parseError) {
                    console.error('Could not parse error response as JSON:', parseError);
                }
                
                throw new Error(`API Error: ${response.status} - ${errorDetails}`);
            }
        } catch (error) {
            console.log('PATCH method error:', error);
            throw error;
        }
        
        // If PATCH attempt failed, throw error
        if (!success) {
            throw new Error('API attempt failed');
        }
        
        console.log('API Response:', apiResult);
        console.log('Approval data successfully submitted to API');
        
        // Upload files if any are selected
        let uploadResult = null;
        if (uploadedFiles && uploadedFiles.length > 0) {
            console.log('Uploading files:', uploadedFiles.length, 'files');
            submitButtonText.textContent = 'Uploading Attachments...';
            
            try {
                uploadResult = await uploadAttachments(stagingID, uploadedFiles);
                console.log('File upload result:', uploadResult);
            } catch (uploadError) {
                console.error('Error uploading files:', uploadError);
                // Don't throw error here, just log it and continue
                // The approval data was already submitted successfully
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
        
        // Add file upload info
        let uploadInfo = '';
        if (uploadResult && uploadResult.status) {
            const uploadedCount = uploadResult.data ? uploadResult.data.length : 0;
            uploadInfo = `<p><strong>📎 Attachments Uploaded:</strong> ${uploadedCount} file(s) uploaded successfully</p>`;
        } else if (uploadedFiles && uploadedFiles.length > 0) {
            uploadInfo = '<p><strong>⚠️ File Upload:</strong> Files were not uploaded due to an error, but approval data was updated successfully</p>';
        }
        
        console.log('Submission completed successfully');
        console.log('Approval data was modified:', approvalModified);
        console.log('Status change:', originalStatus, '→', newStatus);
        
        Swal.fire({
            icon: 'success',
            title: 'Invoice Approval Updated Successfully!',
            html: `
                <div class="text-left">
                    <p><strong>Invoice Number:</strong> ${invoiceData.docNum || 'N/A'}</p>
                    <p><strong>Customer:</strong> ${invoiceData.cardName || 'N/A'}</p>
                    <p><strong>Staging ID:</strong> ${stagingID}</p>
                    <p><strong>Current Approval Status:</strong> ${newStatus}</p>
                    ${statusChangeInfo}
                    ${preparedDateInfo}
                    ${approvalInfo}
                    ${uploadInfo}
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
            
            // Clear uploaded files
            uploadedFiles = [];
            displayFileList();
            
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
        submitButtonText.textContent = 'Submit & Update Status';
        submitSpinner.classList.add('hidden');
    }
}

// Upload attachments to API
async function uploadAttachments(stagingID, files) {
    try {
        console.log('Starting file upload for stagingID:', stagingID);
        console.log('Files to upload:', files);
        
        if (!files || files.length === 0) {
            console.log('No files to upload');
            return { status: true, message: 'No files to upload' };
        }
        
        // Create FormData object for multipart/form-data
        const formData = new FormData();
        
        // Add each file to the FormData
        files.forEach((file, index) => {
            console.log(`Adding file ${index + 1}:`, file.name, file.type, file.size);
            formData.append('files', file);
        });
        
        // Construct the API URL
        const uploadUrl = `${API_BASE_URL}/ar-invoices/${stagingID}/attachments/upload`;
        console.log('Upload URL:', uploadUrl);
        
        // Make the API request
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'accept': '*/*'
                // Don't set Content-Type header - let the browser set it with boundary for multipart/form-data
            },
            body: formData
        });
        
        console.log('Upload response status:', response.status);
        console.log('Upload response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload API Error response:', errorText);
            
            // Handle 404 errors specifically
            if (response.status === 404) {
                console.warn('Upload endpoint not found (404) - this might be expected for new invoices');
                throw new Error('Upload endpoint not available for this invoice');
            }
            
            // Try to parse error response as JSON for better error handling
            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = errorJson.message || errorJson.error || errorText;
                console.error('Parsed upload error details:', errorJson);
            } catch (parseError) {
                console.error('Could not parse upload error response as JSON:', parseError);
            }
            
            throw new Error(`Upload API Error: ${response.status} - ${errorDetails}`);
        }
        
        const result = await response.json();
        console.log('Upload API response:', result);
        
        if (result.status && result.code === 200) {
            console.log('Files uploaded successfully:', result.data);
            return result;
        } else {
            throw new Error(`Upload failed: ${result.message || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.error('Error in uploadAttachments:', error);
        throw error;
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
        fileName: attachment.fileName || attachment.file_name || '',
        filePath: attachment.filePath || attachment.file_path || '',
        fileUrl: attachment.fileUrl || attachment.file_url || '',
        description: attachment.description || '',
        createdAt: attachment.createdAt || attachment.created_at || '',
        updatedAt: attachment.updatedAt || attachment.updated_at || ''
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
        vatSum: parseFloat(data.docTax) || 0,
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

// Enable submit button when data is loaded (only for Draft status)
function enableSubmitButton() {
    // Get current status from the Status field
    const statusField = document.getElementById('Status');
    const currentStatus = statusField ? statusField.value : '';
    
    // Use the helper function to update visibility
    updateSubmitAndRejectVisibility(currentStatus);
    
    // Update form editability based on status
    updateFormEditability(currentStatus);
}

// Function to control form editability based on document status
function updateFormEditability(status) {
    console.log('Updating form editability for status:', status);
    
    const isDraft = status === 'Draft';
    
    // Update status indicator
    updateDocumentStatusIndicator(status, isDraft);
    
    // Control approval section (only editable for Draft status)
    setApprovalFieldsEditability(isDraft);
    
    // Control file upload section
    setFileUploadEditability(isDraft);
    
    // Control remarks field
    setRemarksEditability(isDraft);
    
    // Control table cells (in case there are any editable table fields)
    setTableFieldsEditability(isDraft);
    
    console.log(`Form editability updated: ${isDraft ? 'Enabled' : 'Disabled'} for status: ${status}`);
}

// Function to update document status indicator
function updateDocumentStatusIndicator(status, isEditable) {
    const indicator = document.getElementById('documentStatusIndicator');
    const statusDisplay = document.getElementById('currentStatusDisplay');
    const badge = document.getElementById('readOnlyBadge');
    
    if (!indicator || !statusDisplay || !badge) return;
    
    if (!isEditable) {
        // Show read-only indicator for non-Draft status
        statusDisplay.textContent = status;
        indicator.classList.remove('hidden');
        
        // Update badge color based on status
        badge.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border';
        
        switch (status) {
            case 'Prepared':
                badge.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-300');
                break;
            case 'Checked':
                badge.classList.add('bg-yellow-100', 'text-yellow-800', 'border-yellow-300');
                break;
            case 'Acknowledged':
                badge.classList.add('bg-purple-100', 'text-purple-800', 'border-purple-300');
                break;
            case 'Approved':
                badge.classList.add('bg-green-100', 'text-green-800', 'border-green-300');
                break;
            case 'Received':
                badge.classList.add('bg-emerald-100', 'text-emerald-800', 'border-emerald-300');
                break;
            case 'Rejected':
                badge.classList.add('bg-red-100', 'text-red-800', 'border-red-300');
                break;
            default:
                badge.classList.add('bg-gray-100', 'text-gray-800', 'border-gray-300');
        }
    } else {
        // Hide indicator for Draft status (editable)
        indicator.classList.add('hidden');
    }
}

// Function to control approval fields editability
function setApprovalFieldsEditability(isEditable) {
    const approvalInputs = [
        'acknowledgeByName',
        'checkedByName', 
        'approvedByName',
        'receivedByName'
    ];
    
    approvalInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.disabled = !isEditable;
            input.readOnly = !isEditable;
            
            // Update visual appearance
            if (isEditable) {
                input.classList.remove('bg-gray-100');
                input.classList.add('bg-white');
            } else {
                input.classList.remove('bg-white');
                input.classList.add('bg-gray-100');
            }
        }
    });
    
    // Also disable the corresponding dropdowns
    const dropdownIds = [
        'acknowledgeBySelectDropdown',
        'checkedBySelectDropdown',
        'approvedBySelectDropdown', 
        'receivedBySelectDropdown'
    ];
    
    dropdownIds.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            if (isEditable) {
                dropdown.style.pointerEvents = 'auto';
                dropdown.style.opacity = '1';
            } else {
                dropdown.style.pointerEvents = 'none';
                dropdown.style.opacity = '0.6';
            }
        }
    });
}

// Function to control file upload editability
function setFileUploadEditability(isEditable) {
    const fileInput = document.getElementById('filePath');
    if (fileInput) {
        fileInput.disabled = !isEditable;
        
        // Update visual appearance
        if (isEditable) {
            fileInput.classList.remove('bg-gray-100');
            fileInput.classList.add('bg-white');
        } else {
            fileInput.classList.remove('bg-white');
            fileInput.classList.add('bg-gray-100');
        }
    }
    
    // Hide/show file upload section
    const fileUploadSection = document.querySelector('.file-upload-section');
    if (fileUploadSection) {
        if (isEditable) {
            fileUploadSection.style.display = 'block';
        } else {
            fileUploadSection.style.display = 'none';
        }
    }
}

// Function to control remarks field editability
function setRemarksEditability(isEditable) {
    const remarksField = document.getElementById('comments');
    if (remarksField) {
        remarksField.disabled = !isEditable;
        remarksField.readOnly = !isEditable;
        
        // Update visual appearance
        if (isEditable) {
            remarksField.classList.remove('bg-gray-100');
            remarksField.classList.add('bg-white');
        } else {
            remarksField.classList.remove('bg-white');
            remarksField.classList.add('bg-gray-100');
        }
    }
}

// Function to control table fields editability (if any editable fields exist)
function setTableFieldsEditability(isEditable) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    // Get all input and textarea elements in the table
    const tableInputs = tableBody.querySelectorAll('input, textarea, select');
    
    tableInputs.forEach(element => {
        element.disabled = !isEditable;
        element.readOnly = !isEditable;
        
        // Update visual appearance
        if (isEditable) {
            element.classList.remove('bg-gray-100');
            element.classList.add('bg-white');
        } else {
            element.classList.remove('bg-white');
            element.classList.add('bg-gray-100');
        }
    });
    
    // Hide/show any action buttons in table (like add/remove row buttons)
    const actionButtons = tableBody.querySelectorAll('button, .btn-add, .btn-remove, .btn-delete');
    actionButtons.forEach(button => {
        if (isEditable) {
            button.style.display = 'inline-block';
            button.disabled = false;
        } else {
            button.style.display = 'none';
            button.disabled = true;
        }
    });
}

// Helper function to manage submit and reject buttons visibility
function updateSubmitAndRejectVisibility(status) {
    const submitButton = document.getElementById('submitButton');
    const submitButtonContainer = submitButton ? submitButton.closest('.text-center') : null;
    const rejectButton = document.getElementById('rejectButton');
    
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

    // Show Reject button only when status is Draft; hide otherwise
    if (rejectButton) {
        if (status === 'Draft') {
            rejectButton.style.display = 'inline-block';
        } else {
            rejectButton.style.display = 'none';
        }
    }
}

// Reject flow (mirrors check page behavior but allowed on Draft)
function rejectInvoice() {
    if (!invoiceData) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice data available'
        });
        return;
    }

    const status = getStatusFromInvoice(invoiceData);
    if (status !== 'Draft') {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Action',
            text: `Cannot reject document with status: ${status}. Only documents with status "Draft" can be rejected.`,
        });
        return;
    }

    Swal.fire({
        title: 'Reject Invoice',
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
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        width: '600px',
        didOpen: () => {
            const firstField = document.getElementById('rejectionField1');
            if (firstField) {
                initializeWithRejectionPrefixDetail(firstField);
            }
            const field = document.querySelector('#rejectionFieldsContainer textarea');
            if (field) {
                field.addEventListener('input', handleRejectionInputDetail);
            }
        },
        preConfirm: () => {
            const field = document.querySelector('#rejectionFieldsContainer textarea');
            const remarks = field ? field.value.trim() : '';
            const prefixLength = parseInt(field?.dataset.prefixLength || '0');
            const contentAfterPrefix = remarks.substring(prefixLength).trim();
            if (!contentAfterPrefix) {
                Swal.showValidationMessage('Please enter a rejection reason');
                return false;
            }
            return remarks;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            updateInvoiceStatusToRejected(result.value);
        }
    });
}

function initializeWithRejectionPrefixDetail(textarea) {
    const fullName = getCurrentUserFullNameDetail();
    const role = 'Prepared';
    const prefix = `[${fullName} - ${role}]: `;
    textarea.value = prefix;
    textarea.dataset.prefixLength = prefix.length;
    textarea.setSelectionRange(prefix.length, prefix.length);
    textarea.focus();
}

function handleRejectionInputDetail(event) {
    const textarea = event.target;
    const prefixLength = parseInt(textarea.dataset.prefixLength || '0');
    const fullName = getCurrentUserFullNameDetail();
    const role = 'Prepared';
    const expectedPrefix = `[${fullName} - ${role}]: `;
    if (!textarea.value.startsWith(expectedPrefix)) {
        const userText = textarea.value.substring(prefixLength);
        textarea.value = expectedPrefix + userText;
        textarea.setSelectionRange(prefixLength, prefixLength);
    } else if (textarea.selectionStart < prefixLength || textarea.selectionEnd < prefixLength) {
        textarea.setSelectionRange(prefixLength, prefixLength);
    }
}

async function updateInvoiceStatusToRejected(remarks = '') {
    try {
        if (!invoiceData || !invoiceData.stagingID) {
            throw new Error('Staging ID is required for rejection');
        }

        Swal.fire({
            title: 'Updating Status...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        const now = new Date().toISOString();
        const payload = {
            approvalStatus: 'Rejected',
            rejectedDate: now,
            rejectionRemarks: remarks,
            rejectedBy: (window.getCurrentUser && window.getCurrentUser()?.userId) || '',
            rejectedByName: getCurrentUserFullNameDetail(),
            updatedAt: now,
        };

        const response = await fetch(`${API_BASE_URL}/ar-invoices/approval/${invoiceData.stagingID}`, {
            method: 'PATCH',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        await response.json();

        Swal.fire({
            icon: 'success',
            title: 'Invoice Rejected',
            text: 'The document has been rejected successfully.',
            confirmButtonColor: '#10b981'
        }).then(() => window.location.reload());
    } catch (error) {
        console.error('Error rejecting invoice:', error);
        Swal.fire({
            icon: 'error',
            title: 'Rejection Failed',
            text: error.message || 'Failed to reject the invoice. Please try again.',
        });
    }
}

// Helper to get current user full name (best-effort, works even when auth disabled)
function getCurrentUserFullNameDetail() {
    try {
        // 1) Try preparedByName field shown on the form
        const preparedByInput = document.getElementById('preparedByName');
        const preparedByFromInput = preparedByInput?.value?.trim();
        if (preparedByFromInput) return preparedByFromInput;

        // 2) Try from loaded invoice data approval summary
        const preparedByFromData = invoiceData?.arInvoiceApprovalSummary?.preparedByName;
        if (preparedByFromData && String(preparedByFromData).trim() !== '') return preparedByFromData;

        // 3) Try from localStorage (if app placed user there)
        try {
            const loggedStr = localStorage.getItem('loggedInUser');
            if (loggedStr) {
                const logged = JSON.parse(loggedStr);
                if (logged?.name) return logged.name;
                if (logged?.fullName) return logged.fullName;
                if (logged?.username) return logged.username;
            }
        } catch {}

        // 4) Try auth.js current user if available
        const user = currentUser || (typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null);
        if (user) {
            return (
                user.name || user.fullName || user.username || user.userId || 'Unknown User'
            );
        }

        // 5) Fallback
        return 'Unknown User';
    } catch (e) {
        return 'Unknown User';
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
                // Check if document is editable before allowing changes
                const statusField = document.getElementById('Status');
                const currentStatus = statusField ? statusField.value : '';
                
                if (currentStatus !== 'Draft') {
                    // If not Draft, prevent changes and show warning
                    Swal.fire({
                        icon: 'warning',
                        title: 'Cannot Edit',
                        text: 'This document cannot be edited because its status is not "Draft".',
                        confirmButtonText: 'OK',
                        timer: 3000,
                        timerProgressBar: true
                    });
                    
                    // Revert the change by clearing the input
                    this.value = this.getAttribute('data-original-value') || '';
                    return;
                }
                
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
                
                // Safely get approval data state with null checks
                const approvalDataState = {
                    preparedByName: document.getElementById('preparedByName')?.value || '',
                    acknowledgeByName: document.getElementById('acknowledgeByName')?.value || '',
                    checkedByName: document.getElementById('checkedByName')?.value || '',
                    approvedByName: document.getElementById('approvedByName')?.value || '',
                    receivedByName: document.getElementById('receivedByName')?.value || '',
                    acknowledgeById: document.getElementById('acknowledgeByName')?.getAttribute('data-employee-id') || '',
                    checkedById: document.getElementById('checkedByName')?.getAttribute('data-employee-id') || '',
                    approvedById: document.getElementById('approvedByName')?.getAttribute('data-employee-id') || '',
                    receivedById: document.getElementById('receivedByName')?.getAttribute('data-employee-id') || ''
                };
                
                console.log(`Current approval data state:`, approvalDataState);
                
                // Save to localStorage as backup
                saveApprovalDataToLocalStorage();
                
                // Show subtle notification that data has been modified
                showApprovalModifiedNotification();
            });
            
            // Store original value when the input gains focus (for reverting if needed)
            input.addEventListener('focus', function() {
                this.setAttribute('data-original-value', this.value);
            });
        } else {
            console.warn(`Element with id '${inputId}' not found`);
        }
    });
}

// Setup event listeners for other form fields (comments, etc.)
function setupOtherFieldListeners() {
    // Setup comments/remarks field listener
    const commentsField = document.getElementById('comments');
    if (commentsField) {
        commentsField.addEventListener('input', function() {
            // Check if document is editable before allowing changes
            const statusField = document.getElementById('Status');
            const currentStatus = statusField ? statusField.value : '';
            
            if (currentStatus !== 'Draft') {
                // If not Draft, prevent changes and show warning
                Swal.fire({
                    icon: 'warning',
                    title: 'Cannot Edit',
                    text: 'Remarks cannot be edited because this document status is not "Draft".',
                    confirmButtonText: 'OK',
                    timer: 3000,
                    timerProgressBar: true
                });
                
                // Revert the change
                this.value = this.getAttribute('data-original-value') || '';
                return;
            }
        });
        
        // Store original value when the field gains focus
        commentsField.addEventListener('focus', function() {
            this.setAttribute('data-original-value', this.value);
        });
    }
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
                const acknowledgeByNameField = document.getElementById('acknowledgeByName');
                const checkedByNameField = document.getElementById('checkedByName');
                const approvedByNameField = document.getElementById('approvedByName');
                const receivedByNameField = document.getElementById('receivedByName');
                
                if (acknowledgeByNameField) {
                    acknowledgeByNameField.value = invoiceData.arInvoiceApprovalSummary.acknowledgedByName || '';
                }
                if (checkedByNameField) {
                    checkedByNameField.value = invoiceData.arInvoiceApprovalSummary.checkedByName || '';
                }
                if (approvedByNameField) {
                    approvedByNameField.value = invoiceData.arInvoiceApprovalSummary.approvedByName || '';
                }
                if (receivedByNameField) {
                    receivedByNameField.value = invoiceData.arInvoiceApprovalSummary.receivedByName || '';
                }
                console.log('Reset approval data to original values from API');
            } else {
                // Clear all fields if no approval summary (excluding prepared by)
                const acknowledgeByNameField = document.getElementById('acknowledgeByName');
                const checkedByNameField = document.getElementById('checkedByName');
                const approvedByNameField = document.getElementById('approvedByName');
                const receivedByNameField = document.getElementById('receivedByName');
                
                if (acknowledgeByNameField) {
                    acknowledgeByNameField.value = '';
                }
                if (checkedByNameField) {
                    checkedByNameField.value = '';
                }
                if (approvedByNameField) {
                    approvedByNameField.value = '';
                }
                if (receivedByNameField) {
                    receivedByNameField.value = '';
                }
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
        console.log('Attachments type:', typeof attachments);
        console.log('Attachments length:', attachments ? attachments.length : 'null/undefined');
        
        // Initialize global attachment variables
        uploadedFiles = [];
        
        // Check if attachments exist and have valid data
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            // Filter out attachments with empty or invalid file names
            const validAttachments = attachments.filter(attachment => {
                const fileName = attachment.fileName || attachment.file_name;
                return fileName && fileName !== 'string' && fileName.trim() !== '';
            });
            
            console.log('Valid attachments found:', validAttachments.length);
            
            if (validAttachments.length > 0) {
                console.log('Displaying existing attachments:', validAttachments);
                displayExistingAttachments(validAttachments);
            } else {
                console.log('No valid attachments found');
                showNoExistingAttachments();
            }
        } else {
            console.log('No attachments data or empty array');
            showNoExistingAttachments();
        }
        
    } catch (error) {
        console.error('Error loading attachments from data:', error);
        showNoExistingAttachments();
    }
}

// Display existing attachments in the UI
function displayExistingAttachments(attachments) {
    const existingAttachmentsContainer = document.getElementById('existingAttachmentsList');
    if (!existingAttachmentsContainer) {
        console.warn('Element with id "existingAttachmentsList" not found');
        return;
    }

    existingAttachmentsContainer.innerHTML = ''; // Clear previous attachments

    if (!attachments || attachments.length === 0) {
        showNoExistingAttachments();
        return;
    }

    attachments.forEach((attachment, index) => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3 shadow-sm hover:shadow-md transition-shadow';
        
        // Get file name from various possible fields
        const fileName = attachment.fileName || attachment.file_name || attachment.name || `Attachment ${index + 1}`;
        
        // Get file icon based on file extension
        const fileIcon = getFileIcon(fileName);
        
        // Format file size if available
        const fileSize = attachment.fileSize || attachment.file_size || attachment.size;
        const formattedFileSize = fileSize ? formatFileSize(fileSize) : '';
        
        // Format creation date
        const createdAt = attachment.createdAt || attachment.created_at || attachment.uploadDate || attachment.upload_date;
        const formattedCreatedAt = createdAt ? new Date(createdAt).toLocaleDateString() : '';
        
        // Get file URL from various possible fields
        const fileUrl = attachment.fileUrl || attachment.file_url || attachment.filePath || attachment.file_path || attachment.path || '';
        
        // Create attachment object for function call (with proper escaping)
        const attachmentData = {
            fileName: fileName,
            fileUrl: fileUrl,
            fileSize: fileSize,
            createdAt: createdAt,
            description: attachment.description || attachment.desc || '',
            fileType: attachment.fileType || attachment.contentType || attachment.type || '',
            id: attachment.id || attachment.attachmentId || ''
        };
        
        // Escape the JSON properly for HTML attributes
        const attachmentJson = JSON.stringify(attachmentData).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        attachmentItem.innerHTML = `
            <div class="flex items-center flex-1">
                <span class="text-blue-600 mr-3 text-xl">${fileIcon}</span>
                <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-900">${fileName}</span>
                    <div class="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        ${formattedFileSize ? `<span>Size: ${formattedFileSize}</span>` : ''}
                        ${formattedCreatedAt ? `<span>Created: ${formattedCreatedAt}</span>` : ''}
                        ${attachmentData.description ? `<span>Description: ${attachmentData.description}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="viewExistingAttachment('${attachmentJson}')" class="text-blue-600 hover:text-blue-800 text-sm font-semibold px-3 py-1 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    View
                </button>
            </div>
        `;
        existingAttachmentsContainer.appendChild(attachmentItem);
    });
}

// Show no existing attachments message
function showNoExistingAttachments() {
    const existingAttachmentsContainer = document.getElementById('existingAttachmentsList');
    if (!existingAttachmentsContainer) {
        console.warn('Element with id "existingAttachmentsList" not found');
        return;
    }
    existingAttachmentsContainer.innerHTML = `
        <div class="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p class="text-lg font-medium">No existing attachments found</p>
            <p class="text-sm">This invoice doesn't have any attachments yet.</p>
        </div>
    `;
}




// Display attachments in the UI (disabled since existing attachments section removed)
function displayAttachments(attachments) {
    console.log('Display attachments function called but existing attachments section has been removed');
}

// Show no attachments message (disabled since existing attachments section removed)
function showNoAttachments() {
    console.log('Show no attachments function called but existing attachments section has been removed');
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




// Download feature removed

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

// Currency formatting functions
function formatCurrencyIDR(number) {
    if (number === null || number === undefined || number === '') {
        return '0.00';
    }
    
    let num;
    try {
        if (typeof number === 'string') {
            const cleanedStr = number.replace(/[^\d,.]/g, '');
            if (cleanedStr.length > 15) {
                num = Number(cleanedStr.replace(/,/g, ''));
            } else {
                num = parseFloat(cleanedStr.replace(/,/g, ''));
            }
        } else {
            num = Number(number);
        }
        
        if (isNaN(num)) {
            return '0.00';
        }
    } catch (e) {
        console.error('Error parsing number:', e);
        return '0.00';
    }
    
    const maxAmount = 100000000000000;
    if (num > maxAmount) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Amount Exceeds Limit',
                text: 'Total amount must not exceed 100 trillion rupiah'
            });
        } else {
            alert('Total amount must not exceed 100 trillion rupiah');
        }
        num = maxAmount;
    }
    
    if (num >= 1e12) {
        let strNum = num.toString();
        let result = '';
        let count = 0;
        
        for (let i = strNum.length - 1; i >= 0; i--) {
            result = strNum[i] + result;
            count++;
            if (count % 3 === 0 && i > 0) {
                result = ',' + result;
            }
        }
        
        return result + '.00';
    } else {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

function parseCurrencyIDR(formattedValue) {
    if (!formattedValue) return 0;
    
    try {
        const numericValue = formattedValue.toString().replace(/,/g, '');
        return parseFloat(numericValue) || 0;
    } catch (e) {
        console.error('Error parsing currency:', e);
        return 0;
    }
}

function formatCurrencyInputIDR(input) {
    // Change input type to text for currency formatting
    if (input.type === 'number') {
        input.type = 'text';
    }
    
    const cursorPos = input.selectionStart;
    const originalLength = input.value.length;
    
    let value = input.value.replace(/[^\d,.]/g, '');
    
    let parts = value.split('.');
    if (parts.length > 1) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    const numValue = parseCurrencyIDR(value);
    const formattedValue = formatCurrencyIDR(numValue);
    
    input.value = formattedValue;
    
    const newLength = input.value.length;
    const newCursorPos = cursorPos + (newLength - originalLength);
    input.setSelectionRange(Math.max(0, newCursorPos), Math.max(0, newCursorPos));
}

// Apply currency formatting to table cells
function applyCurrencyFormattingToTable() {
    // Format Price per UoM columns
    const pricePerUoMInputs = document.querySelectorAll('.item-sls-price');
    pricePerUoMInputs.forEach(input => {
        input.classList.add('currency-input-idr');
        input.addEventListener('input', function() {
            formatCurrencyInputIDR(this);
        });
        if (input.value) {
            formatCurrencyInputIDR(input);
        } else {
            input.value = '0.00';
        }
    });

    // Format Price per Unit columns
    const pricePerUnitInputs = document.querySelectorAll('.item-price');
    pricePerUnitInputs.forEach(input => {
        input.classList.add('currency-input-idr');
        input.addEventListener('input', function() {
            formatCurrencyInputIDR(this);
        });
        if (input.value) {
            formatCurrencyInputIDR(input);
        } else {
            input.value = '0.00';
        }
    });

    // Format Amount columns
    const amountInputs = document.querySelectorAll('.item-line-total');
    amountInputs.forEach(input => {
        input.classList.add('currency-input-idr');
        input.addEventListener('input', function() {
            formatCurrencyInputIDR(this);
        });
        if (input.value) {
            formatCurrencyInputIDR(input);
        } else {
            input.value = '0.00';
        }
    });

    // We don't need to format summary fields anymore since we're already
    // including formatted values with currency code when populating the fields
    // The currency-input-idr class is still applied in the HTML for consistent styling
}

// File upload and preview functions
function previewPDF(event) {
    // Check if document is editable
    const statusField = document.getElementById('Status');
    const currentStatus = statusField ? statusField.value : '';
    
    if (currentStatus !== 'Draft') {
        // If not Draft, prevent file upload and show warning
        Swal.fire({
            icon: 'warning',
            title: 'Cannot Upload Files',
            text: 'Files cannot be uploaded because this document status is not "Draft".',
            confirmButtonText: 'OK',
            timer: 3000,
            timerProgressBar: true
        });
        
        // Clear the file input
        event.target.value = '';
        return;
    }
    
    const files = event.target.files;
    
    
    Array.from(files).forEach(file => {
        if (file.type === 'application/pdf') {
            uploadedFiles.push(file);
        } else {
            alert('Please upload a valid PDF file');
        }
    });
    
    displayFileList();
}

function displayFileList() {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;
    
    fileList.innerHTML = '';
    
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded mb-2';
        fileItem.innerHTML = `
            <div class="flex items-center">
                <span class="text-green-600 mr-2">📄</span>
                <span class="text-sm font-medium">${file.name}</span>
                <span class="text-xs text-green-600 ml-2">(new)</span>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="viewUploadedFile(${index})" class="text-blue-500 hover:text-blue-700 text-sm font-semibold px-3 py-1 border border-blue-500 rounded hover:bg-blue-50 transition">
                    View
                </button>
                <button onclick="removeUploadedFile(${index})" class="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1 border border-red-500 rounded hover:bg-red-50 transition">
                    Remove
                </button>
            </div>
        `;
        fileList.appendChild(fileItem);
    });
}

function removeUploadedFile(index) {
    uploadedFiles.splice(index, 1);
    displayFileList();
}

function viewUploadedFile(index) {
    const file = uploadedFiles[index];
    if (!file) {
        console.error('File not found at index:', index);
        return;
    }
    
    // Create a URL for the file
    const fileUrl = URL.createObjectURL(file);
    
    // Open the PDF in a new tab
    window.open(fileUrl, '_blank');
    
    // Clean up the URL object after a delay to prevent memory leaks
    setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
    }, 1000);
}

// Preview existing attachment
function previewExistingAttachment(fileUrl, fileName) {
    try {
        console.log('Previewing existing attachment:', fileName, fileUrl);
        
        // Construct full URL if it's a relative path
        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${API_BASE_URL}${fileUrl}`;
        
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
        modal.id = 'existingAttachmentViewerModal';
        
        // Create modal content
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-4/5 h-4/5 flex flex-col">
                <div class="flex justify-between items-center p-4 border-b">
                    <h3 class="text-lg font-semibold">${fileName}</h3>
                    <button type="button" class="text-gray-500 hover:text-gray-700" onclick="closeExistingAttachmentModal()">
                        <span class="text-2xl">&times;</span>
                    </button>
                </div>
                <div class="flex-grow p-4 overflow-auto">
                    <iframe src="${fullUrl}" class="w-full h-full" frameborder="0"></iframe>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeExistingAttachmentModal();
            }
        });
        
        console.log('Preview opened for existing attachment:', fileName);
    } catch (error) {
        console.error('Error previewing existing file:', error);
        Swal.fire({
            icon: 'error',
            title: 'Preview Failed',
            text: 'Failed to preview the file. Please try again.',
            confirmButtonText: 'OK'
        });
    }
}

// Download feature removed

// Close existing attachment modal
function closeExistingAttachmentModal() {
    const modal = document.getElementById('existingAttachmentViewerModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// View existing attachment with proper error handling and PDF viewer
async function viewExistingAttachment(attachmentJson) {
    try {
        console.log('Viewing existing attachment:', attachmentJson);
        
        // Parse the JSON string if it's passed as a string
        let attachment;
        if (typeof attachmentJson === 'string') {
            try {
                attachment = JSON.parse(attachmentJson);
            } catch (parseError) {
                console.error('Error parsing attachment JSON:', parseError);
                throw new Error('Invalid attachment data format');
            }
        } else {
            attachment = attachmentJson;
        }
        
        console.log('Parsed attachment data:', attachment);
        
        // Construct full URL if it's a relative path
        let fullUrl = attachment.fileUrl || attachment.filePath || attachment.path;
        if (!fullUrl) {
            throw new Error('File URL not available');
        }
        
        // If it's not already a full URL, construct it
        if (!fullUrl.startsWith('http')) {
            if (fullUrl.startsWith('/api')) {
                // Remove duplicate /api since API_BASE_URL already includes it
                const cleanFileUrl = fullUrl.replace('/api', '');
                fullUrl = `${API_BASE_URL}${cleanFileUrl}`;
            } else {
                fullUrl = fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`;
                fullUrl = `${API_BASE_URL}${fullUrl}`;
            }
        }
        
        console.log('Constructed full URL:', fullUrl);
        
        // Get file name and determine file type
        const fileName = attachment.fileName || attachment.name || 'attachment';
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        if (fileExtension === 'pdf') {
            // For PDF files, use the PDF viewer modal
            await showPDFViewerDetail(fullUrl, fileName);
        } else {
            // For other file types, open in new tab
            openInNewTabDetail(fullUrl, fileName);
        }
        
    } catch (error) {
        console.error('Error viewing existing attachment:', error);
        
        // Show error message
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Error',
                text: `Failed to view attachment: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ef4444'
            });
        } else {
            alert(`Failed to view attachment: ${error.message}`);
        }
    }
}

// Show PDF in a modal viewer for detail page
async function showPDFViewerDetail(pdfUrl, fileName) {
    try {
        // Show loading
        Swal.fire({
            title: 'Loading PDF...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Fetch the PDF as blob for viewing
        const response = await fetch(pdfUrl, {
            method: 'GET',
            headers: {
                'accept': 'application/pdf,*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Close loading and show PDF viewer
        Swal.fire({
            title: fileName,
            html: `
                <div style="width: 100%; height: 70vh; margin: 10px 0;">
                    <iframe 
                        src="${blobUrl}" 
                        style="width: 100%; height: 100%; border: none;"
                        type="application/pdf">
                        <p>Your browser doesn't support PDF viewing. 
                           <a href="${blobUrl}" target="_blank">Click here to open the PDF</a>
                        </p>
                    </iframe>
                </div>
            `,
            width: '90%',
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Close',
            customClass: {
                container: 'pdf-viewer-modal'
            },
            willClose: () => {
                // Clean up blob URL when modal closes
                URL.revokeObjectURL(blobUrl);
            }
        });

    } catch (error) {
        console.error('Error loading PDF for viewing:', error);
        
        // Fallback to Google Docs viewer
        Swal.fire({
            title: fileName,
            html: `
                <div style="width: 100%; height: 70vh; margin: 10px 0;">
                    <iframe 
                        src="https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true" 
                        style="width: 100%; height: 100%; border: none;"
                        allow="fullscreen">
                    </iframe>
                </div>
            `,
            width: '90%',
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Close'
        });
    }
}

// Open in new tab with proper handling for detail page
function openInNewTabDetail(fileUrl, fileName) {
    // Show loading message
    const loadingToast = Swal.fire({
        title: 'Opening Document...',
        text: `Loading ${fileName}`,
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: true,
        toast: true,
        position: 'top-end'
    });
    
    // Create a temporary link to force view behavior
    const tempLink = document.createElement('a');
    tempLink.href = fileUrl;
    tempLink.target = '_blank';
    tempLink.rel = 'noopener noreferrer';
    
    // Add parameters to hint at viewing instead of downloading
    const viewUrl = `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}view=1&inline=1`;
    
    // Try to open in new tab
    const newWindow = window.open(viewUrl, '_blank', 'noopener,noreferrer');
    
    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        loadingToast.close();
        Swal.fire({
            icon: 'warning',
            title: 'Popup Blocked',
            html: `
                <p>Your browser blocked the popup. Please allow popups for this site or</p>
                <a href="${viewUrl}" target="_blank" class="text-blue-600 underline">click here to view the document manually</a>
            `,
            confirmButtonText: 'OK'
        });
    }
}

