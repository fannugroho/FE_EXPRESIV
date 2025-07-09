/**
 * File perbaikan untuk detailReim.html
 * Memastikan semua fungsi berjalan dengan benar
 */

// Pastikan fungsi formatCurrencyIDR dan parseCurrencyIDR tersedia
if (typeof formatCurrencyIDR !== 'function') {
    console.log('Defining formatCurrencyIDR function');
    
    // Format angka ke format mata uang IDR
    window.formatCurrencyIDR = function(amount) {
        // Pastikan amount adalah angka
        const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
        
        // Jika bukan angka yang valid, kembalikan 0.00
        if (isNaN(numAmount)) {
            return '0.00';
        }
        
        // Format angka dengan 2 digit desimal
        return numAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };
}

if (typeof parseCurrencyIDR !== 'function') {
    console.log('Defining parseCurrencyIDR function');
    
    // Parse string format mata uang IDR ke angka
    window.parseCurrencyIDR = function(currencyString) {
        if (!currencyString) return 0;
        
        // Hapus semua karakter selain angka, titik, dan tanda minus
        const numericString = currencyString.replace(/[^\d.-]/g, '');
        const value = parseFloat(numericString);
        
        return isNaN(value) ? 0 : value;
    };
}

if (typeof formatCurrencyInputIDR !== 'function') {
    console.log('Defining formatCurrencyInputIDR function');
    
    // Format input mata uang saat user mengetik
    window.formatCurrencyInputIDR = function(input) {
        // Simpan posisi kursor
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const length = input.value.length;
        
        // Parse nilai input dan format ulang
        const value = parseCurrencyIDR(input.value);
        input.value = formatCurrencyIDR(value);
        
        // Hitung perubahan panjang string
        const newLength = input.value.length;
        const diff = newLength - length;
        
        // Sesuaikan posisi kursor
        if (end + diff > 0) {
            input.setSelectionRange(start + diff, end + diff);
        }
        
        // Update total amount
        updateTotalAmount();
    };
}

// Pastikan fungsi updateTotalAmount berjalan dengan benar
document.addEventListener('DOMContentLoaded', function() {
    console.log('detailReim-fix.js loaded');
    
    // Tambahkan event listener untuk memastikan total amount diupdate setelah data dimuat
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.target.id === 'reimbursementDetails') {
                console.log('Reimbursement details table changed, updating total amount');
                updateTotalAmount();
            }
        });
    });
    
    const reimbursementDetails = document.getElementById('reimbursementDetails');
    if (reimbursementDetails) {
        observer.observe(reimbursementDetails, { childList: true });
    }
    
    // Pastikan total amount diupdate setelah halaman dimuat
    setTimeout(function() {
        console.log('Delayed updateTotalAmount call');
        updateTotalAmount();
    }, 2000);
});

// Fungsi untuk memastikan semua data diambil dengan benar
function ensureDataLoaded() {
    console.log('Ensuring all data is loaded correctly');
    
    // Cek apakah reimbursement details sudah dimuat
    const reimbursementDetails = document.getElementById('reimbursementDetails');
    if (reimbursementDetails && reimbursementDetails.children.length === 0) {
        console.log('No reimbursement details found, adding empty row');
        addRow();
    }
    
    // Cek apakah total amount sudah dihitung
    updateTotalAmount();
    
    // Cek apakah kategori sudah dimuat
    const departmentName = document.getElementById('department').value;
    const transactionType = document.getElementById('typeOfTransaction').value;
    
    if (departmentName && transactionType && (!allCategories || allCategories.length === 0)) {
        console.log('Department and transaction type are set but categories not loaded, triggering handleDependencyChange');
        handleDependencyChange();
    }
}

// Panggil ensureDataLoaded setelah halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(ensureDataLoaded, 1000);
});

// Tambahkan event listener untuk tombol Update
const updateButton = document.querySelector('button[onclick="updateReim()"]');
if (updateButton) {
    updateButton.addEventListener('click', function() {
        console.log('Update button clicked, ensuring data is loaded');
        ensureDataLoaded();
    });
}

