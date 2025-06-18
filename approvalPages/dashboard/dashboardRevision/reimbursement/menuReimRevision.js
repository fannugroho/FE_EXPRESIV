// Global variables
let currentPage = 1;
const itemsPerPage = 10;
let allDocuments = {
    revision: [],
    draft: []
};
let filteredDocuments = [];
let currentTab = 'revision'; // Track the current active tab
let searchQuery = '';
let dateFilter = '';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadUserProfile();
    fetchRevisionData();
    fetchDraftData();
    
    // Initialize the active tab
    switchTab('revision');
    
    // Open the Reimbursement submenu by default
    setTimeout(() => {
        document.getElementById('MenuReimbursement').classList.remove('hidden');
    }, 500);
});

// Authentication and profile functions
function loadUserProfile() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        document.getElementById('userNameDisplay').textContent = userData.name || 'User';
        
        // Set user avatar if available
        if (userData.profilePicture) {
            document.getElementById('dashboardUserIcon').src = userData.profilePicture;
        } else {
            document.getElementById('dashboardUserIcon').src = '../../../../image/profil.png';
        }
    }
}

// Check authentication
function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../../../pages/login.html';
    }
}

// Fetch revision data from API
function fetchRevisionData() {
    const apiUrl = 'https://expressiv-api.kansaipaint.co.id/api/reimbursement/revision';
    const token = localStorage.getItem('token');
    
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Store revision documents
        allDocuments.revision = data.data || [];
        
        // Update the revision count
        document.getElementById('revisionCount').textContent = allDocuments.revision.length;
        
        // If revision is the current tab, update the display
        if (currentTab === 'revision') {
            filteredDocuments = [...allDocuments.revision];
            displayDocuments();
        }
    })
    .catch(error => {
        console.error('Error fetching revision data:', error);
        showNotification('Error fetching revision data. Please try again.', 'error');
        
        // Use sample data for testing
        allDocuments.revision = generateSampleData('revision', 5);
        document.getElementById('revisionCount').textContent = allDocuments.revision.length;
        
        if (currentTab === 'revision') {
            filteredDocuments = [...allDocuments.revision];
            displayDocuments();
        }
    });
}

// Fetch draft data from API
function fetchDraftData() {
    const apiUrl = 'https://expressiv-api.kansaipaint.co.id/api/reimbursement/draft';
    const token = localStorage.getItem('token');
    
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Store draft documents
        allDocuments.draft = data.data || [];
        
        // Update the draft count
        document.getElementById('draftCount').textContent = allDocuments.draft.length;
        
        // If draft is the current tab, update the display
        if (currentTab === 'draft') {
            filteredDocuments = [...allDocuments.draft];
            displayDocuments();
        }
    })
    .catch(error => {
        console.error('Error fetching draft data:', error);
        showNotification('Error fetching draft data. Please try again.', 'error');
        
        // Use sample data for testing
        allDocuments.draft = generateSampleData('draft', 3);
        document.getElementById('draftCount').textContent = allDocuments.draft.length;
        
        if (currentTab === 'draft') {
            filteredDocuments = [...allDocuments.draft];
            displayDocuments();
        }
    });
}

// Generate sample data for testing
function generateSampleData(type, count) {
    const sampleData = [];
    const status = type === 'revision' ? 'Revision' : 'Draft';
    
    for (let i = 1; i <= count; i++) {
        sampleData.push({
            docId: `doc-${type}-${i}`,
            docNumber: `DOC-${type.toUpperCase()}-${i}`,
            reimNumber: `REIM-${type.toUpperCase()}-${i}`,
            requesterName: `User ${i}`,
            department: `Department ${i % 3 + 1}`,
            submissionDate: new Date(2023, i % 12, i % 28 + 1).toISOString(),
            status: status
        });
    }
    
    return sampleData;
}

