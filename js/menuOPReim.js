// Variabel untuk menyimpan dokumen reimbursement
let reimbursementDocs = [];
let allReimbursementDocs = []; // Menyimpan semua dokumen sebelum filtering

// Global variables for document management
let currentTab = 'all';
let currentPage = 1;
let itemsPerPage = 10;
window.filteredDocuments = []; // Make it global
let allDocuments = [];

// Global variable to store users
let users = [];

// Function to check if user has access to Outgoing Payment
function checkOutgoingPaymentAccess() {
    console.log('=== MenuOPReim checkOutgoingPaymentAccess Start ===');

    const hasAccess = localStorage.getItem('hasOutgoingPaymentAccess');
    console.log('hasOutgoingPaymentAccess from localStorage:', hasAccess);

    if (hasAccess !== 'true') {
        console.log('User does not have Outgoing Payment access, redirecting to dashboard');
        alert('You do not have access to the Outgoing Payment feature.');

        // Redirect to dashboard
        if (typeof navigateToPage === 'function') {
            navigateToPage('pages/dashboard.html');
        } else {
            window.location.href = 'pages/dashboard.html';
        }
        return false;
    }

    console.log('User has Outgoing Payment access');
    console.log('=== MenuOPReim checkOutgoingPaymentAccess End ===');
    return true;
}

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
            console.log('First document status fields:', {
                approval: result.data[0].approval,
                status: result.data[0].status,
                type: result.data[0].type,
                doctype: result.data[0].doctype
            });
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
        // For "All Documents" tab, we want all documents regardless of status
        return await fetchOutgoingPaymentDocuments('preparedBy', userId, false);
    } catch (error) {
        console.error('Error fetching all documents:', error);
        return [];
    }
}

// Function to fetch prepared documents for "Prepared" tab
async function fetchPreparedDocuments(userId) {
    try {
        // For "Prepared" tab, we want only documents with status "Prepared"
        const allDocuments = await fetchOutgoingPaymentDocuments('preparedBy', userId, false);
        console.log(`Total documents fetched: ${allDocuments.length}`);

        const preparedDocuments = allDocuments.filter(doc => {
            // Check various possible status fields
            const status = doc.approval?.approvalStatus || doc.status || doc.type || doc.doctype || '';
            const isPrepared = status.toLowerCase() === 'prepared';

            // Debug logging for first few documents
            if (allDocuments.indexOf(doc) < 3) {
                console.log(`Document ${doc.stagingID || doc.id}: status="${status}", isPrepared=${isPrepared}`);
                console.log('Document structure:', doc);
            }

            return isPrepared;
        });

        console.log(`Filtered to prepared documents: ${preparedDocuments.length}`);
        return preparedDocuments;
    } catch (error) {
        console.error('Error fetching prepared documents:', error);
        return [];
    }
}

