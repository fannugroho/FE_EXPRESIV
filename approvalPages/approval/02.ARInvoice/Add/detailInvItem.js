// Enhanced AR Invoice Detail Script with Service/Item Type Support

// Global variables
let invoiceData = null;
let currentUser = null;
let employeesData = [];
let uploadedFiles = [];
let documentType = 'item'; // Default type

// API Configuration
const API_BASE_URL = `${BASE_URL}/api`;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Determine document type from URL
    documentType = getDocumentTypeFromURL();
    console.log('Document type determined:', documentType);
    
    // Update UI based on document type
    updateUIForDocumentType(documentType);
    
    // Get invoice ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('invoice-id') || urlParams.get('id');
    
    console.log('URL search params:', window.location.search);
    console.log('Invoice ID from URL:', invoiceId);
    
    // Populate debug info
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
    
    // Try to resolve current user
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
});

// Function to get document type from URL
function getDocumentTypeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const docType = urlParams.get('docType');
    
    if (docType && (docType.toLowerCase() === 'service' || docType.toLowerCase() === 'item')) {
        return docType.toLowerCase();
    }
    
    return 'item'; // Default to item if not specified or invalid
}

// Function to update UI based on document type
function updateUIForDocumentType(type) {
    console.log('Updating UI for document type:', type);
    
    // Update page title
    const pageTitle = document.querySelector('.header-section h2');
    if (pageTitle) {
        pageTitle.textContent = type === 'service' ? 'Detail AR Invoice - Service' : 'Detail AR Invoice - Item';
    }
    
    // Update table headers and structure
    updateTableHeadersForType(type);
    
    // Update form fields visibility
    updateFormFieldsVisibility(type);
    
    console.log('UI updated for type:', type);
}

// Function to update table headers based on document type
function updateTableHeadersForType(type) {
    const tableHeader = document.querySelector('#arInvTable thead tr');
    if (!tableHeader) {
        console.warn('Table header not found');
        return;
    }
    
    if (type === 'service') {
        // Service type table headers
        tableHeader.innerHTML = `
            <th class="p-2 no-column">No.</th>
            <th class="p-2 description-column">Description</th>
            <th class="p-2 quantity-column">Quantity</th>
            <th class="p-2 uom-column">Unit</th>
            <th class="p-2 price-column">Price</th>
            <th class="p-2 tax-code-column">VAT Group</th>
            <th class="p-2 wtax-column">WTax</th>
            <th class="p-2 line-total-column">Amount</th>
            <th class="p-2 account-name-column">Account Name</th>
            <th class="p-2 account-code-column" style="display: none;">Account Code</th>
            <th class="p-2 base-column" style="display: none;">BaseType</th>
            <th class="p-2 base-column" style="display: none;">BaseEntry</th>
            <th class="p-2 base-column" style="display: none;">BaseLine</th>
            <th class="p-2 base-column" style="display: none;">LineType</th>
        `;
    } else {
        // Item type table headers (original)
        tableHeader.innerHTML = `
            <th class="p-2 no-column">No.</th>
            <th class="p-2 item-code-column">Item Code</th>
            <th class="p-2 bp-catalog-column">Part Number</th>
            <th class="p-2 description-column">Item Name</th>
            <th class="p-2 uom-column">UoM</th>
            <th class="p-2 packing-size-column">Packing Size</th>
            <th class="p-2 quantity-column">Sales Qty</th>
            <th class="p-2 quantity-column">Inv. Qty</th>
            <th class="p-2 uom-column" style="display: none;">UoM</th>
            <th class="p-2 price-column">Price per UoM</th>
            <th class="p-2 price-column">Price per Unit</th>
            <th class="p-2 tax-code-column">VAT Code</th>
            <th class="p-2 line-total-column">Amount</th>
            <th class="p-2 account-code-column" style="display: none;">Account Code</th>
            <th class="p-2 base-column" style="display: none;">BaseType</th>
            <th class="p-2 base-column" style="display: none;">BaseEntry</th>
            <th class="p-2 base-column" style="display: none;">BaseLine</th>
            <th class="p-2 base-column" style="display: none;">LineType</th>
        `;
    }
}

// Function to update form fields visibility based on document type
function updateFormFieldsVisibility(type) {
    if (type === 'service') {
        // Show Control Account field for service
        addControlAccountField();
        // Show Withholding Tax field for service
        addWithholdingTaxField();
    } else {
        // Hide these fields for item type
        removeControlAccountField();
        removeWithholdingTaxField();
    }
}

// Function to add Control Account field for service type
function addControlAccountField() {
    const rightColumn = document.querySelector('.form-grid > div:last-child');
    if (rightColumn && !document.getElementById('U_BSI_UDF3')) {
        const controlAccountHTML = `
            <h3 class="text-lg font-semibold mb-2">Control Account</h3>
            <input type="text" id="U_BSI_UDF3" placeholder="Control Account"
                class="w-full p-2 border rounded bg-gray-100" disabled autocomplete="off">
        `;
        
        // Insert before Account field
        const accountField = rightColumn.querySelector('input[id="account"]').closest('div');
        if (accountField) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = controlAccountHTML;
            rightColumn.insertBefore(tempDiv.firstElementChild, accountField);
            rightColumn.insertBefore(tempDiv.firstElementChild, accountField);
        }
    }
}

