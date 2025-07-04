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
        
        // Build URL based on current tab using the correct endpoint from CashAdvanceController
        if (currentTab === 'received') {
            // For received tab, show documents that need to be closed (Personal Loan with Received status)
            url = `${BASE_URL}/api/cash-advance/dashboard/approval?approverId=${userId}&approverRole=received&isApproved=true`;
        } else if (currentTab === 'closed') {
            // For closed tab, show documents that have been closed
            url = `${BASE_URL}/api/cash-advance/dashboard/approval?approverId=${userId}&approverRole=closed&isApproved=true`;
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
            let documents = result.data;
            
            // Filter documents based on current tab requirements
            if (currentTab === 'received') {
                // Only show Personal Loan transactions that are received (ready to be closed)
                documents = documents.filter(doc => 
                    doc.transactionType === 'Personal Loan' && 
                    doc.status === 'Received'
                );
            } else if (currentTab === 'closed') {
                // Show closed documents
                documents = documents.filter(doc => doc.status === 'Closed');
            }
            
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
        // Fetch counts for each status using the correct endpoint
        const receivedResponse = await fetch(`${BASE_URL}/api/cash-advance/dashboard/approval?approverId=${userId}&approverRole=received&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        
        const closedResponse = await fetch(`${BASE_URL}/api/cash-advance/dashboard/approval?approverId=${userId}&approverRole=closed&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const receivedData = receivedResponse.ok ? await receivedResponse.json() : { data: [] };
        const closedData = closedResponse.ok ? await closedResponse.json() : { data: [] };

        // Filter received data for Personal Loan transactions only
        const receivedCashAdvances = receivedData.data ? receivedData.data.filter(doc => 
            doc.transactionType === 'Personal Loan' && doc.status === 'Received'
        ) : [];
        
        // Filter closed data
        const closedCashAdvances = closedData.data ? closedData.data.filter(doc => 
            doc.status === 'Closed'
        ) : [];

        const receivedCount = receivedCashAdvances.length;
        const closedCount = closedCashAdvances.length;

        // Update counters - check if elements exist before setting textContent
        const receivedCountElement = document.getElementById("receivedCount");
        const closedCountElement = document.getElementById("closedCount");
        
        if (receivedCountElement) {
            receivedCountElement.textContent = receivedCount;
        }
        if (closedCountElement) {
            closedCountElement.textContent = closedCount;
        }
        
    } catch (error) {
        console.error('Error updating counters:', error);
        
        // Fallback to zero counts
        const receivedCountElement = document.getElementById("receivedCount");
        const closedCountElement = document.getElementById("closedCount");
        
        if (receivedCountElement) {
            receivedCountElement.textContent = 0;
        }
        if (closedCountElement) {
            closedCountElement.textContent = 0;
        }
    }
}

// Function to update table with documents
function updateTable(documents = []) {
    const tableBody = document.getElementById('recentDocs');
    if (!tableBody) {
        console.error('Table body element "recentDocs" not found');
        return;
    }
    
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
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    // Check if pagination info element exists
    const pageInfoElement = document.getElementById('pageInfo');
    if (pageInfoElement) {
        pageInfoElement.textContent = `${startItem}-${endItem} of ${totalItems}`;
    } else {
        console.warn('Pagination info element "pageInfo" not found');
    }
    
    // Update button states - check if elements exist
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    }
}

// Function to switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update active tab styling
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('bg-blue-500', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    const activeTab = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    if (activeTab) {
        activeTab.classList.remove('bg-gray-200', 'text-gray-700');
        activeTab.classList.add('bg-blue-500', 'text-white');
    }
    
    // Load dashboard data for new tab
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
    switchTab('closed');
}

// Navigation functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

function toggleSubMenu(menuId) {
    const subMenu = document.getElementById(menuId);
    if (subMenu) {
        subMenu.classList.toggle("hidden");
    }
}



// Function to redirect to detail page with cash advance ID
function detailCash(caId) {
    window.location.href = `../../../approval/close/cashAdvance/closeCash.html?ca-id=${caId}&tab=${currentTab}`;
}

// Function to close cash advance using the new status update API
async function closeCashAdvance(caId) {
    if (!caId) {
        alert('Invalid cash advance ID');
        return;
    }
    
    // Show confirmation dialog
    const result = await Swal.fire({
        title: 'Confirm Close',
        text: 'Are you sure you want to close this Cash Advance?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Close',
        cancelButtonText: 'Cancel'
    });
    
    if (!result.isConfirmed) return;
    
    try {
        const userId = getUserId();
        if (!userId) {
            alert('Unable to get user ID from token. Please login again.');
            return;
        }
        
        // Show loading
        Swal.fire({
            title: 'Closing Cash Advance...',
            text: 'Please wait while we process your request.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Use the new status update API
        const response = await fetch(`${BASE_URL}/api/cash-advance/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify({
                id: caId,
                UserId: userId,
                StatusAt: "Close",
                Action: "close",
                Remarks: ''
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        // const result = await response.json();
        
        console.log(result);
        if (result.status !== false) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Cash advance closed successfully!',
                timer: 2000,
                showConfirmButton: false
            });
            // Reload dashboard to reflect changes
            loadDashboard();
        } else {
            throw new Error(result.message || 'Failed to close cash advance');
        }
        
    } catch (error) {
        console.error('Error closing cash advance:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Failed to close cash advance. Please try again.'
        });
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
        ['ID', 'Cash Advance No', 'Requester', 'Department', 'Submission Date', 'Status', 'Transaction Type']
    ];
    
    filteredData.forEach(doc => {
        worksheetData.push([
            doc.id ? doc.id.substring(0, 10) : '',
            doc.cashAdvanceNo || '',
            doc.requesterName || '',
            doc.departmentName || '',
            doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '',
            doc.status || '',
            doc.transactionType || ''
        ]);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cash Advances Close');
    
    // Save file
    XLSX.writeFile(wb, 'Cash_Advances_Close.xlsx');
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
            doc.status || '',
            doc.transactionType || ''
        ]);
    });
    
    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text('Cash Advances Close Report', 14, 16);
    doc.autoTable({
        head: [['ID', 'Cash Advance No', 'Requester', 'Department', 'Submission Date', 'Status', 'Transaction Type']],
        body: docData,
        startY: 20
    });
    
    // Save file
    doc.save('Cash_Advances_Close.pdf');
} 