// AR Invoice Print Page JavaScript

// API Configuration
const API_BASE_URL = 'https://expressiv-be-sb.idsdev.site/api';

// Function to wrap text at specified character limit
function wrapText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    
    // If text doesn't contain spaces or is a single long word
    if (!text.includes(' ')) {
        const chunks = [];
        for (let i = 0; i < text.length; i += maxLength) {
            chunks.push(text.slice(i, i + maxLength));
        }
        return chunks.join('<br>');
    }
    
    // If text contains spaces, try to break at word boundaries
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
        // If single word is longer than maxLength, break it
        if (word.length > maxLength) {
            if (currentLine) {
                lines.push(currentLine);
                currentLine = '';
            }
            // Break the long word into chunks
            const chunks = [];
            for (let i = 0; i < word.length; i += maxLength) {
                chunks.push(word.slice(i, i + maxLength));
            }
            lines.push(...chunks);
        } else if ((currentLine + ' ' + word).length > maxLength) {
            // If adding this word would exceed maxLength
            if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = word;
            }
        } else {
            currentLine = currentLine ? currentLine + ' ' + word : word;
        }
    }
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    return lines.join('<br>');
}

document.addEventListener('DOMContentLoaded', function() {
    // Get invoice data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const stagingID = urlParams.get('stagingID');
    const docEntry = urlParams.get('docEntry');
    const identifier = stagingID || docEntry;
    
    // Check if this is the first load (no refresh flag in sessionStorage)
    const hasRefreshed = sessionStorage.getItem(`refreshed_${identifier}`);
    const refreshCount = parseInt(sessionStorage.getItem(`refreshCount_${identifier}`) || '0');
    
    if (!hasRefreshed && identifier && refreshCount < 1) {
        // Check if we have complete data in localStorage before deciding to refresh
        const storedData = localStorage.getItem(`invoice_${identifier}`);
        let shouldRefresh = true;
        
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                if (isFinancialDataComplete(parsedData)) {
                    console.log('Financial data is already complete in localStorage, no need to refresh...');
                    shouldRefresh = false;
                } else {
                    console.log('Financial data is incomplete in localStorage, will refresh...');
                }
            } catch (error) {
                console.log('Error parsing stored data, will refresh...');
            }
        } else {
            console.log('No stored data found, will refresh...');
        }
        
        if (shouldRefresh) {
            // This is the first load and data is incomplete, set refresh flag and reload the page
            console.log('First load detected with incomplete data, setting refresh flag and reloading page...');
            sessionStorage.setItem(`refreshed_${identifier}`, 'true');
            sessionStorage.setItem(`refreshCount_${identifier}`, (refreshCount + 1).toString());
            
            // Small delay to ensure sessionStorage is set
            setTimeout(() => {
                console.log('Auto-refreshing page to ensure data is loaded...');
                window.location.reload();
            }, 100);
            return;
        }
    }
    
    // Clear the refresh flags after successful load
    if (hasRefreshed && identifier) {
        console.log('Page refreshed successfully, clearing refresh flags...');
        sessionStorage.removeItem(`refreshed_${identifier}`);
        sessionStorage.removeItem(`refreshCount_${identifier}`);
    }
    
    // Immediately fetch and populate signature data AND financial summary data
    if (identifier) {
        try {
            const storedData = localStorage.getItem(`invoice_${identifier}`);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                console.log('Found cached invoice data in localStorage, checking completeness...');
                console.log('Stored data keys:', Object.keys(parsedData));
                
                // Always populate signature information
                populateSignatureInformation(parsedData);
                
                // Pre-populate financial summary data immediately ONLY if data is complete
                if (isFinancialDataComplete(parsedData)) {
                    console.log('Financial data is complete, pre-populating financial summary...');
                    populateFinancialSummary(parsedData);
                } else {
                    console.log('Financial data is incomplete, skipping pre-population. Will wait for API data...');
                }
            } else {
                // If no data in localStorage, try to fetch signature data directly
                console.log('No cached data found, fetching signature and financial data directly...');
                fetch(`${API_BASE_URL}/ar-invoices/${identifier}/details`)
                    .then(response => response.json())
                    .then(result => {
                        if (result.status && result.data) {
                            console.log('Pre-populating signature and financial summary from API data...');
                            populateSignatureInformation(result.data);
                            // Pre-populate financial summary data immediately
                            populateFinancialSummary(result.data);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching signature and financial data:', error);
                    });
            }
        } catch (error) {
            console.error('Error pre-populating signature and financial data from localStorage:', error);
        }
    }
    
    // Check if we already have data directly passed from the parent window
    // This will be used when the print page is opened directly from receiveInvItem.js
    if (window.opener && window.opener.currentInvItemData) {
        console.log('Data found from parent window, using it directly');
        try {
            const parentData = window.opener.currentInvItemData;
            // Populate signature first to ensure it's displayed immediately
            populateSignatureInformation(parentData);
            // Pre-populate financial summary data immediately ONLY if data is complete
            if (isFinancialDataComplete(parentData)) {
                console.log('Financial data from parent window is complete, pre-populating financial summary...');
                populateFinancialSummary(parentData);
            } else {
                console.log('Financial data from parent window is incomplete, skipping pre-population...');
            }
            // Then populate the rest of the invoice data
            populateInvoiceData(parentData);
            return;
        } catch (error) {
            console.error('Error using data from parent window:', error);
            // Continue with normal loading if direct data access fails
        }
    }
    
    if (stagingID) {
        loadInvoiceDataFromAPI(stagingID);
    } else if (docEntry) {
        loadInvoiceDataFromAPI(docEntry);
    } else {
        // Show error message when no identifier is provided
        showErrorMessage('No invoice identifier provided. Please provide stagingID or docEntry parameter.');
    }
});

// Function to load invoice data from API
async function loadInvoiceDataFromAPI(identifier) {
    try {
        console.log('Fetching invoice data from API for identifier:', identifier);
        console.log('API URL:', `${API_BASE_URL}/ar-invoices/${identifier}/details`);
        
        const response = await fetch(`${API_BASE_URL}/ar-invoices/${identifier}/details`);
        console.log('API Response status:', response.status);
        console.log('API Response ok:', response.ok);
        
        if (response.ok) {
            const result = await response.json();
            console.log('API Response:', result);
            
            if (result.status && result.data) {
                console.log('API data received successfully, populating invoice data...');
                populateInvoiceData(result.data);
            } else {
                console.error('API returned error:', result.message);
                showErrorMessage('Failed to load invoice data: ' + (result.message || 'Unknown error'));
            }
        } else {
            console.error('API request failed with status:', response.status);
            const errorText = await response.text();
            console.error('API Error response:', errorText);
            showErrorMessage('Failed to load invoice data. HTTP Status: ' + response.status);
        }
    } catch (error) {
        console.error('Error loading invoice data from API:', error);
        showErrorMessage('Network error: ' + error.message);
    }
}

// Function to show error message
function showErrorMessage(message) {
    console.error(message);
    
    // Create error display
    const pagesContainer = document.getElementById('pagesContainer');
    pagesContainer.innerHTML = `
        <div class="page-container" style="text-align: center; padding: 50px;">
            <h2 style="color: #dc2626; margin-bottom: 20px;">Error Loading Invoice Data</h2>
            <p style="color: #6b7280; margin-bottom: 20px;">${message}</p>
            <button onclick="goBack()" class="print-btn" style="background-color: #6b7280;">Go Back</button>
        </div>
    `;
}

// Function to load invoice data from receive page (kept for backward compatibility)
async function loadInvoiceDataFromReceivePage(identifier) {
    try {
        // Get data from localStorage or sessionStorage that was set by receiveInvItem.html
        const invoiceData = await getInvoiceDataFromStorage(identifier);
        
        if (invoiceData) {
            populateInvoiceData(invoiceData);
        } else {
            console.error('No invoice data found for identifier:', identifier);
            showErrorMessage('No invoice data found for identifier: ' + identifier);
        }
    } catch (error) {
        console.error('Error loading invoice data:', error);
        showErrorMessage('Error loading invoice data: ' + error.message);
    }
}

// Function to get invoice data from storage
async function getInvoiceDataFromStorage(identifier) {
    // Try to get data from localStorage first
    const storedData = localStorage.getItem(`invoice_${identifier}`);
    if (storedData) {
        return JSON.parse(storedData);
    }
    
    // Try to get data from sessionStorage
    const sessionData = sessionStorage.getItem(`invoice_${identifier}`);
    if (sessionData) {
        return JSON.parse(sessionData);
    }
    
    // If no stored data, try to get from API
    try {
        console.log('No stored data found, trying to fetch from API...');
        const response = await fetch(`${API_BASE_URL}/ar-invoices/${identifier}/details`);
        if (response.ok) {
            const result = await response.json();
            if (result.status && result.data) {
                console.log('Data fetched from API:', result.data);
                return result.data;
            }
        }
    } catch (error) {
        console.error('Error fetching data from API:', error);
    }
    
    return null;
}

// Function to save invoice data to storage (to be called from receiveInvItem.html)
function saveInvoiceDataToStorage(identifier, invoiceData) {
    try {
        localStorage.setItem(`invoice_${identifier}`, JSON.stringify(invoiceData));
        sessionStorage.setItem(`invoice_${identifier}`, JSON.stringify(invoiceData));
        console.log('Invoice data saved to storage for identifier:', identifier);
        return true;
    } catch (error) {
        console.error('Error saving invoice data to storage:', error);
        return false;
    }
}

// Function to clear invoice data from storage
function clearInvoiceDataFromStorage(identifier) {
    try {
        localStorage.removeItem(`invoice_${identifier}`);
        sessionStorage.removeItem(`invoice_${identifier}`);
        console.log('Invoice data cleared from storage for identifier:', identifier);
        return true;
    } catch (error) {
        console.error('Error clearing invoice data from storage:', error);
        return false;
    }
}

