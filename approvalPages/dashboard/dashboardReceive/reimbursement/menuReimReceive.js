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

// Load dashboard data when page loads
function loadDashboard() {
    // Fetch status counts from API
    fetchStatusCounts();
    // Fetch reimbursements from API
    fetchReimbursements();
    
    // Add event listener for search input
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
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

// Variables for pagination and filtering
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allReimbursements = [];
let currentTab = 'approved'; // Default tab
let searchQuery = '';
let dateFilter = '';

// Function to handle search
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const searchType = document.getElementById('searchType').value;
    filterReimbursements(searchTerm, currentTab, searchType);
}

// Function to filter reimbursements based on search term and search type
function filterReimbursements(searchTerm = '', tab = 'approved', searchType = 'pr') {
    // Since we're now fetching data by status from the API,
    // we only need to filter by search criteria
    filteredData = allReimbursements.filter(item => {
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

// Function to fetch status counts from API
function fetchStatusCounts() {
    const userId = getUserId();
    const endpoint = `/api/reimbursements/status-counts/receiver/${userId}`;
    
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
            // Fallback to sample data if API fails
            updateSampleCounts();
        });
}

// Function to fetch reimbursements from API
function fetchReimbursements() {
    // This function will now just call fetchReimbursementsByStatus with the current tab
    fetchReimbursementsByStatus(currentTab);
}

// New function to fetch reimbursements by status using specific endpoints
function fetchReimbursementsByStatus(status) {
    const userId = getUserId();
    let endpoint;
    
    // Select the appropriate endpoint based on the status
    if (status === 'approved') {
        endpoint = `/api/reimbursements/receiver/${userId}/approved`;
    } else if (status === 'received') {
        endpoint = `/api/reimbursements/receiver/${userId}/received`;
    } else if (status === 'rejected') {
        endpoint = `/api/reimbursements/receiver/${userId}/rejected`;
    } else {
        // Fallback to the general endpoint
        endpoint = `/api/reimbursements/receiver/${userId}`;
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
                // Update the filtered data directly with the API response
                allReimbursements = data.data;
                
                // Apply search filtering if there's a search term
                const searchTerm = document.getElementById('searchInput').value.toLowerCase();
                const searchType = document.getElementById('searchType').value;
                if (searchTerm) {
                    filterReimbursements(searchTerm, status, searchType);
                } else {
                    // If no search term, use all data from the response
                    filteredData = allReimbursements;
                    updateTable();
                    updatePagination();
                }
            } else {
                console.error('API returned an error:', data.message);
                // Use sample data if API fails
                useSampleData();
                filterReimbursements('', status);
            }
        })
        .catch(error => {
            console.error(`Error fetching ${status} reimbursements:`, error);
            // Use sample data if API fails
            useSampleData();
            filterReimbursements('', status);
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
    document.getElementById("receivedCount").textContent = data.receivedCount || 0;
    document.getElementById("approvedCount").textContent = data.approvedCount || 0;
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
// function goToMenu() { window.location.href = "Menu.html"; }
// function goToAddDoc() {window.location.href = "AddDoc.html"; }
// function goToAddReim() {window.location.href = "../addPages/addReim.html"; }
// function goToAddCash() {window.location.href = "AddCash.html"; }
// function goToAddSettle() {window.location.href = "AddSettle.html"; }
// function goToAddPO() {window.location.href = "AddPO.html"; }
// function goToMenuPR() { window.location.href = "MenuPR.html"; }
// function goToMenuReceiveReim() { window.location.href = "MenuReceiveReim.html"; }
// function goToMenuReim() { window.location.href = "MenuReim.html"; }
// function goToMenuCash() { window.location.href = "MenuCash.html"; }
// function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
// function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
// function goToMenuPO() { window.location.href = "MenuPO.html"; }
// function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
// function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
// function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; }

// Function to redirect to detail page with reimbursement ID
function detailReim(reimId) {
    window.location.href = `../../../approval/receive/reimbursement/receiveReim.html?reim-id=${reimId}`;
}

// Sample data for testing when API is not available
let sampleData = [];
function generateSampleData() {
    return [];
}

// Use sample data when API fails
function useSampleData() {
    allReimbursements = generateSampleData();
    updateSampleCounts();
}

// Update counts using sample data
function updateSampleCounts() {
    document.getElementById("totalCount").textContent = "0";
    document.getElementById("receivedCount").textContent = "0";
    document.getElementById("approvedCount").textContent = "0";
    document.getElementById("rejectedCount").textContent = "0";
}

// Apply search and date filters
function applyFilters() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase();
    dateFilter = document.getElementById('dateFilter').value;
    
    currentPage = 1; // Reset to first page
    switchTab(currentTab);
}

// Reset all filters
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('dateFilter').value = '';
    searchQuery = '';
    dateFilter = '';
    
    currentPage = 1; // Reset to first page
    switchTab(currentTab);
}

