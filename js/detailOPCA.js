// Detail view implementation for Outgoing Payment Cash Advance (OPCA)
// This page displays the same information as addOPCA.html but in read-only format

(function () {
    // 1) Disable auth checks used by addOPReim.js
    window.checkAuthentication = function () {
        return true;
    };

    // 2) Provide a non-authenticated fetch wrapper that always succeeds with empty data
    //    to avoid redirects or errors when some features try to call the API.
    window.makeAuthenticatedRequest = async function (url, options = {}) {
        try {
            const fullUrl = url.startsWith('http') ? url : `${window.BASE_URL || ''}${url.startsWith('/') ? url : '/' + url}`;
            // Attempt plain fetch without Authorization; if it fails (CORS/401), fall back to mock response
            const response = await fetch(fullUrl, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
            if (response && response.ok) return response;
        } catch (e) {
            // ignore and return mock below
        }

        // Mock success response with empty data shape commonly expected by callers
        const payload = { status: true, data: [] };
        return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    // 3) Override initializePage to avoid any API calls and just set up the UI
    window.initializePage = async function () {
        try {
            // Initialize detail view specific fields
            initializeDetailViewFields();
            
            // Initialize simple totals and display handlers only
            if (typeof initializeInputValidations === 'function') initializeInputValidations();
            
            // Ensure totals are computed for initial render
            if (typeof updateTotalAmountDue === 'function') updateTotalAmountDue();
            if (typeof setInitialRemittanceRequestAmount === 'function') setInitialRemittanceRequestAmount();
            
            // Load mock data for demonstration
            loadMockData();
            
        } catch (e) {
            console.error('OPCA detail view initialize error:', e);
        }
    };

    // 4) Initialize Detail View specific fields
    function initializeDetailViewFields() {
        // Set default values for detail view fields
        const statusBadge = document.getElementById('statusBadge');
        if (statusBadge) {
            // Set random status for demonstration
            const statuses = ['draft', 'pending', 'approved', 'rejected', 'completed'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            statusBadge.className = `status-badge status-${randomStatus}`;
            statusBadge.textContent = randomStatus.charAt(0).toUpperCase() + randomStatus.slice(1);
        }

        // Initialize approval workflow fields with mock data
        initializeApprovalWorkflow();
        
        // Initialize table rows with mock data
        initializeTableRows();
    }

    // 5) Initialize Approval Workflow with mock data
    function initializeApprovalWorkflow() {
        const approvalFields = [
            'Approval.PreparedByIdSearch',
            'Approval.CheckedByIdSearch',
            'Approval.AcknowledgedByIdSearch',
            'Approval.ApprovedByIdSearch',
            'Approval.ReceivedByIdSearch'
        ];

        const mockUsers = [
            'John Doe - Finance Manager',
            'Jane Smith - Senior Accountant',
            'Mike Johnson - Department Head',
            'Sarah Wilson - Director',
            'Tom Brown - CFO'
        ];

        approvalFields.forEach((fieldId, index) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.textContent = mockUsers[index] || 'Not Assigned';
            }
        });
    }

    // 6) Initialize Table Rows with mock data
    function initializeTableRows() {
        const tableBody = document.getElementById('tableBody');
        if (!tableBody) return;

        // Clear existing rows
        tableBody.innerHTML = '';

        // Add mock data rows
        const mockRows = [
            {
                division: 'Marketing Division',
                accountName: 'Marketing Expenses',
                glAccount: 'GL001 - Marketing Account',
                description: 'Cash advance for marketing campaign',
                amount: '5,000,000.00'
            },
            {
                division: 'Sales Division',
                accountName: 'Sales Expenses',
                glAccount: 'GL002 - Sales Account',
                description: 'Cash advance for sales activities',
                amount: '3,500,000.00'
            }
        ];

        mockRows.forEach((rowData, index) => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td class="p-2 border">
                    <div id="Division_${index}" class="detail-field readonly">${rowData.division}</div>
                    <input type="hidden" id="DivisionCode_${index}" value="DIV${index + 1}" />
                </td>
                <td class="p-2 border">
                    <div id="AcctName_${index}" class="detail-field readonly">${rowData.accountName}</div>
                </td>
                <td class="p-2 border">
                    <div id="AcctCode_${index}" class="detail-field readonly">${rowData.glAccount}</div>
                </td>
                <td class="p-2 border">
                    <div id="description_${index}" class="detail-field readonly">${rowData.description}</div>
                </td>
                <td class="p-2 border">
                    <div id="DocTotal_${index}" class="detail-field readonly">${rowData.amount}</div>
                </td>
            `;
            tableBody.appendChild(newRow);
        });
    }

    // 7) Load Mock Data for demonstration
    function loadMockData() {
        // Set mock values for main fields
        const mockData = {
            CounterRef: 'CA-2024-001',
            RequesterName: 'John Doe',
            CardName: 'Marketing Department',
            DocDate: '2024-01-15',
            DocDueDate: '2024-02-15',
            DocNum: 'DOC-2024-001',
            Transaction: 'Marketing Campaign Cash Advance',
            DocCurr: 'IDR',
            RemittanceRequestAmount: '8,500,000.00',
            TrsfrAcct: '1210 - Mizuho Bank (Rp)',
            ControlAccount: 'CTRL-001',
            PaymentCurrency: 'IDR',
            remarks: 'Cash advance for Q1 2024 marketing campaign expenses',
            journalRemarks: 'Debit Marketing Expenses, Credit Cash/Bank'
        };

        // Populate fields with mock data
        Object.keys(mockData).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                if (field.tagName === 'INPUT') {
                    field.value = mockData[fieldId];
                } else {
                    field.textContent = mockData[fieldId];
                }
            }
        });

        // Update totals after loading mock data
        updateTotals();
        updateTotalAmountDue();
    }

    // 8) Override updateTotalAmountDue for detail view
    window.updateTotalAmountDue = function() {
        try {
            // Get all DocTotal elements from the table
            const docTotalElements = document.querySelectorAll('#tableBody div[id^="DocTotal_"]');
            let total = 0;
            
            // Sum all values
            docTotalElements.forEach(element => {
                const amount = parseCurrencyIDR(element.textContent);
                total += amount;
            });
            
            // Format the total
            const formattedTotal = formatCurrencyIDR(total);
            
            // Update currency summary table
            const currencySummaryTable = document.getElementById('currencySummaryTable');
            if (currencySummaryTable) {
                currencySummaryTable.innerHTML = `
                    <div class="text-sm">
                        <div class="font-semibold">Total Amount Due:</div>
                        <div class="text-lg font-bold text-blue-600">IDR ${formattedTotal}</div>
                    </div>
                `;
            }
            
            // Update amount in words
            const totalOutstandingTransfers = document.getElementById('totalOutstandingTransfers');
            if (totalOutstandingTransfers) {
                totalOutstandingTransfers.textContent = numberToWords(total);
            }
            
            // Update Remittance Request Amount
            const remittanceRequestAmountField = document.getElementById('RemittanceRequestAmount');
            if (remittanceRequestAmountField) {
                remittanceRequestAmountField.textContent = formattedTotal;
            }
            
        } catch (error) {
            console.error('Error updating total amount due:', error);
        }
    };

    // 9) Override setInitialRemittanceRequestAmount for detail view
    window.setInitialRemittanceRequestAmount = function() {
        try {
            // Calculate total from table rows
            const docTotalElements = document.querySelectorAll('#tableBody div[id^="DocTotal_"]');
            let total = 0;
            
            docTotalElements.forEach(element => {
                const amount = parseCurrencyIDR(element.textContent);
                total += amount;
            });
            
            // Update the field
            const remittanceRequestAmountField = document.getElementById('RemittanceRequestAmount');
            if (remittanceRequestAmountField) {
                remittanceRequestAmountField.textContent = formatCurrencyIDR(total);
            }
            
        } catch (error) {
            console.error('Error setting initial remittance request amount:', error);
        }
    };

    // 10) Number to Words conversion function
    function numberToWords(num) {
        if (num === 0) return 'Zero Rupiah';
        
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        
        function convertLessThanOneThousand(n) {
            if (n === 0) return '';
            
            if (n < 10) return ones[n];
            if (n < 20) return teens[n - 10];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
            if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanOneThousand(n % 100) : '');
        }
        
        function convert(n) {
            if (n === 0) return 'Zero';
            
            const billion = Math.floor(n / 1000000000);
            const million = Math.floor((n % 1000000000) / 1000000);
            const thousand = Math.floor((n % 1000000) / 1000);
            const remainder = n % 1000;
            
            let result = '';
            
            if (billion) {
                result += convertLessThanOneThousand(billion) + ' Billion';
            }
            
            if (million) {
                result += (result ? ' ' : '') + convertLessThanOneThousand(million) + ' Million';
            }
            
            if (thousand) {
                result += (result ? ' ' : '') + convertLessThanOneThousand(thousand) + ' Thousand';
            }
            
            if (remainder) {
                result += (result ? ' ' : '') + convertLessThanOneThousand(remainder);
            }
            
            return result;
        }
        
        const wholePart = Math.floor(num);
        const decimalPart = Math.round((num - wholePart) * 100);
        
        let result = convert(wholePart) + ' Rupiah';
        
        if (decimalPart > 0) {
            result += ' and ' + convert(decimalPart) + ' Cents';
        }
        
        return result;
    }

    // 11) Override mapResponseToForm for detail view
    window.mapResponseToForm = function(data) {
        try {
            // Map API response data to form fields
            const fieldMappings = {
                'CounterRef': 'CounterRef',
                'RequesterName': 'RequesterName',
                'CardName': 'CardName',
                'DocDate': 'DocDate',
                'DocDueDate': 'DocDueDate',
                'DocNum': 'DocNum',
                'Transaction': 'Transaction',
                'TrsfrAcct': 'TrsfrAcct',
                'ControlAccount': 'ControlAccount',
                'remarks': 'remarks',
                'journalRemarks': 'journalRemarks'
            };

            Object.keys(fieldMappings).forEach(apiField => {
                const formField = fieldMappings[apiField];
                const element = document.getElementById(formField);
                if (element && data[apiField]) {
                    if (element.tagName === 'INPUT') {
                        element.value = data[apiField];
                    } else {
                        element.textContent = data[apiField];
                    }
                }
            });

            // Map table data if available
            if (data.items && Array.isArray(data.items)) {
                mapTableData(data.items);
            }

            // Update totals after mapping
            updateTotals();
            updateTotalAmountDue();

        } catch (error) {
            console.error('Error mapping response to form:', error);
        }
    };

    // 12) Map table data from API response
    function mapTableData(items) {
        const tableBody = document.getElementById('tableBody');
        if (!tableBody) return;

        // Clear existing rows
        tableBody.innerHTML = '';

        items.forEach((item, index) => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td class="p-2 border">
                    <div id="Division_${index}" class="detail-field readonly">${item.division || ''}</div>
                    <input type="hidden" id="DivisionCode_${index}" value="${item.divisionCode || ''}" />
                </td>
                <td class="p-2 border">
                    <div id="AcctName_${index}" class="detail-field readonly">${item.accountName || ''}</div>
                </td>
                <td class="p-2 border">
                    <div id="AcctCode_${index}" class="detail-field readonly">${item.glAccount || ''}</div>
                </td>
                <td class="p-2 border">
                    <div id="description_${index}" class="detail-field readonly">${item.description || ''}</div>
                </td>
                <td class="p-2 border">
                    <div id="DocTotal_${index}" class="detail-field readonly">${formatCurrencyIDR(item.amount || 0)}</div>
                </td>
            `;
            tableBody.appendChild(newRow);
        });
    }

    // 13) Override displayExistingAttachments for detail view
    window.displayExistingAttachments = function(attachments) {
        try {
            const attachmentsList = document.getElementById('attachmentsList');
            const printOutCashAdvanceList = document.getElementById('printOutCashAdvanceList');
            
            if (attachmentsList) {
                if (attachments && attachments.length > 0) {
                    let attachmentsHtml = '';
                    attachments.forEach(attachment => {
                        attachmentsHtml += `
                            <div class="flex items-center justify-between p-2 border-b border-gray-200">
                                <div class="flex items-center space-x-2">
                                    <span class="text-blue-600">📎</span>
                                    <span class="text-sm">${attachment.fileName || 'Attachment'}</span>
                                </div>
                                <button onclick="viewAttachment('${attachment.id || ''}')" 
                                        class="text-blue-600 hover:text-blue-800 text-sm">
                                    View
                                </button>
                            </div>
                        `;
                    });
                    attachmentsList.innerHTML = attachmentsHtml;
                } else {
                    attachmentsList.innerHTML = '<p class="text-gray-500 text-sm">No attachments found</p>';
                }
            }
            
            if (printOutCashAdvanceList) {
                // For Cash Advance, we might have specific reference documents
                printOutCashAdvanceList.innerHTML = '<p class="text-gray-500 text-sm">No reference documents found</p>';
            }
            
        } catch (error) {
            console.error('Error displaying attachments:', error);
        }
    };

    // 14) View attachment function
    window.viewAttachment = function(attachmentId) {
        Swal.fire({
            title: 'View Attachment',
            text: `Viewing attachment ID: ${attachmentId}`,
            icon: 'info',
            confirmButtonText: 'OK'
        });
    };

    // 15) Override updateTotals for detail view
    window.updateTotals = function() {
        try {
            // Get all DocTotal elements from the table
            const docTotalElements = document.querySelectorAll('#tableBody div[id^="DocTotal_"]');
            let total = 0;
            
            // Sum all values using IDR format
            docTotalElements.forEach(element => {
                total += parseCurrencyIDR(element.textContent);
            });
            
            // Format the total with IDR format
            const formattedTotal = formatCurrencyIDR(total);
            
            // Update Net Total and Total Amount Due fields
            const netTotalField = document.getElementById('netTotal');
            const totalTaxField = document.getElementById('totalTax');
            
            if (netTotalField) netTotalField.textContent = formattedTotal;
            if (totalTaxField) totalTaxField.textContent = formattedTotal;
            
            // Update Remittance Request Amount
            const remittanceRequestAmountField = document.getElementById('RemittanceRequestAmount');
            if (remittanceRequestAmountField) {
                remittanceRequestAmountField.textContent = formattedTotal;
            }
            
        } catch (error) {
            console.error('Error updating totals:', error);
        }
    };

    // 16) Initialize input validations (empty for detail view)
    window.initializeInputValidations = function() {
        // No input validations needed for read-only detail view
        console.log('Detail view: No input validations needed');
    };

    // Ensure our initialize runs after DOM is ready
    window.addEventListener('load', function () {
        if (typeof window.initializePage === 'function') {
            window.initializePage();
        }
    });

})();
