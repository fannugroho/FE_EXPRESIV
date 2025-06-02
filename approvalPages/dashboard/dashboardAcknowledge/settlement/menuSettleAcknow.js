// Current tab state
let currentTab = 'checked'; // Default tab

// Pagination variables
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allSettlements = [];

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    
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
        // Get user ID for approver ID
        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }

        let url;
        
        // Build URL based on current tab
        if (currentTab === 'checked') {
            url = `${BASE_URL}/api/settlements/dashboard/approval?ApproverId=${userId}&ApproverRole=acknowledged&isApproved=false`;
        } else if (currentTab === 'acknowledged') {
            url = `${BASE_URL}/api/settlements/dashboard/approval?ApproverId=${userId}&ApproverRole=acknowledged&isApproved=true`;
        } else if (currentTab === 'rejected') {
            url = `${BASE_URL}/api/settlements/dashboard/rejected?ApproverId=${userId}&ApproverRole=acknowledged`;
        }

        console.log('Fetching dashboard data from:', url);

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
        console.log('Dashboard API response:', result);

        if (result.status && result.data) {
            const documents = result.data;
            
            // Update counters by fetching all statuses
            await updateCounters(userId);
            
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
        console.error('Error loading dashboard:', error);
        alert('Failed to load dashboard data. Please try again.');
        
        // Fallback to empty state
        updateTable([]);
        updatePaginationInfo(0);
    }
}