// Function to load invoice data from API (kept for backward compatibility)
async function loadInvoiceData(invoiceId) {
    try {
        // Replace with your actual API endpoint
        const response = await fetch(`${API_BASE_URL}/ar-invoices/${invoiceId}/details`);
        const data = await response.json();
        
        if (data.status && data.data) {
            populateInvoiceData(data.data);
        } else {
            console.error('Failed to load invoice data:', data.message);
            showErrorMessage('Failed to load invoice data: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading invoice data:', error);
        showErrorMessage('Error loading invoice data: ' + error.message);
    }
}

// Function to populate invoice data with new API structure
function populateInvoiceData(invoice) {
    console.log('Populating invoice data:', invoice);
    
    // Populate signature information first
    populateSignatureInformation(invoice);
    
    try {
        // Invoice details - map from new API structure to print page structure
        const invoiceNumberElement = document.getElementById('invoiceNumber');
        const visionInvoiceNumberElement = document.getElementById('visionInvoiceNumber');
        const invoiceDateElement = document.getElementById('invoiceDate');
        const npwpElement = document.getElementById('npwp');
        const dueDateElement = document.getElementById('dueDate');
        
        if (invoiceNumberElement) {
            invoiceNumberElement.textContent = invoice.u_bsi_invnum || invoice.docNum || '';
            console.log('Invoice Number set to:', invoiceNumberElement.textContent);
        } else {
            console.error('Invoice Number element not found');
        }
        
        if (visionInvoiceNumberElement) {
            visionInvoiceNumberElement.textContent = invoice.visInv || invoice.u_bsi_invnum || invoice.docNum || '';
            console.log('Vision Invoice Number set to:', visionInvoiceNumberElement.textContent);
        } else {
            console.error('Vision Invoice Number element not found');
        }
        
        if (invoiceDateElement) {
            invoiceDateElement.textContent = formatDate(invoice.docDate);
            console.log('Invoice Date set to:', invoiceDateElement.textContent);
        } else {
            console.error('Invoice Date element not found');
        }
        
        if (npwpElement) {
            npwpElement.textContent = invoice.licTradNum || '';
            console.log('NPWP set to:', npwpElement.textContent);
        } else {
            console.error('NPWP element not found');
        }
        
        if (dueDateElement) {
            dueDateElement.textContent = formatDate(invoice.docDueDate || invoice.docDate);
            console.log('Due Date set to:', dueDateElement.textContent);
        } else {
            console.error('Due Date element not found');
        }
        
        // Recipient information
        const recipientNameElement = document.getElementById('recipientName');
        const recipientAddressElement = document.getElementById('recipientAddress');
        const recipientCityElement = document.getElementById('recipientCity');
        
        if (recipientNameElement) {
            recipientNameElement.textContent = invoice.cardName || '';
            console.log('Recipient Name set to:', recipientNameElement.textContent);
        } else {
            console.error('Recipient Name element not found');
        }
        
        // Parse address from the address field
        if (invoice.address) {
            const addressLines = invoice.address.split('\r\r');
            if (addressLines.length >= 1 && recipientAddressElement) {
                recipientAddressElement.textContent = addressLines[0].trim();
                console.log('Recipient Address set to:', recipientAddressElement.textContent);
            }
            if (addressLines.length >= 2 && recipientCityElement) {
                recipientCityElement.textContent = addressLines[1].trim();
                console.log('Recipient City set to:', recipientCityElement.textContent);
            }
        } else {
            if (recipientAddressElement) recipientAddressElement.textContent = '';
            if (recipientCityElement) recipientCityElement.textContent = '';
        }
        
        // Shipper information - Always use hardcoded value
        const shipperNameElement = document.getElementById('shipperName');
        if (shipperNameElement) {
            shipperNameElement.textContent = 'PT. KANSAI PAINT INDONESIA';
            console.log('Shipper Name set to:', shipperNameElement.textContent);
        } else {
            console.error('Shipper Name element not found');
        }
        
        // Company information - populate from API data
        const companyNameElement = document.getElementById('companyName');
        const companyAddressElement = document.getElementById('companyAddress');
        const companyPhoneElement = document.getElementById('companyPhone');
        const companyFaxElement = document.getElementById('companyFax');
        const companyNameFooterElement = document.getElementById('companyNameFooter');
        
        if (companyNameElement) {
            companyNameElement.textContent = invoice.companyName || '';
            console.log('Company Name set to:', companyNameElement.textContent);
        }
        
        if (companyAddressElement) {
            companyAddressElement.textContent = invoice.companyAddress || '';
            console.log('Company Address set to:', companyAddressElement.textContent);
        }
        
        if (companyPhoneElement) {
            companyPhoneElement.textContent = invoice.companyPhone ? `Phone : ${invoice.companyPhone}` : '';
            console.log('Company Phone set to:', companyPhoneElement.textContent);
        }
        
        if (companyFaxElement) {
            companyFaxElement.textContent = invoice.companyFax ? `Fax : ${invoice.companyFax}` : '';
            console.log('Company Fax set to:', companyFaxElement.textContent);
        }
        
        if (companyNameFooterElement) {
            companyNameFooterElement.textContent = invoice.companyName || '';
            console.log('Company Name Footer set to:', companyNameFooterElement.textContent);
        }
        
        // Order numbers - use specific fields for DO and PO numbers with character limits
        const doNumbersElement = document.getElementById('doNumbers');
        const poNumbersElement = document.getElementById('poNumbers');
        
        if (doNumbersElement) {
            if (invoice.u_bsi_udf1) {
                const doValues = Array.isArray(invoice.u_bsi_udf1) ? invoice.u_bsi_udf1 : [invoice.u_bsi_udf1];
                if (doValues.length > 1) {
                    doNumbersElement.className = 'field-value multiple';
                    // Group values into rows of 3 with proper formatting
                    const rows = [];
                    for (let i = 0; i < doValues.length; i += 3) {
                        const row = doValues.slice(i, i + 3);
                        const isLastRow = i + 3 >= doValues.length;
                        const separator = isLastRow ? '.' : ',';
                        rows.push(`<div class="data-item"><strong>DO No.</strong> : ${row.join(', ')}${separator}</div>`);
                    }
                    doNumbersElement.innerHTML = rows.join('');
                } else {
                    doNumbersElement.className = 'field-value';
                    doNumbersElement.innerHTML = `<strong>DO No.</strong> : ${doValues[0]}`;
                }
            } else {
                doNumbersElement.className = 'field-value';
                doNumbersElement.innerHTML = '<strong>DO No.</strong> : ';
            }
            console.log('DO Numbers set to:', doNumbersElement.textContent);
        } else {
            console.error('DO Numbers element not found');
        }
        
        // Handle P/O NO with multiple values
        if (poNumbersElement) {
            if (invoice.u_bsi_udf2) {
                const poValues = Array.isArray(invoice.u_bsi_udf2) ? invoice.u_bsi_udf2 : [invoice.u_bsi_udf2];
                if (poValues.length > 1) {
                    poNumbersElement.className = 'detail-value multiple';
                    // Group values into rows of 3 with proper formatting
                    const rows = [];
                    for (let i = 0; i < poValues.length; i += 3) {
                        const row = poValues.slice(i, i + 3);
                        const isLastRow = i + 3 >= poValues.length;
                        const separator = isLastRow ? '.' : ',';
                        rows.push(`<div class="data-item">${row.join(', ')}${separator}</div>`);
                    }
                    poNumbersElement.innerHTML = rows.join('');
                } else {
                    poNumbersElement.className = 'detail-value';
                    poNumbersElement.textContent = poValues[0];
                }
            } else {
                poNumbersElement.className = 'detail-value';
                poNumbersElement.textContent = '';
            }
            console.log('PO Numbers set to:', poNumbersElement.textContent);
        } else {
            console.error('PO Numbers element not found');
        }
        
        // Items table - convert from new API structure to print page structure
        const printItems = convertItemsForPrint(invoice.arInvoiceDetails || []);
        console.log('Print items converted:', printItems);
        populateItemsTable(printItems);
        
        // Store invoice data for use in additional pages
        const urlParams = new URLSearchParams(window.location.search);
        const stagingID = urlParams.get('stagingID');
        const docEntry = urlParams.get('docEntry');
        const identifier = stagingID || docEntry;
        
        if (identifier) {
            saveInvoiceDataToStorage(identifier, invoice);
        }
        
        // Financial summary - use API fields with currency
        // Only populate if data is complete and valid
        if (isFinancialDataComplete(invoice)) {
            console.log('Financial data is complete, populating financial summary...');
            populateFinancialSummary(invoice);
        } else {
            console.log('Financial data is incomplete, skipping financial summary population...');
        }
        
        // Bank account information from API data
        populateBankInformation(invoice);
        
        // Signature information - populate from API data
        populateSignatureInformation(invoice);
        
        // QR Code information - populate from API data
        populateQRCode(invoice);
        
        console.log('Invoice data population completed successfully');
    } catch (error) {
        console.error('Error in populateInvoiceData:', error);
    }
}

// Function to get current invoice data for use in additional pages
function getCurrentInvoiceData() {
    // Try to get data from localStorage first
    const urlParams = new URLSearchParams(window.location.search);
    const stagingID = urlParams.get('stagingID');
    const docEntry = urlParams.get('docEntry');
    
    console.log('Getting current invoice data for:', { stagingID, docEntry });
    
    if (stagingID) {
        const storedData = localStorage.getItem(`invoice_${stagingID}`);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            console.log('Found invoice data in localStorage:', parsedData);
            return parsedData;
        }
    }
    
    if (docEntry) {
        const storedData = localStorage.getItem(`invoice_${docEntry}`);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            console.log('Found invoice data in localStorage:', parsedData);
            return parsedData;
        }
    }
    
    // Try sessionStorage as fallback
    if (stagingID) {
        const sessionData = sessionStorage.getItem(`invoice_${stagingID}`);
        if (sessionData) {
            const parsedData = JSON.parse(sessionData);
            console.log('Found invoice data in sessionStorage:', parsedData);
            return parsedData;
        }
    }
    
    if (docEntry) {
        const sessionData = sessionStorage.getItem(`invoice_${docEntry}`);
        if (sessionData) {
            const parsedData = JSON.parse(sessionData);
            console.log('Found invoice data in sessionStorage:', parsedData);
            return parsedData;
        }
    }
    
    console.log('No invoice data found in storage');
    return null;
}

