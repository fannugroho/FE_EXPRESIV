// Function to go back to previous page
function goBack() {
    window.close();
}

// Mengisi data dari parameter URL
document.addEventListener('DOMContentLoaded', function() {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Set nilai dari parameter URL
    document.getElementById('dateIssued').textContent = urlParams.get('approvedDateFormatted') || '';
    document.getElementById('requestedDepartment').textContent = urlParams.get('department') || '';
    document.getElementById('purchaseRequestNo').textContent = urlParams.get('purchaseRequestNo') || '';
    document.getElementById('classification').textContent = urlParams.get('classification') || '';
    document.getElementById('remarks').textContent = urlParams.get('remarks') || '';
    
    // Set nilai untuk form dan nomor halaman
    document.getElementById('prForm').textContent = 'KPI-F-PROC-01';
    document.getElementById('rev').textContent = '01';
    document.getElementById('effectiveDate').textContent = '26 Maret 2025';
    
    // Set nilai approval names
    document.getElementById('requestedBy').textContent = urlParams.get('requesterName') || '';
    document.getElementById('checkedBy').textContent = urlParams.get('checkedBy') || '';
    document.getElementById('acknowledgedBy').textContent = urlParams.get('acknowledgedBy') || '';
    document.getElementById('approvedBy').textContent = urlParams.get('approvedBy') || '';
    document.getElementById('receivedBy').textContent = urlParams.get('receivedBy') || '';
    
    // Set nilai approval dates
    document.getElementById('preparedDate').textContent = urlParams.get('preparedDateFormatted') || '';
    document.getElementById('checkedDate').textContent = urlParams.get('checkedDateFormatted') || '';
    document.getElementById('acknowledgedDate').textContent = urlParams.get('acknowledgedDateFormatted') || '';
    document.getElementById('approvedDate').textContent = urlParams.get('approvedDateFormatted') || '';
    
    // Get approval status from URL parameters
    const requestedApproved = urlParams.get('requestedApproved') === 'true';
    const checkedApproved = urlParams.get('checkedApproved') === 'true';
    const acknowledgedApproved = urlParams.get('acknowledgedApproved') === 'true';
    const finalApproved = urlParams.get('finalApproved') === 'true';
    
    // Show or hide approval stamps based on status
    const approvalStamps = document.querySelectorAll('.approval-stamp');
    if (approvalStamps.length >= 4) {
        // Only show stamps for approved signatures
        approvalStamps[0].style.visibility = requestedApproved ? 'visible' : 'hidden';
        approvalStamps[1].style.visibility = checkedApproved ? 'visible' : 'hidden';
        approvalStamps[2].style.visibility = acknowledgedApproved ? 'visible' : 'hidden';
        approvalStamps[3].style.visibility = finalApproved ? 'visible' : 'hidden';
    }
    
    // Current date for printing
    const currentDate = new Date().toLocaleDateString('en-GB'); // Format: DD/MM/YYYY
    
    // Mengisi tabel item
    const itemsParam = urlParams.get('items');
    if (itemsParam) {
        try {
            const items = JSON.parse(decodeURIComponent(itemsParam));
            const itemsTableBody = document.getElementById('itemsTableBody');
            
            // Clear any existing rows first
            itemsTableBody.innerHTML = '';
            
            if (items && items.length > 0) {
                items.forEach((item, index) => {
                    const row = document.createElement('tr');
                    
                    // Map the data according to the requested mapping
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${item.itemCode || ''}</td>
                        <td>${item.description || ''}</td>
                        <td>${item.purpose || ''}</td>
                        <td>${item.quantity || ''}</td>
                        <td>${item.uom || 'Pcs'}</td>
                        <td>${currentDate}</td>
                    `;
                    itemsTableBody.appendChild(row);
                });
            } else {
                // Add a message row if no items
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `
                    <td colspan="7" style="text-align: center; padding: 10px;">Tidak ada item yang ditemukan</td>
                `;
                itemsTableBody.appendChild(emptyRow);
            }
        } catch (error) {
            console.error('Error parsing items:', error);
            
            // Show error message in the table
            const errorRow = document.createElement('tr');
            errorRow.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 10px; color: red;">Terjadi kesalahan saat memuat data</td>
            `;
            itemsTableBody.appendChild(errorRow);
        }
    } else {
        // Add a message row if no items parameter
        const noParamRow = document.createElement('tr');
        noParamRow.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 10px;">Tidak ada data item yang diberikan</td>
        `;
        document.getElementById('itemsTableBody').appendChild(noParamRow);
    }
    
    // Secara otomatis mencetak setelah memuat
    setTimeout(function() {
        // Uncomment untuk mencetak otomatis saat halaman dimuat
        // window.print();
    }, 1000);
});