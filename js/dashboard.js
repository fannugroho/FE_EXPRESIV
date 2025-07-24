window.onload = function () {
    loadUserGreeting();
    loadDashboard();
    loadCheckedDashboard(); // Tambahkan pemanggilan untuk checked dashboard
    loadAcknowledgeDashboard(); // Tambahkan pemanggilan untuk acknowledge dashboard
    loadApproveDashboard(); // Tambahkan pemanggilan untuk approve dashboard
    loadReceiveDashboard(); // Tambahkan pemanggilan untuk receive dashboard
    loadRevisionDashboard(); // Tambahkan pemanggilan untuk revision dashboard
    
    // Load Reimbursement dashboards
    loadReimCheckedDashboard();
    loadReimAcknowledgeDashboard();
    loadReimApproveDashboard();
    loadReimReceiveDashboard();
    loadReimRevisionDashboard();
    
    initNotifications();
    
    // Inisialisasi notifikasi approval
    initApprovalNotifications();
    
    // Check and show/hide Outgoing Payment card based on user access
    checkOutgoingPaymentAccess();
};

function loadUserGreeting() {
    const usersData = localStorage.getItem("users");
    const loggedInUserCode = localStorage.getItem("loggedInUserCode");
    console.log("Cek localStorage di menu.html:", usersData);
    if (usersData && loggedInUserCode) {
        try {
            const users = JSON.parse(usersData);
            console.log("Data users setelah parse:", users);
            const loggedInUser = users.find(user => user.usercode === loggedInUserCode);
            if (loggedInUser) {
                console.log("User ditemukan:", loggedInUser.usercode, loggedInUser.name);
                safeSetTextContent("greeting", `Hii ${loggedInUser.name} (${loggedInUser.usercode})`);
            } else {
                console.log("User tidak ditemukan dalam daftar users.");
                safeSetTextContent("greeting", "Hii Guest");
            }
        } catch (error) {
            console.error("Error parsing JSON:", error);
            safeSetTextContent("greeting", "Hii Guest");
        }
    } else {
        // Fallback to get user from loggedInUser object
        try {
            const loggedInUserObject = localStorage.getItem("loggedInUser");
            if (loggedInUserObject) {
                const userObj = JSON.parse(loggedInUserObject);
                safeSetTextContent("greeting", `Hii ${userObj.name}`);
                if (document.getElementById("userNameDisplay")) {
                    document.getElementById("userNameDisplay").textContent = userObj.name;
                }
            } else {
                console.log("No logged in user found");
                safeSetTextContent("greeting", "Hii Guest");
            }
        } catch (error) {
            console.error("Error parsing loggedInUser JSON:", error);
            safeSetTextContent("greeting", "Hii Guest");
        }
    }
}

// Notification system (without WebSocket)
let notificationData = [];

// Show toast notification for new notifications
function showToastNotification(notification) {
    const startTime = performance.now();
    
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300 max-w-sm';
    toast.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <i class="fas fa-bell text-white"></i>
            </div>
            <div class="ml-3 flex-1">
                <div class="font-semibold text-sm">${notification.docNumber || 'New Notification'}</div>
                <div class="text-xs opacity-90 mt-1">${notification.requesterName || ''} - ${notification.department || ''}</div>
                <div class="text-xs opacity-75 mt-1">${notification.approvalLevel || 'Approval'} required</div>
            </div>
            <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
        const endTime = performance.now();
        console.log(`Toast notification display time: ${(endTime - startTime).toFixed(2)}ms`);
    }, 100);
    
    // Auto remove after 8 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, 8000);
}

