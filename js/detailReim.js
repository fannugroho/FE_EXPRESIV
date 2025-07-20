// Global variables
let uploadedFiles = [];
let reimbursementId = '';
let allCategories = [];
let allAccountNames = [];
let transactionTypes = []; // Added to store transaction types
let businessPartners = []; // Added to store business partners

// Currency formatting functions
function formatCurrencyIDR(number) {
    // Handle input kosong atau tidak valid
    if (number === null || number === undefined || number === '') {
        return '0.00';
    }
    
    // Parse angka, pastikan dapat menangani nilai yang sangat besar
    let num;
    try {
        // Handle input string yang mungkin sangat besar
        if (typeof number === 'string') {
            // Hapus semua karakter non-numerik kecuali titik desimal dan koma
            const cleanedStr = number.replace(/[^\d,.]/g, '');
            // Gunakan parseFloat untuk angka kecil, dan untuk angka besar gunakan teknik string
            if (cleanedStr.length > 15) {
                // Untuk angka yang sangat besar, kita perlu menangani dengan hati-hati
                // Hapus koma dan parse
                num = Number(cleanedStr.replace(/,/g, ''));
            } else {
                num = parseFloat(cleanedStr.replace(/,/g, ''));
            }
        } else {
            num = Number(number); // Gunakan Number untuk menangani angka besar dengan lebih baik
        }
        
        // Jika parsing gagal, kembalikan string kosong
        if (isNaN(num)) {
            return '0.00';
        }
    } catch (e) {
        console.error('Error parsing number:', e);
        return '0.00';
    }
    
    // Batasi maksimum 100 triliun
    const maxAmount = 100000000000000; // 100 triliun
    if (num > maxAmount) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Amount Exceeds Limit',
                text: 'Total amount must not exceed 100 trillion rupiah'
            });
        } else {
            alert('Total amount must not exceed 100 trillion rupiah');
        }
        num = maxAmount;
    }
    
    // Format dengan format US (koma sebagai pemisah ribuan, titik sebagai pemisah desimal)
    // Untuk angka yang sangat besar, gunakan metode manual
    if (num >= 1e12) { // Jika angka >= 1 triliun
        let strNum = num.toString();
        let result = '';
        let count = 0;
        
        // Tambahkan koma setiap 3 digit dari belakang
        for (let i = strNum.length - 1; i >= 0; i--) {
            result = strNum[i] + result;
            count++;
            if (count % 3 === 0 && i > 0) {
                result = ',' + result;
            }
        }
        
        // Tambahkan 2 desimal
        return result + '.00';
    } else {
        // Untuk angka yang lebih kecil, gunakan toLocaleString
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

function parseCurrencyIDR(formattedValue) {
    if (!formattedValue) return 0;
    
    try {
        // Tangani format US (pemisah ribuan: ',', pemisah desimal: '.')
        // Hapus koma (pemisah ribuan)
        const numericValue = formattedValue.toString().replace(/,/g, '');
        
        return parseFloat(numericValue) || 0;
    } catch (e) {
        console.error('Error parsing currency:', e);
        return 0;
    }
}

function formatCurrencyInputIDR(input) {
    // Simpan posisi kursor
    const cursorPos = input.selectionStart;
    const originalLength = input.value.length;
    
    // Ambil nilai dan hapus semua karakter non-digit, titik dan koma
    let value = input.value.replace(/[^\d,.]/g, '');
    
    // Pastikan hanya ada satu pemisah desimal
    let parts = value.split('.');
    if (parts.length > 1) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Parse nilai ke angka untuk perhitungan
    const numValue = parseCurrencyIDR(value);
    
    // Format dengan format US
    const formattedValue = formatCurrencyIDR(numValue);
    
    // Perbarui nilai input
    input.value = formattedValue;
    
    // Hitung dan perbarui total
    updateTotalAmount();
    
    // Sesuaikan posisi kursor
    const newLength = input.value.length;
    const newCursorPos = cursorPos + (newLength - originalLength);
    input.setSelectionRange(Math.max(0, newCursorPos), Math.max(0, newCursorPos));
}

// Add document ready event listener
document.addEventListener("DOMContentLoaded", function() {
    console.log('DOMContentLoaded event fired');
    console.log('BASE_URL:', BASE_URL);
    console.log('Current URL:', window.location.href);
    
            // Check if BASE_URL is valid
        if (!BASE_URL || BASE_URL.trim() === '') {
            console.error('BASE_URL is not defined or empty');
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Configuration Error',
                    text: 'Application configuration is invalid. Please contact administrator.',
                    confirmButtonText: 'OK'
                });
            } else {
                alert('Application configuration is invalid. Please contact administrator.');
            }
            return;
        }
    
    // Check if we have a valid reimbursement ID first
    const reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId) {
        console.error('No valid reimbursement ID found in URL');
        Swal.fire({
            icon: 'error',
            title: 'Invalid URL',
            text: 'No valid reimbursement ID found in URL. Please go back and try again.',
            confirmButtonText: 'OK'
        }).then(() => {
            goToMenuReim();
        });
        return;
    }
    
    // Call function to control button visibility
    controlButtonVisibility();
    
    // Fetch reimbursement data
    fetchReimbursementData();
    
    // Check authentication before fetching other data
    if (!isAuthenticated()) {
        console.error('User not authenticated');
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Authentication Required',
                text: 'Please login again to access this page.',
                confirmButtonText: 'OK'
            }).then(() => {
                logoutAuth();
            });
        } else {
            alert('Please login again to access this page.');
            logoutAuth();
        }
        return;
    }
    
    // Fetch departments for dropdown
    fetchDepartments();
    
    // Fetch users for dropdowns
    fetchUsers();
    
    // Fetch transaction types
    fetchTransactionTypes();
    
    // Fetch business partners
    fetchBusinessPartners();
    
    // Setup event listeners for department and transaction type changes
    const departmentSelect = document.getElementById('department');
    const transactionTypeSelect = document.getElementById('typeOfTransaction');
    
    if (departmentSelect) {
        departmentSelect.addEventListener('change', handleDependencyChange);
    }
    
    if (transactionTypeSelect) {
        transactionTypeSelect.addEventListener('change', handleDependencyChange);
    }
    
    // Setup event listener to hide dropdown when clicking outside
    document.addEventListener('click', function(event) {
        // Handle user search dropdowns
        const dropdowns = [
            'requesterNameSelectDropdown',
            'payToSelectDropdown',
            'preparedBySelectDropdown', 
            'acknowledgeBySelectDropdown', 
            'checkedBySelectDropdown', 
            'approvedBySelectDropdown',
            'receivedBySelectDropdown'
        ];
        
        const searchInputs = [
            'requesterNameSearch',
            'payToSearch',
            'preparedBySearch', 
            'acknowledgeBySearch', 
            'checkedBySearch', 
            'approvedBySearch',
            'receivedBySearch'
        ];
        
        dropdowns.forEach((dropdownId, index) => {
            const dropdown = document.getElementById(dropdownId);
            const input = document.getElementById(searchInputs[index]);
            
            if (dropdown && input) {
                if (!input.contains(event.target) && !dropdown.contains(event.target)) {
                    dropdown.classList.add('hidden');
                }
            }
        });
        
        // Handle table row dropdowns
        const categoryDropdowns = document.querySelectorAll('.category-dropdown');
        const accountNameDropdowns = document.querySelectorAll('.account-name-dropdown');
        
        categoryDropdowns.forEach(dropdown => {
            const input = dropdown.parentElement.querySelector('.category-search');
            if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
        
        accountNameDropdowns.forEach(dropdown => {
            const input = dropdown.parentElement.querySelector('.account-name-search');
            if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
    });
    
    // Tambahkan ini untuk memastikan tabel diatur dengan benar saat halaman dimuat
    toggleReimTableEditability();
});

function saveDocument() {
    let documents = JSON.parse(localStorage.getItem("documentsReim")) || [];
    const docNumber = `REIM${Date.now()}`; // Gunakan timestamp agar unik

    const documentData = {
        docNumber,
        outno: document.getElementById("outgoingNo").value,
                requester: document.getElementById("requester").value,
                department: document.getElementById("department").value,
                toOrderOf : document.getElementById("toOrderOf").value,
                payTo : document.getElementById("PayTo").value,
                docCurrency : document.getElementById("docCurrency").value,
                Reference : document.getElementById("reference").value,
                ReferenceDoc : document.getElementById("referenceDoc").value,
                postingDate: document.getElementById("postingDate").value,
                classification: document.getElementById("classification").value,
                type: document.getElementById("type").value,
                docStatus: document.getElementById("docStatus").value,
                approvals: {
                    prepared: document.getElementById("prepared").checked,
                    checked: document.getElementById("checked").checked,
                    approved: document.getElementById("approved").checked,
                    knowledge: document.getElementById("knowledge").checked,
                }
    };

    documents.push(documentData);
    localStorage.setItem("documentsReim", JSON.stringify(documents));
    alert("Dokumen berhasil disimpan!");
}

function updateApprovalStatus(docNumber, statusKey) {
    let documents = JSON.parse(localStorage.getItem("documentsReim")) || [];
    let docIndex = documents.findIndex(doc => doc.docNumber === docNumber);
    if (docIndex !== -1) {
        documents[docIndex].approvals[statusKey] = true;
        localStorage.setItem("documentsReim", JSON.stringify(documents));
        alert(`Document ${statusKey} updated!`);
    }
}


document.getElementById("docType")?.addEventListener("change", function () {
    const prTable = document.getElementById("prTable");
    prTable.style.display = this.value === "Pilih" ? "none" : "table";
});

// Modifikasi fungsi previewPDF untuk mengupload file langsung ke server
function previewPDF(event) {
    // Mendapatkan file yang dipilih oleh user
    const files = event.target.files;
    if (files.length === 0) return;

    // Validasi: Hanya file PDF yang diperbolehkan
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== 'application/pdf') {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File Type',
                text: `File "${file.name}" bukan file PDF. Hanya file PDF yang diperbolehkan.`
            });
            // Reset file input
            event.target.value = '';
            return;
        }
    }

    // Panggil fungsi untuk upload file ke server
    uploadAttachments(files);
}