// Function to update counters by fetching data for all statuses
async function updateCounters(userId) {
    try {
        // Fetch counts for each status using new API endpoints
        const checkedResponse = await fetch(`${BASE_URL}/api/settlements/dashboard/approval?ApproverId=${userId}&ApproverRole=acknowledged&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const acknowledgedResponse = await fetch(`${BASE_URL}/api/settlements/dashboard/approval?ApproverId=${userId}&ApproverRole=acknowledged&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const rejectedResponse = await fetch(`${BASE_URL}/api/settlements/dashboard/rejected?ApproverId=${userId}&ApproverRole=acknowledged`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const checkedData = checkedResponse.ok ? await checkedResponse.json() : { data: [] };
        const acknowledgedData = acknowledgedResponse.ok ? await acknowledgedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };

        const checkedCount = checkedData.data ? checkedData.data.length : 0;
        const acknowledgedCount = acknowledgedData.data ? acknowledgedData.data.length : 0;
        const rejectedCount = rejectedData.data ? rejectedData.data.length : 0;
        const totalCount = checkedCount + acknowledgedCount + rejectedCount;

        // Update counters
        document.getElementById("totalCount").textContent = totalCount;
        document.getElementById("checkedCount").textContent = checkedCount;
        document.getElementById("acknowledgedCount").textContent = acknowledgedCount;
        document.getElementById("rejectedCount").textContent = rejectedCount;
        
    } catch (error) {
        console.error('Error updating counters:', error);
        
        // Fallback to zero counts
        document.getElementById("totalCount").textContent = 0;
        document.getElementById("checkedCount").textContent = 0;
        document.getElementById("acknowledgedCount").textContent = 0;
        document.getElementById("rejectedCount").textContent = 0;
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
            <td colspan="7" class="p-4 text-center text-gray-500">
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
    
    paginatedDocs.forEach(doc => {
        const row = document.createElement('tr');
        row.classList.add('border-t', 'hover:bg-gray-100');
        
        // Format submission date
        let formattedDate = '';
        if (doc.submissionDate) {
            const date = new Date(doc.submissionDate);
            if (!isNaN(date)) {
                formattedDate = date.toLocaleDateString();
            }
        }
        
        row.innerHTML = `
            <td class="p-2">${doc.id ? doc.id.substring(0, 10) : ''}</td>
            <td class="p-2">${doc.settlementNumber || ''}</td>
            <td class="p-2">${doc.requesterName || ''}</td>
            <td class="p-2">${doc.departmentName || ''}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${getStatusClass(doc.status)}">
                    ${doc.status || ''}
                </span>
            </td>
            <td class="p-2">
                <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="detailSettle('${doc.id || ''}')">
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
    
    if (tabName === 'checked') {
        document.getElementById('checkedTabBtn').classList.add('tab-active');
    } else if (tabName === 'acknowledged') {
        document.getElementById('acknowledgeTabBtn').classList.add('tab-active');
    } else if (tabName === 'rejected') {
        document.getElementById('rejectedTabBtn').classList.add('tab-active');
    }
    
    // Reload dashboard with the new filter
    loadDashboard();
}

// Helper function to get status styling
function getStatusClass(status) {
    switch(status) {
        case 'Prepared': return 'bg-yellow-100 text-yellow-800';
        case 'Checked': return 'bg-green-100 text-green-800';
        case 'Acknowledged': return 'bg-blue-100 text-blue-800';
        case 'Approved': return 'bg-indigo-100 text-indigo-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        case 'Reject': return 'bg-red-100 text-red-800';
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

// Function to navigate to total documents page
function goToTotalDocs() {
    switchTab('checked');
}

// Navigation functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Function to navigate to user profile page
function goToProfile() {
    window.location.href = "../../../../pages/profil.html";
}

// Function to redirect to detail page with settlement ID
function detailSettle(settleId) {
    window.location.href = `../../../approval/acknowledge/settlement/acknowledgeSettle.html?settle-id=${settleId}&tab=${currentTab}`;
}

// Load user profile information
function loadUserProfileInfo() {
    // Try to get logged in user from localStorage
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    
    if (loggedInUser) {
        // Display user name if available
        if (document.getElementById('userNameDisplay')) {
            document.getElementById('userNameDisplay').textContent = loggedInUser.name || loggedInUser.username || 'User';
        }
        
        // Set user avatar if available, otherwise use default
        if (document.getElementById('dashboardUserIcon')) {
            if (loggedInUser.profilePicture) {
                document.getElementById('dashboardUserIcon').src = loggedInUser.profilePicture;
            } else {
                // Default avatar - can be replaced with actual default image path
                document.getElementById('dashboardUserIcon').src = "../../../../image/default-avatar.png";
            }
        }
    } else {
        // If no user found, set default values
        if (document.getElementById('userNameDisplay')) {
            document.getElementById('userNameDisplay').textContent = 'Guest User';
        }
        if (document.getElementById('dashboardUserIcon')) {
            document.getElementById('dashboardUserIcon').src = "../../../../image/default-avatar.png";
        }
    }
}

// Download as Excel
function downloadExcel() {
    if (filteredData.length === 0) {
        alert('No data available to export.');
        return;
    }
    
    // Create worksheet data
    const worksheetData = [
        ['ID', 'Settlement No', 'Requester', 'Department', 'Submission Date', 'Status']
    ];
    
    filteredData.forEach(doc => {
        worksheetData.push([
            doc.id ? doc.id.substring(0, 10) : '',
            doc.settlementNumber || '',
            doc.requesterName || '',
            doc.departmentName || '',
            doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '',
            doc.status || ''
        ]);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Settlements');
    
    // Save file
    XLSX.writeFile(wb, 'Settlements_Acknowledge.xlsx');
}

// Download as PDF
function downloadPDF() {
    if (filteredData.length === 0) {
        alert('No data available to export.');
        return;
    }
    
    // Create document data
    const docData = [];
    
    filteredData.forEach(doc => {
        docData.push([
            doc.id ? doc.id.substring(0, 10) : '',
            doc.settlementNumber || '',
            doc.requesterName || '',
            doc.departmentName || '',
            doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '',
            doc.status || ''
        ]);
    });
    
    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text('Settlements Acknowledge Report', 14, 16);
    doc.autoTable({
        head: [['ID', 'Settlement No', 'Requester', 'Department', 'Submission Date', 'Status']],
        body: docData,
        startY: 20
    });
    
    // Save file
    doc.save('Settlements_Acknowledge.pdf');
} 