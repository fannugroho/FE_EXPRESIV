// Current tab state
let currentTab = 'approved'; // Default tab (this maps to first status in receive flow)

// Pagination variables
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allCashAdvances = [];


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
        console.log('Starting loadDashboard with tab:', currentTab);
        
        // Get user ID for approver ID
        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }
        console.log('User ID:', userId);

        let url;
        
        // Build URL based on current tab
        if (currentTab === 'approved') {
            url = `${BASE_URL}/api/cash-advance/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=false`;
        } else if (currentTab === 'received') {
            url = `${BASE_URL}/api/cash-advance/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=true`;
        } else if (currentTab === 'rejected') {
            url = `${BASE_URL}/api/cash-advance/dashboard/rejected?ApproverId=${userId}&ApproverRole=received`;
        }
        
        // Tambahkan parameter untuk memastikan data requester disertakan
        url += '&includeRequester=true';

        console.log('Fetching dashboard data from:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });

        console.log('API response status:', response.status);
        
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            // Tetap lanjutkan eksekusi untuk menampilkan UI kosong
        }

        let documents = [];
        try {
            const result = await response.json();
            console.log('Dashboard API response:', result);
            if (result.status && result.data) {
                documents = result.data;
                
                // Log struktur data untuk debugging
                if (documents.length > 0) {
                    console.log('Sample document structure:', JSON.stringify(documents[0], null, 2));
                    console.log('Requester name field:', documents[0].requesterName);
                    
                    // Check for alternative field names
                    console.log('Possible requester field names:');
                    for (const key in documents[0]) {
                        if (key.toLowerCase().includes('requester') || 
                            key.toLowerCase().includes('user') || 
                            key.toLowerCase().includes('name') ||
                            key.toLowerCase().includes('employee')) {
                            console.log(`- ${key}: ${documents[0][key]}`);
                        }
                    }
                    
                    // Cek apakah ada nested objects yang mungkin berisi informasi requester
                    for (const key in documents[0]) {
                        if (typeof documents[0][key] === 'object' && documents[0][key] !== null) {
                            console.log(`Nested object in ${key}:`, JSON.stringify(documents[0][key], null, 2));
                        }
                    }
                }
            }
        } catch (jsonError) {
            console.error('Error parsing JSON:', jsonError);
        }
        
        // Update counters (tangkap error jika terjadi)
        try {
            await updateCounters(userId);
        } catch (counterError) {
            console.error('Error updating counters:', counterError);
        }
        
        // Update the table with filtered documents
        console.log('Updating table with documents:', documents.length);
        updateTable(documents);
        
        // Update pagination info
        updatePaginationInfo(documents.length);
        
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
        const approvedResponse = await fetch(`${BASE_URL}/api/cash-advance/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const receivedResponse = await fetch(`${BASE_URL}/api/cash-advance/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const rejectedResponse = await fetch(`${BASE_URL}/api/cash-advance/dashboard/rejected?ApproverId=${userId}&ApproverRole=received`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const approvedData = approvedResponse.ok ? await approvedResponse.json() : { data: [] };
        const receivedData = receivedResponse.ok ? await receivedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };

        const approvedCount = approvedData.data ? approvedData.data.length : 0;
        const receivedCount = receivedData.data ? receivedData.data.length : 0;
        const rejectedCount = rejectedData.data ? rejectedData.data.length : 0;
        const totalCount = approvedCount + receivedCount + rejectedCount;

        // Update counters - map to existing HTML elements
        document.getElementById("totalCount").textContent = totalCount;
        document.getElementById("approvedCount").textContent = approvedCount;
        document.getElementById("receivedCount").textContent = receivedCount;
        document.getElementById("rejectedCount").textContent = rejectedCount;
        
    } catch (error) {
        console.error('Error updating counters:', error);
        
        // Fallback to zero counts
        document.getElementById("totalCount").textContent = 0;
        document.getElementById("approvedCount").textContent = 0;
        document.getElementById("receivedCount").textContent = 0;
        document.getElementById("rejectedCount").textContent = 0;
    }
}