// Filter data based on search query and date
function filterData(data) {
    return data.filter(item => {
        // Check if item matches search query
        const matchesSearch = searchQuery === '' || 
            (item.voucherNo && item.voucherNo.toLowerCase().includes(searchQuery)) ||
            (item.requesterName && item.requesterName.toLowerCase().includes(searchQuery));
        
        // Check if item matches date filter
        let matchesDate = true;
        if (dateFilter) {
            // Format date with local timezone
            let itemDate = '';
            if (item.submissionDate) {
                const date = new Date(item.submissionDate);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                itemDate = `${year}-${month}-${day}`;
            }
            matchesDate = itemDate === dateFilter;
        }
        
        return matchesSearch && matchesDate;
    });
}

// Switch between tabs (Approved, Received, Rejected)
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('receivedTabBtn').classList.remove('tab-active');
    document.getElementById('approvedTabBtn').classList.remove('tab-active');
    document.getElementById('rejectedTabBtn').classList.remove('tab-active');
    
    if (tabName === 'received') {
        document.getElementById('receivedTabBtn').classList.add('tab-active');
    } else if (tabName === 'approved') {
        document.getElementById('approvedTabBtn').classList.add('tab-active');
    } else if (tabName === 'rejected') {
        document.getElementById('rejectedTabBtn').classList.add('tab-active');
    }
    
    // Get the table body for animation effects
    const tableBody = document.getElementById('recentDocs');
    
    // Add fade-out effect
    tableBody.style.opacity = '0';
    tableBody.style.transform = 'translateY(10px)';
    tableBody.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    // Fetch data from the appropriate API endpoint with a slight delay to allow animation
    setTimeout(() => {
        // Fetch data for the selected tab
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
    tableBody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        const item = filteredData[i];
        
        // Format the submission date if needed
        let formattedDate = item.submissionDate;
        if (item.submissionDate) {
            formattedDate = formatDateWithLocalTimezone(item.submissionDate);
        }
        
        // Get status color class based on status
        const statusColorClass = getStatusColorClass(item.status);
        
        const row = document.createElement('tr');
        row.classList.add('border-t', 'hover:bg-gray-100');
        
        row.innerHTML = `
            <td class="p-2">${i + 1}</td>
            <td class="p-2">${item.voucherNo || ''}</td>
            <td class="p-2">${item.requesterName || ''}</td>
            <td class="p-2">${item.department || ''}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${statusColorClass}">
                    ${item.status}
                </span>
            </td>
            <td class="p-2">
                <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="detailReim('${item.id}')">
                    Detail
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    }
    
    // Update the item count display
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

// Change the current page
function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable();
        updatePagination();
    }
}

// Function to show all documents
function goToTotalDocs() {
    filteredData = filterData(allReimbursements);
    currentPage = 1;
    updateTable();
    updatePagination();
}

// Export to Excel function
function downloadExcel() {
    // Get status text for filename
    const statusText = currentTab === 'received' ? 'Received' : currentTab === 'approved' ? 'Approved' : 'Rejected';
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
    const statusText = currentTab === 'received' ? 'Received' : currentTab === 'approved' ? 'Approved' : 'Rejected';
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
            item.submissionDate ? new Date(item.submissionDate).toLocaleDateString() : '',
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
// Notifikasi dokumen yang perlu diperiksa (approved)
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
    const notificationData = JSON.parse(localStorage.getItem('notificationDataReimReceive') || '{}');
    
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
                            <span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">${data.status || 'Approved'}</span>
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
    const notificationData = JSON.parse(localStorage.getItem('notificationDataReimReceive') || '{}');
    const data = {
        voucherNo: reimNumber,
        requesterName: message.split('-')[1] || 'Unknown',
        department: message.split('-')[2] || 'Unknown',
        submissionDate: message.split('-')[3] || '-',
        status: message.split('-')[4] || 'Approved'
    };
    notificationData[reimNumber] = data;
    localStorage.setItem('notificationDataReimReceive', JSON.stringify(notificationData));
    
    notifiedReims.add(reimNumber);
    updateNotificationBadge();
    
    // Update panel jika sedang terbuka
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

function removeNotification(reimNumber) {
    // Hapus dari localStorage
    const notificationData = JSON.parse(localStorage.getItem('notificationDataReimReceive') || '{}');
    delete notificationData[reimNumber];
    localStorage.setItem('notificationDataReimReceive', JSON.stringify(notificationData));
    
    notifiedReims.delete(reimNumber);
    updateNotificationBadge();
    
    // Update panel jika sedang terbuka
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

async function pollApprovedDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        // Menggunakan endpoint untuk reimbursement
        const response = await fetch(`${BASE_URL}/api/reimbursements/receiver/${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        
        const data = await response.json();
        if (!data.status || data.code !== 200) return;
        
        const docs = data.data || [];
        let newReimFound = false;
        
        docs.forEach(doc => {
            // Hanya notifikasi untuk dokumen dengan status Approved
            if (doc.status === 'Approved' && !notifiedReims.has(doc.voucherNo)) {
                // Format pesan notifikasi
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.voucherNo}-${doc.requesterName}-${doc.department}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.voucherNo);
                newReimFound = true;
            }
        });
        
        // Play sound jika ada dokumen baru
        if (newReimFound) {
            try {
                const audio = new Audio('../../../../components/shared/tones.mp3');
                audio.play();
            } catch (e) {
                console.warn('Gagal memutar nada dering notifikasi:', e);
            }
        }
    } catch (e) {
        // Silent error
        console.error('Error polling reimbursements:', e);
    }
}