// Fungsi untuk mengupload attachment ke server
// Menggunakan endpoint: ${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/upload
async function uploadAttachments(files) {
    // Dapatkan ID reimbursement dari URL
    const reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId) {
        alert('ID reimbursement tidak ditemukan');
        return;
    }
    
    // Validasi tambahan: Pastikan semua file adalah PDF
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== 'application/pdf') {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File Type',
                text: `File "${file.name}" bukan file PDF. Hanya file PDF yang diperbolehkan.`
            });
            return;
        }
    }
    
    try {
        // Persiapkan FormData untuk upload file
        const formData = new FormData();
        
        // Tambahkan semua file ke formData
        Array.from(files).forEach(file => {
            formData.append('files', file);
            console.log('Menambahkan file untuk upload:', file.name);
        });
        
        // Kirim ke server menggunakan API endpoint upload attachment
        console.log(`Uploading attachments to: ${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/upload`);
        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/upload`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            console.log('Upload attachment berhasil:', result);
            
            // Refresh data untuk menampilkan attachment baru
            fetchReimbursementData();
        } else {
            alert('Gagal mengupload file: ' + (result.message || 'Terjadi kesalahan'));
            console.error('Upload attachment gagal:', result);
        }
    } catch (error) {
        console.error('Error uploading attachments:', error);
        alert('Terjadi kesalahan saat mengupload file');
    }
}

function addRow() {
    const tableBody = document.getElementById('reimbursementDetails');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td class="p-2 border">
            <div class="relative">
                <input type="text" placeholder="Search category..." class="w-full p-1 border rounded search-input category-search" />
                <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden category-dropdown"></div>
                <select class="hidden category-select">
                    <option value="" disabled selected>Choose Category</option>
                </select>
            </div>
        </td>
        <td class="p-2 border">
            <div class="relative">
                <input type="text" placeholder="Search account name..." class="w-full p-1 border rounded search-input account-name-search" />
                <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden account-name-dropdown"></div>
                <select class="hidden account-name-select">
                    <option value="" disabled selected>Choose Account Name</option>
                </select>
            </div>
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full p-1 border rounded bg-gray-200 cursor-not-allowed gl-account" disabled />
        </td>
        <td class="p-2 border">
            <input type="text" maxlength="200" class="w-full p-1 border rounded" required />
        </td>
        <td class="p-2 border">
            <input type="text" class="w-full p-1 border rounded currency-input-idr" value="0.00" oninput="formatCurrencyInputIDR(this)" required autocomplete="off" />
        </td>
        <td class="p-2 border text-center">
            <button type="button" onclick="deleteRow(this)" class="text-red-500 hover:text-red-700">
                🗑
            </button>
        </td>
    `;
    tableBody.appendChild(newRow);
    
    // Setup event listeners for the new row
    setupRowEventListeners(newRow);
    
    // Populate categories for the new row if data is available
    populateCategoriesForNewRow(newRow);
}

function deleteRow(button) {
    button.closest("tr").remove();
    // Update total amount after row deletion
    updateTotalAmount();
}

function confirmDelete() {
    Swal.fire({
        title: 'Apakah dokumen ini akan dihapus?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteDocument(); // Memanggil fungsi delete setelah konfirmasi
        }
    });
}

async function deleteDocument() {
    // Get the ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('reim-id');
    
    if (!id) {
        Swal.fire('Error!', 'ID reimbursement tidak ditemukan.', 'error');
        return;
    }
    
    try {
        // Call the DELETE API
        const response = await fetch(`${BASE_URL}/api/reimbursements/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.status) {
            Swal.fire('Terhapus!', 'Dokumen berhasil dihapus.', 'success')
            .then(() => {
                // Redirect to previous page or list page after successful deletion
                window.history.back();
            });
        } else {
            Swal.fire('Error!', data.message || 'Gagal menghapus dokumen.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error!', 'Terjadi kesalahan saat menghapus dokumen.', 'error');
    }
}

function confirmSubmit() {
    Swal.fire({
        title: 'Konfirmasi',
        text: 'Apakah dokumen sudah benar?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya',
        cancelButtonText: 'Batal',
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // First call submitReimbursementUpdate
                await submitReimbursementUpdate();
                // Then call submitDocument after the update completes
                submitDocument();
            } catch (error) {
                console.error('Error during update and submit:', error);
                Swal.fire('Error', 'Terjadi kesalahan saat memproses dokumen', 'error');
            }
        }
    });
}

async function submitDocument() {
    const id = getReimbursementIdFromUrl();
    if (!id) {
        Swal.fire('Error', 'No reimbursement ID found', 'error');
        return;
    }
    
    try {
        // Get current date as submission date
        const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        // Prepare request data with new submission date
        const requestData = {
            submissionDate: currentDate
        };
        
        console.log('Submitting with new submission date:', currentDate);
        
        // Call the API to prepare the document with updated submission date
        const response = await fetch(`${BASE_URL}/api/reimbursements/prepared/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.status && result.code === 200) {
            Swal.fire(
                'Submitted!',
                result.message || 'Reimbursement prepared successfully.',
                'success'
            ).then(() => {
                // Redirect to menuReim.html after successful submission
                window.location.href = '../pages/menuReim.html';
            });
        } else {
            Swal.fire(
                'Error',
                result.message || 'Failed to prepare reimbursement',
                'error'
            );
        }
    } catch (error) {
        console.error('Error preparing reimbursement:', error);
        Swal.fire(
            'Error',
            'An error occurred while preparing the reimbursement',
            'error'
        );
    }
}

function getReimbursementIdFromUrl() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const reimId = urlParams.get('reim-id');
        
        console.log('URL parameters:', window.location.search);
        console.log('Extracted reim-id:', reimId);
        
        // Validate the ID
        if (!reimId) {
            console.error('No reim-id parameter found in URL');
            return null;
        }
        
        // Check if it's a valid ID (should be a number or alphanumeric)
        if (typeof reimId === 'string' && reimId.trim() === '') {
            console.error('reim-id parameter is empty');
            return null;
        }
        
        // Remove any whitespace
        const cleanId = reimId.trim();
        
        // Additional validation for numeric IDs
        if (!isNaN(cleanId)) {
            const numId = parseInt(cleanId);
            if (numId <= 0) {
                console.error('Invalid reim-id: must be a positive number');
                return null;
            }
            return numId.toString();
        }
        
        // For non-numeric IDs, just return the cleaned string
        return cleanId;
        
    } catch (error) {
        console.error('Error parsing URL parameters:', error);
        return null;
    }
}

// Function to get current logged-in user using auth.js
function getCurrentLoggedInUser() {
    try {
        const currentUser = getCurrentUser(); // Use function from auth.js
        if (!currentUser) return null;
        
        return {
            id: currentUser.userId,
            name: currentUser.username || ''
        };
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Function to auto-fill preparedBy with current logged-in user
function autofillPreparedByWithCurrentUser(users) {
    const currentUser = getCurrentLoggedInUser();
    if (!currentUser) return;
    
    // Find the current user in the users list to get their full name
    const matchingUser = users.find(user => user.id.toString() === currentUser.id.toString());
    
    if (matchingUser) {
        // Combine names with spaces, handling empty middle/last names
        let displayName = matchingUser.fullName;
        
        // Set the preparedBy search input value and disable it
        const preparedBySearch = document.getElementById('preparedBySearch');
        
        if (preparedBySearch) {
            preparedBySearch.value = displayName;
            // Disable the preparedBy field since it's auto-filled with current user
            preparedBySearch.disabled = true;
            preparedBySearch.classList.add('bg-gray-200', 'cursor-not-allowed');
        }
        
        // Also set the select element value to ensure it's available for form submission
        const preparedBySelect = document.getElementById("preparedBySelect");
        if (preparedBySelect) {
            // Clear existing options
            preparedBySelect.innerHTML = '<option value="" disabled selected>Choose Name</option>';
            
            // Add current user as an option
            const option = document.createElement('option');
            option.value = currentUser.id;
            option.textContent = displayName;
            option.selected = true;
            preparedBySelect.appendChild(option);
            
            console.log('Auto-filled preparedBy select with current user:', currentUser.id);
        }
    }
}

async function fetchReimbursementData() {
    reimbursementId = getReimbursementIdFromUrl();
            if (!reimbursementId) {
            console.error('No reimbursement ID found in URL');
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid URL',
                    text: 'No reimbursement ID found in URL. Please go back and try again.',
                    confirmButtonText: 'OK'
                }).then(() => {
                    goToMenuReim();
                });
            } else {
                alert('No reimbursement ID found in URL. Please go back and try again.');
                goToMenuReim();
            }
            return;
        }
    
    try {
        console.log('Fetching reimbursement data for ID:', reimbursementId);
        console.log('API URL:', `${BASE_URL}/api/reimbursements/${reimbursementId}`);
        
        // Check authentication first
        const token = getAccessToken();
        if (!token) {
            console.error('No access token found');
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Authentication Required',
                    text: 'Please login again to access this page.',
                    confirmButtonText: 'OK'
                }).then(() => {
                    logoutAuth();
                });
            } else {
                alert('Please login again to access this page.');
                logoutAuth();
            }
            return;
        }
        
        // Check if token is expired
        if (!isAuthenticated()) {
            console.error('Token is expired');
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Session Expired',
                    text: 'Your session has expired. Please login again.',
                    confirmButtonText: 'OK'
                }).then(() => {
                    logoutAuth();
                });
            } else {
                alert('Your session has expired. Please login again.');
                logoutAuth();
            }
            return;
        }
        
        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        // Handle different HTTP status codes
        if (response.status === 400) {
            console.error('Bad Request (400): Invalid reimbursement ID or malformed request');
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Request',
                    text: 'The reimbursement ID is invalid or the request is malformed. Please check the URL and try again.',
                    confirmButtonText: 'OK'
                }).then(() => {
                    goToMenuReim();
                });
            } else {
                alert('The reimbursement ID is invalid or the request is malformed. Please check the URL and try again.');
                goToMenuReim();
            }
            return;
        }
        
        if (response.status === 401) {
            console.error('Unauthorized (401): Authentication required');
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Authentication Required',
                    text: 'Please login again to access this page.',
                    confirmButtonText: 'OK'
                }).then(() => {
                    logoutAuth();
                });
            } else {
                alert('Please login again to access this page.');
                logoutAuth();
            }
            return;
        }
        
        if (response.status === 404) {
            console.error('Not Found (404): Reimbursement not found');
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Reimbursement Not Found',
                    text: 'The requested reimbursement document was not found. It may have been deleted or you may not have permission to view it.',
                    confirmButtonText: 'OK'
                }).then(() => {
                    goToMenuReim();
                });
            } else {
                alert('The requested reimbursement document was not found. It may have been deleted or you may not have permission to view it.');
                goToMenuReim();
            }
            return;
        }
        
        if (response.status === 500) {
            console.error('Internal Server Error (500): Server error');
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Server Error',
                    text: 'An internal server error occurred. Please try again later.',
                    confirmButtonText: 'OK'
                });
            } else {
                alert('An internal server error occurred. Please try again later.');
            }
            return;
        }
        
        if (!response.ok) {
            console.error('HTTP Error:', response.status, response.statusText);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Network Error',
                    text: `Failed to fetch reimbursement data. Status: ${response.status} ${response.statusText}`,
                    confirmButtonText: 'OK'
                });
            } else {
                alert(`Failed to fetch reimbursement data. Status: ${response.status} ${response.statusText}`);
            }
            return;
        }
        
        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Response',
                    text: 'The server returned an invalid response. Please try again.',
                    confirmButtonText: 'OK'
                });
            } else {
                alert('The server returned an invalid response. Please try again.');
            }
            return;
        }
        
        if (result && result.status && result.code === 200) {
            if (!result.data) {
                console.error('No data received from API');
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'error',
                        title: 'No Data',
                        text: 'No reimbursement data was received from the server.',
                        confirmButtonText: 'OK'
                    });
                } else {
                    alert('No reimbursement data was received from the server.');
                }
                return;
            }
            
            console.log('Reimbursement data received:', result.data);
            console.log('Status:', result.data.status);
            console.log('Rejection remarks:', result.data.rejectionRemarks);
            
            // Debugging untuk memeriksa properti data
            console.log('Checking reimbursement data structure:');
            console.log('- reimbursementDetails:', result.data.reimbursementDetails ? result.data.reimbursementDetails.length : 'not found');
            console.log('- reimbursementAttachments:', result.data.reimbursementAttachments ? result.data.reimbursementAttachments.length : 'not found');
            console.log('- attachments:', result.data.attachments ? result.data.attachments.length : 'not found');
            
            // Menyalin data ke properti yang diharapkan jika tidak ada
            if (!result.data.reimbursementDetails && result.data.details) {
                console.log('Copying details to reimbursementDetails');
                result.data.reimbursementDetails = result.data.details;
            }
            
            if (!result.data.reimbursementAttachments && result.data.attachments) {
                console.log('Copying attachments to reimbursementAttachments');
                result.data.reimbursementAttachments = result.data.attachments;
            }
            
            populateFormData(result.data);
            updateSubmitButtonState(result.data.preparedDate);
            
            // Tambahkan ini di akhir fungsi setelah data dimuat
            toggleReimTableEditability();
            
            // Bagian yang memproses data attachment - perbaikan untuk mendukung kedua nama properti
            if (result.data.reimbursementAttachments && result.data.reimbursementAttachments.length > 0) {
                console.log('Mendapatkan data attachment (dari reimbursementAttachments):', result.data.reimbursementAttachments.length, 'file');
                displayAttachments(result.data.reimbursementAttachments);
            } else if (result.data.attachments && result.data.attachments.length > 0) {
                console.log('Mendapatkan data attachment (dari attachments):', result.data.attachments.length, 'file');
                displayAttachments(result.data.attachments);
            } else {
                console.log('Tidak ada attachment untuk reimbursement ini');
                document.getElementById('attachmentsList').innerHTML = '';
            }
        } else {
            console.error('Failed to fetch reimbursement data:', result);
            
            // Handle different response formats
            let errorMessage = 'Failed to load reimbursement data. Please try again.';
            
            if (result && typeof result === 'object') {
                errorMessage = result.message || result.error || result.errorMessage || errorMessage;
            } else if (typeof result === 'string') {
                errorMessage = result;
            }
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to Load Data',
                    text: errorMessage,
                    confirmButtonText: 'OK'
                });
            } else {
                alert(errorMessage);
            }
        }
    } catch (error) {
        console.error('Error fetching reimbursement data:', error);
        
        // Check if it's a network error
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Network Error',
                    text: 'Unable to connect to the server. Please check your internet connection and try again.',
                    confirmButtonText: 'OK'
                });
            } else {
                alert('Unable to connect to the server. Please check your internet connection and try again.');
            }
        } else if (error.name === 'SyntaxError') {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Response',
                    text: 'The server returned an invalid response format. Please try again.',
                    confirmButtonText: 'OK'
                });
            } else {
                alert('The server returned an invalid response format. Please try again.');
            }
        } else {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `An unexpected error occurred: ${error.message}`,
                    confirmButtonText: 'OK'
                });
            } else {
                alert(`An unexpected error occurred: ${error.message}`);
            }
        }
    }
}