// Function to add Withholding Tax field for service type
function addWithholdingTaxField() {
    const footerSection = document.querySelector('.footer-section');
    if (footerSection && !document.getElementById('wtSum')) {
        const witholdingTaxHTML = `
            <!--Withholding Tax-->
            <div class="mt-4 flex justify-end space-x-2">
                <label class="font-semibold text-gray-700">Withholding Tax :</label>
                <div class="flex items-center">
                    <input type="text" id="wtSum"
                        class="w-80 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 currency-input bg-gray-100 currency-input-idr"
                        readonly autocomplete="off">
                </div>
            </div>
        `;
        
        // Insert before GRAND TOTAL
        const grandTotalDiv = footerSection.querySelector('input[id="grandTotal"]').closest('.mt-4');
        if (grandTotalDiv) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = witholdingTaxHTML;
            footerSection.insertBefore(tempDiv.firstElementChild, grandTotalDiv);
        }
    }
}

// Function to remove Control Account field for item type
function removeControlAccountField() {
    const controlAccountInput = document.getElementById('U_BSI_UDF3');
    if (controlAccountInput) {
        // Remove both the input and its label
        const parentDiv = controlAccountInput.parentElement;
        const labelElement = parentDiv.querySelector('h3');
        if (labelElement) labelElement.remove();
        controlAccountInput.remove();
    }
}

// Function to remove Withholding Tax field for item type
function removeWithholdingTaxField() {
    const witholdingTaxInput = document.getElementById('wtSum');
    if (witholdingTaxInput) {
        const parentDiv = witholdingTaxInput.closest('.mt-4');
        if (parentDiv) parentDiv.remove();
    }
}

// Enhanced populate invoice details function with type-specific rendering
function populateInvoiceDetails(details) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.warn('Element with id "tableBody" not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (details.length === 0) {
        const emptyRow = document.createElement('tr');
        const colspan = documentType === 'service' ? '9' : '13';
        emptyRow.innerHTML = `
            <td colspan="${colspan}" class="p-4 text-center text-gray-500">
                No invoice details found
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }
    
    details.forEach((detail, index) => {
        const row = document.createElement('tr');
        
        if (documentType === 'service') {
            row.innerHTML = generateServiceRowHTML(detail, index);
        } else {
            row.innerHTML = generateItemRowHTML(detail, index);
        }
        
        tableBody.appendChild(row);
    });
    
    // Apply text wrapping and formatting
    if (window.refreshTextWrapping) {
        setTimeout(() => {
            window.refreshTextWrapping();
        }, 100);
    }
    
    adjustTextareaHeights();
    
    setTimeout(() => {
        applyCurrencyFormattingToTable();
    }, 200);
    
    // Ensure all inputs have autocomplete disabled
    const tableInputs = tableBody.querySelectorAll('input, textarea, select');
    tableInputs.forEach(element => {
        element.setAttribute('autocomplete', 'off');
    });
}

// Function to generate service-specific row HTML
function generateServiceRowHTML(detail, index) {
    return `
        <td class="p-2 border no-column">
            <input type="text" class="line-num-input no-input p-2 border rounded bg-gray-100" value="${index + 1}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border description-column">
            <textarea class="w-full item-description bg-gray-100 resize-none overflow-auto" maxlength="100" disabled autocomplete="off">${detail.dscription || ''}</textarea>
        </td>
        <td class="p-2 border quantity-column">
            <textarea class="quantity-input item-quantity bg-gray-100 overflow-auto" maxlength="15" disabled style="resize: none;" autocomplete="off">${detail.invQty || detail.quantity || '0'}</textarea>
        </td>
        <td class="p-2 border uom-column">
            <textarea class="w-full item-uom bg-gray-100 resize-none overflow-auto" maxlength="100" disabled autocomplete="off">${detail.unitMsr || ''}</textarea>
        </td>
        <td class="p-2 border price-column">
            <textarea class="price-input item-price bg-gray-100 overflow-auto" maxlength="15" disabled style="resize: none;" autocomplete="off">${detail.u_bsi_salprice || detail.priceBefDi || '0.00'}</textarea>
        </td>
        <td class="p-2 border tax-code-column">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.vatgroup || ''}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border wtax-column">
            <input type="text" class="w-full p-2 border rounded bg-gray-100" value="${detail.wtLiable || 'N'}" disabled autocomplete="off" />
        </td>
        <td class="p-2 border line-total-column">
            <textarea class="line-total-input item-line-total bg-gray-100 overflow-auto" maxlength="15" disabled style="resize: none;" autocomplete="off">${detail.lineTotal || '0.00'}</textarea>
        </td>
        <td class="p-2 border account-name-column">
            <textarea class="w-full item-account-name bg-gray-100 resize-none overflow-auto" maxlength="100" disabled autocomplete="off">${detail.freeTxt || ''}</textarea>
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
}

