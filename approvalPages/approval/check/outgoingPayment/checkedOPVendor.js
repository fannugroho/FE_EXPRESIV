// Global variable for file uploads
let uploadedFiles = [];
let existingAttachments = []; // Track existing attachments from API
let attachmentsToKeep = []; // Track which existing attachments to keep

// Global variables
let rowCounter = 1;
let outgoingPaymentData = null;

// Helper function to get logged-in user ID
function getUserId() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    return user ? user.id : null;
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
        // Format with US locale (thousand separator: ',', decimal separator: '.')
        if (hasDecimal) {
            // Get the number of decimal places in the original number
            const decimalPlaces = numStr.split('.')[1].length;
            return num.toLocaleString('en-US', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
            });
        } else {
            // No decimal places in the original number
            return num.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        }
    } catch (e) {
        // Fallback for very large numbers that might cause issues with toLocaleString
        console.error('Error formatting number:', e);
        
        // Manual formatting for extremely large numbers using US format
        let strNum = num.toString();
        let sign = '';
        
        if (strNum.startsWith('-')) {
            sign = '-';
            strNum = strNum.substring(1);
        }
        
        // Split into integer and decimal parts
        const parts = strNum.split('.');
        const integerPart = parts[0];
        const decimalPart = parts.length > 1 ? '.' + parts[1] : ''; // Use period as decimal separator
        
        // Add thousand separators (comma) to integer part
        let formattedInteger = '';
        for (let i = 0; i < integerPart.length; i++) {
            if (i > 0 && (integerPart.length - i) % 3 === 0) {
                formattedInteger += ','; // Use comma as thousand separator
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
        // Handle US format (thousand separator: ',', decimal separator: '.')
        // Remove commas (thousand separators) with nothing
        const numericValue = formattedValue.toString()
            .replace(/,/g, ''); // Remove thousand separators (commas)
        
        return parseFloat(numericValue) || 0;
    } catch (e) {
        console.error('Error parsing currency:', e);
        return 0;
    }
}

// Function to initialize input field validations
function initializeInputValidations() {
    // Setup numeric input validations with currency formatting
    setupCurrencyInput('total');
    setupCurrencyInput('wTax');
    setupCurrencyInput('totalPayment');
    setupCurrencyInput('totalAmountDue');
    
    // Setup text input validations (nvarchar)
    setupTextInput('description');
    
    // Add event listeners for calculating total payment
    document.getElementById('total').addEventListener('input', calculateTotalPayment);
    document.getElementById('wTax').addEventListener('input', calculateTotalPayment);
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
            // For US format, we need to handle commas
            let rawValue = this.value;
            
            // Remove all commas (thousand separators)
            rawValue = rawValue.replace(/,/g, '');
            
            // Finally, remove any other non-numeric characters except decimal point
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

// Function to calculate Total Payment (Total - WTax)
function calculateTotalPayment() {
    const totalInput = document.getElementById('total');
    const wTaxInput = document.getElementById('wTax');
    const totalPaymentInput = document.getElementById('totalPayment');
    
    if (totalInput && wTaxInput && totalPaymentInput) {
        // Parse the currency values using the parseCurrency function
        const totalValue = parseCurrency(totalInput.value) || 0;
        const wTaxValue = parseCurrency(wTaxInput.value) || 0;
        
        // Calculate total payment
        const totalPaymentValue = totalValue - wTaxValue;
        
        // Format and set the total payment value
        totalPaymentInput.numericValue = totalPaymentValue;
        totalPaymentInput.value = formatCurrency(totalPaymentValue);
    }
}

// Function to fetch all dropdown options
function fetchDropdownOptions(approvalData = null) {
    fetchDepartments();
    fetchUsers(approvalData);
    fetchTransactionType();
    fetchBusinessPartners();
    setupStatusSearch();
}

// Function to fetch departments from API
function fetchDepartments() {
    fetch(`${BASE_URL}/api/department`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Department data:", data);
            setupDepartmentSearch(data.data);
        })
        .catch(error => {
            console.error('Error fetching departments:', error);
        });
}

// Function to setup department search functionality
function setupDepartmentSearch(departments) {
    // Store departments globally for search functionality
    window.departments = departments.map(dept => ({
        id: dept.id,
        name: dept.name
    }));
    
    // Setup search functionality for department
    const departmentSearchInput = document.getElementById('departmentSearch');
    const departmentDropdown = document.getElementById('departmentDropdown');
    const departmentHiddenInput = document.getElementById('departmentId');
    
    if (departmentSearchInput && departmentDropdown && departmentHiddenInput) {
        // Function to filter departments
        window.filterDepartments = function() {
            const searchText = departmentSearchInput.value.toLowerCase();
            populateDepartmentDropdown(searchText);
            departmentDropdown.classList.remove('hidden');
        };

        // Function to populate dropdown with filtered departments
        function populateDepartmentDropdown(filter = '') {
            departmentDropdown.innerHTML = '';
            
            const filteredDepartments = window.departments.filter(dept => 
                dept.name.toLowerCase().includes(filter)
            );
            
            filteredDepartments.forEach(dept => {
                const option = document.createElement('div');
                option.className = 'dropdown-item';
                option.innerText = dept.name;
                option.onclick = function() {
                    departmentSearchInput.value = dept.name;
                    departmentHiddenInput.value = dept.id;
                    departmentDropdown.classList.add('hidden');
                };
                departmentDropdown.appendChild(option);
            });
            
            if (filteredDepartments.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No matching departments';
                departmentDropdown.appendChild(noResults);
            }
        }

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!departmentSearchInput.contains(event.target) && !departmentDropdown.contains(event.target)) {
                departmentDropdown.classList.add('hidden');
            }
        });

        // Show dropdown on focus
        departmentSearchInput.addEventListener('focus', function() {
            populateDepartmentDropdown(departmentSearchInput.value.toLowerCase());
            departmentDropdown.classList.remove('hidden');
        });

        // Initial population
        populateDepartmentDropdown();
    }
}

// Function to setup status search functionality
function setupStatusSearch() {
    // Define available statuses
    const statuses = [
        { id: 'Draft', name: 'Draft' },
        { id: 'Closed', name: 'Approved' },
        { id: 'Rejected', name: 'Rejected' },
        { id: 'Prepared', name: 'Prepared' },
        { id: 'Checked', name: 'Checked' },
        { id: 'Acknowledged', name: 'Acknowledged' },
        { id: 'Received', name: 'Received' },
        { id: 'Closed', name: 'Closed' }
    ];
    
    // Store statuses globally for search functionality
    window.statuses = statuses;
    
    // Setup search functionality for status
    const statusSearchInput = document.getElementById('statusSearch');
    const statusDropdown = document.getElementById('statusDropdown');
    const statusHiddenInput = document.getElementById('status');
    
    if (statusSearchInput && statusDropdown && statusHiddenInput) {
        // Function to filter statuses
        window.filterStatuses = function() {
            const searchText = statusSearchInput.value.toLowerCase();
            populateStatusDropdown(searchText);
            statusDropdown.classList.remove('hidden');
        };

        // Function to populate dropdown with filtered statuses
        function populateStatusDropdown(filter = '') {
            statusDropdown.innerHTML = '';
            
            const filteredStatuses = window.statuses.filter(status => 
                status.name.toLowerCase().includes(filter)
            );
            
            filteredStatuses.forEach(status => {
                const option = document.createElement('div');
                option.className = 'dropdown-item';
                option.innerText = status.name;
                option.onclick = function() {
                    statusSearchInput.value = status.name;
                    statusHiddenInput.value = status.id;
                    statusDropdown.classList.add('hidden');
                };
                statusDropdown.appendChild(option);
            });
            
            if (filteredStatuses.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No matching statuses';
                statusDropdown.appendChild(noResults);
            }
        }

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!statusSearchInput.contains(event.target) && !statusDropdown.contains(event.target)) {
                statusDropdown.classList.add('hidden');
            }
        });

        // Show dropdown on focus
        statusSearchInput.addEventListener('focus', function() {
            populateStatusDropdown(statusSearchInput.value.toLowerCase());
            statusDropdown.classList.remove('hidden');
        });

        // Initial population
        populateStatusDropdown();
    }
}

// Function to fetch transaction types from API
function fetchTransactionType() {
    fetch(`${BASE_URL}/api/transactiontypes/filter?category=OutgoingPayment`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Transaction Type data:", data);
            setupTransactionTypeSearch(data.data);
        })
        .catch(error => {
            console.error('Error fetching transaction type:', error);
        });
}

// Function to setup transaction type search functionality
function setupTransactionTypeSearch(transactionTypes) {
    // Store transaction types globally for search functionality
    window.transactionTypes = transactionTypes.map(type => ({
        id: type.name,
        name: type.name
    }));
    
    // Setup search functionality for transaction type
    const transactionTypeSearchInput = document.getElementById('transactionTypeSearch');
    const transactionTypeDropdown = document.getElementById('transactionTypeDropdown');
    const transactionTypeHiddenInput = document.getElementById('transactionType');
    
    if (transactionTypeSearchInput && transactionTypeDropdown && transactionTypeHiddenInput) {
        // Function to filter transaction types
        window.filterTransactionTypes = function() {
            const searchText = transactionTypeSearchInput.value.toLowerCase();
            populateTransactionTypeDropdown(searchText);
            transactionTypeDropdown.classList.remove('hidden');
        };

        // Function to populate dropdown with filtered transaction types
        function populateTransactionTypeDropdown(filter = '') {
            transactionTypeDropdown.innerHTML = '';
            
            const filteredTypes = window.transactionTypes.filter(type => 
                type.name.toLowerCase().includes(filter)
            );
            
            filteredTypes.forEach(type => {
                const option = document.createElement('div');
                option.className = 'dropdown-item';
                option.innerText = type.name;
                option.onclick = function() {
                    transactionTypeSearchInput.value = type.name;
                    transactionTypeHiddenInput.value = type.id;
                    transactionTypeDropdown.classList.add('hidden');
                    
                    // Call toggleClosedByVisibility after setting transaction type
                    toggleClosedByVisibility();
                };
                transactionTypeDropdown.appendChild(option);
            });
            
            if (filteredTypes.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No matching transaction types';
                transactionTypeDropdown.appendChild(noResults);
            }
        }

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!transactionTypeSearchInput.contains(event.target) && !transactionTypeDropdown.contains(event.target)) {
                transactionTypeDropdown.classList.add('hidden');
            }
        });

        // Show dropdown on focus
        transactionTypeSearchInput.addEventListener('focus', function() {
            populateTransactionTypeDropdown(transactionTypeSearchInput.value.toLowerCase());
            transactionTypeDropdown.classList.remove('hidden');
        });

        // Initial population
        populateTransactionTypeDropdown();
    }
}