// Display documents based on the current page and tab
function displayDocuments() {
    const tableBody = document.getElementById('recentDocs');
    tableBody.innerHTML = '';
    
    // Calculate start and end indices for pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredDocuments.length);
    
    // Update pagination info
    document.getElementById('startItem').textContent = filteredDocuments.length > 0 ? startIndex + 1 : 0;
    document.getElementById('endItem').textContent = endIndex;
    document.getElementById('totalItems').textContent = filteredDocuments.length;
    document.getElementById('currentPage').textContent = currentPage;
    
    // Enable/disable pagination buttons
    document.getElementById('prevPage').classList.toggle('disabled', currentPage === 1);
    document.getElementById('nextPage').classList.toggle('disabled', endIndex >= filteredDocuments.length);
    
    // If no documents, show a message
    if (filteredDocuments.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" class="p-4 text-center text-gray-500">No ${currentTab} documents found</td>
        `;
        tableBody.appendChild(row);
        return;
    }
    
    // Display documents for the current page
    for (let i = startIndex; i < endIndex; i++) {
        const doc = filteredDocuments[i];
        const row = document.createElement('tr');
        row.className = i % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        
        // Format date
        const submissionDate = new Date(doc.submissionDate).toLocaleDateString('en-GB');
        
        // Set status class based on current tab
        const statusClass = currentTab === 'revision' 
            ? 'bg-yellow-100 text-yellow-800' 
            : 'bg-gray-100 text-gray-800';
        
        row.innerHTML = `
            <td class="p-2 border">${doc.docNumber || '-'}</td>
            <td class="p-2 border">${doc.reimNumber || '-'}</td>
            <td class="p-2 border">${doc.requesterName || '-'}</td>
            <td class="p-2 border">${doc.department || '-'}</td>
            <td class="p-2 border">${submissionDate}</td>
            <td class="p-2 border">
                <span class="px-2 py-1 rounded text-xs font-semibold ${statusClass}">
                    ${currentTab === 'revision' ? 'Revision' : 'Draft'}
                </span>
            </td>
            <td class="p-2 border">
                <button onclick="viewDocument('${doc.docId}')" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editDocument('${doc.docId}')" class="text-green-600 hover:text-green-800">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    }
}

// Change page for pagination
function changePage(direction) {
    const newPage = currentPage + direction;
    const maxPage = Math.ceil(filteredDocuments.length / itemsPerPage);
    
    if (newPage >= 1 && newPage <= maxPage) {
        currentPage = newPage;
        displayDocuments();
    }
}

// Apply search and date filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const dateFilter = document.getElementById('dateFilter').value;
    
    // Get documents based on current tab
    const currentDocuments = allDocuments[currentTab];
    
    filteredDocuments = currentDocuments.filter(doc => {
        // Search term filter
        const matchesSearch = !searchTerm || 
            (doc.docNumber && doc.docNumber.toLowerCase().includes(searchTerm)) ||
            (doc.reimNumber && doc.reimNumber.toLowerCase().includes(searchTerm)) ||
            (doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm)) ||
            (doc.department && doc.department.toLowerCase().includes(searchTerm));
        
        // Date filter
        let matchesDate = true;
        if (dateFilter) {
            const filterDate = new Date(dateFilter).setHours(0, 0, 0, 0);
            const docDate = new Date(doc.submissionDate).setHours(0, 0, 0, 0);
            matchesDate = filterDate === docDate;
        }
        
        return matchesSearch && matchesDate;
    });
    
    // Reset to first page and display
    currentPage = 1;
    displayDocuments();
}

// Reset all filters
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('dateFilter').value = '';
    
    filteredDocuments = [...allDocuments[currentTab]];
    currentPage = 1;
    displayDocuments();
}

