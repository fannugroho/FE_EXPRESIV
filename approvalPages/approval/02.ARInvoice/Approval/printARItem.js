// AR Invoice Print Page JavaScript

// API Configuration
const API_BASE_URL = `${BASE_URL}/api`;

// Global state management to prevent race conditions
let isDataLoaded = false;
let isSignatureProcessed = false;
let currentInvoiceData = null;

// Utility function to check if current status is "Approved"
function isStatusApproved() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const source = urlParams.get('source');
    const statusLower = status ? status.toLowerCase() : '';
    const sourceLower = source ? source.toLowerCase() : '';

    console.log('🔍 isStatusApproved() check:');
    console.log('   - Original status:', status);
    console.log('   - Original source:', source);
    console.log('   - Status (lowercase):', statusLower);
    console.log('   - Source (lowercase):', sourceLower);

    // Allow signatures for both "approved" and "received" status (case-insensitive)
    // Also check source parameter for "approve" action
    const isApproved = statusLower === 'approved';
    const isReceived = statusLower === 'received';
    const isApproveAction = sourceLower === 'approve'; // Check source=approve
    const shouldShow = isApproved || isReceived || isApproveAction;

    console.log('   - Is Approved (status):', isApproved);
    console.log('   - Is Received (status):', isReceived);
    console.log('   - Is Approve Action (source):', isApproveAction);
    console.log('   - Should show signature:', shouldShow);

    return shouldShow;
}

// Utility function to get current status
function getCurrentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('status') || '';
}

