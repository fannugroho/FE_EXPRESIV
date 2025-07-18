// Using BASE_URL from auth.js instead of hardcoded baseUrl
let reimbursementId = '';

// Get reimbursement ID from URL
function getReimbursementIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('reim-id');
}

// Get all parameters from URL
function getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    
    // Extract all parameters
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }
    
    // Special handling for details JSON
    if (params.details) {
        try {
            console.log('Raw details parameter:', params.details);
            params.details = JSON.parse(decodeURIComponent(params.details));
            console.log('Parsed details:', params.details);
            
            // Validasi data details
            if (Array.isArray(params.details)) {
                console.log('Details is an array with', params.details.length, 'items');
                
                // Log setiap item details
                params.details.forEach((item, index) => {
                    console.log(`Detail item ${index}:`, item);
                    console.log(`Amount for item ${index}:`, item.amount);
                });
            } else {
                console.error('Details is not an array:', typeof params.details);
            }
        } catch (error) {
            console.error('Error parsing details JSON:', error);
            params.details = [];
        }
    } else {
        console.log('No details parameter found in URL');
    }
    
    return params;
}

// Convert number to words (for amount in words)
function numberToWords(num) {
    const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    // Function to convert a number less than 1000 to words
    function convertLessThanOneThousand(num) {
        if (num === 0) return '';
        
        let result = '';
        
        if (num < 10) {
            result = units[num];
        } else if (num < 20) {
            result = teens[num - 10];
        } else if (num < 100) {
            result = tens[Math.floor(num / 10)];
            if (num % 10 > 0) {
                result += '-' + units[num % 10];
            }
        } else {
            result = units[Math.floor(num / 100)] + ' hundred';
            if (num % 100 > 0) {
                result += ' and ' + convertLessThanOneThousand(num % 100);
            }
        }
        
        return result;
    }
    
    if (num === 0) return 'zero';
    
    let result = '';
    let isNegative = num < 0;
    
    if (isNegative) {
        num = Math.abs(num);
    }
    
    // Handle billions
    if (num >= 1000000000) {
        result += convertLessThanOneThousand(Math.floor(num / 1000000000)) + ' billion';
        num %= 1000000000;
        if (num > 0) result += ' ';
    }
    
    // Handle millions
    if (num >= 1000000) {
        result += convertLessThanOneThousand(Math.floor(num / 1000000)) + ' million';
        num %= 1000000;
        if (num > 0) result += ' ';
    }
    
    // Handle thousands
    if (num >= 1000) {
        result += convertLessThanOneThousand(Math.floor(num / 1000)) + ' thousand';
        num %= 1000;
        if (num > 0) result += ' ';
    }
    
    // Handle hundreds and below
    if (num > 0) {
        result += convertLessThanOneThousand(num);
    }
    
    if (isNegative) {
        result = 'negative ' + result;
    }
    
    return result.charAt(0).toUpperCase() + result.slice(1);
}

// Format number to currency
function formatCurrency(amount, currency = 'IDR') {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    }).format(amount).replace('Rp', currency);
}

