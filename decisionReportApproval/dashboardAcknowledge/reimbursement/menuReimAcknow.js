function loadDashboard() {
    // Fetch status counts from API
    fetchStatusCounts();
    
    // Set up initial state for tabs and pagination
    setupTabsAndPagination();
    
    // Fetch reimbursements from API
    fetchReimbursements();
    
    // Set up notification dropdown
    setupNotificationDropdown();
    
    // Load user profile information
    loadUserProfileInfo();
}

// Variables for pagination and filtering
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allReimbursements = [];
let currentTab = 'checked'; // Default tab

// Function to fetch status counts from API
function fetchStatusCounts() {
    const baseUrl = "https://expressiv.idsdev.site";
    const endpoint = "/api/reimbursements/status-counts";
    
    fetch(`${baseUrl}${endpoint}`)
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
    const baseUrl = "https://expressiv.idsdev.site";
    const endpoint = "/api/reimbursements";
    
    fetch(`${baseUrl}${endpoint}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status && data.code === 200) {
                allReimbursements = data.data;
                switchTab(currentTab); // Apply filtering based on current tab
            } else {
                console.error('API returned an error:', data.message);
                // Use sample data if API fails
                useSampleData();
                switchTab(currentTab);
            }
        })
        .catch(error => {
            console.error('Error fetching reimbursements:', error);
            // Use sample data if API fails
            useSampleData();
            switchTab(currentTab);
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
    document.getElementById("totalCount").textContent = data.totalCount || 0;
    document.getElementById("checkedCount").textContent = data.checkedCount || 0;
    document.getElementById("acknowledgeCount").textContent = data.acknowledgeCount || 0;
    document.getElementById("rejectedCount").textContent = data.rejectedCount || 0;
}

// Set up events for tab switching and pagination
function setupTabsAndPagination() {
    // Set up the "select all" checkbox
    document.getElementById('selectAll').addEventListener("change", function() {
        const checkboxes = document.querySelectorAll('#recentDocs input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
}

// Setup notification dropdown functionality
function setupNotificationDropdown() {
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

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Navigation functions
function goToMenu() { window.location.href = "../../../../Menu.html"; }
function goToMenuPR() { window.location.href = "../../../purchaseRequest/menuPR.html"; }
function goToMenuCheckPR() { window.location.href = "../../../dashboardCheck/purchaseRequest/menuPRCheck.html"; }
function goToMenuAcknowPR() { window.location.href = "../../../dashboardAcknowledge/purchaseRequest/menuPRAcknow.html"; }
function goToMenuApprovPR() { window.location.href = "../../../dashboardApprove/purchaseRequest/menuPRApprov.html"; }
function goToMenuReceivePR() { window.location.href = "../../../dashboardReceive/purchaseRequest/menuPRReceive.html"; }

function goToMenuReim() { window.location.href = "../../../reimbursement/menuReim.html"; }
function goToMenuCash() { window.location.href = "../../../cashAdvance/menuCash.html"; }
function goToMenuSettle() { window.location.href = "../../../settlement/menuSettle.html"; }

function goToMenuRegist() { window.location.href = "../../../../pages/register/register.html"; }
function goToMenuUser() { window.location.href = "../../../../pages/register/userList.html"; }
function goToMenuRole() { window.location.href = "../../../../pages/register/roleList.html"; }

function goToMenuAPR() { window.location.href = "../../../../approvalDecisionReport/purchase/APR.html"; }
function goToMenuPO() { window.location.href = "../../../../approvalDecisionReport/purchase/PO.html"; }
function goToMenuBanking() { window.location.href = "../../../../approvalDecisionReport/outgoing/Banking.html"; }
function goToMenuInvoice() { window.location.href = "../../../../approvalDecisionReport/invoice/Invoice.html"; }

function logout() { 
    localStorage.removeItem("loggedInUser"); 
    window.location.href = "../../../../pages/login/login.html"; 
}

// Function to navigate to user profile page
function goToProfile() {
    window.location.href = "../../../../pages/profil.html";
}

function goToDetailReim(reimId) {
    window.location.href = `../../../../detailPages/detailReim.html?reim-id=${reimId}`;
}

// Sample data for testing when API is not available
let sampleData = [];
function generateSampleData() {
    sampleData = [];
    for (let i = 1; i <= 35; i++) {
        let status;
        if (i <= 20) {
            status = 'Checked';
        } else if (i <= 30) {
            status = 'Acknowledge';
        } else {
            status = 'Rejected';
        }
        
        sampleData.push({
            id: i,
            docNumber: `DOC-${1000 + i}`,
            voucherNo: `REIM-${2000 + i}`,
            requesterName: `User ${i}`,
            department: `Department ${(i % 5) + 1}`,
            submissionDate: new Date(2023, 0, i).toISOString(),
            status: status
        });
    }
    return sampleData;
}

// Use sample data when API fails
function useSampleData() {
    allReimbursements = generateSampleData();
    updateSampleCounts();
}

// Update counts using sample data
function updateSampleCounts() {
    const data = generateSampleData();
    document.getElementById("totalCount").textContent = data.length;
    document.getElementById("checkedCount").textContent = data.filter(item => item.status === 'Checked').length;
    document.getElementById("acknowledgeCount").textContent = data.filter(item => item.status === 'Acknowledge').length;
    document.getElementById("rejectedCount").textContent = data.filter(item => item.status === 'Rejected').length;
}

// Switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('checkedTabBtn').classList.remove('tab-active');
    document.getElementById('acknowledgeTabBtn').classList.remove('tab-active');
    if (document.getElementById('rejectedTabBtn')) {
        document.getElementById('rejectedTabBtn').classList.remove('tab-active');
    }
    
    if (tabName === 'checked') {
        document.getElementById('checkedTabBtn').classList.add('tab-active');
        filteredData = allReimbursements.filter(item => item.status === 'Checked');
    } else if (tabName === 'acknowledge') {
        document.getElementById('acknowledgeTabBtn').classList.add('tab-active');
        filteredData = allReimbursements.filter(item => item.status === 'Acknowledge');
    } else if (tabName === 'rejected') {
        document.getElementById('rejectedTabBtn').classList.add('tab-active');
        filteredData = allReimbursements.filter(item => item.status === 'Rejected');
    }
    
    // Update table and pagination
    updateTable();
    updatePagination();
}

// Helper function to get status styling
function getStatusClass(status) {
    switch(status) {
        case 'Checked': return 'bg-yellow-200 text-yellow-800';
        case 'Acknowledge': return 'bg-green-200 text-green-800';
        case 'Rejected': return 'bg-red-200 text-red-800';
        default: return 'bg-gray-200 text-gray-800';
    }
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
            const date = new Date(item.submissionDate);
            if (!isNaN(date)) {
                formattedDate = date.toLocaleDateString();
            }
        }
        
        const row = document.createElement('tr');
        row.classList.add('border-t', 'hover:bg-gray-100');
        
        row.innerHTML = `
            <td class="p-2">
                <input type="checkbox" class="rowCheckbox" data-id="${item.id}" />
            </td>
            <td class="p-2">${item.id || ''}</td>
            <td class="p-2">${item.voucherNo || ''}</td>
            <td class="p-2">${item.requesterName || ''}</td>
            <td class="p-2">${item.department || ''}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${getStatusClass(item.status)}">
                    ${item.status}
                </span>
            </td>
            <td class="p-2">
                <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="goToDetailReim('${item.id}')">
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

// Change page for pagination
function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable();
        updatePagination();
    }
}

// Go to total documents view for mobile
function goToTotalDocs() {
    // Add your implementation for mobile total docs view
    alert('Showing all documents');
}

// Download table data as Excel
function downloadExcel() {
    // Create a worksheet from the filtered data
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    
    // Create a workbook with the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reimbursements");
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, "reimbursement_data.xlsx");
}

// Download table data as PDF
function downloadPDF() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Reimbursement Report", 14, 20);
    
    // Set up the table
    const headers = [["ID", "Doc Number", "Voucher", "Requester", "Department", "Date", "Status"]];
    
    const data = filteredData.map(item => [
        item.id,
        item.docNumber,
        item.voucherNo,
        item.requesterName,
        item.department,
        new Date(item.submissionDate).toLocaleDateString(),
        item.status
    ]);
    
    // Add the table to the PDF
    doc.autoTable({
        startY: 30,
        head: headers,
        body: data,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
    });
    
    // Save the PDF
    doc.save("reimbursement_report.pdf");
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', loadDashboard);