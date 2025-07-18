// TODO Reimbursement Revision 

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

// Global variables for pagination
let currentPage = 1;
const itemsPerPage = 10;
let allReimbursements = [];
let filteredReimbursements = [];
let currentTab = 'revised'; // Default tab

// Function to handle search
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const searchType = document.getElementById('searchType').value;
    filterReimbursements(searchTerm, currentTab, searchType);
}

// Function to filter reimbursements based on search term, tab, and search type
function filterReimbursements(searchTerm = '', tab = 'revised', searchType = 'pr') {
    if (tab === 'revised') {
        filteredReimbursements = allReimbursements.filter(reim => {
            // Filter berdasarkan status
            const statusMatch = reim.status.toLowerCase() === 'revised';
            
            // Filter berdasarkan tipe pencarian yang dipilih
            let searchMatch = true;
            if (searchTerm) {
                if (searchType === 'pr') {
                    searchMatch = reim.voucherNo.toLowerCase().includes(searchTerm);
                } else if (searchType === 'requester') {
                    searchMatch = reim.requesterName.toLowerCase().includes(searchTerm);
                } else if (searchType === 'date') {
                    // Format tanggal untuk pencarian
                    const formattedDate = formatDateYYYYMMDD(reim.submissionDate).toLowerCase();
                    searchMatch = formattedDate.includes(searchTerm);
                }
            }
            
            return statusMatch && searchMatch;
        });
    } else if (tab === 'prepared') {
        filteredReimbursements = allReimbursements.filter(reim => {
            // Filter berdasarkan status
            const statusMatch = reim.status.toLowerCase() === 'prepared';
            
            // Filter berdasarkan tipe pencarian yang dipilih
            let searchMatch = true;
            if (searchTerm) {
                if (searchType === 'pr') {
                    searchMatch = reim.voucherNo.toLowerCase().includes(searchTerm);
                } else if (searchType === 'requester') {
                    searchMatch = reim.requesterName.toLowerCase().includes(searchTerm);
                } else if (searchType === 'date') {
                    // Format tanggal untuk pencarian
                    const formattedDate = formatDateYYYYMMDD(reim.submissionDate).toLowerCase();
                    searchMatch = formattedDate.includes(searchTerm);
                }
            }
            
            return statusMatch && searchMatch;
        });
    }
    
    currentPage = 1;
    displayReimbursements(filteredReimbursements);
}

// Function to switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('revisedTabBtn').classList.remove('tab-active');
    document.getElementById('preparedTabBtn').classList.remove('tab-active');
    
    if (tabName === 'revised') {
        document.getElementById('revisedTabBtn').classList.add('tab-active');
    } else if (tabName === 'prepared') {
        document.getElementById('preparedTabBtn').classList.add('tab-active');
    }
    
    // Filter reimbursements based on current tab and search term
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const searchType = document.getElementById('searchType').value;
    filterReimbursements(searchTerm, tabName, searchType);
}

// Function to fetch status counts from API
function fetchStatusCounts() {
    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found. Please login again.');
        return;
    }

    const endpoint = `/api/reimbursements/status-counts/user/${userId}`;
    
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
        });
}

// Function to fetch reimbursements from API
function fetchReimbursements() {
    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found. Please login again.');
        return;
    }

    const endpoint = `/api/reimbursements/user/${userId}`;
    
    fetch(`${BASE_URL}${endpoint}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status && data.code === 200) {
                allReimbursements = data.data;
                filteredReimbursements = allReimbursements.filter(reim => 
                    reim.status.toLowerCase() === 'revised'
                );
                displayReimbursements(filteredReimbursements);
            } else {
                console.error('API returned an error:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching reimbursements:', error);
        });
}

// Function to display reimbursements in the table with pagination
function displayReimbursements(reimbursements) {
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, reimbursements.length);
    const paginatedReimbursements = reimbursements.slice(startIndex, endIndex);
    
    paginatedReimbursements.forEach((reim, index) => {
        let formattedDate = reim.submissionDate;
        if (reim.submissionDate) {
            formattedDate = formatDateWithLocalTimezone(reim.submissionDate);
        }
        
        // Calculate incremental Doc Number starting from 1
        const docNumber = startIndex + index + 1;
        
        const row = `<tr class='border-b'>
            <td class='p-2'>${docNumber}</td>
            <td class='p-2'>${reim.voucherNo}</td>
            <td class='p-2'>${reim.requesterName}</td>
            <td class='p-2'>${reim.department}</td>
            <td class='p-2'>${formattedDate}</td>
            <td class='p-2'>
                <span class="px-2 py-1 rounded-full text-xs ${reim.status === 'Revised' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}">
                    ${reim.status === 'Revised' ? 'Revision' : reim.status}
                </span>
            </td>
            <td class='p-2'>
                <button onclick="detailReim('${reim.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    // Update item count display
    document.getElementById('startItem').textContent = reimbursements.length > 0 ? startIndex + 1 : 0;
    document.getElementById('endItem').textContent = endIndex;
    document.getElementById('totalItems').textContent = reimbursements.length;
    
    // Update pagination buttons
    updatePaginationButtons(reimbursements.length);
}

