function loadDashboard() {
    // Fetch status counts and reimbursements from main API
    fetchStatusCounts();
    
    // Fetch reimbursements from API
    fetchReimbursements();
    
    // Setup event listeners
    setupEventListeners();
}

// Variables for pagination and filtering
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let allReimbursements = [];
let currentTab = 'checked'; // Default tab

// Cache and optimization variables
let dataCache = {
    reimbursements: null,
    lastFetch: null,
    cacheExpiry: 5 * 60 * 1000 // 5 minutes
};

let isLoading = false;
let searchInputListener = null;

// Base URL for API calls
const BASE_URL = 'https://expressiv-be-sb.idsdev.site';

// Helper functions for user ID and access token
function getUserId() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    return userInfo.id || null;
}

function getAccessToken() {
    return localStorage.getItem('accessToken') || '';
}

// Core function to determine if document is relevant for acknowledger
function isDocumentRelevantForAcknowledger(doc, userId) {
    // Must be assigned to this acknowledger
    if (doc.acknowledgedBy !== userId) {
        return false;
    }
    
    // Skip if rejected by checker (never reached acknowledger)
    if (doc.rejectedDateByChecker) {
        return false;
    }
    
    // Skip if still in preparation (hasn't been checked yet)
    if (doc.status === 'Prepared' && !doc.checkedDate) {
        return false;
    }
    
    return true;
}

// Function to get document state for acknowledger
function getDocumentStateForAcknowledger(doc, userId) {
    if (!isDocumentRelevantForAcknowledger(doc, userId)) {
        return null;
    }
    
    // Check if waiting for acknowledger action
    if (doc.status === 'Checked' && doc.checkedDate && !doc.acknowledgedDate && !doc.rejectedDateByAcknowledger) {
        return 'checked';
    }
    
    // Check if acknowledged by this user
    if (doc.acknowledgedDate && !doc.rejectedDateByAcknowledger) {
        return 'acknowledged';
    }
    
    // Check if rejected by this user
    if (doc.rejectedDateByAcknowledger) {
        return 'rejected';
    }
    
    return null;
}

// Function to calculate status counts based on document workflow and acknowledger's actual involvement
function calculateStatusCounts(documents, currentUserId) {
    const counts = {
        totalCount: 0,
        checkedCount: 0,
        acknowledgedCount: 0,
        rejectedCount: 0
    };
    
    if (!documents || !Array.isArray(documents) || !currentUserId) {
        return counts;
    }
    
    documents.forEach(doc => {
        const state = getDocumentStateForAcknowledger(doc, currentUserId);
        
        if (state === 'checked') {
            counts.checkedCount++;
            counts.totalCount++;
        } else if (state === 'acknowledged') {
            counts.acknowledgedCount++;
            counts.totalCount++;
        } else if (state === 'rejected') {
            counts.rejectedCount++;
            counts.totalCount++;
        }
    });
    
    return counts;
}

// Function to filter documents by state
function filterDocumentsByState(documents, state, userId) {
    if (!documents || !Array.isArray(documents) || !userId) {
        return [];
    }
    
    return documents.filter(doc => {
        return getDocumentStateForAcknowledger(doc, userId) === state;
    });
}

// Function to handle search
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const searchType = document.getElementById('searchType').value;
    filterReimbursements(searchTerm, currentTab, searchType);
}

// Function to filter reimbursements based on search term, tab, and search type
function filterReimbursements(searchTerm = '', tab = 'checked', searchType = 'pr') {
    filteredData = allReimbursements.filter(item => {
        let searchMatch = true;
        if (searchTerm) {
            if (searchType === 'pr') {
                searchMatch = item.voucherNo && item.voucherNo.toLowerCase().includes(searchTerm);
            } else if (searchType === 'requester') {
                searchMatch = item.requesterName && item.requesterName.toLowerCase().includes(searchTerm);
            } else if (searchType === 'date') {
                const formattedDate = formatDateYYYYMMDD(item.submissionDate);
                searchMatch = formattedDate === searchTerm;
            } else if (searchType === 'status') {
                searchMatch = item.status && item.status.toLowerCase().includes(searchTerm);
            }
        }
        return searchMatch;
    });
    
    // Reset to first page when filtering
    currentPage = 1;
    updateTable();
    updatePagination();
}

