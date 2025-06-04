function loadDashboard() {
    // Fetch status counts from API
    fetchStatusCounts();
    
    // Set up initial state for tabs and pagination
    setupTabsAndPagination();
    
    // Fetch settlements from API
    fetchSettlements();
}

// Variables for pagination and filtering
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allSettlements = [];
let currentTab = 'draft'; // Default tab

// Function to fetch status counts from API
function fetchStatusCounts() {
    const endpoint = "/api/settlements/status-counts";
    
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

// Function to fetch settlements from API
function fetchSettlements() {
    const endpoint = "/api/settlements";
    
    fetch(`${BASE_URL}${endpoint}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status && data.code === 200) {
                allSettlements = data.data;
                switchTab(currentTab); // Apply filtering based on current tab
            } else {
                console.error('API returned an error:', data.message);
                // Use sample data if API fails
                useSampleData();
                switchTab(currentTab);
            }
        })
        .catch(error => {
            console.error('Error fetching settlements:', error);
            // Use sample data if API fails
            useSampleData();
            switchTab(currentTab);
        });
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
    document.getElementById("draftCount").textContent = data.draftCount || 0;
    document.getElementById("checkedCount").textContent = data.checkedCount || 0;
    document.getElementById("rejectedCount").textContent = data.rejectedCount || 0;
}

// Set up events for tab switching and pagination
function setupTabsAndPagination() {
    // Set up search input event listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            if (searchTerm === '') {
                // If search is empty, reset to current tab's data
                switchTab(currentTab);
            } else {
                // Otherwise, filter on current tab data
                const tabData = currentTab === 'all' 
                    ? allSettlements 
                    : allSettlements.filter(item => {
                        if (currentTab === 'draft') {
                            return item.status === 'Prepared' || item.status === 'Draft';
                        } else {
                            return item.status.toLowerCase() === currentTab;
                        }
                    });
                
                filteredData = tabData.filter(item => 
                    (item.voucherNo && item.voucherNo.toLowerCase().includes(searchTerm)) ||
                    (item.docNumber && item.docNumber.toLowerCase().includes(searchTerm)) ||
                    (item.requesterName && item.requesterName.toLowerCase().includes(searchTerm)) ||
                    (item.department && item.department.toLowerCase().includes(searchTerm))
                );
                
                currentPage = 1;
                updateTable();
                updatePagination();
            }
        });
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
    
    // Toggle the sidebar toggle button icon
    const toggleIcon = document.querySelector('#sidebarToggle i');
    if (toggleIcon) {
        toggleIcon.classList.toggle('fa-chevron-left');
        toggleIcon.classList.toggle('fa-chevron-right');
    }
}

function toggleSubMenu(menuId) {
    const menu = document.getElementById(menuId);
    menu.classList.toggle("hidden");
    
    // Rotate the chevron icon
    const button = document.querySelector(`button[onclick="toggleSubMenu('${menuId}')"]`);
    const icon = button.querySelector('i.fas.fa-chevron-right');
    if (icon) {
        icon.style.transform = menu.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(90deg)';
    }
}

// Navigation functions
function goToMenu() { window.location.href = "../../../pages/Menu.html"; }
function goToMenuPR() { window.location.href = "../../purchaseRequest/menuPR.html"; }
function goToMenuCheckPR() { window.location.href = "../purchaseRequest/menuCheckPR.html"; }
function goToMenuAcknowPR() { window.location.href = "../purchaseRequest/menuAcknowPR.html"; }
function goToMenuApprovPR() { window.location.href = "../purchaseRequest/menuApprovPR.html"; }
function goToMenuReceivePR() { window.location.href = "../purchaseRequest/menuReceivePR.html"; }

function goToMenuReim() { window.location.href = "../../reimbursement/menuReim.html"; }
function goToMenuCash() { window.location.href = "../../cashAdvance/menuCash.html"; }
function goToMenuSettle() { window.location.href = "../../settlement/menuSettle.html"; }
function goToAddSettle() { window.location.href = "../../settlement/addSettle.html"; }

function goToMenuAPR() { window.location.href = "../approvalReport/menuAPR.html"; }
function goToMenuPO() { window.location.href = "../approvalReport/menuPO.html"; }
function goToMenuBanking() { window.location.href = "../approvalReport/menuBanking.html"; }
function goToMenuInvoice() { window.location.href = "../approvalReport/menuInvoice.html"; }

function goToMenuRegist() { window.location.href = "../../../register/register.html"; }
function goToMenuUser() { window.location.href = "../../../register/userList.html"; }
function goToMenuRole() { window.location.href = "../../../register/roleList.html"; }

function goToProfile() { window.location.href = "../../../pages/profile.html"; }

function detailDoc(settleId) {
    window.location.href = `../../../detailPages/detailSettle.html?settle-id=${settleId}`;
}

function logout() { 
    localStorage.removeItem("loggedInUser"); 
    window.location.href = "../../../login/login.html"; 
}

// Functions for mobile navigation
function goToCheckedDocs() { switchTab('checked'); }
function goToApprovedDocs() { switchTab('approved'); }
function goToCloseDocs() { switchTab('close'); }
function goToRejectDocs() { switchTab('rejected'); }

// Sample data for testing when API is not available
let sampleData = [];
function generateSampleData() {
    sampleData = [];
    const statuses = ['Prepared', 'Checked', 'Approved', 'Paid', 'Close', 'Rejected'];
    const departments = ['IT Department', 'Finance', 'Marketing', 'Operations', 'Human Resources'];
    
    for (let i = 1; i <= 50; i++) {
        // Ensure we have some rejected documents for testing
        let statusIndex;
        if (i >= 40 && i <= 45) {
            statusIndex = 5; // Index for 'Rejected' in the statuses array
        } else {
            statusIndex = i % (statuses.length - 1); // Distribute among other statuses
        }
        
        const deptIndex = i % departments.length;
        const month = (i % 12) + 1;
        const day = (i % 28) + 1;
        
        sampleData.push({
            id: i,
            docNumber: `STLC-${2023}-${String(i).padStart(3, '0')}`,
            voucherNo: `SETTLE-${2023}-${String(i).padStart(4, '0')}`,
            requesterName: `User ${i}`,
            department: departments[deptIndex],
            submissionDate: new Date(2023, month - 1, day).toISOString(),
            status: statuses[statusIndex]
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
    document.getElementById("draftCount").textContent = data.filter(item => item.status === 'Prepared').length;
    document.getElementById("checkedCount").textContent = data.filter(item => item.status === 'Checked').length;
    document.getElementById("rejectedCount").textContent = data.filter(item => item.status === 'Rejected').length;
}

// Function to switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('draftTabBtn').classList.remove('tab-active');
    document.getElementById('checkedTabBtn').classList.remove('tab-active');
    document.getElementById('rejectedTabBtn').classList.remove('tab-active');
    
    document.getElementById(`${tabName}TabBtn`).classList.add('tab-active');
    
    // Get the table body for animation effects
    const tableBody = document.getElementById('recentDocs');
    
    // Add fade-out effect
    tableBody.style.opacity = '0';
    tableBody.style.transform = 'translateY(10px)';
    tableBody.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    // Filter the data based on the selected tab
    setTimeout(() => {
        if (tabName === 'draft') {
            filteredData = allSettlements.filter(item => item.status === 'Prepared' || item.status === 'Draft');
        } else if (tabName === 'checked') {
            filteredData = allSettlements.filter(item => item.status === 'Checked');
        } else if (tabName === 'rejected') {
            filteredData = allSettlements.filter(item => item.status === 'Rejected');
        }
        
        // Apply search filter if exists
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            filteredData = filteredData.filter(item => 
                (item.voucherNo && item.voucherNo.toLowerCase().includes(searchTerm)) ||
                (item.docNumber && item.docNumber.toLowerCase().includes(searchTerm)) ||
                (item.requesterName && item.requesterName.toLowerCase().includes(searchTerm)) ||
                (item.department && item.department.toLowerCase().includes(searchTerm))
            );
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
        let formattedDate = item.submissionDate;
        if (item.submissionDate) {
            const date = new Date(item.submissionDate);
            if (!isNaN(date)) {
                formattedDate = date.toLocaleDateString();
            }
        }
        
        // Set status badge colors
        let statusClass = '';
        
        // Convert Draft to Prepared for display
        const displayStatus = item.status === 'Draft' ? 'Prepared' : item.status;
        
        switch(displayStatus) {
            case 'Prepared': 
                statusClass = 'bg-yellow-200 text-yellow-800'; 
                break;
            case 'Checked': 
                statusClass = 'bg-blue-200 text-blue-800'; 
                break;
            case 'Approved': 
                statusClass = 'bg-green-200 text-green-800'; 
                break;
            case 'Paid': 
                statusClass = 'bg-indigo-200 text-indigo-800'; 
                break;
            case 'Close': 
                statusClass = 'bg-gray-200 text-gray-800'; 
                break;
            case 'Rejected': 
                statusClass = 'bg-red-200 text-red-800'; 
                break;
            default: 
                statusClass = 'bg-gray-200 text-gray-800';
        }
        
        const row = document.createElement('tr');
        row.classList.add('border-t', 'hover:bg-gray-100');
        
        // Ensure we're getting the data from the correct properties
        const docNumber = item.docNumber || item.document_number || item.documentNumber || '';
        const settleNumber = item.voucherNo || item.voucher_no || item.settlement_number || item.settlementNumber || '';
        const department = item.department || item.departmentName || 'IT Department';
        
        row.innerHTML = `
            <td class="p-2">${docNumber}</td>
            <td class="p-2">${settleNumber}</td>
            <td class="p-2">${item.requesterName || ''}</td>
            <td class="p-2">${department}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs ${statusClass}">
                    ${displayStatus}
                </span>
            </td>
            <td class="p-2">
                <button onclick="detailDoc('${item.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
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
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable();
        updatePagination();
    }
}

// Export to Excel function
function downloadExcel() {
    // Get status text for filename
    const statusText = currentTab === 'draft' ? 'Prepared' : 
                      currentTab === 'checked' ? 'Checked' : 
                      currentTab === 'rejected' ? 'Rejected' : 'All';
    const fileName = `Settlement_${statusText}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    // Prepare data for export
    const data = filteredData.map(item => {
        // Convert Draft to Prepared for display
        const displayStatus = item.status === 'Draft' ? 'Prepared' : item.status;
        
        return {
            'Doc Number': item.docNumber || '',
            'Settlement Number': item.voucherNo || '',
            'Requester': item.requesterName || '',
            'Department': item.department || '',
            'Submission Date': item.submissionDate ? new Date(item.submissionDate).toLocaleDateString() : '',
            'Status': displayStatus
        };
    });
    
    // Create a worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Create a workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Settlements');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, fileName);
}

// Export to PDF function
function downloadPDF() {
    // Get status text for filename
    const statusText = currentTab === 'draft' ? 'Prepared' : 
                      currentTab === 'checked' ? 'Checked' : 
                      currentTab === 'rejected' ? 'Rejected' : 'All';
    const fileName = `Settlement_${statusText}_${new Date().toISOString().slice(0, 10)}.pdf`;
    
    // Create PDF document
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`Settlement ${statusText} Documents`, 14, 22);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableColumn = ['Doc Number', 'Settlement Number', 'Requester', 'Department', 'Submission Date', 'Status'];
    const tableRows = [];
    
    filteredData.forEach(item => {
        // Convert Draft to Prepared for display
        const displayStatus = item.status === 'Draft' ? 'Prepared' : item.status;
        
        const dataRow = [
            item.docNumber || '',
            item.voucherNo || '',
            item.requesterName || '',
            item.department || '',
            item.submissionDate ? new Date(item.submissionDate).toLocaleDateString() : '',
            displayStatus
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

// Load user data from localStorage if available
function loadUserData() {
    const userData = localStorage.getItem('loggedInUser');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            document.getElementById('userNameDisplay').textContent = user.name || 'User';
            
            // Set user avatar if available
            if (user.avatar) {
                document.getElementById('dashboardUserIcon').src = user.avatar;
            } else {
                // Default avatar
                document.getElementById('dashboardUserIcon').src = '../../../image/user-avatar.png';
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// Add DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    
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

// Load user data and dashboard on page load
window.onload = function() {
    loadUserData();
    loadDashboard();
}; 