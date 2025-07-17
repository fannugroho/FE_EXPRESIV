// Variabel untuk menyimpan dokumen reimbursement
let reimbursementDocs = [];

// Fungsi untuk menampilkan modal reimbursement
function showReimbursementModal() {
    // Ambil data reimbursement
    fetchReimbursementDocs();
    
    // Tampilkan modal
    document.getElementById('reimbursementModal').classList.remove('hidden');
}

// Fungsi untuk menutup modal reimbursement
function closeReimbursementModal() {
    document.getElementById('reimbursementModal').classList.add('hidden');
}

// Fungsi untuk mengambil data dokumen
function fetchReimbursementDocs() {
    const tableBody = document.getElementById("reimbursementDocs");
    tableBody.innerHTML = '<tr><td colspan="9" class="p-4 text-center">Loading data...</td></tr>';
    
    fetch(`https://expressiv.idsdev.site/api/reimbursements?Status=received`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'accept': '*/*'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.status && data.data) {
            // Format baru dengan property status dan data
            reimbursementDocs = data.data;
            displayReimbursementDocs(reimbursementDocs);
            
            if (reimbursementDocs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="9" class="p-4 text-center">No documents available</td></tr>';
            }
        } else if (Array.isArray(data)) {
            // Fallback untuk format lama jika masih digunakan
            reimbursementDocs = data;
            displayReimbursementDocs(reimbursementDocs);
            
            if (reimbursementDocs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="9" class="p-4 text-center">No documents available</td></tr>';
            }
        } else {
            tableBody.innerHTML = '<tr><td colspan="9" class="p-4 text-center text-red-500">No data available</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error fetching document data:', error);
        tableBody.innerHTML = '<tr><td colspan="9" class="p-4 text-center text-red-500">Error loading data. Please try again later.</td></tr>';
    });
}

