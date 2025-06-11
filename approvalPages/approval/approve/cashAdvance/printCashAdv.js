// Using BASE_URL from auth.js instead of hardcoded baseUrl
let cashAdvanceId = '';

// Get cash advance ID from URL
function getCashAdvanceIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ca-id');
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

// Check if we have direct data from URL parameters
function hasUrlData() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('cashAdvanceNo') && urlParams.has('employeeName');
}

// Get data from URL parameters
function getDataFromUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Extract parameters
    const data = {
        voucherNo: urlParams.get('cashAdvanceNo') || '',
        employeeNik: urlParams.get('employeeNik') || '',
        employeeName: urlParams.get('employeeName') || '',
        requesterName: urlParams.get('requesterName') || '',
        purpose: urlParams.get('purpose') || '',
        payTo: urlParams.get('paidTo') || '',
        department: urlParams.get('department') || '',
        submissionDate: urlParams.get('submissionDate') || '',
        status: urlParams.get('status') || '',
        transactionType: urlParams.get('transactionType') || '',
        remarks: urlParams.get('remarks') || '',
        preparedBy: urlParams.get('proposedBy') || '',
        checkedBy: urlParams.get('checkedBy') || '',
        approvedBy: urlParams.get('approvedBy') || '',
        acknowledgedBy: urlParams.get('acknowledgedBy') || ''
    };
    
    // Parse items if available
    try {
        const itemsParam = urlParams.get('items');
        if (itemsParam) {
            data.cashAdvanceDetails = JSON.parse(decodeURIComponent(itemsParam));
        }
    } catch (error) {
        console.error('Error parsing items from URL:', error);
        data.cashAdvanceDetails = [];
    }
    
    return data;
}

// Fetch cash advance data from API
async function fetchCashAdvanceData() {
    cashAdvanceId = getCashAdvanceIdFromUrl();
    if (!cashAdvanceId) {
        console.error('No cash advance ID found in URL');
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/api/cash-advances/${cashAdvanceId}`);
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            populatePrintData(result.data);
        } else {
            console.error('Failed to fetch cash advance data:', result.message);
        }
    } catch (error) {
        console.error('Error fetching cash advance data:', error);
    }
}

// Populate print page with cash advance data
function populatePrintData(data) {
    // Populate header information
    document.getElementById('voucherNo').textContent = data.voucherNo || '';
    document.getElementById('submissionDate').textContent = data.submissionDate ? 
        (typeof data.submissionDate === 'string' && data.submissionDate.includes('T') ? 
            new Date(data.submissionDate).toLocaleDateString('en-GB') : data.submissionDate) : '';
    document.getElementById('paidTo').textContent = ': ' + (data.payTo || '');
    
    // Set department checkbox
    if (data.department) {
        const dept = data.department.toLowerCase();
        if (dept.includes('production')) {
            document.getElementById('productionCheck').style.backgroundColor = 'black';
        } else if (dept.includes('marketing')) {
            document.getElementById('marketingCheck').style.backgroundColor = 'black';
        } else if (dept.includes('technical')) {
            document.getElementById('technicalCheck').style.backgroundColor = 'black';
        } else if (dept.includes('admin')) {
            document.getElementById('administrationCheck').style.backgroundColor = 'black';
        }
    }
    
    // Set payment method (default to Cash if not specified)
    if (data.paymentMethod === 'Bank') {
        document.getElementById('bankCheck').style.backgroundColor = 'black';
    } else {
        document.getElementById('cashCheck').style.backgroundColor = 'black';
    }
    
    // Set purpose information with transaction type if available
    let purposeText = data.purpose || '';
    if (data.transactionType) {
        purposeText += ` (${data.transactionType})`;
    }
    if (data.remarks) {
        purposeText += `\nNotes: ${data.remarks}`;
    }
    document.getElementById('purpose').textContent = purposeText;
    
    // Calculate total amount from details if available
    let totalAmount = 0;
    if (data.cashAdvanceDetails && data.cashAdvanceDetails.length > 0) {
        data.cashAdvanceDetails.forEach(detail => {
            const amount = parseFloat(detail.amount) || 0;
            totalAmount += amount;
        });
    } else if (data.amount) {
        totalAmount = parseFloat(data.amount);
    }
    
    // Set amount information
    document.getElementById('estimatedCost').textContent = totalAmount.toLocaleString();
    document.getElementById('amountInWords').textContent = `${numberToWords(totalAmount)} rupiah`;
    
    // Set return amount
    document.getElementById('returnAmount').textContent = totalAmount.toLocaleString();
    document.getElementById('returnAmountInWords').textContent = `${numberToWords(totalAmount)} rupiah`;
    
    // Set approval names
    document.getElementById('proposedName').textContent = data.preparedBy || data.requesterName || '';
    document.getElementById('proposedDate').textContent = data.submissionDate ? 
        (typeof data.submissionDate === 'string' && data.submissionDate.includes('T') ? 
            new Date(data.submissionDate).toLocaleDateString('en-GB') : data.submissionDate) : '';
    
    document.getElementById('checkedName').textContent = data.checkedBy || '';
    document.getElementById('approvedName').textContent = data.approvedBy || '';
    document.getElementById('receivedName').textContent = data.acknowledgedBy || '';
    
    // Set return date
    document.getElementById('returnDate').textContent = data.submissionDate ? 
        (typeof data.submissionDate === 'string' && data.submissionDate.includes('T') ? 
            new Date(data.submissionDate).toLocaleDateString('en-GB') : data.submissionDate) : '';
    
    // Populate cash advance details table if available
    if (data.cashAdvanceDetails && data.cashAdvanceDetails.length > 0) {
        populateDetailsTable(data.cashAdvanceDetails);
        document.getElementById('settlementTableContainer').style.display = 'block';
        document.getElementById('noSettlementMessage').style.display = 'none';
    } else {
        document.getElementById('settlementTableContainer').style.display = 'none';
        document.getElementById('noSettlementMessage').style.display = 'block';
    }
}

// Populate settlement details table
function populateDetailsTable(details) {
    const tableBody = document.getElementById('settlementTable');
    tableBody.innerHTML = ''; // Clear existing rows
    
    let totalAmount = 0;
    
    if (details && details.length > 0) {
        details.forEach(detail => {
            const amount = parseFloat(detail.amount) || 0;
            totalAmount += amount;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${detail.description || ''}</td>
                <td style="text-align: right;">${amount.toLocaleString()}</td>
                <td></td>
            `;
            tableBody.appendChild(row);
        });
        
        // Add total row
        const totalRow = document.createElement('tr');
        totalRow.innerHTML = `
            <td style="font-weight: bold;">Total</td>
            <td style="text-align: right; font-weight: bold;">${totalAmount.toLocaleString()}</td>
            <td></td>
        `;
        tableBody.appendChild(totalRow);
    }
}

// Go back to previous page
function goBack() {
    window.close();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we have data directly in URL parameters
    if (hasUrlData()) {
        // Use data from URL parameters
        const data = getDataFromUrlParams();
        populatePrintData(data);
    } else {
        // Try to fetch from API using CA ID
        fetchCashAdvanceData();
    }
}); 