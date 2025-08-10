// AR Invoice Print Page JavaScript (Approve)

// API Configuration
const API_BASE_URL = 'https://expressiv-be-sb.idsdev.site/api';

document.addEventListener('DOMContentLoaded', function() {
    // Get invoice data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const stagingID = urlParams.get('stagingID');
    const docEntry = urlParams.get('docEntry');
    const identifier = stagingID || docEntry;
    
    // Try to immediately populate signature data from localStorage if available
    if (identifier) {
        try {
            const storedData = localStorage.getItem(`invoice_${identifier}`);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                console.log('Found cached invoice data in localStorage, pre-populating signature...');
                populateSignatureInformation(parsedData);
            } else {
                // If no data in localStorage, try to fetch signature data directly
                console.log('No cached data found, fetching signature data directly...');
                fetch(`${API_BASE_URL}/ar-invoices/${identifier}/details`)
                    .then(response => response.json())
                    .then(result => {
                        if (result.status && result.data) {
                            console.log('Pre-populating signature from API data...');
                            populateSignatureInformation(result.data);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching signature data:', error);
                    });
            }
        } catch (error) {
            console.error('Error pre-populating signature from localStorage:', error);
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
        const response = await fetch(`${API_BASE_URL}/ar-invoices/${identifier}/details`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('API Response:', result);
            
            if (result.status && result.data) {
                populateInvoiceData(result.data);
            } else {
                console.error('API returned error:', result.message);
                showErrorMessage('Failed to load invoice data: ' + (result.message || 'Unknown error'));
            }
        } else {
            console.error('API request failed with status:', response.status);
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

// Function to load invoice data from approve page (kept for backward compatibility)
async function loadInvoiceDataFromApprovePage(identifier) {
    try {
        // Get data from localStorage or sessionStorage that was set by approveInvItem.html
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

// Function to save invoice data to storage (to be called from approveInvItem.html)
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

// Function to limit text to specified character count
function limitText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}

// Function to format multiple values with character limit
function formatMultipleValues(values, maxLength) {
    if (values.length > 1) {
        const rows = [];
        let totalLength = 0;
        
        for (let i = 0; i < values.length; i += 3) {
            const row = values.slice(i, i + 3);
            const rowText = row.join(', ');
            const isLastRow = i + 3 >= values.length;
            const separator = isLastRow ? '.' : ',';
            
            // Check if adding this row would exceed maxLength
            if (totalLength + rowText.length + separator.length > maxLength) {
                // If it would exceed, truncate and add ellipsis
                const remainingChars = maxLength - totalLength - 3; // 3 for "..."
                if (remainingChars > 0) {
                    const truncatedText = rowText.substring(0, remainingChars);
                    rows.push(`<div class="data-item">${truncatedText}...</div>`);
                }
                break;
            } else {
                rows.push(`<div class="data-item">${rowText}${separator}</div>`);
                totalLength += rowText.length + separator.length;
            }
        }
        return rows.join('');
    } else {
        return limitText(values[0], maxLength) + (values[0].length <= maxLength ? '.' : '');
    }
}

// Function to format multiple values with two items per line
function formatMultipleValuesTwoPerLine(values, prefix) {
    if (values.length === 0) {
        return `<div class="data-item">${prefix}</div>`;
    }
    
    if (values.length === 1) {
        const singleValue = values[0];
        const formattedValue = singleValue.length > 20 ? wrapText(singleValue, 20) : singleValue;
        return `<div class="data-item">${prefix}${formattedValue}.</div>`;
    }
    
    const rows = [];
    rows.push(`<div class="data-item">${prefix}</div>`);
    
    for (let i = 0; i < values.length; i += 2) {
        const row = values.slice(i, i + 2);
        const isLastRow = i + 2 >= values.length;
        
        if (row.length === 2) {
            // Two items in the row
            const separator = isLastRow ? '.' : ',';
            const item1 = row[0].length > 20 ? wrapText(row[0], 20) : row[0];
            const item2 = row[1].length > 20 ? wrapText(row[1], 20) : row[1];
            rows.push(`<div class="data-item">${item1}, ${item2}${separator}</div>`);
        } else {
            // Single item in the last row
            const singleItem = row[0].length > 20 ? wrapText(row[0], 20) : row[0];
            rows.push(`<div class="data-item">${singleItem}.</div>`);
        }
    }
    
    return rows.join('');
}

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
    
    // Invoice details - map from new API structure to print page structure
    document.getElementById('invoiceNumber').textContent = invoice.u_bsi_invnum || invoice.docNum || '';
    // Handle Vision Invoice Number
    // Requirement: hide the field if qrCodeSrc is null/empty
    const visionInvoiceElement = document.getElementById('visionInvoiceNumber');
    const visionFieldContainer = visionInvoiceElement ? visionInvoiceElement.closest('.invoice-field') : null;
    const visInvValue = invoice.visInv;
    const hasQrCodeSrc = invoice.qrCodeSrc && typeof invoice.qrCodeSrc === 'string' && invoice.qrCodeSrc.trim() !== '';

    if (!hasQrCodeSrc) {
        if (visionFieldContainer) visionFieldContainer.style.display = 'none';
    } else if (visInvValue && visInvValue.trim() !== '') {
        if (visionInvoiceElement) visionInvoiceElement.textContent = visInvValue;
        if (visionFieldContainer) visionFieldContainer.style.display = 'block';
    } else {
        if (visionFieldContainer) visionFieldContainer.style.display = 'none';
    }
    document.getElementById('invoiceDate').textContent = formatDate(invoice.docDate);
    // Handle NPWP with multiple values
    const npwpElement = document.getElementById('npwp');
    if (invoice.licTradNum) {
        const npwpValues = Array.isArray(invoice.licTradNum) ? invoice.licTradNum : [invoice.licTradNum];
        if (npwpValues.length > 1) {
            npwpElement.className = 'detail-value multiple';
            npwpElement.innerHTML = npwpValues.map(npwp => `<div class="data-item">${npwp}</div>`).join('');
        } else {
            npwpElement.className = 'detail-value';
            npwpElement.textContent = npwpValues[0];
        }
    } else {
        npwpElement.className = 'detail-value';
        npwpElement.textContent = '';
    }

    // Handle Due Date with multiple values
    const dueDateElement = document.getElementById('dueDate');
    const dueDateValue = formatDate(invoice.docDueDate || invoice.docDate);
    if (dueDateValue) {
        dueDateElement.className = 'detail-value';
        dueDateElement.textContent = dueDateValue;
    } else {
        dueDateElement.className = 'detail-value';
        dueDateElement.textContent = '';
    }
    
    // Recipient information
    document.getElementById('recipientName').textContent = invoice.cardName || '';
    
    // Parse address from the address field
    if (invoice.address) {
        const addressLines = invoice.address.split('\r\r');
        if (addressLines.length >= 1) {
            document.getElementById('recipientAddress').textContent = addressLines[0].trim();
        }
        if (addressLines.length >= 2) {
            document.getElementById('recipientCity').textContent = addressLines[1].trim();
        }
    } else {
        document.getElementById('recipientAddress').textContent = '';
        document.getElementById('recipientCity').textContent = '';
    }
    
    // Shipper information - Always use hardcoded value
    document.getElementById('shipperName').textContent = 'PT. KANSAI PAINT INDONESIA';
    

    
    // Order numbers - use specific fields for DO and PO numbers with character limits
    const doNumbersElement = document.getElementById('doNumbers');
    if (invoice.u_bsi_udf1) {
        const doValues = Array.isArray(invoice.u_bsi_udf1) ? invoice.u_bsi_udf1 : [invoice.u_bsi_udf1];
        if (doValues.length > 1) {
            doNumbersElement.className = 'field-value multiple';
            const formattedDO = formatMultipleValuesTwoPerLine(doValues, '<strong>DO No.</strong> : ');
            doNumbersElement.innerHTML = formattedDO;
        } else {
            doNumbersElement.className = 'field-value';
            doNumbersElement.innerHTML = `<strong>DO No.</strong> : ${doValues[0]}`;
        }
    } else {
        doNumbersElement.className = 'field-value';
        doNumbersElement.innerHTML = '<strong>DO No.</strong> : ';
    }
    
    // Handle P/O NO with multiple values and character limits
    const poNumbersElement = document.getElementById('poNumbers');
    if (invoice.u_bsi_udf2) {
        const poValues = Array.isArray(invoice.u_bsi_udf2) ? invoice.u_bsi_udf2 : [invoice.u_bsi_udf2];
        if (poValues.length > 1) {
            poNumbersElement.className = 'detail-value multiple';
            const formattedPO = formatMultipleValuesTwoPerLine(poValues, '');
            poNumbersElement.innerHTML = formattedPO;
        } else {
            poNumbersElement.className = 'detail-value';
            poNumbersElement.textContent = poValues[0];
        }
    } else {
        poNumbersElement.className = 'detail-value';
        poNumbersElement.textContent = '';
    }
    
    // Items table - convert from new API structure to print page structure
    const printItems = convertItemsForPrint(invoice.arInvoiceDetails || []);
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
    populateFinancialSummary(invoice);
    
    // Bank account information from API data
    populateBankInformation(invoice);
    
    // Signature information - populate from API data
    populateSignatureInformation(invoice);
    
    // QR Code information - populate from API data
    populateQRCode(invoice);
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
// Displays hardcoded bank data based on U_bankCode and account field
function populateBankInformation(invoice) {
    console.log('Populating bank information from invoice:', invoice);
    console.log('u_bankCode from API:', invoice.u_bankCode);
    console.log('U_BankCode from API:', invoice.U_BankCode);
    console.log('bankCode from API:', invoice.bankCode);
    console.log('All invoice keys for debugging:', Object.keys(invoice));
    
    // Hardcoded bank data mapping based on U_bankCode
    const bankDataMapping = {
        "MUFG": {
            "name": "MUFG Bank, Ltd., Jakarta Branch",
            "address_building": "Trinity Tower, Lt. 6-9",
            "address_street": "Jl. H. R. Rasuna Said Kav. C22 Blok IIB",
            "address_cityPos": "Jakarta 12940"
        },
        "MIZUHO": {
            "name": "Bank Mizuho Indonesia",
            "address_building": "Menara Astra, 53rd Floor",
            "address_street": "Jl. Jend. Sudirman Kav.5-6",
            "address_cityPos": "Jakarta 10220"
        },
        "CIMB NIAGA": {
            "name": "CIMB NIAGA",
            "address_building": "Gd BEFA Square Jl Kalimantan Blok CA 2-1",
            "address_street": "Kawasan Industri MM2100 Cibitung Bekasi 17530"
        }
    };
    
    let bankInformation = '';
    
    // Get bank data based on U_bankCode - check multiple possible field names
    const bankCode = invoice.u_bankCode || invoice.U_BankCode || invoice.bankCode || invoice.u_BankCode;
    console.log('Final bankCode value used:', bankCode);
    if (bankCode && bankDataMapping[bankCode]) {
        const bankData = bankDataMapping[bankCode];
        console.log('Using hardcoded bank data for:', bankCode, bankData);
        
        // Build bank information display with consistent spacing
        bankInformation = `<br>${bankData.name}`;
        if (bankData.address_building) {
            bankInformation += `<br>${bankData.address_building}`;
        }
        if (bankData.address_street) {
            bankInformation += `<br>${bankData.address_street}`;
        }
        if (bankData.address_cityPos) {
            bankInformation += `<br>${bankData.address_cityPos}`;
        }
        
        // Add account number if available (without extra spacing since it's part of hardcoded data)
        if (invoice.account) {
            bankInformation += `<br><br>${invoice.account}`;
        }
    } else {
        console.log('No matching bank code found or U_bankCode is empty:', bankCode);
        // Only show account if no bank code mapping found (with spacing)
        if (invoice.account) {
            bankInformation = `<br>${invoice.account}`;
        }
    }
    
    // Populate the DOM element
    const bankInformationElement = document.getElementById('bankInformation');
    
    if (bankInformationElement) {
        bankInformationElement.innerHTML = bankInformation;
        console.log('Bank information populated with hardcoded data and account:', bankInformation);
    } else {
        console.error('Bank information element not found');
    }
}

// Function to populate bank information for additional pages
// Displays hardcoded bank data based on U_bankCode and account field
function populateBankInformationForPage(invoice, pageNum) {
    console.log(`Populating bank information for page ${pageNum}:`, invoice);
    console.log(`u_bankCode from API for page ${pageNum}:`, invoice?.u_bankCode);
    console.log(`U_BankCode from API for page ${pageNum}:`, invoice?.U_BankCode);
    console.log(`bankCode from API for page ${pageNum}:`, invoice?.bankCode);
    
    // Hardcoded bank data mapping based on U_bankCode
    const bankDataMapping = {
        "MUFG": {
            "name": "MUFG Bank, Ltd., Jakarta Branch",
            "address_building": "Trinity Tower, Lt. 6-9",
            "address_street": "Jl. H. R. Rasuna Said Kav. C22 Blok IIB",
            "address_cityPos": "Jakarta 12940"
        },
        "MIZUHO": {
            "name": "Bank Mizuho Indonesia",
            "address_building": "Menara Astra, 53rd Floor",
            "address_street": "Jl. Jend. Sudirman Kav.5-6",
            "address_cityPos": "Jakarta 10220"
        },
        "CIMB NIAGA": {
            "name": "CIMB NIAGA",
            "address_building": "Gd BEFA Square Jl Kalimantan Blok CA 2-1",
            "address_street": "Kawasan Industri MM2100 Cibitung Bekasi 17530"
        }
    };
    
    let bankInformation = '';
    
    // Get bank data based on U_bankCode - check multiple possible field names
    const bankCode = invoice?.u_bankCode || invoice?.U_BankCode || invoice?.bankCode || invoice?.u_BankCode;
    console.log(`Final bankCode value used for page ${pageNum}:`, bankCode);
    if (bankCode && bankDataMapping[bankCode]) {
        const bankData = bankDataMapping[bankCode];
        console.log(`Using hardcoded bank data for page ${pageNum}:`, bankCode, bankData);
        
        // Build bank information display with consistent spacing
        bankInformation = bankData.name;
        if (bankData.address_building) {
            bankInformation += `<br>${bankData.address_building}`;
        }
        if (bankData.address_street) {
            bankInformation += `<br>${bankData.address_street}`;
        }
        if (bankData.address_cityPos) {
            bankInformation += `<br>${bankData.address_cityPos}`;
        }
        
        // Add account number if available (without extra spacing since it's part of hardcoded data)
        if (invoice?.account) {
            bankInformation += `<br><br>${invoice.account}`;
        }
    } else {
        console.log(`No matching bank code found or U_bankCode is empty for page ${pageNum}:`, bankCode);
        // Only show account if no bank code mapping found
        if (invoice?.account) {
            bankInformation = invoice.account;
        }
    }
    
    // Populate the DOM element for the specific page
    const bankInformationElement = document.getElementById(`bankInformation${pageNum}`);
    
    if (bankInformationElement) {
        bankInformationElement.innerHTML = bankInformation;
        console.log(`Bank information populated for page ${pageNum} with hardcoded data and account:`, bankInformation);
    } else {
        console.error(`Bank information element not found for page ${pageNum}`);
    }
}

// Function to populate financial summary from API data
function populateFinancialSummary(invoice) {
    console.log('Populating financial summary from invoice:', invoice);
    
    // Get currency from API - use docCur field from API
    const currency = invoice.docCur || '';
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
        // 4. Tax Base Other Value (taxBase) - API Field: "docCur" "dpp1112"
        taxBase: {
            value: invoice.dpp1112 || 0,
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
    
    // Handle signature image display for verified names
    displaySignatureImage(approvedByName);
}

// Function to display signature image for verified names
function displaySignatureImage(signatureName) {
    // List of verified signature names and their corresponding image files
    const verifiedSignatures = {
        'Atsuro Suzuki': 'Atsuro Suzuki.jpg',
        'Atsushi Hayashida': 'Atshushi Hayashida.jpg',
        'Hirotoshi Nishihara': 'Hirotoshi Nishihara.jpg',
        'Nyimas Widya': 'Nyimas Widya.jpg',
        'Takahiro Kimura': 'Takahiro Kimura.jpg',
        'Yuya Eguchi': 'Yuya Eguchi.jpg'
    };
    
    // Check if the signature name is in the verified list
    if (verifiedSignatures[signatureName]) {
        const signatureSpaceElement = document.querySelector('.signature-space');
        if (signatureSpaceElement) {
            // Clear the signature space
            signatureSpaceElement.innerHTML = '';
            
            // Create and add the signature image
            const signatureImage = document.createElement('img');
            signatureImage.src = `../../../../../image/${verifiedSignatures[signatureName]}`;
            signatureImage.alt = `${signatureName} Signature`;
            signatureImage.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                width: auto;
                height: auto;
                display: block;
                margin: 0 auto;
            `;
            
            // Add error handling for image loading
            signatureImage.onerror = function() {
                console.error(`Failed to load signature image for: ${signatureName}`);
                this.style.display = 'none';
            };
            
            signatureImage.onload = function() {
                console.log(`Successfully loaded signature image for: ${signatureName}`);
            };
            
            signatureSpaceElement.appendChild(signatureImage);
            console.log(`Displaying signature image for: ${signatureName}`);
        } else {
            console.error('Signature space element not found!');
        }
    } else {
        // For non-verified names, ensure the signature space is empty (just the border)
        const signatureSpaceElement = document.querySelector('.signature-space');
        if (signatureSpaceElement) {
            signatureSpaceElement.innerHTML = '';
        }
        console.log(`No signature image available for: ${signatureName}`);
    }
}

// Test function to verify signature image functionality
function testSignatureImageFunctionality() {
    console.log('Testing signature image functionality...');
    
    // Test with each verified signature name
    const testNames = [
        'Atsuro Suzuki',
        'Atsushi Hayashida', 
        'Hirotoshi Nishihara',
        'Nyimas Widya',
        'Takahiro Kimura',
        'Yuya Eguchi'
    ];
    
    testNames.forEach((name, index) => {
        setTimeout(() => {
            console.log(`Testing signature image for: ${name}`);
            displaySignatureImage(name);
        }, index * 1000); // Test each name with 1 second delay
    });
}

// Function to display signature image for specific pages (for additional pages)
function displaySignatureImageForPage(signatureName, pageNum) {
    // List of verified signature names and their corresponding image files
    const verifiedSignatures = {
        'Atsuro Suzuki': 'Atsuro Suzuki.jpg',
        'Atsushi Hayashida': 'Atshushi Hayashida.jpg',
        'Hirotoshi Nishihara': 'Hirotoshi Nishihara.jpg',
        'Nyimas Widya': 'Nyimas Widya.jpg',
        'Takahiro Kimura': 'Takahiro Kimura.jpg',
        'Yuya Eguchi': 'Yuya Eguchi.jpg'
    };
    
    // Check if the signature name is in the verified list
    if (verifiedSignatures[signatureName]) {
        const page = document.getElementById(`page${pageNum}`);
        if (page) {
            const signatureSpaceElement = page.querySelector('.signature-space');
            if (signatureSpaceElement) {
                // Clear the signature space
                signatureSpaceElement.innerHTML = '';
                
                // Create and add the signature image
                const signatureImage = document.createElement('img');
                signatureImage.src = `../../../../../image/${verifiedSignatures[signatureName]}`;
                signatureImage.alt = `${signatureName} Signature`;
                signatureImage.style.cssText = `
                    max-width: 100%;
                    max-height: 100%;
                    width: auto;
                    height: auto;
                    display: block;
                    margin: 0 auto;
                `;
                
                // Add error handling for image loading
                signatureImage.onerror = function() {
                    console.error(`Failed to load signature image for: ${signatureName} on page ${pageNum}`);
                    this.style.display = 'none';
                };
                
                signatureImage.onload = function() {
                    console.log(`Successfully loaded signature image for: ${signatureName} on page ${pageNum}`);
                };
                
                signatureSpaceElement.appendChild(signatureImage);
                console.log(`Displaying signature image for: ${signatureName} on page ${pageNum}`);
            } else {
                console.error(`Signature space element not found on page ${pageNum}!`);
            }
        } else {
            console.error(`Page ${pageNum} not found!`);
        }
    } else {
        // For non-verified names, ensure the signature space is empty (just the border)
        const page = document.getElementById(`page${pageNum}`);
        if (page) {
            const signatureSpaceElement = page.querySelector('.signature-space');
            if (signatureSpaceElement) {
                signatureSpaceElement.innerHTML = '';
            }
        }
        console.log(`No signature image available for: ${signatureName} on page ${pageNum}`);
    }
}

// Function to get signature data from invoice (for additional pages)
function getSignatureDataFromInvoice(invoice) {
    if (!invoice) {
        return { name: '', position: '' };
    }
    
    let approvedByName = '';
    let approvedPosition = '';
    
    // Get signature data ONLY from approval summary's approvedByName field
    if (invoice.arInvoiceApprovalSummary && invoice.arInvoiceApprovalSummary.approvedByName) {
        approvedByName = invoice.arInvoiceApprovalSummary.approvedByName;
        approvedPosition = invoice.arInvoiceApprovalSummary.approvedPosition || '';
    }
    
    return {
        name: approvedByName,
        position: approvedPosition
    };
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
        
        // Use external QR code API with qrCodeSrc data
        const apiUrl = 'https://api.qrserver.com/v1/create-qr-code/';
        const params = new URLSearchParams({
            size: '200x200',
            data: invoice.qrCodeSrc,
            format: 'png',
            margin: '0',
            error_correction: 'M'
        });
        
        const fullUrl = apiUrl + '?' + params.toString();
        console.log('QR Code API URL with qrCodeSrc:', fullUrl);
        
        // Create QR code image
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
        
        // Handle image load error
        qrImage.onerror = function() {
            console.error('Error loading QR code image from qrCodeSrc');
            qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
            qrCodeElement.style.display = 'flex';
        };
        
        // Handle image load success
        qrImage.onload = function() {
            console.log('QR Code generated successfully from qrCodeSrc');
            // Ensure the QR code is visible
            qrCodeElement.style.display = 'flex';
        };
        
        console.log('QR Code image set successfully');
    } else {
        // Hide QR code element if qrCodeSrc is null/empty
        console.log('QR Code source is null/empty, hiding QR code element');
        qrCodeElement.style.display = 'none';
    }
}

// Function to populate QR Code for additional pages
function populateQRCodeForPage(invoice, pageNum) {
    console.log(`Populating QR Code for page ${pageNum}:`, invoice);
    
    const qrCodeElement = document.querySelector(`#page${pageNum} .qr-code`);
    if (!qrCodeElement) {
        console.log(`QR Code element not found for page ${pageNum}`);
        return;
    }
    
    // Check if qrCodeSrc is available and not null/empty from API
    if (invoice?.qrCodeSrc && invoice.qrCodeSrc !== null && invoice.qrCodeSrc.trim() !== '') {
        console.log(`QR Code source found for page ${pageNum}:`, invoice.qrCodeSrc);
        
        // Use external QR code API with qrCodeSrc data - ONLY THIS METHOD
        const apiUrl = 'https://api.qrserver.com/v1/create-qr-code/';
        const params = new URLSearchParams({
            size: '200x200',
            data: invoice.qrCodeSrc,
            format: 'png',
            margin: '2',
            error_correction: 'M'
        });
        
        const fullUrl = apiUrl + '?' + params.toString();
        console.log(`QR Code API URL with qrCodeSrc for page ${pageNum}:`, fullUrl);
        
        // Create QR code image
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
        
        // Handle image load error
        qrImage.onerror = function() {
            console.error(`Error loading QR code image from qrCodeSrc for page ${pageNum}`);
            qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
            qrCodeElement.style.display = 'flex';
        };
        
        // Handle image load success
        qrImage.onload = function() {
            console.log(`QR Code generated successfully from qrCodeSrc for page ${pageNum}`);
            // Ensure the QR code is visible
            qrCodeElement.style.display = 'flex';
        };
        
        console.log(`QR Code image set successfully for page ${pageNum}`);
    } else {
        // Hide QR code element if qrCodeSrc is null/empty
        console.log(`QR Code source is null/empty for page ${pageNum}, hiding QR code element`);
        qrCodeElement.style.display = 'none';
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
        unit: item.unitMsr || 'PCS',
        unitPrice: item.u_bsi_salprice || item.priceBefDi || 0,
        amount: item.lineTotal || item.amountDit || 0
    }));
}

// Function to populate items table with pagination
function populateItemsTable(items) {
    const ITEMS_PER_PAGE = 16;
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    // Clear existing pages except the first one
    const pagesContainer = document.getElementById('pagesContainer');
    const firstPage = document.getElementById('page1');
    
    // Remove additional pages if they exist
    const existingPages = pagesContainer.querySelectorAll('.page-container:not(#page1)');
    existingPages.forEach(page => page.remove());
    
    // Hide footer and payment summary on first page if there are multiple pages
    const footer = document.getElementById('footer');
    const paymentSummary = document.getElementById('paymentSummary');
    
    if (totalPages > 1) {
        footer.style.display = 'none';
        if (paymentSummary) {
            paymentSummary.style.display = 'none';
        }
    } else {
        footer.style.display = 'flex';
        if (paymentSummary) {
            paymentSummary.style.display = 'flex';
        }
    }
    
    // Populate first page
    populatePageItems(items.slice(0, ITEMS_PER_PAGE), 1, 0);
    
    // Create additional pages if needed
    for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
        const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
        const pageItems = items.slice(startIndex, endIndex);
        
        createAdditionalPage(pageItems, pageNum, startIndex, pageNum === totalPages);
    }
    
    // Update page info
    document.getElementById('pageInfo').textContent = `Page 1 of ${totalPages}`;
    
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
    const tbody = document.getElementById('itemsTableBody');
    tbody.innerHTML = '';
    
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
        
        // Get currency from API - ensure we always use docCur from API
        const currency = currentInvoiceData?.docCur || '';
        
        paymentSummaryHTML = `
            <div class="payment-summary">
                <div class="payment-instructions">
                    <div class="payment-title">Please remit us in full amount to :</div>
                    <div id="bankInformation${pageNum}"></div>
                </div>
                <div class="financial-summary">
                    <div class="summary-row">
                        <span class="summary-label">Total</span>
                        <span class="summary-value" id="totalAmount${pageNum}">${formatCurrencyWithCurrency(currentInvoiceData?.netPrice || 0, currency)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Discounted</span>
                        <span class="summary-value" id="discountAmount${pageNum}">${formatCurrencyWithCurrency(currentInvoiceData?.discSum || 0, currency)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Sales Amount</span>
                        <span class="summary-value" id="salesAmount${pageNum}">${formatCurrencyWithCurrency(currentInvoiceData?.netPriceAfterDiscount || 0, currency)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Tax Base Other Value</span>
                        <span class="summary-value" id="taxBase${pageNum}">${formatCurrencyWithCurrency(currentInvoiceData?.dpp1112 || 0, currency)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">VAT 12%</span>
                        <span class="summary-value" id="vatAmount${pageNum}">${formatCurrencyWithCurrency(currentInvoiceData?.vatSum || 0, currency)}</span>
                    </div>
                    <div class="summary-row total-line">
                        <span class="summary-label">GRAND TOTAL</span>
                        <span class="summary-value" id="grandTotal${pageNum}">${formatCurrencyWithCurrency(currentInvoiceData?.grandTotal || 0, currency)}</span>
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
                    <div class="qr-code"></div>
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
    
    // Handle signature image for additional pages if it's the last page
    if (isLastPage) {
        const currentInvoiceData = getCurrentInvoiceData();
        const signatureData = getSignatureDataFromInvoice(currentInvoiceData);
        
        // Call signature image display for additional pages
        setTimeout(() => {
            displaySignatureImageForPage(signatureData.name, pageNum);
        }, 100);
    }
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
    
    // Make sure QR code is visible if available
    const qrCodeElements = document.querySelectorAll('.qr-code');
    qrCodeElements.forEach(qrCode => {
        // If QR code has content (image child), make sure it's visible
        if (qrCode.querySelector('img')) {
            qrCode.style.display = 'flex';
        }
    });
    
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

// Function to generate QR code (placeholder)
function generateQRCode(data) {
    // This is a placeholder for QR code generation
    // You can integrate with a QR code library like qrcode.js
    console.log('QR Code data:', data);
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