// Helper function to format date with local timezone
function formatDateWithLocalTimezone(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
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

// Helper function to get status color class based on status value
function getStatusColorClass(status) {
    switch (status) {
        case 'Prepared':
        case 'Draft':
            return 'bg-yellow-200 text-yellow-800';
        case 'Checked':
            return 'bg-green-200 text-green-800';
        case 'Acknowledged':
            return 'bg-blue-200 text-blue-800';
        case 'Approved':
            return 'bg-purple-200 text-purple-800';
        case 'Received':
            return 'bg-indigo-200 text-indigo-800';
        case 'Rejected':
            return 'bg-red-200 text-red-800';
        case 'Closed':
            return 'bg-gray-200 text-gray-800';
        default:
            return 'bg-gray-200 text-gray-800';
    }
}

// Function to fetch and calculate status counts from main API
function fetchStatusCounts() {
    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found');
        return;
    }
    
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
                // Calculate status counts with proper workflow logic
                const calculatedCounts = calculateStatusCounts(data.data, userId);
                updateStatusCounts(calculatedCounts);
            } else {
                console.error('API returned an error:', data.message);
                displayErrorMessage('Failed to fetch reimbursements data');
            }
        })
        .catch(error => {
            console.error('Error fetching reimbursements data:', error);
            displayErrorMessage('Failed to fetch reimbursements data');
        });
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Setup event listeners with cleanup
function setupEventListeners() {
    // Remove existing listeners if any
    if (searchInputListener) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.removeEventListener('input', searchInputListener);
        }
    }
    
    // Add new listeners
    const debouncedSearch = debounce(handleSearch, 300);
    searchInputListener = debouncedSearch;
    
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');
    
    if (searchInput) {
        searchInput.addEventListener('input', searchInputListener);
    }
    
    // Add event listener for search type dropdown
    if (searchType) {
        searchType.addEventListener('change', function() {
            if (searchInput) {
                const searchTypeValue = this.value;
                
                // Change input type based on search type
                if (searchTypeValue === 'date') {
                    searchInput.type = 'date';
                    searchInput.placeholder = 'Select date...';
                } else {
                    searchInput.type = 'text';
                    searchInput.placeholder = 'Search...';
                }
                
                // Clear the search input when changing search type
                searchInput.value = '';
                
                // Trigger search again when dropdown changes
                const searchTerm = searchInput.value.toLowerCase();
                handleSearch({target: {value: searchTerm}});
            }
        });
    }
}

// Function to fetch reimbursements from API
function fetchReimbursements() {
    // Check cache first
    if (dataCache.reimbursements && 
        dataCache.lastFetch && 
        (Date.now() - dataCache.lastFetch) < dataCache.cacheExpiry) {
        
        // Calculate and update status counts from cached data
        const userId = getUserId();
        if (userId) {
            const calculatedCounts = calculateStatusCounts(dataCache.reimbursements, userId);
            updateStatusCounts(calculatedCounts);
        }
        
        fetchReimbursementsByStatus('checked');
        return;
    }
    
    // Initialize with checked tab data
    fetchReimbursementsByStatus('checked');
}

// Function to fetch reimbursements by status using main API and filter client-side
function fetchReimbursementsByStatus(status) {
    if (isLoading) return;
    
    isLoading = true;
    const userId = getUserId();
    
    if (!userId) {
        console.error('User ID not found');
        isLoading = false;
        return;
    }
    
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
                // Save full data to cache
                dataCache.reimbursements = data.data;
                dataCache.lastFetch = Date.now();
                
                // Calculate and update status counts from full dataset
                const calculatedCounts = calculateStatusCounts(data.data, userId);
                updateStatusCounts(calculatedCounts);
                
                // Filter data by the requested status using proper logic
                allReimbursements = filterDocumentsByState(data.data, status, userId);
                
                const searchInput = document.getElementById('searchInput');
                const searchType = document.getElementById('searchType');
                
                if (searchInput && searchType) {
                    const searchTerm = searchInput.value.toLowerCase();
                    const searchTypeValue = searchType.value;
                    if (searchTerm) {
                        filterReimbursements(searchTerm, status, searchTypeValue);
                    } else {
                        filteredData = allReimbursements;
                        updateTable();
                        updatePagination();
                    }
                } else {
                    filteredData = allReimbursements;
                    updateTable();
                    updatePagination();
                }
            } else {
                console.error('API returned an error:', data.message);
                displayErrorMessage('Failed to fetch reimbursements');
            }
        })
        .catch(error => {
            console.error('Error fetching reimbursements:', error);
            displayErrorMessage('Failed to fetch reimbursements');
        })
        .finally(() => {
            isLoading = false;
        });
}

