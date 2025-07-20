// Current tab state
let currentTab = 'revision'; // Default tab
let currentSearchTerm = '';
let currentSearchType = 'pr';

// Pagination variables
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allPurchaseRequests = [];

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    loadUserProfileInfo();
    
    // Add event listener for search input with debouncing
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearch();
            }, 500); // Debounce search by 500ms
        });
    }
    
    // Add event listener to the search type dropdown
    const searchType = document.getElementById('searchType');
    if (searchType) {
        searchType.addEventListener('change', function() {
            const searchInput = document.getElementById('searchInput');
            
            // Update input type and placeholder based on search type
            if (this.value === 'date') {
                searchInput.type = 'date';
                searchInput.placeholder = 'Select date...';
            } else {
                searchInput.type = 'text';
                searchInput.placeholder = `Search by ${this.options[this.selectedIndex].text}...`;
            }
            
            // Clear current search and trigger new search
            searchInput.value = '';
            currentSearchTerm = '';
            currentSearchType = this.value;
            loadDashboard();
        });
    }
    
    // Notification dropdown toggle
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('hidden');
        });
        
        // Close when clicking outside
        document.addEventListener('click', function(e) {
            if (!notificationDropdown.contains(e.target) && e.target !== notificationBtn) {
                notificationDropdown.classList.add('hidden');
            }
        });
    }
});

async function loadDashboard() {
    try {
        // Get user ID 
        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }

        // Update counters by fetching both statuses
        await updateCounters(userId);   
        
        // Filter and display documents based on current tab
        await filterAndDisplayDocuments(userId);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Failed to load dashboard data. Please try again.');
        
        // Fallback to empty state
        updateTable([]);
        updatePaginationInfo(0);
    }
}

