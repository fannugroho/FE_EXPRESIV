function loadDashboard() {
    // Fetch status counts from API
    fetchStatusCounts();
    
    // Set up initial state for tabs and pagination
    setupTabsAndPagination();
    
    // Fetch cash advances from API
    fetchCashAdvances();
}

// Variables for pagination and filtering
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allCashAdvances = [];
let currentTab = 'draft'; // Default tab

// Function to fetch status counts from API
function fetchStatusCounts() {
    const endpoint = "/api/cash-advance/status-counts";
    
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
            // Counts will be updated after fetchCashAdvances runs
        });
}

// Function to fetch cash advances from API
function fetchCashAdvances() {
    const endpoint = "/api/cash-advance";
    
    fetch(`${BASE_URL}${endpoint}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status && data.data) {
                allCashAdvances = data.data;
                // Update counts based on real data
                updateCounts(allCashAdvances);
                switchTab(currentTab); // Apply filtering based on current tab
            } else {
                console.error('API returned an error:', data.message);
                // Use sample data if API fails
                useSampleData();
                switchTab(currentTab);
            }
        })
        .catch(error => {
            console.error('Error fetching cash advances:', error);
            // Use sample data if API fails
            useSampleData();
            switchTab(currentTab);
        });
}

// Function to display cash advances in the table
function displayCashAdvances(cashAdvances) {
    filteredData = cashAdvances;
    updateTable();
    updatePagination();
}

// Function to update the status counts on the page
function updateStatusCounts(data) {
    document.getElementById("totalCount").textContent = data.totalCount || 0;
    document.getElementById("draftCount").textContent = data.draftCount || 0;
    document.getElementById("checkedCount").textContent = data.checkedCount || 0;
    document.getElementById("rejectedCount").textContent = data.rejectedCount || 0;
}

// Set up events for tab switching and pagination
function setupTabsAndPagination() {
    // Tab switching and pagination setup only
    // No checkbox functionality needed
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Navigation functions
function goToMenu() { window.location.href = "../../../../menu.html"; }
function goToMenuPR() { window.location.href = "../../dashboardCheck/purchaseRequest/menuPRCheck.html"; }
function goToMenuCheckPR() { window.location.href = "../../dashboardCheck/purchaseRequest/menuPRCheck.html"; }
function goToMenuAcknowPR() { window.location.href = "../../dashboardAcknowledge/purchaseRequest/menuPRAcknow.html"; }
function goToMenuApprovPR() { window.location.href = "../../dashboardApproval/purchaseRequest/menuPRApprov.html"; }
function goToMenuReceivePR() { window.location.href = "../../dashboardReceive/purchaseRequest/menuPRReceive.html"; }
function goToMenuReim() { window.location.href = "../../dashboardCheck/reimbursement/menuReimCheck.html"; }
function goToMenuCash() { window.location.href = "../../dashboardCheck/cashAdvance/menuCashCheck.html"; }
function goToMenuSettle() { window.location.href = "../../dashboardCheck/settlement/menuSettleCheck.html"; }
function goToMenuAPR() { window.location.href = "../../../../approvalPages/prApproval.html"; }
function goToMenuPO() { window.location.href = "../../../../approvalPages/poApproval.html"; }
function goToMenuBanking() { window.location.href = "../../../../approvalPages/outgoingApproval.html"; }
function goToMenuInvoice() { window.location.href = "../../../../approvalPages/arInvoiceApproval.html"; }
function goToMenuRegist() { window.location.href = "../../../../registerUser.html"; }
function goToMenuUser() { window.location.href = "../../../../userData.html"; }
function goToMenuRole() { window.location.href = "../../../../roleData.html"; }
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "../../../../login.html"; }
function goToTotalDocs() { 
    // Redirect to a page with all documents or just switch to draft as default
    switchTab('draft'); 
}

// Function to redirect to detail page with cash advance ID
function detailCash(cashId) {
    window.location.href = `../../../../detailPages/detailCash.html?ca-id=${cashId}`;
}

// Sample data for testing when API is not available
let sampleData = [];
function generateSampleData() {
    sampleData = [];
    const departments = ["Finance", "HR", "IT", "Marketing", "Operations"];
    const purposes = ["Business Travel", "Office Supplies", "Equipment Purchase", "Team Building", "Client Meeting"];
    
    for (let i = 1; i <= 35; i++) {
        // Assign statuses: 20 Prepared, 10 Checked, 5 Rejected
        let status;
        if (i <= 20) {
            status = 'Prepared';
        } else if (i <= 30) {
            status = 'Checked';
        } else {
            status = 'Rejected';
        }
        
        const randomID = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
        
        sampleData.push({
            id: randomID,
            cashAdvanceNo: `CA-${2000 + i}`,
            requesterName: `User ${i}`,
            departmentName: departments[i % departments.length],
            purpose: purposes[i % purposes.length],
            submissionDate: new Date(2023, 0, i).toISOString(),
            status: status
        });
    }
    return sampleData;
}

// Use sample data when API fails
function useSampleData() {
    allCashAdvances = generateSampleData();
    updateSampleCounts();
}

// Update counts using sample data
function updateSampleCounts() {
    updateCounts(allCashAdvances);
}

// Generic function to update all counts based on current data
function updateCounts(data) {
    const totalCount = data.length;
    const draftCount = data.filter(item => item.status === 'Prepared' || item.status === 'Draft').length;
    const checkedCount = data.filter(item => item.status === 'Checked').length;
    const rejectedCount = data.filter(item => item.status === 'Rejected').length;
    
    document.getElementById("totalCount").textContent = totalCount;
    document.getElementById("draftCount").textContent = draftCount;
    document.getElementById("checkedCount").textContent = checkedCount;
    document.getElementById("rejectedCount").textContent = rejectedCount;
}

// Switch between Prepared and Checked tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('draftTabBtn').classList.remove('tab-active');
    document.getElementById('checkedTabBtn').classList.remove('tab-active');
    document.getElementById('rejectedTabBtn').classList.remove('tab-active');
    
    if (tabName === 'draft') {
        document.getElementById('draftTabBtn').classList.add('tab-active');
    } else if (tabName === 'checked') {
        document.getElementById('checkedTabBtn').classList.add('tab-active');
    } else if (tabName === 'rejected') {
        document.getElementById('rejectedTabBtn').classList.add('tab-active');
    }
    
    // Get the table body for animation effects
    const tableBody = document.getElementById('recentDocs');
    
    // Add fade-out effect
    tableBody.style.opacity = '0';
    tableBody.style.transform = 'translateY(10px)';
    tableBody.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    // Filter the data with a slight delay to allow animation
    setTimeout(() => {
        if (tabName === 'draft') {
            filteredData = allCashAdvances.filter(item => item.status === 'Prepared' || item.status === 'Draft');
        } else if (tabName === 'checked') {
            filteredData = allCashAdvances.filter(item => item.status === 'Checked');
        } else if (tabName === 'rejected') {
            filteredData = allCashAdvances.filter(item => item.status === 'Rejected');
        } else if (tabName === 'all') {
            // Show all documents
            filteredData = [...allCashAdvances];
        }
        
        // Update table and pagination
        updateTable();
        updatePagination();
        
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
        let formattedDate = '';
        if (item.submissionDate) {
            const date = new Date(item.submissionDate);
            if (!isNaN(date)) {
                formattedDate = date.toLocaleDateString();
            }
        }
        
        // Convert Draft to Prepared for display
        const displayStatus = item.status === 'Draft' ? 'Prepared' : item.status;
        
        // Set status class based on status value
        let statusClass = '';
        if (displayStatus === 'Prepared') {
            statusClass = 'bg-yellow-200 text-yellow-800';
        } else if (displayStatus === 'Checked') {
            statusClass = 'bg-green-200 text-green-800';
        } else if (displayStatus === 'Rejected') {
            statusClass = 'bg-red-200 text-red-800';
        }
        
        const row = document.createElement('tr');
        row.classList.add('border-t', 'hover:bg-gray-100');
        
        row.innerHTML = `
            <td class="p-2">${item.id ? item.id.substring(0, 10) : ''}</td>
            <td class="p-2">${item.cashAdvanceNo || ''}</td>
            <td class="p-2">${item.requesterName || ''}</td>
            <td class="p-2">${item.departmentName || ''}</td>
            <td class="p-2">${item.purpose || ''}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${statusClass}">
                    ${displayStatus}
                </span>
            </td>
            <td class="p-2">
                <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="detailCash('${item.id}')">
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
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    
    if (currentPage <= 1) {
        prevButton.classList.add('disabled');
    } else {
        prevButton.classList.remove('disabled');
    }
    
    if (currentPage >= totalPages) {
        nextButton.classList.add('disabled');
    } else {
        nextButton.classList.remove('disabled');
    }
}

// Change page
function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable();
        updatePagination();
    }
}

