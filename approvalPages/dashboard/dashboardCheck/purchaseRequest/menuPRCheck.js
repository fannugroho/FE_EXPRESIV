// Current tab state
let currentTab = 'prepared'; // Default tab
let currentSearchTerm = '';
let currentSearchType = 'pr';


// Helper function to get access token
// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    
    // Add event listener for search input with debouncing
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearch();
            }, 500); // Debounce search by 500ms
        });
    }
    
    // Add event listener to the search type dropdown
    const searchType = document.getElementById('searchType');
    if (searchType) {
        searchType.addEventListener('change', function() {
            const searchInput = document.getElementById('searchInput');
            
            // Update input type and placeholder based on search type
            if (this.value === 'date') {
                searchInput.type = 'date';
                searchInput.placeholder = 'Select date...';
            } else {
                searchInput.type = 'text';
                searchInput.placeholder = `Search by ${this.options[this.selectedIndex].text}...`;
            }
            
            // Clear current search and trigger new search
            searchInput.value = '';
            currentSearchTerm = '';
            currentSearchType = this.value;
            loadDashboard();
        });
    }


});

async function loadDashboard() {
    try {
        // Get user ID for approver ID
        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }

        // Build base URL and params
        let baseUrl;
        const params = new URLSearchParams();
        params.append('ApproverId', userId);
        params.append('ApproverRole', 'checked');
        
        // Build URL based on current tab
        if (currentTab === 'prepared') {
            baseUrl = `${BASE_URL}/api/pr/dashboard/approval`;
            params.append('isApproved', 'false');
        } else if (currentTab === 'checked') {
            baseUrl = `${BASE_URL}/api/pr/dashboard/approval`;
            params.append('isApproved', 'true');
        } else if (currentTab === 'rejected') {
            baseUrl = `${BASE_URL}/api/pr/dashboard/rejected`;
        }
        
        // Add search parameters if available
        if (currentSearchTerm) {
            switch (currentSearchType) {
                case 'pr':
                    params.append('purchaseRequestNo', currentSearchTerm);
                    break;
                case 'requester':
                    params.append('requesterName', currentSearchTerm);
                    break;
                case 'status':
                    params.append('status', currentSearchTerm);
                    break;
                case 'date':
                    // For date search, try to parse and use date range
                    const dateValue = new Date(currentSearchTerm);
                    if (!isNaN(dateValue.getTime())) {
                        params.append('submissionDateFrom', dateValue.toISOString().split('T')[0]);
                        params.append('submissionDateTo', dateValue.toISOString().split('T')[0]);
                    }
                    break;
            }
        }
        
        const url = `${baseUrl}?${params.toString()}`;

        console.log('Fetching dashboard data from:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Dashboard API response:', result);

        if (result.status && result.data) {
            const documents = result.data;
            
            // Sort documents by PR Number (running number) - newest first
            const sortedDocuments = sortDocumentsByPRNumber(documents);
            
            // Update counters by fetching all statuses
            await updateCounters(userId);
            
            // Update the table with filtered documents
            updateTable(sortedDocuments);
            
            // Update pagination info
            updatePaginationInfo(sortedDocuments.length);
        } else {
            console.error('API response error:', result.message);
            // Fallback to empty state
            updateTable([]);
            updatePaginationInfo(0);
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Failed to load dashboard data. Please try again.');
        
        // Fallback to empty state
        updateTable([]);
        updatePaginationInfo(0);
    }
}

