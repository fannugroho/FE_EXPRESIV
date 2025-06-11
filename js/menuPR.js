// Pagination variables
let currentPage = 1;
const itemsPerPage = 10;
let allPurchaseRequests = [];
let filteredPurchaseRequests = [];
let currentTab = 'all'; // Track the current active tab

async function fetchPurchaseRequests() {
    const userId = getUserId();

    fetch(`${BASE_URL}/api/pr/dashboard?requesterId=${userId}`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data && data.data) {
                // Store all purchase requests
                console.log(data.data);
                allPurchaseRequests = data.data;
                filterPurchaseRequests(); // Apply current filters
            }
        })
        .catch(error => console.error('Error fetching purchase requests:', error));
}

// Function to filter purchase requests based on tab and search term
function filterPurchaseRequests(searchTerm = '') {
    // Reset to page 1 when filtering
    currentPage = 1;
    
    // Apply tab filter
    if (currentTab === 'draft') {
        filteredPurchaseRequests = allPurchaseRequests.filter(doc => 
            doc.status?.toLowerCase() === 'draft'
        );
    } else if (currentTab === 'prepared') {
        filteredPurchaseRequests = allPurchaseRequests.filter(doc => 
            doc.status?.toLowerCase() === 'prepared'
        );
    } else {
        // 'all' tab or default
        filteredPurchaseRequests = [...allPurchaseRequests];
    }
    
    // Apply search filter if there's a search term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchType = document.getElementById('searchType').value;
        
        filteredPurchaseRequests = filteredPurchaseRequests.filter(doc => {
            switch(searchType) {
                case 'pr':
                    return doc.purchaseRequestNo?.toLowerCase().includes(term);
                case 'requester':
                    return doc.requesterName?.toLowerCase().includes(term);
                case 'date':
                    // Convert date to match the search format (YYYY-MM-DD)
                    const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toISOString().split('T')[0] : '';
                    return submissionDate.includes(term);
                case 'status':
                    return doc.status?.toLowerCase().includes(term);
                default:
                    return doc.purchaseRequestNo?.toLowerCase().includes(term);
            }
        });
    }
    
    // Update the table and dashboard counts
    populatePurchaseRequests(filteredPurchaseRequests);
    updateDashboardCounts(allPurchaseRequests);
}

// Function to switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update active tab styling
    document.querySelectorAll('.tab-active').forEach(el => el.classList.remove('tab-active'));
    
    if (tabName === 'draft') {
        document.getElementById('draftTabBtn').classList.add('tab-active');
    } else if (tabName === 'prepared') {
        document.getElementById('preparedTabBtn').classList.add('tab-active');
    } else {
        document.getElementById('allTabBtn').classList.add('tab-active');
    }
    
    // Filter documents based on the new tab
    filterPurchaseRequests();
}

function updateDashboardCounts(data) {
    // Update total count
    document.getElementById("totalCount").textContent = data.length;
    
    // Count documents by status
    const statusCounts = {
        draft: 0,
        prepared: 0,
        checked: 0,
        acknowledged: 0,
        approved: 0,
        received: 0,
        rejected: 0
    };
    
    data.forEach(doc => {
        const status = doc.status ? doc.status.toLowerCase() : 'draft';
        
        switch(status) {
            case 'draft':
                statusCounts.draft++;
                break;
            case 'prepared':
                statusCounts.prepared++;
                break;
            case 'checked':
                statusCounts.checked++;
                break;
            case 'acknowledged':
                statusCounts.acknowledged++;
                break;
            case 'approved':
                statusCounts.approved++;
                break;
            case 'received':
                statusCounts.received++;
                break;
            case 'rejected':
                statusCounts.rejected++;
                break;
        }
    });
    
    // Update the dashboard cards with correct IDs
    document.getElementById("draftCount").textContent = statusCounts.draft;
    document.getElementById("preparedCount").textContent = statusCounts.prepared;
    document.getElementById("checkedCount").textContent = statusCounts.checked;
    document.getElementById("acknowledgedCount").textContent = statusCounts.acknowledged;
    document.getElementById("approvedCount").textContent = statusCounts.approved;
    document.getElementById("receivedCount").textContent = statusCounts.received;
    document.getElementById("rejectedCount").textContent = statusCounts.rejected;
}