// Tambahkan event listener untuk tombol Submit
const submitButton = document.querySelector('button[onclick="confirmSubmit()"]');
if (submitButton) {
    submitButton.addEventListener('click', function() {
        console.log('Submit button clicked, ensuring data is loaded');
        ensureDataLoaded();
    });
}

// Override fungsi submitReimbursementUpdate untuk memperbaiki masalah amount
const originalSubmitReimbursementUpdate = window.submitReimbursementUpdate;
window.submitReimbursementUpdate = async function() {
    console.log('Overriding submitReimbursementUpdate to fix amount issue');
    
    const id = getReimbursementIdFromUrl();
    if (!id) {
        Swal.fire('Error', 'No reimbursement ID found', 'error');
        return;
    }
    
    const detailsTable = document.getElementById('reimbursementDetails');
    const rows = detailsTable.querySelectorAll('tr');
    const reimbursementDetails = [];
    
    console.log(`Processing ${rows.length} reimbursement detail rows`);
    
    rows.forEach((row, index) => {
        // Get category from search input
        const categoryInput = row.querySelector('.category-search');
        const accountNameInput = row.querySelector('.account-name-search');
        const glAccountInput = row.querySelector('.gl-account');
        const descriptionInput = row.querySelector('td:nth-child(4) input');
        const amountInput = row.querySelector('td:nth-child(5) input');
        const deleteButton = row.querySelector('button');
        const detailId = deleteButton.getAttribute('data-id') || null;
        
        if (categoryInput && accountNameInput && glAccountInput && descriptionInput && amountInput) {
            // Parse amount correctly using parseCurrencyIDR
            const amountText = amountInput.value.trim();
            const numericAmount = parseCurrencyIDR(amountText);
            
            console.log(`Row ${index + 1} amount: ${amountText} -> ${numericAmount}`);
            
            reimbursementDetails.push({
                id: detailId,
                category: categoryInput.value || "",
                accountName: accountNameInput.value || "",
                glAccount: glAccountInput.value || "",
                description: descriptionInput.value || "",
                amount: numericAmount // Use correctly parsed amount
            });
        } else {
            console.error(`Missing required inputs in row ${index + 1}`);
        }
    });
    
    // Get requesterName from the search input (text value)
    const requesterName = document.getElementById('requesterNameSearch').value;
    
    // Get payTo ID from the hidden select element
    const payToSelect = document.getElementById('payToSelect');
    const payTo = payToSelect ? payToSelect.value : null;
    
    const requestData = {
        requesterName: requesterName,
        department: document.getElementById('department').value,
        currency: document.getElementById('currency').value,
        payTo: payTo,
        referenceDoc: document.getElementById('referenceDoc').value,
        typeOfTransaction: document.getElementById('typeOfTransaction').value,
        remarks: document.getElementById('remarks').value,
        preparedBy: document.getElementById('preparedBySelect').value || null,
        acknowledgedBy: document.getElementById('acknowledgeBySelect').value || null,
        checkedBy: document.getElementById('checkedBySelect').value || null,
        approvedBy: document.getElementById('approvedBySelect').value || null,
        receivedBy: document.getElementById('receivedBySelect').value || null,
        reimbursementDetails: reimbursementDetails
    };
    
    console.log('Sending update request with data:', requestData);
    
    try {
        const response = await fetch(`${BASE_URL}/api/reimbursements/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            Swal.fire(
                'Updated!',
                'Reimbursement has been updated successfully.',
                'success'
            ).then(() => {
                fetchReimbursementData();
            });
        } else {
            Swal.fire(
                'Error',
                result.message || 'Failed to update reimbursement',
                'error'
            );
        }
    } catch (error) {
        console.error('Error updating reimbursement:', error);
        Swal.fire(
            'Error',
            'An error occurred while updating the reimbursement',
            'error'
        );
    }
};

// Log untuk memastikan file ini dimuat
console.log('detailReim-fix.js has been loaded and executed'); 