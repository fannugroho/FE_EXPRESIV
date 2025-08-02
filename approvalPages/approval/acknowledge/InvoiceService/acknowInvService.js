// Global variables
let currentInvServiceData = null;
let currentUser = null;
let allUsers = []; // Store all users for kansaiEmployeeId lookup
let uploadedFiles = [];

// API Configuration
const API_BASE_URL = 'https://expressiv-be-sb.idsdev.site/api';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

// Initialize page functionality
function initializePage() {
    // Get current user
    try {
        currentUser = window.getCurrentUser();
        if (!currentUser) {
            Swal.fire({
                icon: 'error',
                title: 'Authentication Error',
                text: 'Please login to continue'
            }).then(() => {
                window.location.href = '../../../../pages/login.html';
            });
            return;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: error.message || 'Authentication system error. Please contact administrator.'
        }).then(() => {
            window.location.href = '../../../../pages/login.html';
        });
        return;
    }

    // Load users from API to get kansaiEmployeeId
    fetchUsers();
    
    // Load invoice service data from URL parameters
    loadInvServiceData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize button visibility (hide by default)
    updateButtonVisibility();
}

// Function to fetch users from API
async function fetchUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.data) {
            allUsers = result.data;
            console.log('Users loaded from API:', allUsers);
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        // Don't show error to user as this is not critical for basic functionality
    }
}

// Function to get kansaiEmployeeId for current user
function getCurrentUserKansaiEmployeeId() {
    if (!currentUser || !allUsers.length) {
        console.warn('No current user or users data available');
        return currentUser?.userId || currentUser?.username || 'unknown';
    }
    
    // Find the current user in the allUsers array
    const currentUserData = allUsers.find(user => 
        user.id === currentUser.userId || 
        user.username === currentUser.username ||
        user.name === currentUser.username
    );
    
    if (currentUserData && currentUserData.kansaiEmployeeId) {
        console.log('Found kansaiEmployeeId for current user:', currentUserData.kansaiEmployeeId);
        return currentUserData.kansaiEmployeeId;
    }
    
    console.warn('kansaiEmployeeId not found for current user, falling back to userId/username');
    return currentUser.userId || currentUser.username || 'unknown';
}

// Function to get full name of the current user
function getCurrentUserFullName() {
    if (!currentUser || !allUsers.length) {
        console.warn('No current user or users data available for full name');
        return currentUser?.username || 'Unknown User';
    }
    
    // Find the current user in the allUsers array
    const currentUserData = allUsers.find(user => 
        user.id === currentUser.userId || 
        user.username === currentUser.username ||
        user.name === currentUser.username
    );
    
    if (currentUserData && currentUserData.name) {
        console.log('Found full name for current user:', currentUserData.name);
        return currentUserData.name;
    }
    
    console.warn('Full name not found for current user, falling back to username');
    return currentUser.username || 'Unknown User';
}

// Function to load invoice service data from URL parameters
function loadInvServiceData() {
    const urlParams = new URLSearchParams(window.location.search);
    const stagingId = urlParams.get('staging-id');
    
    if (stagingId) {
        console.log('Loading invoice service data for staging ID:', stagingId);
        loadInvServiceFromAPI(stagingId);
    } else {
        console.error('No staging ID provided in URL parameters');
        Swal.fire({
            icon: 'error',
            title: 'Missing Data',
            text: 'No invoice service ID provided. Please return to the menu and select a valid invoice service.'
        }).then(() => {
            goToMenuAcknowInvService();
        });
    }
}

