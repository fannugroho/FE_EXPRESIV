// Function to go back to previous page
function goBack() {
    window.close();
}

// Helper: format date to DD/MM/YYYY
function formatDateToDDMMYYYY(dateInput) {
    if (!dateInput) return '';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return '';
    }
}

// Populate page using API response data
function populateFromApiData(apiData) {
    if (!apiData) return;

    // Header fields
    const issued = apiData.receivedDateFormatted || formatDateToDDMMYYYY(apiData.submissionDate) || '';
    document.getElementById('dateIssued').textContent = issued;
    document.getElementById('requestedDepartment').textContent = apiData.departmentName || '';
    document.getElementById('purchaseRequestNo').textContent = apiData.purchaseRequestNo || '';
    document.getElementById('classification').textContent = apiData.classification || '';
    document.getElementById('remarks').textContent = apiData.remarks || '';

    // Static form meta
    document.getElementById('rev').textContent = '01';
    document.getElementById('effectiveDate').textContent = '26 Maret 2025';

    // Approval names
    document.getElementById('requestedBy').textContent = apiData.preparedByName || apiData.requesterName || '';
    document.getElementById('checkedBy').textContent = apiData.checkedByName || '';
    document.getElementById('acknowledgedBy').textContent = apiData.acknowledgedByName || '';
    document.getElementById('approvedBy').textContent = apiData.approvedByName || '';
    document.getElementById('receivedBy').textContent = apiData.receivedByName || '';

    // Approval dates
    document.getElementById('preparedDate').textContent = apiData.preparedDateFormatted || '';
    document.getElementById('checkedDate').textContent = apiData.checkedDateFormatted || '';
    document.getElementById('acknowledgedDate').textContent = apiData.acknowledgedDateFormatted || '';
    document.getElementById('approvedDate').textContent = apiData.approvedDateFormatted || '';
    document.getElementById('receivedDate').textContent = apiData.receivedDateFormatted || '';

    // Set approval stamp visibility based on presence of corresponding dates
    const approvalStamps = document.querySelectorAll('.approval-stamp');
    if (approvalStamps.length >= 4) {
        approvalStamps[0].style.visibility = apiData.preparedDateFormatted ? 'visible' : 'hidden';
        approvalStamps[1].style.visibility = apiData.checkedDateFormatted ? 'visible' : 'hidden';
        approvalStamps[2].style.visibility = apiData.acknowledgedDateFormatted ? 'visible' : 'hidden';
        approvalStamps[3].style.visibility = apiData.approvedDateFormatted ? 'visible' : 'hidden';
    }
    // RECEIVED stamp (5th box): show when receivedDateFormatted exists, and ensure text is 'RECEIVED'
    if (approvalStamps.length >= 5) {
        const receivedHasDate = Boolean(apiData.receivedDateFormatted);
        const receivedStamp = approvalStamps[4];
        receivedStamp.style.visibility = receivedHasDate ? 'visible' : 'hidden';
        if (receivedHasDate) {
            let textEl = receivedStamp.querySelector('.approval-stamp-text');
            if (!textEl) {
                textEl = document.createElement('span');
                textEl.className = 'approval-stamp-text';
                receivedStamp.appendChild(textEl);
            }
            textEl.textContent = 'RECEIVED';
        }
    }

    // Items table
    const itemsTableBody = document.getElementById('itemsTableBody');
    itemsTableBody.innerHTML = '';
    const items = Array.isArray(apiData.itemDetails) ? apiData.itemDetails : [];
    if (items.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="7" style="text-align: center; padding: 10px;">Tidak ada item yang ditemukan</td>';
        itemsTableBody.appendChild(emptyRow);
        return;
    }

    const etaText = formatDateToDDMMYYYY(apiData.requiredDate) || new Date().toLocaleDateString('en-GB');
    items.forEach((item, index) => {
        const row = document.createElement('tr');
        const quantity = typeof item.quantity === 'number' ? item.quantity.toLocaleString('id-ID') : (item.quantity || '');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div>${item.itemNo || ''}</div>
                <div style="font-size:10px;color:#333;">${item.description || ''}</div>
            </td>
            <td>${item.detail || ''}</td>
            <td>${item.purpose || ''}</td>
            <td>${quantity}</td>
            <td>${item.uom || 'PCS'}</td>
            <td>${etaText}</td>
        `;
        itemsTableBody.appendChild(row);
    });
}

// Main
document.addEventListener('DOMContentLoaded', async function () {
    // Debug: Check if auth.js is loaded
    console.log('=== Debug Info ===');
    console.log('BASE_URL:', typeof BASE_URL !== 'undefined' ? BASE_URL : 'UNDEFINED');
    console.log('makeAuthenticatedRequest:', typeof makeAuthenticatedRequest !== 'undefined' ? 'AVAILABLE' : 'UNDEFINED');
    console.log('window.BASE_URL:', window.BASE_URL);
    console.log('==================');
    const urlParams = new URLSearchParams(window.location.search);
    const prId = urlParams.get('id') || urlParams.get('prId');

    if (!prId) {
        if (window.Swal && typeof window.Swal.fire === 'function') {
            window.Swal.fire('ID PR tidak ditemukan', 'Tambahkan parameter id pada URL.', 'error');
        }
        // Render empty state in table
        const itemsTableBody = document.getElementById('itemsTableBody');
        itemsTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:10px;">Tidak ada data</td></tr>';
        return;
    }

    try {
        const response = await makeAuthenticatedRequest(`/api/pr/item/${encodeURIComponent(prId)}`, {
            method: 'GET'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (json && json.status && json.data) {
            populateFromApiData(json.data);
        } else {
            if (window.Swal && typeof window.Swal.fire === 'function') {
                window.Swal.fire('Data tidak ditemukan', 'Tidak ada data PR untuk ID yang diberikan.', 'warning');
            }
            const itemsTableBody = document.getElementById('itemsTableBody');
            itemsTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:10px;">Tidak ada data</td></tr>';
        }
    } catch (err) {
        if (window.Swal && typeof window.Swal.fire === 'function') {
            window.Swal.fire('Gagal memuat data PR', String(err.message || err), 'error');
        }
        const itemsTableBody = document.getElementById('itemsTableBody');
        itemsTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:10px; color:red;">Gagal memuat data</td></tr>';
    }

    // Auto print after a short delay if desired
    setTimeout(function () {
        // window.print();
    }, 1000);
});