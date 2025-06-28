window.onload = function () {
    loadUserGreeting();
    // loadDashboardAvatar();
    loadDashboard();
    initNotifications();
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

// Notification System
function initNotifications() {
    // Coba ambil data dari API
    fetchNotifications()
        .then(notificationData => {
            // Simpan data secara global untuk filtering
            window.allNotifications = notificationData;
            
            // Render notifikasi
            renderNotifications(notificationData);
            
            // Update badge notifikasi
            updateNotificationCount(notificationData.length);
        })
        .catch(error => {
            console.error("Error mengambil data notifikasi:", error);
            // Fallback ke data dummy jika terjadi error
            const dummyData = generateDummyNotifications(15);
            window.allNotifications = dummyData;
            renderNotifications(dummyData);
            updateNotificationCount(dummyData.length);
        });
    
    // Setup event listeners
    setupNotificationEvents();
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
        
        const reimResponse = await fetch(`${BASE_URL}/api/reimbursement/dashboard?requesterId=${userId}`, {
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
        const reimData = reimResponse.ok ? await reimResponse.json() : { data: [] };
        const cashData = cashResponse.ok ? await cashResponse.json() : { data: [] };
        const settleData = settleResponse.ok ? await settleResponse.json() : { data: [] };

        // Hitung jumlah dokumen untuk setiap jenis
        const prCount = prData.data ? prData.data.length : 0;
        const reimCount = reimData.data ? reimData.data.length : 0;
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

function generateDummyNotifications(count) {
    const docTypes = ['Purchase Request', 'Reimbursement', 'Cash Advance', 'Settlement'];
    const statuses = ['Open', 'Checked', 'Acknowledge', 'Approved', 'Received', 'Prepared'];
    const notifications = [];
    
    for (let i = 1; i <= count; i++) {
        const docType = docTypes[Math.floor(Math.random() * docTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const docNumber = `DOC-${docType.substring(0, 2).toUpperCase()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}/${new Date().getFullYear()}`;
        
        // Random date within the last 30 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        notifications.push({
            id: i,
            docType: docType,
            docNumber: docNumber,
            status: status,
            date: date,
            dateFormatted: formatDate(date)
        });
    }
    
    // Sort by date, newest first
    return notifications.sort((a, b) => b.date - a.date);
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
}

function renderNotifications(notifications) {
    const notificationList = document.getElementById("notification-list");
    notificationList.innerHTML = '';
    
    // Hanya tampilkan 5 item pertama (atau semua jika kurang dari 5)
    const displayNotifications = notifications.slice(0, 5);
    
    if (displayNotifications.length === 0) {
        notificationList.innerHTML = `
            <li class="px-4 py-6 text-center text-gray-500">
                <i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i>
                <p>Tidak ada notifikasi yang sesuai dengan filter</p>
            </li>
        `;
        return;
    }
    
    displayNotifications.forEach(notification => {
        const li = document.createElement('li');
        li.className = 'notification-item px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0';
        
        // Tentukan ikon dan warna berdasarkan jenis dokumen
        let iconClass, bgColorClass;
        switch(notification.docType) {
            case 'Purchase Request':
                iconClass = 'fas fa-file-invoice-dollar text-blue-500';
                bgColorClass = 'bg-blue-100';
                break;
            case 'Reimbursement':
                iconClass = 'fas fa-hand-holding-usd text-green-500';
                bgColorClass = 'bg-green-100';
                break;
            case 'Cash Advance':
                iconClass = 'fas fa-wallet text-purple-500';
                bgColorClass = 'bg-purple-100';
                break;
            case 'Settlement':
                iconClass = 'fas fa-balance-scale text-orange-500';
                bgColorClass = 'bg-orange-100';
                break;
            default:
                iconClass = 'fas fa-file text-gray-500';
                bgColorClass = 'bg-gray-100';
        }
        
        // Badge status
        let statusBadgeClass;
        let statusText = notification.status;
        
        // Terjemahkan status ke Bahasa Indonesia jika perlu
        switch(notification.status) {
            case 'Open':
                statusBadgeClass = 'bg-gray-200 text-gray-800';
                statusText = 'Open';
                break;
            case 'Checked':
                statusBadgeClass = 'bg-blue-200 text-blue-800';
                statusText = 'Checked';
                break;
            case 'Acknowledge':
                statusBadgeClass = 'bg-purple-200 text-purple-800';
                statusText = 'Acknowledge';
                break;
            case 'Approved':
                statusBadgeClass = 'bg-green-200 text-green-800';
                statusText = 'Approved';
                break;
            case 'Received':
                statusBadgeClass = 'bg-orange-200 text-orange-800';
                statusText = 'Received';
                break;
            default:
                statusBadgeClass = 'bg-gray-200 text-gray-800';
        }
        
        // Terjemahkan jenis dokumen ke Bahasa Indonesia
        let docTypeText;
        switch(notification.docType) {
            case 'Purchase Request':
                docTypeText = 'Purchase Request';
                break;
            case 'Reimbursement':
                docTypeText = 'Reimbursement';
                break;
            case 'Cash Advance':
                docTypeText = 'Cash Advance';
                break;
            case 'Settlement':
                docTypeText = 'Settlement';
                break;
            default:
                docTypeText = notification.docType;
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
                        <div class="font-semibold">${docTypeText}</div>
                        <span class="px-2 py-1 text-xs rounded-full ${statusBadgeClass}">${statusText}</span>
                    </div>
                    <div class="text-xs text-gray-700">${notification.docNumber}</div>
                    <div class="text-xs text-gray-400 mt-1">${notification.dateFormatted}</div>
                </div>
            </div>
        `;
        
        notificationList.appendChild(li);
    });
    
    // Update jumlah di header
    updateNotificationCount(notifications.length);
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