// Function to update table with documents
function updateTable(documents = []) {
    try {
        const tableBody = document.getElementById('recentDocs');
        if (!tableBody) {
            console.error('Element with ID "recentDocs" not found');
            return;
        }
        
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
        
        paginatedDocs.forEach(doc => {
            try {
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
                
                // Coba berbagai kemungkinan field untuk requester name
                let requesterName = '';
                
                // Cek field langsung
                if (doc.requesterName) requesterName = doc.requesterName;
                else if (doc.userName) requesterName = doc.userName;
                else if (doc.fullName) requesterName = doc.fullName;
                else if (doc.employeeName) requesterName = doc.employeeName;
                else if (doc.requester) {
                    // Cek jika requester adalah string atau objek
                    if (typeof doc.requester === 'string') {
                        requesterName = doc.requester;
                    } else if (typeof doc.requester === 'object' && doc.requester !== null) {
                        // Cek jika objek requester memiliki properti name
                        requesterName = doc.requester.name || doc.requester.fullName || doc.requester.userName || '';
                    }
                }
                else if (doc.employee) {
                    // Cek jika employee adalah string atau objek
                    if (typeof doc.employee === 'string') {
                        requesterName = doc.employee;
                    } else if (typeof doc.employee === 'object' && doc.employee !== null) {
                        // Cek jika objek employee memiliki properti name
                        requesterName = doc.employee.name || doc.employee.fullName || doc.employee.userName || '';
                    }
                }
                else if (doc.user) {
                    // Cek jika user adalah string atau objek
                    if (typeof doc.user === 'string') {
                        requesterName = doc.user;
                    } else if (typeof doc.user === 'object' && doc.user !== null) {
                        // Cek jika objek user memiliki properti name
                        requesterName = doc.user.name || doc.user.fullName || doc.user.userName || '';
                    }
                }
                
                // Cek jika ada objek approval yang berisi informasi requester
                if (!requesterName && doc.approval && typeof doc.approval === 'object') {
                    requesterName = doc.approval.requesterName || doc.approval.preparedByName || '';
                }
                
                // Cek jika ada objek cashAdvance yang berisi informasi requester
                if (!requesterName && doc.cashAdvance && typeof doc.cashAdvance === 'object') {
                    requesterName = doc.cashAdvance.requesterName || doc.cashAdvance.employeeName || '';
                }
                
                // Log untuk debugging
                console.log('Document ID:', doc.id, 'Requester Name:', requesterName, 'Full doc:', doc);
                
                // Jika requesterName masih kosong, tampilkan "Unknown"
                if (!requesterName) {
                    requesterName = "Unknown";
                }
                
                row.innerHTML = `
                    <td class="p-2">${doc.id ? doc.id.substring(0, 10) : ''}</td>
                    <td class="p-2">${doc.cashAdvanceNo || ''}</td>
                    <td class="p-2">${requesterName}</td>
                    <td class="p-2">${doc.departmentName || ''}</td>
                    <td class="p-2">${formattedDate}</td>
                    <td class="p-2">
                        <span class="px-2 py-1 rounded-full text-xs ${getStatusClass(doc.status)}">
                            ${doc.status || ''}
                        </span>
                    </td>
                    <td class="p-2">
                        <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="detailCash('${doc.id || ''}')">
                            Detail
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            } catch (rowError) {
                console.error('Error creating table row:', rowError);
            }
        });
    } catch (error) {
        console.error('Error updating table:', error);
    }
}

// Function to update pagination info
function updatePaginationInfo(totalItems) {
    try {
        const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        
        const startItemEl = document.getElementById('startItem');
        const endItemEl = document.getElementById('endItem');
        const totalItemsEl = document.getElementById('totalItems');
        
        if (startItemEl) startItemEl.textContent = startItem;
        if (endItemEl) endItemEl.textContent = endItem;
        if (totalItemsEl) totalItemsEl.textContent = totalItems;
        
        // Update pagination buttons
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        const currentPageEl = document.getElementById('currentPage');
        
        if (prevButton) prevButton.classList.toggle('disabled', currentPage <= 1);
        if (nextButton) nextButton.classList.toggle('disabled', currentPage >= totalPages);
        if (currentPageEl) currentPageEl.textContent = currentPage;
    } catch (error) {
        console.error('Error updating pagination info:', error);
    }
}

// Function to switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update active tab styling
    document.querySelectorAll('.tab-active').forEach(el => el.classList.remove('tab-active'));
    
    if (tabName === 'approved') {
        document.getElementById('approvedTabBtn').classList.add('tab-active');
    } else if (tabName === 'received') {
        document.getElementById('receivedTabBtn').classList.add('tab-active');
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
    
    doc.text('Cash Advances Receive Report', 14, 16);
    doc.autoTable({
        head: [['ID', 'Cash Advance No', 'Requester', 'Department', 'Submission Date', 'Status']],
        body: docData,
        startY: 20
    });
    
    // Save file
    doc.save('Cash_Advances_Receive.pdf');
}

// Navigation functions for revision menus
function goToMenuRevisionPR() { window.location.href = "../../dashboardRevision/purchaseRequest/menuPRRevision.html"; }
function goToMenuRevisionCash() { window.location.href = "../../dashboardRevision/cashAdvance/menuCashRevision.html"; }
function goToMenuRevisionReim() { window.location.href = "../../dashboardRevision/reimbursement/menuReimRevision.html"; }
function goToMenuRevisionSettle() { window.location.href = "../../dashboardRevision/settlement/menuSettleRevision.html"; } 