// Function to download Excel file
function downloadExcel() {
    // Get status text for filename
    const statusText = currentTab === 'draft' ? 'Prepared' : 
                      currentTab === 'checked' ? 'Checked' : 
                      currentTab === 'rejected' ? 'Rejected' : 'All';
    
    // Create worksheet data
    const worksheetData = [
        ['ID', 'Cash Advance No', 'Requester', 'Department', 'Purpose', 'Submission Date', 'Status']
    ];
    
    filteredData.forEach(item => {
        let formattedDate = '';
        if (item.submissionDate) {
            const date = new Date(item.submissionDate);
            if (!isNaN(date)) {
                formattedDate = date.toLocaleDateString();
            }
        }
        
        // Convert Draft to Prepared for display
        const displayStatus = item.status === 'Draft' ? 'Prepared' : item.status;
        
        worksheetData.push([
            item.id ? item.id.substring(0, 10) : '',
            item.cashAdvanceNo || '',
            item.requesterName || '',
            item.departmentName || '',
            item.purpose || '',
            formattedDate,
            displayStatus
        ]);
    });
    
    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cash Advances');
    
    // Save file
    XLSX.writeFile(wb, `Cash_Advances_${statusText}.xlsx`);
}

// Function to download PDF file
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get status text for title
    const statusText = currentTab === 'draft' ? 'Prepared' : 
                      currentTab === 'checked' ? 'Checked' : 
                      currentTab === 'rejected' ? 'Rejected' : 'All';
    
    // Add title
    doc.setFontSize(16);
    doc.text(`Cash Advance ${statusText} Report`, 14, 15);
    
    // Create table data
    const tableData = filteredData.map(item => {
        let formattedDate = '';
        if (item.submissionDate) {
            const date = new Date(item.submissionDate);
            if (!isNaN(date)) {
                formattedDate = date.toLocaleDateString();
            }
        }
        
        // Convert Draft to Prepared for display
        const displayStatus = item.status === 'Draft' ? 'Prepared' : item.status;
        
        return [
            item.id ? item.id.substring(0, 10) : '',
            item.cashAdvanceNo || '',
            item.requesterName || '',
            item.departmentName || '',
            item.purpose || '',
            formattedDate,
            displayStatus
        ];
    });
    
    // Add table to PDF
    doc.autoTable({
        head: [['ID', 'Cash Advance No', 'Requester', 'Department', 'Purpose', 'Submission Date', 'Status']],
        body: tableData,
        startY: 25
    });
    
    // Save file
    doc.save(`Cash_Advances_${statusText}.pdf`);
}

// Initialize the dashboard when the page loads
window.onload = loadDashboard;

document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    setupEventListeners();
    
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
    
    // Set user avatar and name if available
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.name) {
        document.getElementById('userNameDisplay').textContent = userInfo.name;
    }
    if (userInfo.avatar) {
        document.getElementById('dashboardUserIcon').src = userInfo.avatar;
    } else {
        // Default avatar if none is set
        document.getElementById('dashboardUserIcon').src = "../../../../image/default-avatar.png";
    }
});

// Function to navigate to user profile page
function goToProfile() {
    window.location.href = "../../../../pages/profil.html";
} 