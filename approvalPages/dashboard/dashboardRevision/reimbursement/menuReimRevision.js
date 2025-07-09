// TODO Reimbursement Revision 

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

// Global variables for pagination
let currentPage = 1;
const itemsPerPage = 10;
let allReimbursements = [];
let filteredReimbursements = [];
let currentTab = 'revised'; // Default tab

// Function to handle search
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const searchType = document.getElementById('searchType').value;
    filterReimbursements(searchTerm, currentTab, searchType);
}

// Function to filter reimbursements based on search term, tab, and search type
function filterReimbursements(searchTerm = '', tab = 'revised', searchType = 'pr') {
    if (tab === 'revised') {
        filteredReimbursements = allReimbursements.filter(reim => {
            // Filter berdasarkan status
            const statusMatch = reim.status.toLowerCase() === 'revised';
            
            // Filter berdasarkan tipe pencarian yang dipilih
            let searchMatch = true;
            if (searchTerm) {
                if (searchType === 'pr') {
                    searchMatch = reim.voucherNo.toLowerCase().includes(searchTerm);
                } else if (searchType === 'requester') {
                    searchMatch = reim.requesterName.toLowerCase().includes(searchTerm);
                } else if (searchType === 'date') {
                    // Format tanggal untuk pencarian
                    const formattedDate = formatDateYYYYMMDD(reim.submissionDate).toLowerCase();
                    searchMatch = formattedDate.includes(searchTerm);
                }
            }
            
            return statusMatch && searchMatch;
        });
    } else if (tab === 'prepared') {
        filteredReimbursements = allReimbursements.filter(reim => {
            // Filter berdasarkan status
            const statusMatch = reim.status.toLowerCase() === 'prepared';
            
            // Filter berdasarkan tipe pencarian yang dipilih
            let searchMatch = true;
            if (searchTerm) {
                if (searchType === 'pr') {
                    searchMatch = reim.voucherNo.toLowerCase().includes(searchTerm);
                } else if (searchType === 'requester') {
                    searchMatch = reim.requesterName.toLowerCase().includes(searchTerm);
                } else if (searchType === 'date') {
                    // Format tanggal untuk pencarian
                    const formattedDate = formatDateYYYYMMDD(reim.submissionDate).toLowerCase();
                    searchMatch = formattedDate.includes(searchTerm);
                }
            }
            
            return statusMatch && searchMatch;
        });
    }
    
    currentPage = 1;
    displayReimbursements(filteredReimbursements);
}

// Function to switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('revisedTabBtn').classList.remove('tab-active');
    document.getElementById('preparedTabBtn').classList.remove('tab-active');
    
    if (tabName === 'revised') {
        document.getElementById('revisedTabBtn').classList.add('tab-active');
    } else if (tabName === 'prepared') {
        document.getElementById('preparedTabBtn').classList.add('tab-active');
    }
    
    // Filter reimbursements based on current tab and search term
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const searchType = document.getElementById('searchType').value;
    filterReimbursements(searchTerm, tabName, searchType);
}

// Function to fetch status counts from API
function fetchStatusCounts() {
    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found. Please login again.');
        return;
    }

    const endpoint = `/api/reimbursements/status-counts/user/${userId}`;
    
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
        });
}

// Function to fetch reimbursements from API
function fetchReimbursements() {
    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found. Please login again.');
        return;
    }

    const endpoint = `/api/reimbursements/user/${userId}`;
    
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
                filteredReimbursements = allReimbursements.filter(reim => 
                    reim.status.toLowerCase() === 'revised'
                );
                displayReimbursements(filteredReimbursements);
            } else {
                console.error('API returned an error:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching reimbursements:', error);
        });
}

// Function to display reimbursements in the table with pagination
function displayReimbursements(reimbursements) {
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, reimbursements.length);
    const paginatedReimbursements = reimbursements.slice(startIndex, endIndex);
    
    paginatedReimbursements.forEach(reim => {
        let formattedDate = reim.submissionDate;
        if (reim.submissionDate) {
            formattedDate = formatDateWithLocalTimezone(reim.submissionDate);
        }
        
        const row = `<tr class='border-b'>
            <td class='p-2'>${reim.id}</td>
            <td class='p-2'>${reim.voucherNo}</td>
            <td class='p-2'>${reim.requesterName}</td>
            <td class='p-2'>${reim.department}</td>
            <td class='p-2'>${formattedDate}</td>
            <td class='p-2'>
                <span class="px-2 py-1 rounded-full text-xs ${reim.status === 'Revised' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}">
                    ${reim.status === 'Revised' ? 'Revision' : reim.status}
                </span>
            </td>
            <td class='p-2'>${reim.remarks}</td>
            <td class='p-2'>
                <button onclick="detailReim('${reim.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    // Update item count display
    document.getElementById('startItem').textContent = reimbursements.length > 0 ? startIndex + 1 : 0;
    document.getElementById('endItem').textContent = endIndex;
    document.getElementById('totalItems').textContent = reimbursements.length;
    
    // Update pagination buttons
    updatePaginationButtons(reimbursements.length);
}

// Function to get current user ID
function getUserId() {
    const userStr = localStorage.getItem('loggedInUser');
    if (!userStr) return null;
    
    try {
        const user = JSON.parse(userStr);
        return user.id || null;
    } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
    }
}

// Function to update pagination buttons
function updatePaginationButtons(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    
    // Update prev/next button states
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.classList.toggle('disabled', currentPage <= 1);
    nextBtn.classList.toggle('disabled', currentPage >= totalPages);
}

// Function to change page
function changePage(direction) {
    const totalPages = Math.ceil(filteredReimbursements.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayReimbursements(filteredReimbursements);
    }
}

// Function to download Excel
function downloadExcel() {
    const workbook = XLSX.utils.book_new();
    
    // Convert the data to worksheet format
    const wsData = filteredReimbursements.map(reim => ({
        'Document Number': reim.id,
        'Reimbursement Number': reim.voucherNo,
        'Requester': reim.requesterName,
        'Department': reim.department,
        'Submission Date': reim.submissionDate,
        'Status': reim.status,
        'Remarks': reim.remarks
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reimbursements');
    
    // Generate Excel file
    XLSX.writeFile(workbook, 'reimbursement_revised.xlsx');
}

// Function to download PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Reimbursement Revised Report', 14, 15);
    
    // Create table data
    const tableData = filteredReimbursements.map(reim => [
        reim.id,
        reim.voucherNo,
        reim.requesterName,
        reim.department,
        reim.submissionDate,
        reim.status,
        reim.remarks
    ]);
    
    // Add table
    doc.autoTable({
        head: [['Doc Number', 'Reimbursement Number', 'Requester', 'Department', 'Submission Date', 'Status']],
        body: tableData,
        startY: 25
    });
    
    // Save PDF
    doc.save('reimbursement_revised.pdf');
}

// Function to update the status counts on the page
function updateStatusCounts(data) {
    document.getElementById("revisedCount").textContent = data.revisedCount || 0;
    document.getElementById("preparedCount").textContent = data.preparedCount || 0;
}

function toggleSidebar() {
    // No-op function - sidebar toggle is disabled to keep it permanently open
    return;
}

// Function to redirect to detail page with reimbursement ID
function detailReim(reimId) {
    window.location.href = `/approvalPages/approval/revision/reimbursement/revisionReim.html?reim-id=${reimId}`;
}

// Function to load dashboard
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

window.onload = loadDashboard; 