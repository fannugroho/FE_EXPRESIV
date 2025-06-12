// Function to go back to previous page
function goBack() {
    window.close();
}

// Mengisi data dari parameter URL
document.addEventListener('DOMContentLoaded', function() {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Set nilai dari parameter URL
    document.getElementById('dateIssued').textContent = urlParams.get('dateIssued') || '';
    document.getElementById('requestedDepartment').textContent = urlParams.get('department') || '';
    document.getElementById('purchaseRequestNo').textContent = urlParams.get('purchaseRequestNo') || '';
    document.getElementById('classification').textContent = urlParams.get('classification') || '';
    
    // Set nilai untuk form dan nomor halaman
    document.getElementById('prForm').textContent = 'KPI-F-PROC-01';
    document.getElementById('rev').textContent = '01';
    document.getElementById('effectiveDate').textContent = '01/01/2023';
    document.getElementById('page').textContent = '1 of 1';
    
    // Set nilai approval
    document.getElementById('requestedBy').textContent = urlParams.get('requesterName') || '';
    document.getElementById('checkedBy').textContent = urlParams.get('checkedBy') || '';
    document.getElementById('acknowledgedBy').textContent = urlParams.get('acknowledgedBy') || '';
    document.getElementById('approvedBy').textContent = urlParams.get('approvedBy') || '';
    document.getElementById('receivedDate').textContent = urlParams.get('receivedDate') || '';
    
    // Mengisi tabel item
    const itemsParam = urlParams.get('items');
    if (itemsParam) {
        try {
            const items = JSON.parse(decodeURIComponent(itemsParam));
            const itemsTableBody = document.getElementById('itemsTableBody');
            
            items.forEach((item, index) => {
                const row = document.createElement('tr');
                const totalAmount = (parseFloat(item.quantity) * parseFloat(item.price || 0)).toLocaleString();
                
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${item.description || ''}</td>
                    <td>${item.purpose || ''}</td>
                    <td>${item.quantity || ''}</td>
                    <td>${item.price ? parseFloat(item.price).toLocaleString() : ''}</td>
                    <td>${totalAmount}</td>
                    <td>${item.eta || ''}</td>
                `;
                itemsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error parsing items:', error);
        }
    }
    
    // Secara otomatis mencetak setelah memuat
    setTimeout(function() {
        // Uncomment untuk mencetak otomatis saat halaman dimuat
        // window.print();
    }, 1000);
}); 