// Function to populate bank information from API data
// Only displays acctName and account fields directly
function populateBankInformation(invoice) {
    console.log('Populating bank information from invoice:', invoice);
    
    // Get bank information directly from acctName and account fields only
    let bankInformation = '';
    
    if (invoice.acctName) {
        console.log('Using acctName from API:', invoice.acctName);
        // Use wrapText if acctName exceeds 40 characters
        if (invoice.acctName.length > 40) {
            bankInformation = wrapText(invoice.acctName, 40);
        } else {
            bankInformation = invoice.acctName;
        }
        
        // Add account number if available (on new line)
        if (invoice.account) {
            bankInformation += `<br>${invoice.account}`;
        }
    } else {
        console.log('No acctName found in API data');
        // If no acctName, just show account number if available
        if (invoice.account) {
            bankInformation = invoice.account;
        }
    }
    
    // Populate the DOM element
    const bankInformationElement = document.getElementById('bankInformation');
    
    if (bankInformationElement) {
        bankInformationElement.innerHTML = bankInformation;
        console.log('Bank information populated from acctName and account:', bankInformation);
    } else {
        console.error('Bank information element not found');
    }
}

// Function to populate bank information for additional pages
// Only displays acctName and account fields directly
function populateBankInformationForPage(invoice, pageNum) {
    console.log(`Populating bank information for page ${pageNum}:`, invoice);
    
    // Get bank information directly from acctName and account fields only
    let bankInformation = '';
    
    if (invoice?.acctName) {
        console.log(`Using acctName for page ${pageNum}:`, invoice.acctName);
        // Use wrapText if acctName exceeds 40 characters
        if (invoice.acctName.length > 40) {
            bankInformation = wrapText(invoice.acctName, 40);
        } else {
            bankInformation = invoice.acctName;
        }
        
        // Add account number if available (on new line)
        if (invoice.account) {
            bankInformation += `<br>${invoice.account}`;
        }
    } else {
        console.log(`No acctName found for page ${pageNum}`);
        // If no acctName, just show account number if available
        if (invoice.account) {
            bankInformation = invoice.account;
        }
    }
    
    // Populate the DOM element for the specific page
    const bankInformationElement = document.getElementById(`bankInformation${pageNum}`);
    
    if (bankInformationElement) {
        bankInformationElement.innerHTML = bankInformation;
        console.log(`Bank information populated for page ${pageNum} from acctName and account:`, bankInformation);
    } else {
        console.error(`Bank information element not found for page ${pageNum}`);
    }
}

// Function to populate financial summary from API data
function populateFinancialSummary(invoice) {
    console.log('Populating financial summary from invoice:', invoice);
    
    // Check if invoice data is available
    if (!invoice) {
        console.log('No invoice data available for financial summary');
        return;
    }
    
    // Get currency from API - use docCur field from API
    const currency = invoice.docCur || 'IDR';
    console.log('Currency from API docCur field:', currency);
    
    // Financial summary field mapping based on API response
    const financialData = {
        // 1. Total (totalAmount) - API Field: "docCur" "netPrice"
        totalAmount: {
            value: invoice.netPrice || 0,
            currency: currency,
            label: 'Total'
        },
        // 2. Discounted (discountAmount) - API Field: "docCur" "discSum"
        discountAmount: {
            value: invoice.discSum || 0,
            currency: currency,
            label: 'Discounted'
        },
        // 3. Sales Amount (salesAmount) - API Field: "docCur" "netPriceAfterDiscount"
        salesAmount: {
            value: invoice.netPriceAfterDiscount || 0,
            currency: currency,
            label: 'Sales Amount'
        },
        // 4. Tax Base Other Value (taxBase) - API Field: "docCur" "docTax"
        taxBase: {
            value: invoice.docTax || 0,
            currency: currency,
            label: 'Tax Base Other Value'
        },
        // 5. VAT 12% (vatAmount) - API Field: "docCur" "vatSum"
        vatAmount: {
            value: invoice.vatSum || 0,
            currency: currency,
            label: 'VAT 12%'
        },
        // 6. GRAND TOTAL (grandTotal) - API Field: "docCur" "grandTotal"
        grandTotal: {
            value: invoice.grandTotal || 0,
            currency: currency,
            label: 'GRAND TOTAL'
        }
    };
    
    // Populate the DOM elements
    Object.keys(financialData).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            const data = financialData[key];
            element.textContent = formatCurrencyWithCurrency(data.value, data.currency);
            console.log(`${data.label}: ${formatCurrencyWithCurrency(data.value, data.currency)}`);
        } else {
            console.warn(`Financial summary element not found: ${key}`);
        }
    });
    
    console.log('Financial summary populated with currency from docCur:', currency);
    console.log('Financial summary populated:', financialData);
}

// Function to populate signature information from API data
function populateSignatureInformation(invoice) {
    console.log('Populating signature information from invoice:', invoice);
    console.log('Invoice approval summary:', invoice.arInvoiceApprovalSummary);
    console.log('Direct approvedByName:', invoice.approvedByName);
    console.log('Direct preparedByName:', invoice.u_BSI_Expressiv_PreparedByName);
    
    let approvedByName = '';
    let approvedPosition = '';
    
    // Get signature data ONLY from approval summary's approvedByName field
    if (invoice.arInvoiceApprovalSummary && invoice.arInvoiceApprovalSummary.approvedByName) {
        approvedByName = invoice.arInvoiceApprovalSummary.approvedByName;
        approvedPosition = invoice.arInvoiceApprovalSummary.approvedPosition || '';
    }
    
    console.log('Final signature data:', { 
        approvedByName, 
        approvedPosition,
        approvalSummary: invoice.arInvoiceApprovalSummary,
        directApprovedByName: invoice.approvedByName,
        preparedByName: invoice.u_BSI_Expressiv_PreparedByName 
    });
    
    console.log('Approval summary details:', {
        approvedByName: invoice.arInvoiceApprovalSummary?.approvedByName,
        receivedByName: invoice.arInvoiceApprovalSummary?.receivedByName,
        preparedByName: invoice.arInvoiceApprovalSummary?.preparedByName,
        approvedPosition: invoice.arInvoiceApprovalSummary?.approvedPosition,
        receivedPosition: invoice.arInvoiceApprovalSummary?.receivedPosition,
        preparedPosition: invoice.arInvoiceApprovalSummary?.preparedPosition
    });
    
    // Store the signature data for use in additional pages
    window.signatureData = {
        name: approvedByName,
        position: approvedPosition
    };
    
    // Populate the DOM elements
    const signatureNameElement = document.getElementById('signatureName');
    const signatureTitleElement = document.getElementById('signatureTitle');
    
    console.log('Looking for signature elements...');
    console.log('signatureNameElement found:', !!signatureNameElement);
    console.log('signatureTitleElement found:', !!signatureTitleElement);
    
    if (signatureNameElement) {
        signatureNameElement.textContent = approvedByName;
        console.log('Setting signature name to:', approvedByName);
        console.log('Signature name element found and updated');
        console.log('Element textContent after update:', signatureNameElement.textContent);
    } else {
        console.error('Signature name element not found!');
        console.log('Available elements with "signature" in id:', document.querySelectorAll('[id*="signature"]'));
    }
    
    if (signatureTitleElement) {
        signatureTitleElement.textContent = approvedPosition;
        console.log('Setting signature title to:', approvedPosition);
        console.log('Signature title element found and updated');
        console.log('Element textContent after update:', signatureTitleElement.textContent);
    } else {
        console.error('Signature title element not found!');
    }

}









// Function to get signature data from invoice (for additional pages)
function getSignatureDataFromInvoice(invoice) {
    // First check if we have signature data stored from the main page
    if (window.signatureData) {
        console.log('Using stored signature data:', window.signatureData);
        return window.signatureData;
    }
    
    if (!invoice) {
        return { name: '', position: '' };
    }
    
    console.log('Getting signature data from invoice for additional page:', invoice);
    
    let approvedByName = '';
    let approvedPosition = '';
    
    // Get signature data from multiple possible sources - same logic as populateSignatureInformation
    if (invoice.arInvoiceApprovalSummary && invoice.arInvoiceApprovalSummary.approvedByName) {
        console.log('Using approvedByName from approval summary for additional page:', invoice.arInvoiceApprovalSummary.approvedByName);
        approvedByName = invoice.arInvoiceApprovalSummary.approvedByName;
        approvedPosition = invoice.arInvoiceApprovalSummary.approvedPosition || '';
    } else if (invoice.approvedByName) {
        console.log('Using direct approvedByName for additional page:', invoice.approvedByName);
        approvedByName = invoice.approvedByName;
        approvedPosition = invoice.approvedPosition || '';
    } else if (invoice.receivedByName) {
        console.log('Using receivedByName as fallback for additional page:', invoice.receivedByName);
        approvedByName = invoice.receivedByName;
        approvedPosition = 'Receiver';
    } else {
        // No default values - return empty if no data is available
        approvedByName = '';
        approvedPosition = '';
        console.log('No signature data available for additional page');
    }
    
    const result = {
        name: approvedByName,
        position: approvedPosition
    };
    
    console.log('Final signature data for additional page:', result);
    return result;
}