// Function to load invoice service data from API
async function loadInvServiceFromAPI(stagingId) {
    try {
        console.log('Fetching invoice service data from API...');
        
        const response = await fetch(`${API_BASE_URL}/ar-invoice-service/${stagingId}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.data) {
            console.log('Invoice service data loaded:', result.data);
            currentInvServiceData = result.data;
            populateInvServiceData(result.data);
            
            // Always fetch dropdown options
            fetchDropdownOptions(result.data);
        } else {
            throw new Error('No data received from API');
        }
        
    } catch (error) {
        console.error('Error loading invoice service data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error Loading Data',
            text: `Failed to load invoice service data: ${error.message}`
        }).then(() => {
            goToMenuAcknowInvService();
        });
    }
}

// Function to update button visibility based on current status
function updateButtonVisibility() {
    if (!currentInvServiceData) return;
    
    const status = currentInvServiceData.status || '';
    const acknowledgeButton = document.getElementById('acknowledgeButton');
    const rejectButton = document.getElementById('rejectButton');
    
    // Hide buttons if status is already acknowledged or rejected
    if (status === 'Acknowledged' || status === 'Rejected') {
        acknowledgeButton.style.display = 'none';
        rejectButton.style.display = 'none';
    } else {
        acknowledgeButton.style.display = 'inline-block';
        rejectButton.style.display = 'inline-block';
    }
}

// Function to populate invoice service data
function populateInvServiceData(data) {
    // Populate header fields
    document.getElementById('DocEntry').value = data.docEntry || '';
    document.getElementById('DocNum').value = data.docNum || '';
    document.getElementById('CardCode').value = data.cardCode || '';
    document.getElementById('CardName').value = data.cardName || '';
    document.getElementById('Status').value = data.status || '';
    document.getElementById('address').value = data.address || '';
    document.getElementById('NumAtCard').value = data.numAtCard || '';
    document.getElementById('DocCur').value = data.docCur || '';
    document.getElementById('docRate').value = data.docRate || '';
    document.getElementById('DocDate').value = formatDate(data.docDate);
    document.getElementById('DocDueDate').value = formatDate(data.docDueDate);
    document.getElementById('GroupNum').value = data.groupNum || '';
    document.getElementById('TrnspCode').value = data.trnspCode || '';
    document.getElementById('TaxNo').value = data.taxNo || '';
    document.getElementById('U_BSI_ShippingType').value = data.u_BSI_ShippingType || '';
    document.getElementById('U_BSI_PaymentGroup').value = data.u_BSI_PaymentGroup || '';
    document.getElementById('U_BSI_Expressiv_IsTransfered').value = data.u_BSI_Expressiv_IsTransfered || '';
    document.getElementById('U_BSI_UDF1').value = data.u_BSI_UDF1 || '';
    document.getElementById('U_BSI_UDF2').value = data.u_BSI_UDF2 || '';
    
    // Populate totals
    document.getElementById('PriceBefDi').value = data.priceBefDi || 0;
    document.getElementById('VatSum').value = data.vatSum || 0;
    document.getElementById('DocTotal').value = data.docTotal || 0;
    
    // Populate remarks
    document.getElementById('comments').value = data.comments || '';
    
    // Populate services table
    populateServicesTable(data.arInvoiceServices || []);
    
    // Update button visibility
    updateButtonVisibility();
    
    // Apply text wrapping
    setTimeout(() => {
        applyTextWrappingToAll();
    }, 100);
}

// Function to get status from invoice
function getStatusFromInvoice(invoice) {
    if (!invoice) return '';
    
    // Check if invoice has status field
    if (invoice.status) {
        return invoice.status;
    }
    
    // Check if invoice has U_BSI_Expressiv_Status field
    if (invoice.u_BSI_Expressiv_Status) {
        return invoice.u_BSI_Expressiv_Status;
    }
    
    // Default status
    return 'Open';
}

// Function to format date
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
}

// Function to populate services table
function populateServicesTable(services) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    if (!services || services.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = '<td colspan="8" class="text-center text-gray-500 py-4">No service items found</td>';
        tableBody.appendChild(noDataRow);
        return;
    }
    
    services.forEach((service, index) => {
        const row = createServiceRow(service, index);
        tableBody.appendChild(row);
    });
}

// Function to create service row
function createServiceRow(service, index) {
    const row = document.createElement('tr');
    row.className = 'border-b hover:bg-gray-50';
    
    row.innerHTML = `
        <td class="p-2 no-column">
            <input type="text" value="${service.lineNum || index + 1}" class="no-input bg-gray-100" readonly>
        </td>
        <td class="p-2 description-column">
            <textarea value="${service.description || ''}" class="w-full bg-gray-100" readonly>${service.description || ''}</textarea>
        </td>
        <td class="p-2 account-code-column">
            <input type="text" value="${service.accountCode || ''}" class="account-code-input bg-gray-100" readonly>
        </td>
        <td class="p-2 account-name-column">
            <input type="text" value="${service.accountName || ''}" class="account-name-input bg-gray-100" readonly>
        </td>
        <td class="p-2 tax-code-column">
            <input type="text" value="${service.taxCode || ''}" class="tax-code-input bg-gray-100" readonly>
        </td>
        <td class="p-2 wtax-liable-column">
            <input type="text" value="${service.wtaxLiable || ''}" class="wtax-liable-input bg-gray-100" readonly>
        </td>
        <td class="p-2 total-lc-column">
            <input type="text" value="${formatCurrency(service.totalLC || 0)}" class="total-lc-input bg-gray-100" readonly>
        </td>
        <td class="p-2 source-column">
            <input type="text" value="${service.source || ''}" class="source-input bg-gray-100" readonly>
        </td>
    `;
    
    return row;
}

// Function to setup event listeners
function setupEventListeners() {
    // Setup user search dropdowns
    setupUserSearchDropdowns();
}

// Function to setup user search dropdowns
function setupUserSearchDropdowns() {
    const userFields = ['acknowledgeBy', 'checkedBy', 'approvedBy', 'receivedBy'];
    
    userFields.forEach(fieldName => {
        const input = document.getElementById(`${fieldName}Name`);
        const dropdown = document.getElementById(`${fieldName}SelectDropdown`);
        const select = document.getElementById(fieldName);
        
        if (input && dropdown && select) {
            // Setup search functionality
            input.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const options = Array.from(select.options).slice(1); // Skip first option
                
                dropdown.innerHTML = '';
                
                if (searchTerm.length > 0) {
                    const filteredOptions = options.filter(option => 
                        option.text.toLowerCase().includes(searchTerm)
                    );
                    
                    filteredOptions.forEach(option => {
                        const div = document.createElement('div');
                        div.className = 'dropdown-item';
                        div.textContent = option.text;
                        div.onclick = () => {
                            input.value = option.text;
                            select.value = option.value;
                            dropdown.classList.add('hidden');
                        };
                        dropdown.appendChild(div);
                    });
                    
                    if (filteredOptions.length > 0) {
                        dropdown.classList.remove('hidden');
                    } else {
                        dropdown.classList.add('hidden');
                    }
                } else {
                    dropdown.classList.add('hidden');
                }
            });
            
            // Hide dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            });
        }
    });
}

// Function to fetch dropdown options
async function fetchDropdownOptions(invServiceData = null) {
    try {
        // Fetch users for dropdowns
        const usersResponse = await fetch(`${API_BASE_URL}/users`);
        if (usersResponse.ok) {
            const usersResult = await usersResponse.json();
            if (usersResult.data) {
                populateUserSelects(usersResult.data, invServiceData);
            }
        }
    } catch (error) {
        console.error('Error fetching dropdown options:', error);
    }
}

// Function to populate user selects
function populateUserSelects(users, invServiceData = null) {
    const userFields = ['preparedBy', 'acknowledgeBy', 'checkedBy', 'approvedBy', 'receivedBy'];
    
    userFields.forEach(fieldName => {
        const select = document.getElementById(fieldName);
        const input = document.getElementById(`${fieldName}Name`);
        
        if (select && input) {
            // Clear existing options except the first one
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Add user options
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name || user.username;
                select.appendChild(option);
            });
            
            // Set current user for acknowledge field if not already set
            if (fieldName === 'acknowledgeBy' && !input.value) {
                const currentUserFullName = getCurrentUserFullName();
                input.value = currentUserFullName;
                
                // Find and set the corresponding select value
                const currentUserOption = Array.from(select.options).find(option => 
                    option.textContent === currentUserFullName
                );
                if (currentUserOption) {
                    select.value = currentUserOption.value;
                }
            }
            
            // Populate existing values if available
            if (invServiceData) {
                const fieldValue = invServiceData[fieldName];
                if (fieldValue) {
                    const userOption = Array.from(select.options).find(option => 
                        option.value === fieldValue || option.textContent === fieldValue
                    );
                    if (userOption) {
                        select.value = userOption.value;
                        input.value = userOption.textContent;
                    }
                }
            }
        }
    });
}

// Function to acknowledge invoice service
function acknowledgeInvService() {
    if (!currentInvServiceData) {
        Swal.fire({
            icon: 'error',
            title: 'No Data',
            text: 'No invoice service data available to acknowledge.'
        });
        return;
    }
    
    const acknowledgeByName = document.getElementById('acknowledgeByName').value;
    if (!acknowledgeByName) {
        Swal.fire({
            icon: 'error',
            title: 'Missing Information',
            text: 'Please select an acknowledge by person.'
        });
        return;
    }
    
    Swal.fire({
        title: 'Confirm Acknowledge',
        text: 'Are you sure you want to acknowledge this invoice service?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Acknowledge',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateInvServiceStatus('Acknowledged');
        }
    });
}

// Function to reject invoice service
function rejectInvService() {
    if (!currentInvServiceData) {
        Swal.fire({
            icon: 'error',
            title: 'No Data',
            text: 'No invoice service data available to reject.'
        });
        return;
    }
    
    const acknowledgeByName = document.getElementById('acknowledgeByName').value;
    if (!acknowledgeByName) {
        Swal.fire({
            icon: 'error',
            title: 'Missing Information',
            text: 'Please select an acknowledge by person.'
        });
        return;
    }
    
    Swal.fire({
        title: 'Confirm Reject',
        text: 'Are you sure you want to reject this invoice service?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, Reject',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            updateInvServiceStatus('Rejected');
        }
    });
}

// Function to update invoice service status
async function updateInvServiceStatus(status) {
    const acknowledgeButton = document.getElementById('acknowledgeButton');
    const rejectButton = document.getElementById('rejectButton');
    const acknowledgeSpinner = document.getElementById('acknowledgeSpinner');
    const rejectSpinner = document.getElementById('rejectSpinner');
    
    // Show loading state
    if (status === 'Acknowledged') {
        acknowledgeButton.disabled = true;
        acknowledgeSpinner.classList.remove('hidden');
    } else {
        rejectButton.disabled = true;
        rejectSpinner.classList.remove('hidden');
    }
    
    try {
        const acknowledgeByName = document.getElementById('acknowledgeByName').value;
        const acknowledgeBy = document.getElementById('acknowledgeBy').value;
        
        const updateData = {
            stagingId: currentInvServiceData.stagingId || currentInvServiceData.id,
            status: status,
            acknowledgeBy: acknowledgeBy,
            acknowledgeByName: acknowledgeByName,
            acknowledgeDate: new Date().toISOString(),
            updatedBy: getCurrentUserKansaiEmployeeId(),
            updatedByName: getCurrentUserFullName()
        };
        
        console.log('Updating invoice service status:', updateData);
        
        const response = await fetch(`${API_BASE_URL}/ar-invoice-service/update-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: `Invoice service has been ${status.toLowerCase()} successfully.`
            }).then(() => {
                // Update local data
                currentInvServiceData.status = status;
                currentInvServiceData.acknowledgeBy = acknowledgeBy;
                currentInvServiceData.acknowledgeByName = acknowledgeByName;
                currentInvServiceData.acknowledgeDate = updateData.acknowledgeDate;
                
                // Update display
                document.getElementById('Status').value = status;
                updateButtonVisibility();
                
                // Redirect back to menu
                goToMenuAcknowInvService();
            });
        } else {
            throw new Error(result.message || 'Failed to update status');
        }
        
    } catch (error) {
        console.error('Error updating invoice service status:', error);
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: `Failed to ${status.toLowerCase()} invoice service: ${error.message}`
        });
    } finally {
        // Hide loading state
        if (status === 'Acknowledged') {
            acknowledgeButton.disabled = false;
            acknowledgeSpinner.classList.add('hidden');
        } else {
            rejectButton.disabled = false;
            rejectSpinner.classList.add('hidden');
        }
    }
}

