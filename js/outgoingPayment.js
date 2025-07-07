function loadDashboard() {
    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found. Please login again.');
        return;
    }

    fetch(`${BASE_URL}/api/outgoing-payment/dashboard`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status && data.data) {
                const documents = data.data;
                console.log("Documents:", documents);
                console.log("User ID:", userId);
                console.log("Total documents from API:", documents.length);
                
                // Show all documents instead of filtering by user (for now)
                const userDocuments = documents; // Changed: show all documents
                console.log("Filtered documents:", userDocuments.length);
                
                // Update dashboard counts
                document.getElementById("totalDocs").textContent = userDocuments.length;
                document.getElementById("draftDocs").textContent = userDocuments.filter(doc => doc.status === "Draft").length;
                document.getElementById("preparedDocs").textContent = userDocuments.filter(doc => doc.status === "Prepared").length;
                document.getElementById("checkedDocs").textContent = userDocuments.filter(doc => doc.status === "Checked").length;
                document.getElementById("acknowledgedDocs").textContent = userDocuments.filter(doc => doc.status === "Acknowledged").length;
                document.getElementById("approvedDocs").textContent = userDocuments.filter(doc => doc.status === "Approved").length;
                document.getElementById("paidDocs").textContent = userDocuments.filter(doc => doc.status === "Paid").length;
                document.getElementById("rejectedDocs").textContent = userDocuments.filter(doc => doc.status === "Rejected").length;
                document.getElementById("settledDocs").textContent = userDocuments.filter(doc => doc.status === "Settled").length;
                
                // Simpan dokumen untuk penggunaan di tab
                window.allDocuments = userDocuments;
                window.filteredDocuments = userDocuments;
                window.currentTab = 'all';
                window.currentPage = 1;
                window.itemsPerPage = 10;
                
                // Display documents in table
                displayDocuments(userDocuments);
            } else {
                console.error("API response does not contain expected data");
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById("recentDocs").innerHTML = 
                `<tr><td colspan="9" class="p-4 text-center text-red-500">Error loading data. Please try again later.</td></tr>`;
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
        
        // Memformat data dengan kelas scrollable jika perlu
        const opNo = applyScrollClass(doc.outgoingPaymentNo);
        const requester = applyScrollClass(doc.requesterName);
        const department = applyScrollClass(doc.departmentName);
        const bpName = applyScrollClass(doc.bpName || doc.paidToName);
        
        // Format nilai Total LC dan Total FC
        const totalLCValue = doc.totalLC ? doc.totalLC.toLocaleString() : (doc.docTotal ? doc.docTotal.toLocaleString() : '-');
        const totalFCValue = doc.totalFC ? doc.totalFC.toLocaleString() : (doc.docTotalFC ? doc.docTotalFC.toLocaleString() : '-');
        
        // Terapkan kelas scrollable untuk Total LC dan Total FC jika diperlukan
        const totalLC = applyScrollClass(totalLCValue);
        const totalFC = applyScrollClass(totalFCValue);
        
        const row = `<tr class='border-b'>
            <td class='p-2'>${startIndex + index + 1}</td>
            <td class='p-2'>${opNo}</td>
            <td class='p-2'>${requester}</td>
            <td class='p-2'>${department}</td>
            <td class='p-2'>${doc.postingDate ? new Date(doc.postingDate).toLocaleDateString() : (doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-')}</td>
            <td class='p-2'>${doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : '-'}</td>
            <td class='p-2'>${bpName}</td>
            <td class='p-2'>${totalLC}</td>
            <td class='p-2'>${totalFC}</td>
            <td class='p-2'>${doc.status || '-'}</td>
            <td class='p-2'>
                <button onclick="detailDoc('${doc.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
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
        filteredDocuments = allDocuments.filter(doc => doc.status === 'Draft');
    } else if (tab === 'prepared') {
        document.getElementById('preparedTabBtn').classList.add('tab-active');
        filteredDocuments = allDocuments.filter(doc => doc.status === 'Prepared');
    }
    
    // Filter berdasarkan pencarian jika ada
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const searchType = document.getElementById('searchType').value;
    
    if (searchTerm) {
        filteredDocuments = filteredDocuments.filter(doc => {
            if (searchType === 'cash' && doc.outgoingPaymentNo) {
                return doc.outgoingPaymentNo.toLowerCase().includes(searchTerm);
            } else if (searchType === 'requester') {
                return doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm);
            } else if (searchType === 'department') {
                return doc.departmentName && doc.departmentName.toLowerCase().includes(searchTerm);
            } else if (searchType === 'postingDate' && doc.postingDate) {
                return new Date(doc.postingDate).toLocaleDateString().toLowerCase().includes(searchTerm);
            } else if (searchType === 'dueDate' && doc.dueDate) {
                return new Date(doc.dueDate).toLocaleDateString().toLowerCase().includes(searchTerm);
            } else if (searchType === 'bpName') {
                const bpName = doc.bpName || doc.paidToName || '';
                return bpName.toLowerCase().includes(searchTerm);
            } else if (searchType === 'totalLC') {
                const totalLC = doc.totalLC ? doc.totalLC.toString() : (doc.docTotal ? doc.docTotal.toString() : '');
                return totalLC.toLowerCase().includes(searchTerm);
            } else if (searchType === 'totalFC') {
                const totalFC = doc.totalFC ? doc.totalFC.toString() : (doc.docTotalFC ? doc.docTotalFC.toString() : '');
                return totalFC.toLowerCase().includes(searchTerm);
            } else if (searchType === 'status') {
                return doc.status.toLowerCase().includes(searchTerm);
            } else {
                // Default search across multiple fields
                return (doc.outgoingPaymentNo && doc.outgoingPaymentNo.toLowerCase().includes(searchTerm)) ||
                       (doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm)) ||
                       (doc.bpName && doc.bpName.toLowerCase().includes(searchTerm)) ||
                       (doc.paidToName && doc.paidToName.toLowerCase().includes(searchTerm));
            }
        });
    }
    
    displayDocuments(filteredDocuments);
}

// Programmatic tab switching functions
function switchToVendorTab() {
    switchMainTab('vendor');
}

function switchToAccountTab() {
    switchMainTab('account');
}

// Function to switch between main tabs
function switchMainTab(tab) {
    // Update main tab button styling
    document.getElementById('vendorTabBtn').classList.remove('main-tab-active');
    document.getElementById('accountTabBtn').classList.remove('main-tab-active');
    
    if (tab === 'vendor') {
        document.getElementById('vendorTabBtn').classList.add('main-tab-active');
        // Additional logic for vendor tab content
        console.log('Switched to Vendor tab');
        // Reset to "all" sub-tab when switching main tabs
        switchTab('all');
    } else if (tab === 'account') {
        document.getElementById('accountTabBtn').classList.add('main-tab-active');
        // Additional logic for account tab content
        console.log('Switched to Account tab');
        // Reset to "all" sub-tab when switching main tabs
        switchTab('all');
    }
    
    // You can add logic here to show/hide different content based on the selected tab
}

// Programmatic sub-tab switching functions
function switchToAllDocumentsTab() {
    switchTab('all');
}

function switchToDraftTab() {
    switchTab('draft');
}

function switchToPreparedTab() {
    switchTab('prepared');
}

// Add keyboard shortcuts for tab navigation
document.addEventListener('keydown', function(event) {
    // Alt + 1: Switch to Vendor tab
    if (event.altKey && event.key === '1') {
        switchToVendorTab();
    }
    // Alt + 2: Switch to Account tab
    else if (event.altKey && event.key === '2') {
        switchToAccountTab();
    }
    // Alt + A: Switch to All Documents sub-tab
    else if (event.altKey && event.key === 'a') {
        switchToAllDocumentsTab();
    }
    // Alt + D: Switch to Draft sub-tab
    else if (event.altKey && event.key === 'd') {
        switchToDraftTab();
    }
    // Alt + P: Switch to Prepared sub-tab
    else if (event.altKey && event.key === 'p') {
        switchToPreparedTab();
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

document.getElementById("selectAll").addEventListener("change", function () {
    let checkboxes = document.querySelectorAll(".rowCheckbox");
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
});

// Event listener untuk search input
document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    switchTab(currentTab); // Ini akan menerapkan filter pencarian dengan tab saat ini
});

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