// Function to populate QR Code from API data
function populateQRCode(invoice) {
    console.log('Populating QR Code from invoice:', invoice);
    
    const qrCodeElement = document.querySelector('.qr-code');
    if (!qrCodeElement) {
        console.log('QR Code element not found');
        return;
    }
    
    // Check if qrCodeSrc is available and not null/empty from API
    if (invoice.qrCodeSrc && invoice.qrCodeSrc !== null && invoice.qrCodeSrc.trim() !== '') {
        console.log('QR Code source found:', invoice.qrCodeSrc);
        
        // Use qrCodeSrc data directly with API
        generateQRCodeFromSrc(invoice.qrCodeSrc, qrCodeElement);
    } else {
        // Hide QR code element if qrCodeSrc is null/empty
        console.log('QR Code source is null/empty, hiding QR code element');
        qrCodeElement.style.display = 'none';
    }
}

// Function to generate QR code from qrCodeSrc data
function generateQRCodeFromSrc(qrCodeSrc, qrCodeElement) {
    try {
        console.log('Generating QR code from qrCodeSrc:', qrCodeSrc);
        
        // Use external QR code API with qrCodeSrc data
        const apiUrl = 'https://api.qrserver.com/v1/create-qr-code/';
        const params = new URLSearchParams({
            size: '200x200',
            data: qrCodeSrc,
            format: 'png',
            margin: '2',
            error_correction: 'M'
        });
        
        const fullUrl = apiUrl + '?' + params.toString();
        console.log('QR Code API URL with qrCodeSrc:', fullUrl);
        
        // Create image element
        const qrImage = document.createElement('img');
        qrImage.src = fullUrl;
        qrImage.alt = 'QR Code';
        qrImage.style.width = '200px';
        qrImage.style.height = '200px';
        qrImage.style.objectFit = 'contain';
        
        // Clear existing content and add image
        qrCodeElement.innerHTML = '';
        qrCodeElement.appendChild(qrImage);
        
        // Show QR code element
        qrCodeElement.style.display = 'flex';
        
        // Add click event to show QR code data
        qrCodeElement.style.cursor = 'pointer';
        qrCodeElement.title = 'Click to view QR code data';
        qrCodeElement.onclick = function() {
            showQRCodeData({ qrCodeSrc: qrCodeSrc }, 'QR Code from API');
        };
        
        // Handle image load error
        qrImage.onerror = function() {
            console.error('Error loading QR code image from qrCodeSrc');
            qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
            qrCodeElement.style.display = 'flex';
        };
        
        // Handle image load success
        qrImage.onload = function() {
            console.log('QR Code generated successfully from qrCodeSrc');
        };
        
    } catch (error) {
        console.error('Error generating QR code from qrCodeSrc:', error);
        // Fallback to text display
        qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
        qrCodeElement.style.display = 'flex';
    }
}

// Function to generate QR code from invoice data
function generateQRCodeFromInvoiceData(invoice, qrCodeElement) {
    try {
        // Use Indonesian invoice format for QR code
        const qrCodeData = generateIndonesianInvoiceQRCode(invoice);
        
        if (!qrCodeData) {
            throw new Error('Failed to generate QR code data');
        }
        
        console.log('QR Code data object:', qrCodeData);
        
        // Convert to JSON string for QR code
        const qrCodeString = JSON.stringify(qrCodeData);
        console.log('QR Code string:', qrCodeString);
        
        // Generate QR code using external API
        generateQRCodeWithAPI(qrCodeString, qrCodeElement, qrCodeData);
        
    } catch (error) {
        console.error('Error in generateQRCodeFromInvoiceData:', error);
        // Fallback to text display
        qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
        qrCodeElement.style.display = 'flex';
    }
}

// Function to generate QR code using external API
function generateQRCodeWithAPI(qrCodeString, qrCodeElement, qrCodeData) {
    try {
        // Check if data is too long for API
        if (qrCodeString.length > 2000) {
            console.warn(`QR Code data too long (${qrCodeString.length} chars), using simplified data`);
            // Use simplified data
            const simplifiedData = createSimplifiedQRData(qrCodeData, false);
            qrCodeString = JSON.stringify(simplifiedData);
        }
        
        // Use external QR code API
        const apiUrl = 'https://api.qrserver.com/v1/create-qr-code/';
        const params = new URLSearchParams({
            size: '200x200',
            data: qrCodeString,
            format: 'png',
            margin: '2',
            error_correction: 'M'
        });
        
        const fullUrl = apiUrl + '?' + params.toString();
        console.log('QR Code API URL:', fullUrl);
        
        // Check URL length
        if (fullUrl.length > 2048) {
            console.error(`QR Code URL too long (${fullUrl.length} chars), using fallback`);
            throw new Error('URL too long for API');
        }
        
        // Create image element
        const qrImage = document.createElement('img');
        qrImage.src = fullUrl;
        qrImage.alt = 'QR Code';
        qrImage.style.width = '200px';
        qrImage.style.height = '200px';
        qrImage.style.objectFit = 'contain';
        
        // Clear existing content and add image
        qrCodeElement.innerHTML = '';
        qrCodeElement.appendChild(qrImage);
        
        // Show QR code element
        qrCodeElement.style.display = 'flex';
        
        // Add click event to show QR code data
        qrCodeElement.style.cursor = 'pointer';
        qrCodeElement.title = 'Click to view QR code data';
        qrCodeElement.onclick = function() {
            showQRCodeData(qrCodeData);
        };
        
        // Handle image load error
        qrImage.onerror = function() {
            console.error('Error loading QR code image from API');
            // Try with even more simplified data
            try {
                const minimalData = createSimplifiedQRData(qrCodeData, false);
                const minimalUrl = apiUrl + '?' + new URLSearchParams({
                    size: '200x200',
                    data: JSON.stringify(minimalData),
                    format: 'png',
                    margin: '2',
                    error_correction: 'M'
                }).toString();
                
                qrImage.src = minimalUrl;
                qrImage.onerror = function() {
                    qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
                    qrCodeElement.style.display = 'flex';
                };
            } catch (fallbackError) {
                qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
                qrCodeElement.style.display = 'flex';
            }
        };
        
        // Handle image load success
        qrImage.onload = function() {
            console.log('QR Code generated successfully using API');
        };
        
    } catch (error) {
        console.error('Error generating QR code with API:', error);
        // Fallback to text display
        qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
        qrCodeElement.style.display = 'flex';
    }
}

// Function to extract bank name from account name
function extractBankName(acctName) {
    if (!acctName) return '';
    
    const lines = acctName.split(',').map(line => line.trim());
    return lines[0] || '';
}

// Function to show QR code data in a modal
function showQRCodeData(qrCodeData) {
    // Format the data for better display
    const formattedData = formatQRCodeDataForDisplay(qrCodeData);
    
    Swal.fire({
        title: 'QR Code Data - Invoice Information',
        html: formattedData,
        width: '700px',
        confirmButtonText: 'Close',
        showCloseButton: true,
        customClass: {
            popup: 'qr-code-modal'
        }
    });
}

