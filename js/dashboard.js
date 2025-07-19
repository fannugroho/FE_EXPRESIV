window.onload = function () {
    loadUserGreeting();
    loadDashboard();
    initNotifications();
    initializeWebSocket();
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

// Real-time notification system
let notificationWebSocket = null;

function initializeWebSocket() {
    try {
        const userId = getUserId();
        if (!userId) {
            console.log("User ID not found, skipping WebSocket initialization");
            return;
        }

        // Initialize SignalR connection
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${BASE_URL}/notificationHub`)
            .withAutomaticReconnect()
            .build();

        connection.on("NewNotification", (notification) => {
            const receiveTime = new Date();
            console.log(`Received real-time notification at ${receiveTime.toISOString()}:`, notification);
            
            // Performance monitoring
            const startTime = performance.now();
            
            showToastNotification(notification);
            addNotificationToList(notification);
            updateNotificationBadge();
            
            const endTime = performance.now();
            console.log(`Frontend notification processing time: ${(endTime - startTime).toFixed(2)}ms`);
        });

        connection.start()
            .then(() => {
                console.log("SignalR connected successfully");
                notificationWebSocket = connection;
            })
            .catch(err => {
                console.error("SignalR connection failed:", err);
            });

    } catch (error) {
        console.error("Error initializing WebSocket:", error);
    }
}

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
                <div class="font-semibold text-sm">${notification.docNumber}</div>
                <div class="text-xs opacity-90 mt-1">${notification.requesterName} - ${notification.department}</div>
                <div class="text-xs opacity-75 mt-1">${notification.approvalLevel} approval required</div>
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

// Fetch approval notifications from API
async function fetchApprovalNotifications() {
    try {
        const userId = getUserId();
        if (!userId) {
            throw new Error("User ID tidak ditemukan");
        }
        
        const response = await fetch(`${BASE_URL}/api/notification/approval/${userId}`, {
            headers: { 
                'Authorization': `Bearer ${getAccessToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Data notifikasi approval berhasil diambil:", data);
        
        return data.data || [];
        
    } catch (error) {
        console.error("Error saat mengambil notifikasi approval:", error);
        throw error;
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
        const prResponse = await fetch(`${BASE_URL}/api/pr/dashboard?requesterId=${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        
        // Updated endpoint for reimbursements
        const reimResponse = await fetch(`${BASE_URL}/api/reimbursements/status-counts/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        
        const cashResponse = await fetch(`${BASE_URL}/api/cashadvance/dashboard?requesterId=${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        
        const settleResponse = await fetch(`${BASE_URL}/api/settlement/dashboard?requesterId=${userId}`, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        // Parse responses
        const prData = prResponse.ok ? await prResponse.json() : { data: [] };
        const reimData = reimResponse.ok ? await reimResponse.json() : { data: { totalCount: 0 } };
        const cashData = cashResponse.ok ? await cashResponse.json() : { data: [] };
        const settleData = settleResponse.ok ? await settleResponse.json() : { data: [] };

        // Hitung jumlah dokumen untuk setiap jenis
        const prCount = prData.data ? prData.data.length : 0;
        // Use totalCount from the new API response
        const reimCount = reimData.data ? reimData.data.totalCount : 0;
        const cashCount = cashData.data ? cashData.data.length : 0;
        const settleCount = settleData.data ? settleData.data.length : 0;
        
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