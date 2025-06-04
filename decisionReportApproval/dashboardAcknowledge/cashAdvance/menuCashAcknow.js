// Using BASE_URL from auth.js instead of hardcoded baseUrl
async function loadDashboard() {
    try {
        const response = await fetch(`${BASE_URL}/api/cash-advance`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // Check for different possible structures in the API response
        let cashAdvances = [];
        if (data.status && data.data) {
            cashAdvances = data.data;
        } else if (Array.isArray(data)) {
            cashAdvances = data;
        } else {
            console.error('Unexpected API response structure:', data);
            useSampleData();
            switchTab(currentTab);
            return;
        }
        
        allCashAdvances = cashAdvances;
        
        // Update dashboard counts
        updateStatusCounts({
            totalCount: cashAdvances.length,
            checkedCount: cashAdvances.filter(doc => doc.status === "Checked").length,
            acknowledgeCount: cashAdvances.filter(doc => doc.status === "Acknowledge").length,
            rejectedCount: cashAdvances.filter(doc => doc.status === "Rejected").length
        });
        
        // Apply initial filtering based on current tab
        switchTab(currentTab);
    } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to sample data
        useSampleData();
        switchTab(currentTab);
    }
    
    // Set up notification dropdown
    setupNotificationDropdown();
    
    // Load user profile
    loadUserProfileInfo();
}

// Variables for pagination and filtering
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allCashAdvances = [];
let currentTab = 'checked'; // Default tab is now 'checked' which corresponds to Checked status