// Function to format QR code data for display
function formatQRCodeDataForDisplay(qrCodeData) {
    let html = '<div style="text-align: left; font-size: 11px; max-height: 400px; overflow-y: auto;">';
    
    // Invoice Information
    html += '<div style="margin-bottom: 15px;">';
    html += '<h3 style="color: #1e40af; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">📄 Invoice Information</h3>';
    html += '<div><strong>Invoice Number:</strong> ' + (qrCodeData.invoiceNumber || 'N/A') + '</div>';
    html += '<div><strong>Vision Invoice:</strong> ' + (qrCodeData.visionInvoiceNumber || 'N/A') + '</div>';
    html += '<div><strong>Invoice Date:</strong> ' + (qrCodeData.invoiceDate || 'N/A') + '</div>';
    html += '<div><strong>Due Date:</strong> ' + (qrCodeData.dueDate || 'N/A') + '</div>';
    html += '</div>';
    
    // Customer Information
    html += '<div style="margin-bottom: 15px;">';
    html += '<h3 style="color: #059669; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">👤 Customer Information</h3>';
    html += '<div><strong>Customer Name:</strong> ' + (qrCodeData.customerName || 'N/A') + '</div>';
    html += '<div><strong>NPWP:</strong> ' + (qrCodeData.customerNPWP || 'N/A') + '</div>';
    if (qrCodeData.customerAddress) {
        html += '<div><strong>Address:</strong> ' + qrCodeData.customerAddress + '</div>';
    }
    html += '</div>';
    
    // Financial Information
    html += '<div style="margin-bottom: 15px;">';
    html += '<h3 style="color: #dc2626; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">💰 Financial Information</h3>';
    html += '<div><strong>Subtotal:</strong> ' + formatCurrencyWithCurrency(qrCodeData.subtotal || 0, qrCodeData.currency || 'IDR') + '</div>';
    html += '<div><strong>Discount:</strong> ' + formatCurrencyWithCurrency(qrCodeData.discount || 0, qrCodeData.currency || 'IDR') + '</div>';
    html += '<div><strong>Tax Base:</strong> ' + formatCurrencyWithCurrency(qrCodeData.taxBase || 0, qrCodeData.currency || 'IDR') + '</div>';
    html += '<div><strong>VAT Amount:</strong> ' + formatCurrencyWithCurrency(qrCodeData.vatAmount || 0, qrCodeData.currency || 'IDR') + '</div>';
    html += '<div><strong>Grand Total:</strong> ' + formatCurrencyWithCurrency(qrCodeData.grandTotal || 0, qrCodeData.currency || 'IDR') + '</div>';
    html += '</div>';
    
    // Bank Information
    html += '<div style="margin-bottom: 15px;">';
    html += '<h3 style="color: #7c3aed; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">🏦 Bank Information</h3>';
    html += '<div><strong>Bank Name:</strong> ' + (qrCodeData.bankName || 'N/A') + '</div>';
    html += '<div><strong>Account Number:</strong> ' + (qrCodeData.accountNumber || 'N/A') + '</div>';
    html += '<div><strong>Account Name:</strong> ' + (qrCodeData.accountName || 'N/A') + '</div>';
    html += '</div>';
    
    // Company Information
    html += '<div style="margin-bottom: 15px;">';
    html += '<h3 style="color: #ea580c; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">🏢 Company Information</h3>';
    html += '<div><strong>Company Name:</strong> ' + (qrCodeData.companyName || 'N/A') + '</div>';
    html += '<div><strong>Address:</strong> ' + (qrCodeData.companyAddress || 'N/A') + '</div>';
    if (qrCodeData.companyPhone) {
        html += '<div><strong>Phone:</strong> ' + qrCodeData.companyPhone + '</div>';
    }
    if (qrCodeData.companyFax) {
        html += '<div><strong>Fax:</strong> ' + qrCodeData.companyFax + '</div>';
    }
    html += '</div>';
    
    // Approval Information
    if (qrCodeData.approvedByName) {
        html += '<div style="margin-bottom: 15px;">';
        html += '<h3 style="color: #059669; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">✍️ Approval Information</h3>';
        html += '<div><strong>Approved By:</strong> ' + qrCodeData.approvedByName + '</div>';
        if (qrCodeData.approvedByPosition) {
            html += '<div><strong>Position:</strong> ' + qrCodeData.approvedByPosition + '</div>';
        }
        html += '</div>';
    }
    
    // Page Information (for multi-page documents)
    if (qrCodeData.pageNumber) {
        html += '<div style="margin-bottom: 15px;">';
        html += '<h3 style="color: #6b7280; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">📄 Page Information</h3>';
        html += '<div><strong>Page:</strong> ' + qrCodeData.pageNumber + ' of ' + (qrCodeData.totalPages || 'N/A') + '</div>';
        html += '</div>';
    }
    
    // Metadata
    html += '<div style="margin-bottom: 15px;">';
    html += '<h3 style="color: #6b7280; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">🔧 Metadata</h3>';
    html += '<div><strong>Generated At:</strong> ' + new Date(qrCodeData.generatedAt).toLocaleString('id-ID') + '</div>';
    html += '<div><strong>System:</strong> ' + (qrCodeData.system || 'Expressiv') + '</div>';
    html += '<div><strong>Version:</strong> ' + (qrCodeData.version || '1.0') + '</div>';
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

// Function to populate QR Code for additional pages
function populateQRCodeForPage(invoice, pageNum) {
    console.log(`Populating QR Code for page ${pageNum}:`, invoice);
    
    const qrCodeElement = document.querySelector(`#page${pageNum} .qr-code`);
    if (!qrCodeElement) {
        console.log(`QR Code element not found for page ${pageNum}`);
        return;
    }
    
    // First check if main page has a QR code source that we can reuse
    const mainInvoice = getCurrentInvoiceData();
    if (mainInvoice?.qrCodeSrc && mainInvoice.qrCodeSrc !== null && mainInvoice.qrCodeSrc.trim() !== '') {
        console.log(`Using QR Code source from main page for page ${pageNum}:`, mainInvoice.qrCodeSrc);
        generateQRCodeFromSrcForPage(mainInvoice.qrCodeSrc, qrCodeElement, pageNum);
        return;
    }
    
    // If no QR code in main page, check this invoice
    if (invoice?.qrCodeSrc && invoice.qrCodeSrc !== null && invoice.qrCodeSrc.trim() !== '') {
        console.log(`QR Code source found for page ${pageNum}:`, invoice.qrCodeSrc);
        
        // Use qrCodeSrc data directly with API - ONLY THIS METHOD
        generateQRCodeFromSrcForPage(invoice.qrCodeSrc, qrCodeElement, pageNum);
    } else {
        // Hide QR code element if qrCodeSrc is null/empty
        console.log(`QR Code source is null/empty for page ${pageNum}, hiding QR code element`);
        qrCodeElement.style.display = 'none';
    }
}

// Function to generate QR code from qrCodeSrc data for additional pages
function generateQRCodeFromSrcForPage(qrCodeSrc, qrCodeElement, pageNum) {
    try {
        console.log(`Generating QR code from qrCodeSrc for page ${pageNum}:`, qrCodeSrc);
        
        // Use external QR code API with qrCodeSrc data
        const apiUrl = 'https://api.qrserver.com/v1/create-qr-code/';
        const params = new URLSearchParams({
            size: '200x200',
            data: qrCodeSrc,
            format: 'png',
            margin: '2',
            error_correction: 'M'
        });
        
        const fullUrl = apiUrl + '?' + params.toString();
        console.log(`QR Code API URL with qrCodeSrc for page ${pageNum}:`, fullUrl);
        
        // Create image element
        const qrImage = document.createElement('img');
        qrImage.src = fullUrl;
        qrImage.alt = 'QR Code';
        qrImage.style.width = '200px';
        qrImage.style.height = '200px';
        qrImage.style.objectFit = 'contain';
        
        // Clear existing content and add image
        qrCodeElement.innerHTML = '';
        qrCodeElement.appendChild(qrImage);
        
        // Show QR code element
        qrCodeElement.style.display = 'flex';
        
        // Add click event to show QR code data
        qrCodeElement.style.cursor = 'pointer';
        qrCodeElement.title = 'Click to view QR code data';
        qrCodeElement.onclick = function() {
            showQRCodeData({ qrCodeSrc: qrCodeSrc }, 'QR Code from API');
        };
        
        // Handle image load error
        qrImage.onerror = function() {
            console.error(`Error loading QR code image from qrCodeSrc for page ${pageNum}`);
            qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
            qrCodeElement.style.display = 'flex';
        };
        
        // Handle image load success
        qrImage.onload = function() {
            console.log(`QR Code generated successfully from qrCodeSrc for page ${pageNum}`);
        };
        
    } catch (error) {
        console.error(`Error generating QR code from qrCodeSrc for page ${pageNum}:`, error);
        // Fallback to text display
        qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
        qrCodeElement.style.display = 'flex';
    }
}

// Function to generate QR code from invoice data for additional pages
function generateQRCodeFromInvoiceDataForPage(invoice, qrCodeElement, pageNum) {
    try {
        // For additional pages, we should use the same qrCodeSrc as the main page
        // Only generate new data if qrCodeSrc is not available
        if (invoice?.qrCodeSrc && invoice.qrCodeSrc !== null && invoice.qrCodeSrc.trim() !== '') {
            console.log(`Using existing qrCodeSrc for page ${pageNum}:`, invoice.qrCodeSrc);
            generateQRCodeFromSrcForPage(invoice.qrCodeSrc, qrCodeElement, pageNum);
            return;
        }
        
        // Use Indonesian invoice format for QR code with page information
        const qrCodeData = generateIndonesianInvoiceQRCode(invoice);
        
        if (!qrCodeData) {
            throw new Error('Failed to generate QR code data');
        }
        
        // Add page information to the QR code data
        qrCodeData.pageNumber = pageNum;
        qrCodeData.totalPages = window.totalPages || getTotalPages();
        
        console.log(`QR Code data object for page ${pageNum}:`, qrCodeData);
        
        // Convert to JSON string for QR code
        const qrCodeString = JSON.stringify(qrCodeData);
        console.log(`QR Code string for page ${pageNum}:`, qrCodeString);
        
        // Generate QR code using external API
        generateQRCodeWithAPIForPage(qrCodeString, qrCodeElement, qrCodeData, pageNum);
        
    } catch (error) {
        console.error(`Error in generateQRCodeFromInvoiceDataForPage for page ${pageNum}:`, error);
        // Fallback to text display
        qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
        qrCodeElement.style.display = 'flex';
    }
}

// Function to generate QR code using external API for additional pages
function generateQRCodeWithAPIForPage(qrCodeString, qrCodeElement, qrCodeData, pageNum) {
    try {
        // Check if data is too long for API
        if (qrCodeString.length > 2000) {
            console.warn(`QR Code data too long (${qrCodeString.length} chars), using simplified data for page ${pageNum}`);
            // Use simplified data
            const simplifiedData = createSimplifiedQRData(qrCodeData, true);
            qrCodeString = JSON.stringify(simplifiedData);
        }
        
        // Use external QR code API
        const apiUrl = 'https://api.qrserver.com/v1/create-qr-code/';
        const params = new URLSearchParams({
            size: '200x200',
            data: qrCodeString,
            format: 'png',
            margin: '2',
            error_correction: 'M'
        });
        
        const fullUrl = apiUrl + '?' + params.toString();
        console.log(`QR Code API URL for page ${pageNum}:`, fullUrl);
        
        // Check URL length
        if (fullUrl.length > 2048) {
            console.error(`QR Code URL too long (${fullUrl.length} chars) for page ${pageNum}, using fallback`);
            throw new Error('URL too long for API');
        }
        
        // Create image element
        const qrImage = document.createElement('img');
        qrImage.src = fullUrl;
        qrImage.alt = 'QR Code';
        qrImage.style.width = '200px';
        qrImage.style.height = '200px';
        qrImage.style.objectFit = 'contain';
        
        // Clear existing content and add image
        qrCodeElement.innerHTML = '';
        qrCodeElement.appendChild(qrImage);
        
        // Show QR code element
        qrCodeElement.style.display = 'flex';
        
        // Add click event to show QR code data
        qrCodeElement.style.cursor = 'pointer';
        qrCodeElement.title = 'Click to view QR code data';
        qrCodeElement.onclick = function() {
            showQRCodeData(qrCodeData);
        };
        
        // Handle image load error
        qrImage.onerror = function() {
            console.error(`Error loading QR code image from API for page ${pageNum}`);
            // Try with even more simplified data
            try {
                const minimalData = createSimplifiedQRData(qrCodeData, true);
                const minimalUrl = apiUrl + '?' + new URLSearchParams({
                    size: '200x200',
                    data: JSON.stringify(minimalData),
                    format: 'png',
                    margin: '2',
                    error_correction: 'M'
                }).toString();
                
                qrImage.src = minimalUrl;
                qrImage.onerror = function() {
                    qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
                    qrCodeElement.style.display = 'flex';
                };
            } catch (fallbackError) {
                qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
                qrCodeElement.style.display = 'flex';
            }
        };
        
        // Handle image load success
        qrImage.onload = function() {
            console.log(`QR Code generated successfully using API for page ${pageNum}`);
        };
        
    } catch (error) {
        console.error(`Error generating QR code with API for page ${pageNum}:`, error);
        // Fallback to text display
        qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
        qrCodeElement.style.display = 'flex';
    }
}

// Function to format currency with currency code
function formatCurrencyWithCurrency(amount, currency) {
    if (amount === null || amount === undefined) return '0';
    
    const formattedAmount = new Intl.NumberFormat('en-US').format(amount);
    return `${currency} ${formattedAmount}`;
}

// Function to convert items from new API structure to print page structure
function convertItemsForPrint(items) {
    return items.map((item, index) => ({
        codeNo: item.itemCode || '',
        description: item.dscription || '', // Note: this is the correct field name from API
        quantity: item.invQty || item.quantity || 0, // Use invQty (invoice quantity) for print
        unit: item.unitMsr || '',
        unitPrice: item.u_bsi_salprice || item.priceBefDi || 0,
        amount: item.lineTotal || item.amountDit || 0
    }));
}

// Function to populate items table with pagination
function populateItemsTable(items) {
    console.log('Populating items table with items:', items);
    console.log('Number of items:', items.length);
    
    const ITEMS_PER_PAGE = 16;
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    console.log('Total pages needed:', totalPages);
    
    // Clear existing pages except the first one
    const pagesContainer = document.getElementById('pagesContainer');
    const firstPage = document.getElementById('page1');
    
    if (!pagesContainer) {
        console.error('Pages container not found!');
        return;
    }
    
    if (!firstPage) {
        console.error('First page not found!');
        return;
    }
    
    // Remove additional pages if they exist
    const existingPages = pagesContainer.querySelectorAll('.page-container:not(#page1)');
    console.log('Removing existing pages:', existingPages.length);
    existingPages.forEach(page => page.remove());
    
    // Hide footer and payment summary on first page if there are multiple pages
    const footer = document.getElementById('footer');
    const paymentSummary = document.getElementById('paymentSummary');
    
    if (totalPages > 1) {
        if (footer) footer.style.display = 'none';
        if (paymentSummary) {
            paymentSummary.style.display = 'none';
        }
    } else {
        if (footer) footer.style.display = 'flex';
        if (paymentSummary) {
            paymentSummary.style.display = 'flex';
        }
    }
    
    // Populate first page
    console.log('Populating first page with items:', items.slice(0, ITEMS_PER_PAGE));
    populatePageItems(items.slice(0, ITEMS_PER_PAGE), 1, 0);
    
    // Create additional pages if needed
    for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
        const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
        const pageItems = items.slice(startIndex, endIndex);
        
        console.log(`Creating page ${pageNum} with items:`, pageItems);
        createAdditionalPage(pageItems, pageNum, startIndex, pageNum === totalPages);
    }
    
    // Update page info
    const pageInfoElement = document.getElementById('pageInfo');
    if (pageInfoElement) {
        pageInfoElement.textContent = `Page 1 of ${totalPages}`;
        console.log('Updated page info:', pageInfoElement.textContent);
    } else {
        console.error('Page info element not found!');
    }
    
    // Store total pages for use in additional pages
    window.totalPages = totalPages;
    
    // If multiple pages, ensure payment summary is hidden on first page
    if (totalPages > 1) {
        const paymentSummary = document.getElementById('paymentSummary');
        if (paymentSummary) {
            paymentSummary.style.display = 'none';
        }
    } else {
        // If single page, ensure payment summary is visible
        const paymentSummary = document.getElementById('paymentSummary');
        if (paymentSummary) {
            paymentSummary.style.display = 'flex';
        }
    }
    
    // Update page info for all pages
    updatePageInfoForAllPages(totalPages);
    
    console.log('Items table population completed');
}