// Function to update Submit button state based on preparedDate
function updateSubmitButtonState(preparedDate) {
    const submitButton = document.querySelector('button[onclick="confirmSubmit()"]');
    if (submitButton) {
        if (preparedDate === null) {
            // Enable the button if preparedDate is null
            submitButton.disabled = false;
            submitButton.classList.remove('bg-gray-400', 'hover:bg-gray-400', 'cursor-not-allowed');
            submitButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
        } else {
            // Disable the button if preparedDate is not null
            submitButton.disabled = true;
            submitButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            submitButton.classList.add('bg-gray-400', 'hover:bg-gray-400', 'cursor-not-allowed');
        }
    }
}

// Fungsi untuk mengontrol apakah tabel reimbursement bisa diedit berdasarkan status
function toggleReimTableEditability() {
    // Aktifkan semua input dan tombol tanpa pembatasan status
    
    // Tampilkan tombol tambah baris
    const addRowButton = document.querySelector('button[onclick="addRow()"]');
    if (addRowButton) {
        addRowButton.style.display = 'block';
    }
    
    // Aktifkan tombol hapus pada baris
    const deleteButtons = document.querySelectorAll('#reimbursementDetails button[onclick="deleteRow(this)"]');
    deleteButtons.forEach(button => {
        button.style.display = 'inline-block';
    });
    
    // Aktifkan semua input di dalam tabel reimbursement
    const tableInputs = document.querySelectorAll('#reimbursementDetails input, #reimbursementDetails select');
    tableInputs.forEach(input => {
        input.disabled = false;
        input.classList.remove('bg-gray-100', 'cursor-not-allowed');
    });
    
    // Aktifkan dropdown search
    const searchInputs = document.querySelectorAll('#reimbursementDetails .search-input');
    searchInputs.forEach(input => {
        input.disabled = false;
        input.classList.remove('bg-gray-100', 'cursor-not-allowed');
    });
}

