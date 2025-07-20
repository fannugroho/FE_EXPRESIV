// Global variables for pagination
let currentPage = 1;
window.itemsPerPage = 20; // Menggunakan window.itemsPerPage agar bisa diakses di seluruh aplikasi
let allReimbursements = [];
let filteredReimbursements = [];
let currentTab = 'all'; // Default tab
let currentSearchType = 'pr'; // Default search type

// Helper function to format date without timezone issues
function formatDateWithoutTimezone(dateString) {
    // Use the utility function for consistent date handling
    return formatDateToYYYYMMDD(dateString);
}

// Function to handle search
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const searchType = document.getElementById('searchType').value;
    filterReimbursements(searchTerm, currentTab, searchType);
}

// Function to filter reimbursements based on search term and tab
function filterReimbursements(searchTerm = '', tab = 'all', searchType = 'pr') {
    let filtered = allReimbursements;
    
    // First filter by tab
    if (tab === 'draft') {
        filtered = filtered.filter(reim => reim.status.toLowerCase() === 'draft');
    } else if (tab === 'prepared') {
        filtered = filtered.filter(reim => reim.status.toLowerCase() === 'prepared');
    }
    
    // Then filter by search term based on search type
    if (searchTerm) {
        switch (searchType) {
            case 'pr':
                filtered = filtered.filter(reim => 
                    reim.voucherNo && reim.voucherNo.toLowerCase().includes(searchTerm)
                );
                break;
            case 'requester':
                filtered = filtered.filter(reim => 
                    reim.requesterName && reim.requesterName.toLowerCase().includes(searchTerm)
                );
                break;
            case 'date':
                filtered = filtered.filter(reim => {
                    if (!reim.submissionDate) return false;
                    const submissionDate = formatDateToYYYYMMDD(reim.submissionDate);
                    return submissionDate.includes(searchTerm);
                });
                break;
            case 'status':
                filtered = filtered.filter(reim => 
                    reim.status && reim.status.toLowerCase().includes(searchTerm)
                );
                break;
            default:
                // Default search across all fields
                filtered = filtered.filter(reim => 
                    (reim.voucherNo && reim.voucherNo.toLowerCase().includes(searchTerm)) ||
                    (reim.requesterName && reim.requesterName.toLowerCase().includes(searchTerm)) ||
                    (reim.department && reim.department.toLowerCase().includes(searchTerm)) ||
                    (reim.status && reim.status.toLowerCase().includes(searchTerm))
                );
        }
    }
    
    filteredReimbursements = filtered;
    currentPage = 1;
    displayReimbursements(filteredReimbursements);
}

