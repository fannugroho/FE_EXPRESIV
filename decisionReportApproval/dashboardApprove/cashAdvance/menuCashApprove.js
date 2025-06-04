function loadDashboard() {
    // Fetch real data from API
    fetchRealData();
    
    // Set up initial state for tabs and pagination
    setupTabsAndPagination();
}

// Variables for pagination and filtering
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allCashAdvances = [];
let currentTab = 'draft'; // Default tab is 'draft' which corresponds to Acknowledged status

// Function to fetch real data from API
async function fetchRealData() {
    try {
        const response = await fetch(`${BASE_URL}/api/CashAdvance/approval`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("token")}`
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data.status && data.data) {
            allCashAdvances = data.data;
            
            // Update dashboard counts
            updateStatusCounts({
                totalCount: allCashAdvances.length,
                acknowledgedCount: allCashAdvances.filter(doc => doc.status === "Acknowledged").length,
                approvedCount: allCashAdvances.filter(doc => doc.status === "Approved").length,
                rejectedCount: allCashAdvances.filter(doc => doc.status === "Rejected").length
            });
            
            // Apply initial filtering based on current tab
            switchTab(currentTab);
        } else {
            console.error("API response does not contain expected data");
            // Use sample data if API fails
            useSampleData();
            switchTab(currentTab);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        // Use sample data if API fails
        useSampleData();
        switchTab(currentTab);
    }
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
    document.getElementById("draftCount").textContent = data.acknowledgedCount || 0;
    document.getElementById("checkedCount").textContent = data.approvedCount || 0;
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
function goToMenuApprovPR() { window.location.href = "../../dashboardApprove/purchaseRequest/menuPRApprove.html"; }
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
    // Redirect to a page with all documents or just switch to checked as default
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
    for (let i = 1; i <= 35; i++) {
        // For approval page, we focus on Acknowledged and Approved statuses
        const status = i <= 20 ? 'Acknowledged' : 'Approved';
        sampleData.push({
            id: i.toString(),
            cashAdvanceNo: `CA-${2000 + i}`,
            requesterName: `User ${i}`,
            departmentName: `Department ${(i % 5) + 1}`,
            purpose: `Purpose ${i}`,
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
    const data = generateSampleData();
    document.getElementById("totalCount").textContent = data.length;
    document.getElementById("draftCount").textContent = data.filter(item => item.status === 'Acknowledged').length;
    document.getElementById("checkedCount").textContent = data.filter(item => item.status === 'Approved').length;
    document.getElementById("rejectedCount").textContent = "1"; // Sample value for rejected count
}

// Switch between Acknowledged and Approved tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('draftTabBtn').classList.remove('tab-active');
    document.getElementById('checkedTabBtn').classList.remove('tab-active');
    
    if (tabName === 'draft') {
        document.getElementById('draftTabBtn').classList.add('tab-active');
        filteredData = allCashAdvances.filter(item => item.status === 'Acknowledged');
    } else if (tabName === 'checked') {
        document.getElementById('checkedTabBtn').classList.add('tab-active');
        filteredData = allCashAdvances.filter(item => item.status === 'Approved');
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
    
    if (filteredData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-gray-500">No data available</td></tr>';
        return;
    }
    
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
            <td class="p-2">${item.id ? item.id.substring(0, 10) : ''}</td>
            <td class="p-2">${item.cashAdvanceNo || ''}</td>
            <td class="p-2">${item.requesterName || ''}</td>
            <td class="p-2">${item.departmentName || ''}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${item.status === 'Acknowledged' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}">
                    ${item.status}
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

// Change page function for pagination
function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable();
        updatePagination();
    }
}

// Function to download data as Excel
function downloadExcel() {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Convert data to appropriate format for Excel
    const excelData = filteredData.map(item => ({
        'ID': item.id ? item.id.substring(0, 10) : '',
        'Cash Advance Number': item.cashAdvanceNo || '',
        'Requester': item.requesterName || '',
        'Department': item.departmentName || '',
        'Purpose': item.purpose || '',
        'Submission Date': item.submissionDate ? new Date(item.submissionDate).toLocaleDateString() : '',
        'Status': item.status || ''
    }));
    
    // Convert to worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Cash Advance Data');
    
    // Generate Excel file and trigger download
    const status = currentTab === 'draft' ? 'Acknowledged' : 'Approved';
    XLSX.writeFile(wb, `Cash_Advance_${status}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Function to download data as PDF
function downloadPDF() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set title
    const status = currentTab === 'draft' ? 'Acknowledged' : 'Approved';
    doc.text(`Cash Advance - ${status}`, 14, 16);
    
    // Prepare data for table
    const tableColumn = ["ID", "Cash Advance Number", "Requester", "Department", "Date", "Status"];
    const tableRows = [];
    
    // Add data rows
    filteredData.forEach(item => {
        const formattedDate = item.submissionDate ? new Date(item.submissionDate).toLocaleDateString() : '';
        const dataRow = [
            item.id ? item.id.substring(0, 10) : '',
            item.cashAdvanceNo || '',
            item.requesterName || '',
            item.departmentName || '',
            formattedDate,
            item.status || ''
        ];
        tableRows.push(dataRow);
    });
    
    // Generate table
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 8,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [66, 135, 245],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        }
    });
    
    // Save PDF
    doc.save(`Cash_Advance_${status}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Initialize dashboard when the document is loaded
document.addEventListener('DOMContentLoaded', loadDashboard); 