// Fungsi untuk menampilkan modal reimbursement
async function showReimbursementModal() {
    // Ambil data reimbursement
    await fetchReimbursementDocs();

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
async function fetchReimbursementDocs() {
    const tableBody = document.getElementById("reimbursementDocs");
    tableBody.innerHTML = '<tr><td colspan="8" class="p-4 text-center">Loading data...</td></tr>';

    try {
        // Fetch users first if not already loaded
        if (users.length === 0) {
            await fetchUsers();
        }

        const response = await fetch(`${BASE_URL}/api/reimbursements?Status=received`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*'
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data.status && data.data) {
            // Format baru dengan property status dan data
            allReimbursementDocs = data.data;
            // Filter hanya dokumen dengan transferOutgoing = "O"
            reimbursementDocs = allReimbursementDocs.filter(doc => doc.transferOutgoing === "O");
            console.log(`Filtered ${reimbursementDocs.length} documents with transferOutgoing="O" from ${allReimbursementDocs.length} total documents`);
            displayReimbursementDocs(reimbursementDocs);

            if (reimbursementDocs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" class="p-4 text-center">No documents with transferOutgoing="O" available</td></tr>';
            }
        } else if (Array.isArray(data)) {
            // Fallback untuk format lama jika masih digunakan
            allReimbursementDocs = data;
            // Filter hanya dokumen dengan transferOutgoing = "O"
            reimbursementDocs = allReimbursementDocs.filter(doc => doc.transferOutgoing === "O");
            console.log(`Filtered ${reimbursementDocs.length} documents with transferOutgoing="O" from ${allReimbursementDocs.length} total documents`);
            displayReimbursementDocs(reimbursementDocs);

            if (reimbursementDocs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" class="p-4 text-center">No documents with transferOutgoing="O" available</td></tr>';
            }
        } else {
            tableBody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-red-500">No data available</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching document data:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-red-500">Error loading data. Please try again later.</td></tr>';
    }
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
        const requesterName = applyScrollClass(doc.receivedByName || doc.receivedBy || '-');
        const department = applyScrollClass(doc.department || '-');

        // Format nilai Total
        const totalValue = doc.totalAmount ? doc.totalAmount.toLocaleString() : '-';
        const total = applyScrollClass(totalValue);

        // Format tanggal
        const postingDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
        const dueDate = doc.receivedDate ? new Date(doc.receivedDate).toLocaleDateString() :
            (doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : '-');

        // Pay To - Use cardName from API data
        const payTo = applyScrollClass(doc.cardName || '-');

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

    // Selalu mulai dari dokumen yang sudah difilter dengan transferOutgoing = "O"
    if (!searchTerm) {
        displayReimbursementDocs(reimbursementDocs);
        return;
    }

    // Filter dari dokumen yang sudah di-filter dengan transferOutgoing = "O"
    const filteredDocs = reimbursementDocs.filter(doc => {
        return (
            (doc.voucherNo && doc.voucherNo.toLowerCase().includes(searchTerm)) ||
            (doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm)) ||
            (doc.department && doc.department.toLowerCase().includes(searchTerm)) ||
            (doc.cardName && doc.cardName.toLowerCase().includes(searchTerm)) ||
            (doc.receivedByName && doc.receivedByName.toLowerCase().includes(searchTerm)) ||
            (doc.receivedBy && doc.receivedBy.toLowerCase().includes(searchTerm)) ||
            (doc.status && doc.status.toLowerCase().includes(searchTerm))
        );
    });

    console.log(`Search filtered ${filteredDocs.length} documents from ${reimbursementDocs.length} transferOutgoing="O" documents`);
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
        // Fetch users first
        await fetchUsers();

        // Fetch all documents to calculate dashboard summary
        const allDocuments = await fetchOutgoingPaymentDocuments('preparedBy', userId, false);
        console.log(`Total documents fetched for dashboard: ${allDocuments.length}`);

        // Calculate dashboard summary based on approval status
        const summary = {
            total: allDocuments.length,
            draft: 0,
            prepared: 0,
            checked: 0,
            acknowledged: 0,
            approved: 0,
            received: 0,
            rejected: 0
        };

        allDocuments.forEach(doc => {
            const approvalStatus = doc.approval?.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
            const status = approvalStatus.toLowerCase();

            // Count documents by status
            if (status === 'draft') {
                summary.draft++;
            } else if (status === 'prepared') {
                summary.prepared++;
            } else if (status === 'checked') {
                summary.checked++;
            } else if (status === 'acknowledged') {
                summary.acknowledged++;
            } else if (status === 'approved') {
                summary.approved++;
            } else if (status === 'received') {
                summary.received++;
            } else if (status === 'rejected') {
                summary.rejected++;
            }
        });

        console.log("Dashboard Summary:", summary);

        // Update dashboard counts safely
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        };

        updateElement("totalDocs", summary.total);
        updateElement("draftDocs", summary.draft);
        updateElement("preparedDocs", summary.prepared);
        updateElement("checkedDocs", summary.checked);
        updateElement("acknowledgedDocs", summary.acknowledged);
        updateElement("approvedDocs", summary.approved);
        updateElement("receivedDocs", summary.received);
        updateElement("rejectedDocs", summary.rejected);

        // Load documents for the default tab (All Documents)
        await switchTab('all');

        // Return the documents for external use
        return window.filteredDocuments;

    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById("recentDocs").innerHTML =
            `<tr><td colspan="9" class="p-4 text-center text-red-500">Error loading data. Please try again later.</td></tr>`;
        throw error; // Re-throw error for proper error handling
    }
}

