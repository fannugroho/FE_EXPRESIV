const baseUrl = 'https://t246vds2-5246.asse.devtunnels.ms';
let reimbursementId = '';

// Get reimbursement ID from URL
function getReimbursementIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('reim-id');
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
        const response = await fetch(`${baseUrl}/api/reimbursements/${reimbursementId}`);
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

// Populate print page with reimbursement data
function populatePrintData(data) {
    // Populate header information
    document.getElementById('payToText').textContent = data.payTo || '';
    document.getElementById('voucherNoText').textContent = data.voucherNo || '';
    document.getElementById('submissionDateText').textContent = data.submissionDate ? new Date(data.submissionDate).toLocaleDateString('en-GB') : '';
    
    // Set department checkbox
    if (data.department) {
        const dept = data.department.toLowerCase();
        if (dept === 'production') {
            document.getElementById('productionCheckbox').classList.add('checked');
        } else if (dept === 'marketing') {
            document.getElementById('marketingCheckbox').classList.add('checked');
        } else if (dept === 'technical') {
            document.getElementById('technicalCheckbox').classList.add('checked');
        } else if (dept === 'admninistration') {
            document.getElementById('administrationCheckbox').classList.add('checked');
        }
    }
    
    // Set reference document as invoice number
    document.getElementById('invoiceNumberText').textContent = data.referenceDoc || '';
    
    // Set approver name if available
    if (data.approvedBy) {
        document.getElementById('approvedByText').textContent = data.approvedBy;
    }
    
    // Populate reimbursement details table
    populateDetailsTable(data.reimbursementDetails);
}

// Populate reimbursement details table
function populateDetailsTable(details) {
    const tableBody = document.getElementById('reimbursementDetailsTable');
    tableBody.innerHTML = ''; // Clear existing rows
    
    let totalAmount = 0;
    
    if (details && details.length > 0) {
        details.forEach(detail => {
            const amount = parseFloat(detail.amount) || 0;
            totalAmount += amount;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border p-2">${detail.description || ''}</td>
                <td class="border p-2">${detail.glAccount || ''}</td>
                <td class="border p-2">${detail.accountName || ''}</td>
                <td class="border p-2">${formatCurrency(amount)}</td>
                <td class="border p-2"></td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Update totals
    document.getElementById('totalDebitText').textContent = formatCurrency(totalAmount);
    document.getElementById('totalCreditText').textContent = formatCurrency(totalAmount);
    
    // Update amount payment and amount in words
    document.getElementById('amountText').textContent = formatCurrency(totalAmount);
    document.getElementById('amountInWordText').textContent = `${numberToWords(totalAmount)} rupiah`;
}

// Go back to previous page
function goBack() {
    window.close();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    fetchReimbursementData();
}); 