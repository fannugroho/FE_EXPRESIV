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
            
            // Update counters by fetching all statuses
            await updateCounters(userId);
            
            // Update the table with filtered documents
            updateTable(documents);
            
            // Update pagination info
            updatePaginationInfo(documents.length);
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
    
        // Membuat workbook baru
        const workbook = XLSX.utils.book_new();
        
        // Mengonversi data ke format worksheet
        const wsData = allDocuments.map(doc => {
            return {
                'Document Number': doc.id,
                'PR Number': doc.purchaseRequestNo,
                'Requester': doc.requesterName,
                'Department': doc.departmentName,
                'Submission Date': doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '',
                'Required Date': doc.requiredDate ? new Date(doc.requiredDate).toLocaleDateString() : '',
                'PO Number': doc.poNumber || '',
                'Status': doc.status,
                'GR Date': doc.grDate ? new Date(doc.grDate).toLocaleDateString() : ''
            };
        });
        
        // Membuat worksheet dan menambahkannya ke workbook
        const worksheet = XLSX.utils.json_to_sheet(wsData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Requests');
        
        // Menghasilkan file Excel
        XLSX.writeFile(workbook, 'purchase_request_list.xlsx');
    } catch (error) {
        console.error('Error downloading Excel:', error);
        alert('Failed to download Excel file. Please try again.');
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

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Menambahkan judul
        doc.setFontSize(16);
        doc.text('Purchase Request Report', 14, 15);
        
        // Membuat data tabel dari documents
        const tableData = allDocuments.map(doc => {
            return [
                doc.id,
                doc.purchaseRequestNo,
                doc.requesterName,
                doc.departmentName,
                doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '',
                doc.requiredDate ? new Date(doc.requiredDate).toLocaleDateString() : '',
                doc.poNumber || '',
                doc.status,
                doc.grDate ? new Date(doc.grDate).toLocaleDateString() : ''
            ];
        });
        
        // Menambahkan tabel
        doc.autoTable({
            head: [['Doc Number', 'PR Number', 'Requester', 'Department', 'Submission Date', 'Required Date', 'PO Number', 'Status', 'GR Date']],
            body: tableData,
            startY: 25
        });
        
        // Menyimpan PDF
        doc.save('purchase_request_list.pdf');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF file. Please try again.');
    }
}

// Function to navigate to user profile page
function goToProfile() {
    window.location.href = "../../../../pages/profil.html";
}