// Function to generate item-specific row HTML (original)
function generateItemRowHTML(detail, index) {
    return `
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
}

// Enhanced populate form data function with service-specific fields
function populateFormData(data) {
    console.log('Complete invoice data:', data);
    console.log('Document type:', documentType);
    
    // Helper function to safely set element value
    function safeSetValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        } else {
            console.warn(`Element with id '${elementId}' not found`);
        }
    }
    
    // Populate common fields (same for both types)
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
    safeSetValue('TaxNo', data.licTradNum || '');
    safeSetValue('U_BSI_ShippingType', data.u_BSI_ShippingType || '');
    safeSetValue('U_BSI_PaymentGroup', data.u_BSI_PaymentGroup || '');
    safeSetValue('U_BSI_Expressiv_IsTransfered', data.u_BSI_Expressiv_IsTransfered || 'N');
    safeSetValue('U_BSI_UDF1', data.u_bsi_udf1 || '');
    safeSetValue('U_BSI_UDF2', data.u_bsi_udf2 || '');
    safeSetValue('account', data.account || '');
    safeSetValue('acctName', data.acctName || '');
    safeSetValue('comments', data.comments || '');
    
    // Populate service-specific fields
    if (documentType === 'service') {
        safeSetValue('U_BSI_UDF3', data.u_bsi_udf3 || ''); // Control Account
    }
    
    // Populate status
    const status = getStatusFromInvoice(data);
    safeSetValue('Status', status);
    
    // Update form controls based on status
    updateSubmitAndRejectVisibility(status);
    
    // Populate approval fields
    if (data.arInvoiceApprovalSummary) {
        populateApprovalFields(data.arInvoiceApprovalSummary);
    }
    
    // Populate financial summary with type-specific formatting
    populateFinancialSummary(data);
    
    // Populate invoice details
    populateInvoiceDetails(data.arInvoiceDetails || []);
    
    // Load attachments
    loadAttachmentsFromData(data.arInvoiceAttachments);
    
    // Enable form controls
    enableSubmitButton();
}

// Function to populate financial summary with service-specific fields
function populateFinancialSummary(data) {
    const currencyCode = data.docCur || 'IDR';
    
    // Helper function to safely set formatted currency value
    function safeSetCurrencyValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = `${currencyCode} ${formatCurrencyIDR(value || '0.00')}`;
        }
    }
    
    // Common financial fields
    safeSetCurrencyValue('docTotal', data.netPrice);
    safeSetCurrencyValue('discSum', data.discSum);
    safeSetCurrencyValue('netPriceAfterDiscount', data.netPriceAfterDiscount);
    safeSetCurrencyValue('dpp1112', data.dpp1112);
    safeSetCurrencyValue('vatSum', data.docTax);
    safeSetCurrencyValue('grandTotal', data.grandTotal);
    
    // Service-specific financial fields
    if (documentType === 'service') {
        safeSetCurrencyValue('wtSum', data.wtSum);
    }
}

// Function to populate approval fields
function populateApprovalFields(approvalSummary) {
    console.log('Approval summary data:', approvalSummary);
    
    // Helper function to safely set approval field
    function safeSetApprovalField(fieldId, value, employeeId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value || '';
            if (employeeId) {
                field.setAttribute('data-employee-id', employeeId);
            }
        }
    }
    
    // Populate approval fields
    safeSetApprovalField('preparedByName', approvalSummary.preparedByName, approvalSummary.preparedBy);
    safeSetApprovalField('acknowledgeByName', approvalSummary.acknowledgedByName, approvalSummary.acknowledgedBy);
    safeSetApprovalField('checkedByName', approvalSummary.checkedByName, approvalSummary.checkedBy);
    safeSetApprovalField('approvedByName', approvalSummary.approvedByName, approvalSummary.approvedBy);
    safeSetApprovalField('receivedByName', approvalSummary.receivedByName, approvalSummary.receivedBy);
    
    // Handle rejection remarks
    if (approvalSummary.approvalStatus === 'Rejected' && approvalSummary.rejectionRemarks) {
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        const rejectionTextarea = document.getElementById('rejectionRemarks');
        
        if (rejectionSection && rejectionTextarea) {
            rejectionSection.style.display = 'block';
            rejectionTextarea.value = approvalSummary.rejectionRemarks;
        }
    } else {
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        if (rejectionSection) {
            rejectionSection.style.display = 'none';
        }
    }
}

// Rest of the functions remain the same as the original code...
// (keeping the existing functions for employees data, file handling, etc.)

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
            
            setupApprovalDropdowns();
            
            if (invoiceData) {
                refreshApprovalDropdowns();
            }
        } else {
            throw new Error('Invalid response format from employees API');
        }
        
    } catch (error) {
        console.error('Error loading employees data:', error);
    }
}

// Load invoice data from API
async function loadInvoiceData(invoiceId) {
    try {
        console.log('loadInvoiceData called with invoiceId:', invoiceId);
        
        const apiUrl = `${API_BASE_URL}/ar-invoices/${invoiceId}/details`;
        console.log('API URL:', apiUrl);
        
        Swal.fire({
            title: 'Loading...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
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
            
            populateFormData(invoiceData);
            
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

// Utility functions
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
    console.log('Invoice arInvoiceApprovalSummary:', invoice.arInvoiceApprovalSummary);
    
    if (invoice.arInvoiceApprovalSummary === null || invoice.arInvoiceApprovalSummary === undefined) {
        console.log('arInvoiceApprovalSummary is null/undefined, returning Draft');
        return 'Draft';
    }
    
    if (invoice.arInvoiceApprovalSummary) {
        const summary = invoice.arInvoiceApprovalSummary;
        console.log('arInvoiceApprovalSummary properties:', summary);
        
        if (summary.approvalStatus && summary.approvalStatus.trim() !== '') {
            console.log('Using approvalStatus from arInvoiceApprovalSummary:', summary.approvalStatus);
            return summary.approvalStatus;
        }
        
        console.log('approvalStatus is empty/null/undefined, returning Draft');
        return 'Draft';
    }
    
    if (invoice.u_BSI_Expressiv_IsTransfered === 'Y') return 'Received';
    if (invoice.stagingID && invoice.stagingID.startsWith('STG')) return 'Draft';
    if (invoice.docNum && invoice.docNum > 0) return 'Prepared';
    
    return 'Draft';
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

// Setup approval dropdowns with employee data
function setupApprovalDropdowns() {
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
    
    select.innerHTML = '<option value="" disabled selected>Choose Name</option>';
    employeesData.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.fullName;
        option.textContent = employee.fullName;
        option.setAttribute('data-employee-id', employee.kansaiEmployeeId || '');
        select.appendChild(option);
    });
    
    input.addEventListener('input', function() {
        const statusField = document.getElementById('Status');
        const currentStatus = statusField ? statusField.value : '';
        
        if (currentStatus !== 'Draft') {
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
        const statusField = document.getElementById('Status');
        const currentStatus = statusField ? statusField.value : '';
        
        if (currentStatus !== 'Draft') {
            dropdown.classList.add('hidden');
            return;
        }
        
        const searchTerm = this.value.toLowerCase();
        const filteredEmployees = employeesData.filter(employee => 
            employee.fullName.toLowerCase().includes(searchTerm)
        );
        
        displayEmployeeDropdown(dropdown, filteredEmployees, input, select);
    });
    
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
                
                input.setAttribute('data-employee-id', employee.kansaiEmployeeId || '');
                select.setAttribute('data-employee-id', employee.kansaiEmployeeId || '');
                
                dropdown.classList.add('hidden');
                
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
            select.innerHTML = '<option value="" disabled selected>Choose Name</option>';
            employeesData.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.fullName;
                option.textContent = employee.fullName;
                option.setAttribute('data-employee-id', employee.kansaiEmployeeId || '');
                select.appendChild(option);
            });
            
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

// Submit invoice data to API
async function submitInvoiceData() {
    try {
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
        
        const submitButton = document.getElementById('submitButton');
        const submitButtonText = document.getElementById('submitButtonText');
        const submitSpinner = document.getElementById('submitSpinner');
        
        submitButton.disabled = true;
        submitButtonText.textContent = 'Updating Status...';
        submitSpinner.classList.remove('hidden');
        
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
        
        const stagingID = invoiceData.stagingID;
        if (!stagingID) {
            throw new Error('Staging ID is required for submission');
        }
        
        const payload = prepareApprovalPayload();
        
        console.log('Submitting approval data:', payload);
        console.log('API URL:', `${API_BASE_URL}/ar-invoices/approval/${stagingID}`);
        
        let success = false;
        let apiResult = null;
        
        try {
            const response = await fetch(`${API_BASE_URL}/ar-invoices/approval/${stagingID}`, {
                method: 'PATCH',
                headers: {
                    'accept': 'text/plain',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                success = true;
                apiResult = await response.json();
                console.log('Success with PATCH method:', apiResult);
            } else {
                console.log('PATCH method failed:', response.status);
                const errorText = await response.text();
                console.error('API Error response:', errorText);
                
                if (response.status === 404) {
                    throw new Error('Approval endpoint not available for this invoice');
                }
                
                let errorDetails = errorText;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorDetails = errorJson.message || errorJson.error || errorText;
                } catch (parseError) {
                    console.error('Could not parse error response as JSON:', parseError);
                }
                
                throw new Error(`API Error: ${response.status} - ${errorDetails}`);
            }
        } catch (error) {
            console.log('PATCH method error:', error);
            throw error;
        }
        
        if (!success) {
            throw new Error('API attempt failed');
        }
        
        console.log('API Response:', apiResult);
        
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
            }
        }
        
        const approvalModified = window.approvalDataModified || false;
        const approvalInfo = approvalModified ? '<p><strong>Approval data has been updated successfully</strong></p>' : '';
        
        const originalStatus = invoiceData.arInvoiceApprovalSummary?.approvalStatus || 'Draft';
        const newStatus = apiResult.approvalStatus || 'Updated';
        const isStatusChangedFromDraftToPrepared = originalStatus === 'Draft' && newStatus === 'Prepared';
        const statusChangeInfo = isStatusChangedFromDraftToPrepared 
            ? '<p><strong>✅ Approval Status Updated:</strong> Draft → Prepared</p>' 
            : '';
        
        const preparedDateInfo = isStatusChangedFromDraftToPrepared 
            ? '<p><strong>📅 Prepared Date Set:</strong> Current timestamp has been recorded</p>' 
            : '';
        
        let uploadInfo = '';
        if (uploadResult && uploadResult.status) {
            const uploadedCount = uploadResult.data ? uploadResult.data.length : 0;
            uploadInfo = `<p><strong>📎 Attachments Uploaded:</strong> ${uploadedCount} file(s) uploaded successfully</p>`;
        } else if (uploadedFiles && uploadedFiles.length > 0) {
            uploadInfo = '<p><strong>⚠️ File Upload:</strong> Files were not uploaded due to an error, but approval data was updated successfully</p>';
        }
        
        Swal.fire({
            icon: 'success',
            title: `${documentType === 'service' ? 'Service' : 'Item'} Invoice Approval Updated Successfully!`,
            html: `
                <div class="text-left">
                    <p><strong>Document Type:</strong> ${documentType.toUpperCase()}</p>
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
            if (invoiceData && invoiceData.stagingID) {
                localStorage.removeItem(`approval_${invoiceData.stagingID}`);
            }
            
            uploadedFiles = [];
            displayFileList();
            
            window.location.reload();
        });
        
    } catch (error) {
        console.error('Error submitting invoice data:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: error.message || 'Failed to submit invoice data. Please try again.',
            confirmButtonText: 'OK'
        });
    } finally {
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
    
    const preparedByName = document.getElementById('preparedByName').value || '';
    const acknowledgeByName = document.getElementById('acknowledgeByName').value || '';
    const checkedByName = document.getElementById('checkedByName').value || '';
    const approvedByName = document.getElementById('approvedByName').value || '';
    const receivedByName = document.getElementById('receivedByName').value || '';
    
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
    
    let newApprovalStatus = invoiceData.arInvoiceApprovalSummary?.approvalStatus || 'Draft';
    const isStatusChangingFromDraftToPrepared = newApprovalStatus === 'Draft';
    
    if (isStatusChangingFromDraftToPrepared) {
        newApprovalStatus = 'Prepared';
        console.log('Approval status automatically updated from Draft to Prepared');
    }
    
    const payload = {
        approvalStatus: newApprovalStatus,
        preparedBy: preparedById,
        checkedBy: checkedById,
        acknowledgedBy: acknowledgedById,
        approvedBy: approvedById,
        receivedBy: receivedById,
        preparedByName: preparedByName,
        checkedByName: checkedByName,
        acknowledgedByName: acknowledgeByName,
        approvedByName: approvedByName,
        receivedByName: receivedByName,
        updatedAt: now
    };
    
    if (isStatusChangingFromDraftToPrepared) {
        payload.preparedDate = now;
        console.log('Added preparedDate to payload:', now);
    }
    
    console.log('Prepared approval payload for submission:', payload);
    return payload;
}

