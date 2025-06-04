function loadDashboard() {
    // Fetch status counts and settlements data in a single API call
    fetchStatusCounts();
    
    // Set up initial state for tabs and pagination
    setupTabsAndPagination();
}

// Variables for pagination and filtering
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allSettlements = [];
let currentTab = 'acknowledge'; // Default tab

// Function to fetch status counts from API
async function fetchStatusCounts() {
    const response = await fetch(`${BASE_URL}/api/settlements/approval`);
    
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    if (data.status && data.code === 200) {
        // Calculate counts from the full data
        const settlements = data.data;
        const counts = {
            totalCount: settlements.length,
            acknowledgeCount: settlements.filter(item => item.status === 'Acknowledge').length,
            approvedCount: settlements.filter(item => item.status === 'Approved').length,
            rejectedCount: settlements.filter(item => item.status === 'Rejected').length
        };
        updateStatusCounts(counts);
        
        // Store the data to avoid making a second fetch
        allSettlements = settlements;
        switchTab(currentTab);
    } else {
        console.error('API returned an error:', data.message);
        useSampleData();
    }
}

// Function to display settlements in the table
function displaySettlements(settlements) {
    filteredData = settlements;
    updateTable();
    updatePagination();
}

// Function to update the status counts on the page
function updateStatusCounts(data) {
    document.getElementById("totalCount").textContent = data.totalCount || 0;
    document.getElementById("acknowledgeCount").textContent = data.acknowledgeCount || 0;
    document.getElementById("approvedCount").textContent = data.approvedCount || 0;
    document.getElementById("rejectedCount").textContent = data.rejectedCount || 0;
}

// Set up events for tab switching and pagination
function setupTabsAndPagination() {
    // The "select all" checkbox code has been removed
    // as the checkboxes are no longer in the table
}

function toggleSidebar() {
    // No-op function - sidebar toggle is disabled to keep it permanently open
    return;
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

function goToDetailSettle(settleId) {
    window.location.href = `../../../../detailPages/detailSettle.html?settle-id=${settleId}`;
}

// Sample data for testing when API is not available
let sampleData = [];
function generateSampleData() {
    sampleData = [];
    for (let i = 1; i <= 45; i++) {
        let status;
        if (i <= 20) {
            status = 'Acknowledge';
        } else if (i <= 35) {
            status = 'Approved';
        } else {
            status = 'Rejected';
        }
        
        sampleData.push({
            id: i,
            docNumber: `DOC-${1000 + i}`,
            settlementNumber: `STL-${2000 + i}`,
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
    allSettlements = generateSampleData();
    updateSampleCounts();
}

// Update counts using sample data
function updateSampleCounts() {
    const data = generateSampleData();
    document.getElementById("totalCount").textContent = data.length;
    document.getElementById("acknowledgeCount").textContent = data.filter(item => item.status === 'Acknowledge').length;
    document.getElementById("approvedCount").textContent = data.filter(item => item.status === 'Approved').length;
    document.getElementById("rejectedCount").textContent = data.filter(item => item.status === 'Rejected').length;
}

// Switch between Acknowledge and Approved tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('acknowledgeTabBtn').classList.remove('tab-active');
    document.getElementById('approvedTabBtn').classList.remove('tab-active');
    document.getElementById('rejectedTabBtn')?.classList.remove('tab-active');
    
    if (tabName === 'acknowledge') {
        document.getElementById('acknowledgeTabBtn').classList.add('tab-active');
        filteredData = allSettlements.filter(item => item.status === 'Acknowledge');
    } else if (tabName === 'approved') {
        document.getElementById('approvedTabBtn').classList.add('tab-active');
        filteredData = allSettlements.filter(item => item.status === 'Approved');
    } else if (tabName === 'rejected') {
        document.getElementById('rejectedTabBtn')?.classList.add('tab-active');
        filteredData = allSettlements.filter(item => item.status === 'Rejected');
    }
    
    // Update table and pagination
    updateTable();
    updatePagination();
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
        
        let statusClass = '';
        if (item.status === 'Acknowledge') {
            statusClass = 'bg-yellow-200 text-yellow-800';
        } else if (item.status === 'Approved') {
            statusClass = 'bg-green-200 text-green-800';
        } else if (item.status === 'Rejected') {
            statusClass = 'bg-red-200 text-red-800';
        }
        
        row.innerHTML = `
            <td class="p-2">${item.id || ''}</td>
            <td class="p-2">${item.settlementNumber || ''}</td>
            <td class="p-2">${item.requesterName || ''}</td>
            <td class="p-2">${item.department || 'IT'}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${statusClass}">
                    ${item.status}
                </span>
            </td>
            <td class="p-2">
                <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="goToDetailSettle('${item.id}')">
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
    
    // Disable/enable prev/next buttons
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    
    prevButton.classList.toggle('disabled', currentPage === 1);
    nextButton.classList.toggle('disabled', currentPage === totalPages || totalPages === 0);
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

// Go to total documents
function goToTotalDocs() {
    window.location.href = "menuSettleCheck.html";
}

// Export to Excel
function downloadExcel() {
    const filename = 'settlement_approval_report.xlsx';
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Settlement Approvals");
    XLSX.writeFile(wb, filename);
}

// Export to PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text("Settlement Approval Report", 14, 15);
    
    // Add a timestamp
    const now = new Date();
    doc.setFontSize(10);
    doc.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 14, 20);
    
    const tableColumn = ["Document #", "Settlement #", "Requester", "Department", "Date", "Status"];
    const tableRows = [];
    
    filteredData.forEach(item => {
        const formattedDate = new Date(item.submissionDate).toLocaleDateString();
        const itemData = [
            item.id,
            item.settlementNumber,
            item.requesterName,
            item.department,
            formattedDate,
            item.status
        ];
        tableRows.push(itemData);
    });
    
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        theme: 'striped',
        styles: { fontSize: 8 }
    });
    
    doc.save('settlement_approval_report.pdf');
}

// Load dashboard on page load
document.addEventListener('DOMContentLoaded', loadDashboard);