// Fungsi untuk menampilkan dokumen
function displayReimbursementDocs(docs) {
    const tableBody = document.getElementById("reimbursementDocs");
    tableBody.innerHTML = "";
    
    if (docs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="p-4 text-center">No documents available</td></tr>';
        return;
    }
    
    docs.forEach((doc, index) => {
        // Fungsi untuk menerapkan kelas scrollable jika teks melebihi 10 karakter
        const applyScrollClass = (text) => {
            if (text && text.length > 10) {
                return `<div class="table-cell-scrollable">${text}</div>`;
            }
            return text || '-';
        };
        
        // Format data berdasarkan struktur API baru
        const voucherNo = applyScrollClass(doc.voucherNo || '-');
        const requesterName = applyScrollClass(doc.requesterName || '-');
        const department = applyScrollClass(doc.department || '-');
        
        // Format nilai Total
        const totalValue = doc.totalAmount ? doc.totalAmount.toLocaleString() : '-';
        const total = applyScrollClass(totalValue);
        
        // Format tanggal
        const postingDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
        const dueDate = doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : '-';
        
        // Pay To
        const payTo = applyScrollClass(doc.payToName || '-');
        
        // Status
        const status = doc.status || 'Draft';
        let statusClass = "bg-gray-100 text-gray-800"; // Default
        
        if (status === 'Approved' || status === 'Received') {
            statusClass = "bg-green-100 text-green-800";
        } else if (status === 'Rejected') {
            statusClass = "bg-red-100 text-red-800";
        } else if (status === 'Pending' || status === 'Draft') {
            statusClass = "bg-yellow-100 text-yellow-800";
        }
        
        const row = `<tr class='border-b hover:bg-gray-100'>
            <td class='p-2'>${voucherNo}</td>
            <td class='p-2'>${requesterName}</td>
            <td class='p-2'>${department}</td>
            <td class='p-2'>${postingDate}</td>
            <td class='p-2'>${dueDate}</td>
            <td class='p-2'>${payTo}</td>
            <td class='p-2'>${total}</td>
            <td class='p-2'><span class="px-2 py-1 ${statusClass} rounded-full text-xs">${status}</span></td>
            <td class='p-2'>
                <button onclick="selectReimbursement('${doc.id || ''}', '${doc.voucherNo || ''}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Select</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// Fungsi untuk memfilter dokumen reimbursement berdasarkan pencarian
function filterReimbursementDocs() {
    const searchTerm = document.getElementById('reimSearchInput').value.toLowerCase();
    
    if (!searchTerm) {
        displayReimbursementDocs(reimbursementDocs);
        return;
    }
    
    const filteredDocs = reimbursementDocs.filter(doc => {
        return (
            (doc.voucherNo && doc.voucherNo.toLowerCase().includes(searchTerm)) ||
            (doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm)) ||
            (doc.department && doc.department.toLowerCase().includes(searchTerm)) ||
            (doc.payToName && doc.payToName.toLowerCase().includes(searchTerm)) ||
            (doc.status && doc.status.toLowerCase().includes(searchTerm))
        );
    });
    
    displayReimbursementDocs(filteredDocs);
}

// Fungsi untuk memilih dokumen dan membuat outgoing payment
function selectReimbursement(docId, voucherNo) {
    // Simpan ID dokumen yang dipilih ke localStorage atau variabel global
    localStorage.setItem('selectedDocId', docId);
    localStorage.setItem('selectedVoucherNo', voucherNo);
    
    // Cari data dokumen yang dipilih
    const selectedDoc = reimbursementDocs.find(doc => 
        (doc.id && doc.id === docId) || 
        (doc.voucherNo === voucherNo)
    );
    
    if (selectedDoc) {
        // Simpan seluruh data dokumen untuk digunakan di halaman addOPReim.html
        localStorage.setItem('selectedReimbursementData', JSON.stringify(selectedDoc));
    }
    
    // Redirect ke halaman pembuatan outgoing payment
    window.location.href = "../addPages/addOPReim.html";
}

function loadDashboard() {
    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found. Please login again.');
        return;
    }

    // Fetch dashboard summary data
    fetch(`https://expressiv.idsdev.site/api/staging-outgoing-payments/dashboard/summary`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handle different response structures
            let summary;
            if (data.status && data.data) {
                // Response with status wrapper
                summary = data.data;
            } else if (data.data) {
                // Response with data property
                summary = data.data;
            } else {
                // Direct response or fallback
                summary = data;
            }
            
            console.log("Dashboard Summary:", summary);
            
            // Create a default summary object with zeros if properties are missing
            const defaultSummary = {
                total: 0,
                draft: 0,
                prepared: 0,
                checked: 0,
                acknowledged: 0,
                approved: 0,
                rejected: 0,
                paid: 0,
                settled: 0
            };
            
            // Merge with actual data
            summary = { ...defaultSummary, ...summary };
            
            // Update dashboard counts safely
            const updateElement = (id, value) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            };
            
            updateElement("totalDocs", summary.total);
            updateElement("draftDocs", summary.draft);
            updateElement("preparedDocs", summary.prepared);
            updateElement("checkedDocs", summary.checked);
            updateElement("acknowledgedDocs", summary.acknowledged);
            updateElement("approvedDocs", summary.approved);
            updateElement("rejectedDocs", summary.rejected);
            updateElement("paidDocs", summary.paid);
            updateElement("settledDocs", summary.settled);
        })
        .catch(error => {
            console.error('Error fetching summary data:', error);
        });

    // Fetch document list
    fetch(`https://expressiv.idsdev.site/api/staging-outgoing-payments/headers?includeDetails=false`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handle the new API response structure
            let documents;
            if (Array.isArray(data)) {
                // Direct array response
                documents = data;
            } else if (data.status && data.data) {
                // Response with status wrapper
                documents = data.data;
            } else if (data.data) {
                // Response with data property
                documents = data.data;
            } else {
                // Fallback to data itself
                documents = data;
            }
            console.log("Documents:", documents);
            console.log("User ID:", userId);
            console.log("Total documents from API:", documents.length);
            // Show all documents instead of filtering by user (for now)
            const userDocuments = documents; // Changed: show all documents
            console.log("Filtered documents:", userDocuments.length);
            // Simpan dokumen untuk penggunaan di tab
            window.allDocuments = userDocuments;
            window.filteredDocuments = userDocuments;
            window.currentTab = 'all';
            window.currentPage = 1;
            window.itemsPerPage = 10;
            // Display documents in table
            displayDocuments(userDocuments);
        })
        .catch(error => {
            console.error('Error fetching document data:', error);
            document.getElementById("recentDocs").innerHTML = 
                `<tr><td colspan="11" class="p-4 text-center text-red-500">Error loading data. Please try again later.</td></tr>`;
        });
}

