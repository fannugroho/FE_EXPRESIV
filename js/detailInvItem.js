// Global variables
let invoiceData = null;
let currentUser = null;
let employeesData = []; // Add this to store employee data

// File upload variables
let uploadedFiles = [];

// API Configuration
const API_BASE_URL = `${BASE_URL}/api`;

// Log API configuration on page load
console.log('🔗 API Configuration:');
console.log('🔗 BASE_URL:', BASE_URL);
console.log('🔗 API_BASE_URL:', API_BASE_URL);
console.log('🔗 Full API endpoints that will be accessed:');
console.log('🔗 - GET /api/ar-invoices/{invoiceId}/details');
console.log('🔗 - GET /api/employees');
console.log('🔗 - PATCH /api/ar-invoices/approval/{stagingID}');
console.log('🔗 - POST /api/ar-invoices/{stagingID}/attachments/upload');
console.log('🔗 - GET /api/ar-invoices/{stagingID}/attachments (if exists)');

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
document.addEventListener('DOMContentLoaded', function () {
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
        console.log('👥 loadEmployeesData called');
        console.log('🔗 API_BASE_URL:', API_BASE_URL);

        const employeesEndpoint = `${API_BASE_URL}/employees`;
        console.log('📡 Employees API endpoint:', employeesEndpoint);
        console.log('📡 Full URL to test manually:', employeesEndpoint);
        console.log('📋 Request Method: GET');
        console.log('📋 Request Headers:', {
            'accept': '*/*',
            'Content-Type': 'application/json'
        });
        console.log('📋 cURL command for manual testing:');
        console.log(`curl -X GET "${employeesEndpoint}" -H "accept: */*" -H "Content-Type: application/json"`);

        const response = await fetch(employeesEndpoint, {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'Content-Type': 'application/json'
            }
        });

        console.log('👥 Employees API response status:', response.status);
        console.log('👥 Employees API response status text:', response.statusText);
        console.log('👥 Employees API response headers:', Object.fromEntries(response.headers.entries()));
        console.log('👥 Employees API response URL:', response.url);
        console.log('👥 Employees API response type:', response.type);
        console.log('👥 Employees API response ok:', response.ok);

        if (!response.ok) {
            if (response.status === 404) {
                console.warn('⚠️ Employees API endpoint not found (404) - continuing without employee data');
                console.warn('⚠️ This endpoint might not exist yet or have a different path');
                console.warn('⚠️ Manual test URL:', employeesEndpoint);
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('📥 Parsing employees response as JSON...');
        const result = await response.json();
        console.log('👥 Employees API response:', result);
        console.log('👥 Response structure keys:', Object.keys(result));
        console.log('👥 Response status field:', result.status);
        console.log('👥 Response has data field:', !!result.data);

        if (result.status && result.data) {
            employeesData = result.data;
            console.log('✅ Employees data loaded:', employeesData);
            console.log('👥 Total employees loaded:', employeesData.length);

            if (employeesData.length > 0) {
                console.log('👥 Sample employee data:', employeesData[0]);
                console.log('👥 Employee data fields:', Object.keys(employeesData[0] || {}));
            }

            // Setup approval dropdowns with employee data
            console.log('🔽 Setting up approval dropdowns with employee data...');
            setupApprovalDropdowns();

            // If form is already populated, refresh the dropdowns
            if (invoiceData) {
                console.log('🔄 Form already populated, refreshing approval dropdowns...');
                refreshApprovalDropdowns();
            }
        } else {
            console.error('❌ Invalid response format from employees API');
            console.error('❌ Expected: result.status && result.data');
            console.error('❌ Actual: result.status =', result.status, 'result.data =', !!result.data);
            console.error('❌ Manual test URL:', employeesEndpoint);
            throw new Error('Invalid response format from employees API');
        }

    } catch (error) {
        console.error('💥 Error loading employees data:', error);
        console.error('💥 Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        console.error('💥 Manual test URL:', `${API_BASE_URL}/employees`);
        // Don't show error to user as this is not critical for main functionality
        // Just log the error and continue
        console.log('⚠️ Continuing without employee data due to error');
    }
}

// Setup approval dropdowns with employee data
function setupApprovalDropdowns() {
    console.log('🔽 setupApprovalDropdowns called');
    console.log('👥 Available employees data:', employeesData);
    console.log('👥 Employees data length:', employeesData ? employeesData.length : 'null/undefined');

    // Setup dropdowns for acknowledge, check, approve, and receive (excluding prepared by)
    const approvalFields = [
        { inputId: 'acknowledgeByName', dropdownId: 'acknowledgeBySelectDropdown', selectId: 'acknowledgeBy' },
        { inputId: 'checkedByName', dropdownId: 'checkedBySelectDropdown', selectId: 'checkedBy' },
        { inputId: 'approvedByName', dropdownId: 'approvedBySelectDropdown', selectId: 'approvedBy' },
        { inputId: 'receivedByName', dropdownId: 'receivedBySelectDropdown', selectId: 'receivedBy' }
    ];

    console.log('🔽 Approval fields to setup:', approvalFields);

    approvalFields.forEach((field, index) => {
        console.log(`🔽 Setting up dropdown ${index + 1}:`, field);
        setupEmployeeDropdown(field.inputId, field.dropdownId, field.selectId);
    });

    console.log('✅ Approval dropdowns setup completed with employee data');
}

// Setup individual employee dropdown
function setupEmployeeDropdown(inputId, dropdownId, selectId) {
    console.log(`🔽 setupEmployeeDropdown called for:`, { inputId, dropdownId, selectId });

    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const select = document.getElementById(selectId);

    if (!input || !dropdown || !select) {
        console.warn(`⚠️ Missing elements for dropdown setup: ${inputId}`);
        console.warn(`⚠️ Input element found:`, !!input);
        console.warn(`⚠️ Dropdown element found:`, !!dropdown);
        console.warn(`⚠️ Select element found:`, !!select);
        return;
    }

    console.log(`✅ All elements found for ${inputId}`);

    // Populate select options
    console.log(`🔽 Populating select options for ${selectId} with ${employeesData.length} employees`);
    select.innerHTML = '<option value="" disabled selected>Choose Name</option>';

    employeesData.forEach((employee, index) => {
        const option = document.createElement('option');
        option.value = employee.fullName;
        option.textContent = employee.fullName;
        option.setAttribute('data-employee-id', employee.kansaiEmployeeId || '');
        select.appendChild(option);

        if (index < 3) { // Log first 3 employees for debugging
            console.log(`🔽 Added employee option ${index + 1}:`, {
                fullName: employee.fullName,
                employeeId: employee.kansaiEmployeeId
            });
        }
    });

    console.log(`✅ Select options populated for ${selectId}`);

    // Setup input event listeners
    input.addEventListener('input', function () {
        console.log(`🔽 Input event triggered for ${inputId}, value:`, this.value);

        // Check if document is editable
        const statusField = document.getElementById('Status');
        const currentStatus = statusField ? statusField.value : '';
        console.log(`📊 Current document status:`, currentStatus);

        if (currentStatus !== 'Draft') {
            console.log(`⚠️ Document not editable (status: ${currentStatus}), hiding dropdown`);
            // If not Draft, hide dropdown and don't filter
            dropdown.classList.add('hidden');
            return;
        }

        const searchTerm = this.value.toLowerCase();
        console.log(`🔍 Searching for employees with term:`, searchTerm);

        const filteredEmployees = employeesData.filter(employee =>
            employee.fullName.toLowerCase().includes(searchTerm)
        );

        console.log(`🔍 Found ${filteredEmployees.length} matching employees`);
        if (filteredEmployees.length > 0) {
            console.log(`🔍 First few matches:`, filteredEmployees.slice(0, 3).map(e => e.fullName));
        }

        displayEmployeeDropdown(dropdown, filteredEmployees, input, select);
    });

    input.addEventListener('focus', function () {
        console.log(`🔽 Focus event triggered for ${inputId}`);

        // Check if document is editable
        const statusField = document.getElementById('Status');
        const currentStatus = statusField ? statusField.value : '';
        console.log(`📊 Current document status on focus:`, currentStatus);

        if (currentStatus !== 'Draft') {
            console.log(`⚠️ Document not editable (status: ${currentStatus}), hiding dropdown on focus`);
            // If not Draft, hide dropdown and don't filter
            dropdown.classList.add('hidden');
            return;
        }

        const searchTerm = this.value.toLowerCase();
        console.log(`🔍 Focus search for employees with term:`, searchTerm);

        const filteredEmployees = employeesData.filter(employee =>
            employee.fullName.toLowerCase().includes(searchTerm)
        );

        console.log(`🔍 Focus search found ${filteredEmployees.length} matching employees`);

        displayEmployeeDropdown(dropdown, filteredEmployees, input, select);
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            console.log(`🔽 Click outside detected for ${inputId}, hiding dropdown`);
            dropdown.classList.add('hidden');
        }
    });

    console.log(`✅ Employee dropdown setup completed for ${inputId}`);
}

// Display employee dropdown with filtered results
function displayEmployeeDropdown(dropdown, employees, input, select) {
    console.log(`🔽 displayEmployeeDropdown called with:`, {
        dropdownElement: !!dropdown,
        employeesCount: employees ? employees.length : 'null/undefined',
        inputElement: !!input,
        selectElement: !!select
    });

    dropdown.innerHTML = '';

    if (employees.length === 0) {
        console.log(`⚠️ No employees found, showing "no results" message`);
        dropdown.innerHTML = '<div class="dropdown-item no-results">No employees found</div>';
    } else {
        console.log(`🔽 Displaying ${employees.length} employees in dropdown`);

        employees.forEach((employee, index) => {
            console.log(`🔽 Creating dropdown item ${index + 1} for employee:`, employee.fullName);

            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `
                <div class="flex items-center">
                    <span class="font-medium">${employee.fullName}</span>
                </div>
            `;

            item.addEventListener('click', function () {
                console.log(`🔽 Employee selected:`, employee.fullName);
                console.log(`🔽 Employee ID:`, employee.kansaiEmployeeId);

                input.value = employee.fullName;
                select.value = employee.fullName;

                // Store employee ID in a data attribute for later use
                input.setAttribute('data-employee-id', employee.kansaiEmployeeId || '');
                select.setAttribute('data-employee-id', employee.kansaiEmployeeId || '');

                console.log(`✅ Employee data stored:`, {
                    name: employee.fullName,
                    id: employee.kansaiEmployeeId
                });

                dropdown.classList.add('hidden');
                console.log(`🔽 Dropdown hidden after selection`);

                // Trigger input event to mark as modified
                console.log(`🔽 Triggering input event to mark as modified`);
                input.dispatchEvent(new Event('input'));
            });

            dropdown.appendChild(item);
            console.log(`✅ Dropdown item ${index + 1} added for:`, employee.fullName);
        });
    }

    dropdown.classList.remove('hidden');
    console.log(`✅ Employee dropdown displayed with ${employees.length} items`);
}

// Refresh approval dropdowns when employee data is loaded after form population
function refreshApprovalDropdowns() {
    console.log('🔄 refreshApprovalDropdowns called');
    console.log('👥 Available employees data:', employeesData);
    console.log('👥 Employees data length:', employeesData ? employeesData.length : 'null/undefined');

    const approvalFields = [
        { inputId: 'acknowledgeByName', selectId: 'acknowledgeBy' },
        { inputId: 'checkedByName', selectId: 'checkedBy' },
        { inputId: 'approvedByName', selectId: 'approvedBy' },
        { inputId: 'receivedByName', selectId: 'receivedBy' }
    ];

    console.log('🔽 Approval fields to refresh:', approvalFields);

    approvalFields.forEach((field, index) => {
        console.log(`🔄 Refreshing dropdown ${index + 1}:`, field);

        const input = document.getElementById(field.inputId);
        const select = document.getElementById(field.selectId);

        if (input && select) {
            console.log(`✅ Found elements for ${field.inputId}`);

            // Update select options with employee data
            console.log(`🔽 Updating select options for ${field.selectId}`);
            select.innerHTML = '<option value="" disabled selected>Choose Name</option>';

            employeesData.forEach((employee, empIndex) => {
                const option = document.createElement('option');
                option.value = employee.fullName;
                option.textContent = employee.fullName;
                option.setAttribute('data-employee-id', employee.kansaiEmployeeId || '');
                select.appendChild(option);

                if (empIndex < 3) { // Log first 3 employees for debugging
                    console.log(`🔽 Added employee option ${empIndex + 1} for ${field.selectId}:`, {
                        fullName: employee.fullName,
                        employeeId: employee.kansaiEmployeeId
                    });
                }
            });

            console.log(`✅ Select options updated for ${field.selectId}`);

            // If input has a value, try to find and set the corresponding employee ID
            if (input.value) {
                console.log(`🔍 Input ${field.inputId} has value:`, input.value);
                const selectedEmployee = employeesData.find(emp => emp.fullName === input.value);
                if (selectedEmployee) {
                    input.setAttribute('data-employee-id', selectedEmployee.kansaiEmployeeId || '');
                    select.setAttribute('data-employee-id', selectedEmployee.kansaiEmployeeId || '');
                    console.log(`✅ Found and stored employee ID for ${field.inputId}:`, selectedEmployee.kansaiEmployeeId);
                } else {
                    console.log(`⚠️ No employee found for name: ${input.value}`);
                    input.setAttribute('data-employee-id', '');
                    select.setAttribute('data-employee-id', '');
                }
            } else {
                console.log(`📝 Input ${field.inputId} has no value`);
            }
        } else {
            console.warn(`⚠️ Missing elements for ${field.inputId}:`, {
                inputFound: !!input,
                selectFound: !!select
            });
        }
    });

    console.log('✅ Approval dropdowns refresh completed');
}

// Load invoice data from API
async function loadInvoiceData(invoiceId) {
    try {
        console.log('🚀 loadInvoiceData called with invoiceId:', invoiceId);
        console.log('🔗 API_BASE_URL:', API_BASE_URL);

        // Construct API URL
        const apiUrl = `${API_BASE_URL}/ar-invoices/${invoiceId}/details`;
        console.log('📡 Full API URL:', apiUrl);
        console.log('📡 Full URL to test manually:', apiUrl);
        console.log('📋 Request Method: GET');
        console.log('📋 Request Headers:', {
            'accept': 'text/plain',
            'Content-Type': 'application/json'
        });
        console.log('📋 cURL command for manual testing:');
        console.log(`curl -X GET "${apiUrl}" -H "accept: text/plain" -H "Content-Type: application/json"`);
        console.log('📋 Postman/Insomnia collection:');
        console.log(`GET ${apiUrl}`);
        console.log('Headers:');
        console.log('  accept: text/plain');
        console.log('  Content-Type: application/json');

        // Show loading indicator
        Swal.fire({
            title: 'Loading...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        console.log('⏳ Starting API request...');
        const startTime = Date.now();

        // Fetch data from API
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            }
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log('✅ API Response received in', responseTime, 'ms');
        console.log('📊 Response status:', response.status);
        console.log('📊 Response status text:', response.statusText);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('📊 Response URL:', response.url);
        console.log('📊 Response type:', response.type);
        console.log('📊 Response ok:', response.ok);

        if (!response.ok) {
            console.error('❌ API request failed with status:', response.status);
            console.error('❌ Manual test URL:', apiUrl);
            console.error('❌ cURL command for debugging:');
            console.error(`curl -X GET "${apiUrl}" -H "accept: text/plain" -H "Content-Type: application/json" -v`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('📥 Parsing response as JSON...');
        const result = await response.json();
        console.log('📋 Raw API response result:', result);
        console.log('📋 Response structure keys:', Object.keys(result));
        console.log('📋 Response status field:', result.status);
        console.log('📋 Response has data field:', !!result.data);

        if (result.status && result.data) {
            invoiceData = result.data;
            console.log('💾 Invoice data loaded from API:', invoiceData);
            console.log('📊 Invoice data structure:', {
                stagingID: invoiceData.stagingID,
                docNum: invoiceData.docNum,
                cardCode: invoiceData.cardCode,
                cardName: invoiceData.cardName,
                docDate: invoiceData.docDate,
                docDueDate: invoiceData.docDueDate,
                docCur: invoiceData.docCur,
                netPrice: invoiceData.netPrice,
                grandTotal: invoiceData.grandTotal,
                hasApprovalSummary: !!invoiceData.arInvoiceApprovalSummary,
                hasInvoiceDetails: !!invoiceData.arInvoiceDetails,
                hasAttachments: !!invoiceData.arInvoiceAttachments,
                approvalStatus: invoiceData.arInvoiceApprovalSummary?.approvalStatus || 'N/A',
                detailsCount: invoiceData.arInvoiceDetails?.length || 0,
                attachmentsCount: invoiceData.arInvoiceAttachments?.length || 0
            });

            // Log approval summary details if available
            if (invoiceData.arInvoiceApprovalSummary) {
                console.log('👥 Approval Summary Data:', {
                    approvalStatus: invoiceData.arInvoiceApprovalSummary.approvalStatus,
                    preparedBy: invoiceData.arInvoiceApprovalSummary.preparedBy,
                    preparedByName: invoiceData.arInvoiceApprovalSummary.preparedByName,
                    checkedBy: invoiceData.arInvoiceApprovalSummary.checkedBy,
                    checkedByName: invoiceData.arInvoiceApprovalSummary.checkedByName,
                    acknowledgedBy: invoiceData.arInvoiceApprovalSummary.acknowledgedBy,
                    acknowledgedByName: invoiceData.arInvoiceApprovalSummary.acknowledgedByName,
                    approvedBy: invoiceData.arInvoiceApprovalSummary.approvedBy,
                    approvedByName: invoiceData.arInvoiceApprovalSummary.approvedByName,
                    receivedBy: invoiceData.arInvoiceApprovalSummary.receivedBy,
                    receivedByName: invoiceData.arInvoiceApprovalSummary.receivedByName,
                    preparedDate: invoiceData.arInvoiceApprovalSummary.preparedDate,
                    checkedDate: invoiceData.arInvoiceApprovalSummary.checkedDate,
                    acknowledgedDate: invoiceData.arInvoiceApprovalSummary.acknowledgedDate,
                    approvedDate: invoiceData.arInvoiceApprovalSummary.approvedDate,
                    receivedDate: invoiceData.arInvoiceApprovalSummary.receivedDate
                });
            } else {
                console.log('⚠️ No approval summary data found in response');
            }

            // Log invoice details if available
            if (invoiceData.arInvoiceDetails && invoiceData.arInvoiceDetails.length > 0) {
                console.log('📋 Invoice Details Data:', {
                    totalDetails: invoiceData.arInvoiceDetails.length,
                    sampleDetail: invoiceData.arInvoiceDetails[0],
                    detailFields: Object.keys(invoiceData.arInvoiceDetails[0] || {})
                });
            } else {
                console.log('⚠️ No invoice details found in response');
            }

            // Log attachments if available
            if (invoiceData.arInvoiceAttachments && invoiceData.arInvoiceAttachments.length > 0) {
                console.log('📎 Invoice Attachments Data:', {
                    totalAttachments: invoiceData.arInvoiceAttachments.length,
                    sampleAttachment: invoiceData.arInvoiceAttachments[0],
                    attachmentFields: Object.keys(invoiceData.arInvoiceAttachments[0] || {})
                });
            } else {
                console.log('⚠️ No attachments found in response');
            }

            // Populate form with data
            console.log('🔄 Starting form population...');
            populateFormData(invoiceData);

            // Populate invoice details table
            if (invoiceData.arInvoiceDetails && invoiceData.arInvoiceDetails.length > 0) {
                console.log('📊 Populating invoice details table...');
                populateInvoiceDetails(invoiceData.arInvoiceDetails);
            }

            // Load attachments from the main response
            console.log('📎 Loading attachments from API response...');
            console.log('📎 Attachments data:', invoiceData.arInvoiceAttachments);
            loadAttachmentsFromData(invoiceData.arInvoiceAttachments);

            // Close loading indicator
            Swal.close();
            console.log('✅ Invoice data loading completed successfully');
        } else {
            console.error('❌ Invalid response format from API');
            console.error('❌ Expected: result.status && result.data');
            console.error('❌ Actual: result.status =', result.status, 'result.data =', !!result.data);
            console.error('❌ Manual test URL:', apiUrl);
            console.error('❌ cURL command for debugging:');
            console.error(`curl -X GET "${apiUrl}" -H "accept: text/plain" -H "Content-Type: application/json" -v`);
            throw new Error('Invalid response format from API');
        }

    } catch (error) {
        console.error('💥 Error loading invoice data:', error);
        console.error('💥 Error name:', error.name);
        console.error('💥 Error message:', error.message);
        console.error('💥 Error stack:', error.stack);

        let errorMessage = 'Failed to load invoice data';

        if (error.message.includes('404')) {
            errorMessage = 'Invoice not found. Please check the invoice identifier.';
            console.warn('⚠️ Invoice not found (404) - this might be expected for new invoices');
            console.warn('⚠️ Manual test URL:', `${API_BASE_URL}/ar-invoices/${invoiceId}/details`);
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
            console.error('💥 Server error (500) detected');
            console.error('💥 Manual test URL:', `${API_BASE_URL}/ar-invoices/${invoiceId}/details`);
        } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network error. Please check your connection.';
            console.error('💥 Network error detected');
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your connection.';
            console.error('💥 Fetch API error detected');
        } else {
            errorMessage = `Failed to load invoice data: ${error.message}`;
            console.error('💥 Unknown error type:', error.message);
        }

        // Close loading indicator if it's still open
        if (Swal.isVisible()) {
            Swal.close();
        }

        // Show error message to user
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage,
            confirmButtonText: 'OK'
        });
    }
}

// Populate form with invoice data
function populateFormData(data) {
    // Debug: Log the complete data structure
    console.log('🔄 populateFormData called with data:', data);
    console.log('📊 Track number:', data.trackNo);
    console.log('📊 Invoice number:', data.u_bsi_invnum);
    console.log('📊 Staging ID:', data.stagingID);
    console.log('📊 Document number:', data.docNum);
    console.log('📊 Customer code:', data.cardCode);
    console.log('📊 Customer name:', data.cardName);

    // Helper function to safely set element value
    function safeSetValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
            console.log(`✅ Set ${elementId} = "${value}"`);
        } else {
            console.warn(`⚠️ Element with id '${elementId}' not found`);
        }
    }

    // Helper function to safely set element attribute
    function safeSetAttribute(elementId, attribute, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.setAttribute(attribute, value);
            console.log(`✅ Set ${elementId}.${attribute} = "${value}"`);
        } else {
            console.warn(`⚠️ Element with id '${elementId}' not found`);
        }
    }

    console.log('📝 Starting to populate header fields...');

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

    console.log('📝 Header fields populated successfully');

    // Populate status from approval summary
    const status = getStatusFromInvoice(data);
    console.log('📊 Determined invoice status:', status);
    console.log('📊 API data status fields:', {
        approvalStatus: data.arInvoiceApprovalSummary?.approvalStatus,
        directStatus: data.status,
        docStatus: data.docStatus,
        transferStatus: data.u_BSI_Expressiv_IsTransfered,
        stagingID: data.stagingID,
        docNum: data.docNum
    });
    safeSetValue('Status', status);

    // Check if submit button should be shown based on status
    updateSubmitAndRejectVisibility(status);
    console.log('🔘 Submit/reject button visibility updated for status:', status);

    // Populate approval fields from approval summary - make them editable
    if (data.arInvoiceApprovalSummary) {
        console.log('👥 Populating approval summary data:', data.arInvoiceApprovalSummary);

        // Populate prepared by name (disabled as requested)
        const preparedByNameField = document.getElementById('preparedByName');
        if (preparedByNameField) {
            const preparedByNameValue = data.arInvoiceApprovalSummary.preparedByName || '';
            preparedByNameField.value = preparedByNameValue;
            console.log('✅ Prepared by name from API:', data.arInvoiceApprovalSummary.preparedByName);
            console.log('✅ Prepared by name field value:', preparedByNameField.value);
            console.log('✅ Prepared by name field disabled:', preparedByNameField.disabled);
        } else {
            console.warn('⚠️ Element with id "preparedByName" not found');
        }

        // Populate other approval fields (acknowledge, check, approve, receive)
        const acknowledgeByNameField = document.getElementById('acknowledgeByName');
        const checkedByNameField = document.getElementById('checkedByName');
        const approvedByNameField = document.getElementById('approvedByName');
        const receivedByNameField = document.getElementById('receivedByName');

        if (acknowledgeByNameField) {
            acknowledgeByNameField.value = data.arInvoiceApprovalSummary.acknowledgedByName || '';
            console.log('✅ Acknowledge by name set:', data.arInvoiceApprovalSummary.acknowledgedByName);
        }
        if (checkedByNameField) {
            checkedByNameField.value = data.arInvoiceApprovalSummary.checkedByName || '';
            console.log('✅ Checked by name set:', data.arInvoiceApprovalSummary.checkedByName);
        }
        if (approvedByNameField) {
            approvedByNameField.value = data.arInvoiceApprovalSummary.approvedByName || '';
            console.log('✅ Approved by name set:', data.arInvoiceApprovalSummary.approvedByName);
        }
        if (receivedByNameField) {
            receivedByNameField.value = data.arInvoiceApprovalSummary.receivedByName || '';
            console.log('✅ Received by name set:', data.arInvoiceApprovalSummary.receivedByName);
        }

        // Store employee IDs from API data
        if (acknowledgeByNameField) {
            acknowledgeByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.acknowledgedBy || '');
            console.log('✅ Acknowledge by ID stored:', data.arInvoiceApprovalSummary.acknowledgedBy);
        }
        if (checkedByNameField) {
            checkedByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.checkedBy || '');
            console.log('✅ Checked by ID stored:', data.arInvoiceApprovalSummary.checkedBy);
        }
        if (approvedByNameField) {
            approvedByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.approvedBy || '');
            console.log('✅ Approved by ID stored:', data.arInvoiceApprovalSummary.approvedBy);
        }
        if (receivedByNameField) {
            receivedByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.receivedBy || '');
            console.log('✅ Received by ID stored:', data.arInvoiceApprovalSummary.receivedBy);
        }
        if (preparedByNameField) {
            preparedByNameField.setAttribute('data-employee-id', data.arInvoiceApprovalSummary.preparedBy || '');
            console.log('✅ Prepared by ID stored:', data.arInvoiceApprovalSummary.preparedBy);
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

        console.log('💾 Stored employee IDs from API:', {
            acknowledgedBy: data.arInvoiceApprovalSummary.acknowledgedBy,
            checkedBy: data.arInvoiceApprovalSummary.checkedBy,
            approvedBy: data.arInvoiceApprovalSummary.approvedBy,
            receivedBy: data.arInvoiceApprovalSummary.receivedBy,
            preparedBy: data.arInvoiceApprovalSummary.preparedBy
        });

        // Handle rejection details if status is Rejected
        if (data.arInvoiceApprovalSummary.approvalStatus === 'Rejected') {
            const rejectionSection = document.getElementById('rejectionDetailsSection');
            const rejectionTextarea = document.getElementById('rejectionRemarks');

            if (rejectionSection && rejectionTextarea) {
                rejectionSection.style.display = 'block';
                rejectionTextarea.value = data.arInvoiceApprovalSummary.rejectionRemarks || '';
                
                // Fill rejected invoice details
                const setElementText = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) element.textContent = value || '-';
                };
                
                setElementText('rejectedInvoiceNumber', data.u_bsi_invnum || data.docNum);
                setElementText('rejectedCustomerName', data.cardName);
                setElementText('rejectedInvoiceDate', formatDate(data.docDate));
                setElementText('rejectedDueDate', formatDate(data.docDueDate));
                setElementText('rejectedCurrency', data.docCur || 'IDR');
                setElementText('rejectedSubtotal', formatCurrencyIDR(data.netPrice || data.docTotal));
                setElementText('rejectedTaxAmount', formatCurrencyIDR(data.vatSum || data.taxTotal));
                setElementText('rejectedTotalAmount', formatCurrencyIDR(data.grandTotal || data.total));
                setElementText('rejectedByName', data.arInvoiceApprovalSummary.rejectedByName);
                setElementText('rejectedDate', formatDate(data.arInvoiceApprovalSummary.rejectedDate));
                
                console.log('✅ Rejection details displayed');
            } else {
                console.warn('⚠️ Rejection details section elements not found');
            }
        } else {
            // Hide the rejection details section if status is not Rejected
            const rejectionSection = document.getElementById('rejectionDetailsSection');
            if (rejectionSection) {
                rejectionSection.style.display = 'none';
                console.log('✅ Rejection details section hidden (status not Rejected)');
            }
        }
    } else {
        console.log('⚠️ No approval summary data found');
    }

    // Try to load saved approval data from localStorage
    console.log('💾 Loading approval data from localStorage...');
    loadApprovalDataFromLocalStorage();

    // Get currency code
    const currencyCode = data.docCur || 'IDR';
    console.log('💰 Currency code:', currencyCode);

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

    console.log('💰 Field mapping details:');
    console.log('💰 - API netPrice:', data.netPrice, '-> HTML field: netPrice');
    console.log('💰 - API discSum:', data.discSum, '-> HTML field: discSum');
    console.log('💰 - API netPriceAfterDiscount:', data.netPriceAfterDiscount, '-> HTML field: netPriceAfterDiscount');
    console.log('💰 - API dpp1112:', data.dpp1112, '-> HTML field: dpp1112');
    console.log('💰 - API docTax:', data.docTax, '-> HTML field: vatSum');
    console.log('💰 - API grandTotal:', data.grandTotal, '-> HTML field: grandTotal');

    // Verify HTML fields exist before setting values
    console.log('🔍 Verifying HTML fields exist:');
    console.log('🔍 - netPrice field found:', !!document.getElementById('netPrice'));
    console.log('🔍 - discSum field found:', !!document.getElementById('discSum'));
    console.log('🔍 - netPriceAfterDiscount field found:', !!document.getElementById('netPriceAfterDiscount'));
    console.log('🔍 - dpp1112 field found:', !!document.getElementById('dpp1112'));
    console.log('🔍 - vatSum field found:', !!document.getElementById('vatSum'));
    console.log('🔍 - grandTotal field found:', !!document.getElementById('grandTotal'));

    // 1. Total (totalAmount) - API Field: "docCur" "netPrice" -> HTML ID: "netPrice"
    const totalValue = `${currencyCode} ${formatCurrencyIDR(data.netPrice || '0.00')}`;
    console.log('💰 Setting netPrice field to:', totalValue);
    safeSetValue('netPrice', totalValue);

    // 2. Discounted (discountAmount) - API Field: "docCur" "discSum" -> HTML ID: "discSum"
    const discountedValue = `${currencyCode} ${formatCurrencyIDR(data.discSum || '0.00')}`;
    console.log('💰 Setting discSum field to:', discountedValue);
    safeSetValue('discSum', discountedValue);

    // 3. Sales Amount (salesAmount) - API Field: "docCur" "netPriceAfterDiscount" -> HTML ID: "netPriceAfterDiscount"
    const salesValue = `${currencyCode} ${formatCurrencyIDR(data.netPriceAfterDiscount || '0.00')}`;
    console.log('💰 Setting netPriceAfterDiscount field to:', salesValue);
    safeSetValue('netPriceAfterDiscount', salesValue);

    // 4. Tax Base Other Value (taxBase) - API Field: "dpp1112" -> HTML ID: "dpp1112"
    const taxBaseValue = `${currencyCode} ${formatCurrencyIDR(data.dpp1112 || '0.00')}`;
    console.log('💰 Setting dpp1112 field to:', taxBaseValue);
    safeSetValue('dpp1112', taxBaseValue);

    // 5. VAT 12% (vatAmount) - API Field: "docCur" "docTax" -> HTML ID: "vatSum"
    const vatValue = `${currencyCode} ${formatCurrencyIDR(data.docTax || '0.00')}`;
    console.log('💰 Setting vatSum field to:', vatValue);
    safeSetValue('vatSum', vatValue);

    // 6. GRAND TOTAL (grandTotal) - API Field: "docCur" "grandTotal" -> HTML ID: "grandTotal"
    const grandTotalValue = `${currencyCode} ${formatCurrencyIDR(data.grandTotal || '0.00')}`;
    console.log('💰 Setting grandTotal field to:', grandTotalValue);
    safeSetValue('grandTotal', grandTotalValue);

    console.log('💰 Financial summary populated successfully');

    // Populate table with invoice details
    console.log('📊 Populating invoice details table...');
    populateInvoiceDetails(data.arInvoiceDetails || []);

    // Enable submit button after data is loaded
    console.log('🔘 Enabling submit button...');
    enableSubmitButton();

    console.log('✅ Form population completed successfully');
}

