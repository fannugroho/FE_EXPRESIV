function loadDashboard() {
    // Fetch status counts from API
    fetchStatusCounts();
    
    // Fetch reimbursements from API
    fetchReimbursements();
    
    // Setup event listeners
    setupEventListeners();
}

// Variables for pagination and filtering
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allReimbursements = [];
let currentTab = 'checked'; // Default tab

// Function to handle search
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const searchType = document.getElementById('searchType').value;
    filterReimbursements(searchTerm, currentTab, searchType);
}

// Function to filter reimbursements based on search term, tab, and search type
// Note: Since we're now using server-side filtering, this function is mainly used for search filtering
function filterReimbursements(searchTerm = '', tab = 'checked', searchType = 'pr') {
    // Since data is already filtered by status from the server, we only need to apply search filter
        filteredData = allReimbursements.filter(item => {
            // Filter berdasarkan tipe pencarian yang dipilih
            let searchMatch = true;
            if (searchTerm) {
                if (searchType === 'pr') {
                    searchMatch = item.voucherNo.toLowerCase().includes(searchTerm);
                } else if (searchType === 'requester') {
                    searchMatch = item.requesterName.toLowerCase().includes(searchTerm);
                } else if (searchType === 'date') {
                    // Handle date search - searchTerm should be in YYYY-MM-DD format from date input
                    const formattedDate = formatDateYYYYMMDD(item.submissionDate);
                    searchMatch = formattedDate === searchTerm;
                } else if (searchType === 'status') {
                    searchMatch = item.status && item.status.toLowerCase().includes(searchTerm);
                }
            }
            
        return searchMatch;
        });
    
    // Update table and pagination
    updateTable();
    updatePagination();
}

// Helper function to format date with local timezone
function formatDateWithLocalTimezone(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    
    // Format for display
    return date.toLocaleDateString();
}

// Helper function to format date in YYYY-MM-DD format with local timezone
function formatDateYYYYMMDD(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Helper function to get status color class based on status value
function getStatusColorClass(status) {
    switch (status) {
        case 'Prepared':
        case 'Draft':
            return 'bg-yellow-200 text-yellow-800';
        case 'Checked':
            return 'bg-green-200 text-green-800';
        case 'Acknowledged':
            return 'bg-blue-200 text-blue-800';
        case 'Approved':
            return 'bg-purple-200 text-purple-800';
        case 'Received':
            return 'bg-indigo-200 text-indigo-800';
        case 'Rejected':
            return 'bg-red-200 text-red-800';
        case 'Closed':
            return 'bg-gray-200 text-gray-800';
        default:
            return 'bg-gray-200 text-gray-800';
    }
}

// Function to fetch status counts from API
function fetchStatusCounts() {
    const userId = getUserId();
    const endpoint = `/api/reimbursements/status-counts/acknowledger/${userId}`;
    
    fetch(`${BASE_URL}${endpoint}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status && data.code === 200) {
                updateStatusCounts(data.data);
            } else {
                console.error('API returned an error:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching status counts:', error);
            // Show error message
            displayErrorMessage('Failed to fetch status counts');
        });
}

// Tambahkan variabel cache dan optimasi
let dataCache = {
    reimbursements: null,
    statusCounts: null,
    lastFetch: null,
    cacheExpiry: 5 * 60 * 1000 // 5 menit
};

let isLoading = false;
let searchInputListener = null;

// Fungsi debounce untuk search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Setup event listeners dengan cleanup
function setupEventListeners() {
    // Remove existing listeners if any
    if (searchInputListener) {
        document.getElementById('searchInput').removeEventListener('input', searchInputListener);
    }
    
    // Add new listeners
    const debouncedSearch = debounce(handleSearch, 300);
    searchInputListener = debouncedSearch;
    document.getElementById('searchInput').addEventListener('input', searchInputListener);
    
    // Add event listener for search type dropdown
    document.getElementById('searchType').addEventListener('change', function() {
        const searchInput = document.getElementById('searchInput');
        const searchType = this.value;
        
        // Change input type based on search type
        if (searchType === 'date') {
            searchInput.type = 'date';
            searchInput.placeholder = 'Select date...';
        } else {
            searchInput.type = 'text';
            searchInput.placeholder = 'Search...';
        }
        
        // Clear the search input when changing search type
        searchInput.value = '';
        
        // Trigger search again when dropdown changes
        const searchTerm = searchInput.value.toLowerCase();
        handleSearch({target: {value: searchTerm}});
    });
}

// Function to fetch reimbursements from API
function fetchReimbursements() {
    const userId = getUserId();
    
    // Cek cache terlebih dahulu
    if (dataCache.reimbursements && 
        dataCache.lastFetch && 
        (Date.now() - dataCache.lastFetch) < dataCache.cacheExpiry) {
        allReimbursements = dataCache.reimbursements;
        fetchReimbursementsByStatus('checked');
        return;
    }
    
    // Initialize with checked tab data
    fetchReimbursementsByStatus('checked');
}

// New function to fetch reimbursements by status using role-specific API endpoints
// Uses role-specific endpoints: /api/reimbursements/acknowledger/{userId}/{status}
function fetchReimbursementsByStatus(status) {
    if (isLoading) return; // Prevent multiple simultaneous requests
    
    isLoading = true;
    const userId = getUserId();
    let endpoint;
    
    // Map tab names to role-specific endpoints
    // These endpoints are designed specifically for acknowledger role with user ID in path
    const endpointMap = {
        'checked': `/api/reimbursements/acknowledger/${userId}/checked`,
        'acknowledged': `/api/reimbursements/acknowledger/${userId}/acknowledged`,
        'rejected': `/api/reimbursements/acknowledger/${userId}/rejected`
    };
    
    endpoint = endpointMap[status];
    if (!endpoint) {
        console.error('Invalid status:', status);
        isLoading = false;
        return;
    }
    
    fetch(`${BASE_URL}${endpoint}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status && data.code === 200) {
                // Simpan ke cache
                dataCache.reimbursements = data.data;
                dataCache.lastFetch = Date.now();
                
                allReimbursements = data.data;
                const searchTerm = document.getElementById('searchInput').value.toLowerCase();
                const searchType = document.getElementById('searchType').value;
                if (searchTerm) {
                    filterReimbursements(searchTerm, status, searchType);
                } else {
                    filteredData = allReimbursements;
                    updateTable();
                    updatePagination();
                }
            } else {
                console.error('API returned an error:', data.message);
                displayErrorMessage('Failed to fetch reimbursements');
            }
        })
        .catch(error => {
            console.error('Error fetching reimbursements by status:', error);
            displayErrorMessage('Failed to fetch reimbursements');
        })
        .finally(() => {
            isLoading = false;
        });
}

