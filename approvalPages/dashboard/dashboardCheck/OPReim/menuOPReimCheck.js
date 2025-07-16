// Current tab state
let currentTab = 'prepared'; // Default tab
let currentSearchTerm = '';
let currentSearchType = 'reimNo';
let currentPage = 1;
let itemsPerPage = 10;

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
            if (this.value === 'docDate' || this.value === 'dueDate') {
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
            baseUrl = `${BASE_URL}/api/op-reim/dashboard/approval`;
            params.append('isApproved', 'false');
        } else if (currentTab === 'checked') {
            baseUrl = `${BASE_URL}/api/op-reim/dashboard/approval`;
            params.append('isApproved', 'true');
        } else if (currentTab === 'rejected') {
            baseUrl = `${BASE_URL}/api/op-reim/dashboard/rejected`;
        }
        
        // Add search parameters if available
        if (currentSearchTerm) {
            switch (currentSearchType) {
                case 'reimNo':
                    params.append('counterRef', currentSearchTerm);
                    break;
                case 'requester':
                    params.append('requesterName', currentSearchTerm);
                    break;
                case 'payTo':
                    params.append('cardName', currentSearchTerm);
                    break;
                case 'totalAmount':
                    params.append('totalAmount', currentSearchTerm);
                    break;
                case 'status':
                    params.append('status', currentSearchTerm);
                    break;
                case 'docDate':
                case 'dueDate':
                    // For date search, try to parse and use date range
                    const dateValue = new Date(currentSearchTerm);
                    if (!isNaN(dateValue.getTime())) {
                        const dateField = currentSearchType === 'docDate' ? 'docDate' : 'docDueDate';
                        params.append(`${dateField}From`, dateValue.toISOString().split('T')[0]);
                        params.append(`${dateField}To`, dateValue.toISOString().split('T')[0]);
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
            
            // Sort documents by Reimburse No (newest first)
            const sortedDocuments = sortDocumentsByReimNo(documents);
            
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
        const preparedResponse = await fetch(`${BASE_URL}/api/op-reim/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const checkedResponse = await fetch(`${BASE_URL}/api/op-reim/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const rejectedResponse = await fetch(`${BASE_URL}/api/op-reim/dashboard/rejected?ApproverId=${userId}&ApproverRole=checked`, {
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
        document.getElementById("preparedCount").textContent = preparedCount;
        document.getElementById("checkedCount").textContent = checkedCount;
        document.getElementById("rejectedCount").textContent = rejectedCount;
        
    } catch (error) {
        console.error('Error updating counters:', error);
        // Set counters to 0 on error
        document.getElementById("totalCount").textContent = '0';
        document.getElementById("preparedCount").textContent = '0';
        document.getElementById("checkedCount").textContent = '0';
        document.getElementById("rejectedCount").textContent = '0';
    }
}

// Function to sort documents by Reimburse No (newest first)
function sortDocumentsByReimNo(documents) {
    return documents.sort((a, b) => {
        // Extract running number from Reimburse No
        const getRunningNumber = (reimNo) => {
            if (!reimNo) return 0;
            
            // Try to extract numeric part from Reimburse No
            const numericMatch = reimNo.toString().match(/\d+/g);
            if (numericMatch && numericMatch.length > 0) {
                // Join all numeric parts and convert to number
                return parseInt(numericMatch.join(''));
            }
            
            // If no numeric part found, use the entire string as fallback
            return reimNo.toString().localeCompare(b.counterRef || '');
        };
        
        const runningNumberA = getRunningNumber(a.counterRef);
        const runningNumberB = getRunningNumber(b.counterRef);
        
        // Sort in descending order (newest/highest number first)
        return runningNumberB - runningNumberA;
    });
}

// Function to format currency with Indonesian format
function formatCurrency(number) {
    if (number === null || number === undefined) return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

// Function to update the table with documents
function updateTable(documents) {
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    
    if (documents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center p-4">No documents found</td></tr>`;
    } else {
        documents.forEach((doc, index) => {
            // Format dates
            const docDate = doc.docDate ? new Date(doc.docDate).toLocaleDateString() : '-';
            const docDueDate = doc.docDueDate ? new Date(doc.docDueDate).toLocaleDateString() : '-';
            
            // Calculate total amount from lines
            let totalAmount = 0;
            if (doc.lines && doc.lines.length > 0) {
                totalAmount = doc.lines.reduce((sum, line) => sum + (line.sumApplied || 0), 0);
            } else if (doc.trsfrSum) {
                totalAmount = doc.trsfrSum;
            }
            
            // Format total amount
            const formattedAmount = formatCurrency(totalAmount);
            
            // Check if fields are longer than 10 characters and apply scrollable class
            const reimNoClass = doc.counterRef && doc.counterRef.length > 10 ? 'scrollable-cell' : '';
            const requesterClass = doc.requesterName && doc.requesterName.length > 10 ? 'scrollable-cell' : '';
            const payToClass = doc.cardName && doc.cardName.length > 10 ? 'scrollable-cell' : '';
            
            const row = `<tr class='w-full border-b'>
                <td class='p-2'>${index + 1}</td>
                <td class='p-2'>
                    <div class="${reimNoClass}">${doc.counterRef || '-'}</div>
                </td>
                <td class='p-2'>
                    <div class="${requesterClass}">${doc.requesterName || '-'}</div>
                </td>
                <td class='p-2'>
                    <div class="${payToClass}">${doc.cardName || '-'}</div>
                </td>
                <td class='p-2'>${docDate}</td>
                <td class='p-2'>${docDueDate}</td>
                <td class='p-2'>${formattedAmount}</td>
                <td class='p-2'><span class="px-2 py-1 rounded-full text-xs ${getStatusClass(doc.approval?.approvalStatus || 'Draft')}">${doc.approval?.approvalStatus || 'Draft'}</span></td>
                <td class='p-2'>
                    <button onclick="detailDoc('${doc.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
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
        document.getElementById('preparedTabBtn').classList.add('tab-active');
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
    
    // Reset pagination
    currentPage = 1;
    
    // Reload dashboard with the new filter
    loadDashboard();
}

// Function to handle search input
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    currentSearchTerm = searchInput ? searchInput.value.trim() : '';
    currentSearchType = document.getElementById('searchType').value;
    currentPage = 1; // Reset to first page when searching
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
    
    // Calculate start and end items for current page
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    document.getElementById('startItem').textContent = startItem;
    document.getElementById('endItem').textContent = endItem;
    
    // Update pagination buttons state
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    
    if (prevPageBtn) {
        if (currentPage <= 1) {
            prevPageBtn.classList.add('disabled');
        } else {
            prevPageBtn.classList.remove('disabled');
        }
    }
    
    if (nextPageBtn) {
        if (currentPage >= Math.ceil(totalItems / itemsPerPage)) {
            nextPageBtn.classList.add('disabled');
        } else {
            nextPageBtn.classList.remove('disabled');
        }
    }
    
    // Update current page display
    document.getElementById('currentPage').textContent = currentPage;
}

// Pagination handlers
function changePage(direction) {
    const totalItems = parseInt(document.getElementById('totalItems').textContent);
    const maxPage = Math.ceil(totalItems / itemsPerPage);
    
    if (direction === -1 && currentPage > 1) {
        currentPage--;
        loadDashboard();
    } else if (direction === 1 && currentPage < maxPage) {
        currentPage++;
        loadDashboard();
    }
}

// Function to navigate to total documents page
function goToTotalDocs() {
    // This would navigate to the total documents view
    console.log('Navigate to total documents view');
}

function detailDoc(id) {
    window.location.href = `../../../approval/check/outgoingPayment/checkedOPReim.html?id=${id}&tab=${currentTab}`;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

// Excel Export Function
function downloadExcel() {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Get current tab name for the file name
    const statusText = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
    
    // Get table data
    const tableRows = document.querySelectorAll('#recentDocs tr');
    const tableData = [];
    
    // Table headers
    const headers = [
        'No', 'Reimburse No', 'Requester', 'Pay To', 
        'Document Date', 'Due Date', 'Total Amount', 'Status'
    ];
    tableData.push(headers);
    
    // Table rows
    tableRows.forEach((row, index) => {
        const rowData = [];
        const cells = row.querySelectorAll('td');
        
        if (cells.length > 0) {
            rowData.push(cells[0] ? cells[0].textContent.trim() : index + 1); // No
            rowData.push(cells[1] ? cells[1].textContent.trim() : ''); // Reimburse No
            rowData.push(cells[2] ? cells[2].textContent.trim() : ''); // Requester
            rowData.push(cells[3] ? cells[3].textContent.trim() : ''); // Pay To
            rowData.push(cells[4] ? cells[4].textContent.trim() : ''); // Document Date
            rowData.push(cells[5] ? cells[5].textContent.trim() : ''); // Due Date
            rowData.push(cells[6] ? cells[6].textContent.trim() : ''); // Total Amount
            rowData.push(cells[7] ? cells[7].textContent.trim() : ''); // Status
            
            tableData.push(rowData);
        }
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(tableData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OP Reimbursement');
    
    // Generate Excel file
    XLSX.writeFile(workbook, `op_reimbursement_${statusText.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// PDF Export Function
function downloadPDF() {
    // Use the jsPDF library
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get current tab name for the title
    const statusText = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
    
    // Add title with current filter information
    doc.setFontSize(16);
    doc.text(`Outgoing Payment Reimbursement Report - ${statusText}`, 14, 15);
    
    // Add timestamp
    const now = new Date();
    const timestamp = `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    doc.setFontSize(10);
    doc.text(timestamp, 14, 22);
    
    // Get table data
    const tableRows = document.querySelectorAll('#recentDocs tr');
    const tableData = [];
    
    // Table rows
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = [
                cells[0] ? cells[0].textContent.trim() : '', // No
                cells[1] ? cells[1].textContent.trim() : '', // Reimburse No
                cells[2] ? cells[2].textContent.trim() : '', // Requester
                cells[3] ? cells[3].textContent.trim() : '', // Pay To
                cells[4] ? cells[4].textContent.trim() : '', // Document Date
                cells[5] ? cells[5].textContent.trim() : '', // Due Date
                cells[6] ? cells[6].textContent.trim() : '', // Total Amount
                cells[7] ? cells[7].textContent.trim() : ''  // Status
            ];
            tableData.push(rowData);
        }
    });
    
    // Add table with styling
    doc.autoTable({
        head: [['No', 'Reimburse No', 'Requester', 'Pay To', 'Document Date', 'Due Date', 'Total Amount', 'Status']],
        body: tableData,
        startY: 30,
        styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak'
        },
        columnStyles: {
            0: { cellWidth: 10 },     // No
            1: { cellWidth: 25 },     // Reimburse No
            2: { cellWidth: 25 },     // Requester
            3: { cellWidth: 25 },     // Pay To
            4: { cellWidth: 20 },     // Document Date
            5: { cellWidth: 20 },     // Due Date
            6: { cellWidth: 25 },     // Total Amount
            7: { cellWidth: 20 }      // Status
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
    doc.text(`Total Records: ${tableData.length}`, 14, finalY + 10);
    
    // Save the PDF with current filter in the filename
    doc.save(`op_reimbursement_${statusText.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Function to navigate to user profile page
function goToProfile() {
    window.location.href = "../../../../pages/profil.html";
} 