// Function to fetch status counts from API
async function fetchStatusCounts() {
    try {
        const response = await fetch(`${BASE_URL}/api/cashadvances/status-counts`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        if (data.status && data.code === 200) {
            updateStatusCounts(data.data);
        } else {
            console.error('API returned an error:', data.message);
        }
    } catch (error) {
        console.error('Error fetching status counts:', error);
        // Fallback to sample data if API fails
        updateSampleCounts();
    }
}

// Function to fetch cash advances from API
async function fetchCashAdvances() {
    try {
        const response = await fetch(`${BASE_URL}/api/cashadvances`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        if (data.status && data.code === 200) {
            allCashAdvances = data.data;
            filteredCashAdvances = [...allCashAdvances];
            displayCashAdvances(filteredCashAdvances);
        } else {
            console.error('API returned an error:', data.message);
            // Use sample data if API fails
            useSampleData();
            switchTab(currentTab);
        }
    } catch (error) {
        console.error('Error fetching cash advances:', error);
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
function updateStatusCounts(documents) {
    const totalCount = documents.length;
    const checkedCount = documents.filter(doc => doc.status === "Checked").length;
    const acknowledgedCount = documents.filter(doc => doc.status === "Acknowledged").length;
    const rejectedCount = documents.filter(doc => doc.status === "Rejected").length;
    
    document.getElementById("totalCount").textContent = totalCount;
    document.getElementById("checkedCount").textContent = checkedCount;
    document.getElementById("acknowledgedCount").textContent = acknowledgedCount;
    document.getElementById("rejectedCount").textContent = rejectedCount;
}

// Set up events for tab switching and pagination
function setupTabsAndPagination() {
    // Tab switching and pagination setup only
    // No checkbox functionality needed
}

// Setup notification dropdown functionality
function setupNotificationDropdown() {
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
}

// Load user profile information
function loadUserProfileInfo() {
    // Try to get logged in user from localStorage
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    
    if (loggedInUser) {
        // Display user name if available
        if (document.getElementById('userNameDisplay')) {
            document.getElementById('userNameDisplay').textContent = loggedInUser.name || loggedInUser.username || 'User';
        }
        
        // Set user avatar if available, otherwise use default
        if (document.getElementById('dashboardUserIcon')) {
            if (loggedInUser.profilePicture) {
                document.getElementById('dashboardUserIcon').src = loggedInUser.profilePicture;
            } else {
                // Default avatar - can be replaced with actual default image path
                document.getElementById('dashboardUserIcon').src = "../../../../image/default-avatar.png";
            }
        }
    } else {
        // If no user found, set default values
        if (document.getElementById('userNameDisplay')) {
            document.getElementById('userNameDisplay').textContent = 'Guest User';
        }
        if (document.getElementById('dashboardUserIcon')) {
            document.getElementById('dashboardUserIcon').src = "../../../../image/default-avatar.png";
        }
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Navigation functions
function goToMenu() { window.location.href = "../../../../Menu.html"; }
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
    switchTab('checked'); 
}

// Function to navigate to user profile page
function goToProfile() {
    window.location.href = "../../../../pages/profil.html";
}

// Function to redirect to detail page with cash advance ID
function detailCash(caId) {
    window.location.href = `../../../../detailPages/detailCash.html?ca-id=${caId}`;
}

// Sample data for testing when API is not available
let sampleData = [];
function generateSampleData() {
    sampleData = [];
    for (let i = 1; i <= 35; i++) {
        // For acknowledgment page, we focus on Checked, Acknowledged and Rejected statuses
        let status;
        if (i <= 20) {
            status = 'Checked';
        } else if (i <= 30) {
            status = 'Acknowledged';
        } else {
            status = 'Rejected';
        }
        
        sampleData.push({
            id: `CA${i.toString().padStart(5, '0')}`,
            cashAdvanceNo: `CA-${2000 + i}`,
            requesterName: `User ${i}`,
            departmentName: `Department ${(i % 5) + 1}`,
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
    document.getElementById("checkedCount").textContent = data.filter(item => item.status === 'Checked').length;
    document.getElementById("acknowledgedCount").textContent = data.filter(item => item.status === 'Acknowledged').length;
    document.getElementById("rejectedCount").textContent = data.filter(item => item.status === 'Rejected').length;
}

// Switch between Checked and Acknowledged tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('draftTabBtn').classList.remove('tab-active');
    document.getElementById('checkedTabBtn').classList.remove('tab-active');
    if (document.getElementById('rejectedTabBtn')) {
        document.getElementById('rejectedTabBtn').classList.remove('tab-active');
    }
    
    if (tabName === 'checked') {
        document.getElementById('draftTabBtn').classList.add('tab-active');
        filteredData = allCashAdvances.filter(item => item.status === 'Checked');
    } else if (tabName === 'acknowledged') {
        document.getElementById('checkedTabBtn').classList.add('tab-active');
        filteredData = allCashAdvances.filter(item => item.status === 'Acknowledged');
    } else if (tabName === 'rejected') {
        document.getElementById('rejectedTabBtn').classList.add('tab-active');
        filteredData = allCashAdvances.filter(item => item.status === 'Rejected');
    }
    
    // Update table and pagination
    updateTable();
    updatePagination();
}

// Helper function to get status styling
function getStatusClass(status) {
    switch(status) {
        case 'Checked': return 'bg-yellow-200 text-yellow-800';
        case 'Acknowledged': return 'bg-green-200 text-green-800';
        case 'Rejected': return 'bg-red-200 text-red-800';
        default: return 'bg-gray-200 text-gray-800';
    }
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
        let formattedDate = '';
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
                <span class="px-2 py-1 rounded-full text-xs ${getStatusClass(item.status)}">
                    ${item.status || ''}
                </span>
            </td>
            <td class="p-2">
                <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600" onclick="detailCash('${item.id || ''}')">
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
async function downloadExcel() {
    try {
        const response = await fetch(`${BASE_URL}/api/cash-advance`);
        
        const data = await response.json();
        
        // Check for different possible structures in the API response
        let cashAdvances = [];
        if (data.status && data.data) {
            cashAdvances = data.data;
        } else if (Array.isArray(data)) {
            cashAdvances = data;
        }
        
        if (cashAdvances.length > 0) {
            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            
            // Convert data to appropriate format for Excel
            const excelData = cashAdvances.map(item => ({
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
            XLSX.writeFile(wb, `Cash_Advance_${new Date().toISOString().split('T')[0]}.xlsx`);
        } else {
            alert('No data available to export.');
        }
    } catch (error) {
        console.error('Error downloading Excel:', error);
        alert('Failed to download Excel file. Please try again.');
    }
}

// Download as PDF
async function downloadPDF() {
    try {
        const response = await fetch(`${BASE_URL}/api/cash-advance`);
        
        const data = await response.json();
        
        // Check for different possible structures in the API response
        let cashAdvances = [];
        if (data.status && data.data) {
            cashAdvances = data.data;
        } else if (Array.isArray(data)) {
            cashAdvances = data;
        }
        
        if (cashAdvances.length > 0) {
            // Initialize jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set title
            doc.text('Cash Advance Report', 14, 16);
            
            // Prepare data for table
            const tableColumn = ["Cash Advance Number", "Requester", "Department", "Date", "Status"];
            const tableRows = [];
            
            // Add data rows
            cashAdvances.forEach(item => {
                const formattedDate = item.submissionDate ? new Date(item.submissionDate).toLocaleDateString() : '';
                const dataRow = [
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
            doc.save(`Cash_Advance_${new Date().toISOString().split('T')[0]}.pdf`);
        } else {
            alert('No data available to export.');
        }
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF file. Please try again.');
    }
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', loadDashboard); 