// Function to update counters by fetching data for both statuses
async function updateCounters(userId) {
    try {
        // Fetch counts for each status
        const revisionResponse = await fetch(`${BASE_URL}/api/pr/dashboard/revision?filterType=revision&userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const preparedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/revision?filterType=prepared&userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const revisionData = revisionResponse.ok ? await revisionResponse.json() : { data: [] };
        const preparedData = preparedResponse.ok ? await preparedResponse.json() : { data: [] };

        const revisionCount = revisionData.data ? revisionData.data.length : 0;
        const preparedCount = preparedData.data ? preparedData.data.length : 0;

        // Update counters in the UI
        document.getElementById("revisionCount").textContent = revisionCount;
        document.getElementById("preparedCount").textContent = preparedCount;
        
    } catch (error) {
        console.error('Error updating counters:', error);
        
        // Fallback to zero counts
        document.getElementById("revisionCount").textContent = 0;
        document.getElementById("preparedCount").textContent = 0;
    }
}

// Function to filter and display documents based on current tab
async function filterAndDisplayDocuments(userId) {
    try {
        // Build base URL and params
        let baseUrl = `${BASE_URL}/api/pr/dashboard/revision`;
        const params = new URLSearchParams();
        
        // Build URL based on current tab
        if (currentTab === 'revision') {
            params.append('filterType', 'revision');
            params.append('userId', userId); // Always filter by userId for revision tab
        } else if (currentTab === 'prepared') {
            params.append('filterType', 'prepared');
            params.append('userId', userId);
        }
        
        // Add search parameters if available
        if (currentSearchTerm) {
            switch (currentSearchType) {
                case 'pr':
                    params.append('purchaseRequestNo', currentSearchTerm);
                    break;
                case 'requester':
                    params.append('requesterName', currentSearchTerm);
                    break;
                case 'status':
                    params.append('status', currentSearchTerm);
                    break;
                case 'date':
                    // For date search, try to parse and use date range
                    const dateValue = new Date(currentSearchTerm);
                    if (!isNaN(dateValue.getTime())) {
                        params.append('submissionDateFrom', dateValue.toISOString().split('T')[0]);
                        params.append('submissionDateTo', dateValue.toISOString().split('T')[0]);
                    }
                    break;
            }
        }
        
        const url = `${baseUrl}?${params.toString()}`;

        console.log('Fetching documents from:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('API response:', result);

        if (result.status && result.data) {
            const documents = result.data;
            
            // Update the table with filtered documents
            updateTable(documents);
            
            // Update pagination info
            updatePaginationInfo(documents.length);
        } else {
            console.error('API response error:', result.message);
            // Fallback to empty state
            updateTable([]);
            updatePaginationInfo(0);
        }
        
    } catch (error) {
        console.error('Error filtering documents:', error);
        // Fallback to empty state
        updateTable([]);
        updatePaginationInfo(0);
    }
}

// Function to update table with documents
function updateTable(documents = []) {
    const tableBody = document.getElementById('recentDocs');
    tableBody.innerHTML = '';
    
    filteredData = documents;
    
    if (documents.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="10" class="p-4 text-center text-gray-500">
                No documents found for the selected tab.
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, documents.length);
    const paginatedDocs = documents.slice(startIndex, endIndex);
    
    // Remarks column has been removed
    
    paginatedDocs.forEach((doc, i) => {
        const row = document.createElement('tr');
        row.classList.add('border-t', 'hover:bg-gray-100');
        
        // Format dates
        const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
        const requiredDate = doc.requiredDate ? new Date(doc.requiredDate).toLocaleDateString() : '-';
        
        // Get values for each cell and check if they need scrolling
        const prNumber = doc.purchaseRequestNo || '-';
        const requesterName = doc.requesterName || '-';
        const departmentName = doc.departmentName || '-';
        const poNumber = doc.poNumber || '-';
        
        // Create cell classes based on content length
        const prNumberClass = prNumber.toString().length > 8 ? 'scrollable-cell' : '';
        const requesterClass = requesterName.toString().length > 8 ? 'scrollable-cell' : '';
        const departmentClass = departmentName.toString().length > 8 ? 'scrollable-cell' : '';
        const poNumberClass = poNumber.toString().length > 8 ? 'scrollable-cell' : '';
        
        // Get status styling
        const statusClass = getStatusClass(doc.status);
        const statusText = doc.status || 'Unknown';
        
        // Incremental doc number
        const docNumber = startIndex + i + 1;
        
        // Build row HTML with data attributes for content length checking
        row.innerHTML = `
            <td class="p-2">${docNumber}</td>
            <td class="p-2 ${prNumberClass}" data-content="${prNumber}">${prNumber}</td>
            <td class="p-2 ${requesterClass}" data-content="${requesterName}">${requesterName}</td>
            <td class="p-2 ${departmentClass}" data-content="${departmentName}">${departmentName}</td>
            <td class="p-2">${submissionDate}</td>
            <td class="p-2">${requiredDate}</td>
            <td class="p-2 ${poNumberClass}" data-content="${poNumber}">${poNumber}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">
                    ${statusText}
                </span>
            </td>
            <td class="p-2">
                <button onclick="detailDoc('${doc.id}', '${doc.type}')" class="text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-600 rounded-md text-xs">
                    Detail
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Function to update pagination info
function updatePaginationInfo(totalItems) {
    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    document.getElementById('startItem').textContent = startItem;
    document.getElementById('endItem').textContent = endItem;
    document.getElementById('totalItems').textContent = totalItems;
    
    // Update pagination buttons
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    
    prevButton.classList.toggle('disabled', currentPage <= 1);
    nextButton.classList.toggle('disabled', currentPage >= totalPages);
    
    document.getElementById('currentPage').textContent = currentPage;
}

// Function to switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update active tab styling
    document.querySelectorAll('.tab-active').forEach(el => el.classList.remove('tab-active'));
    
    if (tabName === 'revision') {
        document.getElementById('revisionTabBtn').classList.add('tab-active');
    } else if (tabName === 'prepared') {
        document.getElementById('preparedTabBtn').classList.add('tab-active');
    }
    
    // Reset search when switching tabs
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        currentSearchTerm = '';
    }
    
    // Get user ID and reload data for the selected tab
    const userId = getUserId();
    if (!userId) {
        alert("Unable to get user ID from token. Please login again.");
        return;
    }
    
    // Filter and display documents based on the selected tab
    filterAndDisplayDocuments(userId);
}

// Helper function to get status styling
function getStatusClass(status) {
    switch(status) {
        case 'Draft': return 'bg-gray-100 text-gray-800';
        case 'Prepared': return 'bg-yellow-100 text-yellow-800';
        case 'Checked': return 'bg-green-100 text-green-800';
        case 'Acknowledged': return 'bg-blue-100 text-blue-800';
        case 'Approved': return 'bg-indigo-100 text-indigo-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        case 'Revision': return 'bg-orange-100 text-orange-800';
        case 'Received': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Pagination handlers
function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable(filteredData);
        updatePaginationInfo(filteredData.length);
    }
}

// Navigation functions
function toggleSidebar() {
    // Sidebar is now permanently visible, do nothing
    return false;
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Function to navigate to user profile page
function goToProfile() {
    // Function disabled - no action
    return;
}

// ================= NOTIFICATION FUNCTIONS =================
// Notifikasi dokumen yang perlu di-revision (revision)
let notifiedPRs = new Set();
let notificationContainer = null;
let isNotificationVisible = false;

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    const count = notifiedPRs.size;
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
    
    if (notifiedPRs.size === 0) {
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
            <h3 class="font-semibold text-gray-800">Notifications (${notifiedPRs.size})</h3>
        </div>
        <div class="max-h-80 overflow-y-auto">
    `;
    
    const notificationData = JSON.parse(localStorage.getItem('notificationData') || '{}');
    
    notifiedPRs.forEach(prNumber => {
        const data = notificationData[prNumber] || {};
        const submissionDate = data.submissionDate ? new Date(data.submissionDate).toLocaleDateString() : '-';
        
        content += `
            <div class="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900">${data.purchaseRequestNo || prNumber}</div>
                        <div class="text-xs text-gray-600 mt-1">${data.requesterName || 'Unknown'} - ${data.departmentName || 'Unknown'}</div>
                        <div class="text-xs text-gray-500 mt-1">Submitted: ${submissionDate}</div>
                        <div class="inline-block mt-1">
                            <span class="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">${data.status || 'Revision'}</span>
                        </div>
                    </div>
                    <button onclick="removeNotification('${prNumber}')" class="ml-2 text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    content += '</div>';
    notificationContainer.innerHTML = content;
}

function showNotification(message, prNumber) {
    const notificationData = JSON.parse(localStorage.getItem('notificationData') || '{}');
    const data = {
        purchaseRequestNo: prNumber,
        requesterName: message.split('-')[1] || 'Unknown',
        departmentName: message.split('-')[2] || 'Unknown',
        submissionDate: message.split('-')[3] || '-',
        status: message.split('-')[4] || 'Revision'
    };
    notificationData[prNumber] = data;
    localStorage.setItem('notificationData', JSON.stringify(notificationData));
    
    notifiedPRs.add(prNumber);
    updateNotificationBadge();
    
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

function removeNotification(prNumber) {
    const notificationData = JSON.parse(localStorage.getItem('notificationData') || '{}');
    delete notificationData[prNumber];
    localStorage.setItem('notificationData', JSON.stringify(notificationData));
    
    notifiedPRs.delete(prNumber);
    updateNotificationBadge();
    
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

// Polling untuk dokumen yang perlu di-revision
async function pollRevisionDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        const response = await fetch(`${BASE_URL}/api/pr/dashboard/revision?filterType=revision&userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        const docs = data.data || [];
        let newPRFound = false;
        docs.forEach(doc => {
            if (!notifiedPRs.has(doc.purchaseRequestNo)) {
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.purchaseRequestNo}-${doc.requesterName}-${doc.departmentName}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.purchaseRequestNo);
                newPRFound = true;
            }
        });
        // Play sound jika ada dokumen baru
        if (newPRFound) {
            try {
                // Only play if user has interacted with the page
                if (document.hasInteracted) {
                    const audio = new Audio('../../../../components/shared/tones.mp3');
                    audio.volume = 0.5; // Set volume to 50%
                    audio.play().then(() => {
                        console.log('Notification sound played successfully');
                    }).catch(e => {
                        console.warn('Failed to play notification sound:', e);
                    });
                } else {
                    console.log('User has not interacted with page yet, cannot play audio');
                }
            } catch (e) {
                console.warn('Failed to play notification sound:', e);
            }
        }
    } catch (e) {
        console.warn('Error polling revision docs:', e);
    }
}

// Polling untuk dokumen yang sudah prepared
async function pollPreparedDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        const response = await fetch(`${BASE_URL}/api/pr/dashboard/revision?filterType=prepared&userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        const preparedPRs = new Set((data.data || []).map(doc => doc.purchaseRequestNo));
        // Hapus notifikasi untuk PR yang sudah prepared
        notifiedPRs.forEach(prNumber => {
            if (preparedPRs.has(prNumber)) {
                removeNotification(prNumber);
            }
        });
    } catch (e) {
        console.warn('Error polling prepared docs:', e);
    }
}

// Polling interval (setiap 10 detik)
setInterval(() => {
    pollRevisionDocs();
    pollPreparedDocs();
}, 10000);

// Jalankan polling pertama kali saat halaman dimuat
pollRevisionDocs();
pollPreparedDocs();
updateNotificationBadge();

// Event click pada bell untuk toggle notifikasi panel
const bell = document.getElementById('notificationBell');
if (bell) {
    bell.addEventListener('click', function() {
        toggleNotificationPanel();
    });
}

// Tutup panel jika klik di luar
document.addEventListener('click', function(event) {
    if (notificationContainer && !notificationContainer.contains(event.target) && !bell.contains(event.target)) {
        hideNotificationPanel();
    }
});

// Function to handle search input
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    currentSearchTerm = searchInput ? searchInput.value.trim() : '';
    currentSearchType = document.getElementById('searchType').value;
    loadDashboard();
}

// Function to redirect to revision page with purchase request ID
function detailDoc(prId, prType) {
    window.location.href = `../../../approval/revision/purchaseRequest/revisionPR.html?pr-id=${prId}&pr-type=${prType}&tab=${currentTab}`;
}

// Load user profile information
function loadUserProfileInfo() {
    const userStr = localStorage.getItem('loggedInUser');
    if (!userStr) return;
    
    try {
        const user = JSON.parse(userStr);
        
        // Update user name display
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay) {
            userNameDisplay.textContent = user.name || 'User';
        }
        
        // Update user avatar if available
        const userAvatar = document.getElementById('dashboardUserIcon');
        if (userAvatar) {
            if (user.profilePicture) {
                userAvatar.src = user.profilePicture;
            } else {
                userAvatar.src = '../../../../image/profil.png'; // Default avatar
            }
        }
    } catch (e) {
        console.error('Error loading user profile info:', e);
    }
}

// Excel export function
function downloadExcel() {
    // Get current filtered data
    const dataToExport = filteredData;
    
    if (!dataToExport || dataToExport.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Get current tab name for the file name
    const statusText = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
    
    // Convert data to worksheet format
    const wsData = dataToExport.map((doc, index) => {
        // Format dates
        const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '';
        const requiredDate = doc.requiredDate ? new Date(doc.requiredDate).toLocaleDateString() : '';
        
        return {
            'Doc Number': (index + 1).toString(),
            'PR Number': doc.purchaseRequestNo || '',
            'Requester': doc.requesterName || '',
            'Department': doc.departmentName || '',
            'Submission Date': submissionDate,
            'Required Date': requiredDate,
            'PO Number': doc.poNumber || '',
            'Status': doc.status || ''
        };
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    
    // Set column widths for better readability
    const columnWidths = [
        { wch: 15 }, // Document Number
        { wch: 20 }, // PR Number
        { wch: 20 }, // Requester
        { wch: 15 }, // Department
        { wch: 15 }, // Submission Date
        { wch: 15 }, // Required Date
        { wch: 15 }, // PO Number
        { wch: 12 }  // Status
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Request Revision');
    
    // Generate the Excel file with current filter in the filename
    const fileName = `purchase_request_revision_${statusText.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

// PDF export function
function downloadPDF() {
    // Get current filtered data
    const dataToExport = filteredData;
    
    if (!dataToExport || dataToExport.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Use the jsPDF library
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get current tab name for the title
    const statusText = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
    
    // Add title with current filter information
    doc.setFontSize(16);
    doc.text(`Purchase Request Revision Report - ${statusText}`, 14, 15);
    
    // Add timestamp
    const now = new Date();
    const timestamp = `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    doc.setFontSize(10);
    doc.text(timestamp, 14, 22);
    
    // Prepare table data
    const tableData = dataToExport.map((doc, index) => {
        return [
            (index + 1).toString(),
            doc.purchaseRequestNo || '',
            doc.requesterName || '',
            doc.departmentName || '',
            doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '',
            doc.requiredDate ? new Date(doc.requiredDate).toLocaleDateString() : '',
            doc.poNumber || '',
            doc.status || ''
        ];
    });
    
    // Define table headers
    let headers = ['Doc Number', 'PR Number', 'Requester', 'Department', 'Submission Date', 'Required Date', 'PO Number', 'Status'];
    
    // Add table with styling
    doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 30,
        styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak'
        },
        columnStyles: {
            0: { cellWidth: 20 },      // Doc Number
            1: { cellWidth: 25 },      // PR Number
            2: { cellWidth: 25 },      // Requester
            3: { cellWidth: 20 },      // Department
            4: { cellWidth: 18 },      // Submission Date
            5: { cellWidth: 18 },      // Required Date
            6: { cellWidth: 15 },      // PO Number
            7: { cellWidth: 15 }       // Status
        },
        headStyles: {
            fillColor: [66, 133, 244],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        }
    });
    
    // Add total count at the bottom
    const finalY = doc.lastAutoTable.finalY || 30;
    doc.setFontSize(10);
    doc.text(`Total Records: ${dataToExport.length}`, 14, finalY + 10);
    
    // Generate PDF file
    const fileName = `purchase_request_revision_${statusText.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

// Navigation functions
function goToMenu() { window.location.href = "../../../../pages/dashboard.html"; }
function logout() { 
    localStorage.removeItem("loggedInUser"); 
    window.location.href = "../../../../pages/login.html"; 
}

// Menu navigation functions
function goToMenuPR() { window.location.href = "../../../../pages/menuPR.html"; }
function goToMenuReim() { window.location.href = "../../../../pages/menuReim.html"; }
function goToMenuCash() { window.location.href = "../../../../pages/menuCash.html"; }
function goToMenuSettle() { window.location.href = "../../../../pages/menuSettle.html"; }

// PR submenu navigation
function goToMenuCheckPR() { window.location.href = "../../dashboardCheck/purchaseRequest/menuPRCheck.html"; }
function goToMenuAcknowPR() { window.location.href = "../../dashboardAcknowledge/purchaseRequest/menuPRAcknow.html"; }
function goToMenuApprovPR() { window.location.href = "../../dashboardApprove/purchaseRequest/menuPRApprove.html"; }
function goToMenuReceivePR() { window.location.href = "../../dashboardReceive/purchaseRequest/menuPRReceive.html"; }
function goToMenuRevisionPR() { window.location.href = "../../dashboardRevision/purchaseRequest/menuPRRevision.html"; }

// Cash submenu navigation
function goToMenuCheckCash() { window.location.href = "../../dashboardCheck/cashAdvance/menuCashCheck.html"; }
function goToMenuAcknowCash() { window.location.href = "../../dashboardAcknowledge/cashAdvance/menuCashAcknow.html"; }
function goToMenuApprovCash() { window.location.href = "../../dashboardApprove/cashAdvance/menuCashApprove.html"; }
function goToMenuReceiveCash() { window.location.href = "../../dashboardReceive/cashAdvance/menuCashReceive.html"; }
function goToMenuRevisionCash() { window.location.href = "../../dashboardRevision/cashAdvance/menuCashRevision.html"; }

// Reimbursement submenu navigation
function goToMenuCheckReim() { window.location.href = "../../dashboardCheck/reimbursement/menuReimCheck.html"; }
function goToMenuAcknowReim() { window.location.href = "../../dashboardAcknowledge/reimbursement/menuReimAcknow.html"; }
function goToMenuApprovReim() { window.location.href = "../../dashboardApprove/reimbursement/menuReimApprove.html"; }
function goToMenuReceiveReim() { window.location.href = "../../dashboardReceive/reimbursement/menuReimReceive.html"; }
function goToMenuRevisionReim() { window.location.href = "../../dashboardRevision/reimbursement/menuReimRevision.html"; }

// Settlement submenu navigation
function goToMenuCheckSettle() { window.location.href = "../../dashboardCheck/settlement/menuSettleCheck.html"; }
function goToMenuAcknowSettle() { window.location.href = "../../dashboardAcknowledge/settlement/menuSettleAcknow.html"; }
function goToMenuApprovSettle() { window.location.href = "../../dashboardApprove/settlement/menuSettleApprove.html"; }
function goToMenuReceiveSettle() { window.location.href = "../../dashboardReceive/settlement/menuSettleReceive.html"; }
function goToMenuRevisionSettle() { window.location.href = "../../dashboardRevision/settlement/menuSettleRevision.html"; }

// Settings navigation
function goToMenuRegist() { window.location.href = "../../../../pages/register.html"; }
function goToMenuUser() { window.location.href = "../../../../pages/dashboard-users.html"; }
function goToMenuRole() { window.location.href = "../../../../pages/dashboard-roles.html"; }

// Approval Decision Report navigation
function goToMenuAPR() { window.location.href = "../../../../decisionReportApproval/dashboardApprove/purchaseRequest/menuPRApprove.html"; }
function goToMenuPO() { window.location.href = "#"; }
function goToMenuBanking() { window.location.href = "#"; }
function goToMenuInvoice() { window.location.href = "#"; }