// Add notification to list
function addNotificationToList(notification) {
    const notificationList = document.getElementById("notification-list");
    if (!notificationList) return;

    // Create new notification item
    const li = document.createElement('li');
    li.className = 'notification-item px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0 bg-blue-50';
    li.setAttribute('data-notification-id', notification.id);
    
    // Determine icon and colors
    let iconClass, bgColorClass, statusBadgeClass;
    
    switch(notification.docType) {
        case 'Purchase Request':
            iconClass = 'fas fa-file-invoice-dollar text-blue-500';
            bgColorClass = 'bg-blue-100';
            statusBadgeClass = 'bg-blue-200 text-blue-800';
            break;
        case 'Reimbursement':
            iconClass = 'fas fa-hand-holding-usd text-green-500';
            bgColorClass = 'bg-green-100';
            statusBadgeClass = 'bg-green-200 text-green-800';
            break;
        case 'Cash Advance':
            iconClass = 'fas fa-wallet text-purple-500';
            bgColorClass = 'bg-purple-100';
            statusBadgeClass = 'bg-purple-200 text-purple-800';
            break;
        case 'Settlement':
            iconClass = 'fas fa-balance-scale text-orange-500';
            bgColorClass = 'bg-orange-100';
            statusBadgeClass = 'bg-orange-200 text-orange-800';
            break;
        default:
            iconClass = 'fas fa-file text-gray-500';
            bgColorClass = 'bg-gray-100';
            statusBadgeClass = 'bg-gray-200 text-gray-800';
    }
    
    li.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0 pt-1">
                <span class="h-8 w-8 rounded-full ${bgColorClass} flex items-center justify-center">
                    <i class="${iconClass}"></i>
                </span>
            </div>
            <div class="ml-3 flex-1">
                <div class="flex items-center justify-between">
                    <div class="font-semibold">${notification.docNumber}</div>
                    <span class="px-2 py-1 text-xs rounded-full ${statusBadgeClass}">${notification.approvalLevel}</span>
                </div>
                <div class="text-xs text-gray-700">
                    <strong>${notification.requesterName}</strong> - ${notification.department}
                </div>
                <div class="text-xs text-gray-400 mt-1">${formatDate(new Date(notification.submissionDate))}</div>
                <div class="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
            </div>
        </div>
    `;
    
    // Add click event
    li.addEventListener('click', () => {
        markNotificationAsRead(notification.id);
        redirectToApprovalPage(notification);
    });
    
    // Add to top of list
    notificationList.insertBefore(li, notificationList.firstChild);
    
    // Remove oldest if more than 5
    const items = notificationList.querySelectorAll('li');
    if (items.length > 5) {
        items[items.length - 1].remove();
    }
}

// Notification System
function initNotifications() {
    fetchApprovalNotifications()
        .then(notificationData => {
            window.allNotifications = notificationData;
            renderNotifications(notificationData);
            updateNotificationCount(notificationData.filter(n => !n.isRead).length);
        })
        .catch(error => {
            console.error("Error mengambil data notifikasi:", error);
            // Don't use dummy data, just show empty state
            window.allNotifications = [];
            renderNotifications([]);
            updateNotificationCount(0);
        });
    
    setupNotificationEvents();
}

// Helper function to handle API responses safely
async function safeApiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${getAccessToken()}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            console.warn(`API call failed: ${url} - Status: ${response.status}`);
            return null;
        }
        
        const text = await response.text();
        if (!text) {
            console.warn(`Empty response from: ${url}`);
            return null;
        }
        
        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.warn(`Failed to parse JSON from: ${url}`, parseError);
            return null;
        }
        
    } catch (error) {
        console.error(`Error calling API: ${url}`, error);
        return null;
    }
}

// Fetch approval notifications from API
async function fetchApprovalNotifications() {
    try {
        const userId = getUserId();
        if (!userId) {
            console.warn("User ID tidak ditemukan");
            return [];
        }
        
        const data = await safeApiCall(`${BASE_URL}/api/notification/approval/${userId}`);
        
        if (data) {
            console.log("Data notifikasi approval berhasil diambil:", data);
            return data.data || [];
        }
        
        return [];
        
    } catch (error) {
        console.error("Error saat mengambil notifikasi approval:", error);
        return [];
    }
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
    try {
        await fetch(`${BASE_URL}/api/notification/${notificationId}/read`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${getAccessToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Update UI
        const notificationItem = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (notificationItem) {
            notificationItem.classList.remove('bg-blue-50');
            notificationItem.classList.add('opacity-75');
            const unreadDot = notificationItem.querySelector('.w-2.h-2.bg-blue-500');
            if (unreadDot) {
                unreadDot.remove();
            }
        }
        
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
}

// Redirect to approval page
function redirectToApprovalPage(notification) {
    const baseUrl = window.location.origin;
    let approvalUrl = '';
    
    switch(notification.docType) {
        case 'Purchase Request':
            approvalUrl = `${baseUrl}/approvalPages/dashboard/dashboardCheck/purchaseRequest/menuPRCheck.html`;
            break;
        case 'Reimbursement':
            approvalUrl = `${baseUrl}/approvalPages/dashboard/dashboardCheck/reimbursement/menuReimCheck.html`;
            break;
        case 'Cash Advance':
            approvalUrl = `${baseUrl}/approvalPages/dashboard/dashboardCheck/cashAdvance/menuCashCheck.html`;
            break;
        case 'Settlement':
            approvalUrl = `${baseUrl}/approvalPages/dashboard/dashboardCheck/settlement/menuSettleCheck.html`;
            break;
        default:
            approvalUrl = `${baseUrl}/pages/dashboard.html`;
    }
    
    window.location.href = approvalUrl;
}

// Update notification badge
function updateNotificationBadge() {
    const unreadCount = document.querySelectorAll('.notification-item.bg-blue-50').length;
    const badge = document.querySelector("#notificationBtn .notification-badge");
    
    if (badge) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

// Fungsi untuk mengambil data notifikasi dari API
async function fetchNotifications() {
    try {
        // Ambil informasi user yang sedang login
        const loggedInUserCode = localStorage.getItem("loggedInUserCode");
        if (!loggedInUserCode) {
            throw new Error("User tidak terautentikasi");
        }
        
        // Ambil baseUrl dari konfigurasi (tambahkan variabel baseUrl di tempat lain jika belum ada)
        const baseUrl = localStorage.getItem("baseUrl") || "https://api.kansaipaint.co.id/api";
        
        // Buat URL endpoint untuk mengambil dokumen user
        const url = `${baseUrl}/documents?userCode=${loggedInUserCode}`;
        
        console.log("Mengambil data notifikasi dari:", url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("token")}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Data notifikasi berhasil diambil:", data);
        
        // Jika data adalah array, proses langsung
        // Jika data adalah objek dengan property 'data', gunakan data.data
        const documents = Array.isArray(data) ? data : (data.data || []);
        
        if (documents.length === 0) {
            console.log("Tidak ada dokumen ditemukan");
        }
        
        // Transform data API menjadi format yang dibutuhkan untuk notifikasi
        const transformedDocs = documents.map(doc => ({
            id: doc.id || doc.documentId || Math.random().toString(36).substring(2, 11),
            docType: doc.documentType || doc.type || "Unknown",
            docNumber: doc.documentNumber || doc.number || "No. -",
            status: doc.status || "Open",
            date: new Date(doc.createdAt || doc.created_at || new Date()),
            dateFormatted: formatDate(new Date(doc.createdAt || doc.created_at || new Date()))
        })).sort((a, b) => b.date - a.date); // Urutkan berdasarkan tanggal, terbaru dulu
        
        // Simpan dokumen untuk dashboard
        window.allDocuments = transformedDocs;
        
        // Tidak lagi memanggil updateDashboardCounts karena sekarang menggunakan loadDashboard() dengan multiple API calls
        // updateDashboardCounts(transformedDocs);
        
        return transformedDocs;
        
    } catch (error) {
        console.error("Error saat mengambil notifikasi:", error);
        throw error;
    }
}

// Fungsi untuk memuat dashboard dengan multiple API calls
async function loadDashboard() {
    try {
        // Dapatkan user ID yang sedang login
        const userId = getUserId();
        if (!userId) {
            console.error("User ID tidak ditemukan, tidak bisa memuat dashboard");
            return;
        }

        console.log("Memuat dashboard untuk user ID:", userId);
        
        // Fetch dokumen untuk setiap jenis dokumen yang dibuat oleh user yang login
        const prData = await safeApiCall(`${BASE_URL}/api/pr/dashboard?requesterId=${userId}`);
        const reimData = await safeApiCall(`${BASE_URL}/api/reimbursements/status-counts/user/${userId}`);
        const cashData = await safeApiCall(`${BASE_URL}/api/cashadvance/dashboard?requesterId=${userId}`);
        const settleData = await safeApiCall(`${BASE_URL}/api/settlement/dashboard?requesterId=${userId}`);

        // Hitung jumlah dokumen untuk setiap jenis dengan safe handling
        const prCount = prData?.data ? prData.data.length : 0;
        const reimCount = reimData?.data?.totalCount || 0;
        const cashCount = cashData?.data ? cashData.data.length : 0;
        const settleCount = settleData?.data ? settleData.data.length : 0;
        
        // Update counters pada dashboard
        safeSetTextContent("totalDocs", prCount);
        safeSetTextContent("openDocs", reimCount);
        safeSetTextContent("preparedDocs", cashCount);
        safeSetTextContent("checkedDocs", settleCount);
        
        console.log('Dashboard counts updated successfully for user', userId, {
            "Purchase Request": prCount,
            "Reimbursement": reimCount,
            "Cash Advance": cashCount,
            "Settlement": settleCount
        });
        
    } catch (error) {
        console.error('Error loading dashboard counts:', error);
        // Set default values on error
        safeSetTextContent("totalDocs", 0);
        safeSetTextContent("openDocs", 0);
        safeSetTextContent("preparedDocs", 0);
        safeSetTextContent("checkedDocs", 0);
    }
}

// Fungsi untuk memuat data checked dari endpoint API menuPRCheck.html
async function loadCheckedDashboard() {
    try {
        // Dapatkan user ID yang sedang login
        const userId = getUserId();
        if (!userId) {
            console.error("User ID tidak ditemukan, tidak bisa memuat checked dashboard");
            return;
        }

        console.log("Memuat checked dashboard untuk user ID:", userId);
        
        // Fetch counts untuk setiap status menggunakan endpoint API dari menuPRCheck.html
        const preparedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const checkedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const rejectedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/rejected?ApproverId=${userId}&ApproverRole=checked`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const preparedData = preparedResponse.ok ? await preparedResponse.json() : { data: [] };
        const checkedData = checkedResponse.ok ? await checkedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };

        const preparedCount = preparedData.data ? preparedData.data.length : 0;
        const checkedCount = checkedData.data ? checkedData.data.length : 0;
        const rejectedCount = rejectedData.data ? rejectedData.data.length : 0;
        const totalCount = preparedCount + checkedCount + rejectedCount;

        // Update counters untuk checked tab (tersembunyi)
        safeSetTextContent("prPreparedCount", preparedCount);
        safeSetTextContent("prCheckedCount", checkedCount);
        safeSetTextContent("prRejectedCount", rejectedCount);
        safeSetTextContent("prTotalCount", totalCount);
        
        console.log('Checked dashboard counts updated successfully for user', userId, {
            "PR Prepared": preparedCount,
            "PR Checked": checkedCount,
            "PR Rejected": rejectedCount,
            "PR Total": totalCount
        });
        
    } catch (error) {
        console.error('Error loading checked dashboard counts:', error);
        // Set default values on error
        safeSetTextContent("prPreparedCount", 0);
        safeSetTextContent("prCheckedCount", 0);
        safeSetTextContent("prRejectedCount", 0);
        safeSetTextContent("prTotalCount", 0);
    }
}

// Fungsi untuk memuat data acknowledge dari endpoint API menuPRAcknow.html
async function loadAcknowledgeDashboard() {
    try {
        // Dapatkan user ID yang sedang login
        const userId = getUserId();
        if (!userId) {
            console.error("User ID tidak ditemukan, tidak bisa memuat acknowledge dashboard");
            return;
        }

        console.log("Memuat acknowledge dashboard untuk user ID:", userId);
        
        // Fetch counts untuk setiap status menggunakan safe API calls
        const checkedData = await safeApiCall(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=acknowledged&isApproved=false`);
        const acknowledgedData = await safeApiCall(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=acknowledged&isApproved=true`);
        const rejectedData = await safeApiCall(`${BASE_URL}/api/pr/dashboard/rejected?ApproverId=${userId}&ApproverRole=acknowledged`);

        const checkedCount = checkedData?.data ? checkedData.data.length : 0;
        const acknowledgedCount = acknowledgedData?.data ? acknowledgedData.data.length : 0;
        const rejectedCount = rejectedData?.data ? rejectedData.data.length : 0;
        const totalCount = checkedCount + acknowledgedCount + rejectedCount;

        // Update counters untuk acknowledge tab (tersembunyi)
        safeSetTextContent("prAckTotalCount", totalCount);
        safeSetTextContent("prAckCheckedCount", checkedCount);
        safeSetTextContent("prAckAcknowledgedCount", acknowledgedCount);
        safeSetTextContent("prAckRejectedCount", rejectedCount);
        
        console.log('Acknowledge dashboard counts updated successfully for user', userId, {
            "PR Total": totalCount,
            "PR Checked": checkedCount,
            "PR Acknowledged": acknowledgedCount,
            "PR Rejected": rejectedCount
        });
        
    } catch (error) {
        console.error('Error loading acknowledge dashboard counts:', error);
        // Set default values on error
        safeSetTextContent("prAckTotalCount", 0);
        safeSetTextContent("prAckCheckedCount", 0);
        safeSetTextContent("prAckAcknowledgedCount", 0);
        safeSetTextContent("prAckRejectedCount", 0);
    }
}