// Utility function to check if signatures should be shown
function shouldShowSignatures() {
    return isStatusApproved();
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

// Function to create DO Numbers table structure
function createDONumbersTable(doValues) {
    if (!doValues || doValues.length === 0) {
        return `
            <table class="do-table" style="border: none; background: transparent;">
                <tbody>
                    <tr style="border: none; background: transparent;">
                        <td style="border: none; background: transparent; padding: 1px 2px;">-</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    let tableHTML = `
        <table class="do-table" style="border: none; background: transparent;">
            <tbody>
    `;

    // Group DO numbers into pairs for two columns per row
    for (let i = 0; i < doValues.length; i += 2) {
        const firstDO = doValues[i];
        const secondDO = doValues[i + 1];

        if (secondDO) {
            // Two DO numbers in this row
            tableHTML += `
                <tr style="border: none; background: transparent;">
                    <td style="border: none; background: transparent; padding: 1px 2px;">${firstDO}</td>
                    <td style="border: none; background: transparent; padding: 1px 2px;">${secondDO}</td>
                </tr>
            `;
        } else {
            // Only one DO number in this row (last row with odd count)
            tableHTML += `
                <tr style="border: none; background: transparent;">
                    <td style="border: none; background: transparent; padding: 1px 2px;">${firstDO}</td>
                </tr>
            `;
        }
    }

    tableHTML += `
            </tbody>
        </table>
    `;

    return tableHTML;
}

// Loading state management
let isLoading = false;

// Show loading indicator
function showLoadingIndicator() {
    const pagesContainer = document.getElementById('pagesContainer');
    if (pagesContainer && !document.getElementById('loadingIndicator')) {
        // Store original content before showing loading
        if (!pagesContainer.dataset.originalContent) {
            pagesContainer.dataset.originalContent = pagesContainer.innerHTML;
        }

        const loadingHTML = `
            <div id="loadingIndicator" class="page-container" style="text-align: center; padding: 50px;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 2s linear infinite;"></div>
                <p style="margin-top: 20px; color: #666;">Loading invoice data...</p>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </div>
        `;
        pagesContainer.innerHTML = loadingHTML;
    }
}

// Hide loading indicator and restore original content
function hideLoadingIndicator() {
    const pagesContainer = document.getElementById('pagesContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');

    if (loadingIndicator && pagesContainer) {
        // Restore original content if it was stored
        if (pagesContainer.dataset.originalContent) {
            pagesContainer.innerHTML = pagesContainer.dataset.originalContent;
            delete pagesContainer.dataset.originalContent;
        } else {
            // Fallback: just remove the loading indicator
            loadingIndicator.remove();
        }
    }
}

// Coordinated data loading function
async function loadInvoiceDataCoordinated(identifier) {
    if (isLoading) {
        console.log('⚠️ Data loading already in progress, skipping...');
        return;
    }

    isLoading = true;
    isSignatureProcessed = false; // Reset signature flag for fresh loading
    showLoadingIndicator();

    try {
        console.log('🔄 Starting coordinated data loading for:', identifier);

        // Priority 1: Check parent window data
        if (window.opener && window.opener.currentInvItemData) {
            console.log('✅ Found data in parent window, using it...');
            const parentData = window.opener.currentInvItemData;
            hideLoadingIndicator(); // Restore content first
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DOM
            populateInvoiceData(parentData); // Populate directly

            // Ensure signature is populated after DOM is ready
            setTimeout(() => {
                if (isStatusApproved()) {
                    console.log('🖋️ Ensuring signature population from parent data...');
                    populateSignatureSync(parentData);
                }
            }, 200);
            return;
        }

        // Priority 2: Check localStorage for complete data
        const storedData = localStorage.getItem(`invoice_${identifier}`);
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                if (isFinancialDataComplete(parsedData)) {
                    console.log('✅ Found complete data in localStorage, using it...');
                    hideLoadingIndicator(); // Restore content first
                    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DOM
                    populateInvoiceData(parsedData); // Populate directly

                    // Ensure signature is populated after DOM is ready
                    setTimeout(() => {
                        if (isStatusApproved()) {
                            console.log('🖋️ Ensuring signature population from localStorage...');
                            populateSignatureSync(parsedData);
                        }
                    }, 200);
                    return;
                } else {
                    console.log('⚠️ Stored data incomplete, fetching from API...');
                }
            } catch (error) {
                console.log('❌ Error parsing stored data, fetching from API...', error);
            }
        }

        // Priority 3: Fetch from API
        console.log('🌐 Fetching fresh data from API...');
        const response = await fetch(`${API_BASE_URL}/ar-invoices/${identifier}/details`);
        const result = await response.json();

        if (result.status && result.data) {
            console.log('✅ Successfully fetched data from API');
            hideLoadingIndicator(); // Restore content first
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DOM
            populateInvoiceData(result.data); // Populate directly

            // Ensure signature is populated after DOM is ready
            setTimeout(() => {
                if (isStatusApproved()) {
                    console.log('🖋️ Ensuring signature population from API...');
                    populateSignatureSync(result.data);
                }
            }, 200);

            // Save to localStorage for future use
            try {
                localStorage.setItem(`invoice_${identifier}`, JSON.stringify(result.data));
                console.log('✅ Data saved to localStorage for future use');
            } catch (error) {
                console.log('⚠️ Could not save to localStorage:', error.message);
            }
        } else {
            throw new Error(result.message || 'Failed to fetch invoice data');
        }

    } catch (error) {
        console.error('❌ Error in coordinated data loading:', error);
        hideLoadingIndicator(); // Ensure content is restored on error
        showErrorMessage('Error loading invoice data: ' + error.message);
    } finally {
        isLoading = false;
    }
}

// This function has been replaced by direct calls to populateInvoiceData in loadInvoiceDataCoordinated

document.addEventListener('DOMContentLoaded', function () {
    console.log('=== PRINT AR ITEM PAGE LOADED ===');
    console.log('⏰ Load Time:', new Date().toISOString());
    console.log('🌐 Page URL:', window.location.href);
    console.log('📍 Base URL:', API_BASE_URL);
    console.log('=====================================');

    // Get invoice data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const stagingID = urlParams.get('stagingID');
    const docEntry = urlParams.get('docEntry');
    const identifier = stagingID || docEntry;
    const status = urlParams.get('status'); // Extract status parameter

    console.log('=== URL PARAMETERS ANALYSIS ===');
    console.log('🔍 All URL Parameters:', Object.fromEntries(urlParams));
    console.log('🆔 Staging ID:', stagingID);
    console.log('📄 Doc Entry:', docEntry);
    console.log('🎯 Final Identifier:', identifier);
    console.log('📊 Status:', status);
    console.log('📋 Should Show Signatures:', shouldShowSignatures());
    console.log('=====================================');

    // Start coordinated data loading instead of auto-refresh
    if (identifier) {
        console.log('🚀 Starting coordinated data loading for:', identifier);
        loadInvoiceDataCoordinated(identifier);
    } else {
        console.log('❌ No identifier provided for data loading');
        showErrorMessage('No invoice identifier provided. Please provide stagingID or docEntry parameter.');
    }

    // All data loading is handled by coordinated loading above - no additional logic needed
    // Immediately fetch and populate signature data AND financial summary data
    if (identifier) {
        try {
            const storedData = localStorage.getItem(`invoice_${identifier}`);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                console.log('✅ Found cached invoice data in localStorage, checking completeness...');
                console.log('📋 Stored data keys:', Object.keys(parsedData));

                // Populate signature information based on status
                if (isStatusApproved()) {
                    console.log('🖋️ Status is Approved, populating signature information...');
                    populateSignatureSync(parsedData);
                } else {
                    console.log('🚫 Status is not Approved, hiding signature elements...');
                    hideSignatureElements();
                }

                // Debug cached financial data
                console.log('=== CACHED FINANCIAL DATA ANALYSIS ===');
                console.log('💵 Cached netPrice:', parsedData.netPrice);
                console.log('💰 Cached discSum:', parsedData.discSum);
                console.log('💲 Cached netPriceAfterDiscount:', parsedData.netPriceAfterDiscount);
                console.log('📊 Cached dpp1112:', parsedData.dpp1112);
                console.log('🏷️ Cached docTax:', parsedData.docTax);
                console.log('🎯 Cached grandTotal:', parsedData.grandTotal);
                console.log('🪙 Cached docCur:', parsedData.docCur);
                console.log('=========================================');

                // Only populate financial summary if cached data is complete
                if (isFinancialDataComplete(parsedData)) {
                    console.log('✅ Cached financial data is complete, populating summary...');
                    populateFinancialSummary(parsedData);
                } else {
                    console.log('⚠️ Cached financial data is incomplete, will wait for API data...');
                }
            } else {
                // If no data in localStorage, try to fetch signature data directly
                console.log('❌ No cached data found, fetching signature and financial data directly...');
                console.log('🌐 Fetching from URL:', `${API_BASE_URL}/ar-invoices/${identifier}/details`);

                fetch(`${API_BASE_URL}/ar-invoices/${identifier}/details`)
                    .then(response => {
                        console.log('📊 Direct fetch response status:', response.status);
                        console.log('✅ Direct fetch response ok:', response.ok);
                        return response.json();
                    })
                    .then(result => {
                        console.log('📦 Direct fetch result:', result);

                        if (result.status && result.data) {
                            // Populate signature information based on status
                            if (isStatusApproved()) {
                                console.log('✅ Pre-populating signature data from API...');
                                populateSignatureSync(result.data);
                            } else {
                                console.log('🚫 Status is not Approved, hiding signature elements...');
                                hideSignatureElements();
                            }

                            // Debug API financial data
                            console.log('=== DIRECT FETCH FINANCIAL DATA ===');
                            console.log('💵 API netPrice:', result.data.netPrice);
                            console.log('💰 API discSum:', result.data.discSum);
                            console.log('💲 API netPriceAfterDiscount:', result.data.netPriceAfterDiscount);
                            console.log('📊 API dpp1112:', result.data.dpp1112);
                            console.log('🏷️ API docTax:', result.data.docTax);
                            console.log('🎯 API grandTotal:', result.data.grandTotal);
                            console.log('🪙 API docCur:', result.data.docCur);
                            console.log('==================================');

                            // Only populate financial summary if API data is complete
                            if (isFinancialDataComplete(result.data)) {
                                console.log('✅ Direct fetch financial data is complete, populating summary...');
                                populateFinancialSummary(result.data);
                            } else {
                                console.log('⚠️ Direct fetch financial data is incomplete, will populate during main data load...');
                            }
                        } else {
                            console.log('❌ Direct fetch failed:', result.message);
                        }
                    })
                    .catch(error => {
                        console.error('❌ Error fetching signature and financial data:', error);
                        console.error('📍 Error details:', error.message);
                    });
            }
        } catch (error) {
            console.error('Error pre-populating signature and financial data from localStorage:', error);
        }
    }

    console.log('=== CHECKING PARENT WINDOW DATA ===');
    // Check if we already have data directly passed from the parent window
    // This will be used when the print page is opened directly from receiveInvItem.js
    if (window.opener && window.opener.currentInvItemData) {
        console.log('✅ Data found from parent window, using it directly');
        console.log('📦 Parent window data available:', !!window.opener.currentInvItemData);

        try {
            const parentData = window.opener.currentInvItemData;
            console.log('📋 Parent data keys:', Object.keys(parentData));
            console.log('🆔 Parent invoice ID:', parentData.docNum || parentData.u_bsi_invnum);

            // Populate signature information based on status
            if (isStatusApproved()) {
                console.log('🖋️ Status is Approved, populating signature information from parent...');
                populateSignatureSync(parentData);
            } else {
                console.log('🚫 Status is not Approved, hiding signature elements...');
                hideSignatureElements();
            }

            // Debug parent window financial data
            console.log('=== PARENT WINDOW FINANCIAL DATA ANALYSIS ===');
            console.log('💵 Parent netPrice:', parentData.netPrice);
            console.log('💰 Parent discSum:', parentData.discSum);
            console.log('💲 Parent netPriceAfterDiscount:', parentData.netPriceAfterDiscount);
            console.log('📊 Parent dpp1112:', parentData.discSum);
            console.log('🏷️ Parent docTax:', parentData.docTax);
            console.log('🎯 Parent grandTotal:', parentData.grandTotal);
            console.log('🪙 Parent docCur:', parentData.docCur);
            console.log('============================================');

            // Only populate financial summary if parent data is complete
            if (isFinancialDataComplete(parentData)) {
                console.log('✅ Parent financial data is complete, populating summary...');
                populateFinancialSummary(parentData);
            } else {
                console.log('⚠️ Parent financial data is incomplete, will populate during main data load...');
            }

            // Then populate the rest of the invoice data
            console.log('📄 Populating complete invoice data from parent...');
            populateInvoiceData(parentData);
            console.log('✅ Parent window data processing completed');
            return;
        } catch (error) {
            console.error('❌ Error using data from parent window:', error);
            console.error('📍 Error details:', error.message);
            // Continue with normal loading if direct data access fails
        }
    } else {
        console.log('❌ No parent window data available');
        if (!window.opener) {
            console.log('  - No window.opener found');
        } else if (!window.opener.currentInvItemData) {
            console.log('  - window.opener exists but no currentInvItemData');
        }
    }

    // This functionality has been moved to the main data loading logic above
});

// Function to load invoice data from API
async function loadInvoiceDataFromAPI(identifier) {
    try {
        // Enhanced logging for API request
        console.log('=== LOADING INVOICE DATA FROM API ===');
        console.log('🔍 Identifier:', identifier);
        console.log('📍 Base URL:', API_BASE_URL);
        console.log('🌐 Full API URL:', `${API_BASE_URL}/ar-invoices/${identifier}/details`);
        console.log('⏰ Request Time:', new Date().toISOString());
        console.log('==========================================');

        const apiUrl = `${API_BASE_URL}/ar-invoices/${identifier}/details`;
        const response = await fetch(apiUrl);

        // Detailed response logging
        console.log('=== API RESPONSE DETAILS ===');
        console.log('📊 Status Code:', response.status);
        console.log('✅ Response OK:', response.ok);
        console.log('📋 Status Text:', response.statusText);
        console.log('🌐 URL:', response.url);
        console.log('🔗 Response Type:', response.type);
        console.log('============================');

        if (response.ok) {
            const result = await response.json();

            // Enhanced data logging
            console.log('=== RECEIVED DATA ANALYSIS ===');
            console.log('📦 Full API Response:', JSON.stringify(result, null, 2));
            console.log('✅ Response Status:', result.status);
            console.log('📝 Response Message:', result.message);
            console.log('📊 Data Available:', !!result.data);

            if (result.data) {
                console.log('=== INVOICE DATA STRUCTURE ===');
                console.log('🆔 Invoice ID/DocNum:', result.data.docNum);
                console.log('🔢 Staging ID:', result.data.stagingID);
                console.log('📋 Customer Name:', result.data.cardName);
                console.log('💰 Currency:', result.data.docCur);
                console.log('💵 Grand Total:', result.data.grandTotal);
                console.log('📅 Invoice Date:', result.data.docDate);
                console.log('🏢 Company:', result.data.companyName);
                console.log('🏦 Bank Code:', result.data.u_bankCode || result.data.U_BankCode);
                console.log('📊 Items Count:', result.data.arInvoiceDetails?.length || 0);
                console.log('✍️ Approval Summary:', !!result.data.arInvoiceApprovalSummary);
                console.log('🔄 QR Code Source:', !!result.data.qrCodeSrc);
                console.log('===============================');

                console.log('🎯 PROCEEDING TO POPULATE INVOICE DATA...');
                populateInvoiceData(result.data);
            } else {
                console.error('❌ API returned error:', result.message);
                showErrorMessage('Failed to load invoice data: ' + (result.message || 'Unknown error'));
            }
        } else {
            console.error('=== API REQUEST FAILED ===');
            console.error('❌ Status:', response.status);
            console.error('📝 Status Text:', response.statusText);

            const errorText = await response.text();
            console.error('📄 Error Response Body:', errorText);
            console.error('=========================');

            showErrorMessage('Failed to load invoice data. HTTP Status: ' + response.status);
        }
    } catch (error) {
        console.error('=== NETWORK ERROR ===');
        console.error('❌ Error Type:', error.name);
        console.error('📝 Error Message:', error.message);
        console.error('📍 Error Stack:', error.stack);
        console.error('==================');

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
    console.log('=== RETRIEVING DATA FROM STORAGE ===');
    console.log('🔍 Identifier:', identifier);
    console.log('====================================');

    // Try to get data from localStorage first
    console.log('📂 Checking localStorage...');
    const storedData = localStorage.getItem(`invoice_${identifier}`);
    if (storedData) {
        console.log('✅ Found data in localStorage');
        console.log('📊 Data size:', storedData.length, 'characters');
        try {
            const parsedData = JSON.parse(storedData);
            console.log('✅ Successfully parsed localStorage data');
            console.log('📋 Data keys:', Object.keys(parsedData));
            return parsedData;
        } catch (parseError) {
            console.error('❌ Error parsing localStorage data:', parseError);
        }
    } else {
        console.log('❌ No data found in localStorage');
    }

    // Try to get data from sessionStorage
    console.log('📂 Checking sessionStorage...');
    const sessionData = sessionStorage.getItem(`invoice_${identifier}`);
    if (sessionData) {
        console.log('✅ Found data in sessionStorage');
        console.log('📊 Data size:', sessionData.length, 'characters');
        try {
            const parsedData = JSON.parse(sessionData);
            console.log('✅ Successfully parsed sessionStorage data');
            console.log('📋 Data keys:', Object.keys(parsedData));
            return parsedData;
        } catch (parseError) {
            console.error('❌ Error parsing sessionStorage data:', parseError);
        }
    } else {
        console.log('❌ No data found in sessionStorage');
    }

    // If no stored data, try to get from API
    try {
        console.log('🌐 No stored data found, attempting API fetch...');
        console.log('📍 API URL:', `${API_BASE_URL}/ar-invoices/${identifier}/details`);

        const response = await fetch(`${API_BASE_URL}/ar-invoices/${identifier}/details`);

        console.log('📊 API Response Status:', response.status);
        console.log('✅ API Response OK:', response.ok);

        if (response.ok) {
            const result = await response.json();
            console.log('📦 API Response received');
            console.log('✅ Response Status:', result.status);

            if (result.status && result.data) {
                console.log('✅ Valid data received from API');
                console.log('📋 Data keys:', Object.keys(result.data));
                console.log('🔍 Invoice Number:', result.data.docNum);
                console.log('💰 Grand Total:', result.data.grandTotal);
                return result.data;
            } else {
                console.log('❌ API returned error:', result.message);
            }
        } else {
            console.log('❌ API request failed with status:', response.status);
        }
    } catch (error) {
        console.error('❌ Error fetching data from API:', error);
    }

    console.log('❌ No data available from any source');
    return null;
}

// Function to save invoice data to storage (to be called from receiveInvItem.html)
function saveInvoiceDataToStorage(identifier, invoiceData) {
    console.log('=== SAVING INVOICE DATA TO STORAGE ===');
    console.log('🔍 Identifier:', identifier);
    console.log('📊 Data Size:', JSON.stringify(invoiceData).length, 'characters');
    console.log('📋 Data Keys:', Object.keys(invoiceData));
    console.log('💰 Financial Data:');
    console.log('  - Net Price:', invoiceData.netPrice);
    console.log('  - Grand Total:', invoiceData.grandTotal);
    console.log('  - Currency:', invoiceData.docCur);

    try {
        const jsonData = JSON.stringify(invoiceData);

        // Save to localStorage
        console.log('💾 Saving to localStorage...');
        localStorage.setItem(`invoice_${identifier}`, jsonData);
        console.log('✅ Successfully saved to localStorage');

        // Save to sessionStorage
        console.log('💾 Saving to sessionStorage...');
        sessionStorage.setItem(`invoice_${identifier}`, jsonData);
        console.log('✅ Successfully saved to sessionStorage');

        console.log('✅ Invoice data saved successfully to both storage locations');
        console.log('======================================');
        return true;
    } catch (error) {
        console.error('❌ Error saving invoice data to storage:', error);
        console.error('📍 Error details:', error.message);
        console.error('======================================');
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
    console.log('=== POPULATING INVOICE DATA ===');
    console.log('📦 Invoice Object:', invoice);
    console.log('🆔 Invoice ID:', invoice.docNum || invoice.u_bsi_invnum);
    console.log('📅 Date:', invoice.docDate);
    console.log('👤 Customer:', invoice.cardName);

    // Store data globally for race condition prevention
    currentInvoiceData = invoice;
    isDataLoaded = true;
    console.log('💰 Currency:', invoice.docCur);
    console.log('===============================');

    // Debug: Check financial data fields specifically
    console.log('=== FINANCIAL DATA ANALYSIS ===');
    console.log('💵 Net Price:', invoice.netPrice, '(Type:', typeof invoice.netPrice, ')');
    console.log('💰 Discount Sum:', invoice.discSum, '(Type:', typeof invoice.discSum, ')');
    console.log('💲 Net After Discount:', invoice.netPriceAfterDiscount, '(Type:', typeof invoice.netPriceAfterDiscount, ')');
    console.log('📊 DPP 11/12:', invoice.dpp1112, '(Type:', typeof invoice.dpp1112, ')');
    console.log('🏷️ Document Tax:', invoice.docTax, '(Type:', typeof invoice.docTax, ')');
    console.log('🎯 Grand Total:', invoice.grandTotal, '(Type:', typeof invoice.grandTotal, ')');
    console.log('🪙 Currency:', invoice.docCur, '(Type:', typeof invoice.docCur, ')');
    console.log('===============================');

    // Populate signature information based on status
    if (isStatusApproved()) {
        console.log('🖋️ Status is Approved, populating signature information...');
        populateSignatureSync(invoice);
    } else {
        console.log('🚫 Status is not Approved, hiding signature elements...');
        hideSignatureElements();
    }

    try {
        console.log('📋 Starting DOM element population...');

        // Invoice details - map from new API structure to print page structure
        const invoiceNumberElement = document.getElementById('invoiceNumber');
        const visionInvoiceNumberElement = document.getElementById('visionInvoiceNumber');
        const invoiceDateElement = document.getElementById('invoiceDate');
        const npwpElement = document.getElementById('npwp');
        const dueDateElement = document.getElementById('dueDate');

        console.log('=== POPULATING BASIC INFO ===');
        if (invoiceNumberElement) {
            const invoiceNum = invoice.u_bsi_invnum || invoice.docNum || '';
            invoiceNumberElement.textContent = invoiceNum;
            console.log('✅ Invoice Number set to:', invoiceNum);
        } else {
            console.error('❌ Invoice Number element not found');
        }

        if (visionInvoiceNumberElement) {
            const visionFieldContainer = visionInvoiceNumberElement.closest('.invoice-field');
            const hasQrCodeSrc = invoice.qrCodeSrc && typeof invoice.qrCodeSrc === 'string' && invoice.qrCodeSrc.trim() !== '';
            console.log('🔍 QR Code Source available:', hasQrCodeSrc);

            if (!hasQrCodeSrc) {
                if (visionFieldContainer) visionFieldContainer.style.display = 'none';
                console.log('🚫 Vision invoice field hidden (no QR code)');
            } else {
                const visionNum = invoice.visInv || invoice.u_bsi_invnum || invoice.docNum || '';
                visionInvoiceNumberElement.textContent = visionNum;
                if (visionFieldContainer) visionFieldContainer.style.display = 'block';
                console.log('✅ Vision Invoice Number set to:', visionNum);
            }
        } else {
            console.error('❌ Vision Invoice Number element not found');
        }

        if (invoiceDateElement) {
            const formattedDate = formatDate(invoice.docDate);
            invoiceDateElement.textContent = formattedDate;
            console.log('✅ Invoice Date set to:', formattedDate);
        } else {
            console.error('❌ Invoice Date element not found');
        }

        if (npwpElement) {
            const npwp = invoice.licTradNum || '';
            npwpElement.textContent = npwp;
            console.log('✅ NPWP set to:', npwp);
        } else {
            console.error('❌ NPWP element not found');
        }

        if (dueDateElement) {
            const formattedDueDate = formatDate(invoice.docDueDate || invoice.docDate);
            dueDateElement.textContent = formattedDueDate;
            console.log('✅ Due Date set to:', formattedDueDate);
        } else {
            console.error('❌ Due Date element not found');
        }

        console.log('=== POPULATING RECIPIENT INFO ===');
        // Recipient information
        const recipientNameElement = document.getElementById('recipientName');
        const recipientAddressElement = document.getElementById('recipientAddress');
        const recipientCityElement = document.getElementById('recipientCity');

        if (recipientNameElement) {
            const recipientName = invoice.cardName || '';
            recipientNameElement.textContent = recipientName;
            console.log('✅ Recipient Name set to:', recipientName);
        } else {
            console.error('❌ Recipient Name element not found');
        }

        // Parse address from the address field
        if (invoice.address) {
            console.log('📍 Parsing address:', invoice.address);
            const addressLines = invoice.address.split('\r\r');
            console.log('📍 Address lines:', addressLines);

            if (addressLines.length >= 1 && recipientAddressElement) {
                const address = addressLines[0].trim();
                recipientAddressElement.textContent = address;
                console.log('✅ Recipient Address set to:', address);
            }
            if (addressLines.length >= 2 && recipientCityElement) {
                const city = addressLines[1].trim();
                recipientCityElement.textContent = city;
                console.log('✅ Recipient City set to:', city);
            }
        } else {
            console.log('❌ No address data available');
            if (recipientAddressElement) recipientAddressElement.textContent = '';
            if (recipientCityElement) recipientCityElement.textContent = '';
        }

        console.log('=== POPULATING COMPANY INFO ===');
        // Shipper information - Always use hardcoded value
        const shipperNameElement = document.getElementById('shipperName');
        if (shipperNameElement) {
            const shipperName = 'PT. KANSAI PAINT INDONESIA';
            shipperNameElement.textContent = shipperName;
            console.log('✅ Shipper Name set to:', shipperName);
        } else {
            console.error('❌ Shipper Name element not found');
        }

        // Company information - populate from API data
        const companyNameElement = document.getElementById('companyName');
        const companyAddressElement = document.getElementById('companyAddress');
        const companyPhoneElement = document.getElementById('companyPhone');
        const companyFaxElement = document.getElementById('companyFax');

        if (companyNameElement) {
            const companyName = invoice.companyName || '';
            companyNameElement.textContent = companyName;
            console.log('✅ Company Name set to:', companyName);
        }

        if (companyAddressElement) {
            const companyAddress = invoice.companyAddress || '';
            companyAddressElement.textContent = companyAddress;
            console.log('✅ Company Address set to:', companyAddress);
        }

        if (companyPhoneElement) {
            const companyPhone = invoice.companyPhone ? `Phone : ${invoice.companyPhone}` : '';
            companyPhoneElement.textContent = companyPhone;
            console.log('✅ Company Phone set to:', companyPhone);
        }

        if (companyFaxElement) {
            const companyFax = invoice.companyFax ? `Fax : ${invoice.companyFax}` : '';
            companyFaxElement.textContent = companyFax;
            console.log('✅ Company Fax set to:', companyFax);
        }

        console.log('=== POPULATING ORDER NUMBERS ===');
        // Order numbers - use specific fields for DO and PO numbers with character limits
        const doNumbersElement = document.getElementById('doNumbers');
        const poNumbersElement = document.getElementById('poNumbers');

        if (doNumbersElement) {
            if (invoice.u_bsi_udf1) {
                // Normalize DO values: support semicolon-separated strings with or without spaces
                const rawDo = invoice.u_bsi_udf1;
                let doValues = [];
                if (Array.isArray(rawDo)) {
                    rawDo.forEach(v => {
                        if (typeof v === 'string') {
                            doValues.push(...v.split(/;\s*/).map(s => s.trim()).filter(Boolean));
                        } else if (v != null) {
                            doValues.push(String(v));
                        }
                    });
                } else if (typeof rawDo === 'string') {
                    doValues = rawDo.split(/;\s*/).map(s => s.trim()).filter(Boolean);
                } else if (rawDo != null) {
                    doValues = [String(rawDo)];
                }
                console.log('📋 DO Numbers (normalized):', doValues);

                if (doValues.length > 1) {
                    // Create table structure for multiple DO numbers
                    const tableHTML = createDONumbersTable(doValues);
                    doNumbersElement.innerHTML = tableHTML;
                } else {
                    // Single DO number - still use table for consistency
                    const tableHTML = createDONumbersTable([doValues[0]]);
                    doNumbersElement.innerHTML = tableHTML;
                }
                console.log('✅ DO Numbers populated with table structure');
            } else {
                // No DO numbers - show empty table
                const tableHTML = createDONumbersTable([]);
                doNumbersElement.innerHTML = tableHTML;
                console.log('❌ No DO Numbers available');
            }
        } else {
            console.error('❌ DO Numbers element not found');
        }

        // Handle P/O NO with multiple values
        if (poNumbersElement) {
            if (invoice.u_bsi_udf2) {
                const poValues = Array.isArray(invoice.u_bsi_udf2) ? invoice.u_bsi_udf2 : [invoice.u_bsi_udf2];
                console.log('📋 PO Numbers:', poValues);

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
                console.log('✅ PO Numbers populated');
            } else {
                poNumbersElement.className = 'detail-value';
                poNumbersElement.textContent = '';
                console.log('❌ No PO Numbers available');
            }
        } else {
            console.error('❌ PO Numbers element not found');
        }

        console.log('=== POPULATING ITEMS TABLE ===');
        // Items table - convert from new API structure to print page structure
        const printItems = convertItemsForPrint(invoice.arInvoiceDetails || []);
        console.log('📊 Items converted for print:', printItems.length, 'items');
        console.log('📋 First item sample:', printItems[0]);
        populateItemsTable(printItems);

        console.log('=== STORING DATA FOR REUSE ===');
        // Store invoice data for use in additional pages
        const urlParams = new URLSearchParams(window.location.search);
        const stagingID = urlParams.get('stagingID');
        const docEntry = urlParams.get('docEntry');
        const identifier = stagingID || docEntry;

        if (identifier) {
            console.log('💾 Saving data to storage with identifier:', identifier);
            saveInvoiceDataToStorage(identifier, invoice);
        }

        // Always store in window object for immediate access during pagination
        window.latestInvoiceData = invoice;
        console.log('💾 Stored latest invoice data in window object');
        console.log('📊 Window data financial summary:');
        console.log('  - Net Price:', window.latestInvoiceData.netPrice);
        console.log('  - Grand Total:', window.latestInvoiceData.grandTotal);
        console.log('  - Currency:', window.latestInvoiceData.docCur);

        console.log('=== POPULATING FINANCIAL SUMMARY ===');
        // Financial summary - use API fields with currency
        // Check if elements already have values (to avoid overwriting)
        const totalAmountElement = document.getElementById('totalAmount');
        const shouldPopulateFinancial = !totalAmountElement ||
            totalAmountElement.textContent === '' ||
            totalAmountElement.textContent === 'IDR 0' ||
            totalAmountElement.textContent === '0';

        console.log('💰 Should populate financial?', shouldPopulateFinancial);
        console.log('💰 Current total amount:', totalAmountElement ? totalAmountElement.textContent : 'element not found');

        if (shouldPopulateFinancial) {
            console.log('✅ Populating financial summary...');
            populateFinancialSummary(invoice);
        } else {
            console.log('⏭️ Financial summary already populated, skipping...');
        }

        console.log('=== POPULATING ADDITIONAL INFO ===');
        // Bank account information from API data
        console.log('🏦 Populating bank information...');
        populateBankInformation(invoice);

        // Signature information - will be handled by coordinated loading
        if (!isStatusApproved()) {
            console.log('🚫 Status is not Approved, hiding signature elements...');
            hideSignatureElements();
        }

        // QR Code information - populate from API data
        console.log('📱 Populating QR code...');
        populateQRCode(invoice);

        console.log('✅ INVOICE DATA POPULATION COMPLETED SUCCESSFULLY');
        console.log('================================================');

        // Ensure signature data is populated for approved status
        if (isStatusApproved()) {
            console.log('🔄 Ensuring signature population after data load...');
            setTimeout(() => {
                isSignatureProcessed = false; // Reset flag to allow re-population
                populateSignatureSync(invoice);

                // Double check after additional delay
                setTimeout(() => {
                    const nameElement = document.getElementById('signatureName');
                    const hasSignatureName = nameElement && nameElement.textContent.trim();
                    const hasSignatureImage = document.querySelector('.signature-space img');

                    if (!hasSignatureName || !hasSignatureImage) {
                        console.log('⚠️ Signature still missing, trying once more...');
                        isSignatureProcessed = false;
                        populateSignatureSync(invoice);
                    }
                }, 500);
            }, 200);
        }

    } catch (error) {
        console.error('❌ ERROR IN POPULATE INVOICE DATA:', error);
        console.error('📍 Error stack:', error.stack);
    }
}

// Function to get current invoice data for use in additional pages
function getCurrentInvoiceData() {
    console.log('=== GETTING CURRENT INVOICE DATA ===');

    // Try to get fresh data from window.latestInvoiceData first if it's complete
    if (window.latestInvoiceData && isFinancialDataComplete(window.latestInvoiceData)) {
        console.log('✅ Using fresh complete data from window.latestInvoiceData');
        console.log('📊 Data Summary:');
        console.log('  - Invoice ID:', window.latestInvoiceData.docNum);
        console.log('  - Grand Total:', window.latestInvoiceData.grandTotal);
        console.log('  - Currency:', window.latestInvoiceData.docCur);
        console.log('====================================');
        return window.latestInvoiceData;
    }

    // Try to get data from localStorage next
    const urlParams = new URLSearchParams(window.location.search);
    const stagingID = urlParams.get('stagingID');
    const docEntry = urlParams.get('docEntry');

    console.log('🔍 URL Parameters:');
    console.log('  - Staging ID:', stagingID);
    console.log('  - Doc Entry:', docEntry);

    if (stagingID) {
        console.log('📂 Checking localStorage for stagingID:', stagingID);
        const storedData = localStorage.getItem(`invoice_${stagingID}`);
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                console.log('✅ Found invoice data in localStorage');
                console.log('📊 Data size:', storedData.length, 'characters');
                console.log('📋 Data keys:', Object.keys(parsedData));

                // Check if financial data is complete in stored data
                if (isFinancialDataComplete(parsedData)) {
                    console.log('✅ Stored data has complete financial information');
                    return parsedData;
                } else {
                    console.log('⚠️ Stored data has incomplete financial information');
                    console.log('💰 Financial fields:');
                    console.log('  - Net Price:', parsedData.netPrice);
                    console.log('  - Grand Total:', parsedData.grandTotal);
                    console.log('  - VAT Sum:', parsedData.docTax);
                    return null;
                }
            } catch (parseError) {
                console.error('❌ Error parsing localStorage data:', parseError);
            }
        } else {
            console.log('❌ No data found in localStorage for stagingID');
        }
    }

    if (docEntry) {
        console.log('📂 Checking localStorage for docEntry:', docEntry);
        const storedData = localStorage.getItem(`invoice_${docEntry}`);
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                console.log('✅ Found invoice data in localStorage');
                console.log('📊 Data size:', storedData.length, 'characters');
                console.log('📋 Data keys:', Object.keys(parsedData));

                // Check if financial data is complete in stored data
                if (isFinancialDataComplete(parsedData)) {
                    console.log('✅ Stored data has complete financial information');
                    return parsedData;
                } else {
                    console.log('⚠️ Stored data has incomplete financial information');
                    console.log('💰 Financial fields:');
                    console.log('  - Net Price:', parsedData.netPrice);
                    console.log('  - Grand Total:', parsedData.grandTotal);
                    console.log('  - Document Tax:', parsedData.docTax);
                    return null;
                }
            } catch (parseError) {
                console.error('❌ Error parsing localStorage data:', parseError);
            }
        } else {
            console.log('❌ No data found in localStorage for docEntry');
        }
    }

    // Try sessionStorage as fallback
    if (stagingID) {
        console.log('📂 Checking sessionStorage for stagingID:', stagingID);
        const sessionData = sessionStorage.getItem(`invoice_${stagingID}`);
        if (sessionData) {
            try {
                const parsedData = JSON.parse(sessionData);
                console.log('✅ Found invoice data in sessionStorage');
                console.log('📊 Data size:', sessionData.length, 'characters');

                // Check if financial data is complete in session data
                if (isFinancialDataComplete(parsedData)) {
                    console.log('✅ Session data has complete financial information');
                    return parsedData;
                } else {
                    console.log('⚠️ Session data has incomplete financial information');
                    return null;
                }
            } catch (parseError) {
                console.error('❌ Error parsing sessionStorage data:', parseError);
            }
        } else {
            console.log('❌ No data found in sessionStorage for stagingID');
        }
    }

    if (docEntry) {
        console.log('📂 Checking sessionStorage for docEntry:', docEntry);
        const sessionData = sessionStorage.getItem(`invoice_${docEntry}`);
        if (sessionData) {
            try {
                const parsedData = JSON.parse(sessionData);
                console.log('✅ Found invoice data in sessionStorage');
                console.log('📊 Data size:', sessionData.length, 'characters');

                // Check if financial data is complete in session data
                if (isFinancialDataComplete(parsedData)) {
                    console.log('✅ Session data has complete financial information');
                    return parsedData;
                } else {
                    console.log('⚠️ Session data has incomplete financial information');
                    return null;
                }
            } catch (parseError) {
                console.error('❌ Error parsing sessionStorage data:', parseError);
            }
        } else {
            console.log('❌ No data found in sessionStorage for docEntry');
        }
    }

    console.log('❌ No invoice data found in any storage location');
    console.log('====================================');
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
        "CIMB": {
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

// Function to populate financial summary for additional pages
function populateFinancialSummaryForPage(invoice, pageNum) {
    console.log(`Populating financial summary for page ${pageNum} with invoice:`, invoice);

    if (!invoice) {
        console.warn(`No invoice data provided for financial summary on page ${pageNum}`);
        return;
    }

    // Get currency from API - use docCur field from API
    const currency = invoice.docCur || '';
    console.log(`Currency from API docCur field for page ${pageNum}:`, currency);

    // Set currency labels for this page
    const currencyText = currency || 'IDR';
    [
        `totalCurrency${pageNum}`,
        `discountCurrency${pageNum}`,
        `salesCurrency${pageNum}`,
        `taxBaseCurrency${pageNum}`,
        `vatCurrency${pageNum}`,
        `grandCurrency${pageNum}`,
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = currencyText;
    });

    // Populate amounts for this page
    [
        { id: `totalAmount${pageNum}`, value: invoice.netPrice || 0, label: 'Total' },
        { id: `discountAmount${pageNum}`, value: invoice.discSum || 0, label: 'Discounted' },
        { id: `salesAmount${pageNum}`, value: invoice.netPriceAfterDiscount || 0, label: 'Sales Amount' },
        { id: `taxBase${pageNum}`, value: invoice.dpp1112 || 0, label: 'Tax Base Other Value' },
        { id: `vatAmount${pageNum}`, value: invoice.docTax || 0, label: 'VAT 12%' },
        { id: `grandTotal${pageNum}`, value: invoice.grandTotal || 0, label: 'GRAND TOTAL' },
    ].forEach(item => {
        const element = document.getElementById(item.id);
        if (element) {
            element.textContent = formatCurrencyRounded(item.value);
            console.log(`Page ${pageNum} - ${item.label}: ${currencyText} ${formatCurrencyRounded(item.value)}`);
        } else {
            console.warn(`Financial summary element not found for page ${pageNum}: ${item.id}`);
        }
    });

    console.log(`Financial summary populated for page ${pageNum} with currency from docCur:`, currency);
}

// Function to populate bank information for additional pages
// Displays hardcoded bank data based on U_bankCode and account field
function populateBankInformationForPage(invoice, pageNum) {
    console.log(`Populating bank information for page ${pageNum}:`, invoice);

    // Check if invoice data is valid
    if (!invoice) {
        console.warn(`No invoice data provided for bank information on page ${pageNum}`);
        return;
    }

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
        "CIMB": {
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

    // Set currency labels consistently in the middle column
    const currencyText = currency || 'IDR';
    const currencyIds = ['totalCurrency', 'discountCurrency', 'salesCurrency', 'taxBaseCurrency', 'vatCurrency', 'grandCurrency'];
    currencyIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = currencyText;
    });

    // Populate the amounts (right column), rounded
    const financialData = [
        { id: 'totalAmount', value: invoice.netPrice || 0, label: 'Total' },
        { id: 'discountAmount', value: invoice.discSum || 0, label: 'Discounted' },
        { id: 'salesAmount', value: invoice.netPriceAfterDiscount || 0, label: 'Sales Amount' },
        { id: 'taxBase', value: invoice.dpp1112 || 0, label: 'Tax Base Other Value' },
        { id: 'vatAmount', value: invoice.docTax || 0, label: 'VAT 12%' },
        { id: 'grandTotal', value: invoice.grandTotal || 0, label: 'GRAND TOTAL' },
    ];

    financialData.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) {
            element.textContent = formatCurrencyRounded(item.value);
            console.log(`${item.label}: ${currencyText} ${formatCurrencyRounded(item.value)}`);
        } else {
            console.warn(`Financial summary element not found: ${item.id}`);
        }
    });

    console.log('Financial summary populated with currency from docCur:', currency);
    console.log('Financial summary populated:', financialData);
}

// Signature Image Mapping - Maps approver names to their signature image files
const SIGNATURE_IMAGE_MAPPING = {
    // Exact name matches (case-insensitive)
    'atsuro suzuki': 'Atsuro Suzuki.jpg',
    'atsushi hayashida': 'Atsushi Hayashida.jpg',
    'hirotoshi nishihara': 'Hirotoshi Nishihara.jpg',
    'nyimas widya': 'Nyimas Widya.jpg',
    'takahiro kimura': 'Takahiro Kimura.jpg',
    'yuya eguchi': 'Yuya Eguchi.jpg',
    'nemit': 'Nyimas Widya.jpg', // Map Nemit to available signature

    // Partial name matches for flexibility
    'atsuro': 'Atsuro Suzuki.jpg',
    'suzuki': 'Atsuro Suzuki.jpg',
    'atsushi': 'Atsushi Hayashida.jpg',
    'hayashida': 'Atsushi Hayashida.jpg',
    'hirotoshi': 'Hirotoshi Nishihara.jpg',
    'nishihara': 'Hirotoshi Nishihara.jpg',
    'nyimas': 'Nyimas Widya.jpg',
    'widya': 'Nyimas Widya.jpg',
    'takahiro': 'Takahiro Kimura.jpg',
    'kimura': 'Takahiro Kimura.jpg',
    'yuya': 'Yuya Eguchi.jpg',
    'eguchi': 'Yuya Eguchi.jpg'
};

// Function to find signature image for a given name
function findSignatureImage(approverName) {
    if (!approverName || typeof approverName !== 'string') {
        return null;
    }

    const cleanName = approverName.toLowerCase().trim();
    console.log('🔍 Looking for signature image for:', cleanName);

    // Try exact match first
    if (SIGNATURE_IMAGE_MAPPING[cleanName]) {
        console.log('✅ Found exact match:', SIGNATURE_IMAGE_MAPPING[cleanName]);
        return SIGNATURE_IMAGE_MAPPING[cleanName];
    }

    // Try partial matches
    for (const [key, imagePath] of Object.entries(SIGNATURE_IMAGE_MAPPING)) {
        if (cleanName.includes(key) || key.includes(cleanName)) {
            console.log('✅ Found partial match:', imagePath, 'for key:', key);
            return imagePath;
        }
    }

    console.log('❌ No signature image found for:', approverName);
    return null;
}

// Synchronized signature population to prevent race conditions
function populateSignatureSync(invoice) {
    console.log('🔄 SYNCHRONIZED SIGNATURE POPULATION STARTED');

    // Prevent multiple executions
    if (isSignatureProcessed) {
        console.log('⚠️ Signature already processed, skipping');
        return;
    }

    // Mark as processed immediately
    isSignatureProcessed = true;

    // Wait for DOM to be ready
    const checkDOMReady = () => {
        const signatureNameElement = document.getElementById('signatureName');
        const signatureTitleElement = document.getElementById('signatureTitle');
        const signatureSpaceElement = document.querySelector('.signature-space');

        return signatureNameElement && signatureTitleElement && signatureSpaceElement;
    };

    const populateWhenReady = () => {
        if (!checkDOMReady()) {
            console.log('⏳ DOM not ready, retrying in 100ms...');
            setTimeout(populateWhenReady, 100);
            return;
        }

        console.log('✅ DOM ready, proceeding with signature population');
        populateSignatureInformation(invoice);
    };

    populateWhenReady();
}

// Function to populate signature information from API data
function populateSignatureInformation(invoice) {
    console.log('🖋️ =================================');
    console.log('🖋️ SIGNATURE POPULATION DEBUG START');
    console.log('🖋️ =================================');
    console.log('🖋️ Full invoice object:', invoice);
    console.log('🖋️ Invoice approval summary:', invoice.arInvoiceApprovalSummary);
    console.log('🖋️ Direct approvedByName:', invoice.approvedByName);
    console.log('🖋️ Direct preparedByName:', invoice.u_BSI_Expressiv_PreparedByName);
    console.log('🖋️ Invoice status:', invoice.status);
    console.log('🖋️ Document status:', invoice.docStatus);

    let approvedByName = '';
    let approvedPosition = '';

    // Enhanced signature data retrieval with multiple fallback sources
    if (invoice.arInvoiceApprovalSummary && invoice.arInvoiceApprovalSummary.approvedByName) {
        // Primary source: approval summary
        approvedByName = invoice.arInvoiceApprovalSummary.approvedByName;
        approvedPosition = invoice.arInvoiceApprovalSummary.approvedPosition || '';
        console.log('✅ Using signature from arInvoiceApprovalSummary.approvedByName');
    } else if (invoice.approvedByName) {
        // Fallback 1: direct approvedByName field
        approvedByName = invoice.approvedByName;
        approvedPosition = invoice.approvedPosition || '';
        console.log('✅ Using signature from direct approvedByName field');
    } else if (invoice.arInvoiceApprovalSummary && invoice.arInvoiceApprovalSummary.receivedByName) {
        // Fallback 2: received by name (for received status)
        approvedByName = invoice.arInvoiceApprovalSummary.receivedByName;
        approvedPosition = invoice.arInvoiceApprovalSummary.receivedPosition || 'Receiver';
        console.log('✅ Using signature from arInvoiceApprovalSummary.receivedByName (fallback)');
    } else if (invoice.receivedByName) {
        // Fallback 3: direct receivedByName field
        approvedByName = invoice.receivedByName;
        approvedPosition = 'Receiver';
        console.log('✅ Using signature from direct receivedByName field (fallback)');
    } else if (invoice.u_BSI_Expressiv_PreparedByName) {
        // Fallback 4: prepared by name (last resort)
        approvedByName = invoice.u_BSI_Expressiv_PreparedByName;
        approvedPosition = 'Prepared By';
        console.log('⚠️ Using signature from preparedByName (last resort fallback)');
    } else {
        console.log('❌ No signature data found in any source');
        // // FOR TESTING: Add temporary fallback signature for debugging
        // approvedByName = 'DEBUG: No Signature Data';
        // approvedPosition = 'DEBUG: Missing Approval Info';
        // console.log('⚠️ Using DEBUG fallback signature for testing');
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
    const signatureSpaceElement = document.querySelector('.signature-space');

    console.log('Looking for signature elements...');
    console.log('signatureNameElement found:', !!signatureNameElement);
    console.log('signatureTitleElement found:', !!signatureTitleElement);

    // Handle signature image based on status
    const urlParams = new URLSearchParams(window.location.search);
    const currentStatus = urlParams.get('status');
    const currentStatusLower = currentStatus ? currentStatus.toLowerCase() : '';

    console.log('🖼️ Current status for signature image:', currentStatus);
    console.log('📍 Signature space element:', !!signatureSpaceElement);

    if (signatureSpaceElement) {
        if (currentStatusLower === 'approved') {
            // For APPROVED status only - show signature image
            const signatureImage = findSignatureImage(approvedByName);
            console.log('🖼️ Signature image lookup for APPROVED status:', signatureImage);

            if (signatureImage) {
                // Display signature image
                const imagePath = `../../../../../image/${signatureImage}`;
                console.log('✅ Loading signature image from:', imagePath);

                signatureSpaceElement.innerHTML = `
                    <img src="${imagePath}" alt="Signature of ${approvedByName}" 
                         style="max-width: 100%; max-height: 100%; width: auto; height: auto; display: block; margin: 0; object-fit: contain;"
                         onerror="console.error('Failed to load signature image: ${imagePath}'); this.style.display='none';"
                         onload="console.log('✅ Signature image loaded successfully: ${imagePath}');" />
                `;
                console.log('✅ Signature image displayed for APPROVED status');
            } else {
                // Clear signature space if no image found for approved
                signatureSpaceElement.innerHTML = '';
                console.log('⚠️ No signature image found for APPROVED status');
            }
        } else {
            // For all other statuses (Received, etc.) - clear signature image space
            signatureSpaceElement.innerHTML = '';
            console.log('✅ Non-approved status (' + currentStatus + ') - signature image hidden, name and position will still show');
        }
    } else {
        console.error('❌ Signature space element not found!');
    }

    if (signatureNameElement) {
        signatureNameElement.textContent = approvedByName;
        console.log('✅ Setting signature name to:', approvedByName);
        console.log('✅ Signature name element found and updated');
        console.log('✅ Element textContent after update:', signatureNameElement.textContent);
        console.log('✅ Element visibility style:', window.getComputedStyle(signatureNameElement).display);
        console.log('✅ Element parent visibility:', window.getComputedStyle(signatureNameElement.parentElement).display);

        // Force visibility check
        if (approvedByName) {
            signatureNameElement.style.display = 'block';
            signatureNameElement.style.visibility = 'visible';
            console.log('✅ Forced signature name element to be visible');
        }
    } else {
        console.error('❌ Signature name element not found!');
        console.log('🔍 Available elements with "signature" in id:', document.querySelectorAll('[id*="signature"]'));
        console.log('🔍 All elements with class "signature-name":', document.querySelectorAll('.signature-name'));
    }

    if (signatureTitleElement) {
        signatureTitleElement.textContent = approvedPosition;
        console.log('✅ Setting signature title to:', approvedPosition);
        console.log('✅ Signature title element found and updated');
        console.log('✅ Element textContent after update:', signatureTitleElement.textContent);
        console.log('✅ Element visibility style:', window.getComputedStyle(signatureTitleElement).display);

        // Force visibility check
        if (approvedPosition) {
            signatureTitleElement.style.display = 'block';
            signatureTitleElement.style.visibility = 'visible';
            console.log('✅ Forced signature title element to be visible');
        }
    } else {
        console.error('❌ Signature title element not found!');
        console.log('🔍 All elements with class "signature-title":', document.querySelectorAll('.signature-title'));
    }

}

// Function to hide signature elements when status is not "Approved"
function hideSignatureElements() {
    console.log('🚫 Hiding signature elements - status is not Approved');

    // Hide signature name and title
    const signatureNameElement = document.getElementById('signatureName');
    const signatureTitleElement = document.getElementById('signatureTitle');
    const signatureSpaceElement = document.querySelector('.signature-space');

    if (signatureNameElement) {
        signatureNameElement.style.display = 'none';
        console.log('✅ Hidden signature name element');
    }

    if (signatureTitleElement) {
        signatureTitleElement.style.display = 'none';
        console.log('✅ Hidden signature title element');
    }

    if (signatureSpaceElement) {
        signatureSpaceElement.style.display = 'none';
        console.log('✅ Hidden signature space element');
    }

    // Store empty signature data for additional pages
    window.signatureData = {
        name: '',
        position: ''
    };

    console.log('✅ All signature elements hidden');
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

    // Enhanced signature data retrieval with multiple fallback sources - same logic as populateSignatureInformation
    if (invoice.arInvoiceApprovalSummary && invoice.arInvoiceApprovalSummary.approvedByName) {
        console.log('Using approvedByName from approval summary for additional page:', invoice.arInvoiceApprovalSummary.approvedByName);
        approvedByName = invoice.arInvoiceApprovalSummary.approvedByName;
        approvedPosition = invoice.arInvoiceApprovalSummary.approvedPosition || '';
    } else if (invoice.approvedByName) {
        console.log('Using direct approvedByName for additional page:', invoice.approvedByName);
        approvedByName = invoice.approvedByName;
        approvedPosition = invoice.approvedPosition || '';
    } else if (invoice.arInvoiceApprovalSummary && invoice.arInvoiceApprovalSummary.receivedByName) {
        console.log('Using receivedByName from approval summary for additional page:', invoice.arInvoiceApprovalSummary.receivedByName);
        approvedByName = invoice.arInvoiceApprovalSummary.receivedByName;
        approvedPosition = invoice.arInvoiceApprovalSummary.receivedPosition || 'Receiver';
    } else if (invoice.receivedByName) {
        console.log('Using receivedByName as fallback for additional page:', invoice.receivedByName);
        approvedByName = invoice.receivedByName;
        approvedPosition = 'Receiver';
    } else if (invoice.u_BSI_Expressiv_PreparedByName) {
        console.log('Using preparedByName as last resort for additional page:', invoice.u_BSI_Expressiv_PreparedByName);
        approvedByName = invoice.u_BSI_Expressiv_PreparedByName;
        approvedPosition = 'Prepared By';
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
        qrCodeElement.onclick = function () {
            showQRCodeData({ qrCodeSrc: qrCodeSrc }, 'QR Code from API');
        };

        // Handle image load error
        qrImage.onerror = function () {
            console.error('Error loading QR code image from qrCodeSrc');
            qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
            qrCodeElement.style.display = 'flex';
        };

        // Handle image load success
        qrImage.onload = function () {
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
        qrCodeElement.onclick = function () {
            showQRCodeData(qrCodeData);
        };

        // Handle image load error
        qrImage.onerror = function () {
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
                qrImage.onerror = function () {
                    qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
                    qrCodeElement.style.display = 'flex';
                };
            } catch (fallbackError) {
                qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
                qrCodeElement.style.display = 'flex';
            }
        };

        // Handle image load success
        qrImage.onload = function () {
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
        qrCodeElement.onclick = function () {
            showQRCodeData({ qrCodeSrc: qrCodeSrc }, 'QR Code from API');
        };

        // Handle image load error
        qrImage.onerror = function () {
            console.error(`Error loading QR code image from qrCodeSrc for page ${pageNum}`);
            qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
            qrCodeElement.style.display = 'flex';
        };

        // Handle image load success
        qrImage.onload = function () {
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
        qrCodeElement.onclick = function () {
            showQRCodeData(qrCodeData);
        };

        // Handle image load error
        qrImage.onerror = function () {
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
                qrImage.onerror = function () {
                    qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
                    qrCodeElement.style.display = 'flex';
                };
            } catch (fallbackError) {
                qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
                qrCodeElement.style.display = 'flex';
            }
        };

        // Handle image load success
        qrImage.onload = function () {
            console.log(`QR Code generated successfully using API for page ${pageNum}`);
        };

    } catch (error) {
        console.error(`Error generating QR code with API for page ${pageNum}:`, error);
        // Fallback to text display
        qrCodeElement.innerHTML = '<div style="font-size: 8px; text-align: center; padding: 5px;">QR Code Error</div>';
        qrCodeElement.style.display = 'flex';
    }
}

// formatCurrencyWithCurrency kept if needed elsewhere; safe to remove as financial summary removed
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

    // Hide footer on first page if there are multiple pages
    const footer = document.getElementById('footer');
    const paymentSummary = document.getElementById('paymentSummary');

    if (totalPages > 1) {
        if (footer) footer.style.display = 'none';
        if (paymentSummary) paymentSummary.style.display = 'none';
    } else {
        if (footer) footer.style.display = 'flex';
        if (paymentSummary) paymentSummary.style.display = 'flex';
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

    // Ensure payment instructions visibility according to pages
    if (totalPages > 1) {
        const paymentSummaryEl = document.getElementById('paymentSummary');
        if (paymentSummaryEl) paymentSummaryEl.style.display = 'none';
    } else {
        const paymentSummaryEl = document.getElementById('paymentSummary');
        if (paymentSummaryEl) paymentSummaryEl.style.display = 'flex';
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

    // Create payment instructions + financial summary if it's the last page
    let paymentSummaryHTML = '';
    if (isLastPage) {
        let currentInvoiceData = getCurrentInvoiceData();

        // If no complete data found, try to get it from the main loading process
        if (!currentInvoiceData) {
            console.log('No complete invoice data found in getCurrentInvoiceData(), using alternative approach...');

            // Try to get data from the global window object that was just populated
            if (window.latestInvoiceData) {
                currentInvoiceData = window.latestInvoiceData;
                console.log('Using latestInvoiceData from window object');
            } else {
                // Try to get from localStorage with a more direct approach
                const urlParams = new URLSearchParams(window.location.search);
                const stagingID = urlParams.get('stagingID');
                const docEntry = urlParams.get('docEntry');
                const identifier = stagingID || docEntry;

                if (identifier) {
                    try {
                        const storedData = localStorage.getItem(`invoice_${identifier}`);
                        if (storedData) {
                            const parsedData = JSON.parse(storedData);
                            // Use even incomplete data if it's all we have for additional pages
                            currentInvoiceData = parsedData;
                            console.log('Using stored data for additional page (may be incomplete)');
                        }
                    } catch (error) {
                        console.error('Error parsing stored invoice data:', error);
                    }
                }
            }

            // Final fallback - use default values
            if (!currentInvoiceData) {
                console.warn('No invoice data available, using default values for additional page');
                currentInvoiceData = {
                    docCur: 'IDR',
                    netPrice: 0,
                    discSum: 0,
                    netPriceAfterDiscount: 0,
                    dpp1112: 0,
                    docTax: 0,
                    grandTotal: 0,
                    acctName: '',
                    account: ''
                };
            }
        }

        const currency = currentInvoiceData?.docCur || 'IDR';
        paymentSummaryHTML = `
            <div class="payment-summary">
                <div class="payment-instructions">
                    <div class="payment-title">Please remit us in full amount to :</div>
                    <div id="bankInformation${pageNum}"></div>
                </div>
                <div class="financial-summary">
                    <table class="summary-table">
                        <tbody>
                            <tr class="line-after-total">
                                <td class="summary-label">Total</td>
                                <td class="summary-currency" id="totalCurrency${pageNum}">${currency}</td>
                                <td class="summary-amount" id="totalAmount${pageNum}">${formatCurrency(currentInvoiceData?.netPrice || 0)}</td>
                            </tr>
                            <tr class="line-after-discounted">
                                <td class="summary-label">Discounted</td>
                                <td class="summary-currency" id="discountCurrency${pageNum}">${currency}</td>
                                <td class="summary-amount" id="discountAmount${pageNum}">${formatCurrency(currentInvoiceData?.discSum || 0)}</td>
                            </tr>
                            <tr>
                                <td class="summary-label">Sales Amount</td>
                                <td class="summary-currency" id="salesCurrency${pageNum}">${currency}</td>
                                <td class="summary-amount" id="salesAmount${pageNum}">${formatCurrency(currentInvoiceData?.netPriceAfterDiscount || 0)}</td>
                            </tr>
                            <tr>
                                <td class="summary-label">Tax Base Other Value</td>
                                <td class="summary-currency" id="taxBaseCurrency${pageNum}">${currency}</td>
                                <td class="summary-amount" id="taxBase${pageNum}">${formatCurrency(currentInvoiceData?.dpp1112 || 0)}</td>
                            </tr>
                            <tr class="line-after-vat">
                                <td class="summary-label">VAT 12%</td>
                                <td class="summary-currency" id="vatCurrency${pageNum}">${currency}</td>
                                <td class="summary-amount" id="vatAmount${pageNum}">${formatCurrency(currentInvoiceData?.docTax || 0)}</td>
                            </tr>
                            <tr class="line-after-grand-total">
                                <td class="summary-label total-line">GRAND TOTAL</td>
                                <td class="summary-currency total-line" id="grandCurrency${pageNum}">${currency}</td>
                                <td class="summary-amount total-line" id="grandTotal${pageNum}">${formatCurrency(currentInvoiceData?.grandTotal || 0)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Populate bank information, financial summary, and QR Code for additional pages immediately after page creation
        console.log(`Setting up data population for page ${pageNum} with data:`, currentInvoiceData);

        // Use setTimeout to ensure DOM is ready, but populate all data together
        setTimeout(() => {
            // Get the most up-to-date data from window.latestInvoiceData if available
            let freshInvoiceData = currentInvoiceData;
            if (window.latestInvoiceData && isFinancialDataComplete(window.latestInvoiceData)) {
                freshInvoiceData = window.latestInvoiceData;
                console.log(`Using fresh complete data from window.latestInvoiceData for page ${pageNum}`);
            } else if (!currentInvoiceData) {
                console.error(`No valid invoice data available for page ${pageNum}`);
                return;
            }

            console.log(`Valid invoice data confirmed for page ${pageNum}, proceeding with population...`);
            console.log(`Financial data for page ${pageNum}:`, {
                netPrice: freshInvoiceData.netPrice,
                grandTotal: freshInvoiceData.grandTotal,
                docCur: freshInvoiceData.docCur
            });

            // Populate bank information
            try {
                populateBankInformationForPage(freshInvoiceData, pageNum);
            } catch (error) {
                console.error(`Error populating bank information for page ${pageNum}:`, error);
            }

            // Populate financial summary with fresh current data
            try {
                console.log(`About to populate financial summary for page ${pageNum}...`);
                populateFinancialSummaryForPage(freshInvoiceData, pageNum);
            } catch (error) {
                console.error(`Error populating financial summary for page ${pageNum}:`, error);
            }

            // Populate QR Code
            try {
                populateQRCodeForPage(freshInvoiceData, pageNum);
            } catch (error) {
                console.error(`Error populating QR code for page ${pageNum}:`, error);
            }

            console.log(`Completed data population for page ${pageNum}`);
        }, 200); // Slightly longer delay to ensure DOM is fully ready
    }

    // Create footer only if it's the last page
    let footerHTML = '';
    if (isLastPage) {
        // Get the current invoice data to populate signature
        const currentInvoiceData = getCurrentInvoiceData();

        // Get status from URL parameters to determine if signatures should be shown
        if (isStatusApproved()) {
            // Status is Approved, show signatures
            const signatureData = getSignatureDataFromInvoice(currentInvoiceData);

            // Debug: Log what name is being set for additional page
            console.log(`Setting signature data for page ${pageNum}:`, signatureData);
            console.log(`Current invoice data for page ${pageNum}:`, currentInvoiceData);

            // Get signature image for this approver - only for APPROVED status
            const urlParams = new URLSearchParams(window.location.search);
            const currentStatus = urlParams.get('status');
            const currentStatusLower = currentStatus ? currentStatus.toLowerCase() : '';

            let signatureImageHTML = '';
            if (currentStatusLower === 'approved') {
                const signatureImage = findSignatureImage(signatureData.name);
                signatureImageHTML = signatureImage ?
                    `<img src="../../../../../image/${signatureImage}" alt="Signature of ${signatureData.name}" 
                          style="max-width: 100%; max-height: 100%; width: auto; height: auto; display: block; margin: 0; object-fit: contain;"
                          onerror="console.error('Failed to load signature image for page ${pageNum}: ../../../../../image/${signatureImage}'); this.style.display='none';"
                          onload="console.log('✅ Signature image loaded for page ${pageNum}: ../../../../../image/${signatureImage}');" />` : '';
                console.log(`📄 Page ${pageNum} - APPROVED status: signature image ${signatureImage ? 'included' : 'not available'}`);
            } else {
                console.log(`📄 Page ${pageNum} - ${currentStatus} status: signature image hidden (name and position only)`);
            }

            footerHTML = `
                <div class="footer">
                    <div class="signature-section">
                        <img src="../../../../../image/StampKansai.png" alt="Kansai Stamp" class="signature-stamp">
                        <div class="qr-code">QR CODE</div>
                        <div class="signature-space">${signatureImageHTML}</div>
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
        } else {
            // Status is not Approved, create footer without signatures
            console.log(`Status is not Approved (${getCurrentStatus()}), creating footer without signatures for page ${pageNum}`);

            footerHTML = `
                <div class="footer">
                    <div class="signature-section">
                        <img src="../../../../../image/StampKansai.png" alt="Kansai Stamp" class="signature-stamp">
                        <div class="qr-code">QR CODE</div>
                        <!-- Signature elements hidden for non-approved status -->
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

// DEBUG FUNCTIONS - For manual testing in console
window.debugSignature = function () {
    console.log('🔍 SIGNATURE DEBUG INFORMATION:');
    console.log('📍 Signature Name Element:', document.getElementById('signatureName'));
    console.log('📍 Signature Title Element:', document.getElementById('signatureTitle'));
    console.log('📍 Current content:', {
        name: document.getElementById('signatureName')?.textContent,
        title: document.getElementById('signatureTitle')?.textContent
    });
    console.log('📍 Latest invoice data:', window.latestInvoiceData);
    console.log('📍 Signature data:', window.signatureData);

    // Check if elements are visible
    const nameEl = document.getElementById('signatureName');
    const titleEl = document.getElementById('signatureTitle');
    if (nameEl) {
        console.log('📍 Name element styles:', {
            display: window.getComputedStyle(nameEl).display,
            visibility: window.getComputedStyle(nameEl).visibility,
            opacity: window.getComputedStyle(nameEl).opacity
        });
    }
    if (titleEl) {
        console.log('📍 Title element styles:', {
            display: window.getComputedStyle(titleEl).display,
            visibility: window.getComputedStyle(titleEl).visibility,
            opacity: window.getComputedStyle(titleEl).opacity
        });
    }
};

window.forceSignature = function (name = 'Test User', position = 'Test Position') {
    console.log('🔧 FORCING SIGNATURE:', name, position);
    const nameEl = document.getElementById('signatureName');
    const titleEl = document.getElementById('signatureTitle');
    const signatureSpaceEl = document.querySelector('.signature-space');

    if (nameEl) {
        nameEl.textContent = name;
        nameEl.style.display = 'block';
        nameEl.style.visibility = 'visible';
        nameEl.style.opacity = '1';
        console.log('✅ Forced name element');
    } else {
        console.error('❌ Name element not found');
    }

    if (titleEl) {
        titleEl.textContent = position;
        titleEl.style.display = 'block';
        titleEl.style.visibility = 'visible';
        titleEl.style.opacity = '1';
        console.log('✅ Forced title element');
    } else {
        console.error('❌ Title element not found');
    }

    // Try to load signature image
    if (signatureSpaceEl) {
        const signatureImage = findSignatureImage(name);
        if (signatureImage) {
            const imagePath = `../../../../../image/${signatureImage}`;
            signatureSpaceEl.innerHTML = `
                <img src="${imagePath}" alt="Signature of ${name}" 
                     style="max-width: 100%; max-height: 100%; width: auto; height: auto; display: block; margin: 0; object-fit: contain;"
                     onerror="console.error('Failed to load signature image: ${imagePath}'); this.style.display='none';"
                     onload="console.log('✅ Signature image loaded: ${imagePath}');" />
            `;
            console.log('✅ Forced signature image:', imagePath);
        } else {
            signatureSpaceEl.innerHTML = '';
            console.log('⚠️ No signature image found for:', name);
        }
    } else {
        console.error('❌ Signature space element not found');
    }

    console.log('🔧 Force signature complete');
};

// Test function for signature images
window.testSignatureImages = function () {
    console.log('🧪 TESTING ALL SIGNATURE IMAGES');
    const availableSignatures = Object.keys(SIGNATURE_IMAGE_MAPPING);
    console.log('📋 Available signatures:', availableSignatures);

    availableSignatures.forEach((name, index) => {
        setTimeout(() => {
            console.log(`🧪 Testing signature ${index + 1}/${availableSignatures.length}: ${name}`);
            window.forceSignature(name, 'Test Position');
        }, index * 2000); // 2 second delay between each test
    });
};

// Debug function to force signature population
window.forceSignaturePopulation = function () {
    console.log('🔧 FORCE SIGNATURE POPULATION');
    isSignatureProcessed = false; // Reset flag

    if (currentInvoiceData) {
        console.log('📄 Using current invoice data:', currentInvoiceData);
        populateSignatureSync(currentInvoiceData);
    } else {
        console.log('❌ No current invoice data available');
    }
};

console.log('🔧 Debug functions loaded. Use debugSignature() and forceSignature() in console.');

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

// Utility function to format currency (no forced rounding)
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(Number(amount));
}

// Utility to format currency rounded to whole rupiah
function formatCurrencyRounded(amount) {
    if (amount === null || amount === undefined) return '0';
    const rounded = Math.round(Number(amount));
    return new Intl.NumberFormat('en-US').format(rounded);
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
document.addEventListener('DOMContentLoaded', function () {
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
    document.addEventListener('keydown', function (e) {
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
            taxBase: invoice.dpp1112 || 0,     // API Field: "dpp1112"
            vatAmount: invoice.docTax || 0,   // API Field: "vatSum"
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
        qrImage.onerror = function () {
            console.error(`Error loading QR code image from source${pageNum ? ` for page ${pageNum}` : ''}`);
            fallbackFunction();
        };

        // Handle image load success
        qrImage.onload = function () {
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
    const requiredFields = ['netPrice', 'discSum', 'dpp1112', 'docTax', 'grandTotal'];
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
        dpp1112: invoice.dpp1112,
        vatSum: invoice.docTax,
        grandTotal: invoice.grandTotal
    });

    const isComplete = hasAllFields && hasNonZeroValue;
    console.log(`Financial data is ${isComplete ? 'COMPLETE' : 'INCOMPLETE'}`);

    return isComplete;
}