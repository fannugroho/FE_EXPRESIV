const BASE_URL = "https://t246vds2-5246.asse.devtunnels.ms";

// Pagination variables
let currentPage = 1;
const itemsPerPage = 10;
let allPurchaseRequests = [];
let filteredPurchaseRequests = [];
let currentTab = 'all'; // Track the current active tab

async function fetchPurchaseRequests() {
    fetch(`${BASE_URL}/api/pr`)
        .then(response => response.json())
        .then(data => {
            if (data && data.data) {
                // Store all purchase requests
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
            (!doc.approval || doc.approval.status.toLowerCase() === 'draft')
        );
    } else {
        // 'all' tab or default
        filteredPurchaseRequests = [...allPurchaseRequests];
    }
    
    // Apply search filter if there's a search term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredPurchaseRequests = filteredPurchaseRequests.filter(doc => 
            doc.purchaseRequestNo?.toLowerCase().includes(term)
        );
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
        checked: 0,
        acknowledged: 0,
        approved: 0,
        received: 0,
        rejected: 0
    };
    
    data.forEach(doc => {
        const status = doc.approval ? doc.approval.status.toLowerCase() : 'draft';
        
        switch(status) {
            case 'draft':
                statusCounts.draft++;
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
        const submissionDate = new Date(doc.submissionDate).toISOString().split('T')[0];
        const requiredDate = new Date(doc.requiredDate).toISOString().split('T')[0];
        
        // PO number may be null, handle that case
        const poNumber = doc.docEntrySAP ? `PO-${doc.docEntrySAP.toString().padStart(4, '0')}` : '';
        
        // Get status from approval object
        const status = doc.approval ? doc.approval.status : "Open";
        
        // GR date currently not in the JSON, leaving empty for now
        const grDate = '';
        
        const row = `<tr class='w-full border-b'>
            <td class='p-2'></td>
            <td class='p-2'>${startIndex + index + 1}</td>
            <td class='p-2'>${doc.purchaseRequestNo}</td>
            <td class='p-2'>${doc.requesterName}</td>
            <td class='p-2'>${doc.departmentName}</td>
            <td class='p-2'>${submissionDate}</td>
            <td class='p-2'>${requiredDate}</td>
            <td class='p-2'>${poNumber}</td>
            <td class='p-2'>${status}</td>
            <td class='p-2'>
                <button onclick="detailDoc('${doc.id}', '${doc.prType}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
            </td>
            <td class='p-2'>${grDate}</td>
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

// document.getElementById("selectAll").addEventListener("change", function () {
//     let checkboxes = document.querySelectorAll(".rowCheckbox");
//     checkboxes.forEach(checkbox => {
//         checkbox.checked = this.checked;
//     });
// });


function toggleSidebar() {
    // No-op function - sidebar toggle is disabled to keep it permanently open
    return;
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Fungsi Download Excel
function downloadExcel() {
    const documents = JSON.parse(localStorage.getItem("documents")) || [];
    
    // Membuat workbook baru
    const workbook = XLSX.utils.book_new();
    
    // Mengonversi data ke format worksheet
    const wsData = documents.map(doc => ({
        'Document Number': doc.id,
        'PR Number': doc.purchaseRequestNo,
        'Requester': doc.requesterName,
        'Department': doc.departmentName,
        'Submission Date': doc.submissionDate,
        'Required Date': doc.requiredDate,
        'PO Number': doc.poNumber,
        'Status': doc.status,
        'GR Date': doc.grDate
    }));
    
    // Membuat worksheet dan menambahkannya ke workbook
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Requests');
    
    // Menghasilkan file Excel
    XLSX.writeFile(workbook, 'purchase_request_list.xlsx');
}

// Fungsi Download PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Menambahkan judul
    doc.setFontSize(16);
    doc.text('Purchase Request Report', 14, 15);
    
    // Membuat data tabel dari documents
    const documents = JSON.parse(localStorage.getItem("documents")) || [];
    const tableData = documents.map(doc => [
        doc.id,
        doc.purchaseRequestNo,
        doc.requesterName,
        doc.departmentName,
        doc.submissionDate,
        doc.requiredDate,
        doc.poNumber,
        doc.status,
        doc.grDate
    ]);
    
    // Menambahkan tabel
    doc.autoTable({
        head: [['Doc Number', 'PR Number', 'Requester', 'Department', 'Submission Date', 'Required Date', 'PO Number', 'Status', 'GR Date']],
        body: tableData,
        startY: 25
    });
    
    // Menyimpan PDF
    doc.save('purchase_request_list.pdf');
}

// Add window.onload event listener
window.onload = function() {
    fetchPurchaseRequests();
    
    // Add event listener for search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
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