// Function to fetch users from API
function fetchUsers(approvalData = null) {
    fetch(`${BASE_URL}/api/users`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("User data:", data);
            populateUserSelects(data.data, approvalData);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
}

// Function to populate department select
function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("departmentId");
    if (!departmentSelect) return;
    
    // Store the currently selected value
    const currentValue = departmentSelect.value;
    const currentText = departmentSelect.options[departmentSelect.selectedIndex]?.text;
    
    departmentSelect.innerHTML = '<option value="" disabled>Select Department</option>';

    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.id;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
        
        // If this department matches the current text, select it
        if (department.name === currentText) {
            option.selected = true;
        }
    });
    
    // If we have a current value and it wasn't matched by text, try to select by value
    if (currentValue && departmentSelect.value !== currentValue) {
        departmentSelect.value = currentValue;
    }
}

// Function to populate user selects
function populateUserSelects(users, approvalData = null) {
    // Store users globally for search functionality
    window.requesters = users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        department: user.department
    }));
    
    // Store employees globally for reference
    window.employees = users.map(user => ({
        id: user.id,
        kansaiEmployeeId: user.kansaiEmployeeId,
        fullName: user.fullName,
        department: user.department
    }));

    // Populate RequesterId dropdown with search functionality (like addCash.js)
    const requesterSelect = document.getElementById("RequesterId");
    if (requesterSelect) {
        // Clear existing options first
        requesterSelect.innerHTML = '<option value="">Select a requester</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.fullName;
            requesterSelect.appendChild(option);
        });
    }

    // Setup search functionality for requester
    const requesterSearchInput = document.getElementById('requesterSearch');
    const requesterDropdown = document.getElementById('requesterDropdown');
    
    if (requesterSearchInput && requesterDropdown) {
        // Function to filter requesters
        window.filterRequesters = function() {
            const searchText = requesterSearchInput.value.toLowerCase();
            populateRequesterDropdown(searchText);
            requesterDropdown.classList.remove('hidden');
        };

        // Function to populate dropdown with filtered requesters
        function populateRequesterDropdown(filter = '') {
            requesterDropdown.innerHTML = '';
            
            const filteredRequesters = window.requesters.filter(r => 
                r.fullName.toLowerCase().includes(filter)
            );
            
            filteredRequesters.forEach(requester => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerText = requester.fullName;
                option.onclick = function() {
                    requesterSearchInput.value = requester.fullName;
                    // // Auto-fill the paidTo field with the selected requester name
                    // const paidToField = document.getElementById('paidTo');
                    // if (paidToField) {
                    //     paidToField.value = requester.fullName;
                    // }
                    requesterDropdown.classList.add('hidden');
                    //update department
                    const departmentSelect = document.getElementById('departmentId');
                    if (requester.department) {
                        // Find the department option and select it
                        const departmentOptions = departmentSelect.options;
                        for (let i = 0; i < departmentOptions.length; i++) {
                            if (departmentOptions[i].textContent === requester.department) {
                                departmentSelect.selectedIndex = i;
                                break;
                            }
                        }
                        // If no matching option found, create and select a new one
                        if (departmentSelect.value === "" || departmentSelect.selectedIndex === 0) {
                            const newOption = document.createElement('option');
                            newOption.value = requester.department;
                            newOption.textContent = requester.department;
                            newOption.selected = true;
                            departmentSelect.appendChild(newOption);
                        }
                    }
                };
                requesterDropdown.appendChild(option);
            });
            
            if (filteredRequesters.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No matching requesters';
                requesterDropdown.appendChild(noResults);
            }
        }

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!requesterSearchInput.contains(event.target) && !requesterDropdown.contains(event.target)) {
                requesterDropdown.classList.add('hidden');
            }
        });

        // Initial population
        populateRequesterDropdown();
    }

    // Auto-populate employee fields with logged-in user data (same as addCash)
    const loggedInUserId = getUserId();
    console.log("Logged in user ID:", loggedInUserId);
    console.log("Available employees:", window.employees);
    
    if(loggedInUserId && window.employees) {
        const loggedInEmployee = window.employees.find(emp => emp.id === loggedInUserId);
        console.log("Found logged in employee:", loggedInEmployee);
        
        if(loggedInEmployee) {
            const employeeNIK = loggedInEmployee.kansaiEmployeeId || '';
            const employeeName = loggedInEmployee.fullName || '';
            
            // Auto-fill employee fields
            document.getElementById("employeeId").value = employeeNIK;
            document.getElementById("employeeName").value = employeeName;
            
            console.log("Auto-populated employee fields:", {
                employeeNIK: employeeNIK,
                employeeName: employeeName
            });
        } else {
            console.warn("Could not find logged in employee in employees array");
        }
    } else {
        console.warn("Missing logged in user ID or employees array");
    }

    // Populate approval dropdowns with search functionality (same as addCash)
    const approvalSelects = [
        "Approval.PreparedById",
        "Approval.CheckedById", 
        "Approval.ApprovedById",
        "Approval.AcknowledgedById",
        "Approval.ReceivedById",
        "Approval.ClosedById"
    ];

    approvalSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.fullName;
                select.appendChild(option);
                // Auto-select and disable for Proposed by (Approval.PreparedById)
                if(selectId == "Approval.PreparedById"){
                   if(user.id == getUserId()){
                    option.selected = true;
                    select.disabled = true;
                    // Update the search input for Proposed by
                    const proposedBySearch = document.getElementById('Approval.PreparedByIdSearch');
                    if (proposedBySearch) {
                        proposedBySearch.value = user.fullName;
                        proposedBySearch.disabled = true;
                    }
                   }
                }
            });
        }
    });
    
    // Set approval values from approvalData if available (after populating options)
    if (approvalData) {
        populateApprovals(approvalData);
    }
}

function saveDocument() {
    const docNumber = (JSON.parse(localStorage.getItem("documents")) || []).length + 1;
    const documentData = {
        docNumber,
        invoiceNo : document.getElementById("invoiceNo").value,
        requester: document.getElementById("requester").value,
        department: document.getElementById("department").value,
        vendor: document.getElementById("vendor").value,
        name: document.getElementById("name").value,
        contactPerson: document.getElementById("contactPerson").value,
        vendorRefNo: document.getElementById("vendorRefNo").value,
        postingDate: document.getElementById("postingDate").value,
        dueDate: document.getElementById("dueDate").value,
        requiredDate: document.getElementById("requiredDate").value,
        classification: document.getElementById("classification").value,
        docType: document.getElementById("docType").value,
        docStatus: document.getElementById("docStatus").value,
        approvals: {
            prepared: document.getElementById("prepared").checked,
            checked: document.getElementById("checked").checked,
            approved: document.getElementById("approved").checked,
            knowledge: document.getElementById("knowledge").checked,
        }
    };
    
    let documents = JSON.parse(localStorage.getItem("documents")) || [];
    documents.push(documentData);
    localStorage.setItem("documents", JSON.stringify(documents));
    alert("Dokumen berhasil disimpan!");
}

// function goToMenuCash() {
//     window.location.href = "../pages/MenuCash.html";
// }

// Only add event listener if the element exists (to prevent errors)
const docTypeElement = document.getElementById("docType");
if (docTypeElement) {
    docTypeElement.addEventListener("change", function() {
        const selectedValue = this.value;
        const prTable = document.getElementById("prTable");

        if (selectedValue === "Pilih") {
            prTable.style.display = "none";
        } else {
            prTable.style.display = "table";
        }
    });
}

function previewPDF(event) {
    const files = event.target.files;
    const totalExistingFiles = attachmentsToKeep.length + uploadedFiles.length;
    
    if (files.length + totalExistingFiles > 5) {
        alert('Maximum 5 PDF files are allowed.');
        event.target.value = ''; // Clear the file input
        return;
    }
    
    Array.from(files).forEach(file => {
        if (file.type === 'application/pdf') {
            uploadedFiles.push(file);
        } else {
            alert('Please upload a valid PDF file');
        }
    });
    
    displayFileList();
    updateAttachmentsDisplay();
}

function displayFileList() {
    // Simple display of uploaded files count
    console.log(`${uploadedFiles.length} new file(s) uploaded`);
    // You can implement a more sophisticated file list display here if needed
}

// Function to remove a new uploaded file
function removeUploadedFile(index) {
    uploadedFiles.splice(index, 1);
    updateAttachmentsDisplay();
}

// Function to remove an existing attachment
function removeExistingAttachment(attachmentId) {
    const index = attachmentsToKeep.indexOf(attachmentId);
    if (index > -1) {
        attachmentsToKeep.splice(index, 1);
        updateAttachmentsDisplay();
    }
}

// Function to update the attachments display
function updateAttachmentsDisplay() {
    const attachmentsList = document.getElementById('attachmentsList');
    if (!attachmentsList) return;
    
    attachmentsList.innerHTML = ''; // Clear existing display
    
    // Display existing attachments that are marked to keep
    const existingToKeep = existingAttachments.filter(att => attachmentsToKeep.includes(att.id));
    existingToKeep.forEach(attachment => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex items-center justify-between p-2 bg-white border rounded mb-2 hover:bg-gray-50';
        attachmentItem.innerHTML = `
            <div class="flex items-center">
                <span class="text-blue-600 mr-2">📄</span>
                <span class="text-sm font-medium">${attachment.fileName}</span>
                <span class="text-xs text-gray-500 ml-2">(existing)</span>
            </div>
            <div class="flex items-center gap-2">
                <a href="${attachment.fileUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm font-semibold px-3 py-1 border border-blue-500 rounded hover:bg-blue-50 transition">
                    View
                </a>
                ${outgoingPaymentData && outgoingPaymentData.status && outgoingPaymentData.status.toLowerCase() === 'draft' ? 
                `<button onclick="removeExistingAttachment('${attachment.id}')" class="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1 border border-red-500 rounded hover:bg-red-50 transition">
                    Remove
                </button>` : ''}
            </div>
        `;
        attachmentsList.appendChild(attachmentItem);
    });
    
    // Display new uploaded files
    uploadedFiles.forEach((file, index) => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded mb-2';
        attachmentItem.innerHTML = `
            <div class="flex items-center">
                <span class="text-green-600 mr-2">📄</span>
                <span class="text-sm font-medium">${file.name}</span>
                <span class="text-xs text-green-600 ml-2">(new)</span>
            </div>
            <div class="flex items-center gap-2">
                ${outgoingPaymentData && outgoingPaymentData.status && outgoingPaymentData.status.toLowerCase() === 'draft' ? 
                `<button onclick="removeUploadedFile(${index})" class="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1 border border-red-500 rounded hover:bg-red-50 transition">
                    Remove
                </button>` : ''}
            </div>
        `;
        attachmentsList.appendChild(attachmentItem);
    });
    
    // Show message if no attachments
    if (existingToKeep.length === 0 && uploadedFiles.length === 0) {
        attachmentsList.innerHTML = '<p class="text-gray-500 text-sm text-center py-2">No attachments</p>';
    }
    
    // Show attachment count
    const totalAttachments = existingToKeep.length + uploadedFiles.length;
    console.log(`Total attachments: ${totalAttachments} (${existingToKeep.length} existing, ${uploadedFiles.length} new)`);
}

