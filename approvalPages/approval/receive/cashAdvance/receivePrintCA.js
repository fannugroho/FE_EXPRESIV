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
        // If we have a cash advance ID, load data from API
        fetchCashAdvanceData(cashAdvanceId);
    } else {
        // Otherwise use URL parameters as fallback
        loadDataFromUrlParams();
    }
    
    // Show or hide approval stamps based on data
    showHideApprovalStamps();
});

// Send data from receiveCash.html to parent window
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
    const amountInputs = document.querySelectorAll('#tableBody input[type="number"]');
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

// Fetch cash advance data from API
function fetchCashAdvanceData(cashAdvanceId) {
    // Try to fetch from API using the ID
    fetch(`${BASE_URL}/api/cash-advance/${cashAdvanceId}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(response => {
            if (response.data) {
                populatePrintFormFromAPI(response.data);
            } else {
                // Fallback to URL parameters if API doesn't return data
                loadDataFromUrlParams();
            }
        })
        .catch(error => {
            console.error('Error fetching cash advance data:', error);
            // Fallback to URL parameters if API call fails
            loadDataFromUrlParams();
        });
}

// Populate print form with data from API
function populatePrintFormFromAPI(data) {
    // Populate header information
    document.getElementById('transactionType').textContent = data.transactionType || '';
    document.getElementById('voucherNo').textContent = data.cashAdvanceNo || '';
    document.getElementById('submissionDate').textContent = formatDate(data.submissionDate);
    document.getElementById('paidTo').textContent = ': ' + (data.payToBusinessPartnerName || '');
    
    // Set department checkbox
    if (data.departmentName) {
        const dept = data.departmentName.toLowerCase();
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
    
    // Calculate total amount from cash advance details
    let totalAmount = 0;
    if (data.cashAdvanceDetails && data.cashAdvanceDetails.length > 0) {
        data.cashAdvanceDetails.forEach(detail => {
            totalAmount += parseFloat(detail.amount) || 0;
        });
        
        // Set description and category from first item
        if (document.getElementById('description')) {
            document.getElementById('description').textContent = data.cashAdvanceDetails[0].description || '';
        }
        if (document.getElementById('category')) {
            document.getElementById('category').textContent = data.cashAdvanceDetails[0].category || '';
        }
    }
    
    // Set amount information
    document.getElementById('estimatedCost').textContent = totalAmount.toLocaleString();
    document.getElementById('amountInWords').textContent = numberToWords(totalAmount) + ' rupiah';
    
    // Set purpose
    document.getElementById('purpose').textContent = data.purpose || '';
    
    // Set remarks
    document.getElementById('remarks').textContent = data.remarks || '';
    
    // Set signatures
    const preparedName = data.preparedByName || '';
    document.getElementById('proposedName').textContent = preparedName;
    document.getElementById('proposedDate').textContent = formatDate(data.submissionDate);
    
    const checkedName = data.checkedByName || '';
    document.getElementById('checkedName').textContent = checkedName;
    document.getElementById('checkedDate').textContent = formatDate(data.checkedDate);
    
    const acknowledgedName = data.acknowledgedByName || '';
    document.getElementById('acknowledgedName').textContent = acknowledgedName;
    document.getElementById('acknowledgedDate').textContent = formatDate(data.acknowledgedDate);
    
    const approvedName = data.approvedByName || '';
    document.getElementById('approvedName').textContent = approvedName;
    document.getElementById('approvedDate').textContent = formatDate(data.approvedDate);
    
    const receivedName = data.receivedByName || data.payToBusinessPartnerName || '';
    document.getElementById('receivedName').textContent = receivedName;
    document.getElementById('receivedDate').textContent = formatDate(data.receivedDate);
    
    // Set closed by section if it exists
    if (document.getElementById('closedName')) {
        const closedName = data.closedByName || '';
        document.getElementById('closedName').textContent = closedName;
        document.getElementById('closedDate').textContent = formatDate(data.closedDate);
        
        // Show/hide closed by section based on whether there's data
        const closedBySection = document.getElementById('closedBySection');
        if (closedBySection) {
            closedBySection.style.display = closedName ? 'flex' : 'none';
        }
    }
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
    
    // Set closed by section
    const closed = urlParams.get('Closed') || '';
    if (closed) {
        document.getElementById('closedName').textContent = closed;
        document.getElementById('closedDate').textContent = formatDate(urlParams.get('postingDate') || '');
        document.getElementById('closedBySection').style.display = 'flex';
    } else {
        document.getElementById('closedBySection').style.display = 'none';
    }
    
    // Set remarks
    document.getElementById('remarks').textContent = urlParams.get('remarks') || '';
    
    // Calculate total amount from table rows (if available)
    // For simplicity, we'll use a fixed amount here
    const amount = parseFloat(urlParams.get('amount') || '0');
    document.getElementById('estimatedCost').textContent = amount.toLocaleString();
    document.getElementById('amountInWords').textContent = numberToWords(amount) + ' rupiah';
    
    // Set purpose
    document.getElementById('purpose').textContent = urlParams.get('purposed') || '';
    
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
        } else {
            // If no items data, try to get description from the first row in the table
            const descriptionInput = document.querySelector('#tableBody tr:first-child input[type="text"]');
            if (descriptionInput && document.getElementById('description')) {
                document.getElementById('description').textContent = descriptionInput.value || '';
            }
        }
    } catch (error) {
        console.error('Error parsing items data:', error);
    }
}

function showHideApprovalStamps() {
    const urlParams = new URLSearchParams(window.location.search);
    const approvalStamps = document.querySelectorAll('.approval-stamp');
    
    // Get approval status from URL parameters
    const proposedApproved = urlParams.get('proposedApproved') === 'true';
    const checkedApproved = urlParams.get('checkedApproved') === 'true';
    const acknowledgedApproved = urlParams.get('acknowledgedApproved') === 'true';
    const approvedApproved = urlParams.get('approvedApproved') === 'true';
    const receivedApproved = urlParams.get('receivedApproved') === 'true';
    
    // Show stamps only if approved
    if (approvalStamps.length >= 5) {
        approvalStamps[0].style.visibility = proposedApproved ? 'visible' : 'hidden';
        approvalStamps[1].style.visibility = checkedApproved ? 'visible' : 'hidden';
        approvalStamps[2].style.visibility = acknowledgedApproved ? 'visible' : 'hidden';
        approvalStamps[3].style.visibility = approvedApproved ? 'visible' : 'hidden';
        approvalStamps[4].style.visibility = receivedApproved ? 'visible' : 'hidden';
    }
}

// Go back to previous page
function goBack() {
    window.close();
}