// Function to fetch departments from API
async function fetchDepartments() {
    try {
        const response = await fetch(`${BASE_URL}/api/department`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        
        const data = await response.json();
        console.log("Department data:", data);
        populateDepartmentSelect(data.data);
    } catch (error) {
        console.error('Error fetching departments:', error);
    }
}

// Helper function to populate department dropdown
function populateDepartmentSelect(departments) {
    const departmentSelect = document.getElementById("department");
    if (!departmentSelect) return;
    
    // Clear existing options except the first one (if any)
    departmentSelect.innerHTML = '<option value="" disabled>Select Department</option>';
    
    departments.forEach(department => {
        const option = document.createElement("option");
        option.value = department.name;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
    });
    
    // Disable department selection since it will be auto-filled based on requester
    departmentSelect.disabled = true;
    departmentSelect.classList.add('bg-gray-200', 'cursor-not-allowed');
}

// Helper function to set department value, creating option if it doesn't exist
function setDepartmentValue(departmentName) {
    const departmentSelect = document.getElementById("department");
    if (!departmentSelect || !departmentName) return;
    
    // Try to find existing option
    let optionExists = false;
    for (let i = 0; i < departmentSelect.options.length; i++) {
        if (departmentSelect.options[i].value === departmentName || 
            departmentSelect.options[i].textContent === departmentName) {
            departmentSelect.selectedIndex = i;
            optionExists = true;
            break;
        }
    }
    
    // If option doesn't exist, create and add it
    if (!optionExists) {
        const newOption = document.createElement('option');
        newOption.value = departmentName;
        newOption.textContent = departmentName;
        newOption.selected = true;
        departmentSelect.appendChild(newOption);
    }
    
    // Trigger dependency change to update categories if transaction type is also selected
    const transactionType = document.getElementById('typeOfTransaction').value;
    if (transactionType) {
        handleDependencyChange();
    }
}

// Helper function to auto-fill department based on selected requester
function autoFillDepartmentFromRequester(requesterName, users) {
    console.log('Auto-filling department for requester:', requesterName);
    console.log('Available users:', users);
    
    // Find the user by name from the users data passed from API
    const selectedUser = users.find(user => {
        // In detailReim, the users are stored with simplified structure {id, name}
        return user.name === requesterName;
    });
    
    console.log('Selected user:', selectedUser);
    
    if (!selectedUser) {
        console.log('User not found in users list');
        return;
    }
    
    // Use the improved department fetching function
    autoFillDepartmentFromRequesterById(selectedUser.id);
}

// Helper function to auto-fill department based on selected requester ID (improved version)
async function autoFillDepartmentFromRequesterById(userId) {
    console.log('Auto-filling department for user ID:', userId);
    
    try {
        // First try to use cached users data from window.allUsers
        if (window.allUsers && window.allUsers.length > 0) {
            const user = window.allUsers.find(u => u.id === userId);
            if (user && user.department) {
                console.log('Found user in cached data:', user);
                console.log('Department from cache:', user.department);
                setDepartmentValue(user.department);
                return;
            } else {
                console.log('User not found in cache or no department in cached data');
            }
        }
        
        // Fallback: Fetch full user details from API to get department
        console.log('Fetching user details from API...');
        const response = await fetch(`${BASE_URL}/api/users/${userId}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch user details');
        }
        
        const user = result.data;
        console.log('User details from API:', user);
        
        // Try different department field names that might exist
        const userDepartment = user.department || 
                              user.departmentName || 
                              user.dept ||
                              user.departement;
        
        console.log('User department from API:', userDepartment);
        
        if (!userDepartment) {
            console.log('No department found for user, checking if user has employeeId for additional lookup');
            
            // Try to fetch department via employee endpoint if available
            if (user.employeeId) {
                try {
                    const employeeResponse = await fetch(`${BASE_URL}/api/employees/${user.employeeId}`);
                    if (employeeResponse.ok) {
                        const employeeResult = await employeeResponse.json();
                        if (employeeResult.status && employeeResult.data) {
                            const employeeDepartment = employeeResult.data.department || 
                                                     employeeResult.data.departmentName ||
                                                     employeeResult.data.dept;
                            if (employeeDepartment) {
                                console.log('Found department via employee lookup:', employeeDepartment);
                                setDepartmentValue(employeeDepartment);
                                return;
                            }
                        }
                    }
                } catch (error) {
                    console.log('Employee lookup failed:', error);
                }
            }
            
            console.log('No department found for user, enabling manual selection');
            // Enable manual department selection as fallback
            const departmentSelect = document.getElementById("department");
            if (departmentSelect) {
                departmentSelect.disabled = false;
                departmentSelect.classList.remove('bg-gray-200', 'cursor-not-allowed');
                departmentSelect.classList.add('bg-white');
                
                // Update the default option to indicate manual selection is needed
                const defaultOption = departmentSelect.querySelector('option[value=""]');
                if (defaultOption) {
                    defaultOption.textContent = 'Please select department manually';
                    defaultOption.style.color = '#f59e0b'; // amber color for attention
                }
            }
            return;
        }
        
        // Set department value (will create option if it doesn't exist)
        setDepartmentValue(userDepartment);
        
    } catch (error) {
        console.error('Error fetching user department:', error);
    }
}

// Legacy function for backward compatibility
async function fetchUserDepartment(userId) {
    // Redirect to the improved function
    await autoFillDepartmentFromRequesterById(userId);
}

// Fetch users from API and populate dropdown selects
async function fetchUsers() {
    try {
        const response = await fetch(`${BASE_URL}/api/users`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch users');
        }
        
        const users = result.data;
        
        // Store users globally for later use
        window.allUsers = users;
        console.log('Stored', users.length, 'users in global cache');
        
        // Populate dropdowns
        populateDropdown("requesterNameSelect", users, true); // Use name as value
        populateDropdown("payToSelect", users, false); // Add payToSelect dropdown population
        
        // For approval fields, we'll populate them based on transaction type selection
        // Don't populate them with all users initially
        
        // Auto-fill preparedBy with current logged-in user
        autofillPreparedByWithCurrentUser(users);
        
        // Add event listener for transaction type dropdown to populate superior employees
        const transactionTypeSelect = document.getElementById("typeOfTransaction");
        if (transactionTypeSelect) {
            transactionTypeSelect.addEventListener("change", function() {
                const selectedTransactionType = this.value;
                if (selectedTransactionType) {
                    console.log('Transaction type changed to:', selectedTransactionType);
                    populateAllSuperiorEmployeeDropdowns(selectedTransactionType);
                }
            });
        }
        
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

// Function to filter and display user dropdown
function filterUsers(fieldId) {
    const searchInput = document.getElementById(`${fieldId.replace('Select', '')}Search`);
    if (!searchInput) return;
    
    const searchText = searchInput.value.toLowerCase();
    const dropdown = document.getElementById(`${fieldId}Dropdown`);
    if (!dropdown) return;
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    let filteredUsers = [];
    
    // Handle payToSelect dropdown separately
    if (fieldId === 'payToSelect') {
        try {
            // Use users data instead of business partners (same as addReim.js)
            const users = JSON.parse(searchInput.dataset.users || '[]');
            const filtered = users.filter(user => 
                user && user.fullName && 
                (user.fullName.toLowerCase().includes(searchText) || 
                user.employeeId && user.employeeId.toLowerCase().includes(searchText) ||
                user.kansaiEmployeeId && user.kansaiEmployeeId.toLowerCase().includes(searchText))
            );
            
            // Display search results
            filtered.forEach(user => {
                if (!user || !user.fullName) return; // Skip users without names
                const option = document.createElement('div');
                option.className = 'dropdown-item';
                const displayText = user.kansaiEmployeeId ? 
                    `${user.kansaiEmployeeId} - ${user.fullName}` : 
                    `${user.employeeId || ''} - ${user.fullName}`;
                option.innerText = displayText;
                option.onclick = function() {
                    searchInput.value = displayText;
                    const selectElement = document.getElementById(fieldId);
                    if (selectElement) {
                        // Find or create option with this user
                        let optionExists = false;
                        for (let i = 0; i < selectElement.options.length; i++) {
                            if (selectElement.options[i].value === user.id) {
                                selectElement.selectedIndex = i;
                                optionExists = true;
                                break;
                            }
                        }
                        
                        if (!optionExists && selectElement.options.length > 0) {
                            const newOption = document.createElement('option');
                            newOption.value = user.id;
                            newOption.textContent = displayText;
                            selectElement.appendChild(newOption);
                            selectElement.value = user.id;
                        }
                    }
                    
                    dropdown.classList.add('hidden');
                };
                dropdown.appendChild(option);
            });
            
            // Show message if no results
            if (filtered.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'p-2 text-gray-500';
                noResults.innerText = 'No User Found';
                dropdown.appendChild(noResults);
            }
            
            // Show dropdown
            dropdown.classList.remove('hidden');
            return;
        } catch (error) {
            console.error("Error filtering users:", error);
        }
    }
    
    // Handle all other searchable selects
    if (fieldId === 'requesterNameSelect' || 
        fieldId === 'preparedBySelect' || 
        fieldId === 'acknowledgeBySelect' || 
        fieldId === 'checkedBySelect' || 
        fieldId === 'approvedBySelect' ||
        fieldId === 'receivedBySelect') {
        try {
            const users = JSON.parse(searchInput.dataset.users || '[]');
            filteredUsers = users.filter(user => user.name && user.name.toLowerCase().includes(searchText));
            
            // Show search results
            filteredUsers.forEach(user => {
                const option = document.createElement('div');
                option.className = 'dropdown-item';
                option.innerText = user.name;
                option.onclick = function() {
                    searchInput.value = user.name;
                    const selectElement = document.getElementById(fieldId);
                    if (selectElement) {
                        // For requesterName, store the name as the value 
                        if (fieldId === 'requesterNameSelect') {
                            // Find matching option or create a new one
                            let optionExists = false;
                            for (let i = 0; i < selectElement.options.length; i++) {
                                if (selectElement.options[i].textContent === user.name) {
                                    selectElement.selectedIndex = i;
                                    optionExists = true;
                                    break;
                                }
                            }
                            
                            if (!optionExists && selectElement.options.length > 0) {
                                const newOption = document.createElement('option');
                                newOption.value = user.name; // For requesterName, value is the name itself
                                newOption.textContent = user.name;
                                selectElement.appendChild(newOption);
                                selectElement.value = user.name;
                            }
                        } else {
                            // For other fields (payTo, approvals), store the ID as the value
                            let optionExists = false;
                            for (let i = 0; i < selectElement.options.length; i++) {
                                if (selectElement.options[i].value === user.id.toString()) {
                                    selectElement.selectedIndex = i;
                                    optionExists = true;
                                    break;
                                }
                            }
                            
                            if (!optionExists && selectElement.options.length > 0) {
                                const newOption = document.createElement('option');
                                newOption.value = user.id;
                                newOption.textContent = user.name;
                                selectElement.appendChild(newOption);
                                selectElement.value = user.id;
                            }
                        }
                    }
                    
                    dropdown.classList.add('hidden');
                    
                    // Auto-fill payToSelect and department when requesterName is selected
                    if (fieldId === 'requesterNameSelect') {
                        // Auto-fill payTo with the same user (same as addReim.js)
                        const payToSearch = document.getElementById('payToSearch');
                        const payToSelect = document.getElementById('payToSelect');
                        
                        if (payToSearch && payToSelect) {
                            // Find matching user by name (same user for payTo)
                            const users = JSON.parse(searchInput.dataset.users || '[]');
                            const matchingUser = users.find(u => 
                                u.name && user.name && u.name.toLowerCase() === user.name.toLowerCase()
                            );
                            
                            if (matchingUser) {
                                const displayText = matchingUser.kansaiEmployeeId ? 
                                    `${matchingUser.kansaiEmployeeId} - ${matchingUser.fullName}` : 
                                    `${matchingUser.employeeId || ''} - ${matchingUser.fullName}`;
                                payToSearch.value = displayText;
                                
                                // Set the user ID as the value in the select element
                                let optionExists = false;
                                for (let i = 0; i < payToSelect.options.length; i++) {
                                    if (payToSelect.options[i].value === matchingUser.id.toString()) {
                                        payToSelect.selectedIndex = i;
                                        optionExists = true;
                                        break;
                                    }
                                }
                                
                                if (!optionExists && payToSelect.options.length > 0) {
                                    const newOption = document.createElement('option');
                                    newOption.value = matchingUser.id;
                                    newOption.textContent = displayText;
                                    payToSelect.appendChild(newOption);
                                    payToSelect.value = matchingUser.id;
                                }
                            }
                        }
                        
                        // Auto-fill department based on selected user
                        const users = JSON.parse(searchInput.dataset.users || '[]');
                        autoFillDepartmentFromRequester(user.name, users);
                    }
                };
                dropdown.appendChild(option);
            });
        } catch (error) {
            console.error("Error parsing users data:", error);
        }
    }
    
    // Show message if no results
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-2 text-gray-500';
        noResults.innerText = 'Name Not Found';
        dropdown.appendChild(noResults);
    }
    
    // Show dropdown
    dropdown.classList.remove('hidden');
}

// Helper function to populate a dropdown with user data
// useDisplayNameAsValue: if true, use the display name as the value (for requesterNameSelect)
function populateDropdown(dropdownId, users, useDisplayNameAsValue = false) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    // Clear existing options
    dropdown.innerHTML = "";
    
    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Choose Name";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    dropdown.appendChild(defaultOption);
    
    // Add users as options
    users.forEach(user => {
        const option = document.createElement("option");
        
        // Combine names with spaces, handling empty middle/last names
        let displayName = user.fullName || 'Unknown User';
        
        // For requesterNameSelect, use the display name as the value instead of ID
        if (useDisplayNameAsValue) {
            option.value = displayName;
        } else {
            option.value = user.id;
        }
        
        option.textContent = displayName;
        dropdown.appendChild(option);
    });
    
    // Store users data for searching in searchable fields
    const searchableFields = [
        "requesterNameSelect", 
        "preparedBySelect", 
        "acknowledgeBySelect", 
        "checkedBySelect", 
        "approvedBySelect",
        "receivedBySelect",
        "payToSelect" // Add payToSelect to searchable fields
    ];
    
    if (searchableFields.includes(dropdownId)) {
        const searchInput = document.getElementById(dropdownId.replace("Select", "Search"));
        if (searchInput) {
            // Store users data for searching
            if (dropdownId === "payToSelect") {
                // For payToSelect, store full user data including kansaiEmployeeId and employeeId
                searchInput.dataset.users = JSON.stringify(users.map(user => ({
                    id: user.id,
                    name: user.fullName || 'Unknown User',
                    fullName: user.fullName || 'Unknown User',
                    employeeId: user.employeeId,
                    kansaiEmployeeId: user.kansaiEmployeeId
                })));
            } else {
                // For other fields, store simplified user data
                searchInput.dataset.users = JSON.stringify(users.map(user => {
                    let displayName = user.fullName || 'Unknown User';
                    return {
                        id: user.id,
                        name: displayName
                    };
                }));
            }
        }
    }
}

// Function to control visibility of buttons based on status
function controlButtonVisibility() {
    const status = document.getElementById("status").value;
    const addRowButton = document.querySelector("button[onclick='addRow()']");
    const deleteButton = document.querySelector("button[onclick='confirmDelete()']");
    const updateButton = document.querySelector("button[onclick='updateReim()']");
    const submitButton = document.querySelector("button[onclick='confirmSubmit()']");
    
    // Get all form fields that should be controlled
    const inputFields = document.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea');
    const fileInput = document.getElementById('filePath');
    const tableRows = document.querySelectorAll('#reimbursementDetails tr');
    
    // Check if status is not "Draft" - hide buttons and disable editing
    if (status && status !== "Draft") {
        // Hide action buttons
        if (addRowButton) addRowButton.style.display = "none";
        if (deleteButton) deleteButton.style.display = "none";
        if (updateButton) updateButton.style.display = "none";
        if (submitButton) submitButton.style.display = "none";
        
        // Disable input fields (except those that should remain disabled)
        inputFields.forEach(field => {
            // Skip fields that should remain disabled
            if (field.id === 'voucherNo' || field.id === 'status' || 
                field.classList.contains('gl-account')) {
                return;
            }
            
            field.disabled = true;
            field.classList.add('bg-gray-100', 'cursor-not-allowed');
        });
        
        // Disable file input
        if (fileInput) {
            fileInput.disabled = true;
            fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        }
        
        // Hide delete buttons in table rows
        tableRows.forEach(row => {
            const deleteBtn = row.querySelector('button[onclick="deleteRow(this)"]');
            if (deleteBtn) {
                deleteBtn.style.display = "none";
                deleteBtn.disabled = true;
                deleteBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        });
    } else {
        // Show all buttons for Draft status
        if (addRowButton) addRowButton.style.display = "block";
        if (deleteButton) deleteButton.style.display = "block";
        if (updateButton) updateButton.style.display = "block";
        if (submitButton) submitButton.style.display = "block";
        
        // Enable input fields (except those that should remain disabled)
        inputFields.forEach(field => {
            // Skip fields that should remain disabled
            if (field.id === 'voucherNo' || field.id === 'status' || 
                field.classList.contains('gl-account')) {
                return;
            }
            
            field.disabled = false;
            field.classList.remove('bg-gray-100', 'cursor-not-allowed');
        });
        
        // Enable file input
        if (fileInput) {
            fileInput.disabled = false;
            fileInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
        }
        
        // Show delete buttons in table rows
        tableRows.forEach(row => {
            const deleteBtn = row.querySelector('button[onclick="deleteRow(this)"]');
            if (deleteBtn) {
                deleteBtn.style.display = "inline-block";
                deleteBtn.disabled = false;
                deleteBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });
    }
}

function populateFormData(data) {
    console.log('Populating form data with:', data);
    
    document.getElementById('voucherNo').value = data.voucherNo || '';
    
    // Update for searchable requesterName
    const requesterNameSearch = document.getElementById('requesterNameSearch');
    const requesterNameSelect = document.getElementById('requesterNameSelect');
    if (requesterNameSearch) {
        requesterNameSearch.value = data.requesterName || '';
        
        // Also set the select value to match
        if (requesterNameSelect) {
            // For requesterNameSelect, find or create option with the display name as value
            let optionExists = false;
            for (let i = 0; i < requesterNameSelect.options.length; i++) {
                if (requesterNameSelect.options[i].textContent === data.requesterName) {
                    requesterNameSelect.selectedIndex = i;
                    optionExists = true;
                    break;
                }
            }
            
            if (!optionExists && data.requesterName) {
                const newOption = document.createElement('option');
                newOption.value = data.requesterName; // Value is the same as text for requesterName
                newOption.textContent = data.requesterName;
                requesterNameSelect.appendChild(newOption);
                requesterNameSelect.value = data.requesterName;
            }
        }
    }
    
    // Set department value, creating option if it doesn't exist
    setDepartmentValue(data.department);
    document.getElementById('currency').value = data.currency || '';
    
    // Update for searchable payTo with users (same as addReim.js)
    const payToSearch = document.getElementById('payToSearch');
    const payToSelect = document.getElementById('payToSelect');
    if (payToSearch && data.payTo && window.allUsers && window.allUsers.length > 0) {
        // Find the corresponding user for the payTo ID (same as addReim.js)
        const matchingUser = window.allUsers.find(user => user.id.toString() === data.payTo.toString());
        
        if (matchingUser) {
            const displayText = matchingUser.kansaiEmployeeId ? 
                `${matchingUser.kansaiEmployeeId} - ${matchingUser.fullName}` : 
                `${matchingUser.employeeId || ''} - ${matchingUser.fullName}`;
            payToSearch.value = displayText;
            
            if (payToSelect) {
                // Find or create option with this user
                let optionExists = false;
                for (let i = 0; i < payToSelect.options.length; i++) {
                    if (payToSelect.options[i].value === data.payTo.toString()) {
                        payToSelect.selectedIndex = i;
                        optionExists = true;
                        break;
                    }
                }
                
                if (!optionExists) {
                    const newOption = document.createElement('option');
                    newOption.value = matchingUser.id;
                    newOption.textContent = displayText;
                    payToSelect.appendChild(newOption);
                    payToSelect.value = matchingUser.id;
                }
            }
        }
    } else if (payToSearch && data.payTo) {
        // Fallback: just set the ID value if users not loaded yet
        payToSearch.value = data.payTo;
        if (payToSelect) {
            payToSelect.value = data.payTo;
        }
    }
    
    if (data.submissionDate) {
        // Buat objek Date dari string tanggal
        const date = new Date(data.submissionDate);
        
        // Gunakan metode yang mempertahankan zona waktu lokal
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
        const day = String(date.getDate()).padStart(2, '0');
        
        // Format tanggal dalam format YYYY-MM-DD untuk input date
        const formattedDate = `${year}-${month}-${day}`;
        
        document.getElementById('submissionDate').value = formattedDate;
    }
    
    document.getElementById('status').value = data.status || '';
    document.getElementById('referenceDoc').value = data.referenceDoc || '';
    document.getElementById('typeOfTransaction').value = data.typeOfTransaction || '';
    document.getElementById('remarks').value = data.remarks || '';
    
    // If transaction type is set, populate superior employee dropdowns
    if (data.typeOfTransaction) {
        console.log('Transaction type found in data:', data.typeOfTransaction);
        // Use setTimeout to ensure this runs after the form is fully populated
        setTimeout(() => {
            populateAllSuperiorEmployeeDropdowns(data.typeOfTransaction);
        }, 100);
    }
    
    // Set approval values in both select and search inputs
    setApprovalValue('preparedBy', data.preparedBy);
    setApprovalValue('acknowledgeBy', data.acknowledgedBy);
    setApprovalValue('checkedBy', data.checkedBy);
    setApprovalValue('approvedBy', data.approvedBy);
    setApprovalValue('receivedBy', data.receivedBy);
    
    // Update Submit button state based on preparedDate
    updateSubmitButtonState(data.preparedDate);
    
    // Control button visibility based on status
    controlButtonVisibility();
    
    // Debugging untuk reimbursementDetails
    console.log('About to populate reimbursement details:', data.reimbursementDetails);
    
    // Coba populateReimbursementDetails dengan data.reimbursementDetails atau data.details
    if (data.reimbursementDetails && data.reimbursementDetails.length > 0) {
        console.log('Populating with reimbursementDetails property');
        populateReimbursementDetails(data.reimbursementDetails);
    } else if (data.details && data.details.length > 0) {
        console.log('Populating with details property');
        populateReimbursementDetails(data.details);
    } else {
        console.warn('No reimbursement details found to populate');
        // Tambahkan baris kosong jika tidak ada data
        const tableBody = document.getElementById('reimbursementDetails');
        if (tableBody) {
            tableBody.innerHTML = '';
            addRow();
        }
    }
    
    // Debugging untuk attachments
    console.log('About to display attachments:', data.reimbursementAttachments || data.attachments);
    
    // Coba displayAttachments dengan data.reimbursementAttachments atau data.attachments
    if (data.reimbursementAttachments && data.reimbursementAttachments.length > 0) {
        displayAttachments(data.reimbursementAttachments);
    } else if (data.attachments && data.attachments.length > 0) {
        displayAttachments(data.attachments);
    }
    
    // Display revision history if available
    renderRevisionHistory(data.revisions);
    
    // Display rejection remarks if available
    console.log('Calling displayRejectionRemarks with status:', data.status);
    console.log('Rejection remarks data:', data.rejectionRemarks);
    displayRejectionRemarks(data);
    
    // Trigger category loading if department and transaction type are populated
    setTimeout(() => {
        const departmentName = document.getElementById('department').value;
        const transactionType = document.getElementById('typeOfTransaction').value;
        
        console.log('Checking dependencies for category loading:');
        console.log('- Department:', departmentName);
        console.log('- Transaction Type:', transactionType);
        
        if (departmentName && transactionType) {
            console.log('Triggering handleDependencyChange() to load categories');
            handleDependencyChange();
        } else {
            console.warn('Cannot load categories: missing department or transaction type');
        }
    }, 500); // Small delay to ensure form is fully populated
    
    // Panggil fungsi untuk mengontrol editabilitas tabel
    toggleReimTableEditability();
}

// Helper function to set approval values in both select and search input
function setApprovalValue(fieldPrefix, userId) {
    if (!userId) return;
    
    const selectElement = document.getElementById(`${fieldPrefix}Select`);
    const searchInput = document.getElementById(`${fieldPrefix}Search`);
    
    if (selectElement) {
        selectElement.value = userId;
        
        // Also set the search input value
        if (searchInput && selectElement.selectedOptions[0]) {
            searchInput.value = selectElement.selectedOptions[0].textContent;
        }
    }
    
    // Store the userId to be set after superior employee dropdowns are populated
    if (userId) {
        // Store the approval values to be set after superior employee dropdowns are populated
        if (!window.pendingApprovalValues) {
            window.pendingApprovalValues = {};
        }
        window.pendingApprovalValues[fieldPrefix] = userId;
    }
}

function populateReimbursementDetails(details) {
    console.log('populateReimbursementDetails called with:', details);
    
    const tableBody = document.getElementById('reimbursementDetails');
    if (!tableBody) {
        console.error('Table body #reimbursementDetails not found!');
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (details && details.length > 0) {
        console.log(`Populating ${details.length} reimbursement detail rows`);
        
        details.forEach((detail, index) => {
            console.log(`Processing detail row ${index + 1}:`, detail);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-2 border">
                    <div class="relative">
                        <input type="text" value="${detail.category || ''}" placeholder="Search category..." class="w-full p-1 border rounded search-input category-search" />
                        <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden category-dropdown"></div>
                        <select class="hidden category-select">
                            <option value="" disabled selected>Choose Category</option>
                        </select>
                    </div>
                </td>
                <td class="p-2 border">
                    <div class="relative">
                        <input type="text" value="${detail.accountName || ''}" placeholder="Search account name..." class="w-full p-1 border rounded search-input account-name-search" />
                        <div class="absolute left-0 right-0 mt-1 bg-white border rounded search-dropdown hidden account-name-dropdown"></div>
                        <select class="hidden account-name-select">
                            <option value="" disabled selected>Choose Account Name</option>
                        </select>
                    </div>
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.glAccount || ''}" class="w-full p-1 border rounded bg-gray-200 cursor-not-allowed gl-account" disabled />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${detail.description || ''}" maxlength="200" class="w-full p-1 border rounded" required />
                </td>
                <td class="p-2 border">
                    <input type="text" value="${formatCurrencyIDR(detail.amount) || '0.00'}" class="w-full p-1 border rounded currency-input-idr" oninput="formatCurrencyInputIDR(this)" required autocomplete="off" />
                </td>
                <td class="p-2 border text-center">
                    <button type="button" onclick="deleteRow(this)" data-id="${detail.id}" class="text-red-500 hover:text-red-700">
                        🗑
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
            
            // Setup event listeners for this row
            setupRowEventListeners(row);
            
            // Populate categories for this row if data is available
            populateCategoriesForNewRow(row);
        });
    } else {
        console.log('No details found, adding an empty row');
        addRow();
    }
    
    // Calculate and update the total amount
    updateTotalAmount();
}

// Function to calculate total amount from all rows
function updateTotalAmount() {
    const amountInputs = document.querySelectorAll('#reimbursementDetails tr td:nth-child(5) input');
    console.log(`updateTotalAmount: Found ${amountInputs.length} amount inputs`);
    
    let total = 0;
    
    amountInputs.forEach((input, index) => {
        // Extract numeric value from input
        const amountText = input.value.trim();
        // Convert from formatted to standard format for calculation
        const numericValue = parseCurrencyIDR(amountText);
        console.log(`Row ${index + 1} amount: ${amountText} -> ${numericValue}`);
        total += numericValue;
    });
    
    // Periksa jika total melebihi 100 triliun
    const maxAmount = 100000000000000; // 100 triliun
    if (total > maxAmount) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Amount Exceeds Limit',
                text: 'Total amount must not exceed 100 trillion rupiah'
            });
        } else {
            alert('Total amount must not exceed 100 trillion rupiah');
        }
        total = maxAmount;
    }
    
    // Format total with proper format and display
    const formattedTotal = formatCurrencyIDR(total);
    console.log(`Total amount: ${total} -> ${formattedTotal}`);
    
    // Update total amount field
    const totalAmountField = document.getElementById('totalAmount');
    if (totalAmountField) {
        totalAmountField.value = formattedTotal;
    } else {
        console.error('totalAmount field not found!');
    }
}

// Modifikasi fungsi displayAttachments untuk menambahkan tombol hapus
function displayAttachments(attachments) {
    const attachmentsList = document.getElementById('attachmentsList');
    attachmentsList.innerHTML = '';
    
    if (attachments && attachments.length > 0) {
        console.log('Jumlah attachment:', attachments.length);
        
        attachments.forEach(attachment => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'flex items-center justify-between p-2 bg-gray-100 rounded mb-2';
            
            // Tampilkan tombol View dan Delete untuk semua attachment
            attachmentItem.innerHTML = `
                <span>${attachment.fileName}</span>
                <div>
                    <a href="${BASE_URL}/${attachment.filePath}" target="_blank" class="text-blue-500 hover:text-blue-700 mr-3">View</a>
                    <button type="button" onclick="deleteAttachment('${attachment.id}')" class="text-red-500 hover:text-red-700">X</button>
                </div>
            `;
            
            attachmentsList.appendChild(attachmentItem);
        });
    } else {
        console.log('Tidak ada attachment untuk ditampilkan');
    }
}

// Fungsi untuk menghapus attachment
// Menggunakan endpoint: ${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/${attachmentId}
async function deleteAttachment(attachmentId) {
    // Dapatkan ID reimbursement dari URL
    const reimbursementId = getReimbursementIdFromUrl();
    if (!reimbursementId || !attachmentId) {
        alert('ID tidak ditemukan');
        return;
    }

    try {
        console.log(`Menghapus attachment ID: ${attachmentId} dari reimbursement ID: ${reimbursementId}`);
        
        // Panggil API untuk menghapus attachment
        const response = await fetch(`${BASE_URL}/api/reimbursements/${reimbursementId}/attachments/${attachmentId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.status && data.code === 200) {
            console.log('Attachment berhasil dihapus:', data);
            
            // Refresh data reimbursement untuk memperbarui daftar attachment
            fetchReimbursementData();
        } else {
            alert('Gagal menghapus attachment: ' + (data.message || 'Terjadi kesalahan'));
            console.error('Gagal menghapus attachment:', data);
        }
    } catch (error) {
        console.error('Error saat menghapus attachment:', error);
        alert('Terjadi kesalahan saat menghapus attachment');
    }
}

function updateReim() {
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to update this reimbursement",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // Proses update reimbursement yang sudah ada
                await submitReimbursementUpdate();
                
                // Proses tambahan baris baru dengan API baru
                await submitNewReimbursementDetails();
                
                Swal.fire(
                    'Updated!',
                    'Reimbursement has been updated successfully.',
                    'success'
                ).then(() => {
                    // Redirect to menuReim.html after successful update
                    window.location.href = '../pages/menuReim.html';
                });
            } catch (error) {
                console.error('Error updating reimbursement:', error);
                Swal.fire(
                    'Error',
                    'An error occurred while updating the reimbursement',
                    'error'
                );
            }
        }
    });
}

