// Using BASE_URL from auth.js instead of hardcoded baseUrl
let cashAdvanceId = '';

// Get cash advance ID from URL
function getCashAdvanceIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ca-id');
}

// Convert number to words (for amount in words)
function numberToWords(number) {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    function convertLessThanOneThousand(num) {
        if (num === 0) {
            return '';
        } else if (num < 10) {
            return ones[num];
        } else if (num < 20) {
            return teens[num - 10];
        } else if (num < 100) {
            return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
        } else {
            return ones[Math.floor(num / 100)] + ' hundred' + (num % 100 !== 0 ? ' ' + convertLessThanOneThousand(num % 100) : '');
        }
    }
    
    if (number === 0) {
        return 'zero';
    }
    
    const num = parseFloat(number.toString().replace(/,/g, ''));
    
    const billion = Math.floor(num / 1000000000);
    const million = Math.floor((num % 1000000000) / 1000000);
    const thousand = Math.floor((num % 1000000) / 1000);
    const remainder = Math.floor(num % 1000);
    
    let result = '';
    
    if (billion > 0) {
        result += convertLessThanOneThousand(billion) + ' billion ';
    }
    
    if (million > 0) {
        result += convertLessThanOneThousand(million) + ' million ';
    }
    
    if (thousand > 0) {
        result += convertLessThanOneThousand(thousand) + ' thousand ';
    }
    
    if (remainder > 0 || result === '') {
        result += convertLessThanOneThousand(remainder);
    }
    
    return result;
}

// Format date to a readable format
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('en-GB');
    } catch (e) {
        return dateString;
    }
}

// Calculate total amount from table rows
function calculateTotalAmount() {
    let totalAmount = 0;
    const amountInputs = document.querySelectorAll('#tableBody .amount');
    
    amountInputs.forEach(input => {
        const amount = parseFloat(input.value) || 0;
        totalAmount += amount;
    });
    
    return totalAmount;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we are in data retrieval mode
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'getdata') {
        // We're being loaded to retrieve data, send it back to the parent window
        sendDataToParent();
        return;
    }
    
    // Normal print mode - get cash advance ID from URL
    cashAdvanceId = getCashAdvanceIdFromUrl();
    
    if (cashAdvanceId) {
        // If we have a cash advance ID, load data from approveCash.html
        loadDataFromApproveCash();
    } else {
        // Otherwise use URL parameters as fallback
        loadDataFromUrlParams();
    }
});

// Send data from approveCash.html to parent window
function sendDataToParent() {
    // Get data from the form
    const data = {
        transactionType: document.getElementById('typeTransaction').value,
        voucherNo: document.getElementById('invno').value,
        submissionDate: document.getElementById('postingDate').value,
        department: document.getElementById('department').value,
        paidTo: document.getElementById('paidTo').value,
        prepared: document.getElementById('preparedBySearch').value,
        checked: document.getElementById('checkedBySearch').value,
        acknowledged: document.getElementById('acknowledgedBySearch').value,
        approved: document.getElementById('approvedBySearch').value,
        received: document.getElementById('receivedBySearch').value,
        closed: document.getElementById('closedBySearch') ? document.getElementById('closedBySearch').value : '',
        remarks: document.getElementById('remarks').value,
        purpose: document.getElementById('purposed').value
    };
    
    // Calculate total amount from table
    let totalAmount = 0;
    const amountInputs = document.querySelectorAll('#tableBody .amount');
    amountInputs.forEach(input => {
        const amount = parseFloat(input.value) || 0;
        totalAmount += amount;
    });
    data.amount = totalAmount.toString();
    
    // Send data to parent window
    window.opener.postMessage({
        type: 'cashAdvanceData',
        data: data
    }, '*');
}

