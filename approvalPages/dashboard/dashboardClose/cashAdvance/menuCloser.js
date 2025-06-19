// Current tab state
let currentTab = 'received'; // Default tab (for closer dashboard)

// Pagination variables
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allCashAdvances = [];


// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the default tab
    switchTab(currentTab);
    
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
        if (currentTab === 'received') {
            url = `${BASE_URL}/api/cash-advance/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=true`;
        } else if (currentTab === 'closed') {
            // For closed tab, we might need a different endpoint or status
            url = `${BASE_URL}/api/cash-advance/dashboard/closed?ApproverId=${userId}&ApproverRole=closer`;
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
        const receivedResponse = await fetch(`${BASE_URL}/api/cash-advance/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const closedResponse = await fetch(`${BASE_URL}/api/cash-advance/dashboard/closed?ApproverId=${userId}&ApproverRole=closer`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const receivedData = receivedResponse.ok ? await receivedResponse.json() : { data: [] };
        const closedData = closedResponse.ok ? await closedResponse.json() : { data: [] };

        const receivedCount = receivedData.data ? receivedData.data.length : 0;
        const closedCount = closedData.data ? closedData.data.length : 0;

        // Update counters - map to existing HTML elements
        document.getElementById("receivedCount").textContent = receivedCount;
        document.getElementById("closedCount").textContent = closedCount;
        
    } catch (error) {
        console.error('Error updating counters:', error);
        
        // Fallback to zero counts
        document.getElementById("receivedCount").textContent = 0;
        document.getElementById("closedCount").textContent = 0;
    }
}

// Function to update table with documents
function updateTable(documents = []) {
    const tableBody = document.getElementById('recentDocs');
    tableBody.innerHTML = '';
    
    filteredData = documents;
    
    if (documents.length === 0) {
        const row = document.createElement('tr');
        const colspan = currentTab === 'closed' ? '8' : '7'; // Account for remarks column
        row.innerHTML = `
            <td colspan="${colspan}" class="p-4 text-center text-gray-500">
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
        
        // Build row HTML based on current tab
        let rowHTML = `
            <td class="p-2">${doc.id ? doc.id.substring(0, 10) : ''}</td>
            <td class="p-2">${doc.cashAdvanceNo || ''}</td>
            <td class="p-2">${doc.requesterName || ''}</td>
            <td class="p-2">${doc.departmentName || ''}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${getStatusClass(doc.status)}">
                    ${doc.status || ''}
                </span>
            </td>`;
        
        // Add remarks column for closed tab
        if (currentTab === 'closed') {
            rowHTML += `<td class="p-2">${doc.remarks || '-'}</td>`;
        }
        
        // Add tools column
        if (currentTab === 'received') {
            rowHTML += `
                <td class="p-2">
                    <button class="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 mr-1" onclick="closeCashAdvance('${doc.id || ''}')">
                        Close
                    </button>
                    <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="detailCash('${doc.id || ''}')">
                        Detail
                    </button>
                </td>`;
        } else {
            rowHTML += `
                <td class="p-2">
                    <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="detailCash('${doc.id || ''}')">
                        Detail
                    </button>
                </td>`;
        }
        
        row.innerHTML = rowHTML;
        
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
    console.log('Switching to tab:', tabName);
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update active tab styling
    document.querySelectorAll('[id$="TabBtn"]').forEach(el => el.classList.remove('tab-active'));
    
    if (tabName === 'received') {
        document.getElementById('receivedTabBtn').classList.add('tab-active');
    } else if (tabName === 'closed') {
        document.getElementById('closedTabBtn').classList.add('tab-active');
    }
    
    // Show/hide remarks column based on tab
    const remarksHeader = document.getElementById('remarksHeader');
    if (remarksHeader) {
        if (tabName === 'closed') {
            remarksHeader.style.display = 'table-cell';
        } else {
            remarksHeader.style.display = 'none';
        }
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
        case 'Received': return 'bg-purple-100 text-purple-800';
        case 'Closed': return 'bg-gray-100 text-gray-800';
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
    switchTab('approved');
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

// Function to redirect to detail page with cash advance ID
function detailCash(caId) {
    window.location.href = `../../../approval/receive/cashAdvance/receiveCash.html?ca-id=${caId}&tab=${currentTab}`;
}

// Function to close cash advance
async function closeCashAdvance(caId) {
    if (!caId) {
        alert('Invalid cash advance ID');
        return;
    }
    
    const remarks = prompt('Please enter closing remarks (optional):');
    if (remarks === null) return; // User cancelled
    
    try {
        const response = await fetch(`${BASE_URL}/api/cash-advance/close/${caId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify({
                remarks: remarks || '',
                closerId: getUserId()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status) {
            alert('Cash advance closed successfully!');
            // Reload dashboard to reflect changes
            loadDashboard();
        } else {
            alert(result.message || 'Failed to close cash advance');
        }
        
    } catch (error) {
        console.error('Error closing cash advance:', error);
        alert('Failed to close cash advance. Please try again.');
    }
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
        ['ID', 'Cash Advance No', 'Requester', 'Department', 'Submission Date', 'Status']
    ];
    
    filteredData.forEach(doc => {
        worksheetData.push([
            doc.id ? doc.id.substring(0, 10) : '',
            doc.cashAdvanceNo || '',
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
    XLSX.utils.book_append_sheet(wb, ws, 'Cash Advances');
    
    // Save file
    XLSX.writeFile(wb, 'Cash_Advances_Approve.xlsx');
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
            doc.cashAdvanceNo || '',
            doc.requesterName || '',
            doc.departmentName || '',
            doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '',
            doc.status || ''
        ]);
    });
    
    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text('Cash Advances Approve Report', 14, 16);
    doc.autoTable({
        head: [['ID', 'Cash Advance No', 'Requester', 'Department', 'Submission Date', 'Status']],
        body: docData,
        startY: 20
    });
    
    // Save file
    doc.save('Cash_Advances_Approve.pdf');
} 