// Apply currency formatting to table cells
function applyCurrencyFormattingToTable() {
    if (documentType === 'service') {
        // Service-specific currency formatting
        const priceInputs = document.querySelectorAll('.item-price');
        priceInputs.forEach(input => {
            input.classList.add('currency-input-idr');
            if (input.value) {
                formatCurrencyInputIDR(input);
            } else {
                input.value = '0.00';
            }
        });
        
        const amountInputs = document.querySelectorAll('.item-line-total');
        amountInputs.forEach(input => {
            input.classList.add('currency-input-idr');
            if (input.value) {
                formatCurrencyInputIDR(input);
            } else {
                input.value = '0.00';
            }
        });
    } else {
        // Item-specific currency formatting (original)
        const pricePerUoMInputs = document.querySelectorAll('.item-sls-price');
        pricePerUoMInputs.forEach(input => {
            input.classList.add('currency-input-idr');
            if (input.value) {
                formatCurrencyInputIDR(input);
            } else {
                input.value = '0.00';
            }
        });

        const pricePerUnitInputs = document.querySelectorAll('.item-price');
        pricePerUnitInputs.forEach(input => {
            input.classList.add('currency-input-idr');
            if (input.value) {
                formatCurrencyInputIDR(input);
            } else {
                input.value = '0.00';
            }
        });

        const amountInputs = document.querySelectorAll('.item-line-total');
        amountInputs.forEach(input => {
            input.classList.add('currency-input-idr');
            if (input.value) {
                formatCurrencyInputIDR(input);
            } else {
                input.value = '0.00';
            }
        });
    }
}