// Function to update page info for all pages
function updatePageInfoForAllPages(totalPages) {
    console.log('Updating page info for all pages. Total pages:', totalPages);
    
    // Update first page
    const firstPageInfo = document.getElementById('pageInfo');
    if (firstPageInfo) {
        firstPageInfo.textContent = `Page 1 of ${totalPages}`;
        console.log('Updated first page info:', firstPageInfo.textContent);
    }
    
    // Update additional pages
    for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
        const page = document.getElementById(`page${pageNum}`);
        if (page) {
            const pageInfoElement = page.querySelector('.system-info div');
            if (pageInfoElement) {
                pageInfoElement.textContent = `Page ${pageNum} of ${totalPages}`;
                console.log(`Updated page ${pageNum} info:`, pageInfoElement.textContent);
            }
        }
    }
}

// Function to populate items for a specific page
function populatePageItems(items, pageNum, startIndex) {
    console.log(`Populating page ${pageNum} items:`, items);
    console.log(`Start index: ${startIndex}`);
    
    const tbody = document.getElementById('itemsTableBody');
    if (!tbody) {
        console.error('Items table body not found!');
        return;
    }
    
    tbody.innerHTML = '';
    console.log('Cleared table body');
    
    items.forEach((item, index) => {
        console.log(`Adding item ${index + 1}:`, item);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="number-col">${startIndex + index + 1}</td>
            <td class="code-col">${item.codeNo || ''}</td>
            <td class="description-col">${item.description || ''}</td>
            <td class="quantity-col">${formatNumber(item.quantity)}</td>
            <td class="unit-col">${item.unit || ''}</td>
            <td class="price-col">${formatCurrency(item.unitPrice)}</td>
            <td class="amount-col">${formatCurrency(item.amount)}</td>
        `;
        tbody.appendChild(row);
    });
    
    console.log(`Added ${items.length} items to page ${pageNum}`);
}

// Function to create additional pages
function createAdditionalPage(items, pageNum, startIndex, isLastPage) {
    const pagesContainer = document.getElementById('pagesContainer');
    
    const newPage = document.createElement('div');
    newPage.className = 'page-container page-break';
    newPage.id = `page${pageNum}`;
    
    // Clone the header structure
    const firstPage = document.getElementById('page1');
    const headerClone = firstPage.querySelector('.header').cloneNode(true);
    const invoiceDetailsClone = firstPage.querySelector('.invoice-details').cloneNode(true);
    const shippingInfoClone = firstPage.querySelector('.shipping-info').cloneNode(true);
    const orderNumbersClone = firstPage.querySelector('.order-numbers').cloneNode(true);
    
    // Create table structure
    const tableHTML = `
        <table class="items-table">
            <thead>
                <tr>
                    <th class="number-col">No.</th>
                    <th class="code-col">Code No.</th>
                    <th class="description-col">Description of Goods</th>
                    <th class="quantity-col">Quantity (Kg/Ltr)</th>
                    <th class="unit-col">Unit</th>
                    <th class="price-col">Unit Price</th>
                    <th class="amount-col">Amount</th>
                </tr>
            </thead>
            <tbody id="itemsTableBody${pageNum}">
            </tbody>
        </table>
    `;
    
    // Create payment summary if it's the last page
    let paymentSummaryHTML = '';
    if (isLastPage) {
        // Get the current invoice data to populate payment summary
        const currentInvoiceData = getCurrentInvoiceData();
        
        paymentSummaryHTML = `
            <div class="payment-summary">
                <div class="payment-instructions">
                    <div class="payment-title">Please remit us in full amount to :</div>
                    <div id="bankInformation${pageNum}"></div>
                </div>
                <div class="financial-summary">
                    <div class="summary-row">
                        <span class="summary-label">Total</span>
                        <span class="summary-value" id="totalAmount${pageNum}">${formatCurrencyWithCurrency(currentInvoiceData?.netPrice || 0, currentInvoiceData?.docCur || 'IDR')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Discounted</span>
                        <span class="summary-value" id="discountAmount${pageNum}">${formatCurrencyWithCurrency(currentInvoiceData?.discSum || 0, currentInvoiceData?.docCur || 'IDR')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Sales Amount</span>
                        <span class="summary-value" id="salesAmount${pageNum}">${formatCurrencyWithCurrency(currentInvoiceData?.netPriceAfterDiscount || 0, currentInvoiceData?.docCur || 'IDR')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Tax Base Other Value</span>
                        <span class="summary-value" id="taxBase${pageNum}">${formatCurrencyWithCurrency(currentInvoiceData?.docTax || 0, currentInvoiceData?.docCur || 'IDR')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">VAT 12%</span>
                        <span class="summary-value" id="vatAmount${pageNum}">${formatCurrencyWithCurrency(currentInvoiceData?.vatSum || 0, currentInvoiceData?.docCur || 'IDR')}</span>
                    </div>
                    <div class="summary-row total-line">
                        <span class="summary-label">GRAND TOTAL</span>
                        <span class="summary-value" id="grandTotal${pageNum}">${formatCurrencyWithCurrency(currentInvoiceData?.grandTotal || 0, currentInvoiceData?.docCur || 'IDR')}</span>
                    </div>
                </div>
            </div>
        `;
        
                // Populate bank information for additional pages
            setTimeout(() => {
            populateBankInformationForPage(currentInvoiceData, pageNum);
            }, 100);
        
        // Populate QR Code for additional pages
            setTimeout(() => {
            populateQRCodeForPage(currentInvoiceData, pageNum);
            }, 100);
    }
    
    // Create footer only if it's the last page
    let footerHTML = '';
    if (isLastPage) {
        // Get the current invoice data to populate signature
        const currentInvoiceData = getCurrentInvoiceData();
        const signatureData = getSignatureDataFromInvoice(currentInvoiceData);
        
        // Debug: Log what name is being set for additional page
        console.log(`Setting signature data for page ${pageNum}:`, signatureData);
        console.log(`Current invoice data for page ${pageNum}:`, currentInvoiceData);
        
        footerHTML = `
            <div class="footer">
                <div class="signature-section">
                    <img src="../../../../../image/StampKansai.png" alt="Kansai Stamp" class="signature-stamp">
                    <div class="qr-code">QR CODE</div>
                    <div class="signature-space"></div>
                    <div class="signature-name">${signatureData.name}</div>
                    <div class="signature-title">${signatureData.position}</div>
                </div>
                <div class="system-info">
                    <div>Page ${pageNum} of ${window.totalPages || getTotalPages()}</div>
                </div>
            </div>
            <div class="generated-by">
                <div>Generated by Expressiv System</div>
            </div>
        `;
    }
    
    newPage.innerHTML = `
        <div class="page-content">
            ${headerClone.outerHTML}
            ${invoiceDetailsClone.outerHTML}
            ${shippingInfoClone.outerHTML}
            ${orderNumbersClone.outerHTML}
            ${tableHTML}
            ${paymentSummaryHTML}
        </div>
        ${footerHTML}
    `;
    
    pagesContainer.appendChild(newPage);
    
    // Populate items for this page
    const tbody = newPage.querySelector(`#itemsTableBody${pageNum}`);
    items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="number-col">${startIndex + index + 1}</td>
            <td class="code-col">${item.codeNo || ''}</td>
            <td class="description-col">${item.description || ''}</td>
            <td class="quantity-col">${formatNumber(item.quantity)}</td>
            <td class="unit-col">${item.unit || ''}</td>
            <td class="price-col">${formatCurrency(item.unitPrice)}</td>
            <td class="amount-col">${formatCurrency(item.amount)}</td>
        `;
        tbody.appendChild(row);
    });
    

}

// Function to get total pages
function getTotalPages() {
    const pagesContainer = document.getElementById('pagesContainer');
    return pagesContainer.querySelectorAll('.page-container').length;
}

// Function to get signature coordinates for e-sign implementation
function getSignatureCoordinates(pageNumber = null) {
    // If no page number specified, get the last page
    if (pageNumber === null) {
        const totalPages = getTotalPages();
        pageNumber = totalPages;
    }
    
    const page = document.getElementById(`page${pageNumber}`);
    if (!page) return null;
    
    const signatureSection = page.querySelector('.signature-section');
    if (!signatureSection) return null;
    
    const rect = signatureSection.getBoundingClientRect();
    const pageRect = page.getBoundingClientRect();
    
    return {
        x: rect.left - pageRect.left,
        y: rect.top - pageRect.top,
        width: rect.width,
        height: rect.height,
        pageNumber: pageNumber,
        element: signatureSection
    };
}

// Function to get signature coordinates from the last page only
function getLastPageSignatureCoordinates() {
    const totalPages = getTotalPages();
    if (totalPages === 0) return null;
    
    return getSignatureCoordinates(totalPages);
}

// Function to get all signature coordinates for multi-page documents
function getAllSignatureCoordinates() {
    const totalPages = getTotalPages();
    const coordinates = [];
    
    // Only get coordinates from pages that have signature sections
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = document.getElementById(`page${pageNum}`);
        if (page && page.querySelector('.signature-section')) {
            const coords = getSignatureCoordinates(pageNum);
            if (coords) {
                coordinates.push(coords);
            }
        }
    }
    
    return coordinates;
}

// Function to highlight signature areas (for testing)
function highlightSignatureAreas() {
    const coordinates = getAllSignatureCoordinates();
    coordinates.forEach(coord => {
        if (coord.element) {
            coord.element.style.border = '2px solid red';
            coord.element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        }
    });
    console.log('Signature coordinates:', coordinates);
}

// Function to highlight signature area on the last page only (for testing)
function highlightLastPageSignature() {
    const coords = getLastPageSignatureCoordinates();
    if (coords && coords.element) {
        coords.element.style.border = '2px solid green';
        coords.element.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        console.log('Last page signature coordinates:', coords);
        
        // Display coordinates in alert for easy reading
        const coordInfo = `Signature Section Coordinates:\n\n` +
            `X: ${Math.round(coords.x)}px\n` +
            `Y: ${Math.round(coords.y)}px\n` +
            `Width: ${Math.round(coords.width)}px\n` +
            `Height: ${Math.round(coords.height)}px\n` +
            `Page: ${coords.pageNumber}`;
        
        alert(coordInfo);
    } else {
        console.log('No signature found on last page');
        alert('No signature section found on the last page');
    }
}

// Function to get precise signature coordinates for e-sign
function getSignatureCoordinatesForESign() {
    const coords = getLastPageSignatureCoordinates();
    if (coords) {
        const preciseCoords = {
            x: Math.round(coords.x),
            y: Math.round(coords.y),
            width: Math.round(coords.width),
            height: Math.round(coords.height),
            pageNumber: coords.pageNumber
        };
        
        // Display coordinates in alert
        const coordInfo = `📍 Signature Section Coordinates:\n\n` +
            `X: ${preciseCoords.x}px\n` +
            `Y: ${preciseCoords.y}px\n` +
            `Width: ${preciseCoords.width}px\n` +
            `Height: ${preciseCoords.height}px\n` +
            `Page: ${preciseCoords.pageNumber}\n\n` +
            `💡 For E-Sign Implementation:\n` +
            `Use these coordinates to position the signature field.`;
        
        console.log('Signature coordinates for e-sign:', preciseCoords);
        alert(coordInfo);
        
        return preciseCoords;
    } else {
        alert('❌ No signature section found on the last page');
        console.log('No signature coordinates available');
        return null;
    }
}



// Utility function to format date
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    };
    
    return date.toLocaleDateString('en-US', options);
}

// Utility function to format currency
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0';
    
    return new Intl.NumberFormat('en-US').format(amount);
}

// Utility function to format numbers
function formatNumber(number) {
    if (number === null || number === undefined) return '0.00';
    
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
}

// Function to remove blank pages
function removeBlankPages() {
    const pagesContainer = document.getElementById('pagesContainer');
    if (!pagesContainer) return;
    
    const pages = pagesContainer.querySelectorAll('.page-container');
    
    pages.forEach(page => {
        const content = page.querySelector('.page-content');
        if (content) {
            // Check if page has meaningful content
            const hasChildren = content.children.length > 0;
            const hasText = content.textContent.trim().length > 0;
            const hasVisibleElements = content.querySelector('*:not(.no-print)');
            
            // If page is empty or has no visible content, hide it
            if (!hasChildren || (!hasText && !hasVisibleElements)) {
                page.style.display = 'none';
                console.log('Hidden blank page:', page.id);
            }
        }
    });
}

// Function to optimize layout for printing
function optimizeForPrint() {
    const pagesContainer = document.getElementById('pagesContainer');
    if (!pagesContainer) return;
    
    const pages = pagesContainer.querySelectorAll('.page-container');
    
    pages.forEach((page, index) => {
        // Ensure proper page dimensions
        page.style.width = '21cm';
        page.style.minHeight = '29.7cm';
        page.style.maxHeight = '29.7cm';
        
        // Set page breaks only before additional pages, not after
        if (index > 0) {
            page.style.pageBreakBefore = 'always';
        }
        page.style.pageBreakAfter = 'auto'; // Remove page break after
        page.style.pageBreakInside = 'avoid';
        
        // Ensure content fits properly
        const content = page.querySelector('.page-content');
        if (content) {
            content.style.display = 'flex';
            content.style.flexDirection = 'column';
            content.style.height = '100%';
        }
        
        // Ensure footer stays at bottom
        const footer = page.querySelector('.footer');
        if (footer) {
            footer.style.marginTop = 'auto';
            footer.style.flexShrink = '0';
        }
    });
    
    // Remove blank pages
    removeBlankPages();
}

// Function to handle print functionality
function printInvoice() {
    // Remove blank pages first
    removeBlankPages();
    
    // Optimize layout for printing
    optimizeForPrint();
    
    // Add a small delay to ensure DOM updates are complete
    setTimeout(() => {
        window.print();
    }, 300);
}

// Function to go back to previous page
function goBack() {
    window.history.back();
}

// Add event listeners for print controls
document.addEventListener('DOMContentLoaded', function() {
    // Optimize layout for printing
    setTimeout(() => {
        optimizeForPrint();
        removeBlankPages();
    }, 500);
    
    // Auto-print option (uncomment if needed)
    // setTimeout(() => {
    //     window.print();
    // }, 1000);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            printInvoice();
        }
    });
});

// Function to generate QR code with Indonesian invoice format
function generateQRCode(data) {
    // This is a placeholder for QR code generation
    // You can integrate with a QR code library like qrcode.js
    console.log('QR Code data:', data);
}

// Function to generate QR code in Indonesian invoice format (SP2D format)
function generateIndonesianInvoiceQRCode(invoice) {
    try {
        // Format sesuai standar Indonesia untuk QR Code Invoice
        const qrCodeData = {
            // Informasi Invoice
            invoiceNumber: invoice.u_bsi_invnum || invoice.docNum || '',
            visionInvoiceNumber: invoice.visInv || invoice.u_bsi_invnum || invoice.docNum || '',
            invoiceDate: formatDateForQR(invoice.docDate),
            dueDate: formatDateForQR(invoice.docDueDate || invoice.docDate),
            
            // Informasi Customer
            customerName: invoice.cardName || '',
            customerNPWP: invoice.licTradNum || '',
            customerAddress: parseAddressForQR(invoice.address),
            
            // Informasi Keuangan - using correct API field mapping
            subtotal: invoice.netPrice || 0,  // API Field: "netPrice"
            discount: invoice.discSum || 0,   // API Field: "discSum"
            taxBase: invoice.docTax || 0,     // API Field: "docTax"
            vatAmount: invoice.vatSum || 0,   // API Field: "vatSum"
            grandTotal: invoice.grandTotal || 0,  // API Field: "grandTotal"
            currency: invoice.docCur || 'IDR',
            
            // Informasi Bank
            bankName: extractBankName(invoice.acctName),
            accountNumber: invoice.account || '',
            accountName: invoice.accountName || '',
            
            // Informasi Perusahaan - use API data only
            companyName: invoice.companyName || '',
            companyAddress: invoice.companyAddress || '',
            companyPhone: invoice.companyPhone || '',
            companyFax: invoice.companyFax || '',
            
            // Informasi Approval
            approvedByName: getSignatureDataFromInvoice(invoice).name,
            approvedByPosition: getSignatureDataFromInvoice(invoice).position,
            
            // Metadata
            generatedAt: new Date().toISOString(),
            system: 'Expressiv',
            version: '1.0'
        };
        
        return qrCodeData;
    } catch (error) {
        console.error('Error generating Indonesian invoice QR code data:', error);
        return null;
    }
}

// Function to create simplified QR code data for API limitations
function createSimplifiedQRData(qrCodeData, includePageInfo = false) {
    try {
        const simplifiedData = {
            inv: qrCodeData.invoiceNumber,
            amt: qrCodeData.grandTotal,
            cur: qrCodeData.currency,
            cust: qrCodeData.customerName?.substring(0, 50) || '',
            date: qrCodeData.invoiceDate
        };
        
        if (includePageInfo && qrCodeData.pageNumber) {
            simplifiedData.p = qrCodeData.pageNumber;
            simplifiedData.tp = qrCodeData.totalPages;
        }
        
        return simplifiedData;
    } catch (error) {
        console.error('Error creating simplified QR data:', error);
        return {
            inv: qrCodeData.invoiceNumber || 'N/A',
            amt: qrCodeData.grandTotal || 0,
            cur: qrCodeData.currency || 'IDR'
        };
    }
}

// Function to validate QR code source URL
function isValidQRCodeSource(qrCodeSrc) {
    if (!qrCodeSrc || typeof qrCodeSrc !== 'string') {
        return false;
    }
    
    try {
        const url = new URL(qrCodeSrc);
        // Only allow data URLs, HTTPS, and HTTP protocols
        return url.protocol === 'data:' || url.protocol === 'https:' || url.protocol === 'http:';
    } catch (error) {
        console.error('Invalid QR code source URL:', error);
        return false;
    }
}

// Function to safely load QR code image with fallback
function loadQRCodeImage(qrCodeSrc, qrCodeElement, fallbackFunction, pageNum = null) {
    try {
        if (!isValidQRCodeSource(qrCodeSrc)) {
            console.warn('Invalid QR code source, using fallback');
            fallbackFunction();
            return;
        }
        
        const qrImage = document.createElement('img');
        qrImage.src = qrCodeSrc;
        qrImage.alt = 'QR Code';
        qrImage.style.width = pageNum ? '100%' : '200px';
        qrImage.style.height = pageNum ? '100%' : '200px';
        qrImage.style.objectFit = 'contain';
        
        // Clear existing content and add image
        qrCodeElement.innerHTML = '';
        qrCodeElement.appendChild(qrImage);
        
        // Show QR code element
        qrCodeElement.style.display = 'flex';
        
        // Handle image load error
        qrImage.onerror = function() {
            console.error(`Error loading QR code image from source${pageNum ? ` for page ${pageNum}` : ''}`);
            fallbackFunction();
        };
        
        // Handle image load success
        qrImage.onload = function() {
            console.log(`QR Code image loaded successfully${pageNum ? ` for page ${pageNum}` : ''}`);
        };
        
    } catch (error) {
        console.error(`Error loading QR code image${pageNum ? ` for page ${pageNum}` : ''}:`, error);
        fallbackFunction();
    }
}

// Function to format date for QR code
function formatDateForQR(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    } catch (error) {
        console.error('Error formatting date for QR code:', error);
        return '';
    }
}

// Function to parse address for QR code
function parseAddressForQR(address) {
    if (!address) return '';
    
    try {
        const addressLines = address.split('\r\r');
        return addressLines.map(line => line.trim()).filter(line => line.length > 0).join(', ');
    } catch (error) {
        console.error('Error parsing address for QR code:', error);
        return address || '';
    }
}

// Function to generate QR code with custom format
function generateCustomQRCode(invoice, format = 'indonesian') {
    let qrCodeData;
    
    switch (format) {
        case 'indonesian':
            qrCodeData = generateIndonesianInvoiceQRCode(invoice);
            break;
        case 'simple':
            qrCodeData = {
                invoiceNumber: invoice.u_bsi_invnum || invoice.docNum || '',
                totalAmount: invoice.grandTotal || 0,
                currency: invoice.docCur || 'IDR',
                dueDate: formatDateForQR(invoice.docDueDate || invoice.docDate)
            };
            break;
        case 'detailed':
            qrCodeData = generateQRCodeFromInvoiceData(invoice);
            break;
        default:
            qrCodeData = generateIndonesianInvoiceQRCode(invoice);
    }
    
    return qrCodeData;
}

// Function to export as PDF (placeholder)
function exportAsPDF() {
    // This is a placeholder for PDF export functionality
    // You can integrate with libraries like jsPDF or html2pdf
    console.log('Exporting as PDF...');
}

// Function to save invoice data
function saveInvoiceData() {
    const invoiceData = {
        invoiceNumber: document.getElementById('invoiceNumber').textContent,
        visionInvoiceNumber: document.getElementById('visionInvoiceNumber').textContent,
        invoiceDate: document.getElementById('invoiceDate').textContent,
        // Add more fields as needed
    };
    
    // Save to localStorage or send to server
    localStorage.setItem('lastInvoiceData', JSON.stringify(invoiceData));
    console.log('Invoice data saved');
}

// Function to load saved invoice data
function loadSavedInvoiceData() {
    const savedData = localStorage.getItem('lastInvoiceData');
    if (savedData) {
        const data = JSON.parse(savedData);
        console.log('Loaded saved invoice data:', data);
        // Implement loading logic
    }
}

// Debug function to test data loading
function debugDataLoading() {
    console.log('=== DEBUG: Data Loading Test ===');
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const stagingID = urlParams.get('stagingID');
    const docEntry = urlParams.get('docEntry');
    
    console.log('URL Parameters:', { stagingID, docEntry });
    
    // Check if elements exist
    const elements = [
        'invoiceNumber', 'visionInvoiceNumber', 'invoiceDate', 'npwp', 'dueDate',
        'recipientName', 'recipientAddress', 'recipientCity', 'shipperName',
        'doNumbers', 'poNumbers', 'itemsTableBody', 'paymentSummary', 'footer'
    ];
    
    console.log('Checking if elements exist:');
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}: ${element ? 'FOUND' : 'NOT FOUND'}`);
    });
    
    // Check localStorage
    console.log('LocalStorage keys:', Object.keys(localStorage));
    
    // Check sessionStorage
    console.log('SessionStorage keys:', Object.keys(sessionStorage));
    
    console.log('=== END DEBUG ===');
}

// Make debug function available globally
window.debugDataLoading = debugDataLoading; 

// Function to check if financial data is complete and valid
function isFinancialDataComplete(invoice) {
    if (!invoice) {
        console.log('No invoice data provided for financial completeness check');
        return false;
    }
    
    // Check if all required financial fields are present and have valid values
    const requiredFields = ['netPrice', 'discSum', 'docTax', 'vatSum', 'grandTotal'];
    const hasAllFields = requiredFields.every(field => {
        const value = invoice[field];
        const isValid = value !== null && value !== undefined && value !== '';
        if (!isValid) {
            console.log(`Field ${field} is missing or invalid:`, value);
        }
        return isValid;
    });
    
    // Additional check: ensure at least one field has a non-zero value
    const hasNonZeroValue = requiredFields.some(field => {
        const value = invoice[field];
        const numericValue = parseFloat(value) || 0;
        const hasValue = numericValue > 0;
        if (hasValue) {
            console.log(`Field ${field} has non-zero value:`, numericValue);
        }
        return hasValue;
    });
    
    console.log('Financial data completeness check:', {
        hasAllFields,
        hasNonZeroValue,
        netPrice: invoice.netPrice,
        discSum: invoice.discSum,
        docTax: invoice.docTax,
        vatSum: invoice.vatSum,
        grandTotal: invoice.grandTotal
    });
    
    const isComplete = hasAllFields && hasNonZeroValue;
    console.log(`Financial data is ${isComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
    
    return isComplete;
}