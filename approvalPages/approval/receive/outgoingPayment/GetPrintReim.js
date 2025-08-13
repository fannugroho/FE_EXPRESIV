// Global variables for data storage
let reimbursementId = '';
let allCategories = [];
let allAccountNames = [];
let transactionTypes = [];
let businessPartners = [];

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

// Date formatting function with time details
function formatDateTimeDetailed(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return dateString; // Return original if invalid
    }

    // Format: DD/MM/YYYY HH:MM:SS
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// UI State management functions
function showLoading() {
    const loadingContainer = document.getElementById('loadingContainer');
    const mainContent = document.getElementById('mainContent');
    const errorContainer = document.getElementById('errorContainer');

    if (loadingContainer) loadingContainer.classList.remove('hidden');
    if (mainContent) mainContent.classList.add('hidden');
    if (errorContainer) errorContainer.classList.add('hidden');
}

function showMainContent() {
    const loadingContainer = document.getElementById('loadingContainer');
    const mainContent = document.getElementById('mainContent');
    const errorContainer = document.getElementById('errorContainer');

    if (loadingContainer) loadingContainer.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');
    if (errorContainer) errorContainer.classList.add('hidden');
}

function showErrorContainer(message) {
    const loadingContainer = document.getElementById('loadingContainer');
    const mainContent = document.getElementById('mainContent');
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');

    if (loadingContainer) loadingContainer.classList.add('hidden');
    if (mainContent) mainContent.classList.add('hidden');
    if (errorContainer) errorContainer.classList.remove('hidden');
    if (errorMessage) errorMessage.textContent = message;
}

// Document ready event listener
document.addEventListener("DOMContentLoaded", function () {
    console.log('=== DETAIL REIMBURSEMENT PAGE INITIALIZATION ===');
    console.log('DOMContentLoaded event fired');
    console.log('BASE_URL:', BASE_URL);

    // Show loading initially
    showLoading();

    // Check if BASE_URL is valid
    if (!BASE_URL || BASE_URL.trim() === '') {
        console.error('BASE_URL is not defined or empty');
        showErrorContainer('Application configuration is invalid. Please contact administrator.');
        return;
    }

    // Check if we have a valid reimbursement ID
    const reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId) {
        console.error('No valid reimbursement ID found in URL');
        showErrorContainer('No valid reimbursement ID found in URL. Please go back and try again.');
        return;
    }

    // Check authentication
    if (!isAuthenticated()) {
        console.error('User not authenticated');
        showErrorContainer('Please login again to access this page.');
        setTimeout(() => {
            logoutAuth();
        }, 2000);
        return;
    }

    // Fetch ONLY reimbursement data - optimized for single API focus
    fetchReimbursementDataOnly();
});

// Optimized function to fetch ONLY reimbursement data with SMART FALLBACK
async function fetchReimbursementDataOnly() {
    try {
        console.log('🎯 FOCUSED: Fetching ONLY reimbursement data...');

        // Fetch ONLY the main reimbursement data first
        await fetchReimbursementData();

        // Show main content after reimbursement data is loaded
        showMainContent();

        // SMART FALLBACK: Conditional user lookup for UUIDs that aren't resolved
        await smartFallbackUserLookup();

        console.log('✅ FOCUSED: Reimbursement data display complete with smart fallback!');
    } catch (error) {
        console.error('❌ FOCUSED: Error fetching reimbursement data:', error);
        showErrorContainer('Failed to load reimbursement data. Please try again.');
    }
}

