document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    checkAuthentication();
    displayUserInfo();
    
    // Initialize data
    loadDocumentData();
    setupEventListeners();
});

let allDocuments = [];
let filteredDocuments = [];
let currentTab = 'all';
let currentPage = 1;
const itemsPerPage = 10;

// Load document data from API or localStorage for demo
function loadDocumentData() {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        logout();
        return;
    }
    
    // For demo purposes, let's create sample data
    // In production, this would be an API call
    allDocuments = [
        { id: 1, docNumber: 'STL-001', settlementNumber: 'SETT-2023-001', requester: 'John Doe', department: 'Finance', date: '2023-10-15', status: 'Draft' },
        { id: 2, docNumber: 'STL-002', settlementNumber: 'SETT-2023-002', requester: 'Jane Smith', department: 'Marketing', date: '2023-10-16', status: 'Checked' },
        { id: 3, docNumber: 'STL-003', settlementNumber: 'SETT-2023-003', requester: 'Robert Johnson', department: 'IT', date: '2023-10-17', status: 'Draft' },
        { id: 4, docNumber: 'STL-004', settlementNumber: 'SETT-2023-004', requester: 'Emily Davis', department: 'HR', date: '2023-10-18', status: 'Rejected' },
        { id: 5, docNumber: 'STL-005', settlementNumber: 'SETT-2023-005', requester: 'Michael Brown', department: 'Operations', date: '2023-10-19', status: 'Checked' },
        { id: 6, docNumber: 'STL-006', settlementNumber: 'SETT-2023-006', requester: 'Lisa Wilson', department: 'Finance', date: '2023-10-20', status: 'Draft' },
        { id: 7, docNumber: 'STL-007', settlementNumber: 'SETT-2023-007', requester: 'David Taylor', department: 'Marketing', date: '2023-10-21', status: 'Checked' },
        { id: 8, docNumber: 'STL-008', settlementNumber: 'SETT-2023-008', requester: 'Sarah Martinez', department: 'IT', date: '2023-10-22', status: 'Rejected' },
        { id: 9, docNumber: 'STL-009', settlementNumber: 'SETT-2023-009', requester: 'Thomas Anderson', department: 'HR', date: '2023-10-23', status: 'Draft' },
        { id: 10, docNumber: 'STL-010', settlementNumber: 'SETT-2023-010', requester: 'Jennifer Lewis', department: 'Operations', date: '2023-10-24', status: 'Checked' },
        { id: 11, docNumber: 'STL-011', settlementNumber: 'SETT-2023-011', requester: 'Daniel Clark', department: 'Finance', date: '2023-10-25', status: 'Rejected' },
        { id: 12, docNumber: 'STL-012', settlementNumber: 'SETT-2023-012', requester: 'Michelle Lee', department: 'Marketing', date: '2023-10-26', status: 'Draft' }
    ];
    
    // Initialize with all documents
    filteredDocuments = [...allDocuments];
    
    // Update Status Overview counters
    updateStatusOverview();
    
    // Render table with current data
    renderTable();
}

// Update Status Overview counters based on document data
function updateStatusOverview() {
    const totalCount = allDocuments.length;
    const draftCount = allDocuments.filter(doc => doc.status === 'Draft').length;
    const checkedCount = allDocuments.filter(doc => doc.status === 'Checked').length;
    const rejectedCount = allDocuments.filter(doc => doc.status === 'Rejected').length;
    
    // Update the counters in the UI
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('draftCount').textContent = draftCount;
    document.getElementById('checkedCount').textContent = checkedCount;
    document.getElementById('rejectedCount').textContent = rejectedCount;
}

