// Variabel untuk menyimpan dokumen reimbursement
let reimbursementDocs = [];

// Global variables for document management
let currentTab = 'all';
let currentPage = 1;
let itemsPerPage = 10;
let filteredDocuments = [];
let allDocuments = [];

// Global variable to store users
let users = [];

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
        
        // Pay To - Map user ID to user name
        const payToId = doc.payTo;
        const payToName = payToId ? getUserNameById(payToId) : (doc.payToName || '-');
        const payTo = applyScrollClass(payToName);
        
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
        // Get mapped payTo name for search
        const payToId = doc.payTo;
        const payToName = payToId ? getUserNameById(payToId) : (doc.payToName || '');
        
        return (
            (doc.voucherNo && doc.voucherNo.toLowerCase().includes(searchTerm)) ||
            (doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm)) ||
            (doc.department && doc.department.toLowerCase().includes(searchTerm)) ||
            (payToName && payToName.toLowerCase().includes(searchTerm)) ||
            (doc.receivedByName && doc.receivedByName.toLowerCase().includes(searchTerm)) ||
            (doc.receivedBy && doc.receivedBy.toLowerCase().includes(searchTerm)) ||
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
        // Fetch users first
        await fetchUsers();
        
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
        tableBody.innerHTML = `<tr><td colspan="10" class="p-4 text-center text-gray-500">No documents found for the selected tab.</td></tr>`;
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
        const requesterName = applyScrollClass(doc.receivedByName || doc.receivedBy || '-');
        // Pay To - Map user ID to user name
        const payToId = doc.payTo;
        const payToName = payToId ? getUserNameById(payToId) : (doc.payToName || doc.payTo || '-');
        const payTo = applyScrollClass(payToName);
        
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
            <td class='p-2'>${requesterName}</td>
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
    
    console.log(`Switching to tab: ${tab}`);
    
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
            console.log('Fetching all documents...');
            documents = await fetchAllDocuments(userId);
            console.log(`All documents fetched: ${documents.length} documents`);
        } else if (tab === 'prepared') {
            document.getElementById('preparedTabBtn').classList.add('tab-active');
            console.log('Fetching prepared documents...');
            documents = await fetchPreparedDocuments(userId);
            console.log(`Prepared documents fetched: ${documents.length} documents`);
        }
        
        // Update the filtered documents
        filteredDocuments = documents;
        allDocuments = documents;
        
        // Apply search filter if there's a search term
        const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
        const searchType = document.getElementById('searchType')?.value || 'all';
        
        console.log(`Search term: "${searchTerm}", Search type: "${searchType}"`);
        console.log(`Documents before search filter: ${filteredDocuments.length}`);
        
        if (searchTerm) {
            filteredDocuments = filteredDocuments.filter(doc => {
                if (searchType === 'reimNo') {
                    return (doc.counterRef && doc.counterRef.toLowerCase().includes(searchTerm)) || 
                           (doc.outgoingPaymentNo && doc.outgoingPaymentNo.toLowerCase().includes(searchTerm)) ||
                           (doc.docNum && doc.docNum.toString().includes(searchTerm)) ||
                           (doc.reimburseNo && doc.reimburseNo.toLowerCase().includes(searchTerm));
                } else if (searchType === 'requester') {
                    return doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm);
                } else if (searchType === 'requesterName') {
                    const requesterName = doc.receivedByName || doc.receivedBy || '';
                    return requesterName.toLowerCase().includes(searchTerm);
                } else if (searchType === 'payTo') {
                    const payToId = doc.payTo;
                    const payToName = payToId ? getUserNameById(payToId) : (doc.payToName || doc.payTo || '');
                    return payToName.toLowerCase().includes(searchTerm);
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
                    const payToId = doc.payTo;
                    const payToName = payToId ? getUserNameById(payToId) : (doc.payToName || doc.payTo || '');
                    
                    return (doc.counterRef && doc.counterRef.toLowerCase().includes(searchTerm)) ||
                           (doc.outgoingPaymentNo && doc.outgoingPaymentNo.toLowerCase().includes(searchTerm)) ||
                           (doc.docNum && doc.docNum.toString().includes(searchTerm)) ||
                           (doc.reimburseNo && doc.reimburseNo.toLowerCase().includes(searchTerm)) ||
                           (doc.requesterName && doc.requesterName.toLowerCase().includes(searchTerm)) ||
                           (doc.receivedByName && doc.receivedByName.toLowerCase().includes(searchTerm)) ||
                           (doc.receivedBy && doc.receivedBy.toLowerCase().includes(searchTerm)) ||
                           (doc.cardName && doc.cardName.toLowerCase().includes(searchTerm)) ||
                           (doc.bpName && doc.bpName.toLowerCase().includes(searchTerm)) ||
                           (doc.paidToName && doc.paidToName.toLowerCase().includes(searchTerm)) ||
                           (payToName && payToName.toLowerCase().includes(searchTerm)) ||
                           (doc.comments && doc.comments.toLowerCase().includes(searchTerm));
                }
            });
        }
        
        console.log(`Documents after search filter: ${filteredDocuments.length}`);
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