// Print-specific function to populate reimbursement details table
function populateReimbursementDetailsForPrint(details) {
    console.log('📄 Populating reimbursement details for print...', details);

    const tableBody = document.getElementById('reimbursementDetails');
    if (!tableBody) {
        console.error('❌ Details table body #reimbursementDetails not found');
        // Let's try to find alternative table elements
        const alternativeTableBody = document.querySelector('table tbody');
        if (alternativeTableBody) {
            console.log('✅ Found alternative table body element');
            alternativeTableBody.innerHTML = '';
        }
        return;
    }

    tableBody.innerHTML = '';
    let totalAmount = 0;

    if (details && Array.isArray(details) && details.length > 0) {
        console.log('✅ Found', details.length, 'detail items to populate');
        details.forEach((item, index) => {
            const row = document.createElement('tr');

            // Handle different possible amount field names
            const amount = parseFloat(item.amount) || parseFloat(item.totalAmount) || parseFloat(item.value) || 0;
            totalAmount += amount;

            // Handle different possible field names to match HTML columns
            const category = item.category || item.categoryName || '';
            const accountName = item.accountName || item.account || '';
            const glAccount = item.glAccount || item.glAccountNumber || item.accountNumber || '';
            const description = item.description || item.lineDescription || item.itemDescription || '';

            row.innerHTML = `
                <td style="padding: 8px; border: 1px solid #ddd;">${category}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${accountName}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${glAccount}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${description}</td>
                <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${amount.toLocaleString('id-ID')}</td>
                <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">-</td>
            `;
            tableBody.appendChild(row);
            console.log(`📝 Added row ${index + 1}: ${category} | ${accountName} | ${description} - ${amount}`);
        });
    } else {
        console.warn('⚠️ No details provided or empty array');
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 20px; border: 1px solid #ddd; color: #666;">
                No details available
            </td>
        `;
        tableBody.appendChild(emptyRow);
    }    // Update total amount display
    const totalElement = document.getElementById('totalAmount');
    const totalFooterElement = document.getElementById('totalAmountFooter');
    const amountTextElement = document.getElementById('amountText');

    if (totalElement) {
        totalElement.textContent = totalAmount.toLocaleString('id-ID');
        console.log('💰 Total amount updated:', totalAmount);
    }

    if (totalFooterElement) {
        totalFooterElement.textContent = totalAmount.toLocaleString('id-ID');
        console.log('💰 Total amount footer updated:', totalAmount);
    }

    if (amountTextElement) {
        amountTextElement.textContent = `IDR ${totalAmount.toLocaleString('id-ID')}`;
        console.log('💰 Amount payment updated:', totalAmount);
    }

    // Convert amount to words
    const amountWordsElement = document.getElementById('amountInWords');
    const amountInWordTextElement = document.getElementById('amountInWordText');

    if (amountWordsElement) {
        amountWordsElement.textContent = convertAmountToWords(totalAmount);
        console.log('🔤 Amount in words updated (old element)');
    }

    if (amountInWordTextElement) {
        amountInWordTextElement.textContent = convertAmountToWords(totalAmount);
        console.log('🔤 Amount in word text updated:', convertAmountToWords(totalAmount));
    }

    return totalAmount;
}

// Convert amount to words (English - lowercase format)
function convertAmountToWords(amount) {
    if (amount === 0) return 'zero';

    const units = ['', 'thousand', 'million', 'billion', 'trillion'];
    const numbers = [
        '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
        'sixteen', 'seventeen', 'eighteen', 'nineteen'
    ];

    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    function convertHundreds(num) {
        let result = '';

        if (num >= 100) {
            result += numbers[Math.floor(num / 100)] + ' hundred ';
            num %= 100;
        }

        if (num >= 20) {
            result += tens[Math.floor(num / 10)];
            num %= 10;
            if (num > 0) {
                result += '-' + numbers[num] + ' ';
            } else {
                result += ' ';
            }
        } else if (num >= 10) {
            result += numbers[num] + ' ';
            return result;
        } else if (num > 0) {
            result += numbers[num] + ' ';
        }

        return result;
    }

    let result = '';
    let unitIndex = 0;

    while (amount > 0) {
        const chunk = amount % 1000;
        if (chunk !== 0) {
            let chunkText = convertHundreds(chunk);
            if (unitIndex > 0) {
                chunkText += units[unitIndex] + ' ';
            }
            result = chunkText + result;
        }
        amount = Math.floor(amount / 1000);
        unitIndex++;
    }

    return result.trim();
}// Print functionality
function printDocument() {
    console.log('🖨️ Initiating print...');

    // Hide print controls during printing
    const printControls = document.querySelector('.print-controls');
    if (printControls) {
        printControls.style.display = 'none';
    }

    // Trigger browser print dialog
    window.print();

    // Show print controls after printing
    setTimeout(() => {
        if (printControls) {
            printControls.style.display = 'flex';
        }
    }, 1000);
}

// SMART FALLBACK: Function to lookup users and departments only if needed
async function smartFallbackUserLookup() {
    try {
        console.log('🧠 SMART FALLBACK: Checking if user/department lookup needed...');

        // Check if we have IDs but no names displayed
        const payToText = document.getElementById('payToText');
        const departmentField = document.getElementById('department');

        let needsUserLookup = false;
        let needsDepartmentLookup = false;

        // Check if payTo field shows only ID
        if (payToText && payToText.textContent.includes('User ID:')) {
            console.log('🔍 Pay To field shows ID only, need user lookup');
            needsUserLookup = true;
        }

        // Check if approval fields show only IDs
        const approvalFields = ['preparedBy', 'acknowledgeBy', 'checkedBy', 'approvedByText', 'receivedBy'];
        approvalFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.textContent.includes('User ID:')) {
                console.log(`🔍 ${fieldId} shows ID only, need user lookup`);
                needsUserLookup = true;
            }
        });

        // Check if department field is empty or shows generic value
        if (departmentField && (!departmentField.value || departmentField.value === 'Select Department')) {
            console.log('🔍 Department field empty, need department lookup');
            needsDepartmentLookup = true;
        }

        // Only fetch if needed
        if (needsUserLookup || needsDepartmentLookup) {
            console.log('🚀 SMART FALLBACK: Fetching additional data for lookup...');

            const promises = [];

            if (needsUserLookup) {
                console.log('📞 Fetching users for name lookup...');
                promises.push(fetchUsers());
            }

            if (needsDepartmentLookup) {
                console.log('📞 Fetching departments for dropdown...');
                promises.push(fetchDepartments());
            }

            await Promise.all(promises);

            // Re-populate fields with proper names now that we have the lookup data
            if (needsUserLookup && window.allUsers) {
                console.log('🔄 Re-populating user fields with actual names...');
                await rePopulateUserFieldsWithNamesForPrint();
            }

            // Re-populate department field from the original API data
            if (needsDepartmentLookup) {
                console.log('🔄 Re-populating department field...');
                await rePopulateDepartmentField();
            }

            console.log('✅ SMART FALLBACK: Lookup complete!');
        } else {
            console.log('✅ SMART FALLBACK: No additional lookup needed, all names already present');
        }

    } catch (error) {
        console.warn('⚠️ SMART FALLBACK: Error during fallback lookup:', error);
        // Don't throw error, just log warning - main data is already loaded
    }
}

// Function to re-populate user fields with actual names after user data is loaded (Print Format)
async function rePopulateUserFieldsWithNamesForPrint() {
    try {
        console.log('🔄 Re-populating user fields with actual names for print format...');

        // Extract payTo ID and lookup name for print format
        const payToText = document.getElementById('payToText');
        if (payToText && payToText.textContent.includes('User ID:')) {
            const payToId = payToText.textContent.replace('User ID: ', '').trim();
            console.log('🔍 Looking up Pay To name for ID:', payToId);
            populatePayToFieldForPrint(payToId);
        }

        // Extract approval IDs and lookup names for print format
        const approvalMappings = [
            { fieldId: 'preparedBy', extractPattern: 'User ID: ' },
            { fieldId: 'acknowledgeBy', extractPattern: 'User ID: ' },
            { fieldId: 'checkedBy', extractPattern: 'User ID: ' },
            { fieldId: 'approvedByText', extractPattern: 'User ID: ' },
            { fieldId: 'receivedBy', extractPattern: 'User ID: ' }
        ];

        approvalMappings.forEach(({ fieldId, extractPattern }) => {
            const field = document.getElementById(fieldId);
            if (field && field.textContent.includes(extractPattern)) {
                const userId = field.textContent.replace(extractPattern, '').trim();
                console.log(`🔍 Looking up ${fieldId} name for ID:`, userId);
                populateApprovalFieldForPrint(fieldId, userId);
            }
        });

        console.log('✅ User fields re-population complete for print format');

    } catch (error) {
        console.error('❌ Error re-populating user fields for print:', error);
    }
}

// Function to populate payTo field for print format
function populatePayToFieldForPrint(payToId) {
    if (!payToId || !window.allUsers) {
        console.log('⚠️ populatePayToFieldForPrint: Missing payToId or allUsers not loaded');
        return;
    }

    console.log('💰 populatePayToFieldForPrint called with payToId:', payToId);

    // Convert both to string for comparison
    const payToIdStr = payToId.toString();

    const matchingUser = window.allUsers.find(user => {
        const userStr = user.id.toString();
        return userStr === payToIdStr;
    });

    if (matchingUser) {
        const displayText = matchingUser.fullName || matchingUser.name || matchingUser.username || '';
        console.log('✅ Pay To display text:', displayText);
        document.getElementById('payToText').textContent = displayText;
    } else {
        console.log('❌ No matching user found for Pay To ID:', payToId);
        // Keep the original ID if no match found
    }
}

// Function to populate approval field for print format
function populateApprovalFieldForPrint(fieldId, userId) {
    if (!userId || !window.allUsers) {
        console.log(`⚠️ populateApprovalFieldForPrint: Missing userId or allUsers not loaded for ${fieldId}`);
        return;
    }

    console.log(`👤 populateApprovalFieldForPrint called for ${fieldId} with userId:`, userId);

    // Convert both to string for comparison
    const userIdStr = userId.toString();

    const matchingUser = window.allUsers.find(user => {
        const userStr = user.id.toString();
        return userStr === userIdStr;
    });

    if (matchingUser) {
        const displayName = matchingUser.fullName || matchingUser.name || matchingUser.username || '';
        console.log(`✅ ${fieldId} display name:`, displayName);
        document.getElementById(fieldId).textContent = displayName;
    } else {
        console.log(`❌ No matching user found for ${fieldId} ID:`, userId);
        // Keep the original ID if no match found
    }
}

// Function to re-populate user fields with actual names after user data is loaded
async function rePopulateUserFieldsWithNames() {
    try {
        console.log('🔄 Re-populating user fields with actual names...');

        // Get the current form data
        const payToField = document.getElementById('payToSearch');
        const departmentField = document.getElementById('department');

        // Extract payTo ID and lookup name
        if (payToField && payToField.value.includes('User ID:')) {
            const payToId = payToField.value.replace('User ID: ', '').trim();
            console.log('🔍 Looking up Pay To name for ID:', payToId);
            populatePayToField(payToId);
        }

        // Extract approval IDs and lookup names
        const approvalMappings = [
            { fieldId: 'preparedBySearch', extractPattern: 'User ID: ' },
            { fieldId: 'acknowledgeBySearch', extractPattern: 'User ID: ' },
            { fieldId: 'checkedBySearch', extractPattern: 'User ID: ' },
            { fieldId: 'approvedBySearch', extractPattern: 'User ID: ' },
            { fieldId: 'receivedBySearch', extractPattern: 'User ID: ' }
        ];

        approvalMappings.forEach(({ fieldId, extractPattern }) => {
            const field = document.getElementById(fieldId);
            if (field && field.value.includes(extractPattern)) {
                const userId = field.value.replace(extractPattern, '').trim();
                const fieldPrefix = fieldId.replace('Search', '');
                console.log(`🔍 Looking up ${fieldPrefix} name for ID:`, userId);
                populateApprovalField(fieldPrefix, userId);
            }
        });

        console.log('✅ User fields re-population complete');

    } catch (error) {
        console.error('❌ Error re-populating user fields:', error);
    }
}

// Function to re-populate department field after departments are loaded
async function rePopulateDepartmentField() {
    try {
        console.log('🔄 Re-populating department field...');

        // Get the original department value from the global reimbursement data
        // We need to store this when we first populate the form
        const storedDepartmentValue = window.originalReimbursementData?.department;

        if (storedDepartmentValue) {
            const departmentField = document.getElementById('department');
            if (departmentField) {
                // Try to set the value
                departmentField.value = storedDepartmentValue;
                console.log('✅ Department field set to:', storedDepartmentValue);

                // If the value didn't stick (option doesn't exist), add it manually
                if (departmentField.value !== storedDepartmentValue) {
                    const option = document.createElement('option');
                    option.value = storedDepartmentValue;
                    option.textContent = storedDepartmentValue;
                    departmentField.appendChild(option);
                    departmentField.value = storedDepartmentValue;
                    console.log('✅ Added new department option:', storedDepartmentValue);
                }
            }
        } else {
            console.log('⚠️ No original department value found');
        }

    } catch (error) {
        console.error('❌ Error re-populating department field:', error);
    }
}

// DEPRECATED: Original function that fetched multiple APIs
async function fetchAllData() {
    console.warn('⚠️ fetchAllData is deprecated. Use fetchReimbursementDataOnly() for better performance.');
    try {
        // Fetch all data in parallel
        await Promise.all([
            fetchUsers(),
            fetchDepartments(),
            fetchTransactionTypes(),
            fetchBusinessPartners()
        ]);

        // Fetch reimbursement data after other data is loaded
        await fetchReimbursementData();

        // Show main content after everything is loaded
        showMainContent();
    } catch (error) {
        console.error('Error fetching data:', error);
        showErrorContainer('Failed to load data. Please try again.');
    }
}

// Function to get reimbursement ID from URL
function getReimbursementIdFromUrl() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const reimId = urlParams.get('reim-id');

        console.log('URL parameters:', window.location.search);
        console.log('Extracted reim-id:', reimId);

        if (!reimId) {
            console.error('No reim-id parameter found in URL');
            return null;
        }

        if (typeof reimId === 'string' && reimId.trim() === '') {
            console.error('reim-id parameter is empty');
            return null;
        }

        const cleanId = reimId.trim();

        if (!isNaN(cleanId)) {
            const numId = parseInt(cleanId);
            if (numId <= 0) {
                console.error('Invalid reim-id: must be a positive number');
                return null;
            }
            return numId.toString();
        }

        return cleanId;

    } catch (error) {
        console.error('Error parsing URL parameters:', error);
        return null;
    }
}

// Function to fetch reimbursement data
async function fetchReimbursementData() {
    reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId) {
        console.error('No reimbursement ID found in URL');
        showErrorContainer('No reimbursement ID found in URL. Please go back and try again.');
        return;
    }

    try {
        console.log('Fetching reimbursement data for ID:', reimbursementId);
        console.log('API URL:', `${BASE_URL}/api/reimbursements/${reimbursementId}`);

        // Use makeAuthenticatedRequest from auth.js
        const response = await makeAuthenticatedRequest(`/api/reimbursements/${reimbursementId}`, {
            method: 'GET'
        });

        // Handle different HTTP status codes
        if (response.status === 400) {
            console.error('Bad Request (400): Invalid reimbursement ID or malformed request');
            showErrorContainer('The reimbursement ID is invalid or the request is malformed. Please check the URL and try again.');
            return;
        }

        if (response.status === 404) {
            console.error('Not Found (404): Reimbursement not found');
            showErrorContainer('The requested reimbursement document was not found. It may have been deleted or you may not have permission to view it.');
            return;
        }

        if (response.status === 500) {
            console.error('Internal Server Error (500): Server error');
            showErrorContainer('An internal server error occurred. Please try again later.');
            return;
        }

        if (!response.ok) {
            console.error('HTTP Error:', response.status, response.statusText);
            showErrorContainer(`Failed to fetch reimbursement data. Status: ${response.status} ${response.statusText}`);
            return;
        }

        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            showErrorContainer('The server returned an invalid response. Please try again.');
            return;
        }

        if (result && result.status && result.code === 200) {
            if (!result.data) {
                console.error('No data received from API');
                showErrorContainer('No reimbursement data was received from the server.');
                return;
            }

            console.log('Reimbursement data received:', result.data);

            // Copy data to expected properties if not present
            if (!result.data.reimbursementDetails && result.data.details) {
                console.log('Copying details to reimbursementDetails');
                result.data.reimbursementDetails = result.data.details;
            }

            if (!result.data.reimbursementAttachments && result.data.attachments) {
                console.log('Copying attachments to reimbursementAttachments');
                result.data.reimbursementAttachments = result.data.attachments;
            }

            // Populate form data
            populateFormData(result.data);

            // Display attachments
            if (result.data.reimbursementAttachments && result.data.reimbursementAttachments.length > 0) {
                console.log('Displaying attachments:', result.data.reimbursementAttachments.length, 'files');
                displayAttachments(result.data.reimbursementAttachments);
            } else if (result.data.attachments && result.data.attachments.length > 0) {
                console.log('Displaying attachments:', result.data.attachments.length, 'files');
                displayAttachments(result.data.attachments);
            } else {
                console.log('No attachments to display');
                document.getElementById('attachmentsList').innerHTML = '';
            }

            // Display revision history
            renderRevisionHistory(result.data.revisions);

            // Display rejection remarks
            displayRejectionRemarks(result.data);

        } else {
            console.error('Failed to fetch reimbursement data:', result);
            let errorMessage = 'Failed to load reimbursement data. Please try again.';

            if (result && typeof result === 'object') {
                errorMessage = result.message || result.error || result.errorMessage || errorMessage;
            } else if (typeof result === 'string') {
                errorMessage = result;
            }

            showErrorContainer(errorMessage);
        }
    } catch (error) {
        console.error('Error fetching reimbursement data:', error);

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showErrorContainer('Unable to connect to the server. Please check your internet connection and try again.');
        } else if (error.name === 'SyntaxError') {
            showErrorContainer('The server returned an invalid response format. Please try again.');
        } else {
            showErrorContainer(`An unexpected error occurred: ${error.message}`);
        }
    }
}

// OPTIMIZED: Function to populate form data - FOCUSED on API data only + Print Format
function populateFormData(data) {
    console.log('🎯 FOCUSED: Populating print format with reimbursement API data:', data);
    console.log('🔍 Full data structure analysis:');
    console.log('- Top level keys:', Object.keys(data));
    console.log('- Has approval object:', !!data.approval);
    if (data.approval) {
        console.log('- Approval keys:', Object.keys(data.approval));
        console.log('- Approval data:', data.approval);
    }

    // Store original data for later reference (for smart fallback)
    window.originalReimbursementData = data;

    // Populate header information for print format
    document.getElementById('voucherNoText').textContent = data.voucherNo || '';
    document.getElementById('batchNoText').textContent = data.batchNo || data.voucherNo || '';
    document.getElementById('payToText').textContent = data.payToName || data.requesterName || '';

    // Format and populate submission date with time details
    if (data.submissionDate) {
        const formattedDateTime = formatDateTimeDetailed(data.submissionDate);
        document.getElementById('submissionDateText').textContent = formattedDateTime;
        console.log('📅 Submission date with time:', formattedDateTime);
    }

    // Populate transaction type and other details
    document.getElementById('typeOfTransactionText').textContent = data.typeOfTransaction || '';
    document.getElementById('departmentValue').textContent = data.department || '';
    document.getElementById('statusValue').textContent = data.status || '';
    document.getElementById('currencyText').textContent = data.currency || 'IDR';
    document.getElementById('refdoc').textContent = data.referenceDoc || '';
    document.getElementById('remarksText').textContent = data.remarks || '';

    // FOCUSED: Populate user fields directly from API data (no external user lookup needed)
    populateUserFieldsFromAPIData(data);

    // Populate reimbursement details table for print format
    if (data.reimbursementDetails && data.reimbursementDetails.length > 0) {
        console.log('🎯 FOCUSED: Populating reimbursement details for print:', data.reimbursementDetails.length, 'rows');
        console.log('📊 Details data:', data.reimbursementDetails);
        populateReimbursementDetailsForPrint(data.reimbursementDetails);
    } else if (data.details && data.details.length > 0) {
        console.log('🎯 FOCUSED: Populating details for print:', data.details.length, 'rows');
        console.log('📊 Details data:', data.details);
        populateReimbursementDetailsForPrint(data.details);
    } else {
        console.warn('⚠️ FOCUSED: No reimbursement details found in API response');
        console.log('🔍 Complete API data structure:', data);
        console.log('🔍 Available properties:', Object.keys(data));

        // Check for alternative property names
        const possibleDetailKeys = Object.keys(data).filter(key =>
            key.toLowerCase().includes('detail') ||
            key.toLowerCase().includes('item') ||
            key.toLowerCase().includes('line')
        );
        console.log('🔍 Possible detail keys found:', possibleDetailKeys);

        const tableBody = document.getElementById('reimbursementDetails');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-gray-500">No details available</td></tr>';
        }
    }

    console.log('✅ FOCUSED: Print format population complete using only API data!');

    // Check for missing user names and trigger smart fallback if needed
    const hasPayToName = data.payToName;
    const hasAllApprovalNames = data.preparedByName && data.acknowledgedByName &&
        data.checkedByName && data.approvedByName && data.receivedByName;

    if (!hasPayToName || !hasAllApprovalNames) {
        console.log('🔄 SMART FALLBACK: Some user names missing, triggering fallback lookup...');
        smartFallbackUserLookup(data);
    }
}

// OPTIMIZED: Populate user fields directly from API response data for print format
function populateUserFieldsFromAPIData(data) {
    console.log('🎯 FOCUSED: Populating user fields from API data for print format...');

    // Pay To field - use data directly from API
    if (data.payToName) {
        document.getElementById('payToText').textContent = data.payToName;
        console.log('✅ Pay To populated from API:', data.payToName);
    } else if (data.payTo) {
        document.getElementById('payToText').textContent = `User ID: ${data.payTo}`;
        console.log('⚠️ Pay To ID only:', data.payTo);
    }

    // Approval fields - use names directly from API for print format
    const approvalFields = [
        { textId: 'preparedBy', name: 'preparedByName', id: data.preparedBy, dateId: 'preparedByDate' },
        { textId: 'acknowledgeBy', name: 'acknowledgedByName', id: data.acknowledgedBy, dateId: 'acknowledgeByDate' },
        { textId: 'checkedBy', name: 'checkedByName', id: data.checkedBy, dateId: 'checkedByDate' },
        { textId: 'approvedByText', name: 'approvedByName', id: data.approvedBy, dateId: 'approvedByDate' },
        { textId: 'receivedBy', name: 'receivedByName', id: data.receivedBy, dateId: 'receivedByDate' }
    ];

    approvalFields.forEach(({ textId, name, id, dateId }) => {
        const textElement = document.getElementById(textId);
        if (textElement) {
            if (data[name]) {
                textElement.textContent = data[name];
                console.log(`✅ ${textId} populated from API:`, data[name]);
            } else if (id) {
                textElement.textContent = `User ID: ${id}`;
                console.log(`⚠️ ${textId} ID only:`, id);
            }
        }

        // Populate approval dates if available using helper function
        const dateElement = document.getElementById(dateId);
        if (dateElement) {
            const dateFieldMap = {
                'preparedByDate': ['preparedDate', 'preparedByDate'],
                'acknowledgeByDate': ['acknowledgedDate', 'acknowledgeByDate', 'acknowledgedByDate'],
                'checkedByDate': ['checkedDate', 'checkedByDate'],
                'approvedByDate': ['approvedDate', 'approvedByDate'],
                'receivedByDate': ['receivedDate', 'receivedByDate']
            };

            const possibleFields = dateFieldMap[dateId];
            let dateValue = null;

            // Try to find date in multiple possible locations
            if (possibleFields) {
                // First try in data.approval
                if (data.approval) {
                    for (const field of possibleFields) {
                        if (data.approval[field]) {
                            dateValue = data.approval[field];
                            console.log(`📅 Found ${dateId} in data.approval.${field}:`, dateValue);
                            break;
                        }
                    }
                }

                // If not found, try in root data
                if (!dateValue) {
                    for (const field of possibleFields) {
                        if (data[field]) {
                            dateValue = data[field];
                            console.log(`📅 Found ${dateId} in data.${field}:`, dateValue);
                            break;
                        }
                    }
                }
            }

            if (dateValue) {
                const formattedDateTime = formatDateTimeDetailed(dateValue);
                dateElement.textContent = formattedDateTime;
                console.log(`✅ ${dateId} populated:`, formattedDateTime);
            } else {
                console.log(`⚠️ No date found for ${dateId}`);
                console.log(`🔍 Available approval data:`, data.approval);
                console.log(`🔍 Possible fields checked:`, possibleFields);
            }
        }
    });
}

// Function to populate payTo field
function populatePayToField(payToId) {
    if (!payToId || !window.allUsers) {
        console.log('⚠️ populatePayToField: Missing payToId or allUsers not loaded');
        return;
    }

    console.log('💰 populatePayToField called with payToId:', payToId);
    console.log('📊 Available users:', window.allUsers.length);

    // Convert both to string for comparison
    const payToIdStr = payToId.toString();

    // Log sample users for debugging
    console.log('🔍 Sample users for comparison:', window.allUsers.slice(0, 3).map(user => ({
        id: user.id,
        idType: typeof user.id,
        idString: user.id.toString(),
        fullName: user.fullName
    })));

    const matchingUser = window.allUsers.find(user => {
        const userStr = user.id.toString();
        const isMatch = userStr === payToIdStr;
        if (isMatch) {
            console.log('🎯 Found matching user for Pay To:', {
                userId: user.id,
                fullName: user.fullName,
                employeeId: user.employeeId,
                kansaiEmployeeId: user.kansaiEmployeeId
            });
        }
        return isMatch;
    });

    if (matchingUser) {
        const displayText = matchingUser.kansaiEmployeeId ?
            `${matchingUser.kansaiEmployeeId} - ${matchingUser.fullName}` :
            `${matchingUser.employeeId || ''} - ${matchingUser.fullName}`;

        console.log('✅ Pay To display text:', displayText);
        document.getElementById('payToSearch').value = displayText;
    } else {
        console.log('❌ No matching user found for Pay To ID:', payToId);
        console.log('🔍 Available user IDs:', window.allUsers.map(u => u.id.toString()));
        document.getElementById('payToSearch').value = `User ID: ${payToId}`;
    }
}

// Function to populate approval field
function populateApprovalField(fieldPrefix, userId) {
    if (!userId || !window.allUsers) {
        console.log(`⚠️ populateApprovalField: Missing userId or allUsers not loaded for ${fieldPrefix}`);
        return;
    }

    console.log(`👤 populateApprovalField called for ${fieldPrefix} with userId:`, userId);

    // Convert both to string for comparison
    const userIdStr = userId.toString();

    const matchingUser = window.allUsers.find(user => {
        const userStr = user.id.toString();
        const isMatch = userStr === userIdStr;
        if (isMatch) {
            console.log(`🎯 Found matching user for ${fieldPrefix}:`, {
                userId: user.id,
                fullName: user.fullName
            });
        }
        return isMatch;
    });

    if (matchingUser) {
        const searchInput = document.getElementById(`${fieldPrefix}Search`);
        if (searchInput) {
            const displayName = matchingUser.fullName || matchingUser.name || matchingUser.username || '';
            console.log(`✅ ${fieldPrefix} display name:`, displayName);
            searchInput.value = displayName;
        } else {
            console.log(`⚠️ ${fieldPrefix}Search input not found`);
        }
    } else {
        console.log(`❌ No matching user found for ${fieldPrefix} ID:`, userId);
        const searchInput = document.getElementById(`${fieldPrefix}Search`);
        if (searchInput) {
            searchInput.value = `User ID: ${userId}`;
        }
    }
}

// Function to populate reimbursement details table
function populateReimbursementDetails(details) {
    console.log('populateReimbursementDetails called with:', details);

    const tableBody = document.getElementById('reimbursementDetails');
    if (!tableBody) {
        console.error('Table body #reimbursementDetails not found!');
        return;
    }

    tableBody.innerHTML = '';

    if (details && details.length > 0) {
        console.log(`Populating ${details.length} reimbursement detail rows`);

        details.forEach((detail, index) => {
            console.log(`Processing detail row ${index + 1}:`, detail);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-2 border">${detail.category || ''}</td>
                <td class="p-2 border">${detail.accountName || ''}</td>
                <td class="p-2 border">${detail.glAccount || ''}</td>
                <td class="p-2 border">${detail.description || ''}</td>
                <td class="p-2 border text-right">${formatCurrencyIDR(detail.amount) || '0.00'}</td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        console.log('No details found, showing empty message');
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">No details available</td></tr>';
    }

    // Note: Total amount calculation is now handled in populateReimbursementDetailsForPrint()
}



// Function to display attachments
function displayAttachments(attachments) {
    const attachmentsList = document.getElementById('attachmentsList');
    attachmentsList.innerHTML = '';

    if (attachments && attachments.length > 0) {
        console.log('Displaying attachments:', attachments.length, 'files');

        attachments.forEach(attachment => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';

            attachmentItem.innerHTML = `
                <span>${attachment.fileName}</span>
                <div>
                    <a href="${BASE_URL}/${attachment.filePath}" target="_blank" class="text-blue-500 hover:text-blue-700">View</a>
                </div>
            `;

            attachmentsList.appendChild(attachmentItem);
        });
    } else {
        console.log('No attachments to display');
    }
}

// Function to disable all form fields for view-only mode
function disableAllFormFields() {
    // Disable all input fields
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = true;
        input.classList.add('bg-gray-100', 'cursor-not-allowed');
    });

    // Hide action buttons
    const actionButtons = document.querySelectorAll('button[onclick*="confirmDelete"], button[onclick*="updateReim"], button[onclick*="confirmSubmit"]');
    actionButtons.forEach(button => {
        button.style.display = 'none';
    });

    // Hide file input
    const fileInput = document.getElementById('filePath');
    if (fileInput) {
        fileInput.style.display = 'none';
    }

    // Hide file input label
    const fileInputLabel = fileInput ? fileInput.previousElementSibling : null;
    if (fileInputLabel && fileInputLabel.tagName === 'H3') {
        fileInputLabel.style.display = 'none';
    }
}

// Function to fetch departments
async function fetchDepartments() {
    try {
        const response = await makeAuthenticatedRequest('/api/department', {
            method: 'GET'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }

        const data = await response.json();
        console.log("Department data:", data);
        populateDepartmentSelect(data.data);
    } catch (error) {
        console.error('Error fetching departments:', error);
    }
}

// Function to populate department select
function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("department");
    if (!departmentSelect) return;

    departmentSelect.innerHTML = '<option value="" disabled>Select Department</option>';

    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.name;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
    });
}

// Function to fetch users
async function fetchUsers() {
    try {
        console.log('🔍 Fetching users from API...');
        const response = await makeAuthenticatedRequest('/api/users', {
            method: 'GET'
        });
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch users');
        }

        const users = result.data;
        window.allUsers = users;
        console.log('✅ Stored', users.length, 'users in global cache');

        // Log sample users for debugging
        console.log('👥 Sample users data:', users.slice(0, 3).map(user => ({
            id: user.id,
            idType: typeof user.id,
            idString: user.id.toString(),
            username: user.username,
            fullName: user.fullName,
            employeeId: user.employeeId,
            kansaiEmployeeId: user.kansaiEmployeeId
        })));

    } catch (error) {
        console.error("❌ Error fetching users:", error);
    }
}

// Function to fetch transaction types
async function fetchTransactionTypes() {
    try {
        const response = await makeAuthenticatedRequest('/api/transactiontypes/filter?category=Reimbursement', {
            method: 'GET'
        });
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch transaction types');
        }

        transactionTypes = result.data;
        console.log('Stored', transactionTypes.length, 'transaction types in global cache');
        populateTransactionTypesDropdown(transactionTypes);

    } catch (error) {
        console.error("Error fetching transaction types:", error);
    }
}

// Function to populate transaction types dropdown
function populateTransactionTypesDropdown(types) {
    const typeSelect = document.getElementById("typeOfTransaction");
    if (!typeSelect) return;

    typeSelect.innerHTML = '';
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Transaction Type";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    typeSelect.appendChild(defaultOption);

    types.forEach(type => {
        const option = document.createElement("option");
        option.value = type.name;
        option.textContent = type.name;
        typeSelect.appendChild(option);
    });
}

// Function to fetch business partners
async function fetchBusinessPartners() {
    try {
        const response = await makeAuthenticatedRequest('/api/business-partners/type/employee', {
            method: 'GET'
        });
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch business partners');
        }

        businessPartners = result.data;
        console.log('Stored', businessPartners.length, 'business partners in global cache');

    } catch (error) {
        console.error("Error fetching business partners:", error);
    }
}

// Function to render revision history
function renderRevisionHistory(revisions) {
    const section = document.getElementById('revisedRemarksSection');
    if (!section) return;

    if (!Array.isArray(revisions) || revisions.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    // Group revisions by stage
    const grouped = {};
    revisions.forEach(rev => {
        if (!grouped[rev.stage]) grouped[rev.stage] = [];
        grouped[rev.stage].push(rev);
    });

    // Build HTML
    let html = '';
    html += `<h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>`;
    html += `<div class="bg-gray-50 p-4 rounded-lg border"><div class="mb-2"><span class="text-sm font-medium text-gray-600">Total Revisions: </span><span id="revisedCount" class="text-sm font-bold text-blue-600">${revisions.length}</span></div></div>`;

    Object.entries(grouped).forEach(([stage, items]) => {
        html += `<div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded"><h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${items.length})</h4></div>`;
        items.forEach((rev, idx) => {
            html += `<div class="mb-3 ml-4"><div class="flex items-start justify-between"><div class="flex-1"><label class="text-sm font-medium text-gray-700">Revision ${idx + 1}:</label><div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${rev.remarks || ''}</div><div class="text-xs text-gray-500 mt-1">Date: ${formatDateToDDMMYYYY(rev.createdAt)} | By: ${rev.revisedByName || ''}</div></div></div></div>`;
        });
    });

    section.innerHTML = html;
}