// Function to update counters by fetching data for all statuses
async function updateCounters(userId) {
    try {
        // Fetch counts for each status using new API endpoints
        const preparedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const checkedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const rejectedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/rejected?ApproverId=${userId}&ApproverRole=checked`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const preparedData = preparedResponse.ok ? await preparedResponse.json() : { data: [] };
        const checkedData = checkedResponse.ok ? await checkedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };

        const preparedCount = preparedData.data ? preparedData.data.length : 0;
        const checkedCount = checkedData.data ? checkedData.data.length : 0;
        const rejectedCount = rejectedData.data ? rejectedData.data.length : 0;
        const totalCount = preparedCount + checkedCount + rejectedCount;

        // Update counters
        document.getElementById("totalCount").textContent = totalCount;
        document.getElementById("draftCount").textContent = preparedCount;
        document.getElementById("checkedCount").textContent = checkedCount;
        document.getElementById("rejectedCount").textContent = rejectedCount;
        
    } catch (error) {
        console.error('Error updating counters:', error);
        // Set counters to 0 on error
        document.getElementById("totalCount").textContent = '0';
        document.getElementById("draftCount").textContent = '0';
        document.getElementById("checkedCount").textContent = '0';
        document.getElementById("rejectedCount").textContent = '0';
    }
}

// Function to sort documents by PR Number (running number) - newest first
function sortDocumentsByPRNumber(documents) {
    return documents.sort((a, b) => {
        // Extract running number from PR Number
        const getRunningNumber = (prNumber) => {
            if (!prNumber) return 0;
            
            // Try to extract numeric part from PR Number
            // Assuming PR Number format like "PR-2024-001", "PR2024001", etc.
            const numericMatch = prNumber.toString().match(/\d+/g);
            if (numericMatch && numericMatch.length > 0) {
                // Join all numeric parts and convert to number
                return parseInt(numericMatch.join(''));
            }
            
            // If no numeric part found, use the entire string as fallback
            return prNumber.toString().localeCompare(b.purchaseRequestNo || '');
        };
        
        const runningNumberA = getRunningNumber(a.purchaseRequestNo);
        const runningNumberB = getRunningNumber(b.purchaseRequestNo);
        
        // Sort in descending order (newest/highest number first)
        return runningNumberB - runningNumberA;
    });
}

// Function to update the table with documents
function updateTable(documents) {
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    
    if (documents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="10" class="text-center p-4">No documents found</td></tr>`;
    } else {
        documents.forEach((doc, index) => {
            // Format dates
            const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
            const requiredDate = doc.requiredDate ? new Date(doc.requiredDate).toLocaleDateString() : '-';
            
            // Check if fields are longer than 10 characters and apply scrollable class
            const docNumberClass = (index + 1).toString().length > 10 ? 'scrollable-cell' : '';
            const prNumberClass = doc.purchaseRequestNo && doc.purchaseRequestNo.length > 10 ? 'scrollable-cell' : '';
            const requesterNameClass = doc.requesterName && doc.requesterName.length > 10 ? 'scrollable-cell' : '';
            const departmentClass = doc.departmentName && doc.departmentName.length > 10 ? 'scrollable-cell' : '';
            const poNumberClass = doc.poNumber && doc.poNumber.length > 10 ? 'scrollable-cell' : '';
            
            const row = `<tr class='w-full border-b'>
                <td class='p-2'>
                    <div class="${docNumberClass}">${index + 1}</div>
                </td>
                <td class='p-2'>
                    <div class="${prNumberClass}">${doc.purchaseRequestNo || '-'}</div>
                </td>
                <td class='p-2'>
                    <div class="${requesterNameClass}">${doc.requesterName || '-'}</div>
                </td>
                <td class='p-2'>
                    <div class="${departmentClass}">${doc.departmentName || '-'}</div>
                </td>
                <td class='p-2'>${submissionDate}</td>
                <td class='p-2'>${requiredDate}</td>
                <td class='p-2'>
                    <div class="${poNumberClass}">${doc.poNumber || '-'}</div>
                </td>
                <td class='p-2'><span class="px-2 py-1 rounded-full text-xs ${getStatusClass(doc.status)}">${doc.status}</span></td>
                <td class='p-2'>
                    <button onclick="detailDoc('${doc.id}', '${doc.prType}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
                </td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    }
}

// Function to switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update active tab styling
    document.querySelectorAll('.tab-active').forEach(el => el.classList.remove('tab-active'));
    
    if (tabName === 'prepared') {
        document.getElementById('draftTabBtn').classList.add('tab-active');
    } else if (tabName === 'checked') {
        document.getElementById('checkedTabBtn').classList.add('tab-active');
    } else if (tabName === 'rejected') {
        document.getElementById('rejectedTabBtn').classList.add('tab-active');
    }
    
    // Reset search when switching tabs
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        currentSearchTerm = '';
    }
    
    // Reload dashboard with the new filter
    loadDashboard();
}

// Function to handle search input
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    currentSearchTerm = searchInput ? searchInput.value.trim() : '';
    currentSearchType = document.getElementById('searchType').value;
    loadDashboard();
}

// Helper function to get status styling
function getStatusClass(status) {
    switch(status) {
        case 'Prepared': return 'bg-yellow-100 text-yellow-800';
        case 'Draft': return 'bg-yellow-100 text-yellow-800';
        case 'Checked': return 'bg-green-100 text-green-800';
        case 'Acknowledge': return 'bg-blue-100 text-blue-800';
        case 'Approved': return 'bg-indigo-100 text-indigo-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        case 'Reject': return 'bg-red-100 text-red-800';
        case 'Close': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Update pagination information
function updatePaginationInfo(totalItems) {
    document.getElementById('totalItems').textContent = totalItems;
    
    // For simplicity, we're not implementing actual pagination yet
    // This would need to be expanded for real pagination
    document.getElementById('startItem').textContent = totalItems > 0 ? 1 : 0;
    document.getElementById('endItem').textContent = totalItems;
}

// Pagination handlers (placeholder for now)
function changePage(direction) {
    // This would be implemented for actual pagination
    console.log(`Change page: ${direction}`);
}

// Function to navigate to total documents page
function goToTotalDocs() {
    // This would navigate to the total documents view
    console.log('Navigate to total documents view');
}

function updateDoc(id) {
    alert(`Update document: ${id}`);
}

function deleteDoc(id) {
    if (confirm("Are you sure you want to delete this document?")) {
        let documents = JSON.parse(localStorage.getItem("documents")) || [];
        documents = documents.filter(doc => doc.id !== id);
        localStorage.setItem("documents", JSON.stringify(documents));
        loadDashboard(); // Refresh tabel setelah menghapus
    }
}

function editDoc(detail) {
    alert("Edit Document: " + detail);
    // Di sini kamu bisa menambahkan kode untuk membuka modal edit atau halaman edit
}

function detailDoc(id, prType) {
    window.location.href = `../../../approval/check/purchaseRequest/checkedPR.html?pr-id=${id}&pr-type=${prType}&tab=${currentTab}`;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Fungsi Download Excel
async function downloadExcel() {
    try {
        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }

        // Fetch all documents from all tabs
        const preparedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const checkedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const rejectedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/rejected?ApproverId=${userId}&ApproverRole=checked`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const preparedData = preparedResponse.ok ? await preparedResponse.json() : { data: [] };
        const checkedData = checkedResponse.ok ? await checkedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };

        // Combine all documents
        const allDocuments = [
            ...(preparedData.data || []),
            ...(checkedData.data || []),
            ...(rejectedData.data || [])
        ];
        
        // Sort documents by PR Number (newest first)
        const sortedAllDocuments = sortDocumentsByPRNumber(allDocuments);
    
        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        
        // Get current tab name for the file name
        const statusText = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
        
        // Convert data to worksheet format
        const wsData = sortedAllDocuments.map(doc => {
            // Format dates
            const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '';
            const requiredDate = doc.requiredDate ? new Date(doc.requiredDate).toLocaleDateString() : '';
            const grDate = doc.grDate ? new Date(doc.grDate).toLocaleDateString() : '';
            
            return {
                'Document Number': doc.id || '',
                'PR Number': doc.purchaseRequestNo || '',
                'Requester': doc.requesterName || '',
                'Department': doc.departmentName || '',
                'Submission Date': submissionDate,
                'Required Date': requiredDate,
                'PO Number': doc.poNumber || '',
                'Status': doc.status || '',
                'GR Date': grDate
            };
        });
        
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(wsData);
        
        // Set column widths for better readability
        const columnWidths = [
            { wch: 15 }, // Document Number
            { wch: 20 }, // PR Number
            { wch: 20 }, // Requester
            { wch: 15 }, // Department
            { wch: 15 }, // Submission Date
            { wch: 15 }, // Required Date
            { wch: 15 }, // PO Number
            { wch: 12 }, // Status
            { wch: 15 }  // GR Date
        ];
        worksheet['!cols'] = columnWidths;
        
        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Requests');
        
        // Generate the Excel file with current filter in the filename
        XLSX.writeFile(workbook, `purchase_request_check_${statusText.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
        console.error('Error exporting Excel:', error);
        alert('Error exporting data to Excel. Please try again.');
    }
}

// Fungsi Download PDF
async function downloadPDF() {
    try {
        const userId = getUserId();
        if (!userId) {
            alert("Unable to get user ID from token. Please login again.");
            return;
        }

        // Fetch all documents from all tabs
        const preparedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const checkedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const rejectedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/rejected?ApproverId=${userId}&ApproverRole=checked`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const preparedData = preparedResponse.ok ? await preparedResponse.json() : { data: [] };
        const checkedData = checkedResponse.ok ? await checkedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };

        // Combine all documents
        const allDocuments = [
            ...(preparedData.data || []),
            ...(checkedData.data || []),
            ...(rejectedData.data || [])
        ];
        
        // Sort documents by PR Number (newest first)
        const sortedAllDocuments = sortDocumentsByPRNumber(allDocuments);

        // Use the jsPDF library
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get current tab name for the title
        const statusText = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
        
        // Add title with current filter information
        doc.setFontSize(16);
        doc.text(`Purchase Request Check Report - ${statusText}`, 14, 15);
        
        // Add timestamp
        const now = new Date();
        const timestamp = `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        doc.setFontSize(10);
        doc.text(timestamp, 14, 22);
        
        // Membuat data tabel dari documents
        const tableData = sortedAllDocuments.map(doc => {
            return [
                doc.id || '',
                doc.purchaseRequestNo || '',
                doc.requesterName || '',
                doc.departmentName || '',
                doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '',
                doc.requiredDate ? new Date(doc.requiredDate).toLocaleDateString() : '',
                doc.poNumber || '',
                doc.status || '',
                doc.grDate ? new Date(doc.grDate).toLocaleDateString() : ''
            ];
        });
        
        // Add table with styling
        doc.autoTable({
            head: [['Doc Number', 'PR Number', 'Requester', 'Department', 'Submission Date', 'Required Date', 'PO Number', 'Status', 'GR Date']],
            body: tableData,
            startY: 30,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 20 },      // Doc Number
                1: { cellWidth: 25 },      // PR Number
                2: { cellWidth: 25 },      // Requester
                3: { cellWidth: 20 },      // Department
                4: { cellWidth: 18 },      // Submission Date
                5: { cellWidth: 18 },      // Required Date
                6: { cellWidth: 15 },      // PO Number
                7: { cellWidth: 15 },      // Status
                8: { cellWidth: 15 }       // GR Date
            },
            headStyles: {
                fillColor: [66, 133, 244],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            }
        });
        
        // Add total count at the bottom
        const finalY = doc.lastAutoTable.finalY || 30;
        doc.setFontSize(10);
        doc.text(`Total Records: ${sortedAllDocuments.length}`, 14, finalY + 10);
        
        // Save the PDF with current filter in the filename
        doc.save(`purchase_request_check_${statusText.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Error exporting data to PDF. Please try again.');
    }
}

// Function to navigate to user profile page
function goToProfile() {
    // Function disabled - no action
    return;
}

// ================= NOTIFICATION POLLING =================
// Notifikasi dokumen yang perlu diperiksa (prepared)
let notifiedPRs = new Set();
let notificationContainer = null;
let isNotificationVisible = false;

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    const count = notifiedPRs.size;
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
    
    // Update konten notifikasi
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
    
    if (notifiedPRs.size === 0) {
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
            <h3 class="font-semibold text-gray-800">Notifications (${notifiedPRs.size})</h3>
        </div>
        <div class="max-h-80 overflow-y-auto">
    `;
    
    // Ambil data notifikasi dari localStorage atau dari polling terakhir
    const notificationData = JSON.parse(localStorage.getItem('notificationData') || '{}');
    
    notifiedPRs.forEach(prNumber => {
        const data = notificationData[prNumber] || {};
        const submissionDate = data.submissionDate ? new Date(data.submissionDate).toLocaleDateString() : '-';
        const message = `${data.purchaseRequestNo || prNumber}-${data.requesterName || 'Unknown'}-${data.departmentName || 'Unknown'}-${submissionDate}-${data.status || 'Prepared'}`;
        
        content += `
            <div class="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900">${data.purchaseRequestNo || prNumber}</div>
                        <div class="text-xs text-gray-600 mt-1">${data.requesterName || 'Unknown'} - ${data.departmentName || 'Unknown'}</div>
                        <div class="text-xs text-gray-500 mt-1">Submitted: ${submissionDate}</div>
                        <div class="inline-block mt-1">
                            <span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">${data.status || 'Prepared'}</span>
                        </div>
                    </div>
                    <button onclick="removeNotification('${prNumber}')" class="ml-2 text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    content += '</div>';
    notificationContainer.innerHTML = content;
}

function showNotification(message, prNumber) {
    // Simpan data notifikasi ke localStorage
    const notificationData = JSON.parse(localStorage.getItem('notificationData') || '{}');
    const data = {
        purchaseRequestNo: prNumber,
        requesterName: message.split('-')[1] || 'Unknown',
        departmentName: message.split('-')[2] || 'Unknown',
        submissionDate: message.split('-')[3] || '-',
        status: message.split('-')[4] || 'Prepared'
    };
    notificationData[prNumber] = data;
    localStorage.setItem('notificationData', JSON.stringify(notificationData));
    
    notifiedPRs.add(prNumber);
    updateNotificationBadge();
    
    // Update panel jika sedang terbuka
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

function removeNotification(prNumber) {
    // Hapus dari localStorage
    const notificationData = JSON.parse(localStorage.getItem('notificationData') || '{}');
    delete notificationData[prNumber];
    localStorage.setItem('notificationData', JSON.stringify(notificationData));
    
    notifiedPRs.delete(prNumber);
    updateNotificationBadge();
    
    // Update panel jika sedang terbuka
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

async function pollPreparedDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        const response = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        const docs = data.data || [];
        let newPRFound = false;
        docs.forEach(doc => {
            if (!notifiedPRs.has(doc.purchaseRequestNo)) {
                // Format pesan notifikasi
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.purchaseRequestNo}-${doc.requesterName}-${doc.departmentName}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.purchaseRequestNo);
                newPRFound = true;
            }
        });
        // Play sound jika ada dokumen baru
        if (newPRFound) {
            try {
                // Only play if user has interacted with the page
                if (document.hasInteracted) {
                    const audio = new Audio('../../../../components/shared/tones.mp3');
                    audio.volume = 0.5; // Set volume to 50%
                    audio.play().then(() => {
                        console.log('Notification sound played successfully');
                    }).catch(e => {
                        console.warn('Failed to play notification sound:', e);
                    });
                } else {
                    console.log('User has not interacted with page yet, cannot play audio');
                }
            } catch (e) {
                console.warn('Failed to play notification sound:', e);
            }
        }
    } catch (e) {
        // Silent error
    }
}

async function pollCheckedDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        const response = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        const checkedPRs = new Set((data.data || []).map(doc => doc.purchaseRequestNo));
        // Hapus notifikasi untuk PR yang sudah checked
        notifiedPRs.forEach(prNumber => {
            if (checkedPRs.has(prNumber)) {
                removeNotification(prNumber);
            }
        });
    } catch (e) {
        // Silent error
    }
}

// Polling interval (setiap 10 detik)
setInterval(() => {
    pollPreparedDocs();
    pollCheckedDocs();
}, 10000);

// Jalankan polling pertama kali saat halaman dimuat
pollPreparedDocs();
pollCheckedDocs();
updateNotificationBadge();

// Event click pada bell untuk toggle notifikasi panel
const bell = document.getElementById('notificationBell');
if (bell) {
    bell.addEventListener('click', function() {
        toggleNotificationPanel();
    });
}

// Tutup panel jika klik di luar
document.addEventListener('click', function(event) {
    if (notificationContainer && !notificationContainer.contains(event.target) && !bell.contains(event.target)) {
        hideNotificationPanel();
    }
});