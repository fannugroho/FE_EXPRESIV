// Pagination variables
let currentPage = 1;
const itemsPerPage = 20;
let allPurchaseRequests = [];
let filteredPurchaseRequests = [];
let currentTab = 'all'; // Track the current active tab
let currentSearchTerm = '';
let currentSearchType = 'pr';
let totalItems = 0;

async function fetchPurchaseRequests(page = 1, searchTerm = '', searchType = 'pr') {
    const userId = getUserId();
    
    // Build query parameters
    const params = new URLSearchParams({
        pageNumber: page,
        pageSize: itemsPerPage,
        requesterId: userId
    });
    
    // Add search parameters based on search type
    if (searchTerm) {
        switch (searchType) {
            case 'pr':
                params.append('purchaseRequestNo', searchTerm);
                break;
            case 'requester':
                params.append('requesterName', searchTerm);
                break;
            case 'status':
                params.append('status', searchTerm);
                break;
            case 'date':
                // For date search, try to parse and use date range
                const dateValue = new Date(searchTerm);
                if (!isNaN(dateValue.getTime())) {
                    params.append('submissionDateFrom', dateValue.toISOString().split('T')[0]);
                    params.append('submissionDateTo', dateValue.toISOString().split('T')[0]);
                }
                break;
            default:
                params.append('searchTerm', searchTerm);
        }
    }
    
    // Add status filter for tabs
    if (currentTab !== 'all') {
        params.append('status', currentTab);
    }

    try {
        const response = await fetch(`${BASE_URL}/api/pr/dashboard?${params.toString()}`);
        const data = await response.json();
        
        console.log('API Response:', data);
        
        if (data && data.data) {
            allPurchaseRequests = data.data;
            filteredPurchaseRequests = data.data; // Since filtering is now done server-side
            
            // Update pagination info
            updatePaginationInfo(data.data.length);
            populatePurchaseRequests(data.data);
        }
    } catch (error) {
        console.error('Error fetching purchase requests:', error);
    }
}

// Function to trigger search and filtering (now server-side)
function filterPurchaseRequests(searchTerm = '') {
    // Reset to page 1 when filtering
    currentPage = 1;
    currentSearchTerm = searchTerm;
    currentSearchType = document.getElementById('searchType')?.value || 'pr';
    
    // Fetch new data with filters
    fetchPurchaseRequests(currentPage, currentSearchTerm, currentSearchType);
}

// Function to switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page when switching tabs
    
    // Update active tab styling
    document.querySelectorAll('.tab-active').forEach(el => el.classList.remove('tab-active'));
    
    if (tabName === 'draft') {
        document.getElementById('draftTabBtn').classList.add('tab-active');
    } else if (tabName === 'prepared') {
        document.getElementById('preparedTabBtn').classList.add('tab-active');
    } else {
        document.getElementById('allTabBtn').classList.add('tab-active');
    }
    
    // Fetch documents for the new tab
    fetchPurchaseRequests(currentPage, currentSearchTerm, currentSearchType);
    
    // Perbarui jumlah dokumen saat tab berubah
    loadDashboardCounts();
}