// Function to switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1; // Reset to first page
    
    // Update tab button styling
    document.getElementById('allTabBtn').classList.remove('tab-active');
    document.getElementById('draftTabBtn').classList.remove('tab-active');
    document.getElementById('preparedTabBtn').classList.remove('tab-active');
    
    if (tabName === 'all') {
        document.getElementById('allTabBtn').classList.add('tab-active');
    } else if (tabName === 'draft') {
        document.getElementById('draftTabBtn').classList.add('tab-active');
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
                filteredReimbursements = [...allReimbursements];
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
    
    // Buat salinan data untuk diurutkan agar tidak mengubah data asli
    const sortedData = [...reimbursements].sort((a, b) => {
        // Pertama, urutkan berdasarkan tanggal submission terbaru
        const dateA = a.submissionDate ? formatDateToYYYYMMDD(a.submissionDate) : '';
        const dateB = b.submissionDate ? formatDateToYYYYMMDD(b.submissionDate) : '';
        
        if (dateA !== dateB) {
            return dateB.localeCompare(dateA); // Tanggal terbaru di atas
        }
        
        // Jika tanggal submission sama, urutkan berdasarkan Voucher Number terbesar
        const voucherNoA = a.voucherNo ? parseInt(a.voucherNo.replace(/\D/g, '')) : 0;
        const voucherNoB = b.voucherNo ? parseInt(b.voucherNo.replace(/\D/g, '')) : 0;
        return voucherNoB - voucherNoA; // Voucher Number terbesar di atas
    });
    
    const startIndex = (currentPage - 1) * window.itemsPerPage;
    const endIndex = Math.min(startIndex + window.itemsPerPage, sortedData.length);
    const paginatedReimbursements = sortedData.slice(startIndex, endIndex);
    
    paginatedReimbursements.forEach((reim, index) => {
        let formattedDate = '';
        if (reim.submissionDate) {
            // Use the utility function for consistent date display
            formattedDate = formatDateForDisplay(reim.submissionDate);
        }
        
        // Menggunakan nomor urut (index + 1) + startIndex untuk menampilkan nomor urut sesuai halaman
        const rowNumber = index + 1 + startIndex;
        
        // Check if fields are longer than 10 characters and apply scrollable class
        const voucherNoClass = reim.voucherNo && reim.voucherNo.length > 10 ? 'scrollable-cell' : '';
        const requesterNameClass = reim.requesterName && reim.requesterName.length > 10 ? 'scrollable-cell' : '';
        const departmentClass = reim.department && reim.department.length > 10 ? 'scrollable-cell' : '';
        
        // <td class='p-2 text-left'><input type="checkbox" class="rowCheckbox"></td>
        const row = `<tr class='border-b'>
            <td class='p-2'>${rowNumber}</td>
            <td class='p-2'>
                <div class="${voucherNoClass}">${reim.voucherNo}</div>
            </td>
            <td class='p-2'>
                <div class="${requesterNameClass}">${reim.requesterName}</div>
            </td>
            <td class='p-2'>
                <div class="${departmentClass}">${reim.department}</div>
            </td>
            <td class='p-2'>${formattedDate}</td>
            <td class='p-2'>
                <span class="px-2 py-1 rounded-full text-xs ${reim.status === 'Draft' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}">
                    ${reim.status === 'Revised' ? 'Revision' : reim.status}
                </span>
            </td>
            <td class='p-2'>
                <button onclick="detailReim('${reim.id}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Detail</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    // Update item count display
    document.getElementById('startItem').textContent = sortedData.length > 0 ? startIndex + 1 : 0;
    document.getElementById('endItem').textContent = endIndex;
    document.getElementById('totalItems').textContent = sortedData.length;
    
    // Update pagination buttons
    updatePaginationButtons(sortedData.length);
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
    const totalPages = Math.ceil(totalItems / window.itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    
    // Update prev/next button states
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.classList.toggle('disabled', currentPage <= 1);
    nextBtn.classList.toggle('disabled', currentPage >= totalPages);
}

// Function to change page
function changePage(direction) {
    const totalPages = Math.ceil(filteredReimbursements.length / window.itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayReimbursements(filteredReimbursements);
    }
}

// Function to download Excel
function downloadExcel() {
    const workbook = XLSX.utils.book_new();
    
    // Get current tab name for filename
    let statusText = 'All';
    if (currentTab === 'draft') {
        statusText = 'Draft';
    } else if (currentTab === 'prepared') {
        statusText = 'Prepared';
    }
    
    // Buat salinan data untuk diurutkan agar tidak mengubah data asli
    const sortedData = [...filteredReimbursements].sort((a, b) => {
        // Pertama, urutkan berdasarkan tanggal submission terbaru
        const dateA = a.submissionDate ? formatDateToYYYYMMDD(a.submissionDate) : '';
        const dateB = b.submissionDate ? formatDateToYYYYMMDD(b.submissionDate) : '';
        
        if (dateA !== dateB) {
            return dateB.localeCompare(dateA); // Tanggal terbaru di atas
        }
        
        // Jika tanggal submission sama, urutkan berdasarkan Voucher Number terbesar
        const voucherNoA = a.voucherNo ? parseInt(a.voucherNo.replace(/\D/g, '')) : 0;
        const voucherNoB = b.voucherNo ? parseInt(b.voucherNo.replace(/\D/g, '')) : 0;
        return voucherNoB - voucherNoA; // Voucher Number terbesar di atas
    });
    
    // Convert the data to worksheet format
    const wsData = sortedData.map((reim, index) => ({
        'No.': index + 1,
        'Reimbursement Number': reim.voucherNo,
        'Requester': reim.requesterName,
        'Department': reim.department,
        'Submission Date': formatDateWithoutTimezone(reim.submissionDate),
        'Status': reim.status === 'Revised' ? 'Revision' : reim.status
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reimbursements');
    
    // Generate Excel file with tab name
    const fileName = `Reimbursement_${statusText}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

// Function to download PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get current tab name for title and filename
    let statusText = 'All';
    if (currentTab === 'draft') {
        statusText = 'Draft';
    } else if (currentTab === 'prepared') {
        statusText = 'Prepared';
    }
    
    // Add title with current tab
    doc.setFontSize(16);
    doc.text(`Reimbursements Report - ${statusText}`, 14, 15);
    
    // Buat salinan data untuk diurutkan agar tidak mengubah data asli
    const sortedData = [...filteredReimbursements].sort((a, b) => {
        // Pertama, urutkan berdasarkan tanggal submission terbaru
        const dateA = a.submissionDate ? formatDateToYYYYMMDD(a.submissionDate) : '';
        const dateB = b.submissionDate ? formatDateToYYYYMMDD(b.submissionDate) : '';
        
        if (dateA !== dateB) {
            return dateB.localeCompare(dateA); // Tanggal terbaru di atas
        }
        
        // Jika tanggal submission sama, urutkan berdasarkan Voucher Number terbesar
        const voucherNoA = a.voucherNo ? parseInt(a.voucherNo.replace(/\D/g, '')) : 0;
        const voucherNoB = b.voucherNo ? parseInt(b.voucherNo.replace(/\D/g, '')) : 0;
        return voucherNoB - voucherNoA; // Voucher Number terbesar di atas
    });
    
    // Create table data
    const tableData = sortedData.map((reim, index) => [
        index + 1,
        reim.voucherNo,
        reim.requesterName,
        reim.department,
        formatDateWithoutTimezone(reim.submissionDate),
        reim.status === 'Revised' ? 'Revision' : reim.status
    ]);
    
    // Add table
    doc.autoTable({
        head: [['No.', 'Reimbursement Number', 'Requester', 'Department', 'Submission Date', 'Status']],
        body: tableData,
        startY: 25
    });
    
    // Save PDF with tab name
    const fileName = `Reimbursement_${statusText}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
}

// Function to update the status counts on the page
function updateStatusCounts(data) {
    // Calculate total count minus revised count
    const totalCountMinusRevised = (data.totalCount || 0) - (data.revisedCount || 0);
    document.getElementById("totalCount").textContent = totalCountMinusRevised;
    document.getElementById("draftCount").textContent = data.draftCount || 0;
    document.getElementById("preparedCount").textContent = data.preparedCount || 0;
    document.getElementById("checkedCount").textContent = data.checkedCount || 0;
    document.getElementById("acknowledgedCount").textContent = data.acknowledgedCount || 0;
    document.getElementById("approvedCount").textContent = data.approvedCount || 0;
    document.getElementById("receivedCount").textContent = data.receivedCount || 0;
    document.getElementById("paidCount").textContent = data.paidCount || 0;
    document.getElementById("rejectedCount").textContent = data.rejectedCount || 0;
}

function toggleSidebar() {
    // No-op function - sidebar toggle is disabled to keep it permanently open
    return;
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Mobile navigation functions
function goToTotalDocs() {
    switchTab('all');
}

function goToDraftDocs() {
    switchTab('draft');
}

// Navigation functions
// function goToMenu() { window.location.href = "Menu.html"; }
// function goToAddDoc() {window.location.href = "AddDoc.html"; }
// function goToAddReim() {window.location.href = "../addPages/addReim.html"; }
// function goToAddCash() {window.location.href = "AddCash.html"; }
// function goToAddSettle() {window.location.href = "AddSettle.html"; }
// function goToAddPO() {window.location.href = "AddPO.html"; }
// function goToMenuPR() { window.location.href = "MenuPR.html"; }

// // function goToDetailReim(reimId) {
// //     window.location.href = `/detailPages/detailReim.html?reim-id=${reimId}`;
// // }

// function goToMenuReim() { window.location.href = "MenuReim.html"; }
// function goToMenuCash() { window.location.href = "MenuCash.html"; }
// function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
// function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
// function goToMenuPO() { window.location.href = "MenuPO.html"; }
// function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
// function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
// function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; }

// Function to redirect to detail page with reimbursement ID
function detailReim(reimId) {
    window.location.href = `/detailPages/detailReim.html?reim-id=${reimId}`;
}

function loadDashboard() {
    // Set default items per page
    if (!window.itemsPerPage) {
        window.itemsPerPage = 20;
    }
    
    // Fetch status counts from API
    fetchStatusCounts();
    
    // Fetch reimbursements from API
    fetchReimbursements();

    // Add event listener for search input
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
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
            filterReimbursements(searchTerm, currentTab, this.value);
        });
    }
    
    // Set up the "select all" checkbox
    // document.getElementById('selectAll').addEventListener("change", function() {
    //     const checkboxes = document.querySelectorAll('#recentDocs input[type="checkbox"]');
    //     checkboxes.forEach(checkbox => {
    //         checkbox.checked = this.checked;
    //     });
    // });
}

window.onload = loadDashboard;