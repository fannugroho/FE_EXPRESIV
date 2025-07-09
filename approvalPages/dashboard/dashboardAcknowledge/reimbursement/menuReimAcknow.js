function loadDashboard() {
    // Fetch status counts from API
    fetchStatusCounts();
    
    // Fetch reimbursements from API
    fetchReimbursements();
    
    // Add event listener for search input
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // Add event listener for search type dropdown
    document.getElementById('searchType').addEventListener('change', function() {
        // Trigger search again when dropdown changes
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        handleSearch({target: {value: searchTerm}});
    });
}

// Variables for pagination and filtering
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allReimbursements = [];
let currentTab = 'checked'; // Default tab

// Function to handle search
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const searchType = document.getElementById('searchType').value;
    filterReimbursements(searchTerm, currentTab, searchType);
}

// Function to filter reimbursements based on search term, tab, and search type
function filterReimbursements(searchTerm = '', tab = 'checked', searchType = 'pr') {
    if (tab === 'checked') {
        filteredData = allReimbursements.filter(item => {
            // Filter berdasarkan status
            const statusMatch = item.status === 'Checked';
            
            // Filter berdasarkan tipe pencarian yang dipilih
            let searchMatch = true;
            if (searchTerm) {
                if (searchType === 'pr') {
                    searchMatch = item.voucherNo.toLowerCase().includes(searchTerm);
                } else if (searchType === 'requester') {
                    searchMatch = item.requesterName.toLowerCase().includes(searchTerm);
                } else if (searchType === 'date') {
                    // Format tanggal untuk pencarian
                    const formattedDate = formatDateYYYYMMDD(item.submissionDate).toLowerCase();
                    searchMatch = formattedDate.includes(searchTerm);
                }
            }
            
            return statusMatch && searchMatch;
        });
    } else if (tab === 'acknowledged') {
        filteredData = allReimbursements.filter(item => {
            // Filter berdasarkan status
            const statusMatch = item.status === 'Acknowledged';
            
            // Filter berdasarkan tipe pencarian yang dipilih
            let searchMatch = true;
            if (searchTerm) {
                if (searchType === 'pr') {
                    searchMatch = item.voucherNo.toLowerCase().includes(searchTerm);
                } else if (searchType === 'requester') {
                    searchMatch = item.requesterName.toLowerCase().includes(searchTerm);
                } else if (searchType === 'date') {
                    // Format tanggal untuk pencarian
                    const formattedDate = formatDateYYYYMMDD(item.submissionDate).toLowerCase();
                    searchMatch = formattedDate.includes(searchTerm);
                }
            }
            
            return statusMatch && searchMatch;
        });
    } else if (tab === 'rejected') {
        filteredData = allReimbursements.filter(item => {
            // Filter berdasarkan status
            const statusMatch = item.status === 'Rejected';
            
            // Filter berdasarkan tipe pencarian yang dipilih
            let searchMatch = true;
            if (searchTerm) {
                if (searchType === 'pr') {
                    searchMatch = item.voucherNo.toLowerCase().includes(searchTerm);
                } else if (searchType === 'requester') {
                    searchMatch = item.requesterName.toLowerCase().includes(searchTerm);
                } else if (searchType === 'date') {
                    // Format tanggal untuk pencarian
                    const formattedDate = formatDateYYYYMMDD(item.submissionDate).toLowerCase();
                    searchMatch = formattedDate.includes(searchTerm);
                }
            }
            
            return statusMatch && searchMatch;
        });
    }
    
    // Update table and pagination
    updateTable();
    updatePagination();
}

// Helper function to format date with local timezone
function formatDateWithLocalTimezone(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    
    // Format for display
    return date.toLocaleDateString();
}

// Helper function to format date in YYYY-MM-DD format with local timezone
function formatDateYYYYMMDD(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Function to fetch status counts from API
function fetchStatusCounts() {
    const userId = getUserId();
    const endpoint = `/api/reimbursements/status-counts/acknowledger/${userId}`;
    
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
            // Show error message
            displayErrorMessage('Failed to fetch status counts');
        });
}

