// Current tab state
let currentTab = 'approved'; // Default tab

// API Configuration

// Helper function to get access token

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function() {
    // Hide the remarks column initially since the default tab is 'approved'
    const remarksHeader = document.getElementById('remarksHeader');
    if (remarksHeader) {
        remarksHeader.style.display = 'none';
    }
    
    loadDashboard();

    // Make sure sidebar is visible
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.remove('hidden');
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

        let url;
        
        // Build URL based on current tab
        if (currentTab === 'approved') {
            url = `${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=false`;
        } else if (currentTab === 'received') {
            url = `${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=true`;
        } else if (currentTab === 'rejected') {
            url = `${BASE_URL}/api/pr/dashboard/rejected?ApproverId=${userId}&ApproverRole=received`;
        }

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
        const approvedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const receivedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const rejectedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/rejected?ApproverId=${userId}&ApproverRole=received`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const approvedData = approvedResponse.ok ? await approvedResponse.json() : { data: [] };
        const receivedData = receivedResponse.ok ? await receivedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };

        const approvedCount = approvedData.data ? approvedData.data.length : 0;
        const receivedCount = receivedData.data ? receivedData.data.length : 0;
        const rejectedCount = rejectedData.data ? rejectedData.data.length : 0;
        const totalCount = approvedCount + receivedCount + rejectedCount;

        // Update counters
        document.getElementById("totalCount").textContent = totalCount;
        document.getElementById("approvedCount").textContent = approvedCount;
        document.getElementById("receivedCount").textContent = receivedCount;
        document.getElementById("rejectedCount").textContent = rejectedCount;
        
    } catch (error) {
        console.error('Error updating counters:', error);
        // Set counters to 0 on error
        document.getElementById("totalCount").textContent = '0';
        document.getElementById("approvedCount").textContent = '0';
        document.getElementById("receivedCount").textContent = '0';
        document.getElementById("rejectedCount").textContent = '0';
    }
}

// Function to update the table with documents
function updateTable(documents) {
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    
    // Check if remarks column should be visible (only for rejected tab)
    const showRemarks = currentTab === 'rejected';
    const colSpan = showRemarks ? 11 : 10;
    
    if (documents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center p-4">No documents found</td></tr>`;
    } else {
        documents.forEach((doc, index) => {
            // Format dates
            const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
            const requiredDate = doc.requiredDate ? new Date(doc.requiredDate).toLocaleDateString() : '-';
            
            // Build row based on current tab
            let row = `<tr class='w-full border-b'>
                <td class='p-2'>${index + 1}</td>
                <td class='p-2'>${doc.purchaseRequestNo || '-'}</td>
                <td class='p-2'>${doc.requesterName || '-'}</td>
                <td class='p-2'>${doc.departmentName || '-'}</td>
                <td class='p-2'>${submissionDate}</td>
                <td class='p-2'>${requiredDate}</td>
                <td class='p-2'>${doc.poNumber || '-'}</td>
                <td class='p-2'><span class="px-2 py-1 rounded-full text-xs ${getStatusClass(doc.status)}">${doc.status}</span></td>`;
            
            // Add remarks column only for rejected tab
            if (showRemarks) {
                row += `<td class='p-2'>${doc.remarks || '-'}</td>`;
            }
            
            row += `<td class='p-2'>
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
    
    if (tabName === 'approved') {
        document.getElementById('approvedTabBtn').classList.add('tab-active');
        // Hide remarks column for approved tab
        const remarksHeader = document.getElementById('remarksHeader');
        if (remarksHeader) {
            remarksHeader.style.display = 'none';
        }
    } else if (tabName === 'received') {
        document.getElementById('receivedTabBtn').classList.add('tab-active');
        // Hide remarks column for received tab as well
        const remarksHeader = document.getElementById('remarksHeader');
        if (remarksHeader) {
            remarksHeader.style.display = 'none';
        }
    } else if (tabName === 'rejected') {
        document.getElementById('rejectedTabBtn').classList.add('tab-active');
        // Show remarks column only for rejected tab
        const remarksHeader = document.getElementById('remarksHeader');
        if (remarksHeader) {
            remarksHeader.style.display = 'table-cell';
        }
    }
    
    // Reload dashboard with the new filter
    loadDashboard();
}

// Helper function to get status styling
function getStatusClass(status) {
    switch(status) {
        case 'Draft': return 'bg-yellow-100 text-yellow-800';
        case 'Checked': return 'bg-green-100 text-green-800';
        case 'Acknowledge': return 'bg-blue-100 text-blue-800';
        case 'Approved': return 'bg-indigo-100 text-indigo-800';
        case 'Received': return 'bg-purple-100 text-purple-800';
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
    console.log(`