// Function to navigate back to menu
function goToMenuAcknowInvService() {
    window.location.href = '../../dashboard/dashboardAcknowledge/ARInvoice/menuARInvoiceAcknowledge.html';
}

// Function to format currency
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0.00';
    return parseFloat(amount).toFixed(2);
}

// Function to validate numeric input
function validateNumericInput(input) {
    const value = input.value;
    const numericValue = value.replace(/[^0-9.-]/g, '');
    input.value = numericValue;
}

// Function to refresh text wrapping
function refreshTextWrapping() {
    setTimeout(() => {
        applyTextWrappingToAll();
    }, 100);
}

// Function to apply text wrapping to all relevant elements
function applyTextWrappingToAll() {
    const textElements = document.querySelectorAll('.description-column textarea, .account-code-column input, .account-name-column input, .total-lc-column input');
    
    textElements.forEach(element => {
        handleTextWrapping(element);
    });
}

// Function to handle text wrapping based on character length
function handleTextWrapping(element) {
    const text = element.value || element.textContent || '';
    const charLength = text.length;
    
    // Remove existing classes
    element.classList.remove('wrap-text', 'no-wrap', 'auto-resize');
    
    if (charLength > 15) {
        // Apply wrap text styling for long content
        element.classList.add('wrap-text', 'auto-resize');
        
        // Auto-adjust height for textarea elements
        if (element.tagName === 'TEXTAREA') {
            const lineHeight = 20; // Approximate line height
            const lines = Math.ceil(charLength / 20); // Rough estimate of lines needed
            const newHeight = Math.min(Math.max(40, lines * lineHeight), 80);
            element.style.height = newHeight + 'px';
        }
    } else {
        // Apply no-wrap styling for short content
        element.classList.add('no-wrap');
        
        // Reset height for textarea elements
        if (element.tagName === 'TEXTAREA') {
            element.style.height = '40px';
        }
    }
}

// Function to preview PDF files
function previewPDF(event) {
    const files = event.target.files;
    const fileList = document.getElementById('fileList');
    
    if (!files || files.length === 0) {
        fileList.innerHTML = '';
        uploadedFiles = [];
        return;
    }
    
    uploadedFiles = Array.from(files);
    fileList.innerHTML = '';
    
    uploadedFiles.forEach((file, index) => {
        if (file.type === 'application/pdf') {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileSize = (file.size / 1024 / 1024).toFixed(2);
            
            fileItem.innerHTML = `
                <div class="file-item-header">
                    <div class="file-item-name">${file.name}</div>
                    <div class="file-item-size">${fileSize} MB</div>
                    <div class="file-item-actions">
                        <button type="button" class="btn-view" onclick="viewPDF(${index})">View</button>
                        <button type="button" class="btn-remove" onclick="removeFile(${index})">Remove</button>
                    </div>
                </div>
            `;
            
            fileList.appendChild(fileItem);
        }
    });
}

// Function to view PDF
function viewPDF(index) {
    const file = uploadedFiles[index];
    if (file) {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
    }
}

// Function to remove file
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    previewPDF({ target: { files: uploadedFiles } });
}