// Function to fetch users from API
async function fetchUsers() {
    try {
        const response = await fetch(`${BASE_URL}/api/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const result = await response.json();

        if (result.status && result.data) {
            users = result.data;
        } else if (Array.isArray(result)) {
            users = result;
        } else if (result.data) {
            users = result.data;
        } else {
            users = [];
        }

        console.log('Users loaded successfully:', users.length);
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

// Function to get user name by ID
function getUserNameById(userId) {
    if (!users || users.length === 0) {
        return userId; // Return the ID if users not loaded
    }

    const user = users.find(u => u.id === userId);
    return user ? (user.fullName || user.name || user.userName || userId) : userId;
}

// Function untuk menampilkan dokumen dengan pagination
function displayDocuments(documents) {
    console.log(`Displaying ${documents.length} documents, page ${currentPage}, items per page: ${itemsPerPage}`);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, documents.length);
    const paginatedDocuments = documents.slice(startIndex, endIndex);

    console.log(`Showing documents ${startIndex + 1} to ${endIndex} of ${documents.length}`);

    const tableBody = document.getElementById("recentDocs");
    tableBody.innerHTML = "";

    if (paginatedDocuments.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="p-4 text-center text-gray-500">No documents found for the selected tab.</td></tr>`;
        return;
    }

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

        // Apply status styling
        let statusClass = "bg-gray-100 text-gray-800"; // Default
        if (status === 'Prepared') {
            statusClass = "bg-yellow-100 text-yellow-800";
        } else if (status === 'Checked' || status === 'Acknowledged' || status === 'Approved' || status === 'Received' || status === 'Paid' || status === 'Settled') {
            statusClass = "bg-green-100 text-green-800";
        } else if (status === 'Rejected') {
            statusClass = "bg-red-100 text-red-800";
        }

        const statusDisplay = `<span class="px-2 py-1 ${statusClass} rounded-full text-xs">${status}</span>`;

        // Memformat data dengan kelas scrollable jika perlu
        const reimburseNo = applyScrollClass(doc.counterRef || doc.outgoingPaymentNo || doc.docNum || doc.reimburseNo);
        const requester = applyScrollClass(doc.requesterName || '-');
        // Pay To - Use cardName from API data
        const payTo = applyScrollClass(doc.cardName || '-');

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

        const dueDate = doc.receivedDate ? new Date(doc.receivedDate).toLocaleDateString() :
            (doc.docDueDate ? new Date(doc.docDueDate).toLocaleDateString() :
                (doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : '-'));

        const row = `<tr class='border-b'>
            <td class='p-2'>${startIndex + index + 1}</td>
            <td class='p-2'>${reimburseNo}</td>
            <td class='p-2'>${requester}</td>
            <td class='p-2'>${payTo}</td>
            <td class='p-2'>${docDate}</td>
            <td class='p-2'>${dueDate}</td>
            <td class='p-2'>${totalAmount}</td>
            <td class='p-2'>${statusDisplay}</td>
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
    const totalPages = Math.ceil((window.filteredDocuments || []).length / itemsPerPage);
    const newPage = currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayDocuments(window.filteredDocuments || []);
    }
}

// Fungsi navigasi ke halaman status tertentu
function goToCheckedDocs() {
    // Navigate to the checked documents page
    debugNavigation('goToCheckedDocs', 'approvalPages/dashboard/dashboardCheck/OPReim/menuOPReimCheck.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('approvalPages/dashboard/dashboardCheck/OPReim/menuOPReimCheck.html');
    } else {
        window.location.href = 'approvalPages/dashboard/dashboardCheck/OPReim/menuOPReimCheck.html';
    }
}

function goToApprovedDocs() {
    // Navigate to the approved documents page
    debugNavigation('goToApprovedDocs', 'approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html');
    } else {
        window.location.href = 'approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html';
    }
}

function goToRejectDocs() {
    // Navigate to the rejected documents page (same as approved but filtered)
    debugNavigation('goToRejectDocs', 'approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html');
    } else {
        window.location.href = 'approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html';
    }
}

function goToPaidDocs() {
    // Navigate to the paid documents page (same as approved but filtered)
    debugNavigation('goToPaidDocs', 'approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html');
    } else {
        window.location.href = 'approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html';
    }
}

function goToSettledDocs() {
    // Navigate to the settled documents page (same as approved but filtered)
    debugNavigation('goToSettledDocs', 'approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html');
    } else {
        window.location.href = 'approvalPages/dashboard/dashboardApprove/OPReim/menuOPReimApprove.html';
    }
}

// Function to fetch documents by specific approval status
async function fetchDocumentsByStatus(userId, status) {
    try {
        // For specific status tabs, we want documents with that specific approval status
        const allDocuments = await fetchOutgoingPaymentDocuments('preparedBy', userId, false);
        console.log(`Total documents fetched: ${allDocuments.length}`);

        const statusFilteredDocuments = allDocuments.filter(doc => {
            // Check approval status from the approval object
            const approvalStatus = doc.approval?.approvalStatus || doc.status || doc.type || doc.doctype || '';
            const isMatchingStatus = approvalStatus.toLowerCase() === status.toLowerCase();

            // Debug logging for first few documents
            if (allDocuments.indexOf(doc) < 3) {
                console.log(`Document ${doc.stagingID || doc.id}: approvalStatus="${approvalStatus}", isMatchingStatus=${isMatchingStatus}`);
            }

            return isMatchingStatus;
        });

        console.log(`Filtered to ${status} documents: ${statusFilteredDocuments.length}`);
        return statusFilteredDocuments;
    } catch (error) {
        console.error(`Error fetching ${status} documents:`, error);
        return [];
    }
}

// Function untuk switch tab
async function switchTab(tab) {
    currentTab = tab;
    currentPage = 1;

    console.log(`Switching to tab: ${tab}`);

    // Update tab button styling - remove active from all tabs first
    const tabButtons = [
        'allTabBtn', 'preparedTabBtn', 'checkedTabBtn', 'acknowledgedTabBtn',
        'approvedTabBtn', 'receivedTabBtn', 'rejectedTabBtn'
    ];

    tabButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.classList.remove('tab-active');
        }
    });

    const userId = getUserId();
    if (!userId) {
        console.error('User ID not found');
        return;
    }

    try {
        let documents = [];

        if (tab === 'all') {
            document.getElementById('allTabBtn').classList.add('tab-active');
            console.log('Fetching all documents...');
            documents = await fetchAllDocuments(userId);
            console.log(`All documents fetched: ${documents.length} documents`);
        } else if (tab === 'prepared') {
            document.getElementById('preparedTabBtn').classList.add('tab-active');
            console.log('Fetching prepared documents...');
            documents = await fetchDocumentsByStatus(userId, 'prepared');
            console.log(`Prepared documents fetched: ${documents.length} documents`);
        } else if (tab === 'checked') {
            document.getElementById('checkedTabBtn').classList.add('tab-active');
            console.log('Fetching checked documents...');
            documents = await fetchDocumentsByStatus(userId, 'checked');
            console.log(`Checked documents fetched: ${documents.length} documents`);
        } else if (tab === 'acknowledged') {
            document.getElementById('acknowledgedTabBtn').classList.add('tab-active');
            console.log('Fetching acknowledged documents...');
            documents = await fetchDocumentsByStatus(userId, 'acknowledged');
            console.log(`Acknowledged documents fetched: ${documents.length} documents`);
        } else if (tab === 'approved') {
            document.getElementById('approvedTabBtn').classList.add('tab-active');
            console.log('Fetching approved documents...');
            documents = await fetchDocumentsByStatus(userId, 'approved');
            console.log(`Approved documents fetched: ${documents.length} documents`);
        } else if (tab === 'received') {
            document.getElementById('receivedTabBtn').classList.add('tab-active');
            console.log('Fetching received documents...');
            documents = await fetchDocumentsByStatus(userId, 'received');
            console.log(`Received documents fetched: ${documents.length} documents`);
        } else if (tab === 'rejected') {
            document.getElementById('rejectedTabBtn').classList.add('tab-active');
            console.log('Fetching rejected documents...');
            documents = await fetchDocumentsByStatus(userId, 'rejected');
            console.log(`Rejected documents fetched: ${documents.length} documents`);
        }

        // Update the filtered documents
        window.filteredDocuments = documents;
        allDocuments = documents;

        // Apply search filter if there's a search term
        const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
        const searchType = document.getElementById('searchType')?.value || 'all';

        console.log(`Search term: "${searchTerm}", Search type: "${searchType}"`);
        console.log(`Documents before search filter: ${window.filteredDocuments.length}`);

        if (searchTerm) {
            window.filteredDocuments = window.filteredDocuments.filter(doc => {
                if (searchType === 'reimNo') {
                    return (doc.counterRef && doc.counterRef.toLowerCase().includes(searchTerm)) ||
                        (doc.outgoingPaymentNo && doc.outgoingPaymentNo.toLowerCase().includes(searchTerm)) ||
                        (doc.docNum && doc.docNum.toString().includes(searchTerm)) ||
                        (doc.reimburseNo && doc.reimburseNo.toLowerCase().includes(searchTerm));
                } else if (searchType === 'requester') {
                    return doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm);
                } else if (searchType === 'payTo') {
                    return doc.cardName && doc.cardName.toLowerCase().includes(searchTerm);
                } else if (searchType === 'docDate') {
                    const docDate = doc.docDate || doc.postingDate || doc.submissionDate;
                    return docDate && new Date(docDate).toLocaleDateString().toLowerCase().includes(searchTerm);
                } else if (searchType === 'dueDate') {
                    const dueDate = doc.receivedDate || doc.docDueDate || doc.dueDate;
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
                    const status = getStatusDisplay(doc);
                    return status.toLowerCase().includes(searchTerm);
                } else {
                    // Default search across multiple fields
                    return (doc.counterRef && doc.counterRef.toLowerCase().includes(searchTerm)) ||
                        (doc.outgoingPaymentNo && doc.outgoingPaymentNo.toLowerCase().includes(searchTerm)) ||
                        (doc.docNum && doc.docNum.toString().includes(searchTerm)) ||
                        (doc.reimburseNo && doc.reimburseNo.toLowerCase().includes(searchTerm)) ||
                        (doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm)) ||
                        (doc.cardName && doc.cardName.toLowerCase().includes(searchTerm)) ||
                        (doc.comments && doc.comments.toLowerCase().includes(searchTerm));
                }
            });
        }

        console.log(`Documents after search filter: ${window.filteredDocuments.length}`);
        displayDocuments(window.filteredDocuments);

    } catch (error) {
        console.error('Error switching tab:', error);
        // Fallback to empty state
        window.filteredDocuments = [];
        displayDocuments([]);
    }
}

// Add keyboard shortcuts for tab navigation
document.addEventListener('keydown', function (event) {
    // Alt + A: Switch to All Documents sub-tab
    if (event.altKey && event.key === 'a') {
        switchTab('all');
    }
    // Alt + P: Switch to Prepared sub-tab
    else if (event.altKey && event.key === 'p') {
        switchTab('prepared');
    }
    // Alt + C: Switch to Checked sub-tab
    else if (event.altKey && event.key === 'c') {
        switchTab('checked');
    }
    // Alt + K: Switch to Acknowledged sub-tab
    else if (event.altKey && event.key === 'k') {
        switchTab('acknowledged');
    }
    // Alt + V: Switch to Approved sub-tab
    else if (event.altKey && event.key === 'v') {
        switchTab('approved');
    }
    // Alt + R: Switch to Received sub-tab
    else if (event.altKey && event.key === 'r') {
        switchTab('received');
    }
    // Alt + J: Switch to Rejected sub-tab
    else if (event.altKey && event.key === 'j') {
        switchTab('rejected');
    }
});

// Helper function to determine status display for documents
function getStatusDisplay(doc) {
    // Check if document has approval object and approval status
    if (doc.approval && doc.approval.approvalStatus) {
        const status = doc.approval.approvalStatus;

        // Map "Draft" status to "Prepared" for display consistency
        if (status.toLowerCase() === 'draft') {
            return 'Prepared';
        }

        return status;
    }

    // Check if document is rejected (has rejectedDate)
    if (doc.approval && doc.approval.rejectedDate) {
        return 'Rejected';
    }

    // Fallback to other status fields
    const status = doc.status || doc.type || doc.doctype || 'Draft';

    // Map "Draft" status to "Prepared" for display consistency
    if (status.toLowerCase() === 'draft') {
        return 'Prepared';
    }

    return status;
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
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
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
    searchInput.addEventListener('input', function (e) {
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
    console.log('downloadExcel called');
    console.log('window.filteredDocuments:', window.filteredDocuments);
    console.log('XLSX available:', typeof XLSX !== 'undefined');

    // Check if data is loaded
    if (!window.filteredDocuments || window.filteredDocuments.length === 0) {
        console.warn('No data to export');

        // Try to load data first
        const userId = getUserId();
        if (userId) {
            console.log('Attempting to load data before export...');
            loadDashboard().then(() => {
                if (window.filteredDocuments && window.filteredDocuments.length > 0) {
                    console.log('Data loaded, retrying export...');
                    downloadExcel();
                } else {
                    alert("No data available to export. Please wait for data to load or try refreshing the page.");
                }
            }).catch(error => {
                console.error('Error loading data for export:', error);
                alert("Error loading data for export. Please try refreshing the page.");
            });
        } else {
            alert("No data to export!");
        }
        return;
    }

    if (typeof XLSX === 'undefined') {
        console.error('XLSX library not loaded');
        alert("Excel library not loaded. Please refresh the page.");
        return;
    }

    try {
        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Convert data to worksheet format
        const wsData = [
            ["No.", "Voucher No.", "Requester", "Pay To", "Document Date", "Due Date", "Total Amount", "Status"]
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

            // Get mapped payTo name
            const payToName = doc.cardName || '-';

            wsData.push([
                index + 1,
                doc.counterRef || doc.outgoingPaymentNo || doc.docNum || doc.reimburseNo || '-',
                doc.requesterName || '-',
                payToName,
                doc.docDate ? new Date(doc.docDate).toLocaleDateString() : (doc.postingDate ? new Date(doc.postingDate).toLocaleDateString() : (doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-')),
                doc.receivedDate ? new Date(doc.receivedDate).toLocaleDateString() : (doc.docDueDate ? new Date(doc.docDueDate).toLocaleDateString() : (doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : '-')),
                calculatedTotalAmount.toLocaleString(),
                getStatusDisplay(doc)
            ]);
        });

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Outgoing Payments");

        // Generate Excel file and trigger download
        const fileName = `Outgoing_Payments_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        console.log('Excel file generated successfully:', fileName);
    } catch (error) {
        console.error('Error generating Excel file:', error);
        alert('Error generating Excel file. Please try again.');
    }
}