function populatePurchaseRequests(data) {
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    
    // Calculate pagination indices
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, data.length);
    const paginatedData = data.slice(startIndex, endIndex);
    
    // Display paginated data
    paginatedData.forEach((doc, index) => {
        // Format dates for display
        const submissionDate = doc.submissionDate ? doc.submissionDate.split('T')[0] : '';
        const requiredDate = doc.requiredDate ? doc.requiredDate.split('T')[0] : '';
        
        // PO number may be null, handle that case
        const poNumber = doc.docEntrySAP ? `PO-${doc.docEntrySAP.toString().padStart(4, '0')}` : '';
        
        // Get status from approval object
        const status = doc.status ? doc.status : "Open";
        
        // Check if PR Number is longer than 15 characters
        const prNumberClass = doc.purchaseRequestNo && doc.purchaseRequestNo.length > 15 ? 'pr-number-cell' : '';
        
        const row = `<tr class='w-full border-b'>
            <td class='p-2'>${startIndex + index + 1}</td>
            <td class='p-2'>
                <div class="${prNumberClass}">${doc.purchaseRequestNo ? doc.purchaseRequestNo : ''}</div>
            </td>
            <td class='p-2'>${doc.requesterName}</td>
            <td class='p-2'>${doc.departmentName}</td>
            <td class='p-2'>${submissionDate}</td>
            <td class='p-2'>${requiredDate}</td>
            <td class='p-2'>${poNumber}</td>
            <td class='p-2'>${status}</td>
            <td class='p-2'>
                <button onclick="detailDoc('${doc.id}', '${doc.prType}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });
    
    // Update pagination info
    updatePaginationInfo(data.length);
}

// Function to update pagination information
function updatePaginationInfo(totalItems) {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    document.getElementById('startItem').textContent = startItem;
    document.getElementById('endItem').textContent = endItem;
    document.getElementById('totalItems').textContent = totalItems;
    
    // Update pagination buttons
    updatePaginationButtons(totalItems);
}

// Function to update pagination buttons state
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
    const totalPages = Math.ceil(filteredPurchaseRequests.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        populatePurchaseRequests(filteredPurchaseRequests);
    }
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

function editDoc() {
alert("Edit Document: " + detail);
// Di sini kamu bisa menambahkan kode untuk membuka modal edit atau halaman edit
}

function updateDoc(id) {
alert("Update Document: " + id);
// Di sini kamu bisa menambahkan logika untuk update dokumen, misalnya memperbarui status di localStorage
}

function toggleSidebar() {
    // No-op function - sidebar toggle is disabled to keep it permanently open
    return;
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Fungsi Download Excel
function downloadExcel() {
    // Use the currently filtered data
    const dataToExport = [...filteredPurchaseRequests];
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Get current tab name for the file name
    const statusText = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
    
    // Convert data to worksheet format
    const wsData = dataToExport.map(doc => {
        // Format dates
        const submissionDate = doc.submissionDate ? doc.submissionDate.split('T')[0] : '';
        const requiredDate = doc.requiredDate ? doc.requiredDate.split('T')[0] : '';
        
        // Format PO number
        const poNumber = doc.docEntrySAP ? `PO-${doc.docEntrySAP.toString().padStart(4, '0')}` : '';
        
        return {
            'Document Number': doc.id || '',
            'PR Number': doc.purchaseRequestNo || '',
            'Requester': doc.requesterName || '',
            'Department': doc.departmentName || '',
            'Submission Date': submissionDate,
            'Required Date': requiredDate,
            'PO Number': poNumber,
            'Status': doc.status || ''
        };
    });
    
    // Create worksheet and add it to the workbook
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
        { wch: 12 }  // Status
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Requests');
    
    // Generate the Excel file with current filter in the filename
    XLSX.writeFile(workbook, `purchase_request_${statusText.toLowerCase()}_list.xlsx`);
}

// Fungsi Download PDF
function downloadPDF() {
    // Use the jsPDF library
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get current tab name for the title
    const statusText = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
    
    // Add title with current filter information
    doc.setFontSize(16);
    doc.text(`Purchase Request Report - ${statusText}`, 14, 15);
    
    // Add timestamp
    const now = new Date();
    const timestamp = `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    doc.setFontSize(10);
    doc.text(timestamp, 14, 22);
    
    // Create table data from the filtered documents
    const dataToExport = [...filteredPurchaseRequests];
    const tableData = dataToExport.map(doc => {
        // Format dates
        const submissionDate = doc.submissionDate ? doc.submissionDate.split('T')[0] : '';
        const requiredDate = doc.requiredDate ? doc.requiredDate.split('T')[0] : '';
        
        // Format PO number
        const poNumber = doc.docEntrySAP ? `PO-${doc.docEntrySAP.toString().padStart(4, '0')}` : '';
        
        return [
            doc.id || '',
            doc.purchaseRequestNo || '',
            doc.requesterName || '',
            doc.departmentName || '',
            submissionDate,
            requiredDate,
            poNumber,
            doc.status || ''
        ];
    });
    
    // Add table with styling
    doc.autoTable({
        head: [['Doc Number', 'PR Number', 'Requester', 'Department', 'Submission Date', 'Required Date', 'PO Number', 'Status']],
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
            3: { cellWidth: 25 },      // Department
            4: { cellWidth: 22 },      // Submission Date
            5: { cellWidth: 22 },      // Required Date
            6: { cellWidth: 20 },      // PO Number
            7: { cellWidth: 20 }       // Status
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
    doc.text(`Total Records: ${dataToExport.length}`, 14, finalY + 10);
    
    // Save the PDF with current filter in the filename
    doc.save(`purchase_request_${statusText.toLowerCase()}_list.pdf`);
}

// Add window.onload event listener
window.onload = function() {
    fetchPurchaseRequests();
    
    // Add event listener for search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Add event listener to the search type dropdown
    const searchType = document.getElementById('searchType');
    if (searchType) {
        searchType.addEventListener('change', function() {
            const searchTerm = document.getElementById('searchInput').value.trim();
            filterPurchaseRequests(searchTerm);
        });
    }
};

// Function to handle search input
function handleSearch(event) {
    const searchTerm = event.target.value.trim();
    filterPurchaseRequests(searchTerm);
}

function detailDoc(id, prType) {
    window.location.href = `../detailPages/detailPR.html?pr-id=${id}&pr-type=${prType}`;
}