// Switch between tabs
function switchTab(tabName) {
    console.log(`Switching to tab: ${tabName}`); // Debug log
    
    // Update the current tab
    currentTab = tabName;
    
    // Update UI to show active tab
    if (tabName === 'revision') {
        document.getElementById('revisionTabBtn').classList.add('tab-active');
        document.getElementById('draftTabBtn').classList.remove('tab-active');
        filteredDocuments = [...allDocuments.revision];
    } else if (tabName === 'draft') {
        document.getElementById('draftTabBtn').classList.add('tab-active');
        document.getElementById('revisionTabBtn').classList.remove('tab-active');
        filteredDocuments = [...allDocuments.draft];
    }
    
    // Apply any existing filters
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const dateFilter = document.getElementById('dateFilter').value;
    
    if (searchTerm || dateFilter) {
        applyFilters();
    } else {
        // Reset to first page and display documents for selected tab
        currentPage = 1;
        displayDocuments();
    }
}

// View document details
function viewDocument(docId) {
    // Store the document ID in localStorage for the detail page
    localStorage.setItem('currentDocId', docId);
    localStorage.setItem('previousPage', 'menuReimRevision');
    
    // Navigate to the detail page
    window.location.href = '../../../../detailPages/detailReim.html';
}

// Edit document (for both revision and draft)
function editDocument(docId) {
    // Store the document ID in localStorage for the edit page
    localStorage.setItem('currentDocId', docId);
    localStorage.setItem('isRevision', currentTab === 'revision' ? 'true' : 'false');
    localStorage.setItem('isDraft', currentTab === 'draft' ? 'true' : 'false');
    localStorage.setItem('previousPage', 'menuReimRevision');
    
    // Navigate to the add/edit reimbursement page
    window.location.href = '../../../../addPages/addReim.html';
}