async function pollReceivedDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        // Menggunakan endpoint untuk reimbursement
        const response = await fetch(`${BASE_URL}/api/reimbursements/receiver/${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        
        const data = await response.json();
        if (!data.status || data.code !== 200) return;
        
        const docs = data.data || [];
        
        // Buat set dari reimbursement yang sudah Received
        const receivedReims = new Set(
            docs.filter(doc => doc.status === 'Received')
                .map(doc => doc.voucherNo)
        );
        
        // Hapus notifikasi untuk reimbursement yang sudah received
        notifiedReims.forEach(reimNumber => {
            if (receivedReims.has(reimNumber)) {
                removeNotification(reimNumber);
            }
        });
    } catch (e) {
        // Silent error
        console.error('Error polling received reimbursements:', e);
    }
}

// Polling interval (setiap 10 detik)
setInterval(() => {
    pollApprovedDocs();
    pollReceivedDocs();
}, 30000); // 30 detik

// Jalankan polling pertama kali dan setup event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Existing DOMContentLoaded code will run first
    
    // Tambahkan polling notifikasi
    setTimeout(() => {
        pollApprovedDocs();
        pollReceivedDocs();
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

// Helper function to get status color class
function getStatusColorClass(status) {
    switch (status) {
        case 'Received':
            return 'bg-yellow-200 text-yellow-800';
        case 'Approved':
            return 'bg-green-200 text-green-800';
        case 'Rejected':
            return 'bg-red-200 text-red-800';
        case 'Acknowledged':
            return 'bg-blue-200 text-blue-800';
        case 'Prepared':
            return 'bg-purple-200 text-purple-800';
        case 'Checked':
            return 'bg-indigo-200 text-indigo-800';
        default:
            return 'bg-gray-200 text-gray-800';
    }
}