// Helper functions for form control
function updateSubmitAndRejectVisibility(status) {
    const submitButton = document.getElementById('submitButton');
    const submitButtonContainer = submitButton ? submitButton.closest('.text-center') : null;
    const rejectButton = document.getElementById('rejectButton');
    
    if (submitButton && submitButtonContainer) {
        if (status === 'Draft') {
            submitButtonContainer.style.display = 'block';
            submitButton.disabled = false;
            console.log('Submit button shown for Draft status');
        } else {
            submitButtonContainer.style.display = 'none';
            submitButton.disabled = true;
            console.log(`Submit button hidden for status: ${status}`);
        }
    }

    if (rejectButton) {
        if (status === 'Draft') {
            rejectButton.style.display = 'inline-block';
        } else {
            rejectButton.style.display = 'none';
        }
    }
}

function enableSubmitButton() {
    const statusField = document.getElementById('Status');
    const currentStatus = statusField ? statusField.value : '';
    
    updateSubmitAndRejectVisibility(currentStatus);
    updateFormEditability(currentStatus);
}

function updateFormEditability(status) {
    console.log('Updating form editability for status:', status);
    
    const isDraft = status === 'Draft';
    
    updateDocumentStatusIndicator(status, isDraft);
    setApprovalFieldsEditability(isDraft);
    setFileUploadEditability(isDraft);
    setRemarksEditability(isDraft);
    setTableFieldsEditability(isDraft);
    
    console.log(`Form editability updated: ${isDraft ? 'Enabled' : 'Disabled'} for status: ${status}`);
}