// Fungsi untuk memuat data approve dari endpoint API menuPRApprove.html
async function loadApproveDashboard() {
    try {
        // Dapatkan user ID yang sedang login
        const userId = getUserId();
        if (!userId) {
            console.error("User ID tidak ditemukan, tidak bisa memuat approve dashboard");
            return;
        }

        console.log("Memuat approve dashboard untuk user ID:", userId);
        
        // Fetch counts untuk setiap status menggunakan endpoint API dari menuPRApprove.html
        const acknowledgeResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=approved&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const approvedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=approved&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const rejectedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/rejected?ApproverId=${userId}&ApproverRole=approved`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const acknowledgeData = acknowledgeResponse.ok ? await acknowledgeResponse.json() : { data: [] };
        const approvedData = approvedResponse.ok ? await approvedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };

        const acknowledgeCount = acknowledgeData.data ? acknowledgeData.data.length : 0;
        const approvedCount = approvedData.data ? approvedData.data.length : 0;
        const rejectedCount = rejectedData.data ? rejectedData.data.length : 0;
        const totalCount = acknowledgeCount + approvedCount + rejectedCount;

        // Update counters untuk approve tab (tersembunyi)
        safeSetTextContent("prAppTotalCount", totalCount);
        safeSetTextContent("prAppAcknowledgeCount", acknowledgeCount);
        safeSetTextContent("prAppApprovedCount", approvedCount);
        safeSetTextContent("prAppRejectedCount", rejectedCount);
        
        console.log('Approve dashboard counts updated successfully for user', userId, {
            "PR Total": totalCount,
            "PR Acknowledge": acknowledgeCount,
            "PR Approved": approvedCount,
            "PR Rejected": rejectedCount
        });
        
    } catch (error) {
        console.error('Error loading approve dashboard counts:', error);
        // Set default values on error
        safeSetTextContent("prAppTotalCount", 0);
        safeSetTextContent("prAppAcknowledgeCount", 0);
        safeSetTextContent("prAppApprovedCount", 0);
        safeSetTextContent("prAppRejectedCount", 0);
    }
}

// Fungsi untuk memuat data receive dari endpoint API menuPRReceive.html
async function loadReceiveDashboard() {
    try {
        // Dapatkan user ID yang sedang login
        const userId = getUserId();
        if (!userId) {
            console.error("User ID tidak ditemukan, tidak bisa memuat receive dashboard");
            return;
        }

        console.log("Memuat receive dashboard untuk user ID:", userId);
        
        // Fetch counts untuk setiap status menggunakan endpoint API dari menuPRReceive.html
        const approvedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const receivedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=true`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const rejectedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/rejected?ApproverId=${userId}&ApproverRole=received`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const approvedData = approvedResponse.ok ? await approvedResponse.json() : { data: [] };
        const receivedData = receivedResponse.ok ? await receivedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };

        const approvedCount = approvedData.data ? approvedData.data.length : 0;
        const receivedCount = receivedData.data ? receivedData.data.length : 0;
        const rejectedCount = rejectedData.data ? rejectedData.data.length : 0;
        const totalCount = approvedCount + receivedCount + rejectedCount;

        // Update counters untuk receive tab (tersembunyi)
        safeSetTextContent("prRecTotalCount", totalCount);
        safeSetTextContent("prRecApprovedCount", approvedCount);
        safeSetTextContent("prRecReceivedCount", receivedCount);
        safeSetTextContent("prRecRejectedCount", rejectedCount);
        
        console.log('Receive dashboard counts updated successfully for user', userId, {
            "PR Total": totalCount,
            "PR Approved": approvedCount,
            "PR Received": receivedCount,
            "PR Rejected": rejectedCount
        });
        
    } catch (error) {
        console.error('Error loading receive dashboard counts:', error);
        // Set default values on error
        safeSetTextContent("prRecTotalCount", 0);
        safeSetTextContent("prRecApprovedCount", 0);
        safeSetTextContent("prRecReceivedCount", 0);
        safeSetTextContent("prRecRejectedCount", 0);
    }
}

// Fungsi untuk memuat data revision dari endpoint API menuPRRevision.html
async function loadRevisionDashboard() {
    try {
        // Dapatkan user ID yang sedang login
        const userId = getUserId();
        if (!userId) {
            console.error("User ID tidak ditemukan, tidak bisa memuat revision dashboard");
            return;
        }

        console.log("Memuat revision dashboard untuk user ID:", userId);
        
        // Fetch counts untuk setiap status menggunakan endpoint API dari menuPRRevision.html
        const revisionResponse = await fetch(`${BASE_URL}/api/pr/dashboard/revision?filterType=revision&userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const preparedResponse = await fetch(`${BASE_URL}/api/pr/dashboard/revision?filterType=prepared&userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const revisionData = revisionResponse.ok ? await revisionResponse.json() : { data: [] };
        const preparedData = preparedResponse.ok ? await preparedResponse.json() : { data: [] };

        const revisionCount = revisionData.data ? revisionData.data.length : 0;
        const preparedCount = preparedData.data ? preparedData.data.length : 0;

        // Update counters untuk revision tab (tersembunyi)
        safeSetTextContent("prRevRevisionCount", revisionCount);
        safeSetTextContent("prRevPreparedCount", preparedCount);
        
        console.log('Revision dashboard counts updated successfully for user', userId, {
            "PR Revision": revisionCount,
            "PR Prepared": preparedCount
        });
        
    } catch (error) {
        console.error('Error loading revision dashboard counts:', error);
        // Set default values on error
        safeSetTextContent("prRevRevisionCount", 0);
        safeSetTextContent("prRevPreparedCount", 0);
    }
}

// ==================== REIMBURSEMENT DASHBOARD FUNCTIONS ====================

// Fungsi untuk memuat checked dashboard Reimbursement
async function loadReimCheckedDashboard() {
    try {
        const userId = getUserId();
        if (!userId) { console.error("User ID tidak ditemukan, tidak bisa memuat reim checked dashboard"); return; }
        console.log("Memuat reim checked dashboard untuk user ID:", userId);
        const preparedResponse = await fetch(`${BASE_URL}/api/reimbursements/checker/${userId}/prepared`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
        const checkedResponse = await fetch(`${BASE_URL}/api/reimbursements/checker/${userId}/checked`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
        const rejectedResponse = await fetch(`${BASE_URL}/api/reimbursements/checker/${userId}/rejected`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
        const preparedData = preparedResponse.ok ? await preparedResponse.json() : { data: [] };
        const checkedData = checkedResponse.ok ? await checkedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };
        const preparedCount = preparedData.data ? preparedData.data.length : 0;
        const checkedCount = checkedData.data ? checkedData.data.length : 0;
        const rejectedCount = rejectedData.data ? rejectedData.data.length : 0;
        const totalCount = preparedCount + checkedCount + rejectedCount;
        safeSetTextContent("reimPreparedCount", preparedCount);
        safeSetTextContent("reimCheckedCount", checkedCount);
        safeSetTextContent("reimRejectedCount", rejectedCount);
        safeSetTextContent("reimTotalCount", totalCount);
        console.log('Reim checked dashboard counts updated successfully for user', userId, { "Reim Prepared": preparedCount, "Reim Checked": checkedCount, "Reim Rejected": rejectedCount, "Reim Total": totalCount });
    } catch (error) { console.error('Error loading reim checked dashboard counts:', error); safeSetTextContent("reimPreparedCount", 0); safeSetTextContent("reimCheckedCount", 0); safeSetTextContent("reimRejectedCount", 0); safeSetTextContent("reimTotalCount", 0); }
}

// Fungsi untuk memuat acknowledge dashboard Reimbursement
async function loadReimAcknowledgeDashboard() {
    try {
        const userId = getUserId();
        if (!userId) { console.error("User ID tidak ditemukan, tidak bisa memuat reim acknowledge dashboard"); return; }
        console.log("Memuat reim acknowledge dashboard untuk user ID:", userId);
        const checkedResponse = await fetch(`${BASE_URL}/api/reimbursements/acknowledger/${userId}/checked`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
        const acknowledgedResponse = await fetch(`${BASE_URL}/api/reimbursements/acknowledger/${userId}/acknowledged`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
        const rejectedResponse = await fetch(`${BASE_URL}/api/reimbursements/acknowledger/${userId}/rejected`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
        const checkedData = checkedResponse.ok ? await checkedResponse.json() : { data: [] };
        const acknowledgedData = acknowledgedResponse.ok ? await acknowledgedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };
        const checkedCount = checkedData.data ? checkedData.data.length : 0;
        const acknowledgedCount = acknowledgedData.data ? acknowledgedData.data.length : 0;
        const rejectedCount = rejectedData.data ? rejectedData.data.length : 0;
        const totalCount = checkedCount + acknowledgedCount + rejectedCount;
        safeSetTextContent("reimAckTotalCount", totalCount);
        safeSetTextContent("reimAckCheckedCount", checkedCount);
        safeSetTextContent("reimAckAcknowledgedCount", acknowledgedCount);
        safeSetTextContent("reimAckRejectedCount", rejectedCount);
        console.log('Reim acknowledge dashboard counts updated successfully for user', userId, { "Reim Total": totalCount, "Reim Checked": checkedCount, "Reim Acknowledged": acknowledgedCount, "Reim Rejected": rejectedCount });
    } catch (error) { console.error('Error loading reim acknowledge dashboard counts:', error); safeSetTextContent("reimAckTotalCount", 0); safeSetTextContent("reimAckCheckedCount", 0); safeSetTextContent("reimAckAcknowledgedCount", 0); safeSetTextContent("reimAckRejectedCount", 0); }
}

// Fungsi untuk memuat approve dashboard Reimbursement
async function loadReimApproveDashboard() {
    try {
        const userId = getUserId();
        if (!userId) { console.error("User ID tidak ditemukan, tidak bisa memuat reim approve dashboard"); return; }
        console.log("Memuat reim approve dashboard untuk user ID:", userId);
        const acknowledgeResponse = await fetch(`${BASE_URL}/api/reimbursements/approver/${userId}/acknowledged`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
        const approvedResponse = await fetch(`${BASE_URL}/api/reimbursements/approver/${userId}/approved`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
        const rejectedResponse = await fetch(`${BASE_URL}/api/reimbursements/approver/${userId}/rejected`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
        const acknowledgeData = acknowledgeResponse.ok ? await acknowledgeResponse.json() : { data: [] };
        const approvedData = approvedResponse.ok ? await approvedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };
        const acknowledgeCount = acknowledgeData.data ? acknowledgeData.data.length : 0;
        const approvedCount = approvedData.data ? approvedData.data.length : 0;
        const rejectedCount = rejectedData.data ? rejectedData.data.length : 0;
        const totalCount = acknowledgeCount + approvedCount + rejectedCount;
        safeSetTextContent("reimAppTotalCount", totalCount);
        safeSetTextContent("reimAppAcknowledgeCount", acknowledgeCount);
        safeSetTextContent("reimAppApprovedCount", approvedCount);
        safeSetTextContent("reimAppRejectedCount", rejectedCount);
        console.log('Reim approve dashboard counts updated successfully for user', userId, { "Reim Total": totalCount, "Reim Acknowledge": acknowledgeCount, "Reim Approved": approvedCount, "Reim Rejected": rejectedCount });
    } catch (error) { console.error('Error loading reim approve dashboard counts:', error); safeSetTextContent("reimAppTotalCount", 0); safeSetTextContent("reimAppAcknowledgeCount", 0); safeSetTextContent("reimAppApprovedCount", 0); safeSetTextContent("reimAppRejectedCount", 0); }
}

// Fungsi untuk memuat receive dashboard Reimbursement
async function loadReimReceiveDashboard() {
    try {
        const userId = getUserId();
        if (!userId) { console.error("User ID tidak ditemukan, tidak bisa memuat reim receive dashboard"); return; }
        console.log("Memuat reim receive dashboard untuk user ID:", userId);
        const approvedResponse = await fetch(`${BASE_URL}/api/reimbursements/receiver/${userId}/approved`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
        const receivedResponse = await fetch(`${BASE_URL}/api/reimbursements/receiver/${userId}/received`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
        const rejectedResponse = await fetch(`${BASE_URL}/api/reimbursements/receiver/${userId}/rejected`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
        const approvedData = approvedResponse.ok ? await approvedResponse.json() : { data: [] };
        const receivedData = receivedResponse.ok ? await receivedResponse.json() : { data: [] };
        const rejectedData = rejectedResponse.ok ? await rejectedResponse.json() : { data: [] };
        const approvedCount = approvedData.data ? approvedData.data.length : 0;
        const receivedCount = receivedData.data ? receivedData.data.length : 0;
        const rejectedCount = rejectedData.data ? rejectedData.data.length : 0;
        const totalCount = approvedCount + receivedCount + rejectedCount;
        safeSetTextContent("reimRecTotalCount", totalCount);
        safeSetTextContent("reimRecApprovedCount", approvedCount);
        safeSetTextContent("reimRecReceivedCount", receivedCount);
        safeSetTextContent("reimRecRejectedCount", rejectedCount);
        console.log('Reim receive dashboard counts updated successfully for user', userId, { "Reim Total": totalCount, "Reim Approved": approvedCount, "Reim Received": receivedCount, "Reim Rejected": rejectedCount });
    } catch (error) { console.error('Error loading reim receive dashboard counts:', error); safeSetTextContent("reimRecTotalCount", 0); safeSetTextContent("reimRecApprovedCount", 0); safeSetTextContent("reimRecReceivedCount", 0); safeSetTextContent("reimRecRejectedCount", 0); }
}

// Fungsi untuk memuat revision dashboard Reimbursement
async function loadReimRevisionDashboard() {
    try {
        const userId = getUserId();
        if (!userId) { console.error("User ID tidak ditemukan, tidak bisa memuat reim revision dashboard"); return; }
        console.log("Memuat reim revision dashboard untuk user ID:", userId);
        const revisionResponse = await fetch(`${BASE_URL}/api/reimbursements/revisor/${userId}/revision`, { headers: { 'Authorization': `Bearer ${getAccessToken()}` } });
        const revisionData = revisionResponse.ok ? await revisionResponse.json() : { data: [] };
        const revisionCount = revisionData.data ? revisionData.data.length : 0;
        safeSetTextContent("reimRevRevisionCount", revisionCount);
        safeSetTextContent("reimRevPreparedCount", 0); // Set to 0 since prepared endpoint doesn't exist
        console.log('Reim revision dashboard counts updated successfully for user', userId, { "Reim Revision": revisionCount, "Reim Prepared": 0 });
    } catch (error) { console.error('Error loading reim revision dashboard counts:', error); safeSetTextContent("reimRevRevisionCount", 0); safeSetTextContent("reimRevPreparedCount", 0); }
}

// Fungsi untuk menampilkan tab checked (untuk debugging atau admin)
function showCheckedTab() {
    const checkedTab = document.getElementById('checkedTab');
    if (checkedTab) {
        checkedTab.style.display = 'block';
        console.log('Checked tab ditampilkan');
    }
}

// Fungsi untuk menyembunyikan tab checked
function hideCheckedTab() {
    const checkedTab = document.getElementById('checkedTab');
    if (checkedTab) {
        checkedTab.style.display = 'none';
        console.log('Checked tab disembunyikan');
    }
}

// Fungsi untuk toggle tab checked
function toggleCheckedTab() {
    const checkedTab = document.getElementById('checkedTab');
    if (checkedTab) {
        if (checkedTab.style.display === 'none' || checkedTab.style.display === '') {
            showCheckedTab();
        } else {
            hideCheckedTab();
        }
    }
}

// Fungsi untuk menampilkan tab acknowledge
function showAcknowledgeTab() {
    const acknowledgeTab = document.getElementById('acknowledgeTab');
    if (acknowledgeTab) {
        acknowledgeTab.style.display = 'block';
        console.log('Acknowledge tab ditampilkan');
    }
}

// Fungsi untuk menyembunyikan tab acknowledge
function hideAcknowledgeTab() {
    const acknowledgeTab = document.getElementById('acknowledgeTab');
    if (acknowledgeTab) {
        acknowledgeTab.style.display = 'none';
        console.log('Acknowledge tab disembunyikan');
    }
}

// Fungsi untuk toggle tab acknowledge
function toggleAcknowledgeTab() {
    const acknowledgeTab = document.getElementById('acknowledgeTab');
    if (acknowledgeTab) {
        if (acknowledgeTab.style.display === 'none' || acknowledgeTab.style.display === '') {
            showAcknowledgeTab();
        } else {
            hideAcknowledgeTab();
        }
    }
}

// Fungsi untuk menampilkan tab approve
function showApproveTab() {
    const approveTab = document.getElementById('approveTab');
    if (approveTab) {
        approveTab.style.display = 'block';
        console.log('Approve tab ditampilkan');
    }
}

// Fungsi untuk menyembunyikan tab approve
function hideApproveTab() {
    const approveTab = document.getElementById('approveTab');
    if (approveTab) {
        approveTab.style.display = 'none';
        console.log('Approve tab disembunyikan');
    }
}

// Fungsi untuk toggle tab approve
function toggleApproveTab() {
    const approveTab = document.getElementById('approveTab');
    if (approveTab) {
        if (approveTab.style.display === 'none' || approveTab.style.display === '') {
            showApproveTab();
        } else {
            hideApproveTab();
        }
    }
}

// Fungsi untuk menampilkan tab receive
function showReceiveTab() {
    const receiveTab = document.getElementById('receiveTab');
    if (receiveTab) {
        receiveTab.style.display = 'block';
        console.log('Receive tab ditampilkan');
    }
}

// Fungsi untuk menyembunyikan tab receive
function hideReceiveTab() {
    const receiveTab = document.getElementById('receiveTab');
    if (receiveTab) {
        receiveTab.style.display = 'none';
        console.log('Receive tab disembunyikan');
    }
}

// Fungsi untuk toggle tab receive
function toggleReceiveTab() {
    const receiveTab = document.getElementById('receiveTab');
    if (receiveTab) {
        if (receiveTab.style.display === 'none' || receiveTab.style.display === '') {
            showReceiveTab();
        } else {
            hideReceiveTab();
        }
    }
}

// Fungsi untuk menampilkan tab revision
function showRevisionTab() {
    const revisionTab = document.getElementById('revisionTab');
    if (revisionTab) {
        revisionTab.style.display = 'block';
        console.log('Revision tab ditampilkan');
    }
}

// Fungsi untuk menyembunyikan tab revision
function hideRevisionTab() {
    const revisionTab = document.getElementById('revisionTab');
    if (revisionTab) {
        revisionTab.style.display = 'none';
        console.log('Revision tab disembunyikan');
    }
}

// Fungsi untuk toggle tab revision
function toggleRevisionTab() {
    const revisionTab = document.getElementById('revisionTab');
    if (revisionTab) {
        if (revisionTab.style.display === 'none' || revisionTab.style.display === '') {
            showRevisionTab();
        } else {
            hideRevisionTab();
        }
    }
}

// Fungsi untuk menampilkan semua tab (untuk debugging)
function showAllTabs() {
    showCheckedTab();
    showAcknowledgeTab();
    showApproveTab();
    showReceiveTab();
    showRevisionTab();
    console.log('Semua tab ditampilkan');
}

// Fungsi untuk menyembunyikan semua tab
function hideAllTabs() {
    hideCheckedTab();
    hideAcknowledgeTab();
    hideApproveTab();
    hideReceiveTab();
    hideRevisionTab();
    console.log('Semua tab disembunyikan');
}

// ==================== REIMBURSEMENT TAB CONTROL FUNCTIONS ====================

// Fungsi untuk menampilkan tab reim checked
function showReimCheckedTab() {
    const tab = document.getElementById('reimCheckedTab');
    if (tab) {
        tab.style.display = 'block';
        console.log('Reim checked tab ditampilkan');
    }
}

// Fungsi untuk menyembunyikan tab reim checked
function hideReimCheckedTab() {
    const tab = document.getElementById('reimCheckedTab');
    if (tab) {
        tab.style.display = 'none';
        console.log('Reim checked tab disembunyikan');
    }
}

// Fungsi untuk toggle tab reim checked
function toggleReimCheckedTab() {
    const tab = document.getElementById('reimCheckedTab');
    if (tab) {
        if (tab.style.display === 'none' || tab.style.display === '') {
            showReimCheckedTab();
        } else {
            hideReimCheckedTab();
        }
    }
}

// Fungsi untuk menampilkan tab reim acknowledge
function showReimAcknowledgeTab() {
    const tab = document.getElementById('reimAcknowledgeTab');
    if (tab) {
        tab.style.display = 'block';
        console.log('Reim acknowledge tab ditampilkan');
    }
}

// Fungsi untuk menyembunyikan tab reim acknowledge
function hideReimAcknowledgeTab() {
    const tab = document.getElementById('reimAcknowledgeTab');
    if (tab) {
        tab.style.display = 'none';
        console.log('Reim acknowledge tab disembunyikan');
    }
}

// Fungsi untuk toggle tab reim acknowledge
function toggleReimAcknowledgeTab() {
    const tab = document.getElementById('reimAcknowledgeTab');
    if (tab) {
        if (tab.style.display === 'none' || tab.style.display === '') {
            showReimAcknowledgeTab();
        } else {
            hideReimAcknowledgeTab();
        }
    }
}

// Fungsi untuk menampilkan tab reim approve
function showReimApproveTab() {
    const tab = document.getElementById('reimApproveTab');
    if (tab) {
        tab.style.display = 'block';
        console.log('Reim approve tab ditampilkan');
    }
}

// Fungsi untuk menyembunyikan tab reim approve
function hideReimApproveTab() {
    const tab = document.getElementById('reimApproveTab');
    if (tab) {
        tab.style.display = 'none';
        console.log('Reim approve tab disembunyikan');
    }
}

// Fungsi untuk toggle tab reim approve
function toggleReimApproveTab() {
    const tab = document.getElementById('reimApproveTab');
    if (tab) {
        if (tab.style.display === 'none' || tab.style.display === '') {
            showReimApproveTab();
        } else {
            hideReimApproveTab();
        }
    }
}

// Fungsi untuk menampilkan tab reim receive
function showReimReceiveTab() {
    const tab = document.getElementById('reimReceiveTab');
    if (tab) {
        tab.style.display = 'block';
        console.log('Reim receive tab ditampilkan');
    }
}

// Fungsi untuk menyembunyikan tab reim receive
function hideReimReceiveTab() {
    const tab = document.getElementById('reimReceiveTab');
    if (tab) {
        tab.style.display = 'none';
        console.log('Reim receive tab disembunyikan');
    }
}

// Fungsi untuk toggle tab reim receive
function toggleReimReceiveTab() {
    const tab = document.getElementById('reimReceiveTab');
    if (tab) {
        if (tab.style.display === 'none' || tab.style.display === '') {
            showReimReceiveTab();
        } else {
            hideReimReceiveTab();
        }
    }
}

// Fungsi untuk menampilkan tab reim revision
function showReimRevisionTab() {
    const tab = document.getElementById('reimRevisionTab');
    if (tab) {
        tab.style.display = 'block';
        console.log('Reim revision tab ditampilkan');
    }
}

// Fungsi untuk menyembunyikan tab reim revision
function hideReimRevisionTab() {
    const tab = document.getElementById('reimRevisionTab');
    if (tab) {
        tab.style.display = 'none';
        console.log('Reim revision tab disembunyikan');
    }
}

// Fungsi untuk toggle tab reim revision
function toggleReimRevisionTab() {
    const tab = document.getElementById('reimRevisionTab');
    if (tab) {
        if (tab.style.display === 'none' || tab.style.display === '') {
            showReimRevisionTab();
        } else {
            hideReimRevisionTab();
        }
    }
}

// Fungsi untuk menampilkan semua tab reim
function showAllReimTabs() {
    showReimCheckedTab();
    showReimAcknowledgeTab();
    showReimApproveTab();
    showReimReceiveTab();
    showReimRevisionTab();
    console.log('Semua tab reim ditampilkan');
}

// Fungsi untuk menyembunyikan semua tab reim
function hideAllReimTabs() {
    hideReimCheckedTab();
    hideReimAcknowledgeTab();
    hideReimApproveTab();
    hideReimReceiveTab();
    hideReimRevisionTab();
    console.log('Semua tab reim disembunyikan');
}

// ==================== FITUR NOTIFIKASI ====================

// Variabel untuk notifikasi
let notifiedPRs = new Set();
let notificationContainer = null;
let isNotificationVisible = false;

// Fungsi untuk update badge notifikasi
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    const count = notifiedPRs.size;
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.textContent = '0';
        badge.classList.add('hidden');
    }
}

// Fungsi untuk toggle panel notifikasi
function toggleNotificationPanel() {
    if (!notificationContainer) {
        createNotificationPanel();
    }
    
    if (isNotificationVisible) {
        hideNotificationPanel();
    } else {
        showNotificationPanel();
    }
}

// Fungsi untuk membuat panel notifikasi
function createNotificationPanel() {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.position = 'fixed';
    notificationContainer.style.top = '70px';
    notificationContainer.style.right = '20px';
    notificationContainer.style.zIndex = '9999';
    notificationContainer.style.maxWidth = '350px';
    notificationContainer.style.maxHeight = '400px';
    notificationContainer.style.overflowY = 'auto';
    notificationContainer.style.backgroundColor = 'white';
    notificationContainer.style.borderRadius = '8px';
    notificationContainer.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    notificationContainer.style.border = '1px solid #e5e7eb';
    notificationContainer.style.display = 'none';
    document.body.appendChild(notificationContainer);
}

// Fungsi untuk menampilkan panel notifikasi
function showNotificationPanel() {
    if (!notificationContainer) return;
    
    // Update konten notifikasi
    updateNotificationContent();
    
    notificationContainer.style.display = 'block';
    isNotificationVisible = true;
}

// Fungsi untuk menyembunyikan panel notifikasi
function hideNotificationPanel() {
    if (!notificationContainer) return;
    notificationContainer.style.display = 'none';
    isNotificationVisible = false;
}

// Fungsi untuk update konten notifikasi
function updateNotificationContent() {
    if (!notificationContainer) return;
    
    if (notifiedPRs.size === 0) {
        notificationContainer.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <i class="fas fa-bell-slash text-2xl mb-2"></i>
                <p>No notifications</p>
            </div>
        `;
        return;
    }
    
    let content = `
        <div class="p-3 border-b border-gray-200 bg-gray-50">
            <h3 class="font-semibold text-gray-800">Approval Notifications (${notifiedPRs.size})</h3>
        </div>
        <div class="max-h-80 overflow-y-auto">
    `;
    
    // Ambil data notifikasi dari localStorage
    const notificationData = JSON.parse(localStorage.getItem('dashboardNotificationData') || '{}');
    
    notifiedPRs.forEach(prNumber => {
        const data = notificationData[prNumber] || {};
        const submissionDate = data.submissionDate ? new Date(data.submissionDate).toLocaleDateString() : '-';
        const status = data.status || 'Unknown';
        const role = data.role || 'Unknown';
        
        content += `
            <div class="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900">${data.purchaseRequestNo || prNumber}</div>
                        <div class="text-xs text-gray-600 mt-1">${data.requesterName || 'Unknown'} - ${data.departmentName || 'Unknown'}</div>
                        <div class="text-xs text-gray-500 mt-1">Submitted: ${submissionDate}</div>
                        <div class="text-xs text-gray-500 mt-1">Role: ${role}</div>
                        <div class="inline-block mt-1">
                            <span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">${status}</span>
                        </div>
                    </div>
                    <button onclick="removeNotification('${prNumber}')" class="ml-2 text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    content += '</div>';
    notificationContainer.innerHTML = content;
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, prNumber, role) {
    // Simpan data notifikasi ke localStorage
    const notificationData = JSON.parse(localStorage.getItem('dashboardNotificationData') || '{}');
    const data = {
        purchaseRequestNo: prNumber,
        requesterName: message.split('-')[1] || 'Unknown',
        departmentName: message.split('-')[2] || 'Unknown',
        submissionDate: message.split('-')[3] || '-',
        status: message.split('-')[4] || 'Prepared',
        role: role
    };
    notificationData[prNumber] = data;
    localStorage.setItem('dashboardNotificationData', JSON.stringify(notificationData));
    
    notifiedPRs.add(prNumber);
    updateNotificationBadge();
    
    // Update panel jika sedang terbuka
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

// Fungsi untuk menghapus notifikasi
function removeNotification(prNumber) {
    // Hapus dari localStorage
    const notificationData = JSON.parse(localStorage.getItem('dashboardNotificationData') || '{}');
    delete notificationData[prNumber];
    localStorage.setItem('dashboardNotificationData', JSON.stringify(notificationData));
    
    notifiedPRs.delete(prNumber);
    updateNotificationBadge();
    
    // Update panel jika sedang terbuka
    if (isNotificationVisible && notificationContainer) {
        updateNotificationContent();
    }
}

// Fungsi untuk polling dokumen yang perlu di-check
async function pollCheckedDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const response = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        const docs = data.data || [];
        let newPRFound = false;
        
        docs.forEach(doc => {
            if (!notifiedPRs.has(doc.purchaseRequestNo)) {
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.purchaseRequestNo}-${doc.requesterName}-${doc.departmentName}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.purchaseRequestNo, 'Checker');
                newPRFound = true;
            }
        });
        
        if (newPRFound) {
            playNotificationSound();
        }
    } catch (e) {
        console.warn('Error polling checked docs:', e);
    }
}

// Fungsi untuk polling dokumen yang perlu di-acknowledge
async function pollAcknowledgeDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const response = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=acknowledged&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        const docs = data.data || [];
        let newPRFound = false;
        
        docs.forEach(doc => {
            if (!notifiedPRs.has(doc.purchaseRequestNo)) {
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.purchaseRequestNo}-${doc.requesterName}-${doc.departmentName}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.purchaseRequestNo, 'Acknowledger');
                newPRFound = true;
            }
        });
        
        if (newPRFound) {
            playNotificationSound();
        }
    } catch (e) {
        console.warn('Error polling acknowledge docs:', e);
    }
}

// Fungsi untuk polling dokumen yang perlu di-approve
async function pollApproveDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const response = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=approved&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        const docs = data.data || [];
        let newPRFound = false;
        
        docs.forEach(doc => {
            if (!notifiedPRs.has(doc.purchaseRequestNo)) {
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.purchaseRequestNo}-${doc.requesterName}-${doc.departmentName}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.purchaseRequestNo, 'Approver');
                newPRFound = true;
            }
        });
        
        if (newPRFound) {
            playNotificationSound();
        }
    } catch (e) {
        console.warn('Error polling approve docs:', e);
    }
}

// Fungsi untuk polling dokumen yang perlu di-receive
async function pollReceiveDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const response = await fetch(`${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=false`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        const docs = data.data || [];
        let newPRFound = false;
        
        docs.forEach(doc => {
            if (!notifiedPRs.has(doc.purchaseRequestNo)) {
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.purchaseRequestNo}-${doc.requesterName}-${doc.departmentName}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.purchaseRequestNo, 'Receiver');
                newPRFound = true;
            }
        });
        
        if (newPRFound) {
            playNotificationSound();
        }
    } catch (e) {
        console.warn('Error polling receive docs:', e);
    }
}

// Fungsi untuk polling dokumen yang perlu direvisi
async function pollRevisionDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const response = await fetch(`${BASE_URL}/api/pr/dashboard/revision?filterType=revision&userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        const docs = data.data || [];
        let newPRFound = false;
        
        docs.forEach(doc => {
            if (!notifiedPRs.has(doc.purchaseRequestNo)) {
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.purchaseRequestNo}-${doc.requesterName}-${doc.departmentName}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.purchaseRequestNo, 'Revisor');
                newPRFound = true;
            }
        });
        
        if (newPRFound) {
            playNotificationSound();
        }
    } catch (e) {
        console.warn('Error polling revision docs:', e);
    }
}

// Fungsi untuk memainkan suara notifikasi
function playNotificationSound() {
    try {
        // Only play if user has interacted with the page
        if (document.hasInteracted) {
            const audio = new Audio('../components/shared/tones.mp3');
            audio.volume = 0.5; // Set volume to 50%
            audio.play().then(() => {
                console.log('Notification sound played successfully');
            }).catch(e => {
                console.warn('Failed to play notification sound:', e);
            });
        } else {
            console.log('User has not interacted with page yet, cannot play audio');
        }
    } catch (e) {
        console.warn('Failed to play notification sound:', e);
    }
}

// Fungsi untuk membersihkan notifikasi yang sudah diproses
async function cleanupProcessedNotifications() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        // Check semua status untuk menghapus notifikasi yang sudah diproses
        const checks = [
            { role: 'checked', endpoint: `${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=checked&isApproved=true` },
            { role: 'acknowledge', endpoint: `${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=acknowledged&isApproved=true` },
            { role: 'approve', endpoint: `${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=approved&isApproved=true` },
            { role: 'receive', endpoint: `${BASE_URL}/api/pr/dashboard/approval?ApproverId=${userId}&ApproverRole=received&isApproved=true` },
            { role: 'revision', endpoint: `${BASE_URL}/api/pr/dashboard/revision?filterType=prepared&userId=${userId}` }
        ];
        
        for (const check of checks) {
            try {
                const data = await safeApiCall(check.endpoint);
                const processedPRs = new Set((data?.data || []).map(doc => doc.purchaseRequestNo));
                
                // Hapus notifikasi untuk PR yang sudah diproses
                notifiedPRs.forEach(prNumber => {
                    if (processedPRs.has(prNumber)) {
                        removeNotification(prNumber);
                    }
                });
            } catch (e) {
                console.warn(`Error checking ${check.role} processed docs:`, e);
            }
        }
        
        // Check Reimbursement yang sudah diproses
        const reimChecks = [
            { role: 'reim-checked', endpoint: `${BASE_URL}/api/reimbursements/checker/${userId}/checked` },
            { role: 'reim-acknowledge', endpoint: `${BASE_URL}/api/reimbursements/acknowledger/${userId}/acknowledged` },
            { role: 'reim-approve', endpoint: `${BASE_URL}/api/reimbursements/approver/${userId}/approved` },
            { role: 'reim-receive', endpoint: `${BASE_URL}/api/reimbursements/receiver/${userId}/received` },
            { role: 'reim-revision', endpoint: `${BASE_URL}/api/reimbursements/revisor/${userId}/revision` }
        ];
        
        for (const check of reimChecks) {
            try {
                const data = await safeApiCall(check.endpoint);
                const processedReims = new Set((data?.data || []).map(doc => doc.voucherNo));
                
                // Hapus notifikasi untuk Reimbursement yang sudah diproses
                notifiedPRs.forEach(reimNumber => {
                    if (processedReims.has(reimNumber)) {
                        removeNotification(reimNumber);
                    }
                });
            } catch (e) {
                console.warn(`Error checking ${check.role} processed docs:`, e);
            }
        }
    } catch (e) {
        console.warn('Error cleaning up notifications:', e);
    }
}