// Function to update the status counts on the page
function updateStatusCounts(data) {
    const totalCount = document.getElementById("totalCount");
    const checkedCount = document.getElementById("checkedCount");
    const acknowledgedCount = document.getElementById("acknowledgedCount");
    const rejectedCount = document.getElementById("rejectedCount");
    
    if (totalCount) totalCount.textContent = data.totalCount || 0;
    if (checkedCount) checkedCount.textContent = data.checkedCount || 0;
    if (acknowledgedCount) acknowledgedCount.textContent = data.acknowledgedCount || 0;
    if (rejectedCount) rejectedCount.textContent = data.rejectedCount || 0;
}

function toggleSidebar() {
    // No-op function - sidebar toggle is disabled to keep it permanently open
    return;
}

function toggleSubMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (menu) {
        menu.classList.toggle("hidden");
    }
}

// Navigation functions
function goToMenu() { 
    window.location.href = "../../../../pages/dashboard.html"; 
}
function goToAddDoc() {
    window.location.href = "../../../../addPages/addReim.html"; 
}
function goToAddReim() {
    window.location.href = "../../../../addPages/addReim.html"; 
}
function goToAddCash() {
    window.location.href = "../../../../addPages/addCash.html"; 
}
function goToAddSettle() {
    window.location.href = "../../../../addPages/addSettle.html"; 
}
function goToAddPO() {
    window.location.href = "../../../../addPages/addPO.html"; 
}
function goToMenuPR() { 
    window.location.href = "../../../../pages/menuPR.html"; 
}
function goToMenuReim() { 
    window.location.href = "../../../../pages/menuReim.html"; 
}
function goToMenuCash() { 
    window.location.href = "../../../../pages/menuCash.html"; 
}
function goToMenuSettle() { 
    window.location.href = "../../../../pages/menuSettle.html"; 
}
function goToApprovalReport() { 
    window.location.href = "../../../../pages/approval-dashboard.html"; 
}
function goToMenuPO() { 
    window.location.href = "../../../../pages/menuPO.html"; 
}
function goToMenuInvoice() { 
    window.location.href = "../../../../pages/menuInvoice.html"; 
}
function goToMenuBanking() { 
    window.location.href = "../../../../pages/menuBanking.html"; 
}
function logout() { 
    localStorage.removeItem("loggedInUser"); 
    window.location.href = "../../../../pages/login.html"; 
}

// Function to redirect to detail page with reimbursement ID
function detailReim(reimId) {
    window.location.href = `../../../approval/acknowledge/reimbursement/acknowledgeReim.html?reim-id=${reimId}`;
}

// Function to display error message
function displayErrorMessage(message) {
    // Reset counts to zero
    const totalCount = document.getElementById("totalCount");
    const checkedCount = document.getElementById("checkedCount");
    const acknowledgedCount = document.getElementById("acknowledgedCount");
    const rejectedCount = document.getElementById("rejectedCount");
    
    if (totalCount) totalCount.textContent = 0;
    if (checkedCount) checkedCount.textContent = 0;
    if (acknowledgedCount) acknowledgedCount.textContent = 0;
    if (rejectedCount) rejectedCount.textContent = 0;
    
    // Clear table data
    allReimbursements = [];
    filteredData = [];
    updateTable();
    updatePagination();
    
    // Show error message (could be enhanced with a visual error component)
    console.error(message);
}

// Switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    const checkedTabBtn = document.getElementById('checkedTabBtn');
    const acknowledgedTabBtn = document.getElementById('acknowledgedTabBtn');
    const rejectedTabBtn = document.getElementById('rejectedTabBtn');
    
    if (checkedTabBtn) checkedTabBtn.classList.remove('tab-active');
    if (acknowledgedTabBtn) acknowledgedTabBtn.classList.remove('tab-active');
    if (rejectedTabBtn) rejectedTabBtn.classList.remove('tab-active');
    
    if (tabName === 'checked' && checkedTabBtn) {
        checkedTabBtn.classList.add('tab-active');
    } else if (tabName === 'acknowledged' && acknowledgedTabBtn) {
        acknowledgedTabBtn.classList.add('tab-active');
    } else if (tabName === 'rejected' && rejectedTabBtn) {
        rejectedTabBtn.classList.add('tab-active');
    }
    
    // Get the table body for animation effects
    const tableBody = document.getElementById('recentDocs');
    
    if (tableBody) {
        // Add fade-out effect
        tableBody.style.opacity = '0';
        tableBody.style.transform = 'translateY(10px)';
        tableBody.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // Fetch data from specific API endpoint for each tab
        setTimeout(() => {
            fetchReimbursementsByStatus(tabName);
            
            // Add fade-in effect
            setTimeout(() => {
                tableBody.style.opacity = '1';
                tableBody.style.transform = 'translateY(0)';
            }, 50);
        }, 200); // Short delay for the transition effect
    } else {
        fetchReimbursementsByStatus(tabName);
    }
}

// Update the table with current data
function updateTable() {
    const tableBody = document.getElementById('recentDocs');
    const emptyState = document.getElementById('emptyState');
    
    if (!tableBody) return;
    
    // Show/hide empty state
    if (filteredData.length === 0) {
        tableBody.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    } else {
        if (emptyState) emptyState.classList.add('hidden');
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    
    // Use DocumentFragment for batch DOM updates
    const fragment = document.createDocumentFragment();
    
    for (let i = startIndex; i < endIndex; i++) {
        const item = filteredData[i];
        
        let formattedDate = item.submissionDate;
        if (item.submissionDate) {
            formattedDate = formatDateWithLocalTimezone(item.submissionDate);
        }
        
        const displayStatus = item.status;
        
        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-50', 'transition-colors');
        
        row.innerHTML = `
            <td class="p-3 text-gray-900">${startIndex + i + 1}</td>
            <td class="p-3 font-medium text-blue-600 hover:text-blue-800">
                <a href="#" onclick="detailReim('${item.id}')" class="hover:underline">
                    ${item.voucherNo || ''}
                </a>
            </td>
            <td class="p-3 text-gray-900">${item.requesterName || ''}</td>
            <td class="p-3 text-gray-600">${item.department || ''}</td>
            <td class="p-3 text-gray-600">${formattedDate}</td>
            <td class="p-3">
                <span class="px-3 py-1 rounded-full text-xs font-medium ${getStatusColorClass(displayStatus)}">
                    ${displayStatus}
                </span>
            </td>
            <td class="p-3">
                <button class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors font-medium text-sm" onclick="detailReim('${item.id}')">
                    <i class="fas fa-eye mr-1"></i>View Details
                </button>
            </td>
        `;
        
        fragment.appendChild(row);
    }
    
    // Clear and append at once
    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
    
    // Update item count display
    const startItem = document.getElementById('startItem');
    const endItem = document.getElementById('endItem');
    const totalItems = document.getElementById('totalItems');
    
    if (startItem) startItem.textContent = filteredData.length > 0 ? startIndex + 1 : 0;
    if (endItem) endItem.textContent = endIndex;
    if (totalItems) totalItems.textContent = filteredData.length;
    
    // Update last updated timestamp
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated) {
        lastUpdated.textContent = new Date().toLocaleTimeString();
    }
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const currentPageElement = document.getElementById('currentPage');
    if (currentPageElement) currentPageElement.textContent = currentPage;
    
    // Update prev/next button states
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        if (currentPage <= 1) {
            prevBtn.classList.add('disabled');
        } else {
            prevBtn.classList.remove('disabled');
        }
    }
    
    if (nextBtn) {
        if (currentPage >= totalPages) {
            nextBtn.classList.add('disabled');
        } else {
            nextBtn.classList.remove('disabled');
        }
    }
}

// Optimized changePage function with requestAnimationFrame
function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
    }
    
    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
        updateTable();
        updatePagination();
    });
}

// Function to show all documents
function goToTotalDocs() {
    if (dataCache.reimbursements) {
        const userId = getUserId();
        if (userId) {
            // Show all relevant documents for this acknowledger
            const allRelevantDocs = dataCache.reimbursements.filter(doc => 
                isDocumentRelevantForAcknowledger(doc, userId)
            );
            filteredData = allRelevantDocs;
            currentPage = 1;
            updateTable();
            updatePagination();
        }
    }
}