// Fetch reimbursement data from API
async function fetchReimbursementData() {
    reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId) {
        console.error('No reimbursement ID found in URL');
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}`);
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            populatePrintData(result.data);
        } else {
            console.error('Failed to fetch reimbursement data:', result.message);
        }
    } catch (error) {
        console.error('Error fetching reimbursement data:', error);
    }
}

// Populate print page with reimbursement data from URL parameters or API data
function populatePrintData(apiData = null) {
    // Get data from URL parameters first
    const urlParams = getUrlParameters();
    
    // Use URL parameters if available, otherwise fall back to API data
    const data = {
        payTo: urlParams.payTo || (apiData ? apiData.payTo : ''),
        voucherNo: urlParams.voucherNo || (apiData ? apiData.voucherNo : ''),
        submissionDate: urlParams.submissionDate || (apiData ? apiData.submissionDate : ''),
        department: urlParams.department || (apiData ? apiData.department : ''),
        referenceDoc: urlParams.referenceDoc || (apiData ? apiData.referenceDoc : ''),
        preparedBy: urlParams.preparedBy || (apiData ? apiData.preparedBy : ''),
        checkedBy: urlParams.checkedBy || (apiData ? apiData.checkedBy : ''),
        acknowledgeBy: urlParams.acknowledgeBy || (apiData ? apiData.acknowledgeBy : ''),
        approvedBy: urlParams.approvedBy || (apiData ? apiData.approvedBy : ''),
        receivedBy: urlParams.receivedBy || (apiData ? apiData.receivedBy : ''),
        totalAmount: urlParams.totalAmount || (apiData ? calculateTotalFromDetails(apiData.reimbursementDetails) : 0),
        reimbursementDetails: urlParams.details || (apiData ? apiData.reimbursementDetails : []),
        typeOfTransaction: urlParams.typeOfTransaction || (apiData ? apiData.typeOfTransaction : ''),
        remarks: urlParams.remarks || (apiData ? apiData.remarks : ''),
        currency: urlParams.currency || (apiData ? apiData.currency : 'IDR')
    };
    
    // Populate header information
    document.getElementById('payToText').textContent = data.payTo || '';
    document.getElementById('voucherNoText').textContent = data.voucherNo || '';
    
    // Set Type of Transaction
    if (document.getElementById('typeOfTransactionText')) {
        document.getElementById('typeOfTransactionText').textContent = data.typeOfTransaction || '';
    }
    
    // Set Remarks
    if (document.getElementById('remarksText')) {
        document.getElementById('remarksText').textContent = data.remarks || '';
    }
    
    // Format date if it's a string in YYYY-MM-DD format
    if (data.submissionDate) {
        if (typeof data.submissionDate === 'string' && data.submissionDate.includes('-')) {
            const dateParts = data.submissionDate.split('-');
            if (dateParts.length === 3) {
                // Convert from YYYY-MM-DD to DD/MM/YYYY
                const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                document.getElementById('submissionDateText').textContent = formattedDate;
            } else {
                document.getElementById('submissionDateText').textContent = data.submissionDate;
            }
        } else {
            // If it's a date object from API
            document.getElementById('submissionDateText').textContent = new Date(data.submissionDate).toLocaleDateString('en-GB');
        }
    }
    
    // Set reference document
    if (document.getElementById('refdoc')) {
        document.getElementById('refdoc').textContent = `Reference Doc: ${data.referenceDoc || ''}`;
    }
    
    // Set department value
    if (document.getElementById('departmentValue')) {
        document.getElementById('departmentValue').textContent = data.department || '';
    }
    
    // Set approver names in signature section
    if (document.getElementById('preparedBy') && data.preparedBy) {
        document.getElementById('preparedBy').textContent = data.preparedBy;
    }
    
    if (document.getElementById('checkedBy') && data.checkedBy) {
        document.getElementById('checkedBy').textContent = data.checkedBy;
    }
    
    if (document.getElementById('acknowledgeBy') && data.acknowledgeBy) {
        document.getElementById('acknowledgeBy').textContent = data.acknowledgeBy;
    }
    
    if (document.getElementById('approvedBy') && data.approvedBy) {
        document.getElementById('approvedBy').textContent = data.approvedBy;
    }
    
    if (document.getElementById('approvedByText') && data.approvedBy) {
        document.getElementById('approvedByText').textContent = data.approvedBy;
    }
    
    if (document.getElementById('receivedBy') && data.receivedBy) {
        document.getElementById('receivedBy').textContent = data.receivedBy;
    }
    
    // Show approval stamps based on status
    const approvalStamps = document.querySelectorAll('.approval-stamp');
    if (approvalStamps.length >= 5) {
        // Default to visible if we have data, hidden if not
        approvalStamps[0].style.visibility = data.preparedBy ? 'visible' : 'hidden';
        approvalStamps[1].style.visibility = data.checkedBy ? 'visible' : 'hidden';
        approvalStamps[2].style.visibility = data.acknowledgeBy ? 'visible' : 'hidden';
        approvalStamps[3].style.visibility = data.approvedBy ? 'visible' : 'hidden';
        approvalStamps[4].style.visibility = data.receivedBy ? 'visible' : 'hidden';
    }
    
    // Set approval dates (current date as placeholder)
    const currentDate = new Date().toLocaleDateString('en-GB'); // Format: DD/MM/YYYY
    if (document.getElementById('preparedByDate')) {
        document.getElementById('preparedByDate').textContent = currentDate;
    }
    if (document.getElementById('checkedByDate')) {
        document.getElementById('checkedByDate').textContent = currentDate;
    }
    if (document.getElementById('acknowledgeByDate')) {
        document.getElementById('acknowledgeByDate').textContent = currentDate;
    }
    if (document.getElementById('approvedByDate')) {
        document.getElementById('approvedByDate').textContent = currentDate;
    }
    if (document.getElementById('receivedByDate')) {
        document.getElementById('receivedByDate').textContent = currentDate;
    }
    
    // Populate reimbursement details table
    populateDetailsTable(data.reimbursementDetails, data.totalAmount, data.currency);
}

// Helper function to calculate total from details
function calculateTotalFromDetails(details) {
    if (!details || !Array.isArray(details)) return 0;
    
    return details.reduce((sum, detail) => {
        return sum + (parseFloat(detail.amount) || 0);
    }, 0);
}

// Populate reimbursement details table
function populateDetailsTable(details, totalAmount = null, currency = 'IDR') {
    const tableBody = document.getElementById('reimbursementDetailsTable');
    tableBody.innerHTML = ''; // Clear existing rows
    
    let calculatedTotal = 0;
    
    if (details && details.length > 0) {
        details.forEach(detail => {
            const amount = parseFloat(detail.amount) || 0;
            calculatedTotal += amount;
            
            // Log untuk debugging
            console.log('Detail item:', detail);
            console.log('Amount value:', amount);
            console.log('Formatted amount:', formatCurrency(amount));
            
            const row = document.createElement('tr');
            // Urutan kolom: Category, Account, Detail Account, Description, Debit, Credit
            row.innerHTML = `
                <td class="border p-2">${detail.category || ''}</td>
                <td class="border p-2">${detail.glAccount || ''}</td>
                <td class="border p-2">${detail.accountName || ''}</td>
                <td class="border p-2">${detail.description || ''}</td>
                <td class="border p-2">${formatCurrency(amount, currency)}</td>
                <td class="border p-2"></td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        console.log('No details found or empty array');
    }
    
    // Use provided total amount or calculated total
    const finalTotal = totalAmount !== null ? parseFloat(totalAmount) : calculatedTotal;
    
    // Log untuk debugging
    console.log('Final total amount:', finalTotal);
    console.log('Formatted total:', formatCurrency(finalTotal));
    
    // Update totals
    if (document.getElementById('totalDebitText')) {
        document.getElementById('totalDebitText').textContent = formatCurrency(finalTotal, currency);
    } else {
        console.error('Element with ID totalDebitText not found');
    }
    
    if (document.getElementById('totalCreditText')) {
        document.getElementById('totalCreditText').textContent = ''; // Removed the credit amount display
    } else {
        console.error('Element with ID totalCreditText not found');
    }
    
    // Update amount payment and amount in words
    if (document.getElementById('amountText')) {
        document.getElementById('amountText').textContent = formatCurrency(finalTotal, currency);
    }
    
    if (document.getElementById('amountInWordText')) {
        document.getElementById('amountInWordText').textContent = `${numberToWords(finalTotal)}`;
    }
}

// Go back to previous page
function goBack() {
    window.close();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Try to populate from URL parameters first
    const urlParams = getUrlParameters();
    if (urlParams && Object.keys(urlParams).length > 1) { // More than just reim-id
        populatePrintData();
    } else {
        // Fall back to API if URL parameters are insufficient
        fetchReimbursementData();
    }
});