// Fungsi Download PDF
function downloadPDF() {
    console.log('downloadPDF called');
    console.log('window.filteredDocuments:', window.filteredDocuments);
    console.log('jsPDF available:', typeof window.jspdf !== 'undefined');

    // Check if data is loaded
    if (!window.filteredDocuments || window.filteredDocuments.length === 0) {
        console.warn('No data to export');

        // Try to load data first
        const userId = getUserId();
        if (userId) {
            console.log('Attempting to load data before export...');
            loadDashboard().then(() => {
                if (window.filteredDocuments && window.filteredDocuments.length > 0) {
                    console.log('Data loaded, retrying export...');
                    downloadPDF();
                } else {
                    alert("No data available to export. Please wait for data to load or try refreshing the page.");
                }
            }).catch(error => {
                console.error('Error loading data for export:', error);
                alert("Error loading data for export. Please try refreshing the page.");
            });
        } else {
            alert("No data to export!");
        }
        return;
    }

    if (typeof window.jspdf === 'undefined') {
        console.error('jsPDF library not loaded');
        alert("PDF library not loaded. Please refresh the page.");
        return;
    }

    try {
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
        const tableColumn = ["No.", "Voucher No.", "Requester", "Pay To", "Document Date", "Due Date", "Total Amount", "Status"];
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

            // Get mapped payTo name
            const payToName = doc.cardName || '-';

            const rowData = [
                index + 1,
                doc.counterRef || doc.outgoingPaymentNo || doc.docNum || doc.reimburseNo || '-',
                doc.requesterName || '-',
                payToName,
                doc.docDate ? new Date(doc.docDate).toLocaleDateString() : (doc.postingDate ? new Date(doc.postingDate).toLocaleDateString() : (doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-')),
                doc.receivedDate ? new Date(doc.receivedDate).toLocaleDateString() : (doc.docDueDate ? new Date(doc.docDueDate).toLocaleDateString() : (doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : '-')),
                calculatedTotalAmount.toLocaleString(),
                getStatusDisplay(doc)
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
        console.log('PDF file generated successfully:', fileName);
    } catch (error) {
        console.error('Error generating PDF file:', error);
        alert('Error generating PDF file. Please try again.');
    }
}

// Add debugging for navigation functions
function debugNavigation(functionName, path) {
    console.log(`Navigation called: ${functionName} -> ${path}`);
    console.log('navigateToPage available:', typeof navigateToPage === 'function');
    console.log('Current location:', window.location.href);
}

function goToMenu() {
    debugNavigation('goToMenu', 'pages/dashboard.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('pages/dashboard.html');
    } else {
        window.location.href = 'pages/dashboard.html';
    }
}

function goToAddDoc() {
    debugNavigation('goToAddDoc', 'addPages/addReim.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('addPages/addReim.html');
    } else {
        window.location.href = 'addPages/addReim.html';
    }
}

function goToAddReim() {
    debugNavigation('goToAddReim', 'addPages/addReim.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('addPages/addReim.html');
    } else {
        window.location.href = 'addPages/addReim.html';
    }
}

function goToAddSettle() {
    debugNavigation('goToAddSettle', 'addPages/addSettle.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('addPages/addSettle.html');
    } else {
        window.location.href = 'addPages/addSettle.html';
    }
}

function goToAddPO() {
    // PO page doesn't exist yet, redirect to a placeholder or main menu
    alert('PO page is not yet implemented');
}

function goToMenuPR() {
    debugNavigation('goToMenuPR', 'pages/menuPR.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('pages/menuPR.html');
    } else {
        window.location.href = 'pages/menuPR.html';
    }
}

function goToMenuReim() {
    debugNavigation('goToMenuReim', 'pages/menuReim.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('pages/menuReim.html');
    } else {
        window.location.href = 'pages/menuReim.html';
    }
}

function goToMenuCash() {
    debugNavigation('goToMenuCash', 'pages/menuCash.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('pages/menuCash.html');
    } else {
        window.location.href = 'pages/menuCash.html';
    }
}

function goToMenuSettle() {
    debugNavigation('goToMenuSettle', 'pages/menuSettle.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('pages/menuSettle.html');
    } else {
        window.location.href = 'pages/menuSettle.html';
    }
}

function goToApprovalReport() {
    debugNavigation('goToApprovalReport', 'pages/approval-dashboard.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('pages/approval-dashboard.html');
    } else {
        window.location.href = 'pages/approval-dashboard.html';
    }
}

function goToMenuPO() {
    // Placeholder - Update with correct path when implemented
    alert('PO Approval page is not yet implemented');
}

function goToMenuInvoice() {
    // Placeholder - Update with correct path when implemented
    alert('AR Invoice Approval page is not yet implemented');
}

function goToMenuBanking() {
    // Placeholder - Update with correct path when implemented
    alert('Outgoing Approval page is not yet implemented');
}

function logout() {
    // Clear any authentication tokens or session data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInUserCode");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRoles");
    localStorage.removeItem("hasOutgoingPaymentAccess");

    // Redirect to login page
    debugNavigation('logout', 'pages/login.html');
    if (typeof navigateToPage === 'function') {
        navigateToPage('pages/login.html');
    } else {
        window.location.href = 'pages/login.html';
    }
}

// Function to handle search input
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    switchTab(currentTab); // This will apply the search filter
}

function detailDoc(opId) {
    // Navigate to outgoing payment reimbursement receive page
    debugNavigation('detailDoc', `approvalPages/approval/receive/outgoingPayment/receiveOPReim.html?id=${opId}`);
    if (typeof navigateToPage === 'function') {
        navigateToPage(`approvalPages/approval/receive/outgoingPayment/receiveOPReim.html?id=${opId}`);
    } else {
        window.location.href = `approvalPages/approval/receive/outgoingPayment/receiveOPReim.html?id=${opId}`;
    }
}

// Load dashboard using the same approach as Purchase Request
window.onload = function () {
    // Check if required libraries are loaded
    console.log('Checking required libraries...');
    console.log('XLSX available:', typeof XLSX !== 'undefined');
    console.log('jsPDF available:', typeof window.jspdf !== 'undefined');

    // Check Outgoing Payment access first
    if (!checkOutgoingPaymentAccess()) {
        console.log('User does not have access to Outgoing Payment, stopping page load');
        return;
    }

    // Load initial data and dashboard counts
    loadDashboard();

    // Ensure filteredDocuments is available globally
    if (!window.filteredDocuments) {
        window.filteredDocuments = [];
    }

    // Add event listener for search input with debouncing
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearch();
            }, 500); // Debounce search by 500ms
        });
    }

    // Add event listener to the search type dropdown
    const searchType = document.getElementById('searchType');
    if (searchType) {
        searchType.addEventListener('change', function () {
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

    document.getElementById('preparedTabBtn').addEventListener('click', function (e) {
        ensureSidebarVisible();
    });

    // Add event listeners for new status tabs
    const newTabButtons = ['checkedTabBtn', 'acknowledgedTabBtn', 'approvedTabBtn', 'receivedTabBtn', 'rejectedTabBtn'];
    newTabButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', function (e) {
                ensureSidebarVisible();
            });
        }
    });
};