// Export to Excel function
function downloadExcel() {
    // Get status text for filename
    const statusText = currentTab === 'checked' ? 'Checked' : currentTab === 'acknowledged' ? 'Acknowledged' : 'Rejected';
    const fileName = `Reimbursement_${statusText}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    // Prepare data for export
    const data = filteredData.map((item, index) => {
        return {
            'No.': index + 1,
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
    
    // Prepare table data
    const tableColumn = ['No.', 'Reimbursement Number', 'Requester', 'Department', 'Submission Date', 'Status'];
    const tableRows = [];
    
    filteredData.forEach((item, index) => {
        const dataRow = [
            index + 1,
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

// Function to navigate to user profile page
function goToProfile() {
    // Function disabled - no action
    return;
}

// ================= NOTIFICATION SYSTEM =================
let notifiedReims = new Set();
let notificationContainer = null;
let isNotificationVisible = false;

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    const count = notifiedReims.size;
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.textContent = '0';
        badge.classList.add('hidden');
    }
}

function toggleNotificationPanel() {
    if (!notificationContainer) {
        createNotificationPanel();
    }
    
    if (isNotificationVisible) {
        hideNotificationPanel();
    } else {
        showNotificationPanel();
    }
}

function createNotificationPanel() {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.position = 'fixed';
    notificationContainer.style.top = '70px';
    notificationContainer.style.right = '20px';
    notificationContainer.style.zIndex = '9999';
    notificationContainer.style.maxWidth = '350px';
    notificationContainer.style.maxHeight = '400px';
    notificationContainer.style.overflowY = 'auto';
    notificationContainer.style.backgroundColor = 'white';
    notificationContainer.style.borderRadius = '8px';
    notificationContainer.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    notificationContainer.style.border = '1px solid #e5e7eb';
    notificationContainer.style.display = 'none';
    document.body.appendChild(notificationContainer);
}

function showNotificationPanel() {
    if (!notificationContainer) return;
    
    // Update notification content
    updateNotificationContent();
    
    notificationContainer.style.display = 'block';
    isNotificationVisible = true;
}

function hideNotificationPanel() {
    if (!notificationContainer) return;
    notificationContainer.style.display = 'none';
    isNotificationVisible = false;
}

function updateNotificationContent() {
    if (!notificationContainer) return;
    
    if (notifiedReims.size === 0) {
        notificationContainer.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <i class="fas fa-bell-slash text-2xl mb-2"></i>
                <p>No notifications</p>
            </div>
        `;
        return;
    }
    
    let content = `
        <div class="p-3 border-b border-gray-200 bg-gray-50">
            <h3 class="font-semibold text-gray-800">Notifications (${notifiedReims.size})</h3>
        </div>
        <div class="max-h-80 overflow-y-auto">
    `;
    
    // Get notification data from localStorage
    const notificationData = JSON.parse(localStorage.getItem('notificationDataReimAcknow') || '{}');
    
    notifiedReims.forEach(reimNumber => {
        const data = notificationData[reimNumber] || {};
        const submissionDate = data.submissionDate ? new Date(data.submissionDate).toLocaleDateString() : '-';
        
        content += `
            <div class="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900">${data.voucherNo || reimNumber}</div>
                        <div class="text-xs text-gray-600 mt-1">${data.requesterName || 'Unknown'} - ${data.department || 'Unknown'}</div>
                        <div class="text-xs text-gray-500 mt-1">Submitted: ${submissionDate}</div>
                        <div class="inline-block mt-1">
                            <span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">${data.status || 'Checked'}</span>
                        </div>
                    </div>
                    <button onclick="removeNotification('${reimNumber}')" class="ml-2 text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    content += '</div>';
    notificationContainer.innerHTML = content;
}

function showNotification(message, reimNumber) {
    // Save notification data to localStorage
    const notificationData = JSON.parse(localStorage.getItem('notificationDataReimAcknow') || '{}');
    const parts = message.split('-');
    const data = {
        voucherNo: parts[0] || reimNumber,
        requesterName: parts[1] || 'Unknown',
        department: parts[2] || 'Unknown',
        submissionDate: parts[3] || '-',
        status: parts[4] || 'Checked'
    };
    notificationData[reimNumber] = data;
    localStorage.setItem('notificationDataReimAcknow', JSON.stringify(notificationData));
    
    notifiedReims.add(reimNumber);
    updateNotificationBadge();
    
    // Update panel if currently open
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

function removeNotification(reimNumber) {
    // Remove from localStorage
    const notificationData = JSON.parse(localStorage.getItem('notificationDataReimAcknow') || '{}');
    delete notificationData[reimNumber];
    localStorage.setItem('notificationDataReimAcknow', JSON.stringify(notificationData));
    
    notifiedReims.delete(reimNumber);
    updateNotificationBadge();
    
    // Update panel if currently open
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

// Updated polling function with proper workflow logic
async function pollCheckedDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const lastPollData = localStorage.getItem('lastPollDataReimAcknow');
        
        const response = await fetch(`${BASE_URL}/api/reimbursements/acknowledger/${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        
        const data = await response.json();
        if (!data.status || data.code !== 200) return;
        
        const docs = data.data || [];
        const currentDataHash = JSON.stringify(docs.map(d => ({
            id: d.id, 
            status: d.status, 
            checkedDate: d.checkedDate,
            acknowledgedDate: d.acknowledgedDate,
            rejectedDateByAcknowledger: d.rejectedDateByAcknowledger,
            rejectedDateByChecker: d.rejectedDateByChecker
        })));
        
        if (lastPollData !== currentDataHash) {
            localStorage.setItem('lastPollDataReimAcknow', currentDataHash);
            
            // Update status counts from full dataset
            const calculatedCounts = calculateStatusCounts(docs, userId);
            updateStatusCounts(calculatedCounts);
            
            let newReimFound = false;
            
            // Only notify for documents that are actually waiting for this acknowledger's action
            docs.forEach(doc => {
                const state = getDocumentStateForAcknowledger(doc, userId);
                
                if (state === 'checked' && !notifiedReims.has(doc.voucherNo)) {
                    const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                    const message = `${doc.voucherNo}-${doc.requesterName}-${doc.department}-${submissionDate}-${doc.status}`;
                    showNotification(message, doc.voucherNo);
                    newReimFound = true;
                }
            });
            
            if (newReimFound) {
                try {
                    const audio = new Audio('../../../../components/shared/tones.mp3');
                    audio.play();
                } catch (e) {
                    console.warn('Failed to play notification sound:', e);
                }
            }
        }
    } catch (e) {
        console.error('Error polling reimbursements:', e);
    }
}

async function pollAcknowledgedDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        // Use main API endpoint
        const response = await fetch(`${BASE_URL}/api/reimbursements/acknowledger/${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        
        const data = await response.json();
        if (!data.status || data.code !== 200) return;
        
        const docs = data.data || [];
        
        // Create set of reimbursements that are already processed (Acknowledged or Rejected)
        const processedReims = new Set();
        docs.forEach(doc => {
            const state = getDocumentStateForAcknowledger(doc, userId);
            if (state === 'acknowledged' || state === 'rejected') {
                processedReims.add(doc.voucherNo);
            }
        });
        
        // Remove notifications for reimbursements that are already processed
        notifiedReims.forEach(reimNumber => {
            if (processedReims.has(reimNumber)) {
                removeNotification(reimNumber);
            }
        });
    } catch (e) {
        console.error('Error polling processed reimbursements:', e);
    }
}

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    
    // Set user avatar and name if available
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const dashboardUserIcon = document.getElementById('dashboardUserIcon');
    
    if (userInfo.name && userNameDisplay) {
        userNameDisplay.textContent = userInfo.name;
    }
    if (userInfo.avatar && dashboardUserIcon) {
        dashboardUserIcon.src = userInfo.avatar;
    } else if (dashboardUserIcon) {
        // Default avatar if none is set
        dashboardUserIcon.src = "../../../../image/profil.png";
    }
    
    // Add notification polling with delay
    setTimeout(() => {
        pollCheckedDocs();
        pollAcknowledgedDocs();
        updateNotificationBadge();
        
        // Close panel if clicking outside
        const bell = document.getElementById('notificationBell');
        document.addEventListener('click', function(event) {
            if (notificationContainer && 
                !notificationContainer.contains(event.target) && 
                bell && !bell.contains(event.target)) {
                hideNotificationPanel();
            }
        });
    }, 1000); // Delay to ensure DOM is ready
});

// Set up polling interval - poll every 30 seconds
setInterval(() => {
    pollCheckedDocs();
    pollAcknowledgedDocs();
}, 30000); // 30 seconds

// Load dashboard when window loads
window.onload = loadDashboard;