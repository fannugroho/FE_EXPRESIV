// Variabel untuk menyimpan dokumen reimbursement
let reimbursementDocs = [];

// Global variables for document management
let currentTab = 'all';
let currentPage = 1;
let itemsPerPage = 10;
let filteredDocuments = [];
let allDocuments = [];

// Reusable function to fetch outgoing payment documents by approval step
async function fetchOutgoingPaymentDocuments(step, userId, onlyCurrentStep = false) {
    try {
        const params = new URLSearchParams({
            step: step,
            userId: userId,
            onlyCurrentStep: onlyCurrentStep.toString(),
            includeDetails: 'false'
        });
        
        const response = await fetch(`${BASE_URL}/api/staging-outgoing-payments/headers?${params.toString()}`, {
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
        console.log(`API response for step ${step} (onlyCurrentStep: ${onlyCurrentStep}):`, result);
        
        // Debug: Log first document structure if available
        if (result.data && result.data.length > 0) {
            console.log('First document structure:', result.data[0]);
        }

        // Handle different response structures
        if (result.status && result.data) {
            return result.data;
        } else if (Array.isArray(result)) {
            return result;
        } else if (result.data) {
            return result.data;
        } else {
            return [];
        }
    } catch (error) {
        console.error(`Error fetching documents for step ${step}:`, error);
        return [];
    }
}

// Function to fetch all documents for "All Documents" tab
async function fetchAllDocuments(userId) {
    try {
        // For "All Documents" tab, we want only documents currently waiting at the prepared step (active work)
        return await fetchOutgoingPaymentDocuments('preparedBy', userId, true);
    } catch (error) {
        console.error('Error fetching all documents:', error);
        return [];
    }
}

// Function to fetch prepared documents for "Prepared" tab
async function fetchPreparedDocuments(userId) {
    // For "Prepared" tab, we want all documents the user has prepared (historical view)
    return await fetchOutgoingPaymentDocuments('preparedBy', userId, false);
}

// Fungsi untuk menampilkan modal reimbursement
function showReimbursementModal() {
    // Ambil data reimbursement
    fetchReimbursementDocs();
    
    // Tampilkan modal
    const modal = document.getElementById('reimbursementModal');
    modal.classList.remove('hidden');
    
    // Ensure modal appears above sidebar
    modal.style.zIndex = '9999';
    modal.style.position = 'fixed';
    
    // Ensure modal content is properly positioned
    const modalContent = modal.querySelector('.bg-white');
    if (modalContent) {
        modalContent.style.zIndex = '10000';
        modalContent.style.position = 'relative';
    }
}

// Fungsi untuk menutup modal reimbursement
function closeReimbursementModal() {
    const modal = document.getElementById('reimbursementModal');
    modal.classList.add('hidden');
    
    // Reset modal styles
    modal.style.zIndex = '';
    modal.style.position = '';
    
    const modalContent = modal.querySelector('.bg-white');
    if (modalContent) {
        modalContent.style.zIndex = '';
        modalContent.style.position = '';
    }
}

// Fungsi untuk mengambil data dokumen
function fetchReimbursementDocs() {
    const tableBody = document.getElementById("reimbursementDocs");
    tableBody.innerHTML = '<tr><td colspan="8" class="p-4 text-center">Loading data...</td></tr>';
    
    fetch(`${BASE_URL}/api/reimbursements?Status=received`, {
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
                tableBody.innerHTML = '<tr><td colspan="8" class="p-4 text-center">No documents available</td></tr>';
            }
        } else if (Array.isArray(data)) {
            // Fallback untuk format lama jika masih digunakan
            reimbursementDocs = data;
            displayReimbursementDocs(reimbursementDocs);
            
            if (reimbursementDocs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" class="p-4 text-center">No documents available</td></tr>';
            }
        } else {
            tableBody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-red-500">No data available</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error fetching document data:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-red-500">Error loading data. Please try again later.</td></tr>';
    });
}

// Fungsi untuk menampilkan dokumen
function displayReimbursementDocs(docs) {
    const tableBody = document.getElementById("reimbursementDocs");
    tableBody.innerHTML = "";
    
    if (docs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="p-4 text-center">No documents available</td></tr>';
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
                <div class="flex space-x-1">
                    <button onclick="selectReimbursement('${doc.id || ''}', '${doc.voucherNo || ''}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs">Select</button>
                </div>
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
    // Tampilkan dialog konfirmasi
    Swal.fire({
        title: 'Create Outgoing Payment',
        text: `Do you want to create a new outgoing payment based on reimbursement "${voucherNo}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Create',
        cancelButtonText: 'Cancel',
        customClass: {
            container: 'swal2-container-custom',
            popup: 'swal2-popup-custom'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Redirect ke halaman pembuatan outgoing payment dengan parameter reimbursement ID
            window.location.href = `../addPages/addOPReim.html?reimbursement-id=${docId}`;
        }
    });
    
    // Ensure SweetAlert2 appears above modal
    setTimeout(() => {
        const swalContainer = document.querySelector('.swal2-container');
        const swalPopup = document.querySelector('.swal2-popup');
        if (swalContainer) {
            swalContainer.style.zIndex = '100000';
        }
        if (swalPopup) {
            swalPopup.style.zIndex = '100001';
        }
    }, 10);
}



async function loadDashboard() {
    const userId = getUserId();
    console.log('Loading dashboard with userId:', userId);

    try {
        // Fetch dashboard summary data
        const summaryResponse = await fetch(`${BASE_URL}/api/staging-outgoing-payments/dashboard/summary`);
        const summaryData = await summaryResponse.json();
        
        // Handle different response structures
        let summary;
        if (summaryData.status && summaryData.data) {
            summary = summaryData.data;
        } else if (summaryData.data) {
            summary = summaryData.data;
        } else {
            summary = summaryData;
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

        // Load documents for the default tab (All Documents)
        await switchTab('all');
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById("recentDocs").innerHTML = 
            `<tr><td colspan="11" class="p-4 text-center text-red-500">Error loading data. Please try again later.</td></tr>`;
    }
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
        const status = getStatusDisplay(doc);
        
        // Memformat data dengan kelas scrollable jika perlu
        const reimburseNo = applyScrollClass(doc.expressivNo || doc.outgoingPaymentNo || doc.docNum || doc.reimburseNo);
        const requester = applyScrollClass(doc.requesterName || '-');
        const payTo = applyScrollClass(doc.cardName || doc.bpName || doc.paidToName || doc.payToName || '-');
        
        // Calculate total amount from lines (like menuOPReimCheck.js)
        let calculatedTotalAmount = 0;
        if (doc.lines && doc.lines.length > 0) {
            calculatedTotalAmount = doc.lines.reduce((sum, line) => sum + (line.sumApplied || 0), 0);
        } else if (doc.trsfrSum) {
            calculatedTotalAmount = doc.trsfrSum;
        } else {
            // Fallback to other fields
            const totalLCValue = doc.totalLC || doc.docTotal || doc.totalAmount || 0;
            const totalFCValue = doc.totalFC || doc.docTotalFC || 0;
            calculatedTotalAmount = totalLCValue + totalFCValue;
        }
        
        // Format total amount with proper currency formatting
        const totalAmountValue = calculatedTotalAmount.toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        const totalAmount = applyScrollClass(totalAmountValue);
        
        // Format tanggal
        const docDate = doc.docDate ? new Date(doc.docDate).toLocaleDateString() : 
                       (doc.postingDate ? new Date(doc.postingDate).toLocaleDateString() : 
                       (doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-'));
        
        const dueDate = doc.docDueDate ? new Date(doc.docDueDate).toLocaleDateString() : 
                       (doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : '-');
        
        const row = `<tr class='border-b'>
            <td class='p-2'>${startIndex + index + 1}</td>
            <td class='p-2'>${reimburseNo}</td>
            <td class='p-2'>${requester}</td>
            <td class='p-2'>${payTo}</td>
            <td class='p-2'>${docDate}</td>
            <td class='p-2'>${dueDate}</td>
            <td class='p-2'>${totalAmount}</td>
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
    const totalPages = Math.ceil((filteredDocuments || []).length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayDocuments(filteredDocuments || []);
    }
}

// Fungsi navigasi ke halaman status tertentu
function goToCheckedDocs() {
    currentTab = 'checked';
    currentPage = 1;
    filteredDocuments = (allDocuments || []).filter(doc => 
        (doc.approval && doc.approval.approvalStatus === 'Checked') || 
        doc.status === 'Checked'
    );
    displayDocuments(filteredDocuments);
}

function goToApprovedDocs() {
    currentTab = 'approved';
    currentPage = 1;
    filteredDocuments = (allDocuments || []).filter(doc => 
        (doc.approval && doc.approval.approvalStatus === 'Approved') || 
        doc.status === 'Approved'
    );
    displayDocuments(filteredDocuments);
}

function goToRejectDocs() {
    currentTab = 'rejected';
    currentPage = 1;
    filteredDocuments = (allDocuments || []).filter(doc => 
        (doc.approval && doc.approval.approvalStatus === 'Rejected') || 
        doc.status === 'Rejected'
    );
    displayDocuments(filteredDocuments);
}

function goToPaidDocs() {
    currentTab = 'paid';
    currentPage = 1;
    filteredDocuments = (allDocuments || []).filter(doc => 
        (doc.approval && doc.approval.approvalStatus === 'Paid') || 
        doc.status === 'Paid'
    );
    displayDocuments(filteredDocuments);
}

function goToSettledDocs() {
    currentTab = 'settled';
    currentPage = 1;
    filteredDocuments = (allDocuments || []).filter(doc => 
        (doc.approval && doc.approval.approvalStatus === 'Settled') || 
        doc.status === 'Settled'
    );
    displayDocuments(filteredDocuments);
}

// Function untuk switch tab
async function switchTab(tab) {
    currentTab = tab;
    currentPage = 1;
    
    // Update tab button styling
    document.getElementById('allTabBtn').classList.remove('tab-active');
    document.getElementById('preparedTabBtn').classList.remove('tab-active');
    
    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found');
        return;
    }
    
    try {
        let documents = [];
        
        if (tab === 'all') {
            document.getElementById('allTabBtn').classList.add('tab-active');
            // Fetch only documents currently waiting at the prepared step (active work)
            documents = await fetchAllDocuments(userId);
        } else if (tab === 'prepared') {
            document.getElementById('preparedTabBtn').classList.add('tab-active');
            // Fetch all documents the user has prepared (historical view)
            documents = await fetchPreparedDocuments(userId);
        }
        
        // Update the filtered documents
        filteredDocuments = documents;
        allDocuments = documents;
        
        // Apply search filter if there's a search term
        const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
        const searchType = document.getElementById('searchType')?.value || 'all';
        
        if (searchTerm) {
            filteredDocuments = filteredDocuments.filter(doc => {
                if (searchType === 'reimNo') {
                    return (doc.expressivNo && doc.expressivNo.toLowerCase().includes(searchTerm)) || 
                           (doc.outgoingPaymentNo && doc.outgoingPaymentNo.toLowerCase().includes(searchTerm)) ||
                           (doc.docNum && doc.docNum.toString().includes(searchTerm)) ||
                           (doc.reimburseNo && doc.reimburseNo.toLowerCase().includes(searchTerm));
                } else if (searchType === 'requester') {
                    return doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm);
                } else if (searchType === 'payTo') {
                    const payTo = doc.cardName || doc.bpName || doc.paidToName || doc.payToName || '';
                    return payTo.toLowerCase().includes(searchTerm);
                } else if (searchType === 'docDate') {
                    const docDate = doc.docDate || doc.postingDate || doc.submissionDate;
                    return docDate && new Date(docDate).toLocaleDateString().toLowerCase().includes(searchTerm);
                } else if (searchType === 'dueDate') {
                    const dueDate = doc.docDueDate || doc.dueDate;
                    return dueDate && new Date(dueDate).toLocaleDateString().toLowerCase().includes(searchTerm);
                } else if (searchType === 'totalAmount') {
                    // Handle multiple possible field names for Total Amount
                    let calculatedTotalAmount = 0;
                    if (doc.lines && doc.lines.length > 0) {
                        calculatedTotalAmount = doc.lines.reduce((sum, line) => sum + (line.sumApplied || 0), 0);
                    } else if (doc.trsfrSum) {
                        calculatedTotalAmount = doc.trsfrSum;
                    } else {
                        const totalLCValue = doc.totalLC || doc.docTotal || doc.totalAmount || 0;
                        const totalFCValue = doc.totalFC || doc.docTotalFC || 0;
                        calculatedTotalAmount = totalLCValue + totalFCValue;
                    }
                    const totalAmountString = calculatedTotalAmount.toString().toLowerCase();
                    
                    return totalAmountString.includes(searchTerm.toLowerCase());
                } else if (searchType === 'status') {
                    const status = doc.approval ? doc.approval.approvalStatus : (doc.status || doc.type || '');
                    return status.toLowerCase().includes(searchTerm);
                } else {
                    // Default search across multiple fields
                    return (doc.expressivNo && doc.expressivNo.toLowerCase().includes(searchTerm)) ||
                           (doc.outgoingPaymentNo && doc.outgoingPaymentNo.toLowerCase().includes(searchTerm)) ||
                           (doc.docNum && doc.docNum.toString().includes(searchTerm)) ||
                           (doc.reimburseNo && doc.reimburseNo.toLowerCase().includes(searchTerm)) ||
                           (doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm)) ||
                           (doc.cardName && doc.cardName.toLowerCase().includes(searchTerm)) ||
                           (doc.bpName && doc.bpName.toLowerCase().includes(searchTerm)) ||
                           (doc.paidToName && doc.paidToName.toLowerCase().includes(searchTerm)) ||
                           (doc.payToName && doc.payToName.toLowerCase().includes(searchTerm)) ||
                           (doc.comments && doc.comments.toLowerCase().includes(searchTerm));
                }
            });
        }
        
        displayDocuments(filteredDocuments);
        
    } catch (error) {
        console.error('Error switching tab:', error);
        // Fallback to empty state
        filteredDocuments = [];
        displayDocuments([]);
    }
}

// Add keyboard shortcuts for tab navigation
document.addEventListener('keydown', function(event) {
    // Alt + A: Switch to All Documents sub-tab
    if (event.altKey && event.key === 'a') {
        switchTab('all');
    }
    // Alt + P: Switch to Prepared sub-tab
    else if (event.altKey && event.key === 'p') {
        switchTab('prepared');
    }
});

// Helper function to determine status display for rejected documents
function getStatusDisplay(doc) {
    if (!doc.approval) {
        return doc.status || doc.type || 'Draft';
    }
    
    // Check if document is rejected
    if (doc.approval.rejectedDate) {
        return 'Rejected';
    }
    
    // Return normal approval status
    return doc.approval.approvalStatus || doc.status || doc.type || 'Draft';
}

// Fungsi untuk mendapatkan ID pengguna yang login - using auth.js approach
function getUserId() {
    // Use the getUserId function from auth.js if available
    if (typeof window.getUserId === 'function' && window.getUserId !== getUserId) {
        return window.getUserId();
    }
    
    // Fallback to our implementation
    const token = localStorage.getItem("accessToken");
    if (token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const userInfo = JSON.parse(jsonPayload);
            const userId = userInfo["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
            if (userId) return userId;
        } catch (e) {
            console.error('Error parsing JWT token:', e);
        }
    }
    
    // Fallback to localStorage method
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
    if (!window.filteredDocuments || window.filteredDocuments.length === 0) {
        alert("No data to export!");
        return;
    }
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet format
    const wsData = [
        ["No.", "Reimburse No", "Requester", "Pay To", "Document Date", "Due Date", "Total Amount", "Status"]
    ];
    
    window.filteredDocuments.forEach((doc, index) => {
        // Calculate total amount using the same logic as displayDocuments
        let calculatedTotalAmount = 0;
        if (doc.lines && doc.lines.length > 0) {
            calculatedTotalAmount = doc.lines.reduce((sum, line) => sum + (line.sumApplied || 0), 0);
        } else if (doc.trsfrSum) {
            calculatedTotalAmount = doc.trsfrSum;
        } else {
            const totalLCValue = doc.totalLC || doc.docTotal || doc.totalAmount || 0;
            const totalFCValue = doc.totalFC || doc.docTotalFC || 0;
            calculatedTotalAmount = totalLCValue + totalFCValue;
        }
        
        wsData.push([
            index + 1,
            doc.expressivNo || doc.outgoingPaymentNo || doc.docNum || doc.reimburseNo || '-',
            doc.requesterName || '-',
            doc.cardName || doc.bpName || doc.paidToName || doc.payToName || '-',
            doc.docDate ? new Date(doc.docDate).toLocaleDateString() : (doc.postingDate ? new Date(doc.postingDate).toLocaleDateString() : (doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-')),
            doc.docDueDate ? new Date(doc.docDueDate).toLocaleDateString() : (doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : '-'),
            calculatedTotalAmount.toLocaleString(),
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
    if (!window.filteredDocuments || window.filteredDocuments.length === 0) {
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
    const tableColumn = ["No.", "Reimburse No", "Requester", "Pay To", "Document Date", "Due Date", "Total Amount", "Status"];
    const tableRows = [];
    
    window.filteredDocuments.forEach((doc, index) => {
        // Calculate total amount using the same logic as displayDocuments
        let calculatedTotalAmount = 0;
        if (doc.lines && doc.lines.length > 0) {
            calculatedTotalAmount = doc.lines.reduce((sum, line) => sum + (line.sumApplied || 0), 0);
        } else if (doc.trsfrSum) {
            calculatedTotalAmount = doc.trsfrSum;
        } else {
            const totalLCValue = doc.totalLC || doc.docTotal || doc.totalAmount || 0;
            const totalFCValue = doc.totalFC || doc.docTotalFC || 0;
            calculatedTotalAmount = totalLCValue + totalFCValue;
        }
        
        const rowData = [
            index + 1,
            doc.expressivNo || doc.outgoingPaymentNo || doc.docNum || doc.reimburseNo || '-',
            doc.requesterName || '-',
            doc.cardName || doc.bpName || doc.paidToName || doc.payToName || '-',
            doc.docDate ? new Date(doc.docDate).toLocaleDateString() : (doc.postingDate ? new Date(doc.postingDate).toLocaleDateString() : (doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-')),
            doc.docDueDate ? new Date(doc.docDueDate).toLocaleDateString() : (doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : '-'),
            calculatedTotalAmount.toLocaleString(),
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
function goToMenuReim() { window.location.href = "pages/menuReim.html"; }
function goToMenuCash() { window.location.href = "MenuCash.html"; }
function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
function goToMenuPO() { window.location.href = "MenuPO.html"; }
function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
function goToMenuBanking() { window.location.href = "MenuBanking.html"; }
function logout() { localStorage.removeItem("loggedInUser"); window.location.href = "Login.html"; } 

// Function to handle search input
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    switchTab(currentTab); // This will apply the search filter
}

function detailDoc(opId) {
    // Navigate to outgoing payment reimbursement detail page
    window.location.href = `../detailPages/detailOPReim.html?id=${opId}`;
}

// Load dashboard using the same approach as Purchase Request
window.onload = function() {
    // Load initial data and dashboard counts
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
                searchInput.placeholder = 'Select date';
            } else {
                searchInput.type = 'text';
                searchInput.placeholder = `Search ${this.options[this.selectedIndex].text}`;
            }
            
            // Clear current search and trigger new search
            searchInput.value = '';
            const searchTerm = searchInput.value.trim();
            switchTab(currentTab); // This will apply the search filter
        });
    }
};