async function loadDashboardCounts() {
    const userId = getUserId();
    
    try {
        // Fetch counts for each status using separate API calls
        const draftResponse = await fetch(`${BASE_URL}/api/pr/dashboard?requesterId=${userId}&status=draft`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const preparedResponse = await fetch(`${BASE_URL}/api/pr/dashboard?requesterId=${userId}&status=prepared`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const checkedResponse = await fetch(`${BASE_URL}/api/pr/dashboard?requesterId=${userId}&status=checked`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const acknowledgedResponse = await fetch(`${BASE_URL}/api/pr/dashboard?requesterId=${userId}&status=acknowledged`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const approvedResponse = await fetch(`${BASE_URL}/api/pr/dashboard?requesterId=${userId}&status=approved`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const receivedResponse = await fetch(`${BASE_URL}/api/pr/dashboard?requesterId=${userId}&status=received`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const rejectedResponse = await fetch(`${BASE_URL}/api/pr/dashboard?requesterId=${userId}&status=rejected`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        // Parse responses
        const draftData = draftResponse.ok ? await draftResponse.json() : { data: [] };
        const preparedData = preparedResponse.ok ? await preparedResponse.json() : { data: [] };
        const checkedData = checkedResponse.ok ? await checkedResponse.json() : { data: [] };
        const acknowledgedData = acknowledgedResponse.ok ? await acknowledgedResponse.json() : { data: [] };
        const approvedData = approvedResponse.ok ? await approvedResponse.json() : { data: [] };
        const receivedData = receivedResponse.ok ? await receivedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };

        // Calculate counts
        const draftCount = draftData.data ? draftData.data.length : 0;
        const preparedCount = preparedData.data ? preparedData.data.length : 0;
        const checkedCount = checkedData.data ? checkedData.data.length : 0;
        const acknowledgedCount = acknowledgedData.data ? acknowledgedData.data.length : 0;
        const approvedCount = approvedData.data ? approvedData.data.length : 0;
        const receivedCount = receivedData.data ? receivedData.data.length : 0;
        const rejectedCount = rejectedData.data ? rejectedData.data.length : 0;
        
        // Calculate total
        const totalCount = draftCount + preparedCount + checkedCount + acknowledgedCount + 
                          approvedCount + receivedCount + rejectedCount;

        // Update counters
        document.getElementById("totalCount").textContent = totalCount;
        document.getElementById("draftCount").textContent = draftCount;
        document.getElementById("preparedCount").textContent = preparedCount;
        document.getElementById("checkedCount").textContent = checkedCount;
        document.getElementById("acknowledgedCount").textContent = acknowledgedCount;
        document.getElementById("approvedCount").textContent = approvedCount;
        document.getElementById("receivedCount").textContent = receivedCount;
        document.getElementById("rejectedCount").textContent = rejectedCount;
        
        console.log('Dashboard counts updated successfully');
    } catch (error) {
        console.error('Error loading dashboard counts:', error);
        // Set default values on error
        document.getElementById("totalCount").textContent = 0;
        document.getElementById("draftCount").textContent = 0;
        document.getElementById("preparedCount").textContent = 0;
        document.getElementById("checkedCount").textContent = 0;
        document.getElementById("acknowledgedCount").textContent = 0;
        document.getElementById("approvedCount").textContent = 0;
        document.getElementById("receivedCount").textContent = 0;
        document.getElementById("rejectedCount").textContent = 0;
    }
}

function populatePurchaseRequests(data) {
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    
    // Buat salinan data untuk diurutkan agar tidak mengubah data asli
    const sortedData = [...data].sort((a, b) => {
        // Pertama, urutkan berdasarkan tanggal submission terbaru
        const dateA = a.submissionDate ? new Date(a.submissionDate) : new Date(0);
        const dateB = b.submissionDate ? new Date(b.submissionDate) : new Date(0);
        
        if (dateA.getTime() !== dateB.getTime()) {
            return dateB - dateA; // Tanggal terbaru di atas
        }
        
        // Jika tanggal submission sama, urutkan berdasarkan PR Number terbesar
        const prNumberA = a.purchaseRequestNo ? parseInt(a.purchaseRequestNo.replace(/\D/g, '')) : 0;
        const prNumberB = b.purchaseRequestNo ? parseInt(b.purchaseRequestNo.replace(/\D/g, '')) : 0;
        return prNumberB - prNumberA; // PR Number terbesar di atas
    });
    
    // Data is already paginated from the server, so display all items
    sortedData.forEach((doc, index) => {
        // Format dates for display
        const submissionDate = doc.submissionDate ? doc.submissionDate.split('T')[0] : '';
        const requiredDate = doc.requiredDate ? doc.requiredDate.split('T')[0] : '';
        
        // PO number may be null, handle that case
        const poNumber = doc.docEntrySAP ? `PO-${doc.docEntrySAP.toString().padStart(4, '0')}` : '';
        
        // Get status from approval object
        const status = doc.status ? doc.status : "Open";
        
        // Check if fields are longer than 10 characters and apply scrollable class
        const docNumberClass = doc.id && doc.id.length > 10 ? 'scrollable-cell' : '';
        const prNumberClass = doc.purchaseRequestNo && doc.purchaseRequestNo.length > 10 ? 'scrollable-cell' : '';
        const requesterNameClass = doc.requesterName && doc.requesterName.length > 10 ? 'scrollable-cell' : '';
        const departmentClass = doc.departmentName && doc.departmentName.length > 10 ? 'scrollable-cell' : '';
        const poNumberClass = poNumber && poNumber.length > 10 ? 'scrollable-cell' : '';
        
        const row = `<tr class='w-full border-b'>
            <td class='p-2'>
                <div class="${docNumberClass}">${(currentPage - 1) * itemsPerPage + index + 1}</div>
            </td>
            <td class='p-2'>
                <div class="${prNumberClass}">${doc.purchaseRequestNo ? doc.purchaseRequestNo : ''}</div>
            </td>
            <td class='p-2'>
                <div class="${requesterNameClass}">${doc.requesterName || ''}</div>
            </td>
            <td class='p-2'>
                <div class="${departmentClass}">${doc.departmentName || ''}</div>
            </td>
            <td class='p-2'>${submissionDate}</td>
            <td class='p-2'>${requiredDate}</td>
            <td class='p-2'>
                <div class="${poNumberClass}">${poNumber}</div>
            </td>
            <td class='p-2'>${status}</td>
            <td class='p-2'>
                <button onclick="detailDoc('${doc.id}', '${doc.prType}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// Function to update pagination information
function updatePaginationInfo(currentPageItems) {
    const startItem = currentPageItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = (currentPage - 1) * itemsPerPage + currentPageItems;
    
    document.getElementById('startItem').textContent = startItem;
    document.getElementById('endItem').textContent = endItem;
    document.getElementById('totalItems').textContent = `${endItem}+`; // Show + since we don't know total count
    
    // Update pagination buttons - we'll assume there are more pages if we got a full page
    updatePaginationButtons(currentPageItems);
}

// Function to update pagination buttons state
function updatePaginationButtons(currentPageItems) {
    document.getElementById('currentPage').textContent = currentPage;
    
    // Update prev/next button states
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.classList.toggle('disabled', currentPage <= 1);
    // Assume there are more pages if we got a full page of results
    nextBtn.classList.toggle('disabled', currentPageItems < itemsPerPage);
}

// Function to change page
function changePage(direction) {
    const newPage = currentPage + direction;
    
    if (newPage >= 1) {
        currentPage = newPage;
        fetchPurchaseRequests(currentPage, currentSearchTerm, currentSearchType);
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
async function downloadExcel() {
    // Fetch all data for export (without pagination)
    const userId = getUserId();
    const params = new URLSearchParams({
        pageSize: 10000, // Large number to get all records
        requesterId: userId
    });
    
    // Add current filters
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
                const dateValue = new Date(currentSearchTerm);
                if (!isNaN(dateValue.getTime())) {
                    params.append('submissionDateFrom', dateValue.toISOString().split('T')[0]);
                    params.append('submissionDateTo', dateValue.toISOString().split('T')[0]);
                }
                break;
        }
    }
    
    if (currentTab !== 'all') {
        params.append('status', currentTab);
    }
    
    try {
        const response = await fetch(`${BASE_URL}/api/pr/dashboard?${params.toString()}`);
        const data = await response.json();
        const dataToExport = data?.data || [];
    
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
    } catch (error) {
        console.error('Error exporting Excel:', error);
        alert('Error exporting data to Excel. Please try again.');
    }
}

// Fungsi Download PDF
async function downloadPDF() {
    // Fetch all data for export (without pagination)
    const userId = getUserId();
    const params = new URLSearchParams({
        pageSize: 10000, // Large number to get all records
        requesterId: userId
    });
    
    // Add current filters
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
                const dateValue = new Date(currentSearchTerm);
                if (!isNaN(dateValue.getTime())) {
                    params.append('submissionDateFrom', dateValue.toISOString().split('T')[0]);
                    params.append('submissionDateTo', dateValue.toISOString().split('T')[0]);
                }
                break;
        }
    }
    
    if (currentTab !== 'all') {
        params.append('status', currentTab);
    }
    
    try {
        const response = await fetch(`${BASE_URL}/api/pr/dashboard?${params.toString()}`);
        const data = await response.json();
        const dataToExport = data?.data || [];
        
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
    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Error exporting data to PDF. Please try again.');
    }
}

// Add window.onload event listener
window.onload = function() {
    // Load initial data and dashboard counts
    fetchPurchaseRequests(1, '', 'pr');
    loadDashboardCounts();
    
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
                searchInput.placeholder = 'Select date';
            } else {
                searchInput.type = 'text';
                searchInput.placeholder = `Search ${this.options[this.selectedIndex].text}`;
            }
            
            // Clear current search and trigger new search
            searchInput.value = '';
            const searchTerm = searchInput.value.trim();
            filterPurchaseRequests(searchTerm);
        });
    }
};

// Function to handle search input
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    filterPurchaseRequests(searchTerm);
}

function detailDoc(id, prType) {
    window.location.href = `../detailPages/detailPR.html?pr-id=${id}&pr-type=${prType}`;
}

function goToAddPR() {
    window.location.href = '../addPages/addPR.html';
}