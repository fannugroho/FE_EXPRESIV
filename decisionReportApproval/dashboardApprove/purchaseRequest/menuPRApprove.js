// Current tab state
let currentTab = 'draft'; // Default tab

// Load dashboard when page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    
    // Set up event listener for select all checkbox
    document.getElementById("selectAll").addEventListener("change", function() {
        const checkboxes = document.querySelectorAll(".rowCheckbox");
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });

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

function loadDashboard() {
    const documents = JSON.parse(localStorage.getItem("documents")) || [];
    
    // Update counters
    document.getElementById("totalCount").textContent = documents.length;
    document.getElementById("acknowledgeCount").textContent = documents.filter(doc => doc.status === "Acknowledge").length;
    document.getElementById("approveCount").textContent = documents.filter(doc => doc.status === "Approved").length;
    // Filter documents based on the current tab
    let filteredDocs = [];
    if (currentTab === 'acknowledge') {
        filteredDocs = documents.filter(doc => doc.status === "Acknowledge");
    } else if (currentTab === 'approve') {
        filteredDocs = documents.filter(doc => doc.status === "Approved");
    }

    // Sort the filtered docs (newest first)
    const sortedDocs = filteredDocs.slice().reverse();
    
    // Update the table
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    
    if (sortedDocs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="10" class="text-center p-4">No documents found</td></tr>`;
    } else {
        sortedDocs.forEach(doc => {
            const row = `<tr class='w-full border-b'>
                <td class='p-2'><input type="checkbox" class="rowCheckbox"></td>
                <td class='p-2'>${doc.id}</td>
                <td class='p-2'>${doc.purchaseRequestNo || '-'}</td>
                <td class='p-2'>${doc.requesterName || '-'}</td>
                <td class='p-2'>${doc.departmentName || '-'}</td>
                <td class='p-2'>${doc.submissionDate || '-'}</td>
                <td class='p-2'>${doc.requiredDate || '-'}</td>
                <td class='p-2'>${doc.poNumber || '-'}</td>
                <td class='p-2'><span class="px-2 py-1 rounded-full text-xs ${getStatusClass(doc.status)}">${doc.status}</span></td>
                <td class='p-2'>
                    <button onclick="detailDoc('${doc.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
                </td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    }

    // Update pagination info
    updatePaginationInfo(sortedDocs.length);
}

// Function to switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update active tab styling
    document.querySelectorAll('.tab-active').forEach(el => el.classList.remove('tab-active'));
    
    if (tabName === 'acknowledge') {
        document.getElementById('acknowledgeTabBtn').classList.add('tab-active');
    } else if (tabName === 'approve') {
        document.getElementById('approveTabBtn').classList.add('tab-active');
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

function detailDoc(id) {
    alert("View Document Details: " + id);
    // Implement document detail view
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

// Function to navigate to user profile page
function goToProfile() {
    // Function disabled - no action
    return;
}