// Fungsi baru untuk mengirim detail reimbursement baru ke API
async function submitNewReimbursementDetails() {
    const id = getReimbursementIdFromUrl();
    if (!id) {
        throw new Error('No reimbursement ID found');
    }
    
    const detailsTable = document.getElementById('reimbursementDetails');
    const rows = detailsTable.querySelectorAll('tr');
    const newReimbursementDetails = [];
    
    // Filter hanya baris yang tidak memiliki data-id (baris baru dari addRow)
    rows.forEach(row => {
        const deleteButton = row.querySelector('button');
        const detailId = deleteButton.getAttribute('data-id');
        
        // Hanya proses baris yang tidak memiliki data-id (baris baru)
        if (!detailId) {
            const categoryInput = row.querySelector('.category-search');
            const accountNameInput = row.querySelector('.account-name-search');
            const glAccountInput = row.querySelector('.gl-account');
            const inputs = row.querySelectorAll("input[type='text']:not(.category-search):not(.account-name-search):not(.gl-account), input[type='number']");
            
            if (categoryInput && accountNameInput && glAccountInput && inputs.length >= 2) {
                // Ambil nilai amount dari input dan konversi ke angka
                const amountText = inputs[1].value;
                const amount = parseCurrencyIDR(amountText);
                
                newReimbursementDetails.push({
                    description: inputs[0].value || "", // Description input
                    amount: amount, // Amount input sebagai angka
                    category: categoryInput.value || "",
                    glAccount: glAccountInput.value || "",
                    accountName: accountNameInput.value || ""
                });
            }
        }
    });
    
    // Jika tidak ada baris baru, tidak perlu memanggil API
    if (newReimbursementDetails.length === 0) {
        console.log('No new reimbursement details to add');
        return;
    }
    
    console.log('Sending new reimbursement details:', newReimbursementDetails);
    
    // Panggil API untuk menambahkan detail baru
    const response = await fetch(`${BASE_URL}/api/reimbursements/detail/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReimbursementDetails)
    });
    
    const result = await response.json();
    
    if (!result.status || result.code !== 200) {
        throw new Error(result.message || 'Failed to add new reimbursement details');
    }
    
    return result;
}

async function submitReimbursementUpdate() {
    const id = getReimbursementIdFromUrl();
    if (!id) {
        Swal.fire('Error', 'No reimbursement ID found', 'error');
        return;
    }
    
    const detailsTable = document.getElementById('reimbursementDetails');
    const rows = detailsTable.querySelectorAll('tr');
    const reimbursementDetails = [];
    
    rows.forEach(row => {
        // Get category from search input
        const categoryInput = row.querySelector('.category-search');
        const accountNameInput = row.querySelector('.account-name-search');
        const glAccountInput = row.querySelector('.gl-account');
        const inputs = row.querySelectorAll("input[type='text']:not(.category-search):not(.account-name-search):not(.gl-account), input[type='number']");
        const deleteButton = row.querySelector('button');
        const detailId = deleteButton.getAttribute('data-id') || null;
        
        // Hanya proses baris yang memiliki data-id (baris yang sudah ada)
        if (detailId && categoryInput && accountNameInput && glAccountInput && inputs.length >= 2) {
            // Ambil nilai amount dari input dan konversi ke angka
            const amountText = inputs[1].value;
            const amount = parseCurrencyIDR(amountText);
            
            reimbursementDetails.push({
                id: detailId,
                category: categoryInput.value || "",
                accountName: accountNameInput.value || "",
                glAccount: glAccountInput.value || "",
                description: inputs[0].value || "", // Description input
                amount: amount // Amount input sebagai angka
            });
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
}

function goToMenuReim() {
    try {
        // Try to navigate to menu page
        window.location.href = '../pages/menuReim.html';
    } catch (error) {
        console.error('Error navigating to menu:', error);
        // Fallback to home page
        window.location.href = '../pages/approval-dashboard.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Load users, departments, business partners, and transaction types first
    Promise.all([fetchUsers(), fetchDepartments(), fetchBusinessPartners(), fetchTransactionTypes()]).then(() => {
        // Then load reimbursement data
        fetchReimbursementData();
    });
    
    // Setup event listeners for search dropdowns
    const searchFields = [
        'requesterNameSearch',
        'payToSearch',
        'preparedBySearch',
        'acknowledgeBySearch',
        'checkedBySearch',
        'approvedBySearch',
        'receivedBySearch'
    ];
    
    searchFields.forEach(fieldId => {
        const searchInput = document.getElementById(fieldId);
        if (searchInput) {
            searchInput.addEventListener('focus', function() {
                const actualFieldId = fieldId.replace('Search', 'Select');
                filterUsers(actualFieldId);
            });
            
            // Add input event for real-time filtering
            searchInput.addEventListener('input', function() {
                const actualFieldId = fieldId.replace('Search', 'Select');
                filterUsers(actualFieldId);
            });
        }
    });
    
    // Setup event listener to hide dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdowns = [
            'requesterNameSelectDropdown',
            'payToSelectDropdown',
            'preparedBySelectDropdown', 
            'acknowledgeBySelectDropdown', 
            'checkedBySelectDropdown', 
            'approvedBySelectDropdown',
            'receivedBySelectDropdown'
        ];
        
        const searchInputs = [
            'requesterNameSearch',
            'payToSearch',
            'preparedBySearch', 
            'acknowledgeBySearch', 
            'checkedBySearch', 
            'approvedBySearch',
            'receivedBySearch'
        ];
        
        dropdowns.forEach((dropdownId, index) => {
            const dropdown = document.getElementById(dropdownId);
            const input = document.getElementById(searchInputs[index]);
            
            if (dropdown && input) {
                if (!input.contains(event.target) && !dropdown.contains(event.target)) {
                    dropdown.classList.add('hidden');
                }
            }
        });
        
        // Handle table row dropdowns
        const categoryDropdowns = document.querySelectorAll('.category-dropdown');
        const accountNameDropdowns = document.querySelectorAll('.account-name-dropdown');
        
        categoryDropdowns.forEach(dropdown => {
            const input = dropdown.parentElement.querySelector('.category-search');
            if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
        
        accountNameDropdowns.forEach(dropdown => {
            const input = dropdown.parentElement.querySelector('.account-name-search');
            if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
    });
    
    // Setup event listeners for department and transaction type changes
    const departmentSelect = document.getElementById('department');
    const transactionTypeSelect = document.getElementById('typeOfTransaction');
    
    if (departmentSelect) {
        departmentSelect.addEventListener('change', handleDependencyChange);
    }
    
    if (transactionTypeSelect) {
        transactionTypeSelect.addEventListener('change', handleDependencyChange);
    }
});

    // Helper to format date as DD/MM/YYYY
    function formatDateToDDMMYYYY(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Render revision history section
    function renderRevisionHistory(revisions) {
        const section = document.getElementById('revisedRemarksSection');
        if (!section) return;

        if (!Array.isArray(revisions) || revisions.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        // Group revisions by stage
        const grouped = {};
        revisions.forEach(rev => {
            if (!grouped[rev.stage]) grouped[rev.stage] = [];
            grouped[rev.stage].push(rev);
        });

        // Build HTML
        let html = '';
        html += `<h3 class="text-lg font-semibold mb-2 text-gray-800">Revision History</h3>`;
        html += `<div class="bg-gray-50 p-4 rounded-lg border"><div class="mb-2"><span class="text-sm font-medium text-gray-600">Total Revisions: </span><span id="revisedCount" class="text-sm font-bold text-blue-600">${revisions.length}</span></div></div>`;

        Object.entries(grouped).forEach(([stage, items]) => {
            html += `<div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded"><h4 class="text-sm font-bold text-blue-800 mb-2">${stage} Stage Revisions (${items.length})</h4></div>`;
            items.forEach((rev, idx) => {
                html += `<div class="mb-3 ml-4"><div class="flex items-start justify-between"><div class="flex-1"><label class="text-sm font-medium text-gray-700">Revision ${idx + 1}:</label><div class="w-full p-2 border rounded-md bg-white text-sm text-gray-800 min-h-[60px] whitespace-pre-wrap">${rev.remarks || ''}</div><div class="text-xs text-gray-500 mt-1">Date: ${formatDateToDDMMYYYY(rev.createdAt)} | By: ${rev.revisedByName || ''}</div></div></div></div>`;
            });
        });

        section.innerHTML = html;
    }

