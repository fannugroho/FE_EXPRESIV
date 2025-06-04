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

function goToMenuReim() { window.location.href = "MenuReim.html"; }
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
    document.getElementById('rejectedTabBtn')?.classList.remove('tab-active');
    
    if (tabName === 'acknowledge') {
        document.getElementById('acknowledgeTabBtn').classList.add('tab-active');
        filteredData = allReimbursements.filter(item => item.status === 'Acknowledge');
        document.getElementById('remarksHeader').style.display = 'none';
    } else if (tabName === 'approved') {
        document.getElementById('approvedTabBtn').classList.add('tab-active');
        filteredData = allReimbursements.filter(item => item.status === 'Approved');
        document.getElementById('remarksHeader').style.display = 'none';
    } else if (tabName === 'rejected') {
        document.getElementById('rejectedTabBtn').classList.add('tab-active');
        filteredData = allReimbursements.filter(item => item.status === 'Rejected');
        document.getElementById('remarksHeader').style.display = 'table-cell';
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
        tableBody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-gray-500">No data available</td></tr>';
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
        
        // Determine status class for styling
        let statusClass = '';
        if (item.status === 'Acknowledge') {
            statusClass = 'bg-yellow-200 text-yellow-800';
        } else if (item.status === 'Approved') {
            statusClass = 'bg-green-200 text-green-800';
        } else if (item.status === 'Rejected') {
            statusClass = 'bg-red-200 text-red-800';
        }
        
        const row = document.createElement('tr');
        row.classList.add('border-t', 'hover:bg-gray-100');
        
        // Build the row HTML
        let rowHTML = `
            <td class="p-2">${item.docNumber || ''}</td>
            <td class="p-2">${item.voucherNo || ''}</td>
            <td class="p-2">${item.requesterName || ''}</td>
            <td class="p-2">${item.department || ''}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${statusClass}">
                    ${item.status}
                </span>
            </td>`;
            
        // Add remarks column if status is Rejected or we're on the rejected tab
        if (item.status === 'Rejected' || currentTab === 'rejected') {
            rowHTML += `<td class="p-2">${item.remarks || 'N/A'}</td>`;
        }
        
        rowHTML += `
            <td class="p-2">
                <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="detailReim('${item.id}')">
                    Detail
                </button>
            </td>
        `;
        
        row.innerHTML = rowHTML;
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

// Function to download data as Excel
function downloadExcel() {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const wsData = filteredData.map(item => {
        const date = item.submissionDate ? new Date(item.submissionDate) : null;
        const formattedDate = date && !isNaN(date) ? date.toLocaleDateString() : '';
        
        const row = {
            'Doc Number': item.docNumber || '',
            'Reimbursement Number': item.voucherNo || '',
            'Requester': item.requesterName || '',
            'Department': item.department || '',
            'Submission Date': formattedDate,
            'Status': item.status || ''
        };
        
        // Add remarks for rejected items
        if (item.status === 'Rejected') {
            row['Remarks'] = item.remarks || '';
        }
        
        return row;
    });
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Reimbursements');
    
    // Generate Excel file and trigger download
    const status = currentTab === 'acknowledge' ? 'Acknowledge' : currentTab === 'approved' ? 'Approved' : 'Rejected';
    XLSX.writeFile(wb, `Reimbursements_${status}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Function to download data as PDF
function downloadPDF() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set title
    const status = currentTab === 'acknowledge' ? 'Acknowledge' : currentTab === 'approved' ? 'Approved' : 'Rejected';
    doc.text(`Reimbursements - ${status}`, 14, 16);
    
    // Define columns based on status
    let columns = [
        { header: 'Doc Number', dataKey: 'docNumber' },
        { header: 'Reimbursement Number', dataKey: 'voucherNo' },
        { header: 'Requester', dataKey: 'requesterName' },
        { header: 'Department', dataKey: 'department' },
        { header: 'Submission Date', dataKey: 'submissionDate' },
        { header: 'Status', dataKey: 'status' }
    ];
    
    // Add remarks column for rejected items
    if (currentTab === 'rejected') {
        columns.push({ header: 'Remarks', dataKey: 'remarks' });
    }
    
    // Format data for autotable
    const tableData = filteredData.map(item => {
        const date = item.submissionDate ? new Date(item.submissionDate) : null;
        const formattedDate = date && !isNaN(date) ? date.toLocaleDateString() : '';
        
        const row = {
            docNumber: item.docNumber || '',
            voucherNo: item.voucherNo || '',
            requesterName: item.requesterName || '',
            department: item.department || '',
            submissionDate: formattedDate,
            status: item.status || ''
        };
        
        if (currentTab === 'rejected') {
            row.remarks = item.remarks || 'N/A';
        }
        
        return row;
    });
    
    // Generate table
    doc.autoTable({
        head: [columns.map(col => col.header)],
        body: tableData.map(item => columns.map(col => item[col.dataKey])),
        startY: 20,
        theme: 'grid',
        headStyles: {
            fillColor: [66, 133, 244],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        },
        margin: { top: 20 }
    });
    
    // Save PDF
    doc.save(`Reimbursements_${status}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Initialize the dashboard on page load
document.addEventListener('DOMContentLoaded', loadDashboard); 