// Function to add a new row to the table
function addRow() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    // Create a new row
    const newRow = document.createElement('tr');
    
    // Generate a unique ID suffix for the new row's inputs
    const rowId = Date.now();
    
    // Set the row HTML content
    newRow.innerHTML = `
        <td class="p-2 border">
            <input type="text" id="description_${rowId}" maxlength="255" class="w-full" />
        </td>
        <td class="p-2 border">
            <input type="text" id="total_${rowId}" class="w-full currency-input" />
        </td>
        <td class="p-2 border">
            <input type="text" id="wTax_${rowId}" class="w-full currency-input" />
        </td>
        <td class="p-2 border">
            <input type="text" id="totalPayment_${rowId}" class="w-full currency-input" readonly />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;
    
    // Add the new row to the table
    tableBody.appendChild(newRow);
    
    // Setup currency inputs for the new row
    setupCurrencyInput(`total_${rowId}`);
    setupCurrencyInput(`wTax_${rowId}`);
    setupCurrencyInput(`totalPayment_${rowId}`);
    
    // Add event listeners for calculation
    const totalInput = document.getElementById(`total_${rowId}`);
    const wTaxInput = document.getElementById(`wTax_${rowId}`);
    
    if (totalInput && wTaxInput) {
        // Calculate total payment when total or wTax changes
        totalInput.addEventListener('input', function() {
            calculateRowTotalPayment(rowId);
            updateTotalAmountDue();
        });
        
        wTaxInput.addEventListener('input', function() {
            calculateRowTotalPayment(rowId);
            updateTotalAmountDue();
        });
    }
}

// Function to calculate total payment for a specific row
function calculateRowTotalPayment(rowId) {
    const totalInput = document.getElementById(`total_${rowId}`);
    const wTaxInput = document.getElementById(`wTax_${rowId}`);
    const totalPaymentInput = document.getElementById(`totalPayment_${rowId}`);
    
    if (totalInput && wTaxInput && totalPaymentInput) {
        // Parse the currency values
        const totalValue = parseCurrency(totalInput.value) || 0;
        const wTaxValue = parseCurrency(wTaxInput.value) || 0;
        
        // Calculate total payment
        const totalPaymentValue = totalValue - wTaxValue;
        
        // Format and set the total payment value
        totalPaymentInput.numericValue = totalPaymentValue;
        totalPaymentInput.value = formatCurrency(totalPaymentValue);
    }
}

// Function to delete a row
function deleteRow(button) {
    const row = button.closest('tr');
    if (row) {
        row.remove();
        // Update the total amount due after removing a row
        updateTotalAmountDue();
    }
}

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup currency inputs for the initial row
    setupCurrencyInput('total');
    setupCurrencyInput('wTax');
    setupCurrencyInput('totalPayment');
    setupCurrencyInput('totalAmountDue');
    
    // Add event listeners for the initial row
    const totalInput = document.getElementById('total');
    const wTaxInput = document.getElementById('wTax');
    
    if (totalInput && wTaxInput) {
        totalInput.addEventListener('input', function() {
            calculateTotalPayment();
            updateTotalAmountDue();
        });
        
        wTaxInput.addEventListener('input', function() {
            calculateTotalPayment();
            updateTotalAmountDue();
        });
    }
    
    // Setup department, status, and transaction type search
    setupDepartmentSearch();
    setupStatusSearch();
    setupTransactionTypeSearch();
});

function confirmDelete() {
    Swal.fire({
        title: 'Apakah dokumen ini akan dihapus?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteDocument(); // Memanggil fungsi delete setelah konfirmasi
        }
    });
}

function deleteDocument() {
    // Get the ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('op-id');
    
    if (!id) {
        Swal.fire('Error!', 'ID outgoing payment tidak ditemukan.', 'error');
        return;
    }
    
    // Call the DELETE API
    fetch(`${BASE_URL}/api/outgoing-payment/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status === 204) {
            // 204 No Content - Success case
            Swal.fire('Terhapus!', 'Dokumen berhasil dihapus.', 'success')
            .then(() => {
                // Redirect to previous page or list page after successful deletion
                window.history.back();
            });
        } else if (response.ok) {
            // If there's a response body, try to parse it
            return response.json().then(data => {
                if (data.status) {
                    Swal.fire('Terhapus!', 'Dokumen berhasil dihapus.', 'success')
                    .then(() => {
                        window.history.back();
                    });
                } else {
                    Swal.fire('Error!', data.message || 'Gagal menghapus dokumen karena status dokumen sudah bukan draft.', 'error');
                }
            });
        } else {
            Swal.fire('Error!', `Gagal menghapus dokumen. Status: ${response.status}`, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire('Error!', 'Terjadi kesalahan saat menghapus dokumen.', 'error');
    });
}