// Function to display reimbursements in the table
function displayReimbursements(reimbursements) {
    filteredData = reimbursements;
    updateTable();
    updatePagination();
}

// Function to update the status counts on the page
function updateStatusCounts(data) {
    document.getElementById("totalCount").textContent = data.totalCount || 0;
    document.getElementById("checkedCount").textContent = data.checkedCount || 0;
    document.getElementById("acknowledgedCount").textContent = data.acknowledgedCount || 0;
    document.getElementById("rejectedCount").textContent = data.rejectedCount || 0;
}

function toggleSidebar() {
    // No-op function - sidebar toggle is disabled to keep it permanently open
    return;
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Navigation functions
function goToMenu() { window.location.href = "Menu.html"; }
function goToAddDoc() {window.location.href = "AddDoc.html"; }
function goToAddReim() {window.location.href = "../addPages/addReim.html"; }
function goToAddCash() {window.location.href = "AddCash.html"; }
function goToAddSettle() {window.location.href = "AddSettle.html"; }
function goToAddPO() {window.location.href = "AddPO.html"; }
function goToMenuPR() { window.location.href = "MenuPR.html"; }
function goToMenuReim() { window.location.href = "../../../../pages/menuReim.html"; }
function goToMenuCash() { window.location.href = "MenuCash.html"; }
function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
function goToMenuPO() { window.location.href = "MenuPO.html"; }
function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; }

// Function to redirect to detail page with reimbursement ID
function detailReim(reimId) {
    window.location.href = `../../../approval/acknowledge/reimbursement/acknowledgeReim.html?reim-id=${reimId}`;
}

// Function to display error message
function displayErrorMessage(message) {
    // Reset counts to zero
    document.getElementById("totalCount").textContent = 0;
    document.getElementById("checkedCount").textContent = 0;
    document.getElementById("acknowledgedCount").textContent = 0;
    document.getElementById("rejectedCount").textContent = 0;
    
    // Clear table data
    allReimbursements = [];
    filteredData = [];
    updateTable();
    updatePagination();
    
    // Show error message (could be enhanced with a visual error component)
    console.error(message);
}