// Render table with current data and pagination
function renderTable() {
    const tableBody = document.getElementById('recentDocs');
    tableBody.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredDocuments.length);
    
    // Update pagination UI
    document.getElementById('startItem').textContent = filteredDocuments.length > 0 ? startIndex + 1 : 0;
    document.getElementById('endItem').textContent = endIndex;
    document.getElementById('totalItems').textContent = filteredDocuments.length;
    document.getElementById('currentPage').textContent = currentPage;
    
    // Disable/enable pagination buttons
    document.getElementById('prevPage').classList.toggle('disabled', currentPage === 1);
    document.getElementById('nextPage').classList.toggle('disabled', endIndex >= filteredDocuments.length);
    
    // If no documents to show
    if (filteredDocuments.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="8" class="p-4 text-center text-gray-500">
                No documents found
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }
    
    // Create table rows
    for (let i = startIndex; i < endIndex; i++) {
        const doc = filteredDocuments[i];
        const row = document.createElement('tr');
        row.classList.add('border-b', 'hover:bg-gray-50');
        
        // Status class based on document status
        let statusClass = '';
        switch(doc.status) {
            case 'Draft':
                statusClass = 'bg-yellow-100 text-yellow-800';
                break;
            case 'Checked':
                statusClass = 'bg-green-100 text-green-800';
                break;
            case 'Rejected':
                statusClass = 'bg-red-100 text-red-800';
                break;
            default:
                statusClass = 'bg-gray-100 text-gray-800';
        }
        
        row.innerHTML = `
            <td class="p-2"><input type="checkbox" class="docCheckbox" data-id="${doc.id}" /></td>
            <td class="p-2">${doc.docNumber}</td>
            <td class="p-2">${doc.settlementNumber}</td>
            <td class="p-2">${doc.requester}</td>
            <td class="p-2">${doc.department}</td>
            <td class="p-2">${doc.date}</td>
            <td class="p-2">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">
                    ${doc.status}
                </span>
            </td>
            <td class="p-2">
                <div class="flex space-x-2">
                    <button class="text-blue-500 hover:text-blue-700" onclick="viewDocument(${doc.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-green-500 hover:text-green-700" onclick="approveDocument(${doc.id})">
                        <i class="fas fa-check-circle"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700" onclick="rejectDocument(${doc.id})">
                        <i class="fas fa-times-circle"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.trim() === '') {
            // If search is empty, show all docs for current tab
            filterDocumentsByTab(currentTab);
        } else {
            // Filter by search term and current tab
            filteredDocuments = allDocuments.filter(doc => {
                const matchesSearch = doc.settlementNumber.toLowerCase().includes(searchTerm) || 
                                    doc.requester.toLowerCase().includes(searchTerm) || 
                                    doc.department.toLowerCase().includes(searchTerm);
                
                if (currentTab === 'all') {
                    return matchesSearch;
                } else {
                    return matchesSearch && doc.status.toLowerCase() === currentTab;
                }
            });
        }
        currentPage = 1; // Reset to first page
        renderTable();
    });
    
    // Select all checkboxes
    document.getElementById('selectAll').addEventListener('change', function(e) {
        const checkboxes = document.querySelectorAll('.docCheckbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    });
    
    // Notification dropdown toggle
    document.getElementById('notificationBtn').addEventListener('click', function() {
        document.getElementById('notificationDropdown').classList.toggle('hidden');
    });
    
    // Close notification dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notificationDropdown');
        const button = document.getElementById('notificationBtn');
        if (!dropdown.contains(e.target) && !button.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

// Switch between tabs (All, Draft)
function switchTab(tab) {
    currentTab = tab;
    currentPage = 1; // Reset to first page
    
    // Update active tab styling
    document.getElementById('allTabBtn').classList.toggle('tab-active', tab === 'all');
    document.getElementById('draftTabBtn').classList.toggle('tab-active', tab === 'draft');
    
    // Filter documents by tab
    filterDocumentsByTab(tab);
    
    // Render table with filtered data
    renderTable();
}

// Filter documents by tab
function filterDocumentsByTab(tab) {
    if (tab === 'all') {
        filteredDocuments = [...allDocuments];
    } else {
        filteredDocuments = allDocuments.filter(doc => doc.status.toLowerCase() === tab);
    }
    
    // Apply any existing search filter
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm.trim() !== '') {
        filteredDocuments = filteredDocuments.filter(doc => 
            doc.settlementNumber.toLowerCase().includes(searchTerm) || 
            doc.requester.toLowerCase().includes(searchTerm) || 
            doc.department.toLowerCase().includes(searchTerm)
        );
    }
}

// Change pagination page
function changePage(direction) {
    const newPage = currentPage + direction;
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderTable();
    }
}

// View document details
function viewDocument(id) {
    // Navigate to document details page
    console.log('Viewing document:', id);
    // In production, redirect to the settlement detail page
    window.location.href = `viewSettlement.html?id=${id}`;
}

// Approve document
function approveDocument(id) {
    console.log('Approving document:', id);
    // Implement approval logic
    // Update status in the data
    const docIndex = allDocuments.findIndex(doc => doc.id === id);
    if (docIndex !== -1) {
        allDocuments[docIndex].status = 'Checked';
        updateStatusOverview(); // Update counters
        filterDocumentsByTab(currentTab); // Re-apply current filters
        renderTable(); // Re-render table
    }
}

// Reject document
function rejectDocument(id) {
    console.log('Rejecting document:', id);
    // Implement rejection logic
    // Update status in the data
    const docIndex = allDocuments.findIndex(doc => doc.id === id);
    if (docIndex !== -1) {
        allDocuments[docIndex].status = 'Rejected';
        updateStatusOverview(); // Update counters
        filterDocumentsByTab(currentTab); // Re-apply current filters
        renderTable(); // Re-render table
    }
}

// Download table as Excel
function downloadExcel() {
    // Create a workbook
    const wb = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const data = [
        ['Doc Number', 'Settlement Number', 'Requester', 'Department', 'Submission Date', 'Status']
    ];
    
    filteredDocuments.forEach(doc => {
        data.push([doc.docNumber, doc.settlementNumber, doc.requester, doc.department, doc.date, doc.status]);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Settlement Documents');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, 'Settlement_Documents.xlsx');
}

// Download table as PDF
function downloadPDF() {
    // Create PDF document
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Settlement Documents', 14, 22);
    
    // Create table data
    const tableData = filteredDocuments.map(doc => [
        doc.docNumber,
        doc.settlementNumber,
        doc.requester,
        doc.department,
        doc.date,
        doc.status
    ]);
    
    // Create table with autotable
    doc.autoTable({
        head: [['Doc Number', 'Settlement Number', 'Requester', 'Department', 'Date', 'Status']],
        body: tableData,
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    // Save PDF
    doc.save('Settlement_Documents.pdf');
}

// Display user info
function displayUserInfo() {
    // Get user info from localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    const userName = userInfo.name || 'User';
    const userIcon = userInfo.profilePic || '../../../../image/user.png';
    
    // Update display
    document.getElementById('userNameDisplay').textContent = userName;
    document.getElementById('dashboardUserIcon').src = userIcon;
}

// Sidebar toggle function
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    sidebar.classList.toggle('sidebar-collapsed');
    sidebarToggle.classList.toggle('toggle-collapsed');
}

// Toggle submenu function
function toggleSubMenu(id) {
    const submenu = document.getElementById(id);
    const allSubmenus = document.querySelectorAll('[id^="Menu"], [id^="Approval"], #settings');
    
    // Close all other submenus
    allSubmenus.forEach(menu => {
        if (menu.id !== id && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            // Reset rotation of chevron
            const chevron = menu.previousElementSibling.querySelector('.fa-chevron-right');
            if (chevron) {
                chevron.classList.remove('rotate-90');
            }
        }
    });
    
    // Toggle current submenu
    submenu.classList.toggle('hidden');
    
    // Rotate chevron
    const chevron = submenu.previousElementSibling.querySelector('.fa-chevron-right');
    if (chevron) {
        chevron.classList.toggle('rotate-90', !submenu.classList.contains('hidden'));
    }
}

// Navigational functions
function goToCheckedDocs() {
    // Filter to show only checked documents
    currentTab = 'checked';
    currentPage = 1;
    filteredDocuments = allDocuments.filter(doc => doc.status === 'Checked');
    renderTable();
}

function goToRejectDocs() {
    // Filter to show only rejected documents
    currentTab = 'rejected';
    currentPage = 1;
    filteredDocuments = allDocuments.filter(doc => doc.status === 'Rejected');
    renderTable();
}

// Logout function
function logout() {
    // Clear user authentication data
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    // Redirect to login page
    window.location.href = '../../../../index.html';
}

// Navigation functions
function goToMenu() {
    window.location.href = '../../../../dashboard/dashboardMenu.html';
}

function goToMenuPR() {
    window.location.href = '../../../../requestPages/purchaseRequest/menuAddPR.html';
}

function goToMenuCheckPR() {
    window.location.href = '../../../../checkPages/purchaseRequest/menuCheckPR.html';
}

function goToMenuAcknowPR() {
    window.location.href = '../../../../acknowledgementPages/purchaseRequest/menuAcknowPR.html';
}

function goToMenuApprovPR() {
    window.location.href = '../../../../approvalPages/purchaseRequest/menuApprovPR.html';
}

function goToMenuReceivePR() {
    window.location.href = '../../../../receivePages/purchaseRequest/menuReceivePR.html';
}

function goToMenuReim() {
    window.location.href = '../../../../requestPages/reimbursement/menuReim.html';
}

function goToMenuCash() {
    window.location.href = '../../../../requestPages/cashAdvance/menuCash.html';
}

function goToMenuSettle() {
    window.location.href = '../../../../requestPages/settlement/menuSettle.html';
}

function goToMenuAPR() {
    window.location.href = '../../../../approvalPages/dashboard/dashboardApprove/PR/menuPRApprove.html';
}

function goToMenuPO() {
    window.location.href = '../../../../approvalPages/dashboard/dashboardApprove/PO/menuPOApprove.html';
}

function goToMenuBanking() {
    window.location.href = '../../../../approvalPages/dashboard/dashboardApprove/outgoing/menuOutgoingApprove.html';
}

function goToMenuInvoice() {
    window.location.href = '../../../../approvalPages/dashboard/dashboardApprove/invoice/menuInvoiceApprove.html';
}

function goToMenuRegist() {
    window.location.href = '../../../../administration/register/menuRegister.html';
}

function goToMenuUser() {
    window.location.href = '../../../../administration/userList/menuUserList.html';
}

function goToMenuRole() {
    window.location.href = '../../../../administration/roleList/menuRoleList.html';
}

function goToProfile() {
    window.location.href = '../../../../profile/menuProfile.html';
}

// Function to check authentication and redirect if not authenticated
function checkAuthentication() {
    if (!isAuthenticated()) {
        // Redirect to login page
        window.location.href = "../../../../login.html";
        return false;
    }
    return true;
}