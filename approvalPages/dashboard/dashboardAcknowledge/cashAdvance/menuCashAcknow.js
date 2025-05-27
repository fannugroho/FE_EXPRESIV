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
let currentTab = 'draft'; // Default tab is now 'draft' which corresponds to Checked status

// Function to fetch status counts from API
function fetchStatusCounts() {
    const baseUrl = "https://t246vds2-5246.asse.devtunnels.ms";
    const endpoint = "/api/cashadvances/status-counts";
    
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

// Function to fetch cash advances from API
function fetchCashAdvances() {
    const baseUrl = "https://t246vds2-5246.asse.devtunnels.ms";
    const endpoint = "/api/cashadvances";
    
    fetch(`${baseUrl}${endpoint}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status && data.code === 200) {
                allCashAdvances = data.data;
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
    document.getElementById("draftCount").textContent = data.checkedCount || 0; // Changed from draftCount to checkedCount
    document.getElementById("checkedCount").textContent = data.acknowledgedCount || 0; // Changed from checkedCount to acknowledgedCount
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
    // Redirect to a page with all documents or just switch to checked as default
    switchTab('draft'); 
}

// Function to redirect to detail page with cash advance ID
function detailCash(cashId) {
    window.location.href = `../../../../detailPages/detailCash.html?cash-id=${cashId}`;
}

// Sample data for testing when API is not available
let sampleData = [];
function generateSampleData() {
    sampleData = [];
    for (let i = 1; i <= 35; i++) {
        // For acknowledgment page, we focus on Checked and Acknowledged statuses
        const status = i <= 20 ? 'Checked' : 'Acknowledged';
        sampleData.push({
            id: i,
            docNumber: `DOC-${1000 + i}`,
            cashAdvanceNumber: `CA-${2000 + i}`,
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
    allCashAdvances = generateSampleData();
    updateSampleCounts();
}

// Update counts using sample data
function updateSampleCounts() {
    const data = generateSampleData();
    document.getElementById("totalCount").textContent = data.length;
    document.getElementById("draftCount").textContent = data.filter(item => item.status === 'Checked').length;
    document.getElementById("checkedCount").textContent = data.filter(item => item.status === 'Acknowledged').length;
    document.getElementById("rejectedCount").textContent = "1"; // Sample value for rejected count
}

// Switch between Checked and Acknowledged tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('draftTabBtn').classList.remove('tab-active');
    document.getElementById('checkedTabBtn').classList.remove('tab-active');
    
    if (tabName === 'draft') {
        document.getElementById('draftTabBtn').classList.add('tab-active');
        filteredData = allCashAdvances.filter(item => item.status === 'Checked');
    } else if (tabName === 'checked') {
        document.getElementById('checkedTabBtn').classList.add('tab-active');
        filteredData = allCashAdvances.filter(item => item.status === 'Acknowledged');
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
        
        row.innerHTML = `
            <td class="p-2">${item.docNumber || ''}</td>
            <td class="p-2">${item.cashAdvanceNumber || ''}</td>
            <td class="p-2">${item.requesterName || ''}</td>
            <td class="p-2">${item.department || ''}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${item.status === 'Checked' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}">
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

// Change the current page
function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable();
        updatePagination();
    }
}

// Download as Excel
function downloadExcel() {
    const workbook = XLSX.utils.book_new();
    
    // Convert table data to worksheet format
    const worksheetData = [
        ["Doc Number", "Cash Advance Number", "Requester", "Department", "Submission Date", "Status"]
    ];
    
    filteredData.forEach(item => {
        let formattedDate = item.submissionDate;
        if (item.submissionDate) {
            const date = new Date(item.submissionDate);
            if (!isNaN(date)) {
                formattedDate = date.toLocaleDateString();
            }
        }
        
        worksheetData.push([
            item.docNumber || '',
            item.cashAdvanceNumber || '',
            item.requesterName || '',
            item.department || '',
            formattedDate,
            item.status || ''
        ]);
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cash Advances");
    
    // Generate Excel file
    XLSX.writeFile(workbook, "Cash_Advances_Report.xlsx");
}

// Download as PDF
function downloadPDF() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Cash Advances Report", 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableColumn = ["Doc Number", "Cash Advance Number", "Requester", "Department", "Date", "Status"];
    const tableRows = [];
    
    filteredData.forEach(item => {
        let formattedDate = item.submissionDate;
        if (item.submissionDate) {
            const date = new Date(item.submissionDate);
            if (!isNaN(date)) {
                formattedDate = date.toLocaleDateString();
            }
        }
        
        const rowData = [
            item.docNumber || '',
            item.cashAdvanceNumber || '',
            item.requesterName || '',
            item.department || '',
            formattedDate,
            item.status || ''
        ];
        tableRows.push(rowData);
    });
    
    // Add table to document
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 36,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 3
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
    doc.save("Cash_Advances_Report.pdf");
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', loadDashboard); 