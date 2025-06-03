// Global variables for pagination
let currentPage = 1;
const itemsPerPage = 10;
let allReimbursements = [];
let filteredReimbursements = [];
let currentTab = 'all'; // Default tab

function loadDashboard() {
    // Fetch status counts from API
    fetchStatusCounts();
    
    // Fetch reimbursements from API
    fetchReimbursements();

    // Add event listener for search input
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // Set up the "select all" checkbox
    // document.getElementById('selectAll').addEventListener("change", function() {
    //     const checkboxes = document.querySelectorAll('#recentDocs input[type="checkbox"]');
    //     checkboxes.forEach(checkbox => {
    //         checkbox.checked = this.checked;
    //     });
    // });
}

// Function to handle search
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    filterReimbursements(searchTerm, currentTab);
}

// Function to filter reimbursements based on search term and tab
function filterReimbursements(searchTerm = '', tab = 'all') {
    if (tab === 'all') {
        filteredReimbursements = allReimbursements.filter(reim => 
            reim.voucherNo.toLowerCase().includes(searchTerm)
        );
    } else if (tab === 'draft') {
        filteredReimbursements = allReimbursements.filter(reim => 
            reim.status.toLowerCase() === 'draft' && reim.voucherNo.toLowerCase().includes(searchTerm)
        );
    }
    currentPage = 1;
    displayReimbursements(filteredReimbursements);
}

// Function to switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('allTabBtn').classList.remove('tab-active');
    document.getElementById('draftTabBtn').classList.remove('tab-active');
    
    if (tabName === 'all') {
        document.getElementById('allTabBtn').classList.add('tab-active');
    } else if (tabName === 'draft') {
        document.getElementById('draftTabBtn').classList.add('tab-active');
    }
    
    // Filter reimbursements based on current tab and search term
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filterReimbursements(searchTerm, tabName);
}

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
                filteredReimbursements = [...allReimbursements];
                displayReimbursements(filteredReimbursements);
            } else {
                console.error('API returned an error:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching reimbursements:', error);
        });
}

// Function to display reimbursements in the table with pagination
function displayReimbursements(reimbursements) {
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, reimbursements.length);
    const paginatedReimbursements = reimbursements.slice(startIndex, endIndex);
    
    paginatedReimbursements.forEach(reim => {
        let formattedDate = reim.submissionDate;
        if (reim.submissionDate) {
            const date = new Date(reim.submissionDate);
            if (!isNaN(date)) {
                formattedDate = date.toLocaleDateString();
            }
        }
        
        // <td class='p-2 text-left'><input type="checkbox" class="rowCheckbox"></td>
        const row = `<tr class='border-b'>
            <td class='p-2'>${reim.id}</td>
            <td class='p-2'>${reim.voucherNo}</td>
            <td class='p-2'>${reim.requesterName}</td>
            <td class='p-2'>${reim.department}</td>
            <td class='p-2'>${formattedDate}</td>
            <td class='p-2'>
                <span class="px-2 py-1 rounded-full text-xs ${reim.status === 'Draft' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}">
                    ${reim.status}
                </span>
            </td>
            <td class='p-2'>
                <button onclick="detailReim('${reim.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    // Update item count display
    document.getElementById('startItem').textContent = reimbursements.length > 0 ? startIndex + 1 : 0;
    document.getElementById('endItem').textContent = endIndex;
    document.getElementById('totalItems').textContent = reimbursements.length;
    
    // Update pagination buttons
    updatePaginationButtons(reimbursements.length);
}

// Function to update pagination buttons
function updatePaginationButtons(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    
    // Update prev/next button states
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.classList.toggle('disabled', currentPage <= 1);
    nextBtn.classList.toggle('disabled', currentPage >= totalPages);
}

// Function to change page
function changePage(direction) {
    const totalPages = Math.ceil(filteredReimbursements.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayReimbursements(filteredReimbursements);
    }
}

// Function to download Excel
function downloadExcel() {
    const workbook = XLSX.utils.book_new();
    
    // Convert the data to worksheet format
    const wsData = filteredReimbursements.map(reim => ({
        'Document Number': reim.id,
        'Reimbursement Number': reim.voucherNo,
        'Requester': reim.requesterName,
        'Department': reim.department,
        'Submission Date': reim.submissionDate,
        'Status': reim.status
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reimbursements');
    
    // Generate Excel file
    XLSX.writeFile(workbook, 'reimbursements.xlsx');
}

// Function to download PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Reimbursements Report', 14, 15);
    
    // Create table data
    const tableData = filteredReimbursements.map(reim => [
        reim.id,
        reim.voucherNo,
        reim.requesterName,
        reim.department,
        reim.submissionDate,
        reim.status
    ]);
    
    // Add table
    doc.autoTable({
        head: [['Doc Number', 'Reimbursement Number', 'Requester', 'Department', 'Submission Date', 'Status']],
        body: tableData,
        startY: 25
    });
    
    // Save PDF
    doc.save('reimbursements.pdf');
}

// Function to update the status counts on the page
function updateStatusCounts(data) {
    document.getElementById("totalCount").textContent = data.totalCount || 0;
    document.getElementById("draftCount").textContent = data.draftCount || 0;
    document.getElementById("checkedCount").textContent = data.checkedCount || 0;
    document.getElementById("acknowledgeCount").textContent = data.acknowledgeCount || 0;
    document.getElementById("approvedCount").textContent = data.approvedCount || 0;
    document.getElementById("paidCount").textContent = data.paidCount || 0;
    document.getElementById("closeCount").textContent = data.closedCount || 0; // Note: API returns closedCount but HTML uses closeCount
    document.getElementById("rejectedCount").textContent = data.rejectedCount || 0;
}

function toggleSidebar() {
    // No-op function - sidebar toggle is disabled to keep it permanently open
    return;
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Mobile navigation functions
function goToTotalDocs() {
    switchTab('all');
}

function goToDraftDocs() {
    switchTab('draft');
}

// Navigation functions
function goToMenu() { window.location.href = "Menu.html"; }
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
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; }

// Function to redirect to detail page with reimbursement ID
function detailReim(reimId) {
    window.location.href = `/detailPages/detailReim.html?reim-id=${reimId}`;
}

window.onload = loadDashboard;