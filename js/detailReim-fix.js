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
        if (typeof updateTotalAmount === 'function') {
            updateTotalAmount();
        }
    };
}

// Helper function to logout if logoutAuth is not available
function safeLogout() {
    try {
        if (typeof logoutAuth === 'function') {
            logoutAuth();
        } else {
            // Clear localStorage and redirect to login
            localStorage.clear();
            window.location.href = '../pages/login.html';
        }
    } catch (error) {
        console.error('Error during logout:', error);
        // Force logout by clearing storage and redirecting
        localStorage.clear();
        window.location.href = '../pages/login.html';
    }
}

// Helper function to navigate to menu with fallback
function safeGoToMenu() {
    try {
        if (typeof goToMenuReim === 'function') {
            goToMenuReim();
        } else {
            window.location.href = '../pages/menuReim.html';
        }
    } catch (error) {
        console.error('Error navigating to menu:', error);
        window.location.href = '../pages/approval-dashboard.html';
    }
}

// Enhanced error handling for API calls
function handleApiError(error, context = '') {
    console.error(`API Error in ${context}:`, error);
    
    let errorMessage = 'An unexpected error occurred. Please try again.';
    
    if (error.status === 400) {
        errorMessage = 'Invalid request. Please check the URL and try again.';
    } else if (error.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
        setTimeout(() => safeLogout(), 2000);
    } else if (error.status === 404) {
        errorMessage = 'The requested resource was not found.';
    } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
    }
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage,
            confirmButtonText: 'OK'
        });
    } else {
        alert(errorMessage);
    }
}

// Enhanced fetchReimbursementData with better error handling
if (typeof fetchReimbursementData !== 'undefined') {
    const originalFetchReimbursementData = fetchReimbursementData;
    
    window.fetchReimbursementData = async function() {
        const reimbursementId = getReimbursementIdFromUrl();
        if (!reimbursementId) {
            console.error('No reimbursement ID found in URL');
            handleApiError({ status: 400, message: 'No reimbursement ID found in URL' }, 'fetchReimbursementData');
            return;
        }
        
        try {
            console.log('Fetching reimbursement data for ID:', reimbursementId);
            
            // Check authentication first
            const token = getAccessToken();
            if (!token) {
                handleApiError({ status: 401, message: 'No access token found' }, 'fetchReimbursementData');
                return;
            }
            
            // Check if token is expired
            if (!isAuthenticated()) {
                handleApiError({ status: 401, message: 'Token is expired' }, 'fetchReimbursementData');
                return;
            }
            
            const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                handleApiError({ status: response.status, message: response.statusText }, 'fetchReimbursementData');
                return;
            }
            
            const result = await response.json();
            
            if (result && result.status && result.code === 200) {
                if (!result.data) {
                    handleApiError({ status: 500, message: 'No data received from API' }, 'fetchReimbursementData');
                    return;
                }
                
                console.log('Reimbursement data received:', result.data);
                
                // Call original function to process the data
                populateFormData(result.data);
                updateSubmitButtonState(result.data.preparedDate);
                toggleReimTableEditability();
                
                // Handle attachments
                if (result.data.reimbursementAttachments && result.data.reimbursementAttachments.length > 0) {
                    displayAttachments(result.data.reimbursementAttachments);
                } else if (result.data.attachments && result.data.attachments.length > 0) {
                    displayAttachments(result.data.attachments);
                } else {
                    document.getElementById('attachmentsList').innerHTML = '';
                }
            } else {
                handleApiError({ status: 500, message: result.message || 'Failed to load data' }, 'fetchReimbursementData');
            }
        } catch (error) {
            handleApiError(error, 'fetchReimbursementData');
        }
    };
}

// Pastikan fungsi displayAttachments berjalan dengan benar
if (typeof window.originalDisplayAttachments !== 'function') {
    console.log('Saving original displayAttachments function');
    window.originalDisplayAttachments = window.displayAttachments;
    
    // Override displayAttachments function
    window.displayAttachments = function(attachments) {
        console.log('Enhanced displayAttachments called with attachments:', attachments);
        
        const attachmentsList = document.getElementById('attachmentsList');
        if (!attachmentsList) {
            console.error('attachmentsList element not found!');
            return;
        }
        
        attachmentsList.innerHTML = '';
        
        // Dapatkan status dokumen untuk menentukan apakah tombol hapus ditampilkan
        const status = document.getElementById('status').value;
        console.log('Status dokumen:', status);
        
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            console.log('Jumlah attachment:', attachments.length);
            
            attachments.forEach(attachment => {
                if (!attachment) {
                    console.error('Null attachment object found');
                    return;
                }
                
                console.log('Processing attachment:', attachment);
                
                const attachmentItem = document.createElement('div');
                attachmentItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';
                
                // Pastikan attachment memiliki properti yang diperlukan
                const fileName = attachment.fileName || attachment.name || 'Unknown file';
                const filePath = attachment.filePath || attachment.path || '';
                const attachmentId = attachment.id || '';
                
                // Tambahkan tombol hapus hanya jika status dokumen adalah Draft
                if (status === 'Draft') {
                    console.log('Menampilkan tombol hapus untuk attachment:', fileName);
                    attachmentItem.innerHTML = `
                        <span>${fileName}</span>
                        <div>
                            <a href="${BASE_URL}/${filePath}" target="_blank" class="text-blue-500 hover:text-blue-700 mr-3">View</a>
                            <button type="button" onclick="deleteAttachment('${attachmentId}')" class="text-red-500 hover:text-red-700">X</button>
                        </div>
                    `;
                } else {
                    // Jika bukan Draft, hanya tampilkan tombol View
                    console.log('Status bukan Draft, hanya menampilkan tombol View untuk:', fileName);
                    attachmentItem.innerHTML = `
                        <span>${fileName}</span>
                        <a href="${BASE_URL}/${filePath}" target="_blank" class="text-blue-500 hover:text-blue-700">View</a>
                    `;
                }
                
                attachmentsList.appendChild(attachmentItem);
            });
        } else {
            console.log('Tidak ada attachment untuk ditampilkan atau format data tidak valid');
        }
    };
}