// Fungsi untuk inisialisasi notifikasi approval
function initApprovalNotifications() {
    console.log('Initializing approval notifications...');
    
    // Jalankan polling pertama kali
    pollCheckedDocs();
    pollAcknowledgeDocs();
    pollApproveDocs();
    pollReceiveDocs();
    pollRevisionDocs();
    
    // Polling Reimbursement
    pollReimCheckedDocs();
    pollReimAcknowledgeDocs();
    pollReimApproveDocs();
    pollReimReceiveDocs();
    pollReimRevisionDocs();
    
    cleanupProcessedNotifications();
    updateNotificationBadge();
    
    // Set interval untuk polling (setiap 10 detik)
    setInterval(() => {
        pollCheckedDocs();
        pollAcknowledgeDocs();
        pollApproveDocs();
        pollReceiveDocs();
        pollRevisionDocs();
        
        // Polling Reimbursement
        pollReimCheckedDocs();
        pollReimAcknowledgeDocs();
        pollReimApproveDocs();
        pollReimReceiveDocs();
        pollReimRevisionDocs();
        
        cleanupProcessedNotifications();
    }, 10000);
    
    // Event click pada bell untuk toggle notifikasi panel
    const bell = document.getElementById('notificationBell');
    if (bell) {
        bell.addEventListener('click', function() {
            toggleNotificationPanel();
        });
    }
    
    // Tutup panel jika klik di luar
    document.addEventListener('click', function(event) {
        if (notificationContainer && !notificationContainer.contains(event.target) && !bell.contains(event.target)) {
            hideNotificationPanel();
        }
    });
    
    // Track user interaction untuk audio playback
    document.addEventListener('click', function() {
        document.hasInteracted = true;
    });
    
    document.addEventListener('keydown', function() {
        document.hasInteracted = true;
    });
    
    console.log('Approval notifications initialized successfully');
}

