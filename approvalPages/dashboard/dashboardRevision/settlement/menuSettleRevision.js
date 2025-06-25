// Current tab state
let currentTab = 'revision'; // Default tab

// Pagination variables
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allSettlements = [];

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    loadUserProfileInfo();
    
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
        const revisionResponse = await fetch(`${BASE_URL}/api/settlements/dashboard/revision?filterType=revision`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const preparedResponse = await fetch(`${BASE_URL}/api/settlements/dashboard/revision?filterType=prepared&userId=${userId}`, {
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
        let url;
        
        // Build URL based on current tab
        if (currentTab === 'revision') {
            url = `${BASE_URL}/api/settlements/dashboard/revision?filterType=revision`;
        } else if (currentTab === 'prepared') {
            url = `${BASE_URL}/api/settlements/dashboard/revision?filterType=prepared&userId=${userId}`;
        }

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
            <td colspan="8" class="p-4 text-center text-gray-500">
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
    
    // Show/hide remarks column based on tab
    const remarksHeader = document.getElementById('remarksHeader');
    if (remarksHeader) {
        remarksHeader.style.display = currentTab === 'revision' ? 'table-cell' : 'none';
    }
    
    paginatedDocs.forEach(doc => {
        const row = document.createElement('tr');
        row.classList.add('border-t', 'hover:bg-gray-100');
        
        // Format submission date
        const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
        
        // Create row HTML
        let rowHTML = `
            <td class="p-2">${doc.id ? doc.id.toString().substring(0, 10) : ''}</td>
            <td class="p-2">${doc.settlementNumber || '-'}</td>
            <td class="p-2">${doc.requesterName || '-'}</td>
            <td class="p-2">${doc.departmentName || '-'}</td>
            <td class="p-2">${submissionDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${getStatusClass(doc.status)}">
                    ${doc.status || ''}
                </span>
            </td>`;
            
        // Add remarks column if in revision tab
        if (currentTab === 'revision') {
            rowHTML += `<td class="p-2">${doc.remarks || '-'}</td>`;
        }
        
        // Add tools column
        rowHTML += `
            <td class="p-2">
                <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="reviseSettle('${doc.id || ''}')">
                    Detail
                </button>
            </td>
        `;
        
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
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update active tab styling
    document.querySelectorAll('.tab-active').forEach(el => el.classList.remove('tab-active'));
    
    if (tabName === 'revision') {
        document.getElementById('revisionTabBtn').classList.add('tab-active');
    } else if (tabName === 'prepared') {
        document.getElementById('preparedTabBtn').classList.add('tab-active');
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

// Function to redirect to revision page with settlement ID
function reviseSettle(settleId) {
    window.location.href = `../../../approval/revision/settlement/revisionSettle.html?settle-id=${settleId}&tab=${currentTab}`;
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
    XLSX.writeFile(wb, 'Settlements_Approve.xlsx');
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
    
    doc.text('Settlements Approve Report', 14, 16);
    doc.autoTable({
        head: [['ID', 'Settlement No', 'Requester', 'Department', 'Submission Date', 'Status']],
        body: docData,
        startY: 20
    });
    
    // Save file
    doc.save('Settlements_Approve.pdf');
}