function updateDocumentStatusIndicator(status, isEditable) {
    const indicator = document.getElementById('documentStatusIndicator');
    const statusDisplay = document.getElementById('currentStatusDisplay');
    const badge = document.getElementById('readOnlyBadge');
    
    if (!indicator || !statusDisplay || !badge) return;
    
    if (!isEditable) {
        statusDisplay.textContent = status;
        indicator.classList.remove('hidden');
        
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
        indicator.classList.add('hidden');
    }
}

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
            
            if (isEditable) {
                input.classList.remove('bg-gray-100');
                input.classList.add('bg-white');
            } else {
                input.classList.remove('bg-white');
                input.classList.add('bg-gray-100');
            }
        }
    });
}

function setFileUploadEditability(isEditable) {
    const fileInput = document.getElementById('filePath');
    if (fileInput) {
        fileInput.disabled = !isEditable;
        
        if (isEditable) {
            fileInput.classList.remove('bg-gray-100');
            fileInput.classList.add('bg-white');
        } else {
            fileInput.classList.remove('bg-white');
            fileInput.classList.add('bg-gray-100');
        }
    }
    
    const fileUploadSection = document.querySelector('.file-upload-section');
    if (fileUploadSection) {
        if (isEditable) {
            fileUploadSection.style.display = 'block';
        } else {
            fileUploadSection.style.display = 'none';
        }
    }
}

function setRemarksEditability(isEditable) {
    const remarksField = document.getElementById('comments');
    if (remarksField) {
        remarksField.disabled = !isEditable;
        remarksField.readOnly = !isEditable;
        
        if (isEditable) {
            remarksField.classList.remove('bg-gray-100');
            remarksField.classList.add('bg-white');
        } else {
            remarksField.classList.remove('bg-white');
            remarksField.classList.add('bg-gray-100');
        }
    }
}

function setTableFieldsEditability(isEditable) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    const tableInputs = tableBody.querySelectorAll('input, textarea, select');
    
    tableInputs.forEach(element => {
        element.disabled = !isEditable;
        element.readOnly = !isEditable;
        
        if (isEditable) {
            element.classList.remove('bg-gray-100');
            element.classList.add('bg-white');
        } else {
            element.classList.remove('bg-white');
            element.classList.add('bg-gray-100');
        }
    });
}

// File handling functions
function previewPDF(event) {
    const statusField = document.getElementById('Status');
    const currentStatus = statusField ? statusField.value : '';
    
    if (currentStatus !== 'Draft') {
        Swal.fire({
            icon: 'warning',
            title: 'Cannot Upload Files',
            text: 'Files cannot be uploaded because this document status is not "Draft".',
            confirmButtonText: 'OK',
            timer: 3000,
            timerProgressBar: true
        });
        
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
    
    const fileUrl = URL.createObjectURL(file);
    window.open(fileUrl, '_blank');
    
    setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
    }, 1000);
}

// Navigation and other utility functions
function goToMenuARInv() {
    window.location.href = '../pages/menuInvoice.html';
}