// Load data from approveCash.html
function loadDataFromApproveCash() {
    // Create a hidden iframe to load approveCash.html
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `approveCash.html?ca-id=${cashAdvanceId}&mode=getdata`;
    document.body.appendChild(iframe);
    
    // Listen for message from iframe
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'cashAdvanceData') {
            // Remove the iframe
            document.body.removeChild(iframe);
            
            // Use the data to populate the print form
            populatePrintForm(event.data.data);
        }
    }, false);
}

// Load data from URL parameters
function loadDataFromUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Map fields from URL parameters based on the mapping provided
    document.getElementById('transactionType').textContent = urlParams.get('transactionType') || '';
    document.getElementById('voucherNo').textContent = urlParams.get('invno') || '';
    document.getElementById('submissionDate').textContent = formatDate(urlParams.get('postingDate') || '');
    document.getElementById('paidTo').textContent = ': ' + (urlParams.get('paidTo') || '');
    
    // Set department checkbox
    const department = urlParams.get('department') || '';
    if (department) {
        const dept = department.toLowerCase();
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
    
    // Set signatures
    document.getElementById('proposedName').textContent = urlParams.get('prepared') || '';
    document.getElementById('proposedDate').textContent = formatDate(urlParams.get('postingDate') || '');
    
    document.getElementById('checkedName').textContent = urlParams.get('Checked') || '';
    document.getElementById('checkedDate').textContent = formatDate(urlParams.get('postingDate') || '');
    
    document.getElementById('acknowledgedName').textContent = urlParams.get('Acknowledged') || '';
    document.getElementById('acknowledgedDate').textContent = formatDate(urlParams.get('postingDate') || '');
    
    document.getElementById('approvedName').textContent = urlParams.get('Approved') || '';
    document.getElementById('approvedDate').textContent = formatDate(urlParams.get('postingDate') || '');
    
    document.getElementById('receivedName').textContent = urlParams.get('Received') || '';
    document.getElementById('receivedDate').textContent = formatDate(urlParams.get('postingDate') || '');
    
    // Set closed by section if it exists
    if (document.getElementById('closedName')) {
        document.getElementById('closedName').textContent = urlParams.get('Closed') || '';
        document.getElementById('closedDate').textContent = formatDate(urlParams.get('postingDate') || '');
        
        // Show/hide closed by section based on whether there's data
        const closedBySection = document.getElementById('closedBySection');
        if (closedBySection) {
            closedBySection.style.display = urlParams.get('Closed') ? 'flex' : 'none';
        }
    }
    
    // Set remarks if it exists
    if (document.getElementById('remarks')) {
        document.getElementById('remarks').textContent = urlParams.get('remarks') || '';
    }
    
    // Set amount information
    const amount = parseFloat(urlParams.get('amount') || urlParams.get('amount') || '0') || 0;
    document.getElementById('estimatedCost').textContent = amount.toLocaleString();
    document.getElementById('amountInWords').textContent = numberToWords(amount) + ' rupiah';
    
    // Set purpose
    document.getElementById('purpose').textContent = urlParams.get('purposed') || urlParams.get('purpose') || '';
    
    // Set category and description if they exist
    try {
        const itemsParam = urlParams.get('items');
        if (itemsParam) {
            const items = JSON.parse(decodeURIComponent(itemsParam));
            if (items && items.length > 0) {
                // Ambil kategori dan deskripsi dari item pertama
                if (document.getElementById('category')) {
                    document.getElementById('category').textContent = items[0].category || '';
                }
                if (document.getElementById('description')) {
                    document.getElementById('description').textContent = items[0].description || '';
                }
                
                console.log('Items data loaded:', items);
            }
        }
    } catch (error) {
        console.error('Error parsing items data:', error);
    }
    
    // Set return amount if they exist
    if (document.getElementById('returnAmount')) {
        document.getElementById('returnAmount').textContent = amount.toLocaleString();
    }
    if (document.getElementById('returnAmountInWords')) {
        document.getElementById('returnAmountInWords').textContent = numberToWords(amount) + ' rupiah';
    }
    if (document.getElementById('returnDate')) {
        document.getElementById('returnDate').textContent = formatDate(urlParams.get('postingDate') || '');
    }
}