// Populate table with invoice details
function populateInvoiceDetails(details) {
    console.log('📊 populateInvoiceDetails called with details:', details);
    console.log('📊 Details array length:', details ? details.length : 'null/undefined');
    console.log('📊 Details type:', typeof details);

    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.warn('⚠️ Element with id "tableBody" not found');
        return;
    }

    console.log('📋 Clearing existing table body...');
    tableBody.innerHTML = '';

    if (!details || details.length === 0) {
        console.log('⚠️ No invoice details found, showing empty message');
        // Add empty row message
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="13" class="p-4 text-center text-gray-500">
                No invoice details found
            </td>
        `;
        tableBody.appendChild(emptyRow);
        console.log('✅ Empty table message displayed');
        return;
    }

    console.log('📋 Starting to populate table with', details.length, 'detail rows...');

    details.forEach((detail, index) => {
        console.log(`📋 Processing detail row ${index + 1}:`, detail);
        console.log(`📋 Row ${index + 1} fields:`, {
            itemCode: detail.itemCode,
            catalogNo: detail.catalogNo,
            dscription: detail.dscription,
            unitMsr: detail.unitMsr,
            unitMsr2: detail.unitMsr2,
            quantity: detail.quantity,
            invQty: detail.invQty,
            u_bsi_salprice: detail.u_bsi_salprice,
            priceBefDi: detail.priceBefDi,
            vatgroup: detail.vatgroup,
            lineTotal: detail.lineTotal
        });

        const row = document.createElement('tr');
        console.log(`📋 Created table row ${index + 1}`);

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
        console.log(`✅ Row ${index + 1} added to table successfully`);
    });

    console.log(`📋 Table population completed. Total rows: ${details.length}`);

    // Apply text wrapping after populating the table
    if (window.refreshTextWrapping) {
        console.log('🔄 Applying text wrapping...');
        setTimeout(() => {
            window.refreshTextWrapping();
            console.log('✅ Text wrapping applied');
        }, 100);
    } else {
        console.log('⚠️ refreshTextWrapping function not available');
    }

    // Adjust textarea heights based on content
    console.log('📏 Adjusting textarea heights...');
    adjustTextareaHeights();
    console.log('✅ Textarea heights adjusted');

    // Apply currency formatting to table cells
    console.log('💰 Applying currency formatting to table cells...');
    setTimeout(() => {
        applyCurrencyFormattingToTable();
        console.log('✅ Currency formatting applied to table');
    }, 200);

    // Ensure all inputs in the table have autocomplete disabled
    console.log('🚫 Disabling autocomplete for all table inputs...');
    const tableInputs = tableBody.querySelectorAll('input, textarea, select');
    tableInputs.forEach(element => {
        element.setAttribute('autocomplete', 'off');
    });
    console.log(`✅ Autocomplete disabled for ${tableInputs.length} table elements`);

    console.log('✅ Invoice details table population completed successfully');
}

// Format date to YYYY-MM-DD - Fixed to avoid timezone issues
function formatDate(dateString) {
    if (!dateString) return '';

    try {
        // Parse the date string properly to avoid timezone shift
        let date;
        if (dateString.includes('T')) {
            // If it's an ISO string, parse it directly
            date = new Date(dateString);
        } else {
            // If it's just a date (YYYY-MM-DD), treat as local date
            const parts = dateString.split('-');
            if (parts.length === 3) {
                date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
                date = new Date(dateString);
            }
        }

        if (isNaN(date.getTime())) return '';

        // Format as YYYY-MM-DD without timezone conversion
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Date formatting error:', error);
        return '';
    }
}

// Helper function to determine status from invoice data
function getStatusFromInvoice(invoice) {
    console.log('🔍 getStatusFromInvoice called with invoice:', invoice);

    // Debug logging for arInvoiceApprovalSummary
    console.log('👥 Invoice arInvoiceApprovalSummary:', invoice.arInvoiceApprovalSummary);
    console.log('👥 Invoice arInvoiceApprovalSummary type:', typeof invoice.arInvoiceApprovalSummary);
    console.log('👥 Invoice arInvoiceApprovalSummary is null:', invoice.arInvoiceApprovalSummary === null);
    console.log('👥 Invoice arInvoiceApprovalSummary is undefined:', invoice.arInvoiceApprovalSummary === undefined);

    // Priority 1: Check if invoice has approval summary with approvalStatus
    if (invoice.arInvoiceApprovalSummary && invoice.arInvoiceApprovalSummary.approvalStatus) {
        const approvalStatus = invoice.arInvoiceApprovalSummary.approvalStatus;
        console.log('✅ Using approvalStatus from arInvoiceApprovalSummary:', approvalStatus);
        return approvalStatus;
    }

    // Priority 2: Check if invoice has direct approvalStatus field
    if (invoice.approvalStatus) {
        console.log('✅ Using direct approvalStatus field:', invoice.approvalStatus);
        return invoice.approvalStatus;
    }

    // Priority 3: Check transfer status
    if (invoice.u_BSI_Expressiv_IsTransfered === 'Y') {
        console.log('✅ Document is transferred, returning Received');
        return 'Received';
    }

    // Priority 4: Check if it's a staging document (draft)
    if (invoice.stagingID && invoice.stagingID.startsWith('STG')) {
        console.log('✅ Document is staging (STG), returning Draft');
        return 'Draft';
    }

    // Priority 5: Check if document has been transferred (received)
    if (invoice.u_BSI_Expressiv_IsTransfered === 'Y') {
        console.log('✅ Document is transferred, returning Received');
        return 'Received';
    }

    // Priority 6: Check if document is in preparation stage
    if (invoice.docNum && invoice.docNum > 0) {
        console.log('✅ Document has docNum > 0, returning Prepared');
        return 'Prepared';
    }

    // Priority 7: Check individual status flags from approval summary
    if (invoice.arInvoiceApprovalSummary) {
        const summary = invoice.arInvoiceApprovalSummary;
        console.log('👥 Checking individual status flags from approval summary:', summary);

        if (summary.isRejected) {
            console.log('✅ Status flag isRejected is true, returning Rejected');
            return 'Rejected';
        }
        if (summary.isApproved) {
            console.log('✅ Status flag isApproved is true, returning Approved');
            return 'Approved';
        }
        if (summary.isAcknowledged) {
            console.log('✅ Status flag isAcknowledged is true, returning Acknowledged');
            return 'Acknowledged';
        }
        if (summary.isChecked) {
            console.log('✅ Status flag isChecked is true, returning Checked');
            return 'Checked';
        }
        if (summary.isReceived) {
            console.log('✅ Status flag isReceived is true, returning Received');
            return 'Received';
        }
        if (summary.isPrepared) {
            console.log('✅ Status flag isPrepared is true, returning Prepared');
            return 'Prepared';
        }
    }

    // Priority 8: Check status field directly from invoice
    if (invoice.status) {
        console.log('✅ Using direct status field from invoice:', invoice.status);
        return invoice.status;
    }

    // Priority 9: Check docStatus field
    if (invoice.docStatus) {
        console.log('✅ Using docStatus field from invoice:', invoice.docStatus);
        return invoice.docStatus;
    }

    // Default to Draft for new documents
    console.log('⚠️ No specific status found, defaulting to Draft');
    return 'Draft';
}



// Save approval data to localStorage
function saveApprovalDataToLocalStorage() {
    if (!invoiceData || !invoiceData.stagingID) {
        console.log('⚠️ saveApprovalDataToLocalStorage: No invoice data or staging ID available');
        return;
    }

    console.log('💾 saveApprovalDataToLocalStorage called for staging ID:', invoiceData.stagingID);

    const acknowledgeByNameField = document.getElementById('acknowledgeByName');
    const checkedByNameField = document.getElementById('checkedByName');
    const approvedByNameField = document.getElementById('approvedByName');
    const receivedByNameField = document.getElementById('receivedByName');

    // Check if all required fields exist
    if (!acknowledgeByNameField || !checkedByNameField || !approvedByNameField || !receivedByNameField) {
        console.warn('⚠️ Missing required approval fields:', {
            acknowledgeByNameField: !!acknowledgeByNameField,
            checkedByNameField: !!checkedByNameField,
            approvedByNameField: !!approvedByNameField,
            receivedByNameField: !!receivedByNameField
        });
        return;
    }

    const approvalData = {
        stagingID: invoiceData.stagingID,
        acknowledgeByName: acknowledgeByNameField.value || '',
        checkedByName: checkedByNameField.value || '',
        approvedByName: approvedByNameField.value || '',
        receivedByName: receivedByNameField.value || '',
        acknowledgeById: acknowledgeByNameField.getAttribute('data-employee-id') || '',
        checkedById: checkedByNameField.getAttribute('data-employee-id') || '',
        approvedById: approvedByNameField.getAttribute('data-employee-id') || '',
        receivedById: receivedByNameField.getAttribute('data-employee-id') || '',
        timestamp: new Date().toISOString()
    };

    console.log('📊 Approval data to save:', approvalData);
    console.log('📊 Data structure validation:', {
        hasStagingID: !!approvalData.stagingID,
        hasAcknowledgeName: !!approvalData.acknowledgeByName,
        hasCheckedName: !!approvalData.checkedByName,
        hasApprovedName: !!approvalData.approvedByName,
        hasReceivedName: !!approvalData.receivedByName,
        hasAcknowledgeId: !!approvalData.acknowledgeById,
        hasCheckedId: !!approvalData.checkedById,
        hasApprovedId: !!approvalData.approvedById,
        hasReceivedId: !!approvalData.receivedById,
        hasTimestamp: !!approvalData.timestamp
    });

    const storageKey = `approval_${invoiceData.stagingID}`;
    console.log('💾 Storage key:', storageKey);

    try {
        localStorage.setItem(storageKey, JSON.stringify(approvalData));
        console.log('✅ Approval data saved to localStorage successfully');
        console.log('💾 Saved data size:', JSON.stringify(approvalData).length, 'characters');

        // Verify the save operation
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            console.log('✅ Data verification successful:', {
                originalStagingID: approvalData.stagingID,
                savedStagingID: parsedData.stagingID,
                dataMatch: JSON.stringify(approvalData) === savedData
            });
        } else {
            console.warn('⚠️ Data verification failed: no data found in localStorage after save');
        }
    } catch (error) {
        console.error('💥 Error saving approval data to localStorage:', error);
        console.error('💥 Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
    }
}

// Load approval data from localStorage
function loadApprovalDataFromLocalStorage() {
    if (!invoiceData || !invoiceData.stagingID) {
        console.log('⚠️ loadApprovalDataFromLocalStorage: No invoice data or staging ID available');
        return;
    }

    console.log('💾 loadApprovalDataFromLocalStorage called for staging ID:', invoiceData.stagingID);
    const storageKey = `approval_${invoiceData.stagingID}`;
    console.log('💾 Storage key:', storageKey);

    const savedData = localStorage.getItem(storageKey);
    console.log('💾 Raw saved data from localStorage:', savedData);

    if (savedData) {
        try {
            console.log('📥 Parsing saved data as JSON...');
            const approvalData = JSON.parse(savedData);
            console.log('✅ Parsed approval data:', approvalData);
            console.log('📊 Approval data structure:', {
                hasAcknowledgeByName: !!approvalData.acknowledgeByName,
                hasCheckedByName: !!approvalData.checkedByName,
                hasApprovedByName: !!approvalData.approvedByName,
                hasReceivedByName: !!approvalData.receivedByName,
                hasAcknowledgeById: !!approvalData.acknowledgeById,
                hasCheckedById: !!approvalData.checkedById,
                hasApprovedById: !!approvalData.approvedById,
                hasReceivedById: !!approvalData.receivedById,
                timestamp: approvalData.timestamp
            });

            // Check if data is not too old (within 24 hours)
            const savedTime = new Date(approvalData.timestamp);
            const now = new Date();
            const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

            console.log('⏰ Data age check:', {
                savedTime: savedTime.toISOString(),
                currentTime: now.toISOString(),
                hoursDifference: hoursDiff,
                isWithin24Hours: hoursDiff < 24
            });

            if (hoursDiff < 24) {
                console.log('✅ Data is within 24 hours, loading into form...');

                const acknowledgeByNameField = document.getElementById('acknowledgeByName');
                const checkedByNameField = document.getElementById('checkedByName');
                const approvedByNameField = document.getElementById('approvedByName');
                const receivedByNameField = document.getElementById('receivedByName');

                if (acknowledgeByNameField) {
                    acknowledgeByNameField.value = approvalData.acknowledgeByName || '';
                    acknowledgeByNameField.setAttribute('data-employee-id', approvalData.acknowledgeById || '');
                    console.log('✅ Loaded acknowledge data:', {
                        name: approvalData.acknowledgeByName,
                        id: approvalData.acknowledgeById
                    });
                }
                if (checkedByNameField) {
                    checkedByNameField.value = approvalData.checkedByName || '';
                    checkedByNameField.setAttribute('data-employee-id', approvalData.checkedById || '');
                    console.log('✅ Loaded checked data:', {
                        name: approvalData.checkedByName,
                        id: approvalData.checkedById
                    });
                }
                if (approvedByNameField) {
                    approvedByNameField.value = approvalData.approvedByName || '';
                    approvedByNameField.setAttribute('data-employee-id', approvalData.approvedById || '');
                    console.log('✅ Loaded approved data:', {
                        name: approvalData.approvedByName,
                        id: approvalData.approvedById
                    });
                }
                if (receivedByNameField) {
                    receivedByNameField.value = approvalData.receivedByName || '';
                    receivedByNameField.setAttribute('data-employee-id', approvalData.receivedById || '');
                    console.log('✅ Loaded received data:', {
                        name: approvalData.receivedByName,
                        id: approvalData.receivedById
                    });
                }

                console.log('✅ Approval data loaded from localStorage successfully');
                console.log('📊 Final approval data state:', {
                    acknowledgeByName: acknowledgeByNameField?.value || 'N/A',
                    checkedByName: checkedByNameField?.value || 'N/A',
                    approvedByName: approvedByNameField?.value || 'N/A',
                    receivedByName: receivedByNameField?.value || 'N/A'
                });
            } else {
                console.log('⚠️ Data is older than 24 hours, removing from localStorage');
                // Remove old data
                localStorage.removeItem(storageKey);
                console.log('🗑️ Old approval data removed from localStorage');
            }
        } catch (error) {
            console.error('💥 Error loading approval data from localStorage:', error);
            console.error('💥 Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
        }
    } else {
        console.log('📝 No saved approval data found in localStorage');
    }
}



// Navigation function
function goToMenuARInv() {
    window.location.href = '../pages/menuInvoice.html';
}

// Submit invoice data to API
async function submitInvoiceData() {
    try {
        // Validate all required form fields before confirmation
        // 1. Header fields
        const requiredHeaderFields = [
            { id: 'DocNum', label: 'Invoice Number' },
            { id: 'CardCode', label: 'Customer Code' },
            { id: 'CardName', label: 'Customer Name' }
        ];
        for (const field of requiredHeaderFields) {
            const el = document.getElementById(field.id);
            if (!el || !el.value.trim()) {
                Swal.fire({ icon: 'warning', title: 'Form Incomplete', text: `${field.label} is required!` });
                return;
            }
        }

        // 2. Approval Workflow section: ALL fields are required (including prepared by if editable)
        const approvalFields = [
            { id: 'preparedByName', label: 'Prepared by' },
            { id: 'acknowledgeByName', label: 'Acknowledge by' },
            { id: 'checkedByName', label: 'Checked by' },
            { id: 'approvedByName', label: 'Approved by' },
            { id: 'receivedByName', label: 'Received by' }
        ];
        for (const field of approvalFields) {
            const el = document.getElementById(field.id);
            // If field is disabled, skip (assume filled by system or not required to fill by user)
            if (!el) {
                Swal.fire({ icon: 'warning', title: 'Form Incomplete', text: `${field.label} is required!` });
                return;
            }
            if (!el.value || !el.value.trim()) {
                Swal.fire({ icon: 'warning', title: 'Approval Workflow Belum Lengkap', text: `Bagian ${field.label} wajib diisi!` });
                el.focus();
                return;
            }
        }

        // 3. Invoice detail table: check all required columns for each row
        if (!invoiceData.arInvoiceDetails || invoiceData.arInvoiceDetails.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Form Incomplete', text: 'Invoice must have at least one detail item!' });
            return;
        }
        for (let i = 0; i < invoiceData.arInvoiceDetails.length; i++) {
            const detail = invoiceData.arInvoiceDetails[i];
            if (!detail.itemCode || !detail.dscription || !detail.quantity || !detail.priceBefDi) {
                Swal.fire({ icon: 'warning', title: 'Form Incomplete', text: `Detail row ${i + 1} is incomplete! Pastikan Item Code, Description, Quantity, dan Price terisi.` });
                return;
            }
        }

        // 4. Remarks (optional, but if required, uncomment below)
        // const remarks = document.getElementById('comments');
        // if (remarks && !remarks.value.trim()) {
        //     Swal.fire({ icon: 'warning', title: 'Form Incomplete', text: 'Remarks is required!' });
        //     return;
        // }

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

            const approvalEndpoint = `${API_BASE_URL}/ar-invoices/approval/${stagingID}`;
            console.log('📡 Approval API endpoint:', approvalEndpoint);
            console.log('📡 Full URL to test manually:', approvalEndpoint);
            console.log('📋 Request Method: PATCH');
            console.log('📋 Request Headers:', {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            });
            console.log('📋 Request Body (payload):', payload);
            console.log('📋 cURL command for manual testing:');
            console.log(`curl -X PATCH "${approvalEndpoint}" -H "accept: text/plain" -H "Content-Type: application/json" -d '${JSON.stringify(payload)}'`);
            console.log('📋 Postman/Insomnia collection:');
            console.log(`PATCH ${approvalEndpoint}`);
            console.log('Headers:');
            console.log('  accept: text/plain');
            console.log('  Content-Type: application/json');
            console.log('Body (raw JSON):');
            console.log(JSON.stringify(payload, null, 2));

            const response = await fetch(approvalEndpoint, {
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
                    console.warn('⚠️ Manual test URL:', approvalEndpoint);
                    console.warn('⚠️ cURL command for debugging:');
                    console.warn(`curl -X PATCH "${approvalEndpoint}" -H "accept: text/plain" -H "Content-Type: application/json" -d '${JSON.stringify(payload)}' -v`);
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

                console.error('❌ Manual test URL:', approvalEndpoint);
                console.error('❌ cURL command for debugging:');
                console.error(`curl -X PATCH "${approvalEndpoint}" -H "accept: text/plain" -H "Content-Type: application/json" -d '${JSON.stringify(payload)}' -v`);

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
        console.log('📎 Starting file upload for stagingID:', stagingID);
        console.log('📎 Files to upload:', files);

        if (!files || files.length === 0) {
            console.log('📎 No files to upload');
            return { status: true, message: 'No files to upload' };
        }

        // Create FormData object for multipart/form-data
        const formData = new FormData();

        // Add each file to the FormData
        files.forEach((file, index) => {
            console.log(`📎 Adding file ${index + 1}:`, file.name, file.type, file.size);
            formData.append('files', file);
        });

        // Construct the API URL
        const uploadUrl = `${API_BASE_URL}/ar-invoices/${stagingID}/attachments/upload`;
        console.log('📡 Upload URL:', uploadUrl);
        console.log('📡 Full URL to test manually:', uploadUrl);
        console.log('📋 Request Method: POST');
        console.log('📋 Request Headers:');
        console.log('📋   accept: */*');
        console.log('📋   Content-Type: multipart/form-data (auto-generated)');
        console.log('📋 Request Body: FormData with files');
        console.log('📋 Files count:', files.length);
        console.log('📋 cURL command for manual testing:');
        console.log(`curl -X POST "${uploadUrl}" -H "accept: */*" -F "files=@file1.pdf" -F "files=@file2.pdf"`);
        console.log('📋 Postman/Insomnia collection:');
        console.log(`POST ${uploadUrl}`);
        console.log('Headers:');
        console.log('  accept: */*');
        console.log('Body (form-data):');
        console.log('  files: [select files]');

        // Make the API request
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'accept': '*/*'
                // Don't set Content-Type header - let the browser set it with boundary for multipart/form-data
            },
            body: formData
        });

        console.log('📎 Upload response status:', response.status);
        console.log('📎 Upload response headers:', response.headers);
        console.log('📎 Upload response URL:', response.url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('📎 Upload API Error response:', errorText);

            // Handle 404 errors specifically
            if (response.status === 404) {
                console.warn('⚠️ Upload endpoint not found (404) - this might be expected for new invoices');
                console.warn('⚠️ Manual test URL:', uploadUrl);
                console.warn('⚠️ cURL command for debugging:');
                console.warn(`curl -X POST "${uploadUrl}" -H "accept: */*" -F "files=@test.pdf" -v`);
                throw new Error('Upload endpoint not available for this invoice');
            }

            // Try to parse error response as JSON for better error handling
            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = errorJson.message || errorJson.error || errorText;
                console.error('📎 Parsed upload error details:', errorJson);
            } catch (parseError) {
                console.error('📎 Could not parse upload error response as JSON:', parseError);
            }

            console.error('❌ Manual test URL:', uploadUrl);
            console.error('❌ cURL command for debugging:');
            console.error(`curl -X POST "${uploadUrl}" -H "accept: */*" -F "files=@test.pdf" -v`);

            throw new Error(`Upload API Error: ${response.status} - ${errorDetails}`);
        }

        const result = await response.json();
        console.log('📎 Upload API response:', result);

        if (result.status && result.code === 200) {
            console.log('📎 Files uploaded successfully:', result.data);
            return result;
        } else {
            throw new Error(`Upload failed: ${result.message || 'Unknown error'}`);
        }

    } catch (error) {
        console.error('💥 Error in uploadAttachments:', error);
        console.error('💥 Manual test URL:', `${API_BASE_URL}/ar-invoices/${stagingID}/attachments/upload`);
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
    console.log('🔘 enableSubmitButton called');

    // Get current status from the Status field
    const statusField = document.getElementById('Status');
    const currentStatus = statusField ? statusField.value : '';
    console.log('📊 Current status from Status field:', currentStatus);

    // Use the helper function to update visibility
    console.log('🔘 Updating submit and reject button visibility for status:', currentStatus);
    updateSubmitAndRejectVisibility(currentStatus);

    // Update form editability based on status
    console.log('🔒 Updating form editability for status:', currentStatus);
    updateFormEditability(currentStatus);

    console.log('✅ Submit button configuration completed for status:', currentStatus);
}

// Function to control form editability based on document status
function updateFormEditability(status) {
    console.log('🔒 updateFormEditability called with status:', status);

    const isDraft = status === 'Draft';
    console.log('🔒 Is document editable (Draft status):', isDraft);

    // Update status indicator
    console.log('📊 Updating document status indicator...');
    updateDocumentStatusIndicator(status, isDraft);

    // Control approval section (only editable for Draft status)
    console.log('👥 Updating approval fields editability...');
    setApprovalFieldsEditability(isDraft);

    // Control file upload section
    console.log('📎 Updating file upload editability...');
    setFileUploadEditability(isDraft);

    // Control remarks field
    console.log('💬 Updating remarks field editability...');
    setRemarksEditability(isDraft);

    // Control table cells (in case there are any editable table fields)
    console.log('📊 Updating table fields editability...');
    setTableFieldsEditability(isDraft);

    console.log(`✅ Form editability updated: ${isDraft ? 'Enabled' : 'Disabled'} for status: ${status}`);
}

// Function to update document status indicator
function updateDocumentStatusIndicator(status, isEditable) {
    console.log('📊 updateDocumentStatusIndicator called with:', { status, isEditable });

    const indicator = document.getElementById('documentStatusIndicator');
    const statusDisplay = document.getElementById('currentStatusDisplay');
    const badge = document.getElementById('readOnlyBadge');

    console.log('📊 Status indicator elements found:', {
        indicator: !!indicator,
        statusDisplay: !!statusDisplay,
        badge: !!badge
    });

    if (!indicator || !statusDisplay || !badge) {
        console.warn('⚠️ Missing status indicator elements, cannot update');
        return;
    }

    if (!isEditable) {
        // Show read-only indicator for non-Draft status
        console.log(`📊 Showing read-only indicator for status: ${status}`);
        statusDisplay.textContent = status;
        indicator.classList.remove('hidden');

        // Update badge color based on status
        console.log(`🎨 Updating badge color for status: ${status}`);
        badge.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border';

        switch (status) {
            case 'Prepared':
                badge.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-300');
                console.log('🎨 Applied blue badge for Prepared status');
                break;
            case 'Checked':
                badge.classList.add('bg-yellow-100', 'text-yellow-800', 'border-yellow-300');
                console.log('🎨 Applied yellow badge for Checked status');
                break;
            case 'Acknowledged':
                badge.classList.add('bg-purple-100', 'text-purple-800', 'border-purple-300');
                console.log('🎨 Applied purple badge for Acknowledged status');
                break;
            case 'Approved':
                badge.classList.add('bg-green-100', 'text-green-800', 'border-green-300');
                console.log('🎨 Applied green badge for Approved status');
                break;
            case 'Received':
                badge.classList.add('bg-emerald-100', 'text-emerald-800', 'border-emerald-300');
                console.log('🎨 Applied emerald badge for Received status');
                break;
            case 'Rejected':
                badge.classList.add('bg-red-100', 'text-red-800', 'border-red-300');
                console.log('🎨 Applied red badge for Rejected status');
                break;
            default:
                badge.classList.add('bg-gray-100', 'text-gray-800', 'border-gray-300');
                console.log('🎨 Applied default gray badge for unknown status');
        }

        console.log(`✅ Read-only indicator displayed for status: ${status}`);
    } else {
        // Hide indicator for Draft status (editable)
        console.log('📊 Hiding status indicator for Draft status (editable)');
        indicator.classList.add('hidden');
        console.log('✅ Status indicator hidden for Draft status');
    }
}

// Function to control approval fields editability
function setApprovalFieldsEditability(isEditable) {
    console.log('👥 setApprovalFieldsEditability called with isEditable:', isEditable);

    const approvalInputs = [
        'acknowledgeByName',
        'checkedByName',
        'approvedByName',
        'receivedByName'
    ];

    console.log('👥 Approval inputs to update:', approvalInputs);

    approvalInputs.forEach((inputId, index) => {
        console.log(`👥 Processing approval input ${index + 1}:`, inputId);

        const input = document.getElementById(inputId);
        if (input) {
            console.log(`✅ Found input element for ${inputId}`);

            // Update disabled state
            input.disabled = !isEditable;
            input.readOnly = !isEditable;
            console.log(`🔒 Set ${inputId} disabled = ${!isEditable}, readOnly = ${!isEditable}`);

            // Update visual appearance
            if (isEditable) {
                input.classList.remove('bg-gray-100');
                input.classList.add('bg-white');
                console.log(`🎨 Applied white background for editable ${inputId}`);
            } else {
                input.classList.remove('bg-white');
                input.classList.add('bg-gray-100');
                console.log(`🎨 Applied gray background for read-only ${inputId}`);
            }
        } else {
            console.warn(`⚠️ Input element not found for ${inputId}`);
        }
    });

    // Also disable the corresponding dropdowns
    const dropdownIds = [
        'acknowledgeBySelectDropdown',
        'checkedBySelectDropdown',
        'approvedBySelectDropdown',
        'receivedBySelectDropdown'
    ];

    console.log('🔽 Updating dropdown editability:', dropdownIds);

    dropdownIds.forEach((dropdownId, index) => {
        console.log(`🔽 Processing dropdown ${index + 1}:`, dropdownId);

        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            if (isEditable) {
                dropdown.style.pointerEvents = 'auto';
                dropdown.style.opacity = '1';
                console.log(`✅ Enabled dropdown ${dropdownId} (pointer-events: auto, opacity: 1)`);
            } else {
                dropdown.style.pointerEvents = 'none';
                dropdown.style.opacity = '0.6';
                console.log(`🔒 Disabled dropdown ${dropdownId} (pointer-events: none, opacity: 0.6)`);
            }
        } else {
            console.warn(`⚠️ Dropdown element not found for ${dropdownId}`);
        }
    });

    console.log(`✅ Approval fields editability updated: ${isEditable ? 'Enabled' : 'Disabled'}`);
}

// Function to control file upload editability
function setFileUploadEditability(isEditable) {
    console.log('📎 setFileUploadEditability called with isEditable:', isEditable);

    const fileInput = document.getElementById('filePath');
    if (fileInput) {
        console.log('✅ Found file input element');

        // Update disabled state
        fileInput.disabled = !isEditable;
        console.log(`🔒 Set file input disabled = ${!isEditable}`);

        // Update visual appearance
        if (isEditable) {
            fileInput.classList.remove('bg-gray-100');
            fileInput.classList.add('bg-white');
            console.log('🎨 Applied white background for editable file input');
        } else {
            fileInput.classList.remove('bg-white');
            fileInput.classList.add('bg-gray-100');
            console.log('🎨 Applied gray background for read-only file input');
        }
    } else {
        console.warn('⚠️ File input element not found');
    }

    // Hide/show file upload section
    const fileUploadSection = document.querySelector('.file-upload-section');
    if (fileUploadSection) {
        if (isEditable) {
            fileUploadSection.style.display = 'block';
            console.log('📎 File upload section displayed (editable)');
        } else {
            fileUploadSection.style.display = 'none';
            console.log('📎 File upload section hidden (read-only)');
        }
    } else {
        console.warn('⚠️ File upload section element not found');
    }

    console.log(`✅ File upload editability updated: ${isEditable ? 'Enabled' : 'Disabled'}`);
}

// Function to control remarks field editability
function setRemarksEditability(isEditable) {
    console.log('💬 setRemarksEditability called with isEditable:', isEditable);

    const remarksField = document.getElementById('comments');
    if (remarksField) {
        console.log('✅ Found remarks field element');

        // Update disabled state
        remarksField.disabled = !isEditable;
        remarksField.readOnly = !isEditable;
        console.log(`🔒 Set remarks field disabled = ${!isEditable}, readOnly = ${!isEditable}`);

        // Update visual appearance
        if (isEditable) {
            remarksField.classList.remove('bg-gray-100');
            remarksField.classList.add('bg-white');
            console.log('🎨 Applied white background for editable remarks field');
        } else {
            remarksField.classList.remove('bg-white');
            remarksField.classList.add('bg-gray-100');
            console.log('🎨 Applied gray background for read-only remarks field');
        }
    } else {
        console.warn('⚠️ Remarks field element not found');
    }

    console.log(`✅ Remarks field editability updated: ${isEditable ? 'Enabled' : 'Disabled'}`);
}

// Function to control table fields editability (if any editable fields exist)
function setTableFieldsEditability(isEditable) {
    console.log('📊 setTableFieldsEditability called with isEditable:', isEditable);

    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.warn('⚠️ Table body element not found');
        return;
    }

    console.log('✅ Found table body element');

    // Get all input and textarea elements in the table
    const tableInputs = tableBody.querySelectorAll('input, textarea, select');
    console.log(`📊 Found ${tableInputs.length} table input elements`);

    tableInputs.forEach((element, index) => {
        // Update disabled state
        element.disabled = !isEditable;
        element.readOnly = !isEditable;

        if (index < 5) { // Log first 5 elements for debugging
            console.log(`🔒 Updated table element ${index + 1}:`, {
                tagName: element.tagName,
                className: element.className,
                disabled: element.disabled,
                readOnly: element.readOnly
            });
        }

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
    console.log(`🔘 Found ${actionButtons.length} action buttons in table`);

    actionButtons.forEach((button, index) => {
        if (isEditable) {
            button.style.display = 'inline-block';
            button.disabled = false;
            if (index < 3) { // Log first 3 buttons for debugging
                console.log(`✅ Enabled action button ${index + 1}:`, {
                    text: button.textContent,
                    className: button.className
                });
            }
        } else {
            button.style.display = 'none';
            button.disabled = true;
            if (index < 3) { // Log first 3 buttons for debugging
                console.log(`🔒 Disabled action button ${index + 1}:`, {
                    text: button.textContent,
                    className: button.className
                });
            }
        }
    });

    console.log(`✅ Table fields editability updated: ${isEditable ? 'Enabled' : 'Disabled'}`);
}

// Helper function to manage submit and reject buttons visibility
function updateSubmitAndRejectVisibility(status) {
    console.log('🔘 updateSubmitAndRejectVisibility called with status:', status);

    const submitButton = document.getElementById('submitButton');
    const submitButtonContainer = submitButton ? submitButton.closest('.text-center') : null;
    const rejectButton = document.getElementById('rejectButton');

    console.log('🔘 Button elements found:', {
        submitButton: !!submitButton,
        submitButtonContainer: !!submitButtonContainer,
        rejectButton: !!rejectButton
    });

    if (submitButton && submitButtonContainer) {
        if (status === 'Draft') {
            // Show submit button for Draft status
            console.log('🔘 Showing submit button for Draft status');
            submitButtonContainer.style.display = 'block';
            submitButton.disabled = false;
            console.log('✅ Submit button shown for Draft status');
        } else {
            // Hide submit button for non-Draft status
            console.log(`🔘 Hiding submit button for status: ${status}`);
            submitButtonContainer.style.display = 'none';
            submitButton.disabled = true;
            console.log(`✅ Submit button hidden for status: ${status}`);
        }
    } else {
        console.warn('⚠️ Submit button or container not found');
    }

    // Show Reject button only when status is Draft; hide otherwise
    if (rejectButton) {
        if (status === 'Draft') {
            console.log('🔘 Showing reject button for Draft status');
            rejectButton.style.display = 'inline-block';
        } else {
            console.log(`🔘 Hiding reject button for status: ${status}`);
            rejectButton.style.display = 'none';
        }
    } else {
        console.warn('⚠️ Reject button not found');
    }

    console.log('✅ Submit and reject button visibility updated for status:', status);
}

// Reject flow (mirrors check page behavior but allowed on Draft)
function rejectInvoice() {
    console.log('❌ rejectInvoice called');

    if (!invoiceData) {
        console.log('⚠️ No invoice data available for rejection');
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice data available'
        });
        return;
    }

    console.log('📊 Invoice data available for rejection:', {
        stagingID: invoiceData.stagingID,
        docNum: invoiceData.docNum,
        cardName: invoiceData.cardName
    });

    const status = getStatusFromInvoice(invoiceData);
    console.log('📊 Current invoice status:', status);

    if (status !== 'Draft') {
        console.log(`❌ Cannot reject document with status: ${status}`);
        Swal.fire({
            icon: 'error',
            title: 'Invalid Action',
            text: `Cannot reject document with status: ${status}. Only documents with status "Draft" can be rejected.`,
        });
        return;
    }

    console.log('✅ Document is Draft status, proceeding with rejection');
    console.log('❓ Showing rejection dialog...');

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
            console.log('🔌 Rejection dialog opened, initializing fields...');
            const firstField = document.getElementById('rejectionField1');
            if (firstField) {
                console.log('✅ Found rejection field, initializing with prefix');
                initializeWithRejectionPrefixDetail(firstField);
            } else {
                console.warn('⚠️ Rejection field not found');
            }
            const field = document.querySelector('#rejectionFieldsContainer textarea');
            if (field) {
                console.log('✅ Setting up rejection input handler');
                field.addEventListener('input', handleRejectionInputDetail);
            } else {
                console.warn('⚠️ Rejection textarea not found for event listener');
            }
        },
        preConfirm: () => {
            console.log('🔍 Validating rejection input...');
            const field = document.querySelector('#rejectionFieldsContainer textarea');
            const remarks = field ? field.value.trim() : '';
            const prefixLength = parseInt(field?.dataset.prefixLength || '0');
            const contentAfterPrefix = remarks.substring(prefixLength).trim();

            console.log('📝 Rejection validation:', {
                fullRemarks: remarks,
                prefixLength: prefixLength,
                contentAfterPrefix: contentAfterPrefix,
                hasContent: !!contentAfterPrefix
            });

            if (!contentAfterPrefix) {
                console.log('❌ Rejection validation failed: no content after prefix');
                Swal.showValidationMessage('Please enter a rejection reason');
                return false;
            }

            console.log('✅ Rejection validation passed');
            return remarks;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            console.log('✅ User confirmed rejection, updating status...');
            updateInvoiceStatusToRejected(result.value);
        } else {
            console.log('❌ User cancelled rejection');
        }
    });
}

function initializeWithRejectionPrefixDetail(textarea) {
    console.log('🔌 initializeWithRejectionPrefixDetail called');

    const fullName = getCurrentUserFullNameDetail();
    const role = 'Prepared';
    const prefix = `[${fullName} - ${role}]: `;

    console.log('👤 User details for rejection prefix:', {
        fullName: fullName,
        role: role,
        prefix: prefix
    });

    textarea.value = prefix;
    textarea.dataset.prefixLength = prefix.length;
    textarea.setSelectionRange(prefix.length, prefix.length);
    textarea.focus();

    console.log('✅ Rejection prefix initialized:', {
        prefix: prefix,
        prefixLength: prefix.length,
        cursorPosition: prefix.length
    });
}

function handleRejectionInputDetail(event) {
    console.log('🔌 handleRejectionInputDetail called');

    const textarea = event.target;
    const prefixLength = parseInt(textarea.dataset.prefixLength || '0');
    const fullName = getCurrentUserFullNameDetail();
    const role = 'Prepared';
    const expectedPrefix = `[${fullName} - ${role}]: `;

    console.log('📝 Rejection input handling:', {
        currentValue: textarea.value,
        prefixLength: prefixLength,
        fullName: fullName,
        role: role,
        expectedPrefix: expectedPrefix
    });

    if (!textarea.value.startsWith(expectedPrefix)) {
        console.log('⚠️ Input does not start with expected prefix, fixing...');
        const userText = textarea.value.substring(prefixLength);
        textarea.value = expectedPrefix + userText;
        textarea.setSelectionRange(prefixLength, prefixLength);
        console.log('✅ Fixed prefix, new value:', textarea.value);
    } else if (textarea.selectionStart < prefixLength || textarea.selectionEnd < prefixLength) {
        console.log('⚠️ Cursor position is before prefix, moving to end...');
        textarea.setSelectionRange(prefixLength, prefixLength);
        console.log('✅ Cursor moved to end of prefix');
    } else {
        console.log('✅ Input validation passed, no changes needed');
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
        
        // Create snapshot of current invoice data to preserve what was rejected
        const invoiceSnapshot = {
            invoiceNumber: invoiceData.u_bsi_invnum || invoiceData.docNum,
            customerName: invoiceData.cardName,
            invoiceDate: invoiceData.docDate,
            dueDate: invoiceData.docDueDate,
            currency: invoiceData.docCur,
            subtotal: invoiceData.netPrice || invoiceData.docTotal,
            taxAmount: invoiceData.vatSum || invoiceData.taxTotal,
            totalAmount: invoiceData.grandTotal || invoiceData.total,
            snapshotDate: now
        };
        
        const payload = {
            approvalStatus: 'Rejected',
            rejectedDate: now,
            rejectionRemarks: remarks,
            rejectedBy: (window.getCurrentUser && window.getCurrentUser()?.userId) || '',
            rejectedByName: getCurrentUserFullNameDetail(),
            rejectedInvoiceSnapshot: JSON.stringify(invoiceSnapshot), // Save snapshot
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
        } catch { }

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
    console.log('🔌 setupApprovalInputListeners called');

    const approvalInputs = [
        'acknowledgeByName',
        'checkedByName',
        'approvedByName',
        'receivedByName'
    ];

    console.log('🔌 Approval inputs to setup:', approvalInputs);

    approvalInputs.forEach((inputId, index) => {
        console.log(`🔌 Setting up listener ${index + 1} for:`, inputId);

        const input = document.getElementById(inputId);
        if (input) {
            console.log(`✅ Found input element for ${inputId}`);

            input.addEventListener('input', function () {
                console.log(`🔌 Input event triggered for ${inputId}, value:`, this.value);

                // Check if document is editable before allowing changes
                const statusField = document.getElementById('Status');
                const currentStatus = statusField ? statusField.value : '';
                console.log(`📊 Current document status:`, currentStatus);

                if (currentStatus !== 'Draft') {
                    console.log(`⚠️ Document not editable (status: ${currentStatus}), preventing changes`);
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
                    const originalValue = this.getAttribute('data-original-value') || '';
                    console.log(`🔄 Reverting ${inputId} to original value:`, originalValue);
                    this.value = originalValue;
                    return;
                }

                // Mark that approval data has been modified
                window.approvalDataModified = true;
                console.log(`✅ Approval data modified flag set to true for ${inputId} = ${this.value}`);

                // Try to find and update employee ID based on entered name
                if (this.value.trim()) {
                    console.log(`🔍 Searching for employee with name: ${this.value}`);
                    const selectedEmployee = employeesData.find(emp =>
                        emp.fullName.toLowerCase() === this.value.toLowerCase()
                    );

                    if (selectedEmployee) {
                        this.setAttribute('data-employee-id', selectedEmployee.kansaiEmployeeId || '');
                        console.log(`✅ Updated employee ID for ${inputId}:`, selectedEmployee.kansaiEmployeeId);
                    } else {
                        // Clear employee ID if no match found
                        this.setAttribute('data-employee-id', '');
                        console.log(`⚠️ No employee found for name: ${this.value}`);
                    }
                } else {
                    // Clear employee ID if input is empty
                    this.setAttribute('data-employee-id', '');
                    console.log(`🗑️ Cleared employee ID for ${inputId} (empty input)`);
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

                console.log(`📊 Current approval data state:`, approvalDataState);

                // Save to localStorage as backup
                console.log(`💾 Saving approval data to localStorage...`);
                saveApprovalDataToLocalStorage();

                // Show subtle notification that data has been modified
                console.log(`🔔 Showing approval modified notification...`);
                showApprovalModifiedNotification();
            });

            // Store original value when the input gains focus (for reverting if needed)
            input.addEventListener('focus', function () {
                const originalValue = this.value;
                this.setAttribute('data-original-value', originalValue);
                console.log(`🔌 Focus event for ${inputId}, stored original value:`, originalValue);
            });

            console.log(`✅ Event listeners setup completed for ${inputId}`);
        } else {
            console.warn(`⚠️ Element with id '${inputId}' not found`);
        }
    });

    console.log('✅ All approval input listeners setup completed');
}

// Setup event listeners for other form fields (comments, etc.)
function setupOtherFieldListeners() {
    console.log('🔌 setupOtherFieldListeners called');

    // Setup comments/remarks field listener
    const commentsField = document.getElementById('comments');
    if (commentsField) {
        console.log('✅ Found comments field, setting up listener');

        commentsField.addEventListener('input', function () {
            console.log(`🔌 Comments input event triggered, value:`, this.value);

            // Check if document is editable before allowing changes
            const statusField = document.getElementById('Status');
            const currentStatus = statusField ? statusField.value : '';
            console.log(`📊 Current document status:`, currentStatus);

            if (currentStatus !== 'Draft') {
                console.log(`⚠️ Document not editable (status: ${currentStatus}), preventing comments changes`);
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
                const originalValue = this.getAttribute('data-original-value') || '';
                console.log(`🔄 Reverting comments to original value:`, originalValue);
                this.value = originalValue;
                return;
            }

            console.log(`✅ Comments change allowed for Draft status`);
        });

        // Store original value when the field gains focus
        commentsField.addEventListener('focus', function () {
            const originalValue = this.value;
            this.setAttribute('data-original-value', originalValue);
            console.log(`🔌 Comments focus event, stored original value:`, originalValue);
        });

        console.log('✅ Comments field listeners setup completed');
    } else {
        console.warn('⚠️ Comments field not found');
    }

    console.log('✅ Other field listeners setup completed');
}

// Show notification when approval data is modified
function showApprovalModifiedNotification() {
    console.log('🔔 showApprovalModifiedNotification called');

    // Remove existing notification if any
    const existingNotification = document.getElementById('approvalModifiedNotification');
    if (existingNotification) {
        console.log('🗑️ Removing existing notification');
        existingNotification.remove();
    } else {
        console.log('📝 No existing notification found');
    }

    // Create notification element
    console.log('🔔 Creating new notification element');
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
    console.log('🔔 Adding notification to page body');
    document.body.appendChild(notification);
    console.log('✅ Notification added to page successfully');

    // Auto remove after 3 seconds
    console.log('⏰ Setting auto-remove timer for 3 seconds');
    setTimeout(() => {
        if (notification.parentNode) {
            console.log('🗑️ Auto-removing notification after timeout');
            notification.remove();
            console.log('✅ Notification auto-removed');
        } else {
            console.log('⚠️ Notification already removed, skipping auto-remove');
        }
    }, 3000);

    console.log('✅ Approval modification notification displayed successfully');
}

// Reset approval data to original values
function resetApprovalData() {
    console.log('🔄 resetApprovalData called');

    if (!invoiceData) {
        console.log('⚠️ No invoice data available to reset');
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No invoice data available to reset'
        });
        return;
    }

    console.log('📊 Current invoice data available:', {
        stagingID: invoiceData.stagingID,
        hasApprovalSummary: !!invoiceData.arInvoiceApprovalSummary
    });

    // Show confirmation dialog
    console.log('❓ Showing confirmation dialog for reset');
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
            console.log('✅ User confirmed reset, proceeding...');

            // Reset to original values from invoiceData (excluding prepared by as requested)
            if (invoiceData.arInvoiceApprovalSummary) {
                console.log('📊 Resetting from approval summary data:', invoiceData.arInvoiceApprovalSummary);

                const acknowledgeByNameField = document.getElementById('acknowledgeByName');
                const checkedByNameField = document.getElementById('checkedByName');
                const approvedByNameField = document.getElementById('approvedByName');
                const receivedByNameField = document.getElementById('receivedByName');

                if (acknowledgeByNameField) {
                    const originalValue = invoiceData.arInvoiceApprovalSummary.acknowledgedByName || '';
                    acknowledgeByNameField.value = originalValue;
                    console.log('✅ Reset acknowledgeByName to:', originalValue);
                }
                if (checkedByNameField) {
                    const originalValue = invoiceData.arInvoiceApprovalSummary.checkedByName || '';
                    checkedByNameField.value = originalValue;
                    console.log('✅ Reset checkedByName to:', originalValue);
                }
                if (approvedByNameField) {
                    const originalValue = invoiceData.arInvoiceApprovalSummary.approvedByName || '';
                    approvedByNameField.value = originalValue;
                    console.log('✅ Reset approvedByName to:', originalValue);
                }
                if (receivedByNameField) {
                    const originalValue = invoiceData.arInvoiceApprovalSummary.receivedByName || '';
                    receivedByNameField.value = originalValue;
                    console.log('✅ Reset receivedByName to:', originalValue);
                }

                console.log('✅ Reset approval data to original values from API');
            } else {
                console.log('⚠️ No approval summary data, clearing all fields');
                // Clear all fields if no approval summary (excluding prepared by)
                const acknowledgeByNameField = document.getElementById('acknowledgeByName');
                const checkedByNameField = document.getElementById('checkedByName');
                const approvedByNameField = document.getElementById('approvedByName');
                const receivedByNameField = document.getElementById('receivedByName');

                if (acknowledgeByNameField) {
                    acknowledgeByNameField.value = '';
                    console.log('✅ Cleared acknowledgeByName');
                }
                if (checkedByNameField) {
                    checkedByNameField.value = '';
                    console.log('✅ Cleared checkedByName');
                }
                if (approvedByNameField) {
                    approvedByNameField.value = '';
                    console.log('✅ Cleared approvedByName');
                }
                if (receivedByNameField) {
                    receivedByNameField.value = '';
                    console.log('✅ Cleared receivedByName');
                }

                console.log('✅ Cleared all approval fields (no original data available)');
            }

            // Reset modification flag
            window.approvalDataModified = false;
            console.log('✅ Reset approval data modified flag to false');

            // Clear localStorage for this invoice
            if (invoiceData && invoiceData.stagingID) {
                const storageKey = `approval_${invoiceData.stagingID}`;
                console.log('🗑️ Clearing approval data from localStorage with key:', storageKey);
                localStorage.removeItem(storageKey);
                console.log('✅ Cleared approval data from localStorage');
            }

            // Show success message
            console.log('✅ Showing success message');
            Swal.fire({
                icon: 'success',
                title: 'Reset Successful',
                text: 'Approval data has been reset to original values',
                timer: 2000,
                showConfirmButton: false
            });

            console.log('✅ Approval data reset completed successfully');
        } else {
            console.log('❌ User cancelled reset operation');
        }
    });
}



// Load attachments from the main API response data
function loadAttachmentsFromData(attachments) {
    try {
        console.log('📎 loadAttachmentsFromData called with attachments:', attachments);
        console.log('📎 Attachments type:', typeof attachments);
        console.log('📎 Attachments length:', attachments ? attachments.length : 'null/undefined');
        console.log('📎 Attachments is array:', Array.isArray(attachments));

        // Initialize global attachment variables
        uploadedFiles = [];
        console.log('📎 Initialized uploadedFiles array');

        // Check if attachments exist and have valid data
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            console.log('📎 Found attachments array with', attachments.length, 'items');

            // Filter out attachments with empty or invalid file names
            const validAttachments = attachments.filter(attachment => {
                const fileName = attachment.fileName || attachment.file_name;
                const isValid = fileName && fileName !== 'string' && fileName.trim() !== '';
                if (!isValid) {
                    console.log('⚠️ Filtered out invalid attachment:', attachment);
                }
                return isValid;
            });

            console.log('📎 Valid attachments after filtering:', validAttachments.length);
            console.log('📎 Valid attachments details:', validAttachments);

            if (validAttachments.length > 0) {
                console.log('📎 Displaying existing attachments...');
                displayExistingAttachments(validAttachments);
                console.log('✅ Existing attachments displayed successfully');
            } else {
                console.log('⚠️ No valid attachments found after filtering');
                showNoExistingAttachments();
            }
        } else {
            console.log('⚠️ No attachments data or empty array');
            if (!attachments) {
                console.log('📎 Attachments is null/undefined');
            } else if (!Array.isArray(attachments)) {
                console.log('📎 Attachments is not an array, type:', typeof attachments);
            } else {
                console.log('📎 Attachments array is empty');
            }
            showNoExistingAttachments();
        }

    } catch (error) {
        console.error('💥 Error loading attachments from data:', error);
        console.error('💥 Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
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
        const formattedCreatedAt = createdAt ? formatDate(createdAt) : '';

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
        modal.addEventListener('click', function (e) {
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
        input.addEventListener('input', function () {
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
        input.addEventListener('input', function () {
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
        input.addEventListener('input', function () {
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
        modal.addEventListener('click', function (e) {
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