// Function untuk menampilkan dokumen dengan pagination
function displayDocuments(documents) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, documents.length);
    const paginatedDocuments = documents.slice(startIndex, endIndex);
    
    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";
    
    paginatedDocuments.forEach((doc, index) => {
        // Fungsi untuk menerapkan kelas scrollable jika teks melebihi 10 karakter
        const applyScrollClass = (text) => {
            if (text && text.length > 10) {
                return `<div class="table-cell-scrollable">${text}</div>`;
            }
            return text || '-';
        };
        
        // Get document status from approval object if available
        const status = doc.approval ? doc.approval.approvalStatus : (doc.status || doc.type || 'Draft');
        
        // Memformat data dengan kelas scrollable jika perlu
        const opNo = applyScrollClass(doc.expressivNo || doc.outgoingPaymentNo || doc.docNum);
        const requester = applyScrollClass(doc.requesterName || '-');
        const department = applyScrollClass(doc.departmentName || '-');
        const bpName = applyScrollClass(doc.cardName || doc.bpName || doc.paidToName || '-');
        
        // Format nilai Total LC dan Total FC
        const totalLCValue = doc.trsfrSum ? doc.trsfrSum.toLocaleString() : 
                            (doc.totalLC ? doc.totalLC.toLocaleString() : 
                            (doc.docTotal ? doc.docTotal.toLocaleString() : '-'));
        
        const totalFCValue = doc.totalFC ? doc.totalFC.toLocaleString() : 
                            (doc.docTotalFC ? doc.docTotalFC.toLocaleString() : '-');
        
        // Terapkan kelas scrollable untuk Total LC dan Total FC jika diperlukan
        const totalLC = applyScrollClass(totalLCValue);
        const totalFC = applyScrollClass(totalFCValue);
        
        // Format tanggal
        const postingDate = doc.docDate ? new Date(doc.docDate).toLocaleDateString() : 
                           (doc.postingDate ? new Date(doc.postingDate).toLocaleDateString() : 
                           (doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-'));
        
        const dueDate = doc.docDueDate ? new Date(doc.docDueDate).toLocaleDateString() : 
                       (doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : '-');
        
        const row = `<tr class='border-b'>
            <td class='p-2'>${startIndex + index + 1}</td>
            <td class='p-2'>${opNo}</td>
            <td class='p-2'>${requester}</td>
            <td class='p-2'>${department}</td>
            <td class='p-2'>${postingDate}</td>
            <td class='p-2'>${dueDate}</td>
            <td class='p-2'>${bpName}</td>
            <td class='p-2'>${totalLC}</td>
            <td class='p-2'>${totalFC}</td>
            <td class='p-2'>${status}</td>
            <td class='p-2'>
                <button onclick="detailDoc('${doc.stagingID || doc.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });
    
    // Update pagination info
    document.getElementById('startItem').textContent = documents.length > 0 ? startIndex + 1 : 0;
    document.getElementById('endItem').textContent = endIndex;
    document.getElementById('totalItems').textContent = documents.length;
    
    // Update pagination buttons
    updatePaginationButtons(documents.length);
}

// Function untuk update pagination buttons
function updatePaginationButtons(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    
    // Update prev/next button states
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.classList.toggle('disabled', currentPage <= 1);
    nextBtn.classList.toggle('disabled', currentPage >= totalPages);
}

// Function untuk mengubah halaman
function changePage(direction) {
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayDocuments(filteredDocuments);
    }
}

// Fungsi navigasi ke halaman status tertentu
function goToCheckedDocs() {
    currentTab = 'checked';
    currentPage = 1;
    filteredDocuments = allDocuments.filter(doc => 
        (doc.approval && doc.approval.approvalStatus === 'Checked') || 
        doc.status === 'Checked'
    );
    displayDocuments(filteredDocuments);
}

function goToApprovedDocs() {
    currentTab = 'approved';
    currentPage = 1;
    filteredDocuments = allDocuments.filter(doc => 
        (doc.approval && doc.approval.approvalStatus === 'Approved') || 
        doc.status === 'Approved'
    );
    displayDocuments(filteredDocuments);
}

function goToRejectDocs() {
    currentTab = 'rejected';
    currentPage = 1;
    filteredDocuments = allDocuments.filter(doc => 
        (doc.approval && doc.approval.approvalStatus === 'Rejected') || 
        doc.status === 'Rejected'
    );
    displayDocuments(filteredDocuments);
}

function goToPaidDocs() {
    currentTab = 'paid';
    currentPage = 1;
    filteredDocuments = allDocuments.filter(doc => 
        (doc.approval && doc.approval.approvalStatus === 'Paid') || 
        doc.status === 'Paid'
    );
    displayDocuments(filteredDocuments);
}

function goToSettledDocs() {
    currentTab = 'settled';
    currentPage = 1;
    filteredDocuments = allDocuments.filter(doc => 
        (doc.approval && doc.approval.approvalStatus === 'Settled') || 
        doc.status === 'Settled'
    );
    displayDocuments(filteredDocuments);
}

// Function untuk switch tab
function switchTab(tab) {
    currentTab = tab;
    currentPage = 1;
    
    // Update tab button styling
    document.getElementById('allTabBtn').classList.remove('tab-active');
    document.getElementById('draftTabBtn').classList.remove('tab-active');
    document.getElementById('preparedTabBtn').classList.remove('tab-active');
    
    if (tab === 'all') {
        document.getElementById('allTabBtn').classList.add('tab-active');
        filteredDocuments = allDocuments;
    } else if (tab === 'draft') {
        document.getElementById('draftTabBtn').classList.add('tab-active');
        filteredDocuments = allDocuments.filter(doc => 
            (doc.approval && doc.approval.approvalStatus === 'Draft') || 
            doc.status === 'Draft' || 
            (!doc.status && !doc.approval)
        );
    } else if (tab === 'prepared') {
        document.getElementById('preparedTabBtn').classList.add('tab-active');
        filteredDocuments = allDocuments.filter(doc => 
            (doc.approval && doc.approval.approvalStatus === 'Prepared') || 
            doc.status === 'Prepared'
        );
    }
    
    // Filter berdasarkan pencarian jika ada
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const searchType = document.getElementById('searchType')?.value || 'all';
    
    if (searchTerm) {
        filteredDocuments = filteredDocuments.filter(doc => {
            if (searchType === 'cash' || searchType === 'op') {
                return (doc.expressivNo && doc.expressivNo.toLowerCase().includes(searchTerm)) || 
                       (doc.outgoingPaymentNo && doc.outgoingPaymentNo.toLowerCase().includes(searchTerm)) ||
                       (doc.docNum && doc.docNum.toString().includes(searchTerm));
            } else if (searchType === 'requester') {
                return doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm);
            } else if (searchType === 'department') {
                return doc.departmentName && doc.departmentName.toLowerCase().includes(searchTerm);
            } else if (searchType === 'postingDate') {
                const postingDate = doc.docDate || doc.postingDate || doc.submissionDate;
                return postingDate && new Date(postingDate).toLocaleDateString().toLowerCase().includes(searchTerm);
            } else if (searchType === 'dueDate') {
                const dueDate = doc.docDueDate || doc.dueDate;
                return dueDate && new Date(dueDate).toLocaleDateString().toLowerCase().includes(searchTerm);
            } else if (searchType === 'bpName') {
                const bpName = doc.cardName || doc.bpName || doc.paidToName || '';
                return bpName.toLowerCase().includes(searchTerm);
            } else if (searchType === 'totalLC') {
                const totalLC = doc.trsfrSum ? doc.trsfrSum.toString() : 
                               (doc.totalLC ? doc.totalLC.toString() : 
                               (doc.docTotal ? doc.docTotal.toString() : ''));
                return totalLC.toLowerCase().includes(searchTerm);
            } else if (searchType === 'totalFC') {
                const totalFC = doc.totalFC ? doc.totalFC.toString() : (doc.docTotalFC ? doc.docTotalFC.toString() : '');
                return totalFC.toLowerCase().includes(searchTerm);
            } else if (searchType === 'status') {
                const status = doc.approval ? doc.approval.approvalStatus : (doc.status || doc.type || '');
                return status.toLowerCase().includes(searchTerm);
            } else {
                // Default search across multiple fields
                return (doc.expressivNo && doc.expressivNo.toLowerCase().includes(searchTerm)) ||
                       (doc.outgoingPaymentNo && doc.outgoingPaymentNo.toLowerCase().includes(searchTerm)) ||
                       (doc.docNum && doc.docNum.toString().includes(searchTerm)) ||
                       (doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm)) ||
                       (doc.cardName && doc.cardName.toLowerCase().includes(searchTerm)) ||
                       (doc.bpName && doc.bpName.toLowerCase().includes(searchTerm)) ||
                       (doc.paidToName && doc.paidToName.toLowerCase().includes(searchTerm)) ||
                       (doc.comments && doc.comments.toLowerCase().includes(searchTerm));
            }
        });
    }
    
    displayDocuments(filteredDocuments);
}

// Add keyboard shortcuts for tab navigation
document.addEventListener('keydown', function(event) {
    // Alt + A: Switch to All Documents sub-tab
    if (event.altKey && event.key === 'a') {
        switchTab('all');
    }
    // Alt + D: Switch to Draft sub-tab
    else if (event.altKey && event.key === 'd') {
        switchTab('draft');
    }
    // Alt + P: Switch to Prepared sub-tab
    else if (event.altKey && event.key === 'p') {
        switchTab('prepared');
    }
});

// Fungsi untuk mendapatkan ID pengguna yang login
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

// Add event listener to selectAll checkbox if it exists
const selectAllCheckbox = document.getElementById("selectAll");
if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", function () {
        let checkboxes = document.querySelectorAll(".rowCheckbox");
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
}

// Event listener untuk search input
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        switchTab(currentTab); // Ini akan menerapkan filter pencarian dengan tab saat ini
    });
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
    if (!filteredDocuments || filteredDocuments.length === 0) {
        alert("No data to export!");
        return;
    }
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet format
    const wsData = [
        ["No", "Outgoing Payment No.", "Requester", "Department", "Posting Date", "Due Date", "BP Name", "Total LC", "Total FC", "Status"]
    ];
    
    filteredDocuments.forEach((doc, index) => {
        wsData.push([
            index + 1,
            doc.outgoingPaymentNo || '-',
            doc.requesterName || '-',
            doc.departmentName || '-',
            doc.postingDate ? new Date(doc.postingDate).toLocaleDateString() : (doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-'),
            doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : '-',
            doc.bpName || doc.paidToName || '-',
            doc.totalLC ? doc.totalLC.toLocaleString() : (doc.docTotal ? doc.docTotal.toLocaleString() : '-'),
            doc.totalFC ? doc.totalFC.toLocaleString() : (doc.docTotalFC ? doc.docTotalFC.toLocaleString() : '-'),
            doc.status || '-'
        ]);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Outgoing Payments");
    
    // Generate Excel file and trigger download
    const fileName = `Outgoing_Payments_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// Fungsi Download PDF
function downloadPDF() {
    if (!filteredDocuments || filteredDocuments.length === 0) {
        alert("No data to export!");
        return;
    }
    
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
        title: 'Outgoing Payments Report'
    });
    
    // Add title
    doc.setFontSize(18);
    doc.text('Outgoing Payments Report', 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableColumn = ["No", "OP No.", "Requester", "Department", "Posting Date", "Due Date", "BP Name", "Total LC", "Total FC", "Status"];
    const tableRows = [];
    
    filteredDocuments.forEach((doc, index) => {
        const rowData = [
            index + 1,
            doc.outgoingPaymentNo || '-',
            doc.requesterName || '-',
            doc.departmentName || '-',
            doc.postingDate ? new Date(doc.postingDate).toLocaleDateString() : (doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-'),
            doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : '-',
            doc.bpName || doc.paidToName || '-',
            doc.totalLC ? doc.totalLC.toLocaleString() : (doc.docTotal ? doc.docTotal.toLocaleString() : '-'),
            doc.totalFC ? doc.totalFC.toLocaleString() : (doc.docTotalFC ? doc.docTotalFC.toLocaleString() : '-'),
            doc.status || '-'
        ];
        tableRows.push(rowData);
    });
    
    // Generate table
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 1,
            overflow: 'linebreak',
            halign: 'left'
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        }
    });
    
    // Save PDF
    const fileName = `Outgoing_Payments_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

function goToMenu() { window.location.href = "Menu.html"; }
function goToAddDoc() {window.location.href = "AddDoc.html"; }
function goToAddReim() {window.location.href = "AddReim.html"; }

function goToAddSettle() {window.location.href = "AddSettle.html"; }
function goToAddPO() {window.location.href = "AddPO.html"; }
function goToMenuPR() { window.location.href = "MenuPR.html"; }
function goToMenuReim() { window.location.href = "MenuReim.html"; }
function goToMenuCash() { window.location.href = "MenuCash.html"; }
function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
function goToMenuPO() { window.location.href = "MenuPO.html"; }
function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; } 

function detailDoc(opId) {
    // Navigate to outgoing payment detail page
    window.location.href = `/detailPages/detailOPVendor.html?op-id=${opId}`;
}

window.onload = loadDashboard;