// Fungsi untuk menghitung jumlah dokumen untuk dashboard
// Fungsi ini tidak lagi digunakan karena digantikan oleh loadDashboard() dengan multiple API calls
function updateDashboardCounts(documents) {
    try {
        // Filter dokumen berdasarkan status "Prepared" untuk setiap jenis dokumen
        const prDocs = documents.filter(doc => doc.docType === "Purchase Request" && doc.status === "Prepared").length;
        const reimDocs = documents.filter(doc => doc.docType === "Reimbursement" && doc.status === "Prepared").length;
        const cashDocs = documents.filter(doc => doc.docType === "Cash Advance" && doc.status === "Prepared").length;
        const settleDocs = documents.filter(doc => doc.docType === "Settlement" && doc.status === "Prepared").length;
        
        // Update nilai di dashboard
        safeSetTextContent("totalDocs", prDocs);
        safeSetTextContent("openDocs", reimDocs);
        safeSetTextContent("preparedDocs", cashDocs);
        safeSetTextContent("checkedDocs", settleDocs);
        
        console.log("Dashboard dokumen diperbarui:", {
            "Purchase Request": prDocs,
            "Reimbursement": reimDocs,
            "Cash Advance": cashDocs,
            "Settlement": settleDocs
        });
    } catch (error) {
        console.error("Error saat memperbarui dashboard:", error);
    }
}



