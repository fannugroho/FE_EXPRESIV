function loadDashboard() {
    // Fetch status counts from API
    fetchStatusCounts();
    
    // Set up initial state for tabs and pagination
    setupTabsAndPagination();
    
    // Fetch reimbursements from API
    fetchReimbursements();
}

// Variables for pagination and filtering
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allReimbursements = [];
let currentTab = 'acknowledge'; // Default tab

// Function to fetch status counts from API
function fetchStatusCounts() {
    const endpoint = "/api/reimbursements/status-counts";
    
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
            // Fallback to sample data if API fails
            updateSampleCounts();
        });
}

// Function to fetch reimbursements from API
function fetchReimbursements() {
    const endpoint = "/api/reimbursements";
    
    fetch(`${BASE_URL}${endpoint}`)
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
    document.getElementById("acknowledgeCount").textContent = data.acknowledgeCount || 0;
    document.getElementById("approvedCount").textContent = data.approvedCount || 0;
    document.getElementById("rejectedCount").textContent = data.rejectedCount || 0;
}

// Set up events for tab switching and pagination
function setupTabsAndPagination() {
    // Initial setup
    document.addEventListener('DOMContentLoaded', function() {
        loadDashboard();
        
        // Add event listener to close sidebar when clicking outside on mobile
        document.addEventListener('click', function(event) {
            const sidebar = document.getElementById('sidebar');
            const toggleBtn = document.querySelector('[onclick="toggleSidebar()"]');
            
            // Check if we're on mobile view (using a media query)
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            
            if (isMobile && 
                sidebar.classList.contains('active') && 
                !sidebar.contains(event.target) && 
                event.target !== toggleBtn) {
                sidebar.classList.remove('active');
            }
        });
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
    
    // If on desktop, don't use the 'active' class
    if (window.matchMedia('(min-width: 769px)').matches) {
        sidebar.classList.remove('active');
    }
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Navigation functions
function goToMenu() { window.location.href = "../../../../pages/Menu.html"; }
function goToAddDoc() {window.location.href = "AddDoc.html"; }
function goToAddReim() {window.location.href = "../addPages/addReim.html"; }
function goToAddCash() {window.location.href = "AddCash.html"; }
function goToAddSettle() {window.location.href = "AddSettle.html"; }
function goToAddPO() {window.location.href = "AddPO.html"; }
function goToMenuPR() { window.location.href = "MenuPR.html"; }

// function goToDetailReim(reimId) {
//     window.location.href = `/detailPages/detailReim.html?reim-id=${reimId}`;
// }

function goToMenuReim() { window.location.href = "../../../../pages/menuReim.html"; }
function goToMenuCash() { window.location.href = "MenuCash.html"; }
function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
function goToMenuPO() { window.location.href = "MenuPO.html"; }
function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "../../../../pages/Login.html"; }

// Function to redirect to detail page with reimbursement ID
function detailReim(reimId) {
    window.location.href = `../../../../approvalPages/approval/approve/reimbursement/approveReim.html?reim-id=${reimId}`;
}

// Sample data for testing when API is not available
let sampleData = [];
function generateSampleData() {
    sampleData = [];
    for (let i = 1; i <= 35; i++) {
        let status;
        if (i <= 15) {
            status = 'Acknowledge';
        } else if (i <= 25) {
            status = 'Approved';
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
    
    if (tabName === 'acknowledge') {
        document.getElementById('acknowledgeTabBtn').classList.add('tab-active');
        filteredData = allReimbursements.filter(item => item.status === 'Acknowledge');
    } else if (tabName === 'approved') {
        document.getElementById('approvedTabBtn').classList.add('tab-active');
        filteredData = allReimbursements.filter(item => item.status === 'Approved');
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
        
        // Determine status class for styling
        let statusClass = '';
        if (item.status === 'Acknowledge') {
            statusClass = 'status-acknowledge';
        } else if (item.status === 'Approved') {
            statusClass = 'status-approved';
        } else if (item.status === 'Rejected') {
            statusClass = 'status-rejected';
        }
        
        const row = document.createElement('tr');
        row.classList.add('border-t', 'hover:bg-gray-100');
        
        row.innerHTML = `
            <td class="p-2">${item.id || ''}</td>
            <td class="p-2">${item.voucherNo || ''}</td>
            <td class="p-2">${item.requesterName || ''}</td>
            <td class="p-2">${item.department || ''}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${statusClass}">
                    ${item.status}
                </span>
            </td>
            <td class="p-2">
                <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="detailReim('${item.id}')">
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

// Change the current page
function changePage(direction) {
    const newPage = currentPage + direction;
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable();
        updatePagination();
    }
}

// Function for mobile view to show total documents
function goToTotalDocs() {
    alert(`Total Documents: ${document.getElementById('totalCount').textContent}`);
}

// Function to download the current data as Excel
function downloadExcel() {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(item => {
        return {
            'Doc Number': item.id,
            'Reimbursement Number': item.voucherNo,
            'Requester': item.requesterName,
            'Department': item.department,
            'Submission Date': new Date(item.submissionDate).toLocaleDateString(),
            'Status': item.status
        };
    }));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reimbursements');
    
    // Generate Excel file
    XLSX.writeFile(workbook, `Reimbursements_${currentTab}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Function to download the current data as PDF
function downloadPDF() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(`Reimbursement Report - ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}`, 14, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Define the columns for the table
    const columns = [
        { header: 'Doc No', dataKey: 'id' },
        { header: 'Reim No', dataKey: 'voucherNo' },
        { header: 'Requester', dataKey: 'requesterName' },
        { header: 'Department', dataKey: 'department' },
        { header: 'Date', dataKey: 'date' },
        { header: 'Status', dataKey: 'status' }
    ];
    
    // Prepare the data
    const data = filteredData.map(item => {
        return {
            id: item.id,
            voucherNo: item.voucherNo,
            requesterName: item.requesterName,
            department: item.department,
            date: new Date(item.submissionDate).toLocaleDateString(),
            status: item.status
        };
    });
    
    // Generate the table
    doc.autoTable({
        startY: 40,
        columns: columns,
        body: data
    });
    
    // Save the PDF
    doc.save(`Reimbursements_${currentTab}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Initialize the dashboard on page load
document.addEventListener('DOMContentLoaded', loadDashboard); 