// Function to display rejection remarks if available
function displayRejectionRemarks(data) {
    // Check if status is Rejected
    if (data.status !== 'Rejected') {
        const rejectionSection = document.getElementById('rejectionRemarksSection');
        if (rejectionSection) {
            rejectionSection.style.display = 'none';
        }
        return;
    }
    
    const rejectionSection = document.getElementById('rejectionRemarksSection');
    const rejectionTextarea = document.getElementById('rejectionRemarks');
    
    if (rejectionSection && rejectionTextarea) {
        // Check for various possible rejection remarks fields
        let rejectionRemarks = '';
        
        // Check for specific rejection remarks by role
        if (data.remarksRejectByChecker) {
            rejectionRemarks = data.remarksRejectByChecker;
        } else if (data.remarksRejectByAcknowledger) {
            rejectionRemarks = data.remarksRejectByAcknowledger;
        } else if (data.remarksRejectByApprover) {
            rejectionRemarks = data.remarksRejectByApprover;
        } else if (data.remarksRejectByReceiver) {
            rejectionRemarks = data.remarksRejectByReceiver;
        } else if (data.rejectedRemarks) {
            rejectionRemarks = data.rejectedRemarks;
        } else if (data.remarks) {
            rejectionRemarks = data.remarks;
        }
        
        if (rejectionRemarks.trim() !== '') {
            rejectionSection.style.display = 'block';
            rejectionTextarea.value = rejectionRemarks;
        } else {
            rejectionSection.style.display = 'none';
        }
    }
}