// Switch between Prepared and Checked tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('checkedTabBtn').classList.remove('tab-active');
    document.getElementById('acknowledgedTabBtn').classList.remove('tab-active');
    document.getElementById('rejectedTabBtn').classList.remove('tab-active');
    
    if (tabName === 'checked') {
        document.getElementById('checkedTabBtn').classList.add('tab-active');
    } else if (tabName === 'acknowledged') {
        document.getElementById('acknowledgedTabBtn').classList.add('tab-active');
    } else if (tabName === 'rejected') {
        document.getElementById('rejectedTabBtn').classList.add('tab-active');
    }
    
    // Get the table body for animation effects
    const tableBody = document.getElementById('recentDocs');
    
    // Add fade-out effect
    tableBody.style.opacity = '0';
    tableBody.style.transform = 'translateY(10px)';
    tableBody.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    // Fetch data from specific API endpoint for each tab
    setTimeout(() => {
        fetchReimbursementsByStatus(tabName);
        
        // Add fade-in effect
        setTimeout(() => {
            tableBody.style.opacity = '1';
            tableBody.style.transform = 'translateY(0)';
        }, 50);
    }, 200); // Short delay for the transition effect
}

// Update the table with current data
function updateTable() {
    const tableBody = document.getElementById('recentDocs');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    
    // Gunakan DocumentFragment untuk batch DOM updates
    const fragment = document.createDocumentFragment();
    
    for (let i = startIndex; i < endIndex; i++) {
        const item = filteredData[i];
        
        let formattedDate = item.submissionDate;
        if (item.submissionDate) {
            formattedDate = formatDateWithLocalTimezone(item.submissionDate);
        }
        
        const displayStatus = item.status;
        
        const row = document.createElement('tr');
        row.classList.add('border-t', 'hover:bg-gray-100');
        
        row.innerHTML = `
            <td class="p-2">${i + 1}</td>
            <td class="p-2">${item.voucherNo || ''}</td>
            <td class="p-2">${item.requesterName || ''}</td>
            <td class="p-2">${item.department || ''}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${getStatusColorClass(displayStatus)}">
                    ${displayStatus}
                </span>
            </td>
            <td class="p-2">
                <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="detailReim('${item.id}')">
                    Detail
                </button>
            </td>
        `;
        
        fragment.appendChild(row);
    }
    
    // Clear dan append sekaligus
    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
    
    // Update item count display
    document.getElementById('startItem').textContent = filteredData.length > 0 ? startIndex + 1 : 0;
    document.getElementById('endItem').textContent = endIndex;
    document.getElementById('totalItems').textContent = filteredData.length;
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    
    // Update prev/next button states
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (currentPage <= 1) {
        prevBtn.classList.add('disabled');
    } else {
        prevBtn.classList.remove('disabled');
    }
    
    if (currentPage >= totalPages) {
        nextBtn.classList.add('disabled');
    } else {
        nextBtn.classList.remove('disabled');
    }
}

// Optimasi fungsi changePage dengan requestAnimationFrame
function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
    }
    
    // Gunakan requestAnimationFrame untuk smooth rendering
    requestAnimationFrame(() => {
        updateTable();
        updatePagination();
    });
}

// Function to show all documents
function goToTotalDocs() {
    filteredData = allReimbursements;
    currentPage = 1;
    updateTable();
    updatePagination();
}

