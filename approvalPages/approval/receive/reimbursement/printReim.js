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
            params.details = JSON.parse(decodeURIComponent(params.details));
        } catch (error) {
            console.error('Error parsing details JSON:', error);
            params.details = [];
        }
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
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount).replace('Rp', 'IDR');
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
        totalAmount: urlParams.totalAmount || (apiData ? apiData.totalAmount || calculateTotalFromDetails(apiData.reimbursementDetails) : 0),
        reimbursementDetails: urlParams.details || (apiData ? apiData.reimbursementDetails : []),
        typeOfTransaction: urlParams.typeOfTransaction || (apiData ? apiData.typeOfTransaction : ''),
        remarks: urlParams.remarks || (apiData ? apiData.remarks : ''),
        preparedByDate: urlParams.preparedByDate || (apiData ? apiData.preparedByDate : ''),
        checkedByDate: urlParams.checkedByDate || (apiData ? apiData.checkedByDate : ''),
        acknowledgeByDate: urlParams.acknowledgeByDate || (apiData ? apiData.acknowledgeByDate : ''),
        approvedByDate: urlParams.approvedByDate || (apiData ? apiData.approvedByDate : ''),
        receivedByDate: urlParams.receivedByDate || (apiData ? apiData.receivedByDate : '')
    };
    
    console.log('Data for print page:', data);
    console.log('Total amount from parameters:', urlParams.totalAmount);
    console.log('Total amount used:', data.totalAmount);
    
    // Populate header information
    document.getElementById('payToText').textContent = data.payTo || '';
    document.getElementById('voucherNoText').textContent = data.voucherNo || '';
    
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
    
    // Set type of transaction
    if (document.getElementById('typeOfTransactionText')) {
        document.getElementById('typeOfTransactionText').textContent = data.typeOfTransaction || getTypeOfTransactionFromUrl() || '';
        console.log('Type of Transaction set to:', data.typeOfTransaction);
    } else {
        console.warn('typeOfTransactionText element not found in the document');
    }
    
    // Set remarks
    if (document.getElementById('remarksText')) {
        document.getElementById('remarksText').textContent = data.remarks || '';
        console.log('Remarks set to:', data.remarks);
    } else {
        console.warn('remarksText element not found in the document');
    }
    
    // Set department text and checkbox
    if (data.department) {
        // Display department name in departmentText element
        if (document.getElementById('departmentText')) {
            document.getElementById('departmentText').textContent = `Department : ${data.department}`;
            console.log('Set departmentText to:', data.department);
        } else {
            console.warn('departmentText element not found');
        }
        
        // Set checkbox based on department name
        const dept = data.department.toLowerCase();
        if (dept.includes('production')) {
            document.getElementById('productionCheckbox').classList.add('checked');
        } else if (dept.includes('marketing') || dept.includes('sales')) {
            document.getElementById('marketingCheckbox').classList.add('checked');
        } else if (dept.includes('technical')) {
            document.getElementById('technicalCheckbox').classList.add('checked');
        } else if (dept.includes('admin')) {
            document.getElementById('administrationCheckbox').classList.add('checked');
        }
    }
    
    // Set reference document
    if (document.getElementById('refdoc')) {
        document.getElementById('refdoc').textContent = `Reference Doc: ${data.referenceDoc || ''}`;
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
    
    // Set approval dates
    if (document.getElementById('preparedByDate')) {
        document.getElementById('preparedByDate').textContent = formatDateIfExists(data.preparedByDate);
    }
    
    if (document.getElementById('checkedByDate')) {
        document.getElementById('checkedByDate').textContent = formatDateIfExists(data.checkedByDate);
    }
    
    if (document.getElementById('acknowledgeByDate')) {
        document.getElementById('acknowledgeByDate').textContent = formatDateIfExists(data.acknowledgeByDate);
    }
    
    if (document.getElementById('approvedByDate')) {
        document.getElementById('approvedByDate').textContent = formatDateIfExists(data.approvedByDate);
    }
    
    if (document.getElementById('receivedByDate')) {
        document.getElementById('receivedByDate').textContent = formatDateIfExists(data.receivedByDate);
    }
    
    // Populate reimbursement details table
    populateDetailsTable(data.reimbursementDetails, data.totalAmount);
}

// Format date if it exists
function formatDateIfExists(dateString) {
    if (!dateString) return '';
    
    try {
        if (typeof dateString === 'string' && dateString.includes('-')) {
            const dateParts = dateString.split('-');
            if (dateParts.length === 3) {
                // Convert from YYYY-MM-DD to DD/MM/YYYY
                return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            }
        }
        // If it's a date object or other format
        return new Date(dateString).toLocaleDateString('en-GB');
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString; // Return as is if there's an error
    }
}

// Helper function to calculate total from details
function calculateTotalFromDetails(details) {
    if (!details || !Array.isArray(details)) return 0;
    
    return details.reduce((sum, detail) => {
        return sum + (parseFloat(detail.amount) || 0);
    }, 0);
}

// Populate reimbursement details table
function populateDetailsTable(details, totalAmount = null) {
    const tableBody = document.getElementById('reimbursementDetailsTable');
    if (!tableBody) {
        console.error('reimbursementDetailsTable not found');
        return;
    }
    
    tableBody.innerHTML = ''; // Clear existing rows
    
    let calculatedTotal = 0;
    
    if (details && details.length > 0) {
        details.forEach(detail => {
            const amount = parseFloat(detail.amount) || 0;
            calculatedTotal += amount;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border p-2">${detail.category || ''}</td>
                <td class="border p-2">${detail.accountName || ''}</td>
                <td class="border p-2">${detail.glAccount || ''}</td>
                <td class="border p-2">${detail.description || ''}</td>
                <td class="border p-2">${formatCurrency(amount)}</td>
                <td class="border p-2"></td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        console.warn('No details found to populate table');
    }
    
    // Always prioritize totalAmount from parameters if available
    let finalTotal = 0;
    if (totalAmount !== null && totalAmount !== undefined && totalAmount !== '') {
        // Handle comma-separated numbers (e.g. "1,234.56")
        const cleanedTotal = String(totalAmount).replace(/,/g, '');
        finalTotal = parseFloat(cleanedTotal) || 0;
        console.log('Using provided totalAmount:', totalAmount, 'parsed as:', finalTotal);
    } else {
        finalTotal = calculatedTotal;
        console.log('Using calculated total:', calculatedTotal);
    }
    
    // Update totals
    if (document.getElementById('totalDebitText')) {
        document.getElementById('totalDebitText').textContent = formatCurrency(finalTotal);
        console.log('Set totalDebitText to:', formatCurrency(finalTotal));
    } else {
        console.warn('totalDebitText element not found');
    }
    
    if (document.getElementById('totalCreditText')) {
        document.getElementById('totalCreditText').textContent = '-';
        console.log('Set totalCreditText to empty');
    } else {
        console.warn('totalCreditText element not found');
    }
    
    // Update amount payment and amount in words
    if (document.getElementById('amountText')) {
        document.getElementById('amountText').textContent = formatCurrency(finalTotal);
    } else {
        console.warn('amountText element not found');
    }
    
    if (document.getElementById('amountInWordText')) {
        document.getElementById('amountInWordText').textContent = `${numberToWords(finalTotal)} rupiah`;
    } else {
        console.warn('amountInWordText element not found');
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