// Function to get current user ID
function getUserId() {
    const userStr = localStorage.getItem('loggedInUser');
    if (!userStr) return null;
    
    try {
        const user = JSON.parse(userStr);
        return user.id || null;
    } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
    }
}

// Function to update pagination buttons
function updatePaginationButtons(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    
    // Update prev/next button states
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.classList.toggle('disabled', currentPage <= 1);
    nextBtn.classList.toggle('disabled', currentPage >= totalPages);
}

// Function to change page
function changePage(direction) {
    const totalPages = Math.ceil(filteredReimbursements.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayReimbursements(filteredReimbursements);
    }
}

// Function to download Excel
function downloadExcel() {
    const workbook = XLSX.utils.book_new();
    
    // Convert the data to worksheet format with incremental Doc Number
    const wsData = filteredReimbursements.map((reim, index) => ({
        'Document Number': index + 1,
        'Reimbursement Number': reim.voucherNo,
        'Requester': reim.requesterName,
        'Department': reim.department,
        'Submission Date': reim.submissionDate,
        'Status': reim.status
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reimbursements');
    
    // Generate Excel file
    XLSX.writeFile(workbook, 'reimbursement_revised.xlsx');
}

// Function to download PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Reimbursement Revised Report', 14, 15);
    
    // Create table data with incremental Doc Number
    const tableData = filteredReimbursements.map((reim, index) => [
        index + 1,
        reim.voucherNo,
        reim.requesterName,
        reim.department,
        reim.submissionDate,
        reim.status
    ]);
    
    // Add table
    doc.autoTable({
        head: [['Doc Number', 'Reimbursement Number', 'Requester', 'Department', 'Submission Date', 'Status']],
        body: tableData,
        startY: 25
    });
    
    // Save PDF
    doc.save('reimbursement_revised.pdf');
}

// Function to update the status counts on the page
function updateStatusCounts(data) {
    document.getElementById("revisedCount").textContent = data.revisedCount || 0;
    document.getElementById("preparedCount").textContent = data.preparedCount || 0;
}

function toggleSidebar() {
    // No-op function - sidebar toggle is disabled to keep it permanently open
    return;
}

// Function to redirect to detail page with reimbursement ID
function detailReim(reimId) {
    window.location.href = `/approvalPages/approval/revision/reimbursement/revisionReim.html?reim-id=${reimId}`;
}

// Function to load dashboard
function loadDashboard() {
    // Fetch status counts from API
    fetchStatusCounts();
    
    // Fetch reimbursements from API
    fetchReimbursements();

    // Add event listener for search input
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // Add event listener for search type dropdown
    document.getElementById('searchType').addEventListener('change', function() {
        // Trigger search again when dropdown changes
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        handleSearch({target: {value: searchTerm}});
    });
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

window.onload = loadDashboard; 

// ================= NOTIFICATION POLLING =================
// Notifikasi dokumen yang perlu direvisi (revision)
let notifiedReims = new Set();
let notificationContainer = null;
let isNotificationVisible = false;

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) {
        console.warn('Notification badge element not found');
        return;
    }
    
    const count = notifiedReims.size;
    console.log('Updating notification badge, count:', count);
    
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
        console.log('Badge should be visible with count:', count);
    } else {
        badge.textContent = '0';
        badge.classList.add('hidden');
        console.log('Badge should be hidden');
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
    const notificationData = JSON.parse(localStorage.getItem('notificationDataReimRevision') || '{}');
    
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
                            <span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">${data.status || 'Revision'}</span>
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
    console.log('Showing notification for:', reimNumber, 'Message:', message);
    
    // Simpan data notifikasi ke localStorage
    const notificationData = JSON.parse(localStorage.getItem('notificationDataReimRevision') || '{}');
    const data = {
        voucherNo: reimNumber,
        requesterName: message.split('-')[1] || 'Unknown',
        department: message.split('-')[2] || 'Unknown',
        submissionDate: message.split('-')[3] || '-',
        status: message.split('-')[4] || 'Revision'
    };
    notificationData[reimNumber] = data;
    localStorage.setItem('notificationDataReimRevision', JSON.stringify(notificationData));
    
    notifiedReims.add(reimNumber);
    console.log('Current notified reimbursements:', Array.from(notifiedReims));
    
    updateNotificationBadge();
    
    // Update panel jika sedang terbuka
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

function removeNotification(reimNumber) {
    // Hapus dari localStorage
    const notificationData = JSON.parse(localStorage.getItem('notificationDataReimRevision') || '{}');
    delete notificationData[reimNumber];
    localStorage.setItem('notificationDataReimRevision', JSON.stringify(notificationData));
    
    notifiedReims.delete(reimNumber);
    updateNotificationBadge();
    
    // Update panel jika sedang terbuka
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

async function pollRevisionDocs() {
    try {
        const userId = getUserId();
        if (!userId) {
            console.log('No user ID found for polling');
            return;
        }
        
        console.log('Polling for revision documents...');
        
        // Menggunakan endpoint umum untuk reimbursement
        const response = await fetch(`${BASE_URL}/api/reimbursements/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        
        if (!response.ok) {
            console.warn('Failed to fetch reimbursements for polling:', response.status);
            return;
        }
        
        const data = await response.json();
        if (!data.status || data.code !== 200) {
            console.warn('API returned error for polling:', data);
            return;
        }
        
        const docs = data.data || [];
        console.log('Fetched documents for polling:', docs.length);
        
        let newReimFound = false;
        
        docs.forEach(doc => {
            console.log('Checking document:', doc.voucherNo, 'Status:', doc.status);
            // Hanya notifikasi untuk dokumen dengan status Revision
            if (doc.status === 'Revision' && !notifiedReims.has(doc.voucherNo)) {
                console.log('Found new revision document:', doc.voucherNo);
                // Format pesan notifikasi
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.voucherNo}-${doc.requesterName}-${doc.department}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.voucherNo);
                newReimFound = true;
            }
        });
        
        // Play sound jika ada dokumen baru
        if (newReimFound) {
            console.log('New revision found, playing notification sound');
            try {
                const audio = new Audio('../../../../components/shared/tones.mp3');
                audio.play();
            } catch (e) {
                console.warn('Gagal memutar nada dering notifikasi:', e);
            }
        }
    } catch (e) {
        console.error('Error polling reimbursements:', e);
    }
}

async function pollPreparedDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        // Menggunakan endpoint umum untuk reimbursement
        const response = await fetch(`${BASE_URL}/api/reimbursements/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        
        if (!response.ok) {
            console.warn('Failed to fetch reimbursements for polling');
            return;
        }
        
        const data = await response.json();
        if (!data.status || data.code !== 200) return;
        
        const docs = data.data || [];
        
        // Buat set dari reimbursement yang sudah Prepared (setelah direvisi)
        const preparedReims = new Set(
            docs.filter(doc => doc.status === 'Prepared')
                .map(doc => doc.voucherNo)
        );
        
        // Hapus notifikasi untuk reimbursement yang sudah prepared
        notifiedReims.forEach(reimNumber => {
            if (preparedReims.has(reimNumber)) {
                removeNotification(reimNumber);
            }
        });
    } catch (e) {
        // Silent error
        console.error('Error polling prepared reimbursements:', e);
    }
}

// Polling interval (setiap 10 detik)
console.log('Setting up polling interval...');
setInterval(() => {
    console.log('Polling interval triggered');
    pollRevisionDocs();
    pollPreparedDocs();
}, 10000);

// Jalankan polling pertama kali dan setup event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded triggered for notifications');
    
    // Existing DOMContentLoaded code will run first
    
    // Tambahkan polling notifikasi
    setTimeout(() => {
        console.log('Starting initial polling...');
        pollRevisionDocs();
        pollPreparedDocs();
        updateNotificationBadge();
        
        // Event click pada bell untuk toggle notifikasi panel
        const bell = document.getElementById('notificationBell');
        if (bell) {
            console.log('Setting up bell click event');
            bell.addEventListener('click', function() {
                console.log('Bell clicked');
                toggleNotificationPanel();
            });
        } else {
            console.warn('Notification bell element not found');
        }
        
        // Tutup panel jika klik di luar
        document.addEventListener('click', function(event) {
            if (notificationContainer && 
                !notificationContainer.contains(event.target) && 
                bell && !bell.contains(event.target)) {
                hideNotificationPanel();
            }
        });
    }, 1000); // Delay untuk memastikan DOM sudah siap
}); 