// Store global data for categories and account names

// Function to get department ID by name
async function getDepartmentIdByName(departmentName) {
    try {
        const response = await fetch(`${BASE_URL}/api/department`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        const departments = result.data;
        
        const department = departments.find(dept => dept.name === departmentName);
        return department ? department.id : null;
    } catch (error) {
        console.error("Error fetching department ID:", error);
        return null;
    }
}

// Function to fetch categories based on department and transaction type
async function fetchCategories(departmentId, transactionType) {
    console.log(`fetchCategories called with departmentId: ${departmentId}, transactionType: ${transactionType}`);
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/categories?departmentId=${departmentId}&menu=Reimbursement&transactionType=${encodeURIComponent(transactionType)}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        
        const categories = await response.json();
        console.log('Category API response:', categories);
        
        // Store categories globally
        allCategories = categories;
        console.log(`Fetched ${allCategories.length} categories`);
        
        // Update all category dropdowns in the table
        updateAllCategoryDropdowns();
        return categories;
    } catch (error) {
        console.error('Error fetching categories:', error);
        allCategories = [];
        updateAllCategoryDropdowns();
        return [];
    }
}

// Function to fetch account names based on category, department and transaction type
async function fetchAccountNames(category, departmentId, transactionType) {
    console.log(`fetchAccountNames called with category: ${category}, departmentId: ${departmentId}, transactionType: ${transactionType}`);
    
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/account-names?category=${encodeURIComponent(category)}&departmentId=${departmentId}&menu=Reimbursement&transactionType=${encodeURIComponent(transactionType)}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        
        const accountNames = await response.json();
        console.log('Account names API response:', accountNames);
        
        console.log(`Fetched ${accountNames.length} account names for category ${category}`);
        return accountNames;
    } catch (error) {
        console.error('Error fetching account names:', error);
        return [];
    }
}

// Function to fetch transaction types
async function fetchTransactionTypes() {
    try {
        const response = await fetch(`${BASE_URL}/api/transactiontypes/filter?category=Reimbursement`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch transaction types');
        }
        
        transactionTypes = result.data;
        console.log('Stored', transactionTypes.length, 'transaction types in global cache');
        
        // Populate transaction types dropdown
        populateTransactionTypesDropdown(transactionTypes);
        
    } catch (error) {
        console.error("Error fetching transaction types:", error);
    }
}

// Function to populate transaction types dropdown
function populateTransactionTypesDropdown(types) {
    const typeSelect = document.getElementById("typeOfTransaction");
    if (!typeSelect) return;
    
    // Clear existing options
    typeSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Transaction Type";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    typeSelect.appendChild(defaultOption);
    
    // Add transaction types
    types.forEach(type => {
        const option = document.createElement("option");
        option.value = type.name; // Send name as the value
        option.textContent = type.name;
        typeSelect.appendChild(option);
    });
}

// Function to fetch business partners
async function fetchBusinessPartners() {
    try {
        const response = await fetch(`${BASE_URL}/api/business-partners/type/employee`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch business partners');
        }
        
        businessPartners = result.data;
        console.log('Stored', businessPartners.length, 'business partners in global cache');
        
    } catch (error) {
        console.error("Error fetching business partners:", error);
    }
}

// Function to update all category dropdowns
function updateAllCategoryDropdowns() {
    const categorySearchInputs = document.querySelectorAll('.category-search');
    
    categorySearchInputs.forEach(input => {
        // Store categories data for searching
        input.dataset.categories = JSON.stringify(allCategories || []);
        
        // Clear current value if categories changed
        const currentValue = input.value;
        if (currentValue && allCategories && !allCategories.includes(currentValue)) {
            input.value = '';
            const row = input.closest('tr');
            const accountNameSearch = row.querySelector('.account-name-search');
            const glAccount = row.querySelector('.gl-account');
            if (accountNameSearch) accountNameSearch.value = '';
            if (glAccount) glAccount.value = '';
        }
    });
}

// Function to setup event listeners for table rows
function setupRowEventListeners(row) {
    const categorySearch = row.querySelector('.category-search');
    const categoryDropdown = row.querySelector('.category-dropdown');
    const accountNameSearch = row.querySelector('.account-name-search');
    const accountNameDropdown = row.querySelector('.account-name-dropdown');
    
    if (categorySearch) {
        // Populate with existing categories if available
        if (allCategories && allCategories.length > 0) {
            categorySearch.dataset.categories = JSON.stringify(allCategories);
        }
        
        categorySearch.addEventListener('focus', function() {
            filterCategories(this);
        });
        
        categorySearch.addEventListener('input', function() {
            filterCategories(this);
        });
    }
    
    if (accountNameSearch) {
        accountNameSearch.addEventListener('focus', function() {
            filterAccountNames(this);
        });
        
        accountNameSearch.addEventListener('input', function() {
            filterAccountNames(this);
        });
    }
}

// Function to filter and display categories
function filterCategories(input) {
    const searchText = input.value.toLowerCase();
    const dropdown = input.parentElement.querySelector('.category-dropdown');
    
    if (!dropdown) return;
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    try {
        const categories = JSON.parse(input.dataset.categories || '[]');
        const filtered = categories.filter(category => 
            category && category.toLowerCase().includes(searchText)
        );
        
        // Display search results
        filtered.forEach(category => {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            option.innerText = category;
            option.onclick = function() {
                input.value = category;
                const selectElement = input.parentElement.querySelector('.category-select');
                if (selectElement) {
                    selectElement.value = category;
                }
                dropdown.classList.add('hidden');
                
                // Clear account name and GL account when category changes
                const row = input.closest('tr');
                const accountNameSearch = row.querySelector('.account-name-search');
                const glAccount = row.querySelector('.gl-account');
                if (accountNameSearch) accountNameSearch.value = '';
                if (glAccount) glAccount.value = '';
                
                // Trigger account names fetch
                loadAccountNamesForRow(row);
            };
            dropdown.appendChild(option);
        });
        
        // Show message if no results
        if (filtered.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'p-2 text-gray-500';
            noResults.innerText = 'No Categories Found';
            dropdown.appendChild(noResults);
        }
        
        // Show dropdown
        dropdown.classList.remove('hidden');
        
    } catch (error) {
        console.error("Error filtering categories:", error);
    }
}

// Function to filter and display account names
function filterAccountNames(input) {
    const searchText = input.value.toLowerCase();
    const dropdown = input.parentElement.querySelector('.account-name-dropdown');
    
    if (!dropdown) return;
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    try {
        const accountNames = JSON.parse(input.dataset.accountNames || '[]');
        const filtered = accountNames.filter(account => 
            account.accountName && account.accountName.toLowerCase().includes(searchText)
        );
        
        // Display search results
        filtered.forEach(account => {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            option.innerText = account.accountName;
            option.onclick = function() {
                input.value = account.accountName;
                const selectElement = input.parentElement.querySelector('.account-name-select');
                if (selectElement) {
                    selectElement.value = account.accountName;
                }
                dropdown.classList.add('hidden');
                
                // Auto-fill GL Account
                const row = input.closest('tr');
                const glAccount = row.querySelector('.gl-account');
                if (glAccount) {
                    glAccount.value = account.coa;
                }
            };
            dropdown.appendChild(option);
        });
        
        // Show message if no results
        if (filtered.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'p-2 text-gray-500';
            noResults.innerText = 'No Account Names Found';
            dropdown.appendChild(noResults);
        }
        
        // Show dropdown
        dropdown.classList.remove('hidden');
        
    } catch (error) {
        console.error("Error filtering account names:", error);
    }
}

// Function to load account names for a specific row
async function loadAccountNamesForRow(row) {
    const categoryInput = row.querySelector('.category-search');
    const accountNameInput = row.querySelector('.account-name-search');
    
    if (!categoryInput || !accountNameInput) return;
    
    const category = categoryInput.value;
    if (!category) return;
    
    // Get current department and transaction type
    const departmentName = document.getElementById('department').value;
    const transactionType = document.getElementById('typeOfTransaction').value;
    
    if (!departmentName || !transactionType) {
        console.log('Department or transaction type not selected');
        return;
    }
    
    try {
        const departmentId = await getDepartmentIdByName(departmentName);
        if (!departmentId) {
            console.error('Could not find department ID');
            return;
        }
        
        const accountNames = await fetchAccountNames(category, departmentId, transactionType);
        
        // Store account names data for this row
        accountNameInput.dataset.accountNames = JSON.stringify(accountNames);
        
    } catch (error) {
        console.error('Error loading account names for row:', error);
    }
}

// Function to handle department or transaction type changes
async function handleDependencyChange() {
    const departmentName = document.getElementById('department').value;
    const transactionType = document.getElementById('typeOfTransaction').value;
    
    console.log('handleDependencyChange called with:');
    console.log('- Department:', departmentName);
    console.log('- Transaction Type:', transactionType);
    
    if (!departmentName || !transactionType) {
        console.log('Department or transaction type not fully selected');
        allCategories = [];
        updateAllCategoryDropdowns();
        return;
    }
    
    try {
        const departmentId = await getDepartmentIdByName(departmentName);
        console.log('Department ID resolved:', departmentId);
        
        if (!departmentId) {
            console.error('Could not find department ID');
            return;
        }
        
        // Fetch new categories
        console.log('Fetching categories for departmentId:', departmentId, 'and transactionType:', transactionType);
        const categories = await fetchCategories(departmentId, transactionType);
        console.log('Categories fetched:', categories ? categories.length : 'none');
        
    } catch (error) {
        console.error('Error handling dependency change:', error);
    }
}

