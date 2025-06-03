const baseUrl = 'https://expressiv.idsdev.site';
let purchaseRequestId = '';

// Get purchase request ID from URL
function getPurchaseRequestIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('pr-id');
}

// Format number to currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount).replace('Rp', 'IDR');
}

// Format date to display format
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
}

// Fetch purchase request data from API
async function fetchPurchaseRequestData() {
    purchaseRequestId = getPurchaseRequestIdFromUrl();
    if (!purchaseRequestId) {
        console.error('No purchase request ID found in URL');
        return;
    }
    
    try {
        const response = await fetch(`${baseUrl}/api/purchase-requests/${purchaseRequestId}`);
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            populatePrintData(result.data);
        } else {
            console.error('Failed to fetch purchase request data:', result.message);
        }
    } catch (error) {
        console.error('Error fetching purchase request data:', error);
    }
}

// Populate print page with purchase request data
function populatePrintData(data) {
    // Populate header information
    document.getElementById('dateIssued').textContent = formatDate(data.requestDate);
    document.getElementById('requestedDepartment').textContent = data.department || '';
    document.getElementById('purchaseRequestNo').textContent = data.purchaseRequestNo || '';
    document.getElementById('classification').textContent = data.classification || '';
    
    // Set approvers
    document.getElementById('requestedBy').textContent = data.requestedBy || '';
    document.getElementById('checkedBy').textContent = data.checkedBy || '';
    document.getElementById('acknowledgedBy').textContent = data.acknowledgedBy || '';
    document.getElementById('approvedBy').textContent = data.approvedBy || '';
    document.getElementById('receivedDate').textContent = formatDate(data.receivedDate);
    
    // Populate items table
    populateItemsTable(data.purchaseRequestItems);
}

// Populate purchase request items table
function populateItemsTable(items) {
    const tableBody = document.getElementById('itemsTableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (items && items.length > 0) {
        items.forEach((item, index) => {
            const row = document.createElement('tr');
            const totalAmount = (parseFloat(item.quantity) * parseFloat(item.price || 0));
            
            row.innerHTML = `
                <td class="border p-2">${index + 1}</td>
                <td class="border p-2">${item.description || ''}</td>
                <td class="border p-2">${item.purpose || ''}</td>
                <td class="border p-2 text-right">${item.quantity || ''}</td>
                <td class="border p-2 text-right">${item.price ? formatCurrency(item.price) : ''}</td>
                <td class="border p-2 text-right">${formatCurrency(totalAmount)}</td>
                <td class="border p-2">${item.eta || ''}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// Go back to previous page
function goBack() {
    window.close();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    fetchPurchaseRequestData();
}); 