function loadOutgoingPaymentData() {
    // Get the ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('op-id');
    
    if (!id) {
        Swal.fire('Error!', 'ID outgoing payment tidak ditemukan di URL.', 'error');
        return;
    }
    
    // Call the GET API
    fetch(`${BASE_URL}/api/outgoing-payment/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status === 200) {
            return response.json();
        } else if (response.status === 404) {
            throw new Error('Data outgoing payment tidak ditemukan');
        } else {
            throw new Error(`Error: ${response.status}`);
        }
    })
    .then(result => {
        if (result.status && result.data) {
            console.log("result", result);
            populateForm(result.data);
        } else {
            Swal.fire('Error!', result.message || 'Gagal memuat data outgoing payment.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.message.includes('tidak ditemukan')) {
            Swal.fire('Error!', 'Data outgoing payment tidak ditemukan.', 'error');
        } else {
            Swal.fire('Error!', 'Terjadi kesalahan saat memuat data outgoing payment.', 'error');
        }
    });
}

function populateForm(data) {
    // Store the global outgoing payment data
    outgoingPaymentData = data;
    console.log("outgoingPaymentData", outgoingPaymentData);
    // Populate basic fields with updated IDs
    document.getElementById("cashAdvanceNo").value = data.cashAdvanceNo || '';
    
    // Auto-populate employee fields with data from API (but don't override auto-filled logged-in user data)
    if (!document.getElementById("employeeId").value) {
        // Handle employee NIK - find user by ID and use kansaiEmployeeId
        if (data.employeeId && window.employees) {
            const employee = window.employees.find(emp => emp.id === data.employeeId);
            if (employee && employee.kansaiEmployeeId) {
                document.getElementById("employeeId").value = employee.kansaiEmployeeId;
            } else {
                // Fallback to original value if not found
                document.getElementById("employeeId").value = data.employeeId;
            }
        }
    }
    
    if (!document.getElementById("employeeName").value) {
        document.getElementById("employeeName").value = data.employeeName || '';
    }
    
    // Handle requester name with search functionality  
    if (data.requesterName) {
        document.getElementById("requesterSearch").value = data.requesterName;
        // Store the requester ID if available - since options are pre-populated, we can directly set the value
        if (data.requesterId) {
            const requesterIdElement = document.getElementById('RequesterId');
            // Always store in global variable as backup
            window.cashAdvanceRequesterId = data.requesterId;
            
            if (requesterIdElement) {
                requesterIdElement.value = data.requesterId;
                console.log("Requester ID:", data.requesterId);
                console.log("Requester ID2:", requesterIdElement.value);
            } else {
                console.warn("RequesterId element not found in DOM, but stored in global variable");
            }
        } else {
            console.error("No requesterId found in API data - this is a business logic error");
        }
    }
    
    document.getElementById("purpose").value = data.purpose || '';
    
    // Handle PayTo business partner
    if (data.payTo && data.payToBusinessPartnerName) {
        // Set the search input and hidden field for PayTo
        const paidToSearchInput = document.getElementById('paidToSearch');
        const paidToHiddenInput = document.getElementById('paidTo');
        
        if (paidToSearchInput && paidToHiddenInput) {
            paidToSearchInput.value = data.payToBusinessPartnerName;
            paidToHiddenInput.value = data.payTo;
        }
    }
    
    // Handle department with search functionality
    if (data.departmentId || data.departmentName) {
        const departmentSearchInput = document.getElementById('departmentSearch');
        const departmentHiddenInput = document.getElementById('departmentId');
        
        if (departmentSearchInput && departmentHiddenInput) {
            if (data.departmentName) {
                departmentSearchInput.value = data.departmentName;
            }
            
            if (data.departmentId && data.departmentId !== "00000000-0000-0000-0000-000000000000") {
                departmentHiddenInput.value = data.departmentId;
            }
        }
    }
    
    // Handle submission date - convert from ISO to YYYY-MM-DD format for date input
    if (data.submissionDate) {
        // Extract date part directly to avoid timezone issues
        const formattedDate = data.submissionDate.split('T')[0];
        document.getElementById("submissionDate").value = formattedDate;
    }
    
    // Handle status with search functionality
    if (data.status) {
        const statusSearchInput = document.getElementById('statusSearch');
        const statusHiddenInput = document.getElementById('status');
        
        if (statusSearchInput && statusHiddenInput) {
            statusSearchInput.value = data.status;
            statusHiddenInput.value = data.status;
        }
    }
    
    // Handle transaction type with search functionality
    if (data.transactionType) {
        const transactionTypeSearchInput = document.getElementById('transactionTypeSearch');
        const transactionTypeHiddenInput = document.getElementById('transactionType');
        
        if (transactionTypeSearchInput && transactionTypeHiddenInput) {
            transactionTypeSearchInput.value = data.transactionType;
            transactionTypeHiddenInput.value = data.transactionType;
            
            // Call toggleClosedByVisibility after setting transaction type
            toggleClosedByVisibility();
        }
    }
    
    // Populate table with cash advance details
    populateTable(data.cashAdvanceDetails || []);
    
    // Populate approval section using the direct fields from API response
    const approvalData = {
        preparedById: data.preparedById,
        checkedById: data.checkedById,
        approvedById: data.approvedById,
        acknowledgedById: data.acknowledgedById,
        receivedById: data.receivedById,
        closedById: data.closedById
    };
    populateApprovals(approvalData);
    
    // Handle remarks if exists
    const remarksTextarea = document.querySelector('textarea');
    if (remarksTextarea) {
        remarksTextarea.value = data.remarks || '';
    }
    
    // Handle rejection remarks if status is Rejected
    if (data.status === 'Rejected' && data.rejectedRemarks) {
        // Show the rejection remarks section
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        const rejectionTextarea = document.getElementById('rejectionRemarks');
        
        if (rejectionSection && rejectionTextarea) {
            rejectionSection.style.display = 'block';
            rejectionTextarea.value = data.rejectedRemarks;
        }
    } else {
        // Hide the rejection remarks section if status is not Rejected
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        if (rejectionSection) {
            rejectionSection.style.display = 'none';
        }
    }

    // Handle attachments if they exist
    if (data.attachments && data.attachments.length > 0) {
        console.log('Attachments found:', data.attachments);
        // You can implement attachment display logic here if needed
    }

    // Store and display attachments
    if (data.attachments) {
        existingAttachments = data.attachments;
        attachmentsToKeep = data.attachments.map(att => att.id); // Initially keep all existing attachments
        displayAttachments(data.attachments);
    }

    // Check if status is not Draft and make fields read-only
    if (data.status && data.status.toLowerCase() !== 'draft') {
        makeAllFieldsReadOnlyForNonDraft();
    }

    // Fetch dropdown options with approval data
    fetchDropdownOptions(approvalData);
}

function populateTable(cashAdvanceDetails) {
    const tableBody = document.getElementById("tableBody");
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add rows for each detail
    cashAdvanceDetails.forEach((detail, index) => {
        const newRow = document.createElement("tr");
        const rowId = index;
        
        newRow.innerHTML = `
            <td class="p-2 border">
                <input type="text" id="description_${rowId}" maxlength="255" class="w-full" value="${detail.description || ''}" />
            </td>
            <td class="p-2 border">
                <input type="text" id="total_${rowId}" class="w-full currency-input" value="${detail.amount || 0}" />
            </td>
            <td class="p-2 border">
                <input type="text" id="wTax_${rowId}" class="w-full currency-input" value="${detail.wTaxAmount || 0}" />
            </td>
            <td class="p-2 border">
                <input type="text" id="totalPayment_${rowId}" class="w-full currency-input" value="${(detail.amount - (detail.wTaxAmount || 0))}" readonly />
            </td>
            <td class="p-2 border text-center">
                <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                    🗑
                </button>
            </td>
        `;
        
        tableBody.appendChild(newRow);
        
        // Setup validations for this row
        setupTextInput(`description_${rowId}`);
        setupCurrencyInput(`total_${rowId}`);
        setupCurrencyInput(`wTax_${rowId}`);
        setupCurrencyInput(`totalPayment_${rowId}`);
        
        // Add event listeners for calculating total payment in this row
        document.getElementById(`total_${rowId}`).addEventListener('input', function() {
            calculateRowTotalPayment(rowId);
        });
        document.getElementById(`wTax_${rowId}`).addEventListener('input', function() {
            calculateRowTotalPayment(rowId);
        });
        
        // Calculate the row's total payment
        calculateRowTotalPayment(rowId);
        
        // Increment row counter for next row
        if (rowId >= rowCounter) {
            rowCounter = rowId + 1;
        }
    });
    
    // If no details exist, add one empty row
    if (cashAdvanceDetails.length === 0) {
        addRow();
    }
    
    // Update total amount due
    updateTotalAmountDue();
}

// Function to filter users for approval fields (same as addCash)
function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    
    // Map field IDs to their corresponding role names for display
    const fieldMapping = {
        'Approval.PreparedById': 'Proposed',
        'Approval.CheckedById': 'Checked', 
        'Approval.ApprovedById': 'Approved',
        'Approval.AcknowledgedById': 'Acknowledged',
        'Approval.ReceivedById': 'Received',
        'Approval.ClosedById': 'Closed'
    };
    
    // Kosongkan dropdown
    dropdown.innerHTML = '';
    
    // Filter pengguna berdasarkan teks pencarian
    const filteredUsers = window.requesters ? 
        window.requesters.filter(user => user.fullName.toLowerCase().includes(searchText)) : 
        [];
    
    // Tampilkan hasil pencarian
    filteredUsers.forEach(user => {
        const option = document.createElement('div');
        option.className = 'dropdown-item';
        option.innerText = user.fullName;
        option.onclick = function() {
            searchInput.value = user.fullName;
            document.getElementById(fieldId).value = user.id;
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(option);
    });
    
    // Tampilkan pesan jika tidak ada hasil
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'Tidak ada pengguna yang cocok';
        dropdown.appendChild(noResults);
    }
    
    // Tampilkan dropdown
    dropdown.classList.remove('hidden');
}

// Update the populateApprovals function to work with new search structure
function populateApprovals(approval) {
    // Check if requesters data is available, if not, retry after a short delay
    if (!window.requesters) {
        console.log('Requesters data not yet available, retrying in 100ms...');
        setTimeout(() => populateApprovals(approval), 100);
        return;
    }
    
    // Proposed by - find user and set in search input if there's a preparedById
    const preparedSelect = document.getElementById("Approval.PreparedById");
    if (preparedSelect && approval.preparedById) {
        preparedSelect.value = approval.preparedById;
        const preparedUser = window.requesters.find(user => user.id === approval.preparedById);
        if (preparedUser) {
            const preparedSearchInput = document.getElementById('Approval.PreparedByIdSearch');
            if (preparedSearchInput) {
                preparedSearchInput.value = preparedUser.fullName;
            }
        }
    }
    
    // Checked by - find user and set in search input if there's a checkedById
    const checkedSelect = document.getElementById("Approval.CheckedById");
    if (checkedSelect && approval.checkedById) {
        checkedSelect.value = approval.checkedById;
        const checkedUser = window.requesters.find(user => user.id === approval.checkedById);
        if (checkedUser) {
            const checkedSearchInput = document.getElementById('Approval.CheckedByIdSearch');
            if (checkedSearchInput) {
                checkedSearchInput.value = checkedUser.fullName;
            }
        }
    }
    
    // Approved by - find user and set in search input if there's an approvedById
    const approvedSelect = document.getElementById("Approval.ApprovedById");
    if (approvedSelect && approval.approvedById) {
        approvedSelect.value = approval.approvedById;
        const approvedUser = window.requesters.find(user => user.id === approval.approvedById);
        if (approvedUser) {
            const approvedSearchInput = document.getElementById('Approval.ApprovedByIdSearch');
            if (approvedSearchInput) {
                approvedSearchInput.value = approvedUser.fullName;
            }
        }
    }
    
    // Acknowledged by - find user and set in search input if there's an acknowledgedById
    const acknowledgedSelect = document.getElementById("Approval.AcknowledgedById");
    if (acknowledgedSelect && approval.acknowledgedById) {
        acknowledgedSelect.value = approval.acknowledgedById;
        const acknowledgedUser = window.requesters.find(user => user.id === approval.acknowledgedById);
        if (acknowledgedUser) {
            const acknowledgedSearchInput = document.getElementById('Approval.AcknowledgedByIdSearch');
            if (acknowledgedSearchInput) {
                acknowledgedSearchInput.value = acknowledgedUser.fullName;
            }
        }
    }

    // Received by - find user and set in search input if there's a receivedById
    const receivedSelect = document.getElementById("Approval.ReceivedById");
    if (receivedSelect && approval.receivedById) {
        receivedSelect.value = approval.receivedById;
        const receivedUser = window.requesters.find(user => user.id === approval.receivedById);
        if (receivedUser) {
            const receivedSearchInput = document.getElementById('Approval.ReceivedByIdSearch');
            if (receivedSearchInput) {
                receivedSearchInput.value = receivedUser.fullName;
            }
        }
    }

    // Closed by - find user and set in search input if there's a closedById (for personal loan)
    const closedSelect = document.getElementById("Approval.ClosedById");
    if (closedSelect && approval.closedById) {
        closedSelect.value = approval.closedById;
        const closedUser = window.requesters.find(user => user.id === approval.closedById);
        if (closedUser) {
            const closedSearchInput = document.getElementById('Approval.ClosedByIdSearch');
            if (closedSearchInput) {
                closedSearchInput.value = closedUser.fullName;
            }
        }
    }
}

// Load data when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize input validations
    initializeInputValidations();
    
    // Fetch dropdown options first
    fetchDropdownOptions();
    
    // Then load outgoing payment data
    loadOutgoingPaymentData();
    
    // Setup event listener untuk hide dropdown saat klik di luar
    document.addEventListener('click', function(event) {
        const dropdowns = [
            'Approval.PreparedByIdDropdown', 
            'Approval.CheckedByIdDropdown', 
            'Approval.ApprovedByIdDropdown', 
            'Approval.AcknowledgedByIdDropdown',
            'Approval.ReceivedByIdDropdown',
            'Approval.ClosedByIdDropdown'
        ];
        
        const searchInputs = [
            'Approval.PreparedByIdSearch', 
            'Approval.CheckedByIdSearch', 
            'Approval.ApprovedByIdSearch', 
            'Approval.AcknowledgedByIdSearch',
            'Approval.ReceivedByIdSearch',
            'Approval.ClosedByIdSearch'
        ];
        
        dropdowns.forEach((dropdownId, index) => {
            const dropdown = document.getElementById(dropdownId);
            const input = document.getElementById(searchInputs[index]);
            
            if (dropdown && input) {
                if (!input.contains(event.target) && !dropdown.contains(event.target)) {
                    dropdown.classList.add('hidden');
                }
            }
        });
    });
    
    // Trigger initial dropdown on focus for each search field
    const searchFields = [
        'Approval.PreparedByIdSearch',
        'Approval.CheckedByIdSearch',
        'Approval.ApprovedByIdSearch',
        'Approval.AcknowledgedByIdSearch',
        'Approval.ReceivedByIdSearch',
        'Approval.ClosedByIdSearch'
    ];
    
    searchFields.forEach(fieldId => {
        const searchInput = document.getElementById(fieldId);
        if (searchInput) {
            searchInput.addEventListener('focus', function() {
                const actualFieldId = fieldId.replace('Search', '');
                filterUsers(actualFieldId);
            });
        }
    });
});

function updateCash(isSubmit = false) {
    const actionText = isSubmit ? 'Submit' : 'Update';
    const actionConfirmText = isSubmit ? 'submit' : 'update';
    
    Swal.fire({
        title: `${actionText} Cash Advance`,
        text: `Are you sure you want to ${actionConfirmText} this Cash Advance?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: `Yes, ${actionConfirmText} it!`,
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Get the ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('op-id');
            
            if (!id) {
                Swal.fire('Error!', 'ID outgoing payment tidak ditemukan.', 'error');
                return;
            }

            // Show loading
            Swal.fire({
                title: `${actionText.slice(0, -1)}ing...`,
                text: `Please wait while we ${actionConfirmText} the Cash Advance.`,
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Create FormData object
            const formData = new FormData();
        
            // Get RequesterId value with fallback
            const requesterIdElement = document.getElementById('RequesterId');
            let requesterId = '';
            
            console.log('RequesterId element found:', requesterIdElement);
            console.log('RequesterId element value:', requesterIdElement ? requesterIdElement.value : 'element not found');
            console.log('Global fallback value:', window.cashAdvanceRequesterId);
            
            if (requesterIdElement && requesterIdElement.value) {
                requesterId = requesterIdElement.value;
                console.log('Using RequesterId from form element:', requesterId);
            } else if (window.cashAdvanceRequesterId) {
                // Use the global fallback variable
                requesterId = window.cashAdvanceRequesterId;
                console.warn('Using global fallback RequesterId:', requesterId);
            } else {
                // No valid RequesterId found - this is a business logic error
                console.error('No valid RequesterId found - cannot proceed with update');
                Swal.fire('Error!', 'RequesterId tidak ditemukan. Data cash advance mungkin rusak.', 'error');
                return;
            }
        
            // Add all form fields to FormData
            formData.append('CashAdvanceNo', document.getElementById("cashAdvanceNo").value);
            formData.append('EmployeeNIK', document.getElementById("employeeId").value);
            formData.append('RequesterId', requesterId);
            formData.append('Purpose', document.getElementById("purpose").value);
            formData.append('DepartmentId', document.getElementById("departmentId").value);
            formData.append('SubmissionDate', document.getElementById("submissionDate").value);
            formData.append('TransactionType', document.getElementById("transactionType").value);
            
            // Handle remarks if exists
            const remarksTextarea = document.querySelector('textarea');
            if (remarksTextarea) {
                formData.append('Remarks', remarksTextarea.value);
            }
            
            // Approval fields
            formData.append('PreparedById', document.getElementById("Approval.PreparedById")?.value || '');
            formData.append('CheckedById', document.getElementById("Approval.CheckedById")?.value || '');
            formData.append('ApprovedById', document.getElementById("Approval.ApprovedById")?.value || '');
            formData.append('AcknowledgedById', document.getElementById("Approval.AcknowledgedById")?.value || '');
            formData.append('ReceivedById', document.getElementById("Approval.ReceivedById")?.value || '');
            formData.append('ClosedById', document.getElementById("Approval.ClosedById")?.value || '');
            
            // Add CashAdvanceDetails - collect all rows from the table
            const tableRows = document.querySelectorAll('#tableBody tr');
            tableRows.forEach((row, index) => {
                const description = row.querySelector('input[type="text"]')?.value;
                const amount = row.querySelector('input[type="number"]')?.value;
                
                if (description && amount) {
                    formData.append(`CashAdvanceDetails[${index}][Description]`, description);
                    formData.append(`CashAdvanceDetails[${index}][Amount]`, amount);
                }
            });

            // Add Business Partner ID (Paid To)
            const paidToId = document.getElementById("paidTo").value;
            if (paidToId) {
                formData.append('PayTo', paidToId);
            }

            // Handle attachments according to backend logic
            // Add existing attachments to keep (with their IDs)
            attachmentsToKeep.forEach((attachmentId, index) => {
                const existingAttachment = existingAttachments.find(att => att.id === attachmentId);
                if (existingAttachment) {
                    formData.append(`Attachments[${index}].Id`, attachmentId);
                    formData.append(`Attachments[${index}].FileName`, existingAttachment.fileName || '');
                }
            });
            
            // Add new file uploads (with empty GUIDs)
            uploadedFiles.forEach((file, index) => {
                const attachmentIndex = attachmentsToKeep.length + index;
                formData.append(`Attachments[${attachmentIndex}].Id`, '00000000-0000-0000-0000-000000000000'); // Empty GUID for new files
                formData.append(`Attachments[${attachmentIndex}].File`, file);
            });
            
            console.log('Attachments to keep:', attachmentsToKeep);
            console.log('New files to upload:', uploadedFiles);
            
            // Set IsSubmit based on the parameter
            formData.append('IsSubmit', isSubmit);
            
            // Log the data being sent for debugging
            console.log('FormData being sent:');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }
            
            // Call the PUT API
            fetch(`${BASE_URL}/api/outgoing-payment/${id}`, {
                method: 'PUT',
                body: formData
            })
            .then(response => {
                if (response.status === 200 || response.status === 204) {
                    // Success
                    Swal.fire({
                        title: 'Success!',
                        text: `Cash Advance has been ${isSubmit ? 'submitted' : 'updated'} successfully.`,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        // Reload the outgoing payment data to show updated information
                        loadOutgoingPaymentData();
                        
                        // Clear uploaded files since they're now saved
                        uploadedFiles = [];
                        
                        // Update file input
                        const fileInput = document.querySelector('input[type="file"]');
                        if (fileInput) {
                            fileInput.value = '';
                        }
                    });
                } else {
                    // Error handling
                    return response.json().then(data => {
                        console.log("Error:", data);
                        throw new Error(data.message || `Failed to ${actionConfirmText}: ${response.status}`);
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error!',
                    text: `Failed to ${actionConfirmText} Cash Advance: ${error.message}`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            });
        }
    });
}

// Function to convert amount to words
function numberToWords(num) {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    if (num === 0) return 'zero';
    
    function convertLessThanOneThousand(num) {
        if (num < 20) {
            return ones[num];
        }
        
        const ten = Math.floor(num / 10);
        const unit = num % 10;
        
        return tens[ten] + (unit !== 0 ? '-' + ones[unit] : '');
    }
    
    function convert(num) {
        if (num < 1000) {
            return convertLessThanOneThousand(num);
        }
        
        const billions = Math.floor(num / 1000000000);
        const millions = Math.floor((num % 1000000000) / 1000000);
        const thousands = Math.floor((num % 1000000) / 1000);
        const remainder = num % 1000;
        
        let result = '';
        
        if (billions) {
            result += convertLessThanOneThousand(billions) + ' billion ';
        }
        
        if (millions) {
            result += convertLessThanOneThousand(millions) + ' million ';
        }
        
        if (thousands) {
            result += convertLessThanOneThousand(thousands) + ' thousand ';
        }
        
        if (remainder) {
            result += convertLessThanOneThousand(remainder);
        }
        
        return result.trim();
    }
    
    // Split number into whole and decimal parts
    const parts = Number(num).toFixed(2).split('.');
    const wholePart = parseInt(parts[0]);
    const decimalPart = parseInt(parts[1]);
    
    let result = convert(wholePart);
    
    if (decimalPart) {
        result += ' point ' + convert(decimalPart);
    }
    
    return result + ' rupiah';
}

// Function to print the cash advance voucher
function printCashAdvanceVoucher() {
    // Get data from the form
    const cashAdvanceNo = document.getElementById("cashAdvanceNo").value;
    const departmentId = document.getElementById("departmentId").value;
    const paidTo = document.getElementById("paidTo").value;
    const purpose = document.getElementById("purpose").value;
    const submissionDate = document.getElementById("submissionDate").value;
    
    // Get approval data
    const proposedName = document.getElementById("preparedSelect").value;
    const checkedName = document.getElementById("checkedSelect").value;
    const approvedName = document.getElementById("approvedSelect").value;
    const acknowledgedName = document.getElementById("acknowledgedSelect").value;
    
    // Get checkbox states
    const proposedChecked = document.getElementById("preparedCheckbox").checked;
    const checkedChecked = document.getElementById("checkedCheckbox").checked;
    const approvedChecked = document.getElementById("approvedCheckbox").checked;
    const acknowledgedChecked = document.getElementById("acknowledgedCheckbox").checked;
    
    // Get table data
    const tableBody = document.getElementById("tableBody");
    const rows = tableBody.querySelectorAll("tr");
    const tableData = [];
    let totalAmount = 0;
    
    rows.forEach(row => {
        const descriptionInput = row.querySelector("td:first-child input");
        const amountInput = row.querySelector("td:nth-child(2) input");
        
        if (descriptionInput && amountInput && descriptionInput.value && amountInput.value) {
            const amount = parseFloat(amountInput.value);
            tableData.push({
                description: descriptionInput.value,
                amount: amount
            });
            totalAmount += amount;
        }
    });
    
    // Convert total amount to words
    const amountInWords = numberToWords(totalAmount);
    
    // Create the printable HTML
    const printContent = `
    <div id="print-container" style="width: 800px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: left; margin-bottom: 20px;">
            <h3 style="margin: 0;">PT KANSAI PAINT INDONESIA</h3>
            <p style="margin: 0;">Blok DD-7 & DD-6 Kawasan Industri MM2100 Danaludah</p>
            <p style="margin: 0;">Cikarang Barat Kab. Bekasi Jawa Barat 17530</p>
        </div>
        
        <div style="text-align: right; margin-bottom: 20px;">
            <p style="margin: 0;"><strong>Batch No:</strong> _____________</p>
            <p style="margin: 0;"><strong>Voucher No:</strong> ${cashAdvanceNo}</p>
            <p style="margin: 0;"><strong>Submission date:</strong> ${submissionDate}</p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <h2 style="text-decoration: underline;">CASH ADVANCE VOUCHER</h2>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Production' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Production</span>
                        </div>
                    </td>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Marketing' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Marketing</span>
                        </div>
                    </td>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Technical' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Technical</span>
                        </div>
                    </td>
                    <td style="width: 25%;">
                        <div style="border: 1px solid #000; padding: 5px; text-align: center;">
                            <input type="checkbox" ${departmentId === 'Admninistration' ? 'checked' : ''} style="transform: scale(1.5);">
                            <span>Administration</span>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Cash advance is paid to</td>
                    <td style="width: 80%;">: ${paidTo}</td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0; display: flex; justify-content: space-between;">
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Proposed by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${proposedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
            
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Advance is checked by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${checkedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
        </div>
        
        <div style="margin: 20px 0; display: flex; justify-content: space-between;">
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Advance is approved by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${approvedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
            
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Cash is received by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ${acknowledgedName}</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Payment through [√]:</td>
                    <td style="width: 80%;">
                        <input type="checkbox" style="transform: scale(1.5); margin-right: 5px;"> Cash
                        <input type="checkbox" style="transform: scale(1.5); margin-right: 5px; margin-left: 20px;"> Bank remittance
                        <span style="margin-left: 20px;">[Bank Ref: _______________ ]</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Estimated cost</td>
                    <td style="width: 80%;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 30%; border: 1px solid #000; padding: 5px;">Rp ${totalAmount.toLocaleString()}</td>
                                <td style="width: 70%;">In words: ${amountInWords}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 20%;">Purpose of Advance</td>
                    <td style="width: 80%;">: ${purpose}</td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0;">
            <p><strong>Settlement of advance:</strong></p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #000; padding: 8px; width: 60%;">Description</th>
                        <th style="border: 1px solid #000; padding: 8px; width: 20%;">Debit</th>
                        <th style="border: 1px solid #000; padding: 8px; width: 20%;">Credit</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableData.map(item => `
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px;">${item.description}</td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right;">${item.amount.toLocaleString()}</td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                    </tr>
                    `).join('')}
                    ${Array(8 - tableData.length).fill().map(() => `
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; height: 30px;"></td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                    </tr>
                    `).join('')}
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; text-align: center;"><strong>Total</strong></td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: right;"><strong>${totalAmount.toLocaleString()}</strong></td>
                        <td style="border: 1px solid #000; padding: 8px;"></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div style="margin: 40px 0 20px; text-align: right;">
            <p><strong>Return Date:</strong> _____________</p>
        </div>
        
        <div style="margin: 20px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 40%;">
                        <p>Total cash must be returned to the<br>Company (paid to the Employee)</p>
                    </td>
                    <td style="width: 60%;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 30%; border: 1px solid #000; padding: 5px;">Rp ${totalAmount.toLocaleString()}</td>
                                <td style="width: 70%;">In words: ${amountInWords}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="margin: 20px 0; display: flex; justify-content: flex-end;">
            <div style="width: 45%; border: 1px solid #000; padding: 10px; margin-right: 10px;">
                <p style="text-align: center;"><strong>Cash is received by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ____________</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
            
            <div style="width: 45%; border: 1px solid #000; padding: 10px;">
                <p style="text-align: center;"><strong>Settlement is approved by:</strong></p>
                <div style="height: 80px;"></div>
                <p><strong>Name:</strong> ____________</p>
                <p><strong>Date:</strong> ____________</p>
            </div>
        </div>
        
        <div style="margin: 20px 0; font-size: 10px; line-height: 1.2;">
            <p>The payment through cash is valid, at the time you sign on the column of "Cash is received by".</p>
            <p>The Cash Advance Must be Settled within 1 Month, Otherwise The Company has full authority to deduct from the Salary.</p>
        </div>
    </div>
    `;
    
    // Create a temporary container to hold the printable content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = printContent;
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    
    // Generate the PDF
    const element = document.getElementById('print-container');
    const opt = {
        margin: 10,
        filename: `Cash_Advance_${cashAdvanceNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate PDF
    html2pdf().set(opt).from(element).save().then(() => {
        // Remove the temporary container after PDF is generated
        document.body.removeChild(tempDiv);
    });
}

// Function to make all fields read-only when status is not Draft
function makeAllFieldsReadOnlyForNonDraft() {
    console.log('Status is not Draft - making all fields read-only');
    
    // Make all input fields read-only
    const inputFields = document.querySelectorAll('input[type="text"], input[type="date"], input[type="number"], input[type="file"], textarea');
    inputFields.forEach(field => {
        field.readOnly = true;
        field.disabled = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
    });
    
    // Disable all select fields
    const selectFields = document.querySelectorAll('select');
    selectFields.forEach(field => {
        field.disabled = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
    });
    
    // Hide all dropdown divs
    const allDropdowns = [
        'Approval.PreparedByIdDropdown',
        'Approval.CheckedByIdDropdown', 
        'Approval.ApprovedByIdDropdown',
        'Approval.AcknowledgedByIdDropdown',
        'Approval.ReceivedByIdDropdown',
        'Approval.ClosedByIdDropdown',
        'paidToDropdown',
        'departmentDropdown',
        'statusDropdown',
        'transactionTypeDropdown'
    ];
    
    allDropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    });
    
    // Hide action buttons (Update, Submit, Delete)
    const actionButtons = document.querySelectorAll('button[onclick*="updateCash"], button[onclick*="confirmDelete"]');
    actionButtons.forEach(button => {
        button.style.display = 'none';
    });
    
    // Hide add row button
    const addRowButton = document.querySelector('button[onclick="addRow()"]');
    if (addRowButton) {
        addRowButton.style.display = 'none';
    }
    
    // Hide all delete row buttons in table
    const deleteButtons = document.querySelectorAll('button[onclick="deleteRow(this)"]');
    deleteButtons.forEach(button => {
        button.style.display = 'none';
    });
    
    // Disable file upload input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.disabled = true;
        fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
    
    // Update attachments display to hide remove buttons
    updateAttachmentsDisplay();
}

// Function to display attachments (initial load)
function displayAttachments(attachments) {
    // Just call the update function which handles both existing and new files
    updateAttachmentsDisplay();
}

function fetchBusinessPartners() {
    fetch(`${BASE_URL}/api/business-partners`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Business Partners data:", data);
            setupBusinessPartnerSearch(data.data);
        })
        .catch(error => {
            console.error('Error fetching business partners:', error);
        });
}

function setupBusinessPartnerSearch(businessPartners) {
    // Store business partners globally for search functionality
    window.businessPartners = businessPartners.filter(bp => bp.active).map(bp => ({
        id: bp.id,
        code: bp.code,
        name: bp.name
    }));

    // Setup search functionality for paid to
    const paidToSearchInput = document.getElementById('paidToSearch');
    const paidToDropdown = document.getElementById('paidToDropdown');
    const paidToHiddenInput = document.getElementById('paidTo');
    
    if (paidToSearchInput && paidToDropdown && paidToHiddenInput) {
        // Function to filter business partners
        window.filterBusinessPartners = function() {
            const searchText = paidToSearchInput.value.toLowerCase();
            populateBusinessPartnerDropdown(searchText);
            paidToDropdown.classList.remove('hidden');
        };

        // Function to populate dropdown with filtered business partners
        function populateBusinessPartnerDropdown(filter = '') {
            paidToDropdown.innerHTML = '';
            
            const filteredPartners = window.businessPartners.filter(bp => 
                bp.code.toLowerCase().includes(filter) || 
                bp.name.toLowerCase().includes(filter)
            );
            
            filteredPartners.forEach(partner => {
                const option = document.createElement('div');
                option.className = 'p-2 cursor-pointer hover:bg-gray-100';
                option.innerHTML = `<span class="font-medium">${partner.code}</span> - ${partner.name}`;
                option.onclick = function() {
                    paidToSearchInput.value = `${partner.code} - ${partner.name}`;
                    paidToHiddenInput.value = partner.id;
                    paidToDropdown.classList.add('hidden');
                };
                paidToDropdown.appendChild(option);
            });
            
            if (filteredPartners.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No matching business partners';
                paidToDropdown.appendChild(noResults);
            }
        }

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!paidToSearchInput.contains(event.target) && !paidToDropdown.contains(event.target)) {
                paidToDropdown.classList.add('hidden');
            }
        });

        // Initial population
        populateBusinessPartnerDropdown();
    }
}

function toggleClosedByVisibility() {
    const transactionType = document.getElementById('transactionType').value;
    const closedByContainer = document.getElementById('closed').parentElement;
    
    if (transactionType === 'Personal Loan') {
        closedByContainer.style.display = 'block';
    } else {
        closedByContainer.style.display = 'none';
    }
}

// Function to update the total amount due (sum of all row totals)
function updateTotalAmountDue() {
    const totalAmountDueInput = document.getElementById('totalAmountDue');
    const rows = document.querySelectorAll('#tableBody tr');
    
    if (totalAmountDueInput && rows.length > 0) {
        let sum = 0;
        
        // Sum up all total payment values from each row
        rows.forEach(row => {
            const totalPaymentInput = row.querySelector('input[id^="totalPayment"]');
            if (totalPaymentInput) {
                // Parse the currency value
                const paymentValue = parseCurrency(totalPaymentInput.value) || 0;
                sum += paymentValue;
            }
        });
        
        // Format and set the total amount due
        totalAmountDueInput.numericValue = sum;
        totalAmountDueInput.value = formatCurrency(sum);
    }
}

// Function to setup Department search dropdown
function setupDepartmentSearch() {
    const departmentSearchInput = document.getElementById('departmentSearch');
    const departmentIdInput = document.getElementById('departmentId');
    const departmentDropdown = document.getElementById('departmentDropdown');
    
    if (departmentSearchInput && departmentIdInput && departmentDropdown) {
        // Sample departments data - replace with actual API call in production
        const departments = [
            { id: 'DEPT001', name: 'Finance' },
            { id: 'DEPT002', name: 'Human Resources' },
            { id: 'DEPT003', name: 'Information Technology' },
            { id: 'DEPT004', name: 'Marketing' },
            { id: 'DEPT005', name: 'Operations' },
            { id: 'DEPT006', name: 'Research and Development' },
            { id: 'DEPT007', name: 'Sales' }
        ];
        
        // Function to filter departments based on search input
        window.filterDepartments = function() {
            const searchTerm = departmentSearchInput.value.toLowerCase();
            departmentDropdown.innerHTML = '';
            
            if (searchTerm.length === 0) {
                departmentDropdown.classList.add('hidden');
                return;
            }
            
            const filteredDepartments = departments.filter(dept => 
                dept.name.toLowerCase().includes(searchTerm) || 
                dept.id.toLowerCase().includes(searchTerm)
            );
            
            if (filteredDepartments.length > 0) {
                departmentDropdown.classList.remove('hidden');
                
                filteredDepartments.forEach(dept => {
                    const item = document.createElement('div');
                    item.className = 'dropdown-item';
                    item.textContent = `${dept.name} (${dept.id})`;
                    item.addEventListener('click', function() {
                        departmentSearchInput.value = dept.name;
                        departmentIdInput.value = dept.id;
                        departmentDropdown.classList.add('hidden');
                    });
                    departmentDropdown.appendChild(item);
                });
            } else {
                departmentDropdown.classList.add('hidden');
            }
        };
        
        // Add event listeners
        departmentSearchInput.addEventListener('focus', window.filterDepartments);
        departmentSearchInput.addEventListener('input', window.filterDepartments);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!departmentSearchInput.contains(e.target) && !departmentDropdown.contains(e.target)) {
                departmentDropdown.classList.add('hidden');
            }
        });
    }
}

// Function to setup Status search dropdown
function setupStatusSearch() {
    const statusSearchInput = document.getElementById('statusSearch');
    const statusInput = document.getElementById('status');
    const statusDropdown = document.getElementById('statusDropdown');
    
    if (statusSearchInput && statusInput && statusDropdown) {
        // Sample statuses - replace with actual data in production
        const statuses = [
            { id: 'DRAFT', name: 'Draft' },
            { id: 'PENDING', name: 'Pending' },
            { id: 'APPROVED', name: 'Approved' },
            { id: 'REJECTED', name: 'Rejected' },
            { id: 'COMPLETED', name: 'Completed' }
        ];
        
        // Function to filter statuses based on search input
        window.filterStatuses = function() {
            const searchTerm = statusSearchInput.value.toLowerCase();
            statusDropdown.innerHTML = '';
            
            if (searchTerm.length === 0) {
                statusDropdown.classList.add('hidden');
                return;
            }
            
            const filteredStatuses = statuses.filter(status => 
                status.name.toLowerCase().includes(searchTerm) || 
                status.id.toLowerCase().includes(searchTerm)
            );
            
            if (filteredStatuses.length > 0) {
                statusDropdown.classList.remove('hidden');
                
                filteredStatuses.forEach(status => {
                    const item = document.createElement('div');
                    item.className = 'dropdown-item';
                    item.textContent = status.name;
                    item.addEventListener('click', function() {
                        statusSearchInput.value = status.name;
                        statusInput.value = status.id;
                        statusDropdown.classList.add('hidden');
                        
                        // Show/hide rejection remarks section based on status
                        const rejectionSection = document.getElementById('rejectionRemarksSection');
                        if (rejectionSection) {
                            rejectionSection.style.display = status.id === 'REJECTED' ? 'block' : 'none';
                        }
                    });
                    statusDropdown.appendChild(item);
                });
            } else {
                statusDropdown.classList.add('hidden');
            }
        };
        
        // Add event listeners
        statusSearchInput.addEventListener('focus', window.filterStatuses);
        statusSearchInput.addEventListener('input', window.filterStatuses);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!statusSearchInput.contains(e.target) && !statusDropdown.contains(e.target)) {
                statusDropdown.classList.add('hidden');
            }
        });
        
        // Set initial status to Draft
        statusSearchInput.value = 'Draft';
        statusInput.value = 'DRAFT';
    }
}

// Function to setup Transaction Type search dropdown
function setupTransactionTypeSearch() {
    const transactionTypeSearchInput = document.getElementById('transactionTypeSearch');
    const transactionTypeInput = document.getElementById('transactionType');
    const transactionTypeDropdown = document.getElementById('transactionTypeDropdown');
    
    if (transactionTypeSearchInput && transactionTypeInput && transactionTypeDropdown) {
        // Sample transaction types - replace with actual data in production
        const transactionTypes = [
            { id: 'VENDOR', name: 'Vendor Payment' },
            { id: 'EMPLOYEE', name: 'Employee Payment' },
            { id: 'TAX', name: 'Tax Payment' },
            { id: 'UTILITY', name: 'Utility Payment' },
            { id: 'LOAN', name: 'Personal Loan' },
            { id: 'OTHER', name: 'Other Payment' }
        ];
        
        // Function to filter transaction types based on search input
        window.filterTransactionTypes = function() {
            const searchTerm = transactionTypeSearchInput.value.toLowerCase();
            transactionTypeDropdown.innerHTML = '';
            
            if (searchTerm.length === 0) {
                transactionTypeDropdown.classList.add('hidden');
                return;
            }
            
            const filteredTypes = transactionTypes.filter(type => 
                type.name.toLowerCase().includes(searchTerm) || 
                type.id.toLowerCase().includes(searchTerm)
            );
            
            if (filteredTypes.length > 0) {
                transactionTypeDropdown.classList.remove('hidden');
                
                filteredTypes.forEach(type => {
                    const item = document.createElement('div');
                    item.className = 'dropdown-item';
                    item.textContent = type.name;
                    item.addEventListener('click', function() {
                        transactionTypeSearchInput.value = type.name;
                        transactionTypeInput.value = type.id;
                        transactionTypeDropdown.classList.add('hidden');
                        
                        // Toggle "Closed by" visibility based on transaction type
                        toggleClosedByVisibility();
                    });
                    transactionTypeDropdown.appendChild(item);
                });
            } else {
                transactionTypeDropdown.classList.add('hidden');
            }
        };
        
        // Add event listeners
        transactionTypeSearchInput.addEventListener('focus', window.filterTransactionTypes);
        transactionTypeSearchInput.addEventListener('input', window.filterTransactionTypes);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!transactionTypeSearchInput.contains(e.target) && !transactionTypeDropdown.contains(e.target)) {
                transactionTypeDropdown.classList.add('hidden');
            }
        });
    }
}

// Function to filter users for approval fields
window.filterUsers = function(fieldId) {
    const searchInput = document.getElementById(`${fieldId}Search`);
    const hiddenSelect = document.getElementById(fieldId);
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    
    if (!searchInput || !hiddenSelect || !dropdown) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    dropdown.innerHTML = '';
    
    if (searchTerm.length === 0) {
        dropdown.classList.add('hidden');
        return;
    }
    
    // Sample users data - replace with actual API call in production
    const users = [
        { id: 'USR001', name: 'John Doe' },
        { id: 'USR002', name: 'Jane Smith' },
        { id: 'USR003', name: 'Robert Johnson' },
        { id: 'USR004', name: 'Emily Davis' },
        { id: 'USR005', name: 'Michael Wilson' }
    ];
    
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm) || 
        user.id.toLowerCase().includes(searchTerm)
    );
    
    if (filteredUsers.length > 0) {
        dropdown.classList.remove('hidden');
        
        filteredUsers.forEach(user => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = `${user.name} (${user.id})`;
            item.addEventListener('click', function() {
                searchInput.value = user.name;
                
                // Update the hidden select
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                option.selected = true;
                
                hiddenSelect.innerHTML = '';
                hiddenSelect.appendChild(option);
                
                dropdown.classList.add('hidden');
            });
            dropdown.appendChild(item);
        });
    } else {
        dropdown.classList.add('hidden');
    }
};

// Function to filter business partners
window.filterBusinessPartners = function() {
    const searchInput = document.getElementById('paidToSearch');
    const hiddenInput = document.getElementById('paidTo');
    const dropdown = document.getElementById('paidToDropdown');
    
    if (!searchInput || !hiddenInput || !dropdown) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    dropdown.innerHTML = '';
    
    if (searchTerm.length === 0) {
        dropdown.classList.add('hidden');
        return;
    }
    
    // Sample business partners data - replace with actual API call in production
    const partners = [
        { id: 'BP001', code: 'VEN001', name: 'ABC Corporation' },
        { id: 'BP002', code: 'VEN002', name: 'XYZ Industries' },
        { id: 'BP003', code: 'VEN003', name: 'Global Supplies Ltd' },
        { id: 'BP004', code: 'VEN004', name: 'Tech Solutions Inc' },
        { id: 'BP005', code: 'VEN005', name: 'Prime Logistics' }
    ];
    
    const filteredPartners = partners.filter(partner => 
        partner.name.toLowerCase().includes(searchTerm) || 
        partner.code.toLowerCase().includes(searchTerm)
    );
    
    if (filteredPartners.length > 0) {
        dropdown.classList.remove('hidden');
        
        filteredPartners.forEach(partner => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = `${partner.code} - ${partner.name}`;
            item.addEventListener('click', function() {
                searchInput.value = `${partner.code} - ${partner.name}`;
                hiddenInput.value = partner.id;
                dropdown.classList.add('hidden');
            });
            dropdown.appendChild(item);
        });
    } else {
        dropdown.classList.add('hidden');
    }
};

// Function to filter requesters
window.filterRequesters = function() {
    const searchInput = document.getElementById('requesterSearch');
    const hiddenSelect = document.getElementById('RequesterId');
    const dropdown = document.getElementById('requesterDropdown');
    
    if (!searchInput || !hiddenSelect || !dropdown) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    dropdown.innerHTML = '';
    
    if (searchTerm.length === 0) {
        dropdown.classList.add('hidden');
        return;
    }
    
    // Sample requesters data - replace with actual API call in production
    const requesters = [
        { id: 'REQ001', name: 'Alex Johnson' },
        { id: 'REQ002', name: 'Sarah Williams' },
        { id: 'REQ003', name: 'David Brown' },
        { id: 'REQ004', name: 'Lisa Taylor' },
        { id: 'REQ005', name: 'Mark Wilson' }
    ];
    
    const filteredRequesters = requesters.filter(requester => 
        requester.name.toLowerCase().includes(searchTerm) || 
        requester.id.toLowerCase().includes(searchTerm)
    );
    
    if (filteredRequesters.length > 0) {
        dropdown.classList.remove('hidden');
        
        filteredRequesters.forEach(requester => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = `${requester.name} (${requester.id})`;
            item.addEventListener('click', function() {
                searchInput.value = requester.name;
                
                // Update the hidden select
                const option = document.createElement('option');
                option.value = requester.id;
                option.textContent = requester.name;
                option.selected = true;
                
                hiddenSelect.innerHTML = '';
                hiddenSelect.appendChild(option);
                
                dropdown.classList.add('hidden');
            });
            dropdown.appendChild(item);
        });
    } else {
        dropdown.classList.add('hidden');
    }
};

// Base URL for API calls
const BASE_URL = window.location.origin;

// Function to redirect to menu page
function goToMenuOP() {
    window.location.href = "../../../dashboard/dashboardCheck/outgoingPayment/menuOPCheck.html";
}

// Function to handle approving the outgoing payment
function approveOP() {
    Swal.fire({
        title: 'Confirm Check',
        text: 'Are you sure you want to check this outgoing payment?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, check it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Get the ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('op-id');
            
            if (!id) {
                Swal.fire('Error!', 'Outgoing payment ID not found.', 'error');
                return;
            }

            // Show loading indicator
            Swal.fire({
                title: 'Processing...',
                text: 'Please wait while we process your request.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Get the checker ID (logged-in user)
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            const checkerId = loggedInUser ? loggedInUser.id : null;

            if (!checkerId) {
                Swal.fire('Error!', 'User information not found. Please log in again.', 'error');
                return;
            }

            // Prepare data for API call
            const data = {
                id: id,
                checkedById: checkerId
            };

            // Call the API to check the outgoing payment
            fetch(`${BASE_URL}/api/outgoing-payment/check/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(`Error: ${response.status}`);
                }
            })
            .then(result => {
                if (result.status) {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Outgoing payment has been checked successfully.',
                        icon: 'success'
                    }).then(() => {
                        // Redirect to menu page
                        goToMenuOP();
                    });
                } else {
                    Swal.fire('Error!', result.message || 'Failed to check outgoing payment.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire('Error!', 'An error occurred while checking the outgoing payment.', 'error');
            });
        }
    });
}