// Export to Excel function
function downloadExcel() {
    // Get status text for filename
    const statusText = currentTab === 'checked' ? 'Checked' : currentTab === 'acknowledged' ? 'Acknowledged' : 'Rejected';
    const fileName = `Reimbursement_${statusText}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    // Prepare data for export - no changes needed here as it already doesn't include checkbox data
    const data = filteredData.map((item, index) => {
        // Remove Draft to Prepared conversion as it's no longer needed
        return {
            'No.': index + 1,
            'Reimbursement Number': item.voucherNo || '',
            'Requester': item.requesterName || '',
            'Department': item.department || '',
            'Submission Date': item.submissionDate ? formatDateWithLocalTimezone(item.submissionDate) : '',
            'Status': item.status
        };
    });
    
    // Create a worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Create a workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reimbursements');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, fileName);
}

// Export to PDF function
function downloadPDF() {
    // Get status text for filename
    const statusText = currentTab === 'checked' ? 'Checked' : currentTab === 'acknowledged' ? 'Acknowledged' : 'Rejected';
    const fileName = `Reimbursement_${statusText}_${new Date().toISOString().slice(0, 10)}.pdf`;
    
    // Create PDF document
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`Reimbursement ${statusText} Documents`, 14, 22);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data - column headers are already correct without checkbox column
    const tableColumn = ['No.', 'Reimbursement Number', 'Requester', 'Department', 'Submission Date', 'Status'];
    const tableRows = [];
    
    filteredData.forEach((item, index) => {
        // Remove Draft to Prepared conversion as it's no longer needed
        const dataRow = [
            index + 1,
            item.voucherNo || '',
            item.requesterName || '',
            item.department || '',
            item.submissionDate ? formatDateWithLocalTimezone(item.submissionDate) : '',
            item.status
        ];
        tableRows.push(dataRow);
    });
    
    // Add table
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [66, 153, 225],
            textColor: 255
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        }
    });
    
    // Save PDF
    doc.save(fileName);
}

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    
    // Set user avatar and name if available
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.name) {
        document.getElementById('userNameDisplay').textContent = userInfo.name;
    }
    if (userInfo.avatar) {
        document.getElementById('dashboardUserIcon').src = userInfo.avatar;
    } else {
        // Default avatar if none is set
        document.getElementById('dashboardUserIcon').src = "../../../../image/profil.png";
    }
});

// Function to navigate to user profile page
function goToProfile() {
    // Function disabled - no action
    return;
}

window.onload = loadDashboard;

// ================= NOTIFICATION POLLING =================
// Notifikasi dokumen yang perlu diperiksa (checked)
let notifiedReims = new Set();
let notificationContainer = null;
let isNotificationVisible = false;

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    const count = notifiedReims.size;
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.textContent = '0';
        badge.classList.add('hidden');
    }
}

function toggleNotificationPanel() {
    if (!notificationContainer) {
        createNotificationPanel();
    }
    
    if (isNotificationVisible) {
        hideNotificationPanel();
    } else {
        showNotificationPanel();
    }
}

function createNotificationPanel() {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.position = 'fixed';
    notificationContainer.style.top = '70px';
    notificationContainer.style.right = '20px';
    notificationContainer.style.zIndex = '9999';
    notificationContainer.style.maxWidth = '350px';
    notificationContainer.style.maxHeight = '400px';
    notificationContainer.style.overflowY = 'auto';
    notificationContainer.style.backgroundColor = 'white';
    notificationContainer.style.borderRadius = '8px';
    notificationContainer.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    notificationContainer.style.border = '1px solid #e5e7eb';
    notificationContainer.style.display = 'none';
    document.body.appendChild(notificationContainer);
}

function showNotificationPanel() {
    if (!notificationContainer) return;
    
    // Update konten notifikasi
    updateNotificationContent();
    
    notificationContainer.style.display = 'block';
    isNotificationVisible = true;
}

function hideNotificationPanel() {
    if (!notificationContainer) return;
    notificationContainer.style.display = 'none';
    isNotificationVisible = false;
}

function updateNotificationContent() {
    if (!notificationContainer) return;
    
    if (notifiedReims.size === 0) {
        notificationContainer.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <i class="fas fa-bell-slash text-2xl mb-2"></i>
                <p>No notifications</p>
            </div>
        `;
        return;
    }
    
    let content = `
        <div class="p-3 border-b border-gray-200 bg-gray-50">
            <h3 class="font-semibold text-gray-800">Notifications (${notifiedReims.size})</h3>
        </div>
        <div class="max-h-80 overflow-y-auto">
    `;
    
    // Ambil data notifikasi dari localStorage atau dari polling terakhir
    const notificationData = JSON.parse(localStorage.getItem('notificationDataReimAcknow') || '{}');
    
    notifiedReims.forEach(reimNumber => {
        const data = notificationData[reimNumber] || {};
        const submissionDate = data.submissionDate ? new Date(data.submissionDate).toLocaleDateString() : '-';
        
        content += `
            <div class="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900">${data.voucherNo || reimNumber}</div>
                        <div class="text-xs text-gray-600 mt-1">${data.requesterName || 'Unknown'} - ${data.department || 'Unknown'}</div>
                        <div class="text-xs text-gray-500 mt-1">Submitted: ${submissionDate}</div>
                        <div class="inline-block mt-1">
                            <span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">${data.status || 'Checked'}</span>
                        </div>
                    </div>
                    <button onclick="removeNotification('${reimNumber}')" class="ml-2 text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    content += '</div>';
    notificationContainer.innerHTML = content;
}

function showNotification(message, reimNumber) {
    // Simpan data notifikasi ke localStorage
    const notificationData = JSON.parse(localStorage.getItem('notificationDataReimAcknow') || '{}');
    const data = {
        voucherNo: reimNumber,
        requesterName: message.split('-')[1] || 'Unknown',
        department: message.split('-')[2] || 'Unknown',
        submissionDate: message.split('-')[3] || '-',
        status: message.split('-')[4] || 'Checked'
    };
    notificationData[reimNumber] = data;
    localStorage.setItem('notificationDataReimAcknow', JSON.stringify(notificationData));
    
    notifiedReims.add(reimNumber);
    updateNotificationBadge();
    
    // Update panel jika sedang terbuka
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

function removeNotification(reimNumber) {
    // Hapus dari localStorage
    const notificationData = JSON.parse(localStorage.getItem('notificationDataReimAcknow') || '{}');
    delete notificationData[reimNumber];
    localStorage.setItem('notificationDataReimAcknow', JSON.stringify(notificationData));
    
    notifiedReims.delete(reimNumber);
    updateNotificationBadge();
    
    // Update panel jika sedang terbuka
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

async function pollCheckedDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        // Cek apakah ada perubahan data sebelum melakukan fetch
        const lastPollData = localStorage.getItem('lastPollDataReimAcknow');
        
        // Menggunakan endpoint untuk reimbursement
        const response = await fetch(`${BASE_URL}/api/reimbursements/acknowledger/${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        
        const data = await response.json();
        if (!data.status || data.code !== 200) return;
        
        const docs = data.data || [];
        const currentDataHash = JSON.stringify(docs.map(d => ({id: d.id, status: d.status})));
        
        // Hanya proses jika ada perubahan data
        if (lastPollData !== currentDataHash) {
            localStorage.setItem('lastPollDataReimAcknow', currentDataHash);
            
            let newReimFound = false;
            
            docs.forEach(doc => {
                if (doc.status === 'Checked' && !notifiedReims.has(doc.voucherNo)) {
                    const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                    const message = `${doc.voucherNo}-${doc.requesterName}-${doc.department}-${submissionDate}-${doc.status}`;
                    showNotification(message, doc.voucherNo);
                    newReimFound = true;
                }
            });
            
            if (newReimFound) {
                try {
                    const audio = new Audio('../../../../components/shared/tones.mp3');
                    audio.play();
                } catch (e) {
                    console.warn('Gagal memutar nada dering notifikasi:', e);
                }
            }
        }
    } catch (e) {
        console.error('Error polling reimbursements:', e);
    }
}

async function pollAcknowledgedDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        // Menggunakan endpoint untuk reimbursement
        const response = await fetch(`${BASE_URL}/api/reimbursements/acknowledger/${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        
        const data = await response.json();
        if (!data.status || data.code !== 200) return;
        
        const docs = data.data || [];
        
        // Buat set dari reimbursement yang sudah Acknowledged
        const acknowledgedReims = new Set(
            docs.filter(doc => doc.status === 'Acknowledged')
                .map(doc => doc.voucherNo)
        );
        
        // Hapus notifikasi untuk reimbursement yang sudah acknowledged
        notifiedReims.forEach(reimNumber => {
            if (acknowledgedReims.has(reimNumber)) {
                removeNotification(reimNumber);
            }
        });
    } catch (e) {
        // Silent error
        console.error('Error polling acknowledged reimbursements:', e);
    }
}

// Ubah polling interval dari 10 detik ke 30 detik
setInterval(() => {
    pollCheckedDocs();
    pollAcknowledgedDocs();
}, 30000); // 30 detik

// Jalankan polling pertama kali dan setup event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Existing DOMContentLoaded code will run first
    
    // Tambahkan polling notifikasi
    setTimeout(() => {
        pollCheckedDocs();
        pollAcknowledgedDocs();
        updateNotificationBadge();
        
        // Tutup panel jika klik di luar
        const bell = document.getElementById('notificationBell');
        document.addEventListener('click', function(event) {
            if (notificationContainer && 
                !notificationContainer.contains(event.target) && 
                bell && !bell.contains(event.target)) {
                hideNotificationPanel();
            }
        });
    }, 1000); // Delay untuk memastikan DOM sudah siap
});