// Tambahkan fungsi untuk memastikan attachment ditampilkan
function ensureAttachmentsDisplayed() {
    console.log('Ensuring attachments are displayed');
    
    // Cek apakah kita sudah memiliki ID reimbursement
    const reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId) {
        console.error('No reimbursement ID found in URL');
        return;
    }
    
    // Panggil API untuk mendapatkan attachment
    fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}`)
        .then(response => response.json())
        .then(result => {
            if (result.status && result.code === 200) {
                console.log('Reimbursement data received for attachments:', result.data);
                
                // Cek apakah ada attachment
                let attachments = null;
                if (result.data.reimbursementAttachments && result.data.reimbursementAttachments.length > 0) {
                    attachments = result.data.reimbursementAttachments;
                    console.log('Found attachments in reimbursementAttachments:', attachments.length);
                } else if (result.data.attachments && result.data.attachments.length > 0) {
                    attachments = result.data.attachments;
                    console.log('Found attachments in attachments property:', attachments.length);
                } else {
                    console.log('No attachments found in API response');
                }
                
                // Tampilkan attachment jika ada
                if (attachments) {
                    displayAttachments(attachments);
                }
            } else {
                console.error('Failed to fetch reimbursement data for attachments:', result.message);
            }
        })
        .catch(error => {
            console.error('Error fetching reimbursement data for attachments:', error);
        });
}

// Pastikan fungsi updateTotalAmount berjalan dengan benar
document.addEventListener('DOMContentLoaded', function() {
    console.log('detailReim-fix.js loaded');
    
    // Tambahkan event listener untuk memastikan total amount diupdate setelah data dimuat
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.target.id === 'reimbursementDetails') {
                console.log('Reimbursement details table changed, updating total amount');
                if (typeof updateTotalAmount === 'function') {
                    updateTotalAmount();
                }
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
        if (typeof updateTotalAmount === 'function') {
            updateTotalAmount();
        }
        
        // Pastikan attachment ditampilkan
        ensureAttachmentsDisplayed();
    }, 2000);
});

// Fungsi untuk memastikan semua data diambil dengan benar
function ensureDataLoaded() {
    console.log('Ensuring all data is loaded correctly');
    
    // Cek apakah reimbursement details sudah dimuat
    const reimbursementDetails = document.getElementById('reimbursementDetails');
    if (reimbursementDetails && reimbursementDetails.children.length === 0) {
        console.log('No reimbursement details found, adding empty row');
        if (typeof addRow === 'function') {
            addRow();
        }
    }
    
    // Cek apakah total amount sudah dihitung
    if (typeof updateTotalAmount === 'function') {
        updateTotalAmount();
    }
    
    // Cek apakah kategori sudah dimuat
    const departmentName = document.getElementById('department').value;
    const transactionType = document.getElementById('typeOfTransaction').value;
    
    if (departmentName && transactionType && (!allCategories || allCategories.length === 0)) {
        console.log('Department and transaction type are set but categories not loaded, triggering handleDependencyChange');
        if (typeof handleDependencyChange === 'function') {
            handleDependencyChange();
        }
    }
    
    // Pastikan attachment ditampilkan
    ensureAttachmentsDisplayed();
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
        
        // Hanya proses baris yang memiliki data-id (baris yang sudah ada)
        if (detailId && categoryInput && accountNameInput && glAccountInput && descriptionInput && amountInput) {
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
        } else if (!detailId) {
            console.log(`Row ${index + 1} is a new row (no data-id), skipping for PUT request`);
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
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to update reimbursement');
        }
        
        return result;
    } catch (error) {
        console.error('Error updating reimbursement:', error);
        throw error;
    }
};

// Log untuk memastikan file ini dimuat
console.log('detailReim-fix.js has been loaded and executed'); 