function formatDate(date) {
    // Format tanggal dalam Bahasa Indonesia
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };
    
    try {
        // Coba gunakan format Indonesia
        return date.toLocaleDateString('id-ID', options);
    } catch (error) {
        // Fallback jika locale id-ID tidak didukung
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
}

function setupNotificationEvents() {
    // Toggle dropdown when notification button is clicked
    document.getElementById("notificationBtn").addEventListener("click", function(e) {
        e.stopPropagation();
        const dropdown = document.getElementById("notificationDropdown");
        
        if (dropdown.classList.contains("hidden")) {
            // Show dropdown with animation
            dropdown.classList.remove("hidden");
            setTimeout(() => {
                dropdown.classList.remove("scale-95", "opacity-0");
                dropdown.classList.add("scale-100", "opacity-100");
            }, 10);
        } else {
            // Hide dropdown with animation
            dropdown.classList.remove("scale-100", "opacity-100");
            dropdown.classList.add("scale-95", "opacity-0");
            setTimeout(() => {
                dropdown.classList.add("hidden");
            }, 300);
        }
    });
    
    // Close dropdown when clicking outside
    window.addEventListener("click", function(e) {
        const dropdown = document.getElementById("notificationDropdown");
        const btn = document.getElementById("notificationBtn");
        
        if (!dropdown.classList.contains("hidden") && !btn.contains(e.target) && !dropdown.contains(e.target)) {
            // Hide with animation
            dropdown.classList.remove("scale-100", "opacity-100");
            dropdown.classList.add("scale-95", "opacity-0");
            setTimeout(() => {
                dropdown.classList.add("hidden");
            }, 300);
        }
    });
    
    // Apply filters when button is clicked
    document.getElementById("apply-filters").addEventListener("click", function() {
        applyFilters();
    });

    // Mark all as read
    document.getElementById("mark-all-read").addEventListener("click", function() {
        markAllNotificationsAsRead();
    });
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
    try {
        const unreadNotifications = window.allNotifications.filter(n => !n.isRead);
        
        // Mark all unread notifications as read
        for (const notification of unreadNotifications) {
            await markNotificationAsRead(notification.id);
        }
        
        // Update UI
        const notificationItems = document.querySelectorAll('.notification-item.bg-blue-50');
        notificationItems.forEach(item => {
            item.classList.remove('bg-blue-50');
            item.classList.add('opacity-75');
            const unreadDot = item.querySelector('.w-2.h-2.bg-blue-500');
            if (unreadDot) {
                unreadDot.remove();
            }
        });
        
        // Update badge
        updateNotificationBadge();
        
        console.log("All notifications marked as read");
        
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
    }
}