// Function to fetch reimbursements from API
function fetchReimbursements() {
    const userId = getUserId();
    const endpoint = `/api/reimbursements/acknowledger/${userId}`;
    
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
                displayErrorMessage('Failed to fetch reimbursements');
            }
        })
        .catch(error => {
            console.error('Error fetching reimbursements:', error);
            displayErrorMessage('Failed to fetch reimbursements');
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
    document.getElementById("acknowledgedCount").textContent = data.acknowledgedCount || 0;
    document.getElementById("rejectedCount").textContent = data.rejectedCount || 0;
}

function toggleSidebar() {
    // No-op function - sidebar toggle is disabled to keep it permanently open
    return;
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Navigation functions
function goToMenu() { window.location.href = "Menu.html"; }
function goToAddDoc() {window.location.href = "AddDoc.html"; }
function goToAddReim() {window.location.href = "../addPages/addReim.html"; }
function goToAddCash() {window.location.href = "AddCash.html"; }
function goToAddSettle() {window.location.href = "AddSettle.html"; }
function goToAddPO() {window.location.href = "AddPO.html"; }
function goToMenuPR() { window.location.href = "MenuPR.html"; }
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
    window.location.href = `../../../approval/acknowledge/reimbursement/acknowledgeReim.html?reim-id=${reimId}`;
}

// Function to display error message
function displayErrorMessage(message) {
    // Reset counts to zero
    document.getElementById("totalCount").textContent = 0;
    document.getElementById("checkedCount").textContent = 0;
    document.getElementById("acknowledgedCount").textContent = 0;
    document.getElementById("rejectedCount").textContent = 0;
    
    // Clear table data
    allReimbursements = [];
    filteredData = [];
    updateTable();
    updatePagination();
    
    // Show error message (could be enhanced with a visual error component)
    console.error(message);
}

// Switch between Prepared and Checked tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('checkedTabBtn').classList.remove('tab-active');
    document.getElementById('acknowledgedTabBtn').classList.remove('tab-active');
    document.getElementById('rejectedTabBtn').classList.remove('tab-active');
    
    if (tabName === 'checked') {
        document.getElementById('checkedTabBtn').classList.add('tab-active');
    } else if (tabName === 'acknowledged') {
        document.getElementById('acknowledgedTabBtn').classList.add('tab-active');
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
        // Get search term and type for filtering
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const searchType = document.getElementById('searchType').value;
        filterReimbursements(searchTerm, tabName, searchType);
        
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
    
    if (filteredData.length === 0) {
        const row = document.createElement('tr');
        row.classList.add('border-t');
        row.innerHTML = `
            <td colspan="7" class="p-4 text-center text-gray-500">No data available</td>
        `;
        tableBody.appendChild(row);
    } else {
        for (let i = startIndex; i < endIndex; i++) {
            const item = filteredData[i];
            
                    // Format the submission date if needed
        let formattedDate = item.submissionDate;
        if (item.submissionDate) {
            formattedDate = formatDateWithLocalTimezone(item.submissionDate);
        }
            
            const displayStatus = item.status;
            
            const row = document.createElement('tr');
            row.classList.add('border-t', 'hover:bg-gray-100');
            
            row.innerHTML = `
                <td class="p-2">${item.id || ''}</td>
                <td class="p-2">${item.voucherNo || ''}</td>
                <td class="p-2">${item.requesterName || ''}</td>
                <td class="p-2">${item.department || ''}</td>
                <td class="p-2">${formattedDate}</td>
                <td class="p-2">
                    <span class="px-2 py-1 rounded-full text-xs ${displayStatus === 'Checked' ? 'bg-yellow-200 text-yellow-800' : displayStatus === 'Acknowledged' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}">
                        ${displayStatus}
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
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable();
        updatePagination();
    }
}

// Function to show all documents
function goToTotalDocs() {
    filteredData = allReimbursements;
    currentPage = 1;
    updateTable();
    updatePagination();
}

// Export to Excel function
function downloadExcel() {
    // Get status text for filename
    const statusText = currentTab === 'checked' ? 'Checked' : currentTab === 'acknowledged' ? 'Acknowledged' : 'Rejected';
    const fileName = `Reimbursement_${statusText}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    // Prepare data for export - no changes needed here as it already doesn't include checkbox data
    const data = filteredData.map(item => {
        // Remove Draft to Prepared conversion as it's no longer needed
        return {
            'Doc Number': item.id || '',
            'Reimbursement Number': item.voucherNo || '',
            'Requester': item.requesterName || '',
            'Department': item.department || '',
            'Submission Date': item.submissionDate ? formatDateWithLocalTimezone(item.submissionDate) : '',
            'Status': item.status
        };
    });
    
    // Create a worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Create a workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reimbursements');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, fileName);
}

// Export to PDF function
function downloadPDF() {
    // Get status text for filename
    const statusText = currentTab === 'checked' ? 'Checked' : currentTab === 'acknowledged' ? 'Acknowledged' : 'Rejected';
    const fileName = `Reimbursement_${statusText}_${new Date().toISOString().slice(0, 10)}.pdf`;
    
    // Create PDF document
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`Reimbursement ${statusText} Documents`, 14, 22);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data - column headers are already correct without checkbox column
    const tableColumn = ['Doc Number', 'Reimbursement Number', 'Requester', 'Department', 'Submission Date', 'Status'];
    const tableRows = [];
    
    filteredData.forEach(item => {
        // Remove Draft to Prepared conversion as it's no longer needed
        const dataRow = [
            item.id || '',
            item.voucherNo || '',
            item.requesterName || '',
            item.department || '',
            item.submissionDate ? formatDateWithLocalTimezone(item.submissionDate) : '',
            item.status
        ];
        tableRows.push(dataRow);
    });
    
    // Add table
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [66, 153, 225],
            textColor: 255
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        }
    });
    
    // Save PDF
    doc.save(fileName);
}

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    
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

window.onload = loadDashboard;