// Function to populate categories for a new row
function populateCategoriesForNewRow(row) {
    const categorySearch = row.querySelector('.category-search');
    
    console.log('populateCategoriesForNewRow called');
    console.log('- Available categories:', allCategories ? allCategories.length : 'none');
    
    if (categorySearch && allCategories && allCategories.length > 0) {
        // Store categories data for the new row
        categorySearch.dataset.categories = JSON.stringify(allCategories);
        console.log('Populated categories for new row:', allCategories.length, 'categories');
        

    } else if (categorySearch) {
        console.log('No categories available to populate for new row');
        
        // Check if department and transaction type are selected, if so trigger fetch
        const departmentName = document.getElementById('department').value;
        const transactionType = document.getElementById('typeOfTransaction').value;
        
        console.log('Checking dependencies:');
        console.log('- Department:', departmentName);
        console.log('- Transaction Type:', transactionType);
        
        if (departmentName && transactionType) {
            console.log('Department and transaction type are selected, triggering category fetch...');
            handleDependencyChange().then(() => {
                // After categories are fetched, populate this row
                if (allCategories.length > 0) {
                    categorySearch.dataset.categories = JSON.stringify(allCategories);
                    console.log('Categories populated after fetch for new row');
                } else {
                    console.warn('No categories available even after fetch');
                }
            });
        } else {
            console.warn('Cannot fetch categories: missing department or transaction type');
        }
    } else {
        console.error('Category search input not found in row');
    }
}

// Modifikasi fungsi toggleReimTableEditability untuk mengontrol input file
function toggleReimTableEditability() {
    const status = document.getElementById("status").value;
    const tableRows = document.querySelectorAll('#reimbursementDetails tr');
    const inputs = document.querySelectorAll('#requesterNameSearch, #payToSearch, #currency, #referenceDoc, #typeOfTransaction, #remarks');
    const fileInput = document.getElementById('filePath');
    
    // Check if status is not "Draft" - disable editing
    if (status && status !== "Draft") {
        // Disable input di tabel
        tableRows.forEach(row => {
            const inputs = row.querySelectorAll('input:not(.gl-account)');
            inputs.forEach(input => {
                input.disabled = true;
                input.classList.add('bg-gray-100', 'cursor-not-allowed');
            });
            
            // Hide tombol hapus di tabel
            const deleteBtn = row.querySelector('button[onclick="deleteRow(this)"]');
            if (deleteBtn) {
                deleteBtn.style.display = "none";
                deleteBtn.disabled = true;
                deleteBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        });
        
        // Disable input lainnya
        inputs.forEach(field => {
            field.disabled = true;
            field.classList.add('bg-gray-100', 'cursor-not-allowed');
        });
        
        // Hide tombol tambah baris
        const addRowBtn = document.querySelector('button[onclick="addRow()"]');
        if (addRowBtn) {
            addRowBtn.style.display = "none";
            addRowBtn.disabled = true;
            addRowBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        // Disable file input
        if (fileInput) {
            fileInput.disabled = true;
            fileInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        }
    } else {
        // Enable input di tabel for Draft status
        tableRows.forEach(row => {
            const inputs = row.querySelectorAll('input:not(.gl-account)');
            inputs.forEach(input => {
                input.disabled = false;
                input.classList.remove('bg-gray-100', 'cursor-not-allowed');
            });
            
            // Show tombol hapus di tabel
            const deleteBtn = row.querySelector('button[onclick="deleteRow(this)"]');
            if (deleteBtn) {
                deleteBtn.style.display = "inline-block";
                deleteBtn.disabled = false;
                deleteBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });
        
        // Enable input lainnya
        inputs.forEach(field => {
            field.disabled = false;
            field.classList.remove('bg-gray-100', 'cursor-not-allowed');
        });
        
        // Show tombol tambah baris
        const addRowBtn = document.querySelector('button[onclick="addRow()"]');
        if (addRowBtn) {
            addRowBtn.style.display = "block";
            addRowBtn.disabled = false;
            addRowBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        
        // Enable file input
        if (fileInput) {
            fileInput.disabled = false;
            fileInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
        }
    }
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

// New function to fetch superior employees based on document type, transaction type, and superior level
async function fetchSuperiorEmployees(documentType, transactionType, superiorLevel) {
    try {
        const currentUserId = getUserId();
        if (!currentUserId) {
            console.error('No current user ID found');
            return [];
        }

        const response = await fetch(`${BASE_URL}/api/employee-superior-document-approvals/user/${currentUserId}/document-type/${documentType}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.status || result.code !== 200) {
            throw new Error(result.message || 'Failed to fetch superior employees');
        }
        
        const allSuperiors = result.data;
        
        // Filter by transaction type and superior level
        const filteredSuperiors = allSuperiors.filter(superior => {
            // Map transaction type to API transaction type
            const transactionTypeMap = {
                'Entertainment': 'EN',
                'Golf Competition': 'GC',
                'Medical': 'ME',
                'Others': 'OT',
                'Travelling': 'TR'
            };
            
            const apiTransactionType = transactionTypeMap[transactionType];
            if (!apiTransactionType) {
                console.warn(`Unknown transaction type: ${transactionType}`);
                return false;
            }
            
            return superior.typeTransaction === apiTransactionType && superior.superiorLevel === superiorLevel;
        });
        
        console.log(`Found ${filteredSuperiors.length} superior employees for ${documentType}/${transactionType}/${superiorLevel}`);
        
        // Fetch full user details for each superior to get full names
        const superiorsWithFullNames = [];
        
        for (const superior of filteredSuperiors) {
            try {
                // Try to get full name from cached users first
                let fullName = superior.superiorName; // Default to the name from API
                
                if (window.allUsers && window.allUsers.length > 0) {
                    const user = window.allUsers.find(u => u.id === superior.superiorUserId);
                    if (user && user.fullName) {
                        fullName = user.fullName;
                        console.log(`Found full name in cache for ${superior.superiorUserId}: ${fullName}`);
                    }
                } else {
                    // Fetch user details from API if not in cache
                    try {
                        const userResponse = await fetch(`${BASE_URL}/api/users/${superior.superiorUserId}`);
                        if (userResponse.ok) {
                            const userResult = await userResponse.json();
                            if (userResult.status && userResult.data && userResult.data.fullName) {
                                fullName = userResult.data.fullName;
                                console.log(`Fetched full name from API for ${superior.superiorUserId}: ${fullName}`);
                            }
                        }
                    } catch (error) {
                        console.warn(`Failed to fetch full name for user ${superior.superiorUserId}:`, error);
                        // Keep the original superiorName if API call fails
                    }
                }
                
                superiorsWithFullNames.push({
                    ...superior,
                    superiorFullName: fullName
                });
                
            } catch (error) {
                console.warn(`Error processing superior ${superior.superiorUserId}:`, error);
                // Add the superior with original name if there's an error
                superiorsWithFullNames.push({
                    ...superior,
                    superiorFullName: superior.superiorName
                });
            }
        }
        
        return superiorsWithFullNames;
        
    } catch (error) {
        console.error("Error fetching superior employees:", error);
        return [];
    }
}

// Function to map superior level to field ID
function getSuperiorLevelForField(fieldId) {
    const levelMap = {
        'preparedBySelect': 'PR',
        'checkedBySelect': 'CH',
        'acknowledgeBySelect': 'AC',
        'approvedBySelect': 'AP',
        'receivedBySelect': 'RE'
    };
    return levelMap[fieldId] || null;
}

// Function to populate superior employee dropdown
async function populateSuperiorEmployeeDropdown(fieldId, documentType, transactionType) {
    const superiorLevel = getSuperiorLevelForField(fieldId);
    if (!superiorLevel) {
        console.error(`No superior level mapping found for field: ${fieldId}`);
        return;
    }
    
    const superiors = await fetchSuperiorEmployees(documentType, transactionType, superiorLevel);
    
    // Clear existing options
    const selectElement = document.getElementById(fieldId);
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="" disabled selected>Choose Name</option>';
    
    // Add superior employees to dropdown
    superiors.forEach(superior => {
        const option = document.createElement('option');
        option.value = superior.superiorUserId;
        option.textContent = superior.superiorFullName; // Use superiorFullName
        selectElement.appendChild(option);
    });
    
    // Update the search input dataset
    const searchInput = document.getElementById(fieldId.replace('Select', '') + 'Search');
    if (searchInput) {
        searchInput.dataset.users = JSON.stringify(superiors.map(s => ({
            id: s.superiorUserId,
            name: s.superiorFullName // Use superiorFullName
        })));
    }
    
    // Special handling for preparedBy - auto-select current user if they are in the superiors list
    if (fieldId === 'preparedBySelect') {
        const currentUserId = getUserId();
        if (currentUserId) {
            const currentUserInSuperiors = superiors.find(s => s.superiorUserId === currentUserId);
            if (currentUserInSuperiors) {
                selectElement.value = currentUserId;
                console.log('Auto-selected current user for preparedBy from superiors list');
            } else {
                // If current user is not in superiors list, add them as an option
                const currentUser = window.allUsers ? window.allUsers.find(u => u.id === currentUserId) : null;
                if (currentUser) {
                    const option = document.createElement('option');
                    option.value = currentUserId;
                    option.textContent = currentUser.fullName || currentUser.name;
                    option.selected = true;
                    selectElement.appendChild(option);
                    console.log('Added current user to preparedBy select (not in superiors list)');
                }
            }
        }
    }
    
    // Set pending approval values if they exist
    if (window.pendingApprovalValues) {
        const fieldPrefix = fieldId.replace('Select', '');
        const pendingUserId = window.pendingApprovalValues[fieldPrefix];
        if (pendingUserId) {
            // Check if the user exists in the superiors list
            const matchingSuperior = superiors.find(s => s.superiorUserId === pendingUserId);
            if (matchingSuperior) {
                selectElement.value = pendingUserId;
                const searchInput = document.getElementById(fieldId.replace('Select', '') + 'Search');
                if (searchInput) {
                    searchInput.value = matchingSuperior.superiorFullName; // Use superiorFullName
                }
                console.log(`Set pending approval value for ${fieldPrefix}:`, pendingUserId);
            }
        }
    }
}

// Function to populate all superior employee dropdowns
async function populateAllSuperiorEmployeeDropdowns(transactionType) {
    const documentType = 'RE'; // Reimbursement
    
    const approvalFields = [
        'preparedBySelect',
        'checkedBySelect', 
        'acknowledgeBySelect',
        'approvedBySelect',
        'receivedBySelect'
    ];
    
    for (const fieldId of approvalFields) {
        await populateSuperiorEmployeeDropdown(fieldId, documentType, transactionType);
    }
}

    