function renderNotifications(notifications) {
    const notificationList = document.getElementById("notification-list");
    notificationList.innerHTML = '';
    
    const displayNotifications = notifications.slice(0, 5);
    
    if (displayNotifications.length === 0) {
        notificationList.innerHTML = `
            <li class="px-4 py-6 text-center text-gray-500">
                <i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i>
                <p>Tidak ada dokumen yang memerlukan approval</p>
            </li>
        `;
        return;
    }
    
    displayNotifications.forEach(notification => {
        const li = document.createElement('li');
        li.className = `notification-item px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0 ${notification.isRead ? 'opacity-75' : 'bg-blue-50'}`;
        li.setAttribute('data-notification-id', notification.id);
        
        // Determine icon and colors
        let iconClass, bgColorClass, statusBadgeClass;
        
        switch(notification.docType) {
            case 'Purchase Request':
                iconClass = 'fas fa-file-invoice-dollar text-blue-500';
                bgColorClass = 'bg-blue-100';
                statusBadgeClass = 'bg-blue-200 text-blue-800';
                break;
            case 'Reimbursement':
                iconClass = 'fas fa-hand-holding-usd text-green-500';
                bgColorClass = 'bg-green-100';
                statusBadgeClass = 'bg-green-200 text-green-800';
                break;
            case 'Cash Advance':
                iconClass = 'fas fa-wallet text-purple-500';
                bgColorClass = 'bg-purple-100';
                statusBadgeClass = 'bg-purple-200 text-purple-800';
                break;
            case 'Settlement':
                iconClass = 'fas fa-balance-scale text-orange-500';
                bgColorClass = 'bg-orange-100';
                statusBadgeClass = 'bg-orange-200 text-orange-800';
                break;
            default:
                iconClass = 'fas fa-file text-gray-500';
                bgColorClass = 'bg-gray-100';
                statusBadgeClass = 'bg-gray-200 text-gray-800';
        }
        
        li.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0 pt-1">
                    <span class="h-8 w-8 rounded-full ${bgColorClass} flex items-center justify-center">
                        <i class="${iconClass}"></i>
                    </span>
                </div>
                <div class="ml-3 flex-1">
                    <div class="flex items-center justify-between">
                        <div class="font-semibold">${notification.docNumber}</div>
                        <span class="px-2 py-1 text-xs rounded-full ${statusBadgeClass}">${notification.approvalLevel}</span>
                    </div>
                    <div class="text-xs text-gray-700">
                        <strong>${notification.requesterName}</strong> - ${notification.department}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">${formatDate(new Date(notification.submissionDate))}</div>
                    ${!notification.isRead ? '<div class="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>' : ''}
                </div>
            </div>
        `;
        
        // Add click event
        li.addEventListener('click', () => {
            markNotificationAsRead(notification.id);
            redirectToApprovalPage(notification);
        });
        
        notificationList.appendChild(li);
    });
    
    // Update badge count
    const unreadCount = notifications.filter(n => !n.isRead).length;
    updateNotificationCount(unreadCount);
}

function applyFilters() {
    const dateFrom = document.getElementById("filter-date-from").value;
    const dateTo = document.getElementById("filter-date-to").value;
    const docType = document.getElementById("filter-doc-type").value;
    const docStatus = document.getElementById("filter-doc-status").value;
    
    let filteredNotifications = window.allNotifications;
    
    // Filter berdasarkan rentang tanggal
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredNotifications = filteredNotifications.filter(notification => 
            notification.date >= fromDate
        );
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Akhir dari hari yang dipilih
        filteredNotifications = filteredNotifications.filter(notification => 
            notification.date <= toDate
        );
    }
    
    // Filter berdasarkan jenis dokumen
    if (docType) {
        filteredNotifications = filteredNotifications.filter(notification => 
            notification.docType === docType
        );
    }
    
    // Filter berdasarkan status dokumen
    if (docStatus) {
        filteredNotifications = filteredNotifications.filter(notification => 
            notification.status === docStatus
        );
    }
    
    // Render notifikasi yang telah difilter
    renderNotifications(filteredNotifications);
}

function updateNotificationCount(count) {
    document.getElementById("notification-count").textContent = `${count} dokumen`;
    
    // Update badge pada tombol notifikasi
    const badge = document.querySelector("#notificationBtn .notification-badge");
    if (badge) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function safeSetTextContent(id, value) {
    let el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}

function goToProfile() {
    window.location.href = "Profil.html";
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("-translate-x-full");
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// ==================== REIMBURSEMENT NOTIFICATION POLLING ====================

// Fungsi untuk polling dokumen Reimbursement yang perlu di-check
async function pollReimCheckedDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const response = await fetch(`${BASE_URL}/api/reimbursements/checker/${userId}/prepared`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        const docs = data.data || [];
        let newReimFound = false;
        
        docs.forEach(doc => {
            if (!notifiedPRs.has(doc.voucherNo)) {
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.voucherNo}-${doc.requesterName}-${doc.department}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.voucherNo, 'Reim Checker');
                newReimFound = true;
            }
        });
        
        if (newReimFound) {
            playNotificationSound();
        }
    } catch (e) {
        console.warn('Error polling reim checked docs:', e);
    }
}

// Fungsi untuk polling dokumen Reimbursement yang perlu di-acknowledge
async function pollReimAcknowledgeDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const response = await fetch(`${BASE_URL}/api/reimbursements/acknowledger/${userId}/checked`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        const docs = data.data || [];
        let newReimFound = false;
        
        docs.forEach(doc => {
            if (!notifiedPRs.has(doc.voucherNo)) {
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.voucherNo}-${doc.requesterName}-${doc.department}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.voucherNo, 'Reim Acknowledger');
                newReimFound = true;
            }
        });
        
        if (newReimFound) {
            playNotificationSound();
        }
    } catch (e) {
        console.warn('Error polling reim acknowledge docs:', e);
    }
}

// Fungsi untuk polling dokumen Reimbursement yang perlu di-approve
async function pollReimApproveDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const response = await fetch(`${BASE_URL}/api/reimbursements/approver/${userId}/acknowledged`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        const docs = data.data || [];
        let newReimFound = false;
        
        docs.forEach(doc => {
            if (!notifiedPRs.has(doc.voucherNo)) {
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.voucherNo}-${doc.requesterName}-${doc.department}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.voucherNo, 'Reim Approver');
                newReimFound = true;
            }
        });
        
        if (newReimFound) {
            playNotificationSound();
        }
    } catch (e) {
        console.warn('Error polling reim approve docs:', e);
    }
}

// Fungsi untuk polling dokumen Reimbursement yang perlu di-receive
async function pollReimReceiveDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const response = await fetch(`${BASE_URL}/api/reimbursements/receiver/${userId}/approved`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        const docs = data.data || [];
        let newReimFound = false;
        
        docs.forEach(doc => {
            if (!notifiedPRs.has(doc.voucherNo)) {
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.voucherNo}-${doc.requesterName}-${doc.department}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.voucherNo, 'Reim Receiver');
                newReimFound = true;
            }
        });
        
        if (newReimFound) {
            playNotificationSound();
        }
    } catch (e) {
        console.warn('Error polling reim receive docs:', e);
    }
}

// Fungsi untuk polling dokumen Reimbursement yang perlu direvisi
async function pollReimRevisionDocs() {
    try {
        const userId = getUserId();
        if (!userId) return;
        
        const data = await safeApiCall(`${BASE_URL}/api/reimbursements/revisor/${userId}/revision`);
        const docs = data?.data || [];
        let newReimFound = false;
        
        docs.forEach(doc => {
            if (!notifiedPRs.has(doc.voucherNo)) {
                const submissionDate = doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : '-';
                const message = `${doc.voucherNo}-${doc.requesterName}-${doc.department}-${submissionDate}-${doc.status}`;
                showNotification(message, doc.voucherNo, 'Reim Revisor');
                newReimFound = true;
            }
        });
        
        if (newReimFound) {
            playNotificationSound();
        }
    } catch (e) {
        console.warn('Error polling reim revision docs:', e);
    }
}

// Function to check and show/hide Outgoing Payment card based on user access
function checkOutgoingPaymentAccess() {
    console.log('=== Dashboard checkOutgoingPaymentAccess Start ===');
    
    // Find the Outgoing Payment card by looking for the card that contains "Outgoing Payment" text
    const cards = document.querySelectorAll('.stat-card');
    console.log('Total stat-cards found:', cards.length);
    
    let outgoingPaymentCard = null;
    
    cards.forEach((card, index) => {
        const title = card.querySelector('h3');
        console.log(`Card ${index} title:`, title ? title.textContent : 'No title');
        if (title && title.textContent.includes('Outgoing Payment')) {
            outgoingPaymentCard = card;
            console.log('Found Outgoing Payment card at index:', index);
        }
    });
    
    console.log('Outgoing Payment Card Element:', outgoingPaymentCard);
    
    if (outgoingPaymentCard) {
        const hasAccess = localStorage.getItem('hasOutgoingPaymentAccess');
        console.log('hasOutgoingPaymentAccess from localStorage:', hasAccess);
        
        if (hasAccess === 'true') {
            // User has access, show the card
            outgoingPaymentCard.style.display = 'block';
            console.log('Showing Outgoing Payment card');
        } else {
            // User doesn't have access, hide the card
            outgoingPaymentCard.style.display = 'none';
            console.log('Hiding Outgoing Payment card');
        }
    } else {
        console.log('Outgoing Payment card not found');
    }
    
    console.log('=== Dashboard checkOutgoingPaymentAccess End ===');
}