// Function to display rejection remarks
function displayRejectionRemarks(data) {
    if (data.status !== 'Rejected') {
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        if (rejectionSection) {
            rejectionSection.style.display = 'none';
        }
        return;
    }

    const rejectionSection = document.getElementById('rejectionRemarksSection');
    const rejectionTextarea = document.getElementById('rejectionRemarks');

    if (rejectionSection && rejectionTextarea) {
        let rejectionRemarks = '';

        if (data.remarksRejectByChecker) {
            rejectionRemarks = data.remarksRejectByChecker;
        } else if (data.remarksRejectByAcknowledger) {
            rejectionRemarks = data.remarksRejectByAcknowledger;
        } else if (data.remarksRejectByApprover) {
            rejectionRemarks = data.remarksRejectByApprover;
        } else if (data.remarksRejectByReceiver) {
            rejectionRemarks = data.remarksRejectByReceiver;
        } else if (data.rejectedRemarks) {
            rejectionRemarks = data.rejectedRemarks;
        } else if (data.remarks) {
            rejectionRemarks = data.remarks;
        }

        if (rejectionRemarks.trim() !== '') {
            rejectionSection.style.display = 'block';
            rejectionTextarea.value = rejectionRemarks;
        } else {
            rejectionSection.style.display = 'none';
        }
    }
}

// Helper function to format date as DD/MM/YYYY
function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Function to navigate back to menu
function goToMenuReim() {
    try {
        window.location.href = '../pages/menuReim.html';
    } catch (error) {
        console.error('Error navigating to menu:', error);
        window.location.href = '../pages/approval-dashboard.html';
    }
}

// Error display function
function showError(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            confirmButtonText: 'OK'
        });
    } else {
        alert(message);
    }
}