// Populate print form with data
function populatePrintForm(data) {
    // Populate header information
    if (document.getElementById('transactionType')) {
        document.getElementById('transactionType').textContent = data.transactionType || '';
    }
    if (document.getElementById('batchNo')) {
        document.getElementById('batchNo').textContent = data.batchNo || '';
    }
    document.getElementById('voucherNo').textContent = data.voucherNo || '';
    document.getElementById('submissionDate').textContent = formatDate(data.submissionDate);
    document.getElementById('paidTo').textContent = ': ' + (data.paidTo || '');
    
    // Set department checkbox
    if (data.department) {
        const dept = data.department.toLowerCase();
        if (dept.includes('production')) {
            document.getElementById('productionCheck').style.backgroundColor = 'black';
        } else if (dept.includes('marketing')) {
            document.getElementById('marketingCheck').style.backgroundColor = 'black';
        } else if (dept.includes('technical')) {
            document.getElementById('technicalCheck').style.backgroundColor = 'black';
        } else if (dept.includes('admin') || dept.includes('admninistration')) {
            document.getElementById('administrationCheck').style.backgroundColor = 'black';
        }
    }
    
    // Set signatures
    document.getElementById('proposedName').textContent = data.prepared || '';
    document.getElementById('proposedDate').textContent = formatDate(data.submissionDate);
    
    document.getElementById('checkedName').textContent = data.checked || '';
    document.getElementById('checkedDate').textContent = formatDate(data.submissionDate);
    
    if (document.getElementById('acknowledgedName')) {
        document.getElementById('acknowledgedName').textContent = data.acknowledged || '';
        document.getElementById('acknowledgedDate').textContent = formatDate(data.submissionDate);
    }
    
    document.getElementById('approvedName').textContent = data.approved || '';
    document.getElementById('approvedDate').textContent = formatDate(data.submissionDate);
    
    document.getElementById('receivedName').textContent = data.received || data.paidTo || '';
    document.getElementById('receivedDate').textContent = formatDate(data.submissionDate);
    
    // Set closed by section if it exists
    if (document.getElementById('closedName')) {
        document.getElementById('closedName').textContent = data.closed || '';
        document.getElementById('closedDate').textContent = formatDate(data.submissionDate);
        
        // Show/hide closed by section based on whether there's data
        const closedBySection = document.getElementById('closedBySection');
        if (closedBySection) {
            closedBySection.style.display = data.closed ? 'flex' : 'none';
        }
    }
    
    // Set remarks if it exists
    if (document.getElementById('remarks')) {
        document.getElementById('remarks').textContent = data.remarks || '';
    }
    
    // Set amount information
    const amount = parseFloat(data.amount) || 0;
    document.getElementById('estimatedCost').textContent = amount.toLocaleString();
    document.getElementById('amountInWords').textContent = numberToWords(amount) + ' rupiah';
    
    // Set purpose
    document.getElementById('purpose').textContent = data.purpose || '';
    
    // Set category and description if they exist
    if (document.getElementById('category')) {
        // Jika ada data category dari form, gunakan itu
        document.getElementById('category').textContent = data.category || '';
    }
    
    if (document.getElementById('description')) {
        // Jika ada data description dari form, gunakan itu
        document.getElementById('description').textContent = data.description || '';
    }
    
    // Set return amount if they exist
    if (document.getElementById('returnAmount')) {
        document.getElementById('returnAmount').textContent = amount.toLocaleString();
    }
    if (document.getElementById('returnAmountInWords')) {
        document.getElementById('returnAmountInWords').textContent = numberToWords(amount) + ' rupiah';
    }
    if (document.getElementById('returnDate')) {
        document.getElementById('returnDate').textContent = formatDate(data.submissionDate);
    }
}

// Go back to previous page
function goBack() {
    window.close();
}