function formatCurrency(number) {
    // Handle empty or invalid input
    if (number === null || number === undefined || number === '') {
        return '0';
    }

    // Parse the number
    const num = parseFloat(number);
    if (isNaN(num)) {
        return '0';
    }

    // Get the string representation to check if it has decimal places
    const numStr = num.toString();
    const hasDecimal = numStr.includes('.');

    try {
        // Format with Indonesian locale (thousand separator: '.', decimal separator: ',')
        if (hasDecimal) {
            const decimalPlaces = numStr.split('.')[1].length;
            return num.toLocaleString('id-ID', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
            });
        } else {
            return num.toLocaleString('id-ID', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        }
    } catch (e) {
        // Fallback for very large numbers
        console.error('Error formatting number:', e);

        let strNum = num.toString();
        let sign = '';

        if (strNum.startsWith('-')) {
            sign = '-';
            strNum = strNum.substring(1);
        }

        const parts = strNum.split('.');
        const integerPart = parts[0];
        const decimalPart = parts.length > 1 ? ',' + parts[1] : '';

        let formattedInteger = '';
        for (let i = 0; i < integerPart.length; i++) {
            if (i > 0 && (integerPart.length - i) % 3 === 0) {
                formattedInteger += '.';
            }
            formattedInteger += integerPart.charAt(i);
        }

        return sign + formattedInteger + decimalPart;
    }
}