function adjustTextareaHeights() {
    const textareas = document.querySelectorAll('.table-container textarea');
    
    textareas.forEach(textarea => {
        const content = textarea.value || textarea.textContent || '';
        const charLength = content.length;
        
        textarea.style.height = '50px';
        textarea.style.minHeight = '50px';
        textarea.style.maxHeight = '50px';
        
        if (charLength > 100) {
            textarea.style.borderRight = '2px solid #3b82f6';
        } else {
            textarea.style.borderRight = '';
        }
        
        textarea.style.verticalAlign = 'middle';
    });
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
        
        const formData = new FormData();
        
        files.forEach((file, index) => {
            console.log(`Adding file ${index + 1}:`, file.name, file.type, file.size);
            formData.append('files', file);
        });
        
        const uploadUrl = `${API_BASE_URL}/ar-invoices/${stagingID}/attachments/upload`;
        console.log('Upload URL:', uploadUrl);
        
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'accept': '*/*'
            },
            body: formData
        });
        
        console.log('Upload response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload API Error response:', errorText);
            
            if (response.status === 404) {
                throw new Error('Upload endpoint not available for this invoice');
            }
            
            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = errorJson.message || errorJson.error || errorText;
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

// Load attachments from the main API response data
function loadAttachmentsFromData(attachments) {
    try {
        console.log('Loading attachments from data:', attachments);
        
        uploadedFiles = [];
        
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            const validAttachments = attachments.filter(attachment => {
                const fileName = attachment.fileName || attachment.file_name;
                return fileName && fileName !== 'string' && fileName.trim() !== '';
            });
            
            if (validAttachments.length > 0) {
                displayExistingAttachments(validAttachments);
            } else {
                showNoExistingAttachments();
            }
        } else {
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

    existingAttachmentsContainer.innerHTML = '';

    if (!attachments || attachments.length === 0) {
        showNoExistingAttachments();
        return;
    }

    attachments.forEach((attachment, index) => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3 shadow-sm hover:shadow-md transition-shadow';
        
        const fileName = attachment.fileName || attachment.file_name || attachment.name || `Attachment ${index + 1}`;
        const fileIcon = getFileIcon(fileName);
        const fileSize = attachment.fileSize || attachment.file_size || attachment.size;
        const formattedFileSize = fileSize ? formatFileSize(fileSize) : '';
        const createdAt = attachment.createdAt || attachment.created_at || attachment.uploadDate || attachment.upload_date;
        const formattedCreatedAt = createdAt ? new Date(createdAt).toLocaleDateString() : '';
        const fileUrl = attachment.fileUrl || attachment.file_url || attachment.filePath || attachment.file_path || attachment.path || '';
        
        const attachmentData = {
            fileName: fileName,
            fileUrl: fileUrl,
            fileSize: fileSize,
            createdAt: createdAt,
            description: attachment.description || attachment.desc || '',
            fileType: attachment.fileType || attachment.contentType || attachment.type || '',
            id: attachment.id || attachment.attachmentId || ''
        };
        
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

// View existing attachment with proper error handling
async function viewExistingAttachment(attachmentJson) {
    try {
        console.log('Viewing existing attachment:', attachmentJson);
        
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
        
        let fullUrl = attachment.fileUrl || attachment.filePath || attachment.path;
        if (!fullUrl) {
            throw new Error('File URL not available');
        }
        
        if (!fullUrl.startsWith('http')) {
            if (fullUrl.startsWith('/api')) {
                const cleanFileUrl = fullUrl.replace('/api', '');
                fullUrl = `${API_BASE_URL}${cleanFileUrl}`;
            } else {
                fullUrl = fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`;
                fullUrl = `${API_BASE_URL}${fullUrl}`;
            }
        }
        
        const fileName = attachment.fileName || attachment.name || 'attachment';
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        if (fileExtension === 'pdf') {
            await showPDFViewerDetail(fullUrl, fileName);
        } else {
            openInNewTabDetail(fullUrl, fileName);
        }
        
    } catch (error) {
        console.error('Error viewing existing attachment:', error);
        
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

// Show PDF in a modal viewer
async function showPDFViewerDetail(pdfUrl, fileName) {
    try {
        Swal.fire({
            title: 'Loading PDF...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

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
                URL.revokeObjectURL(blobUrl);
            }
        });

    } catch (error) {
        console.error('Error loading PDF for viewing:', error);
        
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

// Open in new tab
function openInNewTabDetail(fileUrl, fileName) {
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
    
    const viewUrl = `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}view=1&inline=1`;
    const newWindow = window.open(viewUrl, '_blank', 'noopener,noreferrer');
    
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

// Rejection functionality
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
                initializeWithRejectionPrefix(firstField);
            }
            const field = document.querySelector('#rejectionFieldsContainer textarea');
            if (field) {
                field.addEventListener('input', handleRejectionInput);
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

function initializeWithRejectionPrefix(textarea) {
    const fullName = getCurrentUserFullName();
    const role = 'Prepared';
    const prefix = `[${fullName} - ${role}]: `;
    textarea.value = prefix;
    textarea.dataset.prefixLength = prefix.length;
    textarea.setSelectionRange(prefix.length, prefix.length);
    textarea.focus();
}

function handleRejectionInput(event) {
    const textarea = event.target;
    const prefixLength = parseInt(textarea.dataset.prefixLength || '0');
    const fullName = getCurrentUserFullName();
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
            rejectedByName: getCurrentUserFullName(),
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
            title: `${documentType === 'service' ? 'Service' : 'Item'} Invoice Rejected`,
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

// Helper to get current user full name
function getCurrentUserFullName() {
    try {
        const preparedByInput = document.getElementById('preparedByName');
        const preparedByFromInput = preparedByInput?.value?.trim();
        if (preparedByFromInput) return preparedByFromInput;

        const preparedByFromData = invoiceData?.arInvoiceApprovalSummary?.preparedByName;
        if (preparedByFromData && String(preparedByFromData).trim() !== '') return preparedByFromData;

        try {
            const loggedStr = localStorage.getItem('loggedInUser');
            if (loggedStr) {
                const logged = JSON.parse(loggedStr);
                if (logged?.name) return logged.name;
                if (logged?.fullName) return logged.fullName;
                if (logged?.username) return logged.username;
            }
        } catch {}

        const user = currentUser || (typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null);
        if (user) {
            return (
                user.name || user.fullName || user.username || user.userId || 'Unknown User'
            );
        }

        return 'Unknown User';
    } catch (e) {
        return 'Unknown User';
    }
}

// Setup event listeners for approval inputs
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
                const statusField = document.getElementById('Status');
                const currentStatus = statusField ? statusField.value : '';
                
                if (currentStatus !== 'Draft') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Cannot Edit',
                        text: 'This document cannot be edited because its status is not "Draft".',
                        confirmButtonText: 'OK',
                        timer: 3000,
                        timerProgressBar: true
                    });
                    
                    this.value = this.getAttribute('data-original-value') || '';
                    return;
                }
                
                window.approvalDataModified = true;
                console.log(`Approval data modified: ${inputId} = ${this.value}`);
                
                if (this.value.trim()) {
                    const selectedEmployee = employeesData.find(emp => 
                        emp.fullName.toLowerCase() === this.value.toLowerCase()
                    );
                    
                    if (selectedEmployee) {
                        this.setAttribute('data-employee-id', selectedEmployee.kansaiEmployeeId || '');
                    } else {
                        this.setAttribute('data-employee-id', '');
                    }
                } else {
                    this.setAttribute('data-employee-id', '');
                }
                
                saveApprovalDataToLocalStorage();
                showApprovalModifiedNotification();
            });
            
            input.addEventListener('focus', function() {
                this.setAttribute('data-original-value', this.value);
            });
        }
    });
}

// Setup event listeners for other form fields
function setupOtherFieldListeners() {
    const commentsField = document.getElementById('comments');
    if (commentsField) {
        commentsField.addEventListener('input', function() {
            const statusField = document.getElementById('Status');
            const currentStatus = statusField ? statusField.value : '';
            
            if (currentStatus !== 'Draft') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Cannot Edit',
                    text: 'Remarks cannot be edited because this document status is not "Draft".',
                    confirmButtonText: 'OK',
                    timer: 3000,
                    timerProgressBar: true
                });
                
                this.value = this.getAttribute('data-original-value') || '';
                return;
            }
        });
        
        commentsField.addEventListener('focus', function() {
            this.setAttribute('data-original-value', this.value);
        });
    }
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
}

// Show notification when approval data is modified
function showApprovalModifiedNotification() {
    const existingNotification = document.getElementById('approvalModifiedNotification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
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
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Currency input formatting helper
function formatCurrencyInputIDR(input) {
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

    const numValue = parseFloat(value.replace(/,/g, '')) || 0;
    const formattedValue = formatCurrencyIDR(numValue);

    input.value = formattedValue;

    const newLength = input.value.length;
    const newCursorPos = cursorPos + (newLength - originalLength);
    input.setSelectionRange(Math.max(0, newCursorPos), Math.max(0, newCursorPos));
}

// Global function to add CSS for service-specific columns
function addServiceSpecificCSS() {
    if (documentType === 'service') {
        const style = document.createElement('style');
        style.textContent = `
            .wtax-column {
                width: 80px !important;
                min-width: 80px !important;
            }
            
            .account-name-column {
                width: 150px !important;
                min-width: 150px !important;
            }
            
            .item-account-name {
                vertical-align: middle !important;
                height: 50px !important;
                min-height: 50px !important;
                max-height: 50px !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize service-specific CSS when document type is determined
if (documentType === 'service') {
    document.addEventListener('DOMContentLoaded', addServiceSpecificCSS);
}