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
        const revisionResponse = await fetch(`${BASE_URL}/api/pr/dashboard/revision?filterType=revision`, {
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
    
    // Show/hide remarks column based on tab
    const remarksHeader = document.getElementById('remarksHeader');
    if (remarksHeader) {
        remarksHeader.style.display = currentTab === 'revision' ? 'table-cell' : 'none';
    }
    
    paginatedDocs.forEach(doc => {
        const row = document.createElement('tr');
        row.classList.add('border-t', 'hover:bg-gray-100');
        
        // Format dates
        const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
        const requiredDate = doc.requiredDate ? new Date(doc.requiredDate).toLocaleDateString() : '-';
        
        // Check if fields are longer than 15 characters and apply scrollable class
        const docNumberClass = doc.id && doc.id.toString().length > 15 ? 'scrollable-cell' : '';
        const prNumberClass = doc.purchaseRequestNo && doc.purchaseRequestNo.length > 15 ? 'scrollable-cell' : '';
        const requesterNameClass = doc.requesterName && doc.requesterName.length > 15 ? 'scrollable-cell' : '';
        const departmentClass = doc.departmentName && doc.departmentName.length > 15 ? 'scrollable-cell' : '';
        const poNumberClass = doc.poNumber && doc.poNumber.length > 15 ? 'scrollable-cell' : '';
        const remarksClass = doc.remarks && doc.remarks.length > 15 ? 'scrollable-cell' : '';
        
        // Build row HTML with scrollable cells
        row.innerHTML = `
            <td class="p-2">
                <div class="${docNumberClass}">${doc.id || '-'}</div>
            </td>
            <td class="p-2">
                <div class="${prNumberClass}">${doc.purchaseRequestNo || '-'}</div>
            </td>
            <td class="p-2">
                <div class="${requesterNameClass}">${doc.requesterName || '-'}</div>
            </td>
            <td class="p-2">
                <div class="${departmentClass}">${doc.departmentName || '-'}</div>
            </td>
            <td class="p-2">${submissionDate}</td>
            <td class="p-2">${requiredDate}</td>
            <td class="p-2">
                <div class="${poNumberClass}">${doc.poNumber || '-'}</div>
            </td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(doc.status)}">
                    ${doc.status || '-'}
                </span>
            </td>
            ${currentTab === 'revision' ? 
                `<td class="p-2">
                    <div class="${remarksClass}">${doc.remarks || '-'}</div>
                </td>` : ''}
            <td class="p-2">
                <button onclick="detailDoc('${doc.id}', '${doc.prType}')" class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs">
                    <i class="fas fa-eye mr-1"></i>View
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
    window.location.href = "../../../../pages/profil.html";
}

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
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare data for worksheet
    const wsData = dataToExport.map(doc => ({
        'Doc Number': doc.id,
        'PR Number': doc.purchaseRequestNo || '',
        'Requester': doc.requesterName || '',
        'Department': doc.departmentName || '',
        'Submission Date': doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '',
        'Required Date': doc.requiredDate ? new Date(doc.requiredDate).toLocaleDateString() : '',
        'PO Number': doc.poNumber || '',
        'Status': doc.status || '',
        'Remarks': doc.remarks || ''
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Request Revision');
    
    // Generate Excel file
    const fileName = `purchase_request_${currentTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(`Purchase Request ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} Report`, 14, 15);
    
    // Prepare table data
    const tableData = dataToExport.map(doc => {
        let row = [
            doc.id ? doc.id.toString().substring(0, 10) : '',
            doc.purchaseRequestNo || '',
            doc.requesterName || '',
            doc.departmentName || '',
            doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '',
            doc.requiredDate ? new Date(doc.requiredDate).toLocaleDateString() : '',
            doc.poNumber || '',
            doc.status || ''
        ];
        
        if (currentTab === 'revision') {
            row.push(doc.remarks || '');
        }
        
        return row;
    });
    
    // Define table headers based on current tab
    let headers = ['Doc Number', 'PR Number', 'Requester', 'Department', 'Submission Date', 'Required Date', 'PO Number', 'Status'];
    if (currentTab === 'revision') {
        headers.push('Remarks');
    }
    
    // Add table to PDF
    doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 25,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [66, 133, 244],
            textColor: 255
        }
    });
    
    // Generate PDF file
    const fileName = `purchase_request_${currentTab}_${new Date().toISOString().split('T')[0]}.pdf`;
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