// Helper function to determine status display for documents
function getStatusDisplay(doc) {
    // If no approval object, check various status fields
    if (!doc.approval) {
        const status = doc.status || doc.type || doc.doctype || 'Draft';
        // Map "Draft" status to "Prepared" for display consistency
        if (status.toLowerCase() === 'draft') {
            return 'Prepared';
        }
        return status;
    }
    
    // Check if document is rejected
    if (doc.approval.rejectedDate) {
        return 'Rejected';
    }
    
    // Return normal approval status
    const status = doc.approval.approvalStatus || doc.status || doc.type || doc.doctype || 'Draft';
    
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
        ["No.", "Voucher No.", "Requester", "Requester Name", "Pay To", "Document Date", "Due Date", "Total Amount", "Status"]
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
        const payToId = doc.payTo;
        const payToName = payToId ? getUserNameById(payToId) : (doc.payToName || doc.payTo || '-');
        
        wsData.push([
            index + 1,
            doc.counterRef || doc.outgoingPaymentNo || doc.docNum || doc.reimburseNo || '-',
            doc.requesterName || '-',
            doc.receivedByName || doc.receivedBy || '-',
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
    const tableColumn = ["No.", "Voucher No.", "Requester", "Requester Name", "Pay To", "Document Date", "Document Date", "Total Amount", "Status"];
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
        const payToId = doc.payTo;
        const payToName = payToId ? getUserNameById(payToId) : (doc.payToName || doc.payTo || '-');
        
        const rowData = [
            index + 1,
            doc.counterRef || doc.outgoingPaymentNo || doc.docNum || doc.reimburseNo || '-',
            doc.requesterName || '-',
            doc.receivedByName || doc.receivedBy || '-',
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
}

function goToMenu() { 
    window.location.href = "pages/dashboard.html"; 
}
function goToAddDoc() {
    window.location.href = "addPages/addReim.html"; 
}
function goToAddReim() {
    window.location.href = "addPages/addReim.html"; 
}

function goToAddSettle() {
    window.location.href = "addPages/addSettle.html"; 
}
function goToAddPO() {
    window.location.href = "addPages/addPO.html"; 
}
function goToMenuPR() { 
    window.location.href = "pages/menuPR.html"; 
}
function goToMenuReim() { 
    window.location.href = "pages/menuReim.html"; 
}
function goToMenuCash() { 
    window.location.href = "pages/menuCash.html"; 
}
function goToMenuSettle() { 
    window.location.href = "pages/menuSettle.html"; 
}
function goToApprovalReport() { 
    window.location.href = "pages/approval-dashboard.html"; 
}
function goToMenuPO() { 
    window.location.href = "pages/menuPO.html"; 
}
function goToMenuInvoice() { 
    window.location.href = "pages/menuInvoice.html"; 
}
function goToMenuBanking() { 
    window.location.href = "pages/menuBanking.html"; 
}
function logout() { 
    localStorage.removeItem("loggedInUser"); 
    window.location.href = "pages/login.html"; 
}

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