// Download data as Excel
function downloadExcel() {
    if (filteredDocuments.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    // Prepare data for Excel
    const excelData = filteredDocuments.map(doc => {
        return {
            'Document Number': doc.docNumber || '-',
            'Reimbursement Number': doc.reimNumber || '-',
            'Requester': doc.requesterName || '-',
            'Department': doc.department || '-',
            'Submission Date': new Date(doc.submissionDate).toLocaleDateString('en-GB'),
            'Status': currentTab === 'revision' ? 'Revision' : 'Draft'
        };
    });
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Reimbursement ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}`);
    
    // Generate Excel file
    const fileName = `Reimbursement_${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// Download data as PDF
function downloadPDF() {
    if (filteredDocuments.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    const title = `Reimbursement ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} Report`;
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 30);
    
    // Prepare table data
    const tableColumn = ['Doc Number', 'Reim Number', 'Requester', 'Department', 'Date', 'Status'];
    const tableRows = filteredDocuments.map(doc => [
        doc.docNumber || '-',
        doc.reimNumber || '-',
        doc.requesterName || '-',
        doc.department || '-',
        new Date(doc.submissionDate).toLocaleDateString('en-GB'),
        currentTab === 'revision' ? 'Revision' : 'Draft'
    ]);
    
    // Generate table
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        }
    });
    
    // Save PDF
    const fileName = `Reimbursement_${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

// Sidebar toggle function
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
    sidebar.classList.toggle('-translate-x-full');
}

// Toggle submenu function
function toggleSubMenu(id) {
    const subMenu = document.getElementById(id);
    const isHidden = subMenu.classList.contains('hidden');
    
    // Close all submenus first
    document.querySelectorAll('aside div[id]').forEach(menu => {
        if (menu.id !== id) {
            menu.classList.add('hidden');
        }
    });
    
    // Toggle the clicked submenu
    subMenu.classList.toggle('hidden', !isHidden);
}

// Show notification function
function showNotification(message, type = 'info') {
    // Check if notification container exists
    let notifContainer = document.getElementById('notification-container');
    
    // If not, create it
    if (!notifContainer) {
        notifContainer = document.createElement('div');
        notifContainer.id = 'notification-container';
        notifContainer.className = 'fixed top-5 right-5 z-50 flex flex-col gap-3';
        document.body.appendChild(notifContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `p-4 rounded-lg shadow-lg flex items-center justify-between max-w-xs transform transition-all duration-500 ease-in-out translate-x-0`;
    
    // Set color based on type
    switch (type) {
        case 'success':
            notification.classList.add('bg-green-500', 'text-white');
            break;
        case 'error':
            notification.classList.add('bg-red-500', 'text-white');
            break;
        case 'warning':
            notification.classList.add('bg-yellow-500', 'text-white');
            break;
        default:
            notification.classList.add('bg-blue-500', 'text-white');
    }
    
    // Add content
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            </span>
            <span>${message}</span>
        </div>
        <button class="ml-4 text-white focus:outline-none" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    notifContainer.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
}

// Navigation functions
function goToMenu() {
    window.location.href = '../../../../pages/dashboard.html';
}

function goToMenuPR() {
    window.location.href = '../../../../pages/menuPR.html';
}

function goToMenuReim() {
    window.location.href = '../../../../pages/menuReim.html';
}

function goToMenuCash() {
    window.location.href = '../../../../pages/menuCash.html';
}

function goToMenuSettle() {
    window.location.href = '../../../../pages/menuSettle.html';
}

function goToMenuCheckPR() {
    window.location.href = '../../dashboardCheck/purchaseRequest/menuPRCheck.html';
}

function goToMenuCheckReim() {
    window.location.href = '../../dashboardCheck/reimbursement/menuReimCheck.html';
}

function goToMenuCheckCash() {
    window.location.href = '../../dashboardCheck/cashAdvance/menuCashCheck.html';
}

function goToMenuAcknowPR() {
    window.location.href = '../../dashboardAcknowledge/purchaseRequest/menuPRAcknow.html';
}

function goToMenuAcknowReim() {
    window.location.href = '../../dashboardAcknowledge/reimbursement/menuReimAcknow.html';
}

function goToMenuAcknowCash() {
    window.location.href = '../../dashboardAcknowledge/cashAdvance/menuCashAcknow.html';
}

function goToMenuApprovPR() {
    window.location.href = '../../dashboardApprove/purchaseRequest/menuPRApprove.html';
}

function goToMenuApprovReim() {
    window.location.href = '../../dashboardApprove/reimbursement/menuReimApprove.html';
}

function goToMenuApprovCash() {
    window.location.href = '../../dashboardApprove/cashAdvance/menuCashApprove.html';
}

function goToMenuReceivePR() {
    window.location.href = '../../dashboardReceive/purchaseRequest/menuPRReceive.html';
}

function goToMenuReceiveReim() {
    window.location.href = '../../dashboardReceive/reimbursement/menuReimReceive.html';
}

function goToMenuReceiveCash() {
    window.location.href = '../../dashboardReceive/cashAdvance/menuCashReceive.html';
}

function goToMenuReceiveSettle() {
    window.location.href = '../../dashboardReceive/settlement/menuSettleReceive.html';
}

function goToMenuRevisionReim() {
    window.location.href = '../../dashboardRevision/reimbursement/menuReimRevision.html';
}

function goToMenuRegist() {
    window.location.href = '../../../../pages/register.html';
}

function goToMenuUser() {
    window.location.href = '../../../../pages/dashboard-users.html';
}

function goToMenuRole() {
    window.location.href = '../../../../pages/dashboard-roles.html';
}

function goToProfile() {
    window.location.href = '../../../../pages/profil.html';
}

function goToMenuAPR() {
    window.location.href = '../../../../decisionReportApproval/dashboardApprove/purchaseRequest/menuPRApprove.html';
}

function goToMenuPO() {
    // Placeholder for future implementation
    alert('PO Approval page is under development');
}

function goToMenuBanking() {
    // Placeholder for future implementation
    alert('Outgoing Approval page is under development');
}

function goToMenuInvoice() {
    // Placeholder for future implementation
    alert('AR Invoice Approval page is under development');
}

function goToTotalDocs() {
    // This is for the mobile navigation
    // We'll keep the current tab
}