// Function to handle rejecting the outgoing payment
function rejectOP() {
    // Show rejection reason input dialog
    Swal.fire({
        title: 'Rejection Reason',
        input: 'textarea',
        inputPlaceholder: 'Please provide a reason for rejection...',
        inputAttributes: {
            'aria-label': 'Rejection reason'
        },
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
            if (!value) {
                return 'You need to provide a reason for rejection!';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const rejectionReason = result.value;
            
            // Get the ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('op-id');
            
            if (!id) {
                Swal.fire('Error!', 'Outgoing payment ID not found.', 'error');
                return;
            }

            // Show loading indicator
            Swal.fire({
                title: 'Processing...',
                text: 'Please wait while we process your request.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Get the checker ID (logged-in user)
            const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            const checkerId = loggedInUser ? loggedInUser.id : null;

            if (!checkerId) {
                Swal.fire('Error!', 'User information not found. Please log in again.', 'error');
                return;
            }

            // Prepare data for API call
            const data = {
                id: id,
                checkedById: checkerId,
                rejectedRemarks: rejectionReason
            };

            // Call the API to reject the outgoing payment
            fetch(`${BASE_URL}/api/outgoing-payment/reject/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(`Error: ${response.status}`);
                }
            })
            .then(result => {
                if (result.status) {
                    Swal.fire({
                        title: 'Rejected!',
                        text: 'Outgoing payment has been rejected successfully.',
                        icon: 'success'
                    }).then(() => {
                        // Redirect to menu page
                        goToMenuOP();
                    });
                } else {
                    Swal.fire('Error!', result.message || 'Failed to reject outgoing payment.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire('Error!', 'An error occurred while rejecting the outgoing payment.', 'error');
            });
        }
    });
}

// Function to load outgoing payment data
function loadOutgoingPaymentData() {
    // Get the ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('op-id');
    
    if (!id) {
        Swal.fire('Error!', 'Outgoing payment ID not found in URL.', 'error');
        return;
    }
    
    // Call the GET API
    fetch(`${BASE_URL}/api/outgoing-payment/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status === 200) {
            return response.json();
        } else if (response.status === 404) {
            throw new Error('Outgoing payment data not found');
        } else {
            throw new Error(`Error: ${response.status}`);
        }
    })
    .then(result => {
        if (result.status && result.data) {
            populateForm(result.data);
        } else {
            Swal.fire('Error!', result.message || 'Failed to load outgoing payment data.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire('Error!', 'An error occurred while loading outgoing payment data.', 'error');
    });
}

// Function to populate form with data
function populateForm(data) {
    // Populate basic fields
    document.getElementById("cashAdvanceNo").value = data.cashAdvanceNo || '';
    document.getElementById("employeeId").value = data.employeeId || '';
    document.getElementById("employeeName").value = data.employeeName || '';
    document.getElementById("purpose").value = data.purpose || '';
    document.getElementById("submissionDate").value = data.submissionDate ? data.submissionDate.split('T')[0] : '';
    
    // Populate paid to field
    if (data.payTo && data.payToBusinessPartnerName) {
        document.getElementById('paidToSearch').value = data.payToBusinessPartnerName;
        document.getElementById('paidTo').value = data.payTo;
    }
    
    // Populate requester field
    if (data.requesterName) {
        document.getElementById("requesterSearch").value = data.requesterName;
    }
    
    // Populate department field
    if (data.departmentName) {
        document.getElementById("departmentSearch").value = data.departmentName;
        document.getElementById("departmentId").value = data.departmentId || '';
    }
    
    // Populate status field
    if (data.status) {
        document.getElementById("statusSearch").value = data.status;
        document.getElementById("status").value = data.status;
    }
    
    // Populate transaction type field
    if (data.transactionType) {
        document.getElementById("transactionTypeSearch").value = data.transactionType;
        document.getElementById("transactionType").value = data.transactionType;
    }
    
    // Populate table with outgoing payment details
    populateTable(data.outgoingPaymentDetails || []);
    
    // Populate approval fields
    populateApprovals({
        preparedById: data.preparedById,
        checkedById: data.checkedById,
        approvedById: data.approvedById,
        acknowledgedById: data.acknowledgedById,
        receivedById: data.receivedById,
        closedById: data.closedById
    });
    
    // Populate remarks if exists
    const remarksTextareas = document.querySelectorAll('textarea');
    if (remarksTextareas.length > 0) {
        remarksTextareas[0].value = data.remarks || '';
        if (remarksTextareas.length > 1) {
            remarksTextareas[1].value = data.journalRemarks || '';
        }
    }
    
    // Show rejection remarks if status is Rejected
    if (data.status === 'Rejected' && data.rejectedRemarks) {
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        const rejectionTextarea = document.getElementById('rejectionRemarks');
        
        if (rejectionSection && rejectionTextarea) {
            rejectionSection.style.display = 'block';
            rejectionTextarea.value = data.rejectedRemarks;
        }
    }
    
    // Make all fields read-only as this is a check page
    makeAllFieldsReadOnly();
}

// Function to populate table with outgoing payment details
function populateTable(details) {
    const tableBody = document.getElementById("tableBody");
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add rows for each detail
    details.forEach((detail, index) => {
        const newRow = document.createElement("tr");
        const rowId = index;
        
        newRow.innerHTML = `
            <td class="p-2 border">
                <input type="text" id="description_${rowId}" maxlength="255" class="w-full bg-gray-100" value="${detail.description || ''}" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" id="total_${rowId}" class="w-full currency-input bg-gray-100" value="${formatCurrency(detail.amount || 0)}" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" id="wTax_${rowId}" class="w-full currency-input bg-gray-100" value="${formatCurrency(detail.wTaxAmount || 0)}" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" id="totalPayment_${rowId}" class="w-full currency-input bg-gray-100" value="${formatCurrency((detail.amount || 0) - (detail.wTaxAmount || 0))}" readonly />
            </td>
            <td class="p-2 border text-center">
                <button type="button" class="text-red-500 hover:text-red-700 cursor-not-allowed opacity-50" disabled>
                    🗑
                </button>
            </td>
        `;
        
        tableBody.appendChild(newRow);
    });
    
    // If no details exist, add one empty row
    if (details.length === 0) {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td class="p-2 border">
                <input type="text" class="w-full bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" class="w-full currency-input bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" class="w-full currency-input bg-gray-100" readonly />
            </td>
            <td class="p-2 border">
                <input type="text" class="w-full currency-input bg-gray-100" readonly />
            </td>
            <td class="p-2 border text-center">
                <button type="button" class="text-red-500 hover:text-red-700 cursor-not-allowed opacity-50" disabled>
                    🗑
                </button>
            </td>
        `;
        tableBody.appendChild(newRow);
    }
    
    // Update total amount due
    updateTotalAmountDue(details);
}

// Function to update total amount due
function updateTotalAmountDue(details) {
    const totalAmountDueInput = document.getElementById('totalAmountDue');
    
    if (totalAmountDueInput && details && details.length > 0) {
        let total = 0;
        
        // Sum up all total payment values
        details.forEach(detail => {
            const amount = detail.amount || 0;
            const wTaxAmount = detail.wTaxAmount || 0;
            total += (amount - wTaxAmount);
        });
        
        // Format and set the total amount due
        totalAmountDueInput.value = formatCurrency(total);
    }
}

// Function to populate approval fields
function populateApprovals(approval) {
    // Populate prepared by field
    if (approval.preparedById) {
        fetchUserById(approval.preparedById, 'Approval.PreparedByIdSearch');
    }
    
    // Populate checked by field
    if (approval.checkedById) {
        fetchUserById(approval.checkedById, 'Approval.CheckedByIdSearch');
    }
    
    // Populate approved by field
    if (approval.approvedById) {
        fetchUserById(approval.approvedById, 'Approval.ApprovedByIdSearch');
    }
    
    // Populate acknowledged by field
    if (approval.acknowledgedById) {
        fetchUserById(approval.acknowledgedById, 'Approval.AcknowledgedByIdSearch');
    }
    
    // Populate received by field
    if (approval.receivedById) {
        fetchUserById(approval.receivedById, 'Approval.ReceivedByIdSearch');
    }
    
    // Populate closed by field
    if (approval.closedById) {
        fetchUserById(approval.closedById, 'Approval.ClosedByIdSearch');
    }
}

// Function to fetch user by ID
function fetchUserById(userId, fieldId) {
    fetch(`${BASE_URL}/api/users/${userId}`)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`Error: ${response.status}`);
            }
        })
        .then(result => {
            if (result.status && result.data) {
                const user = result.data;
                const searchInput = document.getElementById(fieldId);
                const selectId = fieldId.replace('Search', '');
                const selectElement = document.getElementById(selectId);
                
                if (searchInput) {
                    searchInput.value = user.fullName || '';
                }
                
                if (selectElement) {
                    selectElement.value = user.id || '';
                }
            }
        })
        .catch(error => {
            console.error('Error fetching user:', error);
        });
}

// Function to make all fields read-only
function makeAllFieldsReadOnly() {
    // Make all input fields read-only
    const inputFields = document.querySelectorAll('input[type="text"], input[type="date"], textarea');
    inputFields.forEach(field => {
        field.readOnly = true;
        field.classList.add('bg-gray-100', 'cursor-not-allowed');
    });
    
    // Disable add row button
    const addRowButton = document.querySelector('button[onclick="addRow()"]');
    if (addRowButton) {
        addRowButton.disabled = true;
        addRowButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Helper function to format currency
function formatCurrency(number) {
    // Handle empty or invalid input
    if (number === null || number === undefined || number === '') {
        return '';
    }
    
    // Parse the number
    const num = parseFloat(number);
    
    // If parsing failed, return empty string
    if (isNaN(num)) {
        return '';
    }
    
    // Format with US locale (thousand separator: ',', decimal separator: '.')
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load outgoing payment data
    loadOutgoingPaymentData();
});
